'use strict';
// Tasto indietro di sistema (Android / browser) e «← Indietro» dell'app, in un browser vero.
// Verifica: stessa destinazione per i due pulsanti, conferma durante una prova,
// nessuna sessione fantasma dopo il conto alla rovescia, uscita con conferma.
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./patient-agent');
const REPO_ROOT = path.join(__dirname, '..', '..');

module.exports = async function run(t) {
  const server = await startStaticServer(REPO_ROOT);
  const browser = await chromium.launch(process.env.TRACCIAN_NO_SANDBOX ? { args: ['--no-sandbox'] } : {});
  try {
    const page = await browser.newPage();
    const jsErrors = [], dialogs = []; let answers = [];
    page.on('pageerror', e => jsErrors.push(e.message));
    page.on('dialog', async d => { dialogs.push(d.message()); const ok = answers.length ? answers.shift() : true; await (ok ? d.accept() : d.dismiss()).catch(() => {}); });
    const wait = ms => page.waitForTimeout(ms);
    const has = async txt => (await page.locator('text=' + txt).count()) > 0;
    const hash = () => page.evaluate(() => location.hash);
    const sys = async () => { await page.goBack().catch(() => {}); await wait(350); }; // tasto indietro di Android

    await page.goto(server.url + '/index.html'); await wait(500);
    await page.click('text=usa questo dispositivo in locale'); await wait(300);

    await t.group('«← Indietro» e tasto di sistema vanno nello stesso posto', async () => {
      await page.click('text=Storico sessioni'); await wait(300);
      t.eq(await hash(), '#history', 'sullo storico');
      await page.click('button:has-text("← Indietro")'); await wait(400);
      t.eq(await hash(), '#setup', '«← Indietro» riporta al setup');
      await page.click('text=Storico sessioni'); await wait(300);
      await sys();
      t.eq(await hash(), '#setup', 'tasto di sistema dallo storico riporta al setup (prima: B, A, B)');
      await page.click('text=Storico sessioni'); await wait(300);
      await page.click('button:has-text("← Indietro")'); await wait(400);
      await sys();
      t.ok(!(await has('Storico sessioni →')) || (await hash()) !== '#history', 'dopo «Indietro» il tasto di sistema non torna sullo storico');
    });

    await page.goto(server.url + '/index.html'); await wait(500);
    await page.click('text=usa questo dispositivo in locale'); await wait(300);
    const startExercise = async () => {
      await page.click('button:has-text("N-back classico")'); await wait(250);
      await page.click('text=Avvia sessione'); await wait(300);
    };

    await t.group('conto alla rovescia: indietro non lascia partire la sessione', async () => {
      await startExercise();
      await page.click('text=Ho capito, inizia'); await wait(400);
      await sys();
      await wait(4500);
      t.ok(!(await has('Interrompi')), 'nessuna sessione partita dopo l\'uscita');
      t.ok(await has('Ho capito, inizia'), 'si è tornati alle istruzioni');
    });

    await t.group('prova in corso: conferma, annulla = si prosegue, conferma = si esce', async () => {
      await page.click('text=Ho capito, inizia'); await wait(3600);
      t.ok(await has('Interrompi'), 'prova in corso');
      dialogs.length = 0; answers = [false];
      await sys();
      t.ok(dialogs.some(m => /Interrompere la sessione/.test(m)), 'chiede conferma');
      t.ok(await has('Interrompi'), 'annullando la prova prosegue');
      answers = [true];
      await sys(); await wait(500);
      t.ok(!(await has('Interrompi')), 'confermando la prova si ferma');
      await wait(3000);
      t.ok(!(await has('Interrompi')), 'e non riparte da sola');
    });

    await t.group('«Interrompi» a schermo e uscita dall\'app', async () => {
      await page.click('text=Ho capito, inizia'); await wait(3600);
      await page.click('button:has-text("Interrompi")'); await wait(500);
      t.ok(!(await has('Interrompi')), '«Interrompi» esce dalla prova');
      t.ok(['#setup', '#instructions'].includes(await hash()), 'torna a una schermata vera (' + (await hash()) + ')');
    });

    await t.group('dopo un ricaricamento «Esci? Sì» esce davvero', async () => {
      const p2 = await browser.newPage(); // scheda pulita: la cronologia delle prove precedenti non deve fare da sfondo
      const dlg = [];
      p2.on('dialog', async d => { dlg.push(d.message()); await d.accept().catch(() => {}); });
      await p2.goto(server.url + '/index.html'); await p2.waitForTimeout(500);
      await p2.click('text=usa questo dispositivo in locale'); await p2.waitForTimeout(300);
      await p2.reload(); await p2.waitForTimeout(700);
      for (let i = 0; i < 6 && !dlg.some(m => /uscire/.test(m)); i++) { await p2.goBack().catch(() => {}); await p2.waitForTimeout(350); }
      await p2.waitForTimeout(500);
      t.ok(dlg.some(m => /uscire/.test(m)), 'compare la domanda di uscita');
      t.ok(!/index\.html/.test(p2.url()), 'e confermando si lascia l\'app (url: ' + p2.url() + ')');
      await p2.close();
    });

    t.eq(jsErrors, [], 'nessun errore JavaScript');
  } finally {
    await browser.close();
    await server.close();
  }
};
