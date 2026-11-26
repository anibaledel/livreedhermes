#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// check_descriptions_pages.mjs — toute page indexable qui a un vrai contenu porte une <meta name="description"> propre (prompt 260, corrigé par le 261).
// Une page de redirection (<meta http-equiv="refresh">, location.replace) ou en « noindex » n'en a pas besoin et n'en reçoit pas ; un fragment (includes/, js/) n'est pas une page.
// Échoue si une page du sitemap, sans redirection ni noindex, n'a pas de description, ou la partage avec une autre page de même langue. Rend la liste des pages exemptées (redirections, noindex).
// Usage : node tools/check_descriptions_pages.mjs [--essai]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyser } from './check_sitemap_indexable.mjs';
import { pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://anibal-amiot.com';
const desc = (html) => { const m = /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i.exec(html); return m ? m[1].trim() : null; };
const decode = (s) => s.replace(/&amp;/g, '&');
/** Verdict d'une page : « exemptee » (redirection ou noindex), « sans » (vraie page sans description), « ok ». */
export function verdict(url, html) {
  const causes = analyser(url, html).filter((c) => c === 'redirection' || c === 'noindex');
  if (causes.length) return 'exemptee';
  return desc(html) ? 'ok' : 'sans';
}
if (process.argv.includes('--essai')) {
  const base = '<!DOCTYPE html><html><head><title>t</title>';
  const u = `${SITE}/p.html`;
  const cas = [[base + '<meta name="description" content="Une description."></head>', 'ok'], [base + '</head>', 'sans'],
    [base + '<meta http-equiv="refresh" content="0; url=/x"></head>', 'exemptee'], [base + '<meta name="robots" content="noindex,follow"></head>', 'exemptee']];
  const mal = cas.filter(([h, v]) => verdict(u, h) !== v);
  if (mal.length) { console.error('ÉCHEC --essai', mal.length); process.exit(1); }
  console.log('OK    --essai : une page sans description est vue ; une redirection et une page noindex sont exemptées.');
  process.exit(0);
}
const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
const sans = [], exemptees = [], parDesc = new Map();
for (const url of urls) {
  let p = decodeURIComponent(url.slice(SITE.length).replace(/[?#].*$/, '')); if (p === '' || p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p.replace(/^\//, ''));
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8'), v = verdict(url, html);
  if (v === 'sans') sans.push(url); else if (v === 'exemptee') exemptees.push(url);
  else { const k = `${/<html[^>]*lang=["']([^"']+)/i.exec(html)?.[1]}|${desc(html)}`; (parDesc.get(k) || parDesc.set(k, []).get(k)).push(url); }
}
const doublons = [...parDesc.values()].filter((l) => l.length > 1);
// pages de redirection du dépôt, hors sitemap : la liste est rendue, sans description à exiger
const redirections = [];
for (const d of fs.readdirSync(ROOT)) if (d.endsWith('.html')) { const h = fs.readFileSync(path.join(ROOT, d), 'utf8'); if (analyser(`${SITE}/${d}`, h).includes('redirection')) redirections.push(d); }
console.log(`${urls.length} URLs du sitemap : ${urls.length - sans.length - exemptees.length} avec description, ${sans.length} sans, ${exemptees.length} exemptées (redirection ou noindex).`);
console.log(`Pages de redirection à la racine (hors sitemap, sans description exigée) : ${redirections.join(', ') || '—'}`);
if (sans.length) { sans.slice(0, 20).forEach((u) => console.error(`  sans description : ${u}`)); console.error(`ÉCHEC ${sans.length} page(s) sans description`); process.exit(1); }
console.log(`Information (n'échoue pas) : ${doublons.length} description(s) partagée(s) par plusieurs pages de même langue.`);
console.log('OK    descriptions : chaque page indexable à vrai contenu en a une.');
