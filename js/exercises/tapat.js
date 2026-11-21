// TAPAT: generazione incrementale delle prove (blocco tonico, poi fasico).
// SPOSTATE da index.html (passo 5b) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html resta una funzione da una riga con lo stesso nome
// che chiama questa con la cfg e la seduta correnti.
// - genTapatTrial riceve cfg e session, buildTAPAT riceve cfg, come parametri invece di leggere le variabili dell'app (buildTAPAT: passo 5c).
import { POOLS } from '../core/pools.js';
import { TAPAT_LEVELS, lerpLevel } from '../core/levels.js';
  // Finestra di attesa del blocco tonico, interpolata fra due livelli interi (mezzi livelli, 21 nov).
  export function tapatRange(level){
    const lo = Math.max(1, Math.min(10, Math.floor(level))), hi = Math.max(1, Math.min(10, Math.ceil(level)));
    const t = x => Object.fromEntries(Object.keys(TAPAT_LEVELS).map(k => [k, TAPAT_LEVELS[k][x]]));
    return [lerpLevel(t(0), level), lerpLevel(t(1), level)];
  }

  export function genTapatTrial(cfg, session){
    const i = session.seq.length;
    const half = Math.floor(cfg.trials/2);
    const block = i<half ? 'tonic' : 'phasic';
    const pool = POOLS[cfg.stimType];
    let cueType, isiOverride;
    if(block==='tonic'){
      cueType = 'none';
      const range = cfg.titrationMode==='manuale' ? [cfg.tapatIsiMin, cfg.tapatIsiMax] : tapatRange(session.tapatLevel);
      isiOverride = range[0] + Math.random()*(range[1]-range[0]);
    } else {
      cueType = Math.random()<0.5 ? 'none' : 'center';
      isiOverride = null; // usa l'ISI normale impostato in setup
    }
    const val = pool[Math.floor(Math.random()*pool.length)];
    let side = 'center';
    if(cfg.tapatSpatial){
      const gradient = session.liveTapatGradient!=null ? session.liveTapatGradient : cfg.tapatGradient;
      side = Math.random()*100 < gradient ? 'left' : 'right';
    }
    const trial = {val, cueType, congruency:'neutral', side, targetDir:null, correctAnswer:'go', block, isiOverride, valid:true};
    session.seq.push(trial);
    return trial;
  }

  // TAPAT (Tonic and Phasic Alertness Training), variante dell'ANT pensata
  // per il training più che per la misura fattoriale: niente flanker né
  // scelta di direzione, solo rilevamento semplice di un target unico.
  // Blocco tonico (prima metà): nessun cue, ISI lungo e variabile —
  // sostiene l'attenzione senza aiuti esterni. Blocco fasico (seconda
  // metà): ISI più breve e fisso, metà dei trial preceduti da un cue di
  // allerta — confronto RT con/senza cue, come nell'ANT classico.
  export function buildTAPAT(cfg){
    const seq = [];
    const half = Math.floor(cfg.trials/2);
    for(let i=0;i<cfg.trials;i++){
      const block = i<half ? 'tonic' : 'phasic';
      let cueType, isiOverride;
      if(block==='tonic'){
        cueType = 'none';
        isiOverride = 4000 + Math.random()*6000; // 4-10s, imprevedibile di proposito
      } else {
        cueType = Math.random()<0.5 ? 'none' : 'center';
        isiOverride = null; // usa l'ISI normale impostato in setup
      }
      seq.push({val:'target', cueType, congruency:'neutral', side:'center', targetDir:null, correctAnswer:'go', block, isiOverride, valid:true});
    }
    return seq;
  }
