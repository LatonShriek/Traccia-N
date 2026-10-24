'use strict';
const fs = require('fs');
const path = require('path');

// Un nome importato da js/ non deve essere dichiarato di nuovo dentro index.html:
// la dichiarazione locale oscura l'import e, se le due funzioni si chiamano a vicenda,
// va in ricorsione infinita (successo davvero al passo 4a: listLocalPatients).
module.exports = async function run(t) {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const imports = [];
  const re = /^import\s*\{([^}]*)\}\s*from\s*'\.\/js\/[^']+';/gm;
  let m;
  while ((m = re.exec(html))) {
    m[1].split(',').map(x => x.trim()).filter(Boolean).forEach(x => {
      const parts = x.split(/\s+as\s+/);
      imports.push(parts[parts.length - 1]);
    });
  }
  t.group('import da js/ — nessun nome ridichiarato in index.html', () => {
    t.ok(imports.length > 50, 'trovati gli import (' + imports.length + ')');
    const body = html.replace(re, '');
    const clashes = imports.filter(n => new RegExp('(?:function\\s+' + n + '\\s*\\(|(?:const|let|var)\\s+' + n + '\\b)').test(body));
    t.eq(clashes, [], 'nessuna ridichiarazione');
  });
};
