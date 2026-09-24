# Traductions manquantes — page Cymatique (`cymatique.html`)

Chaque clé ci-dessous existe dans `UI.fr` et `UI.en` du fichier
`cymatique.html` (objet `UI`, juste après `<script type="module">`).

**Les 29 clés d'origine sont intégrées en FR/EN/ES/TH.** Ce qui reste :
les cinq clés du sélecteur d'échelle (`echelleLabel`,
`echelleProportionnelle`, `echelleOrdinale`, `echelleProportionnelleHelp`,
`echelleOrdinaleHelp`), `diapasonNote`, et deux clés nouvelles au
2026-09-21 (`genT1`, `genBandes`, les étiquettes des deux générations
affichées côte à côte pour chaque gamme) — intégrées en FR/EN, en repli
sur le texte FR pour ES et TH en attendant leur traduction ci-dessous.

`diapasonNote` et les deux `echelle*Help` ont changé de contenu une
troisième fois, au 2026-09-21 : chaque gamme porte désormais deux
mesures — T1 et bandes, mesurées séparément sur les SVG sources plutôt
que sur un seul jeu de masques — et l'ancrage proportionnel est recalé
sur la vraie étendue mesurée (128 Hz à 9216 Hz, seize valeurs distinctes
au lieu de neuf). Toute traduction ES/TH faite sur une version antérieure
du texte (do 256 Hz/f=2,56×k_pic², ou même la version do 128 Hz à neuf
valeurs du 2026-09-19) est à refaire, pas à corriger.

Terminologie alignée sur celle déjà en place dans `es/libro/` et
`th/book/` : Inicio / Crear un motivo / Impresión ; หน้าแรก / สร้างลวดลาย /
การพิมพ์.

Les entités `&nbsp;` sont conservées à l'identique, y compris leur
position en début ou fin de chaîne.

---

## echelleLabel
- FR : Échelle
- EN : Scale

## echelleProportionnelle
- FR : Proportionnelle
- EN : Proportional

## echelleOrdinale
- FR : Ordinale
- EN : Ordinal

## echelleProportionnelleHelp
- FR : f = 128 × k² — de do 128 Hz à ré9 9216 Hz, rapports exacts entre motifs.
- EN : f = 128 × k² — from C 128 Hz to D 9216 Hz, exact ratios between patterns.
- ES : à traduire (contenu changé au 2026-09-21, voir remarque en tête de fichier)
- TH : à traduire (contenu changé au 2026-09-21, voir remarque en tête de fichier)

## echelleOrdinaleHelp
- FR : les seize valeurs étalées par rang, de do 128 Hz à do 256 Hz — comparaison immédiate.
- EN : the sixteen values spread by rank, from C 128 Hz to C 256 Hz — immediate comparison.
- ES : à traduire (contenu changé au 2026-09-21, voir remarque en tête de fichier)
- TH : à traduire (contenu changé au 2026-09-21, voir remarque en tête de fichier)

## genT1
(étiquette devant la valeur T1 de chaque gamme, dans la liste et le détail — nouveau au 2026-09-21)
- FR : T1 :
- EN : T1:
- ES : à traduire
- TH : à traduire

## genBandes
(étiquette devant la valeur bandes de chaque gamme — nouveau au 2026-09-21)
- FR : bandes :
- EN : bandes:
- ES : à traduire
- TH : à traduire

## diapasonNote (nouveau contenu, remplace la version 2026-09-19)
(texte de cadrage, placé près du sélecteur de gamme — même ton que `framing`)
- FR : Le diapason retenu ici, pour les deux échelles, prend pour repère le do à 128 Hz — une octave sous le do à 256 Hz que Joseph Sauveur propose en 1713 devant l'Académie royale des sciences, pour une raison simple : doubler 1 plusieurs fois de suite place toutes les octaves sur des nombres entiers. On l'a appelé le diapason philosophique. Chaque gamme porte deux valeurs, mesurées séparément sur ses deux générations — T1 et bandes — dont les fréquences spatiales dominantes se chevauchent largement plutôt que de former deux registres distincts : les seize valeurs mesurées (les carrés de fréquence spatiale, réunies des deux générations) sont elles-mêmes des entiers, et dans l'échelle proportionnelle, chaque valeur tombe alors exactement à 128 fois un entier, sans reste. Un autre diapason conviendrait aussi bien ; celui-ci rend la structure lisible.
- EN : The reference pitch used here, for both scales, is C at 128 Hz — one octave below the C at 256 Hz that Joseph Sauveur proposed in 1713 before the Royal Academy of Sciences, for a simple reason: doubling 1 repeatedly places every octave on a whole number. It became known as the philosophical pitch. Each scale carries two values, measured separately on its two generations — T1 and bandes — whose dominant spatial frequencies overlap substantially rather than forming two separate registers: the sixteen measured values (the squared spatial frequencies, combined from both generations) are themselves whole numbers, and on the proportional scale, each value then lands exactly on 128 times a whole number, with no remainder. Another reference pitch would work just as well; this one makes the structure legible.
- ES : à traduire (contenu changé au 2026-09-21, voir remarque en tête de fichier)
- TH : à traduire (contenu changé au 2026-09-21, voir remarque en tête de fichier)

