/**
 * test_xchacha20poly1305.mjs — Vecteur draft-irtf-cfrg-xchacha-03 §A.3.1
 * pour xchacha20poly1305.js
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.5. Vecteur recopié tel quel depuis le texte brut
 * du draft (https://www.ietf.org/archive/id/draft-irtf-cfrg-xchacha-03.txt,
 * annexe A.3.1), jamais reconstruit de mémoire.
 *
 * Exécutable en Node (`node js/test_xchacha20poly1305.mjs`) et dans le
 * navigateur (voir js/test_xchacha20poly1305.html).
 */

import { xchacha20Poly1305Encrypt, xchacha20Poly1305Decrypt } from './xchacha20poly1305.js';
import { poly1305KeyGen } from './chacha20poly1305.js';
import { hchacha20 } from './hchacha20.js';

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

export function runTests() {
  const results = [];

  // draft-irtf-cfrg-xchacha-03 annexe A.3.1 — AEAD_XCHACHA20_POLY1305
  const key = hexToBytes('808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f');
  const nonce = hexToBytes('404142434445464748494a4b4c4d4e4f5051525354555657'); // 24 octets
  const aad = hexToBytes('50515253c0c1c2c3c4c5c6c7');
  const plaintext = hexToBytes(
    '4c616469657320616e642047656e746c656d656e206f662074686520636c6173' +
    '73206f66202739393a204966204920636f756c64206f6666657220796f75206f' +
    '6e6c79206f6e652074697020666f7220746865206675747572652c2073756e73' +
    '637265656e20776f756c642062652069742e');

  // Vecteur intermédiaire : sous-clé HChaCha20 (premiers 16 octets du nonce).
  // Non publiée séparément dans le draft (seule "Poly1305 Key" l'est,
  // dérivée en aval) — vérifiée ici indirectement via poly1305KeyGen ci-dessous.
  const subkey = hchacha20(key, nonce.subarray(0, 16));

  // Vecteur intermédiaire : clé Poly1305 (RFC 8439 §2.6, sous-clé + nonce
  // interne 4 zéros ‖ 8 derniers octets du nonce étendu).
  {
    const expectedPolyKey = hexToBytes(
      '7b191f80f361f099094f6f4b8fb97df847cc6873a8f2b190dd73807183f907d5');
    const innerNonce = new Uint8Array(12);
    innerNonce.set(nonce.subarray(16, 24), 4);
    const polyKey = poly1305KeyGen(subkey, innerNonce);
    results.push(assertEqualBytes(polyKey, expectedPolyKey, 'draft-xchacha-03 A.3.1 — clé Poly1305 générée'));
  }

  const expectedCiphertext = hexToBytes(
    'bd6d179d3e83d43b9576579493c0e939572a1700252bfaccbed2902c21396cbb' +
    '731c7f1b0b4aa6440bf3a82f4eda7e39ae64c6708c54c216cb96b72e1213b452' +
    '2f8c9ba40db5d945b11b69b982c1bb9e3f3fac2bc369488f76b2383565d3fff9' +
    '21f9664c97637da9768812f615c68b13b52e');
  const expectedTag = hexToBytes('c0875924c1c7987947deafd8780acf49');

  const { ciphertext, tag } = xchacha20Poly1305Encrypt(key, nonce, plaintext, aad);
  results.push(assertEqualBytes(ciphertext, expectedCiphertext, 'draft-xchacha-03 A.3.1 — ciphertext'));
  results.push(assertEqualBytes(tag, expectedTag, 'draft-xchacha-03 A.3.1 — tag'));

  const decrypted = xchacha20Poly1305Decrypt(key, nonce, ciphertext, tag, aad);
  results.push(assertEqualBytes(decrypted, plaintext, 'draft-xchacha-03 A.3.1 — déchiffrement + vérification du tag'));

  // Rejet attendu : tag altéré.
  {
    const badTag = new Uint8Array(tag); badTag[0] ^= 0xff;
    let threw = false;
    try { xchacha20Poly1305Decrypt(key, nonce, ciphertext, badTag, aad); }
    catch (e) { threw = true; }
    if (!threw) throw new Error('Tag altéré accepté à tort — ÉCHEC');
    results.push('Rejet du tag altéré : OK');
  }

  return results;
}

if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  try {
    const results = runTests();
    for (const r of results) console.log('  ' + r);
    console.log(`\n${results.length}/${results.length} vérifications AEAD_XCHACHA20_POLY1305 conformes.`);
  } catch (e) {
    console.error('ÉCHEC :', e.message);
    process.exit(1);
  }
}
