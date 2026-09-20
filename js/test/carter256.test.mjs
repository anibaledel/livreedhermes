/**
 * carter256.test.mjs — Vérifie Carter-256 (carter.py, referent_256_v3.json)
 * étape par étape contre vectors/carter_v3.json::carter256-basic-01 :
 * rôles/formes, sens de lecture (sweep_of_color), positions, masques,
 * symboles (déjà couverts par crypto_core.test.mjs), PUIS la grille
 * entière bit à bit, PUIS le décodage — dans cet ordre, chaque étape
 * bloquant la suivante en cas d'échec (node:test s'arrête sur la première
 * assertion qui échoue dans un test donné, mais chaque test ci-dessous
 * est indépendant pour voir immédiatement LAQUELLE des couches est en
 * cause si une seule casse).
 *
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  hexToBytes, bytesToHex, redraw_grammar_key,
  carter256_split, carter256_grammar, carter256_positions,
  encode_carter, decode_carter, encrypt_cascade, payload_to_symbols, derive_masks,
  LABELS, ALPHA_LEN,
} from '../carter-core.js';

const ROOT = new URL('../../', import.meta.url);
const vectors = JSON.parse(fs.readFileSync(new URL('vectors/carter_v3.json', ROOT), 'utf8'));
const ref256 = JSON.parse(fs.readFileSync(new URL('data/referent_256_v3.json', ROOT), 'utf8'));
const v0 = vectors.vectors.find(v => v.id === 'carter256-basic-01');

/** grid_csv : CSV multi-ligne (une ligne par rangée, PAS un flat comma-list). */
function parseGridCsv(csv) {
  return csv.split('\n').filter(l => l.length).map(row => row.split(',').map(Number));
}

async function deriveGkCtr() {
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const { grammar_key } = await carter256_split(masterKey);
  return redraw_grammar_key(grammar_key, 'carter256', v0.derivation.redraw.ctr_used);
}

test('carter256-basic-01 : rôles et form_id des 225 blocs', async () => {
  const gkCtr = await deriveGkCtr();
  const { blocks } = await carter256_grammar(gkCtr, ref256);
  assert.equal(blocks.length, v0.derivation.grammar.length);
  for (const expected of v0.derivation.grammar) {
    assert.equal(blocks[expected.i].role, expected.role, `bloc ${expected.i} : rôle`);
    assert.equal(blocks[expected.i].form_id, expected.form_id, `bloc ${expected.i} : form_id`);
  }
});

test('carter256-basic-01 : sens de lecture (sweep_of_color)', async () => {
  const gkCtr = await deriveGkCtr();
  const { sweep_of_color } = await carter256_grammar(gkCtr, ref256);
  assert.deepEqual(sweep_of_color, v0.derivation.sweep_of_color);
});

test('carter256-basic-01 : n_pos (positions message, somme sur tous les blocs MESSAGE)', async () => {
  const gkCtr = await deriveGkCtr();
  const grammar = await carter256_grammar(gkCtr, ref256);
  let total = 0;
  grammar.blocks.forEach((g, i) => {
    if (g.role !== 2) return; // ROLE_MESSAGE
    total += carter256_positions(Math.floor(i / 15), i % 15, g, ref256, grammar.sweep_of_color).length;
  });
  assert.equal(total, v0.derivation.n_pos);
});

test('carter256-basic-01 : encode_carter() reproduit la grille entière bit à bit', async () => {
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const grid = await encode_carter(v0.inputs.message, masterKey, ref256, {
    _nonce1: hexToBytes(v0.injected.nonce1_hex),
    _nonce2: hexToBytes(v0.injected.nonce2_hex),
    _y: BigInt(v0.injected.y),
    _leftover: v0.injected.leftover,
    _noiseSeed: hexToBytes(v0.injected.noise_seed_hex),
  });
  const expectedGrid = parseGridCsv(v0.grid_csv);
  assert.equal(grid.length, expectedGrid.length, 'nombre de rangées');
  assert.deepEqual(grid, expectedGrid, 'grille : au moins une cellule diverge');

  // grid_sha256 (stegano/vectors_internal.py::_grid_sha256) hashe les OCTETS
  // BRUTS de la grille aplatie (une valeur = un octet 0..43), PAS le texte
  // CSV — `bytes(v for row in grid for v in row)`.
  const flatBytes = new Uint8Array(grid.flat());
  const digest = await crypto.subtle.digest('SHA-256', flatBytes);
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  assert.equal(hex, v0.grid_sha256, 'grid_sha256 (octets bruts, grille re-calculée par encode_carter)');
});

