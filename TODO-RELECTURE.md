# À relire — chinois simplifié, russe et portugais

La règle d'Anibal : **une version avec des erreurs plutôt que rien.** Aucune page
n'a été retenue en attendant une relecture. Elles sont publiées, et voici, page
par page, ce dont on doute, pour qu'un relecteur natif sache où regarder.

Ce qui est garanti sans relecture, par des contrôles qui tournent en CI
(`.github/workflows/check-langues.yml`) :

- les termes du système ont **une seule** traduction par langue
  (`docs/terminologie-fr-en-es-th.md`, colonnes ZH et RU ;
  `tools/check_glossaire.mjs`). Un relecteur qui change un terme le change
  **dans le glossaire d'abord**, et ajoute l'ancien aux variantes refusées ;
- « La Livrée d'Hermès » et « Anibal Edelberto Amiot » ne sont ni traduits ni
  translittérés (une glose entre parenthèses peut suivre l'original) ;
- les DOI et les licences n'ont pas bougé (`tools/check_doi_licences.mjs`).

Où corriger : le lexique et la liste des travaux se corrigent dans les données
(`data/lexiques_traduits.json`, `data/travaux.json`) puis se régénèrent
(`node scripts/build-lexiques.js`, `node scripts/build-travaux.js`) ; la phrase
des langues dans `scripts/build-couverture.js` ; les pieds de page dans
`includes/footer-zh.html`, `includes/footer-ru.html` et `includes/footer-pt.html` ; les autres pages
directement dans `zh/`, `ru/` et `pt/`. Après toute correction chinoise, relancer
`python3 tools/police_zh.py` (la police est réduite aux caractères employés ;
`tools/check_police_zh.mjs` le rappelle en CI).

## Portugais (pt-PT, ajouté le 2026-10-04)

Portugais du Portugal (choix d'Anibal) : « ecrã », « descarregar »,
« ficheiro », « registo ». Pages : `pt/`, `pt/book/`, `pt/lexicon/`
(`data/lexiques_traduits.json`), `pt/works/` (`data/travaux.json`), `pt/tools/`,
`pt/support/`, `includes/footer-pt.html`, la colonne PT du glossaire, les
textes `pt` de `scripts/build-couverture.js`, `scripts/build-travaux.js` et de
`scripts/langues.js` (carte de l'édition, boutons du livre, accueil). Doutes :

- « Libré de Hermes » pour la glose du titre (`livrée` → `libré`, le terme
  du glossaire) : à confirmer ;
- « meio-deslocamento » (demi-décalage) et « gnómon » (graphie européenne) ;
- « picagem de cartões Jacquard » pour le perçage des cartons ;
- la phrase des licences de `pt/works/`, comme pour le chinois et le russe.

## En premier : la phrase des licences (texte juridique)

En tête de chaque liste des dépôts, engendrée par `scripts/build-travaux.js`
(comptes calculés depuis `data/travaux.json`). C'est ce qu'un relecteur natif
doit voir avant tout le reste :

- **zh** (zh/works/) : 本网站采用 CC BY-NC 4.0 许可。以下每个存档保留其发布时的许可，并在各条目中注明：7 个为 CC BY 4.0，3 个为 AGPL v3，1 个为 CC BY-NC 4.0。
- **ru** (ru/works/) : Этот сайт распространяется по лицензии CC BY-NC 4.0. Каждая публикация ниже сохраняет лицензию, под которой она была опубликована; лицензия указана у каждой: CC BY 4.0 — 7, AGPL v3 — 3, CC BY-NC 4.0 — 1.

Le sens à garder (français) : « Ce site est sous licence CC BY-NC 4.0. Chaque
dépôt ci-dessous garde la licence sous laquelle il a été publié, indiquée pour
chacun : CC BY 4.0 pour 7, AGPL v3 pour 3 et CC BY-NC 4.0 pour 1. » Les noms
de licence ne se traduisent pas. En russe, les dépôts s'appellent
« публикации » (glossaire) ; « депозит » est refusé.

## Commun aux deux langues

- **Les termes du glossaire choisis pour ZH et RU** n'ont été validés par aucun
  natif. Les plus incertains : 安卡十字 et « крест с петлёй » (croix ansée),
  太阳方阵 (carré solaire), 半周期平移 et « полусдвиг » (demi-décalage),
  数形学 (arithmogéométrie), 图层 (calque), « таблица » (planche), 号衣 et
  « ливрея » (livrée, nom commun).
- **« natures »** : `outils.html` dit « les 60 natures du Yi King » là où le
  lexique dit « 60 images (15 familles d'axes × 4 natures) ». Le français
  emploie le mot dans deux sens ; les traductions ont suivi chaque page
  (RU « образы » / « природы » ; ZH 60 种性质). À trancher en français d'abord.
- **La phrase des langues** (`scripts/build-couverture.js`) : ses textes
  chinois, russe, espagnol et thaï sont de Claude ; ses contenus sont calculés.
- **Les libellés de `scripts/build-travaux.js`** (types de dépôts, « toutes
  versions, à citer », dates) et les intitulés de `scripts/langues.js`
  (« 其他语言： », « Другие языки: ») : idem.
- **Le bouton PDF des accueils zh et ru** propose le PDF anglais faute
  d'édition chinoise ou russe ; le français serait peut-être préférable.
- **Les gloses du titre** : le lexique chinois porte « （赫尔墨斯的号衣） » et le
  russe « (Ливрея Гермеса) », une fois, juste après *La Livrée d'Hermès*, comme
  la glose anglaise. Permises par la règle ; à retirer si on n'en veut aucune.

## Chinois simplifié (zh-Hans)

Traduction faite sans relecteur natif. Les points ci-dessous sont ceux où un
relecteur doit regarder en priorité.

### Général (toutes les pages)

- **Tiret** : j'ai employé le tiret chinois pleine chasse « —— » sans espace,
  y compris collé au titre latin (« La Livrée d'Hermès——在线阅读 »). Le mélange
  latin + « —— » peut sembler lourd ; alternative : « La Livrée d'Hermès：… ».
  Exception : le crédit garde « Anibal Edelberto Amiot — CC BY-NC 4.0 » (formule
  de licence, identique aux autres langues) et « © … CC BY-NC 4.0 — creativecommons… ».
- **Titre non mis entre 《》** : j'ai laissé « La Livrée d'Hermès » nu dans le texte
  (ou en italique *…* / <i>), comme les autres langues. Un lecteur chinois attendrait
  peut-être 《La Livrée d'Hermès》. À trancher une fois pour tout le site.
- **« 论著 »** pour « traité » (et « 著作 » pour « livre/ouvrage ») : correct mais
  un peu soutenu ; « 专著 » serait une alternative.
- **« 研究存档 »** pour « travaux / dépôts de recherche » (Zenodo deposits). Le nom
  est aussi celui que scripts/build-travaux.js met dans le JSON-LD (« 研究存档 — … »).
  « 存档 » évoque l'archivage ; « 研究成果存档 » ou « 学术存档 » sont possibles.
- **« 铺排 »** pour « pavage / tiling » : pas un terme du glossaire. « 平铺 » ou
  « 密铺 » (terme mathématique de la tessellation) seraient peut-être meilleurs ;
  « 密铺 » est le plus technique. À fixer dans le glossaire.
- **« 单元 »** pour « cellule (12×12) » du motif : à distinguer de « 格 » (case,
  glossaire). Vérifier que la distinction est claire.
- **« 双色 »** pour « bicolore » et **« 色调混合 »** pour « mélange de teintes » : sûrs
  mais non fixés dans le glossaire.
- **Libellés de langue** : « （法文）» / « （英文）» pour signaler une page dans une autre
  langue ; « 法文页面 » en fin de description des cartes d'outils. « 法语 / 英语 » serait
  aussi correct (langue parlée vs écrite) ; j'ai pris « 文 » (langue écrite).

### zh/index.html (accueil)

- Bouton secondaire : « 下载英文版 PDF（16 MB）» — il n'y a pas de PDF chinois ;
  j'ai proposé le PDF anglais (16 MB, chiffre repris de en/index.html). Choix
  éditorial à confirmer (on pourrait préférer le français, langue originale).
- « 每一个数都被安放为一个图形，由安卡十字推导而来 » (each number is laid down as a
  figure, derived from the ansate cross) : traduction littérale, un peu raide.
- « 转写为提花织物 » (transcribes into Jacquard weave) : « 织物 » = étoffe ; alternative
  « 提花织造 ».
- Carte hexagrammes : « 卦辞、象、六爻、三爻卦 » pour « jugement, image, six traits,
  trigrammes » — « 象 » seul pour « image » est le terme traditionnel (大象/象辞) mais
  peut sembler elliptique.
- Carte motifs : « 换色 » pour « recolourings » : à vérifier.
- Carte travaux : « 模 n 倍乘 » (doubling modulo n), « 恰好高度的二叉树 » (binary trees
  of exact height) — formulations mathématiques à faire vérifier.
- Note de relecture : « 本页译文尚待审校——如发现错误，敬请告知。»

### zh/book/index.html (le traité)

- Fil d'Ariane, dernier élément : « 简体中文页面 » (et non « 简体中文版 », puisque
  l'édition chinoise n'existe pas encore). À vérifier que ce n'est pas trompeur.
- « 本书的简体中文版正在准备中，由作者亲自翻译。» — « 亲自 » (en personne) ajoute une
  nuance ; la consigne dit seulement « Anibal la traduit ».
- « 带领读者从幻方一路走到织机本身 » : rendu libre de « carries the reader from the
  magic square to the loom itself ».
- Le lien « La Livrée d'Hermès » du fil d'Ariane porte hreflang="fr" (page française).

### zh/works/index.html (dépôts)

- « 能输出其中所述数字的脚本 » pour « scripts that print the numbers it states » :
  « 输出 » (output) plutôt que « 打印 » (print sur papier). À vérifier.
- « 「所有版本」的 DOI » : guillemets 「」, cohérent avec la chaîne de build-travaux.js
  (« 所有版本，引用请用此 DOI »).
- Titres des articles soumis laissés en anglais (titres d'œuvre), marqués lang="en".

### zh/tools/index.html (outils)

- **« 60 种性质 »** pour « les 60 natures du Yi King » : le mot « nature » est propre
  au livre ; je ne sais pas s'il recouvre un concept chinois établi. Doute fort.
- **« 音流学 »** pour « Cymatique » (cymatics) : traduction courante en chinois, mais
  on trouve aussi « 声学图形学 ». Le glossaire n'a pas d'entrée.
- « Unified Patterns » laissé en anglais comme nom propre d'outil (comme en français).
- **« 图库 »** pour « Galerie » : alternative « 画廊 ».
- « 抽取并下载可直接付印的打印图层 » pour « Tirez et téléchargez les calques
  d'impression » : « tirez » est ambigu (tirage au sort à la manière du Yi King,
  ou tirage papier ?). J'ai pris le sens du tirage au sort (« 抽取 »). À vérifier.
- « 对角线的第二种切分（YA/AY）：角、元素、半周期平移的各种状态 » : « angles, éléments,
  statuts » rendus littéralement ; le sens technique m'échappe en partie.
- « 双重参照 » pour « double référent » ; « 几何隐写编码 » pour « encodage
  stéganographique géométrique ».
- « 按笔画组合分为 4 类 » pour « 4 catégories de combinaisons de traits » : « 笔画 »
  (traits de pinceau) — « 线条 » serait une alternative ; mais attention, « 爻 » est le
  trait d'hexagramme, et le français « trait » est peut-être celui-là ici.
- Les noms d'outils dans le JSON-LD sont traduits (« 创作图案 », etc.) avec
  inLanguage "fr" pour la cible : à vérifier que c'est souhaité.

### zh/support/index.html (soutien)

- Bouton « 前往法文页面付款 » (aller payer sur la page française), lien vers
  soutenir.html hreflang="fr". J'ai ajouté « 付款页面为法文。» dans la note.
- « 金额自定，捐助自愿 » pour « Montant libre, don facultatif » : correct, un peu
  administratif.
- « 纺织方面的工作 » pour « le volet textile » : approximatif.
- La phrase française « documentation en quatre langues » est devenue « 目前有法文、
  英文、西班牙文和泰文版本，中文版与俄文版正在翻译中 » (langues nommées, consigne).

### i18n-zh.json — lexique

- Définition « La Livrée d'Hermès » : glose « （赫尔墨斯的号衣）» placée UNE fois, juste
  après *La Livrée d'Hermès*, comme la glose anglaise « (The Livery of Hermes) ».
  « 号衣 » est le terme du glossaire pour « livrée » ; le check autorise la glose à
  cet endroit. Si on préfère aucune glose en chinois, la supprimer.
- « 数字命理学 » pour « numerology » : courant (« 命理数字学 » existe aussi).
- « 可行的着色 » pour « admissible colourings » : « 容许的着色 » serait plus proche du
  vocabulaire mathématique.
- « 15 个轴族 × 4 种性质 » (15 axis families × 4 natures) : même doute que « 性质 »
  ci-dessus ; « 轴族 » est un composé de 轴 + 族 (famille, glossaire).
- « 纹板穿孔 » / « 纹板 » pour « card-cutting » / « punched card » Jacquard : terme
  textile chinois usuel (纹板 = carte Jacquard), mais à vérifier.
- « 对角基（YANG 或 YANG mutant）» : la consigne dit que les noms de familles restent
  en latin ; ici « yang / yang-mutant » qualifie la base diagonale, j'ai gardé le
  latin par prudence, puis « 对角轴属于阳型 » (type yang) avec 阳 du glossaire.
  Incohérence possible entre les deux à arbitrer.
- « 对称轨道 » (symmetry orbits), « 平面铺排 » (tilings of the plane) — voir « 铺排 ».
- « 彼此互为映像 » pour « each the image of the other » : « 映像 » suggère le miroir ;
  le texte français dit « une antinomie plutôt qu'un simple reflet en miroir » —
  peut-être « 互为对方的像 » est plus juste. Doute.
- « 起卦功能 » pour « a drawing » (le tirage) : terme de divination, adapté au Yi King.
- « 除此之外不作任何主张 » (claims nothing beyond that) : un peu juridique.
- « 幻和为 870 » (magic constant 870) : terme standard « 幻和 ».
- Nav : « 64 卦（英文）» pointe vers /en/hexagrams/ ; « 图案（英文）» vers /motifs/ ;
  « 数字与来源（法文）», « 联系（法文）» ; libellés courts pour 390 px.
- Crédit : « 与 Claude 合作完成 ».

### i18n-zh.json — travaux

- Section « rapports » (Comptes rendus / Reports) : « 进展报告 » (rapport d'avancement),
  choisi parce que le seul dépôt de la section est un « Progress report ». Plus
  général : « 报告 ».
- « 2 进同步 / 2 进提升 » pour « 2-adic synchronization / lifting » : « 2-adic » se dit
  « 2 进 » (2 进数 = nombres 2-adiques) ; à vérifier par un mathématicien.
- « 严格对数凹 » (strictly log-concave) : terme standard.
- « 在倍乘下封闭 » (closed under doubling), « 取负 » (negation), « 逆倍乘 » (inverse
  doubling) : à vérifier.
- « 方形板本征模态的等值线 » (level sets of a square-plate eigenmode) : « 等值线 »
  pour level sets ; le glossaire n'a que « 等幅线 » (iso-amplitude) — différent ?
- « 莫尔纹理论 » (theory of moiré) : terme courant « 莫尔条纹 / 莫尔纹 ».
- Description du livre : « 依据磬折形法则 » (by the law of the gnomon) — 磬折形 du
  glossaire ; « 法则 » pour « loi ».
- « anterieurs » : vide ({}), aucun dépôt antérieur dans travaux-a-traduire.json.

## Russe (ru)

Traduction faite sans relecteur natif. Points à vérifier, page par page.

### Général

- **« Публикации » / « Научные публикации »** pour « travaux / Research deposits ». Un dépôt Zenodo n'est pas toujours une « publication » au sens strict ; « депозит » est employé dans le texte courant (works) mais sonne comme un calque de l'anglais (le mot russe usuel est « депонирование » / « депонированная работа »). À trancher par un natif ; le libellé de navigation reste court (« Публикации »).
- **« по свободной цене »** pour « prix libre / pay-what-you-want ». Usage courant mais pas figé ; alternative « плати сколько хочешь ».
- **« Главная »** dans les fils d'Ariane : lien vers /ru/ (le modèle thaï garde « Accueil » vers la page française). Choix délibéré, à confirmer.
- Le nom **Anibal Edelberto Amiot** est laissé en latin, non décliné (« предложен Anibal Edelberto Amiot »). Grammaticalement acceptable pour un nom étranger non translittéré, mais un peu raide ; un natif pourrait préférer « автором Anibal Edelberto Amiot ».
- Le titre *La Livrée d'Hermès* reste en latin, sans déclinaison, souvent précédé de « книга » / « трактат » pour porter le cas.

### ru/index.html

- Bouton secondaire « PDF на английском (16 МБ) » : il n'y a pas de PDF russe ; j'ai pointé vers le PDF anglais (taille reprise de en/index.html, « 16 MB »). On pourrait préférer un lien vers /ru/book/ qui propose les quatre PDF.
- « выведенная из креста с петлёй » (« derived from the ansate cross ») et « жаккардовое переплетение » (« Jacquard weave ») : « переплетение » est le terme technique textile (armure), à vérifier dans ce contexte.
- « 256 унифицированных узоров » : conforme au glossaire, mais « унифицированный » est lourd ; c'est le terme imposé.
- Carte « Инструменты » : énumération (« создание узоров, галереи, киматика, обои, печать, кодировщик ») rédigée par moi d'après outils.html, pas traduite d'une carte existante.
- Note de relecture : « Перевод ещё не проверен носителем языка — если вы заметили ошибку, пожалуйста, сообщите нам. » Formulation libre.

### ru/book/index.html

- Breadcrumb « На русском » pour la 3e étape (l'équivalent de « English edition »), alors que l'édition russe n'existe pas encore : « Русское издание » aurait été trompeur. À valider.
- « Русское издание готовится: Anibal Amiot сейчас переводит книгу. » — ton correct ? (« Anibal la traduit »).
- Boutons « Читать (FR) → » etc. : sigles latins FR/EN/ES/TH plutôt que noms russes, pour tenir à 390 px.
- Le bouton principal est le français (original) ; peut-être l'anglais serait plus utile pour un lecteur russe.
- JSON-LD : WebPage (inLanguage ru) qui décrit le Book (inLanguage fr/en/es/th), pas de « translationOfWork » puisque l'édition ru n'existe pas.

### ru/works/index.html

- « Цитируйте каждый депозит по его DOI «всех версий» (all versions) » — calque de l'anglais ; « концепт-DOI » est le terme Zenodo technique, peu connu.
- « Поданы, на рецензировании » pour « Submitted, under review ».
- « никакой результат не объявляется до рецензирования » (« no result announced before review ») — sens à vérifier.
- J'ai ajouté une phrase « Названия депозитов даны на языке оригинала » (les titres restent en anglais/français) : ce n'est pas dans le modèle anglais ; à supprimer si jugé superflu.
- og:image : j'ai mis title-logo-footer-og.png (consigne) alors que en/works utilise og_image_anibal_amiot.png.

### ru/tools/index.html

- **« 60 образов И цзин »** pour « 60 natures du Yi King ». Le lexique emploie « 4 natures » (traduit « 4 природы ») ; « natures » ici est peut-être le même mot technique. Incohérence possible entre « образ » (outil) et « природа » (lexique) — à trancher par l'auteur.
- « Двухцветные узоры v2 … Второе разбиение диагоналей (YA/AY): углы, элементы, статусы полусдвига » — sens technique incertain (« découpe », « statuts »).
- « Узоры SVG … в 4 категориях сочетаний черт » : « traits » = « черты » (comme pour les hexagrammes), mais ici il s'agit peut-être de traits graphiques (« линии »).
- « Печать — Создавайте и скачивайте слои для печати » : « Tirez » (tirer = tirage au sort ? impression ?) est ambigu ; j'ai évité « гадание ». À vérifier.
- « Киматика » (cymatique) : terme russe établi, mais aussi « киматика/циматика » ; « киматика » est le plus courant.
- « жаккардом » (instrumental de « жаккард », le tissu/le procédé) dans la carte Encodeur — usage familier ; peut-être « жаккардовым ткачеством ».
- Libellé « Открыть (на французском) → » ajouté à chaque carte (avec une petite classe CSS .tool-lang) pour dire que l'outil est en français.

### ru/support/index.html

- Bouton « Оплатить на французской странице » (consigne : « payer sur la page française »).
- « текстильное направление » pour « le volet textile ».
- « Платёж защищён Stripe » : courant, mais « Оплата защищена Stripe » est peut-être plus naturel.
- La phrase des langues (« документацию на французском, английском, испанском и тайском, а также готовящиеся китайское и русское издания ») remplace « en quatre langues » ; la seconde moitié parle d'éditions et non de documentation : à reformuler si l'auteur veut rester strict.

### i18n-ru.json — lexique

- Glose **«Ливрея Гермеса»** placée une fois, entre parenthèses, juste après *La Livrée d'Hermès* dans la définition (comme « The Livery of Hermes » en anglais). Autorisé par la consigne ; à retirer si l'on préfère aucune glose.
- « Арифмогеометрия … каждую фигуру книги можно проверить вычислением » : « figure » ambigu (fr. « chaque figure du livre ») ; gardé « фигура ».
- « центрально-симметричной конфигурации черт » : « traits/strokes » rendu par « черты » ; possible « штрихов ».
- « 15 семейств осей × 4 природы » : « natures » → « природы » (pluriel peu naturel) ; voir le doute de la page outils.
- « набивка жаккардовых карт » pour « mise en carte / card-cutting » : terme technique textile à vérifier (« пробивка карт », « насечка карт », « патронирование » sont des candidats ; « патрон » = mise en carte en russe textile).
- « ровно одна диагональная основа, ян или мутантный ян » — traduit de l'anglais (« exactly one diagonal base, yang or yang-mutant ») ; le français dit « un axe diagonal ». Ici ян/мутантный ян en minuscules cyrilliques suivent le glossaire (yang = ян, mutant = мутантный) ; mais s'il s'agit des noms de familles (YANG, YANG mutant), ils devraient rester en latin. À vérifier.
- Critère de demi-décalage : le texte évite « сдвиг на половину » (variante refusée) en disant « полусдвиг — перенос на полпериода ».
- « строго логарифмически вогнут на всей своей внутренности » (travaux) : « intérieur » d'une suite — « во всех внутренних точках » serait peut-être plus idiomatique.
- « Сайт предлагает гадание » pour « a drawing / un tirage » : « гадание » (divination) correspond au tirage du Yi King mais peut sembler trop ésotérique ; « жеребьёвка » serait trop neutre.
- « замощение тогда несёт один мотив вместо двух чередующихся » : « мотив » (et non « узор ») pour éviter un double sens avec le terme du glossaire ; à vérifier.
- Nav : « (англ.) », « (фр.) » abrégés pour la largeur.
- credit : « Создано в сотрудничестве с Claude ».

### i18n-ru.json — travaux

- « Отчёты » pour « Comptes rendus / Reports ».
- « 2-адический подъём » pour « lifting » (terme standard « подъём Гензеля » ; « подъём » seul paraît correct).
- « замкнутых относительно смены знака и удвоения » pour « closed under negation and doubling ».
- « anterieurs » laissé vide : travaux-a-traduire.json n'en contient aucun.

## Thaï — pages existantes modifiées par ce lot

Ce lot a touché du texte thaï déjà publié. Rien n'y a été traduit : ce sont des
**restaurations** (le titre et le nom ne se traduisent pas) et deux
**alignements** de terme. Un lecteur thaï tranche chacun en quelques secondes.

### Le nom de l'auteur (3 occurrences, th/book/index.html)

La translittération « อนิบัล อามิโอต์ » a été remplacée par le nom original,
dans les trois méta-descriptions (description, og:description,
twitter:description) — même phrase aux trois endroits :

- **avant** : `อ่านหนังสือ เสื้อคลุมของเฮอร์เมส โดยอนิบัล อามิโอต์ ออนไลน์ ทีละหน้า พร้อมดาวน์โหลด PDF ฟรี`
- **après** : `อ่านหนังสือ La Livrée d'Hermès โดย Anibal Edelberto Amiot ออนไลน์ ทีละหน้า พร้อมดาวน์โหลด PDF ฟรี`

À vérifier : l'espace entre « โดย » et le nom latin (choisi pour suivre
th/index.html, qui écrit déjà « โดย Anibal Edelberto Amiot »).

### Le titre (22 occurrences thaïes)

« เสื้อคลุมของเฮอร์เมส » → « La Livrée d'Hermès » : th/index.html (10),
th/book/index.html (9), th/search/index.html (1), 360-calques.html (1, le
dictionnaire d'interface thaï), la-livree-d-hermes.html (1, carte de l'édition
thaïe : « อ่าน La Livrée d'Hermès ออนไลน์ ทีละหน้า พร้อมดาวน์โหลด PDF ฟรี »).
L'`alternateName` « เสื้อคลุมของเฮอร์เมส » du JSON-LD de th/index.html est
gardé : il dit ce que le titre veut dire sans remplacer le titre.

À vérifier : les espaces posées autour du titre latin dans la phrase thaïe.

### Deux termes alignés sur la forme majoritaire

« Majoritaire » est un argument de fréquence, pas de justesse :

- **carré magique** : « ตารางเวทมนตร์ » (2 pages : th/index.html, 4 fois dont
  3 méta-descriptions ; th/book/index.html, 1 fois) → « จัตุรัสกล », la forme
  des 66 autres pages thaïes ;
- **hexagramme** : « เฮกซะแกรม » (1 bouton de navigation, th/book/index.html) →
  « ฉักลักษณ์ », la forme des 68 autres pages.

Si le lecteur natif préfère l'autre forme, la changer **dans le glossaire
d'abord** (docs/terminologie-fr-en-es-th.md) et déplacer l'ancienne vers les
variantes refusées : tools/check_glossaire.mjs fera le reste.

## Articles en français seulement — traduction anglaise à faire

Les articles existent en français et en anglais (`en/articles/`). Celui-ci n'a
pas encore sa version anglaise ; il ne porte donc aucun hreflang et n'entre pas
dans la liste anglaise.

- **`articles/le-fil-et-le-carre.html`** — « Le fil et le carré — ce que la
  tradition indienne a construit avant nous » (2026-10-04). Traduction anglaise
  à faire. Quand elle existe : la page dans `en/articles/`, une ligne dans
  `ARTICLES_TRADUITS` (`scripts/langues.js`), puis `node scripts/build-articles.js`
  et `node scripts/build-header.js`. La partie terminologique attend d'abord
  l'avis d'un sanskritiste (l'article le dit lui-même) : traduire après.
  Les termes sanskrits restent en translittération savante (IAST), sans
  simplification (« Nārāyaṇa Paṇḍita », pas « Narayana Pandita »).

## Visionneuse du livre — interface dans les sept langues (2026-10-04, audit A09)

`scripts/langues.js`, champ `lecteur` de chaque langue : titre (« Le Livre —
visualiseur »), « Page {code} — {i} / {n} », « Aller à », « ex. 042 », « Voir »,
les deux aides (clavier, tactile), les noms des flèches et de l'image pour les
lecteurs d'écran, « Télécharger le PDF », le nom de la rangée de langues.
Rédigés par Claude, à relire en espagnol, thaï, chinois, russe et portugais.
Points de doute :

- **th** : « โปรแกรมอ่าน » (visionneuse) — terme courant, mais un relecteur
  préférera peut-être « ตัวอ่าน » ;
- **zh** : « 阅读器 » pour visionneuse ; « 跳至 » / « 查看 » pour le saut de page ;
- **ru** : « Книга — просмотр » ; l'aide clavier « ← → — листать » ;
- **pt** : « visualizador » ; « Descarregar o PDF » (pt-PT, comme les pages du livre).

## Hindi (hi, ajouté le 2026-10-04)

Le livre est celui déposé par Anibal (« हर्मीस की पोशाक »), intact. Les textes
DU SITE en hindi sont de Claude, à relire par un lecteur natif : `hi/` (accueil,
livre, outils, soutien, travaux), le lexique (`data/lexiques_traduits.json`,
entrée `hi`), les descriptions des dépôts (`data/travaux.json`, champ `hi`), la
colonne HI du glossaire, la phrase des langues (`scripts/build-couverture.js`,
table `T.hi`), la visionneuse (`scripts/langues.js`, `lecteur`), le pied
(`includes/footer-hi.html`). Points de doute :

- **termes** : « अंख क्रॉस » (croix ansée), « चित्रफलक » (planche),
  « अंकज्यामिति » (arithmogéométrie), « अर्ध-विस्थापन » (demi-décalage),
  « जमा » (dépôt Zenodo), « प्रगति-विवरण » (compte rendu) ;
- **registre** : un hindi standard, sans ourdou ni anglicismes évitables ; les
  termes techniques sans équivalent établi sont translittérés (हेक्साग्राम,
  पैटर्न, आइगेन-मोड) ;
- **la phrase des langues** : la tournure « में उपलब्ध हैं » est répétée par
  clause, à vérifier à l'oreille.

## Page des 360 calques — thaï (2026-10-04)

- **Terme refusé par le glossaire, laissé tel quel.** Le dictionnaire thaï de
  `360-calques.html` (ex-`impression.html`, objet `UI.th`) emploie
  « เฮกซะแกรม » pour « hexagramme », 5 fois (cartes des quatre catégories et
  textes de navigation) ; le glossaire impose « ฉักลักษณ์ » et classe
  « เฮกซะแกรม » en variante refusée. `tools/check_glossaire.mjs` ne le voit
  pas : il ignore les dictionnaires d'interface des scripts. Décision : un
  défaut de contenu, consigné ici pour un lecteur natif, **pas** de
  remplacement automatique. Le même dictionnaire emploie « ชั้นลาย » pour
  « calque » là où le glossaire dit « แผ่นลาย ».
- **Textes nouveaux, sans relecture native** (thaï et espagnol) : la phrase
  qui relie les 360 calques aux tirages (`calquesRelation`) et les cartes des
  quatre catégories (« ชุด » / « juego » pour un jeu de 24 calques,
  « การทำนาย » / « tirada » pour un tirage). « ธรรมชาติ » et « naturaleza »
  pour « nature » n'ont pas de ligne au glossaire.

## Galerie d'animations — sept pages dans les huit langues (2026-10-05, lot 7)

Les textes de la galerie (titres, groupes, boutons, messages) sont **sans
source humaine** dans les sept langues autres que le français, anglais compris :
écrits pour ce lot, publiés sans attendre (règle d'Anibal). Ils se corrigent
dans `data/galerie-animations.json` (« textes » et, par groupe, « nom » et
« texte »), puis `node scripts/build-galerie-animations.js && node scripts/build-header.js`.
Pages : `galerie-animations.html` et `animations/`, `en/animations/`,
`es/animaciones/`, `th/`, `zh/`, `ru/`, `pt/`, `hi/animations/`. Doutes :

- le nom des six groupes, surtout « Fonds de quantité » et « Polygones —
  orientation », repris de l'outil des fonds (`assets/selecteur-fonds.js`,
  français et anglais seulement) et traduits ici pour les six autres langues ;
- « témoin » (l'animation qui représente un groupe sur l'entrée) : « sample »,
  « muestra », « 样例 », « образец », « amostra », « ตัวอย่าง », « उदाहरण » ;
- le **nom de chaque fond** sur les cartes n'existe qu'en français et en
  anglais : les six autres langues affichent le nom anglais ;
- hindi : « पैटर्न » pour motif (le terme du glossaire ; « नमूना » y est refusé).

## Outils traduits — cymatique, 360 calques, tirage (2026-10-06, étape 1 des outils en langues)

Sept pages nouvelles, écrites par `scripts/build-outils-langues.js` depuis la page
française : `en/cymatics/`, `es/cimatica/`, `th/cymatics/`, `en/360-layers/`,
`es/360-capas/`, `th/360-layers/`, `en/yi-king-draw/`. Leur corps vient du
dictionnaire que chaque page portait déjà (`UI.en`, `UI.es`, `UI.th`) : rien n'y a été
traduit par ce lot, il est seulement devenu visible. La mention de relecture que
cymatique affichait déjà en espagnol et en thaï reste en place.

Où corriger : le corps dans le dictionnaire `UI` de la page française
(`cymatique.html`, `360-calques.html`, `tirage-livree-hermes.html`) ; la tête
(titre, description, données structurées) et le fil d'Ariane dans
`data/outils-langues.json`. Puis `node scripts/build-outils-langues.js`.

**Sans source humaine** (écrits pour ce lot ; « adapté » = repris d'un texte du
site puis complété) :

- `en/cymatics/` (en) :
  - « The tiling whose spatial frequency comes closest to the sound you make. Its figures are the level lines of an exact eigenmode of a plate — not measured. » — nav-tiles (cymatique) pour la 1re phrase ; SANS SOURCE pour la 2e
  - « A listening tool and a result: the sixteen families of axes are the level lines of cos(πx/3), an exact eigenmode of a square plate with guided edges and of a… » — SANS SOURCE
  - « The sixteen families of axes are the level lines of an exact eigenmode of a square plate with guided edges. No measurement has been made. » — SANS SOURCE
  - « The tiling whose spatial frequency comes closest to the sound you make. Three of these patterns coincide, checked triangle by triangle, with eigenmodes of a … » — nav-tiles (cymatique) pour la 1re phrase ; SANS SOURCE pour la suite
- `es/cimatica/` (es) :
  - « El teselado cuya frecuencia espacial se acerca más al sonido que usted emite. Sus figuras son las líneas de nivel de un modo propio exacto de placa — no medido. » — nav-tiles (cymatique) pour la 1re phrase ; SANS SOURCE pour la 2e
  - « Una herramienta de escucha y un resultado: las dieciséis familias de ejes son las líneas de nivel de cos(πx/3), modo propio exacto de una placa cuadrada de b… » — SANS SOURCE
  - « Las dieciséis familias de ejes son las líneas de nivel de un modo propio exacto de una placa cuadrada de bordes guiados. No se ha hecho ninguna medición. » — SANS SOURCE
  - « El teselado cuya frecuencia espacial se acerca más al sonido que usted emite. Tres de estos motivos coinciden, verificado triángulo por triángulo, con modos … » — nav-tiles (cymatique) pour la 1re phrase ; SANS SOURCE pour la suite
- `th/cymatics/` (th) :
  - « การปูลายที่มีความถี่เชิงพื้นที่ใกล้เคียงกับเสียงที่คุณเปล่งออกมามากที่สุด รูปทรงของมันคือเส้นระดับของโหมดเฉพาะที่แม่นตรงของแผ่นเพลต — ยังไม่ได้วัด » — nav-tiles (cymatique) pour la 1re phrase ; SANS SOURCE pour la 2e
  - « เครื่องมือสำหรับการฟังและผลลัพธ์หนึ่ง: ตระกูลแกนทั้งสิบหกคือเส้นระดับของ cos(πx/3) ซึ่งเป็นโหมดเฉพาะที่แม่นตรงของแผ่นเพลตสี่เหลี่ยมจัตุรัสที่มีขอบแบบนำทางและ… » — SANS SOURCE
  - « ตระกูลแกนทั้งสิบหกคือเส้นระดับของโหมดเฉพาะที่แม่นตรงของแผ่นเพลตสี่เหลี่ยมจัตุรัสที่มีขอบแบบนำทาง ยังไม่มีการวัดใด ๆ » — SANS SOURCE
  - « การปูลายที่มีความถี่เชิงพื้นที่ใกล้เคียงกับเสียงที่คุณเปล่งออกมามากที่สุด ลวดลายสามแบบในนี้ตรงกับโหมดเฉพาะของแผ่นเพลตสี่เหลี่ยมจัตุรัส ตรวจสอบทีละสามเหลี่ยม … » — nav-tiles (cymatique) pour la 1re phrase ; SANS SOURCE pour la suite
- `en/360-layers/` (en) :
  - « Draw and download the print layers of La Livrée d'Hermès, in 4 categories of trait combinations, as print-ready SVG. » — adapté de nav-tiles (impression, motifs-svg) ; description, og, twitter, données structurées
- `es/360-capas/` (es) :
  - « Realice la tirada y descargue las capas de impresión de La Livrée d'Hermès, en 4 categorías de combinaciones de trazos, en formato SVG listo para imprimir. » — adapté de nav-tiles (impression, motifs-svg) ; description, og, twitter, données structurées
- `th/360-layers/` (th) :
  - « ทำการทำนายและดาวน์โหลดแผ่นลายสำหรับพิมพ์ของ La Livrée d'Hermès ใน 4 หมวดของการผสมเส้น เป็นไฟล์ SVG ที่พร้อมพิมพ์ » — adapté de nav-tiles (impression, motifs-svg) ; description, og, twitter, données structurées
- `en/yi-king-draw/` (en) :
  - « <title>Yi King draw and chessboard of the 64 hexagrams — La Livrée d'Hermès</title> » — adapté de nav-tiles (tirage, en)
  - « Draw a hexagram at random and discover its square: the Yi King as an oracle, and the chessboard of the 64 changes in binary order 00 → 63. La Livrée d'Hermès… » — nav-tiles (tirage, en) pour la 1re phrase ; SANS SOURCE pour la suite
  - « arithmogeometry, magic squares, solar squares, ansate cross, EGO ALTER, Yi King, Jacquard, verticality, Pythagoras, Plato, anamnesis, ceremonial fabric, live… » — SANS SOURCE (mots-clés)
  - « "Arithmogeometry",         "Magic squares",         "Jacquard weaving",         "Chladni figures",         "Finite geometry" » — SANS SOURCE (données structurées, knowsAbout)
  - « A treatise on arithmogeometry in 111 plates: magic squares built geometrically, from the ansate cross to Jacquard weaving. » — adapté de en/index.html (description)
  - « "name": "Verification scripts for La Livrée d'Hermès" » — SANS SOURCE

Correction de glossaire posée par le générateur : en thaï, le dictionnaire
`UI.th` de `360-calques.html` dit encore « เฮกซะแกรม » (variante refusée) ;
`th/360-layers/` porte « ฉักลักษณ์ », le terme du glossaire. La page française n'a
pas été touchée : à corriger dans son dictionnaire à la prochaine retouche.

## Outils traduits, étape 2 — les galeries (2026-10-06)

Neuf pages nouvelles, en anglais, espagnol et thaï. Ces pages n'avaient **aucun** dictionnaire : leur texte est traduit pour ce lot,
ligne par ligne, dans une table par page (`data/outils-langues/<page>.json`). Chaque ligne y porte sa provenance ; « SANS SOURCE » marque
ce que j'ai écrit. Les termes suivent le glossaire (grain de lecture, figure, parité, demi-décalage, calque, hexagramme).

Où corriger : dans la table de la page, puis `node scripts/build-outils-langues.js`.

- `bicolore.html` → en/two-colour-patterns/, es/motivos-bicolores/, th/two-colour-patterns/ : 39 textes, dont **28 sans source** ; les autres reprennent les tuiles, le dictionnaire de 360 calques ou de cymatique, ou le glossaire.
- `galerie-patterns-unifies.html` → en/three-colour-gallery/, es/galeria-tricolor/, th/three-colour-gallery/ : 41 textes, dont **31 sans source** ; les autres reprennent les tuiles, le dictionnaire de 360 calques ou de cymatique, ou le glossaire.
- `galerie-bicolore.html` → en/two-colour-gallery/, es/galeria-bicolor/, th/two-colour-gallery/ : 65 textes, dont **33 sans source** ; les autres reprennent les tuiles, le dictionnaire de 360 calques ou de cymatique, ou le glossaire.

Reste en français sur ces pages, et pourquoi :
- les noms de familles et de fonds du **fond d'écran fixe** de la galerie bicolore, et la phrase sous son aperçu : ils viennent du module partagé
  `assets/vue-fond-ecran.js`, qui n'a pas encore de langue (chantier de `fonds-ecran.html`) ;
- les infobulles des drapeaux du livre (« bientôt ») : zones engendrées par `scripts/build-langues.js`, communes à toutes les pages.

## Outils traduits, étape 3 — contact, profil, chiffres et sources (2026-10-06)

Neuf pages nouvelles, en anglais, espagnol et thaï, sur le modèle de l'étape 2 (une table par page, `data/outils-langues/<page>.json`,
chaque ligne avec sa provenance ; « SANS SOURCE » marque ce que j'ai écrit). Termes du glossaire : croix ansée, carré solaire, calque,
planche, demi-décalage, grain de lecture, case, accord, système de bandes, région de référence, Carter, licence.

Où corriger : dans la table de la page, puis `node scripts/build-outils-langues.js`.

- `contact.html` → en/contact/, es/contacto/, th/contact/ : 20 textes, dont **17 sans source** ; les autres reprennent les tuiles.
- `profil.html` → en/documentary-profile/, es/perfil-documental/, th/profile/ : 33 textes, dont **29 sans source** pour l'espagnol et
  le thaï. L'anglais reprend la formulation d'en/about/ partout où elle existe. Les titres officiels des deux brevets restent en français,
  avec une glose dans la langue, comme sur en/about/.
- `chiffres-et-sources.html` → en/figures-and-sources/, es/cifras-y-fuentes/, th/figures-and-sources/ : 49 textes, dont **42 sans source** ;
  les autres reprennent les tuiles et le dictionnaire de 360 calques.

Reste en français sur ces pages, et pourquoi :
- les commandes et ce qu'elles impriment (`<p class="commande">`, `<pre class="sortie">`) : c'est la sortie des scripts, telle qu'on
  l'obtient ; l'introduction le dit (« les scripts impriment en français »), une phrase ajoutée à la traduction ;
- les titres officiels des brevets (glosés), et les noms de fichiers.

Laissées sans traduction à cette étape, et pourquoi :
- `telechargements.html` : la page se dit elle-même provisoire (« Le contenu de cette page n'est pas encore défini ») ; la traduire
  maintenant, c'est la retraduire quand elle existera ;
- `la-livree-d-hermes.html` : son rôle est déjà tenu dans chaque langue par la présentation du traité (en/book/, es/libro/, th/book/…),
  et son corps présente déjà chaque édition dans sa langue ;
- `unified-patterns.html` : son panneau porte les 64 textes de Jugement des hexagrammes, qui relèvent du livre — même raison que
  `creation-motifs-yi-king.html`, à faire ensemble ;
- `carter-demo.html` : satellite de l'encodeur, à faire avec lui (CSP stricte, service worker).

## Outils traduits, étape 4 — Unified Patterns (2026-10-06)

Trois pages nouvelles : en/unified-patterns/, es/motivos-unificados/, th/unified-patterns/. Table des textes :
`data/outils-langues/unified-patterns.json` (30 textes, dont **22 sans source** ; les autres reprennent la barre du livre de 360 calques,
les libellés du tirage et des pages d'hexagrammes, le glossaire).

Les textes des 64 hexagrammes du panneau (nom, mot-clé, Jugement, Image) ne sont **pas** retraduits : `scripts/build-outils-langues.js`
les lit à leur source — les tableaux anglais de `tirage-livree-hermes.html` (HEX_KW_EN, IMAGE_EN), et `data/hexagrammes_traduits.json`
pour l'espagnol et le thaï (en relecture, voir plus haut). Une correction faite là passe ici à la prochaine génération.

Reste en français, et pourquoi :
- le nom de fichier du PNG téléchargé (`motif-unifie-NN-<nom>.png`), tiré du nom de l'hexagramme en lettres latines : en thaï, le nom
  disparaît du fichier (`motif-unifie-01-.png`) ;
- les infobulles des drapeaux du livre (« bientôt ») : zones engendrées par `scripts/build-langues.js`.

## Outils traduits, étape 4 — Créer un motif (2026-10-06)

Trois pages nouvelles : en/create-a-pattern/, es/crear-un-motivo/, th/create-a-pattern/.

- Interface : `data/outils-langues/creation-motifs-yi-king.json`, 71 textes, dont **62 sans source** (les autres : tuiles, glossaire,
  pages d'hexagrammes).
- Noms, Images et Jugements des 64 hexagrammes : lus dans leurs traductions existantes, comme pour Unified Patterns. Deux écarts
  connus avec le français de cet outil : son Jugement du n° 1 est au pluriel (« Les traits pleins s'élancent seuls… ») là où la
  traduction suit le singulier du tirage ; et 32 de ses mots-clés diffèrent de ceux du tirage — ceux-là sont traduits à part.
- **Tout SANS SOURCE**, dans `data/outils-langues/creation-motifs-yi-king-textes.json` : les 32 mots-clés propres à l'outil, les
  32 jugements de paires (PAIRS_FR, environ 860 mots), les 32 idées médianes (PAIRES_32, environ 1 430 mots), et les termes des
  étiquettes des 60 images (Yang fixe → Fixed yang / Yang fijo / หยางคงที่ ; mutant suivant le glossaire). Chaque texte garde son
  français : s'il change dans la page, la génération échoue au lieu de laisser la traduction dériver. Ces textes sont d'Anibal et
  touchent au livre : c'est la partie à relire en premier.

Reste en français, et pourquoi :
- le texte des 32 paires à télécharger (`32-paires-chrono-FR.pdf`) : le bouton le dit (« en français ») ;
- les noms de fichiers (`grille.png`, `grille.json`, le SVG) ;
- les infobulles des drapeaux du livre (« bientôt ») : zones engendrées par `scripts/build-langues.js`.

## Galerie d'animations — libellés des cartes d'assemblage (2026-10-06)

Les dix cartes `+…` nomment désormais le fond **et** la figure (« aplat + étoile à 95 % »),
composés par `scripts/build-galerie-animations.js` depuis `data/fonds/collection-v1.json`
(forme, échelle) et le glossaire (nom de la forme). Le français et l'anglais viennent du
prompt d'Anibal ; le reste est **SANS SOURCE**, à relire :

- les cinq formes (étoile, rond, carré, croix, losange) en ES, TH, ZH, RU, PT, HI —
  glossaire, lignes « (forme de superposition) » ;
- le gabarit `assemblage` (« {fond} + {forme} à {p} % ») et `altAssemblage` en ES, TH, ZH,
  RU, PT, HI — `data/galerie-animations.json`. TH « มาตราส่วน », ZH « 比例 », RU « масштаб »,
  HI « पैमाना » disent « échelle » : à confirmer.

Défaut connu, non corrigé dans ce lot : dans les six langues autres que FR et EN, le **nom
du fond** reste en anglais (« solid + disco al 45 % ») — `nomDuFond` d'
`assets/selecteur-fonds.js` n'existe qu'en français et en anglais.

## Lecteur — avis de repli au changement de langue (2026-10-07)

`scripts/langues.js`, `lecteur.repliPage` : quand la page lue n'existe pas dans l'édition
choisie, le lecteur va à la plus proche et le dit. FR et EN écrits ici ; ES, TH, ZH, RU, PT,
HI **SANS SOURCE**, à relire. Aujourd'hui les huit éditions ont les mêmes 111 pages : l'avis
ne s'affiche pas encore, il attend une édition plus courte.

Lexique thaï : « ตัวเลขและแหล่งที่มา (FR) » perd « (FR) » — la page existe désormais en thaï
(`th/figures-and-sources/`), et le bouton y mène.

## Fil d'Ariane des pages du livre EN, ES, TH (2026-10-07)

`en/book/`, `es/libro/`, `th/book/` : le fil d'Ariane était en français (« Accueil », « Fil
d'Ariane ») sur des pages anglaise, espagnole et thaïe. « Home », « Inicio », « หน้าแรก » viennent
des lexiques traduits ; « Breadcrumb » de tools/livre_html.py. **SANS SOURCE** : « Ruta de
navegación » (ES) et « เส้นทางนำทาง » (TH), le nom du fil pour les lecteurs d'écran.
