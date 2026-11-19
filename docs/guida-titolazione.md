# Guida alla titolazione: cosa abbiamo cambiato, perché, e a che punto siamo

_Pagina di consultazione unica (19 nov 2026). Riassume il senso di tutte le modifiche alla titolazione; i dettagli tecnici restano in [titolazione-e-screening.md](titolazione-e-screening.md), [difficolta-adattiva.md](difficolta-adattiva.md), [carichi-e-scala-livelli.md](carichi-e-scala-livelli.md). Stato di ogni voce: **attivo** (nel codice), **ipotesi** (attivo ma non validato su dati reali), **proposta** (deciso, NON ancora nel codice)._

## 1. La regola di base (attiva per tutti gli esercizi adattivi)

- Si valuta un **blocco** di prove (8 per i classici; 4–6 per gli esercizi nuovi, vedi §2). Sopra l'**85%** il livello sale, sotto il **70%** scende, in mezzo resta.
- L'85% viene dalla «Eighty Five Percent Rule» (Wilson et al., 2019, *Nature Communications*): per algoritmi di apprendimento a discesa del gradiente l'accuratezza di allenamento ottimale è circa 85%. È stata verificata su reti artificiali e dati animali; per i pazienti è un'**ipotesi di lavoro**. Il 70% (e quindi la fascia di non-cambiamento) è una nostra scelta: serve a non oscillare per caso (con 8 prove l'errore standard è circa 0,14).
- **Una fascia strutturale non si attraversa mai a metà seduta** (n dell'N-back, numero di no-go, struttura della Categorizzazione…): il paziente deve poterne leggere prima le istruzioni.

## 2. Tre famiglie di esercizi

**A. Classici, livello intero 1–10, tabelle validate** (N-back, Go/NoGo, Sequenza, Stop-Signal, ANT/Simon, Switch, Categorizzazione, Doppio compito, TAPAT, Cancellazione).
- Blocco da 8 prove, ±1 livello.
- Una risposta **corretta ma più lenta di 1,6 × la propria mediana** non conta come successo nel blocco (servono ≥4 tempi corretti prima che il filtro parta). Il 1,6 è una **nostra soglia pratica** (nessuna fonte): serve a non far salire chi risponde giusto ma con troppa fatica.
- Casi speciali: Stop-Signal ha lo staircase SSD (continuo) più l'ISI; Doppio compito ha un livello per canale; TAPAT un gradiente spaziale (±5, limiti 25–75); Cancellazione solo Classico.
- Memoria e Compito a obiettivi **non hanno titolazione**.

**B. Esercizi nuovi con «livello fine»** (Intruso percettivo, Griglie attentive, Inversione e riordino, Running span; solo in modalità adattiva). Dal 14–15 nov:
1. **Mezzi gradini**: il livello ha la virgola (6,5) e ogni blocco lo sposta di 0,5 (blocchi: Intruso 6 prove, Inversione 4, Griglie 4, Running span 4 cicli). Sono di fatto 19 gradini.
2. **Dispersione**: ogni prova pesca il proprio livello attorno a quello vero (per Intruso, Griglie e Inversione sulla scala 1–32 del generatore PdM: 50% uguale, 20% ±1, 5% ±2), così le transizioni (es. da 1 a 2 simboli) sono sfumate e non a scalino.
3. **Efficienza accuratezza × velocità** al posto del filtro sì/no 1,6× (Intruso, Griglie, Inversione): credito = punteggio (0–1) × fattore velocità; fattore 1 fino a 1,3 × la propria mediana, poi scende fino a 0 a 2,1 ×.
4. **Contenuto e tempo come due manopole** (Intruso, Inversione): il fattore tempo `timeF` varia 0,7–1,3 a passi di 0,1; dopo un blocco la regola sceglie quale manopola muovere (es. se i giusti sono molto più rapidi del tempo concesso, si stringe il tempo, altrimenti sale il contenuto; se si sbaglia per tempo scaduto, si allarga il tempo prima di scendere di livello). Griglie non ha un tempo concesso: ha solo i punti 1–3.
5. Intruso conserva la progressione di PdM (livelli del generatore 1, 4, 8, 11, 15, 18, 22, 25, 29, 32); il tempo per schermata è tarato sul carico (da 44 a 32 s; **ipotesi**).

**C. Ritmo imposto (PASAT, Serie)**: blocco da 8 prove, regola a parte (il ritmo si stringe dal livello 4, la regola 2-back dal 7). Non hanno mezzi gradini: cambiare passo a ogni prova disorienta.

## 3. Cosa NON è validato (ipotesi da guardare sui dati)

Distribuzione della dispersione (50/20/5), soglia del 50% di margine sul tempo, passo di 0,1 del tempo, regola delle «quasi giuste» per Inversione, tempi per carattere di Inversione, tempo per schermata di Intruso, quota di consegne multiple di Inversione, soglia 1,6 ×, fattori 1,3/2,1 del credito.

## 4. Proposte decise ma NON ancora nel codice

| Cosa | Decisione di Rodrigo (18–19 nov) | Stato |
|---|---|---|
| **Livelli intermedi per i classici** | andare avanti; tabelle esatte in [tabella-livelli-intermedi.md](tabella-livelli-intermedi.md): 19 livelli (Sequenza, Go/NoGo, Switch, Doppio compito, Stop-Signal, ANT/Simon), 17 (N-back), 15 (Categorizzazione); i livelli interi restano identici a oggi | **proposta** |
| Tolleranza 2,0 × (invece di 1,6 ×) ai mezzi livelli | proposta mia, da confermare | **proposta** |
| Tabella ISI per Go/NoGo e N-back (oggi non hanno leva di velocità) | da definire: i valori non esistono ancora | **proposta** |
| **Simboli più difficili** (PdM e Traccia-N) | rotazioni a passi di 45° (mai 30°), anche speculari; 180° solo per figure asimmetriche; l'ampliamento della famiglia segue le prime esposizioni e precede la consegna doppia; poi doppia con 4 orientamenti, doppia con 8, poi tripla; anche nei PowerPoint | **proposta** (resta da precisare che cosa siano «4» e «8 orientamenti») |
| **Sonda** (prova a difficoltà fissa) | livello personale congelato dopo la baseline (opzione B) più tre livelli attorno alla soglia con funzione psicometrica (opzione C); tasso di lapsus fissato in anticipo (2–5%) | **proposta** |
| Insiemi di stimoli esclusi | famiglie abbinate per difficoltà, assegnate a caso per paziente con seme salvato, bilanciate tra pazienti; riflessione basata su Barnett & Ceci 2002 e Gick & Holyoak 1983 (letti solo gli abstract), nessuna evidenza diretta in riabilitazione | **proposta** |
| Calendario casualizzato (linee di base multiple) | convenzione WWC: ≥3 dimostrazioni, ≥5 punti per fase; con 4 esercizi o più, il test di randomizzazione può raggiungere p ≈ 0,04 | **proposta** |
| Curva di apprendimento (velocità di apprendimento) | su compito a difficoltà fissa, non titolato | **proposta** |
| Misure di processo (sistematicità di ricerca) | le Griglie a tocco salvano oggi solo i conteggi: va aggiunto il salvataggio di ordine e coordinate dei tocchi | **proposta** |
| Altri esercizi (confronto di numerosità, SART, variabilità dei tempi, parole tachistoscopiche, denominazione rapida, recupero distanziato) | elencati in [protocolli-rilevazione-cambiamento.md](protocolli-rilevazione-cambiamento.md) | **proposta** |

## 5. Cose da non confondere

- Il filtro «1,6 ×» vale solo per i **classici**. Intruso, Griglie e Inversione usano il **credito di efficienza** (§2.B.3).
- Il livello 1–10 salvato resta intero (`adaptStartLevel`); il valore con la virgola è in `adaptFine` / `finalLevelFine`; il livello del generatore in `finalGen`, il fattore tempo in `adaptTimeF` / `finalTimeF`.
- Il confronto prima/dopo (indice di cambiamento affidabile, `rci.js`) con la titolazione adattiva è poco informativo sull'accuratezza, che per costruzione resta al 70–85%: servono prove a difficoltà fissa (sonde / misure di rivalutazione).

## 6. Dove sta nel codice

`js/core/adapt.js` (regola 85/70, 1,6 ×, credito, mezzi gradini) · `js/core/levels.js` (tabelle dei classici) · `js/core/bands.js` (fasce strutturali) · `js/core/titration.js` · `js/core/assi.js` (motore ibrido, tempo, dispersione sul generatore) · `js/core/rci.js`, `js/core/nof1.js` (cambiamento affidabile) · test: `tests/adapt.test.js`, `tests/assi.test.js`.
