# Tuiles de navigation — textes à relire, langue par langue

La règle d'Anibal : **« proposer quelque chose d'imparfait c'est TOUJOURS mieux
que rien »**. Les tuiles du bas de page sont posées dans les huit langues, sur
toutes les adresses du sitemap (tools/check_tuiles.mjs). En es, th, zh, ru, pt
et hi, chaque texte reprend ce que le site dit déjà quand il le dit ; sinon il est
proposé, et marqué. Voici où un lecteur natif doit regarder.

Les textes vivent dans `scripts/nav-tiles-libelles.js`, chacun avec sa
provenance en commentaire. Corriger là, puis `node scripts/build-header.js` et
`node scripts/generate-hexagram-pages-traduites.js`. Les termes du système
suivent le glossaire (`docs/terminologie-fr-en-es-th.md`).

## Décisions d'Anibal (2026-10-04), à ne pas « corriger »

- **« Explorer » en russe, portugais et hindi** : « Обзор », « Visão geral »,
  « एक नज़र में » veulent dire « aperçu », pas « explorer » ; ils sont repris
  des accueils de ces langues — la cohérence d'une page avec elle-même passe
  avant la fidélité au français.
- **« Maille »** de la galerie bicolore : le terme du glossaire, « grain de
  lecture » dans chaque langue — l'anglais aussi (« mesh » → « grain »).
- **Crédit thaï** : « สร้างร่วมกับ Claude », la version de la page du livre
  (th/lexicon dit « สร้างขึ้นร่วมกับ Claude »).
- **Hindi, tuile cymatique** : « उसकी » (« sa ») au lieu de « vous » — une forme
  d'adresse, gardée.
- **« 60 images »** (tuile « Créer un motif ») : décision d'Anibal
  (2026-10-04). Le référent compte 60 identités (famille × teinte), le livre et
  le lexique réservent « nature » aux 4 natures. Le français, l'anglais,
  l'espagnol (« imágenes »), le thaï (« ภาพ ») et le chinois (« 幅图像 ») sont
  passés à « images » ; ru, pt, hi le disaient déjà.

## es

**Sans source sur le site (21)** — proposés :

| où | texte | note |
|---|---|---|
| tuile · fonds-ecran · excerpt | Fondos de pantalla textiles a pantalla completa, reactivos al sonido o en modo meditativo a ritmo regulable. | SANS SOURCE |
| tuile · creation-motifs · excerpt | Componga sus propios motivos textiles a partir de las 60 naturalezas del Yi King. | SANS SOURCE |
| tuile · bicolore · label | Motivos bicolores | SANS SOURCE |
| tuile · bicolore · excerpt | Componga una celda de 12×12: seis niveles, cada uno con su familia y su matiz. | SANS SOURCE |
| tuile · bicolore-v2 · label | Motivos bicolores v2 | SANS SOURCE |
| tuile · bicolore-v2 · excerpt | El segundo corte de las diagonales (YA/AY), vocabulario y estados del semidesplazamiento — junto a la herramienta v1. | SANS SOURCE |
| tuile · encodeur · excerpt | Codificación esteganográfica geométrica por doble referente, cruz ansada y Jacquard. | SANS SOURCE |
| tuile · cymatique · excerpt | El teselado cuya frecuencia espacial se acerca más al sonido que usted emite. | SANS SOURCE |
| tuile · quadricolore · excerpt | Los 64 motivos de los hexagramas, personalizables y descargables en alta resolución. | SANS SOURCE |
| tuile · galerie-tricolore · label | Galería tricolor | SANS SOURCE ; « Galería » seul : es/libro/index.html:176 |
| tuile · galerie-tricolore · excerpt | Motivos unificados, generados por mezcla de matices — seleccione un motivo para ver su teselado. | SANS SOURCE |
| tuile · galerie-bicolore · label | Galería bicolor | SANS SOURCE |
| tuile · galerie-bicolore · excerpt | 142 motivos bicolores generados por los ejes y cerrados sobre el cubo — grano de lectura, teselado, exportación. | SANS SOURCE ; « maille » = grain C8/C1 (cf. galerie-bicolore.html:7), terme du glossaire |
| tuile · motifs-svg · excerpt | Descargue las capas de impresión en 4 categorías de combinaciones de rasgos, en formato SVG. | SANS SOURCE |
| tuile · traite · excerpt | El tratado y sus ediciones traducidas, los hexagramas y el léxico. | SANS SOURCE |
| tuile · lexique · excerpt | Diez nociones clave para comprender La Livrée d'Hermès. | SANS SOURCE ; le site décrit le lexique autrement : es/lexico/index.html:7 (définitions + FAQ), « dix notions » absent |
| tuile · articles · excerpt | Reflexiones e investigaciones en torno a La Livrée d'Hermès. | SANS SOURCE |
| tuile · contact · excerpt | Contacte con el autor para un proyecto o un encargo de motivos e impresiones textiles. | SANS SOURCE |
| tuile · a-propos · excerpt | El autor y su libro, en la encrucijada de la filosofía, las matemáticas y las ciencias aplicadas. | SANS SOURCE |
| tuile · outils · excerpt | Todas las herramientas interactivas del sitio, reunidas en un solo lugar. | SANS SOURCE |
| accueil · excerpt | El libro, sus láminas y el conjunto de las herramientas. | SANS SOURCE |

