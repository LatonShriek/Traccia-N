// Motore della batteria di screening: catalogo delle sonde, domini, regole che
// trasformano il pattern di fallimenti in suggerimenti. SPOSTATO da index.html
// senza modifiche al testo (passo 3b), con la sola aggiunta di "export".
// Valori clinici (soglia 0.70, trial, configurazioni delle sonde): non cambiarli
// senza richiesta esplicita di Rodrigo.
import { POOLS, defaultTargetSeq } from './pools.js';
import { primaryAccuracyOf } from './scores.js';

  /* ---------- Batteria di screening iniziale ---------- */
  // 4 domini (Attenzione divisa rimossa: considerata di livello superiore
  // rispetto a uno screening rapido — vedi discussione con Rodrigo. Il
  // Doppio compito resta un esercizio pienamente disponibile, semplicemente
  // non più proposto/confrontato in automatico da questa batteria), ciascuno
  // con un blocco "base" (stimolo semplice, nessun carico esecutivo) e un
  // blocco "caricato" (versione con carico esecutivo dello stesso dominio).
  // Ogni blocco è breve e a difficoltà FISSA (adaptive:false), non la
  // solita titolazione automatica: qui l'obiettivo non è trovare il
  // livello ideale del paziente, ma un confronto pulito e riproducibile
  // fra "senza carico" e "con carico" allo stesso dominio.
  export const SCREENING_TRIALS = 16;
  // "Attenzione sostenuta / inibizione" (domainLabel sotto) è
  // un'etichetta pragmatica per l'operatore, non una posizione teorica:
  // il framework della batteria (vedi README, "Framework teorico") tratta
  // inibizione e attenzione selettiva come due facce dello stesso
  // meccanismo di mantenimento dell'obiettivo attivo (Munakata, Herd,
  // Chatham, Depue, Banich & O'Reilly, 2011), non come moduli a sé — qui
  // restano accorpate in una sola etichetta perché lo screening ha
  // bisogno di un nome breve e leggibile a colpo d'occhio, non perché il
  // codice le consideri la stessa cosa altrove (Go/No-Go, Stop-Signal,
  // ANT e Cancellazione, per esempio, restano distinti per costrutto
  // specifico in tutto il resto della batteria).
  // ========================================================================
  // MOTORE DI SCREENING — riscritto per intero su questo principio unico:
  // ogni dominio ha un elenco di SONDE, sempre somministrate tutte (nessun
  // "se flagga il base, approfondisci" a cascata come nella versione
  // precedente) — poi una regola di suggerimento propria del dominio legge
  // il PATTERN di chi ha fallito e chi no, non solo "quante".
  // Non ancora incluso in questa riscrittura (prossimo giro, dichiarato
  // esplicitamente): la doppia somministrazione verbale/non verbale, e il
  // secondo giro a livello intermedio per chi risulta pulito ovunque.
  export const SCREENING_FLAG_THRESHOLD = 0.70; // coerente con la soglia Wilson già in uso per la titolazione adattiva
  // Catalogo delle sonde — una voce per ogni test che può comparire in un
  // dominio, con la propria configurazione e come calcolarne l'esito.
  // 'variant' distingue sonde che condividono lo stesso esercizio (es. i 3
  // modi di Cancellazione, o le 2 strutture di Categorizzazione usate come
  // suggerimento) — necessario perché più di una può comparire nello
  // stesso riepilogo finale senza che una sovrascriva l'altra.
  export const SCREENING_PROBES = {
    ant: { label:'ANT classico', suggestTaskMode:'ant', suggestLabel:'ANT classico', variant:'ant',
      patch:()=>({taskMode:'ant', stimType:'lettere', adaptStartLevel:1, titrationMode:'manuale', adaptive:false, isi:3200, stimDuration:700, trials:SCREENING_TRIALS}),
      nonVerbalPatch:()=>({taskMode:'ant', stimType:'simboli', adaptStartLevel:1, titrationMode:'manuale', adaptive:false, isi:3200, stimDuration:700, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    tapat: { label:'TAPAT (allerta sostenuta)', suggestTaskMode:'tapat', suggestLabel:'TAPAT', variant:'tapat',
      patch:()=>({taskMode:'tapat', tapatModalita:'visivo', tapatSpatial:false, tapatStartLevel:1, titrationMode:'manuale', adaptive:false, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    gonogo: { label:'Go/No-Go', suggestTaskMode:'gonogo', suggestLabel:'Go/No-Go', variant:'gonogo',
      patch:()=>({taskMode:'gonogo', stimType:'lettere', targetSeq:POOLS.lettere.slice(0,2), adaptive:false, targetRate:0.35, isi:1000, stimDuration:500, trials:SCREENING_TRIALS}),
      nonVerbalPatch:()=>({taskMode:'gonogo', stimType:'simboli', targetSeq:defaultTargetSeq('simboli',2), adaptive:false, targetRate:0.35, isi:1000, stimDuration:500, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    stopsignal: { label:'Stop-Signal', suggestTaskMode:'stopsignal', suggestLabel:'Stop-Signal', variant:'stopsignal',
      // 'frecce' era l'unico materiale usato prima di questa estensione —
      // simboliche/spaziali, non linguistiche: qui diventa la forma NON
      // verbale, 'lettere' quella verbale aggiunta.
      patch:()=>({taskMode:'stopsignal', stimType:'lettere', adaptive:false, targetRate:0.25, isi:2000, stimDuration:800, ssd:250, ssdStep:50, stopsignalInterferenza:'no', titrationMode:'manuale', trials:SCREENING_TRIALS}),
      nonVerbalPatch:()=>({taskMode:'stopsignal', stimType:'frecce', adaptive:false, targetRate:0.25, isi:2000, stimDuration:800, ssd:250, ssdStep:50, stopsignalInterferenza:'no', titrationMode:'manuale', trials:SCREENING_TRIALS}),
      scoreOf:r=>r.goAccuracy },
    stopsignal_interferenza: { label:'Stop-Signal con interferenza', suggestTaskMode:'stopsignal', suggestLabel:'Stop-Signal (con interferenza)', variant:'stopsignal_interferenza',
      patch:()=>({taskMode:'stopsignal', stimType:'lettere', adaptive:false, targetRate:0.25, isi:2000, stimDuration:800, ssd:250, ssdStep:50, stopsignalInterferenza:'si', titrationMode:'manuale', trials:SCREENING_TRIALS}),
      nonVerbalPatch:()=>({taskMode:'stopsignal', stimType:'frecce', adaptive:false, targetRate:0.25, isi:2000, stimDuration:800, ssd:250, ssdStep:50, stopsignalInterferenza:'si', titrationMode:'manuale', trials:SCREENING_TRIALS}),
      scoreOf:r=>r.goAccuracy },
    simon: { label:'Simon (verifica conflitto)', suggestTaskMode:'simon', suggestLabel:'Simon', variant:'simon',
      patch:()=>({taskMode:'simon', simonMateriale:'colori', simonCongruenza:'bilanciato', adaptStartLevel:1, titrationMode:'manuale', adaptive:false, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    // Mantenimento ora ha anche un materiale non verbale (simboli, non
    // lettere/numeri) — vedi buildMantenimento/POOLS.simboli.
    mantenimento: { label:'Mantenimento (tipo Sternberg)', suggestTaskMode:'mantenimento', suggestLabel:'Mantenimento (tipo Sternberg)', variant:'mantenimento',
      patch:()=>({taskMode:'mantenimento', mantenimentoModalita:'riconoscimento', mantenimentoMateriale:'lettere', mantenimentoListLen:4, titrationMode:'manuale', adaptive:false, trials:SCREENING_TRIALS}),
      nonVerbalPatch:()=>({taskMode:'mantenimento', mantenimentoModalita:'riconoscimento', mantenimentoMateriale:'simboli', mantenimentoListLen:4, titrationMode:'manuale', adaptive:false, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    sequenza: { label:'Sequenza bersaglio', suggestTaskMode:'sequenza', suggestLabel:'Sequenza bersaglio', variant:'sequenza',
      patch:()=>({taskMode:'sequenza', stimType:'lettere', targetSeq:defaultTargetSeq('lettere',2), adaptStartLevel:1, titrationMode:'manuale', adaptive:false, isi:2200, stimDuration:700, trials:SCREENING_TRIALS}),
      nonVerbalPatch:()=>({taskMode:'sequenza', stimType:'simboli', targetSeq:defaultTargetSeq('simboli',2), adaptStartLevel:1, titrationMode:'manuale', adaptive:false, isi:2200, stimDuration:700, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    categorizzazione: { label:'Categorizzazione condizionale', suggestTaskMode:'categorizzazione', suggestLabel:'Categorizzazione condizionale', variant:'categorizzazione',
      // Entrambe le forme sono visive: 'lettere' (lettere scritte a schermo,
      // regola Vocale/Consonante) per la forma verbale, 'simboli' per quella
      // non verbale — non più 'lettereVoce' (lettere pronunciate dal
      // sintetizzatore), che introduceva una modalità acustica non prevista
      // per uno screening dichiarato visivo. La regola di classificazione è
      // identica (SWITCH_RULESETS.lettereVoce è un alias di .lettere), cambia
      // solo la presentazione: scritta invece che ascoltata.
      patch:()=>({taskMode:'categorizzazione', categStructManual:1, categMateriale:'lettere', titrationMode:'manuale', adaptive:false, trials:SCREENING_TRIALS}),
      nonVerbalPatch:()=>({taskMode:'categorizzazione', categStructManual:1, categMateriale:'simboli', titrationMode:'manuale', adaptive:false, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    nback: { label:'N-back', suggestTaskMode:'nback', suggestLabel:'N-back', variant:'nback',
      patch:()=>({taskMode:'nback', stimType:'lettere', nLevel:2, adaptive:false, targetRate:0.24, isi:1700, stimDuration:600, trials:SCREENING_TRIALS}),
      nonVerbalPatch:()=>({taskMode:'nback', stimType:'simboli', nLevel:2, adaptive:false, targetRate:0.24, isi:1700, stimDuration:600, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    runningspan: { label:'Running Span', suggestTaskMode:'runningspan', suggestLabel:'Running Span', variant:'runningspan',
      // trials:4, non SCREENING_TRIALS: qui un "trial" è un intero ciclo
      // sequenza+richiamo (7-15s l'uno), non una prova rapida — 16 cicli
      // renderebbero questa sonda da sola più lunga di tutto il resto.
      patch:()=>({taskMode:'runningspan', stimType:'lettere', adaptStartLevel:1, trials:4}),
      nonVerbalPatch:()=>({taskMode:'runningspan', stimType:'simboli', adaptStartLevel:1, trials:4}),
      scoreOf:r=>primaryAccuracyOf(r) },
    switching: { label:'Flessibilità cognitiva', suggestTaskMode:'switching', suggestLabel:'Task-switching', variant:'switching', isSplit:true, splitAccKeys:{base:'repAcc', caricato:'switchAcc'},
      patch:()=>({taskMode:'switching', switchMaterial:'numeri', adaptive:false, targetRate:0.35, isi:1400, stimDuration:700, trials:24}),
      nonVerbalPatch:()=>({taskMode:'switching', switchMaterial:'simboli', adaptive:false, targetRate:0.35, isi:1400, stimDuration:700, trials:24}) },
    neglect_classico: { label:'Cancellazione classico', suggestTaskMode:'neglect', suggestLabel:'Cancellazione classico', variant:'neglect_classico',
      patch:()=>({taskMode:'neglect', neglectMode:'classico', stimType:'lettere', targetSeq:defaultTargetSeq('lettere',2), neglectBoardSize:20, neglectGradient:50, neglectTimeLimit:0, neglectBottomUp:'off', neglectRuleClauses:null, trials:1}),
      nonVerbalPatch:()=>({taskMode:'neglect', neglectMode:'classico', stimType:'simboli', targetSeq:defaultTargetSeq('simboli',2), neglectBoardSize:20, neglectGradient:50, neglectTimeLimit:0, neglectBottomUp:'off', neglectRuleClauses:null, trials:1}),
      scoreOf:r=>primaryAccuracyOf(r) },
    neglect_intruso: { label:'Cancellazione — Trova l\'intruso', suggestTaskMode:'neglect', suggestLabel:'Cancellazione — Trova l\'intruso', variant:'neglect_intruso',
      patch:()=>({taskMode:'neglect', neglectMode:'intruso', stimType:'lettere', targetSeq:defaultTargetSeq('lettere',2), neglectBoardSize:30, neglectGradient:50, neglectTimeLimit:0, neglectBottomUp:'off', neglectRuleClauses:null, trials:1}),
      nonVerbalPatch:()=>({taskMode:'neglect', neglectMode:'intruso', stimType:'simboli', targetSeq:defaultTargetSeq('simboli',2), neglectBoardSize:30, neglectGradient:50, neglectTimeLimit:0, neglectBottomUp:'off', neglectRuleClauses:null, trials:1}),
      scoreOf:r=>primaryAccuracyOf(r) },
    // "A regola" resta a singola somministrazione (limite dichiarato): il
    // testo della regola distingue solo numeri/lettere in modo rigido
    // (vedi il ramo dedicato nelle istruzioni) — un materiale 'simboli'
    // qui ricadrebbe silenziosamente sul trattamento testuale di
    // 'lettere', un risultato "non verbale" che non lo sarebbe
    // veramente. Raddoppiarla richiede prima sistemare quella parte.
    neglect_regola: { label:'Cancellazione a regola', suggestTaskMode:'neglect', suggestLabel:'Cancellazione a regola', variant:'neglect_regola',
      patch:()=>({taskMode:'neglect', neglectMode:'regola', neglectRuleLevel:2, stimType:'lettere', neglectBoardSize:40, neglectGradient:50, neglectTimeLimit:0, neglectBottomUp:'off', neglectRuleClauses:null, trials:1}),
      scoreOf:r=>primaryAccuracyOf(r) },
    dualtask: { label:'Doppio compito (verifica finale)', suggestTaskMode:'dualtask', suggestLabel:'Doppio compito', variant:'dualtask',
      patch:()=>({taskMode:'dualtask', dualStartLevel1:1, dualStartLevel2:1, dualPairing:'vis-aud', titrationMode:'manuale', adaptive:false, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    goaltask_mini: { label:'Scenari ecologici — mini scenario', suggestTaskMode:'goaltask', suggestLabel:'Scenari ecologici', variant:'goaltask',
      patch:()=>({taskMode:'goaltask', goaltaskScenario:'screening_breve', goaltaskLivello:2}),
      // Non una soglia di accuratezza (non è quel genere di compito): il
      // segnale è il numero di violazioni — ipotesi di partenza dichiarata
      // (>1 violazione su un mini-scenario a 4 elementi/90s), non un
      // valore di letteratura.
      scoreOf:r=> r.goaltask && r.goaltask.violazioniCount<=1 ? 1 : 0,
      suggestedCfgOverride:{taskMode:'goaltask', goaltaskScenario:'sei_compiti_classico', goaltaskLivello:1} }
  };
  // Secondo giro a livello intermedio — SOLO per un dominio che risulta
  // interamente pulito (ogni sonda passata, verbale e non verbale
  // insieme): un profilo "pulito" può riflettere la scarsa esigenza dello
  // screening stesso, non l'assenza di difficoltà a un carico più
  // impegnativo (stesso principio già usato per il gate Doppio compito/
  // Scenari ecologici, qui esteso a ogni dominio). Un solo esercizio
  // "ancora" per dominio, non l'intero elenco di sonde — a un livello
  // intermedio (non il minimo di screening, non il massimo), scelto come
  // ipotesi di partenza dichiarata, non un valore di letteratura.
  export const CEILING_PROBES = {
    memoria: { label:'N-back (verifica a carico più alto)', domainLabel:'Memoria di lavoro', suggestTaskMode:'nback', suggestLabel:'N-back',
      patch:()=>({taskMode:'nback', stimType:'lettere', nLevel:3, adaptive:false, targetRate:0.22, isi:1500, stimDuration:550, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    attenzione: { label:'Go/No-Go (verifica a carico più alto)', domainLabel:'Attenzione sostenuta / inibizione', suggestTaskMode:'gonogo', suggestLabel:'Go/No-Go',
      patch:()=>({taskMode:'gonogo', stimType:'lettere', targetSeq:POOLS.lettere.slice(0,3), adaptive:false, targetRate:0.25, isi:1000, stimDuration:450, trials:SCREENING_TRIALS}),
      scoreOf:r=>primaryAccuracyOf(r) },
    esplorazione: { label:'Cancellazione a regola (verifica a carico più alto)', domainLabel:'Esplorazione visuospaziale', suggestTaskMode:'neglect', suggestLabel:'Cancellazione a regola',
      patch:()=>({taskMode:'neglect', neglectMode:'regola', neglectRuleLevel:4, stimType:'lettere', neglectBoardSize:50, neglectGradient:50, neglectTimeLimit:0, neglectBottomUp:'off', neglectRuleClauses:null, trials:1}),
      scoreOf:r=>primaryAccuracyOf(r) },
    flessibilita: { label:'Task-switching (verifica a carico più alto)', domainLabel:'Flessibilità cognitiva', suggestTaskMode:'switching', suggestLabel:'Task-switching',
      patch:()=>({taskMode:'switching', switchMaterial:'numeri', adaptive:false, targetRate:0.35, isi:1000, stimDuration:500, trials:24}),
      scoreOf:r=>primaryAccuracyOf(r) }
  };
  export function probeFailed(probeKey, rec){
    const probe = SCREENING_PROBES[probeKey];
    const acc = probe.scoreOf(rec);
    return acc==null || acc < SCREENING_FLAG_THRESHOLD;
  }
  // Costruisce una "voce di suggerimento" pronta per mergeScreeningFlags —
  // key univoca per sonda/variante (mai solo taskMode: Cancellazione ha 3
  // varianti che devono poter comparire tutte insieme, non sovrascriversi).
  export function suggestionFor(probeKey, extraCfg){
    const p = SCREENING_PROBES[probeKey];
    const suggestedCfg = Object.assign({}, p.suggestedCfgOverride || p.patch(), {trials: p.suggestedCfgOverride ? undefined : 24, adaptive: p.suggestedCfgOverride ? undefined : true}, extraCfg||{});
    return { flagKey:p.variant, suggestTaskMode:p.suggestTaskMode, suggestLabel:p.suggestLabel, suggestedCfg };
  }
  // Regola di suggerimento per Attenzione: ordine di esigenza crescente,
  // suggerisce il PIÙ SEMPLICE fra quelli falliti (non il più complesso) —
  // stesso principio per cui, quando più di un gradino cede insieme, si
  // consiglia il punto più semplice/sicuro da cui ripartire, non una via
  // di mezzo inventata. ANT è solo screening (nessuna letteratura di
  // training): se è lui il più semplice fra i falliti, il suggerimento
  // scivola su TAPAT. Simon si aggiunge SOLO quando Stop-Signal+
  // interferenza è l'unico a fallire (per costruzione, l'unico caso in cui
  // può essere "il più semplice fra i falliti" è quando è anche l'unico).
  export const ATTENZIONE_ORDER = ['ant','tapat','gonogo','stopsignal','stopsignal_interferenza'];
  export function attenzioneSuggestRule(fail){
    const failed = ATTENZIONE_ORDER.filter(k=>fail[k]);
    if(!failed.length) return [];
    const simplest = failed[0]==='ant' ? 'tapat' : failed[0];
    const out = [suggestionFor(simplest)];
    if(failed.length===1 && failed[0]==='stopsignal_interferenza' && fail.simon) out.push(suggestionFor('simon'));
    return out;
  }
  // Regola di suggerimento per Memoria di lavoro: Mantenimento/Sequenza
  // bersaglio/Categorizzazione condivisa formano un gruppo (misure di
  // applicazione di regola/mantenimento, non di aggiornamento continuo) —
  // un fallimento singolo nel gruppo localizza sulla struttura di
  // Categorizzazione più vicina a quel costrutto; più di uno insieme non
  // ha una struttura che combini propriamente le due difficoltà, si
  // ripiega sulla base (Struttura 1). N-back e Running Span sono fuori dal
  // gruppo — sono già esercizi ad allenamento adattivo di per sé, si
  // autopropongono.
  export function memoriaSuggestRule(fail){
    const group = ['mantenimento','sequenza','categorizzazione'].filter(k=>fail[k]);
    const out = [];
    if(group.length===1){
      const struct = group[0]==='sequenza' ? 4 : 1; // mantenimento→1 (cautela, nessun collegamento di costrutto pulito), categorizzazione→1 (segnale diretto), sequenza→4 (stessa natura: riconoscimento continuo)
      out.push(suggestionFor('categorizzazione', {categStructManual:struct}));
    } else if(group.length>=2){
      out.push(suggestionFor('categorizzazione', {categStructManual:1}));
    }
    if(fail.nback) out.push(suggestionFor('nback'));
    if(fail.runningspan) out.push(suggestionFor('runningspan'));
    return out;
  }
  // Esplorazione: le 3 modalità sono somministrate sempre tutte, e TUTTE
  // quelle che falliscono vengono suggerite insieme — a differenza di
  // Attenzione/Memoria non c'è qui una singola localizzazione da scegliere,
  // sono 3 modalità dello stesso identico esercizio, non 3 costrutti
  // diversi da confrontare fra loro.
  export function esplorazioneSuggestRule(fail){
    const out = [];
    if(fail.neglect_classico) out.push(suggestionFor('neglect_classico'));
    if(fail.neglect_intruso) out.push(suggestionFor('neglect_intruso'));
    if(fail.neglect_regola) out.push(suggestionFor('neglect_regola'));
    return out;
  }
  export function flessibilitaSuggestRule(fail){
    return fail.switching ? [suggestionFor('switching')] : [];
  }
  // Un dominio = un elenco di sonde (sempre tutte somministrate, nell'ordine
  // dato) + la regola che trasforma il pattern di fallimenti in
  // suggerimenti. 'simon' non compare nell'elenco 'probes' di Attenzione:
  // è amministrata solo condizionalmente (vedi buildScreeningQueue), non
  // sempre.
  export const SCREENING_DOMAINS = {
    attenzione: { label:'Attenzione sostenuta / inibizione', probes:['ant','tapat','gonogo','stopsignal','stopsignal_interferenza'], suggestRule:attenzioneSuggestRule },
    memoria: { label:'Memoria di lavoro', probes:['mantenimento','sequenza','categorizzazione','nback','runningspan'], suggestRule:memoriaSuggestRule },
    flessibilita: { label:'Flessibilità cognitiva', probes:['switching'], suggestRule:flessibilitaSuggestRule },
    esplorazione: { label:'Esplorazione visuospaziale', probes:['neglect_classico','neglect_intruso','neglect_regola'], suggestRule:esplorazioneSuggestRule }
  };
  export const SCREENING_DOMAIN_ORDER = ['memoria','attenzione','flessibilita','esplorazione']; // memoria per prima: Mantenimento è la prima sonda in assoluto di tutto lo screening, come richiesto
