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
