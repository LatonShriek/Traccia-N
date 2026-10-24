// TAPAT: generazione incrementale delle prove (blocco tonico, poi fasico).
// SPOSTATE da index.html (passo 5b) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html resta una funzione da una riga con lo stesso nome
// che chiama questa con la cfg e la seduta correnti.
// - genTapatTrial riceve cfg e session come parametri invece di leggere le variabili dell'app.
import { POOLS } from '../core/pools.js';
import { TAPAT_LEVELS } from '../core/levels.js';

  export function genTapatTrial(cfg, session){
    const i = session.seq.length;
    const half = Math.floor(cfg.trials/2);
    const block = i<half ? 'tonic' : 'phasic';
    const pool = POOLS[cfg.stimType];
    let cueType, isiOverride;
    if(block==='tonic'){
      cueType = 'none';
      const range = cfg.titrationMode==='manuale' ? [cfg.tapatIsiMin, cfg.tapatIsiMax] : (TAPAT_LEVELS[session.tapatLevel] || TAPAT_LEVELS[3]);
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
