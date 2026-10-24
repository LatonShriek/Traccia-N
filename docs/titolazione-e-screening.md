# Titolazione e screening — come funzionano e perché

Documento di riferimento (24/10/2026). Descrive ciò che fa il codice oggi.
Dove la giustificazione è un'**ipotesi di partenza dichiarata** (non un dato di
letteratura) lo si dice. I parametri clinici non si cambiano senza richiesta
esplicita di Rodrigo. Codice: `js/core/` (`levels.js`, `titration.js`,
`bands.js`, `adapt.js` — la regola 8 prove, 0.85/0.70 e il filtro RT in un solo punto —, `screening.js`), `js/exercises/` (generatori di prove, tavole Neglect in `neglect.js`, e in `resolve.js` la valutazione di ogni prova e l'applicazione della regola di titolazione: `pushAdaptOutcome`, `maybeAdapt`, `maybeAdaptDualChannel`) e, per il flusso della seduta e lo screening, `index.html`.

## 1. Titolazione

### 1.1 Tre modalità per esercizio
| Modalità | Cosa fa | Perché |
|---|---|---|
| **Manuale** | Ogni parametro resta quello impostato in Setup, indipendente dal livello. | Controllo totale del clinico. |
| **Livello** | I parametri vengono dalla tabella del livello scelto, fissi per tutta la seduta. | Sedute confrontabili: stesse condizioni. |
| **Adattivo** | Parte dal livello scelto e si sposta da solo durante la seduta. | Tenere il paziente nella fascia di difficoltà utile. |

Trasparenza: in ogni modalità il clinico vede a cosa corrisponde ciò che sta per
lanciare (testi "hint" in `titration.js`); in Livello/Adattivo i campi collegati
alla tabella sono di sola lettura, per non dare l'impressione di controllare
qualcosa che non controllano.

### 1.2 Regola adattiva generale
Si applica a N-back, Go/No-Go, Sequenza bersaglio, Task-switching, ANT, Simon,
Stop-Signal, Mantenimento, TAPAT, Categorizzazione.
- Si valuta un **blocco di 8 prove**. Successo > **85%** → il livello sale;
  < **70%** → scende; in mezzo resta. Dopo la valutazione il blocco riparte.
- Perché: il codice cita Wilson et al. (2019), secondo cui l'apprendimento è
  ottimale intorno all'85% di successo. Il limite inferiore del 70% è una scelta
  di progetto, coerente con la soglia di fallimento dello screening.
- **Velocità oltre che correttezza**: una risposta corretta ma più lenta di
  1,6 × la mediana personale (dopo almeno 4 RT corretti nella stessa seduta) non
  conta come successo pieno. Perché: criterio auto-riferito, non serve un campione
  normativo. Il 1,6 è un'**ipotesi di partenza**, da rivedere con l'uso.

### 1.3 Fasce strutturali (`bands.js`)
Alcuni livelli cambiano la **regola** del compito, non solo la velocità (n
nell'N-back, numero di elementi no-go, struttura della Categorizzazione,
modalità del Mantenimento, modalità del Neglect). Durante una seduta il livello
**non attraversa mai** quel confine: cambiare regola senza rispiegarla
confonderebbe il paziente; si cambia alla seduta successiva, con le istruzioni.
- N-back: 1–4 (n=1), 5–9 (n=2), 10 (n=3). Go/No-Go: 1–4, 5–7, 8–9, 10.
- Categorizzazione: coppie 1–2, 3–4, 5–6, 7–8, 9–10. Mantenimento: 1–5 / 6–10.
- Switching bivalente e Stop-Signal con interferenza: minimo livello 6 (soglie di
  coerenza interna, non dati di letteratura).

### 1.4 Casi particolari
- **Stop-Signal**: lo SSD (ritardo del segnale di stop) segue una scala: fermarsi
  con successo lo allunga (più difficile), fallire lo accorcia. L'ISI generale è
  una leva secondaria alimentata solo dalle prove "go".
- **Doppio compito**: due livelli indipendenti (uno per canale), ciascuno con la
  regola 70/85; l'ISI condiviso segue la media dei due livelli.
- **Neglect**: il livello cambia tavola per tavola. La modalità progressiva ha
  una scala 1–30 (classico 1–10, intruso 11–20, regola 21–30); il conteggio a
  regola ha condizioni cumulative.
- **TAPAT**: il blocco tonico usa un intervallo variabile tra gli stimoli
  (l'imprevedibilità è parte del costrutto). Il gradiente spaziale sinistra/destra
  si sposta di 5 punti (limiti 25–75) quando i due lati differiscono di oltre 15 punti.
- **Running Span**: adatta ogni **4 cicli** (non 8: un ciclo porta molta più
  informazione di una prova) sulla media di accuratezza di posizione e contenuto;
  n massimo 4 (cautela dichiarata).
- **N-back**: n massimo 3, solo al livello 10; il resto della scala viene da
  frequenza dei bersagli e dei "lure" (Kane et al., 2007).

## 2. Screening (`screening.js` + flusso in `index.html`)

1. **Quattro domini**: Memoria di lavoro, Attenzione/inibizione, Flessibilità
   cognitiva, Esplorazione visuospaziale. Il Doppio compito resta un esercizio ma
   non è più proposto in automatico (livello superiore a uno screening rapido).
2. **Tutte le sonde, sempre**: nessuna cascata "se fallisce il base,
   approfondisci". Il confronto è pulito e riproducibile; la regola di dominio
   legge il **pattern** di chi ha fallito, non solo quanti. Ogni sonda è breve e a
   difficoltà **fissa** (16 prove; Running Span 4 cicli).
3. **Soglia di fallimento**: accuratezza < **0,70** (stessa soglia della
   titolazione).
4. **Forma verbale e non verbale**: le sonde che la prevedono possono essere
   somministrate in entrambe le forme (la non verbale è la stessa configurazione
   con il solo materiale cambiato). Una sonda "fallisce" se cede in almeno una
   forma; resta visibile quale (verbale / non verbale / entrambe).
5. **Regole di suggerimento per dominio**
   - *Attenzione*: ordine ANT → TAPAT → Go/No-Go → Stop-Signal → Stop-Signal con
     interferenza; suggerisce il **più semplice** tra i falliti (punto sicuro da cui
     ripartire). L'ANT è solo screening: se è il primo a cedere, si scivola su TAPAT.
     Simon si aggiunge solo se l'unico a fallire è lo Stop-Signal con interferenza.
   - *Memoria*: un fallimento isolato in Mantenimento/Sequenza/Categorizzazione
     localizza sulla struttura di Categorizzazione più vicina; più fallimenti
     insieme riportano alla struttura base. N-back e Running Span si propongono da soli.
   - *Esplorazione*: suggerisce tutte le modalità di Cancellazione che falliscono.
   - *Flessibilità*: suggerisce il Task-switching.
6. **Giro a carico più alto**: un dominio risultato pulito ovunque è ricontrollato
   con un solo esercizio a livello intermedio (ipotesi di partenza dichiarata). Perché:
   uno screening facile può dare un profilo "pulito" che non regge a un carico maggiore.
   Se cede, il suggerimento ha una nota esplicita.
7. **Coda finale**: Doppio compito sempre in coda; gli Scenari ecologici solo se
   il Doppio compito passa.
8. **Progresso e flag**: il progresso è salvato prima di ogni sonda (uno
   screening interrotto si riprende); i suggerimenti finali si uniscono ai flag
   del paziente.

## 3. Cosa NON è coperto dai test automatici
Il flusso di screening e lo storico paziente non sono simulati dall'e2e: dopo
modifiche a quelle parti, controllare a mano su tablet.
