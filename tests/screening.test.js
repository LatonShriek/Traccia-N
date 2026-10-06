'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const mod = loadPure(REPO_ROOT, [
  { name: 'POOLS', start: '  const POOLS = {', end: 'POOLS.numeriVoce = POOLS.numeri;' },
  { name: 'screening engine', start: '  const SCREENING_FLAG_THRESHOLD = 0.70;', end: "  const SCREENING_DOMAIN_ORDER = ['memoria','attenzione','flessibilita','esplorazione']; // memoria per prima: Mantenimento è la prima sonda in assoluto di tutto lo screening, come richiesto" },
  { name: 'domainsQualifyingForCeiling', start: '  function domainsQualifyingForCeiling(fail){', end: "      SCREENING_DOMAINS[domainKey].probes.every(pk=>!fail[pk])\n    );\n  }" }
], ['SCREENING_PROBES', 'SCREENING_DOMAINS', 'SCREENING_DOMAIN_ORDER', 'ATTENZIONE_ORDER', 'suggestionFor', 'probeFailed', 'SCREENING_FLAG_THRESHOLD', 'CEILING_PROBES', 'domainsQualifyingForCeiling'], { defaultTargetSeq: () => [], primaryAccuracyOf: r => (r && r.family === 'choice' && r.choice && r.choice.total) ? r.choice.correct / r.choice.total : null, SCREENING_TRIALS: 16 });

const { SCREENING_PROBES, SCREENING_DOMAINS, SCREENING_DOMAIN_ORDER, ATTENZIONE_ORDER, suggestionFor, probeFailed, SCREENING_FLAG_THRESHOLD, CEILING_PROBES, domainsQualifyingForCeiling } = mod;

