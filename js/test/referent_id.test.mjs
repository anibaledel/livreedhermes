/**
 * referent_id.test.mjs — Vérifie que la sérialisation canonique JS produit
 * le même referent_id SHA-256 que tools/generate_referent_256.py et
 * generate_referent_360.py (format v3, section 2 du prompt cœur JS).
 *
 * Les clés de "core" ci-dessous sont recopiées de generate_referent_256.py
 * (ligne ~338) et generate_referent_360.py (ligne ~437) — le cœur canonique
 * précède referent_id dans le générateur ; tout ce qui vient après
 * (generated_at_utc, generator_tool, n_forms/n_calques, ...) est de la
 * métadonnée ajoutée APRÈS le calcul du hash, volontairement exclue.
 *
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { verify_referent_id } from '../carter-core.js';

const ROOT = new URL('../../', import.meta.url);

test('referent_256_v3.json : referent_id identique au Python', async () => {
  const doc = JSON.parse(fs.readFileSync(new URL('data/referent_256_v3.json', ROOT), 'utf8'));
  const coreKeys = ['format_version', 'referent_kind', 'grid_size', 'colors',
    'color_hues_hex', 'stegano_colors', 'crypto_color_order', 'forms'];
  const { ok, computed, expected } = await verify_referent_id(doc, coreKeys);
  assert.equal(computed, expected, `referent_256 : calculé ${computed} != attendu ${expected}`);
  assert.ok(ok);
});

test('referent_360_v3.json : referent_id identique au Python', async () => {
  const doc = JSON.parse(fs.readFileSync(new URL('data/referent_360_v3.json', ROOT), 'utf8'));
  const coreKeys = ['format_version', 'referent_kind', 'grid_size', 'layer_of',
    'colors', 'color_hues_hex', 'stegano_colors', 'calques'];
  const { ok, computed, expected } = await verify_referent_id(doc, coreKeys);
  assert.equal(computed, expected, `referent_360 : calculé ${computed} != attendu ${expected}`);
  assert.ok(ok);
});
