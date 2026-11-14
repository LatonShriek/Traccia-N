'use strict';
const { importCore } = require('./lib/core');

// Regola unica di titolazione (js/core/adapt.js): soglie e filtro RT dichiarati.
module.exports = async function run(t) {
  const { ADAPT_BLOCK, adaptStep, countedOutcome } = await importCore('adapt.js');
  t.group('adaptStep — soglie 0.85 / 0.70, esclusive, e limiti', () => {
    t.eq(ADAPT_BLOCK, 8, 'blocco di 8 prove');
    t.eq(adaptStep(0.86, 3, 1, 10), 1, 'sopra 0.85 sale');
    t.eq(adaptStep(0.85, 3, 1, 10), 0, 'esattamente 0.85 resta');
    t.eq(adaptStep(0.69, 3, 1, 10), -1, 'sotto 0.70 scende');
    t.eq(adaptStep(0.70, 3, 1, 10), 0, 'esattamente 0.70 resta');
    t.eq(adaptStep(1, 10, 1, 10), 0, 'al massimo non sale');
    t.eq(adaptStep(0, 1, 1, 10), 0, 'al minimo non scende');
    t.eq(adaptStep(1, 4, 2, 4), 0, 'rispetta il tetto di fascia');
    t.eq(adaptStep(0, 2, 2, 4), 0, 'rispetta il minimo di fascia');
  });
  t.group('countedOutcome — filtro RT mediana × 1.6, serve storia di 4 RT', () => {
    const h = [500, 500, 500, 500];
    t.eq(countedOutcome(true, 800, h), true, '800 ≤ 500×1.6 conta');
    t.eq(countedOutcome(true, 801, h), false, '801 > 800 non conta');
    t.eq(countedOutcome(true, 5000, [500, 500, 500]), true, 'con meno di 4 RT nessun filtro');
    t.eq(countedOutcome(false, 100, h), false, 'errore resta errore');
    t.eq(countedOutcome(true, null, h), true, 'RT assente: conta');
    const before = h.slice(); countedOutcome(true, 900, h);
    t.eq(h, before, 'non modifica la storia');
  });
  const A = await importCore('adapt.js');
  t.group('livello fine: mezzi gradini, dispersione, tempo per tipo di prova', () => {
    t.eq(A.adaptStepFine(0.9, 5, 1, 10), 0.5, 'sale di mezzo gradino');
    t.eq(A.adaptStepFine(0.5, 5, 1, 10), -0.5, 'scende di mezzo gradino');
    t.eq(A.adaptStepFine(0.9, 10, 1, 10), 0, 'al massimo non sale');
    t.eq(A.adaptStepFine(0.9, 9.5, 1, 10), 0.5, 'da 9,5 arriva a 10');
    t.eq(A.adaptStepFine(0.1, 1, 1, 10), 0, 'al minimo non scende');
    let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cnt = {}; let sum = 0; const N = 20000;
    for (let i = 0; i < N; i++) { const l = A.trialLevelFromFine(6.5, 1, 10, rng); cnt[l] = (cnt[l] || 0) + 1; sum += l; }
    t.ok(Object.keys(cnt).length >= 3, 'le prove si disperdono su almeno 3 livelli interi');
    t.ok(Math.abs(sum / N - 6.5) < 0.1, 'la media delle prove resta il livello vero (6,5)');
    const lo = Math.min(...Object.keys(cnt).map(Number)), hi = Math.max(...Object.keys(cnt).map(Number));
    t.ok(lo >= 5 && hi <= 8, 'mai oltre ±1 dal livello vero (arrotondato)');
    for (let i = 0; i < 2000; i++) { const l = A.trialLevelFromFine(10, 1, 10, rng); if (l > 10 || l < 9) { t.ok(false, 'a 10 mai fuori 9-10'); break; } }
    for (let i = 0; i < 2000; i++) { const l = A.trialLevelFromFine(1, 1, 10, rng); if (l < 1 || l > 2) { t.ok(false, 'a 1 mai fuori 1-2'); break; } }
    const st = {};
    for (let i = 0; i < 4; i++) A.countedByBucket(st, 'a', true, 500);
    t.eq(A.countedByBucket(st, 'a', true, 900), false, 'corretta ma lenta (900 > 800) non conta');
    t.eq(A.countedByBucket(st, 'b', true, 900), true, 'altro tipo di prova: nessuna storia, conta');
    t.eq(A.fineStartOf({ adaptStartLevel: 7, adaptFine: 6.5 }), 6.5, 'fine coerente (6,5 → 7): usato');
    t.eq(A.fineStartOf({ adaptStartLevel: 3, adaptFine: 6.5 }), 3, 'fine incoerente: si usa il livello intero');
    t.eq(A.fineLabel(6.5), '6,5', 'etichetta con virgola');
    t.eq(A.fineLabel(7), '7', 'intero senza decimali');
  });
};
