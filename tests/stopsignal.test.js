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
  { name: 'buildStopSignal', start: '  function buildStopSignal(){', end: "      seq.push(trial);\n    }\n    return seq;\n  }" },
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

  t.group('buildStopSignal — interferenza spaziale DISATTIVATA (default): nessun campo side/congruency', () => {
    cfgStub.stimType = 'frecce'; cfgStub.trials = 200; cfgStub.targetRate = 0.25; cfgStub.stopsignalInterferenza = 'no';
    const seq = buildStopSignal();
    t.ok(seq.every(x => x.side === undefined), 'nessuna prova ha una posizione a schermo quando l\'interferenza è assente — il meccanismo core resta invariato');
    t.ok(seq.every(x => x.congruency === undefined), 'nessuna prova ha un\'etichetta di congruenza quando l\'interferenza è assente');
  });

  t.group('buildStopSignal — interferenza spaziale ATTIVATA: side/congruency coerenti con il meccanismo Simon', () => {
    cfgStub.stimType = 'frecce'; cfgStub.trials = 4000; cfgStub.targetRate = 0.25; cfgStub.stopsignalInterferenza = 'si';
    const seq = buildStopSignal();
    t.ok(seq.every(x => x.side === 'left' || x.side === 'right'), 'ogni prova riceve una posizione a schermo (sinistra o destra) quando l\'interferenza è attiva');
    t.ok(seq.every(x => x.congruency === 'congruent' || x.congruency === 'incongruent'), 'ogni prova è etichettata congruente o incongruente');
    const congFrac = seq.filter(x => x.congruency === 'congruent').length / seq.length;
    t.approx(congFrac, 0.5, 0.03, 'proporzione congruente/incongruente vicina al 50/50, indipendente dalla frequenza di stop');
    // 'a' = pulsante sinistro, 'b' = pulsante destro (stesso ordine di
    // respondSpec/renderStimulusNode) — su una prova CONGRUENTE il lato
    // dello stimolo deve coincidere con quello del pulsante corretto.
    const congTrials = seq.filter(x => x.congruency === 'congruent');
    const congSideMismatch = congTrials.filter(x => (x.correctAnswer === 'a' && x.side !== 'left') || (x.correctAnswer === 'b' && x.side !== 'right'));
    t.eq(congSideMismatch.length, 0, 'su OGNI prova congruente, il lato dello stimolo coincide col lato del pulsante corretto (a=sinistra, b=destra)');
    const incongTrials = seq.filter(x => x.congruency === 'incongruent');
    const incongSideMismatch = incongTrials.filter(x => (x.correctAnswer === 'a' && x.side !== 'right') || (x.correctAnswer === 'b' && x.side !== 'left'));
    t.eq(incongSideMismatch.length, 0, 'su OGNI prova incongruente, il lato dello stimolo è OPPOSTO a quello del pulsante corretto');
    // La discriminazione (quale pulsante è corretto) resta identità-based:
    // la posizione non deve MAI entrare nel calcolo di correctAnswer.
    const rule = STOPSIGNAL_RULES.frecce;
    const mismatches = seq.filter(x => x.correctAnswer !== (rule.classify(x.val) ? 'a' : 'b'));
    t.eq(mismatches.length, 0, 'correctAnswer resta determinato SOLO dall\'identità dello stimolo, mai dalla posizione a schermo (side)');
  });
};
