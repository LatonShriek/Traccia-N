'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// buildStopSignal(), come scritta nell'app reale, legge `cfg` come
// variabile LIBERA (non un parametro) — nell'app è chiusa nello scope della
// grande IIFE che racchiude tutto. Per richiamarla qui isolata, le forniamo
// un oggetto `cfg` condiviso nel sandbox (stub), che mutiamo prima di ogni
// chiamata invece di passarlo come argomento — coerente con come la
// funzione è davvero scritta, senza doverla riscrivere per il test.
const cfgStub = {};
const mod = loadPure(REPO_ROOT, [
  { name: 'POOLS', start: '  const POOLS = {', end: 'POOLS.numeriVoce = POOLS.numeri;' },
  { name: 'buildStopSignal', start: '  function buildStopSignal(){', end: 'isTarget: !isStopTrial, isStopTrial, valid:true});\n    }\n    return seq;\n  }' },
  { name: 'SWITCH_RULESETS+STOPSIGNAL_RULES', start: '  const SWITCH_RULESETS = {', end: "suoni:  {labelA:'Grave', labelB:'Acuto', classify:v=> v.f < 380}\n  };" }
], ['POOLS', 'STOPSIGNAL_RULES', 'buildStopSignal'], { cfg: cfgStub });

const { POOLS, STOPSIGNAL_RULES, buildStopSignal } = mod;

module.exports = function run(t) {
  t.group('STOPSIGNAL_RULES — una regola fissa per materiale, coerente con l\'app reale', () => {
    t.eq(STOPSIGNAL_RULES.lettere.classify('A'), true, 'lettere: vocale → true (regola A)');
    t.eq(STOPSIGNAL_RULES.lettere.classify('B'), false, 'lettere: consonante → false (regola B)');
    t.eq(STOPSIGNAL_RULES.numeri.classify('4'), true, 'numeri: pari → true');
    t.eq(STOPSIGNAL_RULES.numeri.classify('3'), false, 'numeri: dispari → false');
    t.eq(STOPSIGNAL_RULES.forma.classify('●'), true, 'forma: cerchio → true');
    t.eq(STOPSIGNAL_RULES.forma.classify('▲'), false, 'forma: triangolo → false');
    t.eq(STOPSIGNAL_RULES.frecce.classify('◀'), true, 'frecce: sinistra → true');
    t.eq(STOPSIGNAL_RULES.frecce.classify('▶'), false, 'frecce: destra → false');
    t.eq(STOPSIGNAL_RULES.suoni.classify({ f: 220 }), true, 'suoni: sotto soglia (220Hz) → grave → true');
    t.eq(STOPSIGNAL_RULES.suoni.classify({ f: 523 }), false, 'suoni: sopra soglia (523Hz) → acuto → false');
  });

  t.group('buildStopSignal — distribuzione stop-trial e classificazione, su ogni materiale', () => {
    ['frecce', 'lettere', 'numeri', 'forma', 'suoni'].forEach(mat => {
      cfgStub.stimType = mat; cfgStub.trials = 2000; cfgStub.targetRate = 0.25;
      const seq = buildStopSignal();
      const stopFrac = seq.filter(x => x.isStopTrial).length / seq.length;
      t.approx(stopFrac, 0.25, 0.03, mat + ': quota di stop-trial vicina al targetRate configurato (25%)');
      const rule = STOPSIGNAL_RULES[mat];
      const mismatches = seq.filter(x => x.correctAnswer !== (rule.classify(x.val) ? 'a' : 'b'));
      t.eq(mismatches.length, 0, mat + ': correctAnswer coerente con la regola su tutte le 2000 prove generate');
    });
  });
};
