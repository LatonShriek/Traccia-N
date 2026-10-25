# Difficoltà adattiva

_Titolazione, livelli e regole di adattamento, esercizio per esercizio. Spostato da `README.md` (passo 7) senza modifiche al testo; indice generale nel [README](../README.md)._

## Difficoltà adattiva

Quasi tutti gli esercizi (N-back, Sequenza bersaglio, Go/No-Go, ANT/TAPAT,
Task-switching, Doppio compito, Cancellazione) condividono la stessa
regola di titolazione: valutano blocchi di 8 prove valide (o, per la
Cancellazione, ogni tavola), salgono di un livello sopra l'85% di
accuratezza, scendono sotto il 70% (fascia 70–85% invariata). La soglia è
coerente sia con la letteratura sul training adattivo sia con la
"Eighty Five Percent Rule" (Wilson et al., 2019) sul tasso di errore
ottimale per l'apprendimento. Durante la sessione sono sempre disponibili
i pulsanti +/– nella barra in alto per forzare il livello manualmente in
qualunque momento; se la titolazione automatica è attiva riprende dal
valore impostato manualmente. In Setup, un campo **"Livello"** (o
"Livello canale 1/2" per il Doppio compito) imposta il livello di
partenza prima di iniziare — separato dall'interruttore "Difficoltà
adattiva/fissa", che decide solo se quel livello resta fisso o evolve
durante la sessione.

**Vincolo di fascia strutturale — nessun cambio di regola a metà seduta.**
Per un sottoinsieme di esercizi il livello non cambia solo un parametro
continuo (ISI, frequenza) ma la REGOLA stessa del compito — quanti
elementi indietro confrontare nell'N-back (n), quanti elementi no-go sono
noti nel Go/No-Go, quale struttura di categorizzazione, quale
sotto-modalità di Cancellazione, quali condizioni della regola composta.
Un cambio di questo tipo richiede che il paziente ne sia stato informato
in anticipo (istruzioni lette/ascoltate in Setup prima di iniziare) — non
può mai comparire per la prima volta a sorpresa a metà di una sessione
già in corso, indipendentemente da quanto bene stia andando.

Per questo, la titolazione automatica di questi esercizi resta vincolata
dentro la **fascia strutturale del livello di partenza** per l'intera
durata della seduta, in entrambe le direzioni (non sale oltre il
soffitto della fascia anche a punteggio pieno, non scende sotto il
pavimento della fascia anche a punteggio nullo):

| Esercizio | Fasce (stessa regola dentro ogni fascia) |
|---|---|
| N-back | 1-4 (n=1) · 5-9 (n=2) · 10 (n=3) |
| Go/No-Go | 1-4 (1 elemento noto) · 5-7 (2) · 8-9 (3) · 10 (4) |
| Categorizzazione condizionale | 1-2 · 3-4 · 5-6 · 7-8 · 9-10 (una struttura per fascia) |
| Cancellazione — Progressiva | 1-10 Classico · 11-20 Trova l'intruso · 21-30 Conteggio a regola |
| Cancellazione — Conteggio a regola | 1-2 · 3-4 · 5-6 · 7-10 (una condizione in più per fascia) |

Il superamento di una fascia resta comunque possibile — solo non nella
stessa seduta: il livello raggiunto a fine sessione diventa il punto di
partenza della sessione successiva (stesso meccanismo di continuità già
usato per tutti gli esercizi), e le istruzioni della nuova fascia vengono
mostrate/lette di nuovo in Setup prima che quella sessione inizi. Il
forzamento manuale del livello (pulsanti +/– durante la sessione) resta
invece libero di attraversare le fasce: è una decisione esplicita
dell'operatore, non un salto silenzioso dell'algoritmo.

Gli esercizi non elencati in tabella (Sequenza bersaglio, Stop-Signal,
ANT/TAPAT, Task-switching, Doppio compito) non hanno questo vincolo
perché il loro livello cambia solo parametri continui — la regola di
risposta resta identica a ogni livello.

