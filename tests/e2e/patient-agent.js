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
// Copertura: 9 esercizi su 11 — tutti quelli che rispondono con un
// pulsante vero (famiglie signal/choice/dual, classe .tapbtn) più la
// Cancellazione (famiglia spatial, interazione radicalmente diversa: si
// tocca direttamente la cella .neglect-item sulla tavola, non un
// pulsante di risposta fisso — gestita a parte da
// simulateNeglectResponses). Restano fuori Scenari ecologici e
// Strategie di memoria: entrambi hanno più sotto-flussi interni
// profondamente diversi l'uno dall'altro (Scenari: ~9 scenari con
// elementi/vincoli propri ciascuno; Strategie di memoria: 5 tecniche
// con fasi studio/richiamo diverse per tecnica) — un agente onesto per
// loro richiede una progettazione dedicata per sotto-flusso, non
// un'estensione della stessa logica di tocco generica usata qui.
// Deliberatamente non tentata di corsa in questa sessione: rischio di
// scrivere una copertura solo apparente più alto del beneficio.

const path = require('path');
const { chromium } = require('playwright');

const EXERCISE_BUTTON_TEXT = {
  nback: 'N-back classico',
  sequenza: 'Sequenza bersaglio',
  gonogo: 'Go/No-Go',
  stopsignal: 'Stop-Signal',
  switching: 'Task-switching',
  categorizzazione: 'Categorizzazione condizionale',
  dualtask: 'Doppio compito',
  // TAPAT è stato separato da ANT classico in questa sessione: ora sono
  // due voci distinte nel selettore, ciascuna con il proprio pulsante —
  // nessun secondo tocco su una sotto-modalità è più necessario.
  ant: 'Attenzione (tipo ANT)',
  tapat: 'TAPAT (allerta tonica/fasica)',
  simon: 'Simon (conflitto spazio-risposta)',
  mantenimento: 'Mantenimento (tipo Sternberg)',
  neglect: { exercise: 'Cancellazione (neglect)', family: 'neglect' }
};

// Riduce al minimo il campo che controlla la lunghezza della sessione —
// "Numero di prove" per gli esercizi a famiglia signal/choice/dual,
// "Numero di tavole" per la Cancellazione (campo diverso, stesso ruolo:
// entrambi sono legati a cfg.trials). Il minimo per la Cancellazione è 1
// (non riducibile sotto), per gli altri il generatore permette di
// scendere fino a un valore molto basso — il ciclo di 20 click è più che
// sufficiente in entrambi i casi, si ferma da solo al minimo consentito.
async function decreaseStepperByLabel(page, label) {
  const minus = page.locator('label:has-text("' + label + '")').locator('xpath=following-sibling::*[1]').locator('button:has-text("–")');
  const count = await minus.count();
  if (count === 0) return false;
  for (let i = 0; i < 20; i++) { await minus.click().catch(() => {}); }
  return true;
}

// Simula le risposte del "paziente" per gli esercizi a pulsante di
// risposta standard (classe .tapbtn, usata da mountTaskScreen) — a
// intervalli regolari finché la schermata di sessione (riconoscibile dal
// pulsante "Interrompi") non sparisce da sola.
async function simulatePatientResponses(page, { maxMs = 60000, tapEveryMs = 300, correctRate = 0.8 } = {}) {
  const start = Date.now();
  let taps = 0;
  while (Date.now() - start < maxMs) {
    const stillRunning = await page.locator('button:has-text("Interrompi")').count();
    if (!stillRunning) break;
    const respButtons = page.locator('button.tapbtn');
    const n = await respButtons.count();
    if (n > 0) {
      // Non sempre il "primo" pulsante è quello corretto — un vero paziente
      // sbaglia una parte delle volte. Qui non sappiamo QUALE risposta sia
      // corretta (l'agente non legge lo stato interno, solo lo schermo,
      // come un utente vero) — alterniamo pseudo-casualmente fra i pulsanti
      // disponibili con una preferenza per il primo (~correctRate delle
      // volte), il resto delle volte un altro a caso.
      const idx = (n > 1 && Math.random() > correctRate) ? Math.floor(Math.random() * n) : 0;
      await respButtons.nth(idx).click({ timeout: 800 }).catch(() => {});
      taps++;
    }
    await page.waitForTimeout(tapEveryMs);
  }
  return { taps, elapsedMs: Date.now() - start, timedOut: Date.now() - start >= maxMs };
}

// Simula le risposte per la Cancellazione: tocca celle .neglect-item
// ancora "libere" (né già trovate né già segnate come tocco falso — le
// celle toccate restano nel DOM con una classe di stato, non vengono
// rimosse, quindi vanno escluse esplicitamente dal conteggio "celle
// rimaste", altrimenti quel conteggio non arriva mai a zero da solo) a
// caso, finché ce ne sono di libere sulla tavola corrente, poi preme
// "Fatto con questa tavola" per passare alla successiva (o chiudere
// l'ultima). Gestisce anche il caso "Conteggio a regola" (un campo
// numerico al posto della tavola, a fine tavola) con un valore
// qualunque, dato che qui interessa solo che l'app non vada in errore,
// non l'accuratezza della risposta.
async function simulateNeglectResponses(page, { maxMs = 60000, tapEveryMs = 120 } = {}) {
  const start = Date.now();
  let taps = 0;
  while (Date.now() - start < maxMs) {
    const stillRunning = await page.locator('button:has-text("Interrompi")').count();
    if (!stillRunning) break;
    const countInput = page.locator('input[type="number"]');
    if (await countInput.count() > 0) {
      await countInput.fill('5').catch(() => {});
      await page.click('button:has-text("Conferma")').catch(() => {});
      await page.waitForTimeout(300);
      continue;
    }
    const remaining = page.locator('.neglect-item:not(.found):not(.falsetap)');
    const n = await remaining.count();
    if (n > 0) {
      const idx = Math.floor(Math.random() * n);
      await remaining.nth(idx).click({ timeout: 800 }).catch(() => {});
      taps++;
      await page.waitForTimeout(tapEveryMs);
    } else {
      const doneBtn = page.locator('button:has-text("Fatto con questa tavola")');
      if (await doneBtn.count() > 0) { await doneBtn.click().catch(() => {}); await page.waitForTimeout(300); }
      else { await page.waitForTimeout(tapEveryMs); }
    }
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
  const family = typeof entry === 'string' ? null : entry.family;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));
  page.on('dialog', async d => { await d.accept().catch(() => {}); });

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
    if (family === 'neglect') {
      await decreaseStepperByLabel(page, 'Numero di tavole');
      await decreaseStepperByLabel(page, 'Elementi per tavola');
    } else {
      await decreaseStepperByLabel(page, 'Numero di prove');
    }
    await page.click('text=Avvia sessione');
    await page.waitForTimeout(300);
    await page.click('text=Ho capito, inizia');
    await page.waitForTimeout(3200); // conto alla rovescia 3-2-1, ~800ms a cifra

    const { taps, elapsedMs, timedOut } = family === 'neglect'
      ? await simulateNeglectResponses(page, opts)
      : await simulatePatientResponses(page, opts);

    await page.waitForTimeout(500);
    const reachedResults = await page.locator('text=Interrompi').count() === 0;
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 600));

    return { exerciseKey, reachedResults, timedOut, taps, elapsedMs, jsErrors, bodyText };
  } finally {
    await browser.close();
  }
}

module.exports = { runFakePatientSession, EXERCISE_BUTTON_TEXT };
