'use strict';
// «← Indietro»: navStack non deve accumulare duplicati della stessa hub.
// Estrae trackHub/goBack dal vero index.html (fallisce se vengono rinominati).
const path = require('path');

module.exports = async function run(t) {
  const root = path.join(__dirname, '..');
  const specs = [
    { name: 'HUB_VIEWS', start: 'const HUB_VIEWS = new Set(', end: ');' },
    { name: 'navStack', start: 'const navStack', end: '= [];' },
    { name: 'trackHub', start: 'function trackHub(){', end: 'navStack.push(navSnapshot());\n  }' },
    { name: 'goBack', start: 'function goBack(fallback){', end: 'view = lastHubView || fallback || homeView(); render();\n  }' }
  ];
  // Harness minimale: stessa estrazione, ma con le dipendenze come stub.
  const vm = require('vm');
  const { readAppScript, extractBlocks } = require('./lib/extract-source');
  const body = extractBlocks(readAppScript(root), specs);
  function mk() {
    const code = `let view='operatorHome', lastHubView=null;
      const navSnapshot=()=>({view}); const restoreNavSnapshot=s=>{view=s.view;};
      const homeView=()=>'setup'; function render(){ if(HUB_VIEWS.has(view)){ lastHubView=view; trackHub(); } }
      ${body}
      return {go:v=>{view=v;render();},render,back:()=>goBack(),get view(){return view},get stack(){return navStack.map(x=>x.view);}};`;
    return new vm.Script('(function(){' + code + '})()').runInContext(vm.createContext({}));
  }

  t.group('Indietro sale di un livello alla volta fino alla radice', () => {
    const a = mk(); a.render(); a.go('patients'); a.go('patientProgram');
    t.eq(a.stack, ['operatorHome', 'patients', 'patientProgram'], 'pila');
    a.back(); t.eq(a.view, 'patients', 'primo indietro');
    a.back(); t.eq(a.view, 'operatorHome', 'secondo indietro (prima restava su patients)');
    t.eq(a.stack, ['operatorHome'], 'nessun duplicato');
  });
  t.group('re-render della stessa hub non impila duplicati', () => {
    const a = mk(); a.render(); a.go('patients'); a.render(); a.render(); a.render();
    t.eq(a.stack, ['operatorHome', 'patients'], 'pila invariata');
    a.back(); t.eq(a.view, 'operatorHome', 'un solo indietro basta');
  });
  t.group('sotto-schermata torna all\'ultima hub', () => {
    const a = mk(); a.render(); a.go('patients'); a.go('task'); a.back();
    t.eq(a.view, 'patients', 'da task alla hub');
    a.back(); t.eq(a.view, 'operatorHome', 'poi un livello su');
  });
};
