#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_pavane_pages.mjs — la nouvelle interface de « Voir sa musique » dans les pages (prompt 211, bloc 3).
//
// Statique : la section #nouvelle-interface et son script sont dans musique-chladni.html et ses 10 traductions ; « Pavane » n'est écrit NULLE PART dans une page HTML (ni titre, ni méta, ni JSON-LD, ni texte statique), ni dans
// le sitemap : l'application s'appelle « Voir sa musique », rien d'autre (prompt 220) ; fonds-ecran.html et chladni.html (et leurs traductions) ont un lien discret « Essayer la nouvelle interface » vers la page
// « Voir sa musique » de LEUR langue, sans rien cacher du contenu existant.
// Navigateur (fr, en, ja ; 390 et 1280 px) : rien n'est chargé tant que la section n'approche pas de l'écran (le corpus n'est pas demandé) ; l'adresse (#nouvelle-interface ou ?mode=…) la monte ; son titre est celui de la page dans la
// langue de la page, sans sous-titre ni « Pavane » dans le texte rendu ; l'interface actuelle de la page est intacte ; ?morceau= et ?mode=avance de la page sont gardés quand Pavane écrit l'adresse ; ?mode=avance ne monte pas Pavane ;
// aucune erreur de console ; axe-core sur la section. Usage : node tools/check_pavane_pages.mjs [local | <adresse de base>]
import { chromium } from 'playwright';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let echecs = 0, controles = 0;
const ok = (c, m) => { controles++; if (!c) { echecs++; console.error(`ÉCHEC ${m}`); } };
const lire = (f) => readFileSync(path.join(ROOT, f), 'utf8');

const MUSIQUE = { fr: 'musique-chladni.html', en: 'en/see-your-music/index.html', es: 'es/ver-tu-musica/index.html', th: 'th/see-your-music/index.html', zh: 'zh/see-your-music/index.html', ru: 'ru/see-your-music/index.html', pt: 'pt/see-your-music/index.html', hi: 'hi/see-your-music/index.html', de: 'de/see-your-music/index.html', it: 'it/see-your-music/index.html', ja: 'ja/see-your-music/index.html' };
for (const [l, f] of Object.entries(MUSIQUE)) {
  const h = lire(f);
  ok(/<section class="vm-interface" id="nouvelle-interface"><\/section>/.test(h), `${f} : la section #nouvelle-interface est là, vide`);
  ok(/<script type="module" src="[^"]*assets\/voir-sa-musique-montage\.js"><\/script>/.test(h), `${f} : le script de montage est là`);
  const src = (/<script type="module" src="([^"]*assets\/voir-sa-musique-montage\.js)"/.exec(h) || [])[1];
  ok(src && existsSync(path.join(ROOT, path.dirname(f), src)), `${f} : le script de montage (${src}) existe à son adresse`);
}
// « Pavane » n'est dans aucune page HTML du dépôt, ni dans le sitemap, ni dans les index lisibles par les machines
const hits = [];
(function parcourir(d) { for (const e of readdirSync(path.join(ROOT, d), { withFileTypes: true })) { if (['node_modules', '.git', 'assets', 'data', 'docs', 'tools', 'scripts'].includes(e.name) || e.name.startsWith('.')) continue; const rel = path.join(d, e.name); if (e.isDirectory()) parcourir(rel); else if (e.name.endsWith('.html') && /pavane/i.test(readFileSync(path.join(ROOT, rel), 'utf8'))) hits.push(rel); } })('.');
ok(hits.length === 0, `« Pavane » ne figure dans aucune page HTML (titre, méta, JSON-LD, texte) : ${hits.slice(0, 5).join(', ')}`);
for (const f of ['sitemap.xml', 'llms.txt', 'llms-full.txt']) if (existsSync(path.join(ROOT, f))) ok(!/pavane/i.test(lire(f)), `${f} ne dit pas Pavane`);
// les liens discrets
const LIENS = [['fonds-ecran.html', 'fr', 'musique-chladni.html'], ['en/wallpapers/index.html', 'en', 'en/see-your-music/'], ['es/fondos-de-pantalla/index.html', 'es', 'es/ver-tu-musica/'], ['th/wallpapers/index.html', 'th', 'th/see-your-music/'],
  ['chladni.html', 'fr', 'musique-chladni.html'], ['en/chladni/index.html', 'en', 'en/see-your-music/'], ['es/chladni/index.html', 'es', 'es/ver-tu-musica/'], ['th/chladni/index.html', 'th', 'th/see-your-music/']];
const TEXTES = { fr: 'Essayer la nouvelle interface', en: 'Try the new interface', es: 'Probar la nueva interfaz', th: 'ลองใช้อินเทอร์เฟซใหม่' };
for (const [f, l, cible] of LIENS) {
  const m = /<p class="[^"]*pv-lien[^"]*"[^>]*><a href="([^"]+)"[^>]*>([^<]+)<\/a><\/p>/.exec(lire(f));
  ok(m && m[2] === TEXTES[l], `${f} : le lien « ${TEXTES[l]} » est là (${m && m[2]})`);
  ok(m && m[1].replace(/^(\.\.\/)+/, '').startsWith(cible) && m[1].endsWith('?mode=defile#nouvelle-interface'), `${f} : le lien va à la page « Voir sa musique » de sa langue (${m && m[1]})`);
}

