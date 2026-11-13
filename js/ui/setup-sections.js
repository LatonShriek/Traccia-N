// Schermata Setup a sezioni espandibili. NUOVO codice: la schermata era un'unica scheda lunga, con la
// partenza della sessione in fondo. Qui vive tutto quello che serve a raggrupparla, senza toccare i campi:
//  - sectionMarker()/sectionEnd(): segnaposto invisibili che ScreenSetup mette nella scheda per dire
//    "da qui comincia la sezione X". Più segnaposto con la stessa chiave vanno nella stessa sezione.
//  - groupSections(card): sostituisce i segnaposto con sezioni <details> native (tastiera e lettori di schermo
//    funzionano da soli). Una sezione senza contenuto sparisce.
//  - collapseLongHints(root): i paragrafi di spiegazione lunghi diventano un "ⓘ" da aprire. Gli avvisi
//    (testo con colore di allerta) restano sempre visibili.
//  - lo stato aperto/chiuso scelto dall'operatore si ricorda (la schermata si ridisegna a ogni tocco).
// La parte che decide (planSections, shouldCollapseHint, shortLabel, isSectionOpen) è pura e testata.

const STORE_KEY = 'traccian.setupSections';
let saved = null;

function loadSaved(){
  if(saved) return saved;
  saved = {};
  try{
    const raw = localStorage.getItem(STORE_KEY);
    const obj = raw ? JSON.parse(raw) : null;
    if(obj && typeof obj === 'object') saved = obj;
  }catch(e){ saved = {}; }
  return saved;
}
function persist(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(saved || {})); }catch(e){ /* storage non disponibile: lo stato vale solo finché la pagina resta aperta */ }
}
// Solo per i test: dimentica la copia in memoria, così si rilegge dallo storage.
export function _resetSectionState(){ saved = null; }

// Aperta o chiusa? Vince la scelta fatta a mano dall'operatore; altrimenti l'impostazione di partenza.
export function isSectionOpen(key, defaultOpen){
  const s = loadSaved();
  return typeof s[key] === 'boolean' ? s[key] : !!defaultOpen;
}
export function rememberSection(key, open){
  loadSaved()[key] = !!open;
  persist();
}

// Etichetta corta per il "ⓘ": le prime parole del testo, tagliate a fine parola.
export function shortLabel(text, max){
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if(t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.5 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-–—(]+$/, '') + '…';
}

// Un paragrafo di spiegazione va dietro il "ⓘ" solo se è lungo e non è un avviso.
export function shouldCollapseHint(text, style, minLen){
  const t = String(text || '').trim();
  if(t.length <= (minLen == null ? 150 : minLen)) return false;
  if(/alert/.test(String(style || ''))) return false;
  return true;
}

// Riepilogo di una riga per la sezione chiusa: le parti vuote si saltano.
export function joinSummary(parts){
  return (parts || []).filter(p => p != null && p !== '' && p !== false).join(' · ');
}

// Piano della scheda. `entries` è l'elenco ordinato dei figli: {marker:{...}} oppure {item}.
// Risultato: elenco ordinato di {item} (fuori da ogni sezione) e {section:true, key, title, summary,
// defaultOpen, forceOpen, warn, items}. La sezione compare dove appare il suo primo segnaposto.
export function planSections(entries){
  const out = [], byKey = {};
  let cur = null;
  for(const e of entries){
    if(e.marker){
      const m = e.marker;
      if(m.end){ cur = null; continue; }
      let sec = byKey[m.key];
      if(!sec){
        sec = byKey[m.key] = { section:true, key:m.key, title:m.title || m.key, summary:m.summary || '', defaultOpen:!!m.defaultOpen, forceOpen:!!m.forceOpen, warn:!!m.warn, items:[] };
        out.push(sec);
      } else {
        if(m.summary) sec.summary = m.summary;
        if(m.forceOpen) sec.forceOpen = true;
        if(m.warn) sec.warn = true;
      }
      cur = sec;
    } else if(cur){
      cur.items.push(e.item);
    } else {
      out.push({ item:e.item });
    }
  }
  return out;
}

