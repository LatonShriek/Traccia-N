// Cambiamento del SINGOLO paziente rispetto alla propria variabilità di base (N-of-1). NUOVO codice (15 nov 2026).
// Idea: prima di allenare si misura 3-5 volte la stessa prova (forme parallele ruotate); da lì si stima quanto
// oscilla questa persona su questa prova. Una misura successiva conta come cambiamento solo se si discosta dalla
// media di base di più di quanto la sua oscillazione renda plausibile (intervallo di previsione con t di Student,
// perché i punti di base sono pochi). Con 3 punti la soglia è larga e va letta come provvisoria: si restringe
// man mano che si aggiungono misure di base o sedute di controllo.
// Funzioni pure, senza DOM. Non è ancora collegato a una schermata: serve da base per grafico e report.
import { mean, sd } from './stats.js';

// t di Student a due code, per gradi di libertà 1..10 (oltre 10: approssimazione per df≥30 con z).
const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228];
const T90 = [6.314, 2.920, 2.353, 2.132, 2.015, 1.943, 1.895, 1.860, 1.833, 1.812];
function tCrit(df, conf){
  const tab = conf >= 0.95 ? T95 : T90, z = conf >= 0.95 ? 1.96 : 1.645;
  if(df < 1) return Infinity;
  if(df <= 10) return tab[df-1];
  if(df >= 30) return z;
  return tab[9] + (z - tab[9]) * (df - 10) / 20; // interpolazione grossolana fra df 10 e 30
}

// values: misure di base (numeri). Restituisce {n, mean, sd, threshold} oppure null se ne servono di più.
export function baselineOf(values, opts){
  const conf = (opts && opts.conf) || 0.90, minN = (opts && opts.minN) || 3;
  const v = values.filter(x => typeof x === 'number' && isFinite(x));
  if(v.length < minN) return null;
  const m = mean(v), s = sd(v);
  const threshold = tCrit(v.length - 1, conf) * s * Math.sqrt(1 + 1 / v.length);
  return { n: v.length, mean: m, sd: s, threshold, conf };
}

// Una misura nuova rispetto alla base. higherIsBetter: true per accuratezza, false per tempi.
export function classifyChange(base, value, higherIsBetter){
  if(!base || value == null || !isFinite(value)) return null;
  const delta = value - base.mean;
  const better = higherIsBetter === false ? -delta : delta;
  const label = Math.abs(delta) <= base.threshold ? 'nella variabilità' : (better > 0 ? 'migliorato' : 'peggiorato');
  return { delta, threshold: base.threshold, label };
}

// Forma parallela da usare alla misura i (0, 1, 2, …): A, B, C, A, B, C… per ridurre l'effetto del ricordo degli stessi stimoli.
export function formaPerMisura(i, nForme){
  const n = Math.max(1, nForme | 0);
  return ((i % n) + n) % n;
}
