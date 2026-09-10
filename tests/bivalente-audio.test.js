'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// cfg come variabile libera, stesso approccio degli altri test — mutata
// prima di ogni chiamata invece che passata come argomento.
const cfg = { taskMode: 'categorizzazione', categRegime: 'tipo_colore', categRegimeSessione: 'tipo_colore', switchRegime: 'tipo_colore', trials: 10, targetRate: 0.3, titrationMode: 'manuale' };

const mod = loadPure(REPO_ROOT, [
  { name: 'POOLS', start: '  const POOLS = {', end: 'POOLS.numeriVoce = POOLS.numeri;' },
  { name: 'SWITCH_RULESETS+dualLabels+switchRulesetFor+buildSwitching', start: '  const SWITCH_RULESETS = {', end: "    return seq;\n  }" },
  { name: 'CATEG_LETTERE+NUMERI+regimi+genCategItem+outcomes', start: '  const CATEG_LETTERE', end: "    return categDim2IsA(item) ? 'z' : 'm';\n  }" }
], ['switchRulesetFor', 'buildSwitching', 'genCategItem', 'categDim1IsA', 'categDim2IsA', 'categL2Outcome', 'categL3Outcome', 'categL5Outcome', 'pickCategRegime', 'CATEG_REGIMES', 'dualDim1IsA', 'dualDim2IsA', 'genDualDimItem', 'pickDualDimRegime', 'DUAL_DIM_ROTATION'], { cfg, POOLS: null });

const { switchRulesetFor, buildSwitching, genCategItem, categDim1IsA, categDim2IsA, categL2Outcome, categL3Outcome, categL5Outcome, pickCategRegime, CATEG_REGIMES, dualDim1IsA, dualDim2IsA, genDualDimItem, pickDualDimRegime, DUAL_DIM_ROTATION } = mod;

