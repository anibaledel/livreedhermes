/* ============================================================
   Lit une planche coloriée de data/EXEMPLES/ (T2 ou T3, quinze images
   par génération) et en tire le masque brut des 1152 triangles C8, par
   lecture de couleur — jamais par nom de classe (protocole-axes.md
   §2.3 : "Les bases... se lisent par la couleur de remplissage, jamais
   par le nom de classe, qui varie d'un fichier à l'autre").

   Méthode : les formes colorées (polygones ou polylignes fermées, la
   classe qui porte #808285/#a7a9ac variant d'un fichier à l'autre) ne
   coïncident pas forcément avec les 8 triangles canoniques d'une case
   (ce sont les losanges/bandes du gnomon, pas un redécoupage). On
   teste donc, pour chaque triangle canonique (son point à 0,30 du
   centre, direction du secteur — même point-test que
   assets/bicolore-axes.js), quelle forme colorée le contient (test
   point-dans-polygone par nombre de croisements, pair/impair — PAS la
   règle du nombre d'enroulement non nul, qui laisse des trous sur des
   contours auto-croisés, cf. l'extraction d'ORIGINES 6).

   Usage : node tools/extract_exemples_plate.mjs "<chemin.svg>"
   Sort un JSON { colorOf: [...], counts: {...}, unresolved: n } sur stdout.
   ============================================================ */
import fs from 'node:fs';
import { triangleGeometry, GRID, PER_CELL } from '../assets/bicolore-render.js';

const [, , svgPath] = process.argv;
if (!svgPath) { console.error('usage: node tools/extract_exemples_plate.mjs <svg>'); process.exit(1); }

const src = fs.readFileSync(svgPath, 'utf8');

// ---------- lire la feuille de style : classe -> couleur de remplissage ----------
// (la numérotation des classes varie d'un fichier à l'autre — ne jamais la
// supposer stable, toujours la relire depuis le <style> de CE fichier.)
const classColor = {};
for (const m of src.matchAll(/\.(cls-\d+)\s*\{[^}]*fill:\s*(#[0-9a-fA-F]{3,6})/g)) classColor[m[1]] = m[2].toLowerCase();

// ---------- échelle SVG (px) -> unités (0..12), établie sur T0 et réutilisée ----------
const PX_PER_UNIT = 31.16, ORIGIN = 1.5;
function toUnit(px) { return (px - ORIGIN) / PX_PER_UNIT; }

// ---------- parser polygon/polyline/rect avec leur classe ----------
function parsePoints(str) {
  const nums = str.trim().split(/\s+|,/).map(Number);
  const pts = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push([toUnit(nums[i]), toUnit(nums[i + 1])]);
  return pts;
}
const shapes = []; // { color, pts: [[x,y]...], bbox: [minx,miny,maxx,maxy] }
// polygon ET polyline : sur les planches d'EXEMPLES, les triangles/formes
// colorées sont parfois fermés en <polyline> (dernier point = premier),
// pas seulement en <polygon> — voir data/EXEMPLES/T3.../bandesYANG PUR.svg.
for (const m of src.matchAll(/<poly(?:gon|line) class="(cls-\d+)" points="([^"]+)"/g)) {
  const color = classColor[m[1]];
  if (!color) continue;
  const pts = parsePoints(m[2]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  shapes.push({ color, pts, bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] });
}
for (const m of src.matchAll(/<rect class="(cls-\d+)" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
  const color = classColor[m[1]];
  if (!color) continue;
  const x = toUnit(Number(m[2])), y = toUnit(Number(m[3]));
  const w = Number(m[4]) / PX_PER_UNIT, h = Number(m[5]) / PX_PER_UNIT;
  const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  shapes.push({ color, pts, bbox: [x, y, x + w, y + h] });
}

// ---------- point dans polygone : pair/impair (même algorithme qu'ORIGINES 6) ----------
function pointInPolygon(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ---------- point-test par triangle canonique C8 : 0,30 du centre, direction du secteur ----------
function sectorPoint(gi) {
  const tri = triangleGeometry(gi, 1, PER_CELL);
  const [cx, cy] = tri[0];
  const midx = (tri[1][0] + tri[2][0]) / 2, midy = (tri[1][1] + tri[2][1]) / 2;
  let dx = midx - cx, dy = midy - cy;
  const len = Math.hypot(dx, dy);
  return [cx + 0.30 * (dx / len), cy + 0.30 * (dy / len)];
}

const PARTS = GRID * GRID * PER_CELL;
const colorOf = new Array(PARTS).fill(null);
const counts = {};
let unresolved = 0;
for (let gi = 0; gi < PARTS; gi++) {
  const [x, y] = sectorPoint(gi);
  let found = null;
  for (const sh of shapes) {
    const [x0, y0, x1, y1] = sh.bbox;
    if (x < x0 - 1e-6 || x > x1 + 1e-6 || y < y0 - 1e-6 || y > y1 + 1e-6) continue;
    if (pointInPolygon(x, y, sh.pts)) { found = sh.color; break; }
  }
  colorOf[gi] = found;
  if (found) counts[found] = (counts[found] || 0) + 1; else unresolved++;
}

console.log(JSON.stringify({ svgPath, classColor, counts, unresolved, colorOf }));
