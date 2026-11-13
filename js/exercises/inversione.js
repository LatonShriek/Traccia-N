// Inversione e riordino (versione individuale): manipolazione di una sequenza in memoria di lavoro.
// PORTING dal generatore PdM CDCD (js/generators/inversione.js): i generatori di materiale qui sotto
// (non-parole pronunciabili, parole reali, numeri, alfanumerici, lunghezze, maiuscole/minuscole miste)
// sono copiati SENZA modifiche; cambia solo il modo di somministrare:
//  - il paziente vede la sequenza, quando è pronto la nasconde e la riscrive trasformata
//    (al contrario, in ordine…) con la TASTIERA A SCHERMO (niente voce: troppi errori di riconoscimento
//    e contesto rumoroso);
//  - la consegna è scritta a schermo (nel generatore la sceglie il clinico: SEQUENCE_RULES);
//  - la risposta è corretta in automatico: esatta, più il punteggio parziale per posizione.
// I caratteri colorati (rosso/verde) del generatore NON si mostrano: la loro consegna clinica non è
// confermata nel materiale originale e senza spiegazione confonderebbero il paziente.
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

// Le regole di trasformazione (stesse di SEQUENCE_RULES del generatore) con il testo della consegna.
// L'ordinamento ignora maiuscole/minuscole; le cifre vengono prima delle lettere.
const up = s => s.toUpperCase();
export const INVERSIONE_RULES = {
  ripeti:     { label:'Ripeti in avanti', kinds:['letters','digits','alnum'], apply:s=>s,
                text:'Riscrivi la sequenza nello stesso ordine.' },
  inverti:    { label:'Inverti', kinds:['letters','digits','alnum'], apply:s=>s.split('').reverse().join(''),
                text:'Riscrivi la sequenza AL CONTRARIO, dall\'ultimo carattere al primo.' },
  ordina:     { label:'Riordina', kinds:['letters','digits','alnum'], apply:s=>s.split('').sort((a,b)=>up(a)<up(b)?-1:up(a)>up(b)?1:0).join(''),
                text:{ letters:'Riscrivi le lettere IN ORDINE ALFABETICO.', digits:'Riscrivi le cifre dalla più piccola alla più grande.', alnum:'Riscrivi i caratteri in ordine: prima le cifre dalla più piccola alla più grande, poi le lettere in ordine alfabetico.' } },
  somma:      { label:'Somma le cifre', kinds:['digits'], apply:s=>String(s.split('').reduce((a,c)=>a+Number(c),0)),
                text:'Somma tutte le cifre e scrivi il risultato.' },
  parita:     { label:'Pari/dispari alternati', kinds:['digits'], apply:s=>{
                  const ev=s.split('').filter(c=>Number(c)%2===0), od=s.split('').filter(c=>Number(c)%2!==0);
                  const out=[]; let i=0;
                  while(ev.length||od.length){ if(i%2===0 && ev.length) out.push(ev.shift()); else if(od.length) out.push(od.shift()); i++; }
                  return out.join('')||'—'; },
                text:'Scrivi le cifre alternando una PARI e una DISPARI, cominciando da una pari e mantenendo l\'ordine in cui compaiono. Se un tipo finisce, scrivi di seguito quelle rimaste.' },
  vocali:     { label:'Solo vocali', kinds:['letters','alnum'], apply:s=>s.split('').filter(c=>'AEIOU'.includes(up(c))).join('')||'—',
                text:'Scrivi SOLO LE VOCALI, nell\'ordine in cui compaiono.' },
  consonanti: { label:'Solo consonanti', kinds:['letters','alnum'], apply:s=>s.split('').filter(c=>/[A-Z]/i.test(c) && !'AEIOU'.includes(up(c))).join('')||'—',
                text:'Scrivi SOLO LE CONSONANTI, nell\'ordine in cui compaiono.' },
  posdispari: { label:'Posizioni dispari', kinds:['letters','digits','alnum'], apply:s=>s.split('').filter((c,i)=>i%2===0).join('')||'—',
                text:'Scrivi SOLO i caratteri in 1ª, 3ª, 5ª posizione, nell\'ordine in cui compaiono.' },
  pospari:    { label:'Posizioni pari', kinds:['letters','digits','alnum'], apply:s=>s.split('').filter((c,i)=>i%2===1).join('')||'—',
                text:'Scrivi SOLO i caratteri in 2ª, 4ª, 6ª posizione, nell\'ordine in cui compaiono.' }
};
export const INVERSIONE_RULE_KEYS = Object.keys(INVERSIONE_RULES);
// Con «auto» la regola di ogni stimolo è una di queste due (il nome dell'esercizio): inversione o riordino.
export const INVERSIONE_AUTO_RULES = ['inverti', 'ordina'];
export function inversioneRuleText(ruleKey, kind){
  const t = INVERSIONE_RULES[ruleKey].text;
  return typeof t === 'string' ? t : t[kind];
}

