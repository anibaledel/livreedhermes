/**
 * chacha20.js — ChaCha20 pur JS (RFC 8439)
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.1. Écrit pour l'interopérabilité bit-exacte avec
 * crypto_core.py (format v3), pas comme un choix de convenance : Web
 * Crypto n'expose pas ChaCha20, il n'y a pas de substitut natif possible
 * ici (contrairement à AES-256-GCM pour XChaCha20-Poly1305, substitution
 * qui reste en place ailleurs dans ce dépôt là où l'interop bit-exacte
 * n'est pas requise — voir js/crypto_core.js).
 *
 * Ce fichier n'exporte QUE le cœur ChaCha20 (permutation, fonction de
 * bloc, keystream). C'est la primitive unique réutilisée par HChaCha20,
 * ChaCha20-Poly1305 et XChaCha20-Poly1305 (Étape 1.2-1.5) : un seul cœur
 * à écrire et à auditer contre les vecteurs RFC/draft, jamais réimplémenté
 * par appelant.
 *
 * Aucune dépendance externe. Aucune API Node ou navigateur utilisée
 * (Uint8Array/Uint32Array/DataView seulement) : chargeable tel quel via
 * <script type="module"> dans un navigateur ou via import ES dans Node.
 */

const ROUNDS = 20; // 10 double-rounds (colonne + diagonale), RFC 8439 §2.3

function rotl32(x, n) {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

/**
 * Un quart de tour ChaCha, en place sur un Uint32Array(16).
 * RFC 8439 §2.1 : a += b; d ^= a; d <<<= 16; c += d; b ^= c; b <<<= 12;
 *                 a += b; d ^= a; d <<<= 8;  c += d; b ^= c; b <<<= 7;
 */
function quarterRound(s, a, b, c, d) {
  s[a] = (s[a] + s[b]) >>> 0; s[d] ^= s[a]; s[d] = rotl32(s[d], 16);
  s[c] = (s[c] + s[d]) >>> 0; s[b] ^= s[c]; s[b] = rotl32(s[b], 12);
  s[a] = (s[a] + s[b]) >>> 0; s[d] ^= s[a]; s[d] = rotl32(s[d], 8);
  s[c] = (s[c] + s[d]) >>> 0; s[b] ^= s[c]; s[b] = rotl32(s[b], 7);
}

/**
 * Applique les 20 rounds (permutation pure, sans ajout de l'état
 * d'origine) à un Uint32Array(16), EN PLACE. Réutilisée telle quelle par
 * HChaCha20 (Étape 1.2), dont l'état initial a une disposition différente
 * (nonce 128 bits, pas de compteur) mais la même boucle de permutation —
 * voir RFC 8439 §2.3 et draft-irtf-cfrg-xchacha §2.2.
 */
export function chachaPermute(state) {
  for (let i = 0; i < ROUNDS / 2; i++) {
    // Round colonne
    quarterRound(state, 0, 4, 8, 12);
    quarterRound(state, 1, 5, 9, 13);
    quarterRound(state, 2, 6, 10, 14);
    quarterRound(state, 3, 7, 11, 15);
    // Round diagonale
    quarterRound(state, 0, 5, 10, 15);
    quarterRound(state, 1, 6, 11, 12);
    quarterRound(state, 2, 7, 8, 13);
    quarterRound(state, 3, 4, 9, 14);
  }
  return state;
}

const CONSTANTS = new Uint32Array([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]);

/**
 * Construit l'état initial ChaCha20 (RFC 8439 §2.3) : 4 mots constants,
 * 8 mots de clé (32 octets, little-endian), 1 mot de compteur, 3 mots de
 * nonce (12 octets, little-endian).
 */
function initState(key, counter, nonce) {
  if (key.length !== 32) throw new Error(`Clé ChaCha20 invalide : ${key.length} octets, 32 attendus`);
  if (nonce.length !== 12) throw new Error(`Nonce ChaCha20 invalide : ${nonce.length} octets, 12 attendus`);
  const s = new Uint32Array(16);
  s.set(CONSTANTS, 0);
  const kv = new DataView(key.buffer, key.byteOffset, key.byteLength);
  for (let i = 0; i < 8; i++) s[4 + i] = kv.getUint32(i * 4, true);
  s[12] = counter >>> 0;
  const nv = new DataView(nonce.buffer, nonce.byteOffset, nonce.byteLength);
  for (let i = 0; i < 3; i++) s[13 + i] = nv.getUint32(i * 4, true);
  return s;
}

function serializeState(s) {
  const out = new Uint8Array(64);
  const dv = new DataView(out.buffer);
  for (let i = 0; i < 16; i++) dv.setUint32(i * 4, s[i], true);
  return out;
}

/**
 * Fonction de bloc ChaCha20 (RFC 8439 §2.3) : clé (32B) + compteur
 * (uint32) + nonce (12B) → 64 octets de keystream.
 */
export function chacha20Block(key, counter, nonce) {
  const original = initState(key, counter, nonce);
  const working = original.slice();
  chachaPermute(working);
  const out = new Uint32Array(16);
  for (let i = 0; i < 16; i++) out[i] = (working[i] + original[i]) >>> 0;
  return serializeState(out);
}

/**
 * Chiffrement/déchiffrement ChaCha20 (RFC 8439 §2.4) : XOR du texte avec
 * le flux de blocs successifs (compteur initial + j). Symétrique
 * (chiffrer = déchiffrer).
 */
export function chacha20(key, counter, nonce, data) {
  const out = new Uint8Array(data.length);
  const nBlocks = Math.ceil(data.length / 64) || 0;
  for (let j = 0; j < nBlocks; j++) {
    const block = chacha20Block(key, (counter + j) >>> 0, nonce);
    const start = j * 64;
    const end = Math.min(start + 64, data.length);
    for (let i = start; i < end; i++) out[i] = data[i] ^ block[i - start];
  }
  return out;
}

/**
 * Flux de keystream brut (sans XOR), utile pour la dérivation de masques
 * (Étape 2 : reproduit crypto_core._derive_masks côté Python, qui
 * consomme un keystream ChaCha20 avec rejet d'octets, pas un
 * chiffrement).
 */
export function chacha20Keystream(key, counter, nonce, length) {
  const out = new Uint8Array(length);
  const nBlocks = Math.ceil(length / 64) || 0;
  for (let j = 0; j < nBlocks; j++) {
    const block = chacha20Block(key, (counter + j) >>> 0, nonce);
    const start = j * 64;
    const end = Math.min(start + 64, length);
    out.set(block.subarray(0, end - start), start);
  }
  return out;
}
