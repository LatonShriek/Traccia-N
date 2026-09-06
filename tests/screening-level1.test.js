'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// primaryAccuracyOf, POOLS, SCREENING_TRIALS, defaultTargetSeq: liberi
// nelle patch() delle scale/pannelli, ma le patch() non vengono mai
// invocate in questi test (si verifica solo la logica di avanzamento e
// di raffinamento del suggerimento, non i parametri clinici delle
// singole prove) — nessuno stub necessario per loro.
const mod = loadPure(REPO_ROOT, [
  { name: 'SCREENING_FLAG_THRESHOLD', start: '  const SCREENING_FLAG_THRESHOLD =', end: '0.70; // coerente con la soglia Wilson già in uso per la titolazione adattiva' },
  { name: 'SCREENING_LEVEL1_LADDERS', start: '  const SCREENING_LEVEL1_LADDERS = {', end: "    ]\n  };" },
  { name: 'SCREENING_LEVEL1_PARALLEL', start: '  const SCREENING_LEVEL1_PARALLEL = {', end: "    ]\n  };" },
  { name: 'buildLevel1Queue', start: '  function buildLevel1Queue(level0Summary){', end: "    return queue;\n  }" },
  { name: 'applyLevel1Refinement', start: '  function applyLevel1Refinement(level0Row, level1Results){', end: "    return Object.assign({}, level0Row, {level1:l1});\n  }" },
  { name: 'computeCoordinationFlag', start: '  function computeCoordinationFlag(results){', end: "    };\n  }" },
  { name: 'mergeScreeningFlags', start: '  function mergeScreeningFlags(existing, fresh){', end: "    return out;\n  }" },
  { name: 'SCREENING_FINAL_GATE', start: '  const SCREENING_FINAL_GATE = {', end: "      scoreOf:r=> r.goaltask && r.goaltask.violazioniCount<=1 ? 1 : 0 }\n  };" },
  { name: 'buildFinalGateRows', start: '  function buildFinalGateRows(finalGateResults){', end: "    return rows;\n  }" }
], ['SCREENING_LEVEL1_LADDERS', 'SCREENING_LEVEL1_PARALLEL', 'buildLevel1Queue', 'applyLevel1Refinement', 'computeCoordinationFlag', 'mergeScreeningFlags', 'SCREENING_FINAL_GATE', 'buildFinalGateRows'], { SCREENING_TRIALS: 16, primaryAccuracyOf: () => null, defaultTargetSeq: () => [] });

const { SCREENING_LEVEL1_LADDERS, SCREENING_LEVEL1_PARALLEL, buildLevel1Queue, applyLevel1Refinement, computeCoordinationFlag, mergeScreeningFlags, SCREENING_FINAL_GATE, buildFinalGateRows } = mod;

