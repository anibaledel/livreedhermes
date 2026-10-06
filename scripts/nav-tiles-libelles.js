/* ============================================================
   nav-tiles-libelles.js — les textes des tuiles de navigation dans les six
   langues ajoutées après le français et l'anglais (es, th, zh, ru, pt, hi).

   Règle d'Anibal : reprendre ce que le site dit déjà dans chaque langue
   plutôt que forger ; et « proposer quelque chose d'imparfait c'est TOUJOURS
   mieux que rien » — les textes sans source sur le site sont posés quand
   même, mais marqués. Chaque chaîne porte sa provenance en commentaire :
     « fichier:ligne »        reprise exacte d'un texte du site ;
     « adapté de … »          tirée d'un texte du site, retouchée ;
     « SANS SOURCE »          proposée, à relire par un lecteur natif.
   La liste des SANS SOURCE, langue par langue, est dans
   docs/tuiles-traductions-a-relire.md. Les termes du système suivent
   docs/terminologie-fr-en-es-th.md (tools/check_glossaire.mjs).
   Fusionné par scripts/nav-tiles.js ; le français et l'anglais restent là-bas.
   ============================================================ */
const GROUPES_I18N = {
  'creer': {
    es: "Crear", // adapté de es/libro/index.html:174 « Crear un motivo »
    th: "สร้าง", // adapté de th/book/index.html:174 « สร้างลวดลาย »
    zh: "创作", // zh/tools/index.html:210
    ru: "Создать", // adapté de ru/tools/index.html:166 « Создать узор »
    pt: "Criar", // adapté de pt/tools/index.html:166 « Criar um padrão »
    hi: "रचना", // hi/tools/index.html:154
  },
  'explorer': {
    es: "Explorar", // es/index.html:124
    th: "สำรวจ", // th/index.html:124
    zh: "探索", // zh/index.html:125
    ru: "Обзор", // ru/index.html:124 (sens « aperçu », pas « explorer »)
    pt: "Visão geral", // pt/index.html:124 (sens « aperçu »)
    hi: "एक नज़र में", // hi/index.html:124 (sens « en un coup d'œil »)
  },
  'lire': {
    es: "Leer", // adapté de es/index.html:117 « Leer en línea »
    th: "อ่าน", // adapté de th/index.html:117 « อ่านหนังสือออนไลน์ »
    zh: "阅读", // adapté de zh/index.html:117 « 在线阅读 »
    ru: "Читать", // adapté de ru/index.html:116 « Читать онлайн »
    pt: "Ler", // adapté de pt/index.html:116 « Ler online »
    hi: "पढ़ें", // adapté de hi/index.html:116 « ऑनलाइन पढ़ें »
  },
  'le-projet': {
    es: "El proyecto", // adapté de es/index.html:156 « Apoyar el proyecto »
    th: "โครงการ", // adapté de th/index.html:156 « สนับสนุนโครงการ »
    zh: "项目", // adapté de zh/tools/index.html:313 « 支持本项目 »
    ru: "Проект", // adapté de ru/tools/index.html:269 « Поддержать проект »
    pt: "O projeto", // adapté de pt/tools/index.html:269 « Apoiar o projeto »
    hi: "परियोजना", // adapté de hi/tools/index.html:269 « परियोजना को सहयोग दें »
  },
};

// Les cinq catégories du bloc (prompt-navigation.md, 2026-10-05), qui
// remplacent les quatre groupes ci-dessus (GROUPES_I18N, gardés pour mémoire).
// Toutes SANS SOURCE : aucune page du site ne les nommait encore.
const CATEGORIES_I18N = {
  'galeries': {
    es: "Galerías", // SANS SOURCE
    th: "แกลเลอรี", // SANS SOURCE
    zh: "图库", // SANS SOURCE
    ru: "Галереи", // SANS SOURCE
    pt: "Galerias", // SANS SOURCE
    hi: "गैलरी", // SANS SOURCE
  },
  'animations': {
    es: "Animaciones", // adapté de data/galerie-animations.json (textes.es.titre)
    th: "แอนิเมชัน", // adapté de data/galerie-animations.json (textes.th.titre)
    zh: "动画", // adapté de data/galerie-animations.json (textes.zh.titre)
    ru: "Анимации", // adapté de data/galerie-animations.json (textes.ru.titre)
    pt: "Animações", // adapté de data/galerie-animations.json (textes.pt.titre)
    hi: "एनिमेशन", // adapté de data/galerie-animations.json (textes.hi.titre)
  },
  'tirages': {
    es: "Tiradas e impresiones", // SANS SOURCE
    th: "การเสี่ยงทายและงานพิมพ์", // SANS SOURCE
    zh: "起卦与印制", // SANS SOURCE
    ru: "Гадание и печать", // SANS SOURCE
    pt: "Tiragens e impressões", // SANS SOURCE
    hi: "प्रश्न और मुद्रण", // SANS SOURCE
  },
  'outils-creatifs': {
    es: "Herramientas creativas", // SANS SOURCE
    th: "เครื่องมือสร้างสรรค์", // SANS SOURCE
    zh: "创作工具", // adapté de zh/tools/index.html (« 创作 »)
    ru: "Творческие инструменты", // SANS SOURCE
    pt: "Ferramentas criativas", // SANS SOURCE
    hi: "रचनात्मक उपकरण", // SANS SOURCE
  },
  'a-propos-du-projet': {
    es: "Acerca del proyecto", // adapté de « El proyecto » (GROUPES_I18N)
    th: "เกี่ยวกับโครงการ", // adapté de « โครงการ » (GROUPES_I18N)
    zh: "关于本项目", // adapté de « 项目 » (GROUPES_I18N)
    ru: "О проекте", // adapté de « Проект » (GROUPES_I18N)
    pt: "Sobre o projeto", // adapté de « O projeto » (GROUPES_I18N)
    hi: "परियोजना के बारे में", // adapté de « परियोजना » (GROUPES_I18N)
  },
};

// Le nom du bloc pour les lecteurs d'écran (<nav aria-label>). SANS SOURCE.
const NAV_LABEL_I18N = {
  es: "Páginas del sitio", th: "หน้าต่าง ๆ ของเว็บไซต์", zh: "网站页面",
  ru: "Страницы сайта", pt: "Páginas do sítio", hi: "साइट के पृष्ठ",
};

