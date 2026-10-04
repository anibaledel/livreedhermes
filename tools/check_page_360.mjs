#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_page_360.mjs — la page des 360 calques affiche des nombres CALCULÉS,
// et ce sont ceux des données.
//
// « 4 096 calques », écrit à la main sur les quatre cartes, dans toutes les
// langues, était faux : 4 096 est le nombre de superpositions d'UN jeu, pas un
// nombre de calques. Ce contrôle recompte depuis les fichiers, sans rien lire
// de la page :
//   - data/referent_360_v3.json : 360 calques, 60 identités (famille, teinte) ;
//   - les cartes de chaque catégorie (assets/bases-cartes, par2-cartes,
//     par3-cartes, trait-cartes) : un jeu = 4 natures × 6 niveaux = 24
//     calques, donc jeux = cartes / 24 ; et la somme des cartes = 360 ;
//   - 4^6 superpositions par jeu, jeux × 4^6 tirages par catégorie.
// Puis il ouvre la page dans un navigateur, dans chacune des langues de son
// dictionnaire, et exige que les quatre cartes et la phrase portent ces
// nombres-là, dans cet ordre pour la phrase ; qu'il ne reste ni « {{ », ni
// « 4 096 calques », ni « × 4 teintes » ; que le texte servi avant le script
// (lecteurs sans JS, moteurs) soit le rendu français ; et que l'ancienne adresse
// impression.html mène à 360-calques.html en gardant ses paramètres.
//
// Le contrôle MORD : --essai sert la page avec un jeu de trop en catégorie IV,
// et il doit échouer.
//
// Usage : node tools/check_page_360.mjs [--base-url URL] [--essai]
//         (sans --base-url : le dépôt, servi en local)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const essai = process.argv.includes('--essai');
const i = process.argv.indexOf('--base-url');
let BASE = i > -1 ? process.argv[i + 1] : null;
let serveur = null;
if (!BASE) { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');

const erreurs = [];

// ---- 1. Les nombres, depuis les fichiers ---------------------------------
const ref = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/referent_360_v3.json'), 'utf8'));
const svgs = (d) => {
  let n = 0;
  const marche = (x) => { for (const e of fs.readdirSync(x, { withFileTypes: true })) { if (e.isDirectory()) marche(path.join(x, e.name)); else if (e.name.endsWith('.svg')) n++; } };
  marche(path.join(ROOT, 'assets', d));
  return n;
};
const NATURES = fs.readdirSync(path.join(ROOT, 'assets/trait-cartes'), { withFileTypes: true }).filter((e) => e.isDirectory()).length;
const NIVEAUX = 6;
const PAR_JEU = NATURES * NIVEAUX;
const cartes = { 1: svgs('bases-cartes'), 2: svgs('par2-cartes'), 3: svgs('par3-cartes'), 4: svgs('trait-cartes') };
const jeux = {};
for (const c of [1, 2, 3, 4]) {
  if (cartes[c] % PAR_JEU) erreurs.push(`catégorie ${c} : ${cartes[c]} cartes, pas un multiple de ${PAR_JEU}`);
  jeux[c] = cartes[c] / PAR_JEU;
}
const JEUX = jeux[1] + jeux[2] + jeux[3] + jeux[4];
const CALQUES = JEUX * PAR_JEU;
if (ref.calques.length !== ref.n_calques || CALQUES !== ref.n_calques) {
  erreurs.push(`référent : ${ref.calques.length} calques listés, n_calques ${ref.n_calques}, cartes ${CALQUES}`);
}
const identites = new Set(ref.calques.map((c) => `${c.famille}|${c.teinte}`)).size;
if (identites !== ref.n_identities || identites * NIVEAUX !== ref.n_calques) {
  erreurs.push(`référent : ${identites} identités pour n_identities ${ref.n_identities}`);
}
const SUPERPOS = NATURES ** NIVEAUX;
const tirages = (c) => jeux[c] * SUPERPOS;
const TOTAL = JEUX * SUPERPOS;
const f = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const attendus = {
  1: [jeux[1], tirages(1)], 2: [jeux[2], tirages(2)], 3: [jeux[3], tirages(3)], 4: [jeux[4], tirages(4)],
  // la phrase, dans l'ordre (l'exposant ⁶ n'est pas lu comme un nombre)
  r: [CALQUES, JEUX, NATURES, NIVEAUX, JEUX, PAR_JEU, NIVEAUX, NATURES, NATURES, SUPERPOS,
    jeux[1], tirages(1), jeux[2], tirages(2), jeux[3], tirages(3), jeux[4], tirages(4), TOTAL],
};
console.log(`Données : ${CALQUES} calques (référent ${ref.n_calques}), ${identites} identités ; jeux ${jeux[1]} + ${jeux[2]} + ${jeux[3]} + ${jeux[4]} = ${JEUX} de ${PAR_JEU} ; `
  + `${NATURES}^${NIVEAUX} = ${f(SUPERPOS)} superpositions par jeu ; ${f(TOTAL)} tirages.`);

// ---- 2. La page, dans un navigateur ---------------------------------------
const nombres = (s) => (s.match(/\d+(?: \d{3})*/g) || []).map((x) => Number(x.replace(/ /g, '')));
const contient = (lus, voulus) => { let k = 0; for (const n of lus) if (n === voulus[k]) k++; return k === voulus.length; };

const source = fs.readFileSync(path.join(ROOT, '360-calques.html'), 'utf8');
const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await navigateur.newContext();
if (essai) {
  await ctx.route('**/360-calques.html*', async (route) => {
    const r = await route.fetch();
    const corps = (await r.text()).replace('3: NATURE_SLUGS.length, 4: 1 }', '3: NATURE_SLUGS.length, 4: 2 }');
    await route.fulfill({ response: r, body: corps });
  });
}
const page = await ctx.newPage();
const langues = [...source.matchAll(/^  ([a-z]{2}): \{$/gm)].map((m) => m[1]);
const textes = async () => page.evaluate(() => {
  const o = {};
  for (const c of [1, 2, 3, 4]) o[c] = document.getElementById('txt-catMeta' + c).textContent;
  o.r = document.getElementById('txt-calquesRelation').textContent;
  return o;
});
let francais = null;
for (const lang of langues) {
  await page.goto(`${BASE}/360-calques.html?lang=${lang}`, { waitUntil: 'load' });
  const t = await textes();
  if (lang === 'fr') francais = t;
  for (const [k, voulus] of Object.entries(attendus)) {
    const ou = k === 'r' ? 'la phrase' : `la carte ${k}`;
    if (!contient(nombres(t[k]), voulus)) erreurs.push(`${lang}, ${ou} : « ${t[k]} » — nombres attendus ${voulus.map(f).join(', ')}`);
    if (/\{\{|4 096 (calques|layers|capas)|× 4 (teintes|tints|tonos)/.test(t[k])) erreurs.push(`${lang}, ${ou} : reste écrit à la main : « ${t[k]} »`);
  }
}
if (!langues.length) erreurs.push('aucune langue trouvée dans le dictionnaire de la page');
console.log(`Page : ${langues.length} langue(s) lue(s) (${langues.join(', ')}).`);

// le texte servi avant le script = le rendu français
const statique = (id) => {
  const m = source.match(new RegExp(`id="${id}">([^<]*)<`));
  return m ? m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&') : null;
};
for (const k of [1, 2, 3, 4, 'r']) {
  const id = k === 'r' ? 'txt-calquesRelation' : `txt-catMeta${k}`;
  if (francais && statique(id) !== francais[k]) erreurs.push(`${id} : le texte servi sans script diffère du rendu français :\n      servi : ${statique(id)}\n      rendu : ${francais[k]}`);
}

// l'ancienne adresse (elle vise l'adresse absolue du site : servie en local,
// cette adresse-là est interceptée, et c'est l'URL demandée qui est relue)
if (!BASE.startsWith('https://anibal-amiot.com')) {
  await ctx.route('https://anibal-amiot.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>360</p>' }));
}
await page.goto(`${BASE}/impression.html?cat=2&lang=en`, { waitUntil: 'load' });
const arrivee = new URL(page.url());
if (!arrivee.pathname.endsWith('/360-calques.html') || arrivee.searchParams.get('cat') !== '2') {
  erreurs.push(`impression.html?cat=2 mène à ${page.url()}, pas à 360-calques.html?cat=2`);
} else console.log('impression.html redirige vers 360-calques.html, paramètres gardés.');

await navigateur.close();
if (serveur) serveur.fermer();

if (essai) {
  if (erreurs.length) { console.log(`\nEssai : un jeu de trop en catégorie IV, le contrôle échoue bien (${erreurs.length} écart(s)) :\n  ${erreurs[0].split('\n')[0]}`); process.exit(0); }
  console.error('\nEssai : un jeu de trop en catégorie IV, et le contrôle ne le voit pas.'); process.exit(1);
}
if (erreurs.length) { for (const e of erreurs) console.error(`ÉCHEC ${e}`); process.exit(1); }
console.log('Les cartes et la phrase portent les nombres des données, dans chaque langue ; plus aucun nombre écrit à la main.');
