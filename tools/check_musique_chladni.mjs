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
//     page est 30 ; elle la mesure et le dit), à ne pas confondre avec la cible ;
//   - le démarrage simple (prompt 201) : à l'arrivée (1000 et 390 px) un grand bouton Écouter avant la figure, le mode Simple ne montre que
//     bouton, morceau, figure, nom du motif et Plein écran ; Écouter lance le premier morceau, Pause l'arrête, « Plus d'options » ouvre l'Avancé
//     (mémorisé, et la page marche sans localStorage) ; ?morceau= (7 exemples) et ?mode= seuls, toute autre valeur ignorée ; l'image PNG, Partager
//     (seulement si canShare({files})), Copier le lien, les informations de l'appareil ; mouvement réduit : figure fixe + bouton Animer ;
//     contexte audio suspendu, onglet caché, micro absent ; mobile émulé ; temps d'image processeur ×4.
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

// la mention de l'IA est UN seul texte, avec son point : incrustation des enregistrements, bloc « La semaine » (texte et HTML), phrase d'explication
{
  const { CONFIG } = await import('../assets/musique-chladni-config.js'), { texte } = await import('../assets/musique-chladni-textes.js'), phrase = 'Musique composée avec l\'IA par MC Claude.';
  ok(CONFIG.enregistrement.ligneIA === phrase, `ligneIA doit être « ${phrase} » (avec son point) : « ${CONFIG.enregistrement.ligneIA} »`);
  ok(texte('semaineMention') === phrase && readFileSync(path.join(ROOT, 'musique-chladni.html'), 'utf8').includes(`>${phrase}<`) && texte('mentionIA').includes(`« ${phrase} »`), 'la mention de l\'IA diffère entre la config, les textes et la page');
}

