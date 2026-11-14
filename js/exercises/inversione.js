// Inversione e riordino (versione individuale): manipolazione di una sequenza in memoria di lavoro.
// PORTING dal generatore PdM CDCD (js/generators/inversione.js): i generatori di materiale qui sotto
// (non-parole pronunciabili, parole reali, numeri, alfanumerici, lunghezze, maiuscole/minuscole miste)
// sono copiati SENZA modifiche; cambia solo il modo di somministrare:
//  - il paziente vede la sequenza, quando è pronto la nasconde e la riscrive trasformata
//    (al contrario, in ordine…) con la TASTIERA A SCHERMO (niente voce: troppi errori di riconoscimento
//    e contesto rumoroso);
//  - la sequenza resta a schermo per un TEMPO FISSO, decrescente col livello, poi sparisce da sola;
//  - la consegna è scritta a schermo e ROTA fra molti criteri (inverti, ordina, vocali/consonanti, posizione,
//    pari/dispari, colore, grandezza, maiuscole/minuscole) e, dai livelli alti, DOPPI (due criteri insieme).
//    Colore, grandezza del carattere e numeri a più cifre sono NUOVI rispetto al generatore;
//  - la risposta è corretta in automatico: esatta, più il punteggio parziale per posizione.
// Il generatore ha 32 livelli, Traccia-N 10: livello 1-10 = livelli 1, 4, 8, 11, 15, 18, 22, 25, 29, 32.
import { adaptStep } from '../core/adapt.js';
import { mean } from '../core/stats.js';
import { REAL_WORDS, INV_REAL_BLOCK } from './inversione-data.js';

// --- aiuti globali del generatore (stessi di js/util.js e data/base.js) ---
const ALPHABET = "ABCDEFGHILMNOPQRSTUVZ".split("");
function rnd(n){return Math.floor(Math.random()*n);}
function pick(arr){return arr[rnd(arr.length)];}
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function randCase(str){
  return str.split("").map(c=>Math.random()<0.5?c.toUpperCase():c.toLowerCase()).join("");
}
function hasDuplicateChars(s){
  const seen = new Set();
  for(const ch of s.toUpperCase()){
    if(seen.has(ch)) return true;
    seen.add(ch);
  }
  return false;
}
function randDigits(len){
  const digits = shuffle([0,1,2,3,4,5,6,7,8,9]);
  if(digits[0]===0){
    const swapIdx = 1 + rnd(digits.length-1);
    [digits[0], digits[swapIdx]] = [digits[swapIdx], digits[0]];
  }
  return digits.slice(0, len).join("");
}
function randLetters(len,pool=ALPHABET){
  return shuffle(pool).slice(0, len).join("");
}
function randAlnum(len){
  const DIGIT_CHARS = ["0","1","2","3","4","5","6","7","8","9"];
  if(len<4){
    const mixedPool = shuffle([...ALPHABET, ...DIGIT_CHARS]);
    return randCase(mixedPool.slice(0, len).join(""));
  }
  const minEach = 2;
  const extra = len - 2*minEach;
  const nLetters = minEach + (extra>0 && Math.random()<0.5 ? extra : 0);
  const nDigits = len - nLetters;
  const letters = shuffle(ALPHABET).slice(0, nLetters);
  const digits = shuffle(DIGIT_CHARS).slice(0, nDigits);
  return randCase(shuffle([...letters, ...digits]).join(""));
}
function isTrivialOrder(str){
  const u = str.toUpperCase();
  const asc = u.split("").sort().join("");
  return u===asc || u===asc.split("").reverse().join("");
}

