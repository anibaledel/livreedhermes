#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande (contact : page « À propos » du site)
//
// build-versions-modules.mjs — une VERSION sur chaque module JavaScript de « Voir sa musique » (prompt 202, ajout).
//
// Pourquoi : GitHub Pages sert les modules JS avec max-age=14400 (4 h) et le HTML avec max-age=600 (10 min). Après un
// déploiement, un visiteur peut donc recevoir le NOUVEAU html avec l'ANCIEN code (le bouton « Plus d'options »
// s'affiche sans rien faire). Une adresse qui change avec le contenu règle cela : chaque import porte `?v=<hash court
// du fichier importé>`, et la balise <script type="module"> des 11 pages porte celui de assets/musique-chladni-ui.js.
//
// Le hash est celui du contenu SERVI (sha256, 10 premiers caractères hexadécimaux). Il se calcule de bas en haut :
//   feuilles (moteur, config, textes, couleurs, bicolore-fonds, cles-axes : aucune n'importe rien)
//   → musique-chladni-semaine.js (importe textes) → musique-chladni-ui.js (importe tout le reste)
// de sorte que changer une feuille change le hash de ses importateurs, donc celui de la balise du HTML. Les feuilles
// ne sont JAMAIS modifiées (le moteur non plus) : seuls les imports de semaine et de ui, et le HTML, le sont.
// Les adresses sont les mêmes partout (le module de textes importé par ui et par semaine reste UNE seule instance).
// Aucun service worker ne liste ces fichiers (encodeur-sw.js ne précache que l'encodeur) : rien à y suivre.
//
// Usage : node scripts/build-versions-modules.mjs            écrit
//         node scripts/build-versions-modules.mjs --verifie  échoue si un hash ne correspond pas au contenu
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), VERIFIE = process.argv.includes('--verifie');
const A = (n) => path.join(ROOT, 'assets', n);
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 10);
const FEUILLES = ['musique-chladni-moteur.js', 'musique-chladni-config.js', 'musique-chladni-textes.js', 'couleurs.js', 'bicolore-fonds.js', 'cles-axes.js'];
const IMPORTEURS = [['musique-chladni-semaine.js', ['musique-chladni-textes.js']], ['musique-chladni-ui.js', [...FEUILLES, 'musique-chladni-semaine.js']]];
const PAGES = ['musique-chladni.html', 'en/see-your-music/index.html', 'es/ver-tu-musica/index.html', 'th/see-your-music/index.html', 'zh/see-your-music/index.html', 'ru/see-your-music/index.html',
  'pt/see-your-music/index.html', 'hi/see-your-music/index.html', 'de/see-your-music/index.html', 'it/see-your-music/index.html', 'ja/see-your-music/index.html'];
const echappe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const versions = {}, ecarts = [], ecrits = [];
for (const f of FEUILLES) versions[f] = hash(fs.readFileSync(A(f)));
for (const [fichier, deps] of IMPORTEURS) {
  let t = fs.readFileSync(A(fichier), 'utf8');
  for (const d of deps) {
    const re = new RegExp(`(['"])\\./${echappe(d)}(\\?v=[0-9a-f]+)?\\1`, 'g');
    const trouves = [...t.matchAll(re)];
    if (!trouves.length) { ecarts.push(`${fichier} : aucun import de ${d}`); continue; }
    for (const m of trouves) if (m[2] !== `?v=${versions[d]}`) ecarts.push(`${fichier} : import de ${d} → ${m[2] || 'sans version'}, attendu ?v=${versions[d]}`);
    t = t.replace(re, `$1./${d}?v=${versions[d]}$1`);
  }
  if (!VERIFIE && t !== fs.readFileSync(A(fichier), 'utf8')) { fs.writeFileSync(A(fichier), t); ecrits.push(`assets/${fichier}`); }
  versions[fichier] = hash(VERIFIE ? fs.readFileSync(A(fichier), 'utf8') : t);
}
// les 11 pages : la balise <script type="module"> importe musique-chladni-ui.js avec la version de ce fichier
for (const p of PAGES) {
  const f = path.join(ROOT, p), t = fs.readFileSync(f, 'utf8');
  const re = /(assets\/musique-chladni-ui\.js)(\?v=[0-9a-f]+)?(["'])/g, trouves = [...t.matchAll(re)];
  if (trouves.length !== 1) { ecarts.push(`${p} : ${trouves.length} import(s) de musique-chladni-ui.js, 1 attendu`); continue; }
  if (trouves[0][2] !== `?v=${versions['musique-chladni-ui.js']}`) ecarts.push(`${p} : musique-chladni-ui.js → ${trouves[0][2] || 'sans version'}, attendu ?v=${versions['musique-chladni-ui.js']}`);
  const neuf = t.replace(re, `$1?v=${versions['musique-chladni-ui.js']}$3`);
  if (!VERIFIE && neuf !== t) { fs.writeFileSync(f, neuf); ecrits.push(p); }
}
if (VERIFIE) {
  if (ecarts.length) { for (const e of ecarts) console.error(`ÉCART ${e}`); console.error('Relancer node scripts/build-versions-modules.mjs'); process.exit(1); }
  console.log(`Versions des modules de « Voir sa musique » : ${FEUILLES.length + IMPORTEURS.length} fichiers, ui ?v=${versions['musique-chladni-ui.js']}, 11 pages concordantes.`);
} else console.log(ecrits.length ? `Écrit : ${ecrits.join(', ')}` : 'Rien à écrire.');
