/**
 * test_hchacha20.mjs — Vecteur draft-irtf-cfrg-xchacha-03 pour hchacha20.js
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Port JS v3 — Étape 1.2. Vecteur recopié tel quel depuis le texte brut
 * du draft (https://www.ietf.org/archive/id/draft-irtf-cfrg-xchacha-03.txt,
 * §2.2.1), jamais reconstruit de mémoire.
 *
 * Exécutable en Node (`node js/test_hchacha20.mjs`) et dans le navigateur
 * (voir js/test_hchacha20.html).
 */

import { hchacha20 } from './hchacha20.js';

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

  // draft-irtf-cfrg-xchacha-03 §2.2.1 — Test Vector for the HChaCha20 Block Function
  {
    const key = hexToBytes(
      '00:01:02:03:04:05:06:07:08:09:0a:0b:0c:0d:0e:0f:' +
      '10:11:12:13:14:15:16:17:18:19:1a:1b:1c:1d:1e:1f');
    const nonce = hexToBytes('00:00:00:09:00:00:00:4a:00:00:00:00:31:41:59:27');
    // "Resultant HChaCha20 subkey", chaque groupe de 8 chiffres hex déjà
    // sous forme d'octets little-endian sérialisés (voir le draft : ce
    // sont les mots 0..3 puis 12..15 de l'état après permutation, chacun
    // converti en 4 octets little-endian avant concaténation).
    const expected = hexToBytes(
      '82413b42 27b27bfe d30e4250 8a877d73' +
      'a0f9e4d5 8a74a853 c12ec413 26d3ecdc');
    const subkey = hchacha20(key, nonce);
    results.push(assertEqualBytes(subkey, expected, 'draft-xchacha-03 §2.2.1 — sous-clé HChaCha20'));
  }

  return results;
}

if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  try {
    const results = runTests();
    for (const r of results) console.log('  ' + r);
    console.log(`\n${results.length}/${results.length} vecteurs HChaCha20 conformes.`);
  } catch (e) {
    console.error('ÉCHEC :', e.message);
    process.exit(1);
  }
}
