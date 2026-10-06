#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_outils_langues.mjs — les outils sortis à une adresse par langue,
// mesurés dans un navigateur (scripts/build-outils-langues.js,
// data/outils-langues.json). Page par page, française comprise :
//   1. chaque adresse répond 200 ;
//   2. <html lang> est la langue de la page, le canonical pointe sur ELLE ;
//   3. les rel="alternate" sont réciproques : chaque page du groupe déclare
//      exactement les mêmes, elle comprise, plus un x-default (l'anglais) ;
//   4. la langue est FIXÉE : un visiteur qui a choisi le français ailleurs
//      (localStorage « lldh-lang ») voit quand même la page dans la sienne ;
//   5. le texte est EN DUR : JavaScript coupé, aucun élément traduit par le
//      script ne garde son texte français — un élément dont le texte statique
//      est celui de la page française, alors que le script y pose un texte
//      propre à la langue (autre que sur la page française), est une
//      traduction restée invisible ;
//   6. aucune erreur de script, aucune ressource du site en échec (un chemin
//      relatif oublié à la profondeur ../../ se voit ici) ;
//   7. chaque adresse est au sitemap ;
//   8. (local seulement) la page française n'a pas changé depuis REF, son
//      bloc hreflang mis à part : ce lot ajoute, il ne modifie pas.
//
// Usage : node tools/check_outils_langues.mjs [local | https://anibal-amiot.com] [--depuis REF] [--essai]
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { GROUPES, SITE } = require('../scripts/langues.js');
const args = process.argv.slice(2);
const local = args[0] === 'local';
// --essai : la première page traduite est servie abîmée — son titre remis en
// français en dur, un de ses alternates retiré, un chemin relatif sans son
// préfixe. Le contrôle doit voir les trois défauts, sinon il ne mord pas.
const essai = args.includes('--essai');
const REF = args.includes('--depuis') ? args[args.indexOf('--depuis') + 1] : 'origin/main';
let BASE = args[0] && !args[0].startsWith('--') ? args[0] : SITE;
let serveur = null;
if (local) { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');

const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };
const groupes = GROUPES.filter((g) => g.nom.startsWith('outil-'));
if (!groupes.length) { console.error('Aucun groupe « outil-… » dans scripts/langues.js.'); process.exit(1); }
const versBase = (u) => BASE + u.slice(SITE.length);

const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const sansJs = await navigateur.newContext({ javaScriptEnabled: false });
const avecJs = await navigateur.newContext();
const premiere = GROUPES.find((g) => g.nom.startsWith('outil-')).pages.find(([l]) => l !== 'fr');
if (essai) {
  for (const ctx of [sansJs, avecJs]) {
    await ctx.route((u) => u.href === versBase(premiere[1]), async (route) => {
      const rep = await route.fetch();
      let html = await rep.text();
      html = html.replace(/(data-i18n="pageTitle">)[^<]*/, '$1Cymatique — gammes et fréquences')
        .replace(/<link rel="alternate" hreflang="es"[^>]*>\n?/, '')
        .replace('src="../../assets/share-widget.js"', 'src="assets/share-widget.js"');
      await route.fulfill({ response: rep, body: html });
    });
  }
}
await avecJs.addInitScript(() => { try { localStorage.setItem('lldh-lang', 'fr'); } catch (e) {} });

// Le texte de chaque élément traduisible, sur une page chargée.
const textes = (p) => p.evaluate(() => {
  const out = {};
  document.querySelectorAll('main [id], main [data-i18n], main [data-i18n-html]').forEach((el) => {
    const k = el.dataset.i18n || el.dataset.i18nHtml || `#${el.id}`;
    if (!(k in out)) out[k] = el.textContent.replace(/\s+/g, ' ').trim();
  });
  return out;
});

