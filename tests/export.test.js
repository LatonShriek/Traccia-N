'use strict';
// Export dei dati (js/exercises/export.js, passo 5j): CSV delle sedute e HTML del report RCI.
// Il CSV è l'export settimanale dei dati clinici: ogni riga deve avere tante celle quanto l'intestazione.
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const X = await importCore('../exercises/export.js');
  const Rec = await importCore('../exercises/record.js');
  const Reg = await importCore('../exercises/registry.js');
  const Goal = await importCore('../exercises/goaltask.js');
  const Mem = await importCore('../exercises/memoria.js');

  const cfgOf = (taskMode, over) => Object.assign(Reg.defaultCfg(), { taskMode }, over || {});
  const ctx = { patientProfile: null, activeLocalPatientId: null, activeRemotePatientId: null, dateLabel: '25/10/2026' };
  const rec = (cfg, session) => Rec.buildSessionRecord(cfg, session, 60000, ctx);
  const counts = o => Object.assign({ targets: 0, nonTargets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 }, o);
  const L = (correct, rt, extra) => Object.assign({ correct, rt: correct ? rt : null, omitted: false }, extra);

  // un record per ogni famiglia/variante
  const scen = Goal.goalTaskInstanceFor('sei_compiti_classico', 2), st = Goal.startGoalTask(scen);
  const cfgM = cfgOf('memoria', { memoriaModo: 'pqrst', memoriaLivello: 1, memoriaFormaIdx: 1 });
  const matM = Mem.memoriaMaterialFor(cfgM);
  const records = {
    nback: rec(cfgOf('nback', { patientCode: 'P1' }), { liveNLevel: 3, counts: counts({ targets: 4, nonTargets: 4, hits: 3, misses: 1, falseAlarms: 1, correctRejections: 3 }), rts: [400, 500], fatigueLog: [], levelChanges: [] }),
    stopsignal: rec(cfgOf('stopsignal'), { counts: counts({ targets: 2, nonTargets: 2, hits: 2, correctRejections: 2 }), rts: [600], fatigueLog: [], adaptLevel: 3, levelChanges: [], ssdHistory: [250], discrimLog: [true], discrimCongLog: [{ congruent: true, correct: true, rt: 500 }, { congruent: false, correct: true, rt: 580 }] }),
    ant: rec(cfgOf('ant'), { adaptLevel: 2, levelChanges: [], choiceLog: [L(true, 600, { cueType: 'none', congruency: 'congruent' }), L(true, 500, { cueType: 'center', congruency: 'incongruent' }), L(true, 450, { cueType: 'spatial', congruency: 'congruent' })] }),
    switching: rec(cfgOf('switching'), { adaptLevel: 3, levelChanges: [], choiceLog: [L(true, 800, { isSwitch: true }), L(true, 600, { isSwitch: false })] }),
    dual: rec(cfgOf('dualtask'), { dualLevel1: 3, dualLevel2: 4, counts: counts({ targets: 2, nonTargets: 2, hits: 2, correctRejections: 2 }), countsAud: counts({ targets: 2, nonTargets: 2, hits: 1, misses: 1, correctRejections: 2 }) }),
    neglect: rec(cfgOf('neglect'), { liveBoardLevel: 4, results: [{ targetsLeft: 4, targetsRight: 4, foundLeft: 2, foundRight: 4, falseAlarms: 1, timeMs: 20000 }] }),
    neglectRegola: rec(cfgOf('neglect', { neglectMode: 'regola' }), { liveBoardLevel: 3, results: [{ modalitaConteggio: true, conteggioAtteso: 5, conteggioDato: 4, corretto: false, targetsLeft: 3, targetsRight: 2, timeMs: 9000 }] }),
    span: rec(cfgOf('runningspan'), { results: [{ n: 3, posAcc: 1, contentAcc: 0.5, seqLen: 6, rt: 4000 }] }),
    goaltask: rec(cfgOf('goaltask'), Goal.completeGoalTaskItem(st, scen.items[0].id)),
    memoria: rec(cfgM, { material: matM, recall: { 0: true, 1: false } })
  };

  const parse = csv => csv.split('\n').map(r => r.split(';'));

  t.group('buildCSV — struttura: intestazione e una riga per sessione, stesso numero di celle', () => {
    const all = Object.values(records);
    const rows = parse(X.buildCSV(all));
    t.eq(rows.length, all.length + 1, 'intestazione + una riga per record');
    t.eq(rows[0].length, 61, 'intestazione: 61 colonne');
    rows.slice(1).forEach((r, i) => t.eq(r.length, rows[0].length, 'riga ' + (i + 1) + ': stesso numero di celle dell\'intestazione'));
    t.eq(rows[0].slice(0, 4), ['data', 'codice_paziente', 'stimolo', 'esercizio'], 'prime colonne');
    t.eq(rows[0].slice(-4), ['runningspan_n', 'runningspan_acc_posizione', 'runningspan_acc_contenuto', 'runningspan_lunghezza_media'], 'ultime colonne');
    t.eq(X.buildCSV([]).split('\n').length, 1, 'nessun record: solo l\'intestazione');
  });

  t.group('buildCSV — valori per famiglia', () => {
    const col = (csv, name, row) => { const p = parse(csv); return p[row || 1][p[0].indexOf(name)]; };
    const nb = X.buildCSV([records.nback]);
    t.eq([col(nb, 'data'), col(nb, 'codice_paziente'), col(nb, 'stimolo'), col(nb, 'esercizio')], ['25/10/2026', 'P1', 'Lettere', 'N-back classico'], 'N-back: identificativi');
    t.eq([col(nb, 'hit'), col(nb, 'miss'), col(nb, 'falsi_allarmi'), col(nb, 'rifiuti_corretti')], ['3', '1', '1', '3'], 'N-back: conteggi');
    t.eq([col(nb, 'accuratezza'), col(nb, 'rt_medio_ms')], ['75.0%', '450'], 'N-back: accuratezza in % con un decimale, RT intero');
    t.ok(/^-?\d+\.\d\d$/.test(col(nb, 'dprime')), 'd\' con due decimali');
    t.eq([col(nb, 'n_back'), col(nb, 'sequenza_bersaglio')], ['5', ''], 'colonna n_back = livello n della configurazione (qui 5, quello di partenza); nessuna sequenza');
    const ss = X.buildCSV([records.stopsignal]);
    t.eq([col(ss, 'ssrt_ms'), col(ss, 'stopsignal_interferenza_conflitto_ms'), col(ss, 'stopsignal_interferenza_acc_congruente')], ['350', '80', '100.0%'], 'Stop-Signal: SSRT, conflitto e accuratezza per congruenza');
    const ant = X.buildCSV([records.ant]);
    t.eq([col(ant, 'risposte_corrette'), col(ant, 'risposte_omesse'), col(ant, 'indice_allerta'), col(ant, 'indice_orienting'), col(ant, 'indice_conflitto')], ['3/3', '0', '100', '50', '-25'], 'ANT: corrette, allerta, orienting e conflitto (500 − media(600, 450))');
    t.eq(col(ant, 'hit'), '', 'ANT: nessun conteggio hit');
    const sw = X.buildCSV([records.switching]);
    t.eq([col(sw, 'switch_cost'), col(sw, 'switch_cost_relativo'), col(sw, 'switch_acc_ripetizione'), col(sw, 'switch_acc_switch')], ['200', '33.3%', '100.0%', '100.0%'], 'switching: costo assoluto e relativo, accuratezze');
    const du = X.buildCSV([records.dual]);
    t.eq([col(du, 'doppio_compito_accoppiamento'), col(du, 'acc_canale2'), col(du, 'hit')], ['vis-aud', '75.0%', '2'], 'doppio compito: accoppiamento e canale 2');
    const ng = X.buildCSV([records.neglect]);
    t.eq([col(ng, 'neglect_pct_sinistra'), col(ng, 'neglect_pct_destra'), col(ng, 'neglect_omessi_sin'), col(ng, 'neglect_omessi_des'), col(ng, 'neglect_asimmetria'), col(ng, 'neglect_falsi_allarmi')], ['50.0%', '100.0%', '2', '0', '-50', '1'], 'Neglect: percentuali, omissioni, asimmetria negativa = più omissioni a sinistra');
    const nr = X.buildCSV([records.neglectRegola]);
    t.eq([col(nr, 'neglect_pct_sinistra'), col(nr, 'neglect_conteggio_accuratezza'), col(nr, 'neglect_conteggio_errore_medio')], ['', '0.0%', '1.00'], 'Neglect conteggio: nessuna % per lato, accuratezza e errore medio');
    const gt = X.buildCSV([records.goaltask]);
    t.eq([col(gt, 'goaltask_livello'), col(gt, 'goaltask_completati'), col(gt, 'goaltask_totale'), col(gt, 'goaltask_budget_rispettato')], ['2', '1', String(scen.items.length), 'Sì'], 'scenari ecologici');
    const me = X.buildCSV([records.memoria]);
    t.eq([col(me, 'memoria_modo'), col(me, 'memoria_livello'), col(me, 'memoria_forma'), col(me, 'memoria_recuperati')], ['PQRST', '1', 'B', '1'], 'memoria: tecnica, livello, forma, recuperati');
    const rs = X.buildCSV([records.span]);
    t.eq([col(rs, 'runningspan_n'), col(rs, 'runningspan_acc_posizione'), col(rs, 'runningspan_acc_contenuto'), col(rs, 'runningspan_lunghezza_media')], ['3', '100.0%', '50.0%', '6.0'], 'Running Span');
  });

  t.group('buildCSV — casi limite', () => {
    const p = csv => { const a = parse(csv); return a[1][a[0].indexOf('note')]; };
    const conNote = Object.assign({}, records.nback, { notes: 'a, b\nc' });
    t.eq(p(X.buildCSV([conNote])), 'a  b c', 'virgole e a capo nelle note diventano spazi (non rompono le colonne)');
    const vecchio = { dateLabel: '01/01/2025', patientCode: '', stimType: 'lettere', nLevel: 2, trials: 20, isi: 2000, stimDuration: 600, respMode: 'paziente',
      counts: counts({ targets: 5, nonTargets: 5, hits: 4, misses: 1, falseAlarms: 0, correctRejections: 5 }), metrics: { acc: 0.9, dprime: 2.5 }, avgRT: 480.4 };
    const rows = parse(X.buildCSV([vecchio]));
    t.eq(rows[1].length, rows[0].length, 'record vecchio (senza family/taskMode): riga completa');
    t.eq([rows[1][3], rows[1][4], rows[1][14], rows[1][15], rows[1][16]], ['n-back', '', '90.0%', '2.50', '480'], 'record vecchio = N-back, famiglia signal (la colonna n_back resta vuota: senza taskMode non viene letto nLevel — comportamento già presente)');
    const mista = Object.assign({}, records.nback, { taskMode: 'sequenza', sequenzaMista: 'visivo', targetSeq: ['A', 'B'] });
    const m = parse(X.buildCSV([mista]));
    t.eq([m[1][2], m[1][3], m[1][5]], ['Mista', 'Sequenza bersaglio', 'A-B'], 'sequenza mista: materiale "Mista", sequenza unita da trattino');
    const senzaD = Object.assign({}, records.nback, { metrics: { acc: 0.5, dprime: null } });
    t.eq(parse(X.buildCSV([senzaD]))[1][15], '', 'd\' null → cella vuota');
  });

  t.group('buildRCIReportHtml', () => {
    const rows = [
      { exLabel: 'N-back <classico>', n: 8, half: 3, baselineMean: 0.6, finalMean: 0.8, comparable: true, rci: 2.31, significativo: true, warnings: [] },
      { exLabel: 'ANT', n: 6, half: 3, baselineMean: 0.7, finalMean: 0.72, comparable: false, rci: null, significativo: false, warnings: ['livello diverso', 'ISI diverso'] }];
    const html = X.buildRCIReportHtml(rows, 'Mario <Rossi> & C.', '25/10/2026');
    t.ok(html.startsWith('<!doctype html>') && html.endsWith('</html>'), 'documento HTML completo');
    t.ok(html.includes('Paziente: Mario &lt;Rossi&gt; &amp; C. · generato il 25/10/2026'), 'etichetta paziente e data, con escape HTML');
    t.ok(html.includes('N-back &lt;classico&gt;') && !html.includes('<classico>'), 'etichetta esercizio con escape');
    t.ok(html.includes('<td>2.31</td><td class="sig-yes">Sì</td>'), 'riga confrontabile: RCI e cambiamento significativo');
    t.ok(html.includes('colspan="2" class="not-comparable">Confronto non disponibile — livello diverso; ISI diverso'), 'riga non confrontabile: motivi elencati');
    t.ok(html.includes('0.60') && html.includes('0.80'), 'medie di baseline e finale con due decimali');
    t.ok(html.includes('(fino a 3 per gruppo)'), 'dimensione del gruppo di baseline dal modulo RCI');
    t.ok(html.includes('1.96'), 'soglia di significatività riportata');
    t.ok(X.buildRCIReportHtml(rows, '', 'x').includes('Paziente: —'), 'senza etichetta paziente: trattino');
  });
};
