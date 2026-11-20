// pavane-etat.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'ÉTAT COMPLET de « Pavane — Voir sa musique » dans l'adresse (prompt 211, §4) : ?mode=defile|spectre|entre-deux&fond=P&corpus=128&trace=1&rythme=8&densite=4&palette=…&c0=…&c1=… pour
// partager et retrouver une configuration. LISTES FERMÉES : toute valeur qui n'est pas dans la liste est ignorée (le défaut s'applique), jamais corrigée ni devinée. Les clés des anciens liens
// (fonds-ecran.html : brythme, bdensite, fond, c0, c1 ; sup est ignoré) continuent de fonctionner. Pur : ni DOM ni réseau.
import { CLES_PALETTES, PALETTE_DEFAUT, paireValide } from './pavane-couleurs.js';
import { NIVEAUX_CORPUS, NIVEAU_DEFAUT } from './corpus-animation.js';

export const MODES = Object.freeze(['defile', 'spectre', 'entre-deux']);
export const MODE_DEFAUT = 'defile';
export const FOND_DEFAUT = 'P';
export const RYTHME_MIN = 0.5, RYTHME_MAX = 30, RYTHME_DEFAUT = 8;
export const DENSITE_MIN = 4, DENSITE_MAX = 32, DENSITE_DEFAUT = 4;
export const DEFAUTS = Object.freeze({ mode: MODE_DEFAUT, fond: FOND_DEFAUT, corpus: NIVEAU_DEFAUT, trace: false, rythme: RYTHME_DEFAUT, densite: DENSITE_DEFAUT, palette: PALETTE_DEFAUT, c0: null, c1: null });

const entier = (s) => (typeof s === 'string' && /^[1-9]\d*$/.test(s) ? Number(s) : null);
const decimal = (s) => (typeof s === 'string' && /^\d+(\.\d)?$/.test(s) ? Number(s) : null);
const hex = (s) => { const t = (s || '').replace(/^#/, '').toLowerCase(); return /^[0-9a-f]{6}$/.test(t) ? `#${t}` : null; };

/** L'état d'une adresse. `proposes` : la liste des fonds proposés (data/fonds/demi-periode.json), jamais écrite ici. Rend { etat, ignores } — `ignores` : les clés dont la valeur a été refusée. */
export function lireEtat(search, proposes) {
  const q = new URLSearchParams(search), etat = { ...DEFAUTS }, ignores = [];
  const lu = (cle, ...anciennes) => { for (const k of [cle, ...anciennes]) if (q.has(k)) return [k, q.get(k)]; return [null, null]; };
  const refuse = (k) => { if (k) ignores.push(k); };
  let [k, v] = lu('mode');
  if (k) { if (MODES.includes(v)) etat.mode = v; else refuse(k); }
  [k, v] = lu('fond');
  if (k) { if (Array.isArray(proposes) && proposes.includes(v)) etat.fond = v; else refuse(k); }
  [k, v] = lu('corpus');
  if (k) { const n = entier(v); if (NIVEAUX_CORPUS.includes(n)) etat.corpus = n; else refuse(k); }
  [k, v] = lu('trace');
  if (k) { if (v === '1') etat.trace = true; else if (v === '0') etat.trace = false; else refuse(k); }
  [k, v] = lu('rythme', 'brythme');
  if (k) { const x = decimal(v); if (x !== null && x >= RYTHME_MIN && x <= RYTHME_MAX && Math.round(x * 2) === x * 2) etat.rythme = x; else refuse(k); }
  [k, v] = lu('densite', 'bdensite');
  if (k) { const n = entier(v); if (n !== null && n >= DENSITE_MIN && n <= DENSITE_MAX) etat.densite = n; else refuse(k); }
  [k, v] = lu('palette');
  if (k) { if (CLES_PALETTES.includes(v)) etat.palette = v; else refuse(k); }
  const c0 = hex(q.get('c0')), c1 = hex(q.get('c1'));
  if (q.has('c0') || q.has('c1')) {
    if (c0 && c1 && paireValide(c0, c1)) { etat.c0 = c0; etat.c1 = c1; if (!q.has('palette')) etat.palette = 'perso'; } // un ancien lien (?c0=…&c1=…) est une palette personnalisée
    else { refuse('c0'); refuse('c1'); }
  }
  if (etat.palette === 'perso' && !(etat.c0 && etat.c1)) { etat.palette = DEFAUTS.palette; refuse('palette'); } // « perso » sans deux couleurs valides : le défaut
  return { etat, ignores };
}
/** La chaîne de requête d'un état : seulement ce qui diffère du défaut (une adresse courte), dans un ordre fixe. */
export function ecrireEtat(etat) {
  const q = new URLSearchParams();
  if (etat.mode !== DEFAUTS.mode) q.set('mode', etat.mode);
  if (etat.fond !== DEFAUTS.fond) q.set('fond', etat.fond);
  if (etat.corpus !== DEFAUTS.corpus) q.set('corpus', String(etat.corpus));
  if (etat.trace) q.set('trace', '1');
  if (etat.rythme !== DEFAUTS.rythme) q.set('rythme', String(etat.rythme));
  if (etat.densite !== DEFAUTS.densite) q.set('densite', String(etat.densite));
  if (etat.palette !== DEFAUTS.palette) q.set('palette', etat.palette);
  if (etat.palette === 'perso') { q.set('c0', etat.c0.slice(1)); q.set('c1', etat.c1.slice(1)); }
  const s = q.toString();
  return s ? `?${s}` : '';
}