// ====== da qui: codice del generatore, invariato ======
const IT_ONSETS_SIMPLE = ["B","C","D","F","G","L","M","N","P","R","S","T","V","Z"];
const IT_ONSETS_CLUSTER = ["BR","CR","DR","FR","GR","PR","TR","VR","BL","CL","FL","GL","PL","ST","SP","SC","GN"];
const IT_VOWELS = ["A","E","I","O","U"];
function _cv(){ return pick(IT_ONSETS_SIMPLE) + pick(IT_VOWELS); }
function _ccv(){ return pick(IT_ONSETS_CLUSTER) + pick(IT_VOWELS); }
function pronounceableNonword(len){
  const patterns = {
    3: [()=>_ccv(), ()=>_ccv(), ()=>pick(IT_VOWELS)+_cv(), ()=>_cv()+pick(["L","M","N","R","S","T"])],
    4: [()=>_cv()+_cv(), ()=>_cv()+_cv(), ()=>pick(IT_VOWELS)+_ccv()],
    5: [()=>_cv()+_ccv(), ()=>_ccv()+_cv(), ()=>pick(IT_VOWELS)+_cv()+_cv()]
  };
  const list = patterns[len];
  if(!list){ let t = ""; while(t.length < len) t += _cv(); return t.slice(0, len); }
  return pick(list)();
}
function nonwordFor(len, level){
  const isReal = w => INV_REAL_BLOCK.has(w.toUpperCase());
  const pronounceProb = invPronounceProb(level);
  if(Math.random()<pronounceProb){
    for(let tries=0; tries<80; tries++){
      const w = pronounceableNonword(len);
      if(!hasDuplicateChars(w) && !isReal(w)) return w;
    }
  }
  for(let tries=0; tries<40; tries++){
    const w = randLetters(len);
    if(!isReal(w)) return w;
  }
  return randLetters(len);
}
function inversioneLens(level){
  if(level<=3) return [3];
  if(level<=14) return [3,4];
  if(level<=22) return [3,4,5];
  if(level<=28) return [4,5];
  return [4,5,6];
}
const INV_ALNUM_FROM = 11, INV_LEXICAL_UNTIL = 8;
function invPronounceProb(level){ return level<=9 ? 1 : Math.max(0.2, 1 - 0.8*(level-9)/23); }
function invMixedCaseProb(level){ return level<=14 ? 0 : Math.min(1, (level-14)/12); }
// ====== fine del codice del generatore ======

// ---- Consegne ----------------------------------------------------------------------------------
// Un «token» è un carattere (lettera o cifra) oppure, nei numeri a più cifre, un gruppo di cifre.
// Attributi: color null|'red'|'green', size null|'big'|'small'. Il caso (maiuscolo/minuscolo) è nel carattere.
const up = s => s.toUpperCase();
const isDigitTok = t => /^\d+$/.test(t.ch);
const isLetterTok = t => /^[A-Za-z]$/.test(t.ch);
const isVowelTok = t => isLetterTok(t) && 'AEIOU'.includes(up(t.ch));
const isConsTok = t => isLetterTok(t) && !isVowelTok(t);
function cmpTok(a, b){
  if(isDigitTok(a) && isDigitTok(b)) return Number(a.ch) - Number(b.ch);
  const x = up(a.ch), y = up(b.ch);
  return x < y ? -1 : x > y ? 1 : 0;
}
const NOUN = { letters:'le lettere', digits:'le cifre', numbers:'i numeri', alnum:'i caratteri' };
const FEM = { letters:true, digits:true, numbers:false, alnum:false };
const VALUE_LABEL = {
  color:{ red:['ROSSI','ROSSE'], green:['VERDI','VERDI'] }, size:{ big:['GRANDI','GRANDI'], small:['PICCOLI','PICCOLE'] },
  case:{ upper:['MAIUSCOLE','MAIUSCOLE'], lower:['MINUSCOLE','MINUSCOLE'] }, type:{ digit:'le CIFRE', letter:'le LETTERE' }
};
const valueOf = {
  color: t => t.color, size: t => t.size,
  case: t => isLetterTok(t) ? (t.ch === t.ch.toUpperCase() ? 'upper' : 'lower') : null,
  type: t => isDigitTok(t) ? 'digit' : 'letter'
};
// Ordinamenti (T): come si scrivono i token di un gruppo.
function applyT(tokens, T){
  const a = [...tokens];
  if(T==='asc') return a.sort(cmpTok);
  if(T==='desc') return a.sort(cmpTok).reverse();
  if(T==='rev') return a.reverse();
  return a; // 'asis': nell'ordine in cui compaiono
}
function tText(T, kind){
  if(T==='rev') return 'al contrario';
  if(T==='asis') return 'nell\'ordine in cui compaiono';
  if(T==='asc') return kind==='letters' ? 'in ordine alfabetico' : kind==='alnum' ? 'in ordine (prima le cifre dalla più piccola alla più grande, poi le lettere in ordine alfabetico)' : 'dal più piccolo al più grande';
  return kind==='letters' ? 'in ordine alfabetico inverso (da Z ad A)' : kind==='alnum' ? 'in ordine inverso (prima le lettere da Z ad A, poi le cifre dalla più grande alla più piccola)' : 'dal più grande al più piccolo';
}