const navigateur = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
try {
  const ctx = await navigateur.newContext({ viewport: { width: 1000, height: 1200 }, acceptDownloads: true });
  const page = await ctx.newPage(), erreurs = [], externes = new Set(), demandes = [];
  const origine = new URL(base).origin;
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('request', (r) => { demandes.push(r.url()); const u = new URL(r.url()); if (u.origin !== origine && !/^(data|blob):/.test(r.url()) && !/cloudflareinsights|google|fonts\./.test(u.host)) externes.add(u.host); });
  if (essai) await page.route('**/assets/musique-chladni-moteur.js', (r) => r.fulfill({ contentType: 'text/javascript', body: 'export * from "/assets/musique-chladni-moteur-absent.js";' }));
  // Par défaut l'interface ne propose que l'ordre 12 (CONFIG.ordresProposes) : on le vérifie sur une page à part, avec ?ordre=18 (sans effet).
  {
    const p0 = await ctx.newPage(); await p0.goto(`${base}/musique-chladni.html?ordre=18`, { waitUntil: 'load' }); await p0.waitForFunction(() => window.__voirSaMusique, null, { timeout: 20000 });
    ok((await p0.$$('#vm-g-fmt .vm-o')).length === 1 && !(await p0.$('#vm-o-fmt-18')) && !(await p0.$('#vm-o-fmt-30')), 'par défaut, seul l\'ordre 12 est proposé');
    ok((await p0.evaluate(() => window.__voirSaMusique.etat().valide.fmt)) === 12 && !(await p0.$('#vm-g-col [data-fmt="18"]')) && !(await p0.$('#vm-g-col [data-fmt="30"]')), '?ordre=18 doit retomber sur l\'ordre 12, sans collection des ordres 18 et 30');
    await p0.close();
  }
  // Le reste du contrôle essaie le code des ordres 18 et 30 : on rouvre ces ordres, par la seule valeur du réglage.
  await page.route('**/assets/musique-chladni-config.js', async (r) => { const rep = await r.fetch(), t = await rep.text(), n = t.replace('ordresProposes: Object.freeze([12])', 'ordresProposes: Object.freeze([12, 18, 30])'); ok(n !== t, 'CONFIG.ordresProposes introuvable'); await r.fulfill({ response: rep, body: n }); });
  await page.goto(`${base}/musique-chladni.html?mode=avance`, { waitUntil: 'load' });
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
    await pg.goto(`${base}/musique-chladni.html?mode=avance`); await pg.waitForFunction(() => window.__voirSaMusique); await pg.selectOption('#vmSource', 'j2'); await pg.click('#vmLecture');
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
      // les erreurs des services tiers (balise de mesure, lecteur YouTube) ne sont pas celles de la page
      pg.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|cloudflareinsights|CORS policy|Permissions policy|compute-pressure|\[TikTok\]/i.test(m.text())) errs.push(m.text()); });
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
      ok((await pg.textContent('#vmSemaineMention')).trim() === 'Musique composée avec l\'IA par MC Claude.', 'la mention « Musique composée avec l\'IA par MC Claude. » doit être exacte');
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
    await mobile.goto(`${base}/musique-chladni.html?mode=avance`); await mobile.waitForFunction(() => window.__voirSaMusique); await mobile.waitForTimeout(500);
    await mobile.click('#vm-g-col-btn');
    const largeur = await mobile.evaluate(() => {
      let max = document.documentElement.scrollWidth;
      for (const el of document.querySelectorAll('main *')) { const r = el.getBoundingClientRect(); if (r.width && r.right > max) max = r.right; }
      return Math.ceil(max);
    });
    ok(largeur <= w, `${w} px : la page fait ${largeur} px de large`);
  }

  // ---------- le démarrage simple (prompt 201) : arrivée → Écouter → figure → Avancé ----------
  {
    const ERR_TIERS = /Failed to load resource|ERR_|cloudflareinsights|CORS policy|Permissions policy|compute-pressure|\[TikTok\]/i;
    const ouvre = async (largeur, hauteur, opts = {}, init) => {
      const c = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, acceptDownloads: true, ...opts }), pg = await c.newPage(), errs = [], reqs = [];
      pg.on('pageerror', (e) => errs.push(e.message)); pg.on('request', (r) => reqs.push(r.url()));
      pg.on('console', (m) => { if (m.type() === 'error' && !ERR_TIERS.test(m.text())) errs.push(m.text()); });
      if (init) await pg.addInitScript(init);
      return { c, pg, errs, reqs };
    };
    const va = async (pg, q = '', chemin = 'musique-chladni.html') => { await pg.goto(`${base}/${chemin}${q}`, { waitUntil: 'load' }); await pg.waitForFunction(() => window.__voirSaMusique, null, { timeout: 20000 }); };
    const visible = (pg, sel) => pg.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(), st = getComputedStyle(e); return st.display !== 'none' && st.visibility !== 'hidden' && r.width > 0 && r.height > 0; }, sel);
    const nCouleurs = (pg) => pg.evaluate(() => { const c = document.getElementById('vmValideToile'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let k = 0; k < d.length; k += 68) s.add(`${d[k]},${d[k + 1]},${d[k + 2]}`); return s.size; });
    const S = (pg) => pg.evaluate(() => ({ source: window.__voirSaMusique.etat().source, tSim: window.__voirSaMusique.S.tSim, motif: window.__voirSaMusique.etat().motif }));

    // 1. l'arrivée, à 1000 et à 390 px : un grand bouton d'abord, la figure grande, le reste dans « Avancé »
    for (const [w, h] of [[1000, 1200], [390, 844]]) {
      const { c, pg, errs } = await ouvre(w, h);
      await va(pg); await pg.waitForTimeout(800);
      ok(await pg.evaluate(() => document.getElementById('vmPage').classList.contains('vm-simple')), `${w} px : la page doit s'ouvrir en mode Simple`);
      for (const s of ['#vmLecture', '#vmSource', '#vmValideToile', '#vmNomMotif', '#vmPleinBtn', '#vmPlus']) ok(await visible(pg, s), `${w} px, Simple : ${s} doit être visible`);
      for (const s of ['.vm-opts', '#vmEssaiToile', '#vmValider', '#vmAnnuler', '#vmEntreeLigne', '#vmInfo', '#vmValideCap']) ok(!(await visible(pg, s)), `${w} px, Simple : ${s} doit être caché`);
      ok(await pg.evaluate(() => [...document.querySelectorAll('.vm-details')].every((d) => getComputedStyle(d).display === 'none')), `${w} px, Simple : les volets doivent être cachés`);
      const g = await pg.evaluate(() => { const b = document.getElementById('vmLecture').getBoundingClientRect(), f = document.getElementById('vmValideToile').getBoundingClientRect(); return { bh: b.height, bw: b.width, btop: b.top, bbas: b.bottom, ftop: f.top, fw: f.width, iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth, intro: document.querySelector('.vm-intro').textContent }; });
      ok(g.bh >= 56 && g.bw >= 200, `${w} px : le bouton Écouter doit être grand (${Math.round(g.bw)} × ${Math.round(g.bh)})`);
      // petit écran : le bouton avant la figure, visible sans défiler ; grand écran (deux colonnes) : le bouton ET le haut de la figure se voient ensemble, pour la voir bouger au clic
      ok(w >= 900 ? (g.bbas <= g.ih && g.ftop < g.ih - 100) : (g.btop < g.ftop && g.bbas <= g.ih), `${w} px : le bouton (et, en grand écran, la figure) doivent se voir sans défiler (bouton ${Math.round(g.btop)}–${Math.round(g.bbas)}, figure dès ${Math.round(g.ftop)}, fenêtre ${g.ih})`);
      ok(g.fw >= (w <= 400 ? 0.8 * w : 400) && g.sw <= w, `${w} px : figure de ${Math.round(g.fw)} px (pleine largeur à 390, grande à 1000), défilement horizontal ${g.sw}`);
      ok((g.intro.match(/[.!?。！？](\s|$)/g) || []).length <= 3 && g.intro.length > 40, `${w} px : l'introduction doit tenir en 3 phrases (« ${g.intro.slice(0, 80)}… »)`);
      ok((await pg.$$eval('#vmSource option', (o) => o.map((x) => x.value))).join() === 'j1,j2,j3,j4,j5,j6,j7,file,mic', `${w} px, Simple : 7 morceaux, un fichier, le micro (sans musique d'essai ni audio d'onglet)`);
      ok(/Écouter/.test(await pg.textContent('#vmLecture')) && (await pg.getAttribute('#vmFichier', 'accept')) === 'audio/*', `${w} px : bouton « Écouter » et accept="audio/*"`);
      // Écouter : un geste, un morceau, une figure qui bouge, le bouton devient Pause
      await pg.click('#vmLecture'); await pg.waitForTimeout(2500);
      let e = await S(pg), ctxEtat = await pg.evaluate(() => window.__voirSaMusique.contexte().state);
      ok(e.source === 'morceau' && ctxEtat === 'running' && e.tSim > 0.5, `${w} px : Écouter doit lancer le premier morceau (${JSON.stringify(e)}, contexte ${ctxEtat})`);
      ok(/Pause/.test(await pg.textContent('#vmLecture')) && (await nCouleurs(pg)) >= 2, `${w} px : le bouton doit devenir « Pause » et la figure se dessiner`);
      ok(/·/.test(await pg.textContent('#vmNomMotif')), `${w} px : le nom du motif retenu doit s'afficher (« ${await pg.textContent('#vmNomMotif')} »)`);
      // Pause : le morceau et la figure s'arrêtent, le bouton redit Écouter ; reprise
      await pg.click('#vmLecture'); await pg.waitForTimeout(400); const t1 = (await S(pg)).tSim; await pg.waitForTimeout(900); const t2 = (await S(pg)).tSim;
      ok(/Écouter/.test(await pg.textContent('#vmLecture')) && t2 === t1 && (await pg.evaluate(() => window.__voirSaMusique.elementAudio().paused)), `${w} px : Pause doit arrêter le son et la figure (${t1} → ${t2})`);
      await pg.click('#vmLecture'); await pg.waitForTimeout(1200);
      ok(/Pause/.test(await pg.textContent('#vmLecture')) && (await S(pg)).tSim > t2, `${w} px : la reprise doit relancer le son et la figure`);
      // le bouton se voit au clavier : focus visible, nom accessible
      // au clavier : on atteint le bouton par Tab, son focus se voit, et l'ordre de tabulation suit l'écran (bouton, morceau, plein écran, plus d'options)
      let ordre = []; await pg.focus('#vmLecture'); await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Tab'); // le focus revient sur le bouton PAR LE CLAVIER (seul cas où :focus-visible s'applique)
      ok(await pg.evaluate(() => { const b = document.getElementById('vmLecture'); return document.activeElement === b && b.matches(':focus-visible') && b.textContent.trim().length > 0 && getComputedStyle(b).outlineStyle !== 'none'; }), `${w} px : le bouton doit avoir un nom et un focus visible au clavier`);
      ordre = []; for (let k = 0; k < 3; k++) { await pg.keyboard.press('Tab'); ordre.push(await pg.evaluate(() => document.activeElement.id)); }
      ok(ordre.join() === 'vmSource,vmPleinBtn,vmPlus', `${w} px, Simple : ordre de tabulation attendu vmSource, vmPleinBtn, vmPlus (obtenu ${ordre.join()})`);
      ok(errs.length === 0, `${w} px, Simple : erreurs ${errs.slice(0, 2).join(' | ')}`);
      if (process.env.CAPTURE_SIMPLE) await pg.screenshot({ path: `${process.env.CAPTURE_SIMPLE}-simple-${w}.png` });
      await c.close();
    }

    // 2. le mode « Avancé » : tout ce qui existait, mémorisé (et la page marche sans stockage)
    {
      const { c, pg, errs } = await ouvre(1000, 1200);
      await va(pg);
      await pg.click('#vmPlus'); await pg.waitForTimeout(300);
      ok(await visible(pg, '.vm-opts') && await visible(pg, '#vmEssaiToile') && await visible(pg, '#vmValider') && await visible(pg, '#vmEntreeLigne'), 'Avancé : les groupes, la fenêtre Essai et l\'entrée audio doivent apparaître');
      ok((await pg.$$('.vm-opts .vm-grp > h3 > button')).length === 6 && (await pg.$$('.vm-details:not([hidden])')).length >= 5, 'Avancé : six groupes et les volets');
      ok((await pg.$$eval('#vmSource option', (o) => o.map((x) => x.value))).join() === 'j1,j2,j3,j4,j5,j6,j7,file,mic,essai,onglet', 'Avancé : musique d\'essai et audio d\'un onglet proposés');
      ok(await pg.getAttribute('#vmPlus', 'aria-expanded') === 'true' && (await pg.evaluate(() => localStorage.getItem('vm-mode'))) === 'avance', 'Avancé : aria-expanded et mémorisation attendus');
      await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => window.__voirSaMusique);
      ok(!(await pg.evaluate(() => document.getElementById('vmPage').classList.contains('vm-simple'))), 'Avancé : le mode doit être mémorisé au rechargement');
      await pg.click('#vmPlus'); await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => window.__voirSaMusique);
      ok(await pg.evaluate(() => document.getElementById('vmPage').classList.contains('vm-simple')), 'retour en Simple : mémorisé aussi');
      ok(errs.length === 0, `mode : erreurs ${errs.slice(0, 2).join(' | ')}`); await c.close();
    }
    {
      // localStorage absent ou qui lève : la page marche
      const { c, pg, errs } = await ouvre(1000, 1200, {}, () => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('stockage refusé'); } }); });
      await va(pg); await pg.click('#vmPlus'); await pg.waitForTimeout(300);
      ok(await visible(pg, '.vm-opts'), 'sans localStorage : « Plus d\'options » doit marcher');
      await pg.click('#vmPlus'); await pg.click('#vmLecture'); await pg.waitForTimeout(1500);
      ok((await S(pg)).source === 'morceau' && errs.length === 0, `sans localStorage : la page doit marcher (${errs.slice(0, 2).join(' | ')})`); await c.close();
    }

    // 3. l'adresse : ?morceau= (les 7 exemples) et ?mode= (simple | avance), rien d'autre, jamais une URL arbitraire
    {
      const { c, pg, errs, reqs } = await ouvre(1000, 1200);
      const lire = async (q, chemin) => { await va(pg, q, chemin); return pg.evaluate(() => ({ src: document.getElementById('vmSource').value, simple: document.getElementById('vmPage').classList.contains('vm-simple'), source: window.__voirSaMusique.etat().source, fmt: window.__voirSaMusique.etat().valide.fmt })); };
      let r = await lire('?morceau=j3-re'); ok(r.src === 'j3' && r.simple && r.source === null, `?morceau=j3-re : j3 sélectionné, rien de lancé (${JSON.stringify(r)})`);
      for (const bad of ['j3', 'j9', 'J3-RE', 'http://evil.test/a.mp3', '//evil.test/a.mp3', '../../etc/passwd', 'j3-re%00', 'file:///x', 'data:audio/mp3;base64,AAAA']) {
        r = await lire(`?morceau=${bad}`); ok(r.src === 'j1' && r.source === null, `?morceau=${bad} doit être ignoré (${JSON.stringify(r)})`);
      }
      ok(![...reqs].filter((u) => !u.startsWith(`${base}/musique-chladni.html`)).some((u) => /evil\.test|etc\/passwd|^data:audio/.test(u)), 'aucune requête (hors la navigation elle-même) vers une adresse donnée dans ?morceau=');
      r = await lire('?mode=avance'); ok(!r.simple, '?mode=avance : mode Avancé');
      r = await lire('?mode=simple'); ok(r.simple, '?mode=simple : mode Simple');
      for (const bad of ['AVANCE', 'avance%20', '1', '<script>', '']) { r = await lire(`?mode=${bad}`); ok(r.simple, `?mode=${bad} doit être ignoré`); }
      r = await lire('?ordre=18'); ok(r.fmt === 12, '?ordre=18 reste sans effet');
      r = await lire('?morceau=j5-sol&mode=avance&autre=1'); ok(r.src === 'j5' && !r.simple, '?morceau= et ?mode= ensemble');
      // le lien copié : la page de CETTE langue
      await va(pg, '', 'musique-chladni.html'); await pg.selectOption('#vmSource', 'j4');
      const o = new URL(base).origin;
      ok((await pg.evaluate(() => window.__voirSaMusique.lienDirect())) === `${o}/musique-chladni.html?morceau=j4-mi`, 'le lien direct doit être ?morceau=j4-mi sur la page française');
      await pg.evaluate(() => window.__voirSaMusique.appliquerMode('avance', false));
      ok((await pg.evaluate(() => window.__voirSaMusique.lienDirect())) === `${o}/musique-chladni.html?morceau=j4-mi&mode=avance`, 'le lien direct doit ajouter &mode=avance en Avancé');
      await va(pg, '', 'en/see-your-music/'); await pg.selectOption('#vmSource', 'j2');
      ok((await pg.evaluate(() => window.__voirSaMusique.lienDirect())) === `${o}/en/see-your-music/?morceau=j2-la`, 'le lien direct reste sur la page de la langue (en/see-your-music/)');
      await va(pg, '', 'ja/see-your-music/'); await pg.evaluate(() => { document.getElementById('vmSource').value = 'mic'; });
      ok((await pg.evaluate(() => window.__voirSaMusique.lienDirect())) === `${o}/ja/see-your-music/`, 'le micro (ou un fichier) : pas de ?morceau= dans le lien');
      ok(errs.length === 0, `adresse : erreurs ${errs.slice(0, 2).join(' | ')}`); await c.close();
    }

    // 4. l'image PNG, le partage, le lien copié, les informations de l'appareil (Avancé)
    {
      const { c, pg, errs, reqs } = await ouvre(1000, 1200, { permissions: ['clipboard-read', 'clipboard-write'] });
      await va(pg, '?mode=avance'); await pg.selectOption('#vmSource', 'j2'); await pg.click('#vmLecture'); await pg.waitForTimeout(1500);
      await pg.locator('#vmEnregistrement').evaluate((n) => { n.closest('details').open = true; });
      const dl = pg.waitForEvent('download', { timeout: 15000 }); await pg.click('#vmImage'); const f = await dl;
      ok(/^voir-sa-musique-j2-la-\d{4}-\d{2}-\d{2}\.png$/.test(f.suggestedFilename()), `nom du PNG inattendu : ${f.suggestedFilename()}`);
      const chemin = await f.path(), buf = (await import('node:fs')).readFileSync(chemin);
      ok(buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' && buf.readUInt32BE(16) === 360 && buf.readUInt32BE(20) === 360, 'le PNG doit être un vrai PNG de 360 × 360 (la taille du canvas)');
      ok((await pg.evaluate(() => window.__derniereImage.type)) === 'image/png', 'type MIME image/png attendu');
      ok(!/@|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(f.suggestedFilename()), 'le nom du fichier ne doit embarquer aucune donnée personnelle');
      ok(!(await visible(pg, '#vmPartager')) === !(await pg.evaluate(() => Boolean(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'a.png', { type: 'image/png' })] })))), 'le bouton « Partager » ne s\'affiche que si le navigateur sait partager le fichier');
      // le lien copié
      await pg.click('#vmLien'); await pg.waitForTimeout(300);
      ok((await pg.evaluate(() => navigator.clipboard.readText())) === `${new URL(base).origin}/musique-chladni.html?morceau=j2-la&mode=avance` && /Lien copié/.test(await pg.textContent('#vmMessage')), 'Copier le lien : le presse-papiers doit porter ?morceau=j2-la&mode=avance');
      // les informations de l'appareil
      await pg.click('#vmTitreAppareil'); await pg.waitForTimeout(200);
      const ligne = await pg.inputValue('#vmAppareilTexte');
      for (const re of [/navigateur: \S+/, /systeme: \S+/, /audioContext: running/, /MediaRecorder: (oui|non)/, /getUserMedia: (oui|non)/, /share: (oui|non)/, /canShare\(files\): (oui|non)/, /ecran: \d+x\d+/, /dpr: [\d.]+/, /video\/mp4;codecs="avc1\.640028,mp4a\.40\.2" = (oui|non)/, /video\/webm/]) ok(re.test(ligne), `informations de l'appareil : ${re} absent de « ${ligne.slice(0, 140)}… »`);
      ok(!/@|\b\d{1,3}(\.\d{1,3}){3}\b|deviceId/i.test(ligne), 'informations de l\'appareil : ni adresse, ni identifiant');
      await pg.click('#vmAppareilCopier'); await pg.waitForTimeout(300);
      ok((await pg.evaluate(() => navigator.clipboard.readText())) === await pg.inputValue('#vmAppareilTexte') && /copiées/.test(await pg.textContent('#vmMessage')), 'Copier : la ligne doit être dans le presse-papiers');
      ok(!reqs.some((u) => { const x = new URL(u); return x.origin !== new URL(base).origin && !/^(data|blob):/.test(u) && !/cloudflareinsights|google|fonts\./.test(x.host); }), 'aucune requête hors du site');
      ok(errs.length === 0, `image et appareil : erreurs ${errs.slice(0, 2).join(' | ')}`); await c.close();
    }
    {
      // Partager : avec une Web Share API simulée, le bouton apparaît et partage le FICHIER (jamais d'envoi ailleurs)
      const { c, pg, errs } = await ouvre(1000, 1200, {}, () => { navigator.canShare = (d) => Boolean(d && d.files && d.files.length); navigator.share = async (d) => { window.__partage = { n: d.files.length, nom: d.files[0].name, type: d.files[0].type, titre: d.title }; }; });
      await va(pg, '?mode=avance'); await pg.locator('#vmEnregistrement').evaluate((n) => { n.closest('details').open = true; });
      ok(!(await visible(pg, '#vmPartager')), 'Partager : caché tant qu\'il n\'y a rien à partager');
      const dl = pg.waitForEvent('download'); await pg.click('#vmImage'); await dl; await pg.waitForTimeout(200);
      ok(await visible(pg, '#vmPartager'), 'Partager : visible après une image si canShare({files}) répond oui');
      await pg.click('#vmPartager'); await pg.waitForTimeout(200);
      const p = await pg.evaluate(() => window.__partage);
      ok(p && p.n === 1 && /\.png$/.test(p.nom) && p.type === 'image/png', `Partager : un fichier PNG attendu (${JSON.stringify(p)})`);
      ok(errs.length === 0, `partage : erreurs ${errs.slice(0, 2).join(' | ')}`); await c.close();
    }

    // 5. « réduire les animations » : une image fixe, et un bouton explicite pour animer
    {
      const { c, pg, errs } = await ouvre(1000, 1200, { reducedMotion: 'reduce' });
      await va(pg); await pg.click('#vmLecture'); await pg.waitForTimeout(1800);
      ok(await visible(pg, '#vmAnimer'), 'mouvement réduit : le bouton « Animer la figure » doit apparaître');
      const a = await S(pg); await pg.waitForTimeout(1200); const b = await S(pg);
      ok(a.source === 'morceau' && a.tSim === 0 && b.tSim === 0, `mouvement réduit : le son joue mais la figure reste fixe (${a.tSim} → ${b.tSim})`);
      await pg.click('#vmAnimer'); await pg.waitForTimeout(1800);
      ok((await S(pg)).tSim > 0.5 && (await pg.getAttribute('#vmAnimer', 'aria-pressed')) === 'true' && /Figer/.test(await pg.textContent('#vmAnimer')), 'mouvement réduit : « Animer la figure » doit lancer l\'animation');
      ok(errs.length === 0, `mouvement réduit : erreurs ${errs.slice(0, 2).join(' | ')}`); await c.close();
      const sans = await ouvre(1000, 1200); await va(sans.pg); ok(!(await visible(sans.pg, '#vmAnimer')), 'sans demande de mouvement réduit : pas de bouton « Animer la figure »'); await sans.c.close();
    }

    // 6. iOS / Safari : le contexte audio suspendu ou interrompu, l'onglet caché, le micro absent
    {
      const { c, pg, errs } = await ouvre(390, 844);
      await va(pg); await pg.click('#vmLecture'); await pg.waitForTimeout(1500);
      // « suspended » (et « interrupted », que Safari pose de la même façon) : le bouton redit Écouter, un message le dit, un geste reprend
      await pg.evaluate(() => window.__voirSaMusique.contexte().suspend()); await pg.waitForTimeout(500);
      ok(/Écouter/.test(await pg.textContent('#vmLecture')) && /interrompu/.test(await pg.textContent('#vmMessage')), 'contexte suspendu : « Écouter » et un message attendus');
      await pg.click('#vmLecture'); await pg.waitForTimeout(900);
      ok((await pg.evaluate(() => window.__voirSaMusique.contexte().state)) === 'running' && /Pause/.test(await pg.textContent('#vmLecture')) && (await pg.textContent('#vmMessage')) === '', 'contexte suspendu : un geste doit reprendre (état running, message effacé)');
      // onglet caché : le morceau se met en pause ; retour : il reprend
      await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
      await pg.waitForTimeout(300);
      ok(await pg.evaluate(() => window.__voirSaMusique.elementAudio().paused), 'onglet caché : le morceau doit se mettre en pause');
      await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
      await pg.waitForTimeout(900);
      ok(!(await pg.evaluate(() => window.__voirSaMusique.elementAudio().paused)) && /Pause/.test(await pg.textContent('#vmLecture')), 'retour sur l\'onglet : le morceau doit reprendre');
      ok(errs.length === 0, `iOS : erreurs ${errs.slice(0, 2).join(' | ')}`); await c.close();
      // micro absent : message clair
      const sans = await ouvre(390, 844, {}, () => { Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true }); });
      await va(sans.pg); await sans.pg.selectOption('#vmSource', 'mic'); await sans.pg.click('#vmLecture'); await sans.pg.waitForTimeout(500);
      ok(/Aucun micro/.test(await sans.pg.textContent('#vmMessage')), `micro absent : message clair attendu (« ${await sans.pg.textContent('#vmMessage')} »)`); await sans.c.close();
    }

    // 7. mobile émulé (Chromium, profil iPhone) : Écouter → figure → Pause → Image, sans erreur, sans défilement horizontal
    {
      const { devices } = await import('playwright');
      const { c, pg, errs } = await ouvre(390, 844, { ...devices['iPhone 13'], acceptDownloads: true });
      await va(pg); await pg.waitForTimeout(500);
      await pg.tap('#vmLecture'); await pg.waitForTimeout(2000);
      ok((await S(pg)).source === 'morceau' && (await nCouleurs(pg)) >= 2, 'mobile émulé : Écouter doit lancer le morceau et dessiner la figure');
      await pg.tap('#vmLecture'); await pg.waitForTimeout(300);
      ok(/Écouter/.test(await pg.textContent('#vmLecture')), 'mobile émulé : Pause');
      await pg.tap('#vmPlus'); await pg.waitForTimeout(300); await pg.locator('#vmEnregistrement').evaluate((n) => { n.closest('details').open = true; });
      const dl = pg.waitForEvent('download', { timeout: 15000 }); await pg.tap('#vmImage'); const f = await dl;
      ok(/\.png$/.test(f.suggestedFilename()), 'mobile émulé : le PNG doit se télécharger');
      ok((await pg.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'mobile émulé : pas de défilement horizontal à 390 px');
      ok(errs.length === 0, `mobile émulé : erreurs ${errs.slice(0, 2).join(' | ')}`); await c.close();
    }

    // 8. fluidité : temps d'image de la figure animée, processeur ralenti ×4 (profil mobile) — voir tools/mesure_fluidite_musique.mjs pour la mesure détaillée
    {
      const { c, pg } = await ouvre(390, 844, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const cdp = await c.newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await va(pg); await pg.click('#vmLecture'); await pg.waitForTimeout(1500);
      const ft = await pg.evaluate(() => new Promise((fin) => { const t = []; let p = performance.now(), n = 0; const f = (ms) => { t.push(ms - p); p = ms; if (++n < 150) requestAnimationFrame(f); else fin(t.slice(10)); }; requestAnimationFrame(f); }));
      const moy = ft.reduce((a, b) => a + b, 0) / ft.length;
      ok(moy <= 50, `fluidité : ${moy.toFixed(1)} ms par image avec le processeur ralenti ×4 (50 ms au plus)`);
      console.log(`  fluidité mobile (CPU ×4) : ${moy.toFixed(1)} ms par image en moyenne, pire ${Math.max(...ft).toFixed(0)} ms`);
      await c.close();
    }
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
