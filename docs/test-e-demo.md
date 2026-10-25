# Test di regressione e prova dimostrativa

_Come si prova il codice e come funziona la demo per il paziente. Spostato da `README.md` (passo 7) senza modifiche al testo; indice generale nel [README](../README.md)._

## Test di regressione

La cartella `tests/` contiene una suite di controlli automatici per i 6
esercizi con titolazione a livelli condivisa (N-back, Go/No-Go,
Task-switching, Sequenza bersaglio, Stop-Signal, ANT). Si lancia con:

```
node tests/run-all.js
```

Non serve installare nulla, non è collegata alla pagina che vedono
pazienti/operatori (GitHub Pages la ospita come file inerte, non la
esegue mai) — è uno strumento di lavoro per chi sviluppa, da lanciare
prima di consegnare una modifica che tocca uno di quei 7 esercizi.
Dettagli su cosa copre e cosa no in `tests/README.md`.

## Prova dimostrativa

Per gli esercizi a prove sequenziali con una regola meno immediata da
intuire da soli — N-back, Sequenza bersaglio, Go/No-Go, Task-switching,
Stop-Signal, Categorizzazione condizionale, Doppio compito, ANT (sia
classico sia TAPAT), Simon — Setup mostra, sotto "Avvia sessione", un
secondo pulsante: "▶ Prova dimostrativa (6 prove, non salvate)". Sequenza
bersaglio e Go/No-Go richiedono lo stesso prerequisito già richiesto da
"Avvia sessione" (bersaglio/i configurato/i) — la demo lo controlla allo
stesso modo, con lo stesso messaggio.

**Fuori da questa lista, per motivi diversi fra loro:**
- **Cancellazione**: motore completamente diverso (una tavola con molti
  elementi e tocco diretto, non un ciclo di prove sequenziali) — il
  meccanismo di pausa-e-spiegazione dopo ogni risposta, pensato per un
  ciclo di prove, non si adatta a quella struttura senza una
  progettazione a sé. Resta un candidato per una futura "presentazione
  guidata" non interattiva (vedi sotto), non per questo stesso
  meccanismo.
- **Strategie di memoria e Compiti a obiettivi (pianificazione)**:
  esclusi per scelta esplicita — qui la "regola" non è qualcosa da
  scoprire per tentativi (come in un N-back o un Task-switching), è una
  tecnica che va insegnata esplicitamente (dove posizionare un elemento
  nel metodo dei loci, come si segmenta un brano nel PQRST, come si legge
  il budget di tempo in uno scenario). Una demo a 6 prove interattive
  finirebbe per essere solo un allenamento breve — cosa già ottenibile
  con una sessione libera più corta — non una vera spiegazione della
  tecnica. Più adatta qui sarebbe una breve presentazione automatica non
  interattiva (una specie di esempio già risolto, con un paio di passaggi
  corretti e un paio scorretti commentati) — proposta, non ancora
  progettata nei dettagli né implementata.

**Cosa fa esattamente.** Applica temporaneamente ai parametri
dell'esercizio scelto una versione fissa e facile (livello più basso
della scala, 6 prove — dove possibile, riusa esattamente gli stessi
valori isi/stimDuration già validati nei blocchi di screening per lo
stesso esercizio, non numeri nuovi inventati) e passa dalle normali
istruzioni (con un banner "DIMOSTRAZIONE" ben visibile) a un ciclo di 6
prove. Dopo **ogni singola risposta**, il ciclo si ferma e mostra una
riga di spiegazione — non solo se la risposta era giusta o sbagliata, ma
perché, usando la stessa classificazione che il motore calcola comunque
per ogni prova (bersaglio/non bersaglio, lure, elemento no-go, cambio di
regola, trial di stop, presenza di un cue...): nessuna nuova logica di
valutazione, solo un testo che la mette in parole. Si prosegue un tocco
alla volta ("Avanti"), non a tempo.

**Cosa NON fa.** Nessun dato della demo entra nello storico, nell'RCI, nel
log accessi o nella titolazione adattiva — a fine demo compare una
schermata dedicata ("Dimostrazione conclusa") con due sole scelte:
iniziare subito la sessione vera (con i parametri che l'operatore aveva
già impostato prima di avviare la demo, ripristinati automaticamente) o
tornare al setup. Uscire dalla demo in qualunque altro punto (Interrompi
a metà, Annulla dal countdown, "torna al setup" dalle istruzioni)
ripristina comunque i parametri originali — l'operatore non deve mai
riconfigurare a mano dopo una demo interrotta.

**Testo di feedback.** Le frasi sono scritte per esercizio (in
`demoFeedbackText`), non generiche — es. per l'N-back distinguono
esplicitamente un lure ("trappola", familiare ma alla distanza sbagliata)
da un non-bersaglio qualunque; per il Go/No-Go nominano sempre
l'elemento no-go per nome, non solo "corretto/sbagliato"; per il
Task-switching nominano la regola corrente e se è appena cambiata; per il
TAPAT distinguono blocco tonico (nessun aiuto) da fasico (preceduto da un
segnale); per l'ANT classico ricordano di ignorare le frecce di contorno
e nominano il cue quando presente. Sono testi scritti a mano, non
derivati da uno studio specifico sul wording — se in pratica risultano
poco chiari per qualche esercizio, vanno rivisti a parole, non è un
problema di logica sottostante.
