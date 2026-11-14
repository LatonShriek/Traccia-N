// Profili consigliati: sottoinsiemi di esercizi pensati per un tipo di difficoltà, con livello di partenza,
// modalità e durata suggeriti. NUOVO codice (15 nov 2026). Sono IPOTESI DI LAVORO ricavate da ragionamento
// sulla letteratura generale (non protocolli validati esercizio per esercizio): vanno riviste dal clinico,
// sono sempre modificabili a mano e non sostituiscono la valutazione. Il caricamento mette i valori nella
// schermata Setup, non avvia nulla.
//
// Ogni voce: { taskMode, livello (di partenza), durataMin (0 = a numero di prove), perche }.
// patchOf(voce) la traduce nei campi veri di cfg (il campo del livello cambia da esercizio a esercizio).
export const PROFILI = [
  {
    key: 'adhd',
    label: 'ADHD / difficoltà di attenzione e inibizione',
    ipotesi: 'Inibizione di risposta e attenzione sostenuta; prove brevi, ritmo che non annoia, riscontro sempre acceso. Per l\'attenzione sostenuta lunga manca ancora un compito dedicato (vigilanza).',
    voci: [
      { taskMode: 'gonogo', livello: 3, durataMin: 8, perche: 'Inibizione di una risposta prepotente, il nucleo del deficit.' },
      { taskMode: 'stopsignal', livello: 2, durataMin: 6, perche: 'Inibizione di un\'azione già avviata (SSRT).' },
      { taskMode: 'intrusopercettivo', livello: 3, durataMin: 6, perche: 'Attenzione selettiva con tempo per schermata.' },
      { taskMode: 'switching', livello: 2, durataMin: 6, perche: 'Flessibilità e controllo sulle regole.' }
    ]
  },
  {
    key: 'dsa',
    label: 'DSA / profilo di lettura e scrittura (ipotesi limitata)',
    ipotesi: 'Gli esercizi qui sono di supporto (ricerca visiva, memoria di lavoro verbale, manipolazione di lettere): non ci sono ancora compiti di lettura (parole a esposizione breve, denominazione rapida) né di calcolo (confronto di numerosità).',
    voci: [
      { taskMode: 'griglie', livello: 3, durataMin: 8, perche: 'Scansione visiva ordinata e attenzione a più attributi (colore, forma, bordo).' },
      { taskMode: 'inversione', livello: 2, durataMin: 8, perche: 'Manipolazione di sequenze di lettere e cifre in memoria di lavoro.' },
      { taskMode: 'runningspan', livello: 2, durataMin: 6, perche: 'Aggiornamento in memoria di lavoro.' },
      { taskMode: 'intrusopercettivo', livello: 3, durataMin: 6, perche: 'Discriminazione visiva di simboli simili.' }
    ]
  },
  {
    key: 'mci-esecutivo',
    label: 'MCI non amnestico con deficit esecutivo',
    ipotesi: 'Memoria di lavoro e flessibilità hanno l\'evidenza migliore nel training cognitivo del MCI; il trasferimento ai compiti esecutivi e alla vita quotidiana è incerto e va verificato con la rivalutazione.',
    voci: [
      { taskMode: 'nback', livello: 3, durataMin: 8, perche: 'Aggiornamento in memoria di lavoro: l\'effetto più documentato.' },
      { taskMode: 'runningspan', livello: 3, durataMin: 6, perche: 'Memoria di lavoro con aggiornamento continuo.' },
      { taskMode: 'inversione', livello: 3, durataMin: 8, perche: 'Manipolazione (non solo mantenimento) di sequenze.' },
      { taskMode: 'categorizzazione', livello: 3, durataMin: 8, perche: 'Applicare regole condizionali (carico relazionale).' },
      { taskMode: 'switching', livello: 3, durataMin: 6, perche: 'Costo di alternanza fra regole.' }
    ]
  },
  {
    key: 'mci-amnestico',
    label: 'MCI amnestico',
    ipotesi: 'Più utile la strategia di codifica (chunking, loci) del puro carico di memoria di lavoro; attenzione e memoria di lavoro come supporto, a livelli moderati per non frustrare.',
    voci: [
      { taskMode: 'memoria', livello: 1, durataMin: 0, perche: 'Strategie di codifica e recupero: il versante dove ci si aspetta più beneficio.' },
      { taskMode: 'nback', livello: 2, durataMin: 6, perche: 'Memoria di lavoro come supporto.' },
      { taskMode: 'intrusopercettivo', livello: 2, durataMin: 5, perche: 'Attenzione selettiva, senza carico mnesico.' }
    ]
  },
  {
    key: 'neglect',
    label: 'Negligenza spaziale',
    ipotesi: 'Esplorazione visuospaziale con gradiente sinistra/destra; la ricerca visiva come rinforzo.',
    voci: [
      { taskMode: 'neglect', livello: 3, durataMin: 0, perche: 'Cancellazione con gradiente: misura e allena la stessa cosa.' },
      { taskMode: 'tapat', livello: 2, durataMin: 0, perche: 'Attenzione sostenuta con componente spaziale.' },
      { taskMode: 'intrusopercettivo', livello: 2, durataMin: 5, perche: 'Ricerca visiva su schermo intero.' }
    ]
  }
];

// Campo di cfg che contiene il livello di partenza, per esercizio.
const CAMPO_LIVELLO = {
  nback: 'nLevel', categorizzazione: 'categLivello', tapat: 'tapatStartLevel', neglect: 'neglectStartLevel'
};
const ADATTIVI = ['nback','gonogo','switching','stopsignal','ant','simon','runningspan','intrusopercettivo','griglie','inversione','pasat','serie','neglect','categorizzazione'];
const SENZA_DURATA = ['neglect','goaltask','memoria','tapat'];

export function patchOf(voce){
  const p = {};
  if(voce.taskMode !== 'memoria' && voce.taskMode !== 'goaltask'){
    p[CAMPO_LIVELLO[voce.taskMode] || 'adaptStartLevel'] = voce.livello;
  }
  if(ADATTIVI.includes(voce.taskMode)){ p.titrationMode = 'adattivo'; p.adaptive = true; }
  if(voce.durataMin > 0 && !SENZA_DURATA.includes(voce.taskMode)) p.durataMin = voce.durataMin;
  p.feedbackProva = true;
  return p;
}
