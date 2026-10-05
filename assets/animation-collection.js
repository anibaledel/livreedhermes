// animation-collection.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'animation d'une collection, rendue depuis sa RECETTE (data/fonds/
// collections-pinterest.json, écrite par tools/recettes_animations.mjs) et
// une VUE (vitesse, couleurs — au visiteur, dans l'URL de
// galerie-animations.html). Deux choses distinctes, nommées distinctement :
//
//   la recette  graine, liste ordonnée des motifs, durée par motif, fondu,
//               carton de fin, cadence, densité — fixée une fois, au registre ;
//   la vue      vitesse et couleurs — le visiteur décide.
//
// Une image se dessine en fonction du TEMPS t, et de rien d'autre : la
// prévisualisation l'appelle au temps de l'horloge, le générateur au temps
// d'une horloge virtuelle (k / images par seconde). Même fonction, même
// image — la vidéo est la prévisualisation, encodée hors temps réel.
//
// Le moteur n'est pas réécrit : la tuile de chaque motif sort de motifSvg
// (bicolore-fonds.js) sur la lecture binaire (lecture-binaire.js), rastérisée
// par svgEnPixels (vue-fond-motif.js) — le chemin de l'export Pinterest et
// de l'animation du fond d'écran.

import { decomposer, motifSvg } from './bicolore-fonds.js';
import { lectureBinaire } from './lecture-binaire.js';
import { superposition, nomDuFond } from './selecteur-fonds.js';
import { svgEnPixels } from './vue-fond-motif.js';
import { chargerDonneesFond, grilleDuMotif, slugDe, FAMILLES } from './vue-fond-ecran.js';

// clés non numériques : l'ordre d'écriture est l'ordre d'affichage (9:16 d'abord)
export const FORMATS = { '9x16': { largeur: 1080, hauteur: 1920, nom: '1080x1920', libelle: '9:16 (1080 × 1920)' }, '1x1': { largeur: 1080, hauteur: 1080, nom: '1080x1080', libelle: '1:1 (1080 × 1080)' } };
export const VITESSES = [0.5, 0.75, 1, 1.5, 2];
export const SITE = 'anibal-amiot.com';
export const AUTEUR = 'Anibal Edelberto Amiot';

let charge = null;
// Le registre et les données du moteur, chargés une fois.
export function chargerAnimations() {
  charge ||= Promise.all([chargerDonneesFond(), fetch(new URL('../data/fonds/collections-pinterest.json', import.meta.url)).then((r) => r.json())])
    .then(([fond, registre]) => ({ ...fond, registre }));
  return charge;
}

// Les collections du registre qui ont une recette, dans l'ordre de publication
// (rang 1, 2, 3…, puis celles sans rang). Aucune liste écrite dans la page.
export function collectionsAnimees(registre) {
  return Object.entries(registre.collections)
    .filter(([, c]) => c.recette)
    .sort(([, a], [, b]) => (a.rang ?? Infinity) - (b.rang ?? Infinity))
    .map(([code, c]) => ({ code, ...c }));
}

// La durée totale, carton de fin compris. La vitesse s'applique aux motifs
// et aux fondus ; le carton de fin garde sa durée, le temps de lire.
export const dureeTotale = (rec, vitesse = 1) => (rec.motifs.length * rec.dureeMotif) / vitesse + rec.fin;
export const nombreImages = (rec, vitesse = 1) => Math.round(dureeTotale(rec, vitesse) * rec.imagesParSeconde);

// Ce qui est à l'écran au temps t : le motif i, et dans les `fondu` dernières
// secondes d'un motif, le suivant (ou le carton, après le dernier) à l'opacité a.
export function moment(rec, t, vitesse = 1) {
  // un horodatage d'image peut précéder de peu l'instant de départ : t < 0 vaut 0
  t = Math.max(0, t);
  const d = rec.dureeMotif / vitesse, f = rec.fondu / vitesse, n = rec.motifs.length;
  if (t >= n * d) return { carton: true };
  const i = Math.min(n - 1, Math.floor(t / d));
  const local = t - i * d;
  // sans carton de fin (recette 32, « fin »: 0), le dernier motif reste plein
  // jusqu'au bout : rien vers quoi se fondre
  if (i + 1 >= n && !(rec.fin > 0)) return { i, suivant: 'carton', a: 0 };
  const a = local > d - f ? (local - (d - f)) / f : 0;
  return { i, suivant: i + 1 < n ? i + 1 : 'carton', a };
}

