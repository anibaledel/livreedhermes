// animation-bicolore.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le rendu BICOLORE de l'animation de fonds-ecran.html. L'animation reste
// celle de la page — même canevas, mêmes paramètres (rythme, fondu,
// densité, ordre de parcours, bouclage, micro, fichier audio, Full Réactif,
// pause, enregistrement 9:16 / 1:1 / natif, 15 / 30 / 60 s) : ce module ne
// fournit que la TUILE de chaque motif, et la page la pave.
//
// La tuile sort du moteur des pages et de l'export d'images : la lecture
// binaire du motif (lecture-binaire.js), motifSvg (bicolore-fonds.js) dans
// la collection et les couleurs choisies — l'état partagé de la page, tenu
// par la section « fond d'écran fixe » (vue-fond-ecran.js, window.fondEcran)
// —, rastérisée par svgEnPixels (vue-fond-motif.js), la fonction même de
// l'export Pinterest. Un moteur, trois sorties : la page, le PNG, la vidéo.
//
// Un motif dont la lecture binaire n'est pas définie (garde-fou) n'entre pas
// dans l'animation bicolore. Le filtre « diagonale sombre » de l'animation
// tricolore ne s'applique pas ici.
//
// État dans l'URL : ?rendu=bicolore (et fond, sup, c0, c1, partagés).

import { motifSvg } from './bicolore-fonds.js';
import { lectureBinaire } from './lecture-binaire.js';
import { svgEnPixels } from './vue-fond-motif.js';

const lectures = new WeakMap(); // grille -> cases | null
const tuiles = new Map(); // px -> WeakMap(grille -> { toile, pret })
let generation = 0; // change avec la collection ou les couleurs : les tuiles en cours sont périmées

function lire(grille) {
  if (!lectures.has(grille)) {
    let cases = null;
    try { cases = lectureBinaire(grille, 'animation').cases; } catch { cases = null; }
    lectures.set(grille, cases);
  }
  return lectures.get(grille);
}

export function monterAnimationBicolore({ bascule, onTuile }) {
  const p = new URLSearchParams(location.search);
  let actif = p.get('rendu') === 'bicolore';
  const etat = () => window.fondEcran.selecteur.etat();

  async function rendre(grille, px, entree, gen) {
    const e = etat();
    const svg = motifSvg(lire(grille), window.fondEcran.palette(), e.objetFond, { size: px, prefixe: 'anim-', superposition: e.objetSuperposition });
    const pixels = await svgEnPixels(svg, px, px);
    if (gen !== generation) return;
    const toile = document.createElement('canvas');
    toile.width = px; toile.height = px;
    toile.getContext('2d').putImageData(pixels, 0, 0);
    entree.toile = toile; entree.pret = true;
    onTuile(grille);
  }

  const api = {
    get actif() { return actif; },
    // ce motif entre-t-il dans l'animation bicolore ?
    lisible: (grille) => lire(grille) !== null,
    // la tuile du motif, à px pixels — null tant qu'elle se prépare
    tuile(grille, px) {
      if (!lire(grille)) return null;
      if (!tuiles.has(px)) tuiles.set(px, new WeakMap());
      const t = tuiles.get(px);
      let entree = t.get(grille);
      if (!entree) { entree = { pret: false }; t.set(grille, entree); rendre(grille, px, entree, generation); }
      return entree.pret ? entree.toile : null;
    },
    // prépare d'avance les tuiles d'une suite de motifs
    preparer(grilles, px) { for (const g of grilles) api.tuile(g, px); },
    // le code de la collection, pour le nom de la vidéo
    code: () => etat().code,
    couleurFond: () => window.fondEcran.palette()[0],
    invalider() { generation++; tuiles.clear(); },
    basculer(oui) {
      actif = oui;
      const q = new URLSearchParams(location.search);
      if (oui) q.set('rendu', 'bicolore'); else q.delete('rendu');
      history.replaceState(null, '', `${q.toString() ? `?${q}` : location.pathname}${location.hash}`);
      bascule(oui);
    },
  };
  window.addEventListener('fond-ecran-etat', () => { api.invalider(); bascule(actif); });
  return api;
}
