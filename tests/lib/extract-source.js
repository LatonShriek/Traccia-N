'use strict';
// Estrae blocchi di codice PURO (nessun accesso a DOM/window) direttamente
// dal vero index.html, per testarli così come sono — mai da una copia
// mantenuta a mano in un file di test, che potrebbe disallinearsi dal
// codice reale senza che nessuno se ne accorga.
//
// Come funziona: ogni blocco è identificato da un testo di inizio e uno di
// fine ESATTI (copiati dal file sorgente). extractBlocks() li cerca nello
// script reale, uno per uno; se uno di questi testi non si trova più
// (perché una funzione è stata rinominata, spostata, riscritta), il
// caricamento si ferma con un errore esplicito — è un fallimento
// INTENZIONALE: meglio che un test smetta di funzionare e lo dica
// chiaramente, piuttosto che continuare silenziosamente a verificare una
// versione superata del codice.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function readAppScript(repoRoot) {
  const htmlPath = path.join(repoRoot, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  if (scripts.length < 2) {
    throw new Error(
      'Atteso un secondo tag <script> con la logica dell\'app in ' + htmlPath +
      ' — trovati solo ' + scripts.length + '. La struttura del file è cambiata?'
    );
  }
  // Lo stesso schema usato ovunque in questo progetto per separare lo
  // script applicativo dall'HTML che lo ospita (indice 1, non 0 — il primo
  // <script> è il service worker registration inline, non la logica).
  return scripts[1][1];
}

// Trova un blocco per testo di inizio/fine esatto. endMarker è INCLUSO nel
// risultato (a differenza di un semplice indexOf/slice), perché quasi
// sempre il testo utile finisce proprio con quel marcatore (es. la '}' di
// chiusura di un oggetto costante).
function grabOne(src, startMarker, endMarker, label) {
  const i = src.indexOf(startMarker);
  if (i < 0) {
    throw new Error(
      'Blocco "' + (label || startMarker.slice(0, 40)) + '" non trovato — ' +
      'il testo di inizio atteso non esiste più nel sorgente: ' + JSON.stringify(startMarker.slice(0, 80))
    );
  }
  const j = src.indexOf(endMarker, i + startMarker.length);
  if (j < 0) {
    throw new Error(
      'Blocco "' + (label || startMarker.slice(0, 40)) + '" trovato ma senza fine — ' +
      'il testo di chiusura atteso non esiste più: ' + JSON.stringify(endMarker.slice(0, 80))
    );
  }
  return { start: i, text: src.slice(i, j + endMarker.length) };
}

// specs: array di {name, start, end}. Estrae ciascun blocco dal sorgente
// reale, poi li riordina secondo la loro posizione ORIGINALE nel file
// (non secondo l'ordine in cui li ha richiesti chi chiama) — necessario
// perché alcuni blocchi dipendono da altri definiti prima di loro (es. le
// regole dello Stop-Signal riusano quelle del Task-switching), e riordinare
// da soli evita di dover tenere sincronizzato a mano l'ordine giusto ogni
// volta che il file cambia.
function extractBlocks(src, specs) {
  const found = specs.map(s => Object.assign({ name: s.name }, grabOne(src, s.start, s.end, s.name)));
  found.sort((a, b) => a.start - b.start);
  return found.map(f => f.text).join('\n');
}

// Esegue il codice estratto in un contesto isolato (vm, non eval/Function
// nel processo di test — un blocco estratto male non deve poter toccare lo
// stato del test runner) e restituisce SOLO i binding richiesti in
// `expose`. `stubs` fornisce le poche funzioni/oggetti globali di cui il
// codice puro ha comunque bisogno per essere valutato (es. `el()` per le
// funzioni di rendering, che restano pure finché non toccano il DOM vero).
function loadPure(repoRoot, specs, expose, stubs) {
  const src = readAppScript(repoRoot);
  const code = extractBlocks(src, specs);
  const returnStmt = '\nreturn {' + expose.map(n => n + ':' + n).join(',') + '};';
  const sandbox = Object.assign({ console }, stubs || {});
  vm.createContext(sandbox);
  const script = new vm.Script('(function(){\n' + code + returnStmt + '\n})()', {
    filename: 'estratto-da-index.html (blocchi: ' + specs.map(s => s.name).join(', ') + ')'
  });
  return script.runInContext(sandbox);
}

module.exports = { readAppScript, extractBlocks, loadPure, grabOne };
