#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_redirections.mjs — les redirections du site, toutes, et ce qu'elles
// ne doivent pas faire.
//
// Une redirection est silencieuse quand elle marche et invisible quand elle
// boucle. Le déplacement de l'outil « fond d'écran fixe » (fonds-ecran.html →
// galerie-bicolore.html, 2026-10-03) en a ajouté une ; c'est la régression de
// #137 sous une autre forme qu'on veut empêcher : une règle globale qui ne se
// voit qu'une fois sur main.
//
// Sur TOUTES les pages du dépôt (lecture des fichiers, exhaustive) :
//   1. chaque redirection — meta refresh ou location.replace — est relevée,
//      avec sa cible ;
//   2. aucune ne renvoie vers sa propre page, ni vers une page qui redirige à
//      son tour (pas de chaîne de deux) ;
//   3. aucune des 512 pages de motifs (motifs/, fr/motifs/) ne redirige : elles
//      partagent des préfixes d'adresse avec le fond d'écran, et c'est par là
//      qu'une règle trop large attrape ce qu'elle ne devait pas. Les 512, pas
//      un échantillon ;
//   4. la redirection de fonds-ecran.html ne vise que ses anciennes adresses :
//      sa condition est relue et évaluée sur des adresses de l'animation, qui
//      ne doivent PAS partir.
// Le même rendu à l'arrivée (motif, fond, sup, c0, c1) est vérifié dans un
// navigateur par tools/check_fond_ecran_animation.mjs (section 7).
//
// Usage : node tools/check_redirections.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'docs', 'includes']);
function pages(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) pages(abs, acc);
    else if (e.name.endsWith('.html')) acc.push(path.relative(ROOT, abs).split(path.sep).join('/'));
  }
  return acc;
}

// les redirections d'une page : [type, cible]
function redirections(rel) {
  const s = readFileSync(path.join(ROOT, rel), 'utf8');
  const out = [];
  for (const m of s.matchAll(/<meta[^>]+http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"']+)["']/gi)) out.push(['meta refresh', m[1].trim()]);
  for (const m of s.matchAll(/location\.replace\(\s*(['"])([^'"]*)\1(\s*\+\s*location\.search)?/g)) out.push(['location.replace', m[2], !!m[3]]);
  return out;
}
const resoudre = (depuis, cible) => {
  const u = new URL(cible, `https://site/${depuis}`);
  if (u.host !== 'site' && u.host !== 'anibal-amiot.com') return null; // externe
  let p = decodeURI(u.pathname.slice(1));
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return p;
};

const echecs = [];
const toutes = pages(ROOT);
// fonds-ecran.html ne redirige QUE sous condition (ses anciennes adresses) :
// sa condition, relue dans la page, décide si une arrivée y repart
const fe = readFileSync(path.join(ROOT, 'fonds-ecran.html'), 'utf8');
const m = /\(function\(\)\{ var q = new URLSearchParams\(location\.search\);\s*if\(([^)]*\)[^\n]*)\)\s*\n\s*location\.replace/.exec(fe);
const cond = m && m[1];
const part = (search) => new Function('location', `var q = new URLSearchParams(location.search); return !!(${cond});`)({ search });
const repart = (dest, cible, retransmet) => {
  if (dest !== 'fonds-ecran.html') return true; // redirection inconditionnelle
  if (retransmet) return true;                   // n'importe quels paramètres peuvent arriver
  return part(new URL(cible, 'https://site/').search);
};
const parPage = new Map(toutes.map((p) => [p, redirections(p)]).filter(([, r]) => r.length));
for (const [src, rs] of parPage) {
  for (const [type, cible, retransmet] of rs) {
    const dest = resoudre(src, cible);
    console.log(`${src} → ${cible || '(vide)'} (${type})`);
    if (dest === null) continue;
    if (dest === src) echecs.push(`${src} redirige vers elle-même`);
    else if (!existsSync(path.join(ROOT, dest))) echecs.push(`${src} redirige vers ${dest}, qui n'existe pas`);
    else if (parPage.has(dest) && repart(dest, cible, retransmet)) echecs.push(`${src} → ${dest}, qui redirige à son tour : chaîne de deux`);
    else if (parPage.has(dest)) console.log(`   ${dest} redirige sous condition ; l'adresse transmise (« ${new URL(cible, 'https://site/').search || 'sans paramètre'} ») ne la remplit pas : pas de chaîne`);
  }
}
const motifs = toutes.filter((p) => /^(fr\/)?motifs\/[^/]+\.html$/.test(p));
const motifsRedirigent = motifs.filter((p) => parPage.has(p) || /galerie-bicolore\.html|fonds-ecran\.html\?/.test(readFileSync(path.join(ROOT, p), 'utf8').replace(/<a [^>]*>/g, '')));
if (motifs.length < 512) echecs.push(`${motifs.length} pages de motifs lues, 512 attendues (et leurs deux index)`);
for (const p of motifsRedirigent) echecs.push(`page de motif prise dans une redirection : ${p}`);
console.log(`${motifs.length} pages de motifs lues une à une : ${motifsRedirigent.length} redirection(s).`);

// la condition de fonds-ecran.html, évaluée telle qu'écrite dans la page
if (!m) echecs.push('fonds-ecran.html : la condition de redirection est introuvable (le contrôle ne sait plus la lire)');
else {
  const CAS = [
    ['?motif=bases-yang-h3&fond=B2&c0=c8102e', true], ['?motif=par2-yin-yang-h5', true],
    ['', false], ['?rendu=bicolore&fond=B2', false], ['?rendu=bicolore&motif=bases-yang-h0', false],
    ['?teinte=multi&motif=bases-yang-h0', false], ['?densite=7&motif=bases-yang-h0', false], ['?rythme=2.5', false], ['?fond=B2&c0=c8102e', false],
  ];
  for (const [search, attendu] of CAS) {
    if (part(search) !== attendu) echecs.push(`fonds-ecran.html${search} : ${attendu ? 'devrait partir vers la galerie' : 'ne doit pas partir'} (condition : ${cond})`);
  }
  console.log(`fonds-ecran.html : condition « ${cond} » — ${CAS.filter(([, a]) => a).length} anciennes adresses partent, ${CAS.filter(([, a]) => !a).length} adresses de l'animation restent.`);
}
if (echecs.length) { for (const e of echecs) console.error(`ÉCHEC ${e}`); process.exit(1); }
console.log(`${parPage.size} page(s) qui redirigent, aucune boucle ni chaîne ; les pages de motifs hors de toute redirection.`);
