# Carico di ogni livello e ipotesi di taratura della scala (BOZZA)

_15 nov 2026. **Ipotesi di lavoro, non validate**: servono dati reali (anche pochi, anche dei colleghi) per confermarle. I numeri sono quelli che stanno oggi nelle tabelle del codice._

## Perché

Le scale 1-10 dei vari esercizi non sono equiparate e non sappiamo se gli estremi sono ben posti: livelli che un adulto sano supera senza accorgersene e livelli difficili anche per lui. Un'**indice di carico** per livello, calcolato dai parametri veri, permette di vedere subito i salti troppo grandi, i tratti piatti e dove sta l'estremo.

Ancore proposte per ogni esercizio:
- **Livello 1**: superabile da quasi chiunque, anche con deficit moderato.
- **Livello 10**: impegnativo anche per un adulto sano; non deve richiedere prestazioni al limite fisico (tempo per oggetto sotto la soglia di discriminazione).
- **Passi**: carico che cresce di una quota simile a ogni livello (circa 15-30% fra livelli vicini), senza tratti piatti né salti.

## Intruso percettivo (TARATO il 15 nov 2026)

Carico = simboli da esaminare al secondo (oggetti × simboli per oggetto ÷ tempo per schermata). Prima della taratura i livelli 1-10 erano equidistanti sui 32 del generatore (1, 4, 8, 11, 15, 18, 22, 25, 29, 32) con tempi da 40 a 22 s: il carico cresceva di 9 volte, a scatti (+75% fra 3 e 4, +55% fra 6 e 7) e il 10 chiedeva 3,55 simboli/s (0,85 s per oggetto di 3 simboli). Su indicazione di Rodrigo il 10 è stato portato a ≈2,5 simboli/s e gli altri livelli ridistribuiti con crescita regolare (≈ +23% per livello) cercando, con una piccola ottimizzazione, la combinazione livello del generatore + tempo che segue meglio la curva.

| Livello | Gen. | Oggetti (medio) | Simboli per oggetto | Tempo schermata (s) | Simboli/s |
|---|---|---|---|---|---|
| 1 | 1 | 15,9 | 1 | 42 | 0,38 |
| 2 | 3 | 19,4 | 1 | 40 | 0,47 |
| 3 | 4 | 20,6 | 1 | 36 | 0,58 |
| 4 | 8 | 24,6 | 1 | 36 | 0,69 |
| 5 | 9 | 17,6 | 2 | 36 | 0,97 |
| 6 | 11 | 19,3 | 2 | 36 | 1,08 |
| 7 | 15 | 23,0 | 2 | 34 | 1,35 |
| 8 | 20 | 26,5 | 2 | 32 | 1,66 |
| 9 | 21 | 22,8 | 3 | 32 | 2,12 |
| 10 | 22 | 23,5 | 3 | 28 | 2,50 |

Conseguenze da sapere:
- I livelli salvati nei pazienti **non cambiano numero ma cambiano significato**: un paziente al livello 6 prima era a un carico di 1,5 simboli/s, ora a 1,1. Le sedute già registrate restano confrontabili solo conoscendo la data della taratura.
- Il generatore al massimo originale (livello 32) e le 3 famiglie di simboli più esotiche (cirillico arcaico, sillabico aborigeno, ideogrammi cjk) non sono più raggiunti dalla scala 1-10.
- Il tempo per schermata sale rispetto a prima nei livelli alti (da 22 a 28 s al 10) e il tempo scaduto resta un errore.

## Running span

| Livello | n da tenere | Lunghezza serie | ISI (ms) |
|---|---|---|---|
| 1 | 2 | 3–4 | 1800 |
| 2 | 2 | 4–5 | 1800 |
| 3 | 3 | 4–6 | 1600 |
| 4 | 3 | 5–7 | 1500 |
| 5 | 3 | 6–9 | 1400 |
| 6 | 4 | 6–8 | 1400 |
| 7 | 4 | 7–10 | 1300 |
| 8 | 4 | 8–12 | 1200 |
| 9 | 4 | 9–13 | 1100 |
| 10 | 4 | 10–14 | 1000 |

