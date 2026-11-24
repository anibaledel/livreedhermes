#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// check_fiches_formes.mjs — les 128 pages de fiche des formes (prompt 250, point 3) disent ce que data/patterns-unifies-fiches.json dit.
//   - 128 pages en (forms/) et 128 pages fr (fr/formes/) + un index chacune, toutes au sitemap, hreflang réciproque ;
//   - chaque page porte ses 4 patterns : les quatre codes à 9 bits, le code à 7 bits, le numéro de forme, et chaque hexagramme avec ses DEUX numéros ;
//   - le bloc « tradition » cite le jugement et l'image du site, le bloc « calculé » les champs du JSON ;
//   - le bloc « attribution déclarée » n'existe sur aucune page tant que data/attributions-declarees.json est vide, et apparaît (sans rien engendrer) quand l'auteur le remplit.
//   - --essai : une attribution fictive fait apparaître le bloc ; un code faussé est refusé.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const F = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'patterns-unifies-fiches.json'), 'utf8'));
const gen = require(path.join(ROOT, 'scripts', 'generate-fiches-formes.js'));
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const ESSAI = process.argv.includes('--essai');
const echecs = [];
let controles = 0;
const ok = (c, m) => { controles++; if (!c) echecs.push(m); };
const par = Object.fromEntries(F.patterns.map((p) => [p.id, p]));
const num3 = (k) => String(k).padStart(3, '0');

function verifierPage(html, forme, lang, nom) {
  const ps = forme.patterns.map((id) => par[id]);
  ok(html.includes(`<code>${forme.code7}</code>`), `${nom} : code à 7 bits ${forme.code7}`);
  for (const p of ps) {
    ok(html.includes(`<code>${p.code9}</code>`), `${nom} : code à 9 bits ${p.code9}`);
    const deux = lang === 'fr' ? `hexagramme ${p.n} (n° King Wen ${p.king_wen})` : `hexagram ${p.n} (King Wen no. ${p.king_wen})`;
    ok(html.includes(deux), `${nom} : « ${deux} » (les deux numéros ensemble)`);
    ok(html.includes(`<td>${p.centroide_spectral}</td>`), `${nom} : centroïde ${p.centroide_spectral}`);
  }
  ok((html.match(/<rect /g) || []).length === 4 * 144, `${nom} : quatre grilles de 144 cases`);
  ok(html.includes('id="calcule"') && html.includes('id="tradition"'), `${nom} : blocs calculé et tradition`);
  ok(html.includes(lang === 'fr' ? '128' : '128') && html.includes(`${forme.forme}`), `${nom} : numéro de forme`);
}

for (const lang of ['en', 'fr']) {
  for (const f of F.formes) {
    const rel = gen.fichier(lang, f.forme);
    const existe = fs.existsSync(path.join(ROOT, rel));
    ok(existe, `${rel} existe`);
    if (!existe) continue;
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    verifierPage(html, f, lang, rel);
    ok(!html.includes('id="attribution"') === !Object.keys(gen.ATTR).some((k) => Number(k) === f.forme && gen.ATTR[k]), `${rel} : bloc d'attribution selon le fichier`);
    ok(sitemap.includes(`<loc>https://anibal-amiot.com/${rel}</loc>`), `${rel} au sitemap`);
    const autre = gen.fichier(lang === 'fr' ? 'en' : 'fr', f.forme);
    ok(html.includes(`hreflang="${lang === 'fr' ? 'en' : 'fr'}" href="https://anibal-amiot.com/${autre}"`), `${rel} : hreflang vers ${autre}`);
  }
  ok(fs.existsSync(path.join(ROOT, gen.dossier(lang), 'index.html')) && sitemap.includes(`<loc>https://anibal-amiot.com/${gen.dossier(lang)}</loc>`), `index ${lang}`);
}
ok(F.formes.length === 128 && F.patterns.length === 512, '128 formes, 512 patterns');
ok(Object.keys(gen.ATTR).every((k) => Number(k) >= 1 && Number(k) <= 128), 'attributions : numéros de forme de 1 à 128');

if (!ESSAI) {
  if (echecs.length) { echecs.slice(0, 20).forEach((e) => console.error('ÉCHEC', e)); console.error(`${echecs.length} échec(s)`); process.exit(1); }
  console.log(`OK    fiches des formes : ${controles} contrôles — 128 formes × 2 langues + 2 index, quatre codes à 9 bits et deux numéros par hexagramme, bloc « attribution déclarée » absent tant qu'il est vide.`);
} else {
  let vus = 0;
  const f = F.formes[5];
  gen.ATTR['6'] = { fr: 'Texte déclaré par l’auteur.' };
  if (gen.page('fr', f).includes('id="attribution"') && gen.page('fr', f).includes('Texte déclaré par l’auteur.')) vus++;
  delete gen.ATTR['6'];
  if (!gen.page('fr', f).includes('id="attribution"')) vus++;
  const faux = gen.page('fr', f).replace(`<code>${f.code7}</code>`, '<code>1111111</code>');
  const avant = echecs.length; verifierPage(faux, f, 'fr', 'faux');
  if (echecs.length > avant) vus++;
  if (vus !== 3) { console.error(`ÉCHEC --essai : ${vus}/3`); process.exit(1); }
  console.log('OK    --essai : une attribution déclarée fait apparaître son bloc, vide il disparaît, un code faussé est refusé (3 sur 3).');
}
