'use strict';
// Valutazione delle prove (js/exercises/resolve.js, passo 5e): conteggi hit/miss/FA/CR, scelta,
// categorizzazione, doppio compito, scala di livello. cfg e session si passano come parametri.
const { importCore } = require('./lib/core');

function mkSession(o) {
  return Object.assign({ idx: 0, responses: new Set(), respTime: null, rts: [],
    counts: { targets: 0, nonTargets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 },
    countsAud: { targets: 0, nonTargets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 },
    fatigueLog: [], discrimLog: [], discrimCongLog: [], choiceLog: [], adaptBlock: [], adaptRTHistory: [], levelChanges: [],
    adaptLevel: 5, liveNLevel: 3, categLevel: 2, tapatLevel: 4, dualLevel1: 4, dualLevel2: 4, adaptBlock1: [], adaptBlock2: [] }, o);
}
const cfgOf = (taskMode, o) => Object.assign({ taskMode, respMode: 'touch', adaptive: false, isi: 2000, ssdStep: 50 }, o);

module.exports = async function run(t) {
  const R = await importCore('../exercises/resolve.js');

  t.group('resolveSignal — hit / miss / falso allarme / rifiuto corretto', () => {
    const cfg = cfgOf('gonogo');
    const cases = [
      [true, true, 'hit', 'hits', true], [true, false, 'err', 'misses', false],
      [false, true, 'err', 'falseAlarms', false], [false, false, 'hit', 'correctRejections', true]];
    cases.forEach(([isTarget, tapped, outcome, key, correct]) => {
      const s = mkSession({ respTime: 400 });
      if (tapped) s.responses.add('go');
      t.eq(R.resolveSignal(cfg, s, { valid: true, isTarget }), outcome, (isTarget ? 'bersaglio' : 'non bersaglio') + (tapped ? ' con tocco' : ' senza tocco') + ' → ' + outcome);
      t.eq(s.counts[key], 1, 'incrementa ' + key);
      t.eq(s.counts[isTarget ? 'targets' : 'nonTargets'], 1, 'conta ' + (isTarget ? 'targets' : 'nonTargets'));
      t.eq(s.fatigueLog, [correct], 'fatigueLog registra la correttezza');
      t.eq(s.rts.length, isTarget && tapped ? 1 : 0, 'RT registrato solo sugli hit');
    });
    t.eq(R.resolveSignal(cfg, mkSession(), { valid: false }), null, 'prova non valida → null, nessun conteggio');
    const sm = mkSession();
    t.eq(R.resolveSignal(cfgOf('gonogo', { respMode: 'manuale' }), sm, { valid: true, isTarget: true }), 'pend', 'risposta manuale → pend');
    t.eq(sm.counts.targets, 1, 'in manuale conta comunque il bersaglio');
    t.eq(sm.counts.hits + sm.counts.misses, 0, 'in manuale non assegna hit/miss');
  });

  t.group('resolveSignal — alimenta la scala adattiva solo per gli esercizi previsti', () => {
    ['nback', 'sequenza', 'gonogo'].forEach(m => {
      const s = mkSession(); s.responses.add('go');
      R.resolveSignal(cfgOf(m), s, { valid: true, isTarget: true });
      t.eq(s.adaptBlock.length, 1, m + ': una prova entra nel blocco adattivo');
    });
    const s1 = mkSession(); R.resolveSignal(cfgOf('stopsignal'), s1, { valid: true, isTarget: true, isStopTrial: false });
    t.eq(s1.adaptBlock.length, 1, 'stopsignal: le prove go alimentano il blocco');
    const s2 = mkSession({ currentSSD: 200, ssdHistory: [] }); R.resolveSignal(cfgOf('stopsignal'), s2, { valid: true, isTarget: false, isStopTrial: true });
    t.eq(s2.adaptBlock.length, 0, 'stopsignal: le prove di stop NON alimentano il blocco');
  });

  t.group('resolveSignal — staircase SSD dello Stop-Signal', () => {
    const cfg = cfgOf('stopsignal', { isi: 2000, ssdStep: 50 });
    const ok = mkSession({ currentSSD: 200, ssdHistory: [] });
    R.resolveSignal(cfg, ok, { valid: true, isTarget: false, isStopTrial: true }); // non tocca = stop riuscito
    t.eq(ok.currentSSD, 250, 'stop riuscito → SSD più lungo (+step)');
    const ko = mkSession({ currentSSD: 200, ssdHistory: [] }); ko.responses.add('go');
    R.resolveSignal(cfg, ko, { valid: true, isTarget: false, isStopTrial: true });
    t.eq(ko.currentSSD, 150, 'stop fallito → SSD più corto (−step)');
    const lo = mkSession({ currentSSD: 20, ssdHistory: [] }); lo.responses.add('go');
    R.resolveSignal(cfg, lo, { valid: true, isTarget: false, isStopTrial: true });
    t.eq(lo.currentSSD, 0, 'SSD non scende sotto 0');
    const hi = mkSession({ currentSSD: 1890, ssdHistory: [] });
    R.resolveSignal(cfg, hi, { valid: true, isTarget: false, isStopTrial: true });
    t.eq(hi.currentSSD, 1900, 'SSD non supera isi−100');
    t.eq(ok.ssdHistory, [250], 'lo storico SSD registra il valore');
  });

  t.group('resolveSignal — Stop-Signal a due scelte: discriminazione ortogonale', () => {
    const cfg = cfgOf('stopsignal');
    const s = mkSession({ respTime: 500 }); s.responses.add('left');
    const out = R.resolveSignal(cfg, s, { valid: true, isTarget: true, isStopTrial: false, correctAnswer: 'right', congruency: 'incongruent' });
    t.eq(out, 'err', 'tasto sbagliato → errore');
    t.eq(s.counts.hits, 1, 'ma hit/FA restano quelli della sola presenza di risposta');
    t.eq(s.discrimLog, [false], 'discrimLog registra l\'errore di discriminazione');
    t.eq(s.discrimCongLog, [{ congruent: false, correct: false, rt: 500 }], 'registra la condizione di congruenza');
    t.eq(s.fatigueLog, [false], 'la correttezza per la fatica è falsa');
  });

  t.group('resolveChoice — ANT/switching/simon/mantenimento/tapat', () => {
    const cfg = cfgOf('ant');
    const s = mkSession({ respTime: 600 }); s.responses.add('left');
    t.eq(R.resolveChoice(cfg, s, { correctAnswer: 'left', cueType: 'spatial', congruency: 'congruent', isSwitch: false, block: 1, side: 'left' }), 'hit', 'risposta giusta → hit');
    t.eq(s.choiceLog[0], { correct: true, rt: 600, omitted: false, isSwitch: false, cueType: 'spatial', congruency: 'congruent', block: 1, side: 'left' }, 'choiceLog completo');
    t.eq(s.adaptBlock.length, 1, 'la prova entra nel blocco adattivo');
    const w = mkSession({ respTime: 600 }); w.responses.add('right');
    t.eq(R.resolveChoice(cfg, w, { correctAnswer: 'left' }), 'err', 'risposta sbagliata → err');
    t.eq(w.choiceLog[0].rt, null, 'RT null se sbagliata');
    const o = mkSession();
    R.resolveChoice(cfg, o, { correctAnswer: 'left' });
    t.ok(o.choiceLog[0].omitted && !o.choiceLog[0].correct, 'nessun tocco = omessa e sbagliata');
    t.eq(R.resolveChoice(cfgOf('ant', { respMode: 'manuale' }), mkSession(), { correctAnswer: 'left' }), 'pend', 'manuale → pend');
  });

  t.group('resolveChoice — TAPAT spaziale: gradiente cambia a fine blocco di 8', () => {
    const cfg = cfgOf('tapat', { tapatSpatial: true, adaptive: true });
    const s = mkSession({ liveTapatGradient: 50 });
    for (let i = 0; i < 8; i++) {
      s.responses = new Set(); s.respTime = 500;
      const side = i < 4 ? 'left' : 'right';
      if (side === 'right') s.responses.add('go'); // a sinistra non risponde (omissione), a destra sì
      R.resolveChoice(cfg, s, { correctAnswer: 'go', side, block: 'phasic' });
    }
    t.eq(s.liveTapatGradient, 55, 'sinistra più debole → +5 verso sinistra');
    t.eq(s.spatialBlock, [], 'il blocco spaziale riparte');
  });

  t.group('resolveCategorization — i nogo si superano NON toccando', () => {
    const cfg = cfgOf('categorizzazione');
    const a = mkSession({ respTime: 500 });
    t.eq(R.resolveCategorization(cfg, a, { valid: true, correctAnswer: 'nogo' }), 'hit', 'nogo senza tocco → hit');
    t.eq(a.choiceLog[0], { correct: true, rt: null, omitted: false }, 'nogo corretto: nessun RT, non conta come omissione');
    const b = mkSession({ respTime: 500 }); b.responses.add('a');
    t.eq(R.resolveCategorization(cfg, b, { valid: true, correctAnswer: 'nogo' }), 'err', 'nogo con tocco → err');
    const c = mkSession();
    R.resolveCategorization(cfg, c, { valid: true, correctAnswer: 'a' });
    t.ok(c.choiceLog[0].omitted, 'risposta richiesta e mancata → omessa');
    t.eq(c.adaptBlock.length, 0, 'senza adattivo non alimenta il blocco');
    const d = mkSession({ respTime: 300 }); d.responses.add('a');
    R.resolveCategorization(cfgOf('categorizzazione', { adaptive: true }), d, { valid: true, correctAnswer: 'a' });
    t.eq(d.adaptBlock.length, 1, 'con adattivo alimenta il blocco');
    t.eq(R.resolveCategorization(cfg, mkSession(), { valid: false }), null, 'prova non valida → null');
  });

  t.group('resolveDualTask — due canali valutati separatamente', () => {
    const cfg = cfgOf('dualtask');
    const s = mkSession(); s.responses.add('vis');
    const out = R.resolveDualTask(cfg, s, { valid: true, visualIsTarget: true, audioIsTarget: true });
    t.eq(out, 'err', 'basta un canale sbagliato per essere errore');
    t.eq([s.counts.hits, s.countsAud.misses], [1, 1], 'visivo hit, uditivo miss');
    t.eq([s.adaptBlock1, s.adaptBlock2], [[true], [false]], 'i blocchi adattivi sono indipendenti');
    const g = mkSession(); g.responses.add('vis'); g.responses.add('aud');
    t.eq(R.resolveDualTask(cfg, g, { valid: true, visualIsTarget: true, audioIsTarget: true }), 'hit', 'entrambi giusti → hit');
    const f = mkSession(); f.responses.add('aud');
    R.resolveDualTask(cfg, f, { valid: true, visualIsTarget: false, audioIsTarget: false });
    t.eq(f.countsAud.falseAlarms, 1, 'falso allarme uditivo');
    t.eq(f.counts.correctRejections, 1, 'rifiuto corretto visivo');
  });

  t.group('maybeAdapt / maybeAdaptDualChannel — blocco di 8, soglie 0.85 / 0.70', () => {
    const cfg = cfgOf('gonogo', { adaptive: true, adaptStartLevel: 6 }); // fascia Go/No-Go 5-7: il 6 sta a metà
    const S = o => mkSession(Object.assign({ adaptLevel: 6 }, o));
    const up = S({ adaptBlock: Array(8).fill(true) });
    R.maybeAdapt(cfg, up);
    t.eq(up.adaptLevel, 7, '8/8 corretti → sale di 1');
    t.eq(up.adaptBlock, [], 'il blocco si azzera');
    t.eq(up.levelChanges[0].how, 'auto', 'cambio registrato come automatico');
    const down = S({ adaptBlock: [true, true, true, true, true, false, false, false] }); // 5/8 = 0.625
    R.maybeAdapt(cfg, down);
    t.eq(down.adaptLevel, 5, '5/8 → scende di 1');
    const stay = S({ adaptBlock: [true, true, true, true, true, true, false, false] }); // 6/8 = 0.75
    R.maybeAdapt(cfg, stay);
    t.eq(stay.adaptLevel, 6, '6/8 → resta');
    t.eq(stay.adaptBlock, [], 'il blocco si azzera comunque');
    const floor = S({ adaptLevel: 5, adaptBlock: Array(8).fill(false) });
    R.maybeAdapt(cfg, floor);
    t.eq(floor.adaptLevel, 5, 'al limite inferiore della fascia strutturale (5) non scende');
    const short = S({ adaptBlock: Array(7).fill(true) });
    R.maybeAdapt(cfg, short);
    t.eq([short.adaptLevel, short.adaptBlock.length], [6, 7], 'blocco incompleto: nessuna decisione');
    const off = S({ adaptBlock: Array(8).fill(true) });
    R.maybeAdapt(cfgOf('gonogo', { adaptive: false }), off);
    t.eq(off.adaptLevel, 6, 'senza adattivo non cambia nulla');
    const dual = mkSession({ adaptBlock1: Array(8).fill(true), adaptBlock2: Array(8).fill(false) });
    R.maybeAdaptDualChannel(cfgOf('dualtask', { adaptive: true }), dual, 1);
    R.maybeAdaptDualChannel(cfgOf('dualtask', { adaptive: true }), dual, 2);
    t.eq([dual.dualLevel1, dual.dualLevel2], [5, 3], 'canali adattati indipendentemente');
    t.eq(dual.levelChanges.map(c => c.canale), [1, 2], 'cambi registrati per canale');
  });

  t.group('pushAdaptOutcome — restituisce la lunghezza del blocco prima del reset', () => {
    const cfg = cfgOf('gonogo', { adaptive: true, adaptStartLevel: 6 });
    const s = mkSession({ adaptLevel: 6, adaptBlock: Array(7).fill(true) });
    t.eq(R.pushAdaptOutcome(cfg, s, true, 400), 8, 'restituisce 8 (il blocco si è appena valutato)');
    t.eq(s.adaptBlock, [], 'e il blocco è stato azzerato');
    t.eq(s.adaptLevel, 7, 'il livello è salito');
    const q = mkSession({ adaptRTHistory: [400, 400, 400, 400] });
    R.pushAdaptOutcome(cfg, q, true, 1200); // oltre 1.6 × mediana: corretta ma lenta
    t.eq(q.adaptBlock, [false], 'risposta corretta ma troppo lenta non conta come successo pieno');
  });
};
