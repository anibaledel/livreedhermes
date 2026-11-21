# Relecture — « Voir sa musique » en 日本語

Généré par `node scripts/build-musique-textes.mjs` depuis `data/musique-chladni/traductions/<langue>.json` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. À relire par un locuteur natif.

Page concernée : « Voir sa musique » (`musique-chladni.html` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir `TODO-RELECTURE.md`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.

## 日本語 (`ja`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | 日本語 |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | 自分の音楽を見る — La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | 自分の音楽を見る：曲、ファイル、またはマイクを選ぶと、音が描くクラドニ図形と、それに最もよく似た La Livrée d'Hermès の紋様が見られます。音とともに15秒間を録画できます。 |
| `ariane` | Voir sa musique | 自分の音楽を見る |
| `h1` | Voir sa musique | 自分の音楽を見る |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Appuyez sur « Écouter » : la page mesure cette énergie, dessine la figure de Chladni du son et cherche, parmi les motifs de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | どんな音楽にも署名があります。エネルギーが周波数ごとにどう分かれているか、ということです。「聴く」を押すと、このページはそのエネルギーを測り、音が描くクラドニ図形を描いて、La Livrée d'Hermès の統一紋様の中から、スペクトルが最もよく似たものを探します。選択の根拠は2つのスペクトルの類似であり、音楽上の法則ではありません。紋様が曲を「表現」するわけではありません。 |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | 何もブラウザの外には出ません。ファイル、マイク、取り込んだ音声はその場で解析され、どこにも送信されません。 |
| `flash` | Attention : les images peuvent changer vite et clignoter. Dans « Plus d'options », le réglage « réduire les changements rapides » les ralentit. | 注意：画像が素早く切り替わったり、点滅したりすることがあります。「オプションを増やす」の中の「急な変化を抑える」設定で、動きがゆるやかになります。 |
| `sonTitre` | Le son | 音 |
| `sonChoix` | Son | 音 |
| `morceau` | Morceau fourni {n} — {note} | 付属の曲 {n} — {note} |
| `notes.j1` | do dièse | 嬰ハ |
| `notes.j2` | la | イ |
| `notes.j3` | ré | ニ |
| `notes.j4` | mi | ホ |
| `notes.j5` | sol | ト |
| `notes.j6` | si | ロ |
| `notes.j7` | do | ハ |
| `tonalites.do dièse mineur` | do dièse mineur | 嬰ハ短調 |
| `tonalites.la mineur` | la mineur | イ短調 |
| `tonalites.ré mineur` | ré mineur | ニ短調 |
| `tonalites.mi mineur` | mi mineur | ホ短調 |
| `tonalites.sol mineur` | sol mineur | ト短調 |
| `tonalites.si mineur` | si mineur | ロ短調 |
| `tonalites.do mineur` | do mineur | ハ短調 |
| `sourceFichier` | Mon fichier audio… | 自分のオーディオファイル… |
| `sourceMicro` | Microphone | マイク |
| `sourceEssai` | Musique d'essai | テスト用の音楽 |
| `sourceOnglet` | Audio d'un onglet | タブの音声 |
| `lecture` | Lecture | 再生 |
| `pause` | Pause | 一時停止 |
| `arreter` | Arrêter | 停止 |
| `ecouter` | Écouter | 聴く |
| `plusOptions` | Plus d'options | オプションを増やす |
| `moinsOptions` | Moins d'options | オプションを減らす |
| `animerFigure` | Animer la figure | 図形を動かす |
| `figerFigure` | Figer la figure | 図形を止める |
| `figureFixeAide` | animation arrêtée (réduction des mouvements demandée) : bouton « Animer la figure » | アニメーションを停止中（動きを減らす設定）：「図形を動かす」ボタン |
| `audioInterrompu` | Le son a été interrompu (appel, autre application, veille). Appuyez sur « Écouter » pour reprendre. | 音が中断されました（通話、他のアプリ、スリープ）。「聴く」を押すと再開します。 |
| `image` | Image | 画像 |
| `imagePrete` | Image enregistrée : le téléchargement a commencé. | 画像を保存しました。ダウンロードが始まりました。 |
| `imageErreur` | Impossible de produire l'image. | 画像を作成できませんでした。 |
| `partager` | Partager | 共有 |
| `partageErreur` | Le partage a échoué : {message} | 共有に失敗しました：{message} |
| `copierLien` | Copier le lien | リンクをコピー |
| `lienCopie` | Lien copié : {lien} | リンクをコピーしました：{lien} |
| `lienManuel` | Copiez ce lien à la main : {lien} | このリンクを手動でコピーしてください：{lien} |
| `appareilTitre` | Informations sur l'appareil | デバイス情報 |
| `appareilAide` | Une ligne de texte à renvoyer à l'auteur en cas de problème : navigateur et système (famille et version seulement), état du son, enregistreur et formats vidéo, partage, écran. Rien n'est envoyé : c'est vous qui la copiez. | 問題が起きたときに作者へ送るための1行のテキストです。ブラウザとシステム（種類とバージョンのみ）、音の状態、録画機能と動画形式、共有、画面。何も送信されません。コピーするのはあなたです。 |
| `appareilLigne` | Informations à copier | コピーする情報 |
| `appareilCopier` | Copier | コピー |
| `appareilCopie` | Informations copiées. | 情報をコピーしました。 |
| `appareilManuel` | Sélectionnez le texte et copiez-le à la main. | テキストを選択して手動でコピーしてください。 |
| `oui` | oui | はい |
| `non` | non | いいえ |
| `appareilSansContexte` | pas encore créé | まだ作成されていません |
| `appareilSansEnregistreur` | enregistreur absent | 録画機能なし |
| `commentTitre` | Comment ça marche | 仕組み |
| `comment1` | La page mesure l'énergie du son aux fréquences des cercles de modes d'une plaque carrée, dessine la figure de Chladni correspondante et cherche, parmi les motifs de La Livrée d'Hermès, celui dont le spectre ressemble le plus à celui du son. | このページは、正方形の板の振動モードの各円の周波数で音のエネルギーを測り、対応するクラドニ図形を描いて、La Livrée d'Hermès の紋様の中から、スペクトルが音のスペクトルに最もよく似たものを探します。 |
| `comment2` | Une figure de Chladni est le dessin que prend le sable sur une plaque qui vibre : il se range le long des lignes qui ne bougent pas. Ici, la plaque est un carré. | クラドニ図形とは、振動する板の上で砂が作る模様のことです。砂は動かない線に沿って集まります。ここでは板は正方形です。 |
| `comment3` | Ici, « ressembler » veut dire que deux spectres sont proches : l'énergie se répartit de la même façon entre les fréquences. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | ここでの「似ている」とは、2つのスペクトルが近いということです。エネルギーが周波数ごとに同じように分かれています。選択の根拠は2つのスペクトルの類似であり、音楽上の法則ではありません。紋様が曲を「表現」するわけではありません。 |
| `comment4` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. Les images et les vidéos enregistrées sont faites dans votre navigateur et se téléchargent sur votre appareil. | 何もブラウザの外には出ません。ファイル、マイク、取り込んだ音声はその場で解析され、どこにも送信されません。録画した画像や動画はお使いのブラウザ内で作られ、お使いのデバイスにダウンロードされます。 |
| `comment5` | Appuyez sur « Écouter » : la page demande alors le micro, jamais avant ; sans micro, elle joue un morceau d'exemple. Vous pouvez aussi choisir un autre morceau ou un fichier audio. Dans « Plus d'options », vous pouvez enregistrer une image de la figure ou une vidéo de 15 secondes avec le son. | 「聴く」を押すと、そのときはじめてマイクの許可を求めます（それより前には求めません）。マイクがない、または許可されない場合は、例の曲を再生します。別の曲や音声ファイルを選ぶこともできます。「オプションを増やす」では、図形の画像や、音付きの15秒の動画を録画できます。 |
| `comment6` | Contenus sous licence CC BY-NC 4.0, code sous licence AGPL v3 (licence commerciale sur demande). Auteur : Anibal Edelberto Amiot. | コンテンツは CC BY-NC 4.0 ライセンス、コードは AGPL v3 ライセンスです（商用ライセンスは要望に応じて提供）。作者：Anibal Edelberto Amiot。 |
| `commentAuteur` | À propos de l'auteur | 作者について |
| `refAlt` | Exemple de figure produite par la page : un damier de grands losanges noirs et crème, avec de petites formes rondes aux croisements. | ページが生成した図形の例：大きな黒とクリーム色の菱形の市松模様で、交点に小さな丸い形があります。 |
| `refLegende` | Exemple réel : après {s} secondes du morceau d'exemple n° {m}, le motif n° {i} sur {n} est celui dont le spectre ressemble le plus à celui du son. | 実際の例：例の曲 {m} を {s} 秒再生したところ、{n} 個の紋様のうち {i} 番目が、音のスペクトルに最もよく似たものです。 |
| `sansJs` | L'écoute demande JavaScript : activez-le pour entendre un morceau et voir la figure bouger. Le texte et l'image d'exemple ci-dessous se lisent sans lui. | 聴くには JavaScript が必要です。有効にすると曲が聞こえ、図形が動くのが見えます。下の文章と例の画像は、JavaScript なしでも読めます。 |
| `figureAria` | Figure du motif retenu : {nom} | 選ばれた紋様の図形：{nom} |
| `entree` | Entrée audio | オーディオ入力 |
| `entreeDefaut` | Entrée par défaut | 既定の入力 |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | ミキサー、サウンドカード：接続し、マイクを許可してから、ここで選んでください。 |
| `sensibilite` | Seuil des attaques | アタックのしきい値 |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | 平均を上回る標準偏差で表します。低いほど、音の変化に敏感になります。 |
| `intervalle` | Intervalle minimal entre deux attaques (s) | 2つのアタックの最小間隔（秒） |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | 既定は 0.45 秒で、1分あたり最大およそ133回のアタックです。速いテンポでは下げてください。 |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | 付属の曲は AI の助けを借りて作曲されています（「MC Claude が AI で作曲した音楽。」）。 |
| `etatDepart` | Appuyez sur Écouter : le micro est demandé à ce moment-là, ou choisissez un morceau. Les morceaux fournis sont composés avec l'aide de l'IA. | 「聴く」を押してください。そのときマイクの許可を求めます。曲を選ぶこともできます。付属の曲は AI の助けを借りて作曲されています。 |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | 付属の曲。AI の助けを借りて作曲されています。 |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | ファイル：{nom}（ブラウザの中にとどまります）。 |
| `etatMicro` | Micro actif. | マイクがオンです。 |
| `etatEntree` | Entrée « {nom} » active. | 入力「{nom}」がオンです。 |
| `etatOnglet` | Audio d'un onglet actif. | タブの音声がオンです。 |
| `etatEssai` | Musique d'essai. | テスト用の音楽。 |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Écouter. Vous pouvez aussi choisir un fichier ou un morceau. | マイクが拒否されました。サイトの設定（アドレスの左の鍵のアイコン）で許可してから、もう一度「聴く」を押してください。ファイルや付属の曲を選ぶこともできます。 |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | この端末で使えるマイクがありません。 |
| `erreurMicro` | Le micro ne démarre pas : {message} | マイクが起動しません：{message} |
| `microRepliRefuse` | Le micro est refusé : voici un morceau d'exemple à la place. Pour utiliser le micro, autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), choisissez « Microphone » dans la liste des sources, puis appuyez sur Écouter. | マイクが許可されなかったため、代わりに例の曲を再生しています。マイクを使うには、サイトの設定（アドレスの左の鍵のアイコン）で許可し、音源の一覧で「マイク」を選んでから「聴く」を押してください。 |
| `microRepliAbsent` | Aucun micro n'est disponible sur cet appareil : voici un morceau d'exemple à la place. | この端末では使えるマイクがないため、代わりに例の曲を再生しています。 |
| `microRepliAutre` | Le micro ne démarre pas ({message}) : voici un morceau d'exemple à la place. | マイクを開始できません（{message}）。代わりに例の曲を再生しています。 |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | ここではタブの音声を取り込めません。最新のデスクトップ用ブラウザ（Chrome、Edge）が必要で、モバイルと Safari では使えません。 |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | 選んだタブから音が届きませんでした。もう一度やり直し、「タブの音声を共有」にチェックを入れてください。 |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | このファイルは音として読み込めません。 |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | 音を開始できません：{message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | ページのデータを読み込めません：{message} |
| `bandeManque` | le fond « {id} » manque à la collection de fonds | 背景コレクションに背景「{id}」がありません |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | 音源が停止しました（機器が外されたか、許可が取り消されました）。 |
| `silence` | Silence : lancez un son. | 無音：音を再生してください。 |
| `valide` | Validé | 確定済み |
| `valideTag` | en cours | 現在 |
| `essai` | Essai | 試用 |
| `essaiTag` | aperçu | プレビュー |
| `validerEssai` | Valider l'essai | 試用を確定 |
| `annuler` | Annuler | キャンセル |
| `pleinEcran` | Plein écran | 全画面 |
| `quitterPleinEcran` | Quitter le plein écran | 全画面を終了 |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | 暗い背景：確定済み。金色の枠：試用中。選択肢にカーソルを合わせると試用で確認でき、クリックで保持し、その後「試用を確定」を押します。 |
| `fenetreValide` | Fenêtre validée | 確定済みのウィンドウ |
| `fenetreEssai` | Fenêtre d'essai | 試用ウィンドウ |
| `basculeValide` | Validé | 確定済み |
| `basculeEssai` | Essai | 試用 |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | このブラウザでは全画面を使えません。 |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | このブラウザは、この要素にネイティブの全画面を提供していません。ステージがウィンドウ全体を覆います。Esc キーまたはボタンで閉じます。 |
| `groupes.mode` | Pilotage du son | 音による制御 |
| `groupes.fmt` | Format (ordre) | 形式（次数） |
| `groupes.col` | Collection | コレクション |
| `groupes.view` | Vue | 表示 |
| `groupes.fond` | Variante de case | マスの変種 |
| `groupes.pal` | Couleurs | 色 |
| `modes.image.0` | Le son définit l'image | 音が像を決める |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | 各瞬間に、スペクトルが音楽のスペクトルに最もよく似た紋様を表示します。 |
| `modes.rythme.0` | Le son définit le rythme | 音がリズムを決める |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | 音符のアタックごとに、近さの連鎖を1歩進みます。 |
| `modes.chemin.0` | Le son guide le chemin | 音が道筋を導く |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | リズムが「いつ」を、スペクトルが「どの隣へ」を決めます。 |
| `modes.octaves.0` | Le son suit l'octave | 音がオクターブをたどる |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | アタックごとに、主音の軌道を1歩進みます。円 K、次にそのオクターブ 4K、次に 16K…（これらの円が存在する場合）。 |
| `vues.signes.0` | Signes | 符号 |
| `vues.signes.1` | Les zones positives de la figure du motif. | 紋様の図形の正の領域。 |
| `vues.lignes.0` | Lignes nodales | 節線 |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | 紋様の図形がゼロになる線。 |
| `vues.pavage.0` | Cellules | セル |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | 紋様そのもの。2 × 2 の敷き詰め。 |
| `format.titre` | Ordre {n} | {n} 次 |
| `format.detail` | Grille de {g} × {g} cases | {g} × {g} マスのグリッド |
| `format.bientot` | Ordre {n} (seconde livraison) | {n} 次（第2回の納品） |
| `chargementOrdre` | Chargement de l'ordre {n}… | {n} 次を読み込んでいます… |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | {n} 次のデータを読み込めません：{message} |
| `collections.tri.0` | Tricolore — motifs unifiés | 三色 — 統一紋様 |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} 個の紋様（互いに異なる 12 × 12 のグリッド） |
| `collections.bi.0` | Bicolore — motifs unifiés | 二色 — 統一紋様 |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} 個の紋様（2つの鏡。10月3日の規則で読めます） |
| `collections.ce.0` | Bicolore — symétrie centrale | 二色 — 中心対称 |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} 個の紋様（180° の中心対称のみ。10月3日の規則で読めます） |
| `collections.b1971128.0` | Bloc 1971128 | ブロック 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} 個の紋様 |
| `collections.b16012838.0` | Bloc 16012838 | ブロック 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} 個の紋様 |
| `collections.b3016090.0` | Bloc 3016090 | ブロック 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} 個の紋様 |
| `collections.f613.0` | Famille 613 | 族 613 |
| `collections.f613.1` | {n} motifs | {n} 個の紋様 |
| `collections.f18.0` | Famille 18 | 族 18 |
| `collections.f18.1` | {n} motifs | {n} 個の紋様 |
| `collections.fpilote.0` | Famille pilote | 先導の族 |
| `collections.fpilote.1` | {n} motifs | {n} 個の紋様 |
| `collections.p18.0` | Croix 1·2 | 十字 1·2 |
| `collections.p18.1` | {n} motifs | {n} 個の紋様 |
| `collections.p30.0` | Croix 1·2 | 十字 1·2 |
| `collections.p30.1` | {n} motifs | {n} 個の紋様 |
| `fondNoms.P` | Aplat | 無地 |
| `fondNoms.B2Dx` | Triangles | 三角形 |
| `fondNoms.B11211Dx` | Bandes | ストライプ |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec le fond choisi, ou avec ses deux couleurs échangées. | 1つのマスには4つの三角形があり、それぞれ選んだ背景で、または2色を入れ替えて描かれます。 |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | マスの変種は二色のコレクションにのみ適用されます。 |
| `palettes.creme.0` | Encre et crème | 墨とクリーム |
| `palettes.creme.1` | Les couleurs du site. | サイトの色。 |
| `palettes.monochrome.0` | Gris et blanc | グレーと白 |
| `palettes.monochrome.1` | Le monochrome du site. | サイトのモノクロ。 |
| `palettes.perso.0` | Mes couleurs | 自分の色 |
| `palettes.perso.1` | Choisissez le motif et le fond. | 紋様と背景を選びます。 |
| `palettes.son.0` | La teinte suit le son | 色合いが音に従う |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | 色合いが音の明るさに合わせてゆっくり移ります（既定ではオフ）。 |
| `persoMotif` | Motif | 紋様 |
| `persoFond` | Fond | 背景 |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | 三色では、V が最も暗く（墨）、O が中間のグレー、M が最も明るい（クリーム）色です。 |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | その場での設定 |
| `lissage` | Lissage | 平滑化 |
| `pulsationTitre` | Pulsation | 拍動 |
| `pulsations.attaque` | À chaque attaque | アタックごと |
| `pulsations.temps` | À chaque temps | 拍ごと |
| `pulsations.quatre` | Toutes les 4 pulsations | 4拍ごと |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | 既定ではアタックごとに切り替わります。規則的な拍動が検出されると、拍ごと、または4拍ごとに切り替えられます。 |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | 拍動を検出：毎分 {bpm}。 |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | 今のところ、規則的な拍動は検出されていません。 |
| `calme` | Réduire les changements rapides | 急な変化を抑える |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | フェードが長くなり、保持も長くなります。システムがアニメーションの軽減を求めている場合は、最初からオンです。 |
| `pente` | Compenser la pente des graves | 低音の傾斜を補正する |
| `pauseImage` | Pause de l'image | 画像を一時停止 |
| `optionsTitre` | Options | オプション |
| `comprendreTitre` | Pour comprendre | 理解のために |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | 音とは関係のない、学習用の2つの表示。 |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | モード (4, 0) とその縮退した対 |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | 正方形の板では、モード (4, 0) と (0, 4) は同じ周波数を持ちます。その任意の組み合わせも、その周波数のモードです。スライダーは cos(4πx/a) + cos(4πy/a)（右）から cos(4πx/a) − cos(4πy/a)（左）まで動き、中央では cos(4πx/a) のみ、つまり縦線だけが残ります。明るい領域と暗い領域は符号が逆で、線は節線です。 |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | 混合 s：cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | 縮退した対と混ぜたモード (4, 0) の図形 |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | パリティを2つの ±1 格子の重ね合わせとして見る |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | 各格子は市松模様で、マス (i, j) のパリティ (−1)^(i + j) です。2つの積は、一致するところで +1、異なるところで −1 になります。これはビットの XNOR で、直交した2枚の偏光板のようなものです。一方を少しずらしたり回したりすると、モアレが現れます。 |
| `moireAngle` | Rotation du second réseau (degrés) | 2つ目の格子の回転（度） |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | 2つ目の格子の周期（1つ目に対する %） |
| `moireA` | Réseau A | 格子 A |
| `moireB` | Réseau B | 格子 B |
| `moireProduit` | Produit A × B (XNOR) | 積 A × B（XNOR） |
| `moireAlt` | Produit de deux réseaux de ±1 | 2つの ±1 格子の積 |
| `clesTitre` | Lecture en clés | 鍵による読み取り |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | 表示のみ：軸の記法の鍵（重複を除いた72個の鍵、パリティは隅のマスから数え、階数70）のうち、その和が選んだ紋様の図形になるもの（存在する場合）。このページは、鍵と周波数の間にいかなる関係も主張しません。 |
| `clesNatures.D+` | diagonale x + y | 対角線 x + y |
| `clesNatures.D-` | diagonale y − x | 対角線 y − x |
| `clesNatures.H` | horizontale | 水平 |
| `clesNatures.V` | verticale | 垂直 |
| `clesFigure.figure` | Figure du motif | 紋様の図形 |
| `clesFigure.V` | Classe V (violet) | クラス V（紫） |
| `clesFigure.O` | Classe O (orange) | クラス O（オレンジ） |
| `clesFigure.M` | Classe M (magenta) | クラス M（マゼンタ） |
| `clesActives` | {n} clés actives : {liste} | 有効な鍵 {n} 個：{liste} |
| `clesAucune` | aucune clé (figure vide) | 鍵なし（空の図形） |
| `clesComplement` |  (au complément près) | （補集合を除いて） |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | この図形は鍵の和ではありません。鍵が生成する空間の外にあります。 |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | 紋様 {i} / {n}、コレクション {collection}。 |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | 鍵による読み取りは12次にのみ適用されます。 |
| `loiTitre` | Loi de fréquence des cercles | 円の周波数の法則 |
| `loiChoix.racine` | Échelle compressée pour l'oreille | 耳のために圧縮した目盛り |
| `loiChoix.plaque` | Loi de la plaque réelle | 実際の板の法則 |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | 圧縮した目盛り：f = 基準周波数 × √K / 2（初期設定）。板の法則：f = c × K。実際の板（厚さ3 mm、48 cm のアルミ：c = 31.85 Hz）と同じです。12次では 32 〜 2 293 Hz。ナイキスト周波数の 0.9 倍を超える円は、従来どおり無視されます。アタック検出器と色合いの追従は変わりません。 |
| `loiC` | c (Hz par unité de m² + n²) | c（m² + n² の単位あたりの Hz） |
| `figureTitre` | Figure (vues Signes et Lignes) | 図形（符号と線の表示） |
| `figureChoix.motif` | Du motif retenu | 選んだ紋様の |
| `figureChoix.son` | Du son | 音の |
| `figureChoix.ecart` | Les deux (écart) | 両方（差） |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | 選んだ紋様の：選んだ紋様のクラドニ図形（初期設定）。音の：各円の波の和を、音がそこに込めるエネルギーで重み付けしたもの（紋様を経由しません）。両方：この2つの図形が異なる場所。音から位相は得られないため、位相はゼロに置かれます。 |
| `sceneTitre` | La scène | ステージ |
| `projection` | Ouvrir une fenêtre de projection | 投影ウィンドウを開く |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | 全画面は常に確定済みのウィンドウを起動し、試用は起動しません。操作部とカーソルは3秒後に隠れます。Esc で戻ります。投影ウィンドウは別ウィンドウで、2台目の画面やプロジェクターにドラッグできます。 |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | 投影ウィンドウがブラウザにブロックされました。このサイトのポップアップを許可してから、もう一度お試しください。 |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | ブラウザが許可すれば、再生中は画面が点灯したままになります。 |
| `enregTitre` | Enregistrer | 録画 |
| `enreg` | Enregistrer 15 s | 15秒録画 |
| `enregEnCours` | Enregistrement : {s} s | 録画中：{s} 秒 |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16（Reels、Shorts、TikTok） |
| `format45` | 4:5 (publication) | 4:5（投稿） |
| `format11` | 1:1 (carré) | 1:1（正方形） |
| `formatVideo` | Format de la vidéo | 動画の形式 |
| `signature` | Bandeau « {texte} » en bas de la vidéo | 動画の下部に「{texte}」の帯を入れる |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | 動画を録画しました。ダウンロードが始まりました。 |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | お使いのブラウザは MP4 を書き出せません。動画は WebM 形式です。MP4 に変換する（Instagram、TikTok）には、変換ツールか ffmpeg を使ってください：ffmpeg -i ファイル.webm ファイル.mp4。 |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | MP4 の AAC 音声：どこでも再生できます（iPhone、QuickTime、投稿アプリ）。 |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | このブラウザは MP4 の音声を Opus で書き出します。iPhone、QuickTime、一部の投稿アプリでは再生できないことがあります（最新のデスクトップ版 Chrome：AAC）。 |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | Opus 音声：iPhone、QuickTime、一部の投稿アプリでは再生できないことがあります。AAC のトラックにするには：ffmpeg -i ファイル.mp4 -c:v copy -c:a aac 出力.mp4。 |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | このブラウザでは動画の録画を使えません。 |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | 先に音を再生してください。無音は録画できません。 |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | 録画を開始できません：{message} |
| `raccourcisTitre` | Raccourcis clavier | キーボードショートカット |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | 試用の表示：符号、節線、セル |
| `raccourcis.1.0` | Espace | スペース |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | 次の制御モード（試用） |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | 画像を一時停止 |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | 試用を確定 |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | 全画面（確定済みのウィンドウ） |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | 15秒録画 |
| `infoMotif` | Motif {i} sur {n} | 紋様 {i} / {n} |
| `infoImages` | {fps} images/s | {fps} コマ/秒 |
| `infoResolution` | résolution réduite | 解像度を下げています |
| `semaineTitre` | La semaine | 今週 |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | MC Claude が AI で作曲した音楽。 |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | ポスターをクリックすると、YouTube または TikTok のプレーヤーが読み込まれます。これは第三者のサービスで、その時点であなたの訪問を受け取ります。それまでは何も読み込まれません。 |
| `jourTitre` | Jour {n} — {tonalite} | {n} 日目 — {tonalite} |
| `datePub` | Publié le {date} | {date} 公開 |
| `bientot` | Bientôt | 近日公開 |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | {n} 日目の動画を再生、{tonalite} |
| `lireTiktok` | Lire ici (TikTok) | ここで再生（TikTok） |
| `voirYoutube` | Voir sur YouTube | YouTube で見る |
| `voirTiktok` | Voir sur TikTok | TikTok で見る |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | {n} 日目のポスター — {tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | {n} 日目の動画 |
| `voirAussiTitre` | Voir aussi | 関連ページ |
| `voirAussi.0.href` | /galerie-bicolore.html | /galerie-bicolore.html |
| `voirAussi.0.titre` | Galerie bicolore | 二色ギャラリー |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | 軸から生まれ、立方体上で閉じる二色紋様：粒度、敷き詰め、書き出し。（フランス語のページ） |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /galerie-patterns-unifies.html |
| `voirAussi.1.titre` | Galerie tricolore | 三色ギャラリー |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | 色合いの混合から生まれた統一紋様。紋様を選ぶと、その敷き詰めを見られます。（フランス語のページ） |
| `voirAussi.2.href` | /fonds-ecran.html | /fonds-ecran.html |
| `voirAussi.2.titre` | Fonds d'écran | 壁紙 |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | フルスクリーンの織物壁紙。音に反応するモードと瞑想モードがあります。（フランス語のページ） |
| `voirAussi.3.href` | /galerie-animations.html | /ja/animations/ |
| `voirAussi.3.titre` | Galerie d'animations | アニメーションギャラリー |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | 背景コレクションのアニメーション。視聴と MP4 でのダウンロードができます。 |
| `voirAussi.4.href` | /chladni.html | /chladni.html |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | 図形、音階、周波数：紋様の語彙を板のモードに結びつけるページ。（フランス語のページ） |
| `voirAussi.5.href` | /fr/livre/ | /ja/book/ |
| `voirAussi.5.titre` | Le livre | 本 |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès をオンラインで1ページずつ読めます。PDF は無料です。 |

### Voir sa musique — métadonnées de la page

| Clé | Français | 日本語 |
|---|---|---|
| `titre, h1` | Voir sa musique : figure de Chladni — La Livrée d'Hermès | 自分の音楽を見る — La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | 自分の音楽を見る：音が描くクラドニ図形と、それに最もよく似た La Livrée d'Hermès の紋様。音とともに15秒間を録画できます。 |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | 自分の音楽を見る：音が描くクラドニ図形と、それに最もよく似た La Livrée d'Hermès の紋様。 |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | 日本語 |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | 音の3つのページ |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | キマティクス · 音が形をつくる |
| `trois-portes.musique` | Voir sa musique · Le son guide | 自分の音楽を見る · 音が導く |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | 壁紙 · 音が退く |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | 日本語 |
|---|---|---|
| `label` | Voir sa musique | 自分の音楽を見る |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | 曲、ファイル、またはマイクを選ぶと、スペクトルが音に最も近い La Livrée d’Hermès の紋様をページが探します。 |

### Page « Outils » (`data/outils-langues/outils-support.json`)

| Clé | Français | 日本語 |
|---|---|---|
| `titre` | Outils | ツール |
| `description` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | La Livrée d'Hermès のインタラクティブなツール：作る、見る、印刷する、暗号化する。 |
| `intro` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | La Livrée d'Hermès のインタラクティブなツール：作る、見る、印刷する、暗号化する。「（フランス語のページ）」と記したページは、まだ翻訳されていません。 |
| `note « page en français »` | — | （フランス語のページ） |
| `Accueil (fil d'Ariane)` | Accueil | トップ |

### Page « Soutenir »

| Clé | Français | 日本語 |
|---|---|---|
| `titre` | Soutenir | 支援する |
| `description` | Soutenir La Livrée d'Hermès à prix libre : le site et tout son contenu restent entièrement gratuits. | La Livrée d'Hermès を好きな金額で支援できます。サイトとそのすべての内容は引き続き完全に無料です。 |
| `intro` | Tout est libre. Le traité, les motifs et les fichiers produits par les outils se téléchargent sans condition, sous licence CC BY-NC 4.0. Votre soutien, à prix libre, finance la suite du projet : de nouveaux motifs, de nouveaux outils, le volet textile. | すべて自由です。論考、紋様、ツールが生成するファイルは、条件なしでダウンロードでき、CC BY-NC 4.0 ライセンスです。好きな金額での支援は、これからのこと、つまり新しい紋様、新しいツール、織物の仕事の資金になります。 |
| `bouton` | Aller à la page française pour payer | フランス語のページで支払う |
| `note` | Le paiement est sécurisé par Stripe. Montant libre, don facultatif. | 支払いは Stripe で安全に処理されます。金額は自由で、寄付は任意です。支払いページはフランス語です。 |
| `h2` | Ce que finance votre soutien | 支援の使い道 |
| `b` | Le temps de recherche, de développement et de traduction | 研究・開発・翻訳の時間 |
| `p` | La construction des motifs, des outils du site et leur documentation en quatre langues. | 紋様、サイトのツール、そしてそれらの文書を複数の言語で整える作業。 |
