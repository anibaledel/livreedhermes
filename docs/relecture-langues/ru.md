# Relecture — « Voir sa musique » en Русский

Généré par `node scripts/build-musique-textes.mjs` depuis `data/musique-chladni/traductions/<langue>.json` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. À relire par un locuteur natif.

Page concernée : « Voir sa musique » (`musique-chladni.html` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir `TODO-RELECTURE.md`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.

## Русский (`ru`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | Русский |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | Увидеть свою музыку — La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Увидеть свою музыку: выберите композицию, файл или микрофон и посмотрите на фигуру Хладни, которую рисует звук, а затем на узор La Livrée d'Hermès, который больше всего на неё похож. Запишите 15 секунд со звуком. |
| `ariane` | Voir sa musique | Увидеть свою музыку |
| `h1` | Voir sa musique | Увидеть свою музыку |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | У каждой музыки есть подпись: то, как её энергия распределяется по частотам. Выберите композицию, файл или микрофон: страница измеряет эту энергию на частотах каждого круга мод квадратной пластины, а затем ищет среди унифицированных узоров La Livrée d'Hermès тот, чей спектр больше всего на неё похож. Выбор основан на сходстве двух спектров, а не на музыкальном законе: узор не «выражает» композицию. |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | Ничто не покидает ваш браузер: файл, микрофон и захваченный звук анализируются на месте и никуда не отправляются. |
| `flash` | Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit. | Внимание: изображения могут быстро меняться и мигать. Параметр «уменьшить быстрые изменения» замедляет их. |
| `sonTitre` | Le son | Звук |
| `sonChoix` | Son | Звук |
| `morceau` | Morceau fourni {n} — {note} | Готовая композиция {n} — {note} |
| `notes.j1` | do dièse | до-диез |
| `notes.j2` | la | ля |
| `notes.j3` | ré | ре |
| `notes.j4` | mi | ми |
| `notes.j5` | sol | соль |
| `notes.j6` | si | си |
| `notes.j7` | do | до |
| `tonalites.do dièse mineur` | do dièse mineur | до-диез минор |
| `tonalites.la mineur` | la mineur | ля минор |
| `tonalites.ré mineur` | ré mineur | ре минор |
| `tonalites.mi mineur` | mi mineur | ми минор |
| `tonalites.sol mineur` | sol mineur | соль минор |
| `tonalites.si mineur` | si mineur | си минор |
| `tonalites.do mineur` | do mineur | до минор |
| `sourceFichier` | Mon fichier audio… | Мой аудиофайл… |
| `sourceMicro` | Microphone | Микрофон |
| `sourceEssai` | Musique d'essai | Пробная музыка |
| `sourceOnglet` | Audio d'un onglet | Звук вкладки |
| `lecture` | Lecture | Воспроизвести |
| `pause` | Pause | Пауза |
| `arreter` | Arrêter | Остановить |
| `entree` | Entrée audio | Аудиовход |
| `entreeDefaut` | Entrée par défaut | Вход по умолчанию |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | Микшерный пульт, звуковая карта: подключите её, разрешите микрофон и выберите её здесь. |
| `sensibilite` | Seuil des attaques | Порог атак |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | В стандартных отклонениях выше среднего: чем ниже, тем чувствительнее к смене нот. |
| `intervalle` | Intervalle minimal entre deux attaques (s) | Минимальный интервал между двумя атаками (с) |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | По умолчанию 0,45 с: не более примерно 133 атак в минуту. Уменьшите для быстрого темпа. |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | Готовые композиции созданы с помощью ИИ («Музыка, созданная с помощью ИИ — MC Claude.»). |
| `etatDepart` | Appuyez sur Lecture. Les morceaux fournis sont composés avec l'aide de l'IA. | Нажмите «Воспроизвести». Готовые композиции созданы с помощью ИИ. |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | Готовая композиция, созданная с помощью ИИ. |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | Файл: {nom} (он остаётся в вашем браузере). |
| `etatMicro` | Micro actif. | Микрофон включён. |
| `etatEntree` | Entrée « {nom} » active. | Вход «{nom}» включён. |
| `etatOnglet` | Audio d'un onglet actif. | Звук вкладки включён. |
| `etatEssai` | Musique d'essai. | Пробная музыка. |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau. | Доступ к микрофону запрещён. Разрешите его в настройках сайта (замок слева от адреса), затем снова нажмите «Воспроизвести». Можно также выбрать файл или готовую композицию. |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | На этом устройстве нет доступного микрофона. |
| `erreurMicro` | Le micro ne démarre pas : {message} | Микрофон не запускается: {message} |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | Захват звука вкладки здесь невозможен. Нужен свежий браузер для компьютера (Chrome, Edge); на мобильных устройствах и в Safari его нет. |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | Выбранная вкладка не передала звук. Начните снова и отметьте «Поделиться звуком вкладки». |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | Этот файл нельзя прочитать как звук. |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | Звук не удаётся запустить: {message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | Данные страницы не загружаются: {message} |
| `bandeManque` | la bande {id} manque à la collection de fonds | в коллекции фонов не хватает полосы {id} |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | Источник остановился (устройство отключено или разрешение отозвано). |
| `silence` | Silence : lancez un son. | Тишина: запустите звук. |
| `valide` | Validé | Утверждено |
| `valideTag` | en cours | текущее |
| `essai` | Essai | Проба |
| `essaiTag` | aperçu | предпросмотр |
| `validerEssai` | Valider l'essai | Утвердить пробу |
| `annuler` | Annuler | Отмена |
| `pleinEcran` | Plein écran | Полный экран |
| `quitterPleinEcran` | Quitter le plein écran | Выйти из полноэкранного режима |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | Тёмный фон: утверждено. Золотая рамка: проба. Наведите курсор на параметр, чтобы увидеть его в пробе, щёлкните, чтобы оставить, затем «Утвердить пробу». |
| `fenetreValide` | Fenêtre validée | Утверждённое окно |
| `fenetreEssai` | Fenêtre d'essai | Окно пробы |
| `basculeValide` | Validé | Утверждено |
| `basculeEssai` | Essai | Проба |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | Полноэкранный режим недоступен в этом браузере. |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | Этот браузер не предлагает встроенный полноэкранный режим для этого элемента: сцена занимает всё окно. Esc или кнопка закрывает её. |
| `groupes.mode` | Pilotage du son | Управление звуком |
| `groupes.fmt` | Format (ordre) | Формат (порядок) |
| `groupes.col` | Collection | Коллекция |
| `groupes.view` | Vue | Вид |
| `groupes.fond` | Variante de case | Вариант клетки |
| `groupes.pal` | Couleurs | Цвета |
| `modes.image.0` | Le son définit l'image | Звук определяет изображение |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | В каждый момент — узор, чей спектр больше всего похож на спектр музыки. |
| `modes.rythme.0` | Le son définit le rythme | Звук определяет ритм |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | Один шаг по цепочке близости при каждой атаке ноты. |
| `modes.chemin.0` | Le son guide le chemin | Звук направляет путь |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | Ритм решает, когда; спектр решает, к какому соседу. |
| `modes.octaves.0` | Le son suit l'octave | Звук следует за октавой |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | При каждой атаке — шаг по орбите доминирующей ноты: круг K, затем его октава 4K, затем 16K… — если такие круги существуют. |
| `vues.signes.0` | Signes | Знаки |
| `vues.signes.1` | Les zones positives de la figure du motif. | Положительные зоны фигуры узора. |
| `vues.lignes.0` | Lignes nodales | Узловые линии |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | Линии, на которых фигура узора обращается в нуль. |
| `vues.pavage.0` | Cellules | Ячейки |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | Сам узор в замощении 2 × 2. |
| `format.titre` | Ordre {n} | Порядок {n} |
| `format.detail` | Grille de {g} × {g} cases | Сетка {g} × {g} клеток |
| `format.bientot` | Ordre {n} (seconde livraison) | Порядок {n} (вторая поставка) |
| `chargementOrdre` | Chargement de l'ordre {n}… | Загрузка порядка {n}… |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | Данные порядка {n} не загружаются: {message} |
| `collections.tri.0` | Tricolore — motifs unifiés | Трёхцветные — унифицированные узоры |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} узоров (различные сетки 12 × 12) |
| `collections.bi.0` | Bicolore — motifs unifiés | Двухцветные — унифицированные узоры |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} узоров (два зеркала, читаются по правилу 3 октября) |
| `collections.ce.0` | Bicolore — symétrie centrale | Двухцветные — центральная симметрия |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} узоров (только центральная симметрия на 180°, читаются по правилу 3 октября) |
| `collections.b1971128.0` | Bloc 1971128 | Блок 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} узоров |
| `collections.b16012838.0` | Bloc 16012838 | Блок 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} узоров |
| `collections.b3016090.0` | Bloc 3016090 | Блок 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} узоров |
| `collections.f613.0` | Famille 613 | Семейство 613 |
| `collections.f613.1` | {n} motifs | {n} узоров |
| `collections.f18.0` | Famille 18 | Семейство 18 |
| `collections.f18.1` | {n} motifs | {n} узоров |
| `collections.fpilote.0` | Famille pilote | Пилотное семейство |
| `collections.fpilote.1` | {n} motifs | {n} узоров |
| `collections.p18.0` | Croix 1·2 | Крест 1·2 |
| `collections.p18.1` | {n} motifs | {n} узоров |
| `collections.p30.0` | Croix 1·2 | Крест 1·2 |
| `collections.p30.1` | {n} motifs | {n} узоров |
| `fond` | Bandes {id} | Полосы {id} |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec l'état 1 du fond, ou avec l'état 0 : le même fond tourné de 90°. | В клетке четыре треугольника; каждый рисуется либо в состоянии 1 фона, либо в состоянии 0: тот же фон, повёрнутый на 90°. |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | Вариант клетки применяется только к двухцветной коллекции. |
| `palettes.creme.0` | Encre et crème | Чернила и крем |
| `palettes.creme.1` | Les couleurs du site. | Цвета сайта. |
| `palettes.monochrome.0` | Gris et blanc | Серый и белый |
| `palettes.monochrome.1` | Le monochrome du site. | Монохром сайта. |
| `palettes.perso.0` | Mes couleurs | Мои цвета |
| `palettes.perso.1` | Choisissez le motif et le fond. | Выберите цвет узора и фона. |
| `palettes.son.0` | La teinte suit le son | Оттенок следует за звуком |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | Оттенок медленно меняется вместе с яркостью звука (по умолчанию выключено). |
| `persoMotif` | Motif | Узор |
| `persoFond` | Fond | Фон |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | В трёхцветном режиме: V — самый тёмный (чернила), O — средне-серый, M — самый светлый (крем). |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | Настройки на лету |
| `lissage` | Lissage | Сглаживание |
| `pulsationTitre` | Pulsation | Пульсация |
| `pulsations.attaque` | À chaque attaque | При каждой атаке |
| `pulsations.temps` | À chaque temps | На каждую долю |
| `pulsations.quatre` | Toutes les 4 pulsations | Каждые 4 пульсации |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | По умолчанию смена при каждой атаке. Когда обнаружена ровная пульсация, можно менять на каждую долю или каждые 4 пульсации. |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | Обнаружена пульсация: {bpm} в минуту. |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | Ровной пульсации пока не обнаружено. |
| `calme` | Réduire les changements rapides | Уменьшить быстрые изменения |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | Более долгий переход и более долгое удержание. Включается автоматически, если система просит меньше анимации. |
| `pente` | Compenser la pente des graves | Компенсировать спад басов |
| `pauseImage` | Pause de l'image | Пауза изображения |
| `optionsTitre` | Options | Параметры |
| `comprendreTitre` | Pour comprendre | Чтобы понять |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | Два учебных вида, не связанных со звуком. |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | Мода (4, 0) и её вырожденная пара |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | На квадратной пластине моды (4, 0) и (0, 4) имеют одну и ту же частоту: любая их комбинация тоже является модой этой частоты. Ползунок переходит от cos(4πx/a) + cos(4πy/a) (справа) к cos(4πx/a) − cos(4πy/a) (слева); посередине остаётся только cos(4πx/a) — вертикальные линии. Светлые и тёмные зоны: противоположные знаки; линия: узловая линия. |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | Смесь s: cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | Фигура моды (4, 0), смешанной с её вырожденной парой |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | Чётность как наложение двух решёток ±1 |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | Каждая решётка — шахматная доска: чётность (−1)^(i + j) клетки (i, j). Их произведение равно +1 там, где они совпадают, и −1 там, где различаются: это XNOR битов, как два скрещённых поляризатора. Если немного сдвинуть или повернуть одну из них, появляется муар. |
| `moireAngle` | Rotation du second réseau (degrés) | Поворот второй решётки (градусы) |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | Период второй решётки (в % от периода первой) |
| `moireA` | Réseau A | Решётка A |
| `moireB` | Réseau B | Решётка B |
| `moireProduit` | Produit A × B (XNOR) | Произведение A × B (XNOR) |
| `moireAlt` | Produit de deux réseaux de ±1 | Произведение двух решёток ±1 |
| `clesTitre` | Lecture en clés | Чтение в ключах |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | Только показ: ключи записи осей (72 ключа без повторов, чётность считается от угловой клетки, ранг 70), сумма которых воспроизводит фигуру выбранного узора, если это возможно. Страница не утверждает никакой связи между ключом и частотой. |
| `clesNatures.D+` | diagonale x + y | диагональ x + y |
| `clesNatures.D-` | diagonale y − x | диагональ y − x |
| `clesNatures.H` | horizontale | горизонталь |
| `clesNatures.V` | verticale | вертикаль |
| `clesFigure.figure` | Figure du motif | Фигура узора |
| `clesFigure.V` | Classe V (violet) | Класс V (фиолетовый) |
| `clesFigure.O` | Classe O (orange) | Класс O (оранжевый) |
| `clesFigure.M` | Classe M (magenta) | Класс M (пурпурный) |
| `clesActives` | {n} clés actives : {liste} | Активных ключей: {n}: {liste} |
| `clesAucune` | aucune clé (figure vide) | ни одного ключа (пустая фигура) |
| `clesComplement` |  (au complément près) |  (с точностью до дополнения) |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | Эта фигура не является суммой ключей: она лежит вне порождаемого ими пространства. |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | Узор {i} из {n}, коллекция {collection}. |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | Чтение в ключах относится только к порядку 12. |
| `loiTitre` | Loi de fréquence des cercles | Закон частоты кругов |
| `loiChoix.racine` | Échelle compressée pour l'oreille | Шкала, сжатая для слуха |
| `loiChoix.plaque` | Loi de la plaque réelle | Закон реальной пластины |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | Сжатая шкала: f = опорная частота × √K / 2 (начальная настройка). Закон пластины: f = c × K, как у реальной пластины (алюминий 3 мм, 48 см: c = 31,85 Гц). В порядке 12 — от 32 до 2 293 Гц; круги выше 0,9 × частоты Найквиста игнорируются, как и раньше. Детектор атак и слежение за оттенком не меняются. |
| `loiC` | c (Hz par unité de m² + n²) | c (Гц на единицу m² + n²) |
| `figureTitre` | Figure (vues Signes et Lignes) | Фигура (виды «Знаки» и «Линии») |
| `figureChoix.motif` | Du motif retenu | Выбранного узора |
| `figureChoix.son` | Du son | Звука |
| `figureChoix.ecart` | Les deux (écart) | Обе (разность) |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | Выбранного узора: фигура Хладни выбранного узора (начальная настройка). Звука: сумма волн каждого круга, взвешенных по энергии, которую звук в них вкладывает, без обращения к узору. Обе: места, где эти две фигуры различаются. Звук не даёт фаз: они приравниваются к нулю. |
| `sceneTitre` | La scène | Сцена |
| `projection` | Ouvrir une fenêtre de projection | Открыть окно проекции |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | Полный экран всегда запускает утверждённое окно, а не пробу; элементы управления и курсор скрываются через 3 секунды. Esc — вернуться. Окно проекции отдельное: перетащите его на второй экран или проектор. |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | Браузер заблокировал окно проекции. Разрешите всплывающие окна для этого сайта и повторите. |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | Экран остаётся включённым во время воспроизведения, если браузер это позволяет. |
| `enregTitre` | Enregistrer | Запись |
| `enreg` | Enregistrer 15 s | Записать 15 с |
| `enregEnCours` | Enregistrement : {s} s | Запись: {s} с |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16 (Reels, Shorts, TikTok) |
| `format45` | 4:5 (publication) | 4:5 (публикация) |
| `format11` | 1:1 (carré) | 1:1 (квадрат) |
| `formatVideo` | Format de la vidéo | Формат видео |
| `signature` | Bandeau « {texte} » en bas de la vidéo | Полоса «{texte}» внизу видео |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | Видео записано: загрузка началась. |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | Ваш браузер не записывает MP4: видео в формате WebM. Чтобы преобразовать его в MP4 (Instagram, TikTok), пропустите его через конвертер или ffmpeg: ffmpeg -i файл.webm файл.mp4. |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | Звук AAC в MP4: воспроизводится везде (iPhone, QuickTime, приложения для публикации). |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | Этот браузер записывает звук MP4 в Opus: он может не воспроизводиться на iPhone, в QuickTime или в некоторых приложениях для публикации (свежий Chrome для компьютера: AAC). |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | Звук Opus: может не воспроизводиться на iPhone, в QuickTime или в некоторых приложениях для публикации. Чтобы получить дорожку AAC: ffmpeg -i файл.mp4 -c:v copy -c:a aac выход.mp4. |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | Запись видео недоступна в этом браузере. |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | Сначала запустите звук: тишину не записывают. |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | Запись не запускается: {message} |
| `raccourcisTitre` | Raccourcis clavier | Сочетания клавиш |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | Вид пробы: знаки, узловые линии, ячейки |
| `raccourcis.1.0` | Espace | Пробел |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | Следующий режим управления (проба) |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | Пауза изображения |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | Утвердить пробу |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | Полный экран (утверждённое окно) |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | Записать 15 с |
| `infoMotif` | Motif {i} sur {n} | Узор {i} из {n} |
| `infoImages` | {fps} images/s | {fps} кадров/с |
| `infoResolution` | résolution réduite | сниженное разрешение |
| `semaineTitre` | La semaine | Неделя |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | Музыка, созданная с помощью ИИ — MC Claude. |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | Щелчок по афише загружает плеер YouTube или TikTok — сторонний сервис, который при этом получает информацию о вашем визите. До этого ничего не загружается. |
| `jourTitre` | Jour {n} — {tonalite} | День {n} — {tonalite} |
| `datePub` | Publié le {date} | Опубликовано {date} |
| `bientot` | Bientôt | Скоро |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | Воспроизвести видео дня {n}, {tonalite} |
| `lireTiktok` | Lire ici (TikTok) | Смотреть здесь (TikTok) |
| `voirYoutube` | Voir sur YouTube | Смотреть на YouTube |
| `voirTiktok` | Voir sur TikTok | Смотреть в TikTok |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | Афиша дня {n} — {tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | Видео дня {n} |
| `voirAussiTitre` | Voir aussi | Смотрите также |
| `voirAussi.0.href` | /galerie-bicolore.html | /galerie-bicolore.html |
| `voirAussi.0.titre` | Galerie bicolore | Двухцветная галерея |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | Двухцветные узоры, порождённые осями и замыкающиеся на кубе: зерно, замощение, экспорт. (Страница на французском.) |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /galerie-patterns-unifies.html |
| `voirAussi.1.titre` | Galerie tricolore | Трёхцветная галерея |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | Унифицированные узоры, порождённые смешением оттенков: выберите узор, чтобы увидеть его замощение. (Страница на французском.) |
| `voirAussi.2.href` | /fonds-ecran.html | /fonds-ecran.html |
| `voirAussi.2.titre` | Fonds d'écran | Обои |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | Полноэкранные текстильные обои, реагирующие на звук или работающие в медитативном режиме. (Страница на французском.) |
| `voirAussi.3.href` | /galerie-animations.html | /ru/animations/ |
| `voirAussi.3.titre` | Galerie d'animations | Галерея анимаций |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | Анимации коллекций фонов: можно смотреть и скачивать в формате MP4. |
| `voirAussi.4.href` | /chladni.html | /chladni.html |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | Фигуры, звукоряды и частоты: страница, связывающая словарь узоров с модами пластины. (Страница на французском.) |
| `voirAussi.5.href` | /fr/livre/ | /ru/book/ |
| `voirAussi.5.titre` | Le livre | Книга |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès онлайн, страница за страницей, с бесплатным PDF. |

### Voir sa musique — métadonnées de la page

| Clé | Français | Русский |
|---|---|---|
| `titre, h1` | Voir sa musique — La Livrée d'Hermès | Увидеть свою музыку — La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | Увидеть свою музыку: фигура Хладни, которую рисует звук, и узор La Livrée d'Hermès, который больше всего на неё похож. Запишите 15 секунд со звуком. |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | Увидеть свою музыку: фигура Хладни, которую рисует звук, и узор La Livrée d'Hermès, который больше всего на неё похож. |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | Русский |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | Три страницы о звуке |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | Киматика · Звук создаёт форму |
| `trois-portes.musique` | Voir sa musique · Le son guide | Увидеть свою музыку · Звук ведёт |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | Обои · Звук растворяется |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | Русский |
|---|---|---|
| `label` | Voir sa musique | Увидеть свою музыку |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | Выберите композицию, файл или микрофон: страница найдёт узор La Livrée d’Hermès, спектр которого ближе всего к спектру звука. |
