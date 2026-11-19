# Livelli intermedi dei classici: tabelle

**Stato (19 nov 2026):** ATTIVI per Sequenza, Stop-Signal, ANT/Simon e Switch (19 livelli). PROPOSTA, non ancora nel codice, per Go/NoGo (16 livelli), N-back (17), Categorizzazione (15) e Doppio compito (19 per canale).

Regola: i livelli interi restano IDENTICI a oggi (i livelli già salvati non cambiano significato). Un livello x,5 porta i parametri continui a metà strada fra due livelli interi; Sequenza prende anche la lunghezza del livello successivo. Dove cambia una fascia strutturale (n dell N-back, numero di no-go del Go/NoGo, struttura di Categorizzazione) non si interpola tra una fascia e l altra. La decisione di salire o scendere di mezzo livello si prende sugli ultimi 2 blocchi (16 prove) se stanno allo stesso livello.

## Sequenza (19 livelli)
Mezzo livello = lunghezza del livello successivo, ISI a metà strada.

| Liv. | Lunghezza | ISI (ms) |
|---|---|---|
| 1 | 2 | 4500 |
| 1,5 | 2 | 4200 |
| 2 | 2 | 3900 |
| 2,5 | 3 | 3550 |
| 3 | 3 | 3200 |
| 3,5 | 3 | 2950 |
| 4 | 3 | 2700 |
| 4,5 | 3 | 2450 |
| 5 | 3 | 2200 |
| 5,5 | 3 | 2050 |
| 6 | 3 | 1900 |
| 6,5 | 4 | 1800 |
| 7 | 4 | 1700 |
| 7,5 | 4 | 1600 |
| 8 | 4 | 1500 |
| 8,5 | 5 | 1325 |
| 9 | 5 | 1150 |
| 9,5 | 5 | 1025 |
| 10 | 5 | 900 |

## Go/NoGo (16 livelli)
Mezzi livelli solo DENTRO una fascia (1-4, 5-7, 8-9, 10): il numero di no-go noti non cambia a metà seduta. Frequenza no-go a metà strada.

| Liv. | N. no-go | Freq. no-go |
|---|---|---|
| 1 | 1 | 0,48 |
| 1,5 | 1 | 0,460 |
| 2 | 1 | 0,44 |
| 2,5 | 1 | 0,420 |
| 3 | 1 | 0,40 |
| 3,5 | 1 | 0,370 |
| 4 | 1 | 0,34 |
| 5 | 2 | 0,28 |
| 5,5 | 2 | 0,250 |
| 6 | 2 | 0,22 |
| 6,5 | 2 | 0,195 |
| 7 | 2 | 0,17 |
| 8 | 3 | 0,12 |
| 8,5 | 3 | 0,100 |
| 9 | 3 | 0,08 |
| 10 | 4 | 0,05 |

## N-back (17 livelli)
Mezzi livelli solo DENTRO una banda di n (nessuno tra 4 e 5, né tra 9 e 10).

| Liv. | n | Freq. target | Lure |
|---|---|---|---|
| 1 | 1 | 0,38 | 0,00 |
| 1,5 | 1 | 0,34 | 0,04 |
| 2 | 1 | 0,30 | 0,08 |
| 2,5 | 1 | 0,27 | 0,11 |
| 3 | 1 | 0,24 | 0,15 |
| 3,5 | 1 | 0,21 | 0,18 |
| 4 | 1 | 0,18 | 0,22 |
| 5 | 2 | 0,34 | 0,00 |
| 5,5 | 2 | 0,31 | 0,05 |
| 6 | 2 | 0,28 | 0,10 |
| 6,5 | 2 | 0,25 | 0,14 |
| 7 | 2 | 0,22 | 0,18 |
| 7,5 | 2 | 0,19 | 0,21 |
| 8 | 2 | 0,16 | 0,25 |
| 8,5 | 2 | 0,14 | 0,29 |
| 9 | 2 | 0,12 | 0,32 |
| 10 | 3 | 0,20 | 0,20 |

## Switch (19 livelli)
Entrambi i parametri a metà strada.

