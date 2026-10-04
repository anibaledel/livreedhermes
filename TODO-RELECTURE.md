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
th/book/index.html (9), th/search/index.html (1), impression.html (1, le
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
