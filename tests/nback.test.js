'use strict';
const { importCore } = require('./lib/core');

// Generatore N-back (js/exercises/nback.js, passo 5a): finora senza test diretti.
// Si controllano le proprietà che il paziente "sente": un bersaglio è davvero
// uguale allo stimolo di n prove prima, un non-bersaglio no, mai più di 3
// ripetizioni di fila, le prime n prove non sono valutabili.
module.exports = async function run(t) {
  const { genNbackTrial, nbackSameVal } = await importCore('../exercises/nback.js');
  const { nbackParamsForLevel, nbackLureLag } = await importCore('levels.js');

  function gen(cfg, level, count) {
    const session = { seq: [], liveNLevel: level };
    for (let i = 0; i < count; i++) genNbackTrial(cfg, session);
    return session.seq;
  }
  const base = { taskMode: 'nback', stimType: 'lettere', nbackMista: 'no', titrationMode: 'manuale', targetRate: 0.3 };

  await t.group('proprietà del generatore, a tutti i 10 livelli (materiale unico)', () => {
    let bad = [];
    for (let level = 1; level <= 10; level++) {
      const { n } = nbackParamsForLevel(level);
      const lag = nbackLureLag(n);
      for (let rep = 0; rep < 20; rep++) {
        const seq = gen(base, level, 80);
        seq.forEach((tr, i) => {
          if (tr.nAtGeneration !== n) bad.push('L' + level + ' n sbagliato');
          if (i < n && (tr.valid || tr.isTarget)) bad.push('L' + level + ' prova ' + i + ' non valutabile ma valida');
          if (i >= n && !tr.valid) bad.push('L' + level + ' prova valutabile non valida');
          if (tr.isTarget && tr.val !== seq[i - n].val) bad.push('L' + level + ' bersaglio diverso da n prima');
          if (i >= n && !tr.isTarget && tr.val === seq[i - n].val) bad.push('L' + level + ' non-bersaglio uguale a n prima');
          if (tr.isLure && i < lag) bad.push('L' + level + ' lure troppo presto');
          if (i >= 3 && tr.val === seq[i - 1].val && tr.val === seq[i - 2].val && tr.val === seq[i - 3].val) bad.push('L' + level + ' più di 3 ripetizioni');
        });
      }
    }
    t.eq(bad.slice(0, 3), [], 'nessuna violazione su 200 sequenze da 80 prove');
  });

  await t.group('frequenza dei bersagli', () => {
    // Manuale: segue targetRate. Si misura sulle prove valutabili (le prime n non possono essere bersagli).
    function rate(cfg, level, reps) {
      const { n } = nbackParamsForLevel(level);
      let targets = 0, valid = 0;
      for (let r = 0; r < reps; r++) gen(cfg, level, 60).forEach(tr => { if (tr.valid) { valid++; if (tr.isTarget) targets++; } });
      return targets / valid;
    }
    // Livello 5 (n=2, senza lure): con n=1 le ripetizioni di fila sono limitate a 3 e la frequenza reale scende sotto quella richiesta (comportamento già presente nel codice originale).
    t.approx(rate(base, 5, 400), 0.3, 0.04, 'manuale: ≈ targetRate 0.30');
    t.approx(rate(Object.assign({}, base, { targetRate: 0.5 }), 5, 400), 0.5, 0.04, 'manuale: ≈ targetRate 0.50');
    const adat = Object.assign({}, base, { titrationMode: 'adattivo', targetRate: 0.99 });
    t.approx(rate(adat, 1, 400), nbackParamsForLevel(1).freq, 0.04, 'adattivo: segue la frequenza della tabella di livello, non targetRate');
  });

  await t.group('materiale misto: valori come {stimType, item}', () => {
    const cfg = Object.assign({}, base, { nbackMista: 'visivo' });
    const seq = gen(cfg, 2, 120);
    const { n } = nbackParamsForLevel(2);
    t.ok(seq.every(tr => tr.val && typeof tr.val === 'object' && tr.val.stimType && tr.val.item !== undefined), 'ogni valore ha stimType e item');
    t.ok(seq.every(tr => ['lettere', 'numeri', 'colori', 'simboli'].includes(tr.val.stimType)), 'solo tipi visivi con "visivo"');
    t.ok(seq.some(tr => tr.isTarget), 'compaiono bersagli');
    t.ok(seq.every((tr, i) => !tr.isTarget || nbackSameVal(cfg, tr.val, seq[i - n].val)), 'bersaglio = stesso tipo e stesso elemento di n prima');
    const aud = gen(Object.assign({}, base, { nbackMista: 'uditivo' }), 2, 60);
    t.ok(aud.every(tr => ['suoni', 'lettereVoce', 'numeriVoce'].includes(tr.val.stimType)), 'solo tipi uditivi con "uditivo"');
  });

  await t.group('limite di 3 ripetizioni di fila, anche con pochi stimoli e molti bersagli', async () => {
    const { POOLS } = await importCore('pools.js');
    const saved = POOLS.lettere;
    POOLS.lettere = ['A', 'B']; // pochi stimoli: senza il limite le ripetizioni lunghe sarebbero frequenti
    let longRuns = 0, targets = 0;
    try {
      for (let rep = 0; rep < 100; rep++) {
        const seq = gen(Object.assign({}, base, { targetRate: 0.9 }), 1, 60);
        seq.forEach((tr, i) => { if (tr.isTarget) targets++; if (i >= 3 && tr.val === seq[i - 1].val && tr.val === seq[i - 2].val && tr.val === seq[i - 3].val) longRuns++; });
      }
    } finally { POOLS.lettere = saved; }
    t.ok(targets > 500, 'molti bersagli generati (' + targets + ')');
    t.eq(longRuns, 0, 'mai quattro valori uguali di fila');
  });

  await t.group('nbackSameVal', () => {
    t.ok(nbackSameVal(base, 'A', 'A') && !nbackSameVal(base, 'A', 'B'), 'materiale unico: uguaglianza semplice');
    const m = Object.assign({}, base, { nbackMista: 'misto' });
    t.ok(nbackSameVal(m, { stimType: 'lettere', item: 'A' }, { stimType: 'lettere', item: 'A' }), 'misto: stesso tipo e item sono uguali anche se oggetti diversi');
    t.ok(!nbackSameVal(m, { stimType: 'lettere', item: 'A' }, { stimType: 'numeri', item: 'A' }), 'misto: stesso item di tipo diverso non è uguale');
  });

  await t.group('il livello della seduta può cambiare durante la sessione (adattivo)', () => {
    const session = { seq: [], liveNLevel: 1 };
    for (let i = 0; i < 10; i++) genNbackTrial(base, session);
    session.liveNLevel = 6;
    const after = genNbackTrial(base, session);
    t.eq(after.nAtGeneration, nbackParamsForLevel(6).n, 'la prova successiva usa il nuovo n');
  });
};
