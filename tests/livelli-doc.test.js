'use strict';
// Passo 6: docs/livelli.md è generato da js/core/levels.js (tools/livelli-md.mjs) e deve coincidere con le tabelle vere.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

module.exports = async function run(t) {
  const G = await import(pathToFileURL(path.join(__dirname, '..', 'tools', 'livelli-md.mjs')).href);
  const doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'livelli.md'), 'utf8');
  const gen = G.buildLivelliMd();

  t.group('docs/livelli.md coincide con le tabelle vere', () => {
    t.ok(doc === gen, 'il documento è aggiornato (se fallisce: node tools/livelli-md.mjs)');
  });

  t.group('il documento contiene i valori noti (controllo indipendente dal generatore)', () => {
    t.ok(doc.includes('| ISI sequenza | 4500 | 3900 | 3200 | 2700 | 2200 | 1900 | 1700 | 1500 | 1150 | 900 |'), 'ISI sequenza');
    t.ok(doc.includes('| Switching: intervallo segnale→stimolo (CSI) | 900 | 750 | 600 | 480 | 380 | 300 | 230 | 170 | 120 | 80 |'), 'CSI switching');
    t.ok(doc.includes('| n | 1 | 1 | 1 | 1 | 2 | 2 | 2 | 2 | 2 | 3 |'), 'n-back: n per livello');
    t.ok(doc.includes('| Go/No-Go: frequenza no-go | 48% | 44% | 40% | 34% | 28% | 22% | 17% | 12% | 8% | 5% |'), 'frequenza no-go');
    t.ok(doc.includes('| Categorizzazione: ISI | 2200 | 1300 | 2200 | 1300 | 2200 | 1300 | — | — | 2200 | 1300 |'), 'Categorizzazione: niente ISI ai livelli 7-8');
    t.ok(doc.includes('| Cancellazione: secondi per tavola (0 = nessun limite) | 0 | 0 | 110 | 90 | 70 | 55 | 42 | 32 | 24 | 18 |'), 'tempo Cancellazione');
  });
};
