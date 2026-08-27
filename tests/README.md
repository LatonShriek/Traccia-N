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

## Cosa NON copre (limite dichiarato, non nascosto)

- **Niente che riguardi lo schermo vero**: se un pulsante appare
  davvero, se un tap registra davvero, se un layout si vede bene su
  schermo piccolo. Questi test leggono solo la LOGICA (funzioni pure),
  non c'è un browser simulato dietro. Il bug del cue ANT/TAPAT mostrato
  in contemporanea al bersaglio, per dire, è stato trovato leggendo il
  codice e ragionandoci — un test così com'è oggi non lo avrebbe preso da
  solo, perché riguardava *quando* qualcosa appare a schermo, non un
  calcolo. Il test che c'è ora (`ant-cue.test.js`) verifica il rimedio,
  non avrebbe trovato il problema.
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
