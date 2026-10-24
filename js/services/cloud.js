// Accesso ai dati su Supabase, senza interfaccia e senza stato globale (passo 4b).
// Ogni funzione riceve il client (sb) e gli id come parametri e restituisce i dati;
// in index.html restano le funzioni con lo stesso nome di prima, che fanno le
// verifiche "c'e' il cloud? c'e' un utente?", aggiornano le cache e gestiscono
// gli errori come prima. recToRow e rowToRec sono SPOSTATE senza modifiche al
// corpo; recToRow riceve pero' utente e profilo paziente come parametri (prima
// leggeva le variabili globali cloudUser e patientProfile). fetchRole e' il
// contenuto di checkRole: stesse query e stesse regole, ma restituisce i quattro
// valori invece di scriverli nelle variabili globali. Le altre sono le query,
// identiche, di pushSession, pullRemote, listMyPatients, fetchRemotePatientFresh,
// loadOperatoriList, loadPatientCountPerOperator, loadAccessLog, logAccessEvent,
// logAuditAction, loadGoalTimeUsage e loadTodayUsage.

// ---- sedute: conversione record <-> riga della tabella 'sessioni' ----
export function recToRow(rec, cloudUser, patientProfile){
  const isPatientSaving = !!patientProfile;
  return {
    id: rec.id,
    user_id: cloudUser.id, // retro-compatibilità con record vecchi
    operatore_id: isPatientSaving ? patientProfile.operatore_id : cloudUser.id,
    paziente_id: isPatientSaving ? cloudUser.id : (rec.pazienteId || null),
    local_patient_id: rec.localPatientId || null,
    ts: rec.ts, date_label: rec.dateLabel,
    stim_type: rec.stimType, n_level: rec.nLevel, trials: rec.trials, isi: rec.isi,
    stim_duration: rec.stimDuration, resp_mode: rec.respMode, patient_code: rec.patientCode,
    notes: rec.notes, task_mode: rec.taskMode, target_seq: rec.targetSeq,
    final_level: rec.finalLevel!=null ? String(rec.finalLevel) : null,
    counts: rec.counts, metrics: rec.metrics, avg_rt: rec.avgRT, duration_ms: rec.durationMs,
    family: rec.family || null, counts_aud: rec.countsAud || null, metrics_aud: rec.metricsAud || null,
    choice: rec.choice || null, ssrt: rec.ssrt!=null?rec.ssrt:null, mean_ssd: rec.meanSSD!=null?rec.meanSSD:null,
    neglect: rec.neglect || null, goaltask: rec.goaltask || null, memoria: rec.memoria || null,
    titration_mode: rec.titrationMode || null, target_rate: rec.targetRate!=null ? rec.targetRate : null
  };
}
export function rowToRec(row){
  return {
    id: row.id, ts: row.ts, dateLabel: row.date_label, stimType: row.stim_type, nLevel: row.n_level,
    trials: row.trials, isi: row.isi, stimDuration: row.stim_duration, respMode: row.resp_mode,
    patientCode: row.patient_code, notes: row.notes, taskMode: row.task_mode, targetSeq: row.target_seq,
    finalLevel: row.final_level!=null ? (row.final_level.includes && row.final_level.includes('/') ? row.final_level : Number(row.final_level)) : null,
    counts: row.counts, metrics: row.metrics, avgRT: row.avg_rt, durationMs: row.duration_ms,
    family: row.family || 'signal', countsAud: row.counts_aud, metricsAud: row.metrics_aud,
    choice: row.choice, ssrt: row.ssrt, meanSSD: row.mean_ssd, neglect: row.neglect, goaltask: row.goaltask, memoria: row.memoria,
    pazienteId: row.paziente_id || null, localPatientId: row.local_patient_id || null,
    // Colonne nuove (vedi commento su rec.titrationMode in completeAndSave)
    // — row.titration_mode/row.target_rate saranno undefined finché non
    // esistono davvero in Supabase; qui degradano a null senza errori,
    // il controllo di comparabilità dell'RCI tratta il dato mancante
    // come "non verificabile", non come "sicuramente comparabile".
    titrationMode: row.titration_mode || null, targetRate: row.target_rate!=null ? row.target_rate : null
  };
}

