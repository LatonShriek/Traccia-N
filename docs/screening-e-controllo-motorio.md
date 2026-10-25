# Screening iniziale e controllo motorio di base

_La batteria di screening e il controllo motorio che la precede. Spostato da `README.md` (passo 7) senza modifiche al testo; indice generale nel [README](../README.md)._

## Batteria di screening iniziale

Riscritta per intero su questo principio: ogni dominio ha un elenco di
**sonde sempre somministrate tutte**, senza nessun "se il blocco base
fallisce, approfondisci" a cascata come nella versione precedente — poi
una **regola di suggerimento propria del dominio** legge il *pattern*
di chi ha fallito e chi no (non solo "quante"), e ne deriva cosa
proporre. Soglia di fallimento: 70% di accuratezza (la stessa
"Eighty Five Percent Rule"-derivata già in uso per la titolazione
adattiva, qui come soglia di allarme più che di apprendimento).

**Ordine di somministrazione**: Memoria di lavoro per prima (Mantenimento
è la prima sonda in assoluto di tutto lo screening), poi Attenzione,
Flessibilità, Esplorazione — infine, sempre, il Coordinamento (Doppio
compito → eventuale mini-scenario).

### Memoria di lavoro

5 sonde, sempre tutte: **Mantenimento → Sequenza bersaglio →
Categorizzazione condizionale → N-back → Running Span**. Le prime 3
formano un gruppo (misure di applicazione di regola/mantenimento, non
di aggiornamento continuo) con una tabella di suggerimento dedicata;
N-back e Running Span sono fuori dal gruppo — sono già esercizi ad
allenamento adattivo di per sé, si autopropongono indipendentemente.

| Pattern nel gruppo | Suggerimento | Perché |
|---|---|---|
| Solo Mantenimento fallisce | Categorizzazione, struttura 1 | Cautela — nessuna struttura replica propriamente "tieni a mente un piccolo insieme", si riparte dalla base |
| Solo Sequenza bersaglio fallisce | Categorizzazione, struttura 4 | Stessa natura costruttiva: riconoscimento continuo di un pattern in un flusso |
| Solo Categorizzazione fallisce | Categorizzazione, struttura 1 | Segnale diretto — è la sonda stessa a cedere |
| Due o più del gruppo insieme | Categorizzazione, struttura 1 | Nessuna struttura combina propriamente più difficoltà diverse insieme — si torna al gradino più semplice/sicuro, non si inventa una via di mezzo |

N-back e Running Span, se falliscono, si aggiungono ai suggerimenti
sopra (non li sostituiscono) — un fallimento del gruppo e uno di N-back
insieme producono entrambi i suggerimenti.

### Attenzione sostenuta / inibizione

5 sonde base, sempre tutte, in ordine di esigenza crescente: **ANT →
TAPAT → Go/No-Go → Stop-Signal → Stop-Signal con interferenza**. Il
suggerimento è **il più semplice fra quelli falliti** (mai il più
complesso, anche quando più di uno cede insieme) — stesso principio di
Memoria: nessun compromesso a metà strada inventato. ANT è solo
screening (nessuna letteratura di training dedicata, vedi sotto): se è
lui il più semplice fra i falliti, il suggerimento scivola su TAPAT.

**Simon** è l'unica sonda condizionale di questo screening: si aggiunge
**solo** quando Stop-Signal con interferenza è l'unico a fallire (per
costruzione, l'unico caso in cui può essere "il più semplice fra i
falliti" è quando è anche l'unico) — è il punto in cui il conflitto
spazio-risposta di Simon ha senso come controllo in più.

### Flessibilità cognitiva

Un solo esercizio nel dominio (Task-switching, 24 prove, materiale
numerico bivalente, scomposto in repAcc/switchAcc come già descritto
sopra) — nessuna tabella di pattern possibile, si autopropone se
fallisce.

### Esplorazione visuospaziale

3 modalità di Cancellazione, sempre tutte somministrate: **Classico,
Trova l'intruso, A regola**. A differenza di Attenzione/Memoria, qui
**tutte** le varianti che falliscono vengono suggerite insieme, non
collassate a una sola — sono 3 modalità dello stesso esercizio, non 3
costrutti diversi da confrontare fra loro.

### Coordinamento (Doppio compito / Scenari ecologici)

