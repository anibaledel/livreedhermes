// bicolore-cube.mjs — fermeture sur le cube, au triangle près, règle de
// CONTINUITÉ (docs/PROTOCOLE_AXES.md §4 : "même teinte de part et d'autre
// d'une arête, et non l'échange" — contrairement au tricolore, qui exige
// une involution π). Géométrie du cube portée directement de
// tools/cube_edges.py (mêmes FACES, même méthode des segments partagés en
// 3D — indépendante de toute convention de repérage), étendue aux
// DEMI-arêtes de cellule pour retrouver, par côté, lequel des deux
// secteurs C8 touche le bord (les deux triangles milieu-de-côté, jamais
// les triangles de coin, par construction de la cellule C8).
import { GRID, PER_CELL } from './bicolore-render.js';

const N = GRID; // 12

export const NOMS_FACES = ['top', 'bottom', 'front', 'back', 'left', 'right'];
const FACES = {
  top:    [[0, 0, 12], [1, 0, 0], [0, 1, 0]],
  bottom: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  front:  [[0, 0, 12], [1, 0, 0], [0, 0, -1]],
  back:   [[0, 12, 12], [1, 0, 0], [0, 0, -1]],
  left:   [[0, 0, 12], [0, 1, 0], [0, 0, -1]],
  right:  [[12, 0, 12], [0, 1, 0], [0, 0, -1]],
};

function P(face, i, j) {
  const [O, ec, er] = FACES[face];
  return [O[0] + ec[0] * i + er[0] * j, O[1] + ec[1] * i + er[1] * j, O[2] + ec[2] * i + er[2] * j];
}
function key3(p) { return p.map(v => Math.round(v * 2) / 2).join(','); } // demi-entiers exacts
function segKey(a, b) { const ka = key3(a), kb = key3(b); return ka < kb ? ka + '|' + kb : kb + '|' + ka; }

// Les huit demi-arêtes d'une cellule (r,c) d'une face, chacune associée au
// secteur C8 qui la touche (voir assets/bicolore-axes.js sectorPoint et
// bicolore-render.js cellTriangles pour la convention des 8 secteurs).
function demiAretes(face, r, c) {
  const p00 = P(face, c, r), p10 = P(face, c + 1, r), p11 = P(face, c + 1, r + 1), p01 = P(face, c, r + 1);
  const pT = P(face, c + 0.5, r), pR = P(face, c + 1, r + 0.5), pB = P(face, c + 0.5, r + 1), pL = P(face, c, r + 0.5);
  return [
    { a: p00, b: pT, sector: 7 }, { a: pT, b: p10, sector: 0 },
    { a: p10, b: pR, sector: 1 }, { a: pR, b: p11, sector: 2 },
    { a: p11, b: pB, sector: 3 }, { a: pB, b: p01, sector: 4 },
    { a: p01, b: pL, sector: 5 }, { a: pL, b: p00, sector: 6 },
  ];
}

// Les paires de (face,r,c,secteur) qui se touchent réellement en 3D, entre
// deux faces différentes — même méthode que cube_edges.py : un segment
// partagé par exactement deux cellules de faces différentes est une arête
// du cube.
function buildPairs() {
  const bySeg = new Map();
  for (const face of NOMS_FACES) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    for (const { a, b, sector } of demiAretes(face, r, c)) {
      const k = segKey(a, b);
      if (!bySeg.has(k)) bySeg.set(k, []);
      bySeg.get(k).push({ face, r, c, sector });
    }
  }
  const pairs = [];
  for (const list of bySeg.values()) {
    if (list.length === 2 && list[0].face !== list[1].face) pairs.push([list[0], list[1]]);
  }
  return pairs;
}
export const PAIRS = buildPairs(); // 12 aretes x 12 cellules x 2 demi-aretes = 288 attendu

// Index global d'un triangle (face,r,c,secteur) dans le mask 1152 de la
// face SEULE (une face = un plateau 12x12 C8 = 1152 triangles) — pour
// l'habillage, chaque face reçoit sa propre variante du motif (mask, sous
// une transformation D4), donc l'index est local à la face.
export function localIndex(r, c, sector) { return (r * N + c) * PER_CELL + sector; }

// ---------------------------------------------------------------------
// Habillage : un choix de variante (0..7, indices dans assets/
// bicolore-symmetries.mjs D4) par face, tel que toute demi-arête
// partagée porte la MÊME valeur des deux côtés (continuité — pas
// d'involution π nécessaire, contrairement au tricolore).
import { D4, applyPerm } from './bicolore-symmetries.mjs';

const FACE_INDEX = Object.fromEntries(NOMS_FACES.map((f, i) => [f, i]));

export function habillage(mask) {
  const variantes = D4.map(perm => applyPerm(perm, mask)); // 8 variantes du motif
  const admissibles = {}; // (i,j) -> Set de "k1,k2" admissibles
  const aretesParPaire = new Map(); // (i,j) -> liste de {sec1,sec2}
  for (const [a, b] of PAIRS) {
    const i = FACE_INDEX[a.face], j = FACE_INDEX[b.face];
    const [lo, hi, secLo, secHi] = i < j ? [i, j, a, b] : [j, i, b, a];
    const key = lo + ',' + hi;
    if (!aretesParPaire.has(key)) aretesParPaire.set(key, []);
    aretesParPaire.get(key).push([localIndex(secLo.r, secLo.c, secLo.sector), localIndex(secHi.r, secHi.c, secHi.sector)]);
  }
  let aretesOk = 0;
  const admissiblesParPaire = new Map();
  for (const [key, segs] of aretesParPaire) {
    const S = new Set();
    for (let k1 = 0; k1 < 8; k1++) for (let k2 = 0; k2 < 8; k2++) {
      if (segs.every(([i1, i2]) => variantes[k1][i1] === variantes[k2][i2])) S.add(k1 * 8 + k2);
    }
    admissiblesParPaire.set(key, S);
    if (S.size) aretesOk++;
  }
  if (aretesOk < aretesParPaire.size) return null; // obstruction locale

  const keys = [...aretesParPaire.keys()];
  function search(ks, idx) {
    if (idx === keys.length) return ks.slice();
    // ks est indexé par face (6), pas par paire — on cherche sur les 6 faces
    return null; // remplacé ci-dessous par une recherche correcte
  }
  // Recherche sur les 6 variables de face (0..7 chacune), 8^6 = 262144 max,
  // élaguée par les contraintes déjà calculées par paire.
  const pairKeys = [...admissiblesParPaire.entries()];
  function rec(ks) {
    if (ks.length === 6) {
      for (const [key, S] of pairKeys) {
        const [i, j] = key.split(',').map(Number);
        if (!S.has(ks[i] * 8 + ks[j])) return null;
      }
      return ks.slice();
    }
    for (let k = 0; k < 8; k++) {
      ks.push(k);
      // élagage : verifier les contraintes deja completement determinees
      let ok = true;
      for (const [key, S] of pairKeys) {
        const [i, j] = key.split(',').map(Number);
        if (i < ks.length && j < ks.length && !S.has(ks[i] * 8 + ks[j])) { ok = false; break; }
      }
      if (ok) { const r = rec(ks); if (r) return r; }
      ks.pop();
    }
    return null;
  }
  return rec([]);
}
