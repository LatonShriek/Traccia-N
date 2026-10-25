# Esercizi: Simon, Categorizzazione, Scenari ecologici, Strategie di memoria

_Descrizione di alcuni esercizi in dettaglio. Spostato da `README.md` (passo 7) senza modifiche al testo; indice generale nel [README](../README.md)._

## Simon task

Conflitto spazio-risposta, non identità-vs-identità come il flanker
dell'ANT (frecce che indicano un'altra direzione) — un solo stimolo,
nessun distrattore affiancato: un cerchio colorato (blu o verde) compare
a sinistra o a destra dello schermo. Il paziente tocca "Blu" o "Verde" in
base al **colore**, mai alla posizione — ma la posizione, quando non
coincide col pulsante corretto per quel colore, genera comunque
interferenza (Simon & Rudell, 1967, *Journal of Applied Psychology*,
51(3), 300-304).

**Perché non il Color-Word Stroop classico.** Scelta deliberata: uno
Stroop parola-colore standard rischierebbe di sovrapporsi a un eventuale
Stroop usato come misura diagnostica altrove (in NeuroScore o in un test
carta-e-matita) — l'esposizione ripetuta come esercizio di allenamento
contaminerebbe quella misura con un effetto di pratica scambiabile per
miglioramento reale. Il Simon task misura lo stesso principio generale
(inibizione competitiva, dimensional overlap — Kornblum, Hasbroucq &
Osman, 1990, *Psychological Review*, 97(2), 253-270) con un paradigma
percettivamente diverso, nessuna lettura coinvolta.

**Mappatura fissa per l'intera sessione**: Blu → pulsante sinistro, Verde
→ pulsante destro — dichiarata una volta nelle istruzioni, mai
rimescolata prova per prova (cambiarla a metà sessione sarebbe un cambio
di regola strutturale, vietato dal principio delle bande strutturali già
in vigore per tutti gli altri esercizi).

**Proporzione di congruenza** (Setup, parametro clinico fisso, non una
leva di titolazione): Bilanciato (50/50), Prevalenza congruente (75/25),
Prevalenza incongruente (25/75) — manipolazione list-wide, decisa a
livello di sessione. Un blocco a prevalenza congruente o incongruente
permette di misurare quanto il paziente riesce a sfruttare l'aspettativa
generale del blocco per prepararsi in anticipo all'interferenza
(controllo proattivo); un blocco bilanciato non lo permette — stessa
logica già discussa per Categorizzazione condizionale e per il Task-
switching bivalente. Consigliate almeno 60 prove per un indice di
conflitto stabile.

**Titolazione**: livello 1-10 condiviso con Sequenza bersaglio, Go/No-Go,
Task-switching, Stop-Signal, ANT classico (Manuale/Livello/Adattivo,
`ADAPT_ISI.simon` — stessa scala dell'ANT classico, complessità
percettivo-motoria comparabile: 2AFC spaziale). Blu e verde restano
sempre in proporzione 50/50 indipendentemente dalla proporzione di
congruenza scelta — sono due manipolazioni indipendenti, non la stessa
leva.

**Risultati**: "Effetto Simon" (RT prove incongruenti meno RT prove
congruenti, stesso segno e stessa interpretazione dell'indice di
conflitto già mostrato per ANT e per il Task-switching bivalente — riusa
lo stesso campo interno, compare già nella colonna "conflitto" del CSV
di esportazione, nessuna colonna nuova necessaria) più l'accuratezza
separata per condizione congruente/incongruente.

## Categorizzazione condizionale

Esercizio distinto dal Task-switching: qui la regola resta **fissa**
dentro ogni struttura — non si misura il costo di cambiare regola, ma il
carico di applicarne una via via più complessa. Il livello (1-10) si può
scegliere a mano in Setup (come prima), oppure lasciare che l'ISI (o la
frequenza lure alle bande 7-8) si titoli da solo in base all'accuratezza
— ma la STRUTTURA (quale delle 5 regole sotto) non cambia mai a metà
seduta nemmeno con l'adattivo attivo: la titolazione resta vincolata
dentro la banda di struttura di partenza, esattamente come per la
Cancellazione a regola (vedi "Vincolo di fascia strutturale" più sopra).
Un cambio di struttura richiede sempre una seduta nuova, con le
istruzioni della struttura successiva lette/mostrate prima di iniziare.

I 10 livelli sono una banda doppia delle 5 strutture qualitativamente
distinte descritte sotto — non un'unica scala continua, perché non
esiste un singolo parametro che le attraversi tutte. Ogni struttura
occupa 2 livelli consecutivi: il primo con ISI ampio, il secondo con ISI
più stretto (pressione di velocità), tranne la struttura del 1-back
(livelli 7-8) dove il secondo parametro è la frequenza di trial lure
invece dell'ISI.