// ---- ruolo dell'account ----
// Un account è "paziente" se esiste una riga in pazienti con id = auth.uid().
// Restituisce { patientProfile, isSuperOperatore, operatorInactive, operatorNoRole }.
export async function fetchRole(sb, userId){
  let patientProfile = null, isSuperOperatore = false, operatorInactive = false, operatorNoRole = false;
  try{
    const { data } = await sb.from('pazienti').select('*').eq('id', userId).maybeSingle();
    patientProfile = data || null;
  }catch(e){ patientProfile = null; }
  if(!patientProfile){
    try{
      const { data, error } = await sb.from('operatori').select('super, attivo').eq('id', userId).maybeSingle();
      isSuperOperatore = !!(data && data.super);
      // 'attivo' potrebbe non esistere ancora se la migrazione SQL (colonne
      // nome/attivo, vedi README) non è ancora stata eseguita su questo
      // progetto — data.attivo sarebbe allora undefined, mai false: nessun
      // blocco per errore prima che la colonna esista davvero.
      operatorInactive = !!(data && data.attivo === false);
      // Account senza ruolo: la query ha risposto SENZA errore ma non esiste
      // nessuna riga in 'operatori' (e sopra non è risultato un paziente):
      // bloccato come un operatore archiviato, con un messaggio dedicato. Se
      // invece la query dà errore (tabella assente o non ancora migrata, rete
      // assente) non si blocca nulla: il blocco scatta solo con una risposta
      // valida che dice "nessuna riga".
      if(!error && !data){ operatorInactive = true; operatorNoRole = true; }
    }catch(e){ isSuperOperatore = false; operatorInactive = false; operatorNoRole = false; } // tabella 'operatori' assente o non ancora migrata: nessun accesso al registro, nessun blocco dell'app
  }
  return { patientProfile, isSuperOperatore, operatorInactive, operatorNoRole };
}

// ---- sedute ----
export async function upsertSessionRow(sb, row){ await sb.from('sessioni').upsert(row); }
// Lancia in caso di errore; il chiamante decide cosa fare.
export async function fetchSessionRows(sb, userId){
  const { data, error } = await sb.from('sessioni').select('*')
    .or('operatore_id.eq.'+userId+',paziente_id.eq.'+userId)
    .order('ts',{ascending:false});
  if(error) throw error;
  return data||[];
}

// ---- pazienti ----
export async function fetchMyPatients(sb, operatorId){
  const { data, error } = await sb.from('pazienti').select('*').eq('operatore_id', operatorId).order('creato_il',{ascending:false});
  if(error) throw error;
  return data||[];
}
export async function fetchPatientFresh(sb, id, operatorId){
  const { data, error } = await sb.from('pazienti').select('*').eq('id', id).eq('operatore_id', operatorId).maybeSingle();
  if(error) throw error;
  return data;
}

// ---- super-operatore: elenco operatori, conteggio pazienti, registro accessi ----
export async function fetchOperators(sb){
  const { data, error } = await sb.from('operatori').select('id, nome, attivo, super, creato_il').order('creato_il',{ascending:true});
  if(error) throw error;
  return data || [];
}
export async function countPatientsOfOperator(sb, operatorId){
  const { count } = await sb.from('pazienti').select('id', {count:'exact', head:true}).eq('operatore_id', operatorId);
  return count || 0;
}
export async function fetchAccessRows(sb){
  const { data, error } = await sb.from('accessi').select('*').order('ts',{ascending:false}).limit(5000);
  if(error) throw error;
  return data || [];
}

// ---- registri ----
export async function insertAccessEvent(sb, evento, esito, userType, userId, emailTentata, etichetta){
  await sb.from('accessi').insert({
    evento, esito, user_type: userType,
    user_id: userId || null,
    email_tentata: emailTentata || null,
    etichetta: etichetta || null
  });
}
export async function insertAuditAction(sb, user, azione, bersaglioTipo, bersaglioId, bersaglioEtichetta){
  await sb.from('audit_log').insert({
    azione, bersaglio_tipo:bersaglioTipo, bersaglio_id:bersaglioId, bersaglio_etichetta:bersaglioEtichetta||null,
    eseguita_da: user.id, eseguita_da_etichetta: user.email
  });
}

// ---- tempo di allenamento del paziente (minuti) ----
// sinceTs: solo le sedute da quel momento in poi (null = tutte).
export async function fetchUsageRows(sb, patientId, sinceTs){
  let query = sb.from('sessioni').select('duration_ms').eq('paziente_id', patientId);
  if(sinceTs!=null) query = query.gte('ts', sinceTs);
  const { data, error } = await query;
  if(error) throw error;
  return data;
}
export function minutesOf(rows){ return Math.round(rows.reduce((s,r)=> s+(r.duration_ms||0),0)/60000); }
