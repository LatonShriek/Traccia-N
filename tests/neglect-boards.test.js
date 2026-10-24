'use strict';
// Tavole Neglect (js/exercises/neglect.js, passo 5d): proprietà che devono valere sempre,
// con cfg e session passati come parametri.
const { importCore } = require('./lib/core');

function baseCfg(o) {
  return Object.assign({ neglectMode: 'classico', titrationMode: 'manuale', neglectBoardSize: 24, neglectStartLevel: 3, neglectRuleLevel: 3,
    neglectGradient: 50, neglectLayout: 'griglia', stimType: 'lettere', targetSeq: ['A'], neglectAlphabet: 'auto', adaptive: false }, o);
}

module.exports = async function run(t) {
  const N = await importCore('../exercises/neglect.js');
  const session = { liveBoardLevel: 3, liveGradient: 50, board: [] };

  t.group('classico: numero di bersagli e distribuzione per lato seguono il gradiente', () => {
    [[100, 'left'], [0, 'right']].forEach(([g, side]) => {
      const cfg = baseCfg({ neglectGradient: g });
      for (let i = 0; i < 20; i++) {
        const b = N.buildNeglectBoard(cfg, session);
        const tg = b.filter(x => x.isTarget);
        t.eq(b.length, 24, 'tavola di 24 elementi');
        t.eq(tg.length, 6, 'bersagli = 25% di 24');
        t.ok(tg.every(x => x.side === side), 'gradiente ' + g + ': tutti i bersagli sul lato ' + side);
        t.ok(b.every(x => x.x >= 0 && x.x <= 100 && x.y >= 0 && x.y <= 100), 'posizioni dentro lo stage');
      }
    });
    const b = N.buildNeglectBoard(baseCfg(), session);
    t.ok(b.filter(x => !x.isTarget).every(x => x.val !== 'A'), 'i non-bersaglio non sono mai il bersaglio');
  });

  t.group('intruso: dispari, un solo elemento senza doppione, tutti gli altri ripetuti', () => {
    const cfg = baseCfg({ neglectMode: 'intruso', neglectBoardSize: 24 });
    for (let i = 0; i < 30; i++) {
      const b = N.buildNeglectBoard(cfg, session);
      const cnt = {}; b.forEach(x => { cnt[x.val] = (cnt[x.val] || 0) + 1; });
      t.eq(b.length % 2, 1, 'numero di elementi dispari');
      t.eq(b.filter(x => x.isTarget).length, 1, 'un solo bersaglio');
      t.eq(Object.values(cnt).filter(c => c === 1).length, 1, 'un solo glifo compare una volta');
      t.ok(Object.values(cnt).every(c => c >= 1) && Object.entries(cnt).filter(([k, c]) => c > 1).every(([k, c]) => c >= 2), 'gli altri compaiono almeno due volte');
    }
  });

  t.group('regola: il bersaglio coincide con la regola del livello', () => {
    const cfg = baseCfg({ neglectMode: 'regola', neglectRuleLevel: 7, neglectBoardSize: 30 });
    const rule = N.neglectRuleFor('lettere', 7, undefined);
    for (let i = 0; i < 20; i++) {
      const b = N.buildNeglectBoard(cfg, session);
      t.ok(b.every(x => x.isTarget === rule.test(x.val)), 'isTarget = regola per tutti gli elementi');
    }
    t.eq(N.neglectRuleFor('lettere', 1).label, 'vocale', 'livello 1: solo vocale');
    t.eq(N.neglectRuleFor('lettere', 3).label, 'vocale + rosso', 'livello 3: + rosso');
    t.eq(N.neglectRuleFor('lettere', 5).label, 'vocale + rosso + con sfondo giallo', 'livello 5: + sfondo');
    t.eq(N.neglectRuleFor('numeri', 7).label, 'pari + rosso + con sfondo giallo + in una riga pari', 'livello 7 numeri: quattro condizioni');
    t.eq(N.neglectRuleFor('lettere', 9, ['colore']).label, 'vocale + rosso', 'clausole manuali: base sempre inclusa');
  });

  t.group('progressiva: la fase decide la modalità della tavola', () => {
    const cfg = baseCfg({ neglectMode: 'progressiva', neglectStartLevel: 15, neglectBoardSize: 24 });
    const b = N.buildNeglectBoard(cfg, session);
    t.eq(b.filter(x => x.isTarget).length, 1, 'livello 15 → fase Intruso (un solo bersaglio)');
    t.eq(N.neglectBoardSubLevel(cfg, session), 5, 'sotto-livello 5');
  });

  t.group('suggerimento bottom-up: solo classico, livelli bassi, squilibrio evidente', () => {
    const cfg = baseCfg({ adaptive: true, titrationMode: 'adattivo', neglectGradient: 80 });
    const mk = (fl, fr, rem) => ({ liveBoardLevel: 2, liveGradient: 80, board: [].concat(
      Array(fl).fill(0).map(() => ({ side: 'left', found: true, isTarget: true })),
      Array(fr).fill(0).map(() => ({ side: 'right', found: true, isTarget: true })),
      rem ? [{ side: 'left', found: false, isTarget: true }] : []) });
    t.eq(N.neglectBottomUpWeakSide(cfg, mk(0, 3, true)), 'left', 'sinistra debole, squilibrio 3: suggerisce sinistra');
    t.eq(N.neglectBottomUpWeakSide(cfg, mk(0, 2, true)), null, 'squilibrio 2: nessun suggerimento');
    t.eq(N.neglectBottomUpWeakSide(cfg, mk(0, 3, false)), null, 'nulla da segnalare a sinistra: nessun suggerimento');
    t.eq(N.neglectBottomUpWeakSide(Object.assign({}, cfg, { neglectBottomUp: 'off' }), mk(0, 3, true)), null, 'spento da impostazioni');
    t.eq(N.neglectBottomUpWeakSide(cfg, Object.assign(mk(0, 3, true), { liveBoardLevel: 6 })), null, 'livello alto: nessun suggerimento');
  });
};
