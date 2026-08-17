# TracciaN — batteria di attenzione e controllo esecutivo per tablet

Applicazione web standalone per la somministrazione di una batteria di 8
esercizi di attenzione, memoria di lavoro e controllo cognitivo: N-back,
Sequenza bersaglio, Go/No-Go, Stop-Signal, Attenzione (tipo ANT),
Task-switching, Doppio compito, Cancellazione (neglect). Raccolta risposte
touch o manuale, punteggio automatico, istruzioni leggibili e ascoltabili
prima di ogni esercizio, storico sessioni sincronizzabile, ed è utilizzabile
da più operatori insieme e da pazienti in autonomia da propri dispositivi.

**Nessun server obbligatorio, nessun account richiesto per l'uso base.**
I dati restano salvati in locale nel browser del dispositivo
(`localStorage`); la sincronizzazione cloud (Supabase) — che abilita
multi-operatore e accesso paziente — è opzionale.

**Indice:** [Framework teorico](#framework-teorico-della-batteria) ·
[Difficoltà adattiva](#difficoltà-adattiva) ·
[Pubblicazione su GitHub Pages](#pubblicazione-su-github-pages-una-volta-sola) ·
[Uso sul dispositivo](#uso-sul-dispositivo) ·
[Dati e privacy](#dati-e-privacy) ·
[Sincronizzazione cloud e multi-utente](#sincronizzazione-cloud-e-account-multi-utente-facoltativa--supabase)

## Framework teorico della batteria

Ogni esercizio è stato scelto per campionare un costrutto/rete diversa,
secondo una logica di copertura piuttosto che di ripetizione — l'obiettivo
è un profilo multidimensionale del controllo attentivo-esecutivo, non
sette varianti dello stesso compito.

| Esercizio | Costrutto | Rete/meccanismo principale |
|---|---|---|
| N-back | Aggiornamento della memoria di lavoro (updating) | Fronto-parietale, DLPFC |
| Sequenza bersaglio | Context processing, controllo proattivo/reattivo (ispirato all'AX-CPT) | DLPFC (proattivo) + ACC (reattivo) |
| Go/No-Go | Inibizione di un'azione non ancora iniziata (action restraint) | Giro frontale inferiore sinistro + parietale |
| Stop-Signal | Cancellazione di un'azione già in corso (action cancellation), con stima di SSRT | Via fronto-striatale destra (RIFG–preSMA–STN) |
| Attenzione (tipo ANT) | Allerta, orienting spaziale, conflitto percettivo | Locus coeruleus-NA; reti dorsale/ventrale; ACC-DLPFC |
| Task-switching | Flessibilità cognitiva (shifting), switch cost | Rete fronto-parietale dominio-generale, solco frontale inferiore |
| Doppio compito | Attenzione divisa, coordinamento di due compiti concorrenti | Corteccia frontopolare (BA10), colli di bottiglia prefrontali laterali |
| Cancellazione (neglect) | Ricerca visiva ed esplorazione spaziale simmetrica/asimmetrica | Rete attentiva parietale destra; asimmetria sinistra/destra come indice di neglect |

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
normato — utile per training ed esplorazione, non per la diagnosi.
Questi esercizi sono pensati per **trattamento e monitoraggio
intra-soggetto nel tempo**, non per confronto normativo — a differenza
dei protocolli di NeuroScore, non hanno tabelle di riferimento.

## Difficoltà adattiva

Disponibile per ora solo per l'**N-back** (attivabile in setup, "Difficoltà
adattiva"): valuta blocchi di 8 prove valide, sale di un livello sopra
l'85% di accuratezza, scende sotto il 70% (fascia 70–85% invariata) —
livello minimo 1, massimo 5. Anche a impostazione fissa, durante la
sessione sono sempre disponibili i pulsanti +/– nella barra in alto per
forzare il livello manualmente in qualunque momento; se la titolazione
automatica è attiva riprende dal valore impostato manualmente. La soglia
è coerente sia con la letteratura sul training n-back adattivo sia con la
"Eighty Five Percent Rule" (Wilson et al., 2019) sul tasso di errore
ottimale per l'apprendimento. Lo Stop-Signal ha una propria titolazione
automatica indipendente (lo staircase del ritardo SSD, sempre attivo per
quell'esercizio). Gli altri esercizi non hanno ancora una titolazione
automatica — i parametri si impostano manualmente in setup.


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
- I dati **non si sincronizzano tra dispositivi diversi**: se usi più
  tablet, ciascuno avrà il proprio storico locale. Per portare i dati
  altrove usa il pulsante "Esporta CSV" nella schermata Storico.
- Cancellando la cache/i dati del browser (o disinstallando l'app dalla
  Home) si perde anche lo storico locale: esporta periodicamente il CSV
  se vuoi conservarlo altrove.
- Usa un codice paziente anonimizzato, non il nominativo, nel campo dedicato.

## Sincronizzazione cloud e account multi-utente (facoltativa) — Supabase

Senza fare nulla, l'app resta esattamente com'era: dati solo in locale su quel
dispositivo. Collegando un progetto Supabase gratuito ottieni tre cose insieme:
più operatori possono lavorare in parallelo (ognuno vede solo i propri
pazienti), ogni paziente può allenarsi da un proprio dispositivo con un
semplice codice di accesso, e i risultati restano sempre esportabili in CSV
indipendentemente da tutto il resto — quindi anche se un giorno Supabase
introducesse limiti scomodi, l'unica cosa che si perderebbe è la comodità
della sincronizzazione automatica, mai i dati.

### 1 — Crea il progetto

1. Vai su [supabase.com](https://supabase.com), crea un account e un nuovo
   progetto. Nella scelta della regione seleziona una regione **UE**
   (es. Frankfurt) — utile per il trattamento di dati sanitari.
2. Nel progetto, vai su **Authentication → Providers** e verifica che
   "Email" sia abilitato. In **Authentication → Settings** disattiva
   "Confirm email" — è necessario perché gli account paziente usano
   un'email sintetica, non reale, che non potrebbe mai essere confermata.

### 2 — Schema del database

Vai su **SQL Editor**, incolla ed esegui questo script per intero (crea sia
la tabella sessioni sia quella pazienti, con tutte le regole di sicurezza):

```sql
-- Tabella pazienti: ogni riga è un account paziente (id = auth.users.id
-- del suo account sintetico), collegato all'operatore che lo ha creato.
create table pazienti (
  id uuid primary key references auth.users on delete cascade,
  operatore_id uuid references auth.users not null,
  codice_paziente text not null,      -- etichetta scelta dall'operatore, es. "PT-014"
  codice_accesso text not null,       -- il codice che il paziente usa per accedere
  preset_assegnato jsonb,             -- storico: singolo esercizio (versioni precedenti)
  programma_assegnato jsonb,          -- attuale: elenco di più esercizi assegnati insieme
  ultima_config jsonb,                -- ultima configurazione usata (continuità tra sessioni)
  obiettivo jsonb,                     -- {taskMode, livelloTarget} impostato dall'operatore
  creato_il timestamptz default now()
);

alter table pazienti enable row level security;

create policy "operatore vede e gestisce i propri pazienti"
  on pazienti for all
  using (auth.uid() = operatore_id)
  with check (auth.uid() = operatore_id);

create policy "paziente vede solo se stesso"
  on pazienti for select
  using (auth.uid() = id);

create policy "paziente può aggiornare solo la propria ultima configurazione"
  on pazienti for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Tabella sessioni: ogni riga appartiene a un operatore (le sue sessioni di
-- test personali, o quelle di un suo paziente) o a un paziente (le proprie).
create table sessioni (
  id text primary key,
  user_id uuid references auth.users,          -- storico, mantenuto per compatibilità
  operatore_id uuid references auth.users not null,
  paziente_id uuid references pazienti,         -- null se è una sessione dell'operatore stesso
  local_patient_id text,                        -- profilo paziente locale usato in presenza (facoltativo)
  ts bigint,
  date_label text,
  stim_type text,
  n_level int,
  trials int,
  isi int,
  stim_duration int,
  resp_mode text,
  patient_code text,
  notes text,
  task_mode text,
  target_seq jsonb,
  family text,
  counts jsonb,
  metrics jsonb,
  avg_rt numeric,
  duration_ms bigint,
  counts_aud jsonb,
  metrics_aud jsonb,
  choice jsonb,
  ssrt numeric,
  mean_ssd numeric,
  neglect jsonb,
  inserted_at timestamptz default now()
);

alter table sessioni enable row level security;

create policy "lettura sessioni proprie o dei propri pazienti"
  on sessioni for select
  using (auth.uid() = operatore_id or auth.uid() = paziente_id);

create policy "inserimento sessioni proprie o come paziente proprio"
  on sessioni for insert
  with check (
    (auth.uid() = operatore_id and paziente_id is null)
    or
    (auth.uid() = paziente_id and operatore_id = (select operatore_id from pazienti where id = auth.uid()))
    or
    (auth.uid() = operatore_id and exists(select 1 from pazienti p where p.id = sessioni.paziente_id and p.operatore_id = auth.uid()))
  );

create policy "aggiornamento sessioni proprie o dei propri pazienti"
  on sessioni for update
  using (auth.uid() = operatore_id or auth.uid() = paziente_id)
  with check (auth.uid() = operatore_id or auth.uid() = paziente_id);
```

Se avevi già la tabella `sessioni` da una versione precedente di TracciaN,
non ricrearla: esegui invece solo questo, poi lo script della tabella
`pazienti` e delle policy sopra:

```sql
alter table sessioni add column if not exists operatore_id uuid references auth.users;
alter table sessioni add column if not exists paziente_id uuid;
alter table sessioni add column if not exists neglect jsonb;
update sessioni set operatore_id = user_id where operatore_id is null;
alter table sessioni alter column operatore_id set not null;
drop policy if exists "solo i propri dati" on sessioni;
alter table pazienti add column if not exists programma_assegnato jsonb;
alter table sessioni add column if not exists local_patient_id text;
alter table pazienti add column if not exists ultima_config jsonb;
alter table pazienti add column if not exists obiettivo jsonb;
drop policy if exists "paziente può aggiornare solo la propria ultima configurazione" on pazienti;
create policy "paziente può aggiornare solo la propria ultima configurazione"
  on pazienti for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
drop policy if exists "inserimento sessioni proprie o come paziente proprio" on sessioni;
create policy "inserimento sessioni proprie o come paziente proprio"
  on sessioni for insert
  with check (
    (auth.uid() = operatore_id and paziente_id is null)
    or
    (auth.uid() = paziente_id and operatore_id = (select operatore_id from pazienti where id = auth.uid()))
    or
    (auth.uid() = operatore_id and exists(select 1 from pazienti p where p.id = sessioni.paziente_id and p.operatore_id = auth.uid()))
  );
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

**Via più semplice — dalla Dashboard, senza installare nulla:**

1. Nel tuo progetto Supabase, vai su **Edge Functions** nel menu laterale.
2. Clicca **"Deploy a new function"** → **"Via Editor"**.
3. Come nome della funzione scrivi esattamente `create-patient` (deve
   combaciare con quello che l'app si aspetta).
4. Si apre un editor di codice nel browser con un template — cancella tutto
   il contenuto e incolla al suo posto il contenuto del file
   `supabase/functions/create-patient/index.ts` di questo pacchetto (aprilo
   con un editor di testo qualsiasi, seleziona tutto, copia).
5. Clicca **Deploy**.
6. Ora serve il segreto — cerca **"Secrets"** nella sezione Edge Functions
   (o nelle impostazioni del progetto) e aggiungi:
   - nome: `SUPABASE_SERVICE_ROLE_KEY`
   - valore: la trovi in **Project Settings → API → service_role** (non la
     stessa chiave "anon" che hai incollato nell'app — questa è diversa e
     non va mai messa lì)

Fatto questo, la funzione è attiva e l'app può creare account paziente.

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
3. Imposta il segreto:
   ```
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<la-tua-service-role-key>
   ```
4. Pubblica la funzione:
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

**Modo consigliato — incorporata per tutti (una volta sola):**

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
la schermata di accesso**, senza alcun campo di configurazione: l'app sa
già a quale progetto parlare. Questo è anche il modo per tenere la
configurazione "fuori dalla vista" dei singoli operatori: la imposti tu una
volta nel codice, loro vedono solo login/registrazione.

**Modo alternativo — configurabile in-app:** lascia quelle due righe vuote
come nello zip originale. Al primo utilizzo comparirà un campo per incollare
URL e chiave manualmente (utile per provare l'app con progetti Supabase
diversi senza modificare il codice ogni volta).

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
di conferma).

Ogni sessione salvata si sincronizza automaticamente in background; se il
dispositivo è offline resta salvata in locale e si sincronizza al primo
accesso a Internet. Un operatore vede sempre lo storico proprio e di tutti i
suoi pazienti insieme; un paziente vede solo il proprio.

La chiave "anon"/"publishable" è pensata per essere pubblica — la
protezione reale sono le policy SQL sopra più il login di ciascuno. Non
mettere mai la chiave "service_role"/"secret" nell'app, nemmeno qui: quella
resta solo nel segreto della Edge Function.




Per applicare modifiche future, basta sostituire `index.html` (e gli altri
file se cambiati) nello stesso repository — GitHub Pages si aggiorna da solo
in circa un minuto. Lo storico salvato sul tablet non viene toccato.
