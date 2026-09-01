'use strict';
const path = require('path');
const { makeRunner } = require('./lib/runner');

// Suite veloce (logica pura, nessuna dipendenza esterna, sempre eseguibile)
const FILES = [
  'titration.test.js',
  'stopsignal.test.js',
  'screening.test.js',
  'keylayout.test.js',
  'ant-cue.test.js',
  'rci.test.js',
  'named-configs.test.js',
  'neglect-titration.test.js',
  'dualtask-titration.test.js',
  'categorizzazione-titration.test.js',
  'tapat-titration.test.js',
  'demo.test.js',
  'motor-check.test.js',
  'simon.test.js'
];

// Suite end-to-end (browser vero via Playwright — più lenta, richiede
// `npm install playwright` fatto almeno una volta su questa macchina).
// Eseguita solo se disponibile: la sua assenza non fa fallire il resto,
// è un avviso, non un errore — non tutti gli ambienti di lavoro avranno
// installato Playwright, e la suite veloce deve restare sempre lanciabile
// da sola senza dipendenze.
const E2E_FILES = ['e2e/session-flow.test.js'];

async function runFile(file) {
  const t = makeRunner();
  const exported = require(path.join(__dirname, file));
  await exported(t); // funziona sia per moduli sincroni (non serve await, non fa danno) sia per quelli async (e2e)
  return t.summary();
}

async function main() {
  let totalPass = 0, totalFail = 0;
  const allFailures = [];

  for (const file of FILES) {
    try {
      const s = await runFile(file);
      totalPass += s.pass; totalFail += s.fail;
      s.failures.forEach(f => allFailures.push(file + ': ' + f));
      console.log(file + ': ' + s.pass + ' ok, ' + s.fail + ' falliti');
    } catch (e) {
      console.error(file + ': ERRORE nel caricare o eseguire il test — ' + e.message);
      totalFail++;
      allFailures.push(file + ': ERRORE — ' + e.message);
    }
  }

  let playwrightAvailable = true;
  try { require.resolve('playwright'); } catch (e) { playwrightAvailable = false; }

  if (!playwrightAvailable) {
    console.log('--- suite end-to-end (tests/e2e/) saltata: Playwright non è installato qui.');
    console.log('    Per abilitarla: npm install playwright   (una volta sola su questa macchina)');
  } else {
    for (const file of E2E_FILES) {
      try {
        const s = await runFile(file);
        totalPass += s.pass; totalFail += s.fail;
        s.failures.forEach(f => allFailures.push(file + ': ' + f));
        console.log(file + ': ' + s.pass + ' ok, ' + s.fail + ' falliti');
      } catch (e) {
        console.error(file + ': ERRORE nel caricare o eseguire il test — ' + e.message);
        totalFail++;
        allFailures.push(file + ': ERRORE — ' + e.message);
      }
    }
  }

  console.log('---');
  if (allFailures.length) {
    console.log('FALLITI (' + allFailures.length + '):');
    allFailures.forEach(f => console.log('  - ' + f));
    console.log(totalPass + ' passati, ' + totalFail + ' falliti su ' + (totalPass + totalFail) + ' controlli totali.');
    process.exit(1);
  }
  console.log('Tutti i ' + totalPass + ' controlli passati.');
}

main();
