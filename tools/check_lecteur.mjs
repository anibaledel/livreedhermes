#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_lecteur.mjs — les commandes du lecteur (book-viewer/) restent
// cliquables, et la page du livre reste dans son cadre (A01, audit du
// 4 octobre 2026 : à 1363 px, l'image débordait de 90 px au-dessus de son
// cadre et recouvrait les sept boutons de langue — les clics tombaient sur
// #pageImg).
//
// Pour chaque format — 320, 375, 768 et 1363 px, en portrait et en paysage,
// et un zoom à 200 % (la moitié des pixels CSS) — et dans chaque langue :
//   - au centre de chaque bouton de langue, de Précédent, de Suivant, du
//     champ et du bouton de saut de page, l'élément sous le pointeur est ce
//     bouton (document.elementFromPoint) ;
//   - l'image est contenue dans son cadre (au pixel près), et ne chevauche
//     ni l'en-tête ni le pied ;
//   - un vrai clic sur le bouton de la langue la charge (l'image suivante
//     vient de book-viewer/pages/<code>/).
//
// Usage : node tools/check_lecteur.mjs [local | https://anibal-amiot.com]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirDepot } from './lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let BASE = process.argv[2] || 'https://anibal-amiot.com';
let serveur = null;
if (BASE === 'local') { serveur = await servirDepot(ROOT); BASE = serveur.url; }
BASE = BASE.replace(/\/$/, '');

// [nom, largeur, hauteur] ; « zoom 200 % » : les pixels CSS d'un écran
// 1363 × 768 vu à 200 %
const FORMATS = [
  ['320 portrait', 320, 568], ['320 paysage', 568, 320],
  ['375 portrait', 375, 812], ['375 paysage', 812, 375],
  ['768 portrait', 768, 1024], ['768 paysage', 1024, 768],
  ['1363 paysage', 1363, 768], ['1363 haut', 1363, 900], ['1363 portrait', 768, 1363],
  ['1363 zoom 200 %', 682, 384],
];
const echecs = [];
const echec = (m) => { echecs.push(m); console.error(`ÉCHEC ${m}`); };

const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  for (const [nom, w, h] of FORMATS) {
    const page = await navigateur.newPage({ viewport: { width: w, height: h } });
    await page.goto(`${BASE}/book-viewer/?read=fr&page=043`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('pageImg')?.complete && document.getElementById('pageImg').naturalWidth > 0);
    const codes = await page.$$eval('#langRow .lang-btn', (bs) => bs.length);
    let fautes = 0;
    for (let i = 0; i < codes; i++) {
      const etat = await page.evaluate(() => {
        const R = (e) => e.getBoundingClientRect();
        const sous = (e) => { const r = R(e); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return t === e || e.contains(t) ? null : (t?.id ? `#${t.id}` : t?.tagName); };
        const cibles = [...document.querySelectorAll('#langRow .lang-btn'), document.getElementById('prevBtn'), document.getElementById('nextBtn'), document.getElementById('jumpInput'), document.querySelector('#jumpForm button')];
        const masques = cibles.map((e) => [e.textContent.trim() || e.id || e.getAttribute('aria-label'), sous(e)]).filter(([, t]) => t);
        const img = R(document.getElementById('pageImg')), cadre = R(document.querySelector('.page-frame'));
        const tete = R(document.getElementById('contenu')), pied = R(document.querySelector('footer'));
        const deborde = img.top < cadre.top - 1 || img.bottom > cadre.bottom + 1 || img.left < cadre.left - 1 || img.right > cadre.right + 1;
        const chevauche = img.top < tete.bottom - 1 || img.bottom > pied.top + 1;
        return { masques, deborde, chevauche, img: [img.x, img.y, img.width, img.height].map(Math.round), cadre: [cadre.x, cadre.y, cadre.width, cadre.height].map(Math.round) };
      });
      // la langue i, par un vrai clic (le pointeur ; pas un .click() JavaScript)
      const bouton = page.locator('#langRow .lang-btn').nth(i);
      const code = await bouton.textContent();
      if (etat.masques.length) { fautes++; echec(`${nom} (${w}×${h}), langue ${i} : sous le pointeur, ${etat.masques.map(([b, t]) => `« ${b} » → ${t}`).join(' ; ')}`); }
      if (etat.deborde) { fautes++; echec(`${nom} : l'image ${etat.img} sort de son cadre ${etat.cadre}`); }
      if (etat.chevauche) { fautes++; echec(`${nom} : l'image ${etat.img} chevauche l'en-tête ou le pied`); }
      try {
        await bouton.click({ timeout: 3000, trial: false });
        await page.waitForFunction((n) => document.querySelectorAll('#langRow .lang-btn')[n]?.classList.contains('active'), i, { timeout: 3000 });
      } catch {
        fautes++; echec(`${nom} : le clic sur « ${code} » n'aboutit pas`);
      }
    }
    if (!fautes) console.log(`OK    ${nom} (${w}×${h}) : ${codes} langues, Précédent, Suivant et le saut de page cliquables ; l'image reste dans son cadre`);
    await page.close();
  }
} finally {
  await navigateur.close();
  serveur?.fermer();
}
if (echecs.length) { console.error(`\n${echecs.length} échec(s).`); process.exit(1); }
console.log('\nLecteur : toutes les commandes cliquables, à toutes les largeurs.');