// ---------- navigateur ----------
let BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'local', serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const AXE = path.join(ROOT, 'node_modules/axe-core/axe.min.js'), axe = existsSync(AXE) ? readFileSync(AXE, 'utf8') : null;
const nav = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const TITRES = { fr: 'Voir sa musique', en: 'See your music', ja: '自分の音楽を見る' };
const ADRESSE = { fr: 'musique-chladni.html', en: 'en/see-your-music/', ja: 'ja/see-your-music/' };
async function ouvrir(largeur, langue, suite) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 } }), page = await ctx.newPage(), erreurs = [], requetes = [];
  page.on('pageerror', (e) => erreurs.push(`exception : ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(`console : ${m.text()}`); });
  page.on('request', (r) => requetes.push(r.url()));
  await page.goto(`${BASE}/${ADRESSE[langue]}${suite}`, { waitUntil: 'load' });
  return { ctx, page, erreurs, requetes };
}
for (const langue of ['fr', 'en', 'ja']) {
  for (const largeur of [390, 1280]) {
    const nom = `${langue}, ${largeur} px`;
    // 1. un lanceur seulement : ni interface, ni corpus, ni fonds avant que la personne ne l'ouvre
    let { ctx, page, erreurs, requetes } = await ouvrir(largeur, langue, '');
    await page.waitForSelector('#nouvelle-interface .pv-ouvrir', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    const lanceur = await page.evaluate(() => { const b = document.querySelector('#nouvelle-interface .pv-ouvrir'), h = document.querySelector('#nouvelle-interface .pv-titre'); return b ? { bouton: b.textContent, titre: h.textContent.trim(), sous: h.querySelectorAll('.pv-sous-titre').length, haut: Math.round(document.getElementById('nouvelle-interface').getBoundingClientRect().height) } : null; });
    ok(lanceur && lanceur.titre === TITRES[langue] && lanceur.sous === 0 && lanceur.bouton.length > 5, `${nom} : le lanceur porte le titre « ${lanceur && lanceur.titre} », sans sous-titre, et un bouton « ${lanceur && lanceur.bouton} »`);
    if (largeur === 390 && langue !== 'ja') { const bas = await page.evaluate(() => Math.round(document.querySelector('#vmLecture').getBoundingClientRect().bottom + scrollY)); ok(bas <= 664, `${nom} : le bouton « Écouter » reste visible sans défiler dans une fenêtre de 390 × 664 (Safari iPhone ; WebKit du workflow) : bas à ${bas} px`); }
    ok(lanceur && lanceur.haut <= 140, `${nom} : le lanceur est compact (${lanceur && lanceur.haut} px) : l'interface actuelle reste visible`);
    ok(!requetes.some((u) => /corpus-256\.json|pavane-ui\.js/.test(u)) && (await page.evaluate(() => !window.__pavane)), `${nom} : ni le corpus ni le code de la nouvelle interface avant l'ouverture (les deux fichiers de fonds, eux, sont ceux que lit aussi l'interface actuelle depuis le prompt 220)`);
    // 2. ouvrir la nouvelle interface la monte, au-dessus de l'interface actuelle
    await page.click('#nouvelle-interface .pv-ouvrir');
    await page.waitForFunction(() => window.__pavane, null, { timeout: 15000 }).catch(() => {});
    const m = await page.evaluate(() => { const h = document.querySelector('#nouvelle-interface .pv-titre'); return h ? { titre: h.textContent.trim(), sous: h.querySelectorAll('.pv-sous-titre').length, modes: document.querySelectorAll('#nouvelle-interface .pv-modes input').length, dessus: document.getElementById('nouvelle-interface').compareDocumentPosition(document.querySelector('#vmPage .vm-ecouter')) & Node.DOCUMENT_POSITION_FOLLOWING } : null; });
    ok(m && m.titre === TITRES[langue] && m.sous === 0 && m.modes === 3 && m.dessus, `${nom} : ouvrir monte l'interface (titre « ${m && m.titre} », sans sous-titre, ${m && m.modes} modes), au-dessus de l'interface actuelle`);
    ok(await page.evaluate(() => !/pavane/i.test(document.body.innerText + [...document.querySelectorAll('[aria-label],[title],[alt]')].map((e) => e.getAttribute('aria-label') + e.title + e.getAttribute('alt')).join(' ') + document.title)), `${nom} : « Pavane » n'est ni dans le texte rendu ni dans les libellés d'accessibilité`);
    ok(await page.evaluate(() => !!document.getElementById('vmPage') && document.querySelectorAll('#vmPage .vm-ecouter').length > 0), `${nom} : l'interface actuelle de la page est intacte`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth) <= largeur, `${nom} : aucun débordement horizontal`);
    if (axe && langue === 'fr' && largeur === 1280) {
      await page.addScriptTag({ content: axe });
      const v = await page.evaluate(async () => (await axe.run(document.getElementById('nouvelle-interface'), { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((x) => `${x.id} (${x.impact}) ${x.nodes.length}`));
      ok(v.length === 0, `${nom} : axe-core sur la section : ${v.join(' ; ')}`);
    }
    ok(erreurs.length === 0, `${nom} : aucune erreur (${erreurs.join(' | ')})`);
    await ctx.close();
    // 3. l'adresse la demande : #nouvelle-interface, ou un paramètre de Pavane
    for (const suite of ['#nouvelle-interface', '?mode=spectre', '?fond=B2Dx&mode=entre-deux']) {
      const r = await ouvrir(largeur, langue, suite);
      await r.page.waitForFunction(() => window.__pavane, null, { timeout: 15000 }).catch(() => {});
      ok(await r.page.evaluate(() => !!window.__pavane), `${nom} ${suite} : montée d'emblée`);
      ok(r.erreurs.length === 0, `${nom} ${suite} : aucune erreur (${r.erreurs.join(' | ')})`);
      await r.ctx.close();
    }
  }
}
{
  // 4. les paramètres de la page sont gardés ; ?mode=avance ne monte pas Pavane
  const { ctx, page, erreurs } = await ouvrir(1280, 'fr', '?morceau=j3-re&mode=avance#nouvelle-interface');
  await page.waitForFunction(() => window.__pavane, null, { timeout: 15000 }).catch(() => {});
  ok(await page.evaluate(() => !!window.__pavane), '?morceau=j3-re&mode=avance#nouvelle-interface : Pavane est montée par le #nouvelle-interface');
  await page.selectOption('#nouvelle-interface .pv-reglages select[id$=fond]', 'B2Dx');
  const s = await page.evaluate(() => location.search);
  ok(/morceau=j3-re/.test(s) && /fond=B2Dx/.test(s) && /mode=avance/.test(s), `Pavane écrit l'adresse en gardant ?morceau= et ?mode=avance de la page (${s})`);
  await page.click('#nouvelle-interface .pv-modes input[value="spectre"]');
  ok(/mode=spectre/.test(await page.evaluate(() => location.search)) && /morceau=j3-re/.test(await page.evaluate(() => location.search)), 'un mode de Pavane remplace ?mode=avance, ?morceau= reste');
  ok(erreurs.length === 0, `adresse fusionnée sans erreur (${erreurs.join(' | ')})`);
  await ctx.close();
  const r = await ouvrir(1280, 'fr', '?mode=avance');
  await r.page.waitForTimeout(900);
  ok(await r.page.evaluate(() => !window.__pavane), '?mode=avance seul ne monte pas Pavane (c\'est le mode Avancé de la page)');
  await r.ctx.close();
}
// ---------- « Pavane » : absent du texte VISIBLE des 11 pages, lanceur puis interface montée (texte rendu, libellés d'accessibilité, titre, méta, JSON-LD) ----------
for (const [langue, f] of Object.entries(MUSIQUE)) {
  const ctx = await nav.newContext({ viewport: { width: 390, height: 900 } }), page = await ctx.newPage();
  await page.goto(`${BASE}/${f}`, { waitUntil: 'load' }); await page.waitForSelector('#nouvelle-interface .pv-ouvrir', { timeout: 10000 });
  const visible = () => page.evaluate(() => [document.title, document.body.innerText, ...[...document.querySelectorAll('[aria-label],[title],[alt],[placeholder],meta[content],script[type="application/ld+json"]')].map((e) => [e.getAttribute('aria-label'), e.title, e.getAttribute('alt'), e.getAttribute('placeholder'), e.tagName === 'META' ? e.content : '', e.tagName === 'SCRIPT' ? e.textContent : ''].join(' '))].join(' '));
  ok(!/pavane/i.test(await visible()), `${langue} : « Pavane » absent du texte visible, du titre, des méta, du JSON-LD et des libellés (lanceur)`);
  await page.click('#nouvelle-interface .pv-ouvrir'); await page.waitForFunction(() => window.__pavane, null, { timeout: 15000 });
  await page.click('#nouvelle-interface .pv-modes input[value="spectre"]'); await page.waitForTimeout(300);
  ok(!/pavane/i.test(await visible()), `${langue} : « Pavane » absent du texte visible et des libellés (interface montée, mode Spectre, sources visibles)`);
  await ctx.close();
}
await nav.close();
if (serveur && serveur.close) serveur.close();
if (echecs) { console.error(`\n${echecs} défaut(s) sur ${controles} contrôles.`); process.exit(1); }
console.log(`OK    Pavane dans les pages : ${controles} contrôles — section et script dans les 11 pages « Voir sa musique », « Pavane » absent de toute page HTML et du sitemap (ni sous-titre ni texte rendu), liens discrets sur fonds-ecran et chladni (4 langues), lanceur compact, montage à l'ouverture, adresses fusionnées${axe ? ', axe-core sans violation' : ''}.`);
process.exit(0);
