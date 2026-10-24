'use strict';
// Controllo del ruolo all'accesso (checkRole): estrae la funzione VERA da
// index.html e la prova con un Supabase finto in memoria. Il caso che
// interessa di più è l'account "senza ruolo" (autenticato ma senza riga né in
// 'pazienti' né in 'operatori'): non deve entrare come operatore.
const path = require('path');
const vm = require('vm');
const { readAppScript, extractBlocks } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const code = extractBlocks(readAppScript(REPO_ROOT), [
  { name: 'checkRole', start: '  async function checkRole(){', end: "nessun blocco dell'app\n    }\n  }" }
]);

// Supabase finto: sb.from(tabella).select(...).eq('id', ...).maybeSingle()
// risponde con la riga/errore configurati per quella tabella.
function fakeSb(cfg) {
  return {
    from(table) {
      const q = {
        select() { return q; },
        eq() { return q; },
        maybeSingle() {
          if (cfg[table + 'Error']) return Promise.resolve({ data: null, error: { message: cfg[table + 'Error'] } });
          const row = cfg[table];
          return Promise.resolve({ data: row === undefined ? null : row, error: null });
        }
      };
      return q;
    }
  };
}

async function runCheckRole(cfg, opts) {
  opts = opts || {};
  const sandbox = {
    console,
    sb: opts.noSb ? null : fakeSb(cfg),
    cloudUser: opts.noUser ? null : { id: 'u1', email: 'prova@example.com' },
    patientProfile: 'DA-AZZERARE', isSuperOperatore: 'DA-AZZERARE',
    operatorInactive: 'DA-AZZERARE', operatorNoRole: 'DA-AZZERARE'
  };
  vm.createContext(sandbox);
  vm.runInContext(code + '\n;this.__checkRole = checkRole;', sandbox);
  await sandbox.__checkRole();
  return {
    patient: !!sandbox.patientProfile,
    super: sandbox.isSuperOperatore,
    inactive: sandbox.operatorInactive,
    noRole: sandbox.operatorNoRole
  };
}

module.exports = async function run(t) {
  await t.group('checkRole — paziente', async () => {
    const r = await runCheckRole({ pazienti: { id: 'u1', attivo: true } });
    t.eq(r, { patient: true, super: false, inactive: false, noRole: false }, 'un paziente resta un paziente, mai bloccato come operatore');
  });

  await t.group('checkRole — operatore attivo', async () => {
    const r = await runCheckRole({ operatori: { super: false, attivo: true } });
    t.eq(r, { patient: false, super: false, inactive: false, noRole: false }, 'operatore attivo: nessun blocco');
  });

  await t.group('checkRole — super-operatore', async () => {
    const r = await runCheckRole({ operatori: { super: true, attivo: true } });
    t.eq(r, { patient: false, super: true, inactive: false, noRole: false }, 'super-operatore riconosciuto, nessun blocco');
  });

  await t.group('checkRole — operatore archiviato', async () => {
    const r = await runCheckRole({ operatori: { super: false, attivo: false } });
    t.eq(r, { patient: false, super: false, inactive: true, noRole: false }, 'archiviato: bloccato, ma NON come "senza ruolo"');
  });

  await t.group('checkRole — account SENZA RUOLO (nessuna riga né in pazienti né in operatori)', async () => {
    const r = await runCheckRole({});
    t.eq(r, { patient: false, super: false, inactive: true, noRole: true }, 'senza ruolo: bloccato con il flag dedicato');
  });

  await t.group('checkRole — colonna "attivo" non ancora migrata', async () => {
    const r = await runCheckRole({ operatori: { super: false } });
    t.eq(r, { patient: false, super: false, inactive: false, noRole: false }, 'riga presente senza colonna attivo: nessun blocco per errore');
  });

  await t.group('checkRole — tabella operatori non raggiungibile (errore)', async () => {
    const r = await runCheckRole({ operatoriError: 'relation "operatori" does not exist' });
    t.eq(r, { patient: false, super: false, inactive: false, noRole: false }, 'con un errore della query non si blocca nulla (come prima)');
  });

  await t.group('checkRole — nessun utente / nessun cloud', async () => {
    const r1 = await runCheckRole({}, { noUser: true });
    t.eq(r1, { patient: false, super: false, inactive: false, noRole: false }, 'senza utente: tutto azzerato, nessun blocco');
    const r2 = await runCheckRole({}, { noSb: true });
    t.eq(r2, { patient: false, super: false, inactive: false, noRole: false }, 'senza Supabase: tutto azzerato, nessun blocco');
  });
};
