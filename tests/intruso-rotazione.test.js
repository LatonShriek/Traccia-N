'use strict';
// Intruso: la rotazione è solo una variante minoritaria (22 nov 2026): semi e note ruotati in poche prove, tutte le altre famiglie senza rotazione.
const { importCore } = require('./lib/core');

module.exports = async function run(t){
  const IP = await importCore('../exercises/intrusopercettivo.js');
  t.group('livelli con orientamenti: prove ruotate solo di semi/note e in minoranza, le altre famiglie non ruotano', () => {
    [3, 4, 5, 6, 7, 8, 9, 10].forEach(lv => {
      const g = IP.intrusoGenLevel(lv);
      if (IP.intrusoOrientCount(g) < 2) return;
      let rot = 0, tot = 400, badFam = 0, otherFams = new Set();
      for (let i = 0; i < tot; i++) {
        const tr = IP.genIntrusoTrial(lv, Math.random);
        if (tr.orient > 1) { rot++; if (!['suits', 'music'].includes(tr.familyId)) badFam++; }
        else otherFams.add(tr.familyId);
        // l'unico resta unico anche per orientamento
        const key = k => tr.items[k] + '@' + tr.angles[k];
        const c = {}; tr.items.forEach((_, k) => { c[key(k)] = (c[key(k)] || 0) + 1; });
        if (c[key(tr.oddIndex)] !== 1 || Object.values(c).filter(v => v === 1).length !== 1) badFam++;
      }
      t.eq(badFam, 0, 'livello ' + lv + ': rotate solo semi/note, unico unico');
      t.ok(rot > 0 && rot < tot * 0.35, 'livello ' + lv + ': prove ruotate in minoranza (' + rot + '/' + tot + ')');
      t.ok(otherFams.size >= 3, 'livello ' + lv + ': compaiono anche altre famiglie (' + otherFams.size + ')');
    });
  });
};