| Livello | Struttura | Parametro che varia | Risposte |
|---|---|---|---|
| 1 | Dimensione singola (simboli, o lettere/numeri pronunciati) | ISI ampio | 2 |
| 2 | Dimensione singola (simboli, o lettere/numeri pronunciati) | ISI stretto | 2 |
| 3 | Doppia dimensione + no-go: lettera bianca→A, numero rosso→B, numero bianco→C, lettera rossa→nessuna risposta | ISI ampio | 3 + no-go |
| 4 | Stessa struttura del livello 3 | ISI stretto | 3 + no-go |
| 5 | Stessa doppia dimensione, ricombinata in una regola disgiuntiva: A se lettera bianca *oppure* numero rosso, B se lettera rossa *oppure* numero bianco | ISI ampio | 2 |
| 6 | Stessa struttura del livello 5 | ISI stretto | 2 |
| 7 | Confronto con lo stimolo precedente (1-back sulla categoria) | Nessun trial lure | 1 (rispondi se la categoria è la stessa di prima) |
| 8 | Stessa struttura del livello 7 | Trial lure: stessa categoria di 2 prove fa invece che 1 — sembra familiare per prossimità recente ma la risposta corretta resta "nessuna risposta" | 1 |
| 9 | Stessa doppia dimensione, mappata direttamente su 4 risposte (nessun no-go, nessuna disgiunzione) | ISI ampio | 4 (tastiera A/L/Z/M) |
| 10 | Stessa struttura del livello 9 | ISI stretto | 4 (tastiera A/L/Z/M) |

L'ordine delle 5 strutture (singola dimensione → doppia dimensione+no-go
→ disgiuntiva → 1-back → doppia dimensione a 4 risposte) segue la
complessità relazionale (Halford, Wilson & Phillips, *Behavioral and
Brain Sciences*, 1998), non il numero di mappature stimolo-risposta: una
regola disgiuntiva che integra due dimensioni con un connettivo logico
impone un carico maggiore di una tabella di mappature dirette più
numerose, perché il carico cresce con il numero di variabili da
integrare in parallelo nella stessa rappresentazione, non con il numero
di risposte disponibili.

Le strutture a livelli 3/4/6/9/10 condividono lo stesso item a due
dimensioni indipendenti (lettera/numero × bianco/rosso — bianco, non
nero: lo schermo di sessione ha sfondo scuro, un vero nero sarebbe
invisibile, il campo dati interno resta `colore:'nero'` per
compatibilità ma il rendering e ogni testo rivolto al paziente/operatore
mostrano bianco) già usato dalla
modalità "Bivalente" del Task-switching, ma lo ricombinano in mappature
diverse sulla risposta — a parità di stimolo, cambia solo la regola di
classificazione, in modo da isolare il carico della regola stessa dal
carico percettivo. I livelli 1/2 e 7/8 condividono invece un'unica
dimensione (simboli, o lettere/numeri pronunciati — materiale
selezionabile in Setup), e sono collegati fra loro: il livello 7
aggiunge al livello 1 il carico di memoria di lavoro di confrontare con
lo stimolo precedente, senza cambiare la regola di classificazione di
base. Il materiale "Colori" con regola Caldo/Freddo, disponibile in
passato qui e nel Task-switching, è stato rimosso: la suddivisione
caldo/freddo (e, per il Task-switching, primario/non primario) non ha
una base sufficientemente principiata per un compito clinico — resta
leggibile nello storico di sedute già registrate con quel materiale, ma
non è più selezionabile per sedute nuove.

Il conteggio "risposte omesse" nello storico e nel CSV per questo
esercizio conta solo le mancate risposte vere (dove serviva un tocco),
non i casi in cui non rispondere era la risposta corretta (no-go ai
livelli 3/4 e 7/8) — altrimenti il dato sarebbe fuorviante.


## Scenari ecologici (pianificazione / multitasking)

