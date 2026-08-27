'use strict';
const path = require('path');
const { makeRunner } = require('./lib/runner');

const FILES = [
  'titration.test.js',
  'stopsignal.test.js',
  'screening.test.js',
  'keylayout.test.js',
  'ant-cue.test.js'
];

let totalPass = 0, totalFail = 0;
const allFailures = [];

FILES.forEach(file => {
  const t = makeRunner();
  try {
    require(path.join(__dirname, file))(t);
  } catch (e) {
    console.error(file + ': ERRORE nel caricare o eseguire il test — ' + e.message);
    totalFail++;
    allFailures.push(file + ': ERRORE — ' + e.message);
    return;
  }
  const s = t.summary();
  totalPass += s.pass;
  totalFail += s.fail;
  s.failures.forEach(f => allFailures.push(file + ': ' + f));
  console.log(file + ': ' + s.pass + ' ok, ' + s.fail + ' falliti');
});

console.log('---');
if (allFailures.length) {
  console.log('FALLITI (' + allFailures.length + '):');
  allFailures.forEach(f => console.log('  - ' + f));
  console.log(totalPass + ' passati, ' + totalFail + ' falliti su ' + (totalPass + totalFail) + ' controlli totali.');
  process.exit(1);
}
console.log('Tutti i ' + totalPass + ' controlli passati.');
