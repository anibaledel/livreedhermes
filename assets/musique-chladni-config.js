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
    Object.freeze({ ordre: 12, actif: true, collections: Object.freeze(['tri', 'bi', 'ce']) }),
    Object.freeze({ ordre: 18, actif: true, collections: Object.freeze(['b1971128', 'b16012838', 'b3016090', 'f613', 'f18', 'fpilote', 'p18']) }),
    Object.freeze({ ordre: 30, actif: true, collections: Object.freeze(['p30']) }),
  ]),
  // Les ordres que l'INTERFACE propose. Tout se joue sur la cellule de 12 × 12 ; le code des ordres 18 et 30 et leurs données restent,
  // derrière ce réglage : les rouvrir = changer cette valeur en [12, 18, 30] (rien d'autre). Une adresse ?ordre=18 ou ?ordre=30 est sans effet :
  // la page ne lit pas ce paramètre et s'ouvre à l'ordre 12.
  ordresProposes: Object.freeze([12]),
  // Une collection désactivée ici disparaît de l'interface.
  collections: Object.freeze({ tri: true, bi: true, ce: true, b1971128: true, b16012838: true, b3016090: true, f613: true, f18: true, fpilote: true, p18: true, p30: true }),
  vues: Object.freeze({ signes: true, lignes: true, pavage: true }), // à l'ordre 12 le format bascule sur « Cellules »
  pilotage: Object.freeze({ image: true, rythme: true, chemin: true, octaves: true }), // « octaves » : option, hors du cycle de la barre d'espace ; départ : image
  pulsation: true,   // « à chaque attaque » (par défaut), « à chaque temps », « toutes les 4 pulsations »
  variantesDeCase: true, // les six fonds en bandes (B3x, BA33, BA50 : alias), rotation de 90°, collections bicolores des trois ordres ; B2 par défaut
  teinteSuitLeSon: true, // palette « son » proposée, non choisie par défaut (la page démarre en « crème »)
  couleursPerso: true,
  fenetreEssai: true,  // Validé / Essai
  pavage: 2,         // 2 × 2, d'office, par translation (jamais par miroir)

  // Options ajoutées après coup : chacune est PROPOSÉE (true) mais son réglage de départ reproduit le comportement d'avant
  // (figure du motif retenu). Mettre false la retire de l'interface sans toucher au code.
  options: Object.freeze({
    figureDuSon: true, // « Figure : du motif retenu / du son / les deux (écart) » ; départ : du motif retenu
    pourComprendre: true, // panneau replié « Pour comprendre » : la paire dégénérée (4, 0) et la parité comme produit de deux réseaux ; sans lien avec le son
    lectureEnCles: true, // panneau replié « Lecture en clés » (ordre 12 : clés de la note des axes dont la somme redonne le motif) ; affichage seul
    loiDeFrequence: true, // « racine » (départ : échelle compressée pour l'oreille) ou « plaque » (f = c·K, loi de la plaque réelle) ; c réglable
  }),

  entrees: Object.freeze({ fichier: true, micro: true, peripheriques: true, captureOnglet: true, musiqueEssai: true, morceaux: true }),

  enregistrement: Object.freeze({
    actif: true,
    dureesSecondes: Object.freeze([15]), // 30 et 60 s : prévues pour la version payante, pas encore offertes
    formats: Object.freeze(['916', '45', '11']),
    signature: true, // le bandeau « anibal-amiot.com », réglage visible, activé par défaut
    signatureTexte: 'anibal-amiot.com',
    ligneIA: "Musique composée avec l'IA par MC Claude.", // le même texte (avec son point) que le bloc « La semaine » ; seulement pour les morceaux fournis
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
    cPlaque: 31.85,       // Hz par unité de m² + n² (loi « plaque » : aluminium de 3 mm, 48 cm) ; réglable
    fenetreImageSecondes: 0, // mode « image » seulement : moyenne du spectre sur les N dernières secondes avant l'appariement (0 = aucune) ; mesure : docs/mesure-appariement.md
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