// Consegne SINGOLE (un criterio). minLevel = primo livello Traccia-N in cui compaiono.
export const INVERSIONE_SINGLE = {
  inverti:    { label:'Inverti (al contrario)', minLevel:1, kinds:['letters','digits','alnum','numbers'], attr:null,
                run:(tk)=>applyT(tk,'rev'), text:()=>'Riscrivi TUTTO AL CONTRARIO, dall\'ultimo al primo.' },
  ordina:     { label:'Riordina (alfabetico / crescente)', minLevel:1, kinds:['letters','digits','alnum','numbers'], attr:null,
                run:(tk)=>applyT(tk,'asc'), text:(k)=>'Riscrivi '+NOUN[k]+' '+tText('asc',k)+'.' },
  decrescente:{ label:'Dal più grande (Z–A)', minLevel:3, kinds:['letters','digits','alnum','numbers'], attr:null,
                run:(tk)=>applyT(tk,'desc'), text:(k)=>'Riscrivi '+NOUN[k]+' '+tText('desc',k)+'.' },
  vocali:     { label:'Solo vocali', minLevel:2, kinds:['letters','alnum'], attr:null,
                run:(tk)=>tk.filter(isVowelTok), text:()=>'Scrivi SOLO LE VOCALI, nell\'ordine in cui compaiono.' },
  consonanti: { label:'Solo consonanti', minLevel:2, kinds:['letters','alnum'], attr:null,
                run:(tk)=>tk.filter(isConsTok), text:()=>'Scrivi SOLO LE CONSONANTI, nell\'ordine in cui compaiono.' },
  posdispari: { label:'Posizioni dispari (1ª, 3ª…)', minLevel:3, kinds:['letters','digits','alnum','numbers'], attr:null,
                run:(tk)=>tk.filter((t,i)=>i%2===0), text:()=>'Scrivi SOLO quelli in 1ª, 3ª, 5ª posizione, nell\'ordine in cui compaiono.' },
  pospari:    { label:'Posizioni pari (2ª, 4ª…)', minLevel:3, kinds:['letters','digits','alnum','numbers'], attr:null,
                run:(tk)=>tk.filter((t,i)=>i%2===1), text:()=>'Scrivi SOLO quelli in 2ª, 4ª, 6ª posizione, nell\'ordine in cui compaiono.' },
  pari:       { label:'Solo pari', minLevel:3, kinds:['digits','numbers'], attr:null,
                run:(tk)=>tk.filter(t=>Number(t.ch)%2===0), text:(k)=>'Scrivi SOLO '+NOUN[k]+' PARI, nell\'ordine in cui compaiono.' },
  dispari:    { label:'Solo dispari', minLevel:3, kinds:['digits','numbers'], attr:null,
                run:(tk)=>tk.filter(t=>Number(t.ch)%2!==0), text:(k)=>'Scrivi SOLO '+NOUN[k]+' DISPARI, nell\'ordine in cui compaiono.' },
  rossi:      { label:'Solo rossi', minLevel:4, kinds:['letters','digits','alnum','numbers'], attr:'color',
                run:(tk)=>tk.filter(t=>t.color==='red'), text:()=>'Scrivi SOLO quelli ROSSI, nell\'ordine in cui compaiono.' },
  verdi:      { label:'Solo verdi', minLevel:4, kinds:['letters','digits','alnum','numbers'], attr:'color',
                run:(tk)=>tk.filter(t=>t.color==='green'), text:()=>'Scrivi SOLO quelli VERDI, nell\'ordine in cui compaiono.' },
  maiuscole:  { label:'Solo MAIUSCOLE', minLevel:5, kinds:['letters','alnum'], attr:'case',
                run:(tk)=>tk.filter(t=>valueOf.case(t)==='upper'), text:()=>'Scrivi SOLO le lettere MAIUSCOLE, nell\'ordine in cui compaiono.' },
  minuscole:  { label:'Solo minuscole', minLevel:5, kinds:['letters','alnum'], attr:'case',
                run:(tk)=>tk.filter(t=>valueOf.case(t)==='lower'), text:()=>'Scrivi SOLO le lettere minuscole, nell\'ordine in cui compaiono.' },
  grandi:     { label:'Solo grandi', minLevel:5, kinds:['letters','digits','alnum','numbers'], attr:'size',
                run:(tk)=>tk.filter(t=>t.size==='big'), text:()=>'Scrivi SOLO quelli scritti in GRANDE, nell\'ordine in cui compaiono.' },
  piccoli:    { label:'Solo piccoli', minLevel:5, kinds:['letters','digits','alnum','numbers'], attr:'size',
                run:(tk)=>tk.filter(t=>t.size==='small'), text:()=>'Scrivi SOLO quelli scritti in PICCOLO, nell\'ordine in cui compaiono.' }
};
export const INVERSIONE_SINGLE_KEYS = Object.keys(INVERSIONE_SINGLE);
// Consegne DOPPIE (due criteri insieme): da un criterio di riconoscimento (colore, grandezza, maiuscolo/minuscolo,
// cifra/lettera) più un ordine. Dal livello 6, con probabilità crescente.
const DOUBLE_CRITERIA = [
  { C:'color', minLevel:6, kinds:['letters','digits','alnum','numbers'], values:['red','green'] },
  { C:'size',  minLevel:6, kinds:['letters','digits','alnum','numbers'], values:['big','small'] },
  { C:'case',  minLevel:7, kinds:['letters'], values:['upper','lower'] },
  { C:'type',  minLevel:7, kinds:['alnum'], values:['digit','letter'] }
];
export const INVERSIONE_DOUBLE_P = [0,0,0,0,0,0.2,0.35,0.5,0.65,0.8];
const DOUBLE_ORDERS_FILTER = ['asc','desc','rev'];
const DOUBLE_ORDERS_GROUP = ['asis','asc'];
function valueText(C, v, kind){
  if(C==='type') return VALUE_LABEL.type[v];
  const noun = NOUN[C==='case' ? 'letters' : kind], fem = (C==='case' || FEM[kind]);
  if(C==='size') return noun+' scritt'+(fem?'e':'i')+' in '+(v==='big'?'GRANDE':'PICCOLO');
  return noun+' '+VALUE_LABEL[C][v][fem ? 1 : 0];
}
// Costruisce una consegna doppia e restituisce {key, text, run, attr} oppure null.
function makeDouble(level, kind){
  const crit = DOUBLE_CRITERIA.filter(d=>level>=d.minLevel && d.kinds.includes(kind));
  if(!crit.length) return null;
  const d = pick(crit);
  const v = pick(d.values), other = d.values.find(x=>x!==v);
  if(Math.random()<0.5){
    const T = pick(DOUBLE_ORDERS_FILTER);
    const kT = d.C==='type' ? (v==='digit' ? 'digits' : 'letters') : kind;
    return { key:'dbl-filtro:'+d.C, attr:d.C, C:d.C, mode:'filtro',
      run:(tk)=>applyT(tk.filter(t=>valueOf[d.C](t)===v), T),
      text:'Scrivi SOLO '+valueText(d.C, v, kind)+', '+tText(T, kT)+'.' };
  }
  const T = pick(DOUBLE_ORDERS_GROUP);
  return { key:'dbl-gruppi:'+d.C, attr:d.C, C:d.C, mode:'gruppi',
    run:(tk)=>[...applyT(tk.filter(t=>valueOf[d.C](t)===v), T), ...applyT(tk.filter(t=>valueOf[d.C](t)===other), T)],
    text:'Scrivi PRIMA '+valueText(d.C, v, kind)+' e POI '+valueText(d.C, other, kind)+', ciascun gruppo '+(d.C==='type' && T==='asc' ? 'in ordine (cifre dalla più piccola alla più grande, lettere in ordine alfabetico)' : tText(T, kind))+'.' };
}

