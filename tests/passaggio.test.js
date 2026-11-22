'use strict';
// Codice di passaggio dei livelli Traccia-N <-> PdM: costruzione, lettura, conversione prudente tra le due scale.
const { importCore } = require('./lib/core');

module.exports = async function run(t){
  const P = await importCore('../core/passaggio.js');
  const A = await importCore('../core/assi.js');
  t.group('costruzione e lettura: i livelli tornano identici, anche parziali', () => {
    const c = P.passaggioBuild('TRN', { intrusopercettivo: 12, griglie: 8, inversione: 15 });
    t.ok(/^TRN-I12-G8-V15-\d\d$/.test(c), 'formato ' + c);
    const r = P.passaggioParse(c);
    t.ok(r.ok && r.origin === 'TRN' && r.levels.intrusopercettivo === 12 && r.levels.griglie === 8 && r.levels.inversione === 15, 'rilettura identica');
    t.eq(Object.keys(P.passaggioParse(P.passaggioBuild('PDM', { griglie: 4 })).levels).join(), 'griglie', 'parziale');
    t.eq(P.passaggioBuild('TRN', {}), null, 'nessun livello → nessun codice');
  });
  t.group('compatibile con il codice di PdM (stesso controllo)', () => {
    // codice calcolato a mano con la stessa formula di PdM: PDM-I12-G8-V15 → 87 (verificato nel browser test di PdM)
    const r = P.passaggioParse('PDM-I12-G8-V15-87');
    t.ok(r.ok, 'il codice prodotto da PdM è accettato');
    t.eq(r.levels.inversione, 15, 'livello letto');
  });
  t.group('tollerante su spazi e minuscole; errori di battitura respinti', () => {
    const c = P.passaggioBuild('PDM', { intrusopercettivo: 12.9, griglie: 0, inversione: 99 });
    const r = P.passaggioParse(' ' + c.toLowerCase() + '\n');
    t.ok(r.ok && r.levels.intrusopercettivo === 12 && r.levels.griglie === 1 && r.levels.inversione === 32, 'tagliati e limitati a 1-32');
    t.ok(!P.passaggioParse(c.replace('I12', 'I13')).ok, 'cifra sbagliata');
    t.ok(!P.passaggioParse('').ok && !P.passaggioParse('PDM-I12').ok && !P.passaggioParse('ABC-I12-00').ok, 'codici non validi');
  });
  t.group('conversione prudente: mai sopra il livello del generatore, e il ritorno non sale', () => {
    let over = 0, up = 0;
    for (let g = 1; g <= 32; g++) {
      const cfg = P.applyPassaggioToCfg({}, g);
      t.ok(cfg.adaptStartLevel >= 1 && cfg.adaptStartLevel <= 10, 'livello intero valido a gen ' + g);
      const back = P.genOfSavedCfg(cfg);
      if (back > g) over++;
      if (back < g - 4) up++;   // perde al massimo mezzo livello (≤ 2 punti della scala 1-32 per tratto da 3-4)
    }
    t.eq(over, 0, 'nessuna andata-e-ritorno supera il livello di partenza');
    t.eq(up, 0, 'e se ne discosta di poco');
    t.eq(P.applyPassaggioToCfg({}, 8).adaptStartLevel, 3, 'gen 8 = livello 3');
    t.eq(P.applyPassaggioToCfg({}, 1).adaptStartLevel, 1, 'gen 1 = livello 1');
    t.eq(P.applyPassaggioToCfg({}, 32).adaptStartLevel, 10, 'gen 32 = livello 10');
  });
  t.group('lettura del livello raggiunto da un paziente', () => {
    t.eq(P.genOfSavedCfg(null), null, 'nessuna config');
    t.eq(P.genOfSavedCfg({ adaptStartLevel: 3 }), 8, 'livello 3 → 8');
    t.eq(P.genOfSavedCfg({ adaptStartLevel: 4, adaptFine: 3.5 }), Math.floor(A.genOfFine(3.5)), 'decimale usato');
    t.eq(P.genOfSavedCfg({ adaptStartLevel: 3, adaptFine: 5.2 }), 8, 'decimale incoerente ignorato');
  });
};
