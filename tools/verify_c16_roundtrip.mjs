/* ============================================================
   Valide le classificateur C16 (assets/bicolore-c16-classify.mjs) avant
   de s'en servir — deux contrôles demandés par Anibal :
   1. auto-cohérence : le centroïde géométrique réel de chaque triangle
      C16 doit se classifier vers son propre index.
   2. round-trip : une planche C8 connue (YANG T2, déjà vérifiée),
      étendue en C16 puis recontractée, doit retrouver l'original au
      bit près — c'est le test qui valide l'extracteur.

   Usage : node tools/verify_c16_roundtrip.mjs
   ============================================================ */
import { GRID, PER_CELL, cellTriangles, cellTrianglesC16 } from '../assets/bicolore-render.js';
import { localIndexC16 } from '../assets/bicolore-c16-classify.mjs';
import { AXES, generateAxesMask } from '../assets/bicolore-axes.js';

const PARTS8 = GRID * GRID * PER_CELL; // 1152
const PARTS16 = GRID * GRID * 16;      // 2304

function pointInTriangle(p, a, b, c) {
  function sign(p1, p2, p3) { return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]); }
  const d1 = sign(p, a, b), d2 = sign(p, b, c), d3 = sign(p, c, a);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

// Pour chaque triangle C16 (index global 0..2303), retrouve le secteur C8
// (0..7, MEME case) dont le triangle C16 est un sous-ensemble, par le
// centroïde géométrique réel (pas la classification) contre le triangle C8.
function buildC16toC8Map() {
  const map = new Int32Array(PARTS16);
  for (let cellIdx = 0; cellIdx < GRID * GRID; cellIdx++) {
    const row = Math.floor(cellIdx / GRID), col = cellIdx % GRID;
    const tris8 = cellTriangles(col, row, 1);   // cellPx=1 -> coords globales directement
    const tris16 = cellTrianglesC16(col, row, 1);
    for (let local16 = 0; local16 < 16; local16++) {
      const t16 = tris16[local16];
      const cx = (t16[0][0] + t16[1][0] + t16[2][0]) / 3;
      const cy = (t16[0][1] + t16[1][1] + t16[2][1]) / 3;
      let found = -1;
      for (let s8 = 0; s8 < 8; s8++) {
        const t8 = tris8[s8];
        if (pointInTriangle([cx, cy], t8[0], t8[1], t8[2])) { found = s8; break; }
      }
      if (found === -1) throw new Error(`triangle C16 ${cellIdx}/${local16} ne tombe dans aucun secteur C8 (centroid ${cx},${cy})`);
      map[cellIdx * 16 + local16] = cellIdx * 8 + found;
    }
  }
  return map;
}

// Test 1 : auto-cohérence de localIndexC16 — le centroïde géométrique réel
// de chaque triangle C16 doit se classifier vers SON PROPRE index local.
function testSelfConsistency() {
  let bad = 0;
  for (let cellIdx = 0; cellIdx < GRID * GRID; cellIdx++) {
    const row = Math.floor(cellIdx / GRID), col = cellIdx % GRID;
    const tris16 = cellTrianglesC16(col, row, 1);
    for (let local16 = 0; local16 < 16; local16++) {
      const t = tris16[local16];
      const cx = (t[0][0] + t[1][0] + t[2][0]) / 3 - col;
      const cy = (t[0][1] + t[1][1] + t[2][1]) / 3 - row;
      const got = localIndexC16(cx, cy);
      if (got !== local16) { bad++; if (bad < 5) console.log('MISMATCH', cellIdx, local16, 'classifie comme', got, 'centroid local', cx, cy); }
    }
  }
  console.log(`auto-cohérence localIndexC16 : ${bad} désaccord(s) / ${PARTS16}`);
  return bad === 0;
}

function testRoundTrip(mask8) {
  const c16to8 = buildC16toC8Map();
  const mask16 = new Uint8Array(PARTS16);
  for (let i = 0; i < PARTS16; i++) mask16[i] = mask8[c16to8[i]];

  // reconversion C16 -> C8 : les deux enfants doivent s'accorder
  const rebuilt8 = new Uint8Array(PARTS8);
  const pairs = new Map(); // c8 index -> [c16 indices]
  for (let i = 0; i < PARTS16; i++) {
    const p = c16to8[i];
    if (!pairs.has(p)) pairs.set(p, []);
    pairs.get(p).push(i);
  }
  let disagree = 0;
  for (const [c8idx, children] of pairs) {
    if (children.length !== 2) throw new Error(`secteur C8 ${c8idx} a ${children.length} enfants C16, 2 attendus`);
    const [a, b] = children;
    if (mask16[a] !== mask16[b]) disagree++;
    rebuilt8[c8idx] = mask16[a];
  }
  let mism = 0;
  for (let i = 0; i < PARTS8; i++) if (rebuilt8[i] !== mask8[i]) mism++;
  console.log(`désaccords enfants C16 d'un même secteur C8 : ${disagree}`);
  console.log(`round-trip C8->C16->C8 : ${mism} écart(s) / ${PARTS8}`);
  return mism === 0 && disagree === 0;
}

const ok1 = testSelfConsistency();
const yangT2 = generateAxesMask(AXES.YANG.T2);
const ok2 = testRoundTrip(yangT2);
console.log(ok1 && ok2 ? '\nEXTRACTEUR C16 VALIDE.' : '\nECHEC — ne pas utiliser tel quel.');
