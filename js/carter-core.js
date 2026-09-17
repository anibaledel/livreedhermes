/**
 * carter-core.js — Cœur JS du format Carter v3, interopérable avec le
 * Python (stegano/crypto_core.py, carter.py, carter_random.py).
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 2.1 (couche crypto_core.py-équivalente : HKDF/HMAC,
 * commit, encrypt/decrypt, PayloadToSymbols/SymbolsToPayload en base-44
 * BigInt, derive_masks/random_grid) + Étape 2.2 (Carter-256 SEUL : sweep.py
 * porté, grammaire/positions/encode/decode contre referent_256_v3.json).
 *
 * Carter-256 validé étape par étape contre vectors/carter_v3.json::
 * carter256-basic-01 (rôles, formes, sens de lecture, positions, masques,
 * symboles, PUIS grille entière bit à bit, PUIS décodage) — voir
 * js/test/carter256.test.mjs.
 *
 * NE couvre PAS encore les 7 autres instanciations (carter360/mix/random/
 * random360/18/hybrid/classic/deniable) — Carter-Random est la prochaine
 * étape (même construction, référent différent), demandée explicitement
 * avant les six restantes, chacune dans sa propre passe contre son propre
 * vecteur.
 *
 * Toutes les fonctions HKDF/HMAC sont asynchrones (crypto.subtle) —
 * différence structurelle avec le Python synchrone : toute fonction qui en
 * dépend, transitivement, doit l'être aussi (commit, encrypt, decrypt,
 * deriveMasks, redrawGrammarKey, et plus tard grammar/encode/decode).
 *
 * Aucune dépendance externe. Un seul fichier.
 */

import { chacha20Keystream } from './chacha20.js';
import { xchacha20Poly1305Encrypt, xchacha20Poly1305Decrypt } from './xchacha20poly1305.js';
export { hchacha20 } from './hchacha20.js';

// ── Utilitaires ────────────────────────────────────────────────────────────
function utf8(str) { return new TextEncoder().encode(str); }

export function concatBytes(...arrays) {
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

function u32be(n) {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, n, false);
  return out;
}

export function hexToBytes(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Sérialisation canonique / referent_id (tools/generate_referent_*.py) ───
// json.dumps(doc, sort_keys=True, separators=(',',':'), ensure_ascii=False)
// : clés triées RÉCURSIVEMENT à tout niveau d'imbrication, pas seulement au
// premier — JSON.stringify seul ne trie rien ; canonicalize() reconstruit
// chaque objet en insérant les clés dans l'ordre trié, ce que JSON.stringify
// respecte ensuite (il préserve l'ordre d'insertion). ensure_ascii=False :
// JSON.stringify n'échappe déjà que les caractères de contrôle/guillemets/
// antislash, jamais l'UTF-8 au-delà de l'ASCII — comportement identique par
// défaut, rien à faire de ce côté.
function canonicalize(v) {
  if (Array.isArray(v)) return v.map(canonicalize);
  if (v !== null && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = canonicalize(v[k]);
    return out;
  }
  return v;
}

export function canonical_json_bytes(docWithoutId) {
  return utf8(JSON.stringify(canonicalize(docWithoutId)));
}

export async function compute_referent_id(core) {
  const digest = await crypto.subtle.digest('SHA-256', canonical_json_bytes(core));
  return bytesToHex(new Uint8Array(digest));
}

/**
 * verify_referent_id(doc, coreKeys) -> { ok, computed, expected }. `coreKeys`
 * : les clés du "cœur canonique" (tout ce qui précède referent_id dans le
 * générateur Python — voir generate_referent_256.py / generate_referent_360.py,
 * la métadonnée générée après le hash — generated_at_utc, generator_tool,
 * etc. — en est volontairement exclue).
 */
export async function verify_referent_id(doc, coreKeys) {
  const core = {};
  for (const k of coreKeys) core[k] = doc[k];
  const computed = await compute_referent_id(core);
  return { ok: computed === doc.referent_id, computed, expected: doc.referent_id };
}

// ── HKDF-SHA256 / HMAC-SHA256 (crypto.subtle — voir js/test_hkdf.mjs) ──────
// Repose directement sur Web Crypto, pas de réimplémentation : HKDF/HMAC
// sont entièrement spécifiées par leur RFC (5869, 2104/4231), sans marge
// d'implémentation qui justifierait une version maison à auditer.
export async function hkdf_sha256(ikm, salt, info, length) {
  const baseKey = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, baseKey, length * 8);
  return new Uint8Array(bits);
}

export async function hmac_sha256(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, data);
  return new Uint8Array(sig);
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── XChaCha20-Poly1305 standard (draft-irtf-cfrg-xchacha-03) ───────────────
// Sérialisation identique à crypto_core.py::_xchacha20_enc/_dec : nonce(24)
// ‖ ciphertext ‖ tag(16) concaténés (contrairement à xchacha20poly1305.js,
// qui retourne {ciphertext, tag} séparés et laisse l'appelant choisir —
// ici l'appelant, c'est le format Carter, qui suit la convention Python).
export async function xchacha20poly1305_encrypt(key, plaintext, aad = new Uint8Array(0), _nonce = null) {
  const nonce = _nonce ?? crypto.getRandomValues(new Uint8Array(24));
  const { ciphertext, tag } = xchacha20Poly1305Encrypt(key, nonce, plaintext, aad);
  return concatBytes(nonce, ciphertext, tag);
}

export function xchacha20poly1305_decrypt(key, data, aad = new Uint8Array(0)) {
  if (data.length < 24 + 16) throw new Error(`Ciphertext trop court : ${data.length} octets, minimum 40 requis`);
  const nonce = data.subarray(0, 24);
  const ciphertext = data.subarray(24, data.length - 16);
  const tag = data.subarray(data.length - 16);
  return xchacha20Poly1305Decrypt(key, nonce, ciphertext, tag, aad);
}

