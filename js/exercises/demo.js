// Prova dimostrativa: parametri delle 6 prove e testo di feedback dopo ogni prova.
// SPOSTATI da index.html (passo 5k) senza modifiche al testo, con "export".
// Differenza dichiarata: demoFeedbackText riceve cfg come primo parametro invece di leggere la variabile dell'app.

  // Motore di screening (sonde, domini, regole di suggerimento): vedi js/core/screening.js (passo 3b).
  // Prova dimostrativa: 6 prove a difficoltà fissa e facile, con feedback
  // esplicativo dopo ogni risposta, per far capire la regola prima che le
  // prove "contino" davvero. Solo per i 6 esercizi con la regola meno
  // immediata da intuire da soli — Cancellazione, Sequenza bersaglio e le
  // strategie di memoria restano fuori: la loro consegna è già
  // sostanzialmente auto-esplicativa. Riuso, dove possibile, esattamente
  // gli stessi valori isi/stimDuration già validati nei blocchi di
  // screening per lo stesso esercizio (non nuovi numeri inventati); dove
  // lo screening non copre quell'esercizio (Stop-Signal, TAPAT, Doppio
  // compito) i valori sono una scelta di comodo per un ritmo non
  // frettoloso — ipotesi di costruzione, non un dato di letteratura.
  export const DEMO_TRIALS = 6;
  export const DEMO_ELIGIBLE = ['nback','sequenza','gonogo','switching','stopsignal','categorizzazione','dualtask','tapat','ant','simon'];
  export const DEMO_PATCHES = {
    nback: ()=>({taskMode:'nback', nLevel:1, isi:2200, stimDuration:700, trials:DEMO_TRIALS}),
    sequenza: ()=>({taskMode:'sequenza', adaptStartLevel:1, isi:2200, stimDuration:700, trials:DEMO_TRIALS}),
    gonogo: ()=>({taskMode:'gonogo', adaptStartLevel:1, isi:1600, stimDuration:600, trials:DEMO_TRIALS}),
    switching: ()=>({taskMode:'switching', adaptStartLevel:1, isi:1800, stimDuration:800, trials:DEMO_TRIALS}),
    stopsignal: ()=>({taskMode:'stopsignal', adaptStartLevel:1, isi:2000, stimDuration:800, trials:DEMO_TRIALS}),
    categorizzazione: ()=>({taskMode:'categorizzazione', categLivello:1, isi:1800, stimDuration:700, trials:DEMO_TRIALS}),
    dualtask: ()=>({taskMode:'dualtask', dualStartLevel1:1, dualStartLevel2:1, isi:2200, stimDuration:800, trials:DEMO_TRIALS}),
    tapat: ()=>({taskMode:'tapat', tapatStartLevel:1, trials:DEMO_TRIALS}),
    ant: ()=>({taskMode:'ant', adaptStartLevel:1, isi:3200, stimDuration:700, trials:DEMO_TRIALS}),
    simon: ()=>({taskMode:'simon', adaptStartLevel:1, simonCongruenza:'bilanciato', isi:3200, stimDuration:700, trials:DEMO_TRIALS})
  };
  // Testo di feedback dopo ogni prova della demo — usa la classificazione
  // che il motore calcola comunque (outcome, isTarget, isLure, isSwitch,
  // isStopTrial...), non aggiunge nuova logica di valutazione: si limita a
  // spiegare a parole quello che l'esercizio ha già giudicato.
  export function demoFeedbackText(cfg, trial, outcome){
    const ok = outcome==='hit';
    if(cfg.taskMode==='nback'){
      if(ok && trial.isTarget) return 'Giusto — questa lettera era uguale a quella di n prove fa: andava toccato il tasto.';
      if(ok && trial.isLure) return 'Giusto a non rispondere — questa lettera sembrava familiare, ma non era alla distanza giusta (n prove fa): era una "trappola".';
      if(ok) return 'Giusto a non rispondere — questa lettera non corrispondeva.';
      if(trial.isTarget) return 'Qui andava toccato il tasto: questa lettera era uguale a quella di n prove fa.';
      if(trial.isLure) return 'Qui non andava toccato nulla: questa lettera sembrava familiare, ma era una "trappola" — non alla distanza giusta.';
      return 'Qui non andava toccato nulla: questa lettera non corrispondeva.';
    }
    if(cfg.taskMode==='sequenza'){
      if(ok && trial.isTarget) return 'Giusto — questo elemento è nella sequenza bersaglio da riconoscere: andava toccato il tasto.';
      if(ok) return 'Giusto a non rispondere — questo elemento non fa parte della sequenza bersaglio.';
      if(trial.isTarget) return 'Qui andava toccato il tasto: questo elemento fa parte della sequenza bersaglio.';
      return 'Qui non andava toccato nulla: questo elemento non fa parte della sequenza bersaglio.';
    }
    if(cfg.taskMode==='gonogo'){
      if(ok && !trial.isTarget) return 'Giusto a non rispondere — questo è l\'elemento "no-go", quello a cui NON si risponde mai.';
      if(ok) return 'Giusto — hai risposto, ed era corretto farlo.';
      if(!trial.isTarget) return 'Qui non andava toccato nulla: questo è l\'elemento "no-go".';
      return 'Qui andava data una risposta: non era l\'elemento "no-go".';
    }
    if(cfg.taskMode==='switching'){
      const regola = trial.ruleDef ? trial.ruleDef.label : '';
      if(ok) return 'Giusto — la regola di questa prova era «'+regola+'».';
      return 'Qui la regola era «'+regola+'»'+(trial.isSwitch ? ', cambiata rispetto alla prova precedente.' : ', la stessa della prova precedente.');
    }
    if(cfg.taskMode==='stopsignal'){
      if(trial.isStopTrial) return ok ? 'Giusto — è comparso il segnale di stop: bene a non rispondere.' : 'Qui è comparso il segnale di stop: l\'obiettivo era trattenersi, non rispondere.';
      return ok ? 'Giusto — hai risposto in tempo con la scelta corretta.' : 'Non era la risposta giusta per questo stimolo — rivedi la regola sopra.';
    }
    if(cfg.taskMode==='categorizzazione'){
      const isNogo = trial.correctAnswer==='nogo';
      if(isNogo) return ok ? 'Giusto a non rispondere — la regola attuale lo richiedeva.' : 'Qui non andava data nessuna risposta, secondo la regola attuale.';
      return ok ? 'Giusto.' : 'Non era la categoria corretta secondo la regola attuale.';
    }
    if(cfg.taskMode==='dualtask'){
      return ok ? 'Giusto su entrambi i canali — ricorda: qui si risponde a due cose insieme, ciascuna con la propria regola.' : 'Qui manca o è sbagliata la risposta su almeno uno dei due canali — ricorda: vanno seguiti insieme, ciascuno con la propria regola.';
    }
    if(cfg.taskMode==='tapat'){
      if(trial.block==='tonic') return ok ? 'Giusto — hai risposto al bersaglio anche senza nessun segnale d\'aiuto.' : 'Il bersaglio è comparso senza preavviso: in questo blocco bisogna restare pronti da soli, senza aiuti.';
      return ok ? 'Giusto — hai risposto al bersaglio dopo il segnale di allerta.' : 'Ricorda: il segnale che precede il bersaglio serve ad anticiparne l\'arrivo.';
    }
    if(cfg.taskMode==='ant'){
      const cueNote = trial.cueType && trial.cueType!=='none' ? ' Il segnale visto poco prima anticipava l\'arrivo del bersaglio.' : '';
      return ok ? 'Giusto — hai indicato la direzione corretta.'+cueNote : 'La direzione indicata non era corretta — guarda solo la freccia centrale, ignora quelle intorno.'+cueNote;
    }
    if(cfg.taskMode==='simon'){
      const mat = cfg.simonMateriale || 'colori';
      const dimNames = {colori:'il colore', lettere:'vocale o consonante', numeri:'pari o dispari', suoni:'l\'altezza del suono (grave/acuto)'};
      const posNames = {colori:'del cerchio', lettere:'della lettera', numeri:'del numero', suoni:'da cui arriva il suono'};
      const dim = dimNames[mat], pos = posNames[mat];
      const posNote = trial.congruency==='incongruent' ? ' Qui la posizione '+pos+' "tirava" verso il pulsante sbagliato — conta solo '+dim+', mai la posizione.' : '';
      return ok ? 'Giusto — hai risposto in base a '+dim+'.'+posNote : 'Risposta sbagliata: la regola è sempre e solo '+dim+', mai la posizione '+pos+'.'+posNote;
    }
    return ok ? 'Giusto.' : 'Risposta non corretta per questa prova.';
  }
