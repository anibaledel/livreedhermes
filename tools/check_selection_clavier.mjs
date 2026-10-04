#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_selection_clavier.mjs — creation-motifs-yi-king.html se pilote au
// clavier seul (A02, audit du 4 octobre 2026 : les 16 cartes .sel-card et
// les 64 cases .ech-cell étaient des div sans rôle ni tabindex, cliquables à
// la souris seulement).
//
// Recette, depuis le haut de la page, sans souris : Tab jusqu'à une image,
// Entrée ; Tab jusqu'à une autre, Espace ; l'échiquier paraît ; Tab jusqu'à
// une case, Entrée ; le détail s'ouvre et le focus y passe ; Tab jusqu'à un
// export, Entrée : le fichier se télécharge. Et sur la page :
//   - chaque carte et chaque case est un <button>, avec un nom accessible ;
//   - les cartes disent leur état (aria-pressed) ;
//   - le focus est visible (contour non nul) sur une carte et une case ;
//   - après chaque choix, le focus reste sur l'élément choisi.
//
// Usage : node tools/check_selection_clavier.mjs [local | https://anibal-amiot.com]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] || 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };
const ok = (m) => console.log(`OK    ${m}`);

const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  const page = await navigateur.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  await page.goto(`${BASE}/creation-motifs-yi-king.html`, { waitUntil: 'load' });
  await page.waitForSelector('.sel-card');
  const actif = () => page.evaluate(() => { const e = document.activeElement; return { cls: e?.className || '', tag: e?.tagName, id: e?.id, nom: e?.getAttribute('aria-label') || e?.textContent?.trim().slice(0, 40), pressed: e?.getAttribute('aria-pressed'), contour: e ? getComputedStyle(e).outlineStyle + ' ' + getComputedStyle(e).outlineWidth : '' }; });
  // Tab jusqu'à un élément qui satisfait « cond » (au plus n fois)
  async function tabJusqua(cond, quoi, n = 600) {
    for (let i = 0; i < n; i++) {
      await page.keyboard.press('Tab');
      const a = await actif();
      if (cond(a)) return a;
    }
    echec(`${quoi} : jamais atteint au clavier en ${n} Tab`);
    return null;
  }

  // la structure
  const structure = await page.evaluate(() => ({
    cartes: [...document.querySelectorAll('.sel-card')].map((e) => ({ tag: e.tagName, nom: e.getAttribute('aria-label'), pressed: e.getAttribute('aria-pressed') })),
  }));
  const mauvaises = structure.cartes.filter((c) => c.tag !== 'BUTTON' || !c.nom || !['true', 'false'].includes(c.pressed));
  if (mauvaises.length) echec(`${mauvaises.length} carte(s) sur ${structure.cartes.length} sans bouton, nom ou aria-pressed`);
  else ok(`${structure.cartes.length} cartes : des <button> nommés, avec aria-pressed`);

  // 1re image : Entrée
  page.on('dialog', (d) => d.dismiss());
  let a = await tabJusqua((x) => x.cls.includes('sel-card'), 'une image');
  if (a) {
    if (a.contour.startsWith('none') || a.contour.endsWith(' 0px')) echec(`focus invisible sur une carte (${a.contour})`);
    await page.keyboard.press('Enter');
    const b = await actif();
    if (b.cls.includes('sel-card') && b.pressed === 'true') ok(`Entrée choisit « ${b.nom} », le focus y reste`);
    else echec(`après Entrée : focus sur ${JSON.stringify(b)}`);
    // 2e image : Tab, Espace
    await page.keyboard.press('Tab');
    const c = await actif();
    if (!c.cls.includes('sel-card')) echec(`la carte suivante n'est pas au Tab suivant (${JSON.stringify(c)})`);
    await page.keyboard.press('Space');
    const d = await actif();
    if (d.cls.includes('sel-card') && d.pressed === 'true') ok(`Espace choisit « ${d.nom} »`);
    else echec(`après Espace : ${JSON.stringify(d)}`);
  }
  // l'échiquier
  await page.waitForSelector('.ech-cell', { timeout: 10000 }).catch(() => echec('l\'échiquier ne paraît pas après deux choix'));
  const cases = await page.evaluate(() => [...document.querySelectorAll('.ech-cell')].map((e) => ({ tag: e.tagName, nom: e.getAttribute('aria-label') })));
  const mauvaisesCases = cases.filter((c) => c.tag !== 'BUTTON' || !c.nom);
  if (cases.length !== 64 || mauvaisesCases.length) echec(`${cases.length} cases, dont ${mauvaisesCases.length} sans bouton ou sans nom`);
  else ok(`64 cases : des <button> nommés (« ${cases[0].nom} »…)`);
  a = await tabJusqua((x) => x.cls.includes('ech-cell'), 'une case de l\'échiquier');
  if (a) {
    if (a.contour.startsWith('none') || a.contour.endsWith(' 0px')) echec(`focus invisible sur une case (${a.contour})`);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.detail-back', { timeout: 10000 }).catch(() => echec('Entrée sur une case n\'ouvre pas le détail'));
    const b = await actif();
    if (b.cls.includes('detail-back')) ok(`Entrée ouvre « ${a.nom} », le focus passe au détail`);
    else echec(`le focus ne passe pas au détail (${JSON.stringify(b)})`);
    // un export
    const exp = await tabJusqua((x) => ['btnGridJson', 'btnGridPng', 'btnCreateSVG'].includes(x.id), 'un export', 60);
    if (exp) {
      const telechargement = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      await page.keyboard.press('Enter');
      const t = await telechargement;
      if (t) ok(`Entrée sur « ${exp.nom} » télécharge ${t.suggestedFilename()}`);
      else if (exp.id === 'btnCreateSVG') ok(`Entrée sur « ${exp.nom} » (création du SVG)`);
      else echec(`Entrée sur ${exp.id} ne télécharge rien`);
    }
    // retour à l'échiquier : le focus revient sur la case
    await page.focus('.detail-back');
    await page.keyboard.press('Enter');
    const r = await actif();
    if (r.cls.includes('ech-cell')) ok('« ← Retour à l\'échiquier » rend le focus à la case');
    else echec(`après le retour : focus sur ${JSON.stringify(r)}`);
  }
} finally {
  await navigateur.close();
  serveur?.fermer();
}
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log('\nLa sélection se fait au clavier seul : deux images, une case, un export.');
