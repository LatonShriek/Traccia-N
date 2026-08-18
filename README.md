# TracciaN — batteria di attenzione e controllo esecutivo per tablet

Applicazione web standalone per la somministrazione di una batteria di 10
esercizi di attenzione, memoria di lavoro, controllo esecutivo e memoria
strategica: N-back, Sequenza bersaglio, Go/No-Go, Stop-Signal, Attenzione
(tipo ANT/TAPAT), Task-switching, Doppio compito, Cancellazione (neglect),
Scenari ecologici (pianificazione/multitasking) e Strategie di memoria
(PQRST/chunking). Raccolta risposte touch o manuale, punteggio automatico,
istruzioni leggibili e ascoltabili prima di ogni esercizio, storico
sessioni sincronizzabile, ed è utilizzabile da più operatori insieme e da
pazienti in autonomia da propri dispositivi.

**Nessun server obbligatorio, nessun account richiesto per l'uso base.**
I dati restano salvati in locale nel browser del dispositivo
(`localStorage`); la sincronizzazione cloud (Supabase) — che abilita
multi-operatore e accesso paziente — è opzionale.

**Indice:** [Framework teorico](#framework-teorico-della-batteria) ·
[Difficoltà adattiva](#difficoltà-adattiva) ·
[Pubblicazione su GitHub Pages](#pubblicazione-su-github-pages-una-volta-sola) ·
[Uso sul dispositivo](#uso-sul-dispositivo) ·
[Dati e privacy](#dati-e-privacy) ·
[Sincronizzazione cloud e multi-utente](#sincronizzazione-cloud-e-account-multi-utente-facoltativa--supabase) ·
[Gestione pazienti: obiettivi, limiti, RCI, archiviazione](#gestione-pazienti-obiettivi-limiti-rci-archiviazione) ·
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
regola: valutano blocchi di 8 prove valide (o, per la Cancellazione, ogni
tavola), salgono di un livello sopra l'85% di accuratezza, scendono sotto
il 70% (fascia 70–85% invariata) — livello minimo 1, massimo 5. La soglia
è coerente sia con la letteratura sul training adattivo sia con la
"Eighty Five Percent Rule" (Wilson et al., 2019) sul tasso di errore
ottimale per l'apprendimento. Durante la sessione sono sempre disponibili
i pulsanti +/– nella barra in alto per forzare il livello manualmente in
qualunque momento; se la titolazione automatica è attiva riprende dal
valore impostato manualmente.

Fa eccezione lo **Stop-Signal**, che usa una titolazione propria e
indipendente: lo staircase del ritardo SSD (Stop Signal Delay), sempre
attivo, che converge verso il punto in cui il paziente riesce a fermarsi
circa il 50% delle volte — non la regola 70-85%. Ha comunque anche lui
una leva secondaria opzionale sull'ISI, quella sì guidata dalla regola
70-85% standard, ma solo sull'accuratezza dei trial "go".

Gli **Scenari ecologici** hanno una progressione a 3 livelli scelti
manualmente in setup (facile/medio/difficile), non una titolazione
automatica in tempo reale — la natura del compito (completare un elenco
di elementi, non rispondere a stimoli ripetuti) non si presta allo stesso
meccanismo. Le **Strategie di memoria** hanno 16 livelli di difficoltà
del materiale, anch'essi scelti manualmente.

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
indipendentemente da tutto il resto.

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
  creato_il timestamptz default now()
);
alter table pazienti add column if not exists preset_assegnato jsonb;
alter table pazienti add column if not exists programma_assegnato jsonb;
alter table pazienti add column if not exists ultima_config jsonb;
alter table pazienti add column if not exists obiettivo jsonb;
alter table pazienti add column if not exists limiti jsonb;
alter table pazienti add column if not exists attivo boolean default true;
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
  creato_il timestamptz default now()
);
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
```

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

## Gestione pazienti: obiettivi, limiti, RCI, archiviazione

Tutto questo si gestisce da **"Gestisci programma"**, sul profilo di un
paziente remoto.

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
ecologici quotidiani.

**10 scenari disponibili**, ciascuno con **3 livelli di complessità**
selezionabili in setup (facile/medio/difficile: cambiano insieme numero
di elementi, presenza della regola anti-ripetizione, e ampiezza del
budget di tempo):

1. **Sei compiti** (Modified Six Elements classico)
2. **Preparare il tè** (sequenziamento procedurale semplice)
3. **Gestione farmacologica settimanale** (dipendenze temporali fra dosi)
4. **Spesa con budget limitato**
5. **Appuntamenti e mezzi pubblici** (memoria prospettica basata sul tempo)
6. **Sicurezza domestica prima di uscire**
7. **Commissioni in centro** (Multiple Errands semplificato)
8. **Organizzare un pranzo in famiglia**
9. **Routine mattutina**
10. **Percorso a tappe con regole** (ispirato alla Mappa dello zoo della BADS)

Due idee discusse in fase di progettazione — un labirinto di
pianificazione spaziale e un puzzle di trasformazione risorse (tipo
"lupo-capra-cavolo") — non sono incluse: sono problemi di percorso/spazio
di stati, una struttura diversa da "elenco con vincoli", che
richiederebbe un motore dedicato separato da questo.

## Strategie di memoria

Decimo esercizio della batteria. Due modalità, un livello 1-16 da
scegliere in setup:

**PQRST** (16 brani graduati) — la fase di studio è guidata a passaggi
veri, non un unico schermo con tutto il testo: 1) **Anteprima** (solo il
titolo — "cosa pensi che racconterà?"), 2) **Domanda** (formularsi una
domanda a cui il brano dovrebbe rispondere), 3) **Lettura** (il testo
compare, con opzione di ascolto vocale), 4) **Ripeti a te stesso** (il
testo si nasconde, il paziente richiama mentalmente prima del test) — le
quattro lettere della tecnica, con il richiamo finale a fare da quinto
passaggio ("Test"). I brani crescono per lunghezza (~30→~220 parole),
densità di idee, presenza di dettagli interferenti (numeri, nomi,
date — assenti nei primi livelli), complessità sintattica, astrattezza
del contenuto.

**Chunking** (16 liste di parole graduate) — la fase di studio mostra un
suggerimento di strategia esplicito: se la lista è categorizzabile
(livelli 1-5), rivela la categoria e invita a raggruppare mentalmente;
se non lo è (dal livello 6 in su), invita a creare associazioni o
piccole storie proprie. Le liste crescono per lunghezza (4→14 parole),
presenza di categorie semantiche raggruppabili, concretezza/immaginabilità
delle parole, frequenza d'uso.

**Valutazione del richiamo** — uguale per entrambe le modalità: il
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