**Adaptés d'un texte du site (8)** :

| où | texte | source |
|---|---|---|
| groupe · creer | Crear | adapté de es/libro/index.html:174 « Crear un motivo » |
| groupe · lire | Leer | adapté de es/index.html:117 « Leer en línea » |
| groupe · le-projet | El proyecto | adapté de es/index.html:156 « Apoyar el proyecto » |
| tuile · impression · label | 360 capas | adapté du glossaire (calque = capa) et du nom de la page |
| tuile · impression · excerpt | Realice la tirada y descargue las capas de impresión, listas para imprimir. | adapté de impression.html:581 (UI.es.subtitle) |
| tuile · hexagrammes · excerpt | Los 64 hexagramas del Yi King: juicio, trigramas y el cuadrado mágico asociado a cada uno. | adapté de es/index.html:127 (sans « imagen ») |
| tuile · traite · label | El tratado | adapté de es/index.html:138 « El tratado está publicado… » |
| tuile · outils · label | Herramientas | adapté de es/index.html:137 « herramientas » |

## th

**Sans source sur le site (21)** — proposés :

| où | texte | note |
|---|---|---|
| tuile · fonds-ecran · excerpt | วอลเปเปอร์ลายผ้าเต็มจอ ตอบสนองต่อเสียง หรือในโหมดสมาธิที่ปรับจังหวะได้ | SANS SOURCE |
| tuile · creation-motifs · excerpt | ประกอบลวดลายผ้าของคุณเองจากธรรมชาติ 60 ประการของอี้จิง | SANS SOURCE |
| tuile · bicolore · label | ลวดลายสองสี | SANS SOURCE |
| tuile · bicolore · excerpt | ประกอบเซลล์ขนาด 12×12 หกระดับ แต่ละระดับมีตระกูลและโทนสีของตัวเอง | SANS SOURCE |
| tuile · bicolore-v2 · label | ลวดลายสองสี v2 | SANS SOURCE |
| tuile · bicolore-v2 · excerpt | การแบ่งเส้นทแยงครั้งที่สอง (YA/AY) คำศัพท์และสถานะของการเลื่อนครึ่งคาบ — ควบคู่กับเครื่องมือ v1 | SANS SOURCE |
| tuile · encodeur · excerpt | การเข้ารหัสซ่อนข้อมูลเชิงเรขาคณิตด้วยตัวอ้างอิงคู่ กางเขนหูหิ้ว และฌักการ์ | SANS SOURCE |
| tuile · cymatique · excerpt | การปูลายที่มีความถี่เชิงพื้นที่ใกล้เคียงกับเสียงที่คุณเปล่งออกมามากที่สุด | SANS SOURCE |
| tuile · quadricolore · excerpt | ลวดลาย 64 แบบของฉักลักษณ์ ปรับแต่งได้และดาวน์โหลดได้ในความละเอียดสูง | SANS SOURCE |
| tuile · galerie-tricolore · label | แกลเลอรีสามสี | SANS SOURCE ; « แกลเลอรี » seul : th/book/index.html:176 |
| tuile · galerie-tricolore · excerpt | ลวดลายรวมเป็นหนึ่ง สร้างจากการผสมโทนสี — เลือกลวดลายเพื่อดูการปูลาย | SANS SOURCE |
| tuile · galerie-bicolore · label | แกลเลอรีสองสี | SANS SOURCE |
| tuile · galerie-bicolore · excerpt | ลวดลายสองสี 142 แบบที่สร้างจากแกนและปิดบนลูกบาศก์ — เกรนการอ่าน การปูลาย การส่งออก | SANS SOURCE ; « maille » = grain C8/C1 (cf. galerie-bicolore.html:7), terme du glossaire |
| tuile · motifs-svg · excerpt | ดาวน์โหลดแผ่นลายสำหรับพิมพ์ใน 4 หมวดของการผสมเส้น ในรูปแบบ SVG | SANS SOURCE |
| tuile · traite · excerpt | ตำราและฉบับแปล ฉักลักษณ์ และอภิธานศัพท์ | SANS SOURCE |
| tuile · lexique · excerpt | แนวคิดสำคัญสิบประการเพื่อทำความเข้าใจ La Livrée d'Hermès | SANS SOURCE ; le site décrit le lexique autrement : th/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent |
| tuile · articles · excerpt | ข้อคิดและงานวิจัยเกี่ยวกับ La Livrée d'Hermès | SANS SOURCE |
| tuile · contact · excerpt | ติดต่อผู้แต่งสำหรับโครงการ หรือการสั่งทำลวดลายและงานพิมพ์บนผ้า | SANS SOURCE |
| tuile · a-propos · excerpt | ผู้แต่งและหนังสือของเขา ณ จุดบรรจบของปรัชญา คณิตศาสตร์ และวิทยาศาสตร์ประยุกต์ | SANS SOURCE |
| tuile · outils · excerpt | เครื่องมือแบบโต้ตอบทั้งหมดของเว็บไซต์ รวมไว้ในที่เดียว | SANS SOURCE |
| accueil · excerpt | หนังสือ แผ่นภาพ และเครื่องมือทั้งหมด | SANS SOURCE |

