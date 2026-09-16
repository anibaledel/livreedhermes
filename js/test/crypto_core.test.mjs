/**
 * crypto_core.test.mjs — Vérifie la couche crypto_core.py-équivalente de
 * carter-core.js (split, commit key, encrypt, payload_to_symbols,
 * derive_masks) contre le vecteur carter256-basic-01 de vectors/carter_v3.json,
 * étape par étape.
 *
 * Ne couvre PAS encore grammar()/positions() ni la grille finale (étape
 * suivante — dépend du référent 256 et du placement géométrique, pas
 * encore porté) : ce fichier s'arrête à ce que crypto_core.py produit
 * seul, avant que carter.py ne place quoi que ce soit sur la grille.
 *
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  LABELS, hkdf_sha256, hexToBytes, bytesToHex,
  encrypt, payload_to_symbols, derive_masks, redraw_grammar_key,
} from '../carter-core.js';

const vectors = JSON.parse(fs.readFileSync(new URL('../../vectors/carter_v3.json', import.meta.url), 'utf8'));
const v0 = vectors.vectors.find(v => v.id === 'carter256-basic-01');

async function carter256Split(masterKey) {
  const L = LABELS.carter256;
  const xchacha_key = await hkdf_sha256(masterKey, L.split_salt, L.encrypt_info, 32);
  const grammar_key = await hkdf_sha256(masterKey, L.split_salt, L.grammar_info, 32);
  return { xchacha_key, grammar_key };
}

test('carter256-basic-01 : xchacha_key/grammar_key dérivés depuis master_key', async () => {
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const { xchacha_key, grammar_key } = await carter256Split(masterKey);
  assert.equal(bytesToHex(xchacha_key), v0.derivation.xchacha_key_hex);
  assert.equal(bytesToHex(grammar_key), v0.derivation.grammar_key_hex);
});

test('carter256-basic-01 : commit_key', async () => {
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const { xchacha_key } = await carter256Split(masterKey);
  const ck = await hkdf_sha256(xchacha_key, LABELS.commit.salt, LABELS.commit.info, 32);
  assert.equal(bytesToHex(ck), v0.derivation.commit_key_hex);
});

test('carter256-basic-01 : encrypt() reproduit payload_hex exactement (nonce injecté)', async () => {
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const { xchacha_key } = await carter256Split(masterKey);
  const nonce = hexToBytes(v0.injected.nonce_hex);
  const L = v0.derivation.n_pos;
  const payload = await encrypt(v0.inputs.message, xchacha_key, L, nonce);
  assert.equal(bytesToHex(payload), v0.derivation.payload_hex);
});

test('carter256-basic-01 : payload_to_symbols() reproduit symbols exactement (y/leftover injectés)', async () => {
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const { xchacha_key } = await carter256Split(masterKey);
  const nonce = hexToBytes(v0.injected.nonce_hex);
  const L = v0.derivation.n_pos;
  const payload = await encrypt(v0.inputs.message, xchacha_key, L, nonce);
  const syms = payload_to_symbols(payload, L, {
    _y: BigInt(v0.injected.y),
    _leftover: v0.injected.leftover,
  });
  assert.deepEqual(syms, v0.derivation.symbols);
  assert.equal(syms.length, v0.derivation.pts_m + v0.injected.leftover.length);
});

test('carter256-basic-01 : redraw_grammar_key() reproduit grammar_key_ctr exactement', async () => {
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const { grammar_key } = await carter256Split(masterKey);
  const gkCtr = await redraw_grammar_key(grammar_key, 'carter256', v0.derivation.redraw.ctr_used);
  assert.equal(bytesToHex(gkCtr), v0.derivation.redraw.grammar_key_ctr_hex);
});

test('carter256-basic-01 : derive_masks() reproduit masks exactement (clé post-redraw)', async () => {
  // Les masques se dérivent de grammar_key_ctr (la clé APRÈS redraw), pas de
  // grammar_key brute — voir crypto_core.py::_redraw_grammar_key : "un
  // redraw retire seed/grammaire/masques ENSEMBLE". ctr_used=0 n'est PAS un
  // cas particulier "sans redraw" (voir le docstring Python) : grammar_key_ctr
  // diffère de grammar_key même à ctr=0, d'où la dérivation explicite ici
  // plutôt qu'une lecture directe du vecteur.
  const masterKey = hexToBytes(v0.inputs.master_key_hex);
  const { grammar_key } = await carter256Split(masterKey);
  const gkCtr = await redraw_grammar_key(grammar_key, 'carter256', v0.derivation.redraw.ctr_used);
  const n = v0.derivation.n_pos;
  assert.equal(v0.derivation.mask_domain_ascii, 'position-masks-carter256');
  const masks = await derive_masks(gkCtr, n, LABELS.mask_seed.info_carter256);
  assert.deepEqual(masks, v0.derivation.masks);
});
