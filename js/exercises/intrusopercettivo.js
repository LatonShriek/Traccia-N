// Intruso percettivo: trova l'UNICO elemento che compare una sola volta fra tanti.
// PORTING DIRETTO dal generatore PdM CDCD (js/generators/intruso.js): stesse famiglie di simboli (36),
// stessa logica (un solo elemento unico, tutti gli altri almeno 2 volte), stesse regole di lunghezza
// (1 simbolo → coppie dal 9 → terne dal 21), stessa somiglianza dei tipi, stessa numerosità a punteggio
// unico (INTRUSO_SCORE_W). Cambia solo il modo di rispondere: tocco / clic sull'elemento.
// Il generatore ha 32 livelli, Traccia-N 10: il livello 1-10 corrisponde a 1, 4, 8, 11, 15, 18, 22, 25, 29, 32.
// Funzioni pure: nessun accesso allo schermo; il caso passa da `rng` (per i test).
import { adaptStep, adaptStepFine, fineStartOf, windowOf, windowKeep } from '../core/adapt.js';
import { decideStep, timeFStartOf, clampTimeF, loadOfGen } from '../core/assi.js';
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
// 22 nov 2026 — scala con ORIENTAMENTI. Ogni famiglia ha due livelli di sblocco: `hard` = quello storico (misura quanto è ostica: pesa
// sul punteggio di difficoltà), `unlockLevel` = da quando compare. Le scritture non familiari (greco, cirillico, armeno, Braille, ecc.)
// ora compaiono già come SINGOLI (livelli del generatore 4-6): prima si sbloccavano quando gli elementi erano già coppie e non
// comparivano mai da soli.
const UNLOCK_SINGOLI = { greek:4, cyrillic:4, armenian:5, hebrew:5, thai:5, katakana:5, hiragana:5, devanagari:5,
  geez:6, 'cyrillic-arcaico':6, canadian:6, mahjong:6, braille:6, cjk:6, domino:6 };
