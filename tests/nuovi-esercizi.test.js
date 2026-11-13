'use strict';
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  await module.exports.serie(t);
  const IP = await importCore('../exercises/intrusopercettivo.js');
  const PS = await importCore('../exercises/pasat.js');
  const GR = await importCore('../exercises/griglie.js');

  t.group('Intruso percettivo — un solo elemento unico, tutti gli altri almeno 2 volte, a ogni livello', () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      let ok = true, sizeOk = true;
      for (let i = 0; i < 60; i++) {
        const tr = IP.genIntrusoTrial(lvl);
        const counts = {};
        tr.items.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        const singles = Object.keys(counts).filter(v => counts[v] === 1);
        if (singles.length !== 1 || tr.items[tr.oddIndex] !== singles[0]) ok = false;
        const pl = IP.intrusoPlanAt(lvl);
        if (tr.items.length !== tr.n || tr.n < pl.nMin || tr.n > pl.nMax || ![15,16,18,20,21,24,25,27,28,30].includes(tr.n) && tr.n < 15) sizeOk = false;
        if (tr.items.some(v => [...v].length !== tr.len)) sizeOk = false;
      }
      t.ok(ok, 'livello ' + lvl + ': un unico elemento unico, e oddIndex lo indica');
      t.ok(sizeOk, 'livello ' + lvl + ': numero di elementi nel range del livello, elementi tutti della stessa lunghezza');
    }
  });
  t.group('Intruso percettivo — porting del generatore: stesse famiglie, lunghezza crescente, meno tempo', () => {
    const L = IP.INTRUSO_LEVELS;
    for (let l = 2; l <= 10; l++) {
      t.ok(L[l].len >= L[l - 1].len && L[l].limitMs <= L[l - 1].limitMs, 'livello ' + l + ': simboli non più corti, tempo non più lungo');
    }
    t.ok(L[1].len === 1 && L[10].len === 3, 'da 1 simbolo (livelli bassi) a terne di simboli (alti)');
    t.ok(IP.INTRUSO_FAMILIES.length === 31, 'le famiglie del generatore sono tutte presenti (' + IP.INTRUSO_FAMILIES.length + ')');
    t.ok(IP.intrusoFamiliesAt(1).every(f => f.unlockLevel <= 1), 'al livello 1 solo famiglie familiari');
    t.ok(!IP.intrusoFamiliesAt(1).some(f => ['cjk', 'geez', 'mahjong'].includes(f.id)), 'ideogrammi, ge\'ez e mahjong non compaiono al livello 1');
    t.ok(IP.intrusoFamiliesAt(10).length === IP.INTRUSO_FAMILIES.length, 'al livello 10 tutte le famiglie');
    t.ok([1, 4, 8, 11, 15, 18, 22, 25, 29, 32].every((g, i) => IP.intrusoGenLevel(i + 1) === g), 'livelli 1-10 = livelli 1, 4, 8, 11, 15, 18, 22, 25, 29, 32 del generatore');
  });
  t.group('Griglie attentive — porting del generatore: consegne esatte e numeriche', () => {
    let ok = true, total = 0, minRules = 99;
    for (let lvl = 1; lvl <= 10; lvl++) for (let k = 0; k < 6; k++) {
      const s = GR.genGrigliaScreen(lvl);
      minRules = Math.min(minRules, s.rules.length);
      if (s.cells.length !== s.rows * s.cols) ok = false;
      for (const r of s.rules) { total++; if (r.input.type === 'count' && !r.input.unit && s.cells.filter(c => r.matches(c)).length !== r.input.expected) ok = false; if (!(r.count >= 0 && Number.isInteger(r.count))) ok = false; }
    }
    t.ok(ok, 'ogni risposta = ricalcolo indipendente sulle celle (' + total + ' consegne in 60 griglie)');
    t.ok(minRules >= 10, 'ogni griglia ha sempre almeno 10 consegne (minimo ' + minRules + ')');
    let allInput = true; const types = new Set();
    for (const lvl of [8, 9, 10]) for (let k = 0; k < 30; k++) for (const r of GR.genGrigliaScreen(lvl).rules) { if (!r.input) allInput = false; else types.add(r.input.type); }
    t.ok(allInput, 'ogni consegna ha una risposta strutturata');
    t.ok(types.has('double') && types.has('compare'), 'ai livelli alti compaiono anche «due numeri» e «quale e di quanti»');
    t.eq(GR.scoreGrigliaAnswer({ input: { type: 'double', expected: [5, 9] } }, [5, 9], 1).correct, true, 'doppio conteggio giusto');
    t.eq(GR.scoreGrigliaAnswer({ input: { type: 'double', expected: [5, 9] } }, [9, 5], 1).correct, false, 'doppio conteggio con i numeri scambiati = sbagliato');
    t.eq(GR.scoreGrigliaAnswer({ input: { type: 'compare', expected: { which: 1, diff: 3 } } }, { which: 1, diff: 3 }, 1).correct, true, 'confronto giusto');
    t.eq(GR.scoreGrigliaAnswer({ input: { type: 'compare', expected: { which: 1, diff: 3 } } }, { which: 0, diff: 3 }, 1).correct, false, 'confronto: gruppo sbagliato');
    t.eq([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => GR.grigliaGenLevel(l)), [1, 4, 8, 11, 15, 18, 22, 25, 29, 32], 'livelli 1-10 = livelli del generatore');
    t.eq(GR.grigliaPlanAt(1).category, 'shapes', 'livello 1: forme geometriche');
    t.eq(GR.grigliaPlanAt(10).category, 'geez', 'livello 10: ge\'ez');
    t.eq(GR.scoreGrigliaAnswer({ count: 7 }, '7', 900).correct, true, 'risposta giusta');
    t.eq(GR.scoreGrigliaAnswer({ count: 7 }, '8', 900).correct, false, 'risposta sbagliata');
    t.eq(GR.scoreGrigliaAnswer({ count: 7 }, '', 900).omitted, true, 'nessuna risposta = omissione');
    const cfg = { adaptive: true, adaptStartLevel: 4 }, ss = { grAdaptBlock: [1, 1, 1, 1] };
    GR.maybeAdaptGriglie(cfg, ss);
    t.ok(cfg.adaptStartLevel === 5 && ss.grAdaptBlock.length === 0, 'sopra l\'85% sale di un livello');
  });
  t.group('Intruso percettivo — punteggio e adattamento', () => {
    const tr = { oddIndex: 3 };
    t.eq(IP.scoreIntrusoTrial(tr, 3, 900), { correct: true, omitted: false, rt: 900 }, 'tocco giusto');
    t.eq(IP.scoreIntrusoTrial(tr, 1, 900).correct, false, 'tocco sbagliato');
    t.eq(IP.scoreIntrusoTrial(tr, null).omitted, true, 'tempo scaduto = omissione');
    const cfg = { adaptive: true, adaptStartLevel: 4 }, s = { ipAdaptBlock: [1, 1, 1, 1, 1, 1] };
    IP.maybeAdaptIntruso(cfg, s);
    t.eq([cfg.adaptStartLevel, s.ipAdaptBlock.length], [5, 0], 'sopra l\'85% sale di un livello');
    const c2 = { adaptive: true, adaptStartLevel: 4 }, s2 = { ipAdaptBlock: [0, 0, 0, 1, 0, 0] };
    IP.maybeAdaptIntruso(c2, s2);
    t.eq(c2.adaptStartLevel, 3, 'sotto il 70% scende');
    const c3 = { adaptive: false, adaptStartLevel: 4 }, s3 = { ipAdaptBlock: [1, 1, 1, 1, 1, 1] };
    IP.maybeAdaptIntruso(c3, s3);
    t.eq(c3.adaptStartLevel, 4, 'senza adattivo il livello non si muove');
  });

  t.group('PASAT — risposta attesa: somme, giorni, mesi; nessuna risposta nei primi `lag` stimoli', () => {
    const s = [3, 4, 9, 2];
    t.eq(PS.pasatExpected('somme', s, 0, 3), null, 'il primo stimolo non ha risposta');
    t.eq([1, 2, 3].map(i => PS.pasatExpected('somme', s, i, 3)), [7, 13, 11], 'somma con lo stimolo precedente');
    t.eq([2, 3].map(i => PS.pasatExpected('somme', s, i, 7)), [12, 6], 'lag 2: somma con quello di due posti prima');
    const g = ['lunedì', 'sabato', 'domenica'];
    t.eq(PS.pasatExpected('giorni', g, 1, 3), 'martedì', 'giorno dopo il precedente (shift 1)');
    t.eq(PS.pasatExpected('giorni', g, 2, 4), 'lunedì', 'sabato + 2 = lunedì (si riparte dalla settimana)');
    t.eq(PS.pasatExpected('mesi', ['dicembre', 'marzo'], 1, 3), 'gennaio', 'dicembre + 1 = gennaio');
  });
  t.group('PASAT — serie, risposte possibili, livelli', () => {
    for (const m of ['somme', 'giorni', 'mesi']) {
      const ser = PS.genPasatSeries(m, 40);
      t.ok(ser.length === 40 && ser.every((v, i) => i === 0 || v !== ser[i - 1]), m + ': serie lunga come richiesto, mai lo stesso stimolo due volte di fila');
      t.ok(ser.every(v => PS.pasatPool(m).includes(v)), m + ': stimoli dal proprio insieme');
      for (let l = 1; l <= 10; l++) {
        const okAns = ser.every((_, i) => { const e = PS.pasatExpected(m, ser, i, l); return e === null || PS.pasatAnswers(m).includes(e); });
        if (!okAns) { t.ok(false, m + ' livello ' + l + ': risposta attesa fuori dai pulsanti'); }
      }
    }
    t.eq(PS.pasatAnswers('somme').length, 17, 'somme: pulsanti da 2 a 18');
    t.ok(PS.PASAT_LEVELS[1].isi > PS.PASAT_LEVELS[6].isi && PS.PASAT_LEVELS[7].lag === 2, 'il ritmo si stringe, dal 7 il lag è 2');
    t.eq(PS.scorePasatTrial(7, 7, 800).correct, true, 'risposta giusta');
    t.eq(PS.scorePasatTrial(7, null).omitted, true, 'nessuna risposta = omissione');
    const cfg = { adaptive: true, adaptStartLevel: 1 }, s = { pasatAdaptBlock: [1, 1, 1, 1, 1, 1, 1, 1] };
    PS.maybeAdaptPasat(cfg, s);
    t.eq(cfg.adaptStartLevel, 2, 'adattivo: sale dopo 8 prove giuste');
  });
};

