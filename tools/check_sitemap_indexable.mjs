#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// check_sitemap_indexable.mjs — chaque URL de sitemap.xml est-elle indexable ? (prompt 260 ; Search Console : 26 redirections, 9 pages en 404 et 13 « noindex » signalées, qui ne doivent pas figurer au sitemap)
//   Une URL listée échoue si elle : ne répond pas 200 (le fichier est absent : 404 ; ou c'est une redirection : <meta http-equiv="refresh"> ou page réduite à location.replace) ;
//   porte « noindex » (balise robots ou googlebot) ; a une canonique qui pointe vers une autre URL ; ou n'a aucune canonique à elle-même quand elle en déclare une vide.
//   Le contrôle est LOCAL par défaut (le dépôt est ce que GitHub Pages sert : adresse → fichier) ; avec une base (https://anibal-amiot.com) il interroge en plus le site publié
//   (200 sans redirection) — l'état de la Pages, pas du dépôt.
// Usage : node tools/check_sitemap_indexable.mjs [--site https://anibal-amiot.com] [--essai]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://anibal-amiot.com';

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
/** L'adresse normalisée pour comparer une canonique à l'URL : https, sans « index.html » final. */
const norme = (u) => decode(u).trim().replace(/^http:\/\//, 'https://').replace(/index\.html$/, '').replace(/#.*$/, '');
/** Les causes d'échec d'une URL, d'après le HTML de sa page (null : le fichier n'existe pas → 404). */
export function analyser(url, html) {
  if (html === null) return ['404'];
  const causes = [];
  const tetes = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  if (tetes.some((t) => /http-equiv=["']?refresh/i.test(t)) || (/<script>\s*location\.replace\([^<]*<\/script>/i.test(html) && html.length < 1500)) causes.push('redirection');
  if (tetes.some((t) => /name=["'](robots|googlebot)["']/i.test(t) && /noindex/i.test(t))) causes.push('noindex');
  const canon = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)].map((m) => /href=["']([^"']*)["']/i.exec(m[0])?.[1]).filter((x) => x !== undefined);
  if (canon.some((c) => norme(c) !== norme(url))) causes.push('canonique ailleurs');
  return causes;
}
const fichierDe = (url) => {
  let p = decodeURIComponent(url.slice(SITE.length).replace(/[?#].*$/, ''));
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return p.replace(/^\//, '');
};
const urls = (xml) => [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await executer();

async function executer() {
  if (process.argv.includes('--essai')) {
    const base = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Une page</title>';
    const u = `${SITE}/page.html`;
    const cas = [
      ['une page saine', base + `<link rel="canonical" href="${u}"></head><body>x</body></html>`, []],
      ['une page sans canonique', base + '</head><body>x</body></html>', []],
      ['un dossier (canonique avec « / »)', base + `<link rel="canonical" href="${SITE}/page.html"></head>`, []],
      ['une redirection <meta refresh>', base + `<meta http-equiv="refresh" content="0; url=${SITE}/autre.html"></head>`, ['redirection']],
      ['une redirection par location.replace', `<head><script>location.replace('${SITE}/autre.html');</script></head>`, ['redirection']],
      ['une page noindex', base + '<meta name="robots" content="noindex,follow"></head>', ['noindex']],
      ['une canonique ailleurs', base + `<link rel="canonical" href="${SITE}/autre.html"></head>`, ['canonique ailleurs']],
      ['un fichier absent (404)', null, ['404']],
    ];
    const bons = cas.filter(([, html, att]) => JSON.stringify(analyser(u, html)) === JSON.stringify(att));
    const dossier = analyser(`${SITE}/a/`, base + `<link rel="canonical" href="${SITE}/a/index.html"></head>`).length === 0;
    if (bons.length !== cas.length || !dossier) { for (const c of cas) if (!bons.includes(c)) console.error(`ÉCHEC --essai : ${c[0]} → ${JSON.stringify(analyser(u, c[1]))}`); process.exit(1); }
    console.log(`OK    --essai : ${cas.length} cas (saine, sans canonique, redirection ×2, noindex, canonique ailleurs, 404) rendus comme attendu.`);
    process.exit(0);
  }

  const iSite = process.argv.indexOf('--site');
  const site = iSite > 0 ? process.argv[iSite + 1].replace(/\/$/, '') : null;
  const liste = urls(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8'));
  const echecs = {};
  let nb = 0;
  for (const url of liste) {
    const f = path.join(ROOT, fichierDe(url));
    const causes = analyser(url, fs.existsSync(f) && fs.statSync(f).isFile() ? fs.readFileSync(f, 'utf8') : null);
    nb++;
    for (const c of causes) (echecs[c] ||= []).push(url);
  }
  if (site) {
    const aVerifier = liste.map((u) => site + u.slice(SITE.length));
    let i = 0;
    const travail = async () => {
      while (i < aVerifier.length) {
        const u = aVerifier[i++];
        try { const r = await fetch(u, { redirect: 'manual' }); if (r.status !== 200) (echecs[`HTTP ${r.status}`] ||= []).push(u); } catch (e) { (echecs['réseau'] ||= []).push(`${u} (${e.message})`); }
      }
    };
    await Promise.all(Array.from({ length: 8 }, travail));
  }
  const total = Object.values(echecs).reduce((a, l) => a + l.length, 0);
  console.log(`sitemap.xml : ${liste.length} URLs${site ? ` (et interrogées sur ${site})` : ''}`);
  for (const [c, l] of Object.entries(echecs)) { console.log(`  ${c} : ${l.length}`); for (const u of l.slice(0, 15)) console.log(`    ${u}`); if (l.length > 15) console.log(`    … ${l.length - 15} autres`); }
  if (total) { console.error(`ÉCHEC ${total} URL(s) listée(s) qui ne sont pas indexables.`); process.exit(1); }
  console.log(`OK    sitemap indexable : ${nb} URLs, toutes en 200, sans redirection, sans noindex, canonique sur elles-mêmes (404 : 0, redirection : 0, noindex : 0, canonique ailleurs : 0).`);
}