export const INTRUSO_FAMILIES = [...TEXT, ...ATOMIC].map(f => ({ ...f, hard: f.unlockLevel, unlockLevel: UNLOCK_SINGOLI[f.id] ?? f.unlockLevel }));
// Scala dei livelli del generatore (1-32): contenuto per fascia (Traccia-N usa i livelli 1, 4, 8, 11, 15, 18, 22, 25, 29, 32)
//   1-3 singoli semplici · 4-6 singoli + scritture non familiari · 7-9 singoli a 4 orientamenti · 10-12 singoli a 8 orientamenti
//   13-16 coppie · 17-19 coppie a 4 orient. · 20-23 coppie a 8 · 24-27 terne · 28-30 terne a 4 · 31-32 terne a 8
export const INTRUSO_LEN_STEPS = [13, 24];
export function intrusoOrientCount(g){
  const x = Math.floor(g + 1e-9);
  if((x>=7 && x<=9) || (x>=17 && x<=19) || (x>=28 && x<=30)) return 4;
  if((x>=10 && x<=12) || (x>=20 && x<=23) || x>=31) return 8;
  return 1;
}
// Un elemento ruotato è un elemento DIVERSO dall'originale (identico = stesso simbolo E stesso orientamento). 22 nov 2026 (richiesta di Rodrigo):
// la rotazione riguarda SOLO le famiglie con pochi stimoli (4-5 opzioni), dove l'orientamento allarga davvero le possibilità: semi delle carte e
// note musicali. Verificato al computer (confronto delle immagini ruotate) che per le altre famiglie a pool piccolo la rotazione dà immagini
// identiche ad altri stimoli dello stesso gruppo: cerchi pieni a metà e quadranti ruotati di 90° diventano un altro glifo del gruppo; dadi (1, 4, 5
// uguali a se stessi a 90°, 2, 3 e 6 a 180°). Perciò non ruotano. Niente immagini speculari.
const ROT_OK = new Set(['suits','music']);
// con questi due gruppi tutti gli 8 angoli sono distinti (verificato), quindi anche 180° e oltre
const ROT_180_OK = new Set(['suits','music']);
// glifi tolti quando si ruota: ♦ ♢ (simmetrici: uguali a se stessi a 180°) e ♮ ♯ (quasi simmetrici a 180°)
const ROT_GLYPH_BAN = new Set(['♦','♢','♮','♯']);
const ANGLES = { 4:[0,45,90,135], 8:[0,45,90,135,180,225,270,315] };
export function intrusoAnglesFor(familyId, g){
  const m = intrusoOrientCount(g);
  if(m===1 || !ROT_OK.has(familyId)) return [0];
  return (m===8 && ROT_180_OK.has(familyId)) ? ANGLES[8] : ANGLES[4];
}
// Ingombro (in em) di un elemento di `len` glifi ruotato: serve a dimensionare corpo e cornice perché nulla esca dalla cella.
export function intrusoRotBox(len, cw, angles, framed){
  const w = len*cw + (framed ? 0.6 : 0.1), h = framed ? 1.3 : 1.15;
  let W = w, H = h;
  angles.forEach(a=>{ const r = a*Math.PI/180, c = Math.abs(Math.cos(r)), n = Math.abs(Math.sin(r)); W = Math.max(W, w*c+h*n); H = Math.max(H, w*n+h*c); });
  return { w, h, W, H };
}
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
const TARGET_D = [0.05, 0.80], N_RANGE = [15, 30], LEN_STEPS = INTRUSO_LEN_STEPS;
const targetD = g => TARGET_D[0] + (TARGET_D[1]-TARGET_D[0])*levelT(g);
const famTerm = f => Math.min(1, 0.7*Math.min(1, f.hard/28) + (1 - recog(f.id)));
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
  if(TEXT.some(t=>t.id===f.id)) return textWarmup(f.pool.length).triple<99 ? 3 : 2;
  if(f.id==='domino' || f.id==='mahjong') return 1;
  return f.small ? 3 : 2;
}
function sessionLen(g){ return g<LEN_STEPS[0] ? 1 : (g<LEN_STEPS[1] ? 2 : 3); }
function eligibleRaw(g, L){
  const base = INTRUSO_FAMILIES.filter(f=>f.unlockLevel<=g && maxLen(f)>=L);
  if(L===1) return base;
  const settled = base.filter(f=>g>=f.unlockLevel+3);
  return settled.length>=4 ? settled : base;
}
// Nei livelli con orientamenti la rotazione è solo una VARIANTE in più (richiesta di Rodrigo, 22 nov 2026, non deve diventare il focus):
// le prove normali usano tutte le altre famiglie senza rotazione (eligible), e solo una minoranza di prove (ROT_SHARE) usa semi o note ruotati (eligibleRot),
// con numerosità e lunghezza decise dalla complessità del livello come negli altri livelli.
export const ROT_SHARE = 1/6;
function eligible(g, L){
  const raw = eligibleRaw(g, L);
  if(intrusoOrientCount(g)>1){ const ok = raw.filter(f=>!ROT_OK.has(f.id)); if(ok.length) return ok; }
  return raw;
}
function eligibleRot(g, L){
  return intrusoOrientCount(g)>1 ? eligibleRaw(g, L).filter(f=>ROT_OK.has(f.id)) : [];
}
// la lunghezza della sessione dipende dalle famiglie sbloccate, non da quelle ruotabili
function planLen(g){ let L = sessionLen(g); while(L>1 && eligibleRaw(g,L).length<4) L--; return L; }
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
// Progressione = quella di PdM generator (livelli del generatore 1, 4, 8, 11, 15, 18, 22, 25, 29, 32: stessi contenuti,
// famiglie di simboli e numerosità; 15 nov 2026, su richiesta di Rodrigo, dopo una taratura che ne escludeva il tratto alto).
// Solo il TEMPO per schermata è tarato per Traccia-N (in PdM non c'è tempo): scelto perché il carico — simboli da
// esaminare al secondo — cresca di circa il 23% a livello, da ≈0,4 a ≈2,5 simboli/s. Dove la lunghezza dell'elemento
// cambia (livelli 4 e 7) il tempo sale: è il «dente di sega» di PdM, che là agisce sul numero di elementi.
export const INTRUSO_GEN_OF_LEVEL = [1, 4, 8, 11, 15, 18, 22, 25, 29, 32];
export function intrusoGenLevel(level){ return INTRUSO_GEN_OF_LEVEL[Math.max(1,Math.min(10,Math.round(level)))-1]; }
// tempo massimo per schermata (ipotesi di partenza, da tarare sull'uso clinico)
// (22 nov 2026: ricalcolato con la nuova scala — coppie dal gen. 13, terne dal 24, rotazione solo su semi e note — sempre con carico ≈ +23% a livello)
export const INTRUSO_LIMIT_MS = {1:44000,2:44000,3:40000,4:38000,5:50000,6:44000,7:42000,8:44000,9:40000,10:32000};
export const INTRUSO_ADAPT_BLOCK = 6;
export function intrusoFamiliesAt(level){ const g = intrusoGenLevel(level); return INTRUSO_FAMILIES.filter(f=>f.unlockLevel<=g); }
// Che cosa aspettarsi a un livello (per la scheda di configurazione): lunghezza, numero tipico, tempo.
export function intrusoPlanOfGen(g){
  const len = planLen(g);
  const ns = eligibleRaw(g,len).map(f=>niceCount(targetN(g,f,Math.min(len,maxLen(f)))));
  return { gen:g, len, nMin:Math.min(...ns), nMax:Math.max(...ns), nMean: ns.reduce((a,b)=>a+b,0)/ns.length };
}
// Tempo per schermata a un livello INTERO del generatore (asse fine, 15 nov): simboli da esaminare ÷ carico atteso,
// arrotondato ai 2 s, mai sotto i 20 s. Ai livelli di Traccia-N coincide (±2 s) con INTRUSO_LIMIT_MS.
const _limCache = new Map();
export function intrusoLimitMsOfGen(g){
  if(!_limCache.has(g)){
    const p = intrusoPlanOfGen(g);
    _limCache.set(g, Math.max(20, Math.round(p.nMean*p.len/loadOfGen(g)/2)*2)*1000);
  }
  return _limCache.get(g);
}
export function intrusoPlanAt(level){
  const lv = Math.max(1,Math.min(10,level)), g = intrusoGenLevel(lv);
  const p = intrusoPlanOfGen(g);
  return { gen:g, len:p.len, nMin:p.nMin, nMax:p.nMax, limitMs:INTRUSO_LIMIT_MS[lv] };
}
// compatibilità con il registro e la scheda (n = numero tipico)
export const INTRUSO_LEVELS = new Proxy({}, { get:(_,k)=>{ const lv = Number(k); if(!(lv>=1 && lv<=10)) return undefined; const p = intrusoPlanAt(lv); return {n:p.nMax, len:p.len, limitMs:p.limitMs}; } });

