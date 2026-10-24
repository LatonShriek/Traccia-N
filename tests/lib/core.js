'use strict';
// I moduli di js/core/ sono moduli ES; i test sono CommonJS. Questo helper li
// importa con import() dinamico (funziona su qualunque Node recente, senza
// bisogno di require() di moduli ES).
const path = require('path');
const { pathToFileURL } = require('url');
const CORE_DIR = path.join(__dirname, '..', '..', 'js', 'core');
function importCore(fileName) {
  return import(pathToFileURL(path.join(CORE_DIR, fileName)).href);
}
module.exports = { importCore };
