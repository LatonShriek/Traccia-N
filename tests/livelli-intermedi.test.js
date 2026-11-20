'use strict';
// Livelli intermedi dei classici senza fasce (19 nov 2026): interpolazione dei parametri e decisione sugli ultimi 2 blocchi.
const { importCore } = require('./lib/core');

module.exports = async function run(t){
  const L = await importCore('levels.js');
  const R = await importCore('../exercises/resolve.js');
  const M = await importCore('../exercises/gonogo.js');
  const A = await importCore('adapt.js');
  const cfgOf = (taskMode, o) => Object.assign({ taskMode, respMode: 'touch', adaptive: true }, o);
  const S = o => Object.assign({ idx: 0, adaptBlock: [], levelChanges: [], adaptLevel: 4, rtB: {} }, o);

  t.group('lerpLevel: interi invariati, mezzi livelli a metà strada', () => {
    t.ok(L.HALF_STEP_MODES.join()==='sequenza,stopsignal,ant,simon,switching,gonogo,nback', 'esercizi coinvolti: quelli senza fasce, Go/No-Go e N-back dentro la fascia');
    for(const k of [1,2,5,10]) t.eq(L.lerpLevel(L.ADAPT_ISI.sequenza, k), L.ADAPT_ISI.sequenza[k], 'Sequenza livello intero '+k+' identico a prima');
    t.eq(L.lerpLevel(L.ADAPT_ISI.sequenza, 1.5), 4200, 'Sequenza 1,5 = 4200 ms');
    t.eq(L.lerpLevel(L.ADAPT_ISI.sequenza, 2.5), 3550, 'Sequenza 2,5 = 3550 ms');
    t.eq(L.lerpLevel(L.ADAPT_ISI.sequenza, 9.5), 1025, 'Sequenza 9,5 = 1025 ms');
    t.eq(L.lerpLevel(L.ADAPT_ISI.stopsignal, 4.5), 2200, 'Stop-Signal 4,5 = 2200 ms');
    t.eq(L.lerpLevel(L.ADAPT_ISI.ant, 7.5), 1100, 'ANT 7,5 = 1100 ms');
    t.eq(L.lerpLevel(L.ADAPT_SWITCH_CSI, 3.5), 540, 'Switch 3,5: CSI 540 ms');
    t.ok(Math.abs(L.lerpLevel(L.ADAPT_SWITCH_BALANCE, 6.5) - 0.825) < 1e-9, 'Switch 6,5: bilanciamento 0,825');
    // monotonia: più difficile = ISI più corto, su tutti i mezzi passi
    for(const tab of [L.ADAPT_ISI.sequenza, L.ADAPT_ISI.stopsignal, L.ADAPT_ISI.ant, L.ADAPT_SWITCH_CSI]){
      let prev = Infinity, ok = true;
      for(let x=1; x<=10; x+=0.5){ const v = L.lerpLevel(tab, x); if(!(v < prev)) ok = false; prev = v; }
      t.ok(ok, 'tabella strettamente decrescente a mezzi passi');
    }
  });

  t.group('maybeAdapt a mezzi gradini: ±0,5 e finestra di 2 blocchi', () => {
    const cfg = cfgOf('sequenza', { adaptStartLevel: 4 });
    const up = S({ adaptBlock: Array(8).fill(1) });
    R.maybeAdapt(cfg, up); t.eq(up.adaptLevel, 4.5, 'blocco ottimo: sale di mezzo livello');
    // il blocco successivo non si mescola col precedente se il livello è cambiato
    up.adaptBlock = Array(8).fill(0.8); R.maybeAdapt(cfg, up);
    t.eq([up.adaptLevel, up.prevAdaptBlock.length], [4.5, 8], '80%: resta, e il blocco viene ricordato');
    // 0,80 poi 0,95: media 0,875 > 0,85 → sale (da solo 0,95 sarebbe salito comunque; verifichiamo il caso opposto)
    const w = S({ adaptBlock: [1,1,1,1,1,1,1,0] }); // 0,875 → sale al primo blocco
    R.maybeAdapt(cfg, w); t.eq(w.adaptLevel, 4.5, 'primo blocco 0,875: sale');
    const v = S({ adaptBlock: [1,1,1,1,1,0,0,0] }); // 0,625 → scende
    R.maybeAdapt(cfg, v); t.eq(v.adaptLevel, 3.5, 'primo blocco 0,625: scende di mezzo livello');
    // finestra: 0,75 poi 0,95 → media 0,85 non > 0,85: resta; 0,75 poi 1,00 → 0,875: sale
    const a = S({ adaptBlock: [1,1,1,1,1,1,0,0] }); R.maybeAdapt(cfg, a);          // 0,75: resta
    a.adaptBlock = [1,1,1,1,1,1,1,1]; R.maybeAdapt(cfg, a);                         // (0,75+1)/2 = 0,875: sale
    t.eq(a.adaptLevel, 4.5, 'due blocchi 0,75 e 1,00: media 0,875, sale');
    const b = S({ adaptBlock: [1,1,1,1,1,1,0,0] }); R.maybeAdapt(cfg, b);
    b.adaptBlock = [1,1,1,1,1,1,1,0]; R.maybeAdapt(cfg, b);                         // (0,75+0,875)/2 = 0,8125: resta
    t.eq(b.adaptLevel, 4, 'due blocchi 0,75 e 0,875: media 0,81, resta (la finestra frena il rumore)');
    // limiti della scala
    const top = S({ adaptLevel: 10, adaptBlock: Array(8).fill(1) }); R.maybeAdapt(cfg, top); t.eq(top.adaptLevel, 10, 'al livello 10 non sale oltre');
    const bot = S({ adaptLevel: 1, adaptBlock: Array(8).fill(0) }); R.maybeAdapt(cfg, bot); t.eq(bot.adaptLevel, 1, 'al livello 1 non scende sotto');
  });

  t.group('Go/No-Go: mezzi livelli solo dentro la fascia, ISI da tabella', () => {
    const G = L.ADAPT_ISI.gonogo;
    t.eq([1,2,3,4,5,6,7,8,9,10].map(k => G[k]), [2000,1800,1650,1500,1800,1650,1500,1650,1500,1400], 'tabella ISI approvata (riparte più lenta a ogni fascia)');
    t.eq(L.lerpLevel(G, 1.5), 1900, 'livello 1,5: ISI 1900 ms');
    t.eq(L.lerpLevel(G, 3.5), 1575, 'livello 3,5: ISI 1575 ms');
    t.eq(L.lerpLevel(G, 5.5), 1725, 'livello 5,5: ISI 1725 ms');
    t.eq(L.lerpLevel(L.ADAPT_GONOGO_FREQ, 6.5), 0.195, 'livello 6,5: frequenza no-go 0,195');
    const up = (lv, start) => { const s = S({ adaptLevel: lv, adaptBlock: Array(8).fill(1) }); R.maybeAdapt(cfgOf('gonogo', { adaptStartLevel: start }), s); return s.adaptLevel; };
    const dn = (lv, start) => { const s = S({ adaptLevel: lv, adaptBlock: Array(8).fill(0) }); R.maybeAdapt(cfgOf('gonogo', { adaptStartLevel: start }), s); return s.adaptLevel; };
    t.eq(up(6, 6), 6.5, 'fascia 5-7: sale di mezzo livello');
    t.eq(up(7, 6), 7, 'fascia 5-7: al 7 non esce dalla fascia');
    t.eq(dn(5, 6), 5, 'fascia 5-7: al 5 non scende nella fascia 1-4');
    t.eq(up(4, 3), 4, 'fascia 1-4: al 4 non sale nella fascia 5-7');
    t.eq(up(8, 8), 8.5, 'fascia 8-9: 8 → 8,5');
    t.eq(up(10, 10), 10, 'fascia 10: un solo livello');
    // finestra di 2 blocchi, come gli altri
    const cfg = cfgOf('gonogo', { adaptStartLevel: 2 });
    const a = S({ adaptLevel: 2, adaptBlock: [1,1,1,1,1,1,0,0] }); R.maybeAdapt(cfg, a);
    a.adaptBlock = Array(8).fill(1); R.maybeAdapt(cfg, a);
    t.eq(a.adaptLevel, 2.5, 'due blocchi 0,75 e 1,00: sale di mezzo livello');
    // numero di elementi no-go: cambia solo con la fascia, anche con livelli frazionari
    const gen = (lv) => { const ss = { adaptLevel: lv, seq: [] }; const c = { gonogoMista: 'no', stimType: 'lettere', targetSeq: ['A','B','C','D'], adaptive: true, titrationMode: 'adattivo', targetRate: 0.2 }; return { c, ss }; };
    {
      for(const [lv, n] of [[1,1],[3.5,1],[5.5,2],[6.5,2],[8.5,3],[10,4]]){
        const { c, ss } = gen(lv);
        const seen = new Set(); for(let i=0;i<2000;i++){ const tr = M.genGoNoGoTrial(c, ss); if(!tr.isTarget) seen.add(tr.val); }
        t.eq(seen.size, n, 'livello '+lv+': '+n+' elemento/i no-go attivo/i');
      }
    }
  });

  t.group('N-back: mezzi livelli solo dentro la banda di n, ISI da tabella', () => {
    const N = L.ADAPT_ISI.nback;
    t.eq([1,2,3,4,5,6,7,8,9,10].map(k => N[k]), [3000,2800,2600,2400,3000,2800,2600,2400,2200,3000], 'tabella ISI approvata (riparte più lenta a ogni banda)');
    t.eq(L.lerpLevel(N, 1.5), 2900, 'livello 1,5: ISI 2900 ms');
    t.eq(L.lerpLevel(N, 8.5), 2300, 'livello 8,5: ISI 2300 ms');
    const p1 = L.nbackParamsForLevel(2), p15 = L.nbackParamsForLevel(2.5), p3 = L.nbackParamsForLevel(3);
    t.ok(p15.n===1 && Math.abs(p15.freq-(p1.freq+p3.freq)/2)<1e-9 && Math.abs(p15.lure-(p1.lure+p3.lure)/2)<1e-9, 'livello 2,5: n=1, frequenza e lure a metà fra 2 e 3');
    t.eq(L.nbackParamsForLevel(7.5).n, 2, 'livello 7,5: n=2');
    t.eq(L.nbackParamsForLevel(6), L.NBACK_LEVEL_TABLE[6], 'livelli interi identici a prima');
    const up = (lv, start) => { const s = S({ liveNLevel: lv, adaptBlock: Array(8).fill(1) }); R.maybeAdapt(cfgOf('nback', { nLevel: start }), s); return s.liveNLevel; };
    const dn = (lv, start) => { const s = S({ liveNLevel: lv, adaptBlock: Array(8).fill(0) }); R.maybeAdapt(cfgOf('nback', { nLevel: start }), s); return s.liveNLevel; };
    t.eq(up(2, 2), 2.5, 'banda 1-4: sale di mezzo livello');
    t.eq(up(4, 2), 4, 'banda 1-4: al 4 non passa a n=2');
    t.eq(dn(5, 7), 5, 'banda 5-9: al 5 non scende a n=1');
    t.eq(up(9, 7), 9, 'banda 5-9: al 9 non passa a n=3');
    t.eq(up(7, 7), 7.5, 'banda 5-9: 7 → 7,5');
    t.eq(up(10, 10), 10, 'banda 10: un solo livello');
    t.eq(dn(10, 10), 10, 'banda 10: non scende');
    t.eq(A.nFineStartOf({ nLevel: 6, nLevelFine: 5.5 }), 5.5, 'livello con la virgola coerente con nLevel: usato');
    t.eq(A.nFineStartOf({ nLevel: 3, nLevelFine: 5.5 }), 3, 'incoerente (livello cambiato a mano): ignorato');
  });
};