const SEP = '\u0001';
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
  const lv = Math.max(1,Math.min(10,level)), g = opts.gen!=null ? opts.gen : intrusoGenLevel(lv), L = planLen(g);
  const baseLimit = opts.gen!=null ? intrusoLimitMsOfGen(g) : INTRUSO_LIMIT_MS[lv];
  const rotFams = eligibleRot(g, L);
  const wantRot = rotFams.length>0 && (opts.forceRot===true || (opts.forceRot!==false && rng() < ROT_SHARE));
  const el = (wantRot ? rotFams : eligible(g, L)).slice().sort((a,b)=>famTerm(a)-famTerm(b));
  const w = L===1 ? el.length : Math.min(el.length, Math.max(Math.min(9, el.length), Math.ceil(el.length*0.5))); // singoli: tutte le famiglie sbloccate (le non familiari vanno introdotte)
  const start = Math.round(levelT(g)*(el.length-w));
  let win = el.slice(start, start+w);
  const fresh = win.filter(f=>!(opts.avoidFamilies||[]).includes(f.id));
  if(fresh.length) win = fresh;
  const fam = pickFrom(win, rng);
  const len = Math.min(L, maxLen(fam));
  const n = niceCount(targetN(g, fam, len));
  const angles = intrusoAnglesFor(fam.id, g), rot = angles.length>1;
  const pool = rot ? poolFor(fam, g).filter(ch=>!ROT_GLYPH_BAN.has(ch)) : poolFor(fam, g);
  const poolCap = len===1 ? pool.length : 99;
  const kMax = Math.min(9 + Math.max(0, Math.floor((n-18)/3)), poolCap);
  let k = kMax;
  while(k>=2 && (n-1) < 2*(k-1)) k--;
  const useSim = len>=2 && g>=3 && rng() < (g-2)/30;
  let types;
  if(rot){
    // identità = simbolo + orientamento: pochi simboli, ciascuno a più orientamenti, così l'orientamento è davvero la variabile che cambia
    const sCount = Math.min(pool.length, Math.max(2, Math.ceil(k/2) + (len>=2 ? 1 : 0)));
    const strs = useSim ? similarTypes(pool,len,sCount,rng) : distinctTypes(pool,len,sCount,rng);
    const ids = []; strs.forEach(t=>angles.forEach(a=>ids.push(t+SEP+a)));
    types = shuffled(ids,rng).slice(0,k);
  } else types = useSim ? similarTypes(pool,len,k,rng) : distinctTypes(pool,len,k,rng);
  if(types.length<2) return genIntrusoTrial(level, rng, opts);
  k = types.length;
  while(k>=2 && (n-1) < 2*(k-1)) k--;
  types = types.slice(0,k);
  const oddType = pickFrom(types,rng);
  let others = types.filter(t=>t!==oddType);
  if(rot){ // l'intruso deve avere almeno un «gemello» con lo stesso simbolo ma altro orientamento (è quello che il compito mette alla prova)
    const oStr = oddType.split(SEP)[0];
    if(!others.some(t=>t.split(SEP)[0]===oStr)){
      const alt = angles.map(a=>oStr+SEP+a).find(t=>t!==oddType && !others.includes(t));
      if(alt && others.length) others = others.slice(0,-1).concat(alt);
    }
  }
  const rest = n-1, base = Math.floor(rest/others.length), rem = rest%others.length;
  const extra = new Set(shuffled(others.map((_,i)=>i),rng).slice(0,rem));
  const objs = [{v:oddType, odd:true}];
  others.forEach((t,i)=>{ const c = base + (extra.has(i)?1:0); for(let j=0;j<c;j++) objs.push({v:t, odd:false}); });
  const mixed = shuffled(objs,rng);
  return { items:mixed.map(o=>o.v.split(SEP)[0]), angles:mixed.map(o=>rot ? Number(o.v.split(SEP)[1]) : 0), orient:angles.length, oddIndex:mixed.findIndex(o=>o.odd), familyId:fam.id, familyLabel:fam.label, len, n, gen:g, limitMs:Math.round(baseLimit*(opts.timeF||1)) };
}
// Esito di una prova: tocco su un indice (null = tempo scaduto).
export function scoreIntrusoTrial(trial, tappedIndex, rtMs){
  if(tappedIndex==null) return {correct:false, omitted:true, rt:null};
  return {correct: tappedIndex===trial.oddIndex, omitted:false, rt: rtMs};
}
// ---- Errori concessi e aiuto sulla riga (27 nov 2026) ----
// Logica ripresa dal lettore a tocco del generatore PdM, senza togliere il tempo: il paziente può sbagliare; l'elemento
// toccato per errore si attenua e non si può più toccare, la schermata resta e il tempo massimo CONTINUA a scorrere
// (non riparte a ogni errore). Dopo `hintAfter` errori restano attive solo le celle della riga che contiene l'intruso
// (la ricerca passa da tutta la griglia a una riga, senza svelare la risposta). `hintAfter` = 0: nessuna seconda
// possibilità, il primo tocco decide (comportamento di prima).
// Il credito per l'adattamento è graduato: ipotesi di lavoro, NON valori validati (stessa scala di Griglie).
export const INTRUSO_HINT_AFTER_DEFAULT = 2, INTRUSO_HINT_AFTER_MAX = 5;
export const INTRUSO_CREDIT = { first: 1, afterErr: 0.7, hinted: 0.3 };

