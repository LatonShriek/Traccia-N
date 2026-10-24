'use strict';
// Motore "compito a obiettivi" (js/exercises/goaltask.js, passo 5f): regole, violazioni, punteggio,
// scenari e livelli. Il motore lavora solo sullo "state" ricevuto, quindi si prova senza pagina.
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const G = await importCore('../exercises/goaltask.js');
  const mk = (extra) => G.startGoalTask(Object.assign({ chiave: 'x', label: 'X', livello: 2, budgetSecondi: 100, budgetErroriTollerati: null, regole: [], distrattore: null, items: [] }, extra));
  const at = (st, sec) => { st.startedAt = performance.now() - sec * 1000; return st; };
  const types = st => st.violazioni.map(v => v.tipo);

  t.group('regole: dipendenza, categoria consecutiva, gruppo consecutivo', () => {
    const st = mk({ regole: ['no_consecutivi_stessa_categoria', 'no_versioni_consecutive_stesso_gruppo'], items: [
      { id: 'a', testo: 'a', categoria: 'c1', gruppo: 'g' }, { id: 'b', testo: 'b', categoria: 'c1', gruppo: 'g' },
      { id: 'c', testo: 'c', categoria: 'c2', vincoli: { richiede: 'z' } }, { id: 'z', testo: 'z', categoria: 'c3' }] });
    G.completeGoalTaskItem(st, 'a');
    t.eq(types(st), [], 'primo elemento: nessuna violazione');
    G.completeGoalTaskItem(st, 'b');
    t.eq(types(st), ['due_consecutivi_stessa_categoria', 'versioni_consecutive_stesso_gruppo'], 'stessa categoria e stesso gruppo di seguito');
    G.completeGoalTaskItem(st, 'c');
    t.ok(types(st).includes('dipendenza_non_rispettata'), 'prerequisito non ancora completato → violazione');
    t.eq(st.completati, ['a', 'b', 'c'], 'le regole penalizzano ma non bloccano il tocco');
    const n = st.violazioni.length;
    G.completeGoalTaskItem(st, 'c');
    t.eq([st.violazioni.length, st.completati.length], [n, 3], 'un elemento già completato non si ripete e non aggiunge violazioni');
    t.eq(G.completeGoalTaskItem(st, 'nonesiste'), st, 'id sconosciuto: stato invariato');
  });

  t.group('regole disattivate se non nello scenario', () => {
    const st = mk({ regole: [], items: [{ id: 'a', categoria: 'c1', gruppo: 'g' }, { id: 'b', categoria: 'c1', gruppo: 'g' }] });
    G.completeGoalTaskItem(st, 'a'); G.completeGoalTaskItem(st, 'b');
    t.eq(types(st), [], 'senza le regole nello scenario, nessuna violazione');
  });

  t.group('finestra oraria: dentro/fuori, e perdita allo scadere', () => {
    const items = [{ id: 'f', testo: 'f', finestra: { daSec: 10, aSec: 20 } }];
    const dentro = at(mk({ items }), 15); G.completeGoalTaskItem(dentro, 'f');
    t.eq(types(dentro), [], 'dentro la finestra: nessuna violazione');
    const presto = at(mk({ items }), 5); G.completeGoalTaskItem(presto, 'f');
    t.eq(types(presto), ['finestra_non_rispettata'], 'troppo presto → violazione, ma completabile');
    const tardi = at(mk({ items }), 25); G.completeGoalTaskItem(tardi, 'f');
    t.eq(types(tardi), ['finestra_non_rispettata'], 'troppo tardi → violazione');
    const perso = at(mk({ items }), 25); G.goalTaskTick(perso);
    t.eq([perso.persi, types(perso)], [['f'], ['finestra_scaduta_senza_completare']], 'allo scadere senza completare l\'elemento è perso');
    t.eq(G.goalTaskVisibleItems(perso).length, 0, 'un elemento perso non è più visibile');
    G.goalTaskTick(perso);
    t.eq(perso.violazioni.length, 1, 'il tick non duplica la perdita');
  });

  t.group('luogo rivisitato (Multiple Errands)', () => {
    const st = mk({ regole: ['ingresso_unico_per_luogo'], items: [
      { id: 'a', luogo: 'L1' }, { id: 'b', luogo: 'L2' }, { id: 'c', luogo: 'L1' }, { id: 'd', luogo: 'L1' }] });
    G.completeGoalTaskItem(st, 'a'); G.completeGoalTaskItem(st, 'c');
    t.eq(types(st), [], 'restare nello stesso luogo non è violazione');
    G.completeGoalTaskItem(st, 'b'); G.completeGoalTaskItem(st, 'd');
    t.eq(types(st), ['luogo_rivisitato'], 'tornare in un luogo già lasciato → violazione');
  });

  t.group('informazione: usarla prima di averla raccolta', () => {
    const st = mk({ items: [{ id: 'u', richiedeInfo: 'k' }, { id: 'p', fornisceInfo: 'k' }, { id: 'u2', richiedeInfo: 'k' }] });
    G.completeGoalTaskItem(st, 'u');
    t.eq(types(st), ['informazione_mancante'], 'info non ancora raccolta → violazione');
    G.completeGoalTaskItem(st, 'p'); G.completeGoalTaskItem(st, 'u2');
    t.eq(types(st), ['informazione_mancante'], 'dopo averla raccolta nessuna nuova violazione');
  });

  t.group('mutua esclusione e memoria prospettica', () => {
    const st = mk({ items: [{ id: 'a', escludeSe: 'b' }, { id: 'b' }, { id: 'p', prospettica: { dopoNAzioni: 2 } }, { id: 'c' }] });
    t.eq(G.goalTaskVisibleItems(st).map(i => i.id), ['a', 'b', 'c'], 'l\'elemento prospettico è nascosto all\'inizio');
    G.completeGoalTaskItem(st, 'a');
    t.eq(st.scartati, ['b'], 'scegliere a scarta b');
    G.completeGoalTaskItem(st, 'b');
    t.eq(st.completati, ['a'], 'b non è più completabile');
    G.completeGoalTaskItem(st, 'c');
    t.eq(G.goalTaskVisibleItems(st).map(i => i.id), ['a', 'p', 'c'], 'dopo 2 azioni l\'elemento prospettico compare; gli scartati no, i completati restano in lista');
  });

  t.group('distrattore: compare, si gestisce o scade', () => {
    const d = { alSec: 10, finestraSec: 20, item: { testo: 'telefono' } };
    const st = at(mk({ distrattore: d, items: [{ id: 'a' }] }), 5); G.goalTaskTick(st);
    t.eq(st.distrattoreAttivo, null, 'prima di alSec non compare');
    at(st, 12); G.goalTaskTick(st);
    t.eq(st.distrattoreAttivo.id, 'distrattore', 'compare a alSec');
    t.eq(G.goalTaskVisibleItems(st).map(i => i.id), ['a', 'distrattore'], 'è visibile in lista');
    G.completeGoalTaskItem(st, 'distrattore');
    t.ok(st.distrattoreGestito && st.distrattoreAttivo === null, 'gestirlo lo disattiva');
    t.eq(types(st), [], 'gestito in tempo: nessuna violazione');
    const sc = at(mk({ distrattore: d, items: [{ id: 'a' }] }), 12); G.goalTaskTick(sc);
    at(sc, 40); G.goalTaskTick(sc);
    t.eq(types(sc), ['distrattore_non_gestito'], 'scaduto senza gestirlo → violazione');
    t.eq(sc.distrattoreAttivo, null, 'e sparisce');
  });

  t.group('scoreGoalTask', () => {
    const st = at(mk({ budgetSecondi: 60, budgetErroriTollerati: 1, regole: ['no_consecutivi_stessa_categoria'], items: [{ id: 'a', categoria: 'c' }, { id: 'b', categoria: 'c' }, { id: 'z', categoria: 'd' }, { id: 'w', categoria: 'e' }] }), 30);
    G.completeGoalTaskItem(st, 'a'); G.completeGoalTaskItem(st, 'b');
    const sc = G.scoreGoalTask(st);
    t.eq([sc.completatiCount, sc.totaleElementi, sc.percentualeCompletamento], [2, 4, 50], 'completamento 2/4 = 50%');
    t.eq([sc.violazioniCount, sc.budgetRispettato, sc.erroriEntroSoglia, sc.sogliaErroriTollerati], [1, true, true, 1], 'budget rispettato e 1 errore su soglia 1');
    G.completeGoalTaskItem(st, 'w'); G.completeGoalTaskItem(st, 'z');
    st.violazioni.push({ tipo: 'x' });
    t.eq(G.scoreGoalTask(st).erroriEntroSoglia, false, 'oltre la soglia → false');
    at(st, 61);
    t.eq(G.scoreGoalTask(st).budgetRispettato, false, 'oltre il budget → false');
    const senza = G.scoreGoalTask(mk({ budgetSecondi: null, items: [] }));
    t.eq([senza.percentualeCompletamento, senza.budgetRispettato, senza.sogliaErroriTollerati, senza.erroriEntroSoglia], [0, true, null, true], 'scenario vuoto e senza budget/soglia');
  });

  t.group('scenari: coerenza interna di tutti quelli definiti', () => {
    const keys = Object.keys(G.GOALTASK_SCENARIOS);
    t.eq(keys.length, 11, '11 scenari (10 di allenamento + sonda di screening)');
    keys.forEach(k => {
      const sc = G.GOALTASK_SCENARIOS[k];
      t.eq(sc.chiave, k, k + ': la chiave coincide');
      for (let lv = 1; lv <= 5; lv++) {
        const inst = G.goalTaskInstanceFor(k, lv);
        const ids = inst.items.map(i => i.id);
        t.eq(new Set(ids).size, ids.length, k + ' L' + lv + ': id univoci');
        t.ok(inst.items.every(i => !(i.vincoli && i.vincoli.richiede) || ids.includes(i.vincoli.richiede) || lv === 1), k + ' L' + lv + ': ogni "richiede" punta a un elemento esistente');
        t.ok(inst.items.every(i => !i.escludeSe || ids.includes(i.escludeSe)), k + ' L' + lv + ': ogni "escludeSe" punta a un elemento esistente');
      }
    });
  });

  t.group('goalTaskInstanceFor — livelli 1-5', () => {
    const base = G.GOALTASK_SCENARIOS.sei_compiti_classico; // budget 600 s
    const L1 = G.goalTaskInstanceFor('sei_compiti_classico', 1), L2 = G.goalTaskInstanceFor('sei_compiti_classico', 2);
    t.eq(L1.regole, [], 'L1: nessuna regola');
    t.eq(L1.items.length, Math.max(3, base.items.length - 2), 'L1: elementi ridotti di 2 (minimo 3)');
    t.eq(L1.budgetSecondi, Math.round(base.budgetSecondi * 1.6), 'L1: budget ×1.6');
    t.eq([L2.items.length, L2.budgetSecondi, L2.regole], [base.items.length, base.budgetSecondi, base.regole || []], 'L2: lo scenario base invariato');
    const L5 = G.goalTaskInstanceFor('sei_compiti_classico', 5);
    t.eq(L5.budgetSecondi, Math.round(base.budgetSecondi * 0.55), 'L5: budget ×0.55');
    t.ok(G.goalTaskInstanceFor('cucina_te', 4).items.length >= G.goalTaskInstanceFor('cucina_te', 3).items.length, 'i livelli sono cumulativi (mai meno elementi)');
    t.eq(G.goalTaskInstanceFor('cucina_te', undefined).livello, 2, 'livello assente → 2');
    t.eq(G.goalTaskInstanceFor('cucina_te', 99).livello, 5, 'livello oltre il massimo → 5');
    t.eq(G.goalTaskInstanceFor('inesistente', 3), null, 'scenario sconosciuto → null');
    t.ok(G.goalTaskInstanceFor('sicurezza_domestica', 5).budgetErroriTollerati === 2, 'sicurezza_domestica L5: soglia errori 2');
    t.ok(G.goalTaskInstanceFor('sicurezza_domestica', 4).distrattore !== null, 'sicurezza_domestica L4: distrattore');
    t.eq(G.goalTaskInstanceFor('screening_breve', 2).regole, ['no_consecutivi_stessa_categoria'], 'sonda di screening a L2 mantiene le regole');
  });

  t.group('goalTaskItemIcon', () => {
    t.eq(G.goalTaskItemIcon({ icona: 'X', categoria: 'prep' }), 'X', 'icona esplicita');
    t.eq(G.goalTaskItemIcon({ categoria: 'prep' }), '🫖', 'icona di categoria');
    t.eq(G.goalTaskItemIcon({ categoria: 'boh' }), '▫️', 'icona di ripiego');
  });
};
