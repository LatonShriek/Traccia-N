// Intruso percettivo: trova l'UNICO elemento che compare una sola volta fra tanti.
// PORTING DIRETTO dal generatore PdM CDCD (js/generators/intruso.js): stesse famiglie di simboli (36),
// stessa logica (un solo elemento unico, tutti gli altri almeno 2 volte), stesse regole di lunghezza
// (1 simbolo → coppie dal 9 → terne dal 21), stessa somiglianza dei tipi, stessa numerosità a punteggio
// unico (INTRUSO_SCORE_W). Cambia solo il modo di rispondere: tocco / clic sull'elemento.
// Il generatore ha 32 livelli, Traccia-N 10: il livello 1-10 corrisponde a 1, 4, 8, 11, 15, 18, 22, 25, 29, 32.
// Funzioni pure: nessun accesso allo schermo; il caso passa da `rng` (per i test).
import { adaptStep } from '../core/adapt.js';
import { mean } from '../core/stats.js';

const MAX_LEVEL = 32;
function levelT(level){ return Math.max(0, Math.min(1, (level-1)/(MAX_LEVEL-1))); }
function codeRange(base, count, step){ step = step||1; return Array.from({length:count},(_,i)=>String.fromCodePoint(base+i*step)); }

// ---- famiglie (identiche al generatore) ----
const TEXT = [
  {id:'digit', label:'cifre', pool:'0123456789'.split(''), unlockLevel:1},
  {id:'letter', label:'lettere', pool:'ABCDEFGHILMNOPQRSTUVZ'.split(''), unlockLevel:1},
  {id:'roman', label:'numeri romani', pool:['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ','Ⅸ','Ⅹ'], unlockLevel:3},
  {id:'cyrillic', label:'cirillico', pool:codeRange(0x0410,32), unlockLevel:6},
  {id:'armenian', label:'armeno', pool:codeRange(0x0530,38), unlockLevel:11},
  {id:'thai', label:'thai', pool:codeRange(0x0E01,40), unlockLevel:13},
  {id:'geez', label:"ge'ez", pool:codeRange(0x1200,60), unlockLevel:17},
  {id:'cyrillic-arcaico', label:'cirillico arcaico', pool:codeRange(0x0460,16,2), unlockLevel:24},
  {id:'canadian', label:'sillabario canadese', pool:codeRange(0x1400,50), unlockLevel:26},
  {id:'lower', label:'lettere minuscole', pool:'abdeghilmnopqrstuvz'.split(''), unlockLevel:1},
  {id:'mixedcase', label:'lettere maiuscole e minuscole', pool:['a','A','b','B','d','D','e','E','g','G','n','N','r','R','t','T'], unlockLevel:1},
  {id:'greek', label:'alfabeto greco', pool:codeRange(0x0391,25).filter(ch=>ch.codePointAt(0)!==0x03A2), unlockLevel:5},
  {id:'katakana', label:'katakana', pool:codeRange(0x30A2,48), unlockLevel:16},
  {id:'hiragana', label:'hiragana', pool:codeRange(0x3042,48), unlockLevel:18},
  {id:'hebrew', label:'ebraico', pool:codeRange(0x05D0,27).filter(ch=>![0x05DA,0x05DD,0x05DF,0x05E3,0x05E5].includes(ch.codePointAt(0))), unlockLevel:20},
  {id:'devanagari', label:'devanagari', pool:codeRange(0x0915,25), unlockLevel:22}
];
const ATOMIC = [
  {id:'arrow', label:'frecce', pool:['↑','↓','←','→','↖','↗','↘','↙','⇑','⇓','⇐','⇒'], unlockLevel:1},
  {id:'geometric', label:'forme', pool:['●','○','■','□','▲','△','▼','▽','◆','◇','★','☆'], unlockLevel:1},
  {id:'suits', label:'semi delle carte', pool:['♠','♥','♦','♣'], extra:['♤','♡','♢','♧'], small:true, extraFrom:6, pairsFrom:2, triplesFrom:9, unlockLevel:1},
  {id:'music', label:'note musicali', pool:['♩','♪','♫','♬'], extra:['♭','♮','♯'], small:true, extraFrom:7, pairsFrom:2, triplesFrom:9, unlockLevel:1},
  {id:'punct', label:'punteggiatura', pool:['!','?','#','%','&','@','§','*'], unlockLevel:1},
  {id:'zodiac', label:'simboli zodiacali', pool:['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'], unlockLevel:1},
  {id:'dice', label:'dadi', pool:codeRange(0x2680,6), extra:[], small:true, extraFrom:99, pairsFrom:3, triplesFrom:11, unlockLevel:1},
  {id:'domino', label:'domino', pool:codeRange(0x1F030,32), unlockLevel:8},
  {id:'mahjong', label:'mahjong', pool:codeRange(0x1F007,20), unlockLevel:14},
  {id:'cjk', label:'ideogrammi', pool:codeRange(0x53E3,40), unlockLevel:28},
  {id:'circles', label:'cerchi parzialmente pieni', pool:['◐','◑','◒','◓'], extra:['◔','◕','○','●'], small:true, extraFrom:8, pairsFrom:3, triplesFrom:13, unlockLevel:1},
  {id:'quadrants', label:'quadranti', pool:['◰','◱','◲','◳'], extra:['◧','◨','◩','◪'], small:true, extraFrom:10, pairsFrom:5, triplesFrom:15, unlockLevel:3},
  {id:'box', label:'tratti da tabella', pool:['┌','┐','└','┘','├','┤','┬','┴','┼'], unlockLevel:7},
  {id:'sets', label:'simboli insiemistici', pool:['∈','∉','∩','∪','⊂','⊃','⊆','⊇','∋','∌'], unlockLevel:9},
  {id:'braille', label:'Braille', pool:codeRange(0x2801,63), unlockLevel:14}
];
export const INTRUSO_FAMILIES = [...TEXT, ...ATOMIC];
const RECOGNIZABILITY = { mahjong:0.8, domino:0.8, suits:0.8 };
const recog = id => RECOGNIZABILITY[id] ?? 1;
// larghezza del carattere per famiglia (per dimensionare il corpo nella cella), come nel generatore
export const INTRUSO_CHAR_WIDTH = {
  digit:0.6, letter:0.95, roman:1.85, cyrillic:1.05, armenian:1.05, thai:1.0, geez:1.25, 'cyrillic-arcaico':1.3, canadian:1.4,
  arrow:1.0, geometric:1.0, suits:1.3, music:1.05, punct:0.9, zodiac:1.3, dice:1.2, domino:1.4, mahjong:1.45, cjk:1.1,
  lower:0.95, mixedcase:1.05, greek:1.1, katakana:1.25, hiragana:1.25, hebrew:1.0, devanagari:1.2,
  circles:1.3, quadrants:1.3, box:1.1, sets:1.2, braille:1.2
};
export const INTRUSO_GROUP_CHAR_WIDTH = { suits:1.15, zodiac:1.1 };
// elementi di 2-3 glifi di una famiglia a simboli: racchiusi in una cornice sottile (come nel generatore)
export function intrusoFramed(familyId, itemLen){ return itemLen>=2 && ATOMIC.some(f=>f.id===familyId); }

