// Sequenza bersaglio: uguaglianza degli elementi, adattamento della lunghezza, costruzione delle prove.
// SPOSTATE da index.html (passo 5c) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg (e la seduta) correnti.
// - tutte le funzioni ricevono cfg come primo parametro invece di leggere la variabile dell'app; le chiamate interne lo passano.
import { ADAPT_GONOGO_COUNT, ADAPT_SEQ_LEN } from '../core/levels.js';
import { POOLS, SEQUENZA_MISTA_TYPES, defaultTargetSeq, mistaTypesFor, randMistaStim, sameStim, seqLabel } from '../core/pools.js';

  // Target-sequence mode: respond only when the trailing stimuli exactly
  // match a fixed, custom-built sequence (e.g. 1 → 2 → 3). Everything else
  // is a non-target, regardless of how "close" it looks.
  export function sameSeqItem(cfg, a, b){
    if(cfg.taskMode==='sequenza' && cfg.sequenzaMista && cfg.sequenzaMista!=='no') return a && b && a.stimType===b.stimType && a.item===b.item;
    return a===b;
  }
  // In modalità adattiva, la lunghezza della sequenza bersaglio segue
  // ADAPT_SEQ_LEN invece di quella scelta manualmente in cfg.targetSeq —
  // calcolata una sola volta qui, prima che la sessione esista (stesso
  // principio già usato per lo squilibrio di regola dello switching).
  // Adatta cfg.targetSeq alla lunghezza richiesta dal livello, riusando gli
  // elementi già scelti dall'operatore ciclicamente (non li scarta con una
  // sequenza generata da zero) — usata sia in anteprima live in Setup (al
  // cambio di livello o di modalità adattiva) sia come rete di sicurezza a
  // inizio sessione (sequenceTargetForBuild), così l'esempio mostrato
  // all'operatore corrisponde sempre a quello che verrà davvero usato.
  export function adjustTargetSeqToLength(cfg, desiredLen){
    if(!desiredLen || cfg.targetSeq.length===desiredLen) return;
    const isMista = cfg.taskMode==='sequenza' && cfg.sequenzaMista && cfg.sequenzaMista!=='no';
    const base = cfg.targetSeq.length ? cfg.targetSeq : (isMista
      ? [{stimType:SEQUENZA_MISTA_TYPES[0], item:POOLS[SEQUENZA_MISTA_TYPES[0]][0]}]
      : defaultTargetSeq(cfg.stimType, 1));
    const out = [];
    for(let i=0;i<desiredLen;i++) out.push(base[i % base.length]);
    cfg.targetSeq = out;
  }
  // Go/No-Go: propone automaticamente gli elementi no-go coerenti col
  // livello scelto (ADAPT_GONOGO_COUNT), invece di lasciare all'operatore
  // il compito di indovinare quanti elementi servano — riusa quelli già
  // selezionati (in ordine) e ne pesca di nuovi a caso dal pool/materiale
  // attivo per completare il numero richiesto, oppure accorcia se il nuovo
  // livello ne richiede di meno. Resta comunque modificabile a mano subito
  // dopo (chip "← Rimuovi ultimo"/aggiungi), come già per gli altri
  // esercizi — un suggerimento di partenza, non un vincolo.
  export function suggestGoNoGoTargets(cfg, level){
    const count = Math.max(1, ADAPT_GONOGO_COUNT[level] || 1);
    const isMista = cfg.gonogoMista && cfg.gonogoMista!=='no';
    const cur = (cfg.targetSeq||[]).slice(0, count);
    let guard = 0;
    while(cur.length < count && guard < 200){
      guard++;
      const candidate = isMista ? randMistaStim(mistaTypesFor(cfg.gonogoMista)) : POOLS[cfg.stimType][Math.floor(Math.random()*POOLS[cfg.stimType].length)];
      const already = isMista ? cur.some(x=>sameStim(x,candidate)) : cur.some(x=>seqLabel(x)===seqLabel(candidate));
      if(!already) cur.push(candidate);
    }
    cfg.targetSeq = cur;
  }
  export function sequenceTargetForBuild(cfg){
    if(cfg.titrationMode==='manuale') return cfg.targetSeq;
    const desiredLen = ADAPT_SEQ_LEN[cfg.adaptStartLevel] || cfg.targetSeq.length;
    if(cfg.targetSeq.length===desiredLen) return cfg.targetSeq;
    const base = cfg.targetSeq.length ? cfg.targetSeq
      : (cfg.sequenzaMista && cfg.sequenzaMista!=='no') ? [{stimType:SEQUENZA_MISTA_TYPES[0], item:POOLS[SEQUENZA_MISTA_TYPES[0]][0]}]
      : defaultTargetSeq(cfg.stimType, 1);
    const out = [];
    for(let i=0;i<desiredLen;i++) out.push(base[i % base.length]);
    return out;
  }
  export function buildSequenceTarget(cfg){
    const isMista = cfg.taskMode==='sequenza' && cfg.sequenzaMista && cfg.sequenzaMista!=='no';
    const mistaTypes = isMista ? mistaTypesFor(cfg.sequenzaMista) : null;
    const target = sequenceTargetForBuild(cfg);
    const len = target.length;
    const raw = [];
    const pool = isMista ? null : POOLS[cfg.stimType];
    for(let i=0;i<cfg.trials;i++) raw.push(isMista ? randMistaStim(mistaTypes) : pool[Math.floor(Math.random()*pool.length)]);
    for(let i=len-1;i<cfg.trials;i++){
      if(Math.random() < cfg.targetRate){
        for(let j=0;j<len;j++) raw[i-len+1+j] = target[j];
      }
    }
    return raw.map((val,i)=>{
      let isTarget = false;
      if(i>=len-1){
        isTarget = true;
        for(let j=0;j<len;j++){ if(!sameSeqItem(cfg, raw[i-len+1+j], target[j])){ isTarget=false; break; } }
      }
      return {val, isTarget, valid:i>=len-1};
    });
  }