**Adaptés d'un texte du site (7)** :

| où | texte | source |
|---|---|---|
| groupe · creer | สร้าง | adapté de th/book/index.html:174 « สร้างลวดลาย » |
| groupe · lire | อ่าน | adapté de th/index.html:117 « อ่านหนังสือออนไลน์ » |
| groupe · le-projet | โครงการ | adapté de th/index.html:156 « สนับสนุนโครงการ » |
| tuile · impression · label | แผ่นลาย 360 แผ่น | adapté du glossaire (calque = แผ่นลาย) et du nom de la page |
| tuile · impression · excerpt | ทำการทำนาย แล้วดาวน์โหลดแผ่นลายที่พร้อมพิมพ์ | adapté de impression.html:604 (UI.th.subtitle ; « ชั้นลาย » → « แผ่นลาย » selon le glossaire) |
| tuile · hexagrammes · excerpt | ฉักลักษณ์ทั้ง 64 ของอี้จิง: คำตัดสิน ตรีลักษณ์ และจัตุรัสกลที่สัมพันธ์กับแต่ละฉักลักษณ์ | adapté de th/index.html:127 (sans « ภาพลักษณ์ ») |
| tuile · traite · label | ตำรา | adapté de th/index.html:114 (h1 « ตำรา 111 แผ่นภาพ ») |