**Materiali uditivi.** Oltre ai materiali visivi (lettere, numeri,
simboli, colori), sono disponibili toni puri ("Suoni") e lettere/numeri/
parole pronunciati dal sintetizzatore vocale ("Lettere pronunciate" /
"Numeri pronunciati" / "Parole pronunciate") — nessuna rivelazione
visiva, solo un indicatore audio generico. Disponibili in N-back,
Sequenza bersaglio, Go/No-Go, TAPAT, Doppio compito (abbinamento
uditivo-uditivo) e, per i livelli a dimensione singola (1-2, 7-8), nella
Categorizzazione condizionale. Lo Stop-Signal accetta i toni puri
("Suoni") ma non ancora le varianti pronunciate: il segnale di stop è
già un tono fisso e distinto da qualunque stimolo (140Hz, diverso dai
toni del pool principale), ma se lo stimolo primario fosse una parola
pronunciata non c'è oggi un modo per interromperla quando scatta lo
stop — da risolvere prima di abilitarla anche lì. Non ancora disponibili
per ANT classico (materiale spaziale/direzionale intrinsecamente
visivo), Task-switching e Categorizzazione condizionale ai livelli a
doppia dimensione (3-6, 9-10) — richiedono uno stimolo uditivo che porti
due dimensioni classificabili insieme, non un semplice collegamento a un
materiale già esistente. Cancellazione (neglect) resta esclusa per
costruzione: è ricerca visiva su tutta una tavola, non ha un equivalente
uditivo dello stesso compito.

**"Materiale misto".** In N-back, Sequenza bersaglio e Go/No-Go è
possibile scegliere fra "Un solo tipo" e tre varianti di mescolamento
casuale prova per prova: **"Mescolato visivo"** (solo fra lettere,
numeri, colori, simboli), **"Mescolato uditivo"** (solo fra suoni,
lettere/numeri pronunciati) e **"Mescolato visivo + uditivo"** (tutti
insieme) — tre varianti distinte, non un'unica modalità indifferenziata. Non ancora estesa
a TAPAT/ANT né a Task-switching.

**Proposta automatica per sequenze/materiali personalizzati.** Ovunque
l'operatore debba comporre a mano una sequenza bersaglio o un insieme di
elementi no-go — anche quando il materiale è misto fra più tipologie
(visivo/uditivo) — l'app propone subito una selezione casuale, mai
vuota, senza duplicati; resta interamente modificabile dopo con "←
Rimuovi ultimo", "Reimposta", o aggiungendo/togliendo elementi a mano.
Per il Go/No-Go la quantità proposta segue direttamente il livello
impostato (tabella sotto, 1→4 elementi attivi): cambiare lo stepper del
livello, o il materiale, ripropone automaticamente il numero corretto di
elementi no-go, riusando quelli già scelti dall'operatore quando
possibile invece di ricominciare da zero. Il pool selezionabile in Setup
ha comunque un tetto di 4 (non 6): il numero di elementi *nel pool* non
va confuso con il numero *attivo* a un dato livello quando l'adattivo è
acceso — quest'ultimo segue la tabella sotto.
Per la Sequenza bersaglio bastano **3** elementi, perché lì il
meccanismo è diverso: la sequenza configurata viene riciclata/ripetuta
per raggiungere la lunghezza richiesta dal livello (fino a 5), non
"tagliata" da un pool più ampio come nel Go/No-Go. Stesso principio nel
Doppio compito: scegliendo l'abbinamento canali (Visivo+Uditivo,
Visivo+Visivo, Uditivo+Uditivo) il materiale dei canali visivi viene
proposto a caso — nel caso Visivo+Visivo, sempre due materiali diversi
fra i due canali, per restare visivamente distinguibili — e resta
modificabile subito dopo dai selettori. Nell'abbinamento Uditivo+Uditivo
i due toni sono separati con panning stereo netto (grave a sinistra,
acuto a destra, Web Audio `StereoPannerNode`, stessa tecnica già usata
per la componente spaziale del TAPAT uditivo) — senza cuffie o casse
stereo funzionanti i due toni restano udibili ma non distinguibili
spazialmente, e l'app lo segnala esplicitamente in setup e nelle
istruzioni pre-sessione.

**Accessibilità.** Tutti i controlli dell'app sono elementi `<button>`
nativi, riconoscibili e navigabili dai lettori di schermo (VoiceOver,
TalkBack) senza bisogno di attributi aggiuntivi. Da computer, oltre alla
mappatura A/L (2 scelte) e A/L/Z/M (4 scelte), la barra spaziatrice
risponde negli esercizi a un solo pulsante (N-back, 1-back...). Le
istruzioni lette a voce ("🔊 Ascolta") includono anche il promemoria
della scorciatoia da tastiera, non solo il testo dell'esercizio, così
chi si affida solo all'audio la sente comunque.

