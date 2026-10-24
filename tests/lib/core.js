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

// POOLS (js/core/pools.js) è dato puro, senza import: lo si legge in modo
// SINCRONO (togliendo solo la parola "export") per i test che lo usano come
// stub globale dentro loadPure. Stesso file e stesso testo che il browser carica.
const fs = require('fs');
const vm = require('vm');
function loadPoolsSync() {
  const src = fs.readFileSync(path.join(CORE_DIR, 'pools.js'), 'utf8').replace(/^(\s*)export /gm, '$1');
  return vm.runInNewContext('(function(){\n' + src + '\nreturn POOLS;\n})()', {});
}
module.exports.loadPoolsSync = loadPoolsSync;

// Come loadPoolsSync, ma per un modulo senza import: restituisce gli export indicati.
function loadCoreSync(fileName, names) {
  const src = fs.readFileSync(path.join(CORE_DIR, fileName), 'utf8').replace(/^(\s*)export /gm, '$1');
  return vm.runInNewContext('(function(){\n' + src + '\nreturn {' + names.join(',') + '};\n})()', {});
}
module.exports.loadCoreSync = loadCoreSync;

// Come loadCoreSync, ma per js/services/ e con variabili globali finte (es. localStorage).
function loadServiceSync(fileName, names, globals) {
  const src = fs.readFileSync(path.join(CORE_DIR, '..', 'services', fileName), 'utf8').replace(/^(\s*)export /gm, '$1');
  return vm.runInNewContext('(function(){\n' + src + '\nreturn {' + names.join(',') + '};\n})()', Object.assign({}, globals));
}
module.exports.loadServiceSync = loadServiceSync;
