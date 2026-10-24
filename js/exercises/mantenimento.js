// Mantenimento: tabella di livello e costruzione delle prove.
// SPOSTATE da index.html (passo 5c) senza modifiche al testo, con "export" e le differenze
// dichiarate qui sotto. In index.html restano, dove servono, funzioni da una riga con lo
// stesso nome che chiamano queste con la cfg (e la seduta) correnti.
// - buildMantenimento riceve cfg come parametro invece di leggere la variabile dell'app.
// - ADAPT_MANTENIMENTO (prima in cima a index.html) vive qui: era usata solo da buildMantenimento.
import { POOLS } from '../core/pools.js';

  // Livello -> {modalita, listLen}: 1-5 Riconoscimento (lista 2..6), 6-10
  // Riconoscimento seriale (insieme fisso 3..7, sonde ripetute — vedi
  // buildMantenimento). Il salto 5->6 è un cambio di MODALITÀ, non solo di
  // difficoltà — dichiarato così di proposito, non un'unica scala
  // "facile -> difficile" continua (vedi discussione sul perché mescolare
  // le due modalità in un'unica scala rischierebbe di far scivolare il
  // costrutto verso l'aggiornamento continuo tipo n-back, che è deliberatamente
  // un dominio diverso da questo — mantenimento, non updating).
  export const ADAPT_MANTENIMENTO = {
    1:{modalita:'riconoscimento', listLen:2}, 2:{modalita:'riconoscimento', listLen:3},
    3:{modalita:'riconoscimento', listLen:4}, 4:{modalita:'riconoscimento', listLen:5},
    5:{modalita:'riconoscimento', listLen:6},
    6:{modalita:'seriale', listLen:3, probes:8}, 7:{modalita:'seriale', listLen:4, probes:11},
    8:{modalita:'seriale', listLen:5, probes:14}, 9:{modalita:'seriale', listLen:6, probes:17},
    10:{modalita:'seriale', listLen:7, probes:20}
  };
  // ---------- Mantenimento (tipo Sternberg) ----------
  // Ogni "prova" per lo scoring/il report è la SONDA (correctAnswer 'a'=era
  // nella lista, 'b'=non c'era) — resolveChoice/registerTap non cambiano,
  // riusano lo stesso schema a 2 scelte del resto dell'app. La novità è
  // encodeItems: una lista da mostrare in sequenza PRIMA della sonda,
  // gestita da un piccolo stato aggiuntivo in nextTrial() (fase 'encode').
  // Riconoscimento: encodeItems nuovi a ogni prova (skipEncode sempre
  // false). Seriale: lo stesso encodeItems per tutte le prove della
  // sessione (un solo insieme, stabilito una volta) — la sequenza lo
  // mostra per intero solo alla prima prova (skipEncode false), le prove
  // successive la saltano (skipEncode true, il set è già stato mostrato e
  // resta lo stesso): non una seconda architettura, la stessa funzione,
  // solo con lo stesso encodeItems ripetuto e un flag che dice se serve
  // ri-mostrarlo.
  export function buildMantenimento(cfg){
    const params = cfg.titrationMode!=='manuale' ? (ADAPT_MANTENIMENTO[cfg.adaptStartLevel]||ADAPT_MANTENIMENTO[1]) : null;
    const modalita = params ? params.modalita : cfg.mantenimentoModalita;
    const listLen = params ? params.listLen : (cfg.mantenimentoListLen || 4);
    const pool = cfg.mantenimentoMateriale==='numeri' ? POOLS.numeri.slice(0,9) : cfg.mantenimentoMateriale==='simboli' ? POOLS.simboli : POOLS.lettere;
    function drawList(n){
      const shuffled = pool.slice().sort(()=>Math.random()-0.5);
      return shuffled.slice(0, n);
    }
    const seq = [];
    if(modalita==='seriale'){
      const fixedSet = drawList(listLen);
      const numProbes = (params && params.probes) || cfg.trials;
      cfg.trials = numProbes; // il numero di sonde è deciso dal livello (o da cfg.trials stesso in manuale), non un valore fisso: allinea il contatore "prova X/Y" e la fine sessione a quanto viene generato davvero
      for(let i=0;i<numProbes;i++){
        // Metà delle sonde (circa) appartengono all'insieme, metà no —
        // stesso principio dei bersagli/non bersagli altrove nell'app, non
        // puramente casuale prova per prova (vedi discussione sul rischio
        // di sequenze sbilanciate su blocchi brevi): qui il conteggio è
        // fissato in anticipo (metà/metà, con arrotondamento), solo
        // l'ordine è mescolato.
        const isMember = i < Math.round(numProbes/2);
        seq.push(null); // placeholder, riempito sotto dopo lo shuffle dell'ordine
        seq[i] = {isMember};
      }
      seq.sort(()=>Math.random()-0.5);
      const outsidePool = pool.filter(x=> !fixedSet.includes(x));
      seq.forEach((t,i)=>{
        const probeVal = t.isMember ? fixedSet[Math.floor(Math.random()*fixedSet.length)] : outsidePool[Math.floor(Math.random()*outsidePool.length)];
        seq[i] = {encodeItems: fixedSet, skipEncode: i>0, val:probeVal, correctAnswer: t.isMember?'a':'b', isTarget: t.isMember, valid:true};
      });
    } else {
      for(let i=0;i<cfg.trials;i++){
        const list = drawList(listLen);
        const isMember = Math.random()<0.5;
        const outsidePool = pool.filter(x=> !list.includes(x));
        const probeVal = isMember ? list[Math.floor(Math.random()*list.length)] : outsidePool[Math.floor(Math.random()*outsidePool.length)];
        seq.push({encodeItems:list, skipEncode:false, val:probeVal, correctAnswer: isMember?'a':'b', isTarget:isMember, valid:true});
      }
    }
    return seq;
  }
