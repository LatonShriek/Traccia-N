# Sincronizzazione cloud e account (Supabase)

_Schema del database, funzioni, creazione ed eliminazione di account. Spostato da `README.md` (passo 7) senza modifiche al testo; indice generale nel [README](../README.md)._

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
  screening_risultati jsonb,          -- ultimo screening completo (tutti i domini) — vedi sopra
  livelli_esercizi jsonb,             -- vedi sopra
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
alter table pazienti add column if not exists screening_risultati jsonb; -- ultimo screening completo (tutti i domini, non solo quelli flaggati) — {ts, summary:[...]}, mostrato in "Gestisci programma"
alter table pazienti add column if not exists livelli_esercizi jsonb; -- {taskMode: configurazione+livello raggiunto in quell'esercizio}, aggiornato dopo ogni sessione — un paziente con più esercizi assegnati ritrova il proprio livello in ciascuno, non solo nell'ultimo usato (che resta in ultima_config)
alter table pazienti add column if not exists configurazioni_salvate jsonb; -- {taskMode: [{nome, cfg, savedAt}, ...]} — slot nominali salvati esplicitamente dall'operatore, distinti da livelli_esercizi (che si sovrascrive da solo ad ogni sessione)
alter table pazienti enable row level security;
drop policy if exists "operatore vede e gestisce i propri pazienti" on pazienti;
create policy "operatore vede e gestisce i propri pazienti" on pazienti for all
  using (auth.uid() = operatore_id) with check (auth.uid() = operatore_id);
-- Sola lettura per il super-operatore, su TUTTI i pazienti (non solo i
-- propri) — usata dalla vista "Gestione operatori" per mostrare quanti
-- pazienti ciascun collega gestisce. Additiva: le policy permissive si
-- sommano con OR, non sostituisce quella sopra (un operatore normale
-- continua a vedere/gestire solo i propri pazienti come prima).
drop policy if exists "il super-operatore legge tutti i pazienti (sola lettura)" on pazienti;
create policy "il super-operatore legge tutti i pazienti (sola lettura)" on pazienti for select
  using (is_super_operatore());

-- Registro azioni (audit log): traccia archiviazioni/riattivazioni/
-- eliminazioni di account — sopravvive anche dopo che l'account stesso
-- è sparito, per questo bersaglio_id e eseguita_da NON sono chiavi
-- esterne rigide (una vera foreign key verso auth.users si spezzerebbe,
-- o peggio trascinerebbe con sé la riga di log, nel momento stesso in
-- cui l'account viene eliminato — l'unico momento in cui il log serve
-- di più). Le etichette testuali sono la copia leggibile che resta
-- comprensibile anche quando l'id sopra non risolve più a nessuno.
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  ts timestamptz default now(),
  azione text not null,
  eseguita_da uuid,
  eseguita_da_etichetta text,
  bersaglio_tipo text,
  bersaglio_id uuid,
  bersaglio_etichetta text
);
alter table audit_log enable row level security;
drop policy if exists "solo il super-operatore legge il registro azioni" on audit_log;
create policy "solo il super-operatore legge il registro azioni" on audit_log for select
  using (is_super_operatore());
