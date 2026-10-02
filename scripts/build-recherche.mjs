#!/usr/bin/env node
/* ============================================================
   Index de la recherche interne (Pagefind), dans pagefind/.

   Le site est statique : la recherche tourne entièrement dans le navigateur,
   sur un index précalculé ici (fragments compressés, chargés à la demande —
   une recherche télécharge quelques dizaines de Ko, pas l'index entier).
   Pages de recherche : recherche.html (français), en/search/ (anglais),
   es/buscar/ (espagnol), th/search/ (thaï) ;
   Pagefind sépare l'index par langue d'après <html lang>.

   Pages indexées : toutes les pages HTML suivies par git, sauf
   - les fragments (includes/) et les pages de test (js/test_*) ;
   - les redirections (meta refresh) et les pages noindex — dont les pages de
     recherche elles-mêmes et la page après paiement.
   Seul le contenu propre de chaque page est indexé : en-tête, fil d'Ariane,
   rangée de langues, tuiles et pied de page, communs à toutes, sont exclus.

   L'index est régénéré et commité sur main à chaque push par
   .github/workflows/update-sitemap.yml (même GitHub App que le sitemap).
   En local : npm install pagefind@1, puis node scripts/build-recherche.mjs.
   ============================================================ */
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = path.join(ROOT, 'pagefind');

const EXCLUS = [
  '.skip-link', '.site-header', '.breadcrumb', '.other-langs',
  '.note', '.nav-tiles', '.share-buttons', '.site-footer',
];

const fichiers = execFileSync('git', ['ls-files', '-z', '*.html'], { cwd: ROOT })
  .toString().split('\0')
  .filter((f) => f && !f.startsWith('includes/') && !f.startsWith('js/test_') && !f.includes('node_modules/'));

const { index } = await pagefind.createIndex({ excludeSelectors: EXCLUS });
let n = 0;
for (const f of fichiers) {
  const html = readFileSync(path.join(ROOT, f), 'utf8');
  if (/http-equiv="refresh"/i.test(html)) continue;
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) continue;
  const url = '/' + f.replace(/(^|\/)index\.html$/, '$1');
  const { errors } = await index.addHTMLFile({ url, content: html });
  if (errors.length) throw new Error(`${f} : ${errors.join(' ; ')}`);
  n++;
}

rmSync(SORTIE, { recursive: true, force: true });
const { errors } = await index.writeFiles({ outputPath: SORTIE });
if (errors.length) throw new Error(errors.join(' ; '));
await pagefind.close();

// pagefind-entry.json liste les langues dans un ordre qui varie d'une
// exécution à l'autre : trié ici, pour qu'un index inchangé ne produise
// aucune différence à committer.
const entree = path.join(SORTIE, 'pagefind-entry.json');
const json = JSON.parse(readFileSync(entree, 'utf8'));
json.languages = Object.fromEntries(Object.entries(json.languages).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(entree, JSON.stringify(json));

console.log(`Index de recherche : ${n} pages, dans pagefind/.`);
