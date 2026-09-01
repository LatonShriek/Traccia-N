# Test di regressione — 6 esercizi di titolazione

## Come si lancia

```
node tests/run-all.js
```

Da eseguire dalla cartella del progetto (quella con `index.html` dentro).
Nessuna installazione: usa solo Node.js, già presente in ogni ambiente
dove si lavora su TracciaN. Stampa quanti controlli passano per ogni
file, ed esce con un errore (visibile anche da script/automazioni) se
anche uno solo fallisce.

## Quando lanciarla

**Prima di ogni consegna che tocca uno di questi 6 esercizi**: N-back,
Go/No-Go, Task-switching, Sequenza bersaglio, Stop-Signal, ANT. Non è
indispensabile per modifiche che non li toccano (Doppio compito,
Cancellazione, Categorizzazione condizionale, Strategie di memoria,
Scenari ecologici, TAPAT), anche se non fa mai danno lanciarla comunque.

## Come funziona (perché ci si può fidare)

Ogni file di test **estrae il codice vero da `index.html`** al momento
dell'esecuzione — non lo ricopia mai a mano. Se una funzione o una
costante viene rinominata, spostata o riscritta in un modo che rompe il
riferimento, il test **si ferma con un errore esplicito** invece di
continuare in silenzio a verificare una versione vecchia del codice.
Questo è voluto: un test che fallisce rumorosamente per "non trovo più
questo blocco" è un avviso utile, non un fastidio.

Il meccanismo di estrazione è in `tests/lib/extract-source.js`.

## Cosa copre

- **`titration.test.js`** — i 6 esercizi di titolazione: Manuale non deve
  mai leggere una tabella di livello; Livello e Adattivo devono risolvere
  esattamente allo stesso modo allo stesso livello; nessun parametro deve
  restare "orfano" (agganciato a un campo che nessuna modalità aggiorna);
  Setup deve sempre mostrare lo stesso valore che il motore userà davvero;
  ogni tabella di livello deve essere monotona (più livello, più
  difficile) e i valori estremi (livello 1 e 10) devono coincidere con
  quelli clinicamente decisi.
- **`stopsignal.test.js`** — le regole di classificazione two-choice
  (frecce/lettere/numeri/forma/suoni) e la generazione delle prove.
- **`screening.test.js`** — struttura a 4 domini, nessun riferimento
  residuo al dominio "Attenzione divisa" (rimosso deliberatamente).
- **`keylayout.test.js`** — le due disposizioni tasti (standard,
  ravvicinata); la "ravvicinata" deve restare su 4 tasti fisicamente
  adiacenti sulla tastiera.
- **`ant-cue.test.js`** — il cue di ANT/TAPAT mostra sempre e solo il cue,
  mai il bersaglio insieme (il bug corretto in questa consegna).
- **`rci.test.js`** — l'RCI sopprime il numero (non le medie) quando i
  parametri cambiano fra baseline e punto finale, incluso il caso
  esplicito "livello 1 vs livello 10" (stesso trattamento di un ISI
  diverso — vedi il paragrafo dedicato più sotto).
- **`named-configs.test.js`** — gli slot nominali (salva/richiama/elimina
  una configurazione per paziente+esercizio) si comportano correttamente:
  stesso nome sovrascrive senza duplicare, nomi/esercizi diversi restano
  separati.
- **`neglect-titration.test.js`** — l'estensione del modello triplice a
  Cancellazione (Neglect): stesso schema Manuale/Livello/Adattivo dei
  primi 6 esercizi, incluso il caso più complesso (modalità "Progressiva",
  scala assoluta 1-30 che attraversa tre fasi con la propria scala 1-10
  ciascuna).
- **`dualtask-titration.test.js`** — l'estensione del modello triplice al
  Doppio compito: un solo selettore condiviso per due canali indipendenti
  (non uno per canale — vedi il paragrafo dedicato nel README principale),
  verifica che ciascun canale risolva alla propria tabella senza
  interferire con l'altro, e che l'ISI condiviso derivi correttamente
  dalla media dei due livelli.
- **`categorizzazione-titration.test.js`** — l'estensione del modello
  triplice a Categorizzazione condizionale, la più diversa dagli altri:
  in Manuale la struttura (1-5) è una scelta indipendente dal numero di
  livello, decisione esplicita presa da Rodrigo — verifica che questo
  disaccoppiamento funzioni davvero (struttura Manuale mai derivata dal
  livello) e che ISI/frequenza lure non leggano mai la tabella in quella
  modalità.
