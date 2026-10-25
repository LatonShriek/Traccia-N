'use strict';
// Passo 8: copia di sicurezza in JSON (js/services/backup.js) con uno storage finto.
const path = require('path');
const { pathToFileURL } = require('url');

class FakeStorage {
  constructor(init, limit){ this.m = new Map(Object.entries(init || {})); this.limit = limit; }
  get length(){ return this.m.size; }
  key(i){ return Array.from(this.m.keys())[i] ?? null; }
  getItem(k){ return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v){ if(this.limit !== undefined && !this.m.has(k) && this.m.size >= this.limit) throw new Error('QuotaExceeded'); this.m.set(k, String(v)); }
  removeItem(k){ this.m.delete(k); }
}
const J = o => JSON.stringify(o);
const ord = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));

module.exports = async function run(t) {
  const B = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'services', 'backup.js')).href);
  const S = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'services', 'local-store.js')).href);
  const K = S.KEY;
  const dati = () => ({
    [K.localPatient + 'p1']: J({ id:'p1', codice:'AB' }),
    [K.localPatient + 'p2']: J({ id:'p2', codice:'CD' }),
    [K.session + 's1']: J({ id:'s1', localPatientId:'p1' }),
    [K.session + 's2']: J({ id:'s2', localPatientId:'p2' }),
    [K.session + 's3']: J({ id:'s3', localPatientId:'p2' }),
    [K.preset + 'x']: J({ id:'x', name:'Mattino' }),
    [K.screeningProgress + 'p1']: J({ step:2 }),
    [K.cloudUrl]: 'https://esempio.supabase.co',
    [K.cloudKey]: 'chiave-segreta',
    'altra-app:cosa': '1'
  });

  t.group('creazione della copia', () => {
    const st = new FakeStorage(dati());
    const b = B.buildBackup(st, new Date('2026-10-25T10:00:00Z'));
    t.eq(b.formato, 'traccian-backup', 'formato');
    t.eq(b.versione, 1, 'versione');
    t.eq(b.creato, '2026-10-25T10:00:00.000Z', 'data');
    t.eq(b.conteggi, { pazienti:2, sedute:3, preset:1, screening:1 }, 'conteggi');
    t.eq(Object.keys(b.dati).length, 7, '7 chiavi salvate');
    t.ok(!(K.cloudKey in b.dati) && !(K.cloudUrl in b.dati), 'la configurazione del cloud NON entra nella copia');
    t.ok(!('altra-app:cosa' in b.dati), 'dati di altre app esclusi');
    t.ok(!JSON.stringify(b).includes('chiave-segreta'), 'nessuna chiave nel file');
    t.eq(b.dati[K.session + 's1'], J({ id:'s1', localPatientId:'p1' }), 'valori identici a quelli salvati');
    t.ok(B.validateBackup(JSON.parse(JSON.stringify(b))).ok, 'dopo andata e ritorno in JSON è valida');
    t.eq(B.buildBackup(new FakeStorage({}), new Date()).conteggi, { pazienti:0, sedute:0, preset:0, screening:0 }, 'storage vuoto: copia vuota ma valida');
  });

  t.group('validazione', () => {
    const ok = B.buildBackup(new FakeStorage(dati()));
    t.ok(B.validateBackup(ok).ok, 'copia buona');
    t.ok(!B.validateBackup(null).ok, 'null');
    t.ok(!B.validateBackup([]).ok, 'array');
    t.ok(!B.validateBackup({}).ok, 'oggetto vuoto');
    t.ok(!B.validateBackup(Object.assign({}, ok, { formato:'altro' })).ok, 'formato diverso');
    t.ok(!B.validateBackup(Object.assign({}, ok, { versione:2 })).ok, 'versione futura');
    t.ok(!B.validateBackup(Object.assign({}, ok, { dati:null })).ok, 'dati mancanti');
    t.ok(!B.validateBackup(Object.assign({}, ok, { dati:{ [K.cloudKey]:'"x"' } })).ok, 'chiave cloud non ammessa');
    t.ok(!B.validateBackup(Object.assign({}, ok, { dati:{ 'altra:x':'1' } })).ok, 'chiave estranea non ammessa');
    t.ok(!B.validateBackup(Object.assign({}, ok, { dati:{ [K.session + 'a']:'{rotto' } })).ok, 'JSON illeggibile');
    t.ok(!B.validateBackup(Object.assign({}, ok, { dati:{ [K.session + 'a']:{ id:'a' } } })).ok, 'valore non stringa');
  });

  t.group('ripristino: unisci', () => {
    const copia = B.buildBackup(new FakeStorage(dati()));
    const st = new FakeStorage({ [K.session + 's1']: J({ id:'s1', modificata:true }), [K.session + 's9']: J({ id:'s9' }), [K.cloudKey]: 'k' });
    const r = B.restoreBackup(copia, st, 'unisci');
    t.eq(r, { aggiunti:6, giaPresenti:1, rimossi:0 }, 'conteggi');
    t.eq(st.getItem(K.session + 's1'), J({ id:'s1', modificata:true }), 'la seduta già presente NON viene toccata');
    t.ok(st.getItem(K.session + 's9') !== null, 'la seduta che c\'era solo qui resta');
    t.ok(st.getItem(K.localPatient + 'p2') !== null, 'profilo mancante aggiunto');
    t.eq(st.getItem(K.cloudKey), 'k', 'configurazione cloud intatta');
    const r2 = B.restoreBackup(copia, st, 'unisci');
    t.eq(r2, { aggiunti:0, giaPresenti:7, rimossi:0 }, 'ripetuto: non duplica nulla');
  });

  t.group('ripristino: sostituisci', () => {
    const copia = B.buildBackup(new FakeStorage(dati()));
    const st = new FakeStorage({ [K.session + 's9']: J({ id:'s9' }), [K.session + 's1']: J({ id:'s1', modificata:true }), [K.cloudUrl]: 'u', 'altra-app:cosa': '1' });
    const r = B.restoreBackup(copia, st, 'sostituisci');
    t.eq(r, { aggiunti:7, giaPresenti:0, rimossi:2 }, 'conteggi');
    t.eq(st.getItem(K.session + 's9'), null, 'la seduta non presente nella copia è tolta');
    t.eq(st.getItem(K.session + 's1'), J({ id:'s1', localPatientId:'p1' }), 'la seduta torna come nella copia');
    t.eq(st.getItem(K.cloudUrl), 'u', 'configurazione cloud intatta');
    t.eq(st.getItem('altra-app:cosa'), '1', 'dati di altre app intatti');
    t.eq(B.buildBackup(st).dati, copia.dati, 'dopo il ripristino i dati coincidono con la copia');
  });

  t.group('ripristino: errori', () => {
    const copia = B.buildBackup(new FakeStorage(dati()));
    let err = null;
    try{ B.restoreBackup({ formato:'x' }, new FakeStorage({}), 'unisci'); }catch(e){ err = e; }
    t.ok(err, 'copia non valida: errore');
    err = null;
    try{ B.restoreBackup(copia, new FakeStorage({}), 'boh'); }catch(e){ err = e; }
    t.ok(err, 'modo sconosciuto: errore');
    // memoria piena a metà: lo stato di prima viene rimesso intatto
    const prima = { [K.session + 'v1']: J({ id:'v1' }), [K.session + 'v2']: J({ id:'v2' }), [K.preset + 'q']: J({ id:'q' }) };
    const st = new FakeStorage(prima, 5);
    err = null;
    try{ B.restoreBackup(copia, st, 'sostituisci'); }catch(e){ err = e; }
    t.ok(err && /Quota/.test(err.message), 'memoria piena: errore passato a chi chiama');
    t.eq(ord(B.buildBackup(st).dati), ord(prima), 'sostituisci fallito: dati di prima intatti');
    const st2 = new FakeStorage(prima, 4);
    err = null;
    try{ B.restoreBackup(copia, st2, 'unisci'); }catch(e){ err = e; }
    t.ok(err, 'unisci con memoria piena: errore');
    t.eq(ord(B.buildBackup(st2).dati), ord(prima), 'unisci fallito: dati di prima intatti');
  });
};