const sitemap = local ? readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8') : await (await fetch(`${BASE}/sitemap.xml`)).text();
let vues = 0;
for (const g of groupes) {
  const attendus = g.pages.map(([l, u]) => [l, u]);
  const fr = g.pages.find(([l]) => l === 'fr');
  // le texte statique de la page française : la référence de « resté en français »
  const pFr = await sansJs.newPage();
  await pFr.goto(versBase(fr[1]), { waitUntil: 'domcontentloaded' });
  const statiqueFr = await textes(pFr);
  await pFr.close();
  // … et ce que son script y pose : un texte qui ne change pas avec la langue
  // (un nom de gamme, une valeur calculée) n'est pas une traduction manquée
  const vFr = await avecJs.newPage();
  await vFr.goto(versBase(fr[1]), { waitUntil: 'load' });
  await vFr.waitForTimeout(1500);
  const vivantFr = await textes(vFr);
  await vFr.close();

  for (const [lang, url] of g.pages) {
    const nom = url.slice(SITE.length + 1) || '/';
    // 1, 2, 3 — JavaScript coupé : ce que lit un moteur
    const p = await sansJs.newPage();
    const rep = await p.goto(versBase(url), { waitUntil: 'domcontentloaded' });
    if (!rep || rep.status() !== 200) { echec(`${nom} : ${rep ? rep.status() : 'pas de réponse'}`); await p.close(); continue; }
    vues++;
    const tete = await p.evaluate(() => ({
      lang: document.documentElement.lang,
      canonical: document.querySelector('link[rel=canonical]')?.href,
      alternates: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map((l) => [l.hreflang, l.href]),
    }));
    const hreflangAttendu = { zh: 'zh-Hans', pt: 'pt-PT' }[lang] || lang;
    if (tete.lang !== hreflangAttendu) echec(`${nom} : <html lang="${tete.lang}">, attendu « ${hreflangAttendu} »`);
    if (tete.canonical !== url) echec(`${nom} : canonical ${tete.canonical}, attendu ${url}`);
    const alt = tete.alternates.map(([h, u]) => `${h} ${u}`).sort().join('\n');
    const attenduAlt = [...attendus.map(([l, u]) => `${{ zh: 'zh-Hans', pt: 'pt-PT' }[l] || l} ${u}`),
      ...(attendus.some(([l]) => l === 'en') ? [`x-default ${attendus.find(([l]) => l === 'en')[1]}`] : [])].sort().join('\n');
    if (alt !== attenduAlt) echec(`${nom} : alternates non réciproques —\n  déclarés : ${alt.split('\n').join(' | ')}\n  attendus : ${attenduAlt.split('\n').join(' | ')}`);
    if (!sitemap.includes(`<loc>${url}</loc>`)) echec(`${nom} : absente du sitemap`);
    const statique = await textes(p);
    await p.close();

    // 4, 5, 6 — JavaScript actif, le français mémorisé
    const q = await avecJs.newPage();
    const erreurs = [];
    q.on('pageerror', (e) => erreurs.push(`erreur de script : ${e.message}`));
    // « Failed to load resource » : la ressource en échec est relevée par adresse ci-dessous ; une
    // ressource externe (mesure d'audience) bloquée par le réseau n'est pas un défaut de la page.
    q.on('console', (m) => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) erreurs.push(`console : ${m.text()}`); });
    q.on('response', (r) => { if (r.url().startsWith(BASE) && r.status() >= 400) erreurs.push(`${r.status()} ${r.url().slice(BASE.length)}`); });
    q.on('requestfailed', (r) => { if (r.url().startsWith(BASE)) erreurs.push(`échec ${r.url().slice(BASE.length)}`); });
    await q.goto(versBase(url), { waitUntil: 'load' });
    await q.waitForTimeout(1500);
    const vivant = await textes(q);
    const langVivante = await q.evaluate(() => document.documentElement.lang);
    await q.close();
    for (const e of [...new Set(erreurs)]) echec(`${nom} : ${e}`);
    if (lang !== 'fr' && langVivante.slice(0, 2) !== lang) echec(`${nom} : le français mémorisé l'emporte (lang « ${langVivante} » après chargement)`);
    let restes = 0;
    if (lang !== 'fr') {
      for (const [k, v] of Object.entries(vivant)) {
        if (!(k in statique) || !v || v === statique[k]) continue;
        if (statique[k] === statiqueFr[k] && statique[k] && v !== vivantFr[k]) { restes++; echec(`${nom} : ${k} — texte français en dur (« ${statique[k].slice(0, 60)} »), le script pose « ${v.slice(0, 60)} »`); }
      }
    }
    console.log(`OK    ${nom} : 200, lang ${tete.lang}, canonical sur elle, ${tete.alternates.length} alternates réciproques, au sitemap${lang !== 'fr' ? `, langue fixée, ${Object.keys(statique).length} éléments en dur dans sa langue` : ''}`);
  }

  // 8 — la page française, bloc hreflang mis à part
  if (local) {
    const sans = (s) => s.replace(/<!-- @hreflang:start[\s\S]*?<!-- @hreflang:end -->\n?/, '');
    let avant = null;
    try { avant = execFileSync('git', ['show', `${REF}:${fr[2]}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }); } catch {}
    if (avant !== null) {
      const apres = readFileSync(path.join(ROOT, fr[2]), 'utf8');
      if (sans(avant) !== sans(apres)) echec(`${fr[2]} : la page française a changé depuis ${REF} hors de son bloc hreflang`);
      else console.log(`      ${fr[2]} : identique à ${REF} hors du bloc hreflang (${Buffer.byteLength(sans(apres))} octets)`);
    }
  }
}

await navigateur.close();
if (serveur) serveur.fermer();
if (essai) {
  const vus = [/texte français en dur/, /alternates non réciproques/, /404 .*assets\/share-widget\.js/]
    .map((re) => echecs.some((e) => e.startsWith(premiere[1].slice(SITE.length + 1)) && re.test(e)));
  if (vus.every(Boolean)) { console.log(`\nEssai : les trois défauts posés sur ${premiere[1].slice(SITE.length + 1)} sont vus (texte français en dur, alternate retiré, chemin sans préfixe).`); process.exit(0); }
  console.error(`\nEssai : défauts non vus — texte en dur ${vus[0]}, alternate ${vus[1]}, chemin ${vus[2]}.`); process.exit(1);
}
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log(`\nOutils traduits conformes sur ${BASE} : ${vues} pages dans ${groupes.length} groupes.`);
