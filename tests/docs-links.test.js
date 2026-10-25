'use strict';
// Passo 7: il README è un indice; ogni link relativo (a file) in README.md e docs/*.md deve puntare a un file che esiste.
const fs = require('fs');
const path = require('path');

module.exports = async function run(t) {
  const root = path.join(__dirname, '..');
  const files = ['README.md', 'tests/README.md'].concat(fs.readdirSync(path.join(root, 'docs')).filter(f => f.endsWith('.md')).map(f => 'docs/' + f));
  t.group('link relativi della documentazione', () => {
    files.forEach(f => {
      const text = fs.readFileSync(path.join(root, f), 'utf8');
      const re = /\]\(([^)\s]+)\)/g; let m, n = 0;
      while ((m = re.exec(text))) {
        const href = m[1];
        if (/^(https?:|mailto:|#)/.test(href)) continue;
        const target = path.join(root, path.dirname(f), href.split('#')[0]);
        n++;
        t.ok(fs.existsSync(target), f + ' → ' + href);
      }
    });
  });
  t.group('il README rimanda a tutte le pagine di docs/', () => {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    fs.readdirSync(path.join(root, 'docs')).filter(f => f.endsWith('.md')).forEach(f => {
      t.ok(readme.includes('docs/' + f), 'README cita docs/' + f);
    });
  });
};
