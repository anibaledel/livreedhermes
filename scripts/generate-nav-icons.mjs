/* ============================================================
   Génère les 15 vignettes de la nav du site (assets/nav-icons/<key>.png).
   Usage : node scripts/generate-nav-icons.mjs (depuis la racine du dépôt).

   MOTEUR : le même que fonds-ecran.html (et sa copie identique dans
   galerie-884-patterns-unifies.html) — hexagramGrid(n, gridA, gridB) sur
   DATA.families, dessiné ici avec la même logique que drawStaticTile mais
   sur un canvas hors écran (@napi-rs/canvas) au lieu d'un <canvas> DOM.
   Source extraite dans data/fonds_ecran_v1.json (voir plus bas) plutôt que
   relue par regex dans le HTML à chaque génération.

   FAMILLES : DATA.families a 12 clés, pas 15 — vérifié (voir aussi le fil de
   la session). Seules 7 ont de vraies entrées dans DATA.entries (68 à 136
   chacune) ; les 5 autres (par2:yang+yang_mut, par2:yin+yin_mut,
   par3:sans_yin, par3:sans_yin_mut, par4) ont des grilles de texture valides
   mais ne sont référencées par aucune entrée du catalogue — hexagramGrid()
   fonctionne pour elles quand même, appelé directement sans passer par
   DATA.entries. 12 familles pour 14 entrées (CYMATIQUE EXCLUE, voir plus
   bas) : les 12 premières prennent chacune une famille, les 2 restantes
   réutilisent une famille déjà prise avec un numéro d'hexagramme nettement
   différent. Paire (subA, subB) : yang/yang_mut partout, la plus fréquente
   dans le catalogue réel (64 occurrences par famille, à égalité avec
   yin/yin_mut).

   PALETTE : reprend applySingleHue() de fonds-ecran.html (V = teinte+20%
   luminosité, M = teinte-20%, O = teinte), mais avec une teinte neutre
   parchemin/charbon (désaturée, L=50% pour ne clipper ni V ni M) au lieu du
   #db694c par défaut de la page. Contrairement aux moteurs essayés avant
   (grille de cellules à 2 tons, cartes SVG à 2 tons), V/M/O restent ICI trois
   tons réellement distincts : c'est ce qui rend la famille visible dans le
   rendu final, là où une réduction à 2 tons l'effaçait.

   CYMATIQUE : FIGÉE, ne suit PAS ce moteur. Prototype validé dès le premier
   essai (28,85 Ko, 8 gammes de data/referent_bandes_v1.json rendues par
   triangleGeometry — pas maskToPavageSvg, qui produit un pavage répété, pas
   une planche à 8 vues distinctes). Une régénération ultérieure l'a alignée
   par erreur sur le moteur familles-bicolore ; restaurée ici à l'identique
   et gelée. NE PAS la faire suivre un futur changement global de moteur —
   c'est la seule qui ait été jugée satisfaisante telle quelle.

   PLANCHES D'ANIMATION (14 non-Cymatique) : la première version ne faisait
   varier que le numéro d'hexagramme n, en gardant (yang, yang_mut) pour
   toutes les vues — jugée trop subtile. Mesuré : (yang, yang_mut) et
   (yin, yin_mut) ne diffèrent que sur 48 à 96 cellules/144 selon la
   famille (les deux « natures » d'un même pôle sont proches). Les paires
   croisées (yang, yin) et (yang_mut, yin_mut) diffèrent sur 120 à 144/144
   — le maximum mesuré parmi les 6 paires possibles. Vue 0 = icône statique
   à l'identique (yang/yang_mut, n donné) — c'est la vue au repos, avant
   tout survol. Vues 1-4 : paire (yang, yin) sur 4 numéros d'hexagramme
   choisis en complément de bits exact (0/63, 21/42), pas seulement
   espacés arithmétiquement. Vues 5-7 : paire (yang_mut, yin_mut), mêmes
   numéros sauf 0 (déjà proche de la vue 0 en structure).
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { hexToBits, triangleGeometry, PARTS } from '../assets/bicolore-render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'nav-icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

const ICON_SIZE = 128;
const NAV_LIGHT = '#f2ece1';
const NAV_DARK = '#e0261b'; // Cymatique : le sombre d'origine (#2b2b2b) remplacé par --red, géométrie/gammes inchangées

// ---------- Dérivation de palette (portée de applySingleHue, fonds-ecran.html) ----------
function hexToRgb(hex){ hex=hex.replace('#',''); return [parseInt(hex.substr(0,2),16),parseInt(hex.substr(2,2),16),parseInt(hex.substr(4,2),16)]; }
function rgbToHex(r,g,b){ const c=v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0'); return '#'+c(r)+c(g)+c(b); }
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b);
  let h,s,l=(mx+mn)/2;
  if(mx===mn){ h=s=0; }
  else{
    const d=mx-mn;
    s = l>0.5 ? d/(2-mx-mn) : d/(mx+mn);
    switch(mx){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      case b: h=(r-g)/d+4; break;
    }
    h/=6;
  }
  return [h,s,l];
}
function hslToRgb(h,s,l){
  let r,g,b;
  if(s===0){ r=g=b=l; }
  else{
    const hue2rgb=(p,q,t)=>{
      if(t<0) t+=1; if(t>1) t-=1;
      if(t<1/6) return p+(q-p)*6*t;
      if(t<1/2) return q;
      if(t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    };
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return [r*255,g*255,b*255];
}
function adjustLightness(hex, delta){
  const [r,g,b] = hexToRgb(hex);
  let [h,s,l] = rgbToHsl(r,g,b);
  l = Math.max(0, Math.min(1, l+delta));
  const [r2,g2,b2] = hslToRgb(h,s,l);
  return rgbToHex(r2,g2,b2);
}
function applySingleHue(pickedHex){
  const mauve = adjustLightness(pickedHex, +0.20);
  const rose  = adjustLightness(pickedHex, -0.20);
  return { V: mauve, M: rose, O: pickedHex };
}

// Ancre rouge : --red:#e0261b de la charte du site, passé tel quel à
// applySingleHue (pas de désaturation — à revoir si le rendu vibre trop
// en petit format sur fond noir, cf. tête de session).
const RED_ANCHOR = '#e0261b';
const PALETTE = applySingleHue(RED_ANCHOR);

// ---------- Moteur fonds-ecran.html, porté (hexagramGrid + drawStaticTile) ----------
const fondsEcran = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'fonds_ecran_v1.json'), 'utf8'));
const LAYER_OF = fondsEcran.layerOf;

function hexagramGrid(n, gridA, gridB){
  const col = n % 8, row = Math.floor(n / 8);
  const bitsCol = [col&1, (col>>1)&1, (col>>2)&1];
  const bitsRow = [row&1, (row>>1)&1, (row>>2)&1];
  const traits = bitsCol.concat(bitsRow);
  const grid = [];
  for(let r=0;r<12;r++){
    const rowArr=[];
    for(let c=0;c<12;c++){
      const pos = LAYER_OF[r][c];
      const bit = traits[pos-1];
      rowArr.push(bit===1 ? gridA[r][c] : gridB[r][c]);
    }
    grid.push(rowArr);
  }
  return grid;
}

// Port direct de drawStaticTile(canvas, grid, size) — même boucle, même
// fillRect(cell+0.6) pour éviter les liserés d'arrondi entre cellules.
function drawStaticTileBuffer(grid, size){
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cell = size/12;
  for(let r=0;r<12;r++) for(let c=0;c<12;c++){
    ctx.fillStyle = PALETTE[grid[r][c]];
    ctx.fillRect(c*cell, r*cell, cell+0.6, cell+0.6);
  }
  return canvas.toBuffer('image/png');
}

// Planche d'animation : plusieurs grilles côte à côte dans un seul PNG.
function drawStaticTileSpriteBuffer(grids, size){
  const canvas = createCanvas(size * grids.length, size);
  const ctx = canvas.getContext('2d');
  const cell = size/12;
  grids.forEach((grid, frame) => {
    const ox = frame * size;
    for(let r=0;r<12;r++) for(let c=0;c<12;c++){
      ctx.fillStyle = PALETTE[grid[r][c]];
      ctx.fillRect(ox + c*cell, r*cell, cell+0.6, cell+0.6);
    }
  });
  return canvas.toBuffer('image/png');
}

function familyGrid(familyKey, n){
  const fam = fondsEcran.families[familyKey];
  return hexagramGrid(n, fam.yang, fam.yang_mut);
}

// 8 vues d'une planche : la vue 0 doit reproduire l'icône statique à
// l'identique (c'est la vue au repos, avant tout survol). Les vues 1-7
// visaient au départ à ne faire varier que le numéro d'hexagramme n en
// gardant la paire (yang, yang_mut) — jugé trop subtil : mesuré, cette
// paire ne diffère que sur 48 à 96 cellules/144 selon la famille. La
// paire (yang, yin) [et sa symétrique (yang_mut, yin_mut)] diffère sur
// 120 à 144/144 — le maximum mesuré parmi les 6 paires possibles. Les 7
// vues suivantes utilisent donc ces deux paires à forte tenue, sur des
// numéros d'hexagramme choisis pour être des compléments de bits exacts
// (0/63 et 21/42), pas seulement espacés arithmétiquement.
const SPRITE_N_VALUES = [0, 21, 42, 63];
function familySpriteGrids(familyKey, n0){
  const fam = fondsEcran.families[familyKey];
  const grids = [hexagramGrid(n0, fam.yang, fam.yang_mut)]; // vue 0 = icône statique
  for (const n of SPRITE_N_VALUES) grids.push(hexagramGrid(n, fam.yang, fam.yin));
  for (const n of SPRITE_N_VALUES.slice(1)) grids.push(hexagramGrid(n, fam.yang_mut, fam.yin_mut));
  return grids; // 1 + 4 + 3 = 8 vues
}

// ---------- Attribution : 12 familles pour 14 entrées (cymatique exclue) ----------
const FAMILY_KEYS = Object.keys(fondsEcran.families); // 12, ordre du fichier source
const NON_CYMATIQUE_ENTRIES = [
  { key: 'accueil',          familyKey: FAMILY_KEYS[0],  n: 0 },
  { key: 'tirage',           familyKey: FAMILY_KEYS[1],  n: 0 },
  { key: 'hexagrammes',      familyKey: FAMILY_KEYS[2],  n: 0 },
  { key: 'creation-motifs',  familyKey: FAMILY_KEYS[3],  n: 0 },
  { key: 'unified-patterns', familyKey: FAMILY_KEYS[4],  n: 0 },
  { key: 'galerie-884',      familyKey: FAMILY_KEYS[5],  n: 0 },
  { key: 'motifs-svg',       familyKey: FAMILY_KEYS[6],  n: 0 },
  { key: 'fond-ecran',       familyKey: FAMILY_KEYS[7],  n: 0 }, // la page source elle-même
  { key: 'impression',       familyKey: FAMILY_KEYS[8],  n: 0 },
  { key: 'encodeur',         familyKey: FAMILY_KEYS[9],  n: 0 },
  { key: 'contact',          familyKey: FAMILY_KEYS[10], n: 0 },
  { key: 'a-propos',         familyKey: FAMILY_KEYS[11], n: 0 },
  // familles réutilisées (12 familles, 14 entrées) : numéro d'hexagramme
  // nettement différent de l'entrée qui a pris la famille en premier.
  { key: 'lexique',          familyKey: FAMILY_KEYS[0],  n: 32 },
  { key: 'articles',         familyKey: FAMILY_KEYS[1],  n: 32 },
];

// ---------- Cymatique : figée, moteur triangle d'origine (bicolore-render.js) ----------
const referentBandes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bandes_v1.json'), 'utf8'));
function pngFromTriangleMask(mask, size){
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = NAV_LIGHT;
  ctx.fillRect(0, 0, size, size);
  const cellPx = size / 12;
  for (let i = 0; i < PARTS; i++) {
    if (mask[i] !== 1 && mask[i] !== '1') continue;
    const pts = triangleGeometry(i, cellPx);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = NAV_DARK;
    ctx.fill();
  }
  return canvas.toBuffer('image/png');
}
function pngSpriteFromTriangleMasks(masks, size){
  const canvas = createCanvas(size * masks.length, size);
  const ctx = canvas.getContext('2d');
  const cellPx = size / 12;
  masks.forEach((mask, frame) => {
    ctx.save();
    ctx.translate(frame * size, 0);
    ctx.fillStyle = NAV_LIGHT;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < PARTS; i++) {
      if (mask[i] !== 1 && mask[i] !== '1') continue;
      const pts = triangleGeometry(i, cellPx);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.closePath();
      ctx.fillStyle = NAV_DARK;
      ctx.fill();
    }
    ctx.restore();
  });
  return canvas.toBuffer('image/png');
}
// Paramètres exacts du prototype validé — figés, ne pas recalculer via un
// Object.keys(...).slice(0,8) qui dépendrait d'un ordre de clés non garanti.
const CYMATIQUE_GAMME_KEYS = ['yang pur yin pur', 'yang mut', 'yang', 'yin mut', 'yin', 'yang mut yin mut', 'yang pur', 'yang yin mut'];
function cymatiqueStatic(){
  return pngFromTriangleMask(hexToBits(referentBandes.gammes[CYMATIQUE_GAMME_KEYS[0]].yang), ICON_SIZE); // 'yang pur yin pur' — Object.keys(gammes)[0] dans le script d'origine
}
function cymatiqueSprite(){
  const masks = CYMATIQUE_GAMME_KEYS.map((k) => hexToBits(referentBandes.gammes[k].yang));
  return pngSpriteFromTriangleMasks(masks, ICON_SIZE);
}

// ---------- Génération ----------
let totalBytes = 0;
console.log(`Génération de 15 vignettes (${ICON_SIZE}px) — palette V=${PALETTE.V} M=${PALETTE.M} O=${PALETTE.O}\n`);

for (const { key, familyKey, n } of NON_CYMATIQUE_ENTRIES) {
  const grid = familyGrid(familyKey, n);
  const buf = drawStaticTileBuffer(grid, ICON_SIZE);
  fs.writeFileSync(path.join(OUT_DIR, `${key}.png`), buf);
  totalBytes += buf.length;
  console.log(`  ${key.padEnd(18)} ${(buf.length/1024).toFixed(2).padStart(6)} Ko   famille ${familyKey} (n=${n})`);
}

const cymBuf = cymatiqueStatic();
fs.writeFileSync(path.join(OUT_DIR, 'cymatique.png'), cymBuf);
totalBytes += cymBuf.length;
console.log(`  ${'cymatique'.padEnd(18)} ${(cymBuf.length/1024).toFixed(2).padStart(6)} Ko   FIGÉE — moteur triangle d'origine, gamme 'yang pur yin pur'`);

console.log(`\nTotal : ${(totalBytes/1024).toFixed(1)} Ko pour 15 vignettes -> assets/nav-icons/`);

// ---------- Planches d'animation : les 15 (14 + Cymatique figée) ----------
console.log(`\nPlanches d'animation (8 vues) :`);

let totalSpriteBytes = 0;

const cymSpriteBuf = cymatiqueSprite();
fs.writeFileSync(path.join(OUT_DIR, 'cymatique-sprite.png'), cymSpriteBuf);
totalSpriteBytes += cymSpriteBuf.length;
console.log(`  cymatique-sprite.png    ${(cymSpriteBuf.length/1024).toFixed(2)} Ko   FIGÉE — restaurée à l'identique (8 gammes, moteur triangle)`);

for (const { key, familyKey, n } of NON_CYMATIQUE_ENTRIES) {
  const grids = familySpriteGrids(familyKey, n);
  const buf = drawStaticTileSpriteBuffer(grids, ICON_SIZE);
  fs.writeFileSync(path.join(OUT_DIR, `${key}-sprite.png`), buf);
  totalSpriteBytes += buf.length;
  console.log(`  ${(key+'-sprite.png').padEnd(24)} ${(buf.length/1024).toFixed(2).padStart(6)} Ko   famille ${familyKey}, vue0=n${n}(yang/yang_mut), vues1-4=(yang/yin), vues5-7=(yang_mut/yin_mut)`);
}

console.log(`\nTotal planches : ${(totalSpriteBytes/1024).toFixed(1)} Ko pour 15 planches à 8 vues`);
console.log(`Total général : ${((totalBytes+totalSpriteBytes)/1024).toFixed(1)} Ko -> assets/nav-icons/`);