// Errori concessi dalla configurazione: intero 0–5; se manca (preset vecchi) vale il predefinito.
export function intrusoHintAfterOf(cfg){
  const v = cfg ? cfg.intrusoHintAfter : undefined;
  if(v == null || v === '' || !isFinite(+v)) return INTRUSO_HINT_AFTER_DEFAULT;
  return Math.max(0, Math.min(INTRUSO_HINT_AFTER_MAX, Math.round(+v)));
}
// Stato dei tocchi di UNA schermata.
export function intrusoTapNew(){ return { wrong: [], hinted: false, correct: false, rtFirst: null, rtEnd: null, decidedByFirst: false }; }
// Indici delle celle della riga che contiene l'intruso (la griglia ha `cols` colonne).
export function intrusoRowCells(trial, cols){
  const row = Math.floor(trial.oddIndex / cols), out = [];
  for(let k = row*cols; k < Math.min(trial.n, (row+1)*cols); k++) out.push(k);
  return out;
}
// La cella k si può toccare? No se già sbagliata; con l'aiuto attivo solo se è nella riga dell'intruso.
export function intrusoCellActive(trial, cols, tap, k){
  if(tap.wrong.indexOf(k) >= 0) return false;
  if(tap.hinted) return intrusoRowCells(trial, cols).indexOf(k) >= 0;
  return true;
}
// Un tocco. Cambia `tap` e dice se la schermata è finita (tocco giusto, oppure errore con hintAfter = 0).
export function intrusoTap(tap, trial, k, rtMs, hintAfter){
  const first = tap.rtFirst == null;
  if(first) tap.rtFirst = rtMs;
  if(k === trial.oddIndex){
    tap.rtEnd = rtMs; tap.decidedByFirst = first; tap.correct = true;
    return { done: true, correct: true };
  }
  tap.wrong.push(k);
  if(hintAfter <= 0){ tap.rtEnd = rtMs; tap.decidedByFirst = true; return { done: true, correct: false }; }
  if(tap.wrong.length >= hintAfter) tap.hinted = true;
  return { done: false, correct: false };
}
// Esito finale della schermata. `timedOut`: il tempo è scaduto senza tocco giusto.
// - nessun tocco allo scadere = omissione; tempo scaduto DOPO errori = errore (non omissione: il paziente ha cercato,
//   non era lento, quindi non deve far concedere più tempo);
// - `rt` vale solo se il primo tocco ha deciso (giusto o sbagliato, come prima): le risposte corrette dopo errori non
//   entrano nei tempi di riferimento né nella mediana del tempo, che misurano la ricerca senza aiuto.
export function intrusoTrialOutcome(tap, timedOut){
  const errs = tap.wrong.length;
  if(timedOut){
    if(errs === 0) return { correct: false, omitted: true, score: 0, rt: null, rtFirst: null, rtEnd: null, errs: 0, hinted: false };
    return { correct: false, omitted: false, score: 0, rt: null, rtFirst: tap.rtFirst, rtEnd: null, errs, hinted: !!tap.hinted };
  }
  const correct = !!tap.correct;
  const rt = tap.decidedByFirst ? tap.rtEnd : null;
  const score = !correct ? 0 : tap.hinted ? INTRUSO_CREDIT.hinted : errs > 0 ? INTRUSO_CREDIT.afterErr : INTRUSO_CREDIT.first;
  return { correct, omitted: false, score, rt, rtFirst: tap.rtFirst, rtEnd: tap.rtEnd, errs, hinted: !!tap.hinted };
}

