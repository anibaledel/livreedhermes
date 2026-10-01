/* generate-yi-king-docx.js — engendre Le-Yi-King-64-hexagrammes.docx (FR) et
   Le-Yi-King-64-hexagrammes-EN.docx (EN) à la racine du dépôt, depuis les
   tables de index.html (source de vérité unique, comme
   scripts/extract-hexagram-data.js) : nom et jugement (HEX_KW / HEX_KW_EN),
   image (IMAGE_FR / IMAGE_EN), trigrammes (TRIGRAMS / TRIGRAMS_EN), les six
   traits (LINE_COMMENT / LINE_COMMENT_EN). Même ordre que l'échiquier du
   site : chronologique, 0 à 63 (poids binaires), n° King Wen indiqué.

   ES, ZH, RU, TH : traductions depuis le français, à relire par des
   lecteurs natifs, dans data/yi-king/{es,zh,ru,th}.json (mêmes champs que
   les tables d'index.html : ui, hexagrammes, traits, trigrammes).

   Usage : npm i docx (une fois), puis node scripts/generate-yi-king-docx.js
*/
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  Footer, PageNumber, BorderStyle,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Même extraction que scripts/extract-hexagram-data.js (littéral JS entre accolades).
function extraire(nom) {
  const marque = `const ${nom} = `;
  const debut = src.indexOf(marque);
  if (debut === -1) throw new Error('Introuvable dans index.html : ' + nom);
  let i = debut + marque.length;
  const ouvre = src[i], ferme = ouvre === '{' ? '}' : ']';
  let prof = 0, chaine = false, guillemet = '', echap = false;
  const de = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (chaine) {
      if (echap) echap = false;
      else if (c === '\\') echap = true;
      else if (c === guillemet) chaine = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { chaine = true; guillemet = c; continue; }
    if (c === ouvre) prof++;
    else if (c === ferme && --prof === 0) { i++; break; }
  }
  return new Function('return (' + src.slice(de, i) + ')')();
}

const KINGWEN_BY_CHRONO = extraire('KINGWEN_BY_CHRONO');
const HANZI_BY_KW = extraire('HANZI_BY_KW');

const LANGUES = {
  fr: {
    fichier: 'Le-Yi-King-64-hexagrammes.docx',
    HEX_KW: extraire('HEX_KW'), IMAGE: extraire('IMAGE_FR'),
    TRIGRAMS: extraire('TRIGRAMS'), LINE_COMMENT: extraire('LINE_COMMENT'),
    titre: 'Le Yi King — 64 hexagrammes',
    sousTitre: "Ordre chronologique (poids binaires), d'après La Livrée d'Hermès",
    auteur: 'Anibal Edelberto Amiot',
    source: 'Textes du site anibal-amiot.com — La Livrée d\'Hermès.',
    licence: 'Licence CC BY-NC 4.0 : vous pouvez utiliser, partager et modifier ce document, hors usage commercial, en citant l\'auteur. Usage commercial : anibaledel@gmail.com.',
    hexagramme: 'Hexagramme',
    chrono: 'N° chronologique', kingWen: 'n° King Wen (traditionnel)',
    superieur: 'Trigramme supérieur', inferieur: 'Trigramme inférieur',
    image: 'Image', jugement: 'Jugement', traits: 'Les six traits',
    rangs: ['Premier trait', 'Deuxième trait', 'Troisième trait', 'Quatrième trait', 'Cinquième trait', 'Sixième trait'],
    page: 'Page',
  },
  en: {
    fichier: 'Le-Yi-King-64-hexagrammes-EN.docx',
    HEX_KW: extraire('HEX_KW_EN'), IMAGE: extraire('IMAGE_EN'),
    TRIGRAMS: extraire('TRIGRAMS_EN'), LINE_COMMENT: extraire('LINE_COMMENT_EN'),
    titre: 'The Yi King — 64 hexagrams',
    sousTitre: "Chronological order (binary weights), after La Livrée d'Hermès",
    auteur: 'Anibal Edelberto Amiot',
    source: "Texts from anibal-amiot.com — La Livrée d'Hermès (The Livery of Hermes).",
    licence: 'CC BY-NC 4.0 licence: you may use, share and adapt this document for non-commercial purposes, with attribution. Commercial use: anibaledel@gmail.com.',
    hexagramme: 'Hexagram',
    chrono: 'Chronological no.', kingWen: 'King Wen no. (traditional)',
    superieur: 'Upper trigram', inferieur: 'Lower trigram',
    image: 'Image', jugement: 'Judgment', traits: 'The six lines',
    rangs: ['First line', 'Second line', 'Third line', 'Fourth line', 'Fifth line', 'Sixth line'],
    page: 'Page',
  },
};

