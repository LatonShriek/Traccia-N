'use strict';
// Passaggio livelli con PdM: sezione del Setup, in un browser vero con un paziente locale.
// Verifica: senza paziente c'è solo l'avviso; con paziente il codice riflette i livelli salvati; incollando un codice di PdM
// i livelli del paziente cambiano (in modo prudente) senza toccare la configurazione aperta; un codice sbagliato è respinto.
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./patient-agent');
const REPO_ROOT = path.join(__dirname, '..', '..');

module.exports = async function run(t) {
  const server = await startStaticServer(REPO_ROOT);
  const browser = await chromium.launch(process.env.TRACCIAN_NO_SANDBOX ? { args: ['--no-sandbox'] } : {});
  try {
    const page = await (await browser.newContext({ serviceWorkers: 'block' })).newPage();
    const jsErrors = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    page.on('dialog', d => d.accept().catch(() => {}));
    const wait = ms => page.waitForTimeout(ms);
    // L'app non ha un percorso a interfaccia verso «paziente in presenza» senza account (serve l'operatore collegato):
    // la pagina viene servita con un unico gancio di prova che sceglie il paziente, il resto è il codice vero.
    await page.route('**/index.html', async route => {
      const res = await route.fetch(); let body = await res.text();
      body = body.replace('restoreCloudSession().finally(', 'window.__scegliPaziente = id => { activeLocalPatientId = id; activeRemotePatientId = null; view = \'setup\'; render(); };\n  restoreCloudSession().finally(');
      await route.fulfill({ response: res, body });
    });
    await page.goto(server.url + '/index.html'); await wait(500);
    await page.evaluate(() => {
      localStorage.setItem('traccian:localpatient:p1', JSON.stringify({ id: 'p1', nome: 'PROVA', attivo: true, creatoIl: Date.now(),
        livelliEsercizi: { griglie: { taskMode: 'griglie', adaptStartLevel: 3, trials: 10 } } }));
    });
    await page.reload(); await wait(500);
    await page.click('text=usa questo dispositivo in locale'); await wait(300);

    await t.group('senza paziente: solo l\'avviso', async () => {
      await page.click('text=Passaggio livelli con PdM'); await wait(250);
      t.ok(await page.locator('text=Scegli prima il paziente').count() > 0, 'avviso mostrato');
      t.eq(await page.locator('#passCode').count(), 0, 'nessun campo codice');
    });

    await page.evaluate(() => window.__scegliPaziente('p1')); await wait(400);
    if (!(await page.locator('#passCode').isVisible())) { await page.click('text=Passaggio livelli con PdM'); await wait(250); }

    await t.group('con paziente: il codice riflette i livelli salvati', async () => {
      t.eq(await page.inputValue('#passCode').then(v => v.replace(/-\d\d$/, '')), 'TRN-G8', 'griglie livello 3 = 8 del generatore');
    });

    await t.group('codice di PdM: i livelli del paziente cambiano, in modo prudente', async () => {
      const code = await page.evaluate(async () => (await import('./js/core/passaggio.js')).passaggioBuild('PDM', { intrusopercettivo: 12, griglie: 18, inversione: 15 }));
      await page.fill('#passIn', code);
      await page.click('button:has-text("Applica")'); await wait(500);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('traccian:localpatient:p1')).livelliEsercizi);
      t.eq(saved.intrusopercettivo.adaptStartLevel, 4, 'intruso: gen 12 → livello 4');
      t.eq(saved.griglie.adaptStartLevel, 6, 'griglie: gen 18 → livello 6');
      t.eq(saved.inversione.taskMode, 'inversione', 'inversione salvata con il proprio esercizio');
      t.ok(saved.inversione.adaptStartLevel >= 4 && saved.inversione.adaptStartLevel <= 5, 'inversione: gen 15 → livello 5 (prudente)');
      t.ok(await page.locator('text=Impostati per questo paziente').count() > 0, 'conferma mostrata');
      const code2 = await page.inputValue('#passCode');
      const back = await page.evaluate(async c => (await import('./js/core/passaggio.js')).passaggioParse(c), code2);
      t.ok(back.ok && back.levels.griglie <= 18 && back.levels.intrusopercettivo <= 12 && back.levels.inversione <= 15, 'il codice di ritorno non supera quello ricevuto');
    });

    await t.group('codice sbagliato respinto, niente cambia', async () => {
      const before = await page.evaluate(() => localStorage.getItem('traccian:localpatient:p1'));
      await page.fill('#passIn', 'PDM-I12-G18-V15-00');
      await page.click('button:has-text("Applica")'); await wait(300);
      t.ok(await page.locator('text=non torna').count() > 0, 'errore mostrato');
      t.eq(await page.evaluate(() => localStorage.getItem('traccian:localpatient:p1')), before, 'dati invariati');
    });
    t.eq(jsErrors.length, 0, 'nessun errore di pagina ' + jsErrors.join('|'));
  } finally { await browser.close(); server.close && server.close(); }
};
