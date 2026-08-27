'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const { el } = require('./lib/dom-stub');
const REPO_ROOT = path.join(__dirname, '..');

// renderCueNode legge `cfg` come variabile libera (chiusa nella IIFE
// dell'app) — stesso pattern di buildStopSignal, stesso trattamento: uno
// stub condiviso, mutato prima di ogni chiamata.
const cfgStub = {};
const mod = loadPure(REPO_ROOT, [
  { name: 'renderCueNode', start: '  function renderCueNode(trial){', end: "el('div',{style:'color:'+color+'; font-size:28px;'},[glyph])\n    ]);\n  }" }
], ['renderCueNode'], { cfg: cfgStub, el });

const { renderCueNode } = mod;

module.exports = function run(t) {
  t.group('ANT classico — il cue mostra SOLO il cue, mai il bersaglio insieme (bug corretto)', () => {
    Object.assign(cfgStub, { taskMode: 'ant', antMode: 'classico' });
    t.eq(renderCueNode({ cueType: 'center' }).text, '✦', 'cue centrale: solo l\'asterisco di allerta');
    t.eq(renderCueNode({ cueType: 'spatial', side: 'left' }).text, '◀', 'cue spaziale sinistro: solo la freccia, nessun bersaglio/flanker');
    t.eq(renderCueNode({ cueType: 'spatial', side: 'right' }).text, '▶', 'cue spaziale destro: solo la freccia');
  });

  t.group('TAPAT — il cue è coerente con la modalità (visivo vs uditivo)', () => {
    Object.assign(cfgStub, { taskMode: 'ant', antMode: 'tapat', tapatModalita: 'visivo' });
    t.eq(renderCueNode({ cueType: 'center' }).text, '✦', 'TAPAT visivo: asterisco centrale, non lateralizzato per costruzione');
    Object.assign(cfgStub, { taskMode: 'ant', antMode: 'tapat', tapatModalita: 'uditivo' });
    t.ok(renderCueNode({ cueType: 'center' }).text.includes('Ascolta'), 'TAPAT uditivo: nessun elemento visivo del cue, solo il placeholder "Ascolta" (il cue vero è il tono, gestito da presentCue)');
  });
};
