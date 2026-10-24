// Registro degli esercizi (etichette, istruzioni, domini, gruppi) e configurazione di partenza.
// SPOSTATO da index.html (passo 5h) senza modifiche al testo, con "export" davanti ai nomi usati altrove.
// Differenza dichiarata: la configurazione iniziale `let cfg = {...}` è ora la funzione defaultCfg() che
// restituisce lo stesso oggetto (stessi valori); in index.html resta `let cfg = defaultCfg();`.
// Con le etichette stanno anche STIM_LABELS, MISTA_LABELS_SHORT, CHUNKING_METODI_LABELS e i piccoli
// helper isSpokenStim, isAudioOnlyStim, stimGender che il registro usa.
import { ADAPT_GONOGO_COUNT, nbackParamsForLevel } from '../core/levels.js';
import { POOLS, seqLabel } from '../core/pools.js';
import { ANT_MATERIAL_TOKENS, STOPSIGNAL_RULES, SWITCH_RULESETS, dualDim1KeyOf, dualDim2KeyOf, pickDualDimRegime, switchRulesetFor } from '../core/rules.js';
import { categEffectiveStructure, neglectProgressivaPhase } from '../core/titration.js';
import { pickCategRegime } from './categorizzazione.js';
import { goalTaskInstanceFor } from './goaltask.js';
import { neglectRuleFor } from './neglect.js';
import { RUNNINGSPAN_LEVELS } from './runningspan.js';

  // POOLS (dati degli stimoli): vedi js/core/pools.js (passo 3b).
  export const STIM_LABELS = {lettere:'Lettere', numeri:'Numeri', simboli:'Simboli', parole:'Parole', suoni:'Suoni', colori:'Colori', lettereVoce:'Lettere pronunciate', numeriVoce:'Numeri pronunciati', paroleVoce:'Parole pronunciate', frecce:'Frecce', forma:'Forma'};
  // Stimoli uditivi puri: 'suoni' (toni) e le due varianti "voce" (lettere o
  // numeri letti dal sintetizzatore vocale, nessuna rivelazione visiva) —
  // stessa idea del canale acustico del Doppio compito, ma come tipo di
  // stimolo autonomo utilizzabile in qualunque esercizio con usesStimType.
  export function isSpokenStim(t){ return t==='lettereVoce' || t==='numeriVoce' || t==='paroleVoce'; }
  export function isAudioOnlyStim(t){ return t==='suoni' || isSpokenStim(t); }
  // "lettere"/"parole" sono femminili, gli altri materiali sono maschili —
  // serve per costruire istruzioni con l'accordo di genere corretto
  // (es. "una alla volta" vs "uno alla volta", "molte" vs "molti").
  export function stimGender(stimType){ return (stimType==='lettere' || stimType==='lettereVoce' || stimType==='parole' || stimType==='paroleVoce') ? 'f' : 'm'; }
  export const MISTA_LABELS_SHORT = {visivo:'Mista (visivo)', uditivo:'Mista (uditivo)', misto:'Mista (visivo+uditivo)'};
  export const CHUNKING_METODI_LABELS = {categoria:'Categorizzazione semantica', acronimo:'Acronimo/acrostico', narrazione:'Narrazione/concatenamento', immagine:'Immagine associativa', personale:'Personale (nota libera)'};
  export const EXERCISES = {
    nback:      {label:'N-back classico',        usesStimType:true,  usesTargetSeq:false, family:'signal',
      domini:['Memoria di lavoro','Attenzione sostenuta'],
      instructions:c=>{
        const isMista = c.nbackMista && c.nbackMista!=='no';
        const f = isMista ? false : stimGender(c.stimType)==='f';
        const verboVis = isMista ? (c.nbackMista==='visivo' ? 'Vedrai' : c.nbackMista==='uditivo' ? 'Sentirai' : 'Vedrai o sentirai') : (isAudioOnlyStim(c.stimType) ? 'Sentirai' : 'Vedrai');
        const n = nbackParamsForLevel(c.nLevel).n;
        const matLabel = isMista ? 'stimoli di tipo diverso ogni volta ('+MISTA_LABELS_SHORT[c.nbackMista].toLowerCase()+')' : STIM_LABELS[c.stimType].toLowerCase();
        return verboVis+' una serie di '+matLabel+', '+(f?'una':'uno')+' alla volta. Tocca il pulsante dorato ogni volta che '+(f?'è uguale a quella':'è uguale a quello')+' di '+n+(n===1?' posizione prima':' posizioni prima')+'. Se non lo è, non toccare nulla.';
      }},
    sequenza:   {label:'Sequenza bersaglio',      usesStimType:true,  usesTargetSeq:true,  family:'signal', screeningOnly:true,
      domini:['Memoria di lavoro','Attenzione sostenuta'],
      instructions:c=>{
        const verbo = (isAudioOnlyStim(c.stimType)&&!c.sequenzaMista) ? 'Sentirai' : 'Vedrai';
        const seqTxt = c.targetSeq.map(seqLabel).join(' → ');
        const n = c.targetSeq.length;
        return verbo+' una serie di stimoli, uno alla volta. Il tuo compito è riconoscere quando compaiono, uno subito dopo l\'altro e nell\'ordine giusto, questi '+n+': '+seqTxt+'. Appena vedi comparire l\'ultimo di questi ('+seqLabel(c.targetSeq[n-1])+'), ma solo se è arrivato subito dopo gli altri '+(n-1)+' nell\'ordine corretto, tocca il pulsante dorato. Per tutti gli altri stimoli — anche se uno di questi appare da solo, fuori sequenza, o nell\'ordine sbagliato — non toccare nulla.';
      }},
    runningspan: {label:'Running Span',           usesStimType:true,  usesTargetSeq:false, family:'span',
      domini:['Memoria di lavoro (aggiornamento sotto incertezza)'],
      // Pollack, Johnson & Knaff (1959), Journal of Experimental
      // Psychology, 57, 137-146 — origine del paradigma. A differenza
      // dell'N-back (giudizio continuo, finestra nota), qui non c'è
      // nessun giudizio durante la sequenza — solo osservare — e la
      // lunghezza totale non è mai nota in anticipo: il paziente deve
      // tenere aggiornata una finestra scorrevole senza sapere quando
      // gli verrà chiesto di richiamarla (Bunting, Cowan & Saults, 2006,
      // Quarterly Journal of Experimental Psychology, 59, 1691-1700;
      // Broadway & Engle, 2010, correlazione unica con intelligenza
      // fluida oltre span semplice/complesso).
      instructions:c=>{
        const lvl = RUNNINGSPAN_LEVELS[c.adaptStartLevel]||RUNNINGSPAN_LEVELS[1];
        const matName = {lettere:'lettere',numeri:'numeri',simboli:'simboli',colori:'colori',suoni:'suoni'}[c.stimType]||'elementi';
        const verbo = isAudioOnlyStim(c.stimType) ? 'Sentirai' : 'Vedrai';
        return verbo+' una serie di '+matName+', uno alla volta — la serie può essere più lunga o più corta, non sai mai in anticipo quando finisce. Non devi rispondere durante la serie: guarda (o ascolta) e basta. Quando la serie finisce (schermo "Ora richiama!"), dovrai indicare, **nell\'ordine esatto**, gli ultimi '+lvl.n+' '+matName+' comparsi — toccando i pulsanti sulla tastiera che compare, uno per casella, nell\'ordine in cui li ricordi. Puoi annullare l\'ultimo inserito prima di confermare.';
      }},
    gonogo:     {label:'Go/No-Go',                usesStimType:true,  usesTargetSeq:true,  family:'signal',
      domini:['Controllo inibitorio','Attenzione sostenuta'],
      instructions:c=>{
        const active = c.titrationMode && c.titrationMode!=='manuale' ? c.targetSeq.slice(0, Math.max(1,ADAPT_GONOGO_COUNT[c.adaptStartLevel]||1)) : c.targetSeq;
        const list = active.map(seqLabel).join(', ');
        return 'Tocca il pulsante ogni volta che appare uno stimolo, tranne quando appare '+(active.length>1?'uno di questi: '+list:list)+' — in quel caso non toccare nulla.';
      }},
    stopsignal: {label:'Stop-Signal',             usesStimType:true,  usesTargetSeq:false, family:'signal',
      domini:['Controllo inibitorio (motorio)'],
      // Two-choice go-task (non più rilevamento semplice): la risposta corretta
      // dipende dall'identità dello stimolo, non dalla sua sola comparsa — un
      // vero compito di discriminazione, coerente con l'assunzione del race
      // model alla base dello SSRT (Verbruggen, Aron, Band, Logan et al., 2019,
      // eLife, 8, e46323: un go-task troppo semplice rischia di violarla).
      // Conseguenza dichiarata: l'accuratezza/d′ di questa scheda restano
      // basati solo sulla presenza/assenza di risposta (confrontabili con lo
      // storico), la correttezza della scelta è tracciata a parte come nuova
      // metrica "accuratezza discriminazione (go)", non sostituisce le prime.
      instructions:c=>{
        const rule = STOPSIGNAL_RULES[c.stimType] || STOPSIGNAL_RULES.frecce;
        const matName = c.stimType==='frecce' ? 'una freccia'
          : c.stimType==='lettere' ? 'una lettera'
          : c.stimType==='numeri' ? 'un numero'
          : c.stimType==='forma' ? 'una forma'
          : 'un suono';
        const verbo = c.stimType==='suoni' ? 'Sentirai' : 'Vedrai';
        return verbo+' '+matName+' e devi rispondere il più velocemente possibile toccando "'+rule.labelA+'" o "'+rule.labelB+'", a seconda di quale delle due si applica. A volte, subito dopo, comparirà la scritta STOP: in quel caso non toccare nessuno dei due pulsanti, anche se avevi già iniziato il movimento.';
      }},
    ant:        {label:'Attenzione (tipo ANT)',   usesStimType:true,  usesTargetSeq:false, family:'choice', screeningOnly:true,
      domini:['Orienting spaziale','Controllo esecutivo/conflitto'],
      // Da questa sessione, ANT classico e TAPAT sono due esercizi distinti
      // (vedi 'tapat' più sotto). ANT classico è visivo con flanker
      // (conflitto percettivo) e cue spaziale predittivo (orienting); non
      // isola più da solo l'allerta tonica/fasica, che è materia di TAPAT.
      instructions:c=>{
        const tokens = ANT_MATERIAL_TOKENS[c.antMaterial];
        if(tokens) return 'Vedrai "'+tokens[0]+'" o "'+tokens[1]+'" al centro dello schermo, a volte circondato da altri elementi uguali o diversi. Tocca il pulsante corrispondente a quello al centro, il più velocemente possibile.';
        return 'Vedrai una freccia al centro dello schermo, a volte circondata da altre frecce. Indica la direzione della freccia centrale il più velocemente possibile, toccando il pulsante sinistra o destra.';
      }},
    tapat:      {label:'TAPAT (allerta tonica/fasica)', usesStimType:true, usesTargetSeq:false, family:'choice',
      domini:['Allerta tonica/sostenuta'],
      // Separato da ANT classico in questa sessione: non ha flanker né cue
      // spaziale predittivo, isola solo l'allerta (blocco tonico + blocco
      // fasico), con variante uditiva a panning stereo (DeGutis & Van
      // Vleet, 2010; Van Vleet & DeGutis, 2013, Cortex, per il cross-
      // training uditivo→visivo nel neglect).
      instructions:c=>{
        const isUditivo = c.tapatModalita==='uditivo';
        const matName = isUditivo ? 'il tono' : (c.stimType==='colori' ? 'il cerchio colorato' : c.stimType==='simboli' ? 'il simbolo' : 'lo stimolo');
        const verbo = isUditivo ? 'senti' : 'vedi';
        const spaziale = c.tapatSpatial
          ? (isUditivo ? ' Il tono può arrivare da sinistra o da destra invece che dal centro — ascolta con attenzione da entrambi i lati, non concentrarti su uno solo.'
            : ' Il bersaglio può comparire a sinistra o a destra invece che al centro — esplora tutto lo schermo, non fissare un punto solo.')
          : '';
        const cuffie = isUditivo ? ' Indossa cuffie, o siediti fra due casse: senza un vero audio stereo il tono si sente comunque, ma non da una direzione precisa.' : '';
        return 'Nella prima parte, gli intervalli tra uno stimolo e l\'altro sono lunghi e imprevedibili: mantieni l\'attenzione anche se sembra non succedere nulla, e tocca il pulsante appena '+verbo+' '+matName+'.'+spaziale+cuffie+' Nella seconda parte, gli intervalli sono più brevi e a volte un piccolo segnale sonoro ti avviserà poco prima — rispondi comunque il più velocemente possibile, ogni volta.';
      }},
    switching:  {label:'Task-switching',          usesStimType:false, usesTargetSeq:false, family:'choice',
      domini:['Flessibilità cognitiva','Funzioni esecutive'],
      instructions:c=>{
        if(c.switchMaterial==='bivalente'){
          const regime = c.switchRegimeSessione || pickDualDimRegime(c.switchRegime);
          const rs = switchRulesetFor(c);
          const dim1Key = dualDim1KeyOf(regime), dim2Key = dualDim2KeyOf(regime);
          const DIM1_PERCEPT = { tipo:'un carattere che può essere un numero o una lettera', forma:'una forma che può essere un cerchio o un triangolo', parita:'un numero', consvoc:'una lettera', freccia:'una freccia che può puntare in su o in giù' };
          const DIM2_PERCEPT = { colore:'scritto in bianco o in rosso', tono:'pronunciato ad alta voce, insieme a un tono grave o acuto', posizione:'a sinistra o a destra dello schermo' };
          const verbo = dim2Key==='tono' ? 'Sentirai' : 'Vedrai';
          return verbo+' '+DIM1_PERCEPT[dim1Key]+', '+DIM2_PERCEPT[dim2Key]+'. Un\'indicazione sopra ti dice quale regola seguire in quel momento: "'+rs.ruleA.label+'" oppure "'+rs.ruleB.label+'" — sono due proprietà indipendenti dello stesso stimolo, ciascuna regola ne legge solo una e ignora l\'altra. Segui sempre l\'indicazione mostrata al momento, anche se cambia da una prova all\'altra.';
        }
        const rs=SWITCH_RULESETS[c.switchMaterial]; const matFem = c.switchMaterial==='lettere';
        const matName = c.switchMaterial==='numeri'?'un numero':c.switchMaterial==='lettere'?'una lettera':c.switchMaterial==='simboli'?'un simbolo':'un colore';
        return 'Vedrai '+matName+', con accanto un\'indicazione che cambia: a volte devi classificar'+(matFem?'la':'lo')+' come "'+rs.ruleA.label+'", altre volte come "'+rs.ruleB.label+'". Segui l\'indicazione mostrata in quel momento.'; }},
    simon: {label:'Simon (conflitto spazio-risposta)', usesStimType:false, usesTargetSeq:false, family:'choice',
      domini:['Inibizione competitiva','Controllo esecutivo/conflitto'],
      // BUG REALE corretto qui: prima di questa modifica il testo era
      // fisso sulla variante "colori", anche quando cfg.simonMateriale
      // era lettere/numeri/suoni — descriveva sempre un cerchio blu o
      // verde a un paziente che stava vedendo una lettera o sentendo un
      // tono. Trovato solo ora, controllando la concordanza di genere in
      // ogni esercizio — non l'avevo aggiornato quando ho aggiunto le
      // varianti materiale a Simon.
      instructions:c=>{
        const mat = c.simonMateriale || 'colori';
        if(mat==='colori') return 'Vedrai un cerchio colorato, blu o verde, comparire a sinistra o a destra dello schermo. Tocca "Blu" se è blu, "Verde" se è verde — rispondi in base al COLORE, non alla posizione in cui compare: la posizione non conta mai per la risposta, anche se a volte può sembrare "attirare" verso il pulsante sbagliato.';
        if(mat==='suoni') return 'Sentirai un tono, grave o acuto, arrivare da sinistra o da destra (richiede cuffie o casse stereo). Tocca "Grave" o "Acuto" a seconda dell\'altezza del suono — rispondi in base al TONO, non alla direzione da cui arriva: la direzione non conta mai per la risposta, anche se a volte può sembrare "attirare" verso il pulsante sbagliato.';
        const rule = STOPSIGNAL_RULES[mat];
        const nomeSing = mat==='lettere' ? 'una lettera' : 'un numero';
        const nomeCap = mat==='lettere' ? 'LETTERA' : 'NUMERO';
        const prep = mat==='lettere' ? 'alla' : 'al';
        return 'Vedrai '+nomeSing+' comparire a sinistra o a destra dello schermo. Tocca "'+rule.labelA+'" o "'+rule.labelB+'" a seconda del tipo — rispondi in base '+prep+' '+nomeCap+', non alla posizione in cui compare: la posizione non conta mai per la risposta, anche se a volte può sembrare "attirare" verso il pulsante sbagliato.';
      }},
    categorizzazione: {label:'Categorizzazione condizionale', usesStimType:false, usesTargetSeq:false, family:'choice',
      domini:['Memoria di lavoro (capacità/complessità relazionale)'],
      instructions:c=>{
        const liv = categEffectiveStructure(c);
        const matSpoken = isSpokenStim(c.categMateriale);
        const matFem = c.categMateriale==='lettereVoce';
        const matLabel = c.categMateriale==='colori' ? 'un cerchio colorato' : c.categMateriale==='simboli' ? 'un simbolo' : c.categMateriale==='lettereVoce' ? 'una lettera pronunciata' : 'un numero pronunciato';
        const verboVis = matSpoken ? 'Sentirai' : 'Vedrai';
        if(liv===1){
          const rs = SWITCH_RULESETS[c.categMateriale].ruleA;
          return verboVis+' '+matLabel+': classifica'+(matFem?'la':'lo')+' come "'+rs.labelA+'" o "'+rs.labelB+'", toccando il pulsante corrispondente. La regola resta sempre la stessa, non cambia da una prova all\'altra.';
        }
        const regime = c.categRegimeSessione || pickCategRegime(c);
        // Descrizione del polo A/B della dim1 per ciascun regime — nome al
        // singolare + genere, serve per far concordare "bianco/bianca" ecc.
        const DIM1_DESC = {
          tipo:    { a:'una lettera', b:'un numero', femA:true, femB:false },
          forma:   { a:'un cerchio', b:'un triangolo', femA:false, femB:false },
          parita:  { a:'un numero pari', b:'un numero dispari', femA:false, femB:false },
          consvoc: { a:'una lettera vocale', b:'una lettera consonante', femA:true, femB:true },
          freccia: { a:'una freccia verso l\'alto', b:'una freccia verso il basso', femA:true, femB:true }
        };
        const dim1 = regime==='tipo_tono' ? 'tipo' : regime.split('_')[0];
        const d = DIM1_DESC[dim1];
        if(regime==='consvoc_posizione'){
          // Unico regime con dim2 = posizione, non colore/tono — struttura
          // di frase diversa dagli altri (niente aggettivo di colore da
          // far concordare, la posizione si dice a parte).
          if(liv===2) return 'Vedrai una lettera a sinistra o a destra dello schermo. Tocca "A" se è '+d.a+' a sinistra, "B" se è '+d.b+' a destra, "C" se è '+d.b+' a sinistra. Se è '+d.a+' a destra, non toccare nulla — è l\'unico caso in cui non si risponde. La posizione conta come seconda informazione qui, non come nel Simon: lì la posizione non doveva mai contare.';
          if(liv===3) return 'Vedrai una lettera a sinistra o a destra dello schermo. Tocca "A" se vedi '+d.a+' a sinistra oppure '+d.b+' a destra. Tocca "B" se vedi '+d.a+' a destra oppure '+d.b+' a sinistra.';
          return 'Vedrai una lettera a sinistra o a destra dello schermo. Tocca A per '+d.a+' a sinistra, L per '+d.a+' a destra, Z per '+d.b+' a sinistra, M per '+d.b+' a destra.';
        }
        const dim2Word = regime==='tipo_tono' ? {a:'grave',b:'acuto'} : {a:'bianco',b:'rosso'};
        const agree = (word, isFem) => isFem ? word.replace(/o$/,'a') : word;
        const dim2Name = regime==='tipo_tono' ? 'suono' : 'colore';
        // 4 combinazioni, non 2: l'aggettivo di dim2 deve concordare col
        // genere di QUALUNQUE polo di dim1 gli stia accanto in quel punto
        // della frase — 'freccia' (femminile) è quella che ha fatto
        // notare l'errore: un aggettivo lasciato al maschile di default
        // per il polo B avrebbe dato "una freccia... rosso" invece di
        // "...rossa".
        const aWithA = agree(dim2Word.a, d.femA), bWithA = agree(dim2Word.b, d.femA);
        const aWithB = agree(dim2Word.a, d.femB), bWithB = agree(dim2Word.b, d.femB);
        if(liv===2) return 'Vedrai '+d.a+' o '+d.b+', '+dim2Word.a+' o '+dim2Word.b+'. Tocca "A" se è '+d.a+' '+aWithA+', "B" se è '+d.b+' '+bWithB+', "C" se è '+d.b+' '+aWithB+'. Se è '+d.a+' '+bWithA+', non toccare nulla — è l\'unico caso in cui non si risponde.';
        if(liv===3) return 'Vedrai '+d.a+' o '+d.b+', '+dim2Word.a+' o '+dim2Word.b+'. Tocca "A" se vedi '+d.a+' '+aWithA+' oppure '+d.b+' '+bWithB+'. Tocca "B" se vedi '+d.a+' '+bWithA+' oppure '+d.b+' '+aWithB+'.';
        if(liv===4){
          const rs = SWITCH_RULESETS[c.categMateriale].ruleA;
          const matFemPlur = c.categMateriale==='lettereVoce';
          const matPlur = c.categMateriale==='colori' ? 'cerchi colorati' : c.categMateriale==='simboli' ? 'simboli' : c.categMateriale==='lettereVoce' ? 'lettere pronunciate' : 'numeri pronunciati';
          return verboVis+' una serie di '+matPlur+', '+(matFemPlur?'una':'uno')+' alla volta. '+(matFemPlur?'Ciascuna':'Ciascuno')+' appartiene alla categoria "'+rs.labelA+'" o "'+rs.labelB+'". Tocca il pulsante ogni volta che la categoria è la stessa di quella dello stimolo appena precedente.';
        }
        return 'Vedrai '+d.a+' o '+d.b+', '+dim2Word.a+' o '+dim2Word.b+'. Tocca A per '+d.a+' '+aWithA+', L per '+d.a+' '+bWithA+', Z per '+d.b+' '+aWithB+', M per '+d.b+' '+bWithB+'.';
      }},
    dualtask:   {label:'Doppio compito',          usesStimType:false, usesTargetSeq:false, family:'dual',
      domini:['Attenzione divisa','Funzioni esecutive'],
      instructions:c=>{
        const pairing = c.dualPairing || 'vis-aud';
        if(pairing==='vis-vis') return 'Vedrai due cose contemporaneamente, una a sinistra e una a destra. Tocca il pulsante di sinistra quando si ripete quella a sinistra rispetto a prima, il pulsante di destra quando si ripete quella a destra. Puoi toccare uno, l\'altro, entrambi, o nessuno — dipende da cosa si ripete.';
        if(pairing==='aud-aud') return 'Sentirai due toni contemporaneamente, uno grave e uno acuto. Tocca "tono grave" quando quello grave si ripete rispetto a prima, "tono acuto" quando si ripete l\'acuto. Puoi toccare uno, l\'altro, entrambi, o nessuno. Servono cuffie o casse stereo: il tono grave arriva da sinistra, quello acuto da destra.';
        return 'Vedrai e sentirai qualcosa insieme, ogni volta. Tocca il primo pulsante quando l\'immagine si ripete rispetto a prima, il secondo quando si ripete il suono. Puoi toccare uno, l\'altro, entrambi, o nessuno — dipende da cosa si ripete davvero.';
      }},
    neglect:    {label:'Cancellazione (neglect)',  usesStimType:true,  usesTargetSeq:true,  family:'spatial',
      domini:['Attenzione visuospaziale','Esplorazione dello spazio'],
      instructions:c=>{
        if(c.neglectMode==='intruso') return 'Sullo schermo compariranno molti simboli, alcuni ripetuti più volte, tranne uno solo: quello non ha nessun doppione da nessuna parte sulla tavola. Esplora tutto lo schermo per individuarlo, poi toccalo. Quando sei sicuro di aver esplorato tutta la tavola, tocca "Fatto".';
        if(c.neglectMode==='regola'){
          const rule = neglectRuleFor((c.stimType==='numeri'?'numeri':'lettere'), c.neglectRuleLevel, c.neglectRuleClauses);
          const fReg = stimGender(c.stimType==='numeri'?'numeri':'lettere')==='f';
          const timeNote = c.neglectTimeLimit>0 ? ' Hai un tempo limitato per guardare la tavola — quando scade (o quando tocchi "Fatto"), la tavola sparisce e ti verrà chiesto di digitare il numero.' : ' Quando sei sicuro di aver contato tutta la tavola, tocca "Fatto": la tavola sparirà e ti verrà chiesto di digitare il numero.';
          return 'Sullo schermo compariranno '+(fReg?'molte':'molti')+' '+(c.stimType==='numeri'?'numeri':'lettere')+', '+(fReg?'alcune nere e alcune rosse':'alcuni neri e alcuni rossi')+'. NON toccarli: guarda tutta la tavola e conta a mente quanti rispettano questa regola: '+rule.label+'.'+timeNote;
        }
        if(c.neglectMode==='progressiva'){
          const phase = neglectProgressivaPhase(c.neglectStartLevel);
          if(phase.mode==='intruso') return 'Questo esercizio cambia da solo compito durante la seduta. In questa fase: sullo schermo compariranno molti simboli, alcuni ripetuti più volte, tranne uno solo, senza doppioni da nessuna parte — esplora tutta la tavola per individuarlo, poi toccalo. Più avanti (in una seduta successiva) ti spiegherò il nuovo compito quando cambia.';
          if(phase.mode==='regola'){
            const rule = neglectRuleFor((c.stimType==='numeri'?'numeri':'lettere'), phase.subLevel, c.neglectRuleClauses);
            const fProg = stimGender(c.stimType==='numeri'?'numeri':'lettere')==='f';
            return 'Questo esercizio cambia da solo compito durante la seduta. In questa fase: sullo schermo compariranno '+(fProg?'molte':'molti')+' '+(c.stimType==='numeri'?'numeri':'lettere')+', '+(fProg?'alcune nere e alcune rosse':'alcuni neri e alcuni rossi')+'. NON toccarli: guarda tutta la tavola e conta a mente quanti rispettano questa regola: '+rule.label+'. Quando il tempo scade (o tocchi "Fatto"), la tavola sparirà e ti verrà chiesto di digitare il numero.';
          }
          const f2 = stimGender(c.stimType)==='f';
          return 'Questo esercizio cambia da solo compito durante la seduta. All\'inizio: sullo schermo compariranno '+(f2?'molte':'molti')+' '+STIM_LABELS[c.stimType].toLowerCase()+'. Tocca solo '+(f2?'quelle uguali':'quelli uguali')+' a: '+c.targetSeq.map(seqLabel).join(', ')+'. Più avanti ti spiegherò il nuovo compito quando cambia.';
        }
        const f = stimGender(c.stimType)==='f';
        return 'Sullo schermo compariranno '+(f?'molte':'molti')+' '+STIM_LABELS[c.stimType].toLowerCase()+'. Tocca solo '+(f?'quelle uguali':'quelli uguali')+' a: '+c.targetSeq.map(seqLabel).join(', ')+'. Ignora tutti gli altri, e vai avanti finché non li hai trovati tutti.';
      }},
    goaltask:   {label:'Scenari ecologici (pianificazione/multitasking)',      usesStimType:false, usesTargetSeq:false, family:'goaltask',
      domini:['Funzioni esecutive','Pianificazione','Multitasking'],
      instructions:c=>{
        const sc = goalTaskInstanceFor(c.goaltaskScenario, c.goaltaskLivello);
        if(!sc) return '';
        const bits = [];
        if(sc.regole.indexOf('no_consecutivi_stessa_categoria')!==-1) bits.push('evita di completare due elementi di fila della stessa categoria');
        if(sc.regole.indexOf('no_versioni_consecutive_stesso_gruppo')!==-1) bits.push('evita di fare le due metà dello stesso compito una dopo l\'altra');
        if(sc.regole.indexOf('ingresso_unico_per_luogo')!==-1) bits.push('non tornare in un luogo che hai già lasciato per andare altrove');
        if(sc.items.some(it=>it.finestra)) bits.push('alcuni elementi hanno un orario preciso: fuori da quella finestra non sono più validi');
        if(sc.items.some(it=>it.escludeSe)) bits.push('per alcune coppie di elementi puoi sceglierne solo uno: l\'altro sparirà dalla lista');
        if(sc.items.some(it=>it.richiedeInfo)) bits.push('alcuni elementi richiedono un\'informazione che devi prima raccogliere altrove nella lista');
        if(sc.items.some(it=>it.prospettica)) bits.push('un elemento comparirà più avanti, senza avviso: dovrai ricordarti di farlo da solo');
        if(sc.distrattore) bits.push('durante il compito potrebbe comparire un imprevisto da gestire entro poco tempo');
        if(sc.budgetErroriTollerati!=null) bits.push('è tollerato un numero limitato di violazioni ('+sc.budgetErroriTollerati+'): oltre quella soglia la prova è considerata fallita');
        const regoleTxt = bits.length ? ' '+bits.map(b=>b.charAt(0).toUpperCase()+b.slice(1)).join('. ')+'.' : '';
        const budgetTxt = sc.budgetSecondi ? ' Hai un tempo limitato — potrebbe non essere possibile completare tutto: gestisci le priorità.' : '';
        return 'Ti verrà mostrato un elenco di elementi da completare, uno alla volta, nell\'ordine che preferisci — rispetta però le eventuali dipendenze indicate (alcuni elementi richiedono che un altro sia già stato fatto prima).'+regoleTxt+budgetTxt+' Tocca "Completa" su ciascun elemento quando lo hai fatto (o quando l\'operatore lo segna per te).';
      }},
    memoria:    {label:'Strategie di memoria',      usesStimType:false, usesTargetSeq:false, family:'memoria',
      domini:['Memoria episodica/verbale (strategie compensative)'],
      instructions:c=>{
        if(c.memoriaModo==='chunking'){
          const metodi = (c.chunkingMetodi&&c.chunkingMetodi.length)?c.chunkingMetodi:['categoria'];
          const nomiMetodi = metodi.map(k=>CHUNKING_METODI_LABELS[k].toLowerCase()).join(' + ');
          return 'Ti verrà mostrata una lista di parole per un tempo limitato: prova a ricordarle usando questa tecnica (o queste tecniche): '+nomiMetodi+', invece di ripeterle una per una. Dopo, l\'operatore ti chiederà di richiamarle a voce e segnerà quelle corrette.';
        }
        if(c.memoriaModo==='pqrst') return 'Ti verrà mostrato (o letto) un breve testo: leggilo con attenzione, individuando le idee principali (è la tecnica PQRST — prevedi le domande, leggi, ripeti a te stesso, ripassa, verifica). Dopo, l\'operatore ti chiederà di raccontarlo a voce e segnerà le idee che hai recuperato.';
        const materiale = c.memoriaModo==='chunking' ? 'lista' : (c.memoriaMateriale||'lista');
        const cosa = materiale==='lista' ? 'ogni parola della lista' : 'ogni idea principale del brano';
        if(c.memoriaModo==='loci'){
          const percorsoTxt = c.memoriaLociTipo==='corpo' ? 'un percorso lungo il tuo corpo, dalla testa ai piedi' : c.memoriaLociTipo==='personalizzato' ? 'un percorso di luoghi reali che conosci bene' : 'un tragitto di luoghi familiari';
          return 'Percorrerai mentalmente '+percorsoTxt+' (il metodo dei loci): '+cosa+' verrà associata a una tappa del percorso, una alla volta. Immagina la scena il più vividamente possibile. Dopo, ripercorri il tragitto a mente e richiama ciò che avevi posizionato in ciascuna tappa: l\'operatore segnerà ciò che recuperi.';
        }
        if(c.memoriaModo==='errorless') return 'Ti verrà mostrata l\'informazione corretta direttamente, senza doverla indovinare — è la tecnica dell\'apprendimento senza errori. Poco dopo, l\'operatore ti chiederà di richiamarla: se ci riesci, il tempo prima del prossimo richiamo si allunga; se non ci riesci, ti verrà ridata subito la risposta corretta, senza insistere su un tentativo libero. Si procede così, un elemento alla volta.';
        if(c.memoriaModo==='vanishing') return 'Per '+(materiale==='lista'?'ogni parola':'ogni idea')+' vedrai prima un forte suggerimento (quasi tutta l\'informazione), poi uno più debole: prova a completarla tu prima che sparisca del tutto. È la tecnica dei "vanishing cues". Alla fine, un richiamo libero senza alcun suggerimento.';
        return '';
      }},
    mantenimento: {label:'Mantenimento (tipo Sternberg)', usesStimType:false, usesTargetSeq:false, family:'choice', screeningOnly:true,
      domini:['Mantenimento in memoria a breve termine'],
      instructions:c=>{
        const matLabel = c.mantenimentoMateriale==='numeri' ? 'numeri' : c.mantenimentoMateriale==='simboli' ? 'simboli' : 'lettere';
        const singLabel = c.mantenimentoMateriale==='numeri' ? 'un solo numero' : c.mantenimentoMateriale==='simboli' ? 'un solo simbolo' : 'una sola lettera';
        if(c.mantenimentoModalita==='seriale'){
          return 'Vedrai un piccolo gruppo di '+matLabel+' mostrati uno alla volta all\'inizio: prova a ricordarli tutti — resteranno gli stessi per tutto l\'esercizio. Dopo, vedrai tanti '+matLabel+' singoli, uno alla volta: per ciascuno chiediti "questo era nel gruppo iniziale?" e tocca "Sì, c\'era" se sì, "No, non c\'era" se no.';
        }
        return 'Vedrai un piccolo gruppo di '+matLabel+' mostrati uno alla volta: prova a ricordarli tutti. Subito dopo vedrai '+singLabel+': chiediti "questo era nel gruppo che ho appena visto?" e tocca "Sì, c\'era" se sì, "No, non c\'era" se no. Il gruppo cambia a ogni prova.';
      }},
  };
  // Ordine di presentazione degli esercizi nei selettori, raggruppato per
  // vicinanza di costrutto invece che per ordine storico di sviluppo (era
  // Object.keys(EXERCISES), cioè l'ordine in cui sono stati scritti nel
  // codice — nessun significato clinico). Struttura separata apposta:
  // EXERCISES resta la fonte dei dati, questa è solo l'ordine con cui
  // vengono mostrati — così un domani riordinare la vetrina non richiede
  // spostare blocchi di codice dentro EXERCISES, solo questa lista.
  export const EXERCISE_GROUPS = [
    {label:'Attenzione e inibizione', keys:['gonogo','stopsignal','ant','tapat','simon']},
    // Memoria di lavoro e mantenimento include qui anche la Categorizzazione
    // condizionale: la teoria della complessità relazionale (Halford, Wilson
    // & Phillips, 1998) la inquadra esplicitamente come un limite di
    // CAPACITÀ della memoria di lavoro (quante relazioni si processano in
    // parallelo), non come un dominio di "ragionamento" a sé — più vicina
    // concettualmente a N-back/Mantenimento di quanto sembrasse a prima
    // vista, pur misurando qualcosa di diverso da entrambi (integrazione
    // relazionale sotto una regola fissa, non aggiornamento continuo né
    // mantenimento passivo).
    {label:'Memoria di lavoro e mantenimento', keys:['nback','sequenza','mantenimento','categorizzazione','runningspan']},
    {label:'Flessibilità cognitiva', keys:['switching']},
    {label:'Esplorazione visuospaziale', keys:['neglect']},
    {label:'Attenzione divisa e multitasking', keys:['dualtask','goaltask']},
    {label:'Memoria strategica', keys:['memoria']}
  ];
  export function defaultCfg(){
    return {
    stimType:'lettere', nLevel:5, isi:2200, stimDuration:600, trials:24,
    targetRate:0.32, respMode:'paziente', voice:false, patientCode:'', notes:'',
    taskMode:'nback', targetSeq: POOLS.lettere.slice(0,3),
    mantenimentoModalita:'riconoscimento', mantenimentoMateriale:'lettere', // solo per Mantenimento (tipo Sternberg)
    ssd:250, ssdStep:50, // solo per Stop-Signal
    stopsignalInterferenza:'no', // 'no'|'si' — quarto gradino della scala gerarchica Vigilanza/Inibizione proposta (TAPAT tonico → Go/No-Go → Stop-Signal → Stop-Signal+conflitto): sovrappone un conflitto spaziale tipo Simon (posizione irrilevante) allo stimolo "go", mantenendo intatto il meccanismo core (2 scelte + stop occasionale + staircase SSD) — non sostituisce Simon, misura una cosa diversa (conflitto SOTTO pressione di dover trattenere una risposta, non conflitto da solo)
    adaptive:false, // derivato da titrationMode==='adattivo' — tenuto per compatibilità con tutto il codice di titolazione live (maybeAdapt, ADAPT_ISI, ecc.), va sempre aggiornato insieme a titrationMode, mai impostato da solo
    // Modello triplice di titolazione (solo per i 7 esercizi con livello
    // condiviso: N-back, Go/No-Go, Task-switching, Sequenza bersaglio,
    // Stop-Signal, ANT classico, Simon — vedi TITRATION_EXERCISES):
    // 'manuale'  — ogni parametro è editabile a mano, indipendente dal livello
    // 'livello'  — lo stepper "Livello" pilota tutti i parametri collegati
    //              (tabelle ADAPT_*), che restano fissi per l'intera seduta
    // 'adattivo' — come 'livello', ma il livello stesso si muove da solo
    //              seduta per seduta in base alla regola 70-85%/8 prove
    // Il cambio è libero FRA sedute (dal profilo/Gestisci programma), mai
    // dentro una sessione in corso (il pulsante vive solo in Setup/profilo,
    // non nella schermata di task).
    titrationMode:'manuale',
    switchMaterial:'numeri', // solo per Task-switching
    simonCongruenza:'bilanciato', // solo per Simon — 'bilanciato'|'prevalenza_congruente'|'prevalenza_incongruente', parametro clinico fisso per sessione, non una leva di titolazione (vedi ADAPT_ISI.simon per la vera leva adattiva)
    simonMateriale:'colori', // 'colori'|'lettere'|'numeri'|'suoni' — stessa dimensione rilevante di sempre (classificare in base all'identità), cambia solo il canale percettivo; con 'suoni' la posizione irrilevante non è più a schermo ma nel panning stereo del tono (richiede cuffie/casse stereo, vedi Setup)
    antMode:'classico', antMaterial:'frecce', // antMode: legacy, letto solo per riconoscere sessioni salvate prima della separazione ANT/TAPAT (mai scritto da sessioni nuove); materiale: 'frecce' | 'lettere' | 'simboli' — solo ANT classico
    showTrail:true, // mostra i pallini di esito prova-per-prova durante la sessione
    numDigits:1, wordComplexity:'breve', // solo per stimolo "numeri"/"parole"
    tapatStartLevel:3, adaptStartLevel:3, neglectStartLevel:3, // livello di partenza, aggiornato dopo ogni sessione adattiva
    tapatIsiMin:900, tapatIsiMax:1800, // blocco tonico del TAPAT, SOLO in modalità Manuale — coincide col range del livello 1 (TAPAT_LEVELS[1]) come punto di partenza ragionevole
    tapatSpatial:false, tapatGradient:50, // componente spaziale del TAPAT (specifica per il neglect)
    tapatModalita:'visivo', // 'visivo' | 'uditivo' — variante del tutto acustica del TAPAT (DeGutis & Van Vleet 2010; precedente di cross-training uditivo→visivo nel neglect: Van Vleet & DeGutis 2013, Cortex). In 'uditivo' il bersaglio è un tono dedicato, non lo stimolo visivo — niente accompagnamento visivo, nemmeno per il cue fasico, altrimenti il canale non sarebbe davvero solo uditivo.
    dualVisual:'lettere', dualVisual2:'numeri', dualPairing:'vis-aud', dualStartLevel1:3, dualStartLevel2:3, // solo per Doppio compito
    neglectGradient:50, neglectLayout:'griglia', neglectTimeLimit:60, neglectBoardSize:40, // solo per Cancellazione — gradiente 0=tutto a destra, 100=tutto a sinistra, 50=simmetrico
    neglectMode:'classico', neglectRuleLevel:1, // 'classico' (bersagli noti), 'intruso' (l'unico elemento senza doppione), 'regola' (regola composta crescente 1-10, unificata con la scala di dimensione tavola)
    neglectBottomUp:'auto', // solo per 'classico' — 'auto' (pulsazione bottom-up sul lato debole, solo ai livelli bassi e solo se emerge un'asimmetria nella tavola) oppure 'off' (mai, consigliato nelle sessioni di rivalutazione per non falsare la misura)
    neglectAlphabet:'auto', // solo per 'intruso' — 'auto' (progressione per livello) oppure famiglia forzata: 'latino_cirillico'|'greco'|'armeno'
    neglectRuleClauses:null, // solo per 'regola' — null=progressione automatica cumulativa per livello; altrimenti array di chiavi scelte manualmente fra 'base','colore','riga','sfondo'
    goaltaskScenario:'sei_compiti_classico', goaltaskLivello:2, // solo per Scenari ecologici (1-5, crescente)
    memoriaModo:'pqrst', memoriaLivello:1, memoriaMateriale:'lista', // solo per Strategie di memoria — memoriaMateriale usato solo da loci/errorless/vanishing (pqrst è sempre brano, chunking è sempre lista)
    memoriaFormaIdx:0, // solo per pqrst/chunking, solo sui livelli con forme parallele (1-2 al momento) — quale forma (A/B/C...) usare in questa sessione; scelta sempre manuale dall'operatore, mai casuale, per poter pilotare baseline/intermedia/finale nel confronto RCI
    memoriaLociTipo:'casa', memoriaLociCustom:'', // solo per loci — 'casa'|'corpo'|'personalizzato' (tappe reali digitate dall'operatore, una per riga)
    chunkingMetodi:['categoria'], chunkingNota:'', // solo per chunking — array di chiavi fra 'categoria','acronimo','narrazione','immagine','personale' (max 1 sotto liv.11, max 2 da liv.11); chunkingNota usata solo se 'personale' è selezionato
    categLivello:1, categMateriale:'simboli', // solo per Categorizzazione condizionale — livello 1-10 (banda doppia delle 5 strutture, struttura fissa dentro ogni banda, non adattivo); categMateriale usato solo alle strutture 1 e 4 ('simboli'|'lettereVoce'|'numeriVoce' — 'colori' rimosso dalla selezione, la sua unica regola era Caldo/Freddo, troppo arbitraria; resta leggibile nello storico di sedute già registrate)
    categRegime:'random', switchRegime:'random', // 'random'|'tipo_colore'|'forma_colore'|'parita_colore'|'consvoc_posizione'|'freccia_colore'|'tipo_tono' — Categorizzazione strutture 2/3/5 e Task-switching bivalente condividono lo stesso motore a doppia dimensione (DUAL_DIM_ROTATION); 'tipo_tono' è escluso dalla rotazione casuale, resta selezionabile a mano
    categStructManual:1, // solo in modalità Manuale: struttura (1-5) scelta liberamente dal clinico, indipendente da categLivello — vedi categEffectiveStructure()
    zoneGrandi:false, // accessibilità: zone di risposta molto più grandi (metà schermo per 2 risposte) invece di pulsanti piccoli — utile su tablet/smartphone per bassa vista
    inputDevice:'touch', // 'touch' | 'tastiera' — dichiarato dall'operatore prima di iniziare, usato solo per decidere COSA evidenziare (badge dei tasti sui pulsanti, promemoria nelle istruzioni), la tastiera funziona comunque sempre in background indipendentemente da questa scelta
    keyLayout:'standard', // 'standard' (A/L, A/L/Z/M) | 'ravvicinata' (B/N, V/B/N/M — tasti adiacenti sulla riga inferiore della tastiera, per chi può usare solo una mano)
    sequenzaMista:'no', // solo per Sequenza bersaglio: 'no'|'visivo'|'uditivo'|'misto' — mescola codici diversi nella stessa sequenza invece di un solo tipo
    nbackMista:'no', // solo per N-back: stesso principio, materiale che cambia tipo prova per prova invece di restare fisso
    gonogoMista:'no', // solo per Go/No-Go: stesso principio — il/i bersaglio/i no-go possono essere di tipi diversi fra loro, non solo lo stesso cfg.stimType
    };
  }
