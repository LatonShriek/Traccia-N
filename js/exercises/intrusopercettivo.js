// Intruso percettivo: trova l'UNICO elemento che compare una sola volta fra tanti.
// Portato dal generatore PdM CDCD (schede per gruppi) alla versione individuale a tocco:
// stessa regola (un solo elemento unico, tutti gli altri ripetuti almeno 2 volte),
// ma su 10 livelli come gli altri esercizi di Traccia-N, con tempo massimo per prova.
// Funzioni pure: nessun accesso allo schermo; il caso passa da `rng` (per i test).
import { adaptStep } from '../core/adapt.js';
import { mean } from '../core/stats.js';

  function codeRange(base, count, step){
    step = step||1;
    return Array.from({length:count},(_,i)=>String.fromCodePoint(base+i*step));
  }
  // Famiglie di simboli, dalla più familiare alla più ostica. `from` = primo livello in cui
  // può comparire (le più difficili solo più avanti, come nel generatore).
  export const INTRUSO_FAMILIES = [
    {id:'digit',  label:'cifre',            pool:'0123456789'.split(''),                          from:1},
    {id:'letter', label:'lettere',          pool:'ABCDEFGHILMNOPQRSTUVZ'.split(''),               from:1},
    {id:'arrow',  label:'frecce',           pool:['↑','↓','←','→','↖','↗','↘','↙','⇑','⇓','⇐','⇒'], from:2},
    {id:'shape',  label:'forme',            pool:['●','○','■','□','▲','△','▼','▽','◆','◇','★','☆'], from:2},
    {id:'greek',  label:'alfabeto greco',   pool:codeRange(0x0391,25).filter(c=>c.codePointAt(0)!==0x03A2), from:4},
    {id:'cyril',  label:'cirillico',        pool:codeRange(0x0410,32),                           from:5},
    {id:'hebrew', label:'ebraico',          pool:codeRange(0x05D0,27).filter(c=>![0x05DA,0x05DD,0x05DF,0x05E3,0x05E5].includes(c.codePointAt(0))), from:7},
    {id:'kana',   label:'hiragana',         pool:codeRange(0x3042,48),                           from:8},
    {id:'armen',  label:'armeno',           pool:codeRange(0x0530,38),                           from:9}
  ];
  // Livello → numero di elementi, lunghezza di ciascun elemento (1-3 simboli),
  // quota di "tipi quasi uguali" (somiglianza) e tempo massimo per prova.
  // Ipotesi di partenza dichiarate, non valori di letteratura: da tarare sull'uso clinico.
  export const INTRUSO_LEVELS = {
    1:{n:12, len:1, sim:0,    limitMs:30000}, 2:{n:15, len:1, sim:0,    limitMs:28000},
    3:{n:15, len:1, sim:0,    limitMs:26000}, 4:{n:18, len:1, sim:0,    limitMs:24000},
    5:{n:18, len:2, sim:0.2,  limitMs:24000}, 6:{n:21, len:2, sim:0.4,  limitMs:22000},
    7:{n:21, len:2, sim:0.6,  limitMs:20000}, 8:{n:24, len:2, sim:0.8,  limitMs:18000},
    9:{n:24, len:3, sim:0.8,  limitMs:16000}, 10:{n:27, len:3, sim:1,   limitMs:15000}
  };
  export const INTRUSO_ADAPT_BLOCK = 6;

  function pickFrom(arr, rng){ return arr[Math.floor(rng()*arr.length)]; }
  function shuffled(arr, rng){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){ const j = Math.floor(rng()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; }
    return a;
  }
  export function intrusoFamiliesAt(level){ return INTRUSO_FAMILIES.filter(f=>f.from<=level); }
  // Tipi "quasi uguali": ogni nuovo tipo cambia UN solo simbolo (o scambia due adiacenti)
  // rispetto a uno già scelto — è questo che rende difficile trovare l'unico.
  function similarTypes(pool, len, k, rng){
    const first = Array.from({length:len},()=>pickFrom(pool,rng));
    const found = new Map([[first.join(''), first]]);
    for(let tries=0; found.size<k && tries<3000; tries++){
      const v = pickFrom([...found.values()],rng).slice();
      if(len>=2 && rng()<0.35){ const i = Math.floor(rng()*(len-1)); [v[i],v[i+1]] = [v[i+1],v[i]]; }
      else { const i = Math.floor(rng()*len); let s, g=0; do{ s = pickFrom(pool,rng); g++; }while(s===v[i] && g<20); v[i] = s; }
      found.set(v.join(''), v);
    }
    return [...found.keys()];
  }
  function distinctTypes(pool, len, k, rng){
    if(len===1) return shuffled(pool,rng).slice(0, Math.min(k,pool.length));
    const set = new Set();
    for(let tries=0; set.size<k && tries<800; tries++) set.add(Array.from({length:len},()=>pickFrom(pool,rng)).join(''));
    return [...set];
  }
  // Una prova: `items` (n elementi), `oddIndex` (posizione dell'unico). Garantito: esattamente
  // un valore compare 1 volta, tutti gli altri almeno 2.
  export function genIntrusoTrial(level, rng){
    rng = rng || Math.random;
    const L = INTRUSO_LEVELS[Math.max(1,Math.min(10,level))];
    const fams = intrusoFamiliesAt(level);
    // Più la famiglia è "nuova" per il livello, più è probabile: si scende dai familiari ai difficili.
    const fam = rng()<0.5 ? fams[fams.length-1-Math.floor(rng()*Math.min(3,fams.length))] : pickFrom(fams,rng);
    const len = L.len;
    const poolCap = len===1 ? fam.pool.length : 99;
    let k = Math.min(9, poolCap);
    while(k>=2 && (L.n-1) < 2*(k-1)) k--;
    let types = (len>=2 && rng()<L.sim) ? similarTypes(fam.pool,len,k,rng) : distinctTypes(fam.pool,len,k,rng);
    if(types.length<2) return genIntrusoTrial(level, rng);
    k = types.length;
    while(k>=2 && (L.n-1) < 2*(k-1)) k--;
    types = types.slice(0,k);
    const oddType = pickFrom(types,rng);
    const others = types.filter(t=>t!==oddType);
    const rest = L.n-1, base = Math.floor(rest/others.length), rem = rest%others.length;
    const extra = new Set(shuffled(others.map((_,i)=>i),rng).slice(0,rem));
    const objs = [{v:oddType, odd:true}];
    others.forEach((t,i)=>{ const c = base + (extra.has(i)?1:0); for(let j=0;j<c;j++) objs.push({v:t, odd:false}); });
    const mixed = shuffled(objs,rng);
    return {
      items: mixed.map(o=>o.v), oddIndex: mixed.findIndex(o=>o.odd),
      familyId: fam.id, familyLabel: fam.label, len, n: L.n, limitMs: L.limitMs
    };
  }
  // Esito di una prova: tocco su un indice (null = tempo scaduto).
  export function scoreIntrusoTrial(trial, tappedIndex, rtMs){
    if(tappedIndex==null) return {correct:false, omitted:true, rt:null};
    return {correct: tappedIndex===trial.oddIndex, omitted:false, rt: rtMs};
  }
  // Adattamento: ogni INTRUSO_ADAPT_BLOCK prove, stessa regola 70/85% degli altri esercizi.
  export function maybeAdaptIntruso(cfg, session){
    if(!cfg.adaptive || session.ipAdaptBlock.length < INTRUSO_ADAPT_BLOCK) return;
    cfg.adaptStartLevel += adaptStep(mean(session.ipAdaptBlock), cfg.adaptStartLevel, 1, 10);
    session.ipAdaptBlock = [];
  }
