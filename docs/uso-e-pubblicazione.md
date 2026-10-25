# Pubblicazione, uso sul dispositivo, dati e privacy

_Come mettere online l'app, usarla sul tablet e dove stanno i dati. Spostato da `README.md` (passo 7) senza modifiche al testo; indice generale nel [README](../README.md)._

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

**Adattabilità mobile — stato dell'audit.** Corretto un problema
sistemico: la riga generica usata per quasi ogni elenco dell'app
(programma paziente, home del paziente remoto, storico sessioni,
suggerimenti da screening) non andava mai a capo — un'etichetta lunga
(es. "Scenari ecologici (pianificazione/multitasking)") insieme al
pulsante accanto rischiava di spingerlo fuori dallo schermo su un
telefono stretto, invece di andare a capo in modo leggibile. Corretto
alla radice (`.histrow`), quindi il beneficio si applica automaticamente
ovunque quella riga è usata, non schermata per schermata.

Punto aperto, non ancora deciso: gli elementi di Cancellazione
(neglect) sono dimensionati al 9% della larghezza della tavola (fino a
64px) — con tavole dense (fino a 85 elementi, ai livelli più alti) su
uno schermo stretto il singolo elemento può scendere sotto i 44px
generalmente consigliati come bersaglio tattile minimo. Non l'ho
corretto unilateralmente perché la dimensione degli elementi è anche un
parametro di difficoltà dell'esercizio (elementi più piccoli e più
ravvicinati aumentano il carico di ricerca visiva) — cambiarla tocca il
compito stesso, non solo la resa a schermo, quindi la lascio a una
decisione esplicita piuttosto che una correzione silenziosa.

1. Apri quell'indirizzo dal browser (Safari/Chrome su tablet o smartphone,
   qualunque browser su PC — l'interfaccia si adatta alla larghezza dello
   schermo).
2. Su tablet/smartphone, aggiungi alla schermata Home:
   - **iPad/Safari**: icona di condivisione → "Aggiungi a Home".
   - **Android/Chrome**: menu ⋮ → "Aggiungi a schermata Home" / "Installa app".
3. Da quel momento l'icona TracciaN si apre come un'app a schermo intero,
   senza barra del browser, e funziona anche offline (il service worker
   mette in cache i file dopo il primo caricamento).

**Navigazione e refresh.** Il tasto/gesto "indietro" del dispositivo
scorre la history interna dell'app (schermata precedente), non esce dal
sito — se lo si preme fino a superare la prima schermata aperta, compare
una richiesta di conferma prima di lasciare davvero TracciaN, invece di
uscire senza preavviso. Un refresh vero (F5, o pull-to-refresh) riporta
alla stessa schermata quando è ricostruibile da soli identificativi
salvati (programma paziente, storico, elenco pazienti...); le schermate
che dipendono da uno stato di sessione in corso (una prova/tavola
attiva, uno screening a metà, un codice appena generato) non sono
ricostruibili per natura e riportano l'operatore/paziente al punto
sicuro più vicino (Setup per l'operatore, home per il paziente).

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

## Copia di sicurezza dei dati locali (JSON)

Nello **Storico sessioni** (solo per l'operatore) ci sono due pulsanti accanto a «Esporta CSV»:

- **Salva copia dei dati (JSON)** scarica `traccian_copia_AAAA-MM-GG.json` con i profili paziente locali, le sedute, i preset di allenamento e l'avanzamento dello screening.
- **Ripristina da copia…** legge un file salvato così. Prima mostra cosa contiene e chiede: *Aggiungi* (scrive solo ciò che manca, non tocca niente di esistente) oppure *Sostituisci* (cancella i dati locali attuali e mette quelli della copia). Se la memoria si riempie a metà, i dati di prima restano com'erano.

Cosa **non** entra nella copia: l'indirizzo e la chiave del cloud (non devono girare in un file), i dati che stanno solo sul cloud, le impostazioni di altre app.

Il file contiene dati dei pazienti **in chiaro**: va conservato come una cartella clinica (non per email, non su servizi non protetti). Con il piano gratuito di Supabase non ci sono backup automatici: la copia JSON (con il CSV settimanale) è l'unica protezione contro la perdita dei dati. Codice: `js/services/backup.js`; prove: `tests/backup.test.js`.