module.exports = function run(t) {
  t.group('SCREENING_LEVEL1_LADDERS/PARALLEL — struttura', () => {
    t.ok(!SCREENING_LEVEL1_LADDERS.divisa && !SCREENING_LEVEL1_PARALLEL.divisa, 'nessun approfondimento per "divisa" — resta fuori dallo screening automatico per la stessa ragione già documentata per il Livello 0');
    t.ok(!SCREENING_LEVEL1_LADDERS.flessibilita && !SCREENING_LEVEL1_PARALLEL.flessibilita, 'Flessibilità cognitiva non ha approfondimento — un solo esercizio nel dominio, niente da scalare');
    t.eq(SCREENING_LEVEL1_LADDERS.attenzione.length, 3, 'scala Attenzione: 3 gradini (TAPAT, Stop-Signal, Stop-Signal+interferenza)');
    t.eq(SCREENING_LEVEL1_LADDERS.esplorazione.length, 1, 'scala Esplorazione: 1 solo gradino (intruso) — "regola" è già il caricato del Livello 0, non ripetuto');
    t.eq(SCREENING_LEVEL1_PARALLEL.memoria.length, 2, 'pannello Memoria: 2 sonde parallele (Mantenimento, Categorizzazione)');
  });

  t.group('buildLevel1Queue — solo i domini flaggati CON un approfondimento definito entrano in coda', () => {
    const summary = [
      { domain: 'attenzione', flagged: true },
      { domain: 'memoria', flagged: true },
      { domain: 'flessibilita', flagged: true }, // flaggato ma nessun approfondimento definito
      { domain: 'esplorazione', flagged: false } // non flaggato
    ];
    const queue = buildLevel1Queue(summary);
    t.eq(queue.length, 2, 'solo attenzione e memoria in coda (flessibilita non ha ladder/parallel, esplorazione non ha flaggato)');
    t.eq(queue[0].domain, 'attenzione', 'primo elemento: attenzione');
    t.eq(queue[0].kind, 'ladder', 'attenzione è una scala');
    t.eq(queue[0].rungIdx, 0, 'scala inizia dal primo gradino');
    t.eq(queue[1].domain, 'memoria', 'secondo elemento: memoria');
    t.eq(queue[1].kind, 'parallel', 'memoria è un pannello parallelo');
    t.eq(queue[1].probeIdx, 0, 'pannello inizia dalla prima sonda');
  });

  t.group('buildLevel1Queue — niente flaggato: coda vuota', () => {
    const summary = [{ domain: 'attenzione', flagged: false }, { domain: 'memoria', flagged: false }];
    t.eq(buildLevel1Queue(summary).length, 0, 'nessun elemento in coda se nessun dominio ha flaggato');
  });

  t.group('applyLevel1Refinement — scala fermata a un gradino: il suggerimento diventa quello del gradino', () => {
    const level0Row = { domain: 'attenzione', domainLabel: 'Attenzione', suggestTaskMode: 'gonogo', suggestLabel: 'Go/No-Go', suggestedCfg: { taskMode: 'gonogo' }, flagged: true };
    const level1Results = { attenzione: { kind: 'ladder', stoppedAtIdx: 1, rungAccuracies: [0.9, 0.5] } }; // fermato al 2° gradino (Stop-Signal)
    const refined = applyLevel1Refinement(level0Row, level1Results);
    t.eq(refined.suggestTaskMode, 'stopsignal', 'suggerimento sostituito con quello del gradino dove si è fermato (Stop-Signal)');
    t.eq(refined.suggestLabel, 'Stop-Signal', 'etichetta coerente col gradino');
    t.eq(refined.suggestedCfg.taskMode, 'stopsignal', 'configurazione suggerita rigenerata dal patch() del gradino, non quella originale di Go/No-Go');
    t.ok(!!refined.level1, 'il dettaglio del Livello 1 resta accessibile per la UI');
  });

  t.group('applyLevel1Refinement — scala tutta superata: nessuna localizzazione, suggerimento originale invariato', () => {
    const level0Row = { domain: 'attenzione', suggestTaskMode: 'gonogo', suggestLabel: 'Go/No-Go', suggestedCfg: { taskMode: 'gonogo' }, flagged: true };
    const level1Results = { attenzione: { kind: 'ladder', stoppedAtIdx: null, rungAccuracies: [0.9, 0.85, 0.8] } };
    const refined = applyLevel1Refinement(level0Row, level1Results);
    t.eq(refined.suggestTaskMode, 'gonogo', 'suggerimento resta Go/No-Go: tutti i gradini superati, nessun punto di rottura trovato più in profondità');
  });

  t.group('applyLevel1Refinement — pannello parallelo con una sonda che flagga: localizza su quella', () => {
    const level0Row = { domain: 'memoria', suggestTaskMode: 'nback', suggestLabel: 'N-back', suggestedCfg: { taskMode: 'nback' }, flagged: true };
    const level1Results = { memoria: { kind: 'parallel', flaggedProbeIdx: 1, probeAccuracies: [0.85, 0.5] } }; // 2ª sonda (Categorizzazione) flagga
    const refined = applyLevel1Refinement(level0Row, level1Results);
    t.eq(refined.suggestTaskMode, 'categorizzazione', 'suggerimento sostituito con la sonda che ha flaggato (Categorizzazione), non con la prima per posizione');
  });

  t.group('applyLevel1Refinement — pannello parallelo senza nessuna sonda che flagga: resta il dominio originale', () => {
    const level0Row = { domain: 'memoria', suggestTaskMode: 'nback', suggestLabel: 'N-back', suggestedCfg: { taskMode: 'nback' }, flagged: true };
    const level1Results = { memoria: { kind: 'parallel', flaggedProbeIdx: null, probeAccuracies: [0.9, 0.85] } };
    const refined = applyLevel1Refinement(level0Row, level1Results);
    t.eq(refined.suggestTaskMode, 'nback', 'nessuna sonda flagga: conferma che il problema è specifico a N-back, suggerimento invariato');
  });

  t.group('applyLevel1Refinement — dominio flaggato ma senza risultato di Livello 1 (es. Flessibilità): suggerimento invariato, level1 null', () => {
    const level0Row = { domain: 'flessibilita', suggestTaskMode: 'switching', suggestLabel: 'Task-switching', suggestedCfg: { taskMode: 'switching' }, flagged: true };
    const refined = applyLevel1Refinement(level0Row, {});
    t.eq(refined.suggestTaskMode, 'switching', 'suggerimento invariato senza approfondimento disponibile');
    t.eq(refined.level1, null, 'level1 esplicitamente null, non undefined o assente');
  });

  t.group('computeCoordinationFlag — pattern derivato, non un settimo dominio', () => {
    const tuttiSottoSoglia = [
      { domain: 'attenzione', tipo: 'base', accuracy: 0.6 },
      { domain: 'attenzione', tipo: 'caricato', accuracy: 0.4 },
      { domain: 'memoria', tipo: 'base', accuracy: 0.65 },
      { domain: 'memoria', tipo: 'caricato', accuracy: 0.3 },
      { domain: 'esplorazione', tipo: 'base', accuracy: 0.5 },
      { domain: 'esplorazione', tipo: 'caricato', accuracy: 0.4 }
    ];
    const flag = computeCoordinationFlag(tuttiSottoSoglia);
    t.ok(!!flag, 'ogni base sotto soglia: il pattern viene segnalato');
    t.eq(flag.domain, 'coordinamento', 'dominio dedicato "coordinamento", distinto dai domini normali');
    t.eq(flag.suggestTaskMode, 'dualtask', 'suggerisce Doppio compito');
    t.ok(flag.isGlobalPattern, 'marcato come pattern globale, non una localizzazione di dominio');
    t.ok(!!flag.note, 'porta con sé la nota di cautela (non è una diagnosi)');
  });

  t.group('computeCoordinationFlag — un solo base nella norma: nessun flag (basta UNA base normale a invalidare il pattern globale)', () => {
    const unaBaseNormale = [
      { domain: 'attenzione', tipo: 'base', accuracy: 0.6 },
      { domain: 'memoria', tipo: 'base', accuracy: 0.85 }, // questa è nella norma
      { domain: 'esplorazione', tipo: 'base', accuracy: 0.5 }
    ];
    t.eq(computeCoordinationFlag(unaBaseNormale), null, 'una sola base nella norma basta a non segnalare il pattern globale');
  });

  t.group('computeCoordinationFlag — nessun risultato base: null, non un errore', () => {
    t.eq(computeCoordinationFlag([{ domain: 'attenzione', tipo: 'caricato', accuracy: 0.5 }]), null, 'nessuna riga "base" nei risultati: nessun flag, nessun crash');
    t.eq(computeCoordinationFlag([]), null, 'risultati vuoti: nessun flag');
  });

  t.group('mergeScreeningFlags — il pattern globale usa .note come motivo, non il calcolo base/caricato (bug reale corretto)', () => {
    const globalFlag = { suggestTaskMode: 'dualtask', suggestLabel: 'Doppio compito', domainLabel: 'Coordinamento generale', suggestedCfg: { taskMode: 'dualtask' }, isGlobalPattern: true, baseAcc: null, carAcc: null, note: 'Ogni blocco base è risultato sotto soglia — nota di cautela.' };
    const merged = mergeScreeningFlags([], [globalFlag]);
    t.eq(merged[0].motivo, globalFlag.note, 'motivo = la nota vera, non "screening: 0% con carico vs 0% base" (quello che usciva prima della correzione, perché null*100 in JS dà 0 silenziosamente, non un errore)');
  });

  t.group('mergeScreeningFlags — un flag di dominio normale continua a usare il calcolo base/caricato', () => {
    const domainFlag = { suggestTaskMode: 'gonogo', suggestLabel: 'Go/No-Go', domainLabel: 'Attenzione', suggestedCfg: { taskMode: 'gonogo' }, baseAcc: 0.9, carAcc: 0.5 };
    const merged = mergeScreeningFlags([], [domainFlag]);
    t.eq(merged[0].motivo, 'screening: 50% con carico vs 90% base', 'motivo costruito dal confronto base/caricato per un flag di dominio normale, invariato');
  });

  t.group('SCREENING_FINAL_GATE.ecologico.scoreOf — soglia sulle violazioni, non sull\'accuratezza', () => {
    t.eq(SCREENING_FINAL_GATE.ecologico.scoreOf({ goaltask: { violazioniCount: 0 } }), 1, '0 violazioni: passa');
    t.eq(SCREENING_FINAL_GATE.ecologico.scoreOf({ goaltask: { violazioniCount: 1 } }), 1, '1 violazione (tollerata): passa ancora');
    t.eq(SCREENING_FINAL_GATE.ecologico.scoreOf({ goaltask: { violazioniCount: 2 } }), 0, '2 violazioni: fallisce');
    t.eq(SCREENING_FINAL_GATE.ecologico.scoreOf({ goaltask: null }), 0, 'nessun dato goaltask (es. sessione interrotta): trattato come fallito, non un crash');
  });

  t.group('buildFinalGateRows — "divisa" fallisce: suggerisce Doppio compito, non genera una riga per "ecologico" (mai amministrato)', () => {
    const rows = buildFinalGateRows({ divisa: 0.5 }); // sotto soglia, "ecologico" non è mai stato somministrato (finalGateResults.ecologico è undefined)
    t.eq(rows.length, 1, 'una sola riga: solo "divisa", perché "ecologico" non è mai partito');
    t.eq(rows[0].flagged, true, '"divisa" flaggato');
    t.eq(rows[0].suggestTaskMode, 'dualtask', 'suggerisce Doppio compito');
    t.ok(!!rows[0].suggestedCfg, 'ha una configurazione suggerita');
  });

  t.group('buildFinalGateRows — "divisa" passa, "ecologico" fallisce: suggerisce Scenari ecologici con uno scenario vero, non la sonda breve', () => {
    const rows = buildFinalGateRows({ divisa: 0.9, ecologico: 0 });
    t.eq(rows.length, 2, 'due righe: sia "divisa" (passata) sia "ecologico" (fallita)');
    t.eq(rows[0].flagged, false, '"divisa" non flaggato (era sopra soglia)');
    t.eq(rows[1].flagged, true, '"ecologico" flaggato');
    t.eq(rows[1].suggestTaskMode, 'goaltask', 'suggerisce Scenari ecologici');
    t.eq(rows[1].suggestedCfg.goaltaskScenario, 'sei_compiti_classico', 'la configurazione suggerita punta a un vero scenario da assegnare, non a "screening_breve" (la sonda usata solo per la verifica)');
  });

  t.group('buildFinalGateRows — tutto passato: nessun flag, ma le righe restano visibili (esito atteso qui è "passato", non solo "non testato")', () => {
    const rows = buildFinalGateRows({ divisa: 0.9, ecologico: 1 });
    t.eq(rows.length, 2, 'entrambe le righe presenti anche quando tutto passa');
    t.ok(rows.every(r => !r.flagged), 'nessuna riga flaggata');
    t.ok(rows.every(r => !!r.note), 'ogni riga ha comunque una nota (di conferma, non solo di allarme)');
  });

  t.group('buildFinalGateRows — nessun gate mai partito (screening con qualcosa già flaggato al Livello 0/1): nessuna riga', () => {
    t.eq(buildFinalGateRows({}).length, 0, 'oggetto vuoto: nessuna riga, nessun crash');
  });
};
