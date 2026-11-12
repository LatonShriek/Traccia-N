// Serie attentive alternate (versione individuale a tocco, dal generatore PdM CDCD).
// Stimoli A, B, 1, 2 in nero o rosso, uno alla volta, a ritmo imposto. A ogni stimolo il paziente
// tocca la risposta prevista dalla regola: «Dx», «Sx», «Sì», «No» (quattro pulsanti a schermo), oppure
// NON tocca nulla se la regola prevede No-Go (stimolo con ✕, o combinazione da non rispondere).
// Le 32 regole del generatore sono qui in forma strutturata; i 10 livelli di Traccia-N ne scelgono 10,
// dalla più semplice (colore) alla più complessa (n-2 back); l'operatore può anche fissarne una a mano.
// Funzioni pure: il caso passa da `rng`.
import { adaptStep } from '../core/adapt.js';
import { mean } from '../core/stats.js';

  // Risposte: 'dx' 'sx' 'si' 'no', null = non rispondere (No-Go).
  export const SERIE_RESPONSES = ['sx','si','no','dx'];
  export const SERIE_RESPONSE_LABELS = { dx:'Destra', sx:'Sinistra', si:'Sì', no:'No' };
  const isLetter = s => s.char==='A' || s.char==='B';
  const isBlack = s => s.color==='black';
  // Costruttori di regole: ogni regola è {text, fn(stim, prev1, prev2) -> risposta|null|undefined, lag, marker}
  // `undefined` = nessuna risposta da valutare (mancano gli stimoli precedenti). `marker` = quota di
  // prove No-Go segnalate da una ✕ sullo stimolo.
  function byColor(b, r, text){ return {text, lag:0, fn:s=> isBlack(s)?b:r}; }
  function byCategory(l, n, text){ return {text, lag:0, fn:s=> isLetter(s)?l:n}; }
  function byChar(m, text, marker){ return {text, lag:0, marker:marker||0, fn:s=> m[s.char]}; }
  // Incrocio colore×categoria: LN = lettera nera, LR = lettera rossa, NR = numero rosso, NN = numero nero
  function cross(m, text){ return {text, lag:0, fn:s=>{
    const k = (isLetter(s)?'L':'N') + (isBlack(s)?'N':'R');
    return m[k]; }}; }
  function nback(lag, b, r, text){ return {text, lag, fn:(s,p1,p2)=>{ const p = lag===1 ? p1 : p2; if(!p) return undefined; return isBlack(p)?b:r; }}; }
  const M = 0.1; // quota di No-Go segnalati
  export const SERIE_RULES_N = [
    byColor('dx','sx','Destra se nero, sinistra se rosso.'),
    byCategory('dx','sx','Destra se lettera, sinistra se numero.'),
    byChar({A:'dx',1:'dx',B:'sx',2:'sx'},'Destra se A o 1, sinistra se B o 2.'),
    byChar({A:'dx',1:'dx',B:'sx',2:'sx'},'Destra se A o 1, sinistra se B o 2; se compare ✕ non toccare.', M),
    byChar({A:'dx',2:'dx',B:'sx',1:'sx'},'Destra se A o 2, sinistra se B o 1.'),
    byChar({A:'dx',2:'dx',B:'sx',1:'sx'},'Destra se A o 2, sinistra se B o 1; se compare ✕ non toccare.', M),
    byChar({A:'dx',B:'sx',1:'si',2:'no'},'Destra se A, sinistra se B, «Sì» se 1, «No» se 2.'),
    byChar({A:'si',B:'no',1:'dx',2:'sx'},'«Sì» se A, «No» se B, destra se 1, sinistra se 2.'),
    byChar({A:'dx',B:'si',1:'sx',2:'no'},'Destra se A, «Sì» se B, sinistra se 1, «No» se 2.'),
    byChar({A:'dx',B:'si',1:'sx',2:'no'},'Destra se A, «Sì» se B, sinistra se 1, «No» se 2; se compare ✕ non toccare.', M),
    byChar({A:'sx',B:'no',1:'dx',2:'si'},'Sinistra se A, «No» se B, destra se 1, «Sì» se 2.'),
    byChar({A:'sx',B:'no',1:'dx',2:'si'},'Sinistra se A, «No» se B, destra se 1, «Sì» se 2; se compare ✕ non toccare.', M),
    byChar({A:'dx',B:'no',1:'sx',2:'si'},'Destra se A, «No» se B, sinistra se 1, «Sì» se 2.'),
    byChar({A:'dx',B:'no',1:'sx',2:'si'},'Destra se A, «No» se B, sinistra se 1, «Sì» se 2; se compare ✕ non toccare.', M),
    byChar({A:'sx',B:'si',1:'dx',2:'no'},'Sinistra se A, «Sì» se B, destra se 1, «No» se 2.'),
    byChar({A:'sx',B:'si',1:'dx',2:'no'},'Sinistra se A, «Sì» se B, destra se 1, «No» se 2; se compare ✕ non toccare.', M),
    cross({LN:'dx',NR:'dx',LR:'sx',NN:'sx'},'Destra se lettera nera o numero rosso; sinistra se lettera rossa o numero nero.'),
    cross({LN:'sx',NR:'sx',LR:'si',NN:'si'},'Sinistra se lettera nera o numero rosso; «Sì» se lettera rossa o numero nero.'),
    cross({LR:'dx',NN:'dx',LN:'no',NR:'no'},'Destra se lettera rossa o numero nero; «No» se lettera nera o numero rosso.'),
    cross({LN:'sx',NR:'sx',LR:'no',NN:'no'},'Sinistra se lettera nera o numero rosso; «No» se lettera rossa o numero nero.'),
    cross({LN:'dx',LR:null,NR:'sx',NN:null},'Destra se lettera nera, niente se lettera rossa; sinistra se numero rosso, niente se numero nero.'),
    cross({LN:'sx',LR:null,NR:'si',NN:null},'Sinistra se lettera nera, niente se lettera rossa; «Sì» se numero rosso, niente se numero nero.'),
    nback(1,'dx','sx','Rispondi in base allo stimolo PRECEDENTE: destra se era nero, sinistra se era rosso.'),
    nback(1,'dx','si','Rispondi in base allo stimolo PRECEDENTE: destra se era nero, «Sì» se era rosso.'),
    nback(1,'sx','si','Rispondi in base allo stimolo PRECEDENTE: sinistra se era nero, «Sì» se era rosso.'),
    nback(1,'si','no','Rispondi in base allo stimolo PRECEDENTE: «Sì» se era nero, «No» se era rosso.'),
    nback(1,'sx','dx','Rispondi in base allo stimolo PRECEDENTE: sinistra se era nero, destra se era rosso.'),
    nback(1,'no','dx','Rispondi in base allo stimolo PRECEDENTE: «No» se era nero, destra se era rosso.'),
    nback(2,'dx','sx','Rispondi in base allo stimolo di DUE POSTI PRIMA: destra se era nero, sinistra se era rosso.'),
    nback(2,'dx','si','Rispondi in base allo stimolo di DUE POSTI PRIMA: destra se era nero, «Sì» se era rosso.'),
    nback(2,'si','no','Rispondi in base allo stimolo di DUE POSTI PRIMA: «Sì» se era nero, «No» se era rosso.'),
    nback(2,'sx','dx','Rispondi in base allo stimolo di DUE POSTI PRIMA: sinistra se era nero, destra se era rosso.')
  ];
  // Livello (1-10) → regola (1-32, come nel generatore) e ritmo (ms per stimolo). Ipotesi di partenza
  // dichiarate, da tarare sull'uso clinico.
  export const SERIE_LEVELS = {
    1:{rule:1,  isi:3500}, 2:{rule:2,  isi:3200}, 3:{rule:3,  isi:3000}, 4:{rule:4,  isi:2800},
    5:{rule:7,  isi:2800}, 6:{rule:10, isi:2600}, 7:{rule:17, isi:2600}, 8:{rule:21, isi:2400},
    9:{rule:23, isi:2600}, 10:{rule:29, isi:2400}
  };
  export const SERIE_ADAPT_BLOCK = 8;
  // Regola effettiva: se l'operatore ne ha fissata una a mano (cfg.serieRegola 1-32) vale quella,
  // altrimenti quella del livello.
  export function serieRuleFor(cfg){
    const manual = cfg.serieRegola|0;
    const idx = (manual>=1 && manual<=32) ? manual : SERIE_LEVELS[Math.max(1,Math.min(10,cfg.adaptStartLevel))].rule;
    return { index: idx, rule: SERIE_RULES_N[idx-1] };
  }
  // Serie di stimoli: le prime 4 fisse come nel generatore (A nero, B rosso, 1 rosso, 2 nero), poi
  // simbolo e colore liberi ma mai più di 3 uguali di fila. `marker` = ✕ su una quota di prove (mai le prime 4,
  // mai due di fila).
  export function genSerieStimuli(length, markerRate, rng){
    rng = rng || Math.random;
    const seq = [{char:'A',color:'black'},{char:'B',color:'red'},{char:'1',color:'red'},{char:'2',color:'black'}];
    const pool = ['A','B','1','2'], colors = ['black','red'];
    const run = (key,val)=> seq.length>=3 && seq.slice(-3).every(s=>s[key]===val);
    while(seq.length<length){
      let ch, co, t=0;
      do{ ch = pool[Math.floor(rng()*4)]; t++; }while(t<30 && run('char',ch));
      t=0; do{ co = colors[Math.floor(rng()*2)]; t++; }while(t<30 && run('color',co));
      seq.push({char:ch,color:co});
    }
    seq.forEach((s,i)=>{ s.nogo = false; });
    if(markerRate>0) for(let i=4;i<seq.length;i++){ if(!seq[i-1].nogo && rng()<markerRate) seq[i].nogo = true; }
    return seq;
  }
  // Risposta attesa allo stimolo i: 'dx'|'sx'|'si'|'no', null = non toccare, undefined = non valutare.
  export function serieExpected(rule, seq, i){
    const s = seq[i];
    if(rule.marker && s.nogo) return null;
    return rule.fn(s, i>=1?seq[i-1]:null, i>=2?seq[i-2]:null);
  }
  // Esito: given = risposta toccata (null = nessun tocco). Corretto = tocco giusto, oppure nessun tocco
  // quando la regola prevede No-Go. `commission` = ha toccato dove non doveva.
  export function scoreSerieTrial(expected, given, rtMs){
    if(expected===null){
      return given==null ? {correct:true, omitted:false, rt:null, nogo:true, commission:false}
                         : {correct:false, omitted:false, rt:rtMs, nogo:true, commission:true};
    }
    if(given==null) return {correct:false, omitted:true, rt:null, nogo:false, commission:false};
    return {correct: given===expected, omitted:false, rt:rtMs, nogo:false, commission:false};
  }
  export function maybeAdaptSerie(cfg, session){
    if(!cfg.adaptive || cfg.serieRegola>0 || session.serieAdaptBlock.length < SERIE_ADAPT_BLOCK) return;
    cfg.adaptStartLevel += adaptStep(mean(session.serieAdaptBlock), cfg.adaptStartLevel, 1, 10);
    session.serieAdaptBlock = [];
  }