// ---- Livelli e tempi -----------------------------------------------------------------------------
export const INVERSIONE_ADAPT_BLOCK = 4;
const LEVEL_MAP = [1,4,8,11,15,18,22,25,29,32];
export function inversioneGenLevel(level){ return LEVEL_MAP[Math.max(1, Math.min(10, level|0)) - 1]; }
// Tempo di visione FISSO per carattere (ms), decrescente col livello; minimo 1,5 s in tutto.
// PROPOSTA da validare (non ricavata dal generatore).
export const INVERSIONE_MS_PER_CHAR = [1800,1650,1500,1350,1200,1050,950,850,750,650];
export function inversioneExposureMs(level, nChars){
  return Math.max(1500, Math.round(nChars * INVERSIONE_MS_PER_CHAR[Math.max(1, Math.min(10, level|0)) - 1]));
}
export function inversionePlanAt(level){
  const gen = inversioneGenLevel(level);
  const lv = Math.max(1, Math.min(10, level|0));
  return { gen, lens: inversioneLens(gen), lexical: gen<=INV_LEXICAL_UNTIL, alnum: gen>=INV_ALNUM_FROM, mixedCase: invMixedCaseProb(gen)>0,
           pronounce: Math.round(invPronounceProb(gen)*100), numbers: lv>=4, singles: INVERSIONE_SINGLE_KEYS.filter(k=>INVERSIONE_SINGLE[k].minLevel<=lv),
           pDouble: INVERSIONE_DOUBLE_P[lv-1], msPerChar: INVERSIONE_MS_PER_CHAR[lv-1] };
}

