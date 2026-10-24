// Doppio compito: generazione delle prove (intera sequenza e incrementale).
// SPOSTATE da index.html (passo 5b) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html resta una funzione da una riga con lo stesso nome
// che chiama questa con la cfg e la seduta correnti.
// - buildDualTask riceve cfg, genDualTaskTrial riceve cfg e session come parametri invece di leggere le variabili dell'app.
import { POOLS } from '../core/pools.js';
import { ADAPT_DUAL_FREQ, ADAPT_DUAL_LURE } from '../core/levels.js';

  // buildCategorizzazione (generazione dell'intera sequenza in anticipo) è
  // stata sostituita da genCategTrial (sopra) — Categorizzazione condizionale
  // è ora sempre incrementale, necessario per l'adattivo con vincolo di
  // fascia strutturale (vedi STRUCTURAL_BANDS).
  // Doppio compito: canale visivo (lettere) + uditivo (toni), ciascuno con
  // regola 1-back indipendente, presentati simultaneamente.
  export function buildDualTask(cfg){
    const pairing = cfg.dualPairing || 'vis-aud';
    const pool1 = pairing==='aud-aud' ? POOLS.suoni : POOLS[cfg.dualVisual];
    const pool2 = pairing==='vis-vis' ? POOLS[cfg.dualVisual2] : pairing==='aud-aud' ? POOLS.suoni2 : POOLS.suoni;
    const seq = [];
    let prev1=null, prev2=null;
    for(let i=0;i<cfg.trials;i++){
      let v1 = pool1[Math.floor(Math.random()*pool1.length)];
      let v2 = pool2[Math.floor(Math.random()*pool2.length)];
      let t1 = i>0 && Math.random()<cfg.targetRate;
      let t2 = i>0 && Math.random()<cfg.targetRate;
      if(t1) v1 = prev1;
      if(t2) v2 = prev2;
      seq.push({val:v1, visualVal:v1, audioVal:v2, visualIsTarget: i>0?t1:false, audioIsTarget: i>0?t2:false, valid:i>0});
      prev1=v1; prev2=v2;
    }
    return seq;
  }
  // Generazione incrementale del doppio compito: necessaria per una vera
  // adattività indipendente sui due canali (ciascuno valutato sulla sua
  // accuratezza, non su una media che le confonderebbe).
  export function genDualTaskTrial(cfg, session){
    const pairing = cfg.dualPairing || 'vis-aud';
    const pool1 = pairing==='aud-aud' ? POOLS.suoni : POOLS[cfg.dualVisual];
    const pool2 = pairing==='vis-vis' ? POOLS[cfg.dualVisual2] : pairing==='aud-aud' ? POOLS.suoni2 : POOLS.suoni;
    const i = session.seq.length;
    const freq1 = cfg.titrationMode!=='manuale' ? (ADAPT_DUAL_FREQ[session.dualLevel1]||cfg.targetRate) : cfg.targetRate;
    const freq2 = cfg.titrationMode!=='manuale' ? (ADAPT_DUAL_FREQ[session.dualLevel2]||cfg.targetRate) : cfg.targetRate;
    const lure1 = ADAPT_DUAL_LURE[session.dualLevel1]||0;
    const lure2 = ADAPT_DUAL_LURE[session.dualLevel2]||0;
    let v1 = pool1[Math.floor(Math.random()*pool1.length)];
    let v2 = pool2[Math.floor(Math.random()*pool2.length)];
    let t1 = i>0 && Math.random()<freq1;
    let t2 = i>0 && Math.random()<freq2;
    let isLure1=false, isLure2=false;
    if(t1) v1 = session.prevDual1;
    else if(i>=2 && lure1>0 && Math.random()<lure1){
      const cand = session.seq[i-2].visualVal;
      if(cand!==session.prevDual1){ v1 = cand; isLure1 = true; }
    }
    if(t2) v2 = session.prevDual2;
    else if(i>=2 && lure2>0 && Math.random()<lure2){
      const cand = session.seq[i-2].audioVal;
      if(cand!==session.prevDual2){ v2 = cand; isLure2 = true; }
    }
    const trial = {val:v1, visualVal:v1, audioVal:v2, visualIsTarget: i>0?t1:false, audioIsTarget: i>0?t2:false, valid:i>0, visualIsLure:isLure1, audioIsLure:isLure2};
    session.seq.push(trial);
    session.prevDual1 = v1; session.prevDual2 = v2;
    return trial;
  }
