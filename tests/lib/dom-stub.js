'use strict';
// Il vero el(tag, attrs, children) dell'app crea un nodo DOM reale. Qui
// costruiamo un oggetto semplice con la stessa forma (tag/attrs/children)
// e un campo .text che concatena ricorsivamente il testo dei figli — basta
// per verificare COSA una funzione di rendering produrrebbe (quale scritta,
// quale colore, quale glifo) senza un browser vero. Non verifica il layout
// a schermo, il CSS calcolato, né l'interazione — solo la struttura logica.
function el(tag, attrs, children) {
  const kids = children || [];
  const text = kids.map(c => (typeof c === 'string' ? c : (c && c.text) || '')).join('');
  return { tag, attrs: attrs || {}, children: kids, text };
}
module.exports = { el };
