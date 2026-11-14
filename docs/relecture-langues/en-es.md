# Relecture — « Voir sa musique » en anglais et en espagnol

Généré par `node scripts/build-musique-textes.mjs` depuis `data/musique-chladni/traductions/<langue>.json` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. Relues par Anibal lui-même.

Page concernée : « Voir sa musique » (`musique-chladni.html` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir `TODO-RELECTURE.md`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.

## English (`en`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | English |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | See your music — La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | See your music: choose a track, a file or the microphone and watch the Chladni figure the sound draws, then the La Livrée d'Hermès pattern that resembles it most. Record 15 seconds with the sound. |
| `ariane` | Voir sa musique | See your music |
| `h1` | Voir sa musique | See your music |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | Every piece of music has a signature: the way its energy is spread across frequencies. Choose a track, a file or the microphone: the page measures that energy at the frequencies of each circle of modes of a square plate, then looks, among the unified patterns of La Livrée d'Hermès, for the one whose spectrum resembles it most. The choice rests on the resemblance of two spectra, not on a musical law: a pattern does not “express” a piece. |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | Nothing leaves your browser: the file, the microphone and the captured audio are analysed on the spot and sent nowhere. |
| `flash` | Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit. | Warning: the images can change fast and flicker. The “reduce rapid changes” setting slows them down. |
| `sonTitre` | Le son | The sound |
| `sonChoix` | Son | Sound |
| `morceau` | Morceau fourni {n} — {note} | Provided track {n} — {note} |
| `notes.j1` | do dièse | C♯ |
| `notes.j2` | la | A |
| `notes.j3` | ré | D |
| `notes.j4` | mi | E |
| `notes.j5` | sol | G |
| `notes.j6` | si | B |
| `notes.j7` | do | C |
| `tonalites.do dièse mineur` | do dièse mineur | C♯ minor |
| `tonalites.la mineur` | la mineur | A minor |
| `tonalites.ré mineur` | ré mineur | D minor |
| `tonalites.mi mineur` | mi mineur | E minor |
| `tonalites.sol mineur` | sol mineur | G minor |
| `tonalites.si mineur` | si mineur | B minor |
| `tonalites.do mineur` | do mineur | C minor |
| `sourceFichier` | Mon fichier audio… | My audio file… |
| `sourceMicro` | Microphone | Microphone |
| `sourceEssai` | Musique d'essai | Test music |
| `sourceOnglet` | Audio d'un onglet | Audio of a tab |
| `lecture` | Lecture | Play |
| `pause` | Pause | Pause |
| `arreter` | Arrêter | Stop |
| `entree` | Entrée audio | Audio input |
| `entreeDefaut` | Entrée par défaut | Default input |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | Mixing desk, sound card: plug it in, allow the microphone, then choose it here. |
| `sensibilite` | Seuil des attaques | Attack threshold |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | In standard deviations above the mean: lower means more sensitive to note changes. |
| `intervalle` | Intervalle minimal entre deux attaques (s) | Minimum interval between two attacks (s) |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | 0.45 s by default: at most about 133 attacks per minute. Lower it for a fast tempo. |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | The provided tracks are composed with the help of AI (“Music composed with AI by MC Claude.”). |
| `etatDepart` | Appuyez sur Lecture. Les morceaux fournis sont composés avec l'aide de l'IA. | Press Play. The provided tracks are composed with the help of AI. |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | Provided track, composed with the help of AI. |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | File: {nom} (it stays in your browser). |
| `etatMicro` | Micro actif. | Microphone on. |
| `etatEntree` | Entrée « {nom} » active. | Input “{nom}” on. |
| `etatOnglet` | Audio d'un onglet actif. | Tab audio on. |
| `etatEssai` | Musique d'essai. | Test music. |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau. | The microphone is blocked. Allow it in the site settings (the padlock, left of the address), then click Play again. You can also choose a file or a track. |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | No microphone is available on this device. |
| `erreurMicro` | Le micro ne démarre pas : {message} | The microphone does not start: {message} |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | Capturing a tab’s audio is not possible here. It needs a recent desktop browser (Chrome, Edge); it is missing on mobile and on Safari. |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | The chosen tab provided no sound. Try again and tick “Share tab audio”. |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | This file cannot be read as a sound. |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | The sound cannot start: {message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | The page data does not load: {message} |
| `bandeManque` | la bande {id} manque à la collection de fonds | band {id} is missing from the collection of grounds |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | The source stopped (device unplugged or permission withdrawn). |
| `silence` | Silence : lancez un son. | Silence: start a sound. |
| `valide` | Validé | Validated |
| `valideTag` | en cours | current |
| `essai` | Essai | Trial |
| `essaiTag` | aperçu | preview |
| `validerEssai` | Valider l'essai | Validate the trial |
| `annuler` | Annuler | Cancel |
| `pleinEcran` | Plein écran | Full screen |
| `quitterPleinEcran` | Quitter le plein écran | Exit full screen |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | Dark ground: validated. Golden frame: on trial. Hover an option to see it in the trial, click to keep it, then “Validate the trial”. |
| `fenetreValide` | Fenêtre validée | Validated window |
| `fenetreEssai` | Fenêtre d'essai | Trial window |
| `basculeValide` | Validé | Validated |
| `basculeEssai` | Essai | Trial |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | Full screen is not available in this browser. |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | This browser offers no native full screen for this element: the stage covers the window. Esc or the button closes it. |
| `groupes.mode` | Pilotage du son | Sound control |
| `groupes.fmt` | Format (ordre) | Format (order) |
| `groupes.col` | Collection | Collection |
| `groupes.view` | Vue | View |
| `groupes.fond` | Variante de case | Cell variant |
| `groupes.pal` | Couleurs | Colours |
| `modes.image.0` | Le son définit l'image | Sound defines the image |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | At every moment, the pattern whose spectrum most resembles that of the music. |
| `modes.rythme.0` | Le son définit le rythme | Sound defines the rhythm |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | One step along the proximity chain at each note attack. |
| `modes.chemin.0` | Le son guide le chemin | Sound guides the path |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | The rhythm decides when, the spectrum decides which neighbour. |
| `modes.octaves.0` | Le son suit l'octave | Sound follows the octave |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | At each attack, one step along the orbit of the dominant note: circle K, then its octave 4K, then 16K…, when those circles exist. |
| `vues.signes.0` | Signes | Signs |
| `vues.signes.1` | Les zones positives de la figure du motif. | The positive zones of the pattern’s figure. |
| `vues.lignes.0` | Lignes nodales | Nodal lines |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | The lines where the pattern’s figure vanishes. |
| `vues.pavage.0` | Cellules | Cells |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | The pattern itself, as a 2 × 2 tiling. |
| `format.titre` | Ordre {n} | Order {n} |
| `format.detail` | Grille de {g} × {g} cases | Grid of {g} × {g} cells |
| `format.bientot` | Ordre {n} (seconde livraison) | Order {n} (second delivery) |
| `chargementOrdre` | Chargement de l'ordre {n}… | Loading order {n}… |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | The data of order {n} does not load: {message} |
| `collections.tri.0` | Tricolore — motifs unifiés | Three-colour — unified patterns |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} patterns (distinct 12 × 12 grids) |
| `collections.bi.0` | Bicolore — motifs unifiés | Two-colour — unified patterns |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} patterns (two mirrors, readable by the rule of 3 October) |
| `collections.ce.0` | Bicolore — symétrie centrale | Two-colour — central symmetry |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} patterns (180° central symmetry alone, readable by the rule of 3 October) |
| `collections.b1971128.0` | Bloc 1971128 | Block 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} patterns |
| `collections.b16012838.0` | Bloc 16012838 | Block 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} patterns |
| `collections.b3016090.0` | Bloc 3016090 | Block 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} patterns |
| `collections.f613.0` | Famille 613 | Family 613 |
| `collections.f613.1` | {n} motifs | {n} patterns |
| `collections.f18.0` | Famille 18 | Family 18 |
| `collections.f18.1` | {n} motifs | {n} patterns |
| `collections.fpilote.0` | Famille pilote | Pilot family |
| `collections.fpilote.1` | {n} motifs | {n} patterns |
| `collections.p18.0` | Croix 1·2 | Cross 1·2 |
| `collections.p18.1` | {n} motifs | {n} patterns |
| `collections.p30.0` | Croix 1·2 | Cross 1·2 |
| `collections.p30.1` | {n} motifs | {n} patterns |
| `fond` | Bandes {id} | Bands {id} |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec l'état 1 du fond, ou avec l'état 0 : le même fond tourné de 90°. | A cell carries four triangles; each is drawn with state 1 of the ground, or with state 0: the same ground turned by 90°. |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | The cell variant applies only to the two-colour collection. |
| `palettes.creme.0` | Encre et crème | Ink and cream |
| `palettes.creme.1` | Les couleurs du site. | The colours of the site. |
| `palettes.monochrome.0` | Gris et blanc | Grey and white |
| `palettes.monochrome.1` | Le monochrome du site. | The monochrome of the site. |
| `palettes.perso.0` | Mes couleurs | My colours |
| `palettes.perso.1` | Choisissez le motif et le fond. | Choose the pattern and the ground. |
| `palettes.son.0` | La teinte suit le son | Hue follows the sound |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | The hue drifts slowly with the brightness of the sound (off by default). |
| `persoMotif` | Motif | Pattern |
| `persoFond` | Fond | Ground |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | In three-colour: V the darkest (ink), O mid grey, M the lightest (cream). |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | Live settings |
| `lissage` | Lissage | Smoothing |
| `pulsationTitre` | Pulsation | Pulse |
| `pulsations.attaque` | À chaque attaque | At every attack |
| `pulsations.temps` | À chaque temps | At every beat |
| `pulsations.quatre` | Toutes les 4 pulsations | Every 4 beats |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | By default, a change at every attack. When a regular pulse is detected, you can change at every beat or every 4 beats. |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | Pulse detected: {bpm} per minute. |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | No regular pulse detected so far. |
| `calme` | Réduire les changements rapides | Reduce rapid changes |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | A longer fade and a longer hold. On by default if your system asks for less animation. |
| `pente` | Compenser la pente des graves | Compensate for the bass slope |
| `pauseImage` | Pause de l'image | Freeze the image |
| `optionsTitre` | Options | Options |
| `comprendreTitre` | Pour comprendre | To understand |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | Two teaching views, unrelated to the sound. |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | The (4, 0) mode and its degenerate pair |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | On a square plate, the (4, 0) and (0, 4) modes have the same frequency: any combination is also a mode of that frequency. The slider goes from cos(4πx/a) + cos(4πy/a) (right) to cos(4πx/a) − cos(4πy/a) (left); in the middle only cos(4πx/a) remains, vertical lines. Light and dark zones: opposite signs; line: nodal line. |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | Mix s: cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | Figure of the (4, 0) mode mixed with its degenerate pair |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | Parity as the superposition of two ±1 lattices |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | Each lattice is a checkerboard: the parity (−1)^(i + j) of cell (i, j). Their product is +1 where the two agree and −1 where they differ: it is the XNOR of the bits, like two crossed polarisers. Shifting or slightly turning one of the two produces a moiré. |
| `moireAngle` | Rotation du second réseau (degrés) | Rotation of the second lattice (degrees) |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | Period of the second lattice (in % of the first) |
| `moireA` | Réseau A | Lattice A |
| `moireB` | Réseau B | Lattice B |
| `moireProduit` | Produit A × B (XNOR) | Product A × B (XNOR) |
| `moireAlt` | Produit de deux réseaux de ±1 | Product of two ±1 lattices |
| `clesTitre` | Lecture en clés | Reading in keys |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | Display only: the keys of the axes note (72 de-duplicated keys, parity counted from the corner cell, rank 70) whose sum gives back the figure of the chosen pattern, when it exists. The page asserts no link between a key and a frequency. |
| `clesNatures.D+` | diagonale x + y | diagonal x + y |
| `clesNatures.D-` | diagonale y − x | diagonal y − x |
| `clesNatures.H` | horizontale | horizontal |
| `clesNatures.V` | verticale | vertical |
| `clesFigure.figure` | Figure du motif | Pattern figure |
| `clesFigure.V` | Classe V (violet) | Class V (violet) |
| `clesFigure.O` | Classe O (orange) | Class O (orange) |
| `clesFigure.M` | Classe M (magenta) | Class M (magenta) |
| `clesActives` | {n} clés actives : {liste} | {n} active keys: {liste} |
| `clesAucune` | aucune clé (figure vide) | no key (empty figure) |
| `clesComplement` |  (au complément près) |  (up to the complement) |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | This figure is not a sum of keys: it lies outside the space they generate. |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | Pattern {i} of {n}, collection {collection}. |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | Reading in keys applies only to order 12. |
| `loiTitre` | Loi de fréquence des cercles | Frequency law of the circles |
| `loiChoix.racine` | Échelle compressée pour l'oreille | Scale compressed for the ear |
| `loiChoix.plaque` | Loi de la plaque réelle | Law of the real plate |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | Compressed scale: f = reference frequency × √K / 2 (starting setting). Plate law: f = c × K, like a real plate (3 mm aluminium, 48 cm: c = 31.85 Hz). At order 12, from 32 to 2,293 Hz; circles above 0.9 × the Nyquist frequency are ignored, as before. The attack detector and the hue tracking do not change. |
| `loiC` | c (Hz par unité de m² + n²) | c (Hz per unit of m² + n²) |
| `figureTitre` | Figure (vues Signes et Lignes) | Figure (Signs and Lines views) |
| `figureChoix.motif` | Du motif retenu | Of the chosen pattern |
| `figureChoix.son` | Du son | Of the sound |
| `figureChoix.ecart` | Les deux (écart) | Both (difference) |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | Of the chosen pattern: the Chladni figure of the chosen pattern (starting setting). Of the sound: the sum of the waves of each circle, weighted by the energy the sound puts there, without going through a pattern. Both: the places where these two figures differ. The sound does not provide phases: they are set to zero. |
| `sceneTitre` | La scène | The stage |
| `projection` | Ouvrir une fenêtre de projection | Open a projection window |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | Full screen always launches the validated window, never the trial; the controls and the cursor hide after 3 seconds. Esc to return. The projection window is separate: drag it to a second screen or a projector. |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | The projection window was blocked by the browser. Allow pop-ups for this site, then try again. |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | The screen stays on during playback when the browser allows it. |
| `enregTitre` | Enregistrer | Record |
| `enreg` | Enregistrer 15 s | Record 15 s |
| `enregEnCours` | Enregistrement : {s} s | Recording: {s} s |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16 (Reels, Shorts, TikTok) |
| `format45` | 4:5 (publication) | 4:5 (post) |
| `format11` | 1:1 (carré) | 1:1 (square) |
| `formatVideo` | Format de la vidéo | Video format |
| `signature` | Bandeau « {texte} » en bas de la vidéo | “{texte}” banner at the bottom of the video |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | Video recorded: the download has started. |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | Your browser does not write MP4: the video is in WebM format. To convert it to MP4 (Instagram, TikTok), run it through a converter or ffmpeg: ffmpeg -i file.webm file.mp4. |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | AAC audio in the MP4: plays everywhere (iPhone, QuickTime, publishing apps). |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | This browser writes the MP4’s audio as Opus: it may not play on iPhone, QuickTime or some publishing apps (recent desktop Chrome: AAC). |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | Opus audio: may not play on iPhone, QuickTime or some publishing apps. For an AAC track: ffmpeg -i file.mp4 -c:v copy -c:a aac output.mp4. |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | Video recording is not available in this browser. |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | Start a sound first: silence is not recorded. |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | The recording does not start: {message} |
| `raccourcisTitre` | Raccourcis clavier | Keyboard shortcuts |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | Trial view: signs, nodal lines, cells |
| `raccourcis.1.0` | Espace | Space |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | Next control mode (trial) |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | Freeze the image |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | Validate the trial |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | Full screen (validated window) |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | Record 15 s |
| `infoMotif` | Motif {i} sur {n} | Pattern {i} of {n} |
| `infoImages` | {fps} images/s | {fps} frames/s |
| `infoResolution` | résolution réduite | reduced resolution |
| `semaineTitre` | La semaine | The week |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | Music composed with AI by MC Claude. |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | A click on a poster loads the YouTube or TikTok player: a third-party service, which then receives your visit. Nothing is loaded before. |
| `jourTitre` | Jour {n} — {tonalite} | Day {n} — {tonalite} |
| `datePub` | Publié le {date} | Published on {date} |
| `bientot` | Bientôt | Soon |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | Play the video of day {n}, {tonalite} |
| `lireTiktok` | Lire ici (TikTok) | Play here (TikTok) |
| `voirYoutube` | Voir sur YouTube | Watch on YouTube |
| `voirTiktok` | Voir sur TikTok | Watch on TikTok |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | Poster of day {n} — {tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | Video of day {n} |
| `voirAussiTitre` | Voir aussi | See also |
| `voirAussi.0.href` | /galerie-bicolore.html | /en/two-colour-gallery/ |
| `voirAussi.0.titre` | Galerie bicolore | Two-colour gallery |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | The two-colour patterns generated by the axes, closed on the cube: grain, tiling, export. |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /en/three-colour-gallery/ |
| `voirAussi.1.titre` | Galerie tricolore | Three-colour gallery |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | The unified patterns, generated by mixing hues: select a pattern to see its tiling. |
| `voirAussi.2.href` | /fonds-ecran.html | /en/wallpapers/ |
| `voirAussi.2.titre` | Fonds d'écran | Wallpapers |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | Full-screen textile wallpapers, reacting to sound or in a meditative mode. |
| `voirAussi.3.href` | /galerie-animations.html | /en/animations/ |
| `voirAussi.3.titre` | Galerie d'animations | Animations gallery |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | The animations of the ground collections, to watch and to download as MP4. |
| `voirAussi.4.href` | /chladni.html | /en/chladni/ |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | Figures, scales and frequencies: the page that links the vocabulary of the patterns to the modes of a plate. |
| `voirAussi.5.href` | /fr/livre/ | /en/book/ |
| `voirAussi.5.titre` | Le livre | The book |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès online, page by page, with the free PDF. |

### Voir sa musique — métadonnées de la page

| Clé | Français | English |
|---|---|---|
| `titre, h1` | Voir sa musique — La Livrée d'Hermès | See your music — La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | See your music: the Chladni figure the sound draws, and the La Livrée d'Hermès pattern that resembles it most. Record 15 seconds with the sound. |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | See your music: the Chladni figure the sound draws, and the La Livrée d'Hermès pattern that resembles it most. |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | English |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | The three sound pages |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | Cymatics · Sound creates the form |
| `trois-portes.musique` | Voir sa musique · Le son guide | See your music · Sound guides |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | Wallpaper · Sound fades away |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | English |
|---|---|---|
| `label` | Voir sa musique | See your music |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | Pick a track, a file or the microphone: the page finds the La Livrée d’Hermès pattern whose spectrum is closest to the sound. |

### Page « Outils » (`data/outils-langues/outils-support.json`)

| Clé | Français | English |
|---|---|---|
| `titre` | Outils | Tools |
| `description` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | The interactive tools of La Livrée d'Hermès — compose, visualise, print, encrypt. |
| `intro` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | The interactive tools of La Livrée d'Hermès — compose, visualise, print, encrypt. Pages marked “(page in French)” are not translated yet. |
| `note « page en français »` | — | (page in French) |
| `Accueil (fil d'Ariane)` | Accueil | Home |

### Page « Soutenir »

| Clé | Français | English |
|---|---|---|
| `titre` | Soutenir | Support |
| `description` | Soutenir La Livrée d'Hermès à prix libre : le site et tout son contenu restent entièrement gratuits. | Support La Livrée d'Hermès at a price of your choice: the site and all its content stay entirely free. |
| `intro` | Tout est libre. Le traité, les motifs et les fichiers produits par les outils se téléchargent sans condition, sous licence CC BY-NC 4.0. Votre soutien, à prix libre, finance la suite du projet : de nouveaux motifs, de nouveaux outils, le volet textile. | Everything is free. The treatise, the patterns and the files produced by the tools can be downloaded without condition, under the CC BY-NC 4.0 licence. Your support, at a price of your choice, funds what comes next: new patterns, new tools, the textile side. |
| `bouton` | Aller à la page française pour payer | Go to the French page to pay |
| `note` | Le paiement est sécurisé par Stripe. Montant libre, don facultatif. | Payment is secured by Stripe. Free amount, voluntary donation. The payment page is in French. |
| `h2` | Ce que finance votre soutien | What your support funds |
| `b` | Le temps de recherche, de développement et de traduction | Research, development and translation time |
| `p` | La construction des motifs, des outils du site et leur documentation en quatre langues. | Building the patterns, the site’s tools and their documentation in four languages. |

## Español (`es`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | Español |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | Ver tu música — La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Ver tu música: elige una pieza, un archivo o el micrófono y mira la figura de Chladni que dibuja el sonido, y después el motivo de La Livrée d'Hermès que más se le parece. Graba 15 segundos con el sonido. |
| `ariane` | Voir sa musique | Ver tu música |
| `h1` | Voir sa musique | Ver tu música |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | Cada música tiene una firma: la manera en que su energía se reparte entre las frecuencias. Elige una pieza, un archivo o el micrófono: la página mide esa energía en las frecuencias de cada círculo de modos de una placa cuadrada y busca, entre los motivos unificados de La Livrée d'Hermès, aquel cuyo espectro más se le parece. La elección se basa en el parecido de dos espectros, no en una ley musical: un motivo no «expresa» una pieza. |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | Nada sale de tu navegador: el archivo, el micrófono y el audio capturado se analizan en el propio equipo y no se envían a ninguna parte. |
| `flash` | Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit. | Atención: las imágenes pueden cambiar rápido y parpadear. El ajuste «reducir los cambios rápidos» las ralentiza. |
| `sonTitre` | Le son | El sonido |
| `sonChoix` | Son | Sonido |
| `morceau` | Morceau fourni {n} — {note} | Pieza facilitada {n} — {note} |
| `notes.j1` | do dièse | do sostenido |
| `notes.j2` | la | la |
| `notes.j3` | ré | re |
| `notes.j4` | mi | mi |
| `notes.j5` | sol | sol |
| `notes.j6` | si | si |
| `notes.j7` | do | do |
| `tonalites.do dièse mineur` | do dièse mineur | do sostenido menor |
| `tonalites.la mineur` | la mineur | la menor |
| `tonalites.ré mineur` | ré mineur | re menor |
| `tonalites.mi mineur` | mi mineur | mi menor |
| `tonalites.sol mineur` | sol mineur | sol menor |
| `tonalites.si mineur` | si mineur | si menor |
| `tonalites.do mineur` | do mineur | do menor |
| `sourceFichier` | Mon fichier audio… | Mi archivo de audio… |
| `sourceMicro` | Microphone | Micrófono |
| `sourceEssai` | Musique d'essai | Música de prueba |
| `sourceOnglet` | Audio d'un onglet | Audio de una pestaña |
| `lecture` | Lecture | Reproducir |
| `pause` | Pause | Pausa |
| `arreter` | Arrêter | Detener |
| `entree` | Entrée audio | Entrada de audio |
| `entreeDefaut` | Entrée par défaut | Entrada predeterminada |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | Mesa de mezclas, tarjeta de sonido: conéctala, autoriza el micrófono y elígela aquí. |
| `sensibilite` | Seuil des attaques | Umbral de ataques |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | En desviaciones típicas por encima de la media: más bajo, más sensible a los cambios de nota. |
| `intervalle` | Intervalle minimal entre deux attaques (s) | Intervalo mínimo entre dos ataques (s) |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | 0,45 s por defecto: como máximo unos 133 ataques por minuto. Bájalo para un tempo rápido. |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | Las piezas facilitadas están compuestas con ayuda de la IA («Música compuesta con IA por MC Claude.»). |
| `etatDepart` | Appuyez sur Lecture. Les morceaux fournis sont composés avec l'aide de l'IA. | Pulsa Reproducir. Las piezas facilitadas están compuestas con ayuda de la IA. |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | Pieza facilitada, compuesta con ayuda de la IA. |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | Archivo: {nom} (se queda en tu navegador). |
| `etatMicro` | Micro actif. | Micrófono activo. |
| `etatEntree` | Entrée « {nom} » active. | Entrada «{nom}» activa. |
| `etatOnglet` | Audio d'un onglet actif. | Audio de una pestaña activo. |
| `etatEssai` | Musique d'essai. | Música de prueba. |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau. | El micrófono está bloqueado. Autorízalo en los ajustes del sitio (el candado, a la izquierda de la dirección) y vuelve a pulsar Reproducir. También puedes elegir un archivo o una pieza. |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | No hay ningún micrófono disponible en este dispositivo. |
| `erreurMicro` | Le micro ne démarre pas : {message} | El micrófono no se inicia: {message} |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | Aquí no es posible capturar el audio de una pestaña. Requiere un navegador de escritorio reciente (Chrome, Edge); no existe en móvil ni en Safari. |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | La pestaña elegida no ha proporcionado sonido. Vuelve a empezar y marca «Compartir el audio de la pestaña». |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | Este archivo no se puede leer como un sonido. |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | El sonido no puede iniciarse: {message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | Los datos de la página no se cargan: {message} |
| `bandeManque` | la bande {id} manque à la collection de fonds | falta la banda {id} en la colección de fondos |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | La fuente se ha detenido (dispositivo desconectado o permiso retirado). |
| `silence` | Silence : lancez un son. | Silencio: inicia un sonido. |
| `valide` | Validé | Validada |
| `valideTag` | en cours | en curso |
| `essai` | Essai | Prueba |
| `essaiTag` | aperçu | vista previa |
| `validerEssai` | Valider l'essai | Validar la prueba |
| `annuler` | Annuler | Cancelar |
| `pleinEcran` | Plein écran | Pantalla completa |
| `quitterPleinEcran` | Quitter le plein écran | Salir de la pantalla completa |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | Fondo oscuro: validada. Marco dorado: en prueba. Pasa el cursor por una opción para verla en la prueba, haz clic para conservarla y después «Validar la prueba». |
| `fenetreValide` | Fenêtre validée | Ventana validada |
| `fenetreEssai` | Fenêtre d'essai | Ventana de prueba |
| `basculeValide` | Validé | Validada |
| `basculeEssai` | Essai | Prueba |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | La pantalla completa no está disponible en este navegador. |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | Este navegador no ofrece pantalla completa nativa para este elemento: la escena cubre la ventana. Esc o el botón la cierra. |
| `groupes.mode` | Pilotage du son | Control del sonido |
| `groupes.fmt` | Format (ordre) | Formato (orden) |
| `groupes.col` | Collection | Colección |
| `groupes.view` | Vue | Vista |
| `groupes.fond` | Variante de case | Variante de casilla |
| `groupes.pal` | Couleurs | Colores |
| `modes.image.0` | Le son définit l'image | El sonido define la imagen |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | En cada instante, el motivo cuyo espectro más se parece al de la música. |
| `modes.rythme.0` | Le son définit le rythme | El sonido define el ritmo |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | Un paso en la cadena de proximidad en cada ataque de nota. |
| `modes.chemin.0` | Le son guide le chemin | El sonido guía el camino |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | El ritmo decide cuándo, el espectro decide hacia qué vecino. |
| `modes.octaves.0` | Le son suit l'octave | El sonido sigue la octava |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | En cada ataque, un paso por la órbita de la nota dominante: el círculo K, luego su octava 4K, luego 16K…, cuando esos círculos existen. |
| `vues.signes.0` | Signes | Signos |
| `vues.signes.1` | Les zones positives de la figure du motif. | Las zonas positivas de la figura del motivo. |
| `vues.lignes.0` | Lignes nodales | Líneas nodales |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | Las líneas donde la figura del motivo se anula. |
| `vues.pavage.0` | Cellules | Celdas |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | El propio motivo, en pavimentación 2 × 2. |
| `format.titre` | Ordre {n} | Orden {n} |
| `format.detail` | Grille de {g} × {g} cases | Cuadrícula de {g} × {g} casillas |
| `format.bientot` | Ordre {n} (seconde livraison) | Orden {n} (segunda entrega) |
| `chargementOrdre` | Chargement de l'ordre {n}… | Cargando el orden {n}… |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | Los datos del orden {n} no se cargan: {message} |
| `collections.tri.0` | Tricolore — motifs unifiés | Tricolor — motivos unificados |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} motivos (cuadrículas 12 × 12 distintas) |
| `collections.bi.0` | Bicolore — motifs unifiés | Bicolor — motivos unificados |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} motivos (dos espejos, legibles por la regla del 3 de octubre) |
| `collections.ce.0` | Bicolore — symétrie centrale | Bicolor — simetría central |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} motivos (solo simetría central de 180°, legibles por la regla del 3 de octubre) |
| `collections.b1971128.0` | Bloc 1971128 | Bloque 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} motivos |
| `collections.b16012838.0` | Bloc 16012838 | Bloque 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} motivos |
| `collections.b3016090.0` | Bloc 3016090 | Bloque 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} motivos |
| `collections.f613.0` | Famille 613 | Familia 613 |
| `collections.f613.1` | {n} motifs | {n} motivos |
| `collections.f18.0` | Famille 18 | Familia 18 |
| `collections.f18.1` | {n} motifs | {n} motivos |
| `collections.fpilote.0` | Famille pilote | Familia piloto |
| `collections.fpilote.1` | {n} motifs | {n} motivos |
| `collections.p18.0` | Croix 1·2 | Cruz 1·2 |
| `collections.p18.1` | {n} motifs | {n} motivos |
| `collections.p30.0` | Croix 1·2 | Cruz 1·2 |
| `collections.p30.1` | {n} motifs | {n} motivos |
| `fond` | Bandes {id} | Bandas {id} |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec l'état 1 du fond, ou avec l'état 0 : le même fond tourné de 90°. | Una casilla lleva cuatro triángulos; cada uno se dibuja con el estado 1 del fondo o con el estado 0: el mismo fondo girado 90°. |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | La variante de casilla solo se aplica a la colección bicolor. |
| `palettes.creme.0` | Encre et crème | Tinta y crema |
| `palettes.creme.1` | Les couleurs du site. | Los colores del sitio. |
| `palettes.monochrome.0` | Gris et blanc | Gris y blanco |
| `palettes.monochrome.1` | Le monochrome du site. | El monocromo del sitio. |
| `palettes.perso.0` | Mes couleurs | Mis colores |
| `palettes.perso.1` | Choisissez le motif et le fond. | Elige el motivo y el fondo. |
| `palettes.son.0` | La teinte suit le son | El tono sigue al sonido |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | El tono se desliza lentamente con el brillo del sonido (desactivado por defecto). |
| `persoMotif` | Motif | Motivo |
| `persoFond` | Fond | Fondo |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | En tricolor: V el más oscuro (tinta), O gris medio, M el más claro (crema). |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | Ajustes en directo |
| `lissage` | Lissage | Suavizado |
| `pulsationTitre` | Pulsation | Pulsación |
| `pulsations.attaque` | À chaque attaque | En cada ataque |
| `pulsations.temps` | À chaque temps | En cada tiempo |
| `pulsations.quatre` | Toutes les 4 pulsations | Cada 4 pulsaciones |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | Por defecto, un cambio en cada ataque. Cuando se detecta una pulsación regular, puedes cambiar en cada tiempo o cada 4 pulsaciones. |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | Pulsación detectada: {bpm} por minuto. |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | De momento no se detecta ninguna pulsación regular. |
| `calme` | Réduire les changements rapides | Reducir los cambios rápidos |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | Un fundido más largo y una permanencia mayor. Activado de oficio si tu sistema pide menos animaciones. |
| `pente` | Compenser la pente des graves | Compensar la pendiente de los graves |
| `pauseImage` | Pause de l'image | Pausa de la imagen |
| `optionsTitre` | Options | Opciones |
| `comprendreTitre` | Pour comprendre | Para comprender |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | Dos vistas pedagógicas, sin relación con el sonido. |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | El modo (4, 0) y su par degenerado |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | En una placa cuadrada, los modos (4, 0) y (0, 4) tienen la misma frecuencia: toda combinación es también un modo de esa frecuencia. El control deslizante pasa de cos(4πx/a) + cos(4πy/a) (a la derecha) a cos(4πx/a) − cos(4πy/a) (a la izquierda); en el medio solo queda cos(4πx/a), líneas verticales. Zonas claras y oscuras: signos opuestos; trazo: línea nodal. |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | Mezcla s: cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | Figura del modo (4, 0) mezclado con su par degenerado |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | La paridad como superposición de dos redes de ±1 |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | Cada red es un tablero: la paridad (−1)^(i + j) de la casilla (i, j). Su producto vale +1 donde las dos coinciden y −1 donde difieren: es el XNOR de los bits, como dos polarizadores cruzados. Al desplazar o girar un poco una de las dos aparece un muaré. |
| `moireAngle` | Rotation du second réseau (degrés) | Rotación de la segunda red (grados) |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | Periodo de la segunda red (en % del de la primera) |
| `moireA` | Réseau A | Red A |
| `moireB` | Réseau B | Red B |
| `moireProduit` | Produit A × B (XNOR) | Producto A × B (XNOR) |
| `moireAlt` | Produit de deux réseaux de ±1 | Producto de dos redes de ±1 |
| `clesTitre` | Lecture en clés | Lectura en claves |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | Solo visualización: las claves de la nota de los ejes (72 claves sin duplicados, paridad contada desde la casilla de esquina, rango 70) cuya suma devuelve la figura del motivo elegido, cuando existe. La página no afirma ningún vínculo entre una clave y una frecuencia. |
| `clesNatures.D+` | diagonale x + y | diagonal x + y |
| `clesNatures.D-` | diagonale y − x | diagonal y − x |
| `clesNatures.H` | horizontale | horizontal |
| `clesNatures.V` | verticale | vertical |
| `clesFigure.figure` | Figure du motif | Figura del motivo |
| `clesFigure.V` | Classe V (violet) | Clase V (violeta) |
| `clesFigure.O` | Classe O (orange) | Clase O (naranja) |
| `clesFigure.M` | Classe M (magenta) | Clase M (magenta) |
| `clesActives` | {n} clés actives : {liste} | {n} claves activas: {liste} |
| `clesAucune` | aucune clé (figure vide) | ninguna clave (figura vacía) |
| `clesComplement` |  (au complément près) |  (salvo el complemento) |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | Esta figura no es una suma de claves: queda fuera del espacio que engendran. |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | Motivo {i} de {n}, colección {collection}. |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | La lectura en claves solo se aplica al orden 12. |
| `loiTitre` | Loi de fréquence des cercles | Ley de frecuencia de los círculos |
| `loiChoix.racine` | Échelle compressée pour l'oreille | Escala comprimida para el oído |
| `loiChoix.plaque` | Loi de la plaque réelle | Ley de la placa real |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | Escala comprimida: f = frecuencia de referencia × √K / 2 (ajuste inicial). Ley de la placa: f = c × K, como una placa real (aluminio de 3 mm, 48 cm: c = 31,85 Hz). En el orden 12, de 32 a 2 293 Hz; los círculos por encima de 0,9 × la frecuencia de Nyquist se ignoran, como antes. El detector de ataques y el seguimiento del tono no cambian. |
| `loiC` | c (Hz par unité de m² + n²) | c (Hz por unidad de m² + n²) |
| `figureTitre` | Figure (vues Signes et Lignes) | Figura (vistas Signos y Líneas) |
| `figureChoix.motif` | Du motif retenu | Del motivo elegido |
| `figureChoix.son` | Du son | Del sonido |
| `figureChoix.ecart` | Les deux (écart) | Las dos (diferencia) |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | Del motivo elegido: la figura de Chladni del motivo elegido (ajuste inicial). Del sonido: la suma de las ondas de cada círculo, ponderadas por la energía que el sonido pone en él, sin pasar por un motivo. Las dos: los lugares donde estas dos figuras difieren. El sonido no entrega las fases: se ponen a cero. |
| `sceneTitre` | La scène | La escena |
| `projection` | Ouvrir une fenêtre de projection | Abrir una ventana de proyección |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | La pantalla completa lanza siempre la ventana validada, nunca la de prueba; los controles y el cursor se ocultan a los 3 segundos. Esc para volver. La ventana de proyección es independiente: arrástrala a una segunda pantalla o a un proyector. |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | El navegador ha bloqueado la ventana de proyección. Permite las ventanas emergentes para este sitio y vuelve a intentarlo. |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | La pantalla se mantiene encendida durante la reproducción cuando el navegador lo permite. |
| `enregTitre` | Enregistrer | Grabar |
| `enreg` | Enregistrer 15 s | Grabar 15 s |
| `enregEnCours` | Enregistrement : {s} s | Grabando: {s} s |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16 (Reels, Shorts, TikTok) |
| `format45` | 4:5 (publication) | 4:5 (publicación) |
| `format11` | 1:1 (carré) | 1:1 (cuadrado) |
| `formatVideo` | Format de la vidéo | Formato del vídeo |
| `signature` | Bandeau « {texte} » en bas de la vidéo | Banda «{texte}» al pie del vídeo |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | Vídeo grabado: la descarga ha comenzado. |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | Tu navegador no escribe MP4: el vídeo está en formato WebM. Para convertirlo a MP4 (Instagram, TikTok), pásalo por un conversor o por ffmpeg: ffmpeg -i archivo.webm archivo.mp4. |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | Audio AAC en el MP4: se reproduce en todas partes (iPhone, QuickTime, aplicaciones de publicación). |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | Este navegador escribe el audio del MP4 en Opus: puede no reproducirse en iPhone, QuickTime o algunas aplicaciones de publicación (Chrome de escritorio reciente: AAC). |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | Audio Opus: puede no reproducirse en iPhone, QuickTime o algunas aplicaciones de publicación. Para una pista AAC: ffmpeg -i archivo.mp4 -c:v copy -c:a aac salida.mp4. |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | La grabación de vídeo no está disponible en este navegador. |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | Inicia primero un sonido: no se graba el silencio. |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | La grabación no se inicia: {message} |
| `raccourcisTitre` | Raccourcis clavier | Atajos de teclado |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | Vista de la prueba: signos, líneas nodales, celdas |
| `raccourcis.1.0` | Espace | Espacio |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | Siguiente modo de control (prueba) |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | Pausa de la imagen |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | Validar la prueba |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | Pantalla completa (ventana validada) |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | Grabar 15 s |
| `infoMotif` | Motif {i} sur {n} | Motivo {i} de {n} |
| `infoImages` | {fps} images/s | {fps} imágenes/s |
| `infoResolution` | résolution réduite | resolución reducida |
| `semaineTitre` | La semaine | La semana |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | Música compuesta con IA por MC Claude. |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | Un clic en un cartel carga el reproductor de YouTube o de TikTok: un servicio de terceros, que recibe entonces tu visita. No se carga nada antes. |
| `jourTitre` | Jour {n} — {tonalite} | Día {n} — {tonalite} |
| `datePub` | Publié le {date} | Publicado el {date} |
| `bientot` | Bientôt | Próximamente |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | Reproducir el vídeo del día {n}, {tonalite} |
| `lireTiktok` | Lire ici (TikTok) | Reproducir aquí (TikTok) |
| `voirYoutube` | Voir sur YouTube | Ver en YouTube |
| `voirTiktok` | Voir sur TikTok | Ver en TikTok |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | Cartel del día {n} — {tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | Vídeo del día {n} |
| `voirAussiTitre` | Voir aussi | Ver también |
| `voirAussi.0.href` | /galerie-bicolore.html | /es/galeria-bicolor/ |
| `voirAussi.0.titre` | Galerie bicolore | Galería bicolor |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | Los motivos bicolores engendrados por los ejes, cerrados sobre el cubo: grano, pavimentación, exportación. |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /es/galeria-tricolor/ |
| `voirAussi.1.titre` | Galerie tricolore | Galería tricolor |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | Los motivos unificados, engendrados por mezcla de tonos: selecciona un motivo para ver su pavimentación. |
| `voirAussi.2.href` | /fonds-ecran.html | /es/fondos-de-pantalla/ |
| `voirAussi.2.titre` | Fonds d'écran | Fondos de pantalla |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | Fondos textiles a pantalla completa, reactivos al sonido o en modo meditativo. |
| `voirAussi.3.href` | /galerie-animations.html | /es/animaciones/ |
| `voirAussi.3.titre` | Galerie d'animations | Galería de animaciones |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | Las animaciones de las colecciones de fondos, para ver y descargar en MP4. |
| `voirAussi.4.href` | /chladni.html | /es/chladni/ |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | Figuras, escalas y frecuencias: la página que une el vocabulario de los motivos con los modos de una placa. |
| `voirAussi.5.href` | /fr/livre/ | /es/libro/ |
| `voirAussi.5.titre` | Le livre | El libro |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès en línea, página por página, con el PDF gratuito. |

### Voir sa musique — métadonnées de la page

| Clé | Français | Español |
|---|---|---|
| `titre, h1` | Voir sa musique — La Livrée d'Hermès | Ver tu música — La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Ver tu música: la figura de Chladni que dibuja el sonido y el motivo de La Livrée d'Hermès que más se le parece. Graba 15 segundos con el sonido. |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | Ver tu música: la figura de Chladni que dibuja el sonido y el motivo de La Livrée d'Hermès que más se le parece. |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | Español |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | Las tres páginas sonoras |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | Cimática · El sonido crea la forma |
| `trois-portes.musique` | Voir sa musique · Le son guide | Ver tu música · El sonido guía |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | Fondo de pantalla · El sonido se desvanece |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | Español |
|---|---|---|
| `label` | Voir sa musique | Ver tu música |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | Elige una pieza, un archivo o el micrófono: la página busca el motivo de La Livrée d’Hermès cuyo espectro más se parece al del sonido. |

### Page « Outils » (`data/outils-langues/outils-support.json`)

| Clé | Français | Español |
|---|---|---|
| `titre` | Outils | Herramientas |
| `description` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | Las herramientas interactivas de La Livrée d'Hermès: componer, visualizar, imprimir, cifrar. |
| `intro` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | Las herramientas interactivas de La Livrée d'Hermès: componer, visualizar, imprimir, cifrar. Las páginas marcadas «(página en francés)» aún no están traducidas. |
| `note « page en français »` | — | (página en francés) |
| `Accueil (fil d'Ariane)` | Accueil | Inicio |

### Page « Soutenir »

| Clé | Français | Español |
|---|---|---|
| `titre` | Soutenir | Apoyar |
| `description` | Soutenir La Livrée d'Hermès à prix libre : le site et tout son contenu restent entièrement gratuits. | Apoya La Livrée d'Hermès a precio libre: el sitio y todo su contenido siguen siendo totalmente gratuitos. |
| `intro` | Tout est libre. Le traité, les motifs et les fichiers produits par les outils se téléchargent sans condition, sous licence CC BY-NC 4.0. Votre soutien, à prix libre, finance la suite du projet : de nouveaux motifs, de nouveaux outils, le volet textile. | Todo es libre. El tratado, los motivos y los archivos producidos por las herramientas se descargan sin condición, bajo licencia CC BY-NC 4.0. Tu apoyo, a precio libre, financia lo que viene: nuevos motivos, nuevas herramientas, el apartado textil. |
| `bouton` | Aller à la page française pour payer | Ir a la página en francés para pagar |
| `note` | Le paiement est sécurisé par Stripe. Montant libre, don facultatif. | El pago está protegido por Stripe. Importe libre, donación voluntaria. La página de pago está en francés. |
| `h2` | Ce que finance votre soutien | Qué financia tu apoyo |
| `b` | Le temps de recherche, de développement et de traduction | El tiempo de investigación, desarrollo y traducción |
| `p` | La construction des motifs, des outils du site et leur documentation en quatre langues. | La construcción de los motivos, de las herramientas del sitio y su documentación en cuatro idiomas. |
