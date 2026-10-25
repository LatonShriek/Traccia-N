// Copia di sicurezza dei dati locali in un file JSON (passo 8). NUOVO codice.
// Salva: profili paziente locali, sedute, preset di allenamento, avanzamento dello screening.
// NON salva la configurazione del cloud (indirizzo e chiave): niente chiavi dentro un file che gira per le email.
// Il file contiene dati dei pazienti in chiaro: va conservato come una cartella clinica.
// Le funzioni ricevono lo "storage" (localStorage o un finto per i test); non toccano altro.
import { KEY } from './local-store.js';

export const BACKUP_FORMATO = 'traccian-backup';
export const BACKUP_VERSIONE = 1;
export const BACKUP_PREFISSI = [KEY.localPatient, KEY.session, KEY.preset, KEY.screeningProgress];

function inclusa(k){ return typeof k === 'string' && BACKUP_PREFISSI.some(p => k.indexOf(p) === 0); }
function chiaviDi(storage){
  const out = [];
  for(let i=0;i<storage.length;i++){ const k = storage.key(i); if(inclusa(k)) out.push(k); }
  return out.sort();
}
export function contaPerTipo(chiavi){
  const n = { pazienti:0, sedute:0, preset:0, screening:0 };
  chiavi.forEach(k => {
    if(k.indexOf(KEY.localPatient)===0) n.pazienti++;
    else if(k.indexOf(KEY.session)===0) n.sedute++;
    else if(k.indexOf(KEY.preset)===0) n.preset++;
    else if(k.indexOf(KEY.screeningProgress)===0) n.screening++;
  });
  return n;
}

// Crea l'oggetto della copia (poi JSON.stringify). I valori restano le stringhe così come stanno nello storage.
export function buildBackup(storage, now){
  const dati = {};
  chiaviDi(storage).forEach(k => { const v = storage.getItem(k); if(v !== null) dati[k] = v; });
  return { formato: BACKUP_FORMATO, versione: BACKUP_VERSIONE, creato: (now || new Date()).toISOString(), conteggi: contaPerTipo(Object.keys(dati)), dati };
}

// Controlla che un oggetto (già letto da JSON) sia una copia valida. Non scrive nulla.
export function validateBackup(obj){
  const errori = [];
  if(!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok:false, errori:['Il file non è una copia di TracciaN.'], conteggi:null };
  if(obj.formato !== BACKUP_FORMATO) errori.push('Il file non è una copia di TracciaN (formato non riconosciuto).');
  if(obj.versione !== BACKUP_VERSIONE) errori.push('Versione della copia non supportata: ' + obj.versione + '.');
  if(!obj.dati || typeof obj.dati !== 'object' || Array.isArray(obj.dati)) errori.push('Mancano i dati.');
  if(errori.length) return { ok:false, errori, conteggi:null };
  Object.keys(obj.dati).forEach(k => {
    if(!inclusa(k)) { errori.push('Chiave non ammessa: ' + k); return; }
    const v = obj.dati[k];
    if(typeof v !== 'string') { errori.push('Valore non valido per ' + k); return; }
    try{ JSON.parse(v); }catch(e){ errori.push('Dato illeggibile per ' + k); }
  });
  return { ok: errori.length === 0, errori, conteggi: contaPerTipo(Object.keys(obj.dati)) };
}

// Ripristino. modo 'unisci': aggiunge solo ciò che manca, non tocca niente di esistente.
// modo 'sostituisci': prima cancella tutti i dati ammessi presenti, poi scrive la copia.
// Se una scrittura fallisce (memoria piena) rimette com'era tutto quello che aveva cambiato e lancia l'errore.
// Restituisce { aggiunti, giaPresenti, rimossi }.
export function restoreBackup(obj, storage, modo){
  const v = validateBackup(obj);
  if(!v.ok) throw new Error(v.errori[0]);
  if(modo !== 'unisci' && modo !== 'sostituisci') throw new Error('Modo di ripristino non valido.');
  const prima = {};
  chiaviDi(storage).forEach(k => { prima[k] = storage.getItem(k); });
  const res = { aggiunti:0, giaPresenti:0, rimossi:0 };
  try{
    if(modo === 'sostituisci'){
      Object.keys(prima).forEach(k => { storage.removeItem(k); res.rimossi++; });
    }
    Object.keys(obj.dati).forEach(k => {
      if(modo === 'unisci' && Object.prototype.hasOwnProperty.call(prima, k)){ res.giaPresenti++; return; }
      storage.setItem(k, obj.dati[k]);
      res.aggiunti++;
    });
  }catch(e){
    // annulla: toglie tutto ciò che c'è ora e rimette lo stato di prima
    chiaviDi(storage).forEach(k => { try{ storage.removeItem(k); }catch(_){} });
    Object.keys(prima).forEach(k => { try{ storage.setItem(k, prima[k]); }catch(_){} });
    throw e;
  }
  return res;
}
