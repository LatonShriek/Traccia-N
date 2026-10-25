# Tabelle dei livelli (1–10)

File **generato**: non modificarlo a mano. Le tabelle vere stanno in `js/core/levels.js`;
per rigenerare questo file: `node tools/livelli-md.mjs`. Il test `livelli-doc` fallisce se i due non coincidono.
Valori clinici: non cambiarli senza richiesta esplicita.

## Tempi e ritmo (ms)

| Parametro | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| ISI sequenza | 4500 | 3900 | 3200 | 2700 | 2200 | 1900 | 1700 | 1500 | 1150 | 900 |
| ISI dualtask | 3000 | 2700 | 2400 | 2100 | 1800 | 1550 | 1300 | 1100 | 900 | 700 |
| ISI ant | 3200 | 2800 | 2400 | 2000 | 1600 | 1400 | 1200 | 1000 | 800 | 650 |
| ISI simon | 3200 | 2800 | 2400 | 2000 | 1600 | 1400 | 1200 | 1000 | 800 | 650 |
| ISI stopsignal | 3600 | 3200 | 2800 | 2400 | 2000 | 1700 | 1400 | 1150 | 950 | 750 |
| Switching: intervallo segnale→stimolo (CSI) | 900 | 750 | 600 | 480 | 380 | 300 | 230 | 170 | 120 | 80 |
| Categorizzazione: ISI | 2200 | 1300 | 2200 | 1300 | 2200 | 1300 | — | — | 2200 | 1300 |
| TAPAT tonico: intervallo min | 900 | 1400 | 2000 | 3000 | 4000 | 5000 | 6000 | 8000 | 10000 | 12000 |
| TAPAT tonico: intervallo max | 1800 | 2600 | 4000 | 6000 | 8000 | 9500 | 11000 | 13000 | 18000 | 25000 |

ISI più basso = più difficile. Simon usa la stessa tabella dell'ANT. Categorizzazione non ha ISI ai livelli 7–8 (banda lure).

## Frequenze

| Parametro | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Go/No-Go: frequenza no-go | 48% | 44% | 40% | 34% | 28% | 22% | 17% | 12% | 8% | 5% |
| Go/No-Go: elementi no-go attivi | 1 | 1 | 1 | 1 | 2 | 2 | 2 | 3 | 3 | 4 |
| Doppio compito: frequenza bersaglio per canale | 40% | 35% | 30% | 25% | 20% | 16% | 13% | 10% | 7% | 5% |
| Doppio compito: frequenza lure per canale | 0% | 5% | 10% | 15% | 19% | 23% | 27% | 31% | 35% | 40% |
| Switching: prevalenza della regola dominante | 50% | 56% | 62% | 68% | 74% | 80% | 85% | 90% | 94% | 97% |
| Categorizzazione: frequenza lure | — | — | — | — | — | — | 0% | 30% | — | — |

## N-back

| Parametro | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| n | 1 | 1 | 1 | 1 | 2 | 2 | 2 | 2 | 2 | 3 |
| Frequenza bersaglio | 38% | 30% | 24% | 18% | 34% | 28% | 22% | 16% | 12% | 20% |
| Frequenza lure | 0% | 8% | 15% | 22% | 0% | 10% | 18% | 25% | 32% | 20% |

Lo scarto dei lure è n−1 se n>1, altrimenti n+1.

## Struttura, lunghezze e limiti

| Parametro | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Categorizzazione: struttura (1–5) | 1 | 1 | 2 | 2 | 3 | 3 | 4 | 4 | 5 | 5 |
| Sequenza bersaglio: lunghezza | 2 | 2 | 3 | 3 | 3 | 3 | 4 | 4 | 5 | 5 |
| Cancellazione: elementi per tavola | 14 | 20 | 26 | 34 | 42 | 50 | 58 | 66 | 75 | 85 |
| Cancellazione: secondi per tavola (0 = nessun limite) | 0 | 0 | 110 | 90 | 70 | 55 | 42 | 32 | 24 | 18 |

Strutture della Categorizzazione: 1 = dimensione singola; 2 = doppia dimensione + no-go; 3 = regola disgiuntiva; 4 = 1-back sulla categoria; 5 = doppia dimensione su 4 risposte.

## Costanti

- Proroga per il secondo tocco nel Doppio compito: 500 ms.
