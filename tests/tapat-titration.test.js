'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const cfgStub = {};
const sessionStub = { seq: [] };
const mod = loadPure(REPO_ROOT, [
  { name: 'tapatTitrationModeHint', start: '  function tapatTitrationModeHint(c, mode){', end: "ma il livello si sposta da solo in base all\\'accuratezza.';\n  }" },
  { name: 'genTapatTrial', start: '  function genTapatTrial(){', end: 'return trial;\n  }' },
  { name: 'TAPAT_LEVELS', start: '  const TAPAT_LEVELS = {', end: '\n' }
], ['tapatTitrationModeHint', 'genTapatTrial', 'TAPAT_LEVELS'], {
  cfg: cfgStub, session: sessionStub,
  POOLS: { frecce: ['◀', '▶'] }
});

const { tapatTitrationModeHint, genTapatTrial, TAPAT_LEVELS } = mod;

function baseCfg(overrides) {
  return Object.assign({ stimType: 'frecce', trials: 20, tapatSpatial: false, tapatIsiMin: 900, tapatIsiMax: 1800 }, overrides);
}

module.exports = function run(t) {
  t.group('genTapatTrial — blocco tonico, Manuale: usa SEMPRE il range libero, mai la tabella', () => {
    Object.assign(cfgStub, baseCfg({ titrationMode: 'manuale', tapatIsiMin: 5000, tapatIsiMax: 6000 }));
    Object.assign(sessionStub, { seq: [], tapatLevel: 1 }); // livello 1 in tabella darebbe un range molto più basso (900-1800) — se il bug tornasse, lo vedremmo qui
    let minSeen = Infinity, maxSeen = -Infinity;
    for (let i = 0; i < 300; i++) {
      const tr = genTapatTrial();
      if (tr.block === 'tonic') { minSeen = Math.min(minSeen, tr.isiOverride); maxSeen = Math.max(maxSeen, tr.isiOverride); }
    }
    t.ok(minSeen >= 5000, 'nessun intervallo tonico generato sotto il minimo libero impostato (5000ms), anche con session.tapatLevel a 1');
    t.ok(maxSeen <= 6000, 'nessun intervallo tonico generato sopra il massimo libero impostato (6000ms)');
  });

  t.group('genTapatTrial — blocco tonico, Livello/Adattivo: risolvono IDENTICAMENTE alla tabella TAPAT_LEVELS', () => {
    ['livello', 'adattivo'].forEach(mode => {
      [1, 5, 10].forEach(lvl => {
        Object.assign(cfgStub, baseCfg({ titrationMode: mode, tapatIsiMin: 99999, tapatIsiMax: 99999 })); // valori "manuali" volutamente assurdi: se venissero letti per errore, il test li scoprirebbe
        Object.assign(sessionStub, { seq: [], tapatLevel: lvl });
        const range = TAPAT_LEVELS[lvl];
        let minSeen = Infinity, maxSeen = -Infinity;
        for (let i = 0; i < 300; i++) {
          const tr = genTapatTrial();
          if (tr.block === 'tonic') { minSeen = Math.min(minSeen, tr.isiOverride); maxSeen = Math.max(maxSeen, tr.isiOverride); }
        }
        t.ok(minSeen >= range[0] - 1, mode + ' liv' + lvl + ': intervallo minimo osservato coerente con la tabella (' + range[0] + 'ms), non col valore manuale');
        t.ok(maxSeen <= range[1] + 1, mode + ' liv' + lvl + ': intervallo massimo osservato coerente con la tabella (' + range[1] + 'ms), non col valore manuale');
      });
    });
  });

  t.group('genTapatTrial — blocco fasico: SEMPRE isiOverride null, in ogni modalità (mai stato legato al livello)', () => {
    ['manuale', 'livello', 'adattivo'].forEach(mode => {
      Object.assign(cfgStub, baseCfg({ titrationMode: mode, trials: 4 }));
      Object.assign(sessionStub, { seq: [{}, {}, {}], tapatLevel: 5 }); // già oltre la metà (half=2 su trials=4) → blocco fasico
      const tr = genTapatTrial();
      t.eq(tr.block, 'phasic', mode + ': siamo nel blocco fasico come atteso');
      t.eq(tr.isiOverride, null, mode + ': blocco fasico, isiOverride sempre null — usa il campo ISI generico di Setup');
    });
  });

  t.group('tapatTitrationModeHint — testo coerente con la risoluzione reale', () => {
    const manualeTxt = tapatTitrationModeHint(baseCfg({ tapatIsiMin: 3000, tapatIsiMax: 7000, tapatStartLevel: 1 }), 'manuale');
    t.ok(manualeTxt.includes('3.00') && manualeTxt.includes('7.00'), 'Manuale: mostra il range libero impostato');

    const livelloTxt = tapatTitrationModeHint(baseCfg({ tapatStartLevel: 5 }), 'livello');
    const r = TAPAT_LEVELS[5];
    t.ok(livelloTxt.includes((r[0] / 1000).toFixed(2)) && livelloTxt.includes((r[1] / 1000).toFixed(2)), 'Livello: mostra il range di tabella corretto per il livello 5');
  });
};
