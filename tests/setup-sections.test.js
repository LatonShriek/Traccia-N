'use strict';
// Schermata Setup a sezioni (js/ui/setup-sections.js): la logica che decide dove va ogni cosa è pura e si
// verifica senza browser. Il disegno vero (tendine, "ⓘ", barra fissa) si controlla a occhio.
const { importCore } = require('./lib/core');

module.exports = async function run(t) {
  const S = await importCore('../ui/setup-sections.js');
  const m = (key, extra) => ({ marker: Object.assign({ key, title: key.toUpperCase() }, extra || {}) });
  const it = x => ({ item: x });

  t.group('piano: ciò che sta prima del primo segnaposto resta fuori dalle sezioni', () => {
    const p = S.planSections([it('a'), it('b'), m('x'), it('c')]);
    t.eq(p.map(e => e.section ? 'S:' + e.key + '[' + e.items.join(',') + ']' : e.item), ['a', 'b', 'S:x[c]'], 'a e b fuori, c dentro x');
  });

  t.group('piano: lo stesso segnaposto ripetuto riunisce i pezzi nella stessa sezione', () => {
    const p = S.planSections([m('param'), it('1'), m('seq'), it('S'), m('param'), it('2'), it('3')]);
    t.eq(p.map(e => e.key), ['param', 'seq'], 'due sezioni, nell\'ordine del primo segnaposto');
    t.eq(p[0].items, ['1', '2', '3'], 'i pezzi di "param" sono riuniti');
    t.eq(p[1].items, ['S'], '"seq" ha solo il suo pezzo');
  });

  t.group('piano: il segnaposto di fine riporta gli elementi fuori dalle sezioni', () => {
    const p = S.planSections([m('x'), it('a'), { marker: { end: true } }, it('barra'), it('link')]);
    t.eq(p.length, 3, 'una sezione e due elementi liberi');
    t.eq(p[0].items, ['a'], 'a dentro la sezione');
    t.eq([p[1].item, p[2].item], ['barra', 'link'], 'barra e link restano fuori, in ordine');
  });

  t.group('piano: i segnaposto non finiscono mai tra gli elementi', () => {
    const p = S.planSections([m('x'), { marker: { end: true } }, m('y'), it('a')]);
    t.ok(p.every(e => e.section), 'solo sezioni');
    t.eq(p[0].items, [], 'la sezione vuota esiste nel piano (la scarta il disegno)');
  });

  t.group('piano: apertura forzata e avviso si conservano anche da un segnaposto successivo', () => {
    const p = S.planSections([m('seq', { defaultOpen: false, summary: 'da costruire' }), it('a'), m('seq', { forceOpen: true, warn: true })]);
    t.eq(p[0].forceOpen, true, 'forceOpen');
    t.eq(p[0].warn, true, 'warn');
    t.eq(p[0].summary, 'da costruire', 'il riepilogo del primo resta');
  });

  t.group('piano: il riepilogo si aggiorna se un segnaposto successivo ne porta uno nuovo', () => {
    const p = S.planSections([m('x', { summary: 'uno' }), it('a'), m('x', { summary: 'due' })]);
    t.eq(p[0].summary, 'due', 'vale l\'ultimo non vuoto');
  });

  t.group('spiegazioni: solo quelle lunghe e non di avviso vanno dietro il ⓘ', () => {
    const long = 'x'.repeat(200), short = 'breve';
    t.eq(S.shouldCollapseHint(short, ''), false, 'corto: resta visibile');
    t.eq(S.shouldCollapseHint(long, ''), true, 'lungo: si chiude');
    t.eq(S.shouldCollapseHint(long, 'color:var(--alert);'), false, 'avviso lungo: resta visibile');
    t.eq(S.shouldCollapseHint(long, 'grid-column:1/-1; margin:2px;'), true, 'stile senza allerta: si chiude');
    t.eq(S.shouldCollapseHint('x'.repeat(150), ''), false, 'esattamente 150: ancora visibile');
    t.eq(S.shouldCollapseHint('x'.repeat(151), ''), true, '151: si chiude');
    t.eq(S.shouldCollapseHint('x'.repeat(100), '', 80), true, 'soglia personalizzata');
    t.eq(S.shouldCollapseHint(null, null), false, 'valori mancanti non rompono');
  });

  t.group('etichetta corta del ⓘ', () => {
    t.eq(S.shortLabel('Testo corto', 64), 'Testo corto', 'sotto il limite: invariata');
    const orig = 'Una spiegazione molto lunga che continua per parecchie parole oltre il limite consentito dal titolo';
    const l = S.shortLabel(orig, 40);
    const base = l.slice(0, -1);
    t.ok(l.endsWith('…'), 'finisce con i puntini');
    t.ok(l.length <= 41, 'non supera il limite (più i puntini)');
    t.ok(orig.startsWith(base) && orig[base.length] === ' ', 'taglia a fine parola, senza spezzarne una');
    t.eq(S.shortLabel('  spazi   multipli  qui ', 64), 'spazi multipli qui', 'spazi normalizzati');
  });

  t.group('riepilogo: le parti vuote si saltano', () => {
    t.eq(S.joinSummary(['Manuale', null, 'livello 3', '', false, '24 prove']), 'Manuale · livello 3 · 24 prove', 'solo le parti piene');
    t.eq(S.joinSummary([]), '', 'vuoto');
    t.eq(S.joinSummary(undefined), '', 'mancante');
  });

  t.group('stato aperto/chiuso: vince la scelta fatta a mano', () => {
    const store = {};
    globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
    S._resetSectionState();
    t.eq(S.isSectionOpen('risposta', false), false, 'nessuna scelta: vale l\'impostazione di partenza (chiusa)');
    t.eq(S.isSectionOpen('param', true), true, 'nessuna scelta: vale l\'impostazione di partenza (aperta)');
    S.rememberSection('risposta', true);
    t.eq(S.isSectionOpen('risposta', false), true, 'aperta a mano: resta aperta');
    S.rememberSection('param', false);
    t.eq(S.isSectionOpen('param', true), false, 'chiusa a mano: resta chiusa');
    S._resetSectionState();
    t.eq(S.isSectionOpen('risposta', false), true, 'sopravvive a una nuova lettura dallo storage');
    t.eq(S.isSectionOpen('param', true), false, 'idem per la chiusa');
    store['traccian.setupSections'] = '{rotto';
    S._resetSectionState();
    t.eq(S.isSectionOpen('param', true), true, 'storage illeggibile: si torna alle impostazioni di partenza');
    delete globalThis.localStorage;
    S._resetSectionState();
    t.eq(S.isSectionOpen('param', true), true, 'storage assente: nessun errore');
    S.rememberSection('param', false);
    t.eq(S.isSectionOpen('param', true), false, 'storage assente: lo stato vale comunque finché la pagina resta aperta');
    S._resetSectionState();
  });
};
