/**
 * carter_random.test.mjs — Vérifie Carter-Random (carter_random.py,
 * référent 6×6 généré) contre les 2 vecteurs disponibles :
 * carterrandom-basic-01 et carterrandom-cr1-01 (repli CR-1 méta→individuel
 * — vérifie que la comparaison de capacité elle-même est correcte, pas
 * seulement le chemin individuel direct).
 *
 * Ni l'un ni l'autre ne fournit grid_csv (seulement grid_sha256) — la
 * grille entière est donc vérifiée par son SHA-256 (octets bruts, comme
 * pour Carter-256), pas par comparaison cellule à cellule.
 *
 * Mode méta non couvert : aucun des deux vecteurs ne s'y résout
 * (meta_mode=false dans les deux cas) — voir la note dans carter-core.js.
 *
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  hexToBytes, bytesToHex, redraw_grammar_key,
  carter256_split, select_referent_index,
  encode_carter_random, decode_carter_random,
} from '../carter-core.js';

const ROOT = new URL('../../', import.meta.url);
const vectors = JSON.parse(fs.readFileSync(new URL('vectors/carter_v3.json', ROOT), 'utf8'));

async function checkVector(id) {
  const v = vectors.vectors.find(x => x.id === id);
  const masterKey = hexToBytes(v.inputs.master_key_hex);

  // xchacha_key/grammar_key : mêmes labels carter256 (Random réutilise
  // _carter_split — voir crypto_core.py::LABELS['carterrandom'], commentaire
  // "Random/18/Hybrid réutilisent _carter_split (Carter-256)").
  const { xchacha_key, grammar_key } = await carter256_split(masterKey);
  assert.equal(bytesToHex(xchacha_key), v.derivation.xchacha_key_hex, `${id} : xchacha_key`);
  assert.equal(bytesToHex(grammar_key), v.derivation.grammar_key_hex, `${id} : grammar_key`);

  const gkCtr = await redraw_grammar_key(grammar_key, 'carterrandom', v.derivation.redraw.ctr_used);
  assert.equal(bytesToHex(gkCtr), v.derivation.redraw.grammar_key_ctr_hex, `${id} : grammar_key_ctr`);

  const refIdx = await select_referent_index(gkCtr);
  assert.equal(refIdx, v.derivation.params.referent_index, `${id} : referent_index`);

  const { grid, info } = await encode_carter_random(v.inputs.message, masterKey, {
    _nonce: hexToBytes(v.injected.nonce_hex),
    _y: BigInt(v.injected.y),
    _leftover: v.injected.leftover,
    _noiseSeed: hexToBytes(v.injected.noise_seed_hex),
  });
  assert.equal(info.meta_mode, v.derivation.params.meta_mode, `${id} : meta_mode`);
  assert.equal(grid.length, 90, `${id} : grille 90 lignes`);

  const flatBytes = new Uint8Array(grid.flat());
  const digest = await crypto.subtle.digest('SHA-256', flatBytes);
  const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  assert.equal(hex, v.grid_sha256, `${id} : grid_sha256`);

  const decoded = await decode_carter_random(grid, masterKey);
  assert.equal(decoded, v.expected_decode, `${id} : decode`);

  return { grid, masterKey };
}

test('carterrandom-basic-01 : split, redraw, référent, grille (sha256), décodage', async () => {
  await checkVector('carterrandom-basic-01');
});

test('carterrandom-cr1-01 : repli CR-1 (méta→individuel) — comparaison de capacité correcte', async () => {
  const v = vectors.vectors.find(x => x.id === 'carterrandom-cr1-01');
  assert.equal(v.derivation.params.meta_mode, false, "sanity : ce vecteur teste justement le repli vers l'individuel");
  await checkVector('carterrandom-cr1-01');
});

test('carterrandom-basic-01 : decode_carter_random() lève sur une clé incorrecte', async () => {
  const { grid } = await checkVector('carterrandom-basic-01');
  const v = vectors.vectors.find(x => x.id === 'carterrandom-basic-01');
  const wrongKey = hexToBytes(v.inputs.master_key_hex.replace(/^../, 'ff'));
  await assert.rejects(() => decode_carter_random(grid, wrongKey));
});
