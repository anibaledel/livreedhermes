# Terminologie du système — FR / EN / ES / TH / ZH / RU / PT / HI

Vocabulaire fixé une fois, avant de traduire une seule phrase (voir
`prompt-cc-fusion.md` §6 : « une phrase maladroite se corrige en la lisant,
un terme technique faux se propage dans toutes les pages et finit cité »).
Couvre le vocabulaire déjà en usage sur le site (axes, bicolore) et celui
propre à `cymatique.html` v2, pour qu'une future page reprenne les mêmes
choix plutôt que d'en inventer de nouveaux.

Les noms de familles et de générations (YIN, YIN mutant, YANG, YANG mutant,
T0–T3) ne se traduisent pas : ils restent identiques dans toutes les
langues, comme c'est déjà le cas en anglais sur ce site.

Le nom du fichier date de quatre langues ; il est gardé, deux pages y
renvoient (`cymatique.html`, `docs/i18n/i18n_todo_cymatique_v2.md`). Les
colonnes ZH (chinois simplifié, `zh-Hans`) et RU ont été ajoutées au lot
« six langues » (2026-10-03), la colonne PT (portugais du Portugal,
`pt-PT`) le 2026-10-04, la colonne HI (hindi) le même jour ; elles sont **à relire par des lecteurs natifs** —
voir `TODO-RELECTURE.md`. Les colonnes suivent l'ordre des langues de
`scripts/langues.js` : `tools/check_glossaire.mjs` les lit dans cet ordre.

## Ne se traduisent jamais

Dans aucune langue, ni dans un titre, ni dans une méta-description :

- le titre **La Livrée d'Hermès** ;
- le nom **Anibal Edelberto Amiot**.

Une glose entre parenthèses peut SUIVRE l'original (« *La Livrée d'Hermès*
(The Livery of Hermes) »), jamais le remplacer. `tools/check_glossaire.mjs`
échoue sur toute traduction de l'un ou de l'autre hors de ce cas.

En anglais, la glose est **The Livery of Hermes**, et aucune autre : c'est le
titre de la couverture et de la page 1 du PDF anglais v3 (décision d'Anibal,
4 octobre 2026). Le contrôle échoue sur toute autre glose anglaise du titre,
dans les pages anglaises comme dans la partie anglaise de `llms.txt`.

