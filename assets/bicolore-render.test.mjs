// bicolore-render.test.mjs — La Livrée d'Hermès
// Test de non-régression pour assets/bicolore-render.js.
// Sans dépendance : `node assets/bicolore-render.test.mjs`.
//
// Couvre le bug corrigé le 2026-09-15 : les <use> de maskToPavageSvg
// n'avaient ni width ni height. Comme #cell est un <symbol> avec viewBox,
// un <use> sans width/height se dimensionne par défaut à 100 % du
// viewport englobant (size*cols × size*rows) et non à celui du symbole
// (size × size) — les tuiles se chevauchaient et couvraient tout le
// pavage au lieu de chacune leur case.

import assert from 'node:assert/strict';
import { GRID, PARTS, maskToSvg, maskToPavageSvg, cellTrianglesC16, cellTrianglesC4, triangleGeometry } from './bicolore-render.js';

const mask = new Uint8Array(PARTS); // tout à 0, suffisant pour tester la structure du SVG
const palette = ['#f2ece1', '#2b2b2b'];

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`FAIL - ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

test('maskToPavageSvg : chaque <use> porte width et height', () => {
  const svg = maskToPavageSvg(mask, palette, 2, 2, { size: 320 });
  const uses = [...svg.matchAll(/<use\b[^>]*\/>/g)].map((m) => m[0]);
  assert.equal(uses.length, 4, 'attendu 4 tuiles (2×2)');
  for (const u of uses) {
    assert.match(u, /width="320"/, `width manquant sur ${u}`);
    assert.match(u, /height="320"/, `height manquant sur ${u}`);
  }
});

test('maskToPavageSvg : nombre de tuiles = rows*cols pour un pavage non carré', () => {
  const svg = maskToPavageSvg(mask, palette, 3, 5, { size: 100 });
  const uses = [...svg.matchAll(/<use\b[^>]*\/>/g)];
  assert.equal(uses.length, 15, 'attendu 15 tuiles (3×5)');
});

test('maskToPavageSvg : viewBox englobant correspond à size*cols × size*rows', () => {
  const svg = maskToPavageSvg(mask, palette, 2, 3, { size: 100 });
  assert.match(svg, /viewBox="0 0 300 200"/);
});

test('maskToSvg (tuile unique) : pas de <symbol>/<use>, non affectée par le bug', () => {
  const svg = maskToSvg(mask, palette, { size: 320 });
  assert.doesNotMatch(svg, /<symbol/, 'maskToSvg ne devrait pas utiliser <symbol>');
  assert.doesNotMatch(svg, /<use/, 'maskToSvg ne devrait pas utiliser <use>');
  const polygons = [...svg.matchAll(/<polygon\b/g)];
  assert.equal(polygons.length, PARTS, `attendu ${PARTS} polygones dessinés directement`);
});

test('cellTrianglesC4 : 4 triangles, chacun un triplet de points', () => {
  const tris = cellTrianglesC4(0, 0, 10);
  assert.equal(tris.length, 4, 'attendu 4 triangles');
  for (const t of tris) assert.equal(t.length, 3, 'chaque triangle a 3 sommets');
});

test('maskToSvg (perCell: 4) : 576 polygones pour une grille 12×12', () => {
  const maskC4 = new Uint8Array(GRID * GRID * 4);
  const svg = maskToSvg(maskC4, palette, { size: 320, perCell: 4 });
  const polygons = [...svg.matchAll(/<polygon\b/g)];
  assert.equal(polygons.length, GRID * GRID * 4, 'attendu 576 polygones en C4');
});

test('cellTrianglesC16 : 16 triangles, chacun un triplet de points', () => {
  const tris = cellTrianglesC16(0, 0, 10);
  assert.equal(tris.length, 16, 'attendu 16 triangles');
  for (const t of tris) assert.equal(t.length, 3, 'chaque triangle a 3 sommets');
});

test('maskToSvg (perCell: 16) : 2304 polygones pour une grille 12×12', () => {
  const maskC16 = new Uint8Array(GRID * GRID * 16);
  const svg = maskToSvg(maskC16, palette, { size: 320, perCell: 16 });
  const polygons = [...svg.matchAll(/<polygon\b/g)];
  assert.equal(polygons.length, GRID * GRID * 16, 'attendu 2304 polygones en C16');
});

test('triangleGeometry (perCell: 16) : index dans la dernière cellule reste valide', () => {
  const lastIndex = GRID * GRID * 16 - 1;
  const tri = triangleGeometry(lastIndex, 30, 16);
  assert.equal(tri.length, 3, 'triangle valide (3 sommets)');
});

if (process.exitCode) {
  console.error('\nDes tests ont échoué.');
} else {
  console.log('\nTous les tests sont passés.');
}
