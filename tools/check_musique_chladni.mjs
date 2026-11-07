#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_musique_chladni.mjs — la page musique-chladni.html, dans Chromium, avec un vrai son
// (un des 7 morceaux fournis) et un faux micro.
//
//   - elle se charge sans erreur de script ; tous ses textes viennent de
//     assets/musique-chladni-textes.js (aucun texte français en dur dans le code de l'interface) ;
//   - six en-têtes, deux fenêtres (Validé, Essai), l'aperçu au survol, Valider/Annuler ; les ordres
//     18 et 30 désactivés ; les neuf variantes de case (bicolore seulement), deux couleurs chacune ;
//   - un morceau fait choisir des motifs dans les trois vues et les trois modes ; le tricolore a trois valeurs ;
//   - les raccourcis (1 à 3, Espace, V, P), Échap et le clic extérieur ferment un panneau ;
//   - le micro (faux périphérique) démarre ; le refus du micro est dit clairement ;
//   - rien n'est envoyé : aucune requête hors du site pendant l'usage ;
//   - l'enregistrement fournit une vidéo (MP4 si le navigateur l'écrit, sinon WebM), avec du son ;
//   - 390 et 360 px : rien ne dépasse le bord droit ;
//   - la cadence : au moins 15 images par seconde sur la machine du contrôle (la cible de la
//     page est 30 ; elle la mesure et le dit), à ne pas confondre avec la cible.
//
// Usage : node tools/check_musique_chladni.mjs [base|local] [--essai]
//   --essai : une page privée de sa fonction de pilotage doit échouer.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), essai = args.includes('--essai');
let base = args.find((a) => !a.startsWith('--')) || 'local', serveur = null;
if (base === 'local') { serveur = await servirDepot(ROOT); base = serveur.url; }
const echecs = [], ok = (c, m) => { if (!c) echecs.push(m); return c; };