**Sintesi vocale.** La voce usata per materiali pronunciati e istruzioni
lette è la Web Speech API del browser, non audio pre-registrato — la
qualità e l'accento dipendono quindi dal motore disponibile su
dispositivo/browser, non regolabili dall'app. `speechSynthesis.getVoices()`
è tipicamente popolato in modo asincrono dal browser: l'app mantiene una
cache delle voci disponibili aggiornata tramite l'evento `voiceschanged`,
così anche la primissima frase pronunciata in sessione seleziona già una
voce italiana esplicita (preferendo, quando disponibile, una voce
etichettata "natural/neural/premium/enhanced/online") invece del default
generico del sistema.

**Barra superiore uniforme.** Ogni schermata usa la stessa barra piena in
cima (titolo + azioni, incluso "← Indietro"), mai un link di testo in
fondo pagina — comportamento unico in tutta l'app, non solo nelle
schermate di sessione/operatore.

Su tablet/smartphone, il
toggle **"Zone di risposta grandi"** in Setup (visibile quando la
risposta è a due scelte) ingrandisce le zone toccabili a gran parte
dello schermo — pensato per bassa vista, dove individuare un pulsante
piccolo con precisione è difficile; non cambia nulla su computer, dove
la tastiera resta l'alternativa.

**Il numero di livelli varia per esercizio.** La scala non è uniforme
perché il numero di livelli riflette quanti step distinti i parametri di
un compito possono effettivamente sostenere con significato clinico, non
una convenzione fissa: dove un secondo parametro può scalare insieme al
primo (es. un ISI che si aggiunge a una frequenza), il compito guadagna
margine sia a pavimento (deficit marcati) sia a soffitto (prestazioni
forti):

**Modello triplice di titolazione — Manuale / Livello / Adattivo.**
Descritto qui per i 7 esercizi con stepper "Livello" pienamente
condiviso (N-back, Go/No-Go, Task-switching, Sequenza bersaglio,
Stop-Signal, ANT classico, Simon) — la stessa idea si applica, con le
varianti dichiarate caso per caso più sotto, a tutti gli altri 5 esercizi tranne
Scenari ecologici e Strategie di memoria (vedi il riepilogo dopo la
tabella dei livelli). Il clinico sceglie fra tre modalità, cambiabili
liberamente fra una seduta e l'altra (mai dentro una sessione in corso)
dal profilo del paziente ("Gestisci programma") o da Setup:

- **Manuale**: ogni parametro (ISI, frequenza bersaglio/no-go, intervallo
  cue→stimolo, sbilanciamento fra regole, lunghezza sequenza — secondo
  l'esercizio) è impostato singolarmente in Setup, indipendente dal
  livello. Lo stepper "Livello" resta visibile ma non pilota nulla.
- **Livello**: lo stepper "Livello" pilota tutti i parametri collegati
  secondo la tabella di quell'esercizio (le stesse tabelle ADAPT_* usate
  dalla titolazione adattiva), che restano fissi per l'intera seduta.
- **Adattivo**: come Livello, ma il livello stesso si sposta da solo
  durante la seduta secondo la regola 70-85%/8 prove (Wilson et al.,
  2019) — invariato rispetto a prima.

In ogni modalità, Setup mostra sempre per esteso a cosa corrisponde
esattamente ciò che sta per partire — un numero di livello da solo non
basta in Manuale (dove non pilota nulla): lì compaiono i valori dei
singoli parametri correnti, non un numero di livello. La stessa
indicazione compare anche nel profilo, insieme ai tre pulsanti per
cambiare modalità senza dover riaprire Setup — e riflette sempre l'ultima
configurazione **davvero raggiunta** in sessione per quel paziente/
esercizio (non quella salvata quando l'esercizio fu assegnato la prima
volta), la stessa fonte già usata da "▶ Avvia".

**Configurazioni salvate per paziente, con un nome a scelta.** Distinto
dal livello raggiunto automaticamente ad ogni seduta (che viene sempre
sovrascritto): dentro il flusso "aggiungi/modifica esercizio nel
programma" di un paziente, un pulsante permette di salvare la
configurazione corrente con un nome scelto dall'operatore (es. "Livello
base", "Rivalutazione marzo") — resta ferma finché non la si sovrascrive
esplicitamente con lo stesso nome, indipendentemente da quante sedute
avvengono nel frattempo con parametri diversi. Più slot per lo stesso
paziente/esercizio, richiamabili in un tocco. Salvare due volte con lo
stesso nome sovrascrive quella voce, non ne crea una seconda.

