'use strict';
function makeRunner() {
  let pass = 0, fail = 0;
  const failures = [];
  const groupStack = [];

  function label(msg) {
    return groupStack.length ? '[' + groupStack.join(' > ') + '] ' + msg : msg;
  }
  function group(name, fn) {
    groupStack.push(name);
    // Supporta sia callback sincrone (il caso comune, in tutti gli altri
    // file di test) sia asincrone (necessarie per named-configs.test.js,
    // che chiama funzioni async come saveNamedConfig) — senza questo,
    // "await t.group(nome, async () => {...})" non aspetterebbe davvero il
    // completamento del blocco: group() ignorerebbe la Promise restituita
    // da fn() e toglierebbe subito il nome dallo stack, prima che le
    // asserzioni al suo interno (dopo un await) fossero anche solo
    // eseguite — bug reale, trovato scrivendo il primo test asincrono.
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.finally(() => { groupStack.pop(); });
    }
    groupStack.pop();
    return result;
  }
  function record(ok, msg, detail) {
    if (ok) { pass++; return; }
    fail++;
    failures.push(label(msg) + (detail ? ' — ' + detail : ''));
  }
  function eq(got, expected, msg) {
    const okRes = JSON.stringify(got) === JSON.stringify(expected);
    record(okRes, msg, okRes ? null : 'atteso ' + JSON.stringify(expected) + ', ottenuto ' + JSON.stringify(got));
  }
  function approx(got, expected, tolerance, msg) {
    const okRes = typeof got === 'number' && Math.abs(got - expected) <= tolerance;
    record(okRes, msg, okRes ? null : 'atteso ~' + expected + ' (tolleranza ' + tolerance + '), ottenuto ' + got);
  }
  function ok(cond, msg) {
    record(!!cond, msg, cond ? null : '(condizione falsa)');
  }
  return { group, eq, approx, ok, summary: () => ({ pass, fail, failures }) };
}
module.exports = { makeRunner };
