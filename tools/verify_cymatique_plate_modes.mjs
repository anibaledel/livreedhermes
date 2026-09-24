/* ============================================================
   Vérifie, au triangle près, la correspondance entre motif bicolore et
   mode de plaque annoncée sur cymatique.html — sur le modèle de
   tools/verify_bicolore_axes_yang_t2.mjs.

   La loi (pas une convention) : pour une plaque simplement appuyée, les
   fréquences propres sont proportionnelles à m² + n². f = 128·k² en est
   la mesure, sa constante plaçant le mode fondamental (2,2) à 256 Hz (le
   do de l'accord scientifique). k, mesuré par assets/bicolore-k2.mjs
   (FFT 2D, même méthode que tools/measure_k_pic.py), compte les périodes
   complètes sur les 12 cases — pour un mode sin(mπx/12), k = m/2, d'où
   k² = (m²+n²)/4 pour un couple (m,n) égal ; f = 128·k² place donc
   (2,2) [k²=2] à 256 Hz et (4,4) [k²=8] à 1024 Hz.

   Chaque correspondance : le motif engendré (assets/bicolore-axes.js)
   comparé, triangle par triangle, au signe de l'eigenfonction du mode
   de plaque annoncé — bords fixes : sin(mπx/12)·sin(nπy/12) (nul au
   bord) ; bords libres : cos(mπx/12)·cos(nπy/12) (ventre au bord).
   N'affiche que ce qui donne 0 écart — sinon le script s'arrête.

   Usage : node tools/verify_cymatique_plate_modes.mjs
   ============================================================ */
import { GRID, PER_CELL } from '../assets/bicolore-render.js';
import { sectorPoint, parityBit } from '../assets/bicolore-axes.js';
import { k2Of } from '../assets/bicolore-k2.mjs';

const PARTS = GRID * GRID * PER_CELL;

function orthoAxesRaw(list, polarity) {
  const t = new Set();
  for (const e of list) { t.add(6 - e); t.add(6 + e); }
  return { type: 'ortho', t: [...t], polarity };
}
function generate(axes) {
  const m = new Uint8Array(PARTS);
  for (let gi = 0; gi < PARTS; gi++) { const [x, y] = sectorPoint(gi); m[gi] = parityBit(axes, x, y); }
  return m;
}

// Les trois correspondances établies, avec la polarité qui vérifie
// (trouvée par le script lui-même, pas supposée) et la loi f = 128·k².
const CASES = [
  {
    label: 'écart 0 (Yin, T0)',
    axes: orthoAxesRaw([0], 'direct'),
    mode: [2, 2], edge: 'fixe',
    eigen: (x, y) => Math.sin(2 * Math.PI * x / 12) * Math.sin(2 * Math.PI * y / 12),
    darkWhenNegative: true,
  },
  {
    label: 'écarts 0 et 3 (Yin, génération reconstituée)',
    axes: orthoAxesRaw([0, 3], 'direct'),
    mode: [4, 4], edge: 'fixe',
    eigen: (x, y) => Math.sin(4 * Math.PI * x / 12) * Math.sin(4 * Math.PI * y / 12),
    darkWhenNegative: true,
  },
  {
    label: 'écarts 1,5 et 4,5 (Yin mutant, génération reconstituée)',
    axes: orthoAxesRaw([1.5, 4.5], 'inverse'),
    mode: [4, 4], edge: 'libre',
    eigen: (x, y) => Math.cos(4 * Math.PI * x / 12) * Math.cos(4 * Math.PI * y / 12),
    darkWhenNegative: false,
  },
];

let allOk = true;
for (const c of CASES) {
  const mask = generate(c.axes);
  let mism = 0;
  for (let gi = 0; gi < PARTS; gi++) {
    const [x, y] = sectorPoint(gi);
    const negative = c.eigen(x, y) < 0;
    const dark = c.darkWhenNegative ? negative : !negative;
    if ((dark ? 1 : 0) !== mask[gi]) mism++;
  }
  const k2 = k2Of(mask);
  const f = 128 * k2;
  const status = mism === 0 ? 'OK' : 'ÉCART';
  console.log(`${c.label.padEnd(42)} mode (${c.mode[0]},${c.mode[1]}) bords ${c.edge.padEnd(5)} `
    + `k²=${k2} f=${f} Hz  ${status}  ${mism} écart(s) / ${PARTS}`);
  if (mism !== 0) allOk = false;
}

console.log(allOk
  ? '\nLes trois correspondances vérifiées, 0 écart chacune — la page peut les citer.'
  : '\nDES ÉCARTS SUBSISTENT — ne pas afficher tant que ce n\'est pas 0.');
process.exit(allOk ? 0 : 1);
