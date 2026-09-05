'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// Prima di questa sessione, nessun test copriva sessionLevelBounds/
// STRUCTURAL_BANDS affatto (verificato: nessun file in tests/ le nomina) —
// questo file colma la lacuna, non solo per i due casi nuovi (Mantenimento,
// Task-switching bivalente) ma anche per un campione dei casi già esistenti
// (N-back, Go/No-Go), per avere una rete di sicurezza reale su un
// meccanismo che protegge da un cambio di regola a metà seduta.
const cfg = { taskMode: 'nback' };
const mod = loadPure(REPO_ROOT, [
  { name: 'adaptLevelKey', start: '  function adaptLevelKey(){', end: "return null;\n  }" },
  { name: 'currentLevelMax', start: '  function currentLevelMax(){', end: "return 5;\n  }" },
  { name: 'STRUCTURAL_BANDS+bounds', start: '  const STRUCTURAL_BANDS = {', end: "return {min:1, max:currentLevelMax()};\n  }" },
  { name: 'ADAPT_ISI', start: '  const ADAPT_ISI = {', end: "10:750} // leva secondaria, indipendente dallo staircase SSD\n  };" }
], ['structuralBandBounds', 'sessionLevelBounds', 'STRUCTURAL_BANDS', 'TASK_SWITCHING_BIVALENTE_MIN_LEVEL'], { cfg });

const { structuralBandBounds, sessionLevelBounds, STRUCTURAL_BANDS, TASK_SWITCHING_BIVALENTE_MIN_LEVEL } = mod;

module.exports = function run(t) {
  t.group('structuralBandBounds — casi già esistenti, per non regredire mentre si estende il meccanismo', () => {
    t.eq(structuralBandBounds('nback', 1), { min: 1, max: 4 }, 'N-back livello 1: fascia n=1 (1-4)');
    t.eq(structuralBandBounds('nback', 7), { min: 5, max: 9 }, 'N-back livello 7: fascia n=2 (5-9)');
    t.eq(structuralBandBounds('nback', 10), { min: 10, max: 10 }, 'N-back livello 10: fascia n=3, un solo livello');
    t.eq(structuralBandBounds('gonogo', 6), { min: 5, max: 7 }, 'Go/No-Go livello 6: fascia 2 elementi noti (5-7)');
    t.eq(structuralBandBounds('sconosciuto', 5), null, 'esercizio senza fasce dichiarate: null, non un crash');
  });

  t.group('STRUCTURAL_BANDS — Mantenimento (Sternberg): salto di MODALITÀ al confine 5/6, non solo di lunghezza lista', () => {
    t.eq(structuralBandBounds('mantenimento', 3), { min: 1, max: 5 }, 'livello 3 (Riconoscimento): fascia 1-5, non può salire in seduta fino a 6 (Riconoscimento seriale)');
    t.eq(structuralBandBounds('mantenimento', 8), { min: 6, max: 10 }, 'livello 8 (Riconoscimento seriale): fascia 6-10, non può scendere in seduta fino a 5 (Riconoscimento)');
  });

  t.group('sessionLevelBounds — Mantenimento: il vincolo è agganciato davvero (non solo la tabella isolata)', () => {
    cfg.taskMode = 'mantenimento'; cfg.adaptStartLevel = 4;
    t.eq(sessionLevelBounds(), { min: 1, max: 5 }, 'partenza da livello 4: la seduta resta dentro Riconoscimento (max 5), non può attraversare in Riconoscimento seriale');
    cfg.adaptStartLevel = 7;
    t.eq(sessionLevelBounds(), { min: 6, max: 10 }, 'partenza da livello 7: la seduta resta dentro Riconoscimento seriale (min 6), non può retrocedere in Riconoscimento');
  });

  t.group('sessionLevelBounds — Task-switching bivalente: soglia minima di livello, non derivata da una fascia ma dalla scelta del materiale', () => {
    cfg.taskMode = 'switching'; cfg.switchMaterial = 'numeri'; cfg.adaptStartLevel = 2;
    t.eq(sessionLevelBounds(), { min: 1, max: 10 }, 'materiale a regola singola (numeri): nessun vincolo di soglia, scala 1-10 intera come sempre');
    cfg.switchMaterial = 'bivalente'; cfg.adaptStartLevel = 6;
    t.eq(sessionLevelBounds(), { min: TASK_SWITCHING_BIVALENTE_MIN_LEVEL, max: 10 }, 'materiale bivalente: la seduta non può MAI scendere sotto la soglia minima, qualunque sia l\'accuratezza');
    t.eq(TASK_SWITCHING_BIVALENTE_MIN_LEVEL, 6, 'soglia minima dichiarata per il bivalente: livello 6');
  });
};
