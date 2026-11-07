// musique-chladni-textes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// TOUS les textes de l'interface de musique-chladni.html, dans un seul fichier, séparé du code,
// pour les traduire ensuite : une langue = un objet de même forme que `fr`. Le code
// (musique-chladni-ui.js) ne contient aucune phrase. Les {noms} entre accolades sont remplacés.
export const TEXTES = {
  fr: {
    titrePage: 'Voir sa musique — La Livrée d\'Hermès',
    description: 'Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d\'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son.',
    ariane: 'Voir sa musique',
    h1: 'Voir sa musique',
    intro: 'Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d\'une plaque carrée, en tire une figure de Chladni, puis cherche, parmi les motifs de La Livrée d\'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n\'« exprime » pas un morceau.',
    discretion: 'Rien ne quitte votre navigateur : le fichier, le micro et l\'audio capturé sont analysés sur place et ne sont envoyés nulle part.',
    flash: 'Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit.',

    sonTitre: 'Le son',
    fichier: 'Choisir un fichier audio',
    micro: 'Micro',
    microStop: 'Couper le micro',
    essai: 'Musique d\'essai',
    arreter: 'Arrêter',
    onglet: 'Capturer l\'audio d\'un onglet',
    entree: 'Entrée audio',
    entreeDefaut: 'Entrée par défaut',
    entreeAide: 'Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici.',
    morceauxTitre: 'Les 7 morceaux fournis',
    morceau: 'Morceau {n} — {note}',
    notes: { j1: 'do dièse', j2: 'la', j3: 'ré', j4: 'mi', j5: 'sol', j6: 'si', j7: 'do' },
    mentionIA: 'Ces musiques sont composées avec l\'aide de l\'IA (« Musique composée avec l\'IA par MC Claude »), pour cette page.',
    sourceActive: 'Source : {source}',
    sources: { fichier: 'fichier « {nom} »', micro: 'micro', entree: 'entrée « {nom} »', onglet: 'audio d\'un onglet', essai: 'musique d\'essai', morceau: 'morceau {n}', aucune: 'aucune' },

    erreurMicroRefuse: 'Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l\'adresse), puis cliquez de nouveau sur « Micro ». Vous pouvez aussi choisir un fichier ou un morceau.',
    erreurMicroAbsent: 'Aucun micro n\'est disponible sur cet appareil.',
    erreurMicro: 'Le micro ne démarre pas : {message}',
    erreurOnglet: 'La capture d\'audio d\'un onglet n\'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari.',
    erreurOngletSansSon: 'L\'onglet choisi n\'a pas fourni de son. Recommencez et cochez « Partager l\'audio de l\'onglet ».',
    erreurFichier: 'Ce fichier ne peut pas être lu comme un son.',
    erreurAudio: 'Le son ne peut pas démarrer : {message}',
    silence: 'Silence : lancez un son.',
    microCoupe: 'La source s\'est arrêtée (périphérique débranché ou autorisation retirée).',

    formatTitre: 'Le motif',
    ordre: 'Ordre',
    ordreN: 'Ordre {n}',
    ordreBientot: 'Ordre {n} (seconde livraison)',
    rendu: 'Couleurs',
    bicolore: 'Bicolore',
    tricolore: 'Tricolore',
    renduAideBicolore: 'Encre et crème, les couleurs du site.',
    renduAideTricolore: 'Les trois gris du site : le plus sombre pour M, le gris intermédiaire pour O, le plus clair pour V.',
    paire: 'Paire de couleurs',

    vueTitre: 'La vue',
    vues: { signes: 'Signes', lignes: 'Lignes nodales', motif: 'Motif', fusion: 'Fusion' },
    vueAide: {
      signes: 'Le signe de la figure de Chladni : une couleur là où elle est positive, l\'autre là où elle est négative.',
      lignes: 'Les lignes nodales : là où la figure s\'annule, presque (le seuil se règle).',
      motif: 'Le motif de La Livrée d\'Hermès que le son choisit.',
      fusion: 'Le motif, puis les lignes, puis les signes, tous les 3,4 secondes.',
    },
    vueTricolore: 'En tricolore, le gris intermédiaire marque les lignes nodales ; le sombre et le clair, les deux signes.',

    pilotageTitre: 'Le son pilote',
    pilotage: { image: 'Le son définit l\'image', rythme: 'Le son définit le rythme', guide: 'Le son guide le chemin' },
    pilotageAide: {
      image: 'À chaque instant, le motif retenu est celui dont le spectre ressemble le plus à celui de la musique ; la figure se calcule directement du spectre.',
      rythme: 'Le motif suivant est le plus proche du précédent, et il change à chaque attaque de note.',
      guide: 'Le rythme décide quand le motif change ; le spectre de la musique décide vers où, parmi les 7 voisins du motif courant. Le dessin reste reconnaissable d\'un changement à l\'autre.',
    },
    pulsationTitre: 'Pulsation',
    pulsations: { attaque: 'À chaque attaque', temps: 'À chaque temps', quatre: 'Toutes les 4 pulsations' },
    pulsationAide: 'Par défaut, un changement à chaque attaque de note. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations.',
    pulsationDetectee: 'Pulsation détectée : {bpm} par minute.',
    pulsationAucune: 'Aucune pulsation régulière détectée pour l\'instant.',
    inspecter: 'Mode d\'inspection',
    inspecterAide: 'Affiche côte à côte le spectre de la musique et celui du motif choisi, un trait par cercle K, pour comprendre ce qui a déclenché le changement.',
    inspectionLegende: 'Un trait par cercle K, du grave à l\'aigu : la musique (encre) et le motif choisi (or).',

    fondTitre: 'Le fond',
    fondModes: { fixe: 'Fixe', grave: 'Le grave change le fond', cycle: 'Cycle régulier' },
    fondAide: {
      fixe: 'Un seul fond ; B2 par défaut, ou celui que vous choisissez.',
      grave: 'À chaque forte basse, la page passe au fond suivant de la collection, du plus proche au plus proche.',
      cycle: 'Un changement de fond toutes les {n} secondes.',
    },
    fondChoix: 'Fond',
    fondCycle: 'Secondes entre deux fonds',
    fondNonBicolore: 'Le fond s\'applique au motif en bicolore.',

    reglagesTitre: 'Réglages à la volée',
    sensibilite: 'Sensibilité des notes',
    lissage: 'Lissage',
    vitesse: 'Intervalle minimal entre deux changements (secondes)',
    seuil: 'Seuil des lignes nodales',
    calme: 'Réduire les changements rapides',
    calmeAide: 'Un fondu plus long et un intervalle plus grand. Activé d\'office si votre système demande moins d\'animations.',
    pente: 'Compenser la pente des graves',
    pause: 'Pause de l\'image',
    reprise: 'Reprendre',

    sceneTitre: 'La scène',
    scene: 'Mode scène (plein écran)',
    sceneAide: 'Plein écran sans interface ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir.',
    projection: 'Ouvrir une fenêtre de projection',
    projectionAide: 'Une fenêtre séparée, à glisser sur un second écran ou un projecteur ; elle reçoit la même image.',
    projectionBloquee: 'La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez.',
    pleinEcranIndispo: 'Le plein écran n\'est pas disponible dans ce navigateur.',
    veille: 'L\'écran reste allumé pendant la lecture quand le navigateur le permet.',

    enregTitre: 'Enregistrer',
    enreg: 'Enregistrer 15 s',
    enregEnCours: 'Enregistrement : {s} s',
    enregArreter: 'Arrêter l\'enregistrement',
    format: 'Format de la vidéo',
    formats: { '916': '9:16 (Reels, Shorts, TikTok)', '45': '4:5 (publication)', '11': '1:1 (carré)' },
    signature: 'Bandeau « {texte} » en bas de la vidéo',
    enregPret: 'Vidéo enregistrée : le téléchargement a commencé.',
    enregWebm: 'Votre navigateur n\'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4.',
    enregIndispo: 'L\'enregistrement vidéo n\'est pas disponible dans ce navigateur.',
    enregSansSource: 'Lancez d\'abord un son : on n\'enregistre pas le silence.',
    enregErreur: 'L\'enregistrement ne démarre pas : {message}',

    raccourcisTitre: 'Raccourcis clavier',
    raccourcis: [
      ['1 – 4', 'Vue : signes, lignes, motif, fusion'],
      ['Espace', 'Passer au mode de pilotage suivant (image, rythme, guide)'],
      ['P', 'Pause de l\'image'],
      ['F', 'Mode scène (plein écran)'],
      ['R', 'Enregistrer 15 s'],
      ['M', 'Bicolore / tricolore'],
    ],

    infoMotif: 'Motif {i} sur {n} · ressemblance {score}',
    infoFond: 'fond {fond}',
    infoImages: '{fps} images/s',
    infoPause: 'image en pause',

    voirAussiTitre: 'Voir aussi',
    voirAussi: [
      { href: 'galerie-bicolore.html', titre: 'Galerie bicolore', texte: 'Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export.' },
      { href: 'galerie-patterns-unifies.html', titre: 'Galerie tricolore', texte: 'Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage.' },
      { href: 'fonds-ecran.html', titre: 'Fonds d\'écran', texte: 'Des fonds textiles plein écran, réactifs au son ou en mode méditatif.' },
      { href: 'galerie-animations.html', titre: 'Galerie d\'animations', texte: 'Les animations des collections de fonds, à regarder et à télécharger en MP4.' },
      { href: 'chladni.html', titre: 'Chladni', texte: 'Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d\'une plaque.' },
      { href: 'fr/livre/', titre: 'Le livre', texte: 'La Livrée d\'Hermès en ligne, page par page, avec le PDF gratuit.' },
    ],
  },
};
export const LANGUE_DEFAUT = 'fr';

/** Un texte, avec ses {noms} remplacés. */
export function texte(cle, vars = {}, langue = LANGUE_DEFAUT) {
  const t = (TEXTES[langue] || TEXTES[LANGUE_DEFAUT])[cle];
  if (typeof t !== 'string') return t;
  return t.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
