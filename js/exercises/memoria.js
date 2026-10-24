// Strategie di memoria (PQRST, chunking, loci, errorless, vanishing cues): brani, liste e percorsi, e funzioni che li normalizzano.
// SPOSTATO da index.html (passo 5g) senza modifiche al testo, con "export" davanti ai nomi usati altrove.
// Differenza dichiarata: memoriaFormeUsatePerPaziente riceve lo storico (historyCache) come primo parametro
// invece di leggere la variabile dell'app; in index.html resta una funzione da una riga con lo stesso nome.

  // ---------- Modulo strategie di memoria (PQRST / chunking) ----------
  // 16 brani graduati per PQRST, 16 liste graduate per chunking. Parametri
  // di gradazione dichiarati nei commenti di ciascun blocco — vedi anche il
  // README per la spiegazione estesa. "unita" = le idee-chiave che
  // l'operatore spunta durante il richiamo (non l'intero testo, un elenco
  // di proposizioni verificabili). Lunghezza, densità di idee, dettagli
  // interferenti (numeri/nomi) e astrattezza crescono col livello.
  // Livelli 1-2: forme parallele (3 ciascuno, A/B/C) per RCI — ogni forma
  // è divisa in sezioni da ~2 unità concettuali, secondo lo schema PQRST di
  // riferimento (ciclo P-Q-R-S per sezione, Test finale cumulativo su tutte
  // le sezioni). I livelli 3-16 restano nella forma "a blocco unico"
  // storica finché non vengono anch'essi portati a forme parallele —
  // memoriaBranoResolve() normalizza entrambe le forme in un'unica forma
  // a sezioni, così il resto del codice non deve distinguere i due casi.
  export const MEMORIA_BRANI = [
    {livello:1, forme:[
      {titolo:'Il gatto', sezioni:[
        {testo:'Un gatto grigio dorme sul davanzale. Il sole scalda il suo pelo.', unita:['un gatto grigio dorme sul davanzale','il sole scalda il suo pelo']},
        {testo:'Quando si sveglia, si stiracchia e beve un po\' d\'acqua.', unita:['si sveglia e si stiracchia','beve un po\' d\'acqua']}
      ]},
      {titolo:'Il cane', sezioni:[
        {testo:'Un cane marrone gioca in giardino. Insegue una palla tra l\'erba.', unita:['un cane marrone gioca in giardino','insegue una palla tra l\'erba']},
        {testo:'Quando si stanca, si stende all\'ombra di un albero.', unita:['si stanca','si stende all\'ombra di un albero']}
      ]},
      {titolo:'La pioggia', sezioni:[
        {testo:'Fuori inizia a piovere piano. Le gocce battono sul vetro della finestra.', unita:['inizia a piovere piano','le gocce battono sul vetro']},
        {testo:'Un bambino guarda fuori, incuriosito dal rumore.', unita:['un bambino guarda fuori','è incuriosito dal rumore']}
      ]}
    ]},
    {livello:2, forme:[
      {titolo:'La spesa', sezioni:[
        {testo:'Maria esce di casa per fare la spesa. Compra pane, latte e qualche mela.', unita:['Maria esce per fare la spesa','compra pane, latte e mele']},
        {testo:'Sulla via del ritorno incontra una vicina e si ferma a salutarla.', unita:['sulla via del ritorno incontra una vicina','si ferma a salutarla']}
      ]},
      {titolo:'La passeggiata', sezioni:[
        {testo:'Luca esce a fare una passeggiata nel parco. Cammina lungo il viale alberato.', unita:['Luca esce a passeggiare nel parco','cammina lungo il viale alberato']},
        {testo:'Si ferma su una panchina. Un amico lo raggiunge e si siedono a chiacchierare.', unita:['si ferma su una panchina','un amico lo raggiunge e chiacchierano']}
      ]},
      {titolo:'Il caffè', sezioni:[
        {testo:'Anna entra in un bar vicino a casa. Ordina un caffè e una brioche al banco.', unita:['Anna entra in un bar vicino a casa','ordina un caffè e una brioche']},
        {testo:'Si siede vicino alla finestra e legge il giornale per qualche minuto.', unita:['si siede vicino alla finestra','legge il giornale per qualche minuto']}
      ]}
    ]},
    {livello:3, forme:[
      {titolo:'Il temporale', sezioni:[{testo:'Nel pomeriggio il cielo si scurisce improvvisamente. Arriva un forte temporale con tuoni e pioggia battente. I bambini corrono a ripararsi sotto un portico, ridendo per lo spavento appena passato.',
        unita:['il cielo si scurisce nel pomeriggio','arriva un forte temporale','ci sono tuoni e pioggia battente','i bambini corrono sotto un portico','ridono per lo spavento passato']}]},
      {titolo:'Il vento forte', sezioni:[{testo:'In tarda mattinata si alza un vento molto forte. Fa cadere alcuni rami secchi dagli alberi del viale. Un uomo rincorre il proprio cappello, portato via da una raffica, tra le risate di due passanti.',
        unita:['in tarda mattinata si alza un vento forte','fa cadere rami secchi dagli alberi','un uomo rincorre il proprio cappello','portato via da una raffica','due passanti ridono della scena']}]},
      {titolo:'La nevicata improvvisa', sezioni:[{testo:'Verso sera comincia a nevicare senza preavviso. I fiocchi si posano rapidamente sulle auto parcheggiate in strada. Due ragazzi escono di corsa a fare una foto, scivolando quasi sul marciapiede già bianco.',
        unita:['verso sera comincia a nevicare senza preavviso','i fiocchi si posano sulle auto parcheggiate','due ragazzi escono a fare una foto','scivolano quasi sul marciapiede','il marciapiede è già bianco']}]}
    ]},
    {livello:4, forme:[
      {titolo:'Il mercato', sezioni:[{testo:'Ogni giovedì mattina, in piazza, si tiene il mercato del paese. I banchi vendono frutta, verdura, formaggi e fiori. Un anziano contadino offre assaggi del suo miele a chi passa, raccontando volentieri come lo produce.',
        unita:['il giovedì mattina c\'è il mercato in piazza','i banchi vendono frutta, verdura, formaggi e fiori','un contadino offre assaggi di miele','racconta come lo produce a chi passa']}]},
      {titolo:'La fiera del paese', sezioni:[{testo:'Ogni terza domenica del mese, sul lungofiume, si svolge la piccola fiera dell\'artigianato. Le bancarelle espongono ceramiche, tessuti e oggetti in legno lavorato. Una giovane artigiana mostra come intreccia i cesti di vimini a chi si ferma a guardare.',
        unita:['la terza domenica del mese c\'è la fiera sul lungofiume','le bancarelle espongono ceramiche, tessuti e oggetti in legno','un\'artigiana mostra come intreccia i cesti di vimini','a chi si ferma a guardare']}]},
      {titolo:'Il mercatino dell\'usato', sezioni:[{testo:'Ogni primo sabato del mese, nel cortile della scuola, si tiene il mercatino dell\'usato. Le famiglie portano libri, giocattoli e vestiti non più utilizzati. Un ragazzo spiega volentieri la storia della sua vecchia bicicletta a chi si mostra interessato.',
        unita:['il primo sabato del mese c\'è il mercatino dell\'usato','si tiene nel cortile della scuola','le famiglie portano libri, giocattoli e vestiti','un ragazzo racconta la storia della sua vecchia bicicletta']}]}
    ]},
    {livello:5, forme:[
      {titolo:'La biblioteca', sezioni:[{testo:'La biblioteca comunale ha aperto una nuova sala lettura al primo piano. È dotata di grandi finestre e tavoli in legno chiaro. Gli studenti la preferiscono al pomeriggio perché è silenziosa, mentre la mattina la frequentano soprattutto pensionati in cerca di quotidiani.',
        unita:['la biblioteca ha una nuova sala lettura al primo piano','ha grandi finestre e tavoli in legno','gli studenti la preferiscono al pomeriggio','è silenziosa nel pomeriggio','la mattina la frequentano pensionati per i quotidiani']}]},
      {titolo:'Il centro sportivo', sezioni:[{testo:'Il centro sportivo comunale ha inaugurato una nuova palestra al piano interrato. È attrezzata con macchinari moderni e ampi spogliatoi. I ragazzi la preferiscono nel tardo pomeriggio perché è più libera, mentre la mattina la frequentano soprattutto persone anziane per la ginnastica dolce.',
        unita:['il centro sportivo ha una nuova palestra al piano interrato','ha macchinari moderni e ampi spogliatoi','i ragazzi la preferiscono nel tardo pomeriggio','è più libera nel tardo pomeriggio','la mattina la frequentano anziani per la ginnastica dolce']}]},
      {titolo:'Il centro anziani', sezioni:[{testo:'Il centro anziani del quartiere ha aperto una nuova sala giochi al piano terra. È arredata con tavoli larghi e poltrone comode. I soci la preferiscono al mattino perché è più tranquilla, mentre nel pomeriggio la frequentano soprattutto i nipoti in visita dopo la scuola.',
        unita:['il centro anziani ha una nuova sala giochi al piano terra','è arredata con tavoli larghi e poltrone comode','i soci la preferiscono al mattino','è più tranquilla al mattino','nel pomeriggio la frequentano i nipoti dopo la scuola']}]}
    ]},
    {livello:6, titolo:'Il trasloco', testo:'La famiglia Rossi ha traslocato in un appartamento più piccolo vicino al centro. Hanno dovuto lasciare alcuni mobili grandi, ma hanno guadagnato una posizione comoda per andare al lavoro a piedi. I bambini si sono dispiaciuti di lasciare il giardino, ma si sono presto abituati al nuovo cortile condiviso con i vicini.',
      unita:['la famiglia Rossi ha traslocato in un appartamento più piccolo','è vicino al centro','hanno lasciato alcuni mobili grandi','ora vanno al lavoro a piedi','i bambini si sono dispiaciuti per il giardino','si sono abituati al cortile condiviso']},
    {livello:7, titolo:'Il corso di cucina', testo:'Un ristorante del centro ha iniziato a offrire corsi serali di cucina una volta al mese. Il primo incontro, dedicato alla pasta fresca, ha avuto un buon successo: si sono iscritte diciotto persone, più del doppio di quanto previsto. Lo chef ha promesso un secondo incontro dedicato ai dolci, se l\'interesse resterà alto.',
      unita:['un ristorante offre corsi serali di cucina una volta al mese','il primo incontro era dedicato alla pasta fresca','si sono iscritte diciotto persone','erano più del doppio del previsto','lo chef ha promesso un incontro sui dolci','solo se l\'interesse resterà alto']},
    {livello:8, titolo:'Il volontariato', testo:'Un gruppo di volontari si occupa da tre anni della manutenzione di un piccolo parco cittadino, ormai trascurato dal Comune per mancanza di fondi. Ogni sabato mattina puliscono i vialetti, potano le siepi e innaffiano le aiuole. Recentemente hanno anche organizzato una raccolta fondi per installare panchine nuove, raggiungendo l\'obiettivo in meno di un mese grazie al contributo di molti abitanti del quartiere.',
      unita:['un gruppo di volontari cura un parco cittadino da tre anni','il Comune lo aveva trascurato per mancanza di fondi','ogni sabato mattina puliscono vialetti e siepi','innaffiano le aiuole','hanno organizzato una raccolta fondi per panchine nuove','hanno raggiunto l\'obiettivo in meno di un mese','grazie al contributo degli abitanti del quartiere']},
    {livello:9, titolo:'Lo spostamento della fermata', testo:'A partire dal quindici del mese prossimo, la fermata dell\'autobus numero 12 verrà spostata di circa duecento metri, per permettere i lavori di rifacimento del marciapiede. Il Comune ha comunicato che il cambiamento durerà almeno sei settimane. Alcuni residenti anziani hanno espresso preoccupazione per la distanza maggiore da percorrere, così l\'azienda di trasporti ha promesso un servizio navetta gratuito nelle prime due settimane.',
      unita:['dal 15 del mese prossimo la fermata dell\'autobus 12 si sposta','di circa duecento metri','per i lavori al marciapiede','il cambiamento durerà almeno sei settimane','alcuni anziani sono preoccupati per la distanza','l\'azienda ha promesso una navetta gratuita nelle prime due settimane']},
    {livello:10, titolo:'La ricerca sul sonno', testo:'Un recente studio condotto su un gruppo di adulti ha osservato come la qualità del sonno migliori sensibilmente riducendo l\'uso di schermi luminosi nell\'ora precedente al riposo. I partecipanti che hanno seguito questa indicazione per due settimane hanno riportato un addormentamento più rapido e un minor numero di risvegli notturni, mentre non sono emerse differenze significative nella durata totale del sonno.',
      unita:['uno studio ha osservato la qualità del sonno negli adulti','riducendo gli schermi luminosi nell\'ora prima di dormire','i partecipanti hanno seguito l\'indicazione per due settimane','si sono addormentati più rapidamente','hanno avuto meno risvegli notturni','la durata totale del sonno non è cambiata significativamente']},
    {livello:11, titolo:'Il restauro della torre', testo:'La torre civica, chiusa al pubblico dal 2019 per motivi di sicurezza, riaprirà entro la fine dell\'anno dopo un intervento di restauro costato circa 340.000 euro, finanziato per metà da un contributo regionale. Oltre al consolidamento strutturale, i lavori hanno previsto la sostituzione dell\'orologio meccanico originale, rimasto fermo per anni, con un nuovo meccanismo che ne riproduce fedelmente il funzionamento storico.',
      unita:['la torre civica è chiusa dal 2019 per sicurezza','riaprirà entro fine anno','il restauro è costato circa 340.000 euro','finanziato per metà dalla Regione','hanno consolidato la struttura','hanno sostituito l\'orologio meccanico fermo da anni','il nuovo meccanismo riproduce quello storico']},
    {livello:12, titolo:'Il cambiamento in azienda', testo:'Da gennaio, l\'azienda che gestisce la raccolta rifiuti del comune ha introdotto un nuovo calendario di raccolta differenziata, con l\'obiettivo di ridurre del 15% i rifiuti indifferenziati entro la fine dell\'anno. La plastica verrà ritirata due volte a settimana anziché una, mentre la carta passerà da settimanale a quindicinale. Diversi commercianti hanno lamentato che il nuovo orario di ritiro, fissato alle 6 del mattino, crea difficoltà logistiche prima dell\'apertura dei negozi.',
      unita:['da gennaio è cambiato il calendario della raccolta differenziata','l\'obiettivo è ridurre del 15% i rifiuti indifferenziati entro l\'anno','la plastica si ritira due volte a settimana invece di una','la carta passa da settimanale a quindicinale','i commercianti lamentano difficoltà con il ritiro alle 6 del mattino','è prima dell\'apertura dei negozi']},
    {livello:13, titolo:'L\'indagine sul traffico', testo:'Un\'indagine condotta dall\'ufficio tecnico comunale su un campione di 1.200 automobilisti ha rilevato che il tempo medio impiegato per attraversare il centro città nelle ore di punta è aumentato del 22% negli ultimi cinque anni, nonostante la costruzione di due nuove rotatorie nel 2021. I tecnici attribuiscono l\'aumento soprattutto alla crescita del traffico proveniente dai comuni limitrofi, più che a fattori interni alla città stessa, e propongono l\'introduzione di una corsia preferenziale per i mezzi pubblici lungo l\'asse principale.',
      unita:['un\'indagine su 1.200 automobilisti sul traffico cittadino','il tempo per attraversare il centro nelle ore di punta è aumentato del 22%','negli ultimi cinque anni','nonostante due nuove rotatorie costruite nel 2021','l\'aumento è attribuito al traffico dai comuni limitrofi','più che a fattori interni alla città','propongono una corsia preferenziale per i mezzi pubblici']},
    {livello:14, titolo:'Il progetto scolastico', testo:'Tre istituti superiori della provincia hanno avviato un progetto sperimentale che permette agli studenti dell\'ultimo anno di seguire alcune materie tecniche direttamente presso aziende del territorio, per un totale di 80 ore nell\'arco dell\'anno scolastico. Il progetto, finanziato da un bando regionale e monitorato da un comitato composto da docenti e rappresentanti aziendali, ha già raccolto 95 adesioni su 140 studenti idonei, un dato che i promotori giudicano incoraggiante ma che intendono migliorare comunicando meglio l\'iniziativa alle famiglie fin dal primo anno.',
      unita:['tre istituti superiori hanno un progetto sperimentale','gli studenti dell\'ultimo anno seguono materie tecniche in azienda','per un totale di 80 ore nell\'anno','finanziato da un bando regionale','monitorato da docenti e rappresentanti aziendali','ci sono state 95 adesioni su 140 studenti idonei','i promotori vogliono comunicare meglio alle famiglie dal primo anno']},
    {livello:15, titolo:'Lo studio sulla memoria', testo:'Un gruppo di ricerca universitario ha confrontato due tecniche di studio in un campione di 64 studenti universitari, dividendoli casualmente in due gruppi: il primo ha utilizzato tecniche di ripetizione distanziata nell\'arco di tre settimane, il secondo ha concentrato lo stesso materiale in un\'unica sessione intensiva la sera prima del test. A distanza di un mese dal test iniziale, il primo gruppo ha mostrato una ritenzione delle informazioni superiore del 34%, un divario che i ricercatori attribuiscono principalmente al consolidamento della memoria favorito dagli intervalli, più che alla quantità totale di tempo dedicato allo studio, che era comparabile tra i due gruppi.',
      unita:['un gruppo di ricerca ha confrontato due tecniche di studio','su 64 studenti universitari divisi in due gruppi','il primo gruppo ha usato la ripetizione distanziata su tre settimane','il secondo ha studiato tutto in un\'unica sessione la sera prima','a un mese dal test il primo gruppo ricordava il 34% in più','l\'effetto è attribuito al consolidamento dato dagli intervalli','il tempo totale di studio era simile tra i due gruppi']},
    {livello:16, titolo:'La riorganizzazione del reparto', testo:'A seguito di un audit interno durato quattro mesi, la direzione dell\'ospedale ha deciso di riorganizzare il reparto di day hospital, unendo due unità precedentemente separate e trasferendo parte del personale infermieristico su turni misti mattina-pomeriggio anziché fissi. L\'obiettivo dichiarato è ridurre i tempi di attesa medi, passati da 40 a 25 minuti secondo le proiezioni, ma il cambiamento ha incontrato resistenze da parte di alcuni operatori, preoccupati per la minore prevedibilità dei propri orari; la direzione ha quindi concordato un periodo di prova di sei mesi, al termine del quale il nuovo assetto sarà valutato insieme ai rappresentanti sindacali prima di essere reso definitivo.',
      unita:['un audit interno di quattro mesi ha portato a riorganizzare il day hospital','due unità separate sono state unite','parte del personale è passata a turni misti mattina-pomeriggio','invece di turni fissi','l\'obiettivo è ridurre i tempi di attesa da 40 a 25 minuti','secondo le proiezioni','alcuni operatori sono preoccupati per la minore prevedibilità degli orari','la direzione ha concordato una prova di sei mesi','il nuovo assetto sarà valutato con i sindacati prima di diventare definitivo']}
  ];
  // 16 liste graduate per chunking. Parametri: lunghezza (4→14), presenza
  // di categorie semantiche raggruppabili (sì nei livelli bassi, assente
  // negli alti — è il meccanismo stesso del chunking), concretezza delle
  // parole (concrete→astratte, effetto Paivio), frequenza d'uso.
  // Livelli 1-2: forme parallele (3 ciascuno) a sotto-gruppi espliciti —
  // il numero di gruppi e la dimensione di ciascuno crescono insieme, non
  // solo la lunghezza totale (vedi CHUNKING_GROUP_PLAN più sotto per la
  // regola generale su tutti e 16 i livelli). I livelli 3-16 restano nella
  // forma "lista flat" storica finché non vengono anch'essi popolati con
  // gruppi reali — memoriaListaResolve() normalizza entrambe le forme.
  export const MEMORIA_LISTE = [
    {livello:1, forme:[
      {gruppi:[{categoria:'frutta', parole:['mela','pera']}, {categoria:'animali', parole:['cane','gatto']}]},
      {gruppi:[{categoria:'verdura', parole:['carota','patata']}, {categoria:'colori', parole:['rosso','blu']}]},
      {gruppi:[{categoria:'bevande', parole:['acqua','latte']}, {categoria:'vestiti', parole:['scarpe','cappotto']}]}
    ]},
    {livello:2, forme:[
      {gruppi:[{categoria:'mobili', parole:['sedia','tavolo']}, {categoria:'utensili da cucina', parole:['forchetta','coltello']}, {categoria:'mezzi di trasporto', parole:['auto','bicicletta','treno']}]},
      {gruppi:[{categoria:'elettrodomestici', parole:['frigorifero','lavatrice']}, {categoria:'strumenti musicali', parole:['chitarra','tamburo']}, {categoria:'parti della casa', parole:['cucina','bagno','camera']}]},
      {gruppi:[{categoria:'professioni', parole:['medico','cuoco']}, {categoria:'stagioni', parole:['estate','inverno']}, {categoria:'fiori', parole:['rosa','tulipano','girasole']}]}
    ]},
    {livello:3, forme:[
      {parole:['sedia','tavolo','letto','armadio','divano'], categorizzata:true, categoria:'mobili'},
      {parole:['forchetta','coltello','piatto','bicchiere','pentola'], categorizzata:true, categoria:'utensili da cucina'},
      {parole:['cane','gatto','coniglio','criceto','pesce'], categorizzata:true, categoria:'animali domestici'}
    ]},
    {livello:4, forme:[
      {parole:['rosso','blu','verde','giallo','viola','arancione'], categorizzata:true, categoria:'colori'},
      {parole:['mela','pera','banana','arancia','uva','fragola'], categorizzata:true, categoria:'frutta'},
      {parole:['scarpe','cappotto','maglione','pantaloni','cappello','sciarpa'], categorizzata:true, categoria:'vestiti'}
    ]},
    {livello:5, forme:[
      {parole:['martello','cacciavite','chiodo','vite','pinza','sega'], categorizzata:true, categoria:'utensili'},
      {parole:['chitarra','violino','tamburo','flauto','tromba','pianoforte'], categorizzata:true, categoria:'strumenti musicali'},
      {parole:['treno','autobus','bicicletta','aereo','nave','moto'], categorizzata:true, categoria:'mezzi di trasporto'}
    ]},
    {livello:6, parole:['cane','martello','mela','sedia','rosso','uva','tavolo'], categorizzata:false},
    {livello:7, parole:['gatto','cacciavite','pera','armadio','blu','vite','banana','divano'], categorizzata:false},
    {livello:8, parole:['nave','montagna','biblioteca','ombrello','fiume','candela','scarpa','orologio'], categorizzata:false},
    {livello:9, parole:['finestra','giardino','matita','specchio','cuscino','bicicletta','lampada','forchetta','quaderno'], categorizzata:false},
    {livello:10, parole:['pazienza','coraggio','velocità','silenzio','armadio','giustizia','matita','libertà'], categorizzata:false},
    {livello:11, parole:['onestà','equilibrio','curiosità','fiducia','stanchezza','gentilezza','sedia','memoria','dubbio'], categorizzata:false},
    {livello:12, parole:['coerenza','ambizione','nostalgia','prudenza','ostacolo','armonia','sospetto','tenacia','sorpresa','equità'], categorizzata:false},
    {livello:13, parole:['discrezione','vulnerabilità','autonomia','riluttanza','integrità','ambiguità','perseveranza','indifferenza','entusiasmo','rassegnazione'], categorizzata:false},
    {livello:14, parole:['sussidiarietà','contingenza','discernimento','emancipazione','equanimità','reticenza','circospezione','pervicacia','indole','sagacia','deferenza'], categorizzata:false},
    {livello:15, parole:['inerzia','postulato','dicotomia','empatia','austerità','congettura','risolutezza','apatia','solerzia','avversione','indole','abnegazione'], categorizzata:false},
    {livello:16, parole:['epifania','recalcitranza','esiguità','preterintenzionale','anacronismo','perentorio','desueto','ineluttabile','circostanziato','peregrino','apodittico','inveterato','ipostasi','vacuità'], categorizzata:false}
  ];
  // Le tecniche PQRST e Chunking usano ciascuna una sola modalità di
  // materiale (brano/lista); Loci, Errorless learning e Vanishing cues sono
  // invece applicabili a entrambe — memoriaEffectiveMateriale() risolve la
  // modalità effettiva in ogni caso, così tutto il resto del codice usa
  // sempre questa funzione invece di controllare memoriaModo direttamente.
  export function memoriaEffectiveMateriale(cfgLike){
    if(cfgLike.memoriaModo==='chunking') return 'lista';
    if(cfgLike.memoriaModo==='pqrst') return 'brano';
    return cfgLike.memoriaMateriale || 'lista';
  }
  // Regola generale di crescita per il chunking a sotto-gruppi (numero di
  // gruppi × dimensione di ciascuno, cresciuti insieme, non solo la
  // lunghezza totale). Livelli 1-10: gruppi mostrati esplicitamente con
  // etichetta di categoria. Livelli 11-16: gruppi presenti nel dato (usati
  // per l'osservazione del clustering in richiamo) ma NON mostrati al
  // paziente — la lista appare come blocco unico e il paziente organizza
  // con una tecnica propria fra quelle già esistenti (chunkingMetodi),
  // fino a 2 combinabili (soglia già in uso altrove nel codice, riusata
  // qui apposta per non introdurre un secondo confine indipendente).
  // Questa tabella governa solo LA STRUTTURA quando esiste un dato a
  // gruppi (vedi forme in MEMORIA_LISTE) — per ora solo i livelli 1-2 sono
  // popolati; i livelli 3-16 restano nella forma flat storica finché non
  // vengono anch'essi convertiti, contenuto da produrre gradualmente.
  export const CHUNKING_GROUP_VISIBLE_MAX_LEVEL = 10;
  export function chunkingGroupsVisible(livello){ return livello <= CHUNKING_GROUP_VISIBLE_MAX_LEVEL; }
  // Quante forme parallele esistono per il livello/modo correnti (1 se il
  // livello non è ancora stato popolato con forme multiple — vedi commenti
  // sopra). Usata dal selettore in setup e per validare memoriaFormaIdx.
  export function memoriaNForme(modo, livello){
    if(modo==='chunking'){
      const e = MEMORIA_LISTE.find(l=>l.livello===livello);
      return (e && e.forme) ? e.forme.length : 1;
    }
    if(modo==='pqrst'){
      const e = MEMORIA_BRANI.find(b=>b.livello===livello);
      return (e && e.forme) ? e.forme.length : 1;
    }
    return 1;
  }
  // Set delle lettere-forma già usate da questo paziente, con questa
  // tecnica e a questo livello, secondo lo storico già caricato in
  // memoria (historyCache). Non forza un caricamento: se lo storico non è
  // ancora stato popolato in questa sessione operatore (es. primo accesso
  // dopo login, prima di aver aperto la scheda storico), ritorna un set
  // vuoto — il tag è un aiuto, non deve mai bloccare o rallentare il setup.
  export function memoriaFormeUsatePerPaziente(historyCache, patientCode, modo, livello){
    const out = new Set();
    if(!patientCode || !historyCache) return out;
    historyCache.forEach(r=>{
      if(r.family==='memoria' && r.patientCode===patientCode && r.memoria && r.memoria.modo===modo && r.memoria.livello===livello && r.memoria.formaLettera){
        out.add(r.memoria.formaLettera);
      }
    });
    return out;
  }
  // Normalizza una voce di MEMORIA_LISTE (nuova forma a `forme`/`gruppi`, o
  // vecchia forma flat con `parole`/`categorizzata`) in un'unica forma
  // canonica: {livello, parole (flat), gruppi (array o null), categorizzata,
  // categoria, nForme, formaIdx}. Il resto del codice usa sempre questa
  // funzione, mai le due forme direttamente.
  export function memoriaListaResolve(entry, formaIdx){
    if(entry.forme && entry.forme.length){
      const idx = ((formaIdx||0) % entry.forme.length + entry.forme.length) % entry.forme.length;
      const forma = entry.forme[idx];
      if(forma.gruppi){
        const parole = [].concat(...forma.gruppi.map(g=>g.parole));
        const groupsVisible = chunkingGroupsVisible(entry.livello);
        return {
          livello:entry.livello, parole, categorizzata:true,
          gruppi: groupsVisible ? forma.gruppi : null, // nascosti dal livello 11 in su — restano nel dato solo per lo scoring, non passati al rendering
          nForme:entry.forme.length, formaIdx:idx
        };
      }
      // Forma "flat": lista a categoria singola (categorizzata:true, senza
      // sotto-gruppi — livelli 3-5) o non categorizzata (livelli 6+). Prima
      // di questa generalizzazione il ramo 'forme' assumeva sempre gruppi e
      // forzava categorizzata:true — corretto qui perché aggiungere forme
      // parallele a un livello non categorizzato non deve etichettarlo
      // come categorizzato per sbaglio.
      return {
        livello:entry.livello, parole:forma.parole, categorizzata:!!forma.categorizzata, categoria:forma.categoria||null,
        gruppi:null, nForme:entry.forme.length, formaIdx:idx
      };
    }
    return {livello:entry.livello, parole:entry.parole, categorizzata:entry.categorizzata, categoria:entry.categoria, gruppi:null, nForme:1, formaIdx:0};
  }
  // Normalizza una voce di MEMORIA_BRANI (nuova forma a `forme`/`sezioni`, o
  // vecchia forma flat con `titolo`/`testo`/`unita`) in un'unica forma
  // canonica a sezioni: {livello, titolo, testo (tutte le sezioni unite),
  // unita (tutte le sezioni concatenate), sezioni:[{testo,unita}, ...],
  // nForme, formaIdx}. Le voci storiche diventano una singola sezione, così
  // il ciclo P-Q-R-S per sezione funziona identico sia sul materiale nuovo
  // sia su quello vecchio, senza due percorsi di codice separati.
  export function memoriaBranoResolve(entry, formaIdx){
    let titolo, sezioni;
    if(entry.forme && entry.forme.length){
      const idx = ((formaIdx||0) % entry.forme.length + entry.forme.length) % entry.forme.length;
      const forma = entry.forme[idx];
      titolo = forma.titolo; sezioni = forma.sezioni;
      return {
        livello:entry.livello, titolo, sezioni,
        testo: sezioni.map(s=>s.testo).join(' '),
        unita: [].concat(...sezioni.map(s=>s.unita)),
        nForme:entry.forme.length, formaIdx:idx
      };
    }
    return {
      livello:entry.livello, titolo:entry.titolo,
      sezioni:[{testo:entry.testo, unita:entry.unita}],
      testo:entry.testo, unita:entry.unita, nForme:1, formaIdx:0
    };
  }
  export function memoriaMaterialFor(cfgLike){
    return memoriaEffectiveMateriale(cfgLike)==='lista'
      ? memoriaListaResolve(MEMORIA_LISTE.find(l=>l.livello===cfgLike.memoriaLivello) || MEMORIA_LISTE[0], cfgLike.memoriaFormaIdx)
      : memoriaBranoResolve(MEMORIA_BRANI.find(b=>b.livello===cfgLike.memoriaLivello) || MEMORIA_BRANI[0], cfgLike.memoriaFormaIdx);
  }
  // Elementi da imparare, come semplice array di stringhe, indipendentemente
  // dal materiale: parole della lista, o idee-chiave del brano. Usata dalle
  // tre tecniche condivise fra le due modalità (loci/errorless/vanishing) e
  // dalla fase di richiamo comune a tutte le modalità.
  export function memoriaLearnItems(cfgLike, m){
    return memoriaEffectiveMateriale(cfgLike)==='lista' ? m.parole : m.unita;
  }
  // Percorso fisso di 16 luoghi familiari (un cammino mentale attraverso una
  // casa), sufficiente a coprire anche il materiale più lungo (16 parole al
  // livello 16). Metodo dei loci: un elemento per tappa, nello stesso ordine
  // del percorso — l'ordine del percorso è ciò che sostiene il richiamo,
  // niente di più.
  export const LOCI_ROUTE = [
    'la cassetta della posta', 'il portone d\'ingresso', 'l\'attaccapanni dell\'ingresso', 'lo specchio del corridoio',
    'il tavolo della cucina', 'il frigorifero', 'la finestra sul giardino', 'il divano del soggiorno',
    'la libreria', 'la scala che sale', 'il pianerottolo', 'la porta della camera da letto',
    'il comodino', 'l\'armadio', 'la porta del bagno', 'lo scaffale del bagno'
  ];
  // Percorso "corpo": tappe = parti del corpo in ordine anatomico fisso
  // (testa -> piedi), per pazienti con scarsa familiarità ambientale o
  // ricoverati da tempo, per cui un percorso domestico non è un riferimento
  // stabile. Stesso principio del percorso casa: una tappa, un elemento.
  export const LOCI_ROUTE_CORPO = [
    'la testa', 'la fronte', 'gli occhi', 'le orecchie',
    'il naso', 'la bocca', 'il collo', 'le spalle',
    'il petto', 'le braccia', 'le mani', 'la pancia',
    'i fianchi', 'le ginocchia', 'le caviglie', 'i piedi'
  ];
  // Percorso "personalizzato": l'operatore digita le tappe reali del
  // paziente (es. il proprio domicilio), una per riga. Usato solo quando
  // memoriaLociTipo==='personalizzato'; se vuoto si ricade sul percorso casa.
  export function lociRouteFor(cfgLike){
    if(cfgLike.memoriaLociTipo==='corpo') return LOCI_ROUTE_CORPO;
    if(cfgLike.memoriaLociTipo==='personalizzato'){
      const lines = (cfgLike.memoriaLociCustom||'').split('\n').map(s=>s.trim()).filter(Boolean);
      return lines.length ? lines : LOCI_ROUTE;
    }
    return LOCI_ROUTE;
  }
