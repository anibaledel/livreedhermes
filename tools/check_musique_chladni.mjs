#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_musique_chladni.mjs — la page musique-chladni.html, dans Chromium, avec un vrai son
// (un des 7 morceaux fournis) et un faux micro.
//
//   - elle se charge sans erreur de script ; tous ses textes viennent de
//     assets/musique-chladni-textes.js (aucun texte français en dur dans le code de l'interface) ;
//   - six en-têtes, deux fenêtres (Validé, Essai), l'aperçu au survol, Valider/Annuler ; les ordres 18 et 30 chargés à la demande ;
//     les six variantes de case (collections bicolores), deux couleurs chacune, un changement de bande garde le motif ;
//   - un morceau fait choisir des motifs dans les trois vues et les trois modes ; le tricolore a trois valeurs ;
//   - les raccourcis (1 à 3, Espace, V, P), Échap et le clic extérieur ferment un panneau ;
//   - le bloc « La semaine » : 7 cartes, aucune requête vers YouTube ni TikTok avant le clic, lien de repli, masqué sans données, tools/semaine.mjs ;
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
  const page = await ctx.newPage(), erreurs = [], externes = new Set(), demandes = [];
  const origine = new URL(base).origin;
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('request', (r) => { demandes.push(r.url()); const u = new URL(r.url()); if (u.origin !== origine && !/^(data|blob):/.test(r.url()) && !/cloudflareinsights|google|fonts\./.test(u.host)) externes.add(u.host); });
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
  ok(!(await page.isDisabled('#vm-o-fmt-18')) && !(await page.isDisabled('#vm-o-fmt-30')), 'les ordres 18 et 30 doivent être proposés');
  ok(!demandes.some((u) => /bloc-(18|30)-structure/.test(u)), 'les ordres 18 et 30 ne doivent pas se charger avant le premier choix du format');
  ok((await page.$$('#vm-g-fond .vm-o')).length === 6, 'six variantes de case attendues (B3x, BA33, BA50 sont des alias, jamais proposés)');
  ok(await page.isHidden('#vm-g-fond'), 'la variante de case ne s’applique qu’au bicolore : cachée au tricolore');

  await page.selectOption('#vmSource', 'j2'); await page.click('#vmLecture'); await page.waitForTimeout(3500);
  let e = await etat();
  ok(e.source === 'morceau' && e.motif >= 0, `un morceau ne choisit aucun motif (${JSON.stringify(e)})`);
  ok(e.fps >= 15, `${e.fps.toFixed(1)} images par seconde, 15 au moins attendues`);
  ok(await couleurs('vmValideToile') === 2, 'tricolore, vue « signes » : la palette crème a deux couleurs');
  ok(e.motif === e.motifEssai, 'les deux fenêtres, mêmes réglages, doivent montrer le même motif');

  // aperçu au survol : l'essai change, le validé non
  await ouvrir('col'); await page.hover('#vm-o-col-bi'); await page.waitForTimeout(500);
  ok((await page.$$eval('.vm-o[data-g="col"]:not([hidden])', (o) => o.map((x) => x.dataset.k))).join() === 'tri,bi,ce', 'ordre 12 : trois collections attendues (tricolore, deux miroirs, symétrie centrale)');
  ok((await page.$$eval('.vm-o[data-g="col"]:not([hidden]) small', (o) => o.map((x) => x.textContent.match(/\d+/)[0]))).join() === '512,136,136', 'ordre 12 : comptes 512, 136, 136 attendus');
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
  // ordres 18 et 30 : chargés au premier choix ; collections, variante de case, changement de bande sans rien recalculer
  await choisir('fmt', '18'); await page.waitForFunction(() => window.__voirSaMusique.etat().blocs.includes('b1971128'), null, { timeout: 20000 }); await page.click('#vmValider');
  ok(demandes.some((u) => /bloc-18-structure/.test(u)), 'l\'ordre 18 ne s\'est pas chargé au choix du format');
  ok(!demandes.some((u) => /bloc-30-structure/.test(u)), 'l\'ordre 30 s\'est chargé sans avoir été choisi');
  e = await etat(); ok(e.valide.fmt === 18 && e.valide.col === 'b1971128' && e.n === 128, `ordre 18 : collection par défaut attendue b1971128 (128 motifs) : ${JSON.stringify(e.valide)} n=${e.n}`);
  await ouvrir('col'); ok((await page.$$eval('.vm-o[data-g="col"]:not([hidden])', (o) => o.map((x) => x.dataset.k))).join() === 'b1971128,b16012838,b3016090,f613,f18,fpilote,p18', 'ordre 18 : sept collections attendues');
  ok((await page.$$eval('.vm-o[data-g="col"]:not([hidden]) small', (o) => o.map((x) => x.textContent.match(/\d+/)[0]))).join() === '128,128,128,256,256,256,128', 'ordre 18 : comptes 128, 128, 128, 256, 256, 256, 128 attendus'); await page.mouse.click(5, 5);
  ok(await page.isVisible('#vm-g-fond'), 'ordre 18 : la variante de case doit être proposée');
  for (const v of ['signes', 'lignes']) { await choisir('view', v); await page.click('#vmValider'); await page.waitForTimeout(600); ok(await trace('vmValideToile') >= 2, `ordre 18 : vue « ${v} » vide`); }
  await choisir('view', 'pavage'); await page.click('#vmValider'); await page.waitForTimeout(300);
  {
    await page.locator('#vmReglages').evaluate((n) => { n.closest('details').open = true; });
    await page.click('#vmPause'); const avant = await etat();
    await choisir('fond', 'B121'); await page.click('#vmValider'); await choisir('fond', 'B12m'); await page.click('#vmValider'); const apres = await etat();
    ok(apres.constructions === avant.constructions && apres.valide.col === avant.valide.col && apres.motif === avant.motif, `un changement de bande doit garder le motif et ne rien recalculer (${avant.motif} puis ${apres.motif}, constructions ${avant.constructions} puis ${apres.constructions})`);
    await page.click('#vmPause');
  }
  await choisir('fmt', '30'); await page.waitForFunction(() => window.__voirSaMusique.etat().blocs.includes('p30'), null, { timeout: 20000 }); await page.click('#vmValider'); await page.waitForTimeout(600);
  e = await etat(); ok(e.valide.fmt === 30 && e.n === 88, `ordre 30 : 88 motifs attendus (${e.n})`); ok(await couleurs('vmValideToile', 0.25) === 2, 'ordre 30 : deux couleurs attendues');
  for (const m of ['rythme', 'chemin', 'image']) { await choisir('mode', m); await page.click('#vmValider'); await page.waitForTimeout(1500); const x = await etat(); ok(x.valide.mode === m && x.motif >= 0 && x.motif < 88, `ordre 30 mode « ${m} » : motif ${x.motif}`); }
  await choisir('fmt', '12'); await page.click('#vmValider');
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


  // plein écran : couvre la fenêtre, aucun étirement, cases carrées (1920 × 1080 et 390 × 844 en portrait)
  const mesurePlein = (pg) => pg.evaluate(() => {
    const c = document.getElementById('vmPleinToile'), W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data, r = c.getBoundingClientRect(), n = {};
    for (let k = 0; k < d.length; k += 4 * 29) { const q = `${d[k]},${d[k + 1]},${d[k + 2]}`; n[q] = (n[q] || 0) + 1; }
    const pal = Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([q]) => q.split(',').map(Number)), cl = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) { let bj = 0, bd = 1e9; for (let j = 0; j < 3; j++) { const e = (d[i * 4] - pal[j][0]) ** 2 + (d[i * 4 + 1] - pal[j][1]) ** 2 + (d[i * 4 + 2] - pal[j][2]) ** 2; if (e < bd) { bd = e; bj = j; } } cl[i] = bj; }
    const premier = (hist, attendu) => { const tot = Object.values(hist).reduce((a, b) => a + b, 0), cles = Object.keys(hist).map(Number).filter((l) => l >= attendu * 0.6).sort((a, b) => a - b); return cles.find((l) => hist[l] > tot * 0.04); };
    const hh = {}, hv = {}, attendu = window.__voirSaMusique.caseAttendue();
    for (let y = 3; y < H; y += 37) { let run = 1; for (let x = 1; x < W; x++) { if (cl[y * W + x] === cl[y * W + x - 1]) run++; else { if (x - run > 0) hh[run] = (hh[run] || 0) + 1; run = 1; } } }
    for (let x = 3; x < W; x += 37) { let run = 1; for (let y = 1; y < H; y++) { if (cl[y * W + x] === cl[(y - 1) * W + x]) run++; else { if (y - run > 0) hv[run] = (hv[run] || 0) + 1; run = 1; } } }
    return { W, H, rect: { x: r.x, y: r.y, w: r.width, h: r.height }, iw: innerWidth, ih: innerHeight, fs: !!document.fullscreenElement, caseH: premier(hh, attendu), caseV: premier(hv, attendu), attendu };
  });
  for (const [w, h] of [[1920, 1080], [390, 844]]) {
    const pg = await (await navigateur.newContext({ viewport: { width: w, height: h } })).newPage();
    await pg.goto(`${base}/musique-chladni.html`); await pg.waitForFunction(() => window.__voirSaMusique); await pg.selectOption('#vmSource', 'j2'); await pg.click('#vmLecture');
    await pg.click('#vm-g-view-btn'); await pg.click('#vm-o-view-pavage'); await pg.click('#vmValider'); await pg.waitForTimeout(500);
    await pg.click('#vmPleinBtn'); await pg.waitForTimeout(900);
    const m = await mesurePlein(pg);
    ok(Math.abs(m.rect.x) <= 1 && Math.abs(m.rect.y) <= 1 && Math.abs(m.rect.w - m.iw) <= 1 && Math.abs(m.rect.h - m.ih) <= 1, `plein écran ${w} × ${h} : le canvas ne couvre pas la fenêtre ${JSON.stringify(m.rect)}`);
    ok(Math.abs(m.W / m.rect.w - m.H / m.rect.h) * m.rect.w <= 1, `plein écran ${w} × ${h} : le bitmap ${m.W} × ${m.H} est étiré dans ${m.rect.w} × ${m.rect.h}`);
    ok(m.caseH && m.caseV && Math.abs(m.caseH - m.caseV) <= 1, `plein écran ${w} × ${h} : cases de ${m.caseH} × ${m.caseV} px (carrées à 1 px près attendues)`);
    ok(m.caseH && Math.abs(m.caseH - m.attendu) <= 1.5, `plein écran ${w} × ${h} : case de ${m.caseH} px, ${m.attendu.toFixed(1)} px attendus (l'échelle de la fenêtre validée)`);
    if (w === 1920) await pg.screenshot({ path: process.env.CAPTURE_PLEIN || '/tmp/claude-0/plein-1920.png' });
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
    ok(await pg.isHidden('#vmPlein'), `plein écran ${w} × ${h} : Échap doit refermer la scène`);
  }
  // la fenêtre montre 2 × l'ordre cases de large : 24, 36, 60 (2 × 2 tuiles à l'ordre 12, une seule tuile aux ordres 18 et 30)
  ok(await page.evaluate(() => [12, 18, 30].map((o) => window.__voirSaMusique.tuilesParCote(o) * window.__voirSaMusique.M.GRILLE[o]).join()) === '24,36,60', 'la fenêtre doit montrer 24, 36 et 60 cases de large aux ordres 12, 18 et 30');

  // enregistrement : trois secondes
  await page.locator('#vmEnregistrement').evaluate((n) => { n.closest('details').open = true; });
  await page.selectOption('#vmFormatVideo', '45');
  const dl = page.waitForEvent('download', { timeout: 30000 });
  await page.click('#vmEnreg'); await page.waitForTimeout(3000); await page.click('#vmEnreg');
  const fichier = await dl, v = await page.evaluate(() => window.__derniereVideo);
  ok(v && v.octets > 20000 && v.largeur === 1080 && v.hauteur === 1350, `enregistrement 4:5 : ${JSON.stringify(v)}`);
  ok(/\.(mp4|webm)$/.test(fichier.suggestedFilename()), 'enregistrement : extension inattendue');

  // le bloc « La semaine » : sept cartes, rien de YouTube ni de TikTok avant le clic, repli, masqué sans données
  {
    const nouvelle = async (corps, largeur = 390) => {
      const c = await navigateur.newContext({ viewport: { width: largeur, height: 900 } }), pg = await c.newPage(), reqs = [], errs = [];
      pg.on('request', (r) => reqs.push(r.url())); pg.on('pageerror', (e) => errs.push(e.message));
      pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|cloudflareinsights|CORS policy|Permissions policy|compute-pressure/i.test(m.text())) errs.push(m.text()); // les erreurs des services tiers (balise de mesure, lecteur YouTube) ne sont pas celles de la page });
      if (corps !== undefined) await pg.route('**/data/musique-chladni/semaine.json', (r) => (corps === null ? r.fulfill({ status: 404, body: '' }) : r.fulfill({ contentType: 'application/json', body: JSON.stringify(corps) })));
      await pg.goto(`${base}/musique-chladni.html`); await pg.waitForFunction(() => window.__voirSaMusique); await pg.waitForTimeout(800);
      return { pg, reqs, errs };
    };
    const affiches = JSON.parse((await import('node:fs')).readFileSync(path.join(ROOT, 'data/musique-chladni/semaine.json'), 'utf8')).jours.map((j) => j.affiche); // les affiches de la semaine, telles que le fichier les nomme
    const tiers = (reqs) => reqs.filter((u) => /youtube|youtu\.be|tiktok|ytimg|googlevideo/i.test(u));
    // les données réelles : 7 cartes, la mention exacte, aucune requête tierce avant le clic, 390 et 360 px
    for (const w of [390, 360]) {
      const { pg, reqs, errs } = await nouvelle(undefined, w);
      ok(await pg.isVisible('#vmSemaine') && (await pg.$$('.vm-jour')).length === 7, `« La semaine » (${w} px) : 7 cartes attendues`);
      ok((await pg.textContent('#vmSemaineMention')).trim() === 'Musique composée avec l\'aide de l\'IA par MC Claude.', 'la mention « Musique composée avec l\'aide de l\'IA par MC Claude. » doit être exacte');
      ok(tiers(reqs).length === 0, `« La semaine » : requêtes vers YouTube/TikTok avant tout clic : ${tiers(reqs).slice(0, 3).join(' | ')}`);
      const large = await pg.evaluate(() => { let max = document.documentElement.scrollWidth; for (const e of document.querySelectorAll('#vmSemaine *')) { const r = e.getBoundingClientRect(); if (r.width && r.right > max) max = r.right; } return Math.ceil(max); });
      ok(large <= w, `« La semaine » à ${w} px : ${large} px de large`);
      ok(errs.length === 0, `« La semaine » : erreurs ${errs.slice(0, 2).join(' | ')}`);
      if (w === 390 && process.env.CAPTURE_SEMAINE) await pg.locator('#vmSemaine').screenshot({ path: process.env.CAPTURE_SEMAINE });
      await pg.context().close();
    }
    // un jour sans vidéo (« bientôt »), un faux identifiant YouTube sans réseau (lien de repli), un TikTok
    {
      const jours = [
        { n: 1, tonalite: 'do dièse mineur', date: '2026-11-09', affiche: affiches[0] },
        { n: 2, tonalite: 'la mineur', date: '', affiche: affiches[1], youtube: 'AAAAAAAAAAA', tiktok: 'https://www.tiktok.com/@compte/video/7000000000000000000' },
      ];
      const { pg, reqs, errs } = await nouvelle({ semaine: 'essai', titre: 'Essai', jours });
      const cartes = await pg.$$('.vm-jour');
      ok(cartes.length === 2, `fixture : 2 cartes attendues (${cartes.length})`);
      ok(/Bientôt/.test(await cartes[0].textContent()) && (await cartes[0].$$('button')).length === 0, 'un jour sans vidéo ne montre que son affiche et « Bientôt »');
      ok(/9 novembre 2026/.test(await cartes[0].textContent()), 'la date de publication doit s\'afficher');
      ok(tiers(reqs).length === 0, 'fixture : requêtes tierces avant le clic');
      await pg.click('.vm-jour:nth-of-type(2) .vm-jour-aff'); await pg.waitForTimeout(600);
      const src = await pg.getAttribute('.vm-jour iframe', 'src');
      ok(/^https:\/\/www\.youtube-nocookie\.com\/embed\/AAAAAAAAAAA\?/.test(src || '') && !/autoplay/.test(src || ''), `YouTube : adresse nocookie sans lecture automatique attendue (${src})`);
      ok(await pg.isVisible('.vm-jour-liens a'), 'le lien direct « Voir sur YouTube » doit rester affiché sous le lecteur');
      ok(tiers(reqs).some((u) => /youtube-nocookie/.test(u)) && !tiers(reqs).some((u) => /tiktok/.test(u)), 'après le clic : YouTube seulement, TikTok pas encore');
      await pg.click('.vm-jour-autre'); await pg.waitForTimeout(600);
      ok(await pg.isVisible('.vm-jour .tiktok-embed') && tiers(reqs).some((u) => /tiktok\.com\/embed\.js/.test(u)), 'TikTok : le lecteur officiel ne se charge qu\'au clic sur « Lire ici (TikTok) »');
      ok(errs.length === 0, `intégration impossible sans réseau : aucune erreur bloquante attendue (${errs.slice(0, 2).join(' | ')})`);
      await pg.context().close();
    }
    // fichier vide, sans jours, ou absent : le bloc entier est masqué, sans exception
    for (const [nom, corps] of [['vide', {}], ['sans jours', { semaine: 'x', jours: [] }], ['absent', null]]) {
      const { pg, errs } = await nouvelle(corps);
      ok(await pg.isHidden('#vmSemaine'), `fichier ${nom} : le bloc doit être masqué`);
      ok(errs.length === 0, `fichier ${nom} : erreur ${errs.slice(0, 2).join(' | ')}`);
      await pg.context().close();
    }
    // l'outil de contrôle : le vrai fichier passe, un faux identifiant échoue
    const { spawnSync } = await import('node:child_process'), { writeFileSync, mkdtempSync } = await import('node:fs'), { tmpdir } = await import('node:os');
    const bon = spawnSync('node', [path.join(ROOT, 'tools/semaine.mjs')], { encoding: 'utf8' });
    ok(bon.status === 0, `tools/semaine.mjs : le fichier de la semaine doit passer (${(bon.stderr || '').split('\n')[0]})`);
    const tmp = path.join(mkdtempSync(path.join(tmpdir(), 'semaine-')), 'semaine.json');
    writeFileSync(tmp, JSON.stringify({ semaine: 'x', jours: [{ n: 1, tonalite: 'la', affiche: affiches[0], youtube: 'trop-court' }, { n: 1, tonalite: 'la', affiche: `${affiches[0]}.absente`, tiktok: 'http://exemple.org/x' }] }));
    const mauvais = spawnSync('node', [path.join(ROOT, 'tools/semaine.mjs'), tmp], { encoding: 'utf8' });
    ok(mauvais.status === 1 && /11 caractères/.test(mauvais.stderr) && /en double/.test(mauvais.stderr) && /n'existe pas/.test(mauvais.stderr) && /TikTok/.test(mauvais.stderr), 'tools/semaine.mjs : identifiant court, numéro en double, affiche absente et URL TikTok fausse doivent être refusés');
  }

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
console.log('Voir sa musique : charge, dessine en trois vues, six variantes de case, les trois ordres (18 et 30 à la demande), pilote en trois modes, enregistre, tient à 390 et 360 px, et n’envoie rien.');
if (serveur && serveur.fermer) serveur.fermer();
process.exit(0);
