# Relecture — « Voir sa musique » en हिन्दी

Généré par `node scripts/build-musique-textes.mjs` depuis `data/musique-chladni/traductions/<langue>.json` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. À relire par un locuteur natif.

Page concernée : « Voir sa musique » (`musique-chladni.html` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir `TODO-RELECTURE.md`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.

## हिन्दी (`hi`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | हिन्दी |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | अपने संगीत को देखें — La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | अपने संगीत को देखें: कोई रचना, फ़ाइल या माइक्रोफ़ोन चुनें और देखें कि ध्वनि कौन-सी Chladni आकृति बनाती है, फिर La Livrée d'Hermès का वह पैटर्न जो उससे सबसे अधिक मिलता है। ध्वनि के साथ 15 सेकंड रिकॉर्ड करें। |
| `ariane` | Voir sa musique | अपने संगीत को देखें |
| `h1` | Voir sa musique | अपने संगीत को देखें |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | हर संगीत का एक हस्ताक्षर होता है: उसकी ऊर्जा आवृत्तियों में किस तरह बँटी है। कोई रचना, फ़ाइल या माइक्रोफ़ोन चुनें: पृष्ठ वर्गाकार पट्टिका के मोड-वृत्तों की आवृत्तियों पर यह ऊर्जा मापता है, फिर La Livrée d'Hermès के एकीकृत पैटर्नों में वह पैटर्न खोजता है जिसका स्पेक्ट्रम उससे सबसे अधिक मिलता हो। चुनाव दो स्पेक्ट्रमों की समानता पर टिका है, किसी संगीत-नियम पर नहीं: कोई पैटर्न किसी रचना को “व्यक्त” नहीं करता। |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | आपके ब्राउज़र से कुछ भी बाहर नहीं जाता: फ़ाइल, माइक्रोफ़ोन और कैप्चर की गई ध्वनि वहीं विश्लेषित होती हैं और कहीं नहीं भेजी जातीं। |
| `flash` | Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit. | सावधान: छवियाँ तेज़ी से बदल और झिलमिला सकती हैं। “तेज़ बदलाव घटाएँ” विकल्प उन्हें धीमा करता है। |
| `sonTitre` | Le son | ध्वनि |
| `sonChoix` | Son | ध्वनि |
| `morceau` | Morceau fourni {n} — {note} | उपलब्ध रचना {n} — {note} |
| `notes.j1` | do dièse | सी शार्प |
| `notes.j2` | la | ए |
| `notes.j3` | ré | डी |
| `notes.j4` | mi | ई |
| `notes.j5` | sol | जी |
| `notes.j6` | si | बी |
| `notes.j7` | do | सी |
| `tonalites.do dièse mineur` | do dièse mineur | सी शार्प माइनर |
| `tonalites.la mineur` | la mineur | ए माइनर |
| `tonalites.ré mineur` | ré mineur | डी माइनर |
| `tonalites.mi mineur` | mi mineur | ई माइनर |
| `tonalites.sol mineur` | sol mineur | जी माइनर |
| `tonalites.si mineur` | si mineur | बी माइनर |
| `tonalites.do mineur` | do mineur | सी माइनर |
| `sourceFichier` | Mon fichier audio… | मेरी ऑडियो फ़ाइल… |
| `sourceMicro` | Microphone | माइक्रोफ़ोन |
| `sourceEssai` | Musique d'essai | परीक्षण संगीत |
| `sourceOnglet` | Audio d'un onglet | किसी टैब की ध्वनि |
| `lecture` | Lecture | चलाएँ |
| `pause` | Pause | रोकें |
| `arreter` | Arrêter | बंद करें |
| `entree` | Entrée audio | ऑडियो इनपुट |
| `entreeDefaut` | Entrée par défaut | डिफ़ॉल्ट इनपुट |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | मिक्सिंग डेस्क, साउंड कार्ड: उसे जोड़ें, माइक्रोफ़ोन की अनुमति दें, फिर उसे यहाँ चुनें। |
| `sensibilite` | Seuil des attaques | आघात की सीमा |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | औसत से ऊपर मानक विचलनों में: जितनी कम, उतनी अधिक संवेदनशील स्वर-परिवर्तनों के प्रति। |
| `intervalle` | Intervalle minimal entre deux attaques (s) | दो आघातों के बीच न्यूनतम अंतराल (से.) |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | डिफ़ॉल्ट 0.45 से.: अधिकतम लगभग 133 आघात प्रति मिनट। तेज़ गति के लिए इसे घटाएँ। |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | उपलब्ध रचनाएँ AI की सहायता से रची गई हैं (“Musique composée avec l'IA par MC Claude.” अर्थात् “MC Claude द्वारा AI से रचा गया संगीत।”)। |
| `etatDepart` | Appuyez sur Lecture. Les morceaux fournis sont composés avec l'aide de l'IA. | “चलाएँ” दबाएँ। उपलब्ध रचनाएँ AI की सहायता से रची गई हैं। |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | उपलब्ध रचना, AI की सहायता से रची गई। |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | फ़ाइल: {nom} (वह आपके ब्राउज़र में ही रहती है)। |
| `etatMicro` | Micro actif. | माइक्रोफ़ोन चालू है। |
| `etatEntree` | Entrée « {nom} » active. | इनपुट “{nom}” चालू है। |
| `etatOnglet` | Audio d'un onglet actif. | टैब की ध्वनि चालू है। |
| `etatEssai` | Musique d'essai. | परीक्षण संगीत। |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau. | माइक्रोफ़ोन अस्वीकृत है। साइट की सेटिंग में उसकी अनुमति दें (पते के बाईं ओर ताला), फिर दोबारा “चलाएँ” पर क्लिक करें। आप कोई फ़ाइल या उपलब्ध रचना भी चुन सकते हैं। |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | इस उपकरण पर कोई माइक्रोफ़ोन उपलब्ध नहीं है। |
| `erreurMicro` | Le micro ne démarre pas : {message} | माइक्रोफ़ोन शुरू नहीं होता: {message} |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | यहाँ किसी टैब की ध्वनि कैप्चर करना संभव नहीं है। इसके लिए डेस्कटॉप का नया ब्राउज़र (Chrome, Edge) चाहिए; मोबाइल और Safari पर यह नहीं है। |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | चुने गए टैब ने कोई ध्वनि नहीं दी। फिर से शुरू करें और “टैब की ध्वनि साझा करें” पर निशान लगाएँ। |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | यह फ़ाइल ध्वनि के रूप में नहीं पढ़ी जा सकती। |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | ध्वनि शुरू नहीं हो पा रही: {message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | पृष्ठ का डेटा लोड नहीं होता: {message} |
| `bandeManque` | la bande {id} manque à la collection de fonds | पृष्ठभूमियों के संग्रह में पट्टी {id} नहीं है |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | स्रोत रुक गया (उपकरण निकाल दिया गया या अनुमति वापस ले ली गई)। |
| `silence` | Silence : lancez un son. | मौन: कोई ध्वनि चलाएँ। |
| `valide` | Validé | पुष्ट |
| `valideTag` | en cours | वर्तमान |
| `essai` | Essai | परीक्षण |
| `essaiTag` | aperçu | पूर्वावलोकन |
| `validerEssai` | Valider l'essai | परीक्षण को पुष्ट करें |
| `annuler` | Annuler | रद्द करें |
| `pleinEcran` | Plein écran | पूर्ण स्क्रीन |
| `quitterPleinEcran` | Quitter le plein écran | पूर्ण स्क्रीन से बाहर निकलें |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | गहरी पृष्ठभूमि: पुष्ट। सुनहरा फ़्रेम: परीक्षण में। परीक्षण में देखने के लिए किसी विकल्प पर कर्सर ले जाएँ, रखने के लिए क्लिक करें, फिर “परीक्षण को पुष्ट करें”। |
| `fenetreValide` | Fenêtre validée | पुष्ट विंडो |
| `fenetreEssai` | Fenêtre d'essai | परीक्षण विंडो |
| `basculeValide` | Validé | पुष्ट |
| `basculeEssai` | Essai | परीक्षण |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | इस ब्राउज़र में पूर्ण स्क्रीन उपलब्ध नहीं है। |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | यह ब्राउज़र इस तत्व के लिए मूल पूर्ण स्क्रीन नहीं देता: मंच पूरी विंडो को ढक लेता है। Esc या बटन से बंद करें। |
| `groupes.mode` | Pilotage du son | ध्वनि द्वारा नियंत्रण |
| `groupes.fmt` | Format (ordre) | प्रारूप (कोटि) |
| `groupes.col` | Collection | संग्रह |
| `groupes.view` | Vue | दृश्य |
| `groupes.fond` | Variante de case | खाने का रूपांतर |
| `groupes.pal` | Couleurs | रंग |
| `modes.image.0` | Le son définit l'image | ध्वनि छवि तय करती है |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | हर क्षण वह पैटर्न, जिसका स्पेक्ट्रम संगीत के स्पेक्ट्रम से सबसे अधिक मिलता है। |
| `modes.rythme.0` | Le son définit le rythme | ध्वनि लय तय करती है |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | स्वर के हर आघात पर निकटता की शृंखला में एक क़दम। |
| `modes.chemin.0` | Le son guide le chemin | ध्वनि मार्ग दिखाती है |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | लय तय करती है कब, स्पेक्ट्रम तय करता है किस पड़ोसी की ओर। |
| `modes.octaves.0` | Le son suit l'octave | ध्वनि सप्तक का अनुसरण करती है |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | हर आघात पर प्रमुख स्वर की कक्षा में एक क़दम: वृत्त K, फिर उसका सप्तक 4K, फिर 16K… जब ये वृत्त मौजूद हों। |
| `vues.signes.0` | Signes | चिह्न |
| `vues.signes.1` | Les zones positives de la figure du motif. | पैटर्न की आकृति के धनात्मक क्षेत्र। |
| `vues.lignes.0` | Lignes nodales | नोडीय रेखाएँ |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | वे रेखाएँ जहाँ पैटर्न की आकृति शून्य हो जाती है। |
| `vues.pavage.0` | Cellules | कोशिकाएँ |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | स्वयं पैटर्न, 2 × 2 टाइलिंग में। |
| `format.titre` | Ordre {n} | कोटि {n} |
| `format.detail` | Grille de {g} × {g} cases | {g} × {g} खानों का ग्रिड |
| `format.bientot` | Ordre {n} (seconde livraison) | कोटि {n} (दूसरी खेप) |
| `chargementOrdre` | Chargement de l'ordre {n}… | कोटि {n} लोड हो रही है… |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | कोटि {n} का डेटा लोड नहीं होता: {message} |
| `collections.tri.0` | Tricolore — motifs unifiés | त्रिवर्णी — एकीकृत पैटर्न |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} पैटर्न (भिन्न 12 × 12 ग्रिड) |
| `collections.bi.0` | Bicolore — motifs unifiés | द्विवर्णी — एकीकृत पैटर्न |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} पैटर्न (दो दर्पण, 3 अक्टूबर के नियम से पढ़ने योग्य) |
| `collections.ce.0` | Bicolore — symétrie centrale | द्विवर्णी — केंद्रीय सममिति |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} पैटर्न (केवल 180° की केंद्रीय सममिति, 3 अक्टूबर के नियम से पढ़ने योग्य) |
| `collections.b1971128.0` | Bloc 1971128 | ब्लॉक 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} पैटर्न |
| `collections.b16012838.0` | Bloc 16012838 | ब्लॉक 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} पैटर्न |
| `collections.b3016090.0` | Bloc 3016090 | ब्लॉक 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} पैटर्न |
| `collections.f613.0` | Famille 613 | परिवार 613 |
| `collections.f613.1` | {n} motifs | {n} पैटर्न |
| `collections.f18.0` | Famille 18 | परिवार 18 |
| `collections.f18.1` | {n} motifs | {n} पैटर्न |
| `collections.fpilote.0` | Famille pilote | अग्रणी परिवार |
| `collections.fpilote.1` | {n} motifs | {n} पैटर्न |
| `collections.p18.0` | Croix 1·2 | क्रॉस 1·2 |
| `collections.p18.1` | {n} motifs | {n} पैटर्न |
| `collections.p30.0` | Croix 1·2 | क्रॉस 1·2 |
| `collections.p30.1` | {n} motifs | {n} पैटर्न |
| `fond` | Bandes {id} | पट्टियाँ {id} |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec l'état 1 du fond, ou avec l'état 0 : le même fond tourné de 90°. | एक खाने में चार त्रिभुज होते हैं; हर एक को पृष्ठभूमि की अवस्था 1 से बनाया जाता है, या अवस्था 0 से: वही पृष्ठभूमि 90° घुमाई हुई। |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | खाने का रूपांतर केवल द्विवर्णी संग्रह पर लागू होता है। |
| `palettes.creme.0` | Encre et crème | स्याही और क्रीम |
| `palettes.creme.1` | Les couleurs du site. | साइट के रंग। |
| `palettes.monochrome.0` | Gris et blanc | स्लेटी और सफ़ेद |
| `palettes.monochrome.1` | Le monochrome du site. | साइट का एकवर्ण रूप। |
| `palettes.perso.0` | Mes couleurs | मेरे रंग |
| `palettes.perso.1` | Choisissez le motif et le fond. | पैटर्न और पृष्ठभूमि चुनें। |
| `palettes.son.0` | La teinte suit le son | रंगत ध्वनि के साथ चलती है |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | रंगत ध्वनि की चमक के साथ धीरे-धीरे सरकती है (डिफ़ॉल्ट रूप से बंद)। |
| `persoMotif` | Motif | पैटर्न |
| `persoFond` | Fond | पृष्ठभूमि |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | त्रिवर्णी में: V सबसे गहरा (स्याही), O मध्यम स्लेटी, M सबसे हल्का (क्रीम)। |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | चलते-चलते सेटिंग |
| `lissage` | Lissage | चिकनाई |
| `pulsationTitre` | Pulsation | स्पंदन |
| `pulsations.attaque` | À chaque attaque | हर आघात पर |
| `pulsations.temps` | À chaque temps | हर ताल पर |
| `pulsations.quatre` | Toutes les 4 pulsations | हर 4 स्पंदनों पर |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | डिफ़ॉल्ट रूप से हर आघात पर बदलाव। जब नियमित स्पंदन पहचाना जाए, तो आप हर ताल पर या हर 4 स्पंदनों पर बदलाव चुन सकते हैं। |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | स्पंदन पहचाना गया: {bpm} प्रति मिनट। |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | अभी कोई नियमित स्पंदन नहीं पहचाना गया। |
| `calme` | Réduire les changements rapides | तेज़ बदलाव घटाएँ |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | लंबा फ़ेड और लंबा ठहराव। यदि आपका सिस्टम कम एनिमेशन माँगता है तो अपने-आप चालू रहता है। |
| `pente` | Compenser la pente des graves | बास की ढलान की क्षतिपूर्ति करें |
| `pauseImage` | Pause de l'image | छवि रोकें |
| `optionsTitre` | Options | विकल्प |
| `comprendreTitre` | Pour comprendre | समझने के लिए |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | दो शैक्षिक दृश्य, जिनका ध्वनि से कोई संबंध नहीं। |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | मोड (4, 0) और उसकी अपभ्रष्ट जोड़ी |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | वर्गाकार पट्टिका पर मोड (4, 0) और (0, 4) की आवृत्ति समान होती है: उनका कोई भी संयोजन भी उसी आवृत्ति का मोड है। स्लाइडर cos(4πx/a) + cos(4πy/a) (दाएँ) से cos(4πx/a) − cos(4πy/a) (बाएँ) तक जाता है; बीच में केवल cos(4πx/a) बचता है, यानी ऊर्ध्वाधर रेखाएँ। हल्के और गहरे क्षेत्र: विपरीत चिह्न; रेखा: नोडीय रेखा। |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | मिश्रण s: cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | अपनी अपभ्रष्ट जोड़ी से मिले मोड (4, 0) की आकृति |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | समता, ±1 के दो जालकों के अध्यारोपण के रूप में |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | हर जालक एक शतरंज-पट है: खाने (i, j) की समता (−1)^(i + j)। उनका गुणनफल +1 होता है जहाँ दोनों मेल खाते हैं और −1 जहाँ भिन्न हों: यह बिटों का XNOR है, दो आर-पार रखे ध्रुवकों की तरह। किसी एक को थोड़ा खिसकाने या घुमाने पर मोआरे उभरता है। |
| `moireAngle` | Rotation du second réseau (degrés) | दूसरे जालक का घुमाव (डिग्री) |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | दूसरे जालक का आवर्त (पहले के % में) |
| `moireA` | Réseau A | जालक A |
| `moireB` | Réseau B | जालक B |
| `moireProduit` | Produit A × B (XNOR) | गुणनफल A × B (XNOR) |
| `moireAlt` | Produit de deux réseaux de ±1 | ±1 के दो जालकों का गुणनफल |
| `clesTitre` | Lecture en clés | कुंजियों में पठन |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | केवल प्रदर्शन: अक्षों के संकेतन की कुंजियाँ (72 कुंजियाँ दोहराव हटाकर, समता कोने के खाने से गिनी हुई, कोटि 70) जिनका योग चुने गए पैटर्न की आकृति लौटाता है, जब ऐसा संभव हो। पृष्ठ किसी कुंजी और आवृत्ति के बीच कोई संबंध नहीं बताता। |
| `clesNatures.D+` | diagonale x + y | विकर्ण x + y |
| `clesNatures.D-` | diagonale y − x | विकर्ण y − x |
| `clesNatures.H` | horizontale | क्षैतिज |
| `clesNatures.V` | verticale | ऊर्ध्वाधर |
| `clesFigure.figure` | Figure du motif | पैटर्न की आकृति |
| `clesFigure.V` | Classe V (violet) | वर्ग V (बैंगनी) |
| `clesFigure.O` | Classe O (orange) | वर्ग O (नारंगी) |
| `clesFigure.M` | Classe M (magenta) | वर्ग M (मैजेंटा) |
| `clesActives` | {n} clés actives : {liste} | {n} सक्रिय कुंजियाँ: {liste} |
| `clesAucune` | aucune clé (figure vide) | कोई कुंजी नहीं (खाली आकृति) |
| `clesComplement` |  (au complément près) |  (पूरक तक) |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | यह आकृति कुंजियों का योग नहीं है: यह उनसे बनने वाले समष्टि के बाहर है। |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | पैटर्न {i} / {n}, संग्रह {collection}। |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | कुंजियों में पठन केवल कोटि 12 पर लागू है। |
| `loiTitre` | Loi de fréquence des cercles | वृत्तों का आवृत्ति-नियम |
| `loiChoix.racine` | Échelle compressée pour l'oreille | कान के लिए संपीड़ित पैमाना |
| `loiChoix.plaque` | Loi de la plaque réelle | वास्तविक पट्टिका का नियम |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | संपीड़ित पैमाना: f = संदर्भ आवृत्ति × √K / 2 (आरंभिक सेटिंग)। पट्टिका का नियम: f = c × K, वास्तविक पट्टिका की तरह (3 मिमी का एल्युमीनियम, 48 सेमी: c = 31.85 हर्ट्ज़)। कोटि 12 पर 32 से 2 293 हर्ट्ज़ तक; नाइक्विस्ट आवृत्ति के 0.9 गुना से ऊपर के वृत्त पहले की तरह अनदेखे किए जाते हैं। आघात-संसूचक और रंगत का अनुसरण नहीं बदलते। |
| `loiC` | c (Hz par unité de m² + n²) | c (m² + n² की प्रति इकाई हर्ट्ज़) |
| `figureTitre` | Figure (vues Signes et Lignes) | आकृति (चिह्न और रेखा दृश्य) |
| `figureChoix.motif` | Du motif retenu | चुने गए पैटर्न की |
| `figureChoix.son` | Du son | ध्वनि की |
| `figureChoix.ecart` | Les deux (écart) | दोनों (अंतर) |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | चुने गए पैटर्न की: चुने गए पैटर्न की Chladni आकृति (आरंभिक सेटिंग)। ध्वनि की: हर वृत्त की तरंगों का योग, उस ऊर्जा से भारित जो ध्वनि वहाँ डालती है, किसी पैटर्न से गुज़रे बिना। दोनों: वे स्थान जहाँ ये दोनों आकृतियाँ भिन्न हैं। ध्वनि कलाएँ नहीं देती: उन्हें शून्य रखा जाता है। |
| `sceneTitre` | La scène | मंच |
| `projection` | Ouvrir une fenêtre de projection | प्रक्षेपण विंडो खोलें |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | पूर्ण स्क्रीन हमेशा पुष्ट विंडो चलाती है, परीक्षण नहीं; नियंत्रण और कर्सर 3 सेकंड बाद छिप जाते हैं। लौटने के लिए Esc। प्रक्षेपण विंडो अलग है: उसे दूसरी स्क्रीन या प्रोजेक्टर पर खींच ले जाएँ। |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | ब्राउज़र ने प्रक्षेपण विंडो रोक दी। इस साइट के लिए पॉप-अप विंडो की अनुमति दें, फिर दोबारा करें। |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | जब ब्राउज़र अनुमति दे, तो चलने के दौरान स्क्रीन जलती रहती है। |
| `enregTitre` | Enregistrer | रिकॉर्ड करें |
| `enreg` | Enregistrer 15 s | 15 से. रिकॉर्ड करें |
| `enregEnCours` | Enregistrement : {s} s | रिकॉर्डिंग: {s} से. |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16 (Reels, Shorts, TikTok) |
| `format45` | 4:5 (publication) | 4:5 (पोस्ट) |
| `format11` | 1:1 (carré) | 1:1 (वर्गाकार) |
| `formatVideo` | Format de la vidéo | वीडियो का प्रारूप |
| `signature` | Bandeau « {texte} » en bas de la vidéo | वीडियो के नीचे “{texte}” पट्टी |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | वीडियो रिकॉर्ड हो गया: डाउनलोड शुरू हो गया है। |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | आपका ब्राउज़र MP4 नहीं लिखता: वीडियो WebM प्रारूप में है। इसे MP4 में बदलने के लिए (Instagram, TikTok) किसी कनवर्टर या ffmpeg का उपयोग करें: ffmpeg -i फ़ाइल.webm फ़ाइल.mp4। |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | MP4 में AAC ऑडियो: हर जगह चलता है (iPhone, QuickTime, प्रकाशन ऐप)। |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | यह ब्राउज़र MP4 का ऑडियो Opus में लिखता है: यह iPhone, QuickTime या कुछ प्रकाशन ऐप पर शायद न चले (डेस्कटॉप का नया Chrome: AAC)। |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | Opus ऑडियो: iPhone, QuickTime या कुछ प्रकाशन ऐप पर शायद न चले। AAC ट्रैक के लिए: ffmpeg -i फ़ाइल.mp4 -c:v copy -c:a aac आउटपुट.mp4। |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | इस ब्राउज़र में वीडियो रिकॉर्डिंग उपलब्ध नहीं है। |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | पहले कोई ध्वनि चलाएँ: मौन रिकॉर्ड नहीं किया जाता। |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | रिकॉर्डिंग शुरू नहीं होती: {message} |
| `raccourcisTitre` | Raccourcis clavier | कीबोर्ड शॉर्टकट |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | परीक्षण का दृश्य: चिह्न, नोडीय रेखाएँ, कोशिकाएँ |
| `raccourcis.1.0` | Espace | स्पेस |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | अगला नियंत्रण-मोड (परीक्षण) |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | छवि रोकें |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | परीक्षण को पुष्ट करें |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | पूर्ण स्क्रीन (पुष्ट विंडो) |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | 15 से. रिकॉर्ड करें |
| `infoMotif` | Motif {i} sur {n} | पैटर्न {i} / {n} |
| `infoImages` | {fps} images/s | {fps} फ़्रेम/से. |
| `infoResolution` | résolution réduite | घटा हुआ रिज़ॉल्यूशन |
| `semaineTitre` | La semaine | यह सप्ताह |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | MC Claude द्वारा AI से रचा गया संगीत। |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | पोस्टर पर क्लिक करने से YouTube या TikTok का प्लेयर लोड होता है: एक तृतीय-पक्ष सेवा, जिसे तब आपकी विज़िट मिल जाती है। इससे पहले कुछ भी लोड नहीं होता। |
| `jourTitre` | Jour {n} — {tonalite} | दिन {n} — {tonalite} |
| `datePub` | Publié le {date} | {date} को प्रकाशित |
| `bientot` | Bientôt | जल्द ही |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | दिन {n} का वीडियो चलाएँ, {tonalite} |
| `lireTiktok` | Lire ici (TikTok) | यहीं चलाएँ (TikTok) |
| `voirYoutube` | Voir sur YouTube | YouTube पर देखें |
| `voirTiktok` | Voir sur TikTok | TikTok पर देखें |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | दिन {n} का पोस्टर — {tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | दिन {n} का वीडियो |
| `voirAussiTitre` | Voir aussi | यह भी देखें |
| `voirAussi.0.href` | /galerie-bicolore.html | /galerie-bicolore.html |
| `voirAussi.0.titre` | Galerie bicolore | द्विवर्णी दीर्घा |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | अक्षों से बने और घन पर बंद द्विवर्णी पैटर्न: पठन-कण, टाइलिंग, निर्यात। (फ़्रेंच पृष्ठ) |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /galerie-patterns-unifies.html |
| `voirAussi.1.titre` | Galerie tricolore | त्रिवर्णी दीर्घा |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | रंगों के मिश्रण से बने एकीकृत पैटर्न: उसकी टाइलिंग देखने के लिए एक पैटर्न चुनें। (फ़्रेंच पृष्ठ) |
| `voirAussi.2.href` | /fonds-ecran.html | /fonds-ecran.html |
| `voirAussi.2.titre` | Fonds d'écran | वॉलपेपर |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | पूर्ण स्क्रीन पर वस्त्र-वॉलपेपर: ध्वनि पर प्रतिक्रिया करते हैं या ध्यान-मोड में चलते हैं। (फ़्रेंच पृष्ठ) |
| `voirAussi.3.href` | /galerie-animations.html | /hi/animations/ |
| `voirAussi.3.titre` | Galerie d'animations | एनिमेशन दीर्घा |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | पृष्ठभूमि-संग्रहों के एनिमेशन, देखने और MP4 में डाउनलोड करने के लिए। |
| `voirAussi.4.href` | /chladni.html | /chladni.html |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | आकृतियाँ, स्वरग्राम और आवृत्तियाँ: वह पृष्ठ जो पैटर्नों की शब्दावली को पट्टिका के मोड से जोड़ता है। (फ़्रेंच पृष्ठ) |
| `voirAussi.5.href` | /fr/livre/ | /hi/book/ |
| `voirAussi.5.titre` | Le livre | पुस्तक |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès ऑनलाइन, पृष्ठ-दर-पृष्ठ, मुफ़्त PDF के साथ। |

### Voir sa musique — métadonnées de la page

| Clé | Français | हिन्दी |
|---|---|---|
| `titre, h1` | Voir sa musique — La Livrée d'Hermès | अपने संगीत को देखें — La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | अपने संगीत को देखें: ध्वनि जो Chladni आकृति बनाती है, और La Livrée d'Hermès का वह पैटर्न जो उससे सबसे अधिक मिलता है। ध्वनि के साथ 15 सेकंड रिकॉर्ड करें। |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | अपने संगीत को देखें: ध्वनि जो Chladni आकृति बनाती है, और La Livrée d'Hermès का वह पैटर्न जो उससे सबसे अधिक मिलता है। |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | हिन्दी |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | ध्वनि के तीन पृष्ठ |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | साइमैटिक्स · ध्वनि रूप रचती है |
| `trois-portes.musique` | Voir sa musique · Le son guide | अपने संगीत को देखें · ध्वनि राह दिखाती है |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | वॉलपेपर · ध्वनि लुप्त हो जाती है |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | हिन्दी |
|---|---|---|
| `label` | Voir sa musique | अपने संगीत को देखें |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | कोई रचना, फ़ाइल या माइक्रोफ़ोन चुनें: पृष्ठ La Livrée d’Hermès का वह पैटर्न खोजता है जिसका स्पेक्ट्रम ध्वनि के सबसे निकट हो। |
