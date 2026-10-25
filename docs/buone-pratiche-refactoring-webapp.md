# Buone pratiche per rifattorizzare una web app (caso TracciaN)

Documento vivo. Registra cosa facciamo, perché, cosa è andato storto e la regola che ne ricaviamo, per riusarla su altre app (NeuroScore, PdMgenerator, borgo-planner...).
Ultimo aggiornamento: 2026-10-25 (passi 5a–8).

## 1. Punto di partenza
- App in un solo `index.html` (~750 KB, ~11.000 righe, ~360 funzioni): CSS, logica, 14 esercizi, UI e cloud insieme.
- Suite di test (21 file) che **estrae il codice vero da `index.html`** a ogni esecuzione e si ferma con errore esplicito se non trova più un blocco.
- Vincoli: nessun build tool pesante, moduli ES nativi, GitHub Pages, uso offline su tablet (PWA), parametri clinici intoccabili.

## 2. Metodo di lavoro (regole che funzionano)
1. **Un file `CLAUDE.md` nel progetto**: contesto, regole, piano a passi con caselle da spuntare e sezione "Stato attuale". Si legge a inizio sessione e si aggiorna a fine passo.
2. **Prima la baseline, poi le modifiche.** Lancia la suite, salva l'output, a ogni passo confrontalo con la baseline.
3. **Un passo = un commit leggibile**, app funzionante e test verdi alla fine. I passi grossi si spezzano (3a, 3b, 5a...) e ogni pezzo ha il suo commit.
4. **Spostare, non riscrivere.** Il codice si estrae con uno **script** che cerca i blocchi per testo esatto e si ferma se non li trova, mai ricopiandolo a mano.
5. **Provare che lo spostamento è fedele.** Ogni riga del modulo (tolto `export`) deve esistere nell'originale (`git show HEAD:index.html`): l'unico residuo ammesso sono le differenze dichiarate.
6. **Dichiarare ogni differenza** nell'intestazione del modulo e nel commit (es. `buildANT(cfg)`, `genTapatTrial(cfg, session)`, `recToRow(rec, cloudUser, patientProfile)`).
7. **Mai cambiare parametri clinici** (tabelle di livello, soglie, tempi, formule RCI/SSRT) durante un refactor.
8. **Service worker: alza `CACHE` e aggiungi ogni nuovo file alla precache.**
9. **Un test che fallisce va confrontato con il codice precedente.** Se fallisce uguale anche prima, è un limite dell'ambiente e si annota.
10. **Spiegare in italiano, in modo semplice, breve e in passi ordinati.**
11. **Prima di lavorare, verificare lo stato reale del repository**, non fidarsi dei documenti.
12. **Provare che i test vedono davvero il modulo**: cambia un valore nel modulo, verifica che almeno un test fallisca, poi ripristina (su un file non tracciato `git checkout` non basta: fai una copia prima).
13. **Spostare prima ciò che dipende solo dai parametri.** Chi legge `cfg`/`session`/`sb` globali li riceve come parametri; in `index.html` resta un wrapper da una riga (`function X(){ return XOf(cfg, session); }`) così i chiamanti non cambiano.
14. **Semplificare ≠ spostare.** Eliminare una duplicazione si fa in un commit a parte, con una **prova di equivalenza** e test dedicati.
15. **Dopo ogni modifica a `index.html`, caricare la pagina in un browser vero.** I test unitari non vedono gli errori di ambito.
16. **Il codice morto si toglie, dopo averlo provato**: un nome con un solo riferimento nel file e nessuno nei test.
17. **Dopo ogni taglio cercare le istruzioni sciolte** lasciate in `index.html` (assegnazioni che puntavano al blocco spostato, per es. alias di tabelle): vanno portate nel modulo.
18. **Script di spostamento: controllare i bordi.** Commenti contigui, funzioni su una riga e `const` seguite da altre dichiarazioni sono i punti dove lo script sbaglia; verificare con la fedeltà riga per riga e con il caricamento del modulo.

## 3. Registro dei passi

### Passo 1: baseline (2026-10-04)
- Suite logica: 21 file, **7.801 controlli, 0 falliti**.

### Passo 2: CSS in `css/app.css` (2026-10-04, pubblicato 2026-10-07)
- `css/app.css` identico all'originale; `sw.js` v5.

