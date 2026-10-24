// js/core/rci.js — Reliable Change Index (RCI): costanti, metrica primaria per esercizio,
// controllo di comparabilità fra sessioni di baseline e finali, calcolo delle righe.
// Funzioni pure (nessun accesso a DOM/window), spostate da index.html.
//
// UNICA differenza di codice rispetto all'originale: computeRCIRows(items, exercises)
// riceve la tabella EXERCISES come parametro (prima la leggeva dal contesto globale
// dello script); serve solo per l'etichetta leggibile dell'esercizio (exLabel).

import { mean, sd } from './stats.js';
import { isTapatKey } from './records.js';

// ---------- Reliable Change Index (RCI) — solo per l'export operatore ----------
// Stima ogni sessione rispetto alla BASELINE del singolo paziente su quello
// stesso esercizio (le prime N sessioni disponibili), non contro un campione
// normativo esterno (che non abbiamo). Valori di affidabilità test-retest
// sono stime prudenti di default: se hai valori più precisi dalla letteratura
// per un dato paradigma, si possono correggere qui.
export const RCI_BASELINE_N = 3; // numero di sessioni iniziali usate come baseline
export const RCI_RELIABILITY = {
  nback:0.75, sequenza:0.70, gonogo:0.70, stopsignal:0.75,
  ant:0.70, switching:0.70, dualtask:0.65, neglect:0.70
};
// Restituisce {value, higherIsBetter} — la metrica principale per la riga,
// oppure null se quell'esercizio/famiglia non ha una metrica adatta.
export function rciPrimaryMetric(r){
  const family = r.family || 'signal';
  if(r.taskMode==='stopsignal') return (r.ssrt!=null) ? {value:r.ssrt, higherIsBetter:false} : null;
  if(family==='signal'){
    if(r.metrics && r.metrics.dprime!=null) return {value:r.metrics.dprime, higherIsBetter:true};
    if(r.metrics && r.metrics.acc!=null) return {value:r.metrics.acc, higherIsBetter:true};
    return null;
  }
  if(family==='choice'){
    if(r.choice && r.choice.total) return {value:r.choice.correct/r.choice.total, higherIsBetter:true};
    return null;
  }
  if(family==='dual'){
    const vals = [];
    if(r.metrics && r.metrics.acc!=null) vals.push(r.metrics.acc);
    if(r.metricsAud && r.metricsAud.acc!=null) vals.push(r.metricsAud.acc);
    if(!vals.length) return null;
    return {value: vals.reduce((a,b)=>a+b,0)/vals.length, higherIsBetter:true};
  }
  if(family==='spatial'){
    // 'Conteggio a regola': niente asimmetria misurabile con un unico
    // numero riportato (vedi nota sopra) — l'RCI per queste sedute usa
    // invece l'accuratezza del conteggio, una misura scalare pulita come
    // quella già usata per le famiglie 'choice'/'signal', non un
    // ripiego di fortuna.
    if(r.neglect && r.neglect.modalitaConteggio) return (r.neglect.accuratezzaConteggio!=null) ? {value:r.neglect.accuratezzaConteggio, higherIsBetter:true} : null;
    if(r.neglect && r.neglect.asymmetry!=null) return {value:Math.abs(r.neglect.asymmetry), higherIsBetter:false};
    return null;
  }
  return null;
}
// items: elenco di sessioni di UN SOLO paziente (già filtrate da chi chiama).
// Confronta la media delle prime sessioni (baseline) con la media delle
// ultime sessioni disponibili al momento in cui lo generi — non sessione
// per sessione: è pensato per essere lanciato quando si vuole valutare
// l'esito di una fase di trattamento, non ad ogni singolo export.
// Calcolo condiviso fra l'export CSV e il report stampabile: entrambi
// devono mostrare esattamente le stesse righe con la stessa logica, quindi
// il calcolo vive qui una sola volta.
// Confronta i parametri usati nelle sessioni di baseline con quelli delle
// sessioni finali incluse nel confronto RCI — un cambiamento di
// accuratezza fra condizioni diverse (livello, ISI, frequenza, modalità
// di titolazione) misura quanto è cambiato IL COMPITO, non quanto è
// cambiato il paziente, e userebbe la formula di Crawford & Howell fuori
// dalla sua assunzione di fondo (stessa misura, stesse condizioni).
// Risposta diretta a una domanda di Rodrigo: confrontare il livello 1
// con il livello 10 dello stesso esercizio ha ESATTAMENTE lo stesso
// problema di un ISI diverso fra le due sedute — coperto dallo stesso
// controllo, sul campo finalLevel salvato per ogni sessione, non da un
// meccanismo a parte.
export function sessionMismatchWarnings(baselineItems, finalItems){
  const warnings = [];
  function numField(getter){
    const b = baselineItems.map(x=>getter(x.r)).filter(v=>v!=null && !isNaN(v));
    const f = finalItems.map(x=>getter(x.r)).filter(v=>v!=null && !isNaN(v));
    if(!b.length || !f.length) return null; // dato non registrato per una delle due parti (es. sessioni storiche precedenti a questa consegna) — non verificabile, non si dichiara comparabile per default
    return {mb: mean(b), mf: mean(f)};
  }
  const isi = numField(r=>r.isi);
  if(isi && isi.mb>0 && Math.abs(isi.mf-isi.mb)/isi.mb > 0.15){
    warnings.push('ISI diverso fra baseline ('+Math.round(isi.mb)+'ms) e punto finale ('+Math.round(isi.mf)+'ms)');
  }
  const lvl = numField(r=> typeof r.finalLevel==='number' ? r.finalLevel : null);
  if(lvl && Math.abs(lvl.mf-lvl.mb) >= 2){
    warnings.push('livello diverso fra baseline (~'+lvl.mb.toFixed(1)+') e punto finale (~'+lvl.mf.toFixed(1)+')');
  }
  const trials = numField(r=>r.trials);
  if(trials && trials.mb>0 && Math.abs(trials.mf-trials.mb)/trials.mb > 0.20){
    warnings.push('numero di prove diverso fra baseline ('+Math.round(trials.mb)+') e punto finale ('+Math.round(trials.mf)+')');
  }
  const rate = numField(r=>r.targetRate);
  if(rate && Math.abs(rate.mf-rate.mb) > 0.05){
    warnings.push('frequenza bersaglio/no-go diversa fra baseline ('+Math.round(rate.mb*100)+'%) e punto finale ('+Math.round(rate.mf*100)+'%)');
  }
  const modesB = new Set(baselineItems.map(x=>x.r.titrationMode).filter(Boolean));
  const modesF = new Set(finalItems.map(x=>x.r.titrationMode).filter(Boolean));
  if(modesB.size && modesF.size && (![...modesB].every(m=>modesF.has(m)) || ![...modesF].every(m=>modesB.has(m)))){
    warnings.push('modalità di titolazione diversa fra baseline ('+[...modesB].join('/')+') e punto finale ('+[...modesF].join('/')+')');
  }
  return warnings;
}
export function computeRCIRows(items, exercises){
  const groups = {};
  items.forEach(r=>{
    const metric = rciPrimaryMetric(r);
    if(!metric) return;
    const key = isTapatKey(r);
    if(!groups[key]) groups[key] = [];
    groups[key].push({r, metric});
  });
  const rows = [];
  Object.keys(groups).forEach(taskMode=>{
    const list = groups[taskMode];
    list.sort((a,b)=> a.r.ts - b.r.ts);
    const n = list.length;
    if(n < 4) return; // troppo poche sessioni per separare baseline e punto finale in modo sensato
    const half = Math.min(RCI_BASELINE_N, Math.floor(n/2));
    const baselineItems = list.slice(0, half), finalItems = list.slice(n-half);
    const baselineVals = baselineItems.map(x=>x.metric.value);
    const finalVals = finalItems.map(x=>x.metric.value);
    const higherIsBetter = list[0].metric.higherIsBetter;
    const baselineMean = mean(baselineVals), finalMean = mean(finalVals);
    const baselineSD = sd(baselineVals);
    const rawReliability = RCI_RELIABILITY[taskMode] != null ? RCI_RELIABILITY[taskMode] : 0.70;
    // Correzione di Spearman-Brown: baseline e punto finale non sono una
    // singola misurazione ciascuno, sono già la media di 'half' sedute (2
    // o 3, a seconda di quante sedute totali sono disponibili per questo
    // paziente/esercizio) — una media è più affidabile di una singola
    // seduta, e va trattata come tale. Usare il coefficiente di
    // affidabilità di una singola seduta quando si sta in realtà
    // confrontando due medie rendeva il test sistematicamente più
    // conservativo del dovuto (una differenza reale aveva meno probabilità
    // di essere segnalata come significativa di quanto sarebbe corretto),
    // mai nella direzione opposta — non è un allentamento arbitrario del
    // criterio, è smettere di sottostimare l'affidabilità reale della
    // misura. reliability_k = k·r / (1 + (k-1)·r); con k=half=1 (caso
    // limite, non dovrebbe presentarsi dato il minimo di 4 sessioni sopra)
    // la formula si riduce identicamente al coefficiente originale.
    const reliability = (half*rawReliability) / (1 + (half-1)*rawReliability);
    if(!baselineSD) return;
    const seDiff = baselineSD * Math.sqrt(2*(1-reliability));
    if(!seDiff) return;
    let rci = (finalMean - baselineMean) / seDiff;
    if(!higherIsBetter) rci = -rci;
    const exLabel = exercises[taskMode] ? exercises[taskMode].label : taskMode;
    // Il controllo di comparabilità viene DOPO il calcolo, non prima: si
    // vuole sempre poter mostrare le medie grezze (baseline/finale) anche
    // quando il confronto non è valido — solo il numero RCI viene
    // soppresso (null), mai le due medie, che restano dati legittimi da
    // guardare per quello che sono anche senza un indice sintetico sopra.
    const warnings = sessionMismatchWarnings(baselineItems, finalItems);
    rows.push({
      exLabel, n, half, baselineMean, finalMean,
      rci: warnings.length ? null : rci,
      comparable: !warnings.length,
      warnings,
      significativo: warnings.length ? false : Math.abs(rci)>=1.96
    });
  });
  return rows;
}
