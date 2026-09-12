/**
 * test_hkdf.mjs — Vérifie HKDF-SHA256/HMAC-SHA256 via Web Crypto (RFC 5869)
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.6. Contrairement aux 5 primitives précédentes
 * (ChaCha20, HChaCha20, Poly1305, ChaCha20-Poly1305, XChaCha20-Poly1305),
 * il n'y a rien à écrire ici : HKDF-SHA256 et HMAC-SHA256 sont des
 * constructions entièrement spécifiées par leur RFC (5869 et 2104/4231),
 * sans marge d'implémentation — l'API Web Crypto native du navigateur
 * (crypto.subtle, déjà utilisée par js/crypto_core.js::hkdf/hmacSha256)
 * n'a donc aucune raison de diverger du calcul RFC-conformant fait côté
 * Python (module `cryptography`), et le rester en Web Crypto évite
 * d'auditer une implémentation maison sans bénéfice d'interopérabilité
 * (contrairement à ChaCha20, absent de Web Crypto).
 *
 * Ce fichier valide donc directement crypto.subtle (pas une fonction
 * réécrite) contre les vecteurs RFC 5869, avec `info`/`salt` en OCTETS
 * BRUTS (pas convertis depuis une chaîne UTF-8, contrairement à
 * l'usage habituel de crypto_core.js::hkdf où `info` est toujours un
 * libellé texte) — c'est la primitive générale qui est vérifiée ici,
 * indépendamment de cette convention d'appel.
 *
 * Exécutable en Node (`node js/test_hkdf.mjs`, Node >= 20 : Web Crypto
 * globale) et dans le navigateur (voir js/test_hkdf.html).
 */

function hexToBytes(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function assertEqualBytes(actual, expected, label) {
  const a = bytesToHex(actual), e = bytesToHex(expected);
  if (a !== e) throw new Error(`${label} : ÉCHEC\n  attendu : ${e}\n  obtenu  : ${a}`);
  return `${label} : OK (${expected.length} octets)`;
}

async function hkdfRaw(ikm, salt, info, length) {
  const baseKey = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, baseKey, length * 8);
  return new Uint8Array(bits);
}

export async function runTests() {
  const results = [];

  // RFC 5869 §A.1 — Test Case 1 : cas de base, SHA-256
  {
    const ikm  = hexToBytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b');
    const salt = hexToBytes('000102030405060708090a0b0c');
    const info = hexToBytes('f0f1f2f3f4f5f6f7f8f9');
    const expected = hexToBytes(
      '3cb25f25faacd57a90434f64d0362f2a' +
      '2d2d0a90cf1a5a4c5db02d56ecc4c5bf' +
      '34007208d5b887185865');
    const okm = await hkdfRaw(ikm, salt, info, 42);
    results.push(assertEqualBytes(okm, expected, 'RFC 5869 §A.1 (Test Case 1) — HKDF-SHA256'));
  }

  // RFC 5869 §A.3 — Test Case 3 : salt et info de longueur nulle
  {
    const ikm  = hexToBytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b');
    const salt = new Uint8Array(0);
    const info = new Uint8Array(0);
    const expected = hexToBytes(
      '8da4e775a563c18f715f802a063c5a31' +
      'b8a11f5c5ee1879ec3454e5f3c738d2d' +
      '9d201395faa4b61a96c8');
    const okm = await hkdfRaw(ikm, salt, info, 42);
    results.push(assertEqualBytes(okm, expected, 'RFC 5869 §A.3 (Test Case 3, salt/info vides) — HKDF-SHA256'));
  }

  return results;
}

if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  try {
    const results = await runTests();
    for (const r of results) console.log('  ' + r);
    console.log(`\n${results.length}/${results.length} vecteurs HKDF-SHA256 conformes (Web Crypto native, RFC 5869).`);
  } catch (e) {
    console.error('ÉCHEC :', e.message);
    process.exit(1);
  }
}
