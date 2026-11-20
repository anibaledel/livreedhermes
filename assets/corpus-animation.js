// corpus-animation.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le corpus binaire des animations (prompt 209) vu par l'animation : trois niveaux, un défaut, la liste ORDONNÉE des tuiles qui en découle.
// Pur : ni DOM, ni réseau, ni rendu — le moteur (animation-collection.js) et les contrôles (tools/check_animations_corpus.mjs) importent le même code.
//
// Le corpus (data/corpus-256.json, écrit par tools/corpus_256.mjs) donne trois listes, calculées :
//   256  toutes les grilles, dans l'ordre stable (paire de familles, puis hexagramme) ;
//   128  les paires {motif, négatif} : le négatif est la grille décalée de (6, 6), la même grille avec V et M échangés, et la lecture binaire
//        INVERSE les quatre triangles de chaque case ;
//   64   un représentant par classe de translation torique.
// L'animation ne lit aucune règle nouvelle : chaque tuile est une entrée du corpus, lue par assets/lecture-binaire.js.
//
// Niveau 256 : les 256 tuiles, dans l'ordre stable.
// Niveau 128 : l'unité est la paire. Chaque paire donne DEUX tuiles qui se suivent, le motif puis son négatif ; le fondu d'une tuile à la suivante
//              (le même que celui des autres animations) est la bascule : la vidéo est la prévisualisation, rien d'autre à encoder.
// Niveau 64  : un représentant par classe, dans l'ordre du corpus.

export const NIVEAUX_CORPUS = [64, 128, 256];
export const NIVEAU_DEFAUT = 128;
export const CLE_STOCKAGE = 'galerie-animations-corpus';

// liste fermée : tout ce qui n'est pas 64, 128 ou 256 est ignoré (null) — l'adresse et le stockage local ne décident de rien d'autre
export function niveauValide(valeur) {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  // « 128 » seulement : ni « 0128 », ni « 128.0 », ni « 1e2 », ni de blancs — la liste est fermée, à la lettre
  const n = typeof valeur === 'number' ? valeur : (typeof valeur === 'string' && /^[1-9]\d*$/.test(valeur) ? Number(valeur) : NaN);
  return NIVEAUX_CORPUS.includes(n) ? n : null;
}

// le niveau d'une vue : l'adresse d'abord, puis le stockage local (essayé : il peut refuser), puis le défaut
export function niveauDeLaVue(parametreUrl, stockage = null) {
  const u = niveauValide(parametreUrl);
  if (u !== null) return u;
  let s = null;
  try { s = niveauValide(stockage && stockage.getItem(CLE_STOCKAGE)); } catch { s = null; }
  return s !== null ? s : NIVEAU_DEFAUT;
}
export function retenirNiveau(niveau, stockage) {
  try { if (stockage && niveauValide(niveau) !== null) stockage.setItem(CLE_STOCKAGE, String(niveau)); } catch { /* page utilisable sans stockage */ }
}

// le nombre de tuiles d'un niveau (sans charger le corpus : la page l'annonce avant tout clic)
export const nombreDeTuiles = (niveau) => ({ 64: 64, 128: 256, 256: 256 })[niveau];

// la liste ordonnée des ids de tuiles d'un niveau, tirée du corpus (data/corpus-256.json)
export function listeDuCorpus(corpus, niveau) {
  const n = niveauValide(niveau);
  if (n === null) throw new Error(`corpus-animation.js : niveau « ${niveau} » inconnu (64, 128 ou 256)`);
  const N = corpus.niveaux;
  if (n === 256) return N['256'].slice();
  if (n === 64) return N['64'].map((c) => c.representant.id);
  return N['128'].flatMap((q) => [q.motif.id, q.negatif.id]);
}

// la grille d'une tuile : 12 lignes de 12 classes V / M / O, lue dans l'entrée du corpus
export function grilleDeLEntree(corpus, id) {
  const e = corpus.entrees.find((x) => x.id === id);
  if (!e) throw new Error(`corpus-animation.js : « ${id} » absent du corpus`);
  return e.tricolore.map((l) => [...l]);
}
export function indexDuCorpus(corpus) {
  return new Map(corpus.entrees.map((e) => [e.id, e]));
}
