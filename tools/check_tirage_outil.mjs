#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_tirage_outil.mjs — l'outil de tirage du Yi King fait ce que ses textes disent (prompts 207 et 208).
//
// Sur les sept pages du tirage (fr, en, es, th, de, it, ja), le hasard est fixé (Math.random : deux suites de lancers), on appuie sur le bouton de
// tirage, et on lit le résultat :
//   - le gros titre porte le numéro KING WEN, la ligne qui suit le numéro du SITE (ordre chronologique) — l'ordre des titres du prompt 205 ;
//     les deux numéros vont ensemble (KINGWEN_BY_CHRONO, scripts/extract-hexagram-data.js, jamais recalculé ici) ;
//   - le lien « en savoir plus » vise la page de l'hexagramme tiré (le numéro du site ouvre l'adresse) ;
//   - suite 1 (6, 9, 8, 7, 8, 9) : trois traits mutants ; la zone de mutation montre l'hexagramme antérieur et le postérieur, chacun King Wen
//     d'abord, et trois commentaires de traits mutants (et eux seuls : l'outil n'affiche pas le commentaire des traits fixes) ;
//   - suite 2 (7 six fois) : aucun trait mutant, un seul hexagramme, aucun commentaire ;
//   - rien ne reste sur l'appareil à part la langue et la palette (localStorage), et l'adresse porte ?tire= ;
//   - aucune exception JavaScript.
//
// Usage : node tools/check_tirage_outil.mjs [--base-url http://localhost:8123] [--essai]
//   --essai : sans navigateur, des résultats faussés (numéro du site avant King Wen, numéros qui ne vont pas ensemble, lien vers un autre hexagramme,
//             commentaire sur un trait fixe) doivent être refusés.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const KW = require(path.join(ROOT, 'scripts/extract-hexagram-data.js')).KINGWEN_BY_CHRONO;
const args = process.argv.slice(2);
const BASE_URL = (args.includes('--base-url') ? args[args.indexOf('--base-url') + 1] : 'http://localhost:8123').replace(/\/$/, '');
const PAGES = ['tirage-livree-hermes.html', 'en/yi-king-draw/', 'es/tirada-del-yi-king/', 'th/yi-king-draw/', 'de/i-ging-orakel/', 'it/estrazione-i-ching/', 'ja/yi-king-draw/'];
// pièce = 2 si Math.random() < 0.5, 3 sinon : 0 → 2, 0.9 → 3. Somme 6 = yin mutant, 7 = yang fixe, 8 = yin fixe, 9 = yang mutant.
const SUITE_MUTANTS = [0, 0, 0, /* 6 */ 0.9, 0.9, 0.9, /* 9 */ 0.9, 0.9, 0, /* 8 */ 0, 0, 0.9, /* 7 */ 0, 0.9, 0.9, /* 8 */ 0.9, 0.9, 0.9 /* 9 */];
const SUITE_FIXE = [0, 0, 0.9, 0, 0, 0.9, 0, 0, 0.9, 0, 0, 0.9, 0, 0, 0.9, 0, 0, 0.9]; // 7 six fois
const nombres = (t) => (t.match(/\d+/g) || []).map(Number);

/** Les défauts d'un résultat lu dans la page : { grand, petit, lienHref, mutants (n), notes (n), ordreDom }. Liste vide = conforme. */
export function defautsResultat(r, nom) {
  const d = [];
  const kw = nombres(r.grand), site = nombres(r.petit);
  if (kw.length !== 1) d.push(`${nom} : le gros titre doit porter un seul numéro, le numéro King Wen (« ${r.grand} »)`);
  if (!site.length) d.push(`${nom} : la ligne sous le titre ne porte pas le numéro du site (« ${r.petit} »)`);
  else if (kw.length === 1 && KW[site[0]] !== kw[0]) d.push(`${nom} : le numéro du site ${site[0]} a le numéro King Wen ${KW[site[0]]}, la page affiche ${kw[0]}`);
  if (r.ordreDom !== 'grand-avant-petit') d.push(`${nom} : le gros titre doit précéder la ligne du numéro du site`);
  const num = (r.lienHref.split('/').pop() || '').match(/^(\d+)-/);
  if (!num || (site.length && Number(num[1]) !== site[0])) d.push(`${nom} : le lien « en savoir plus » (${r.lienHref}) ne vise pas l'hexagramme n° ${site[0]} du site`);
  for (const m of r.minis || []) {
    const k = nombres(m.grand), s = nombres(m.petit);
    if (k.length !== 1 || !s.length || KW[s[0]] !== k[0]) d.push(`${nom} : hexagramme ${m.role} : « ${m.grand} » / « ${m.petit} » : King Wen d'abord, et les deux numéros vont ensemble`);
  }
  return d;
}

