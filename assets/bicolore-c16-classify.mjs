// bicolore-c16-classify.mjs — affecte un point (ou le centroïde d'une
// forme dessinée) à son triangle C16, par sous-carré puis secteur — pas
// par appariement à un point canonique (qui se confond à cette finesse,
// voir bicolore-cube.mjs pour C8/D4 : cette méthode-là échoue en C16).
//
// Géométrie C16 (assets/bicolore-render.js, cellTrianglesC16, déjà établie
// et vérifiée) : la case se partage en quatre sous-carrés de côté ½ — NO,
// NE, SE, SO —, chacun coupé par ses deux diagonales en quatre triangles
// N, E, S, O (sens horaire depuis le haut, comme C8). Index local du
// triangle = majeur (sous-carré, 0..3) × 4 + mineur (secteur, 0..3).

// Sous-carré depuis (x,y) en coordonnées de CASE (0..1) : ouest si x<½,
// est sinon ; nord si y<½, sud sinon. Ordre NO,NE,SE,SO (0,1,2,3) — le
// même que cellTrianglesC16.
const SUB_CENTERS = [[0.25, 0.25], [0.75, 0.25], [0.75, 0.75], [0.25, 0.75]]; // NO, NE, SE, SO

export function subsquareOf(x, y) {
  const west = x < 0.5, north = y < 0.5;
  if (north && west) return 0;  // NO
  if (north && !west) return 1; // NE
  if (!north && !west) return 2; // SE
  return 3; // SO
}

// Secteur (0..3 = N,E,S,O) depuis le centre local du sous-carré, à un
// quart de case de chaque bord — découpe en quatre à partir du haut,
// sens horaire, comme C8.
export function sectorInSubsquare(x, y, major) {
  const [scx, scy] = SUB_CENTERS[major];
  const dx = x - scx, dy = y - scy;
  let bearing = Math.atan2(dx, -dy) * 180 / Math.PI; // 0=haut(N), sens horaire
  bearing = ((bearing % 360) + 360) % 360;
  return Math.floor(((bearing + 45) % 360) / 90);
}

// Index LOCAL (0..15) d'un point en coordonnées de case (0..1).
export function localIndexC16(x, y) {
  const major = subsquareOf(x, y);
  const minor = sectorInSubsquare(x, y, major);
  return major * 4 + minor;
}

// Index GLOBAL (0..2303) depuis la case (row,col, 0..11) et l'index local.
export function globalIndexC16(row, col, local) {
  return (row * 12 + col) * 16 + local;
}