## zh

**Sans source sur le site (9)** — proposés :

| où | texte | note |
|---|---|---|
| tuile · bicolore · excerpt | 组合一个 12×12 单元：六个层级，各有其族与色调。 | SANS SOURCE ; le texte du site (zh/tools/index.html:258) traduit l'ancien extrait « trait par trait, 15 familles » |
| tuile · galerie-tricolore · label | 三色图库 | SANS SOURCE ; calqué sur « 双色图库 » zh/tools/index.html:243 ; le site dit « 图库 » (:236) |
| tuile · traite · excerpt | 论著及其各语种译本、六十四卦与词汇表。 | SANS SOURCE |
| tuile · lexique · excerpt | 理解 La Livrée d'Hermès 的十个关键概念。 | SANS SOURCE ; le site décrit le lexique autrement : zh/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent |
| tuile · articles · excerpt | 围绕 La Livrée d'Hermès 的思考与研究。 | SANS SOURCE |
| tuile · contact · excerpt | 如需合作项目，或订制图案与织物印制，请联系作者。 | SANS SOURCE |
| tuile · a-propos · excerpt | 作者及其著作，处于哲学、数学与应用科学的交汇处。 | SANS SOURCE |
| tuile · outils · excerpt | 网站的全部交互式工具，汇集于一处。 | SANS SOURCE ; « outils interactifs du site » existe (zh/index.html:132), « réunis en un seul endroit » non |
| accueil · excerpt | 本书、书中图版与全部工具。 | SANS SOURCE |

**Adaptés d'un texte du site (10)** :

| où | texte | source |
|---|---|---|
| groupe · lire | 阅读 | adapté de zh/index.html:117 « 在线阅读 » |
| groupe · le-projet | 项目 | adapté de zh/tools/index.html:313 « 支持本项目 » |
| tuile · bicolore-v2 · excerpt | 对角线的第二种切分（YA/AY）：术语与半周期平移的各种状态——与 v1 工具并列。 | adapté de zh/tools/index.html:265 (« 角、元素 » → « 术语 » non sourcé) |
| tuile · impression · label | 360 图层 | adapté du glossaire (calque = 图层) et du nom de la page |
| tuile · hexagrammes · label | 六十四卦 | adapté de zh/tools/index.html:309 (sans « （英文） ») |
| tuile · hexagrammes · excerpt | 易经 64 卦：每一卦的卦辞、三爻卦与幻方。 | adapté de zh/index.html:133 (sans 象、六爻、图案) |
| tuile · galerie-bicolore · excerpt | 由轴生成、能在立方体上闭合的 142 种双色图案——读取粒度、铺排、导出。 | adapté de zh/tools/index.html:244 + glossaire (读取粒度) ; « 导出 » non sourcé |
| tuile · articles · label | 文章 | adapté de zh/index.html:142 « 文章（英文） » |
| bouton Soutien · label | 支持本项目 | adapté de zh/tools/index.html:313 (« soutenir le projet », pas « devenir soutien ») |
| bouton Soutien · title | 以自定金额支持 La Livrée d'Hermès：一切内容均免费开放（CC BY-NC 4.0）；您的支持用于资助项目的后续发展。 | adapté de zh/support/index.html:7 + zh/index.html:135 + zh/support/index.html:125 |

## ru

**Sans source sur le site (9)** — proposés :