---

## pageTitle
- FR : Cymatique — gammes et fréquences
- EN : Cymatics — scales and frequencies
- ES : Cimática — escalas y frecuencias
- TH : ไซแมติกส์ — บันไดเสียงและความถี่

## framing
(mis à jour le 2026-09-19 : "étalée sur une octave" n'est plus vrai pour
les deux échelles depuis l'ajout de l'échelle proportionnelle — remplacé
par une formulation neutre. ES/TH corrigés directement, changement
ponctuel d'un segment technique, pas une nouvelle traduction complète.)
- FR : La correspondance ci-dessous est construite, pas physique : elle repose sur la fréquence spatiale dominante de chaque gamme, mesurée par transformée de Fourier — pas sur une loi qui prédirait ce qu'une plaque ou une eau vibrante ferait apparaître. Une figure de Chladni dépend de la géométrie du récipient, de la profondeur, de la tension superficielle ; rien ici ne le remplace. Si une ressemblance apparaît à certaines fréquences, c'est une observation à noter, pas une preuve.
- EN : The correspondence below is constructed, not physical: it rests on the dominant spatial frequency of each scale, measured by Fourier transform — not on a law that would predict what a vibrating plate or water would show. A Chladni figure depends on the vessel's geometry, its depth, surface tension; nothing here replaces that. If a resemblance appears at certain frequencies, it is an observation worth noting, not a proof.
- ES : La correspondencia que sigue es construida, no física: se basa en la frecuencia espacial dominante de cada escala, medida por transformada de Fourier — no en una ley que predijera lo que mostraría una placa o un agua en vibración. Una figura de Chladni depende de la geometría del recipiente, de su profundidad, de la tensión superficial; nada de lo que aparece aquí la sustituye. Si surge un parecido en ciertas frecuencias, es una observación digna de anotarse, no una prueba.
- TH : ความสอดคล้องที่แสดงด้านล่างนี้เป็นสิ่งที่สร้างขึ้น ไม่ใช่ปรากฏการณ์ทางกายภาพ โดยอาศัยความถี่เชิงพื้นที่ที่เด่นของแต่ละบันไดเสียง วัดด้วยการแปลงฟูริเยร์ มิใช่กฎที่ทำนายว่าแผ่นสั่นหรือน้ำที่สั่นจะแสดงรูปใด ภาพคลาดนีขึ้นอยู่กับรูปทรงของภาชนะ ความลึก และแรงตึงผิว สิ่งที่แสดงที่นี่ไม่ได้แทนที่สิ่งเหล่านั้น หากพบความคล้ายคลึงที่ความถี่บางค่า ถือเป็นข้อสังเกตที่ควรบันทึกไว้ ไม่ใช่ข้อพิสูจน์

## listeningHeading
- FR : Écoute
- EN : Listening
- ES : Escucha
- TH : การฟัง

## micIdle
- FR : Activer le micro
- EN : Enable microphone
- ES : Activar el micrófono
- TH : เปิดไมโครโฟน

## micActive
- FR : Micro actif
- EN : Microphone active
- ES : Micrófono activo
- TH : ไมโครโฟนทำงานอยู่

## micUnavailable
(préfixe, suivi du message d'erreur du navigateur tel quel — ne pas traduire ce message-là, seulement ce préfixe)
- FR : Micro indisponible :&nbsp;
- EN : Microphone unavailable:&nbsp;
- ES : Micrófono no disponible:&nbsp;
- TH : ไมโครโฟนใช้งานไม่ได้:&nbsp;

## micUnavailableSuffix
- FR : &nbsp;— les gammes restent cliquables.
- EN : &nbsp;— the scales remain clickable.
- ES : &nbsp;— las escalas siguen siendo clicables.
- TH : &nbsp;— ยังคลิกเลือกบันไดเสียงได้

## waiting
- FR : en attente
- EN : waiting
- ES : en espera
- TH : กำลังรอ

## silence
- FR : silence
- EN : silence
- ES : silencio
- TH : เงียบ

## nearestPrefix
(préfixe, suivi de « note (+N¢) », ex. « la4 (+12¢) »)
- FR : gamme la plus proche :&nbsp;
- EN : closest scale:&nbsp;
- ES : escala más cercana:&nbsp;
- TH : บันไดเสียงที่ใกล้ที่สุด:&nbsp;

## smoothing
- FR : lissage
- EN : smoothing
- ES : suavizado
- TH : การปรับให้เรียบ

## threshold
- FR : seuil
- EN : threshold
- ES : umbral
- TH : ค่าเกณฑ์

## freeze
- FR : Mode figé — n'actualise plus au son
- EN : Freeze — stop updating on sound
- ES : Modo congelado — deja de actualizarse con el sonido
- TH : โหมดหยุดนิ่ง — ไม่อัปเดตตามเสียง

## toneHeading
- FR : Générateur de sons purs
- EN : Pure tone generator
- ES : Generador de tonos puros
- TH : เครื่องกำเนิดเสียงบริสุทธิ์

## toneHelp
- FR : Pour tester sans micro ni matériel — la fréquence choisie pilote directement le pavage.
- EN : To test without a microphone or equipment — the chosen frequency drives the pattern directly.
- ES : Para probar sin micrófono ni equipo — la frecuencia elegida controla directamente el teselado.
- TH : สำหรับทดลองโดยไม่ต้องใช้ไมโครโฟนหรืออุปกรณ์ — ความถี่ที่เลือกจะควบคุมลวดลายโดยตรง

## tonePlay
- FR : Jouer
- EN : Play
- ES : Reproducir
- TH : เล่น

## toneStop
- FR : Arrêter
- EN : Stop
- ES : Detener
- TH : หยุด

## gammesHeading
- FR : Les quinze gammes
- EN : The fifteen scales
- ES : Las quince escalas
- TH : บันไดเสียงทั้งสิบห้า

## paletteLabel
- FR : Palette
- EN : Palette
- ES : Paleta
- TH : จานสี

## paletteReset
- FR : Réinitialiser
- EN : Reset
- ES : Restablecer
- TH : รีเซ็ต

## soutenir
- FR : Soutenir
- EN : Support
- ES : Apoyar
- TH : สนับสนุน

## navHome
- FR : Accueil
- EN : Home
- ES : Inicio
- TH : หน้าแรก

## navMotifs
- FR : Créer un motif
- EN : Create a pattern
- ES : Crear un motivo
- TH : สร้างลวดลาย

## navImpression
- FR : Impression
- EN : Print
- ES : Impresión
- TH : การพิมพ์

## cat1
(catégorie d'une gamme à 1 base — apparaît sous le nom de la gamme affichée, ex. « 1 base — la3 · 220 Hz »)
- FR : 1 base
- EN : 1 base
- ES : 1 base
- TH : 1 ฐาน

## cat2
- FR : 2 bases
- EN : 2 bases
- ES : 2 bases
- TH : 2 ฐาน

## cat3
- FR : 3 bases
- EN : 3 bases
- ES : 3 bases
- TH : 3 ฐาน

## cat4
- FR : 4 bases
- EN : 4 bases
- ES : 4 bases
- TH : 4 ฐาน

## diapasonNote
(texte de cadrage, à placer près du sélecteur de gamme — même ton que `framing`)
- FR : Le diapason retenu ici est le do à 256 Hz, dit diapason philosophique. Joseph Sauveur le propose en 1713 devant l'Académie royale des sciences, pour une raison simple : 256 est 1 doublé huit fois, ce qui place toutes les octaves sur des nombres entiers. Les musiciens de son temps l'ont refusé ; les physiciens l'ont gardé comme référence de mesure. Ce do donne, en intervalles justes, un la à 432 Hz. Il est retenu ici parce que les fréquences spatiales des quinze gammes ont des carrés entiers, et que cet ancrage les laisse voir : chaque gamme tombe alors sur 2,56 fois un entier. Un autre diapason conviendrait aussi bien ; celui-ci rend la structure lisible.
- EN : The reference pitch used here is C at 256 Hz, known as the philosophical pitch. Joseph Sauveur proposed it in 1713 before the Royal Academy of Sciences, for a simple reason: 256 is 1 doubled eight times, which places every octave on a whole number. The musicians of his day rejected it; physicists kept it as a measurement standard. In just intonation, this C gives an A at 432 Hz. It is used here because the spatial frequencies of the fifteen scales have whole-number squares, and this anchor makes that visible: each scale then lands on 2.56 times a whole number. Another reference pitch would work just as well; this one makes the structure legible.
- ES : El diapasón elegido aquí es el do a 256 Hz, llamado diapasón filosófico. Joseph Sauveur lo propone en 1713 ante la Academia Real de Ciencias, por una razón simple: 256 es 1 duplicado ocho veces, lo que sitúa todas las octavas en números enteros. Los músicos de su época lo rechazaron; los físicos lo conservaron como referencia de medida. Este do da, en entonación justa, un la a 432 Hz. Se retiene aquí porque las frecuencias espaciales de las quince escalas tienen cuadrados enteros, y este anclaje permite verlo: cada escala cae entonces en 2,56 veces un entero. Otro diapasón serviría igual de bien; este hace legible la estructura.
- TH : เสียงมาตรฐานที่ใช้ในหน้านี้คือเสียงโดที่ 256 เฮิรตซ์ เรียกว่าเสียงมาตรฐานเชิงปรัชญา โฌแซฟ โซเวอร์เสนอเสียงนี้ในปี ค.ศ. 1713 ต่อหน้าราชบัณฑิตยสภาวิทยาศาสตร์แห่งฝรั่งเศส ด้วยเหตุผลง่าย ๆ คือ 256 เกิดจากเลข 1 คูณสองซ้ำแปดครั้ง ซึ่งทำให้ทุกช่วงคู่แปดตกอยู่บนจำนวนเต็ม นักดนตรีในยุคนั้นปฏิเสธเสียงนี้ แต่นักฟิสิกส์ยังคงใช้เป็นค่าอ้างอิงในการวัด เสียงโดนี้ เมื่อคิดตามอัตราส่วนเสียงบริสุทธิ์ จะให้เสียงลาที่ 432 เฮิรตซ์ เหตุผลที่เลือกใช้เสียงนี้ในหน้านี้ก็เพราะความถี่เชิงพื้นที่ของบันไดเสียงทั้งสิบห้ามีค่ายกกำลังสองเป็นจำนวนเต็ม และการยึดจุดอ้างอิงนี้ทำให้เห็นสิ่งนั้นได้ชัด แต่ละบันไดเสียงจะตกอยู่ที่ 2.56 เท่าของจำนวนเต็ม เสียงมาตรฐานอื่นก็ใช้ได้ดีเช่นกัน แต่เสียงนี้ทำให้โครงสร้างมองเห็นได้ชัดเจน

---

## Notes de traduction

**`framing`** — la nuance « construit, pas physique » est rendue par
*construida, no física* en ES et par
*เป็นสิ่งที่สร้างขึ้น ไม่ใช่ปรากฏการณ์ทางกายภาพ* en TH
(« une chose élaborée, non un phénomène physique »). C'est la formule qui
sépare le plus nettement les deux statuts en thaï ; une traduction plus
littérale de « physique » seul y aurait été lue comme « concret », ce qui
affaiblit la distinction.

**« gamme »** — rendu par *escala* et par *บันไดเสียง*, termes musicaux.
Cohérent avec `nearestPrefix`, qui affiche un nom de note.

**« pavage »** — *teselado* en ES (terme géométrique consacré) ;
*ลวดลาย* en TH, faute d'équivalent courant pour « pavage », et parce que
c'est déjà le mot employé pour « motif » dans ta nav thaïe.

**Ponctuation** — le thaï ne sépare pas les mots par des espaces et
n'emploie pas le deux-points de la même façon ; les `:` de `micUnavailable`
et `nearestPrefix` ont été conservés parce qu'ils précèdent une valeur
technique, où l'usage thaï les admet.

**Relecture thaïe** — le vocabulaire technique (ไซแมติกส์, ภาพคลาดนี,
ช่วงคู่แปด) est translittéré ou calqué ; ce sont des termes peu courants en
thaï. Une relecture par un locuteur natif serait utile, surtout sur
`framing`.

**`diapasonNote`** — contenu remplacé le 2026-09-19, puis à nouveau le
2026-09-21 (voir plus haut) ; ES/TH restent à traduire pour la version
courante. Pour mémoire, sur la version d'origine (2026-09-18) et la
version précédente : « diapason philosophique » n'a pas d'équivalent figé
en ES/TH (rendu littéralement, *diapasón filosófico*,
เสียงมาตรฐานเชิงปรัชญา) ; « Académie royale des sciences » se traduit en ES
par l'usage courant (*Academia Real de Ciencias*), en TH par une
périphrase faute de nom consacré (ราชบัณฑิตยสภาวิทยาศาสตร์แห่งฝรั่งเศส) — ces
choix restent valables pour la nouvelle version, qui reprend la même
référence historique. Une relecture par un locuteur natif reste utile,
le paragraphe mêlant vocabulaire historique et mathématique.

## Changements du 2026-09-24 : la correspondance devient une loi

`framing` a changé de contenu une quatrième fois — plus une clé isolée,
mais trois : `framing`, `framingScope` (nouvelle), `framingReserves`
(nouvelle), `framingLink` (nouvelle, le texte du lien vers l'article
`articles/axes-lignes-nodales.html`). `diapasonNote` a aussi changé une
quatrième fois (une phrase ajoutée en fin de paragraphe). FR et EN sont
intégrées ; ES et TH sont en repli FR pour les quatre clés (le système
bascule automatiquement dessus, `t()` retombe sur `UI.fr[key]` si
`UI[lang][key]` est absent — rien à corriger dans le code pour ça).

Le changement de fond : la page annonçait la correspondance
motif/fréquence comme une convention. Elle est établie, pour trois
motifs précis du système d'axes, comme une loi de fréquence de plaque
vibrante (vérifiée triangle par triangle, voir l'article lié) — la
distinction avec les quinze gammes, dont la correspondance reste une
observation spectrale non vérifiée de la même façon, est explicite dans
`framingScope` et ne doit pas se perdre à la traduction : ne pas laisser
croire que la loi couvre les quinze gammes.

## framing
- FR : La formule f = 128 × k² n'est pas un choix : pour une plaque carrée simplement appuyée, les fréquences propres sont proportionnelles à m² + n², c'est-à-dire à k². C'est cette loi que la formule mesure, et sa constante place le mode fondamental (2, 2) à 256 Hz — le do de l'accord scientifique.
- EN : The formula f = 128 × k² is not a choice: for a simply supported square plate, the natural frequencies are proportional to m² + n², that is, to k². That is the law the formula measures, and its constant places the fundamental mode (2, 2) at 256 Hz — C in scientific pitch.
- ES : à traduire (contenu changé au 2026-09-24, remplace entièrement la version antérieure)
- TH : à traduire (contenu changé au 2026-09-24, remplace entièrement la version antérieure ; voir la remarque sur la relecture native ci-dessus, elle s'applique encore plus à ce texte, qui mêle vocabulaire physique — plaque, mode propre, fréquence propre — et le nom du do dans l'accord scientifique)

## framingScope (nouvelle clé)
- FR : Vérifiée triangle par triangle pour trois motifs précis du système d'axes — écart 0, écarts 0 et 3, écarts 1,5 et 4,5 — dont le tracé coïncide exactement avec la ligne nodale d'un mode de plaque. Pour les quinze gammes ci-dessous, la correspondance reste ce qu'elle a toujours été : une fréquence spatiale dominante mesurée, sans qu'on ait vérifié qu'elle dessine la même figure qu'une plaque vibrante.
- EN : Verified triangle by triangle for three specific motifs of the axes system — écart 0, écarts 0 and 3, écarts 1.5 and 4.5 — whose trace matches exactly the nodal line of a plate mode. For the fifteen scales below, the correspondence remains what it has always been: a measured dominant spatial frequency, without any verification that it draws the same figure as a vibrating plate.
- ES : à traduire — garder « écart » tel quel ou l'expliciter (distance au centre) selon ce qui se lit le mieux ; ne pas traduire par un terme qui suggérerait une note de musique.
- TH : à traduire — même remarque sur « écart ».

## framingReserves (nouvelle clé)
- FR : Trois réserves, sur ce qui est vérifié. Le rapprochement n'est pas mathématiquement profond — un damier est nécessairement le motif nodal d'un mode. Les familles diagonales du système suivent une autre architecture, non encore reliée aux figures de Chladni. Et aucune mesure physique n'a été conduite : c'est une correspondance géométrique, pas une expérience.
- EN : Three reservations, on what is verified. The correspondence is not mathematically deep — a checkerboard is necessarily the nodal pattern of some mode. The diagonal families of the system follow a different architecture, not yet connected to Chladni figures. And no physical measurement has been carried out: this is a geometric correspondence, not an experiment.
- ES : à traduire
- TH : à traduire

## framingLink (nouvelle clé)
- FR : Le détail, avec la vérification →
- EN : The detail, with the verification →
- ES : à traduire
- TH : à traduire

## Deux points repérés hors de ce fichier

1. Sur `es/libro/index.html` et `th/book/index.html`, les liens de
   navigation **« Hexagrammes » et « Cymatique » s'affichent en français**
   au milieu d'une nav par ailleurs traduite. À corriger : ES *Hexagramas*
   / *Cimática*, TH *เฮกซะแกรม* / *ไซแมติกส์*.

2. Le fichier annonçait 27 clés ; il y en a 28.
