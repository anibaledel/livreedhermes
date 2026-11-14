# Relecture — « Voir sa musique » en ไทย

Généré par `node scripts/build-musique-textes.mjs` depuis `data/musique-chladni/traductions/<langue>.json` ; **ne pas éditer ici** : corriger la traduction dans le fichier JSON de la langue, puis relancer le script. À relire par un locuteur natif.

Page concernée : « Voir sa musique » (`musique-chladni.html` et ses versions traduites). Traduction faite par IA, à relire par un lecteur natif (voir `TODO-RELECTURE.md`). Les {noms} entre accolades se remplacent à l'affichage et restent tels quels ; les noms propres (Chladni, La Livrée d'Hermès, MC Claude) ne se traduisent pas ; la dernière section (« Voir aussi ») donne aussi l'adresse de chaque carte.

## ไทย (`th`)

### Voir sa musique — interface (`assets/musique-chladni-textes.js`)

| Clé | Français | ไทย |
|---|---|---|
| `titrePage` | Voir sa musique — La Livrée d'Hermès | มองเห็นดนตรีของคุณ — La Livrée d'Hermès |
| `description` | Voir sa musique : choisissez un morceau, un fichier ou le micro, et regardez la figure de Chladni que dessine le son, puis le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | มองเห็นดนตรีของคุณ: เลือกเพลง ไฟล์ หรือไมโครโฟน แล้วดูรูปแบบของ Chladni ที่เสียงวาดขึ้น จากนั้นดูลวดลายของ La Livrée d'Hermès ที่คล้ายกับมันที่สุด บันทึกวิดีโอพร้อมเสียง 15 วินาที |
| `ariane` | Voir sa musique | มองเห็นดนตรีของคุณ |
| `h1` | Voir sa musique | มองเห็นดนตรีของคุณ |
| `intro` | Chaque musique a une signature : la façon dont son énergie se répartit entre les fréquences. Choisissez un morceau, un fichier ou le micro : la page mesure cette énergie aux fréquences de chaque cercle de modes d'une plaque carrée, puis cherche, parmi les motifs unifiés de La Livrée d'Hermès, celui dont le spectre lui ressemble le plus. Le choix repose sur la ressemblance de deux spectres, pas sur une loi musicale : un motif n'« exprime » pas un morceau. | ดนตรีทุกชิ้นมีลายเซ็นของตัวเอง คือวิธีที่พลังงานของมันกระจายไปตามความถี่ต่าง ๆ เลือกเพลง ไฟล์ หรือไมโครโฟน หน้านี้จะวัดพลังงานนั้นที่ความถี่ของวงโหมดแต่ละวงของแผ่นสี่เหลี่ยมจัตุรัส แล้วค้นหาในบรรดาลวดลายรวมเป็นหนึ่งของ La Livrée d'Hermès ว่าลายใดมีสเปกตรัมคล้ายกับเสียงมากที่สุด การเลือกอาศัยความคล้ายกันของสเปกตรัมสองชุด ไม่ใช่กฎทางดนตรี ลวดลายหนึ่งไม่ได้ “แสดงออก” ถึงบทเพลงหนึ่ง |
| `discretion` | Rien ne quitte votre navigateur : le fichier, le micro et l'audio capturé sont analysés sur place et ne sont envoyés nulle part. | ไม่มีสิ่งใดออกจากเบราว์เซอร์ของคุณ: ไฟล์ ไมโครโฟน และเสียงที่จับได้ จะถูกวิเคราะห์ในเครื่องและไม่ถูกส่งไปที่ใดเลย |
| `flash` | Attention : les images peuvent changer vite et clignoter. Le réglage « réduire les changements rapides » les ralentit. | คำเตือน: ภาพอาจเปลี่ยนเร็วและกะพริบ ตัวเลือก “ลดการเปลี่ยนแปลงที่รวดเร็ว” จะทำให้ช้าลง |
| `sonTitre` | Le son | เสียง |
| `sonChoix` | Son | เสียง |
| `morceau` | Morceau fourni {n} — {note} | เพลงที่มีให้ {n} — {note} |
| `notes.j1` | do dièse | โดชาร์ป |
| `notes.j2` | la | ลา |
| `notes.j3` | ré | เร |
| `notes.j4` | mi | มี |
| `notes.j5` | sol | ซอล |
| `notes.j6` | si | ซี |
| `notes.j7` | do | โด |
| `tonalites.do dièse mineur` | do dièse mineur | โดชาร์ปไมเนอร์ |
| `tonalites.la mineur` | la mineur | ลาไมเนอร์ |
| `tonalites.ré mineur` | ré mineur | เรไมเนอร์ |
| `tonalites.mi mineur` | mi mineur | มีไมเนอร์ |
| `tonalites.sol mineur` | sol mineur | ซอลไมเนอร์ |
| `tonalites.si mineur` | si mineur | ซีไมเนอร์ |
| `tonalites.do mineur` | do mineur | โดไมเนอร์ |
| `sourceFichier` | Mon fichier audio… | ไฟล์เสียงของฉัน… |
| `sourceMicro` | Microphone | ไมโครโฟน |
| `sourceEssai` | Musique d'essai | เพลงทดลอง |
| `sourceOnglet` | Audio d'un onglet | เสียงจากแท็บ |
| `lecture` | Lecture | เล่น |
| `pause` | Pause | หยุดชั่วคราว |
| `arreter` | Arrêter | หยุด |
| `entree` | Entrée audio | อินพุตเสียง |
| `entreeDefaut` | Entrée par défaut | อินพุตเริ่มต้น |
| `entreeAide` | Table de mixage, carte son : branchez-la, autorisez le micro, puis choisissez-la ici. | มิกเซอร์ การ์ดเสียง: เสียบอุปกรณ์ อนุญาตให้ใช้ไมโครโฟน แล้วเลือกที่นี่ |
| `sensibilite` | Seuil des attaques | เกณฑ์การจับจังหวะโน้ต |
| `sensibiliteAide` | En écarts-types au-dessus de la moyenne : plus bas, plus sensible aux changements de notes. | เป็นจำนวนส่วนเบี่ยงเบนมาตรฐานที่สูงกว่าค่าเฉลี่ย: ยิ่งต่ำ ยิ่งไวต่อการเปลี่ยนโน้ต |
| `intervalle` | Intervalle minimal entre deux attaques (s) | ระยะห่างต่ำสุดระหว่างจังหวะโน้ตสองครั้ง (วินาที) |
| `intervalleAide` | 0,45 s par défaut : au plus environ 133 attaques par minute. Baissez-le pour un tempo rapide. | ค่าเริ่มต้น 0.45 วินาที: มากที่สุดราว 133 ครั้งต่อนาที ลดค่าลงสำหรับจังหวะเร็ว |
| `mentionIA` | Les morceaux fournis sont composés avec l'aide de l'IA (« Musique composée avec l'IA par MC Claude. »). | เพลงที่มีให้แต่งขึ้นด้วยความช่วยเหลือของ AI (“Musique composée avec l'IA par MC Claude.” หรือ “ดนตรีที่แต่งด้วย AI โดย MC Claude”) |
| `etatDepart` | Appuyez sur Lecture. Les morceaux fournis sont composés avec l'aide de l'IA. | กดเล่น เพลงที่มีให้แต่งขึ้นด้วยความช่วยเหลือของ AI |
| `etatMorceau` | Morceau fourni, composé avec l'aide de l'IA. | เพลงที่มีให้ แต่งขึ้นด้วยความช่วยเหลือของ AI |
| `etatFichier` | Fichier : {nom} (il reste dans votre navigateur). | ไฟล์: {nom} (อยู่ในเบราว์เซอร์ของคุณเท่านั้น) |
| `etatMicro` | Micro actif. | ไมโครโฟนทำงานอยู่ |
| `etatEntree` | Entrée « {nom} » active. | อินพุต “{nom}” ทำงานอยู่ |
| `etatOnglet` | Audio d'un onglet actif. | เสียงจากแท็บทำงานอยู่ |
| `etatEssai` | Musique d'essai. | เพลงทดลอง |
| `erreurMicroRefuse` | Le micro est refusé. Autorisez-le dans les réglages du site (le cadenas, à gauche de l'adresse), puis cliquez de nouveau sur Lecture. Vous pouvez aussi choisir un fichier ou un morceau. | ไมโครโฟนถูกปฏิเสธ โปรดอนุญาตในการตั้งค่าของเว็บไซต์ (รูปแม่กุญแจทางซ้ายของที่อยู่) แล้วกดเล่นอีกครั้ง หรือเลือกไฟล์หรือเพลงที่มีให้ก็ได้ |
| `erreurMicroAbsent` | Aucun micro n'est disponible sur cet appareil. | อุปกรณ์นี้ไม่มีไมโครโฟนให้ใช้ |
| `erreurMicro` | Le micro ne démarre pas : {message} | ไมโครโฟนไม่เริ่มทำงาน: {message} |
| `erreurOnglet` | La capture d'audio d'un onglet n'est pas possible ici. Elle demande un navigateur de bureau récent (Chrome, Edge) ; elle manque sur mobile et sur Safari. | ไม่สามารถจับเสียงจากแท็บที่นี่ได้ ต้องใช้เบราว์เซอร์บนคอมพิวเตอร์รุ่นใหม่ (Chrome, Edge) ซึ่งไม่มีบนมือถือและบน Safari |
| `erreurOngletSansSon` | L'onglet choisi n'a pas fourni de son. Recommencez et cochez « Partager l'audio de l'onglet ». | แท็บที่เลือกไม่ได้ส่งเสียงมา โปรดเริ่มใหม่และติ๊ก “แชร์เสียงของแท็บ” |
| `erreurFichier` | Ce fichier ne peut pas être lu comme un son. | ไฟล์นี้ไม่สามารถอ่านเป็นเสียงได้ |
| `erreurAudio` | Le son ne peut pas démarrer : {message} | เสียงไม่เริ่มทำงาน: {message} |
| `erreurDonnees` | Les données de la page ne se chargent pas : {message} | ข้อมูลของหน้าโหลดไม่ได้: {message} |
| `bandeManque` | la bande {id} manque à la collection de fonds | ชุดพื้นหลังขาดแถบ {id} |
| `microCoupe` | La source s'est arrêtée (périphérique débranché ou autorisation retirée). | แหล่งเสียงหยุดทำงาน (ถอดอุปกรณ์ออกหรือถูกเพิกถอนสิทธิ์) |
| `silence` | Silence : lancez un son. | เงียบ: โปรดเริ่มเล่นเสียง |
| `valide` | Validé | ยืนยันแล้ว |
| `valideTag` | en cours | ปัจจุบัน |
| `essai` | Essai | ทดลอง |
| `essaiTag` | aperçu | ตัวอย่าง |
| `validerEssai` | Valider l'essai | ยืนยันการทดลอง |
| `annuler` | Annuler | ยกเลิก |
| `pleinEcran` | Plein écran | เต็มหน้าจอ |
| `quitterPleinEcran` | Quitter le plein écran | ออกจากโหมดเต็มหน้าจอ |
| `fenetresAide` | Fond sombre : validé. Cadre doré : en essai. Survolez une option pour la voir dans l'essai, cliquez pour la garder, puis « Valider l'essai ». | พื้นหลังเข้ม: ยืนยันแล้ว กรอบสีทอง: กำลังทดลอง เลื่อนเมาส์ไปที่ตัวเลือกเพื่อดูในหน้าต่างทดลอง คลิกเพื่อเก็บไว้ แล้วกด “ยืนยันการทดลอง” |
| `fenetreValide` | Fenêtre validée | หน้าต่างที่ยืนยันแล้ว |
| `fenetreEssai` | Fenêtre d'essai | หน้าต่างทดลอง |
| `basculeValide` | Validé | ยืนยันแล้ว |
| `basculeEssai` | Essai | ทดลอง |
| `pleinEcranIndispo` | Le plein écran n'est pas disponible dans ce navigateur. | เบราว์เซอร์นี้ไม่รองรับโหมดเต็มหน้าจอ |
| `pleinEcranRepli` | Ce navigateur ne propose pas le plein écran natif pour cet élément : la scène couvre la fenêtre. Échap ou le bouton la referme. | เบราว์เซอร์นี้ไม่มีโหมดเต็มหน้าจอแบบเนทีฟสำหรับองค์ประกอบนี้: เวทีจะครอบคลุมทั้งหน้าต่าง กด Esc หรือปุ่มเพื่อปิด |
| `groupes.mode` | Pilotage du son | การควบคุมด้วยเสียง |
| `groupes.fmt` | Format (ordre) | รูปแบบ (อันดับ) |
| `groupes.col` | Collection | ชุดลวดลาย |
| `groupes.view` | Vue | มุมมอง |
| `groupes.fond` | Variante de case | แบบของช่อง |
| `groupes.pal` | Couleurs | สี |
| `modes.image.0` | Le son définit l'image | เสียงกำหนดภาพ |
| `modes.image.1` | À chaque instant, le motif dont le spectre ressemble le plus à celui de la musique. | ทุกขณะ เลือกลวดลายที่สเปกตรัมคล้ายกับของดนตรีมากที่สุด |
| `modes.rythme.0` | Le son définit le rythme | เสียงกำหนดจังหวะ |
| `modes.rythme.1` | Un pas dans la chaîne de proximité à chaque attaque de note. | ก้าวไปหนึ่งก้าวบนสายความใกล้เคียงทุกครั้งที่มีจังหวะโน้ต |
| `modes.chemin.0` | Le son guide le chemin | เสียงนำทาง |
| `modes.chemin.1` | Le rythme décide quand, le spectre décide vers quel voisin. | จังหวะตัดสินว่าเมื่อไร สเปกตรัมตัดสินว่าไปหาเพื่อนบ้านตัวไหน |
| `modes.octaves.0` | Le son suit l'octave | เสียงตามอ็อกเทฟ |
| `modes.octaves.1` | À chaque attaque, un pas sur l'orbite de la note dominante : le cercle K, puis son octave 4K, puis 16K…, quand ces cercles existent. | ทุกครั้งที่มีจังหวะโน้ต ก้าวไปหนึ่งก้าวตามวงโคจรของโน้ตเด่น: วง K แล้วอ็อกเทฟ 4K แล้ว 16K… เมื่อวงเหล่านั้นมีอยู่ |
| `vues.signes.0` | Signes | เครื่องหมาย |
| `vues.signes.1` | Les zones positives de la figure du motif. | บริเวณค่าบวกของรูปแบบของลวดลาย |
| `vues.lignes.0` | Lignes nodales | เส้นโหนด |
| `vues.lignes.1` | Les lignes où la figure du motif s'annule. | เส้นที่รูปแบบของลวดลายมีค่าเป็นศูนย์ |
| `vues.pavage.0` | Cellules | เซลล์ |
| `vues.pavage.1` | Le motif lui-même, en pavage 2 × 2. | ตัวลวดลายเอง ปูลายแบบ 2 × 2 |
| `format.titre` | Ordre {n} | อันดับ {n} |
| `format.detail` | Grille de {g} × {g} cases | ตาราง {g} × {g} ช่อง |
| `format.bientot` | Ordre {n} (seconde livraison) | อันดับ {n} (ส่งมอบครั้งที่สอง) |
| `chargementOrdre` | Chargement de l'ordre {n}… | กำลังโหลดอันดับ {n}… |
| `ordreIndisponible` | Les données de l'ordre {n} ne se chargent pas : {message} | ข้อมูลของอันดับ {n} โหลดไม่ได้: {message} |
| `collections.tri.0` | Tricolore — motifs unifiés | สามสี — ลวดลายรวมเป็นหนึ่ง |
| `collections.tri.1` | {n} motifs (grilles 12 × 12 distinctes) | {n} ลวดลาย (ตาราง 12 × 12 ที่ไม่ซ้ำกัน) |
| `collections.bi.0` | Bicolore — motifs unifiés | สองสี — ลวดลายรวมเป็นหนึ่ง |
| `collections.bi.1` | {n} motifs (deux miroirs, lisibles par la règle du 3 octobre) | {n} ลวดลาย (กระจกสองบาน อ่านได้ตามกฎของวันที่ 3 ตุลาคม) |
| `collections.ce.0` | Bicolore — symétrie centrale | สองสี — สมมาตรศูนย์กลาง |
| `collections.ce.1` | {n} motifs (symétrie centrale à 180° seule, lisibles par la règle du 3 octobre) | {n} ลวดลาย (สมมาตรศูนย์กลาง 180° เพียงอย่างเดียว อ่านได้ตามกฎของวันที่ 3 ตุลาคม) |
| `collections.b1971128.0` | Bloc 1971128 | บล็อก 1971128 |
| `collections.b1971128.1` | {n} motifs | {n} ลวดลาย |
| `collections.b16012838.0` | Bloc 16012838 | บล็อก 16012838 |
| `collections.b16012838.1` | {n} motifs | {n} ลวดลาย |
| `collections.b3016090.0` | Bloc 3016090 | บล็อก 3016090 |
| `collections.b3016090.1` | {n} motifs | {n} ลวดลาย |
| `collections.f613.0` | Famille 613 | ตระกูล 613 |
| `collections.f613.1` | {n} motifs | {n} ลวดลาย |
| `collections.f18.0` | Famille 18 | ตระกูล 18 |
| `collections.f18.1` | {n} motifs | {n} ลวดลาย |
| `collections.fpilote.0` | Famille pilote | ตระกูลนำร่อง |
| `collections.fpilote.1` | {n} motifs | {n} ลวดลาย |
| `collections.p18.0` | Croix 1·2 | กากบาท 1·2 |
| `collections.p18.1` | {n} motifs | {n} ลวดลาย |
| `collections.p30.0` | Croix 1·2 | กากบาท 1·2 |
| `collections.p30.1` | {n} motifs | {n} ลวดลาย |
| `fond` | Bandes {id} | แถบ {id} |
| `fondAide` | Une case porte quatre triangles ; chacun est dessiné avec l'état 1 du fond, ou avec l'état 0 : le même fond tourné de 90°. | หนึ่งช่องมีสามเหลี่ยมสี่รูป แต่ละรูปวาดด้วยสถานะ 1 ของพื้นหลัง หรือสถานะ 0 คือพื้นหลังเดียวกันที่หมุน 90° |
| `fondSeulementBicolore` | La variante de case ne s'applique qu'à la collection bicolore. | แบบของช่องใช้ได้กับชุดลวดลายสองสีเท่านั้น |
| `palettes.creme.0` | Encre et crème | หมึกกับสีครีม |
| `palettes.creme.1` | Les couleurs du site. | สีของเว็บไซต์ |
| `palettes.monochrome.0` | Gris et blanc | เทากับขาว |
| `palettes.monochrome.1` | Le monochrome du site. | โทนสีเดียวของเว็บไซต์ |
| `palettes.perso.0` | Mes couleurs | สีของฉัน |
| `palettes.perso.1` | Choisissez le motif et le fond. | เลือกสีของลวดลายและสีพื้นหลัง |
| `palettes.son.0` | La teinte suit le son | โทนสีตามเสียง |
| `palettes.son.1` | La teinte glisse lentement avec la brillance du son (désactivée par défaut). | โทนสีเลื่อนไหลช้า ๆ ตามความสว่างของเสียง (ปิดไว้เป็นค่าเริ่มต้น) |
| `persoMotif` | Motif | ลวดลาย |
| `persoFond` | Fond | พื้นหลัง |
| `tricoloreAide` | En tricolore : V le plus sombre (encre), O gris moyen, M le plus clair (crème). | ในโหมดสามสี: V เข้มที่สุด (หมึก) O เทากลาง M อ่อนที่สุด (ครีม) |
| `legendeFenetre` | {mode} · {collection} · {vue}{fond} · {palette} | {mode} · {collection} · {vue}{fond} · {palette} |
| `reglagesTitre` | Réglages à la volée | การตั้งค่าขณะเล่น |
| `lissage` | Lissage | การทำให้เรียบ |
| `pulsationTitre` | Pulsation | ชีพจรจังหวะ |
| `pulsations.attaque` | À chaque attaque | ทุกจังหวะโน้ต |
| `pulsations.temps` | À chaque temps | ทุกจังหวะตบ |
| `pulsations.quatre` | Toutes les 4 pulsations | ทุก 4 จังหวะ |
| `pulsationAide` | Par défaut, un changement à chaque attaque. Quand une pulsation régulière est détectée, vous pouvez changer à chaque temps ou toutes les 4 pulsations. | โดยปกติเปลี่ยนทุกครั้งที่มีจังหวะโน้ต เมื่อตรวจพบชีพจรจังหวะที่สม่ำเสมอ คุณเลือกเปลี่ยนทุกจังหวะตบหรือทุก 4 จังหวะได้ |
| `pulsationDetectee` | Pulsation détectée : {bpm} par minute. | ตรวจพบชีพจรจังหวะ: {bpm} ต่อนาที |
| `pulsationAucune` | Aucune pulsation régulière détectée pour l'instant. | ยังไม่พบชีพจรจังหวะที่สม่ำเสมอ |
| `calme` | Réduire les changements rapides | ลดการเปลี่ยนแปลงที่รวดเร็ว |
| `calmeAide` | Un fondu plus long et une tenue plus grande. Activé d'office si votre système demande moins d'animations. | เฟดนานขึ้นและค้างไว้นานขึ้น เปิดโดยอัตโนมัติหากระบบของคุณขอให้ลดภาพเคลื่อนไหว |
| `pente` | Compenser la pente des graves | ชดเชยความลาดของเสียงต่ำ |
| `pauseImage` | Pause de l'image | หยุดภาพ |
| `optionsTitre` | Options | ตัวเลือก |
| `comprendreTitre` | Pour comprendre | เพื่อความเข้าใจ |
| `comprendreAide` | Deux vues pédagogiques, sans lien avec le son. | มุมมองเพื่อการเรียนรู้สองแบบ ไม่เกี่ยวข้องกับเสียง |
| `paireTitre` | Le mode (4, 0) et sa paire dégénérée | โหมด (4, 0) และคู่ลดรูปของมัน |
| `paireAide` | Sur une plaque carrée, les modes (4, 0) et (0, 4) ont la même fréquence : toute combinaison est aussi un mode de cette fréquence. Le curseur passe de cos(4πx/a) + cos(4πy/a) (à droite) à cos(4πx/a) − cos(4πy/a) (à gauche) ; au milieu, il ne reste que cos(4πx/a), des lignes verticales. Zones claires et sombres : signes opposés ; trait : ligne nodale. | บนแผ่นสี่เหลี่ยมจัตุรัส โหมด (4, 0) และ (0, 4) มีความถี่เท่ากัน การรวมกันใด ๆ ของทั้งสองจึงเป็นโหมดของความถี่นั้นด้วย แถบเลื่อนไล่จาก cos(4πx/a) + cos(4πy/a) (ขวา) ไปเป็น cos(4πx/a) − cos(4πy/a) (ซ้าย) ตรงกลางเหลือเพียง cos(4πx/a) เป็นเส้นตั้ง บริเวณสว่างและมืด: เครื่องหมายตรงข้ามกัน เส้น: เส้นโหนด |
| `paireMelange` | Mélange s : cos(4πx/a) + s · cos(4πy/a) | ผสม s: cos(4πx/a) + s · cos(4πy/a) |
| `paireAlt` | Figure du mode (4, 0) mélangé à sa paire dégénérée | รูปแบบของโหมด (4, 0) ที่ผสมกับคู่ลดรูปของมัน |
| `moireTitre` | La parité comme superposition de deux réseaux de ±1 | พาริตีในฐานะการซ้อนกันของโครงตาข่าย ±1 สองชุด |
| `moireAide` | Chaque réseau est un damier : la parité (−1)^(i + j) de la case (i, j). Leur produit vaut +1 là où les deux s'accordent et −1 là où ils diffèrent : c'est le XNOR des bits, comme deux polariseurs croisés. En décalant ou en tournant un peu l'un des deux, il apparaît un moiré. | โครงตาข่ายแต่ละชุดคือกระดานหมากรุก: พาริตี (−1)^(i + j) ของช่อง (i, j) ผลคูณของทั้งสองเป็น +1 ตรงที่ตรงกัน และเป็น −1 ตรงที่ต่างกัน คือ XNOR ของบิต เหมือนโพลาไรเซอร์สองแผ่นที่วางตั้งฉากกัน ถ้าเลื่อนหรือหมุนชุดใดชุดหนึ่งเล็กน้อยจะเกิดลายมัวเร |
| `moireAngle` | Rotation du second réseau (degrés) | การหมุนของโครงตาข่ายชุดที่สอง (องศา) |
| `moirePeriode` | Période du second réseau (en % de celle du premier) | คาบของโครงตาข่ายชุดที่สอง (เป็น % ของชุดแรก) |
| `moireA` | Réseau A | โครงตาข่าย A |
| `moireB` | Réseau B | โครงตาข่าย B |
| `moireProduit` | Produit A × B (XNOR) | ผลคูณ A × B (XNOR) |
| `moireAlt` | Produit de deux réseaux de ±1 | ผลคูณของโครงตาข่าย ±1 สองชุด |
| `clesTitre` | Lecture en clés | การอ่านเป็นกุญแจ |
| `clesAide` | Affichage seul : les clés de la note des axes (72 clés dédoublonnées, parité comptée depuis la case d'angle, rang 70) dont la somme redonne la figure du motif retenu, quand elle existe. La page n'affirme aucun lien entre une clé et une fréquence. | แสดงผลเท่านั้น: กุญแจของบันทึกแกน (72 กุญแจที่ตัดตัวซ้ำออกแล้ว นับพาริตีจากช่องมุม อันดับ 70) ซึ่งผลรวมคืนรูปแบบของลวดลายที่เลือกเมื่อทำได้ หน้านี้ไม่ได้ยืนยันความเกี่ยวข้องใด ๆ ระหว่างกุญแจกับความถี่ |
| `clesNatures.D+` | diagonale x + y | เส้นทแยง x + y |
| `clesNatures.D-` | diagonale y − x | เส้นทแยง y − x |
| `clesNatures.H` | horizontale | แนวนอน |
| `clesNatures.V` | verticale | แนวตั้ง |
| `clesFigure.figure` | Figure du motif | รูปแบบของลวดลาย |
| `clesFigure.V` | Classe V (violet) | คลาส V (ม่วง) |
| `clesFigure.O` | Classe O (orange) | คลาส O (ส้ม) |
| `clesFigure.M` | Classe M (magenta) | คลาส M (บานเย็น) |
| `clesActives` | {n} clés actives : {liste} | กุญแจที่ใช้งาน {n} ดอก: {liste} |
| `clesAucune` | aucune clé (figure vide) | ไม่มีกุญแจ (รูปแบบว่าง) |
| `clesComplement` |  (au complément près) |  (ต่างกันไม่เกินส่วนเติมเต็ม) |
| `clesHors` | Cette figure n'est pas la somme de clés : elle sort de l'espace qu'elles engendrent. | รูปแบบนี้ไม่ใช่ผลรวมของกุญแจ: อยู่นอกปริภูมิที่กุญแจเหล่านั้นสร้างขึ้น |
| `clesMotif` | Motif {i} sur {n}, collection {collection}. | ลวดลายที่ {i} จาก {n} ชุดลวดลาย {collection} |
| `clesOrdre12` | La lecture en clés ne porte que sur l'ordre 12. | การอ่านเป็นกุญแจใช้ได้กับอันดับ 12 เท่านั้น |
| `loiTitre` | Loi de fréquence des cercles | กฎความถี่ของวงกลม |
| `loiChoix.racine` | Échelle compressée pour l'oreille | สเกลที่บีบอัดเพื่อหู |
| `loiChoix.plaque` | Loi de la plaque réelle | กฎของแผ่นจริง |
| `loiAide` | Échelle compressée : f = fréquence de référence × √K / 2 (réglage de départ). Loi de la plaque : f = c × K, comme une plaque réelle (aluminium de 3 mm, 48 cm : c = 31,85 Hz). À l'ordre 12, de 32 à 2 293 Hz ; les cercles au-delà de 0,9 × la fréquence de Nyquist sont ignorés, comme avant. Le détecteur d'attaques et le suivi de teinte ne changent pas. | สเกลที่บีบอัด: f = ความถี่อ้างอิง × √K / 2 (ค่าตั้งต้น) กฎของแผ่น: f = c × K เหมือนแผ่นจริง (อะลูมิเนียมหนา 3 มม. 48 ซม.: c = 31.85 เฮิรตซ์) ที่อันดับ 12 ตั้งแต่ 32 ถึง 2 293 เฮิรตซ์ วงที่เกิน 0.9 × ความถี่ไนควิสต์จะถูกละเลยเหมือนเดิม ตัวตรวจจับจังหวะโน้ตและการติดตามโทนสีไม่เปลี่ยน |
| `loiC` | c (Hz par unité de m² + n²) | c (เฮิรตซ์ต่อหนึ่งหน่วยของ m² + n²) |
| `figureTitre` | Figure (vues Signes et Lignes) | รูปแบบ (มุมมองเครื่องหมายและเส้น) |
| `figureChoix.motif` | Du motif retenu | ของลวดลายที่เลือก |
| `figureChoix.son` | Du son | ของเสียง |
| `figureChoix.ecart` | Les deux (écart) | ทั้งสอง (ส่วนต่าง) |
| `figureAide` | Du motif retenu : la figure de Chladni du motif choisi (réglage de départ). Du son : la somme des ondes de chaque cercle, pondérées par l'énergie que le son y met, sans passer par un motif. Les deux : les endroits où ces deux figures diffèrent. Le son ne livre pas les phases : elles sont mises à zéro. | ของลวดลายที่เลือก: รูปแบบของ Chladni ของลวดลายที่เลือก (ค่าตั้งต้น) ของเสียง: ผลรวมของคลื่นแต่ละวง ถ่วงน้ำหนักด้วยพลังงานที่เสียงใส่ลงไป โดยไม่ผ่านลวดลาย ทั้งสอง: ตำแหน่งที่รูปแบบทั้งสองต่างกัน เสียงไม่ให้เฟส จึงตั้งเป็นศูนย์ |
| `sceneTitre` | La scène | เวที |
| `projection` | Ouvrir une fenêtre de projection | เปิดหน้าต่างฉาย |
| `sceneAide` | Le plein écran lance toujours la fenêtre validée, jamais l'essai ; les commandes et le curseur se masquent au bout de 3 secondes. Échap pour revenir. La fenêtre de projection est séparée : à glisser sur un second écran ou un projecteur. | โหมดเต็มหน้าจอจะเปิดหน้าต่างที่ยืนยันแล้วเสมอ ไม่ใช่หน้าต่างทดลอง ปุ่มควบคุมและเคอร์เซอร์จะซ่อนหลังผ่านไป 3 วินาที กด Esc เพื่อกลับ หน้าต่างฉายแยกต่างหาก: ลากไปไว้บนจอที่สองหรือโปรเจกเตอร์ |
| `projectionBloquee` | La fenêtre de projection a été bloquée par le navigateur. Autorisez les fenêtres surgissantes pour ce site, puis recommencez. | เบราว์เซอร์บล็อกหน้าต่างฉาย โปรดอนุญาตหน้าต่างป๊อปอัปสำหรับเว็บไซต์นี้ แล้วลองใหม่ |
| `veille` | L'écran reste allumé pendant la lecture quand le navigateur le permet. | หน้าจอจะติดอยู่ระหว่างเล่นเมื่อเบราว์เซอร์อนุญาต |
| `enregTitre` | Enregistrer | บันทึก |
| `enreg` | Enregistrer 15 s | บันทึก 15 วินาที |
| `enregEnCours` | Enregistrement : {s} s | กำลังบันทึก: {s} วินาที |
| `format916` | 9:16 (Reels, Shorts, TikTok) | 9:16 (Reels, Shorts, TikTok) |
| `format45` | 4:5 (publication) | 4:5 (โพสต์) |
| `format11` | 1:1 (carré) | 1:1 (สี่เหลี่ยมจัตุรัส) |
| `formatVideo` | Format de la vidéo | รูปแบบวิดีโอ |
| `signature` | Bandeau « {texte} » en bas de la vidéo | แถบ “{texte}” ที่ด้านล่างของวิดีโอ |
| `enregPret` | Vidéo enregistrée : le téléchargement a commencé. | บันทึกวิดีโอแล้ว: เริ่มดาวน์โหลดแล้ว |
| `enregWebm` | Votre navigateur n'écrit pas de MP4 : la vidéo est au format WebM. Pour la convertir en MP4 (Instagram, TikTok), passez-la par un convertisseur ou par ffmpeg : ffmpeg -i fichier.webm fichier.mp4. | เบราว์เซอร์ของคุณไม่เขียนไฟล์ MP4: วิดีโอเป็นรูปแบบ WebM หากต้องการแปลงเป็น MP4 (Instagram, TikTok) ให้ใช้ตัวแปลงไฟล์หรือ ffmpeg: ffmpeg -i ไฟล์.webm ไฟล์.mp4 |
| `enregAac` | Audio AAC dans le MP4 : lisible partout (iPhone, QuickTime, applications de publication). | เสียง AAC ในไฟล์ MP4: เล่นได้ทุกที่ (iPhone, QuickTime, แอปสำหรับเผยแพร่) |
| `enregOpusAvant` | Ce navigateur écrit l'audio du MP4 en Opus : il peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication (Chrome de bureau récent : AAC). | เบราว์เซอร์นี้เขียนเสียงของ MP4 เป็น Opus: อาจเล่นไม่ได้บน iPhone, QuickTime หรือแอปเผยแพร่บางตัว (Chrome บนคอมพิวเตอร์รุ่นใหม่: AAC) |
| `enregOpus` | Audio Opus : peut ne pas se lire sur iPhone, QuickTime ou certaines applications de publication. Pour une piste AAC : ffmpeg -i fichier.mp4 -c:v copy -c:a aac sortie.mp4. | เสียง Opus: อาจเล่นไม่ได้บน iPhone, QuickTime หรือแอปเผยแพร่บางตัว หากต้องการแทร็ก AAC: ffmpeg -i ไฟล์.mp4 -c:v copy -c:a aac ผลลัพธ์.mp4 |
| `enregIndispo` | L'enregistrement vidéo n'est pas disponible dans ce navigateur. | เบราว์เซอร์นี้ไม่รองรับการบันทึกวิดีโอ |
| `enregSansSource` | Lancez d'abord un son : on n'enregistre pas le silence. | โปรดเริ่มเล่นเสียงก่อน: จะไม่บันทึกความเงียบ |
| `enregErreur` | L'enregistrement ne démarre pas : {message} | การบันทึกไม่เริ่มทำงาน: {message} |
| `raccourcisTitre` | Raccourcis clavier | ปุ่มลัดบนแป้นพิมพ์ |
| `raccourcis.0.0` | 1 – 3 | 1 – 3 |
| `raccourcis.0.1` | Vue de l'essai : signes, lignes nodales, cellules | มุมมองของหน้าต่างทดลอง: เครื่องหมาย เส้นโหนด เซลล์ |
| `raccourcis.1.0` | Espace | Space |
| `raccourcis.1.1` | Mode de pilotage suivant (essai) | โหมดควบคุมถัดไป (ทดลอง) |
| `raccourcis.2.0` | P | P |
| `raccourcis.2.1` | Pause de l'image | หยุดภาพ |
| `raccourcis.3.0` | V | V |
| `raccourcis.3.1` | Valider l'essai | ยืนยันการทดลอง |
| `raccourcis.4.0` | F | F |
| `raccourcis.4.1` | Plein écran (fenêtre validée) | เต็มหน้าจอ (หน้าต่างที่ยืนยันแล้ว) |
| `raccourcis.5.0` | R | R |
| `raccourcis.5.1` | Enregistrer 15 s | บันทึก 15 วินาที |
| `infoMotif` | Motif {i} sur {n} | ลวดลายที่ {i} จาก {n} |
| `infoImages` | {fps} images/s | {fps} ภาพ/วินาที |
| `infoResolution` | résolution réduite | ลดความละเอียด |
| `semaineTitre` | La semaine | สัปดาห์นี้ |
| `semaineMention` | Musique composée avec l'IA par MC Claude. | ดนตรีที่แต่งด้วย AI โดย MC Claude |
| `semaineTiers` | Un clic sur une affiche charge le lecteur de YouTube ou de TikTok : un service tiers, qui reçoit alors votre visite. Rien n'est chargé avant. | การคลิกโปสเตอร์จะโหลดเครื่องเล่นของ YouTube หรือ TikTok ซึ่งเป็นบริการของบุคคลที่สามที่จะได้รับการเข้าชมของคุณ ก่อนหน้านั้นจะไม่มีการโหลดสิ่งใด |
| `jourTitre` | Jour {n} — {tonalite} | วันที่ {n} — {tonalite} |
| `datePub` | Publié le {date} | เผยแพร่เมื่อ {date} |
| `bientot` | Bientôt | เร็ว ๆ นี้ |
| `lire` | Lire la vidéo du jour {n}, {tonalite} | เล่นวิดีโอของวันที่ {n} {tonalite} |
| `lireTiktok` | Lire ici (TikTok) | เล่นที่นี่ (TikTok) |
| `voirYoutube` | Voir sur YouTube | ดูบน YouTube |
| `voirTiktok` | Voir sur TikTok | ดูบน TikTok |
| `afficheAlt` | Affiche du jour {n} — {tonalite} | โปสเตอร์ของวันที่ {n} — {tonalite} |
| `lecteurTitre` | Vidéo du jour {n} | วิดีโอของวันที่ {n} |
| `voirAussiTitre` | Voir aussi | ดูเพิ่มเติม |
| `voirAussi.0.href` | /galerie-bicolore.html | /th/two-colour-gallery/ |
| `voirAussi.0.titre` | Galerie bicolore | แกลเลอรีสองสี |
| `voirAussi.0.texte` | Les motifs bicolores engendrés par les axes, fermés sur le cube : maille, pavage, export. | ลวดลายสองสีที่สร้างจากแกนและปิดบนลูกบาศก์: เกรนการอ่าน การปูลาย การส่งออก |
| `voirAussi.1.href` | /galerie-patterns-unifies.html | /th/three-colour-gallery/ |
| `voirAussi.1.titre` | Galerie tricolore | แกลเลอรีสามสี |
| `voirAussi.1.texte` | Les motifs unifiés, engendrés par mélange de teintes : sélectionnez un motif pour voir son pavage. | ลวดลายรวมเป็นหนึ่งที่สร้างจากการผสมโทนสี: เลือกลวดลายเพื่อดูการปูลาย |
| `voirAussi.2.href` | /fonds-ecran.html | /th/wallpapers/ |
| `voirAussi.2.titre` | Fonds d'écran | วอลเปเปอร์ |
| `voirAussi.2.texte` | Des fonds textiles plein écran, réactifs au son ou en mode méditatif. | วอลเปเปอร์ผ้าเต็มหน้าจอ ตอบสนองต่อเสียงหรืออยู่ในโหมดสมาธิ |
| `voirAussi.3.href` | /galerie-animations.html | /th/animations/ |
| `voirAussi.3.titre` | Galerie d'animations | แกลเลอรีแอนิเมชัน |
| `voirAussi.3.texte` | Les animations des collections de fonds, à regarder et à télécharger en MP4. | แอนิเมชันของชุดพื้นหลัง สำหรับดูและดาวน์โหลดเป็น MP4 |
| `voirAussi.4.href` | /chladni.html | /th/chladni/ |
| `voirAussi.4.titre` | Chladni | Chladni |
| `voirAussi.4.texte` | Figures, gammes et fréquences : la page qui relie le vocabulaire des motifs aux modes d'une plaque. | รูปแบบ บันไดเสียง และความถี่: หน้าที่เชื่อมคำศัพท์ของลวดลายเข้ากับโหมดของแผ่น |
| `voirAussi.5.href` | /fr/livre/ | /th/book/ |
| `voirAussi.5.titre` | Le livre | หนังสือ |
| `voirAussi.5.texte` | La Livrée d'Hermès en ligne, page par page, avec le PDF gratuit. | La Livrée d'Hermès ออนไลน์ ทีละหน้า พร้อม PDF ฟรี |

### Voir sa musique — métadonnées de la page

| Clé | Français | ไทย |
|---|---|---|
| `titre, h1` | Voir sa musique — La Livrée d'Hermès | มองเห็นดนตรีของคุณ — La Livrée d'Hermès |
| `og:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. Enregistrez 15 secondes avec le son. | มองเห็นดนตรีของคุณ: รูปแบบของ Chladni ที่เสียงวาดขึ้น และลวดลายของ La Livrée d'Hermès ที่คล้ายกับมันที่สุด บันทึกวิดีโอพร้อมเสียง 15 วินาที |
| `twitter:description` | Voir sa musique : la figure de Chladni que dessine le son, et le motif de La Livrée d'Hermès qui lui ressemble le plus. | มองเห็นดนตรีของคุณ: รูปแบบของ Chladni ที่เสียงวาดขึ้น และลวดลายของ La Livrée d'Hermès ที่คล้ายกับมันที่สุด |

### Barre « Trois portes » (`assets/trois-portes.js`)

| Clé | Français | ไทย |
|---|---|---|
| `trois-portes.titre` | Les trois pages sonores | สามหน้าแห่งเสียง |
| `trois-portes.chladni` | Cymatique · Le son crée la forme | ไซมาติกส์ · เสียงสร้างรูปทรง |
| `trois-portes.musique` | Voir sa musique · Le son guide | มองเห็นดนตรีของคุณ · เสียงเป็นผู้นำทาง |
| `trois-portes.fonds` | Fond d'écran · Le son s'efface | วอลเปเปอร์ · เสียงค่อย ๆ จางหาย |

### Tuile de navigation « Voir sa musique » (`scripts/nav-tiles-libelles.js`)

| Clé | Français | ไทย |
|---|---|---|
| `label` | Voir sa musique | มองเห็นดนตรีของคุณ |
| `excerpt` | Choisissez un morceau, un fichier ou le micro : la page cherche le motif de La Livrée d’Hermès dont le spectre ressemble le plus à celui du son. | เลือกเพลง ไฟล์ หรือไมโครโฟน: หน้านี้จะค้นหาลวดลายของ La Livrée d’Hermès ที่สเปกตรัมใกล้เคียงกับเสียงมากที่สุด |

### Page « Outils » (`data/outils-langues/outils-support.json`)

| Clé | Français | ไทย |
|---|---|---|
| `titre` | Outils | เครื่องมือ |
| `description` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | เครื่องมือแบบโต้ตอบของ La Livrée d'Hermès — ประพันธ์ ดูภาพ พิมพ์ เข้ารหัส |
| `intro` | Les outils interactifs de La Livrée d'Hermès — composer, visualiser, imprimer, chiffrer. | เครื่องมือแบบโต้ตอบของ La Livrée d'Hermès — ประพันธ์ ดูภาพ พิมพ์ เข้ารหัส หน้าที่ระบุ “(หน้าภาษาฝรั่งเศส)” ยังไม่ได้แปล |
| `note « page en français »` | — | (หน้าภาษาฝรั่งเศส) |
| `Accueil (fil d'Ariane)` | Accueil | หน้าแรก |

### Page « Soutenir »

| Clé | Français | ไทย |
|---|---|---|
| `titre` | Soutenir | สนับสนุน |
| `description` | Soutenir La Livrée d'Hermès à prix libre : le site et tout son contenu restent entièrement gratuits. | สนับสนุน La Livrée d'Hermès ในราคาที่คุณกำหนดเอง เว็บไซต์และเนื้อหาทั้งหมดยังคงเป็นของฟรี |
| `intro` | Tout est libre. Le traité, les motifs et les fichiers produits par les outils se téléchargent sans condition, sous licence CC BY-NC 4.0. Votre soutien, à prix libre, finance la suite du projet : de nouveaux motifs, de nouveaux outils, le volet textile. | ทุกอย่างเป็นของเปิด ตำรา ลวดลาย และไฟล์ที่เครื่องมือสร้างขึ้นดาวน์โหลดได้โดยไม่มีเงื่อนไข ภายใต้สัญญาอนุญาต CC BY-NC 4.0 การสนับสนุนของคุณในราคาที่คุณกำหนดเอง ช่วยหนุนสิ่งที่จะตามมา: ลวดลายใหม่ เครื่องมือใหม่ และงานด้านสิ่งทอ |
| `bouton` | Aller à la page française pour payer | ไปที่หน้าภาษาฝรั่งเศสเพื่อชำระเงิน |
| `note` | Le paiement est sécurisé par Stripe. Montant libre, don facultatif. | การชำระเงินปลอดภัยด้วย Stripe จำนวนเงินกำหนดเอง การบริจาคเป็นไปตามความสมัครใจ หน้าชำระเงินเป็นภาษาฝรั่งเศส |
| `h2` | Ce que finance votre soutien | การสนับสนุนของคุณช่วยอะไร |
| `b` | Le temps de recherche, de développement et de traduction | เวลาสำหรับการวิจัย การพัฒนา และการแปล |
| `p` | La construction des motifs, des outils du site et leur documentation en quatre langues. | การสร้างลวดลาย เครื่องมือของเว็บไซต์ และเอกสารประกอบเป็นสี่ภาษา |
