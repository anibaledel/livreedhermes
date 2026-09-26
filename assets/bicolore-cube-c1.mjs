// bicolore-cube-c1.mjs — fermeture sur le cube au GRAIN CASE (C1, 144
// bits), pour la galerie bicolore. Porte directement tools/cube_edges.py
// (mêmes FACES, même méthode des segments 3D partagés, même recherche
// d'habillage par D4 × 6 faces) plutôt que de réimplémenter la géométrie —
// seule différence avec cube_edges.py : la grille bicolore est un masque
// PLAT de 144 bits (assets/bicolore-axes.js, grain='C1'), pas un tableau
// 12×12 imbriqué ; converti ici en tableau 2D pour réutiliser exactement
// les mêmes transformations (quart_tour, miroir).
//
// Pour le bicolore, π est l'IDENTITÉ — la continuité (même teinte de part
// et d'autre d'une arête), pas l'échange qu'exige le tricolore — voir
// docs/PROTOCOLE_AXES.md §4 et assets/bicolore-cube.mjs (même règle, au
// grain triangle).

const N = 12;

function toGrid(mask) {
  const g = [];
  for (let r = 0; r < N; r++) g.push(Array.from({ length: N }, (_, c) => mask[r * N + c]));
  return g;
}

function quartTour(g) {
  const out = Array.from({ length: N }, () => Array(N));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) out[r][c] = g[N - 1 - c][r];
  return out;
}
function miroir(g) {
  return g.map(row => [...row].reverse());
}

// Les 6 faces du cube [0,12]³ — mêmes repères que tools/cube_edges.py.
const NOMS_FACES = ['top', 'bottom', 'front', 'back', 'left', 'right'];
const FACES = {
  top: [[0, 0, 12], [1, 0, 0], [0, 1, 0]],
  bottom: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  front: [[0, 0, 12], [1, 0, 0], [0, 0, -1]],
  back: [[0, 12, 12], [1, 0, 0], [0, 0, -1]],
  left: [[0, 0, 12], [0, 1, 0], [0, 0, -1]],
  right: [[12, 0, 12], [0, 1, 0], [0, 0, -1]],
};
function P(face, i, j) {
  const [O, ec, er] = FACES[face];
  return [O[0] + ec[0] * i + er[0] * j, O[1] + ec[1] * i + er[1] * j, O[2] + ec[2] * i + er[2] * j];
}
function sommets(face, r, c) {
  return [P(face, c, r), P(face, c + 1, r), P(face, c + 1, r + 1), P(face, c, r + 1)];
}
function ptKey(p) { return p.join(','); }
function segKey(a, b) { const ka = ptKey(a), kb = ptKey(b); return ka < kb ? ka + '|' + kb : kb + '|' + ka; }

// Les 12 arêtes du cube, chacune donnée par ses 12 paires de cases
// adjacentes (une par position le long de l'arête) — 144 paires au total.
function aretesDuCube() {
  const segments = new Map();
  for (const f of NOMS_FACES) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const v = sommets(f, r, c);
      for (let i = 0; i < 4; i++) {
        const k = segKey(v[i], v[(i + 1) % 4]);
        if (!segments.has(k)) segments.set(k, []);
        segments.get(k).push({ f, r, c });
      }
    }
  }
  const parArete = new Map(); // "i,j" (indices de face, i<j) -> [[[r1,c1],[r2,c2]], ...]
  for (const cellules of segments.values()) {
    if (cellules.length === 2 && cellules[0].f !== cellules[1].f) {
      const [a, b] = cellules;
      const i = NOMS_FACES.indexOf(a.f), j = NOMS_FACES.indexOf(b.f);
      const [lo, hi, cLo, cHi] = i < j ? [i, j, a, b] : [j, i, b, a];
      const key = `${lo},${hi}`;
      if (!parArete.has(key)) parArete.set(key, []);
      parArete.get(key).push([[cLo.r, cLo.c], [cHi.r, cHi.c]]);
    }
  }
  return parArete;
}
export const ARETES = aretesDuCube(); // 12 entrées, 12 paires chacune = 144

function variantes(g) {
  const out = [];
  let x = g;
  for (let i = 0; i < 4; i++) { out.push(x); x = quartTour(x); }
  let y = miroir(g);
  for (let i = 0; i < 4; i++) { out.push(y); y = quartTour(y); }
  return out; // 8 (D4 complet)
}

// habillage(mask) : cherche un choix d'une des 8 variantes D4 par face
// (6 faces) tel que toute paire de cases adjacentes en 3D porte la MÊME
// teinte (continuité, π=identité) — ou null si aucun n'existe.
export function habillage(mask) {
  const R = variantes(toGrid(mask));
  const d = R.length; // 8

  const admissibles = new Map();
  for (const [key, cellules] of ARETES) {
    const S = new Set();
    for (let k1 = 0; k1 < d; k1++) for (let k2 = 0; k2 < d; k2++) {
      if (cellules.every(([[r1, c1], [r2, c2]]) => R[k2][r2][c2] === R[k1][r1][c1])) S.add(k1 * d + k2);
    }
    admissibles.set(key, S);
  }
  if ([...admissibles.values()].some(S => S.size === 0)) return null; // obstruction locale

  const pairKeys = [...admissibles.entries()];
  function rec(ks) {
    if (ks.length === 6) {
      for (const [key, S] of pairKeys) {
        const [i, j] = key.split(',').map(Number);
        if (!S.has(ks[i] * d + ks[j])) return null;
      }
      return ks.slice();
    }
    for (let k = 0; k < d; k++) {
      ks.push(k);
      let ok = true;
      for (const [key, S] of pairKeys) {
        const [i, j] = key.split(',').map(Number);
        if (i < ks.length && j < ks.length && !S.has(ks[i] * d + ks[j])) { ok = false; break; }
      }
      if (ok) { const r = rec(ks); if (r) return r; }
      ks.pop();
    }
    return null;
  }
  return rec([]); // obstruction globale si null malgré des arêtes toutes possibles
}

export function fermeSurLeCube(mask) {
  return habillage(mask) !== null;
}
