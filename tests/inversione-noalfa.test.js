'use strict';
// Inversione e riordino: opzione «senza ordine alfabetico» (22 nov 2026) — per chi ha difficoltà di lettura (DSA), senza toccare livello né progressione.
const { importCore } = require('./lib/core');

module.exports = async function run(t){
  const INV = await importCore('../exercises/inversione.js');
  t.group('senza ordine alfabetico: mai su lettere e alfanumerici, a nessun livello', () => {
    let bad = 0, nLet = 0, nNum = 0;
    for (let lv = 1; lv <= 10; lv++) for (let i = 0; i < 150; i++) {
      const it = INV.genInversioneItem(lv, 'auto', new Set(), { noAlpha: true });
      if (it.kind === 'letters' || it.kind === 'alnum') {
        nLet++;
        it.consegne.forEach(c => { if (['ordina', 'decrescente'].includes(c.rule) || /alfabetic|da Z ad A|in ordine \(/.test(c.instruction)) bad++; });
      } else nNum++;
    }
    t.eq(bad, 0, 'nessuna consegna alfabetica su lettere/alfanumerici');
    t.ok(nLet > 100 && nNum > 100, 'restano sia lettere/alfanumerici sia cifre/numeri (' + nLet + '/' + nNum + ')');
  });
  t.group('senza l\'opzione l\'ordine alfabetico c\'è ancora, e livelli/tempi sono identici', () => {
    let alfa = 0;
    for (let i = 0; i < 300; i++) { const it = INV.genInversioneItem(1, 'auto', new Set()); if (it.kind === 'letters' && it.consegne.some(c => c.rule === 'ordina')) alfa++; }
    t.ok(alfa > 0, 'livello 1: «riordina» compare quando l\'opzione è spenta');
    for (let lv = 1; lv <= 10; lv++) {
      const a = INV.genInversioneItem(lv, 'auto', new Set(), { noAlpha: true }), b = INV.inversionePlanAt(lv);
      t.ok(a.gen === b.gen, 'livello ' + lv + ': stesso livello del generatore');
    }
  });
};
