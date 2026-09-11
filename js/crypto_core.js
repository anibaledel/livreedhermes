/**
 * crypto_core.js — Port JS de crypto_core.py
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * ChaCha20-Poly1305 à nonce étendu par HKDF (LH-5) est SUBSTITUÉ par
 * AES-256-GCM ici : même choix que encodeur.html déjà dans ce dépôt
 * (voir sa note en tête de section stéganographie) — l'API Web Crypto
 * des navigateurs n'a pas de XChaCha20/ChaCha20-Poly1305 natif, et
 * l'alternative aurait été une implémentation ChaCha20 maison ou une
 * dépendance externe non auditée dans ce contexte. AES-256-GCM est
 * standard, authentifié, et fourni nativement par le navigateur.
 *
 * Key commitment HMAC-SHA256, encodage base-44 uniforme : HKDF/HMAC via
 * Web Crypto API (natif, pas de dépendance).
 *
 * Aucune dépendance externe (pas de bundler requis — chargeable tel
 * quel via <script type="module">).
 */

// ── Constantes ────────────────────────────────────────────────────────────────
export const ALPHABET  = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?-';
export const ALPHA_LEN = ALPHABET.length; // 44
const NONCE_SIZE       = 12;             // AES-GCM standard (pas 24 : c'était le nonce étendu ChaCha20)
const TAG_SIZE         = 16;
const AEAD_OVERHEAD    = 32 + NONCE_SIZE + TAG_SIZE;   // HMAC commitment + nonce + tag
const MAX_PAYLOAD      = 1 << 24;        // 16 Mio garde-fou
const UNIFORM_MARGIN   = 64;             // écart uniformité ≤ 2^-64

// ── Utilitaires (pas de dépendance externe) ───────────────────────────────────
function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

function utf8ToBytes(str) {
  return new TextEncoder().encode(str);
}

function concatBytes(...arrays) {
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

async function hkdf(keyMaterial, salt, info, length) {
  /** HKDF-SHA256 via Web Crypto API */
  const baseKey = await crypto.subtle.importKey(
    'raw', keyMaterial, { name: 'HKDF' }, false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: utf8ToBytes(info) },
    baseKey, length * 8
  );
  return new Uint8Array(bits);
}

async function hmacSha256(key, data) {
  /** HMAC-SHA256 via Web Crypto API */
  const k = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', k, data);
  return new Uint8Array(sig);
}

function hmacEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── AES-256-GCM (substitut de ChaCha20-Poly1305 à nonce étendu par HKDF) ─────
async function aesGcmEnc(key, plaintext, aad = null) {
  /**
   * Substitut de _chacha20_hkdf_enc(key, plaintext) en Python. Nonce 12
   * octets (standard AES-GCM, pas 24 : le nonce étendu n'a de sens que
   * pour la construction ChaCha20-HKDF ; AES-GCM n'en a pas besoin).
   */
  const nonce  = randomBytes(NONCE_SIZE);
  const cryKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['encrypt']);
  const opts   = { name: 'AES-GCM', iv: nonce, tagLength: TAG_SIZE * 8 };
  if (aad) opts.additionalData = aad;
  const ctBuf  = await crypto.subtle.encrypt(opts, cryKey, plaintext);
  return concatBytes(nonce, new Uint8Array(ctBuf)); // nonce(12) + ciphertext + tag(16)
}

async function aesGcmDec(key, data, aad = null) {
  /** Substitut de _chacha20_hkdf_dec(key, data) en Python. */
  if (data.length < NONCE_SIZE + TAG_SIZE) {
    throw new Error(`Ciphertext trop court : ${data.length} octets, minimum ${NONCE_SIZE + TAG_SIZE}`);
  }
  const nonce  = data.slice(0, NONCE_SIZE);
  const ct     = data.slice(NONCE_SIZE);
  const cryKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, ['decrypt']);
  const opts   = { name: 'AES-GCM', iv: nonce, tagLength: TAG_SIZE * 8 };
  if (aad) opts.additionalData = aad;
  const ptBuf  = await crypto.subtle.decrypt(opts, cryKey, ct); // lève si tag invalide
  return new Uint8Array(ptBuf);
}

