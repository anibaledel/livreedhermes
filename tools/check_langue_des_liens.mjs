#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_langue_des_liens.mjs — un lien mène à la page dans la langue de celle
// qui le porte, quand cette page existe.
//
// Audit du 7 octobre 2026 : creation-motifs-yi-king.html (lang="fr") envoyait
// deux fois vers /motifs/ (lang="en") alors que /fr/motifs/ existe. Le relevé a
// trouvé 2 284 liens du même genre sur 909 pages (192 autres portent une requête) : pieds de page, fils
// d'Ariane, pages d'hexagrammes et de motifs écrits avant que la page visée
// n'existe dans la langue. Ils se composent désormais depuis scripts/langues.js
// (adresseDans) ; ce contrôle empêche qu'ils reviennent.
//
// Pour chaque page (<html lang="X">) et chaque lien <a href> interne, il lit la
// page visée : si elle est en langue Y ≠ X et qu'elle déclare un équivalent en
// X (<link rel="alternate" hreflang="X">), le lien est en faute.
//
// Ne sont PAS en faute :
//   - le lien vers l'équivalent de la page elle-même (rangée « Autres
//     langues », drapeaux, original d'un article traduit) : changer de langue
//     est son objet ;
//   - le lien qui dit sa langue (hreflang) vers une édition du livre : choisir
//     l'édition est son objet ;
//   - le lien qui porte une requête (« ?chrono=12 ») : son paramètre n'a pas
//     forcément de sens sur l'équivalent — listé à part, à décider.
//
// Un lien vers une page d'une autre langue SANS équivalent (« Soutenir »,
// les outils restés en français) doit l'ANNONCER avant le clic : hreflang, et
// la langue en clair (« Tools (French) ») — décision d'Anibal, 7 octobre 2026 ;
// scripts/langues.js (annonceVers, annoncerLiens) le pose. Un lien silencieux
// est en faute. Les liens annoncés sont comptés, et listés avec --liste.
//
// Usage : node tools/check_langue_des_liens.mjs           contrôle
//         node tools/check_langue_des_liens.mjs --liste   + la liste des liens sans équivalent
//         node tools/check_langue_des_liens.mjs --essai   montre qu'il échoue sur les deux fautes

import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://anibal-amiot.com/';
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'sources', 'docs']);
const LIVRES = /^(fr\/livre|en\/book|es\/libro|th\/book|zh\/book|ru\/book|pt\/book|hi\/book)\/index\.html$/;

function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) pages(abs, acc);
    else if (e.name.endsWith('.html')) acc.push(abs);
  }
  return acc;
}

const memo = new Map();
function lire(f, essai) {
  if (essai && essai.has(f)) return essai.get(f);
  if (memo.has(f)) return memo.get(f);
  let r = null;
  if (fs.existsSync(f) && fs.statSync(f).isFile()) {
    const s = fs.readFileSync(f, 'utf8');
    const lang = (/<html[^>]*\slang="([^"]+)"/i.exec(s) || [])[1] || null;
    const alt = {};
    for (const m of s.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) alt[m[1]] = m[2];
    r = { s, lang, alt };
  }
  memo.set(f, r);
  return r;
}

// le fichier du dépôt qu'un lien désigne, ou null s'il sort du site
function cible(page, href) {
  const u = href.replace(/&amp;/g, '&').split('#')[0];
  const sans = u.split('?')[0];
  let rel;
  if (u.startsWith(SITE)) rel = sans.slice(SITE.length);
  else if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(u) || u === '') return null;
  else if (u.startsWith('/')) rel = sans.slice(1);
  else rel = path.relative(RACINE, path.resolve(path.dirname(page), sans));
  let f = path.join(RACINE, rel);
  if (rel === '' || rel.endsWith('/') || (fs.existsSync(f) && fs.statSync(f).isDirectory())) f = path.join(f, 'index.html');
  return { f, requete: u.includes('?') };
}
const urlDe = (f) => SITE + path.relative(RACINE, f).replace(/(^|\/)index\.html$/, '$1');

