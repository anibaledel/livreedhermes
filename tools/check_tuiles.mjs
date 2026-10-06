#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_tuiles.mjs — les tuiles de navigation (les boutons animés du bas de
// page) sont sur TOUTES les adresses du sitemap, dans la langue de la page.
//
// Le relevé du 2026-10-04 en trouvait 242 sans tuiles sur 859 — familles
// entières (hexagrammes FR/ES/TH, pages des six langues, livre et chapitres),
// parce que l'ajout se décidait page par page. Ce contrôle échoue sur :
//   1. une adresse du sitemap dont la page n'a aucune tuile, hors de la liste
//      SANS_TUILES de scripts/nav-tiles.js (chacune avec sa raison) ;
//   2. un bloc engendré (@navtiles) qui n'est pas celui que nav-tiles.js
//      écrirait pour cette page, dans la langue de son <html lang> : libellés,
//      groupes ET adresses — une tuile qui renvoie au français alors que la
//      page traduite existe, c'est l'asymétrie de la régression hreflang #137 ;
//   3. une page dont le bloc est posé hors zone (hexagrammes traduits, par leur
//      générateur) sans les cinq catégories de la langue de la page — et,
//      depuis la navigation en catégories (2026-10-05), toute page qui porte
//      encore des tuiles à plat écrites à la main.
// Il donne aussi, par langue, les destinations sans page traduite (la tuile y
// garde l'adresse française).
//
// Le contrôle MORD : --essai retire, en mémoire, les tuiles d'une page du
// sitemap et met une adresse française sur une page anglaise ; il doit échouer
// sur les deux.
//
// Usage : node tools/check_tuiles.mjs [--essai]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { SANS_TUILES, CATEGORIES, htmlNavTiles, sansTraduction } = require('../scripts/nav-tiles.js');
const { LANGUES } = require('../scripts/langues.js');
const { TRADUITES_A_LA_MAIN } = require('../scripts/pages-traduites.js');
const essai = process.argv.includes('--essai');

const urls = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>https:\/\/anibal-amiot\.com\/([^<]*)<\/loc>/g)].map((m) => m[1]);
const erreurs = [];
let avecZone = 0, aLaMain = 0, exclues = 0;
const parLangue = {};
let mutations = essai ? 2 : 0;

for (const u of urls) {
  const rel = !u || u.endsWith('/') ? `${u}index.html` : u;
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) { erreurs.push(`${u} : dans le sitemap, pas de fichier ${rel}`); continue; }
  let s = fs.readFileSync(f, 'utf8');
  const m = /<html[^>]*\slang="([a-z]{2})/i.exec(s);
  const lang = m && LANGUES[m[1].toLowerCase()] ? m[1].toLowerCase() : 'fr';
  if (essai && mutations === 2 && rel === 'es/index.html') { s = s.replace(/<!-- @navtiles:start[\s\S]*?<!-- @navtiles:end -->/, ''); mutations--; }
  if (essai && mutations === 1 && rel.startsWith('motifs/')) { s = s.replace(/href="\.\.\/en\/lexicon\/"/, 'href="../lexique.html"'); mutations--; }
  if (SANS_TUILES.has(rel)) { exclues++; continue; }
  parLangue[lang] = (parLangue[lang] || 0) + 1;
  if (!s.includes('class="nav-tile"')) { erreurs.push(`${rel} (${lang}) : aucune tuile`); continue; }
  const zone = s.match(/<!-- @navtiles:start[^\n]*\n([\s\S]*?)\n<!-- @navtiles:end -->/);
  if (zone) {
    avecZone++;
    const prefixe = '../'.repeat(rel.split('/').length - 1);
    const seules = TRADUITES_A_LA_MAIN.has(rel) && !s.includes('<!-- @footer:start');
    const attendu = htmlNavTiles(rel, prefixe, lang, seules);
    if (zone[1].trim() !== attendu.trim()) {
      const a = [...zone[1].matchAll(/href="([^"]*)"/g)].map((x) => x[1]);
      const b = [...attendu.matchAll(/href="([^"]*)"/g)].map((x) => x[1]);
      const k = a.findIndex((x, i) => x !== b[i]);
      erreurs.push(`${rel} (${lang}) : le bloc de tuiles n'est pas celui de nav-tiles.js pour cette langue`
        + (k > -1 ? ` — adresse « ${a[k]} » au lieu de « ${b[k]} »` : ' (libellés)') + ' ; relancer node scripts/build-header.js');
    }
  } else {
    aLaMain++;
    // hors zone : les hexagrammes traduits, dont le générateur pose le bloc
    // lui-même (htmlNavTiles) — ses catégories doivent être celles de la
    // langue de la page ; des tuiles à plat écrites à la main n'ont plus cours
    const titres = [...s.matchAll(/<span class="nav-cat-titre">([^<]*)<\/span>/g)].map((x) => x[1]);
    const voulus = CATEGORIES.map((c) => c[lang] || c.fr);
    if (!titres.length) erreurs.push(`${rel} (${lang}) : tuiles à plat écrites à la main, sans les catégories de nav-tiles.js`);
    else if (titres.join('|') !== voulus.join('|')) erreurs.push(`${rel} (${lang}) : catégories « ${titres.join(', ')} », attendu « ${voulus.join(', ')} »`);
  }
}

const manques = sansTraduction();
console.log(`${urls.length} adresses du sitemap : ${avecZone} avec le bloc engendré, ${aLaMain} avec des tuiles écrites à la main, ${exclues} exclue(s) (SANS_TUILES).`);
console.log(`Par langue de page : ${Object.entries(parLangue).map(([l, n]) => `${l} ${n}`).join(' · ')}`);
console.log('Destinations sans page traduite (la tuile garde l\'adresse française) :');
for (const [l, ids] of Object.entries(manques)) if (ids.length) console.log(`  ${l} (${ids.length}) : ${ids.join(', ')}`);

if (essai) {
  const vu = [erreurs.some((e) => e.startsWith('es/index.html') && e.includes('aucune tuile')), erreurs.some((e) => e.startsWith('motifs/') && e.includes('adresse'))];
  if (vu.every(Boolean)) { console.log(`\nEssai : tuiles retirées d'une page et adresse française sur une page anglaise — le contrôle échoue bien sur les deux :\n  ${erreurs.slice(0, 2).join('\n  ')}`); process.exit(0); }
  console.error(`\nEssai : le contrôle ne voit pas ${vu[0] ? '' : 'les tuiles retirées '}${vu[1] ? '' : "l'adresse française"}.`); process.exit(1);
}
if (erreurs.length) { for (const e of erreurs) console.error(`ÉCHEC ${e}`); console.error(`\n${erreurs.length} échec(s).`); process.exit(1); }
console.log('\nToutes les adresses du sitemap ont leurs tuiles, dans la langue de la page.');