// ── Labels HKDF centralisés (repris tels quels de crypto_core.py::LABELS —
// lus dans le Python, jamais retapés de mémoire ; voir vectors/carter_v3.json
// ::labels_used pour la vérification croisée) ──────────────────────────────
export const LABELS = {
  commit: { salt: utf8('commit-v3'), info: utf8('key-commitment') },
  carter256: {
    split_salt: utf8('Carter-256-v3'), encrypt_info: utf8('encrypt'), grammar_info: utf8('grammar'),
    grammar_content_salt: utf8('Carter-256-grammar-v3'), grammar_content_info: utf8('block-roles-and-forms'),
  },
  carter360: {
    split_salt: utf8('Carter-360-v3'), encrypt_info: utf8('encrypt'), grammar_info: utf8('grammar'),
    grammar_content_salt: utf8('Carter-360-grammar-v3'), grammar_content_info: utf8('block-roles-360-forms'),
    niveau_calque_salt: utf8('Carter-360-niveau-calque-v3'), niveau_calque_info: utf8('niveau-calque-index'),
  },
  cartermix: {
    split_salt: utf8('Carter-mix-v3'), encrypt_info: utf8('encrypt'), grammar_info: utf8('grammar'),
    grammar_content_salt: utf8('Carter-mix-grammar-v3'), grammar_content_info: utf8('mixed-256-360-grammar'),
    niveau_calque_salt: utf8('Carter-mix-niveau-calque-v3'), niveau_calque_info: utf8('niveau-calque-index'),
  },
  carterrandom: {
    params_salt: utf8('Carter-random-params-v3'), params_info: utf8('seed-and-mode'),
    grammar_individual_salt: utf8('Carter-random-v3'), grammar_individual_info: utf8('grammar-individual'),
    grammar_meta_salt: utf8('Carter-random-meta-v3'),
    grammar_meta_roles_info: utf8('meta-roles'), grammar_meta_forms_info: utf8('block-forms'),
  },
  carter18: {
    grammar_salt: utf8('Carter-18-v3'), grammar_info: utf8('grammar-18'),
    seed_salt: utf8('Carter-18-seed-v3'), seed_info: utf8('seed'),
  },
  carterhybrid: {
    grammar_salt: utf8('Carter-hybrid-v3'), grammar_info: utf8('grammar-hybrid'),
    seed18_salt: utf8('Carter-hybrid-seed-v3'), seed18_info: utf8('seed-18'),
    seed6_salt: utf8('Carter-hybrid-seed6-v3'), seed6_info: utf8('seed-6'),
    subblock_salt: utf8('Carter-hybrid-sub-v3'),
  },
  mask_seed: {
    salt: utf8('Carter-masks-v3'),
    info_carter256: utf8('position-masks-carter256'), info_carter360: utf8('position-masks-carter360'),
    info_cartermix: utf8('position-masks-cartermix'), info_random: utf8('position-masks-random'),
    info_18: utf8('position-masks-18'), info_hybrid: utf8('position-masks-hybrid'),
    info_deniable: utf8('position-masks-deniable'),
  },
  sweep: { salt: utf8('Carter-sweep-v3') },
  referent6x6: { salt: utf8('Carter-referent6x6-v3'), select_info: utf8('select') },
  deniable: { form_salt: utf8('Carter-deniable-form-v3'), form_info: utf8('block-form-index') },
  redraw: {
    carter256: utf8('Carter-256-redraw-v3'), carter360: utf8('Carter-360-redraw-v3'),
    cartermix: utf8('Carter-mix-redraw-v3'), carterrandom: utf8('Carter-random-redraw-v3'),
    carter18: utf8('Carter-18-redraw-v3'), carterhybrid: utf8('Carter-hybrid-redraw-v3'),
  },
};

// ── Capacité minimale publique — C_PUB (crypto_core.py, recalibrée 2026-09-12) ──
export const C_PUB = {
  carter256: 399, carter360: 1861, cartermix: 1872,
  carterrandom90: 409, carterrandom360: 2147, carter18: 350, carterhybrid: 235,
};
export const MAX_REDRAWS = 10;

export async function redraw_grammar_key(grammarKey, variant, ctr) {
  return hkdf_sha256(grammarKey, LABELS.redraw[variant], concatBytes(utf8('redraw-root|ctr='), u32be(ctr)), 32);
}

// ── Alphabet des symboles de grille (44) — distinct du texte en clair ──────
export const ALPHABET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?-';
export const ALPHA_LEN = ALPHABET.length; // 44
const LAMBDA_S = 64n;
const AEAD_OVERHEAD = 32 + 24 + 16; // commitment HMAC + nonce XChaCha20 + tag Poly1305

// ── Base-44 exacte, BigInt (Python : entiers arbitraires — un Number JS
// perdrait la précision dès que ALPHA_LEN**m dépasse 2**53) ────────────────
function smallestM(targetBits) {
  if (targetBits <= 0) return 0;
  const threshold = 1n << BigInt(targetBits);
  let m = 1n, val = BigInt(ALPHA_LEN);
  while (val < threshold) { m += 1n; val *= BigInt(ALPHA_LEN); }
  return Number(m);
}

function capacityK(L) {
  if (L <= 0) return 0;
  const alphaL = BigInt(ALPHA_LEN) ** BigInt(L);
  let j = 0n;
  while ((1n << (8n * (j + 1n) + LAMBDA_S)) <= alphaL) j += 1n;
  return Number(8n * j);
}

function bytesToBigInt(bytes) {
  let x = 0n;
  for (const b of bytes) x = (x << 8n) | BigInt(b);
  return x;
}

function bigIntToBytes(x, nbytes) {
  const out = new Uint8Array(nbytes);
  let v = x;
  for (let i = nbytes - 1; i >= 0; i--) { out[i] = Number(v & 0xffn); v >>= 8n; }
  return out;
}

function bytesToSyms(payload, m, _y = null) {
  const k = BigInt(8 * payload.length);
  const span = 1n << k;
  const Q = (BigInt(ALPHA_LEN) ** BigInt(m)) / span;
  if (Q < 1n) throw new Error(`${m} symboles insuffisants pour ${payload.length} octets`);
  const x = bytesToBigInt(payload);
  let y;
  if (_y !== null) {
    const yb = BigInt(_y);
    if (!(yb >= 0n && yb < Q)) throw new Error(`_y hors plage : 0 <= ${_y} < ${Q} requis`);
    y = yb;
  } else {
    // secrets.randbelow(Q) : rejet uniforme sur ceil(log256(Q)) octets aléatoires.
    const nbytes = Math.max(1, Math.ceil(Q.toString(2).length / 8));
    const limit = (1n << BigInt(nbytes * 8)) - ((1n << BigInt(nbytes * 8)) % Q);
    let r;
    do {
      const buf = crypto.getRandomValues(new Uint8Array(nbytes));
      r = bytesToBigInt(buf);
    } while (r >= limit);
    y = r % Q;
  }
  // Python : `for _ in range(m): z, r = divmod(z, ALPHA_LEN); out.append(r)`
  // — le PREMIER chiffre ajouté (out[0]) est le moins significatif de z,
  // pas le plus significatif. La boucle doit donc remplir out[0..m-1] dans
  // CET ordre (indice croissant = poids croissant), pas l'inverse.
  let z = x + span * y;
  const out = new Array(m);
  for (let i = 0; i < m; i++) { out[i] = Number(z % BigInt(ALPHA_LEN)); z /= BigInt(ALPHA_LEN); }
  return out;
}

function symsToBytes(syms, nbytes) {
  // Python : `for d in reversed(syms): z = z*ALPHA_LEN + d` — syms[0] est le
  // chiffre le MOINS significatif (voir bytesToSyms ci-dessus) ; reconstruire
  // z exige donc de partir du dernier élément (le plus significatif).
  let z = 0n;
  for (let i = syms.length - 1; i >= 0; i--) {
    const d = syms[i];
    if (!(d >= 0 && d < ALPHA_LEN)) throw new Error(`Symbole hors plage : ${d}`);
    z = z * BigInt(ALPHA_LEN) + BigInt(d);
  }
  const mask = (1n << BigInt(8 * nbytes)) - 1n;
  return bigIntToBytes(z & mask, nbytes);
}

