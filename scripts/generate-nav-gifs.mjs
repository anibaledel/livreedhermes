/* ============================================================
   Génère les 15 GIF de survol des carrés de nav (assets/nav-icons/<key>-hover.gif).
   Usage : node scripts/generate-nav-gifs.mjs (depuis la racine du dépôt).

   TECHNIQUE : reprend celle déjà en production sur articles.html/a-propos.html
   (assets/caducee-unified-patterns-tint.gif en background-repeat:repeat) —
   un GIF animé en fond répété. L'animation vit dans le fichier, la
   répétition est gérée en CSS (background-repeat + background-size) : les
   deux ne se contredisent pas, contrairement à une planche PNG animée par
   steps() en background-position (qui utilise cette même propriété pour le
   défilement des vues ET en aurait eu besoin pour le pavage — abandonné).

   CONTENU DES 8 IMAGES : les huit pas successifs de l'algorithme de marche
   du mode méditatif de fonds-ecran.html (pickNextByProximity : à chaque
   pas, parmi les motifs pas encore vus dans le cycle, on choisit celui dont
   la grille diffère le moins de la précédente — un fondu discret, jamais un
   saut brutal). Porté ici à l'identique, sauf le point de départ : la page
   tire un index au hasard (Math.random), inapproprié pour un asset figé au
   build ; on part du candidat identique à l'icône statique au repos
   (yang/yang_mut, n de l'entrée), pour un raccord visuel net entre le PNG
   figé et la première image du GIF.

   POOL PAR FAMILLE : la page construit son pool via DATA.entries filtré par
   catégorie — mais DATA.entries ne référence que 7 familles sur les 12
   utilisées par la nav (vérifié dans une session précédente). Impossible
   de reprendre ce filtre tel quel pour les 5 familles sans entrée catalogue.
   Le pool est donc reconstruit directement à partir des grilles de la
   famille (4 paires de natures × 64 numéros d'hexagramme), avec le même
   filtre hasDarkDiagonal() que buildGridsFor() — même algorithme de marche,
   source de pool adaptée à la contrainte déjà établie.

   CYMATIQUE : figée, ne suit PAS ce moteur — les 8 gammes de
   data/referent_bandes_v1.json (déjà utilisées pour son ancienne planche
   PNG), simplement ré-encodées en GIF au lieu d'un PNG en bande.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import gifenc from 'gifenc';
import { hexToBits, triangleGeometry, PARTS } from '../assets/bicolore-render.js';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'nav-icons');

const TILE_SIZE = 36;   // = background-size en CSS (pavage 2x2 dans un carré de 72px)
const FRAME_DELAY = 200; // ms/image — proche du rythme "rapide" du mode méditatif
const NAV_LIGHT = '#f2ece1';
const NAV_DARK = '#e0261b'; // Cymatique : le sombre d'origine (#2b2b2b) remplacé par --red, géométrie/gammes inchangées

// ---------- palette neutre (identique à generate-nav-icons.mjs) ----------
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
const RED_ANCHOR = '#e0261b';
const PALETTE = applySingleHue(RED_ANCHOR);

// ---------- moteur fonds-ecran (hexagramGrid + pool + marche par proximité) ----------
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
function hasDarkDiagonal(grid){
  for(let i=0;i<12;i++){
    if(grid[i][i] !== 'M' || grid[i][11-i] !== 'M') return false;
  }
  return true;
}
function gridDistance(a,b){
  let d=0;
  for(let r=0;r<12;r++) for(let c=0;c<12;c++) if(a[r][c]!==b[r][c]) d++;
  return d;
}
const SUB_PAIRS = [['yang','yang_mut'],['yin','yin_mut'],['yang','yin'],['yang_mut','yin_mut']];
function buildFamilyPool(familyKey){
  const fam = fondsEcran.families[familyKey];
  const out = [];
  for(const [subA,subB] of SUB_PAIRS){
    for(let n=0;n<64;n++){
      const grid = hexagramGrid(n, fam[subA], fam[subB]);
      if(!hasDarkDiagonal(grid)) out.push({grid, subA, subB, n});
    }
  }
  return out;
}
// port de pickNextByProximity(), démarrage déterministe (voir en-tête).
function walkByProximity(pool, startIndex, steps){
  let currentIndex = startIndex;
  let visited = new Set([currentIndex]);
  const seq = [pool[currentIndex]];
  for(let s=1; s<steps; s++){
    let candidates = pool.map((g,i)=>i).filter(i=>!visited.has(i));
    if(candidates.length===0){ visited = new Set([currentIndex]); candidates = pool.map((g,i)=>i).filter(i=>!visited.has(i)); }
    let best = candidates[0], bestDist = Infinity;
    for(const i of candidates){
      const d = gridDistance(pool[currentIndex].grid, pool[i].grid);
      if(d < bestDist){ bestDist = d; best = i; }
    }
    currentIndex = best; visited.add(best);
    seq.push(pool[currentIndex]);
  }
  return seq.map(x=>x.grid);
}

function drawGridRGBA(grid, size){
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cell = size/12;
  for(let r=0;r<12;r++) for(let c=0;c<12;c++){
    ctx.fillStyle = PALETTE[grid[r][c]];
    ctx.fillRect(c*cell, r*cell, cell+0.6, cell+0.6);
  }
  return ctx.getImageData(0,0,size,size).data;
}
function drawTriangleRGBA(mask, size){
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = NAV_LIGHT;
  ctx.fillRect(0,0,size,size);
  const cellPx = size/12;
  for(let i=0;i<PARTS;i++){
    if(mask[i]!==1 && mask[i]!=='1') continue;
    const pts = triangleGeometry(i, cellPx);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = NAV_DARK;
    ctx.fill();
  }
  return ctx.getImageData(0,0,size,size).data;
}
function encodeGif(frames, size, delayMs){
  const gif = GIFEncoder();
  for(const rgba of frames){
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, size, size, { palette, delay: delayMs });
  }
  gif.finish();
  return Buffer.from(gif.bytes());
}

// ---------- attribution (identique à generate-nav-icons.mjs) ----------
const FAMILY_KEYS = Object.keys(fondsEcran.families);
const NON_CYMATIQUE_ENTRIES = [
  { key: 'accueil',          familyKey: FAMILY_KEYS[0],  n: 0 },
  { key: 'tirage',           familyKey: FAMILY_KEYS[1],  n: 0 },
  { key: 'hexagrammes',      familyKey: FAMILY_KEYS[2],  n: 0 },
  { key: 'creation-motifs',  familyKey: FAMILY_KEYS[3],  n: 0 },
  { key: 'unified-patterns', familyKey: FAMILY_KEYS[4],  n: 0 },
  { key: 'galerie-884',      familyKey: FAMILY_KEYS[5],  n: 0 },
  { key: 'motifs-svg',       familyKey: FAMILY_KEYS[6],  n: 0 },
  { key: 'fond-ecran',       familyKey: FAMILY_KEYS[7],  n: 0 },
  { key: 'impression',       familyKey: FAMILY_KEYS[8],  n: 0 },
  { key: 'encodeur',         familyKey: FAMILY_KEYS[9],  n: 0 },
  { key: 'contact',          familyKey: FAMILY_KEYS[10], n: 0 },
  { key: 'a-propos',         familyKey: FAMILY_KEYS[11], n: 0 },
  { key: 'lexique',          familyKey: FAMILY_KEYS[0],  n: 32 },
  { key: 'articles',         familyKey: FAMILY_KEYS[1],  n: 32 },
  { key: 'outils',           familyKey: FAMILY_KEYS[2],  n: 48 },
  { key: 'la-livree-d-hermes', familyKey: FAMILY_KEYS[3], n: 48 },
];
const referentBandes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'referent_bandes_v1.json'), 'utf8'));
const CYMATIQUE_GAMME_KEYS = ['yang pur yin pur', 'yang mut', 'yang', 'yin mut', 'yin', 'yang mut yin mut', 'yang pur', 'yang yin mut'];

// ---------- génération ----------
let totalBytes = 0;
console.log(`Génération de 15 GIF de survol (${TILE_SIZE}px, ${FRAME_DELAY}ms/image)\n`);

for(const {key, familyKey, n} of NON_CYMATIQUE_ENTRIES){
  const pool = buildFamilyPool(familyKey);
  const startIdx = pool.findIndex(p => p.subA==='yang' && p.subB==='yang_mut' && p.n===n);
  const grids = walkByProximity(pool, startIdx===-1?0:startIdx, 8);
  const frames = grids.map(g => drawGridRGBA(g, TILE_SIZE));
  const buf = encodeGif(frames, TILE_SIZE, FRAME_DELAY);
  fs.writeFileSync(path.join(OUT_DIR, `${key}-hover.gif`), buf);
  totalBytes += buf.length;
  console.log(`  ${key.padEnd(18)} ${(buf.length/1024).toFixed(2).padStart(6)} Ko`);
}

const cymMasks = CYMATIQUE_GAMME_KEYS.map(k => hexToBits(referentBandes.gammes[k].yang));
const cymFrames = cymMasks.map(m => drawTriangleRGBA(m, TILE_SIZE));
const cymBuf = encodeGif(cymFrames, TILE_SIZE, FRAME_DELAY);
fs.writeFileSync(path.join(OUT_DIR, 'cymatique-hover.gif'), cymBuf);
totalBytes += cymBuf.length;
console.log(`  ${'cymatique'.padEnd(18)} ${(cymBuf.length/1024).toFixed(2).padStart(6)} Ko   (figée, 8 gammes)`);

console.log(`\nTotal 15 GIF : ${(totalBytes/1024).toFixed(2)} Ko (contre 145 Ko pour les 15 planches PNG actuelles)`);
