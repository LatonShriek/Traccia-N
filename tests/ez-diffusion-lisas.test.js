'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const mod = loadPure(REPO_ROOT, [
  { name: 'mean', start: '  function mean(arr){', end: 'return arr.reduce((a,b)=>a+b,0)/arr.length; }' },
  { name: 'sd', start: '  function sd(arr){', end: '  }' },
  { name: 'computeEZDiffusion', start: '  function computeEZDiffusion(nCorrect, nTotal, meanRTsec, varRTsec){', end: 'return {v, a, Ter};\n  }' },
  { name: 'computeLISAS', start: '  function computeLISAS(rtsCorrectMs, correctFlags){', end: 'return mean(rtsCorrectMs) + (sdRT/sdErr)*errRate;\n  }' }
], ['mean', 'sd', 'computeEZDiffusion', 'computeLISAS'], {});

const { computeEZDiffusion, computeLISAS } = mod;

module.exports = function run(t) {
  t.group('computeEZDiffusion — casi sensati', () => {
    // Alta accuratezza + RT veloce -> drift rate più alto di bassa accuratezza + RT lento
    const bravoVeloce = computeEZDiffusion(30, 32, 0.55, 0.02);
    const scarsoLento = computeEZDiffusion(20, 32, 1.1, 0.08);
    t.ok(bravoVeloce, 'bravoVeloce produce un risultato');
    t.ok(scarsoLento, 'scarsoLento produce un risultato');
    if (bravoVeloce && scarsoLento) {
      t.ok(bravoVeloce.v > scarsoLento.v, 'prestazione migliore -> tasso di deriva (v) più alto: ' + bravoVeloce.v + ' vs ' + scarsoLento.v);
      t.ok(bravoVeloce.v > 0, 'v positivo quando l\'accuratezza è sopra il caso');
    }
  });

  t.group('computeEZDiffusion — casi limite non devono lanciare eccezioni', () => {
    t.eq(computeEZDiffusion(0, 0, null, null), null, '0 prove totali -> null, non un\'eccezione');
    const noThrow = (fn) => { try { fn(); return true; } catch (e) { return false; } };
    t.ok(noThrow(() => computeEZDiffusion(16, 32, 0.8, 0.05)), 'Pc esattamente 0.5 (16/32) non lancia (nudge dell\'epsilon)');
    t.ok(noThrow(() => computeEZDiffusion(32, 32, 0.6, 0.03)), 'accuratezza 100% non lancia (correzione stile Hautus)');
    t.ok(noThrow(() => computeEZDiffusion(0, 32, 0.6, 0.03)), 'accuratezza 0% non lancia');
    t.eq(computeEZDiffusion(16, 32, 0.8, 0), null, 'varianza RT zero -> null, non una divisione per zero silenziosa');
  });

  t.group('computeLISAS — invarianti', () => {
    const soloCorrette = computeLISAS([500, 520, 480, 510], [true, true, true, true]);
    t.eq(soloCorrette, 502.5, 'zero errori -> LISAS è esattamente il RT medio, nessuna penalità aggiunta');

    const conErrori = computeLISAS([500, 520, 480, 510], [true, true, false, true, false]);
    t.ok(conErrori > 502.5, 'con errori presenti, LISAS è sempre >= al RT medio delle sole corrette (mai una penalità negativa)');

    t.eq(computeLISAS([], [false, false, false]), null, 'tutte le prove sbagliate, nessun RT corretto disponibile -> null, non un errore');
    t.eq(computeLISAS([], []), null, 'nessuna prova -> null');
  });
};
