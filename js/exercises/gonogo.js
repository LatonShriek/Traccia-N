// Go/No-Go: generazione incrementale delle prove.
// SPOSTATE da index.html (passo 5b) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html resta una funzione da una riga con lo stesso nome
// che chiama questa con la cfg e la seduta correnti.
// - genGoNoGoTrial riceve cfg e session come parametri invece di leggere le variabili dell'app.
import { POOLS, mistaTypesFor, randMistaStim, sameStim, seqLabel } from '../core/pools.js';
import { ADAPT_GONOGO_COUNT, ADAPT_GONOGO_FREQ } from '../core/levels.js';

  // Go/No-Go: generazione incrementale, necessaria perché con l'adattivo
  // attivo la frequenza no-go cambia durante la sessione.
  export function genGoNoGoTrial(cfg, session){
    const isMista = cfg.gonogoMista && cfg.gonogoMista!=='no';
    const mistaTypes = isMista ? mistaTypesFor(cfg.gonogoMista) : null;
    const pool = isMista ? null : POOLS[cfg.stimType];
    const fullSet = cfg.targetSeq;
    const count = cfg.adaptive ? Math.min(fullSet.length, ADAPT_GONOGO_COUNT[session.adaptLevel]||1) : fullSet.length;
    const activeNoGo = fullSet.slice(0, Math.max(1,count));
    const freq = cfg.titrationMode!=='manuale' ? (ADAPT_GONOGO_FREQ[session.adaptLevel] || cfg.targetRate) : cfg.targetRate;
    let val;
    if(Math.random() < freq){ val = activeNoGo[Math.floor(Math.random()*activeNoGo.length)]; }
    else if(isMista){
      // Rete di sicurezza: senza un tetto ai tentativi, un pool misto
      // ristretto (o un set no-go che arriva a coprirlo quasi per intero
      // con l'adattivo) può far girare il rejection-sampling all'infinito,
      // bloccando la scheda (bug segnalato da Rodrigo: schermo che si
      // ferma dopo pochi elementi in Go/No-Go misto adattivo). Stessa
      // soglia di guardia già usata in randomMistaTargetSeq.
      let guard = 0;
      do{ val = randMistaStim(mistaTypes); guard++; } while(activeNoGo.some(x=>sameStim(x,val)) && guard<200);
    }
    else { do{ val = pool[Math.floor(Math.random()*pool.length)]; } while(activeNoGo.some(x=>seqLabel(x)===seqLabel(val)) && pool.length>activeNoGo.length); }
    const isNoGo = activeNoGo.some(x=>sameStim(x,val));
    const trial = {val, isTarget: !isNoGo, valid:true};
    session.seq.push(trial);
    return trial;
  }
