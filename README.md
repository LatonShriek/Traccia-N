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

## Sincronizzazione cloud (facoltativa) — Supabase

Senza fare nulla, l'app resta esattamente com'era: dati solo in locale su quel
tablet. Se vuoi che le sessioni siano visibili anche da un tuo secondo
dispositivo (es. tablet in studio + computer a casa), puoi collegare un
progetto Supabase gratuito — nessun altro operatore vi accede, solo tu con
la tua email/password.

### 1 — Crea il progetto

1. Vai su [supabase.com](https://supabase.com), crea un account e un nuovo
   progetto. Nella scelta della regione seleziona una regione **UE**
   (es. Frankfurt) — utile per il trattamento di dati sanitari.
2. Nel progetto, vai su **Authentication → Providers** e verifica che
   "Email" sia abilitato. In **Authentication → Settings** puoi disattivare
   "Confirm email" per semplicità (essendo un solo utente), oppure lasciarlo
   attivo e confermare via email al primo accesso.
3. Vai su **SQL Editor**, incolla ed esegui:

```sql
create table sessioni (
  id text primary key,
  user_id uuid references auth.users not null,
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
  inserted_at timestamptz default now()
);

alter table sessioni enable row level security;

create policy "solo i propri dati"
  on sessioni for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

   Questa policy fa sì che ogni account possa leggere e scrivere **solo le
   proprie righe** — anche se qualcuno ottenesse la chiave pubblica del
   progetto, non potrebbe leggere i tuoi dati senza le tue credenziali di
   accesso.

   Se avevi già creato la tabella in una versione precedente di TracciaN
   (solo N-back e Sequenza bersaglio), aggiungi le colonne mancanti invece
   di ricreare la tabella:

   ```sql
   alter table sessioni add column if not exists family text;
   alter table sessioni add column if not exists counts_aud jsonb;
   alter table sessioni add column if not exists metrics_aud jsonb;
   alter table sessioni add column if not exists choice jsonb;
   alter table sessioni add column if not exists ssrt numeric;
   alter table sessioni add column if not exists mean_ssd numeric;
   ```

4. Vai su **Project Settings → API**: copia **Project URL** e la chiave
   **anon public** (non la chiave "service_role", quella non va mai usata
   nell'app).

### 2 — Collega l'app

1. Apri TracciaN sul tablet, dal setup tocca **"Sincronizzazione cloud"**.
2. Incolla URL e chiave anon, "Salva configurazione".
3. "Registrati" con un'email e una password (solo la prima volta, su un
   dispositivo). Sugli altri dispositivi fai "Accedi" con le stesse credenziali.

Da quel momento ogni sessione salvata si sincronizza automaticamente in
background; lo storico unisce le sessioni locali e quelle cloud. Se il
tablet è offline, la sessione resta comunque salvata in locale e si
sincronizzerà al primo accesso a Internet con quell'app aperta.

La chiave "anon" incollata nell'app è pensata per essere pubblica — è così
che funziona Supabase — la protezione reale è la policy SQL sopra più il
login. Non condividere invece mai la chiave "service_role".



Per applicare modifiche future, basta sostituire `index.html` (e gli altri
file se cambiati) nello stesso repository — GitHub Pages si aggiorna da solo
in circa un minuto. Lo storico salvato sul tablet non viene toccato.
