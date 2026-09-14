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
import { PARTS, maskToSvg, maskToPavageSvg } from './bicolore-render.js';

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

if (process.exitCode) {
  console.error('\nDes tests ont échoué.');
} else {
  console.log('\nTous les tests sont passés.');
}