### Correzione di sicurezza (2026-10-24, `sw.js` v6)
- `checkRole`: un account senza riga né in `pazienti` né in `operatori` ora è bloccato. Test `role-check` (9 controlli).
- Edge function `create-patient` (solo operatori attivi), `delete-account`, `create-operator` deployata. Signup libero chiuso.

### Passo 3a: prima logica pura in `js/core/` (rifatto 2026-10-24, v7)
- Il repo era fermo al passo 2: rifatto sullo zip reale. `keylayout`, `stats`, `records`, `rci`; script principale `<script type="module">`; avviso se aperto da `file://`.

### Passo 3b: tabelle, titolazione, punteggi, screening (v8–v11)
- `levels.js` (v8), `titration.js` (v9), `scores.js` (v10), `pools.js` + `screening.js` (v11). Suite sempre identica alla baseline. `index.html`: 10.957 → 10.171 righe.
- Lezione sul peso: la logica pura era una parte piccola. Il grosso (≈ 80%) sono schermate e flusso, più 150 KB di commenti.

### Passi 3c e 3d (v12–v13)
- **`bands.js`** (v12): fasce strutturali; ISI di Simon = tabella ANT; sonde non verbali derivate dalle verbali (equivalenza provata con istantanee).
- **`adapt.js`** (v13, `24a707a`): la regola di titolazione era scritta 5 volte; ora una. 15 test; la mutazione della soglia fa fallire 2 test.

### Passo 4a: salvataggio locale (v14, `e43b228`)
- `js/services/local-store.js`: schema "leggi, modifica, riscrivi" copiato ~15 volte; 34 punti sostituiti. Chiavi e formato invariati. Tolte `localPatientDropdown` e `describeTargetSeq` (mai chiamate).

### Passo 4b: query Supabase (v15, `fb9da63`)
- `js/services/cloud.js`: ogni funzione riceve `sb` e gli id; in `index.html` restano controlli, cache ed errori. Test con client finto (18 controlli). Da verificare a mano con login reale.

### Passo 5a: N-back (v16, `214846a`)
- `js/exercises/nback.js` (generatore) e materiale misto in `pools.js`. 15 test diretti. Nota: a n=1 il tetto alla lunghezza delle serie abbassa la frequenza bersaglio (comportamento già presente, il test usa il livello 5).

### Passo 5b: Go/No-Go, TAPAT, Doppio compito, Running Span (v17, `719619c`)
- Quattro moduli in `js/exercises/`; test adattati ai moduli veri (`runningspan`, `tapat-titration`, `gonogo-dual`).
- Bug preso solo dal browser: `RUNNINGSPAN_ADAPT_BLOCK` non importato faceva lanciare la schermata di setup → `import-clash` ora controlla anche i nomi esportati usati ma non importati.

### Passo 5c: sequenze chiuse e regole (v18, `e09223a`)
- `rules.js` (tabelle e regole condivise) + `sequenza`, `stopsignal`, `ant`, `switching`, `simon`, `mantenimento`, `categorizzazione`. `index.html` 9.828 → 8.987 righe.
- Verifica: fedeltà riga per riga (restano solo le firme con `cfg`/`session`), pagina senza errori, 10 esercizi e2e conclusi, 7.902 test verdi.
- Un'istruzione sciolta (`SWITCH_RULESETS.lettereVoce = ...`) era rimasta in `index.html` dopo il taglio della `const`: portata in `rules.js`.
- Mancano test diretti per sequenza, ANT, mantenimento (solo e2e).

