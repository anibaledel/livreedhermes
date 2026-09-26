/* ============================================================
   Candidats pour la vignette « Motifs bicolores » de l'accueil — deux
   propositions à soumettre à Anibal avant de trancher (voir la demande :
   « montre-lui les deux »), pas encore posées dans assets/nav-icons/.

   Source : data/referent_bicolore_v1.json (C8·B3, la trame par défaut
   de bicolore.html) — les VRAIS motifs de la page, composés avec
   composeNiveauxMask comme la page elle-même, pas un moteur séparé
   (contrairement à l'actuel assets/nav-icons/bicolore-hover.gif, qui
   vient du moteur de fonds-ecran.html, sans rapport avec les données
   bicolores réelles).

   Couleurs : #e0261b / #f2f2f0, les teintes par défaut de bicolore.html
   lui-même (Teinte A / Teinte B au premier chargement) — rouge et blanc.

   Usage : node scripts/generate-bicolore-thumb.mjs <dossier de sortie>
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import gifenc from 'gifenc';
import { hexToBits, triangleGeometry, composeNiveauxMask, GRID, PER_CELL } from '../assets/bicolore-render.js';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = process.argv[2] || path.join(ROOT, 'thumb-candidates');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SIZE = 144;       // rendu net, réduit ensuite par le CSS si besoin
const FRAME_DELAY = 900; // ms — assez lent pour lire chaque motif, pas un défilement
const RED = '#e0261b';
const WHITE = '#f2f2f0';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bicolore_v1.json'), 'utf8'));

function drawMaskRGBA(mask, size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, size, size);
  const cellPx = size / GRID;
  const parts = GRID * GRID * PER_CELL;
  for (let i = 0; i < parts; i++) {
    if (mask[i] !== 1 && mask[i] !== '1') continue;
    const pts = triangleGeometry(i, cellPx);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = RED;
    ctx.fill();
  }
  return ctx.getImageData(0, 0, size, size).data;
}
function encodeGif(frames, size, delayMs) {
  const gif = GIFEncoder();
  for (const rgba of frames) {
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, size, size, { palette, delay: delayMs });
  }
  gif.finish();
  return Buffer.from(gif.bytes());
}
function sixLevelMask(familleKey, teinte = 'yang') {
  const niveaux = Array.from({ length: 6 }, () => ({ name: familleKey, teinte }));
  return composeNiveauxMask(data.familles, data.layers, niveaux);
}
function canvasToPng(rgba, size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  imgData.data.set(rgba);
  ctx.putImageData(imgData, 0, 0);
  return canvas.toBuffer('image/png');
}

// --- statique : l'état par défaut réel de la page (les 6 niveaux sur
// la première famille de la liste, YANG, teinte yang — sans query string). ---
const familleKeys = Object.keys(data.familles).sort((a, b) => {
  const na = a.split('+').length, nb = b.split('+').length;
  return na - nb || a.localeCompare(b);
});
const staticMask = sixLevelMask(familleKeys[0]);
fs.writeFileSync(path.join(OUT_DIR, 'static.png'), canvasToPng(drawMaskRGBA(staticMask, SIZE), SIZE));

// --- animé : huit motifs réels, du plus simple au plus composé. ---
const CYCLE = ['YANG', 'YIN', 'YANG-MUT', 'YIN-MUT', 'YANG+YANG-MUT', 'YIN+YIN-MUT', 'YIN+YANG', 'YIN+YIN-MUT+YANG+YANG-MUT'];
const frames = CYCLE.map(k => drawMaskRGBA(sixLevelMask(k), SIZE));
fs.writeFileSync(path.join(OUT_DIR, 'animated.gif'), encodeGif(frames, SIZE, FRAME_DELAY));
CYCLE.forEach((k, i) => fs.writeFileSync(path.join(OUT_DIR, `frame-${i}-${k.replace(/\+/g, '_')}.png`), canvasToPng(frames[i], SIZE)));

console.log(`Écrit dans ${OUT_DIR} : static.png, animated.gif (${CYCLE.length} images, ${FRAME_DELAY}ms chacune), ${CYCLE.length} PNG isolés.`);
