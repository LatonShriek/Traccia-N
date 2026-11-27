'use strict';
// Intruso percettivo con errori concessi e aiuto sulla riga (js/exercises/intrusopercettivo.js): la logica pura
// (tocchi, aiuto, esito, credito graduato) e la sua ricaduta su adattamento e registro della seduta.
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const IP = await importCore('../exercises/intrusopercettivo.js');
  const Rec = await importCore('../exercises/record.js');
  const Reg = await importCore('../exercises/registry.js');

  const trial = { n: 15, oddIndex: 7 }; // griglia 5 colonne: l'intruso è nella riga 1 (celle 5–9)
  const COLS = 5;
  // Esegue una serie di tocchi [indice, ms] con `hintAfter` errori concessi; torna stato e ultimo esito del tocco.
  const play = (taps, hintAfter) => {
    const tap = IP.intrusoTapNew(); let last = null;
    for (const [k, ms] of taps) { if (last && last.done) break; last = IP.intrusoTap(tap, trial, k, ms, hintAfter); }
    return { tap, last };
  };

  t.group('errori concessi: valore dalla configurazione', () => {
    t.eq(IP.intrusoHintAfterOf({}), 2, 'preset vecchi senza il campo: predefinito 2');
    t.eq(IP.intrusoHintAfterOf({ intrusoHintAfter: 0 }), 0, '0 = il primo tocco decide');
    t.eq(IP.intrusoHintAfterOf({ intrusoHintAfter: 9 }), 5, 'massimo 5');
    t.eq(IP.intrusoHintAfterOf({ intrusoHintAfter: -3 }), 0, 'sotto zero: 0');
    t.eq(IP.intrusoHintAfterOf({ intrusoHintAfter: 'x' }), 2, 'valore non numerico: predefinito');
    t.eq(IP.intrusoHintAfterOf(null), 2, 'configurazione mancante: predefinito');
    t.eq(Reg.defaultCfg().intrusoHintAfter, 2, 'la configurazione di partenza ha 2');
  });

  t.group('riga dell\'intruso e celle attive', () => {
    t.eq(IP.intrusoRowCells(trial, COLS), [5, 6, 7, 8, 9], 'riga dell\'intruso');
    t.eq(IP.intrusoRowCells({ n: 15, oddIndex: 0 }, COLS), [0, 1, 2, 3, 4], 'prima riga');
    t.eq(IP.intrusoRowCells({ n: 15, oddIndex: 14 }, COLS), [10, 11, 12, 13, 14], 'ultima riga');
    const tap = IP.intrusoTapNew();
    t.ok(IP.intrusoCellActive(trial, COLS, tap, 0), 'all\'inizio tutte attive');
    tap.wrong.push(3);
    t.ok(!IP.intrusoCellActive(trial, COLS, tap, 3), 'una cella sbagliata non si tocca più');
    t.ok(IP.intrusoCellActive(trial, COLS, tap, 4), 'le altre restano attive');
    tap.hinted = true;
    t.ok(!IP.intrusoCellActive(trial, COLS, tap, 4), 'con l\'aiuto: fuori dalla riga non si tocca');
    t.ok(IP.intrusoCellActive(trial, COLS, tap, 8), 'con l\'aiuto: dentro la riga sì');
    tap.wrong.push(8);
    t.ok(!IP.intrusoCellActive(trial, COLS, tap, 8), 'con l\'aiuto: una cella della riga già sbagliata resta spenta');
    t.ok(IP.intrusoCellActive(trial, COLS, tap, 7), 'l\'intruso resta toccabile');
  });

  t.group('tocchi: errore, seconda possibilità, aiuto dopo N errori', () => {
    let r = play([[2, 800]], 2);
    t.eq([r.last.done, r.tap.wrong, r.tap.hinted], [false, [2], false], 'un errore: la schermata resta, nessun aiuto ancora');
    r = play([[2, 800], [3, 1500]], 2);
    t.eq([r.last.done, r.tap.hinted], [false, true], 'due errori: scatta l\'aiuto, la schermata resta');
    r = play([[2, 800], [7, 1500]], 2);
    t.eq([r.last.done, r.last.correct], [true, true], 'giusto dopo un errore: finita');
    r = play([[2, 800], [3, 1500], [7, 2200]], 2);
    t.eq([r.last.done, r.last.correct, r.tap.hinted], [true, true, true], 'giusto con l\'aiuto: finita');
    r = play([[2, 800]], 1);
    t.eq(r.tap.hinted, true, 'con 1 errore concesso l\'aiuto scatta subito');
    r = play([[2, 800], [3, 1500], [4, 2000], [7, 2600]], 5);
    t.eq(r.tap.hinted, false, 'con 5 concessi tre errori non bastano');
    r = play([[2, 800]], 0);
    t.eq([r.last.done, r.last.correct], [true, false], '0 concessi: il primo tocco sbagliato chiude la schermata');
    r = play([[7, 600]], 0);
    t.eq([r.last.done, r.last.correct], [true, true], '0 concessi: il primo tocco giusto chiude la schermata');
  });

  t.group('esito: credito graduato 1 / 0,7 / 0,3', () => {
    t.eq(IP.INTRUSO_CREDIT, { first: 1, afterErr: 0.7, hinted: 0.3 }, 'valori di lavoro');
    let o = IP.intrusoTrialOutcome(play([[7, 900]], 2).tap, false);
    t.eq([o.correct, o.score, o.rt, o.errs, o.hinted, o.omitted], [true, 1, 900, 0, false, false], 'primo tocco giusto: credito pieno, rt = tempo del primo tocco');
    o = IP.intrusoTrialOutcome(play([[2, 800], [7, 1700]], 2).tap, false);
    t.eq([o.correct, o.score, o.rt, o.rtFirst, o.rtEnd, o.errs, o.hinted], [true, 0.7, null, 800, 1700, 1, false], 'giusto dopo un errore: 0,7, rt nullo (non entra nei tempi di riferimento)');
    o = IP.intrusoTrialOutcome(play([[2, 800], [3, 1500], [7, 2200]], 2).tap, false);
    t.eq([o.correct, o.score, o.rt, o.errs, o.hinted], [true, 0.3, null, 2, true], 'giusto con l\'aiuto: 0,3');
    o = IP.intrusoTrialOutcome(play([[2, 800]], 0).tap, false);
    t.eq([o.correct, o.score, o.rt, o.errs, o.omitted], [false, 0, 800, 1, false], '0 concessi, tocco sbagliato: come prima (errore con il suo tempo)');
  });

  t.group('tempo scaduto: nessun tocco = omissione, dopo errori = errore', () => {
    let o = IP.intrusoTrialOutcome(IP.intrusoTapNew(), true);
    t.eq([o.correct, o.omitted, o.score, o.errs], [false, true, 0, 0], 'nessun tocco: omissione');
    o = IP.intrusoTrialOutcome(play([[2, 800]], 2).tap, true);
    t.eq([o.correct, o.omitted, o.score, o.errs, o.rt], [false, false, 0, 1, null], 'dopo un errore: errore, non omissione');
    o = IP.intrusoTrialOutcome(play([[2, 800], [3, 1500]], 2).tap, true);
    t.eq([o.omitted, o.hinted, o.errs], [false, true, 2], 'dopo l\'aiuto senza trovare: errore, aiuto segnato');
  });

  t.group('adattamento: il livello sale solo se la ricerca riesce senza aiuto', () => {
    const run = (credits) => { const s = { ipAdaptBlock: credits.slice(), choiceLog: credits.map(() => ({ correct: true, rt: null })) }; IP.maybeAdaptIntruso({ adaptive: true, adaptStartLevel: 4 }, s); return s.fineLevel; };
    t.ok(run([1, 1, 1, 1, 1, 1]) > 4, 'tutte al primo tocco: sale');
    t.ok(run([0.3, 0.3, 0.3, 0.3, 0.3, 0.3]) < 4, 'tutte con l\'aiuto: scende');
    t.ok(run([0.3, 0.3, 0.3, 0.3, 0.3, 1]) < 4, 'quasi tutte con l\'aiuto: scende');
    t.ok(run([1, 1, 1, 1, 1, 0.7]) > 4, 'una sola dopo un errore: il blocco sale ancora');
  });

  t.group('registro della seduta: come finiscono le schermate', () => {
    const cfg = Object.assign(Reg.defaultCfg(), { taskMode: 'intrusopercettivo', intrusoHintAfter: 2 });
    const L = (correct, extra) => Object.assign({ correct, omitted: false, rt: correct ? 900 : null, errs: 0, hinted: false }, extra);
    const log = [L(true), L(true, { rt: null, errs: 1 }), L(true, { rt: null, errs: 2, hinted: true }), L(false, { errs: 2, hinted: true }), L(false, { omitted: true, errs: 0 })];
    const rec = Rec.buildSessionRecord(cfg, { choiceLog: log, adaptLevel: 3, levelChanges: [] }, 60000, { patientProfile: null, activeLocalPatientId: null, activeRemotePatientId: null, dateLabel: '27/11/2026' });
    t.eq([rec.choice.primoTocco, rec.choice.dopoErrori, rec.choice.conAiuto], [1, 1, 1], 'primo tocco / dopo errori / con aiuto');
    t.eq(rec.choice.erroriTotali, 5, 'errori in tutto (1 + 2 + 2; l\'omissione non è un errore)');
    t.eq(rec.choice.erroriConcessi, 2, 'errori concessi salvati con la seduta');
    t.eq([rec.choice.total, rec.choice.correct, rec.choice.omitted], [5, 3, 1], 'totali, giuste e omesse come prima');
    const vecchio = Rec.buildSessionRecord(Object.assign(Reg.defaultCfg(), { taskMode: 'intrusopercettivo' }), { choiceLog: [{ correct: true, omitted: false, rt: 900 }, { correct: false, omitted: false, rt: 700 }], adaptLevel: 3, levelChanges: [] }, 60000, { patientProfile: null, activeLocalPatientId: null, activeRemotePatientId: null, dateLabel: '27/11/2026' });
    t.eq([vecchio.choice.primoTocco, vecchio.choice.erroriTotali], [1, 1], 'righe vecchie senza `errs`: giusta = primo tocco, sbagliata = un errore');
  });
};
