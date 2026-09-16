/**
 * chacha20poly1305.js — AEAD_CHACHA20_POLY1305 pur JS (RFC 8439 §2.6, §2.8)
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.4. Compose chacha20.js (chiffrement + fonction de
 * bloc pour la génération de clé Poly1305, §2.6) et poly1305.js
 * (authentification, §2.5) selon le pseudocode exact du §2.8.1 — jamais
 * une réimplémentation de l'un ou l'autre.
 *
 * Nécessaire pour XChaCha20-Poly1305 (Étape 1.5), qui appelle cette AEAD
 * telle quelle avec une clé (sous-clé HChaCha20) et un nonce de 12 octets
 * (4 zéros ‖ 8 derniers octets du nonce étendu).
 */

import { chacha20Block, chacha20 } from './chacha20.js';
import { poly1305Mac } from './poly1305.js';

function concatBytes(...arrays) {
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

/** pad16(x) — RFC 8439 §2.8.1 : complète jusqu'au multiple de 16 suivant. */
function pad16(x) {
  const rem = x.length % 16;
  return rem === 0 ? new Uint8Array(0) : new Uint8Array(16 - rem);
}

function numTo8LEBytes(n) {
  const out = new Uint8Array(8);
  const dv = new DataView(out.buffer);
  dv.setBigUint64(0, BigInt(n), true);
  return out;
}

/** poly1305_key_gen(key, nonce) — RFC 8439 §2.6.1 : bloc ChaCha20 compteur=0. */
export function poly1305KeyGen(key, nonce) {
  return chacha20Block(key, 0, nonce).subarray(0, 32);
}

function macData(aad, ciphertext) {
  return concatBytes(
    aad, pad16(aad),
    ciphertext, pad16(ciphertext),
    numTo8LEBytes(aad.length),
    numTo8LEBytes(ciphertext.length),
  );
}

/**
 * chacha20_aead_encrypt — RFC 8439 §2.8.1. key: 32 octets, nonce: 12
 * octets, aad/plaintext : Uint8Array. Retourne {ciphertext, tag} (tag :
 * 16 octets), jamais concaténés — l'appelant choisit son format de
 * sérialisation (voir crypto_core.js pour le format v3 complet).
 */
export function aeadEncrypt(key, nonce, plaintext, aad = new Uint8Array(0)) {
  const otk = poly1305KeyGen(key, nonce);
  const ciphertext = chacha20(key, 1, nonce, plaintext);
  const tag = poly1305Mac(macData(aad, ciphertext), otk);
  return { ciphertext, tag };
}

/**
 * chacha20_aead_decrypt (symétrique du pseudocode §2.8.1, sens inverse).
 * Vérifie le tag AVANT de déchiffrer (constant-time) ; lève si invalide.
 */
export function aeadDecrypt(key, nonce, ciphertext, tag, aad = new Uint8Array(0)) {
  const otk = poly1305KeyGen(key, nonce);
  const expected = poly1305Mac(macData(aad, ciphertext), otk);
  if (expected.length !== tag.length) throw new Error('Tag Poly1305 invalide (longueur)');
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ tag[i];
  if (diff !== 0) throw new Error('Tag Poly1305 invalide — clé incorrecte ou données altérées');
  return chacha20(key, 1, nonce, ciphertext);
}
