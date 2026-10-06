'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// Blocchi puri: computeExerciseTimeSummary dipende da EXERCISES/EXERCISE_GROUPS
// (forniti come stub qui sotto — solo le chiavi/label servono, non le
// istruzioni vere) e da primaryAccuracyOf/mean/isTapatLike/isTapatKey,
// tutti estratti dal vero index.html, mai copiati a mano.
const EXERCISES = {
  nback: { label: 'N-back classico' },
  gonogo: { label: 'Go/No-Go' },
  ant: { label: 'Attenzione (tipo ANT)' },
  tapat: { label: 'TAPAT (allerta tonica/fasica)' },
  simon: { label: 'Simon (conflitto spazio-risposta)' }
};
const EXERCISE_GROUPS = [
  { label: 'Attenzione e inibizione', keys: ['gonogo', 'ant', 'tapat', 'simon'] },
  { label: 'Memoria di lavoro', keys: ['nback'] }
];

const mod = loadPure(REPO_ROOT, [
  { name: 'isTapatLike', start: "  function isTapatLike(o){", end: "o.antMode==='tapat')); }" },
  { name: 'primaryAccuracyOf', start: '  function primaryAccuracyOf(rec){', end: "return null;\n  }" },
  { name: 'summaryBlock', start: '  function isTapatKey(r){', end: "  }\n  function mean(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }" }
], ['computeExerciseTimeSummary', 'isTapatKey'], { EXERCISES, EXERCISE_GROUPS });

const { computeExerciseTimeSummary, isTapatKey } = mod;

function rec(overrides) {
  return Object.assign({
    taskMode: 'nback', family: 'signal', ts: 1000, dateLabel: '01/01/2026',
    durationMs: 60000, finalLevel: 3, metrics: { acc: 0.8 }
  }, overrides);
}

module.exports = function run(t) {
  t.group('computeExerciseTimeSummary — aggregazione base per esercizio', () => {
    const items = [
      rec({ taskMode: 'nback', ts: 1000, dateLabel: '01/01', durationMs: 60000, finalLevel: 2, metrics: { acc: 0.7 } }),
      rec({ taskMode: 'nback', ts: 2000, dateLabel: '02/01', durationMs: 120000, finalLevel: 3, metrics: { acc: 0.9 } })
    ];
    const rows = computeExerciseTimeSummary(items);
    t.eq(rows.length, 1, 'un solo esercizio presente nello storico di questo paziente');
    t.eq(rows[0].label, 'N-back classico', 'etichetta presa da EXERCISES');
    t.eq(rows[0].n, 2, 'due sedute contate');
    t.eq(rows[0].tempoTotaleMs, 180000, 'tempo totale = somma delle durate (60s + 120s)');
    t.eq(rows[0].livelloRaggiunto, 3, 'livello raggiunto = livello dell\'ULTIMA seduta per data (2000 > 1000), non della prima né una media');
    t.approx(rows[0].successoMedio, 0.8, 0.001, 'successo medio = media semplice delle accuratezze (0.7 e 0.9)');
    t.eq(rows[0].ultimaSeduta, '02/01', 'data dell\'ultima seduta riportata');
  });

  t.group('computeExerciseTimeSummary — ordine coerente con EXERCISE_GROUPS, non con l\'ordine di arrivo dei dati', () => {
    const items = [
      rec({ taskMode: 'simon', ts: 1, finalLevel: 1 }),
      rec({ taskMode: 'nback', ts: 2, finalLevel: 1 }),
      rec({ taskMode: 'gonogo', ts: 3, finalLevel: 1, family: 'signal' })
    ];
    const rows = computeExerciseTimeSummary(items);
    t.eq(rows.map(r => r.key), ['gonogo', 'simon', 'nback'], 'ordine = ordine di EXERCISE_GROUPS (gonogo poi simon nel primo gruppo, nback nel secondo), non l\'ordine con cui i record compaiono nello storico');
  });

  t.group('computeExerciseTimeSummary — TAPAT: record vecchi (taskMode ant + antMode tapat) e nuovi (taskMode tapat) finiscono nello STESSO bucket', () => {
    const items = [
      rec({ taskMode: 'ant', antMode: 'tapat', ts: 1, dateLabel: 'vecchio', family: 'choice', choice: { total: 10, correct: 7 }, finalLevel: 2 }),
      rec({ taskMode: 'tapat', ts: 2, dateLabel: 'nuovo', family: 'choice', choice: { total: 10, correct: 9 }, finalLevel: 4 })
    ];
    const rows = computeExerciseTimeSummary(items);
    t.eq(rows.length, 1, 'una sola riga per TAPAT, non due — vecchio e nuovo formato si fondono nello stesso bucket');
    t.eq(rows[0].n, 2, 'entrambe le sedute contate insieme');
    t.eq(rows[0].livelloRaggiunto, 4, 'livello riportato è quello della seduta più recente (formato nuovo, ts=2), non quello del formato vecchio');
    t.eq(isTapatKey({ taskMode: 'ant', antMode: 'tapat' }), 'tapat', 'isTapatKey normalizza il formato legacy alla stessa chiave del formato nuovo');
    t.eq(isTapatKey({ taskMode: 'ant', antMode: 'classico' }), 'ant', 'ANT classico NON viene normalizzato a tapat');
  });

  t.group('computeExerciseTimeSummary — esercizio senza metrica di successo utilizzabile', () => {
    const items = [
      rec({ taskMode: 'nback', metrics: {} })
    ];
    const rows = computeExerciseTimeSummary(items);
    t.eq(rows[0].successoMedio, null, 'nessuna accuratezza disponibile: successoMedio resta null, non 0 o NaN');
  });

  t.group('computeExerciseTimeSummary — nessuna sessione', () => {
    t.eq(computeExerciseTimeSummary([]).length, 0, 'storico vuoto: nessuna riga, nessun errore');
  });
};
