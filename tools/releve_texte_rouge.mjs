#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// releve_texte_rouge.mjs — Les déclarations « color: var(--red) » du site,
// classées par ce qu'elles colorent RÉELLEMENT, mesuré dans le navigateur.
// Rien n'est corrigé. Pour chaque déclaration (sélecteur de sa règle, ou
// attribut style="…"), la page qui la porte est ouverte (1280 px et 390 px)
// et chaque élément qu'elle atteint est mesuré :
//   - texte propre (nœud texte non vide, ou ::before / ::after) ou non ;
//   - taille effective (px) et graisse calculées ;
//   - fond réel : la première couleur de fond opaque en remontant.
// Classes (WCAG 2) : GROS texte = ≥ 24 px, ou ≥ 18,66 px et graisse ≥ 700 —
// seuil 3:1 ; PETIT texte = le reste — seuil 4,5:1. Une déclaration est
// « petit texte » si au moins un de ses éléments l'est (le pire cas). Le
// contraste est calculé avec le rouge retenu #e0261b et avec l'actuel.
// Les 512 pages de motifs portent la même règle (le gabarit
// scripts/generate-motif-pages.js) : une page EN et une FR la mesurent, le
// compte la multiplie.
//
// Usage : CHROMIUM_PATH=… node tools/releve_texte_rouge.mjs [--md]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';
import { contraste } from '../assets/couleurs.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RETENU = '#e0261b', ACTUEL = '#e63b31';
const fichiers = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\n')
  .filter((f) => /\.(html|css)$/.test(f) && !/(^|\/)vendor\/|^pagefind\//.test(f));

// les déclarations, avec leur sélecteur
const decl = [];
for (const f of fichiers) {
  const t = readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of t.matchAll(/(?<![-\w])color\s*:\s*var\(--red\)/g)) {
    const avant = t.slice(0, m.index);
    const attr = avant.match(/style\s*=\s*["'][^"']*$/);
    let selecteur;
    if (attr) selecteur = null; // style="…" : l'élément se trouve par son attribut
    else {
      const o = avant.lastIndexOf('{');
      const debut = Math.max(avant.lastIndexOf('}', o), avant.lastIndexOf('{', o - 1), avant.lastIndexOf(';', o)) + 1;
      selecteur = avant.slice(debut, o).replace(/\/\*[\s\S]*?\*\//g, '').trim();
    }
    decl.push({ f, selecteur, ligne: avant.split('\n').length });
  }
}
// où mesurer : une page HTML porte ses propres règles ; une feuille CSS, les pages qui la chargent
const pagesDe = (f) => {
  if (f.endsWith('.html')) return /^(fr\/)?motifs\//.test(f) ? null : [f];
  const nom = path.basename(f);
  return fichiers.filter((h) => h.endsWith('.html') && readFileSync(path.join(ROOT, h), 'utf8').includes(nom)).slice(0, 3);
};
const motif = decl.filter((d) => /^(fr\/)?motifs\//.test(d.f));
const autres = decl.filter((d) => !/^(fr\/)?motifs\//.test(d.f));
// la règle des pages de motifs : mesurée sur une page EN et une FR
const MOTIFS = ['motifs/bases-yang-h0.html', 'fr/motifs/par2-yin-yang-h5.html'];

const serveur = await servirDepot(ROOT);
const nav = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const memo = new Map();
async function mesurer(page, selecteur) {
  const cle = `${page}|${selecteur}`;
  if (memo.has(cle)) return memo.get(cle);
  const res = [];
  for (const [l, h] of [[1280, 900], [390, 844]]) {
    const p = await nav.newPage({ viewport: { width: l, height: h } });
    await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await p.goto(`${serveur.url}/${page}`, { waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(300);
    res.push(...await p.evaluate((sel) => {
      const rouge = getComputedStyle(document.documentElement).getPropertyValue('--red').trim();
      let els = [];
      if (sel === null) els = [...document.querySelectorAll('[style*="var(--red)"]')].filter((e) => /(^|;|\s)color\s*:\s*var\(--red\)/.test(e.getAttribute('style')));
      else {
        // l'état (:hover, :focus…) et les pseudo-éléments retirés : on mesure l'élément qui les porte
        const base = sel.split(',').map((s) => s.replace(/::?(before|after)\b/g, '').replace(/:(hover|focus|focus-visible|focus-within|active|visited|link|target|checked|disabled)\b(\([^)]*\))?/g, '').trim()).filter(Boolean).join(',');
        try { els = [...document.querySelectorAll(base || '*:not(*)')]; } catch { return [{ invalide: true }]; }
      }
      const opaque = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(',').map(Number); return (v[3] ?? 1) >= 0.99 ? v.slice(0, 3) : null; };
      const fond = (e) => { for (let x = e; x; x = x.parentElement) { const v = opaque(getComputedStyle(x).backgroundColor); if (v) return v; } return [0, 0, 0]; };
      const hex = (v) => `#${v.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
      return els.slice(0, 200).map((e) => {
        const cs = getComputedStyle(e);
        const propre = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
          || ['::before', '::after'].some((ps) => { const c = getComputedStyle(e, ps).content; return c && c !== 'none' && c !== 'normal' && c !== '""'; });
        return { texte: propre, taille: parseFloat(cs.fontSize), graisse: Number(cs.fontWeight) || 400, fond: hex(fond(e)), rouge, extrait: (e.textContent || '').trim().slice(0, 40) };
      });
    }, selecteur));
    await p.close();
  }
  memo.set(cle, res);
  return res;
}
const classer = (els) => {
  if (!els.length) return { classe: 'non rendu' };
  if (els.some((e) => e.invalide)) return { classe: 'sélecteur illisible' };
  const t = els.filter((e) => e.texte);
  if (!t.length) return { classe: 'pas du texte' };
  const gros = (e) => e.taille >= 24 || (e.taille >= 18.66 && e.graisse >= 700);
  const petits = t.filter((e) => !gros(e));
  const pire = (petits.length ? petits : t).reduce((a, b) => (contraste(RETENU, a.fond) <= contraste(RETENU, b.fond) ? a : b));
  return { classe: petits.length ? 'petit texte' : 'gros texte', taille: Math.min(...(petits.length ? petits : t).map((e) => e.taille)), graisse: pire.graisse, fond: pire.fond, fonds: [...new Set(t.map((e) => e.fond))], extrait: pire.extrait };
};

const lignes = [];
for (const d of autres) {
  const pages = pagesDe(d.f) || [];
  const els = [];
  for (const pg of pages) els.push(...await mesurer(pg, d.selecteur));
  lignes.push({ ...d, n: 1, ...classer(els) });
}
// la règle des motifs, une fois, comptée 512 fois
const regle = motif[0];
const elsM = [];
for (const pg of MOTIFS) elsM.push(...await mesurer(pg, regle.selecteur));
lignes.push({ f: 'motifs/*.html, fr/motifs/*.html (gabarit generate-motif-pages.js)', selecteur: regle.selecteur, n: motif.length, ...classer(elsM) });
await nav.close();
serveur.fermer();

const total = lignes.reduce((s, l) => s + l.n, 0);
const par = {};
for (const l of lignes) par[l.classe] = (par[l.classe] || 0) + l.n;
const sous = (l, r, s) => l.classe === 'petit texte' && l.fond && contraste(r, l.fond) < s;
const petitSous = lignes.filter((l) => sous(l, RETENU, 4.5)).reduce((s, l) => s + l.n, 0);
const petitSousActuel = lignes.filter((l) => sous(l, ACTUEL, 4.5)).reduce((s, l) => s + l.n, 0);
const grosSous = lignes.filter((l) => l.classe === 'gros texte' && contraste(RETENU, l.fond) < 3).reduce((s, l) => s + l.n, 0);
const fonds = {};
for (const l of lignes) if (l.fonds) for (const f of l.fonds) fonds[f] = (fonds[f] || 0) + l.n;
const md = process.argv.includes('--md');
console.log(`${total} déclarations « color: var(--red) » (${decl.length} relevées dans les fichiers HTML et CSS).`);
console.log(`Par classe : ${Object.entries(par).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`Petit texte sous 4,5:1 avec ${RETENU} : ${petitSous} (avec ${ACTUEL} : ${petitSousActuel}) ; gros texte sous 3:1 avec ${RETENU} : ${grosSous}`);
console.log(`Fonds réels du texte rouge (déclarations) : ${Object.entries(fonds).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
if (md) {
  console.log('\n| déclarations | fichier | sélecteur | classe | taille min. | graisse | fond (pire) | #e0261b | #e63b31 | exemple |\n|---|---|---|---|---|---|---|---|---|---|');
  for (const l of lignes.sort((a, b) => b.n - a.n || a.classe.localeCompare(b.classe))) {
    const c = (r) => (l.fond ? `${contraste(r, l.fond).toFixed(2)}:1` : '—');
    console.log(`| ${l.n} | ${l.f}${l.ligne ? `:${l.ligne}` : ''} | \`${(l.selecteur ?? 'style="…"').replace(/\s+/g, ' ').replace(/\|/g, '\\|').slice(0, 60)}\` | ${l.classe} | ${l.taille ? `${l.taille.toFixed(1)} px` : '—'} | ${l.graisse ?? '—'} | ${l.fond ?? '—'} | ${c(RETENU)} | ${c(ACTUEL)} | ${(l.extrait || '').replace(/\|/g, '\\|')} |`);
  }
}
