'use strict';
const { importCore } = require('./lib/core');
const path = require('path');
const { pathToFileURL } = require('url');

// localStorage finto, in memoria, con la stessa interfaccia del browser.
function fakeStorage() {
  const m = new Map();
  return {
    get length() { return m.size; },
    key: i => Array.from(m.keys())[i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    _m: m
  };
}

module.exports = async function run(t) {
  global.localStorage = fakeStorage();
  const S = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'services', 'local-store.js')).href);

  t.group('chiavi e formato dei dati (devono restare quelli di sempre)', () => {
    t.eq(S.KEY.localPatient, 'traccian:localpatient:', 'prefisso profili locali');
    t.eq(S.KEY.session, 'traccian:sessione:', 'prefisso sedute');
    t.eq(S.KEY.preset, 'traccian:preset:', 'prefisso preset');
    t.eq(S.KEY.screeningProgress, 'traccian:screeningprogress:', 'prefisso avanzamento screening');
    S.setLocalPatient({ id: 'lp-1', nome: 'Anna' });
    t.eq(localStorage.getItem('traccian:localpatient:lp-1'), '{"id":"lp-1","nome":"Anna"}', 'chiave e JSON identici al formato precedente');
  });

  t.group('letture sicure', () => {
    t.eq(S.getLocalPatient('manca'), null, 'assente = null');
    localStorage.setItem('traccian:localpatient:rotto', '{non json');
    t.eq(S.getLocalPatient('rotto'), null, 'illeggibile = null, senza eccezioni');
    t.eq(S.readJSON('traccian:nulla'), null, 'readJSON assente = null');
  });

  t.group('updateLocalPatient', () => {
    const r = S.updateLocalPatient('lp-1', p => { p.attivo = false; });
    t.eq(r, { id: 'lp-1', nome: 'Anna', attivo: false }, 'restituisce il profilo aggiornato');
    t.eq(S.getLocalPatient('lp-1').attivo, false, 'scrive davvero');
    t.eq(S.updateLocalPatient('manca', p => { p.x = 1; }), null, 'profilo assente: null, nulla creato');
    t.ok(localStorage.getItem('traccian:localpatient:manca') === null, 'nessuna chiave creata');
    const r2 = S.updateLocalPatient('lp-1', p => { p.attivo = true; return false; });
    t.eq(r2, false, 'fn che restituisce false: nessuna scrittura');
    t.eq(S.getLocalPatient('lp-1').attivo, false, 'valore invariato dopo false');
  });

  t.group('elenchi per prefisso: saltano i record illeggibili, non mescolano i prefissi', () => {
    S.setLocalPatient({ id: 'lp-2', nome: 'Bruno' });
    localStorage.setItem('traccian:sessione:s1', JSON.stringify({ id: 's1', localPatientId: 'lp-1' }));
    t.eq(S.readAllLocalPatients().map(p => p.id).sort(), ['lp-1', 'lp-2'], 'solo i profili validi');
    t.eq(S.listSessionsLocal().map(s => s.id), ['s1'], 'solo le sedute');
  });

  t.group('rimozione e scrittura sedute', () => {
    S.removeLocalPatient('lp-2');
    t.eq(S.getLocalPatient('lp-2'), null, 'rimosso');
    S.saveSessionLocal({ id: 's2', pazienteId: null });
    t.eq(JSON.parse(localStorage.getItem('traccian:sessione:s2')).id, 's2', 'seduta salvata con la chiave di sempre');
  });

  t.group('rewriteSessionsLocal riscrive solo le sedute modificate', () => {
    S.rewriteSessionsLocal(rec => { if (rec.localPatientId === 'lp-1') { rec.pazienteId = 'remoto-9'; return true; } return false; });
    t.eq(JSON.parse(localStorage.getItem('traccian:sessione:s1')).pazienteId, 'remoto-9', 'seduta del profilo migrata');
    t.eq(JSON.parse(localStorage.getItem('traccian:sessione:s2')).pazienteId, null, 'le altre intatte');
  });

  t.group('scrittura fallita: l\'eccezione arriva al chiamante (come con setItem)', () => {
    const orig = localStorage.setItem;
    localStorage.setItem = () => { throw new Error('quota'); };
    let threw = false;
    try { S.setLocalPatient({ id: 'x' }); } catch (e) { threw = true; }
    localStorage.setItem = orig;
    t.ok(threw, 'lancia, il chiamante decide con try/catch');
  });

  delete global.localStorage;
};