Amministrato **sempre**, alla fine, indipendentemente da cosa hanno
segnalato gli altri domini (prima non era così: partiva solo se tutto
il resto era pulito). Doppio compito **fallisce** → si suggerisce e
basta, il mini-scenario di Scenari ecologici non viene nemmeno
somministrato. Doppio compito **passa** → parte un mini-scenario breve
(90 secondi, 2 vincoli attivi insieme) → **fallisce** → si consiglia
Scenari ecologici vero (un vero scenario da assegnare, non la sonda
breve); **passa** → nessun segnale da questa parte. Il principio dietro
il mini-scenario: test strutturati brevi possono non cogliere difficoltà
che emergono solo in compiti più complessi e realistici (il razionale
storico dietro il Six Elements Test/Multiple Errands Test — Shallice &
Burgess, 1991).

### Se tutto risulta pulito

Screening intero senza nessun segnale, Coordinamento compreso: non si
lascia a mani vuote. Si propone comunque un **programma di partenza a
livello base** (N-back, Task-switching, Cancellazione) più **Strategie
di memoria** come aggiunta — quest'ultima mai valutata dallo screening
stesso (checklist qualitativa, non a soglia), proposta qui come buona
prassi generale quando non c'è nulla di specifico da correggere.

### Perché alcuni esercizi non hanno un ruolo diretto

**ANT classico e Sequenza bersaglio** compaiono come sonde di screening
ma non hanno letteratura di training dedicata (sono nati da paradigmi
di misura, non riadattati per l'allenamento ripetuto come N-back) — per
questo ANT viene sempre sostituito da TAPAT come suggerimento, mai
proposto da solo. **Strategie di memoria** resta fuori da ogni logica
di flag automatico — valutazione qualitativa dell'operatore, non un
numero da confrontare a una soglia.

### Flag "consigliato": automatico, sempre sovrascrivibile a mano

Quando una regola di dominio produce un suggerimento, viene salvato
come "consigliato" sul profilo del paziente attivo (locale o remoto —
lo screening senza un paziente selezionato resta solo un'analisi a
schermo, non salvata da nessuna parte). Chiave di identificazione:
**sonda/variante**, non solo l'esercizio — Cancellazione ha 3 varianti
(classico/intruso/regola) che devono poter comparire tutte insieme nel
programma senza sovrascriversi a vicenda (un bug reale della versione
precedente, corretto in questa riscrittura). I flag compaiono come
etichette (⭐) nell'elenco pazienti, con una "✕" per rimuoverli in
qualunque momento — se un flag viene rimosso a mano, resta rimosso: un
successivo screening non lo riaccende da solo.

### Forma verbale / non verbale

Scelta prima di avviare (scheda "Fai lo screening", non uno schermo
intermedio a parte): **Automatico** (default), **Solo verbale**, **Solo
non verbale**. In automatico, ogni sonda che ha davvero un materiale non
verbale valido viene somministrata **in entrambe le forme** — non in
sequenza condizionata, sempre tutte e due — isolando se un eventuale
fallimento riguarda **solo il materiale verbale**, **solo quello non
verbale**, o **entrambi** ("misto", che segnala un problema generale
più che selettivo al materiale). 11 sonde su 17 hanno una forma non
verbale valida (ANT, Go/No-Go, Stop-Signal ×2, Sequenza bersaglio,
Categorizzazione, N-back, Running Span, Cancellazione classico/intruso,
Task-switching) — le altre (TAPAT, Simon, Mantenimento, Cancellazione a
regola, Doppio compito, mini-scenario) restano a singola
somministrazione, per limiti dichiarati caso per caso nel codice (es.
Mantenimento non ha ancora nessun materiale non verbale implementato;
Cancellazione a regola tratta il materiale in modo troppo rigido per
supportarne uno diverso senza prima essere estesa).

Per le **autoproposte** (dove il suggerimento coincide con la sonda che
ha fallito — es. Go/No-Go fallisce, si consiglia Go/No-Go), il pattern
verbale/non verbale/misto compare accanto al suggerimento nei risultati,
e la configurazione consigliata usa già il materiale giusto (quello in
cui il problema si è visto). Per le **sostituzioni di gruppo** di
Memoria (es. Mantenimento fallisce → si consiglia Categorizzazione)
questo arricchimento non viene applicato di proposito: il materiale
della sonda che ha fallito non ha un corrispettivo pulito in quello
dell'esercizio sostituito, e forzarlo produrrebbe un'etichetta
fuorviante.

### Secondo giro a carico più alto (domini risultati puliti)

Per ogni dominio risultato **interamente pulito** (ogni sonda passata,
verbale e non verbale insieme), un'ulteriore verifica a un carico più
impegnativo — un solo esercizio "ancora" per dominio (non l'intero
elenco di sonde), a un livello intermedio, non il minimo di screening né
il massimo dell'app. Principio: un profilo "pulito" può riflettere solo
la scarsa esigenza dello screening stesso, non l'assenza di difficoltà a
carichi più impegnativi (stessa logica già usata per il gate Doppio
compito/Scenari ecologici, qui estesa a ogni dominio). Se la verifica
cede, il suggerimento porta la nota esplicita "pulito ai livelli base,
ceduto al carico più alto" — non confuso con un fallimento ordinario
dello screening.

| Dominio | Sonda di verifica |
|---|---|
| Memoria di lavoro | N-back, n=3 |
| Attenzione | Go/No-Go, 3 elementi no-go, ISI più stretto |
| Esplorazione | Cancellazione a regola, livello 4 |
| Flessibilità | Task-switching, ISI più stretto |

### Limiti dichiarati

Come per gli altri moduli non normati, questo è uno strumento di
orientamento interno a TracciaN, non uno screening validato con soglie
normative pubblicate — soglia del 70%, regole di suggerimento e livello
delle verifiche a carico più alto sono decisioni interne, motivate ma
non normate, pensate per essere riviste con l'uso clinico reale.

## Controllo motorio di base

Non è un test cognitivo: verifica solo che il canale di risposta (tocco
o mouse/trackpad) sia affidabile, **prima** di qualunque esercizio o
screening — un'imprecisione qui (tremore, difficoltà visiva, mira)
altrimenti rischia di essere letta come un deficit cognitivo che non è.
Ispirato al Motor Screening Task di CANTAB, ma senza le sue norme di
popolazione: l'hardware del paziente è troppo eterogeneo perché un
valore di riferimento assoluto abbia senso — qui il confronto è sempre e
solo con lo stesso paziente, sullo stesso tipo di dispositivo, nel
tempo, stessa filosofia single-case già usata per l'RCI.

**Accesso**: subito, dalla riga di ciascun paziente in "Paziente in
presenza" e "I tuoi pazienti" (pulsanti "Screening" e "Controllo
motorio" affiancati), oppure in cima alla scheda "Gestisci programma"
del paziente — sono le due valutazioni che si cercano per prime aprendo
un paziente.

**Come funziona**: l'operatore indica il tipo di dispositivo che il
paziente sta usando in quel momento — Smartphone, Tablet, o Computer
(mouse/trackpad). Non è lo stesso concetto di "Dispositivo di risposta
previsto" in Setup (quello riguarda touch/tastiera durante gli
esercizi) — qui serve una categoria più fine, perché la zona di comfort
della mano cambia molto fra un telefono e un tablet anche se entrambi
sono "touch": su smartphone i 6 bersagli compaiono concentrati nella
metà inferiore dello schermo, raggiungibile dal pollice, mai negli
angoli estremi; su tablet e computer sono distribuiti su tutto lo
schermo, angoli inclusi. Il paziente tocca ciascun bersaglio appena
compare, uno alla volta.

