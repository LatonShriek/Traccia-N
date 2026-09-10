'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const cfg = { taskMode: 'runningspan', stimType: 'lettere', adaptStartLevel: 1, trials: 10, adaptive: false };
let session = { rsAdaptBlock: [] };

const mod = loadPure(REPO_ROOT, [
  { name: 'POOLS', start: '  const POOLS = {', end: 'POOLS.numeriVoce = POOLS.numeri;' },
  { name: 'RUNNINGSPAN_LEVELS', start: '  const RUNNINGSPAN_LEVELS = {', end: '  };' },
  { name: 'genRunningSpanTrial+runningSpanItemsEqual', start: '  function genRunningSpanTrial(){', end: "    return a===b;\n  }" },
  { name: 'RUNNINGSPAN_ADAPT_BLOCK+maybeAdaptRunningSpan', start: '  const RUNNINGSPAN_ADAPT_BLOCK = 4;', end: "    session.rsAdaptBlock = [];\n  }" },
  { name: 'scoreRunningSpanTrial', start: '  function scoreRunningSpanTrial(trial, given){', end: "    return { posAcc: posCorrect/trial.n, contentAcc: contentCorrect/trial.n, n: trial.n, seqLen: trial.items.length };\n  }" }
], ['RUNNINGSPAN_LEVELS', 'genRunningSpanTrial', 'runningSpanItemsEqual', 'scoreRunningSpanTrial', 'maybeAdaptRunningSpan', 'RUNNINGSPAN_ADAPT_BLOCK'], { cfg, session, mean: arr => arr.reduce((a,b)=>a+b,0)/arr.length });

const { RUNNINGSPAN_LEVELS, genRunningSpanTrial, runningSpanItemsEqual, scoreRunningSpanTrial, maybeAdaptRunningSpan, RUNNINGSPAN_ADAPT_BLOCK } = mod;

