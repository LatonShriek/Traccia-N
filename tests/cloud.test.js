'use strict';
const { importCore } = require('./lib/core');

// Query e conversioni di js/services/cloud.js, con un Supabase finto che registra le chiamate.
function fakeSb(responses) {
  const calls = [];
  return {
    calls,
    from(table) {
      const rec = { table, ops: [] };
      calls.push(rec);
      const q = {};
      ['select', 'eq', 'or', 'order', 'limit', 'gte', 'upsert', 'insert'].forEach(m => {
        q[m] = (...a) => { rec.ops.push([m, ...a]); return q; };
      });
      q.then = (res, rej) => Promise.resolve(responses[table] || { data: [], error: null }).then(res, rej);
      return q;
    }
  };
}

module.exports = async function run(t) {
  const C = await importCore('../services/cloud.js');

  await t.group('recToRow / rowToRec — andata e ritorno', async () => {
    const rec = { id: 's1', ts: 1000, dateLabel: 'x', stimType: 'lettere', nLevel: 2, trials: 24, isi: 2000, stimDuration: 500,
      respMode: 'touch', patientCode: 'AB', notes: 'n', taskMode: 'nback', targetSeq: ['A'], finalLevel: 3, counts: { hits: 5 },
      metrics: { dprime: 1 }, avgRT: 600, durationMs: 60000, family: 'signal', pazienteId: 'p9', localPatientId: null,
      titrationMode: 'adattivo', targetRate: 0.3 };
    const row = C.recToRow(rec, { id: 'op1' }, null);
    t.eq(row.operatore_id, 'op1', 'operatore: operatore_id = utente');
    t.eq(row.paziente_id, 'p9', 'operatore: paziente_id dal record');
    t.eq(row.final_level, '3', 'final_level come testo');
    const rowP = C.recToRow(rec, { id: 'pz1' }, { operatore_id: 'opX' });
    t.eq([rowP.operatore_id, rowP.paziente_id], ['opX', 'pz1'], 'paziente che salva: operatore del paziente, paziente = utente');
    const back = C.rowToRec(row);
    t.eq([back.id, back.nLevel, back.finalLevel, back.family, back.titrationMode, back.targetRate], ['s1', 2, 3, 'signal', 'adattivo', 0.3], 'campi principali ritrovati');
    t.eq(C.rowToRec(Object.assign({}, row, { final_level: '5/10' })).finalLevel, '5/10', 'final_level con barra resta testo');
    t.eq(C.rowToRec(Object.assign({}, row, { titration_mode: undefined, target_rate: undefined })).titrationMode, null, 'colonne assenti: null');
  });

  await t.group('query — tabella e filtri', async () => {
    const sb = fakeSb({ sessioni: { data: [{ id: 'a' }], error: null } });
    const rows = await C.fetchSessionRows(sb, 'u1');
    t.eq(rows, [{ id: 'a' }], 'righe restituite');
    t.eq(sb.calls[0].table, 'sessioni', 'tabella sessioni');
    t.eq(sb.calls[0].ops.find(o => o[0] === 'or')[1], 'operatore_id.eq.u1,paziente_id.eq.u1', 'filtro operatore o paziente');
    const sb2 = fakeSb({ sessioni: { data: null, error: { message: 'x' } } });
    let threw = false; try { await C.fetchSessionRows(sb2, 'u1'); } catch (e) { threw = true; }
    t.ok(threw, 'errore del server: lancia (decide il chiamante)');
    const sb3 = fakeSb({});
    await C.fetchUsageRows(sb3, 'p1', 5);
    t.ok(sb3.calls[0].ops.some(o => o[0] === 'gte' && o[1] === 'ts' && o[2] === 5), 'filtro per data presente');
    const sb4 = fakeSb({});
    await C.fetchUsageRows(sb4, 'p1', null);
    t.ok(!sb4.calls[0].ops.some(o => o[0] === 'gte'), 'senza data: nessun filtro');
  });

  await t.group('minutesOf', () => {
    t.eq(C.minutesOf([{ duration_ms: 60000 }, { duration_ms: 90000 }, {}]), 3, '60 s + 90 s = 150 s ≈ 3 min (arrotondato)');
    t.eq(C.minutesOf([]), 0, 'vuoto = 0');
  });

  await t.group('registri', async () => {
    const sb = fakeSb({});
    await C.insertAccessEvent(sb, 'login', 'fallito', 'operatore', null, 'a@b.it');
    t.eq(sb.calls[0].ops[0][1].email_tentata, 'a@b.it', 'email tentata registrata');
    t.eq(sb.calls[0].ops[0][1].user_id, null, 'user_id assente = null');
    const sb2 = fakeSb({});
    await C.insertAuditAction(sb2, { id: 'u', email: 'e@e.it' }, 'archivia_paziente', 'paziente', 'p1');
    const row = sb2.calls[0].ops[0][1];
    t.eq([sb2.calls[0].table, row.eseguita_da, row.bersaglio_etichetta], ['audit_log', 'u', null], 'audit: autore e etichetta nulla');
  });
};
