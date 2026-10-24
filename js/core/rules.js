// Regole e materiali condivisi fra gli esercizi: Task-switching, Categorizzazione, Stop-Signal, Simon, ANT.
// SPOSTATE da index.html (passo 5c) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg (e la seduta) correnti.
// - nessuna: stesso testo di prima.
import { POOLS } from './pools.js';

  // ANT semplificato: fattori allerta (cue presente/assente), orienting
  // (cue spaziale valido 80% / non valido 20%), conflitto (flanker
  // congruenti/incongruenti/neutri). Risposta = direzione della freccia
  // centrale, non "match" — non produce hit/FA in senso classico.
  // Materiali alternativi per l'ANT classico: la coppia designata sostituisce
  // sinistra/destra come identità del target — congruenza/neutralità restano
  // la stessa logica, solo con un altro alfabeto percettivo. Non è una leva
  // di difficoltà (non cambia quanto è arduo il compito) — cambia solo
  // quale materiale percettivo lo veicola, utile per varietà e per adattarsi
  // a profili diversi (es. evitare le frecce con difficoltà visuospaziali).
  export const ANT_MATERIAL_TOKENS = { lettere:['H','S'], simboli:['●','■'] };
  export const ANT_MATERIAL_OPTIONS = ['frecce','lettere','simboli'];
  // Task-switching: regola "parity" (pari/dispari) o "magnitude" (>5 / <5)
  // su numeri 1-9 esclus 5; cambia con probabilità cfg.targetRate.
  // Due regole binarie per ciascun materiale disponibile per il task-switching.
  // classify(item) -> true = risposta "a", false = risposta "b".
  export const SWITCH_RULESETS = {
    numeri: {
      ruleA:{label:'Pari / Dispari', labelA:'Pari', labelB:'Dispari', classify:v=> parseInt(v,10)%2===0},
      ruleB:{label:'Alto (>5) / Basso (<5)', labelA:'Alto (>5)', labelB:'Basso (<5)', classify:v=> parseInt(v,10)>5}
    },
    lettere: {
      ruleA:{label:'Vocale / Consonante', labelA:'Vocale', labelB:'Consonante', classify:v=> 'AEIOU'.includes(v)},
      ruleB:{label:'A–M / N–Z', labelA:'A–M', labelB:'N–Z', classify:v=> v<='M'}
    },
    colori: {
      ruleA:{label:'Caldo / Freddo', labelA:'Caldo', labelB:'Freddo', classify:v=> ['Rosso','Giallo','Arancione','Magenta'].includes(v.icon)},
      ruleB:{label:'Primario / Non primario', labelA:'Primario', labelB:'Non primario', classify:v=> ['Rosso','Blu','Giallo'].includes(v.icon)}
    },
    simboli: {
      ruleA:{label:'Rotondo / Con angoli', labelA:'Rotondo', labelB:'Con angoli', classify:v=> ['●','⬤'].includes(v)},
      ruleB:{label:'Grande / Piccolo', labelA:'Grande', labelB:'Piccolo', classify:null} // gestito a parte: dimensione casuale ad ogni prova, non proprietà fissa del simbolo
    },
    // Modalità bivalente: a differenza degli altri materiali, qui le due
    // regole non sono due modi di guardare la STESSA proprietà (es. pari/
    // dispari vs alto/basso su un numero) — sono due dimensioni indipendenti
    // dello stesso stimolo (tipo di carattere e colore), assegnate a caso ad
    // ogni prova. Questo crea vera bivalenza in stile Stroop: su metà delle
    // prove le due dimensioni "concordano" (es. numero nero → risposta A sia
    // per tipo che per colore), sull'altra metà sono in conflitto (es.
    // numero rosso → tipo dice A, colore dice B) — la congruenza è marcata
    // per ogni prova indipendentemente da quale regola sia attiva in quel
    // momento, e alimenta un indice di conflitto calcolato allo stesso modo
    // di quello dell'ANT (RT incongruenti − RT congruenti).
    // Nota sull'etichetta "Bianco" invece di "Nero": lo schermo di sessione
    // ha sfondo scuro (--focus), quindi un vero nero sarebbe invisibile —
    // lo stimolo di quel colore viene reso in bianco (vedi renderStimulus).
    // L'etichetta deve corrispondere a quello che il paziente vede davvero,
    // non al nome interno della proprietà (colore:'nero' resta invariato
    // nei dati per compatibilità con le sessioni già registrate).
    bivalente: {
      ruleA:{label:'Numero / Lettera', labelA:'Numero', labelB:'Lettera', classify:v=> v.tipo==='numero'},
      ruleB:{label:'Bianco / Rosso', labelA:'Bianco', labelB:'Rosso', classify:v=> v.colore==='nero'}
    }
  };
  // Materiale pronunciato: stessa regola di classificazione di lettere/numeri
  // (stessi valori, POOLS.lettereVoce/numeriVoce sono lo stesso array) — usato
  // dalla Categorizzazione condizionale ai livelli a dimensione singola.
  SWITCH_RULESETS.lettereVoce = SWITCH_RULESETS.lettere;
  SWITCH_RULESETS.numeriVoce = SWITCH_RULESETS.numeri;
  // Regole di classificazione dello Stop-Signal two-choice: una sola regola
  // fissa per materiale (a differenza del Task-switching non c'è alternanza
  // fra due regole), riusa le stesse coppie già validate altrove dove
  // esistono (vocale/consonante, pari/dispari) invece di inventarne di nuove.
  // 'suoni' non ha un ruleset preesistente: la coppia scelta (grave/acuto,
  // soglia sulla frequenza mediana del pool esistente) è un'ipotesi di
  // costruzione, non un dato di letteratura — da confermare.
  export const STOPSIGNAL_RULES = {
    frecce: {labelA:'◀ Sinistra', labelB:'Destra ▶', classify:v=> v==='◀'},
    lettere:{labelA:SWITCH_RULESETS.lettere.ruleA.labelA, labelB:SWITCH_RULESETS.lettere.ruleA.labelB, classify:SWITCH_RULESETS.lettere.ruleA.classify},
    numeri: {labelA:SWITCH_RULESETS.numeri.ruleA.labelA, labelB:SWITCH_RULESETS.numeri.ruleA.labelB, classify:SWITCH_RULESETS.numeri.ruleA.classify},
    forma:  {labelA:'Cerchio', labelB:'Triangolo', classify:v=> v==='●'},
    suoni:  {labelA:'Grave', labelB:'Acuto', classify:v=> v.f < 380}
  };
  export const SWITCH_BIVALENTE_NUM_POOL = ['1','2','3','4','6','7','8','9'];
  export const SWITCH_BIVALENTE_LETTERE = ['A','B','D','E','F','G','H','I','J','K','L','M','O','P','U']; // identità della lettera irrilevante per entrambe le regole bivalenti (Numero/Lettera, Bianco/Rosso) — include vocali e consonanti, nessuna ragione per escluderle
  // Ruleset effettivo per la sessione — override locale di ruleB quando il
  // bivalente usa la dimensione acustica (tono) invece del colore. Unica
  // fonte usata sia da buildSwitching() sia da qualunque schermata mostri
  // le etichette delle regole, così restano sempre coerenti fra loro.
  // Etichette dei pulsanti per dim1/dim2, condivise dal motore a doppia
  // dimensione — 'tipo' mantiene l'ordine storico (Numero/Lettera, non
  // Lettera/Numero: era già così prima di questa generalizzazione, non
  // lo cambio solo per uniformità con gli altri 4 regimi). Gli altri 4
  // usano semplicemente il polo che dualDim1IsA/dualDim2IsA già
  // calcolano, senza bisogno d'inversione.
  export const DUAL_DIM1_LABELS = {
    tipo:    {label:'Numero / Lettera', labelA:'Numero', labelB:'Lettera', classify:v=> !dualDim1IsA(v)},
    forma:   {label:'Cerchio / Triangolo', labelA:'Cerchio', labelB:'Triangolo', classify:v=> dualDim1IsA(v)},
    parita:  {label:'Pari / Dispari', labelA:'Pari', labelB:'Dispari', classify:v=> dualDim1IsA(v)},
    consvoc: {label:'Vocale / Consonante', labelA:'Vocale', labelB:'Consonante', classify:v=> dualDim1IsA(v)},
    freccia: {label:'Su / Giù', labelA:'Su', labelB:'Giù', classify:v=> dualDim1IsA(v)}
  };
  export const DUAL_DIM2_LABELS = {
    colore: {label:'Bianco / Rosso', labelA:'Bianco', labelB:'Rosso', classify:v=> dualDim2IsA(v)},
    tono: {label:'Grave / Acuto', labelA:'Grave', labelB:'Acuto', classify:v=> dualDim2IsA(v)},
    posizione: {label:'Sinistra / Destra', labelA:'Sinistra', labelB:'Destra', classify:v=> dualDim2IsA(v)}
  };
  export function dualDim1KeyOf(regime){ return regime==='tipo_tono' ? 'tipo' : regime.split('_')[0]; }
  export function dualDim2KeyOf(regime){ return regime==='tipo_tono' ? 'tono' : (regime==='consvoc_posizione' ? 'posizione' : 'colore'); }
  export function switchRulesetFor(c){
    if(c.switchMaterial!=='bivalente') return SWITCH_RULESETS[c.switchMaterial];
    const regime = c.switchRegimeSessione || pickDualDimRegime(c.switchRegime);
    return { ruleA: DUAL_DIM1_LABELS[dualDim1KeyOf(regime)], ruleB: DUAL_DIM2_LABELS[dualDim2KeyOf(regime)] };
  }
  // ---------- Simon task ----------
  // Conflitto spazio-risposta, non identità-vs-identità come il flanker
  // dell'ANT: un solo stimolo (nessun distrattore affiancato), il
  // conflitto nasce fra la POSIZIONE dello stimolo (irrilevante per il
  // compito) e la posizione del pulsante di risposta corretto — Simon &
  // Rudell, 1967, Journal of Applied Psychology, 51(3), 300-304.
  // Deliberatamente NON il Color-Word Stroop classico: eviterebbe di
  // sovrapporsi a un eventuale Stroop usato come misura diagnostica
  // altrove (NeuroScore o test carta-e-matita), che l'esposizione
  // ripetuta come esercizio di training contaminerebbe con un effetto di
  // pratica scambiabile per miglioramento reale.
  // Mappatura colore→pulsante FISSA per l'intera sessione (Blu→sinistra,
  // Verde→destra) — dichiarata una volta nelle istruzioni, non
  // rimescolata prova per prova (sarebbe un cambio di regola a metà
  // sessione, vietato dal principio delle bande strutturali). Riusa gli
  // stessi hex già validati in POOLS.colori, non nuovi colori inventati.
  export const SIMON_COLORS = { blu:{hex:'#3B72D6', icon:'Blu'}, verde:{hex:'#3FA34D', icon:'Verde'} };
  // Proporzione di congruenza: manipolazione list-wide (a livello di
  // blocco/sessione, non prova per prova) — parametro clinico fisso,
  // deciso in Setup, non una leva della titolazione adattiva: la
  // proporzione di congruenza cambia CHE COSA si misura (quanto il
  // paziente sfrutta l'aspettativa generale per prepararsi
  // proattivamente all'interferenza), non QUANTO è difficile in senso
  // continuo — stessa distinzione già fatta per Categorizzazione
  // condizionale (struttura Manuale mai derivata dal livello).
  export const SIMON_CONGRUENCE_PROB = { bilanciato:0.5, prevalenza_congruente:0.75, prevalenza_incongruente:0.25 };
  // Esercizio separato dal Task-switching: qui la regola resta fissa per
  // tutta la sessione (non si misura il costo di cambiare regola, ma il
  // carico di applicarne una di complessità crescente). 5 livelli fissi,
  // struttura confermata da Rodrigo — non adattivo (a differenza di
  // switching/nback/ecc.), il livello si sceglie a mano come per il
  // neglect a regola.
  // Livelli 2/3/5 condividono lo stesso item a due dimensioni indipendenti
  // (tipo: lettera/numero; colore: nero/rosso) usato dal bivalente dello
  // switching, ma con mappature diverse sulla risposta:
  //  - L2: doppia dimensione con no-go (3 risposte attive + un caso di non risposta)
  //  - L3: stessa doppia dimensione, ricombinata in una regola disgiuntiva a 2 risposte
  //  - L5: stessa doppia dimensione, mappatura diretta a 4 risposte (nessun no-go, nessuna disgiunzione)
  // I livelli 1/4 restano invece a singola dimensione (colore o simbolo,
  // scelta dall'operatore) — L4 aggiunge il confronto con lo stimolo
  // precedente (n-back sulla categoria, n=1 fisso).
  export const CATEG_LETTERE = ['B','D','F','G','H','J','K','L','M','P']; // consonanti, come nel bivalente dello switching
  export const CATEG_NUMERI = ['1','2','3','4','6','7','8','9'];
  // Registro condiviso di "regimi" a doppia dimensione, usato sia da
  // Categorizzazione condizionale (strutture 2/3/5) sia da Task-switching
  // bivalente — stessa idea di variabilità (Moshon-Cohen et al., 2024,
  // Psychological Research, 88, 786-802: la variabilità casuale ha
  // generalizzato meglio di quella a blocchi in Go/No-Go), le stesse 6
  // coppie, un'unica implementazione invece di due parallele.
  // 'tipo_tono' è escluso dalla ROTAZIONE per scelta esplicita — resta
  // selezionabile a mano (canale uditivo), non ruota mai da solo.
  // Regole di classificazione sempre riusate da altrove (SWITCH_RULESETS,
  // già validate per Task-switching/Simon/Stop-Signal), mai reinventate
  // qui: parità e vocale/consonante sono le stesse regole di sempre.
  export const DUAL_DIM_ROTATION = ['tipo_colore','forma_colore','parita_colore','consvoc_posizione','freccia_colore'];
  export const DUAL_DIM_ALL = DUAL_DIM_ROTATION.concat(['tipo_tono']);
  export function pickDualDimRegime(manualValue){
    if(manualValue && manualValue!=='random') return manualValue;
    return DUAL_DIM_ROTATION[Math.floor(Math.random()*DUAL_DIM_ROTATION.length)];
  }
  // Item generico per uno dei 6 regimi — forma sempre uniforme:
  // {regime, dim1 (nome dimensione), tipo (nome del polo), valore (cosa
  // mostrare/dire), e la dim2 in una di tre forme (colore/tono/side), mai
  // più di una alla volta.
  export function genDualDimItem(regime){
    if(regime==='forma_colore'){
      const isCerchio = Math.random()<0.5;
      return { regime, dim1:'forma', tipo:isCerchio?'cerchio':'triangolo', valore: isCerchio?POOLS.forma[0]:POOLS.forma[1], colore: Math.random()<0.5?'nero':'rosso' };
    }
    if(regime==='parita_colore'){
      const valore = POOLS.numeri[Math.floor(Math.random()*POOLS.numeri.length)];
      const isPari = SWITCH_RULESETS.numeri.ruleA.classify(valore);
      return { regime, dim1:'parita', tipo:isPari?'pari':'dispari', valore, colore: Math.random()<0.5?'nero':'rosso' };
    }
    if(regime==='consvoc_posizione'){
      const valore = POOLS.lettere[Math.floor(Math.random()*POOLS.lettere.length)];
      const isVocale = SWITCH_RULESETS.lettere.ruleA.classify(valore);
      return { regime, dim1:'consvoc', tipo:isVocale?'vocale':'consonante', valore, side: Math.random()<0.5?'left':'right' };
    }
    if(regime==='freccia_colore'){
      const isSu = Math.random()<0.5;
      return { regime, dim1:'freccia', tipo:isSu?'su':'giu', valore: isSu?'↑':'↓', colore: Math.random()<0.5?'nero':'rosso' };
    }
    const isLettera = Math.random()<0.5;
    const valore = isLettera
      ? CATEG_LETTERE[Math.floor(Math.random()*CATEG_LETTERE.length)]
      : CATEG_NUMERI[Math.floor(Math.random()*CATEG_NUMERI.length)];
    const item = { regime, dim1:'tipo', tipo: isLettera?'lettera':'numero', valore };
    if(regime==='tipo_tono') item.tono = Math.random()<0.5?'grave':'acuto';
    else item.colore = Math.random()<0.5?'nero':'rosso';
    return item;
  }
  // "Polo A" della dim1 (lettera/cerchio/pari/vocale/su) vs "polo B"
  // (numero/triangolo/dispari/consonante/giù) — un solo punto che sa
  // quale campo leggere per ciascun regime.
  export function dualDim1IsA(item){
    if(item.dim1==='forma') return item.tipo==='cerchio';
    if(item.dim1==='parita') return item.tipo==='pari';
    if(item.dim1==='consvoc') return item.tipo==='vocale';
    if(item.dim1==='freccia') return item.tipo==='su';
    return item.tipo==='lettera';
  }
  // "Polo A" della dim2 (nero/grave/sinistra) vs "polo B" (rosso/acuto/
  // destra) — stessa distinzione binaria, quale proprietà venga letta
  // dipende solo da quale campo è valorizzato sull'item.
  export function dualDim2IsA(item){
    if(item.side!=null) return item.side==='left';
    if(item.tono!=null) return item.tono==='grave';
    return item.colore==='nero';
  }
