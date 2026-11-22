// Passaggio dei livelli tra Traccia-N (da remoto) e PdM generator (in presenza) tramite un breve CODICE da copiare e incollare.
// Il codice contiene SOLO livelli del generatore (1-32) per Intruso (I), Griglie (G) e Inversione (V): nessun nome, nessun dato clinico.
// Formato: TRN-I12-G8-V15-47 (da Traccia-N) oppure PDM-I12-G8-V15-47 (da PdM); le ultime due cifre sono un controllo contro gli errori di battitura.
// Costruzione/lettura IDENTICHE a quelle di PdM (js/passaggio.js): se si cambia qui, cambiare anche là.
import { genOfFine, fineOfGen } from './assi.js';

// esercizio Traccia-N -> lettera nel codice
export const PASSAGGIO_TASKS = { intrusopercettivo: 'I', griglie: 'G', inversione: 'V' };
export const PASSAGGIO_LABEL = { intrusopercettivo: 'Intruso percettivo', griglie: 'Griglie', inversione: 'Inversione e riordino' };
const LETTER_TO_TASK = { I: 'intrusopercettivo', G: 'griglie', V: 'inversione' };

export function passaggioChecksum(body){
  let s = 0;
  for (let i = 0; i < body.length; i++) s += body.charCodeAt(i) * (i + 1);
  return String(s % 97).padStart(2, '0');
}
// origin: 'PDM' o 'TRN'; levels: {intrusopercettivo, griglie, inversione} in livelli del GENERATORE (1-32), anche parziale
export function passaggioBuild(origin, levels){
  const parts = Object.keys(PASSAGGIO_TASKS)
    .filter(k => levels && Number.isFinite(levels[k]))
    .map(k => PASSAGGIO_TASKS[k] + Math.max(1, Math.min(32, Math.floor(levels[k]))));
  if (!parts.length) return null;
  const body = origin + '-' + parts.join('-');
  return body + '-' + passaggioChecksum(body);
}
// {ok:true, origin, levels:{<taskMode>:gen}} oppure {ok:false, error}
export function passaggioParse(text){
  const t = String(text || '').toUpperCase().replace(/\s+/g, '').replace(/[–—]/g, '-');
  const m = t.match(/^(PDM|TRN)((?:-[IGV]\d{1,2})+)-(\d{2})$/);
  if (!m) return { ok: false, error: 'Codice non riconosciuto: controlla di averlo copiato per intero (es. PDM-I12-G8-V15-47).' };
  if (passaggioChecksum(m[1] + m[2]) !== m[3]) return { ok: false, error: 'Il codice non torna (controllo finale diverso): probabile errore di battitura, ricopialo.' };
  const levels = {};
  for (const part of m[2].split('-').filter(Boolean)) {
    const lv = Number(part.slice(1));
    if (lv < 1 || lv > 32) return { ok: false, error: 'Livello fuori scala (1-32) nel codice.' };
    levels[LETTER_TO_TASK[part[0]]] = lv;
  }
  return { ok: true, origin: m[1], levels };
}

// Livello del generatore -> livello fine di Traccia-N, PRUDENTE: mezzo livello per difetto (così si parte sempre un po' sotto, mai sopra).
export function fineOfPassaggio(gen){
  const f = fineOfGen(Math.max(1, Math.min(32, gen)));
  return Math.max(1, Math.floor(f * 2) / 2);
}
// Scrive in `cfg` (copia di configurazione) il livello di partenza corrispondente al livello del generatore.
export function applyPassaggioToCfg(cfg, gen){
  const fine = fineOfPassaggio(gen);
  cfg.adaptStartLevel = Math.max(1, Math.min(10, Math.round(fine)));
  cfg.adaptFine = fine;
  return cfg;
}
// Livello del generatore raggiunto dal paziente in una configurazione salvata (null se non c'è).
export function genOfSavedCfg(c){
  if (!c) return null;
  const lv = c.adaptStartLevel;
  if (!Number.isFinite(lv)) return null;
  const fine = (Number.isFinite(c.adaptFine) && Math.round(c.adaptFine) === lv) ? c.adaptFine : lv;
  return Math.max(1, Math.floor(genOfFine(fine)));
}