// Le nom du fichier porte ce qui le détermine : la collection, le format, et
// la vitesse et les couleurs quand elles s'écartent du défaut de la recette.
export function nomFichier(code, format, vue, defaut) {
  const parts = [`animation-${code.replace('+', '-')}`, FORMATS[format].nom];
  if (vue.vitesse !== 1) parts.push(`v${String(vue.vitesse).replace('.', '_')}`);
  if (vue.palette.join() !== defaut.join()) parts.push(`c${vue.palette.map((c) => c.replace('#', '')).join('-')}`);
  return `${parts.join('-')}.mp4`;
}

const FAMILLE_DU_SLUG = new Map(FAMILLES.map((f) => [slugDe(f, 0).replace(/-h0$/, ''), f]));
function grilleDuSlug(data, slug) {
  const m = /^(.*)-h(\d+)$/.exec(slug);
  const fam = m && FAMILLE_DU_SLUG.get(m[1]);
  if (!fam) throw new Error(`animation-collection.js : motif « ${slug} » inconnu`);
  return grilleDuMotif(data, fam, Number(m[2]));
}

// Un rendu prêt à dessiner, pour une collection, une vue et une taille.
// preparer() rastérise les tuiles (asynchrone, une fois) ; dessiner(ctx, t)
// est ensuite synchrone : il ne dépend que de t.
export async function creerRendu({ code, vue, largeur, hauteur }) {
  const { data, collection, calculs, registre } = await chargerAnimations();
  const col = registre.collections[code];
  if (!col || !col.recette) throw new Error(`animation-collection.js : pas de recette pour « ${code} »`);
  const rec = col.recette;
  const d = decomposer(code);
  const fond = collection.fonds.get(d.fond);
  if (!fond) throw new Error(`animation-collection.js : fond ${d.fond} absent de la collection`);
  const sup = d.superposition ? superposition(d.glyphe, d.echelle, { ...collection, glyphes: calculs.glyphes }) : null;
  const px = Math.ceil(Math.min(largeur, hauteur) / rec.densite);
  const tuiles = [];
  for (const slug of rec.motifs) {
    const cases = lectureBinaire(grilleDuSlug(data, slug), slug).cases;
    const svg = motifSvg(cases, vue.palette, fond, { size: px, prefixe: 'ga-', superposition: sup });
    const pixels = await svgEnPixels(svg, px, px);
    const toile = document.createElement('canvas');
    toile.width = px; toile.height = px;
    toile.getContext('2d').putImageData(pixels, 0, 0);
    tuiles.push(toile);
  }
  // le carton de fin : la collection et l'adresse du site — une vidéo
  // repartagée arrive sans la page autour
  await document.fonts.load(`400 ${Math.round(largeur / 14)}px "Barlow Semi Condensed"`);
  const nom = nomDuFond(fond, 'fr');
  // le pavage, centré, sur des positions entières : pas de liseré entre tuiles
  const ox = -Math.floor((Math.ceil(largeur / px) * px - largeur) / 2);
  const oy = -Math.floor((Math.ceil(hauteur / px) * px - hauteur) / 2);
  function paver(ctx, tuile) {
    for (let y = oy; y < hauteur; y += px) for (let x = ox; x < largeur; x += px) ctx.drawImage(tuile, x, y);
  }
  function carton(ctx) {
    ctx.fillStyle = vue.palette[0];
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.fillStyle = vue.palette[1];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const u = largeur / 1080;
    ctx.font = `400 ${Math.round(76 * u)}px "Barlow Semi Condensed"`;
    ctx.fillText(`Collection ${code}`, largeur / 2, hauteur / 2 - 110 * u);
    ctx.font = `300 ${Math.round(40 * u)}px "Barlow Semi Condensed"`;
    ctx.fillText(nom, largeur / 2, hauteur / 2 - 30 * u);
    // le nom de l'auteur (décision d'Anibal, 2026-10-05) : il ne se traduit pas
    ctx.fillText(AUTEUR, largeur / 2, hauteur / 2 + 50 * u);
    ctx.fillText(SITE, largeur / 2, hauteur / 2 + 130 * u);
  }
  function couche(ctx, quoi) { if (quoi === 'carton') carton(ctx); else paver(ctx, tuiles[quoi]); }
  return {
    recette: rec,
    duree: dureeTotale(rec, vue.vitesse),
    images: nombreImages(rec, vue.vitesse),
    dessiner(ctx, t) {
      const m = moment(rec, t, vue.vitesse);
      ctx.globalAlpha = 1;
      if (m.carton) { carton(ctx); return; }
      couche(ctx, m.i);
      if (m.a > 0) { ctx.globalAlpha = m.a; couche(ctx, m.suivant); ctx.globalAlpha = 1; }
    },
  };
}