| où | texte | note |
|---|---|---|
| tuile · bicolore · excerpt | Составьте ячейку 12×12: шесть уровней, у каждого своё семейство и свой оттенок. | SANS SOURCE ; ru/tools/index.html:207 = ancien extrait « 15 familles » |
| tuile · galerie-tricolore · label | Трёхцветная галерея | SANS SOURCE ; calqué sur ru/tools/index.html:190 ; le site dit « Галерея » (:182) |
| tuile · traite · excerpt | Трактат и его переводные издания, гексаграммы и глоссарий. | SANS SOURCE |
| tuile · lexique · excerpt | Десять ключевых понятий для понимания La Livrée d'Hermès. | SANS SOURCE ; le site décrit le lexique autrement : ru/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent |
| tuile · articles · excerpt | Размышления и исследования вокруг La Livrée d'Hermès. | SANS SOURCE |
| tuile · contact · excerpt | Свяжитесь с автором по поводу проекта или заказа узоров и текстильных отпечатков. | SANS SOURCE |
| tuile · a-propos · excerpt | Автор и его книга — на пересечении философии, математики и прикладных наук. | SANS SOURCE |
| tuile · outils · excerpt | Все интерактивные инструменты сайта, собранные в одном месте. | SANS SOURCE ; « outils interactifs du site » existe (ru/index.html:131), « réunis en un seul endroit » non |
| accueil · excerpt | Книга, её таблицы и все инструменты. | SANS SOURCE |

**Adaptés d'un texte du site (12)** :

| où | texte | source |
|---|---|---|
| groupe · creer | Создать | adapté de ru/tools/index.html:166 « Создать узор » |
| groupe · lire | Читать | adapté de ru/index.html:116 « Читать онлайн » |
| groupe · le-projet | Проект | adapté de ru/tools/index.html:269 « Поддержать проект » |
| tuile · bicolore-v2 · excerpt | Второе разбиение диагоналей (YA/AY): словарь и статусы полусдвига — рядом с инструментом v1. | adapté de ru/tools/index.html:215 (« углы, элементы » → « словарь » non sourcé) |
| tuile · impression · label | 360 слоёв | adapté du glossaire (calque = слой) et du nom de la page |
| tuile · hexagrammes · label | Гексаграммы | adapté de ru/tools/index.html:265 (sans « (на английском) ») |
| tuile · hexagrammes · excerpt | 64 гексаграммы И цзин: суждение, триграммы и магический квадрат для каждой. | adapté de ru/index.html:132 (sans образ, шесть черт, узоры) |
| tuile · galerie-bicolore · excerpt | 142 двухцветных узора, порождённые осями и замыкающиеся на кубе: зерно чтения, замощение, экспорт. | adapté de ru/tools/index.html:191 + glossaire (зерно чтения) ; « экспорт » non sourcé |
| tuile · articles · label | Статьи | adapté de ru/index.html:141 « статьи » |
| tuile · a-propos · label | Об авторе | adapté de ru/tools/index.html:267 (sans « (на французском) ») |
| bouton Soutien · label | Поддержать проект | adapté de ru/tools/index.html:269 |
| bouton Soutien · title | Поддержите La Livrée d'Hermès по свободной цене: всё доступно бесплатно по лицензии CC BY-NC 4.0; ваша поддержка финансирует продолжение проекта. | adapté de ru/support/index.html:7 + ru/index.html:134 + ru/support/index.html:132 |

## pt

**Sans source sur le site (9)** — proposés :

| où | texte | note |
|---|---|---|
| tuile · bicolore · excerpt | Componha uma célula 12×12: seis níveis, cada um com a sua família e o seu tom. | SANS SOURCE ; pt/tools/index.html:207 = ancien extrait |
| tuile · galerie-tricolore · label | Galeria tricolor | SANS SOURCE ; calqué sur pt/tools/index.html:190 ; le site dit « Galeria » (:182) |
| tuile · traite · excerpt | O tratado e as suas edições traduzidas, os hexagramas e o léxico. | SANS SOURCE |
| tuile · lexique · excerpt | Dez noções-chave para compreender La Livrée d'Hermès. | SANS SOURCE ; le site décrit le lexique autrement : pt/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent |
| tuile · articles · excerpt | Reflexões e investigações em torno de La Livrée d'Hermès. | SANS SOURCE |
| tuile · contact · excerpt | Contacte o autor para um projeto ou uma encomenda de padrões e impressões têxteis. | SANS SOURCE |
| tuile · a-propos · excerpt | O autor e o seu livro, no cruzamento da filosofia, da matemática e das ciências aplicadas. | SANS SOURCE |
| tuile · outils · excerpt | Todas as ferramentas interativas do site, reunidas num só lugar. | SANS SOURCE ; « outils interactifs du site » existe (pt/index.html:131), « réunis en un seul endroit » non |
| accueil · excerpt | O livro, as suas pranchas e todas as ferramentas. | SANS SOURCE |

