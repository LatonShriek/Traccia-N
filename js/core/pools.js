// Dati degli stimoli (POOLS) e proposta casuale della sequenza bersaglio.
// SPOSTATI da index.html senza modifiche (passo 3b), con "export" e UNA
// differenza dichiarata: defaultTargetSeq non legge più cfg.targetSeq quando
// manca "len" (tutte le chiamate dell'app passano già len; il ripiego diventa 3).
// POOLS è un oggetto condiviso e MODIFICABILE: l'app ne rigenera 'numeri' e
// 'parole' a ogni sessione (regenerateNumeriPool/regenerateParolePool).

  export const POOLS = {
    lettere: ['A','B','C','D','E','F','G','H','I','L','M','N','O','P','R','S','T','U','V'],
    numeri:  ['1','2','3','4','5','6','7','8','9'], // rigenerato per sessione da regenerateNumeriPool(), in base a cfg.numDigits
    simboli: ['●','■','▲','◆','★','✚','⬟','⬤'],
    parole:  [], // rigenerato da regenerateParolePool(), in base a cfg.wordComplexity
    suoni:   [
      {f:220,type:'sine',icon:'A'},{f:294,type:'square',icon:'B'},{f:349,type:'sine',icon:'C'},
      {f:392,type:'triangle',icon:'D'},{f:466,type:'square',icon:'E'},{f:523,type:'triangle',icon:'F'}
    ],
    // Materiali dedicati allo Stop-Signal two-choice: frecce (sinistra/destra,
    // stesso alfabeto grafico dell'ANT classico) e forma (cerchio/triangolo,
    // sottoinsieme di 'simboli' scelto apposta perché la coppia sia
    // percettivamente inequivocabile — non "rotondo/con angoli" come nello
    // Task-switching, ma le due forme letterali richieste).
    frecce:  ['◀','▶'],
    forma:   ['●','▲'],
    suoni2:  [ // registro più acuto, timbro diverso — usato per il secondo canale nel doppio compito uditivo-uditivo
      {f:660,type:'sine',icon:'G'},{f:740,type:'square',icon:'H'},{f:831,type:'triangle',icon:'I'},
      {f:932,type:'sine',icon:'J'},{f:1046,type:'square',icon:'K'},{f:1175,type:'triangle',icon:'L'}
    ],
    colori: [
      {hex:'#D64545', icon:'Rosso'}, {hex:'#3B72D6', icon:'Blu'}, {hex:'#3FA34D', icon:'Verde'},
      {hex:'#E0B12D', icon:'Giallo'}, {hex:'#8E4EC6', icon:'Viola'}, {hex:'#E07B2D', icon:'Arancione'},
      {hex:'#2DB6C7', icon:'Ciano'}, {hex:'#D6469B', icon:'Magenta'}
    ]
  };
  POOLS.lettereVoce = POOLS.lettere; // stessi contenuti di 'lettere', letti dal sintetizzatore invece che mostrati
  POOLS.numeriVoce = POOLS.numeri;   // tenuto sincronizzato con POOLS.numeri in regenerateNumeriPool()
  // Proposta di default per la sequenza bersaglio/no-go: prima era
  // sequenziale sul pool (sempre gli stessi primi elementi, in ordine) —
  // ora pesca a caso, senza ripetizioni, così ogni volta che si apre un
  // esercizio con materiale personalizzabile parte già una proposta
  // sensata invece di uno schema fisso o di una selezione vuota da
  // costruire a mano. Resta sempre pienamente modificabile dopo (chip
  // "← Rimuovi ultimo"/"Reimposta", o aggiungendo altri elementi).
  export function defaultTargetSeq(stimType, len){
    len = len || 3;
    const pool = POOLS[stimType];
    const shuffled = pool.slice().sort(()=>Math.random()-0.5);
    const out = [];
    for(let i=0;i<len;i++) out.push(shuffled[i % shuffled.length]);
    return out;
  }

  // ---- materiale "misto" (passo 5a): SPOSTATO da index.html senza modifiche, con "export" ----
  // Tipi di stimolo utilizzabili insieme in una sequenza bersaglio mista.
  // Escluse le parole: la lunghezza variabile complicherebbe la costruzione
  // e la lettura rapida della sequenza da parte del paziente.
  export const VISUAL_MISTA_TYPES = ['lettere','numeri','colori','simboli'];
  export const AUDIO_MISTA_TYPES = ['suoni','lettereVoce','numeriVoce'];
  export const SEQUENZA_MISTA_TYPES = VISUAL_MISTA_TYPES.concat(AUDIO_MISTA_TYPES);
  // cfg.sequenzaMista/nbackMista/gonogoMista: 'no' | 'visivo' | 'uditivo' | 'misto'
  // (visivo+uditivo insieme) — quali tipi di stimolo entrano nel "mescolati".
  export function mistaTypesFor(mode){
    if(mode==='visivo') return VISUAL_MISTA_TYPES;
    if(mode==='uditivo') return AUDIO_MISTA_TYPES;
    if(mode==='misto') return SEQUENZA_MISTA_TYPES;
    return null; // 'no' o non impostato: non mista
  }
  export function randMistaStim(types){
    const list = types || SEQUENZA_MISTA_TYPES;
    const t = list[Math.floor(Math.random()*list.length)];
    const pool = POOLS[t];
    return {stimType:t, item: pool[Math.floor(Math.random()*pool.length)]};
  }
