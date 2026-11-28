'use strict';
// Griglie col numero in un browser vero: dopo un conteggio sbagliato secondo tentativo, aiuto a tocco a scelta, soluzione.
// Per sapere le risposte giuste, la prova aggiunge a index.html (solo qui, in memoria) una finestra sulla seduta.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./patient-agent');
const ROOT = path.join(__dirname, '..', '..');

module.exports = async function run(t){
  const server = await startStaticServer(ROOT);
  const browser = await chromium.launch(process.env.TRACCIAN_NO_SANDBOX ? { args:['--no-sandbox'] } : {});
  const errors = [];
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const MARK = '  function grigliaResetAnswer(){';
  try{
    for(const [vp, riscontro] of [[{width:1180,height:820},true],[{width:820,height:1180},true],[{width:1024,height:640},true],[{width:1180,height:820},false]]){
      const ctx = await browser.newContext({ viewport:vp, serviceWorkers:'block' });
      const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(e.message));
      page.on('dialog', async d => { await d.accept().catch(()=>{}); });
      await page.route('**/index.html', r => r.fulfill({ contentType:'text/html; charset=utf-8', body: html.replace(MARK, '  window.__tn = () => ({ session, cfg });\n'+MARK) }));
      await page.goto(server.url + '/index.html');
      await page.waitForTimeout(400);
      await page.click('text=usa questo dispositivo in locale');
      await page.waitForTimeout(250);
      await page.evaluate(() => document.querySelectorAll('details.ex-group').forEach(d => { d.open = true; }));
      await page.click('button:has-text("Griglie attentive")');
      await page.waitForTimeout(250);
      await page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; }));
      await page.click('button:text-is("Scrive il numero")');
      if(!riscontro) await page.locator('label:has-text("Riscontro dopo ogni prova")').locator('xpath=following-sibling::*[1]').locator('button:text-is("No")').click();
      await page.click('text=Avvia sessione');
      await page.waitForTimeout(300);
      await page.click('text=Ho capito, inizia');
      await page.waitForSelector('.gr-num-col', { timeout:8000 });
      await page.evaluate(() => { window.__tn().cfg.grigliaEspSec = 0; }); // consegna sempre visibile, per leggerne il testo
      const dim = vp.width+'×'+vp.height+(riscontro?'':' senza riscontro');
      const state = () => page.evaluate(() => { const s = window.__tn().session; if(!s || !s.grid) return null; const r = s.grid.rules[s.ruleIdx];
        return { i:s.trialIdx, rows:s.grid.rows, cols:s.grid.cols, input:r.input, touch:r.touch, compare:r.input.type==='compare', n:s.grid.cols*s.grid.rows }; });
      const running = () => page.locator('button:has-text("Interrompi")').count();
      const has = txt => page.locator('button:text-is("'+txt+'")').count();
      const click = async txt => { await page.locator('button:text-is("'+txt+'")').first().click({ timeout:3000 }); };
      const pause = () => page.waitForTimeout(500); // oltre la pausa anti doppio tocco
      // solo i tasti della tastiera (anche la casella della risposta mostra la cifra scritta)
      const pad = d => page.locator('div[style*="repeat(5"] button:text-is("'+d+'")').click({ timeout:3000 });
      const slot = k => page.locator('button:has-text("'+(k?'secondo':'primo')+'")').first().click();
      const cell = k => page.locator('div[style*="border-radius: 50%"][style*="cursor"]').nth(k);
      const type = async (q, giusto) => {
        const inp = q.input;
        if(inp.type==='double'){ for(let k=0;k<2;k++){ if(await page.locator('button:has-text("'+(k?'secondo':'primo')+' ✓")').count()) continue; await slot(k); for(const d of String(giusto?inp.expected[k]:99)) await pad(d); } }
        else if(inp.type==='compare'){ await page.locator('button[style*="max-width:300px"], button[style*="max-width: 300px"]').nth(inp.expected.which).click(); for(const d of String(giusto?inp.expected.diff:99)) await pad(d); }
        else for(const d of String(giusto?inp.expected:99)) await pad(d);
      };
      const conferma = async () => { await page.locator('button:text-is("Conferma")').first().click({ timeout:3000 }); await pause(); };
      const coperto = async () => (await page.locator('.gr-totale').count())===0 && (await page.locator('span:text-is("✓")').count())===0;
      const dentro = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth+1);
      const exp = { sec:0, a1:0, a2:0, r1:0, r2:0, nr:0, corrette:0 };
      let guard = 0, k = 0, bad = [], senzaAiuto = 0, doppioTocco = false;
      while(await running() && guard++ < 45){
        const q = await state(); if(!q) break;
        const aiuto = !!q.touch && !q.compare;
        const w = dim+' consegna '+(q.i+1)+' ('+q.input.type+')';
        if(!riscontro){ await type(q, false); await conferma(); const n = await state(); if(n && n.i!==q.i+1) bad.push(w+': senza riscontro deve avanzare'); if(await has('Riprova a contare')) bad.push(w+': scelta senza riscontro'); continue; }
        let piano = ['giusta','secondo','aiuto1','aiuto2','soluzione'][k++ % 5];
        if(!aiuto && piano.startsWith('aiuto')) piano = 'soluzione';
        if(!aiuto) senzaAiuto++;
        if(piano==='giusta'){ await type(q, true); await conferma(); exp.corrette++; const n = await state(); if(n && n.i!==q.i+1) bad.push(w+': la giusta deve avanzare'); continue; }
        await type(q, false);
        if(!doppioTocco){ // due tocchi ravvicinati su «Conferma»
          doppioTocco = true; await page.locator('button:text-is("Conferma")').first().dblclick(); await pause();
          const st = await page.evaluate(() => { const n = window.__tn().session.num; return n && [n.tent, n.fase]; });
          if(!st || st[0]!==1) bad.push(w+': il doppio tocco ha fatto avanzare '+st);
        } else await conferma();
        if(await has('Passa al tocco')) bad.push(w+': cambio di modo dopo un tentativo');
        if(!(await coperto())) bad.push(w+': soluzione scoperta al 1° errore');
        if(!(await dentro())) bad.push(w+': scorre di lato');
        if(aiuto){ if(!(await has('Riprova a contare') && await has('Prova toccando le celle'))) { bad.push(w+': manca la scelta al 1° errore'); break; } }
        else if(await has('Riprova a contare') + await has('Prova toccando le celle')) bad.push(w+': aiuto dove non deve esserci');
        if(piano!=='aiuto1'){
          if(aiuto){ await click('Riprova a contare'); await pause(); }
          if(piano==='secondo'){ await type(q, true); await conferma(); exp.sec++; const n = await state(); if(n && n.i!==q.i+1) bad.push(w+': giusta al secondo deve avanzare'); continue; }
          await type(q, false); await conferma();
          if(!(await coperto()) && aiuto) bad.push(w+': soluzione scoperta al 2° errore');
          if(aiuto && !(await has('Prova toccando le celle') && await has('Mostra la soluzione'))) { bad.push(w+': manca la scelta al 2° errore'); break; }
        }
        if(piano==='soluzione'){
          if(aiuto){ await click('Mostra la soluzione'); await pause(); }
          if(!(await page.locator('.gr-totale').count())) bad.push(w+': manca la soluzione');
          if(q.touch && !q.compare && (await page.locator('span:text-is("✓")').count()) < new Set(q.touch.target).size) bad.push(w+': celle non evidenziate');
          if(!(await dentro())) bad.push(w+': scorre di lato (soluzione)');
          await click('Avanti'); await pause(); continue;
        }
        await click('Prova toccando le celle'); await pause();
        if(!(await page.locator('text=Ora tocca le celle.').count()) || !(await coperto())) bad.push(w+': avvio aiuto');
        if((await page.locator('text='+q.touch.text).count())===0) bad.push(w+': testo a tocco');
        const sbagliata = [...Array(q.n).keys()].find(i => !q.touch.target.includes(i));
        if(piano==='aiuto1'){
          exp.a1++; exp.r1++;
          for(const i of q.touch.target) await cell(i).click();
          await click('OK'); await pause();
          if(!(await page.locator('.gr-totale').count())) bad.push(w+': dopo il tocco manca il totale');
        } else {
          exp.a2++; exp.nr++;
          await cell(sbagliata).click(); await click('OK'); await pause();
          if(!(await page.locator('.gr-esclusa').count()) || !(await page.locator('text=Quelle con ✕ non vanno bene').count()) || (await page.locator('.gr-totale').count())) bad.push(w+': primo errore a tocco');
          const sel = await page.evaluate(() => window.__tn().session.sel.size);
          if(sel!==0) bad.push(w+': la sbagliata resta selezionata');
          const altra = [...Array(q.n).keys()].find(i => i!==sbagliata && !q.touch.target.includes(i));
          // le celle escluse non hanno più il cursore a mano: l'indice si calcola sull'elenco di tutte le celle
          await page.evaluate(i => { const a = [...document.querySelectorAll('div[style*="border-radius: 50%"][style*="cursor"]')]; a[i].click(); }, altra);
          await click('OK'); await pause();
          if(!(await page.locator('.gr-totale').count())) bad.push(w+': dopo il 2° errore a tocco manca la soluzione');
        }
        if(!(await dentro())) bad.push(w+': scorre di lato (aiuto)');
        await click('Avanti'); await pause();
      }
      await page.waitForTimeout(600);
      const rec = await page.evaluate(() => { for(let i=0;i<localStorage.length;i++){ const key = localStorage.key(i); if(key.indexOf('traccian:sessione:')!==0) continue; const r = JSON.parse(localStorage.getItem(key)); if(r && r.taskMode==='griglie') return r; } return null; });
      t.eq(bad.slice(0,6).join(' | '), '', dim+': percorsi corretti');
      t.ok(!!rec, dim+': seduta salvata');
      if(rec){
        const c = rec.choice;
        if(riscontro){
          t.eq(c.correct, exp.corrette, dim+': corrette = solo quelle al primo conteggio');
          t.eq([c.secondoConteggio, c.aiutoDopo1, c.aiutoDopo2].join(), [exp.sec, exp.a1, exp.a2].join(), dim+': secondo conteggio e aiuti');
          t.eq([c.aiutoRisolte1, c.aiutoRisolte2, c.aiutoNonRisolte].join(), [exp.r1, 0, exp.nr].join(), dim+': esiti dell\'aiuto');
          t.ok(exp.sec>0 && exp.a1>0 && exp.a2>0, dim+': percorsi tutti provati ('+JSON.stringify(exp)+', senza aiuto '+senzaAiuto+')');
        } else {
          t.eq([c.correct, c.secondoConteggio, c.aiutoTocco].join(), '0,0,0', dim+': un solo tentativo, nessun aiuto');
        }
        t.eq(c.aNumero, c.total, dim+': tutte registrate come col numero');
      }
      await ctx.close();
    }
    t.eq(errors.join(' | '), '', 'nessun errore JavaScript');
  } finally {
    await browser.close(); await server.close();
  }
};
