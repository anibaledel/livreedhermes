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
// les sources du son (bloc 2) : le morceau fourni (un des 7 de assets/musiques-chladni/), un fichier, le micro, une note pure ; le déclencheur du défilé : le minuteur ou la pulsation du son
export const SOURCES = Object.freeze(['morceau', 'fichier', 'micro', 'note']);
export const MORCEAUX = Object.freeze(['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7']);
export const DECLENCHEURS = Object.freeze(['minuteur', 'pulsation']);
export const NOTE_MIN = 110, NOTE_MAX = 1760, NOTE_DEFAUT = 440;
export const DEFAUTS = Object.freeze({ mode: MODE_DEFAUT, fond: FOND_DEFAUT, corpus: NIVEAU_DEFAUT, trace: false, rythme: RYTHME_DEFAUT, densite: DENSITE_DEFAUT, palette: PALETTE_DEFAUT, c0: null, c1: null, source: 'micro', morceau: 'j1', note: NOTE_DEFAUT, declencheur: 'minuteur' });

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
  [k, v] = lu('source');
  if (k) { if (SOURCES.includes(v)) etat.source = v; else refuse(k); }
  [k, v] = lu('piste'); // « piste » et non « morceau » : la page « Voir sa musique » garde son propre ?morceau= (le nom du fichier, j3-re)
  if (k) { if (MORCEAUX.includes(v)) { etat.morceau = v; if (!q.has('source')) etat.source = 'morceau'; } else refuse(k); } // un lien qui nomme une piste sans source veut ce morceau : il garde le dessus sur le micro par défaut
  [k, v] = lu('note');
  if (k) { const n = entier(v); if (n !== null && n >= NOTE_MIN && n <= NOTE_MAX) etat.note = n; else refuse(k); }
  [k, v] = lu('declencheur');
  if (k) { if (DECLENCHEURS.includes(v)) etat.declencheur = v; else refuse(k); }
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
  if (etat.source !== DEFAUTS.source || etat.morceau !== DEFAUTS.morceau) q.set('source', etat.source); // la piste sans source voudrait dire « ce morceau » : on écrit la source dès qu'une piste est écrite
  if (etat.morceau !== DEFAUTS.morceau) q.set('piste', etat.morceau);
  if (etat.note !== DEFAUTS.note) q.set('note', String(etat.note));
  if (etat.declencheur !== DEFAUTS.declencheur) q.set('declencheur', etat.declencheur);
  if (etat.palette !== DEFAUTS.palette) q.set('palette', etat.palette);
  if (etat.palette === 'perso') { q.set('c0', etat.c0.slice(1)); q.set('c1', etat.c1.slice(1)); }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// Les clés de l'adresse que Pavane possède. « mode » est partagée avec la page « Voir sa musique » (?mode=avance) : Pavane ne la touche que si sa valeur est une des siennes.
export const CLES_ETAT = Object.freeze(['mode', 'fond', 'corpus', 'trace', 'rythme', 'densite', 'palette', 'c0', 'c1', 'source', 'piste', 'note', 'declencheur']);
/** L'adresse d'une page qui a d'autres paramètres (?morceau=…, ?mode=avance) : ceux de Pavane sont remplacés, tous les autres sont gardés tels quels. */
export function fusionnerRecherche(rechercheActuelle, etat) {
  const q = new URLSearchParams(rechercheActuelle);
  for (const k of CLES_ETAT) { if (k === 'mode' && q.has('mode') && !MODES.includes(q.get('mode'))) continue; q.delete(k); }
  for (const [k, v] of new URLSearchParams(ecrireEtat(etat))) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : '';
}
