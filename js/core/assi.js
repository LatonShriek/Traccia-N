// Motore ibrido PdM generator ↔ Traccia-N (15 nov 2026, ipotesi 1-4 concordate con Rodrigo).
// Funzioni pure, senza schermo.
//
// IPOTESI 1 — asse unico fine sulla scala del generatore (1-32).
//   Il livello «vero» della seduta resta un numero 1-10 con la virgola (così i salvataggi e le schede non cambiano),
//   ma ogni prova pesca un livello INTERO DEL GENERATORE (1-32) attorno a quello vero, passando per l'interpolazione
//   fra i livelli 1,4,8,11,15,18,22,25,29,32. Prima ogni prova era un gradino di 3-4 livelli del generatore sopra o sotto.
// IPOTESI 2 — transizioni sfumate.
//   Non serve una regola a parte: poiché la prova pesca un livello del generatore anche ±1/±2 dal centro, vicino ai
//   confini (lunghezza dell'elemento 1→2 al gen. 9, 2→3 al gen. 21; alfanumerico al gen. 11…) la seduta MESCOLA i due
//   lati, invece di cambiare tutto di colpo. Verificato in tests/assi.test.js.
// IPOTESI 3 — due assi: contenuto e tempo.
//   `timeF` (fattore tempo, 0,7–1,3) moltiplica il tempo concesso (Intruso: tempo per schermata; Inversione: tempo di
//   visione). Si muove con le regole di decideStep, separatamente dal livello di contenuto.
// IPOTESI 4 — la manopola si sceglie dal tipo di errore.
//   Blocco fallito: se i mancati sono soprattutto tempo scaduto (Intruso) o risposte «quasi giuste» (Inversione) si
//   concede più tempo prima di abbassare il contenuto; altrimenti si abbassa il contenuto. Blocco riuscito: se c'è
//   margine di tempo si stringe il tempo, altrimenti sale il contenuto.
import { ADAPT_UP, ADAPT_DOWN, adaptStepFine } from './adapt.js';

export const GEN_OF_LEVEL = [1, 4, 8, 11, 15, 18, 22, 25, 29, 32];
export const MAX_GEN = 32;

// livello fine 1-10 → livello (con virgola) del generatore, per interpolazione lineare fra i livelli di Traccia-N
export function genOfFine(f){
  const x = Math.max(1, Math.min(10, f)), i = Math.min(8, Math.floor(x) - 1), t = x - (i + 1);
  return GEN_OF_LEVEL[i] + t * (GEN_OF_LEVEL[i + 1] - GEN_OF_LEVEL[i]);
}
// inverso: livello del generatore → livello fine 1-10
export function fineOfGen(g){
  const x = Math.max(1, Math.min(MAX_GEN, g));
  let i = 0; while(i < 8 && x > GEN_OF_LEVEL[i + 1]) i++;
  return (i + 1) + (x - GEN_OF_LEVEL[i]) / (GEN_OF_LEVEL[i + 1] - GEN_OF_LEVEL[i]);
}
export function lvOfGen(g){ return Math.max(1, Math.min(10, Math.round(fineOfGen(g)))); }

// dispersione per prova, in unità del generatore: 50% al centro, 20% ±1, 5% ±2
export const GEN_SPREAD = [[-2, 0.05], [-1, 0.20], [0, 0.50], [1, 0.20], [2, 0.05]];
export function trialGenFromFine(fine, rng){
  const r = rng || Math.random;
  let u = r(), off = 0;
  for(const [o, p] of GEN_SPREAD){ if(u < p){ off = o; break; } u -= p; }
  const x = genOfFine(fine) + off, lo = Math.floor(x);
  const g = lo + (r() < (x - lo) ? 1 : 0);
  return Math.max(1, Math.min(MAX_GEN, g));
}

// valore di una tabella indicizzata per livello 1-10 (array o oggetto) alla posizione fine del livello del generatore g
export function interpByGen(table, g){
  const f = fineOfGen(g), i = Math.min(8, Math.floor(f) - 1), t = f - (i + 1);
  const at = k => Array.isArray(table) ? table[k - 1] : table[k];
  return at(i + 1) + t * (at(i + 2) - at(i + 1));
}

// ─── tempo ────────────────────────────────────────────────────────────────────
export const TF_MIN = 0.7, TF_MAX = 1.3, TF_STEP = 0.1, SLACK_FRAC = 0.5;
export function clampTimeF(x){ return Math.max(TF_MIN, Math.min(TF_MAX, Math.round(x * 100) / 100)); }
export function timeFStartOf(cfg){ const f = cfg.adaptTimeF; return (typeof f === 'number' && isFinite(f)) ? clampTimeF(f) : 1; }
export function timeFLabel(f){ return '×' + f.toFixed(1).replace('.', ','); }

// ─── regola di blocco ─────────────────────────────────────────────────────────
// blk: { acc (credito medio 0-1), misses (quante non riuscite), omitted (quante a tempo scaduto/vuote),
//        nearMiss (media del punteggio parziale delle non riuscite, 0-1, o null),
//        medRtFrac (mediana dei tempi dei giusti ÷ tempo concesso, o null) }
// st:  { fine, timeF, successBlocks }
// opts:{ hasTime (il tempo si può muovere), mode: 'intruso' | 'inversione' }
// Ritorna { dFine, dTime, why }.
export function decideStep(blk, st, opts){
  const out = { dFine: 0, dTime: 0, why: 'resta' };
  const hasTime = !!(opts && opts.hasTime), mode = opts && opts.mode;
  if(blk.acc > ADAPT_UP){
    if(hasTime && st.timeF > 1){ out.dTime = -Math.min(TF_STEP, st.timeF - 1); out.why = 'rientra il tempo concesso in più'; return out; }
    const slack = mode === 'intruso' ? (blk.medRtFrac != null && blk.medRtFrac < SLACK_FRAC)
                                      : ((st.successBlocks || 0) % 2 === 1); // Inversione: si alterna contenuto / tempo
    if(hasTime && slack && st.timeF > TF_MIN){ out.dTime = -TF_STEP; out.why = 'si stringe il tempo'; return out; }
    const d = adaptStepFine(blk.acc, st.fine, 1, 10);
    if(d){ out.dFine = d; out.why = 'sale il contenuto'; }
    return out;
  }
  if(blk.acc < ADAPT_DOWN){
    const share = blk.misses > 0 ? blk.omitted / blk.misses : 0;
    const timeCause = mode === 'intruso' ? share >= 0.5 : (blk.nearMiss != null && blk.nearMiss >= 0.5);
    if(hasTime && timeCause && st.timeF < TF_MAX){ out.dTime = TF_STEP; out.why = 'più tempo prima di abbassare'; return out; }
    const d = adaptStepFine(blk.acc, st.fine, 1, 10);
    if(d){ out.dFine = d; out.why = 'scende il contenuto'; }
  }
  return out;
}

// carico dell'Intruso (simboli da esaminare al secondo) per livello fine: ≈ +24% a livello, da 0,36 a 2,49
export const LOAD_LO = 0.36, LOAD_HI = 2.49;
export function loadOfGen(g){ return LOAD_LO * Math.pow(LOAD_HI / LOAD_LO, (fineOfGen(g) - 1) / 9); }