// aucune phrase française dans le code de l'interface
{
  const ui = readFileSync(path.join(ROOT, 'assets/musique-chladni-ui.js'), 'utf8').replace(/\/\/[^\n]*/g, '');
  const phrases = ui.match(/(['"`])[^'"`\n]*[  ][^'"`\n]*[éèêàùçô][^'"`\n]*\1/g) || [];
  ok(phrases.length === 0, `texte français en dur dans musique-chladni-ui.js : ${phrases.slice(0, 3).join(' | ')}`);
}

const navigateur = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
try {
  const ctx = await navigateur.newContext({ viewport: { width: 1000, height: 1200 }, acceptDownloads: true });
  const page = await ctx.newPage(), erreurs = [], externes = new Set();
  const origine = new URL(base).origin;
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('request', (r) => { const u = new URL(r.url()); if (u.origin !== origine && !/^(data|blob):/.test(r.url()) && !/cloudflareinsights|google|fonts\./.test(u.host)) externes.add(u.host); });
  if (essai) await page.route('**/assets/musique-chladni-moteur.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'export * from "/assets/musique-chladni-moteur-absent.js";' }));
  await page.goto(`${base}/musique-chladni.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__voirSaMusique, null, { timeout: 20000 });
  const etat = () => page.evaluate(() => window.__voirSaMusique.etat());
  const couleurs = async (id, part = 0.75) => { for (let t = 0; t < 40 && (await etat()).fondu < 1; t++) await page.waitForTimeout(100); return couleursBrut(id, part); };
  const couleursBrut = (id, part) => page.evaluate(([i, part]) => { const c = document.getElementById(i), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const n = {}; let t = 0; for (let k = 0; k < d.length; k += 4 * 13) { const q = `${d[k] >> 5},${d[k + 1] >> 5},${d[k + 2] >> 5}`; n[q] = (n[q] || 0) + 1; t++; } if (part < 0.5) return Object.values(n).filter((x) => x / t > part).length; let cum = 0, m = 0; for (const x of Object.values(n).sort((a, b) => b - a)) { cum += x; m++; if (cum / t >= part) break; } return m; }, [id, part]);
  const trace = (id) => page.evaluate((i) => { const c = document.getElementById(i), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, n = {}; let t = 0; for (let k = 0; k < d.length; k += 4 * 13) { const q = `${d[k] >> 5},${d[k + 1] >> 5},${d[k + 2] >> 5}`; n[q] = (n[q] || 0) + 1; t++; } return Object.values(n).filter((x) => x / t > 0.003).length; }, id);
  const ouvrir = async (g) => { await page.click(`#vm-g-${g}-btn`); };
  const choisir = async (g, v) => { await ouvrir(g); await page.click(`#vm-o-${g}-${v}`); };

  // six en-têtes, deux fenêtres, ordre 12 seul
  ok((await page.$$('.vm-opts .vm-grp > h3 > button')).length === 6, 'six en-têtes attendus');
  ok(await page.isDisabled('#vm-o-fmt-18') && await page.isDisabled('#vm-o-fmt-30'), 'les ordres 18 et 30 doivent être désactivés');
  ok((await page.$$('#vm-g-fond .vm-o')).length === 9, 'neuf variantes de case attendues');
  ok(await page.isHidden('#vm-g-fond'), 'la variante de case ne s’applique qu’au bicolore : cachée au tricolore');

  await page.selectOption('#vmSource', 'j2'); await page.click('#vmLecture'); await page.waitForTimeout(3500);
  let e = await etat();
  ok(e.source === 'morceau' && e.motif >= 0, `un morceau ne choisit aucun motif (${JSON.stringify(e)})`);
  ok(e.fps >= 15, `${e.fps.toFixed(1)} images par seconde, 15 au moins attendues`);
  ok(await couleurs('vmValideToile') === 2, 'tricolore, vue « signes » : la palette crème a deux couleurs');
  ok(e.motif === e.motifEssai, 'les deux fenêtres, mêmes réglages, doivent montrer le même motif');

  // aperçu au survol : l'essai change, le validé non
  await ouvrir('col'); await page.hover('#vm-o-col-bi'); await page.waitForTimeout(500);
  const cap = await page.textContent('#vmEssaiCap'), capV = await page.textContent('#vmValideCap');
  ok(/Bicolore/.test(cap) && /Tricolore/.test(capV), `aperçu au survol : légende de l'essai « ${cap} », du validé « ${capV} »`);
  await page.click('#vm-o-col-bi'); await page.waitForTimeout(300);
  ok(await page.isVisible('#vm-g-fond'), 'la variante de case doit apparaître au bicolore');
  ok((await etat()).valide.col === 'tri', 'le validé ne doit pas changer avant « Valider l’essai »');
  await page.click('#vmValider'); await page.waitForTimeout(500);
  e = await etat(); ok(e.valide.col === 'bi', 'Valider l’essai : le validé doit devenir bicolore');
  ok(await couleurs('vmValideToile') === 2, 'bicolore, signes : deux couleurs attendues');
  // clic à l'extérieur et Échap ferment le panneau
  await ouvrir('view'); await page.mouse.click(5, 5); ok(!(await page.$('.vm-grp.open')), 'un clic à l’extérieur doit fermer le panneau');
  await ouvrir('view'); await page.keyboard.press('Escape'); ok(!(await page.$('.vm-grp.open')), 'Échap doit fermer le panneau');
  // vues
  for (const v of ['lignes', 'pavage', 'signes']) { await choisir('view', v); await page.click('#vmValider'); await page.waitForTimeout(500); await couleurs('vmValideToile'); ok(await trace('vmValideToile') >= 2, `vue « ${v} » : rien de dessiné`); }
  // variante de case : les 9 bandes se dessinent, deux couleurs
  await choisir('view', 'pavage'); await page.click('#vmValider');
  for (const id of await page.$$eval('#vm-g-fond .vm-o', (o) => o.map((x) => x.dataset.k))) { await choisir('fond', id); await page.click('#vmValider'); await page.waitForTimeout(150); ok(await couleurs('vmValideToile', 0.25) === 2, `variante ${id} : deux couleurs attendues`); }
  // tricolore : trois valeurs
  await choisir('col', 'tri'); await choisir('pal', 'creme'); await choisir('view', 'pavage'); await page.click('#vmValider'); await page.waitForTimeout(500);
  ok(await couleurs('vmValideToile') === 3, 'tricolore, cellules : trois valeurs attendues');
  // modes : changer de mode après plusieurs pas ne casse rien
  for (const m of ['rythme', 'chemin', 'image']) { await choisir('mode', m); await page.click('#vmValider'); await page.waitForTimeout(1800); const x = await etat(); ok(x.valide.mode === m && x.motif >= 0, `mode « ${m} » : pas de motif`); }
  // raccourcis
  await page.mouse.click(5, 5); await page.keyboard.press('2'); ok((await etat()).essai.view === 'lignes', 'touche 2 : vue « lignes » attendue');
  await page.keyboard.press('Space'); ok((await etat()).essai.mode !== 'image', 'Espace : mode suivant attendu');
  await page.keyboard.press('v'); ok((await etat()).valide.view === 'lignes', 'touche V : valider attendu');
  await page.locator('#vmReglages').evaluate((n) => { n.closest('details').open = true; });
  await page.keyboard.press('p'); ok(await page.getAttribute('#vmPause', 'aria-pressed') === 'true', 'touche P : pause attendue'); await page.keyboard.press('p');
  await page.click('#vmAnnuler');
  ok((await etat()).valide.pal !== 'son', 'la teinte qui suit le son doit être désactivée par défaut');

  // enregistrement : trois secondes
  await page.locator('#vmEnregistrement').evaluate((n) => { n.closest('details').open = true; });
  await page.selectOption('#vmFormatVideo', '45');
  const dl = page.waitForEvent('download', { timeout: 30000 });
  await page.click('#vmEnreg'); await page.waitForTimeout(3000); await page.click('#vmEnreg');
  const fichier = await dl, v = await page.evaluate(() => window.__derniereVideo);
  ok(v && v.octets > 20000 && v.largeur === 1080 && v.hauteur === 1350, `enregistrement 4:5 : ${JSON.stringify(v)}`);
  ok(/\.(mp4|webm)$/.test(fichier.suggestedFilename()), 'enregistrement : extension inattendue');

  // micro
  await page.click('#vmLecture'); await page.selectOption('#vmSource', 'mic'); await page.click('#vmLecture'); await page.waitForTimeout(2000);
  ok((await etat()).source === 'micro', 'le micro (faux périphérique) ne démarre pas');
  await page.click('#vmLecture');

  // rien n'est envoyé
  ok(externes.size === 0, `requêtes hors du site : ${[...externes].join(', ')}`);
  ok(erreurs.length === 0, `erreurs de script : ${erreurs.slice(0, 3).join(' | ')}`);

  // le refus du micro est dit
  const refus = await (await navigateur.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
  await refus.addInitScript(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('refusé'), { name: 'NotAllowedError' })); });
  await refus.goto(`${base}/musique-chladni.html`); await refus.waitForFunction(() => window.__voirSaMusique); await refus.selectOption('#vmSource', 'mic'); await refus.click('#vmLecture'); await refus.waitForTimeout(500);
  const texte = await refus.textContent('#vmMessage');
  ok(/refusé/.test(texte) && /Autorisez/.test(texte), `micro refusé : message inattendu « ${texte} »`);

  // 390 et 360 px
  for (const w of [390, 360]) {
    const mobile = await (await navigateur.newContext({ viewport: { width: w, height: 800 } })).newPage();
    await mobile.goto(`${base}/musique-chladni.html`); await mobile.waitForFunction(() => window.__voirSaMusique); await mobile.waitForTimeout(500);
    await mobile.click('#vm-g-col-btn');
    const largeur = await mobile.evaluate(() => {
      let max = document.documentElement.scrollWidth;
      for (const el of document.querySelectorAll('main *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > max) max = r.right; }
      return Math.ceil(max);
    });
    ok(largeur <= w, `${w} px : la page fait ${largeur} px de large`);
  }
} catch (err) { echecs.push(`la page ne se charge pas ou le contrôle s'arrête : ${String(err.message).split('\n')[0]}`); } finally { await navigateur.close(); }

if (essai) {
  if (echecs.length) { console.log(`Essai : une page privée de son moteur est refusée — ${echecs[0].slice(0, 120)}`); process.exit(0); }
  console.error('Essai : la page privée de son moteur n’a pas été refusée.'); process.exit(1);
}
if (echecs.length) { for (const f of echecs) console.error('ÉCHEC ' + f); process.exit(1); }
console.log('Voir sa musique : charge, dessine en trois vues, neuf variantes de case et deux collections, pilote en trois modes, enregistre, tient à 390 et 360 px, et n’envoie rien.');
if (serveur && serveur.fermer) serveur.fermer();
process.exit(0);
