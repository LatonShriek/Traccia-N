// Storico a sedute espandibili (passo 9). NUOVO codice: sostituisce l'elenco piatto di registrazioni.
// Ogni seduta (un paziente, un'origine, una fascia di tempo) è un <details> nativo: si apre per vedere gli esercizi
// fatti, e ogni esercizio si apre per vedere i dettagli. Nessuno stato condiviso: riceve i dati e restituisce DOM.
// Le etichette dei punteggi sono le stesse che lo storico mostrava prima (stesso testo), spostate qui.
import { groupSessions } from '../core/session-groups.js';

const pct = x => (x!=null && isFinite(x)) ? Math.round(x*100)+'%' : '—';
export function fmtHM(ts){ return new Date(ts).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}); }
export function fmtDay(ts){ return new Date(ts).toLocaleDateString('it-IT',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}); }
export function fmtDur(ms){
  if(ms==null || !isFinite(ms) || ms<=0) return '—';
  const s = Math.round(ms/1000), m = Math.floor(s/60);
  if(m>=60) return Math.floor(m/60)+'h '+(m%60)+'min';
  return m>0 ? m+' min'+(s%60 ? ' '+(s%60)+' s' : '') : s+' s';
}
export const ORIGIN_LABEL = { presenza:'in presenza', remoto:'da remoto', libero:'esercizi liberi' };

// Punteggio principale di una registrazione (stesso testo dello storico precedente). forPatient: versione semplice per il paziente.
export function performanceOf(r, forPatient){
  const family = r.family || 'signal';
  if(family==='choice') return pct(r.choice && r.choice.accuracy)+' corr.';
  if(family==='dual') return pct(r.metrics.acc)+' vis · '+pct(r.metricsAud.acc)+' ud.';
  if(family==='spatial'){
    const n = r.neglect;
    return n.modalitaConteggio ? pct(n.accuratezzaConteggio)+(forPatient?'':' conteggi esatti') : pct(n.pctLeft)+' sin · '+pct(n.pctRight)+' des';
  }
  if(family==='goaltask') return r.goaltask.percentualeCompletamento+'% completato'+(!forPatient && r.goaltask.violazioniCount ? ' · '+r.goaltask.violazioniCount+' viol.' : '');
  if(family==='memoria') return r.memoria.recuperati+'/'+r.memoria.totale+(forPatient?'':' ('+r.memoria.percentuale+'%)');
  return pct(r.metrics && r.metrics.acc)+(!forPatient && r.metrics && r.metrics.dprime!=null ? ' · d′ '+r.metrics.dprime.toFixed(2) : '');
}

// Righe "etichetta → valore" per il dettaglio di un esercizio. Mostra solo ciò che esiste nella registrazione.
export function detailRowsOf(r, forPatient){
  const rows = [];
  const add = (k,v)=>{ if(v!=null && v!=='' && v!=='—') rows.push([k,v]); };
  add('Inizio – fine', fmtHM(r.ts-(r.durationMs||0))+' – '+fmtHM(r.ts));
  add('Durata', fmtDur(r.durationMs));
  add('Prove', r.trials);
  if(r.finalLevel!=null) add('Livello finale', r.finalLevel);
  const family = r.family || 'signal';
  if(family==='signal' && r.metrics){
    add('Accuratezza', pct(r.metrics.acc));
    add('Risposte corrette ai bersagli', pct(r.metrics.hitRate));
    add('Falsi allarmi', pct(r.metrics.faRate));
    if(!forPatient){ add('d′', r.metrics.dprime!=null ? r.metrics.dprime.toFixed(2) : null); }
    add('Tempo di risposta medio', r.avgRT!=null ? Math.round(r.avgRT)+' ms' : null);
    if(!forPatient){ add('SSRT', r.ssrt!=null ? Math.round(r.ssrt)+' ms' : null); }
    if(r.fatigueNote && r.fatigueNote.flag) add('Calo nel corso della seduta', 'primo terzo '+pct(r.fatigueNote.accFirst)+' → ultimo terzo '+pct(r.fatigueNote.accLast));
  } else if(family==='choice' && r.choice){
    add('Accuratezza', pct(r.choice.accuracy));
    add('Omissioni', r.choice.omitted);
    add('Tempo di risposta medio', r.choice.meanRT!=null ? Math.round(r.choice.meanRT)+' ms' : null);
  } else if(family==='dual'){
    add('Canale visivo', pct(r.metrics.acc));
    add('Canale uditivo', pct(r.metricsAud.acc));
  } else if(family==='spatial' && r.neglect){
    if(r.neglect.modalitaConteggio) add('Conteggi esatti', pct(r.neglect.accuratezzaConteggio));
    else { add('Trovati a sinistra', pct(r.neglect.pctLeft)); add('Trovati a destra', pct(r.neglect.pctRight)); }
  } else if(family==='goaltask' && r.goaltask){
    add('Completamento', r.goaltask.percentualeCompletamento+'%');
    add('Violazioni', r.goaltask.violazioniCount);
  } else if(family==='memoria' && r.memoria){
    add('Ricordati', r.memoria.recuperati+' su '+r.memoria.totale);
  }
  if(r.notes) add('Note', r.notes);
  return rows;
}

// opts: { el, labelOfExercise(r) -> "Esercizio livello N", patientLabelOf(r), forPatient, openFirst }
export function renderSessionGroups(container, items, opts){
  const { el, exerciseLabelOf, patientLabelOf, forPatient } = opts;
  const groups = groupSessions(items, patientLabelOf);
  groups.forEach((g, gi)=>{
    const sum = el('summary',{class:'sess-sum'},[
      el('div',{class:'sess-l1'},[
        el('span',{class:'sess-day'},[fmtDay(g.end)]),
        el('span',{class:'sess-time'},[fmtHM(g.start)+'–'+fmtHM(g.end)]),
        forPatient ? '' : el('span',{class:'chip-o chip-'+g.origin},[ORIGIN_LABEL[g.origin]])
      ]),
      el('div',{class:'sess-l2'},[
        (forPatient || !g.patientLabel ? '' : g.patientLabel+' · ')+g.items.length+(g.items.length===1?' esercizio':' esercizi')+' · '+fmtDur(g.totalMs)
      ])
    ]);
    const body = el('div',{class:'sess-body'},[]);
    g.items.forEach(r=>{
      const rowSum = el('summary',{class:'ex-sum'},[
        el('span',{class:'ex-t'},[fmtHM(r.ts-(r.durationMs||0))]),
        el('span',{class:'ex-n'},[exerciseLabelOf(r)]),
        el('span',{class:'ex-p'},[performanceOf(r, forPatient)])
      ]);
      const dl = el('div',{class:'ex-det'},[]);
      detailRowsOf(r, forPatient).forEach(([k,v])=>{
        dl.appendChild(el('div',{class:'ex-row'},[el('span',{class:'ex-k'},[k]), el('span',{class:'ex-v'},[String(v)])]));
      });
      body.appendChild(el('details',{class:'ex'},[rowSum, dl]));
    });
    const attrs = {class:'sess'};
    if(gi===0) attrs.open = 'open';
    container.appendChild(el('details',attrs,[sum, body]));
  });
  return groups.length;
}
