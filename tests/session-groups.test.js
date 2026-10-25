'use strict';
// Passo 9: raggruppamento dello storico in sedute (js/core/session-groups.js) e righe di dettaglio (js/ui/history-view.js).
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const G = await importCore('session-groups.js');
  const V = await importCore('../ui/history-view.js');
  const M = 60000, H = 3600000, T0 = Date.UTC(2026, 9, 20, 10, 0, 0);
  const rec = (id, endOff, dur, extra) => Object.assign({ id, ts: T0 + endOff, durationMs: dur, taskMode: 'nback', family: 'signal', metrics: { acc: 0.75, dprime: 1.05, hitRate: 0.75, faRate: 0.25 } }, extra || {});

  t.group('origine e chiave paziente', () => {
    t.eq(G.originOf({ localPatientId: 'a' }), 'presenza', 'in presenza');
    t.eq(G.originOf({ pazienteId: 'b' }), 'remoto', 'remoto');
    t.eq(G.originOf({}), 'libero', 'libero');
    t.eq(G.originOf({ localPatientId: 'a', pazienteId: 'b' }), 'presenza', 'migrato: conta come in presenza');
    t.eq(G.patientKeyOf({ localPatientId: 'a' }), 'local:a', 'chiave locale');
    t.eq(G.patientKeyOf({ pazienteId: 'b' }), 'remote:b', 'chiave remota');
    t.eq(G.patientKeyOf({ patientCode: 'X1' }), 'free:X1', 'chiave libera');
    t.eq(G.SESSION_GAP_MS, 45 * M, 'soglia 45 minuti');
  });

  t.group('raggruppamento: stesso paziente, piccola pausa → una seduta', () => {
    const items = [rec('a', 6 * M, 6 * M, { localPatientId: 'p1' }), rec('b', 20 * M, 10 * M, { localPatientId: 'p1' }), rec('c', 30 * M, 5 * M, { localPatientId: 'p1' })];
    const g = G.groupSessions(items, () => 'Mario');
    t.eq(g.length, 1, 'una sola seduta');
    t.eq(g[0].items.map(x => x.id), ['a', 'b', 'c'], 'ordine cronologico');
    t.eq(g[0].totalMs, 21 * M, 'tempo totale = somma delle durate');
    t.eq(g[0].start, T0, 'inizio = inizio del primo');
    t.eq(g[0].end, T0 + 30 * M, 'fine = fine dell\'ultimo');
    t.eq(g[0].patientLabel, 'Mario', 'etichetta paziente');
    t.eq(g[0].origin, 'presenza', 'origine');
  });

  t.group('raggruppamento: pausa lunga → sedute separate; la più recente per prima', () => {
    const items = [rec('a', 10 * M, 10 * M, { localPatientId: 'p1' }), rec('b', 3 * H, 10 * M, { localPatientId: 'p1' })];
    const g = G.groupSessions(items);
    t.eq(g.length, 2, 'due sedute');
    t.eq(g[0].items[0].id, 'b', 'prima la più recente');
    // limite: esattamente 45 min di pausa resta nella stessa seduta; 45 min + 1 ms no
    const e1 = [rec('a', 10 * M, 10 * M, { localPatientId: 'p1' }), rec('b', 10 * M + 45 * M + 10 * M, 10 * M, { localPatientId: 'p1' })];
    t.eq(G.groupSessions(e1).length, 1, 'pausa di 45 min: stessa seduta');
    const e2 = [rec('a', 10 * M, 10 * M, { localPatientId: 'p1' }), rec('b', 10 * M + 45 * M + 10 * M + 1, 10 * M, { localPatientId: 'p1' })];
    t.eq(G.groupSessions(e2).length, 2, 'pausa di 45 min + 1 ms: sedute diverse');
  });

  t.group('raggruppamento: pazienti e origini diversi non si mescolano, anche se alternati nel tempo', () => {
    const items = [rec('a', 10 * M, 5 * M, { localPatientId: 'p1' }), rec('b', 12 * M, 5 * M, { pazienteId: 'r1' }), rec('c', 20 * M, 5 * M, { localPatientId: 'p1' }), rec('d', 25 * M, 5 * M, { localPatientId: 'p2' })];
    const g = G.groupSessions(items);
    t.eq(g.length, 3, 'tre sedute');
    const byKey = {}; g.forEach(x => byKey[x.patientKey] = x.items.map(i => i.id));
    t.eq(byKey['local:p1'], ['a', 'c'], 'p1 insieme');
    t.eq(byKey['remote:r1'], ['b'], 'remoto da solo');
    t.eq(byKey['local:p2'], ['d'], 'p2 da solo');
  });

  t.group('raggruppamento: dati strani', () => {
    t.eq(G.groupSessions([]).length, 0, 'vuoto');
    t.eq(G.groupSessions([{ id: 'x' }, null]).length, 0, 'senza ts: scartati');
    const g = G.groupSessions([{ id: 'old', ts: T0, taskMode: 'nback' }]);
    t.eq(g.length, 1, 'record vecchio senza durata');
    t.eq(g[0].totalMs, 0, 'durata 0');
    t.eq(g[0].start, T0, 'inizio = ts');
    const input = [rec('b', 20 * M, 5 * M, {}), rec('a', 10 * M, 5 * M, {})];
    G.groupSessions(input);
    t.eq(input.map(x => x.id), ['b', 'a'], 'non modifica l\'elenco ricevuto');
  });

  t.group('punteggio principale (stesso testo dello storico di prima)', () => {
    t.eq(V.performanceOf(rec('a', 0, 0), false), '75% · d′ 1.05', 'signal');
    t.eq(V.performanceOf(rec('a', 0, 0), true), '75%', 'signal, vista paziente: niente d′');
    t.eq(V.performanceOf({ family: 'choice', choice: { accuracy: 0.9 } }, false), '90% corr.', 'choice');
    t.eq(V.performanceOf({ family: 'dual', metrics: { acc: 0.6 }, metricsAud: { acc: 0.73 } }, false), '60% vis · 73% ud.', 'dual');
    t.eq(V.performanceOf({ family: 'spatial', neglect: { pctLeft: 0.5, pctRight: 1 } }, false), '50% sin · 100% des', 'neglect');
    t.eq(V.performanceOf({ family: 'spatial', neglect: { modalitaConteggio: true, accuratezzaConteggio: 0 } }, false), '0% conteggi esatti', 'conteggio');
    t.eq(V.performanceOf({ family: 'goaltask', goaltask: { percentualeCompletamento: 80, violazioniCount: 2 } }, false), '80% completato · 2 viol.', 'goaltask');
    t.eq(V.performanceOf({ family: 'goaltask', goaltask: { percentualeCompletamento: 80, violazioniCount: 2 } }, true), '80% completato', 'goaltask paziente');
    t.eq(V.performanceOf({ family: 'memoria', memoria: { recuperati: 3, totale: 4, percentuale: 75 } }, false), '3/4 (75%)', 'memoria');
    t.eq(V.performanceOf({ family: 'signal', metrics: { acc: 0.5, dprime: null } }, false), '50%', 'd′ assente');
  });

  t.group('dettagli: solo ciò che esiste', () => {
    const rows = V.detailRowsOf(rec('a', 14 * M, 7 * M, { trials: 24, finalLevel: 3, avgRT: 450.4, notes: 'ok' }), false);
    const m = {}; rows.forEach(([k, v]) => m[k] = v);
    t.eq(m['Durata'], '7 min', 'durata');
    t.eq(m['Prove'], 24, 'prove');
    t.eq(m['Livello finale'], 3, 'livello');
    t.eq(m['Accuratezza'], '75%', 'accuratezza');
    t.eq(m['d′'], '1.05', 'd′');
    t.eq(m['Tempo di risposta medio'], '450 ms', 'RT');
    t.eq(m['Note'], 'ok', 'note');
    t.ok(!('SSRT' in m), 'niente SSRT se non c\'è');
    const p = {}; V.detailRowsOf(rec('a', 14 * M, 7 * M, {}), true).forEach(([k, v]) => p[k] = v);
    t.ok(!('d′' in p), 'vista paziente: niente d′');
    const old = V.detailRowsOf({ ts: T0, family: 'choice', choice: { accuracy: 0.5, omitted: 1, meanRT: null } }, false);
    t.ok(old.length >= 2, 'record vecchio: nessun errore');
    t.ok(!old.some(([k]) => k === 'Durata'), 'durata assente: riga omessa');
    const fat = {}; V.detailRowsOf(rec('a', 0, M, { fatigueNote: { flag: true, accFirst: 0.9, accLast: 0.6 } }), false).forEach(([k, v]) => fat[k] = v);
    t.eq(fat['Calo nel corso della seduta'], 'primo terzo 90% → ultimo terzo 60%', 'calo');
  });

  t.group('formati', () => {
    t.eq(V.fmtDur(0), '—', 'zero');
    t.eq(V.fmtDur(null), '—', 'null');
    t.eq(V.fmtDur(45000), '45 s', 'secondi');
    t.eq(V.fmtDur(5 * M), '5 min', 'minuti');
    t.eq(V.fmtDur(5 * M + 30000), '5 min 30 s', 'minuti e secondi');
    t.eq(V.fmtDur(75 * M), '1h 15min', 'ore');
  });
};