function cleartextCapacity(L) {
  const payloadBytes = capacityK(L) >> 3;
  const cleartextLen = payloadBytes - AEAD_OVERHEAD;
  if (cleartextLen < 4) return { payloadBytes: 0, cleartextLen: 0 };
  return { payloadBytes, cleartextLen };
}

export function symbols_needed(L) { return L; }
export function max_payload_for(L) { return cleartextCapacity(L).payloadBytes; }
export function max_message_for(L) { return Math.max(0, cleartextCapacity(L).cleartextLen - 4); }

/**
 * payload_to_symbols(payload, L, {_y, _leftover}) — Définition 3.6.
 * m symboles portent le payload ; s'il reste une marge (m < L), un symbole
 * CSPRNG supplémentaire la comble (même loi uniforme que les symboles de
 * charge utile — indiscernable).
 */
export function payload_to_symbols(payload, L, { _y = null, _leftover = null } = {}) {
  const k = capacityK(L);
  if (payload.length * 8 !== k) throw new Error('L incohérent avec la taille du payload');
  const m = smallestM(k + Number(LAMBDA_S));
  const syms = bytesToSyms(payload, m, _y);
  if (m < L) {
    if (_leftover !== null) {
      if (_leftover.length !== L - m) throw new Error(`_leftover doit contenir ${L - m} symbole(s), reçu ${_leftover.length}`);
      syms.push(..._leftover);
    } else {
      const extra = new Uint8Array(L - m);
      crypto.getRandomValues(extra);
      for (const b of extra) syms.push(b % ALPHA_LEN); // approximation rejet — marge <= 1 position, non porteuse de payload
    }
  }
  return syms;
}

export function symbols_to_payload(symbols, L) {
  const { payloadBytes, cleartextLen } = cleartextCapacity(L);
  if (cleartextLen === 0) throw new Error(`Grammaire trop petite (${L} positions) pour un message`);
  const m = smallestM(capacityK(L) + Number(LAMBDA_S));
  if (symbols.length < m) throw new Error(`Positions insuffisantes : ${symbols.length} < ${m}`);
  return symsToBytes(symbols.slice(0, m), payloadBytes);
}

// ── Key commitment + chiffrement (crypto_core.py::_encrypt/_decrypt) ───────
async function commitKey(stegKey) {
  return hkdf_sha256(stegKey, LABELS.commit.salt, LABELS.commit.info, 32);
}

/** commit(ckCommit, nonce, ct, tag) — HMAC-SHA256 sur N‖C‖T. Sortie : cm‖N‖C‖T. */
export async function commit(ckCommit, nonce, ct, tag) {
  const inner = concatBytes(nonce, ct, tag);
  const cm = await hmac_sha256(ckCommit, inner);
  return concatBytes(cm, inner);
}

function messageToBytes(message) { return utf8(message); }

/** encrypt(message, stegKey, L) -> payload (cm‖nonce‖ct‖tag), taille fixe déterminée par L. */
export async function encrypt(message, stegKey, L, _nonce = null) {
  const msgB = messageToBytes(message);
  const { payloadBytes, cleartextLen } = cleartextCapacity(L);
  if (cleartextLen === 0) throw new Error(`Grammaire trop petite (${L} positions) pour porter un message, même vide.`);
  const maxMsg = cleartextLen - 4;
  if (msgB.length > maxMsg) throw new Error(`Message trop long pour la grammaire dérivée : ${msgB.length} octets > ${maxMsg} disponibles (${L} positions).`);
  const cleartext = concatBytes(u32be(msgB.length), msgB, new Uint8Array(cleartextLen - 4 - msgB.length));
  const inner = await xchacha20poly1305_encrypt(stegKey, cleartext, new Uint8Array(0), _nonce);
  const ck = await commitKey(stegKey);
  const cm = await hmac_sha256(ck, inner);
  const payload = concatBytes(cm, inner);
  if (payload.length !== payloadBytes) throw new Error('invariant PayloadToSymbols rompu');
  return payload;
}

/** decrypt(vals, stegKey, L) -> message. Vérifie le commitment AVANT de déchiffrer. */
export async function decrypt(vals, stegKey, L) {
  const payload = symbols_to_payload(vals, L);
  const commitRecv = payload.subarray(0, 32);
  const inner = payload.subarray(32);
  const ck = await commitKey(stegKey);
  const commitCalc = await hmac_sha256(ck, inner);
  if (!constantTimeEqual(commitRecv, commitCalc)) throw new Error('Key commitment invalide — clé incorrecte ou données altérées');
  let pt;
  try {
    pt = xchacha20poly1305_decrypt(stegKey, inner);
  } catch (e) {
    throw new Error('Tag Poly1305 invalide — clé incorrecte ou données altérées');
  }
  const msgLen = new DataView(pt.buffer, pt.byteOffset, pt.byteLength).getUint32(0, false);
  if (msgLen > pt.length - 4) throw new Error('Longueur de message invalide — clé incorrecte ou données altérées');
  const msgB = pt.subarray(4, 4 + msgLen);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(msgB);
  } catch (e) {
    throw new Error("Texte déchiffré n'est pas de l'UTF-8 valide — données corrompues malgré une authentification AEAD valide");
  }
}

// ── Bruit / masques (rejet sans biais, keystream ChaCha20) ─────────────────
const REJECT_LIMIT = 256 - (256 % ALPHA_LEN); // 220 pour ALPHA_LEN=44

// Rejet sans biais sur un flux dérivé UNE SEULE FOIS depuis le bloc 0 (pas
// de reprise par tranches — voir la note historique ci-dessous) : le Cipher
// Python (`keystream.update(...)` appelé plusieurs fois) est un flux
// STATEFUL continu, non borné ; chacha20Keystream(key, counter, nonce,
// length) recalculée à chaque itération avec un `counter` avancé par
// arrondi au bloc de 64 octets désaligne le flux dès que la taille
// demandée n'est pas un multiple exact de 64.
//
// Dimensionnement (retour utilisateur) : le rejet des octets >= 220
// consomme une quantité VARIABLE d'octets sources pour produire n symboles
// — une marge "généreuse" mais fixe en proportion de n peut s'épuiser sur
// un tirage défavorable, d'autant plus improbable à mesure que n grandit
// (donc plus rare à détecter en test, plus surprenant en production —
// carter360/cartermix atteignent des n dans les centaines/milliers). Plutôt
// que de boucler sur un tampon agrandi (ce qui revient à consommer deux fois
// les mêmes octets de tête si le premier tampon était déjà entièrement
// scanné), on dimensionne large d'emblée (n*2 minimum, où le facteur exact
// n'a plus d'importance dès lors que le tampon est fixe) et on lève une
// exception explicite si même ce tampon ne suffit pas plutôt que de
// silencieusement retirer un second tampon.
function rejectSample(keystreamFn, n) {
  const bufLen = Math.max(n * 2, Math.ceil(n * 256 / REJECT_LIMIT) + 32);
  const buf = keystreamFn(bufLen);
  const out = [];
  for (const b of buf) {
    if (b < REJECT_LIMIT) { out.push(b % ALPHA_LEN); if (out.length >= n) return out; }
  }
  throw new Error(
    `rejectSample : tampon de ${bufLen} octets épuisé avant d'obtenir ${n} symboles ` +
    `(${out.length} obtenus) — tirage défavorable ou dimensionnement insuffisant.`);
}

