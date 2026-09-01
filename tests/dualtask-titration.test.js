'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const mod = loadPure(REPO_ROOT, [
  { name: 'ADAPT_ISI', start: '  const ADAPT_ISI = {', end: '\n  };' },
  { name: 'ADAPT_DUAL_FREQ+ADAPT_DUAL_LURE', start: '  const ADAPT_DUAL_FREQ = {', end: '  const ADAPT_DUAL_LURE = {1:0,2:0.05,3:0.10,4:0.15,5:0.19,6:0.23,7:0.27,8:0.31,9:0.35,10:0.40};' },
  { name: 'dualTitrationModeHint', start: '  function dualTitrationModeHint(c, mode){', end: "l\\'ISI condiviso segue la media dei due, aggiornata di conseguenza).';\n  }" }
], ['ADAPT_ISI', 'ADAPT_DUAL_FREQ', 'ADAPT_DUAL_LURE', 'dualTitrationModeHint']);

const { ADAPT_ISI, ADAPT_DUAL_FREQ, ADAPT_DUAL_LURE, dualTitrationModeHint } = mod;

// Ricalca (non estrae) la risoluzione di freq1/freq2 in genDualTaskTrial —
// stessa scelta già fatta per gli altri esercizi: la funzione vera è
// immersa in un generatore di prove troppo complesso da isolare per
// intero, la logica di risoluzione (poche righe) si verifica meglio così,
// tenendo la duplicazione minima e dichiarata.
function runtimeFreq(titrationMode, dualLevel, rawTargetRate) {
  return titrationMode !== 'manuale' ? (ADAPT_DUAL_FREQ[dualLevel] || rawTargetRate) : rawTargetRate;
}
function runtimeAvgIsi(titrationMode, dualLevel1, dualLevel2, rawIsi) {
  if (titrationMode === 'manuale') return rawIsi;
  const avgLevel = Math.max(1, Math.min(10, Math.round((dualLevel1 + dualLevel2) / 2)));
  return ADAPT_ISI.dualtask[avgLevel];
}

module.exports = function run(t) {
  t.group('Manuale non legge mai la tabella, su NESSUNO dei due canali', () => {
    t.eq(runtimeFreq('manuale', 7, 0.30), 0.30, 'canale 1: resta il valore grezzo indipendentemente dal livello');
    t.eq(runtimeFreq('manuale', 2, 0.18), 0.18, 'canale 2 (livello diverso dal canale 1): resta comunque il valore grezzo');
    t.eq(runtimeAvgIsi('manuale', 3, 9, 2500), 2500, 'ISI condiviso resta il valore grezzo, ignora la media dei livelli');
  });

  t.group('Livello e Adattivo risolvono IDENTICAMENTE, indipendentemente per canale', () => {
    ['livello', 'adattivo'].forEach(mode => {
      [1, 5, 10].forEach(lvl => {
        t.eq(runtimeFreq(mode, lvl, 0.999), ADAPT_DUAL_FREQ[lvl], 'canale, ' + mode + ' liv' + lvl);
      });
      t.eq(runtimeFreq(mode, 2, 0.99), ADAPT_DUAL_FREQ[2], mode + ': canale a livello 2 non risente del livello dell\'altro canale');
      t.eq(runtimeFreq(mode, 9, 0.99), ADAPT_DUAL_FREQ[9], mode + ': canale a livello 9 non risente del livello dell\'altro canale');
    });
  });

  t.group('ISI condiviso — deriva dalla MEDIA dei due livelli, non da uno solo', () => {
    ['livello', 'adattivo'].forEach(mode => {
      t.eq(runtimeAvgIsi(mode, 5, 5, 9999), ADAPT_ISI.dualtask[5], 'due canali allo stesso livello: media = quel livello');
      t.eq(runtimeAvgIsi(mode, 2, 8, 9999), ADAPT_ISI.dualtask[5], 'canali a 2 e 8: media arrotondata a 5');
      t.eq(runtimeAvgIsi(mode, 1, 2, 9999), ADAPT_ISI.dualtask[2], 'media 1.5 arrotonda a 2 (Math.round)');
      t.eq(runtimeAvgIsi(mode, 1, 1, 9999), ADAPT_ISI.dualtask[1], 'entrambi al pavimento: ISI al pavimento');
      t.eq(runtimeAvgIsi(mode, 10, 10, 9999), ADAPT_ISI.dualtask[10], 'entrambi al soffitto: ISI al soffitto');
    });
  });

  t.group('Tabelle — monotonia (più livello, più difficile)', () => {
    for (let lvl = 1; lvl < 10; lvl++) {
      t.ok(ADAPT_DUAL_FREQ[lvl] >= ADAPT_DUAL_FREQ[lvl + 1], 'frequenza target non deve MAI salire dal livello ' + lvl + ' al ' + (lvl + 1));
      t.ok(ADAPT_DUAL_LURE[lvl] <= ADAPT_DUAL_LURE[lvl + 1], 'frequenza lure non deve MAI calare dal livello ' + lvl + ' al ' + (lvl + 1) + ' (più interferenza = più difficile)');
      t.ok(ADAPT_ISI.dualtask[lvl] >= ADAPT_ISI.dualtask[lvl + 1], 'ISI condiviso non deve MAI allungarsi dal livello ' + lvl + ' al ' + (lvl + 1));
    }
  });

  t.group('dualTitrationModeHint — un solo testo per entrambi i canali, coerente con la risoluzione reale', () => {
    const c = { dualStartLevel1: 3, dualStartLevel2: 8, isi: 1800 };
    const manualeTxt = dualTitrationModeHint(c, 'manuale');
    t.ok(manualeTxt.includes('1.8'), 'Manuale: mostra l\'ISI grezzo impostato, non uno derivato dai livelli');

    const livelloTxt = dualTitrationModeHint(c, 'livello');
    const avg = Math.round((3 + 8) / 2);
    t.ok(livelloTxt.includes(String(avg)), 'Livello: menziona il livello medio corretto (' + avg + ') usato per l\'ISI condiviso');
    t.ok(livelloTxt.includes(Math.round(ADAPT_DUAL_FREQ[3] * 100) + '%'), 'Livello: menziona la frequenza corretta del canale 1 (livello 3)');
    t.ok(livelloTxt.includes(Math.round(ADAPT_DUAL_FREQ[8] * 100) + '%'), 'Livello: menziona la frequenza corretta del canale 2 (livello 8)');

    const adattivoTxt = dualTitrationModeHint(c, 'adattivo');
    t.ok(adattivoTxt.includes('3/8'), 'Adattivo: mostra i livelli di partenza di entrambi i canali');
    t.ok(adattivoTxt.includes('indipendente'), 'Adattivo: chiarisce che i due canali si muovono in modo indipendente, non insieme');
  });
};