function controler(liste, essai) {
  const fautes = [], sansEquivalent = [], requetes = [];
  for (const page of liste) {
    const p = lire(page, essai);
    if (!p || !p.lang) continue;
    const corps = p.s.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<script[\s\S]*?<\/script>/gi, '');
    const moi = urlDe(page);
    for (const m of corps.matchAll(/<a\b([^>]*)>/gi)) {
      const href = (/\shref="([^"]*)"/.exec(m[1]) || [])[1];
      if (href === undefined) continue;
      const annonce = (/\shreflang="([^"]*)"/.exec(m[1]) || [])[1] || '';
      const c = cible(page, href);
      if (!c || c.f.includes(`${path.sep}book-viewer${path.sep}`)) continue;
      const t = lire(c.f, essai);
      if (!t || !t.lang || t.lang === p.lang) continue;
      const bon = t.alt[p.lang];
      const rel = path.relative(RACINE, page), relCible = path.relative(RACINE, c.f);
      const cas = { page: rel, lang: p.lang, href, cible: relCible, langCible: t.lang, annonce, bon };
      if (!bon) { sansEquivalent.push(cas); continue; }
      if (bon === moi) continue;                              // changer de langue est l'objet du lien
      if (annonce && LIVRES.test(relCible)) continue;         // le choix d'une édition
      if (c.requete) { requetes.push(cas); continue; }
      fautes.push(cas);
    }
  }
  return { fautes, sansEquivalent, requetes };
}

const toutes = pages(RACINE);

if (process.argv.includes('--essai')) {
  // un lien faussé : la page anglaise « About » renvoie vers le contact français
  const f = path.join(RACINE, 'en/about/index.html');
  // et un lien muet vers une page restée en français (carter-demo.html ; ce
  // furent fonds-ecran.html puis encodeur.html, jusqu'à leur traduction en/es/th)
  const s = lire(f).s.replace('</main>', `<a href="${SITE}contact.html">x</a><a href="${SITE}carter-demo.html">y</a></main>`);
  const { fautes, sansEquivalent } = controler([f], new Map([[f, { ...lire(f), s }]]));
  const muet = sansEquivalent.some((x) => x.href === `${SITE}carter-demo.html` && !x.annonce);
  if (!fautes.some((x) => x.href === `${SITE}contact.html`) || !muet) {
    console.error('ÉCHEC de l\'essai : en/about/ → contact.html (équivalent : en/contact/) ou → carter-demo.html sans annonce n\'a pas été relevé.');
    process.exit(1);
  }
  console.log('Essai : les deux liens faussés (en/about/ → contact.html ; → carter-demo.html sans annonce) sont bien relevés.');
  process.exit(0);
}

const { fautes, sansEquivalent, requetes } = controler(toutes);
const nPages = (l) => new Set(l.map((x) => x.page)).size;
console.log(`Pages lues : ${toutes.length}.`);
console.log(`Liens vers une autre langue SANS équivalent dans la langue de la page : ${sansEquivalent.length} sur ${nPages(sansEquivalent)} pages (${sansEquivalent.filter((x) => x.annonce).length} annoncés par hreflang, ${sansEquivalent.filter((x) => !x.annonce).length} sans annonce).`);
console.log(`Liens à requête vers une page qui a un équivalent (à décider, non contrôlés) : ${requetes.length} sur ${nPages(requetes)} pages.`);
if (process.argv.includes('--liste')) {
  const g = new Map();
  for (const x of sansEquivalent) {
    const k = `${x.lang} → ${x.langCible}\t${x.cible}\t${x.annonce ? 'annoncé' : 'sans annonce'}`;
    g.set(k, (g.get(k) || 0) + 1);
  }
  for (const [k, n] of [...g].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(6)}\t${k}`);
  const r = new Map();
  for (const x of requetes) { const k = `${x.lang}\t${x.href.replace(/=[^&]*/g, '=…')}\t→ ${x.bon}`; r.set(k, (r.get(k) || 0) + 1); }
  for (const [k, n] of r) console.log(`${String(n).padStart(6)}\trequête\t${k}`);
}
const muets = sansEquivalent.filter((x) => !x.annonce);
for (const x of muets.slice(0, 50)) console.error(`MUET ${x.page} (${x.lang}) : « ${x.href} » est en ${x.langCible}, sans équivalent — le lien doit l'annoncer (hreflang et la langue en clair)`);
if (fautes.length) {
  for (const x of fautes.slice(0, 50)) console.error(`ÉCART ${x.page} (${x.lang}) : « ${x.href} » est en ${x.langCible}, l'équivalent en ${x.lang} existe : ${x.bon}`);
  if (fautes.length > 50) console.error(`… et ${fautes.length - 50} autres.`);
  console.error(`\n${fautes.length} lien(s) sur ${nPages(fautes)} page(s) visent une autre langue alors que la page existe dans la leur.`);
  console.error('Composer le lien depuis scripts/langues.js (adresseDans, urlDans) plutôt que de l\'écrire.');
  process.exit(1);
}
if (muets.length) {
  console.error(`\n${muets.length} lien(s) sur ${nPages(muets)} page(s) mènent à une autre langue sans l'annoncer.`);
  console.error('Poser l\'annonce depuis scripts/langues.js (annonceVers, annoncerLiens).');
  process.exit(1);
}
console.log('Aucun lien ne vise une autre langue quand la page existe dans celle de la page, et chaque changement de langue est annoncé.');
