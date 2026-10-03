// couleurs.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Les couleurs par défaut des rendus à deux valeurs — UN SEUL jeu de
// constantes, lu par les pages (vue-fond-motif.js, vue-fond-ecran.js,
// creation-bicolore-v2.html) et par l'export (tools/export_pinterest_fonds.mjs).
// Aucune n'est inventée : chacune est une couleur que le site emploie déjà,
// et tools/check_couleurs.mjs vérifie qu'elle n'a pas divergé de sa source.
//
//   CREME — #f2f2f0, le --white de style.css (texte principal du site), la
//           teinte claire la plus employée du site (16 occurrences, contre 3
//           pour #f2ece1, le clair des icônes de navigation) ;
//   NOIR  — #000000, le --bg de style.css (fond de page) ;
//   GRIS  — #808285, le gris par défaut de cymatique.html (PALETTE_DEFAULT,
//           son rendu bicolore) : 3,44:1 contre le crème, au-dessus du seuil
//           de 3:1 sous lequel un niveau ne se lit plus à distance.
//
// Ce sont des défauts, pas des contraintes : les sélecteurs de couleur des
// pages les remplacent, et l'état part dans l'URL (?c0=…&c1=…).

export const CREME = '#f2f2f0';
export const NOIR = '#000000';
export const GRIS = '#808285';

// [bit 0, bit 1] : le crème est le fond, le bit 1 porte la figure.
export const PALETTES = Object.freeze({
  bicolore: Object.freeze([CREME, NOIR]),
  monochrome: Object.freeze([CREME, GRIS]),
});
export const PALETTE_DEFAUT = PALETTES.bicolore;

// Contraste WCAG 2 entre deux couleurs #rrggbb (luminance relative).
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contraste(a, b) {
  const [h, l] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (h + 0.05) / (l + 0.05);
}
export const SEUIL_LISIBLE = 3;

// La palette lue dans l'URL (?c0=f2f2f0&c1=000000), sinon le défaut.
const HEX = /^[0-9a-f]{6}$/i;
export function paletteDeLUrl(defaut = PALETTE_DEFAUT) {
  const p = new URLSearchParams(location.search);
  const c0 = (p.get('c0') || '').replace('#', ''), c1 = (p.get('c1') || '').replace('#', '');
  return [HEX.test(c0) ? `#${c0.toLowerCase()}` : defaut[0], HEX.test(c1) ? `#${c1.toLowerCase()}` : defaut[1]];
}
// L'écrit dans l'URL ; le défaut ne s'écrit pas.
export function paletteDansLUrl(palette, defaut = PALETTE_DEFAUT) {
  const p = new URLSearchParams(location.search);
  const memes = palette[0].toLowerCase() === defaut[0] && palette[1].toLowerCase() === defaut[1];
  if (memes) { p.delete('c0'); p.delete('c1'); } else { p.set('c0', palette[0].replace('#', '')); p.set('c1', palette[1].replace('#', '')); }
  const q = p.toString();
  history.replaceState(null, '', (q ? `?${q}` : location.pathname) + location.hash);
}
