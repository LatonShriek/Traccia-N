# Gestione pazienti

_Programma, modalità di accesso, obiettivi, limiti, RCI, archiviazione. Spostato da `README.md` (passo 7) senza modifiche al testo; indice generale nel [README](../README.md)._

## Gestione pazienti: programma, modalità di accesso, obiettivi, limiti, RCI, archiviazione

**Programma assegnato** — dalla schermata "Gestisci programma", identica
per pazienti remoti e in presenza, l'operatore costruisce il programma un
esercizio alla volta: **"+ Aggiungi esercizio personalizzato"** porta
dritto a Setup, dove si configura l'esercizio (livello, materiale,
parametri) e si preme "+ Aggiungi al programma" — il nome viene generato
automaticamente, senza doverlo scrivere a mano, e si resta su Setup
pronti a configurare il successivo prima di tornare al programma. Se il
nome proposto coincide con una voce già presente nel programma (es. due
varianti di Cancellazione con stesso materiale e livello, o due voci
aggiunte senza cambiare i parametri fra l'una e l'altra), l'app aggiunge
da sola un contatore leggibile ("(2)", "(3)"...) invece di lasciare due
voci identiche indistinguibili nell'elenco. In alternativa, se sul
dispositivo esistono già preset salvati non ancora assegnati a questo
paziente, compaiono in una "libreria" con un tocco per aggiungerli così
come sono. Ogni voce del programma si rimuove singolarmente, senza
toccare le altre. Per un paziente remoto il programma è ciò che vede e
può avviare da solo a ogni accesso. Per un paziente in presenza è una
scorciatoia di continuazione: toccando il nome del paziente nell'elenco
"Paziente in presenza", l'operatore sceglie ogni volta fra **"Setup
libero"** (esercizio estemporaneo, come prima) e **"Programma"** (apre
"Gestisci programma") — nessuna delle due è un vincolo, resta libero di
lanciare qualunque altro esercizio in qualsiasi momento. Ogni voce del
programma ha tre azioni: **"▶ Avvia"** (riprende l'esercizio subito, al
livello adattivo raggiunto in QUELLA voce — non l'ultimo esercizio fatto
in assoluto — saltando Setup e andando dritto alle istruzioni: stessa
logica di "Inizia" nella scheda del paziente remoto autonomo),
**"Modifica"** (riapre Setup con quella configurazione, sostituisce la
voce invece di aggiungerne una — preserva la provenienza da screening se
presente, con una nota che confronta il livello suggerito originariamente
con quello attuale) e **"✕ Rimuovi"**. Un **tempo consigliato** opzionale
(minuti al giorno o totali) è impostabile per ciascuna voce, mostrato al
paziente accanto all'esercizio.

**Modalità di accesso** (solo pazienti remoti) — scelta alla creazione
del profilo, modificabile in seguito da "Gestisci programma":
- **Diretto**: il paziente vede subito il programma assegnato sopra.
- **Solo screening all'inizio**: al primo accesso il paziente vede solo
  l'ingresso alla batteria di screening, non il programma. Al termine,
  i domini risultati sotto soglia (vedi sezione "Batteria di screening
  iniziale") vengono **autorizzati automaticamente** nel programma
  assegnato — il paziente li vede da quel momento senza bisogno di un
  intervento manuale dell'operatore. Il gate scatta **una sola volta**:
  una volta superato, il paziente vede sempre il programma direttamente,
  anche se l'operatore lancia altri screening in seguito.

**Risultati screening e suggerimenti → programma** — tutto accessibile da
un unico posto: "Gestisci programma" (pazienti remoti) o "Assegna
programma" (pazienti in presenza). Lì trovi, oltre alla selezione multipla
dei preset:
- il **quadro completo dell'ultimo screening** — tutti i domini testati,
  non solo quelli flaggati, con accuratezza base/caricato per ciascuno;
- i **suggerimenti attivi** (⭐), con due azioni: **"+ Aggiungi"** li
  trasforma subito in una voce reale del programma (con una
  configurazione di partenza già tarata su quel dominio, adattiva),
  **"✕"** li scarta. È la stessa leva usata dall'autorizzazione
  automatica del gate — la differenza è solo se scatta da sola alla
  prima valutazione o se la usa l'operatore a mano, anche ripetutamente;
- un pulsante per **fare (o rifare) lo screening** direttamente da qui.

Solo l'ultimo screening completo resta consultabile (non uno storico di
tutti quelli fatti); i suggerimenti invece si accumulano nel tempo tra
uno screening e l'altro, a meno di essere scartati a mano. Le liste
pazienti (remoti e in presenza) mostrano solo un conteggio dei
suggerimenti attivi, come promemoria — la gestione vera è sempre nel
profilo.

**Eredità da un profilo in presenza** — il pulsante "Trasforma in
account remoto" (disponibile ovunque sia selezionato un paziente in
presenza) porta con sé, oltre allo storico già registrato, anche il
programma assegnato e i suggerimenti da screening del profilo locale,
se presenti. Il nuovo account remoto parte in modalità "Diretto".

