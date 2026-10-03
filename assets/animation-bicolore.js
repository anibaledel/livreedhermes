// animation-bicolore.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le rendu BICOLORE de l'animation de fonds-ecran.html. L'animation reste
// celle de la page — même canevas, mêmes paramètres (rythme, fondu,
// densité, ordre de parcours, bouclage, micro, fichier audio, Full Réactif,
// pause, enregistrement 9:16 / 1:1 / natif, 15 / 30 / 60 s) : ce module
// fournit la TUILE de chaque motif, et la page la pave.
//
// La tuile sort du moteur des pages et de l'export d'images : la lecture
// binaire du motif (lecture-binaire.js), motifSvg (bicolore-fonds.js) dans
// la collection et les couleurs choisies, rastérisée par svgEnPixels
// (vue-fond-motif.js), la fonction même de l'export Pinterest. Un moteur,
// trois sorties : la page, le PNG, la vidéo.
//
// La collection et les couleurs viennent de l'état partagé (etat-fond-ecran.js),
// importé — pas d'une variable globale —, dont le sélecteur de la page est le
// seul écrivain. Changer les couleurs depuis l'écran d'animation est une
// DEMANDE à cet écrivain (demanderPalette).
//
// Un motif dont la lecture binaire n'est pas définie (garde-fou) n'entre pas
// dans l'animation bicolore. Le filtre « diagonale sombre » de l'animation
// tricolore ne s'applique pas ici : il porte sur la plus sombre des trois
// couleurs, qui n'existe plus après la lecture binaire.
//
// Le parcours (« le motif suivant est le plus proche ») mesure la proximité
// sur la lecture binaire, ce que le visiteur voit (proximite-binaire.js), et
// non sur la grille à trois couleurs.
//
// État dans l'URL : ?rendu=bicolore (et fond, sup, c0, c1, tenus par le sélecteur).

import { motifSvg } from './bicolore-fonds.js';
import { lectureBinaire } from './lecture-binaire.js';
import { svgEnPixels } from './vue-fond-motif.js';
import { abonner, demanderPalette, etatFondEcran } from './etat-fond-ecran.js';
import { distanceBinaire, signatureBinaire } from './proximite-binaire.js';
import { PALETTE_DEFAUT } from './couleurs.js';

const lectures = new WeakMap(); // grille -> cases | null
const signatures = new WeakMap(); // grille -> Uint8Array
const tuiles = new Map(); // px -> WeakMap(grille -> { toile, pret })
const dernieres = new WeakMap(); // grille -> dernière tuile prête, à toute taille
let generation = 0; // change avec la collection ou les couleurs : les tuiles en cours sont périmées

function lire(grille) {
  if (!lectures.has(grille)) {
    let cases = null;
    try { cases = lectureBinaire(grille, 'animation').cases; } catch { cases = null; }
    lectures.set(grille, cases);
  }
  return lectures.get(grille);
}
function signature(grille) {
  if (!signatures.has(grille)) signatures.set(grille, signatureBinaire(lire(grille)));
  return signatures.get(grille);
}

export function monterAnimationBicolore({ bascule, onTuile }) {
  const p = new URLSearchParams(location.search);
  let actif = p.get('rendu') === 'bicolore';
  const etat = () => etatFondEcran();

  async function rendre(grille, px, entree, gen) {
    const e = etat();
    const svg = motifSvg(lire(grille), e.palette, e.objetFond, { size: px, prefixe: 'anim-', superposition: e.objetSuperposition });
    const pixels = await svgEnPixels(svg, px, px);
    if (gen !== generation) return;
    const toile = document.createElement('canvas');
    toile.width = px; toile.height = px;
    toile.getContext('2d').putImageData(pixels, 0, 0);
    entree.toile = toile; entree.pret = true;
    dernieres.set(grille, toile);
    onTuile(grille);
  }

  const api = {
    get actif() { return actif; },
    // ce motif entre-t-il dans l'animation bicolore ?
    lisible: (grille) => lire(grille) !== null,
    // la tuile du motif, à px pixels. Tant qu'elle se prépare (densité changée),
    // la dernière tuile prête de ce motif, à une autre taille — la page l'étire
    // à la case : pas de fond vide pendant le recalcul. null si aucune n'existe.
    tuile(grille, px) {
      if (!lire(grille)) return null;
      if (!tuiles.has(px)) tuiles.set(px, new WeakMap());
      const t = tuiles.get(px);
      let entree = t.get(grille);
      if (!entree) { entree = { pret: false }; t.set(grille, entree); rendre(grille, px, entree, generation); }
      return entree.pret ? entree.toile : (dernieres.get(grille) || null);
    },
    // prépare d'avance les tuiles d'une suite de motifs
    preparer(grilles, px) { for (const g of grilles) api.tuile(g, px); },
    // distance entre deux motifs, sur leur lecture binaire (quarts de case)
    distance: (a, b) => distanceBinaire(signature(a), signature(b)),
    // le code de la collection, pour le nom de la vidéo ; sa description, pour la pause
    code: () => etat().code,
    description: () => etat().description,
    palette: () => etat().palette.slice(),
    couleurFond: () => etat().palette[0],
    // les couleurs réglées depuis l'écran d'animation : demandées au sélecteur
    definirPalette: (palette) => demanderPalette(palette),
    // « Réinitialiser » : PALETTE_DEFAUT (rouge et blanc), le défaut de tout rendu bicolore
    reinitialiserCouleurs: () => demanderPalette([...PALETTE_DEFAUT]),
    invalider() { generation++; tuiles.clear(); },
    basculer(oui) {
      actif = oui;
      const q = new URLSearchParams(location.search);
      if (oui) q.set('rendu', 'bicolore'); else q.delete('rendu');
      history.replaceState(null, '', `${q.toString() ? `?${q}` : location.pathname}${location.hash}`);
      bascule(oui);
    },
  };
  // à chaque changement de collection ou de couleurs : tuiles périmées, cartes refaites.
  // Les « dernières tuiles » restent : elles évitent le vide, et sont remplacées dès
  // que la nouvelle est prête.
  let premier = true;
  abonner(() => { if (premier) { premier = false; return; } api.invalider(); bascule(actif); });
  return api;
}
