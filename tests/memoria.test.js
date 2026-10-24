'use strict';
// Strategie di memoria (js/exercises/memoria.js, passo 5g): materiale, forme parallele, normalizzazione,
// percorsi dei loci, e coerenza dei dati (brani e liste di tutti i 16 livelli).
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const M = await importCore('../exercises/memoria.js');

  t.group('memoriaEffectiveMateriale — PQRST = brano, chunking = lista, le altre scelgono', () => {
    t.eq(M.memoriaEffectiveMateriale({ memoriaModo: 'pqrst', memoriaMateriale: 'lista' }), 'brano', 'pqrst ignora il materiale scelto');
    t.eq(M.memoriaEffectiveMateriale({ memoriaModo: 'chunking', memoriaMateriale: 'brano' }), 'lista', 'chunking ignora il materiale scelto');
    t.eq(M.memoriaEffectiveMateriale({ memoriaModo: 'loci', memoriaMateriale: 'brano' }), 'brano', 'loci usa il materiale scelto');
    t.eq(M.memoriaEffectiveMateriale({ memoriaModo: 'loci' }), 'lista', 'senza scelta: lista');
  });

  t.group('dati: 16 livelli, nessun elemento vuoto', () => {
    t.eq(M.MEMORIA_BRANI.map(b => b.livello), Array.from({ length: 16 }, (_, i) => i + 1), 'brani: livelli 1-16 in ordine');
    t.eq(M.MEMORIA_LISTE.map(b => b.livello), Array.from({ length: 16 }, (_, i) => i + 1), 'liste: livelli 1-16 in ordine');
    M.MEMORIA_BRANI.forEach(e => {
      const r = M.memoriaBranoResolve(e, 0);
      t.ok(r.titolo && r.testo && r.sezioni.length > 0, 'brano L' + e.livello + ': titolo, testo e sezioni presenti');
      t.ok(r.unita.length > 0 && r.unita.every(u => typeof u === 'string' && u.length > 0), 'brano L' + e.livello + ': idee-chiave non vuote');
      for (let k = 0; k < r.nForme; k++) {
        const rk = M.memoriaBranoResolve(e, k);
        t.ok(rk.unita.length > 0 && rk.sezioni.every(s => s.testo && s.unita.length > 0), 'brano L' + e.livello + ' forma ' + k + ': ogni sezione ha testo e idee');
      }
    });
    M.MEMORIA_LISTE.forEach(e => {
      for (let k = 0; k < M.memoriaListaResolve(e, 0).nForme; k++) {
        const r = M.memoriaListaResolve(e, k);
        t.ok(r.parole.length > 0 && r.parole.every(p => typeof p === 'string' && p.length > 0), 'lista L' + e.livello + ' forma ' + k + ': parole non vuote');
        t.eq(new Set(r.parole).size, r.parole.length, 'lista L' + e.livello + ' forma ' + k + ': nessuna parola ripetuta');
      }
    });
  });

  t.group('memoriaNForme — quante forme parallele per livello', () => {
    t.eq(M.memoriaNForme('pqrst', 1), 3, 'pqrst L1: 3 forme');
    t.eq(M.memoriaNForme('chunking', 1), 3, 'chunking L1: 3 forme');
    t.eq(M.memoriaNForme('pqrst', 10), 1, 'pqrst L10: forma unica');
    t.eq(M.memoriaNForme('chunking', 12), 1, 'chunking L12: forma unica');
    t.eq(M.memoriaNForme('loci', 1), 1, 'altre tecniche: 1');
  });

  t.group('memoriaListaResolve — forme, indici ciclici, gruppi visibili fino al livello 10', () => {
    const e1 = M.MEMORIA_LISTE.find(l => l.livello === 1);
    const a = M.memoriaListaResolve(e1, 0), b = M.memoriaListaResolve(e1, 4), c = M.memoriaListaResolve(e1, -1);
    t.eq([a.formaIdx, b.formaIdx, c.formaIdx], [0, 1, 2], 'indice ciclico (4 → 1, −1 → 2)');
    t.eq(a.parole, [].concat(...e1.forme[0].gruppi.map(g => g.parole)), 'parole = gruppi appiattiti nell\'ordine');
    t.ok(a.categorizzata && a.gruppi.length === 2, 'L1: categorizzata con gruppi visibili');
    t.ok(M.chunkingGroupsVisible(10) && !M.chunkingGroupsVisible(11), 'gruppi visibili fino al 10, nascosti dall\'11');
    const flat = M.memoriaListaResolve(M.MEMORIA_LISTE.find(l => l.livello === 3), 1);
    t.eq([flat.categorizzata, flat.gruppi, flat.categoria], [true, null, 'utensili da cucina'], 'forma flat a categoria singola');
    const storico = M.memoriaListaResolve(M.MEMORIA_LISTE.find(l => l.livello === 6), 5);
    t.eq([storico.nForme, storico.formaIdx, storico.categorizzata], [1, 0, false], 'voce storica senza forme: forma unica, non categorizzata');
    const nascosti = M.memoriaListaResolve({ livello: 11, forme: [{ gruppi: [{ categoria: 'x', parole: ['a', 'b'] }, { categoria: 'y', parole: ['c'] }] }] }, 0);
    t.eq([nascosti.gruppi, nascosti.parole], [null, ['a', 'b', 'c']], 'dal livello 11 i gruppi restano nei dati ma non nel rendering');
  });

  t.group('memoriaBranoResolve — sezioni unite', () => {
    const e = M.MEMORIA_BRANI.find(b => b.livello === 1);
    const r = M.memoriaBranoResolve(e, 1);
    t.eq(r.testo, r.sezioni.map(s => s.testo).join(' '), 'testo = sezioni unite da uno spazio');
    t.eq(r.unita, [].concat(...r.sezioni.map(s => s.unita)), 'unità = unità di tutte le sezioni');
    const storico = M.memoriaBranoResolve(M.MEMORIA_BRANI.find(b => b.livello === 8), 3);
    t.eq([storico.sezioni.length, storico.nForme, storico.formaIdx], [1, 1, 0], 'voce storica = una sola sezione');
    t.eq(storico.sezioni[0].testo, storico.testo, 'la sezione coincide col testo');
  });

  t.group('memoriaMaterialFor / memoriaLearnItems', () => {
    const lista = M.memoriaMaterialFor({ memoriaModo: 'chunking', memoriaLivello: 1, memoriaFormaIdx: 1 });
    t.ok(lista.parole && lista.formaIdx === 1, 'chunking → lista, forma 1');
    const brano = M.memoriaMaterialFor({ memoriaModo: 'pqrst', memoriaLivello: 2, memoriaFormaIdx: 0 });
    t.ok(brano.unita && brano.sezioni, 'pqrst → brano');
    const fallback = M.memoriaMaterialFor({ memoriaModo: 'chunking', memoriaLivello: 99 });
    t.eq(fallback.livello, 1, 'livello inesistente → primo livello');
    t.eq(M.memoriaLearnItems({ memoriaModo: 'chunking' }, lista), lista.parole, 'lista: gli elementi sono le parole');
    t.eq(M.memoriaLearnItems({ memoriaModo: 'pqrst' }, brano), brano.unita, 'brano: gli elementi sono le idee-chiave');
  });

  t.group('lociRouteFor — casa, corpo, personalizzato', () => {
    t.eq(M.lociRouteFor({}).length, 16, 'casa: 16 tappe');
    t.eq(M.lociRouteFor({ memoriaLociTipo: 'corpo' })[0], 'la testa', 'corpo: dalla testa');
    t.eq(M.lociRouteFor({ memoriaLociTipo: 'corpo' }).length, 16, 'corpo: 16 tappe');
    t.eq(M.lociRouteFor({ memoriaLociTipo: 'personalizzato', memoriaLociCustom: ' una \n\n due\n tre ' }), ['una', 'due', 'tre'], 'personalizzato: una tappa per riga, righe vuote scartate');
    t.eq(M.lociRouteFor({ memoriaLociTipo: 'personalizzato', memoriaLociCustom: '  \n ' }).length, 16, 'personalizzato vuoto → percorso casa');
  });

  t.group('memoriaFormeUsatePerPaziente — dallo storico già caricato', () => {
    const hist = [
      { family: 'memoria', patientCode: 'P1', memoria: { modo: 'pqrst', livello: 2, formaLettera: 'A' } },
      { family: 'memoria', patientCode: 'P1', memoria: { modo: 'pqrst', livello: 2, formaLettera: 'B' } },
      { family: 'memoria', patientCode: 'P1', memoria: { modo: 'chunking', livello: 2, formaLettera: 'C' } },
      { family: 'memoria', patientCode: 'P2', memoria: { modo: 'pqrst', livello: 2, formaLettera: 'C' } },
      { family: 'signal', patientCode: 'P1', memoria: { modo: 'pqrst', livello: 2, formaLettera: 'D' } },
      { family: 'memoria', patientCode: 'P1', memoria: { modo: 'pqrst', livello: 3, formaLettera: 'A' } }];
    t.eq([...M.memoriaFormeUsatePerPaziente(hist, 'P1', 'pqrst', 2)].sort(), ['A', 'B'], 'solo stesso paziente, modo e livello');
    t.eq(M.memoriaFormeUsatePerPaziente(null, 'P1', 'pqrst', 2).size, 0, 'storico non caricato → insieme vuoto');
    t.eq(M.memoriaFormeUsatePerPaziente(hist, '', 'pqrst', 2).size, 0, 'senza codice paziente → insieme vuoto');
  });
};
