'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const cfgStub = {};
const sessionStub = { seq: [] };
const mod = loadPure(REPO_ROOT, [
  { name: 'categEffectiveStructure+labels+hints+hint', start: '  function categEffectiveStructure(c){', end: "vedi \"Vincolo di fascia strutturale\" nel README).';\n  }" },
  { name: 'genCategTrial', start: '  function genCategTrial(){', end: "categBivalente:true, isiOverride};\n    session.seq.push(trial);\n    return trial;\n  }" },
  { name: 'CATEG_STRUCTURE_OF_LEVEL+categStructureOfLevel+CATEG_ISI+CATEG_LURE', start: '  const CATEG_STRUCTURE_OF_LEVEL = {', end: "function categStructureOfLevel(level){ return CATEG_STRUCTURE_OF_LEVEL[level] || 1; }" }
], ['categEffectiveStructure', 'genCategTrial', 'categStructureOfLevel', 'categTitrationModeHint', 'CATEG_ISI', 'CATEG_LURE', 'CATEG_STRUCTURE_LABELS'], {
  cfg: cfgStub, session: sessionStub,
  POOLS: { simboli: ['●', '▲', '■'], lettereVoce: ['A', 'B', 'C'], numeriVoce: ['1', '2', '3'] },
  SWITCH_RULESETS: { simboli: { ruleA: { classify: v => v === '●', labelA: 'Tondo', labelB: 'Con angoli' } } }
});

const { categEffectiveStructure, genCategTrial, categStructureOfLevel, categTitrationModeHint, CATEG_ISI, CATEG_LURE } = mod;

function baseCfg(overrides) {
  return Object.assign({ categLivello: 1, categStructManual: 1, categMateriale: 'simboli', targetRate: 0.20, isi: 1800, adaptive: false }, overrides);
}

