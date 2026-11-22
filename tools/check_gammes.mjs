#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : voir LICENSE
//
// check_gammes.mjs — la page « Les gammes » (prompt 219) : gammes.html et en/pattern-scales/index.html.
//
// Statique : titre, description, canonique, Open Graph et Twitter avec l'affiche « Six gammes » (adresse absolue, dimensions) ; sept affiches 2:3 avec width/height, loading="lazy" et un alt ;
// chaque affiche existe (ou, si les images passent sur motifs-pins, est une adresse https) ; les six premières portent le lien de leur galerie (Tricolore → tricolore, les cinq autres → bicolore) ;
// chaque lien interne vise un fichier qui existe ; le bloc « Bientôt » ne porte que le lien du contact (ni date, ni prix, ni lien d'achat) ; la ligne de licence porte le DOI de concept ;
// aucun JSON-LD Dataset ; la page est au sitemap ; les deux galeries y renvoient ; l'empreinte du corpus de 256 est celle de data/corpus-256-depot.json.
// Navigateur (390 et 1280 px) : rien ne déborde à droite, les sept images se chargent à leur taille, ?r=pinterest|linkedin|facebook|instagram ne change rien et n'ajoute aucune requête hors du site,
// aucune erreur de console. Usage : node tools/check_gammes.mjs [local | <adresse de base>]
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const G = JSON.parse(readFileSync(path.join(ROOT, 'data/gammes.json'), 'utf8'));
let echecs = 0, controles = 0;
const ok = (c, m) => { controles++; if (!c) { echecs++; console.error(`ÉCHEC ${m}`); } };
const lire = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const fichierDe = (u) => (u.endsWith('/') ? `${u}index.html` : u);
const SITE = 'https://anibal-amiot.com';