drop policy if exists "solo il super-operatore scrive nel registro azioni" on audit_log;
create policy "solo il super-operatore scrive nel registro azioni" on audit_log for insert
  with check (is_super_operatore());
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
  final_level text, -- livello raggiunto a fine sessione, per ogni esercizio (non solo N-back) — testo perché il Doppio compito lo scrive come "3/4" (due canali)
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
alter table sessioni add column if not exists final_level text;
alter table sessioni add column if not exists titration_mode text; -- 'manuale'|'livello'|'adattivo' al momento di QUESTA sessione — serve al controllo di comparabilità dell'RCI (vedi sezione RCI), senza questa colonna il controllo tratta il dato come "non verificabile" per i pazienti in cloud, non come "comparabile"
alter table sessioni add column if not exists target_rate numeric; -- frequenza bersaglio/no-go/trial-di-stop al momento di QUESTA sessione, stesso motivo della colonna sopra
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
  screening_risultati jsonb, -- ultimo screening completo (tutti i domini) — vedi sopra
  programma_assegnato jsonb, -- elenco di esercizi assegnati come scorciatoia di avvio rapido in presenza (non vincolante)
  attivo boolean default true, -- vedi sopra
  remote_paziente_id uuid references pazienti(id), -- vedi sopra
  creato_il timestamptz default now()
);
alter table pazienti_locali add column if not exists screening_flags jsonb;
alter table pazienti_locali add column if not exists programma_assegnato jsonb;
alter table pazienti_locali add column if not exists screening_risultati jsonb;
alter table pazienti_locali add column if not exists livelli_esercizi jsonb;
alter table pazienti_locali add column if not exists obiettivo jsonb; -- stessa struttura di pazienti.obiettivo (array di {tipo:'livello'|'tempo', ...}) — obiettivi per i pazienti seguiti solo in presenza, gestiti da "Gestisci programma" esattamente come per i remoti
alter table pazienti_locali add column if not exists attivo boolean default true; -- come pazienti.attivo — nasconde il profilo dalla lista principale, spostandolo in Archivio
alter table pazienti_locali add column if not exists remote_paziente_id uuid references pazienti(id); -- valorizzato da "Trasforma in account remoto": collega il profilo in presenza superato al nuovo account remoto
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
alter table sessioni_login add column if not exists iniziata_il timestamptz default now(); -- inizio di QUESTA sessione (si azzera a ogni nuovo claim, incluse le riprese silenziose) — serve a calcolare la durata, distinto da aggiornato_il che è il "battito" più recente
alter table sessioni_login add column if not exists user_type text; -- 'operatore' | 'paziente', valorizzato al claim — evita un join con pazienti/operatori solo per etichettare il pannello "chi è online"
alter table sessioni_login add column if not exists etichetta text; -- nickname leggibile (email operatore, codice_paziente) — stessa scelta già fatta per accessi.etichetta, per non mostrare credenziali nel pannello
alter table sessioni_login enable row level security;
drop policy if exists "solo il proprio gettone di sessione" on sessioni_login;
create policy "solo il proprio gettone di sessione" on sessioni_login for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "il super-operatore legge tutte le sessioni attive" on sessioni_login;
create policy "il super-operatore legge tutte le sessioni attive" on sessioni_login for select
  using (is_super_operatore());

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

-- Gestione operatori (archiviazione): nome leggibile al posto
-- dell'identificativo tecnico, e 'attivo' con lo stesso significato già
-- in uso per i pazienti (false = archiviato, login rifiutato). Il
-- super-operatore deve poter leggere/aggiornare la riga di CHIUNQUE, non
-- solo la propria — da qui le due policy aggiuntive sotto, in sostituzione
-- della singola policy "vede solo la propria riga" di prima.
alter table operatori add column if not exists nome text;
alter table operatori add column if not exists attivo boolean not null default true;

-- Funzione che verifica "l'utente corrente è super-operatore?" bypassando
-- RLS al suo interno (SECURITY DEFINER). Necessaria: una policy su
-- operatori che rilegge operatori in una sotto-query per controllare
-- o.super riattiva la RLS di operatori su quella stessa sotto-query, che
-- richiede di nuovo la stessa verifica — un ciclo che Postgres blocca con
-- "infinite recursion detected in policy" (visibile lato app come 500).
-- La funzione rompe il ciclo leggendo la tabella con i privilegi del suo
-- proprietario, non con quelli (filtrati da RLS) di chi chiama la policy.
create or replace function is_super_operatore()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select super from operatori where id = auth.uid()), false);
$$;

drop policy if exists "un operatore vede la propria riga; il super-operatore le vede tutte" on operatori;
create policy "un operatore vede la propria riga; il super-operatore le vede tutte" on operatori for select
  using (auth.uid() = id or is_super_operatore());
drop policy if exists "il super-operatore aggiorna nome/attivo di qualunque operatore" on operatori;
create policy "il super-operatore aggiorna nome/attivo di qualunque operatore" on operatori for update
  using (is_super_operatore()) with check (is_super_operatore());
drop policy if exists "un operatore crea la propria riga alla registrazione" on operatori;
create policy "un operatore crea la propria riga alla registrazione" on operatori for insert
  with check (auth.uid() = id);