**Adaptés d'un texte du site (12)** :

| où | texte | source |
|---|---|---|
| groupe · creer | Criar | adapté de pt/tools/index.html:166 « Criar um padrão » |
| groupe · lire | Ler | adapté de pt/index.html:116 « Ler online » |
| groupe · le-projet | O projeto | adapté de pt/tools/index.html:269 « Apoiar o projeto » |
| tuile · bicolore-v2 · excerpt | A segunda divisão das diagonais (YA/AY): vocabulário e estados de meio-deslocamento — ao lado da ferramenta v1. | adapté de pt/tools/index.html:215 (« vocabulário » non sourcé) |
| tuile · impression · label | 360 camadas | adapté du glossaire (calque = camada) et du nom de la page |
| tuile · hexagrammes · label | Hexagramas | adapté de pt/tools/index.html:265 (sans « (em inglês) ») |
| tuile · hexagrammes · excerpt | Os 64 hexagramas do I Ching: julgamento, trigramas e quadrado mágico de cada um. | adapté de pt/index.html:132 (sans imagem, seis linhas, padrões) |
| tuile · galerie-bicolore · excerpt | 142 padrões bicolores gerados pelos eixos e fechados sobre o cubo: grão de leitura, pavimentação, exportação. | adapté de pt/tools/index.html:191 + glossaire (grão de leitura) ; « exportação » non sourcé |
| tuile · articles · label | Artigos | adapté de pt/index.html:141 « artigos » |
| tuile · a-propos · label | Sobre o autor | adapté de pt/tools/index.html:267 (sans « (em francês) ») |
| bouton Soutien · label | Apoiar o projeto | adapté de pt/tools/index.html:269 |
| bouton Soutien · title | Apoie La Livrée d'Hermès a preço livre: tudo é gratuito, sob licença CC BY-NC 4.0; o seu apoio financia a continuação do projeto. | adapté de pt/support/index.html:7 + pt/index.html:134 + pt/support/index.html:132 |

## hi

**Sans source sur le site (9)** — proposés :

| où | texte | note |
|---|---|---|
| tuile · bicolore · excerpt | एक 12×12 कोशिका रचें: छह स्तर, प्रत्येक का अपना परिवार और अपना रंग। | SANS SOURCE ; hi/tools/index.html:207 = ancien extrait |
| tuile · galerie-tricolore · label | त्रिवर्णी दीर्घा | SANS SOURCE ; calqué sur hi/tools/index.html:190 ; le site dit « दीर्घा » (:182) |
| tuile · traite · excerpt | ग्रंथ और उसके अनूदित संस्करण, हेक्साग्राम और शब्दावली। | SANS SOURCE |
| tuile · lexique · excerpt | La Livrée d'Hermès को समझने के लिए दस मुख्य अवधारणाएँ। | SANS SOURCE ; le site décrit le lexique autrement : hi/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent |
| tuile · articles · excerpt | La Livrée d'Hermès से जुड़े चिंतन और शोध। | SANS SOURCE |
| tuile · contact · excerpt | किसी परियोजना, या पैटर्न और वस्त्र-मुद्रण के ऑर्डर के लिए लेखक से संपर्क करें। | SANS SOURCE |
| tuile · a-propos · excerpt | लेखक और उनकी पुस्तक — दर्शन, गणित और अनुप्रयुक्त विज्ञान के संगम पर। | SANS SOURCE |
| tuile · outils · excerpt | साइट के सभी संवादात्मक उपकरण, एक ही स्थान पर। | SANS SOURCE ; « outils interactifs du site » existe (hi/index.html:131), « réunis en un seul endroit » non |
| accueil · excerpt | पुस्तक, उसके चित्रफलक और सभी उपकरण। | SANS SOURCE |

