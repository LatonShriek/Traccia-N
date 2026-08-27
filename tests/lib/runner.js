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
    try { fn(); } finally { groupStack.pop(); }
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