module.exports.serie = async function (t) {
  const S = await importCore('../exercises/serie.js');
  t.group('Serie alternate — le 32 regole e i 10 livelli', () => {
    t.eq(S.SERIE_RULES_N.length, 32, '32 regole come nel generatore');
    t.ok(S.SERIE_RULES_N.every(r => r.text && typeof r.fn === 'function'), 'ogni regola ha testo e funzione');
    for (let l = 1; l <= 10; l++) t.ok(S.SERIE_LEVELS[l].rule >= 1 && S.SERIE_LEVELS[l].rule <= 32, 'livello ' + l + ': regola valida');
    t.ok(S.SERIE_LEVELS[1].rule < S.SERIE_LEVELS[10].rule && S.SERIE_LEVELS[1].isi > S.SERIE_LEVELS[10].isi, 'più difficile e più veloce salendo');
    t.eq(S.serieRuleFor({ adaptStartLevel: 5, serieRegola: 0 }).index, 7, 'regola secondo il livello');
    t.eq(S.serieRuleFor({ adaptStartLevel: 5, serieRegola: 20 }).index, 20, 'regola fissata a mano');
  });
  t.group('Serie alternate — risposte attese', () => {
    const seq = [{char:'A',color:'black'},{char:'B',color:'red'},{char:'1',color:'red'},{char:'2',color:'black'}];
    const R = n => S.SERIE_RULES_N[n - 1];
    t.eq([0,1,2,3].map(i => S.serieExpected(R(1), seq, i)), ['dx','sx','sx','dx'], 'regola 1: nero→dx, rosso→sx');
    t.eq([0,1,2,3].map(i => S.serieExpected(R(2), seq, i)), ['dx','dx','sx','sx'], 'regola 2: lettera→dx, numero→sx');
    t.eq([0,1,2,3].map(i => S.serieExpected(R(7), seq, i)), ['dx','sx','si','no'], 'regola 7: A dx, B sx, 1 sì, 2 no');
    t.eq([0,1,2,3].map(i => S.serieExpected(R(17), seq, i)), ['dx','sx','dx','sx'], 'regola 17: incrocio colore×categoria');
    t.eq([0,1,2,3].map(i => S.serieExpected(R(21), seq, i)), ['dx',null,'sx',null], 'regola 21: No-Go sulle combinazioni');
    t.eq([0,1,2,3].map(i => S.serieExpected(R(23), seq, i)), [undefined,'dx','sx','sx'], 'regola 23: si risponde in base allo stimolo precedente');
    t.eq([0,1,2,3].map(i => S.serieExpected(R(29), seq, i)), [undefined,undefined,'dx','sx'], 'regola 29: due posti prima');
    const m = [{char:'A',color:'black',nogo:true}];
    t.eq(S.serieExpected(R(4), m, 0), null, 'regola con ✕: stimolo segnalato = non rispondere');
  });
  t.group('Serie alternate — serie, punteggio e adattamento', () => {
    const q = S.genSerieStimuli(60, 0.1);
    t.eq(q.slice(0,4).map(s => s.char + s.color[0]), ['Ab','Br','1r','2b'], 'prime 4 fisse come nel generatore');
    let ok = true; for (let i = 3; i < q.length; i++) if (q[i].char === q[i-1].char && q[i].char === q[i-2].char && q[i].char === q[i-3].char) ok = false;
    t.ok(ok, 'mai più di 3 simboli uguali di fila');
    t.ok(q.every((s, i) => !(s.nogo && (i < 4 || q[i-1].nogo))), 'le ✕ non sono nelle prime 4 né due di fila');
    t.ok(S.genSerieStimuli(60, 0).every(s => !s.nogo), 'senza ✕ nelle regole che non le usano');
    t.eq(S.scoreSerieTrial('dx','dx',700).correct, true, 'tocco giusto');
    t.eq(S.scoreSerieTrial('dx','sx',700).correct, false, 'tocco sbagliato');
    t.eq(S.scoreSerieTrial('dx',null).omitted, true, 'nessun tocco dove serviva = omissione');
    t.eq(S.scoreSerieTrial(null,null).correct, true, 'No-Go senza tocco = corretto');
    t.eq(S.scoreSerieTrial(null,'dx',500).commission, true, 'tocco su No-Go = errore di commissione');
    const cfg = { adaptive: true, adaptStartLevel: 3, serieRegola: 0 }, s = { serieAdaptBlock: [1,1,1,1,1,1,1,1] };
    S.maybeAdaptSerie(cfg, s);
    t.eq(cfg.adaptStartLevel, 4, 'adattivo: sale');
    const c2 = { adaptive: true, adaptStartLevel: 3, serieRegola: 12 }, s2 = { serieAdaptBlock: [1,1,1,1,1,1,1,1] };
    S.maybeAdaptSerie(c2, s2);
    t.eq(c2.adaptStartLevel, 3, 'con regola fissata a mano il livello non si muove');
  });
};
