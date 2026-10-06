'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// EXERCISES è enorme e non ci serve per intero qui — computeRCIRows lo usa
// solo per l'etichetta leggibile (r.exLabel), quindi forniamo uno stub
// minimo nel sandbox invece di estrarre l'intera tabella (che trascinerebbe
// dentro dipendenze non pertinenti a questo test).
const EXERCISES_STUB = {
  nback: { label: 'N-back' }, gonogo: { label: 'Go/No-Go' }, stopsignal: { label: 'Stop-Signal' },
  ant: { label: 'Attenzione (tipo ANT)' }, tapat: { label: 'TAPAT (allerta tonica/fasica)' }
};

const mod = loadPure(REPO_ROOT, [
  { name: 'isTapatLike', start: "  function isTapatLike(o){", end: "o.antMode==='tapat')); }" },
  { name: 'isTapatKey', start: "  function isTapatKey(r){", end: "'tapat' : r.taskMode; }" },
  { name: 'mean+sd', start: '  function mean(arr){', end: 'return Math.sqrt(arr.reduce((s,v)=>s+(v-m)*(v-m),0)/(arr.length-1));\n  }' },
  { name: 'RCI_BASELINE_N+RCI_RELIABILITY+rciPrimaryMetric', start: '  const RCI_BASELINE_N = 3;', end: '      return null;\n    }\n    return null;\n  }' },
  { name: 'sessionMismatchWarnings+computeRCIRows', start: '  function sessionMismatchWarnings(baselineItems, finalItems){', end: '    return rows;\n  }' }
], ['sessionMismatchWarnings', 'computeRCIRows', 'RCI_BASELINE_N', 'isTapatKey'], { EXERCISES: EXERCISES_STUB });

const { sessionMismatchWarnings, computeRCIRows, isTapatKey } = mod;

// Costruisce una sessione finta minima, con solo i campi che
// sessionMismatchWarnings/computeRCIRows guardano davvero.
function fakeSession(overrides) {
  return Object.assign({
    taskMode: 'gonogo', family: 'signal', ts: Date.now(),
    isi: 1600, trials: 24, targetRate: 0.30, finalLevel: 3, titrationMode: 'livello',
    metrics: { acc: 0.80 }
  }, overrides);
}

