'use strict';
// Registro degli esercizi (js/exercises/registry.js, passo 5h): finora tutti i test usavano copie finte di EXERCISES;
// qui si controlla il registro vero e la sua coerenza con titolazione, screening e gruppi.
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const R = await importCore('../exercises/registry.js');
  const T = await importCore('titration.js');
  const S = await importCore('screening.js');
  const keys = Object.keys(R.EXERCISES);

  t.group('registro: 15 esercizi, campi obbligatori', () => {
    t.eq(keys.length, 15, '15 esercizi');
    keys.forEach(k => {
      const e = R.EXERCISES[k];
      t.ok(typeof e.label === 'string' && e.label.length > 0, k + ': etichetta');
      t.ok(typeof e.family === 'string' && e.family.length > 0, k + ': famiglia');
      t.ok(Array.isArray(e.domini) && e.domini.length > 0 && e.domini.every(d => typeof d === 'string' && d), k + ': domini');
      t.eq(typeof e.usesStimType, 'boolean', k + ': usesStimType booleano');
      t.eq(typeof e.usesTargetSeq, 'boolean', k + ': usesTargetSeq booleano');
      t.eq(typeof e.instructions, 'function', k + ': istruzioni è una funzione');
    });
    t.eq(new Set(keys.map(k => R.EXERCISES[k].label)).size, keys.length, 'etichette tutte diverse');
  });

  t.group('istruzioni: testo non vuoto con la configurazione di partenza e con le varianti', () => {
    const variants = [];
    keys.forEach(k => variants.push([k, {}]));
    ['classico', 'intruso', 'regola', 'progressiva'].forEach(m => variants.push(['neglect', { neglectMode: m }]));
    variants.push(['neglect', { neglectMode: 'regola', stimType: 'numeri' }]);
    ['vis-aud', 'vis-vis', 'aud-aud'].forEach(p => variants.push(['dualtask', { dualPairing: p }]));
    ['pqrst', 'chunking', 'loci', 'errorless', 'vanishing'].forEach(m => variants.push(['memoria', { memoriaModo: m }]));
    ['numeri', 'lettere', 'bivalente'].forEach(m => variants.push(['switching', { switchMaterial: m }]));
    [1, 2, 3, 4, 5].forEach(l => variants.push(['goaltask', { goaltaskLivello: l }]));
    [1, 2, 3, 4, 5].forEach(l => variants.push(['categorizzazione', { categLivello: l * 2 }]));
    variants.forEach(([k, over]) => {
      const c = Object.assign(R.defaultCfg(), { taskMode: k }, over);
      let txt;
      try { txt = R.EXERCISES[k].instructions(c); } catch (e) { txt = 'ERRORE: ' + e.message; }
      t.ok(typeof txt === 'string' && txt.length > 20 && !txt.startsWith('ERRORE') && !/undefined|NaN|\[object/.test(txt), k + ' ' + JSON.stringify(over) + ': ' + (txt && txt.slice(0, 60)));
    });
  });

  t.group('gruppi: ogni esercizio in un solo gruppo, nessuna chiave sconosciuta', () => {
    const inGroups = [].concat(...R.EXERCISE_GROUPS.map(g => g.keys));
    t.eq(inGroups.slice().sort(), keys.slice().sort(), 'l\'unione dei gruppi = tutti gli esercizi, senza doppioni');
    t.ok(R.EXERCISE_GROUPS.every(g => g.label && g.keys.length > 0), 'ogni gruppo ha etichetta e almeno un esercizio');
  });

  t.group('coerenza con titolazione e screening', () => {
    t.ok(T.TITRATION_EXERCISES.every(k => keys.includes(k)), 'ogni esercizio titolabile esiste nel registro');
    t.ok(Object.keys(T.LEVEL_FIELD_OF_TASKMODE).every(k => keys.includes(k)), 'ogni campo-livello si riferisce a un esercizio del registro');
    t.ok(Object.values(S.SCREENING_PROBES).every(p => keys.includes(p.suggestTaskMode)), 'ogni sonda di screening suggerisce un esercizio del registro');
  });

  t.group('defaultCfg — oggetto nuovo a ogni chiamata, valori di partenza', () => {
    const a = R.defaultCfg(), b = R.defaultCfg();
    t.ok(a !== b && a.targetSeq !== b.targetSeq, 'ogni chiamata restituisce un oggetto indipendente');
    a.targetSeq.push('X'); a.chunkingMetodi.push('x');
    t.eq([b.targetSeq.length, b.chunkingMetodi], [3, ['categoria']], 'modificare uno non cambia l\'altro');
    t.eq([b.taskMode, b.titrationMode, b.adaptive, b.respMode, b.trials, b.isi], ['nback', 'manuale', false, 'paziente', 24, 2200], 'valori di partenza principali');
    t.eq([b.neglectBoardSize, b.neglectTimeLimit, b.goaltaskScenario, b.memoriaModo], [40, 60, 'sei_compiti_classico', 'pqrst'], 'valori di partenza degli altri esercizi');
  });

  t.group('helper del registro', () => {
    t.ok(R.isSpokenStim('lettereVoce') && R.isSpokenStim('paroleVoce') && !R.isSpokenStim('suoni'), 'isSpokenStim');
    t.ok(R.isAudioOnlyStim('suoni') && R.isAudioOnlyStim('numeriVoce') && !R.isAudioOnlyStim('lettere'), 'isAudioOnlyStim');
    t.eq([R.stimGender('lettere'), R.stimGender('parole'), R.stimGender('numeri'), R.stimGender('colori')], ['f', 'f', 'm', 'm'], 'stimGender: lettere e parole femminili');
    t.eq(R.STIM_LABELS.lettere, 'Lettere', 'STIM_LABELS');
    t.eq(Object.keys(R.MISTA_LABELS_SHORT), ['visivo', 'uditivo', 'misto'], 'MISTA_LABELS_SHORT');
    t.eq(Object.keys(R.CHUNKING_METODI_LABELS), ['categoria', 'acronimo', 'narrazione', 'immagine', 'personale'], 'CHUNKING_METODI_LABELS');
  });
};
