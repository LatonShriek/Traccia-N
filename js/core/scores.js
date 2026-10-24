// Punteggi: stime EZ-diffusion, LISAS, accuratezza primaria di una seduta e
// riepilogo per esercizio. SPOSTATI da index.html senza modifiche al testo
// (passo 3b), con la sola aggiunta di "export" e UNA differenza dichiarata:
// computeExerciseTimeSummary(items, EXERCISES, EXERCISE_GROUPS) riceve
// EXERCISES e EXERCISE_GROUPS come parametri (prima erano variabili
// dell'app), come computeRCIRows in rci.js.
import { mean, sd } from './stats.js';
import { isTapatKey } from './records.js';

  // EZ-diffusion (Wagenmakers, van der Maas & Grasman, 2007, Psychonomic
  // Bulletin & Review, 14(1), 3-22) — da tre statistiche riassuntive di UNA
  // sessione/condizione (accuratezza, media e varianza dei RT delle sole
  // prove corrette, in SECONDI) stima a formula chiusa i tre parametri del
  // modello a diffusione: v (tasso di deriva — l'abilità pura, ripulita
  // dalla cautela), a (separazione della soglia — quanto la persona è
  // stata cauta), Ter (tempo non-decisionale — percezione+esecuzione
  // motoria). s=0.1 è il parametro di scala convenzionale del modello (non
  // altrimenti identificabile, fissato per convenzione nell'articolo
  // originale). correction: stesso principio del correttivo log-lineare
  // di Hautus (1995) già usato sopra per d′ — evita i casi degeneri
  // Pc=0/Pc=1 usando (corrette+0.5)/(totale+1) invece del valore grezzo.
  // Pc=0.5 esatto resta comunque un caso limite non risolto da quella sola
  // correzione (possibile con pochi trial e un numero pari di risposte) —
  // va scostato di un epsilon fisso per evitare una divisione per zero
  // nel calcolo di 'a', altrimenti resta indefinito, non un errore vero.
  export function computeEZDiffusion(nCorrect, nTotal, meanRTsec, varRTsec){
    if(nTotal<1 || meanRTsec==null || varRTsec==null || varRTsec<=0) return null;
    let Pc = (nCorrect+0.5)/(nTotal+1);
    if(Math.abs(Pc-0.5)<1e-6) Pc += 1e-4;
    const s = 0.1, s2 = s*s;
    const L = Math.log(Pc/(1-Pc));
    const x = L*(L*Pc*Pc - L*Pc + Pc - 0.5)/varRTsec;
    if(x<=0) return null; // discriminabilità nulla o negativa — non stimabile in modo sensato
    const v = Math.sign(Pc-0.5) * s * Math.pow(x, 0.25);
    if(v===0) return null;
    const a = s2*L/v;
    const y = -v*a/s2;
    const MDT = (a/(2*v)) * (1-Math.exp(y))/(1+Math.exp(y));
    const Ter = meanRTsec - MDT;
    return {v, a, Ter};
  }
  // LISAS (Linear Integrated Speed-Accuracy Score — Vandierendonck, 2017,
  // Behavior Research Methods, 49(2), 653-673; 2018, Journal of Cognition,
  // 1(1), 6) — porta tasso d'errore e RT sulla stessa scala (dividendo per
  // le rispettive deviazioni standard CALCOLATE DENTRO QUESTA STESSA
  // sessione, non su un campione normativo esterno) e li somma. Risultato
  // in millisecondi: più alto = prestazione peggiore (più lento e/o meno
  // preciso), utilizzabile anche con una sola sessione di una sola persona.
  // rtsCorrectMs: RT (ms) delle sole prove corrette. correctFlags: booleano
  // corretto/scorretto di OGNI prova (comprese quelle senza RT, es. omesse).
  export function computeLISAS(rtsCorrectMs, correctFlags){
    if(!correctFlags.length) return null;
    const errRate = correctFlags.filter(c=>!c).length/correctFlags.length;
    if(errRate===0) return rtsCorrectMs.length ? mean(rtsCorrectMs) : null; // nessun errore da penalizzare
    if(!rtsCorrectMs.length) return null; // tutte le prove sbagliate: nessun RT corretto da cui partire
    const errIndicator = correctFlags.map(c=>c?0:1);
    const sdErr = sd(errIndicator);
    const sdRT = sd(rtsCorrectMs);
    if(!sdErr || sdErr===0 || sdRT==null) return mean(rtsCorrectMs); // nessuna variabilità nell'errore da cui scalare — resta il solo RT medio
    return mean(rtsCorrectMs) + (sdRT/sdErr)*errRate;
  }
  // Estrae un valore 0-1 assimilabile ad "accuratezza" dalla sessione appena
  // conclusa, da usare per rendere il progresso verso l'obiettivo più sfumato
  // (vedi computeLevelGoalProgress) — non per l'RCI, che ha la propria logica.
  export function primaryAccuracyOf(rec){
    const family = rec.family || 'signal';
    if((family==='signal' || family==='dual') && rec.metrics && rec.metrics.acc!=null) return rec.metrics.acc;
    if(family==='choice' && rec.choice && rec.choice.total) return rec.choice.correct/rec.choice.total;
    if(family==='spatial' && rec.neglect && rec.neglect.modalitaConteggio) return rec.neglect.accuratezzaConteggio;
    if(family==='spatial' && rec.neglect && rec.neglect.pctLeft!=null && rec.neglect.pctRight!=null) return (rec.neglect.pctLeft+rec.neglect.pctRight)/2;
    // Media fra le due misure (posizione + contenuto) — una sola cifra per
    // il riepilogo/lo screening, che per costruzione non possono usarne
    // due separate. Il dettaglio delle due resta comunque in rec.span,
    // leggibile per intero da chi vuole guardarle separate.
    if(family==='span' && rec.span && rec.span.posAccMean!=null && rec.span.contentAccMean!=null) return (rec.span.posAccMean+rec.span.contentAccMean)/2;
    return null;
  }
  // Riepilogo per paziente, aggregato per esercizio — tempo totale
  // allenato, sedute fatte, livello raggiunto, percentuale di successo
  // media. Il dato grezzo esiste già per ogni singola sessione (durata,
  // finalLevel, la stessa accuratezza usata da primaryAccuracyOf sopra):
  // qui si aggrega, non si raccoglie nulla di nuovo. items = TUTTE le
  // sessioni di UN SOLO paziente (in presenza + remoto insieme, già
  // filtrate da chi chiama — vedi ScreenHistory), non serve distinguere
  // qui la provenienza.
  export function computeExerciseTimeSummary(items, EXERCISES, EXERCISE_GROUPS){
    const groups = {};
    items.forEach(r=>{
      const key = isTapatKey(r);
      if(!EXERCISES[key]) return; // record di un esercizio non più esistente/rinominato: ignorato, non fatto fallire il riepilogo
      if(!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    // Ordine coerente con la vetrina dell'app (EXERCISE_GROUPS), non
    // l'ordine casuale in cui compaiono le chiavi nell'oggetto — stesso
    // principio già seguito dal selettore Setup.
    const orderedKeys = EXERCISE_GROUPS.flatMap(g=>g.keys).filter(k=>groups[k]);
    return orderedKeys.map(key=>{
      const list = groups[key].slice().sort((a,b)=>a.ts-b.ts);
      const n = list.length;
      const tempoTotaleMs = list.reduce((s,r)=> s+(r.durationMs||0), 0);
      const last = list[n-1];
      const livelloRaggiunto = last && last.finalLevel!=null ? last.finalLevel
        : (last && key==='nback' && last.nLevel!=null) ? last.nLevel : null;
      const accVals = list.map(primaryAccuracyOf).filter(v=>v!=null);
      const successoMedio = accVals.length ? mean(accVals) : null;
      return {
        key, label: EXERCISES[key].label, n,
        tempoTotaleMs, livelloRaggiunto, successoMedio,
        ultimaSeduta: last ? last.dateLabel : null
      };
    });
  }
