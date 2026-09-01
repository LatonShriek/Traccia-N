'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const cfgStub = {};
const sessionStub = {};
const mod = loadPure(REPO_ROOT, [
  { name: 'neglectSubLevelForDisplay+neglectTitrationModeHint', start: '  function neglectSubLevelForDisplay(c){', end: "'accuratezza.';\n  }" },
  { name: 'neglectProgressivaPhase+currentNeglectEffMode+neglectBoardSubLevel', start: '  function neglectProgressivaPhase(absLevel){', end: "return cfg.titrationMode!=='manuale' ? (session && session.liveBoardLevel) : cfg.neglectStartLevel;\n  }" },
  { name: 'ADAPT_NEGLECT_SIZE', start: '  const ADAPT_NEGLECT_SIZE = {', end: '\n' },
  { name: 'ADAPT_NEGLECT_TIME', start: '  const ADAPT_NEGLECT_TIME = {', end: '\n' }
], ['neglectProgressivaPhase', 'neglectBoardSubLevel', 'neglectSubLevelForDisplay', 'ADAPT_NEGLECT_SIZE', 'ADAPT_NEGLECT_TIME'], { cfg: cfgStub, session: sessionStub });

const { neglectProgressivaPhase, neglectBoardSubLevel, neglectSubLevelForDisplay, ADAPT_NEGLECT_SIZE, ADAPT_NEGLECT_TIME } = mod;

module.exports = function run(t) {
  t.group('neglectProgressivaPhase — traduzione livello assoluto 1-30 → fase + sotto-livello', () => {
    t.eq(neglectProgressivaPhase(1), { mode: 'classico', subLevel: 1 }, 'livello 1 → Classico, sotto-livello 1');
    t.eq(neglectProgressivaPhase(10), { mode: 'classico', subLevel: 10 }, 'livello 10 → ancora Classico, sotto-livello 10 (pavimento della fase)');
    t.eq(neglectProgressivaPhase(11), { mode: 'intruso', subLevel: 1 }, 'livello 11 → Intruso riparte da sotto-livello 1');
    t.eq(neglectProgressivaPhase(20), { mode: 'intruso', subLevel: 10 }, 'livello 20 → fine Intruso');
    t.eq(neglectProgressivaPhase(21), { mode: 'regola', subLevel: 1 }, 'livello 21 → Regola riparte da sotto-livello 1');
    t.eq(neglectProgressivaPhase(30), { mode: 'regola', subLevel: 10 }, 'livello 30 → soffitto assoluto');
  });

  t.group('neglectBoardSubLevel — Manuale non legge mai session.liveBoardLevel', () => {
    Object.assign(cfgStub, { neglectMode: 'classico', titrationMode: 'manuale', neglectStartLevel: 4 });
    Object.assign(sessionStub, { liveBoardLevel: 9 }); // valore "vivo" molto diverso, non deve mai essere letto in manuale
    t.eq(neglectBoardSubLevel(), 4, 'classico manuale: usa neglectStartLevel, ignora session.liveBoardLevel');

    Object.assign(cfgStub, { neglectMode: 'regola', titrationMode: 'manuale', neglectRuleLevel: 6 });
    t.eq(neglectBoardSubLevel(), 6, 'regola manuale: usa neglectRuleLevel, non session');

    Object.assign(cfgStub, { neglectMode: 'progressiva', titrationMode: 'manuale', neglectStartLevel: 15 });
    t.eq(neglectBoardSubLevel(), 5, 'progressiva manuale: usa neglectStartLevel (15 → fase Intruso, sotto-livello 5), non session');
  });

  t.group('neglectBoardSubLevel — Livello e Adattivo risolvono IDENTICAMENTE, leggendo session.liveBoardLevel', () => {
    ['livello', 'adattivo'].forEach(mode => {
      Object.assign(cfgStub, { neglectMode: 'classico', titrationMode: mode, neglectStartLevel: 1 });
      Object.assign(sessionStub, { liveBoardLevel: 7 });
      t.eq(neglectBoardSubLevel(), 7, 'classico ' + mode + ': segue session.liveBoardLevel, non neglectStartLevel');

      Object.assign(cfgStub, { neglectMode: 'regola', titrationMode: mode, neglectRuleLevel: 1 });
      Object.assign(sessionStub, { liveBoardLevel: 3 });
      t.eq(neglectBoardSubLevel(), 3, 'regola ' + mode + ': segue session.liveBoardLevel, non neglectRuleLevel');

      Object.assign(cfgStub, { neglectMode: 'progressiva', titrationMode: mode, neglectStartLevel: 1 });
      Object.assign(sessionStub, { liveBoardLevel: 25 }); // fase Regola, sotto-livello 5
      t.eq(neglectBoardSubLevel(), 5, 'progressiva ' + mode + ': traduce session.liveBoardLevel (25 → Regola/5), non neglectStartLevel');
    });
  });

  t.group('Tabelle ADAPT_NEGLECT_SIZE/TIME — monotonia (più livello, più difficile)', () => {
    for (let lvl = 1; lvl < 10; lvl++) {
      t.ok(ADAPT_NEGLECT_SIZE[lvl] <= ADAPT_NEGLECT_SIZE[lvl + 1], 'dimensione tavola non deve MAI calare dal livello ' + lvl + ' al ' + (lvl + 1));
      t.ok(ADAPT_NEGLECT_TIME[lvl] === 0 || ADAPT_NEGLECT_TIME[lvl + 1] === 0 || ADAPT_NEGLECT_TIME[lvl] >= ADAPT_NEGLECT_TIME[lvl + 1], 'tempo limite non deve MAI allungarsi dal livello ' + lvl + ' al ' + (lvl + 1) + ' (0 = nessun limite, escluso dal confronto)');
    }
    t.eq(ADAPT_NEGLECT_SIZE[1], 14, 'livello 1 (pavimento): 14 elementi per tavola');
    t.eq(ADAPT_NEGLECT_SIZE[10], 85, 'livello 10 (soffitto): 85 elementi per tavola');
  });

  t.group('neglectSubLevelForDisplay — coerente con neglectBoardSubLevel per la trasparenza in Setup', () => {
    t.eq(neglectSubLevelForDisplay({ neglectMode: 'classico', neglectStartLevel: 6 }), 6, 'classico: legge neglectStartLevel');
    t.eq(neglectSubLevelForDisplay({ neglectMode: 'regola', neglectRuleLevel: 8 }), 8, 'regola: legge neglectRuleLevel, non neglectStartLevel');
    t.eq(neglectSubLevelForDisplay({ neglectMode: 'progressiva', neglectStartLevel: 25 }), 5, 'progressiva: traduce il livello assoluto (25 → sotto-livello 5)');
  });
};
