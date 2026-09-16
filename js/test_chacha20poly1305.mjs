/**
 * test_chacha20poly1305.mjs — Vecteur RFC 8439 §2.8.2 pour chacha20poly1305.js
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.4. Vecteur recopié tel quel depuis le texte brut
 * de la RFC (§2.8.2), jamais reconstruit de mémoire.
 *
 * Exécutable en Node (`node js/test_chacha20poly1305.mjs`) et dans le
 * navigateur (voir js/test_chacha20poly1305.html).
 */

import { aeadEncrypt, aeadDecrypt, poly1305KeyGen } from './chacha20poly1305.js';

function hexToBytes(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(':');
}

function assertEqualBytes(actual, expected, label) {
  const a = bytesToHex(actual), e = bytesToHex(expected);
  if (a !== e) throw new Error(`${label} : ÉCHEC\n  attendu : ${e}\n  obtenu  : ${a}`);
  return `${label} : OK (${expected.length} octets)`;
}

export function runTests() {
  const results = [];

  const key = hexToBytes(
    '80:81:82:83:84:85:86:87:88:89:8a:8b:8c:8d:8e:8f:' +
    '90:91:92:93:94:95:96:97:98:99:9a:9b:9c:9d:9e:9f');
  // Nonce = "32-bit fixed-common part" (constant, sender id=7) ‖ IV — RFC 8439 §2.8.2.
  const nonce = hexToBytes('07:00:00:00:40:41:42:43:44:45:46:47');
  const aad = hexToBytes('50:51:52:53:c0:c1:c2:c3:c4:c5:c6:c7');
  const plaintext = new TextEncoder().encode(
    "Ladies and Gentlemen of the class of '99: If I could offer you only one tip " +
    'for the future, sunscreen would be it.');

  // Vecteur intermédiaire : clé Poly1305 générée (§2.6, mot 0..31 du bloc compteur=0).
  {
    const expectedOtk = hexToBytes(
      '7b:ac:2b:25:2d:b4:47:af:09:b6:7a:55:a4:e9:55:84:' +
      '0a:e1:d6:73:10:75:d9:eb:2a:93:75:78:3e:d5:53:ff');
    const otk = poly1305KeyGen(key, nonce);
    results.push(assertEqualBytes(otk, expectedOtk, 'RFC 8439 §2.8.2 — clé Poly1305 générée'));
  }

  const expectedCiphertext = hexToBytes(
    'd3:1a:8d:34:64:8e:60:db:7b:86:af:bc:53:ef:7e:c2:' +
    'a4:ad:ed:51:29:6e:08:fe:a9:e2:b5:a7:36:ee:62:d6:' +
    '3d:be:a4:5e:8c:a9:67:12:82:fa:fb:69:da:92:72:8b:' +
    '1a:71:de:0a:9e:06:0b:29:05:d6:a5:b6:7e:cd:3b:36:' +
    '92:dd:bd:7f:2d:77:8b:8c:98:03:ae:e3:28:09:1b:58:' +
    'fa:b3:24:e4:fa:d6:75:94:55:85:80:8b:48:31:d7:bc:' +
    '3f:f4:de:f0:8e:4b:7a:9d:e5:76:d2:65:86:ce:c6:4b:' +
    '61:16');
  const expectedTag = hexToBytes('1a:e1:0b:59:4f:09:e2:6a:7e:90:2e:cb:d0:60:06:91');

  const { ciphertext, tag } = aeadEncrypt(key, nonce, plaintext, aad);
  results.push(assertEqualBytes(ciphertext, expectedCiphertext, 'RFC 8439 §2.8.2 — ciphertext AEAD'));
  results.push(assertEqualBytes(tag, expectedTag, 'RFC 8439 §2.8.2 — tag AEAD'));

  const decrypted = aeadDecrypt(key, nonce, ciphertext, tag, aad);
  results.push(assertEqualBytes(decrypted, plaintext, 'RFC 8439 §2.8.2 — déchiffrement + vérification du tag'));

  // Rejet attendu : tag altéré.
  {
    const badTag = new Uint8Array(tag); badTag[0] ^= 0xff;
    let threw = false;
    try { aeadDecrypt(key, nonce, ciphertext, badTag, aad); }
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
    console.log(`\n${results.length}/${results.length} vérifications AEAD_CHACHA20_POLY1305 conformes.`);
  } catch (e) {
    console.error('ÉCHEC :', e.message);
    process.exit(1);
  }
}