**Bug di sincronizzazione corretto (era la domanda bloccante della
consegna precedente).** Prima di questa modifica, in modalità fissa
(oggi "Manuale") cambiare il livello in Setup non aggiornava quasi
nessun parametro reale: la frequenza bersaglio dell'N-back, la frequenza
no-go del Go/No-Go, l'intervallo cue→stimolo e lo sbilanciamento delle
regole del Task-switching, la lunghezza della sequenza bersaglio, l'ISI
di Stop-Signal/ANT classico/Sequenza bersaglio restavano tutti legati a
un campo indipendente dal livello, nonostante lo stepper "Livello" fosse
visibile e sembrasse applicarsi. La nuova modalità "Livello" risolve
esplicitamente il problema: quando è selezionata, tutti questi parametri
seguono sempre la tabella del livello mostrato — non c'è più uno scarto
fra "livello scritto in Setup" e "parametri davvero in uso".

**Trasparenza dei controlli in Setup, non solo del testo.** Un secondo
bug, distinto dal primo, faceva sembrare che muovere il livello "non
cambiasse niente": gli stepper di Frequenza/ISI mostravano sempre il
valore grezzo indipendente, mai il valore di tabella realmente in uso in
modalità Livello/Adattiva — l'operatore vedeva lo stesso numero a
qualunque livello, anche se il motore stava già applicando quello
corretto. Ora, per i soli parametri davvero derivati da tabella
(frequenza N-back/Go-No-Go; ISI di Sequenza bersaglio, Stop-Signal, ANT
classico), il controllo diventa di sola lettura in Livello/Adattivo e
mostra il valore vero, aggiornato in tempo reale muovendo lo stepper
"Livello". Gli altri parametri con lo stesso nome ma non collegati al
livello per scelta di costruzione (frequenza trial di stop dello
Stop-Signal, frequenza bersaglio della Sequenza, frequenza di cambio
regola del Task-switching — tutti parametri metodologici fissi, non leve
di difficoltà) restano sempre modificabili, in ogni modalità.

**Estesa anche a Cancellazione (neglect) e Doppio compito.** Stesso
modello triplice, stesso bug corretto, per entrambi. Per Cancellazione:
in modalità Manuale la dimensione della tavola e il tempo limite ora
restano davvero indipendenti dal livello (prima c'era lo stesso scarto
silenzioso degli altri 7 esercizi), in Livello/Adattiva seguono sempre la
tabella — anche nel caso più complesso, la modalità "Progressiva" (scala
assoluta 1-30 che attraversa tre fasi), dove il livello mostrato in Setup
si traduce sempre correttamente nel sotto-livello 1-10 della fase attiva,
in ogni modalità. Per il Doppio compito: **un solo selettore condiviso**,
non uno per canale — scelta deliberata, non una scorciatoia: il motore
ha sempre avuto un unico interruttore "adattivo" per l'intero esercizio
(`cfg.adaptive`), mai due flag indipendenti per canale, quindi due
selettori avrebbero permesso stati misti (canale 1 Adattivo, canale 2
Manuale) che il codice sottostante non saprebbe comunque gestire
separatamente. I due LIVELLI restano invece pienamente indipendenti
(due stepper distinti, mai stati uniti) — solo la scelta di modalità è
una sola. L'ISI, condiviso perché i due canali sono presentati insieme,
deriva dalla media dei due livelli (arrotondata), non da uno dei due.

**Estesa anche a Categorizzazione condizionale — con una differenza
sostanziale dagli altri 8, per decisione esplicita di Rodrigo.** Qui
"Manuale" non significa "stessa struttura del livello, parametri
liberi" (come per tutti gli altri esercizi) — significa **struttura
scelta liberamente**, indipendente dal numero di livello: un nuovo campo
"Struttura (1-5)" sostituisce lo stepper "Livello" quando si è in
Manuale, e il clinico può impostare la struttura 4 (confronto 1-back)
anche restando "al livello 1" nel senso numerico del termine — il numero
di livello smette di significare qualcosa in questa sola modalità, ed è
per questo che in Manuale non compare affatto, sostituito dalla scelta
diretta di struttura. In Livello/Adattivo, tutto resta come sempre:
struttura derivata dal livello, mai un cambio di struttura a metà
seduta. ISI (strutture 1/2/3/5) o frequenza lure (struttura 4, il
confronto 1-back) seguono lo stesso principio degli altri esercizi:
tabella in Livello/Adattivo, campo libero in Manuale — corretto anche
qui lo stesso bug di sincronizzazione silenzioso già visto altrove
(l'ISI seguiva sempre la tabella, mai il campo libero, a prescindere
dalla modalità).

