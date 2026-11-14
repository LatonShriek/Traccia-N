'use strict';
const { importCore } = require('./lib/core');
// Profili consigliati (js/core/profili.js): ogni voce deve riferirsi a un esercizio vero e a un livello sensato.
module.exports = async function run(t) {
  const P = await importCore('profili.js');
  const R = await importCore('../exercises/registry.js');
  const T = await importCore('titration.js');
  t.group('profili: struttura', () => {
    t.ok(P.PROFILI.length >= 5, 'almeno 5 profili');
    const keys = P.PROFILI.map(p => p.key);
    t.eq(new Set(keys).size, keys.length, 'chiavi uniche');
    P.PROFILI.forEach(p => {
      t.ok(p.label && p.ipotesi && p.voci.length >= 3, p.key + ': etichetta, ipotesi, almeno 3 voci');
      const tm = p.voci.map(v => v.taskMode);
      t.eq(new Set(tm).size, tm.length, p.key + ': nessun esercizio doppio');
      p.voci.forEach(v => {
        t.ok(R.EXERCISES[v.taskMode], p.key + '/' + v.taskMode + ': esercizio esistente');
        t.ok(R.EXERCISES[v.taskMode] && R.EXERCISES[v.taskMode].ruolo !== 'misura', p.key + '/' + v.taskMode + ': non è uno strumento di sola misura');
        t.ok(Number.isInteger(v.livello) && v.livello >= 1 && v.livello <= 10, p.key + '/' + v.taskMode + ': livello 1-10');
        t.ok(v.perche && v.perche.length > 10, p.key + '/' + v.taskMode + ': motivazione');
      });
    });
  });
  t.group('profili: patchOf scrive i campi giusti', () => {
    t.eq(P.patchOf({ taskMode: 'nback', livello: 3, durataMin: 8 }), { nLevel: 3, titrationMode: 'adattivo', adaptive: true, durataMin: 8, feedbackProva: true }, 'N-back: nLevel, adattivo, durata');
    t.eq(P.patchOf({ taskMode: 'gonogo', livello: 2, durataMin: 0 }).adaptStartLevel, 2, 'Go/No-Go: adaptStartLevel');
    t.eq(P.patchOf({ taskMode: 'categorizzazione', livello: 3, durataMin: 8 }).categLivello, 3, 'Categorizzazione: categLivello');
    t.eq('durataMin' in P.patchOf({ taskMode: 'neglect', livello: 3, durataMin: 5 }), false, 'Cancellazione: niente durata a minuti');
    t.eq('adaptive' in P.patchOf({ taskMode: 'memoria', livello: 1, durataMin: 0 }), false, 'Strategie di memoria: non adattivo');
    P.PROFILI.forEach(p => p.voci.forEach(v => {
      const patch = P.patchOf(v);
      if (patch.adaptive) t.ok(T.TITRATION_EXERCISES.includes(v.taskMode) || T.TITRATION_MODE_EXTRA.includes(v.taskMode), p.key + '/' + v.taskMode + ': ha una titolazione');
    }));
  });
};