Carico ≈ n da tenere × ritmo. **Ipotesi**: da 6 a 10 cambiano solo lunghezza e ritmo, il numero da tenere resta 4 (limite plausibile di capacità): se vuoi un salto netto in alto, il vero limite è qui il ritmo (1 s per elemento).

## PASAT

| Livello | ISI (ms) | Lag | Shift |
|---|---|---|---|
| 1 | 3600 | 1 | 1 |
| 2 | 3200 | 1 | 1 |
| 3 | 3000 | 1 | 1 |
| 4 | 2800 | 1 | 2 |
| 5 | 2600 | 1 | 2 |
| 6 | 2400 | 1 | 2 |
| 7 | 3200 | 2 | 1 |
| 8 | 2900 | 2 | 1 |
| 9 | 2600 | 2 | 2 |
| 10 | 2400 | 2 | 2 |

Il lag 2 (7-10) è un salto netto di carico e ricomincia da un ritmo più lento: la scala a «denti di sega» è voluta. **Ipotesi**: ritmo 2,4 s e lag 2 al 10 è già duro; il PASAT standard arriva a 1,2-2 s.

## Serie alternate (scala unica con la Categorizzazione, livelli 1-11)

ISI da 3500 a 2200 ms; la regola cambia per fascia (1-2, 3-4, 5-6, 7-10, 11 = 2-back). Qui il carico è soprattutto nella regola, non nel tempo.

## Inversione e riordino

| Livello | Lunghezze | Materiale | ms per carattere | Consegne possibili |
|---|---|---|---|---|
| 1 | 3 | parole | 1800 | inverti, ordina |
| 10 | 4–6 | numeri, alfanumerico, maiuscole | 650 | 15 regole, doppie 80% |

Carico = lunghezza × complessità della regola ÷ ms per carattere: il tempo di esposizione cala di 2,8 volte e le regole raddoppiano la difficoltà (consegna doppia).

## Griglie attentive

Il livello cambia la **categoria di simboli** (da forme geometriche a ge'ez) e la dimensione della griglia (5×7 → 6×9) e i tipi di regola. La difficoltà qui è soprattutto percettiva e di regola, non di tempo.

## Esercizi classici (tabelle già validate: non toccate)

N-back (n da 1 a 3 con distrattori), Go/No-Go (frequenza e numero di elementi no-go), Sequenza, Stop-signal, ANT, Simon, Doppio compito: l'ISI scende da 3000–4500 ms (livello 1) a 650–900 ms (livello 10), cioè circa **5 volte**, e cambiano numero di elementi/regole. Il rapporto 5× è più contenuto di quello dell'Intruso (9×).

## Come tarare con pochi dati

1. **Dati già disponibili**: le titolazioni adattive convergono a un livello per ogni paziente/seduta. La distribuzione dei livelli finali per esercizio (nel registro delle sedute, campi `finalLevel` e `finalLevelFine`) indica dove la scala è troppo facile (tutti al 10) o troppo difficile (tutti all'1).
2. **Pilota breve**: 10 persone sane, 10 minuti per esercizio, a un livello fisso del range medio: se la maggior parte passa il livello 7-8 con >85% senza sforzo, la scala è spostata in basso.
3. **Verifica per colleghi**: la stessa persona sui livelli 3, 6, 9 in una sola seduta: la curva accuratezza × livello deve scendere, non essere piatta.

## Che cosa serve da Rodrigo

- Confermare le ancore (livello 1 e 10).
- ~~Ridurre il livello 10 dell'Intruso~~ — fatto il 15 nov (vedi sopra).
- Procedere con la taratura degli altri esercizi dopo il pilota.
