'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// Blocchi puri: dipendono solo da `cfg` ed `EXERCISES`, forniti come stub
// mutabili qui sotto (mai una copia a mano della logica — estratta dal vero
// index.html, come tutti gli altri test di questo progetto).
const cfg = { taskMode: 'nback', antMode: null, targetSeq: ['a','b'] };
const EXERCISES = {
  nback: { label: 'N-back' }, sequenza: { label: 'Sequenza bersaglio' }, gonogo: { label: 'Go/No-Go' },
  switching: { label: 'Task-switching' }, stopsignal: { label: 'Stop-Signal' },
  categorizzazione: { label: 'Categorizzazione condizionale' }, dualtask: { label: 'Doppio compito' },
  simon: { label: 'Simon (conflitto spazio-risposta)' }
};

const mod = loadPure(REPO_ROOT, [
  { name: 'DEMO_CONSTS', start: '  const DEMO_TRIALS = 6;', end: "  const DEMO_ELIGIBLE = ['nback','sequenza','gonogo','switching','stopsignal','categorizzazione','dualtask','tapat','antclassico','simon'];" },
  { name: 'DEMO_PATCHES', start: '  const DEMO_PATCHES = {', end: "    simon: ()=>({taskMode:'simon', adaptStartLevel:1, simonCongruenza:'bilanciato', isi:3200, stimDuration:700, trials:DEMO_TRIALS})\n  };" },
  { name: 'demoLabelFor', start: '  function demoLabelFor(key){', end: "    return EXERCISES[key].label;\n  }" },
  { name: 'demoKeyForCurrentCfg', start: '  function demoKeyForCurrentCfg(){', end: "    return DEMO_ELIGIBLE.includes(cfg.taskMode) ? cfg.taskMode : null;\n  }" },
  { name: 'demoPrereqOk', start: '  function demoPrereqOk(key){', end: "    return true;\n  }" },
  { name: 'demoFeedbackText', start: '  function demoFeedbackText(trial, outcome){', end: "    return ok ? 'Giusto.' : 'Risposta non corretta per questa prova.';\n  }" }
], ['DEMO_TRIALS', 'DEMO_ELIGIBLE', 'DEMO_PATCHES', 'demoLabelFor', 'demoKeyForCurrentCfg', 'demoPrereqOk', 'demoFeedbackText'], { cfg, EXERCISES, alert: () => {} });

const { DEMO_TRIALS, DEMO_ELIGIBLE, DEMO_PATCHES, demoLabelFor, demoKeyForCurrentCfg, demoPrereqOk, demoFeedbackText } = mod;

