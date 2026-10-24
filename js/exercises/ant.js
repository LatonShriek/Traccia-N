// ANT: costruzione delle prove.
// SPOSTATE da index.html (passo 5c) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg (e la seduta) correnti.
// - buildANT riceve cfg come parametro invece di leggere la variabile dell'app.
import { ANT_MATERIAL_OPTIONS, ANT_MATERIAL_TOKENS } from '../core/rules.js';

  export function buildANT(cfg){
    const seq = [];
    const cueTypes = ['none','center','spatial'];
    const congruencies = ['congruent','incongruent','neutral'];
    const isMista = cfg.antMaterial==='misto';
    for(let i=0;i<cfg.trials;i++){
      const material = isMista ? ANT_MATERIAL_OPTIONS[Math.floor(Math.random()*ANT_MATERIAL_OPTIONS.length)] : (cfg.antMaterial || 'frecce');
      const tokens = ANT_MATERIAL_TOKENS[material] || null;
      const cueType = cueTypes[Math.floor(Math.random()*cueTypes.length)];
      const congruency = congruencies[Math.floor(Math.random()*congruencies.length)];
      const targetDir = Math.random()<0.5 ? 'left' : 'right';
      let side = Math.random()<0.5 ? 'left' : 'right';
      if(cueType==='spatial'){
        // cue valido nell'80% dei casi (indica il lato corretto)
        side = Math.random()<0.8 ? targetDir : (targetDir==='left'?'right':'left');
      } else {
        side = 'center';
      }
      seq.push({val:targetDir, cueType, congruency, side, targetDir, correctAnswer:targetDir, valid:true, material, tokens});
    }
    return seq;
  }