// Adattamento: ogni INTRUSO_ADAPT_BLOCK prove, stessa soglia 70/85% degli altri esercizi, ma la manopola (contenuto
// o tempo) la sceglie decideStep (core/assi.js) dal tipo di errore e dal margine di tempo.
export function maybeAdaptIntruso(cfg, session){
  if(!cfg.adaptive || session.ipAdaptBlock.length < INTRUSO_ADAPT_BLOCK) return;
  const cur = { vals: session.ipAdaptBlock.slice(), rows: (session.choiceLog||[]).slice(-INTRUSO_ADAPT_BLOCK) };
  const fine = session.fineLevel!=null ? session.fineLevel : fineStartOf(cfg);
  const timeF = session.timeF!=null ? session.timeF : timeFStartOf(cfg);
  const sig = fine+'|'+timeF;
  const w = windowOf(session, 'ip', cur, sig); // 2 blocchi se nulla è cambiato dall'ultima decisione
  const recent = w.rows;
  const misses = recent.filter(r=>!r.correct);
  const rts = recent.filter(r=>r.correct && r.rt!=null).map(r=>r.rt).sort((a,b)=>a-b);
  const lims = recent.map(r=>r.limitMs).filter(x=>x>0);
  const medRtFrac = (rts.length && lims.length) ? rts[Math.floor(rts.length/2)] / (lims.reduce((a,b)=>a+b,0)/lims.length) : null;
  const acc = mean(w.vals);
  const d = decideStep({ acc, misses:misses.length, omitted:misses.filter(r=>r.omitted).length, nearMiss:null, medRtFrac },
                       { fine, timeF, successBlocks:session.successBlocks||0 }, { hasTime: !(cfg.intrusoLimitS>0), mode:'intruso' });
  session.fineLevel = fine + d.dFine;
  session.timeF = clampTimeF(timeF + d.dTime);
  if(acc > 0.85) session.successBlocks = (session.successBlocks||0) + 1;
  session.lastStep = d.why;
  windowKeep(session, 'ip', cur, sig, !!(d.dFine || d.dTime));
  session.ipAdaptBlock = [];
}