module.exports = function run(t) {
  t.group('categDim1IsA — legge tipo o forma a seconda del regime', () => {
    t.eq(categDim1IsA({ tipo: 'lettera' }), true, 'tipo lettera → polo A (nessun dim1 impostato, ricade su tipo)');
    t.eq(categDim1IsA({ tipo: 'numero' }), false, 'tipo numero → polo B');
    t.eq(categDim1IsA({ dim1: 'forma', tipo: 'cerchio' }), true, 'forma cerchio → polo A (stessa polarità di lettera)');
    t.eq(categDim1IsA({ dim1: 'forma', tipo: 'triangolo' }), false, 'forma triangolo → polo B (stessa polarità di numero)');
  });

  t.group('categDim2IsA — legge la dimensione giusta a seconda di cosa è impostato sull\'item', () => {
    t.eq(categDim2IsA({ colore: 'nero' }), true, 'colore nero → polo A');
    t.eq(categDim2IsA({ colore: 'rosso' }), false, 'colore rosso → polo B');
    t.eq(categDim2IsA({ tono: 'grave' }), true, 'tono grave → polo A (stessa polarità del colore nero)');
    t.eq(categDim2IsA({ tono: 'acuto' }), false, 'tono acuto → polo B (stessa polarità del colore rosso)');
  });

  t.group('pickCategRegime — random pesca dai 3 regimi, un valore fisso lo restituisce sempre uguale', () => {
    cfg.categRegime = 'forma_colore';
    for (let i = 0; i < 20; i++) t.eq(pickCategRegime(cfg), 'forma_colore', 'regime fisso: sempre lo stesso, mai sorteggiato');
    cfg.categRegime = 'random';
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add(pickCategRegime(cfg));
    t.ok(CATEG_REGIMES.every(r => seen.has(r)), 'random: su 200 sorteggi compaiono tutti e 3 i regimi almeno una volta');
    cfg.categRegime = 'tipo_colore';
  });

  t.group('genCategItem — genera SEMPRE esattamente una delle due dimensioni per il regime attivo, mai entrambe né nessuna', () => {
    cfg.categRegimeSessione = 'tipo_colore';
    for (let i = 0; i < 200; i++) {
      const item = genCategItem();
      t.ok(item.colore === 'nero' || item.colore === 'rosso', 'tipo_colore: item.colore sempre valorizzato');
      t.eq(item.tono, undefined, 'tipo_colore: item.tono resta non impostato');
      t.ok(item.tipo === 'lettera' || item.tipo === 'numero', 'tipo_colore: item.tipo è lettera o numero');
      t.eq(item.dim1, 'tipo', 'tipo_colore: dim1 è "tipo"');
    }
    cfg.categRegimeSessione = 'tipo_tono';
    for (let i = 0; i < 200; i++) {
      const item = genCategItem();
      t.ok(item.tono === 'grave' || item.tono === 'acuto', 'tipo_tono: item.tono sempre valorizzato');
      t.eq(item.colore, undefined, 'tipo_tono: item.colore resta non impostato');
    }
    cfg.categRegimeSessione = 'forma_colore';
    for (let i = 0; i < 200; i++) {
      const item = genCategItem();
      t.eq(item.dim1, 'forma', 'forma_colore: dim1 è "forma"');
      t.ok(item.tipo === 'cerchio' || item.tipo === 'triangolo', 'forma_colore: item.tipo è cerchio o triangolo, non lettera/numero');
      t.ok(item.colore === 'nero' || item.colore === 'rosso', 'forma_colore: item.colore sempre valorizzato (mai tono)');
      t.eq(item.tono, undefined, 'forma_colore: item.tono resta non impostato');
    }
    cfg.categRegimeSessione = 'tipo_colore';
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

  t.group('switchRulesetFor — ruleB cambia etichetta/regola col regime, ruleA segue la stessa convenzione storica (Numero/Lettera, non invertita)', () => {
    cfg.switchMaterial = 'bivalente'; cfg.switchRegime = 'tipo_colore';
    const rsColore = switchRulesetFor(cfg);
    t.eq(rsColore.ruleA.label, 'Numero / Lettera', 'ruleA: etichetta storica invariata');
    t.eq(rsColore.ruleA.classify({ tipo: 'numero' }), true, 'ruleA.classify: numero → true (polo A = Numero, non Lettera — convenzione preesistente mantenuta)');
    t.eq(rsColore.ruleB.label, 'Bianco / Rosso', 'colore: etichetta ruleB invariata');
    t.eq(rsColore.ruleB.classify({ colore: 'nero' }), true, 'colore: ruleB.classify legge item.colore');

    cfg.switchRegime = 'tipo_tono';
    const rsTono = switchRulesetFor(cfg);
    t.eq(rsTono.ruleB.label, 'Grave / Acuto', 'tono: etichetta ruleB sostituita');
    t.eq(rsTono.ruleB.classify({ tono: 'grave' }), true, 'tono: ruleB.classify legge item.tono');
    t.eq(rsTono.ruleA.label, rsColore.ruleA.label, 'ruleA (Numero/Lettera) resta identico in tutte le varianti con dim1=tipo');

    cfg.switchRegime = 'forma_colore';
    const rsForma = switchRulesetFor(cfg);
    t.eq(rsForma.ruleA.label, 'Cerchio / Triangolo', 'forma: ruleA diventa Cerchio/Triangolo');
    t.eq(rsForma.ruleA.classify({ dim1: 'forma', tipo: 'cerchio' }), true, 'forma: ruleA.classify legge dim1 forma correttamente (polo A = cerchio, coerente con dualDim1IsA)');

    cfg.switchRegime = 'consvoc_posizione';
    const rsPos = switchRulesetFor(cfg);
    t.eq(rsPos.ruleA.label, 'Vocale / Consonante', 'consvoc: ruleA diventa Vocale/Consonante');
    t.eq(rsPos.ruleB.label, 'Sinistra / Destra', 'posizione: ruleB diventa Sinistra/Destra, non Bianco/Rosso');
    t.eq(rsPos.ruleB.classify({ side: 'left' }), true, 'posizione: ruleB.classify legge item.side');
    cfg.switchRegime = 'tipo_colore';
  });

  t.group('buildSwitching — bivalente: per ogni regime della rotazione, forma dell\'item e congruenza coerenti', () => {
    cfg.taskMode = 'switching'; cfg.switchMaterial = 'bivalente';
    cfg.trials = 300; cfg.targetRate = 0.3; cfg.titrationMode = 'manuale';
    DUAL_DIM_ROTATION.concat(['tipo_tono']).forEach(regime => {
      cfg.switchRegime = regime;
      const seq = buildSwitching();
      const rs = switchRulesetFor(cfg);
      t.eq(seq.length, 300, regime + ': genera il numero di prove richiesto');
      seq.forEach((trial, i) => {
        const ansDim1 = rs.ruleA.classify(trial.val) ? 'a' : 'b';
        const ansDim2 = rs.ruleB.classify(trial.val) ? 'a' : 'b';
        const expected = ansDim1 === ansDim2 ? 'congruent' : 'incongruent';
        t.eq(trial.congruency, expected, regime + ' prova ' + i + ': congruenza coerente col confronto reale fra le due regole di questo regime');
      });
    });
    cfg.switchRegime = 'tipo_colore';
  });

  t.group('buildSwitching — bivalente con tono: nessun colore, campo tono sempre valorizzato (caso storico, verificato per nome)', () => {
    cfg.switchRegime = 'tipo_tono';
    const seq = buildSwitching();
    seq.forEach((trial, i) => {
      t.ok(trial.val.tono === 'grave' || trial.val.tono === 'acuto', 'prova ' + i + ': tono sempre valorizzato');
      t.eq(trial.val.colore, undefined, 'prova ' + i + ': colore MAI impostato quando la dimensione acustica è attiva');
    });
    cfg.switchRegime = 'tipo_colore';
  });
};