| FR | EN (déjà en usage) | ES | TH | ZH | RU | PT | HI | Note |
|---|---|---|---|---|---|---|---|---|
| famille | family | familia | ตระกูล | 族 | семейство | família | परिवार | — |
| mutant (adj.) | mutant | mutante | กลายพันธุ์ | 变 | мутантный | mutante | परिवर्ती | ex. « T1 YIN et son mutant » |
| maille, grain (C8/C1) | grain | grano de lectura | เกรนการอ่าน | 读取粒度 | зерно чтения | grão de leitura | पठन-कण | pas dans les 42 clés de cette version, fixé pour `galerie-bicolore.html` |
| accord (sous-ensemble XOR) | chord | acorde | คอร์ด | 和弦 | аккорд | acorde | कॉर्ड | emprunt musical, comme en anglais |
| système de bandes | band system | sistema de bandas | ระบบแถบ | 条带系统 | система полос | sistema de bandas | पट्टी-प्रणाली | — |
| écart (décalage d'une droite) | offset | desplazamiento | ระยะเยื้อง | 偏移 | смещение | desvio | विचलन | — |
| parité | parity | paridad | พาริตี | 奇偶性 | чётность | paridade | समता | translittéré, usage établi en informatique thaïe |
| niveau | level | nivel | ระดับ | 层级 | уровень | nível | स्तर | aussi utilisé pour « case » de grille au sens large |
| figure (motif de parité) | figure | figura | รูป | 图形 | фигура | figura | आकृति | distinct de « motif » (ลวดลาย), déjà utilisé ailleurs sur le site pour un motif textile |
| case (cellule de grille) | cell | casilla | ช่อง | 格 | клетка | casa | खाना | — |
| fonction propre / mode propre | eigenfunction / eigenmode | función propia / modo propio | ฟังก์ชันไอเกน / โหมดไอเกน | 本征函数 / 本征模态 | собственная функция / собственная мода | função própria / modo próprio | आइगेन-फलन / आइगेन-मोड | « ไอเกน » translittéré, sans équivalent thaï établi |
| plaque | plate | placa | แผ่นเพลต | 板 | пластина | placa | पट्टिका | — |
| cavité (acoustique) | cavity | cavidad | โพรงเสียง | 腔 | полость | cavidade | गुहा | — |
| porteuse | carrier | portadora | คลื่นพาหะ | 载波 | несущая | portadora | वाहक तरंग | — |
| onde | wave | onda | คลื่น | 波 | волна | onda | तरंग | — |
| coupe (niveau d'une onde) | cut | corte | ภาคตัด | 截面 | срез | corte | काट | — |
| ligne nodale | nodal line | línea nodal | เส้นโหนด | 节线 | узловая линия | linha nodal | नोडीय रेखा | — |
| ligne d'iso-amplitude | iso-amplitude line | línea de isoamplitud | เส้นแอมพลิจูดเท่ากัน | 等幅线 | линия равной амплитуды | linha de isoamplitude | सम-आयाम रेखा | — |
| région de référence | reference region | región de referencia | บริเวณอ้างอิง | 参考区域 | опорная область | região de referência | संदर्भ क्षेत्र | — |

## Termes du système

Les termes du traité lui-même. EN, ES et TH reprennent l'usage **mesuré**
sur les pages du site (le terme majoritaire là où deux coexistaient — voir
les variantes refusées plus bas) ; ZH et RU sont fixés ici, avant les pages.

| FR | EN | ES | TH | ZH | RU | PT | HI | Note |
|---|---|---|---|---|---|---|---|---|
| carré magique | magic square | cuadrado mágico | จัตุรัสกล | 幻方 | магический квадрат | quadrado mágico | जादुई वर्ग | ZH : jamais 魔方 (le cube de Rubik) |
| carré solaire | solar square | cuadrado solar | จัตุรัสสุริยะ | 太阳方阵 | солнечный квадрат | quadrado solar | सौर वर्ग | — |
| croix ansée | ansate cross | cruz ansada | กางเขนหูหิ้ว | 安卡十字 | крест с петлёй | cruz ansada | अंख क्रॉस | RU descriptif, comme ES et TH ; ZH sur 安卡 (ankh) — à relire |
| demi-décalage | half-shift | semidesplazamiento | การเลื่อนครึ่งคาบ | 半周期平移 | полусдвиг | meio-deslocamento | अर्ध-विस्थापन | translation de six cases, la moitié de la période |
| livrée | livery | librea | — | 号衣 | ливрея | libré | पोशाक | le nom commun ; le TITRE ne se traduit pas. Aucune page thaïe ne l'emploie. |
| yang | yang | yang | หยาง | 阳 | ян | yang | यांग | trait plein ; les noms de familles (YANG, YANG mutant) restent en latin |
| yin | yin | yin | ยิน | 阴 | инь | yin | यिन | trait brisé ; idem |
| hexagramme | hexagram | hexagrama | ฉักลักษณ์ | 卦 | гексаграмма | hexagrama | हेक्साग्राम | ZH : jamais 六芒星 (l'étoile à six branches) |
| trigramme | trigram | trigrama | ตรีลักษณ์ | 三爻卦 | триграмма | trigrama | त्रिग्राम | — |
| arithmogéométrie | arithmogeometry | aritmogeometría | เลขาคณิตศาสตร์ | 数形学 | арифмогеометрия | aritmogeometria | अंकज्यामिति | ZH : pas 算术几何, qui est la géométrie arithmétique |
| calque (des 360) | layer | capa | แผ่นลาย | 图层 | слой | camada | परत | — |
| motif (12 × 12) | pattern | motivo | ลวดลาย | 图案 | узор | padrão | पैटर्न | — |
| motif unifié | unified pattern | motivo unificado | ลวดลายรวมเป็นหนึ่ง | 统一图案 | унифицированный узор | padrão unificado | एकीकृत पैटर्न | — |
| planche (du livre) | plate | lámina | แผ่นภาพ | 图版 | таблица | prancha | चित्रफलक | RU : sens éditorial (planche illustrée) |
| métier Jacquard | Jacquard loom | telar Jacquard | เครื่องทอฌักการ์ | 提花织机 | жаккардовый станок | tear Jacquard | जैक्वार्ड करघा | TH non mesuré : les pages disent « ลายทอแบบฌักการ์ » (le tissage) |
| gnomon | gnomon | gnomon | โนมอน | 磬折形 | гномон | gnómon | ग्नोमोन | TH absent des pages, translittéré |
| Yi King | Yi King | Yi King | อี้จิง | 易经 | И цзин | I Ching | ई चिंग | — |
| Carter (l'encodeur) | Carter | Carter | คาร์เตอร์ | Carter | Carter | Carter | Carter | nom propre : ZH et RU gardent le latin |
| dépôt (Zenodo) | deposit | depósito | — | 存档 | публикация | depósito | जमा | une entrée de data/travaux.json ; ES et TH : aucune page ne l'emploie encore |
| licence | licence | licencia | สัญญาอนุญาต | 许可 | лицензия | licença | लाइसेंस | la licence d'une page ou d'un dépôt ; ses noms (CC BY-NC 4.0, CC BY 4.0, AGPL v3) ne se traduisent pas |

## Variantes refusées

Ce que `tools/check_glossaire.mjs` refuse, langue par langue, sur toutes les
pages de cette langue (`<html lang>`). C'est ce test qui remplace la
relecture préalable : un concept du glossaire ne peut pas recevoir deux
traductions dans une même langue. `*` vaut « n'importe quelle terminaison »
(déclinaisons russes) ; les termes latins et cyrilliques sont comparés sans
casse et en mots entiers.

| Langue | Concept (FR) | Variantes refusées |
|---|---|---|
| th | carré magique | ตารางเวทมนตร์ ; จัตุรัสเวทมนตร์ ; จัตุรัสมายากล |
| th | hexagramme | เฮกซะแกรม |
| zh-Hans | carré magique | 魔方 ; 魔术方阵 ; 魔法方阵 ; 魔幻方阵 |
| zh-Hans | carré solaire | 太阳幻方 ; 日方阵 ; 太阳方块 |
| zh-Hans | croix ansée | 带柄十字 ; 生命十字 ; 环柄十字 ; 埃及十字 ; 生命之符 |
| zh-Hans | demi-décalage | 半移位 ; 半位移 ; 半平移 ; 半偏移 |
| zh-Hans | hexagramme | 六芒星 ; 六线形 |
| zh-Hans | parité | 宇称 |
| zh-Hans | arithmogéométrie | 算术几何 |
| zh-Hans | motif (12 × 12) | 纹样 ; 图样 |
| zh-Hans | métier Jacquard | 雅卡尔 ; 贾卡 |
| zh-Hans | Yi King | 周易经 |
| ru | carré magique | волшебн* квадрат* |
| ru | carré solaire | квадрат* солнца |
| ru | croix ansée | анх ; анкх ; египетск* крест* ; ключ* жизни |
| ru | demi-décalage | сдвиг* на половину ; полупериодн* сдвиг* |
| ru | parité | паритет* |
| ru | arithmogéométrie | арифметическ* геометри* |
| ru | motif (12 × 12) | паттерн* |
| ru | calque (des 360) | кальк* |
| ru | métier Jacquard | станк* Жаккара ; станок Жаккара |
| ru | Yi King | И-цзин ; Ицзин ; Йи Кинг |
| ru | dépôt (Zenodo) | депозит* |
| zh-Hans | licence | 许可证 ; 授权协议 ; 许可协议 |
| en | La Livrée d'Hermès (titre) | Herm* Livery ; Herm*' Livery ; Herm*’ Livery ; Herm*'s Livery ; Herm*’s Livery |
| es | La Livrée d'Hermès (titre) | Librea de Hermes |
| th | La Livrée d'Hermès (titre) | เสื้อคลุมของเฮอร์เมส |
| th | Anibal Edelberto Amiot (nom) | อนิบัล ; อามิโอต์ |
| zh-Hans | La Livrée d'Hermès (titre) | 赫尔墨斯的号衣 ; 赫耳墨斯的号衣 ; 赫尔墨斯的制服 |
| zh-Hans | Anibal Edelberto Amiot (nom) | 阿尼巴尔 ; 阿米奥 |
| ru | La Livrée d'Hermès (titre) | ливре* гермес* ; ливре* гермеса |
| ru | Anibal Edelberto Amiot (nom) | Анибал* ; Амио |
| hi | carré magique | मैजिक स्क्वायर ; मायावी वर्ग ; जादू वर्ग |
| hi | hexagramme | षट्कोण ; षट्भुज |
| hi | croix ansée | अंख क्रास ; जीवन क्रॉस |
| hi | motif (12 × 12) | प्रतिरूप ; नमूना |
| hi | Anibal Edelberto Amiot (nom) | अनिबल ; आमियो |

## Portée

Ce tableau couvre le vocabulaire structurel (noms des objets manipulés). Il
ne fixe pas la prose : les phrases elles-mêmes, en espagnol et en thaï,
restent traduites au meilleur effort et sujettes à relecture — voir la
mention posée sur `cymatique.html` (`UI.es.i18nReviewNote` /
`UI.th.i18nReviewNote`).
