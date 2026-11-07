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
  // Ordres du motif. 12 : le cœur de la page. 18 et 30 : second lot (la lecture binaire n'est
  // pas encore généralisée à n × n) — déclarés, jamais retirés.
  ordres: Object.freeze([
    Object.freeze({ ordre: 12, actif: true }),
    Object.freeze({ ordre: 18, actif: false, raison: 'seconde livraison' }),
    Object.freeze({ ordre: 30, actif: false, raison: 'seconde livraison' }),
  ]),
  rendus: Object.freeze({ bicolore: true, tricolore: true }),
  vues: Object.freeze({ signes: true, lignes: true, motif: true, fusion: true }), // « signes » : la vue par défaut
  pilotage: Object.freeze({ image: true, rythme: true, guide: true }),
  pulsation: true,   // « à chaque attaque » (par défaut), « à chaque temps », « toutes les 4 pulsations »
  inspection: true,  // le mode d'inspection : le spectre de la musique et celui du motif, côte à côte
  fonds: Object.freeze({ selecteur: true, defaut: 'B2', cycleSecondes: 8 }),

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
    fref: 220,            // Hz, f_K = fref · √K / 2
    resolutionFigure: 120, // côté du calcul de la figure ; réduit si la page n'atteint pas 30 images/s
    imagesParSeconde: 30,
    lissage: 0.45,        // part du nouveau spectre dans le lissage (0 = figé, 1 = brut)
    sensibilite: 1,       // détection des notes (1 = réglage de l'auteur)
    seuilLignes: 0.07,    // |F| < seuil : ligne nodale (0,03 à 0,12)
    hysteresis: 0.07,
    tenueMinImages: 8,
    fonduSecondes: 0.3,
    intervalleMinSecondes: 0.45,
    penteDesGraves: true,
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