**Adaptés d'un texte du site (10)** :

| où | texte | source |
|---|---|---|
| groupe · lire | पढ़ें | adapté de hi/index.html:116 « ऑनलाइन पढ़ें » |
| groupe · le-projet | परियोजना | adapté de hi/tools/index.html:269 « परियोजना को सहयोग दें » |
| tuile · bicolore-v2 · excerpt | विकर्णों का दूसरा विभाजन (YA/AY): शब्दावली और अर्ध-विस्थापन की अवस्थाएँ — उपकरण v1 के साथ। | adapté de hi/tools/index.html:215 (« शब्दावली » remplace « कोण, तत्व ») |
| tuile · impression · label | 360 परतें | adapté du glossaire (calque = परत) et du nom de la page |
| tuile · hexagrammes · label | हेक्साग्राम | adapté de hi/tools/index.html:265 (sans « (अंग्रेज़ी में) ») |
| tuile · hexagrammes · excerpt | ई चिंग के 64 हेक्साग्राम: प्रत्येक का निर्णय, त्रिग्राम और जादुई वर्ग। | adapté de hi/index.html:132 (sans बिंब, छह रेखाएँ, पैटर्न) |
| tuile · galerie-bicolore · excerpt | अक्षों से बने और घन पर बंद 142 द्विवर्णी पैटर्न: पठन-कण, टाइलिंग, निर्यात। | adapté de hi/tools/index.html:191 + glossaire (पठन-कण) ; « निर्यात » non sourcé |
| tuile · a-propos · label | लेखक के बारे में | adapté de hi/tools/index.html:267 (sans « (फ़्रेंच में) ») |
| bouton Soutien · label | परियोजना को सहयोग दें | adapté de hi/tools/index.html:269 |
| bouton Soutien · title | La Livrée d'Hermès को अपनी इच्छा से तय की गई राशि से सहयोग दें: सब कुछ निःशुल्क है, CC BY-NC 4.0 लाइसेंस के अंतर्गत; आपका सहयोग परियोजना को आगे बढ़ाता है। | adapté de hi/support/index.html:7 + hi/index.html:134 + hi/support/index.html:132 |

## Destinations sans page traduite

Là, la tuile garde l'adresse française. C'est ce qui manque réellement, par langue :

| langue | n | destinations |
|---|---|---|
| fr | 0 | — |
| en | 13 | fonds-ecran, creation-motifs, bicolore, bicolore-v2, encodeur, impression, cymatique, quadricolore, galerie-tricolore, galerie-bicolore, motifs-svg, contact, outils |
| es | 15 | fonds-ecran, creation-motifs, bicolore, bicolore-v2, encodeur, impression, cymatique, quadricolore, galerie-tricolore, galerie-bicolore, motifs-svg, articles, contact, a-propos, outils |
| th | 15 | fonds-ecran, creation-motifs, bicolore, bicolore-v2, encodeur, impression, cymatique, quadricolore, galerie-tricolore, galerie-bicolore, motifs-svg, articles, contact, a-propos, outils |
| zh | 15 | fonds-ecran, creation-motifs, bicolore, bicolore-v2, encodeur, impression, cymatique, hexagrammes, quadricolore, galerie-tricolore, galerie-bicolore, motifs-svg, articles, contact, a-propos |
| ru | 15 | fonds-ecran, creation-motifs, bicolore, bicolore-v2, encodeur, impression, cymatique, hexagrammes, quadricolore, galerie-tricolore, galerie-bicolore, motifs-svg, articles, contact, a-propos |
| pt | 15 | fonds-ecran, creation-motifs, bicolore, bicolore-v2, encodeur, impression, cymatique, hexagrammes, quadricolore, galerie-tricolore, galerie-bicolore, motifs-svg, articles, contact, a-propos |
| hi | 15 | fonds-ecran, creation-motifs, bicolore, bicolore-v2, encodeur, impression, cymatique, hexagrammes, quadricolore, galerie-tricolore, galerie-bicolore, motifs-svg, articles, contact, a-propos |