### Passo 5d: tavole Neglect (v19, `4879203`)
- `js/exercises/neglect.js`: costruzione delle tavole (classico, intruso, regola), regola composta, sotto-livello, suggerimento bottom-up. `INTRUSO_POOL` (mai usata) non portata; `shuffleArr` vive nel modulo. `index.html` 8.987 → 8.687 righe.
- Prima non c'erano test diretti sulle tavole: 313 controlli nuovi (proprietà che devono valere sempre: bersagli = 25%, lato secondo il gradiente, un solo intruso, bersaglio = regola). La mutazione del 25% fa fallire 40 test.
- L'harness e2e copriva solo il Classico: aggiunte le modalità intruso, regola, progressiva. In «regola» il tocco non segna nulla, quindi l'harness doveva premere «Fatto» da solo (limite del test, non dell'app).

### Passo 5e: valutazione delle prove (v20, `52d4352`)
- `js/exercises/resolve.js`: `resolveSignal/Choice/Categorization/DualTask`, `pushAdaptOutcome`, `maybeAdapt`, `maybeAdaptDualChannel`. Con le funzioni a un solo chiamante non serve nemmeno il wrapper.
- Era il cuore del punteggio e **non aveva alcun test diretto**: 76 controlli nuovi (hit/miss/FA/CR, staircase SSD con limiti, discriminazione a due scelte, nogo, canali del doppio compito, blocco di 8 con soglie, fascia strutturale). Mutazione dello staircase e degli hit: 3 test falliscono.
- Lezione: un primo test sbagliato (livello 5 che «non scende») era in realtà il limite inferiore della fascia Go/No-Go 5-7: il test va scritto sul comportamento voluto, non su quello supposto.

### Passo 5f: Scenari ecologici (v21, `8e87b6a`)
- `js/exercises/goaltask.js`: motore, 11 scenari e livelli 1-5, spostati interi (417 righe, **0 righe diverse**). Il motore lavora solo sullo `state` ricevuto: nessun wrapper. `index.html` 8.508 → 8.092.
- 225 test nuovi (regole e violazioni, finestre orarie, luoghi, informazione, mutua esclusione, memoria prospettica, distrattore, punteggio, coerenza di tutti gli scenari ai 5 livelli). Mutazione del fattore budget e della finestra: 2 test falliscono.
- Un test statistico dello Stop-Signal è fallito per caso (tolleranza 0,03 con 2000 prove = ~3 deviazioni standard): era instabile già prima (≈1 volta su 100). Misurata la distribuzione, tolleranza portata a 0,05 (anche Simon). Non è un parametro clinico.

### Passo 5g: Strategie di memoria (v22, `ee5a5f3`)
- `js/exercises/memoria.js`: brani PQRST, liste di chunking, percorsi dei loci e funzioni che normalizzano le forme parallele. L'unica dipendenza dall'app era `historyCache`: ora è il primo parametro, con una funzione da una riga in `index.html`. `index.html` 8.092 → 7.800.
- 145 test nuovi; i controlli di coerenza dei dati (16 livelli, nessun elemento vuoto o ripetuto) proteggono anche i contenuti futuri. Le 5 tecniche provate nel browser con uno script di smoke.

### Passo 5h: registro degli esercizi (v23, `25a2aff`)
- `js/exercises/registry.js`: `EXERCISES`, `EXERCISE_GROUPS`, etichette e `defaultCfg()` (la configurazione iniziale diventa una funzione che restituisce lo stesso oggetto). `index.html` 7.800 → 7.451.
- Tutti i test usavano **copie finte** di `EXERCISES`: ora 148 controlli sul registro vero (istruzioni senza `undefined`/`NaN` in 40 varianti, gruppi senza doppioni, coerenza con titolazione e screening, `defaultCfg` indipendente a ogni chiamata).
- Una mutazione «a vuoto» (il testo da cambiare non esisteva, quindi nulla era stato cambiato) ha dato falsa sicurezza: dopo ogni `sed` di mutazione controllare con `cmp` che il file sia davvero cambiato.

### Passo 5i: record della seduta (v24, `f943b94`)
- `js/exercises/record.js`: `buildSessionRecord(cfg, session, durationMs, ctx)` è il corpo che in `completeAndSaveInner` costruiva il record; con `scoreFromCounts` (d′), `computeFatigueNote`, `rtMeanOf`. Da `ctx` arrivano i dati dell'app (profilo, id attivi, data). Salvataggio, screening e navigazione restano in `index.html`. `index.html` 7.451 → 7.142.
- Era il cuore dei punteggi clinici e **non aveva alcun test**: 78 controlli (d′ con valori noti e simmetria, soglia dell'affaticamento a 0,15, SSRT, conflitto ANT/Simon/switching, asimmetria Neglect con segno, EZ-diffusion/LISAS, record per ogni famiglia). Tre mutazioni (SSRT, segno asimmetria, d′) fanno fallire 3, 1 e 2 test.
- Tecnica: si estrae il corpo che costruisce l'oggetto e si passa il contesto in un solo argomento, invece di tante variabili globali.

### Passo 5j: export CSV e report RCI (v25, `78ccdfd`)
- `js/exercises/export.js`: `buildCSV(items)` (testo) e `buildRCIReportHtml(...)`. Il download e `window.open` restano in `index.html`: si separa la parte che calcola da quella che tocca il browser.
- Il CSV è l'export settimanale dei dati clinici: 44 test (61 colonne, stesso numero di celle in ogni riga per ogni famiglia, record vecchi, note con virgole/a capo, escape HTML). Provato nel browser con sedute preparate: file, BOM per Excel, 61 colonne.

### Passo 5k: demo, preset, sequenza mista (v26)
- `demo.js` (parametri e feedback della prova dimostrativa), `presetCfgOf` in `registry.js`, `randomMistaTargetSeq` in `pools.js`. `index.html` 7.035 → 6.904 righe. Test nuovi: 63.
- Lezione: una mutazione può restare «viva» perché il test passa un valore già presente e non esercita mai il ripiego (`c.inputDevice||'touch'` con `inputDevice` già valorizzato). Per ogni `||` di default serve un test con il campo mancante.

### Passo 6 (versione leggera): `docs/livelli.md` generato
- Rodrigo ha scelto di NON mettere le tabelle in JSON: i commenti accanto ai numeri sono importanti e un JSON caricato a runtime è asincrono (rischio per l'uso offline). `tools/livelli-md.mjs` genera il documento leggibile dalle tabelle vere; il test confronta documento e codice e controlla alcune righe note in modo indipendente dal generatore. Mutazione su `CATEG_LURE` → il test fallisce.
- Lezione: quando una documentazione deriva dal codice, generarla e far fallire il test se diverge, invece di tenerla a mano.

### Passo 7: README → `docs/`
- Il README (2.171 righe) è un indice di 40 righe; 8 file in `docs/` con il testo originale, verificato riga per riga (nessuna riga persa). Test `docs-links`: ogni link relativo esiste e il README cita ogni pagina di `docs/`.
- I commenti del codice che dicono «vedi README» non sono stati toccati: il README ha un paragrafo che dice dove sono finite le sezioni citate.

### Passo 8: copia di sicurezza JSON (v27)
- `js/services/backup.js` (codice NUOVO): riceve lo storage (finto nei test). Salva pazienti locali, sedute, preset, screening; NON salva url/chiave cloud (nessuna chiave in un file che può girare). Ripristino `unisci` (non tocca l'esistente) o `sostituisci`; se la scrittura fallisce rimette lo stato di prima.
- Il file contiene dati dei pazienti in chiaro → avviso all'esportazione e nel documento.
- Lezioni: (1) nome del file con `todayStr()` avrebbe avuto «/» e «:» (invalido): provarlo nel browser ha senso anche per questo; (2) confrontare oggetti nei test con l'ordine delle chiavi normalizzato.

## 4. Incidenti e lezioni

| Cosa è successo | Lezione |
|---|---|
| Il collegamento del repository alla sessione è stato rifiutato | Collega l'account GitHub prima di iniziare |
| Il push era bloccato (403) con il repo non collegato | Senza push serve un'altra via di consegna (zip + upload manuale) |
| La patch `git am` era inutile: nessun clone locale | Chiedi **come** l'utente riceverà il lavoro prima di scegliere il formato |
| `css/app.css` assente nel primo controllo | Dopo ogni consegna manuale riscarica il repo e confronta con `cmp` |
| "L'e2e non gira nel cloud": il browser partiva con la sandbox | Prima di dichiarare un limite dell'ambiente, prova a rimuovere la causa (`TRACCIAN_NO_SANDBOX=1`) |
| Con i moduli ES la pagina non si apre più da `file://` | Annotarlo, mostrare un avviso, servire via http nei test |
| Aggiungere uno script ha spostato l'indice "secondo script" di `extract-source.js` | Scegliere lo script applicativo per lunghezza, non per posizione |
| `pkill -f` col testo del comando ha fermato la mia shell | Usare il PID |
| Il passo 3a risultava "fatto" nei documenti ma non nel repo | Confronta lo stato reale con i documenti |
| Account senza ruolo entrava come operatore; signup libero aperto | Controllare ogni accesso lato client **e** server (RLS + edge function) |
| Un test usava uno stub di `primaryAccuracyOf` diverso dalla funzione vera | Far importare ai test i moduli veri: gli stub nascondono differenze |
| Il repo GitHub è pubblico mentre si voleva privato | Verificare la visibilità a inizio lavoro e dirlo subito |
| Una regex automatica ha rovinato un test | Modifiche ai test a mano e piccole; dopo ogni taglio far caricare il modulo prima della suite |
| Due commenti identici: lo script ha tagliato il primo | Per testi ripetuti scegliere esplicitamente l'occorrenza e controllare |
| `listLocalPatients` del modulo oscurava la funzione omonima di `index.html` → ricorsione infinita, test verdi | I test unitari non vedono gli errori di ambito: caricare sempre la pagina. `import-clash.test.js` |
| Mutazione su file non tracciato non annullata da `git checkout` | Copia prima, o ripristina a mano e verifica |
| Nessun test nel browser per i profili in presenza | Serve login operatore: controllo manuale sul tablet |
| Un nome esportato usato in `index.html` ma non importato (`RUNNINGSPAN_ADAPT_BLOCK`) | `import-clash` controlla anche gli import mancanti |
| Lo script di spostamento ha portato con sé commenti vicini, ha ingoiato la dichiarazione seguente una `const` e ha sbagliato le funzioni su una riga | Controllare i bordi; fedeltà riga per riga e caricamento del modulo dopo ogni taglio |
| Istruzioni sciolte rimaste in `index.html` dopo lo spostamento di una `const` | Cercarle dopo ogni taglio e portarle nel modulo |
| Ho scritto attese a memoria (n_back, conflitto ANT, etichetta N-back) e 5 erano sbagliate | Prima di dare per rotto il codice, calcolare l'atteso a mano dai dati del test: i fallimenti erano nelle attese. Un'attesa che rivela un comportamento strano (n_back vuoto nei record vecchi) si documenta nel test, non si «corregge» durante un refactor |
| Mutazione di prova non applicata (pattern sbagliato) e suite «verde» |  Verificare con `cmp` che la mutazione abbia davvero modificato il file prima di fidarsi del risultato |
| Un test statistico falliva 1 volta su 100 | Con N prove la deviazione standard è √(p(1−p)/N): una tolleranza a ~3σ è instabile. Misurare la distribuzione e usare ≥5σ |
| I test usavano copie finte di EXERCISES | Spostare il dato vero in un modulo permette di testarlo davvero: prima dello spostamento nessun test lo guardava |
| L'e2e di Neglect «regola» non concludeva mai | In quella modalità il tocco non fa nulla: l'harness deve premere «Fatto». Prima di dare la colpa all'app, controllare se il test simula davvero l'uso |
| Un test «5/8 scende di livello» falliva al livello 5 | Le fasce strutturali impediscono di scendere sotto il pavimento della fascia: partire da un livello intermedio e testare a parte il pavimento |

## 5. Checklist per ogni passo di refactor
- [ ] Stato reale del repo verificato (clone/zip aggiornato) e visibilità controllata.
- [ ] Suite lanciata **prima**, esito salvato.
- [ ] Estrazione con script a testo esatto, mai a mano.
- [ ] Fedeltà verificata riga per riga; differenze dichiarate nel modulo e nel commit.
- [ ] Nessuna istruzione sciolta lasciata in `index.html`.
- [ ] Nessun nome importato ridichiarato / esportato non importato (`import-clash.test.js`).
- [ ] `sw.js`: `CACHE` alzata, nuovi file in precache.
- [ ] Test adattati agli import.
- [ ] Suite lanciata **dopo**; mutazione di prova su un valore del modulo (ripristino verificato).
- [ ] Pagina caricata in un browser vero (via http): nessun errore JS; e2e campione.
- [ ] Commit unico e leggibile; push; verifica del risultato.
- [ ] `CLAUDE.md` e questo documento aggiornati.
- [ ] Controllo manuale su tablet per ciò che l'e2e non copre.

## 6. Prossimi passi (dal piano)
5k. Le schermate (`ScreenSetup`, `ScreenPatientProgram`, `ScreenResults`, `ScreenHistory`, ...) in `js/ui/`, previa decisione di Rodrigo su come condividere lo stato (`cfg`, `session`, `view`). La logica pura è ormai quasi tutta nei moduli.
4c. Funzioni cloud ancora in `index.html` (login/logout, creazione account, salvataggi), da valutare.
6–8. Fatti (vedi sezione 3, passi 6, 7, 8). Resta solo l'eventuale spostamento delle schermate.

Quando un passo cambia ciò che sappiamo, questo documento va aggiornato nella stessa sessione.
