/**
 * cascade.test.mjs — Cascade v1 (docs/CASCADE_V1.md, crypto_core.py::
 * encrypt_cascade/decrypt_cascade) contre vectors/carter_v3.json::
 * cascade-v1-basic-01, ET interopérabilité Python ↔ JS dans les DEUX sens :
 *
 *   1. Python → JS : payload_hex du vecteur (produit par encrypt_cascade
 *      CÔTÉ PYTHON) est déchiffré ici par decrypt_cascade JS et doit
 *      redonner expected_decode.
 *   2. JS → Python : encrypt_cascade JS, appelé avec les mêmes clé/nonces/
 *      message que le vecteur, doit produire un payload OCTET POUR OCTET
 *      identique à payload_hex — AES-GCM et XChaCha20-Poly1305 sont
 *      déterministes à entrées égales, donc un payload identique prouve
 *      que le Python (dont le vecteur atteste déjà qu'il déchiffre ce
 *      payload — voir l'auto-vérification dans gen_cascade_vector)
 *      déchiffrerait aussi bien ce que JS vient de produire.
 *
 * Une cascade qui fonctionnerait de chaque côté sans se parler serait une
 * panne silencieuse : c'est précisément ce que ces deux sens excluent.
 *
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  hexToBytes, bytesToHex, encrypt_cascade, decrypt_cascade,
  payload_to_symbols, max_message_for_cascade, ALG_CASCADE_V1,
} from '../carter-core.js';

const ROOT = new URL('../../', import.meta.url);
const vectors = JSON.parse(fs.readFileSync(new URL('vectors/carter_v3.json', ROOT), 'utf8'));
const v0 = vectors.vectors.find(v => v.id === 'cascade-v1-basic-01');

test('cascade-v1-basic-01 : vecteur trouvé, alg = ALG_CASCADE_V1', () => {
  assert.ok(v0, 'cascade-v1-basic-01 absent de vectors/carter_v3.json');
  assert.equal(v0.derivation.alg, ALG_CASCADE_V1);
});

test('cascade-v1-basic-01 : Python → JS — decrypt_cascade(payload du vecteur) == expected_decode', async () => {
  const stegKey = hexToBytes(v0.inputs.steg_key_hex);
  const payload = hexToBytes(v0.derivation.payload_hex);
  const nPos = v0.inputs.n_pos;
  const symbols = payload_to_symbols(payload, nPos, { _y: BigInt(v0.injected.y) });
  const decoded = await decrypt_cascade(symbols, stegKey, nPos);
  assert.equal(decoded, v0.expected_decode);
});

test('cascade-v1-basic-01 : Python → JS — symboles stockés du vecteur décodent aussi', async () => {
  const stegKey = hexToBytes(v0.inputs.steg_key_hex);
  const decoded = await decrypt_cascade(v0.derivation.symbols, stegKey, v0.inputs.n_pos);
  assert.equal(decoded, v0.expected_decode);
});

test('cascade-v1-basic-01 : JS → Python — encrypt_cascade(JS) == payload_hex octet pour octet', async () => {
  const stegKey = hexToBytes(v0.inputs.steg_key_hex);
  const nonce1 = hexToBytes(v0.injected.nonce1_hex);
  const nonce2 = hexToBytes(v0.injected.nonce2_hex);
  const payload = await encrypt_cascade(v0.inputs.message, stegKey, v0.inputs.n_pos, { _nonce1: nonce1, _nonce2: nonce2 });
  assert.equal(bytesToHex(payload), v0.derivation.payload_hex,
    "le payload produit par encrypt_cascade en JS diffère de celui du vecteur Python — "
    + "la cascade fonctionnerait alors de chaque côté sans se parler.");
});

test('cascade-v1-basic-01 : round-trip JS seul, longueurs et UTF-8 variées', async () => {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const L = 400;
  for (const msg of ['', 'A', 'ANIBALAMIOTX', 'déjà vu — 中文 🎉']) {
    const payload = await encrypt_cascade(msg, key, L);
    const symbols = payload_to_symbols(payload, L);
    const decoded = await decrypt_cascade(symbols, key, L);
    assert.equal(decoded, msg, `round-trip JS pour ${JSON.stringify(msg)}`);
  }
});

test('cascade JS : mauvais alg, mauvais nonce extérieur, mauvais tag extérieur — rejetés', async () => {
  const key = crypto.getRandomValues(new Uint8Array(32));
  const L = 400;
  const good = await encrypt_cascade('SEL', key, L);

  const badAlg = new Uint8Array(good); badAlg[32] ^= 0xFF;
  await assert.rejects(() => decrypt_cascade(payload_to_symbols(badAlg, L), key, L));

  const badNonce = new Uint8Array(good); badNonce[33] ^= 0xFF;
  await assert.rejects(() => decrypt_cascade(payload_to_symbols(badNonce, L), key, L));

  const badTag = new Uint8Array(good); badTag[good.length - 1] ^= 0xFF;
  await assert.rejects(() => decrypt_cascade(payload_to_symbols(badTag, L), key, L));

  const wrongKey = crypto.getRandomValues(new Uint8Array(32));
  await assert.rejects(() => decrypt_cascade(payload_to_symbols(good, L), wrongKey, L));
});

test('cascade JS : capacité — max_message_for_cascade = max_message_for - 29', async () => {
  const { max_message_for } = await import('../carter-core.js');
  for (const L of [200, 400, 1000, 2000]) {
    assert.equal(max_message_for_cascade(L), max_message_for(L) - 29, `L=${L}`);
  }
});
