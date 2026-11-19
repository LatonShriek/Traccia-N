// Valutazione di una prova (hit/miss/FA/CR, scelta, categorizzazione, doppio compito) e adattamento del livello.
// SPOSTATE da index.html (passo 5e) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg e la seduta correnti.
// - pushAdaptOutcome, maybeAdapt, maybeAdaptDualChannel e resolve* ricevono cfg e session come parametri (resolve*: cfg, session, trial).
// - adaptLevelKey e sessionLevelBounds vengono da js/core/bands.js con la cfg passata.
import { ADAPT_BLOCK, adaptStep, adaptStepFine, creditByBucket } from '../core/adapt.js';
import { HALF_STEP_MODES } from '../core/levels.js';
import { DUAL_LEVEL_MAX, adaptLevelKey, sessionLevelBounds } from '../core/bands.js';

  // Titolazione adattiva sensibile a velocità+accuratezza, non solo
  // correttezza: una prova conta come "successo pieno" ai fini della
  // scala di livello solo se è corretta E il tempo di reazione non è
  // anomalo rispetto al proprio ritmo IN QUESTA STESSA SESSIONE (criterio
  // auto-riferito — non serve un campione normativo esterno, che non
  // abbiamo). Una risposta corretta ma molto più lenta della propria
  // mediana recente non spinge la scala verso l'alto come se fosse una
  // prestazione piena. Soglia (mediana × 1.6) dichiarata esplicitamente
  // come ipotesi di partenza, non un valore validato in letteratura per
  // questo scopo specifico — da rivedere se in pratica risulta troppo o
  // troppo poco permissiva. Richiede almeno 4 RT corretti già osservati in
  // questa sessione prima di applicare il filtro (altrimenti non c'è una
  // mediana personale affidabile da cui partire — le primissime prove
  // contano quindi solo sulla correttezza, come prima).
  // Restituisce la lunghezza di adaptBlock SUBITO DOPO il push (prima che
  // maybeAdapt() lo azzeri in caso di cambio livello) — serve ai chiamanti
  // che devono sapere se un reset è appena avvenuto (es. il gradiente
  // spaziale del TAPAT).
  export function pushAdaptOutcome(cfg, session, correct, rtMs){
    // 19 nov 2026: accuratezza E velocità in ogni prova (come Intruso, Griglie, Inversione). Il blocco contiene il
    // CREDITO = punteggio (1 giusta, 0 sbagliata) × fattore velocità (1 fino a 1,3 × la propria mediana, poi scende
    // a 0 a 2,1 ×; servono 4 tempi già osservati). Sostituisce il vecchio filtro sì/no «più lenta di 1,6 ×».
    session.rtB = session.rtB || {};
    const credit = Math.round(creditByBucket(session.rtB, 'g', correct ? 1 : 0, rtMs) * 100) / 100;
    session.adaptBlock.push(credit);
    const before = session.adaptBlock.length;
    maybeAdapt(cfg, session);
    return before;
  }
  export function maybeAdapt(cfg, session){
    if(!cfg.adaptive) return;
    const levelKey = adaptLevelKey(cfg);
    if(!levelKey) return;
    if(session.adaptBlock.length < ADAPT_BLOCK) return;
    const acc = session.adaptBlock.reduce((a, x) => a + (+x), 0) / session.adaptBlock.length; // media dei crediti (true/false valgono 1/0)
    const bounds = sessionLevelBounds(cfg);
    const half = levelKey==='adaptLevel' && HALF_STEP_MODES.includes(cfg.taskMode);
    let step;
    if(half){
      // mezzi gradini: si decide sugli ultimi 2 blocchi (16 prove) se stanno allo STESSO livello — con 8 prove l'errore standard è ≈0,14, con 16 ≈0,10
      const mean = b => b.reduce((a, x) => a + (+x), 0) / b.length;
      const prev = session.prevAdaptBlock && session.prevAdaptLevel === session[levelKey] ? session.prevAdaptBlock : null;
      const win = prev ? (mean(prev) + acc) / 2 : acc;
      step = adaptStepFine(win, session[levelKey], bounds.min, bounds.max);
      if(step){ session.prevAdaptBlock = null; }
      else { session.prevAdaptBlock = session.adaptBlock.slice(); session.prevAdaptLevel = session[levelKey]; }
    } else {
      step = adaptStep(acc, session[levelKey], bounds.min, bounds.max);
    }
    if(step){
      session[levelKey] += step;
      session.levelChanges.push({trialIdx:session.idx, level:session[levelKey], how:'auto'});
    }
    session.adaptBlock = [];
  }
  // nback, sequenza, gonogo, stopsignal: tutti sono "rispondi sì/no" con un
  // ground truth trial.isTarget — riusano lo stesso schema hit/miss/FA/CR.
  export function resolveSignal(cfg, session, trial){
    if(!trial.valid) return null;
    if(trial.isTarget) session.counts.targets++; else session.counts.nonTargets++;
    if(cfg.respMode==='manuale') return 'pend';
    const tapped = session.responses.size>0;
    let outcome, correct;
    if(trial.isTarget && tapped){ session.counts.hits++; outcome='hit'; correct=true; if(session.respTime) session.rts.push(session.respTime); }
    else if(trial.isTarget && !tapped){ session.counts.misses++; outcome='err'; correct=false; }
    else if(!trial.isTarget && tapped){ session.counts.falseAlarms++; outcome='err'; correct=false; }
    else { session.counts.correctRejections++; outcome='hit'; correct=true; }
    // Stop-Signal two-choice: sopra abbiamo già contato hit/miss/FA/CR sulla
    // sola presenza/assenza di risposta (inibizione — invariato, resta
    // confrontabile con lo storico pre-redesign). Qui aggiungiamo, solo per i
    // trial "go" con risposta data, un secondo giudizio ortogonale su QUALE
    // pulsante è stato toccato: sbagliare la discriminazione conta come
    // errore per il trail/l'affaticamento/l'adattività ISI (correct=false),
    // ma non tocca hit/FA/d′ — quella era la specifica dello staircase
    // SSD/inibizione ed è giusto restare separata.
    if(trial.isTarget && tapped && trial.correctAnswer!=null){
      const given = [...session.responses][0];
      const discCorrect = given===trial.correctAnswer;
      session.discrimLog.push(discCorrect);
      if(!discCorrect){ outcome='err'; correct=false; }
      // Interferenza spaziale (variante Stop-Signal+conflitto): traccia
      // correttezza/RT separatamente per prove congruenti/incongruenti,
      // stesso principio del Simon — solo sui trial "go" con risposta,
      // mai su quelli di stop (che restano gestiti a parte dallo
      // staircase SSD, invariato).
      if(trial.congruency) session.discrimCongLog.push({congruent: trial.congruency==='congruent', correct: discCorrect, rt: session.respTime||null});
    }
    session.fatigueLog.push(correct);
    if(cfg.taskMode==='nback' || cfg.taskMode==='sequenza' || cfg.taskMode==='gonogo'){
      pushAdaptOutcome(cfg, session, correct, session.respTime);
    }
    if(cfg.taskMode==='stopsignal' && !trial.isStopTrial){
      // leva secondaria (ISI generale), alimentata solo dalle prove "go" —
      // il successo sui trial di stop resta gestito a parte dallo staircase SSD
      pushAdaptOutcome(cfg, session, correct, session.respTime);
    }
    if(cfg.taskMode==='stopsignal' && trial.isStopTrial){
      // staircase: fermarsi con successo → SSD più lungo (più difficile);
      // fallire lo stop → SSD più corto (più facile)
      session.currentSSD = tapped
        ? Math.max(0, session.currentSSD - cfg.ssdStep)
        : Math.min(cfg.isi-100, session.currentSSD + cfg.ssdStep);
      session.ssdHistory.push(session.currentSSD);
    }
    return outcome;
  }
  // ANT / switching: scelta 2AFC, non ha senso hit/FA — traccia solo
  // corretto/scorretto + RT, per poi scomporre per condizione a fine sessione.
  export function resolveChoice(cfg, session, trial){
    if(cfg.respMode==='manuale') return 'pend';
    const given = [...session.responses][0] || null;
    const correct = given===trial.correctAnswer;
    session.choiceLog.push({
      correct, rt: correct ? session.respTime : null, omitted: given===null,
      isSwitch: !!trial.isSwitch, cueType: trial.cueType, congruency: trial.congruency, block: trial.block, side: trial.side
    });
    const isTapatSpatial = cfg.taskMode==='tapat' && cfg.tapatSpatial;
    if(isTapatSpatial){
      session.spatialBlock = session.spatialBlock || [];
      session.spatialBlock.push({side:trial.side, correct});
    }
    if(cfg.taskMode==='ant' || cfg.taskMode==='switching' || cfg.taskMode==='simon' || cfg.taskMode==='mantenimento' || cfg.taskMode==='tapat'){
      const before = pushAdaptOutcome(cfg, session, correct, session.respTime);
      // il blocco adattivo si è appena valutato e resettato (era arrivato a
      // 8): stesso momento buono per aggiornare il gradiente spaziale.
      if(isTapatSpatial && before>=8 && session.adaptBlock.length===0){
        const sb = session.spatialBlock;
        const left = sb.filter(x=>x.side==='left'), right = sb.filter(x=>x.side==='right');
        const pctLeft = left.length ? left.filter(x=>x.correct).length/left.length : 1;
        const pctRight = right.length ? right.filter(x=>x.correct).length/right.length : 1;
        const base = session.liveTapatGradient;
        let ng = base;
        if(pctLeft < pctRight - 0.15) ng = Math.min(75, base+5); // sinistra più debole -> più prove a sinistra
        else if(pctRight < pctLeft - 0.15) ng = Math.max(25, base-5);
        session.liveTapatGradient = ng;
        session.spatialBlock = [];
      }
    }
    return correct ? 'hit' : 'err';
  }
  // Categorizzazione condizionale: come resolveChoice, ma con un caso in
  // più — trial.correctAnswer può essere 'nogo' (L2: lettera rossa; L4:
  // categoria diversa dalla precedente), nel qual caso la risposta corretta
  // è NON toccare nulla. 'omitted' conta solo le mancate risposte vere
  // (dove serviva un tocco), non i corretti "non rispondere" — altrimenti
  // il conteggio "risposte omesse" nello storico sarebbe fuorviante per
  // questi livelli. Nessun adattamento automatico: il livello 1-5 si sceglie
  // a mano, come per la Cancellazione a regola.
  export function resolveCategorization(cfg, session, trial){
    if(!trial.valid) return null;
    if(cfg.respMode==='manuale') return 'pend';
    const given = [...session.responses][0] || null;
    const isNogo = trial.correctAnswer==='nogo';
    const correct = isNogo ? given===null : given===trial.correctAnswer;
    session.choiceLog.push({
      correct, rt: (correct && !isNogo) ? session.respTime : null,
      omitted: given===null && !isNogo
    });
    if(cfg.adaptive){ pushAdaptOutcome(cfg, session, correct, (correct && !isNogo) ? session.respTime : null); }
    return correct ? 'hit' : 'err';
  }
  export function resolveDualTask(cfg, session, trial){
    if(!trial.valid) return null;
    if(cfg.respMode==='manuale') return 'pend';
    if(trial.visualIsTarget) session.counts.targets++; else session.counts.nonTargets++;
    if(trial.audioIsTarget) session.countsAud.targets++; else session.countsAud.nonTargets++;
    const tapV = session.responses.has('vis'), tapA = session.responses.has('aud');
    let ok = true, ch1Correct, ch2Correct;
    if(trial.visualIsTarget && tapV){ session.counts.hits++; ch1Correct=true; }
    else if(trial.visualIsTarget && !tapV){ session.counts.misses++; ok=false; ch1Correct=false; }
    else if(!trial.visualIsTarget && tapV){ session.counts.falseAlarms++; ok=false; ch1Correct=false; }
    else { session.counts.correctRejections++; ch1Correct=true; }
    if(trial.audioIsTarget && tapA){ session.countsAud.hits++; ch2Correct=true; }
    else if(trial.audioIsTarget && !tapA){ session.countsAud.misses++; ok=false; ch2Correct=false; }
    else if(!trial.audioIsTarget && tapA){ session.countsAud.falseAlarms++; ok=false; ch2Correct=false; }
    else { session.countsAud.correctRejections++; ch2Correct=true; }
    // i due canali sono valutati e adattati in modo indipendente, non con
    // un'unica media che confonderebbe quale dei due sta davvero in difficoltà
    // 19 nov 2026: credito = giusta × velocità del PROPRIO canale (tempo del tocco vs propria mediana, per canale)
    session.rtB = session.rtB || {};
    const rtV = session.respTimes ? session.respTimes.vis : null, rtA = session.respTimes ? session.respTimes.aud : null;
    session.adaptBlock1.push(Math.round(creditByBucket(session.rtB, 'vis', ch1Correct ? 1 : 0, rtV != null ? rtV : null) * 100) / 100);
    maybeAdaptDualChannel(cfg, session, 1);
    session.adaptBlock2.push(Math.round(creditByBucket(session.rtB, 'aud', ch2Correct ? 1 : 0, rtA != null ? rtA : null) * 100) / 100);
    maybeAdaptDualChannel(cfg, session, 2);
    return ok ? 'hit' : 'err';
  }
  export function maybeAdaptDualChannel(cfg, session, channel){
    if(!cfg.adaptive) return;
    const blockKey = channel===1 ? 'adaptBlock1' : 'adaptBlock2';
    const levelKey = channel===1 ? 'dualLevel1' : 'dualLevel2';
    const block = session[blockKey];
    if(block.length < ADAPT_BLOCK) return;
    const acc = block.reduce((a, x) => a + (+x), 0) / block.length; // media dei crediti
    const step = adaptStep(acc, session[levelKey], 1, DUAL_LEVEL_MAX);
    if(step){
      session[levelKey] += step;
      session.levelChanges.push({trialIdx:session.idx, level:session[levelKey], how:'auto', canale:channel});
    }
    session[blockKey] = [];
  }
