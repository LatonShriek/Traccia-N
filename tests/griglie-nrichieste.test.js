'use strict';
// Griglie (20 nov 2026): numero di consegne modificabile (4–30) e niente più consegne a «blocco» (sotto-quadranti).
const { importCore } = require('./lib/core');

module.exports = async function run(t){
  const G = await importCore('../exercises/griglie.js');
  t.group('numero di consegne per griglia', () => {
    t.eq(G.genGrigliaScreen(5).rules.length, 10, 'senza indicazioni: 10 consegne come prima');
    for(const n of [4, 14, 24, 30]) t.eq(G.genGrigliaScreen(7, null, n).rules.length, n, n+' consegne richieste → '+n+' prodotte');
    t.eq(G.genGrigliaScreen(5, null, 99).rules.length, 30, 'tetto a 30');
    t.eq(G.genGrigliaScreen(5, null, 1).rules.length, 4, 'minimo 4');
  });
  t.group('niente consegne a blocchi', () => {
    let blocchi = 0;
    for(let i=0;i<30;i++) for(const lv of [3, 8, 10]) blocchi += G.genGrigliaScreen(lv, null, 20).rules.filter(r => /blocco in/.test(r.text)).length;
    t.eq(blocchi, 0, 'nessuna consegna «nel blocco in alto/basso a sinistra/destra» in 90 griglie');
  });
};
