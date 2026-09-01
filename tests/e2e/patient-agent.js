'use strict';
// Agente "finto paziente": apre index.html in un vero browser headless
// (Chromium, via Playwright) e interagisce con l'app esattamente come
// farebbe una persona — click sui pulsanti veri, non chiamate dirette alle
// funzioni interne (che dall'esterno di index.html non sono comunque
// raggiungibili: sono chiuse dentro la IIFE dell'app, mai esposte come
// variabili globali). È il complemento del resto della cartella tests/:
// lì si verifica la LOGICA pura (i calcoli), qui si verifica che
// quella logica arrivi davvero, correttamente, sullo schermo.
//
// Limite dichiarato: copre N-back, Go/No-Go, Task-switching, Doppio
// compito, TAPAT — 5 esercizi su 11. Estendere agli altri richiede solo
// aggiungere voci a EXERCISE_BUTTON_TEXT sotto (o, per compiti a
// interazione diversa da un pulsante di risposta standard come
// Cancellazione, una logica di tocco dedicata) — non nuova
// infrastruttura di base.

const path = require('path');
const { chromium } = require('playwright');

const EXERCISE_BUTTON_TEXT = {
  nback: 'N-back classico',
  gonogo: 'Go/No-Go',
  switching: 'Task-switching',
  dualtask: 'Doppio compito',
  // TAPAT non è un esercizio a sé nel selettore — è una sotto-modalità
  // di "Attenzione (tipo ANT)", che richiede un secondo tocco (vedi
  // subMode sotto, gestito da runFakePatientSession).
  tapat: { exercise: 'Attenzione (tipo ANT)', subMode: 'TAPAT' }
};

// Riduce "Numero di prove" al minimo (10) prima di avviare — una sessione
// finta non ha bisogno delle 24 prove di default, e una seduta più corta
// rende l'agente più veloce senza cambiare nessuna logica testata.
async function setMinTrials(page) {
  const minus = page.locator('label:has-text("Numero di prove")').locator('xpath=following-sibling::*[1]').locator('button:has-text("–")');
  for (let i = 0; i < 20; i++) { await minus.click(); }
}

// Simula le risposte del "paziente": tocca un pulsante di risposta visibile
// a intervalli regolari finché la schermata di sessione (riconoscibile dal
// pulsante "Interrompi") non sparisce, cioè finché la seduta non finisce
// da sola — mai un numero di tocchi deciso a priori, perché non sappiamo
// in anticipo quante prove ISI-per-ISI dureranno con esattezza.
async function simulatePatientResponses(page, { maxMs = 60000, tapEveryMs = 300, correctRate = 0.8 } = {}) {
  const start = Date.now();
  let taps = 0;
  while (Date.now() - start < maxMs) {
    const stillRunning = await page.locator('button:has-text("Interrompi")').count();
    if (!stillRunning) break;
    // Tutti i pulsanti dentro l'area di risposta reale dell'app (classe
    // 'tapbtn', quella usata da mountTaskScreen per i pulsanti di risposta
    // veri — non "Pausa"/"Interrompi"/gli stepper del titolo).
    const respButtons = page.locator('button.tapbtn');
    const n = await respButtons.count();
    if (n > 0) {
      // Non sempre il "primo" pulsante è quello corretto — un vero paziente
      // sbaglia una parte delle volte. Qui non sappiamo QUALE risposta sia
      // corretta (l'agente non legge lo stato interno, solo lo schermo,
      // come un utente vero) — alterniamo pseudo-casualmente fra i pulsanti
      // disponibili con una preferenza per il primo (~correctRate delle
      // volte), il resto delle volte un altro a caso, per generare un
      // pattern di risposte miste invece di spingere sempre lo stesso
      // pulsante — utile a controllare che l'app non vada in errore con
      // input realisticamente misti, non a misurare l'accuratezza vera.
      const idx = (n > 1 && Math.random() > correctRate) ? Math.floor(Math.random() * n) : 0;
      await respButtons.nth(idx).click({ timeout: 800 }).catch(() => {});
      taps++;
    }
    await page.waitForTimeout(tapEveryMs);
  }
  return { taps, elapsedMs: Date.now() - start, timedOut: Date.now() - start >= maxMs };
}

// Esegue un'intera sessione finta su un esercizio e restituisce cosa è
// successo: se è arrivato alla schermata dei risultati, se ci sono stati
// errori JS non gestiti in pagina, e il testo dei risultati mostrati.
async function runFakePatientSession(repoRoot, exerciseKey, opts) {
  const entry = EXERCISE_BUTTON_TEXT[exerciseKey];
  if (!entry) throw new Error('Esercizio non configurato in EXERCISE_BUTTON_TEXT: ' + exerciseKey);
  const label = typeof entry === 'string' ? entry : entry.exercise;
  const subMode = typeof entry === 'string' ? null : entry.subMode;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  try {
    await page.goto('file://' + path.join(repoRoot, 'index.html'));
    await page.waitForTimeout(400);
    await page.click('text=usa questo dispositivo in locale');
    await page.waitForTimeout(250);
    await page.click('button:has-text("' + label + '")');
    await page.waitForTimeout(250);
    if (subMode) {
      await page.click('button:has-text("' + subMode + '")');
      await page.waitForTimeout(250);
    }
    await setMinTrials(page);
    await page.click('text=Avvia sessione');
    await page.waitForTimeout(300);
    await page.click('text=Ho capito, inizia');
    await page.waitForTimeout(3200); // conto alla rovescia 3-2-1, ~800ms a cifra

    const { taps, elapsedMs, timedOut } = await simulatePatientResponses(page, opts);

    await page.waitForTimeout(500);
    const reachedResults = await page.locator('text=Interrompi').count() === 0;
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 600));

    return { exerciseKey, reachedResults, timedOut, taps, elapsedMs, jsErrors, bodyText };
  } finally {
    await browser.close();
  }
}

module.exports = { runFakePatientSession, EXERCISE_BUTTON_TEXT };
