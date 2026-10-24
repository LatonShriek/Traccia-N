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

  // Il contrario: un nome esportato da un modulo di js/ e usato in index.html deve
  // essere importato (o dichiarato lì). Preso al passo 5b: RUNNINGSPAN_ADAPT_BLOCK
  // era usato nella schermata di setup ma non importato -> errore solo a runtime.
  t.group('nomi esportati dai moduli e usati in index.html — tutti importati', () => {
    const body = html.replace(re, '');
    const missing = [];
    const dirs = ['core', 'services', 'exercises'];
    dirs.forEach(d => {
      fs.readdirSync(path.join(__dirname, '..', 'js', d)).filter(f => f.endsWith('.js')).forEach(f => {
        const src = fs.readFileSync(path.join(__dirname, '..', 'js', d, f), 'utf8');
        const names = [];
        let mm;
        const er = /^\s*export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z0-9_$]+)/gm;
        while ((mm = er.exec(src))) names.push(mm[1]);
        names.forEach(n => {
          const used = new RegExp('(?<![A-Za-z0-9_$.\'"])' + n.replace(/\$/g, '\\$') + '(?![A-Za-z0-9_$\'"])').test(body.replace(/\/\/.*$/gm, ''));
          const declared = new RegExp('(?:function\\s+' + n + '\\s*\\(|(?:const|let|var)\\s+' + n + '\\b)').test(body);
          if (used && !declared && !imports.includes(n)) missing.push(d + '/' + f + ':' + n);
        });
      });
    });
    t.eq(missing, [], 'nessun nome esportato usato senza import');
  });
};