**TAPAT** segue lo stesso principio degli altri: in Manuale, l'intervallo
fra stimoli del blocco tonico (quello a ritmo lento e imprevedibile,
pensato per misurare l'allerta sostenuta) è un range libero
(minimo/massimo impostabili separatamente, non un singolo ISI —
l'imprevedibilità dell'intervallo è parte del costrutto, non un
dettaglio) invece di seguire sempre la tabella per livello. Il blocco
fasico (quello con il cue, a metà seduta) usa sempre il campo ISI
generico di Setup, in ogni modalità — non è legato al livello. In
Livello/Adattivo tutto resta come sempre.

Tutti gli esercizi con una scala 1-10 hanno una gestione esplicita e
coerente della titolazione: la maggioranza con il selettore
Manuale/Livello/Adattivo pienamente condiviso, Categorizzazione
condizionale con la stessa idea adattata al suo caso particolare
(struttura disaccoppiata dal livello in Manuale), Doppio compito e TAPAT
con le loro varianti dichiarate (un solo selettore condiviso per due
canali; range libero invece di ISI singolo). Scenari ecologici e
Strategie di memoria restano fuori per un motivo diverso, non tecnico:
non hanno mai avuto un concetto di "livello adattivo" nello stesso senso
— la loro scala di complessità/i loro materiali sono sempre stati scelti
a mano, non titolati.

| Esercizio | Livelli | Cosa varia col livello |
|---|---|---|
| N-back | 1-10 | n cresce solo a cambio di banda — 1 ai livelli 1-4, 2 ai livelli 5-9, 3 al solo livello 10 (il carico "puro" resta clinicamente vincolato: la letteratura su cui si basa l'n-back mostra un calo netto di accuratezza già a n=3) — dentro ogni banda scalano frequenza bersaglio e frequenza di trial lure (foil che corrispondono a uno scarto vicino a n, non a n stesso: aumentano il carico di controllo dell'interferenza senza alzare n, cfr. Kane, Conway, Miura & Colflesh, 2007) |
| Mantenimento (tipo Sternberg) | 1-10 | Livelli 1-5: modalità Riconoscimento, lunghezza lista 2→6. Livelli 6-10: modalità Riconoscimento seriale, insieme fisso 3→7 con numero di sonde crescente (8→20) — il salto 5→6 è un cambio di modalità, non solo di difficoltà: il costrutto resta mantenimento in entrambe, non scivola verso l'aggiornamento continuo dell'N-back |
| Go/No-Go | 1-10 | Frequenza no-go (48%→5%) e numero di elementi no-go attivi (1→4, tetto raggiunto solo al livello 10); l'ISI resta fisso (impostato manualmente in Setup), non è adattivo per questo esercizio |
| Sequenza bersaglio | 1-10 | ISI (4500→900ms) e, in modalità Livello/Adattiva, lunghezza della sequenza bersaglio (2→5 elementi) |
| Stop-Signal | 1-10 (leva secondaria) + staircase SSD continuo | ISI secondario (3600→750ms); lo SSD resta un meccanismo indipendente e continuo, non a livelli (vedi sotto) |
| ANT (classico) | 1-10 | ISI (3200→650ms) |
| TAPAT | 1-10 | Intervallo tra stimoli, da prevedibile e ravvicinato (0.9-1.8s) a lungo e imprevedibile (12-25s) |
| Task-switching | 1-10 | Intervallo cue→stimolo (CSI, 900→150ms) insieme allo sbilanciamento fra le due regole (50%→97%) — due parametri combinati |
| Doppio compito | 1-10 (per canale, indipendenti) | Frequenza target per canale (40%→5%) insieme all'ISI condiviso fra i due canali (3000→700ms, derivato dalla media dei due livelli canale); ciascun canale ha anche una propria frequenza di trial lure (foil identico a quello di 2 prove fa invece che 1 — stessa logica del lure nell'N-back), assente ai due livelli più bassi e crescente fino al livello 10 |
| Categorizzazione condizionale | 1-10 in Livello/Adattivo; struttura 1-5 scelta direttamente in Manuale (vedi sopra) | Banda doppia delle 5 strutture originarie (dimensione singola → doppia dimensione+no-go → regola disgiuntiva → 1-back sulla categoria → doppia dimensione a 4 risposte), ordinate per complessità relazionale (Halford, Wilson & Phillips, 1998) non per numero di mappature stimolo-risposta; dentro ogni banda l'ISI si stringe, tranne nella banda del 1-back (livelli 7-8) dove il secondo parametro è la frequenza di trial lure (stessa categoria di 2 prove fa invece che 1). Con l'adattivo attivo, la titolazione (ISI/lure) resta vincolata dentro la struttura di partenza per tutta la seduta — non attraversa mai un confine di struttura (= un cambio di regola) a metà sessione, vedi sezione "Vincolo di fascia strutturale" più sotto |
| Cancellazione (neglect) | Classico/Trova l'intruso: 1-10. Conteggio a regola: 1-10, unificato con la dimensione tavola. Progressiva: 1-30 | Elementi per tavola (14→85) insieme al tempo limite per tavola (nessun limite ai livelli 1-2, poi 110→18s). In "Conteggio a regola" la complessità della regola scala insieme, 2 livelli per condizione, ordine colore→sfondo→riga (percettivo prima, posizionale per ultimo — Treisman & Gelade, 1980). "Progressiva" incolla i tre in sequenza (1-10 Classico, 11-20 Intruso, 21-30 Regola), ciascuno con la propria scala 1-10 completa. Tutti i cambi di sotto-modalità (progressiva) o di condizione (regola) sono vincolati a non attraversare la seduta in corso, vedi sotto |

