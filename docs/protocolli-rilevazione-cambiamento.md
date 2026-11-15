# Protocolli integrati per rilevare cambiamenti reali (BOZZA)

_15 nov 2026. Proposta di disegno, non ancora implementata (salvo dove indicato). Principio: **titolazione e misura sono due cose diverse.** Quando l'allenamento si adatta, il punteggio di allenamento sale per costruzione e non dice se la persona è cambiata. La misura va fatta con prove a **livello fisso**, nello stesso modo, e confrontata con una linea di base, con controlli interni e con una regola decisa prima._

## 1. I quattro strati di misura (paradigmi accoppiati)

| Strato | Che cosa è | Che cosa dice se cambia |
|---|---|---|
| A. Sonda allenata | Stesso esercizio, **livello e forma fissi**, non adattivo | Effetto pratica + apprendimento specifico (atteso) |
| B. Sonda vicina | Stesso costrutto, **paradigma diverso e non allenato** (esempi da confermare con la tabella test → esercizio: Intruso ↔ cancellazione/ricerca classica; Inversione ↔ running span o n-back; Griglie ↔ categorizzazione condizionale) | Trasferimento vicino |
| C. Sonda su materiale nuovo | Stesso esercizio con **famiglie di simboli o regole mai usate in allenamento**, appaiate per difficoltà con il punteggio PdM | Quanto l'apprendimento è astratto e non legato agli stimoli |
| D. Velocità di apprendimento | Un esercizio nuovo (3 blocchi); si guarda la curva, non il livello | «Imparare a imparare» (preparazione all'apprendimento futuro) |
| E. Lontano / quotidiano | Questionario breve a un familiare ogni 4 settimane; un compito reale (lista della spesa, farmaci); promemoria del bot Telegram come compito di memoria prospettica | Rilevanza clinica |
| F. Controllo discriminante | Una prova che **non** dovrebbe cambiare (costrutto non allenato e non vicino) | Che il cambiamento non sia un effetto generico (motivazione, abitudine al tablet) |

## 2. Struttura temporale per ogni paziente (disegno a linee di base multiple, casualizzato)

1. **Linea di base**: almeno 3 misure per ogni sonda (meglio 5), distanziate di giorni diversi, con forme parallele ruotate. Servono per la soglia individuale (`js/core/nof1.js`: media, SD, soglia t·SD·√(1+1/n), IC 90%).
2. **Inizio sfalsato e casuale**: l'allenamento di ciascun esercizio parte in un momento diverso, estratto a caso. Gli esercizi non ancora allenati sono controlli per quelli già avviati e mostrano la loro tendenza «solo pratica/ripetizione». Almeno 3 esercizi con inizio sfalsato, più uno mai allenato.
3. **Allenamento**: adattivo (asse fine PdM, tempo separato), **non più di 3 sedute alla settimana**, sedute brevi; registrare la dose.
4. **Sonde** ogni 2 settimane, in ordine controbilanciato (stessa ora del giorno quando possibile).
5. **Follow-up** dopo 4-8 settimane senza allenamento (ritenzione) e con richiami programmati.

## 3. Regole decise prima (per non decidere a posteriori)

- **Esiti primari**: al massimo 3 per paziente (uno allenato, uno vicino, uno quotidiano); il resto è esplorativo.
- **Cambiamento affidabile** = oltre la soglia individuale della linea di base in almeno **2 sonde consecutive**.
- **Trasferimento** = cambiamento in una prova non allenata che coincide con l'inizio dell'allenamento di un'altra e supera la tendenza della sua stessa linea di base; **concorde in almeno 2 su k** misure vicine (per ridurre i falsi positivi da confronti multipli).
- **Non conta** come miglioramento: salita dell'esercizio adattivo; guadagni solo nell'allenato senza variazione nelle sonde su materiale nuovo.
- **Misura di velocità senza trabocchetti**: usare i tempi mediani e la variabilità intra-individuale; per la sintesi velocità/accuratezza `computeEZDiffusion` (velocità di accumulo) e `computeLISAS` sono già nel codice.

## 4. Analisi

- **Singolo paziente**: confronto con la soglia della linea di base; test di randomizzazione sulla posizione dell'inizio sfalsato (una volta casuale, è un test esatto); misura di sovrapposizione (Tau-U o simili).
- **Gruppo**: stessi dati poolati con un modello misto (intercetta e pendenza casuali per paziente, un fattore «fase»); inizio sfalsato = disegno «stepped-wedge» spontaneo.
- **Soglia individuale a 80%**: dalla curva accuratezza contro livello PdM si ricava una soglia (e una pendenza). È una misura continua, confrontabile con la regola del gruppo cartaceo.

## 5. Che cosa aggiungere a Traccia-N (in ordine di priorità)

1. **Modo «sonda»** (livello e forma fissi, non adattivo, etichetta nel record). È il pezzo che manca di più. _Non fatto._
2. **Calendario casualizzato** delle introduzioni (seme salvato per paziente, generatore dell'ordine sfalsato). _Non fatto._
3. **Insiemi esclusi** (famiglie e regole tenute fuori dall'allenamento) per le sonde su materiale nuovo, appaiati per difficoltà con il punteggio PdM. _Non fatto._
4. **Esercizio nuovo per la velocità di apprendimento** (3 blocchi, adattamento della curva). _Non fatto._
5. **Registro della dose e dei confondenti** (sedute/settimana, minuti, un tocco: sonno, umore, dolore, farmaci cambiati). Le variabili che cambiano lo stato del giorno vanno controllate. _Non fatto._
6. **Misure di processo**: per le Griglie un indice di sistematicità della ricerca, se registriamo posizione e ordine dei tocchi. _Da verificare cosa si salva già._
7. **Questionario breve** per il familiare ogni 4 settimane. _Non fatto._
8. **Riferimenti normativi** dai familiari o da volontari sani: serve per tarare i pesi di difficoltà PdM e la soglia di cambiamento.
9. **Già fatto**: livello fine, dispersione, credito di efficienza, motore ibrido (docs/titolazione-e-screening.md), nof1.js (non collegato all'interfaccia), forme parallele (`formaPerMisura`).

## 6. Limiti

- Con pochi pazienti i disegni a caso singolo hanno potenza limitata: servono almeno 3 replicazioni di effetto in momenti diversi.
- Le sonde ripetute producono a loro volta effetto pratica; per questo la linea di base e i controlli non allenati.
- Gli abbinamenti B (paradigmi vicini) sono ipotesi e vanno confermati con la tabella test → esercizio (`docs/tabella-test-esercizi.md`, ancora bozza).