/** random_grid(rows, cols) -> grille de symboles uniformes CSPRNG. */
export function random_grid(rows, cols, _noiseSeed = null) {
  const n = rows * cols;
  const flat = _noiseSeed !== null
    ? rejectSample(len => chacha20Keystream(_noiseSeed, 0, new Uint8Array(12), len), n)
    : rejectSample(len => { const b = new Uint8Array(len); crypto.getRandomValues(b); return b; }, n);
  const grid = [];
  for (let r = 0; r < rows; r++) grid.push(flat.slice(r * cols, (r + 1) * cols));
  return grid;
}

/** derive_masks(grammarKey, n, domain) -> n masques ∈ [0..ALPHA_LEN-1]. */
export async function derive_masks(grammarKey, n, domain) {
  const maskKey = await hkdf_sha256(grammarKey, LABELS.mask_seed.salt, domain, 32);
  return rejectSample(len => chacha20Keystream(maskKey, 0, new Uint8Array(12), len), n);
}

// ═══════════════════════════════════════════════════════════════════════
// sweep.py — Ordre de lecture par balayage (règle de lecture v3), porté
// tel quel. 8 balayages (4 coins × 2 axes), dérivés de la clé, UN par
// couleur, fixé pour toute la grammaire (jamais retiré par bloc).
// ═══════════════════════════════════════════════════════════════════════
const SWEEP_CORNERS = ['TL', 'TR', 'BL', 'BR'];
const SWEEP_AXES = ['H', 'V'];
const SWEEPS = [];
for (const corner of SWEEP_CORNERS) for (const axis of SWEEP_AXES) SWEEPS.push([corner, axis]);
const N_SWEEPS = SWEEPS.length; // 8 ; 256 % 8 == 0, aucun biais modulo

/** derive_sweep_index(key, color) -> 0..7, 1 octet HKDF-SHA256 mod 8. */
export async function derive_sweep_index(key, color) {
  const b = await hkdf_sha256(key, LABELS.sweep.salt, utf8(color), 1);
  return b[0] % N_SWEEPS;
}

/** sort_by_sweep(positions, sweepIndex, gridSize) — positions : [[row,col],...] LOCALES. */
function sortBySweep(positions, sweepIndex, gridSize) {
  const [corner, axis] = SWEEPS[sweepIndex];
  function adjusted([r, c]) {
    const ar = corner[0] === 'T' ? r : (gridSize - 1 - r);
    const ac = corner[1] === 'L' ? c : (gridSize - 1 - c);
    return axis === 'H' ? [ar, ac] : [ac, ar];
  }
  return positions
    .map(p => [p, adjusted(p)])
    .sort((a, b) => (a[1][0] - b[1][0]) || (a[1][1] - b[1][1]))
    .map(pair => pair[0]);
}

/**
 * crypto_reading_order(cellsByNiveauAndColor, colorOrder, gridSize, sweepOfColor)
 * -> [[row,col], ...] à plat, dans l'ordre de lecture (niveaux croissants,
 * puis colorOrder, chaque couleur triée par son balayage).
 */
function cryptoReadingOrder(cellsByNiveauAndColor, colorOrder, gridSize, sweepOfColor) {
  const order = [];
  const niveaus = Object.keys(cellsByNiveauAndColor).map(Number).sort((a, b) => a - b);
  for (const niveau of niveaus) {
    const byColor = cellsByNiveauAndColor[niveau];
    for (const color of colorOrder) {
      const positions = byColor[color];
      if (!positions || !positions.length) continue;
      order.push(...sortBySweep(positions, sweepOfColor[color], gridSize));
    }
  }
  return order;
}

// ═══════════════════════════════════════════════════════════════════════
// carter.py — Carter-256 SEUL (référent 256, grille 90×90). Les 7 autres
// instanciations (360/mix/random/random360/18/hybrid/classic/deniable)
// viendront dans des passes séparées, chacune contre son propre vecteur.
// ═══════════════════════════════════════════════════════════════════════
export const CARTER_GRID = 90;
export const CARTER_BLOCK = 6;
export const CARTER_SIDE = CARTER_GRID / CARTER_BLOCK; // 15 blocs par côté
const CARTER_N = CARTER_SIDE * CARTER_SIDE;     // 225 blocs
export const ROLE_PURE = 0, ROLE_STRUCTURED = 1, ROLE_MESSAGE = 2;

/** carter256_split(masterKey) -> {xchacha_key, grammar_key}. */
export async function carter256_split(masterKey) {
  const L = LABELS.carter256;
  const xchacha_key = await hkdf_sha256(masterKey, L.split_salt, L.encrypt_info, 32);
  const grammar_key = await hkdf_sha256(masterKey, L.split_salt, L.grammar_info, 32);
  return { xchacha_key, grammar_key };
}

/**
 * carter256_grammar(gkCtr, ref256) -> {blocks, sweep_of_color}. `gkCtr` :
 * la clé post-redraw (grammar_key_ctr) — malgré le nom du paramètre Python
 * correspondant (`master_key`, trompeur : _carter_grammar est en réalité
 * TOUJOURS appelée avec gk_ctr, jamais la vraie clé maître — voir le site
 * d'appel dans _find_grammar_with_c_pub).
 */
export async function carter256_grammar(gkCtr, ref256) {
  const L = LABELS.carter256;
  const km = await hkdf_sha256(gkCtr, L.grammar_content_salt, L.grammar_content_info, CARTER_N * 2);
  const blocks = [];
  for (let i = 0; i < CARTER_N; i++) {
    const rb = km[i * 2], fb = km[i * 2 + 1];
    const role = rb < 85 ? ROLE_PURE : (rb < 170 ? ROLE_STRUCTURED : ROLE_MESSAGE);
    blocks.push({ role, form_id: fb }); // 256 formes exactement, fb tel quel
  }
  const sweep_of_color = {};
  for (const c of ref256.stegano_colors) sweep_of_color[c] = await derive_sweep_index(gkCtr, c);
  return { blocks, sweep_of_color };
}

/** carter256_positions(br, bc, g, ref256, sweepOfColor) -> [[gr,gc], ...] positions globales du bloc. */
export function carter256_positions(br, bc, g, ref256, sweepOfColor) {
  const form = ref256.forms[g.form_id];
  const steganoColors = ref256.stegano_colors;
  const gridSize = ref256.grid_size;
  const cellsByNiveau = { 0: {} };
  for (const c of steganoColors) cellsByNiveau[0][c] = form[c + '_positions'];
  const localOrder = cryptoReadingOrder(cellsByNiveau, steganoColors, gridSize, sweepOfColor);
  const r0 = br * CARTER_BLOCK, c0 = bc * CARTER_BLOCK;
  const out = [];
  for (const [r, c] of localOrder) {
    const gr = r0 + r, gc = c0 + c;
    if (gr >= 0 && gr < CARTER_GRID && gc >= 0 && gc < CARTER_GRID) out.push([gr, gc]);
  }
  return out;
}