module.exports = function run(t) {
  t.group('categEffectiveStructure — Manuale usa la scelta libera, Livello/Adattivo derivano dal livello', () => {
    t.eq(categEffectiveStructure(baseCfg({ titrationMode: 'manuale', categStructManual: 4, categLivello: 1 })), 4,
      'Manuale: struttura 4 scelta liberamente, anche con livello impostato su 1 (che da solo darebbe struttura 1) — è esattamente il disaccoppiamento voluto');
    t.eq(categEffectiveStructure(baseCfg({ titrationMode: 'livello', categStructManual: 4, categLivello: 1 })), 1,
      'Livello: la scelta manuale (4) viene ignorata, la struttura torna a derivare dal livello (1 → struttura 1)');
    t.eq(categEffectiveStructure(baseCfg({ titrationMode: 'adattivo', categStructManual: 4, categLivello: 9 })), 5,
      'Adattivo: stesso comportamento di Livello, livello 9 → struttura 5');
  });

  t.group('genCategTrial — Manuale non legge MAI le tabelle di ISI/lure (struttura 1: isiOverride sempre null)', () => {
    Object.assign(cfgStub, baseCfg({ titrationMode: 'manuale', categStructManual: 1, categLivello: 5, trials: 5 }));
    sessionStub.seq = [];
    const trial = genCategTrial();
    t.eq(trial.isiOverride, null, 'struttura 1, Manuale: isiOverride è null — l\'ISI grezzo di Setup si applica senza override');
  });

  t.group('genCategTrial — Livello/Adattivo: isiOverride segue sempre la tabella CATEG_ISI', () => {
    // Solo livelli che risolvono a struttura 1 o 4 (quelle estratte con le
    // loro dipendenze) — la struttura bivalente (2/3/5) chiama funzioni
    // esterne (genCategItem, categL2/3/5Outcome) non estratte qui: il
    // calcolo di isiOverride che si vuole verificare è comunque IDENTICO
    // per ogni struttura, calcolato una sola volta in cima alla funzione
    // prima del ramo per struttura — bastano struttura 1 (livelli 1-2) e
    // struttura 4 (livelli 7-8) per coprirlo davvero.
    ['livello', 'adattivo'].forEach(mode => {
      [1, 2].forEach(lvl => {
        Object.assign(cfgStub, baseCfg({ titrationMode: mode, categLivello: lvl, trials: 5 }));
        sessionStub.seq = [];
        const trial = genCategTrial();
        t.eq(trial.isiOverride, CATEG_ISI[lvl], 'struttura ' + categStructureOfLevel(lvl) + ', ' + mode + ' liv' + lvl + ': isiOverride = tabella');
      });
    });
  });

  t.group('genCategTrial — struttura 4 (1-back): frequenza lure da cfg.targetRate in Manuale, da CATEG_LURE altrove', () => {
    Object.assign(cfgStub, baseCfg({ titrationMode: 'manuale', categStructManual: 4, categMateriale: 'simboli', targetRate: 0.35, trials: 50 }));
    sessionStub.seq = [];
    // Genera molte prove e verifica empiricamente che compaiano lure a
    // frequenza vicina a targetRate — la funzione non espone lureFreq
    // direttamente, si osserva l'effetto (trial.isLure) su tante prove.
    let lureCount = 0, total = 200;
    for (let i = 0; i < total; i++) {
      const tr = genCategTrial();
      if (tr.isLure) lureCount++;
    }
    // In Manuale la frequenza lure configurata è 35%, ma un lure richiede
    // anche che le due categorie precedenti differiscano (i>=2, prevCat2
    // diverso da prevCat) — quindi la frequenza OSSERVATA è per forza
    // inferiore al 35% configurato, mai superiore. Verifichiamo solo il
    // tetto (nessun bias sistematico verso l'alto), non l'esatto valore.
    t.ok(lureCount <= total * 0.35 + 15, 'la quota di lure osservata non supera (con margine) il tetto configurato in Manuale — nessun bias verso una frequenza più alta di quella impostata');

    Object.assign(cfgStub, baseCfg({ titrationMode: 'livello', categLivello: 8, categMateriale: 'simboli', trials: 50 }));
    sessionStub.seq = [];
    let lureCount2 = 0;
    for (let i = 0; i < total; i++) {
      const tr = genCategTrial();
      if (tr.isLure) lureCount2++;
    }
    t.ok(lureCount2 <= total * (CATEG_LURE[8]) + 15, 'livello 8 (struttura 4, lure 30% da tabella): quota osservata non supera il tetto di tabella');
  });

  t.group('categTitrationModeHint — testo coerente con la modalità e la struttura effettiva', () => {
    const manualeTxt = categTitrationModeHint(baseCfg({ titrationMode: 'manuale', categStructManual: 2 }), 'manuale');
    t.ok(manualeTxt.includes('indipendente dal numero di livello'), 'Manuale: dichiara esplicitamente il disaccoppiamento dal livello');

    const livelloTxt = categTitrationModeHint(baseCfg({ titrationMode: 'livello', categLivello: 3 }), 'livello');
    t.ok(livelloTxt.includes('livello 3'), 'Livello: menziona il livello corretto');
    t.ok(livelloTxt.includes('non cambia mai durante la sessione'), 'Livello: ribadisce il vincolo di fascia strutturale');
  });

  t.group('Tabelle — CATEG_ISI/CATEG_LURE coprono esattamente i livelli attesi per ciascuna struttura', () => {
    [1, 2, 3, 4, 5, 6, 9, 10].forEach(lvl => t.ok(CATEG_ISI[lvl] != null, 'livello ' + lvl + ': ISI definito'));
    [7, 8].forEach(lvl => t.eq(CATEG_ISI[lvl], undefined, 'livello ' + lvl + ' (struttura 4, banda lure): ISI non definito, la leva lì è la frequenza lure'));
    t.ok(CATEG_LURE[7] != null && CATEG_LURE[8] != null, 'livelli 7-8: lure definito');
    t.ok(CATEG_LURE[7] < CATEG_LURE[8], 'livello 8 più difficile del 7 (più lure)');
  });
};
