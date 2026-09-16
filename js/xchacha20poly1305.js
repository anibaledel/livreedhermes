/**
 * xchacha20poly1305.js — AEAD_XCHACHA20_POLY1305 pur JS
 * (draft-irtf-cfrg-xchacha-03 §2.3, annexe A.3.1)
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.5, dernière primitive avant la couche format
 * (étape 2). C'est la construction que crypto_core.py utilise réellement
 * pour le format v3 (HChaCha20 natif, pas la sous-clé dérivée par HKDF de
 * l'ancienne construction LH-5).
 *
 * Compose hchacha20.js et chacha20poly1305.js selon le §2.3 du draft :
 *   1. HChaCha20(key, nonce[0..16)) -> sous-clé 32 octets
 *   2. AEAD_CHACHA20_POLY1305(sous-clé, 4 zéros ‖ nonce[16..24), ...)
 * Aucune réimplémentation de l'un ou l'autre.
 */

import { hchacha20 } from './hchacha20.js';
import { aeadEncrypt, aeadDecrypt } from './chacha20poly1305.js';

const NONCE_SIZE = 24;

function innerNonce(nonce24) {
  const out = new Uint8Array(12);
  out.set(nonce24.subarray(16, 24), 4); // 4 zéros ‖ 8 derniers octets du nonce étendu
  return out;
}

/**
 * xchacha20Poly1305Encrypt(key: 32 octets, nonce: 24 octets, plaintext, aad)
 * -> {ciphertext, tag}.
 */
export function xchacha20Poly1305Encrypt(key, nonce, plaintext, aad = new Uint8Array(0)) {
  if (nonce.length !== NONCE_SIZE) throw new Error(`Nonce XChaCha20 invalide : ${nonce.length} octets, ${NONCE_SIZE} attendus`);
  const subkey = hchacha20(key, nonce.subarray(0, 16));
  return aeadEncrypt(subkey, innerNonce(nonce), plaintext, aad);
}

/**
 * xchacha20Poly1305Decrypt(key, nonce, ciphertext, tag, aad) -> plaintext.
 * Lève si le tag est invalide.
 */
export function xchacha20Poly1305Decrypt(key, nonce, ciphertext, tag, aad = new Uint8Array(0)) {
  if (nonce.length !== NONCE_SIZE) throw new Error(`Nonce XChaCha20 invalide : ${nonce.length} octets, ${NONCE_SIZE} attendus`);
  const subkey = hchacha20(key, nonce.subarray(0, 16));
  return aeadDecrypt(subkey, innerNonce(nonce), ciphertext, tag, aad);
}