test('carter256-basic-01 : decode_carter() retrouve le message (grille recalculée)', async () => {
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const grid = await encode_carter(v0.inputs.message, masterKey, ref256, {
    _nonce1: hexToBytes(v0.injected.nonce1_hex),
    _nonce2: hexToBytes(v0.injected.nonce2_hex),
    _y: BigInt(v0.injected.y),
    _leftover: v0.injected.leftover,
    _noiseSeed: hexToBytes(v0.injected.noise_seed_hex),
  });
  const decoded = await decode_carter(grid, masterKey, ref256);
  assert.equal(decoded, v0.expected_decode);
});

test('carter256-basic-01 : decode_carter() sur la grille EXACTE du vecteur (pas re-encodée)', async () => {
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const grid = parseGridCsv(v0.grid_csv);
  const decoded = await decode_carter(grid, masterKey, ref256);
  assert.equal(decoded, v0.expected_decode);
});

test('carter256-basic-01 : decode_carter() lève sur une cellule altérée (position MESSAGE réelle)', async () => {
  // (0,0) n'est pas forcément une position stégano de CE message — la
  // plupart des 8100 cellules sont du bruit pur/structuré, non lues au
  // décodage. On altère une position réellement porteuse, retrouvée via
  // carter256_grammar/carter256_positions plutôt qu'une case arbitraire.
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const gkCtr = await deriveGkCtr();
  const grammar = await carter256_grammar(gkCtr, ref256);
  const firstMessageBlock = grammar.blocks.findIndex(b => b.role === 2);
  const positions = carter256_positions(
    Math.floor(firstMessageBlock / 15), firstMessageBlock % 15,
    grammar.blocks[firstMessageBlock], ref256, grammar.sweep_of_color);
  assert.ok(positions.length > 0, 'le premier bloc MESSAGE doit avoir au moins une position stégano');

  const grid = parseGridCsv(v0.grid_csv);
  const [gr, gc] = positions[0];
  grid[gr][gc] = (grid[gr][gc] + 1) % 44;
  await assert.rejects(() => decode_carter(grid, masterKey, ref256));
});

test('carter256-basic-01 : decode_carter() lève sur une clé incorrecte', async () => {
  const grid = parseGridCsv(v0.grid_csv);
  const wrongKey = hexToBytes(v0.inputs.master_key_hex.replace(/^../, 'ff'));
  await assert.rejects(() => decode_carter(grid, wrongKey, ref256));
});

// ═══════════════════════════════════════════════════════════════════════
// Les 8 autres vecteurs carter256 : redraw, UTF-8, limites (message vide /
// C_PUB exact), et les 4 vecteurs négatifs dédiés (cellule altérée,
// mauvaise clé, commitment altéré, bruit altéré — decode_ok attendu, la
// cellule ne porte aucune information). Section 3 du prompt demandait
// explicitement ces trois derniers cas ; ils existent déjà comme vecteurs
// nommés plutôt qu'à construire à la main.
// ═══════════════════════════════════════════════════════════════════════

async function encodeAndCheck(id) {
  const v = vectors.vectors.find(x => x.id === id);
  const masterKey = hexToBytes(v.inputs.master_key_hex);
  const grid = await encode_carter(v.inputs.message, masterKey, ref256, {
    _nonce1: hexToBytes(v.injected.nonce1_hex),
    _nonce2: hexToBytes(v.injected.nonce2_hex),
    _y: BigInt(v.injected.y),
    _leftover: v.injected.leftover,
    _noiseSeed: hexToBytes(v.injected.noise_seed_hex),
  });
  const flatBytes = new Uint8Array(grid.flat());
  const digest = await crypto.subtle.digest('SHA-256', flatBytes);
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  assert.equal(hex, v.grid_sha256, `${id} : grid_sha256`);
  const decoded = await decode_carter(grid, masterKey, ref256);
  assert.equal(decoded, v.expected_decode, `${id} : expected_decode`);
  return grid;
}

test('carter256-redraw-01 : clé déclenchant un redraw (ctr>=1)', async () => {
  const v = vectors.vectors.find(x => x.id === 'carter256-redraw-01');
  const masterKey = hexToBytes(v.inputs.master_key_hex);
  const { grammar_key } = await carter256_split(masterKey);
  // Confirme qu'un redraw a bien lieu (sinon ce vecteur ne teste rien de
  // plus que basic-01) : ctr=0 doit échouer le seuil C_PUB avant ctr final.
  const gkCtr0 = await redraw_grammar_key(grammar_key, 'carter256', 0);
  const grammar0 = await carter256_grammar(gkCtr0, ref256);
  let n0 = 0;
  grammar0.blocks.forEach((g, i) => {
    if (g.role !== 2) return;
    n0 += carter256_positions(Math.floor(i / 15), i % 15, g, ref256, grammar0.sweep_of_color).length;
  });
  assert.ok(n0 < 399 * 3, 'sanity : n0 mesuré (pas une assertion forte sur le redraw lui-même)');
  await encodeAndCheck('carter256-redraw-01');
});

test('carter256-utf8-01 : message UTF-8 non-ASCII', async () => {
  await encodeAndCheck('carter256-utf8-01');
});

