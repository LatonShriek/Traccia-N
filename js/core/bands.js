// Limiti del livello durante una seduta: quale campo di sessione è "il livello"
// per l'esercizio, il tetto della scala e le FASCE STRUTTURALI (gruppi di livelli
// in cui la regola del compito non cambia). SPOSTATI da index.html senza
// modifiche al testo (passo 3c), con la sola aggiunta di "export" e UNA
// differenza dichiarata: adaptLevelKey, currentLevelMax e sessionLevelBounds
// ricevono la configurazione come parametro (cfg) invece di leggere la
// variabile dell'app; le chiamate interne le passano. In index.html restano tre
// piccole funzioni che chiamano queste con la cfg corrente.
import { ADAPT_ISI } from './levels.js';

  // Titolazione automatica: valuta un blocco di 8 prove valide alla volta.
  // Generica: si applica sia al livello n-back sia al livello TAPAT, a
  // seconda dell'esercizio in corso.
  // Restituisce quale campo di sessione rappresenta "il livello" per
  // l'esercizio corrente, o null se quell'esercizio non è adattivo.
  export function adaptLevelKey(cfg){
    if(cfg.taskMode==='nback') return 'liveNLevel';
    if(cfg.taskMode==='tapat') return 'tapatLevel';
    if(cfg.taskMode==='neglect') return 'liveBoardLevel';
    if(cfg.taskMode==='categorizzazione') return 'categLevel';
    if(cfg.taskMode==='dualtask') return null; // gestito a parte da bumpDualLevel/maybeAdaptDualChannel — mai session.adaptLevel, anche se ADAPT_ISI['dualtask'] esiste (usata solo per l'ISI condiviso, non per il livello)
    if(ADAPT_ISI[cfg.taskMode] || cfg.taskMode==='gonogo' || cfg.taskMode==='switching' || cfg.taskMode==='mantenimento') return 'adaptLevel';
    return null;
  }
  // Tetto della scala per l'esercizio corrente: tutti gli esercizi con
  // titolazione live (n-back, TAPAT, cancellazione, gonogo/sequenza/
  // stopsignal/ant classico/switching) sono a 10 livelli. Dualtask ha una
  // scala separata per canale, gestita da bumpDualLevel/
  // maybeAdaptDualChannel, non da questa funzione (adaptLevelKey non
  // restituisce 'adaptLevel' per dualtask — vedi sotto).
  export function currentLevelMax(cfg){
    const key = adaptLevelKey(cfg);
    if(key==='liveNLevel') return 10;
    if(key==='tapatLevel') return 10;
    if(key==='liveBoardLevel') return cfg.neglectMode==='progressiva' ? 30 : 10;
    if(key==='categLevel') return 10;
    if(key==='adaptLevel') return 10; // gonogo, sequenza, stopsignal, ant, switching
    return 5;
  }
  export const DUAL_LEVEL_MAX = 10; // tetto scala doppio compito, per canale — vedi bumpDualLevel/maybeAdaptDualChannel
  // Fasce strutturali: gruppi di livelli contigui in cui la REGOLA del
  // compito resta identica (cambia solo un parametro continuo — ISI,
  // frequenza di un evento già noto, dimensione tavola). Un salto DENTRO
  // la stessa fascia non richiede nulla di speciale: il paziente sta
  // ancora facendo lo stesso compito, solo più/meno stretto nei tempi. Un
  // salto FRA fasce cambierebbe la regola stessa (n nell'N-back, numero di
  // elementi no-go noti, struttura di categorizzazione, modalità di
  // cancellazione, condizioni della regola composta) — e quello non deve
  // MAI accadere a metà seduta, solo alla seduta successiva, quando le
  // istruzioni della nuova regola sono di nuovo mostrate/ascoltabili prima
  // di iniziare (vedi sessionLevelBounds).
  export const STRUCTURAL_BANDS = {
    nback: [[1,4],[5,9],[10,10]], // n=1,2,3
    gonogo: [[1,4],[5,7],[8,9],[10,10]], // ADAPT_GONOGO_COUNT: 1,2,3,4 elementi noti
    categorizzazione: [[1,2],[3,4],[5,6],[7,8],[9,10]], // CATEG_STRUCTURE_OF_LEVEL
    neglectProgressiva: [[1,10],[11,20],[21,30]], // classico / intruso / regola
    neglectRegola: [[1,2],[3,4],[5,6],[7,10]], // condizioni cumulative della regola composta
    mantenimento: [[1,5],[6,10]] // ADAPT_MANTENIMENTO: 1-5 Riconoscimento, 6-10 Riconoscimento seriale — il salto 5→6 è un cambio di MODALITÀ (non solo di lunghezza lista), stesso principio di n nell'N-back
  };
  // Task-switching bivalente non ha una struttura DERIVATA dal livello
  // (come n nell'N-back o la modalità del Mantenimento) — è una scelta
  // manuale del materiale in Setup, indipendente dal livello. Ma introduce
  // comunque una dimensione di conflitto in stile Stroop che non dovrebbe
  // essere raggiungibile a qualunque livello: da qui in poi selezionarla
  // sposta il livello di partenza ad almeno questa soglia (vedi Setup e
  // sessionLevelBounds), e la sessione/continuità fra sedute non scende
  // mai sotto, finché il materiale resta bivalente.
  export const TASK_SWITCHING_BIVALENTE_MIN_LEVEL = 6;
  // Stessa logica del bivalente sopra, per lo stesso motivo: "quarto
  // gradino della scala gerarchica" (vedi cfg.stopsignalInterferenza)
  // non ha senso raggiungibile da qualunque livello — richiede aver
  // superato una parte reale della scala Stop-Signal pura. Soglia scelta
  // per coerenza con le altre due soglie già in uso in questo file
  // (bivalente, modalità seriale del Mantenimento), non da un dato di
  // letteratura specifico per questa variante.
  export const STOPSIGNAL_INTERFERENZA_MIN_LEVEL = 6;
  export function structuralBandBounds(taskKey, startLevel){
    const bands = STRUCTURAL_BANDS[taskKey];
    if(!bands) return null;
    const b = bands.find(([lo,hi])=> startLevel>=lo && startLevel<=hi) || bands[bands.length-1];
    return {min:b[0], max:b[1]};
  }
  // Estremi effettivi per la titolazione DENTRO la sessione corrente —
  // per gli esercizi con fasce strutturali, la fascia è quella del livello
  // di PARTENZA (non del livello attuale, che è quello che si sta
  // vincolando): la sessione non può mai attraversarne il confine, in
  // nessuna delle due direzioni. Per gli esercizi senza fasce (nessun
  // cambio di regola legato al livello) restano gli estremi 1..tetto di
  // sempre.
  export function sessionLevelBounds(cfg){
    const key = adaptLevelKey(cfg);
    if(key==='liveNLevel'){
      return structuralBandBounds('nback', cfg.nLevel) || {min:1, max:currentLevelMax(cfg)};
    }
    if(key==='adaptLevel' && cfg.taskMode==='gonogo'){
      return structuralBandBounds('gonogo', cfg.adaptStartLevel) || {min:1, max:currentLevelMax(cfg)};
    }
    if(key==='adaptLevel' && cfg.taskMode==='mantenimento'){
      return structuralBandBounds('mantenimento', cfg.adaptStartLevel) || {min:1, max:currentLevelMax(cfg)};
    }
    if(key==='adaptLevel' && cfg.taskMode==='switching' && cfg.switchMaterial==='bivalente'){
      return {min:TASK_SWITCHING_BIVALENTE_MIN_LEVEL, max:currentLevelMax(cfg)};
    }
    if(key==='adaptLevel' && cfg.taskMode==='stopsignal' && cfg.stopsignalInterferenza==='si'){
      return {min:STOPSIGNAL_INTERFERENZA_MIN_LEVEL, max:currentLevelMax(cfg)};
    }
    if(key==='categLevel'){
      return structuralBandBounds('categorizzazione', cfg.categLivello) || {min:1, max:currentLevelMax(cfg)};
    }
    return {min:1, max:currentLevelMax(cfg)};
  }