// ---- Un solo stimolo -----------------------------------------------------------------------------
function makeNumbers(lv){
  const nTok = lv>=8 ? 4 + rnd(2) : 3 + rnd(2);
  const digits = lv>=8 ? 2 + rnd(2) : 2; // cifre per numero
  const set = new Set();
  while(set.size < nTok){
    const lo = digits===2 ? 10 : 100, hi = digits===2 ? 99 : 999;
    set.add(String(lo + rnd(hi-lo+1)));
  }
  return [...set].map(ch=>({ch, color:null, size:null}));
}
function makeTokens(kind, len, gen, lv, pCase){
  if(kind==='numbers') return makeNumbers(lv);
  let text;
  if(kind==='letters'){
    if(gen <= INV_LEXICAL_UNTIL && REAL_WORDS[len]){
      const words = REAL_WORDS[len].filter(w=>!hasDuplicateChars(w) && !isTrivialOrder(w));
      text = pick(words.length>=20 ? words : REAL_WORDS[len].filter(w=>!hasDuplicateChars(w)));
    } else { const t = nonwordFor(len, gen); text = Math.random()<pCase ? randCase(t) : t; }
  } else if(kind==='digits') text = randDigits(len);
  else text = randAlnum(len);
  return text.split('').map(ch=>({ch, color:null, size:null}));
}
// Assegna l'attributo che la consegna richiede in modo che il filtro non sia mai vuoto né totale.
// Con consegne «a gruppi» e «doppie» tutti i token hanno un valore.
function assignAttr(tokens, attr, full){
  const n = tokens.length;
  if(attr==='color' || attr==='size'){
    const vals = attr==='color' ? ['red','green'] : ['big','small'];
    for(let tries=0; tries<50; tries++){
      tokens.forEach(t=>{ t[attr] = (full || Math.random()<0.6) ? pick(vals) : null; });
      const c0 = tokens.filter(t=>t[attr]===vals[0]).length, c1 = tokens.filter(t=>t[attr]===vals[1]).length;
      if(c0>=1 && (full ? c1>=1 : c0<n)) return true;
    }
    return false;
  }
  return true; // 'case' e 'type' sono già nel materiale: si controlla dopo
}
// Quante consegne (1-3) si chiedono sullo STESSO stimolo, per livello Traccia-N (1-10).
// IPOTESI da validare: carico di manipolazione crescente (più operazioni in memoria di lavoro sullo stesso
// materiale); ai livelli bassi una sola consegna, ai più alti spesso tre.
export const INVERSIONE_NCONS_P = [
  [1,0,0],[1,0,0],[.7,.3,0],[.6,.4,0],[.4,.5,.1],[.3,.5,.2],[.2,.5,.3],[.2,.4,.4],[.1,.4,.5],[.1,.3,.6]
];
function pickNCons(lv, fixed){
  if(fixed===1 || fixed===2 || fixed===3) return fixed;
  const p = INVERSIONE_NCONS_P[Math.max(1, Math.min(10, lv|0)) - 1]; const r = Math.random();
  return r < p[0] ? 1 : r < p[0]+p[1] ? 2 : 3;
}
// Normalizza la richiesta di consegne: ruleKey legacy ('auto' | 'doppie' | chiave) oppure elenco scelto a mano
// (opts.pool: chiavi di INVERSIONE_SINGLE e/o 'doppie'; vuoto/assente = automatico secondo il livello).
function poolFromArgs(ruleKey, opts){
  if(opts && Array.isArray(opts.pool) && opts.pool.length) return opts.pool.filter(k=>k==='doppie' || INVERSIONE_SINGLE[k]);
  if(ruleKey==='doppie') return ['doppie'];
  if(ruleKey && ruleKey!=='auto' && INVERSIONE_SINGLE[ruleKey]) return [ruleKey];
  return null;
}
function chooseRule(lv, kind, pool, takenKeys, lastRule){
  const manual = !!pool;
  const singles = (manual ? pool.filter(k=>k!=='doppie') : INVERSIONE_SINGLE_KEYS.filter(k=>INVERSIONE_SINGLE[k].minLevel<=lv))
    .filter(k=>INVERSIONE_SINGLE[k].kinds.includes(kind) && !takenKeys.has(k));
  const canDouble = manual ? pool.includes('doppie') : Math.random() < INVERSIONE_DOUBLE_P[lv-1];
  if(canDouble && (!manual || !singles.length || Math.random()<0.4)){
    const d = makeDouble(manual ? 10 : Math.max(lv, 6), kind);
    if(d && !takenKeys.has(d.key)) return d;
  }
  if(!singles.length) return null;
  const free = singles.length>1 && lastRule ? singles.filter(k=>k!==lastRule) : singles;
  const rk = pick(free.length ? free : singles), sr = INVERSIONE_SINGLE[rk];
  return { key:rk, attr:sr.attr, run:sr.run, text:sr.text(kind), mode:'singola' };
}
export function genInversioneItem(level, ruleKey, used, opts){
  opts = opts || {};
  const lv = Math.max(1, Math.min(10, level|0));
  const gen = inversioneGenLevel(lv);
  const pCase = invMixedCaseProb(gen);
  const lens = inversioneLens(gen);
  const pool = poolFromArgs(ruleKey, opts);
  for(let attempt=0; attempt<400; attempt++){
    // 1) tipo di materiale: lettere/parole, cifre, alfanumerico (dal 11 del generatore) e numeri a più cifre (livello 4+)
    const specs = [];
    lens.forEach(len=>{ specs.push({kind:'letters', len}); specs.push({kind:'digits', len}); });
    if(gen>=INV_ALNUM_FROM) lens.filter(l=>l>=4).forEach(len=> specs.push({kind:'alnum', len}));
    if(lv>=4 || pool) specs.push({kind:'numbers', len:0}, {kind:'numbers', len:0});
    const spec = pick(specs);
    // 2) da 1 a 3 consegne DIVERSE sullo stesso stimolo
    const want = pickNCons(lv, opts.nCons);
    const rules = [], taken = new Set();
    for(let i=0;i<want;i++){
      const r = chooseRule(lv, spec.kind, pool, taken, i===0 && used ? used.lastRule : null);
      if(!r) break;
      rules.push(r); taken.add(r.key);
    }
    if(!rules.length) continue;
    // 3) stimolo + attributi (colore/grandezza servono solo se una consegna li usa)
    const tokens = makeTokens(spec.kind, spec.len, gen, lv, pCase);
    if(spec.kind!=='numbers' && isTrivialOrder(tokens.map(t=>t.ch).join(''))) continue;
    let okAttr = true;
    ['color','size'].forEach(at=>{
      const need = rules.filter(r=>r.attr===at);
      if(need.length){ if(!assignAttr(tokens, at, need.some(r=>r.mode!=='singola'))) okAttr = false; }
    });
    if(!okAttr) continue;
    if(!rules.some(r=>r.attr==='color') && lv>=8 && Math.random()<0.5){ // colori irrilevanti: distrattori ai livelli alti
      tokens.forEach(t=>{ t.color = Math.random()<0.3 ? 'red' : null; });
    }
    if(rules.some(r=>r.attr==='case') && !(tokens.some(t=>valueOf.case(t)==='upper') && tokens.some(t=>valueOf.case(t)==='lower'))) continue;
    if(rules.some(r=>r.attr==='type') && !(tokens.some(isDigitTok) && tokens.some(isLetterTok))) continue;
    // 4) risposte attese: mai vuote, mai tutte identiche fra loro, i filtri devono davvero scegliere
    const multi = tokens.some(t=>t.ch.length>1);
    let ok = true; const consegne = [];
    for(const rule of rules){
      const out = rule.run(tokens);
      if(!out.length){ ok = false; break; }
      if(!['inverti','ordina','decrescente'].includes(rule.key) && rule.mode!=='gruppi' && out.length>=tokens.length){ ok = false; break; }
      const expectedTokens = out.map(t=>up(t.ch));
      const expected = expectedTokens.join(multi ? ' ' : '');
      if(consegne.some(c=>c.expected===expected)){ ok = false; break; }
      consegne.push({ rule:rule.key, double: rule.mode!=='singola', instruction:rule.text, expectedTokens, expected });
    }
    if(!ok) continue;
    const text = tokens.map(t=>t.ch).join(spec.kind==='numbers' ? ' ' : '');
    const key = spec.kind+':'+up(text);
    if(used && used.has(key) && attempt<200) continue;
    if(used){ used.add(key); used.lastRule = consegne[consegne.length-1].rule; }
    const nChars = tokens.reduce((a,t)=>a+t.ch.length, 0);
    const c0 = consegne[0];
    return { tokens, text, kind:spec.kind, len:tokens.length, rule:c0.rule, double:c0.double, instruction:c0.instruction,
             multi, expectedTokens:c0.expectedTokens, expected:c0.expected, consegne,
             exposureMs: inversioneExposureMs(lv, nChars) };
  }
  // rete di sicurezza (non dovrebbe mai servire)
  const tokens = randLetters(4).split('').map(ch=>({ch, color:null, size:null}));
  const expectedTokens = tokens.map(t=>t.ch).reverse();
  const c = { rule:'inverti', double:false, instruction:INVERSIONE_SINGLE.inverti.text('letters'), expectedTokens, expected:expectedTokens.join('') };
  return { tokens, text:tokens.map(t=>t.ch).join(''), kind:'letters', len:4, rule:c.rule, double:false, instruction:c.instruction,
           multi:false, expectedTokens, expected:c.expected, consegne:[c], exposureMs: inversioneExposureMs(lv, 4) };
}

// Correzione: esatta (tutti i token giusti, nell'ordine) più punteggio parziale = quota di posizioni giuste.
export function scoreInversioneAnswer(item, typed, rtMs){
  const raw = up((typed||'').trim());
  if(!raw) return { correct:false, omitted:true, partial:0, rt:rtMs };
  const given = item.multi ? raw.split(/\s+/).filter(Boolean) : raw.replace(/\s+/g,'').split('');
  const exp = item.expectedTokens;
  let hit = 0;
  for(let i=0;i<exp.length;i++) if(given[i]===exp[i]) hit++;
  const partial = hit / Math.max(exp.length, given.length);
  return { correct: given.length===exp.length && hit===exp.length, omitted:false, partial, rt:rtMs };
}
export function maybeAdaptInversione(cfg, session){
  if(!cfg.adaptive || session.invAdaptBlock.length < INVERSIONE_ADAPT_BLOCK) return;
  cfg.adaptStartLevel += adaptStep(mean(session.invAdaptBlock), cfg.adaptStartLevel, 1, 10);
  session.invAdaptBlock = [];
}