test('carter256-boundary-message-vide : message de longueur 0', async () => {
  await encodeAndCheck('carter256-boundary-message-vide');
});

test('carter256-boundary-c-pub-exact : message de longueur EXACTE C_PUB=399 octets', async () => {
  await encodeAndCheck('carter256-boundary-c-pub-exact');
});

test('carter256-neg-cellule-alteree : rejet, cellule message altérée', async () => {
  const v = vectors.vectors.find(x => x.id === 'carter256-neg-cellule-alteree');
  const masterKey = hexToBytes(v.inputs.master_key_hex);
  // Même inputs que basic-01 (même master_key/message) — pas d'`injected`
  // propre à ce vecteur : la grille de référence est celle de basic-01
  // (confirmé : grid[46][89]==6 y correspond exactement à v.tamper.original_value).
  const grid = parseGridCsv(v0.grid_csv);
  assert.equal(grid[v.tamper.grid_row][v.tamper.grid_col], v.tamper.original_value, 'valeur d\'origine attendue au point de altération');
  grid[v.tamper.grid_row][v.tamper.grid_col] = v.tamper.tampered_value;
  await assert.rejects(
    () => decode_carter(grid, masterKey, ref256),
    (err) => err.message === v.expected_error,
  );
});

test('carter256-neg-mauvaise-cle : rejet, clé de décodage incorrecte', async () => {
  const v = vectors.vectors.find(x => x.id === 'carter256-neg-mauvaise-cle');
  const grid = parseGridCsv(v0.grid_csv);
  const wrongKey = hexToBytes(v.tamper.wrong_key_hex);
  await assert.rejects(() => decode_carter(grid, wrongKey, ref256));
});

test('carter256-neg-commitment-altere : rejet, octet 0 du commitment falsifié', async () => {
  const v = vectors.vectors.find(x => x.id === 'carter256-neg-commitment-altere');
  const masterKey = hexToBytes(v0.inputs.master_key_hex); // mêmes inputs que basic-01
  const { xchacha_key, grammar_key } = await carter256_split(masterKey);
  const nonce1 = hexToBytes(v0.injected.nonce1_hex);
  const nonce2 = hexToBytes(v0.injected.nonce2_hex);

  // Reproduit encode_carter() à la main jusqu'au payload, falsifie l'octet 0
  // (le commitment, PAS inner — voir la note du vecteur), puis ré-utilise
  // les mêmes positions/masques que basic-01 pour écrire une grille
  // "ce qu'elle aurait été" avec ce commitment altéré.
  const gkCtr = await redraw_grammar_key(grammar_key, 'carter256', v0.derivation.redraw.ctr_used);
  const grammar = await carter256_grammar(gkCtr, ref256);
  const nPos = v0.derivation.n_pos;
  const payload = await encrypt_cascade(v0.inputs.message, xchacha_key, nPos, { _nonce1: nonce1, _nonce2: nonce2 });
  assert.equal(bytesToHex(payload.subarray(0, 1)), v.tamper.original_payload_byte0_hex, 'octet 0 du payload = commitment[0]');
  const tampered = Uint8Array.from(payload);
  tampered[0] = hexToBytes(v.tamper.tampered_payload_byte0_hex)[0];

  const symbols = payload_to_symbols(tampered, nPos, { _y: BigInt(v0.injected.y), _leftover: v0.injected.leftover });
  const masks = await derive_masks(gkCtr, symbols.length, LABELS.mask_seed.info_carter256);
  const grid = parseGridCsv(v0.grid_csv); // repart de la grille correcte : seules les positions MESSAGE seront réécrites
  const sweepOfColor = grammar.sweep_of_color;
  let ni = 0;
  for (let i = 0; i < grammar.blocks.length; i++) {
    const g = grammar.blocks[i];
    if (g.role !== 2) continue;
    const br = Math.floor(i / 15), bc = i % 15;
    for (const [gr, gc] of carter256_positions(br, bc, g, ref256, sweepOfColor)) {
      if (ni >= symbols.length) break;
      grid[gr][gc] = (symbols[ni] + masks[ni]) % ALPHA_LEN;
      ni++;
    }
  }
  await assert.rejects(
    () => decode_carter(grid, masterKey, ref256),
    (err) => err.message === v.expected_error,
  );
});

test('carter256-neg-bruit-altere : decode réussit malgré tout (cellule de bruit pur, aucune information)', async () => {
  const v = vectors.vectors.find(x => x.id === 'carter256-neg-bruit-altere');
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const grid = parseGridCsv(v0.grid_csv);
  assert.equal(grid[v.tamper.grid_row][v.tamper.grid_col], v.tamper.original_value);
  grid[v.tamper.grid_row][v.tamper.grid_col] = v.tamper.tampered_value;
  const decoded = await decode_carter(grid, masterKey, ref256);
  assert.equal(decoded, v.expected_decode);
});