// Langues traduites : un fichier JSON par langue, mêmes champs qu'en français.
const POLICES = {
  zh: { ascii: 'Georgia', hAnsi: 'Georgia', eastAsia: 'Microsoft YaHei', cs: 'Microsoft YaHei' },
  th: { ascii: 'Georgia', hAnsi: 'Georgia', cs: 'Leelawadee UI', eastAsia: 'Leelawadee UI' },
};
for (const code of ['es', 'zh', 'ru', 'th']) {
  const f = path.join(ROOT, 'data', 'yi-king', `${code}.json`);
  if (!fs.existsSync(f)) continue;
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const HEX_KW = {}, IMAGE = {};
  for (const [kw, h] of Object.entries(d.hexagrammes)) {
    HEX_KW[kw] = [h.pinyin, h.nom, h.jugement_titre, h.jugement];
    IMAGE[kw] = h.image;
  }
  LANGUES[code] = {
    fichier: `Le-Yi-King-64-hexagrammes-${code.toUpperCase()}.docx`,
    HEX_KW, IMAGE, TRIGRAMS: d.trigrammes, LINE_COMMENT: d.traits,
    auteur: 'Anibal Edelberto Amiot', police: POLICES[code],
    ...d.ui,
  };
}

function traitsFromChrono(chrono) {
  const r = Math.floor(chrono / 8), c = chrono % 8;
  return [c & 1, (c >> 1) & 1, (c >> 2) & 1, r & 1, (r >> 1) & 1, (r >> 2) & 1]; // bas → haut
}
const valeurTrigramme = (b) => b[0] + b[1] * 2 + b[2] * 4;
// Figure de l'hexagramme en texte, du haut vers le bas : plein / brisé.
const figure = (traits) => traits.slice().reverse().map((b) => (b ? '━━━━━━━' : '━━━  ━━━'));

const para = (texte, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: [new TextRun({ text: texte, ...(opts.run || {}) })] });

function document(L) {
  const enfants = [
    new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun(L.titre)] }),
    para(L.sousTitre, { alignment: AlignmentType.CENTER, run: { italics: true } }),
    para(L.auteur, { alignment: AlignmentType.CENTER, spacing: { after: 480 } }),
    para(L.source, { alignment: AlignmentType.CENTER, run: { size: 20 } }),
    para(L.licence, { alignment: AlignmentType.CENTER, run: { size: 20 } }),
  ];
  if (L.traduction) enfants.push(para(L.traduction, { alignment: AlignmentType.CENTER, run: { size: 20, italics: true } }));
  for (let chrono = 0; chrono < 64; chrono++) {
    const kw = KINGWEN_BY_CHRONO[chrono];
    const [pinyin, nom, jugementTitre, jugementTexte] = L.HEX_KW[kw];
    const traits = traitsFromChrono(chrono);
    const bas = L.TRIGRAMS[valeurTrigramme(traits.slice(0, 3))];
    const haut = L.TRIGRAMS[valeurTrigramme(traits.slice(3, 6))];
    enfants.push(new Paragraph({ children: [new PageBreak()] }));
    enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`${L.hexagramme} ${chrono} — ${pinyin}, ${nom}`)] }));
    enfants.push(para(`${L.chrono} ${chrono} · ${L.kingWen} ${kw} · ${HANZI_BY_KW[kw] || ''}`, { run: { color: '666666' } }));
    for (const ligne of figure(traits)) {
      enfants.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: ligne, size: 28 })] }));
    }
    enfants.push(para('', { spacing: { after: 120 } }));
    enfants.push(para(`${L.superieur} : ${haut.symbol} ${haut.name} — ${haut.nature}, ${haut.image} (${haut.role})`));
    enfants.push(para(`${L.inferieur} : ${bas.symbol} ${bas.name} — ${bas.nature}, ${bas.image} (${bas.role})`));
    enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${L.image} — ${nom}`)] }));
    enfants.push(para(L.IMAGE[kw] || ''));
    enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${L.jugement} — ${jugementTitre}`)] }));
    enfants.push(para(jugementTexte));
    enfants.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(L.traits)] }));
    traits.forEach((bit, i) => {
      enfants.push(new Paragraph({ spacing: { after: 120 }, children: [
        new TextRun({ text: `${L.rangs[i]} : `, bold: true }),
        new TextRun(L.LINE_COMMENT[i + 1][bit]),
      ] }));
    });
  }
  return new Document({
    creator: L.auteur, title: L.titre, description: L.source,
    styles: {
      default: { document: { run: { font: L.police || 'Georgia', size: 22 } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', run: { size: 48, color: '8B1A12' }, paragraph: { spacing: { before: 2400, after: 240 } } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, color: '8B1A12' }, paragraph: { spacing: { after: 120 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: '7A6244' }, paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: { page: { margin: { top: 1300, bottom: 1300, left: 1300, right: 1300 } } },
      footers: { default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB', space: 4 } },
        children: [new TextRun({ text: `${L.titre} — ${L.page} `, size: 16, color: '888888' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' })],
      })] }) },
      children: enfants,
    }],
  });
}

(async () => {
  for (const L of Object.values(LANGUES)) {
    const buf = await Packer.toBuffer(document(L));
    fs.writeFileSync(path.join(ROOT, L.fichier), buf);
    console.log(`${L.fichier} : ${(buf.length / 1024).toFixed(0)} Ko`);
  }
})();
