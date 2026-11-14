'use strict';
const { importCore } = require('./lib/core');
// Cambiamento del singolo paziente rispetto alla propria variabilità (js/core/nof1.js).
module.exports = async function run(t) {
  const N = await importCore('nof1.js');
  t.group('baselineOf: soglia da intervallo di previsione', () => {
    t.eq(N.baselineOf([71, 75]), null, 'con meno di 3 misure di base non si decide');
    const b = N.baselineOf([71, 75, 68]);
    t.ok(Math.abs(b.mean - 71.3333) < 1e-3 && Math.abs(b.sd - 3.5119) < 1e-3, 'media e DS campionaria');
    t.ok(Math.abs(b.threshold - 11.841) < 1e-3, 'soglia 90%: t(2) × DS × √(1+1/n) ≈ 11,8');
    const b95 = N.baselineOf([71, 75, 68], { conf: 0.95 });
    t.ok(b95.threshold > b.threshold, 'al 95% la soglia è più larga');
    const piu = N.baselineOf([71, 75, 68, 72, 70]);
    t.ok(piu.threshold < b.threshold, 'con più misure di base la soglia si restringe');
    t.eq(N.baselineOf([70, 70, 70]).threshold, 0, 'nessuna variabilità: soglia 0');
  });
  t.group('classifyChange', () => {
    const b = N.baselineOf([71, 75, 68]);
    t.eq(N.classifyChange(b, 86, true).label, 'migliorato', '+14,7 oltre la soglia: migliorato');
    t.eq(N.classifyChange(b, 76, true).label, 'nella variabilità', '+4,7: dentro la soglia');
    t.eq(N.classifyChange(b, 50, true).label, 'peggiorato', 'calo oltre la soglia');
    const bt = N.baselineOf([900, 950, 880]);
    t.eq(N.classifyChange(bt, 700, false).label, 'migliorato', 'tempi: più bassi = migliorato');
    t.eq(N.classifyChange(null, 80, true), null, 'senza base: nessun giudizio');
  });
  t.group('formaPerMisura: rotazione delle forme', () => {
    t.eq([0, 1, 2, 3, 4, 5].map(i => N.formaPerMisura(i, 3)), [0, 1, 2, 0, 1, 2], 'A B C A B C');
    t.eq(N.formaPerMisura(5, 1), 0, 'una sola forma');
  });
};
