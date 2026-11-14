# Relecture — « Voir sa musique » en Português (Portugal)

Généré par `node scripts/build-musique-textes.mjs` depuis `data/musique-chladni/traductions/<langue>.json` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. À relire par un locuteur natif.

Page concernée : « Voir sa musique » (`musique-chladni.html` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir `TODO-RELECTURE.md`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.

## Português (Portugal) (`pt`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | Português (Portugal) |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | Ver a sua música — La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Ver a sua música: escolha uma peça, um ficheiro ou o microfone e veja a figura de Chladni que o som desenha e, depois, o padrão de La Livrée d'Hermès que mais se lhe assemelha. Grave 15 segundos com o som. |
| `ariane` | Voir sa musique | Ver a sua música |
| `h1` | Voir sa musique | Ver a sua música |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | Cada música tem uma assinatura: a forma como a sua energia se reparte pelas frequências. Escolha uma peça, um ficheiro ou o microfone: a página mede essa energia nas frequências de cada círculo de modos de uma placa quadrada e procura, entre os padrões unificados de La Livrée d'Hermès, aquele cujo espetro mais se lhe assemelha. A escolha assenta na semelhança de dois espetros, não numa lei musical: um padrão não «exprime» uma peça. |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | Nada sai do seu navegador: o ficheiro, o microfone e o áudio captado são analisados no próprio aparelho e não são enviados para parte nenhuma. |
| `flash` | Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit. | Atenção: as imagens podem mudar depressa e piscar. A opção «reduzir as mudanças rápidas» abranda-as. |
| `sonTitre` | Le son | O som |
| `sonChoix` | Son | Som |
| `morceau` | Morceau fourni {n} — {note} | Peça fornecida {n} — {note} |
| `notes.j1` | do dièse | dó sustenido |
| `notes.j2` | la | lá |
| `notes.j3` | ré | ré |
| `notes.j4` | mi | mi |
| `notes.j5` | sol | sol |
| `notes.j6` | si | si |
| `notes.j7` | do | dó |
| `tonalites.do dièse mineur` | do dièse mineur | dó sustenido menor |
| `tonalites.la mineur` | la mineur | lá menor |
| `tonalites.ré mineur` | ré mineur | ré menor |
| `tonalites.mi mineur` | mi mineur | mi menor |
| `tonalites.sol mineur` | sol mineur | sol menor |
| `tonalites.si mineur` | si mineur | si menor |
| `tonalites.do mineur` | do mineur | dó menor |
| `sourceFichier` | Mon fichier audio… | O meu ficheiro de áudio… |
| `sourceMicro` | Microphone | Microfone |
| `sourceEssai` | Musique d'essai | Música de teste |
| `sourceOnglet` | Audio d'un onglet | Áudio de um separador |
| `lecture` | Lecture | Reproduzir |
| `pause` | Pause | Pausa |
| `arreter` | Arrêter | Parar |
| `entree` | Entrée audio | Entrada de áudio |
| `entreeDefaut` | Entrée par défaut | Entrada predefinida |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | Mesa de mistura, placa de som: ligue-a, autorize o microfone e escolha-a aqui. |
| `sensibilite` | Seuil des attaques | Limiar dos ataques |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | Em desvios-padrão acima da média: mais baixo, mais sensível às mudanças de nota. |
| `intervalle` | Intervalle minimal entre deux attaques (s) | Intervalo mínimo entre dois ataques (s) |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | 0,45 s por predefinição: no máximo cerca de 133 ataques por minuto. Baixe-o para um andamento rápido. |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | As peças fornecidas são compostas com a ajuda da IA («Música composta com IA por MC Claude.»). |
| `etatDepart` | Appuyez sur Lecture. Les morceaux fournis sont composés avec l'aide de l'IA. | Prima Reproduzir. As peças fornecidas são compostas com a ajuda da IA. |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | Peça fornecida, composta com a ajuda da IA. |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | Ficheiro: {nom} (fica no seu navegador). |
| `etatMicro` | Micro actif. | Microfone ativo. |
| `etatEntree` | Entrée « {nom} » active. | Entrada «{nom}» ativa. |
| `etatOnglet` | Audio d'un onglet actif. | Áudio de um separador ativo. |
| `etatEssai` | Musique d'essai. | Música de teste. |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau. | O microfone está bloqueado. Autorize-o nas definições do site (o cadeado, à esquerda do endereço) e clique de novo em Reproduzir. Pode também escolher um ficheiro ou uma peça. |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | Não há nenhum microfone disponível neste aparelho. |
| `erreurMicro` | Le micro ne démarre pas : {message} | O microfone não arranca: {message} |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | A captação do áudio de um separador não é possível aqui. Exige um navegador de computador recente (Chrome, Edge); não existe em telemóvel nem no Safari. |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | O separador escolhido não forneceu som. Recomece e marque «Partilhar o áudio do separador». |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | Este ficheiro não pode ser lido como um som. |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | O som não consegue arrancar: {message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | Os dados da página não carregam: {message} |
| `bandeManque` | la bande {id} manque à la collection de fonds | falta a banda {id} na coleção de fundos |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | A fonte parou (dispositivo desligado ou autorização retirada). |
| `silence` | Silence : lancez un son. | Silêncio: inicie um som. |
| `valide` | Validé | Validada |
| `valideTag` | en cours | em curso |
| `essai` | Essai | Ensaio |
| `essaiTag` | aperçu | pré-visualização |
| `validerEssai` | Valider l'essai | Validar o ensaio |
| `annuler` | Annuler | Cancelar |
| `pleinEcran` | Plein écran | Ecrã inteiro |
| `quitterPleinEcran` | Quitter le plein écran | Sair do ecrã inteiro |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | Fundo escuro: validada. Moldura dourada: em ensaio. Passe o cursor por cima de uma opção para a ver no ensaio, clique para a manter e depois «Validar o ensaio». |
| `fenetreValide` | Fenêtre validée | Janela validada |
| `fenetreEssai` | Fenêtre d'essai | Janela de ensaio |
| `basculeValide` | Validé | Validada |
| `basculeEssai` | Essai | Ensaio |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | O ecrã inteiro não está disponível neste navegador. |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | Este navegador não oferece ecrã inteiro nativo para este elemento: a cena cobre a janela. Esc ou o botão fecha-a. |
| `groupes.mode` | Pilotage du son | Controlo do som |
| `groupes.fmt` | Format (ordre) | Formato (ordem) |
| `groupes.col` | Collection | Coleção |
| `groupes.view` | Vue | Vista |
| `groupes.fond` | Variante de case | Variante de casa |
| `groupes.pal` | Couleurs | Cores |
| `modes.image.0` | Le son définit l'image | O som define a imagem |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | A cada instante, o padrão cujo espetro mais se assemelha ao da música. |
| `modes.rythme.0` | Le son définit le rythme | O som define o ritmo |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | Um passo na cadeia de proximidade a cada ataque de nota. |
| `modes.chemin.0` | Le son guide le chemin | O som guia o caminho |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | O ritmo decide quando, o espetro decide para que vizinho. |
| `modes.octaves.0` | Le son suit l'octave | O som segue a oitava |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | A cada ataque, um passo na órbita da nota dominante: o círculo K, depois a sua oitava 4K, depois 16K…, quando esses círculos existem. |
| `vues.signes.0` | Signes | Sinais |
| `vues.signes.1` | Les zones positives de la figure du motif. | As zonas positivas da figura do padrão. |
| `vues.lignes.0` | Lignes nodales | Linhas nodais |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | As linhas onde a figura do padrão se anula. |
| `vues.pavage.0` | Cellules | Células |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | O próprio padrão, em pavimentação 2 × 2. |
| `format.titre` | Ordre {n} | Ordem {n} |
| `format.detail` | Grille de {g} × {g} cases | Grelha de {g} × {g} casas |
| `format.bientot` | Ordre {n} (seconde livraison) | Ordem {n} (segunda entrega) |
| `chargementOrdre` | Chargement de l'ordre {n}… | A carregar a ordem {n}… |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | Os dados da ordem {n} não carregam: {message} |
| `collections.tri.0` | Tricolore — motifs unifiés | Tricolor — padrões unificados |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} padrões (grelhas 12 × 12 distintas) |
| `collections.bi.0` | Bicolore — motifs unifiés | Bicolor — padrões unificados |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} padrões (dois espelhos, legíveis pela regra de 3 de outubro) |
| `collections.ce.0` | Bicolore — symétrie centrale | Bicolor — simetria central |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} padrões (apenas simetria central de 180°, legíveis pela regra de 3 de outubro) |
| `collections.b1971128.0` | Bloc 1971128 | Bloco 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} padrões |
| `collections.b16012838.0` | Bloc 16012838 | Bloco 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} padrões |
| `collections.b3016090.0` | Bloc 3016090 | Bloco 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} padrões |
| `collections.f613.0` | Famille 613 | Família 613 |
| `collections.f613.1` | {n} motifs | {n} padrões |
| `collections.f18.0` | Famille 18 | Família 18 |
| `collections.f18.1` | {n} motifs | {n} padrões |
| `collections.fpilote.0` | Famille pilote | Família piloto |
| `collections.fpilote.1` | {n} motifs | {n} padrões |
| `collections.p18.0` | Croix 1·2 | Cruz 1·2 |
| `collections.p18.1` | {n} motifs | {n} padrões |
| `collections.p30.0` | Croix 1·2 | Cruz 1·2 |
| `collections.p30.1` | {n} motifs | {n} padrões |
| `fond` | Bandes {id} | Bandas {id} |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec l'état 1 du fond, ou avec l'état 0 : le même fond tourné de 90°. | Uma casa leva quatro triângulos; cada um é desenhado com o estado 1 do fundo ou com o estado 0: o mesmo fundo rodado 90°. |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | A variante de casa só se aplica à coleção bicolor. |
| `palettes.creme.0` | Encre et crème | Tinta e creme |
| `palettes.creme.1` | Les couleurs du site. | As cores do site. |
| `palettes.monochrome.0` | Gris et blanc | Cinzento e branco |
| `palettes.monochrome.1` | Le monochrome du site. | O monocromático do site. |
| `palettes.perso.0` | Mes couleurs | As minhas cores |
| `palettes.perso.1` | Choisissez le motif et le fond. | Escolha o padrão e o fundo. |
| `palettes.son.0` | La teinte suit le son | O tom segue o som |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | O tom desliza lentamente com o brilho do som (desativado por predefinição). |
| `persoMotif` | Motif | Padrão |
| `persoFond` | Fond | Fundo |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | Em tricolor: V o mais escuro (tinta), O cinzento médio, M o mais claro (creme). |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | Definições em direto |
| `lissage` | Lissage | Suavização |
| `pulsationTitre` | Pulsation | Pulsação |
| `pulsations.attaque` | À chaque attaque | A cada ataque |
| `pulsations.temps` | À chaque temps | A cada tempo |
| `pulsations.quatre` | Toutes les 4 pulsations | A cada 4 pulsações |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | Por predefinição, uma mudança a cada ataque. Quando é detetada uma pulsação regular, pode mudar a cada tempo ou a cada 4 pulsações. |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | Pulsação detetada: {bpm} por minuto. |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | Nenhuma pulsação regular detetada por agora. |
| `calme` | Réduire les changements rapides | Reduzir as mudanças rápidas |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | Uma transição mais longa e uma permanência maior. Ativado por omissão se o seu sistema pedir menos animações. |
| `pente` | Compenser la pente des graves | Compensar a inclinação dos graves |
| `pauseImage` | Pause de l'image | Pausa da imagem |
| `optionsTitre` | Options | Opções |
| `comprendreTitre` | Pour comprendre | Para compreender |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | Duas vistas pedagógicas, sem relação com o som. |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | O modo (4, 0) e o seu par degenerado |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | Numa placa quadrada, os modos (4, 0) e (0, 4) têm a mesma frequência: qualquer combinação é também um modo dessa frequência. O cursor passa de cos(4πx/a) + cos(4πy/a) (à direita) a cos(4πx/a) − cos(4πy/a) (à esquerda); ao meio só resta cos(4πx/a), linhas verticais. Zonas claras e escuras: sinais opostos; traço: linha nodal. |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | Mistura s: cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | Figura do modo (4, 0) misturado com o seu par degenerado |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | A paridade como sobreposição de duas redes de ±1 |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | Cada rede é um tabuleiro: a paridade (−1)^(i + j) da casa (i, j). O seu produto vale +1 onde as duas concordam e −1 onde diferem: é o XNOR dos bits, como dois polarizadores cruzados. Deslocando ou rodando um pouco uma das duas, surge um moiré. |
| `moireAngle` | Rotation du second réseau (degrés) | Rotação da segunda rede (graus) |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | Período da segunda rede (em % do da primeira) |
| `moireA` | Réseau A | Rede A |
| `moireB` | Réseau B | Rede B |
| `moireProduit` | Produit A × B (XNOR) | Produto A × B (XNOR) |
| `moireAlt` | Produit de deux réseaux de ±1 | Produto de duas redes de ±1 |
| `clesTitre` | Lecture en clés | Leitura em chaves |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | Apenas visualização: as chaves da nota dos eixos (72 chaves sem duplicados, paridade contada a partir da casa de canto, característica 70) cuja soma devolve a figura do padrão escolhido, quando existe. A página não afirma nenhuma ligação entre uma chave e uma frequência. |
| `clesNatures.D+` | diagonale x + y | diagonal x + y |
| `clesNatures.D-` | diagonale y − x | diagonal y − x |
| `clesNatures.H` | horizontale | horizontal |
| `clesNatures.V` | verticale | vertical |
| `clesFigure.figure` | Figure du motif | Figura do padrão |
| `clesFigure.V` | Classe V (violet) | Classe V (violeta) |
| `clesFigure.O` | Classe O (orange) | Classe O (laranja) |
| `clesFigure.M` | Classe M (magenta) | Classe M (magenta) |
| `clesActives` | {n} clés actives : {liste} | {n} chaves ativas: {liste} |
| `clesAucune` | aucune clé (figure vide) | nenhuma chave (figura vazia) |
| `clesComplement` |  (au complément près) |  (a menos do complemento) |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | Esta figura não é uma soma de chaves: sai do espaço que elas geram. |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | Padrão {i} de {n}, coleção {collection}. |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | A leitura em chaves só diz respeito à ordem 12. |
| `loiTitre` | Loi de fréquence des cercles | Lei de frequência dos círculos |
| `loiChoix.racine` | Échelle compressée pour l'oreille | Escala comprimida para o ouvido |
| `loiChoix.plaque` | Loi de la plaque réelle | Lei da placa real |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | Escala comprimida: f = frequência de referência × √K / 2 (definição inicial). Lei da placa: f = c × K, como uma placa real (alumínio de 3 mm, 48 cm: c = 31,85 Hz). Na ordem 12, de 32 a 2 293 Hz; os círculos acima de 0,9 × a frequência de Nyquist são ignorados, como antes. O detetor de ataques e o seguimento do tom não mudam. |
| `loiC` | c (Hz par unité de m² + n²) | c (Hz por unidade de m² + n²) |
| `figureTitre` | Figure (vues Signes et Lignes) | Figura (vistas Sinais e Linhas) |
| `figureChoix.motif` | Du motif retenu | Do padrão escolhido |
| `figureChoix.son` | Du son | Do som |
| `figureChoix.ecart` | Les deux (écart) | As duas (diferença) |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | Do padrão escolhido: a figura de Chladni do padrão escolhido (definição inicial). Do som: a soma das ondas de cada círculo, ponderadas pela energia que o som lá coloca, sem passar por um padrão. As duas: os locais onde estas duas figuras diferem. O som não fornece as fases: são postas a zero. |
| `sceneTitre` | La scène | A cena |
| `projection` | Ouvrir une fenêtre de projection | Abrir uma janela de projeção |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | O ecrã inteiro lança sempre a janela validada, nunca o ensaio; os controlos e o cursor ocultam-se ao fim de 3 segundos. Esc para voltar. A janela de projeção é separada: arraste-a para um segundo ecrã ou um projetor. |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | A janela de projeção foi bloqueada pelo navegador. Autorize as janelas de pop-up para este site e tente de novo. |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | O ecrã mantém-se aceso durante a reprodução quando o navegador o permite. |
| `enregTitre` | Enregistrer | Gravar |
| `enreg` | Enregistrer 15 s | Gravar 15 s |
| `enregEnCours` | Enregistrement : {s} s | Gravação: {s} s |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16 (Reels, Shorts, TikTok) |
| `format45` | 4:5 (publication) | 4:5 (publicação) |
| `format11` | 1:1 (carré) | 1:1 (quadrado) |
| `formatVideo` | Format de la vidéo | Formato do vídeo |
| `signature` | Bandeau « {texte} » en bas de la vidéo | Faixa «{texte}» no fundo do vídeo |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | Vídeo gravado: a transferência começou. |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | O seu navegador não escreve MP4: o vídeo está em formato WebM. Para o converter em MP4 (Instagram, TikTok), passe-o por um conversor ou pelo ffmpeg: ffmpeg -i ficheiro.webm ficheiro.mp4. |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | Áudio AAC no MP4: lê-se em todo o lado (iPhone, QuickTime, aplicações de publicação). |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | Este navegador escreve o áudio do MP4 em Opus: pode não se ler no iPhone, no QuickTime ou em algumas aplicações de publicação (Chrome de computador recente: AAC). |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | Áudio Opus: pode não se ler no iPhone, no QuickTime ou em algumas aplicações de publicação. Para uma pista AAC: ffmpeg -i ficheiro.mp4 -c:v copy -c:a aac saida.mp4. |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | A gravação de vídeo não está disponível neste navegador. |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | Inicie primeiro um som: não se grava o silêncio. |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | A gravação não arranca: {message} |
| `raccourcisTitre` | Raccourcis clavier | Atalhos de teclado |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | Vista do ensaio: sinais, linhas nodais, células |
| `raccourcis.1.0` | Espace | Espaço |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | Modo de controlo seguinte (ensaio) |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | Pausa da imagem |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | Validar o ensaio |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | Ecrã inteiro (janela validada) |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | Gravar 15 s |
| `infoMotif` | Motif {i} sur {n} | Padrão {i} de {n} |
| `infoImages` | {fps} images/s | {fps} imagens/s |
| `infoResolution` | résolution réduite | resolução reduzida |
| `semaineTitre` | La semaine | A semana |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | Música composta com IA por MC Claude. |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | Um clique num cartaz carrega o leitor do YouTube ou do TikTok: um serviço de terceiros, que recebe então a sua visita. Nada é carregado antes. |
| `jourTitre` | Jour {n} — {tonalite} | Dia {n} — {tonalite} |
| `datePub` | Publié le {date} | Publicado em {date} |
| `bientot` | Bientôt | Em breve |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | Reproduzir o vídeo do dia {n}, {tonalite} |
| `lireTiktok` | Lire ici (TikTok) | Reproduzir aqui (TikTok) |
| `voirYoutube` | Voir sur YouTube | Ver no YouTube |
| `voirTiktok` | Voir sur TikTok | Ver no TikTok |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | Cartaz do dia {n} — {tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | Vídeo do dia {n} |
| `voirAussiTitre` | Voir aussi | Ver também |
| `voirAussi.0.href` | /galerie-bicolore.html | /galerie-bicolore.html |
| `voirAussi.0.titre` | Galerie bicolore | Galeria bicolor |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | Os padrões bicolores gerados pelos eixos, fechados sobre o cubo: grão, pavimentação, exportação. (Página em francês.) |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /galerie-patterns-unifies.html |
| `voirAussi.1.titre` | Galerie tricolore | Galeria tricolor |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | Os padrões unificados, gerados pela mistura de tons: escolha um padrão para ver a sua pavimentação. (Página em francês.) |
| `voirAussi.2.href` | /fonds-ecran.html | /fonds-ecran.html |
| `voirAussi.2.titre` | Fonds d'écran | Fundos de ecrã |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | Fundos têxteis em ecrã inteiro, reativos ao som ou em modo meditativo. (Página em francês.) |
| `voirAussi.3.href` | /galerie-animations.html | /pt/animations/ |
| `voirAussi.3.titre` | Galerie d'animations | Galeria de animações |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | As animações das coleções de fundos, para ver e descarregar em MP4. |
| `voirAussi.4.href` | /chladni.html | /chladni.html |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | Figuras, escalas e frequências: a página que liga o vocabulário dos padrões aos modos de uma placa. (Página em francês.) |
| `voirAussi.5.href` | /fr/livre/ | /pt/book/ |
| `voirAussi.5.titre` | Le livre | O livro |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès em linha, página a página, com o PDF gratuito. |

### Voir sa musique — métadonnées de la page

| Clé | Français | Português (Portugal) |
|---|---|---|
| `titre, h1` | Voir sa musique — La Livrée d'Hermès | Ver a sua música — La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Ver a sua música: a figura de Chladni que o som desenha e o padrão de La Livrée d'Hermès que mais se lhe assemelha. Grave 15 segundos com o som. |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | Ver a sua música: a figura de Chladni que o som desenha e o padrão de La Livrée d'Hermès que mais se lhe assemelha. |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | Português (Portugal) |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | As três páginas sonoras |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | Cimática · O som cria a forma |
| `trois-portes.musique` | Voir sa musique · Le son guide | Ver a sua música · O som guia |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | Fundos de ecrã · O som apaga-se |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | Português (Portugal) |
|---|---|---|
| `label` | Voir sa musique | Ver a sua música |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | Escolha uma peça, um ficheiro ou o microfone: a página procura o padrão de La Livrée d’Hermès cujo espetro mais se assemelha ao do som. |
