/* ============================================================
   Extracteur C16 : lit une planche coloriée en cellule C16 (2304
   triangles, 16 par case) par CLASSIFICATION du centroïde de chaque
   forme dessinée — pas par appariement à un point canonique, qui se
   confond à cette finesse (constaté par Anibal).

   Méthode (donnée par Anibal, vérifiée par le round-trip C8<->C16,
   voir _scratch_c16_roundtrip.mjs — 0 écart) :
     1. centroïde (x,y) en coordonnées de CASE (0..1) ;
     2. sous-carré : ouest si x<½, est sinon ; nord si y<½, sud sinon ;
     3. dans le sous-carré, angle depuis son centre local (à un quart
        de case de chaque bord), secteur à partir du haut, sens
        horaire, comme C8.

   Usage : node tools/extract_exemples_plate_c16.mjs "<chemin.svg>"
   Sort un JSON { colorOf: [2304], counts, unresolved }.
   ============================================================ */
import fs from 'node:fs';
import { localIndexC16, globalIndexC16 } from '../assets/bicolore-c16-classify.mjs';

const [, , svgPath] = process.argv;
if (!svgPath) { console.error('usage: node tools/extract_exemples_plate_c16.mjs <svg>'); process.exit(1); }

const src = fs.readFileSync(svgPath, 'utf8');
const GRID = 12, PARTS = GRID * GRID * 16;

const classColor = {};
for (const m of src.matchAll(/\.(cls-\d+)\s*\{[^}]*fill:\s*(#[0-9a-fA-F]{3,6})/g)) classColor[m[1]] = m[2].toLowerCase();

const PX_PER_UNIT = 31.16, ORIGIN = 1.5;
function toUnit(px) { return (px - ORIGIN) / PX_PER_UNIT; }

function centroidOfPoints(pts) {
  let sx = 0, sy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; }
  return [sx / pts.length, sy / pts.length];
}

const colorOf = new Array(PARTS).fill(null);
const counts = {};
let shapesSeen = 0, shapesOutOfBounds = 0;

function record(color, pts) {
  shapesSeen++;
  const [cx, cy] = centroidOfPoints(pts);
  const col = Math.floor(cx), row = Math.floor(cy);
  if (col < 0 || col >= GRID || row < 0 || row >= GRID) { shapesOutOfBounds++; return; }
  const lx = cx - col, ly = cy - row;
  const local = localIndexC16(lx, ly);
  const gi = globalIndexC16(row, col, local);
  colorOf[gi] = color;
}

for (const m of src.matchAll(/<poly(?:gon|line) class="(cls-\d+)" points="([^"]+)"/g)) {
  const color = classColor[m[1]];
  if (!color) continue;
  const nums = m[2].trim().split(/\s+|,/).map(Number);
  const pts = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([toUnit(nums[i]), toUnit(nums[i + 1])]);
  record(color, pts);
}
for (const m of src.matchAll(/<rect class="(cls-\d+)" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
  const color = classColor[m[1]];
  if (!color) continue;
  const x = toUnit(Number(m[2])), y = toUnit(Number(m[3]));
  const w = Number(m[4]) / PX_PER_UNIT, h = Number(m[5]) / PX_PER_UNIT;
  record(color, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
}

let unresolved = 0;
for (let i = 0; i < PARTS; i++) {
  const c = colorOf[i];
  if (c) counts[c] = (counts[c] || 0) + 1; else unresolved++;
}

console.log(JSON.stringify({ svgPath, classColor, counts, unresolved, shapesSeen, shapesOutOfBounds, colorOf }));