// ---- difficoltà a punteggio unico (come nel generatore) ----
const SCORE_W = { len:0.25, fam:0.25, sim:0.20, n:0.30 };
const TARGET_D = [0.05, 0.80], N_RANGE = [15, 30], LEN_STEPS = [9, 21];
const targetD = g => TARGET_D[0] + (TARGET_D[1]-TARGET_D[0])*levelT(g);
const famTerm = f => Math.min(1, 0.7*Math.min(1, f.unlockLevel/28) + (1 - recog(f.id)));
const simTerm = (g, len) => len>=2 ? Math.max(0, Math.min(1, (g-2)/30)) : 0;
function targetN(g, fam, len){
  const rest = SCORE_W.len*(len-1)/2 + SCORE_W.fam*famTerm(fam) + SCORE_W.sim*simTerm(g,len);
  const nScore = Math.max(0, Math.min(1, (targetD(g)-rest)/SCORE_W.n));
  const cap = len>=3 ? 27 : N_RANGE[1];
  return Math.min(cap, Math.round(N_RANGE[0] + nScore*(N_RANGE[1]-N_RANGE[0])));
}
function textWarmup(size){
  if(size<=12) return {pair:6, triple:22};
  if(size<=20) return {pair:8, triple:24};
  if(size<=28) return {pair:9, triple:26};
  if(size<=40) return {pair:11, triple:99};
  return {pair:13, triple:99};
}
function maxLen(f){
  if(TEXT.includes(f)) return textWarmup(f.pool.length).triple<99 ? 3 : 2;
  if(f.id==='domino' || f.id==='mahjong') return 1;
  return f.small ? 3 : 2;
}
function sessionLen(g){ return g<LEN_STEPS[0] ? 1 : (g<LEN_STEPS[1] ? 2 : 3); }
function eligible(g, L){
  const base = INTRUSO_FAMILIES.filter(f=>f.unlockLevel<=g && maxLen(f)>=L);
  if(L===1) return base;
  const settled = base.filter(f=>g>=f.unlockLevel+3);
  return settled.length>=4 ? settled : base;
}
function planLen(g){ let L = sessionLen(g); while(L>1 && eligible(g,L).length<4) L--; return L; }
function gridFriendly(c){ for(let r=3;r<=6;r++) if(c%r===0 && c/r>=3 && c/r<=10) return true; return false; }
function niceCount(n){
  for(let d=0; d<=2; d++){
    for(const cand of (d===0 ? [n] : [n-d, n+d])) if(cand>=4 && gridFriendly(cand)) return cand;
  }
  return n;
}
export function bestGridCols(n, areaW, areaH){
  let cols = 1, best = -1;
  for(let c=1;c<=n;c++){ if(n%c!==0) continue; const m = Math.min(areaW/c, areaH/(n/c)); if(m>best){ best=m; cols=c; } }
  return cols;
}