/**
 * carter256_find_grammar(grammarKey, ref256) -> {gkCtr, grammar, nPos}. Expose
 * pour la seule visualisation (colorer les cellules par rôle) la recherche de
 * grammaire déjà effectuée en interne par encode_carter()/decode_carter() —
 * même fonction, mêmes arguments, aucune logique dupliquée.
 */
export async function carter256_find_grammar(grammarKey, ref256) {
  return findGrammarWithCPub(grammarKey, 'carter256',
    gk => carter256_grammar(gk, ref256),
    g => carter256MessagePositions(g, ref256));
}

function carter256MessagePositions(grammar, ref256) {
  const sweepOfColor = grammar.sweep_of_color;
  let total = 0;
  grammar.blocks.forEach((g, i) => {
    if (g.role !== ROLE_MESSAGE) return;
    total += carter256_positions(Math.floor(i / CARTER_SIDE), i % CARTER_SIDE, g, ref256, sweepOfColor).length;
  });
  return total;
}

/**
 * find_grammar_with_c_pub(grammarKey, variant, grammarFn, messagePositionsFn)
 * -> {gkCtr, grammar, nPos}. Recherche déterministe : essaie ctr=0..MAX_REDRAWS-1
 * jusqu'à ce que max_message_for(nPos) >= C_PUB[variant]. Jamais de grille
 * construite, même partielle, en cas d'échec.
 */
async function findGrammarWithCPub(grammarKey, variant, grammarFn, messagePositionsFn) {
  for (let ctr = 0; ctr < MAX_REDRAWS; ctr++) {
    const gkCtr = await redraw_grammar_key(grammarKey, variant, ctr);
    const grammar = await grammarFn(gkCtr);
    const nPos = messagePositionsFn(grammar);
    if (max_message_for(nPos) >= C_PUB[variant]) return { gkCtr, grammar, nPos };
  }
  throw new Error(
    `Échec de dérivation de grammaire après ${MAX_REDRAWS} tentatives : régénérer la clé maître ` +
    `(capacité cible C_PUB=${C_PUB[variant]} octets non atteinte).`);
}

/**
 * encode_carter(message, masterKey, ref256, opts) -> grille 90×90.
 * opts : {_nonce, _y, _leftover, _noiseSeed} — injection pour le mode
 * vecteurs, None/absent préserve le comportement aléatoire normal.
 */
export async function encode_carter(message, masterKey, ref256, opts = {}) {
  const { _nonce = null, _y = null, _leftover = null, _noiseSeed = null } = opts;
  const { xchacha_key, grammar_key } = await carter256_split(masterKey);
  const msgBytes = utf8(message).length;
  if (msgBytes > C_PUB.carter256) {
    throw new Error(`Message trop long : ${msgBytes} > C_PUB=${C_PUB.carter256} octets ` +
      `(capacité publique garantie, indépendante de la clé).`);
  }
  const { gkCtr, grammar, nPos } = await findGrammarWithCPub(grammar_key, 'carter256',
    gk => carter256_grammar(gk, ref256),
    g => carter256MessagePositions(g, ref256));
  const payload = await encrypt(message, xchacha_key, nPos, _nonce);
  const symbols = payload_to_symbols(payload, nPos, { _y, _leftover });
  const masks = await derive_masks(gkCtr, symbols.length, LABELS.mask_seed.info_carter256);
  const grid = random_grid(CARTER_GRID, CARTER_GRID, _noiseSeed);
  const sweepOfColor = grammar.sweep_of_color;
  let ni = 0;
  for (let i = 0; i < grammar.blocks.length; i++) {
    const g = grammar.blocks[i];
    if (g.role !== ROLE_MESSAGE) continue;
    const br = Math.floor(i / CARTER_SIDE), bc = i % CARTER_SIDE;
    for (const [gr, gc] of carter256_positions(br, bc, g, ref256, sweepOfColor)) {
      if (ni >= symbols.length) break;
      grid[gr][gc] = (symbols[ni] + masks[ni]) % ALPHA_LEN;
      ni++;
    }
  }
  return grid;
}

/** decode_carter(grid, masterKey, ref256) -> message. Lève si clé/données invalides. */
export async function decode_carter(grid, masterKey, ref256) {
  const { xchacha_key, grammar_key } = await carter256_split(masterKey);
  const { gkCtr, grammar, nPos } = await findGrammarWithCPub(grammar_key, 'carter256',
    gk => carter256_grammar(gk, ref256),
    g => carter256MessagePositions(g, ref256));
  const masks = await derive_masks(gkCtr, nPos, LABELS.mask_seed.info_carter256);
  const sweepOfColor = grammar.sweep_of_color;
  const vals = [];
  for (let i = 0; i < grammar.blocks.length; i++) {
    const g = grammar.blocks[i];
    if (g.role !== ROLE_MESSAGE) continue;
    const br = Math.floor(i / CARTER_SIDE), bc = i % CARTER_SIDE;
    for (const [gr, gc] of carter256_positions(br, bc, g, ref256, sweepOfColor)) {
      // Modulo Python-compatible : (a - b) peut être négatif, le % JS garde
      // le signe du dividende (contrairement à Python) — d'où +ALPHA_LEN.
      vals.push(((grid[gr][gc] - masks[vals.length]) % ALPHA_LEN + ALPHA_LEN) % ALPHA_LEN);
    }
  }
  return decrypt(vals, xchacha_key, vals.length);
}

// ═══════════════════════════════════════════════════════════════════════
// referent6x6_gen.py — 256 référents 6×6 générés (pas chargés depuis un
// JSON statique), déterministes en n seul, IKM public fixe.
// ═══════════════════════════════════════════════════════════════════════
const REFERENT_IKM = utf8('Carter-referent6x6-v3-public-root');
const R6_GRID_SIZE = 6;
const R6_N_FORMS = 256;
const R6_POOL_TEMPLATE = [
  ...Array(6).fill('blue'), ...Array(6).fill('orange'),
  ...Array(12).fill('green'), ...Array(12).fill('yellow'),
];
export const RANDOM_STEGANO_COLORS = ['blue', 'orange'];

// Lecteur bufferisé d'un keystream ChaCha20(referentKey, nonce=0), octet
// par octet, rejet sans biais modulo (_rand_below). Buffer généreux et
// FIXE (retour utilisateur, cf. rejectSample plus haut) : ~256 formes ×
// 35 tirages Fisher-Yates, rejet <=~2% par tirage (limit proche de 256
// pour n<=36) => ~9100 octets attendus ; 32768 couvre une marge large,
// avec exception explicite si même ça ne suffit pas plutôt qu'un
// agrandissement silencieux.
const R6_KEYSTREAM_BYTES = 32768;
function makeByteReader(key) {
  const buf = chacha20Keystream(key, 0, new Uint8Array(12), R6_KEYSTREAM_BYTES);
  let pos = 0;
  return function nextByte() {
    if (pos >= buf.length) throw new Error(
      `referent6x6 : flux ChaCha20 épuisé (${R6_KEYSTREAM_BYTES} octets) avant la fin de la génération du référent.`);
    return buf[pos++];
  };
}