const TUILES_I18N = {
  // Les sept pages qui n'avaient pas de tuile (prompt-navigation.md) : textes
  // tirés de la page française, tous SANS SOURCE dans ces six langues.
  'galerie-animations': {
    es: { label: "Galería de animaciones", excerpt: "Las animaciones de las colecciones de fondos, en seis grupos: para ver, previsualizar y descargar en MP4." }, // adapté de data/galerie-animations.json
    th: { label: "แกลเลอรีแอนิเมชัน", excerpt: "แอนิเมชันของคอลเลกชันพื้นลาย แบ่งเป็นหกกลุ่ม ดู ดูตัวอย่าง และดาวน์โหลดเป็น MP4" }, // adapté de data/galerie-animations.json
    zh: { label: "动画图库", excerpt: "底纹系列的动画，分为六组：可观看、预览并下载为 MP4。" }, // adapté de data/galerie-animations.json
    ru: { label: "Галерея анимаций", excerpt: "Анимации коллекций фонов в шести группах: смотреть, просматривать и скачивать в MP4." }, // adapté de data/galerie-animations.json
    pt: { label: "Galeria de animações", excerpt: "As animações das coleções de fundos, em seis grupos: para ver, pré-visualizar e descarregar em MP4." }, // adapté de data/galerie-animations.json
    hi: { label: "एनिमेशन गैलरी", excerpt: "पृष्ठभूमि-संग्रहों के एनिमेशन, छह समूहों में: देखें, पूर्वावलोकन करें और MP4 में डाउनलोड करें।" }, // adapté de data/galerie-animations.json
  },
  'tirage': {
    es: { label: "Tirada del Yi King", excerpt: "Saque un hexagrama al azar y descubra su cuadrado, o recorra el tablero de las 64 mutaciones." }, // SANS SOURCE
    th: { label: "การเสี่ยงทายอี้จิง", excerpt: "สุ่มฉักลักษณ์หนึ่งแล้วดูจัตุรัสของมัน หรือไล่ดูกระดานของการเปลี่ยนแปลงทั้ง 64" }, // SANS SOURCE
    zh: { label: "易经起卦", excerpt: "随机起一卦并查看其方阵，或浏览六十四变化的棋盘。" }, // SANS SOURCE
    ru: { label: "Гадание по И цзин", excerpt: "Вытяните гексаграмму наугад и откройте её квадрат или пройдите по доске 64 перемен." }, // SANS SOURCE
    pt: { label: "Tiragem do I Ching", excerpt: "Tire um hexagrama ao acaso e descubra o seu quadrado, ou percorra o tabuleiro das 64 mutações." }, // SANS SOURCE
    hi: { label: "ई चिंग से प्रश्न", excerpt: "यादृच्छिक रूप से एक हेक्साग्राम निकालें और उसका वर्ग देखें, या 64 परिवर्तनों की बिसात देखें।" }, // SANS SOURCE
  },
  'carter-demo': {
    es: { label: "Carter Random", excerpt: "Demostración interactiva: la cuadrícula y los referentes derivados de la clave." }, // SANS SOURCE
    th: { label: "Carter Random", excerpt: "การสาธิตแบบโต้ตอบ: ตารางและตัวอ้างอิงที่ได้จากกุญแจ" }, // SANS SOURCE
    zh: { label: "Carter Random", excerpt: "交互演示：网格以及由密钥导出的参照。" }, // SANS SOURCE
    ru: { label: "Carter Random", excerpt: "Интерактивная демонстрация: сетка и референты, выведенные из ключа." }, // SANS SOURCE
    pt: { label: "Carter Random", excerpt: "Demonstração interativa: a grelha e os referentes derivados da chave." }, // SANS SOURCE
    hi: { label: "Carter Random", excerpt: "संवादात्मक प्रदर्शन: ग्रिड और कुंजी से निकले संदर्भ।" }, // SANS SOURCE
  },
  'profil': {
    es: { label: "Perfil documental", excerpt: "Patentes y 63 dibujos y modelos registrados en el INPI, que cubren los cuadrados de orden 12." }, // SANS SOURCE
    th: { label: "โปรไฟล์เอกสาร", excerpt: "สิทธิบัตรและแบบผลิตภัณฑ์ 63 แบบที่จดทะเบียนกับ INPI ครอบคลุมจัตุรัสอันดับ 12" }, // SANS SOURCE
    zh: { label: "文献档案", excerpt: "在法国国家工业产权局（INPI）登记的专利与 63 项外观设计，涵盖十二阶方阵。" }, // SANS SOURCE
    ru: { label: "Документальный профиль", excerpt: "Патенты и 63 промышленных образца, зарегистрированные в INPI, охватывающие квадраты 12-го порядка." }, // SANS SOURCE
    pt: { label: "Perfil documental", excerpt: "Patentes e 63 desenhos e modelos registados no INPI, que cobrem os quadrados de ordem 12." }, // SANS SOURCE
    hi: { label: "दस्तावेज़ी परिचय", excerpt: "INPI में पंजीकृत पेटेंट और 63 डिज़ाइन, जो कोटि 12 के वर्गों को समेटते हैं।" }, // SANS SOURCE
  },
  'soutien': {
    es: { label: "Apoyar", excerpt: "Apoyar La Livrée d'Hermès a precio libre: el sitio y su contenido siguen siendo gratuitos." }, // adapté de includes/footer-es.html (« Apoyar el proyecto »)
    th: { label: "สนับสนุน", excerpt: "สนับสนุน La Livrée d'Hermès ในราคาที่คุณกำหนดเอง เว็บไซต์และเนื้อหายังคงเป็นของฟรี" }, // SANS SOURCE
    zh: { label: "支持", excerpt: "以自定金额支持 La Livrée d'Hermès：网站及其内容仍完全免费。" }, // adapté de zh/support/index.html
    ru: { label: "Поддержать", excerpt: "Поддержите La Livrée d'Hermès по свободной цене: сайт и его содержание остаются бесплатными." }, // adapté de ru/support/index.html
    pt: { label: "Apoiar", excerpt: "Apoie La Livrée d'Hermès a preço livre: o sítio e o seu conteúdo continuam gratuitos." }, // adapté de pt/support/index.html
    hi: { label: "सहयोग दें", excerpt: "अपनी चुनी राशि से La Livrée d'Hermès को सहयोग दें: साइट और उसकी सामग्री निःशुल्क रहती है।" }, // adapté de hi/support/index.html
  },
  'chiffres': {
    es: { label: "Cifras y fuentes", excerpt: "Cada cifra del sitio, el script que la reproduce y la línea que imprime." }, // SANS SOURCE
    th: { label: "ตัวเลขและแหล่งที่มา", excerpt: "ตัวเลขทุกตัวบนเว็บไซต์ สคริปต์ที่สร้างซ้ำ และบรรทัดที่สคริปต์พิมพ์ออกมา" }, // SANS SOURCE
    zh: { label: "数字与出处", excerpt: "网站上的每个数字、复现它的脚本以及脚本打印的那一行。" }, // SANS SOURCE
    ru: { label: "Числа и источники", excerpt: "Каждое число сайта, скрипт, который его воспроизводит, и строка, которую он печатает." }, // SANS SOURCE
    pt: { label: "Números e fontes", excerpt: "Cada número do sítio, o script que o reproduz e a linha que imprime." }, // SANS SOURCE
    hi: { label: "आँकड़े और स्रोत", excerpt: "साइट का हर आँकड़ा, उसे दोहराने वाली स्क्रिप्ट और उसकी छापी हुई पंक्ति।" }, // SANS SOURCE
  },
  'travaux': {
    es: { label: "Trabajos", excerpt: "Los depósitos, el código y los artículos presentados, cada uno fechado y abierto." }, // SANS SOURCE
    th: { label: "ผลงาน", excerpt: "คลังข้อมูล โค้ด และบทความที่ส่งตีพิมพ์ แต่ละชิ้นประทับเวลาและเปิดเผย" }, // SANS SOURCE
    zh: { label: "成果", excerpt: "存档、代码与投稿论文，每一项都有时间戳并公开。" }, // adapté de zh/works/index.html
    ru: { label: "Работы", excerpt: "Публикации, код и поданные статьи — каждый с отметкой времени и в открытом доступе." }, // adapté de ru/works/index.html
    pt: { label: "Trabalhos", excerpt: "Os depósitos, o código e os artigos submetidos, cada um datado e aberto." }, // adapté de pt/works/index.html
    hi: { label: "कार्य", excerpt: "जमा किए गए अभिलेख, कोड और प्रस्तुत लेख, हर एक समय-मुहर के साथ और खुला।" }, // adapté de hi/works/index.html
  },
  'fonds-ecran': {
    es: {
      label: "Fondo de pantalla", // es/libro/index.html:179
      excerpt: "Fondos de pantalla textiles a pantalla completa, reactivos al sonido o en modo meditativo a ritmo regulable.", // SANS SOURCE
    },
    th: {
      label: "วอลเปเปอร์", // th/book/index.html:179
      excerpt: "วอลเปเปอร์ลายผ้าเต็มจอ ตอบสนองต่อเสียง หรือในโหมดสมาธิที่ปรับจังหวะได้", // SANS SOURCE
    },
    zh: {
      label: "壁纸", // zh/tools/index.html:278
      excerpt: "全屏织物壁纸，可随声音变化，也可切换为节奏可调的冥想模式。", // zh/tools/index.html:279 (sans « （法文页面） »)
    },
    ru: {
      label: "Обои", // ru/tools/index.html:230
      excerpt: "Полноэкранные текстильные обои: реагируют на звук или работают в медитативном режиме с настраиваемым ритмом.", // ru/tools/index.html:231
    },
    pt: {
      label: "Fundos de ecrã", // pt/tools/index.html:230
      excerpt: "Fundos de ecrã têxteis em ecrã inteiro: reagem ao som ou funcionam em modo meditativo, com ritmo ajustável.", // pt/tools/index.html:231
    },
    hi: {
      label: "वॉलपेपर", // hi/tools/index.html:230
      excerpt: "पूर्ण स्क्रीन पर वस्त्र-वॉलपेपर: ध्वनि पर प्रतिक्रिया करते हैं या ध्यान-मोड में चलते हैं, समायोज्य लय के साथ।", // hi/tools/index.html:231
    },
  },
  'creation-motifs': {
    es: {
      label: "Crear un motivo", // es/libro/index.html:174
      excerpt: "Componga sus propios motivos textiles a partir de las 60 imágenes del Yi King.", // SANS SOURCE ; « imágenes » : décision d'Anibal (2026-10-04), « 60 images » et non « 60 natures »
    },
    th: {
      label: "สร้างลวดลาย", // th/book/index.html:174
      excerpt: "ประกอบลวดลายผ้าของคุณเองจากภาพ 60 ภาพของอี้จิง", // SANS SOURCE ; « ภาพ » (images) : décision d'Anibal (2026-10-04)
    },
    zh: {
      label: "创作图案", // zh/tools/index.html:222
      excerpt: "以易经的 60 幅图像为基础，组合出属于您自己的织物图案。", // adapté de zh/tools/index.html:223 : « 性质 » (natures) → « 幅图像 » (images), décision d'Anibal (2026-10-04)
    },
    ru: {
      label: "Создать узор", // ru/tools/index.html:166
      excerpt: "Составляйте собственные текстильные узоры из 60 образов И цзин.", // ru/tools/index.html:167 (« образов » = images, pas « natures »)
    },
    pt: {
      label: "Criar um padrão", // pt/tools/index.html:166
      excerpt: "Componha os seus próprios padrões têxteis a partir das 60 figuras do I Ching.", // pt/tools/index.html:167 (« figuras », pas « natures »)
    },
    hi: {
      label: "पैटर्न बनाएँ", // hi/tools/index.html:166
      excerpt: "ई चिंग की 60 आकृतियों से अपने स्वयं के वस्त्र-पैटर्न रचें।", // hi/tools/index.html:167 (« आकृतियों » = figures)
    },
  },
  'bicolore': {
    es: {
      label: "Motivos bicolores", // SANS SOURCE
      excerpt: "Componga una celda de 12×12: seis niveles, cada uno con su familia y su matiz.", // SANS SOURCE
    },
    th: {
      label: "ลวดลายสองสี", // SANS SOURCE
      excerpt: "ประกอบเซลล์ขนาด 12×12 หกระดับ แต่ละระดับมีตระกูลและโทนสีของตัวเอง", // SANS SOURCE
    },
    zh: {
      label: "双色图案", // zh/tools/index.html:257
      excerpt: "组合一个 12×12 单元：六个层级，各有其族与色调。", // SANS SOURCE ; le texte du site (zh/tools/index.html:258) traduit l'ancien extrait « trait par trait, 15 familles »
    },
    ru: {
      label: "Двухцветные узоры", // ru/tools/index.html:206
      excerpt: "Составьте ячейку 12×12: шесть уровней, у каждого своё семейство и свой оттенок.", // SANS SOURCE ; ru/tools/index.html:207 = ancien extrait « 15 familles »
    },
    pt: {
      label: "Padrões bicolores", // pt/tools/index.html:206
      excerpt: "Componha uma célula 12×12: seis níveis, cada um com a sua família e o seu tom.", // SANS SOURCE ; pt/tools/index.html:207 = ancien extrait
    },
    hi: {
      label: "द्विवर्णी पैटर्न", // hi/tools/index.html:206
      excerpt: "एक 12×12 कोशिका रचें: छह स्तर, प्रत्येक का अपना परिवार और अपना रंग।", // SANS SOURCE ; hi/tools/index.html:207 = ancien extrait
    },
  },
  'bicolore-v2': {
    es: {
      label: "Motivos bicolores v2", // SANS SOURCE
      excerpt: "El segundo corte de las diagonales (YA/AY), vocabulario y estados del semidesplazamiento — junto a la herramienta v1.", // SANS SOURCE
    },
    th: {
      label: "ลวดลายสองสี v2", // SANS SOURCE
      excerpt: "การแบ่งเส้นทแยงครั้งที่สอง (YA/AY) คำศัพท์และสถานะของการเลื่อนครึ่งคาบ — ควบคู่กับเครื่องมือ v1", // SANS SOURCE
    },
    zh: {
      label: "双色图案 v2", // zh/tools/index.html:264
      excerpt: "对角线的第二种切分（YA/AY）：术语与半周期平移的各种状态——与 v1 工具并列。", // adapté de zh/tools/index.html:265 (« 角、元素 » → « 术语 » non sourcé)
    },
    ru: {
      label: "Двухцветные узоры v2", // ru/tools/index.html:214
      excerpt: "Второе разбиение диагоналей (YA/AY): словарь и статусы полусдвига — рядом с инструментом v1.", // adapté de ru/tools/index.html:215 (« углы, элементы » → « словарь » non sourcé)
    },
    pt: {
      label: "Padrões bicolores v2", // pt/tools/index.html:214
      excerpt: "A segunda divisão das diagonais (YA/AY): vocabulário e estados de meio-deslocamento — ao lado da ferramenta v1.", // adapté de pt/tools/index.html:215 (« vocabulário » non sourcé)
    },
    hi: {
      label: "द्विवर्णी पैटर्न v2", // hi/tools/index.html:214
      excerpt: "विकर्णों का दूसरा विभाजन (YA/AY): शब्दावली और अर्ध-विस्थापन की अवस्थाएँ — उपकरण v1 के साथ।", // adapté de hi/tools/index.html:215 (« शब्दावली » remplace « कोण, तत्व »)
    },
  },
  'encodeur': {
    es: {
      label: "Codificador", // es/libro/index.html:181
      excerpt: "Codificación esteganográfica geométrica por doble referente, cruz ansada y Jacquard.", // SANS SOURCE
    },
    th: {
      label: "ตัวเข้ารหัส", // th/book/index.html:181
      excerpt: "การเข้ารหัสซ่อนข้อมูลเชิงเรขาคณิตด้วยตัวอ้างอิงคู่ กางเขนหูหิ้ว และฌักการ์", // SANS SOURCE
    },
    zh: {
      label: "编码器", // zh/tools/index.html:292
      excerpt: "基于双重参照、安卡十字与提花织机的几何隐写编码。", // zh/tools/index.html:293 (sans « （法文页面） »)
    },
    ru: {
      label: "Кодировщик", // ru/tools/index.html:246
      excerpt: "Геометрическое стеганографическое кодирование с двойным референтом, крестом с петлёй и жаккардом.", // ru/tools/index.html:247
    },
    pt: {
      label: "Codificador", // pt/tools/index.html:246
      excerpt: "Codificação esteganográfica geométrica por duplo referente, cruz ansada e Jacquard.", // pt/tools/index.html:247
    },
    hi: {
      label: "एनकोडर", // hi/tools/index.html:246
      excerpt: "दोहरे संदर्भ, अंख क्रॉस और जैक्वार्ड द्वारा ज्यामितीय स्टेग्नोग्राफ़िक एनकोडिंग।", // hi/tools/index.html:247
    },
  },
  'impression': {
    es: {
      label: "360 capas", // adapté du glossaire (calque = capa) et du nom de la page
      excerpt: "Realice la tirada y descargue las capas de impresión, listas para imprimir.", // adapté de impression.html:581 (UI.es.subtitle)
    },
    th: {
      label: "แผ่นลาย 360 แผ่น", // adapté du glossaire (calque = แผ่นลาย) et du nom de la page
      excerpt: "ทำการทำนาย แล้วดาวน์โหลดแผ่นลายที่พร้อมพิมพ์", // adapté de impression.html:604 (UI.th.subtitle ; « ชั้นลาย » → « แผ่นลาย » selon le glossaire)
    },
    zh: {
      label: "360 图层", // adapté du glossaire (calque = 图层) et du nom de la page
      excerpt: "抽取并下载可直接付印的打印图层。", // zh/tools/index.html:286 (sans « （法文页面） »)
    },
    ru: {
      label: "360 слоёв", // adapté du glossaire (calque = слой) et du nom de la page
      excerpt: "Создавайте и скачивайте слои для печати, готовые к выводу на принтер.", // ru/tools/index.html:239
    },
    pt: {
      label: "360 camadas", // adapté du glossaire (calque = camada) et du nom de la page
      excerpt: "Gere e descarregue as camadas de impressão, prontas a imprimir.", // pt/tools/index.html:239
    },
    hi: {
      label: "360 परतें", // adapté du glossaire (calque = परत) et du nom de la page
      excerpt: "मुद्रण की परतें बनाएँ और डाउनलोड करें, छापने के लिए तैयार।", // hi/tools/index.html:239
    },
  },
  'cymatique': {
    es: {
      label: "Cimática", // es/libro/index.html:178
      excerpt: "El teselado cuya frecuencia espacial se acerca más al sonido que usted emite.", // SANS SOURCE
    },
    th: {
      label: "ไซแมติกส์", // th/book/index.html:178
      excerpt: "การปูลายที่มีความถี่เชิงพื้นที่ใกล้เคียงกับเสียงที่คุณเปล่งออกมามากที่สุด", // SANS SOURCE
    },
    zh: {
      label: "音流学", // zh/tools/index.html:271
      excerpt: "找出空间频率与您发出的声音最接近的那种铺排。", // zh/tools/index.html:272 (sans « （法文页面） »)
    },
    ru: {
      label: "Киматика", // ru/tools/index.html:222
      excerpt: "Замощение, пространственная частота которого ближе всего к звуку, который вы издаёте.", // ru/tools/index.html:223
    },
    pt: {
      label: "Cimática", // pt/tools/index.html:222
      excerpt: "A pavimentação cuja frequência espacial mais se aproxima do som que emite.", // pt/tools/index.html:223
    },
    hi: {
      label: "साइमैटिक्स", // hi/tools/index.html:222
      excerpt: "वह टाइलिंग जिसकी स्थानिक आवृत्ति उसकी उत्सर्जित ध्वनि के सबसे निकट है।", // hi/tools/index.html:223 (« उसकी » = « sa » : à relire, le FR dit « vous »)
    },
  },
  'hexagrammes': {
    es: {
      label: "Hexagramas", // es/index.html:151
      excerpt: "Los 64 hexagramas del Yi King: juicio, trigramas y el cuadrado mágico asociado a cada uno.", // adapté de es/index.html:127 (sans « imagen »)
    },
    th: {
      label: "ฉักลักษณ์", // th/index.html:151
      excerpt: "ฉักลักษณ์ทั้ง 64 ของอี้จิง: คำตัดสิน ตรีลักษณ์ และจัตุรัสกลที่สัมพันธ์กับแต่ละฉักลักษณ์", // adapté de th/index.html:127 (sans « ภาพลักษณ์ »)
    },
    zh: {
      label: "六十四卦", // adapté de zh/tools/index.html:309 (sans « （英文） »)
      excerpt: "易经 64 卦：每一卦的卦辞、三爻卦与幻方。", // adapté de zh/index.html:133 (sans 象、六爻、图案)
    },
    ru: {
      label: "Гексаграммы", // adapté de ru/tools/index.html:265 (sans « (на английском) »)
      excerpt: "64 гексаграммы И цзин: суждение, триграммы и магический квадрат для каждой.", // adapté de ru/index.html:132 (sans образ, шесть черт, узоры)
    },
    pt: {
      label: "Hexagramas", // adapté de pt/tools/index.html:265 (sans « (em inglês) »)
      excerpt: "Os 64 hexagramas do I Ching: julgamento, trigramas e quadrado mágico de cada um.", // adapté de pt/index.html:132 (sans imagem, seis linhas, padrões)
    },
    hi: {
      label: "हेक्साग्राम", // adapté de hi/tools/index.html:265 (sans « (अंग्रेज़ी में) »)
      excerpt: "ई चिंग के 64 हेक्साग्राम: प्रत्येक का निर्णय, त्रिग्राम और जादुई वर्ग।", // adapté de hi/index.html:132 (sans बिंब, छह रेखाएँ, पैटर्न)
    },
  },
  'quadricolore': {
    es: {
      label: "Magic quadricolore", // nom propre gardé tel quel, comme en EN (scripts/nav-tiles.js:66) ; le site traduit dit encore « Unified Patterns »
      excerpt: "Los 64 motivos de los hexagramas, personalizables y descargables en alta resolución.", // SANS SOURCE
    },
    th: {
      label: "Magic quadricolore", // nom propre gardé tel quel, comme en EN (scripts/nav-tiles.js:66) ; le site traduit dit encore « Unified Patterns »
      excerpt: "ลวดลาย 64 แบบของฉักลักษณ์ ปรับแต่งได้และดาวน์โหลดได้ในความละเอียดสูง", // SANS SOURCE
    },
    zh: {
      label: "Magic quadricolore", // nom propre gardé tel quel, comme en EN (scripts/nav-tiles.js:66) ; le site traduit dit encore « Unified Patterns »
      excerpt: "64 卦对应的 64 种图案，可自定义，并可下载高分辨率文件。", // zh/tools/index.html:230 (sans « （法文页面） »)
    },
    ru: {
      label: "Magic quadricolore", // nom propre gardé tel quel, comme en EN (scripts/nav-tiles.js:66) ; le site traduit dit encore « Unified Patterns »
      excerpt: "64 узора гексаграмм: их можно настроить и скачать в высоком разрешении.", // ru/tools/index.html:175
    },
    pt: {
      label: "Magic quadricolore", // nom propre gardé tel quel, comme en EN (scripts/nav-tiles.js:66) ; le site traduit dit encore « Unified Patterns »
      excerpt: "Os 64 padrões dos hexagramas, personalizáveis e descarregáveis em alta resolução.", // pt/tools/index.html:175
    },
    hi: {
      label: "Magic quadricolore", // nom propre gardé tel quel, comme en EN (scripts/nav-tiles.js:66) ; le site traduit dit encore « Unified Patterns »
      excerpt: "हेक्साग्रामों के 64 पैटर्न, अनुकूलन योग्य और उच्च रिज़ॉल्यूशन में डाउनलोड योग्य।", // hi/tools/index.html:175
    },
  },
  'galerie-tricolore': {
    es: {
      label: "Galería tricolor", // SANS SOURCE ; « Galería » seul : es/libro/index.html:176
      excerpt: "Motivos unificados, generados por mezcla de matices — seleccione un motivo para ver su teselado.", // SANS SOURCE
    },
    th: {
      label: "แกลเลอรีสามสี", // SANS SOURCE ; « แกลเลอรี » seul : th/book/index.html:176
      excerpt: "ลวดลายรวมเป็นหนึ่ง สร้างจากการผสมโทนสี — เลือกลวดลายเพื่อดูการปูลาย", // SANS SOURCE
    },
    zh: {
      label: "三色图库", // SANS SOURCE ; calqué sur « 双色图库 » zh/tools/index.html:243 ; le site dit « 图库 » (:236)
      excerpt: "由色调混合生成的统一图案——选中一个图案即可查看其铺排效果。", // zh/tools/index.html:237 (sans « （法文页面） »)
    },
    ru: {
      label: "Трёхцветная галерея", // SANS SOURCE ; calqué sur ru/tools/index.html:190 ; le site dit « Галерея » (:182)
      excerpt: "Унифицированные узоры, порождённые смешением оттенков. Выберите узор, чтобы увидеть его замощение.", // ru/tools/index.html:183
    },
    pt: {
      label: "Galeria tricolor", // SANS SOURCE ; calqué sur pt/tools/index.html:190 ; le site dit « Galeria » (:182)
      excerpt: "Padrões unificados, gerados pela mistura de tons. Escolha um padrão para ver a sua pavimentação.", // pt/tools/index.html:183
    },
    hi: {
      label: "त्रिवर्णी दीर्घा", // SANS SOURCE ; calqué sur hi/tools/index.html:190 ; le site dit « दीर्घा » (:182)
      excerpt: "रंगों के मिश्रण से बने एकीकृत पैटर्न। उसकी टाइलिंग देखने के लिए एक पैटर्न चुनें।", // hi/tools/index.html:183
    },
  },
  'galerie-bicolore': {
    es: {
      label: "Galería bicolor", // SANS SOURCE
      excerpt: "142 motivos bicolores generados por los ejes y cerrados sobre el cubo — grano de lectura, teselado, exportación.", // SANS SOURCE ; « maille » = grain C8/C1 (cf. galerie-bicolore.html:7), terme du glossaire
    },
    th: {
      label: "แกลเลอรีสองสี", // SANS SOURCE
      excerpt: "ลวดลายสองสี 142 แบบที่สร้างจากแกนและปิดบนลูกบาศก์ — เกรนการอ่าน การปูลาย การส่งออก", // SANS SOURCE ; « maille » = grain C8/C1 (cf. galerie-bicolore.html:7), terme du glossaire
    },
    zh: {
      label: "双色图库", // zh/tools/index.html:243
      excerpt: "由轴生成、能在立方体上闭合的 142 种双色图案——读取粒度、铺排、导出。", // adapté de zh/tools/index.html:244 + glossaire (读取粒度) ; « 导出 » non sourcé
    },
    ru: {
      label: "Двухцветная галерея", // ru/tools/index.html:190
      excerpt: "142 двухцветных узора, порождённые осями и замыкающиеся на кубе: зерно чтения, замощение, экспорт.", // adapté de ru/tools/index.html:191 + glossaire (зерно чтения) ; « экспорт » non sourcé
    },
    pt: {
      label: "Galeria bicolor", // pt/tools/index.html:190
      excerpt: "142 padrões bicolores gerados pelos eixos e fechados sobre o cubo: grão de leitura, pavimentação, exportação.", // adapté de pt/tools/index.html:191 + glossaire (grão de leitura) ; « exportação » non sourcé
    },
    hi: {
      label: "द्विवर्णी दीर्घा", // hi/tools/index.html:190
      excerpt: "अक्षों से बने और घन पर बंद 142 द्विवर्णी पैटर्न: पठन-कण, टाइलिंग, निर्यात।", // adapté de hi/tools/index.html:191 + glossaire (पठन-कण) ; « निर्यात » non sourcé
    },
  },
  'motifs-svg': {
    es: {
      label: "Motivos SVG", // es/libro/index.html:177
      excerpt: "Descargue las capas de impresión en 4 categorías de combinaciones de rasgos, en formato SVG.", // SANS SOURCE
    },
    th: {
      label: "ลวดลาย SVG", // th/book/index.html:177
      excerpt: "ดาวน์โหลดแผ่นลายสำหรับพิมพ์ใน 4 หมวดของการผสมเส้น ในรูปแบบ SVG", // SANS SOURCE
    },
    zh: {
      label: "SVG 图案", // zh/tools/index.html:250
      excerpt: "下载 SVG 格式的打印图层，按笔画组合分为 4 类。", // zh/tools/index.html:251 (sans « （法文页面） »)
    },
    ru: {
      label: "Узоры SVG", // ru/tools/index.html:198
      excerpt: "Скачайте слои для печати в формате SVG, в 4 категориях сочетаний черт.", // ru/tools/index.html:199
    },
    pt: {
      label: "Padrões SVG", // pt/tools/index.html:198
      excerpt: "Descarregue as camadas de impressão em SVG, em 4 categorias de combinações de linhas.", // pt/tools/index.html:199
    },
    hi: {
      label: "SVG पैटर्न", // hi/tools/index.html:198
      excerpt: "रेखा-संयोजनों की 4 श्रेणियों में, मुद्रण की परतें SVG में डाउनलोड करें।", // hi/tools/index.html:199
    },
  },
  'traite': {
    es: {
      label: "El tratado", // adapté de es/index.html:138 « El tratado está publicado… »
      excerpt: "El tratado y sus ediciones traducidas, los hexagramas y el léxico.", // SANS SOURCE
    },
    th: {
      label: "ตำรา", // adapté de th/index.html:114 (h1 « ตำรา 111 แผ่นภาพ »)
      excerpt: "ตำราและฉบับแปล ฉักลักษณ์ และอภิธานศัพท์", // SANS SOURCE
    },
    zh: {
      label: "论著", // zh/index.html:128 ; scripts/langues.js accueil.carte
      excerpt: "论著及其各语种译本、六十四卦与词汇表。", // SANS SOURCE
    },
    ru: {
      label: "Трактат", // ru/index.html:127
      excerpt: "Трактат и его переводные издания, гексаграммы и глоссарий.", // SANS SOURCE
    },
    pt: {
      label: "O tratado", // pt/index.html:127
      excerpt: "O tratado e as suas edições traduzidas, os hexagramas e o léxico.", // SANS SOURCE
    },
    hi: {
      label: "ग्रंथ", // hi/index.html:127
      excerpt: "ग्रंथ और उसके अनूदित संस्करण, हेक्साग्राम और शब्दावली।", // SANS SOURCE
    },
  },
  'lexique': {
    es: {
      label: "Léxico", // es/lexico/index.html:290
      excerpt: "Diez nociones clave para comprender La Livrée d'Hermès.", // SANS SOURCE ; le site décrit le lexique autrement : es/lexico/index.html:7 (définitions + FAQ), « dix notions » absent
    },
    th: {
      label: "อภิธานศัพท์", // th/lexicon/index.html:290
      excerpt: "แนวคิดสำคัญสิบประการเพื่อทำความเข้าใจ La Livrée d'Hermès", // SANS SOURCE ; le site décrit le lexique autrement : th/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent
    },
    zh: {
      label: "词汇表", // zh/lexicon/index.html:290
      excerpt: "理解 La Livrée d'Hermès 的十个关键概念。", // SANS SOURCE ; le site décrit le lexique autrement : zh/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent
    },
    ru: {
      label: "Глоссарий", // ru/lexicon/index.html:290
      excerpt: "Десять ключевых понятий для понимания La Livrée d'Hermès.", // SANS SOURCE ; le site décrit le lexique autrement : ru/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent
    },
    pt: {
      label: "Léxico", // pt/lexicon/index.html:290
      excerpt: "Dez noções-chave para compreender La Livrée d'Hermès.", // SANS SOURCE ; le site décrit le lexique autrement : pt/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent
    },
    hi: {
      label: "शब्दावली", // hi/lexicon/index.html:290
      excerpt: "La Livrée d'Hermès को समझने के लिए दस मुख्य अवधारणाएँ।", // SANS SOURCE ; le site décrit le lexique autrement : hi/lexicon/index.html:7 (définitions + FAQ), « dix notions » absent
    },
  },
  'articles': {
    es: {
      label: "Artículos", // es/libro/index.html:185
      excerpt: "Reflexiones e investigaciones en torno a La Livrée d'Hermès.", // SANS SOURCE
    },
    th: {
      label: "บทความ", // th/book/index.html:185
      excerpt: "ข้อคิดและงานวิจัยเกี่ยวกับ La Livrée d'Hermès", // SANS SOURCE
    },
    zh: {
      label: "文章", // adapté de zh/index.html:142 « 文章（英文） »
      excerpt: "围绕 La Livrée d'Hermès 的思考与研究。", // SANS SOURCE
    },
    ru: {
      label: "Статьи", // adapté de ru/index.html:141 « статьи »
      excerpt: "Размышления и исследования вокруг La Livrée d'Hermès.", // SANS SOURCE
    },
    pt: {
      label: "Artigos", // adapté de pt/index.html:141 « artigos »
      excerpt: "Reflexões e investigações em torno de La Livrée d'Hermès.", // SANS SOURCE
    },
    hi: {
      label: "लेख", // hi/index.html:141
      excerpt: "La Livrée d'Hermès से जुड़े चिंतन और शोध।", // SANS SOURCE
    },
  },
  'contact': {
    es: {
      label: "Contacto", // es/libro/index.html:182
      excerpt: "Contacte con el autor para un proyecto o un encargo de motivos e impresiones textiles.", // SANS SOURCE
    },
    th: {
      label: "ติดต่อ", // th/book/index.html:182
      excerpt: "ติดต่อผู้แต่งสำหรับโครงการ หรือการสั่งทำลวดลายและงานพิมพ์บนผ้า", // SANS SOURCE
    },
    zh: {
      label: "联系", // zh/tools/index.html:312
      excerpt: "如需合作项目，或订制图案与织物印制，请联系作者。", // SANS SOURCE
    },
    ru: {
      label: "Контакты", // ru/tools/index.html:268
      excerpt: "Свяжитесь с автором по поводу проекта или заказа узоров и текстильных отпечатков.", // SANS SOURCE
    },
    pt: {
      label: "Contacto", // pt/tools/index.html:268
      excerpt: "Contacte o autor para um projeto ou uma encomenda de padrões e impressões têxteis.", // SANS SOURCE
    },
    hi: {
      label: "संपर्क", // hi/tools/index.html:268
      excerpt: "किसी परियोजना, या पैटर्न और वस्त्र-मुद्रण के ऑर्डर के लिए लेखक से संपर्क करें।", // SANS SOURCE
    },
  },
  'a-propos': {
    es: {
      label: "Acerca de", // es/libro/index.html:183
      excerpt: "El autor y su libro, en la encrucijada de la filosofía, las matemáticas y las ciencias aplicadas.", // SANS SOURCE
    },
    th: {
      label: "เกี่ยวกับ", // th/book/index.html:183
      excerpt: "ผู้แต่งและหนังสือของเขา ณ จุดบรรจบของปรัชญา คณิตศาสตร์ และวิทยาศาสตร์ประยุกต์", // SANS SOURCE
    },
    zh: {
      label: "关于", // zh/index.html:140
      excerpt: "作者及其著作，处于哲学、数学与应用科学的交汇处。", // SANS SOURCE
    },
    ru: {
      label: "Об авторе", // adapté de ru/tools/index.html:267 (sans « (на французском) »)
      excerpt: "Автор и его книга — на пересечении философии, математики и прикладных наук.", // SANS SOURCE
    },
    pt: {
      label: "Sobre o autor", // adapté de pt/tools/index.html:267 (sans « (em francês) »)
      excerpt: "O autor e o seu livro, no cruzamento da filosofia, da matemática e das ciências aplicadas.", // SANS SOURCE
    },
    hi: {
      label: "लेखक के बारे में", // adapté de hi/tools/index.html:267 (sans « (फ़्रेंच में) »)
      excerpt: "लेखक और उनकी पुस्तक — दर्शन, गणित और अनुप्रयुक्त विज्ञान के संगम पर।", // SANS SOURCE
    },
  },
  'outils': {
    es: {
      label: "Herramientas", // adapté de es/index.html:137 « herramientas »
      excerpt: "Todas las herramientas interactivas del sitio, reunidas en un solo lugar.", // SANS SOURCE
    },
    th: {
      label: "เครื่องมือ", // th/index.html:137
      excerpt: "เครื่องมือแบบโต้ตอบทั้งหมดของเว็บไซต์ รวมไว้ในที่เดียว", // SANS SOURCE
    },
    zh: {
      label: "工具", // zh/tools/index.html:209
      excerpt: "网站的全部交互式工具，汇集于一处。", // SANS SOURCE ; « outils interactifs du site » existe (zh/index.html:132), « réunis en un seul endroit » non
    },
    ru: {
      label: "Инструменты", // ru/tools/index.html:153
      excerpt: "Все интерактивные инструменты сайта, собранные в одном месте.", // SANS SOURCE ; « outils interactifs du site » existe (ru/index.html:131), « réunis en un seul endroit » non
    },
    pt: {
      label: "Ferramentas", // pt/tools/index.html:153
      excerpt: "Todas as ferramentas interativas do site, reunidas num só lugar.", // SANS SOURCE ; « outils interactifs du site » existe (pt/index.html:131), « réunis en un seul endroit » non
    },
    hi: {
      label: "उपकरण", // hi/tools/index.html:153
      excerpt: "साइट के सभी संवादात्मक उपकरण, एक ही स्थान पर।", // SANS SOURCE ; « outils interactifs du site » existe (hi/index.html:131), « réunis en un seul endroit » non
    },
  },
};

