'use strict';
// Passo 5k: prova dimostrativa (demo.js), preset (registry.js: presetCfgOf) e sequenza mista casuale (pools.js).
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const D = await importCore('../exercises/demo.js');
  const R = await importCore('../exercises/registry.js');
  const P = await importCore('pools.js');

  t.group('demo: parametri', () => {
    t.eq(D.DEMO_TRIALS, 6, '6 prove');
    t.eq(D.DEMO_ELIGIBLE.length, 10, '10 esercizi con demo');
    D.DEMO_ELIGIBLE.forEach(k => {
      t.ok(typeof D.DEMO_PATCHES[k] === 'function', k + ': patch presente');
      const p = D.DEMO_PATCHES[k]();
      t.eq(p.taskMode, k, k + ': taskMode coerente');
      t.eq(p.trials, 6, k + ': 6 prove');
      t.ok(R.EXERCISES[k], k + ': esiste nel registro');
    });
    t.eq(Object.keys(D.DEMO_PATCHES).length, 10, 'nessuna patch di troppo');
  });

  t.group('demo: feedback testuale per ogni esercizio, giusto e sbagliato', () => {
    const cases = [
      ['nback', { isTarget: true }], ['nback', { isLure: true }], ['nback', {}],
      ['sequenza', { isTarget: true }], ['sequenza', {}],
      ['gonogo', { isTarget: true }], ['gonogo', { isTarget: false }],
      ['switching', { ruleDef: { label: 'COLORE' }, isSwitch: true }],
      ['stopsignal', { isStopTrial: true }], ['stopsignal', {}],
      ['categorizzazione', { correctAnswer: 'nogo' }], ['categorizzazione', {}],
      ['dualtask', {}], ['tapat', { block: 'tonic' }], ['tapat', {}],
      ['ant', { cueType: 'double' }], ['ant', {}],
      ['simon', { congruency: 'incongruent' }], ['simon', { congruency: 'congruent' }],
    ];
    cases.forEach(([mode, trial]) => {
      ['hit', 'miss'].forEach(o => {
        const s = D.demoFeedbackText({ taskMode: mode }, trial, o);
        t.ok(typeof s === 'string' && s.length >= 6, mode + ' ' + o + ': testo');
      });
    });
    t.eq(D.demoFeedbackText({ taskMode: 'xx' }, {}, 'hit'), 'Giusto.', 'esercizio sconosciuto: giusto');
    t.eq(D.demoFeedbackText({ taskMode: 'xx' }, {}, 'miss'), 'Risposta non corretta per questa prova.', 'esercizio sconosciuto: errore');
    t.ok(/«COLORE»/.test(D.demoFeedbackText({ taskMode: 'switching' }, { ruleDef: { label: 'COLORE' } }, 'hit')), 'switching: cita la regola');
    t.ok(/cambiata/.test(D.demoFeedbackText({ taskMode: 'switching' }, { ruleDef: { label: 'X' }, isSwitch: true }, 'miss')), 'switching: segnala il cambio');
    t.ok(/la stessa/.test(D.demoFeedbackText({ taskMode: 'switching' }, { ruleDef: { label: 'X' }, isSwitch: false }, 'miss')), 'switching: segnala la ripetizione');
    t.ok(/colore/.test(D.demoFeedbackText({ taskMode: 'simon', simonMateriale: 'colori' }, { congruency: 'incongruent' }, 'miss')), 'simon colori');
    t.ok(/pari o dispari/.test(D.demoFeedbackText({ taskMode: 'simon', simonMateriale: 'numeri' }, {}, 'hit')), 'simon numeri');
    t.ok(/tirava/.test(D.demoFeedbackText({ taskMode: 'simon' }, { congruency: 'incongruent' }, 'hit')), 'simon incongruente: nota sulla posizione');
    t.ok(!/tirava/.test(D.demoFeedbackText({ taskMode: 'simon' }, { congruency: 'congruent' }, 'hit')), 'simon congruente: nessuna nota');
  });

  t.group('preset: contiene solo il protocollo, mai dati di seduta', () => {
    const cfg = R.defaultCfg();
    const p = R.presetCfgOf(cfg);
    ['patientCode', 'note', 'notes', 'patientId'].forEach(k => t.ok(!(k in p), 'nessun ' + k));
    t.eq(p.taskMode, cfg.taskMode, 'taskMode');
    t.eq(p.trials, cfg.trials, 'prove');
    t.eq(p.isi, cfg.isi, 'isi');
    t.eq(p.inputDevice, 'touch', 'dispositivo di default');
    t.eq(p.keyLayout, 'standard', 'tastiera di default');
    const bare = R.presetCfgOf(Object.assign(R.defaultCfg(), { inputDevice: undefined, keyLayout: undefined, sequenzaMista: undefined, nbackMista: undefined, gonogoMista: undefined }));
    t.eq(bare.inputDevice, 'touch', 'senza dispositivo: touch');
    t.eq(bare.keyLayout, 'standard', 'senza tastiera: standard');
    t.eq([bare.sequenzaMista, bare.nbackMista, bare.gonogoMista], ['no', 'no', 'no'], 'senza mista: no');
    t.eq(p.sequenzaMista, 'no', 'sequenzaMista di default');
    t.eq(p.zoneGrandi, false, 'zoneGrandi booleano');
    // la sequenza bersaglio viene salvata come etichette (non come oggetti) quando non è mista
    const c2 = Object.assign(R.defaultCfg(), { taskMode: 'sequenza', stimType: 'lettere', targetSeq: [{ icon: 'A' }, { icon: 'B' }, { icon: 'C' }] });
    t.eq(p.targetSeq === null || Array.isArray(p.targetSeq), true, 'targetSeq: array o null');
    // Comportamento già presente (non modificato): sequenzaMista vale 'no' (stringa, quindi vera), perciò anche la sequenza semplice
    // viene salvata come oggetti {stimType, label}; JSON.stringify scarta stimType se manca.
    t.eq(R.presetCfgOf(c2).targetSeq.map(x => x.label), ['A', 'B', 'C'], 'sequenza: etichette salvate');
    const c3 = Object.assign(R.defaultCfg(), { taskMode: 'sequenza', sequenzaMista: 'visivo', targetSeq: [{ stimType: 'lettere', item: 'A' }] });
    t.eq(R.presetCfgOf(c3).targetSeq, [{ stimType: 'lettere', label: 'A' }], 'sequenza mista: oggetti con etichetta');
    const c4 = Object.assign(R.defaultCfg(), { taskMode: 'switching' });
    t.eq(R.presetCfgOf(c4).targetSeq, null, 'esercizio senza sequenza: null');
    // titrationMode: solo per gli esercizi che lo hanno
    const c5 = Object.assign(R.defaultCfg(), { taskMode: 'gonogo', titrationMode: undefined });
    t.eq(R.presetCfgOf(c5).titrationMode, 'manuale', 'titrationMode di default manuale');
    t.eq(R.presetCfgOf(Object.assign(R.defaultCfg(), { taskMode: 'sequenza' })).titrationMode, 'manuale', 'sequenza: manuale di default');
    // copia: modificare il preset non tocca la cfg
    c2.targetSeq.push({ icon: 'D' });
    t.eq(R.presetCfgOf(c2).targetSeq.length, 4, 'segue la cfg al momento della chiamata');
  });

  t.group('sequenza mista casuale', () => {
    const types = P.mistaTypesFor('visivo');
    for (let n = 0; n < 50; n++) {
      const seq = P.randomMistaTargetSeq(3, types);
      t.eq(seq.length, 3, 'lunghezza 3');
      let dup = false;
      for (let i = 0; i < seq.length; i++) for (let j = i + 1; j < seq.length; j++) if (P.sameStim(seq[i], seq[j])) dup = true;
      t.ok(!dup, 'nessun duplicato');
      t.ok(seq.every(x => x && typeof x === 'object' && 'stimType' in x), 'elementi con stimType');
    }
    t.eq(P.randomMistaTargetSeq(0, types).length, 0, 'lunghezza 0');
  });
};
