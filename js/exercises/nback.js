// N-back: generazione incrementale delle prove (passo 5a).
// SPOSTATE da index.html senza modifiche al testo, con "export" e UNA differenza
// dichiarata: nbackSameVal e genNbackTrial ricevono cfg (e session) come
// parametri invece di leggere le variabili dell'app; le chiamate interne le
// passano. In index.html resta una funzione da una riga che chiama questa con
// la cfg e la seduta correnti. Le tabelle di livello sono in js/core/levels.js.
import { POOLS, mistaTypesFor, randMistaStim } from '../core/pools.js';
import { nbackParamsForLevel, nbackLureLag } from '../core/levels.js';

  // (session.liveNLevel), che può cambiare durante la sessione stessa.
  // Uguaglianza fra due valori pescati per l'N-back: identica a
  // sameSeqItem, ma richiamabile anche quando taskMode è 'nback' (non solo
  // 'sequenza'), per la modalità mista che riusa la stessa forma {stimType,
  // item} già usata dalla Sequenza bersaglio mista.
  export function nbackSameVal(cfg, a, b){
    if(cfg.taskMode==='nback' && cfg.nbackMista && cfg.nbackMista!=='no') return a && b && a.stimType===b.stimType && a.item===b.item;
    return a===b;
  }
  export function genNbackTrial(cfg, session){
    const isMista = cfg.nbackMista && cfg.nbackMista!=='no';
    const pool = isMista ? null : POOLS[cfg.stimType];
    const mistaTypes = isMista ? mistaTypesFor(cfg.nbackMista) : null;
    const randMista = ()=> randMistaStim(mistaTypes);
    const i = session.seq.length;
    const level = session.liveNLevel;
    const params = nbackParamsForLevel(level);
    const n = params.n;
    const freq = cfg.titrationMode!=='manuale' ? params.freq : cfg.targetRate;
    const lureFreq = params.lure;
    const lureLag = nbackLureLag(n);
    function runLen(val){ let run=1; for(let k=i-1;k>=0;k--){ if(nbackSameVal(cfg, session.seq[k].val,val)) run++; else break; } return run; }
    let makeTarget = i>=n && Math.random() < freq;
    let val, isLure=false;
    if(makeTarget){
      const cand = session.seq[i-n].val;
      if((isMista || pool.length>1) && runLen(cand) > 3){ makeTarget=false; } else { val = cand; }
    }
    if(!makeTarget){
      // Prova un trial lure: un foil che corrisponde allo scarto vicino a n
      // (n-1, o n+1 quando n=1) invece che a n — "sembra" familiare per
      // prossimità recente ma la risposta corretta resta "non rispondere".
      if(i>=lureLag && lureFreq>0 && Math.random()<lureFreq){
        const lureCand = session.seq[i-lureLag].val;
        const wouldBeRealTarget = i>=n && nbackSameVal(cfg, lureCand, session.seq[i-n].val);
        if(!wouldBeRealTarget && (isMista || pool.length>1 ? runLen(lureCand)<=3 : true)){
          val = lureCand; isLure = true;
        }
      }
      if(val===undefined){
        do{ val = isMista ? randMista() : pool[Math.floor(Math.random()*pool.length)]; }
        while((isMista || pool.length>1) && ((i>=n && nbackSameVal(cfg, val, session.seq[i-n].val)) || runLen(val)>3));
      }
    }
    const trial = {val, isTarget: i>=n ? makeTarget : false, valid:i>=n, nAtGeneration:n, isLure};
    session.seq.push(trial);
    return trial;
  }
