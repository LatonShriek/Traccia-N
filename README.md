# TracciaN — batteria di attenzione e controllo esecutivo per tablet

Applicazione web standalone per la somministrazione di una batteria di 14
esercizi di attenzione, memoria di lavoro, controllo esecutivo e memoria
strategica: N-back, Sequenza bersaglio, Mantenimento (tipo Sternberg),
Go/No-Go, Stop-Signal, Attenzione (tipo ANT), TAPAT, Simon, Task-
switching, Categorizzazione condizionale, Doppio compito, Cancellazione
(neglect), Scenari ecologici (pianificazione/multitasking) e Strategie di
memoria (PQRST/chunking multi-metodo/metodo dei loci/errorless
learning/vanishing cues). Raccolta risposte touch o manuale, punteggio
automatico, istruzioni leggibili e ascoltabili prima di ogni esercizio,
storico sessioni sincronizzabile, ed è utilizzabile da più operatori
insieme e da pazienti in autonomia da propri dispositivi.

**Nessun server obbligatorio, nessun account richiesto per l'uso base.**
I dati restano salvati in locale nel browser del dispositivo
(`localStorage`); la sincronizzazione cloud (Supabase) — che abilita
multi-operatore e accesso paziente — è opzionale.

## Come è fatto il progetto

- `index.html` — l'app (schermate e flusso della seduta). `css/app.css` — stile.
- `js/core/` — logica pura: tabelle dei livelli, titolazione, screening, punteggi, statistiche.
- `js/exercises/` — un modulo per esercizio (generatori di prove, valutazione, punteggi, export).
- `js/services/` — salvataggio locale (`localStorage`) e query Supabase.
- `sw.js`, `manifest.json` — funzionamento offline e installazione sul tablet.
- `tests/` — prove automatiche (`node tests/run-all.js`); vedi [test-e-demo](docs/test-e-demo.md) e `tests/README.md`.

## Documentazione

| Argomento | File |
|---|---|
| Framework teorico della batteria | [docs/teoria.md](docs/teoria.md) |
| Difficoltà adattiva (livelli, regole per esercizio) | [docs/difficolta-adattiva.md](docs/difficolta-adattiva.md) |
| Tabelle dei livelli 1–10 (generata dal codice) | [docs/livelli.md](docs/livelli.md) |
| Titolazione e screening: come funzionano e perché | [docs/titolazione-e-screening.md](docs/titolazione-e-screening.md) |
| Simon, Categorizzazione, Scenari ecologici, Strategie di memoria | [docs/esercizi.md](docs/esercizi.md) |
| Batteria di screening iniziale e controllo motorio di base | [docs/screening-e-controllo-motorio.md](docs/screening-e-controllo-motorio.md) |
| Test di regressione e prova dimostrativa | [docs/test-e-demo.md](docs/test-e-demo.md) |
| Pubblicazione su GitHub Pages, uso sul dispositivo, dati e privacy | [docs/uso-e-pubblicazione.md](docs/uso-e-pubblicazione.md) |
| Sincronizzazione cloud e account (Supabase), eliminazione account, `create-operator` | [docs/cloud-supabase.md](docs/cloud-supabase.md) |
| Gestione pazienti: programma, accesso, obiettivi, limiti, RCI, archiviazione | [docs/gestione-pazienti.md](docs/gestione-pazienti.md) |
| Buone pratiche di refactoring della web app | [docs/buone-pratiche-refactoring-webapp.md](docs/buone-pratiche-refactoring-webapp.md) |

I commenti nel codice che dicono «vedi README» si riferiscono a queste pagine: «Sincronizzazione cloud», «Gestione operatori» e le migrazioni SQL sono in `docs/cloud-supabase.md`; «Framework teorico» in `docs/teoria.md`; «Vincolo di fascia strutturale» in `docs/difficolta-adattiva.md`.

I parametri clinici (tabelle dei livelli, soglie, formule RCI/SSRT) non si cambiano senza richiesta esplicita.
