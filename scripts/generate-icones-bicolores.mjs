/* ============================================================
   Les icônes des deux tuiles bicolores de la navigation, en ENCRE ET CRÈME
   (assets/couleurs.js, PALETTE_DEFAUT — décision d'Anibal, 4 octobre 2026) :

   « Motifs bicolores » (bicolore.html) — assets/nav-icons/bicolore.png
     (128 px, au repos), bicolore-sprite.png (8 × 128 px), bicolore-fixe.png
     (36 px, mouvement réduit), bicolore-hover.gif (36 px, 8 images, 200 ms) :
     de VRAIS motifs de la page, composés par composeNiveauxMask
     (assets/bicolore-render.js, data/referent_bicolore_v1.json), les six
     niveaux sur une famille, du plus simple au plus composé — le moteur de
     la page, exécuté dans Chromium, pas une copie. Jusqu'ici, cette icône
     sortait du moteur tricolore (trois tons de rouge).

   « Galerie bicolore » (galerie-bicolore.html) — galerie-bicolore-fixe.png et
     galerie-bicolore-hover.gif : déjà à deux tons (rouge sur blanc) ; chaque
     pixel garde sa part de figure, recolorée de la paire rouge / blanc vers
     l'encre et le crème. Géométrie inchangée.

   Les anciennes icônes sont gardées dans assets/nav-icons/anciennes/, leur
   palette dans le nom (rien ne se supprime).

   Usage : node scripts/generate-icones-bicolores.mjs (Chromium : CHROMIUM_PATH ;
   les GIF et les PNG passent par Python / Pillow, sans perte de couleur).
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from '../tools/lib_fonds_site.mjs';
import { PALETTE_DEFAUT, ROUGE, BLANC } from '../assets/couleurs.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ICONES = path.join(ROOT, 'assets', 'nav-icons');
const ANCIENNES = path.join(ICONES, 'anciennes');
const [CREME, ENCRE] = PALETTE_DEFAUT;
const tmp = fs.mkdtempSync(path.join(fs.realpathSync('/tmp'), 'icones-'));

// garder les anciennes, leur palette dans le nom
fs.mkdirSync(ANCIENNES, { recursive: true });
const garder = (nom, palette) => {
  const [base, ext] = [nom.replace(/\.[a-z]+$/, ''), nom.split('.').pop()];
  const cible = path.join(ANCIENNES, `${base}-${palette}.${ext}`);
  if (!fs.existsSync(cible)) fs.copyFileSync(path.join(ICONES, nom), cible);
};
for (const n of ['bicolore.png', 'bicolore-sprite.png', 'bicolore-fixe.png', 'bicolore-hover.gif']) garder(n, 'rouge-tricolore');
for (const n of ['galerie-bicolore-fixe.png', 'galerie-bicolore-hover.gif']) garder(n, 'f2f2f0-e0261b');

// « Motifs bicolores » : huit motifs réels de la page, rendus par son moteur
const CYCLE = ['YANG', 'YIN', 'YANG-MUT', 'YIN-MUT', 'YANG+YANG-MUT', 'YIN+YIN-MUT', 'YIN+YANG', 'YIN+YIN-MUT+YANG+YANG-MUT'];
const serveur = await servirDepot(ROOT);
const navigateur = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await navigateur.newPage();
await page.goto(`${serveur.url}/404.html`);
const images = await page.evaluate(async ({ CYCLE, CREME, ENCRE }) => {
  const { composeNiveauxMask, triangleGeometry, GRID, PER_CELL } = await import('/assets/bicolore-render.js');
  const data = await (await fetch('/data/referent_bicolore_v1.json')).json();
  const masque = (k) => composeNiveauxMask(data.familles, data.layers, Array.from({ length: 6 }, () => ({ name: k, teinte: 'yang' })));
  const dessiner = (m, taille) => {
    const c = document.createElement('canvas'); c.width = c.height = taille;
    const x = c.getContext('2d');
    x.fillStyle = CREME; x.fillRect(0, 0, taille, taille);
    x.fillStyle = ENCRE;
    for (let i = 0; i < GRID * GRID * PER_CELL; i++) {
      if (m[i] !== 1 && m[i] !== '1') continue;
      const p = triangleGeometry(i, taille / GRID);
      x.beginPath(); x.moveTo(...p[0]); x.lineTo(...p[1]); x.lineTo(...p[2]); x.closePath(); x.fill();
    }
    return c.toDataURL('image/png').split(',')[1];
  };
  const m = CYCLE.map(masque);
  // dessinés en grand, puis échantillonnés (Pillow) : deux tons purs, sans gris d'anticrénelage
  return { p128: m.map((k) => dessiner(k, 128 * 8)), p36: m.map((k) => dessiner(k, 36 * 8)) };
}, { CYCLE, CREME, ENCRE });
await navigateur.close();
serveur.fermer();
images.p128.forEach((b, i) => fs.writeFileSync(path.join(tmp, `128-${i}.png`), Buffer.from(b, 'base64')));
images.p36.forEach((b, i) => fs.writeFileSync(path.join(tmp, `36-${i}.png`), Buffer.from(b, 'base64')));

// assemblage (Pillow) : PNG, planche, GIF ; puis la galerie recolorée
execFileSync('python3', ['-c', `
import sys, glob
from PIL import Image
tmp, ic, creme, encre, rouge, blanc = sys.argv[1:7]
h = lambda s: tuple(int(s[i:i+2], 16) for i in (1, 3, 5))
CR, EN, RO, BL = h(creme), h(encre), h(rouge), h(blanc)
def deux_tons(f, taille):
    im = Image.open(f).convert('RGB').resize((taille, taille), Image.NEAREST); px = im.load()
    for y in range(taille):
        for x in range(taille):
            px[x, y] = EN if px[x, y][1] < (CR[1] + EN[1]) / 2 else CR
    return im
p128 = [deux_tons(f'{tmp}/128-{i}.png', 128) for i in range(8)]
p36 = [deux_tons(f'{tmp}/36-{i}.png', 36) for i in range(8)]
p128[0].save(f'{ic}/bicolore.png', optimize=True)
p36[0].save(f'{ic}/bicolore-fixe.png', optimize=True)
planche = Image.new('RGB', (128 * 8, 128))
for i, im in enumerate(p128): planche.paste(im, (128 * i, 0))
planche.save(f'{ic}/bicolore-sprite.png', optimize=True)
p36[0].save(f'{ic}/bicolore-hover.gif', save_all=True, append_images=p36[1:], duration=200, loop=0, optimize=False)
# la galerie : chaque pixel garde son côté, figure ou fond (canal vert, le plus étalé entre rouge et blanc)
def recolorer(im):
    im = im.convert('RGB'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            px[x, y] = EN if px[x, y][1] < (BL[1] + RO[1]) / 2 else CR
    return im
recolorer(Image.open(f'{ic}/anciennes/galerie-bicolore-fixe-f2f2f0-e0261b.png')).save(f'{ic}/galerie-bicolore-fixe.png', optimize=True)
g = Image.open(f'{ic}/anciennes/galerie-bicolore-hover-f2f2f0-e0261b.gif')
cadres, durees = [], []
for i in range(g.n_frames):
    g.seek(i); cadres.append(recolorer(g.copy())); durees.append(g.info.get('duration', 200))
cadres[0].save(f'{ic}/galerie-bicolore-hover.gif', save_all=True, append_images=cadres[1:], duration=durees, loop=0, optimize=False)
`, tmp, ICONES, CREME, ENCRE, ROUGE, BLANC], { stdio: 'inherit' });
console.log(`Icônes bicolores en ${ENCRE} sur ${CREME} : bicolore.png, bicolore-sprite.png, bicolore-fixe.png, bicolore-hover.gif, galerie-bicolore-fixe.png, galerie-bicolore-hover.gif ; anciennes gardées dans assets/nav-icons/anciennes/.`);
