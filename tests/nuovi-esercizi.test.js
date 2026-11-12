'use strict';
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const IP = await importCore('../exercises/intrusopercettivo.js');
  const PS = await importCore('../exercises/pasat.js');

  t.group('Intruso percettivo — un solo elemento unico, tutti gli altri almeno 2 volte, a ogni livello', () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      let ok = true, sizeOk = true;
      for (let i = 0; i < 60; i++) {
        const tr = IP.genIntrusoTrial(lvl);
        const counts = {};
        tr.items.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        const singles = Object.keys(counts).filter(v => counts[v] === 1);
        if (singles.length !== 1 || tr.items[tr.oddIndex] !== singles[0]) ok = false;
        if (tr.items.length !== IP.INTRUSO_LEVELS[lvl].n) sizeOk = false;
      }
      t.ok(ok, 'livello ' + lvl + ': un unico elemento unico, e oddIndex lo indica');
      t.ok(sizeOk, 'livello ' + lvl + ': numero di elementi = tabella');
    }
  });
  t.group('Intruso percettivo — la difficoltà cresce: più elementi, simboli più lunghi, meno tempo', () => {
    const L = IP.INTRUSO_LEVELS;
    for (let l = 2; l <= 10; l++) {
      t.ok(L[l].n >= L[l - 1].n && L[l].len >= L[l - 1].len && L[l].limitMs <= L[l - 1].limitMs, 'livello ' + l + ' non è più facile del precedente');
    }
    t.ok(IP.intrusoFamiliesAt(1).every(f => ['digit', 'letter'].includes(f.id)), 'al livello 1 solo cifre e lettere');
    t.ok(IP.intrusoFamiliesAt(10).length === IP.INTRUSO_FAMILIES.length, 'al livello 10 tutte le famiglie');
  });
  t.group('Intruso percettivo — punteggio e adattamento', () => {
    const tr = { oddIndex: 3 };
    t.eq(IP.scoreIntrusoTrial(tr, 3, 900), { correct: true, omitted: false, rt: 900 }, 'tocco giusto');
    t.eq(IP.scoreIntrusoTrial(tr, 1, 900).correct, false, 'tocco sbagliato');
    t.eq(IP.scoreIntrusoTrial(tr, null).omitted, true, 'tempo scaduto = omissione');
    const cfg = { adaptive: true, adaptStartLevel: 4 }, s = { ipAdaptBlock: [1, 1, 1, 1, 1, 1] };
    IP.maybeAdaptIntruso(cfg, s);
    t.eq([cfg.adaptStartLevel, s.ipAdaptBlock.length], [5, 0], 'sopra l\'85% sale di un livello');
    const c2 = { adaptive: true, adaptStartLevel: 4 }, s2 = { ipAdaptBlock: [0, 0, 0, 1, 0, 0] };
    IP.maybeAdaptIntruso(c2, s2);
    t.eq(c2.adaptStartLevel, 3, 'sotto il 70% scende');
    const c3 = { adaptive: false, adaptStartLevel: 4 }, s3 = { ipAdaptBlock: [1, 1, 1, 1, 1, 1] };
    IP.maybeAdaptIntruso(c3, s3);
    t.eq(c3.adaptStartLevel, 4, 'senza adattivo il livello non si muove');
  });

  t.group('PASAT — risposta attesa: somme, giorni, mesi; nessuna risposta nei primi `lag` stimoli', () => {
    const s = [3, 4, 9, 2];
    t.eq(PS.pasatExpected('somme', s, 0, 3), null, 'il primo stimolo non ha risposta');
    t.eq([1, 2, 3].map(i => PS.pasatExpected('somme', s, i, 3)), [7, 13, 11], 'somma con lo stimolo precedente');
    t.eq([2, 3].map(i => PS.pasatExpected('somme', s, i, 7)), [12, 6], 'lag 2: somma con quello di due posti prima');
    const g = ['lunedì', 'sabato', 'domenica'];
    t.eq(PS.pasatExpected('giorni', g, 1, 3), 'martedì', 'giorno dopo il precedente (shift 1)');
    t.eq(PS.pasatExpected('giorni', g, 2, 4), 'lunedì', 'sabato + 2 = lunedì (si riparte dalla settimana)');
    t.eq(PS.pasatExpected('mesi', ['dicembre', 'marzo'], 1, 3), 'gennaio', 'dicembre + 1 = gennaio');
  });
  t.group('PASAT — serie, risposte possibili, livelli', () => {
    for (const m of ['somme', 'giorni', 'mesi']) {
      const ser = PS.genPasatSeries(m, 40);
      t.ok(ser.length === 40 && ser.every((v, i) => i === 0 || v !== ser[i - 1]), m + ': serie lunga come richiesto, mai lo stesso stimolo due volte di fila');
      t.ok(ser.every(v => PS.pasatPool(m).includes(v)), m + ': stimoli dal proprio insieme');
      for (let l = 1; l <= 10; l++) {
        const okAns = ser.every((_, i) => { const e = PS.pasatExpected(m, ser, i, l); return e === null || PS.pasatAnswers(m).includes(e); });
        if (!okAns) { t.ok(false, m + ' livello ' + l + ': risposta attesa fuori dai pulsanti'); }
      }
    }
    t.eq(PS.pasatAnswers('somme').length, 17, 'somme: pulsanti da 2 a 18');
    t.ok(PS.PASAT_LEVELS[1].isi > PS.PASAT_LEVELS[6].isi && PS.PASAT_LEVELS[7].lag === 2, 'il ritmo si stringe, dal 7 il lag è 2');
    t.eq(PS.scorePasatTrial(7, 7, 800).correct, true, 'risposta giusta');
    t.eq(PS.scorePasatTrial(7, null).omitted, true, 'nessuna risposta = omissione');
    const cfg = { adaptive: true, adaptStartLevel: 1 }, s = { pasatAdaptBlock: [1, 1, 1, 1, 1, 1, 1, 1] };
    PS.maybeAdaptPasat(cfg, s);
    t.eq(cfg.adaptStartLevel, 2, 'adattivo: sale dopo 8 prove giuste');
  });
};
