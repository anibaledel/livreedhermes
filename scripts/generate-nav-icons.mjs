/* ============================================================
   Génère les 15 vignettes de la nav du site (assets/nav-icons/<key>.png),
   plus une planche d'animation à 8 vues par entrée (assets/nav-icons/
   <key>-sprite.png). Usage : node scripts/generate-nav-icons.mjs.

   HISTORIQUE (pourquoi ce moteur, et pas un autre) : deux moteurs à grille
   de cellules 12x12 ont été essayés et abandonnés — celui de fonds-ecran.html
   (DATA.families + hexagramGrid) et celui des cartes SVG individuelles
   (trait-cartes/, par2-cartes/). Les deux produisent, à taille de vignette,
   des textures qui se ressemblent trop d'une entrée à l'autre pour se
   distinguer au premier regard — vérifié sur quinze essais avec chacun. Le
   seul rendu jugé bon est Cymatique, seule entrée en géométrie à triangles
   (assets/bicolore-render.js). Les quinze vignettes utilisent maintenant ce
   moteur unique.

   SOURCE (les 14 entrées hors Cymatique) : data/referent_bicolore_v1.json
   (produit par tools/generate_referent_bicolore.py) — 15 familles, masques
   de 1152 triangles, même format que data/referent_bandes_v1.json. Le rendu
   de référence sur le site (cymatique.html) passe par maskToPavageSvg() en
   pavage 2x2 ; les vignettes restent un seul motif non pavé, comme Cymatique
   le fait déjà pour sa propre icône (voir plus bas) — cohérence entre les 15
   plutôt qu'un calque en plus par entrée.

   ATTRIBUTION : 15 familles disponibles, 14 entrées à pourvoir (Cymatique
   gelée sur sa propre source, voir plus bas) — 14 familles distinctes
   utilisées, une quinzième reste inutilisée. Pas de réutilisation, donc pas
   de choix de numéro à faire pour départager deux entrées de même famille.

   PLANCHES D'ANIMATION (8 vues) : combine les deux leviers disponibles dans
   une famille plutôt qu'un seul, comme pour Cymatique (qui varie la gamme).
   Le fichier expose `layers` ("1".."6" -> indices de triangles) qui
   partitionne les 1152 triangles en 6 groupes de 192 : les six niveaux de
   trait du Yi-King (même notion que LAYER_OF ailleurs sur le site, et que la
   fonction composeNiveauxMask déjà présente dans bicolore-render.js). Vues
   0 à 6 : révélation cumulative de ces 6 niveaux sur le masque yang (0 = vide,
   6 = motif yang complet, identique à l'icône statique). Vue 7 : motif yin
   complet. Pourquoi ce choix plutôt que l'alternance yang/yin seule : yin/
   yang à lui seul ne donne que 2 vues, pas 8 ; les 6 niveaux à eux seuls
   s'arrêtent au motif complet sans jamais montrer son complémentaire. Les
   combiner donne une boucle qui a un sens (construction progressive, puis
   bascule vers le complémentaire, puis retour au vide) plutôt que 8 vues
   choisies sans rapport entre elles.

   CYMATIQUE : FIGÉE, ne suit PAS ce moteur pour sa source de données (elle
   reste sur data/referent_bandes_v1.json, 8 gammes) — seul le mécanisme de
   rendu (triangleGeometry, canvas) est commun aux 15. Prototype validé dès
   le premier essai (icône 6,97 Ko, restaurée bit à bit identique au commit
   dbce6a4 ; planche 28,85 Ko, 8 gammes). NE PAS la faire suivre un futur
   changement de moteur ou d'attribution — c'est la seule entrée jugée
   satisfaisante telle quelle sur les quinze essayées.
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
const NAV_DARK = '#2b2b2b';

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

// ---------- Cymatique : figée, source et paramètres d'origine ----------
const referentBandes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bandes_v1.json'), 'utf8'));
// Figés — ne pas recalculer via Object.keys(...).slice(0,8), qui dépendrait
// d'un ordre de clés non garanti par la spec JSON.
const CYMATIQUE_GAMME_KEYS = ['yang pur yin pur', 'yang mut', 'yang', 'yin mut', 'yin', 'yang mut yin mut', 'yang pur', 'yang yin mut'];
function cymatiqueStatic(){
  return pngFromTriangleMask(hexToBits(referentBandes.gammes[CYMATIQUE_GAMME_KEYS[0]].yang), ICON_SIZE); // 'yang pur yin pur' — Object.keys(gammes)[0] dans le script d'origine
}
function cymatiqueSprite(){
  const masks = CYMATIQUE_GAMME_KEYS.map((k) => hexToBits(referentBandes.gammes[k].yang));
  return pngSpriteFromTriangleMasks(masks, ICON_SIZE);
}

// ---------- Les 14 autres : data/referent_bicolore_v1.json, une famille chacune ----------
const referentBicolore = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bicolore_v1.json'), 'utf8'));
const LAYERS = referentBicolore.layers; // "1".."6" -> indices de triangles
const FAMILY_KEYS = Object.keys(referentBicolore.familles); // 15

const ENTRY_KEYS = [
  'accueil', 'tirage', 'hexagrammes', 'creation-motifs', 'unified-patterns',
  'galerie-884', 'motifs-svg', 'fond-ecran', 'impression', 'encodeur',
  'contact', 'a-propos', 'lexique', 'articles',
]; // 14 — cymatique exclue, gelée sur sa propre source
if (FAMILY_KEYS.length < ENTRY_KEYS.length) {
  throw new Error(`${FAMILY_KEYS.length} familles pour ${ENTRY_KEYS.length} entrées — pas assez de familles distinctes.`);
}
const ENTRIES = ENTRY_KEYS.map((key, i) => ({ key, familyKey: FAMILY_KEYS[i] }));

function cumulativeLayerMask(bits, upToLevel){
  const mask = new Uint8Array(PARTS);
  for (let n = 1; n <= upToLevel; n++) {
    for (const gi of LAYERS[String(n)]) mask[gi] = bits[gi];
  }
  return mask;
}
function familySpriteFrames(familyKey){
  const fam = referentBicolore.familles[familyKey];
  const yangBits = hexToBits(fam.yang);
  const yinBits = hexToBits(fam.yin);
  const frames = [];
  // Vue 0 = motif yang complet (identique à l'icône statique) : c'est la vue
  // au repos, affichée par défaut avant tout survol — elle doit être un motif
  // complet, pas vide. Vues 1..6 : dépouillement progressif des 6 niveaux de
  // trait (6 = plus vide). Vue 7 : motif yin complet, avant la boucle vers 0.
  for (let level = 6; level >= 0; level--) frames.push(cumulativeLayerMask(yangBits, level));
  frames.push(yinBits);
  return frames;
}

// ---------- Génération ----------
let totalIconBytes = 0;
let totalSpriteBytes = 0;
console.log(`Génération de 15 vignettes (${ICON_SIZE}px) + 15 planches à 8 vues — moteur triangle unique\n`);

for (const { key, familyKey } of ENTRIES) {
  const fam = referentBicolore.familles[familyKey];
  const iconBuf = pngFromTriangleMask(hexToBits(fam.yang), ICON_SIZE);
  fs.writeFileSync(path.join(OUT_DIR, `${key}.png`), iconBuf);
  totalIconBytes += iconBuf.length;

  const spriteBuf = pngSpriteFromTriangleMasks(familySpriteFrames(familyKey), ICON_SIZE);
  fs.writeFileSync(path.join(OUT_DIR, `${key}-sprite.png`), spriteBuf);
  totalSpriteBytes += spriteBuf.length;

  console.log(`  ${key.padEnd(18)} icône ${(iconBuf.length/1024).toFixed(2).padStart(6)} Ko   planche ${(spriteBuf.length/1024).toFixed(2).padStart(6)} Ko   famille ${familyKey}`);
}

const cymIconBuf = cymatiqueStatic();
fs.writeFileSync(path.join(OUT_DIR, 'cymatique.png'), cymIconBuf);
totalIconBytes += cymIconBuf.length;
const cymSpriteBuf = cymatiqueSprite();
fs.writeFileSync(path.join(OUT_DIR, 'cymatique-sprite.png'), cymSpriteBuf);
totalSpriteBytes += cymSpriteBuf.length;
console.log(`  ${'cymatique'.padEnd(18)} icône ${(cymIconBuf.length/1024).toFixed(2).padStart(6)} Ko   planche ${(cymSpriteBuf.length/1024).toFixed(2).padStart(6)} Ko   FIGÉE — gammes de referent_bandes_v1.json`);

console.log(`\nTotal icônes  : ${(totalIconBytes/1024).toFixed(1)} Ko pour 15 vignettes`);
console.log(`Total planches : ${(totalSpriteBytes/1024).toFixed(1)} Ko pour 15 planches à 8 vues`);
console.log(`Total général : ${((totalIconBytes+totalSpriteBytes)/1024).toFixed(1)} Ko -> assets/nav-icons/`);
