// Regola di titolazione automatica, in un solo posto (passo 3c).
// NUOVO codice (non spostato): prima la stessa regola era scritta cinque volte
// in index.html (maybeAdapt, maybeAdaptDualChannel, maybeAdaptRunningSpan, fine
// tavola del Neglect, filtro RT di pushAdaptOutcome). I valori sono IDENTICI a
// quelli di prima: blocco di 8 prove, sale se > 0.85, scende se < 0.70, filtro RT
// = mediana × 1.6 con almeno 4 RT corretti già osservati. Vedi
// docs/titolazione-e-screening.md per le motivazioni cliniche.
export const ADAPT_BLOCK = 8;
export const ADAPT_UP = 0.85;
export const ADAPT_DOWN = 0.70;
export const ADAPT_RT_FACTOR = 1.6;
export const ADAPT_RT_MIN_HISTORY = 4;

// +1 sale, -1 scende, 0 resta. min/max sono i limiti (anche di fascia) del livello.
export function adaptStep(acc, level, min, max){
  if(acc > ADAPT_UP && level < max) return 1;
  if(acc < ADAPT_DOWN && level > min) return -1;
  return 0;
}

// Una risposta corretta ma molto più lenta del proprio ritmo non conta come successo pieno.
// rtHistory = RT corretti già osservati in questa seduta (prima di questa prova).
export function countedOutcome(correct, rtMs, rtHistory){
  if(correct && rtMs!=null && rtHistory.length >= ADAPT_RT_MIN_HISTORY){
    const sorted = rtHistory.slice().sort((a,b)=>a-b);
    const median = sorted[Math.floor(sorted.length/2)];
    if(rtMs > median*ADAPT_RT_FACTOR) return false;
  }
  return correct;
}

// ─── Livello fine + dispersione + tempo (14 nov 2026) ─────────────────────────
// Per gli esercizi a prove autonome (Intruso, Griglie, Inversione, Running span).
// - Il livello "vero" della seduta è un numero con la virgola (es. 6,5): ogni blocco
//   lo sposta di mezzo gradino invece di uno intero (scala di fatto doppia).
// - Ogni prova pesca il proprio livello intero attorno a quello vero: 60% uguale,
//   20% uno sotto, 20% uno sopra, poi la parte decimale decide fra i due interi
//   vicini. Così una seduta non sta tutta sullo stesso gradino e il pavimento/soffitto
//   si raggiunge solo se la persona è davvero oltre.
// - Il tempo entra nel conteggio del blocco: corretta ma più lenta di 1,6 volte la
//   propria mediana (per tipo di prova) vale come non riuscita (countedOutcome).
export const FINE_STEP = 0.5;
export const FINE_SPREAD = [0.2, 0.2]; // probabilità di -1 e di +1 (il resto: 0)

export function adaptStepFine(acc, fine, min, max){
  if(acc > ADAPT_UP && fine < max) return Math.min(FINE_STEP, max - fine);
  if(acc < ADAPT_DOWN && fine > min) return -Math.min(FINE_STEP, fine - min);
  return 0;
}

export function trialLevelFromFine(fine, min, max, rng){
  const r = rng || Math.random;
  const u = r();
  const off = u < FINE_SPREAD[0] ? -1 : (u > 1 - FINE_SPREAD[1] ? 1 : 0);
  const x = fine + off;
  const lo = Math.floor(x);
  const lv = lo + (r() < (x - lo) ? 1 : 0);
  return Math.max(min, Math.min(max, lv));
}

// store: oggetto di sessione { bucket: [rt…] }; bucket = tipo di prova confrontabile.
export function countedByBucket(store, bucket, correct, rtMs){
  const h = store[bucket] || (store[bucket] = []);
  const counted = countedOutcome(correct, rtMs, h);
  if(correct && rtMs!=null) h.push(rtMs);
  return counted;
}

// Livello fine di partenza: quello salvato se coerente col livello intero, altrimenti l'intero.
export function fineStartOf(cfg){
  const f = cfg.adaptFine;
  return (typeof f==='number' && isFinite(f) && Math.round(f) === cfg.adaptStartLevel) ? f : cfg.adaptStartLevel;
}
// N-back: il livello vive in nLevel (intero, arrotondato) e nLevelFine (con la virgola, solo se coerente con nLevel).
export function nFineStartOf(cfg){
  const f = cfg.nLevelFine;
  return (typeof f==='number' && isFinite(f) && Math.round(f) === cfg.nLevel) ? f : cfg.nLevel;
}
export function fineLabel(f){
  return Number.isInteger(f) ? String(f) : f.toFixed(1).replace('.', ',');
}

// ─── Efficienza accuratezza × velocità (15 nov 2026) ──────────────────────────
// Sostituisce, per Intruso/Griglie/Inversione, il filtro sì/no «più lenta di 1,6 × mediana».
// credito = punteggio (0–1) × fattore velocità. Fattore 1 fino a 1,3 × la propria mediana (per tipo di prova),
// poi scende in linea retta fino a 0 a 2,1 × (a 1,6 × vale ≈ 0,63). Servono 4 RT già osservati dello stesso tipo.
// Con prove tutte esatte e tempi nella norma la media del blocco resta ≈ 0,95, quindi la soglia di salita (0,85) è raggiungibile.
export const EFF_FREE = 1.3;
export const EFF_ZERO = 2.1;
export const EFF_FULL_SCORE = 0.7; // sotto questo punteggio la risposta non entra nella storia dei tempi di riferimento
export function speedFactor(rtMs, history){
  if(rtMs==null || history.length < ADAPT_RT_MIN_HISTORY) return 1;
  const sorted = history.slice().sort((a,b)=>a-b);
  const median = sorted[Math.floor(sorted.length/2)];
  const ratio = rtMs / median;
  if(ratio <= EFF_FREE) return 1;
  if(ratio >= EFF_ZERO) return 0;
  return (EFF_ZERO - ratio) / (EFF_ZERO - EFF_FREE);
}
export function creditByBucket(store, bucket, score, rtMs){
  const h = store[bucket] || (store[bucket] = []);
  const credit = score * speedFactor(rtMs, h);
  if(score >= EFF_FULL_SCORE && rtMs!=null) h.push(rtMs);
  return credit;
}

// Punteggio graduato di una risposta numerica (conteggi): esatto 1, ±1 quasi giusto 0,7, ±2 0,3, oltre 0.
export function numericCloseness(given, expected){
  const d = Math.abs(Number(given) - Number(expected));
  if(!isFinite(d)) return 0;
  return d === 0 ? 1 : d === 1 ? 0.7 : d === 2 ? 0.3 : 0;
}
