// Simon: costruzione delle prove.
// SPOSTATE da index.html (passo 5c) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg (e la seduta) correnti.
// - buildSimon riceve cfg come parametro invece di leggere la variabile dell'app.
import { POOLS } from '../core/pools.js';
import { SIMON_COLORS, SIMON_CONGRUENCE_PROB, STOPSIGNAL_RULES } from '../core/rules.js';

  export function buildSimon(cfg){
    const congProb = SIMON_CONGRUENCE_PROB[cfg.simonCongruenza] || 0.5;
    const mat = cfg.simonMateriale || 'colori';
    const seq = [];
    for(let i=0;i<cfg.trials;i++){
      let val, correctAnswer;
      if(mat==='colori'){
        const isBlu = Math.random()<0.5;
        val = isBlu ? SIMON_COLORS.blu : SIMON_COLORS.verde;
        correctAnswer = isBlu ? 'left' : 'right'; // mappatura fissa Blu→sinistra, Verde→destra
      } else {
        // lettere/numeri/suoni: stessa regola di classificazione già usata
        // in Stop-Signal (STOPSIGNAL_RULES), non una nuova inventata qui —
        // la dimensione rilevante resta binaria e di pari complessità al
        // colore (vocale/consonante, pari/dispari, grave/acuto).
        const pool = POOLS[mat];
        val = pool[Math.floor(Math.random()*pool.length)];
        correctAnswer = STOPSIGNAL_RULES[mat].classify(val) ? 'left' : 'right';
      }
      const congruent = Math.random() < congProb;
      const side = congruent ? correctAnswer : (correctAnswer==='left' ? 'right' : 'left');
      seq.push({val, side, correctAnswer, congruency: congruent?'congruent':'incongruent', valid:true});
    }
    return seq;
  }