**Cosa misura**: non solo se il bersaglio è stato preso, ma *quanto*
lontano dal centro (distanza espressa come multiplo del raggio del
bersaglio, non in pixel grezzi — così resta leggibile a prescindere
dalla risoluzione dello schermo) e la variabilità del tempo di reazione
fra un tocco e l'altro (coefficiente di variazione — stesso principio
già discusso a proposito della firma comportamentale cerebellare: non
solo *quanto* va bene, *quanto* è costante). Il tocco viene registrato
ovunque cada nello schermo, non solo se cade dentro il cerchio visibile
— un "quasi preso" e un "preso al centro" sono informazioni diverse, non
un binario riuscito/fallito.

**Confronto nel tempo**: se esiste un controllo precedente per lo stesso
paziente sullo stesso tipo di dispositivo, il risultato lo confronta
(soglia del 15% per descrivere "simile" vs "diverso" — scelta di comodo
descrittiva, non un valore validato in letteratura, dichiarata come tale
nel testo mostrato). Con un dispositivo diverso dall'ultima volta, non
viene mai forzato un confronto non comparabile — semplicemente non c'è
nulla con cui confrontare, e quel controllo diventa il nuovo punto di
partenza.

**Suggerimento pratico, non un giudizio clinico**: se i tocchi cadono in
media fuori dal cerchio visibile del bersaglio, il risultato lo segnala
come osservazione diretta ("i tocchi sono caduti fuori dal bersaglio"),
non come deficit, e suggerisce di valutare "Zone di risposta grandi" in
Setup prima di iniziare le sessioni vere su quel dispositivo.

**Dati**: ogni controllo si salva con la stessa infrastruttura delle
sessioni normali (stesso storico, stessa sincronizzazione Supabase se
configurata) con un campo `family:'motorio'` dedicato — non compare
nell'RCI né nei report per esercizio, è un flusso a parte.