module.exports = function run(t) {
  t.group('SCREENING_DOMAIN_ORDER — Memoria per prima (Mantenimento è la prima sonda in assoluto, come richiesto)', () => {
    t.eq(SCREENING_DOMAIN_ORDER[0], 'memoria', 'Memoria è il primo dominio somministrato');
    t.eq(SCREENING_DOMAINS.memoria.probes[0], 'mantenimento', 'Mantenimento è la prima sonda del dominio Memoria — quindi la prima sonda di tutto lo screening');
  });

  t.group('Ogni dominio dichiarato in SCREENING_DOMAIN_ORDER esiste davvero in SCREENING_DOMAINS, e viceversa', () => {
    SCREENING_DOMAIN_ORDER.forEach(k => t.ok(!!SCREENING_DOMAINS[k], 'dominio "' + k + '" definito'));
    t.eq(Object.keys(SCREENING_DOMAINS).length, SCREENING_DOMAIN_ORDER.length, 'nessun dominio extra dimenticato fuori dall\'ordine dichiarato');
  });

  t.group('Ogni sonda elencata in un dominio esiste nel catalogo SCREENING_PROBES', () => {
    SCREENING_DOMAIN_ORDER.forEach(domainKey => {
      SCREENING_DOMAINS[domainKey].probes.forEach(probeKey => {
        t.ok(!!SCREENING_PROBES[probeKey], 'sonda "' + probeKey + '" (dominio ' + domainKey + ') esiste nel catalogo');
      });
    });
    t.ok(!!SCREENING_PROBES.simon, 'Simon esiste nel catalogo anche se non compare in nessun elenco "probes" di un dominio');
    const allListedProbes = SCREENING_DOMAIN_ORDER.reduce((acc, k) => acc.concat(SCREENING_DOMAINS[k].probes), []);
    t.ok(!allListedProbes.includes('simon'), 'conferma: Simon non è MAI nell\'elenco probes di un dominio (sempre condizionale)');
  });

  t.group('ATTENZIONE_ORDER — le 5 sonde base di Attenzione, nell\'ordine di esigenza crescente concordato', () => {
    t.eq(ATTENZIONE_ORDER, ['ant', 'tapat', 'gonogo', 'stopsignal', 'stopsignal_interferenza'], 'ordine esatto: ANT (solo screening) → TAPAT → Go/No-Go → Stop-Signal → Stop-Signal con interferenza');
  });

  t.group('probeFailed — soglia 70%, coerente in tutto lo screening', () => {
    t.eq(probeFailed('gonogo', { family: 'choice', choice: { correct: 8, total: 10 } }), false, '80%: sopra soglia, non fallito');
    t.eq(probeFailed('gonogo', { family: 'choice', choice: { correct: 6, total: 10 } }), true, '60%: sotto soglia, fallito');
    t.eq(probeFailed('gonogo', {}), true, 'nessun dato calcolabile: trattato come fallito, non un crash');
  });

  t.group('suggestionFor — ogni sonda ha un flagKey univoco (necessario per non sovrascrivere suggerimenti diversi con lo stesso taskMode)', () => {
    const keys = Object.keys(SCREENING_PROBES).map(k => SCREENING_PROBES[k].variant);
    const uniqueKeys = new Set(keys);
    t.eq(uniqueKeys.size, keys.length, 'nessun due sonde condividono lo stesso variant/flagKey');
    t.eq(SCREENING_PROBES.neglect_classico.variant, 'neglect_classico');
    t.eq(SCREENING_PROBES.neglect_intruso.variant, 'neglect_intruso');
    t.eq(SCREENING_PROBES.neglect_regola.variant, 'neglect_regola');
    t.ok(SCREENING_PROBES.neglect_classico.variant !== SCREENING_PROBES.neglect_intruso.variant, 'varianti diverse, chiavi diverse');
  });

  t.group('suggestionFor — la configurazione suggerita punta sempre al taskMode giusto', () => {
    const s = suggestionFor('nback');
    t.eq(s.suggestTaskMode, 'nback');
    t.eq(s.suggestedCfg.taskMode, 'nback');
    t.eq(s.flagKey, 'nback');
  });

  t.group('Coerenza dei domini con quanto discusso: Flessibilità un solo esercizio, Esplorazione 3 varianti dello stesso', () => {
    t.eq(SCREENING_DOMAINS.flessibilita.probes.length, 1, 'Flessibilità: un solo esercizio nel dominio, come stabilito');
    t.eq(SCREENING_DOMAINS.esplorazione.probes.length, 3, 'Esplorazione: le 3 modalità (classico/intruso/regola), sempre tutte somministrate');
    t.eq(SCREENING_DOMAINS.attenzione.probes.length, 5, 'Attenzione: le 5 sonde base (Simon escluso, è condizionale)');
    t.eq(SCREENING_DOMAINS.memoria.probes.length, 5, 'Memoria: le 5 sonde (Mantenimento, Sequenza, Categorizzazione, N-back, Running Span)');
  });

  t.group('CEILING_PROBES — un\'ancora per ciascuno dei 4 domini, nessuno dimenticato', () => {
    SCREENING_DOMAIN_ORDER.forEach(domainKey => t.ok(!!CEILING_PROBES[domainKey], 'dominio "' + domainKey + '" ha una sonda di verifica a carico più alto'));
  });

  t.group('domainsQualifyingForCeiling — solo i domini interamente puliti (OGNI sonda passata) qualificano', () => {
    t.eq(domainsQualifyingForCeiling({}), SCREENING_DOMAIN_ORDER, 'nessun fallimento da nessuna parte: tutti e 4 i domini qualificano');

    const unSoloFallimento = { mantenimento: true }; // una sonda di Memoria fallisce
    const q1 = domainsQualifyingForCeiling(unSoloFallimento);
    t.ok(!q1.includes('memoria'), 'Memoria ha una sonda fallita: NON qualifica per la verifica a carico più alto');
    t.ok(q1.includes('attenzione') && q1.includes('flessibilita') && q1.includes('esplorazione'), 'gli altri 3 domini, intatti, qualificano comunque');

    const tuttiFallimenti = { mantenimento: true, sequenza: true, categorizzazione: true, nback: true, runningspan: true, ant: true, tapat: true, gonogo: true, stopsignal: true, stopsignal_interferenza: true, switching: true, neglect_classico: true, neglect_intruso: true, neglect_regola: true };
    t.eq(domainsQualifyingForCeiling(tuttiFallimenti), [], 'tutto fallisce ovunque: nessun dominio qualifica');
  });

  t.group('domainsQualifyingForCeiling — una sola sonda su 5 di un dominio che fallisce è comunque sufficiente a escluderlo', () => {
    const q = domainsQualifyingForCeiling({ runningspan: true }); // le altre 4 sonde di Memoria passano
    t.ok(!q.includes('memoria'), 'anche un solo fallimento su 5 sonde esclude l\'intero dominio dalla verifica a carico più alto — "interamente pulito" richiede TUTTE, non la maggioranza');
  });
};