| Liv. | Bilanciamento regola | CSI (ms) |
|---|---|---|
| 1 | 0,50 | 900 |
| 1,5 | 0,530 | 825 |
| 2 | 0,56 | 750 |
| 2,5 | 0,590 | 675 |
| 3 | 0,62 | 600 |
| 3,5 | 0,650 | 540 |
| 4 | 0,68 | 480 |
| 4,5 | 0,710 | 430 |
| 5 | 0,74 | 380 |
| 5,5 | 0,770 | 340 |
| 6 | 0,80 | 300 |
| 6,5 | 0,825 | 265 |
| 7 | 0,85 | 230 |
| 7,5 | 0,875 | 200 |
| 8 | 0,90 | 170 |
| 8,5 | 0,920 | 145 |
| 9 | 0,94 | 120 |
| 9,5 | 0,955 | 100 |
| 10 | 0,97 | 80 |

## Doppio compito (19 livelli per canale)
Tre parametri a metà strada; i due canali restano indipendenti.

| Liv. | Freq. target | Lure | ISI (ms) |
|---|---|---|---|
| 1 | 0,40 | 0,00 | 3000 |
| 1,5 | 0,375 | 0,025 | 2850 |
| 2 | 0,35 | 0,05 | 2700 |
| 2,5 | 0,325 | 0,075 | 2550 |
| 3 | 0,30 | 0,10 | 2400 |
| 3,5 | 0,275 | 0,125 | 2250 |
| 4 | 0,25 | 0,15 | 2100 |
| 4,5 | 0,225 | 0,170 | 1950 |
| 5 | 0,20 | 0,19 | 1800 |
| 5,5 | 0,180 | 0,210 | 1675 |
| 6 | 0,16 | 0,23 | 1550 |
| 6,5 | 0,145 | 0,250 | 1425 |
| 7 | 0,13 | 0,27 | 1300 |
| 7,5 | 0,115 | 0,290 | 1200 |
| 8 | 0,10 | 0,31 | 1100 |
| 8,5 | 0,085 | 0,330 | 1000 |
| 9 | 0,07 | 0,35 | 900 |
| 9,5 | 0,060 | 0,375 | 800 |
| 10 | 0,05 | 0,40 | 700 |

## Stop-Signal (19 livelli)
Solo la leva ISI (per Stop-Signal lo staircase SSD resta com'è).

| Liv. | ISI (ms) |
|---|---|
| 1 | 3600 |
| 1,5 | 3400 |
| 2 | 3200 |
| 2,5 | 3000 |
| 3 | 2800 |
| 3,5 | 2600 |
| 4 | 2400 |
| 4,5 | 2200 |
| 5 | 2000 |
| 5,5 | 1850 |
| 6 | 1700 |
| 6,5 | 1550 |
| 7 | 1400 |
| 7,5 | 1275 |
| 8 | 1150 |
| 8,5 | 1050 |
| 9 | 950 |
| 9,5 | 850 |
| 10 | 750 |

## ANT / Simon (19 livelli)
Solo la leva ISI (per Stop-Signal lo staircase SSD resta com'è).

| Liv. | ISI (ms) |
|---|---|
| 1 | 3200 |
| 1,5 | 3000 |
| 2 | 2800 |
| 2,5 | 2600 |
| 3 | 2400 |
| 3,5 | 2200 |
| 4 | 2000 |
| 4,5 | 1800 |
| 5 | 1600 |
| 5,5 | 1500 |
| 6 | 1400 |
| 6,5 | 1300 |
| 7 | 1200 |
| 7,5 | 1100 |
| 8 | 1000 |
| 8,5 | 900 |
| 9 | 800 |
| 9,5 | 725 |
| 10 | 650 |

## Categorizzazione (15 livelli)
Mezzi livelli solo dentro la banda di struttura (1-2, 3-4, 5-6, 7-8, 9-10).

| Liv. | Struttura | ISI (ms) | Lure |
|---|---|---|---|
| 1 | 1 | 2200 | — |
| 1,5 | 1 | 1750 | — |
| 2 | 1 | 1300 | — |
| 3 | 2 | 2200 | — |
| 3,5 | 2 | 1750 | — |
| 4 | 2 | 1300 | — |
| 5 | 3 | 2200 | — |
| 5,5 | 3 | 1750 | — |
| 6 | 3 | 1300 | — |
| 7 | 4 | — | 0,00 |
| 7,5 | 4 | — | 0,15 |
| 8 | 4 | — | 0,30 |
| 9 | 5 | 2200 | — |
| 9,5 | 5 | 1750 | — |
| 10 | 5 | 1300 | — |
