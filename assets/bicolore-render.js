// bicolore-render.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 (non-commercial) / licence commerciale : anibaledel@gmail.com
//
// Rendu SVG des motifs bicolores — module SANS DOM ni accès disque, pour
// être IMPORTÉ TEL QUEL à la fois par une page (navigateur) et par un
// worker (nodejs_compat) : source unique du rendu pour toutes les pages
// qui en dépendent (Cymatique, Échiquiers). Le chargement des données
// (fetch côté client, import statique côté worker) reste à la charge de
// l'appelant.
//
// CONTRAT DE CELLULE : une trame déclare sa cellule par son champ
// `per_cell` (4, 8 ou 16 à ce jour). CELLS[per_cell] fournit la
// géométrie correspondante ; les fonctions de rendu ci-dessous prennent
// `perCell` en option (8 par défaut, pour ne rien casser chez les
// appelants existants qui ne connaissent que C8) et branchent la bonne
// cellule sans autre changement. Ajouter une cellule future (ronde...)
// se fait en ajoutant une entrée à CELLS — voir tools/cellule_c4.py et
// tools/cellule_c16.py côté génération pour le même contrat en Python,
// et pour la règle qui impose une cellule plus fine à mesure que le
// bloc se resserre (une cellule plus grossière peut au contraire
// suffire — voir C4, plus petite que C8, pour data/ORIGINES 6/).
//
// Cellule C4 — la case coupée par SES DEUX diagonales, apex commun au
// centre, sens horaire depuis le haut : N (base = arête haute), E
// (arête droite), S (arête basse), W (arête gauche). 4 triangles par
// case. C4 ⊂ C8 (chaque triangle C4 est l'union de deux triangles C8
// voisins) — voir tools/cellule_c4.py.
//
// Cellule C8 (par défaut) — 8 triangles, sens horaire depuis le haut (N,
// NE, E, SE, S, SW, W, NW), centre commun. Géométrie confirmée par
// recoupement contre deux jeux de données produits indépendamment
// (calques_triangles.json, gammes_bandes.json) et par le prototype
// cymatique.html lui-même.
//
// Cellule C16 — la case se partage en quatre sous-carrés de côté ½ (NO,
// NE, SE, SO, sens horaire depuis le haut), chacun coupé par SES DEUX
// PROPRES diagonales en quatre triangles (N, E, S, W, base = une arête
// pleine du sous-carré, apex = centre du sous-carré). 4×4 = 16 triangles
// par case. Index local 0..15 : sous-carré majeur (NO,NE,SE,SO), triangle
// mineur (N,E,S,W) — même convention que tools/cellule_c16.py. C16
// contient C8 exactement (chaque triangle C8 est l'union de deux
// triangles C16) ; nécessaire dès qu'une frontière tracée à 45° tombe à
// une densité de nœuds trop fine pour que C8 la porte sans couper de
// triangle en deux (voir la trame C16·B1).
//
// Hiérarchie des trois : C4 ⊂ C8 ⊂ C16.
//
// Pour une cellule quelconque, l'index global d'un triangle est cellule
// en ordre ligne-major (row*12+col) × per_cell + index local.
//
// Format de données attendu (voir data/referent_bicolore_v1.json,
// data/referent_bicolore_c16b1_v1.json et data/referent_bandes_v1.json) :
//   { grid: 12, parts: <grid*grid*per_cell>, per_cell: 8 ou 16,
//     per_layer: <parts/6>,
//     layers: { "1".."6": [indices globaux, per_layer chacun] },
//     familles: { <nom>: { yang: "<hex>", yin: "<hex>" } } }
// (Échiquiers utilise la clé "familles" ; Cymatique utilise "gammes" —
// même forme, nom de clé différent selon le fichier fourni ; passer le
// sous-objet directement aux fonctions ci-dessous, qui ne regardent pas
// comment il est nommé au niveau supérieur.)

export const GRID = 12;
export const PER_CELL = 8;
export const PARTS = GRID * GRID * PER_CELL; // 1152

// Un caractère hexadécimal = 4 bits, MSB en premier (même convention que
// cymatique.html : (v >> (3-b)) & 1).
export function hexToBits(hex, n = PARTS) {
  const out = new Uint8Array(n);
  for (let i = 0; i < hex.length; i++) {
    const v = parseInt(hex[i], 16);
    for (let b = 0; b < 4; b++) out[i * 4 + b] = (v >> (3 - b)) & 1;
  }
  return out;
}

// Les 8 triangles d'une cellule de coin (x,y) et de côté w, en sens
// horaire depuis le haut. Retourne 8 triplets de points [[x,y]×3].
export function cellTriangles(x, y, w) {
  const cx = x + w / 2, cy = y + w / 2;
  // N, NE, E, SE, S, SW, W, NW
  const e = [
    [cx, y], [x + w, y], [x + w, cy], [x + w, y + w],
    [cx, y + w], [x, y + w], [x, cy], [x, y],
  ];
  const out = [];
  for (let i = 0; i < 8; i++) out.push([[cx, cy], e[i], e[(i + 1) % 8]]);
  return out;
}

