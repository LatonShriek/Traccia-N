// Task-switching: costruzione delle prove.
// SPOSTATE da index.html (passo 5c) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg (e la seduta) correnti.
// - buildSwitching riceve cfg come parametro invece di leggere la variabile dell'app.
import { ADAPT_SWITCH_BALANCE } from '../core/levels.js';
import { POOLS } from '../core/pools.js';
import { genDualDimItem, pickDualDimRegime, switchRulesetFor } from '../core/rules.js';

  export function buildSwitching(cfg){
    const material = cfg.switchMaterial;
    const rs = switchRulesetFor(cfg);
    const SWITCH_NUM_POOL = ['1','2','3','4','6','7','8','9']; // fisso: la regola >5/<5 richiede numeri a una cifra
    const pool = (material==='numeri') ? SWITCH_NUM_POOL : (material==='bivalente') ? null : POOLS[material];
    const seq = [];
    // Squilibrio tra le due regole: fissato all'inizio della sessione sul
    // livello raggiunto l'ultima volta (buildSwitching gira prima che la
    // sessione esista, quindi non può leggere un livello "in diretta" come
    // fa il CSI, che invece si aggiorna davvero prova per prova).
    const dominance = cfg.titrationMode!=='manuale' ? (ADAPT_SWITCH_BALANCE[cfg.adaptStartLevel]||0.5) : 0.5;
    let activeRule = Math.random()<0.5 ? 'A' : 'B';
    for(let i=0;i<cfg.trials;i++){
      const prevRule = activeRule;
      const wantsChange = i>0 && Math.random() < cfg.targetRate;
      if(wantsChange){
        activeRule = Math.random() < dominance ? 'A' : 'B';
      }
      const isSwitch = i>0 && activeRule !== prevRule;
      let item;
      if(material==='bivalente'){
        item = genDualDimItem(cfg.switchRegimeSessione || pickDualDimRegime(cfg.switchRegime));
      } else {
        item = pool[Math.floor(Math.random()*pool.length)];
      }
      const ruleDef = activeRule==='A' ? rs.ruleA : rs.ruleB;
      let correctAnswer, sizeVariant = null, congruency = null;
      if(material==='simboli' && activeRule==='B'){
        sizeVariant = Math.random()<0.5 ? 'grande' : 'piccolo';
        correctAnswer = sizeVariant==='grande' ? 'a' : 'b';
      } else {
        correctAnswer = ruleDef.classify(item) ? 'a' : 'b';
      }
      if(material==='bivalente'){
        const ansTipo = rs.ruleA.classify(item) ? 'a' : 'b';
        const ansColore = rs.ruleB.classify(item) ? 'a' : 'b';
        congruency = ansTipo===ansColore ? 'congruent' : 'incongruent';
      }
      seq.push({val:item, rule:activeRule, ruleDef, correctAnswer, sizeVariant, congruency, isSwitch, valid:true});
    }
    return seq;
  }
