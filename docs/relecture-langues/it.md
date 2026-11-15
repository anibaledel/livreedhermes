# Relecture — « Voir sa musique » en Italiano

Généré par `node scripts/build-musique-textes.mjs` depuis `data/musique-chladni/traductions/<langue>.json` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. À relire par un locuteur natif.

Page concernée : « Voir sa musique » (`musique-chladni.html` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir `TODO-RELECTURE.md`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.

## Italiano (`it`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | Italiano |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | Vedere la propria musica — La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Vedere la propria musica: scegli un brano, un file o il microfono e guarda la figura di Chladni del suono e il motivo di La Livrée d'Hermès più simile. 15 secondi. |
| `ariane` | Voir sa musique | Vedere la propria musica |
| `h1` | Voir sa musique | Vedere la propria musica |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | Ogni musica ha una firma: il modo in cui la sua energia si ripartisce tra le frequenze. Scegli un brano, un file o il microfono: la pagina misura questa energia alle frequenze di ciascun cerchio di modi di una piastra quadrata, poi cerca, tra i motivi unificati di La Livrée d'Hermès, quello il cui spettro le somiglia di più. La scelta poggia sulla somiglianza di due spettri, non su una legge musicale: un motivo non «esprime» un brano. |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | Nulla lascia il tuo browser: il file, il microfono e l'audio catturato sono analizzati sul posto e non vengono inviati da nessuna parte. |
| `flash` | Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit. | Attenzione: le immagini possono cambiare in fretta e lampeggiare. L'impostazione «riduci i cambiamenti rapidi» le rallenta. |
| `sonTitre` | Le son | Il suono |
| `sonChoix` | Son | Suono |
| `morceau` | Morceau fourni {n} — {note} | Brano fornito {n} — {note} |
| `notes.j1` | do dièse | do diesis |
| `notes.j2` | la | la |
| `notes.j3` | ré | re |
| `notes.j4` | mi | mi |
| `notes.j5` | sol | sol |
| `notes.j6` | si | si |
| `notes.j7` | do | do |
| `tonalites.do dièse mineur` | do dièse mineur | do diesis minore |
| `tonalites.la mineur` | la mineur | la minore |
| `tonalites.ré mineur` | ré mineur | re minore |
| `tonalites.mi mineur` | mi mineur | mi minore |
| `tonalites.sol mineur` | sol mineur | sol minore |
| `tonalites.si mineur` | si mineur | si minore |
| `tonalites.do mineur` | do mineur | do minore |
| `sourceFichier` | Mon fichier audio… | Il mio file audio… |
| `sourceMicro` | Microphone | Microfono |
| `sourceEssai` | Musique d'essai | Musica di prova |
| `sourceOnglet` | Audio d'un onglet | Audio di una scheda |
| `lecture` | Lecture | Riproduci |
| `pause` | Pause | Pausa |
| `arreter` | Arrêter | Ferma |
| `entree` | Entrée audio | Ingresso audio |
| `entreeDefaut` | Entrée par défaut | Ingresso predefinito |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | Mixer, scheda audio: collegala, consenti il microfono, poi sceglila qui. |
| `sensibilite` | Seuil des attaques | Soglia degli attacchi |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | In deviazioni standard sopra la media: più bassa, più sensibile ai cambi di nota. |
| `intervalle` | Intervalle minimal entre deux attaques (s) | Intervallo minimo tra due attacchi (s) |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | 0,45 s per impostazione predefinita: al massimo circa 133 attacchi al minuto. Abbassalo per un tempo veloce. |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | I brani forniti sono composti con l'aiuto dell'IA («Musica composta con l'IA da MC Claude.»). |
| `etatDepart` | Appuyez sur Lecture. Les morceaux fournis sont composés avec l'aide de l'IA. | Premi Riproduci. I brani forniti sono composti con l'aiuto dell'IA. |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | Brano fornito, composto con l'aiuto dell'IA. |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | File: {nom} (resta nel tuo browser). |
| `etatMicro` | Micro actif. | Microfono attivo. |
| `etatEntree` | Entrée « {nom} » active. | Ingresso «{nom}» attivo. |
| `etatOnglet` | Audio d'un onglet actif. | Audio di una scheda attivo. |
| `etatEssai` | Musique d'essai. | Musica di prova. |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau. | Il microfono è stato rifiutato. Consentilo nelle impostazioni del sito (il lucchetto, a sinistra dell'indirizzo), poi fai di nuovo clic su Riproduci. Puoi anche scegliere un file o un brano. |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | Nessun microfono è disponibile su questo dispositivo. |
| `erreurMicro` | Le micro ne démarre pas : {message} | Il microfono non si avvia: {message} |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | La cattura dell'audio di una scheda non è possibile qui. Richiede un browser desktop recente (Chrome, Edge); manca su dispositivi mobili e su Safari. |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | La scheda scelta non ha fornito audio. Ricomincia e spunta «Condividi l'audio della scheda». |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | Questo file non può essere letto come suono. |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | Il suono non può partire: {message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | I dati della pagina non si caricano: {message} |
| `bandeManque` | la bande {id} manque à la collection de fonds | la banda {id} manca nella collezione di fondi |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | La sorgente si è fermata (dispositivo scollegato o autorizzazione ritirata). |
| `silence` | Silence : lancez un son. | Silenzio: avvia un suono. |
| `valide` | Validé | Convalidata |
| `valideTag` | en cours | in corso |
| `essai` | Essai | Prova |
| `essaiTag` | aperçu | anteprima |
| `validerEssai` | Valider l'essai | Convalida la prova |
| `annuler` | Annuler | Annulla |
| `pleinEcran` | Plein écran | Schermo intero |
| `quitterPleinEcran` | Quitter le plein écran | Esci dallo schermo intero |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | Fondo scuro: convalidata. Cornice dorata: in prova. Passa il cursore su un'opzione per vederla nella prova, fai clic per tenerla, poi «Convalida la prova». |
| `fenetreValide` | Fenêtre validée | Finestra convalidata |
| `fenetreEssai` | Fenêtre d'essai | Finestra di prova |
| `basculeValide` | Validé | Convalidata |
| `basculeEssai` | Essai | Prova |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | Lo schermo intero non è disponibile in questo browser. |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | Questo browser non offre lo schermo intero nativo per questo elemento: la scena copre la finestra. Esc o il pulsante la chiude. |
| `groupes.mode` | Pilotage du son | Controllo del suono |
| `groupes.fmt` | Format (ordre) | Formato (ordine) |
| `groupes.col` | Collection | Collezione |
| `groupes.view` | Vue | Vista |
| `groupes.fond` | Variante de case | Variante di casella |
| `groupes.pal` | Couleurs | Colori |
| `modes.image.0` | Le son définit l'image | Il suono definisce l'immagine |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | In ogni istante, il motivo il cui spettro somiglia di più a quello della musica. |
| `modes.rythme.0` | Le son définit le rythme | Il suono definisce il ritmo |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | Un passo nella catena di prossimità a ogni attacco di nota. |
| `modes.chemin.0` | Le son guide le chemin | Il suono guida il cammino |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | Il ritmo decide quando, lo spettro decide verso quale vicino. |
| `modes.octaves.0` | Le son suit l'octave | Il suono segue l'ottava |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | A ogni attacco, un passo sull'orbita della nota dominante: il cerchio K, poi la sua ottava 4K, poi 16K…, quando questi cerchi esistono. |
| `vues.signes.0` | Signes | Segni |
| `vues.signes.1` | Les zones positives de la figure du motif. | Le zone positive della figura del motivo. |
| `vues.lignes.0` | Lignes nodales | Linee nodali |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | Le linee dove la figura del motivo si annulla. |
| `vues.pavage.0` | Cellules | Celle |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | Il motivo stesso, in pavimentazione 2 × 2. |
| `format.titre` | Ordre {n} | Ordine {n} |
| `format.detail` | Grille de {g} × {g} cases | Griglia di {g} × {g} caselle |
| `format.bientot` | Ordre {n} (seconde livraison) | Ordine {n} (seconda consegna) |
| `chargementOrdre` | Chargement de l'ordre {n}… | Caricamento dell'ordine {n}… |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | I dati dell'ordine {n} non si caricano: {message} |
| `collections.tri.0` | Tricolore — motifs unifiés | Tricolore — motivi unificati |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} motivi (griglie 12 × 12 distinte) |
| `collections.bi.0` | Bicolore — motifs unifiés | Bicolore — motivi unificati |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} motivi (due specchi, leggibili con la regola del 3 ottobre) |
| `collections.ce.0` | Bicolore — symétrie centrale | Bicolore — simmetria centrale |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} motivi (solo simmetria centrale a 180°, leggibili con la regola del 3 ottobre) |
| `collections.b1971128.0` | Bloc 1971128 | Blocco 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} motivi |
| `collections.b16012838.0` | Bloc 16012838 | Blocco 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} motivi |
| `collections.b3016090.0` | Bloc 3016090 | Blocco 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} motivi |
| `collections.f613.0` | Famille 613 | Famiglia 613 |
| `collections.f613.1` | {n} motifs | {n} motivi |
| `collections.f18.0` | Famille 18 | Famiglia 18 |
| `collections.f18.1` | {n} motifs | {n} motivi |
| `collections.fpilote.0` | Famille pilote | Famiglia pilota |
| `collections.fpilote.1` | {n} motifs | {n} motivi |
| `collections.p18.0` | Croix 1·2 | Croce 1·2 |
| `collections.p18.1` | {n} motifs | {n} motivi |
| `collections.p30.0` | Croix 1·2 | Croce 1·2 |
| `collections.p30.1` | {n} motifs | {n} motivi |
| `fond` | Bandes {id} | Bande {id} |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec l'état 1 du fond, ou avec l'état 0 : le même fond tourné de 90°. | Una casella porta quattro triangoli; ciascuno è disegnato con lo stato 1 del fondo, oppure con lo stato 0: lo stesso fondo ruotato di 90°. |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | La variante di casella si applica solo alla collezione bicolore. |
| `palettes.creme.0` | Encre et crème | Inchiostro e crema |
| `palettes.creme.1` | Les couleurs du site. | I colori del sito. |
| `palettes.monochrome.0` | Gris et blanc | Grigio e bianco |
| `palettes.monochrome.1` | Le monochrome du site. | Il monocromo del sito. |
| `palettes.perso.0` | Mes couleurs | I miei colori |
| `palettes.perso.1` | Choisissez le motif et le fond. | Scegli il motivo e lo sfondo. |
| `palettes.son.0` | La teinte suit le son | La tinta segue il suono |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | La tinta scivola lentamente con la luminosità del suono (disattivata per impostazione predefinita). |
| `persoMotif` | Motif | Motivo |
| `persoFond` | Fond | Sfondo |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | In tricolore: V il più scuro (inchiostro), O grigio medio, M il più chiaro (crema). |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | Impostazioni al volo |
| `lissage` | Lissage | Livellamento |
| `pulsationTitre` | Pulsation | Pulsazione |
| `pulsations.attaque` | À chaque attaque | A ogni attacco |
| `pulsations.temps` | À chaque temps | A ogni battito |
| `pulsations.quatre` | Toutes les 4 pulsations | Ogni 4 pulsazioni |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | Per impostazione predefinita, un cambio a ogni attacco. Quando viene rilevata una pulsazione regolare, puoi cambiare a ogni battito o ogni 4 pulsazioni. |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | Pulsazione rilevata: {bpm} al minuto. |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | Nessuna pulsazione regolare rilevata per ora. |
| `calme` | Réduire les changements rapides | Riduci i cambiamenti rapidi |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | Una dissolvenza più lunga e una tenuta maggiore. Attivato d'ufficio se il tuo sistema chiede meno animazioni. |
| `pente` | Compenser la pente des graves | Compensa la pendenza dei bassi |
| `pauseImage` | Pause de l'image | Pausa dell'immagine |
| `optionsTitre` | Options | Opzioni |
| `comprendreTitre` | Pour comprendre | Per capire |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | Due viste didattiche, senza legame con il suono. |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | Il modo (4, 0) e la sua coppia degenere |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | Su una piastra quadrata, i modi (4, 0) e (0, 4) hanno la stessa frequenza: ogni combinazione è anch'essa un modo di quella frequenza. Il cursore passa da cos(4πx/a) + cos(4πy/a) (a destra) a cos(4πx/a) − cos(4πy/a) (a sinistra); al centro resta solo cos(4πx/a), linee verticali. Zone chiare e scure: segni opposti; tratto: linea nodale. |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | Miscela s: cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | Figura del modo (4, 0) mescolato con la sua coppia degenere |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | La parità come sovrapposizione di due reticoli di ±1 |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | Ogni reticolo è una scacchiera: la parità (−1)^(i + j) della casella (i, j). Il loro prodotto vale +1 dove i due concordano e −1 dove differiscono: è lo XNOR dei bit, come due polarizzatori incrociati. Spostando o ruotando un poco uno dei due, compare un moiré. |
| `moireAngle` | Rotation du second réseau (degrés) | Rotazione del secondo reticolo (gradi) |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | Periodo del secondo reticolo (in % di quello del primo) |
| `moireA` | Réseau A | Reticolo A |
| `moireB` | Réseau B | Reticolo B |
| `moireProduit` | Produit A × B (XNOR) | Prodotto A × B (XNOR) |
| `moireAlt` | Produit de deux réseaux de ±1 | Prodotto di due reticoli di ±1 |
| `clesTitre` | Lecture en clés | Lettura in chiavi |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | Solo visualizzazione: le chiavi della nota degli assi (72 chiavi senza duplicati, parità contata dalla casella d'angolo, rango 70) la cui somma restituisce la figura del motivo scelto, quando esiste. La pagina non afferma alcun legame tra una chiave e una frequenza. |
| `clesNatures.D+` | diagonale x + y | diagonale x + y |
| `clesNatures.D-` | diagonale y − x | diagonale y − x |
| `clesNatures.H` | horizontale | orizzontale |
| `clesNatures.V` | verticale | verticale |
| `clesFigure.figure` | Figure du motif | Figura del motivo |
| `clesFigure.V` | Classe V (violet) | Classe V (viola) |
| `clesFigure.O` | Classe O (orange) | Classe O (arancione) |
| `clesFigure.M` | Classe M (magenta) | Classe M (magenta) |
| `clesActives` | {n} clés actives : {liste} | {n} chiavi attive: {liste} |
| `clesAucune` | aucune clé (figure vide) | nessuna chiave (figura vuota) |
| `clesComplement` |  (au complément près) |  (a meno del complemento) |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | Questa figura non è la somma di chiavi: esce dallo spazio che esse generano. |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | Motivo {i} di {n}, collezione {collection}. |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | La lettura in chiavi riguarda solo l'ordine 12. |
| `loiTitre` | Loi de fréquence des cercles | Legge di frequenza dei cerchi |
| `loiChoix.racine` | Échelle compressée pour l'oreille | Scala compressa per l'orecchio |
| `loiChoix.plaque` | Loi de la plaque réelle | Legge della piastra reale |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | Scala compressa: f = frequenza di riferimento × √K / 2 (impostazione iniziale). Legge della piastra: f = c × K, come una piastra reale (alluminio da 3 mm, 48 cm: c = 31,85 Hz). All'ordine 12, da 32 a 2 293 Hz; i cerchi oltre 0,9 × la frequenza di Nyquist sono ignorati, come prima. Il rilevatore di attacchi e il tracciamento della tinta non cambiano. |
| `loiC` | c (Hz par unité de m² + n²) | c (Hz per unità di m² + n²) |
| `figureTitre` | Figure (vues Signes et Lignes) | Figura (viste Segni e Linee) |
| `figureChoix.motif` | Du motif retenu | Del motivo scelto |
| `figureChoix.son` | Du son | Del suono |
| `figureChoix.ecart` | Les deux (écart) | Entrambe (scarto) |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | Del motivo scelto: la figura di Chladni del motivo scelto (impostazione iniziale). Del suono: la somma delle onde di ciascun cerchio, ponderate dall'energia che il suono vi mette, senza passare da un motivo. Entrambe: i punti in cui queste due figure differiscono. Il suono non fornisce le fasi: sono poste a zero. |
| `sceneTitre` | La scène | La scena |
| `projection` | Ouvrir une fenêtre de projection | Apri una finestra di proiezione |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | Lo schermo intero avvia sempre la finestra convalidata, mai la prova; i comandi e il cursore si nascondono dopo 3 secondi. Esc per tornare. La finestra di proiezione è separata: trascinala su un secondo schermo o un proiettore. |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | La finestra di proiezione è stata bloccata dal browser. Consenti i popup per questo sito, poi riprova. |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | Lo schermo resta acceso durante la riproduzione quando il browser lo consente. |
| `enregTitre` | Enregistrer | Registra |
| `enreg` | Enregistrer 15 s | Registra 15 s |
| `enregEnCours` | Enregistrement : {s} s | Registrazione: {s} s |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16 (Reels, Shorts, TikTok) |
| `format45` | 4:5 (publication) | 4:5 (post) |
| `format11` | 1:1 (carré) | 1:1 (quadrato) |
| `formatVideo` | Format de la vidéo | Formato del video |
| `signature` | Bandeau « {texte} » en bas de la vidéo | Banda «{texte}» in fondo al video |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | Video registrato: il download è iniziato. |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | Il tuo browser non scrive MP4: il video è in formato WebM. Per convertirlo in MP4 (Instagram, TikTok), passalo da un convertitore o da ffmpeg: ffmpeg -i file.webm file.mp4. |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | Audio AAC nell'MP4: si legge ovunque (iPhone, QuickTime, app di pubblicazione). |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | Questo browser scrive l'audio dell'MP4 in Opus: potrebbe non leggersi su iPhone, QuickTime o in alcune app di pubblicazione (Chrome desktop recente: AAC). |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | Audio Opus: potrebbe non leggersi su iPhone, QuickTime o in alcune app di pubblicazione. Per una traccia AAC: ffmpeg -i file.mp4 -c:v copy -c:a aac uscita.mp4. |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | La registrazione video non è disponibile in questo browser. |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | Avvia prima un suono: il silenzio non si registra. |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | La registrazione non parte: {message} |
| `raccourcisTitre` | Raccourcis clavier | Scorciatoie da tastiera |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | Vista della prova: segni, linee nodali, celle |
| `raccourcis.1.0` | Espace | Spazio |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | Modalità di controllo successiva (prova) |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | Pausa dell'immagine |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | Convalida la prova |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | Schermo intero (finestra convalidata) |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | Registra 15 s |
| `infoMotif` | Motif {i} sur {n} | Motivo {i} di {n} |
| `infoImages` | {fps} images/s | {fps} immagini/s |
| `infoResolution` | résolution réduite | risoluzione ridotta |
| `semaineTitre` | La semaine | La settimana |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | Musica composta con l'IA da MC Claude. |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | Un clic su un poster carica il lettore di YouTube o di TikTok: un servizio di terze parti, che riceve allora la tua visita. Prima non viene caricato nulla. |
| `jourTitre` | Jour {n} — {tonalite} | Giorno {n} — {tonalite} |
| `datePub` | Publié le {date} | Pubblicato il {date} |
| `bientot` | Bientôt | Presto |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | Guarda il video del giorno {n}, {tonalite} |
| `lireTiktok` | Lire ici (TikTok) | Guarda qui (TikTok) |
| `voirYoutube` | Voir sur YouTube | Guarda su YouTube |
| `voirTiktok` | Voir sur TikTok | Guarda su TikTok |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | Poster del giorno {n} — {tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | Video del giorno {n} |
| `voirAussiTitre` | Voir aussi | Vedi anche |
| `voirAussi.0.href` | /galerie-bicolore.html | /galerie-bicolore.html |
| `voirAussi.0.titre` | Galerie bicolore | Galleria bicolore |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | I motivi bicolori generati dagli assi, chiusi sul cubo: grana, pavimentazione, esportazione. (Pagina in francese.) |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /galerie-patterns-unifies.html |
| `voirAussi.1.titre` | Galerie tricolore | Galleria tricolore |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | I motivi unificati, generati dalla miscela di tinte: seleziona un motivo per vedere la sua pavimentazione. (Pagina in francese.) |
| `voirAussi.2.href` | /fonds-ecran.html | /fonds-ecran.html |
| `voirAussi.2.titre` | Fonds d'écran | Sfondi |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | Sfondi tessili a schermo intero, reattivi al suono o in modalità meditativa. (Pagina in francese.) |
| `voirAussi.3.href` | /galerie-animations.html | /it/animations/ |
| `voirAussi.3.titre` | Galerie d'animations | Galleria di animazioni |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | Le animazioni delle collezioni di fondi, da guardare e da scaricare in MP4. |
| `voirAussi.4.href` | /chladni.html | /chladni.html |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | Figure, scale e frequenze: la pagina che lega il vocabolario dei motivi ai modi di una piastra. (Pagina in francese.) |
| `voirAussi.5.href` | /fr/livre/ | /it/book/ |
| `voirAussi.5.titre` | Le livre | Il libro |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès online, pagina per pagina, con il PDF gratuito. |

### Voir sa musique — métadonnées de la page

| Clé | Français | Italiano |
|---|---|---|
| `titre, h1` | Voir sa musique — La Livrée d'Hermès | Vedere la propria musica — La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Vedere la propria musica: la figura di Chladni che il suono disegna e il motivo di La Livrée d'Hermès che più gli somiglia. Registra 15 secondi con il suono. |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | Vedere la propria musica: la figura di Chladni che il suono disegna e il motivo di La Livrée d'Hermès che più gli somiglia. |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | Italiano |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | Le tre pagine sonore |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | Cimatica · Il suono crea la forma |
| `trois-portes.musique` | Voir sa musique · Le son guide | Vedere la propria musica · Il suono guida |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | Sfondo · Il suono si dissolve |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | Italiano |
|---|---|---|
| `label` | Voir sa musique | Vedere la propria musica |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | Scegli un brano, un file o il microfono: la pagina cerca il motivo di La Livrée d’Hermès il cui spettro è più vicino a quello del suono. |

### Page « Outils » (`data/outils-langues/outils-support.json`)

| Clé | Français | Italiano |
|---|---|---|
| `titre` | Outils | Strumenti |
| `description` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | Gli strumenti interattivi di La Livrée d'Hermès — comporre, visualizzare, stampare, cifrare. |
| `intro` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | Gli strumenti interattivi di La Livrée d'Hermès — comporre, visualizzare, stampare, cifrare. Le pagine contrassegnate «(pagina in francese)» non sono ancora tradotte. |
| `note « page en français »` | — | (pagina in francese) |
| `Accueil (fil d'Ariane)` | Accueil | Pagina iniziale |

### Page « Soutenir »

| Clé | Français | Italiano |
|---|---|---|
| `titre` | Soutenir | Sostieni |
| `description` | Soutenir La Livrée d'Hermès à prix libre : le site et tout son contenu restent entièrement gratuits. | Sostieni La Livrée d'Hermès a un prezzo a tua scelta: il sito e tutti i suoi contenuti restano interamente liberi. |
| `intro` | Tout est libre. Le traité, les motifs et les fichiers produits par les outils se téléchargent sans condition, sous licence CC BY-NC 4.0. Votre soutien, à prix libre, finance la suite du projet : de nouveaux motifs, de nouveaux outils, le volet textile. | Tutto è libero. Il trattato, i motivi e i file prodotti dagli strumenti si scaricano senza condizioni, con licenza CC BY-NC 4.0. Il tuo sostegno, a prezzo libero, finanzia il seguito: nuovi motivi, nuovi strumenti, la parte tessile. |
| `bouton` | Aller à la page française pour payer | Vai alla pagina francese per pagare |
| `note` | Le paiement est sécurisé par Stripe. Montant libre, don facultatif. | Il pagamento è protetto da Stripe. Importo libero, donazione facoltativa. La pagina di pagamento è in francese. |
| `h2` | Ce que finance votre soutien | Che cosa finanzia il tuo sostegno |
| `b` | Le temps de recherche, de développement et de traduction | Il tempo di ricerca, sviluppo e traduzione |
| `p` | La construction des motifs, des outils du site et leur documentation en quatre langues. | La costruzione dei motivi, degli strumenti del sito e la loro documentazione in più lingue. |
