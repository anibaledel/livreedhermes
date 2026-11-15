# Relecture — « Voir sa musique » en Deutsch

Généré par `node scripts/build-musique-textes.mjs` depuis `data/musique-chladni/traductions/<langue>.json` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. À relire par un locuteur natif.

Page concernée : « Voir sa musique » (`musique-chladni.html` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir `TODO-RELECTURE.md`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.

## Deutsch (`de`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | Deutsch |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | Die eigene Musik sehen — La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Die eigene Musik sehen: Wählen Sie ein Stück, eine Datei oder das Mikrofon und sehen Sie die Chladni-Figur, die der Klang zeichnet, und danach das Muster von La Livrée d'Hermès, das ihm am meisten ähnelt. Nehmen Sie 15 Sekunden mit dem Klang auf. |
| `ariane` | Voir sa musique | Die eigene Musik sehen |
| `h1` | Voir sa musique | Die eigene Musik sehen |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | Jede Musik hat eine Signatur: die Art, wie sich ihre Energie auf die Frequenzen verteilt. Wählen Sie ein Stück, eine Datei oder das Mikrofon: Die Seite misst diese Energie bei den Frequenzen jedes Modenkreises einer quadratischen Platte und sucht dann unter den vereinheitlichten Mustern von La Livrée d'Hermès dasjenige, dessen Spektrum ihr am meisten ähnelt. Die Wahl beruht auf der Ähnlichkeit zweier Spektren, nicht auf einem musikalischen Gesetz: Ein Muster „drückt“ kein Stück „aus“. |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | Nichts verlässt Ihren Browser: Die Datei, das Mikrofon und das aufgenommene Audio werden vor Ort analysiert und nirgendwohin gesendet. |
| `flash` | Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit. | Achtung: Die Bilder können schnell wechseln und flackern. Die Einstellung „Schnelle Wechsel reduzieren“ verlangsamt sie. |
| `sonTitre` | Le son | Der Klang |
| `sonChoix` | Son | Klang |
| `morceau` | Morceau fourni {n} — {note} | Mitgeliefertes Stück {n} — {note} |
| `notes.j1` | do dièse | Cis |
| `notes.j2` | la | A |
| `notes.j3` | ré | D |
| `notes.j4` | mi | E |
| `notes.j5` | sol | G |
| `notes.j6` | si | H |
| `notes.j7` | do | C |
| `tonalites.do dièse mineur` | do dièse mineur | cis-Moll |
| `tonalites.la mineur` | la mineur | a-Moll |
| `tonalites.ré mineur` | ré mineur | d-Moll |
| `tonalites.mi mineur` | mi mineur | e-Moll |
| `tonalites.sol mineur` | sol mineur | g-Moll |
| `tonalites.si mineur` | si mineur | h-Moll |
| `tonalites.do mineur` | do mineur | c-Moll |
| `sourceFichier` | Mon fichier audio… | Meine Audiodatei… |
| `sourceMicro` | Microphone | Mikrofon |
| `sourceEssai` | Musique d'essai | Testmusik |
| `sourceOnglet` | Audio d'un onglet | Audio eines Tabs |
| `lecture` | Lecture | Abspielen |
| `pause` | Pause | Pause |
| `arreter` | Arrêter | Stopp |
| `entree` | Entrée audio | Audioeingang |
| `entreeDefaut` | Entrée par défaut | Standardeingang |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | Mischpult, Soundkarte: Schließen Sie sie an, erlauben Sie das Mikrofon und wählen Sie sie hier aus. |
| `sensibilite` | Seuil des attaques | Schwelle der Anschläge |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | In Standardabweichungen über dem Mittelwert: je niedriger, desto empfindlicher gegenüber Notenwechseln. |
| `intervalle` | Intervalle minimal entre deux attaques (s) | Mindestabstand zwischen zwei Anschlägen (s) |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | Standard 0,45 s: höchstens etwa 133 Anschläge pro Minute. Senken Sie den Wert für ein schnelles Tempo. |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | Die mitgelieferten Stücke sind mit Hilfe von KI komponiert („Musik, komponiert mit KI von MC Claude.“). |
| `etatDepart` | Appuyez sur Lecture. Les morceaux fournis sont composés avec l'aide de l'IA. | Drücken Sie auf Abspielen. Die mitgelieferten Stücke sind mit Hilfe von KI komponiert. |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | Mitgeliefertes Stück, mit Hilfe von KI komponiert. |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | Datei: {nom} (sie bleibt in Ihrem Browser). |
| `etatMicro` | Micro actif. | Mikrofon aktiv. |
| `etatEntree` | Entrée « {nom} » active. | Eingang „{nom}“ aktiv. |
| `etatOnglet` | Audio d'un onglet actif. | Tab-Audio aktiv. |
| `etatEssai` | Musique d'essai. | Testmusik. |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau. | Das Mikrofon wurde verweigert. Erlauben Sie es in den Einstellungen der Website (das Schloss links neben der Adresse) und klicken Sie erneut auf Abspielen. Sie können auch eine Datei oder ein Stück wählen. |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | Auf diesem Gerät ist kein Mikrofon verfügbar. |
| `erreurMicro` | Le micro ne démarre pas : {message} | Das Mikrofon startet nicht: {message} |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | Die Aufnahme des Audios eines Tabs ist hier nicht möglich. Sie erfordert einen aktuellen Desktop-Browser (Chrome, Edge); auf Mobilgeräten und in Safari fehlt sie. |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | Der gewählte Tab hat keinen Ton geliefert. Starten Sie neu und aktivieren Sie „Audio des Tabs teilen“. |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | Diese Datei kann nicht als Klang gelesen werden. |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | Der Klang kann nicht starten: {message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | Die Daten der Seite werden nicht geladen: {message} |
| `bandeManque` | la bande {id} manque à la collection de fonds | Das Band {id} fehlt in der Sammlung der Hintergründe |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | Die Quelle wurde angehalten (Gerät getrennt oder Berechtigung entzogen). |
| `silence` | Silence : lancez un son. | Stille: Starten Sie einen Klang. |
| `valide` | Validé | Bestätigt |
| `valideTag` | en cours | aktuell |
| `essai` | Essai | Versuch |
| `essaiTag` | aperçu | Vorschau |
| `validerEssai` | Valider l'essai | Versuch bestätigen |
| `annuler` | Annuler | Abbrechen |
| `pleinEcran` | Plein écran | Vollbild |
| `quitterPleinEcran` | Quitter le plein écran | Vollbild beenden |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | Dunkler Grund: bestätigt. Goldener Rahmen: im Versuch. Fahren Sie über eine Option, um sie im Versuch zu sehen, klicken Sie, um sie zu behalten, dann „Versuch bestätigen“. |
| `fenetreValide` | Fenêtre validée | Bestätigtes Fenster |
| `fenetreEssai` | Fenêtre d'essai | Versuchsfenster |
| `basculeValide` | Validé | Bestätigt |
| `basculeEssai` | Essai | Versuch |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | Der Vollbildmodus ist in diesem Browser nicht verfügbar. |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | Dieser Browser bietet für dieses Element keinen nativen Vollbildmodus: Die Bühne bedeckt das Fenster. Esc oder die Schaltfläche schließt sie. |
| `groupes.mode` | Pilotage du son | Klangsteuerung |
| `groupes.fmt` | Format (ordre) | Format (Ordnung) |
| `groupes.col` | Collection | Sammlung |
| `groupes.view` | Vue | Ansicht |
| `groupes.fond` | Variante de case | Feldvariante |
| `groupes.pal` | Couleurs | Farben |
| `modes.image.0` | Le son définit l'image | Der Klang bestimmt das Bild |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | In jedem Augenblick das Muster, dessen Spektrum dem der Musik am meisten ähnelt. |
| `modes.rythme.0` | Le son définit le rythme | Der Klang bestimmt den Rhythmus |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | Ein Schritt in der Nachbarschaftskette bei jedem Notenanschlag. |
| `modes.chemin.0` | Le son guide le chemin | Der Klang lenkt den Weg |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | Der Rhythmus entscheidet, wann; das Spektrum entscheidet, zu welchem Nachbarn. |
| `modes.octaves.0` | Le son suit l'octave | Der Klang folgt der Oktave |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | Bei jedem Anschlag ein Schritt auf der Bahn der vorherrschenden Note: der Kreis K, dann seine Oktave 4K, dann 16K …, sofern diese Kreise existieren. |
| `vues.signes.0` | Signes | Vorzeichen |
| `vues.signes.1` | Les zones positives de la figure du motif. | Die positiven Zonen der Figur des Musters. |
| `vues.lignes.0` | Lignes nodales | Knotenlinien |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | Die Linien, auf denen die Figur des Musters verschwindet. |
| `vues.pavage.0` | Cellules | Zellen |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | Das Muster selbst, in 2 × 2-Parkettierung. |
| `format.titre` | Ordre {n} | Ordnung {n} |
| `format.detail` | Grille de {g} × {g} cases | Gitter aus {g} × {g} Feldern |
| `format.bientot` | Ordre {n} (seconde livraison) | Ordnung {n} (zweite Lieferung) |
| `chargementOrdre` | Chargement de l'ordre {n}… | Ordnung {n} wird geladen … |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | Die Daten der Ordnung {n} werden nicht geladen: {message} |
| `collections.tri.0` | Tricolore — motifs unifiés | Dreifarbig — vereinheitlichte Muster |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} Muster (verschiedene 12 × 12-Gitter) |
| `collections.bi.0` | Bicolore — motifs unifiés | Zweifarbig — vereinheitlichte Muster |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} Muster (zwei Spiegel, lesbar nach der Regel vom 3. Oktober) |
| `collections.ce.0` | Bicolore — symétrie centrale | Zweifarbig — Zentralsymmetrie |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} Muster (nur 180°-Zentralsymmetrie, lesbar nach der Regel vom 3. Oktober) |
| `collections.b1971128.0` | Bloc 1971128 | Block 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} Muster |
| `collections.b16012838.0` | Bloc 16012838 | Block 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} Muster |
| `collections.b3016090.0` | Bloc 3016090 | Block 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} Muster |
| `collections.f613.0` | Famille 613 | Familie 613 |
| `collections.f613.1` | {n} motifs | {n} Muster |
| `collections.f18.0` | Famille 18 | Familie 18 |
| `collections.f18.1` | {n} motifs | {n} Muster |
| `collections.fpilote.0` | Famille pilote | Pilotfamilie |
| `collections.fpilote.1` | {n} motifs | {n} Muster |
| `collections.p18.0` | Croix 1·2 | Kreuz 1·2 |
| `collections.p18.1` | {n} motifs | {n} Muster |
| `collections.p30.0` | Croix 1·2 | Kreuz 1·2 |
| `collections.p30.1` | {n} motifs | {n} Muster |
| `fond` | Bandes {id} | Bänder {id} |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec l'état 1 du fond, ou avec l'état 0 : le même fond tourné de 90°. | Ein Feld trägt vier Dreiecke; jedes wird mit dem Zustand 1 des Grundes gezeichnet oder mit dem Zustand 0: demselben Grund, um 90° gedreht. |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | Die Feldvariante gilt nur für die zweifarbige Sammlung. |
| `palettes.creme.0` | Encre et crème | Tinte und Creme |
| `palettes.creme.1` | Les couleurs du site. | Die Farben der Website. |
| `palettes.monochrome.0` | Gris et blanc | Grau und Weiß |
| `palettes.monochrome.1` | Le monochrome du site. | Das Monochrom der Website. |
| `palettes.perso.0` | Mes couleurs | Meine Farben |
| `palettes.perso.1` | Choisissez le motif et le fond. | Wählen Sie das Muster und den Grund. |
| `palettes.son.0` | La teinte suit le son | Der Farbton folgt dem Klang |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | Der Farbton gleitet langsam mit der Helligkeit des Klangs (standardmäßig aus). |
| `persoMotif` | Motif | Muster |
| `persoFond` | Fond | Grund |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | Dreifarbig: V am dunkelsten (Tinte), O mittleres Grau, M am hellsten (Creme). |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | Einstellungen im laufenden Betrieb |
| `lissage` | Lissage | Glättung |
| `pulsationTitre` | Pulsation | Puls |
| `pulsations.attaque` | À chaque attaque | Bei jedem Anschlag |
| `pulsations.temps` | À chaque temps | Bei jedem Schlag |
| `pulsations.quatre` | Toutes les 4 pulsations | Alle 4 Schläge |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | Standardmäßig ein Wechsel bei jedem Anschlag. Wird ein regelmäßiger Puls erkannt, können Sie bei jedem Schlag oder alle 4 Schläge wechseln. |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | Puls erkannt: {bpm} pro Minute. |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | Bisher wurde kein regelmäßiger Puls erkannt. |
| `calme` | Réduire les changements rapides | Schnelle Wechsel reduzieren |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | Eine längere Überblendung und eine längere Haltedauer. Automatisch aktiviert, wenn Ihr System weniger Animation verlangt. |
| `pente` | Compenser la pente des graves | Abfall der Bässe ausgleichen |
| `pauseImage` | Pause de l'image | Bild anhalten |
| `optionsTitre` | Options | Optionen |
| `comprendreTitre` | Pour comprendre | Zum Verständnis |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | Zwei Lehransichten, ohne Bezug zum Klang. |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | Die Mode (4, 0) und ihr entartetes Paar |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | Auf einer quadratischen Platte haben die Moden (4, 0) und (0, 4) dieselbe Frequenz: Jede Kombination ist ebenfalls eine Mode dieser Frequenz. Der Regler geht von cos(4πx/a) + cos(4πy/a) (rechts) zu cos(4πx/a) − cos(4πy/a) (links); in der Mitte bleibt nur cos(4πx/a), senkrechte Linien. Helle und dunkle Zonen: entgegengesetzte Vorzeichen; Strich: Knotenlinie. |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | Mischung s: cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | Figur der Mode (4, 0), gemischt mit ihrem entarteten Paar |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | Die Parität als Überlagerung zweier ±1-Gitter |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | Jedes Gitter ist ein Schachbrett: die Parität (−1)^(i + j) des Feldes (i, j). Ihr Produkt ist +1, wo beide übereinstimmen, und −1, wo sie sich unterscheiden: Es ist das XNOR der Bits, wie zwei gekreuzte Polarisatoren. Verschiebt oder dreht man eines der beiden ein wenig, entsteht ein Moiré. |
| `moireAngle` | Rotation du second réseau (degrés) | Drehung des zweiten Gitters (Grad) |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | Periode des zweiten Gitters (in % der ersten) |
| `moireA` | Réseau A | Gitter A |
| `moireB` | Réseau B | Gitter B |
| `moireProduit` | Produit A × B (XNOR) | Produkt A × B (XNOR) |
| `moireAlt` | Produit de deux réseaux de ±1 | Produkt zweier ±1-Gitter |
| `clesTitre` | Lecture en clés | Lesung in Schlüsseln |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | Nur Anzeige: die Schlüssel der Achsennotation (72 Schlüssel ohne Duplikate, Parität ab dem Eckfeld gezählt, Rang 70), deren Summe die Figur des gewählten Musters ergibt, wenn sie existiert. Die Seite behauptet keinerlei Verbindung zwischen einem Schlüssel und einer Frequenz. |
| `clesNatures.D+` | diagonale x + y | Diagonale x + y |
| `clesNatures.D-` | diagonale y − x | Diagonale y − x |
| `clesNatures.H` | horizontale | waagerecht |
| `clesNatures.V` | verticale | senkrecht |
| `clesFigure.figure` | Figure du motif | Figur des Musters |
| `clesFigure.V` | Classe V (violet) | Klasse V (violett) |
| `clesFigure.O` | Classe O (orange) | Klasse O (orange) |
| `clesFigure.M` | Classe M (magenta) | Klasse M (magenta) |
| `clesActives` | {n} clés actives : {liste} | {n} aktive Schlüssel: {liste} |
| `clesAucune` | aucune clé (figure vide) | kein Schlüssel (leere Figur) |
| `clesComplement` |  (au complément près) |  (bis auf das Komplement) |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | Diese Figur ist keine Summe von Schlüsseln: Sie liegt außerhalb des von ihnen erzeugten Raums. |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | Muster {i} von {n}, Sammlung {collection}. |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | Die Lesung in Schlüsseln gilt nur für die Ordnung 12. |
| `loiTitre` | Loi de fréquence des cercles | Frequenzgesetz der Kreise |
| `loiChoix.racine` | Échelle compressée pour l'oreille | Für das Ohr gestauchte Skala |
| `loiChoix.plaque` | Loi de la plaque réelle | Gesetz der realen Platte |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | Gestauchte Skala: f = Bezugsfrequenz × √K / 2 (Ausgangseinstellung). Plattengesetz: f = c × K, wie bei einer realen Platte (Aluminium, 3 mm, 48 cm: c = 31,85 Hz). Bei Ordnung 12 von 32 bis 2 293 Hz; Kreise oberhalb von 0,9 × der Nyquist-Frequenz werden wie bisher ignoriert. Der Anschlagdetektor und die Farbtonverfolgung ändern sich nicht. |
| `loiC` | c (Hz par unité de m² + n²) | c (Hz pro Einheit m² + n²) |
| `figureTitre` | Figure (vues Signes et Lignes) | Figur (Ansichten Vorzeichen und Linien) |
| `figureChoix.motif` | Du motif retenu | Des gewählten Musters |
| `figureChoix.son` | Du son | Des Klangs |
| `figureChoix.ecart` | Les deux (écart) | Beide (Differenz) |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | Des gewählten Musters: die Chladni-Figur des gewählten Musters (Ausgangseinstellung). Des Klangs: die Summe der Wellen jedes Kreises, gewichtet mit der Energie, die der Klang dort einbringt, ohne den Umweg über ein Muster. Beide: die Stellen, an denen sich diese beiden Figuren unterscheiden. Der Klang liefert keine Phasen: Sie werden auf null gesetzt. |
| `sceneTitre` | La scène | Die Bühne |
| `projection` | Ouvrir une fenêtre de projection | Ein Projektionsfenster öffnen |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | Das Vollbild startet immer das bestätigte Fenster, nie den Versuch; die Bedienelemente und der Cursor verschwinden nach 3 Sekunden. Esc zum Zurückkehren. Das Projektionsfenster ist getrennt: Ziehen Sie es auf einen zweiten Bildschirm oder einen Projektor. |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | Das Projektionsfenster wurde vom Browser blockiert. Erlauben Sie Pop-ups für diese Website und versuchen Sie es erneut. |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | Der Bildschirm bleibt während der Wiedergabe an, wenn der Browser es erlaubt. |
| `enregTitre` | Enregistrer | Aufnehmen |
| `enreg` | Enregistrer 15 s | 15 s aufnehmen |
| `enregEnCours` | Enregistrement : {s} s | Aufnahme: {s} s |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16 (Reels, Shorts, TikTok) |
| `format45` | 4:5 (publication) | 4:5 (Beitrag) |
| `format11` | 1:1 (carré) | 1:1 (quadratisch) |
| `formatVideo` | Format de la vidéo | Videoformat |
| `signature` | Bandeau « {texte} » en bas de la vidéo | Banner „{texte}“ am unteren Rand des Videos |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | Video aufgenommen: Der Download hat begonnen. |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | Ihr Browser schreibt kein MP4: Das Video liegt im WebM-Format vor. Um es in MP4 umzuwandeln (Instagram, TikTok), nutzen Sie einen Konverter oder ffmpeg: ffmpeg -i datei.webm datei.mp4. |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | AAC-Audio im MP4: läuft überall (iPhone, QuickTime, Veröffentlichungs-Apps). |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | Dieser Browser schreibt das Audio des MP4 als Opus: Es lässt sich auf iPhone, in QuickTime oder in manchen Veröffentlichungs-Apps eventuell nicht abspielen (aktuelles Desktop-Chrome: AAC). |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | Opus-Audio: lässt sich auf iPhone, in QuickTime oder in manchen Veröffentlichungs-Apps eventuell nicht abspielen. Für eine AAC-Spur: ffmpeg -i datei.mp4 -c:v copy -c:a aac ausgabe.mp4. |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | Die Videoaufnahme ist in diesem Browser nicht verfügbar. |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | Starten Sie zuerst einen Klang: Stille wird nicht aufgenommen. |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | Die Aufnahme startet nicht: {message} |
| `raccourcisTitre` | Raccourcis clavier | Tastenkürzel |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | Ansicht des Versuchs: Vorzeichen, Knotenlinien, Zellen |
| `raccourcis.1.0` | Espace | Leertaste |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | Nächster Steuerungsmodus (Versuch) |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | Bild anhalten |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | Versuch bestätigen |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | Vollbild (bestätigtes Fenster) |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | 15 s aufnehmen |
| `infoMotif` | Motif {i} sur {n} | Muster {i} von {n} |
| `infoImages` | {fps} images/s | {fps} Bilder/s |
| `infoResolution` | résolution réduite | reduzierte Auflösung |
| `semaineTitre` | La semaine | Die Woche |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | Musik, komponiert mit KI von MC Claude. |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | Ein Klick auf ein Plakat lädt den Player von YouTube oder TikTok: einen Drittanbieterdienst, der dann Ihren Besuch erhält. Vorher wird nichts geladen. |
| `jourTitre` | Jour {n} — {tonalite} | Tag {n} — {tonalite} |
| `datePub` | Publié le {date} | Veröffentlicht am {date} |
| `bientot` | Bientôt | Bald |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | Das Video von Tag {n} abspielen, {tonalite} |
| `lireTiktok` | Lire ici (TikTok) | Hier abspielen (TikTok) |
| `voirYoutube` | Voir sur YouTube | Auf YouTube ansehen |
| `voirTiktok` | Voir sur TikTok | Auf TikTok ansehen |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | Plakat von Tag {n} — {tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | Video von Tag {n} |
| `voirAussiTitre` | Voir aussi | Siehe auch |
| `voirAussi.0.href` | /galerie-bicolore.html | /galerie-bicolore.html |
| `voirAussi.0.titre` | Galerie bicolore | Zweifarbige Galerie |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | Die von den Achsen erzeugten zweifarbigen Muster, auf dem Würfel geschlossen: Körnung, Parkettierung, Export. (Seite auf Französisch.) |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /galerie-patterns-unifies.html |
| `voirAussi.1.titre` | Galerie tricolore | Dreifarbige Galerie |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | Die vereinheitlichten Muster, durch Mischen von Tönen erzeugt: Wählen Sie ein Muster, um seine Parkettierung zu sehen. (Seite auf Französisch.) |
| `voirAussi.2.href` | /fonds-ecran.html | /fonds-ecran.html |
| `voirAussi.2.titre` | Fonds d'écran | Hintergrundbilder |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | Textile Vollbild-Hintergründe, klangreaktiv oder im meditativen Modus. (Seite auf Französisch.) |
| `voirAussi.3.href` | /galerie-animations.html | /de/animations/ |
| `voirAussi.3.titre` | Galerie d'animations | Animationsgalerie |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | Die Animationen der Hintergrundsammlungen, zum Ansehen und zum Herunterladen als MP4. |
| `voirAussi.4.href` | /chladni.html | /chladni.html |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | Figuren, Tonleitern und Frequenzen: die Seite, die das Vokabular der Muster mit den Moden einer Platte verbindet. (Seite auf Französisch.) |
| `voirAussi.5.href` | /fr/livre/ | /de/book/ |
| `voirAussi.5.titre` | Le livre | Das Buch |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès online, Seite für Seite, mit dem kostenlosen PDF. |

### Voir sa musique — métadonnées de la page

| Clé | Français | Deutsch |
|---|---|---|
| `titre, h1` | Voir sa musique — La Livrée d'Hermès | Die eigene Musik sehen — La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Die eigene Musik sehen: die Chladni-Figur, die der Klang zeichnet, und das Muster von La Livrée d'Hermès, das ihm am meisten ähnelt. Nehmen Sie 15 Sekunden mit dem Klang auf. |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | Die eigene Musik sehen: die Chladni-Figur, die der Klang zeichnet, und das Muster von La Livrée d'Hermès, das ihm am meisten ähnelt. |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | Deutsch |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | Die drei Klangseiten |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | Kymatik · Der Klang schafft die Form |
| `trois-portes.musique` | Voir sa musique · Le son guide | Die eigene Musik sehen · Der Klang lenkt |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | Hintergrundbild · Der Klang tritt zurück |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | Deutsch |
|---|---|---|
| `label` | Voir sa musique | Die eigene Musik sehen |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | Wählen Sie ein Stück, eine Datei oder das Mikrofon: Die Seite sucht das Muster von La Livrée d’Hermès, dessen Spektrum dem des Klangs am nächsten kommt. |

### Page « Outils » (`data/outils-langues/outils-support.json`)

| Clé | Français | Deutsch |
|---|---|---|
| `titre` | Outils | Werkzeuge |
| `description` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | Die interaktiven Werkzeuge von La Livrée d'Hermès — komponieren, visualisieren, drucken, verschlüsseln. |
| `intro` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | Die interaktiven Werkzeuge von La Livrée d'Hermès — komponieren, visualisieren, drucken, verschlüsseln. Seiten mit dem Zusatz „(Seite auf Französisch)“ sind noch nicht übersetzt. |
| `note « page en français »` | — | (Seite auf Französisch) |
| `Accueil (fil d'Ariane)` | Accueil | Startseite |

### Page « Soutenir »

| Clé | Français | Deutsch |
|---|---|---|
| `titre` | Soutenir | Unterstützen |
| `description` | Soutenir La Livrée d'Hermès à prix libre : le site et tout son contenu restent entièrement gratuits. | Unterstützen Sie La Livrée d'Hermès zu einem Preis Ihrer Wahl: Die Website und alle ihre Inhalte bleiben vollständig frei. |
| `intro` | Tout est libre. Le traité, les motifs et les fichiers produits par les outils se téléchargent sans condition, sous licence CC BY-NC 4.0. Votre soutien, à prix libre, finance la suite du projet : de nouveaux motifs, de nouveaux outils, le volet textile. | Alles ist frei. Die Abhandlung, die Muster und die von den Werkzeugen erzeugten Dateien lassen sich ohne Bedingung herunterladen, unter der Lizenz CC BY-NC 4.0. Ihre Unterstützung, zu einem Preis Ihrer Wahl, finanziert das, was folgt: neue Muster, neue Werkzeuge, den Textilbereich. |
| `bouton` | Aller à la page française pour payer | Zur französischen Seite zum Bezahlen |
| `note` | Le paiement est sécurisé par Stripe. Montant libre, don facultatif. | Die Zahlung wird von Stripe abgesichert. Frei wählbarer Betrag, freiwillige Spende. Die Zahlungsseite ist auf Französisch. |
| `h2` | Ce que finance votre soutien | Was Ihre Unterstützung finanziert |
| `b` | Le temps de recherche, de développement et de traduction | Zeit für Forschung, Entwicklung und Übersetzung |
| `p` | La construction des motifs, des outils du site et leur documentation en quatre langues. | Die Konstruktion der Muster, der Werkzeuge der Website und ihre Dokumentation in mehreren Sprachen. |