// ---- dal livello 1-10 di Traccia-N al livello 1-32 del generatore ----
export function intrusoGenLevel(level){ return Math.round(1 + (Math.max(1,Math.min(10,level))-1)*(MAX_LEVEL-1)/9); }
// tempo massimo per schermata (ipotesi di partenza, da tarare sull'uso clinico)
export const INTRUSO_LIMIT_MS = {1:40000,2:38000,3:36000,4:34000,5:32000,6:30000,7:28000,8:26000,9:24000,10:22000};
export const INTRUSO_ADAPT_BLOCK = 6;
export function intrusoFamiliesAt(level){ const g = intrusoGenLevel(level); return INTRUSO_FAMILIES.filter(f=>f.unlockLevel<=g); }
// Che cosa aspettarsi a un livello (per la scheda di configurazione): lunghezza, numero tipico, tempo.
export function intrusoPlanAt(level){
  const lv = Math.max(1,Math.min(10,level)), g = intrusoGenLevel(lv), len = planLen(g);
  const ns = eligible(g,len).map(f=>niceCount(targetN(g,f,Math.min(len,maxLen(f)))));
  return { gen:g, len, nMin:Math.min(...ns), nMax:Math.max(...ns), limitMs:INTRUSO_LIMIT_MS[lv] };
}
// compatibilità con il registro e la scheda (n = numero tipico)
export const INTRUSO_LEVELS = new Proxy({}, { get:(_,k)=>{ const lv = Number(k); if(!(lv>=1 && lv<=10)) return undefined; const p = intrusoPlanAt(lv); return {n:p.nMax, len:p.len, limitMs:p.limitMs}; } });

function pickFrom(arr, rng){ return arr[Math.floor(rng()*arr.length)]; }
function shuffled(arr, rng){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function poolFor(f, g){ return (f.small && f.extra && g>=f.extraFrom) ? f.pool.concat(f.extra) : f.pool; }
function similarTypes(pool, len, k, rng){
  const first = Array.from({length:len},()=>pickFrom(pool,rng));
  const found = new Map([[first.join(''), first]]);
  for(let tries=0; found.size<k && tries<3000; tries++){
    const v = pickFrom([...found.values()],rng).slice();
    if(len>=2 && rng()<0.35){ const i = Math.floor(rng()*(len-1)); [v[i],v[i+1]] = [v[i+1],v[i]]; }
    else { const i = Math.floor(rng()*len); let s, gg=0; do{ s = pickFrom(pool,rng); gg++; }while(s===v[i] && gg<20); v[i] = s; }
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

// Una prova (una schermata): `items`, `oddIndex`. Garantito: un solo valore compare 1 volta, gli altri ≥2.
// opts.avoidFamilies = id delle famiglie appena usate (per ruotarle).
export function genIntrusoTrial(level, rng, opts){
  rng = rng || Math.random; opts = opts || {};
  const lv = Math.max(1,Math.min(10,level)), g = intrusoGenLevel(lv), L = planLen(g);
  const el = eligible(g, L).slice().sort((a,b)=>famTerm(a)-famTerm(b));
  const w = Math.min(el.length, Math.max(Math.min(9, el.length), Math.ceil(el.length*0.5)));
  const start = Math.round(levelT(g)*(el.length-w));
  let win = el.slice(start, start+w);
  const fresh = win.filter(f=>!(opts.avoidFamilies||[]).includes(f.id));
  if(fresh.length) win = fresh;
  const fam = pickFrom(win, rng);
  const len = Math.min(L, maxLen(fam));
  const n = niceCount(targetN(g, fam, len));
  const pool = poolFor(fam, g);
  const poolCap = len===1 ? pool.length : 99;
  const kMax = Math.min(9 + Math.max(0, Math.floor((n-18)/3)), poolCap);
  let k = kMax;
  while(k>=2 && (n-1) < 2*(k-1)) k--;
  let types = (len>=2 && g>=3 && rng() < (g-2)/30) ? similarTypes(pool,len,k,rng) : distinctTypes(pool,len,k,rng);
  if(types.length<2) return genIntrusoTrial(level, rng, opts);
  k = types.length;
  while(k>=2 && (n-1) < 2*(k-1)) k--;
  types = types.slice(0,k);
  const oddType = pickFrom(types,rng);
  const others = types.filter(t=>t!==oddType);
  const rest = n-1, base = Math.floor(rest/others.length), rem = rest%others.length;
  const extra = new Set(shuffled(others.map((_,i)=>i),rng).slice(0,rem));
  const objs = [{v:oddType, odd:true}];
  others.forEach((t,i)=>{ const c = base + (extra.has(i)?1:0); for(let j=0;j<c;j++) objs.push({v:t, odd:false}); });
  const mixed = shuffled(objs,rng);
  return { items:mixed.map(o=>o.v), oddIndex:mixed.findIndex(o=>o.odd), familyId:fam.id, familyLabel:fam.label, len, n, limitMs:INTRUSO_LIMIT_MS[lv] };
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
