/**
 * deniable.test.mjs — Vérifie le déni plausible (secu_box.py::encode_deniable/
 * encode_deniable0/decode_deniable) contre le vecteur deniable-basic-01.
 *
 * Grille fournie en clair (grid_csv) : comparée cellule à cellule, pas
 * seulement par SHA-256. Couvre encode_deniable() (message réel + leurre)
 * ET encode_deniable0() (leurre seul, Br laissé au bruit CSPRNG initial) —
 * même π/dsk injectés dans les deux cas, comme le vecteur le prévoit.
 *
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  hexToBytes, bytesToHex, carter256_split,
  encode_deniable, encode_deniable0, decode_deniable,
} from '../carter-core.js';

const ROOT = new URL('../../', import.meta.url);
// Les champs "_y" imbriqués (real_inject/duress_inject) sont sérialisés
// comme des entiers JSON bruts, contrairement au "y" de tête de vecteur
// (déjà une chaîne côté générateur Python) — au-delà de 2^53
// (Number.MAX_SAFE_INTEGER), JSON.parse perd la précision de ces grands
// entiers avant qu'un reviver ne puisse les voir. On les met entre
// guillemets par une passe texte avant l'analyse, pour que BigInt(...)
// les reconstruise exactement à partir de la chaîne décimale.
const rawVectorsText = fs.readFileSync(new URL('vectors/carter_v3.json', ROOT), 'utf8')
  .replace(/"(_y)":\s*(-?\d+)/g, '"$1":"$2"');
const vectors = JSON.parse(rawVectorsText);
const v = vectors.vectors.find(x => x.id === 'deniable-basic-01');

function parseGridCsv(csv) {
  return csv.trim().split('\n').map(row => row.split(',').map(Number));
}
async function sha256Hex(grid) {
  const flat = new Uint8Array(grid.flat());
  const digest = await crypto.subtle.digest('SHA-256', flat);
  return bytesToHex(new Uint8Array(digest));
}

test('deniable-basic-01 : grammar_key (Br via rsk, Bd via dsk) reproduit exactement', async () => {
  const rsk = hexToBytes(v.inputs.rsk_hex);
  const dsk = hexToBytes(v.inputs.dsk_hex);
  const { grammar_key: gkBr } = await carter256_split(rsk);
  const { grammar_key: gkBd } = await carter256_split(dsk);
  assert.equal(bytesToHex(gkBr), v.derivation.Br.grammar_key_hex, 'grammar_key (Br/rsk)');
  assert.equal(bytesToHex(gkBd), v.derivation.Bd.grammar_key_hex, 'grammar_key (Bd/dsk)');
});

test('deniable-basic-01 : encode_deniable() reproduit la grille entière bit à bit, decode_deniable() les deux messages', async () => {
  const rsk = hexToBytes(v.inputs.rsk_hex);
  const dsk = hexToBytes(v.inputs.dsk_hex);
  const expectedGrid = parseGridCsv(v.grid_csv);
  const expectedBlocksBr = v.derivation.Br.blocks;
  const expectedBlocksBd = v.derivation.Bd.blocks;

  const { grid, dk_r, dk_d } = await encode_deniable(
    v.inputs.real_message, v.inputs.duress_message,
    {
      gridSize: v.inputs.grid_size,
      _rsk: rsk, _dsk: dsk, _pi: v.injected.pi,
      _noiseSeed: hexToBytes(v.injected.noise_seed_hex),
      _realInject: {
        _nonce: hexToBytes(v.injected.real_inject._nonce),
        _y: BigInt(v.injected.real_inject._y),
        _leftover: v.injected.real_inject._leftover,
      },
      _duressInject: {
        _nonce: hexToBytes(v.injected.duress_inject._nonce),
        _y: BigInt(v.injected.duress_inject._y),
        _leftover: v.injected.duress_inject._leftover,
      },
    }
  );

  assert.deepEqual(dk_r.blocks, expectedBlocksBr, 'Br (blocs du message réel)');
  assert.deepEqual(dk_d.blocks, expectedBlocksBd, 'Bd (blocs du message leurre)');
  assert.equal(await sha256Hex(grid), v.grid_sha256, 'grid_sha256');
  assert.deepEqual(grid, expectedGrid, 'grille entière, cellule à cellule');

  const realOut = await decode_deniable(grid, dk_r, { gridSize: v.inputs.grid_size });
  const duressOut = await decode_deniable(grid, dk_d, { gridSize: v.inputs.grid_size });
  assert.equal(realOut, v.expected_decode.real_via_dk_r, 'decode_deniable(dk_r)');
  assert.equal(duressOut, v.expected_decode.duress_via_dk_d, 'decode_deniable(dk_d)');
});

test('deniable-basic-01 : encode_deniable0() (leurre seul) reproduit grid0 et se décode', async () => {
  const dsk = hexToBytes(v.inputs.dsk_hex);
  const expectedGrid0 = parseGridCsv(v.grid0_csv_encode0);

  const { grid, dk_d } = await encode_deniable0(
    v.inputs.duress_message,
    {
      gridSize: v.inputs.grid_size,
      _dsk: dsk, _pi: v.injected.pi,
      _noiseSeed: hexToBytes(v.injected.noise_seed_hex),
      _duressInject: {
        _nonce: hexToBytes(v.injected.duress_inject._nonce),
        _y: BigInt(v.injected.duress_inject._y),
        _leftover: v.injected.duress_inject._leftover,
      },
    }
  );

  assert.deepEqual(dk_d.blocks, v.derivation.Bd.blocks, 'Bd (encode_deniable0)');
  assert.equal(await sha256Hex(grid), v.grid0_sha256_encode0, 'grid0_sha256_encode0');
  assert.deepEqual(grid, expectedGrid0, 'grid0 entière, cellule à cellule');

  const duressOut = await decode_deniable(grid, dk_d, { gridSize: v.inputs.grid_size });
  assert.equal(duressOut, v.expected_decode.duress_via_dk_d0_encode0, 'decode_deniable(dk_d) sur grid0');
});

test('deniable-basic-01 : decode_deniable() lève sur une clé incorrecte', async () => {
  const rsk = hexToBytes(v.inputs.rsk_hex);
  const dsk = hexToBytes(v.inputs.dsk_hex);
  const { grid, dk_r } = await encode_deniable(
    v.inputs.real_message, v.inputs.duress_message,
    {
      gridSize: v.inputs.grid_size,
      _rsk: rsk, _dsk: dsk, _pi: v.injected.pi,
      _noiseSeed: hexToBytes(v.injected.noise_seed_hex),
    }
  );
  const wrongKey = { steg_key: hexToBytes('00'.repeat(32)), blocks: dk_r.blocks };
  await assert.rejects(() => decode_deniable(grid, wrongKey, { gridSize: v.inputs.grid_size }));
});
