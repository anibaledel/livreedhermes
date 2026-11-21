// pavane-textes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Les libellés de « Pavane — Voir sa musique », en 11 langues (prompt 211, §8) : courts, en langage clair, sans jargon. Français, anglais, espagnol : de la main de CC ; les autres sont
// traduits depuis le français et sont à RELIRE (TODO-RELECTURE.md, thaï et japonais d'abord). Un motif y est nommé « Hexagramme {kw} · n° {n} du site » : le numéro King Wen d'abord, le numéro du site ensuite.
// Le nom de l'application n'est écrit ici nulle part : il vient de assets/pavane-nom.js.
export const LANGUES = Object.freeze(['fr', 'en', 'es', 'th', 'zh', 'ru', 'pt', 'hi', 'de', 'it', 'ja']);
export const TEXTES = {
  fr: {
    ouvrir: "Ouvrir la nouvelle interface",
    titreApp: "Voir sa musique",
    modes: 'Mode', defile: 'Défilé', defileP: 'Les motifs se suivent, du plus proche au plus proche, au rythme d\'un minuteur ou de la pulsation du son.',
    spectre: 'Spectre', spectreP: 'Le son choisit le motif dont le spectre lui ressemble le plus.', entreDeux: 'Entre-deux', entreDeuxP: 'Le spectre guide, le rythme avance : à chaque pulsation, un motif voisin parmi ceux qui ressemblent au son.', reglages: 'Réglages',
    fond: 'Fond', fond_P: 'Aplat', fond_B2Dx: 'Triangles', fond_B11211Dx: 'Bandes',
    corpus: 'Motifs', corpus64: '64 motifs', corpus128: '128 : motifs et leurs négatifs', corpus256: '256 motifs',
    palette: 'Couleurs', 'palette_creme-encre': 'Crème et encre', 'palette_rouge-blanc': 'Blanc et rouge', palette_mono: 'Gris et noir', palette_perso: 'Personnalisé', couleurFond: 'Fond', couleurFigure: 'Figure',
    contrasteRefus: 'Ces deux couleurs sont trop proches : choisissez-en deux plus contrastées.', trace: 'Tracé rouge', rythme: 'Rythme : {s} s par motif', densite: 'Densité : {n}',
    pause: 'Pause', reprendre: 'Reprendre', pleinEcran: 'Plein écran', flash: 'Attention : les motifs changent et peuvent clignoter. Évitez-le si vous êtes sensible aux lumières vives. Les changements rapides sont réduits quand votre appareil le demande.',
    motif: 'Hexagramme {kw} · n° {n} du site', enPause: 'En pause.', attenteSon: 'En attente du son.', reduit: 'Changements rapides réduits.', scene: 'Motif affiché', chargement: 'Chargement…', erreur: 'Impossible de charger les motifs.',
    // bloc 2 : les sources du son, l'enregistrement
    sources: 'Source du son', srcMorceau: 'Morceau fourni', srcFichier: 'Fichier', srcMicro: 'Micro', srcNote: 'Note pure', morceauN: 'Morceau {n}', choisirFichier: 'Choisir un fichier audio', activerMicro: 'Activer le micro', jouer: 'Jouer', arreter: 'Arrêter', frequence: 'Fréquence : {hz} Hz', declencheur: 'Changer de motif', declMinuteur: 'au minuteur', declPulsation: 'à la pulsation du son', enregImage: 'Enregistrer l\'image', enregVideo: 'Enregistrer 15 s de vidéo', enregEnCours: 'Enregistrement… {s} s', erreurMicro: 'Micro indisponible ou refusé.', microRepli: 'Micro indisponible ou refusé : voici un morceau d\'exemple à la place.', erreurFichier: 'Ce fichier audio ne peut pas être lu.', erreurEnreg: 'Enregistrement indisponible sur cet appareil.', repli: 'Pas de pulsation régulière : le minuteur prend le relais.', silence: 'Silence.', mentionIA: 'Morceaux originaux composés avec l\'aide de l\'IA.', sonActif: 'Son : {nom}', rienNeJoue: 'Aucun son pour l\'instant.',
  },
  en: {
    ouvrir: "Open the new interface",
    titreApp: "See your music",
    modes: 'Mode', defile: 'Parade', defileP: 'Patterns follow one another, nearest to nearest, on a timer or on the beat of the sound.',
    spectre: 'Spectrum', spectreP: 'The sound picks the pattern whose spectrum looks most like it.', entreDeux: 'In between', entreDeuxP: 'The spectrum guides, the beat advances: on each beat, a neighbouring pattern among those that look like the sound.', reglages: 'Settings',
    fond: 'Background', fond_P: 'Solid', fond_B2Dx: 'Triangles', fond_B11211Dx: 'Stripes',
    corpus: 'Patterns', corpus64: '64 patterns', corpus128: '128: patterns and their negatives', corpus256: '256 patterns',
    palette: 'Colours', 'palette_creme-encre': 'Cream and ink', 'palette_rouge-blanc': 'White and red', palette_mono: 'Grey and black', palette_perso: 'Custom', couleurFond: 'Background', couleurFigure: 'Figure',
    contrasteRefus: 'These two colours are too close: pick two with more contrast.', trace: 'Red outline', rythme: 'Pace: {s} s per pattern', densite: 'Density: {n}',
    pause: 'Pause', reprendre: 'Resume', pleinEcran: 'Full screen', flash: 'Warning: the patterns change and may flicker. Avoid it if you are sensitive to bright lights. Fast changes are reduced when your device asks for it.',
    motif: 'Hexagram {kw} · site no. {n}', enPause: 'Paused.', attenteSon: 'Waiting for sound.', reduit: 'Fast changes reduced.', scene: 'Pattern shown', chargement: 'Loading…', erreur: 'The patterns could not be loaded.',
    // bloc 2 : les sources du son, l'enregistrement
    sources: 'Sound source', srcMorceau: 'Supplied track', srcFichier: 'File', srcMicro: 'Microphone', srcNote: 'Pure note', morceauN: 'Track {n}', choisirFichier: 'Choose an audio file', activerMicro: 'Turn on the microphone', jouer: 'Play', arreter: 'Stop', frequence: 'Frequency: {hz} Hz', declencheur: 'Change pattern', declMinuteur: 'on a timer', declPulsation: 'on the beat of the sound', enregImage: 'Save the image', enregVideo: 'Record 15 s of video', enregEnCours: 'Recording… {s} s', erreurMicro: 'Microphone unavailable or refused.', microRepli: 'Microphone unavailable or refused: here is an example track instead.', erreurFichier: 'This audio file cannot be played.', erreurEnreg: 'Recording is not available on this device.', repli: 'No steady beat: the timer takes over.', silence: 'Silence.', mentionIA: 'Original tracks composed with the help of AI.', sonActif: 'Sound: {nom}', rienNeJoue: 'No sound yet.',
  },
  es: {
    ouvrir: "Abrir la nueva interfaz",
    titreApp: "Ver tu música",
    modes: 'Modo', defile: 'Desfile', defileP: 'Los motivos se suceden, del más cercano al más cercano, al ritmo de un temporizador o de la pulsación del sonido.',
    spectre: 'Espectro', spectreP: 'El sonido elige el motivo cuyo espectro más se le parece.', entreDeux: 'Entre ambos', entreDeuxP: 'El espectro guía, el ritmo avanza: en cada pulsación, un motivo vecino entre los que se parecen al sonido.', reglages: 'Ajustes',
    fond: 'Fondo', fond_P: 'Liso', fond_B2Dx: 'Triángulos', fond_B11211Dx: 'Bandas',
    corpus: 'Motivos', corpus64: '64 motivos', corpus128: '128: motivos y sus negativos', corpus256: '256 motivos',
    palette: 'Colores', 'palette_creme-encre': 'Crema y tinta', 'palette_rouge-blanc': 'Blanco y rojo', palette_mono: 'Gris y negro', palette_perso: 'Personalizado', couleurFond: 'Fondo', couleurFigure: 'Figura',
    contrasteRefus: 'Estos dos colores están demasiado cerca: elija dos con más contraste.', trace: 'Trazo rojo', rythme: 'Ritmo: {s} s por motivo', densite: 'Densidad: {n}',
    pause: 'Pausa', reprendre: 'Reanudar', pleinEcran: 'Pantalla completa', flash: 'Atención: los motivos cambian y pueden parpadear. Evítelo si es sensible a las luces intensas. Los cambios rápidos se reducen cuando su dispositivo lo pide.',
    motif: 'Hexagrama {kw} · n.º {n} del sitio', enPause: 'En pausa.', attenteSon: 'Esperando el sonido.', reduit: 'Cambios rápidos reducidos.', scene: 'Motivo mostrado', chargement: 'Cargando…', erreur: 'No se pudieron cargar los motivos.',
    // bloc 2 : les sources du son, l'enregistrement
    sources: 'Fuente del sonido', srcMorceau: 'Pista incluida', srcFichier: 'Archivo', srcMicro: 'Micrófono', srcNote: 'Nota pura', morceauN: 'Pista {n}', choisirFichier: 'Elegir un archivo de audio', activerMicro: 'Activar el micrófono', jouer: 'Reproducir', arreter: 'Detener', frequence: 'Frecuencia: {hz} Hz', declencheur: 'Cambiar de motivo', declMinuteur: 'con un temporizador', declPulsation: 'con la pulsación del sonido', enregImage: 'Guardar la imagen', enregVideo: 'Grabar 15 s de vídeo', enregEnCours: 'Grabando… {s} s', erreurMicro: 'Micrófono no disponible o rechazado.', microRepli: 'Micrófono no disponible o rechazado: aquí tienes una pieza de ejemplo en su lugar.', erreurFichier: 'Este archivo de audio no se puede reproducir.', erreurEnreg: 'La grabación no está disponible en este dispositivo.', repli: 'Sin pulsación regular: el temporizador toma el relevo.', silence: 'Silencio.', mentionIA: 'Pistas originales compuestas con ayuda de la IA.', sonActif: 'Sonido: {nom}', rienNeJoue: 'Todavía no hay sonido.',
  },
  th: {
    ouvrir: "เปิดอินเทอร์เฟซใหม่",
    titreApp: "มองเห็นดนตรีของคุณ",
    modes: 'โหมด', defile: 'ขบวน', defileP: 'ลวดลายต่อกันไป จากแบบที่ใกล้ที่สุดไปแบบที่ใกล้ที่สุด ตามตัวจับเวลาหรือจังหวะของเสียง',
    spectre: 'สเปกตรัม', spectreP: 'เสียงเลือกลวดลายที่สเปกตรัมคล้ายกับมันที่สุด', entreDeux: 'ระหว่างกลาง', entreDeuxP: 'สเปกตรัมนำทาง จังหวะพาเดินหน้า: ทุกจังหวะ จะเลือกลวดลายข้างเคียงจากกลุ่มที่คล้ายเสียง', reglages: 'การตั้งค่า',
    fond: 'พื้นหลัง', fond_P: 'สีเรียบ', fond_B2Dx: 'สามเหลี่ยม', fond_B11211Dx: 'แถบ',
    corpus: 'ลวดลาย', corpus64: '64 ลวดลาย', corpus128: '128: ลวดลายและภาพกลับของมัน', corpus256: '256 ลวดลาย',
    palette: 'สี', 'palette_creme-encre': 'ครีมและหมึก', 'palette_rouge-blanc': 'ขาวและแดง', palette_mono: 'เทาและดำ', palette_perso: 'กำหนดเอง', couleurFond: 'พื้นหลัง', couleurFigure: 'ตัวลาย',
    contrasteRefus: 'สองสีนี้ใกล้กันเกินไป โปรดเลือกสองสีที่ต่างกันมากกว่านี้', trace: 'เส้นขอบสีแดง', rythme: 'จังหวะ: {s} วินาทีต่อลาย', densite: 'ความหนาแน่น: {n}',
    pause: 'หยุดชั่วคราว', reprendre: 'เล่นต่อ', pleinEcran: 'เต็มจอ', flash: 'คำเตือน: ลวดลายเปลี่ยนและอาจกะพริบ โปรดหลีกเลี่ยงหากไวต่อแสงจ้า การเปลี่ยนที่เร็วจะลดลงเมื่ออุปกรณ์ของคุณร้องขอ',
    motif: 'ฉักลักษณ์ {kw} · ลำดับที่ {n} ของเว็บไซต์', enPause: 'หยุดชั่วคราว', attenteSon: 'รอเสียง', reduit: 'ลดการเปลี่ยนที่เร็วแล้ว', scene: 'ลวดลายที่แสดง', chargement: 'กำลังโหลด…', erreur: 'โหลดลวดลายไม่ได้',
    // bloc 2 : les sources du son, l'enregistrement
    sources: 'แหล่งเสียง', srcMorceau: 'เพลงที่มีให้', srcFichier: 'ไฟล์', srcMicro: 'ไมโครโฟน', srcNote: 'โน้ตเดี่ยว', morceauN: 'เพลงที่ {n}', choisirFichier: 'เลือกไฟล์เสียง', activerMicro: 'เปิดไมโครโฟน', jouer: 'เล่น', arreter: 'หยุด', frequence: 'ความถี่: {hz} เฮิรตซ์', declencheur: 'เปลี่ยนลวดลาย', declMinuteur: 'ตามตัวจับเวลา', declPulsation: 'ตามจังหวะของเสียง', enregImage: 'บันทึกภาพ', enregVideo: 'บันทึกวิดีโอ 15 วินาที', enregEnCours: 'กำลังบันทึก… {s} วินาที', erreurMicro: 'ไมโครโฟนใช้ไม่ได้หรือถูกปฏิเสธ', microRepli: 'ไมโครโฟนใช้ไม่ได้หรือถูกปฏิเสธ จึงเล่นเพลงตัวอย่างแทน', erreurFichier: 'เล่นไฟล์เสียงนี้ไม่ได้', erreurEnreg: 'อุปกรณ์นี้บันทึกไม่ได้', repli: 'ไม่มีจังหวะสม่ำเสมอ: ตัวจับเวลาเข้ามาแทน', silence: 'เงียบ', mentionIA: 'เพลงต้นฉบับที่แต่งด้วยความช่วยเหลือของ AI', sonActif: 'เสียง: {nom}', rienNeJoue: 'ยังไม่มีเสียง',
  },
  zh: {
    ouvrir: "打开新界面",
    titreApp: "看见你的音乐",
    modes: '模式', defile: '游行', defileP: '图案依次相接，从最近的到最近的，按计时器或声音的节拍推进。',
    spectre: '频谱', spectreP: '声音选出频谱与它最相似的图案。', entreDeux: '折中', entreDeuxP: '频谱引路，节拍前行：每个节拍，从与声音相似的图案中选一个相邻的。', reglages: '设置',
    fond: '底纹', fond_P: '纯色', fond_B2Dx: '三角形', fond_B11211Dx: '条纹',
    corpus: '图案', corpus64: '64 个图案', corpus128: '128：图案及其反相', corpus256: '256 个图案',
    palette: '颜色', 'palette_creme-encre': '奶油色与墨色', 'palette_rouge-blanc': '白与红', palette_mono: '灰与黑', palette_perso: '自定义', couleurFond: '底色', couleurFigure: '图形色',
    contrasteRefus: '这两种颜色太接近：请选择对比更强的两种。', trace: '红色轮廓', rythme: '节奏：每个图案 {s} 秒', densite: '密度：{n}',
    pause: '暂停', reprendre: '继续', pleinEcran: '全屏', flash: '注意：图案会变化并可能闪烁。若您对强光敏感，请避免使用。当设备提出要求时，快速变化会被减少。',
    motif: '卦 {kw} · 站内第 {n} 号', enPause: '已暂停。', attenteSon: '等待声音。', reduit: '已减少快速变化。', scene: '当前图案', chargement: '加载中…', erreur: '无法加载图案。',
    // bloc 2 : les sources du son, l'enregistrement
    sources: '声音来源', srcMorceau: '自带曲目', srcFichier: '文件', srcMicro: '麦克风', srcNote: '纯音', morceauN: '曲目 {n}', choisirFichier: '选择音频文件', activerMicro: '开启麦克风', jouer: '播放', arreter: '停止', frequence: '频率：{hz} 赫兹', declencheur: '切换图案', declMinuteur: '按计时器', declPulsation: '按声音的节拍', enregImage: '保存图像', enregVideo: '录制 15 秒视频', enregEnCours: '录制中… {s} 秒', erreurMicro: '麦克风不可用或被拒绝。', microRepli: '麦克风不可用或被拒绝，已改为播放示例曲目。', erreurFichier: '无法播放此音频文件。', erreurEnreg: '此设备无法录制。', repli: '没有稳定的节拍：由计时器接手。', silence: '静音。', mentionIA: '原创曲目，在人工智能协助下创作。', sonActif: '声音：{nom}', rienNeJoue: '暂时没有声音。',
  },
  ru: {
    ouvrir: "Открыть новый интерфейс",
    titreApp: "Увидеть свою музыку",
    modes: 'Режим', defile: 'Шествие', defileP: 'Узоры следуют один за другим, от ближайшего к ближайшему, по таймеру или в такт звуку.',
    spectre: 'Спектр', spectreP: 'Звук выбирает узор, спектр которого больше всего на него похож.', entreDeux: 'Золотая середина', entreDeuxP: 'Спектр ведёт, ритм продвигает: на каждый удар — соседний узор среди тех, что похожи на звук.', reglages: 'Настройки',
    fond: 'Фон', fond_P: 'Сплошной', fond_B2Dx: 'Треугольники', fond_B11211Dx: 'Полосы',
    corpus: 'Узоры', corpus64: '64 узора', corpus128: '128: узоры и их негативы', corpus256: '256 узоров',
    palette: 'Цвета', 'palette_creme-encre': 'Кремовый и чернильный', 'palette_rouge-blanc': 'Белый и красный', palette_mono: 'Серый и чёрный', palette_perso: 'Свои цвета', couleurFond: 'Фон', couleurFigure: 'Фигура',
    contrasteRefus: 'Эти два цвета слишком близки: выберите более контрастные.', trace: 'Красный контур', rythme: 'Темп: {s} с на узор', densite: 'Плотность: {n}',
    pause: 'Пауза', reprendre: 'Продолжить', pleinEcran: 'Во весь экран', flash: 'Внимание: узоры меняются и могут мерцать. Избегайте, если чувствительны к яркому свету. Быстрые смены уменьшаются, когда этого просит устройство.',
    motif: 'Гексаграмма {kw} · № {n} на сайте', enPause: 'Пауза.', attenteSon: 'Ожидание звука.', reduit: 'Быстрые смены уменьшены.', scene: 'Показанный узор', chargement: 'Загрузка…', erreur: 'Не удалось загрузить узоры.',
    // bloc 2 : les sources du son, l'enregistrement
    sources: 'Источник звука', srcMorceau: 'Встроенный трек', srcFichier: 'Файл', srcMicro: 'Микрофон', srcNote: 'Чистая нота', morceauN: 'Трек {n}', choisirFichier: 'Выбрать аудиофайл', activerMicro: 'Включить микрофон', jouer: 'Играть', arreter: 'Стоп', frequence: 'Частота: {hz} Гц', declencheur: 'Смена узора', declMinuteur: 'по таймеру', declPulsation: 'в такт звуку', enregImage: 'Сохранить изображение', enregVideo: 'Записать 15 с видео', enregEnCours: 'Запись… {s} с', erreurMicro: 'Микрофон недоступен или отклонён.', microRepli: 'Микрофон недоступен или отклонён: вместо него звучит пробная композиция.', erreurFichier: 'Этот аудиофайл нельзя воспроизвести.', erreurEnreg: 'Запись недоступна на этом устройстве.', repli: 'Нет устойчивого ритма: таймер берёт управление.', silence: 'Тишина.', mentionIA: 'Оригинальные треки, созданные с помощью ИИ.', sonActif: 'Звук: {nom}', rienNeJoue: 'Пока нет звука.',
  },
  pt: {
    ouvrir: "Abrir a nova interface",
    titreApp: "Ver a sua música",
    modes: 'Modo', defile: 'Desfile', defileP: 'Os motivos seguem-se, do mais próximo ao mais próximo, ao ritmo de um temporizador ou da pulsação do som.',
    spectre: 'Espectro', spectreP: 'O som escolhe o motivo cujo espectro mais se parece com ele.', entreDeux: 'Entre os dois', entreDeuxP: 'O espectro guia, o ritmo avança: a cada pulsação, um motivo vizinho entre os que se parecem com o som.', reglages: 'Definições',
    fond: 'Fundo', fond_P: 'Liso', fond_B2Dx: 'Triângulos', fond_B11211Dx: 'Faixas',
    corpus: 'Motivos', corpus64: '64 motivos', corpus128: '128: motivos e os seus negativos', corpus256: '256 motivos',
    palette: 'Cores', 'palette_creme-encre': 'Creme e tinta', 'palette_rouge-blanc': 'Branco e vermelho', palette_mono: 'Cinzento e preto', palette_perso: 'Personalizado', couleurFond: 'Fundo', couleurFigure: 'Figura',
    contrasteRefus: 'Estas duas cores estão demasiado próximas: escolha duas com mais contraste.', trace: 'Traço vermelho', rythme: 'Ritmo: {s} s por motivo', densite: 'Densidade: {n}',
    pause: 'Pausa', reprendre: 'Retomar', pleinEcran: 'Ecrã inteiro', flash: 'Atenção: os motivos mudam e podem piscar. Evite se for sensível a luzes intensas. As mudanças rápidas são reduzidas quando o seu dispositivo o pede.',
    motif: 'Hexagrama {kw} · n.º {n} do sítio', enPause: 'Em pausa.', attenteSon: 'À espera do som.', reduit: 'Mudanças rápidas reduzidas.', scene: 'Motivo mostrado', chargement: 'A carregar…', erreur: 'Não foi possível carregar os motivos.',
    // bloc 2 : les sources du son, l'enregistrement
    sources: 'Fonte do som', srcMorceau: 'Faixa fornecida', srcFichier: 'Ficheiro', srcMicro: 'Microfone', srcNote: 'Nota pura', morceauN: 'Faixa {n}', choisirFichier: 'Escolher um ficheiro de áudio', activerMicro: 'Ativar o microfone', jouer: 'Reproduzir', arreter: 'Parar', frequence: 'Frequência: {hz} Hz', declencheur: 'Mudar de motivo', declMinuteur: 'com um temporizador', declPulsation: 'à pulsação do som', enregImage: 'Guardar a imagem', enregVideo: 'Gravar 15 s de vídeo', enregEnCours: 'A gravar… {s} s', erreurMicro: 'Microfone indisponível ou recusado.', microRepli: 'Microfone indisponível ou recusado: eis uma peça de exemplo em seu lugar.', erreurFichier: 'Não é possível reproduzir este ficheiro de áudio.', erreurEnreg: 'A gravação não está disponível neste dispositivo.', repli: 'Sem pulsação regular: o temporizador assume.', silence: 'Silêncio.', mentionIA: 'Faixas originais compostas com a ajuda de IA.', sonActif: 'Som: {nom}', rienNeJoue: 'Ainda sem som.',
  },
  hi: {
    ouvrir: "नया इंटरफ़ेस खोलें",
    titreApp: "अपने संगीत को देखें",
    modes: 'मोड', defile: 'जुलूस', defileP: 'पैटर्न एक के बाद एक आते हैं, निकटतम से निकटतम तक, टाइमर या ध्वनि की धड़कन के साथ।',
    spectre: 'स्पेक्ट्रम', spectreP: 'ध्वनि वह पैटर्न चुनती है जिसका स्पेक्ट्रम उससे सबसे अधिक मिलता है।', entreDeux: 'बीच का रास्ता', entreDeuxP: 'स्पेक्ट्रम राह दिखाता है, धड़कन आगे बढ़ाती है: हर धड़कन पर, ध्वनि जैसे पैटर्नों में से एक पड़ोसी पैटर्न।', reglages: 'सेटिंग',
    fond: 'पृष्ठभूमि', fond_P: 'सादा', fond_B2Dx: 'त्रिभुज', fond_B11211Dx: 'पट्टियाँ',
    corpus: 'पैटर्न', corpus64: '64 पैटर्न', corpus128: '128: पैटर्न और उनके नेगेटिव', corpus256: '256 पैटर्न',
    palette: 'रंग', 'palette_creme-encre': 'क्रीम और स्याही', 'palette_rouge-blanc': 'सफ़ेद और लाल', palette_mono: 'स्लेटी और काला', palette_perso: 'अपनी पसंद', couleurFond: 'पृष्ठभूमि', couleurFigure: 'आकृति',
    contrasteRefus: 'ये दोनों रंग बहुत पास हैं: अधिक अंतर वाले दो रंग चुनें।', trace: 'लाल रेखा', rythme: 'गति: प्रति पैटर्न {s} सेकंड', densite: 'घनत्व: {n}',
    pause: 'रोकें', reprendre: 'फिर शुरू करें', pleinEcran: 'पूर्ण स्क्रीन', flash: 'सावधान: पैटर्न बदलते हैं और झिलमिला सकते हैं। तेज़ रोशनी से संवेदनशील हों तो न देखें। आपका उपकरण कहे तो तेज़ बदलाव कम कर दिए जाते हैं।',
    motif: 'हेक्साग्राम {kw} · साइट का क्रमांक {n}', enPause: 'रुका हुआ।', attenteSon: 'ध्वनि की प्रतीक्षा।', reduit: 'तेज़ बदलाव कम किए गए।', scene: 'दिखाया गया पैटर्न', chargement: 'लोड हो रहा है…', erreur: 'पैटर्न लोड नहीं हो सके।',
    // bloc 2 : les sources du son, l'enregistrement
    sources: 'ध्वनि का स्रोत', srcMorceau: 'दिया गया गीत', srcFichier: 'फ़ाइल', srcMicro: 'माइक्रोफ़ोन', srcNote: 'शुद्ध स्वर', morceauN: 'गीत {n}', choisirFichier: 'ऑडियो फ़ाइल चुनें', activerMicro: 'माइक्रोफ़ोन चालू करें', jouer: 'चलाएँ', arreter: 'रोकें', frequence: 'आवृत्ति: {hz} हर्ट्ज़', declencheur: 'पैटर्न बदलें', declMinuteur: 'टाइमर से', declPulsation: 'ध्वनि की धड़कन से', enregImage: 'चित्र सहेजें', enregVideo: '15 सेकंड का वीडियो रिकॉर्ड करें', enregEnCours: 'रिकॉर्डिंग… {s} सेकंड', erreurMicro: 'माइक्रोफ़ोन उपलब्ध नहीं या अस्वीकृत।', microRepli: 'माइक्रोफ़ोन उपलब्ध नहीं या अस्वीकृत: उसकी जगह एक उदाहरण रचना बज रही है।', erreurFichier: 'यह ऑडियो फ़ाइल चलाई नहीं जा सकती।', erreurEnreg: 'इस उपकरण पर रिकॉर्डिंग उपलब्ध नहीं।', repli: 'नियमित धड़कन नहीं: टाइमर काम सँभालता है।', silence: 'शांति।', mentionIA: 'एआई की मदद से रचे गए मौलिक गीत।', sonActif: 'ध्वनि: {nom}', rienNeJoue: 'अभी कोई ध्वनि नहीं।',
  },
  de: {
    ouvrir: "Neue Oberfläche öffnen",
    titreApp: "Die eigene Musik sehen",
    modes: 'Modus', defile: 'Umzug', defileP: 'Die Muster folgen einander, vom nächsten zum nächsten, im Takt eines Timers oder des Klangs.',
    spectre: 'Spektrum', spectreP: 'Der Klang wählt das Muster, dessen Spektrum ihm am ähnlichsten ist.', entreDeux: 'Dazwischen', entreDeuxP: 'Das Spektrum führt, der Takt treibt: bei jedem Schlag ein benachbartes Muster unter denen, die dem Klang ähneln.', reglages: 'Einstellungen',
    fond: 'Hintergrund', fond_P: 'Einfarbig', fond_B2Dx: 'Dreiecke', fond_B11211Dx: 'Streifen',
    corpus: 'Muster', corpus64: '64 Muster', corpus128: '128: Muster und ihre Negative', corpus256: '256 Muster',
    palette: 'Farben', 'palette_creme-encre': 'Creme und Tinte', 'palette_rouge-blanc': 'Weiß und Rot', palette_mono: 'Grau und Schwarz', palette_perso: 'Eigene', couleurFond: 'Hintergrund', couleurFigure: 'Figur',
    contrasteRefus: 'Diese beiden Farben liegen zu nah beieinander: Wählen Sie zwei mit mehr Kontrast.', trace: 'Rote Kontur', rythme: 'Tempo: {s} s pro Muster', densite: 'Dichte: {n}',
    pause: 'Pause', reprendre: 'Fortsetzen', pleinEcran: 'Vollbild', flash: 'Achtung: Die Muster wechseln und können flackern. Meiden Sie sie, wenn Sie auf helles Licht empfindlich sind. Schnelle Wechsel werden reduziert, wenn Ihr Gerät es verlangt.',
    motif: 'Hexagramm {kw} · Nr. {n} der Seite', enPause: 'Pausiert.', attenteSon: 'Warte auf Klang.', reduit: 'Schnelle Wechsel reduziert.', scene: 'Angezeigtes Muster', chargement: 'Lädt …', erreur: 'Die Muster konnten nicht geladen werden.',
    // bloc 2 : les sources du son, l'enregistrement
    sources: 'Klangquelle', srcMorceau: 'Mitgeliefertes Stück', srcFichier: 'Datei', srcMicro: 'Mikrofon', srcNote: 'Reiner Ton', morceauN: 'Stück {n}', choisirFichier: 'Audiodatei wählen', activerMicro: 'Mikrofon einschalten', jouer: 'Abspielen', arreter: 'Stopp', frequence: 'Frequenz: {hz} Hz', declencheur: 'Muster wechseln', declMinuteur: 'per Timer', declPulsation: 'im Takt des Klangs', enregImage: 'Bild speichern', enregVideo: '15 s Video aufnehmen', enregEnCours: 'Aufnahme … {s} s', erreurMicro: 'Mikrofon nicht verfügbar oder abgelehnt.', microRepli: 'Mikrofon nicht verfügbar oder abgelehnt: stattdessen läuft ein Beispielstück.', erreurFichier: 'Diese Audiodatei kann nicht abgespielt werden.', erreurEnreg: 'Aufnahme ist auf diesem Gerät nicht verfügbar.', repli: 'Kein gleichmäßiger Takt: Der Timer übernimmt.', silence: 'Stille.', mentionIA: 'Originalstücke, komponiert mit Hilfe von KI.', sonActif: 'Klang: {nom}', rienNeJoue: 'Noch kein Klang.',
  },
  it: {
    ouvrir: "Apri la nuova interfaccia",
    titreApp: "Vedere la propria musica",
    modes: 'Modalità', defile: 'Sfilata', defileP: 'I motivi si susseguono, dal più vicino al più vicino, al ritmo di un timer o della pulsazione del suono.',
    spectre: 'Spettro', spectreP: 'Il suono sceglie il motivo il cui spettro gli somiglia di più.', entreDeux: 'Via di mezzo', entreDeuxP: 'Lo spettro guida, il ritmo avanza: a ogni pulsazione, un motivo vicino tra quelli che somigliano al suono.', reglages: 'Impostazioni',
    fond: 'Sfondo', fond_P: 'Tinta unita', fond_B2Dx: 'Triangoli', fond_B11211Dx: 'Bande',
    corpus: 'Motivi', corpus64: '64 motivi', corpus128: '128: motivi e i loro negativi', corpus256: '256 motivi',
    palette: 'Colori', 'palette_creme-encre': 'Crema e inchiostro', 'palette_rouge-blanc': 'Bianco e rosso', palette_mono: 'Grigio e nero', palette_perso: 'Personalizzato', couleurFond: 'Sfondo', couleurFigure: 'Figura',
    contrasteRefus: 'Questi due colori sono troppo vicini: scegline due più contrastati.', trace: 'Contorno rosso', rythme: 'Ritmo: {s} s per motivo', densite: 'Densità: {n}',
    pause: 'Pausa', reprendre: 'Riprendi', pleinEcran: 'Schermo intero', flash: 'Attenzione: i motivi cambiano e possono lampeggiare. Evitalo se sei sensibile alle luci intense. I cambi rapidi sono ridotti quando il dispositivo lo richiede.',
    motif: 'Esagramma {kw} · n. {n} del sito', enPause: 'In pausa.', attenteSon: 'In attesa del suono.', reduit: 'Cambi rapidi ridotti.', scene: 'Motivo mostrato', chargement: 'Caricamento…', erreur: 'Impossibile caricare i motivi.',
    // bloc 2 : les sources du son, l'enregistrement
    sources: 'Fonte del suono', srcMorceau: 'Brano fornito', srcFichier: 'File', srcMicro: 'Microfono', srcNote: 'Nota pura', morceauN: 'Brano {n}', choisirFichier: 'Scegli un file audio', activerMicro: 'Attiva il microfono', jouer: 'Riproduci', arreter: 'Ferma', frequence: 'Frequenza: {hz} Hz', declencheur: 'Cambia motivo', declMinuteur: 'con un timer', declPulsation: 'alla pulsazione del suono', enregImage: 'Salva l\'immagine', enregVideo: 'Registra 15 s di video', enregEnCours: 'Registrazione… {s} s', erreurMicro: 'Microfono non disponibile o rifiutato.', microRepli: 'Microfono non disponibile o rifiutato: al suo posto parte un brano d\'esempio.', erreurFichier: 'Questo file audio non può essere riprodotto.', erreurEnreg: 'La registrazione non è disponibile su questo dispositivo.', repli: 'Nessuna pulsazione regolare: subentra il timer.', silence: 'Silenzio.', mentionIA: 'Brani originali composti con l\'aiuto dell\'IA.', sonActif: 'Suono: {nom}', rienNeJoue: 'Ancora nessun suono.',
  },
  ja: {
    ouvrir: "新しいインターフェースを開く",
    titreApp: "自分の音楽を見る",
    modes: 'モード', defile: 'パレード', defileP: '模様が、いちばん近いものから次のいちばん近いものへと、タイマーまたは音の拍に合わせて続きます。',
    spectre: 'スペクトル', spectreP: '音が、自分のスペクトルにいちばん似た模様を選びます。', entreDeux: '中間', entreDeuxP: 'スペクトルが導き、拍が進めます。拍ごとに、音に似た模様の中から隣り合う模様を選びます。', reglages: '設定',
    fond: '背景', fond_P: '無地', fond_B2Dx: '三角形', fond_B11211Dx: 'ストライプ',
    corpus: '模様', corpus64: '64 個の模様', corpus128: '128：模様とそのネガ', corpus256: '256 個の模様',
    palette: '色', 'palette_creme-encre': 'クリームとインク', 'palette_rouge-blanc': '白と赤', palette_mono: 'グレーと黒', palette_perso: 'カスタム', couleurFond: '背景色', couleurFigure: '図の色',
    contrasteRefus: 'この2色は近すぎます。コントラストの強い2色を選んでください。', trace: '赤い輪郭', rythme: 'テンポ：1模様あたり {s} 秒', densite: '密度：{n}',
    pause: '一時停止', reprendre: '再開', pleinEcran: '全画面', flash: '注意：模様が切り替わり、ちらつくことがあります。強い光に敏感な方はお控えください。端末が求めるときは、速い切り替えが抑えられます。',
    motif: '卦 {kw} ・ サイト番号 {n}', enPause: '一時停止中。', attenteSon: '音を待っています。', reduit: '速い切り替えを抑えています。', scene: '表示中の模様', chargement: '読み込み中…', erreur: '模様を読み込めませんでした。',
    // bloc 2 : les sources du son, l'enregistrement
    sources: '音の入力', srcMorceau: '用意された曲', srcFichier: 'ファイル', srcMicro: 'マイク', srcNote: '純音', morceauN: '曲 {n}', choisirFichier: '音声ファイルを選ぶ', activerMicro: 'マイクをオンにする', jouer: '再生', arreter: '停止', frequence: '周波数：{hz} Hz', declencheur: '模様を切り替える', declMinuteur: 'タイマーで', declPulsation: '音の拍で', enregImage: '画像を保存', enregVideo: '15秒の動画を録画', enregEnCours: '録画中… {s} 秒', erreurMicro: 'マイクが使えないか、拒否されました。', microRepli: 'マイクが使えないか、拒否されたため、代わりに例の曲を再生しています。', erreurFichier: 'この音声ファイルは再生できません。', erreurEnreg: 'この端末では録画できません。', repli: '安定した拍がありません：タイマーが引き継ぎます。', silence: '無音。', mentionIA: 'AIの助けを借りて作曲したオリジナル曲。', sonActif: '音：{nom}', rienNeJoue: 'まだ音がありません。',
  },
};
export const texte = (langue, cle, valeurs = {}) => {
  const t = (TEXTES[langue] && TEXTES[langue][cle]) ?? TEXTES.fr[cle];
  if (t === undefined) throw new Error(`pavane-textes.js : clé « ${cle} » inconnue`);
  return t.replace(/\{(\w+)\}/g, (m, k) => (k in valeurs ? valeurs[k] : m));
};
