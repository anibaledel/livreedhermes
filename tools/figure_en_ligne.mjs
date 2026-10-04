#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// figure_en_ligne.mjs — une figure SVG d'article, incluse EN LIGNE dans sa
// page depuis son fichier, sans copie à la main.
//
// Pourquoi en ligne : un SVG chargé par <img> ne voit pas les polices de la
// page ; sa figure déclare font-family:inherit pour prendre celle du site
// (Barlow, et le repli IAST pour les translittérations) — ce qui ne marche
// que dans le document.
//
// Ce que le script fait du fichier, et rien d'autre :
//   - ses règles <style> sont restreintes à la figure (#<id> devant chaque
//     sélecteur) : en ligne, un « text{…} » ou un « .t{…} » s'appliquerait
//     sinon à toute la page ;
//   - son contenu est placé dans un <g id="<id>">, la vue large l'affiche ;
//   - les vues étroites (sous 640 px, colonne de grilles) sont de petits
//     <svg viewBox="cadrage"> qui RÉUTILISENT ce même <g> par <use> — une
//     seule figure dans la page, pas de copie.
// Le dessin, les textes, la description (aria-label) : inchangés.
//
// Usage : node tools/figure_en_ligne.mjs [--verifie]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// figure → page, et ses cadrages pour l'écran étroit (en unités du SVG)
const FIGURES = [{
  fichier: 'assets/articles/chadya-chadaka.svg',
  page: 'articles/le-fil-et-le-carre.html',
  id: 'fig-chadya',
  vues: [
    ['vue-grille', '36 38 252 308'], ['vue-operation', '290 172 80 50'],
    ['vue-grille', '372 38 252 308'], ['vue-operation', '626 172 80 50'],
    ['vue-grille', '708 38 252 308'], ['vue-formule', '250 360 496 34'],
  ],
}];
const VERIFIE = process.argv.includes('--verifie');
let perimes = 0;

for (const f of FIGURES) {
  const svg = fs.readFileSync(path.join(ROOT, f.fichier), 'utf8').trim();
  const ouv = /^<svg\b([^>]*)>/.exec(svg);
  if (!ouv) throw new Error(`${f.fichier} : pas de balise <svg> en tête`);
  const attrs = ouv[1];
  const viewBox = /viewBox="([^"]+)"/.exec(attrs)[1];
  const label = /aria-label="([^"]*)"/.exec(attrs)?.[1] || '';
  let corps = svg.slice(ouv[0].length).replace(/<\/svg>\s*$/, '').trim();
  // les règles de style, restreintes à la figure
  corps = corps.replace(/<style>([\s\S]*?)<\/style>/, (m, css) => '<style>' + css.replace(/(^|\})\s*([^{}]+)\{/g,
    (mm, fin, sel) => `${fin}\n  ${sel.split(',').map((s) => `#${f.id} ${s.trim()}`).join(', ')}{`) + '\n</style>');
  const vues = f.vues.map(([cls, vb]) => `    <svg class="vue ${cls}" viewBox="${vb}" aria-hidden="true" focusable="false"><use href="#${f.id}"/></svg>`).join('\n');
  const bloc = [
    `  <svg class="figure-large" viewBox="${viewBox}" role="img" aria-label="${label}">`,
    `  <g id="${f.id}">`,
    corps.split('\n').map((l) => `  ${l}`).join('\n'),
    '  </g>',
    '  </svg>',
    `  <div class="figure-etroite" role="img" aria-label="${label}">`,
    vues,
    '  </div>',
  ].join('\n') + '\n';
  const p = path.join(ROOT, f.page);
  const html = fs.readFileSync(p, 'utf8');
  const debut = `<!-- @figure:${f.id}:start — engendré par tools/figure_en_ligne.mjs depuis ${f.fichier}, ne pas éditer ici -->`;
  const fin = `<!-- @figure:${f.id}:end -->`;
  const i = html.indexOf(`<!-- @figure:${f.id}:start`), j = html.indexOf(fin);
  if (i < 0 || j < 0) throw new Error(`${f.page} : marqueurs @figure:${f.id} introuvables`);
  const nouveau = html.slice(0, i) + debut + '\n' + bloc + html.slice(j);
  if (nouveau === html) console.log(`OK    ${f.page} : ${f.fichier} en ligne, à jour`);
  else if (VERIFIE) { perimes++; console.error(`PÉRIMÉ ${f.page} : la figure en ligne ne correspond plus à ${f.fichier} (node tools/figure_en_ligne.mjs)`); }
  else { fs.writeFileSync(p, nouveau); console.log(`ÉCRIT ${f.page} : ${f.fichier} en ligne`); }
}
if (perimes) process.exit(1);
