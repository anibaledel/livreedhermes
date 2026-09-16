/**
 * test_chacha20.mjs — Vecteurs RFC 8439 pour chacha20.js
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.1. Vecteurs recopiés tels quels depuis le texte
 * brut de la RFC (https://www.rfc-editor.org/rfc/rfc8439.txt), jamais
 * reconstruits de mémoire — voir §2.3.2 et §2.4.2.
 *
 * Exécutable en Node (`node js/test_chacha20.mjs`) et dans le navigateur
 * (voir js/test_chacha20.html) : aucune API spécifique à l'un ou l'autre,
 * seulement Uint8Array/DataView.
 */

import { chacha20Block, chacha20 } from './chacha20.js';

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
  if (a !== e) {
    throw new Error(`${label} : ÉCHEC\n  attendu : ${e}\n  obtenu  : ${a}`);
  }
  return `${label} : OK (${expected.length} octets)`;
}

export function runTests() {
  const results = [];

  // RFC 8439 §2.3.2 — Test Vector for the ChaCha20 Block Function
  {
    const key = hexToBytes(
      '00:01:02:03:04:05:06:07:08:09:0a:0b:0c:0d:0e:0f:' +
      '10:11:12:13:14:15:16:17:18:19:1a:1b:1c:1d:1e:1f');
    const nonce = hexToBytes('00:00:00:09:00:00:00:4a:00:00:00:00');
    const counter = 1;
    const expected = hexToBytes(
      '10 f1 e7 e4 d1 3b 59 15 50 0f dd 1f a3 20 71 c4' +
      'c7 d1 f4 c7 33 c0 68 03 04 22 aa 9a c3 d4 6c 4e' +
      'd2 82 64 46 07 9f aa 09 14 c2 d7 05 d9 8b 02 a2' +
      'b5 12 9c d1 de 16 4e b9 cb d0 83 e8 a2 50 3c 4e');
    const block = chacha20Block(key, counter, nonce);
    results.push(assertEqualBytes(block, expected, 'RFC 8439 §2.3.2 — bloc ChaCha20'));
  }

  // RFC 8439 §2.4.2 — Example and Test Vector for the ChaCha20 Cipher
  {
    const key = hexToBytes(
      '00:01:02:03:04:05:06:07:08:09:0a:0b:0c:0d:0e:0f:' +
      '10:11:12:13:14:15:16:17:18:19:1a:1b:1c:1d:1e:1f');
    const nonce = hexToBytes('00:00:00:00:00:00:00:4a:00:00:00:00');
    const counter = 1;
    const plaintext = new TextEncoder().encode(
      "Ladies and Gentlemen of the class of '99: If I could offer you only one tip " +
      'for the future, sunscreen would be it.');
    if (plaintext.length !== 114) {
      throw new Error(`Plaintext Sunscreen : longueur ${plaintext.length}, 114 attendue`);
    }
    const expected = hexToBytes(
      '6e 2e 35 9a 25 68 f9 80 41 ba 07 28 dd 0d 69 81' +
      'e9 7e 7a ec 1d 43 60 c2 0a 27 af cc fd 9f ae 0b' +
      'f9 1b 65 c5 52 47 33 ab 8f 59 3d ab cd 62 b3 57' +
      '16 39 d6 24 e6 51 52 ab 8f 53 0c 35 9f 08 61 d8' +
      '07 ca 0d bf 50 0d 6a 61 56 a3 8e 08 8a 22 b6 5e' +
      '52 bc 51 4d 16 cc f8 06 81 8c e9 1a b7 79 37 36' +
      '5a f9 0b bf 74 a3 5b e6 b4 0b 8e ed f2 78 5e 42' +
      '87 4d');
    const ciphertext = chacha20(key, counter, nonce, plaintext);
    results.push(assertEqualBytes(ciphertext, expected, 'RFC 8439 §2.4.2 — chiffrement ChaCha20'));
    // Symétrie : déchiffrer le ciphertext avec les mêmes paramètres redonne le clair.
    const roundtrip = chacha20(key, counter, nonce, ciphertext);
    results.push(assertEqualBytes(roundtrip, plaintext, 'RFC 8439 §2.4.2 — round-trip (symétrie XOR)'));
  }

  return results;
}

// Exécution directe en Node (`node js/test_chacha20.mjs`) ; le navigateur
// importe runTests() depuis test_chacha20.html sans déclencher ce bloc
// (process n'existe pas côté navigateur).
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  try {
    const results = runTests();
    for (const r of results) console.log('  ' + r);
    console.log(`\n${results.length}/${results.length} vecteurs ChaCha20 conformes (RFC 8439).`);
  } catch (e) {
    console.error('ÉCHEC :', e.message);
    process.exit(1);
  }
}