## Accueils (A03, 2026-10-04) — cartes ajoutées, sans source

Le modèle absorbe ce que les accueils avaient en plus : chaque accueil mène
désormais aux seize destinations (tools/check_accueils.mjs). Les cartes
ajoutées n'avaient pas de texte sur le site dans leur langue ; elles sont
traduites des cartes anglaises (« The interactive board », « Research
deposits », « Search ») et posées, à relire :

| accueil | carte | libellé | cible |
|---|---|---|---|
| es | tirage | « Tirada » (es/libro) + texte SANS SOURCE | tirage-livree-hermes.html?lang=en |
| es | travaux | « Depósitos de investigación » SANS SOURCE | travaux.html (français) |
| th | tirage | « การทำนาย » (th/book) + texte SANS SOURCE | tirage-livree-hermes.html?lang=en |
| th | travaux | « งานวิจัยที่เผยแพร่ » SANS SOURCE | travaux.html (français) |
| zh | tirage, recherche | « 起卦 », « 搜索 » SANS SOURCE | tirage (anglais), en/search/ |
| ru | tirage, recherche | « Гадание », « Поиск » SANS SOURCE | tirage (anglais), en/search/ |
| pt | tirage, recherche | « Tiragem », « Pesquisa » SANS SOURCE | tirage (anglais), en/search/ |
| hi | tirage, recherche | « हेक्साग्राम निकालें », « खोज » SANS SOURCE | tirage (anglais), en/search/ |

La ligne « Soutien · Contact » de la section « À propos » reprend les textes
des tuiles (bouton Soutien, tuile Contact), avec leur provenance ci-dessus.
Le tirage n'existe qu'en français et en anglais : les six autres accueils y
mènent en anglais (`?lang=en`).

## Navigation en cinq catégories (2026-10-05, prompt-navigation.md)

Posés dans les six langues (es, th, zh, ru, pt, hi), dans `scripts/nav-tiles-libelles.js`,
chaque chaîne avec sa provenance en commentaire :

- **les noms des cinq catégories** — Galeries, Animations, Tirages, Outils créatifs,
  À propos du projet : **sans source** pour Galeries, Tirages et Outils créatifs (sauf le
  chinois « 创作工具 », adapté de zh/tools/) ; Animations repris des titres de la galerie
  d'animations ; À propos du projet adapté de l'ancien groupe « Le projet ». « Tirages »
  couvre le tirage du Yi King et les calques d'impression : la traduction choisie dit les
  deux (« Draws & prints », « Tiradas e impresiones »…) — à confirmer ;
- **le nom du bloc** pour les lecteurs d'écran (« Pages du site ») : sans source ;
- **les sept nouvelles entrées** — Galerie d'animations (adaptée de la galerie), Tirage du
  Yi King, Carter Random, Profil documentaire, Chiffres et sources : sans source ; Soutenir
  et Travaux adaptés des pages /support/ et /works/ là où elles existent (zh, ru, pt, hi).
  Termes du glossaire respectés (`tools/check_glossaire.mjs`) : « ฉักลักษณ์ », « हेक्साग्राम »,
  « И цзин », « ई चिंग », « I Ching » (pt), « публикация ».
