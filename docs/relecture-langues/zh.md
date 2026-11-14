# Relecture — « Voir sa musique » en 简体中文

Généré par `node scripts/build-musique-textes.mjs` depuis `data/musique-chladni/traductions/<langue>.json` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. À relire par un locuteur natif.

Page concernée : « Voir sa musique » (`musique-chladni.html` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir `TODO-RELECTURE.md`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.

## 简体中文 (`zh`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | 简体中文 |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | 看见你的音乐——La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | 看见你的音乐：选择一首曲子、一个文件或麦克风，观看声音描绘出的 Chladni 图形，以及与之最相似的 La Livrée d'Hermès 图案。可随声音录制 15 秒。 |
| `ariane` | Voir sa musique | 看见你的音乐 |
| `h1` | Voir sa musique | 看见你的音乐 |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | 每一段音乐都有自己的特征：它的能量在各个频率上的分布方式。选择一首曲子、一个文件或麦克风：本页在方形板每个振动模式圆环所对应的频率上测量这份能量，然后在 La Livrée d'Hermès 的统一图案中，找出频谱与之最相似的那一个。这一选择依据的是两个频谱的相似程度，而不是某种音乐法则：图案并不“表达”一首曲子。 |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | 任何内容都不会离开您的浏览器：文件、麦克风和捕获的音频都在本地分析，不会发送到任何地方。 |
| `flash` | Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit. | 注意：画面可能快速变化并闪烁。“减少快速变化”选项可使其放慢。 |
| `sonTitre` | Le son | 声音 |
| `sonChoix` | Son | 声音 |
| `morceau` | Morceau fourni {n} — {note} | 内置曲目 {n}——{note} |
| `notes.j1` | do dièse | 升C |
| `notes.j2` | la | A |
| `notes.j3` | ré | D |
| `notes.j4` | mi | E |
| `notes.j5` | sol | G |
| `notes.j6` | si | B |
| `notes.j7` | do | C |
| `tonalites.do dièse mineur` | do dièse mineur | 升C小调 |
| `tonalites.la mineur` | la mineur | A小调 |
| `tonalites.ré mineur` | ré mineur | D小调 |
| `tonalites.mi mineur` | mi mineur | E小调 |
| `tonalites.sol mineur` | sol mineur | G小调 |
| `tonalites.si mineur` | si mineur | B小调 |
| `tonalites.do mineur` | do mineur | C小调 |
| `sourceFichier` | Mon fichier audio… | 我的音频文件… |
| `sourceMicro` | Microphone | 麦克风 |
| `sourceEssai` | Musique d'essai | 试听音乐 |
| `sourceOnglet` | Audio d'un onglet | 标签页音频 |
| `lecture` | Lecture | 播放 |
| `pause` | Pause | 暂停 |
| `arreter` | Arrêter | 停止 |
| `entree` | Entrée audio | 音频输入 |
| `entreeDefaut` | Entrée par défaut | 默认输入 |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | 调音台、声卡：接好设备，允许使用麦克风，然后在此选择。 |
| `sensibilite` | Seuil des attaques | 起音阈值 |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | 以高于平均值的标准差数表示：越低，对音符变化越敏感。 |
| `intervalle` | Intervalle minimal entre deux attaques (s) | 两次起音之间的最短间隔（秒） |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | 默认 0.45 秒：每分钟最多约 133 次起音。节奏较快时请调低。 |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | 内置曲目由人工智能协助创作（“Musique composée avec l'IA par MC Claude.”，即“由 MC Claude 借助人工智能创作的音乐。”）。 |
| `etatDepart` | Appuyez sur Lecture. Les morceaux fournis sont composés avec l'aide de l'IA. | 请点击“播放”。内置曲目由人工智能协助创作。 |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | 内置曲目，由人工智能协助创作。 |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | 文件：{nom}（保留在您的浏览器中）。 |
| `etatMicro` | Micro actif. | 麦克风已开启。 |
| `etatEntree` | Entrée « {nom} » active. | 输入“{nom}”已启用。 |
| `etatOnglet` | Audio d'un onglet actif. | 标签页音频已启用。 |
| `etatEssai` | Musique d'essai. | 试听音乐。 |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau. | 麦克风被拒绝。请在网站设置中允许使用（地址栏左侧的锁形图标），然后再次点击“播放”。您也可以选择一个文件或一首内置曲目。 |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | 此设备上没有可用的麦克风。 |
| `erreurMicro` | Le micro ne démarre pas : {message} | 麦克风无法启动：{message} |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | 此处无法捕获标签页音频。需要较新的桌面浏览器（Chrome、Edge）；手机和 Safari 不支持。 |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | 所选标签页没有提供声音。请重新开始，并勾选“共享标签页音频”。 |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | 无法将此文件作为声音读取。 |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | 声音无法启动：{message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | 页面数据无法加载：{message} |
| `bandeManque` | la bande {id} manque à la collection de fonds | 背景集合中缺少条带 {id} |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | 音源已停止（设备被拔出或授权被撤销）。 |
| `silence` | Silence : lancez un son. | 静音：请先播放声音。 |
| `valide` | Validé | 已确认 |
| `valideTag` | en cours | 当前 |
| `essai` | Essai | 试用 |
| `essaiTag` | aperçu | 预览 |
| `validerEssai` | Valider l'essai | 确认试用 |
| `annuler` | Annuler | 取消 |
| `pleinEcran` | Plein écran | 全屏 |
| `quitterPleinEcran` | Quitter le plein écran | 退出全屏 |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | 深色背景：已确认。金色边框：试用中。将鼠标移到某个选项上，可在试用窗口中预览；点击即保留，然后点“确认试用”。 |
| `fenetreValide` | Fenêtre validée | 已确认的窗口 |
| `fenetreEssai` | Fenêtre d'essai | 试用窗口 |
| `basculeValide` | Validé | 已确认 |
| `basculeEssai` | Essai | 试用 |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | 此浏览器不支持全屏。 |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | 此浏览器不为该元素提供原生全屏：画面将铺满窗口。按 Esc 或点击按钮可关闭。 |
| `groupes.mode` | Pilotage du son | 声音驱动方式 |
| `groupes.fmt` | Format (ordre) | 格式（阶） |
| `groupes.col` | Collection | 图案集 |
| `groupes.view` | Vue | 视图 |
| `groupes.fond` | Variante de case | 格的变体 |
| `groupes.pal` | Couleurs | 颜色 |
| `modes.image.0` | Le son définit l'image | 声音决定画面 |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | 每一刻都选出频谱与音乐最相似的图案。 |
| `modes.rythme.0` | Le son définit le rythme | 声音决定节奏 |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | 每出现一次音符起音，就沿邻近链前进一步。 |
| `modes.chemin.0` | Le son guide le chemin | 声音引导路径 |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | 节奏决定何时，频谱决定走向哪个邻居。 |
| `modes.octaves.0` | Le son suit l'octave | 声音跟随八度 |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | 每次起音沿主导音符的轨道前进一步：圆环 K，然后是其八度 4K，再然后是 16K……（只要这些圆环存在）。 |
| `vues.signes.0` | Signes | 符号 |
| `vues.signes.1` | Les zones positives de la figure du motif. | 图案图形的正值区域。 |
| `vues.lignes.0` | Lignes nodales | 节线 |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | 图案图形取值为零的线。 |
| `vues.pavage.0` | Cellules | 单元 |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | 图案本身，按 2 × 2 铺排。 |
| `format.titre` | Ordre {n} | {n} 阶 |
| `format.detail` | Grille de {g} × {g} cases | {g} × {g} 格的网格 |
| `format.bientot` | Ordre {n} (seconde livraison) | {n} 阶（第二批） |
| `chargementOrdre` | Chargement de l'ordre {n}… | 正在加载 {n} 阶…… |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | {n} 阶的数据无法加载：{message} |
| `collections.tri.0` | Tricolore — motifs unifiés | 三色——统一图案 |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} 个图案（互不相同的 12 × 12 网格） |
| `collections.bi.0` | Bicolore — motifs unifiés | 双色——统一图案 |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} 个图案（两面镜像，可按 10 月 3 日的规则读取） |
| `collections.ce.0` | Bicolore — symétrie centrale | 双色——中心对称 |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} 个图案（仅 180° 中心对称，可按 10 月 3 日的规则读取） |
| `collections.b1971128.0` | Bloc 1971128 | 区块 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} 个图案 |
| `collections.b16012838.0` | Bloc 16012838 | 区块 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} 个图案 |
| `collections.b3016090.0` | Bloc 3016090 | 区块 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} 个图案 |
| `collections.f613.0` | Famille 613 | 族 613 |
| `collections.f613.1` | {n} motifs | {n} 个图案 |
| `collections.f18.0` | Famille 18 | 族 18 |
| `collections.f18.1` | {n} motifs | {n} 个图案 |
| `collections.fpilote.0` | Famille pilote | 先导族 |
| `collections.fpilote.1` | {n} motifs | {n} 个图案 |
| `collections.p18.0` | Croix 1·2 | 十字 1·2 |
| `collections.p18.1` | {n} motifs | {n} 个图案 |
| `collections.p30.0` | Croix 1·2 | 十字 1·2 |
| `collections.p30.1` | {n} motifs | {n} 个图案 |
| `fond` | Bandes {id} | 条带 {id} |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec l'état 1 du fond, ou avec l'état 0 : le même fond tourné de 90°. | 每个格含四个三角形；每个三角形用背景的状态 1 或状态 0 绘制：状态 0 即同一背景旋转 90°。 |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | 格的变体仅适用于双色图案集。 |
| `palettes.creme.0` | Encre et crème | 墨色与奶油色 |
| `palettes.creme.1` | Les couleurs du site. | 本站的配色。 |
| `palettes.monochrome.0` | Gris et blanc | 灰与白 |
| `palettes.monochrome.1` | Le monochrome du site. | 本站的单色配色。 |
| `palettes.perso.0` | Mes couleurs | 我的颜色 |
| `palettes.perso.1` | Choisissez le motif et le fond. | 自选图案色与背景色。 |
| `palettes.son.0` | La teinte suit le son | 色调随声音变化 |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | 色调随声音的明亮度缓慢滑动（默认关闭）。 |
| `persoMotif` | Motif | 图案 |
| `persoFond` | Fond | 背景 |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | 三色模式下：V 最深（墨色），O 中灰，M 最浅（奶油色）。 |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | 实时设置 |
| `lissage` | Lissage | 平滑 |
| `pulsationTitre` | Pulsation | 脉动 |
| `pulsations.attaque` | À chaque attaque | 每次起音 |
| `pulsations.temps` | À chaque temps | 每一拍 |
| `pulsations.quatre` | Toutes les 4 pulsations | 每 4 拍 |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | 默认每次起音都变化一次。检测到规律的脉动时，可改为每一拍或每 4 拍变化一次。 |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | 检测到脉动：每分钟 {bpm} 拍。 |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | 目前尚未检测到规律的脉动。 |
| `calme` | Réduire les changements rapides | 减少快速变化 |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | 渐变更长、停留更久。如果您的系统要求减少动画，则默认开启。 |
| `pente` | Compenser la pente des graves | 补偿低频的衰减斜率 |
| `pauseImage` | Pause de l'image | 暂停画面 |
| `optionsTitre` | Options | 选项 |
| `comprendreTitre` | Pour comprendre | 帮助理解 |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | 两个教学视图，与声音无关。 |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | (4, 0) 模式及其简并对 |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | 在方形板上，(4, 0) 与 (0, 4) 两个模式频率相同：二者的任意组合同样是该频率的模式。滑块从 cos(4πx/a) + cos(4πy/a)（右侧）变到 cos(4πx/a) − cos(4πy/a)（左侧）；在中间只剩 cos(4πx/a)，即竖直线。明暗区域：符号相反；线条：节线。 |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | 混合 s：cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | (4, 0) 模式与其简并对混合后的图形 |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | 奇偶性作为两个 ±1 网格的叠加 |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | 每个网格都是一张棋盘：格 (i, j) 的奇偶性 (−1)^(i + j)。二者的乘积在两者一致处为 +1，不一致处为 −1：这就是比特的同或（XNOR），如同两片正交的偏振片。将其中一个稍作平移或旋转，就会出现莫尔条纹。 |
| `moireAngle` | Rotation du second réseau (degrés) | 第二个网格的旋转角（度） |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | 第二个网格的周期（占第一个的百分比） |
| `moireA` | Réseau A | 网格 A |
| `moireB` | Réseau B | 网格 B |
| `moireProduit` | Produit A × B (XNOR) | 乘积 A × B（XNOR） |
| `moireAlt` | Produit de deux réseaux de ±1 | 两个 ±1 网格的乘积 |
| `clesTitre` | Lecture en clés | 按密钥读取 |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | 仅作显示：轴记号的密钥（72 个去重密钥，奇偶性自角格起算，秩为 70），其和可还原所选图案的图形（若存在）。本页不断言密钥与频率之间存在任何联系。 |
| `clesNatures.D+` | diagonale x + y | 对角线 x + y |
| `clesNatures.D-` | diagonale y − x | 对角线 y − x |
| `clesNatures.H` | horizontale | 水平线 |
| `clesNatures.V` | verticale | 垂直线 |
| `clesFigure.figure` | Figure du motif | 图案图形 |
| `clesFigure.V` | Classe V (violet) | V 类（紫） |
| `clesFigure.O` | Classe O (orange) | O 类（橙） |
| `clesFigure.M` | Classe M (magenta) | M 类（品红） |
| `clesActives` | {n} clés actives : {liste} | {n} 个启用的密钥：{liste} |
| `clesAucune` | aucune clé (figure vide) | 无密钥（空图形） |
| `clesComplement` |  (au complément près) | （至多相差一个补集） |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | 此图形不是密钥之和：它落在密钥所生成的空间之外。 |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | 第 {i} 个图案，共 {n} 个，图案集 {collection}。 |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | 按密钥读取仅适用于 12 阶。 |
| `loiTitre` | Loi de fréquence des cercles | 圆环的频率定律 |
| `loiChoix.racine` | Échelle compressée pour l'oreille | 为听觉压缩的标度 |
| `loiChoix.plaque` | Loi de la plaque réelle | 真实板的定律 |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | 压缩标度：f = 参考频率 × √K / 2（初始设置）。板的定律：f = c × K，与真实的板相同（3 毫米铝板，48 厘米：c = 31.85 Hz）。在 12 阶，范围为 32 至 2 293 Hz；高于奈奎斯特频率 0.9 倍的圆环与以前一样被忽略。起音检测器和色调跟踪保持不变。 |
| `loiC` | c (Hz par unité de m² + n²) | c（每单位 m² + n² 的赫兹数） |
| `figureTitre` | Figure (vues Signes et Lignes) | 图形（符号视图与线条视图） |
| `figureChoix.motif` | Du motif retenu | 所选图案的 |
| `figureChoix.son` | Du son | 声音的 |
| `figureChoix.ecart` | Les deux (écart) | 两者（差异） |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | 所选图案的：所选图案的 Chladni 图形（初始设置）。声音的：各圆环的波之和，按声音在其中投入的能量加权，不经过任何图案。两者：这两个图形不同的位置。声音不提供相位：相位一律设为零。 |
| `sceneTitre` | La scène | 舞台 |
| `projection` | Ouvrir une fenêtre de projection | 打开投影窗口 |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | 全屏始终启动已确认的窗口，而不是试用窗口；控件和光标会在 3 秒后隐藏。按 Esc 返回。投影窗口是独立的：可拖到第二块屏幕或投影仪上。 |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | 投影窗口被浏览器拦截。请允许本站的弹出窗口，然后重试。 |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | 浏览器允许时，播放期间屏幕保持常亮。 |
| `enregTitre` | Enregistrer | 录制 |
| `enreg` | Enregistrer 15 s | 录制 15 秒 |
| `enregEnCours` | Enregistrement : {s} s | 录制中：{s} 秒 |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16（Reels、Shorts、TikTok） |
| `format45` | 4:5 (publication) | 4:5（发布） |
| `format11` | 1:1 (carré) | 1:1（方形） |
| `formatVideo` | Format de la vidéo | 视频格式 |
| `signature` | Bandeau « {texte} » en bas de la vidéo | 视频底部的“{texte}”横幅 |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | 视频已录制：下载已开始。 |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | 您的浏览器不能写出 MP4：视频为 WebM 格式。若要转为 MP4（Instagram、TikTok），请使用转换器或 ffmpeg：ffmpeg -i 文件.webm 文件.mp4。 |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | MP4 中的 AAC 音频：各处均可播放（iPhone、QuickTime、发布类应用）。 |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | 此浏览器以 Opus 写入 MP4 的音频：在 iPhone、QuickTime 或某些发布类应用中可能无法播放（较新的桌面版 Chrome：AAC）。 |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | Opus 音频：在 iPhone、QuickTime 或某些发布类应用中可能无法播放。如需 AAC 音轨：ffmpeg -i 文件.mp4 -c:v copy -c:a aac 输出.mp4。 |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | 此浏览器不支持视频录制。 |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | 请先播放声音：静音不会被录制。 |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | 录制无法开始：{message} |
| `raccourcisTitre` | Raccourcis clavier | 键盘快捷键 |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | 试用视图：符号、节线、单元 |
| `raccourcis.1.0` | Espace | 空格键 |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | 下一种驱动方式（试用） |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | 暂停画面 |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | 确认试用 |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | 全屏（已确认的窗口） |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | 录制 15 秒 |
| `infoMotif` | Motif {i} sur {n} | 第 {i} 个图案，共 {n} 个 |
| `infoImages` | {fps} images/s | {fps} 帧/秒 |
| `infoResolution` | résolution réduite | 已降低分辨率 |
| `semaineTitre` | La semaine | 本周 |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | 由 MC Claude 借助人工智能创作的音乐。 |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | 点击海报会加载 YouTube 或 TikTok 的播放器：这是第三方服务，届时会收到您的访问信息。在此之前不会加载任何内容。 |
| `jourTitre` | Jour {n} — {tonalite} | 第 {n} 天——{tonalite} |
| `datePub` | Publié le {date} | 发布于 {date} |
| `bientot` | Bientôt | 即将推出 |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | 播放第 {n} 天的视频，{tonalite} |
| `lireTiktok` | Lire ici (TikTok) | 在此播放（TikTok） |
| `voirYoutube` | Voir sur YouTube | 在 YouTube 观看 |
| `voirTiktok` | Voir sur TikTok | 在 TikTok 观看 |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | 第 {n} 天的海报——{tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | 第 {n} 天的视频 |
| `voirAussiTitre` | Voir aussi | 另请参阅 |
| `voirAussi.0.href` | /galerie-bicolore.html | /galerie-bicolore.html |
| `voirAussi.0.titre` | Galerie bicolore | 双色图库 |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | 由轴生成、能在立方体上闭合的双色图案：读取粒度、铺排、导出。（法文页面） |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /galerie-patterns-unifies.html |
| `voirAussi.1.titre` | Galerie tricolore | 三色图库 |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | 由色调混合生成的统一图案：选中一个图案即可查看其铺排效果。（法文页面） |
| `voirAussi.2.href` | /fonds-ecran.html | /fonds-ecran.html |
| `voirAussi.2.titre` | Fonds d'écran | 壁纸 |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | 全屏织物壁纸，可随声音变化，也可切换为冥想模式。（法文页面） |
| `voirAussi.3.href` | /galerie-animations.html | /zh/animations/ |
| `voirAussi.3.titre` | Galerie d'animations | 动画图库 |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | 各个背景集合的动画，可观看，也可下载为 MP4。 |
| `voirAussi.4.href` | /chladni.html | /chladni.html |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | 图形、音阶与频率：把图案的词汇与板的振动模式联系起来的页面。（法文页面） |
| `voirAussi.5.href` | /fr/livre/ | /zh/book/ |
| `voirAussi.5.titre` | Le livre | 本书 |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès 在线阅读，逐页呈现，并附免费 PDF。 |

### Voir sa musique — métadonnées de la page

| Clé | Français | 简体中文 |
|---|---|---|
| `titre, h1` | Voir sa musique — La Livrée d'Hermès | 看见你的音乐——La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | 看见你的音乐：声音描绘出的 Chladni 图形，以及与之最相似的 La Livrée d'Hermès 图案。可随声音录制 15 秒。 |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | 看见你的音乐：声音描绘出的 Chladni 图形，以及与之最相似的 La Livrée d'Hermès 图案。 |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | 简体中文 |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | 三个声音页面 |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | 音流学 · 声音创造形状 |
| `trois-portes.musique` | Voir sa musique · Le son guide | 看见你的音乐 · 声音引路 |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | 壁纸 · 声音隐去 |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | 简体中文 |
|---|---|---|
| `label` | Voir sa musique | 看见你的音乐 |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | 选择一首曲子、一个文件或麦克风：本页会找出频谱与声音最接近的 La Livrée d’Hermès 图案。 |