module.exports = function run(t) {
  t.group('Demo — idoneità e parametri fissi', () => {
    t.eq(DEMO_TRIALS, 6, 'la demo dura 6 prove');
    const eligible = ['nback', 'sequenza', 'gonogo', 'switching', 'stopsignal', 'categorizzazione', 'dualtask', 'tapat', 'antclassico', 'simon'];
    eligible.forEach(k => {
      t.ok(DEMO_ELIGIBLE.includes(k), 'esercizio idoneo alla demo: ' + k);
      t.ok(typeof DEMO_PATCHES[k] === 'function', 'DEMO_PATCHES ha una patch per: ' + k);
      const patch = DEMO_PATCHES[k]();
      t.eq(patch.trials, 6, 'patch "' + k + '": 6 prove');
    });
    t.eq(DEMO_ELIGIBLE.length, eligible.length, 'nessun esercizio idoneo in più o in meno rispetto a quelli attesi');
    t.ok(!DEMO_ELIGIBLE.includes('neglect'), 'Cancellazione fuori da questa lista (motore diverso, non a prove sequenziali)');
    t.ok(!DEMO_ELIGIBLE.includes('memoria'), 'Strategie di memoria NON sono idonee (per scelta esplicita)');
    t.ok(!DEMO_ELIGIBLE.includes('goaltask'), 'Compiti a obiettivi/pianificazione NON sono idonei (per scelta esplicita)');

    t.eq(DEMO_PATCHES.nback().nLevel, 1, 'N-back demo: livello 1 (n=1, il più facile)');
    t.eq(DEMO_PATCHES.sequenza().adaptStartLevel, 1, 'Sequenza bersaglio demo: livello 1');
    t.eq(DEMO_PATCHES.gonogo().adaptStartLevel, 1, 'Go/No-Go demo: livello 1');
    t.eq(DEMO_PATCHES.switching().adaptStartLevel, 1, 'Task-switching demo: livello 1');
    t.eq(DEMO_PATCHES.stopsignal().adaptStartLevel, 1, 'Stop-Signal demo: livello 1');
    t.eq(DEMO_PATCHES.categorizzazione().categLivello, 1, 'Categorizzazione demo: livello 1');
    t.eq(DEMO_PATCHES.dualtask().dualStartLevel1, 1, 'Doppio compito demo: canale 1 a livello 1');
    t.eq(DEMO_PATCHES.dualtask().dualStartLevel2, 1, 'Doppio compito demo: canale 2 a livello 1');
    const tapatPatch = DEMO_PATCHES.tapat();
    t.eq(tapatPatch.taskMode, 'ant', 'TAPAT demo: taskMode resta "ant"');
    t.eq(tapatPatch.antMode, 'tapat', 'TAPAT demo: antMode "tapat"');
    t.eq(tapatPatch.tapatStartLevel, 1, 'TAPAT demo: livello 1');
    const antPatch = DEMO_PATCHES.antclassico();
    t.eq(antPatch.taskMode, 'ant', 'ANT classico demo: taskMode resta "ant"');
    t.eq(antPatch.antMode, 'classico', 'ANT classico demo: antMode "classico"');
    t.eq(antPatch.adaptStartLevel, 1, 'ANT classico demo: livello 1');
    const simonPatch = DEMO_PATCHES.simon();
    t.eq(simonPatch.taskMode, 'simon', 'Simon demo: taskMode "simon"');
    t.eq(simonPatch.adaptStartLevel, 1, 'Simon demo: livello 1');
    t.eq(simonPatch.simonCongruenza, 'bilanciato', 'Simon demo: congruenza forzata a bilanciato (50/50), indipendentemente da cosa aveva impostato l\'operatore');
  });

  t.group('Demo — demoKeyForCurrentCfg', () => {
    cfg.taskMode = 'nback'; cfg.antMode = null;
    t.eq(demoKeyForCurrentCfg(), 'nback', 'N-back riconosciuto come idoneo');
    cfg.taskMode = 'ant'; cfg.antMode = 'classico';
    t.eq(demoKeyForCurrentCfg(), 'antclassico', 'ANT classico riconosciuto come "antclassico"');
    cfg.taskMode = 'ant'; cfg.antMode = 'tapat';
    t.eq(demoKeyForCurrentCfg(), 'tapat', 'ANT in modalità TAPAT è riconosciuto come "tapat"');
    cfg.taskMode = 'neglect'; cfg.antMode = null;
    t.eq(demoKeyForCurrentCfg(), null, 'Cancellazione non è idonea (motore diverso)');
    cfg.taskMode = 'memoria';
    t.eq(demoKeyForCurrentCfg(), null, 'Strategie di memoria non idonee');
  });

  t.group('Demo — demoPrereqOk: stessi controlli già usati da "Avvia sessione"', () => {
    cfg.targetSeq = [];
    t.eq(demoPrereqOk('sequenza'), false, 'Sequenza bersaglio senza bersagli configurati: demo bloccata');
    cfg.targetSeq = ['a'];
    t.eq(demoPrereqOk('sequenza'), false, 'Sequenza bersaglio con un solo elemento: ancora bloccata (ne servono almeno 2)');
    cfg.targetSeq = ['a','b'];
    t.eq(demoPrereqOk('sequenza'), true, 'Sequenza bersaglio con almeno 2 elementi: demo consentita');
    cfg.targetSeq = [];
    t.eq(demoPrereqOk('gonogo'), false, 'Go/No-Go senza elemento no-go selezionato: demo bloccata');
    cfg.targetSeq = ['a'];
    t.eq(demoPrereqOk('gonogo'), true, 'Go/No-Go con elemento no-go selezionato: demo consentita');
    t.eq(demoPrereqOk('nback'), true, 'N-back non ha prerequisiti aggiuntivi');
  });

  t.group('Demo — demoLabelFor', () => {
    t.eq(demoLabelFor('nback'), 'N-back', 'etichetta N-back presa da EXERCISES');
  });

  t.group('Demo — demoFeedbackText: riusa la classificazione del trial, non ne inventa una nuova', () => {
    cfg.taskMode = 'nback'; cfg.antMode = null;
    t.ok(/andava toccato/.test(demoFeedbackText({ isTarget: true }, 'hit')), 'n-back: hit su target spiega che andava toccato');
    t.ok(/trappola/.test(demoFeedbackText({ isTarget: false, isLure: true }, 'hit')), 'n-back: hit su lure nomina la "trappola"');
    t.ok(/trappola/.test(demoFeedbackText({ isTarget: false, isLure: true }, 'err')), 'n-back: err su lure nomina comunque la "trappola"');

    cfg.taskMode = 'sequenza';
    t.ok(/sequenza bersaglio/.test(demoFeedbackText({ isTarget: true }, 'err')), 'sequenza: nomina la sequenza bersaglio');

    cfg.taskMode = 'gonogo';
    t.ok(/no-go/.test(demoFeedbackText({ isTarget: false }, 'hit')), 'gonogo: nomina l\'elemento no-go su un corretto non-risposta');
    t.ok(/no-go/.test(demoFeedbackText({ isTarget: false }, 'err')), 'gonogo: nomina l\'elemento no-go anche su errore');

    cfg.taskMode = 'switching';
    const fbSwitch = demoFeedbackText({ ruleDef: { label: 'Vocale/Consonante' }, isSwitch: true }, 'err');
    t.ok(/Vocale\/Consonante/.test(fbSwitch), 'switching: nomina la regola corrente');
    t.ok(/cambiata/.test(fbSwitch), 'switching: segnala che era un cambio di regola (isSwitch:true)');

    cfg.taskMode = 'stopsignal';
    t.ok(/segnale di stop/.test(demoFeedbackText({ isStopTrial: true }, 'err')), 'stop-signal: nomina il segnale di stop sui trial di stop');

    cfg.taskMode = 'categorizzazione';
    t.ok(/non andava data nessuna risposta/.test(demoFeedbackText({ correctAnswer: 'nogo' }, 'err')), 'categorizzazione: spiega il "nogo" mancato');

    cfg.taskMode = 'ant'; cfg.antMode = 'tapat';
    t.ok(/senza preavviso/.test(demoFeedbackText({ block: 'tonic' }, 'err')), 'tapat: blocco tonico spiega l\'assenza di preavviso');
    t.ok(/segnale che precede/.test(demoFeedbackText({ block: 'phasic' }, 'err')), 'tapat: blocco fasico richiama il segnale');

    cfg.taskMode = 'ant'; cfg.antMode = 'classico';
    t.ok(/freccia centrale/.test(demoFeedbackText({ cueType: 'none' }, 'err')), 'ant classico: ricorda di guardare solo la freccia centrale');
    t.ok(/segnale visto poco prima/.test(demoFeedbackText({ cueType: 'spatial' }, 'hit')), 'ant classico: nomina il cue quando presente');

    cfg.taskMode = 'simon'; cfg.antMode = null;
    t.ok(/colore/.test(demoFeedbackText({ congruency: 'congruent' }, 'hit')), 'simon: ricorda che la regola è il colore');
    const fbSimonIncong = demoFeedbackText({ congruency: 'incongruent' }, 'err');
    t.ok(/posizione/.test(fbSimonIncong), 'simon: su una prova incongruente sbagliata, nomina esplicitamente la posizione come fonte di interferenza');
  });
};
