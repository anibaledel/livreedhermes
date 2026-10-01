#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 (non-commercial) / Commercial license: anibaledel@gmail.com
//
// check_liens.mjs — Contrôle automatique : chaque lien interne des pages
// (href, src, srcset, poster) doit mener à un fichier du dépôt.
//
// Pourquoi ce script existe
// --------------------------
// Le site compte plus de 600 pages, la plupart engendrées, et les
// ménages successifs du dépôt (PDF en double, originaux non référencés,
// fichiers renommés) suppriment des fichiers. Un lien cassé ne se voit qu'en
// cliquant dessus : ce contrôle le signale dès la PR.
//
// Sont vérifiés les chemins relatifs, les chemins absolus (/…) et les
// adresses https://anibal-amiot.com/…, ramenés au dépôt. Un chemin vers un
// dossier doit contenir un index.html. Les liens externes, les ancres seules
// et les morceaux de gabarit JavaScript (${…}, concaténations) sont ignorés.
//
// Usage
// -----
//     node tools/check_liens.mjs

import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://anibal-amiot.com/';

const pages = execFileSync('git', ['ls-files', '-z', '*.html'], { cwd: ROOT })
  .toString().split('\0')
  .filter((f) => f && !f.startsWith('includes/') && !f.includes('node_modules/'));

function cible(page, url) {
  url = url.trim();
  if (!url || url.startsWith('#')) return null;
  if (/\$\{|'\s*\+|\+\s*'/.test(url)) return null;          // gabarit JS
  if (url.startsWith(SITE)) url = '/' + url.slice(SITE.length);
  else if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(url)) return null; // externe, mailto:, data:…
  url = url.split('#')[0].split('?')[0];
  if (!url) return null;
  let chemin;
  try { chemin = decodeURIComponent(url); } catch { chemin = url; }
  return chemin.startsWith('/')
    ? path.join(ROOT, chemin)
    : path.join(ROOT, path.dirname(page), chemin);
}

function existe(abs) {
  if (!existsSync(abs)) return false;
  return statSync(abs).isDirectory() ? existsSync(path.join(abs, 'index.html')) : true;
}

const ATTR = /\s(href|src|poster|srcset)\s*=\s*"([^"]*)"/g;
let casses = 0, verifies = 0;
for (const page of pages) {
  const html = readFileSync(path.join(ROOT, page), 'utf8');
  for (const m of html.matchAll(ATTR)) {
    if (/\$\{|'\s*\+|\+\s*'/.test(m[2])) continue;          // gabarit JS
    const valeurs = m[1] === 'srcset' ? m[2].split(',').map((s) => s.trim().split(/\s+/)[0]) : [m[2]];
    for (const v of valeurs) {
      const abs = cible(page, v);
      if (!abs) continue;
      verifies++;
      if (!existe(abs)) {
        casses++;
        console.error(`CASSÉ ${page} → ${v}`);
      }
    }
  }
}
if (casses) {
  console.error(`\n${casses} lien(s) interne(s) cassé(s) sur ${verifies}, dans ${pages.length} pages.`);
  process.exit(1);
}
console.log(`${verifies} liens internes vérifiés dans ${pages.length} pages : aucun cassé.`);
