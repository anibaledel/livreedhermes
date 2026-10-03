// etat-fond-ecran.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'état bicolore d'une page — la collection chargée, le fond choisi, les
// deux couleurs — et UN SEUL écrivain : le sélecteur (monterSelecteurBicolore,
// vue-fond-ecran.js). Les lecteurs (l'animation bicolore, la galerie
// d'animations) l'importent et s'y abonnent.
//
// Pourquoi un module et pas une variable globale : l'état passait par
// window.fondEcran. Un global se lit de partout sans que rien ne le déclare ;
// le jour où une troisième page le lit, c'est la divergence des deux sources
// de données du fond d'écran qui recommence. Ici, qui lit l'état l'importe —
// la dépendance est écrite dans l'en-tête du fichier — et qui veut le changer
// le DEMANDE à l'écrivain (demanderPalette), qui reste seul à le modifier.
//
// L'état publié : { collection, code, objetFond, objetSuperposition, palette }
//   collection  la collection chargée (chargerCollection, bicolore-fonds.js)
//   code        le code du fond (P, B2, B121…, avec sa superposition)
//   palette     [bit 0, bit 1] — le fond de case et la figure

let courant = null;
const abonnes = new Set();
let ecrivain = null;
let resoudrePret;
const premier = new Promise((r) => { resoudrePret = r; });

// L'état courant (gelé), ou null tant que le sélecteur n'est pas monté.
export const etatFondEcran = () => courant;

// Résolu à la première publication.
export const etatPret = () => premier;

// fn(etat) à chaque changement, et tout de suite si l'état existe déjà.
// Renvoie la fonction de désabonnement.
export function abonner(fn) {
  abonnes.add(fn);
  if (courant) fn(courant);
  return () => abonnes.delete(fn);
}

// ---- réservé à l'écrivain ---------------------------------------------------
// Un second écrivain sur la même page est une erreur : deux sélecteurs qui
// publient tour à tour, c'est l'état qui change sans qu'on sache qui l'a dit.
export function devenirEcrivain({ definirPalette }) {
  if (ecrivain) throw new Error('etat-fond-ecran.js : un écrivain est déjà monté sur cette page');
  ecrivain = { definirPalette };
  return function publier(e) {
    courant = Object.freeze({ ...e, palette: Object.freeze(e.palette.slice()) });
    for (const fn of abonnes) fn(courant);
    resoudrePret(courant);
  };
}

// ---- demandes des lecteurs ---------------------------------------------------
// Changer les couleurs depuis l'animation : la demande passe par l'écrivain,
// qui met à jour ses champs, l'URL (?c0, ?c1) et republie.
export function demanderPalette(palette) {
  if (!ecrivain) throw new Error('etat-fond-ecran.js : aucun sélecteur monté pour recevoir la palette');
  ecrivain.definirPalette(palette);
}
