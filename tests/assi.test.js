'use strict';
// Motore ibrido PdM ↔ Traccia-N: asse fine 1-32, transizioni sfumate, tempo separato, manopola scelta dall'errore.
const { importCore } = require('./lib/core');

module.exports = async function run(t){
  const A = await importCore('assi.js');
  const IP = await importCore('../exercises/intrusopercettivo.js');
  const INV = await importCore('../exercises/inversione.js');
  const GR = await importCore('../exercises/griglie.js');
  t.group('Asse fine sul generatore: interpolazione', () => {
    t.eq(A.genOfFine(1), 1, 'livello 1 = gen 1'); t.eq(A.genOfFine(10), 32, 'livello 10 = gen 32');
    t.eq(A.genOfFine(2), 4, 'livello 2 = gen 4'); t.eq(A.genOfFine(6.5), 20, '6,5 = a metà fra gen 18 e 22');
    for(let g=1; g<=32; g++) t.ok(Math.abs(A.genOfFine(A.fineOfGen(g)) - g) < 1e-9, 'andata e ritorno gen '+g);
    t.ok(A.lvOfGen(4)===2 && A.lvOfGen(32)===10 && A.lvOfGen(1)===1, 'livello intero del gen');
  });
  t.group('Dispersione per prova in unità del generatore', () => {
    let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const N = 20000, cnt = {};
    for(let i=0;i<N;i++){ const g = A.trialGenFromFine(5, rng); cnt[g] = (cnt[g]||0)+1; }
    t.ok(cnt[15]/N > 0.45 && cnt[15]/N < 0.55, 'circa metà delle prove al gen centrale (15)');
    t.ok(Object.keys(cnt).every(g=>Math.abs(g-15) <= 2), 'mai oltre ±2 dal centro');
    const lo = {}; for(let i=0;i<2000;i++){ lo[A.trialGenFromFine(1, rng)] = 1; }
    t.ok(Object.keys(lo).every(g=>g>=1 && g<=3), 'al livello 1 nessuna prova sotto il gen 1');
    const hi = {}; for(let i=0;i<2000;i++){ hi[A.trialGenFromFine(10, rng)] = 1; }
    t.ok(Object.keys(hi).every(g=>g<=32), 'al livello 10 nessuna prova oltre il gen 32');
  });
  t.group('Transizioni sfumate: vicino al cambio di lunghezza si mescolano i due lati', () => {
    let seed = 11; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // gen 9 è il primo con elementi da 2 simboli: al fine corrispondente a gen 8 (len 1) compaiono entrambe le lunghezze
    const f8 = A.fineOfGen(8), lens = new Set();
    for(let i=0;i<400;i++) lens.add(IP.genIntrusoTrial(5, null, {gen:A.trialGenFromFine(f8, rng)}).len);
    t.ok(lens.has(1) && lens.has(2), 'a cavallo del confine 8/9 compaiono elementi da 1 e da 2 simboli');
    const f20 = A.fineOfGen(20), lens2 = new Set();
    for(let i=0;i<400;i++) lens2.add(IP.genIntrusoTrial(6, null, {gen:A.trialGenFromFine(f20, rng)}).len);
    t.ok(lens2.has(2) && lens2.has(3), 'a cavallo del confine 20/21 compaiono elementi da 2 e da 3 simboli');
  });
  t.group('Intruso: tempo dal carico, liscio (nessun dente di sega fra gen vicini)', () => {
    for(let l=1;l<=10;l++){ const g = A.GEN_OF_LEVEL[l-1]; t.ok(Math.abs(IP.intrusoLimitMsOfGen(g) - IP.INTRUSO_LIMIT_MS[l]) <= 6000, 'livello '+l+': tempo da carico entro 6 s dalla tabella ('+IP.intrusoLimitMsOfGen(g)/1000+' contro '+IP.INTRUSO_LIMIT_MS[l]/1000+')'); }
    let maxJump = 0, maxLen = 0;
    for(let g=2; g<=32; g++){ const j = Math.abs(IP.intrusoLimitMsOfGen(g)-IP.intrusoLimitMsOfGen(g-1)); if(g===9 || g===21) maxLen = Math.max(maxLen, j); else maxJump = Math.max(maxJump, j); }
    t.ok(maxJump <= 6000, 'fra gen vicini senza cambio di lunghezza il tempo cambia al massimo di 6 s ('+maxJump/1000+')');
    t.ok(maxLen <= 17000, 'al cambio di lunghezza (gen 9 e 21) il tempo sale al massimo di 17 s per compensare ('+maxLen/1000+')');
    const a = IP.genIntrusoTrial(5, null, {gen:15, timeF:1}), b = IP.genIntrusoTrial(5, null, {gen:15, timeF:0.8});
    t.ok(Math.abs(b.limitMs - a.limitMs*0.8) <= 1, 'il fattore tempo moltiplica il tempo concesso');
    t.ok(a.gen === 15, 'la prova riporta il suo livello del generatore');
  });
  t.group('Regola di blocco: tempo e contenuto come manopole separate', () => {
    const base = { fine:5, timeF:1, successBlocks:0 };
    const ok = { acc:0.95, misses:0, omitted:0, nearMiss:null };
    let d = A.decideStep({ ...ok, medRtFrac:0.3 }, base, { hasTime:true, mode:'intruso' });
    t.ok(d.dTime < 0 && d.dFine === 0, 'successo con margine di tempo: si stringe il tempo, non sale il contenuto');
    d = A.decideStep({ ...ok, medRtFrac:0.8 }, base, { hasTime:true, mode:'intruso' });
    t.ok(d.dFine > 0 && d.dTime === 0, 'successo senza margine: sale il contenuto');
    d = A.decideStep({ ...ok, medRtFrac:0.3 }, { ...base, timeF:1.2 }, { hasTime:true, mode:'intruso' });
    t.ok(d.dTime < 0 && d.dFine === 0, 'se si era concesso tempo in più, prima rientra quello');
    d = A.decideStep({ acc:0.5, misses:3, omitted:2, nearMiss:null, medRtFrac:null }, base, { hasTime:true, mode:'intruso' });
    t.ok(d.dTime > 0 && d.dFine === 0, 'fallimento per tempo scaduto: più tempo, contenuto invariato');
    d = A.decideStep({ acc:0.5, misses:3, omitted:0, nearMiss:null, medRtFrac:null }, base, { hasTime:true, mode:'intruso' });
    t.ok(d.dFine < 0 && d.dTime === 0, 'fallimento per errori di scelta: scende il contenuto');
    d = A.decideStep({ acc:0.5, misses:3, omitted:2, nearMiss:null, medRtFrac:null }, { ...base, timeF:A.TF_MAX }, { hasTime:true, mode:'intruso' });
    t.ok(d.dFine < 0, 'con il tempo già al massimo concesso, scende il contenuto');
    d = A.decideStep({ acc:0.5, misses:3, omitted:2, nearMiss:null, medRtFrac:null }, base, { hasTime:false, mode:'intruso' });
    t.ok(d.dFine < 0 && d.dTime === 0, 'tempo fissato a mano nel Setup: il tempo non si muove');
    d = A.decideStep({ acc:0.5, misses:3, omitted:0, nearMiss:0.7 }, base, { hasTime:true, mode:'inversione' });
    t.ok(d.dTime > 0 && d.dFine === 0, 'Inversione, errori quasi giusti: più tempo di visione');
    d = A.decideStep({ acc:0.5, misses:3, omitted:0, nearMiss:0.2 }, base, { hasTime:true, mode:'inversione' });
    t.ok(d.dFine < 0, 'Inversione, errori lontani: scende il contenuto');
    const d0 = A.decideStep({ ...ok, medRtFrac:0.9 }, base, { hasTime:true, mode:'inversione' }), d1 = A.decideStep({ ...ok, medRtFrac:0.9 }, { ...base, successBlocks:1 }, { hasTime:true, mode:'inversione' });
    t.ok(d0.dFine > 0 && d1.dTime < 0, 'Inversione: i blocchi riusciti alternano contenuto e tempo');
    t.ok(A.clampTimeF(5) === A.TF_MAX && A.clampTimeF(0) === A.TF_MIN, 'fattore tempo limitato 0,7–1,3');
  });
  t.group('Griglie e Inversione accettano il livello del generatore', () => {
    const s = GR.genGrigliaScreen(5, 9); t.eq(s.gen, 9, 'Griglie: la griglia riporta il gen richiesto');
    const it = INV.genInversioneItem(2, 'auto', null, {gen:9, timeF:1}), it2 = INV.genInversioneItem(2, 'auto', null, {gen:9, timeF:1.3});
    t.eq(it.gen, 9, 'Inversione: lo stimolo riporta il gen');
    t.ok(INV.inversioneExposureMs(5, 8, 15, 1.3) > INV.inversioneExposureMs(5, 8, 15, 1) && INV.inversioneExposureMs(5, 8, 15, 0.7) < INV.inversioneExposureMs(5, 8, 15, 1), 'più fattore tempo = visione più lunga, meno = più breve');
    t.ok(it2.gen === 9, 'anche con fattore tempo lo stimolo riporta il gen');
    t.ok(INV.inversioneExposureMs(2, 4, 4, 1) === INV.inversioneExposureMs(2, 4), 'al gen di un livello intero il tempo di visione coincide');
  });
  t.group('maybeAdapt* usano la regola nuova sul blocco reale', () => {
    const mk = (n, f) => Array.from({length:n}, (_, i) => f(i));
    // Intruso: 6 prove, 4 a tempo scaduto su 6 → più tempo, contenuto fermo
    let cfg = { adaptive:true, adaptStartLevel:5, adaptFine:5 }, ses = { fineLevel:5, timeF:1, ipAdaptBlock:[1,0,0,0,0,1],
      choiceLog: [ {correct:true,rt:8000,limitMs:50000},{correct:false,omitted:true},{correct:false,omitted:true},{correct:false,omitted:true},{correct:false,omitted:true},{correct:true,rt:9000,limitMs:50000} ] };
    IP.maybeAdaptIntruso(cfg, ses);
    t.ok(ses.fineLevel === 5 && Math.abs(ses.timeF - 1.1) < 1e-9, 'Intruso: tempo scaduto → +0,1 di tempo, livello fermo');
    // Intruso: 6 giuste e veloci → si stringe il tempo
    ses = { fineLevel:5, timeF:1, ipAdaptBlock:mk(6,()=>1), choiceLog: mk(6,()=>({correct:true, rt:10000, limitMs:50000})) };
    IP.maybeAdaptIntruso(cfg, ses);
    t.ok(ses.fineLevel === 5 && Math.abs(ses.timeF - 0.9) < 1e-9, 'Intruso: giuste e veloci → tempo ×0,9, livello fermo');
    // Intruso: 6 giuste ma lente → sale il contenuto
    ses = { fineLevel:5, timeF:1, ipAdaptBlock:mk(6,()=>1), choiceLog: mk(6,()=>({correct:true, rt:40000, limitMs:50000})) };
    IP.maybeAdaptIntruso(cfg, ses);
    t.ok(ses.fineLevel === 5.5 && ses.timeF === 1, 'Intruso: giuste ma senza margine → +0,5 di livello');
    // Inversione: 4 errate quasi giuste → più tempo di visione
    ses = { fineLevel:5, timeF:1, invAdaptBlock:[0,0,0,0], choiceLog: mk(4,()=>({correct:false, omitted:false, partial:0.8})) };
    INV.maybeAdaptInversione(cfg, ses);
    t.ok(ses.fineLevel === 5 && Math.abs(ses.timeF - 1.1) < 1e-9, 'Inversione: errori quasi giusti → più tempo di visione');
    // blocco non completo: niente
    ses = { fineLevel:5, timeF:1, invAdaptBlock:[1,1], choiceLog:[] }; INV.maybeAdaptInversione(cfg, ses);
    t.ok(ses.fineLevel === 5 && ses.timeF === 1, 'blocco incompleto: nessun cambiamento');
  });
};