**Conteggio a regola — risposta a conteggio mentale, non a tocco.** A
differenza di Classico/Trova l'intruso/Progressiva, qui il paziente NON
tocca gli elementi: guarda la tavola, conta a mente quanti rispettano la
regola attiva, e — allo scadere del tempo limite (impostabile in Setup,
automatico e decrescente in modalità adattiva, stessa infrastruttura già
usata dalle altre modalità) o al tocco di "Fatto" — la tavola sparisce e
compare un campo numerico dove digitare il conteggio. La titolazione
adattiva usa una risposta binaria (numero esatto sì/no), sempre dentro i
limiti della fascia strutturale di partenza, come le altre modalità.
Conseguenza di costrutto dichiarata, non un effetto collaterale
nascosto: un singolo numero riportato non permette di ricostruire quanti
elementi siano stati "trovati" a sinistra rispetto a destra, quindi
questa modalità **non produce l'indice di asimmetria** che è invece il
cuore delle altre tre modalità di Cancellazione — storico, CSV e report
RCI mostrano al suo posto un'accuratezza sul conteggio complessivo
(quante tavole con numero esatto) e un errore assoluto medio. Chi cerca
specificamente l'asimmetria sinistra/destra del neglect classico deve
usare Classico, Trova l'intruso o Progressiva (fasi 1-20).

Fa eccezione lo **Stop-Signal**, che usa una titolazione propria e
indipendente dal "livello" per la sua misura principale: lo staircase del
ritardo SSD (Stop Signal Delay), sempre attivo, che converge verso il
punto in cui il paziente riesce a fermarsi circa il 50% delle volte — non
la regola 70-85%. Il passo dello staircase (`ssdStep`) è già configurabile
a parte nell'app; per questo l'estensione a 10 livelli qui sopra riguarda
solo la leva secondaria sull'ISI, guidata dalla regola 70-85% standard
sui trial "go" — estendere anche lo SSD alla scala a livelli sarebbe stato
ridondante con un parametro già regolabile altrove.

Gli **Scenari ecologici** hanno una progressione a 5 livelli scelti
manualmente in setup, non una titolazione automatica in tempo reale — la
natura del compito (completare un elenco di elementi, non rispondere a
stimoli ripetuti) non si presta allo stesso meccanismo. Ai livelli 3-5 gli
incrementi sono cumulativi: il livello 5 contiene sempre anche i
meccanismi introdotti ai livelli 3 e 4, non li sostituisce — vedi la
sezione dedicata più sotto. La **Categorizzazione condizionale** ha
allo stesso modo una progressione a 5 livelli scelti manualmente, non
adattiva — vedi la sezione dedicata. Le **Strategie di memoria** hanno 16
livelli di difficoltà del materiale, anch'essi scelti manualmente.