const ACCUEIL_I18N = {
  es: {
    label: "Inicio", // es/index.html:149
    excerpt: "El libro, sus láminas y el conjunto de las herramientas.", // SANS SOURCE
  },
  th: {
    label: "หน้าแรก", // th/index.html:149
    excerpt: "หนังสือ แผ่นภาพ และเครื่องมือทั้งหมด", // SANS SOURCE
  },
  zh: {
    label: "首页", // zh/tools/index.html:304
    excerpt: "本书、书中图版与全部工具。", // SANS SOURCE
  },
  ru: {
    label: "Главная", // ru/tools/index.html:260
    excerpt: "Книга, её таблицы и все инструменты.", // SANS SOURCE
  },
  pt: {
    label: "Início", // pt/tools/index.html:260
    excerpt: "O livro, as suas pranchas e todas as ferramentas.", // SANS SOURCE
  },
  hi: {
    label: "मुखपृष्ठ", // hi/tools/index.html:260
    excerpt: "पुस्तक, उसके चित्रफलक और सभी उपकरण।", // SANS SOURCE
  },
};

const SOUTIEN_BTN_I18N = {
  es: {
    label: "Hágase Colaborador/a", // es/libro/index.html:168, :197
    title: "Apoye La Livrée d'Hermès al precio que quiera: todo es libre bajo CC BY-NC 4.0; su apoyo financia la continuación del proyecto.", // es/libro/index.html:168, :197
  },
  th: {
    label: "มาเป็นผู้สนับสนุน", // th/book/index.html:168, :197
    title: "สนับสนุน La Livrée d'Hermès ในราคาที่คุณกำหนด — ทุกอย่างเปิดให้ใช้ฟรีภายใต้ CC BY-NC 4.0 การสนับสนุนของคุณช่วยให้โครงการเดินหน้าต่อไป", // th/book/index.html:168, :197
  },
  zh: {
    label: "支持本项目", // adapté de zh/tools/index.html:313 (« soutenir le projet », pas « devenir soutien »)
    title: "以自定金额支持 La Livrée d'Hermès：一切内容均免费开放（CC BY-NC 4.0）；您的支持用于资助项目的后续发展。", // adapté de zh/support/index.html:7 + zh/index.html:135 + zh/support/index.html:125
  },
  ru: {
    label: "Поддержать проект", // adapté de ru/tools/index.html:269
    title: "Поддержите La Livrée d'Hermès по свободной цене: всё доступно бесплатно по лицензии CC BY-NC 4.0; ваша поддержка финансирует продолжение проекта.", // adapté de ru/support/index.html:7 + ru/index.html:134 + ru/support/index.html:132
  },
  pt: {
    label: "Apoiar o projeto", // adapté de pt/tools/index.html:269
    title: "Apoie La Livrée d'Hermès a preço livre: tudo é gratuito, sob licença CC BY-NC 4.0; o seu apoio financia a continuação do projeto.", // adapté de pt/support/index.html:7 + pt/index.html:134 + pt/support/index.html:132
  },
  hi: {
    label: "परियोजना को सहयोग दें", // adapté de hi/tools/index.html:269
    title: "La Livrée d'Hermès को अपनी इच्छा से तय की गई राशि से सहयोग दें: सब कुछ निःशुल्क है, CC BY-NC 4.0 लाइसेंस के अंतर्गत; आपका सहयोग परियोजना को आगे बढ़ाता है।", // adapté de hi/support/index.html:7 + hi/index.html:134 + hi/support/index.html:132
  },
};