// ---- parte DOM (solo browser) ----

export function sectionMarker(key, title, opts){
  const o = opts || {};
  const d = document.createElement('div');
  d.hidden = true;
  d.setAttribute('data-sec-key', key);
  d.setAttribute('data-sec-title', title || key);
  d.setAttribute('data-sec-summary', o.summary || '');
  if(o.open) d.setAttribute('data-sec-open', '1');
  if(o.force) d.setAttribute('data-sec-force', '1');
  if(o.warn) d.setAttribute('data-sec-warn', '1');
  return d;
}
export function sectionEnd(){
  const d = document.createElement('div');
  d.hidden = true;
  d.setAttribute('data-sec-end', '1');
  return d;
}

function readMarker(node){
  if(node.hasAttribute('data-sec-end')) return { end:true };
  return {
    key: node.getAttribute('data-sec-key'),
    title: node.getAttribute('data-sec-title'),
    summary: node.getAttribute('data-sec-summary') || '',
    defaultOpen: node.hasAttribute('data-sec-open'),
    forceOpen: node.hasAttribute('data-sec-force'),
    warn: node.hasAttribute('data-sec-warn')
  };
}
function isMarkerNode(node){
  return node.nodeType === 1 && (node.hasAttribute('data-sec-key') || node.hasAttribute('data-sec-end'));
}

function buildSection(sec){
  const det = document.createElement('details');
  det.className = 'setup-sec';
  det.setAttribute('data-sec', sec.key);
  const sum = document.createElement('summary');
  sum.className = 'setup-sec-sum';
  const t = document.createElement('span');
  t.className = 'setup-sec-t';
  t.textContent = sec.title;
  const s = document.createElement('span');
  s.className = 'setup-sec-s' + (sec.warn ? ' warn' : '');
  s.textContent = sec.summary;
  sum.appendChild(t); sum.appendChild(s);
  const body = document.createElement('div');
  body.className = 'setup-sec-body';
  sec.items.forEach(n => body.appendChild(n));
  det.appendChild(sum); det.appendChild(body);
  det.open = sec.forceOpen || isSectionOpen(sec.key, sec.defaultOpen);
  // L'evento "toggle" scatta anche per l'apertura iniziale: lo si ignora finché lo stato non cambia davvero,
  // altrimenti un'apertura forzata verrebbe scambiata per una scelta dell'operatore.
  let last = det.open;
  det.addEventListener('toggle', () => {
    if(det.open === last) return;
    last = det.open;
    rememberSection(sec.key, det.open);
  });
  return det;
}

// Sostituisce i segnaposto con sezioni vere. Chiamare a scheda finita, prima di inserirla nella pagina.
export function groupSections(card){
  const kids = Array.from(card.childNodes);
  const entries = kids.map(k => isMarkerNode(k) ? { marker: readMarker(k) } : { item: k });
  const plan = planSections(entries);
  const frag = document.createDocumentFragment();
  plan.forEach(p => {
    if(p.section){ if(p.items.length) frag.appendChild(buildSection(p)); }
    else frag.appendChild(p.item);
  });
  while(card.firstChild) card.removeChild(card.firstChild); // restano solo i segnaposto, ormai inutili
  card.appendChild(frag);
}

// I paragrafi .hint lunghi diventano "ⓘ ..." da aprire. Un avviso (stile di allerta) resta sempre visibile.
export function collapseLongHints(root, minLen){
  const list = Array.from(root.querySelectorAll('p.hint'));
  list.forEach(p => {
    if(p.closest('details.setup-info')) return;
    if(!shouldCollapseHint(p.textContent, p.getAttribute('style'), minLen)) return;
    const det = document.createElement('details');
    det.className = 'setup-info';
    if(p.style && p.style.gridColumn) det.style.gridColumn = p.style.gridColumn; // dentro .grid occupa tutta la riga come prima
    const sum = document.createElement('summary');
    sum.textContent = 'ⓘ ' + shortLabel(p.textContent, 64);
    p.parentNode.replaceChild(det, p);
    det.appendChild(sum);
    det.appendChild(p);
  });
}
