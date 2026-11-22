'use strict';
// Inversione e riordino: scala di complessità (22 nov 2026) — colori 1/2/3, tipologie in ordine, sottolineati, richieste per stringa.
const { importCore } = require('./lib/core');

module.exports = async function run(t){
  const INV = await importCore('../exercises/inversione.js');
  const N = 400;
  t.group('colori presenti per livello: 1 al 2, 2 al 3, 3 dal 5; sottolineati dal 3', () => {
    t.eq(JSON.stringify(INV.inversioneColorsAt(1)), '[]', 'livello 1 senza colori');
    t.eq(INV.inversioneColorsAt(2).length, 1, 'livello 2: 1 colore');
    t.eq(INV.inversioneColorsAt(3).length, 2, 'livello 3: 2 colori');
    t.eq(INV.inversioneColorsAt(5).length, 3, 'livello 5: 3 colori');
    let bad = 0, blue5 = 0, under = 0;
    for (let lv = 1; lv <= 10; lv++) for (let i = 0; i < N; i++) {
      const it = INV.genInversioneItem(lv, 'auto', new Set());
      const allowed = new Set(INV.inversioneColorsAt(lv));
      if (lv >= 8) allowed.add('red'); // distrattori dei livelli alti
      it.tokens.forEach(x => {
        if (x.color && !allowed.has(x.color)) bad++;
        if (x.under && lv < 3) bad++;
        if (x.color === 'blue' && lv >= 5) blue5++;
        if (x.under) under++;
      });
    }
    t.eq(bad, 0, 'nessun colore o sottolineato prima del suo livello');
    t.ok(blue5 > 0 && under > 0, 'blu e sottolineati compaiono quando previsti');
  });
  t.group('ordine delle tipologie singole', () => {
    const S = INV.INVERSIONE_SINGLE;
    t.ok(S.grandi.minLevel === 2 && S.rossi.minLevel === 2, 'grande/piccolo e rossi al 2');
    t.ok(S.pari.minLevel === 3 && S.verdi.minLevel === 3, 'pari/dispari e verdi al 3');
    t.ok(S.vocali.minLevel === 4 && S.maiuscole.minLevel === 4, 'vocali/consonanti e maiuscole al 4');
    t.ok(S.sottolineati.minLevel === 3, 'sottolineati al 3, subito dopo grandi/piccoli (2)');
    t.ok(S.blu.minLevel === 5, 'blu al 5');
  });
  t.group('richieste per stringa: la 2ª dal livello 2, la 3ª dal livello 4', () => {
    const P = INV.INVERSIONE_NCONS_P;
    t.ok(P[0][1] === 0 && P[1][1] > 0, 'la seconda richiesta compare al livello 2');
    t.ok(P[2][2] === 0 && P[3][2] > 0, 'la terza richiesta compare al livello 4');
    let max2 = 0;
    for (let i = 0; i < N; i++) max2 = Math.max(max2, INV.genInversioneItem(2, 'auto', new Set()).consegne.length);
    t.eq(max2, 2, 'al livello 2 si arriva a 2 richieste');
  });
  t.group('la selezione non è mai da sola: sempre accoppiata a una manipolazione, in ordine casuale', () => {
    const M = INV.INVERSIONE_MANIP;
    let bad = 0, selFirst = 0, manFirst = 0, multi = 0;
    for (let lv = 1; lv <= 10; lv++) for (let i = 0; i < N; i++) {
      const it = INV.genInversioneItem(lv, 'auto', new Set());
      const cs = it.consegne;
      const isSel = c => !c.double && !M.has(c.rule);
      const nSel = cs.filter(isSel).length, nMan = cs.filter(c => M.has(c.rule)).length;
      if (nSel > nMan) bad++;                       // ogni selezione ha la sua manipolazione
      if (cs.length === 1 && isSel(cs[0])) bad++;   // mai una selezione da sola
      if (cs.length >= 2 && cs.some(isSel)) { multi++; if (isSel(cs[0])) selFirst++; else manFirst++; }
    }
    t.eq(bad, 0, 'nessuna selezione senza manipolazione');
    t.ok(multi > 100 && selFirst > multi * 0.25 && manFirst > multi * 0.25, 'ordine casuale (' + selFirst + ' selezione prima, ' + manFirst + ' manipolazione prima)');
  });
  t.group('doppie con colore: usano due colori e il resto dei caratteri resta coerente', () => {
    let n = 0, bad = 0;
    for (let i = 0; i < 600; i++) {
      const it = INV.genInversioneItem(6, 'doppie', new Set());
      it.consegne.forEach(c => { if (c.double) n++; if (c.double && !c.expectedTokens.length) bad++; });
      const cols = new Set(it.tokens.map(x => x.color).filter(Boolean));
      if (cols.size > 2 && it.consegne.some(c => /ROSS|VERD|BLU/.test(c.instruction))) bad++;
    }
    t.ok(n > 100 && bad === 0, 'doppie valide (' + n + ')');
  });
};
