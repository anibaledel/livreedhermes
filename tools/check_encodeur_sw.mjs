/* ============================================================
   Vérifie que CACHE_VERSION dans encodeur-sw.js est bien l'empreinte
   SHA-256 (12 caractères hexadécimaux) du contenu des fichiers listés dans
   CACHED_URLS, dans l'ordre. Une version périmée laisserait les visiteurs
   réguliers sur l'ancien code de chiffrement, servi depuis le cache.

   Usage : node tools/check_encodeur_sw.mjs           échoue si périmée
           node tools/check_encodeur_sw.mjs --ecrit   la recalcule
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SW = path.join(ROOT, 'encodeur-sw.js');
const source = readFileSync(SW, 'utf8');

const bloc = /const CACHED_URLS = \[([\s\S]*?)\];/.exec(source);
const versionLue = /const CACHE_VERSION = '([0-9a-f]*)';/.exec(source);
if (!bloc || !versionLue) {
  console.error('encodeur-sw.js : CACHED_URLS ou CACHE_VERSION introuvable.');
  process.exit(1);
}
const urls = [...bloc[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const hash = createHash('sha256');
for (const u of urls) {
  hash.update(u + '\0');
  hash.update(readFileSync(path.join(ROOT, u)));
  hash.update('\0');
}
const attendue = hash.digest('hex').slice(0, 12);

if (process.argv.includes('--ecrit')) {
  writeFileSync(SW, source.replace(versionLue[0], `const CACHE_VERSION = '${attendue}';`));
  console.log(`CACHE_VERSION = ${attendue} (${urls.length} fichiers).`);
} else if (versionLue[1] !== attendue) {
  console.error(`CACHE_VERSION périmée : ${versionLue[1]}, attendu ${attendue}.`);
  console.error('Relancer : node tools/check_encodeur_sw.mjs --ecrit');
  process.exit(1);
} else {
  console.log(`CACHE_VERSION conforme (${attendue}, ${urls.length} fichiers).`);
}
