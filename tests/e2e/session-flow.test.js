'use strict';
const path = require('path');
const { runFakePatientSession, EXERCISE_BUTTON_TEXT } = require('./patient-agent');

const REPO_ROOT = path.join(__dirname, '..', '..');

// Diverso dagli altri file di test: questo lancia un vero browser, quindi
// è async — run-all.js lo gestisce come gli altri ma questo file esporta
// una funzione che restituisce una Promise, non una funzione sincrona.
// Più lento (qualche decina di secondi, non millisecondi) — per questo
// resta un file a parte in tests/e2e/, non mescolato ai test di logica
// pura che devono restare istantanei da rilanciare in continuazione.
module.exports = async function run(t) {
  for (const exerciseKey of Object.keys(EXERCISE_BUTTON_TEXT)) {
    const entry = EXERCISE_BUTTON_TEXT[exerciseKey];
    const label = typeof entry === 'string' ? entry : entry.exercise + ' → ' + entry.subMode;
    const result = await runFakePatientSession(REPO_ROOT, exerciseKey, { maxMs: 30000, tapEveryMs: 250 });
    t.group('Sessione finta — ' + label, () => {
      t.eq(result.jsErrors.length, 0, 'nessun errore JavaScript in pagina durante l\'intera sessione' + (result.jsErrors.length ? ' — ' + result.jsErrors.join(' | ') : ''));
      t.ok(result.reachedResults, 'la sessione si è conclusa da sola (schermata "Interrompi" sparita) entro il tempo massimo, senza restare bloccata');
      t.ok(result.taps > 0, 'l\'agente è riuscito a toccare almeno un pulsante di risposta vero durante la sessione');
    });
  }
};