// ── Encodage base-44 uniforme ─────────────────────────────────────────────────
function symCount(nbytes) {
  /** Nombre de symboles base-44 pour nbytes octets (marge 2^-64). */
  return Math.ceil((8 * nbytes + UNIFORM_MARGIN) / Math.log2(ALPHA_LEN));
}

const SYM_HEADER = symCount(4); // en-tête : longueur sur 4 octets

function bytesToSyms(bytes, m) {
  /** Octets → m symboles uniformes sur [0..ALPHA_LEN-1] (BigInt). */
  const span = 1n << BigInt(8 * bytes.length);
  let u = 0n;
  for (const b of bytes) u = (u << 8n) | BigInt(b);

  // Calcul de k = floor(ALPHA_LEN^m / span)
  const alphaM = BigInt(ALPHA_LEN) ** BigInt(m);
  const k = alphaM / span;
  if (k < 1n) throw new Error(`${m} symboles insuffisants pour ${bytes.length} octets`);

  // Rembourrage aléatoire uniforme dans [0, k)
  const randK = randomBigInt(k);
  u = u + span * randK;

  const out = new Array(m);
  for (let i = 0; i < m; i++) {
    out[i] = Number(u % BigInt(ALPHA_LEN));
    u = u / BigInt(ALPHA_LEN);
  }
  return out;
}

function symsToBytes(syms, nbytes) {
  /** Inverse de bytesToSyms. */
  let u = 0n;
  for (let i = syms.length - 1; i >= 0; i--) {
    if (syms[i] < 0 || syms[i] >= ALPHA_LEN)
      throw new Error(`Symbole hors plage : ${syms[i]}`);
    u = u * BigInt(ALPHA_LEN) + BigInt(syms[i]);
  }
  const mask = (1n << BigInt(8 * nbytes)) - 1n;
  u = u & mask;
  const out = new Uint8Array(nbytes);
  for (let i = nbytes - 1; i >= 0; i--) {
    out[i] = Number(u & 0xffn);
    u >>= 8n;
  }
  return out;
}

function randomBigInt(max) {
  /** Entier aléatoire dans [0, max) — CSPRNG (crypto.getRandomValues), rejection sampling. */
  if (max <= 0n) return 0n;
  const bits  = max.toString(2).length;
  const bytes = Math.ceil(bits / 8);
  let r;
  do {
    const buf = randomBytes(bytes);
    r = 0n;
    for (const b of buf) r = (r << 8n) | BigInt(b);
    r = r >> BigInt(bytes * 8 - bits);
  } while (r >= max);
  return r;
}

// ── Clé de commitment ─────────────────────────────────────────────────────────
async function commitKey(stegKey) {
  return hkdf(stegKey, utf8ToBytes('commit-v1'), 'key-commitment', 32);
}

// ── encrypt / decrypt ─────────────────────────────────────────────────────────
export async function encrypt(message, stegKey) {
  /**
   * Correspond à _encrypt(message, steg_key) en Python.
   * Format : [32B HMAC][inner]  inner = nonce(12) + ciphertext + tag(16)
   */
  const upper = message.toUpperCase();
  for (const c of upper) {
    if (!ALPHABET.includes(c))
      throw new Error(`Caractère hors alphabet : '${c}'. Alphabet : ${ALPHABET}`);
  }
  const msgBytes = utf8ToBytes(upper);
  const inner    = await aesGcmEnc(stegKey, msgBytes);
  const ck       = await commitKey(stegKey);
  // LH-4 : header authentifié
  const totalLen = 32 + inner.length;
  const header   = new Uint8Array(4);
  new DataView(header.buffer).setUint32(0, totalLen, false); // big-endian
  const hmacInput = concatBytes(header, inner);
  const commit   = await hmacSha256(ck, hmacInput);
  return concatBytes(commit, inner); // payload bytes
}

