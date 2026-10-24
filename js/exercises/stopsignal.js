// Stop-Signal: costruzione delle prove.
// SPOSTATE da index.html (passo 5c) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg (e la seduta) correnti.
// - buildStopSignal riceve cfg come parametro invece di leggere la variabile dell'app.
import { POOLS } from '../core/pools.js';
import { STOPSIGNAL_RULES } from '../core/rules.js';

  // Go/No-Go: la generazione vera è genGoNoGoTrial() (una prova alla volta,
  // dentro nextTrial() — serve per poter cambiare livello a metà seduta).
  // Rimossa da qui una vecchia buildGoNoGo() (generazione "tutta insieme")
  // rimasta orfana da quando il Go/No-Go è passato alla generazione
  // incrementale: non era più raggiungibile da nessun punto dell'app
  // (buildSequence() non la chiama mai per 'gonogo', che è nell'elenco
  // isIncremental in startSession()) — codice morto, non un bug, ma
  // proprio il tipo di residuo da togliere quando lo si nota.
  // Stop-Signal: le prove "go" sono target (va sempre data risposta); una
  // quota è designata come trial di stop (non-target, va inibita la
  // risposta), gestiti dinamicamente in sessione tramite lo staircase su
  // session.currentSSD.
  export function buildStopSignal(cfg){
    const pool = POOLS[cfg.stimType];
    const rule = STOPSIGNAL_RULES[cfg.stimType] || STOPSIGNAL_RULES.frecce;
    const interferenza = cfg.stopsignalInterferenza==='si';
    const seq = [];
    for(let i=0;i<cfg.trials;i++){
      const val = pool[Math.floor(Math.random()*pool.length)];
      const isStopTrial = Math.random() < cfg.targetRate;
      const correctAnswer = rule.classify(val) ? 'a' : 'b';
      const trial = {val, correctAnswer, isTarget: !isStopTrial, isStopTrial, valid:true};
      if(interferenza){
        // 'a' è sempre il pulsante sinistro, 'b' il destro (stesso ordine
        // di respondSpec/renderStimulusNode) — side è la posizione a
        // schermo dello stimolo, IRRILEVANTE alla discriminazione (che
        // resta identità-based, via rule.classify), a volte coerente con
        // il lato del pulsante corretto (congruente), a volte no
        // (incongruente) — stesso principio del Simon task, sovrapposto
        // qui al meccanismo Stop-Signal invariato, 50/50 indipendente
        // dalla frequenza di stop.
        const correctSide = correctAnswer==='a' ? 'left' : 'right';
        const congruent = Math.random()<0.5;
        trial.side = congruent ? correctSide : (correctSide==='left'?'right':'left');
        trial.congruency = congruent ? 'congruent' : 'incongruent';
      }
      seq.push(trial);
    }
    return seq;
  }