module.exports = function run(t) {
  t.group('sessionMismatchWarnings — nessun avviso quando i parametri sono stabili', () => {
    const baseline = [1, 2, 3].map(i => ({ r: fakeSession({ finalLevel: 3, isi: 1600 }) }));
    const final = [1, 2, 3].map(i => ({ r: fakeSession({ finalLevel: 3, isi: 1600 }) }));
    t.eq(sessionMismatchWarnings(baseline, final).length, 0, 'stessi livello/ISI/prove/frequenza/modalità — nessun avviso');
  });

  t.group('sessionMismatchWarnings — livello 1 vs livello 10: STESSO trattamento di un ISI diverso (risposta diretta alla domanda di Rodrigo)', () => {
    const baseline = [1, 2, 3].map(() => ({ r: fakeSession({ finalLevel: 1 }) }));
    const final = [1, 2, 3].map(() => ({ r: fakeSession({ finalLevel: 10 }) }));
    const warnings = sessionMismatchWarnings(baseline, final);
    t.ok(warnings.some(w => w.includes('livello')), 'un salto di livello così ampio genera un avviso, esattamente come un ISI molto diverso');
  });

  t.group('sessionMismatchWarnings — rileva ciascun tipo di scostamento singolarmente', () => {
    const base = () => fakeSession({});
    t.ok(sessionMismatchWarnings([{ r: base() }], [{ r: fakeSession({ isi: 2400 }) }]).some(w => w.includes('ISI')), 'ISI molto diverso');
    t.ok(sessionMismatchWarnings([{ r: base() }], [{ r: fakeSession({ trials: 60 }) }]).some(w => w.includes('prove')), 'numero di prove molto diverso');
    t.ok(sessionMismatchWarnings([{ r: base() }], [{ r: fakeSession({ targetRate: 0.10 }) }]).some(w => w.includes('frequenza')), 'frequenza molto diversa');
    t.ok(sessionMismatchWarnings([{ r: base() }], [{ r: fakeSession({ titrationMode: 'manuale' }) }]).some(w => w.includes('modalità')), 'modalità di titolazione diversa (livello identico, ma cambia la logica con cui è stato raggiunto)');
  });

  t.group('sessionMismatchWarnings — dato mancante non genera un falso allarme né una falsa comparabilità', () => {
    const baseline = [{ r: fakeSession({ isi: null }) }];
    const final = [{ r: fakeSession({ isi: null }) }];
    t.eq(sessionMismatchWarnings(baseline, final).filter(w => w.includes('ISI')).length, 0, 'se il dato manca su entrambi i lati, quel controllo viene saltato invece di confrontare null con null');
  });

  t.group('computeRCIRows — TAPAT (vecchio e nuovo formato) non si mescola con ANT classico (bug reale corretto con la separazione ANT/TAPAT)', () => {
    const items = [
      // ANT classico, 4 sedute stabili
      fakeSession({ taskMode: 'ant', antMode: 'classico', ts: 1, finalLevel: 5, metrics: { acc: 0.60 } }),
      fakeSession({ taskMode: 'ant', antMode: 'classico', ts: 2, finalLevel: 5, metrics: { acc: 0.62 } }),
      fakeSession({ taskMode: 'ant', antMode: 'classico', ts: 3, finalLevel: 5, metrics: { acc: 0.80 } }),
      fakeSession({ taskMode: 'ant', antMode: 'classico', ts: 4, finalLevel: 5, metrics: { acc: 0.82 } }),
      // TAPAT salvato nel formato VECCHIO (prima della separazione)
      fakeSession({ taskMode: 'ant', antMode: 'tapat', family: 'choice', ts: 5, finalLevel: 3, choice: { total: 20, correct: 10 } }),
      fakeSession({ taskMode: 'ant', antMode: 'tapat', family: 'choice', ts: 6, finalLevel: 3, choice: { total: 20, correct: 11 } }),
      // TAPAT salvato nel formato NUOVO (esercizio separato)
      fakeSession({ taskMode: 'tapat', family: 'choice', ts: 7, finalLevel: 4, choice: { total: 20, correct: 16 } }),
      fakeSession({ taskMode: 'tapat', family: 'choice', ts: 8, finalLevel: 4, choice: { total: 20, correct: 17 } })
    ];
    const rows = computeRCIRows(items);
    const antRow = rows.find(r => r.exLabel === 'Attenzione (tipo ANT)');
    const tapatRow = rows.find(r => r.exLabel === 'TAPAT (allerta tonica/fasica)');
    t.ok(!!antRow, 'esiste una riga per ANT classico');
    t.ok(!!tapatRow, 'esiste una riga SEPARATA per TAPAT');
    t.eq(antRow.n, 4, 'ANT classico conta solo le sue 4 sedute, non le 4 di TAPAT mescolate dentro');
    t.eq(tapatRow.n, 4, 'TAPAT conta le sue 4 sedute TOTALI, vecchio formato (2) + nuovo formato (2) unificati nello stesso bucket');
  });

  t.group('computeRCIRows — sopprime il numero (non le medie) quando non comparabile', () => {
    const items = [
      fakeSession({ ts: 1, finalLevel: 1, metrics: { acc: 0.60 } }),
      fakeSession({ ts: 2, finalLevel: 1, metrics: { acc: 0.62 } }),
      fakeSession({ ts: 3, finalLevel: 1, metrics: { acc: 0.61 } }),
      fakeSession({ ts: 4, finalLevel: 10, metrics: { acc: 0.90 } }),
      fakeSession({ ts: 5, finalLevel: 10, metrics: { acc: 0.92 } }),
      fakeSession({ ts: 6, finalLevel: 10, metrics: { acc: 0.91 } })
    ];
    const rows = computeRCIRows(items);
    t.eq(rows.length, 1, 'una riga per il taskMode "gonogo"');
    const row = rows[0];
    t.eq(row.comparable, false, 'livello 1 vs livello 10: non comparabile');
    t.eq(row.rci, null, 'RCI soppresso (null), non un numero fuorviante');
    t.ok(row.baselineMean != null && row.finalMean != null, 'le medie grezze restano comunque disponibili — solo l\'indice sintetico viene tolto, non il dato');
  });

  t.group('computeRCIRows — calcola davvero l\'RCI quando i parametri sono stabili', () => {
    const items = [
      fakeSession({ ts: 1, metrics: { acc: 0.60 } }),
      fakeSession({ ts: 2, metrics: { acc: 0.62 } }),
      fakeSession({ ts: 3, metrics: { acc: 0.61 } }),
      fakeSession({ ts: 4, metrics: { acc: 0.85 } }),
      fakeSession({ ts: 5, metrics: { acc: 0.87 } }),
      fakeSession({ ts: 6, metrics: { acc: 0.86 } })
    ];
    const rows = computeRCIRows(items);
    t.eq(rows[0].comparable, true, 'stessi parametri in ogni sessione — comparabile');
    t.ok(typeof rows[0].rci === 'number', 'RCI è un numero vero, non null');
  });
};