- **`tapat-titration.test.js`** — l'estensione del modello triplice al
  TAPAT, l'ultimo degli 11 esercizi: in Manuale l'intervallo del blocco
  tonico usa un range libero (min/max) invece della tabella per livello,
  Livello/Adattivo risolvono identicamente; il blocco fasico resta
  sempre sul campo ISI generico, in ogni modalità (non è mai stato legato
  al livello).
- **`e2e/session-flow.test.js`** — a differenza di tutto il resto, questo
  apre DAVVERO l'app in un browser (Chromium, via Playwright) e la usa
  come farebbe un paziente: seleziona un esercizio, avvia la sessione,
  tocca i pulsanti di risposta veri, verifica che arrivi ai risultati
  senza errori JavaScript in pagina e senza restare bloccata. Copre
  esattamente ciò che tutto il resto della suite dichiara di NON coprire
  (vedi sezione sotto). Per ora N-back, Go/No-Go, Task-switching, Doppio
  compito, TAPAT (5 su 11) — prova di fattibilità estesa progressivamente,
  non ancora tutti gli esercizi.
  **Richiede `npm install playwright`** (una volta sola su questa
  macchina) — se non è installato, `run-all.js` salta questa parte con un
  avviso invece di fallire: il resto della suite non dipende da questo.

## Come funziona la parte end-to-end (`tests/e2e/`)

`tests/e2e/patient-agent.js` è l'agente riutilizzabile: apre `index.html`
per davvero in un browser headless, clicca sui pulsanti veri dell'app
(mai chiamate dirette a funzioni interne — dall'esterno del file non sono
comunque raggiungibili, sono chiuse dentro la grande funzione che
racchiude tutta l'app), riduce il numero di prove al minimo per velocità,
avvia la sessione, e poi tocca ripetutamente i pulsanti di risposta veri
finché la sessione non finisce da sola. Restituisce se è arrivato ai
risultati, se ci sono stati errori JavaScript, quanti tocchi ha dato.

Per aggiungere un esercizio nuovo a questa parte: basta aggiungere una
riga a `EXERCISE_BUTTON_TEXT` in `patient-agent.js` col testo esatto del
suo pulsante in Setup — non serve altra infrastruttura.

## Cosa NON copre (limite dichiarato, non nascosto)

- **La parte end-to-end (`tests/e2e/`) copre 5 esercizi su 11** per ora
  (N-back, Go/No-Go, Task-switching, Doppio compito, TAPAT) — è una prova
  di fattibilità, non ancora la copertura completa. Verifica solo che la
  sessione arrivi in fondo senza errori e senza bloccarsi con input
  realistico misto (risposte giuste e sbagliate) — non verifica che il
  PUNTEGGIO mostrato sia numericamente corretto (quello lo fanno già i
  test di logica pura sopra, che calcolano gli stessi numeri in
  isolamento). **Cancellazione (Neglect), Categorizzazione condizionale e
  Stop-Signal/ANT classico non sono incluse**: le prime due usano
  un'interazione diversa dagli altri (Neglect: si tocca ogni singolo
  elemento sulla tavola, non un pulsante di risposta standard;
  Categorizzazione ha un flusso di configurazione più articolato) — non
  sono ancora state provate con l'agente attuale.
- **Un valore sbagliato scritto in una tabella non si trova sempre da
  solo**: se il display e il motore leggono la STESSA tabella (che è la
  situazione normale — è proprio quello che li tiene sincronizzati), un
  numero clinicamente sbagliato in quella tabella sfugge ai controlli di
  coerenza display/motore, perché entrambi sbaglierebbero allo stesso
  modo. Per questo la sezione "monotonia e ancoraggi" di
  `titration.test.js` include alcuni valori fissati a mano (es. livello 1
  del Go/No-Go deve restare 48%) — quei numeri vanno tenuti aggiornati a
  mano se una decisione clinica li cambia davvero, il test non può
  saperlo da solo.

## Se un test fallisce dopo una modifica legittima

Non è detto che il codice sia sbagliato — può essere il test che va
aggiornato insieme alla modifica (es. una tabella di livello cambiata
di proposito, un nome di funzione rinominato di proposito). In quel
caso: aggiornare il test nello stesso commit/consegna della modifica
che lo ha reso obsoleto, mai ignorarlo o cancellarlo senza motivare
perché nel messaggio di consegna.
