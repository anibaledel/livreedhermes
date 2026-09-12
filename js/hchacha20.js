/**
 * hchacha20.js — HChaCha20 pur JS (draft-irtf-cfrg-xchacha-03 §2.2)
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.2. Réutilise chachaPermute() de chacha20.js : même
 * boucle de 20 rounds, disposition d'état différente (nonce 128 bits à la
 * place du compteur + nonce 96 bits), et pas d'addition de l'état
 * d'origine à la fin (contrairement à la fonction de bloc ChaCha20) —
 * seules les lignes 0 et 3 de l'état permuté sont retournées, telles
 * quelles, comme sous-clé de 256 bits.
 *
 * Nécessaire pour XChaCha20-Poly1305 (Étape 1.5) : c'est l'étape qui
 * dérive la sous-clé depuis les 16 premiers octets du nonce étendu (24
 * octets), avant de repasser par ChaCha20-Poly1305 standard avec les 8
 * octets de nonce restants.
 */

import { chachaPermute } from './chacha20.js';

const CONSTANTS = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);

/**
 * HChaCha20(key: 32 octets, nonce: 16 octets) -> sous-clé de 32 octets.
 */
export function hchacha20(key, nonce) {
  if (key.length !== 32) throw new Error(`Clé HChaCha20 invalide : ${key.length} octets, 32 attendus`);
  if (nonce.length !== 16) throw new Error(`Nonce HChaCha20 invalide : ${nonce.length} octets, 16 attendus`);

  const s = new Uint32Array(16);
  s.set(CONSTANTS, 0);
  const kv = new DataView(key.buffer, key.byteOffset, key.byteLength);
  for (let i = 0; i < 8; i++) s[4 + i] = kv.getUint32(i * 4, true);
  const nv = new DataView(nonce.buffer, nonce.byteOffset, nonce.byteLength);
  for (let i = 0; i < 4; i++) s[12 + i] = nv.getUint32(i * 4, true);

  chachaPermute(s);

  // Première et dernière ligne de l'état permuté, SANS ajout de l'état
  // d'origine (contrairement à la fonction de bloc ChaCha20).
  const out = new Uint8Array(32);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, s[0], true);
  dv.setUint32(4, s[1], true);
  dv.setUint32(8, s[2], true);
  dv.setUint32(12, s[3], true);
  dv.setUint32(16, s[12], true);
  dv.setUint32(20, s[13], true);
  dv.setUint32(24, s[14], true);
  dv.setUint32(28, s[15], true);
  return out;
}
