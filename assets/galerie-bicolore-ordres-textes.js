// galerie-bicolore-ordres-textes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le fichier unique des textes de l'extension de la « Galerie bicolore » aux ordres 18 et 30
// (assets/galerie-bicolore-ordres.js). Français d'abord ; les autres langues viendront ici.
// Les titres des collections viennent de assets/musique-chladni-textes.js (une seule source).
export const TEXTES = Object.freeze({
  fr: Object.freeze({
    ordreGroupe: 'Ordre du motif',
    ordre: 'Ordre {n}',
    titre: { 18: 'Ordre 18 — {m} motifs bicolores en {c} collections', 30: 'Ordre 30 — {m} motifs bicolores' },
    intro: 'Chaque motif est une tuile de {g} × {g} cases, lue en quatre triangles par case et dessinée avec le fond en bandes B2 (état 1) ou le même fond tourné de 90° (état 0). Dans chaque collection, les motifs se suivent par proximité : chacun est suivi de son voisin le plus proche. Cliquez une tuile pour voir le pavage continu ; l\'adresse de la page, suivie de # et de l\'identifiant du motif, mène droit à lui.',
    section: '{titre} — {n} motifs',
    tuile: 'Motif {id}',
    chargement: 'Chargement de l\'ordre {n}…',
    erreur: 'Les données de l\'ordre {n} ne se chargent pas : {message}',
    paveTitre: 'Pavage du motif {id}',
    paveInfo: '{collection} · ordre {n} · tuile de {g} × {g} cases · pavage 2 × 2 par translation',
    fermer: 'Fermer',
    paveAlt: 'Pavage continu du motif {id}',
  }),
});
export const texte = (cle, vars = {}, lang = 'fr') => {
  const t = (TEXTES[lang] || TEXTES.fr)[cle];
  const s = typeof t === 'object' ? t[vars.n] : t;
  return String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
};
