'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// cfg come variabile libera, stesso approccio degli altri test — mutata
// prima di ogni chiamata invece che passata come argomento.
const cfg = { taskMode: 'categorizzazione', categSecondaria: 'colore', switchSecondaria: 'colore', trials: 10, targetRate: 0.3, titrationMode: 'manuale' };

const mod = loadPure(REPO_ROOT, [
  { name: 'POOLS', start: '  const POOLS = {', end: 'POOLS.numeriVoce = POOLS.numeri;' },
  { name: 'SWITCH_RULESETS+switchRulesetFor+buildSwitching', start: '  const SWITCH_RULESETS = {', end: "    return seq;\n  }" },
  { name: 'CATEG_LETTERE+NUMERI+genCategItem+outcomes', start: '  const CATEG_LETTERE', end: "    return categDim2IsA(item) ? 'z' : 'm';\n  }" }
], ['switchRulesetFor', 'buildSwitching', 'genCategItem', 'categDim2IsA', 'categL2Outcome', 'categL3Outcome', 'categL5Outcome'], { cfg, POOLS: null });

const { switchRulesetFor, buildSwitching, genCategItem, categDim2IsA, categL2Outcome, categL3Outcome, categL5Outcome } = mod;

module.exports = function run(t) {
  t.group('categDim2IsA — legge la dimensione giusta a seconda di cosa è impostato sull\'item', () => {
    t.eq(categDim2IsA({ colore: 'nero' }), true, 'colore nero → polo A');
    t.eq(categDim2IsA({ colore: 'rosso' }), false, 'colore rosso → polo B');
    t.eq(categDim2IsA({ tono: 'grave' }), true, 'tono grave → polo A (stessa polarità del colore nero)');
    t.eq(categDim2IsA({ tono: 'acuto' }), false, 'tono acuto → polo B (stessa polarità del colore rosso)');
  });

  t.group('genCategItem — genera SEMPRE esattamente una delle due dimensioni, mai entrambe né nessuna', () => {
    cfg.categSecondaria = 'colore';
    for (let i = 0; i < 200; i++) {
      const item = genCategItem();
      t.ok(item.colore === 'nero' || item.colore === 'rosso', 'con categSecondaria=colore: item.colore sempre valorizzato');
      t.eq(item.tono, undefined, 'con categSecondaria=colore: item.tono resta non impostato');
    }
    cfg.categSecondaria = 'tono';
    for (let i = 0; i < 200; i++) {
      const item = genCategItem();
      t.ok(item.tono === 'grave' || item.tono === 'acuto', 'con categSecondaria=tono: item.tono sempre valorizzato');
      t.eq(item.colore, undefined, 'con categSecondaria=tono: item.colore resta non impostato');
    }
    cfg.categSecondaria = 'colore';
  });

  t.group('categL2/L3/L5Outcome — stesso esito logico usando tono o colore per la stessa polarità (equivalenza fra le due dimensioni)', () => {
    const combos = [
      { tipo: 'lettera', colore: 'nero' }, { tipo: 'lettera', colore: 'rosso' },
      { tipo: 'numero', colore: 'nero' }, { tipo: 'numero', colore: 'rosso' }
    ];
    combos.forEach(item => {
      const itemTono = { tipo: item.tipo, tono: item.colore === 'nero' ? 'grave' : 'acuto' };
      t.eq(categL2Outcome(itemTono), categL2Outcome(item), 'L2: ' + item.tipo + '/' + item.colore + ' — stesso esito con tono equivalente');
      t.eq(categL3Outcome(itemTono), categL3Outcome(item), 'L3: ' + item.tipo + '/' + item.colore + ' — stesso esito con tono equivalente');
      t.eq(categL5Outcome(itemTono), categL5Outcome(item), 'L5: ' + item.tipo + '/' + item.colore + ' — stesso esito con tono equivalente');
    });
    // Valori concreti per L2/L3/L5, presi dal comportamento originale
    // (prima dell'introduzione del tono) — nessuna regressione sul caso colore.
    t.eq(categL2Outcome({ tipo: 'lettera', colore: 'nero' }), 'a', 'L2: lettera nera → a');
    t.eq(categL2Outcome({ tipo: 'lettera', colore: 'rosso' }), 'nogo', 'L2: lettera rossa → nogo');
    t.eq(categL2Outcome({ tipo: 'numero', colore: 'rosso' }), 'b', 'L2: numero rosso → b');
    t.eq(categL2Outcome({ tipo: 'numero', colore: 'nero' }), 'c', 'L2: numero nero → c');
    t.eq(categL3Outcome({ tipo: 'lettera', colore: 'nero' }), 'a', 'L3: lettera nera → a');
    t.eq(categL3Outcome({ tipo: 'numero', colore: 'rosso' }), 'a', 'L3: numero rosso → a (regola disgiuntiva)');
    t.eq(categL3Outcome({ tipo: 'lettera', colore: 'rosso' }), 'b', 'L3: lettera rossa → b');
    t.eq(categL5Outcome({ tipo: 'lettera', colore: 'nero' }), 'a', 'L5: lettera nera → a');
    t.eq(categL5Outcome({ tipo: 'lettera', colore: 'rosso' }), 'l', 'L5: lettera rossa → l');
    t.eq(categL5Outcome({ tipo: 'numero', colore: 'nero' }), 'z', 'L5: numero nero → z');
    t.eq(categL5Outcome({ tipo: 'numero', colore: 'rosso' }), 'm', 'L5: numero rosso → m');
  });

  t.group('switchRulesetFor — ruleB cambia etichetta/regola con la dimensione acustica, ruleA resta invariato', () => {
    cfg.switchMaterial = 'bivalente'; cfg.switchSecondaria = 'colore';
    const rsColore = switchRulesetFor(cfg);
    t.eq(rsColore.ruleB.label, 'Bianco / Rosso', 'colore: etichetta ruleB invariata');
    t.eq(rsColore.ruleB.classify({ colore: 'nero' }), true, 'colore: ruleB.classify legge item.colore');

    cfg.switchSecondaria = 'tono';
    const rsTono = switchRulesetFor(cfg);
    t.eq(rsTono.ruleB.label, 'Grave / Acuto', 'tono: etichetta ruleB sostituita');
    t.eq(rsTono.ruleB.classify({ tono: 'grave' }), true, 'tono: ruleB.classify legge item.tono');
    t.eq(rsTono.ruleA.label, rsColore.ruleA.label, 'ruleA (Numero/Lettera) resta identico in entrambe le varianti');
    cfg.switchSecondaria = 'colore';
  });

  t.group('buildSwitching — bivalente con tono: forma dell\'item, congruenza e assenza di colore', () => {
    cfg.taskMode = 'switching'; cfg.switchMaterial = 'bivalente'; cfg.switchSecondaria = 'tono';
    cfg.trials = 500; cfg.targetRate = 0.3; cfg.titrationMode = 'manuale';
    const seq = buildSwitching();
    t.eq(seq.length, 500, 'genera il numero di prove richiesto');
    seq.forEach((trial, i) => {
      t.ok(trial.val.tono === 'grave' || trial.val.tono === 'acuto', 'prova ' + i + ': tono sempre valorizzato');
      t.eq(trial.val.colore, undefined, 'prova ' + i + ': colore MAI impostato quando la dimensione acustica è attiva');
      t.ok(trial.val.tipo === 'numero' || trial.val.tipo === 'lettera', 'prova ' + i + ': tipo sempre valorizzato, indipendentemente dalla dimensione secondaria');
      // La congruenza deve corrispondere davvero al confronto fra le due regole sullo stesso item.
      const ansTipo = trial.val.tipo === 'numero'; // ruleA.classify: v.tipo==='numero'
      const ansTono = trial.val.tono === 'grave'; // ruleB.classify (tono): v.tono==='grave'
      const expected = ansTipo === ansTono ? 'congruent' : 'incongruent';
      t.eq(trial.congruency, expected, 'prova ' + i + ': congruenza coerente col confronto reale fra le due regole');
    });
  });
};
