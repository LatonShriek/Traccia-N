// js/core/keylayout.js — le due disposizioni dei tasti per le risposte da tastiera
// ('standard' A/L/Z/M, 'ravvicinata' B/N e V/B/N/M: 4 tasti adiacenti sulla riga
// inferiore, raggiungibili con una sola mano). Dato puro, nessun accesso a DOM/window.
// Spostata da index.html senza modifiche (solo `export`). La scelta della
// disposizione attiva (activeKeyLayout) resta in index.html perché legge cfg.

export const KEY_LAYOUTS = {
  standard:    { map2:{'a':0,'l':1}, map4:{'a':0,'l':1,'z':2,'m':3}, labels2:['A','L'], labels4:['A','L','Z','M'] },
  ravvicinata: { map2:{'b':0,'n':1}, map4:{'v':0,'b':1,'n':2,'m':3}, labels2:['B','N'], labels4:['V','B','N','M'] }
};
