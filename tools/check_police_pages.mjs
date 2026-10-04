#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_police_pages.mjs — chaque caractère du texte d'une page surveillée se
// rend dans la pile de polices DÉCLARÉE, sans police du système.
//
// La pile est celle de assets/fonts.css (:root, body { font-family }) ; ses
// familles hébergées sont décrites par leurs @font-face (ce fichier et
// assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css) : source
// woff2, graisse, unicode-range. Un caractère est rendu par une famille si
// l'une de ses faces le couvre (unicode-range) ET le porte (table cmap, lue
// par tools/lib_woff2.mjs). Il doit l'être dans les deux graisses du texte
// (300, et 400 pour le gras). Sinon, le navigateur prendrait une police du
// système au milieu d'un mot : c'est ce que ce contrôle refuse.
//
// Le périmètre est une liste, parce que le site ne le tient pas encore
// partout : 824 pages emploient au moins un caractère hors des polices
// déclarées (les trigrammes ☰, les flèches ← →, du grec, de l'hébreu ; le
// thaï, sans repli déclaré). Une page s'y ajoute d'une ligne, quand elle
// tient.
//
// Usage : node tools/check_police_pages.mjs [page.html …]
//         node tools/check_police_pages.mjs --pile-sans 'Barlow Semi Condensed IAST LDH'
//           (retire une famille de la pile : montre que le contrôle mord)

import fs from 'node:fs';
import path from 'node:path';
import { cmapWoff2 } from './lib_woff2.mjs';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const PAGES = [
  'articles/le-fil-et-le-carre.html',
];
const FEUILLES = ['assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css', 'assets/fonts.css'];
const GRAISSES = [300, 400];

// ---- les familles déclarées -------------------------------------------------
function plages(texte) {
  if (!texte) return [[0, 0x10ffff]];
  return texte.split(',').map((p) => {
    const [a, b] = p.trim().replace(/^U\+/i, '').split('-');
    return [parseInt(a, 16), parseInt(b ?? a, 16)];
  });
}
const faces = [];
for (const rel of FEUILLES) {
  const css = fs.readFileSync(path.join(RACINE, rel), 'utf8');
  for (const [, bloc] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const famille = /font-family:\s*'([^']+)'/.exec(bloc)[1];
    const src = /url\('([^']+)'\)/.exec(bloc)[1];
    const g = /font-weight:\s*(\d+)(?:\s+(\d+))?/.exec(bloc);
    faces.push({
      famille,
      min: +g[1], max: +(g[2] ?? g[1]),
      plages: plages(/unicode-range:\s*([^;]+);/.exec(bloc)?.[1]),
      cmap: cmapWoff2(fs.readFileSync(path.join(RACINE, path.dirname(rel), src))),
    });
  }
}
const pileCss = /:root, body \{\s*font-family:\s*([^;]+);/.exec(fs.readFileSync(path.join(RACINE, 'assets/fonts.css'), 'utf8'))[1];
const args = process.argv.slice(2);
const sans = args.includes('--pile-sans') ? args[args.indexOf('--pile-sans') + 1] : null;
const pile = pileCss.split(',').map((f) => f.trim().replace(/^'|'$/g, ''))
  .filter((f) => faces.some((x) => x.famille === f) && f !== sans);

function rendu(cp, graisse) {
  for (const famille of pile) {
    const fs_ = faces.filter((f) => f.famille === famille && f.min <= graisse && graisse <= f.max
      && f.plages.some(([a, b]) => a <= cp && cp <= b));
    if (fs_.some((f) => f.cmap.has(cp))) return famille;
  }
  return null;
}

// ---- le texte d'une page ----------------------------------------------------
// Pour un article : son texte seul, du titre à la fin du corps — le gabarit
// commun (« ← Retour aux articles », « ← Précédent ») porte une flèche que
// Barlow hébergée n'a pas, comme les 824 pages hors périmètre : c'est l'autre
// chantier. Pour une autre page : tout le <body>.
const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function texte(html) {
  const a = html.indexOf('<h1 class="article-title"'), b = html.indexOf('<a class="article-back-bottom"');
  const corps = a >= 0 && b > a ? html.slice(a, b) : html.slice(html.indexOf('<body'));
  return corps
    .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => (e[0] === '#'
      ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1))
      : ENTITES[e] ?? m));
}

const pages = args.filter((a) => a.endsWith('.html'));
let echecs = 0;
for (const rel of pages.length ? pages : PAGES) {
  const car = new Set([...texte(fs.readFileSync(path.join(RACINE, rel), 'utf8'))].filter((c) => !/\s/.test(c) && c.codePointAt(0) >= 0x20));
  const absents = [];
  for (const c of car) {
    for (const g of GRAISSES) {
      if (!rendu(c.codePointAt(0), g)) { absents.push(`« ${c} » U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')} (graisse ${g})`); }
    }
  }
  if (absents.length) {
    echecs++;
    console.error(`ÉCHEC ${rel} : ${absents.length} rendu(s) hors des polices déclarées\n  ${absents.join('\n  ')}`);
  } else {
    console.log(`OK    ${rel} : ${car.size} caractères, tous dans la pile déclarée (${pile.join(', ')})`);
  }
}
if (echecs) {
  console.error(`\n${echecs} page(s) : un caractère tomberait sur une police du système. Déclarer un repli hébergé qui le porte (assets/fonts.css), voir tools/police_iast.py.`);
  process.exit(1);
}
