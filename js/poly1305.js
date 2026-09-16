/**
 * poly1305.js — Poly1305 pur JS (RFC 8439 §2.5)
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.3. Arithmétique en grands entiers via BigInt natif
 * (aucune bibliothèque externe) — même approche que crypto_core.js pour
 * PayloadToSymbols (voir js/crypto_core.js::bytesToSyms).
 *
 * Suit le pseudocode du RFC 8439 §2.5.1 terme à terme, jamais une
 * reformulation : clamp(r), puis pour chaque bloc de 16 octets (dernier
 * bloc éventuellement plus court) — accumulate, multiply, reduce mod
 * p = 2^130-5 — puis ajoute "s" et sérialise les 128 bits de poids
 * faible (pas une réduction mod p : voir RFC 8439 §2.5, dernier
 * paragraphe, "the 128 least significant bits are serialized").
 */

const P = (1n << 130n) - 5n;
const MASK_128 = (1n << 128n) - 1n;
const CLAMP_MASK = 0x0ffffffc0ffffffc0ffffffc0fffffffn;

function leBytesToNum(bytes) {
  let n = 0n;
  for (let i = bytes.length - 1; i >= 0; i--) n = (n << 8n) | BigInt(bytes[i]);
  return n;
}

function numTo16LEBytes(n) {
  const out = new Uint8Array(16);
  let x = n;
  for (let i = 0; i < 16; i++) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}

/**
 * poly1305Mac(msg, key) — RFC 8439 §2.5.1 poly1305_mac(msg, key).
 * key : 32 octets (r ‖ s, 16+16). Retourne un tag de 16 octets.
 */
export function poly1305Mac(msg, key) {
  if (key.length !== 32) throw new Error(`Clé Poly1305 invalide : ${key.length} octets, 32 attendus`);
  const r = leBytesToNum(key.subarray(0, 16)) & CLAMP_MASK;
  const s = leBytesToNum(key.subarray(16, 32));

  let a = 0n;
  const nBlocks = Math.ceil(msg.length / 16) || 0;
  for (let i = 0; i < nBlocks; i++) {
    const start = i * 16;
    const end = Math.min(start + 16, msg.length);
    const chunk = msg.subarray(start, end);
    const withHighBit = new Uint8Array(chunk.length + 1);
    withHighBit.set(chunk, 0);
    withHighBit[chunk.length] = 0x01;
    const n = leBytesToNum(withHighBit);
    a = (a + n) % P;
    a = (a * r) % P;
  }
  a = (a + s) & MASK_128; // sérialisation des 128 bits de poids faible, pas une réduction mod P
  return numTo16LEBytes(a);
}
