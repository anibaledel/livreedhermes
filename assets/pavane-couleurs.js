// pavane-couleurs.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Les couleurs de « Pavane — Voir sa musique » (prompt 211, §4) : des paires de contraste VALIDÉES, et une option « personnalisé » dont le contraste minimal est IMPOSÉ — un fond
// identique à la figure est impossible. Pur : ni DOM ni réseau. Le contraste est celui de WCAG 2 (rapport des luminances relatives), 3 : 1 au moins.
export const CONTRASTE_MIN = 3;
/** Les paires validées : [fond, figure] (bit 0, bit 1 du motif). */
export const PALETTES = Object.freeze({
  'creme-encre': Object.freeze(['#efeae0', '#23232b']),
  'rouge-blanc': Object.freeze(['#ffffff', '#c1121f']),
  mono: Object.freeze(['#f2f2f2', '#1a1a1a']),
});
export const PALETTE_DEFAUT = 'creme-encre';
export const CLES_PALETTES = Object.freeze([...Object.keys(PALETTES), 'perso']);
export const estHex = (s) => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export function luminance(hex) { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); }
export function contraste(a, b) { const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
/** Une paire personnalisée est valide si les deux sont des couleurs rrggbb et si leur contraste est d'au moins 3 : 1 (donc jamais deux couleurs égales). */
export const paireValide = (c0, c1) => estHex(c0) && estHex(c1) && contraste(c0, c1) >= CONTRASTE_MIN;
/** La paire [fond, figure] d'une palette : une clé validée, ou « perso » avec ses deux couleurs ; null si elle ne tient pas. */
export function paireDe(cle, c0 = null, c1 = null) {
  if (cle === 'perso') return paireValide(c0, c1) ? [c0.toLowerCase(), c1.toLowerCase()] : null;
  return PALETTES[cle] ? [...PALETTES[cle]] : null;
}