for (const [l, A] of Object.entries(G.adresses)) {
  const f = fichierDe(A.page), h = lire(f), T = G.textes[l], canon = `${SITE}/${A.page}`;
  const meta = (re) => (re.exec(h) || [])[1];
  ok(meta(/<title>([^<]+)<\/title>/) === T.titre && meta(/<link rel="canonical" href="([^"]+)"/) === canon, `${f} : titre et canonique`);
  ok((meta(/<meta name="description" content="([^"]+)"/) || '').length > 60, `${f} : description`);
  const partage = G.images.base.startsWith('http') ? `${G.images.base}${G.images.partage}` : `${SITE}/${G.images.base}${G.images.partage}`;
  ok(meta(/<meta property="og:image" content="([^"]+)"/) === partage && meta(/<meta name="twitter:image" content="([^"]+)"/) === partage, `${f} : l'affiche « Six gammes » est l'image de partage (og et twitter)`);
  ok(meta(/<meta property="og:url" content="([^"]+)"/) === canon && /twitter:card" content="summary_large_image"/.test(h), `${f} : og:url et carte Twitter`);
  ok(!/"@type"\s*:\s*"Dataset"/.test(h), `${f} : aucun bloc Dataset`);
  ok(new RegExp(`<html lang="${l}"`).test(h), `${f} : lang`);
  // les affiches
  const imgs = [...h.matchAll(/<img src="([^"]+)" width="(\d+)" height="(\d+)" loading="lazy" decoding="async" alt="([^"]+)">/g)];
  ok(imgs.length === 7, `${f} : sept affiches (${imgs.length})`);
  imgs.forEach((m, i) => {
    ok(+m[2] === 1000 && +m[3] === 1500, `${f} : l'affiche ${i + 1} déclare 1000 × 1500`);
    ok(m[4].length > 40 && /64/.test(m[4]), `${f} : l'affiche ${i + 1} a un alt qui dit les 64 motifs`);
    const cible = m[1].startsWith('http') ? null : path.join(ROOT, path.dirname(f), m[1]);
    ok(m[1].startsWith('http') || (existsSync(cible)), `${f} : l'affiche ${i + 1} existe (${m[1]})`);
  });
  ok(G.affiches.map((a) => a.nom).join() === 'Tricolore,Ellipses,Chevrons,Trois bandes,Bande centrale,Bandes larges,Six gammes', 'ordre des affiches');
  // les liens vers les galeries
  const figs = [...h.matchAll(/<figure class="gm-affiche" id="([^"]+)">([\s\S]*?)<\/figure>/g)];
  for (const [, id, corps] of figs) {
    const a = G.affiches.find((x) => x.id === id), lien = /<figcaption>[\s\S]*<a href="([^"]+)">/.exec(corps);
    if (!a.galerie) ok(!lien, `${f} : ${id} n'a pas de lien de galerie`);
    else ok(lien && lien[1].replace(/^(\.\.\/)+/, '') === G.adresses[l][a.galerie], `${f} : ${id} → ${a.galerie} (${lien && lien[1]})`);
  }
  // les liens internes vivent
  for (const m of h.matchAll(/<a [^>]*href="([^"#?]+)"/g)) {
    const href = m[1]; if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    const cible = path.join(ROOT, path.dirname(f), href), fichier = cible.endsWith('/') ? `${cible}index.html` : cible;
    ok(existsSync(fichier), `${f} : lien interne vivant (${href})`);
  }
  // « Bientôt » : le contact seul
  const bientot = /<section class="gm-encadre" aria-labelledby="gm-bientot">([\s\S]*?)<\/section>/.exec(h);
  ok(bientot && [...bientot[1].matchAll(/href="([^"]+)"/g)].length === 1 && bientot[1].includes(`href="${prefixe(f)}${A.contact}"`), `${f} : « Bientôt » ne porte que le lien du contact`);
  ok(bientot && !/\d|€|\$|\bEUR\b|amazon|\bkdp\b/i.test(bientot[1].replace(/<[^>]+>/g, '')), `${f} : « Bientôt » sans date, sans prix, sans achat`);
  ok(/href="https:\/\/doi\.org\/10\.5281\/zenodo\.24396534"/.test(h) && /CC BY-NC 4\.0/.test(h), `${f} : licence et DOI de concept`);
  ok(!/pavane/i.test(h), `${f} : pas de « Pavane »`);
}
function prefixe(f) { return '../'.repeat(f.split('/').length - 1); }
const sitemap = lire('sitemap.xml');
for (const A of Object.values(G.adresses)) ok(sitemap.includes(`<loc>${SITE}/${A.page}</loc>`), `sitemap : ${A.page}`);
ok(/href="gammes\.html"/.test(lire('galerie-bicolore.html')) && /href="gammes\.html"/.test(lire('galerie-patterns-unifies.html')), 'les galeries bicolore et tricolore renvoient à gammes.html');
ok(/pattern-scales/.test(lire('en/two-colour-gallery/index.html')) && /pattern-scales/.test(lire('en/three-colour-gallery/index.html')), 'les galeries anglaises renvoient à la page anglaise');
{ // l'empreinte du corpus de 256 : inchangée
  const attendu = JSON.parse(lire('data/corpus-256-depot.json'));
  const sha = createHash('sha256').update(readFileSync(path.join(ROOT, 'data/corpus-256.json'))).digest('hex');
  ok(JSON.stringify(attendu).includes(sha), `l'empreinte du corpus de 256 est celle du dépôt (${sha.slice(0, 12)}…)`);
}

// ---------- navigateur ----------
let BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'local', serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const origine = new URL(BASE).origin;
for (const [l, A] of Object.entries(G.adresses)) {
  for (const largeur of [390, 1280]) {
    const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 } }), page = await ctx.newPage(), erreurs = [], externes = new Set();
    page.on('pageerror', (e) => erreurs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|cloudflareinsights/i.test(m.text())) erreurs.push(m.text()); });
    page.on('request', (r) => { const u = new URL(r.url()); if (u.origin !== origine && !/^(data|blob):/.test(r.url())) externes.add(u.host); });
    for (const r of ['', '?r=pinterest', '?r=linkedin', '?r=facebook', '?r=instagram']) {
      await page.goto(`${BASE}/${A.page}${r}`, { waitUntil: 'load' });
      if (r === '' || r === '?r=pinterest') {
        await page.evaluate(async () => { for (const i of document.images) { i.loading = 'eager'; } await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((f) => { i.onload = i.onerror = f; })))); });
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, imgs: [...document.images].filter((i) => i.closest('.gm-affiche')).map((i) => [i.naturalWidth, i.naturalHeight, Math.round(i.getBoundingClientRect().width)]) }));
        ok(m.sw <= largeur, `${l}, ${largeur} px${r} : aucun débordement horizontal (${m.sw})`);
        ok(m.imgs.length === 7 && m.imgs.every(([w, h, a]) => w === 1000 && h === 1500 && a <= largeur), `${l}, ${largeur} px${r} : sept affiches chargées, aucune plus large que l'écran`);
      }
      ok((await page.title()) === G.textes[l].titre, `${l}${r} : le paramètre d'origine ne change pas la page`);
    }
    ok(externes.size === 0, `${l}, ${largeur} px : aucune requête hors du site (${[...externes].join(', ')})`);
    ok(erreurs.length === 0, `${l}, ${largeur} px : aucune erreur de console (${erreurs.slice(0, 2).join(' | ')})`);
    await ctx.close();
  }
}
await nav.close();
if (serveur && serveur.close) serveur.close();
if (echecs) { console.error(`\n${echecs} défaut(s) sur ${controles} contrôles.`); process.exit(1); }
console.log(`OK    Les gammes : ${controles} contrôles — gammes.html et en/pattern-scales/ : sept affiches 2:3 avec dimensions et alt, liens vers les galeries et le contact vivants, « Bientôt » sans date ni prix, DOI de concept, pas de Dataset, au sitemap, ?r= sans effet ni requête externe, aucun débordement à 390 et 1280 px, corpus inchangé.`);
process.exit(0);