function randBelow(nextByte, n) {
  const limit = 256 - (256 % n);
  for (;;) {
    const b = nextByte();
    if (b < limit) return b % n;
  }
}

function drawOneForm(nextByte) {
  const pool = R6_POOL_TEMPLATE.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randBelow(nextByte, i + 1);
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  return pool;
}

function poolToPositions(pool) {
  const byColor = { blue: [], orange: [], green: [], yellow: [] };
  pool.forEach((color, idx) => {
    const r = Math.floor(idx / R6_GRID_SIZE), c = idx % R6_GRID_SIZE;
    byColor[color].push([r, c]);
  });
  return byColor;
}

async function referentKey(n) {
  if (!(n >= 0 && n < 256)) throw new Error(`index de référent hors [0,255] : ${n}`);
  return hkdf_sha256(REFERENT_IKM, LABELS.referent6x6.salt, new Uint8Array([n]), 32);
}

function generateReferent6x6(key, nForms = R6_N_FORMS) {
  const nextByte = makeByteReader(key);
  const forms = [];
  const seen = new Set();
  while (forms.length < nForms) {
    const pool = drawOneForm(nextByte);
    const repr = pool.join(',');
    if (seen.has(repr)) continue; // forme dupliquée, retirage (rarissime)
    seen.add(repr);
    forms.push(poolToPositions(pool));
  }
  return forms;
}

const referent6x6Cache = new Map();
/** get_referent(n) -> 256 formes {blue,orange,green,yellow: [[r,c],...]}, mémorisé. */
export async function get_referent6x6(n) {
  if (referent6x6Cache.has(n)) return referent6x6Cache.get(n);
  const key = await referentKey(n);
  const forms = generateReferent6x6(key);
  referent6x6Cache.set(n, forms);
  return forms;
}

/** select_referent_index(grammarKey) -> 0..255, 1 octet HKDF-SHA256 tel quel. */
export async function select_referent_index(grammarKey) {
  const b = await hkdf_sha256(grammarKey, LABELS.referent6x6.salt, LABELS.referent6x6.select_info, 1);
  return b[0];
}

function formSteganoPositions(form, sweepOfColor) {
  const cellsByNiveau = { 0: {} };
  for (const c of RANDOM_STEGANO_COLORS) cellsByNiveau[0][c] = form[c];
  return cryptoReadingOrder(cellsByNiveau, RANDOM_STEGANO_COLORS, R6_GRID_SIZE, sweepOfColor);
}

/** carter_random_positions(form, sweepOfColor) -> [[r,c],...] positions locales d'un référent 6×6 (visualisation uniquement, même fonction qu'en interne). */
export function carter_random_positions(form, sweepOfColor) {
  return formSteganoPositions(form, sweepOfColor);
}

// ═══════════════════════════════════════════════════════════════════════
// carter_random.py — Carter-Random (référent 6×6 dynamique). Mode méta
// (18×18 concentrique) implémenté pour le RÔLE/la CAPACITÉ (nécessaire à
// la comparaison CR-1) ; le PLACEMENT en grille du mode méta lui-même
// n'est pas encore porté — aucun des deux vecteurs disponibles
// (carterrandom-basic-01, carterrandom-cr1-01) ne s'y résout
// (meta_mode=false dans les deux cas, cr1-01 testant justement le repli
// méta→individuel). À compléter si/quand un vecteur meta_mode=true existe.
// ═══════════════════════════════════════════════════════════════════════
const CR_GRID_SIZE = 90, CR_CELL_SIZE = 6;
const CR_N_SIDE = CR_GRID_SIZE / CR_CELL_SIZE; // 15
const CR_META = 3;
const CR_N_META = CR_N_SIDE / CR_META; // 5
const CR_N_META_TOT = CR_N_META * CR_N_META; // 25

async function carterRandomGrammarIndividual(gkCtr, nSide) {
  const nBlocks = nSide * nSide;
  const GL = LABELS.carterrandom;
  const km = await hkdf_sha256(gkCtr, GL.grammar_individual_salt, GL.grammar_individual_info, nBlocks * 2);
  const out = new Array(nBlocks);
  for (let i = 0; i < nBlocks; i++) {
    const rb = km[i * 2], fb = km[i * 2 + 1];
    out[i] = { role: rb < 85 ? ROLE_PURE : (rb < 170 ? ROLE_STRUCTURED : ROLE_MESSAGE), form_id: fb };
  }
  return out;
}

async function carterRandomGrammarMeta(gkCtr, nMetaTot, nMeta) {
  const ML = LABELS.carterrandom;
  const km1 = await hkdf_sha256(gkCtr, ML.grammar_meta_salt, ML.grammar_meta_roles_info, nMetaTot * 2);
  const km2 = await hkdf_sha256(gkCtr, ML.grammar_meta_salt, ML.grammar_meta_forms_info, nMetaTot * CR_META * CR_META);
  const out = new Array(nMetaTot);
  for (let mi = 0; mi < nMetaTot; mi++) {
    const rb = km1[mi * 2];
    const role = rb < 85 ? ROLE_PURE : (rb < 170 ? ROLE_STRUCTURED : ROLE_MESSAGE);
    const sub = new Array(CR_META * CR_META);
    for (let bi = 0; bi < CR_META * CR_META; bi++) sub[bi] = { form_id: km2[mi * 9 + bi] };
    out[mi] = { role, sub, n_meta: nMeta };
  }
  return out;
}

function randomCPubKey(gridSize) { return gridSize === CR_GRID_SIZE ? 'carterrandom90' : 'carterrandom360'; }

async function deriveRandomParams(gkCtr, gridSize = CR_GRID_SIZE) {
  const PL = LABELS.carterrandom;
  const km = await hkdf_sha256(gkCtr, PL.params_salt, PL.params_info, 4);
  const refIdx = await select_referent_index(gkCtr);
  const metaRaw = km[1] < 128;
  if (!metaRaw) return { refIdx, metaMode: false };

  const nMetaSide = Math.floor(gridSize / (CR_CELL_SIZE * CR_META));
  const mg = await carterRandomGrammarMeta(gkCtr, nMetaSide * nMetaSide, nMetaSide);
  const nMsgMeta = mg.filter(x => x.role === ROLE_MESSAGE).length;
  const capMeta = nMsgMeta * CR_META * CR_META * 12;

  const nSideInd = Math.floor(gridSize / CR_CELL_SIZE);
  const gi = await carterRandomGrammarIndividual(gkCtr, nSideInd);
  const nMsgInd = gi.filter(x => x.role === ROLE_MESSAGE).length;
  const capInd = nMsgInd * 12;

  return { refIdx, metaMode: capMeta >= capInd };
}

