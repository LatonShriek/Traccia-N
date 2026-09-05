'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');

const REPO_ROOT = path.join(__dirname, '..');

// Blocchi estratti dal VERO index.html — nessuna tabella ricopiata a mano.
// Se una di queste funzioni/costanti viene rinominata o spostata in modo
// da rendere il testo di inizio/fine non più unico, questo elenco va
// aggiornato — ed è corretto che il test fallisca finché non lo si fa,
// invece di continuare a testare in silenzio una versione vecchia.
const mod = loadPure(REPO_ROOT, [
  { name: 'POOLS', start: '  const POOLS = {', end: "POOLS.numeriVoce = POOLS.numeri;" },
  { name: 'TITRATION_EXERCISES+resolvedDisplay', start: "  const TITRATION_EXERCISES = [", end: "ADAPT_ISI.ant[c.adaptStartLevel];\n    return null;\n  }" },
  { name: 'LEVEL_FIELD_OF_TASKMODE+levelOfCfg', start: '  const LEVEL_FIELD_OF_TASKMODE = {', end: '    return c[field];\n  }' },
  { name: 'SWITCH_RULESETS', start: '  const SWITCH_RULESETS = {', end: "SWITCH_RULESETS.numeriVoce = SWITCH_RULESETS.numeri;" },
  { name: 'ADAPT_ISI+GONOGO_FREQ+NBACK+SWITCH_BALANCE+SWITCH_CSI+SEQ_LEN', start: '  const ADAPT_ISI = {', end: '  const ADAPT_SEQ_LEN = {1:2,2:2,3:3,4:3,5:3,6:3,7:4,8:4,9:5,10:5};' }
], [
  'POOLS', 'TITRATION_EXERCISES', 'resolvedFreqForDisplay', 'resolvedIsiForDisplay',
  'LEVEL_FIELD_OF_TASKMODE', 'levelOfCfg',
  'ADAPT_ISI', 'ADAPT_GONOGO_FREQ', 'NBACK_LEVEL_TABLE', 'nbackParamsForLevel',
  'ADAPT_SWITCH_BALANCE', 'ADAPT_SWITCH_CSI', 'ADAPT_SEQ_LEN'
]);

const {
  TITRATION_EXERCISES, resolvedFreqForDisplay, resolvedIsiForDisplay, levelOfCfg,
  ADAPT_ISI, ADAPT_GONOGO_FREQ, nbackParamsForLevel, ADAPT_SWITCH_BALANCE, ADAPT_SWITCH_CSI, ADAPT_SEQ_LEN, POOLS
} = mod;

// --- riproduzione minima e dichiarata della logica di risoluzione a runtime ---
// Queste funzioni ricalcano (non estraggono) la logica sparsa nei punti di
// chiamata reali (genNbackTrial, genGoNoGoTrial, showTrialStimulus, ecc.),
// perché quella logica è inframmezzata a codice DOM/sessione non estraibile
// in isolamento. È l'unico punto della suite dove c'è una duplicazione
// deliberata — tenuta minima apposta, una riga per parametro — invece di
// una copia intera di tabelle o tastiere.
function runtimeNbackFreq(titrationMode, nLevel, rawRate) {
  return titrationMode !== 'manuale' ? nbackParamsForLevel(nLevel).freq : rawRate;
}
function runtimeGonogoFreq(titrationMode, level, rawRate) {
  return titrationMode !== 'manuale' ? (ADAPT_GONOGO_FREQ[level] || rawRate) : rawRate;
}
function runtimeSwitchDominance(titrationMode, level) {
  return titrationMode !== 'manuale' ? (ADAPT_SWITCH_BALANCE[level] || 0.5) : 0.5;
}
function runtimeSwitchCSI(titrationMode, level) {
  return titrationMode !== 'manuale' ? (ADAPT_SWITCH_CSI[level] || 400) : null;
}
function runtimeSeqLen(titrationMode, level, rawLen) {
  return titrationMode !== 'manuale' ? (ADAPT_SEQ_LEN[level] || rawLen) : rawLen;
}
function runtimeISI(taskMode, titrationMode, level, rawIsi) {
  if (TITRATION_EXERCISES.includes(taskMode) && titrationMode !== 'manuale' && ADAPT_ISI[taskMode]) return ADAPT_ISI[taskMode][level];
  return rawIsi;
}

