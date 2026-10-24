'use strict';
// Record di una seduta (js/exercises/record.js, passo 5i): d', accuratezza, nota di affaticamento e il record costruito
// per ogni famiglia di esercizio. Prima di questo passo nessun test guardava questi punteggi direttamente.
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const Rec = await importCore('../exercises/record.js');
  const Reg = await importCore('../exercises/registry.js');
  const Goal = await importCore('../exercises/goaltask.js');
  const Mem = await importCore('../exercises/memoria.js');

  const cfgOf = (taskMode, over) => Object.assign(Reg.defaultCfg(), { taskMode }, over || {});
  const ctx0 = { patientProfile: null, activeLocalPatientId: null, activeRemotePatientId: null, dateLabel: '25/10/2026' };
  const build = (cfg, session, ctx) => Rec.buildSessionRecord(cfg, session, 60000, Object.assign({}, ctx0, ctx || {}));
  const counts = (o) => Object.assign({ targets: 0, nonTargets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 }, o);

  t.group('scoreFromCounts — d\', tassi e accuratezza', () => {
    const s = Rec.scoreFromCounts(counts({ targets: 10, nonTargets: 10, hits: 8, misses: 2, falseAlarms: 2, correctRejections: 8 }));
    t.eq([s.hitRate, s.faRate, s.acc], [0.8, 0.2, 0.8], 'hitRate 0.8, faRate 0.2, accuratezza 0.8');
    t.approx(s.dprime, 1.49, 0.03, 'd\' ≈ 1.49 (correzione log-lineare di Hautus)');
    const inv = Rec.scoreFromCounts(counts({ targets: 10, nonTargets: 10, hits: 2, misses: 8, falseAlarms: 8, correctRejections: 2 }));
    t.approx(inv.dprime, -s.dprime, 0.001, 'scambiando hit e falsi allarmi d\' cambia segno');
    const caso = Rec.scoreFromCounts(counts({ targets: 10, nonTargets: 10, hits: 5, misses: 5, falseAlarms: 5, correctRejections: 5 }));
    t.approx(caso.dprime, 0, 0.001, 'prestazione casuale → d\' ≈ 0');
    const perfetto = Rec.scoreFromCounts(counts({ targets: 10, nonTargets: 10, hits: 10, correctRejections: 10 }));
    t.ok(Number.isFinite(perfetto.dprime) && perfetto.dprime > 3, 'prestazione perfetta: d\' finito (correzione) e alto');
    t.eq(perfetto.acc, 1, 'accuratezza 1');
    const senza = Rec.scoreFromCounts(counts({ targets: 0, nonTargets: 10, correctRejections: 10 }));
    t.eq([senza.dprime, senza.hitRate, senza.acc], [null, 0, 1], 'senza bersagli: d\' null, hitRate 0');
    t.eq(Rec.scoreFromCounts(counts({})).acc, 0, 'nessuna prova: accuratezza 0 (nessuna divisione per zero)');
  });

  t.group('computeFatigueNote — calo di accuratezza fra primo e ultimo terzo', () => {
    t.eq(Rec.computeFatigueNote(Array(8).fill(true)), null, 'sotto 9 prove: null');
    const calo = Array(12).fill(true).fill(false, 8);
    const n = Rec.computeFatigueNote(calo);
    t.eq([n.accFirst, n.accLast, n.drop, n.flag], [1, 0, 1, true], 'primo terzo tutto giusto, ultimo tutto sbagliato → calo 1, segnalato');
    t.eq(Rec.computeFatigueNote(Array(12).fill(true)).flag, false, 'nessun calo → non segnalato');
    const lim1 = Array(40).fill(true); lim1.fill(false, 27, 29); // ultimo terzo (13): 11/13
    t.eq(Rec.computeFatigueNote(lim1).flag, true, 'calo di 15,4 punti (≥ 0.15) → segnalato');
    const lim2 = Array(40).fill(true); lim2[39] = false;       // ultimo terzo: 12/13
    t.eq(Rec.computeFatigueNote(lim2).flag, false, 'calo di 7,7 punti → non segnalato');
    t.eq(Rec.computeFatigueNote(Array(12).fill(false).fill(true, 8)).flag, false, 'miglioramento → non segnalato');
  });

  t.group('rtMeanOf', () => {
    t.eq(Rec.rtMeanOf([100, 200, null, 300]), 200, 'ignora i null');
    t.eq(Rec.rtMeanOf([null, null]), null, 'solo null → null');
    t.eq(Rec.rtMeanOf([]), null, 'vuoto → null');
  });

  t.group('intestazione del record: identità, contesto, livello finale', () => {
    const cfg = cfgOf('nback', { patientCode: 'P7', notes: 'n', respMode: 'paziente' });
    const sess = { liveNLevel: 4, counts: counts({ targets: 4, nonTargets: 4, hits: 3, correctRejections: 4, misses: 1 }), rts: [400, 600], fatigueLog: [], levelChanges: [] };
    const r = build(cfg, sess);
    t.ok(typeof r.id === 'string' && r.id.length > 8 && typeof r.ts === 'number', 'id e timestamp');
    t.ok(build(cfg, sess).id !== r.id, 'id diverso a ogni record');
    t.eq([r.dateLabel, r.taskMode, r.family, r.patientCode, r.notes, r.durationMs], ['25/10/2026', 'nback', 'signal', 'P7', 'n', 60000], 'dati di base');
    t.eq([r.finalLevel, r.finalNLevel, r.titrationMode, r.targetSeq], [4, 4, 'manuale', null], 'livello finale; N-back non usa sequenza bersaglio');
    t.eq([r.localPatientId, r.pazienteId], [null, null], 'senza profilo attivo: nessun id paziente');
    t.eq(build(cfg, sess, { activeLocalPatientId: 'L1' }).localPatientId, 'L1', 'profilo in presenza → localPatientId');
    const rem = build(cfg, sess, { activeRemotePatientId: 'R1' });
    t.eq([rem.pazienteId, rem.localPatientId], ['R1', null], 'paziente remoto scelto dall\'operatore → pazienteId');
    const pz = build(cfg, sess, { patientProfile: { id: 'P' }, activeLocalPatientId: 'L1', activeRemotePatientId: 'R1' });
    t.eq([pz.pazienteId, pz.localPatientId], [null, null], 'se chi accede è il paziente, gli id dell\'operatore non si registrano');
    const sq = build(cfgOf('sequenza'), { counts: counts({ targets: 1, hits: 1 }), rts: [], fatigueLog: [], adaptLevel: 3, levelChanges: [] });
    t.ok(Array.isArray(sq.targetSeq) && sq.targetSeq.length === 3 && sq.targetSeq.every(x => typeof x === 'string'), 'sequenza: bersagli registrati come etichette');
    t.eq(sq.finalLevel, 3, 'sequenza: il livello finale registrato è adaptLevel della seduta (anche se non adattiva)');
    const gn = build(cfgOf('gonogo'), { counts: counts({}), rts: [], fatigueLog: [], adaptLevel: 6, levelChanges: [] });
    t.eq(gn.finalLevel, 6, 'Go/No-Go: livello finale = adaptLevel');
  });

  t.group('famiglia signal — N-back, LISAS, nota di affaticamento', () => {
    const cfg = cfgOf('nback', { adaptive: true });
    const fat = Array(12).fill(true).fill(false, 8);
    const sess = { liveNLevel: 5, counts: counts({ targets: 6, nonTargets: 6, hits: 5, misses: 1, falseAlarms: 1, correctRejections: 5 }), rts: [400, 500, 600], fatigueLog: fat, levelChanges: [{ trialIdx: 7, level: 5, how: 'auto' }] };
    const r = build(cfg, sess);
    t.eq(r.avgRT, 500, 'RT medio');
    t.eq([r.metrics.hitRate, r.metrics.faRate], [5 / 6, 1 / 6], 'tassi');
    t.ok(r.metrics.lisas != null, 'LISAS calcolato per N-back');
    t.eq(r.fatigueNote.flag, true, 'affaticamento segnalato');
    t.eq([r.adaptive, r.levelChanges], [true, sess.levelChanges], 'adattivo e cambi di livello registrati');
    const senza = build(cfg, Object.assign({}, sess, { levelChanges: [] }));
    t.eq(senza.levelChanges, null, 'nessun cambio → null');
    const ss = build(cfgOf('stopsignal'), { counts: counts({}), rts: [500, 700], fatigueLog: [], adaptLevel: 3, levelChanges: [],
      ssdHistory: [200, 300], discrimLog: [true, true, false, true], discrimCongLog: [
        { congruent: true, correct: true, rt: 500 }, { congruent: true, correct: true, rt: 540 },
        { congruent: false, correct: true, rt: 600 }, { congruent: false, correct: false, rt: 900 }] });
    t.eq(ss.metrics.lisas, undefined, 'Stop-Signal: niente LISAS (ha SSRT)');
    t.eq([ss.meanSSD, ss.ssrt, ss.goAccuracy], [250, 350, 0.75], 'SSD medio 250, SSRT = RT medio 600 − 250 = 350, accuratezza go 0.75');
    t.eq([ss.conflict, ss.congAccuracy, ss.incongAccuracy], [80, 1, 0.5], 'conflitto = 600 − 520 = 80; accuratezze per congruenza');
    const ssNeg = build(cfgOf('stopsignal'), { counts: counts({}), rts: [100], fatigueLog: [], adaptLevel: 3, levelChanges: [], ssdHistory: [400], discrimLog: [], discrimCongLog: [] });
    t.eq(ssNeg.ssrt, 0, 'SSRT non scende sotto 0');
    t.eq(build(cfgOf('stopsignal'), { counts: counts({}), rts: [], fatigueLog: [], adaptLevel: 3, levelChanges: [], ssdHistory: [200], discrimLog: [], discrimCongLog: [] }).ssrt, null, 'senza RT: SSRT null');
  });

  t.group('famiglia choice — conteggi, EZ-diffusion, indici per esercizio', () => {
    const L = (correct, rt, extra) => Object.assign({ correct, rt: correct ? rt : null, omitted: false }, extra);
    const antLog = [
      L(true, 600, { cueType: 'none', congruency: 'congruent' }), L(true, 580, { cueType: 'none', congruency: 'incongruent' }),
      L(true, 500, { cueType: 'center', congruency: 'congruent' }), L(true, 560, { cueType: 'center', congruency: 'incongruent' }),
      L(true, 450, { cueType: 'spatial', congruency: 'congruent' }), L(false, 0, { cueType: 'spatial', congruency: 'incongruent' })];
    const ant = build(cfgOf('ant'), { choiceLog: antLog, adaptLevel: 2, levelChanges: [] });
    t.eq([ant.choice.total, ant.choice.correct, ant.choice.omitted], [6, 5, 0], 'totali, corrette, omesse');
    t.approx(ant.choice.accuracy, 5 / 6, 1e-9, 'accuratezza');
    t.eq([ant.choice.alerting, ant.choice.orienting], [Math.round(590 - 530), Math.round(530 - 450)], 'allerta = nessun cue − cue centrale; orientamento = centrale − spaziale');
    t.eq(ant.choice.conflict, Math.round(((580 + 560) / 2) - ((600 + 500 + 450) / 3)), 'conflitto = RT incongruenti − congruenti (solo corrette)');
    t.ok(ant.choice.ezdiff && ant.choice.lisas != null, 'EZ-diffusion e LISAS presenti');
    const poche = build(cfgOf('simon'), { choiceLog: [L(true, 500, { congruency: 'congruent' })], adaptLevel: 2, levelChanges: [] });
    t.eq(poche.choice.conflict, null, 'un solo RT: conflitto null, nessun errore');

    const sw = build(cfgOf('switching', { switchMaterial: 'bivalente' }), { adaptLevel: 6, levelChanges: [], choiceLog: [
      L(true, 800, { isSwitch: true, congruency: 'incongruent' }), L(true, 600, { isSwitch: false, congruency: 'congruent' }),
      L(false, 0, { isSwitch: true, congruency: 'congruent' }), L(true, 600, { isSwitch: false, congruency: 'incongruent' })] });
    t.eq([sw.choice.switchCost, sw.choice.switchCostRelative], [200, +(200 / 600).toFixed(3)], 'costo di switching assoluto e relativo al RT di ripetizione');
    t.eq([sw.choice.switchAcc, sw.choice.repAcc], [0.5, 1], 'accuratezza separata per switch e ripetizione');
    t.eq(sw.choice.conflict, 100, 'bivalente: conflitto = RT incongruenti (800, 600 → 700) − congruenti (600) = 100');
    const swNum = build(cfgOf('switching', { switchMaterial: 'numeri' }), { adaptLevel: 3, levelChanges: [], choiceLog: [L(true, 800, { isSwitch: true }), L(true, 600, { isSwitch: false })] });
    t.eq(swNum.choice.conflict, undefined, 'materiale non bivalente: nessun conflitto');

    const sim = build(cfgOf('simon'), { adaptLevel: 4, levelChanges: [], choiceLog: [
      L(true, 500, { congruency: 'congruent' }), L(true, 550, { congruency: 'congruent' }), L(true, 650, { congruency: 'incongruent' }), L(false, 0, { congruency: 'incongruent' })] });
    t.eq([sim.choice.conflict, sim.choice.congAccuracy, sim.choice.incongAccuracy], [125, 1, 0.5], 'Simon: effetto = 650 − 525; accuratezze per congruenza');

    const omit = build(cfgOf('ant'), { adaptLevel: 2, levelChanges: [], choiceLog: Array.from({ length: 12 }, (_, i) => ({ correct: i < 8, rt: 500, omitted: i >= 8, cueType: 'none', congruency: 'congruent' })) });
    t.eq([omit.choice.omitted, omit.fatigueNote.flag], [4, true], 'omissioni contate; le omesse contano come errori nell\'affaticamento');

    const tp = build(cfgOf('tapat', { adaptive: true }), { tapatLevel: 5, levelChanges: [], choiceLog: [
      L(true, 500, { block: 'tonic' }), { correct: false, rt: null, omitted: true, block: 'tonic' }, L(true, 700, { block: 'phasic' }), L(true, 600, { block: 'phasic' })] });
    t.eq([tp.choice.tonicMeanRT, tp.choice.tonicOmissions, tp.choice.tonicTotal, tp.choice.phasicMeanRT], [500, 1, 2, 650], 'TAPAT: blocchi tonico e fasico');
    t.eq([tp.choice.finalTapatLevel, tp.finalLevel, tp.tapatModalita], [5, 5, 'visivo'], 'TAPAT: livello finale e modalità');
  });

  t.group('famiglia dual — due canali e media', () => {
    const r = build(cfgOf('dualtask'), { dualLevel1: 4, dualLevel2: 6,
      counts: counts({ targets: 5, nonTargets: 5, hits: 5, correctRejections: 5 }), countsAud: counts({ targets: 5, nonTargets: 5, hits: 3, misses: 2, falseAlarms: 1, correctRejections: 4 }) });
    t.eq(r.finalLevel, '4/6', 'livello finale per canale');
    t.approx(r.metricsCombined.acc, (1 + 0.7) / 2, 1e-9, 'accuratezza combinata = media dei due canali');
    t.approx(r.metricsCombined.dprime, (r.metrics.dprime + r.metricsAud.dprime) / 2, 1e-9, 'd\' combinato = media');
    t.eq(r.dualPairing, 'vis-aud', 'abbinamento registrato');
    const nz = build(cfgOf('dualtask'), { dualLevel1: 1, dualLevel2: 1, counts: counts({ targets: 0, nonTargets: 4, correctRejections: 4 }), countsAud: counts({ targets: 2, nonTargets: 2, hits: 2, correctRejections: 2 }) });
    t.eq(nz.metricsCombined.dprime, null, 'un canale senza bersagli: d\' combinato null');
  });

  t.group('famiglia spatial — Neglect classico e conteggio a regola', () => {
    const classico = build(cfgOf('neglect'), { liveBoardLevel: 6, results: [
      { targetsLeft: 5, targetsRight: 5, foundLeft: 3, foundRight: 5, falseAlarms: 1, timeMs: 20000 },
      { targetsLeft: 5, targetsRight: 5, foundLeft: 5, foundRight: 5, falseAlarms: 0, timeMs: 30000 }] });
    const n = classico.neglect;
    t.eq([n.boards, n.targetsLeft, n.foundLeft, n.omittedLeft, n.omittedRight, n.falseAlarms], [2, 10, 8, 2, 0, 1], 'somme per lato e omissioni');
    t.eq([n.pctLeft, n.pctRight, n.asymmetry, n.meanTimeMs], [0.8, 1, -20, 25000], 'percentuali, asimmetria (negativa = più omissioni a sinistra) e tempo medio');
    t.ok(n.lisas != null, 'LISAS per tavola');
    t.eq(classico.finalLevel, 6, 'livello finale = livello tavola');
    const conteggio = build(cfgOf('neglect', { neglectMode: 'regola' }), { liveBoardLevel: 3, results: [
      { modalitaConteggio: true, conteggioAtteso: 5, conteggioDato: 5, corretto: true, targetsLeft: 3, targetsRight: 2, timeMs: 10000 },
      { modalitaConteggio: true, conteggioAtteso: 6, conteggioDato: 4, corretto: false, targetsLeft: 3, targetsRight: 3, timeMs: 14000 }] });
    const c = conteggio.neglect;
    t.eq([c.modalitaConteggio, c.conteggiCorretti, c.conteggiTotali, c.accuratezzaConteggio, c.erroreAssolutoMedio], [true, 1, 2, 0.5, 1], 'conteggio: corretti, accuratezza, errore assoluto medio');
    t.eq([c.foundLeft, c.pctLeft, c.asymmetry, c.falseAlarms], [null, null, null, null], 'conteggio: nessuna misura per lato');
    const solo = build(cfgOf('neglect'), { liveBoardLevel: 1, results: [{ targetsLeft: 0, targetsRight: 4, foundLeft: 0, foundRight: 4, falseAlarms: 0, timeMs: 1000 }] });
    t.eq([solo.neglect.pctLeft, solo.neglect.asymmetry], [null, null], 'senza bersagli a sinistra: percentuale e asimmetria null');
  });

  t.group('famiglia span — Running Span', () => {
    const r = build(cfgOf('runningspan'), { results: [
      { n: 3, posAcc: 1, contentAcc: 0.5, seqLen: 6, rt: 4000 }, { n: 3, posAcc: 0.5, contentAcc: 1, seqLen: 8, rt: 6000 }, { n: 3, posAcc: 1, contentAcc: 1, seqLen: 7, rt: null }] });
    t.eq([r.span.n, r.span.posAccMean, r.span.contentAccMean, r.span.seqLenMean, r.span.meanRT], [3, 2.5 / 3, 2.5 / 3, 7, 5000], 'medie del Running Span');
    t.ok(r.span.lisas != null, 'LISAS sui cicli con richiamo perfetto');
    t.eq(build(cfgOf('runningspan'), { results: [] }).span.n, null, 'nessun ciclo: n null senza errori');
  });

  t.group('famiglia goaltask e memoria', () => {
    const scen = Goal.goalTaskInstanceFor('sei_compiti_classico', 2);
    const st = Goal.startGoalTask(scen);
    Goal.completeGoalTaskItem(st, scen.items[0].id);
    const g = build(cfgOf('goaltask'), st);
    t.eq([g.goaltask.scenario, g.goaltask.livello, g.goaltask.completatiCount, g.goaltask.totaleElementi], ['sei_compiti_classico', 2, 1, scen.items.length], 'scenario, livello e completamento');
    t.eq(g.goaltask.budgetSecondi, 600, 'budget registrato');
    t.eq(g.finalLevel, 2, 'livello finale = livello scenario');

    const cfgM = cfgOf('memoria', { memoriaModo: 'pqrst', memoriaLivello: 1, memoriaFormaIdx: 1 });
    const mat = Mem.memoriaMaterialFor(cfgM);
    const recall = {}; mat.unita.forEach((u, i) => { recall[i] = i < 2; });
    const m = build(cfgM, { material: mat, recall });
    t.eq([m.memoria.modo, m.memoria.materiale, m.memoria.livello, m.memoria.titolo], ['pqrst', 'brano', 1, mat.titolo], 'modo, materiale, livello, titolo');
    t.eq([m.memoria.recuperati, m.memoria.totale, m.memoria.percentuale], [2, mat.unita.length, Math.round(2 / mat.unita.length * 100)], 'idee recuperate e percentuale');
    t.eq([m.memoria.formaIdx, m.memoria.formaLettera, m.memoria.nForme], [1, 'B', 3], 'forma parallela B di 3');
    t.eq(m.finalLevel, 1, 'livello finale = livello del materiale');
    const cfgC = cfgOf('memoria', { memoriaModo: 'chunking', memoriaLivello: 6, chunkingMetodi: ['categoria', 'personale'], chunkingNota: 'mia' });
    const matC = Mem.memoriaMaterialFor(cfgC);
    const c = build(cfgC, { material: matC, recall: {} });
    t.eq([c.memoria.materiale, c.memoria.recuperati, c.memoria.percentuale, c.memoria.chunkingMetodi, c.memoria.chunkingNota], ['lista', 0, 0, ['categoria', 'personale'], 'mia'], 'chunking: metodi e nota personale');
    t.eq([c.memoria.formaIdx, c.memoria.formaLettera, c.memoria.nForme], [undefined, undefined, undefined], 'livello senza forme multiple: nessun campo forma');
    const noP = build(Object.assign({}, cfgC, { chunkingMetodi: ['categoria'] }), { material: matC, recall: {} });
    t.eq(noP.memoria.chunkingNota, undefined, 'nota registrata solo con il metodo personale');
  });
};