async function findRandomGrammarWithCPub(grammarKey, gridSize = CR_GRID_SIZE) {
  const cPubKey = randomCPubKey(gridSize);
  const nSideG = Math.floor(gridSize / CR_CELL_SIZE);
  const nMetaG = Math.floor(nSideG / CR_META);
  const nMetaTotG = nMetaG * nMetaG;
  for (let ctr = 0; ctr < MAX_REDRAWS; ctr++) {
    const gkCtr = await redraw_grammar_key(grammarKey, 'carterrandom', ctr);
    const { refIdx, metaMode } = await deriveRandomParams(gkCtr, gridSize);
    let grammar, nPos;
    if (!metaMode) {
      grammar = await carterRandomGrammarIndividual(gkCtr, nSideG);
      nPos = grammar.filter(g => g.role === ROLE_MESSAGE).length * 12;
    } else {
      grammar = await carterRandomGrammarMeta(gkCtr, nMetaTotG, nMetaG);
      nPos = grammar.filter(g => g.role === ROLE_MESSAGE).length * CR_META * CR_META * 12;
    }
    if (max_message_for(nPos) >= C_PUB[cPubKey]) return { gkCtr, refIdx, metaMode, grammar, nPos };
  }
  throw new Error(
    `Échec de dérivation de grammaire après ${MAX_REDRAWS} tentatives : régénérer la clé maître ` +
    `(capacité cible C_PUB=${C_PUB[cPubKey]} octets non atteinte).`);
}

/**
 * carter_random_find_grammar(grammarKey, gridSize) -> {gkCtr, refIdx, metaMode, grammar, nPos}.
 * Expose, pour la seule visualisation, la recherche de grammaire déjà
 * effectuée en interne par encode_carter_random()/decode_carter_random() —
 * même fonction, aucune logique dupliquée.
 */
export async function carter_random_find_grammar(grammarKey, gridSize = CR_GRID_SIZE) {
  return findRandomGrammarWithCPub(grammarKey, gridSize);
}

/** encode_carter_random(message, masterKey, opts) -> {grid, info}. Mode individuel uniquement (voir note ci-dessus). */
export async function encode_carter_random(message, masterKey, opts = {}) {
  const { gridSize = CR_GRID_SIZE, _nonce = null, _y = null, _leftover = null, _noiseSeed = null } = opts;
  const { xchacha_key, grammar_key } = await carter256_split(masterKey);
  const cPubKey = randomCPubKey(gridSize);
  const msgBytes = utf8(message).length;
  if (msgBytes > C_PUB[cPubKey]) {
    throw new Error(`Message trop long : ${msgBytes} > C_PUB=${C_PUB[cPubKey]} octets (capacité publique garantie, indépendante de la clé).`);
  }
  const nSideG = Math.floor(gridSize / CR_CELL_SIZE);
  const { gkCtr, refIdx, metaMode, grammar, nPos } = await findRandomGrammarWithCPub(grammar_key, gridSize);
  if (metaMode) throw new Error('encode_carter_random : mode méta pas encore porté en JS (aucun vecteur ne le requiert actuellement).');

  const sweepOfColor = {};
  for (const c of RANDOM_STEGANO_COLORS) sweepOfColor[c] = await derive_sweep_index(gkCtr, c);
  const ref = await get_referent6x6(refIdx);

  const payload = await encrypt(message, xchacha_key, nPos, _nonce);
  const symbols = payload_to_symbols(payload, nPos, { _y, _leftover });
  const grid = random_grid(gridSize, gridSize, _noiseSeed);
  const masks = await derive_masks(gkCtr, symbols.length + 128, LABELS.mask_seed.info_random);

  let ni = 0;
  for (let i = 0; i < grammar.length; i++) {
    const g = grammar[i];
    if (g.role !== ROLE_MESSAGE) continue;
    const br = Math.floor(i / nSideG), bc = i % nSideG;
    const form = ref[g.form_id];
    const r0 = br * CR_CELL_SIZE, c0 = bc * CR_CELL_SIZE;
    for (const [pr, pc] of formSteganoPositions(form, sweepOfColor)) {
      if (ni >= symbols.length) break;
      const gr = r0 + pr, gc = c0 + pc;
      if (gr >= 0 && gr < gridSize && gc >= 0 && gc < gridSize) grid[gr][gc] = (symbols[ni] + masks[ni]) % ALPHA_LEN;
      ni++;
    }
  }
  const nMsgOut = grammar.filter(g => g.role === ROLE_MESSAGE).length;
  return { grid, info: { referent_index: refIdx, mode: 'individual', meta_mode: false, n_msg_blocks: nMsgOut, capacity_chars: max_message_for(nPos) } };
}

/** decode_carter_random(grid, masterKey, opts) -> message. Mode individuel uniquement. */
export async function decode_carter_random(grid, masterKey, opts = {}) {
  const { gridSize = CR_GRID_SIZE } = opts;
  const { xchacha_key, grammar_key } = await carter256_split(masterKey);
  const { gkCtr, metaMode, grammar, refIdx } = await findRandomGrammarWithCPub(grammar_key, gridSize);
  if (metaMode) throw new Error('decode_carter_random : mode méta pas encore porté en JS (aucun vecteur ne le requiert actuellement).');

  const sweepOfColor = {};
  for (const c of RANDOM_STEGANO_COLORS) sweepOfColor[c] = await derive_sweep_index(gkCtr, c);
  const ref = await get_referent6x6(refIdx);
  const nSideG = Math.floor(gridSize / CR_CELL_SIZE);
  const masks = await derive_masks(gkCtr, gridSize * gridSize, LABELS.mask_seed.info_random);

  const vals = [];
  let ni = 0;
  for (let i = 0; i < grammar.length; i++) {
    const g = grammar[i];
    if (g.role !== ROLE_MESSAGE) continue;
    const br = Math.floor(i / nSideG), bc = i % nSideG;
    const form = ref[g.form_id];
    const r0 = br * CR_CELL_SIZE, c0 = bc * CR_CELL_SIZE;
    for (const [pr, pc] of formSteganoPositions(form, sweepOfColor)) {
      const gr = r0 + pr, gc = c0 + pc;
      if (gr >= 0 && gr < gridSize && gc >= 0 && gc < gridSize) {
        vals.push(((grid[gr][gc] - masks[ni]) % ALPHA_LEN + ALPHA_LEN) % ALPHA_LEN);
      }
      ni++;
    }
  }
  return decrypt(vals, xchacha_key, vals.length);
}

// ═══════════════════════════════════════════════════════════════════════
// secu_box.py — déni plausible (Den.Encode/Encode0/Decode). Réutilise
// carter256_split (même fonction que Carter-256/Random — c'est elle qui
// est nommée _carter_split côté Python), select_referent_index et
// get_referent6x6 (référents 6×6 de referent6x6_gen.py, comme
// Carter-Random). Diffère de tous les autres modes sur deux points :
//   - « mode crypto » : les 36 cases d'un bloc portent toutes de
//     l'information (pas seulement les 12 cases stéganographiques de
//     Carter-Random), sur les 4 couleurs du référent dans l'ordre
//     déclaré par referent6x6_gen.CRYPTO_COLOR_ORDER.
//   - le chiffrement utilise sk (rsk ou dsk) directement comme clé
//     XChaCha20-Poly1305 — pas de moitié xchacha_key issue du split ;
//     carter256_split n'est appelée que pour sa grammar_key (positions,
//     formes, masques). Voir secu_box._place_deniable/_read_deniable.
// L'ensemble des blocs (π, puis Br/Bd) est indépendant de toute clé —
// tiré par CSPRNG (pas par HKDF) — et peut être injecté (_pi) pour le
// mode vecteurs. Vérifié contre vectors/carter_v3.json::deniable-basic-01.
// ═══════════════════════════════════════════════════════════════════════
const DENIABLE_COLOR_ORDER = ['blue', 'orange', 'green', 'yellow'];

