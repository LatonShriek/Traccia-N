'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// SCREENING_BLOCKS contiene funzioni patch() che si appoggiano a cose
// definite altrove nel file (POOLS, SCREENING_TRIALS, defaultTargetSeq) —
// qui non le chiamiamo mai, verifichiamo solo la FORMA dell'array
// (domini, tipi, etichette), quindi non serve fornirle: una funzione non
// eseguita non fa fallire l'estrazione anche se referenzia variabili
// libere non presenti nel sandbox.
const SCREENING_BLOCKS_END = "suggestTaskMode:'mantenimento', suggestLabel:'Mantenimento (tipo Sternberg)',\n      patch:()=>({taskMode:'mantenimento', mantenimentoModalita:'riconoscimento', mantenimentoMateriale:'lettere', mantenimentoListLen:5, titrationMode:'manuale', adaptive:false, trials:SCREENING_TRIALS}) }\n  ];";

const mod = loadPure(REPO_ROOT, [
  { name: 'SCREENING_BLOCKS', start: '  const SCREENING_BLOCKS = [', end: SCREENING_BLOCKS_END }
], ['SCREENING_BLOCKS']);

const { SCREENING_BLOCKS } = mod;

module.exports = function run(t) {
  t.group('Screening — struttura a 5 domini (Attenzione divisa rimossa, Mantenimento aggiunto)', () => {
    const domains = [...new Set(SCREENING_BLOCKS.map(b => b.domain))];
    t.eq(domains.length, 5, 'esattamente 5 domini (Attenzione, Memoria, Flessibilità, Esplorazione, Mantenimento — Attenzione divisa rimossa deliberatamente)');
    t.ok(!domains.includes('divisa'), 'nessun blocco con domain "divisa" — se ricompare, è un refactor che ha reintrodotto senza volerlo ciò che era stato tolto apposta');

    domains.forEach(d => {
      const blocks = SCREENING_BLOCKS.filter(b => b.domain === d);
      if (d === 'flessibilita') {
        // Dominio a blocco singolo auto-scomposto (repAcc/switchAcc dallo
        // stesso Task-switching), non più due esercizi diversi confrontati.
        t.eq(blocks.length, 1, 'dominio "flessibilita": un solo blocco (tipo "split", auto-scomposto in base/caricato)');
        t.eq(blocks[0].tipo, 'split', 'dominio "flessibilita": il blocco è di tipo "split"');
        t.ok(blocks[0].splitAccKeys && blocks[0].splitAccKeys.base && blocks[0].splitAccKeys.caricato, 'dominio "flessibilita": ha splitAccKeys.base e .caricato');
      } else {
        t.eq(blocks.length, 2, 'dominio "' + d + '": esattamente un blocco base + un blocco caricato');
        t.ok(blocks.some(b => b.tipo === 'base'), 'dominio "' + d + '": ha un blocco "base"');
        t.ok(blocks.some(b => b.tipo === 'caricato'), 'dominio "' + d + '": ha un blocco "caricato"');
      }
    });

    t.eq(SCREENING_BLOCKS.length, 9, 'totale 9 blocchi (4 domini × base/caricato + 1 dominio a blocco singolo split)');

    SCREENING_BLOCKS.forEach(b => {
      t.ok(typeof b.patch === 'function', 'blocco "' + b.label + '": ha una funzione patch()');
      t.ok(!!b.label, 'blocco: ha un\'etichetta leggibile');
    });
  });
};
