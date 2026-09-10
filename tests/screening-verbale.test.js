'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const screeningStateStub = { probeResults: {} };
let screeningMaterialMode = 'auto';

const mod = loadPure(REPO_ROOT, [
  { name: 'POOLS', start: '  const POOLS = {', end: 'POOLS.numeriVoce = POOLS.numeri;' },
  { name: 'SCREENING_PROBES', start: '  const SCREENING_PROBES = {', end: "      suggestedCfgOverride:{taskMode:'goaltask', goaltaskScenario:'sei_compiti_classico', goaltaskLivello:1} }\n  };" },
  { name: 'helpers', start: '  function recordProbeResult(probeKey, form, acc, failed){', end: "    return [{domainKey, probeKey, form:'verbale'}, {domainKey, probeKey, form:'non_verbale'}];\n  }" }
], ['SCREENING_PROBES', 'recordProbeResult', 'computeFailMap', 'materialPatternFor', 'buildScreeningQueueEntry'], {
  defaultTargetSeq: () => [], primaryAccuracyOf: () => null, SCREENING_TRIALS: 16,
  screeningState: screeningStateStub, screeningMaterialMode: 'auto'
});

const { SCREENING_PROBES, recordProbeResult, computeFailMap, materialPatternFor, buildScreeningQueueEntry } = mod;

// screeningMaterialMode è passato per valore alla creazione del contesto
// (non un binding vivo) — buildScreeningQueueEntry lo legge dentro il
// sandbox, quindi per cambiarlo fra un gruppo di test e l'altro serve
// ricreare il modulo, non riassegnare una variabile esterna. Più
// semplice: le sonde SENZA forma non verbale ignorano comunque
// screeningMaterialMode (sempre 'verbale', qualunque esso sia) — il
// gruppo dedicato a quello non ha bisogno di cambiarlo. Per il gruppo che
// testa le 3 modalità su una sonda CON forma non verbale, ricreo il
// modulo con ciascuna modalità.
function loadWithMode(mode) {
  return loadPure(REPO_ROOT, [
    { name: 'POOLS', start: '  const POOLS = {', end: 'POOLS.numeriVoce = POOLS.numeri;' },
    { name: 'SCREENING_PROBES', start: '  const SCREENING_PROBES = {', end: "      suggestedCfgOverride:{taskMode:'goaltask', goaltaskScenario:'sei_compiti_classico', goaltaskLivello:1} }\n  };" },
    { name: 'helpers', start: '  function recordProbeResult(probeKey, form, acc, failed){', end: "    return [{domainKey, probeKey, form:'verbale'}, {domainKey, probeKey, form:'non_verbale'}];\n  }" }
  ], ['buildScreeningQueueEntry'], {
    defaultTargetSeq: () => [], primaryAccuracyOf: () => null, SCREENING_TRIALS: 16,
    screeningState: screeningStateStub, screeningMaterialMode: mode
  }).buildScreeningQueueEntry;
}

function freshState() { screeningStateStub.probeResults = {}; }

