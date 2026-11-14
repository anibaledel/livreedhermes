// musique-chladni-textes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// TOUS les textes de l'interface de musique-chladni.html (« Voir sa musique »), dans un seul fichier,
// séparé du code, pour les traduire ensuite : une langue = un objet de même forme que `fr`. Le code
// (musique-chladni-ui.js) ne contient aucune phrase. Les {noms} entre accolades sont remplacés.
export const TEXTES = {
  fr: {
    titrePage: 'Voir sa musique — La Livrée d\'Hermès',
    description: 'Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d\'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son.',
    ariane: 'Voir sa musique',
    h1: 'Voir sa musique',
    intro: 'Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d\'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d\'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n\'« exprime » pas un morceau.',
    discretion: 'Rien ne quitte votre navigateur : le fichier, le micro et l\'audio capturé sont analysés sur place et ne sont envoyés nulle part.',
    flash: 'Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit.',

    // le son
    sonTitre: 'Le son',
    sonChoix: 'Son',
    morceau: 'Morceau fourni {n} — {note}',
    notes: { j1: 'do dièse', j2: 'la', j3: 'ré', j4: 'mi', j5: 'sol', j6: 'si', j7: 'do' },
    tonalites: { 'do dièse mineur': 'do dièse mineur', 'la mineur': 'la mineur', 'ré mineur': 'ré mineur', 'mi mineur': 'mi mineur', 'sol mineur': 'sol mineur', 'si mineur': 'si mineur', 'do mineur': 'do mineur' }, // la tonalité telle que semaine.json la donne (en français) → son nom dans la langue
    sourceFichier: 'Mon fichier audio…',
    sourceMicro: 'Microphone',
    sourceEssai: 'Musique d\'essai',
    sourceOnglet: 'Audio d\'un onglet',
    lecture: 'Lecture',
    pause: 'Pause',
    arreter: 'Arrêter',
    entree: 'Entrée audio',
    entreeDefaut: 'Entrée par défaut',
    entreeAide: 'Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici.',
    sensibilite: 'Seuil des attaques',
    sensibiliteAide: 'En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes.',
    intervalle: 'Intervalle minimal entre deux attaques (s)',
    intervalleAide: '0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide.',
    mentionIA: 'Les morceaux fournis sont composés avec l\'aide de l\'IA (« Musique composée avec l\'IA par MC Claude. »).',
    etatDepart: 'Appuyez sur Lecture. Les morceaux fournis sont composés avec l\'aide de l\'IA.',
    etatMorceau: 'Morceau fourni, composé avec l\'aide de l\'IA.',
    etatFichier: 'Fichier : {nom} (il reste dans votre navigateur).',
    etatMicro: 'Micro actif.',
    etatEntree: 'Entrée « {nom} » active.',
    etatOnglet: 'Audio d\'un onglet actif.',
    etatEssai: 'Musique d\'essai.',
    erreurMicroRefuse: 'Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l\'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau.',
    erreurMicroAbsent: 'Aucun micro n\'est disponible sur cet appareil.',
    erreurMicro: 'Le micro ne démarre pas : {message}',
    erreurOnglet: 'La capture d\'audio d\'un onglet n\'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari.',
    erreurOngletSansSon: 'L\'onglet choisi n\'a pas fourni de son. Recommencez et cochez « Partager l\'audio de l\'onglet ».',
    erreurFichier: 'Ce fichier ne peut pas être lu comme un son.',
    erreurAudio: 'Le son ne peut pas démarrer : {message}',
    erreurDonnees: 'Les données de la page ne se chargent pas : {message}',
    bandeManque: 'la bande {id} manque à la collection de fonds',
    microCoupe: 'La source s\'est arrêtée (périphérique débranché ou autorisation retirée).',
    silence: 'Silence : lancez un son.',

    // les deux fenêtres
    valide: 'Validé',
    valideTag: 'en cours',
    essai: 'Essai',
    essaiTag: 'aperçu',
    validerEssai: 'Valider l\'essai',
    annuler: 'Annuler',
    pleinEcran: 'Plein écran',
    quitterPleinEcran: 'Quitter le plein écran',
    fenetresAide: 'Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l\'essai, cliquez pour la garder, puis « Valider l\'essai ».',
    fenetreValide: 'Fenêtre validée',
    fenetreEssai: 'Fenêtre d\'essai',
    basculeValide: 'Validé',
    basculeEssai: 'Essai',
    pleinEcranIndispo: 'Le plein écran n\'est pas disponible dans ce navigateur.',
    pleinEcranRepli: 'Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme.',

    // les six en-têtes
    groupes: { mode: 'Pilotage du son', fmt: 'Format (ordre)', col: 'Collection', view: 'Vue', fond: 'Variante de case', pal: 'Couleurs' },
    modes: {
      image: ['Le son définit l\'image', 'À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique.'],
      rythme: ['Le son définit le rythme', 'Un pas dans la chaîne de proximité à chaque attaque de note.'],
      chemin: ['Le son guide le chemin', 'Le rythme décide quand, le spectre décide vers quel voisin.'],
      octaves: ['Le son suit l\'octave', 'À chaque attaque, un pas sur l\'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent.'],
    },
    vues: {
      signes: ['Signes', 'Les zones positives de la figure du motif.'],
      lignes: ['Lignes nodales', 'Les lignes où la figure du motif s\'annule.'],
      pavage: ['Cellules', 'Le motif lui-même, en pavage 2 × 2.'],
    },
    format: { titre: 'Ordre {n}', detail: 'Grille de {g} × {g} cases', bientot: 'Ordre {n} (seconde livraison)' },
    chargementOrdre: 'Chargement de l\'ordre {n}…',
    ordreIndisponible: 'Les données de l\'ordre {n} ne se chargent pas : {message}',
    collections: {
      tri: ['Tricolore — motifs unifiés', '{n} motifs (grilles 12 × 12 distinctes)'],
      bi: ['Bicolore — motifs unifiés', '{n} motifs (deux miroirs, lisibles par la règle du 3 octobre)'],
      ce: ['Bicolore — symétrie centrale', '{n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre)'],
      b1971128: ['Bloc 1971128', '{n} motifs'],
      b16012838: ['Bloc 16012838', '{n} motifs'],
      b3016090: ['Bloc 3016090', '{n} motifs'],
      f613: ['Famille 613', '{n} motifs'],
      f18: ['Famille 18', '{n} motifs'],
      fpilote: ['Famille pilote', '{n} motifs'],
      p18: ['Croix 1·2', '{n} motifs'],
      p30: ['Croix 1·2', '{n} motifs'],
    },
    fond: 'Bandes {id}',
    fondAide: 'Une case porte quatre triangles ; chacun est dessiné avec l\'état 1 du fond, ou avec l\'état 0 : le même fond tourné de 90°.',
    fondSeulementBicolore: 'La variante de case ne s\'applique qu\'à la collection bicolore.',
    palettes: {
      creme: ['Encre et crème', 'Les couleurs du site.'],
      monochrome: ['Gris et blanc', 'Le monochrome du site.'],
      perso: ['Mes couleurs', 'Choisissez le motif et le fond.'],
      son: ['La teinte suit le son', 'La teinte glisse lentement avec la brillance du son (désactivée par défaut).'],
    },
    persoMotif: 'Motif',
    persoFond: 'Fond',
    tricoloreAide: 'En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème).',
    legendeFenetre: '{mode} · {collection} · {vue}{fond} · {palette}',

    // réglages
    reglagesTitre: 'Réglages à la volée',
    lissage: 'Lissage',
    pulsationTitre: 'Pulsation',
    pulsations: { attaque: 'À chaque attaque', temps: 'À chaque temps', quatre: 'Toutes les 4 pulsations' },
    pulsationAide: 'Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations.',
    pulsationDetectee: 'Pulsation détectée : {bpm} par minute.',
    pulsationAucune: 'Aucune pulsation régulière détectée pour l\'instant.',
    calme: 'Réduire les changements rapides',
    calmeAide: 'Un fondu plus long et une tenue plus grande. Activé d\'office si votre système demande moins d\'animations.',
    pente: 'Compenser la pente des graves',
    pauseImage: 'Pause de l\'image',
    optionsTitre: 'Options',
    comprendreTitre: 'Pour comprendre',
    comprendreAide: 'Deux vues pédagogiques, sans lien avec le son.',
    paireTitre: 'Le mode (4, 0) et sa paire dégénérée',
    paireAide: 'Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale.',
    paireMelange: 'Mélange s : cos(4πx/a) + s · cos(4πy/a)',
    paireAlt: 'Figure du mode (4, 0) mélangé à sa paire dégénérée',
    moireTitre: 'La parité comme superposition de deux réseaux de ±1',
    moireAide: 'Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s\'accordent et −1 là où ils diffèrent : c\'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l\'un des deux, il apparaît un moiré.',
    moireAngle: 'Rotation du second réseau (degrés)',
    moirePeriode: 'Période du second réseau (en % de celle du premier)',
    moireA: 'Réseau A', moireB: 'Réseau B', moireProduit: 'Produit A × B (XNOR)',
    moireAlt: 'Produit de deux réseaux de ±1',
    clesTitre: 'Lecture en clés',
    clesAide: 'Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d\'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n\'affirme aucun lien entre une clé et une fréquence.',
    clesNatures: { 'D+': 'diagonale x + y', 'D-': 'diagonale y − x', H: 'horizontale', V: 'verticale' },
    clesFigure: { figure: 'Figure du motif', V: 'Classe V (violet)', O: 'Classe O (orange)', M: 'Classe M (magenta)' },
    clesActives: '{n} clés actives : {liste}',
    clesAucune: 'aucune clé (figure vide)',
    clesComplement: ' (au complément près)',
    clesHors: 'Cette figure n\'est pas la somme de clés : elle sort de l\'espace qu\'elles engendrent.',
    clesMotif: 'Motif {i} sur {n}, collection {collection}.',
    clesOrdre12: 'La lecture en clés ne porte que sur l\'ordre 12.',
    loiTitre: 'Loi de fréquence des cercles',
    loiChoix: { racine: 'Échelle compressée pour l\'oreille', plaque: 'Loi de la plaque réelle' },
    loiAide: 'Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l\'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d\'attaques et le suivi de teinte ne changent pas.',
    loiC: 'c (Hz par unité de m² + n²)',
    figureTitre: 'Figure (vues Signes et Lignes)',
    figureChoix: { motif: 'Du motif retenu', son: 'Du son', ecart: 'Les deux (écart)' },
    figureAide: 'Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l\'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro.',

    // scène, enregistrement
    sceneTitre: 'La scène',
    projection: 'Ouvrir une fenêtre de projection',
    sceneAide: 'Le plein écran lance toujours la fenêtre validée, jamais l\'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur.',
    projectionBloquee: 'La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez.',
    veille: 'L\'écran reste allumé pendant la lecture quand le navigateur le permet.',
    enregTitre: 'Enregistrer',
    enreg: 'Enregistrer 15 s',
    enregEnCours: 'Enregistrement : {s} s',
    format916: '9:16 (Reels, Shorts, TikTok)',
    format45: '4:5 (publication)',
    format11: '1:1 (carré)',
    formatVideo: 'Format de la vidéo',
    signature: 'Bandeau « {texte} » en bas de la vidéo',
    enregPret: 'Vidéo enregistrée : le téléchargement a commencé.',
    enregWebm: 'Votre navigateur n\'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4.',
    enregAac: 'Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication).',
    enregOpusAvant: 'Ce navigateur écrit l\'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC).',
    enregOpus: 'Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4.',
    enregIndispo: 'L\'enregistrement vidéo n\'est pas disponible dans ce navigateur.',
    enregSansSource: 'Lancez d\'abord un son : on n\'enregistre pas le silence.',
    enregErreur: 'L\'enregistrement ne démarre pas : {message}',

    raccourcisTitre: 'Raccourcis clavier',
    raccourcis: [
      ['1 – 3', 'Vue de l\'essai : signes, lignes nodales, cellules'],
      ['Espace', 'Mode de pilotage suivant (essai)'],
      ['P', 'Pause de l\'image'],
      ['V', 'Valider l\'essai'],
      ['F', 'Plein écran (fenêtre validée)'],
      ['R', 'Enregistrer 15 s'],
    ],

    infoMotif: 'Motif {i} sur {n}',
    infoImages: '{fps} images/s',
    infoResolution: 'résolution réduite',

    // le bloc « La semaine »
    semaineTitre: 'La semaine',
    semaineMention: 'Musique composée avec l\'IA par MC Claude.',
    semaineTiers: 'Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n\'est chargé avant.',
    jourTitre: 'Jour {n} — {tonalite}',
    datePub: 'Publié le {date}',
    bientot: 'Bientôt',
    lire: 'Lire la vidéo du jour {n}, {tonalite}',
    lireTiktok: 'Lire ici (TikTok)',
    voirYoutube: 'Voir sur YouTube',
    voirTiktok: 'Voir sur TikTok',
    afficheAlt: 'Affiche du jour {n} — {tonalite}',
    lecteurTitre: 'Vidéo du jour {n}',
    voirAussiTitre: 'Voir aussi',
    voirAussi: [
      { href: '/galerie-bicolore.html', titre: 'Galerie bicolore', texte: 'Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export.' },
      { href: '/galerie-patterns-unifies.html', titre: 'Galerie tricolore', texte: 'Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage.' },
      { href: '/fonds-ecran.html', titre: 'Fonds d\'écran', texte: 'Des fonds textiles plein écran, réactifs au son ou en mode méditatif.' },
      { href: '/galerie-animations.html', titre: 'Galerie d\'animations', texte: 'Les animations des collections de fonds, à regarder et à télécharger en MP4.' },
      { href: '/chladni.html', titre: 'Chladni', texte: 'Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d\'une plaque.' },
      { href: '/fr/livre/', titre: 'Le livre', texte: 'La Livrée d\'Hermès en ligne, page par page, avec le PDF gratuit.' },
    ],
  },
  // @langues:start — engendré par scripts/build-musique-textes.mjs depuis data/musique-chladni/traductions/<langue>.json, ne pas éditer ici
  en: {
    "titrePage": "See your music — La Livrée d'Hermès",
    "description": "See your music: choose a track, a file or the microphone and watch the Chladni figure the sound draws, then the La Livrée d'Hermès pattern that resembles it most. Record 15 seconds with the sound.",
    "ariane": "See your music",
    "h1": "See your music",
    "intro": "Every piece of music has a signature: the way its energy is spread across frequencies. Choose a track, a file or the microphone: the page measures that energy at the frequencies of each circle of modes of a square plate, then looks, among the unified patterns of La Livrée d'Hermès, for the one whose spectrum resembles it most. The choice rests on the resemblance of two spectra, not on a musical law: a pattern does not “express” a piece.",
    "discretion": "Nothing leaves your browser: the file, the microphone and the captured audio are analysed on the spot and sent nowhere.",
    "flash": "Warning: the images can change fast and flicker. The “reduce rapid changes” setting slows them down.",
    "sonTitre": "The sound",
    "sonChoix": "Sound",
    "morceau": "Provided track {n} — {note}",
    "notes": {
      "j1": "C♯",
      "j2": "A",
      "j3": "D",
      "j4": "E",
      "j5": "G",
      "j6": "B",
      "j7": "C"
    },
    "tonalites": {
      "do dièse mineur": "C♯ minor",
      "la mineur": "A minor",
      "ré mineur": "D minor",
      "mi mineur": "E minor",
      "sol mineur": "G minor",
      "si mineur": "B minor",
      "do mineur": "C minor"
    },
    "sourceFichier": "My audio file…",
    "sourceMicro": "Microphone",
    "sourceEssai": "Test music",
    "sourceOnglet": "Audio of a tab",
    "lecture": "Play",
    "pause": "Pause",
    "arreter": "Stop",
    "entree": "Audio input",
    "entreeDefaut": "Default input",
    "entreeAide": "Mixing desk, sound card: plug it in, allow the microphone, then choose it here.",
    "sensibilite": "Attack threshold",
    "sensibiliteAide": "In standard deviations above the mean: lower means more sensitive to note changes.",
    "intervalle": "Minimum interval between two attacks (s)",
    "intervalleAide": "0.45 s by default: at most about 133 attacks per minute. Lower it for a fast tempo.",
    "mentionIA": "The provided tracks are composed with the help of AI (“Music composed with AI by MC Claude.”).",
    "etatDepart": "Press Play. The provided tracks are composed with the help of AI.",
    "etatMorceau": "Provided track, composed with the help of AI.",
    "etatFichier": "File: {nom} (it stays in your browser).",
    "etatMicro": "Microphone on.",
    "etatEntree": "Input “{nom}” on.",
    "etatOnglet": "Tab audio on.",
    "etatEssai": "Test music.",
    "erreurMicroRefuse": "The microphone is blocked. Allow it in the site settings (the padlock, left of the address), then click Play again. You can also choose a file or a track.",
    "erreurMicroAbsent": "No microphone is available on this device.",
    "erreurMicro": "The microphone does not start: {message}",
    "erreurOnglet": "Capturing a tab’s audio is not possible here. It needs a recent desktop browser (Chrome, Edge); it is missing on mobile and on Safari.",
    "erreurOngletSansSon": "The chosen tab provided no sound. Try again and tick “Share tab audio”.",
    "erreurFichier": "This file cannot be read as a sound.",
    "erreurAudio": "The sound cannot start: {message}",
    "erreurDonnees": "The page data does not load: {message}",
    "bandeManque": "band {id} is missing from the collection of grounds",
    "microCoupe": "The source stopped (device unplugged or permission withdrawn).",
    "silence": "Silence: start a sound.",
    "valide": "Validated",
    "valideTag": "current",
    "essai": "Trial",
    "essaiTag": "preview",
    "validerEssai": "Validate the trial",
    "annuler": "Cancel",
    "pleinEcran": "Full screen",
    "quitterPleinEcran": "Exit full screen",
    "fenetresAide": "Dark ground: validated. Golden frame: on trial. Hover an option to see it in the trial, click to keep it, then “Validate the trial”.",
    "fenetreValide": "Validated window",
    "fenetreEssai": "Trial window",
    "basculeValide": "Validated",
    "basculeEssai": "Trial",
    "pleinEcranIndispo": "Full screen is not available in this browser.",
    "pleinEcranRepli": "This browser offers no native full screen for this element: the stage covers the window. Esc or the button closes it.",
    "groupes": {
      "mode": "Sound control",
      "fmt": "Format (order)",
      "col": "Collection",
      "view": "View",
      "fond": "Cell variant",
      "pal": "Colours"
    },
    "modes": {
      "image": [
        "Sound defines the image",
        "At every moment, the pattern whose spectrum most resembles that of the music."
      ],
      "rythme": [
        "Sound defines the rhythm",
        "One step along the proximity chain at each note attack."
      ],
      "chemin": [
        "Sound guides the path",
        "The rhythm decides when, the spectrum decides which neighbour."
      ],
      "octaves": [
        "Sound follows the octave",
        "At each attack, one step along the orbit of the dominant note: circle K, then its octave 4K, then 16K…, when those circles exist."
      ]
    },
    "vues": {
      "signes": [
        "Signs",
        "The positive zones of the pattern’s figure."
      ],
      "lignes": [
        "Nodal lines",
        "The lines where the pattern’s figure vanishes."
      ],
      "pavage": [
        "Cells",
        "The pattern itself, as a 2 × 2 tiling."
      ]
    },
    "format": {
      "titre": "Order {n}",
      "detail": "Grid of {g} × {g} cells",
      "bientot": "Order {n} (second delivery)"
    },
    "chargementOrdre": "Loading order {n}…",
    "ordreIndisponible": "The data of order {n} does not load: {message}",
    "collections": {
      "tri": [
        "Three-colour — unified patterns",
        "{n} patterns (distinct 12 × 12 grids)"
      ],
      "bi": [
        "Two-colour — unified patterns",
        "{n} patterns (two mirrors, readable by the rule of 3 October)"
      ],
      "ce": [
        "Two-colour — central symmetry",
        "{n} patterns (180° central symmetry alone, readable by the rule of 3 October)"
      ],
      "b1971128": [
        "Block 1971128",
        "{n} patterns"
      ],
      "b16012838": [
        "Block 16012838",
        "{n} patterns"
      ],
      "b3016090": [
        "Block 3016090",
        "{n} patterns"
      ],
      "f613": [
        "Family 613",
        "{n} patterns"
      ],
      "f18": [
        "Family 18",
        "{n} patterns"
      ],
      "fpilote": [
        "Pilot family",
        "{n} patterns"
      ],
      "p18": [
        "Cross 1·2",
        "{n} patterns"
      ],
      "p30": [
        "Cross 1·2",
        "{n} patterns"
      ]
    },
    "fond": "Bands {id}",
    "fondAide": "A cell carries four triangles; each is drawn with state 1 of the ground, or with state 0: the same ground turned by 90°.",
    "fondSeulementBicolore": "The cell variant applies only to the two-colour collection.",
    "palettes": {
      "creme": [
        "Ink and cream",
        "The colours of the site."
      ],
      "monochrome": [
        "Grey and white",
        "The monochrome of the site."
      ],
      "perso": [
        "My colours",
        "Choose the pattern and the ground."
      ],
      "son": [
        "Hue follows the sound",
        "The hue drifts slowly with the brightness of the sound (off by default)."
      ]
    },
    "persoMotif": "Pattern",
    "persoFond": "Ground",
    "tricoloreAide": "In three-colour: V the darkest (ink), O mid grey, M the lightest (cream).",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "Live settings",
    "lissage": "Smoothing",
    "pulsationTitre": "Pulse",
    "pulsations": {
      "attaque": "At every attack",
      "temps": "At every beat",
      "quatre": "Every 4 beats"
    },
    "pulsationAide": "By default, a change at every attack. When a regular pulse is detected, you can change at every beat or every 4 beats.",
    "pulsationDetectee": "Pulse detected: {bpm} per minute.",
    "pulsationAucune": "No regular pulse detected so far.",
    "calme": "Reduce rapid changes",
    "calmeAide": "A longer fade and a longer hold. On by default if your system asks for less animation.",
    "pente": "Compensate for the bass slope",
    "pauseImage": "Freeze the image",
    "optionsTitre": "Options",
    "comprendreTitre": "To understand",
    "comprendreAide": "Two teaching views, unrelated to the sound.",
    "paireTitre": "The (4, 0) mode and its degenerate pair",
    "paireAide": "On a square plate, the (4, 0) and (0, 4) modes have the same frequency: any combination is also a mode of that frequency. The slider goes from cos(4πx/a) + cos(4πy/a) (right) to cos(4πx/a) − cos(4πy/a) (left); in the middle only cos(4πx/a) remains, vertical lines. Light and dark zones: opposite signs; line: nodal line.",
    "paireMelange": "Mix s: cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "Figure of the (4, 0) mode mixed with its degenerate pair",
    "moireTitre": "Parity as the superposition of two ±1 lattices",
    "moireAide": "Each lattice is a checkerboard: the parity (−1)^(i + j) of cell (i, j). Their product is +1 where the two agree and −1 where they differ: it is the XNOR of the bits, like two crossed polarisers. Shifting or slightly turning one of the two produces a moiré.",
    "moireAngle": "Rotation of the second lattice (degrees)",
    "moirePeriode": "Period of the second lattice (in % of the first)",
    "moireA": "Lattice A",
    "moireB": "Lattice B",
    "moireProduit": "Product A × B (XNOR)",
    "moireAlt": "Product of two ±1 lattices",
    "clesTitre": "Reading in keys",
    "clesAide": "Display only: the keys of the axes note (72 de-duplicated keys, parity counted from the corner cell, rank 70) whose sum gives back the figure of the chosen pattern, when it exists. The page asserts no link between a key and a frequency.",
    "clesNatures": {
      "D+": "diagonal x + y",
      "D-": "diagonal y − x",
      "H": "horizontal",
      "V": "vertical"
    },
    "clesFigure": {
      "figure": "Pattern figure",
      "V": "Class V (violet)",
      "O": "Class O (orange)",
      "M": "Class M (magenta)"
    },
    "clesActives": "{n} active keys: {liste}",
    "clesAucune": "no key (empty figure)",
    "clesComplement": " (up to the complement)",
    "clesHors": "This figure is not a sum of keys: it lies outside the space they generate.",
    "clesMotif": "Pattern {i} of {n}, collection {collection}.",
    "clesOrdre12": "Reading in keys applies only to order 12.",
    "loiTitre": "Frequency law of the circles",
    "loiChoix": {
      "racine": "Scale compressed for the ear",
      "plaque": "Law of the real plate"
    },
    "loiAide": "Compressed scale: f = reference frequency × √K / 2 (starting setting). Plate law: f = c × K, like a real plate (3 mm aluminium, 48 cm: c = 31.85 Hz). At order 12, from 32 to 2,293 Hz; circles above 0.9 × the Nyquist frequency are ignored, as before. The attack detector and the hue tracking do not change.",
    "loiC": "c (Hz per unit of m² + n²)",
    "figureTitre": "Figure (Signs and Lines views)",
    "figureChoix": {
      "motif": "Of the chosen pattern",
      "son": "Of the sound",
      "ecart": "Both (difference)"
    },
    "figureAide": "Of the chosen pattern: the Chladni figure of the chosen pattern (starting setting). Of the sound: the sum of the waves of each circle, weighted by the energy the sound puts there, without going through a pattern. Both: the places where these two figures differ. The sound does not provide phases: they are set to zero.",
    "sceneTitre": "The stage",
    "projection": "Open a projection window",
    "sceneAide": "Full screen always launches the validated window, never the trial; the controls and the cursor hide after 3 seconds. Esc to return. The projection window is separate: drag it to a second screen or a projector.",
    "projectionBloquee": "The projection window was blocked by the browser. Allow pop-ups for this site, then try again.",
    "veille": "The screen stays on during playback when the browser allows it.",
    "enregTitre": "Record",
    "enreg": "Record 15 s",
    "enregEnCours": "Recording: {s} s",
    "format916": "9:16 (Reels, Shorts, TikTok)",
    "format45": "4:5 (post)",
    "format11": "1:1 (square)",
    "formatVideo": "Video format",
    "signature": "“{texte}” banner at the bottom of the video",
    "enregPret": "Video recorded: the download has started.",
    "enregWebm": "Your browser does not write MP4: the video is in WebM format. To convert it to MP4 (Instagram, TikTok), run it through a converter or ffmpeg: ffmpeg -i file.webm file.mp4.",
    "enregAac": "AAC audio in the MP4: plays everywhere (iPhone, QuickTime, publishing apps).",
    "enregOpusAvant": "This browser writes the MP4’s audio as Opus: it may not play on iPhone, QuickTime or some publishing apps (recent desktop Chrome: AAC).",
    "enregOpus": "Opus audio: may not play on iPhone, QuickTime or some publishing apps. For an AAC track: ffmpeg -i file.mp4 -c:v copy -c:a aac output.mp4.",
    "enregIndispo": "Video recording is not available in this browser.",
    "enregSansSource": "Start a sound first: silence is not recorded.",
    "enregErreur": "The recording does not start: {message}",
    "raccourcisTitre": "Keyboard shortcuts",
    "raccourcis": [
      [
        "1 – 3",
        "Trial view: signs, nodal lines, cells"
      ],
      [
        "Space",
        "Next control mode (trial)"
      ],
      [
        "P",
        "Freeze the image"
      ],
      [
        "V",
        "Validate the trial"
      ],
      [
        "F",
        "Full screen (validated window)"
      ],
      [
        "R",
        "Record 15 s"
      ]
    ],
    "infoMotif": "Pattern {i} of {n}",
    "infoImages": "{fps} frames/s",
    "infoResolution": "reduced resolution",
    "semaineTitre": "The week",
    "semaineMention": "Music composed with AI by MC Claude.",
    "semaineTiers": "A click on a poster loads the YouTube or TikTok player: a third-party service, which then receives your visit. Nothing is loaded before.",
    "jourTitre": "Day {n} — {tonalite}",
    "datePub": "Published on {date}",
    "bientot": "Soon",
    "lire": "Play the video of day {n}, {tonalite}",
    "lireTiktok": "Play here (TikTok)",
    "voirYoutube": "Watch on YouTube",
    "voirTiktok": "Watch on TikTok",
    "afficheAlt": "Poster of day {n} — {tonalite}",
    "lecteurTitre": "Video of day {n}",
    "voirAussiTitre": "See also",
    "voirAussi": [
      {
        "href": "/en/two-colour-gallery/",
        "titre": "Two-colour gallery",
        "texte": "The two-colour patterns generated by the axes, closed on the cube: grain, tiling, export."
      },
      {
        "href": "/en/three-colour-gallery/",
        "titre": "Three-colour gallery",
        "texte": "The unified patterns, generated by mixing hues: select a pattern to see its tiling."
      },
      {
        "href": "/en/wallpapers/",
        "titre": "Wallpapers",
        "texte": "Full-screen textile wallpapers, reacting to sound or in a meditative mode."
      },
      {
        "href": "/en/animations/",
        "titre": "Animations gallery",
        "texte": "The animations of the ground collections, to watch and to download as MP4."
      },
      {
        "href": "/en/chladni/",
        "titre": "Chladni",
        "texte": "Figures, scales and frequencies: the page that links the vocabulary of the patterns to the modes of a plate."
      },
      {
        "href": "/en/book/",
        "titre": "The book",
        "texte": "La Livrée d'Hermès online, page by page, with the free PDF."
      }
    ]
  },
  es: {
    "titrePage": "Ver tu música — La Livrée d'Hermès",
    "description": "Ver tu música: elige una pieza, un archivo o el micrófono y mira la figura de Chladni que dibuja el sonido, y después el motivo de La Livrée d'Hermès que más se le parece. Graba 15 segundos con el sonido.",
    "ariane": "Ver tu música",
    "h1": "Ver tu música",
    "intro": "Cada música tiene una firma: la manera en que su energía se reparte entre las frecuencias. Elige una pieza, un archivo o el micrófono: la página mide esa energía en las frecuencias de cada círculo de modos de una placa cuadrada y busca, entre los motivos unificados de La Livrée d'Hermès, aquel cuyo espectro más se le parece. La elección se basa en el parecido de dos espectros, no en una ley musical: un motivo no «expresa» una pieza.",
    "discretion": "Nada sale de tu navegador: el archivo, el micrófono y el audio capturado se analizan en el propio equipo y no se envían a ninguna parte.",
    "flash": "Atención: las imágenes pueden cambiar rápido y parpadear. El ajuste «reducir los cambios rápidos» las ralentiza.",
    "sonTitre": "El sonido",
    "sonChoix": "Sonido",
    "morceau": "Pieza facilitada {n} — {note}",
    "notes": {
      "j1": "do sostenido",
      "j2": "la",
      "j3": "re",
      "j4": "mi",
      "j5": "sol",
      "j6": "si",
      "j7": "do"
    },
    "tonalites": {
      "do dièse mineur": "do sostenido menor",
      "la mineur": "la menor",
      "ré mineur": "re menor",
      "mi mineur": "mi menor",
      "sol mineur": "sol menor",
      "si mineur": "si menor",
      "do mineur": "do menor"
    },
    "sourceFichier": "Mi archivo de audio…",
    "sourceMicro": "Micrófono",
    "sourceEssai": "Música de prueba",
    "sourceOnglet": "Audio de una pestaña",
    "lecture": "Reproducir",
    "pause": "Pausa",
    "arreter": "Detener",
    "entree": "Entrada de audio",
    "entreeDefaut": "Entrada predeterminada",
    "entreeAide": "Mesa de mezclas, tarjeta de sonido: conéctala, autoriza el micrófono y elígela aquí.",
    "sensibilite": "Umbral de ataques",
    "sensibiliteAide": "En desviaciones típicas por encima de la media: más bajo, más sensible a los cambios de nota.",
    "intervalle": "Intervalo mínimo entre dos ataques (s)",
    "intervalleAide": "0,45 s por defecto: como máximo unos 133 ataques por minuto. Bájalo para un tempo rápido.",
    "mentionIA": "Las piezas facilitadas están compuestas con ayuda de la IA («Música compuesta con IA por MC Claude.»).",
    "etatDepart": "Pulsa Reproducir. Las piezas facilitadas están compuestas con ayuda de la IA.",
    "etatMorceau": "Pieza facilitada, compuesta con ayuda de la IA.",
    "etatFichier": "Archivo: {nom} (se queda en tu navegador).",
    "etatMicro": "Micrófono activo.",
    "etatEntree": "Entrada «{nom}» activa.",
    "etatOnglet": "Audio de una pestaña activo.",
    "etatEssai": "Música de prueba.",
    "erreurMicroRefuse": "El micrófono está bloqueado. Autorízalo en los ajustes del sitio (el candado, a la izquierda de la dirección) y vuelve a pulsar Reproducir. También puedes elegir un archivo o una pieza.",
    "erreurMicroAbsent": "No hay ningún micrófono disponible en este dispositivo.",
    "erreurMicro": "El micrófono no se inicia: {message}",
    "erreurOnglet": "Aquí no es posible capturar el audio de una pestaña. Requiere un navegador de escritorio reciente (Chrome, Edge); no existe en móvil ni en Safari.",
    "erreurOngletSansSon": "La pestaña elegida no ha proporcionado sonido. Vuelve a empezar y marca «Compartir el audio de la pestaña».",
    "erreurFichier": "Este archivo no se puede leer como un sonido.",
    "erreurAudio": "El sonido no puede iniciarse: {message}",
    "erreurDonnees": "Los datos de la página no se cargan: {message}",
    "bandeManque": "falta la banda {id} en la colección de fondos",
    "microCoupe": "La fuente se ha detenido (dispositivo desconectado o permiso retirado).",
    "silence": "Silencio: inicia un sonido.",
    "valide": "Validada",
    "valideTag": "en curso",
    "essai": "Prueba",
    "essaiTag": "vista previa",
    "validerEssai": "Validar la prueba",
    "annuler": "Cancelar",
    "pleinEcran": "Pantalla completa",
    "quitterPleinEcran": "Salir de la pantalla completa",
    "fenetresAide": "Fondo oscuro: validada. Marco dorado: en prueba. Pasa el cursor por una opción para verla en la prueba, haz clic para conservarla y después «Validar la prueba».",
    "fenetreValide": "Ventana validada",
    "fenetreEssai": "Ventana de prueba",
    "basculeValide": "Validada",
    "basculeEssai": "Prueba",
    "pleinEcranIndispo": "La pantalla completa no está disponible en este navegador.",
    "pleinEcranRepli": "Este navegador no ofrece pantalla completa nativa para este elemento: la escena cubre la ventana. Esc o el botón la cierra.",
    "groupes": {
      "mode": "Control del sonido",
      "fmt": "Formato (orden)",
      "col": "Colección",
      "view": "Vista",
      "fond": "Variante de casilla",
      "pal": "Colores"
    },
    "modes": {
      "image": [
        "El sonido define la imagen",
        "En cada instante, el motivo cuyo espectro más se parece al de la música."
      ],
      "rythme": [
        "El sonido define el ritmo",
        "Un paso en la cadena de proximidad en cada ataque de nota."
      ],
      "chemin": [
        "El sonido guía el camino",
        "El ritmo decide cuándo, el espectro decide hacia qué vecino."
      ],
      "octaves": [
        "El sonido sigue la octava",
        "En cada ataque, un paso por la órbita de la nota dominante: el círculo K, luego su octava 4K, luego 16K…, cuando esos círculos existen."
      ]
    },
    "vues": {
      "signes": [
        "Signos",
        "Las zonas positivas de la figura del motivo."
      ],
      "lignes": [
        "Líneas nodales",
        "Las líneas donde la figura del motivo se anula."
      ],
      "pavage": [
        "Celdas",
        "El propio motivo, en pavimentación 2 × 2."
      ]
    },
    "format": {
      "titre": "Orden {n}",
      "detail": "Cuadrícula de {g} × {g} casillas",
      "bientot": "Orden {n} (segunda entrega)"
    },
    "chargementOrdre": "Cargando el orden {n}…",
    "ordreIndisponible": "Los datos del orden {n} no se cargan: {message}",
    "collections": {
      "tri": [
        "Tricolor — motivos unificados",
        "{n} motivos (cuadrículas 12 × 12 distintas)"
      ],
      "bi": [
        "Bicolor — motivos unificados",
        "{n} motivos (dos espejos, legibles por la regla del 3 de octubre)"
      ],
      "ce": [
        "Bicolor — simetría central",
        "{n} motivos (solo simetría central de 180°, legibles por la regla del 3 de octubre)"
      ],
      "b1971128": [
        "Bloque 1971128",
        "{n} motivos"
      ],
      "b16012838": [
        "Bloque 16012838",
        "{n} motivos"
      ],
      "b3016090": [
        "Bloque 3016090",
        "{n} motivos"
      ],
      "f613": [
        "Familia 613",
        "{n} motivos"
      ],
      "f18": [
        "Familia 18",
        "{n} motivos"
      ],
      "fpilote": [
        "Familia piloto",
        "{n} motivos"
      ],
      "p18": [
        "Cruz 1·2",
        "{n} motivos"
      ],
      "p30": [
        "Cruz 1·2",
        "{n} motivos"
      ]
    },
    "fond": "Bandas {id}",
    "fondAide": "Una casilla lleva cuatro triángulos; cada uno se dibuja con el estado 1 del fondo o con el estado 0: el mismo fondo girado 90°.",
    "fondSeulementBicolore": "La variante de casilla solo se aplica a la colección bicolor.",
    "palettes": {
      "creme": [
        "Tinta y crema",
        "Los colores del sitio."
      ],
      "monochrome": [
        "Gris y blanco",
        "El monocromo del sitio."
      ],
      "perso": [
        "Mis colores",
        "Elige el motivo y el fondo."
      ],
      "son": [
        "El tono sigue al sonido",
        "El tono se desliza lentamente con el brillo del sonido (desactivado por defecto)."
      ]
    },
    "persoMotif": "Motivo",
    "persoFond": "Fondo",
    "tricoloreAide": "En tricolor: V el más oscuro (tinta), O gris medio, M el más claro (crema).",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "Ajustes en directo",
    "lissage": "Suavizado",
    "pulsationTitre": "Pulsación",
    "pulsations": {
      "attaque": "En cada ataque",
      "temps": "En cada tiempo",
      "quatre": "Cada 4 pulsaciones"
    },
    "pulsationAide": "Por defecto, un cambio en cada ataque. Cuando se detecta una pulsación regular, puedes cambiar en cada tiempo o cada 4 pulsaciones.",
    "pulsationDetectee": "Pulsación detectada: {bpm} por minuto.",
    "pulsationAucune": "De momento no se detecta ninguna pulsación regular.",
    "calme": "Reducir los cambios rápidos",
    "calmeAide": "Un fundido más largo y una permanencia mayor. Activado de oficio si tu sistema pide menos animaciones.",
    "pente": "Compensar la pendiente de los graves",
    "pauseImage": "Pausa de la imagen",
    "optionsTitre": "Opciones",
    "comprendreTitre": "Para comprender",
    "comprendreAide": "Dos vistas pedagógicas, sin relación con el sonido.",
    "paireTitre": "El modo (4, 0) y su par degenerado",
    "paireAide": "En una placa cuadrada, los modos (4, 0) y (0, 4) tienen la misma frecuencia: toda combinación es también un modo de esa frecuencia. El control deslizante pasa de cos(4πx/a) + cos(4πy/a) (a la derecha) a cos(4πx/a) − cos(4πy/a) (a la izquierda); en el medio solo queda cos(4πx/a), líneas verticales. Zonas claras y oscuras: signos opuestos; trazo: línea nodal.",
    "paireMelange": "Mezcla s: cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "Figura del modo (4, 0) mezclado con su par degenerado",
    "moireTitre": "La paridad como superposición de dos redes de ±1",
    "moireAide": "Cada red es un tablero: la paridad (−1)^(i + j) de la casilla (i, j). Su producto vale +1 donde las dos coinciden y −1 donde difieren: es el XNOR de los bits, como dos polarizadores cruzados. Al desplazar o girar un poco una de las dos aparece un muaré.",
    "moireAngle": "Rotación de la segunda red (grados)",
    "moirePeriode": "Periodo de la segunda red (en % del de la primera)",
    "moireA": "Red A",
    "moireB": "Red B",
    "moireProduit": "Producto A × B (XNOR)",
    "moireAlt": "Producto de dos redes de ±1",
    "clesTitre": "Lectura en claves",
    "clesAide": "Solo visualización: las claves de la nota de los ejes (72 claves sin duplicados, paridad contada desde la casilla de esquina, rango 70) cuya suma devuelve la figura del motivo elegido, cuando existe. La página no afirma ningún vínculo entre una clave y una frecuencia.",
    "clesNatures": {
      "D+": "diagonal x + y",
      "D-": "diagonal y − x",
      "H": "horizontal",
      "V": "vertical"
    },
    "clesFigure": {
      "figure": "Figura del motivo",
      "V": "Clase V (violeta)",
      "O": "Clase O (naranja)",
      "M": "Clase M (magenta)"
    },
    "clesActives": "{n} claves activas: {liste}",
    "clesAucune": "ninguna clave (figura vacía)",
    "clesComplement": " (salvo el complemento)",
    "clesHors": "Esta figura no es una suma de claves: queda fuera del espacio que engendran.",
    "clesMotif": "Motivo {i} de {n}, colección {collection}.",
    "clesOrdre12": "La lectura en claves solo se aplica al orden 12.",
    "loiTitre": "Ley de frecuencia de los círculos",
    "loiChoix": {
      "racine": "Escala comprimida para el oído",
      "plaque": "Ley de la placa real"
    },
    "loiAide": "Escala comprimida: f = frecuencia de referencia × √K / 2 (ajuste inicial). Ley de la placa: f = c × K, como una placa real (aluminio de 3 mm, 48 cm: c = 31,85 Hz). En el orden 12, de 32 a 2 293 Hz; los círculos por encima de 0,9 × la frecuencia de Nyquist se ignoran, como antes. El detector de ataques y el seguimiento del tono no cambian.",
    "loiC": "c (Hz por unidad de m² + n²)",
    "figureTitre": "Figura (vistas Signos y Líneas)",
    "figureChoix": {
      "motif": "Del motivo elegido",
      "son": "Del sonido",
      "ecart": "Las dos (diferencia)"
    },
    "figureAide": "Del motivo elegido: la figura de Chladni del motivo elegido (ajuste inicial). Del sonido: la suma de las ondas de cada círculo, ponderadas por la energía que el sonido pone en él, sin pasar por un motivo. Las dos: los lugares donde estas dos figuras difieren. El sonido no entrega las fases: se ponen a cero.",
    "sceneTitre": "La escena",
    "projection": "Abrir una ventana de proyección",
    "sceneAide": "La pantalla completa lanza siempre la ventana validada, nunca la de prueba; los controles y el cursor se ocultan a los 3 segundos. Esc para volver. La ventana de proyección es independiente: arrástrala a una segunda pantalla o a un proyector.",
    "projectionBloquee": "El navegador ha bloqueado la ventana de proyección. Permite las ventanas emergentes para este sitio y vuelve a intentarlo.",
    "veille": "La pantalla se mantiene encendida durante la reproducción cuando el navegador lo permite.",
    "enregTitre": "Grabar",
    "enreg": "Grabar 15 s",
    "enregEnCours": "Grabando: {s} s",
    "format916": "9:16 (Reels, Shorts, TikTok)",
    "format45": "4:5 (publicación)",
    "format11": "1:1 (cuadrado)",
    "formatVideo": "Formato del vídeo",
    "signature": "Banda «{texte}» al pie del vídeo",
    "enregPret": "Vídeo grabado: la descarga ha comenzado.",
    "enregWebm": "Tu navegador no escribe MP4: el vídeo está en formato WebM. Para convertirlo a MP4 (Instagram, TikTok), pásalo por un conversor o por ffmpeg: ffmpeg -i archivo.webm archivo.mp4.",
    "enregAac": "Audio AAC en el MP4: se reproduce en todas partes (iPhone, QuickTime, aplicaciones de publicación).",
    "enregOpusAvant": "Este navegador escribe el audio del MP4 en Opus: puede no reproducirse en iPhone, QuickTime o algunas aplicaciones de publicación (Chrome de escritorio reciente: AAC).",
    "enregOpus": "Audio Opus: puede no reproducirse en iPhone, QuickTime o algunas aplicaciones de publicación. Para una pista AAC: ffmpeg -i archivo.mp4 -c:v copy -c:a aac salida.mp4.",
    "enregIndispo": "La grabación de vídeo no está disponible en este navegador.",
    "enregSansSource": "Inicia primero un sonido: no se graba el silencio.",
    "enregErreur": "La grabación no se inicia: {message}",
    "raccourcisTitre": "Atajos de teclado",
    "raccourcis": [
      [
        "1 – 3",
        "Vista de la prueba: signos, líneas nodales, celdas"
      ],
      [
        "Espacio",
        "Siguiente modo de control (prueba)"
      ],
      [
        "P",
        "Pausa de la imagen"
      ],
      [
        "V",
        "Validar la prueba"
      ],
      [
        "F",
        "Pantalla completa (ventana validada)"
      ],
      [
        "R",
        "Grabar 15 s"
      ]
    ],
    "infoMotif": "Motivo {i} de {n}",
    "infoImages": "{fps} imágenes/s",
    "infoResolution": "resolución reducida",
    "semaineTitre": "La semana",
    "semaineMention": "Música compuesta con IA por MC Claude.",
    "semaineTiers": "Un clic en un cartel carga el reproductor de YouTube o de TikTok: un servicio de terceros, que recibe entonces tu visita. No se carga nada antes.",
    "jourTitre": "Día {n} — {tonalite}",
    "datePub": "Publicado el {date}",
    "bientot": "Próximamente",
    "lire": "Reproducir el vídeo del día {n}, {tonalite}",
    "lireTiktok": "Reproducir aquí (TikTok)",
    "voirYoutube": "Ver en YouTube",
    "voirTiktok": "Ver en TikTok",
    "afficheAlt": "Cartel del día {n} — {tonalite}",
    "lecteurTitre": "Vídeo del día {n}",
    "voirAussiTitre": "Ver también",
    "voirAussi": [
      {
        "href": "/es/galeria-bicolor/",
        "titre": "Galería bicolor",
        "texte": "Los motivos bicolores engendrados por los ejes, cerrados sobre el cubo: grano, pavimentación, exportación."
      },
      {
        "href": "/es/galeria-tricolor/",
        "titre": "Galería tricolor",
        "texte": "Los motivos unificados, engendrados por mezcla de tonos: selecciona un motivo para ver su pavimentación."
      },
      {
        "href": "/es/fondos-de-pantalla/",
        "titre": "Fondos de pantalla",
        "texte": "Fondos textiles a pantalla completa, reactivos al sonido o en modo meditativo."
      },
      {
        "href": "/es/animaciones/",
        "titre": "Galería de animaciones",
        "texte": "Las animaciones de las colecciones de fondos, para ver y descargar en MP4."
      },
      {
        "href": "/es/chladni/",
        "titre": "Chladni",
        "texte": "Figuras, escalas y frecuencias: la página que une el vocabulario de los motivos con los modos de una placa."
      },
      {
        "href": "/es/libro/",
        "titre": "El libro",
        "texte": "La Livrée d'Hermès en línea, página por página, con el PDF gratuito."
      }
    ]
  },
  th: {
    "titrePage": "มองเห็นดนตรีของคุณ — La Livrée d'Hermès",
    "description": "มองเห็นดนตรีของคุณ: เลือกเพลง ไฟล์ หรือไมโครโฟน แล้วดูรูปแบบของ Chladni ที่เสียงวาดขึ้น จากนั้นดูลวดลายของ La Livrée d'Hermès ที่คล้ายกับมันที่สุด บันทึกวิดีโอพร้อมเสียง 15 วินาที",
    "ariane": "มองเห็นดนตรีของคุณ",
    "h1": "มองเห็นดนตรีของคุณ",
    "intro": "ดนตรีทุกชิ้นมีลายเซ็นของตัวเอง คือวิธีที่พลังงานของมันกระจายไปตามความถี่ต่าง ๆ เลือกเพลง ไฟล์ หรือไมโครโฟน หน้านี้จะวัดพลังงานนั้นที่ความถี่ของวงโหมดแต่ละวงของแผ่นสี่เหลี่ยมจัตุรัส แล้วค้นหาในบรรดาลวดลายรวมเป็นหนึ่งของ La Livrée d'Hermès ว่าลายใดมีสเปกตรัมคล้ายกับเสียงมากที่สุด การเลือกอาศัยความคล้ายกันของสเปกตรัมสองชุด ไม่ใช่กฎทางดนตรี ลวดลายหนึ่งไม่ได้ “แสดงออก” ถึงบทเพลงหนึ่ง",
    "discretion": "ไม่มีสิ่งใดออกจากเบราว์เซอร์ของคุณ: ไฟล์ ไมโครโฟน และเสียงที่จับได้ จะถูกวิเคราะห์ในเครื่องและไม่ถูกส่งไปที่ใดเลย",
    "flash": "คำเตือน: ภาพอาจเปลี่ยนเร็วและกะพริบ ตัวเลือก “ลดการเปลี่ยนแปลงที่รวดเร็ว” จะทำให้ช้าลง",
    "sonTitre": "เสียง",
    "sonChoix": "เสียง",
    "morceau": "เพลงที่มีให้ {n} — {note}",
    "notes": {
      "j1": "โดชาร์ป",
      "j2": "ลา",
      "j3": "เร",
      "j4": "มี",
      "j5": "ซอล",
      "j6": "ซี",
      "j7": "โด"
    },
    "tonalites": {
      "do dièse mineur": "โดชาร์ปไมเนอร์",
      "la mineur": "ลาไมเนอร์",
      "ré mineur": "เรไมเนอร์",
      "mi mineur": "มีไมเนอร์",
      "sol mineur": "ซอลไมเนอร์",
      "si mineur": "ซีไมเนอร์",
      "do mineur": "โดไมเนอร์"
    },
    "sourceFichier": "ไฟล์เสียงของฉัน…",
    "sourceMicro": "ไมโครโฟน",
    "sourceEssai": "เพลงทดลอง",
    "sourceOnglet": "เสียงจากแท็บ",
    "lecture": "เล่น",
    "pause": "หยุดชั่วคราว",
    "arreter": "หยุด",
    "entree": "อินพุตเสียง",
    "entreeDefaut": "อินพุตเริ่มต้น",
    "entreeAide": "มิกเซอร์ การ์ดเสียง: เสียบอุปกรณ์ อนุญาตให้ใช้ไมโครโฟน แล้วเลือกที่นี่",
    "sensibilite": "เกณฑ์การจับจังหวะโน้ต",
    "sensibiliteAide": "เป็นจำนวนส่วนเบี่ยงเบนมาตรฐานที่สูงกว่าค่าเฉลี่ย: ยิ่งต่ำ ยิ่งไวต่อการเปลี่ยนโน้ต",
    "intervalle": "ระยะห่างต่ำสุดระหว่างจังหวะโน้ตสองครั้ง (วินาที)",
    "intervalleAide": "ค่าเริ่มต้น 0.45 วินาที: มากที่สุดราว 133 ครั้งต่อนาที ลดค่าลงสำหรับจังหวะเร็ว",
    "mentionIA": "เพลงที่มีให้แต่งขึ้นด้วยความช่วยเหลือของ AI (“Musique composée avec l'IA par MC Claude.” หรือ “ดนตรีที่แต่งด้วย AI โดย MC Claude”)",
    "etatDepart": "กดเล่น เพลงที่มีให้แต่งขึ้นด้วยความช่วยเหลือของ AI",
    "etatMorceau": "เพลงที่มีให้ แต่งขึ้นด้วยความช่วยเหลือของ AI",
    "etatFichier": "ไฟล์: {nom} (อยู่ในเบราว์เซอร์ของคุณเท่านั้น)",
    "etatMicro": "ไมโครโฟนทำงานอยู่",
    "etatEntree": "อินพุต “{nom}” ทำงานอยู่",
    "etatOnglet": "เสียงจากแท็บทำงานอยู่",
    "etatEssai": "เพลงทดลอง",
    "erreurMicroRefuse": "ไมโครโฟนถูกปฏิเสธ โปรดอนุญาตในการตั้งค่าของเว็บไซต์ (รูปแม่กุญแจทางซ้ายของที่อยู่) แล้วกดเล่นอีกครั้ง หรือเลือกไฟล์หรือเพลงที่มีให้ก็ได้",
    "erreurMicroAbsent": "อุปกรณ์นี้ไม่มีไมโครโฟนให้ใช้",
    "erreurMicro": "ไมโครโฟนไม่เริ่มทำงาน: {message}",
    "erreurOnglet": "ไม่สามารถจับเสียงจากแท็บที่นี่ได้ ต้องใช้เบราว์เซอร์บนคอมพิวเตอร์รุ่นใหม่ (Chrome, Edge) ซึ่งไม่มีบนมือถือและบน Safari",
    "erreurOngletSansSon": "แท็บที่เลือกไม่ได้ส่งเสียงมา โปรดเริ่มใหม่และติ๊ก “แชร์เสียงของแท็บ”",
    "erreurFichier": "ไฟล์นี้ไม่สามารถอ่านเป็นเสียงได้",
    "erreurAudio": "เสียงไม่เริ่มทำงาน: {message}",
    "erreurDonnees": "ข้อมูลของหน้าโหลดไม่ได้: {message}",
    "bandeManque": "ชุดพื้นหลังขาดแถบ {id}",
    "microCoupe": "แหล่งเสียงหยุดทำงาน (ถอดอุปกรณ์ออกหรือถูกเพิกถอนสิทธิ์)",
    "silence": "เงียบ: โปรดเริ่มเล่นเสียง",
    "valide": "ยืนยันแล้ว",
    "valideTag": "ปัจจุบัน",
    "essai": "ทดลอง",
    "essaiTag": "ตัวอย่าง",
    "validerEssai": "ยืนยันการทดลอง",
    "annuler": "ยกเลิก",
    "pleinEcran": "เต็มหน้าจอ",
    "quitterPleinEcran": "ออกจากโหมดเต็มหน้าจอ",
    "fenetresAide": "พื้นหลังเข้ม: ยืนยันแล้ว กรอบสีทอง: กำลังทดลอง เลื่อนเมาส์ไปที่ตัวเลือกเพื่อดูในหน้าต่างทดลอง คลิกเพื่อเก็บไว้ แล้วกด “ยืนยันการทดลอง”",
    "fenetreValide": "หน้าต่างที่ยืนยันแล้ว",
    "fenetreEssai": "หน้าต่างทดลอง",
    "basculeValide": "ยืนยันแล้ว",
    "basculeEssai": "ทดลอง",
    "pleinEcranIndispo": "เบราว์เซอร์นี้ไม่รองรับโหมดเต็มหน้าจอ",
    "pleinEcranRepli": "เบราว์เซอร์นี้ไม่มีโหมดเต็มหน้าจอแบบเนทีฟสำหรับองค์ประกอบนี้: เวทีจะครอบคลุมทั้งหน้าต่าง กด Esc หรือปุ่มเพื่อปิด",
    "groupes": {
      "mode": "การควบคุมด้วยเสียง",
      "fmt": "รูปแบบ (อันดับ)",
      "col": "ชุดลวดลาย",
      "view": "มุมมอง",
      "fond": "แบบของช่อง",
      "pal": "สี"
    },
    "modes": {
      "image": [
        "เสียงกำหนดภาพ",
        "ทุกขณะ เลือกลวดลายที่สเปกตรัมคล้ายกับของดนตรีมากที่สุด"
      ],
      "rythme": [
        "เสียงกำหนดจังหวะ",
        "ก้าวไปหนึ่งก้าวบนสายความใกล้เคียงทุกครั้งที่มีจังหวะโน้ต"
      ],
      "chemin": [
        "เสียงนำทาง",
        "จังหวะตัดสินว่าเมื่อไร สเปกตรัมตัดสินว่าไปหาเพื่อนบ้านตัวไหน"
      ],
      "octaves": [
        "เสียงตามอ็อกเทฟ",
        "ทุกครั้งที่มีจังหวะโน้ต ก้าวไปหนึ่งก้าวตามวงโคจรของโน้ตเด่น: วง K แล้วอ็อกเทฟ 4K แล้ว 16K… เมื่อวงเหล่านั้นมีอยู่"
      ]
    },
    "vues": {
      "signes": [
        "เครื่องหมาย",
        "บริเวณค่าบวกของรูปแบบของลวดลาย"
      ],
      "lignes": [
        "เส้นโหนด",
        "เส้นที่รูปแบบของลวดลายมีค่าเป็นศูนย์"
      ],
      "pavage": [
        "เซลล์",
        "ตัวลวดลายเอง ปูลายแบบ 2 × 2"
      ]
    },
    "format": {
      "titre": "อันดับ {n}",
      "detail": "ตาราง {g} × {g} ช่อง",
      "bientot": "อันดับ {n} (ส่งมอบครั้งที่สอง)"
    },
    "chargementOrdre": "กำลังโหลดอันดับ {n}…",
    "ordreIndisponible": "ข้อมูลของอันดับ {n} โหลดไม่ได้: {message}",
    "collections": {
      "tri": [
        "สามสี — ลวดลายรวมเป็นหนึ่ง",
        "{n} ลวดลาย (ตาราง 12 × 12 ที่ไม่ซ้ำกัน)"
      ],
      "bi": [
        "สองสี — ลวดลายรวมเป็นหนึ่ง",
        "{n} ลวดลาย (กระจกสองบาน อ่านได้ตามกฎของวันที่ 3 ตุลาคม)"
      ],
      "ce": [
        "สองสี — สมมาตรศูนย์กลาง",
        "{n} ลวดลาย (สมมาตรศูนย์กลาง 180° เพียงอย่างเดียว อ่านได้ตามกฎของวันที่ 3 ตุลาคม)"
      ],
      "b1971128": [
        "บล็อก 1971128",
        "{n} ลวดลาย"
      ],
      "b16012838": [
        "บล็อก 16012838",
        "{n} ลวดลาย"
      ],
      "b3016090": [
        "บล็อก 3016090",
        "{n} ลวดลาย"
      ],
      "f613": [
        "ตระกูล 613",
        "{n} ลวดลาย"
      ],
      "f18": [
        "ตระกูล 18",
        "{n} ลวดลาย"
      ],
      "fpilote": [
        "ตระกูลนำร่อง",
        "{n} ลวดลาย"
      ],
      "p18": [
        "กากบาท 1·2",
        "{n} ลวดลาย"
      ],
      "p30": [
        "กากบาท 1·2",
        "{n} ลวดลาย"
      ]
    },
    "fond": "แถบ {id}",
    "fondAide": "หนึ่งช่องมีสามเหลี่ยมสี่รูป แต่ละรูปวาดด้วยสถานะ 1 ของพื้นหลัง หรือสถานะ 0 คือพื้นหลังเดียวกันที่หมุน 90°",
    "fondSeulementBicolore": "แบบของช่องใช้ได้กับชุดลวดลายสองสีเท่านั้น",
    "palettes": {
      "creme": [
        "หมึกกับสีครีม",
        "สีของเว็บไซต์"
      ],
      "monochrome": [
        "เทากับขาว",
        "โทนสีเดียวของเว็บไซต์"
      ],
      "perso": [
        "สีของฉัน",
        "เลือกสีของลวดลายและสีพื้นหลัง"
      ],
      "son": [
        "โทนสีตามเสียง",
        "โทนสีเลื่อนไหลช้า ๆ ตามความสว่างของเสียง (ปิดไว้เป็นค่าเริ่มต้น)"
      ]
    },
    "persoMotif": "ลวดลาย",
    "persoFond": "พื้นหลัง",
    "tricoloreAide": "ในโหมดสามสี: V เข้มที่สุด (หมึก) O เทากลาง M อ่อนที่สุด (ครีม)",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "การตั้งค่าขณะเล่น",
    "lissage": "การทำให้เรียบ",
    "pulsationTitre": "ชีพจรจังหวะ",
    "pulsations": {
      "attaque": "ทุกจังหวะโน้ต",
      "temps": "ทุกจังหวะตบ",
      "quatre": "ทุก 4 จังหวะ"
    },
    "pulsationAide": "โดยปกติเปลี่ยนทุกครั้งที่มีจังหวะโน้ต เมื่อตรวจพบชีพจรจังหวะที่สม่ำเสมอ คุณเลือกเปลี่ยนทุกจังหวะตบหรือทุก 4 จังหวะได้",
    "pulsationDetectee": "ตรวจพบชีพจรจังหวะ: {bpm} ต่อนาที",
    "pulsationAucune": "ยังไม่พบชีพจรจังหวะที่สม่ำเสมอ",
    "calme": "ลดการเปลี่ยนแปลงที่รวดเร็ว",
    "calmeAide": "เฟดนานขึ้นและค้างไว้นานขึ้น เปิดโดยอัตโนมัติหากระบบของคุณขอให้ลดภาพเคลื่อนไหว",
    "pente": "ชดเชยความลาดของเสียงต่ำ",
    "pauseImage": "หยุดภาพ",
    "optionsTitre": "ตัวเลือก",
    "comprendreTitre": "เพื่อความเข้าใจ",
    "comprendreAide": "มุมมองเพื่อการเรียนรู้สองแบบ ไม่เกี่ยวข้องกับเสียง",
    "paireTitre": "โหมด (4, 0) และคู่ลดรูปของมัน",
    "paireAide": "บนแผ่นสี่เหลี่ยมจัตุรัส โหมด (4, 0) และ (0, 4) มีความถี่เท่ากัน การรวมกันใด ๆ ของทั้งสองจึงเป็นโหมดของความถี่นั้นด้วย แถบเลื่อนไล่จาก cos(4πx/a) + cos(4πy/a) (ขวา) ไปเป็น cos(4πx/a) − cos(4πy/a) (ซ้าย) ตรงกลางเหลือเพียง cos(4πx/a) เป็นเส้นตั้ง บริเวณสว่างและมืด: เครื่องหมายตรงข้ามกัน เส้น: เส้นโหนด",
    "paireMelange": "ผสม s: cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "รูปแบบของโหมด (4, 0) ที่ผสมกับคู่ลดรูปของมัน",
    "moireTitre": "พาริตีในฐานะการซ้อนกันของโครงตาข่าย ±1 สองชุด",
    "moireAide": "โครงตาข่ายแต่ละชุดคือกระดานหมากรุก: พาริตี (−1)^(i + j) ของช่อง (i, j) ผลคูณของทั้งสองเป็น +1 ตรงที่ตรงกัน และเป็น −1 ตรงที่ต่างกัน คือ XNOR ของบิต เหมือนโพลาไรเซอร์สองแผ่นที่วางตั้งฉากกัน ถ้าเลื่อนหรือหมุนชุดใดชุดหนึ่งเล็กน้อยจะเกิดลายมัวเร",
    "moireAngle": "การหมุนของโครงตาข่ายชุดที่สอง (องศา)",
    "moirePeriode": "คาบของโครงตาข่ายชุดที่สอง (เป็น % ของชุดแรก)",
    "moireA": "โครงตาข่าย A",
    "moireB": "โครงตาข่าย B",
    "moireProduit": "ผลคูณ A × B (XNOR)",
    "moireAlt": "ผลคูณของโครงตาข่าย ±1 สองชุด",
    "clesTitre": "การอ่านเป็นกุญแจ",
    "clesAide": "แสดงผลเท่านั้น: กุญแจของบันทึกแกน (72 กุญแจที่ตัดตัวซ้ำออกแล้ว นับพาริตีจากช่องมุม อันดับ 70) ซึ่งผลรวมคืนรูปแบบของลวดลายที่เลือกเมื่อทำได้ หน้านี้ไม่ได้ยืนยันความเกี่ยวข้องใด ๆ ระหว่างกุญแจกับความถี่",
    "clesNatures": {
      "D+": "เส้นทแยง x + y",
      "D-": "เส้นทแยง y − x",
      "H": "แนวนอน",
      "V": "แนวตั้ง"
    },
    "clesFigure": {
      "figure": "รูปแบบของลวดลาย",
      "V": "คลาส V (ม่วง)",
      "O": "คลาส O (ส้ม)",
      "M": "คลาส M (บานเย็น)"
    },
    "clesActives": "กุญแจที่ใช้งาน {n} ดอก: {liste}",
    "clesAucune": "ไม่มีกุญแจ (รูปแบบว่าง)",
    "clesComplement": " (ต่างกันไม่เกินส่วนเติมเต็ม)",
    "clesHors": "รูปแบบนี้ไม่ใช่ผลรวมของกุญแจ: อยู่นอกปริภูมิที่กุญแจเหล่านั้นสร้างขึ้น",
    "clesMotif": "ลวดลายที่ {i} จาก {n} ชุดลวดลาย {collection}",
    "clesOrdre12": "การอ่านเป็นกุญแจใช้ได้กับอันดับ 12 เท่านั้น",
    "loiTitre": "กฎความถี่ของวงกลม",
    "loiChoix": {
      "racine": "สเกลที่บีบอัดเพื่อหู",
      "plaque": "กฎของแผ่นจริง"
    },
    "loiAide": "สเกลที่บีบอัด: f = ความถี่อ้างอิง × √K / 2 (ค่าตั้งต้น) กฎของแผ่น: f = c × K เหมือนแผ่นจริง (อะลูมิเนียมหนา 3 มม. 48 ซม.: c = 31.85 เฮิรตซ์) ที่อันดับ 12 ตั้งแต่ 32 ถึง 2 293 เฮิรตซ์ วงที่เกิน 0.9 × ความถี่ไนควิสต์จะถูกละเลยเหมือนเดิม ตัวตรวจจับจังหวะโน้ตและการติดตามโทนสีไม่เปลี่ยน",
    "loiC": "c (เฮิรตซ์ต่อหนึ่งหน่วยของ m² + n²)",
    "figureTitre": "รูปแบบ (มุมมองเครื่องหมายและเส้น)",
    "figureChoix": {
      "motif": "ของลวดลายที่เลือก",
      "son": "ของเสียง",
      "ecart": "ทั้งสอง (ส่วนต่าง)"
    },
    "figureAide": "ของลวดลายที่เลือก: รูปแบบของ Chladni ของลวดลายที่เลือก (ค่าตั้งต้น) ของเสียง: ผลรวมของคลื่นแต่ละวง ถ่วงน้ำหนักด้วยพลังงานที่เสียงใส่ลงไป โดยไม่ผ่านลวดลาย ทั้งสอง: ตำแหน่งที่รูปแบบทั้งสองต่างกัน เสียงไม่ให้เฟส จึงตั้งเป็นศูนย์",
    "sceneTitre": "เวที",
    "projection": "เปิดหน้าต่างฉาย",
    "sceneAide": "โหมดเต็มหน้าจอจะเปิดหน้าต่างที่ยืนยันแล้วเสมอ ไม่ใช่หน้าต่างทดลอง ปุ่มควบคุมและเคอร์เซอร์จะซ่อนหลังผ่านไป 3 วินาที กด Esc เพื่อกลับ หน้าต่างฉายแยกต่างหาก: ลากไปไว้บนจอที่สองหรือโปรเจกเตอร์",
    "projectionBloquee": "เบราว์เซอร์บล็อกหน้าต่างฉาย โปรดอนุญาตหน้าต่างป๊อปอัปสำหรับเว็บไซต์นี้ แล้วลองใหม่",
    "veille": "หน้าจอจะติดอยู่ระหว่างเล่นเมื่อเบราว์เซอร์อนุญาต",
    "enregTitre": "บันทึก",
    "enreg": "บันทึก 15 วินาที",
    "enregEnCours": "กำลังบันทึก: {s} วินาที",
    "format916": "9:16 (Reels, Shorts, TikTok)",
    "format45": "4:5 (โพสต์)",
    "format11": "1:1 (สี่เหลี่ยมจัตุรัส)",
    "formatVideo": "รูปแบบวิดีโอ",
    "signature": "แถบ “{texte}” ที่ด้านล่างของวิดีโอ",
    "enregPret": "บันทึกวิดีโอแล้ว: เริ่มดาวน์โหลดแล้ว",
    "enregWebm": "เบราว์เซอร์ของคุณไม่เขียนไฟล์ MP4: วิดีโอเป็นรูปแบบ WebM หากต้องการแปลงเป็น MP4 (Instagram, TikTok) ให้ใช้ตัวแปลงไฟล์หรือ ffmpeg: ffmpeg -i ไฟล์.webm ไฟล์.mp4",
    "enregAac": "เสียง AAC ในไฟล์ MP4: เล่นได้ทุกที่ (iPhone, QuickTime, แอปสำหรับเผยแพร่)",
    "enregOpusAvant": "เบราว์เซอร์นี้เขียนเสียงของ MP4 เป็น Opus: อาจเล่นไม่ได้บน iPhone, QuickTime หรือแอปเผยแพร่บางตัว (Chrome บนคอมพิวเตอร์รุ่นใหม่: AAC)",
    "enregOpus": "เสียง Opus: อาจเล่นไม่ได้บน iPhone, QuickTime หรือแอปเผยแพร่บางตัว หากต้องการแทร็ก AAC: ffmpeg -i ไฟล์.mp4 -c:v copy -c:a aac ผลลัพธ์.mp4",
    "enregIndispo": "เบราว์เซอร์นี้ไม่รองรับการบันทึกวิดีโอ",
    "enregSansSource": "โปรดเริ่มเล่นเสียงก่อน: จะไม่บันทึกความเงียบ",
    "enregErreur": "การบันทึกไม่เริ่มทำงาน: {message}",
    "raccourcisTitre": "ปุ่มลัดบนแป้นพิมพ์",
    "raccourcis": [
      [
        "1 – 3",
        "มุมมองของหน้าต่างทดลอง: เครื่องหมาย เส้นโหนด เซลล์"
      ],
      [
        "Space",
        "โหมดควบคุมถัดไป (ทดลอง)"
      ],
      [
        "P",
        "หยุดภาพ"
      ],
      [
        "V",
        "ยืนยันการทดลอง"
      ],
      [
        "F",
        "เต็มหน้าจอ (หน้าต่างที่ยืนยันแล้ว)"
      ],
      [
        "R",
        "บันทึก 15 วินาที"
      ]
    ],
    "infoMotif": "ลวดลายที่ {i} จาก {n}",
    "infoImages": "{fps} ภาพ/วินาที",
    "infoResolution": "ลดความละเอียด",
    "semaineTitre": "สัปดาห์นี้",
    "semaineMention": "ดนตรีที่แต่งด้วย AI โดย MC Claude",
    "semaineTiers": "การคลิกโปสเตอร์จะโหลดเครื่องเล่นของ YouTube หรือ TikTok ซึ่งเป็นบริการของบุคคลที่สามที่จะได้รับการเข้าชมของคุณ ก่อนหน้านั้นจะไม่มีการโหลดสิ่งใด",
    "jourTitre": "วันที่ {n} — {tonalite}",
    "datePub": "เผยแพร่เมื่อ {date}",
    "bientot": "เร็ว ๆ นี้",
    "lire": "เล่นวิดีโอของวันที่ {n} {tonalite}",
    "lireTiktok": "เล่นที่นี่ (TikTok)",
    "voirYoutube": "ดูบน YouTube",
    "voirTiktok": "ดูบน TikTok",
    "afficheAlt": "โปสเตอร์ของวันที่ {n} — {tonalite}",
    "lecteurTitre": "วิดีโอของวันที่ {n}",
    "voirAussiTitre": "ดูเพิ่มเติม",
    "voirAussi": [
      {
        "href": "/th/two-colour-gallery/",
        "titre": "แกลเลอรีสองสี",
        "texte": "ลวดลายสองสีที่สร้างจากแกนและปิดบนลูกบาศก์: เกรนการอ่าน การปูลาย การส่งออก"
      },
      {
        "href": "/th/three-colour-gallery/",
        "titre": "แกลเลอรีสามสี",
        "texte": "ลวดลายรวมเป็นหนึ่งที่สร้างจากการผสมโทนสี: เลือกลวดลายเพื่อดูการปูลาย"
      },
      {
        "href": "/th/wallpapers/",
        "titre": "วอลเปเปอร์",
        "texte": "วอลเปเปอร์ผ้าเต็มหน้าจอ ตอบสนองต่อเสียงหรืออยู่ในโหมดสมาธิ"
      },
      {
        "href": "/th/animations/",
        "titre": "แกลเลอรีแอนิเมชัน",
        "texte": "แอนิเมชันของชุดพื้นหลัง สำหรับดูและดาวน์โหลดเป็น MP4"
      },
      {
        "href": "/th/chladni/",
        "titre": "Chladni",
        "texte": "รูปแบบ บันไดเสียง และความถี่: หน้าที่เชื่อมคำศัพท์ของลวดลายเข้ากับโหมดของแผ่น"
      },
      {
        "href": "/th/book/",
        "titre": "หนังสือ",
        "texte": "La Livrée d'Hermès ออนไลน์ ทีละหน้า พร้อม PDF ฟรี"
      }
    ]
  },
  zh: {
    "titrePage": "看见你的音乐——La Livrée d'Hermès",
    "description": "看见你的音乐：选择一首曲子、一个文件或麦克风，观看声音描绘出的 Chladni 图形，以及与之最相似的 La Livrée d'Hermès 图案。可随声音录制 15 秒。",
    "ariane": "看见你的音乐",
    "h1": "看见你的音乐",
    "intro": "每一段音乐都有自己的特征：它的能量在各个频率上的分布方式。选择一首曲子、一个文件或麦克风：本页在方形板每个振动模式圆环所对应的频率上测量这份能量，然后在 La Livrée d'Hermès 的统一图案中，找出频谱与之最相似的那一个。这一选择依据的是两个频谱的相似程度，而不是某种音乐法则：图案并不“表达”一首曲子。",
    "discretion": "任何内容都不会离开您的浏览器：文件、麦克风和捕获的音频都在本地分析，不会发送到任何地方。",
    "flash": "注意：画面可能快速变化并闪烁。“减少快速变化”选项可使其放慢。",
    "sonTitre": "声音",
    "sonChoix": "声音",
    "morceau": "内置曲目 {n}——{note}",
    "notes": {
      "j1": "升C",
      "j2": "A",
      "j3": "D",
      "j4": "E",
      "j5": "G",
      "j6": "B",
      "j7": "C"
    },
    "tonalites": {
      "do dièse mineur": "升C小调",
      "la mineur": "A小调",
      "ré mineur": "D小调",
      "mi mineur": "E小调",
      "sol mineur": "G小调",
      "si mineur": "B小调",
      "do mineur": "C小调"
    },
    "sourceFichier": "我的音频文件…",
    "sourceMicro": "麦克风",
    "sourceEssai": "试听音乐",
    "sourceOnglet": "标签页音频",
    "lecture": "播放",
    "pause": "暂停",
    "arreter": "停止",
    "entree": "音频输入",
    "entreeDefaut": "默认输入",
    "entreeAide": "调音台、声卡：接好设备，允许使用麦克风，然后在此选择。",
    "sensibilite": "起音阈值",
    "sensibiliteAide": "以高于平均值的标准差数表示：越低，对音符变化越敏感。",
    "intervalle": "两次起音之间的最短间隔（秒）",
    "intervalleAide": "默认 0.45 秒：每分钟最多约 133 次起音。节奏较快时请调低。",
    "mentionIA": "内置曲目由人工智能协助创作（“Musique composée avec l'IA par MC Claude.”，即“由 MC Claude 借助人工智能创作的音乐。”）。",
    "etatDepart": "请点击“播放”。内置曲目由人工智能协助创作。",
    "etatMorceau": "内置曲目，由人工智能协助创作。",
    "etatFichier": "文件：{nom}（保留在您的浏览器中）。",
    "etatMicro": "麦克风已开启。",
    "etatEntree": "输入“{nom}”已启用。",
    "etatOnglet": "标签页音频已启用。",
    "etatEssai": "试听音乐。",
    "erreurMicroRefuse": "麦克风被拒绝。请在网站设置中允许使用（地址栏左侧的锁形图标），然后再次点击“播放”。您也可以选择一个文件或一首内置曲目。",
    "erreurMicroAbsent": "此设备上没有可用的麦克风。",
    "erreurMicro": "麦克风无法启动：{message}",
    "erreurOnglet": "此处无法捕获标签页音频。需要较新的桌面浏览器（Chrome、Edge）；手机和 Safari 不支持。",
    "erreurOngletSansSon": "所选标签页没有提供声音。请重新开始，并勾选“共享标签页音频”。",
    "erreurFichier": "无法将此文件作为声音读取。",
    "erreurAudio": "声音无法启动：{message}",
    "erreurDonnees": "页面数据无法加载：{message}",
    "bandeManque": "背景集合中缺少条带 {id}",
    "microCoupe": "音源已停止（设备被拔出或授权被撤销）。",
    "silence": "静音：请先播放声音。",
    "valide": "已确认",
    "valideTag": "当前",
    "essai": "试用",
    "essaiTag": "预览",
    "validerEssai": "确认试用",
    "annuler": "取消",
    "pleinEcran": "全屏",
    "quitterPleinEcran": "退出全屏",
    "fenetresAide": "深色背景：已确认。金色边框：试用中。将鼠标移到某个选项上，可在试用窗口中预览；点击即保留，然后点“确认试用”。",
    "fenetreValide": "已确认的窗口",
    "fenetreEssai": "试用窗口",
    "basculeValide": "已确认",
    "basculeEssai": "试用",
    "pleinEcranIndispo": "此浏览器不支持全屏。",
    "pleinEcranRepli": "此浏览器不为该元素提供原生全屏：画面将铺满窗口。按 Esc 或点击按钮可关闭。",
    "groupes": {
      "mode": "声音驱动方式",
      "fmt": "格式（阶）",
      "col": "图案集",
      "view": "视图",
      "fond": "格的变体",
      "pal": "颜色"
    },
    "modes": {
      "image": [
        "声音决定画面",
        "每一刻都选出频谱与音乐最相似的图案。"
      ],
      "rythme": [
        "声音决定节奏",
        "每出现一次音符起音，就沿邻近链前进一步。"
      ],
      "chemin": [
        "声音引导路径",
        "节奏决定何时，频谱决定走向哪个邻居。"
      ],
      "octaves": [
        "声音跟随八度",
        "每次起音沿主导音符的轨道前进一步：圆环 K，然后是其八度 4K，再然后是 16K……（只要这些圆环存在）。"
      ]
    },
    "vues": {
      "signes": [
        "符号",
        "图案图形的正值区域。"
      ],
      "lignes": [
        "节线",
        "图案图形取值为零的线。"
      ],
      "pavage": [
        "单元",
        "图案本身，按 2 × 2 铺排。"
      ]
    },
    "format": {
      "titre": "{n} 阶",
      "detail": "{g} × {g} 格的网格",
      "bientot": "{n} 阶（第二批）"
    },
    "chargementOrdre": "正在加载 {n} 阶……",
    "ordreIndisponible": "{n} 阶的数据无法加载：{message}",
    "collections": {
      "tri": [
        "三色——统一图案",
        "{n} 个图案（互不相同的 12 × 12 网格）"
      ],
      "bi": [
        "双色——统一图案",
        "{n} 个图案（两面镜像，可按 10 月 3 日的规则读取）"
      ],
      "ce": [
        "双色——中心对称",
        "{n} 个图案（仅 180° 中心对称，可按 10 月 3 日的规则读取）"
      ],
      "b1971128": [
        "区块 1971128",
        "{n} 个图案"
      ],
      "b16012838": [
        "区块 16012838",
        "{n} 个图案"
      ],
      "b3016090": [
        "区块 3016090",
        "{n} 个图案"
      ],
      "f613": [
        "族 613",
        "{n} 个图案"
      ],
      "f18": [
        "族 18",
        "{n} 个图案"
      ],
      "fpilote": [
        "先导族",
        "{n} 个图案"
      ],
      "p18": [
        "十字 1·2",
        "{n} 个图案"
      ],
      "p30": [
        "十字 1·2",
        "{n} 个图案"
      ]
    },
    "fond": "条带 {id}",
    "fondAide": "每个格含四个三角形；每个三角形用背景的状态 1 或状态 0 绘制：状态 0 即同一背景旋转 90°。",
    "fondSeulementBicolore": "格的变体仅适用于双色图案集。",
    "palettes": {
      "creme": [
        "墨色与奶油色",
        "本站的配色。"
      ],
      "monochrome": [
        "灰与白",
        "本站的单色配色。"
      ],
      "perso": [
        "我的颜色",
        "自选图案色与背景色。"
      ],
      "son": [
        "色调随声音变化",
        "色调随声音的明亮度缓慢滑动（默认关闭）。"
      ]
    },
    "persoMotif": "图案",
    "persoFond": "背景",
    "tricoloreAide": "三色模式下：V 最深（墨色），O 中灰，M 最浅（奶油色）。",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "实时设置",
    "lissage": "平滑",
    "pulsationTitre": "脉动",
    "pulsations": {
      "attaque": "每次起音",
      "temps": "每一拍",
      "quatre": "每 4 拍"
    },
    "pulsationAide": "默认每次起音都变化一次。检测到规律的脉动时，可改为每一拍或每 4 拍变化一次。",
    "pulsationDetectee": "检测到脉动：每分钟 {bpm} 拍。",
    "pulsationAucune": "目前尚未检测到规律的脉动。",
    "calme": "减少快速变化",
    "calmeAide": "渐变更长、停留更久。如果您的系统要求减少动画，则默认开启。",
    "pente": "补偿低频的衰减斜率",
    "pauseImage": "暂停画面",
    "optionsTitre": "选项",
    "comprendreTitre": "帮助理解",
    "comprendreAide": "两个教学视图，与声音无关。",
    "paireTitre": "(4, 0) 模式及其简并对",
    "paireAide": "在方形板上，(4, 0) 与 (0, 4) 两个模式频率相同：二者的任意组合同样是该频率的模式。滑块从 cos(4πx/a) + cos(4πy/a)（右侧）变到 cos(4πx/a) − cos(4πy/a)（左侧）；在中间只剩 cos(4πx/a)，即竖直线。明暗区域：符号相反；线条：节线。",
    "paireMelange": "混合 s：cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "(4, 0) 模式与其简并对混合后的图形",
    "moireTitre": "奇偶性作为两个 ±1 网格的叠加",
    "moireAide": "每个网格都是一张棋盘：格 (i, j) 的奇偶性 (−1)^(i + j)。二者的乘积在两者一致处为 +1，不一致处为 −1：这就是比特的同或（XNOR），如同两片正交的偏振片。将其中一个稍作平移或旋转，就会出现莫尔条纹。",
    "moireAngle": "第二个网格的旋转角（度）",
    "moirePeriode": "第二个网格的周期（占第一个的百分比）",
    "moireA": "网格 A",
    "moireB": "网格 B",
    "moireProduit": "乘积 A × B（XNOR）",
    "moireAlt": "两个 ±1 网格的乘积",
    "clesTitre": "按密钥读取",
    "clesAide": "仅作显示：轴记号的密钥（72 个去重密钥，奇偶性自角格起算，秩为 70），其和可还原所选图案的图形（若存在）。本页不断言密钥与频率之间存在任何联系。",
    "clesNatures": {
      "D+": "对角线 x + y",
      "D-": "对角线 y − x",
      "H": "水平线",
      "V": "垂直线"
    },
    "clesFigure": {
      "figure": "图案图形",
      "V": "V 类（紫）",
      "O": "O 类（橙）",
      "M": "M 类（品红）"
    },
    "clesActives": "{n} 个启用的密钥：{liste}",
    "clesAucune": "无密钥（空图形）",
    "clesComplement": "（至多相差一个补集）",
    "clesHors": "此图形不是密钥之和：它落在密钥所生成的空间之外。",
    "clesMotif": "第 {i} 个图案，共 {n} 个，图案集 {collection}。",
    "clesOrdre12": "按密钥读取仅适用于 12 阶。",
    "loiTitre": "圆环的频率定律",
    "loiChoix": {
      "racine": "为听觉压缩的标度",
      "plaque": "真实板的定律"
    },
    "loiAide": "压缩标度：f = 参考频率 × √K / 2（初始设置）。板的定律：f = c × K，与真实的板相同（3 毫米铝板，48 厘米：c = 31.85 Hz）。在 12 阶，范围为 32 至 2 293 Hz；高于奈奎斯特频率 0.9 倍的圆环与以前一样被忽略。起音检测器和色调跟踪保持不变。",
    "loiC": "c（每单位 m² + n² 的赫兹数）",
    "figureTitre": "图形（符号视图与线条视图）",
    "figureChoix": {
      "motif": "所选图案的",
      "son": "声音的",
      "ecart": "两者（差异）"
    },
    "figureAide": "所选图案的：所选图案的 Chladni 图形（初始设置）。声音的：各圆环的波之和，按声音在其中投入的能量加权，不经过任何图案。两者：这两个图形不同的位置。声音不提供相位：相位一律设为零。",
    "sceneTitre": "舞台",
    "projection": "打开投影窗口",
    "sceneAide": "全屏始终启动已确认的窗口，而不是试用窗口；控件和光标会在 3 秒后隐藏。按 Esc 返回。投影窗口是独立的：可拖到第二块屏幕或投影仪上。",
    "projectionBloquee": "投影窗口被浏览器拦截。请允许本站的弹出窗口，然后重试。",
    "veille": "浏览器允许时，播放期间屏幕保持常亮。",
    "enregTitre": "录制",
    "enreg": "录制 15 秒",
    "enregEnCours": "录制中：{s} 秒",
    "format916": "9:16（Reels、Shorts、TikTok）",
    "format45": "4:5（发布）",
    "format11": "1:1（方形）",
    "formatVideo": "视频格式",
    "signature": "视频底部的“{texte}”横幅",
    "enregPret": "视频已录制：下载已开始。",
    "enregWebm": "您的浏览器不能写出 MP4：视频为 WebM 格式。若要转为 MP4（Instagram、TikTok），请使用转换器或 ffmpeg：ffmpeg -i 文件.webm 文件.mp4。",
    "enregAac": "MP4 中的 AAC 音频：各处均可播放（iPhone、QuickTime、发布类应用）。",
    "enregOpusAvant": "此浏览器以 Opus 写入 MP4 的音频：在 iPhone、QuickTime 或某些发布类应用中可能无法播放（较新的桌面版 Chrome：AAC）。",
    "enregOpus": "Opus 音频：在 iPhone、QuickTime 或某些发布类应用中可能无法播放。如需 AAC 音轨：ffmpeg -i 文件.mp4 -c:v copy -c:a aac 输出.mp4。",
    "enregIndispo": "此浏览器不支持视频录制。",
    "enregSansSource": "请先播放声音：静音不会被录制。",
    "enregErreur": "录制无法开始：{message}",
    "raccourcisTitre": "键盘快捷键",
    "raccourcis": [
      [
        "1 – 3",
        "试用视图：符号、节线、单元"
      ],
      [
        "空格键",
        "下一种驱动方式（试用）"
      ],
      [
        "P",
        "暂停画面"
      ],
      [
        "V",
        "确认试用"
      ],
      [
        "F",
        "全屏（已确认的窗口）"
      ],
      [
        "R",
        "录制 15 秒"
      ]
    ],
    "infoMotif": "第 {i} 个图案，共 {n} 个",
    "infoImages": "{fps} 帧/秒",
    "infoResolution": "已降低分辨率",
    "semaineTitre": "本周",
    "semaineMention": "由 MC Claude 借助人工智能创作的音乐。",
    "semaineTiers": "点击海报会加载 YouTube 或 TikTok 的播放器：这是第三方服务，届时会收到您的访问信息。在此之前不会加载任何内容。",
    "jourTitre": "第 {n} 天——{tonalite}",
    "datePub": "发布于 {date}",
    "bientot": "即将推出",
    "lire": "播放第 {n} 天的视频，{tonalite}",
    "lireTiktok": "在此播放（TikTok）",
    "voirYoutube": "在 YouTube 观看",
    "voirTiktok": "在 TikTok 观看",
    "afficheAlt": "第 {n} 天的海报——{tonalite}",
    "lecteurTitre": "第 {n} 天的视频",
    "voirAussiTitre": "另请参阅",
    "voirAussi": [
      {
        "href": "/galerie-bicolore.html",
        "titre": "双色图库",
        "texte": "由轴生成、能在立方体上闭合的双色图案：读取粒度、铺排、导出。（法文页面）"
      },
      {
        "href": "/galerie-patterns-unifies.html",
        "titre": "三色图库",
        "texte": "由色调混合生成的统一图案：选中一个图案即可查看其铺排效果。（法文页面）"
      },
      {
        "href": "/fonds-ecran.html",
        "titre": "壁纸",
        "texte": "全屏织物壁纸，可随声音变化，也可切换为冥想模式。（法文页面）"
      },
      {
        "href": "/zh/animations/",
        "titre": "动画图库",
        "texte": "各个背景集合的动画，可观看，也可下载为 MP4。"
      },
      {
        "href": "/chladni.html",
        "titre": "Chladni",
        "texte": "图形、音阶与频率：把图案的词汇与板的振动模式联系起来的页面。（法文页面）"
      },
      {
        "href": "/zh/book/",
        "titre": "本书",
        "texte": "La Livrée d'Hermès 在线阅读，逐页呈现，并附免费 PDF。"
      }
    ]
  },
  ru: {
    "titrePage": "Увидеть свою музыку — La Livrée d'Hermès",
    "description": "Увидеть свою музыку: выберите композицию, файл или микрофон и посмотрите на фигуру Хладни, которую рисует звук, а затем на узор La Livrée d'Hermès, который больше всего на неё похож. Запишите 15 секунд со звуком.",
    "ariane": "Увидеть свою музыку",
    "h1": "Увидеть свою музыку",
    "intro": "У каждой музыки есть подпись: то, как её энергия распределяется по частотам. Выберите композицию, файл или микрофон: страница измеряет эту энергию на частотах каждого круга мод квадратной пластины, а затем ищет среди унифицированных узоров La Livrée d'Hermès тот, чей спектр больше всего на неё похож. Выбор основан на сходстве двух спектров, а не на музыкальном законе: узор не «выражает» композицию.",
    "discretion": "Ничто не покидает ваш браузер: файл, микрофон и захваченный звук анализируются на месте и никуда не отправляются.",
    "flash": "Внимание: изображения могут быстро меняться и мигать. Параметр «уменьшить быстрые изменения» замедляет их.",
    "sonTitre": "Звук",
    "sonChoix": "Звук",
    "morceau": "Готовая композиция {n} — {note}",
    "notes": {
      "j1": "до-диез",
      "j2": "ля",
      "j3": "ре",
      "j4": "ми",
      "j5": "соль",
      "j6": "си",
      "j7": "до"
    },
    "tonalites": {
      "do dièse mineur": "до-диез минор",
      "la mineur": "ля минор",
      "ré mineur": "ре минор",
      "mi mineur": "ми минор",
      "sol mineur": "соль минор",
      "si mineur": "си минор",
      "do mineur": "до минор"
    },
    "sourceFichier": "Мой аудиофайл…",
    "sourceMicro": "Микрофон",
    "sourceEssai": "Пробная музыка",
    "sourceOnglet": "Звук вкладки",
    "lecture": "Воспроизвести",
    "pause": "Пауза",
    "arreter": "Остановить",
    "entree": "Аудиовход",
    "entreeDefaut": "Вход по умолчанию",
    "entreeAide": "Микшерный пульт, звуковая карта: подключите её, разрешите микрофон и выберите её здесь.",
    "sensibilite": "Порог атак",
    "sensibiliteAide": "В стандартных отклонениях выше среднего: чем ниже, тем чувствительнее к смене нот.",
    "intervalle": "Минимальный интервал между двумя атаками (с)",
    "intervalleAide": "По умолчанию 0,45 с: не более примерно 133 атак в минуту. Уменьшите для быстрого темпа.",
    "mentionIA": "Готовые композиции созданы с помощью ИИ («Музыка, созданная с помощью ИИ — MC Claude.»).",
    "etatDepart": "Нажмите «Воспроизвести». Готовые композиции созданы с помощью ИИ.",
    "etatMorceau": "Готовая композиция, созданная с помощью ИИ.",
    "etatFichier": "Файл: {nom} (он остаётся в вашем браузере).",
    "etatMicro": "Микрофон включён.",
    "etatEntree": "Вход «{nom}» включён.",
    "etatOnglet": "Звук вкладки включён.",
    "etatEssai": "Пробная музыка.",
    "erreurMicroRefuse": "Доступ к микрофону запрещён. Разрешите его в настройках сайта (замок слева от адреса), затем снова нажмите «Воспроизвести». Можно также выбрать файл или готовую композицию.",
    "erreurMicroAbsent": "На этом устройстве нет доступного микрофона.",
    "erreurMicro": "Микрофон не запускается: {message}",
    "erreurOnglet": "Захват звука вкладки здесь невозможен. Нужен свежий браузер для компьютера (Chrome, Edge); на мобильных устройствах и в Safari его нет.",
    "erreurOngletSansSon": "Выбранная вкладка не передала звук. Начните снова и отметьте «Поделиться звуком вкладки».",
    "erreurFichier": "Этот файл нельзя прочитать как звук.",
    "erreurAudio": "Звук не удаётся запустить: {message}",
    "erreurDonnees": "Данные страницы не загружаются: {message}",
    "bandeManque": "в коллекции фонов не хватает полосы {id}",
    "microCoupe": "Источник остановился (устройство отключено или разрешение отозвано).",
    "silence": "Тишина: запустите звук.",
    "valide": "Утверждено",
    "valideTag": "текущее",
    "essai": "Проба",
    "essaiTag": "предпросмотр",
    "validerEssai": "Утвердить пробу",
    "annuler": "Отмена",
    "pleinEcran": "Полный экран",
    "quitterPleinEcran": "Выйти из полноэкранного режима",
    "fenetresAide": "Тёмный фон: утверждено. Золотая рамка: проба. Наведите курсор на параметр, чтобы увидеть его в пробе, щёлкните, чтобы оставить, затем «Утвердить пробу».",
    "fenetreValide": "Утверждённое окно",
    "fenetreEssai": "Окно пробы",
    "basculeValide": "Утверждено",
    "basculeEssai": "Проба",
    "pleinEcranIndispo": "Полноэкранный режим недоступен в этом браузере.",
    "pleinEcranRepli": "Этот браузер не предлагает встроенный полноэкранный режим для этого элемента: сцена занимает всё окно. Esc или кнопка закрывает её.",
    "groupes": {
      "mode": "Управление звуком",
      "fmt": "Формат (порядок)",
      "col": "Коллекция",
      "view": "Вид",
      "fond": "Вариант клетки",
      "pal": "Цвета"
    },
    "modes": {
      "image": [
        "Звук определяет изображение",
        "В каждый момент — узор, чей спектр больше всего похож на спектр музыки."
      ],
      "rythme": [
        "Звук определяет ритм",
        "Один шаг по цепочке близости при каждой атаке ноты."
      ],
      "chemin": [
        "Звук направляет путь",
        "Ритм решает, когда; спектр решает, к какому соседу."
      ],
      "octaves": [
        "Звук следует за октавой",
        "При каждой атаке — шаг по орбите доминирующей ноты: круг K, затем его октава 4K, затем 16K… — если такие круги существуют."
      ]
    },
    "vues": {
      "signes": [
        "Знаки",
        "Положительные зоны фигуры узора."
      ],
      "lignes": [
        "Узловые линии",
        "Линии, на которых фигура узора обращается в нуль."
      ],
      "pavage": [
        "Ячейки",
        "Сам узор в замощении 2 × 2."
      ]
    },
    "format": {
      "titre": "Порядок {n}",
      "detail": "Сетка {g} × {g} клеток",
      "bientot": "Порядок {n} (вторая поставка)"
    },
    "chargementOrdre": "Загрузка порядка {n}…",
    "ordreIndisponible": "Данные порядка {n} не загружаются: {message}",
    "collections": {
      "tri": [
        "Трёхцветные — унифицированные узоры",
        "{n} узоров (различные сетки 12 × 12)"
      ],
      "bi": [
        "Двухцветные — унифицированные узоры",
        "{n} узоров (два зеркала, читаются по правилу 3 октября)"
      ],
      "ce": [
        "Двухцветные — центральная симметрия",
        "{n} узоров (только центральная симметрия на 180°, читаются по правилу 3 октября)"
      ],
      "b1971128": [
        "Блок 1971128",
        "{n} узоров"
      ],
      "b16012838": [
        "Блок 16012838",
        "{n} узоров"
      ],
      "b3016090": [
        "Блок 3016090",
        "{n} узоров"
      ],
      "f613": [
        "Семейство 613",
        "{n} узоров"
      ],
      "f18": [
        "Семейство 18",
        "{n} узоров"
      ],
      "fpilote": [
        "Пилотное семейство",
        "{n} узоров"
      ],
      "p18": [
        "Крест 1·2",
        "{n} узоров"
      ],
      "p30": [
        "Крест 1·2",
        "{n} узоров"
      ]
    },
    "fond": "Полосы {id}",
    "fondAide": "В клетке четыре треугольника; каждый рисуется либо в состоянии 1 фона, либо в состоянии 0: тот же фон, повёрнутый на 90°.",
    "fondSeulementBicolore": "Вариант клетки применяется только к двухцветной коллекции.",
    "palettes": {
      "creme": [
        "Чернила и крем",
        "Цвета сайта."
      ],
      "monochrome": [
        "Серый и белый",
        "Монохром сайта."
      ],
      "perso": [
        "Мои цвета",
        "Выберите цвет узора и фона."
      ],
      "son": [
        "Оттенок следует за звуком",
        "Оттенок медленно меняется вместе с яркостью звука (по умолчанию выключено)."
      ]
    },
    "persoMotif": "Узор",
    "persoFond": "Фон",
    "tricoloreAide": "В трёхцветном режиме: V — самый тёмный (чернила), O — средне-серый, M — самый светлый (крем).",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "Настройки на лету",
    "lissage": "Сглаживание",
    "pulsationTitre": "Пульсация",
    "pulsations": {
      "attaque": "При каждой атаке",
      "temps": "На каждую долю",
      "quatre": "Каждые 4 пульсации"
    },
    "pulsationAide": "По умолчанию смена при каждой атаке. Когда обнаружена ровная пульсация, можно менять на каждую долю или каждые 4 пульсации.",
    "pulsationDetectee": "Обнаружена пульсация: {bpm} в минуту.",
    "pulsationAucune": "Ровной пульсации пока не обнаружено.",
    "calme": "Уменьшить быстрые изменения",
    "calmeAide": "Более долгий переход и более долгое удержание. Включается автоматически, если система просит меньше анимации.",
    "pente": "Компенсировать спад басов",
    "pauseImage": "Пауза изображения",
    "optionsTitre": "Параметры",
    "comprendreTitre": "Чтобы понять",
    "comprendreAide": "Два учебных вида, не связанных со звуком.",
    "paireTitre": "Мода (4, 0) и её вырожденная пара",
    "paireAide": "На квадратной пластине моды (4, 0) и (0, 4) имеют одну и ту же частоту: любая их комбинация тоже является модой этой частоты. Ползунок переходит от cos(4πx/a) + cos(4πy/a) (справа) к cos(4πx/a) − cos(4πy/a) (слева); посередине остаётся только cos(4πx/a) — вертикальные линии. Светлые и тёмные зоны: противоположные знаки; линия: узловая линия.",
    "paireMelange": "Смесь s: cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "Фигура моды (4, 0), смешанной с её вырожденной парой",
    "moireTitre": "Чётность как наложение двух решёток ±1",
    "moireAide": "Каждая решётка — шахматная доска: чётность (−1)^(i + j) клетки (i, j). Их произведение равно +1 там, где они совпадают, и −1 там, где различаются: это XNOR битов, как два скрещённых поляризатора. Если немного сдвинуть или повернуть одну из них, появляется муар.",
    "moireAngle": "Поворот второй решётки (градусы)",
    "moirePeriode": "Период второй решётки (в % от периода первой)",
    "moireA": "Решётка A",
    "moireB": "Решётка B",
    "moireProduit": "Произведение A × B (XNOR)",
    "moireAlt": "Произведение двух решёток ±1",
    "clesTitre": "Чтение в ключах",
    "clesAide": "Только показ: ключи записи осей (72 ключа без повторов, чётность считается от угловой клетки, ранг 70), сумма которых воспроизводит фигуру выбранного узора, если это возможно. Страница не утверждает никакой связи между ключом и частотой.",
    "clesNatures": {
      "D+": "диагональ x + y",
      "D-": "диагональ y − x",
      "H": "горизонталь",
      "V": "вертикаль"
    },
    "clesFigure": {
      "figure": "Фигура узора",
      "V": "Класс V (фиолетовый)",
      "O": "Класс O (оранжевый)",
      "M": "Класс M (пурпурный)"
    },
    "clesActives": "Активных ключей: {n}: {liste}",
    "clesAucune": "ни одного ключа (пустая фигура)",
    "clesComplement": " (с точностью до дополнения)",
    "clesHors": "Эта фигура не является суммой ключей: она лежит вне порождаемого ими пространства.",
    "clesMotif": "Узор {i} из {n}, коллекция {collection}.",
    "clesOrdre12": "Чтение в ключах относится только к порядку 12.",
    "loiTitre": "Закон частоты кругов",
    "loiChoix": {
      "racine": "Шкала, сжатая для слуха",
      "plaque": "Закон реальной пластины"
    },
    "loiAide": "Сжатая шкала: f = опорная частота × √K / 2 (начальная настройка). Закон пластины: f = c × K, как у реальной пластины (алюминий 3 мм, 48 см: c = 31,85 Гц). В порядке 12 — от 32 до 2 293 Гц; круги выше 0,9 × частоты Найквиста игнорируются, как и раньше. Детектор атак и слежение за оттенком не меняются.",
    "loiC": "c (Гц на единицу m² + n²)",
    "figureTitre": "Фигура (виды «Знаки» и «Линии»)",
    "figureChoix": {
      "motif": "Выбранного узора",
      "son": "Звука",
      "ecart": "Обе (разность)"
    },
    "figureAide": "Выбранного узора: фигура Хладни выбранного узора (начальная настройка). Звука: сумма волн каждого круга, взвешенных по энергии, которую звук в них вкладывает, без обращения к узору. Обе: места, где эти две фигуры различаются. Звук не даёт фаз: они приравниваются к нулю.",
    "sceneTitre": "Сцена",
    "projection": "Открыть окно проекции",
    "sceneAide": "Полный экран всегда запускает утверждённое окно, а не пробу; элементы управления и курсор скрываются через 3 секунды. Esc — вернуться. Окно проекции отдельное: перетащите его на второй экран или проектор.",
    "projectionBloquee": "Браузер заблокировал окно проекции. Разрешите всплывающие окна для этого сайта и повторите.",
    "veille": "Экран остаётся включённым во время воспроизведения, если браузер это позволяет.",
    "enregTitre": "Запись",
    "enreg": "Записать 15 с",
    "enregEnCours": "Запись: {s} с",
    "format916": "9:16 (Reels, Shorts, TikTok)",
    "format45": "4:5 (публикация)",
    "format11": "1:1 (квадрат)",
    "formatVideo": "Формат видео",
    "signature": "Полоса «{texte}» внизу видео",
    "enregPret": "Видео записано: загрузка началась.",
    "enregWebm": "Ваш браузер не записывает MP4: видео в формате WebM. Чтобы преобразовать его в MP4 (Instagram, TikTok), пропустите его через конвертер или ffmpeg: ffmpeg -i файл.webm файл.mp4.",
    "enregAac": "Звук AAC в MP4: воспроизводится везде (iPhone, QuickTime, приложения для публикации).",
    "enregOpusAvant": "Этот браузер записывает звук MP4 в Opus: он может не воспроизводиться на iPhone, в QuickTime или в некоторых приложениях для публикации (свежий Chrome для компьютера: AAC).",
    "enregOpus": "Звук Opus: может не воспроизводиться на iPhone, в QuickTime или в некоторых приложениях для публикации. Чтобы получить дорожку AAC: ffmpeg -i файл.mp4 -c:v copy -c:a aac выход.mp4.",
    "enregIndispo": "Запись видео недоступна в этом браузере.",
    "enregSansSource": "Сначала запустите звук: тишину не записывают.",
    "enregErreur": "Запись не запускается: {message}",
    "raccourcisTitre": "Сочетания клавиш",
    "raccourcis": [
      [
        "1 – 3",
        "Вид пробы: знаки, узловые линии, ячейки"
      ],
      [
        "Пробел",
        "Следующий режим управления (проба)"
      ],
      [
        "P",
        "Пауза изображения"
      ],
      [
        "V",
        "Утвердить пробу"
      ],
      [
        "F",
        "Полный экран (утверждённое окно)"
      ],
      [
        "R",
        "Записать 15 с"
      ]
    ],
    "infoMotif": "Узор {i} из {n}",
    "infoImages": "{fps} кадров/с",
    "infoResolution": "сниженное разрешение",
    "semaineTitre": "Неделя",
    "semaineMention": "Музыка, созданная с помощью ИИ — MC Claude.",
    "semaineTiers": "Щелчок по афише загружает плеер YouTube или TikTok — сторонний сервис, который при этом получает информацию о вашем визите. До этого ничего не загружается.",
    "jourTitre": "День {n} — {tonalite}",
    "datePub": "Опубликовано {date}",
    "bientot": "Скоро",
    "lire": "Воспроизвести видео дня {n}, {tonalite}",
    "lireTiktok": "Смотреть здесь (TikTok)",
    "voirYoutube": "Смотреть на YouTube",
    "voirTiktok": "Смотреть в TikTok",
    "afficheAlt": "Афиша дня {n} — {tonalite}",
    "lecteurTitre": "Видео дня {n}",
    "voirAussiTitre": "Смотрите также",
    "voirAussi": [
      {
        "href": "/galerie-bicolore.html",
        "titre": "Двухцветная галерея",
        "texte": "Двухцветные узоры, порождённые осями и замыкающиеся на кубе: зерно, замощение, экспорт. (Страница на французском.)"
      },
      {
        "href": "/galerie-patterns-unifies.html",
        "titre": "Трёхцветная галерея",
        "texte": "Унифицированные узоры, порождённые смешением оттенков: выберите узор, чтобы увидеть его замощение. (Страница на французском.)"
      },
      {
        "href": "/fonds-ecran.html",
        "titre": "Обои",
        "texte": "Полноэкранные текстильные обои, реагирующие на звук или работающие в медитативном режиме. (Страница на французском.)"
      },
      {
        "href": "/ru/animations/",
        "titre": "Галерея анимаций",
        "texte": "Анимации коллекций фонов: можно смотреть и скачивать в формате MP4."
      },
      {
        "href": "/chladni.html",
        "titre": "Chladni",
        "texte": "Фигуры, звукоряды и частоты: страница, связывающая словарь узоров с модами пластины. (Страница на французском.)"
      },
      {
        "href": "/ru/book/",
        "titre": "Книга",
        "texte": "La Livrée d'Hermès онлайн, страница за страницей, с бесплатным PDF."
      }
    ]
  },
  pt: {
    "titrePage": "Ver a sua música — La Livrée d'Hermès",
    "description": "Ver a sua música: escolha uma peça, um ficheiro ou o microfone e veja a figura de Chladni que o som desenha e, depois, o padrão de La Livrée d'Hermès que mais se lhe assemelha. Grave 15 segundos com o som.",
    "ariane": "Ver a sua música",
    "h1": "Ver a sua música",
    "intro": "Cada música tem uma assinatura: a forma como a sua energia se reparte pelas frequências. Escolha uma peça, um ficheiro ou o microfone: a página mede essa energia nas frequências de cada círculo de modos de uma placa quadrada e procura, entre os padrões unificados de La Livrée d'Hermès, aquele cujo espetro mais se lhe assemelha. A escolha assenta na semelhança de dois espetros, não numa lei musical: um padrão não «exprime» uma peça.",
    "discretion": "Nada sai do seu navegador: o ficheiro, o microfone e o áudio captado são analisados no próprio aparelho e não são enviados para parte nenhuma.",
    "flash": "Atenção: as imagens podem mudar depressa e piscar. A opção «reduzir as mudanças rápidas» abranda-as.",
    "sonTitre": "O som",
    "sonChoix": "Som",
    "morceau": "Peça fornecida {n} — {note}",
    "notes": {
      "j1": "dó sustenido",
      "j2": "lá",
      "j3": "ré",
      "j4": "mi",
      "j5": "sol",
      "j6": "si",
      "j7": "dó"
    },
    "tonalites": {
      "do dièse mineur": "dó sustenido menor",
      "la mineur": "lá menor",
      "ré mineur": "ré menor",
      "mi mineur": "mi menor",
      "sol mineur": "sol menor",
      "si mineur": "si menor",
      "do mineur": "dó menor"
    },
    "sourceFichier": "O meu ficheiro de áudio…",
    "sourceMicro": "Microfone",
    "sourceEssai": "Música de teste",
    "sourceOnglet": "Áudio de um separador",
    "lecture": "Reproduzir",
    "pause": "Pausa",
    "arreter": "Parar",
    "entree": "Entrada de áudio",
    "entreeDefaut": "Entrada predefinida",
    "entreeAide": "Mesa de mistura, placa de som: ligue-a, autorize o microfone e escolha-a aqui.",
    "sensibilite": "Limiar dos ataques",
    "sensibiliteAide": "Em desvios-padrão acima da média: mais baixo, mais sensível às mudanças de nota.",
    "intervalle": "Intervalo mínimo entre dois ataques (s)",
    "intervalleAide": "0,45 s por predefinição: no máximo cerca de 133 ataques por minuto. Baixe-o para um andamento rápido.",
    "mentionIA": "As peças fornecidas são compostas com a ajuda da IA («Música composta com IA por MC Claude.»).",
    "etatDepart": "Prima Reproduzir. As peças fornecidas são compostas com a ajuda da IA.",
    "etatMorceau": "Peça fornecida, composta com a ajuda da IA.",
    "etatFichier": "Ficheiro: {nom} (fica no seu navegador).",
    "etatMicro": "Microfone ativo.",
    "etatEntree": "Entrada «{nom}» ativa.",
    "etatOnglet": "Áudio de um separador ativo.",
    "etatEssai": "Música de teste.",
    "erreurMicroRefuse": "O microfone está bloqueado. Autorize-o nas definições do site (o cadeado, à esquerda do endereço) e clique de novo em Reproduzir. Pode também escolher um ficheiro ou uma peça.",
    "erreurMicroAbsent": "Não há nenhum microfone disponível neste aparelho.",
    "erreurMicro": "O microfone não arranca: {message}",
    "erreurOnglet": "A captação do áudio de um separador não é possível aqui. Exige um navegador de computador recente (Chrome, Edge); não existe em telemóvel nem no Safari.",
    "erreurOngletSansSon": "O separador escolhido não forneceu som. Recomece e marque «Partilhar o áudio do separador».",
    "erreurFichier": "Este ficheiro não pode ser lido como um som.",
    "erreurAudio": "O som não consegue arrancar: {message}",
    "erreurDonnees": "Os dados da página não carregam: {message}",
    "bandeManque": "falta a banda {id} na coleção de fundos",
    "microCoupe": "A fonte parou (dispositivo desligado ou autorização retirada).",
    "silence": "Silêncio: inicie um som.",
    "valide": "Validada",
    "valideTag": "em curso",
    "essai": "Ensaio",
    "essaiTag": "pré-visualização",
    "validerEssai": "Validar o ensaio",
    "annuler": "Cancelar",
    "pleinEcran": "Ecrã inteiro",
    "quitterPleinEcran": "Sair do ecrã inteiro",
    "fenetresAide": "Fundo escuro: validada. Moldura dourada: em ensaio. Passe o cursor por cima de uma opção para a ver no ensaio, clique para a manter e depois «Validar o ensaio».",
    "fenetreValide": "Janela validada",
    "fenetreEssai": "Janela de ensaio",
    "basculeValide": "Validada",
    "basculeEssai": "Ensaio",
    "pleinEcranIndispo": "O ecrã inteiro não está disponível neste navegador.",
    "pleinEcranRepli": "Este navegador não oferece ecrã inteiro nativo para este elemento: a cena cobre a janela. Esc ou o botão fecha-a.",
    "groupes": {
      "mode": "Controlo do som",
      "fmt": "Formato (ordem)",
      "col": "Coleção",
      "view": "Vista",
      "fond": "Variante de casa",
      "pal": "Cores"
    },
    "modes": {
      "image": [
        "O som define a imagem",
        "A cada instante, o padrão cujo espetro mais se assemelha ao da música."
      ],
      "rythme": [
        "O som define o ritmo",
        "Um passo na cadeia de proximidade a cada ataque de nota."
      ],
      "chemin": [
        "O som guia o caminho",
        "O ritmo decide quando, o espetro decide para que vizinho."
      ],
      "octaves": [
        "O som segue a oitava",
        "A cada ataque, um passo na órbita da nota dominante: o círculo K, depois a sua oitava 4K, depois 16K…, quando esses círculos existem."
      ]
    },
    "vues": {
      "signes": [
        "Sinais",
        "As zonas positivas da figura do padrão."
      ],
      "lignes": [
        "Linhas nodais",
        "As linhas onde a figura do padrão se anula."
      ],
      "pavage": [
        "Células",
        "O próprio padrão, em pavimentação 2 × 2."
      ]
    },
    "format": {
      "titre": "Ordem {n}",
      "detail": "Grelha de {g} × {g} casas",
      "bientot": "Ordem {n} (segunda entrega)"
    },
    "chargementOrdre": "A carregar a ordem {n}…",
    "ordreIndisponible": "Os dados da ordem {n} não carregam: {message}",
    "collections": {
      "tri": [
        "Tricolor — padrões unificados",
        "{n} padrões (grelhas 12 × 12 distintas)"
      ],
      "bi": [
        "Bicolor — padrões unificados",
        "{n} padrões (dois espelhos, legíveis pela regra de 3 de outubro)"
      ],
      "ce": [
        "Bicolor — simetria central",
        "{n} padrões (apenas simetria central de 180°, legíveis pela regra de 3 de outubro)"
      ],
      "b1971128": [
        "Bloco 1971128",
        "{n} padrões"
      ],
      "b16012838": [
        "Bloco 16012838",
        "{n} padrões"
      ],
      "b3016090": [
        "Bloco 3016090",
        "{n} padrões"
      ],
      "f613": [
        "Família 613",
        "{n} padrões"
      ],
      "f18": [
        "Família 18",
        "{n} padrões"
      ],
      "fpilote": [
        "Família piloto",
        "{n} padrões"
      ],
      "p18": [
        "Cruz 1·2",
        "{n} padrões"
      ],
      "p30": [
        "Cruz 1·2",
        "{n} padrões"
      ]
    },
    "fond": "Bandas {id}",
    "fondAide": "Uma casa leva quatro triângulos; cada um é desenhado com o estado 1 do fundo ou com o estado 0: o mesmo fundo rodado 90°.",
    "fondSeulementBicolore": "A variante de casa só se aplica à coleção bicolor.",
    "palettes": {
      "creme": [
        "Tinta e creme",
        "As cores do site."
      ],
      "monochrome": [
        "Cinzento e branco",
        "O monocromático do site."
      ],
      "perso": [
        "As minhas cores",
        "Escolha o padrão e o fundo."
      ],
      "son": [
        "O tom segue o som",
        "O tom desliza lentamente com o brilho do som (desativado por predefinição)."
      ]
    },
    "persoMotif": "Padrão",
    "persoFond": "Fundo",
    "tricoloreAide": "Em tricolor: V o mais escuro (tinta), O cinzento médio, M o mais claro (creme).",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "Definições em direto",
    "lissage": "Suavização",
    "pulsationTitre": "Pulsação",
    "pulsations": {
      "attaque": "A cada ataque",
      "temps": "A cada tempo",
      "quatre": "A cada 4 pulsações"
    },
    "pulsationAide": "Por predefinição, uma mudança a cada ataque. Quando é detetada uma pulsação regular, pode mudar a cada tempo ou a cada 4 pulsações.",
    "pulsationDetectee": "Pulsação detetada: {bpm} por minuto.",
    "pulsationAucune": "Nenhuma pulsação regular detetada por agora.",
    "calme": "Reduzir as mudanças rápidas",
    "calmeAide": "Uma transição mais longa e uma permanência maior. Ativado por omissão se o seu sistema pedir menos animações.",
    "pente": "Compensar a inclinação dos graves",
    "pauseImage": "Pausa da imagem",
    "optionsTitre": "Opções",
    "comprendreTitre": "Para compreender",
    "comprendreAide": "Duas vistas pedagógicas, sem relação com o som.",
    "paireTitre": "O modo (4, 0) e o seu par degenerado",
    "paireAide": "Numa placa quadrada, os modos (4, 0) e (0, 4) têm a mesma frequência: qualquer combinação é também um modo dessa frequência. O cursor passa de cos(4πx/a) + cos(4πy/a) (à direita) a cos(4πx/a) − cos(4πy/a) (à esquerda); ao meio só resta cos(4πx/a), linhas verticais. Zonas claras e escuras: sinais opostos; traço: linha nodal.",
    "paireMelange": "Mistura s: cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "Figura do modo (4, 0) misturado com o seu par degenerado",
    "moireTitre": "A paridade como sobreposição de duas redes de ±1",
    "moireAide": "Cada rede é um tabuleiro: a paridade (−1)^(i + j) da casa (i, j). O seu produto vale +1 onde as duas concordam e −1 onde diferem: é o XNOR dos bits, como dois polarizadores cruzados. Deslocando ou rodando um pouco uma das duas, surge um moiré.",
    "moireAngle": "Rotação da segunda rede (graus)",
    "moirePeriode": "Período da segunda rede (em % do da primeira)",
    "moireA": "Rede A",
    "moireB": "Rede B",
    "moireProduit": "Produto A × B (XNOR)",
    "moireAlt": "Produto de duas redes de ±1",
    "clesTitre": "Leitura em chaves",
    "clesAide": "Apenas visualização: as chaves da nota dos eixos (72 chaves sem duplicados, paridade contada a partir da casa de canto, característica 70) cuja soma devolve a figura do padrão escolhido, quando existe. A página não afirma nenhuma ligação entre uma chave e uma frequência.",
    "clesNatures": {
      "D+": "diagonal x + y",
      "D-": "diagonal y − x",
      "H": "horizontal",
      "V": "vertical"
    },
    "clesFigure": {
      "figure": "Figura do padrão",
      "V": "Classe V (violeta)",
      "O": "Classe O (laranja)",
      "M": "Classe M (magenta)"
    },
    "clesActives": "{n} chaves ativas: {liste}",
    "clesAucune": "nenhuma chave (figura vazia)",
    "clesComplement": " (a menos do complemento)",
    "clesHors": "Esta figura não é uma soma de chaves: sai do espaço que elas geram.",
    "clesMotif": "Padrão {i} de {n}, coleção {collection}.",
    "clesOrdre12": "A leitura em chaves só diz respeito à ordem 12.",
    "loiTitre": "Lei de frequência dos círculos",
    "loiChoix": {
      "racine": "Escala comprimida para o ouvido",
      "plaque": "Lei da placa real"
    },
    "loiAide": "Escala comprimida: f = frequência de referência × √K / 2 (definição inicial). Lei da placa: f = c × K, como uma placa real (alumínio de 3 mm, 48 cm: c = 31,85 Hz). Na ordem 12, de 32 a 2 293 Hz; os círculos acima de 0,9 × a frequência de Nyquist são ignorados, como antes. O detetor de ataques e o seguimento do tom não mudam.",
    "loiC": "c (Hz por unidade de m² + n²)",
    "figureTitre": "Figura (vistas Sinais e Linhas)",
    "figureChoix": {
      "motif": "Do padrão escolhido",
      "son": "Do som",
      "ecart": "As duas (diferença)"
    },
    "figureAide": "Do padrão escolhido: a figura de Chladni do padrão escolhido (definição inicial). Do som: a soma das ondas de cada círculo, ponderadas pela energia que o som lá coloca, sem passar por um padrão. As duas: os locais onde estas duas figuras diferem. O som não fornece as fases: são postas a zero.",
    "sceneTitre": "A cena",
    "projection": "Abrir uma janela de projeção",
    "sceneAide": "O ecrã inteiro lança sempre a janela validada, nunca o ensaio; os controlos e o cursor ocultam-se ao fim de 3 segundos. Esc para voltar. A janela de projeção é separada: arraste-a para um segundo ecrã ou um projetor.",
    "projectionBloquee": "A janela de projeção foi bloqueada pelo navegador. Autorize as janelas de pop-up para este site e tente de novo.",
    "veille": "O ecrã mantém-se aceso durante a reprodução quando o navegador o permite.",
    "enregTitre": "Gravar",
    "enreg": "Gravar 15 s",
    "enregEnCours": "Gravação: {s} s",
    "format916": "9:16 (Reels, Shorts, TikTok)",
    "format45": "4:5 (publicação)",
    "format11": "1:1 (quadrado)",
    "formatVideo": "Formato do vídeo",
    "signature": "Faixa «{texte}» no fundo do vídeo",
    "enregPret": "Vídeo gravado: a transferência começou.",
    "enregWebm": "O seu navegador não escreve MP4: o vídeo está em formato WebM. Para o converter em MP4 (Instagram, TikTok), passe-o por um conversor ou pelo ffmpeg: ffmpeg -i ficheiro.webm ficheiro.mp4.",
    "enregAac": "Áudio AAC no MP4: lê-se em todo o lado (iPhone, QuickTime, aplicações de publicação).",
    "enregOpusAvant": "Este navegador escreve o áudio do MP4 em Opus: pode não se ler no iPhone, no QuickTime ou em algumas aplicações de publicação (Chrome de computador recente: AAC).",
    "enregOpus": "Áudio Opus: pode não se ler no iPhone, no QuickTime ou em algumas aplicações de publicação. Para uma pista AAC: ffmpeg -i ficheiro.mp4 -c:v copy -c:a aac saida.mp4.",
    "enregIndispo": "A gravação de vídeo não está disponível neste navegador.",
    "enregSansSource": "Inicie primeiro um som: não se grava o silêncio.",
    "enregErreur": "A gravação não arranca: {message}",
    "raccourcisTitre": "Atalhos de teclado",
    "raccourcis": [
      [
        "1 – 3",
        "Vista do ensaio: sinais, linhas nodais, células"
      ],
      [
        "Espaço",
        "Modo de controlo seguinte (ensaio)"
      ],
      [
        "P",
        "Pausa da imagem"
      ],
      [
        "V",
        "Validar o ensaio"
      ],
      [
        "F",
        "Ecrã inteiro (janela validada)"
      ],
      [
        "R",
        "Gravar 15 s"
      ]
    ],
    "infoMotif": "Padrão {i} de {n}",
    "infoImages": "{fps} imagens/s",
    "infoResolution": "resolução reduzida",
    "semaineTitre": "A semana",
    "semaineMention": "Música composta com IA por MC Claude.",
    "semaineTiers": "Um clique num cartaz carrega o leitor do YouTube ou do TikTok: um serviço de terceiros, que recebe então a sua visita. Nada é carregado antes.",
    "jourTitre": "Dia {n} — {tonalite}",
    "datePub": "Publicado em {date}",
    "bientot": "Em breve",
    "lire": "Reproduzir o vídeo do dia {n}, {tonalite}",
    "lireTiktok": "Reproduzir aqui (TikTok)",
    "voirYoutube": "Ver no YouTube",
    "voirTiktok": "Ver no TikTok",
    "afficheAlt": "Cartaz do dia {n} — {tonalite}",
    "lecteurTitre": "Vídeo do dia {n}",
    "voirAussiTitre": "Ver também",
    "voirAussi": [
      {
        "href": "/galerie-bicolore.html",
        "titre": "Galeria bicolor",
        "texte": "Os padrões bicolores gerados pelos eixos, fechados sobre o cubo: grão, pavimentação, exportação. (Página em francês.)"
      },
      {
        "href": "/galerie-patterns-unifies.html",
        "titre": "Galeria tricolor",
        "texte": "Os padrões unificados, gerados pela mistura de tons: escolha um padrão para ver a sua pavimentação. (Página em francês.)"
      },
      {
        "href": "/fonds-ecran.html",
        "titre": "Fundos de ecrã",
        "texte": "Fundos têxteis em ecrã inteiro, reativos ao som ou em modo meditativo. (Página em francês.)"
      },
      {
        "href": "/pt/animations/",
        "titre": "Galeria de animações",
        "texte": "As animações das coleções de fundos, para ver e descarregar em MP4."
      },
      {
        "href": "/chladni.html",
        "titre": "Chladni",
        "texte": "Figuras, escalas e frequências: a página que liga o vocabulário dos padrões aos modos de uma placa. (Página em francês.)"
      },
      {
        "href": "/pt/book/",
        "titre": "O livro",
        "texte": "La Livrée d'Hermès em linha, página a página, com o PDF gratuito."
      }
    ]
  },
  hi: {
    "titrePage": "अपने संगीत को देखें — La Livrée d'Hermès",
    "description": "अपने संगीत को देखें: कोई रचना, फ़ाइल या माइक्रोफ़ोन चुनें और देखें कि ध्वनि कौन-सी Chladni आकृति बनाती है, फिर La Livrée d'Hermès का वह पैटर्न जो उससे सबसे अधिक मिलता है। ध्वनि के साथ 15 सेकंड रिकॉर्ड करें।",
    "ariane": "अपने संगीत को देखें",
    "h1": "अपने संगीत को देखें",
    "intro": "हर संगीत का एक हस्ताक्षर होता है: उसकी ऊर्जा आवृत्तियों में किस तरह बँटी है। कोई रचना, फ़ाइल या माइक्रोफ़ोन चुनें: पृष्ठ वर्गाकार पट्टिका के मोड-वृत्तों की आवृत्तियों पर यह ऊर्जा मापता है, फिर La Livrée d'Hermès के एकीकृत पैटर्नों में वह पैटर्न खोजता है जिसका स्पेक्ट्रम उससे सबसे अधिक मिलता हो। चुनाव दो स्पेक्ट्रमों की समानता पर टिका है, किसी संगीत-नियम पर नहीं: कोई पैटर्न किसी रचना को “व्यक्त” नहीं करता।",
    "discretion": "आपके ब्राउज़र से कुछ भी बाहर नहीं जाता: फ़ाइल, माइक्रोफ़ोन और कैप्चर की गई ध्वनि वहीं विश्लेषित होती हैं और कहीं नहीं भेजी जातीं।",
    "flash": "सावधान: छवियाँ तेज़ी से बदल और झिलमिला सकती हैं। “तेज़ बदलाव घटाएँ” विकल्प उन्हें धीमा करता है।",
    "sonTitre": "ध्वनि",
    "sonChoix": "ध्वनि",
    "morceau": "उपलब्ध रचना {n} — {note}",
    "notes": {
      "j1": "सी शार्प",
      "j2": "ए",
      "j3": "डी",
      "j4": "ई",
      "j5": "जी",
      "j6": "बी",
      "j7": "सी"
    },
    "tonalites": {
      "do dièse mineur": "सी शार्प माइनर",
      "la mineur": "ए माइनर",
      "ré mineur": "डी माइनर",
      "mi mineur": "ई माइनर",
      "sol mineur": "जी माइनर",
      "si mineur": "बी माइनर",
      "do mineur": "सी माइनर"
    },
    "sourceFichier": "मेरी ऑडियो फ़ाइल…",
    "sourceMicro": "माइक्रोफ़ोन",
    "sourceEssai": "परीक्षण संगीत",
    "sourceOnglet": "किसी टैब की ध्वनि",
    "lecture": "चलाएँ",
    "pause": "रोकें",
    "arreter": "बंद करें",
    "entree": "ऑडियो इनपुट",
    "entreeDefaut": "डिफ़ॉल्ट इनपुट",
    "entreeAide": "मिक्सिंग डेस्क, साउंड कार्ड: उसे जोड़ें, माइक्रोफ़ोन की अनुमति दें, फिर उसे यहाँ चुनें।",
    "sensibilite": "आघात की सीमा",
    "sensibiliteAide": "औसत से ऊपर मानक विचलनों में: जितनी कम, उतनी अधिक संवेदनशील स्वर-परिवर्तनों के प्रति।",
    "intervalle": "दो आघातों के बीच न्यूनतम अंतराल (से.)",
    "intervalleAide": "डिफ़ॉल्ट 0.45 से.: अधिकतम लगभग 133 आघात प्रति मिनट। तेज़ गति के लिए इसे घटाएँ।",
    "mentionIA": "उपलब्ध रचनाएँ AI की सहायता से रची गई हैं (“Musique composée avec l'IA par MC Claude.” अर्थात् “MC Claude द्वारा AI से रचा गया संगीत।”)।",
    "etatDepart": "“चलाएँ” दबाएँ। उपलब्ध रचनाएँ AI की सहायता से रची गई हैं।",
    "etatMorceau": "उपलब्ध रचना, AI की सहायता से रची गई।",
    "etatFichier": "फ़ाइल: {nom} (वह आपके ब्राउज़र में ही रहती है)।",
    "etatMicro": "माइक्रोफ़ोन चालू है।",
    "etatEntree": "इनपुट “{nom}” चालू है।",
    "etatOnglet": "टैब की ध्वनि चालू है।",
    "etatEssai": "परीक्षण संगीत।",
    "erreurMicroRefuse": "माइक्रोफ़ोन अस्वीकृत है। साइट की सेटिंग में उसकी अनुमति दें (पते के बाईं ओर ताला), फिर दोबारा “चलाएँ” पर क्लिक करें। आप कोई फ़ाइल या उपलब्ध रचना भी चुन सकते हैं।",
    "erreurMicroAbsent": "इस उपकरण पर कोई माइक्रोफ़ोन उपलब्ध नहीं है।",
    "erreurMicro": "माइक्रोफ़ोन शुरू नहीं होता: {message}",
    "erreurOnglet": "यहाँ किसी टैब की ध्वनि कैप्चर करना संभव नहीं है। इसके लिए डेस्कटॉप का नया ब्राउज़र (Chrome, Edge) चाहिए; मोबाइल और Safari पर यह नहीं है।",
    "erreurOngletSansSon": "चुने गए टैब ने कोई ध्वनि नहीं दी। फिर से शुरू करें और “टैब की ध्वनि साझा करें” पर निशान लगाएँ।",
    "erreurFichier": "यह फ़ाइल ध्वनि के रूप में नहीं पढ़ी जा सकती।",
    "erreurAudio": "ध्वनि शुरू नहीं हो पा रही: {message}",
    "erreurDonnees": "पृष्ठ का डेटा लोड नहीं होता: {message}",
    "bandeManque": "पृष्ठभूमियों के संग्रह में पट्टी {id} नहीं है",
    "microCoupe": "स्रोत रुक गया (उपकरण निकाल दिया गया या अनुमति वापस ले ली गई)।",
    "silence": "मौन: कोई ध्वनि चलाएँ।",
    "valide": "पुष्ट",
    "valideTag": "वर्तमान",
    "essai": "परीक्षण",
    "essaiTag": "पूर्वावलोकन",
    "validerEssai": "परीक्षण को पुष्ट करें",
    "annuler": "रद्द करें",
    "pleinEcran": "पूर्ण स्क्रीन",
    "quitterPleinEcran": "पूर्ण स्क्रीन से बाहर निकलें",
    "fenetresAide": "गहरी पृष्ठभूमि: पुष्ट। सुनहरा फ़्रेम: परीक्षण में। परीक्षण में देखने के लिए किसी विकल्प पर कर्सर ले जाएँ, रखने के लिए क्लिक करें, फिर “परीक्षण को पुष्ट करें”।",
    "fenetreValide": "पुष्ट विंडो",
    "fenetreEssai": "परीक्षण विंडो",
    "basculeValide": "पुष्ट",
    "basculeEssai": "परीक्षण",
    "pleinEcranIndispo": "इस ब्राउज़र में पूर्ण स्क्रीन उपलब्ध नहीं है।",
    "pleinEcranRepli": "यह ब्राउज़र इस तत्व के लिए मूल पूर्ण स्क्रीन नहीं देता: मंच पूरी विंडो को ढक लेता है। Esc या बटन से बंद करें।",
    "groupes": {
      "mode": "ध्वनि द्वारा नियंत्रण",
      "fmt": "प्रारूप (कोटि)",
      "col": "संग्रह",
      "view": "दृश्य",
      "fond": "खाने का रूपांतर",
      "pal": "रंग"
    },
    "modes": {
      "image": [
        "ध्वनि छवि तय करती है",
        "हर क्षण वह पैटर्न, जिसका स्पेक्ट्रम संगीत के स्पेक्ट्रम से सबसे अधिक मिलता है।"
      ],
      "rythme": [
        "ध्वनि लय तय करती है",
        "स्वर के हर आघात पर निकटता की शृंखला में एक क़दम।"
      ],
      "chemin": [
        "ध्वनि मार्ग दिखाती है",
        "लय तय करती है कब, स्पेक्ट्रम तय करता है किस पड़ोसी की ओर।"
      ],
      "octaves": [
        "ध्वनि सप्तक का अनुसरण करती है",
        "हर आघात पर प्रमुख स्वर की कक्षा में एक क़दम: वृत्त K, फिर उसका सप्तक 4K, फिर 16K… जब ये वृत्त मौजूद हों।"
      ]
    },
    "vues": {
      "signes": [
        "चिह्न",
        "पैटर्न की आकृति के धनात्मक क्षेत्र।"
      ],
      "lignes": [
        "नोडीय रेखाएँ",
        "वे रेखाएँ जहाँ पैटर्न की आकृति शून्य हो जाती है।"
      ],
      "pavage": [
        "कोशिकाएँ",
        "स्वयं पैटर्न, 2 × 2 टाइलिंग में।"
      ]
    },
    "format": {
      "titre": "कोटि {n}",
      "detail": "{g} × {g} खानों का ग्रिड",
      "bientot": "कोटि {n} (दूसरी खेप)"
    },
    "chargementOrdre": "कोटि {n} लोड हो रही है…",
    "ordreIndisponible": "कोटि {n} का डेटा लोड नहीं होता: {message}",
    "collections": {
      "tri": [
        "त्रिवर्णी — एकीकृत पैटर्न",
        "{n} पैटर्न (भिन्न 12 × 12 ग्रिड)"
      ],
      "bi": [
        "द्विवर्णी — एकीकृत पैटर्न",
        "{n} पैटर्न (दो दर्पण, 3 अक्टूबर के नियम से पढ़ने योग्य)"
      ],
      "ce": [
        "द्विवर्णी — केंद्रीय सममिति",
        "{n} पैटर्न (केवल 180° की केंद्रीय सममिति, 3 अक्टूबर के नियम से पढ़ने योग्य)"
      ],
      "b1971128": [
        "ब्लॉक 1971128",
        "{n} पैटर्न"
      ],
      "b16012838": [
        "ब्लॉक 16012838",
        "{n} पैटर्न"
      ],
      "b3016090": [
        "ब्लॉक 3016090",
        "{n} पैटर्न"
      ],
      "f613": [
        "परिवार 613",
        "{n} पैटर्न"
      ],
      "f18": [
        "परिवार 18",
        "{n} पैटर्न"
      ],
      "fpilote": [
        "अग्रणी परिवार",
        "{n} पैटर्न"
      ],
      "p18": [
        "क्रॉस 1·2",
        "{n} पैटर्न"
      ],
      "p30": [
        "क्रॉस 1·2",
        "{n} पैटर्न"
      ]
    },
    "fond": "पट्टियाँ {id}",
    "fondAide": "एक खाने में चार त्रिभुज होते हैं; हर एक को पृष्ठभूमि की अवस्था 1 से बनाया जाता है, या अवस्था 0 से: वही पृष्ठभूमि 90° घुमाई हुई।",
    "fondSeulementBicolore": "खाने का रूपांतर केवल द्विवर्णी संग्रह पर लागू होता है।",
    "palettes": {
      "creme": [
        "स्याही और क्रीम",
        "साइट के रंग।"
      ],
      "monochrome": [
        "स्लेटी और सफ़ेद",
        "साइट का एकवर्ण रूप।"
      ],
      "perso": [
        "मेरे रंग",
        "पैटर्न और पृष्ठभूमि चुनें।"
      ],
      "son": [
        "रंगत ध्वनि के साथ चलती है",
        "रंगत ध्वनि की चमक के साथ धीरे-धीरे सरकती है (डिफ़ॉल्ट रूप से बंद)।"
      ]
    },
    "persoMotif": "पैटर्न",
    "persoFond": "पृष्ठभूमि",
    "tricoloreAide": "त्रिवर्णी में: V सबसे गहरा (स्याही), O मध्यम स्लेटी, M सबसे हल्का (क्रीम)।",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "चलते-चलते सेटिंग",
    "lissage": "चिकनाई",
    "pulsationTitre": "स्पंदन",
    "pulsations": {
      "attaque": "हर आघात पर",
      "temps": "हर ताल पर",
      "quatre": "हर 4 स्पंदनों पर"
    },
    "pulsationAide": "डिफ़ॉल्ट रूप से हर आघात पर बदलाव। जब नियमित स्पंदन पहचाना जाए, तो आप हर ताल पर या हर 4 स्पंदनों पर बदलाव चुन सकते हैं।",
    "pulsationDetectee": "स्पंदन पहचाना गया: {bpm} प्रति मिनट।",
    "pulsationAucune": "अभी कोई नियमित स्पंदन नहीं पहचाना गया।",
    "calme": "तेज़ बदलाव घटाएँ",
    "calmeAide": "लंबा फ़ेड और लंबा ठहराव। यदि आपका सिस्टम कम एनिमेशन माँगता है तो अपने-आप चालू रहता है।",
    "pente": "बास की ढलान की क्षतिपूर्ति करें",
    "pauseImage": "छवि रोकें",
    "optionsTitre": "विकल्प",
    "comprendreTitre": "समझने के लिए",
    "comprendreAide": "दो शैक्षिक दृश्य, जिनका ध्वनि से कोई संबंध नहीं।",
    "paireTitre": "मोड (4, 0) और उसकी अपभ्रष्ट जोड़ी",
    "paireAide": "वर्गाकार पट्टिका पर मोड (4, 0) और (0, 4) की आवृत्ति समान होती है: उनका कोई भी संयोजन भी उसी आवृत्ति का मोड है। स्लाइडर cos(4πx/a) + cos(4πy/a) (दाएँ) से cos(4πx/a) − cos(4πy/a) (बाएँ) तक जाता है; बीच में केवल cos(4πx/a) बचता है, यानी ऊर्ध्वाधर रेखाएँ। हल्के और गहरे क्षेत्र: विपरीत चिह्न; रेखा: नोडीय रेखा।",
    "paireMelange": "मिश्रण s: cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "अपनी अपभ्रष्ट जोड़ी से मिले मोड (4, 0) की आकृति",
    "moireTitre": "समता, ±1 के दो जालकों के अध्यारोपण के रूप में",
    "moireAide": "हर जालक एक शतरंज-पट है: खाने (i, j) की समता (−1)^(i + j)। उनका गुणनफल +1 होता है जहाँ दोनों मेल खाते हैं और −1 जहाँ भिन्न हों: यह बिटों का XNOR है, दो आर-पार रखे ध्रुवकों की तरह। किसी एक को थोड़ा खिसकाने या घुमाने पर मोआरे उभरता है।",
    "moireAngle": "दूसरे जालक का घुमाव (डिग्री)",
    "moirePeriode": "दूसरे जालक का आवर्त (पहले के % में)",
    "moireA": "जालक A",
    "moireB": "जालक B",
    "moireProduit": "गुणनफल A × B (XNOR)",
    "moireAlt": "±1 के दो जालकों का गुणनफल",
    "clesTitre": "कुंजियों में पठन",
    "clesAide": "केवल प्रदर्शन: अक्षों के संकेतन की कुंजियाँ (72 कुंजियाँ दोहराव हटाकर, समता कोने के खाने से गिनी हुई, कोटि 70) जिनका योग चुने गए पैटर्न की आकृति लौटाता है, जब ऐसा संभव हो। पृष्ठ किसी कुंजी और आवृत्ति के बीच कोई संबंध नहीं बताता।",
    "clesNatures": {
      "D+": "विकर्ण x + y",
      "D-": "विकर्ण y − x",
      "H": "क्षैतिज",
      "V": "ऊर्ध्वाधर"
    },
    "clesFigure": {
      "figure": "पैटर्न की आकृति",
      "V": "वर्ग V (बैंगनी)",
      "O": "वर्ग O (नारंगी)",
      "M": "वर्ग M (मैजेंटा)"
    },
    "clesActives": "{n} सक्रिय कुंजियाँ: {liste}",
    "clesAucune": "कोई कुंजी नहीं (खाली आकृति)",
    "clesComplement": " (पूरक तक)",
    "clesHors": "यह आकृति कुंजियों का योग नहीं है: यह उनसे बनने वाले समष्टि के बाहर है।",
    "clesMotif": "पैटर्न {i} / {n}, संग्रह {collection}।",
    "clesOrdre12": "कुंजियों में पठन केवल कोटि 12 पर लागू है।",
    "loiTitre": "वृत्तों का आवृत्ति-नियम",
    "loiChoix": {
      "racine": "कान के लिए संपीड़ित पैमाना",
      "plaque": "वास्तविक पट्टिका का नियम"
    },
    "loiAide": "संपीड़ित पैमाना: f = संदर्भ आवृत्ति × √K / 2 (आरंभिक सेटिंग)। पट्टिका का नियम: f = c × K, वास्तविक पट्टिका की तरह (3 मिमी का एल्युमीनियम, 48 सेमी: c = 31.85 हर्ट्ज़)। कोटि 12 पर 32 से 2 293 हर्ट्ज़ तक; नाइक्विस्ट आवृत्ति के 0.9 गुना से ऊपर के वृत्त पहले की तरह अनदेखे किए जाते हैं। आघात-संसूचक और रंगत का अनुसरण नहीं बदलते।",
    "loiC": "c (m² + n² की प्रति इकाई हर्ट्ज़)",
    "figureTitre": "आकृति (चिह्न और रेखा दृश्य)",
    "figureChoix": {
      "motif": "चुने गए पैटर्न की",
      "son": "ध्वनि की",
      "ecart": "दोनों (अंतर)"
    },
    "figureAide": "चुने गए पैटर्न की: चुने गए पैटर्न की Chladni आकृति (आरंभिक सेटिंग)। ध्वनि की: हर वृत्त की तरंगों का योग, उस ऊर्जा से भारित जो ध्वनि वहाँ डालती है, किसी पैटर्न से गुज़रे बिना। दोनों: वे स्थान जहाँ ये दोनों आकृतियाँ भिन्न हैं। ध्वनि कलाएँ नहीं देती: उन्हें शून्य रखा जाता है।",
    "sceneTitre": "मंच",
    "projection": "प्रक्षेपण विंडो खोलें",
    "sceneAide": "पूर्ण स्क्रीन हमेशा पुष्ट विंडो चलाती है, परीक्षण नहीं; नियंत्रण और कर्सर 3 सेकंड बाद छिप जाते हैं। लौटने के लिए Esc। प्रक्षेपण विंडो अलग है: उसे दूसरी स्क्रीन या प्रोजेक्टर पर खींच ले जाएँ।",
    "projectionBloquee": "ब्राउज़र ने प्रक्षेपण विंडो रोक दी। इस साइट के लिए पॉप-अप विंडो की अनुमति दें, फिर दोबारा करें।",
    "veille": "जब ब्राउज़र अनुमति दे, तो चलने के दौरान स्क्रीन जलती रहती है।",
    "enregTitre": "रिकॉर्ड करें",
    "enreg": "15 से. रिकॉर्ड करें",
    "enregEnCours": "रिकॉर्डिंग: {s} से.",
    "format916": "9:16 (Reels, Shorts, TikTok)",
    "format45": "4:5 (पोस्ट)",
    "format11": "1:1 (वर्गाकार)",
    "formatVideo": "वीडियो का प्रारूप",
    "signature": "वीडियो के नीचे “{texte}” पट्टी",
    "enregPret": "वीडियो रिकॉर्ड हो गया: डाउनलोड शुरू हो गया है।",
    "enregWebm": "आपका ब्राउज़र MP4 नहीं लिखता: वीडियो WebM प्रारूप में है। इसे MP4 में बदलने के लिए (Instagram, TikTok) किसी कनवर्टर या ffmpeg का उपयोग करें: ffmpeg -i फ़ाइल.webm फ़ाइल.mp4।",
    "enregAac": "MP4 में AAC ऑडियो: हर जगह चलता है (iPhone, QuickTime, प्रकाशन ऐप)।",
    "enregOpusAvant": "यह ब्राउज़र MP4 का ऑडियो Opus में लिखता है: यह iPhone, QuickTime या कुछ प्रकाशन ऐप पर शायद न चले (डेस्कटॉप का नया Chrome: AAC)।",
    "enregOpus": "Opus ऑडियो: iPhone, QuickTime या कुछ प्रकाशन ऐप पर शायद न चले। AAC ट्रैक के लिए: ffmpeg -i फ़ाइल.mp4 -c:v copy -c:a aac आउटपुट.mp4।",
    "enregIndispo": "इस ब्राउज़र में वीडियो रिकॉर्डिंग उपलब्ध नहीं है।",
    "enregSansSource": "पहले कोई ध्वनि चलाएँ: मौन रिकॉर्ड नहीं किया जाता।",
    "enregErreur": "रिकॉर्डिंग शुरू नहीं होती: {message}",
    "raccourcisTitre": "कीबोर्ड शॉर्टकट",
    "raccourcis": [
      [
        "1 – 3",
        "परीक्षण का दृश्य: चिह्न, नोडीय रेखाएँ, कोशिकाएँ"
      ],
      [
        "स्पेस",
        "अगला नियंत्रण-मोड (परीक्षण)"
      ],
      [
        "P",
        "छवि रोकें"
      ],
      [
        "V",
        "परीक्षण को पुष्ट करें"
      ],
      [
        "F",
        "पूर्ण स्क्रीन (पुष्ट विंडो)"
      ],
      [
        "R",
        "15 से. रिकॉर्ड करें"
      ]
    ],
    "infoMotif": "पैटर्न {i} / {n}",
    "infoImages": "{fps} फ़्रेम/से.",
    "infoResolution": "घटा हुआ रिज़ॉल्यूशन",
    "semaineTitre": "यह सप्ताह",
    "semaineMention": "MC Claude द्वारा AI से रचा गया संगीत।",
    "semaineTiers": "पोस्टर पर क्लिक करने से YouTube या TikTok का प्लेयर लोड होता है: एक तृतीय-पक्ष सेवा, जिसे तब आपकी विज़िट मिल जाती है। इससे पहले कुछ भी लोड नहीं होता।",
    "jourTitre": "दिन {n} — {tonalite}",
    "datePub": "{date} को प्रकाशित",
    "bientot": "जल्द ही",
    "lire": "दिन {n} का वीडियो चलाएँ, {tonalite}",
    "lireTiktok": "यहीं चलाएँ (TikTok)",
    "voirYoutube": "YouTube पर देखें",
    "voirTiktok": "TikTok पर देखें",
    "afficheAlt": "दिन {n} का पोस्टर — {tonalite}",
    "lecteurTitre": "दिन {n} का वीडियो",
    "voirAussiTitre": "यह भी देखें",
    "voirAussi": [
      {
        "href": "/galerie-bicolore.html",
        "titre": "द्विवर्णी दीर्घा",
        "texte": "अक्षों से बने और घन पर बंद द्विवर्णी पैटर्न: पठन-कण, टाइलिंग, निर्यात। (फ़्रेंच पृष्ठ)"
      },
      {
        "href": "/galerie-patterns-unifies.html",
        "titre": "त्रिवर्णी दीर्घा",
        "texte": "रंगों के मिश्रण से बने एकीकृत पैटर्न: उसकी टाइलिंग देखने के लिए एक पैटर्न चुनें। (फ़्रेंच पृष्ठ)"
      },
      {
        "href": "/fonds-ecran.html",
        "titre": "वॉलपेपर",
        "texte": "पूर्ण स्क्रीन पर वस्त्र-वॉलपेपर: ध्वनि पर प्रतिक्रिया करते हैं या ध्यान-मोड में चलते हैं। (फ़्रेंच पृष्ठ)"
      },
      {
        "href": "/hi/animations/",
        "titre": "एनिमेशन दीर्घा",
        "texte": "पृष्ठभूमि-संग्रहों के एनिमेशन, देखने और MP4 में डाउनलोड करने के लिए।"
      },
      {
        "href": "/chladni.html",
        "titre": "Chladni",
        "texte": "आकृतियाँ, स्वरग्राम और आवृत्तियाँ: वह पृष्ठ जो पैटर्नों की शब्दावली को पट्टिका के मोड से जोड़ता है। (फ़्रेंच पृष्ठ)"
      },
      {
        "href": "/hi/book/",
        "titre": "पुस्तक",
        "texte": "La Livrée d'Hermès ऑनलाइन, पृष्ठ-दर-पृष्ठ, मुफ़्त PDF के साथ।"
      }
    ]
  },
  // @langues:end
};
export const LANGUE_DEFAUT = 'fr';

/** La langue de la page : celle de <html lang> (« zh-Hans » → « zh », « pt-PT » → « pt »), jamais celle du navigateur ; le français si la langue n'a pas d'objet. */
export function langueDeLaPage() {
  const l = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang || LANGUE_DEFAUT).slice(0, 2).toLowerCase();
  return TEXTES[l] ? l : LANGUE_DEFAUT;
}
const LANGUE_PAGE = langueDeLaPage();

/** Un texte, avec ses {noms} remplacés ; une clé absente de la langue retombe sur le français, jamais sur une clé nue. */
export function texte(cle, vars = {}, langue = LANGUE_PAGE) {
  const t = (TEXTES[langue] && TEXTES[langue][cle] !== undefined ? TEXTES[langue] : TEXTES[LANGUE_DEFAUT])[cle];
  if (typeof t !== 'string') return t;
  return t.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