**Obiettivi** — disponibili sia per pazienti remoti sia per pazienti in
presenza, stessa struttura dati e stessa sezione in "Gestisci programma"
per entrambi (persistita su `pazienti.obiettivo` o
`pazienti_locali.obiettivo` a seconda del tipo). Un paziente può averne
più di uno contemporaneamente, di due tipi: **livello** (un livello
target su un esercizio specifico, tetto massimo coerente con la scala
reale di quell'esercizio — 10 per la maggior parte, 16 per Chunking/
PQRST, 30 per Cancellazione in modalità Progressiva, 5 per gli Scenari
ecologici; il Doppio compito è escluso, avendo due canali/livelli
indipendenti non riducibili a un solo numero) o **tempo** (minuti di
allenamento accumulati, a settimana o in totale, indipendentemente
dall'esercizio). Facoltativi: senza obiettivi impostati il paziente si
allena normalmente. Per un paziente remoto autosomministrato, la barra è
mostrata nella sua scheda e a fine sessione; per un paziente in presenza,
la barra è mostrata all'operatore in "Gestisci programma" e — visto che
lo schermo è condiviso durante la seduta — anche al termine di ogni
esercizio nella schermata Risultati, esattamente come per il remoto. Il
paziente vede solo una barra percentuale per ciascuno, senza etichetta;
l'operatore vede la stessa barra con l'etichetta completa. Per un
obiettivo di livello, il progresso non salta a scatti del 20% per
livello: usa l'accuratezza dell'ultima sessione confrontata con le soglie
70-85% per dare una posizione continua dentro il livello corrente
(eccezione: lo Stop-Signal resta a gradino secco, essendo guidato dallo
staircase SSD e non dalla regola 70-85%). Il progresso di un obiettivo di
livello legge il livello raggiunto dal campo corretto per ciascun
esercizio (lo stesso usato dalla titolazione adattiva) — Categorizzazione
condizionale, Chunking/PQRST e Scenari ecologici hanno ciascuno il
proprio campo dedicato, distinto da quello usato da N-back/Cancellazione/
Go-No-Go/ecc.

**Limiti giornalieri** — numero massimo di sessioni e/o minuti al giorno,
impostabili indipendentemente.

**Archiviazione** — pulsante "Archivia"/"Riattiva" su ciascun paziente
remoto. Un profilo archiviato: il paziente non può più accedere da solo
(login bloccato con messaggio esplicito), ma resta visibile all'operatore
(etichettato "archiviato"), utilizzabile per sedute in presenza, e il suo
storico/report restano consultabili. "Riattiva" lo riporta come prima,
stesso codice di accesso. Diverso da "Elimina", che resta distruttivo.

**Storico sessione-per-sessione** — pulsante "Storico" su ciascun
paziente, remoto o in presenza: elenco cronologico di ogni sessione con
esercizio, livello, accuratezza. Diverso dal report RCI sotto, che è un
confronto aggregato, non un elenco.

**Valutazione RCI (Reliable Change Index)** — pulsante "Genera report
RCI", disponibile sia per pazienti remoti sia per profili in presenza.
Confronta la media delle **prime sessioni** (baseline) con la media delle
**ultime sessioni disponibili al momento del calcolo**, per ciascun
esercizio — non sessione per sessione: pensato per essere lanciato quando
si vuole fare il punto su una fase di trattamento, non ad ogni export.
Servono almeno 4 sessioni sullo stesso esercizio. Scarica un CSV separato
(`traccian_rci_<codice>.csv`) con, per ciascun esercizio: sessioni
totali, media baseline, media finale, valore RCI, se il cambiamento è
significativo (soglia ±1.96). I valori di affidabilità test-retest usati
nel calcolo sono stime prudenti di default (0.65-0.75 a seconda
dell'esercizio) — se hai valori più precisi dalla letteratura per un dato
paradigma, si correggono nella costante `RCI_RELIABILITY` nel codice.

**Controllo di comparabilità: l'RCI si rifiuta di calcolare un numero
quando le sessioni confrontate non sono comparabili.** Un cambiamento di
accuratezza fra sessioni con parametri diversi (livello, ISI, numero di
prove, frequenza bersaglio/no-go, modalità di titolazione Manuale/
Livello/Adattivo) misurerebbe quanto è cambiato il compito, non quanto è
cambiato il paziente — l'assunzione di base di Crawford & Howell (stessa
misura, stesse condizioni) salterebbe silenziosamente. Confrontare il
livello 1 con il livello 10 dello stesso esercizio ha esattamente lo
stesso problema di un ISI diverso fra le due sedute: **stesso controllo,
non un caso a parte**. Quando viene rilevato uno scostamento sostanziale,
il CSV e il report stampabile mostrano comunque le medie grezze (dato
legittimo da guardare per quello che è) ma **non** il numero RCI, insieme
al motivo specifico dello scostamento. Questo controllo dipende dai
parametri registrati per ciascuna sessione (colonne `titration_mode` e
`target_rate` nella tabella `sessioni`, vedi schema Supabase) — per le
sessioni registrate prima di questa consegna, o per pazienti in cloud
finché non si aggiungono quelle due colonne, il dato è assente e il
controllo lo tratta come "non verificabile", non come "sicuramente
comparabile": non blocca un confronto per un dato che semplicemente non
c'è ancora, ma nemmeno lo dichiara valido senza prove.

**Sessioni di verifica a parametri fissi — proposta non ancora
implementata.** Il modo più solido per garantire confrontabilità nel
tempo, discusso ma non ancora costruito: periodicamente, invece di
confrontare sedute di allenamento (che si spostano di proposito, in
Livello/Adattivo), far svolgere una seduta a una configurazione FISSA di
riferimento, usata solo per la misura — l'allenamento vero e proprio
resta libero di muoversi a qualunque livello serva clinicamente, senza
dover scegliere fra "titolare bene" e "poter confrontare bene".
