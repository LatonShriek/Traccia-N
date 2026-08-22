# TracciaN — batteria di attenzione e controllo esecutivo per tablet

Applicazione web standalone per la somministrazione di una batteria di 11
esercizi di attenzione, memoria di lavoro, controllo esecutivo e memoria
strategica: N-back, Sequenza bersaglio, Go/No-Go, Stop-Signal, Attenzione
(tipo ANT/TAPAT), Task-switching, Categorizzazione condizionale, Doppio
compito, Cancellazione (neglect), Scenari ecologici
(pianificazione/multitasking) e Strategie di memoria (PQRST/chunking
multi-metodo/metodo dei loci/errorless learning/vanishing cues). Raccolta
risposte touch o manuale, punteggio automatico, istruzioni leggibili e
ascoltabili prima di ogni esercizio, storico sessioni sincronizzabile, ed
è utilizzabile da più operatori insieme e da pazienti in autonomia da
propri dispositivi.

**Nessun server obbligatorio, nessun account richiesto per l'uso base.**
I dati restano salvati in locale nel browser del dispositivo
(`localStorage`); la sincronizzazione cloud (Supabase) — che abilita
multi-operatore e accesso paziente — è opzionale.

**Indice:** [Framework teorico](#framework-teorico-della-batteria) ·
[Difficoltà adattiva](#difficoltà-adattiva) ·
[Categorizzazione condizionale](#categorizzazione-condizionale) ·
[Batteria di screening iniziale](#batteria-di-screening-iniziale) ·
[Pubblicazione su GitHub Pages](#pubblicazione-su-github-pages-una-volta-sola) ·
[Uso sul dispositivo](#uso-sul-dispositivo) ·
[Dati e privacy](#dati-e-privacy) ·
[Sincronizzazione cloud e multi-utente](#sincronizzazione-cloud-e-account-multi-utente-facoltativa--supabase) ·
[Gestione pazienti: programma, modalità di accesso, obiettivi, limiti, RCI, archiviazione](#gestione-pazienti-programma-modalità-di-accesso-obiettivi-limiti-rci-archiviazione) ·
[Scenari ecologici](#scenari-ecologici-pianificazione--multitasking) ·
[Strategie di memoria](#strategie-di-memoria)

## Framework teorico della batteria

Ogni esercizio è stato scelto per campionare un costrutto/rete diversa,
secondo una logica di copertura piuttosto che di ripetizione — l'obiettivo
è un profilo multidimensionale del controllo attentivo-esecutivo, non
dieci varianti dello stesso compito.

| Esercizio | Costrutto | Rete/meccanismo principale |
|---|---|---|
| N-back | Aggiornamento della memoria di lavoro (updating) | Fronto-parietale, DLPFC |
| Sequenza bersaglio | Context processing, controllo proattivo/reattivo (ispirato all'AX-CPT) | DLPFC (proattivo) + ACC (reattivo) |
| Go/No-Go | Inibizione di un'azione non ancora iniziata (action restraint) | Giro frontale inferiore sinistro + parietale |
| Stop-Signal | Cancellazione di un'azione già in corso (action cancellation), con stima di SSRT | Via fronto-striatale destra (RIFG–preSMA–STN) |
| Attenzione (ANT / TAPAT) | Allerta (tonica/fasica), orienting spaziale, conflitto percettivo | Locus coeruleus-NA; reti dorsale/ventrale; ACC-DLPFC |
| Task-switching | Flessibilità cognitiva (shifting), switch cost | Rete fronto-parietale dominio-generale, solco frontale inferiore |
| Categorizzazione condizionale | Applicazione di regole di classificazione di complessità crescente (fissa, non a costo di switch) | Corteccia prefrontale dorsolaterale, striato (apprendimento di regole condizionali) |
| Doppio compito | Attenzione divisa, coordinamento di due compiti concorrenti | Corteccia frontopolare (BA10), colli di bottiglia prefrontali laterali |
| Cancellazione (neglect) | Ricerca visiva ed esplorazione spaziale simmetrica/asimmetrica | Rete attentiva parietale destra; asimmetria sinistra/destra come indice di neglect |
| Scenari ecologici | Pianificazione, multitasking, autogestione sotto vincoli (Six Elements/Multiple Errands) | Corteccia prefrontale dorsolaterale e frontopolare (BA10), monitoraggio prospettico |
| Strategie di memoria | Memoria a lungo termine, apprendimento strategico | Ippocampo/lobo temporale mediale (codifica); prefrontale per il controllo strategico |

**Limiti dichiarati, non nascosti:** l'AX-CPT qui implementato (la
"sequenza bersaglio") è semplificato — non distingue i quattro tipi di
trial (AX/AY/BX/BY) dell'AX-CPT classico, quindi non fornisce l'indice
di bilanciamento proattivo/reattivo (PBI) della versione di ricerca.
L'ANT qui implementato usa 3 fattori (allerta/orienting/conflitto) ma
non è validato contro le norme originali di Fan et al. — con meno di
60-90 prove gli indici per condizione sono statisticamente poco
affidabili (l'app avvisa in tal caso). Lo Stop-Signal stima lo SSRT con
il metodo semplificato "della media" (RT medio go − SSD medio), non con
il metodo dell'integrazione usato in letteratura. La Cancellazione è
ispirata ai test di cancellazione clinici ma non è uno strumento
normato. Gli Scenari ecologici e le Strategie di memoria sono moduli di
allenamento/pratica, non prove standardizzate. Questi esercizi sono
pensati per **trattamento e monitoraggio intra-soggetto nel tempo**, non
per confronto normativo — a differenza dei protocolli di NeuroScore, non
hanno tabelle di riferimento.

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
valore impostato manualmente.

**Il numero di livelli varia per esercizio.** La scala non è uniforme
perché il numero di livelli riflette quanti step distinti i parametri di
un compito possono effettivamente sostenere con significato clinico, non
una convenzione fissa: dove un secondo parametro può scalare insieme al
primo (es. un ISI che si aggiunge a una frequenza), il compito guadagna
margine sia a pavimento (deficit marcati) sia a soffitto (prestazioni
forti):

| Esercizio | Livelli | Cosa varia col livello |
|---|---|---|
| N-back | 1-10 | n cresce solo a cambio di banda — 1 ai livelli 1-4, 2 ai livelli 5-9, 3 al solo livello 10 (il carico "puro" resta clinicamente vincolato: la letteratura su cui si basa l'n-back mostra un calo netto di accuratezza già a n=3) — dentro ogni banda scalano frequenza bersaglio e frequenza di trial lure (foil che corrispondono a uno scarto vicino a n, non a n stesso: aumentano il carico di controllo dell'interferenza senza alzare n, cfr. Kane, Conway, Miura & Colflesh, 2007) |
| Go/No-Go | 1-10 | Frequenza no-go (48%→5%), numero di elementi no-go attivi (1→6), ISI (che scala col livello) |
| Sequenza bersaglio | 1-10 | ISI (4500→900ms) e, solo in modalità adattiva, lunghezza della sequenza bersaglio (2→5 elementi) |
| Stop-Signal | 1-10 (leva secondaria) + staircase SSD continuo | ISI secondario (3600→750ms); lo SSD resta un meccanismo indipendente e continuo, non a livelli (vedi sotto) |
| ANT (classico) | 1-10 | ISI (3200→650ms) |
| TAPAT | 1-10 | Intervallo tra stimoli, da prevedibile e ravvicinato (0.9-1.8s) a lungo e imprevedibile (12-25s) |
| Task-switching | 1-10 | Intervallo cue→stimolo (CSI, 900→150ms) insieme allo sbilanciamento fra le due regole (50%→97%) — due parametri combinati |
| Doppio compito | 1-10 (per canale, indipendenti) | Frequenza target per canale (40%→5%) insieme all'ISI condiviso fra i due canali (3000→700ms, derivato dalla media dei due livelli canale); ciascun canale ha anche una propria frequenza di trial lure (foil identico a quello di 2 prove fa invece che 1 — stessa logica del lure nell'N-back), assente ai due livelli più bassi e crescente fino al livello 10 |
| Categorizzazione condizionale | 1-10 (non adattivo, scelto in setup) | Banda doppia delle 5 strutture originarie (dimensione singola → doppia dimensione+no-go → regola disgiuntiva → 1-back sulla categoria → doppia dimensione a 4 risposte), ordinate per complessità relazionale (Halford, Wilson & Phillips, 1998) non per numero di mappature stimolo-risposta; dentro ogni banda l'ISI si stringe, tranne nella banda del 1-back (livelli 7-8) dove il secondo parametro è la frequenza di trial lure (stessa categoria di 2 prove fa invece che 1) |
| Cancellazione (neglect) | 1-10 | Elementi per tavola (14→85) insieme al tempo limite per tavola (nessun limite ai livelli 1-2, poi 110→18s) |

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

## Categorizzazione condizionale

Esercizio distinto dal Task-switching: qui la regola resta **fissa** per
tutta la sessione — non si misura il costo di cambiare regola, ma il
carico di applicarne una via via più complessa. Per questo non è
adattivo in tempo reale: il livello (1-10) si sceglie a mano in setup,
come per la Cancellazione a regola.

I 10 livelli sono una banda doppia delle 5 strutture qualitativamente
distinte descritte sotto — non un'unica scala continua, perché non
esiste un singolo parametro che le attraversi tutte. Ogni struttura
occupa 2 livelli consecutivi: il primo con ISI ampio, il secondo con ISI
più stretto (pressione di velocità), tranne la struttura del 1-back
(livelli 7-8) dove il secondo parametro è la frequenza di trial lure
invece dell'ISI.

| Livello | Struttura | Parametro che varia | Risposte |
|---|---|---|---|
| 1 | Dimensione singola (colore o simbolo) | ISI ampio | 2 |
| 2 | Dimensione singola (colore o simbolo) | ISI stretto | 2 |
| 3 | Doppia dimensione + no-go: lettera nera→A, numero rosso→B, numero nero→C, lettera rossa→nessuna risposta | ISI ampio | 3 + no-go |
| 4 | Stessa struttura del livello 3 | ISI stretto | 3 + no-go |
| 5 | Stessa doppia dimensione, ricombinata in una regola disgiuntiva: A se lettera nera *oppure* numero rosso, B se lettera rossa *oppure* numero nero | ISI ampio | 2 |
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
dimensioni indipendenti (lettera/numero × nero/rosso) già usato dalla
modalità "Bivalente" del Task-switching, ma lo ricombinano in mappature
diverse sulla risposta — a parità di stimolo, cambia solo la regola di
classificazione, in modo da isolare il carico della regola stessa dal
carico percettivo. I livelli 1/2 e 7/8 condividono invece un'unica
dimensione (colore o simbolo), e sono collegati fra loro: il livello 7
aggiunge al livello 1 il carico di memoria di lavoro di confrontare con
lo stimolo precedente, senza cambiare la regola di classificazione di
base.

Il conteggio "risposte omesse" nello storico e nel CSV per questo
esercizio conta solo le mancate risposte vere (dove serviva un tocco),
non i casi in cui non rispondere era la risposta corretta (no-go ai
livelli 3/4 e 7/8) — altrimenti il dato sarebbe fuorviante.

## Batteria di screening iniziale

Sessione breve e riproducibile che confronta, per 4 domini, un blocco
**base** (stimolo semplice, nessun carico esecutivo) con un blocco
**caricato** (stessa area, con carico esecutivo) — un quinto dominio
(Attenzione divisa) riusa il blocco base dell'Attenzione invece di averne
uno proprio, sullo stesso principio del "base condiviso". Riutilizza
esercizi già esistenti con parametri fissi e brevi (16 prove per blocco,
1 tavola per la Cancellazione), non introduce contenuti nuovi:

| Dominio | Blocco base | Blocco caricato |
|---|---|---|
| Attenzione sostenuta / inibizione | Go/No-Go, no-go frequente (48%), 1 elemento | Go/No-Go, no-go raro (22%), 3 elementi |
| Memoria di lavoro | N-back, n=1 | N-back, n=2 |
| Flessibilità cognitiva | Categorizzazione condizionale, livello 1 | Task-switching, bilanciato |
| Attenzione divisa | *(riusa il base dell'Attenzione)* | Doppio compito, visivo+uditivo |
| Esplorazione visuospaziale | Cancellazione classica, 20 elementi | Cancellazione a regola, livello 2 |

**A cosa serve il confronto.** Se il blocco caricato è sotto soglia
(70%, la stessa "Eighty Five Percent Rule"-derivata già in uso per la
titolazione adattiva, qui usata come soglia di allarme più che di
apprendimento) **e** il blocco base di quel dominio è nella norma, il
pattern suggerisce un deficit **specifico esecutivo** in quel dominio —
il substrato percettivo/attentivo di base funziona, cede solo sotto
carico. Se invece anche il blocco base è sotto soglia, il problema sembra
più a monte (percettivo/attentivo di base), e in quel caso **non** si
propone alcun suggerimento — proporre un esercizio esecutivo mirato
sarebbe fuorviante quando il deficit osservato non è quello. Ogni
accuratezza resta comunque visibile per esteso nei risultati, il flag
è una sintesi, non l'unico dato disponibile.

**Flag "consigliato": automatico, sempre sovrascrivibile a mano.**
Quando un dominio soddisfa la condizione sopra, l'esercizio corrispondente
al suo blocco caricato viene salvato come "consigliato" sul profilo del
paziente attivo (locale o remoto — lo screening senza un paziente
selezionato resta solo un'analisi a schermo, non salvata da nessuna
parte). I flag compaiono come etichette (⭐) nell'elenco pazienti, con una
"✕" per rimuoverli in qualunque momento. Se un flag viene rimosso a mano
e un successivo screening rileva di nuovo la stessa condizione, **resta
rimosso**: la disattivazione manuale ha sempre la precedenza sul
risultato automatico, per evitare che un giudizio clinico già espresso
venga silenziosamente annullato da una sessione successiva.

**Limiti dichiarati.** Come per gli altri moduli non normati, questo è
uno strumento di orientamento interno a TracciaN, non uno screening
validato con soglie normative pubblicate — la soglia del 70% e le scelte
di quali esercizi rappresentano ciascun dominio sono decisioni interne,
motivate ma non normate, pensate per essere riviste con l'uso clinico
reale. Un solo blocco per condizione (16 prove, 1 tavola per la
Cancellazione) è una stima rapida, non una misura precisa: da trattare
come un primo orientamento su cosa approfondire, non come diagnosi.

## Pubblicazione su GitHub Pages (una volta sola)

1. Su github.com crea un nuovo repository, es. `traccian` (può essere pubblico
   o privato — pubblico è sufficiente e gratuito, il contenuto dei file non
   contiene dati di pazienti).
2. Carica in questo repository **solo questi 5 file**, quelli nella cartella
   principale di questo pacchetto:
   `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`.
   (Su github.com: "Add file" → "Upload files", trascina i 5 file, "Commit changes".)
3. Vai su **Settings → Pages**. In "Source" seleziona il branch `main` e la
   cartella `/ (root)`, poi salva.
4. Dopo un minuto GitHub mostra l'indirizzo pubblico, del tipo:
   `https://<tuo-utente>.github.io/traccian/`

**La cartella `supabase/` non va qui.** GitHub Pages serve solo file
statici (HTML/CSS/JS) — non può eseguire codice server-side. Quella
cartella contiene la funzione che crea gli account paziente e si carica
in un posto completamente diverso (dentro il progetto Supabase stesso,
dal suo pannello di controllo) — vedi "La funzione che crea gli account
paziente" più sotto. Se non ti serve il sistema multi-operatore/paziente,
puoi ignorare del tutto quella cartella.

## Uso sul dispositivo

1. Apri quell'indirizzo dal browser (Safari/Chrome su tablet o smartphone,
   qualunque browser su PC — l'interfaccia si adatta alla larghezza dello
   schermo).
2. Su tablet/smartphone, aggiungi alla schermata Home:
   - **iPad/Safari**: icona di condivisione → "Aggiungi a Home".
   - **Android/Chrome**: menu ⋮ → "Aggiungi a schermata Home" / "Installa app".
3. Da quel momento l'icona TracciaN si apre come un'app a schermo intero,
   senza barra del browser, e funziona anche offline (il service worker
   mette in cache i file dopo il primo caricamento).

## Dati e privacy

- Ogni sessione viene salvata con `localStorage` nel browser di quel
  tablet — non viene inviata a GitHub né a nessun altro server.
- I dati **non si sincronizzano tra dispositivi diversi** a meno di
  configurare la sincronizzazione cloud (sezione successiva). Senza
  cloud, per portare i dati altrove usa "Esporta CSV" nella schermata
  Storico — disponibile solo lato operatore, mai lato paziente.
- Cancellando la cache/i dati del browser (o disinstallando l'app dalla
  Home) si perde anche lo storico locale non sincronizzato: esporta
  periodicamente il CSV se vuoi conservarlo altrove.
- Usa un codice paziente anonimizzato, non il nominativo, nel campo dedicato.

## Sincronizzazione cloud e account multi-utente (facoltativa) — Supabase

Senza fare nulla, l'app resta esattamente com'era: dati solo in locale su quel
dispositivo. Collegando un progetto Supabase gratuito ottieni tre cose insieme:
più operatori possono lavorare in parallelo (ognuno vede solo i propri
pazienti), ogni paziente può allenarsi da un proprio dispositivo con un
semplice codice di accesso, e i risultati restano sempre esportabili in CSV
indipendentemente da tutto il resto. Abilita anche un **registro accessi**
(login/logout/tentativi falliti, vista aggregata per operatore con
drill-down, sezione dedicata visibile solo al super-operatore) — vedi le
istruzioni di attivazione al punto 2 qui sotto.

### 1 — Crea il progetto

1. Vai su [supabase.com](https://supabase.com), crea un account e un nuovo
   progetto. Nella scelta della regione seleziona una regione **UE**
   (es. Frankfurt) — utile per il trattamento di dati sanitari.
2. Nel progetto, vai su **Authentication → Providers** e verifica che
   "Email" sia abilitato. In **Authentication → Settings** disattiva
   "Confirm email" — è necessario perché gli account paziente usano
   un'email sintetica, non reale, che non potrebbe mai essere confermata.

### 2 — Schema del database

Vai su **SQL Editor** e incolla ed esegui questo script per intero — è
**l'unica versione da usare**, sicura da rieseguire in qualsiasi momento
(crea solo quello che manca, non tocca dati esistenti, funziona sia su un
progetto nuovo sia per aggiornare uno già esistente da una versione
precedente di TracciaN):

```sql
create table if not exists pazienti (
  id uuid primary key references auth.users on delete cascade,
  operatore_id uuid references auth.users not null,
  codice_paziente text not null,      -- etichetta scelta dall'operatore, es. "PT-014"
  codice_accesso text not null,       -- il codice che il paziente usa per accedere
  preset_assegnato jsonb,             -- storico: singolo esercizio (versioni precedenti)
  programma_assegnato jsonb,          -- elenco di esercizi assegnati insieme
  ultima_config jsonb,                -- ultima configurazione usata (continuità tra sessioni)
  obiettivo jsonb,                    -- array di obiettivi {tipo:'livello'|'tempo', ...}
  limiti jsonb,                       -- {sessioniAlGiorno, minutiAlGiorno}
  attivo boolean default true,        -- false = profilo archiviato, login bloccato
  screening_flags jsonb,              -- array di esercizi "consigliati" (automatico da screening, sempre sovrascrivibile a mano) — vedi sezione Batteria di screening
  modalita_accesso text default 'diretto', -- 'diretto' | 'screening_poi_suggeriti' — vedi sezione Programma paziente
  screening_completato_il timestamptz,-- prima volta che il gate screening_poi_suggeriti è stato superato
  creato_il timestamptz default now()
);
alter table pazienti add column if not exists preset_assegnato jsonb;
alter table pazienti add column if not exists programma_assegnato jsonb;
alter table pazienti add column if not exists ultima_config jsonb;
alter table pazienti add column if not exists obiettivo jsonb;
alter table pazienti add column if not exists limiti jsonb;
alter table pazienti add column if not exists attivo boolean default true;
alter table pazienti add column if not exists screening_flags jsonb;
alter table pazienti add column if not exists modalita_accesso text default 'diretto'; -- 'diretto' (vede subito il programma assegnato) | 'screening_poi_suggeriti' (vede solo lo screening finché non lo completa una prima volta)
alter table pazienti add column if not exists screening_completato_il timestamptz; -- valorizzato la prima volta che il paziente completa lo screening in modalita_accesso='screening_poi_suggeriti' — il gate scatta una sola volta
alter table pazienti enable row level security;
drop policy if exists "operatore vede e gestisce i propri pazienti" on pazienti;
create policy "operatore vede e gestisce i propri pazienti" on pazienti for all
  using (auth.uid() = operatore_id) with check (auth.uid() = operatore_id);
drop policy if exists "paziente vede solo se stesso" on pazienti;
create policy "paziente vede solo se stesso" on pazienti for select
  using (auth.uid() = id);
drop policy if exists "paziente può aggiornare solo la propria ultima configurazione" on pazienti;
create policy "paziente può aggiornare solo la propria ultima configurazione" on pazienti for update
  using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists sessioni (
  id text primary key,
  user_id uuid references auth.users,           -- storico, mantenuto per compatibilità
  operatore_id uuid references auth.users not null,
  paziente_id uuid references pazienti,          -- null se è una sessione dell'operatore stesso
  local_patient_id text,                         -- profilo paziente locale usato in presenza
  ts bigint, date_label text, stim_type text, n_level int, trials int, isi int,
  stim_duration int, resp_mode text, patient_code text, notes text, task_mode text,
  target_seq jsonb, family text, counts jsonb, metrics jsonb, avg_rt numeric,
  duration_ms bigint, counts_aud jsonb, metrics_aud jsonb, choice jsonb,
  ssrt numeric, mean_ssd numeric,
  neglect jsonb,     -- dati esercizio Cancellazione
  goaltask jsonb,    -- dati esercizio Scenari ecologici
  memoria jsonb,     -- dati esercizio Strategie di memoria
  inserted_at timestamptz default now()
);
alter table sessioni add column if not exists operatore_id uuid references auth.users;
alter table sessioni add column if not exists paziente_id uuid references pazienti;
alter table sessioni add column if not exists local_patient_id text;
alter table sessioni add column if not exists neglect jsonb;
alter table sessioni add column if not exists goaltask jsonb;
alter table sessioni add column if not exists memoria jsonb;
update sessioni set operatore_id = user_id where operatore_id is null;
alter table sessioni alter column operatore_id set not null;
alter table sessioni enable row level security;
drop policy if exists "lettura sessioni proprie o dei propri pazienti" on sessioni;
create policy "lettura sessioni proprie o dei propri pazienti" on sessioni for select
  using (auth.uid() = operatore_id or auth.uid() = paziente_id);
drop policy if exists "inserimento sessioni proprie o come paziente proprio" on sessioni;
create policy "inserimento sessioni proprie o come paziente proprio" on sessioni for insert
  with check (
    (auth.uid() = operatore_id and paziente_id is null)
    or (auth.uid() = paziente_id and operatore_id = (select operatore_id from pazienti where id = auth.uid()))
    or (auth.uid() = operatore_id and exists(select 1 from pazienti p where p.id = sessioni.paziente_id and p.operatore_id = auth.uid()))
  );
drop policy if exists "aggiornamento sessioni proprie o dei propri pazienti" on sessioni;
create policy "aggiornamento sessioni proprie o dei propri pazienti" on sessioni for update
  using (auth.uid() = operatore_id or auth.uid() = paziente_id)
  with check (auth.uid() = operatore_id or auth.uid() = paziente_id);
drop policy if exists "solo i propri dati" on sessioni;

-- Profili paziente "in presenza": solo un'etichetta scelta dall'operatore,
-- senza account/login (a differenza di pazienti sopra). Rispecchiano su
-- Supabase i profili che prima vivevano solo in localStorage — così non
-- spariscono cambiando browser/dispositivo/cache. Isolati per operatore
-- da RLS, non referenziano auth.users come id (id è generato dal client).
create table if not exists pazienti_locali (
  id text primary key,
  operatore_id uuid references auth.users not null,
  nome text not null,
  ultima_config jsonb,
  screening_flags jsonb, -- vedi sezione Batteria di screening
  programma_assegnato jsonb, -- elenco di esercizi assegnati come scorciatoia di avvio rapido in presenza (non vincolante)
  creato_il timestamptz default now()
);
alter table pazienti_locali add column if not exists screening_flags jsonb;
alter table pazienti_locali add column if not exists programma_assegnato jsonb;
alter table pazienti_locali enable row level security;
drop policy if exists "operatore vede e gestisce i propri pazienti locali" on pazienti_locali;
create policy "operatore vede e gestisce i propri pazienti locali" on pazienti_locali for all
  using (auth.uid() = operatore_id) with check (auth.uid() = operatore_id);

-- Sessione unica per account: una riga per utente con un gettone casuale,
-- sovrascritto ad ogni login. Ogni scheda/dispositivo collegato controlla
-- periodicamente se il proprio gettone è ancora quello valido; se un altro
-- accesso lo sovrascrive nel frattempo, quella sessione si disconnette da
-- sola. Impedisce l'uso concorrente delle stesse credenziali da più persone.
create table if not exists sessioni_login (
  user_id uuid primary key references auth.users on delete cascade,
  token text not null,
  aggiornato_il timestamptz default now()
);
alter table sessioni_login enable row level security;
drop policy if exists "solo il proprio gettone di sessione" on sessioni_login;
create policy "solo il proprio gettone di sessione" on sessioni_login for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ruoli: distingue il super-operatore (unico che può leggere il registro
-- accessi sotto) dagli altri operatori. Nessuna riga = operatore normale;
-- va creata a mano una sola volta per l'account che deve avere accesso
-- completo (vedi istruzioni subito dopo il blocco SQL).
create table if not exists operatori (
  id uuid primary key references auth.users on delete cascade,
  super boolean default false,
  creato_il timestamptz default now()
);
alter table operatori enable row level security;
drop policy if exists "un operatore vede solo la propria riga di ruolo" on operatori;
create policy "un operatore vede solo la propria riga di ruolo" on operatori for select
  using (auth.uid() = id);

-- Registro accessi: eventi discreti di login (riuscito/fallito) e logout,
-- per operatori e pazienti. L'insert è volutamente aperto a chiunque
-- (anche prima del login, quando un tentativo fallisce non esiste ancora
-- una sessione autenticata) — la protezione dei dati sta tutta nella
-- policy di lettura, riservata al super-operatore. Nessuna cancellazione
-- automatica: la conservazione minima di 6 mesi richiesta è già garantita
-- semplicemente non cancellando nulla; un'eventuale pulizia periodica va
-- fatta a mano o con un cron dedicato, in un secondo momento.
create table if not exists accessi (
  id bigint generated always as identity primary key,
  evento text not null,          -- 'login' | 'logout'
  esito text not null,           -- 'successo' | 'fallito'
  user_type text not null,       -- 'operatore' | 'paziente'
  user_id uuid references auth.users,  -- null se il login è fallito (nessuna sessione creata)
  email_tentata text,            -- email reale (operatore) o indirizzo sintetico/codice (paziente) — anche per i tentativi falliti
  ts timestamptz default now()
);
alter table accessi enable row level security;
drop policy if exists "chiunque può registrare un evento di accesso" on accessi;
create policy "chiunque può registrare un evento di accesso" on accessi for insert
  with check (true);
drop policy if exists "solo il super-operatore legge il registro accessi" on accessi;
create policy "solo il super-operatore legge il registro accessi" on accessi for select
  using (exists(select 1 from operatori o where o.id = auth.uid() and o.super = true));
```

**Attivare il super-operatore (una sola volta, solo per il tuo account).**
Dopo aver eseguito lo script sopra:
1. Su Supabase, **Authentication → Users**, copia l'UUID del tuo account operatore (quello con cui accedi normalmente all'app).
2. Nel **SQL Editor**, esegui (sostituendo l'UUID):
   ```sql
   insert into operatori (id, super) values ('INCOLLA-QUI-IL-TUO-UUID', true)
   on conflict (id) do update set super = true;
   ```
3. Ricarica l'app e accedi di nuovo: nella home operatore comparirà una sezione "Solo super-operatore" con il Registro accessi. Gli altri operatori non la vedranno, e un tentativo di lettura diretto della tabella `accessi` con le loro credenziali restituirà righe vuote per via della RLS.


**Checklist di sicurezza per ogni nuova tabella.** La chiave "anon" incollata
nell'app è pubblica per design — l'unica cosa che impedisce a chiunque abbia
URL+chiave di leggere/scrivere dati altrui è Row Level Security. Prima di
mettere in produzione qualsiasi tabella nuova:

1. `alter table NOME_TABELLA enable row level security;` — senza questo
   comando la tabella è raggiungibile da chiunque via REST, chiave anon
   incluso, a prescindere da qualunque policy scritta dopo.
2. Almeno una `create policy` per ogni operazione che l'app userà su quella
   tabella (`select`/`insert`/`update`/`delete`, o `for all`) — una tabella
   con RLS abilitata ma senza policy nega tutto per default, quindi l'errore
   qui si manifesta come "l'app non funziona" (facile da notare) più spesso
   che come falla silenziosa — ma va comunque verificato esplicitamente.
3. Testare la policy con l'utente meno privilegiato previsto (es. un account
   paziente) prima di considerarla pronta, non solo con l'account operatore.
4. Verificare in **Authentication → Sign In / Providers** che "Allow new
   users to sign up" sia disattivato su ogni progetto in uso clinico reale
   (va ricontrollato periodicamente, non solo alla configurazione iniziale).

Le sei tabelle sopra (`pazienti`, `sessioni`, `pazienti_locali`,
`sessioni_login`, `operatori`, `accessi`) hanno già RLS abilitata con policy
verificate — questa checklist riguarda solo eventuali tabelle aggiunte in
futuro. Le colonne `screening_flags` aggiunte a `pazienti`/`pazienti_locali`
sono coperte dalle stesse policy già esistenti su quelle tabelle (le policy
sono per riga, non per colonna).

Infine, in **Project Settings → API**, copia **Project URL** e la chiave
**anon public** (non la "service_role" — quella non va mai incollata
nell'app, serve solo al passo successivo, lato server).

### 3 — La funzione che crea gli account paziente

Creare un account non è un'operazione che il browser può fare da solo in
sicurezza: servirebbe la chiave "service_role", che non deve mai stare nel
codice pubblico. Per questo la creazione degli account paziente passa da una
piccola **Edge Function** — un frammento di codice che gira sui server di
Supabase, non nel browser di nessuno, e **non va caricato su GitHub**: si
carica direttamente nel progetto Supabase, dal browser.

**Nota sulle chiavi:** Supabase fornisce automaticamente a ogni Edge
Function le chiavi di cui ha bisogno (incluse URL e service role) — **non
serve creare nessun segreto manualmente**, anzi Supabase blocca esplicitamente
la creazione di segreti con nome che inizia per `SUPABASE_` (comparirebbe
l'errore "Name must not start with the SUPABASE_ prefix" se lo tentassi). Il
codice della funzione in questo pacchetto è già scritto per leggerle da solo.

**Via più semplice — dalla Dashboard, senza installare nulla:**

1. Nel tuo progetto Supabase, vai su **Edge Functions** nel menu laterale.
2. Clicca **"Deploy a new function"** → **"Via Editor"**.
3. Come nome della funzione scrivi esattamente `create-patient` (deve
   combaciare con quello che l'app si aspetta).
4. Si apre un editor di codice nel browser con un template — cancella tutto
   il contenuto e incolla al suo posto il contenuto del file
   `supabase/functions/create-patient/index.ts` di questo pacchetto (aprilo
   con un editor di testo qualsiasi, seleziona tutto, copia).
5. Clicca **Deploy**. Fatto — nessun altro passaggio, la funzione è già
   attiva e l'app può creare account paziente.

**Origin consentito (CORS):** per difesa in profondità, la funzione accetta
richieste solo dall'origin GitHub Pages di TracciaN (`https://latonshriek.github.io`
di default, scritto nel codice). Se pubblichi l'app su un dominio diverso o
su più domini, aggiungi un secret **Edge Functions → create-patient →
Secrets → `ALLOWED_ORIGIN`** con l'URL (o gli URL, separati da virgola)
corretto — altrimenti il browser bloccherà le chiamate con un errore CORS.
Non è comunque una barriera di sicurezza da sola (la funzione resta protetta
principalmente dal controllo "operatore autenticato" nel codice), solo un
livello in più.

**Via alternativa — con la CLI (se preferisci lavorare da terminale, o vuoi
tenere la funzione sotto controllo versione insieme al resto del codice):**

1. Installa la [CLI di Supabase](https://supabase.com/docs/guides/cli) sul tuo
   computer (una volta sola): `npm install -g supabase`.
2. Nella cartella di questo progetto (quella che contiene anche la cartella
   `supabase/`), collega il tuo progetto Supabase:
   ```
   supabase login
   supabase link --project-ref <il-tuo-project-ref>
   ```
   (il project-ref è nell'URL del progetto: `https://<project-ref>.supabase.co`)
3. Pubblica la funzione:
   ```
   supabase functions deploy create-patient
   ```

Da quel momento, dalla schermata "Gestisci pazienti" dell'app, ogni nuovo
paziente creato genera un account reale e isolato, con un codice di accesso
di 8 caratteri mostrato una sola volta all'operatore (da consegnare al
paziente — non è recuperabile in seguito dall'interfaccia, solo dal database
se serve).

### 4 — Collegare l'app

Due modi, a seconda se vuoi che URL e chiave siano già incorporate nell'app
per tutti (consigliato per un team) o configurabili da ciascuno (utile solo
per test rapidi).

**Modo consigliato — incorporata per tutti (una volta sola per ogni
consegna aggiornata del codice):**

1. Apri `index.html` con un editor di testo, cerca le righe:
   ```js
   const BAKED_SUPABASE_URL = '';
   const BAKED_SUPABASE_KEY = '';
   ```
   (sono vicine all'inizio del file, dentro il tag `<script>`).
2. Incolla il tuo Project URL e la chiave anon/publishable tra gli apici,
   es. `const BAKED_SUPABASE_URL = 'https://xxxxx.supabase.co';`.
3. Salva, ricarica `index.html` su GitHub.

Da quel momento **chiunque apra l'app — operatori e pazienti — vede subito
la schermata di accesso**, senza alcun campo di configurazione.

**Modo alternativo — configurabile in-app:** lascia quelle due righe vuote.
Al primo utilizzo comparirà un campo per incollare URL e chiave manualmente
(utile per provare l'app con progetti Supabase diversi senza modificare il
codice ogni volta).

In entrambi i casi, poi:

- **Come operatore**: scegli "Operatore", "Registrati" con un'email e una
  password (solo la prima volta — e solo finché "Allow new users to sign up"
  è attivo su Supabase, vedi sotto). Sugli altri dispositivi fai "Accedi"
  con le stesse credenziali. Da "Gestisci pazienti" crei i profili paziente
  e assegni loro uno o più allenamenti.
- **Come paziente**: scegli "Paziente", inserisci il codice di 8 caratteri
  ricevuto dall'operatore. Non serve altro — l'app mostra direttamente
  gli allenamenti assegnati.

**Limitare chi può registrarsi come operatore:** per impostazione predefinita
chiunque trovi l'URL dell'app può registrarsi. Per impedirlo — utile dopo
esserti registrato tu la prima volta — vai su **Authentication → Sign In /
Providers** e disattiva **"Allow new users to sign up"**. Da quel momento
solo chi ha già un account può accedere; per aggiungere un nuovo collega
operatore vai su **Authentication → Users → "Add user"** e crealo tu
direttamente dal pannello (spunta "Auto Confirm User" per evitare l'email
di conferma). Per rimuovere un account operatore, stessa schermata → elimina
l'utente. Per rimuovere davvero un account paziente (oltre a "Elimina"
nell'app, che rimuove il profilo ma non le credenziali sottostanti), cerca
in quella stessa schermata l'email `<codice minuscolo>@paz.traccian.local`
ed eliminala.

Ogni sessione salvata si sincronizza automaticamente in background; se il
dispositivo è offline resta salvata in locale e si sincronizza al primo
accesso a Internet. Un operatore vede sempre lo storico proprio e di tutti i
suoi pazienti insieme; un paziente vede solo il proprio, e non può esportare
CSV (riservato all'operatore).

La chiave "anon"/"publishable" è pensata per essere pubblica — la
protezione reale sono le policy SQL sopra più il login di ciascuno. Non
mettere mai la chiave "service_role"/"secret" nell'app, nemmeno qui: quella
resta solo nel segreto della Edge Function.

Per applicare modifiche future, basta sostituire `index.html` (e gli altri
file se cambiati) nello stesso repository — GitHub Pages si aggiorna da solo
in circa un minuto. Lo storico salvato sul tablet non viene toccato.

## Gestione pazienti: programma, modalità di accesso, obiettivi, limiti, RCI, archiviazione

**Programma assegnato** — dalla schermata "Gestisci programma" (pazienti
remoti) o "Assegna programma" (pazienti in presenza) l'operatore
seleziona uno o più preset salvati sul dispositivo. Per un paziente
remoto è ciò che vede e può avviare da solo a ogni accesso. Per un
paziente in presenza è solo una **scorciatoia di avvio rapido** quando
l'operatore lo seleziona per la seduta — non è vincolante: resta libero
di lanciare qualunque altro esercizio in qualsiasi momento.

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

**Suggerimenti da screening → programma** — ogni volta che uno screening
(lanciato dall'operatore, o dal paziente stesso nel flusso "solo
screening all'inizio") flagga un dominio, il suggerimento compare come
etichetta ⭐ accanto al nome del paziente, con due azioni: **"+ Aggiungi"**
lo trasforma subito in una voce reale del programma (con una
configurazione di partenza già tarata su quel dominio, adattiva), **"✕"**
lo scarta. Questa è la stessa leva usata dall'autorizzazione automatica
del gate — la differenza è solo se scatta da sola alla prima valutazione
o se la usa l'operatore a mano in qualsiasi momento successivo, anche
ripetutamente.

**Eredità da un profilo in presenza** — il pulsante "Trasforma in
account remoto" (disponibile ovunque sia selezionato un paziente in
presenza) porta con sé, oltre allo storico già registrato, anche il
programma assegnato e i suggerimenti da screening del profilo locale,
se presenti. Il nuovo account remoto parte in modalità "Diretto".

**Obiettivi** — un paziente può averne più di uno contemporaneamente, di
due tipi: **livello** (un livello target su un esercizio specifico) o
**tempo** (minuti di allenamento accumulati, a settimana o in totale,
indipendentemente dall'esercizio). Facoltativi: senza obiettivi impostati
il paziente si allena normalmente. Il paziente vede solo una barra
percentuale per ciascuno, senza etichetta; l'operatore vede la stessa
barra con l'etichetta completa. Per un obiettivo di livello, il progresso
non salta a scatti del 20% per livello: usa l'accuratezza dell'ultima
sessione confrontata con le soglie 70-85% per dare una posizione continua
dentro il livello corrente (eccezione: lo Stop-Signal resta a gradino
secco, essendo guidato dallo staircase SSD e non dalla regola 70-85%).

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
decidere se ripetere una forma è appropriato per quel caso. I livelli
3-16 restano per ora a forma singola — l'estensione delle forme
parallele è un lavoro di contenuto da proseguire gradualmente, non un
limite del meccanismo.

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