export const INVERSIONE_ADAPT_BLOCK = 4;
const LEVEL_MAP = [1,4,8,11,15,18,22,25,29,32];
export function inversioneGenLevel(level){ return LEVEL_MAP[Math.max(1, Math.min(10, level|0)) - 1]; }
export function inversionePlanAt(level){
  const gen = inversioneGenLevel(level);
  const lens = inversioneLens(gen);
  return { gen, lens, lexical: gen<=INV_LEXICAL_UNTIL, alnum: gen>=INV_ALNUM_FROM, mixedCase: invMixedCaseProb(gen)>0,
           pronounce: Math.round(invPronounceProb(gen)*100) };
}

// Un solo stimolo (nel generatore ne nasce un blocco per volta): stessa scelta di materiale, lunghezze e anti-ripetizione.
// `used` = insieme di chiavi già proposte in sessione. `ruleKey` = 'auto' oppure una chiave di INVERSIONE_RULES.
export function genInversioneItem(level, ruleKey, used){
  const gen = inversioneGenLevel(level);
  const lexical = gen <= INV_LEXICAL_UNTIL;
  const pCase = invMixedCaseProb(gen);
  const lens = inversioneLens(gen);
  const alnum = gen >= INV_ALNUM_FROM;
  const specs = [];
  lens.forEach(len=>{ specs.push({kind:'letters', len}); specs.push({kind:'digits', len}); });
  if(alnum) lens.filter(l=>l>=4).forEach(len=> specs.push({kind:'alnum', len}));
  for(let attempt=0; attempt<200; attempt++){
    const spec = pick(specs);
    const rk = ruleKey==='auto' ? pick(INVERSIONE_AUTO_RULES) : ruleKey;
    const rule = INVERSIONE_RULES[rk];
    if(!rule.kinds.includes(spec.kind)) continue;
    let text;
    if(spec.kind==='letters'){
      if(lexical && REAL_WORDS[spec.len]){
        const words = REAL_WORDS[spec.len].filter(w=>!hasDuplicateChars(w) && !isTrivialOrder(w));
        text = pick(words.length>=20 ? words : REAL_WORDS[spec.len].filter(w=>!hasDuplicateChars(w)));
      } else {
        const t = nonwordFor(spec.len, gen);
        text = Math.random()<pCase ? randCase(t) : t;
      }
    } else if(spec.kind==='digits') text = randDigits(spec.len);
    else text = randAlnum(spec.len);
    if(isTrivialOrder(text)) continue;
    const key = spec.kind+':'+up(text);
    if(used && used.has(key) && attempt<150) continue;
    const expected = rule.apply(text);
    if(expected==='—' || expected.length===0) continue;
    if(used) used.add(key);
    return { text, kind:spec.kind, len:spec.len, rule:rk, instruction:inversioneRuleText(rk, spec.kind), expected: up(expected) };
  }
  // rete di sicurezza (non dovrebbe mai servire)
  const text = randLetters(4);
  return { text, kind:'letters', len:4, rule:'inverti', instruction:inversioneRuleText('inverti','letters'), expected: up(text).split('').reverse().join('') };
}

// Correzione: esatta (tutta la sequenza giusta) più punteggio parziale = quota di posizioni giuste.
export function scoreInversioneAnswer(item, typed, rtMs){
  const given = up((typed||'').trim());
  const exp = item.expected;
  if(!given) return { correct:false, omitted:true, partial:0, rt:rtMs };
  let hit = 0;
  for(let i=0;i<exp.length;i++) if(given[i]===exp[i]) hit++;
  const partial = hit / Math.max(exp.length, given.length);
  return { correct: given===exp, omitted:false, partial, rt:rtMs };
}
export function maybeAdaptInversione(cfg, session){
  if(!cfg.adaptive || session.invAdaptBlock.length < INVERSIONE_ADAPT_BLOCK) return;
  cfg.adaptStartLevel += adaptStep(mean(session.invAdaptBlock), cfg.adaptStartLevel, 1, 10);
  session.invAdaptBlock = [];
}