-- Senza questa policy, la registrazione di un nuovo operatore (cloudSignUp)
-- crea comunque l'account di autenticazione ma non riesce a scrivere la
-- riga in 'operatori' — l'operatore resta "senza ruolo" (visibile con una
-- query diretta come account senza corrispondenza né in operatori né in
-- pazienti) finché qualcuno non gliela inserisce a mano.

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
  etichetta text,                -- nickname leggibile (per ora solo per i pazienti: codice_paziente), valorizzato quando disponibile — preferito a email_tentata nel registro, per non mostrare la credenziale del paziente
  ts timestamptz default now()
);
alter table accessi add column if not exists etichetta text;
alter table accessi enable row level security;
drop policy if exists "chiunque può registrare un evento di accesso" on accessi;
create policy "chiunque può registrare un evento di accesso" on accessi for insert
  with check (true);
drop policy if exists "solo il super-operatore legge il registro accessi" on accessi;
create policy "solo il super-operatore legge il registro accessi" on accessi for select
  using (is_super_operatore());
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

Il Registro accessi si apre su una schermata con due pulsanti, "Registro
operatori" e "Registro pazienti" — ciascuno con la propria tabella,
filtro e dettaglio sessione per sessione, non più tutto insieme sulla
stessa schermata. Il registro operatori include anche **"Gestione
operatori"**: archiviare un operatore blocca il suo accesso (login
rifiutato, anche da una scheda già aperta in precedenza) senza toccare
nulla di quello che ha già fatto — programmi assegnati e storico sessioni
dei suoi pazienti restano intatti, esattamente come l'archiviazione di un
paziente non cancella le sue sedute passate. Il campo "nome" è solo
un'etichetta leggibile al posto dell'identificativo tecnico, impostabile
da lì in qualunque momento; non richiede altro oltre alla migrazione SQL
sopra (colonne `nome`/`attivo` + le due policy aggiuntive).

**Registro accessi — una sola schermata, stato attuale e storico insieme.**
Una riga per persona (operatore o paziente): stato attuale (🟢 online da
X, o l'orario dell'ultima attività vista) e, nel dettaglio, lo storico
delle sessioni passate con durata. Due fonti diverse dietro le quinte,
unite qui: lo storico da `accessi` (sessioni chiuse da un logout
esplicito registrato, durata esatta) e lo stato live da `sessioni_login`
(battito ogni 25 secondi, comprese le riprese senza login esplicito —
credenziali salvate nel browser — che lo storico da solo non vede mai,
perché non generano un evento "login" in `accessi`). "Online" = battito
negli ultimi 90 secondi; oltre, la riga resta visibile come "visto
l'ultima volta" con orario, non sparisce — una scheda chiusa di scatto o
una rete caduta non avvisano l'app, quindi non c'è un vero evento di
disconnessione da registrare in quel caso, solo l'assenza di battiti
successivi. La schermata si auto-aggiorna ogni 20 secondi finché resta
aperta. Due menù a tendina (uno per gli operatori, uno per i pazienti)
permettono di saltare direttamente a una persona invece di scorrere
l'elenco intero — "Tutti" (il default) non filtra nulla.

Ogni riga espansa ha in fondo un pulsante "Elimina storico di questa
persona dal registro" — cancella dal registro tutte le righe di
login/logout/tentativi di quella persona (utile per account di prova),
senza toccare l'account stesso, che resta attivo o archiviato quel che
era. Azione non annullabile, richiede conferma.

Il registro mostra, per ciascun utente (operatore o paziente): numero di
login riusciti/falliti, tempo **medio** e tempo **totale** sull'app (somma
delle sessioni chiuse da un logout registrato — una sessione senza logout,
es. scheda chiusa senza uscire, non contribuisce a nessuno dei due:
entrambi sono quindi una stima per difetto, non un valore esatto), e
l'ultimo accesso. Per un paziente il cui login è **riuscito** almeno una
volta, l'etichetta mostrata è il suo **nickname** (`codice_paziente`, lo
stesso che l'operatore vede ovunque nell'app), non il codice di accesso
digitato — anche per i suoi eventuali tentativi falliti precedenti, dato
che sono raggruppati sotto lo stesso account. Un tentativo **mai
riuscito** (codice sbagliato, nessun account corrispondente) non ha
invece un nickname da mostrare: resta raggruppato sotto il testo digitato
stesso, l'unica informazione disponibile in quel caso. L'export CSV
riporta comunque entrambe le colonne separate (`nickname` e
`identificativo_digitato`), riga per riga.


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
Supabase ha rinominato queste chiavi nel 2026 (`SUPABASE_SECRET_KEYS` /
`SUPABASE_PUBLISHABLE_KEYS`, ora dizionari JSON con una voce `default`)
mantenendo per un periodo di transizione anche i nomi precedenti
(`SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY`, stringhe semplici) — la
funzione prova prima il formato nuovo e ripiega sul vecchio solo se il nuovo
non è disponibile, così funziona su entrambi senza bisogno di sapere quale
dei due il tuo progetto sta ancora usando.

