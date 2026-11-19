#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_galerie_unifies_texte.mjs — la FAQ et la figure de la galerie des Patterns Unifiés disent le critère exact (prompt 208, B).
//
// Sur les quatre pages de la galerie (fr, en, es, th) :
//   1. la FAQ visible (<details class="faq-item">) et la FAQ des données structurées (FAQPage) disent la même chose, question par question ;
//   2. la réponse sur les « contraintes » énonce le critère du demi-décalage (décalage de six cases, teintes échangées, tools/filtre_unified.py) ;
//   3. l'ancienne formulation a disparu : « (teinte unique sur les deux moitiés de 6 niveaux) isole 8 des 15 familles », « deux contraintes définissent » ;
//   4. la figure (<figure class="figure-demi-decalage">) porte une image, un alt précis et une légende, et ce qu'ils disent est ce que les données
//      produisent : la construction nommée dans <desc> du SVG (famille, hexagramme), les teintes qui s'échangent d'une grille à l'autre, d = s.
//
// Usage : node tools/check_galerie_unifies_texte.mjs [--essai]
//   --essai : l'ancienne formulation remise, une FAQ structurée qui diverge, une figure ou un alt retirés, doivent être vus.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = { fr: 'galerie-patterns-unifies.html', en: 'en/three-colour-gallery/index.html', es: 'es/galeria-tricolor/index.html', th: 'th/three-colour-gallery/index.html' };
// ce que la réponse « contraintes » doit dire, et ce qui ne doit plus s'y lire
const CRITERE = {
  fr: ['critère du demi-décalage', 'six cases', 'échangeant ses deux teintes', 'tools/filtre_unified.py'],
  en: ['half-shift criterion', 'six cells', 'swapping its two construction tints', 'tools/filtre_unified.py'],
  es: ['criterio del semidesplazamiento', 'seis casillas', 'intercambiando sus dos matices', 'tools/filtre_unified.py'],
  th: ['เกณฑ์การเลื่อนครึ่งคาบ', 'หกช่อง', 'สลับโทนสี', 'tools/filtre_unified.py'],
};
const ANCIEN = {
  fr: ['teinte unique sur les deux moitiés', 'isole 8 des 15', 'Deux contraintes définissent'],
  en: ['a single tint on both 6-level halves', 'singles out 8 of the 15', 'Two constraints define'],
  es: ['un único matiz en las dos mitades', 'aísla 8 de las 15', 'Dos restricciones definen'],
  th: ['โทนสีเดียวบนทั้งสองครึ่ง', 'แยกตระกูล 8 จาก 15', 'ข้อกำหนดสองข้อนิยาม'],
};
const lire = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
const sansTags = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

