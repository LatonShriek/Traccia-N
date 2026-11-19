'use strict';
// Livelli intermedi dei classici senza fasce (19 nov 2026): interpolazione dei parametri e decisione sugli ultimi 2 blocchi.
const { importCore } = require('./lib/core');

module.exports = async function run(t){
  const L = await importCore('levels.js');
  const R = await importCore('../exercises/resolve.js');
  const cfgOf = (taskMode, o) => Object.assign({ taskMode, respMode: 'touch', adaptive: true }, o);
  const S = o => Object.assign({ idx: 0, adaptBlock: [], levelChanges: [], adaptLevel: 4, rtB: {} }, o);

  t.group('lerpLevel: interi invariati, mezzi livelli a metà strada', () => {
    t.ok(L.HALF_STEP_MODES.join()==='sequenza,stopsignal,ant,simon,switching', 'esercizi coinvolti: solo quelli senza fasce strutturali');
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

  t.group('esercizi con fasce strutturali: invariati (passo intero)', () => {
    const cfg = cfgOf('gonogo', { adaptStartLevel: 6 });
    const s = S({ adaptLevel: 6, adaptBlock: Array(8).fill(1) }); R.maybeAdapt(cfg, s);
    t.eq(s.adaptLevel, 7, 'Go/No-Go continua a salire di 1 (non ha ancora i mezzi livelli)');
  });
};