Il file è incluso in questo pacchetto in
`supabase/functions/create-patient/index.ts`.

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

## Eliminazione definitiva di un account (pazienti e operatori)

Archiviare (già descritto sotto per i pazienti, e nella sezione
Sincronizzazione cloud per gli operatori) blocca l'accesso senza
toccare nulla dei dati — è la via normale per un paziente che ha
concluso il percorso, o un operatore che lascia la struttura.
**Eliminare** è diverso e irreversibile: cancella l'account vero e
proprio (login compreso), pensato per i profili di prova, non per un
percorso clinico concluso.

**Perché serve una funzione a parte, non un pulsante diretto.**
Eliminare un account richiede i privilegi di amministratore di Supabase
(la "service role key") — una chiave che non deve **mai** comparire nel
codice che gira nel browser: chiunque riuscisse a leggerla potrebbe
cancellare qualunque account di chiunque. Per questo l'eliminazione
passa da una **Edge Function** (`supabase/functions/delete-account`),
un piccolo programma che gira sui server di Supabase, dove quella
chiave resta al sicuro come variabile d'ambiente — il client le manda
solo "elimina questo account", mai la chiave stessa.

**Come funziona, in due fasi**: la funzione verifica prima CHI sta
chiamando (con il suo token normale, senza privilegi elevati — deve
essere un vero super-operatore) — solo dopo questa verifica usa i
privilegi di amministratore, e solo per l'unica operazione che li
richiede davvero. Gestisce sia pazienti sia operatori con la stessa
funzione (`accountType: 'paziente'|'operatore'`), non due separate — la
logica di verifica e di registrazione è identica, cambia solo quale
tabella controllare.

**Un operatore con pazienti ancora assegnati (o sedute proprie
registrate) non si può eliminare** — le tabelle `pazienti`/`sessioni`
referenziano `operatore_id` senza cascata (vedi lo schema più sopra),
quindi Postgres rifiuta l'eliminazione invece di trascinarsi dietro
dati clinici altrui. La funzione intercetta questo caso e restituisce
un messaggio comprensibile ("riassegna i pazienti prima di eliminarlo"),
non l'errore grezzo del database.

**Pubblicazione** — richiede la Supabase CLI:
```bash
supabase functions deploy delete-account --project-ref IL-TUO-PROJECT-REF
```
Il project-ref è visibile nell'URL del tuo progetto Supabase. In
alternativa, dalla dashboard Supabase → Edge Functions → Create
function → incolla il contenuto del file.

### Creazione operatori (`create-operator`)

Stesso motivo di `create-patient`: creare un account Supabase da codice
client-side richiederebbe la chiave segreta nel browser, oppure
`supabase.auth.signUp()` dal client — che però disconnetterebbe
l'operatore che sta creando l'account, sostituendo la sua sessione con
quella del nuovo utente. La funzione gira lato server, verifica che chi
chiama sia un super-operatore, crea l'account con una password
provvisoria generata al momento (mostrata una sola volta, da comunicare
fuori dall'app) e la riga in `operatori` nello stesso passaggio — non
resta mai un account "senza ruolo" come poteva succedere prima con la
registrazione diretta dall'app.

**Pubblicazione**:
```bash
supabase functions deploy create-operator --project-ref IL-TUO-PROJECT-REF
```



Ogni archiviazione, riattivazione ed eliminazione (di pazienti e
operatori) scrive una riga in `audit_log` — chi, quando, che azione, su
chi. Sopravvive anche dopo che l'account bersaglio è stato eliminato
(le colonne `eseguita_da`/`bersaglio_id` non sono chiavi esterne
rigide di proposito — altrimenti la riga di log sparirebbe insieme
all'account nel momento stesso in cui serve di più). La scrittura è
**best-effort**: se fallisce (es. la migrazione SQL della tabella non
è ancora stata eseguita), l'azione principale resta comunque valida —
solo senza traccia nel registro. Nessuna schermata dedicata per
consultarlo ancora — leggibile per ora solo dall'SQL Editor di
Supabase (`select * from audit_log order by ts desc`), riservato al
super-operatore dalla RLS.