function defauts(brut, lang, rel) {
  const d = [];
  // 1. la FAQ visible, la FAQ structurée
  const visibles = [...brut.matchAll(/<details class="faq-item">\s*<summary>([\s\S]*?)<span class="q-mark">[\s\S]*?<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [sansTags(m[1]), sansTags(m[2])]);
  let structurees = [];
  for (const m of brut.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch { continue; }
    const noeuds = Array.isArray(j) ? j : j['@graph'] ? j['@graph'] : [j];
    for (const n of noeuds) if (n && n['@type'] === 'FAQPage') structurees = n.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]);
  }
  if (!visibles.length) d.push(`${rel} : pas de FAQ visible`);
  if (!structurees.length) d.push(`${rel} : pas de FAQPage dans les données structurées`);
  if (visibles.length !== structurees.length) d.push(`${rel} : ${visibles.length} questions visibles, ${structurees.length} dans les données structurées`);
  visibles.forEach(([q, r], i) => {
    const s = structurees[i];
    if (!s) return;
    if (q !== s[0]) d.push(`${rel} : question ${i + 1} : visible « ${q.slice(0, 50)} » ≠ structurée « ${s[0].slice(0, 50)} »`);
    if (r !== s[1].replace(/\s+/g, ' ').trim()) d.push(`${rel} : réponse ${i + 1} : le texte visible et le texte structuré diffèrent`);
  });
  // 2. le critère exact, dans la réponse aux « contraintes » (deuxième question)
  const reponse2 = (visibles[1] || ['', ''])[1];
  for (const mot of CRITERE[lang]) if (!reponse2.includes(mot)) d.push(`${rel} : la réponse sur les contraintes ne dit pas « ${mot} »`);
  // 3. l'ancienne formulation
  const faq = visibles.map((v) => v.join(' ')).join(' ') + ' ' + structurees.map((v) => v.join(' ')).join(' ');
  for (const mot of ANCIEN[lang]) if (faq.includes(mot)) d.push(`${rel} : la FAQ porte encore l'ancienne formulation « ${mot} »`);
  // 4. la figure
  const fig = /<figure class="figure-demi-decalage">([\s\S]*?)<\/figure>/.exec(brut);
  if (!fig) { d.push(`${rel} : pas de <figure class="figure-demi-decalage">`); return d; }
  const img = /<img src="([^"]*demi-decalage-patterns-unifies\.svg)"[^>]*\balt="([^"]*)"/.exec(fig[1]);
  const legende = /<figcaption>([\s\S]*?)<\/figcaption>/.exec(fig[1]);
  if (!img) { d.push(`${rel} : la figure n'a pas d'image demi-decalage-patterns-unifies.svg avec un alt`); return d; }
  if (img[2].trim().length < 150) d.push(`${rel} : alt trop court (${img[2].trim().length} caractères, 150 au moins : il doit dire ce qu'on voit)`);
  if (!legende || sansTags(legende[1]).length < 150) d.push(`${rel} : <figcaption> absente ou trop courte`);
  let desc = null;
  try {
    const svg = lire('assets/figures/demi-decalage-patterns-unifies.svg');
    desc = JSON.parse(/<desc>([\s\S]*?)<\/desc>/.exec(svg)[1]);
  } catch (e) { d.push(`${rel} : assets/figures/demi-decalage-patterns-unifies.svg illisible (${e.message})`); }
  if (desc) {
    if (desc.d_egale_s !== true) d.push(`${rel} : la figure montre une construction où d ≠ s`);
    const echange = JSON.stringify(desc.g_vers_d || []) === JSON.stringify(['magenta>violet', 'violet>magenta']);
    if (!echange) d.push(`${rel} : l'alt dit que les cases violettes et magenta s'échangent ; la figure échange ${JSON.stringify(desc.g_vers_d)}`);
    const texte = `${img[2]} ${legende ? sansTags(legende[1]) : ''}`;
    if (!texte.includes(desc.famille)) d.push(`${rel} : ni l'alt ni la légende ne nomment la famille de la figure (${desc.famille})`);
    if (!new RegExp(`(n°|no\\.|n\\.º|ที่)\\s*${desc.hexagramme}\\b`).test(texte)) d.push(`${rel} : ni l'alt ni la légende ne nomment l'hexagramme de la figure (n° ${desc.hexagramme})`);
    if (!texte.includes(desc.teinteA) || !texte.includes(desc.teinteB)) d.push(`${rel} : l'alt et la légende ne nomment pas les teintes ${desc.teinteA} et ${desc.teinteB}`);
  }
  return d;
}

const echecs = [];
for (const [lang, rel] of Object.entries(PAGES)) echecs.push(...defauts(lire(rel), lang, rel));

if (process.argv.includes('--essai')) {
  const fr = lire(PAGES.fr);
  const reponse2 = /<summary>Quelles sont les contraintes[\s\S]*?<p>([\s\S]*?)<\/p>/.exec(fr)[1];
  const cas = {
    "l'ancienne formulation remise": fr.split(reponse2).join('Deux contraintes définissent un Unified Pattern. La première contrainte (teinte unique sur les deux moitiés de 6 niveaux) isole 8 des 15 familles.'),
    'une FAQ structurée qui diverge': fr.replace(/("text": ")Un seul critère décide/, '$1Un critère décide'),
    'la figure retirée': fr.replace(/<figure class="figure-demi-decalage">[\s\S]*?<\/figure>/, ''),
    "l'alt vidé": fr.replace(/(<img src="[^"]*demi-decalage[^"]*"[^>]*\balt=")[^"]*"/, '$1"'),
    'la famille de la figure oubliée': fr.split('BASE-YANG').join('X'),
  };
  let manques = 0;
  for (const [nom, html] of Object.entries(cas)) {
    const vus = defauts(html, 'fr', 'essai-fr');
    if (vus.length) console.log(`vu    ${nom} : ${vus[0].replace('essai-fr : ', '')}`);
    else { manques++; console.error(`MANQUÉ ${nom}`); }
  }
  if (manques) { console.error(`\n${manques} défaut(s) posé(s) non vus.`); process.exit(1); }
  console.log(`--essai : les ${Object.keys(cas).length} défauts posés sont tous vus.`);
}
if (echecs.length) { for (const e of echecs) console.error(`ÉCHEC ${e}`); process.exit(1); }
console.log(`OK    Galerie des Patterns Unifiés : FAQ visible = FAQ structurée, critère du demi-décalage énoncé, ancienne formulation absente, figure décrite par ses données, sur ${Object.keys(PAGES).length} pages.`);
