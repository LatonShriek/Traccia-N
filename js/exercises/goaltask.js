// Motore "compito a obiettivi" (scenari ecologici, pianificazione, multitasking): stato, regole, punteggio e scenari.
// SPOSTATO da index.html (passo 5f) senza modifiche al testo, con "export" davanti ai nomi usati altrove.
// Nessuna differenza di codice: il motore lavora solo sullo "state" ricevuto come parametro.

  // ---------- Motore generico "compito a obiettivi" ----------
  // Infrastruttura condivisa per pianificazione, multitasking (Six Elements /
  // Multiple Errands) e scenari ecologici (cucina, farmaci, spesa...) — tutti
  // condividono lo stesso schema sottostante: elenco di elementi da
  // completare, vincoli fra loro, un budget di tempo, regole il cui mancato
  // rispetto viene tracciato come "violazione" invece che come semplice
  // errore. Il paziente può sempre TENTARE qualsiasi elemento visibile (come
  // nel Six Elements/Multiple Errands reali): le regole non bloccano il
  // tocco, penalizzano come violazione — coerente con l'approccio già in uso
  // per le dipendenze. Fa eccezione la mutua esclusione (una scelta reale
  // rimuove l'alternativa, non è una "regola infranta") e gli elementi
  // nascosti (finestra oraria non ancora aperta, memoria prospettica non
  // ancora dovuta): quelli non sono nemmeno mostrati, si "materializzano"
  // quando è il momento.
  //
  // Forma di uno scenario:
  // { chiave, label, budgetSecondi: number|null, budgetErroriTollerati: number|null,
  //   regole: ['no_consecutivi_stessa_categoria', 'no_versioni_consecutive_stesso_gruppo', 'ingresso_unico_per_luogo', ...],
  //   distrattore: { alSec, finestraSec, item:{testo,categoria} } | null,
  //   items: [{ id, testo, categoria,
  //     vincoli:{ richiede:'altroId' },        // dipendenza sequenziale
  //     gruppo, versione,                       // per no_versioni_consecutive_stesso_gruppo (due metà dello stesso compito)
  //     luogo,                                  // per ingresso_unico_per_luogo (Multiple Errands: non rientrare due volte)
  //     finestra:{daSec,aSec},                  // finestra oraria: fuori da qui, violazione o perdita automatica
  //     escludeSe:'altroId',                    // mutua esclusione: completarlo rimuove l'altro dalla lista
  //     richiedeInfo:'chiave', fornisceInfo:'chiave', // integrazione informativa fra elementi
  //     prospettica:{dopoNAzioni, alSecondo}    // elemento nascosto finché non è "dovuto" (memoria prospettica)
  //   }] }
  export const GOALTASK_SCENARIOS = {};

  export function startGoalTask(scenario){
    return {
      scenario, startedAt: performance.now(), completati: [], violazioni: [],
      scartati: [], persi: [], infoRaccolte: {},
      distrattoreAttivo: null, distrattoreScadeAt: null, distrattoreGestito: false
    };
  }
  // Trova un elemento sia fra quelli dello scenario sia nel distrattore
  // eventualmente iniettato (che non fa parte di scenario.items).
  export function goalTaskItemById(state, id){
    if(state.distrattoreAttivo && state.distrattoreAttivo.id===id) return state.distrattoreAttivo;
    return state.scenario.items.find(x=>x.id===id) || null;
  }
  export function completeGoalTaskItem(state, itemId){
    const item = goalTaskItemById(state, itemId);
    if(!item || state.completati.includes(itemId) || state.scartati.includes(itemId) || state.persi.includes(itemId)) return state;
    const regole = state.scenario.regole || [];
    const ultimoId = state.completati.length ? state.completati[state.completati.length-1] : null;
    const ultimo = ultimoId ? goalTaskItemById(state, ultimoId) : null;
    if(item.vincoli && item.vincoli.richiede && !state.completati.includes(item.vincoli.richiede)){
      state.violazioni.push({itemId, tipo:'dipendenza_non_rispettata', ts:performance.now()});
    }
    if(regole.indexOf('no_consecutivi_stessa_categoria')!==-1 && ultimo && item.categoria && ultimo.categoria===item.categoria){
      state.violazioni.push({itemId, tipo:'due_consecutivi_stessa_categoria', ts:performance.now()});
    }
    // Six Elements originale: le due "metà" dello stesso compito non vanno
    // fatte una dopo l'altra — qui "gruppo" identifica la coppia (es. le due
    // storielle), non basta la categoria generica già usata sopra.
    if(regole.indexOf('no_versioni_consecutive_stesso_gruppo')!==-1 && ultimo && item.gruppo && ultimo.gruppo===item.gruppo){
      state.violazioni.push({itemId, tipo:'versioni_consecutive_stesso_gruppo', ts:performance.now()});
    }
    // Finestra oraria: se si tenta l'elemento fuori dall'intervallo previsto
    // (es. farmaco della sera preso di mattina), è una violazione — resta
    // comunque completabile, come nella vita reale si può sempre provare a
    // fare qualcosa fuori orario, solo che è sbagliato farlo.
    if(item.finestra){
      const elapsedSec = (performance.now()-state.startedAt)/1000;
      if(elapsedSec < item.finestra.daSec || elapsedSec > item.finestra.aSec){
        state.violazioni.push({itemId, tipo:'finestra_non_rispettata', ts:performance.now()});
      }
    }
    // Multiple Errands: non si rientra in un luogo già lasciato per un altro.
    if(regole.indexOf('ingresso_unico_per_luogo')!==-1 && item.luogo){
      const completatiConLuogo = state.completati.map(id=>goalTaskItemById(state,id)).filter(x=>x && x.luogo===item.luogo);
      if(completatiConLuogo.length){
        const idxUltimoStessoLuogo = state.completati.lastIndexOf(completatiConLuogo[completatiConLuogo.length-1].id);
        const cambiatoLuogoDopo = state.completati.slice(idxUltimoStessoLuogo+1).some(id=>{
          const it = goalTaskItemById(state,id); return it && it.luogo && it.luogo!==item.luogo;
        });
        if(cambiatoLuogoDopo) state.violazioni.push({itemId, tipo:'luogo_rivisitato', ts:performance.now()});
      }
    }
    // Integrazione informativa: usare un'informazione prima di averla raccolta.
    if(item.richiedeInfo && !state.infoRaccolte[item.richiedeInfo]){
      state.violazioni.push({itemId, tipo:'informazione_mancante', ts:performance.now()});
    }
    if(item.fornisceInfo) state.infoRaccolte[item.fornisceInfo] = true;
    // Se il distrattore appena iniettato viene gestito, disattivalo.
    if(state.distrattoreAttivo && state.distrattoreAttivo.id===itemId){
      state.distrattoreAttivo = null;
      state.distrattoreGestito = true;
    }
    // Mutua esclusione: una scelta reale, non una regola — l'alternativa
    // sparisce dalla lista invece di poter essere ancora completata.
    if(item.escludeSe && state.scartati.indexOf(item.escludeSe)===-1){
      state.scartati.push(item.escludeSe);
    }
    state.completati.push(itemId);
    return state;
  }
  // Elementi visibili in un dato istante: esclude scartati (mutua esclusione)
  // e persi (finestra oraria scaduta senza completarli), nasconde gli
  // elementi di memoria prospettica finché non sono "dovuti", e include il
  // distrattore iniettato se attivo in questo momento.
  export function goalTaskVisibleItems(state){
    const elapsedSec = (performance.now()-state.startedAt)/1000;
    const base = state.scenario.items.filter(it=>{
      if(state.scartati.indexOf(it.id)!==-1 || state.persi.indexOf(it.id)!==-1) return false;
      if(it.prospettica){
        const dueByCount = it.prospettica.dopoNAzioni!=null ? state.completati.length >= it.prospettica.dopoNAzioni : true;
        const dueByTime = it.prospettica.alSecondo!=null ? elapsedSec >= it.prospettica.alSecondo : true;
        if(!(dueByCount && dueByTime)) return false;
      }
      return true;
    });
    return state.distrattoreAttivo ? base.concat([state.distrattoreAttivo]) : base;
  }
  // Da chiamare periodicamente (ogni secondo, insieme al controllo budget):
  // fa scadere le finestre orarie non rispettate e gestisce comparsa/scadenza
  // del distrattore. Ritorna lo stato per comodità di chiamata.
  export function goalTaskTick(state){
    const elapsedSec = (performance.now()-state.startedAt)/1000;
    state.scenario.items.forEach(it=>{
      if(it.finestra && !state.completati.includes(it.id) && state.persi.indexOf(it.id)===-1 && state.scartati.indexOf(it.id)===-1){
        if(elapsedSec > it.finestra.aSec){
          state.persi.push(it.id);
          state.violazioni.push({itemId:it.id, tipo:'finestra_scaduta_senza_completare', ts:performance.now()});
        }
      }
    });
    const d = state.scenario.distrattore;
    if(d){
      if(!state.distrattoreAttivo && !state.distrattoreGestito && elapsedSec >= d.alSec){
        state.distrattoreAttivo = Object.assign({id:'distrattore', categoria:'distrattore'}, d.item);
        state.distrattoreScadeAt = elapsedSec + d.finestraSec;
      } else if(state.distrattoreAttivo && elapsedSec > state.distrattoreScadeAt){
        state.violazioni.push({itemId:state.distrattoreAttivo.id, tipo:'distrattore_non_gestito', ts:performance.now()});
        state.distrattoreAttivo = null;
        state.distrattoreGestito = true;
      }
    }
    return state;
  }
  export function scoreGoalTask(state){
    const elapsedSec = (performance.now()-state.startedAt)/1000;
    const totaleElementi = state.scenario.items.length;
    const completatiCount = state.completati.length;
    const budgetRispettato = state.scenario.budgetSecondi ? elapsedSec<=state.scenario.budgetSecondi : true;
    const soglia = state.scenario.budgetErroriTollerati;
    const erroriEntroSoglia = soglia!=null ? state.violazioni.length<=soglia : true;
    return {
      completatiCount, totaleElementi,
      percentualeCompletamento: totaleElementi ? Math.round((completatiCount/totaleElementi)*100) : 0,
      violazioniCount: state.violazioni.length,
      tempoImpiegatoSec: Math.round(elapsedSec),
      budgetRispettato,
      sogliaErroriTollerati: soglia!=null ? soglia : null,
      erroriEntroSoglia
    };
  }

  // 10 scenari costruiti sul motore qui sopra. Nota onesta: due idee
  // discusse in precedenza — il labirinto di pianificazione e il puzzle
  // "lupo-capra-cavolo" — non sono qui: sono problemi di ricerca in uno
  // spazio di stati/percorso, una struttura diversa da "elenco di elementi
  // con vincoli", richiederebbero un motore a parte.
  // Scenario dedicato solo allo screening (vedi SCREENING_PROBES.goaltask_mini più
  // sotto) — non compare nel selettore di Setup fra gli scenari normali,
  // serve solo come sonda breve. 2 tipi di vincolo attivi insieme
  // (alternanza di categoria + prerequisito su 2 dei 4 elementi), budget
  // di 90 secondi: la brevità voluta per un gate di screening, non un
  // allenamento — usato a goaltaskLivello:2 (mantiene le regole della
  // base invariate, non le spoglia come il livello 1 di goalTaskInstanceFor).
  GOALTASK_SCENARIOS.screening_breve = {
    chiave:'screening_breve', label:'Screening — mini scenario', budgetSecondi:90,
    regole:['no_consecutivi_stessa_categoria'],
    items:[
      {id:'sb1', testo:'Gruppo A — primo compito', categoria:'gruppoA'},
      {id:'sb2', testo:'Gruppo B — primo compito', categoria:'gruppoB'},
      {id:'sb3', testo:'Gruppo A — secondo compito', categoria:'gruppoA', vincoli:{richiede:'sb1'}},
      {id:'sb4', testo:'Gruppo B — secondo compito', categoria:'gruppoB', vincoli:{richiede:'sb2'}}
    ]
  };
  GOALTASK_SCENARIOS.sei_compiti_classico = {
    chiave:'sei_compiti_classico', label:'Sei compiti (Modified Six Elements)', budgetSecondi:600,
    regole:['no_consecutivi_stessa_categoria'],
    items:[
      {id:'c1', testo:'Detta 3 risposte alla prima storiella', categoria:'racconto', gruppo:'racconto'},
      {id:'c2', testo:'Detta 3 risposte alla seconda storiella', categoria:'racconto', gruppo:'racconto'},
      {id:'m1', testo:'Risolvi la prima serie di calcoli', categoria:'calcolo', gruppo:'calcolo'},
      {id:'m2', testo:'Risolvi la seconda serie di calcoli', categoria:'calcolo', gruppo:'calcolo'},
      {id:'d1', testo:'Nomina 5 oggetti della prima categoria', categoria:'denominazione', gruppo:'denominazione'},
      {id:'d2', testo:'Nomina 5 oggetti della seconda categoria', categoria:'denominazione', gruppo:'denominazione'}
    ]
  };
  GOALTASK_SCENARIOS.cucina_te = {
    chiave:'cucina_te', label:'Preparare il tè', budgetSecondi:null,
    regole:[],
    items:[
      {id:'acqua', testo:'Metti l\'acqua a bollire', categoria:'prep'},
      {id:'tazza', testo:'Prendi la tazza e la bustina', categoria:'prep'},
      {id:'versa', testo:'Versa l\'acqua bollente nella tazza', categoria:'esecuzione', vincoli:{richiede:'acqua'}},
      {id:'infondi', testo:'Lascia in infusione la bustina', categoria:'esecuzione', vincoli:{richiede:'versa'}},
      {id:'togli', testo:'Togli la bustina', categoria:'esecuzione', vincoli:{richiede:'infondi'}}
    ]
  };
  GOALTASK_SCENARIOS.farmaci_settimana = {
    chiave:'farmaci_settimana', label:'Gestione farmacologica settimanale', budgetSecondi:300,
    regole:['no_consecutivi_stessa_categoria'],
    items:[
      {id:'f1', testo:'Farmaco A — mattina, a stomaco pieno', categoria:'farmacoA'},
      {id:'f2', testo:'Farmaco B — pomeriggio', categoria:'farmacoB'},
      {id:'f3', testo:'Farmaco A — sera, a stomaco pieno', categoria:'farmacoA', vincoli:{richiede:'f1'}},
      {id:'f4', testo:'Farmaco C — solo se non già preso B oggi', categoria:'farmacoC'},
      {id:'verifica', testo:'Verifica che non ci siano interazioni segnalate', categoria:'controllo'}
    ]
  };
  GOALTASK_SCENARIOS.spesa_budget = {
    chiave:'spesa_budget', label:'Spesa con budget limitato', budgetSecondi:240,
    regole:[],
    items:[
      {id:'pane', testo:'Pane (obbligatorio)', categoria:'alimentari'},
      {id:'latte', testo:'Latte (obbligatorio)', categoria:'alimentari'},
      {id:'frutta', testo:'Frutta di stagione', categoria:'alimentari'},
      {id:'dolce', testo:'Un dolce, solo se avanza budget', categoria:'extra'},
      {id:'rivista', testo:'Una rivista, solo se avanza budget', categoria:'extra'}
    ]
  };
  GOALTASK_SCENARIOS.appuntamenti_giornata = {
    chiave:'appuntamenti_giornata', label:'Appuntamenti e mezzi pubblici', budgetSecondi:null,
    regole:[],
    items:[
      {id:'bus', testo:'Prendi il bus delle 9:00', categoria:'trasporto'},
      {id:'medico', testo:'Visita medica alle 9:30', categoria:'appuntamento', vincoli:{richiede:'bus'}},
      {id:'farmacia', testo:'Ritira la ricetta in farmacia', categoria:'commissione', vincoli:{richiede:'medico'}},
      {id:'bus2', testo:'Prendi il bus di ritorno delle 11:15', categoria:'trasporto', vincoli:{richiede:'farmacia'}}
    ]
  };
  GOALTASK_SCENARIOS.sicurezza_domestica = {
    chiave:'sicurezza_domestica', label:'Sicurezza domestica prima di uscire', budgetSecondi:180,
    regole:[],
    items:[
      {id:'fornello', testo:'Spegni il fornello', categoria:'cucina'},
      {id:'acqua', testo:'Chiudi il rubinetto', categoria:'bagno'},
      {id:'finestre', testo:'Chiudi le finestre', categoria:'generale'},
      {id:'luci', testo:'Spegni le luci non necessarie', categoria:'generale'},
      {id:'porta', testo:'Chiudi a chiave la porta', categoria:'generale', vincoli:{richiede:'finestre'}}
    ]
  };
  GOALTASK_SCENARIOS.commissioni_ufficio = {
    chiave:'commissioni_ufficio', label:'Commissioni in centro (Multiple Errands)', budgetSecondi:300,
    regole:[],
    items:[
      {id:'posta', testo:'Spedisci una lettera all\'ufficio postale', categoria:'ufficio', luogo:'posta'},
      {id:'farmacia', testo:'Compra un articolo in farmacia', categoria:'negozio', luogo:'farmacia'},
      {id:'banca', testo:'Preleva contanti in banca', categoria:'ufficio', luogo:'banca'},
      {id:'panificio', testo:'Compra il pane', categoria:'negozio', luogo:'panificio'},
      {id:'domanda', testo:'Chiedi a un negoziante l\'orario di chiusura del mercato', categoria:'informazione', luogo:'panificio'}
    ]
  };
  GOALTASK_SCENARIOS.organizza_evento = {
    chiave:'organizza_evento', label:'Organizzare un piccolo pranzo in famiglia', budgetSecondi:420,
    regole:['no_consecutivi_stessa_categoria'],
    items:[
      {id:'inviti', testo:'Avvisa i familiari della data', categoria:'comunicazione'},
      {id:'menu', testo:'Decidi il menu', categoria:'pianificazione'},
      {id:'spesa', testo:'Fai la lista della spesa necessaria', categoria:'pianificazione', vincoli:{richiede:'menu'}},
      {id:'tavola', testo:'Apparecchia la tavola', categoria:'esecuzione'},
      {id:'cottura', testo:'Metti in cottura ciò che serve più tempo', categoria:'esecuzione', vincoli:{richiede:'spesa'}}
    ]
  };
  GOALTASK_SCENARIOS.routine_mattutina = {
    chiave:'routine_mattutina', label:'Routine mattutina', budgetSecondi:900,
    regole:[],
    items:[
      {id:'igiene', testo:'Igiene personale', categoria:'cura'},
      {id:'vestiti', testo:'Vestirsi', categoria:'cura', vincoli:{richiede:'igiene'}},
      {id:'farmaco_mattutino', testo:'Prendi il farmaco del mattino', categoria:'salute'},
      {id:'colazione', testo:'Fai colazione', categoria:'pasto', vincoli:{richiede:'farmaco_mattutino'}},
      {id:'borsa', testo:'Prepara la borsa/le chiavi', categoria:'uscita', vincoli:{richiede:'colazione'}}
    ]
  };
  GOALTASK_SCENARIOS.mappa_percorsi_regolati = {
    chiave:'mappa_percorsi_regolati', label:'Percorso a tappe con regole (tipo Mappa dello zoo)', budgetSecondi:300,
    regole:['no_consecutivi_stessa_categoria'],
    items:[
      {id:'ingresso', testo:'Entra dall\'ingresso principale', categoria:'tappa'},
      {id:'zonaA', testo:'Visita la Zona A (solo se già passato dall\'ingresso)', categoria:'tappa', vincoli:{richiede:'ingresso'}},
      {id:'ristoro', testo:'Punto ristoro (non subito dopo un\'altra tappa dello stesso tipo)', categoria:'servizio'},
      {id:'zonaB', testo:'Visita la Zona B (solo dopo la Zona A)', categoria:'tappa', vincoli:{richiede:'zonaA'}},
      {id:'uscita', testo:'Torna all\'uscita (per ultima)', categoria:'tappa', vincoli:{richiede:'zonaB'}}
    ]
  };

  // ---------- Livelli di complessità per gli scenari ecologici (goaltask) ----------
  // Scala 1-5, coerente con la scala usata per la difficoltà adattiva degli
  // altri esercizi. Più variabili crescono INSIEME, gradualmente, invece di
  // un salto secco fra "facile" e "difficile":
  //  - livello 1: meno elementi, nessuna regola, budget largo o assente
  //  - livello 2: lo scenario base così com'è scritto sopra
  //  - livelli 3-5: ad ogni livello si aggiunge UN meccanismo/incremento in
  //    più rispetto al precedente (GOALTASK_PROGRESSION), il budget si
  //    stringe progressivamente (fattore 0.85 / 0.70 / 0.55), e gli
  //    incrementi restano quelli già applicati ai livelli precedenti
  //    (cumulativi, non sostitutivi) — un livello 5 contiene sempre anche
  //    gli incrementi dei livelli 3 e 4.
  export const GOALTASK_PROGRESSION = {
    sei_compiti_classico: [
      { regoleComplete:['no_versioni_consecutive_stesso_gruppo'] }, // L3: vera regola Six Elements — sostituisce no_consecutivi_stessa_categoria perché qui "categoria" e "gruppo" coincidono (altrimenti la stessa svista conterebbe doppio)
      { extraItems:[{id:'extra1', testo:'Rispondi a una domanda a sorpresa sulle due storielle già ascoltate', categoria:'racconto', gruppo:'racconto', vincoli:{richiede:'c2'}}] }, // L4: settimo elemento con dipendenza incrociata
      { budgetErroriTollerati:2 } // L5: soglia di errori tollerati — oltre, la prova è "Fallita"
    ],
    cucina_te: [
      { extraItems:[{id:'zucchero', testo:'Aggiungi zucchero, solo dopo aver tolto la bustina', categoria:'esecuzione', vincoli:{richiede:'togli'}}] }, // L3: un elemento in più, ancora senza scelta
      { extraItems:[{id:'dolcificante', testo:'Aggiungi dolcificante, solo dopo aver tolto la bustina', categoria:'esecuzione', vincoli:{richiede:'togli'}}], mutex:[['zucchero','dolcificante']] }, // L4: diventa una scelta reale (mutua esclusione)
      { budgetSecondiOverride:240 } // L5: introduce la pressione del tempo, assente nello scenario base
    ],
    farmaci_settimana: [
      { finestrePerItem:{f1:{daSec:0,aSec:100}} }, // L3: prima finestra oraria, solo sulla dose mattutina
      { finestrePerItem:{f2:{daSec:100,aSec:200}, f3:{daSec:200,aSec:300}} }, // L4: finestre anche su pomeriggio/sera
      { extraItems:[{id:'annota', testo:'Annota su un diario ogni dose presa, senza che nessuno te lo ricordi, dopo aver preso almeno 3 farmaci', categoria:'controllo', prospettica:{dopoNAzioni:3}}] } // L5: memoria prospettica nascosta
    ],
    spesa_budget: [
      { mutex:[['dolce','rivista']] }, // L3: la scelta diventa reale
      { extraItems:[{id:'formaggio', testo:'Formaggio locale, solo se avanza budget dopo frutta', categoria:'extra', vincoli:{richiede:'frutta'}}] }, // L4: un elemento condizionale in più
      { extraItems:[{id:'conto', testo:'Verifica il totale, solo dopo aver saputo il prezzo della frutta', categoria:'controllo', richiedeInfo:'prezzo_frutta'}], infoPatch:{frutta:{fornisceInfo:'prezzo_frutta'}} } // L5: integrazione informativa
    ],
    appuntamenti_giornata: [
      { finestrePerItem:{bus:{daSec:0,aSec:70}} }, // L3: prima finestra oraria (il bus delle 9)
      { finestrePerItem:{medico:{daSec:40,aSec:140}, bus2:{daSec:170,aSec:280}} }, // L4: finestre anche su appuntamento e ritorno
      { extraItems:[{id:'referto', testo:'Ritira il referto in farmacia, solo dopo aver saputo l\'orario del bus di ritorno', categoria:'commissione', vincoli:{richiede:'farmacia'}, richiedeInfo:'orario_bus_ritorno'}], infoPatch:{farmacia:{fornisceInfo:'orario_bus_ritorno'}}, budgetSecondiOverride:320 } // L5: integrazione informativa + la giornata diventa a budget (prima era senza limite)
    ],
    sicurezza_domestica: [
      { extraItems:[{id:'gas', testo:'Controlla che la valvola del gas sia chiusa, dopo il fornello', categoria:'cucina', vincoli:{richiede:'fornello'}}] }, // L3: un controllo in più, con dipendenza
      { distrattore:{alSec:35, finestraSec:40, item:{testo:'Squilla il telefono fisso — rispondi o ignora consapevolmente, poi torna al controllo della casa'}} }, // L4: interruzione a gestire
      { budgetErroriTollerati:2 } // L5: soglia di errori tollerati
    ],
    commissioni_ufficio: [
      { regoleAdd:['ingresso_unico_per_luogo'] }, // L3: vera regola Multiple Errands
      { extraItems:[{id:'ricevuta', testo:'Conserva la ricevuta della banca, solo dopo aver saputo l\'orario del mercato', categoria:'ufficio', vincoli:{richiede:'banca'}, richiedeInfo:'orario_mercato'}], infoPatch:{domanda:{fornisceInfo:'orario_mercato'}} }, // L4: integrazione informativa
      { budgetErroriTollerati:2 } // L5: soglia di errori tollerati
    ],
    organizza_evento: [
      { extraItems:[{id:'bevande', testo:'Prepara le bevande, non subito dopo un\'altra attività di esecuzione', categoria:'esecuzione'}] }, // L3: un elemento in più, ancora nella regola già attiva
      { extraItems:[{id:'controllo_forno', testo:'Controlla la cottura in forno, senza promemoria, dopo aver completato almeno 3 altre cose', categoria:'esecuzione', prospettica:{dopoNAzioni:3}}] }, // L4: memoria prospettica nascosta
      { extraItems:[{id:'dolce_evento', testo:'Dolce fatto in casa, solo se non hai già comprato il dolce pronto', categoria:'esecuzione'}, {id:'dolce_pronto', testo:'Dolce pronto in pasticceria, solo se non fai quello in casa', categoria:'esecuzione'}], mutex:[['dolce_evento','dolce_pronto']] } // L5: scelta reale in più
    ],
    routine_mattutina: [
      { extraItems:[{id:'meteo', testo:'Controlla il meteo per scegliere cosa indossare, prima di vestirsi', categoria:'cura', vincoli:{richiede:'igiene'}}] }, // L3: un elemento in più, con dipendenza
      { finestrePerItem:{borsa:{daSec:0,aSec:500}} }, // L4: finestra oraria complessiva (uscire in tempo)
      { budgetErroriTollerati:2 } // L5: soglia di errori tollerati
    ],
    mappa_percorsi_regolati: [
      { regoleAdd:['ingresso_unico_per_luogo'], luoghiPerItem:{ingresso:'ingresso', zonaA:'zonaA', ristoro:'ristoro', zonaB:'zonaB', uscita:'uscita'} }, // L3: vera regola Multiple Errands applicata al percorso
      { extraItems:[{id:'souvenir', testo:'Souvenir alla Zona A, solo se non hai già scelto il souvenir alla Zona B', categoria:'servizio', vincoli:{richiede:'zonaA'}}, {id:'souvenirB', testo:'Souvenir alla Zona B, solo se non hai già scelto il souvenir alla Zona A', categoria:'servizio', vincoli:{richiede:'zonaB'}}], mutex:[['souvenir','souvenirB']] }, // L4: scelta reale in più
      { budgetErroriTollerati:2 } // L5: soglia di errori tollerati
    ]
  };
  export const GOALTASK_BUDGET_FACTOR = {1:1.6, 2:1, 3:0.85, 4:0.70, 5:0.55};
  export function goalTaskInstanceFor(chiave, livello){
    const base = GOALTASK_SCENARIOS[chiave];
    if(!base) return null;
    livello = Math.max(1, Math.min(5, livello||2));
    if(livello===1){
      const items = base.items.slice(0, Math.max(3, base.items.length-2));
      const budgetSecondi = base.budgetSecondi ? Math.round(base.budgetSecondi*GOALTASK_BUDGET_FACTOR[1]) : null;
      return {chiave, label:base.label, livello, budgetSecondi, budgetErroriTollerati:null, regole:[], distrattore:null, items};
    }
    if(livello===2){
      return {chiave, label:base.label, livello, budgetSecondi:base.budgetSecondi, budgetErroriTollerati:null, regole:base.regole||[], distrattore:null, items:base.items};
    }
    // livelli 3-5: applica cumulativamente gli step 0..(livello-3) di
    // GOALTASK_PROGRESSION — un livello 5 include sempre anche gli step
    // già introdotti ai livelli 3 e 4, non li sostituisce.
    let items = base.items.map(it=>Object.assign({}, it));
    let regole = (base.regole||[]).slice();
    let distrattore = null, budgetErroriTollerati = null, budgetSecondi = base.budgetSecondi;
    const steps = (GOALTASK_PROGRESSION[chiave] || []).slice(0, livello-2);
    steps.forEach(step=>{
      if(step.finestrePerItem) items = items.map(it=> step.finestrePerItem[it.id] ? Object.assign({}, it, {finestra:step.finestrePerItem[it.id]}) : it);
      if(step.luoghiPerItem) items = items.map(it=> step.luoghiPerItem[it.id] ? Object.assign({}, it, {luogo:step.luoghiPerItem[it.id]}) : it);
      if(step.infoPatch) items = items.map(it=> step.infoPatch[it.id] ? Object.assign({}, it, step.infoPatch[it.id]) : it);
      if(step.extraItems) items = items.concat(step.extraItems.map(it=>Object.assign({}, it)));
      if(step.mutex){
        items = items.map(it=>{
          const pair = step.mutex.find(p=>p.indexOf(it.id)!==-1);
          if(!pair) return it;
          const partner = pair[0]===it.id ? pair[1] : pair[0];
          return Object.assign({}, it, {escludeSe: partner});
        });
      }
      if(step.regoleComplete) regole = step.regoleComplete.slice();
      else if(step.regoleAdd) regole = regole.concat(step.regoleAdd);
      if(step.distrattore) distrattore = step.distrattore;
      if(step.budgetErroriTollerati!=null) budgetErroriTollerati = step.budgetErroriTollerati;
      if(step.budgetSecondiOverride!=null) budgetSecondi = step.budgetSecondiOverride;
    });
    if(!regole.length) regole = ['no_consecutivi_stessa_categoria'];
    if(budgetSecondi) budgetSecondi = Math.round(budgetSecondi*GOALTASK_BUDGET_FACTOR[livello]);
    return {chiave, label:base.label, livello, budgetSecondi, budgetErroriTollerati, regole, distrattore, items};
  }
  // Icone (emoji, native Unicode — nessuna dipendenza esterna, coerente col
  // vincolo "single file, no CDN") per dare un riferimento visivo rapido
  // agli elementi degli scenari ecologici. Una icona di default per
  // categoria copre la maggior parte dei casi; un elemento può avere una
  // propria icona esplicita (campo `icona`) quando serve differenziarlo dal
  // resto della sua categoria.
  export const GOALTASK_CATEGORIA_ICONE = {
    prep:'🫖', esecuzione:'🍽️', cucina:'🍳', bagno:'🚿', generale:'🏠', trasporto:'🚌',
    appuntamento:'🩺', commissione:'💊', farmacoA:'💊', farmacoB:'💊', farmacoC:'💊', controllo:'✅',
    alimentari:'🥖', extra:'🎁', ufficio:'🏤', negozio:'🛍️', informazione:'❓',
    comunicazione:'📞', pianificazione:'📝', cura:'🧴', salute:'💊', pasto:'🍳', uscita:'🔑',
    tappa:'📍', servizio:'🎡', racconto:'📖', calcolo:'🧮', denominazione:'🔤', distrattore:'☎️'
  };
  export function goalTaskItemIcon(item){
    return item.icona || GOALTASK_CATEGORIA_ICONE[item.categoria] || '▫️';
  }