if (args.includes('--essai')) {
  const sain = { grand: `King Wen : ${KW[18]}`, petit: 'n° 18 du site', lienHref: 'hexagrammes/18-essai.html', ordreDom: 'grand-avant-petit', minis: [{ role: 'antérieur', grand: `King Wen n°${KW[18]}`, petit: 'x · n° 18 du site' }] };
  const cas = {
    'le résultat sain': [sain, 0],
    'numéro du site avant King Wen': [{ ...sain, ordreDom: 'petit-avant-grand' }, 1],
    'numéros qui ne vont pas ensemble': [{ ...sain, grand: 'King Wen : 30' }, 1],
    'lien vers un autre hexagramme': [{ ...sain, lienHref: 'hexagrammes/19-essai.html' }, 1],
    'mini-bloc : le numéro du site en gros titre': [{ ...sain, minis: [{ role: 'antérieur', grand: 'N° 18', petit: `x · King Wen n°${KW[18]}` }] }, 1],
  };
  let manques = 0;
  for (const [nom, [r, attendu]] of Object.entries(cas)) {
    const n = defautsResultat(r, 'essai').length;
    const ok = attendu === 0 ? n === 0 : n > 0;
    console.log(`${ok ? 'vu   ' : 'MANQUÉ'} ${nom} : ${n} défaut(s)`);
    if (!ok) manques++;
  }
  if (manques) { console.error(`\n${manques} cas mal jugé(s).`); process.exit(1); }
  console.log('--essai : le résultat sain passe, les quatre faussés sont refusés.');
  process.exit(0);
}

const { chromium } = await import('playwright');
const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let echecs = 0;
const ko = (m) => { echecs++; console.error(`ÉCHEC ${m}`); };
for (const page of PAGES) {
  for (const [nomSuite, suite, mutants] of [['trois traits mutants', SUITE_MUTANTS, 3], ['aucun trait mutant', SUITE_FIXE, 0]]) {
    const nom = `${page} (${nomSuite})`;
    const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route('https://static.cloudflareinsights.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await ctx.addInitScript((s) => { let i = 0; Math.random = () => (i < s.length ? s[i++] : 0.5); }, suite);
    const p = await ctx.newPage();
    const exceptions = [];
    p.on('pageerror', (e) => exceptions.push(e.message));
    const rep = await p.goto(`${BASE_URL}/${page}`, { waitUntil: 'networkidle' }).catch((e) => e);
    if (!rep || rep instanceof Error || rep.status() >= 400) { ko(`${nom} : chargement impossible`); await ctx.close(); continue; }
    await p.click('#drawBtn');
    await p.waitForSelector('#detail .num-big');
    if (mutants) await p.waitForSelector('#mutationZone', { timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => {
      const grand = document.querySelector('#detail .num-big'), petit = document.querySelector('#detail .altnum');
      const lien = document.querySelector('#detail .hex-more-link');
      const minis = [...document.querySelectorAll('#mutationZone .hex-mini')].map((m, i) => ({ role: i === 0 ? 'antérieur' : 'postérieur', grand: m.querySelector('.num-big').textContent, petit: m.querySelector('.pinyin').textContent }));
      return {
        grand: grand.textContent, petit: petit.textContent, lienHref: lien ? lien.getAttribute('href') : '',
        ordreDom: grand.compareDocumentPosition(petit) & Node.DOCUMENT_POSITION_FOLLOWING ? 'grand-avant-petit' : 'petit-avant-grand',
        minis, zone: document.querySelectorAll('#mutationZone').length, notes: document.querySelectorAll('#detailBelow .trait-note').length,
        mutants: [...document.querySelectorAll('#mutationZone .moving-lines b')].map((b) => b.textContent).join(''),
        adresse: location.search, stockage: Object.keys(localStorage),
      };
    });
    for (const m of defautsResultat(r, nom)) ko(m);
    if (mutants && (r.zone !== 1 || r.minis.length !== 2)) ko(`${nom} : la zone de mutation doit montrer deux hexagrammes (antérieur, postérieur)`);
    if (mutants && r.mutants.replace(/\D/g, '') !== '126') ko(`${nom} : traits mutants attendus 1, 2 et 6, lus « ${r.mutants} »`);
    if (r.notes !== mutants) ko(`${nom} : ${r.notes} commentaire(s) de trait ; l'outil n'en affiche que pour les ${mutants} trait(s) mutant(s)`);
    if (!mutants && r.zone) ko(`${nom} : une zone de mutation sans trait mutant`);
    if (!/^\?tire=\d+/.test(r.adresse)) ko(`${nom} : l'adresse ne porte pas ?tire= (« ${r.adresse} »)`);
    const permis = new Set(['bicolore-lang', 'langue', 'lang']);
    const intrus = r.stockage.filter((k) => !/lang|palette|colou?r/i.test(k) && !permis.has(k));
    if (intrus.length) ko(`${nom} : localStorage garde autre chose que la langue et la palette : ${intrus.join(', ')}`);
    if (exceptions.length) ko(`${nom} : exception JavaScript : ${exceptions.join(' ; ')}`);
    if (!echecs) console.log(`OK    ${nom} : ${r.grand.trim()} | ${r.petit.trim()}`);
    await ctx.close();
  }
}
await navigateur.close();
if (echecs) { console.error(`\n${echecs} défaut(s).`); process.exit(1); }
console.log(`\nL'outil de tirage : ${PAGES.length} pages, King Wen d'abord puis le numéro du site, mutants et second hexagramme, rien de plus sur l'appareil que la langue et la palette.`);
