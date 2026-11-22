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
- **Intruso percettivo** (ruolo «allenamento»: lo screening non lo misura): adatta ogni
  **6 schermate**, stessa regola 70-85%. 10 livelli. **Porting diretto** dell'Intruso del generatore di schede: stesse 31 famiglie
  di simboli, stessa regola (un solo elemento unico, gli altri ≥2 volte), stessa lunghezza
  (1 simbolo, coppie dal livello 9 del generatore, terne dal 21), stessa somiglianza dei tipi,
  stessa numerosità a punteggio unico, stessa impaginazione a griglia piena con cornice sui
  gruppi di simboli. Livelli 1-10 = livelli 1, 4, 8, 11, 15, 18, 22, 25, 29, 32 del generatore.
  Si risponde toccando/cliccando l'elemento. Tempo per schermata da 44 a 32 s (taratura del 15 nov 2026) (ipotesi di
  partenza, da tarare sull'uso clinico). Codice in `js/exercises/intrusopercettivo.js`.
- **Griglie attentive** (ruolo «allenamento»): **porting diretto** delle Griglie-Conteggio del generatore
  (il codice del generatore è copiato invariato in `js/exercises/griglie.js`): stessi simboli (forme,
  frecce, cifre, lettere, misto, cirillico, ideogrammi, ge'ez), colori, rampa di difficoltà e consegne
  (colore, sfondo, bordo, posizione, adiacenza, negazione, «saltando i primi k»…). Ogni griglia ha sempre
  almeno 10 consegne in ordine crescente, una alla volta, griglia sempre visibile; il paziente digita la risposta.
  Livelli 1-10 = 1, 4, 8, 11, 15, 18, 22, 25, 29, 32 del generatore. Tutti i tipi di consegna sono
  supportati, con istruzione «come rispondere» a schermo: un numero; due numeri nell'ordine richiesto
  (doppio conteggio); «quale è più numeroso e di quanti» (si tocca l'elemento, poi la differenza);
  numero di righe/colonne. Adatta a fine griglia
  (almeno 4 risposte), stessa regola 70-85%. «Prove» = numero di consegne.
- **Inversione e riordino** (ruolo «allenamento», 13 nov 2026): porting del generatore (stessi generatori di
  materiale: parole vere fino al gen. 8, non-parole pronunciabili, cifre, misti lettere+cifre dal gen. 11,
  maiuscole/minuscole miste dal gen. 8 (rampa fino al gen. 26); lunghezze 3→6) più elementi **nuovi** (non nel generatore): colore
  (rosso/verde), grandezza del carattere (grande/piccolo) e numeri a più cifre. File `js/exercises/inversione.js`
  e `inversione-data.js`. Livelli 1-10 = 1, 4, 8, 11, 15, 18, 22, 25, 29, 32 del generatore.
  **Tempo FISSO decrescente**: la sequenza resta a schermo ms_per_carattere × n. caratteri (min 1,5 s) e sparisce
  da sola; ms/carattere: 1800, 1650, 1500, 1350, 1200, 1050, 950, 850, 750, 650 (livelli 1-10) — **proposta da
  validare**. Poi tastiera a schermo (niente voce; «Spazio» per i numeri a più cifre); la risposta non ha limite
  di tempo, si misura il tempo di risposta. **Consegne a rotazione** (mai la stessa due volte di fila),
  scritte a schermo: dal L1 inverti, riordina; L2 vocali, consonanti; L3 posizioni dispari/pari, pari/dispari,
  ordine inverso; L4 solo rossi/verdi e numeri a più cifre; L5 solo MAIUSCOLE/minuscole, scritti in grande/piccolo.
  **Consegne DOPPIE** (criterio di riconoscimento colore/grandezza/maiuscolo-minuscolo/cifra-lettera + ordine,
  «solo i rossi al contrario», «prima i grandi poi i piccoli, ciascun gruppo in ordine alfabetico»): dal L6 con
  probabilità 20-35-50-65-80% (L6-L10). Ai livelli alti compaiono anche colori irrilevanti (distrattori). Correzione
  automatica: sequenza esatta + punteggio parziale per posizione. Adatta ogni **4 sequenze** (70-85% di esatte).
  Il menu permette di fissare una consegna singola, o «solo doppie». Il colore rosso/verde è quello del generatore
  (attenzione al daltonismo se serve: cambiare in rosso/blu).
- **Serie alternate = «struttura 6» di Categorizzazione condizionale** (14 nov 2026, fusione vera: un solo motore,
  un solo storico sotto «Categorizzazione condizionale»; `cfg.categTipo='serie'`, generazione in `genCategTrial`).
  Le vecchie sedute «Serie alternate» restano leggibili nello storico; la vecchia scheda si converte con un pulsante. Nel menu
  c'è una sola scheda; «Tipo di prova» sceglie fra «Categorie (strutture 1-5)» e «Regole di Serie (A/B/1/2)».
  Stessa scala: livelli 1-10 a bande doppie (1-2, 3-4, 5-6, 7-10) + livello 11 (2-back, «extrema ratio», solo
  con l'adattivo dopo il 10; in Categorizzazione la scala resta a 10). Le regole di Serie (32 del generatore) entrano
  per banda — 1-2: 1, 2, 3, 5 · 3-4: 4, 6 (✕ = No-Go) · 5-6: 7-15 (identità → 4 risposte) e 17-20 (incroci con «o») ·
  7-10: 21-22 e 23-28 (stimolo precedente) · 11: 29-32 (due posti prima); la 16 coincide con il livello 3 di
  Categorizzazione e si sceglie solo a mano. A ogni seduta la regola è una a caso della banda, la stessa per tutta la
  seduta; l'adattivo (ogni 8 risposte, 70-85%) si muove dentro la banda. Ritmo (ms per stimolo): livelli 1-8 della
  scala originale di Serie (3500, 3200, 3000, 2800, 2800, 2600, 2600, 2400); 9, 10, 11 (2400, 2200, 2600) sono una
  **proposta da validare**. Quattro pulsanti a schermo (destra, sinistra, «Sì», «No»); la regola si può fissare a
  mano (1-32). Livello e storico sono unici (chiave `categorizzazione`); il livello 11 esiste solo con il tipo «Regole di Serie».
  Per le sedute in presenza e a distanza vale il livello salvato per paziente.
- **PASAT / PVSAT con operazione** (ruolo «allenamento»): adatta ogni **8 risposte**.
  Tre materiali (somme di cifre, giorni della settimana, mesi); risposta a tocco entro il
  ritmo, altrimenti omissione. Dal livello 4 il ritmo si stringe, dal 7 la regola
  riguarda lo stimolo di due posti prima. Tabelle in `js/exercises/pasat.js`.
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

## Aggiornamenti del 14 novembre 2026 (sera)

- **Durata a minuti** (tutti gli esercizi a prove, non Cancellazione/Compito a obiettivi/Memoria): `cfg.durataMin > 0`;
  il numero di prove interno diventa 999 e un timer lo chiude alla prova in corso. Il numero di prove svolte è quello salvato.
- **Riscontro per prova** (✓ verde / ✗ rosso, `cfg.feedbackProva`, predefinito sì): Intruso, Griglie, Running span, Inversione,
  PASAT, Categorizzazione/Serie. Non attivo nelle sonde di screening.
- **Inversione e riordino**: predefinito 24 sequenze; la consegna compare DOPO la scomparsa dello stimolo; 1-3 consegne diverse
  sulla stessa sequenza (`INVERSIONE_NCONS_P`, **ipotesi da validare**: 1 sola ai livelli 1-2, spesso 3 ai livelli 9-10);
  **Consegne doppie anticipate (22 nov 2026, richiesta di Rodrigo: con sole consegne singole era troppo facile per troppo tempo)**: probabilità
  per livello 1-10 = 0, 0, 20, 30, 40, 50, 55, 65, 75, 80 % (prima 0 fino al 5, poi 20-80). Dal livello 3 con criteri già noti dalle singole
  (vocali/consonanti sulle lettere, pari/dispari su cifre e numeri), con colore dal 3, con grandezza e maiuscole dal 4, cifra/lettera dal 5;
  nessun criterio compare in una doppia prima di essere comparso tra le singole.
  **Opzione «Ordine alfabetico: Escluso (DSA)»** (`cfg.inversioneNoAlfa`, nel Setup, salvata nei preset): su lettere e alfanumerici niente «riordina», «Z–A»
  né ordinamenti alfabetici nelle doppie; restano inverso, vocali/consonanti, posizioni, colore ecc. Sulle cifre e sui numeri l'ordine crescente resta.
  Livello, tempi e progressione non cambiano (cambiano solo le consegne estratte).
  **Scala di complessità definitiva (22 nov 2026, approvata da Rodrigo)** — sostituisce i livelli di comparsa indicati sotto per colore/grandezza/tipologia:
  colori presenti negli stimoli 1 (rosso) al livello 2, 2 (+verde) al 3, 3 (+blu) dal 5 (colori uguali e diversi nella stessa stringa); singole: 1 inverti,
  riordina · 2 grandi/piccoli, rossi · 3 pari/dispari, verdi · 4 vocali/consonanti, maiuscole/minuscole · 5 posizioni pari/dispari, Z–A, blu, **sottolineati**;
  doppie dal 3 (pari/dispari, colore, grandezza), 4 vocali/consonanti, 5 maiuscole e cifra/lettera, 6 sottolineati; una doppia sul colore usa due colori e tutti i caratteri ne hanno uno.
  Richieste per stringa: la 2ª dal livello 2, la 3ª dal 4 (`INVERSIONE_NCONS_P`). Il sottolineato è un attributo del carattere (`under`).
  **Sottolineati anticipati (22 nov 2026, sera)**: consegna singola «Solo sottolineati» dal livello 3 (subito dopo grandi/piccoli, che sono al 2), doppie con sottolineato dal 4
  (sostituisce i livelli 5 e 6 scritti sopra).
  **Principio «selezione sempre accoppiata a manipolazione» (22 nov 2026, Rodrigo)**: le consegne di sola SELEZIONE (rossi, grandi, vocali, pari, posizioni, sottolineati… = «scrivi solo quelli, come compaiono»)
  non compaiono mai da sole, ma sempre insieme a una di MANIPOLAZIONE (inverti, riordina, Z–A: `INVERSIONE_MANIP`), in ordine casuale (prima l'una o prima l'altra). Con 1 richiesta: manipolazione oppure doppia
  (la doppia = filtro + ordine, ha già le due cose); con 2: manipolazione + (selezione o doppia); con 3: due manipolazioni + (selezione o doppia). Con «Ordine alfabetico: Escluso» su lettere e alfanumerici resta
  la sola manipolazione «inverti», quindi lì si arriva al massimo a 2 richieste. Un pool scelto a mano senza manipolazioni ricade sul criterio libero.
  **Attributi anticipati (22 nov 2026, richiesta di Rodrigo: «verde dal 4, maiuscole/minuscole e grande/piccolo dall'8» del generatore)**: le singole
  rossi/verdi sono dal livello Traccia-N 2 (gen. 4), maiuscole/minuscole/grandi/piccoli dal 3 (gen. 8); doppie con colore dal 3, con grandezza e
  maiuscole dal 4, cifra/lettera dal 5. Quota di stringhe a maiuscole miste: 0 fino al gen. 7, poi (gen−7)/19 fino al 100% al 26. Con una consegna su
  maiuscole/minuscole la stringa ha sempre entrambe le forme. Le doppie «a gruppi» non possono dare come risposta lo stimolo identico.
  pool delle consegne spuntabile a mano (`cfg.inversionePool`, vale a tutti i livelli; vuoto = automatico per livello).
- **Intruso percettivo**: predefinito 10 schermate; tempo massimo per schermata modificabile (`cfg.intrusoLimitS`, 0 = tabella
  `INTRUSO_LIMIT_MS`, 44→32 s dal 15 nov, **proposta non validata**). **Griglie attentive**: predefinito 1 griglia = 10 consegne.
- **Cancellazione**: il layout «Organizzato» ora è una griglia regolare (prima celle vuote a caso e scarto ampio → sembrava sparso).
- **Schermo**: Intruso, Griglie, Inversione e Running span usano tutta la larghezza e tasti/caratteri più grandi.
- **Riscontro per prova (correzione)**: non più un lampo a schermo, ma la stessa fila di quadratini verde/rosso delle altre prove,
  anche in Intruso, Griglie, Inversione, Running span, PASAT e Serie.
- **Griglie attentive a tocco** (`cfg.grigliaRisposta`, predefinito `tocco`): il paziente tocca gli elementi che rispettano la
  consegna (ritocca per togliere), preme OK, poi vede ✓ verde (giusti), ✗ rosso (sbagliati), arancione tratteggiato (dimenticati) e
  preme Avanti. Corretta solo con l'insieme esatto. «In quante righe / quale riga» restano a numero. `scoreGrigliaSelection` in `griglie.js`.
- **Cancellazione accorpata**: nelle nuove configurazioni resta solo il Classico (misura, gradiente sinistra/destra). «Trova l'intruso» si
  allena con Intruso percettivo, «Conteggio a regola» con Griglie attentive. Le modalità vecchie compaiono solo nelle configurazioni già salvate.
- Tabella test → esercizio → livello: [tabella-test-esercizi.md](tabella-test-esercizi.md) (bozza).
- **Cancellazione, modalità Progressiva tolta** (14 nov 2026): le configurazioni salvate che la usavano ripartono dal Classico (livello massimo 10, `migrateLegacyNeglect`); lo storico vecchio resta leggibile.


## Livello a mezzi gradini, dispersione delle prove e tempo (14 nov 2026, sera)

Vale per gli esercizi a prove autonome: **Intruso percettivo, Griglie attentive, Inversione e riordino, Running span** (solo in modalità Adattiva; in Manuale e Livello i parametri restano fissi).

- **Livello fine.** Il livello vero della seduta ha la virgola (es. 6,5). Ogni blocco (Intruso 6 prove, Inversione 4, Griglie 4 per schermata, Running span 4 cicli) lo sposta di **mezzo gradino** con la stessa regola 70–85%. È come avere 19 gradini invece di 10, senza toccare le tabelle.
- **Dispersione.** Ogni prova pesca il proprio livello intero attorno a quello vero: 60% lo stesso, 20% uno sotto, 20% uno sopra, poi la parte decimale decide fra i due interi vicini. Agli estremi (1 e 10) la dispersione resta dentro la scala. Il livello di ogni prova è scritto nel registro delle prove (`level`).
- **Tempo.** Una risposta corretta ma più lenta di 1,6 volte la propria mediana (confrontata con prove dello stesso tipo: Intruso tutte insieme; Griglie per tipo di regola, a tocco normalizzato sul numero di bersagli; Inversione per lunghezza) non conta come successo nel blocco. Servono almeno 4 risposte corrette dello stesso tipo prima che il filtro parta. Nel registro delle prove compare `counted` (Intruso). Running span usa già un punteggio graduato e non ha filtro sul tempo.
- **Salvataggio.** `adaptStartLevel` resta intero (arrotondato); il valore con la virgola è in `adaptFine` e nel record della seduta come `finalLevelFine`.
- **Non ancora applicato:** PASAT e Serie (ritmo imposto: il tempo c'è già come finestra di risposta e cambiare passo a ogni prova disorienta) e gli esercizi classici (N-back, Go/No-Go, Sequenza, Stop-signal, ANT, Simon, Switching, Categorizzazione, Cancellazione, Doppio compito, TAPAT), che leggono tabelle di parametri validate a livello intero.


### Aggiornamento 15 nov 2026
- **Punteggio graduato**: Griglie conta di quanto si sbaglia (conteggi: esatto 1, ±1 = 0,7, ±2 = 0,3, oltre 0; tocco: giusti ÷ (attesi + sbagliati)). Il blocco usa la media dei punteggi, non il sì/no.
- **Efficienza accuratezza × velocità** (Intruso, Griglie, Inversione) al posto del filtro sì/no 1,6×: credito = punteggio × fattore velocità. Il fattore è 1 fino a 1,3 volte la propria mediana (per tipo di prova), poi scende in linea retta fino a 0 a 2,1 volte (a 1,6 volte vale circa 0,63). Servono 4 tempi già osservati. Con prove tutte esatte e tempi normali la media del blocco resta ≈ 0,95, quindi la soglia di salita (0,85) è raggiungibile.
- **Colori Griglie**: rosso inchiostro più scuro, verde inchiostro più scuro (contrasto sull'arancio chiaro da 2,9 a ≥3,3), e rosa e arancio chiaro non compaiono più nella stessa griglia (ΔE 41); spessore dei bordi proporzionale alla cella.
- **Profili consigliati** (`js/core/profili.js`): sottoinsiemi di esercizi per tipo di difficoltà (ADHD, DSA, MCI esecutivo, MCI amnestico, negligenza) con livello e durata di partenza; sono ipotesi, si caricano nel Setup e restano modificabili.
- **Cambiamento del singolo paziente** (`js/core/nof1.js`): soglia da intervallo di previsione sulla variabilità delle misure di base (3-5 misure con forme parallele ruotate). Pronto come funzione e testato; **non ancora collegato** a una schermata né a un grafico.
- **Selettore esercizi** a menù esplodibili per dominio (si apre quello dell'esercizio scelto).

- **Intruso (15 nov 2026)**: i livelli 1-10 restano quelli di PdM (livelli del generatore 1, 4, 8, 11, 15, 18, 22, 25, 29, 32); è tarato solo il tempo per schermata (da 44 a 32 s con rialzi dove cambia la lunghezza dell'elemento) per un carico da 0,4 a 2,5 simboli/s. Una taratura che accorciava la scala è stata annullata nello stesso giorno.

## Motore ibrido PdM ↔ Traccia-N (15 nov 2026, sera) — Intruso, Griglie, Inversione

Codice: `js/core/assi.js` (test: `tests/assi.test.js`). Solo in modalità adattiva.

1. **Asse fine sul generatore 1–32.** Il livello «vero» resta un numero 1–10 con la virgola (stesso salvataggio di prima); ogni prova pesca però un **livello intero del generatore** per interpolazione fra 1, 4, 8, 11, 15, 18, 22, 25, 29, 32, con dispersione 50% al centro, 20% ±1, 5% ±2 (prima ±1 livello di Traccia-N = ±3-4 del generatore). Il livello 1–10 mostrato e salvato è quello più vicino.
2. **Transizioni sfumate** (conseguenza della 1): vicino ai confini (elemento da 1→2 simboli al gen. 9, 2→3 al gen. 21, alfanumerico al gen. 11…) la seduta mescola i due lati.
3. **Contenuto e tempo come due manopole.** Fattore tempo `timeF` 0,7–1,3 (passo 0,1), salvato come `adaptTimeF`. Intruso: tempo per schermata = simboli da esaminare ÷ carico atteso (carico da 0,36 a 2,49 simboli/s, +24% per livello, arrotondato a 2 s, minimo 20 s) × `timeF`; se nel Setup si fissa a mano il tempo (`intrusoLimitS`) il fattore non si muove. Inversione: tempo di visione per carattere interpolato sul livello fine × `timeF` (minimo 1,5 s). Griglie: nessun tempo concesso, quindi nessun fattore (la velocità entra solo nel credito di efficienza).
4. **La manopola si sceglie dal blocco** (`decideStep`, soglie 85% / 70% invariate):
   - riuscito: se si era concesso tempo in più, rientra prima quello; Intruso: se il tempo mediano dei giusti è < 50% del concesso si stringe il tempo (−0,1), altrimenti sale il livello (+0,5); Inversione: i blocchi riusciti alternano livello e tempo;
   - non riuscito: Intruso: se almeno metà dei mancati sono tempo scaduto → +0,1 di tempo (livello fermo); Inversione: se i mancati sono «quasi giusti» (parziale medio ≥ 0,5) → +0,1 di tempo di visione; altrimenti scende il livello (−0,5).
   Il tempo si allarga al massimo di 1,3 volte; poi scende il contenuto.
5. Ogni risposta registra `gen` (livello del generatore), `limitMs`/`timeF` dove ha senso; la seduta registra `finalGen` e `finalTimeF`.

**Cosa non è validato:** distribuzione della dispersione (50/20/5), soglia del 50% di margine, passo di 0,1, regola delle «quasi giuste» per Inversione. Sono ipotesi di partenza, da guardare sui dati reali. Griglie ha solo le ipotesi 1–2 (e il credito di efficienza), perché non ha un tempo concesso.

## Accuratezza e velocità in tutti i classici; mezzi livelli (19 nov 2026)

- **Credito per prova** (`pushAdaptOutcome` in `js/exercises/resolve.js`): punteggio × fattore velocità (1 fino a 1,3 × la propria mediana, 0 a 2,1 ×, 4 tempi di storia). Il blocco di 8 prove si valuta sulla media dei crediti (soglie 0,85 / 0,70 invariate). Sostituisce il filtro sì/no «più lenta di 1,6 × la mediana». Doppio compito: un credito per canale con le proprie mediane (`session.respTimes`); Cancellazione: credito per tavola (tempo per bersaglio); Serie: credito per prova. PASAT escluso (ritmo imposto).
- **Mezzi livelli** (`HALF_STEP_MODES` in `js/core/levels.js`): Sequenza, Stop-Signal, ANT/Simon, Switch. Livello con la virgola, parametri interpolati (`lerpLevel`), passo ±0,5, decisione sugli ultimi 2 blocchi se allo stesso livello. Salvataggio: `adaptStartLevel` intero (arrotondato), valore con la virgola in `adaptFine` e `finalLevelFine`. La lunghezza della Sequenza resta quella del livello di partenza (struttura fissa durante la seduta). Tabelle: [tabella-livelli-intermedi.md](tabella-livelli-intermedi.md). Non ancora applicato a Go/NoGo, N-back, Categorizzazione, Doppio compito (fasce strutturali).
- Mappa generale: [guida-titolazione.md](guida-titolazione.md).

## Go/NoGo: mezzi livelli e tabella ISI (20 nov 2026)

- **Mezzi livelli dentro la fascia** (`HALF_STEP_MODES` ora include `gonogo`): le fasce strutturali (1–4, 5–7, 8–9, 10) restano quelle di prima e la seduta non le esce mai; dentro la fascia il livello sale e scende di 0,5 e la frequenza no-go è interpolata (`lerpLevel`). Il numero di elementi no-go cambia solo fra una fascia e l'altra e usa la parte intera del livello. In tutto 16 livelli. Decisione sugli ultimi 2 blocchi, come per gli altri.
- **ISI da tabella** (`ADAPT_ISI.gonogo`, in modalità Livello e Adattivo; in Manuale resta l'ISI del Setup): 2000, 1800, 1650, 1500 | 1800, 1650, 1500 | 1650, 1500 | 1400 ms. Riparte più lenta a ogni fascia per non sommare due salti di difficoltà. **Valori proposti, senza fonte, da tarare sui dati reali.**
- Salvataggio e schermo come per gli altri mezzi livelli: `adaptStartLevel` intero, `adaptFine` e `finalLevelFine` con la virgola; «livello 5,5» a schermo.
- **Dispersione per prova: scelta A** (solo dove le transizioni sono strutturali); Go/NoGo non ne ha.

## N-back: mezzi livelli e tabella ISI (20 nov 2026)

- **Mezzi livelli dentro la banda di n** (1–4: n=1; 5–9: n=2; 10: n=3). La seduta non cambia mai n. Frequenza bersaglio e lure sono interpolate fra i due livelli interi vicini (`nbackParamsForLevel`). In tutto 17 livelli, decisione sugli ultimi 2 blocchi.
- **ISI da tabella** (`ADAPT_ISI.nback`, in modalità Livello e Adattivo): 3000, 2800, 2600, 2400 | 3000, 2800, 2600, 2400, 2200 | 3000 ms; riparte più lenta a ogni banda. **Valori proposti, senza fonte, da tarare sui dati.**
- Salvataggio: `nLevel` intero (arrotondato), `nLevelFine` con la virgola, `finalLevelFine` nel record; «livello 6,5» a schermo.

## Griglie: consegne di posizione e numero di consegne (20 nov 2026)

- Tolte le quattro consegne «nel blocco in alto/basso a sinistra/destra (righe a–b, colonne c–d)».
- Numero di consegne per griglia modificabile (4–30; 10 di norma, comportamento identico a prima). La rampa di difficoltà si allunga in proporzione; con 30 consegne il generatore le produce davvero (verificato).

## Categorizzazione e Doppio compito: mezzi livelli (20 nov 2026)

- **Categorizzazione**: mezzi livelli solo dentro la banda di struttura (1–2, 3–4, 5–6, 7–8, 9–10), 15 livelli; ISI interpolato fra i due livelli (alterna 2200/1300 → 1750 a metà), lure interpolata nella banda 7–8 (0 → 0,30). Vale anche per le regole di Serie (bande 1–2, 3–4, 5–6, 7–10, 11): la regola resta quella del livello di partenza, il ritmo segue il livello. Salvataggio: `categLivello` intero, `categLivelloFine` con la virgola.
- **Doppio compito**: nessuna banda, quindi 19 livelli per canale, con passo ±0,5 e decisione sugli ultimi 2 blocchi dello stesso canale (stesso livello). Frequenza e lure per canale interpolate; l'ISI condiviso segue la media dei due livelli (con la virgola). Salvataggio: `dualStartLevel1/2` interi, `dualFine1/2` con la virgola. Il tasto C1±/C2± manuale resta a passo 1.

## Serie, PASAT e blocchi piccoli: protocollo comune (21 nov 2026)

- **Serie (standalone)**: mezzi livelli dentro la banda della regola (1–2, 3–4, 5–6, 7–10, 11), ritmo interpolato (`serieIsi`), decisione sugli ultimi 2 blocchi (16 risposte) se il livello non è cambiato. La regola resta quella del livello di partenza.
- **PASAT**: prima il livello poteva attraversare la regola a metà seduta (lag 1→2, salto 1→2). Ora ha bande: con le **somme** 1–6 e 7–10 (lag), con **giorni/mesi** 1–3, 4–6, 7–8, 9–10 (lag e salto). Dentro la banda, mezzi livelli e ritmo interpolato (`pasatIsi`), finestra di 2 blocchi. Il credito resta solo accuratezza (ritmo imposto).
- **Intruso (6 prove), Inversione (4), Griglie (4 risposte) e Running span (4 cicli)**: finestra di 2 blocchi — se dall'ultima decisione livello e tempo non sono cambiati, la decisione guarda il blocco precedente insieme all'attuale (12, 8, 8 e 8 prove/cicli equivalenti). Per Intruso e Inversione anche l'analisi dell'errore (omissioni, quasi-giuste, tempo mediano) usa la finestra. Funzioni `windowOf` / `windowKeep` in `core/adapt.js`.

## TAPAT e Cancellazione (Neglect): mezzi livelli (21 nov 2026)
- **TAPAT**: la finestra di attesa del blocco tonico è interpolata fra due livelli interi (es. livello 2,5 = 1,7–3,3 s); livello e «Fine» salvati come negli altri esercizi.
- **Cancellazione, modalità Classico/Intruso/Regola**: numero di elementi e tempo limite interpolati (il «nessun limite» resta tale finché uno dei due estremi non ha limite); la struttura (regola, fase) segue il livello intero inferiore. Decisione sulle ultime 2 tavole se il livello non è cambiato.
- **Cancellazione a conteggio binario**: prima un solo numero faceva salire/scendere di un livello (regola 1 su/1 giù, che converge al ~50%); ora si decide a blocchi di 4 tavole con soglie 85/70% e finestra di 2 blocchi.
- La modalità Regola ora parte dal livello regola salvato (prima poteva ripartire dal livello della modalità Classico).

## Intruso: scala con orientamenti (22 nov 2026)
Identico = stesso simbolo E stesso orientamento: due simboli uguali con orientamento diverso valgono come elementi diversi; l'unico deve essere unico anche per orientamento. Niente immagini speculari.

**La rotazione riguarda solo le famiglie con pochi stimoli: semi delle carte e note musicali.** Le altre famiglie a pool piccolo non si possono ruotare senza ambiguità (verificato confrontando le immagini ruotate): cerchi pieni a metà e quadranti ruotati di 90° diventano un altro glifo dello stesso gruppo, i dadi sono uguali a se stessi a 90° o 180°. Nei semi sono tolti ♦ ♢, nelle note ♮ ♯ (simmetrici a 180°). Con i due gruppi rimasti tutti gli 8 angoli risultano distinti.

| Liv. Traccia-N | Elemento | Orientamenti | Famiglie |
|---|---|---|---|
| 1 | singolo | nessuno | semplici |
| 2 | singolo | nessuno | + scritture non familiari (greco, cirillico, armeno, Braille…) |
| 3 | singolo | 4 (0/45/90/135) | solo semi e note |
| 4 | singolo | 8 | solo semi e note |
| 5 | coppia | nessuno | tutte |
| 6 | coppia | 4 | solo semi e note |
| 7 | coppia | 8 | solo semi e note |
| 8 | terna | nessuno | tutte |
| 9 | terna | 4 | solo semi e note |
| 10 | terna | 8 | solo semi e note |

- **Rotazione = variante minoritaria (22 nov, sera)**: a questi livelli solo circa 1 prova su 6 (`ROT_SHARE`) usa semi o note ruotati; tutte le altre usano le altre famiglie senza rotazione. Numerosità e lunghezza seguono il livello come sempre. Tempi per schermata ricalcolati sul materiale misto (`INTRUSO_LIMIT_MS`).
- La cornice (coppie e terne di simboli) resta sempre dritta; ruotano solo i simboli dentro. Il corpo si riduce perché l'elemento ruotato resti nella cella.
- Coppie dal livello del generatore 13 (prima 9), terne dal 24 (prima 21); tempi per schermata ricalcolati a parità di carico (+23% a livello).

## Passaggio dei livelli con PdM generator (22 nov 2026)

Per tenere il passo tra le sedute in presenza (PdM generator) e il lavoro da remoto (Traccia-N) i livelli viaggiano con un **codice breve** da copiare e incollare, es. `PDM-I12-G8-V15-87` (I = Intruso percettivo, G = Griglie, V = Inversione e riordino; livelli sempre sulla scala 1-32 del generatore; le ultime due cifre sono un controllo contro gli errori di battitura). Contiene solo livelli: nessun nome, nessun dato clinico. Il paziente di Traccia-N e il gruppo di PdM si scelgono ciascuno nella propria app: non serve alcuna corrispondenza.

- **Da PdM a Traccia-N**: Setup → «Passaggio livelli con PdM» (con il paziente scelto) → incolla il codice → «Applica». Per ciascun esercizio presente nel codice il livello di partenza del paziente diventa il livello fine corrispondente, **arrotondato per difetto a mezzo livello** (si parte sempre un po' sotto, mai sopra); il resto della configurazione salvata per quell'esercizio resta com'è.
- **Da Traccia-N a PdM**: la stessa sezione mostra il codice `TRN-…` con i livelli raggiunti dal paziente (gli esercizi mai fatti sono omessi), da incollare nel pannello di PdM.
- Codice e conversioni: `js/core/passaggio.js` (stessa costruzione e controllo di PdM `js/passaggio.js`); prove in `tests/passaggio.test.js` e `tests/e2e/passaggio.test.js`.
