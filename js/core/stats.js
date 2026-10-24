// js/core/stats.js — statistica descrittiva di base, funzioni pure (nessun accesso a DOM/window).
// Spostate da index.html senza modifiche al codice (solo `export`).

export function mean(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }
export function sd(arr){
  if(arr.length<2) return null;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s,v)=>s+(v-m)*(v-m),0)/(arr.length-1));
}
