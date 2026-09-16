/**
 * test_poly1305.mjs — Vecteur RFC 8439 §2.5.2 pour poly1305.js
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.3. Vecteur recopié tel quel depuis le texte brut
 * de la RFC (§2.5.2), jamais reconstruit de mémoire.
 *
 * Exécutable en Node (`node js/test_poly1305.mjs`) et dans le navigateur
 * (voir js/test_poly1305.html).
 */

import { poly1305Mac } from './poly1305.js';

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

  // RFC 8439 §2.5.2 — Poly1305 Example and Test Vector
  {
    const key = hexToBytes(
      '85:d6:be:78:57:55:6d:33:7f:44:52:fe:42:d5:06:a8:' +
      '01:03:80:8a:fb:0d:b2:fd:4a:bf:f6:af:41:49:f5:1b');
    const message = new TextEncoder().encode('Cryptographic Forum Research Group');
    if (message.length !== 34) throw new Error(`Message : longueur ${message.length}, 34 attendue`);
    const expected = hexToBytes('a8:06:1d:c1:30:51:36:c6:c2:2b:8b:af:0c:01:27:a9');
    const tag = poly1305Mac(message, key);
    results.push(assertEqualBytes(tag, expected, 'RFC 8439 §2.5.2 — tag Poly1305'));
  }

  return results;
}

if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  try {
    const results = runTests();
    for (const r of results) console.log('  ' + r);
    console.log(`\n${results.length}/${results.length} vecteurs Poly1305 conformes.`);
  } catch (e) {
    console.error('ÉCHEC :', e.message);
    process.exit(1);
  }
}
