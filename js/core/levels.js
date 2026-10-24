// Tabelle di livello (1-10) -> parametri degli esercizi e piccole funzioni pure
// che le leggono. SPOSTATE da index.html senza modifiche ai valori (passo 3b):
// il testo è identico all'originale, con la sola aggiunta di "export".
// Valori clinici: non cambiarli senza richiesta esplicita di Rodrigo.
  // Tabelle livello (1-5) -> parametro, per gli esercizi con titolazione
  // adattiva generica. N-back e TAPAT hanno le proprie tabelle dedicate
  // (livello n e durata attesa tonica) definite altrove.
  export const ADAPT_ISI = {   // ISI in ms — più basso = più difficile. Tabelle a 10 livelli per
    // gonogo/sequenza/stopsignal/ant/dualtask — pavimento più lento e
    // soffitto più veloce rispetto alla vecchia scala 1-5. Per dualtask
    // l'indice non è session.adaptLevel (i due canali hanno livelli
    // indipendenti) ma la media dei due, vedi showTrialStimulus().
    sequenza: {1:4500,2:3900,3:3200,4:2700,5:2200,6:1900,7:1700,8:1500,9:1150,10:900},
    dualtask: {1:3000,2:2700,3:2400,4:2100,5:1800,6:1550,7:1300,8:1100,9:900,10:700}, // ISI condivisa (leva secondaria), esteso da 5 a 10 livelli
    ant:      {1:3200,2:2800,3:2400,4:2000,5:1600,6:1400,7:1200,8:1000,9:800,10:650},  // solo ANT classico, non TAPAT
    simon:    {1:3200,2:2800,3:2400,4:2000,5:1600,6:1400,7:1200,8:1000,9:800,10:650},  // stessa scala dell'ANT classico — complessità percettivo-motoria comparabile (2AFC spaziale)
    stopsignal: {1:3600,2:3200,3:2800,4:2400,5:2000,6:1700,7:1400,8:1150,9:950,10:750} // leva secondaria, indipendente dallo staircase SSD
  };
  export const ADAPT_GONOGO_FREQ = {1:0.48,2:0.44,3:0.40,4:0.34,5:0.28,6:0.22,7:0.17,8:0.12,9:0.08,10:0.05}; // frequenza no-go — più bassa = più difficile
  // N-back: il "livello" (1-10) non è più uguale a n. n resta clinicamente
  // vincolato a un ceiling di 3 (a sua volta confinato al solo livello 10);
  // il resto della scala nasce da due leve — frequenza bersaglio (come
  // prima) e frequenza di trial "lure" (foil che corrispondono a uno
  // scarto vicino a n, non a n stesso: aumentano il carico di controllo
  // dell'interferenza senza alzare n — Kane, Conway, Miura & Colflesh,
  // 2007). All'inizio di ogni nuovo valore di n la lure riparte da 0 per
  // non sommare due salti di difficoltà nello stesso passaggio di livello.
  export const NBACK_LEVEL_TABLE = {
    1:{n:1, freq:0.38, lure:0},
    2:{n:1, freq:0.30, lure:0.08},
    3:{n:1, freq:0.24, lure:0.15},
    4:{n:1, freq:0.18, lure:0.22},
    5:{n:2, freq:0.34, lure:0},
    6:{n:2, freq:0.28, lure:0.10},
    7:{n:2, freq:0.22, lure:0.18},
    8:{n:2, freq:0.16, lure:0.25},
    9:{n:2, freq:0.12, lure:0.32},
    10:{n:3, freq:0.20, lure:0.20}
  };
  export function nbackParamsForLevel(level){ return NBACK_LEVEL_TABLE[level] || NBACK_LEVEL_TABLE[10]; }
  // Scarto (lag) usato per generare i lure: n-1 se possibile (la
  // manipolazione classica in letteratura), altrimenti n+1 quando n=1 (non
  // esiste uno scarto "0 indietro" significativo).
  export function nbackLureLag(n){ return n>1 ? n-1 : n+1; }
  // Switching, doppio compito e cancellazione estesi a 10 livelli in questo
  // turno, stessa filosofia delle tabelle già a 10 livelli sopra: risoluzione
  // aggiunta a pavimento e soffitto, non raddoppio uniforme.
  export const ADAPT_SWITCH_BALANCE = {1:0.50,2:0.56,3:0.62,4:0.68,5:0.74,6:0.80,7:0.85,8:0.90,9:0.94,10:0.97}; // quanto la regola "dominante" prevale sull'altra — più sbilanciato = più difficile quando tocca passare alla regola rara
  export const ADAPT_DUAL_FREQ = {1:0.40,2:0.35,3:0.30,4:0.25,5:0.20,6:0.16,7:0.13,8:0.10,9:0.07,10:0.05}; // frequenza target per canale, indipendente sui due canali del doppio compito
  // Trial lure per canale — stessa logica del lure nell'N-back (foil che
  // corrisponde a uno scarto vicino al target vero, qui 2 indietro invece
  // di 1, dato che ogni canale è un 1-back fisso): aumenta il carico di
  // controllo dell'interferenza senza introdurre un secondo n. Parte da 0
  // ai livelli più bassi per non sommarsi a una frequenza bersaglio già
  // impegnativa a inizio scala.
  export const ADAPT_DUAL_LURE = {1:0,2:0.05,3:0.10,4:0.15,5:0.19,6:0.23,7:0.27,8:0.31,9:0.35,10:0.40};
  // Categorizzazione condizionale: 10 livelli come banda-doppia delle 5
  // strutture originarie (confermate da Rodrigo, ordine di complessità
  // relazionale secondo Halford, Wilson & Phillips 1998 — non numero di
  // mappature S-R). Dentro ogni banda la difficoltà cresce con ISI (più
  // stretto = più difficile), tranne nella banda del 1-back sulla
  // categoria (livelli 7-8), dove il secondo parametro è la frequenza di
  // trial lure (stessa categoria di 2 prove fa invece che 1 — stessa
  // logica del lure nell'N-back/Doppio compito).
  //  1 = dimensione singola; 2 = doppia dimensione + no-go;
  //  3 = regola disgiuntiva; 4 = 1-back sulla categoria; 5 = doppia
  //  dimensione mappata direttamente su 4 risposte.
  export const CATEG_STRUCTURE_OF_LEVEL = {1:1,2:1,3:2,4:2,5:3,6:3,7:4,8:4,9:5,10:5};
  export const CATEG_ISI  = {1:2200,2:1300,3:2200,4:1300,5:2200,6:1300,9:2200,10:1300}; // assente ai livelli 7-8 (banda lure)
  export const CATEG_LURE = {7:0, 8:0.30};
  export function categStructureOfLevel(level){ return CATEG_STRUCTURE_OF_LEVEL[level] || 1; }
  export const DUAL_DOUBLE_TARGET_GRACE_MS = 500; // proroga concessa quando un trial richiede due tocchi e ne è arrivato solo uno alla scadenza
  export const ADAPT_GONOGO_COUNT = {1:1,2:1,3:1,4:1,5:2,6:2,7:2,8:3,9:3,10:4}; // quanti elementi no-go attivi (dal set configurato) — di più = più difficile; tetto a 4 (richiede un pool di almeno 4 elementi), raggiunto solo al livello 10 — la risoluzione nella fascia media viene soprattutto da ADAPT_GONOGO_FREQ
  export const ADAPT_SWITCH_CSI  = {1:900,2:750,3:600,4:480,5:380,6:300,7:230,8:170,9:120,10:80}; // intervallo cue→stimolo — più corto = più difficile
  export const ADAPT_NEGLECT_SIZE = {1:14,2:20,3:26,4:34,5:42,6:50,7:58,8:66,9:75,10:85}; // elementi per tavola — più alto = più difficile; pavimento abbassato e soffitto alzato rispetto alla vecchia scala 1-5
  // Sequenza bersaglio: la lunghezza della sequenza cresce da 2 (pavimento,
  // liv.1-2) a 5 (soffitto, liv.9-10), oltre all'ISI sopra. Applicata solo
  // quando adattivo — in modalità fissa la lunghezza resta quella scelta
  // manualmente dall'operatore in targetSeq.
  export const ADAPT_SEQ_LEN = {1:2,2:2,3:3,4:3,5:3,6:3,7:4,8:4,9:5,10:5};
  export const ADAPT_NEGLECT_TIME = {1:0,2:0,3:110,4:90,5:70,6:55,7:42,8:32,9:24,10:18}; // secondi per tavola (0=nessun limite) — più basso = più difficile; nessun limite ora anche al livello 2 (pavimento più graduale)