Nono esercizio della batteria. Motore condiviso per compiti strutturati
come: un elenco di elementi da completare, vincoli di dipendenza fra
loro, regole comportamentali il cui mancato rispetto viene tracciato come
violazione distinta dal semplice "non fatto", e un budget di tempo
opzionale — copre in un unico impianto pianificazione procedurale,
multitasking (Modified Six Elements/Multiple Errands) e scenari
ecologici quotidiani. Il paziente può sempre **tentare** qualsiasi
elemento visibile (come nei paradigmi reali): le regole non bloccano il
tocco, penalizzano come violazione — fa eccezione la mutua esclusione
(una scelta reale rimuove l'alternativa) e gli elementi nascosti
(finestra oraria non ancora aperta, memoria prospettica non ancora
dovuta), che non sono nemmeno mostrati finché non è il momento.

**10 scenari disponibili**, ciascuno con **5 livelli di complessità**
selezionabili in setup (1 = molto facile, 2 = lo scenario base, 3-5 =
un meccanismo in più a ogni gradino, in modo **cumulativo**: il livello
5 contiene sempre anche i meccanismi introdotti ai livelli 3 e 4, non li
sostituisce — così la progressione è graduale invece di un salto secco
da "poche regole" a "tutte insieme"). In più, ogni elemento mostra
un'icona (emoji, nessuna dipendenza esterna) legata alla sua categoria,
per un riferimento visivo rapido oltre al testo:

1. **Sei compiti** (Modified Six Elements) — L3: vera regola delle due
   metà dello stesso compito ("non fare le due storielle di fila"); L4:
   settimo elemento con dipendenza incrociata; L5: soglia di errori
   tollerati (oltre la quale la prova è "Fallita")
2. **Preparare il tè** — L3: elemento zucchero; L4: diventa una scelta
   reale (zucchero *o* dolcificante); L5: introduce un budget di tempo,
   assente nello scenario base
3. **Gestione farmacologica settimanale** — L3: prima finestra oraria
   (dose mattutina); L4: finestre anche su pomeriggio/sera; L5: memoria
   prospettica nascosta (annotare senza promemoria)
4. **Spesa con budget limitato** — L3: mutua esclusione (dolce *o*
   rivista); L4: elemento condizionale in più; L5: integrazione
   informativa (il prezzo della frutta serve per verificare il conto)
5. **Appuntamenti e mezzi pubblici** — L3: prima finestra oraria (il
   bus); L4: finestre anche su appuntamento e ritorno; L5: integrazione
   informativa + introduce un budget di tempo, assente nello scenario base
6. **Sicurezza domestica prima di uscire** — L3: controllo aggiuntivo
   con dipendenza; L4: interruzione/distrattore da gestire; L5: soglia
   di errori tollerati
7. **Commissioni in centro** (Multiple Errands) — L3: vera regola
   ingresso unico per luogo; L4: integrazione informativa; L5: soglia di
   errori tollerati
8. **Organizzare un pranzo in famiglia** — L3: elemento aggiuntivo; L4:
   memoria prospettica nascosta (controllare il forno senza promemoria);
   L5: scelta reale in più (dolce fatto in casa *o* comprato)
9. **Routine mattutina** — L3: elemento aggiuntivo con dipendenza; L4:
   finestra oraria complessiva (uscire in tempo); L5: soglia di errori
   tollerati
10. **Percorso a tappe con regole** (Mappa dello zoo) — L3: vera regola
    ingresso unico per luogo; L4: scelta reale in più (due souvenir
    alternativi); L5: soglia di errori tollerati

Vocabolario completo delle regole/meccanismi nel codice (funzione
`completeGoalTaskItem`/`goalTaskTick`, ben commentata): finestra oraria,
mutua esclusione, soglia di errori tollerati, interruzione/distrattore,
non-ripetere-versioni-dello-stesso-compito, ingresso unico per luogo,
integrazione informativa, memoria prospettica nascosta. Sono riusabili
su qualunque scenario aggiungendo i campi giusti agli elementi — non
richiedono un motore diverso per essere estesi ad altri scenari.

Due idee discusse in fase di progettazione — un labirinto di
pianificazione spaziale e un puzzle di trasformazione risorse (tipo
"lupo-capra-cavolo") — non sono incluse: sono problemi di percorso/spazio
di stati, una struttura diversa da "elenco con vincoli", che
richiederebbe un motore dedicato separato da questo.

## Strategie di memoria

Decimo esercizio della batteria (il sesto in ordine di comparsa nel
selettore). **Cinque tecniche**, un livello 1-16 da scegliere in setup:

**PQRST** (sempre su brano, 16 brani graduati) — la fase di studio è
guidata a passaggi veri, non un unico schermo con tutto il testo:
1) **Anteprima** (solo il titolo — "cosa pensi che racconterà?"),
2) **Domanda** (formularsi una domanda a cui il brano dovrebbe
rispondere), 3) **Lettura** (il testo compare, con opzione di ascolto
vocale), 4) **Ripeti a te stesso** (il testo si nasconde, il paziente
richiama mentalmente prima del test) — le quattro lettere della
tecnica, con il richiamo finale a fare da quinto passaggio ("Test"). I
brani crescono per lunghezza (~30→~220 parole), densità di idee,
presenza di dettagli interferenti (numeri, nomi, date — assenti nei
primi livelli), complessità sintattica, astrattezza del contenuto.

