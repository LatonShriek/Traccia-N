'use strict';
const path = require('path');
const { loadPure } = require('./lib/extract-source');
const REPO_ROOT = path.join(__dirname, '..');

const mod = loadPure(REPO_ROOT, [
  { name: 'MOTOR_CONSTS', start: '  const MOTOR_TARGET_RADIUS = 34;', end: '  };' },
  { name: 'motorDistancePx', start: '  function motorDistancePx(clientX, clientY, containerRect, targetXPercent, targetYPercent){', end: "    return Math.sqrt(dxPx*dxPx+dyPx*dyPx);\n  }" },
  { name: 'motorSummaryStats', start: '  function motorSummaryStats(taps, targetRadius){', end: "    return { meanDistPx, meanDistRel, meanRT, cvRT };\n  }" }
], ['MOTOR_TARGET_RADIUS', 'MOTOR_TRIALS', 'MOTOR_TARGET_SETS', 'motorDistancePx', 'motorSummaryStats']);

const { MOTOR_TARGET_RADIUS, MOTOR_TRIALS, MOTOR_TARGET_SETS, motorDistancePx, motorSummaryStats } = mod;

module.exports = function run(t) {
  t.group('Controllo motorio — costanti', () => {
    t.eq(MOTOR_TRIALS, 6, 'il controllo dura 6 bersagli');
    t.eq(MOTOR_TARGET_RADIUS, 34, 'raggio del bersaglio in px');
    ['smartphone', 'tablet', 'computer'].forEach(dev => {
      t.ok(Array.isArray(MOTOR_TARGET_SETS[dev]), 'set di posizioni definito per: ' + dev);
      t.eq(MOTOR_TARGET_SETS[dev].length, 6, 'posizioni sufficienti per tutti i bersagli: ' + dev);
    });
    // Smartphone: nessuna posizione nel quarto superiore dello schermo
    // (y<40) — zona raggiungibile col pollice, non l'intero schermo.
    MOTOR_TARGET_SETS.smartphone.forEach(([x, y]) => {
      t.ok(y >= 40, 'smartphone: bersaglio nella metà inferiore (y=' + y + ')');
    });
  });

  t.group('Controllo motorio — motorDistancePx (geometria pura)', () => {
    const rect = { left: 0, top: 0, width: 1000, height: 1000 };
    // Tocco esattamente al centro del bersaglio (50%,50%) → distanza 0
    t.eq(motorDistancePx(500, 500, rect, 50, 50), 0, 'tocco esatto sul centro → distanza zero');
    // Tocco 100px a destra del centro (target a x=50%=500px, tocco a 600px, stesso y) → distanza 100
    t.eq(motorDistancePx(600, 500, rect, 50, 50), 100, 'tocco 100px a destra del centro → distanza 100');
    // Tocco in diagonale: 30px a destra e 40px sotto → distanza 50 (triangolo 3-4-5)
    t.eq(motorDistancePx(530, 540, rect, 50, 50), 50, 'tocco in diagonale (30,40) → distanza 50 (3-4-5)');
    // Container non quadrato: la conversione da % a px deve usare la
    // dimensione corretta per ciascun asse, non una sola diagonale.
    const wideRect = { left: 0, top: 0, width: 2000, height: 500 };
    t.eq(motorDistancePx(1200, 250, wideRect, 50, 50), 200, 'container non quadrato: dx convertito con la larghezza, non con l\'altezza');
  });

  t.group('Controllo motorio — motorSummaryStats', () => {
    const taps = [
      { distancePx: 10, rtMs: 400 },
      { distancePx: 20, rtMs: 600 },
      { distancePx: 30, rtMs: 800 }
    ];
    const s = motorSummaryStats(taps, 20);
    t.eq(s.meanDistPx, 20, 'distanza media in px');
    t.eq(s.meanDistRel, 1, 'distanza media relativa al raggio (20px di media / 20px di raggio = 1×)');
    t.eq(s.meanRT, 600, 'RT medio');
    t.ok(s.cvRT > 0, 'CV del RT calcolato quando ci sono almeno 2 tocchi con RT valido');

    const oneTap = [{ distancePx: 15, rtMs: 300 }];
    const s1 = motorSummaryStats(oneTap, 20);
    t.eq(s1.cvRT, null, 'CV non calcolabile con un solo tocco (serve una deviazione standard)');

    const noRt = [{ distancePx: 10, rtMs: null }, { distancePx: 20, rtMs: null }];
    const s2 = motorSummaryStats(noRt, 20);
    t.eq(s2.meanRT, null, 'RT medio nullo se nessun tocco ha un RT valido');
    t.eq(s2.meanDistPx, 15, 'la distanza si calcola comunque anche senza RT validi');
  });
};
