# Traductions manquantes — page Cymatique (`cymatique.html`)

Chaque clé ci-dessous existe dans `UI.fr` et `UI.en` du fichier
`cymatique.html` (objet `UI`, juste après `<script type="module">`).

**Les 29 clés d'origine sont intégrées en FR/EN/ES/TH.** Ce qui reste :
les cinq clés du sélecteur d'échelle (`echelleLabel`,
`echelleProportionnelle`, `echelleOrdinale`, `echelleProportionnelleHelp`,
`echelleOrdinaleHelp`) et `diapasonNote` — intégrées en FR/EN le
2026-09-19 (deux échelles, k_pic mesuré), en repli sur le texte FR pour
ES et TH en attendant leur traduction ci-dessous.

`diapasonNote` a changé de contenu depuis la première version de ce
fichier : l'ancienne formule (do 256 Hz, f = 2,56 × k_pic²) est
abandonnée, remplacée par deux échelles (proportionnelle f = 128 × k²,
ordinale par rang) sur un k_pic désormais mesuré, pas supposé. Toute
traduction ES/TH faite sur l'ancienne version du texte est à refaire, pas
à corriger.

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
- FR : f = 128 × k² — de do 128 Hz à do 2560 Hz, rapports exacts entre motifs.
- EN : f = 128 × k² — from C 128 Hz to C 2560 Hz, exact ratios between patterns.

## echelleOrdinaleHelp
- FR : les neuf valeurs étalées par rang, de do 128 Hz à do 256 Hz — comparaison immédiate.
- EN : the nine values spread by rank, from C 128 Hz to C 256 Hz — immediate comparison.

## diapasonNote (nouveau contenu, remplace la version 2026-09-18)
(texte de cadrage, placé près du sélecteur de gamme — même ton que `framing`)
- FR : Le diapason retenu ici, pour les deux échelles, prend pour repère le do à 128 Hz — une octave sous le do à 256 Hz que Joseph Sauveur propose en 1713 devant l'Académie royale des sciences, pour une raison simple : doubler 1 plusieurs fois de suite place toutes les octaves sur des nombres entiers. On l'a appelé le diapason philosophique. Les musiciens de son temps l'ont refusé ; les physiciens l'ont gardé comme référence de mesure. Il est repris ici parce que les neuf valeurs mesurées — les carrés de fréquence spatiale des quinze gammes — sont elles-mêmes des entiers : dans l'échelle proportionnelle, chaque gamme tombe alors exactement à 128 fois un entier, sans reste. Un autre diapason conviendrait aussi bien ; celui-ci rend la structure lisible.
- EN : The reference pitch used here, for both scales, is C at 128 Hz — one octave below the C at 256 Hz that Joseph Sauveur proposed in 1713 before the Royal Academy of Sciences, for a simple reason: doubling 1 repeatedly places every octave on a whole number. It became known as the philosophical pitch. The musicians of his day rejected it; physicists kept it as a measurement standard. It is used here because the nine measured values — the squared spatial frequencies of the fifteen scales — are themselves whole numbers: on the proportional scale, each scale then lands exactly on 128 times a whole number, with no remainder. Another reference pitch would work just as well; this one makes the structure legible.
- ES : à traduire (contenu nouveau, voir remarque en tête de fichier)
- TH : à traduire (contenu nouveau, voir remarque en tête de fichier)

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

**`diapasonNote`** — contenu remplacé le 2026-09-19 (voir plus haut) ;
ES/TH restent à traduire pour la nouvelle version. Pour mémoire, sur la
version précédente : « diapason philosophique » n'a pas d'équivalent figé
en ES/TH (rendu littéralement, *diapasón filosófico*,
เสียงมาตรฐานเชิงปรัชญา) ; « Académie royale des sciences » se traduit en ES
par l'usage courant (*Academia Real de Ciencias*), en TH par une
périphrase faute de nom consacré (ราชบัณฑิตยสภาวิทยาศาสตร์แห่งฝรั่งเศส) — ces
choix restent valables pour la nouvelle version, qui reprend la même
référence historique. Une relecture par un locuteur natif reste utile,
le paragraphe mêlant vocabulaire historique et mathématique.

## Deux points repérés hors de ce fichier

1. Sur `es/libro/index.html` et `th/book/index.html`, les liens de
   navigation **« Hexagrammes » et « Cymatique » s'affichent en français**
   au milieu d'une nav par ailleurs traduite. À corriger : ES *Hexagramas*
   / *Cimática*, TH *เฮกซะแกรม* / *ไซแมติกส์*.

2. Le fichier annonçait 27 clés ; il y en a 28.