Il ciclo P-Q-R-S non gira sull'intero brano in un unico passaggio: segue
lo schema di riferimento in letteratura, che lo applica **per sezione
tematica** (anteprima → domanda → lettura → ripetizione su una sezione,
poi si passa alla successiva), con il richiamo finale a fare da Test
cumulativo su tutte le sezioni insieme. Ogni sezione raggruppa ~2 unità
concettuali. I brani storici a blocco unico vengono trattati come una
sola sezione, quindi il meccanismo è identico per tutti i livelli anche
prima che vengano riscritti in forma segmentata.

**Forme parallele (RCI)** — ai livelli 1-2 sono disponibili 3 forme
equivalenti (A/B/C: stessa lunghezza, stessa struttura a sezioni/unità,
stesso registro), selezionabili a mano in setup quando un livello ne ha
più di una. Servono a separare il vero miglioramento clinico
dall'apprendimento specifico del materiale nel confronto RCI
baseline/finale (Crawford): usando forme diverse a sessioni diverse, un
recupero maggiore non può essere spiegato dalla semplice esposizione
ripetuta allo stesso testo. La forma usata è tracciata nello storico
sessione e nel CSV (`memoria_forma`). Il selettore forma in setup
segnala con un tag "✓ già usata" le forme già impiegate con quel
paziente a quel livello/tecnica (letto dallo storico sessioni, caricato
in background all'apertura del setup se non già in cache) — puramente
informativo, non impedisce la scelta: resta sempre l'operatore a
decidere se ripetere una forma è appropriato per quel caso. Popolati con
3 forme anche i livelli 3-5 (PQRST e Chunking) — stessa lunghezza,
stesso numero di unità/parole, stesso registro della forma A originale.
I livelli 6-16 restano per ora a forma singola — l'estensione è un
lavoro di contenuto da proseguire gradualmente, non un limite del
meccanismo: `memoriaListaResolve()` supporta forme parallele sia per
liste a sotto-gruppi (livelli 1-2) sia per liste "flat" a categoria
singola o non categorizzate (livelli 3+), quindi l'estensione ai livelli
successivi (incluse le liste non categorizzate, 6 in su) è già
tecnicamente pronta quando arriverà il contenuto.

**Chunking** (sempre su lista, 16 liste di parole graduate) —
**multi-metodo**: in setup l'operatore sceglie fino a 2 tecniche fra
cinque, mai in automatico:
- *Categorizzazione semantica* — se la lista è categorizzabile (livelli
  1-5), rivela la categoria e invita a raggruppare mentalmente; se non lo
  è (dal livello 6 in su), invita a creare associazioni proprie.
- *Acronimo/acrostico* — evidenzia la prima lettera di ogni parola
  direttamente sulla lista mostrata, invitando a costruire insieme (operatore
  e paziente) una parola o frase che le usi in ordine.
- *Narrazione/concatenamento* — invita a costruire insieme una breve
  storia che colleghi le parole in sequenza.
- *Immagine associativa* — invita a creare un'immagine mentale vivida
  che colleghi ogni parola (o coppia di parole consecutive) alla
  successiva, senza un percorso spaziale fisso (a differenza del metodo
  dei loci sotto).
- *Personale* — nessun box automatico: un campo di testo libero dove
  l'operatore annota la tecnica concordata con quel paziente specifico,
  quando non rientra nelle quattro codificate.

Sotto il livello 11 è selezionabile una sola tecnica alla volta; dal
livello 11 in su se ne possono combinare due, a scelta manuale — la
combinazione utile dipende dal singolo paziente, non è deducibile a
priori dal livello. Le liste crescono per lunghezza (4→14 parole),
presenza di categorie semantiche raggruppabili, concretezza/immaginabilità
delle parole, frequenza d'uso.

**Struttura a sotto-gruppi (ai livelli 1-2, popolata finora)** — la lista
non è più un blocco indifferenziato di parole con un'unica etichetta di
categoria: è composta da più sotto-gruppi (2-3 categorie diverse, es.
"frutta" + "animali"), ciascuno mostrato come box separato con la sua
etichetta. Salendo di livello crescono **insieme** numero di sotto-gruppi
e dimensione di ciascuno (mai uno dei due a scapito dell'altro), così il
carico di raggruppamento aumenta in modo graduale invece che con un
salto di lunghezza secco. Fino al livello 10 i gruppi sono mostrati
esplicitamente; dal livello 11 in su la struttura resta nel dato (usata
per osservare il clustering in fase di richiamo) ma **non viene
mostrata** — il paziente deve organizzare il materiale con una tecnica
propria fra quelle già esistenti (compresa "personale", per una
strategia del tutto autogenerata), riusando lo stesso confine 1-10/11-16
già in uso per il numero di tecniche combinabili, invece di introdurre
una seconda soglia indipendente. È la stessa logica delle **forme
parallele** del PQRST: 3 forme equivalenti disponibili ai livelli 1-2,
selezionabili a mano in setup, tracciate nello storico sessione e nel
CSV (`memoria_forma`) per lo stesso motivo di equivalenza RCI. I livelli
3-16 restano nella forma "lista flat" storica (singola categoria o
acategorica) finché non vengono anch'essi riscritti con la stessa
struttura — lavoro di contenuto da proseguire gradualmente.

Le tre tecniche seguenti sono selezionabili **sia su lista di parole sia
su brano** (campo `memoriaMateriale` in setup — su PQRST/Chunking resta
fisso, rispettivamente brano/lista):

**Metodo dei loci** — un elemento per tappa, tappa ed elemento sempre
mostrati esplicitamente insieme (mai lasciati all'immaginazione libera),
con l'istruzione di immaginare la scena il più vividamente possibile.
Tre percorsi disponibili, scelti in setup:
- *Casa tipo* — percorso fisso di 16 luoghi familiari (portone, ingresso,
  cucina, scala...), adatto quando non si conosce l'ambiente reale del
  paziente o si vuole un percorso standardizzato fra sedute diverse.
- *Corpo* — percorso fisso di 16 parti del corpo, in ordine anatomico
  (testa→piedi): per pazienti con scarsa familiarità ambientale attuale,
  o ricoverati da tempo, per cui un percorso domestico non è un
  riferimento stabile.
- *Personalizzato* — l'operatore digita le tappe reali del paziente
  (es. il proprio domicilio effettivo), una per riga: il percorso più
  efficace quando è praticabile, perché sfrutta una familiarità spaziale
  già consolidata invece di costruirne una nuova.

Base di evidenza consolidata in riabilitazione (Kaschel et al., 2002).

**Errorless learning** — **spaced retrieval**: l'informazione viene
presentata direttamente (mai indovinata), poi richiamata a intervalli
crescenti — 5s, poi doppio ad ogni richiamo riuscito (10s, 20s, 40s...).
Se il richiamo fallisce, la risposta corretta viene ridata subito e si
riparte dall'ultimo intervallo riuscito, mai da un tentativo libero senza
rete. Un elemento si considera consolidato dopo 4 successi consecutivi o
al superamento dei 60s, poi si passa al successivo — soglie provvisorie,
regolabili se l'uso clinico suggerisce altri valori. Rispetto alla
versione precedente (due passaggi di sola esposizione, senza alcun
richiamo), questa aderisce meglio al principio stesso della tecnica: il
punto dell'errorless learning non è evitare *ogni* richiamo, ma
strutturare il richiamo in modo che l'errore resti altamente improbabile
— l'intervallo cresce solo quando il successo è già garantito dal
precedente, e si contrae immediatamente al primo segnale di difficoltà
(Wilson & Evans; Camp, per la spaced retrieval nello specifico).

**Vanishing cues** — per ciascun elemento, due stadi di suggerimento
decrescente (prima ~65% delle lettere iniziali visibili, poi ~25%) prima
del richiamo libero finale a cue zero. Il paziente prova a completare
l'elemento ad alta voce a ogni stadio; un pulsante "Mostra la risposta"
è disponibile ma non registrato ai fini del punteggio — la fase di
richiamo finale (uguale alle altre tecniche) resta l'unica base per il
punteggio percentuale salvato.

**Valutazione del richiamo** — uguale per tutte e cinque le tecniche: il
paziente racconta/richiama liberamente a voce, e **l'operatore** (non il
paziente) spunta su una checklist a schermo quali idee-chiave o parole
sono state effettivamente recuperate — non serve la formulazione esatta
del testo, conta il concetto. Il punteggio (% recuperato) si calcola da
solo. Il richiamo libero è un giudizio qualitativo: automatizzarlo con
riconoscimento vocale rischierebbe di introdurre errori di misura proprio
nel dato che si vuole raccogliere, per una popolazione che può avere
difficoltà di eloquio o di reperimento della parola — per questo la
valutazione resta manuale, sullo stesso principio già in uso con
`respMode='operatore'` negli altri esercizi.
