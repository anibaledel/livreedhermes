#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_fond_ecran_deux_outils.mjs — fonds-ecran.html porte DEUX outils
// d'animation, l'un sous l'autre, tricolore puis bicolore, vérifiés SUR LE
// SITE (déployé par défaut ; « local » sert le dépôt) :
//
//   1. les deux sections sont visibles, dans l'ordre, sans bascule
//      (#renduToggle n'existe plus), chacune avec ses quatre cartes ;
//   2. chaque outil a TOUTES les commandes de l'autre (micro, fichier audio,
//      méditatif et rythme, densité, réinitialiser, Full Réactif, pause,
//      figer, formats, durées, enregistrer, quitter) ; seules les couleurs
//      diffèrent : teinte (tricolore), fond et figure (bicolore) ;
//   3. le FICHIER AUDIO et le MICRO pilotent l'animation bicolore : un son
//      à battements change le motif à l'écran ;
//   4. les états sont indépendants : lancer, régler et piloter le bicolore
//      ne change rien à l'état du tricolore, et inversement ;
//   5. le bandeau « l'outil a changé de place » a disparu ; le lien vers la
//      galerie bicolore est là ;
//   6. un seul moteur : la page importe assets/outil-fond-ecran.js et
//      l'appelle deux fois — aucune autre copie du moteur dans la page ;
//   7. l'ancienne adresse ?rendu=bicolore mène à l'outil bicolore ;
//   8. « Figer », action passée par la page, mène à la galerie bicolore.
//
// Usage : CHROMIUM_PATH=… node tools/check_fond_ecran_deux_outils.mjs [base|local]
import path from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] || 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };

