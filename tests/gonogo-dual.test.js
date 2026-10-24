'use strict';
const { importCore } = require('./lib/core');

// Generatori di Go/No-Go e Doppio compito (js/exercises/gonogo.js, dualtask.js, passo 5b):
// finora senza test diretti.
module.exports = async function run(t) {
  const G = await importCore('../exercises/gonogo.js');
  const D = await importCore('../exercises/dualtask.js');
  const L = await importCore('levels.js');
  const { POOLS } = await importCore('pools.js');

  await t.group('Go/No-Go — un bersaglio è tutto ciò che NON è nel set no-go', () => {
    const cfg = { gonogoMista: 'no', stimType: 'lettere', targetSeq: ['A', 'B', 'C'], adaptive: false, titrationMode: 'manuale', targetRate: 0.25 };
    const session = { seq: [], adaptLevel: 1 };
    let noGo = 0, bad = 0;
    const N = 6000;
    for (let i = 0; i < N; i++) {
      const tr = G.genGoNoGoTrial(cfg, session);
      const inSet = cfg.targetSeq.includes(tr.val);
      if (tr.isTarget === inSet) bad++;
      if (!tr.valid) bad++;
      if (!tr.isTarget) noGo++;
    }
    t.eq(bad, 0, 'isTarget = "non è un no-go"; ogni prova è valida');
    t.approx(noGo / N, 0.25, 0.03, 'frequenza no-go ≈ targetRate in Manuale');
    t.eq(session.seq.length, N, 'ogni prova viene aggiunta alla sequenza della seduta');
  });

  await t.group('Go/No-Go — adattivo: il numero di no-go attivi segue la tabella di livello', () => {
    const cfg = { gonogoMista: 'no', stimType: 'lettere', targetSeq: ['A', 'B', 'C', 'D'], adaptive: true, titrationMode: 'adattivo', targetRate: 0.2 };
    [1, 5, 10].forEach(level => {
      const want = Math.min(4, L.ADAPT_GONOGO_COUNT[level] || 1);
      const session = { seq: [], adaptLevel: level };
      const seenNoGo = new Set();
      for (let i = 0; i < 3000; i++) { const tr = G.genGoNoGoTrial(cfg, session); if (!tr.isTarget) seenNoGo.add(tr.val); }
      t.eq(seenNoGo.size, want, 'livello ' + level + ': ' + want + ' no-go attivi');
      t.ok([...seenNoGo].every(v => cfg.targetSeq.slice(0, want).includes(v)), 'livello ' + level + ': sono i primi ' + want + ' del set');
    });
  });

  await t.group('Go/No-Go — materiale misto con pochi stimoli: non si blocca mai (rete di sicurezza)', () => {
    const cfg = { gonogoMista: 'visivo', stimType: 'lettere', targetSeq: [{ stimType: 'colori', item: POOLS.colori[0] }], adaptive: false, titrationMode: 'manuale', targetRate: 0.3 };
    const session = { seq: [], adaptLevel: 1 };
    const t0 = Date.now();
    for (let i = 0; i < 500; i++) G.genGoNoGoTrial(cfg, session);
    t.ok(Date.now() - t0 < 2000, '500 prove generate in tempi normali');
    t.ok(session.seq.every(tr => tr.val && tr.val.stimType), 'i valori sono oggetti {stimType, item}');
  });

  await t.group('Doppio compito — sequenza intera: bersaglio = valore precedente, prima prova non valutabile', () => {
    const cfg = { dualPairing: 'vis-aud', dualVisual: 'lettere', dualVisual2: 'numeri', trials: 80, targetRate: 0.3 };
    const seq = D.buildDualTask(cfg);
    t.eq(seq.length, 80, 'tante prove quante richieste');
    t.ok(!seq[0].valid && !seq[0].visualIsTarget && !seq[0].audioIsTarget, 'la prima prova non è valutabile');
    let bad = 0;
    seq.forEach((tr, i) => { if (i > 0) { if (tr.visualIsTarget && tr.visualVal !== seq[i - 1].visualVal) bad++; if (tr.audioIsTarget && tr.audioVal !== seq[i - 1].audioVal) bad++; } });
    t.eq(bad, 0, 'ogni bersaglio coincide con la prova precedente sul suo canale');
  });

  await t.group('Doppio compito — incrementale: canali indipendenti, lure a distanza 2', () => {
    const cfg = { dualPairing: 'vis-aud', dualVisual: 'lettere', dualVisual2: 'numeri', trials: 60, targetRate: 0.3, titrationMode: 'adattivo' };
    const session = { seq: [], dualLevel1: 8, dualLevel2: 1, prevDual1: null, prevDual2: null };
    let bad = 0, lures1 = 0, lures2 = 0, t1 = 0, t2 = 0;
    for (let i = 0; i < 4000; i++) {
      const prev1 = session.prevDual1, prev2 = session.prevDual2;
      const tr = D.genDualTaskTrial(cfg, session);
      if (i === 0 && (tr.valid || tr.visualIsTarget || tr.audioIsTarget)) bad++;
      if (tr.visualIsTarget && tr.visualVal !== prev1) bad++;
      if (tr.audioIsTarget && tr.audioVal !== prev2) bad++;
      if (tr.visualIsLure) { lures1++; if (tr.visualIsTarget) bad++; if (i < 2) bad++; }
      if (tr.audioIsLure) { lures2++; if (tr.audioIsTarget) bad++; }
      if (tr.visualIsTarget) t1++;
      if (tr.audioIsTarget) t2++;
    }
    t.eq(bad, 0, 'bersagli = valore precedente; un lure non è mai anche un bersaglio');
    t.ok(lures1 > 0, 'canale 1 a livello 8: compaiono lure (' + lures1 + ')');
    t.eq(lures2, 0, 'canale 2 a livello 1: nessun lure (tabella ADAPT_DUAL_LURE)');
    t.approx(t1 / 4000, L.ADAPT_DUAL_FREQ[8], 0.03, 'frequenza bersagli canale 1 = tabella livello 8');
    t.approx(t2 / 4000, L.ADAPT_DUAL_FREQ[1], 0.03, 'frequenza bersagli canale 2 = tabella livello 1');
    t.eq(session.seq.length, 4000, 'prove aggiunte alla seduta');
  });
};
