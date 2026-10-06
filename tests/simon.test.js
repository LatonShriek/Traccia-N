'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// buildSimon(), come scritta nell'app reale, legge `cfg` come variabile
// LIBERA (non un parametro) — stesso approccio già usato in
// stopsignal.test.js: uno stub condiviso, mutato prima di ogni chiamata.
const cfgStub = {};
const mod = loadPure(REPO_ROOT, [
  { name: 'POOLS', start: '  const POOLS = {', end: 'POOLS.numeriVoce = POOLS.numeri;' },
  { name: 'SWITCH_RULESETS+STOPSIGNAL_RULES', start: '  const SWITCH_RULESETS = {', end: "suoni:  {labelA:'Grave', labelB:'Acuto', classify:v=> v.f < 380}\n  };" },
  { name: 'SIMON_COLORS+PROB+buildSimon', start: "  const SIMON_COLORS = { blu:{hex:'#3B72D6', icon:'Blu'}, verde:{hex:'#3FA34D', icon:'Verde'} };", end: '    return seq;\n  }' }
], ['SIMON_COLORS', 'SIMON_CONGRUENCE_PROB', 'buildSimon', 'POOLS', 'STOPSIGNAL_RULES'], { cfg: cfgStub });

const { SIMON_COLORS, SIMON_CONGRUENCE_PROB, buildSimon, POOLS, STOPSIGNAL_RULES } = mod;

module.exports = function run(t) {
  t.group('Simon — costanti', () => {
    t.eq(SIMON_COLORS.blu.hex, '#3B72D6', 'blu: stesso hex già usato in POOLS.colori, non un colore nuovo inventato');
    t.eq(SIMON_COLORS.verde.hex, '#3FA34D', 'verde: stesso hex già usato in POOLS.colori');
    t.eq(SIMON_CONGRUENCE_PROB.bilanciato, 0.5, 'bilanciato: 50/50');
    t.eq(SIMON_CONGRUENCE_PROB.prevalenza_congruente, 0.75, 'prevalenza congruente: 75%');
    t.eq(SIMON_CONGRUENCE_PROB.prevalenza_incongruente, 0.25, 'prevalenza incongruente: 25%');
  });

  t.group('buildSimon — mappatura colore→pulsante, sempre coerente', () => {
    cfgStub.trials = 500; cfgStub.simonCongruenza = 'bilanciato';
    const seq = buildSimon();
    t.eq(seq.length, 500, 'genera esattamente il numero di prove richiesto');
    seq.forEach((trial, i) => {
      const isBlu = trial.val === SIMON_COLORS.blu;
      const isVerde = trial.val === SIMON_COLORS.verde;
      t.ok(isBlu || isVerde, 'prova ' + i + ': il colore è sempre blu o verde, mai altro');
      if (isBlu) t.eq(trial.correctAnswer, 'left', 'prova ' + i + ': blu → sempre pulsante sinistro (mappatura fissa)');
      if (isVerde) t.eq(trial.correctAnswer, 'right', 'prova ' + i + ': verde → sempre pulsante destro (mappatura fissa)');
      t.ok(trial.side === 'left' || trial.side === 'right', 'prova ' + i + ': la posizione a schermo è sempre sinistra o destra, mai centro');
      // La congruenza dichiarata deve sempre corrispondere alla relazione
      // reale fra side e correctAnswer — non un'etichetta indipendente.
      const shouldBeCongruent = trial.side === trial.correctAnswer;
      t.eq(trial.congruency, shouldBeCongruent ? 'congruent' : 'incongruent',
        'prova ' + i + ': congruenza dichiarata coerente con side vs correctAnswer');
    });
  });

  t.group('buildSimon — proporzione di congruenza rispettata (con tolleranza statistica)', () => {
    ['bilanciato', 'prevalenza_congruente', 'prevalenza_incongruente'].forEach(mode => {
      cfgStub.trials = 3000; cfgStub.simonCongruenza = mode;
      const seq = buildSimon();
      const congFrac = seq.filter(x => x.congruency === 'congruent').length / seq.length;
      t.approx(congFrac, SIMON_CONGRUENCE_PROB[mode], 0.03, mode + ': quota di prove congruenti vicina al parametro configurato');
    });
  });

  t.group('buildSimon — proporzione colori bilanciata indipendentemente dalla congruenza', () => {
    cfgStub.trials = 3000; cfgStub.simonCongruenza = 'prevalenza_incongruente';
    const seq = buildSimon();
    const bluFrac = seq.filter(x => x.val === SIMON_COLORS.blu).length / seq.length;
    t.approx(bluFrac, 0.5, 0.03, 'blu/verde restano 50/50 anche con congruenza sbilanciata (sono due manipolazioni indipendenti)');
  });

  t.group('buildSimon — varianti materiale (lettere/numeri/suoni): riusano le regole di Stop-Signal, non ne inventano di nuove', () => {
    ['lettere', 'numeri', 'suoni'].forEach(mat => {
      cfgStub.trials = 800; cfgStub.simonCongruenza = 'bilanciato'; cfgStub.simonMateriale = mat;
      const seq = buildSimon();
      const rule = STOPSIGNAL_RULES[mat];
      t.eq(seq.length, 800, mat + ': genera il numero di prove richiesto');
      const mismatches = seq.filter(x => x.correctAnswer !== (rule.classify(x.val) ? 'left' : 'right'));
      t.eq(mismatches.length, 0, mat + ': correctAnswer coerente con STOPSIGNAL_RULES.' + mat + ' su tutte le prove (stessa regola, non una copia divergente)');
      t.ok(seq.every(x => POOLS[mat].includes(x.val)), mat + ': ogni stimolo generato viene dal pool giusto, nessun valore fuori posto');
      // La congruenza resta la stessa manipolazione indipendente dal
      // materiale: side coincide o no con correctAnswer, mai altro.
      const badCongruency = seq.filter(x => x.congruency !== (x.side === x.correctAnswer ? 'congruent' : 'incongruent'));
      t.eq(badCongruency.length, 0, mat + ': congruenza dichiarata coerente con side vs correctAnswer, come per i colori');
    });
  });

  t.group('buildSimon — materiale non impostato: il default resta "colori" (nessuna regressione per config vecchie)', () => {
    cfgStub.trials = 200; cfgStub.simonCongruenza = 'bilanciato'; cfgStub.simonMateriale = undefined;
    const seq = buildSimon();
    t.ok(seq.every(x => x.val === SIMON_COLORS.blu || x.val === SIMON_COLORS.verde), 'senza simonMateriale impostato, genera sempre colori come prima di questa modifica');
  });
};