function csprngRandBelow(n) {
  if (!(n > 0)) throw new Error(`csprngRandBelow : n doit être positif (reçu ${n}).`);
  const bytesNeeded = Math.max(1, Math.ceil(Math.log2(n) / 8));
  const limit = Math.pow(256, bytesNeeded);
  const usable = limit - (limit % n);
  for (;;) {
    const buf = crypto.getRandomValues(new Uint8Array(bytesNeeded));
    let val = 0;
    for (const b of buf) val = val * 256 + b;
    if (val < usable) return val % n;
  }
}

function fisherYatesCSPRNG(n) {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = csprngRandBelow(i + 1);
    const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  return order;
}

function splitBrBd(pi) {
  const n = pi.length;
  const half = Math.floor(n / 2);
  const Br = pi.slice(0, half);
  const Bd = (n % 2) ? pi.slice(half + 1) : pi.slice(half);
  return { Br, Bd };
}

function validatePermutation(pi, nBlocks) {
  const sorted = [...pi].sort((a, b) => a - b);
  for (let i = 0; i < nBlocks; i++) {
    if (sorted[i] !== i) throw new Error(`_pi doit être une permutation de range(${nBlocks}).`);
  }
}

function deniablePositionsForm(form, sweepOfColor) {
  const cellsByNiveau = { 0: {} };
  for (const c of DENIABLE_COLOR_ORDER) cellsByNiveau[0][c] = form[c];
  return cryptoReadingOrder(cellsByNiveau, DENIABLE_COLOR_ORDER, R6_GRID_SIZE, sweepOfColor);
}

async function deniableFormIds(grammarKey, nBlocks) {
  const bytes = await hkdf_sha256(grammarKey, LABELS.deniable.form_salt, LABELS.deniable.form_info, nBlocks);
  return Array.from(bytes);
}

async function deniablePositions(blockIndices, sk, N, B) {
  const { grammar_key } = await carter256_split(sk);
  const refIdx = await select_referent_index(grammar_key);
  const ref = await get_referent6x6(refIdx);
  const sweepOfColor = {};
  for (const c of DENIABLE_COLOR_ORDER) sweepOfColor[c] = await derive_sweep_index(grammar_key, c);
  const formIds = await deniableFormIds(grammar_key, blockIndices.length);
  const positions = [];
  for (let blk = 0; blk < blockIndices.length; blk++) {
    const idx = blockIndices[blk];
    const br = Math.floor(idx / B), bc = idx % B;
    const form = ref[formIds[blk]];
    for (const [r, c] of deniablePositionsForm(form, sweepOfColor)) {
      const gr = br * R6_GRID_SIZE + r, gc = bc * R6_GRID_SIZE + c;
      if (gr >= 0 && gr < N && gc >= 0 && gc < N) positions.push([gr, gc]);
    }
  }
  return positions;
}

async function placeDeniable(grid, N, B, blockIndices, message, sk, inject = {}) {
  const { _nonce = null, _y = null, _leftover = null } = inject;
  const L = blockIndices.length * (R6_GRID_SIZE * R6_GRID_SIZE);
  const payload = await encrypt(message, sk, L, _nonce);
  const symbols = payload_to_symbols(payload, L, { _y, _leftover });
  const positions = await deniablePositions(blockIndices, sk, N, B);
  const { grammar_key } = await carter256_split(sk);
  const masks = await derive_masks(grammar_key, L, LABELS.mask_seed.info_deniable);
  for (let ni = 0; ni < positions.length; ni++) {
    if (ni >= symbols.length) break;
    const [gr, gc] = positions[ni];
    grid[gr][gc] = (symbols[ni] + masks[ni]) % ALPHA_LEN;
  }
}

async function readDeniable(grid, N, B, blockIndices, sk) {
  const { grammar_key } = await carter256_split(sk);
  const L = blockIndices.length * (R6_GRID_SIZE * R6_GRID_SIZE);
  const masks = await derive_masks(grammar_key, L, LABELS.mask_seed.info_deniable);
  const positions = await deniablePositions(blockIndices, sk, N, B);
  const vals = positions.map(([gr, gc], ni) => ((grid[gr][gc] - masks[ni]) % ALPHA_LEN + ALPHA_LEN) % ALPHA_LEN);
  return decrypt(vals, sk, vals.length);
}

export async function encode_deniable(realMessage, duressMessage, opts = {}) {
  const {
    gridSize = 90, _rsk = null, _dsk = null, _pi = null, _noiseSeed = null,
    _realInject = {}, _duressInject = {},
  } = opts;
  const N = gridSize, B = Math.floor(N / 6);
  const nBlocks = B * B;
  const grid = random_grid(N, N, _noiseSeed);
  const rsk = _rsk || crypto.getRandomValues(new Uint8Array(32));
  const dsk = _dsk || crypto.getRandomValues(new Uint8Array(32));
  let pi;
  if (_pi) { validatePermutation(_pi, nBlocks); pi = [..._pi]; }
  else pi = fisherYatesCSPRNG(nBlocks);
  const { Br, Bd } = splitBrBd(pi);
  await placeDeniable(grid, N, B, Br, realMessage, rsk, _realInject);
  await placeDeniable(grid, N, B, Bd, duressMessage, dsk, _duressInject);
  return { grid, dk_r: { steg_key: rsk, blocks: Br }, dk_d: { steg_key: dsk, blocks: Bd } };
}

export async function encode_deniable0(duressMessage, opts = {}) {
  const { gridSize = 90, _dsk = null, _pi = null, _noiseSeed = null, _duressInject = {} } = opts;
  const N = gridSize, B = Math.floor(N / 6);
  const nBlocks = B * B;
  const grid = random_grid(N, N, _noiseSeed);
  const dsk = _dsk || crypto.getRandomValues(new Uint8Array(32));
  let pi;
  if (_pi) { validatePermutation(_pi, nBlocks); pi = [..._pi]; }
  else pi = fisherYatesCSPRNG(nBlocks);
  const { Bd } = splitBrBd(pi);
  await placeDeniable(grid, N, B, Bd, duressMessage, dsk, _duressInject);
  return { grid, dk_d: { steg_key: dsk, blocks: Bd } };
}

export async function decode_deniable(grid, keys, opts = {}) {
  const { gridSize = 90 } = opts;
  const N = gridSize, B = Math.floor(N / 6);
  return readDeniable(grid, N, B, keys.blocks, keys.steg_key);
}
