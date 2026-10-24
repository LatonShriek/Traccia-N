// Salvataggio locale (localStorage) in un solo posto (passo 4a).
// NUOVO codice, non spostato: in index.html lo stesso schema "leggi il profilo,
// modificalo, riscrivilo" era copiato una quindicina di volte, con le chiavi
// ('traccian:...') scritte a mano ovunque. Comportamento invariato: le letture
// non lanciano mai (assente o illeggibile = null); le scritture possono
// lanciare (memoria piena), come prima: i chiamanti mantengono il loro try/catch.
// Le chiavi e il formato dei dati NON cambiano: i dati già salvati sul tablet
// restano leggibili.
export const KEY = {
  preset: 'traccian:preset:',
  localPatient: 'traccian:localpatient:',
  session: 'traccian:sessione:',
  screeningProgress: 'traccian:screeningprogress:',
  cloudUrl: 'traccian:cloud:url',
  cloudKey: 'traccian:cloud:key'
};

// Stringhe semplici (configurazione cloud). getRaw non lancia mai; setRaw può lanciare.
export function getRaw(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
export function setRaw(key, value){ localStorage.setItem(key, value); }
export function readJSON(key){
  try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch(e){ return null; }
}
export function writeJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
export function removeKey(key){ try{ localStorage.removeItem(key); }catch(e){} }

// Tutti i record con una certa chiave iniziale: [{key, value}], saltando quelli illeggibili.
export function listByPrefix(prefix){
  const out = [];
  try{
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.indexOf(prefix)===0){
        try{ out.push({key:k, value:JSON.parse(localStorage.getItem(k))}); }catch(e){}
      }
    }
  }catch(e){}
  return out;
}

// ---- profili locali dei pazienti ----
export function getLocalPatient(id){ return readJSON(KEY.localPatient+id); }
export function readAllLocalPatients(){ return listByPrefix(KEY.localPatient).map(x=>x.value); }
export function setLocalPatient(p){ writeJSON(KEY.localPatient+p.id, p); }
export function removeLocalPatient(id){ removeKey(KEY.localPatient+id); }
// Legge il profilo, applica fn(profilo) e lo riscrive. Restituisce il profilo
// aggiornato; null se il profilo non esiste; false (senza scrivere) se fn
// restituisce false. Può lanciare se la scrittura fallisce.
export function updateLocalPatient(id, fn){
  const p = getLocalPatient(id);
  if(!p) return null;
  if(fn(p) === false) return false;
  setLocalPatient(p);
  return p;
}

// ---- sedute registrate ----
export function saveSessionLocal(rec){ writeJSON(KEY.session+rec.id, rec); }
export function listSessionsLocal(){ return listByPrefix(KEY.session).map(x=>x.value); }
// Riscrive le sedute per cui fn(rec) restituisce true (fn modifica rec).
export function rewriteSessionsLocal(fn){
  listByPrefix(KEY.session).forEach(({key, value})=>{
    try{ if(fn(value)) writeJSON(key, value); }catch(e){}
  });
}
