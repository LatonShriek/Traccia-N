'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const mod = loadPure(REPO_ROOT, [
  { name: 'POOLS', start: '  const POOLS = {', end: 'POOLS.numeriVoce = POOLS.numeri;' },
  { name: 'screening engine + regole', start: '  const SCREENING_FLAG_THRESHOLD = 0.70;', end: "  function flessibilitaSuggestRule(fail){\n    return fail.switching ? [suggestionFor('switching')] : [];\n  }" }
], ['attenzioneSuggestRule', 'memoriaSuggestRule', 'esplorazioneSuggestRule', 'flessibilitaSuggestRule', 'ATTENZIONE_ORDER', 'suggestionFor'], { defaultTargetSeq: () => [], primaryAccuracyOf: () => null, SCREENING_TRIALS: 16 });

const { attenzioneSuggestRule, memoriaSuggestRule, esplorazioneSuggestRule, flessibilitaSuggestRule } = mod;

module.exports = function run(t) {
  // ---------------- Attenzione ----------------
  t.group('attenzioneSuggestRule — nulla fallisce: nessun suggerimento', () => {
    t.eq(attenzioneSuggestRule({}), [], 'oggetto vuoto: nessun fallimento, nessun suggerimento');
  });

  t.group('attenzioneSuggestRule — fallimento singolo: ciascuno si autopropone, TRANNE ANT (sostituito da TAPAT)', () => {
    t.eq(attenzioneSuggestRule({ ant: true }).map(s => s.flagKey), ['tapat'], 'ANT da solo → TAPAT (ANT è solo screening, nessuna letteratura di training)');
    t.eq(attenzioneSuggestRule({ tapat: true }).map(s => s.flagKey), ['tapat'], 'TAPAT da solo → TAPAT');
    t.eq(attenzioneSuggestRule({ gonogo: true }).map(s => s.flagKey), ['gonogo'], 'Go/No-Go da solo → Go/No-Go');
    t.eq(attenzioneSuggestRule({ stopsignal: true }).map(s => s.flagKey), ['stopsignal'], 'Stop-Signal da solo → Stop-Signal');
    t.eq(attenzioneSuggestRule({ stopsignal_interferenza: true }).map(s => s.flagKey), ['stopsignal_interferenza'], 'Stop-Signal+interferenza da solo → se stesso');
  });

  t.group('attenzioneSuggestRule — più di uno insieme: vince il più semplice (più a sinistra nell\'ordine di esigenza)', () => {
    t.eq(attenzioneSuggestRule({ tapat: true, stopsignal: true }).map(s => s.flagKey), ['tapat'], 'TAPAT+Stop-Signal insieme → TAPAT (più semplice)');
    t.eq(attenzioneSuggestRule({ gonogo: true, stopsignal: true }).map(s => s.flagKey), ['gonogo'], 'Go/No-Go+Stop-Signal insieme → Go/No-Go (esempio esplicito confermato)');
    t.eq(attenzioneSuggestRule({ stopsignal: true, stopsignal_interferenza: true }).map(s => s.flagKey), ['stopsignal'], 'Stop-Signal+interferenza insieme → solo Stop-Signal (esempio esplicito confermato)');
    t.eq(attenzioneSuggestRule({ ant: true, tapat: true }).map(s => s.flagKey), ['tapat'], 'ANT+TAPAT insieme → TAPAT (esempio esplicito confermato — ANT sostituito anche qui, non solo da solo)');
    t.eq(attenzioneSuggestRule({ ant: true, gonogo: true, stopsignal_interferenza: true }).map(s => s.flagKey), ['tapat'], 'combinazione con ANT più a sinistra fra i falliti → comunque sostituito da TAPAT, non salta al secondo fallito');
  });

  t.group('attenzioneSuggestRule — Simon si aggiunge SOLO quando Stop-Signal+interferenza è l\'unico a fallire', () => {
    t.eq(attenzioneSuggestRule({ stopsignal_interferenza: true, simon: true }).map(s => s.flagKey), ['stopsignal_interferenza', 'simon'], 'Stop-Signal+interferenza unico fallito, e Simon flagga anche lui: entrambi suggeriti');
    t.eq(attenzioneSuggestRule({ stopsignal_interferenza: true, simon: false }).map(s => s.flagKey), ['stopsignal_interferenza'], 'Stop-Signal+interferenza unico fallito, Simon passa: solo Stop-Signal+interferenza');
    t.eq(attenzioneSuggestRule({ stopsignal: true, stopsignal_interferenza: true, simon: true }).map(s => s.flagKey), ['stopsignal'], 'Stop-Signal+interferenza NON è l\'unico a fallire (anche stopsignal fallisce): Simon non si considera anche se il campo fail.simon è true, perché la condizione è sul pattern di Attenzione, non sul valore di fail.simon da solo');
  });

  // ---------------- Memoria di lavoro ----------------
  t.group('memoriaSuggestRule — nulla fallisce: nessun suggerimento', () => {
    t.eq(memoriaSuggestRule({}), [], 'nessun fallimento, nessun suggerimento');
  });

  t.group('memoriaSuggestRule — fallimento singolo nel gruppo Mantenimento/Sequenza/Categorizzazione: struttura specifica per costrutto', () => {
    const mant = memoriaSuggestRule({ mantenimento: true });
    t.eq(mant.length, 1); t.eq(mant[0].flagKey, 'categorizzazione'); t.eq(mant[0].suggestedCfg.categStructManual, 1, 'solo Mantenimento fallisce → Categorizzazione struttura 1 (cautela, nessun collegamento di costrutto pulito)');

    const seq = memoriaSuggestRule({ sequenza: true });
    t.eq(seq.length, 1); t.eq(seq[0].flagKey, 'categorizzazione'); t.eq(seq[0].suggestedCfg.categStructManual, 4, 'solo Sequenza bersaglio fallisce → Categorizzazione struttura 4 (stessa natura: riconoscimento continuo)');

    const categ = memoriaSuggestRule({ categorizzazione: true });
    t.eq(categ.length, 1); t.eq(categ[0].flagKey, 'categorizzazione'); t.eq(categ[0].suggestedCfg.categStructManual, 1, 'solo Categorizzazione fallisce → struttura 1 (segnale diretto)');
  });

  t.group('memoriaSuggestRule — due o più del gruppo insieme: sempre struttura 1 (nessuna struttura combina propriamente le difficoltà)', () => {
    const due = memoriaSuggestRule({ mantenimento: true, sequenza: true });
    t.eq(due.length, 1); t.eq(due[0].suggestedCfg.categStructManual, 1, 'Mantenimento+Sequenza insieme → struttura 1, non una via di mezzo inventata');
    const tutti = memoriaSuggestRule({ mantenimento: true, sequenza: true, categorizzazione: true });
    t.eq(tutti.length, 1); t.eq(tutti[0].suggestedCfg.categStructManual, 1, 'tutti e 3 insieme → ancora struttura 1');
  });

  t.group('memoriaSuggestRule — N-back e Running Span sono fuori dal gruppo, si autopropongono indipendentemente', () => {
    t.eq(memoriaSuggestRule({ nback: true }).map(s => s.flagKey), ['nback'], 'solo N-back fallisce → N-back');
    t.eq(memoriaSuggestRule({ runningspan: true }).map(s => s.flagKey), ['runningspan'], 'solo Running Span fallisce → Running Span');
    t.eq(memoriaSuggestRule({ nback: true, runningspan: true }).map(s => s.flagKey), ['nback', 'runningspan'], 'entrambi falliscono → entrambi suggeriti, non si escludono a vicenda');
  });

  t.group('memoriaSuggestRule — gruppo E N-back/Running Span insieme: suggerimenti accumulati, non uno sostituisce l\'altro', () => {
    const r = memoriaSuggestRule({ mantenimento: true, nback: true });
    t.eq(r.map(s => s.flagKey), ['categorizzazione', 'nback'], 'Mantenimento (gruppo) + N-back (indipendente) → entrambi i suggerimenti, in questo ordine');
  });

  // ---------------- Esplorazione ----------------
  t.group('esplorazioneSuggestRule — suggerisce TUTTE le varianti che falliscono, non ne isola una sola', () => {
    t.eq(esplorazioneSuggestRule({}), [], 'nessun fallimento, nessun suggerimento');
    t.eq(esplorazioneSuggestRule({ neglect_classico: true }).map(s => s.flagKey), ['neglect_classico']);
    t.eq(esplorazioneSuggestRule({ neglect_intruso: true }).map(s => s.flagKey), ['neglect_intruso']);
    t.eq(esplorazioneSuggestRule({ neglect_classico: true, neglect_regola: true }).map(s => s.flagKey), ['neglect_classico', 'neglect_regola'], 'due varianti insieme → entrambe suggerite, non collassate a una');
    t.eq(esplorazioneSuggestRule({ neglect_classico: true, neglect_intruso: true, neglect_regola: true }).map(s => s.flagKey), ['neglect_classico', 'neglect_intruso', 'neglect_regola'], 'tutte e 3 → tutte e 3 suggerite');
  });

  // ---------------- Flessibilità ----------------
  t.group('flessibilitaSuggestRule — un solo esercizio nel dominio, si autopropone o niente', () => {
    t.eq(flessibilitaSuggestRule({}), [], 'non fallisce: nessun suggerimento');
    t.eq(flessibilitaSuggestRule({ switching: true }).map(s => s.flagKey), ['switching'], 'fallisce: si autopropone');
  });
};
