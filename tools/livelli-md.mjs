// Genera docs/livelli.md a partire dalle tabelle vere di js/core/levels.js (passo 6).
// Uso: node tools/livelli-md.mjs        (riscrive docs/livelli.md)
// Il test tests/livelli-doc.test.js verifica che il file coincida con questo output.
import * as L from '../js/core/levels.js';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';
import path from 'path';

const lv = [1,2,3,4,5,6,7,8,9,10];
const row = (name, f) => '| ' + name + ' | ' + lv.map(f).join(' | ') + ' |';
const head = '| Parametro | ' + lv.join(' | ') + ' |\n|---|' + lv.map(()=>'---').join('|') + '|';
const val = v => v === undefined ? '—' : String(v);
const pct = v => v === undefined ? '—' : String(Math.round(v*100)) + '%';

export function buildLivelliMd(){
  const o = [];
  o.push('# Tabelle dei livelli (1–10)');
  o.push('');
  o.push('File **generato**: non modificarlo a mano. Le tabelle vere stanno in `js/core/levels.js`;');
  o.push('per rigenerare questo file: `node tools/livelli-md.mjs`. Il test `livelli-doc` fallisce se i due non coincidono.');
  o.push('Valori clinici: non cambiarli senza richiesta esplicita.');
  o.push('');
  o.push('## Tempi e ritmo (ms)');
  o.push(''); o.push(head);
  for (const k of ['sequenza','dualtask','ant','simon','stopsignal']) o.push(row('ISI ' + k, l => val(L.ADAPT_ISI[k][l])));
  o.push(row('Switching: intervallo segnale→stimolo (CSI)', l => val(L.ADAPT_SWITCH_CSI[l])));
  o.push(row('Categorizzazione: ISI', l => val(L.CATEG_ISI[l])));
  o.push(row('TAPAT tonico: intervallo min', l => val(L.TAPAT_LEVELS[l][0])));
  o.push(row('TAPAT tonico: intervallo max', l => val(L.TAPAT_LEVELS[l][1])));
  o.push('');
  o.push('ISI più basso = più difficile. Simon usa la stessa tabella dell\'ANT. Categorizzazione non ha ISI ai livelli 7–8 (banda lure).');
  o.push('');
  o.push('## Frequenze');
  o.push(''); o.push(head);
  o.push(row('Go/No-Go: frequenza no-go', l => pct(L.ADAPT_GONOGO_FREQ[l])));
  o.push(row('Go/No-Go: elementi no-go attivi', l => val(L.ADAPT_GONOGO_COUNT[l])));
  o.push(row('Doppio compito: frequenza bersaglio per canale', l => pct(L.ADAPT_DUAL_FREQ[l])));
  o.push(row('Doppio compito: frequenza lure per canale', l => pct(L.ADAPT_DUAL_LURE[l])));
  o.push(row('Switching: prevalenza della regola dominante', l => pct(L.ADAPT_SWITCH_BALANCE[l])));
  o.push(row('Categorizzazione: frequenza lure', l => pct(L.CATEG_LURE[l])));
  o.push('');
  o.push('## N-back');
  o.push(''); o.push(head);
  o.push(row('n', l => val(L.NBACK_LEVEL_TABLE[l].n)));
  o.push(row('Frequenza bersaglio', l => pct(L.NBACK_LEVEL_TABLE[l].freq)));
  o.push(row('Frequenza lure', l => pct(L.NBACK_LEVEL_TABLE[l].lure)));
  o.push(''); o.push('Lo scarto dei lure è n−1 se n>1, altrimenti n+1.');
  o.push('');
  o.push('## Struttura, lunghezze e limiti');
  o.push(''); o.push(head);
  o.push(row('Categorizzazione: struttura (1–5)', l => val(L.CATEG_STRUCTURE_OF_LEVEL[l])));
  o.push(row('Sequenza bersaglio: lunghezza', l => val(L.ADAPT_SEQ_LEN[l])));
  o.push(row('Cancellazione: elementi per tavola', l => val(L.ADAPT_NEGLECT_SIZE[l])));
  o.push(row('Cancellazione: secondi per tavola (0 = nessun limite)', l => val(L.ADAPT_NEGLECT_TIME[l])));
  o.push('');
  o.push('Strutture della Categorizzazione: 1 = dimensione singola; 2 = doppia dimensione + no-go; 3 = regola disgiuntiva; 4 = 1-back sulla categoria; 5 = doppia dimensione su 4 risposte.');
  o.push('');
  o.push('## Costanti');
  o.push('');
  o.push('- Proroga per il secondo tocco nel Doppio compito: ' + L.DUAL_DOUBLE_TARGET_GRACE_MS + ' ms.');
  o.push('');
  return o.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'livelli.md');
  writeFileSync(out, buildLivelliMd());
  console.log('Scritto ' + out);
}
