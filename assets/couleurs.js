// couleurs.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Les couleurs par défaut des rendus à deux valeurs — UN SEUL jeu de
// constantes, lu par TOUT rendu bicolore de motif : creation-bicolore-v2.html,
// bicolore.html, galerie-bicolore.html, cymatique.html, les vues de fond
// (vue-fond-motif.js, vue-fond-ecran.js), l'animation de fonds-ecran.html,
// la galerie d'animations et l'export (tools/export_pinterest_fonds.mjs).
// tools/check_couleurs.mjs vérifie qu'aucun ne recopie ces valeurs.
//
// LE BICOLORE EST ROUGE ET BLANC, les couleurs de la charte du site
// (décision d'Anibal, 3 octobre 2026, qui remplace le crème et l'encre) :
// UNE SEULE CHARTE GRAPHIQUE AU LIEU DE DEUX. Le crème obligeait à adapter
// le site autour des motifs ; le rouge et le blanc sont déjà ceux du site,
// et ils donnent une identité reconnaissable en vignette.
//
//   ROUGE — #e0261b, le rouge du générateur bicolore v2 : la part SOMBRE du
//           motif, le bit 1, celle que l'encre occupait ;
//   BLANC — #f2f2f0, le --white de style.css : la part CLAIRE, le bit 0,
//           celle que le crème occupait. Rouge sur blanc : 4,2:1 (mesuré par
//           check_couleurs.mjs), au-dessus du seuil de 3:1 — trois fois moins
//           que l'encre sur le crème (13,0:1) : les trames fines lisent plus
//           doux en petit format.
//   Il n'y a plus de noir dans le bicolore : ni #000000, ni l'encre par
//   défaut.
//
// Le crème et l'encre ne disparaissent pas : ils restent des couleurs
// choisissables dans les sélecteurs, comme le rouge l'était.
//   CREME — #efeae0, le crème des cases de la planche de bandes, mesuré sur
//           l'image (relevé d'Anibal, 3 octobre 2026) ;
//   ENCRE — #23232b, le sombre des bandes de la même planche ;
//   GRIS  — #808285, l'ancien gris par défaut de cymatique.html : 3,21:1
//           contre le crème — le rendu monochrome du site (MONOCHROME_SITE).
//
// Ce sont des défauts, pas des contraintes : toute autre teinte reste
// choisissable dans les sélecteurs de couleur, et l'état part dans l'URL.

export const CREME = '#efeae0';
export const ENCRE = '#23232b';
export const GRIS = '#808285';
export const ROUGE = '#e0261b';
export const BLANC = '#f2f2f0';

// [bit 0, bit 1] : le clair est le fond, le bit 1 porte la figure.
export const PALETTES = Object.freeze({
  bicolore: Object.freeze([BLANC, ROUGE]),
  monochrome: Object.freeze([CREME, GRIS]),
  // l'ancien défaut, gardé choisissable (un bouton dans chaque sélecteur)
  creme: Object.freeze([CREME, ENCRE]),
});
export const PALETTE_DEFAUT = PALETTES.bicolore;

// Deux « monochromes » DISTINCTS, à ne pas confondre (décision d'Anibal,
// 2026-10-03) — deux objets, deux noms :
//
//   MONOCHROME_SITE            le rendu monochrome du site : un gris (GRIS,
//                              #808285) sur crème. Rendus bicolores du site.
//   PINTEREST_NIVEAUX_DE_GRIS  la palette des séries Pinterest dites
//                              « monochrome » (dossiers corpus-1024-monochrome
//                              et corpus-1024-cellule-monochrome, noms gardés :
//                              des épingles portent ces adresses) : TROIS
//                              niveaux de gris, sans blanc ni crème — mesurés
//                              sur les 512 PNG des deux séries (les trois
//                              couleurs exactes des cellules, 1/3 des pixels
//                              chacune). Pas #808285 : ces séries sont justes.
//   PINTEREST_TRICOLORE        la palette des deux séries tricolores, violet,
//                              magenta, orange (V, M, O) — la même que les
//                              pages de motifs.
//
// Aucune des quatre séries ne porte le crème ni le rouge et blanc du
// bicolore : elles ne sont pas bicolores et ne changent pas. Le registre des séries
// (data/fonds/collections-pinterest.json, « series ») recopie ces valeurs ;
// tools/check_couleurs.mjs vérifie qu'elles concordent, et
// tools/check_series_pinterest.py que chaque image emploie la palette de sa série.
export const MONOCHROME_SITE = PALETTES.monochrome;
export const PINTEREST_NIVEAUX_DE_GRIS = Object.freeze(['#494949', '#6e6e6e', '#bababa']);
export const PINTEREST_TRICOLORE = Object.freeze(['#662d91', '#ee2a7b', '#fbb040']);

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
