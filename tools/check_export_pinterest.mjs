#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / Commercial license on request: anibaledel@gmail.com
//
// check_export_pinterest.mjs — Une image exportée d'une collection
// (assets/motifs-pinterest/<code>/<fichier>.png) est IDENTIQUE au rendu de
// la page du même motif, dans le même fond : sur un échantillon de pages de
// motifs (tirage fixe), la page est ouverte avec ?fond=…, son image
// Pinterest (window.fondsMotif.svgPinterest(), la fonction du bouton de la
// page) est rastérisée par la page, et comparée pixel par pixel à l'image
// servie. Les octets sont comparés aussi (même encodeur, pngDePixels).
//
// Usage : CHROMIUM_PATH=… node tools/check_export_pinterest.mjs [base] [--code P] [--echantillon 8]
//   base : https://anibal-amiot.com par défaut ; « local » sert le dépôt.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot, lignesCanoniques } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const val = (nom, def) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : def);
const code = val('--code', 'P');
const taille = Number(val('--echantillon', 8));
let base = args[0] && !args[0].startsWith('--') ? args[0] : 'https://anibal-amiot.com';
let serveur = null;
if (base === 'local') { serveur = await servirDepot(ROOT); base = serveur.url; }
base = base.replace(/\/$/, '');

// tirage fixe : le même échantillon à chaque passage
let graine = 20261003;
const alea = () => ((graine = (graine * 1103515245 + 12345) % 2147483648) / 2147483648);
const lignes = lignesCanoniques(ROOT);
const echantillon = [];
while (echantillon.length < Math.min(taille, lignes.length)) {
  const l = lignes[Math.floor(alea() * lignes.length)];
  if (!echantillon.includes(l)) echantillon.push(l);
}
const [fond, sup] = code.split('+');
const requete = `?fond=${encodeURIComponent(fond)}${sup ? `&sup=${encodeURIComponent(sup)}` : ''}`;

const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const echecs = [];
for (const l of echantillon) {
  for (const page of [l.page, `fr/${l.page}`]) {
    const p = await navigateur.newPage();
    await p.route('**/beacon.min.js', (r) => r.fulfill({ body: '', contentType: 'text/javascript' }));
    await p.goto(`${base}/${page}${requete}`, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.fondsMotif && window.fondsMotif.etat);
    const r = await p.evaluate(async ({ image, module }) => {
      const { svgEnPixels, pngDePixels } = await import(module);
      const etat = window.fondsMotif.etat();
      const pixels = await svgEnPixels(window.fondsMotif.svgPinterest(), 1000, 1500);
      const rep = await fetch(image);
      if (!rep.ok) return { statut: rep.status };
      const octetsServis = new Uint8Array(await rep.arrayBuffer());
      const bmp = await createImageBitmap(new Blob([octetsServis], { type: 'image/png' }));
      const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
      const ctx = c.getContext('2d'); ctx.drawImage(bmp, 0, 0);
      const servi = ctx.getImageData(0, 0, bmp.width, bmp.height);
      let diff = 0;
      if (servi.width !== pixels.width || servi.height !== pixels.height) diff = -1;
      else for (let i = 0; i < pixels.data.length; i++) if (pixels.data[i] !== servi.data[i]) diff++;
      const octetsPage = new Uint8Array(await (await pngDePixels(pixels)).arrayBuffer());
      const memesOctets = octetsPage.length === octetsServis.length && octetsPage.every((o, i) => o === octetsServis[i]);
      return { statut: rep.status, code: etat.code, diff, memesOctets, taille: [servi.width, servi.height] };
    }, { image: `${base}/assets/motifs-pinterest/${code}/${l.fichier}`, module: `${base}/assets/vue-fond-motif.js` });
    await p.close();
    const ici = `${page} (${code}) ↔ ${code}/${l.fichier}`;
    if (r.statut !== 200) echecs.push(`${ici} : image servie en ${r.statut}`);
    else if (r.code !== code) echecs.push(`${ici} : la page a pris le fond ${r.code}`);
    else if (r.diff !== 0) echecs.push(`${ici} : ${r.diff === -1 ? `taille ${r.taille.join(' × ')}` : `${r.diff} composantes de pixel diffèrent`}`);
    console.log(`${r.statut === 200 && r.diff === 0 ? 'OK    ' : '      '}${ici} — pixels ${r.diff === 0 ? 'identiques' : 'DIFFÉRENTS'}, octets ${r.memesOctets ? 'identiques' : 'différents'}`);
  }
}
await navigateur.close();
if (serveur) serveur.fermer();
if (echecs.length) { console.error(`\n${echecs.length} échec(s) :\n  ${echecs.join('\n  ')}`); process.exit(1); }
console.log(`\n${echantillon.length * 2} pages (FR et EN) : l'image exportée est identique au rendu de la page, pour le fond ${code}.`);
