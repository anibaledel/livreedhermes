// vue-fond-motif.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// La vue « fond de case » d'un motif tricolore (pages de motifs, fond
// d'écran) : la lecture binaire du motif (lecture-binaire.js), le sélecteur
// de fond (selecteur-fonds.js, le même composant que partout), la cellule et
// le pavage rendus par le moteur (bicolore-fonds.js), et les deux sorties
// tirées de ce même moteur : le pavage en SVG et l'image d'une collection
// Pinterest (1000 × 1500). L'export hors ligne
// (tools/export_pinterest_fonds.mjs) appelle la même fonction,
// imagePinterestSvg, sur la même lecture : une seule sortie.

import { chargerCollection, motifSvg, pavageSvg, imagePinterestSvg, FORMAT_PINTEREST } from './bicolore-fonds.js';
import { lectureBinaire } from './lecture-binaire.js';
import { creerSelecteurFonds, descriptionEtat, etatDeLUrl, etatDansLUrl } from './selecteur-fonds.js';
import { PALETTES, paletteDeLUrl, paletteDansLUrl } from './couleurs.js';

const TEXTES = {
  fr: {
    titre: 'Fond de case — lecture binaire',
    intro: (s) => `Les cases jaunes deviennent des triangles qui complètent la couleur la plus proche : ${s.jaunesPleins} cases jaunes pleines, ${s.coupees} coupées en deux, ${s.selles} coupées en quatre aux croisements. Le fond choisi se pose sur les cases pleines ; les cases coupées gardent leurs triangles.`,
    fond: 'Fond', cellule: 'Cellule', pavage: 'Pavage', c0: 'Couleur du fond', c1: 'Couleur de la figure', bicolore: 'Rouge / blanc', creme: 'Crème / encre', monochrome: 'Monochrome',
    dlSvg: 'Télécharger le pavage (SVG)', dlPng: 'Image Pinterest (PNG 1000 × 1500)',
    indefini: (m) => `La lecture binaire n'est pas définie pour ce motif : ${m}`,
  },
  en: {
    titre: 'Cell ground — binary reading',
    intro: (s) => `Yellow cells become triangles that complete the nearest colour: ${s.jaunesPleins} solid yellow cells, ${s.coupees} split in two, ${s.selles} split in four at the crossings. The chosen ground sits on the solid cells; split cells keep their triangles.`,
    fond: 'Ground', cellule: 'Cell', pavage: 'Tiling', c0: 'Ground colour', c1: 'Figure colour', bicolore: 'Red / white', creme: 'Cream / ink', monochrome: 'Monochrome',
    dlSvg: 'Download the tiling (SVG)', dlPng: 'Pinterest image (PNG 1000 × 1500)',
    indefini: (m) => `The binary reading is not defined for this motif: ${m}`,
  },
};

const charger = (() => {
  let promesse = null;
  return () => (promesse ||= Promise.all([
    fetch(new URL('../data/fonds/collection-v1.json', import.meta.url)).then((r) => r.json()),
    fetch(new URL('../data/fonds/collection-v1.calculs.json', import.meta.url)).then((r) => r.json()),
  ]).then(([json, calculs]) => ({ collection: chargerCollection(json, { calculs }), glyphes: calculs.glyphes })));
})();

// Rastérise un SVG du moteur à sa taille (navigateur) : les pixels.
export function svgEnPixels(svg, largeur, hauteur) {
  return new Promise((ok, ko) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = largeur; c.height = hauteur;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, largeur, hauteur);
      URL.revokeObjectURL(url);
      ok(ctx.getImageData(0, 0, largeur, hauteur));
    };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('SVG illisible')); };
    img.src = url;
  });
}

