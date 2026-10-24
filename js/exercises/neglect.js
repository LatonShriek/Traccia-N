// Cancellazione (neglect): costruzione delle tavole (classico, intruso, regola), regola composta, sotto-livello.
// SPOSTATE da index.html (passo 5d) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg e la seduta correnti.
// - neglectBottomUpWeakSide, neglectBoardSubLevel e buildNeglectBoard* ricevono cfg e session come parametri; neglectLayoutPositions riceve cfg.
// - INTRUSO_POOL (mai usata) non è stata portata.
// - shuffleArr, usata solo dalle tavole, vive qui.
import { ADAPT_NEGLECT_SIZE } from '../core/levels.js';
import { POOLS, seqLabel } from '../core/pools.js';
import { neglectProgressivaPhase } from '../core/titration.js';

  export function shuffleArr(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
  // Pool per la modalità "intruso": un unico elenco ordinato per
  // confondibilità CRESCENTE fra i glifi stessi, non per famiglia
  // alfabetica — è la confondibilità interna al pool "in gioco" a un dato
  // livello a determinare la difficoltà di ricerca, non la distanza
  // dell'alfabeto dal latino (criterio precedente, rivisto: il greco non è
  // necessariamente più difficile del cirillico solo perché "più estraneo
  // al latino" — quello che conta è quanto i glifi si confondono tra loro
  // nella stessa tavola). Struttura: un nucleo iniziale di lettere latine
  // molto distinguibili a colpo d'occhio (nessun quasi-gemello), poi
  // lettere latine via via più simili tra loro, poi i quasi-gemelli
  // cirillici delle stesse lettere (a/а, o/о, x/х — massima confondibilità
  // cross-alfabeto), poi il greco (in parte estraneo, in parte con residui
  // quasi-gemelli: α/a, τ/t, χ/x), infine l'armeno (nessun aggancio al
  // latino — difficoltà da pura novità, non da confondibilità).
  export const INTRUSO_POOL_ORDERED = [
    'w','m','k','x','h','z',                          // nucleo molto distinguibile
    'a','e','o','p','c','u','s','n','v','y',           // latino, via via più simile al suo interno
    'а','е','о','р','с','х','і','ѕ',                   // cirillico — quasi-gemelli del blocco sopra
    'β','γ','δ','θ','λ','μ','π','σ','τ','φ','χ','α',   // greco — perlopiù estraneo, con residui quasi-gemelli
    'ա','բ','գ','դ','ե','զ','է','թ','ի','լ','խ','ծ'    // armeno — massima novità percettiva
  ];
  // Famiglie ancora disponibili per la selezione manuale forzata
  // (utile per allenare specificamente un pattern percettivo), invariate.
  export const INTRUSO_FAMILIES = {
    latino_cirillico: INTRUSO_POOL_ORDERED.slice(0,24),
    greco: INTRUSO_POOL_ORDERED.slice(24,36),
    armeno: INTRUSO_POOL_ORDERED.slice(36,48)
  };
  // 'auto' = quanti glifi del pool ordinato sono "in gioco" a quel livello
  // (finestra crescente sul pool sopra, non un salto discreto fra
  // famiglie) — sostituisce la vecchia soglia rigida greco@7/armeno@9.
  export const INTRUSO_POOL_SIZE = {1:6,2:8,3:11,4:14,5:18,6:23,7:29,8:36,9:42,10:48};
  export function intrusoPoolFor(alphabetCfg, livello){
    if(alphabetCfg && alphabetCfg!=='auto') return INTRUSO_FAMILIES[alphabetCfg] || INTRUSO_FAMILIES.latino_cirillico;
    const size = INTRUSO_POOL_SIZE[Math.max(1,Math.min(10,livello))] || INTRUSO_POOL_SIZE[10];
    return INTRUSO_POOL_ORDERED.slice(0, size);
  }
  // Quante identità DISTINTE usare fra i non-bersaglio, come frazione del
  // massimo possibile per quella tavola: a livelli bassi poche identità
  // molto ripetute (campo omogeneo, il singolo spicca per contrasto —
  // ricerca "a colpo d'occhio"), a livelli alti tante identità quasi tutte
  // in semplice coppia (campo eterogeneo, serve confrontare quasi ogni
  // elemento con il suo eventuale doppione — ricerca seriale, più lenta e
  // impegnativa). Non è la dimensione della tavola a cambiare per livello
  // (quella la gestisce già ADAPT_NEGLECT_SIZE), è quanto la tavola è
  // ripetitiva al suo interno.
  export const INTRUSO_DISTINCT_FRACTION = {1:0.10, 2:0.18, 3:0.28, 4:0.40, 5:0.55, 6:0.68, 7:0.80, 8:0.90, 9:0.96, 10:1.0}; // combinata con INTRUSO_POOL_SIZE: ai livelli bassi il pool "in gioco" è già piccolo, quindi anche con questa frazione le identità restano poche e molto ripetute — "solo coppie" (fraction=1.0, ogni identità ripetuta il minimo indispensabile) si raggiunge solo al livello 10, mai prima
  // Regole composte per la modalità "regola": ogni livello aggiunge UNA
  // condizione in più rispetto al precedente, cumulativa (livello 3
  // contiene anche le condizioni del livello 1 e 2) — stessa filosofia
  // "stack, non replace" già usata per gli scenari ecologici. "colore" e
  // "riga pari" sono dimensioni aggiunte apposta per la modalità, non
  // proprietà naturali di lettere/numeri.
  // manualClauses: se presente (array di chiavi 'base'|'colore'|'riga'|
  // 'sfondo'), sostituisce la progressione automatica per livello con la
  // combinazione scelta dall'operatore — permette sia condizioni singole
  // sia combinazioni multiple in qualunque ordine, non solo cumulative.
  // Sollecitazione bottom-up (solo modalità classico): non è un cue sempre
  // acceso, ma reattivo — si attiva solo quando, DENTRO la tavola in corso,
  // è già evidente uno squilibrio (il paziente ha trovato molti più
  // bersagli su un lato che sull'altro), e solo ai livelli bassi (dove
  // l'esplorazione autonoma top-down potrebbe non bastare da sola). Il
  // lato "debole" coincide con quello che il gradiente adattivo sta già
  // caricando di più (vedi finishBoard): gradiente >50 = si sta caricando
  // sinistra perché sinistra è il lato che va peggio.
  export function neglectBottomUpWeakSide(cfg, session){
    if((cfg.neglectMode!=='classico' && !(cfg.neglectMode==='progressiva' && neglectProgressivaPhase(session&&session.liveBoardLevel).mode==='classico')) || cfg.neglectBottomUp==='off') return null;
    if(!cfg.adaptive || !session || session.liveBoardLevel==null) return null;
    if(neglectBoardSubLevel(cfg, session) > 4) return null; // solo ai livelli bassi (era 1-2 su scala 1-5, riproporzionato a 1-4 su scala 1-10)
    const gradient = session.liveGradient!=null ? session.liveGradient : cfg.neglectGradient;
    if(Math.abs(gradient-50) < 15) return null; // nessuna asimmetria ancora emersa
    const weakSide = gradient > 50 ? 'left' : 'right';
    const strongSide = weakSide==='left' ? 'right' : 'left';
    if(!session.board || !session.board.length) return null;
    const foundWeak = session.board.filter(b=> b.side===weakSide && b.found).length;
    const foundStrong = session.board.filter(b=> b.side===strongSide && b.found).length;
    const remainingWeak = session.board.some(b=> b.side===weakSide && b.isTarget && !b.found);
    if(!remainingWeak) return null; // niente rimasto da segnalare su quel lato
    if(foundStrong - foundWeak < 3) return null; // lo squilibrio in questa tavola non è (ancora) evidente
    return weakSide;
  }
  export function neglectRuleFor(stimType, livello, manualClauses){
    // Scala 1-10, unificata con quella che governa dimensione tavola/tempo
    // (ADAPT_NEGLECT_SIZE/TIME) — un solo numero descrive l'intera
    // difficoltà di "Conteggio a regola", non più due assi separati.
    // Ordine di introduzione delle condizioni: colore poi sfondo, PRIMA di
    // riga — non solo per numerosità ma per tipo di elaborazione richiesta
    // (Treisman & Gelade, 1980, feature integration theory): colore e
    // sfondo sono proprietà percettive dirette dell'elemento stesso,
    // rilevabili "a colpo d'occhio" (pop-out, ricerca per singola
    // caratteristica); "riga pari" è invece relazionale/posizionale —
    // richiede localizzare l'elemento rispetto all'intera tavola, un
    // giudizio spaziale più costoso — quindi va per ultima. Ogni
    // condizione resta attiva per 2 livelli (il secondo con tavola più
    // grande/tempo più stretto), stessa filosofia "struttura fissa dentro
    // la banda, poi ISI/tempo più stretto" già usata altrove. Resta un
    // ordine ipotizzato su un principio generale, non misurato su questo
    // compito specifico — verificabile/correggibile con l'uso clinico.
    livello = Math.max(1, Math.min(10, livello||1));
    const CLAUSE_DEFS = {
      base: stimType==='numeri'
        ? {test:(v)=> parseInt(v.carattere,10)%2===0, label:'pari'}
        : {test:(v)=> 'AEIOU'.includes(v.carattere), label:'vocale'},
      colore: {test:(v)=> v.colore==='rosso', label:'rosso'},
      sfondo: {test:(v)=> v.sfondo==='giallo', label:'con sfondo giallo'},
      riga:   {test:(v)=> v.rigaPari, label:'in una riga pari'}
    };
    let keys;
    if(manualClauses && manualClauses.length){
      keys = manualClauses.includes('base') ? manualClauses : ['base'].concat(manualClauses);
    } else {
      keys = ['base'];
      if(livello>=3) keys.push('colore');
      if(livello>=5) keys.push('sfondo');
      if(livello>=7) keys.push('riga');
      // livelli 7-10: stesse quattro condizioni (soffitto di lettura del
      // compito — oltre 4 condizioni simultanee la regola diventa
      // arbitraria da tenere a mente, non più rappresentativa di
      // attenzione selettiva), tavola via via più grande/tempo più
      // stretto fino al livello 10.
    }
    const clauses = keys.map(k=>CLAUSE_DEFS[k]).filter(Boolean);
    const label = clauses.map(c=>c.label).join(' + ');
    return { test:(v)=> clauses.every(c=>c.test(v)), label, n: clauses.length };
  }
  // Layout condiviso dalle tre modalità: calcola posizioni non sovrapposte
  // per n elementi (griglia leggibile o layout sparso), con lato
  // sinistra/destra per ciascuna — usato sia per assegnare i bersagli per
  // lato (modalità classico) sia solo per l'osservazione post-hoc di dove
  // è caduto l'elemento raro (modalità intruso/regola, dove il lato non è
  // controllato in generazione ma resta comunque utile da registrare).
  export function neglectLayoutPositions(cfg, n){
    const cols=8, rows=Math.ceil(n/cols);
    const cellW=100/cols, cellH=100/rows;
    let positions=[];
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) positions.push({r,c});
    positions = shuffleArr(positions).slice(0,n);
    const scattered = cfg.neglectLayout==='sparsa';
    const MIN_DIST = 10, MAX_TRIES = 40;
    // Margine dai bordi dello stage: gli elementi sono posizionati per il
    // CENTRO (transform:translate(-50%,-50%) in CSS) con larghezza fino al
    // 9% del container — un centro troppo vicino al bordo (visto in
    // modalità "sparsa", e ai bordi della griglia su schermi stretti dove
    // il tetto in pixel non scatta) lascia sporgere metà elemento fuori
    // dallo schermo. 6 tiene margine anche per il caso più grande.
    const EDGE_MARGIN = 6;
    const clamp = v => Math.max(EDGE_MARGIN, Math.min(100-EDGE_MARGIN, v));
    const placedPos = [];
    function candidatePos(p, side){
      if(scattered){
        return { x: clamp(side==='left' ? Math.random()*45+2 : Math.random()*45+53), y: clamp(Math.random()*90+5) };
      }
      // Griglia: jitter volutamente stretto (35-65% della cella, non
      // 20-80%) — con un margine ampio le celle restano ordinate solo nei
      // dati (colonne/righe misurabili) ma a occhio sembrano comunque
      // sparse quanto la modalità libera, che è esattamente il problema
      // segnalato: le due modalità devono essere DISTINGUIBILI a vista,
      // non solo nei numeri.
      return { x: clamp(p.c*cellW + cellW*(0.35+Math.random()*0.3)), y: clamp(p.r*cellH + cellH*(0.35+Math.random()*0.3)) };
    }
    return positions.map(p=>{
      const side = p.c < cols/2 ? 'left':'right';
      let pos, tries=0;
      do{ pos = candidatePos(p, side); tries++; }
      while(tries<MAX_TRIES && placedPos.some(o=> Math.hypot(o.x-pos.x, o.y-pos.y) < MIN_DIST));
      pos = {x:clamp(pos.x), y:clamp(pos.y)};
      placedPos.push(pos);
      return {x:pos.x, y:pos.y, side, row:p.r, rigaPari: p.r%2===0};
    });
  }
  // Sotto-livello 1-10 da usare per QUALUNQUE lookup di dimensione/tempo/
  // regola — nella modalità progressiva traduce il contatore assoluto,
  // altrimenti restituisce il livello così com'è (comportamento invariato
  // per le tre modalità standalone).
  export function neglectBoardSubLevel(cfg, session){
    if(cfg.neglectMode==='progressiva'){
      const raw = cfg.titrationMode!=='manuale' ? (session && session.liveBoardLevel) : cfg.neglectStartLevel;
      return neglectProgressivaPhase(raw).subLevel;
    }
    if(cfg.neglectMode==='regola') return cfg.titrationMode!=='manuale' ? (session && session.liveBoardLevel) : cfg.neglectRuleLevel;
    return cfg.titrationMode!=='manuale' ? (session && session.liveBoardLevel) : cfg.neglectStartLevel;
  }
  export function buildNeglectBoardIntruso(cfg, session){
    const subLevel = neglectBoardSubLevel(cfg, session);
    const n = cfg.titrationMode!=='manuale' ? (ADAPT_NEGLECT_SIZE[subLevel] || cfg.neglectBoardSize) : cfg.neglectBoardSize;
    const level = subLevel || cfg.neglectStartLevel || 3;
    const pool = intrusoPoolFor(cfg.neglectAlphabet, level);
    const nOdd = n % 2 === 0 ? n+1 : n; // deve essere dispari: bersaglio singolo + il resto ripetuto
    const slots = nOdd - 1; // posizioni da riempire con identità ripetute
    // Massimo di identità distinte che la tavola può ospitare restando
    // comunque "ripetute" (almeno 2 copie ciascuna) e senza eccedere il
    // pool di glifi disponibili.
    const maxK = Math.max(1, Math.min(Math.floor(slots/2), pool.length-1));
    const fraction = INTRUSO_DISTINCT_FRACTION[Math.max(1,Math.min(10,level))] || 1;
    const k = Math.max(1, Math.min(maxK, Math.round(maxK*fraction)));
    const shuffled = shuffleArr(pool.slice());
    const identities = shuffled.slice(0, k);
    const singleton = shuffled[k];
    // distribuisce gli slot il più equamente possibile fra le k identità
    // (ognuna riceve almeno 2 copie, per costruzione di maxK)
    let glyphSequence = [];
    for(let i=0;i<slots;i++){ glyphSequence.push(identities[i % k]); }
    glyphSequence.push(singleton);
    glyphSequence = shuffleArr(glyphSequence);
    const positions = neglectLayoutPositions(cfg, nOdd);
    return positions.map((p,i)=>{
      const val = glyphSequence[i];
      return {x:p.x, y:p.y, val, isTarget: val===singleton, side:p.side, found:false, falseTap:false};
    });
  }
  // Modalità "regola": conteggio/ricerca a regola composta e crescente
  // (colore, parità, riga pari — cumulativa per livello, vedi
  // neglectRuleFor). Ogni elemento è {carattere, colore, rigaPari}; il
  // colore è una dimensione aggiunta apposta, non naturale del materiale.
  export function buildNeglectBoardRegola(cfg, session){
    const stimType = (cfg.stimType==='numeri' || cfg.stimType==='lettere') ? cfg.stimType : 'lettere';
    const basePool = stimType==='numeri' ? ['1','2','3','4','5','6','7','8','9'] : ['A','E','I','O','U','B','C','D','F','G','H','L','M','N','P','R','S','T'];
    const subLevel = neglectBoardSubLevel(cfg, session);
    const n = cfg.titrationMode!=='manuale' ? (ADAPT_NEGLECT_SIZE[subLevel] || cfg.neglectBoardSize) : cfg.neglectBoardSize;
    const rule = neglectRuleFor(stimType, subLevel || cfg.neglectRuleLevel, cfg.neglectRuleClauses);
    const positions = neglectLayoutPositions(cfg, n);
    return positions.map(p=>{
      const carattere = basePool[Math.floor(Math.random()*basePool.length)];
      const colore = Math.random()<0.5 ? 'nero' : 'rosso';
      const sfondo = Math.random()<0.5 ? 'giallo' : 'nessuno'; // sfondo ben visibile, dimensione indipendente dal colore del carattere
      const val = {carattere, colore, sfondo, rigaPari:p.rigaPari};
      return {x:p.x, y:p.y, val, isTarget: rule.test(val), side:p.side, found:false, falseTap:false};
    });
  }
  export function buildNeglectBoardClassico(cfg, session){
    const pool = POOLS[cfg.stimType];
    const targets = cfg.targetSeq;
    const n = cfg.titrationMode!=='manuale' ? (ADAPT_NEGLECT_SIZE[neglectBoardSubLevel(cfg, session)] || cfg.neglectBoardSize) : cfg.neglectBoardSize;
    const targetCount = Math.max(4, Math.round(n*0.25));
    // gradiente continuo 0-100: 0=tutti i bersagli a destra, 100=tutti a
    // sinistra, 50=simmetrico. Con l'adattivo attivo, session.liveGradient
    // può essersi spostato verso il lato più debole (vedi finishBoard).
    const gradient = cfg.adaptive ? (session.liveGradient!=null ? session.liveGradient : cfg.neglectGradient) : cfg.neglectGradient;
    const leftRatio = gradient/100;
    let targetsLeft = Math.round(targetCount*leftRatio), targetsRight = targetCount-targetsLeft;
    const cols=8, rows=Math.ceil(n/cols);
    const cellW=100/cols, cellH=100/rows;
    let positions=[];
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) positions.push({r,c});
    positions = shuffleArr(positions).slice(0,n);
    let li=0, ri=0;
    const scattered = cfg.neglectLayout==='sparsa';
    // Distanza minima tra i centri di due elementi (in punti percentuali
    // dell'area, 0-100) perché non si sovrappongano visivamente — gli
    // elementi occupano fino al 9% di larghezza ciascuno. Nel layout a
    // griglia funge da rete di sicurezza aggiuntiva rispetto alla cella;
    // nel layout sparso è l'unica cosa che evita la sovrapposizione, dato
    // che lì le coordinate erano scelte a caso senza alcun controllo.
    const MIN_DIST = 10;
    const MAX_TRIES = 40;
    const placedPos = [];
    function candidatePos(p, side){
      if(scattered){
        return {
          x: side==='left' ? Math.random()*45+2 : Math.random()*45+53,
          y: Math.random()*90+5
        };
      }
      // "griglia": piccola variazione dentro la cella (ordinato, leggibile).
      return {
        x: p.c*cellW + cellW*(0.2+Math.random()*0.6),
        y: p.r*cellH + cellH*(0.2+Math.random()*0.6)
      };
    }
    const items = positions.map((p,i)=>{
      const side = p.c < cols/2 ? 'left':'right';
      let pos, tries=0;
      do{ pos = candidatePos(p, side); tries++; }
      while(tries<MAX_TRIES && placedPos.some(o=> Math.hypot(o.x-pos.x, o.y-pos.y) < MIN_DIST));
      placedPos.push(pos);
      const x = pos.x, y = pos.y;
      let isTarget=false;
      if(side==='left' && li<targetsLeft){ isTarget=true; li++; }
      else if(side==='right' && ri<targetsRight){ isTarget=true; ri++; }
      let val;
      if(isTarget){ val = targets[Math.floor(Math.random()*targets.length)]; }
      else {
        let tries2=0;
        do{ val = pool[Math.floor(Math.random()*pool.length)]; tries2++; }
        while(targets.some(t=>seqLabel(t)===seqLabel(val)) && tries2<20 && pool.length>targets.length);
      }
      return {x, y, val, isTarget, side, found:false, falseTap:false};
    });
    return items;
  }
  export function buildNeglectBoard(cfg, session){
    if(cfg.neglectMode==='progressiva'){
      const abs = cfg.titrationMode!=='manuale' ? session.liveBoardLevel : cfg.neglectStartLevel;
      const phase = neglectProgressivaPhase(abs).mode;
      if(phase==='intruso') return buildNeglectBoardIntruso(cfg, session);
      if(phase==='regola') return buildNeglectBoardRegola(cfg, session);
      return buildNeglectBoardClassico(cfg, session);
    }
    if(cfg.neglectMode==='intruso') return buildNeglectBoardIntruso(cfg, session);
    if(cfg.neglectMode==='regola') return buildNeglectBoardRegola(cfg, session);
    return buildNeglectBoardClassico(cfg, session);
  }
