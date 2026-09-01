'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

// localStorage finto, in memoria — le funzioni reali usano getItem/
// setItem esattamente come farebbero in un vero browser, qui restano
// dentro questo processo di test, mai su disco.
function makeFakeLocalStorage() {
  const store = new Map();
  return {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: k => store.delete(k)
  };
}

const fakeLocalStorage = makeFakeLocalStorage();
// syncLocalPatientToCloud/patientProfile/sb/cloudUser/cachedRemotePatients:
// le funzioni reali le referenziano anche nel ramo 'local' (la sincronizzazione
// in background dopo un salvataggio locale, no-op qui — non stiamo testando
// la sincronizzazione cloud) o servono solo perché il ramo 'remote' della
// stessa funzione deve poter essere ANALIZZATO senza errori, anche se i
// nostri test lo evitano sempre passando kind:'local'.
const mod = loadPure(REPO_ROOT, [
  { name: 'namedConfigsFor+saveNamedConfig+deleteNamedConfig', start: '  function namedConfigsFor(patientLike, taskMode){', end: "'cancellazione configurazione nominale fallita', e); return false; }\n    }\n    return false;\n  }" }
], ['namedConfigsFor', 'saveNamedConfig', 'deleteNamedConfig'], {
  localStorage: fakeLocalStorage,
  syncLocalPatientToCloud: () => {},
  patientProfile: null,
  sb: null,
  cloudUser: null,
  cachedRemotePatients: null
});

const { namedConfigsFor, saveNamedConfig, deleteNamedConfig } = mod;

function seedLocalPatient(id, extra) {
  fakeLocalStorage.setItem('traccian:localpatient:' + id, JSON.stringify(Object.assign({ id, nome: 'Paziente di prova' }, extra)));
}
function readLocalPatient(id) {
  return JSON.parse(fakeLocalStorage.getItem('traccian:localpatient:' + id));
}

module.exports = async function run(t) {
  await t.group('saveNamedConfig — crea un nuovo slot', async () => {
    seedLocalPatient('p1');
    const ok = await saveNamedConfig('local', 'p1', 'gonogo', 'Livello base', { taskMode: 'gonogo', trials: 24, titrationMode: 'livello' });
    t.ok(ok, 'il salvataggio segnala successo');
    const list = namedConfigsFor(readLocalPatient('p1'), 'gonogo');
    t.eq(list.length, 1, 'uno slot creato');
    t.eq(list[0].nome, 'Livello base', 'nome salvato correttamente');
    t.eq(list[0].cfg.trials, 24, 'configurazione salvata correttamente');
  });

  await t.group('saveNamedConfig — salvare di nuovo con lo STESSO nome sovrascrive, non duplica', async () => {
    seedLocalPatient('p2');
    await saveNamedConfig('local', 'p2', 'nback', 'Prova', { taskMode: 'nback', trials: 24 });
    await saveNamedConfig('local', 'p2', 'nback', 'Prova', { taskMode: 'nback', trials: 40 });
    const list = namedConfigsFor(readLocalPatient('p2'), 'nback');
    t.eq(list.length, 1, 'resta un solo slot con quel nome, non due');
    t.eq(list[0].cfg.trials, 40, 'il contenuto è quello dell\'ultimo salvataggio');
  });

  await t.group('saveNamedConfig — nomi diversi restano slot separati', async () => {
    seedLocalPatient('p3');
    await saveNamedConfig('local', 'p3', 'switching', 'Livello base', { taskMode: 'switching', trials: 24 });
    await saveNamedConfig('local', 'p3', 'switching', 'Rivalutazione marzo', { taskMode: 'switching', trials: 30 });
    const list = namedConfigsFor(readLocalPatient('p3'), 'switching');
    t.eq(list.length, 2, 'due slot distinti');
  });

  await t.group('saveNamedConfig — esercizi diversi non si mescolano', async () => {
    seedLocalPatient('p4');
    await saveNamedConfig('local', 'p4', 'nback', 'A', { taskMode: 'nback', trials: 24 });
    await saveNamedConfig('local', 'p4', 'gonogo', 'A', { taskMode: 'gonogo', trials: 24 });
    const p = readLocalPatient('p4');
    t.eq(namedConfigsFor(p, 'nback').length, 1, 'uno slot per N-back');
    t.eq(namedConfigsFor(p, 'gonogo').length, 1, 'uno slot per Go/No-Go, separato');
  });

  await t.group('deleteNamedConfig — rimuove solo lo slot indicato', async () => {
    seedLocalPatient('p5');
    await saveNamedConfig('local', 'p5', 'stopsignal', 'Uno', { taskMode: 'stopsignal', trials: 24 });
    await saveNamedConfig('local', 'p5', 'stopsignal', 'Due', { taskMode: 'stopsignal', trials: 24 });
    await deleteNamedConfig('local', 'p5', 'stopsignal', 'Uno');
    const list = namedConfigsFor(readLocalPatient('p5'), 'stopsignal');
    t.eq(list.length, 1, 'resta un solo slot');
    t.eq(list[0].nome, 'Due', 'è rimasto quello giusto, non quello cancellato');
  });

  t.group('namedConfigsFor — paziente senza nulla salvato restituisce un array vuoto, mai un errore', () => {
    seedLocalPatient('p6');
    t.eq(namedConfigsFor(readLocalPatient('p6'), 'nback'), [], 'nessuno slot, array vuoto');
    t.eq(namedConfigsFor(null, 'nback'), [], 'paziente nullo, array vuoto (non un crash)');
  });
};