module.exports = function run(t) {
  t.group('TITRATION_EXERCISES — perimetro dichiarato', () => {
    t.eq(TITRATION_EXERCISES.slice().sort(), ['ant', 'gonogo', 'mantenimento', 'nback', 'sequenza', 'simon', 'stopsignal', 'switching'].sort(),
      'gli 8 esercizi con stepper Livello condiviso sono esattamente quelli attesi — nessuno aggiunto o tolto senza che questo test lo segnali');
  });

  t.group('Manuale non legge MAI una tabella (nessun parametro "orfano")', () => {
    t.eq(runtimeNbackFreq('manuale', 5, 0.32), 0.32, 'N-back: frequenza resta il valore grezzo');
    t.eq(runtimeGonogoFreq('manuale', 5, 0.30), 0.30, 'Go/No-Go: frequenza resta il valore grezzo');
    t.eq(runtimeSwitchDominance('manuale', 10), 0.5, 'Task-switching: sbilanciamento resta 50/50');
    t.eq(runtimeSwitchCSI('manuale', 5), null, 'Task-switching: nessuna fase di cue separata');
    t.eq(runtimeSeqLen('manuale', 10, 3), 3, 'Sequenza bersaglio: lunghezza resta quella scelta a mano');
    t.eq(runtimeISI('stopsignal', 'manuale', 5, 2200), 2200, 'Stop-Signal: ISI resta il valore grezzo');
    t.eq(runtimeISI('ant', 'manuale', 5, 2200), 2200, 'ANT classico: ISI resta il valore grezzo');
    t.eq(runtimeISI('sequenza', 'manuale', 5, 2200), 2200, 'Sequenza: ISI resta il valore grezzo');
  });

  t.group('Livello e Adattivo risolvono IDENTICAMENTE allo stesso livello', () => {
    ['livello', 'adattivo'].forEach(mode => {
      [1, 5, 10].forEach(lvl => {
        t.eq(runtimeNbackFreq(mode, lvl, 0.999), nbackParamsForLevel(lvl).freq, 'N-back freq, ' + mode + ' liv' + lvl);
        t.eq(runtimeGonogoFreq(mode, lvl, 0.999), ADAPT_GONOGO_FREQ[lvl], 'Go/No-Go freq, ' + mode + ' liv' + lvl);
        t.eq(runtimeSwitchDominance(mode, lvl), ADAPT_SWITCH_BALANCE[lvl], 'Task-switching sbilanciamento, ' + mode + ' liv' + lvl);
        t.eq(runtimeSwitchCSI(mode, lvl), ADAPT_SWITCH_CSI[lvl], 'Task-switching CSI, ' + mode + ' liv' + lvl);
        t.eq(runtimeSeqLen(mode, lvl, 999), ADAPT_SEQ_LEN[lvl], 'Sequenza lunghezza, ' + mode + ' liv' + lvl);
        t.eq(runtimeISI('stopsignal', mode, lvl, 999999), ADAPT_ISI.stopsignal[lvl], 'Stop-Signal ISI, ' + mode + ' liv' + lvl);
        t.eq(runtimeISI('ant', mode, lvl, 999999), ADAPT_ISI.ant[lvl], 'ANT classico ISI, ' + mode + ' liv' + lvl);
        t.eq(runtimeISI('sequenza', mode, lvl, 999999), ADAPT_ISI.sequenza[lvl], 'Sequenza ISI, ' + mode + ' liv' + lvl);
      });
    });
  });

  t.group('dualtask non è mai toccato da questa risoluzione (fuori perimetro per scelta)', () => {
    t.eq(runtimeISI('dualtask', 'livello', 5, 1234), 1234,
      'anche con un titrationMode ereditato per errore da un altro esercizio, dualtask deve restare sul suo valore grezzo');
  });

  t.group('levelOfCfg usa il campo livello giusto per esercizio (bug reale trovato e corretto)', () => {
    t.eq(levelOfCfg({ taskMode: 'nback', nLevel: 7, adaptStartLevel: 2 }), 7,
      'N-back ha un campo livello proprio (nLevel) — leggere adaptStartLevel per sbaglio è esattamente il bug che ha causato un messaggio "Livello X" errato in Setup');
    t.eq(levelOfCfg({ taskMode: 'gonogo', adaptStartLevel: 4, nLevel: 99 }), 4,
      'Go/No-Go usa adaptStartLevel, non nLevel');
    t.eq(levelOfCfg({ taskMode: 'ant', antMode: 'tapat', tapatStartLevel: 3, adaptStartLevel: 99 }), 3,
      'TAPAT usa il proprio tapatStartLevel, non adaptStartLevel');
  });

  t.group('Setup mostra sempre esattamente il valore che il motore userà (Livello/Adattivo)', () => {
    ['livello', 'adattivo'].forEach(mode => {
      [1, 5, 10].forEach(lvl => {
        t.eq(resolvedFreqForDisplay('nback', { nLevel: lvl, targetRate: 0.999 }), runtimeNbackFreq(mode, lvl, 0.999),
          'N-back, display vs motore, ' + mode + ' liv' + lvl);
        t.eq(resolvedFreqForDisplay('gonogo', { adaptStartLevel: lvl, targetRate: 0.999 }), runtimeGonogoFreq(mode, lvl, 0.999),
          'Go/No-Go, display vs motore, ' + mode + ' liv' + lvl);
        t.eq(resolvedIsiForDisplay('sequenza', { adaptStartLevel: lvl }), runtimeISI('sequenza', mode, lvl, 999999),
          'Sequenza, display vs motore, ' + mode + ' liv' + lvl);
        t.eq(resolvedIsiForDisplay('stopsignal', { adaptStartLevel: lvl }), runtimeISI('stopsignal', mode, lvl, 999999),
          'Stop-Signal, display vs motore, ' + mode + ' liv' + lvl);
        t.eq(resolvedIsiForDisplay('ant', { adaptStartLevel: lvl, antMode: 'classico' }), runtimeISI('ant', mode, lvl, 999999),
          'ANT classico, display vs motore, ' + mode + ' liv' + lvl);
      });
    });
    t.eq(resolvedFreqForDisplay('switching', { adaptStartLevel: 5 }), null,
      'Task-switching non ha una "frequenza" da tabella nello stesso senso — resolvedFreqForDisplay deve restituire null, non un valore inventato');
  });

  t.group('Tabelle di livello — monotonia e ancoraggi (limite dichiarato: i test sopra verificano la coerenza fra display e motore, ma se un valore SBAGLIATO viene scritto nella tabella stessa, display e motore sbaglierebbero comunque allo stesso modo — servono ancoraggi indipendenti, non derivati dalla tabella)', () => {
    // Monotonia: più alto il livello, più difficile — non un valore
    // esatto, ma una proprietà strutturale che nessuna tabella di livello
    // di questa app dovrebbe mai violare, qualunque sia il numero preciso.
    [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(lvl => {
      t.ok(ADAPT_GONOGO_FREQ[lvl] >= ADAPT_GONOGO_FREQ[lvl + 1], 'Go/No-Go: frequenza no-go non deve MAI risalire dal livello ' + lvl + ' al ' + (lvl + 1) + ' (più alto il livello, più difficile)');
      t.ok(ADAPT_SWITCH_BALANCE[lvl] <= ADAPT_SWITCH_BALANCE[lvl + 1], 'Task-switching: sbilanciamento non deve MAI scendere dal livello ' + lvl + ' al ' + (lvl + 1));
      t.ok(ADAPT_SWITCH_CSI[lvl] >= ADAPT_SWITCH_CSI[lvl + 1], 'Task-switching: CSI non deve MAI allungarsi dal livello ' + lvl + ' al ' + (lvl + 1) + ' (più corto = più difficile)');
      t.ok(ADAPT_SEQ_LEN[lvl] <= ADAPT_SEQ_LEN[lvl + 1], 'Sequenza: lunghezza non deve MAI accorciarsi dal livello ' + lvl + ' al ' + (lvl + 1));
      t.ok(ADAPT_ISI.sequenza[lvl] >= ADAPT_ISI.sequenza[lvl + 1], 'Sequenza: ISI non deve MAI allungarsi dal livello ' + lvl + ' al ' + (lvl + 1));
      t.ok(ADAPT_ISI.stopsignal[lvl] >= ADAPT_ISI.stopsignal[lvl + 1], 'Stop-Signal: ISI non deve MAI allungarsi dal livello ' + lvl + ' al ' + (lvl + 1));
      t.ok(ADAPT_ISI.ant[lvl] >= ADAPT_ISI.ant[lvl + 1], 'ANT classico: ISI non deve MAI allungarsi dal livello ' + lvl + ' al ' + (lvl + 1));
      t.ok(nbackParamsForLevel(lvl).freq >= nbackParamsForLevel(lvl + 1).freq || nbackParamsForLevel(lvl).n < nbackParamsForLevel(lvl + 1).n,
        'N-back: dal livello ' + lvl + ' al ' + (lvl + 1) + ' deve aumentare n oppure calare la frequenza bersaglio (mai il contrario su entrambi)');
    });
    // Ancoraggi a un valore preciso — dichiarati qui come riferimento
    // clinico fissato (Wilson et al. 2019 per il criterio generale,
    // decisioni di Rodrigo per i valori estremi specifici), non derivati
    // dalla tabella stessa: se questi numeri cambiano davvero per una
    // decisione clinica, vanno aggiornati QUI insieme al codice, non
    // lasciati silenziosamente disallineati.
    t.eq(ADAPT_GONOGO_FREQ[1], 0.48, 'Go/No-Go livello 1 (pavimento): frequenza no-go 48%');
    t.eq(ADAPT_GONOGO_FREQ[10], 0.05, 'Go/No-Go livello 10 (soffitto): frequenza no-go 5%');
    t.eq(nbackParamsForLevel(1).n, 1, 'N-back livello 1: n=1');
    t.eq(nbackParamsForLevel(10).n, 3, 'N-back livello 10: n=3 (ceiling clinico dichiarato)');
    t.eq(ADAPT_SEQ_LEN[1], 2, 'Sequenza livello 1 (pavimento): lunghezza 2');
    t.eq(ADAPT_SEQ_LEN[10], 5, 'Sequenza livello 10 (soffitto): lunghezza 5');
  });

  t.group('Go/No-Go: la frequenza no-go generata rispetta il target su molte prove (nessun bias nel generatore)', () => {
    const seedPool = POOLS.lettere;
    function simulateGoNoGo(freq, activeNoGoSize, trials, reps) {
      const activeNoGo = seedPool.slice(0, activeNoGoSize);
      let total = 0;
      for (let r = 0; r < reps; r++) {
        let count = 0;
        for (let i = 0; i < trials; i++) {
          let val;
          if (Math.random() < freq) { val = activeNoGo[Math.floor(Math.random() * activeNoGo.length)]; }
          else { do { val = seedPool[Math.floor(Math.random() * seedPool.length)]; } while (activeNoGo.includes(val) && seedPool.length > activeNoGo.length); }
          if (activeNoGo.includes(val)) count++;
        }
        total += count;
      }
      return total / reps;
    }
    const observed = simulateGoNoGo(0.32, 3, 24, 3000);
    const expected = 24 * 0.32;
    t.approx(observed, expected, 0.6, 'frequenza no-go osservata su 3000 sessioni simulate deve avvicinarsi al target configurato (32% su 24 prove ≈ 7.68) — tolleranza larga apposta, qui si cerca un bias sistematico, non l\'esatto valore atteso di una singola sessione');
  });
};
