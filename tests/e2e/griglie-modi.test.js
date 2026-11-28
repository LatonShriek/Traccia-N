'use strict';
// Griglie in un browser vero: numeri di riga e colonna, passaggio tocco ↔ numero durante la seduta, registrazione dei modi.
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./patient-agent');
const ROOT = path.join(__dirname, '..', '..');

module.exports = async function run(t){
  const server = await startStaticServer(ROOT);
  const browser = await chromium.launch(process.env.TRACCIAN_NO_SANDBOX ? { args:['--no-sandbox'] } : {});
  const errors = [];
  try{
    for(const vp of [{width:1180,height:820},{width:820,height:1180},{width:1024,height:640}]){
      const page = await browser.newPage({ viewport:vp });
      page.on('pageerror', e => errors.push(e.message));
      page.on('dialog', async d => { await d.accept().catch(()=>{}); });
      await page.goto(server.url + '/index.html');
      await page.waitForTimeout(400);
      await page.click('text=usa questo dispositivo in locale');
      await page.waitForTimeout(250);
      await page.evaluate(() => document.querySelectorAll('details.ex-group').forEach(d => { d.open = true; }));
      await page.click('button:has-text("Griglie attentive")');
      await page.waitForTimeout(250);
      const minus = page.locator('label:has-text("Numero di prove")').locator('xpath=following-sibling::*[1]').locator('button:has-text("–")');
      for(let i=0;i<20;i++) await minus.click().catch(()=>{});
      // riscontro spento: un solo tentativo col numero (secondo tentativo e aiuto a tocco sono provati in griglie-aiuto.test.js)
      await page.locator('label:has-text("Riscontro dopo ogni prova")').locator('xpath=following-sibling::*[1]').locator('button:text-is("No")').click();
      await page.click('text=Avvia sessione');
      await page.waitForTimeout(300);
      await page.click('text=Ho capito, inizia');
      await page.waitForSelector('.gr-num-col', { timeout:8000 });
      const dim = vp.width+'×'+vp.height;
      const has = txt => page.locator('button:text-is("'+txt+'")').count();
      const click = txt => page.locator('button:text-is("'+txt+'")').first().click();
      const cells = () => page.locator('div[style*="border-radius: 50%"][style*="cursor: pointer"]');
      const labels = async () => ({ col: await page.locator('.gr-num-col').allTextContents(), riga: await page.locator('.gr-num-riga').allTextContents() });
      t.group('schermata '+dim, () => {});
      const L = await labels();
      t.ok(L.col.length>=7 && L.col.every((x,i)=>+x===i+1), dim+': numeri di colonna 1…'+L.col.length);
      t.ok(L.riga.length>=5 && L.riga.every((x,i)=>+x===i+1), dim+': numeri di riga 1…'+L.riga.length);
      let switches = 0, seenTouch = 0, seenNum = 0, onlyNumber = 0, trials = 0, overflow = 0, resetOk = true;
      while(await has('Interrompi') || await page.locator('button:has-text("Interrompi")').count()){
        const canSwitch = await has('Passa al numero') + await has('Passa al tocco');
        if(!canSwitch) onlyNumber++;
        // alterna: nelle consegne pari si cambia modo prima di rispondere
        if(canSwitch && trials % 2 === 1){
          if(await has('Passa al numero')){
            await cells().nth(0).click();
            await click('Passa al numero'); switches++;
            if(!(await has('Passa al tocco'))) resetOk = false;
            await click('Passa al tocco'); // e di nuovo al tocco: la selezione deve essere azzerata
            if(!(await page.locator('text=Selezionati: 0').count())) resetOk = false;
            await click('Passa al numero');
          } else { await click('Passa al tocco'); switches++; }
        }
        // la pagina non deve scorrere di lato e il pulsante di conferma deve essere raggiungibile
        if(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) overflow++;
        if(await has('OK')){
          seenTouch++;
          await cells().nth(trials).click(); await click('OK');
          if(await has('Passa al numero') + await has('Passa al tocco')) resetOk = false; // dopo la correzione non si cambia
          await click('Avanti');
        } else {
          seenNum++;
          const pad = d => page.locator('div[style*="max-width"] button:text-is("'+d+'")').first().click({ timeout:800 });
          await pad('5');
          const two = page.locator('button:has-text("secondo")');
          if(await two.count()){ await two.first().click(); await pad('4'); }
          const which = page.locator('button[style*="max-width:300px"], button[style*="max-width: 300px"]');
          if(await which.count()) await which.first().click();
          await page.locator('button:text-is("Conferma")').first().click({ timeout:2000 });
        }
        trials++;
        await page.waitForTimeout(120);
        if(trials>40) break;
      }
      await page.waitForTimeout(600);
      const rec = await page.evaluate(() => {
        for(let i=0;i<localStorage.length;i++){
          const k = localStorage.key(i);
          if(k.indexOf('traccian:sessione:')!==0) continue;
          const r = JSON.parse(localStorage.getItem(k));
          if(r && r.taskMode==='griglie') return r;
        }
        return null;
      });
      t.ok(seenTouch>0 && seenNum>0, dim+': svolte consegne a tocco ('+seenTouch+') e col numero ('+seenNum+')');
      t.ok(switches>0, dim+': cambi di modo eseguiti ('+switches+')');
      t.ok(resetOk, dim+': il cambio azzera la selezione e dopo la correzione non si cambia');
      t.eq(overflow, 0, dim+': la pagina non scorre di lato');
      t.ok(!!rec, dim+': seduta salvata');
      if(rec){
        t.eq(rec.choice.total, trials, dim+': registrate tutte le consegne');
        t.eq(rec.choice.aTocco, seenTouch, dim+': conteggio delle consegne a tocco');
        t.eq(rec.choice.aNumero, seenNum, dim+': conteggio delle consegne col numero');
        t.ok(rec.choice.cambiModo>0 && rec.choice.cambiModo<=switches, dim+': consegne con cambio di modo ('+rec.choice.cambiModo+')');
      }
      await page.close();
    }
    t.eq(errors.join(' | '), '', 'nessun errore JavaScript');
  } finally {
    await browser.close(); await server.close();
  }
};
