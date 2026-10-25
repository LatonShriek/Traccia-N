// Raggruppa le registrazioni (una per esercizio) in "sedute di lavoro": stesso paziente e stessa origine
// (in presenza / da remoto / esercizi liberi), con meno di SESSION_GAP_MS fra la fine di un esercizio e l'inizio del successivo.
// NUOVO codice (passo 9). SESSION_GAP_MS = 45 minuti è un'IPOTESI DI PARTENZA (non un dato di letteratura): è solo
// un criterio di presentazione dello storico, non cambia nessun dato salvato né punteggio.
export const SESSION_GAP_MS = 45 * 60 * 1000;

export function originOf(r){
  if(r.localPatientId) return 'presenza';
  if(r.pazienteId) return 'remoto';
  return 'libero';
}
export function patientKeyOf(r){
  if(r.localPatientId) return 'local:'+r.localPatientId;
  if(r.pazienteId) return 'remote:'+r.pazienteId;
  return 'free:'+(r.patientCode||'');
}
export function startOf(r){ return r.ts - (r.durationMs || 0); }

// items: registrazioni in qualunque ordine. labelOf(r) -> etichetta del paziente (o null).
// Restituisce le sedute dalla più recente: { key, origin, patientKey, patientLabel, start, end, totalMs, items }
// con items in ordine cronologico.
export function groupSessions(items, labelOf, gapMs){
  const gap = gapMs == null ? SESSION_GAP_MS : gapMs;
  const asc = items.filter(r => r && typeof r.ts === 'number').slice().sort((a,b)=> a.ts - b.ts);
  const open = {};
  const out = [];
  asc.forEach(r=>{
    const pk = patientKeyOf(r);
    const st = startOf(r);
    let g = open[pk];
    if(!g || (st - g.end) > gap){
      g = { key: pk+'@'+r.ts, origin: originOf(r), patientKey: pk, patientLabel: null, start: st, end: r.ts, totalMs: 0, items: [] };
      open[pk] = g; out.push(g);
    }
    g.items.push(r);
    g.end = Math.max(g.end, r.ts);
    g.start = Math.min(g.start, st);
    g.totalMs += (r.durationMs || 0);
    if(g.patientLabel == null && labelOf) g.patientLabel = labelOf(r) || null;
  });
  return out.sort((a,b)=> b.end - a.end);
}
