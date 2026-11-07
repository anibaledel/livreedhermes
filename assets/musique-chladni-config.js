// musique-chladni-config.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// LE fichier de configuration de la page « Voir sa musique » (musique-chladni.html) et du
// moteur qu'une application reprendra. Tout est activé pour l'instant, rien n'est payant ni
// restreint : c'est ici que l'auteur choisira plus tard ce qui reste libre. Une fonction
// désactivée ici disparaît de l'interface sans que le code change.
//
// Les couleurs ne sont PAS ici : elles viennent de assets/couleurs.js.
export const CONFIG = Object.freeze({
  // Ordres du motif : 12 (grille 12 × 12), 18 (grille 36 × 36), 30 (grille 60 × 60). Pour chaque ordre,
  // ses collections (la première est celle par défaut). Les ordres 18 et 30 se chargent au premier
  // choix du format, pas au chargement de la page.
  ordres: Object.freeze([
    Object.freeze({ ordre: 12, actif: true, collections: Object.freeze(['tri', 'lis', 'bi']) }),
    Object.freeze({ ordre: 18, actif: true, collections: Object.freeze(['b1971128', 'b16012838', 'b3016090', 'f613', 'f18', 'fpilote', 'p18']) }),
    Object.freeze({ ordre: 30, actif: true, collections: Object.freeze(['p30']) }),
  ]),
  // Une collection désactivée ici disparaît de l'interface.
  collections: Object.freeze({ tri: true, lis: true, bi: true, b1971128: true, b16012838: true, b3016090: true, f613: true, f18: true, fpilote: true, p18: true, p30: true }),
  vues: Object.freeze({ signes: true, lignes: true, pavage: true }), // à l'ordre 12 le format bascule sur « Cellules »
  pilotage: Object.freeze({ image: true, rythme: true, chemin: true }),
  pulsation: true,   // « à chaque attaque » (par défaut), « à chaque temps », « toutes les 4 pulsations »
  variantesDeCase: true, // les six fonds en bandes (B3x, BA33, BA50 : alias), rotation de 90°, collections bicolores des trois ordres ; B2 par défaut
  teinteSuitLeSon: true, // désactivé par défaut
  couleursPerso: true,
  fenetreEssai: true,  // Validé / Essai
  pavage: 2,         // 2 × 2, d'office, par translation (jamais par miroir)

  entrees: Object.freeze({ fichier: true, micro: true, peripheriques: true, captureOnglet: true, musiqueEssai: true, morceaux: true }),

  enregistrement: Object.freeze({
    actif: true,
    dureesSecondes: Object.freeze([15]), // 30 et 60 s : prévues pour la version payante, pas encore offertes
    formats: Object.freeze(['916', '45', '11']),
    signature: true, // le bandeau « anibal-amiot.com », réglage visible, activé par défaut
    signatureTexte: 'anibal-amiot.com',
    ligneIA: "Musique composée avec l'IA par MC Claude", // seulement pour les morceaux fournis
  }),

  scene: Object.freeze({ pleinEcran: true, fenetreProjection: true, veilleEmpechee: true, masquerApresMs: 3000 }),

  // Réglages initiaux du moteur (assets/musique-chladni-moteur.js)
  moteur: Object.freeze({
    fref: 220,            // Hz à l'ordre 12 (110 Hz aux ordres 18 et 30) : f_K = fref · √K / 2
    imagesParSeconde: 30,
    lissage: 0.45,        // part du nouveau spectre dans le lissage (0 = figé, 1 = brut)
    seuilAttaques: 0.45,  // en écarts-types au-dessus de la moyenne du flux (plus bas : plus sensible)
    intervalleMinSecondes: 0.45, // entre deux attaques : réglable (au plus ~133 attaques par minute à 0,45 s)
    hysteresis: 0.07,
    tenueMinImages: 8,
    fonduSecondes: 0.3,
    penteDesGraves: true,
    teinteParImage: 3,    // la teinte qui suit le son : pente limitée à ±3° par image
    tuileFenetre: 360,    // côté de la tuile des fenêtres Validé / Essai
    tuilePleinEcran: 720, // côté de la tuile du plein écran et de l'enregistrement
  }),

  // Les 7 morceaux fournis (60 s chacun, compositions originales faites avec l'aide de l'IA)
  morceaux: Object.freeze([
    Object.freeze({ id: 'j1', fichier: 'assets/musiques-chladni/j1-do-diese.mp3' }),
    Object.freeze({ id: 'j2', fichier: 'assets/musiques-chladni/j2-la.mp3' }),
    Object.freeze({ id: 'j3', fichier: 'assets/musiques-chladni/j3-re.mp3' }),
    Object.freeze({ id: 'j4', fichier: 'assets/musiques-chladni/j4-mi.mp3' }),
    Object.freeze({ id: 'j5', fichier: 'assets/musiques-chladni/j5-sol.mp3' }),
    Object.freeze({ id: 'j6', fichier: 'assets/musiques-chladni/j6-si.mp3' }),
    Object.freeze({ id: 'j7', fichier: 'assets/musiques-chladni/j7-do.mp3' }),
  ]),
});