// PNG sans perte, à palette quand l'image a au plus 256 couleurs (deux
// couleurs et leur anticrénelage : toujours le cas ici) — un fichier dix
// fois plus léger que le PNG en vraies couleurs, pixels identiques.
// Compression par le navigateur (CompressionStream), sans dépendance : le
// bouton de la page et l'export (tools/export_pinterest_fonds.mjs) appellent
// cette même fonction, et produisent le même fichier.
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (octets) => { let c = 0xffffffff; for (const o of octets) c = CRC[(c ^ o) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function bloc(type, donnees) {
  const out = new Uint8Array(12 + donnees.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, donnees.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(donnees, 8);
  dv.setUint32(8 + donnees.length, crc32(out.subarray(4, 8 + donnees.length)));
  return out;
}
async function deflate(octets) {
  const flux = new Blob([octets]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(flux).arrayBuffer());
}
export async function pngDePixels({ width: w, height: h, data }) {
  const index = new Map();
  const idx = new Uint8Array(w * h);
  let palette = true;
  for (let i = 0; i < w * h && palette; i++) {
    const cle = (data[4 * i] << 24 | data[4 * i + 1] << 16 | data[4 * i + 2] << 8 | data[4 * i + 3]) >>> 0;
    let k = index.get(cle);
    if (k === undefined) { if (index.size === 256) { palette = false; break; } k = index.size; index.set(cle, k); }
    idx[i] = k;
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w); dv.setUint32(4, h);
  ihdr[8] = 8; ihdr[9] = palette ? 3 : 6;
  let brut;
  const morceaux = [];
  if (palette) {
    brut = new Uint8Array(h * (w + 1));
    for (let y = 0; y < h; y++) brut.set(idx.subarray(y * w, (y + 1) * w), y * (w + 1) + 1);
    const cles = [...index.keys()];
    const plte = new Uint8Array(cles.length * 3), trns = new Uint8Array(cles.length);
    cles.forEach((c, i) => { plte[3 * i] = c >>> 24; plte[3 * i + 1] = (c >>> 16) & 255; plte[3 * i + 2] = (c >>> 8) & 255; trns[i] = c & 255; });
    morceaux.push(bloc('PLTE', plte));
    if (trns.some((a) => a !== 255)) morceaux.push(bloc('tRNS', trns));
  } else {
    brut = new Uint8Array(h * (4 * w + 1));
    for (let y = 0; y < h; y++) brut.set(data.subarray(y * 4 * w, (y + 1) * 4 * w), y * (4 * w + 1) + 1);
  }
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  return new Blob([sig, bloc('IHDR', ihdr), ...morceaux, bloc('IDAT', await deflate(brut)), bloc('IEND', new Uint8Array(0))], { type: 'image/png' });
}

export async function svgEnPng(svg, largeur, hauteur) {
  return pngDePixels(await svgEnPixels(svg, largeur, hauteur));
}
export function telecharger(blob, nom) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nom;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// racine : l'élément qui reçoit la vue. grille : 12 × 12 classes V/M/O
// (la grille que la page affiche). Couleurs : [bit 0, bit 1], par défaut le
// bicolore noir sur crème d'assets/couleurs.js (le jeu de constantes
// unique), réglables, et dans l'URL (?c0=…&c1=…) quand elles en diffèrent.
export async function monterVueFond(racine, { grille, nom, slug, lang = 'fr' }) {
  const T = TEXTES[lang] || TEXTES.fr;
  let lecture;
  try { lecture = lectureBinaire(grille, nom); } catch (e) {
    racine.innerHTML = `<h2>${T.titre}</h2><p class="vf-intro">${T.indefini(e.message)}</p>`;
    return null;
  }
  const cases = lecture.cases;
  racine.innerHTML = `
    <h2>${T.titre}</h2>
    <p class="vf-intro">${T.intro(lecture.stats)}</p>
    <div class="vf-couleurs">
      <label>${T.c0} <input type="color" class="vf-c0"></label>
      <label>${T.c1} <input type="color" class="vf-c1"></label>
      <button type="button" class="vf-preset" data-palette="bicolore">${T.bicolore}</button>
      <button type="button" class="vf-preset" data-palette="creme">${T.creme}</button>
      <button type="button" class="vf-preset" data-palette="monochrome">${T.monochrome}</button>
    </div>
    <div class="vf-selecteur"><div class="vf-libelle">${T.fond}</div><div class="vf-sf"></div></div>
    <div class="renders">
      <div class="render-box"><div class="render-label">${T.cellule}</div><div class="vf-cellule"></div></div>
      <div class="render-box"><div class="render-label">${T.pavage}</div><div class="vf-pavage"></div>
        <button type="button" class="cta-like vf-dl-svg">${T.dlSvg}</button>
        <button type="button" class="cta-like vf-dl-png">${T.dlPng}</button></div>
    </div>
    <p class="vf-description"></p>`;
  const c0 = racine.querySelector('.vf-c0'), c1 = racine.querySelector('.vf-c1');
  [c0.value, c1.value] = paletteDeLUrl();
  const palette = () => [c0.value, c1.value];
  const { collection, glyphes } = await charger();
  let sel = null;
  const etat = () => sel.etat();
  const dessiner = () => {
    const e = etat(), pal = palette();
    racine.querySelector('.vf-cellule').innerHTML = motifSvg(cases, pal, e.objetFond, { size: 320, prefixe: 'vfc-', superposition: e.objetSuperposition });
    racine.querySelector('.vf-pavage').innerHTML = pavageSvg(cases, pal, e.objetFond, { colonnes: 2, lignes: 3, largeur: 320, hauteur: 480, prefixe: 'vfp-', superposition: e.objetSuperposition });
    racine.querySelector('.vf-description').innerHTML = descriptionEtat(e, lang);
  };
  sel = creerSelecteurFonds(racine.querySelector('.vf-sf'), {
    collection, glyphes, palette: palette(), lang, etat: etatDeLUrl(collection.fonds),
    onChange: (e) => { etatDansLUrl(e); dessiner(); },
  });
  sel.setMasque(cases);
  dessiner();
  const svgPinterest = () => { const e = etat(); return imagePinterestSvg(cases, palette(), e.objetFond, { superposition: e.objetSuperposition }); };
  const code = () => etat().code.replace('+', '-');
  racine.querySelector('.vf-dl-svg').addEventListener('click', () => {
    const e = etat();
    telecharger(new Blob([pavageSvg(cases, palette(), e.objetFond, { colonnes: 2, lignes: 3, superposition: e.objetSuperposition })], { type: 'image/svg+xml' }), `${slug}-${code()}-pavage.svg`);
  });
  racine.querySelector('.vf-dl-png').addEventListener('click', async () => {
    telecharger(await svgEnPng(svgPinterest(), FORMAT_PINTEREST.largeur, FORMAT_PINTEREST.hauteur), `${slug}-${code()}-pinterest.png`);
  });
  const api = {
    cases, stats: lecture.stats, selecteur: sel, etat,
    // L'image Pinterest de ce motif dans ce fond, telle que l'export la
    // produit (même fonction) — pour la vérification sur le site.
    svgPinterest,
    palette,
  };
  const changerCouleurs = () => { paletteDansLUrl(palette()); sel.setPalette(palette()); dessiner(); };
  for (const el of [c0, c1]) el.addEventListener('input', changerCouleurs);
  for (const b of racine.querySelectorAll('.vf-preset')) b.addEventListener('click', () => { [c0.value, c1.value] = PALETTES[b.dataset.palette]; changerCouleurs(); });
  window.selecteurFonds = sel;
  window.fondsMotif = api;
  return api;
}
