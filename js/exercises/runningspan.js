// Running Span: livelli, generazione del ciclo, punteggio e adattamento.
// SPOSTATE da index.html (passo 5b) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html resta una funzione da una riga con lo stesso nome
// che chiama questa con la cfg e la seduta correnti.
// - genRunningSpanTrial riceve cfg; maybeAdaptRunningSpan riceve cfg e session come parametri invece di leggere le variabili dell'app.
// - maybeAdaptRunningSpan applica adaptStep (js/core/adapt.js) con gli stessi limiti 1-10 di prima (modifica del passo 3c).
import { POOLS } from '../core/pools.js';
import { mean } from '../core/stats.js';
import { adaptStep } from '../core/adapt.js';

  // Running Span — n da richiamare (il "carico" del livello) e intervallo
  // di lunghezza totale della sequenza (sconosciuta al paziente, sorteggiata
  // a ogni prova dentro l'intervallo del livello). Tetto a n=4, non 5 come
  // nella proposta iniziale — stessa cautela già usata per N-back (mai
  // oltre n=2-3), qui un poco più alta perché il richiamo è a fine
  // sequenza, non un giudizio continuo, ma resta un'ipotesi di partenza,
  // non un valore di letteratura.
  export const RUNNINGSPAN_LEVELS = {
    1:{n:2, seqMin:3, seqMax:4, isi:1800}, 2:{n:2, seqMin:4, seqMax:5, isi:1800},
    3:{n:3, seqMin:4, seqMax:6, isi:1600}, 4:{n:3, seqMin:5, seqMax:7, isi:1500}, 5:{n:3, seqMin:6, seqMax:9, isi:1400},
    6:{n:4, seqMin:6, seqMax:8, isi:1400}, 7:{n:4, seqMin:7, seqMax:10, isi:1300}, 8:{n:4, seqMin:8, seqMax:12, isi:1200},
    9:{n:4, seqMin:9, seqMax:13, isi:1100}, 10:{n:4, seqMin:10, seqMax:14, isi:1000}
  };
  // ---------- Running Span ----------
  // Ogni "prova" qui è un intero ciclo sequenza+richiamo, non un singolo
  // stimolo — motivo per cui, come neglect/goaltask/memoria, ha una
  // schermata dedicata invece di incastrarsi nel flusso generico a un
  // tocco per stimolo. session.trials è pre-costruito da
  // buildRunningSpanTrials() con la lunghezza totale di ciascuna sequenza
  // già sorteggiata — mai nota al paziente in anticipo, quello è il punto
  // del costrutto (Bunting, Cowan & Saults, 2006).
  // Genera UN ciclo alla volta, non tutti insieme all'inizio — a
  // differenza della prima versione. Necessario per l'adattivo: se i cicli
  // fossero tutti pre-costruiti all'avvio, cambiare cfg.adaptStartLevel a
  // metà seduta non avrebbe alcun effetto sui cicli successivi (erano già
  // tutti fissati sul livello di partenza). Stesso principio già in uso
  // per N-back/Go-No-Go (genNbackTrial/genGoNoGoTrial), non un'invenzione
  // nuova per questo esercizio.
  export function genRunningSpanTrial(cfg){
    const lvl = RUNNINGSPAN_LEVELS[cfg.adaptStartLevel] || RUNNINGSPAN_LEVELS[1];
    const pool = POOLS[cfg.stimType];
    const totalLen = lvl.seqMin + Math.floor(Math.random()*(lvl.seqMax-lvl.seqMin+1));
    const items = [];
    for(let j=0;j<totalLen;j++) items.push(pool[Math.floor(Math.random()*pool.length)]);
    return { items, n: lvl.n, isi: lvl.isi };
  }
  // Confronto per valore, non per riferimento — necessario per colori
  // (oggetti con .hex) e suoni (oggetti con .f), non solo lettere/numeri/
  // simboli (stringhe, dove === già basterebbe).
  export function runningSpanItemsEqual(a,b){
    if(a==null || b==null) return false;
    if(typeof a==='object') return (a.hex!=null && a.hex===b.hex) || (a.f!=null && a.f===b.f);
    return a===b;
  }
  // Pura, testabile a sé: dato l'insieme mostrato e la risposta data,
  // restituisce le due misure. Separata da resolveRunningSpanTrial (che
  // legge/scrive session) apposta perché è la parte con più da sbagliare
  // silenziosamente — la stessa ragione per cui altrove in questo
  // progetto la logica di punteggio è sempre tenuta a parte dal flusso a
  // schermo.
  export function scoreRunningSpanTrial(trial, given){
    const actual = trial.items.slice(-trial.n); // ultimi n, nell'ordine di comparsa
    let posCorrect = 0;
    for(let i=0;i<trial.n;i++){ if(runningSpanItemsEqual(given[i], actual[i])) posCorrect++; }
    // Accuratezza di contenuto: quanti degli n richiesti sono presenti da
    // qualche parte nella risposta, indipendentemente dalla posizione —
    // dissocia memoria per il contenuto da memoria per l'ordine (Henson,
    // 1998, Quarterly Journal of Experimental Psychology).
    const remaining = actual.slice();
    let contentCorrect = 0;
    given.forEach(g=>{
      const idx = remaining.findIndex(a=>runningSpanItemsEqual(a,g));
      if(idx!==-1){ contentCorrect++; remaining.splice(idx,1); }
    });
    return { posAcc: posCorrect/trial.n, contentAcc: contentCorrect/trial.n, n: trial.n, seqLen: trial.items.length };
  }
  // Finestra più corta della soglia standard (BLOCK=8 in maybeAdapt): un
  // ciclo qui porta molta più informazione di un singolo trial altrove
  // (un'intera sequenza+richiamo, non una sola risposta), quindi bastano
  // meno cicli per una lettura stabile. Stesse soglie 85%/70% (Wilson et
  // al.) applicate però alla MEDIA di due proporzioni (posAcc+contentAcc),
  // non a una proporzione di booleani come fa maybeAdapt() — incompatibile
  // con quella funzione, richiede questa a parte.
  export const RUNNINGSPAN_ADAPT_BLOCK = 4;
  export function maybeAdaptRunningSpan(cfg, session){
    if(!cfg.adaptive) return;
    if(session.rsAdaptBlock.length < RUNNINGSPAN_ADAPT_BLOCK) return;
    const meanScore = mean(session.rsAdaptBlock);
    cfg.adaptStartLevel += adaptStep(meanScore, cfg.adaptStartLevel, 1, 10);
    session.rsAdaptBlock = [];
  }
