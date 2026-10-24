// Titolazione: quali esercizi hanno la modalità Manuale/Livello/Adattivo, come si
// risolve il "livello" di una configurazione e i testi di trasparenza (hint) che
// descrivono i parametri in uso. SPOSTATO da index.html senza modifiche al testo
// (passo 3b), con la sola aggiunta di "export". Le funzioni ricevono la
// configurazione come parametro (c): nessun accesso a cfg/session globali.
import { nbackParamsForLevel, ADAPT_GONOGO_FREQ, ADAPT_ISI, CATEG_ISI, CATEG_LURE, categStructureOfLevel,
  ADAPT_NEGLECT_SIZE, ADAPT_NEGLECT_TIME, ADAPT_DUAL_FREQ, TAPAT_LEVELS } from './levels.js';

  // I 6 esercizi con stepper "Livello" condiviso e tabelle ADAPT_* — unici
  // interessati dal modello triplice manuale/livello/adattivo. Doppio
  // compito, Cancellazione e Categorizzazione condizionale restano sul
  // vecchio interruttore manuale/adattivo a due vie: hanno meccanismi di
  // livello propri (per-canale, per-tavola, per-struttura) non condivisi
  // con questo gruppo, e non erano fra gli esercizi segnalati col bug di
  // sincronizzazione — includerli sarebbe un allargamento di perimetro non
  // richiesto.
  export const TITRATION_EXERCISES = ['nback','sequenza','gonogo','switching','stopsignal','ant','simon','mantenimento','runningspan'];
  // Neglect e Doppio compito hanno il CONCETTO di titrationMode (e vanno
  // quindi trattati come gli altri per persistenza/switch dal profilo) ma
  // non fanno parte del gruppo "condiviso" sopra: hanno le proprie
  // funzioni di risoluzione dedicate (neglectBoardSubLevel/
  // dualTitrationModeHint), non passano mai dal blocco ISI/frequenza
  // generico dei 6 originali.
  export const TITRATION_MODE_EXTRA = ['neglect','dualtask','categorizzazione'];
  export function hasTitrationMode(taskMode){ return TITRATION_EXERCISES.includes(taskMode) || TITRATION_MODE_EXTRA.includes(taskMode); }
  // Valore di partenza ragionevole per 'targetRate' quando si arriva su
  // ciascun esercizio da Setup (vedi commento sul reset sopra) — stessi
  // valori già usati come default storico dell'app per ciascun significato.
  export const DEFAULT_TARGET_RATE = { nback:0.32, sequenza:0.32, gonogo:0.32, stopsignal:0.25, switching:0.35, categorizzazione:0.20 };
  // Trasparenza obbligatoria: qualunque sia la modalità, il clinico deve
  // sempre vedere a cosa corrisponde esattamente ciò che sta per essere
  // lanciato — un numero di livello da solo non basta in modalità Manuale
  // (dove il livello non pilota nulla), quindi lì si mostrano invece i
  // parametri correnti per esteso. Accetta una cfg esplicita (non solo la
  // cfg live globale) per poter essere riusata anche nel profilo/Gestisci
  // programma, dove si descrive la configurazione salvata di una voce.
  // Parametri davvero derivati dalla tabella di livello (Livello/Adattivo)
  // per ciascun esercizio dei 6 — usato per decidere quali controlli in
  // Setup diventano di sola lettura in quelle due modalità, mostrando il
  // valore realmente in uso invece di un campo indipendente che darebbe
  // l'impressione (sbagliata) di controllare qualcosa. Gli altri esercizi/
  // parametri restano sempre modificabili in OGNI modalità perché non sono
  // MAI stati collegati al livello per scelta di costruzione — es. la
  // frequenza di trial di stop dello Stop-Signal è un parametro
  // metodologico fisso, non una leva di difficoltà, e lo stesso vale per
  // la frequenza bersaglio della Sequenza e la frequenza di cambio regola
  // del Task-switching.
  export function resolvedFreqForDisplay(taskMode, c){
    if(taskMode==='nback') return nbackParamsForLevel(c.nLevel).freq;
    if(taskMode==='gonogo') return ADAPT_GONOGO_FREQ[c.adaptStartLevel] || c.targetRate;
    return null;
  }
  export function resolvedIsiForDisplay(taskMode, c){
    if(taskMode==='sequenza') return ADAPT_ISI.sequenza[c.adaptStartLevel];
    if(taskMode==='stopsignal') return ADAPT_ISI.stopsignal[c.adaptStartLevel];
    if(taskMode==='ant') return ADAPT_ISI.ant[c.adaptStartLevel];
    return null;
  }
  // Trasparenza per Cancellazione (Neglect) — parametri diversi dai 6
  // esercizi con ISI/frequenza (qui: dimensione tavola, tempo limite),
  // quindi una funzione di trasparenza dedicata invece di riusare
  // titrationModeHint, che non li conoscerebbe.
  export function neglectSubLevelForDisplay(c){
    if(c.neglectMode==='progressiva') return neglectProgressivaPhase(c.neglectStartLevel).subLevel;
    if(c.neglectMode==='regola') return c.neglectRuleLevel;
    return c.neglectStartLevel;
  }
  // Struttura EFFETTIVA in uso in questo momento — mai più
  // categStructureOfLevel(cfg.categLivello) direttamente, da nessuna
  // parte: in modalità Manuale la struttura è una scelta indipendente del
  // clinico (categStructManual), decisa da Rodrigo esplicitamente contro
  // l'alternativa "solo ISI/lure dentro la struttura del livello" — più
  // libertà, al prezzo dichiarato di rompere la corrispondenza
  // livello↔struttura in questa sola modalità. In Livello/Adattivo,
  // invariato: la struttura resta quella derivata dal livello.
  export function categEffectiveStructure(c){
    return c.titrationMode==='manuale' ? (c.categStructManual||1) : categStructureOfLevel(c.categLivello);
  }
  export const CATEG_STRUCTURE_LABELS = {
    1:'1 — Dimensione singola', 2:'2 — Doppia dimensione + no-go',
    3:'3 — Regola disgiuntiva', 4:'4 — Confronto 1-back', 5:'5 — Doppia dimensione, 4 risposte'
  };
  export const CATEG_STRUCTURE_HINTS = {
    1:'Singola dimensione, regola fissa per tutta la sessione (nessun costo di switch, a differenza del Task-switching).',
    2:'Doppia dimensione con no-go: 3 risposte attive più un caso in cui non si deve rispondere.',
    3:'Stessa doppia dimensione, ricombinata in una regola disgiuntiva a 2 risposte ("A se... oppure...").',
    4:'Confronto con lo stimolo precedente (1-back sulla categoria).',
    5:'Doppia dimensione mappata direttamente su 4 risposte — nessun no-go, nessuna disgiunzione.'
  };
  export function categTitrationModeHint(c, mode){
    const struct = categEffectiveStructure(c);
    if(mode==='manuale'){
      const isiPart = struct===4 ? ('frequenza lure '+Math.round((c.targetRate||0)*100)+'%') : ('ISI '+(c.isi/1000).toFixed(1)+'s');
      return 'Modalità Manuale: struttura "'+CATEG_STRUCTURE_LABELS[struct]+'" scelta liberamente qui sotto, indipendente dal numero di livello — '+isiPart+', non collegati a nessuna tabella.';
    }
    const lvl = c.categLivello;
    const isi = CATEG_ISI[lvl];
    const lure = CATEG_LURE[lvl];
    const paramTxt = isi!=null ? 'ISI '+(isi/1000).toFixed(1)+'s' : (lure!=null ? 'frequenza lure '+Math.round(lure*100)+'%' : '');
    if(mode==='livello'){
      return 'Modalità Livello: livello '+lvl+' → struttura "'+CATEG_STRUCTURE_LABELS[struct]+'", '+paramTxt+' — fissi per l\'intera seduta, la struttura non cambia mai durante la sessione.';
    }
    return 'Modalità Adattiva: si parte dal livello '+lvl+' (struttura "'+CATEG_STRUCTURE_LABELS[struct]+'"), '+paramTxt+' si stringe/allarga da solo in base all\'accuratezza — ma resta sempre dentro la stessa struttura per tutta la seduta, non la attraversa mai (vedi "Vincolo di fascia strutturale" nel README).';
  }
  // Trasparenza per il TAPAT — solo il blocco TONICO ha un parametro
  // legato al livello (l'intervallo min-max fra stimoli, non un ISI
  // singolo come altrove: qui l'imprevedibilità dell'intervallo è parte
  // del costrutto). Il blocco FASICO usa sempre il campo ISI generico di
  // Setup, in ogni modalità — non compare qui perché non cambia mai.
  export function tapatTitrationModeHint(c, mode){
    if(mode==='manuale'){
      return 'Modalità Manuale: nel blocco tonico l\'intervallo fra stimoli varia liberamente fra '+(c.tapatIsiMin/1000).toFixed(2)+'s e '+(c.tapatIsiMax/1000).toFixed(2)+'s, indipendente dal livello. Il blocco fasico usa sempre l\'ISI impostato più sotto.';
    }
    const range = TAPAT_LEVELS[c.tapatStartLevel] || TAPAT_LEVELS[3];
    if(mode==='livello'){
      return 'Modalità Livello: nel blocco tonico l\'intervallo fra stimoli segue la tabella del livello '+c.tapatStartLevel+' ('+(range[0]/1000).toFixed(2)+'-'+(range[1]/1000).toFixed(2)+'s), fisso per l\'intera seduta.';
    }
    return 'Modalità Adattiva: si parte dal livello '+c.tapatStartLevel+' ('+(range[0]/1000).toFixed(2)+'-'+(range[1]/1000).toFixed(2)+'s nel blocco tonico), ma il livello si sposta da solo in base all\'accuratezza.';
  }
  export function neglectTitrationModeHint(c, mode){
    const lvl = c.neglectMode==='progressiva' ? c.neglectStartLevel : neglectSubLevelForDisplay(c);
    if(mode==='manuale'){
      return 'Modalità Manuale: dimensione tavola ('+c.neglectBoardSize+' elementi) e tempo limite ('+(c.neglectTimeLimit||'nessuno')+(c.neglectTimeLimit?'s':'')+') restano quelli impostati qui sopra, indipendenti dal livello.';
    }
    const subLevel = neglectSubLevelForDisplay(c);
    const size = ADAPT_NEGLECT_SIZE[subLevel];
    const time = ADAPT_NEGLECT_TIME[subLevel];
    const sizeTxt = size!=null ? size+' elementi' : '(non definito a questo livello)';
    const timeTxt = time!=null ? (time===0?'nessun limite':time+'s') : (c.neglectTimeLimit||'nessuno')+(c.neglectTimeLimit?'s':'');
    if(mode==='livello'){
      return 'Modalità Livello: dimensione tavola ('+sizeTxt+') e tempo limite ('+timeTxt+') seguono la tabella per il livello '+lvl+', fissi per l\'intera seduta.';
    }
    return 'Modalità Adattiva: si parte dal livello '+lvl+' con gli stessi parametri di tabella della modalità Livello, ma il livello si sposta da solo tavola per tavola in base all\'accuratezza.';
  }
  // Trasparenza per il Doppio compito — un solo selettore Manuale/Livello/
  // Adattivo condiviso (non uno per canale: cfg.adaptive è già un unico
  // interruttore nel motore, i due canali restano indipendenti solo nei
  // LIVELLI numerici, non nella scelta di modalità), quindi la funzione
  // deve descrivere entrambi i canali insieme.
  export function dualTitrationModeHint(c, mode){
    if(mode==='manuale'){
      return 'Modalità Manuale: la frequenza target di ciascun canale resta quella impostata qui sotto, indipendente dal livello. L\'ISI resta '+(c.isi/1000).toFixed(1)+'s, non collegato al livello.';
    }
    const freq1 = ADAPT_DUAL_FREQ[c.dualStartLevel1], freq2 = ADAPT_DUAL_FREQ[c.dualStartLevel2];
    const avgLevel = Math.max(1, Math.min(10, Math.round(((c.dualStartLevel1||1)+(c.dualStartLevel2||1))/2)));
    const isi = ADAPT_ISI.dualtask[avgLevel];
    if(mode==='livello'){
      return 'Modalità Livello: frequenza target canale 1 ('+Math.round((freq1||0)*100)+'%) e canale 2 ('+Math.round((freq2||0)*100)+'%) seguono la tabella dei rispettivi livelli. ISI condiviso ('+(isi/1000).toFixed(1)+'s) derivato dalla media dei due livelli ('+avgLevel+') — fissi per l\'intera seduta.';
    }
    return 'Modalità Adattiva: si parte dai livelli '+c.dualStartLevel1+'/'+c.dualStartLevel2+' con gli stessi parametri di tabella della modalità Livello, ma ciascun canale si sposta da solo, in modo indipendente, in base alla propria accuratezza (l\'ISI condiviso segue la media dei due, aggiornata di conseguenza).';
  }
  export function titrationModeHint(c, mode){
    const taskMode = c.taskMode;
    const lvl = levelOfCfg(c); // usa il campo livello corretto per l'esercizio (nLevel per N-back, adaptStartLevel per gli altri 6 — non erano lo stesso campo, bug corretto)
    if(mode==='manuale'){
      const parts = [];
      if(taskMode==='nback') parts.push('n='+nbackParamsForLevel(c.nLevel).n, 'frequenza bersaglio '+Math.round(c.targetRate*100)+'%');
      else if(taskMode==='gonogo') parts.push((c.targetSeq||[]).length+' elementi no-go attivi', 'frequenza no-go '+Math.round(c.targetRate*100)+'%');
      else if(taskMode==='switching') parts.push('nessun intervallo cue→stimolo dedicato (regola e stimolo mostrati insieme)', 'nessuno sbilanciamento fra le due regole (50/50)');
      else if(taskMode==='sequenza') parts.push('lunghezza sequenza bersaglio: '+c.targetSeq.length);
      else if(taskMode==='stopsignal' || taskMode==='ant') parts.push('ISI '+c.isi+' ms (non collegato al livello)');
      return 'Modalità Manuale: ogni parametro resta quello impostato qui sotto, indipendente dal livello.'+(parts.length?' Oggi: '+parts.join(', ')+'.':'');
    }
    if(mode==='livello'){
      return 'Modalità Livello: tutti i parametri collegati (secondo l\'esercizio: ISI, frequenza bersaglio/no-go, intervallo cue→stimolo, sbilanciamento regole, lunghezza sequenza) sono quelli di tabella per il livello '+lvl+', fissi per l\'intera seduta — muovi lo stepper "Livello" qui sopra per cambiarli tutti insieme.';
    }
    return 'Modalità Adattiva: si parte dal livello '+lvl+' con gli stessi parametri di tabella della modalità Livello, ma il livello si sposta da solo durante la seduta in base all\'accuratezza (regola 70-85% ogni 8 prove).';
  }
  // Modalità "progressiva": incolla le tre modalità in un unico esercizio,
  // ciascuna con la sua scala 1-10 completa (non compressa) — livelli
  // 1-10 = Classico, 11-20 = Trova l'intruso, 21-30 = Conteggio a regola.
  // session.liveBoardLevel resta il contatore ASSOLUTO 1-30 (usato dalla
  // titolazione e mostrato come "livello" complessivo); questa funzione
  // traduce quel numero nel sotto-livello 1-10 che le tabelle esistenti
  // (ADAPT_NEGLECT_SIZE/TIME, neglectRuleFor) già sanno leggere, così ogni
  // fase riparte dal proprio pavimento invece di continuare la scala
  // dimensionale della fase precedente.
  export function neglectProgressivaPhase(absLevel){
    const lvl = Math.max(1, Math.min(30, absLevel||1));
    if(lvl<=10) return {mode:'classico', subLevel:lvl};
    if(lvl<=20) return {mode:'intruso', subLevel:lvl-10};
    return {mode:'regola', subLevel:lvl-20};
  }
  // Quale campo di cfg rappresenta il "livello di partenza" per ciascun
  // esercizio — usato per riportarlo a 1 quando si apre l'esercizio senza
  // una configurazione specifica da caricare (vedi applyLevelBaselineOrSuggestion).
  export const LEVEL_FIELD_OF_TASKMODE = {
    nback:'nLevel', categorizzazione:'categLivello',
    sequenza:'adaptStartLevel', switching:'adaptStartLevel', gonogo:'adaptStartLevel', stopsignal:'adaptStartLevel', ant:'adaptStartLevel', simon:'adaptStartLevel', runningspan:'adaptStartLevel',
    tapat:'tapatStartLevel',
    neglect:'neglectStartLevel', dualtask:['dualStartLevel1','dualStartLevel2'],
    goaltask:'goaltaskLivello', memoria:'memoriaLivello'
  };
  // Estrae un valore di livello leggibile da una cfg, per confronti (es. "il
  // suggerimento originale dello screening diceva livello X, oggi è Y") e
  // per mostrarlo ovunque serva (nome proposto, "già nel programma"...).
  export function levelOfCfg(c){
    const field = LEVEL_FIELD_OF_TASKMODE[c.taskMode];
    if(!field) return null;
    if(Array.isArray(field)) return field.map(k=>c[k]).join('/');
    return c[field];
  }
