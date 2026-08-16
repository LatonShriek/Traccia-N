# TracciaN — batteria di attenzione e controllo esecutivo per tablet

Applicazione web standalone per la somministrazione di una batteria di 7
esercizi di attenzione, memoria di lavoro e controllo cognitivo, con
raccolta risposte touch o manuale, punteggio automatico e storico
sessioni sincronizzabile.

**Nessun server obbligatorio, nessun account richiesto per l'uso base.**
I dati restano salvati in locale nel browser del tablet (`localStorage`);
la sincronizzazione cloud (Supabase) è opzionale.

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

**Limiti dichiarati, non nascosti:** l'AX-CPT qui implementato (la
"sequenza bersaglio") è semplificato — non distingue i quattro tipi di
trial (AX/AY/BX/BY) dell'AX-CPT classico, quindi non fornisce l'indice
di bilanciamento proattivo/reattivo (PBI) della versione di ricerca.
L'ANT qui implementato usa 3 fattori (allerta/orienting/conflitto) ma
non è validato contro le norme originali di Fan et al. Lo Stop-Signal
stima lo SSRT con il metodo semplificato "della media" (RT medio go −
SSD medio), non con il metodo dell'integrazione usato in letteratura.
Questi esercizi sono pensati per **trattamento e monitoraggio
intra-soggetto nel tempo**, non per confronto normativo — a differenza
dei protocolli di NeuroScore, non hanno tabelle di riferimento.

## Difficoltà adattiva

Non ancora implementata automaticamente: i parametri (n-back, ISI,
frequenza target/no-go/stop/switch, SSD) si impostano manualmente in
setup. La soglia consigliata, se la tarate a mano seduta per seduta, è
salire di livello sopra l'85% di accuratezza e scendere sotto il 70%,
lasciando una zona neutra 70–85% — coerente sia con la letteratura sul
training n-back adattivo sia con la "Eighty Five Percent Rule" (Wilson
et al., 2019) sul tasso di errore ottimale per l'apprendimento.


## Pubblicazione su GitHub Pages (una volta sola)

1. Su github.com crea un nuovo repository, es. `traccian` (può essere pubblico
   o privato — pubblico è sufficiente e gratuito, il contenuto dei file non
   contiene dati di pazienti).
2. Carica in questo repository tutti i file di questa cartella:
   `index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`.
   (Su github.com: "Add file" → "Upload files", trascina i 5 file, "Commit changes".)
3. Vai su **Settings → Pages**. In "Source" seleziona il branch `main` e la
   cartella `/ (root)`, poi salva.
4. Dopo un minuto GitHub mostra l'indirizzo pubblico, del tipo:
   `https://<tuo-utente>.github.io/traccian/`

## Uso sul tablet

1. Apri quell'indirizzo dal browser del tablet (Safari su iPad, Chrome su Android).
2. Aggiungi alla schermata Home:
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
  preset_assegnato jsonb,             -- l'allenamento assegnato dall'operatore
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

-- Tabella sessioni: ogni riga appartiene a un operatore (le sue sessioni di
-- test personali, o quelle di un suo paziente) o a un paziente (le proprie).
create table sessioni (
  id text primary key,
  user_id uuid references auth.users,          -- storico, mantenuto per compatibilità
  operatore_id uuid references auth.users not null,
  paziente_id uuid references pazienti,         -- null se è una sessione dell'operatore stesso
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
```

Infine, in **Project Settings → API**, copia **Project URL** e la chiave
**anon public** (non la "service_role" — quella non va mai incollata
nell'app, serve solo al passo successivo, lato server).

### 3 — La funzione che crea gli account paziente

Creare un account non è un'operazione che il browser può fare da solo in
sicurezza: servirebbe la chiave "service_role", che non deve mai stare nel
codice pubblico. Per questo la creazione degli account paziente passa da una
piccola **Edge Function** — un frammento di codice che gira sui server di
Supabase, non nel browser di nessuno. Il file è già pronto in
`supabase/functions/create-patient/index.ts` dentro questo pacchetto.

1. Installa la [CLI di Supabase](https://supabase.com/docs/guides/cli) sul tuo
   computer (una volta sola): `npm install -g supabase`.
2. Nella cartella di questo progetto, collega il tuo progetto Supabase:
   ```
   supabase login
   supabase link --project-ref <il-tuo-project-ref>
   ```
   (il project-ref è nell'URL del progetto: `https://<project-ref>.supabase.co`)
3. Imposta il segreto (la service_role key resta sui server di Supabase,
   mai nel codice che pubblichi su GitHub):
   ```
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<la-tua-service-role-key>
   ```
   (la trovi in **Project Settings → API → service_role**)
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

1. Apri TracciaN, dal setup tocca **"Sincronizzazione cloud"**.
2. Incolla URL e chiave anon, "Salva configurazione".
3. **Come operatore**: scegli "Operatore", "Registrati" con un'email e una
   password (solo la prima volta). Sugli altri dispositivi fai "Accedi" con
   le stesse credenziali. Da "Gestisci pazienti" crei i profili paziente e
   assegni loro un allenamento.
4. **Come paziente**: scegli "Paziente", inserisci il codice di 8 caratteri
   ricevuto dall'operatore. Non serve altro — l'app mostra direttamente
   l'allenamento assegnato.

Ogni sessione salvata si sincronizza automaticamente in background; se il
dispositivo è offline resta salvata in locale e si sincronizza al primo
accesso a Internet. Un operatore vede sempre lo storico proprio e di tutti i
suoi pazienti insieme; un paziente vede solo il proprio.

La chiave "anon" incollata nell'app è pensata per essere pubblica — la
protezione reale sono le policy SQL sopra più il login di ciascuno. Non
condividere mai la chiave "service_role": quella resta solo nel segreto
della Edge Function, non è mai incollata nell'app.



Per applicare modifiche future, basta sostituire `index.html` (e gli altri
file se cambiati) nello stesso repository — GitHub Pages si aggiorna da solo
in circa un minuto. Lo storico salvato sul tablet non viene toccato.
