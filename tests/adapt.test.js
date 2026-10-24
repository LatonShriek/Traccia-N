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
};
