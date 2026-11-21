// PASAT / PVSAT con operazione — Paced Auditory/Visual Serial Addition Test (Gronwall, 1977),
// esteso a giorni della settimana e mesi. Un flusso di stimoli a ritmo imposto: a ogni
// stimolo il paziente tocca la risposta richiesta dalla regola, SENZA che lo stimolo
// precedente resti visibile (aggiornamento in memoria di lavoro + calcolo + velocità).
// Tre materiali:
//  - somme:  cifre 1-9; risposta = (cifra attuale + quella di `lag` posti prima), tastierino 2-18
//  - giorni: giorni della settimana; risposta = il giorno che segue di `shift` quello di `lag` posti prima
//  - mesi:   come giorni, sui 12 mesi
// Non duplica l'N-back (che chiede "è uguale?"): qui si deve TRASFORMARE l'elemento tenuto a mente.
// Funzioni pure; il caso passa da `rng`.
import { adaptStepFine, fineStartOf } from '../core/adapt.js';
import { lerpLevel } from '../core/levels.js';
import { mean } from '../core/stats.js';

  export const PASAT_DAYS = ['lunedì','martedì','mercoledì','giovedì','venerdì','sabato','domenica'];
  export const PASAT_MONTHS = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  export const PASAT_MATERIALS = { somme:'Somme di cifre', giorni:'Giorni della settimana', mesi:'Mesi' };
  // Livello → ritmo (ms fra uno stimolo e il successivo), lag (quanti stimoli indietro) e
  // shift (di quanti giorni/mesi avanzare; per le somme non usato). Dal 4 il ritmo si stringe,
  // dal 7 il lag passa a 2 (si tengono a mente DUE elementi). Ipotesi di partenza dichiarate:
  // il PASAT classico è a 3,0 / 2,4 / 2,0 / 1,6 s (Gronwall, 1977).
  export const PASAT_LEVELS = {
    1:{isi:3600, lag:1, shift:1}, 2:{isi:3200, lag:1, shift:1}, 3:{isi:3000, lag:1, shift:1},
    4:{isi:2800, lag:1, shift:2}, 5:{isi:2600, lag:1, shift:2}, 6:{isi:2400, lag:1, shift:2},
    7:{isi:3200, lag:2, shift:1}, 8:{isi:2900, lag:2, shift:1}, 9:{isi:2600, lag:2, shift:2},
    10:{isi:2400, lag:2, shift:2}
  };
  export const PASAT_ADAPT_BLOCK = 8;
  // Bande: lag (1 o 2) e, per giorni/mesi, salto (shift) sono la REGOLA e non cambiano a metà seduta. Con le somme lo shift non conta:
  // bande per solo lag. Dentro la banda il livello si muove di mezzi gradini e cambia solo il ritmo (ISI), interpolato.
  export function pasatBand(material, level){
    const bands = material==='somme' ? [[1,6],[7,10]] : [[1,3],[4,6],[7,8],[9,10]];
    return bands.find(b => level>=b[0] && level<=b[1]) || bands[bands.length-1];
  }
  export function pasatIsi(level){
    return Math.round(lerpLevel(Object.fromEntries(Object.keys(PASAT_LEVELS).map(k => [k, PASAT_LEVELS[k].isi])), level));
  }
  export function pasatPool(material){
    if(material==='giorni') return PASAT_DAYS;
    if(material==='mesi') return PASAT_MONTHS;
    return [1,2,3,4,5,6,7,8,9];
  }
  // Risposte possibili (pulsanti sul tastierino a tocco).
  export function pasatAnswers(material){
    if(material==='somme') return Array.from({length:17},(_,i)=>i+2);
    return pasatPool(material);
  }
  // Serie di stimoli di una seduta (senza ripetizione immediata dello stesso stimolo).
  export function genPasatSeries(material, length, rng){
    rng = rng || Math.random;
    const pool = pasatPool(material), out = [];
    while(out.length<length){
      const c = pool[Math.floor(rng()*pool.length)];
      if(out.length && out[out.length-1]===c) continue;
      out.push(c);
    }
    return out;
  }
  // Risposta attesa allo stimolo di indice i (null per i primi `lag`, dove non si risponde ancora).
  export function pasatExpected(material, series, i, level){
    const L = PASAT_LEVELS[Math.floor(level)] || PASAT_LEVELS[1]; // lag e shift: parte intera (la banda non cambia mai in seduta)
    if(i < L.lag) return null;
    const cur = series[i], prev = series[i-L.lag];
    if(material==='somme') return prev+cur;
    const pool = pasatPool(material);
    return pool[(pool.indexOf(prev)+L.shift) % pool.length];
  }
  // Esito: tocco (null = nessuna risposta entro il ritmo).
  export function scorePasatTrial(expected, given, rtMs){
    if(given==null) return {correct:false, omitted:true, rt:null};
    return {correct: given===expected, omitted:false, rt: rtMs};
  }
  export function maybeAdaptPasat(cfg, session){
    if(!cfg.adaptive || session.pasatAdaptBlock.length < PASAT_ADAPT_BLOCK) return;
    // mezzi livelli e decisione sugli ultimi 2 blocchi (16 risposte) se il livello non è cambiato; mai fuori dalla banda di partenza
    const lv = session.pasatLevel!=null ? session.pasatLevel : fineStartOf(cfg);
    const band = pasatBand(cfg.pasatMateriale||'somme', session.pasatStartLevel || cfg.adaptStartLevel);
    const prev = session.pasatPrevBlock && session.pasatPrevLevel === lv ? session.pasatPrevBlock : null;
    const win = prev ? (mean(prev) + mean(session.pasatAdaptBlock)) / 2 : mean(session.pasatAdaptBlock);
    const st = adaptStepFine(win, lv, band[0], band[1]);
    if(st){ session.pasatPrevBlock = null; }
    else { session.pasatPrevBlock = session.pasatAdaptBlock.slice(); session.pasatPrevLevel = lv; }
    session.pasatLevel = lv + st;
    cfg.adaptStartLevel = Math.round(session.pasatLevel); cfg.adaptFine = session.pasatLevel;
    session.pasatAdaptBlock = [];
  }
