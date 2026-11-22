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
    intro: 'Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Appuyez sur « Écouter » : la page mesure cette énergie, dessine la figure de Chladni du son et cherche, parmi les motifs de La Livrée d\'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n\'« exprime » pas un morceau.',
    discretion: 'Rien ne quitte votre navigateur : le fichier, le micro et l\'audio capturé sont analysés sur place et ne sont envoyés nulle part.',
    flash: 'Attention : les images peuvent changer vite et clignoter. Dans « Plus d\'options », le réglage « réduire les changements rapides » les ralentit.',

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

    // le démarrage simple, le partage, la fiabilité mobile (prompt 201)
    ecouter: 'Écouter',
    plusOptions: 'Plus d\'options',
    moinsOptions: 'Moins d\'options',
    animerFigure: 'Animer la figure',
    figerFigure: 'Figer la figure',
    figureFixeAide: 'animation arrêtée (réduction des mouvements demandée) : bouton « Animer la figure »',
    audioInterrompu: 'Le son a été interrompu (appel, autre application, veille). Appuyez sur « Écouter » pour reprendre.',
    image: 'Image',
    imagePrete: 'Image enregistrée : le téléchargement a commencé.',
    imageErreur: 'Impossible de produire l\'image.',
    partager: 'Partager',
    partageErreur: 'Le partage a échoué : {message}',
    copierLien: 'Copier le lien',
    lienCopie: 'Lien copié : {lien}',
    lienManuel: 'Copiez ce lien à la main : {lien}',
    appareilTitre: 'Informations sur l\'appareil',
    appareilAide: 'Une ligne de texte à renvoyer à l\'auteur en cas de problème : navigateur et système (famille et version seulement), état du son, enregistreur et formats vidéo, partage, écran. Rien n\'est envoyé : c\'est vous qui la copiez.',
    appareilLigne: 'Informations à copier',
    appareilCopier: 'Copier',
    appareilCopie: 'Informations copiées.',
    appareilManuel: 'Sélectionnez le texte et copiez-le à la main.',
    oui: 'oui',
    non: 'non',
    appareilSansContexte: 'pas encore créé',
    appareilSansEnregistreur: 'enregistreur absent',

    // la page lisible sans JavaScript : la section « Comment ça marche », l'image d'exemple, le message sans script (prompt 202)
    commentTitre: 'Comment ça marche',
    comment1: 'La page mesure l\'énergie du son aux fréquences des cercles de modes d\'une plaque carrée, dessine la figure de Chladni correspondante et cherche, parmi les motifs de La Livrée d\'Hermès, celui dont le spectre ressemble le plus à celui du son.',
    comment2: 'Une figure de Chladni est le dessin que prend le sable sur une plaque qui vibre : il se range le long des lignes qui ne bougent pas. Ici, la plaque est un carré.',
    comment3: 'Ici, « ressembler » veut dire que deux spectres sont proches : l\'énergie se répartit de la même façon entre les fréquences. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n\'« exprime » pas un morceau.',
    comment4: 'Les images et les vidéos enregistrées sont faites dans votre navigateur et se téléchargent sur votre appareil.',
    comment5: 'Appuyez sur « Écouter » : la page demande alors le micro, jamais avant ; sans micro, elle joue un morceau d\'exemple. Vous pouvez aussi choisir un autre morceau ou un fichier audio. Dans « Plus d\'options », vous pouvez enregistrer une image de la figure ou une vidéo de 15 secondes avec le son.',
    comment6: 'Contenus sous licence CC BY-NC 4.0, code sous licence AGPL v3 (licence commerciale sur demande). Auteur : Anibal Edelberto Amiot.',
    commentAuteur: 'À propos de l\'auteur',
    refAlt: 'Exemple de figure produite par la page : un damier de grands losanges noirs et crème, avec de petites formes rondes aux croisements.',
    refLegende: 'Exemple réel : après {s} secondes du morceau d\'exemple n° {m}, le motif n° {i} sur {n} est celui dont le spectre ressemble le plus à celui du son.',
    sansJs: 'L\'écoute demande JavaScript : activez-le pour entendre un morceau et voir la figure bouger. Le texte et l\'image d\'exemple ci-dessous se lisent sans lui.',
    figureAria: 'Figure du motif retenu : {nom}',

    entree: 'Entrée audio',
    entreeDefaut: 'Entrée par défaut',
    entreeAide: 'Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici.',
    sensibilite: 'Seuil des attaques',
    sensibiliteAide: 'En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes.',
    intervalle: 'Intervalle minimal entre deux attaques (s)',
    intervalleAide: '0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide.',
    mentionIA: 'Les morceaux fournis sont composés avec l\'aide de l\'IA (« Musique composée avec l\'IA par MC Claude. »).',
    etatDepart: 'Appuyez sur Écouter : le micro est demandé à ce moment-là, ou choisissez un morceau. Les morceaux fournis sont composés avec l\'aide de l\'IA.',
    etatMorceau: 'Morceau fourni, composé avec l\'aide de l\'IA.',
    etatFichier: 'Fichier : {nom} (il reste dans votre navigateur).',
    etatMicro: 'Micro actif.',
    etatEntree: 'Entrée « {nom} » active.',
    etatOnglet: 'Audio d\'un onglet actif.',
    etatEssai: 'Musique d\'essai.',
    erreurMicroRefuse: 'Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l\'adresse), puis cliquez de nouveau sur Écouter. Vous pouvez aussi choisir un fichier ou un morceau.',
    erreurMicroAbsent: 'Aucun micro n\'est disponible sur cet appareil.',
    erreurMicro: 'Le micro ne démarre pas : {message}',
    microRepliRefuse: 'Le micro est refusé : voici un morceau d\'exemple à la place. Pour utiliser le micro, autorisez-le dans les réglages du site (le cadenas, à gauche de l\'adresse), choisissez « Microphone » dans la liste des sources, puis appuyez sur Écouter.',
    microRepliAbsent: 'Aucun micro n\'est disponible sur cet appareil : voici un morceau d\'exemple à la place.',
    microRepliAutre: 'Le micro ne démarre pas ({message}) : voici un morceau d\'exemple à la place.',
    erreurOnglet: 'La capture d\'audio d\'un onglet n\'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari.',
    erreurOngletSansSon: 'L\'onglet choisi n\'a pas fourni de son. Recommencez et cochez « Partager l\'audio de l\'onglet ».',
    erreurFichier: 'Ce fichier ne peut pas être lu comme un son.',
    erreurAudio: 'Le son ne peut pas démarrer : {message}',
    erreurDonnees: 'Les données de la page ne se chargent pas : {message}',
    bandeManque: 'le fond « {id} » manque à la collection de fonds',
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
    fondGroupes: { aplat: 'Aplat', triangles: 'Triangles', bandes: 'Bandes' }, // les trois groupes visibles (prompts 220 et 225) ; les codes des fonds ne s'affichent jamais
    fondVariantes: { B3x: 'Trois bandes', B121x: 'Bande centrale', B11211Dx: 'Bandes obliques' }, // les variantes de « Bandes », quand plusieurs sont proposées
    fondAide: 'Une case porte quatre triangles ; chacun est dessiné avec le fond choisi, ou avec ses deux couleurs échangées.',
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
    "titrePage": "See your music: Chladni figure — La Livrée d'Hermès",
    "description": "See your music: pick a track, a file or the microphone, watch the Chladni figure the sound draws, then the La Livrée d'Hermès pattern that resembles it most.",
    "ariane": "See your music",
    "h1": "See your music",
    "intro": "Every piece of music has a signature: the way its energy is spread across frequencies. Press “Listen”: the page measures that energy, draws the Chladni figure of the sound and looks, among the La Livrée d'Hermès patterns, for the one whose spectrum resembles it most. The choice rests on the resemblance of two spectra, not on a law of music: a pattern does not “express” a piece.",
    "discretion": "Nothing leaves your browser: the file, the microphone and the captured audio are analysed on the spot and sent nowhere.",
    "flash": "Warning: the images can change fast and flicker. In “More options”, the “reduce rapid changes” setting slows them down.",
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
    "ecouter": "Listen",
    "plusOptions": "More options",
    "moinsOptions": "Fewer options",
    "animerFigure": "Animate the figure",
    "figerFigure": "Freeze the figure",
    "figureFixeAide": "animation stopped (reduced motion requested): “Animate the figure” button",
    "audioInterrompu": "The sound was interrupted (call, another app, sleep). Press “Listen” to resume.",
    "image": "Image",
    "imagePrete": "Image saved: the download has started.",
    "imageErreur": "The image could not be produced.",
    "partager": "Share",
    "partageErreur": "Sharing failed: {message}",
    "copierLien": "Copy the link",
    "lienCopie": "Link copied: {lien}",
    "lienManuel": "Copy this link by hand: {lien}",
    "appareilTitre": "Device information",
    "appareilAide": "One line of text to send back to the author if something goes wrong: browser and system (family and version only), sound state, recorder and video formats, sharing, screen. Nothing is sent: you copy it yourself.",
    "appareilLigne": "Information to copy",
    "appareilCopier": "Copy",
    "appareilCopie": "Information copied.",
    "appareilManuel": "Select the text and copy it by hand.",
    "oui": "yes",
    "non": "no",
    "appareilSansContexte": "not created yet",
    "appareilSansEnregistreur": "recorder missing",
    "commentTitre": "How it works",
    "comment1": "The page measures the sound's energy at the frequencies of the mode circles of a square plate, draws the corresponding Chladni figure and looks, among the La Livrée d'Hermès patterns, for the one whose spectrum most resembles that of the sound.",
    "comment2": "A Chladni figure is the drawing sand makes on a vibrating plate: it settles along the lines that do not move. Here, the plate is a square.",
    "comment3": "Here, “resemble” means that two spectra are close: the energy is spread across the frequencies in the same way. The choice rests on the resemblance of two spectra, not on a law of music: a pattern does not “express” a piece.",
    "comment4": "Recorded images and videos are made in your browser and downloaded to your device.",
    "comment5": "Press “Listen”: the page then asks for the microphone, never before; without a microphone, it plays an example track. You can also choose another track or an audio file. In “More options” you can record an image of the figure or a 15-second video with the sound.",
    "comment6": "Content under the CC BY-NC 4.0 licence, code under the AGPL v3 licence (commercial licence on request). Author: Anibal Edelberto Amiot.",
    "commentAuteur": "About the author",
    "refAlt": "Example of a figure produced by the page: a checkerboard of large black and cream diamonds, with small round shapes at the crossings.",
    "refLegende": "Real example: after {s} seconds of example track no. {m}, pattern no. {i} of {n} is the one whose spectrum most resembles the sound's.",
    "sansJs": "Listening needs JavaScript: turn it on to hear a track and see the figure move. The text and the example image below can be read without it.",
    "figureAria": "Figure of the chosen pattern: {nom}",
    "entree": "Audio input",
    "entreeDefaut": "Default input",
    "entreeAide": "Mixing desk, sound card: plug it in, allow the microphone, then choose it here.",
    "sensibilite": "Attack threshold",
    "sensibiliteAide": "In standard deviations above the mean: lower means more sensitive to note changes.",
    "intervalle": "Minimum interval between two attacks (s)",
    "intervalleAide": "0.45 s by default: at most about 133 attacks per minute. Lower it for a fast tempo.",
    "mentionIA": "The provided tracks are composed with the help of AI (“Music composed with AI by MC Claude.”).",
    "etatDepart": "Press Listen: the microphone is requested then, or choose a track. The provided tracks are composed with the help of AI.",
    "etatMorceau": "Provided track, composed with the help of AI.",
    "etatFichier": "File: {nom} (it stays in your browser).",
    "etatMicro": "Microphone on.",
    "etatEntree": "Input “{nom}” on.",
    "etatOnglet": "Tab audio on.",
    "etatEssai": "Test music.",
    "erreurMicroRefuse": "The microphone is blocked. Allow it in the site settings (the padlock, left of the address), then click Listen again. You can also choose a file or a track.",
    "erreurMicroAbsent": "No microphone is available on this device.",
    "erreurMicro": "The microphone does not start: {message}",
    "microRepliRefuse": "The microphone is blocked: here is an example track instead. To use the microphone, allow it in the site settings (the padlock, left of the address), choose “Microphone” in the list of sources, then press Listen.",
    "microRepliAbsent": "No microphone is available on this device: here is an example track instead.",
    "microRepliAutre": "The microphone does not start ({message}): here is an example track instead.",
    "erreurOnglet": "Capturing a tab’s audio is not possible here. It needs a recent desktop browser (Chrome, Edge); it is missing on mobile and on Safari.",
    "erreurOngletSansSon": "The chosen tab provided no sound. Try again and tick “Share tab audio”.",
    "erreurFichier": "This file cannot be read as a sound.",
    "erreurAudio": "The sound cannot start: {message}",
    "erreurDonnees": "The page data does not load: {message}",
    "bandeManque": "the ground “{id}” is missing from the collection of grounds",
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
    "fondGroupes": {
      "aplat": "Solid",
      "triangles": "Triangles",
      "bandes": "Stripes"
    },
    "fondVariantes": {
      "B3x": "Three stripes",
      "B121x": "Central stripe",
      "B11211Dx": "Diagonal stripes"
    },
    "fondAide": "A cell carries four triangles; each is drawn with the chosen ground, or with its two colours swapped.",
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
    "titrePage": "Ver tu música: figura de Chladni — La Livrée d'Hermès",
    "description": "Ver tu música: elige una pieza, un archivo o el micrófono, mira la figura de Chladni del sonido y el motivo de La Livrée d'Hermès más parecido. Graba 15 segundos.",
    "ariane": "Ver tu música",
    "h1": "Ver tu música",
    "intro": "Toda música tiene una firma: la manera en que su energía se reparte entre las frecuencias. Pulsa «Escuchar»: la página mide esa energía, dibuja la figura de Chladni del sonido y busca, entre los motivos de La Livrée d'Hermès, aquel cuyo espectro más se le parece. La elección se basa en el parecido de dos espectros, no en una ley musical: un motivo no «expresa» una pieza.",
    "discretion": "Nada sale de tu navegador: el archivo, el micrófono y el audio capturado se analizan en el propio equipo y no se envían a ninguna parte.",
    "flash": "Atención: las imágenes pueden cambiar rápido y parpadear. En «Más opciones», el ajuste «reducir los cambios rápidos» las ralentiza.",
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
    "ecouter": "Escuchar",
    "plusOptions": "Más opciones",
    "moinsOptions": "Menos opciones",
    "animerFigure": "Animar la figura",
    "figerFigure": "Detener la figura",
    "figureFixeAide": "animación detenida (se pidió reducir el movimiento): botón «Animar la figura»",
    "audioInterrompu": "Se interrumpió el sonido (llamada, otra aplicación, reposo). Pulsa «Escuchar» para reanudar.",
    "image": "Imagen",
    "imagePrete": "Imagen guardada: ha comenzado la descarga.",
    "imageErreur": "No se pudo generar la imagen.",
    "partager": "Compartir",
    "partageErreur": "No se pudo compartir: {message}",
    "copierLien": "Copiar el enlace",
    "lienCopie": "Enlace copiado: {lien}",
    "lienManuel": "Copia este enlace a mano: {lien}",
    "appareilTitre": "Información del dispositivo",
    "appareilAide": "Una línea de texto para enviar al autor si algo falla: navegador y sistema (solo familia y versión), estado del sonido, grabadora y formatos de vídeo, compartir, pantalla. No se envía nada: la copias tú mismo.",
    "appareilLigne": "Información para copiar",
    "appareilCopier": "Copiar",
    "appareilCopie": "Información copiada.",
    "appareilManuel": "Selecciona el texto y cópialo a mano.",
    "oui": "sí",
    "non": "no",
    "appareilSansContexte": "aún no creado",
    "appareilSansEnregistreur": "grabadora ausente",
    "commentTitre": "Cómo funciona",
    "comment1": "La página mide la energía del sonido en las frecuencias de los círculos de modos de una placa cuadrada, dibuja la figura de Chladni correspondiente y busca, entre los motivos de La Livrée d'Hermès, aquel cuyo espectro más se parece al del sonido.",
    "comment2": "Una figura de Chladni es el dibujo que forma la arena sobre una placa que vibra: se coloca a lo largo de las líneas que no se mueven. Aquí, la placa es un cuadrado.",
    "comment3": "Aquí, «parecerse» significa que dos espectros están próximos: la energía se reparte de la misma manera entre las frecuencias. La elección se basa en el parecido de dos espectros, no en una ley musical: un motivo no «expresa» una pieza.",
    "comment4": "Las imágenes y los vídeos grabados se hacen en tu navegador y se descargan en tu dispositivo.",
    "comment5": "Pulsa «Escuchar»: la página pide entonces el micrófono, nunca antes; sin micrófono, reproduce una pieza de ejemplo. También puedes elegir otra pieza o un archivo de audio. En «Más opciones» puedes guardar una imagen de la figura o un vídeo de 15 segundos con el sonido.",
    "comment6": "Contenidos con licencia CC BY-NC 4.0, código con licencia AGPL v3 (licencia comercial bajo petición). Autor: Anibal Edelberto Amiot.",
    "commentAuteur": "Sobre el autor",
    "refAlt": "Ejemplo de figura producida por la página: un tablero de grandes rombos negros y crema, con pequeñas formas redondas en los cruces.",
    "refLegende": "Ejemplo real: tras {s} segundos de la pieza de ejemplo n.º {m}, el motivo n.º {i} de {n} es aquel cuyo espectro más se parece al del sonido.",
    "sansJs": "Escuchar requiere JavaScript: actívalo para oír una pieza y ver cómo se mueve la figura. El texto y la imagen de ejemplo de abajo se pueden leer sin él.",
    "figureAria": "Figura del motivo elegido: {nom}",
    "entree": "Entrada de audio",
    "entreeDefaut": "Entrada predeterminada",
    "entreeAide": "Mesa de mezclas, tarjeta de sonido: conéctala, autoriza el micrófono y elígela aquí.",
    "sensibilite": "Umbral de ataques",
    "sensibiliteAide": "En desviaciones típicas por encima de la media: más bajo, más sensible a los cambios de nota.",
    "intervalle": "Intervalo mínimo entre dos ataques (s)",
    "intervalleAide": "0,45 s por defecto: como máximo unos 133 ataques por minuto. Bájalo para un tempo rápido.",
    "mentionIA": "Las piezas facilitadas están compuestas con ayuda de la IA («Música compuesta con IA por MC Claude.»).",
    "etatDepart": "Pulsa Escuchar: el micrófono se pide entonces, o elige una pieza. Las piezas facilitadas están compuestas con ayuda de la IA.",
    "etatMorceau": "Pieza facilitada, compuesta con ayuda de la IA.",
    "etatFichier": "Archivo: {nom} (se queda en tu navegador).",
    "etatMicro": "Micrófono activo.",
    "etatEntree": "Entrada «{nom}» activa.",
    "etatOnglet": "Audio de una pestaña activo.",
    "etatEssai": "Música de prueba.",
    "erreurMicroRefuse": "El micrófono está bloqueado. Autorízalo en los ajustes del sitio (el candado, a la izquierda de la dirección) y vuelve a pulsar Escuchar. También puedes elegir un archivo o una pieza.",
    "erreurMicroAbsent": "No hay ningún micrófono disponible en este dispositivo.",
    "erreurMicro": "El micrófono no se inicia: {message}",
    "microRepliRefuse": "El micrófono está bloqueado: aquí tienes una pieza de ejemplo en su lugar. Para usar el micrófono, autorízalo en los ajustes del sitio (el candado, a la izquierda de la dirección), elige «Micrófono» en la lista de fuentes y pulsa Escuchar.",
    "microRepliAbsent": "No hay ningún micrófono disponible en este dispositivo: aquí tienes una pieza de ejemplo en su lugar.",
    "microRepliAutre": "El micrófono no se inicia ({message}): aquí tienes una pieza de ejemplo en su lugar.",
    "erreurOnglet": "Aquí no es posible capturar el audio de una pestaña. Requiere un navegador de escritorio reciente (Chrome, Edge); no existe en móvil ni en Safari.",
    "erreurOngletSansSon": "La pestaña elegida no ha proporcionado sonido. Vuelve a empezar y marca «Compartir el audio de la pestaña».",
    "erreurFichier": "Este archivo no se puede leer como un sonido.",
    "erreurAudio": "El sonido no puede iniciarse: {message}",
    "erreurDonnees": "Los datos de la página no se cargan: {message}",
    "bandeManque": "falta el fondo «{id}» en la colección de fondos",
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
    "fondGroupes": {
      "aplat": "Liso",
      "triangles": "Triángulos",
      "bandes": "Bandas"
    },
    "fondVariantes": {
      "B3x": "Tres bandas",
      "B121x": "Banda central",
      "B11211Dx": "Bandas oblicuas"
    },
    "fondAide": "Una casilla lleva cuatro triángulos; cada uno se dibuja con el fondo elegido o con sus dos colores intercambiados.",
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
    "description": "มองเห็นดนตรีของคุณ: เลือกเพลง ไฟล์ หรือไมโครโฟน ดูรูป Chladni ที่เสียงวาด และลวดลายของ La Livrée d'Hermès ที่คล้ายที่สุด บันทึก 15 วินาที",
    "ariane": "มองเห็นดนตรีของคุณ",
    "h1": "มองเห็นดนตรีของคุณ",
    "intro": "ดนตรีทุกชิ้นมีลายเซ็นของตัวเอง คือวิธีที่พลังงานของมันกระจายไปตามความถี่ต่าง ๆ กด “ฟัง” แล้วหน้านี้จะวัดพลังงานนั้น วาดรูป Chladni ที่เสียงสร้างขึ้น และค้นหาในบรรดาลวดลายรวมเป็นหนึ่งของ La Livrée d'Hermès ว่าลายใดมีสเปกตรัมคล้ายกับเสียงมากที่สุด การเลือกอาศัยความคล้ายกันของสเปกตรัมสองชุด ไม่ใช่กฎทางดนตรี ลวดลายหนึ่งไม่ได้ “แสดงออก” ถึงบทเพลงหนึ่ง",
    "discretion": "ไม่มีสิ่งใดออกจากเบราว์เซอร์ของคุณ: ไฟล์ ไมโครโฟน และเสียงที่จับได้ จะถูกวิเคราะห์ในเครื่องและไม่ถูกส่งไปที่ใดเลย",
    "flash": "คำเตือน: ภาพอาจเปลี่ยนเร็วและกะพริบ ใน “ตัวเลือกเพิ่มเติม” ตัวเลือก “ลดการเปลี่ยนแปลงที่รวดเร็ว” จะทำให้ช้าลง",
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
    "ecouter": "ฟัง",
    "plusOptions": "ตัวเลือกเพิ่มเติม",
    "moinsOptions": "ตัวเลือกน้อยลง",
    "animerFigure": "ทำให้ภาพเคลื่อนไหว",
    "figerFigure": "หยุดภาพ",
    "figureFixeAide": "หยุดภาพเคลื่อนไหวแล้ว (ขอให้ลดการเคลื่อนไหว): ปุ่ม “ทำให้ภาพเคลื่อนไหว”",
    "audioInterrompu": "เสียงถูกขัดจังหวะ (สายเรียกเข้า แอปอื่น โหมดพัก) กด “ฟัง” เพื่อเล่นต่อ",
    "image": "ภาพ",
    "imagePrete": "บันทึกภาพแล้ว: เริ่มดาวน์โหลดแล้ว",
    "imageErreur": "ไม่สามารถสร้างภาพได้",
    "partager": "แชร์",
    "partageErreur": "แชร์ไม่สำเร็จ: {message}",
    "copierLien": "คัดลอกลิงก์",
    "lienCopie": "คัดลอกลิงก์แล้ว: {lien}",
    "lienManuel": "โปรดคัดลอกลิงก์นี้ด้วยตนเอง: {lien}",
    "appareilTitre": "ข้อมูลอุปกรณ์",
    "appareilAide": "ข้อความหนึ่งบรรทัดที่ส่งกลับให้ผู้เขียนได้เมื่อมีปัญหา: เบราว์เซอร์และระบบ (เฉพาะตระกูลและเวอร์ชัน) สถานะเสียง เครื่องบันทึกและรูปแบบวิดีโอ การแชร์ หน้าจอ ไม่มีอะไรถูกส่งออกไป: คุณคัดลอกเอง",
    "appareilLigne": "ข้อมูลที่จะคัดลอก",
    "appareilCopier": "คัดลอก",
    "appareilCopie": "คัดลอกข้อมูลแล้ว",
    "appareilManuel": "เลือกข้อความแล้วคัดลอกด้วยตนเอง",
    "oui": "ใช่",
    "non": "ไม่ใช่",
    "appareilSansContexte": "ยังไม่ได้สร้าง",
    "appareilSansEnregistreur": "ไม่มีเครื่องบันทึก",
    "commentTitre": "วิธีการทำงาน",
    "comment1": "หน้านี้วัดพลังงานของเสียงที่ความถี่ของวงโหมดแต่ละวงของแผ่นสี่เหลี่ยมจัตุรัส วาดรูป Chladni ที่สอดคล้องกัน และค้นหาในบรรดาลวดลายของ La Livrée d'Hermès ว่าลายใดมีสเปกตรัมคล้ายกับเสียงมากที่สุด",
    "comment2": "รูป Chladni คือภาพที่ทรายก่อตัวบนแผ่นที่สั่นสะเทือน: ทรายจะเรียงตัวตามเส้นที่ไม่เคลื่อนไหว ในที่นี้แผ่นเป็นรูปสี่เหลี่ยมจัตุรัส",
    "comment3": "ในที่นี้ “คล้าย” หมายถึงสเปกตรัมสองชุดอยู่ใกล้กัน: พลังงานกระจายไปตามความถี่ในแบบเดียวกันการเลือกอาศัยความคล้ายกันของสเปกตรัมสองชุด ไม่ใช่กฎทางดนตรี ลวดลายหนึ่งไม่ได้ “แสดงออก” ถึงบทเพลงหนึ่ง",
    "comment4": "ภาพและวิดีโอที่บันทึกถูกสร้างในเบราว์เซอร์ของคุณและดาวน์โหลดลงอุปกรณ์ของคุณ",
    "comment5": "กด “ฟัง” แล้วหน้านี้จะขอใช้ไมโครโฟนในตอนนั้น ไม่ขอก่อนหน้านั้น หากไม่มีไมโครโฟนหรือถูกปฏิเสธ จะเล่นเพลงตัวอย่างแทน คุณเลือกเพลงอื่นหรือไฟล์เสียงก็ได้ ใน “ตัวเลือกเพิ่มเติม” คุณบันทึกภาพของรูป หรือวิดีโอยาว 15 วินาทีพร้อมเสียงได้",
    "comment6": "เนื้อหาอยู่ภายใต้ใบอนุญาต CC BY-NC 4.0 โค้ดอยู่ภายใต้ใบอนุญาต AGPL v3 (มีใบอนุญาตเชิงพาณิชย์ตามคำขอ) ผู้เขียน: Anibal Edelberto Amiot",
    "commentAuteur": "เกี่ยวกับผู้เขียน",
    "refAlt": "ตัวอย่างรูปที่หน้านี้สร้างขึ้น: กระดานหมากรุกของข้าวหลามตัดสีดำและสีครีมขนาดใหญ่ มีรูปทรงกลมเล็ก ๆ ตรงจุดตัด",
    "refLegende": "ตัวอย่างจริง: หลังจาก {s} วินาทีของเพลงตัวอย่างที่ {m} ลายที่ {i} จาก {n} คือลายที่มีสเปกตรัมคล้ายกับเสียงมากที่สุด",
    "sansJs": "การฟังต้องใช้ JavaScript: โปรดเปิดใช้เพื่อฟังเพลงและดูรูปเคลื่อนไหว ข้อความและภาพตัวอย่างด้านล่างยังอ่านได้โดยไม่ต้องใช้",
    "figureAria": "รูปของลวดลายที่เลือก: {nom}",
    "entree": "อินพุตเสียง",
    "entreeDefaut": "อินพุตเริ่มต้น",
    "entreeAide": "มิกเซอร์ การ์ดเสียง: เสียบอุปกรณ์ อนุญาตให้ใช้ไมโครโฟน แล้วเลือกที่นี่",
    "sensibilite": "เกณฑ์การจับจังหวะโน้ต",
    "sensibiliteAide": "เป็นจำนวนส่วนเบี่ยงเบนมาตรฐานที่สูงกว่าค่าเฉลี่ย: ยิ่งต่ำ ยิ่งไวต่อการเปลี่ยนโน้ต",
    "intervalle": "ระยะห่างต่ำสุดระหว่างจังหวะโน้ตสองครั้ง (วินาที)",
    "intervalleAide": "ค่าเริ่มต้น 0.45 วินาที: มากที่สุดราว 133 ครั้งต่อนาที ลดค่าลงสำหรับจังหวะเร็ว",
    "mentionIA": "เพลงที่มีให้แต่งขึ้นด้วยความช่วยเหลือของ AI (“Musique composée avec l'IA par MC Claude.” หรือ “ดนตรีที่แต่งด้วย AI โดย MC Claude”)",
    "etatDepart": "กดฟัง แล้วหน้านี้จะขอใช้ไมโครโฟนในตอนนั้น หรือเลือกเพลงเอง เพลงที่มีให้แต่งขึ้นด้วยความช่วยเหลือของ AI",
    "etatMorceau": "เพลงที่มีให้ แต่งขึ้นด้วยความช่วยเหลือของ AI",
    "etatFichier": "ไฟล์: {nom} (อยู่ในเบราว์เซอร์ของคุณเท่านั้น)",
    "etatMicro": "ไมโครโฟนทำงานอยู่",
    "etatEntree": "อินพุต “{nom}” ทำงานอยู่",
    "etatOnglet": "เสียงจากแท็บทำงานอยู่",
    "etatEssai": "เพลงทดลอง",
    "erreurMicroRefuse": "ไมโครโฟนถูกปฏิเสธ โปรดอนุญาตในการตั้งค่าของเว็บไซต์ (รูปแม่กุญแจทางซ้ายของที่อยู่) แล้วกดฟังอีกครั้ง หรือเลือกไฟล์หรือเพลงที่มีให้ก็ได้",
    "erreurMicroAbsent": "อุปกรณ์นี้ไม่มีไมโครโฟนให้ใช้",
    "erreurMicro": "ไมโครโฟนไม่เริ่มทำงาน: {message}",
    "microRepliRefuse": "ไมโครโฟนถูกปฏิเสธ จึงเล่นเพลงตัวอย่างแทน หากต้องการใช้ไมโครโฟน โปรดอนุญาตในการตั้งค่าของเว็บไซต์ (รูปแม่กุญแจทางซ้ายของที่อยู่) เลือก “ไมโครโฟน” ในรายการแหล่งเสียง แล้วกดฟัง",
    "microRepliAbsent": "อุปกรณ์นี้ไม่มีไมโครโฟนให้ใช้ จึงเล่นเพลงตัวอย่างแทน",
    "microRepliAutre": "ไมโครโฟนไม่เริ่มทำงาน ({message}) จึงเล่นเพลงตัวอย่างแทน",
    "erreurOnglet": "ไม่สามารถจับเสียงจากแท็บที่นี่ได้ ต้องใช้เบราว์เซอร์บนคอมพิวเตอร์รุ่นใหม่ (Chrome, Edge) ซึ่งไม่มีบนมือถือและบน Safari",
    "erreurOngletSansSon": "แท็บที่เลือกไม่ได้ส่งเสียงมา โปรดเริ่มใหม่และติ๊ก “แชร์เสียงของแท็บ”",
    "erreurFichier": "ไฟล์นี้ไม่สามารถอ่านเป็นเสียงได้",
    "erreurAudio": "เสียงไม่เริ่มทำงาน: {message}",
    "erreurDonnees": "ข้อมูลของหน้าโหลดไม่ได้: {message}",
    "bandeManque": "ชุดพื้นหลังขาดพื้นหลัง «{id}»",
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
    "fondGroupes": {
      "aplat": "สีเรียบ",
      "triangles": "สามเหลี่ยม",
      "bandes": "แถบ"
    },
    "fondVariantes": {
      "B3x": "สามแถบ",
      "B121x": "แถบกลาง",
      "B11211Dx": "แถบเฉียง"
    },
    "fondAide": "หนึ่งช่องมีสามเหลี่ยมสี่รูป แต่ละรูปวาดด้วยพื้นหลังที่เลือก หรือสลับสองสีของมัน",
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
    "intro": "每一段音乐都有自己的特征：它的能量在各个频率上的分布方式。点击“聆听”：本页测量这份能量，画出声音的 Chladni 图形，并在 La Livrée d'Hermès 的图案中，找出频谱与之最相似的那一个。这一选择依据的是两个频谱的相似程度，而不是某种音乐法则：图案并不“表达”一首曲子。",
    "discretion": "任何内容都不会离开您的浏览器：文件、麦克风和捕获的音频都在本地分析，不会发送到任何地方。",
    "flash": "注意：画面可能快速变化并闪烁。在“更多选项”中，“减少快速变化”选项可使其放慢。",
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
    "ecouter": "聆听",
    "plusOptions": "更多选项",
    "moinsOptions": "更少选项",
    "animerFigure": "让图形动起来",
    "figerFigure": "让图形静止",
    "figureFixeAide": "动画已停止（已要求减少动态效果）：点击“让图形动起来”",
    "audioInterrompu": "声音被中断（来电、其他应用、休眠）。点击“聆听”继续。",
    "image": "图片",
    "imagePrete": "图片已保存：下载已开始。",
    "imageErreur": "无法生成图片。",
    "partager": "分享",
    "partageErreur": "分享失败：{message}",
    "copierLien": "复制链接",
    "lienCopie": "链接已复制：{lien}",
    "lienManuel": "请手动复制此链接：{lien}",
    "appareilTitre": "设备信息",
    "appareilAide": "出现问题时可发给作者的一行文字：浏览器与系统（仅系列和版本）、声音状态、录制器与视频格式、分享、屏幕。页面不会发送任何内容：由您自己复制。",
    "appareilLigne": "待复制的信息",
    "appareilCopier": "复制",
    "appareilCopie": "信息已复制。",
    "appareilManuel": "请选中文字并手动复制。",
    "oui": "是",
    "non": "否",
    "appareilSansContexte": "尚未创建",
    "appareilSansEnregistreur": "没有录制器",
    "commentTitre": "工作原理",
    "comment1": "本页在方形板各个振动模式圆环所对应的频率上测量声音的能量，画出相应的 Chladni 图形，并在 La Livrée d'Hermès 的图案中，找出频谱与声音频谱最相似的那一个。",
    "comment2": "Chladni 图形是沙子在振动的板上形成的图案：沙子会聚集在不动的线上。这里的板是方形的。",
    "comment3": "这里的“相似”指两个频谱相近：能量在各个频率上的分布方式相同。这一选择依据的是两个频谱的相似程度，而不是某种音乐法则：图案并不“表达”一首曲子。",
    "comment4": "录制的图片和视频在您的浏览器中生成，并下载到您的设备上。",
    "comment5": "点击“聆听”后，页面会请求使用麦克风，在此之前绝不会；没有麦克风或被拒绝时，会播放一首示例曲目。您也可以选择其他曲目或音频文件。在“更多选项”中可以录制图形的图片，或带声音的 15 秒视频。",
    "comment6": "内容采用 CC BY-NC 4.0 许可，代码采用 AGPL v3 许可（商业许可可应请求提供）。作者：Anibal Edelberto Amiot。",
    "commentAuteur": "关于作者",
    "refAlt": "本页生成的图形示例：由黑色和奶油色的大菱形组成的棋盘，交叉处有小的圆形。",
    "refLegende": "真实示例：示例曲目第 {m} 首播放 {s} 秒后，在 {n} 个图案中，第 {i} 个图案的频谱与声音最相似。",
    "sansJs": "聆听需要 JavaScript：请启用它，以听曲目并看图形移动。下面的文字和示例图片无需它也可阅读。",
    "figureAria": "所选图案的图形：{nom}",
    "entree": "音频输入",
    "entreeDefaut": "默认输入",
    "entreeAide": "调音台、声卡：接好设备，允许使用麦克风，然后在此选择。",
    "sensibilite": "起音阈值",
    "sensibiliteAide": "以高于平均值的标准差数表示：越低，对音符变化越敏感。",
    "intervalle": "两次起音之间的最短间隔（秒）",
    "intervalleAide": "默认 0.45 秒：每分钟最多约 133 次起音。节奏较快时请调低。",
    "mentionIA": "内置曲目由人工智能协助创作（“Musique composée avec l'IA par MC Claude.”，即“由 MC Claude 借助人工智能创作的音乐。”）。",
    "etatDepart": "请点击“聆听”，此时页面会请求使用麦克风；也可以自己选一首曲目。内置曲目由人工智能协助创作。",
    "etatMorceau": "内置曲目，由人工智能协助创作。",
    "etatFichier": "文件：{nom}（保留在您的浏览器中）。",
    "etatMicro": "麦克风已开启。",
    "etatEntree": "输入“{nom}”已启用。",
    "etatOnglet": "标签页音频已启用。",
    "etatEssai": "试听音乐。",
    "erreurMicroRefuse": "麦克风被拒绝。请在网站设置中允许使用（地址栏左侧的锁形图标），然后再次点击“聆听”。您也可以选择一个文件或一首内置曲目。",
    "erreurMicroAbsent": "此设备上没有可用的麦克风。",
    "erreurMicro": "麦克风无法启动：{message}",
    "microRepliRefuse": "麦克风被拒绝，已改为播放示例曲目。若要使用麦克风，请在网站设置中允许（地址栏左侧的锁形图标），在音源列表中选择“麦克风”，然后点击“聆听”。",
    "microRepliAbsent": "此设备上没有可用的麦克风，已改为播放示例曲目。",
    "microRepliAutre": "麦克风无法启动（{message}），已改为播放示例曲目。",
    "erreurOnglet": "此处无法捕获标签页音频。需要较新的桌面浏览器（Chrome、Edge）；手机和 Safari 不支持。",
    "erreurOngletSansSon": "所选标签页没有提供声音。请重新开始，并勾选“共享标签页音频”。",
    "erreurFichier": "无法将此文件作为声音读取。",
    "erreurAudio": "声音无法启动：{message}",
    "erreurDonnees": "页面数据无法加载：{message}",
    "bandeManque": "背景集合中缺少背景「{id}」",
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
    "fondGroupes": {
      "aplat": "纯色",
      "triangles": "三角形",
      "bandes": "条纹"
    },
    "fondVariantes": {
      "B3x": "三条纹",
      "B121x": "中央条纹",
      "B11211Dx": "斜条纹"
    },
    "fondAide": "每个格含四个三角形；每个三角形用所选背景绘制，或将其两种颜色互换。",
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
    "description": "Увидеть свою музыку: выберите композицию, файл или микрофон, посмотрите фигуру Хладни и самый похожий узор La Livrée d'Hermès. Запишите 15 секунд.",
    "ariane": "Увидеть свою музыку",
    "h1": "Увидеть свою музыку",
    "intro": "У каждой музыки есть подпись: то, как её энергия распределяется по частотам. Нажмите «Слушать»: страница измеряет эту энергию, рисует фигуру Хладни этого звука и ищет среди узоров La Livrée d'Hermès тот, чей спектр больше всего на неё похож. Выбор основан на сходстве двух спектров, а не на музыкальном законе: узор не «выражает» произведение.",
    "discretion": "Ничто не покидает ваш браузер: файл, микрофон и захваченный звук анализируются на месте и никуда не отправляются.",
    "flash": "Внимание: изображения могут быстро меняться и мигать. В разделе «Больше настроек» параметр «уменьшить быстрые изменения» замедляет их.",
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
    "ecouter": "Слушать",
    "plusOptions": "Больше настроек",
    "moinsOptions": "Меньше настроек",
    "animerFigure": "Запустить анимацию фигуры",
    "figerFigure": "Остановить фигуру",
    "figureFixeAide": "анимация остановлена (запрошено уменьшение движения): кнопка «Запустить анимацию фигуры»",
    "audioInterrompu": "Звук прерван (звонок, другое приложение, спящий режим). Нажмите «Слушать», чтобы продолжить.",
    "image": "Изображение",
    "imagePrete": "Изображение сохранено: загрузка началась.",
    "imageErreur": "Не удалось создать изображение.",
    "partager": "Поделиться",
    "partageErreur": "Не удалось поделиться: {message}",
    "copierLien": "Скопировать ссылку",
    "lienCopie": "Ссылка скопирована: {lien}",
    "lienManuel": "Скопируйте эту ссылку вручную: {lien}",
    "appareilTitre": "Сведения об устройстве",
    "appareilAide": "Строка текста, которую можно отправить автору при неполадке: браузер и система (только семейство и версия), состояние звука, средство записи и форматы видео, функция «Поделиться», экран. Ничего не отправляется: вы копируете её сами.",
    "appareilLigne": "Сведения для копирования",
    "appareilCopier": "Копировать",
    "appareilCopie": "Сведения скопированы.",
    "appareilManuel": "Выделите текст и скопируйте его вручную.",
    "oui": "да",
    "non": "нет",
    "appareilSansContexte": "ещё не создан",
    "appareilSansEnregistreur": "средство записи отсутствует",
    "commentTitre": "Как это работает",
    "comment1": "Страница измеряет энергию звука на частотах кругов мод квадратной пластины, рисует соответствующую фигуру Хладни и ищет среди узоров La Livrée d'Hermès тот, чей спектр больше всего похож на спектр звука.",
    "comment2": "Фигура Хладни — это рисунок, который песок образует на колеблющейся пластине: он собирается вдоль линий, которые не движутся. Здесь пластина квадратная.",
    "comment3": "Здесь «быть похожим» значит, что два спектра близки: энергия распределяется по частотам одинаково. Выбор основан на сходстве двух спектров, а не на музыкальном законе: узор не «выражает» произведение.",
    "comment4": "Записанные изображения и видео создаются в вашем браузере и скачиваются на ваше устройство.",
    "comment5": "Нажмите «Слушать»: только тогда страница запросит микрофон, не раньше; без микрофона она проиграет пробную композицию. Можно также выбрать другую композицию или аудиофайл. В разделе «Больше настроек» можно записать изображение фигуры или 15-секундное видео со звуком.",
    "comment6": "Материалы под лицензией CC BY-NC 4.0, код под лицензией AGPL v3 (коммерческая лицензия по запросу). Автор: Anibal Edelberto Amiot.",
    "commentAuteur": "Об авторе",
    "refAlt": "Пример фигуры, созданной страницей: шахматная доска из крупных чёрных и кремовых ромбов с маленькими круглыми формами на пересечениях.",
    "refLegende": "Реальный пример: через {s} с воспроизведения пробной композиции № {m} узор № {i} из {n} — тот, чей спектр больше всего похож на спектр звука.",
    "sansJs": "Для прослушивания нужен JavaScript: включите его, чтобы услышать композицию и увидеть движение фигуры. Текст и пример изображения ниже читаются и без него.",
    "figureAria": "Фигура выбранного узора: {nom}",
    "entree": "Аудиовход",
    "entreeDefaut": "Вход по умолчанию",
    "entreeAide": "Микшерный пульт, звуковая карта: подключите её, разрешите микрофон и выберите её здесь.",
    "sensibilite": "Порог атак",
    "sensibiliteAide": "В стандартных отклонениях выше среднего: чем ниже, тем чувствительнее к смене нот.",
    "intervalle": "Минимальный интервал между двумя атаками (с)",
    "intervalleAide": "По умолчанию 0,45 с: не более примерно 133 атак в минуту. Уменьшите для быстрого темпа.",
    "mentionIA": "Готовые композиции созданы с помощью ИИ («Музыка, созданная с помощью ИИ — MC Claude.»).",
    "etatDepart": "Нажмите «Слушать»: тогда страница запросит микрофон; или выберите композицию. Готовые композиции созданы с помощью ИИ.",
    "etatMorceau": "Готовая композиция, созданная с помощью ИИ.",
    "etatFichier": "Файл: {nom} (он остаётся в вашем браузере).",
    "etatMicro": "Микрофон включён.",
    "etatEntree": "Вход «{nom}» включён.",
    "etatOnglet": "Звук вкладки включён.",
    "etatEssai": "Пробная музыка.",
    "erreurMicroRefuse": "Доступ к микрофону запрещён. Разрешите его в настройках сайта (замок слева от адреса), затем снова нажмите «Слушать». Можно также выбрать файл или готовую композицию.",
    "erreurMicroAbsent": "На этом устройстве нет доступного микрофона.",
    "erreurMicro": "Микрофон не запускается: {message}",
    "microRepliRefuse": "Микрофон отклонён: вместо него звучит пробная композиция. Чтобы использовать микрофон, разрешите его в настройках сайта (замок слева от адреса), выберите «Микрофон» в списке источников и нажмите «Слушать».",
    "microRepliAbsent": "На этом устройстве нет доступного микрофона: вместо него звучит пробная композиция.",
    "microRepliAutre": "Микрофон не запускается ({message}): вместо него звучит пробная композиция.",
    "erreurOnglet": "Захват звука вкладки здесь невозможен. Нужен свежий браузер для компьютера (Chrome, Edge); на мобильных устройствах и в Safari его нет.",
    "erreurOngletSansSon": "Выбранная вкладка не передала звук. Начните снова и отметьте «Поделиться звуком вкладки».",
    "erreurFichier": "Этот файл нельзя прочитать как звук.",
    "erreurAudio": "Звук не удаётся запустить: {message}",
    "erreurDonnees": "Данные страницы не загружаются: {message}",
    "bandeManque": "в коллекции фонов не хватает фона «{id}»",
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
    "fondGroupes": {
      "aplat": "Сплошной",
      "triangles": "Треугольники",
      "bandes": "Полосы"
    },
    "fondVariantes": {
      "B3x": "Три полосы",
      "B121x": "Центральная полоса",
      "B11211Dx": "Косые полосы"
    },
    "fondAide": "В клетке четыре треугольника; каждый рисуется выбранным фоном или с обменом двух его цветов.",
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
    "titrePage": "Ver a sua música: figura de Chladni — La Livrée d'Hermès",
    "description": "Ver a sua música: escolha uma peça, um ficheiro ou o microfone, veja a figura de Chladni do som e o padrão de La Livrée d'Hermès mais parecido. Grave 15 segundos.",
    "ariane": "Ver a sua música",
    "h1": "Ver a sua música",
    "intro": "Cada música tem uma assinatura: a forma como a sua energia se reparte pelas frequências. Prima «Ouvir»: a página mede essa energia, desenha a figura de Chladni do som e procura, entre os padrões de La Livrée d'Hermès, aquele cujo espectro mais se lhe assemelha. A escolha assenta na semelhança de dois espectros, não numa lei musical: um padrão não «exprime» uma peça.",
    "discretion": "Nada sai do seu navegador: o ficheiro, o microfone e o áudio captado são analisados no próprio aparelho e não são enviados para parte nenhuma.",
    "flash": "Atenção: as imagens podem mudar depressa e piscar. Em «Mais opções», a opção «reduzir as mudanças rápidas» abranda-as.",
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
    "ecouter": "Ouvir",
    "plusOptions": "Mais opções",
    "moinsOptions": "Menos opções",
    "animerFigure": "Animar a figura",
    "figerFigure": "Parar a figura",
    "figureFixeAide": "animação parada (foi pedido movimento reduzido): botão «Animar a figura»",
    "audioInterrompu": "O som foi interrompido (chamada, outra aplicação, suspensão). Prima «Ouvir» para retomar.",
    "image": "Imagem",
    "imagePrete": "Imagem guardada: a transferência começou.",
    "imageErreur": "Não foi possível produzir a imagem.",
    "partager": "Partilhar",
    "partageErreur": "A partilha falhou: {message}",
    "copierLien": "Copiar a ligação",
    "lienCopie": "Ligação copiada: {lien}",
    "lienManuel": "Copie esta ligação à mão: {lien}",
    "appareilTitre": "Informações do dispositivo",
    "appareilAide": "Uma linha de texto a enviar ao autor em caso de problema: navegador e sistema (apenas família e versão), estado do som, gravador e formatos de vídeo, partilha, ecrã. Nada é enviado: é você quem a copia.",
    "appareilLigne": "Informações a copiar",
    "appareilCopier": "Copiar",
    "appareilCopie": "Informações copiadas.",
    "appareilManuel": "Selecione o texto e copie-o à mão.",
    "oui": "sim",
    "non": "não",
    "appareilSansContexte": "ainda não criado",
    "appareilSansEnregistreur": "gravador ausente",
    "commentTitre": "Como funciona",
    "comment1": "A página mede a energia do som nas frequências dos círculos de modos de uma placa quadrada, desenha a figura de Chladni correspondente e procura, entre os padrões de La Livrée d'Hermès, aquele cujo espectro mais se assemelha ao do som.",
    "comment2": "Uma figura de Chladni é o desenho que a areia forma numa placa que vibra: dispõe-se ao longo das linhas que não se movem. Aqui, a placa é um quadrado.",
    "comment3": "Aqui, «assemelhar-se» significa que dois espectros estão próximos: a energia reparte-se da mesma maneira pelas frequências. A escolha assenta na semelhança de dois espectros, não numa lei musical: um padrão não «exprime» uma peça.",
    "comment4": "As imagens e os vídeos gravados são feitos no seu navegador e transferidos para o seu dispositivo.",
    "comment5": "Prima «Ouvir»: a página pede então o microfone, nunca antes; sem microfone, reproduz uma peça de exemplo. Pode também escolher outra peça ou um ficheiro de áudio. Em «Mais opções» pode guardar uma imagem da figura ou um vídeo de 15 segundos com o som.",
    "comment6": "Conteúdos sob a licença CC BY-NC 4.0, código sob a licença AGPL v3 (licença comercial a pedido). Autor: Anibal Edelberto Amiot.",
    "commentAuteur": "Sobre o autor",
    "refAlt": "Exemplo de figura produzida pela página: um tabuleiro de grandes losangos pretos e creme, com pequenas formas redondas nos cruzamentos.",
    "refLegende": "Exemplo real: após {s} segundos da peça de exemplo n.º {m}, o padrão n.º {i} de {n} é aquele cujo espectro mais se assemelha ao do som.",
    "sansJs": "Ouvir requer JavaScript: ative-o para ouvir uma peça e ver a figura mover-se. O texto e a imagem de exemplo abaixo podem ser lidos sem ele.",
    "figureAria": "Figura do padrão escolhido: {nom}",
    "entree": "Entrada de áudio",
    "entreeDefaut": "Entrada predefinida",
    "entreeAide": "Mesa de mistura, placa de som: ligue-a, autorize o microfone e escolha-a aqui.",
    "sensibilite": "Limiar dos ataques",
    "sensibiliteAide": "Em desvios-padrão acima da média: mais baixo, mais sensível às mudanças de nota.",
    "intervalle": "Intervalo mínimo entre dois ataques (s)",
    "intervalleAide": "0,45 s por predefinição: no máximo cerca de 133 ataques por minuto. Baixe-o para um andamento rápido.",
    "mentionIA": "As peças fornecidas são compostas com a ajuda da IA («Música composta com IA por MC Claude.»).",
    "etatDepart": "Prima Ouvir: o microfone é pedido nesse momento, ou escolha uma peça. As peças fornecidas são compostas com a ajuda da IA.",
    "etatMorceau": "Peça fornecida, composta com a ajuda da IA.",
    "etatFichier": "Ficheiro: {nom} (fica no seu navegador).",
    "etatMicro": "Microfone ativo.",
    "etatEntree": "Entrada «{nom}» ativa.",
    "etatOnglet": "Áudio de um separador ativo.",
    "etatEssai": "Música de teste.",
    "erreurMicroRefuse": "O microfone está bloqueado. Autorize-o nas definições do site (o cadeado, à esquerda do endereço) e clique de novo em Ouvir. Pode também escolher um ficheiro ou uma peça.",
    "erreurMicroAbsent": "Não há nenhum microfone disponível neste aparelho.",
    "erreurMicro": "O microfone não arranca: {message}",
    "microRepliRefuse": "O microfone está bloqueado: eis uma peça de exemplo em seu lugar. Para usar o microfone, autorize-o nas definições do sítio (o cadeado, à esquerda do endereço), escolha «Microfone» na lista de fontes e prima Ouvir.",
    "microRepliAbsent": "Não há nenhum microfone disponível neste dispositivo: eis uma peça de exemplo em seu lugar.",
    "microRepliAutre": "O microfone não arranca ({message}): eis uma peça de exemplo em seu lugar.",
    "erreurOnglet": "A captação do áudio de um separador não é possível aqui. Exige um navegador de computador recente (Chrome, Edge); não existe em telemóvel nem no Safari.",
    "erreurOngletSansSon": "O separador escolhido não forneceu som. Recomece e marque «Partilhar o áudio do separador».",
    "erreurFichier": "Este ficheiro não pode ser lido como um som.",
    "erreurAudio": "O som não consegue arrancar: {message}",
    "erreurDonnees": "Os dados da página não carregam: {message}",
    "bandeManque": "falta o fundo «{id}» na coleção de fundos",
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
    "fondGroupes": {
      "aplat": "Liso",
      "triangles": "Triângulos",
      "bandes": "Faixas"
    },
    "fondVariantes": {
      "B3x": "Três faixas",
      "B121x": "Faixa central",
      "B11211Dx": "Faixas oblíquas"
    },
    "fondAide": "Uma casa leva quatro triângulos; cada um é desenhado com o fundo escolhido ou com as duas cores trocadas.",
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
    "description": "अपना संगीत देखें: रचना, फ़ाइल या माइक्रोफ़ोन चुनें, ध्वनि की Chladni आकृति और La Livrée d'Hermès का सबसे मिलता पैटर्न देखें। 15 सेकंड रिकॉर्ड करें।",
    "ariane": "अपने संगीत को देखें",
    "h1": "अपने संगीत को देखें",
    "intro": "हर संगीत का एक हस्ताक्षर होता है: उसकी ऊर्जा आवृत्तियों में किस तरह बँटी है। “सुनें” दबाएँ: पृष्ठ इस ऊर्जा को मापता है, ध्वनि की Chladni आकृति बनाता है और La Livrée d'Hermès के एकीकृत पैटर्नों में वह पैटर्न खोजता है जिसका स्पेक्ट्रम उससे सबसे अधिक मिलता हो। चुनाव दो स्पेक्ट्रमों की समानता पर टिका है, किसी संगीत-नियम पर नहीं: कोई पैटर्न किसी रचना को “व्यक्त” नहीं करता।",
    "discretion": "आपके ब्राउज़र से कुछ भी बाहर नहीं जाता: फ़ाइल, माइक्रोफ़ोन और कैप्चर की गई ध्वनि वहीं विश्लेषित होती हैं और कहीं नहीं भेजी जातीं।",
    "flash": "सावधान: छवियाँ तेज़ी से बदल और झिलमिला सकती हैं। “और विकल्प” में “तेज़ बदलाव घटाएँ” विकल्प उन्हें धीमा करता है।",
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
    "ecouter": "सुनें",
    "plusOptions": "और विकल्प",
    "moinsOptions": "कम विकल्प",
    "animerFigure": "आकृति को चलाएँ",
    "figerFigure": "आकृति को रोकें",
    "figureFixeAide": "एनिमेशन रुका हुआ है (कम गति का अनुरोध किया गया है): “आकृति को चलाएँ” बटन",
    "audioInterrompu": "ध्वनि बाधित हो गई (कॉल, दूसरा ऐप, स्लीप)। जारी रखने के लिए “सुनें” दबाएँ।",
    "image": "चित्र",
    "imagePrete": "चित्र सहेजा गया: डाउनलोड शुरू हो गया है।",
    "imageErreur": "चित्र नहीं बन सका।",
    "partager": "साझा करें",
    "partageErreur": "साझा करना विफल रहा: {message}",
    "copierLien": "लिंक कॉपी करें",
    "lienCopie": "लिंक कॉपी हो गया: {lien}",
    "lienManuel": "यह लिंक हाथ से कॉपी करें: {lien}",
    "appareilTitre": "डिवाइस की जानकारी",
    "appareilAide": "समस्या होने पर लेखक को भेजने के लिए पाठ की एक पंक्ति: ब्राउज़र और सिस्टम (केवल परिवार और संस्करण), ध्वनि की स्थिति, रिकॉर्डर और वीडियो प्रारूप, साझा करना, स्क्रीन। कुछ भी भेजा नहीं जाता: आप इसे स्वयं कॉपी करते हैं।",
    "appareilLigne": "कॉपी करने की जानकारी",
    "appareilCopier": "कॉपी करें",
    "appareilCopie": "जानकारी कॉपी हो गई।",
    "appareilManuel": "पाठ चुनें और उसे हाथ से कॉपी करें।",
    "oui": "हाँ",
    "non": "नहीं",
    "appareilSansContexte": "अभी बना नहीं",
    "appareilSansEnregistreur": "रिकॉर्डर उपलब्ध नहीं",
    "commentTitre": "यह कैसे काम करता है",
    "comment1": "पृष्ठ एक वर्गाकार पट्टिका के मोड-वृत्तों की आवृत्तियों पर ध्वनि की ऊर्जा मापता है, उससे मेल खाती Chladni आकृति बनाता है और La Livrée d'Hermès के पैटर्नों में वह पैटर्न खोजता है जिसका स्पेक्ट्रम ध्वनि के स्पेक्ट्रम से सबसे अधिक मिलता हो।",
    "comment2": "Chladni आकृति वह चित्र है जो कंपन करती पट्टिका पर रेत बनाती है: रेत उन रेखाओं पर जमा होती है जो हिलती नहीं। यहाँ पट्टिका वर्गाकार है।",
    "comment3": "यहाँ “मिलना” का अर्थ है कि दो स्पेक्ट्रम पास-पास हैं: ऊर्जा आवृत्तियों में एक ही तरह बँटी है। चुनाव दो स्पेक्ट्रमों की समानता पर टिका है, किसी संगीत-नियम पर नहीं: कोई पैटर्न किसी रचना को “व्यक्त” नहीं करता।",
    "comment4": "रिकॉर्ड किए गए चित्र और वीडियो आपके ब्राउज़र में बनते हैं और आपके डिवाइस पर डाउनलोड होते हैं।",
    "comment5": "“सुनें” दबाएँ: तभी पेज माइक्रोफ़ोन माँगता है, उससे पहले कभी नहीं; माइक्रोफ़ोन न हो तो वह एक उदाहरण रचना बजाता है। आप कोई दूसरी रचना या ऑडियो फ़ाइल भी चुन सकते हैं। “और विकल्प” में आप आकृति का चित्र या ध्वनि सहित 15 सेकंड का वीडियो रिकॉर्ड कर सकते हैं।",
    "comment6": "सामग्री CC BY-NC 4.0 लाइसेंस के अंतर्गत, कोड AGPL v3 लाइसेंस के अंतर्गत (व्यावसायिक लाइसेंस अनुरोध पर)। लेखक: Anibal Edelberto Amiot।",
    "commentAuteur": "लेखक के बारे में",
    "refAlt": "पृष्ठ द्वारा बनाई गई आकृति का उदाहरण: काले और क्रीम रंग के बड़े समचतुर्भुजों की बिसात, जिसके कटान-बिंदुओं पर छोटे गोल आकार हैं।",
    "refLegende": "वास्तविक उदाहरण: उदाहरण रचना क्रमांक {m} के {s} सेकंड बाद, {n} में से पैटर्न क्रमांक {i} वह है जिसका स्पेक्ट्रम ध्वनि के स्पेक्ट्रम से सबसे अधिक मिलता है।",
    "sansJs": "सुनने के लिए JavaScript चाहिए: रचना सुनने और आकृति को हिलते देखने के लिए इसे चालू करें। नीचे का पाठ और उदाहरण चित्र इसके बिना भी पढ़े जा सकते हैं।",
    "figureAria": "चुने गए पैटर्न की आकृति: {nom}",
    "entree": "ऑडियो इनपुट",
    "entreeDefaut": "डिफ़ॉल्ट इनपुट",
    "entreeAide": "मिक्सिंग डेस्क, साउंड कार्ड: उसे जोड़ें, माइक्रोफ़ोन की अनुमति दें, फिर उसे यहाँ चुनें।",
    "sensibilite": "आघात की सीमा",
    "sensibiliteAide": "औसत से ऊपर मानक विचलनों में: जितनी कम, उतनी अधिक संवेदनशील स्वर-परिवर्तनों के प्रति।",
    "intervalle": "दो आघातों के बीच न्यूनतम अंतराल (से.)",
    "intervalleAide": "डिफ़ॉल्ट 0.45 से.: अधिकतम लगभग 133 आघात प्रति मिनट। तेज़ गति के लिए इसे घटाएँ।",
    "mentionIA": "उपलब्ध रचनाएँ AI की सहायता से रची गई हैं (“Musique composée avec l'IA par MC Claude.” अर्थात् “MC Claude द्वारा AI से रचा गया संगीत।”)।",
    "etatDepart": "“सुनें” दबाएँ: तब पेज माइक्रोफ़ोन माँगेगा, या कोई रचना चुनें। उपलब्ध रचनाएँ AI की सहायता से रची गई हैं।",
    "etatMorceau": "उपलब्ध रचना, AI की सहायता से रची गई।",
    "etatFichier": "फ़ाइल: {nom} (वह आपके ब्राउज़र में ही रहती है)।",
    "etatMicro": "माइक्रोफ़ोन चालू है।",
    "etatEntree": "इनपुट “{nom}” चालू है।",
    "etatOnglet": "टैब की ध्वनि चालू है।",
    "etatEssai": "परीक्षण संगीत।",
    "erreurMicroRefuse": "माइक्रोफ़ोन अस्वीकृत है। साइट की सेटिंग में उसकी अनुमति दें (पते के बाईं ओर ताला), फिर दोबारा “सुनें” पर क्लिक करें। आप कोई फ़ाइल या उपलब्ध रचना भी चुन सकते हैं।",
    "erreurMicroAbsent": "इस उपकरण पर कोई माइक्रोफ़ोन उपलब्ध नहीं है।",
    "erreurMicro": "माइक्रोफ़ोन शुरू नहीं होता: {message}",
    "microRepliRefuse": "माइक्रोफ़ोन की अनुमति नहीं मिली: उसकी जगह एक उदाहरण रचना बज रही है। माइक्रोफ़ोन इस्तेमाल करने के लिए साइट की सेटिंग में उसे अनुमति दें (पते के बाईं ओर ताला), स्रोतों की सूची में “माइक्रोफ़ोन” चुनें, फिर “सुनें” दबाएँ।",
    "microRepliAbsent": "इस उपकरण पर कोई माइक्रोफ़ोन उपलब्ध नहीं है: उसकी जगह एक उदाहरण रचना बज रही है।",
    "microRepliAutre": "माइक्रोफ़ोन शुरू नहीं होता ({message}): उसकी जगह एक उदाहरण रचना बज रही है।",
    "erreurOnglet": "यहाँ किसी टैब की ध्वनि कैप्चर करना संभव नहीं है। इसके लिए डेस्कटॉप का नया ब्राउज़र (Chrome, Edge) चाहिए; मोबाइल और Safari पर यह नहीं है।",
    "erreurOngletSansSon": "चुने गए टैब ने कोई ध्वनि नहीं दी। फिर से शुरू करें और “टैब की ध्वनि साझा करें” पर निशान लगाएँ।",
    "erreurFichier": "यह फ़ाइल ध्वनि के रूप में नहीं पढ़ी जा सकती।",
    "erreurAudio": "ध्वनि शुरू नहीं हो पा रही: {message}",
    "erreurDonnees": "पृष्ठ का डेटा लोड नहीं होता: {message}",
    "bandeManque": "पृष्ठभूमियों के संग्रह में पृष्ठभूमि «{id}» नहीं है",
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
    "fondGroupes": {
      "aplat": "सादा",
      "triangles": "त्रिभुज",
      "bandes": "पट्टियाँ"
    },
    "fondVariantes": {
      "B3x": "तीन पट्टियाँ",
      "B121x": "बीच की पट्टी",
      "B11211Dx": "तिरछी पट्टियाँ"
    },
    "fondAide": "एक खाने में चार त्रिभुज होते हैं; हर एक चुनी हुई पृष्ठभूमि से बनता है, या उसके दोनों रंग आपस में बदलकर।",
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
  de: {
    "titrePage": "Die eigene Musik sehen — La Livrée d'Hermès",
    "description": "Die eigene Musik sehen: Stück, Datei oder Mikrofon wählen, die Chladni-Figur des Klangs und das ähnlichste Muster von La Livrée d'Hermès ansehen. 15 Sekunden aufnehmen.",
    "ariane": "Die eigene Musik sehen",
    "h1": "Die eigene Musik sehen",
    "intro": "Jede Musik hat eine Signatur: die Art, wie sich ihre Energie auf die Frequenzen verteilt. Tippen Sie auf „Anhören“: Die Seite misst diese Energie, zeichnet die Chladni-Figur des Klangs und sucht unter den Mustern von La Livrée d'Hermès dasjenige, dessen Spektrum ihr am meisten ähnelt. Die Wahl beruht auf der Ähnlichkeit zweier Spektren, nicht auf einem musikalischen Gesetz: Ein Muster „drückt“ ein Stück nicht „aus“.",
    "discretion": "Nichts verlässt Ihren Browser: Die Datei, das Mikrofon und das aufgenommene Audio werden vor Ort analysiert und nirgendwohin gesendet.",
    "flash": "Achtung: Die Bilder können schnell wechseln und flackern. Unter „Mehr Optionen“ verlangsamt die Einstellung „Schnelle Wechsel reduzieren“ sie.",
    "sonTitre": "Der Klang",
    "sonChoix": "Klang",
    "morceau": "Mitgeliefertes Stück {n} — {note}",
    "notes": {
      "j1": "Cis",
      "j2": "A",
      "j3": "D",
      "j4": "E",
      "j5": "G",
      "j6": "H",
      "j7": "C"
    },
    "tonalites": {
      "do dièse mineur": "cis-Moll",
      "la mineur": "a-Moll",
      "ré mineur": "d-Moll",
      "mi mineur": "e-Moll",
      "sol mineur": "g-Moll",
      "si mineur": "h-Moll",
      "do mineur": "c-Moll"
    },
    "sourceFichier": "Meine Audiodatei…",
    "sourceMicro": "Mikrofon",
    "sourceEssai": "Testmusik",
    "sourceOnglet": "Audio eines Tabs",
    "lecture": "Abspielen",
    "pause": "Pause",
    "arreter": "Stopp",
    "ecouter": "Anhören",
    "plusOptions": "Mehr Optionen",
    "moinsOptions": "Weniger Optionen",
    "animerFigure": "Figur animieren",
    "figerFigure": "Figur anhalten",
    "figureFixeAide": "Animation angehalten (reduzierte Bewegung gewünscht): Schaltfläche „Figur animieren“",
    "audioInterrompu": "Der Ton wurde unterbrochen (Anruf, andere App, Ruhezustand). Tippen Sie auf „Anhören“, um fortzufahren.",
    "image": "Bild",
    "imagePrete": "Bild gespeichert: Der Download hat begonnen.",
    "imageErreur": "Das Bild konnte nicht erzeugt werden.",
    "partager": "Teilen",
    "partageErreur": "Das Teilen ist fehlgeschlagen: {message}",
    "copierLien": "Link kopieren",
    "lienCopie": "Link kopiert: {lien}",
    "lienManuel": "Kopieren Sie diesen Link von Hand: {lien}",
    "appareilTitre": "Geräteinformationen",
    "appareilAide": "Eine Textzeile, die Sie bei einem Problem an den Autor zurückschicken können: Browser und System (nur Familie und Version), Tonstatus, Recorder und Videoformate, Teilen, Bildschirm. Es wird nichts gesendet: Sie kopieren sie selbst.",
    "appareilLigne": "Zu kopierende Informationen",
    "appareilCopier": "Kopieren",
    "appareilCopie": "Informationen kopiert.",
    "appareilManuel": "Markieren Sie den Text und kopieren Sie ihn von Hand.",
    "oui": "ja",
    "non": "nein",
    "appareilSansContexte": "noch nicht erstellt",
    "appareilSansEnregistreur": "Recorder fehlt",
    "commentTitre": "So funktioniert es",
    "comment1": "Die Seite misst die Energie des Klangs bei den Frequenzen der Modenkreise einer quadratischen Platte, zeichnet die entsprechende Chladni-Figur und sucht unter den Mustern von La Livrée d'Hermès dasjenige, dessen Spektrum dem des Klangs am meisten ähnelt.",
    "comment2": "Eine Chladni-Figur ist das Bild, das Sand auf einer schwingenden Platte bildet: Er sammelt sich entlang der Linien, die sich nicht bewegen. Hier ist die Platte ein Quadrat.",
    "comment3": "Hier bedeutet „ähneln“, dass zwei Spektren nahe beieinander liegen: Die Energie verteilt sich auf die gleiche Weise über die Frequenzen. Die Wahl beruht auf der Ähnlichkeit zweier Spektren, nicht auf einem musikalischen Gesetz: Ein Muster „drückt“ ein Stück nicht „aus“.",
    "comment4": "Aufgenommene Bilder und Videos entstehen in Ihrem Browser und werden auf Ihr Gerät heruntergeladen.",
    "comment5": "Tippen Sie auf „Anhören“: erst dann fragt die Seite nach dem Mikrofon, nie vorher; ohne Mikrofon spielt sie ein Beispielstück. Sie können auch ein anderes Stück oder eine Audiodatei wählen. Unter „Mehr Optionen“ können Sie ein Bild der Figur oder ein 15-Sekunden-Video mit Ton aufnehmen.",
    "comment6": "Inhalte unter der Lizenz CC BY-NC 4.0, Code unter der Lizenz AGPL v3 (kommerzielle Lizenz auf Anfrage). Autor: Anibal Edelberto Amiot.",
    "commentAuteur": "Über den Autor",
    "refAlt": "Beispiel einer von der Seite erzeugten Figur: ein Schachbrett aus großen schwarzen und cremefarbenen Rauten mit kleinen runden Formen an den Kreuzungen.",
    "refLegende": "Echtes Beispiel: Nach {s} Sekunden des Beispielstücks Nr. {m} ist das Muster Nr. {i} von {n} dasjenige, dessen Spektrum dem des Klangs am meisten ähnelt.",
    "sansJs": "Das Anhören erfordert JavaScript: Aktivieren Sie es, um ein Stück zu hören und die Figur sich bewegen zu sehen. Der Text und das Beispielbild unten sind auch ohne lesbar.",
    "figureAria": "Figur des gewählten Musters: {nom}",
    "entree": "Audioeingang",
    "entreeDefaut": "Standardeingang",
    "entreeAide": "Mischpult, Soundkarte: Schließen Sie sie an, erlauben Sie das Mikrofon und wählen Sie sie hier aus.",
    "sensibilite": "Schwelle der Anschläge",
    "sensibiliteAide": "In Standardabweichungen über dem Mittelwert: je niedriger, desto empfindlicher gegenüber Notenwechseln.",
    "intervalle": "Mindestabstand zwischen zwei Anschlägen (s)",
    "intervalleAide": "Standard 0,45 s: höchstens etwa 133 Anschläge pro Minute. Senken Sie den Wert für ein schnelles Tempo.",
    "mentionIA": "Die mitgelieferten Stücke sind mit Hilfe von KI komponiert („Musik, komponiert mit KI von MC Claude.“).",
    "etatDepart": "Drücken Sie auf Anhören: dann wird das Mikrofon angefragt, oder wählen Sie ein Stück. Die mitgelieferten Stücke sind mit Hilfe von KI komponiert.",
    "etatMorceau": "Mitgeliefertes Stück, mit Hilfe von KI komponiert.",
    "etatFichier": "Datei: {nom} (sie bleibt in Ihrem Browser).",
    "etatMicro": "Mikrofon aktiv.",
    "etatEntree": "Eingang „{nom}“ aktiv.",
    "etatOnglet": "Tab-Audio aktiv.",
    "etatEssai": "Testmusik.",
    "erreurMicroRefuse": "Das Mikrofon wurde verweigert. Erlauben Sie es in den Einstellungen der Website (das Schloss links neben der Adresse) und klicken Sie erneut auf Anhören. Sie können auch eine Datei oder ein Stück wählen.",
    "erreurMicroAbsent": "Auf diesem Gerät ist kein Mikrofon verfügbar.",
    "erreurMicro": "Das Mikrofon startet nicht: {message}",
    "microRepliRefuse": "Das Mikrofon ist gesperrt: stattdessen läuft ein Beispielstück. Um das Mikrofon zu nutzen, erlauben Sie es in den Website-Einstellungen (das Schloss links neben der Adresse), wählen Sie in der Liste der Quellen „Mikrofon“ und drücken Sie auf Anhören.",
    "microRepliAbsent": "Auf diesem Gerät ist kein Mikrofon verfügbar: stattdessen läuft ein Beispielstück.",
    "microRepliAutre": "Das Mikrofon startet nicht ({message}): stattdessen läuft ein Beispielstück.",
    "erreurOnglet": "Die Aufnahme des Audios eines Tabs ist hier nicht möglich. Sie erfordert einen aktuellen Desktop-Browser (Chrome, Edge); auf Mobilgeräten und in Safari fehlt sie.",
    "erreurOngletSansSon": "Der gewählte Tab hat keinen Ton geliefert. Starten Sie neu und aktivieren Sie „Audio des Tabs teilen“.",
    "erreurFichier": "Diese Datei kann nicht als Klang gelesen werden.",
    "erreurAudio": "Der Klang kann nicht starten: {message}",
    "erreurDonnees": "Die Daten der Seite werden nicht geladen: {message}",
    "bandeManque": "der Hintergrund «{id}» fehlt in der Sammlung der Hintergründe",
    "microCoupe": "Die Quelle wurde angehalten (Gerät getrennt oder Berechtigung entzogen).",
    "silence": "Stille: Starten Sie einen Klang.",
    "valide": "Bestätigt",
    "valideTag": "aktuell",
    "essai": "Versuch",
    "essaiTag": "Vorschau",
    "validerEssai": "Versuch bestätigen",
    "annuler": "Abbrechen",
    "pleinEcran": "Vollbild",
    "quitterPleinEcran": "Vollbild beenden",
    "fenetresAide": "Dunkler Grund: bestätigt. Goldener Rahmen: im Versuch. Fahren Sie über eine Option, um sie im Versuch zu sehen, klicken Sie, um sie zu behalten, dann „Versuch bestätigen“.",
    "fenetreValide": "Bestätigtes Fenster",
    "fenetreEssai": "Versuchsfenster",
    "basculeValide": "Bestätigt",
    "basculeEssai": "Versuch",
    "pleinEcranIndispo": "Der Vollbildmodus ist in diesem Browser nicht verfügbar.",
    "pleinEcranRepli": "Dieser Browser bietet für dieses Element keinen nativen Vollbildmodus: Die Bühne bedeckt das Fenster. Esc oder die Schaltfläche schließt sie.",
    "groupes": {
      "mode": "Klangsteuerung",
      "fmt": "Format (Ordnung)",
      "col": "Sammlung",
      "view": "Ansicht",
      "fond": "Feldvariante",
      "pal": "Farben"
    },
    "modes": {
      "image": [
        "Der Klang bestimmt das Bild",
        "In jedem Augenblick das Muster, dessen Spektrum dem der Musik am meisten ähnelt."
      ],
      "rythme": [
        "Der Klang bestimmt den Rhythmus",
        "Ein Schritt in der Nachbarschaftskette bei jedem Notenanschlag."
      ],
      "chemin": [
        "Der Klang lenkt den Weg",
        "Der Rhythmus entscheidet, wann; das Spektrum entscheidet, zu welchem Nachbarn."
      ],
      "octaves": [
        "Der Klang folgt der Oktave",
        "Bei jedem Anschlag ein Schritt auf der Bahn der vorherrschenden Note: der Kreis K, dann seine Oktave 4K, dann 16K …, sofern diese Kreise existieren."
      ]
    },
    "vues": {
      "signes": [
        "Vorzeichen",
        "Die positiven Zonen der Figur des Musters."
      ],
      "lignes": [
        "Knotenlinien",
        "Die Linien, auf denen die Figur des Musters verschwindet."
      ],
      "pavage": [
        "Zellen",
        "Das Muster selbst, in 2 × 2-Parkettierung."
      ]
    },
    "format": {
      "titre": "Ordnung {n}",
      "detail": "Gitter aus {g} × {g} Feldern",
      "bientot": "Ordnung {n} (zweite Lieferung)"
    },
    "chargementOrdre": "Ordnung {n} wird geladen …",
    "ordreIndisponible": "Die Daten der Ordnung {n} werden nicht geladen: {message}",
    "collections": {
      "tri": [
        "Dreifarbig — vereinheitlichte Muster",
        "{n} Muster (verschiedene 12 × 12-Gitter)"
      ],
      "bi": [
        "Zweifarbig — vereinheitlichte Muster",
        "{n} Muster (zwei Spiegel, lesbar nach der Regel vom 3. Oktober)"
      ],
      "ce": [
        "Zweifarbig — Zentralsymmetrie",
        "{n} Muster (nur 180°-Zentralsymmetrie, lesbar nach der Regel vom 3. Oktober)"
      ],
      "b1971128": [
        "Block 1971128",
        "{n} Muster"
      ],
      "b16012838": [
        "Block 16012838",
        "{n} Muster"
      ],
      "b3016090": [
        "Block 3016090",
        "{n} Muster"
      ],
      "f613": [
        "Familie 613",
        "{n} Muster"
      ],
      "f18": [
        "Familie 18",
        "{n} Muster"
      ],
      "fpilote": [
        "Pilotfamilie",
        "{n} Muster"
      ],
      "p18": [
        "Kreuz 1·2",
        "{n} Muster"
      ],
      "p30": [
        "Kreuz 1·2",
        "{n} Muster"
      ]
    },
    "fondGroupes": {
      "aplat": "Einfarbig",
      "triangles": "Dreiecke",
      "bandes": "Streifen"
    },
    "fondVariantes": {
      "B3x": "Drei Streifen",
      "B121x": "Mittelstreifen",
      "B11211Dx": "Schräge Streifen"
    },
    "fondAide": "Ein Feld trägt vier Dreiecke; jedes wird mit dem gewählten Grund gezeichnet oder mit vertauschten Farben.",
    "fondSeulementBicolore": "Die Feldvariante gilt nur für die zweifarbige Sammlung.",
    "palettes": {
      "creme": [
        "Tinte und Creme",
        "Die Farben der Website."
      ],
      "monochrome": [
        "Grau und Weiß",
        "Das Monochrom der Website."
      ],
      "perso": [
        "Meine Farben",
        "Wählen Sie das Muster und den Grund."
      ],
      "son": [
        "Der Farbton folgt dem Klang",
        "Der Farbton gleitet langsam mit der Helligkeit des Klangs (standardmäßig aus)."
      ]
    },
    "persoMotif": "Muster",
    "persoFond": "Grund",
    "tricoloreAide": "Dreifarbig: V am dunkelsten (Tinte), O mittleres Grau, M am hellsten (Creme).",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "Einstellungen im laufenden Betrieb",
    "lissage": "Glättung",
    "pulsationTitre": "Puls",
    "pulsations": {
      "attaque": "Bei jedem Anschlag",
      "temps": "Bei jedem Schlag",
      "quatre": "Alle 4 Schläge"
    },
    "pulsationAide": "Standardmäßig ein Wechsel bei jedem Anschlag. Wird ein regelmäßiger Puls erkannt, können Sie bei jedem Schlag oder alle 4 Schläge wechseln.",
    "pulsationDetectee": "Puls erkannt: {bpm} pro Minute.",
    "pulsationAucune": "Bisher wurde kein regelmäßiger Puls erkannt.",
    "calme": "Schnelle Wechsel reduzieren",
    "calmeAide": "Eine längere Überblendung und eine längere Haltedauer. Automatisch aktiviert, wenn Ihr System weniger Animation verlangt.",
    "pente": "Abfall der Bässe ausgleichen",
    "pauseImage": "Bild anhalten",
    "optionsTitre": "Optionen",
    "comprendreTitre": "Zum Verständnis",
    "comprendreAide": "Zwei Lehransichten, ohne Bezug zum Klang.",
    "paireTitre": "Die Mode (4, 0) und ihr entartetes Paar",
    "paireAide": "Auf einer quadratischen Platte haben die Moden (4, 0) und (0, 4) dieselbe Frequenz: Jede Kombination ist ebenfalls eine Mode dieser Frequenz. Der Regler geht von cos(4πx/a) + cos(4πy/a) (rechts) zu cos(4πx/a) − cos(4πy/a) (links); in der Mitte bleibt nur cos(4πx/a), senkrechte Linien. Helle und dunkle Zonen: entgegengesetzte Vorzeichen; Strich: Knotenlinie.",
    "paireMelange": "Mischung s: cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "Figur der Mode (4, 0), gemischt mit ihrem entarteten Paar",
    "moireTitre": "Die Parität als Überlagerung zweier ±1-Gitter",
    "moireAide": "Jedes Gitter ist ein Schachbrett: die Parität (−1)^(i + j) des Feldes (i, j). Ihr Produkt ist +1, wo beide übereinstimmen, und −1, wo sie sich unterscheiden: Es ist das XNOR der Bits, wie zwei gekreuzte Polarisatoren. Verschiebt oder dreht man eines der beiden ein wenig, entsteht ein Moiré.",
    "moireAngle": "Drehung des zweiten Gitters (Grad)",
    "moirePeriode": "Periode des zweiten Gitters (in % der ersten)",
    "moireA": "Gitter A",
    "moireB": "Gitter B",
    "moireProduit": "Produkt A × B (XNOR)",
    "moireAlt": "Produkt zweier ±1-Gitter",
    "clesTitre": "Lesung in Schlüsseln",
    "clesAide": "Nur Anzeige: die Schlüssel der Achsennotation (72 Schlüssel ohne Duplikate, Parität ab dem Eckfeld gezählt, Rang 70), deren Summe die Figur des gewählten Musters ergibt, wenn sie existiert. Die Seite behauptet keinerlei Verbindung zwischen einem Schlüssel und einer Frequenz.",
    "clesNatures": {
      "D+": "Diagonale x + y",
      "D-": "Diagonale y − x",
      "H": "waagerecht",
      "V": "senkrecht"
    },
    "clesFigure": {
      "figure": "Figur des Musters",
      "V": "Klasse V (violett)",
      "O": "Klasse O (orange)",
      "M": "Klasse M (magenta)"
    },
    "clesActives": "{n} aktive Schlüssel: {liste}",
    "clesAucune": "kein Schlüssel (leere Figur)",
    "clesComplement": " (bis auf das Komplement)",
    "clesHors": "Diese Figur ist keine Summe von Schlüsseln: Sie liegt außerhalb des von ihnen erzeugten Raums.",
    "clesMotif": "Muster {i} von {n}, Sammlung {collection}.",
    "clesOrdre12": "Die Lesung in Schlüsseln gilt nur für die Ordnung 12.",
    "loiTitre": "Frequenzgesetz der Kreise",
    "loiChoix": {
      "racine": "Für das Ohr gestauchte Skala",
      "plaque": "Gesetz der realen Platte"
    },
    "loiAide": "Gestauchte Skala: f = Bezugsfrequenz × √K / 2 (Ausgangseinstellung). Plattengesetz: f = c × K, wie bei einer realen Platte (Aluminium, 3 mm, 48 cm: c = 31,85 Hz). Bei Ordnung 12 von 32 bis 2 293 Hz; Kreise oberhalb von 0,9 × der Nyquist-Frequenz werden wie bisher ignoriert. Der Anschlagdetektor und die Farbtonverfolgung ändern sich nicht.",
    "loiC": "c (Hz pro Einheit m² + n²)",
    "figureTitre": "Figur (Ansichten Vorzeichen und Linien)",
    "figureChoix": {
      "motif": "Des gewählten Musters",
      "son": "Des Klangs",
      "ecart": "Beide (Differenz)"
    },
    "figureAide": "Des gewählten Musters: die Chladni-Figur des gewählten Musters (Ausgangseinstellung). Des Klangs: die Summe der Wellen jedes Kreises, gewichtet mit der Energie, die der Klang dort einbringt, ohne den Umweg über ein Muster. Beide: die Stellen, an denen sich diese beiden Figuren unterscheiden. Der Klang liefert keine Phasen: Sie werden auf null gesetzt.",
    "sceneTitre": "Die Bühne",
    "projection": "Ein Projektionsfenster öffnen",
    "sceneAide": "Das Vollbild startet immer das bestätigte Fenster, nie den Versuch; die Bedienelemente und der Cursor verschwinden nach 3 Sekunden. Esc zum Zurückkehren. Das Projektionsfenster ist getrennt: Ziehen Sie es auf einen zweiten Bildschirm oder einen Projektor.",
    "projectionBloquee": "Das Projektionsfenster wurde vom Browser blockiert. Erlauben Sie Pop-ups für diese Website und versuchen Sie es erneut.",
    "veille": "Der Bildschirm bleibt während der Wiedergabe an, wenn der Browser es erlaubt.",
    "enregTitre": "Aufnehmen",
    "enreg": "15 s aufnehmen",
    "enregEnCours": "Aufnahme: {s} s",
    "format916": "9:16 (Reels, Shorts, TikTok)",
    "format45": "4:5 (Beitrag)",
    "format11": "1:1 (quadratisch)",
    "formatVideo": "Videoformat",
    "signature": "Banner „{texte}“ am unteren Rand des Videos",
    "enregPret": "Video aufgenommen: Der Download hat begonnen.",
    "enregWebm": "Ihr Browser schreibt kein MP4: Das Video liegt im WebM-Format vor. Um es in MP4 umzuwandeln (Instagram, TikTok), nutzen Sie einen Konverter oder ffmpeg: ffmpeg -i datei.webm datei.mp4.",
    "enregAac": "AAC-Audio im MP4: läuft überall (iPhone, QuickTime, Veröffentlichungs-Apps).",
    "enregOpusAvant": "Dieser Browser schreibt das Audio des MP4 als Opus: Es lässt sich auf iPhone, in QuickTime oder in manchen Veröffentlichungs-Apps eventuell nicht abspielen (aktuelles Desktop-Chrome: AAC).",
    "enregOpus": "Opus-Audio: lässt sich auf iPhone, in QuickTime oder in manchen Veröffentlichungs-Apps eventuell nicht abspielen. Für eine AAC-Spur: ffmpeg -i datei.mp4 -c:v copy -c:a aac ausgabe.mp4.",
    "enregIndispo": "Die Videoaufnahme ist in diesem Browser nicht verfügbar.",
    "enregSansSource": "Starten Sie zuerst einen Klang: Stille wird nicht aufgenommen.",
    "enregErreur": "Die Aufnahme startet nicht: {message}",
    "raccourcisTitre": "Tastenkürzel",
    "raccourcis": [
      [
        "1 – 3",
        "Ansicht des Versuchs: Vorzeichen, Knotenlinien, Zellen"
      ],
      [
        "Leertaste",
        "Nächster Steuerungsmodus (Versuch)"
      ],
      [
        "P",
        "Bild anhalten"
      ],
      [
        "V",
        "Versuch bestätigen"
      ],
      [
        "F",
        "Vollbild (bestätigtes Fenster)"
      ],
      [
        "R",
        "15 s aufnehmen"
      ]
    ],
    "infoMotif": "Muster {i} von {n}",
    "infoImages": "{fps} Bilder/s",
    "infoResolution": "reduzierte Auflösung",
    "semaineTitre": "Die Woche",
    "semaineMention": "Musik, komponiert mit KI von MC Claude.",
    "semaineTiers": "Ein Klick auf ein Plakat lädt den Player von YouTube oder TikTok: einen Drittanbieterdienst, der dann Ihren Besuch erhält. Vorher wird nichts geladen.",
    "jourTitre": "Tag {n} — {tonalite}",
    "datePub": "Veröffentlicht am {date}",
    "bientot": "Bald",
    "lire": "Das Video von Tag {n} abspielen, {tonalite}",
    "lireTiktok": "Hier abspielen (TikTok)",
    "voirYoutube": "Auf YouTube ansehen",
    "voirTiktok": "Auf TikTok ansehen",
    "afficheAlt": "Plakat von Tag {n} — {tonalite}",
    "lecteurTitre": "Video von Tag {n}",
    "voirAussiTitre": "Siehe auch",
    "voirAussi": [
      {
        "href": "/galerie-bicolore.html",
        "titre": "Zweifarbige Galerie",
        "texte": "Die von den Achsen erzeugten zweifarbigen Muster, auf dem Würfel geschlossen: Körnung, Parkettierung, Export. (Seite auf Französisch.)"
      },
      {
        "href": "/galerie-patterns-unifies.html",
        "titre": "Dreifarbige Galerie",
        "texte": "Die vereinheitlichten Muster, durch Mischen von Tönen erzeugt: Wählen Sie ein Muster, um seine Parkettierung zu sehen. (Seite auf Französisch.)"
      },
      {
        "href": "/fonds-ecran.html",
        "titre": "Hintergrundbilder",
        "texte": "Textile Vollbild-Hintergründe, klangreaktiv oder im meditativen Modus. (Seite auf Französisch.)"
      },
      {
        "href": "/de/animations/",
        "titre": "Animationsgalerie",
        "texte": "Die Animationen der Hintergrundsammlungen, zum Ansehen und zum Herunterladen als MP4."
      },
      {
        "href": "/chladni.html",
        "titre": "Chladni",
        "texte": "Figuren, Tonleitern und Frequenzen: die Seite, die das Vokabular der Muster mit den Moden einer Platte verbindet. (Seite auf Französisch.)"
      },
      {
        "href": "/de/book/",
        "titre": "Das Buch",
        "texte": "La Livrée d'Hermès online, Seite für Seite, mit dem kostenlosen PDF."
      }
    ]
  },
  it: {
    "titrePage": "Vedere la propria musica — La Livrée d'Hermès",
    "description": "Vedere la propria musica: scegli un brano, un file o il microfono e guarda la figura di Chladni del suono e il motivo di La Livrée d'Hermès più simile. 15 secondi.",
    "ariane": "Vedere la propria musica",
    "h1": "Vedere la propria musica",
    "intro": "Ogni musica ha una firma: il modo in cui la sua energia si distribuisce tra le frequenze. Premi «Ascolta»: la pagina misura quell'energia, disegna la figura di Chladni del suono e cerca, tra i motivi di La Livrée d'Hermès, quello il cui spettro le somiglia di più. La scelta si basa sulla somiglianza di due spettri, non su una legge musicale: un motivo non «esprime» un brano.",
    "discretion": "Nulla lascia il tuo browser: il file, il microfono e l'audio catturato sono analizzati sul posto e non vengono inviati da nessuna parte.",
    "flash": "Attenzione: le immagini possono cambiare in fretta e lampeggiare. In «Più opzioni», l'impostazione «riduci i cambiamenti rapidi» le rallenta.",
    "sonTitre": "Il suono",
    "sonChoix": "Suono",
    "morceau": "Brano fornito {n} — {note}",
    "notes": {
      "j1": "do diesis",
      "j2": "la",
      "j3": "re",
      "j4": "mi",
      "j5": "sol",
      "j6": "si",
      "j7": "do"
    },
    "tonalites": {
      "do dièse mineur": "do diesis minore",
      "la mineur": "la minore",
      "ré mineur": "re minore",
      "mi mineur": "mi minore",
      "sol mineur": "sol minore",
      "si mineur": "si minore",
      "do mineur": "do minore"
    },
    "sourceFichier": "Il mio file audio…",
    "sourceMicro": "Microfono",
    "sourceEssai": "Musica di prova",
    "sourceOnglet": "Audio di una scheda",
    "lecture": "Riproduci",
    "pause": "Pausa",
    "arreter": "Ferma",
    "ecouter": "Ascolta",
    "plusOptions": "Più opzioni",
    "moinsOptions": "Meno opzioni",
    "animerFigure": "Anima la figura",
    "figerFigure": "Ferma la figura",
    "figureFixeAide": "animazione ferma (movimento ridotto richiesto): pulsante «Anima la figura»",
    "audioInterrompu": "Il suono è stato interrotto (chiamata, altra app, sospensione). Premi «Ascolta» per riprendere.",
    "image": "Immagine",
    "imagePrete": "Immagine salvata: il download è iniziato.",
    "imageErreur": "Impossibile produrre l'immagine.",
    "partager": "Condividi",
    "partageErreur": "Condivisione non riuscita: {message}",
    "copierLien": "Copia il link",
    "lienCopie": "Link copiato: {lien}",
    "lienManuel": "Copia questo link a mano: {lien}",
    "appareilTitre": "Informazioni sul dispositivo",
    "appareilAide": "Una riga di testo da rimandare all'autore in caso di problema: browser e sistema (solo famiglia e versione), stato del suono, registratore e formati video, condivisione, schermo. Non viene inviato nulla: la copi tu.",
    "appareilLigne": "Informazioni da copiare",
    "appareilCopier": "Copia",
    "appareilCopie": "Informazioni copiate.",
    "appareilManuel": "Seleziona il testo e copialo a mano.",
    "oui": "sì",
    "non": "no",
    "appareilSansContexte": "non ancora creato",
    "appareilSansEnregistreur": "registratore assente",
    "commentTitre": "Come funziona",
    "comment1": "La pagina misura l'energia del suono alle frequenze dei cerchi di modi di una piastra quadrata, disegna la figura di Chladni corrispondente e cerca, tra i motivi di La Livrée d'Hermès, quello il cui spettro somiglia di più a quello del suono.",
    "comment2": "Una figura di Chladni è il disegno che la sabbia forma su una piastra che vibra: si dispone lungo le linee che non si muovono. Qui la piastra è un quadrato.",
    "comment3": "Qui «somigliare» significa che due spettri sono vicini: l'energia si distribuisce allo stesso modo tra le frequenze. La scelta si basa sulla somiglianza di due spettri, non su una legge musicale: un motivo non «esprime» un brano.",
    "comment4": "Le immagini e i video registrati vengono creati nel tuo browser e scaricati sul tuo dispositivo.",
    "comment5": "Premi «Ascolta»: solo allora la pagina chiede il microfono, mai prima; senza microfono, riproduce un brano d'esempio. Puoi anche scegliere un altro brano o un file audio. In «Più opzioni» puoi registrare un'immagine della figura o un video di 15 secondi con il suono.",
    "comment6": "Contenuti con licenza CC BY-NC 4.0, codice con licenza AGPL v3 (licenza commerciale su richiesta). Autore: Anibal Edelberto Amiot.",
    "commentAuteur": "Sull'autore",
    "refAlt": "Esempio di figura prodotta dalla pagina: una scacchiera di grandi rombi neri e crema, con piccole forme rotonde agli incroci.",
    "refLegende": "Esempio reale: dopo {s} secondi del brano d'esempio n. {m}, il motivo n. {i} di {n} è quello il cui spettro somiglia di più a quello del suono.",
    "sansJs": "L'ascolto richiede JavaScript: attivalo per sentire un brano e vedere la figura muoversi. Il testo e l'immagine d'esempio qui sotto si leggono anche senza.",
    "figureAria": "Figura del motivo scelto: {nom}",
    "entree": "Ingresso audio",
    "entreeDefaut": "Ingresso predefinito",
    "entreeAide": "Mixer, scheda audio: collegala, consenti il microfono, poi sceglila qui.",
    "sensibilite": "Soglia degli attacchi",
    "sensibiliteAide": "In deviazioni standard sopra la media: più bassa, più sensibile ai cambi di nota.",
    "intervalle": "Intervallo minimo tra due attacchi (s)",
    "intervalleAide": "0,45 s per impostazione predefinita: al massimo circa 133 attacchi al minuto. Abbassalo per un tempo veloce.",
    "mentionIA": "I brani forniti sono composti con l'aiuto dell'IA («Musica composta con l'IA da MC Claude.»).",
    "etatDepart": "Premi Ascolta: il microfono viene richiesto in quel momento, oppure scegli un brano. I brani forniti sono composti con l'aiuto dell'IA.",
    "etatMorceau": "Brano fornito, composto con l'aiuto dell'IA.",
    "etatFichier": "File: {nom} (resta nel tuo browser).",
    "etatMicro": "Microfono attivo.",
    "etatEntree": "Ingresso «{nom}» attivo.",
    "etatOnglet": "Audio di una scheda attivo.",
    "etatEssai": "Musica di prova.",
    "erreurMicroRefuse": "Il microfono è stato rifiutato. Consentilo nelle impostazioni del sito (il lucchetto, a sinistra dell'indirizzo), poi fai di nuovo clic su Ascolta. Puoi anche scegliere un file o un brano.",
    "erreurMicroAbsent": "Nessun microfono è disponibile su questo dispositivo.",
    "erreurMicro": "Il microfono non si avvia: {message}",
    "microRepliRefuse": "Il microfono è bloccato: al suo posto parte un brano d'esempio. Per usare il microfono, consentilo nelle impostazioni del sito (il lucchetto, a sinistra dell'indirizzo), scegli «Microfono» nell'elenco delle sorgenti e premi Ascolta.",
    "microRepliAbsent": "Su questo dispositivo non c'è nessun microfono disponibile: al suo posto parte un brano d'esempio.",
    "microRepliAutre": "Il microfono non si avvia ({message}): al suo posto parte un brano d'esempio.",
    "erreurOnglet": "La cattura dell'audio di una scheda non è possibile qui. Richiede un browser desktop recente (Chrome, Edge); manca su dispositivi mobili e su Safari.",
    "erreurOngletSansSon": "La scheda scelta non ha fornito audio. Ricomincia e spunta «Condividi l'audio della scheda».",
    "erreurFichier": "Questo file non può essere letto come suono.",
    "erreurAudio": "Il suono non può partire: {message}",
    "erreurDonnees": "I dati della pagina non si caricano: {message}",
    "bandeManque": "il fondo «{id}» manca nella collezione di fondi",
    "microCoupe": "La sorgente si è fermata (dispositivo scollegato o autorizzazione ritirata).",
    "silence": "Silenzio: avvia un suono.",
    "valide": "Convalidata",
    "valideTag": "in corso",
    "essai": "Prova",
    "essaiTag": "anteprima",
    "validerEssai": "Convalida la prova",
    "annuler": "Annulla",
    "pleinEcran": "Schermo intero",
    "quitterPleinEcran": "Esci dallo schermo intero",
    "fenetresAide": "Fondo scuro: convalidata. Cornice dorata: in prova. Passa il cursore su un'opzione per vederla nella prova, fai clic per tenerla, poi «Convalida la prova».",
    "fenetreValide": "Finestra convalidata",
    "fenetreEssai": "Finestra di prova",
    "basculeValide": "Convalidata",
    "basculeEssai": "Prova",
    "pleinEcranIndispo": "Lo schermo intero non è disponibile in questo browser.",
    "pleinEcranRepli": "Questo browser non offre lo schermo intero nativo per questo elemento: la scena copre la finestra. Esc o il pulsante la chiude.",
    "groupes": {
      "mode": "Controllo del suono",
      "fmt": "Formato (ordine)",
      "col": "Collezione",
      "view": "Vista",
      "fond": "Variante di casella",
      "pal": "Colori"
    },
    "modes": {
      "image": [
        "Il suono definisce l'immagine",
        "In ogni istante, il motivo il cui spettro somiglia di più a quello della musica."
      ],
      "rythme": [
        "Il suono definisce il ritmo",
        "Un passo nella catena di prossimità a ogni attacco di nota."
      ],
      "chemin": [
        "Il suono guida il cammino",
        "Il ritmo decide quando, lo spettro decide verso quale vicino."
      ],
      "octaves": [
        "Il suono segue l'ottava",
        "A ogni attacco, un passo sull'orbita della nota dominante: il cerchio K, poi la sua ottava 4K, poi 16K…, quando questi cerchi esistono."
      ]
    },
    "vues": {
      "signes": [
        "Segni",
        "Le zone positive della figura del motivo."
      ],
      "lignes": [
        "Linee nodali",
        "Le linee dove la figura del motivo si annulla."
      ],
      "pavage": [
        "Celle",
        "Il motivo stesso, in pavimentazione 2 × 2."
      ]
    },
    "format": {
      "titre": "Ordine {n}",
      "detail": "Griglia di {g} × {g} caselle",
      "bientot": "Ordine {n} (seconda consegna)"
    },
    "chargementOrdre": "Caricamento dell'ordine {n}…",
    "ordreIndisponible": "I dati dell'ordine {n} non si caricano: {message}",
    "collections": {
      "tri": [
        "Tricolore — motivi unificati",
        "{n} motivi (griglie 12 × 12 distinte)"
      ],
      "bi": [
        "Bicolore — motivi unificati",
        "{n} motivi (due specchi, leggibili con la regola del 3 ottobre)"
      ],
      "ce": [
        "Bicolore — simmetria centrale",
        "{n} motivi (solo simmetria centrale a 180°, leggibili con la regola del 3 ottobre)"
      ],
      "b1971128": [
        "Blocco 1971128",
        "{n} motivi"
      ],
      "b16012838": [
        "Blocco 16012838",
        "{n} motivi"
      ],
      "b3016090": [
        "Blocco 3016090",
        "{n} motivi"
      ],
      "f613": [
        "Famiglia 613",
        "{n} motivi"
      ],
      "f18": [
        "Famiglia 18",
        "{n} motivi"
      ],
      "fpilote": [
        "Famiglia pilota",
        "{n} motivi"
      ],
      "p18": [
        "Croce 1·2",
        "{n} motivi"
      ],
      "p30": [
        "Croce 1·2",
        "{n} motivi"
      ]
    },
    "fondGroupes": {
      "aplat": "Tinta unita",
      "triangles": "Triangoli",
      "bandes": "Bande"
    },
    "fondVariantes": {
      "B3x": "Tre bande",
      "B121x": "Banda centrale",
      "B11211Dx": "Bande oblique"
    },
    "fondAide": "Una casella porta quattro triangoli; ciascuno è disegnato con il fondo scelto, oppure con i due colori scambiati.",
    "fondSeulementBicolore": "La variante di casella si applica solo alla collezione bicolore.",
    "palettes": {
      "creme": [
        "Inchiostro e crema",
        "I colori del sito."
      ],
      "monochrome": [
        "Grigio e bianco",
        "Il monocromo del sito."
      ],
      "perso": [
        "I miei colori",
        "Scegli il motivo e lo sfondo."
      ],
      "son": [
        "La tinta segue il suono",
        "La tinta scivola lentamente con la luminosità del suono (disattivata per impostazione predefinita)."
      ]
    },
    "persoMotif": "Motivo",
    "persoFond": "Sfondo",
    "tricoloreAide": "In tricolore: V il più scuro (inchiostro), O grigio medio, M il più chiaro (crema).",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "Impostazioni al volo",
    "lissage": "Livellamento",
    "pulsationTitre": "Pulsazione",
    "pulsations": {
      "attaque": "A ogni attacco",
      "temps": "A ogni battito",
      "quatre": "Ogni 4 pulsazioni"
    },
    "pulsationAide": "Per impostazione predefinita, un cambio a ogni attacco. Quando viene rilevata una pulsazione regolare, puoi cambiare a ogni battito o ogni 4 pulsazioni.",
    "pulsationDetectee": "Pulsazione rilevata: {bpm} al minuto.",
    "pulsationAucune": "Nessuna pulsazione regolare rilevata per ora.",
    "calme": "Riduci i cambiamenti rapidi",
    "calmeAide": "Una dissolvenza più lunga e una tenuta maggiore. Attivato d'ufficio se il tuo sistema chiede meno animazioni.",
    "pente": "Compensa la pendenza dei bassi",
    "pauseImage": "Pausa dell'immagine",
    "optionsTitre": "Opzioni",
    "comprendreTitre": "Per capire",
    "comprendreAide": "Due viste didattiche, senza legame con il suono.",
    "paireTitre": "Il modo (4, 0) e la sua coppia degenere",
    "paireAide": "Su una piastra quadrata, i modi (4, 0) e (0, 4) hanno la stessa frequenza: ogni combinazione è anch'essa un modo di quella frequenza. Il cursore passa da cos(4πx/a) + cos(4πy/a) (a destra) a cos(4πx/a) − cos(4πy/a) (a sinistra); al centro resta solo cos(4πx/a), linee verticali. Zone chiare e scure: segni opposti; tratto: linea nodale.",
    "paireMelange": "Miscela s: cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "Figura del modo (4, 0) mescolato con la sua coppia degenere",
    "moireTitre": "La parità come sovrapposizione di due reticoli di ±1",
    "moireAide": "Ogni reticolo è una scacchiera: la parità (−1)^(i + j) della casella (i, j). Il loro prodotto vale +1 dove i due concordano e −1 dove differiscono: è lo XNOR dei bit, come due polarizzatori incrociati. Spostando o ruotando un poco uno dei due, compare un moiré.",
    "moireAngle": "Rotazione del secondo reticolo (gradi)",
    "moirePeriode": "Periodo del secondo reticolo (in % di quello del primo)",
    "moireA": "Reticolo A",
    "moireB": "Reticolo B",
    "moireProduit": "Prodotto A × B (XNOR)",
    "moireAlt": "Prodotto di due reticoli di ±1",
    "clesTitre": "Lettura in chiavi",
    "clesAide": "Solo visualizzazione: le chiavi della nota degli assi (72 chiavi senza duplicati, parità contata dalla casella d'angolo, rango 70) la cui somma restituisce la figura del motivo scelto, quando esiste. La pagina non afferma alcun legame tra una chiave e una frequenza.",
    "clesNatures": {
      "D+": "diagonale x + y",
      "D-": "diagonale y − x",
      "H": "orizzontale",
      "V": "verticale"
    },
    "clesFigure": {
      "figure": "Figura del motivo",
      "V": "Classe V (viola)",
      "O": "Classe O (arancione)",
      "M": "Classe M (magenta)"
    },
    "clesActives": "{n} chiavi attive: {liste}",
    "clesAucune": "nessuna chiave (figura vuota)",
    "clesComplement": " (a meno del complemento)",
    "clesHors": "Questa figura non è la somma di chiavi: esce dallo spazio che esse generano.",
    "clesMotif": "Motivo {i} di {n}, collezione {collection}.",
    "clesOrdre12": "La lettura in chiavi riguarda solo l'ordine 12.",
    "loiTitre": "Legge di frequenza dei cerchi",
    "loiChoix": {
      "racine": "Scala compressa per l'orecchio",
      "plaque": "Legge della piastra reale"
    },
    "loiAide": "Scala compressa: f = frequenza di riferimento × √K / 2 (impostazione iniziale). Legge della piastra: f = c × K, come una piastra reale (alluminio da 3 mm, 48 cm: c = 31,85 Hz). All'ordine 12, da 32 a 2 293 Hz; i cerchi oltre 0,9 × la frequenza di Nyquist sono ignorati, come prima. Il rilevatore di attacchi e il tracciamento della tinta non cambiano.",
    "loiC": "c (Hz per unità di m² + n²)",
    "figureTitre": "Figura (viste Segni e Linee)",
    "figureChoix": {
      "motif": "Del motivo scelto",
      "son": "Del suono",
      "ecart": "Entrambe (scarto)"
    },
    "figureAide": "Del motivo scelto: la figura di Chladni del motivo scelto (impostazione iniziale). Del suono: la somma delle onde di ciascun cerchio, ponderate dall'energia che il suono vi mette, senza passare da un motivo. Entrambe: i punti in cui queste due figure differiscono. Il suono non fornisce le fasi: sono poste a zero.",
    "sceneTitre": "La scena",
    "projection": "Apri una finestra di proiezione",
    "sceneAide": "Lo schermo intero avvia sempre la finestra convalidata, mai la prova; i comandi e il cursore si nascondono dopo 3 secondi. Esc per tornare. La finestra di proiezione è separata: trascinala su un secondo schermo o un proiettore.",
    "projectionBloquee": "La finestra di proiezione è stata bloccata dal browser. Consenti i popup per questo sito, poi riprova.",
    "veille": "Lo schermo resta acceso durante la riproduzione quando il browser lo consente.",
    "enregTitre": "Registra",
    "enreg": "Registra 15 s",
    "enregEnCours": "Registrazione: {s} s",
    "format916": "9:16 (Reels, Shorts, TikTok)",
    "format45": "4:5 (post)",
    "format11": "1:1 (quadrato)",
    "formatVideo": "Formato del video",
    "signature": "Banda «{texte}» in fondo al video",
    "enregPret": "Video registrato: il download è iniziato.",
    "enregWebm": "Il tuo browser non scrive MP4: il video è in formato WebM. Per convertirlo in MP4 (Instagram, TikTok), passalo da un convertitore o da ffmpeg: ffmpeg -i file.webm file.mp4.",
    "enregAac": "Audio AAC nell'MP4: si legge ovunque (iPhone, QuickTime, app di pubblicazione).",
    "enregOpusAvant": "Questo browser scrive l'audio dell'MP4 in Opus: potrebbe non leggersi su iPhone, QuickTime o in alcune app di pubblicazione (Chrome desktop recente: AAC).",
    "enregOpus": "Audio Opus: potrebbe non leggersi su iPhone, QuickTime o in alcune app di pubblicazione. Per una traccia AAC: ffmpeg -i file.mp4 -c:v copy -c:a aac uscita.mp4.",
    "enregIndispo": "La registrazione video non è disponibile in questo browser.",
    "enregSansSource": "Avvia prima un suono: il silenzio non si registra.",
    "enregErreur": "La registrazione non parte: {message}",
    "raccourcisTitre": "Scorciatoie da tastiera",
    "raccourcis": [
      [
        "1 – 3",
        "Vista della prova: segni, linee nodali, celle"
      ],
      [
        "Spazio",
        "Modalità di controllo successiva (prova)"
      ],
      [
        "P",
        "Pausa dell'immagine"
      ],
      [
        "V",
        "Convalida la prova"
      ],
      [
        "F",
        "Schermo intero (finestra convalidata)"
      ],
      [
        "R",
        "Registra 15 s"
      ]
    ],
    "infoMotif": "Motivo {i} di {n}",
    "infoImages": "{fps} immagini/s",
    "infoResolution": "risoluzione ridotta",
    "semaineTitre": "La settimana",
    "semaineMention": "Musica composta con l'IA da MC Claude.",
    "semaineTiers": "Un clic su un poster carica il lettore di YouTube o di TikTok: un servizio di terze parti, che riceve allora la tua visita. Prima non viene caricato nulla.",
    "jourTitre": "Giorno {n} — {tonalite}",
    "datePub": "Pubblicato il {date}",
    "bientot": "Presto",
    "lire": "Guarda il video del giorno {n}, {tonalite}",
    "lireTiktok": "Guarda qui (TikTok)",
    "voirYoutube": "Guarda su YouTube",
    "voirTiktok": "Guarda su TikTok",
    "afficheAlt": "Poster del giorno {n} — {tonalite}",
    "lecteurTitre": "Video del giorno {n}",
    "voirAussiTitre": "Vedi anche",
    "voirAussi": [
      {
        "href": "/galerie-bicolore.html",
        "titre": "Galleria bicolore",
        "texte": "I motivi bicolori generati dagli assi, chiusi sul cubo: grana, pavimentazione, esportazione. (Pagina in francese.)"
      },
      {
        "href": "/galerie-patterns-unifies.html",
        "titre": "Galleria tricolore",
        "texte": "I motivi unificati, generati dalla miscela di tinte: seleziona un motivo per vedere la sua pavimentazione. (Pagina in francese.)"
      },
      {
        "href": "/fonds-ecran.html",
        "titre": "Sfondi",
        "texte": "Sfondi tessili a schermo intero, reattivi al suono o in modalità meditativa. (Pagina in francese.)"
      },
      {
        "href": "/it/animations/",
        "titre": "Galleria di animazioni",
        "texte": "Le animazioni delle collezioni di fondi, da guardare e da scaricare in MP4."
      },
      {
        "href": "/chladni.html",
        "titre": "Chladni",
        "texte": "Figure, scale e frequenze: la pagina che lega il vocabolario dei motivi ai modi di una piastra. (Pagina in francese.)"
      },
      {
        "href": "/it/book/",
        "titre": "Il libro",
        "texte": "La Livrée d'Hermès online, pagina per pagina, con il PDF gratuito."
      }
    ]
  },
  ja: {
    "titrePage": "自分の音楽を見る — La Livrée d'Hermès",
    "description": "自分の音楽を見る：曲、ファイル、またはマイクを選ぶと、音が描くクラドニ図形と、それに最もよく似た La Livrée d'Hermès の紋様が見られます。音とともに15秒間を録画できます。",
    "ariane": "自分の音楽を見る",
    "h1": "自分の音楽を見る",
    "intro": "どんな音楽にも署名があります。エネルギーが周波数ごとにどう分かれているか、ということです。「聴く」を押すと、このページはそのエネルギーを測り、音が描くクラドニ図形を描いて、La Livrée d'Hermès の統一紋様の中から、スペクトルが最もよく似たものを探します。選択の根拠は2つのスペクトルの類似であり、音楽上の法則ではありません。紋様が曲を「表現」するわけではありません。",
    "discretion": "何もブラウザの外には出ません。ファイル、マイク、取り込んだ音声はその場で解析され、どこにも送信されません。",
    "flash": "注意：画像が素早く切り替わったり、点滅したりすることがあります。「オプションを増やす」の中の「急な変化を抑える」設定で、動きがゆるやかになります。",
    "sonTitre": "音",
    "sonChoix": "音",
    "morceau": "付属の曲 {n} — {note}",
    "notes": {
      "j1": "嬰ハ",
      "j2": "イ",
      "j3": "ニ",
      "j4": "ホ",
      "j5": "ト",
      "j6": "ロ",
      "j7": "ハ"
    },
    "tonalites": {
      "do dièse mineur": "嬰ハ短調",
      "la mineur": "イ短調",
      "ré mineur": "ニ短調",
      "mi mineur": "ホ短調",
      "sol mineur": "ト短調",
      "si mineur": "ロ短調",
      "do mineur": "ハ短調"
    },
    "sourceFichier": "自分のオーディオファイル…",
    "sourceMicro": "マイク",
    "sourceEssai": "テスト用の音楽",
    "sourceOnglet": "タブの音声",
    "lecture": "再生",
    "pause": "一時停止",
    "arreter": "停止",
    "ecouter": "聴く",
    "plusOptions": "オプションを増やす",
    "moinsOptions": "オプションを減らす",
    "animerFigure": "図形を動かす",
    "figerFigure": "図形を止める",
    "figureFixeAide": "アニメーションを停止中（動きを減らす設定）：「図形を動かす」ボタン",
    "audioInterrompu": "音が中断されました（通話、他のアプリ、スリープ）。「聴く」を押すと再開します。",
    "image": "画像",
    "imagePrete": "画像を保存しました。ダウンロードが始まりました。",
    "imageErreur": "画像を作成できませんでした。",
    "partager": "共有",
    "partageErreur": "共有に失敗しました：{message}",
    "copierLien": "リンクをコピー",
    "lienCopie": "リンクをコピーしました：{lien}",
    "lienManuel": "このリンクを手動でコピーしてください：{lien}",
    "appareilTitre": "デバイス情報",
    "appareilAide": "問題が起きたときに作者へ送るための1行のテキストです。ブラウザとシステム（種類とバージョンのみ）、音の状態、録画機能と動画形式、共有、画面。何も送信されません。コピーするのはあなたです。",
    "appareilLigne": "コピーする情報",
    "appareilCopier": "コピー",
    "appareilCopie": "情報をコピーしました。",
    "appareilManuel": "テキストを選択して手動でコピーしてください。",
    "oui": "はい",
    "non": "いいえ",
    "appareilSansContexte": "まだ作成されていません",
    "appareilSansEnregistreur": "録画機能なし",
    "commentTitre": "仕組み",
    "comment1": "このページは、正方形の板の振動モードの各円の周波数で音のエネルギーを測り、対応するクラドニ図形を描いて、La Livrée d'Hermès の紋様の中から、スペクトルが音のスペクトルに最もよく似たものを探します。",
    "comment2": "クラドニ図形とは、振動する板の上で砂が作る模様のことです。砂は動かない線に沿って集まります。ここでは板は正方形です。",
    "comment3": "ここでの「似ている」とは、2つのスペクトルが近いということです。エネルギーが周波数ごとに同じように分かれています。選択の根拠は2つのスペクトルの類似であり、音楽上の法則ではありません。紋様が曲を「表現」するわけではありません。",
    "comment4": "録画した画像や動画はお使いのブラウザ内で作られ、お使いのデバイスにダウンロードされます。",
    "comment5": "「聴く」を押すと、そのときはじめてマイクの許可を求めます（それより前には求めません）。マイクがない、または許可されない場合は、例の曲を再生します。別の曲や音声ファイルを選ぶこともできます。「オプションを増やす」では、図形の画像や、音付きの15秒の動画を録画できます。",
    "comment6": "コンテンツは CC BY-NC 4.0 ライセンス、コードは AGPL v3 ライセンスです（商用ライセンスは要望に応じて提供）。作者：Anibal Edelberto Amiot。",
    "commentAuteur": "作者について",
    "refAlt": "ページが生成した図形の例：大きな黒とクリーム色の菱形の市松模様で、交点に小さな丸い形があります。",
    "refLegende": "実際の例：例の曲 {m} を {s} 秒再生したところ、{n} 個の紋様のうち {i} 番目が、音のスペクトルに最もよく似たものです。",
    "sansJs": "聴くには JavaScript が必要です。有効にすると曲が聞こえ、図形が動くのが見えます。下の文章と例の画像は、JavaScript なしでも読めます。",
    "figureAria": "選ばれた紋様の図形：{nom}",
    "entree": "オーディオ入力",
    "entreeDefaut": "既定の入力",
    "entreeAide": "ミキサー、サウンドカード：接続し、マイクを許可してから、ここで選んでください。",
    "sensibilite": "アタックのしきい値",
    "sensibiliteAide": "平均を上回る標準偏差で表します。低いほど、音の変化に敏感になります。",
    "intervalle": "2つのアタックの最小間隔（秒）",
    "intervalleAide": "既定は 0.45 秒で、1分あたり最大およそ133回のアタックです。速いテンポでは下げてください。",
    "mentionIA": "付属の曲は AI の助けを借りて作曲されています（「MC Claude が AI で作曲した音楽。」）。",
    "etatDepart": "「聴く」を押してください。そのときマイクの許可を求めます。曲を選ぶこともできます。付属の曲は AI の助けを借りて作曲されています。",
    "etatMorceau": "付属の曲。AI の助けを借りて作曲されています。",
    "etatFichier": "ファイル：{nom}（ブラウザの中にとどまります）。",
    "etatMicro": "マイクがオンです。",
    "etatEntree": "入力「{nom}」がオンです。",
    "etatOnglet": "タブの音声がオンです。",
    "etatEssai": "テスト用の音楽。",
    "erreurMicroRefuse": "マイクが拒否されました。サイトの設定（アドレスの左の鍵のアイコン）で許可してから、もう一度「聴く」を押してください。ファイルや付属の曲を選ぶこともできます。",
    "erreurMicroAbsent": "この端末で使えるマイクがありません。",
    "erreurMicro": "マイクが起動しません：{message}",
    "microRepliRefuse": "マイクが許可されなかったため、代わりに例の曲を再生しています。マイクを使うには、サイトの設定（アドレスの左の鍵のアイコン）で許可し、音源の一覧で「マイク」を選んでから「聴く」を押してください。",
    "microRepliAbsent": "この端末では使えるマイクがないため、代わりに例の曲を再生しています。",
    "microRepliAutre": "マイクを開始できません（{message}）。代わりに例の曲を再生しています。",
    "erreurOnglet": "ここではタブの音声を取り込めません。最新のデスクトップ用ブラウザ（Chrome、Edge）が必要で、モバイルと Safari では使えません。",
    "erreurOngletSansSon": "選んだタブから音が届きませんでした。もう一度やり直し、「タブの音声を共有」にチェックを入れてください。",
    "erreurFichier": "このファイルは音として読み込めません。",
    "erreurAudio": "音を開始できません：{message}",
    "erreurDonnees": "ページのデータを読み込めません：{message}",
    "bandeManque": "背景コレクションに背景「{id}」がありません",
    "microCoupe": "音源が停止しました（機器が外されたか、許可が取り消されました）。",
    "silence": "無音：音を再生してください。",
    "valide": "確定済み",
    "valideTag": "現在",
    "essai": "試用",
    "essaiTag": "プレビュー",
    "validerEssai": "試用を確定",
    "annuler": "キャンセル",
    "pleinEcran": "全画面",
    "quitterPleinEcran": "全画面を終了",
    "fenetresAide": "暗い背景：確定済み。金色の枠：試用中。選択肢にカーソルを合わせると試用で確認でき、クリックで保持し、その後「試用を確定」を押します。",
    "fenetreValide": "確定済みのウィンドウ",
    "fenetreEssai": "試用ウィンドウ",
    "basculeValide": "確定済み",
    "basculeEssai": "試用",
    "pleinEcranIndispo": "このブラウザでは全画面を使えません。",
    "pleinEcranRepli": "このブラウザは、この要素にネイティブの全画面を提供していません。ステージがウィンドウ全体を覆います。Esc キーまたはボタンで閉じます。",
    "groupes": {
      "mode": "音による制御",
      "fmt": "形式（次数）",
      "col": "コレクション",
      "view": "表示",
      "fond": "マスの変種",
      "pal": "色"
    },
    "modes": {
      "image": [
        "音が像を決める",
        "各瞬間に、スペクトルが音楽のスペクトルに最もよく似た紋様を表示します。"
      ],
      "rythme": [
        "音がリズムを決める",
        "音符のアタックごとに、近さの連鎖を1歩進みます。"
      ],
      "chemin": [
        "音が道筋を導く",
        "リズムが「いつ」を、スペクトルが「どの隣へ」を決めます。"
      ],
      "octaves": [
        "音がオクターブをたどる",
        "アタックごとに、主音の軌道を1歩進みます。円 K、次にそのオクターブ 4K、次に 16K…（これらの円が存在する場合）。"
      ]
    },
    "vues": {
      "signes": [
        "符号",
        "紋様の図形の正の領域。"
      ],
      "lignes": [
        "節線",
        "紋様の図形がゼロになる線。"
      ],
      "pavage": [
        "セル",
        "紋様そのもの。2 × 2 の敷き詰め。"
      ]
    },
    "format": {
      "titre": "{n} 次",
      "detail": "{g} × {g} マスのグリッド",
      "bientot": "{n} 次（第2回の納品）"
    },
    "chargementOrdre": "{n} 次を読み込んでいます…",
    "ordreIndisponible": "{n} 次のデータを読み込めません：{message}",
    "collections": {
      "tri": [
        "三色 — 統一紋様",
        "{n} 個の紋様（互いに異なる 12 × 12 のグリッド）"
      ],
      "bi": [
        "二色 — 統一紋様",
        "{n} 個の紋様（2つの鏡。10月3日の規則で読めます）"
      ],
      "ce": [
        "二色 — 中心対称",
        "{n} 個の紋様（180° の中心対称のみ。10月3日の規則で読めます）"
      ],
      "b1971128": [
        "ブロック 1971128",
        "{n} 個の紋様"
      ],
      "b16012838": [
        "ブロック 16012838",
        "{n} 個の紋様"
      ],
      "b3016090": [
        "ブロック 3016090",
        "{n} 個の紋様"
      ],
      "f613": [
        "族 613",
        "{n} 個の紋様"
      ],
      "f18": [
        "族 18",
        "{n} 個の紋様"
      ],
      "fpilote": [
        "先導の族",
        "{n} 個の紋様"
      ],
      "p18": [
        "十字 1·2",
        "{n} 個の紋様"
      ],
      "p30": [
        "十字 1·2",
        "{n} 個の紋様"
      ]
    },
    "fondGroupes": {
      "aplat": "無地",
      "triangles": "三角形",
      "bandes": "ストライプ"
    },
    "fondVariantes": {
      "B3x": "3本のストライプ",
      "B121x": "中央のストライプ",
      "B11211Dx": "斜めのストライプ"
    },
    "fondAide": "1つのマスには4つの三角形があり、それぞれ選んだ背景で、または2色を入れ替えて描かれます。",
    "fondSeulementBicolore": "マスの変種は二色のコレクションにのみ適用されます。",
    "palettes": {
      "creme": [
        "墨とクリーム",
        "サイトの色。"
      ],
      "monochrome": [
        "グレーと白",
        "サイトのモノクロ。"
      ],
      "perso": [
        "自分の色",
        "紋様と背景を選びます。"
      ],
      "son": [
        "色合いが音に従う",
        "色合いが音の明るさに合わせてゆっくり移ります（既定ではオフ）。"
      ]
    },
    "persoMotif": "紋様",
    "persoFond": "背景",
    "tricoloreAide": "三色では、V が最も暗く（墨）、O が中間のグレー、M が最も明るい（クリーム）色です。",
    "legendeFenetre": "{mode} · {collection} · {vue}{fond} · {palette}",
    "reglagesTitre": "その場での設定",
    "lissage": "平滑化",
    "pulsationTitre": "拍動",
    "pulsations": {
      "attaque": "アタックごと",
      "temps": "拍ごと",
      "quatre": "4拍ごと"
    },
    "pulsationAide": "既定ではアタックごとに切り替わります。規則的な拍動が検出されると、拍ごと、または4拍ごとに切り替えられます。",
    "pulsationDetectee": "拍動を検出：毎分 {bpm}。",
    "pulsationAucune": "今のところ、規則的な拍動は検出されていません。",
    "calme": "急な変化を抑える",
    "calmeAide": "フェードが長くなり、保持も長くなります。システムがアニメーションの軽減を求めている場合は、最初からオンです。",
    "pente": "低音の傾斜を補正する",
    "pauseImage": "画像を一時停止",
    "optionsTitre": "オプション",
    "comprendreTitre": "理解のために",
    "comprendreAide": "音とは関係のない、学習用の2つの表示。",
    "paireTitre": "モード (4, 0) とその縮退した対",
    "paireAide": "正方形の板では、モード (4, 0) と (0, 4) は同じ周波数を持ちます。その任意の組み合わせも、その周波数のモードです。スライダーは cos(4πx/a) + cos(4πy/a)（右）から cos(4πx/a) − cos(4πy/a)（左）まで動き、中央では cos(4πx/a) のみ、つまり縦線だけが残ります。明るい領域と暗い領域は符号が逆で、線は節線です。",
    "paireMelange": "混合 s：cos(4πx/a) + s · cos(4πy/a)",
    "paireAlt": "縮退した対と混ぜたモード (4, 0) の図形",
    "moireTitre": "パリティを2つの ±1 格子の重ね合わせとして見る",
    "moireAide": "各格子は市松模様で、マス (i, j) のパリティ (−1)^(i + j) です。2つの積は、一致するところで +1、異なるところで −1 になります。これはビットの XNOR で、直交した2枚の偏光板のようなものです。一方を少しずらしたり回したりすると、モアレが現れます。",
    "moireAngle": "2つ目の格子の回転（度）",
    "moirePeriode": "2つ目の格子の周期（1つ目に対する %）",
    "moireA": "格子 A",
    "moireB": "格子 B",
    "moireProduit": "積 A × B（XNOR）",
    "moireAlt": "2つの ±1 格子の積",
    "clesTitre": "鍵による読み取り",
    "clesAide": "表示のみ：軸の記法の鍵（重複を除いた72個の鍵、パリティは隅のマスから数え、階数70）のうち、その和が選んだ紋様の図形になるもの（存在する場合）。このページは、鍵と周波数の間にいかなる関係も主張しません。",
    "clesNatures": {
      "D+": "対角線 x + y",
      "D-": "対角線 y − x",
      "H": "水平",
      "V": "垂直"
    },
    "clesFigure": {
      "figure": "紋様の図形",
      "V": "クラス V（紫）",
      "O": "クラス O（オレンジ）",
      "M": "クラス M（マゼンタ）"
    },
    "clesActives": "有効な鍵 {n} 個：{liste}",
    "clesAucune": "鍵なし（空の図形）",
    "clesComplement": "（補集合を除いて）",
    "clesHors": "この図形は鍵の和ではありません。鍵が生成する空間の外にあります。",
    "clesMotif": "紋様 {i} / {n}、コレクション {collection}。",
    "clesOrdre12": "鍵による読み取りは12次にのみ適用されます。",
    "loiTitre": "円の周波数の法則",
    "loiChoix": {
      "racine": "耳のために圧縮した目盛り",
      "plaque": "実際の板の法則"
    },
    "loiAide": "圧縮した目盛り：f = 基準周波数 × √K / 2（初期設定）。板の法則：f = c × K。実際の板（厚さ3 mm、48 cm のアルミ：c = 31.85 Hz）と同じです。12次では 32 〜 2 293 Hz。ナイキスト周波数の 0.9 倍を超える円は、従来どおり無視されます。アタック検出器と色合いの追従は変わりません。",
    "loiC": "c（m² + n² の単位あたりの Hz）",
    "figureTitre": "図形（符号と線の表示）",
    "figureChoix": {
      "motif": "選んだ紋様の",
      "son": "音の",
      "ecart": "両方（差）"
    },
    "figureAide": "選んだ紋様の：選んだ紋様のクラドニ図形（初期設定）。音の：各円の波の和を、音がそこに込めるエネルギーで重み付けしたもの（紋様を経由しません）。両方：この2つの図形が異なる場所。音から位相は得られないため、位相はゼロに置かれます。",
    "sceneTitre": "ステージ",
    "projection": "投影ウィンドウを開く",
    "sceneAide": "全画面は常に確定済みのウィンドウを起動し、試用は起動しません。操作部とカーソルは3秒後に隠れます。Esc で戻ります。投影ウィンドウは別ウィンドウで、2台目の画面やプロジェクターにドラッグできます。",
    "projectionBloquee": "投影ウィンドウがブラウザにブロックされました。このサイトのポップアップを許可してから、もう一度お試しください。",
    "veille": "ブラウザが許可すれば、再生中は画面が点灯したままになります。",
    "enregTitre": "録画",
    "enreg": "15秒録画",
    "enregEnCours": "録画中：{s} 秒",
    "format916": "9:16（Reels、Shorts、TikTok）",
    "format45": "4:5（投稿）",
    "format11": "1:1（正方形）",
    "formatVideo": "動画の形式",
    "signature": "動画の下部に「{texte}」の帯を入れる",
    "enregPret": "動画を録画しました。ダウンロードが始まりました。",
    "enregWebm": "お使いのブラウザは MP4 を書き出せません。動画は WebM 形式です。MP4 に変換する（Instagram、TikTok）には、変換ツールか ffmpeg を使ってください：ffmpeg -i ファイル.webm ファイル.mp4。",
    "enregAac": "MP4 の AAC 音声：どこでも再生できます（iPhone、QuickTime、投稿アプリ）。",
    "enregOpusAvant": "このブラウザは MP4 の音声を Opus で書き出します。iPhone、QuickTime、一部の投稿アプリでは再生できないことがあります（最新のデスクトップ版 Chrome：AAC）。",
    "enregOpus": "Opus 音声：iPhone、QuickTime、一部の投稿アプリでは再生できないことがあります。AAC のトラックにするには：ffmpeg -i ファイル.mp4 -c:v copy -c:a aac 出力.mp4。",
    "enregIndispo": "このブラウザでは動画の録画を使えません。",
    "enregSansSource": "先に音を再生してください。無音は録画できません。",
    "enregErreur": "録画を開始できません：{message}",
    "raccourcisTitre": "キーボードショートカット",
    "raccourcis": [
      [
        "1 – 3",
        "試用の表示：符号、節線、セル"
      ],
      [
        "スペース",
        "次の制御モード（試用）"
      ],
      [
        "P",
        "画像を一時停止"
      ],
      [
        "V",
        "試用を確定"
      ],
      [
        "F",
        "全画面（確定済みのウィンドウ）"
      ],
      [
        "R",
        "15秒録画"
      ]
    ],
    "infoMotif": "紋様 {i} / {n}",
    "infoImages": "{fps} コマ/秒",
    "infoResolution": "解像度を下げています",
    "semaineTitre": "今週",
    "semaineMention": "MC Claude が AI で作曲した音楽。",
    "semaineTiers": "ポスターをクリックすると、YouTube または TikTok のプレーヤーが読み込まれます。これは第三者のサービスで、その時点であなたの訪問を受け取ります。それまでは何も読み込まれません。",
    "jourTitre": "{n} 日目 — {tonalite}",
    "datePub": "{date} 公開",
    "bientot": "近日公開",
    "lire": "{n} 日目の動画を再生、{tonalite}",
    "lireTiktok": "ここで再生（TikTok）",
    "voirYoutube": "YouTube で見る",
    "voirTiktok": "TikTok で見る",
    "afficheAlt": "{n} 日目のポスター — {tonalite}",
    "lecteurTitre": "{n} 日目の動画",
    "voirAussiTitre": "関連ページ",
    "voirAussi": [
      {
        "href": "/galerie-bicolore.html",
        "titre": "二色ギャラリー",
        "texte": "軸から生まれ、立方体上で閉じる二色紋様：粒度、敷き詰め、書き出し。（フランス語のページ）"
      },
      {
        "href": "/galerie-patterns-unifies.html",
        "titre": "三色ギャラリー",
        "texte": "色合いの混合から生まれた統一紋様。紋様を選ぶと、その敷き詰めを見られます。（フランス語のページ）"
      },
      {
        "href": "/fonds-ecran.html",
        "titre": "壁紙",
        "texte": "フルスクリーンの織物壁紙。音に反応するモードと瞑想モードがあります。（フランス語のページ）"
      },
      {
        "href": "/ja/animations/",
        "titre": "アニメーションギャラリー",
        "texte": "背景コレクションのアニメーション。視聴と MP4 でのダウンロードができます。"
      },
      {
        "href": "/chladni.html",
        "titre": "Chladni",
        "texte": "図形、音階、周波数：紋様の語彙を板のモードに結びつけるページ。（フランス語のページ）"
      },
      {
        "href": "/ja/book/",
        "titre": "本",
        "texte": "La Livrée d'Hermès をオンラインで1ページずつ読めます。PDF は無料です。"
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