const CREDIT_COLLAB_I18N = {
  es: "Creado en colaboración con Claude", // es/libro/index.html:191 ; es/lexico/index.html:403
  th: "สร้างร่วมกับ Claude", // th/book/index.html:191 (th/lexicon/index.html:403 dit « สร้างขึ้นร่วมกับ Claude »)
  zh: "与 Claude 合作完成", // zh/lexicon/index.html:403
  ru: "Создано в сотрудничестве с Claude", // ru/lexicon/index.html:403
  pt: "Criado em colaboração com Claude", // pt/lexicon/index.html:403
  hi: "Claude के सहयोग से निर्मित", // hi/lexicon/index.html:403
};

const COPYRIGHT_SUFFIX_I18N = {
  es: "CC BY-NC 4.0", // es/lexico/index.html:403 (nom de licence, ne se traduit pas)
  th: "CC BY-NC 4.0", // th/lexicon/index.html:403 (nom de licence, ne se traduit pas)
  zh: "CC BY-NC 4.0", // zh/lexicon/index.html:403 (nom de licence, ne se traduit pas)
  ru: "CC BY-NC 4.0", // ru/lexicon/index.html:403 (nom de licence, ne se traduit pas)
  pt: "CC BY-NC 4.0", // pt/lexicon/index.html:403 (nom de licence, ne se traduit pas)
  hi: "CC BY-NC 4.0", // hi/lexicon/index.html:403 (nom de licence, ne se traduit pas)
};

module.exports = { GROUPES_I18N, CATEGORIES_I18N, NAV_LABEL_I18N, TUILES_I18N, ACCUEIL_I18N, SOUTIEN_BTN_I18N, CREDIT_COLLAB_I18N, COPYRIGHT_SUFFIX_I18N };