module.exports = function run(t) {
  t.group('SCREENING_PROBES — quali hanno davvero una forma non verbale, dichiarato esplicitamente', () => {
    const withNonVerbal = Object.keys(SCREENING_PROBES).filter(k => !!SCREENING_PROBES[k].nonVerbalPatch);
    t.eq(withNonVerbal.sort(), ['ant', 'categorizzazione', 'gonogo', 'nback', 'neglect_classico', 'neglect_intruso', 'runningspan', 'sequenza', 'stopsignal', 'stopsignal_interferenza', 'switching'].sort(),
      'esattamente queste 11 sonde hanno una forma non verbale; le altre (TAPAT, Simon, Mantenimento, Cancellazione a regola, Doppio compito, mini-scenario) restano a singola somministrazione per un limite dichiarato');
  });

  t.group('buildScreeningQueueEntry — sonda SENZA forma non verbale: sempre una sola voce, qualunque sia la modalità', () => {
    ['auto', 'verbale', 'non_verbale'].forEach(mode => {
      const buildEntry = loadWithMode(mode);
      const entries = buildEntry('attenzione', 'tapat');
      t.eq(entries.length, 1, 'modalità ' + mode + ': una sola voce per TAPAT (nessuna forma non verbale)');
      t.eq(entries[0].form, 'verbale', 'modalità ' + mode + ': sempre forma verbale per TAPAT');
    });
  });

  t.group('buildScreeningQueueEntry — sonda CON forma non verbale: rispetta la modalità scelta', () => {
    const auto = loadWithMode('auto')('attenzione', 'gonogo');
    t.eq(auto.map(e => e.form), ['verbale', 'non_verbale'], 'auto: entrambe le forme, verbale prima');

    const soloV = loadWithMode('verbale')('attenzione', 'gonogo');
    t.eq(soloV.map(e => e.form), ['verbale'], 'solo verbale: una sola voce');

    const soloNV = loadWithMode('non_verbale')('attenzione', 'gonogo');
    t.eq(soloNV.map(e => e.form), ['non_verbale'], 'solo non verbale: una sola voce');
  });

  t.group('recordProbeResult + computeFailMap — una sonda fallisce se fallisce ALMENO una forma', () => {
    freshState();
    recordProbeResult('gonogo', 'verbale', 0.9, false);
    recordProbeResult('gonogo', 'non_verbale', 0.9, false);
    t.eq(computeFailMap().gonogo, false, 'entrambe le forme passano: la sonda non fallisce');

    freshState();
    recordProbeResult('gonogo', 'verbale', 0.5, true);
    recordProbeResult('gonogo', 'non_verbale', 0.9, false);
    t.eq(computeFailMap().gonogo, true, 'solo la verbale fallisce: la sonda fallisce comunque (ai fini della regola di dominio)');

    freshState();
    recordProbeResult('gonogo', 'verbale', 0.9, false);
    recordProbeResult('gonogo', 'non_verbale', 0.5, true);
    t.eq(computeFailMap().gonogo, true, 'solo la non verbale fallisce: la sonda fallisce comunque');

    freshState();
    recordProbeResult('tapat', 'verbale', 0.5, true);
    t.eq(computeFailMap().tapat, true, 'sonda a singola forma: si comporta come prima, nessuna differenza');
  });

  t.group('materialPatternFor — distingue le 4 combinazioni possibili', () => {
    freshState();
    t.eq(materialPatternFor('gonogo'), null, 'nessuna forma ancora somministrata: null, non un crash');

    freshState();
    recordProbeResult('gonogo', 'verbale', 0.9, false);
    recordProbeResult('gonogo', 'non_verbale', 0.9, false);
    t.eq(materialPatternFor('gonogo'), 'nessuno', 'entrambe passate: "nessuno" (non è un fallimento)');

    freshState();
    recordProbeResult('gonogo', 'verbale', 0.5, true);
    recordProbeResult('gonogo', 'non_verbale', 0.9, false);
    t.eq(materialPatternFor('gonogo'), 'verbale', 'solo verbale fallita: pattern "verbale" — deficit selettivo al materiale linguistico');

    freshState();
    recordProbeResult('gonogo', 'verbale', 0.9, false);
    recordProbeResult('gonogo', 'non_verbale', 0.5, true);
    t.eq(materialPatternFor('gonogo'), 'non_verbale', 'solo non verbale fallita: pattern "non_verbale"');

    freshState();
    recordProbeResult('gonogo', 'verbale', 0.5, true);
    recordProbeResult('gonogo', 'non_verbale', 0.5, true);
    t.eq(materialPatternFor('gonogo'), 'misto', 'entrambe fallite: pattern "misto" — deficit generale, non selettivo al materiale');
  });

  t.group('materialPatternFor — con "solo verbale"/"solo non verbale" come modalità, resta comunque corretto con una sola forma registrata', () => {
    freshState();
    recordProbeResult('gonogo', 'verbale', 0.5, true);
    t.eq(materialPatternFor('gonogo'), 'verbale', 'solo la forma verbale è stata somministrata, ed è fallita — pattern coerente anche con una sola forma');
  });
};