module.exports = function run(t) {
  t.group('RUNNINGSPAN_LEVELS — struttura, tetto a n=4 (non 5, scelta cauta dichiarata)', () => {
    t.eq(RUNNINGSPAN_LEVELS[1].n, 2, 'livello 1: n=2, il più basso');
    t.eq(RUNNINGSPAN_LEVELS[10].n, 4, 'livello 10 (il più alto): n=4, non 5');
    for (let lvl = 1; lvl <= 10; lvl++) {
      t.ok(RUNNINGSPAN_LEVELS[lvl].n <= 4, 'livello ' + lvl + ': n non supera mai 4');
      t.ok(RUNNINGSPAN_LEVELS[lvl].seqMax >= RUNNINGSPAN_LEVELS[lvl].seqMin, 'livello ' + lvl + ': seqMax >= seqMin, intervallo valido');
      t.ok(RUNNINGSPAN_LEVELS[lvl].seqMin > RUNNINGSPAN_LEVELS[lvl].n || RUNNINGSPAN_LEVELS[lvl].seqMin >= RUNNINGSPAN_LEVELS[lvl].n, 'livello ' + lvl + ': la sequenza è sempre lunga almeno quanto n (altrimenti richiamare gli "ultimi n" non avrebbe senso)');
    }
  });

  t.group('genRunningSpanTrial — lunghezza sequenza SEMPRE dentro l\'intervallo del livello, mai fissa (è il punto del costrutto); legge il livello CORRENTE, non uno fissato all\'avvio', () => {
    cfg.adaptStartLevel = 5; cfg.stimType = 'lettere';
    const lvl = RUNNINGSPAN_LEVELS[5];
    const seenLengths = new Set();
    for (let i = 0; i < 300; i++) {
      const trial = genRunningSpanTrial();
      t.eq(trial.n, lvl.n, 'ciclo ' + i + ': n coerente col livello configurato ORA');
      t.ok(trial.items.length >= lvl.seqMin && trial.items.length <= lvl.seqMax, 'ciclo ' + i + ': lunghezza sequenza dentro l\'intervallo del livello (' + lvl.seqMin + '-' + lvl.seqMax + ')');
      seenLengths.add(trial.items.length);
    }
    t.ok(seenLengths.size > 1, 'su 300 cicli, la lunghezza varia davvero — non è sempre la stessa (il punto del costrutto: mai nota in anticipo)');
    // Il punto dell'aver reso la generazione incrementale (un ciclo alla
    // volta, non tutti pre-costruiti all'avvio): cambiare il livello a
    // metà seduta deve riflettersi SUBITO sul prossimo ciclo generato.
    cfg.adaptStartLevel = 9;
    const lvl9 = RUNNINGSPAN_LEVELS[9];
    const trialAfterChange = genRunningSpanTrial();
    t.eq(trialAfterChange.n, lvl9.n, 'dopo un cambio di livello a metà seduta, il ciclo successivo usa SUBITO il nuovo livello, non quello di partenza');
    cfg.adaptStartLevel = 1;
  });

  t.group('runningSpanItemsEqual — confronto per valore, non per riferimento (colori/suoni sono oggetti)', () => {
    t.eq(runningSpanItemsEqual('A', 'A'), true, 'lettere: stessa stringa');
    t.eq(runningSpanItemsEqual('A', 'B'), false, 'lettere: stringhe diverse');
    t.eq(runningSpanItemsEqual(null, 'A'), false, 'null non è mai uguale a niente');
    t.eq(runningSpanItemsEqual({ hex: '#FF0000' }, { hex: '#FF0000' }), true, 'colori: stesso hex, oggetti diversi per riferimento ma uguali per valore');
    t.eq(runningSpanItemsEqual({ hex: '#FF0000' }, { hex: '#00FF00' }), false, 'colori: hex diverso');
    t.eq(runningSpanItemsEqual({ f: 440 }, { f: 440 }), true, 'suoni: stessa frequenza, oggetti diversi per riferimento ma uguali per valore');
  });

  t.group('scoreRunningSpanTrial — posizione esatta: tutte giuste, tutte sbagliate, parziali', () => {
    const trial = { items: ['A', 'B', 'C', 'D', 'E'], n: 3 }; // ultimi 3 attesi: C, D, E
    t.eq(scoreRunningSpanTrial(trial, ['C', 'D', 'E']).posAcc, 1, 'ordine esatto: posAcc 100%');
    t.eq(scoreRunningSpanTrial(trial, ['C', 'D', 'E']).contentAcc, 1, 'ordine esatto: contentAcc 100% (conseguenza, non lo stesso calcolo)');
    t.eq(scoreRunningSpanTrial(trial, ['X', 'Y', 'Z']).posAcc, 0, 'tutto sbagliato: posAcc 0%');
    t.eq(scoreRunningSpanTrial(trial, ['X', 'Y', 'Z']).contentAcc, 0, 'tutto sbagliato: contentAcc 0%');
    t.eq(scoreRunningSpanTrial(trial, ['C', 'X', 'E']).posAcc, 2 / 3, 'due su tre in posizione esatta');
  });

  t.group('scoreRunningSpanTrial — contenuto giusto ma ordine sbagliato: le due misure DEVONO divergere (è il punto di averle separate)', () => {
    const trial = { items: ['A', 'B', 'C', 'D', 'E', 'F'], n: 4 }; // ultimi 4 attesi: C, D, E, F
    const res = scoreRunningSpanTrial(trial, ['F', 'E', 'D', 'C']); // stessi 4 elementi, ordine invertito (n pari: nessuna posizione resta fissa da sola)
    t.eq(res.contentAcc, 1, 'contenuto: tutti e 4 gli elementi giusti ci sono, indipendentemente dall\'ordine');
    t.eq(res.posAcc, 0, 'posizione: nessuno è nella casella esatta — ordine completamente invertito');
    t.ok(res.contentAcc !== res.posAcc, 'le due misure divergono davvero su questo caso — non sono la stessa cosa espressa in due modi');
  });

  t.group('scoreRunningSpanTrial — un elemento ripetuto nella risposta non viene contato due volte per il contenuto', () => {
    const trial = { items: ['A', 'B', 'C', 'D', 'C'], n: 3 }; // ultimi 3 attesi: C, D, C (C compare due volte)
    const res = scoreRunningSpanTrial(trial, ['C', 'C', 'C']); // paziente dà C tre volte
    t.eq(res.contentAcc, 2 / 3, 'C compariva 2 volte nell\'insieme atteso: solo 2 delle 3 risposte "C" vengono accreditate, non 3 — evita di gonfiare il punteggio ripetendo la stessa risposta');
  });

  t.group('scoreRunningSpanTrial — seqLen riportato è la lunghezza reale della sequenza di quel ciclo', () => {
    const trial = { items: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], n: 2 };
    t.eq(scoreRunningSpanTrial(trial, ['F', 'G']).seqLen, 7, 'seqLen = lunghezza vera della sequenza mostrata, non n');
  });

  t.group('maybeAdaptRunningSpan — non fa nulla se adaptive è spento, o se la finestra non è ancora piena', () => {
    cfg.adaptive = false; cfg.adaptStartLevel = 5; session.rsAdaptBlock = [1, 1, 1, 1];
    maybeAdaptRunningSpan();
    t.eq(cfg.adaptStartLevel, 5, 'adaptive spento: livello invariato anche con una finestra piena di punteggi perfetti');
    cfg.adaptive = true; cfg.adaptStartLevel = 5; session.rsAdaptBlock = [1, 1];
    maybeAdaptRunningSpan();
    t.eq(cfg.adaptStartLevel, 5, 'finestra non ancora piena (' + RUNNINGSPAN_ADAPT_BLOCK + ' richiesti, solo 2 presenti): nessuna decisione ancora');
  });

  t.group('maybeAdaptRunningSpan — sale sopra 85%, scende sotto 70%, sulla MEDIA di posAcc e contentAcc (non solo posAcc)', () => {
    cfg.adaptive = true; cfg.adaptStartLevel = 5;
    session.rsAdaptBlock = [0.9, 0.95, 0.9, 0.9]; // media > 0.85
    maybeAdaptRunningSpan();
    t.eq(cfg.adaptStartLevel, 6, 'media sopra 85%: livello sale di uno');
    t.eq(session.rsAdaptBlock.length, 0, 'la finestra si svuota dopo la decisione, non si accumula all\'infinito');

    cfg.adaptStartLevel = 5;
    session.rsAdaptBlock = [0.5, 0.6, 0.5, 0.6]; // media < 0.70
    maybeAdaptRunningSpan();
    t.eq(cfg.adaptStartLevel, 4, 'media sotto 70%: livello scende di uno');

    cfg.adaptStartLevel = 5;
    session.rsAdaptBlock = [0.75, 0.8, 0.75, 0.8]; // media in zona neutra
    maybeAdaptRunningSpan();
    t.eq(cfg.adaptStartLevel, 5, 'media fra le due soglie: livello invariato');
  });

  t.group('maybeAdaptRunningSpan — un ciclo con posAcc alto ma contentAcc basso non fa salire il livello da solo (è la media che conta, non una sola delle due misure)', () => {
    cfg.adaptive = true; cfg.adaptStartLevel = 5;
    // posAcc sempre 1.0 (ottimo), contentAcc sempre 0.5 (mediocre) — media 0.75, in zona neutra
    session.rsAdaptBlock = [0.75, 0.75, 0.75, 0.75];
    maybeAdaptRunningSpan();
    t.eq(cfg.adaptStartLevel, 5, 'media 0.75 (fra le due misure): livello invariato, non sale solo perché una delle due era alta');
  });

  t.group('maybeAdaptRunningSpan — non supera mai i limiti 1-10', () => {
    cfg.adaptive = true; cfg.adaptStartLevel = 10;
    session.rsAdaptBlock = [1, 1, 1, 1];
    maybeAdaptRunningSpan();
    t.eq(cfg.adaptStartLevel, 10, 'già al livello massimo: non sale oltre 10');
    cfg.adaptStartLevel = 1;
    session.rsAdaptBlock = [0, 0, 0, 0];
    maybeAdaptRunningSpan();
    t.eq(cfg.adaptStartLevel, 1, 'già al livello minimo: non scende sotto 1');
    cfg.adaptive = false;
  });
};