// un son à battements, quatre coups par seconde : un grave (80 Hz) et un aigu
// (9 kHz), dans la bande que le moteur appelle « médiums » (le deuxième tiers
// de l'analyseur, au-delà de 6 kHz) — celle qui pilote Full Réactif
function wavBattements(secondes = 12, taux = 44100) {
  const n = secondes * taux, data = Buffer.alloc(44 + n * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + n * 2, 4); data.write('WAVE', 8); data.write('fmt ', 12);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(taux, 24);
  data.writeUInt32LE(taux * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const t = i / taux, dansLeCoup = (t % 0.25) < 0.08;
    const v = dansLeCoup ? 0.45 * Math.sin(2 * Math.PI * 80 * t) + 0.35 * Math.sin(2 * Math.PI * 9000 * t) : 0;
    data.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return data;
}
const dossier = mkdtempSync(path.join(tmpdir(), 'deux-outils-'));
const wav = path.join(dossier, 'battements.wav');
writeFileSync(wav, wavBattements());

const options = {
  args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${wav}`],
  ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
};
const navigateur = await chromium.launch(options);
const contexte = await navigateur.newContext({ viewport: { width: 1280, height: 800 }, permissions: ['microphone'] });
const p = await contexte.newPage();
const erreurs = [];
p.on('pageerror', (e) => erreurs.push(String(e)));
await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
const ouvrir = async (q = '') => {
  await p.goto(`${BASE}/fonds-ecran.html${q}`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.outilsFondEcran && window.outilsFondEcran.bicolore
    && document.querySelectorAll('#outilTricolore .cat-card:not(.disabled)').length === 4
    && document.querySelectorAll('#outilBicolore .cat-card:not(.disabled)').length === 4);
};
const etat = (r) => p.evaluate((r) => window.outilsFondEcran[r].etat(), r);
const sansMotif = (e) => ({ ...e, motif: e.motif && `${e.motif.fam}/${e.motif.n}` });

// 1. deux outils visibles, dans l'ordre, sans bascule
await ouvrir();
const sections = await p.$$eval('main section.outil', (ss) => ss.map((s) => ({ id: s.id, titre: s.querySelector('h2').textContent.trim(), y: s.getBoundingClientRect().top + scrollY, visible: s.offsetParent !== null, cartes: s.querySelectorAll('.cat-card').length })));
if (sections.map((s) => s.id).join(',') !== 'outilTricolore,outilBicolore') echec(`sections : ${sections.map((s) => s.id)}`);
if (!(sections[0].y < sections[1].y)) echec('le tricolore n\'est pas au-dessus du bicolore');
for (const s of sections) if (!s.visible || s.cartes !== 4) echec(`${s.id} : visible ${s.visible}, ${s.cartes} cartes`);
if (await p.$('#renduToggle')) echec('la bascule #renduToggle est encore là');
console.log(`1. ${sections.map((s) => `${s.titre} (${s.cartes} cartes, y = ${Math.round(s.y)})`).join(' puis ')} ; pas de bascule`);

// 2. les mêmes commandes dans les deux barres
const commandes = (r) => p.evaluate((r) => [...window.outilsFondEcran[r].stage.querySelectorAll('[data-r]')].map((e) => e.dataset.r).sort(), r);
const [ct, cb] = [await commandes('tricolore'), await commandes('bicolore')];
const propres = { tricolore: ['btnMode', 'tintPicker'], bicolore: ['c0', 'c1'] };
const communes = (l, r) => l.filter((k) => !propres[r].includes(k));
if (communes(ct, 'tricolore').join() !== communes(cb, 'bicolore').join()) echec(`commandes différentes : ${communes(ct, 'tricolore')} / ${communes(cb, 'bicolore')}`);
for (const r of ['tricolore', 'bicolore']) for (const k of propres[r]) if (!(r === 'tricolore' ? ct : cb).includes(k)) echec(`${r} : ${k} manque`);
const presets = await p.evaluate(() => [...window.outilsFondEcran.bicolore.stage.querySelectorAll('.anim-preset')].map((b) => b.textContent.trim()));
if (!presets.includes('Crème / encre') || !presets.includes('Rouge / blanc')) echec(`boutons de couleurs du bicolore : ${presets}`);
console.log(`2. ${communes(cb, 'bicolore').length} commandes communes (${communes(cb, 'bicolore').join(', ')}) ; tricolore + ${propres.tricolore.join(', ')} ; bicolore + ${propres.bicolore.join(', ')} et ${presets.join(' · ')}`);

// 3 et 4. lancer le bicolore, le régler, le piloter au son ; le tricolore ne bouge pas
const triAvant = sansMotif(await etat('tricolore'));
await p.click('#outilBicolore .cat-card[data-cat=par4]');
await p.waitForFunction(() => window.outilsFondEcran.bicolore.etat().enCours);
const stageBi = () => p.evaluate(() => getComputedStyle(window.outilsFondEcran.bicolore.stage).display);
if (await stageBi() !== 'block') echec('l\'écran du bicolore ne s\'ouvre pas');
await p.evaluate(() => { const s = window.outilsFondEcran.bicolore.stage.querySelector('[data-r=sizeSlider]'); s.value = '9'; s.dispatchEvent(new Event('input')); });
// fichier audio
const motifs = async (ms) => {
  const vus = new Set();
  const fin = Date.now() + ms;
  while (Date.now() < fin) { const m = (await etat('bicolore')).motif; if (m) vus.add(`${m.fam}/${m.subA}/${m.subB}/${m.n}`); await p.waitForTimeout(100); }
  return vus.size;
};
const sansSon = await motifs(1500);
await p.setInputFiles('.fe-stage[data-r=stage]:has([data-r=c0]) [data-r=fileInput]', wav);
await p.waitForFunction(() => window.outilsFondEcran.bicolore.etat().audio);
const avecFichier = await motifs(5000);
if (avecFichier < 3) echec(`fichier audio : ${avecFichier} motifs en 5 s (sans son : ${sansSon})`);
// Full Réactif : les médiums changent le motif
await p.evaluate(() => window.outilsFondEcran.bicolore.stage.querySelector('[data-r=btnFullReactive]').click());
const avecReactif = await motifs(4000);
if (avecReactif < 3) echec(`Full Réactif sur fichier : ${avecReactif} motifs en 4 s`);
await p.evaluate(() => window.outilsFondEcran.bicolore.stage.querySelector('[data-r=btnFullReactive]').click());
// micro (son simulé par le navigateur : le même fichier)
await p.evaluate(() => window.outilsFondEcran.bicolore.stage.querySelector('[data-r=btnMic]').click());
await p.waitForFunction(() => window.outilsFondEcran.bicolore.etat().audio);
const avecMicro = await motifs(5000);
if (avecMicro < 3) echec(`micro : ${avecMicro} motifs en 5 s`);
console.log(`3. bicolore — motifs vus : ${sansSon} en 1,5 s sans son ; ${avecFichier} en 5 s au fichier audio ; ${avecReactif} en 4 s en Full Réactif ; ${avecMicro} en 5 s au micro`);
const biPendant = sansMotif(await etat('bicolore'));
const triPendant = sansMotif(await etat('tricolore'));
if (JSON.stringify(triPendant) !== JSON.stringify(triAvant)) echec(`le tricolore a bougé : ${JSON.stringify(triAvant)} → ${JSON.stringify(triPendant)}`);
await p.evaluate(() => window.outilsFondEcran.bicolore.quitter());
// l'inverse : lancer le tricolore, changer sa teinte, le bicolore garde son état
const biAvant = sansMotif(await etat('bicolore'));
await p.click('#outilTricolore .cat-card[data-cat=par2]');
await p.waitForFunction(() => window.outilsFondEcran.tricolore.etat().enCours);
await p.evaluate(() => { const st = window.outilsFondEcran.tricolore.stage; st.querySelector('[data-r=btnMode]').click(); const s = st.querySelector('[data-r=sizeSlider]'); s.value = '12'; s.dispatchEvent(new Event('input')); });
const triLance = await etat('tricolore');
const biApres = sansMotif(await etat('bicolore'));
if (JSON.stringify(biApres) !== JSON.stringify(biAvant)) echec(`le bicolore a bougé : ${JSON.stringify(biAvant)} → ${JSON.stringify(biApres)}`);
if (await stageBi() !== 'none') echec('l\'écran du bicolore s\'est ouvert avec le tricolore');
const url = new URL(p.url());
if (url.searchParams.get('bdensite') !== '9' || url.searchParams.get('densite') !== '12' || url.searchParams.get('teinte') !== 'multi') echec(`URL : ${url.search}`);
console.log(`4. bicolore lancé (densité ${biPendant.densite}, audio ${biPendant.audio}) : tricolore inchangé (${triPendant.enCours ? 'lancé' : 'au repos'}, densité ${triPendant.densite}, teinte ${triPendant.teinte}) ; tricolore lancé (densité ${triLance.densite}, teinte ${triLance.teinte}) : bicolore inchangé (densité ${biApres.densite}, ${biApres.enCours ? 'lancé' : 'au repos'}) ; URL ${url.search}`);
await p.evaluate(() => window.outilsFondEcran.tricolore.quitter());

// 5. pas de bandeau ; le lien vers la galerie bicolore
const lien = await p.evaluate(() => {
  const a = document.getElementById('lienFondFixe');
  return { bandeau: !!document.querySelector('.ff-deplace, #ffDeplace'), href: a && a.getAttribute('href'), texte: a && a.textContent.trim(), dansBicolore: !!(a && a.closest('#outilBicolore')) };
});
if (lien.bandeau) echec('le bandeau est encore là');
if (!lien.href || !lien.href.startsWith('galerie-bicolore.html') || !lien.dansBicolore) echec(`lien : ${JSON.stringify(lien)}`);
console.log(`5. bandeau absent ; lien « ${lien.texte} » → ${lien.href}`);

// 6. un seul moteur, monté deux fois
const html = readFileSync(path.join(ROOT, 'fonds-ecran.html'), 'utf8');
const montages = (html.match(/monterOutilFondEcran\(/g) || []).length;
if (!/import \{ monterOutilFondEcran \} from '\.\/assets\/outil-fond-ecran\.js'/.test(html) || montages !== 2) echec(`montages du moteur : ${montages}`);
for (const f of ['function drawTessellation', 'function pickNextByProximity', 'function startRecording', 'function loop(']) if (html.includes(f)) echec(`le moteur a encore une copie dans la page : ${f}`);
console.log(`6. fonds-ecran.html importe assets/outil-fond-ecran.js et l'appelle ${montages} fois ; aucune copie du moteur dans la page`);

// 7. l'ancienne adresse de l'animation bicolore mène à l'outil bicolore, réglages compris
await ouvrir('?rendu=bicolore&densite=7&rythme=3.5');
const ancien = await p.evaluate(() => ({ url: location.search + location.hash, bi: window.outilsFondEcran.bicolore.etat(), tri: window.outilsFondEcran.tricolore.etat() }));
if (ancien.bi.densite !== 7 || ancien.bi.rythme !== 3.5 || ancien.tri.densite !== 4 || !ancien.url.endsWith('#outilBicolore')) echec(`ancienne adresse : ${JSON.stringify(ancien)}`);
console.log(`7. ?rendu=bicolore&densite=7&rythme=3.5 → ${ancien.url} (bicolore densité ${ancien.bi.densite}, rythme ${ancien.bi.rythme} ; tricolore densité ${ancien.tri.densite})`);

// 8. « Figer » : l'action vient de la page (le moteur ne connaît aucune adresse du site)
await ouvrir();
await p.click('#outilBicolore .cat-card[data-cat=bases]');
await p.waitForFunction(() => window.outilsFondEcran.bicolore.etat().motif);
await Promise.all([p.waitForURL(/galerie-bicolore\.html/), p.evaluate(() => window.outilsFondEcran.bicolore.stage.querySelector('[data-r=btnFiger]').click())]);
const fige = new URL(p.url());
// un motif du corpus part par ?motif=… ; une grille hors corpus, par sessionStorage
const transmis = fige.searchParams.get('motif') || await p.evaluate(() => sessionStorage.getItem('motif-fige') && 'grille en sessionStorage');
if (!fige.pathname.endsWith('/galerie-bicolore.html') || fige.hash !== '#fondFixe' || !transmis) echec(`Figer : ${p.url()}, motif ${transmis}`);
console.log(`8. Figer (bicolore) → ${fige.pathname}${fige.search}${fige.hash} ; motif transmis : ${transmis}`);

if (erreurs.length) echec(`erreurs de page : ${erreurs.join(' | ')}`);
await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`${echecs.length} échec(s)`); process.exit(1); }
console.log('Deux outils, un moteur.');
