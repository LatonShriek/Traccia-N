// Categorizzazione: esiti per struttura (livelli 2, 3, 5) e generazione incrementale delle prove.
// SPOSTATE da index.html (passo 5c) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg (e la seduta) correnti.
// - genCategItem riceve cfg e genCategTrial riceve cfg e session come parametri invece di leggere le variabili dell'app.
import { CATEG_ISI, CATEG_LURE } from '../core/levels.js';
import { POOLS } from '../core/pools.js';
import { DUAL_DIM_ROTATION, SWITCH_RULESETS, dualDim1IsA, dualDim2IsA, genDualDimItem, pickDualDimRegime } from '../core/rules.js';
import { categEffectiveStructure } from '../core/titration.js';

  // Alias storici — Categorizzazione condizionale usava questi nomi prima
  // che il motore diventasse condiviso con Task-switching; mantenuti per
  // non dover toccare ogni punto che li chiama.
  export const CATEG_REGIMES = DUAL_DIM_ROTATION;
  export function pickCategRegime(c){ return pickDualDimRegime(c.categRegime); }
  export function categDim1IsA(item){ return dualDim1IsA(item); }
  export function categDim2IsA(item){ return dualDim2IsA(item); }
  export function categL2Outcome(item){
    if(categDim1IsA(item) && categDim2IsA(item)) return 'a';
    if(categDim1IsA(item) && !categDim2IsA(item)) return 'nogo';
    if(!categDim1IsA(item) && !categDim2IsA(item)) return 'b';
    return 'c'; // polo B della dim1 (numero/triangolo), polo A della dim2 (nero/grave)
  }
  export function categL3Outcome(item){
    const isA = (categDim1IsA(item) && categDim2IsA(item)) || (!categDim1IsA(item) && !categDim2IsA(item));
    return isA ? 'a' : 'b';
  }
  export function categL5Outcome(item){
    if(categDim1IsA(item)) return categDim2IsA(item) ? 'a' : 'l';
    return categDim2IsA(item) ? 'z' : 'm';
  }
  export function genCategItem(cfg){ return genDualDimItem(cfg.categRegimeSessione || pickCategRegime(cfg)); }
  // Generazione incrementale, necessaria per l'adattivo: la struttura
  // (quale regola sta seguendo il paziente) resta SEMPRE quella del
  // livello di PARTENZA della sessione (mai quella del livello live) — un
  // cambio di struttura è un cambio di regola, e la titolazione è già
  // vincolata a non attraversare il confine di fascia entro la stessa
  // seduta (vedi sessionLevelBounds/STRUCTURAL_BANDS). Solo ISI e
  // frequenza lure (parametri continui, non regole) seguono il livello
  // live quando l'adattivo è attivo.
  export function genCategTrial(cfg, session){
    const startLevel = cfg.categLivello;
    const structure = categEffectiveStructure(cfg);
    const manuale = cfg.titrationMode==='manuale';
    const liveLevel = (!manuale && cfg.adaptive) ? (session.categLevel||startLevel) : startLevel;
    const isiOverride = manuale ? null : CATEG_ISI[liveLevel];
    if(structure===1){
      const rs = SWITCH_RULESETS[cfg.categMateriale].ruleA;
      const pool = POOLS[cfg.categMateriale];
      const val = pool[Math.floor(Math.random()*pool.length)];
      const trial = {val, correctAnswer: rs.classify(val)?'a':'b', valid:true, categMateriale:cfg.categMateriale, isiOverride};
      session.seq.push(trial);
      return trial;
    }
    if(structure===4){
      const rs = SWITCH_RULESETS[cfg.categMateriale].ruleA;
      const pool = POOLS[cfg.categMateriale];
      const lureFreq = manuale ? (cfg.targetRate||0) : (CATEG_LURE[liveLevel]||0);
      function pickCategValue(wantCat){
        const want = wantCat==='a';
        const filtered = pool.filter(v=>rs.classify(v)===want);
        return filtered.length ? filtered[Math.floor(Math.random()*filtered.length)] : pool[Math.floor(Math.random()*pool.length)];
      }
      const i = session.seq.length;
      const valid = i>0;
      let val, cat, isLure=false;
      const prevCat = session.categPrevCat, prevCat2 = session.categPrevCat2;
      if(valid && i>=2 && prevCat2!=null && prevCat2!==prevCat && Math.random()<lureFreq){
        cat = prevCat2;
        val = pickCategValue(cat);
        isLure = true;
      } else {
        val = pool[Math.floor(Math.random()*pool.length)];
        cat = rs.classify(val) ? 'a' : 'b';
      }
      const correctAnswer = (valid && cat===prevCat) ? 'match' : 'nogo';
      const trial = {val, correctAnswer, valid, categMateriale:cfg.categMateriale, isLure};
      session.categPrevCat2 = prevCat; session.categPrevCat = cat;
      session.seq.push(trial);
      return trial;
    }
    const item = genCategItem(cfg);
    const correctAnswer = structure===2 ? categL2Outcome(item) : structure===3 ? categL3Outcome(item) : categL5Outcome(item);
    const trial = {val:item, correctAnswer, valid:true, categBivalente:true, isiOverride};
    session.seq.push(trial);
    return trial;
  }