export async function decrypt(vals, stegKey) {
  /**
   * Correspond à _decrypt(vals, steg_key) en Python.
   * vals : tableau de symboles base-44.
   */
  if (vals.length < SYM_HEADER)
    throw new Error('Grille trop petite');
  const totalLen = new DataView(
    symsToBytes(vals.slice(0, SYM_HEADER), 4).buffer
  ).getUint32(0, false);
  if (totalLen > MAX_PAYLOAD)
    throw new Error('En-tête invalide — clé incorrecte');
  const need = SYM_HEADER + symCount(totalLen);
  if (vals.length < need)
    throw new Error(`Positions insuffisantes : ${vals.length} < ${need}`);
  const payload = symsToBytes(vals.slice(SYM_HEADER, need), totalLen);
  if (payload.length < 32)
    throw new Error('Payload trop court');
  const commitRecv = payload.slice(0, 32);
  const inner      = payload.slice(32);
  const ck         = await commitKey(stegKey);
  const header     = new Uint8Array(4);
  new DataView(header.buffer).setUint32(0, totalLen, false);
  const commitCalc = await hmacSha256(ck, concatBytes(header, inner));
  if (!hmacEqual(commitRecv, commitCalc))
    throw new Error('Key commitment invalide — clé incorrecte ou données altérées');
  let pt;
  try {
    pt = await aesGcmDec(stegKey, inner);
  } catch (e) {
    throw new Error('Tag AES-GCM invalide — clé incorrecte ou données altérées');
  }
  return new TextDecoder('utf-8').decode(pt);
}

// ── API payload → symboles ────────────────────────────────────────────────────
export function payloadToSymbols(payload) {
  /**
   * Correspond à payload_to_symbols(payload) en Python.
   * payload : Uint8Array — retourne tableau de symboles base-44.
   */
  const header = new Uint8Array(4);
  new DataView(header.buffer).setUint32(0, payload.length, false);
  return [
    ...bytesToSyms(header, SYM_HEADER),
    ...bytesToSyms(payload, symCount(payload.length)),
  ];
}

export function symbolsNeeded(payloadLen) {
  return SYM_HEADER + symCount(payloadLen);
}

export function maxPayloadFor(nPositions) {
  /** Correspond à max_payload_for(n_positions) en Python (recherche binaire). */
  const avail = nPositions - SYM_HEADER;
  if (avail <= 0) return 0;
  let lo = 0, hi = avail;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (symCount(mid) <= avail) lo = mid; else hi = mid - 1;
  }
  return lo;
}

export function maxMessageFor(nPositions) {
  /** Correspond à max_message_for(n_positions) en Python. */
  return Math.max(0, maxPayloadFor(nPositions) - AEAD_OVERHEAD);
}

// ── Bruit — remplissage CSPRNG en bloc ────────────────────────────────────────
// Même principe que crypto_core._random_symbols côté Python (perf, mesure
// arm64 gk2/MOCHAbin, §4.8) et que stegRandomInts déjà dans encodeur.html :
// un seul appel crypto.getRandomValues() par lot plutôt qu'un appel par
// cellule, avec rejection sampling pour rester exactement uniforme.
export function randomSymbols(n) {
  if (n <= 0) return [];
  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % ALPHA_LEN);
  const out = new Array(n);
  let i = 0;
  while (i < n) {
    const batch = randomUint32s(Math.max(64, n - i));
    for (let b = 0; b < batch.length && i < n; b++) {
      if (batch[b] < limit) out[i++] = batch[b] % ALPHA_LEN;
    }
  }
  return out;
}

function randomUint32s(count) {
  const buf = new Uint32Array(count);
  crypto.getRandomValues(buf);
  return buf;
}

export {
  hkdf, hmacSha256, symCount, SYM_HEADER, bytesToSyms, symsToBytes,
  utf8ToBytes, concatBytes, randomBytes,
};
