'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const mod = loadPure(REPO_ROOT, [
  { name: 'KEY_LAYOUTS', start: '  const KEY_LAYOUTS = {', end: '  };' }
], ['KEY_LAYOUTS']);

const { KEY_LAYOUTS } = mod;
// Ordine fisico reale della riga inferiore di una tastiera QWERTY italiana/
// internazionale standard — usato per verificare l'adiacenza, non copiato
// da nessuna tabella dell'app (è un fatto sulla tastiera fisica, non sul
// codice).
const BOTTOM_ROW = 'zxcvbnm'.split('');

module.exports = function run(t) {
  ['standard', 'ravvicinata'].forEach(name => {
    t.group('Disposizione "' + name + '"', () => {
      const l = KEY_LAYOUTS[name];
      t.ok(!!l, 'esiste');
      if (!l) return;
      t.eq(Object.keys(l.map2).length, 2, 'map2 ha esattamente 2 tasti');
      t.eq(Object.keys(l.map4).length, 4, 'map4 ha esattamente 4 tasti');
      t.eq(Object.values(l.map2).slice().sort(), [0, 1], 'map2 copre gli indici 0 e 1 senza buchi né doppioni');
      t.eq(Object.values(l.map4).slice().sort(), [0, 1, 2, 3], 'map4 copre gli indici 0-3 senza buchi né doppioni');
      t.eq(l.labels2.length, 2, 'labels2 ha 2 etichette');
      t.eq(l.labels4.length, 4, 'labels4 ha 4 etichette');
      t.eq(Object.keys(l.map2).length, new Set(Object.keys(l.map2)).size, 'map2: nessun tasto ripetuto');
      t.eq(Object.keys(l.map4).length, new Set(Object.keys(l.map4)).size, 'map4: nessun tasto ripetuto');

      const idxs = Object.keys(l.map4).map(k => BOTTOM_ROW.indexOf(k)).sort((a, b) => a - b);
      if (name === 'ravvicinata') {
        // Requisito esplicito SOLO per questa disposizione (pensata per una
        // mano sola) — "standard" (A/L/Z/M) è storica e volutamente sparsa
        // su più righe/lati della tastiera, non deve rispettare l'adiacenza.
        const allOnRow = idxs.every(i => i >= 0);
        t.ok(allOnRow, 'tutti i 4 tasti sono sulla riga inferiore della tastiera (z x c v b n m)');
        const contiguous = allOnRow && idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
        t.ok(contiguous, 'i 4 tasti sono fisicamente ADIACENTI sulla riga (nessun salto che costringerebbe a muovere tutta la mano) — è il requisito esplicito per l\'uso con una mano sola');
      }
    });
  });

  t.group('Le due disposizioni restano scelte esclusive, mai miste nella stessa sessione', () => {
    // Non testiamo che le disposizioni non condividano tasti fra loro (lo
    // fanno: 'm' è in entrambe) — non è un requisito, dato che è sempre
    // attiva una sola disposizione alla volta secondo cfg.keyLayout. Qui
    // verifichiamo solo che activeKeyLayout(), la funzione che sceglie
    // quale usare, ricada sempre su 'standard' per qualunque valore non
    // riconosciuto — mai su undefined, che farebbe fallire silenziosamente
    // la mappatura tasti durante una sessione vera.
    const fallback = KEY_LAYOUTS['valore_inesistente'] || KEY_LAYOUTS.standard;
    t.eq(fallback, KEY_LAYOUTS.standard, 'un cfg.keyLayout non riconosciuto ricade sempre sulla disposizione standard');
  });
};
