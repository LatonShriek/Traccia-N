// Export dei dati: testo del CSV delle sedute e pagina HTML del report RCI.
// SPOSTATO da index.html (passo 5j) senza modifiche al testo, con "export" davanti ai nomi usati altrove.
// Differenze dichiarate: buildCSV(items) è il corpo di exportCSV fino al testo del CSV (restituito); il download
// (Blob e link) resta in exportCSV. buildRCIReportHtml(rows, patientLabel, dateLabel) è la parte di printRCIReport
// che compone l'HTML (`esc(todayStr())` diventa `esc(dateLabel)`); computeRCIRows, gli avvisi e window.open restano in index.html.
import { STIM_LABELS, EXERCISES } from './registry.js';
import { MEMORIA_MODO_LABELS } from './memoria.js';
import { RCI_BASELINE_N } from '../core/rci.js';

  export function buildCSV(items){
    const head = ['data','codice_paziente','stimolo','esercizio','n_back','sequenza_bersaglio','prove','isi_ms','durata_stim_ms','modalita',
      'hit','miss','falsi_allarmi','rifiuti_corretti','accuratezza','dprime','rt_medio_ms','ssrt_ms',
      'doppio_compito_accoppiamento','acc_canale2','dprime_canale2','risposte_corrette','risposte_omesse','indice_allerta','indice_orienting','indice_conflitto','switch_cost',
      'neglect_pct_sinistra','neglect_pct_destra','neglect_omessi_sin','neglect_omessi_des','neglect_asimmetria','neglect_falsi_allarmi',
      'goaltask_scenario','goaltask_livello','goaltask_completati','goaltask_totale','goaltask_percentuale','goaltask_violazioni','goaltask_tempo_sec','goaltask_budget_rispettato',
      'memoria_modo','memoria_livello','memoria_forma','memoria_recuperati','memoria_totale','memoria_percentuale','calo_intra_sessione',
      'neglect_conteggio_accuratezza','neglect_conteggio_errore_medio','note','switch_cost_relativo','switch_acc_ripetizione','switch_acc_switch',
      'stopsignal_interferenza_conflitto_ms','stopsignal_interferenza_acc_congruente','stopsignal_interferenza_acc_incongruente',
      'runningspan_n','runningspan_acc_posizione','runningspan_acc_contenuto','runningspan_lunghezza_media'];
    const rows = items.map(r=>{
      const family = r.family || 'signal'; // record salvati prima di questa versione
      const exLabel = EXERCISES[r.taskMode] ? EXERCISES[r.taskMode].label : (r.taskMode==='sequenza'?'sequenza':'n-back');
      return [
        r.dateLabel, r.patientCode||'', (r.taskMode==='sequenza' && r.sequenzaMista ? 'Mista' : (STIM_LABELS[r.stimType]||'')), exLabel,
        r.taskMode==='nback'?r.nLevel:(r.finalLevel!=null?r.finalLevel:''), (r.targetSeq||[]).join('-'),
        r.trials, r.isi, r.stimDuration, r.respMode,
        family==='signal'||family==='dual' ? r.counts.hits : '',
        family==='signal'||family==='dual' ? r.counts.misses : '',
        family==='signal'||family==='dual' ? r.counts.falseAlarms : '',
        family==='signal'||family==='dual' ? r.counts.correctRejections : '',
        (family==='signal'||family==='dual') && r.metrics.acc!=null ? (r.metrics.acc*100).toFixed(1)+'%':'',
        (family==='signal'||family==='dual') && r.metrics.dprime!=null ? r.metrics.dprime.toFixed(2):'',
        family==='signal' && r.avgRT!=null ? Math.round(r.avgRT):'',
        family==='signal' && r.ssrt!=null ? Math.round(r.ssrt):'',
        family==='dual' ? (r.dualPairing||'vis-aud') : '',
        family==='dual' && r.metricsAud.acc!=null ? (r.metricsAud.acc*100).toFixed(1)+'%':'',
        family==='dual' && r.metricsAud.dprime!=null ? r.metricsAud.dprime.toFixed(2):'',
        family==='choice' ? r.choice.correct+'/'+r.choice.total : '',
        family==='choice' ? r.choice.omitted : '',
        family==='choice' && r.choice.alerting!=null ? r.choice.alerting : '',
        family==='choice' && r.choice.orienting!=null ? r.choice.orienting : '',
        family==='choice' && r.choice.conflict!=null ? r.choice.conflict : '',
        family==='choice' && r.choice.switchCost!=null ? r.choice.switchCost : '',
        family==='spatial' && r.neglect.pctLeft!=null ? (r.neglect.pctLeft*100).toFixed(1)+'%':'',
        family==='spatial' && r.neglect.pctRight!=null ? (r.neglect.pctRight*100).toFixed(1)+'%':'',
        family==='spatial' && r.neglect.omittedLeft!=null ? r.neglect.omittedLeft : '',
        family==='spatial' && r.neglect.omittedRight!=null ? r.neglect.omittedRight : '',
        family==='spatial' && r.neglect.asymmetry!=null ? r.neglect.asymmetry : '',
        family==='spatial' && r.neglect.falseAlarms!=null ? r.neglect.falseAlarms : '',
        family==='goaltask' ? r.goaltask.scenarioLabel : '',
        family==='goaltask' ? r.goaltask.livello : '',
        family==='goaltask' ? r.goaltask.completatiCount : '',
        family==='goaltask' ? r.goaltask.totaleElementi : '',
        family==='goaltask' ? r.goaltask.percentualeCompletamento+'%' : '',
        family==='goaltask' ? r.goaltask.violazioniCount : '',
        family==='goaltask' ? r.goaltask.tempoImpiegatoSec : '',
        family==='goaltask' && r.goaltask.budgetSecondi ? (r.goaltask.budgetRispettato?'Sì':'No') : '',
        family==='memoria' ? MEMORIA_MODO_LABELS[r.memoria.modo] : '',
        family==='memoria' ? r.memoria.livello : '',
        family==='memoria' ? (r.memoria.formaLettera||'') : '',
        family==='memoria' ? r.memoria.recuperati : '',
        family==='memoria' ? r.memoria.totale : '',
        family==='memoria' ? r.memoria.percentuale+'%' : '',
        r.fatigueNote ? (r.fatigueNote.flag?'Sì':'No')+' ('+(r.fatigueNote.accFirst*100).toFixed(0)+'%→'+(r.fatigueNote.accLast*100).toFixed(0)+'%)' : '',
        family==='spatial' && r.neglect.modalitaConteggio && r.neglect.accuratezzaConteggio!=null ? (r.neglect.accuratezzaConteggio*100).toFixed(1)+'%' : '',
        family==='spatial' && r.neglect.modalitaConteggio && r.neglect.erroreAssolutoMedio!=null ? r.neglect.erroreAssolutoMedio.toFixed(2) : '',
        (r.notes||'').replace(/[\n,]/g,' '),
        family==='choice' && r.choice.switchCostRelative!=null ? (r.choice.switchCostRelative*100).toFixed(1)+'%' : '',
        family==='choice' && r.choice.repAcc!=null ? (r.choice.repAcc*100).toFixed(1)+'%' : '',
        family==='choice' && r.choice.switchAcc!=null ? (r.choice.switchAcc*100).toFixed(1)+'%' : '',
        r.taskMode==='stopsignal' && r.conflict!=null ? r.conflict : '',
        r.taskMode==='stopsignal' && r.congAccuracy!=null ? (r.congAccuracy*100).toFixed(1)+'%' : '',
        r.taskMode==='stopsignal' && r.incongAccuracy!=null ? (r.incongAccuracy*100).toFixed(1)+'%' : '',
        family==='span' ? r.span.n : '',
        family==='span' && r.span.posAccMean!=null ? (r.span.posAccMean*100).toFixed(1)+'%' : '',
        family==='span' && r.span.contentAccMean!=null ? (r.span.contentAccMean*100).toFixed(1)+'%' : '',
        family==='span' && r.span.seqLenMean!=null ? r.span.seqLenMean.toFixed(1) : ''
      ];
    });
    const csv = [head.join(';')].concat(rows.map(r=>r.join(';'))).join('\n');
    return csv;
  }

  export function buildRCIReportHtml(rows, patientLabel, dateLabel){
    const esc = (s)=> String(s).replace(/[&<>]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    const rowsHtml = rows.map(r=>
      '<tr><td>'+esc(r.exLabel)+'</td><td>'+r.n+'</td><td>'+r.half+'</td>'
      +'<td>'+r.baselineMean.toFixed(2)+'</td><td>'+r.finalMean.toFixed(2)+'</td>'
      +(r.comparable
        ? '<td>'+r.rci.toFixed(2)+'</td><td class="'+(r.significativo?'sig-yes':'sig-no')+'">'+(r.significativo?'Sì':'No')+'</td>'
        : '<td colspan="2" class="not-comparable">Confronto non disponibile — '+esc(r.warnings.join('; '))+'</td>')
      +'</tr>'
    ).join('');
    const html = '<!doctype html><html lang="it"><head><meta charset="utf-8">'
      +'<title>Report RCI — '+esc(patientLabel||'paziente')+'</title>'
      +'<style>'
      +'body{font-family:Georgia,serif; color:#1a1a1a; max-width:800px; margin:32px auto; padding:0 16px;}'
      +'h1{font-size:20px; margin-bottom:2px;} .sub{color:#555; font-size:13px; margin-bottom:24px;}'
      +'table{width:100%; border-collapse:collapse; font-size:13px;}'
      +'th,td{border:1px solid #ccc; padding:8px 10px; text-align:left;}'
      +'th{background:#f2f2f2;} .sig-yes{color:#0a6b2f; font-weight:700;} .sig-no{color:#555;}'
      +'.not-comparable{color:#a33; font-style:italic;}'
      +'.note{margin-top:20px; font-size:12px; color:#555; line-height:1.5;}'
      +'.printbtn{margin:16px 0; padding:8px 16px; font-size:13px;}'
      +'@media print{ .printbtn{display:none;} body{margin:0;} }'
      +'</style></head><body>'
      +'<h1>TracciaN — Report cambiamento affidabile (RCI)</h1>'
      +'<div class="sub">Paziente: '+esc(patientLabel||'—')+' · generato il '+esc(dateLabel)+'</div>'
      +'<button class="printbtn" onclick="window.print()">Stampa / Salva PDF</button>'
      +'<table><thead><tr><th>Esercizio</th><th>Sessioni tot.</th><th>Per gruppo</th>'
      +'<th>Media baseline</th><th>Media finale</th><th>RCI</th><th>Cambiamento significativo</th></tr></thead>'
      +'<tbody>'+rowsHtml+'</tbody></table>'
      +'<div class="note">RCI calcolato secondo Crawford &amp; Howell — |RCI| ≥ 1.96 indica un cambiamento '
      +'statisticamente affidabile (p&lt;.05), non attribuibile a variabilità di misura tra sessioni. '
      +'Baseline e punto finale sono la media delle prime/ultime sessioni disponibili per ciascun esercizio '
      +'(fino a '+RCI_BASELINE_N+' per gruppo) — l\'affidabilità usata nel calcolo è corretta con la formula '
      +'di Spearman-Brown per riflettere che si confrontano due medie, non due sedute singole. '
      +'Quando i parametri (livello, ISI, numero di prove, frequenza, modalità di titolazione) differiscono '
      +'in modo sostanziale fra le sessioni di baseline e quelle finali, l\'RCI non viene calcolato: un '
      +'cambiamento di accuratezza fra condizioni diverse misurerebbe quanto è cambiato il compito, non il '
      +'paziente — le medie restano comunque mostrate, solo l\'indice sintetico viene soppresso. '
      +'Documento generato da TracciaN, uso clinico.</div>'
      +'</body></html>';
    return html;
  }
