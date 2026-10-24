// js/core/records.js — riconoscimento del tipo di record/configurazione, funzioni pure.
// Spostate da index.html senza modifiche al codice (solo `export`).

// TAPAT era una sotto-modalità di ANT (taskMode:'ant', antMode:'tapat')
// prima della separazione in due esercizi distinti. Le sessioni già
// salvate con il formato vecchio restano leggibili/esportabili con
// questo helper, usato ovunque occorra riconoscere "è una sessione
// TAPAT" su un cfg o un record storico, vecchio o nuovo formato che sia.
// Le sessioni NUOVE scrivono sempre taskMode:'tapat' direttamente.
export function isTapatLike(o){ return !!o && (o.taskMode==='tapat' || (o.taskMode==='ant' && o.antMode==='tapat')); }
export function isTapatKey(r){ return isTapatLike(r) ? 'tapat' : r.taskMode; }
