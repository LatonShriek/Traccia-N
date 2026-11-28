'use strict';
// Griglie (28 nov 2026): le consegne di posizione dicono i numeri di riga e colonna; le celle giuste non cambiano.
const fs = require('fs');
const path = require('path');
const { importCore } = require('./lib/core');

module.exports = async function run(t){
  const G = await importCore('../exercises/griglie.js');
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'exercises', 'griglie.js'), 'utf8');
  const a = src.indexOf('function posLines'), b = src.indexOf('// ---------- PUNTEGGIO DI DIFFICOLTÀ');
  const buildPosOptions = new Function(src.slice(a, b) + '\nreturn buildPosOptions;')();
  // quali celle indica il TESTO, letto da una persona che guarda i numeri
  const lista = x => { const m = /^(\d+)–(\d+)$/.exec(x); if(m){ const o=[]; for(let i=+m[1];i<=+m[2];i++) o.push(i); return o; } return x.split(/, | e /).map(Number); };
  const dalTesto = (txt, rows, cols) => {
    let m;
    if((m = /^nell[ae] (?:rig[ah]e?) (?:pari |dispari )?\(?([\d–, e]+?)\)?$/.exec(txt))) return (r) => lista(m[1]).includes(r);
    if((m = /^nell[ae] (?:colonn[ae]) (?:pari |dispari )?\(?([\d–, e]+?)\)?$/.exec(txt))) return (r, c) => lista(m[1]).includes(c);
    return null;
  };
  t.group('numeri nel testo = celle contate, per tutte le grandezze (3–10 righe, 4–14 colonne)', () => {
    let controllate = 0; const errori = [];
    for(let rows=3; rows<=10; rows++) for(let cols=4; cols<=14; cols++){
      for(const o of buildPosOptions(rows, cols)){
        if(/metà|prim[ae]|ultim[ae]|seconda|penultima/.test(o.text)) errori.push('parole vaghe: '+o.text);
        if(/NaN|undefined|\(\)/.test(o.text)) errori.push('testo rotto: '+o.text);
        const sel = dalTesto(o.text, rows, cols);
        if(!sel) continue;
        controllate++;
        for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) if(!!o.f({row:r,col:c}) !== !!sel(r+1, c+1)){ errori.push(rows+'×'+cols+' '+o.text); r=rows; break; }
      }
    }
    t.ok(controllate > 1000, 'consegne confrontate: '+controllate);
    t.eq(errori.slice(0,5).join(' | '), '', 'nessuna differenza fra testo e celle');
  });
  t.group('esempi con 5 righe e 7 colonne', () => {
    const testi = buildPosOptions(5,7).map(o=>o.text);
    for(const x of ['nelle colonne 1–3','nelle colonne 5–7','nelle righe 1–2','nelle righe 4–5','nelle colonne 1 e 7','nelle righe 2 e 4','né sulla riga 1 né sulla colonna 1','nelle righe 1–2 oppure nelle colonne 6–7'])
      t.ok(testi.includes(x), '«'+x+'»');
  });
  t.group('versione a tocco di ogni consegna di conteggio', () => {
    let male = 0, tot = 0;
    for(let i=0;i<40;i++) for(const lv of [1,4,7,10]) for(const r of G.genGrigliaScreen(lv).rules){
      tot++;
      const soloNumero = r.vk==='rows' || r.vk==='whichrow';
      if(soloNumero ? r.touch!==null : !(r.touch && r.touch.target.length)) male++;
    }
    t.eq(male, 0, 'consegne senza versione a tocco corretta su '+tot);
  });
};
