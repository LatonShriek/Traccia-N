// Record di una seduta: punteggi per famiglia di esercizio (d', accuratezza, RT, EZ-diffusion, LISAS, SSRT, costo di switching,
// asimmetria Neglect, ...), nota di affaticamento e livello finale.
// SPOSTATO da index.html (passo 5i) senza modifiche al testo, con "export" davanti ai nomi usati altrove.
// Differenze dichiarate: buildSessionRecord(cfg, session, durationMs, ctx) è il corpo che in completeAndSaveInner
// costruiva `rec`; riceve cfg e session come parametri e da ctx {patientProfile, activeLocalPatientId,
// activeRemotePatientId, dateLabel}; `todayStr()` diventa ctx.dateLabel e `adaptLevelKey()` diventa adaptLevelKey(cfg).
// Salvataggio, screening e navigazione restano in completeAndSaveInner (index.html).
import { adaptLevelKey } from '../core/bands.js';
import { seqLabel } from '../core/pools.js';
import { computeEZDiffusion, computeLISAS } from '../core/scores.js';
import { mean, sd } from '../core/stats.js';
import { hasTitrationMode } from '../core/titration.js';
import { scoreGoalTask } from './goaltask.js';
import { memoriaEffectiveMateriale, memoriaLearnItems } from './memoria.js';
import { EXERCISES } from './registry.js';

  export function scoreFromCounts(c){
    const hitRate = c.targets>0 ? c.hits/c.targets : 0;
    const faRate = c.nonTargets>0 ? c.falseAlarms/c.nonTargets : 0;
    // log-linear correction for extreme rates (Hautus, 1995)
    const hr = (c.hits+0.5)/(c.targets+1);
    const fr = (c.falseAlarms+0.5)/(c.nonTargets+1);
    const z = p => -Math.sqrt(2)*erfinv(1-2*p);
    const dprime = c.targets>0 && c.nonTargets>0 ? (z(hr)-z(fr)) : null;
    const acc = (c.hits+c.correctRejections)/(c.targets+c.nonTargets || 1);
    return {hitRate, faRate, dprime, acc};
  }
  export function erfinv(x){
    const a = 0.147;
    const ln = Math.log(1-x*x);
    const t1 = 2/(Math.PI*a)+ln/2;
    return Math.sign(x)*Math.sqrt(Math.sqrt(t1*t1-ln/a)-t1);
  }
  // ---------- Indicatore di calo prestazionale intra-sessione (fatica) ----------
  // Puramente informativo per l'operatore: confronta l'accuratezza sul primo
  // terzo delle prove valide con quella sull'ultimo terzo. NON modifica in
  // alcun modo la difficoltà né chiude la sessione in automatico — è solo un
  // avviso in coda ai risultati. La soglia sotto è un parametro provvisorio
  // (non derivato da letteratura come le soglie Wilson et al. 2019 usate per
  // l'adattività): va validata/tarata nell'uso clinico reale, non è definitiva.
  export const FATIGUE_DROP_THRESHOLD = 0.15; // 15 punti percentuali di calo accuratezza primo→ultimo terzo
  export const FATIGUE_MIN_TRIALS = 9; // sotto questa soglia lo split in terzi non è abbastanza informativo
  export function computeFatigueNote(boolArray){
    const n = boolArray.length;
    if(n < FATIGUE_MIN_TRIALS) return null;
    const third = Math.floor(n/3);
    const first = boolArray.slice(0, third);
    const last = boolArray.slice(n-third);
    const accFirst = first.filter(Boolean).length/first.length;
    const accLast = last.filter(Boolean).length/last.length;
    const drop = accFirst - accLast;
    return {accFirst, accLast, drop, flag: drop >= FATIGUE_DROP_THRESHOLD};
  }
  export function rtMeanOf(items){
    const v = items.filter(x=>x!=null);
    return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null;
  }
  export function buildSessionRecord(cfg, session, durationMs, ctx){
    const { patientProfile, activeLocalPatientId, activeRemotePatientId, dateLabel } = ctx;
    const family = EXERCISES[cfg.taskMode].family;
    const rec = {
      id: Date.now()+'-'+Math.random().toString(36).slice(2,7),
      ts: Date.now(), dateLabel: dateLabel,
      stimType: cfg.stimType, nLevel: cfg.nLevel, trials: cfg.trials, isi: cfg.isi, stimDuration: cfg.stimDuration,
      // titrationMode/targetRate: servono al controllo di comparabilità
      // dell'RCI (vedi sessionMismatchWarnings) — prima non venivano
      // registrati per sessione, solo nell'ultima configurazione raggiunta,
      // quindi l'RCI non poteva sapere con cosa erano state generate le
      // sessioni che stava confrontando.
      titrationMode: hasTitrationMode(cfg.taskMode) ? (cfg.titrationMode||'manuale') : null,
      targetRate: cfg.targetRate,
      respMode: cfg.respMode, patientCode: cfg.patientCode, notes: cfg.notes,
      taskMode: cfg.taskMode, targetSeq: EXERCISES[cfg.taskMode].usesTargetSeq ? cfg.targetSeq.map(seqLabel) : null,
      sequenzaMista: (cfg.taskMode==='sequenza' && cfg.sequenzaMista && cfg.sequenzaMista!=='no') ? cfg.sequenzaMista : null,
      antMode: cfg.taskMode==='ant' ? 'classico' : null,
      tapatModalita: cfg.taskMode==='tapat' ? cfg.tapatModalita : null,
      // Livello raggiunto a fine sessione, in un unico campo generico —
      // prima esisteva solo per l'N-back (finalNLevel sotto): senza
      // questo, lo storico non poteva mostrare il livello per nessun
      // altro esercizio, perché il dato non veniva proprio registrato.
      finalLevel: (()=>{
        if(cfg.taskMode==='nback') return session.liveNLevel;
        if(cfg.taskMode==='categorizzazione') return session.categLevel;
        if(cfg.taskMode==='tapat') return session.tapatLevel;
        if(cfg.taskMode==='neglect') return session.liveBoardLevel;
        if(cfg.taskMode==='dualtask') return session.dualLevel1+'/'+session.dualLevel2;
        if(cfg.taskMode==='goaltask') return cfg.goaltaskLivello;
        if(cfg.taskMode==='memoria') return session.material ? session.material.livello : null;
        if(cfg.taskMode==='runningspan') return cfg.adaptStartLevel;
        if(adaptLevelKey(cfg)==='adaptLevel') return session.adaptLevel;
        return null;
      })(),
      localPatientId: patientProfile ? null : (activeLocalPatientId || null),
      pazienteId: (!patientProfile && activeRemotePatientId) ? activeRemotePatientId : null,
      durationMs, family
    };
    if(family==='signal'){
      const avgRT = rtMeanOf(session.rts);
      rec.counts = session.counts; rec.metrics = scoreFromCounts(session.counts); rec.avgRT = avgRT;
      // LISAS solo per N-back/Sequenza/Go-No-Go: Stop-Signal ha già un
      // indice proprio più adatto (SSRT, sotto) — aggiungere anche LISAS
      // lì sarebbe ridondante, non un'informazione in più.
      if(cfg.taskMode==='nback' || cfg.taskMode==='sequenza' || cfg.taskMode==='gonogo'){
        rec.metrics.lisas = computeLISAS(session.rts, session.fatigueLog);
      }
      rec.fatigueNote = computeFatigueNote(session.fatigueLog);
      if(cfg.taskMode==='stopsignal' && session.ssdHistory.length){
        const meanSSD = rtMeanOf(session.ssdHistory);
        rec.meanSSD = meanSSD;
        rec.ssrt = (avgRT!=null && meanSSD!=null) ? Math.max(0, avgRT-meanSSD) : null;
      }
      if(cfg.taskMode==='stopsignal' && session.discrimLog.length){
        rec.goAccuracy = session.discrimLog.filter(Boolean).length / session.discrimLog.length;
      }
      if(cfg.taskMode==='stopsignal' && session.discrimCongLog.length){
        // Stessa interpretazione/segno dell'indice di conflitto già usato
        // per ANT/Task-switching bivalente/Simon — qui però misurato
        // SOTTO il meccanismo Stop-Signal (2 scelte + stop occasionale),
        // non da solo: non sostituisce Simon, ne è il quarto gradino
        // della scala gerarchica Vigilanza/Inibizione.
        const congLog = session.discrimCongLog.filter(x=>x.congruent);
        const incongLog = session.discrimCongLog.filter(x=>!x.congruent);
        const congRT = rtMeanOf(congLog.filter(x=>x.correct).map(x=>x.rt));
        const incongRT = rtMeanOf(incongLog.filter(x=>x.correct).map(x=>x.rt));
        rec.conflict = (congRT!=null && incongRT!=null) ? Math.round(incongRT-congRT) : null;
        rec.congAccuracy = congLog.length ? congLog.filter(x=>x.correct).length/congLog.length : null;
        rec.incongAccuracy = incongLog.length ? incongLog.filter(x=>x.correct).length/incongLog.length : null;
      }
      if(cfg.taskMode==='nback'){
        rec.finalNLevel = session.liveNLevel;
        rec.adaptive = cfg.adaptive;
        rec.levelChanges = session.levelChanges.length ? session.levelChanges : null;
      }
    } else if(family==='choice'){
      const log = session.choiceLog;
      const total = log.length, correct = log.filter(x=>x.correct).length, omitted = log.filter(x=>x.omitted).length;
      rec.choice = { total, correct, omitted, accuracy: total? correct/total : null, meanRT: rtMeanOf(log.map(x=>x.rt)) };
      // EZ-diffusion sull'intera sonda (Wagenmakers, van der Maas & Grasman,
      // 2007) — copre ANT, TAPAT, Task-switching, Simon, Mantenimento,
      // Categorizzazione condizionale in un colpo solo, dato che condividono
      // questo stesso ramo. v (tasso di deriva) è pensato come l'indice
      // principale — la soglia (a) e il tempo non-decisionale (Ter) restano
      // salvati ma secondari. Richiede almeno 2 RT corretti per stimare la
      // varianza — con troppo poche prove valide torna null, non un errore.
      {
        const correctRTsMs = log.filter(x=>x.correct && x.rt!=null).map(x=>x.rt);
        const meanRTsec = correctRTsMs.length ? mean(correctRTsMs)/1000 : null;
        const varRTsec = correctRTsMs.length>1 ? Math.pow(sd(correctRTsMs)/1000, 2) : null;
        rec.choice.ezdiff = computeEZDiffusion(correct, total, meanRTsec, varRTsec);
        rec.choice.lisas = computeLISAS(correctRTsMs, log.map(x=>x.correct));
      }
      rec.fatigueNote = computeFatigueNote(log.map(x=> x.correct && !x.omitted));
      if(cfg.taskMode==='ant'){
        const rtBy = (key,val)=> rtMeanOf(log.filter(x=>x[key]===val && x.correct).map(x=>x.rt));
        const noneRT=rtBy('cueType','none'), centerRT=rtBy('cueType','center'), spatialRT=rtBy('cueType','spatial');
        const congRT=rtBy('congruency','congruent'), incongRT=rtBy('congruency','incongruent');
        rec.choice.alerting = (noneRT!=null && centerRT!=null) ? Math.round(noneRT-centerRT) : null;
        rec.choice.orienting = (centerRT!=null && spatialRT!=null) ? Math.round(centerRT-spatialRT) : null;
        rec.choice.conflict = (congRT!=null && incongRT!=null) ? Math.round(incongRT-congRT) : null;
      }
      if(cfg.taskMode==='tapat'){
        const tonicTrials = log.filter(x=>x.block==='tonic');
        const phasicTrials = log.filter(x=>x.block==='phasic');
        rec.choice.tonicMeanRT = rtMeanOf(tonicTrials.filter(x=>x.correct).map(x=>x.rt));
        rec.choice.tonicOmissions = tonicTrials.filter(x=>x.omitted).length;
        rec.choice.tonicTotal = tonicTrials.length;
        rec.choice.phasicMeanRT = rtMeanOf(phasicTrials.filter(x=>x.correct).map(x=>x.rt));
        rec.choice.finalTapatLevel = session.tapatLevel;
        rec.choice.adaptive = cfg.adaptive;
      }
      if(cfg.taskMode==='switching'){
        const swRT = rtMeanOf(log.filter(x=>x.isSwitch && x.correct).map(x=>x.rt));
        const repRT = rtMeanOf(log.filter(x=>!x.isSwitch && x.correct).map(x=>x.rt));
        rec.choice.switchCost = (swRT!=null && repRT!=null) ? Math.round(swRT-repRT) : null;
        // Switch cost relativo al RT di base del paziente (repRT), non solo
        // assoluto: un paziente semplicemente lento in generale (es. per
        // bradicinesia) non deve gonfiare il costo di switching, che dovrebbe
        // riflettere solo il sovraccosto specifico del cambio di regola, non
        // il "vigore" di risposta generale (Cools, Rogers & Robbins — vigore
        // di risposta dopamina-dipendente, distinto dallo shifting). Affianca
        // il valore assoluto, non lo sostituisce.
        rec.choice.switchCostRelative = (rec.choice.switchCost!=null && repRT>0) ? +(rec.choice.switchCost/repRT).toFixed(3) : null;
        // Accuratezza separata per prove di ripetizione e di switch, non
        // solo il tempo di reazione — isola il costo di switching puro
        // (swAcc vs repAcc, entrambe dentro lo stesso blocco misto) da un
        // eventuale carico attentivo generico di dover tenere pronte
        // entrambe le regole (visibile confrontando repAcc con l'accuratezza
        // di un compito a regola singola, quando disponibile altrove — qui
        // dentro un solo esercizio si misura solo la componente di switch,
        // non il "mixing cost" pieno, che richiederebbe un blocco puro a
        // compito singolo come riferimento, non ancora presente).
        const swTrials = log.filter(x=>x.isSwitch), repTrials = log.filter(x=>!x.isSwitch);
        rec.choice.switchAcc = swTrials.length ? swTrials.filter(x=>x.correct).length/swTrials.length : null;
        rec.choice.repAcc = repTrials.length ? repTrials.filter(x=>x.correct).length/repTrials.length : null;
        if(cfg.switchMaterial==='bivalente'){
          const congRT = rtMeanOf(log.filter(x=>x.congruency==='congruent' && x.correct).map(x=>x.rt));
          const incongRT = rtMeanOf(log.filter(x=>x.congruency==='incongruent' && x.correct).map(x=>x.rt));
          rec.choice.conflict = (congRT!=null && incongRT!=null) ? Math.round(incongRT-congRT) : null;
        }
      }
      if(cfg.taskMode==='simon'){
        const congRT = rtMeanOf(log.filter(x=>x.congruency==='congruent' && x.correct).map(x=>x.rt));
        const incongRT = rtMeanOf(log.filter(x=>x.congruency==='incongruent' && x.correct).map(x=>x.rt));
        rec.choice.conflict = (congRT!=null && incongRT!=null) ? Math.round(incongRT-congRT) : null; // "effetto Simon" — stesso segno/interpretazione dell'indice di conflitto già usato per ANT e Task-switching bivalente
        const congLog = log.filter(x=>x.congruency==='congruent');
        const incongLog = log.filter(x=>x.congruency==='incongruent');
        rec.choice.congAccuracy = congLog.length ? congLog.filter(x=>x.correct).length/congLog.length : null;
        rec.choice.incongAccuracy = incongLog.length ? incongLog.filter(x=>x.correct).length/incongLog.length : null;
      }
    } else if(family==='dual'){
      rec.counts = session.counts; rec.metrics = scoreFromCounts(session.counts);
      rec.countsAud = session.countsAud; rec.metricsAud = scoreFromCounts(session.countsAud);
      rec.dualPairing = cfg.dualPairing || 'vis-aud';
      // Media dei due canali in un solo indice — nessun tempo di reazione
      // per canale è ancora registrato qui (limite da segnalare, non
      // risolto in questo passaggio: LISAS richiederebbe prima quello),
      // quindi per ora si media il d′ (già calcolato per ciascun canale),
      // sullo stesso principio già usato per il Running Span (media di
      // posAcc+contentAcc).
      rec.metricsCombined = {
        dprime: (rec.metrics.dprime!=null && rec.metricsAud.dprime!=null) ? (rec.metrics.dprime+rec.metricsAud.dprime)/2 : null,
        acc: (rec.metrics.acc+rec.metricsAud.acc)/2
      };
    } else if(family==='spatial'){
      const r = session.results;
      const sum = k=> r.reduce((a,b)=>a+(b[k]||0),0);
      const isConteggio = r.length>0 && r[0].modalitaConteggio;
      if(isConteggio){
        // 'Conteggio a regola': un unico numero riportato per tavola, non
        // un conteggio per lato — niente foundLeft/foundRight/falseAlarms
        // reali da cui derivarli (l'asimmetria classica del neglect non è
        // misurabile con questo tipo di risposta), sostituiti da una
        // misura di accuratezza sul conteggio complessivo.
        const corretti = r.filter(x=>x.corretto).length;
        const erroriAssoluti = r.map(x=>Math.abs(x.conteggioDato-x.conteggioAtteso));
        rec.neglect = {
          boards:r.length, modalitaConteggio:true,
          targetsLeft:sum('targetsLeft'), targetsRight:sum('targetsRight'),
          foundLeft:null, foundRight:null, omittedLeft:null, omittedRight:null,
          pctLeft:null, pctRight:null, falseAlarms:null, asymmetry:null,
          meanTimeMs: rtMeanOf(r.map(x=>x.timeMs)),
          conteggiCorretti:corretti, conteggiTotali:r.length,
          accuratezzaConteggio: r.length ? corretti/r.length : null,
          erroreAssolutoMedio: erroriAssoluti.length ? mean(erroriAssoluti) : null
        };
      } else {
        const tL=sum('targetsLeft'), tR=sum('targetsRight'), fL=sum('foundLeft'), fR=sum('foundRight'), fa=sum('falseAlarms');
        rec.neglect = {
          boards:r.length, modalitaConteggio:false,
          targetsLeft:tL, targetsRight:tR, foundLeft:fL, foundRight:fR,
          omittedLeft:tL-fL, omittedRight:tR-fR,
          pctLeft: tL? fL/tL : null, pctRight: tR? fR/tR : null,
          falseAlarms:fa, meanTimeMs: rtMeanOf(r.map(x=>x.timeMs)),
          asymmetry: (tL && tR) ? Math.round(((fL/tL)-(fR/tR))*100) : null // negativo = più omissioni a sinistra
        };
        // LISAS medio per sessione, calcolato usando ogni TAVOLA come
        // "prova" (non ogni singolo bersaglio — qui non si registra un
        // tempo per bersaglio, solo per tavola): "corretta" = tavola
        // completata senza nessuna omissione e nessun falso allarme, RT =
        // il tempo di quella tavola. Resta SEPARATO dall'asimmetria sopra,
        // che segue il proprio meccanismo già esistente (spostamento del
        // gradiente verso il lato più debole, invariato da questa aggiunta).
        {
          const perfectFlags = r.map(b => (b.foundLeft===b.targetsLeft && b.foundRight===b.targetsRight && !b.falseAlarms));
          const perfectRTs = r.filter((b,i)=>perfectFlags[i] && b.timeMs!=null).map(b=>b.timeMs);
          rec.neglect.lisas = computeLISAS(perfectRTs, perfectFlags);
        }
      }
    } else if(family==='span'){
      // session.trials non esiste per il Running Span (non è mai stato
      // popolato in startRunningSpanSession) — leggerlo qui lanciava
      // un'eccezione sincrona su OGNI sessione completata (Cannot read
      // properties of undefined), mai catturata (completeAndSave è async
      // senza try/catch): l'intera funzione si interrompeva in silenzio a
      // metà, prima di salvare e prima di aggiornare la schermata — il
      // pulsante "Conferma" sembrava non fare nulla. session.results[0].n
      // è lo stesso dato (n richiesto in quel ciclo), già disponibile.
      const posAccs = session.results.map(r=>r.posAcc);
      const contentAccs = session.results.map(r=>r.contentAcc);
      rec.span = {
        n: session.results[0] ? session.results[0].n : null,
        posAccMean: mean(posAccs), contentAccMean: mean(contentAccs),
        seqLenMean: mean(session.results.map(r=>r.seqLen)),
        results: session.results
      };
      // Punteggi derivati dal tempo di reazione (aggiunto ora — prima non
      // veniva registrato affatto per questo esercizio). "Corretto" ai fini
      // del LISAS = richiamo perfetto della posizione (posAcc===1) in quel
      // ciclo — un richiamo parzialmente giusto non è un "successo pieno"
      // da includere nella media dei RT corretti.
      {
        const rts = session.results.map(r=>r.rt).filter(x=>x!=null);
        rec.span.meanRT = rts.length ? mean(rts) : null;
        const perfectFlags = session.results.map(r=>r.posAcc===1);
        const perfectRTs = session.results.filter(r=>r.posAcc===1 && r.rt!=null).map(r=>r.rt);
        rec.span.lisas = computeLISAS(perfectRTs, perfectFlags);
      }
    } else if(family==='goaltask'){
      const score = scoreGoalTask(session);
      rec.goaltask = {
        scenario: cfg.goaltaskScenario, scenarioLabel: session.scenario.label, livello: cfg.goaltaskLivello,
        completatiCount: score.completatiCount, totaleElementi: score.totaleElementi,
        percentualeCompletamento: score.percentualeCompletamento,
        violazioniCount: score.violazioniCount, tempoImpiegatoSec: score.tempoImpiegatoSec,
        budgetRispettato: score.budgetRispettato, budgetSecondi: session.scenario.budgetSecondi || null,
        sogliaErroriTollerati: score.sogliaErroriTollerati, erroriEntroSoglia: score.erroriEntroSoglia,
        violazioni: session.violazioni
      };
    } else if(family==='memoria'){
      const m = session.material;
      const materiale = memoriaEffectiveMateriale(cfg);
      const totale = memoriaLearnItems(cfg, m).length;
      const recuperati = Object.values(session.recall).filter(Boolean).length;
      rec.memoria = {
        modo: cfg.memoriaModo, materiale, livello: m.livello,
        titolo: materiale==='brano' ? m.titolo : null,
        recuperati, totale, percentuale: totale ? Math.round((recuperati/totale)*100) : 0,
        dettaglioRichiamo: session.recall,
        chunkingMetodi: cfg.memoriaModo==='chunking' ? cfg.chunkingMetodi : undefined,
        chunkingNota: (cfg.memoriaModo==='chunking' && cfg.chunkingMetodi.includes('personale')) ? cfg.chunkingNota : undefined,
        // forma parallela usata (solo dove esistono forme multiple per il
        // livello) — tracciata per poter distinguere in retrospettiva se
        // due sessioni allo stesso livello hanno usato lo stesso materiale
        // (rischio di apprendimento/esposizione) o forme diverse (RCI pulito)
        formaIdx: (m.nForme>1) ? m.formaIdx : undefined,
        formaLettera: (m.nForme>1) ? (['A','B','C','D','E','F','G','H','I','J'][m.formaIdx]||null) : undefined,
        nForme: m.nForme>1 ? m.nForme : undefined
      };
    }
    return rec;
  }
