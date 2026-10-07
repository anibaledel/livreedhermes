#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_validation_html.mjs — chaque page du dépôt passe la validation HTML
// (html-validate, règles « recommended »), sur le texte servi.
//
// Pourquoi (7 octobre 2026) : le fil d'Ariane cassé de #247 — un <a> sans
// fermeture, un second <a> ouvert dedans — n'a été vu par aucun contrôle, parce
// qu'axe-core lit le DOM réparé par le navigateur. check_html_servi.mjs couvre
// désormais les liens ; une validation complète couvre toute la classe : le
// premier relevé a trouvé, en plus, un <main> mal fermé sur cinq pages (404,
// motifs bicolores en quatre langues), 2 560 canevas étiquetés sans rôle,
// 179 navigations sans nom distinct, un « & » brut sur 364 pages.
//
// Règles écartées, chacune pour une raison :
//   no-inline-style       le site pose des styles en ligne à dessein (3 917,
//                         dont les icônes des tuiles) : un choix, pas un défaut ;
//   long-title            les titres longs sont voulus pour la recherche ;
//   prefer-native-element la liste des familles (bicolore) est une liste à
//                         aperçu au survol, qu'un <select> ne sait pas faire ;
//   valid-id (relâchée)   « P+E95 » est un id valide en HTML : la règle stricte
//                         n'admet que lettres, chiffres, tiret et souligné.
// Exception, page par page : book-viewer/index.html porte deux <header> (le
// bandeau du site et celui de la visionneuse) ; les nommer touche le fragment
// d'en-tête de toutes les pages — à faire à part.
//
// Usage : node tools/check_validation_html.mjs           contrôle tout le dépôt
//         node tools/check_validation_html.mjs --releve  compte par règle, sans échouer
//         node tools/check_validation_html.mjs --essai   fausse une page et montre qu'il refuse
//   (html-validate s'installe à part : npm install html-validate@9.7.1)

import fs from 'node:fs';
import path from 'node:path';
import { HtmlValidate } from 'html-validate';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'sources']);
const CONFIG = {
  extends: ['html-validate:recommended'],
  rules: {
    'no-inline-style': 'off',
    'long-title': 'off',
    'prefer-native-element': 'off',
    'valid-id': ['error', { relaxed: true }],
  },
};
const EXCEPTIONS = { 'book-viewer/index.html': ['unique-landmark'] };

function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) pages(abs, acc);
    else if (e.name.endsWith('.html')) acc.push(abs);
  }
  return acc;
}

const hv = new HtmlValidate(CONFIG);
async function valider(texte, rel) {
  const r = await hv.validateString(texte, rel);
  const ecartees = EXCEPTIONS[rel] || [];
  return r.results.flatMap((x) => x.messages)
    .filter((m) => !ecartees.includes(m.ruleId))
    .map((m) => ({ rel, regle: m.ruleId, ligne: m.line, texte: m.message }));
}

if (process.argv.includes('--essai')) {
  const rel = 'fr/livre/index.html';
  const s = fs.readFileSync(path.join(RACINE, rel), 'utf8');
  const faussee = s.replace(/(<a href="[^"]*">)Accueil<\/a>/, '$1')            // le défaut de #247
    .replace('</main>', '');                                                     // un <main> jamais fermé
  const avant = await valider(s, rel), apres = await valider(faussee, rel);
  for (const e of apres) console.log(`  relevé : ${e.rel}:${e.ligne} [${e.regle}] ${e.texte}`);
  if (avant.length || !apres.some((e) => e.regle === 'element-permitted-content' || e.regle === 'close-order')) {
    console.error('ÉCHEC de l\'essai : la page faussée n\'est pas refusée, ou la page intacte l\'est.');
    process.exit(1);
  }
  console.log('Essai : la page faussée est refusée, la page intacte passe.');
  process.exit(0);
}

const toutes = pages(RACINE);
const ecarts = [];
for (const f of toutes) ecarts.push(...await valider(fs.readFileSync(f, 'utf8'), path.relative(RACINE, f)));
const parRegle = new Map();
for (const e of ecarts) parRegle.set(e.regle, (parRegle.get(e.regle) || 0) + 1);
if (process.argv.includes('--releve')) {
  for (const [r, n] of [...parRegle].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(6)}  ${r}`);
  console.log(`${toutes.length} pages, ${ecarts.length} écart(s).`);
  process.exit(0);
}
if (ecarts.length) {
  for (const e of ecarts.slice(0, 80)) console.error(`ÉCART ${e.rel}:${e.ligne} [${e.regle}] ${e.texte}`);
  if (ecarts.length > 80) console.error(`… et ${ecarts.length - 80} autres.`);
  console.error(`\n${ecarts.length} écart(s) à la validation HTML (${[...parRegle].map(([r, n]) => `${r} ${n}`).join(', ')}).`);
  process.exit(1);
}
console.log(`Validation HTML : ${toutes.length} pages conformes (html-validate, règles « recommended », écarts motivés dans l'en-tête).`);
