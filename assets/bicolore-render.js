// bicolore-render.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 (non-commercial) / licence commerciale : anibaledel@gmail.com
//
// Rendu SVG des motifs bicolores (1152 triangles, grille 12×12, 8 par
// cellule) — module SANS DOM ni accès disque, pour être IMPORTÉ TEL QUEL
// à la fois par une page (navigateur) et par un worker (nodejs_compat) :
// source unique du rendu pour toutes les pages qui en dépendent (Cymatique,
// Échiquiers). Le chargement des données (fetch côté client, import
// statique côté worker) reste à la charge de l'appelant.
//
// Géométrie confirmée par recoupement contre deux jeux de données produits
// indépendamment (calques_triangles.json, gammes_bandes.json) et par le
// prototype cymatique.html lui-même : 8 triangles par cellule, sens
// horaire depuis le haut (N, NE, E, SE, S, SW, W, NW), centre commun.
// L'index global d'un triangle (0..1151) est cellule en ordre ligne-major
// (row*12+col), puis secteur (0..7) dans cet ordre.
//
// Format de données attendu (voir data/referent_bicolore_v1.json et
// data/referent_bandes_v1.json) :
//   { grid: 12, parts: 1152, per_cell: 8, per_layer: 192,
//     layers: { "1".."6": [indices globaux, 192 chacun] },
//     familles: { <nom>: { yang: "<288 chars hex>", yin: "<288 chars hex>" } } }
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

// Géométrie d'UN triangle depuis son index global (0..1151) et la taille
// de cellule choisie pour le rendu — sans repasser par les 8 de sa cellule.
export function triangleGeometry(globalIndex, cellPx) {
  const cell = Math.floor(globalIndex / PER_CELL);
  const sector = globalIndex % PER_CELL;
  const row = Math.floor(cell / GRID), col = cell % GRID;
  return cellTriangles(col * cellPx, row * cellPx, cellPx)[sector];
}

function polygon(pts, cls) {
  return `<polygon class="${cls}" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
}

// mask : Uint8Array|string de longueur PARTS (0/1 par triangle, index
// global). palette : [couleurBit0, couleurBit1].
export function maskToSvg(mask, palette, { size = 900 } = {}) {
  const cellPx = size / GRID;
  const [c0, c1] = palette;
  const body = [];
  for (let i = 0; i < PARTS; i++) {
    const bit = mask[i] === 1 || mask[i] === '1';
    body.push(polygon(triangleGeometry(i, cellPx), bit ? 'b' : 'a'));
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">\n` +
    `<style>.a{fill:${c0}}.b{fill:${c1}}</style>\n` +
    body.join('\n') +
    '\n</svg>\n'
  );
}

// Pavage rows×cols de la même composition, via <symbol>/<use> pour éviter
// de dupliquer les 1152 polygones à chaque tuile.
export function maskToPavageSvg(mask, palette, rows, cols, { size = 900 } = {}) {
  const cellPx = size / GRID;
  const [c0, c1] = palette;
  const body = [];
  for (let i = 0; i < PARTS; i++) {
    const bit = mask[i] === 1 || mask[i] === '1';
    body.push(polygon(triangleGeometry(i, cellPx), bit ? 'b' : 'a'));
  }
  const uses = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      uses.push(`<use href="#cell" x="${c * size}" y="${r * size}"/>`);
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

// Combine six niveaux, chacun avec sa propre famille/gamme et teinte, en un
// masque de 1152 bits — pour Échiquiers, où un niveau peut suivre une
// gamme différente de celle des cinq autres. `entries` : l'objet
// familles/gammes du fichier de données (nom -> {yang, yin}, chaînes hex).
// `layers` : l'objet layers du même fichier (niveau "1".."6" -> indices
// globaux). `niveaux` : tableau de 6 {name, teinte}.
export function composeNiveauxMask(entries, layers, niveaux) {
  const mask = new Uint8Array(PARTS);
  for (let n = 1; n <= 6; n++) {
    const { name, teinte } = niveaux[n - 1];
    const bits = hexToBits(entries[name][teinte]);
    for (const gi of layers[String(n)]) mask[gi] = bits[gi];
  }
  return mask;
}