// Les 16 triangles d'une cellule C16 de coin (x,y) et de côté w — voir
// le contrat de cellule en tête de fichier. Retourne 16 triplets de
// points [[x,y]×3], sous-carré majeur puis triangle mineur.
export function cellTrianglesC16(x, y, w) {
  const h = w / 2;
  const subOrigins = [[x, y], [x + h, y], [x + h, y + h], [x, y + h]]; // NO, NE, SE, SO
  const out = [];
  for (const [sx, sy] of subOrigins) {
    const scx = sx + h / 2, scy = sy + h / 2;
    const corners = [[sx, sy], [sx + h, sy], [sx + h, sy + h], [sx, sy + h]];
    for (let i = 0; i < 4; i++) out.push([[scx, scy], corners[i], corners[(i + 1) % 4]]);
  }
  return out;
}

// Les 4 triangles d'une cellule C4 de coin (x,y) et de côté w — coupée
// par ses deux diagonales, apex commun au centre, sens horaire depuis
// le haut (N, E, S, W). Retourne 4 triplets de points [[x,y]×3]. Voir
// tools/cellule_c4.py : C4 ⊂ C8 ⊂ C16 (chaque triangle C4 est l'union
// de deux triangles C8).
export function cellTrianglesC4(x, y, w) {
  const cx = x + w / 2, cy = y + w / 2;
  const corners = [[x, y], [x + w, y], [x + w, y + w], [x, y + w]]; // NO, NE, SE, SO
  const out = [];
  for (let i = 0; i < 4; i++) out.push([[cx, cy], corners[i], corners[(i + 1) % 4]]);
  return out;
}

// Registre du contrat de cellule : per_cell -> { perCell, triangles(x,y,w) }.
export const CELLS = {
  4: { perCell: 4, triangles: cellTrianglesC4 },
  8: { perCell: 8, triangles: cellTriangles },
  16: { perCell: 16, triangles: cellTrianglesC16 },
};

function cellOf(perCell) {
  const cell = CELLS[perCell];
  if (!cell) throw new Error(`cellule inconnue : per_cell=${perCell} (voir CELLS)`);
  return cell;
}

// Géométrie d'UN triangle depuis son index global et la taille de
// cellule choisie pour le rendu — sans repasser par tous ceux de sa
// cellule. `perCell` sélectionne la cellule (8 par défaut).
export function triangleGeometry(globalIndex, cellPx, perCell = PER_CELL) {
  const cell = cellOf(perCell);
  const cellIdx = Math.floor(globalIndex / cell.perCell);
  const sector = globalIndex % cell.perCell;
  const row = Math.floor(cellIdx / GRID), col = cellIdx % GRID;
  return cell.triangles(col * cellPx, row * cellPx, cellPx)[sector];
}

function polygon(pts, cls) {
  return `<polygon class="${cls}" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
}

// mask : Uint8Array|string de longueur grid*grid*perCell (0/1 par
// triangle, index global). palette : [couleurBit0, couleurBit1].
export function maskToSvg(mask, palette, { size = 900, perCell = PER_CELL } = {}) {
  const parts = GRID * GRID * perCell;
  const cellPx = size / GRID;
  const [c0, c1] = palette;
  const body = [];
  for (let i = 0; i < parts; i++) {
    const bit = mask[i] === 1 || mask[i] === '1';
    body.push(polygon(triangleGeometry(i, cellPx, perCell), bit ? 'b' : 'a'));
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">\n` +
    `<style>.a{fill:${c0}}.b{fill:${c1}}</style>\n` +
    body.join('\n') +
    '\n</svg>\n'
  );
}

// Pavage rows×cols de la même composition, via <symbol>/<use> pour éviter
// de dupliquer les polygones à chaque tuile.
export function maskToPavageSvg(mask, palette, rows, cols, { size = 900, perCell = PER_CELL } = {}) {
  const parts = GRID * GRID * perCell;
  const cellPx = size / GRID;
  const [c0, c1] = palette;
  const body = [];
  for (let i = 0; i < parts; i++) {
    const bit = mask[i] === 1 || mask[i] === '1';
    body.push(polygon(triangleGeometry(i, cellPx, perCell), bit ? 'b' : 'a'));
  }
  const uses = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      uses.push(`<use href="#cell" x="${c * size}" y="${r * size}" width="${size}" height="${size}"/>`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * cols} ${size * rows}">\n` +
    `<style>.a{fill:${c0}}.b{fill:${c1}}</style>\n` +
    `<symbol id="cell" viewBox="0 0 ${size} ${size}">\n` +
    body.join('\n') +
    '\n</symbol>\n' +
    uses.join('\n') +
    '\n</svg>\n'
  );
}

// Combine six niveaux, chacun avec sa propre famille/gamme et teinte, en
// un masque de grid*grid*perCell bits — pour Échiquiers, où un niveau
// peut suivre une gamme différente de celle des cinq autres. `entries` :
// l'objet familles/gammes du fichier de données (nom -> {yang, yin},
// chaînes hex). `layers` : l'objet layers du même fichier (niveau
// "1".."6" -> indices globaux). `niveaux` : tableau de 6 {name, teinte}.
export function composeNiveauxMask(entries, layers, niveaux, { perCell = PER_CELL } = {}) {
  const parts = GRID * GRID * perCell;
  const mask = new Uint8Array(parts);
  for (let n = 1; n <= 6; n++) {
    const { name, teinte } = niveaux[n - 1];
    const bits = hexToBits(entries[name][teinte], parts);
    for (const gi of layers[String(n)]) mask[gi] = bits[gi];
  }
  return mask;
}
