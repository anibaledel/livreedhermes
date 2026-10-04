/* Extrait les tables de données hexagrammes directement depuis index.html
   (source de vérité unique), plutôt que de les recopier à la main — évite
   toute divergence entre le site et les pages statiques générées. */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const indexSrc = fs.readFileSync(path.join(REPO_ROOT, 'tirage-livree-hermes.html'), 'utf8');

function extractLiteral(varName){
  const marker = `const ${varName} = `;
  const start = indexSrc.indexOf(marker);
  if(start === -1) throw new Error('Introuvable dans index.html : ' + varName);
  let i = start + marker.length;
  const openChar = indexSrc[i]; // '{' ou '['
  const closeChar = openChar === '{' ? '}' : ']';
  let depth = 0, inString = false, quote = '', escaped = false;
  const from = i;
  for(; i < indexSrc.length; i++){
    const ch = indexSrc[i];
    if(inString){
      if(escaped){ escaped = false; }
      else if(ch === '\\'){ escaped = true; }
      else if(ch === quote){ inString = false; }
      continue;
    }
    if(ch === '"' || ch === "'" || ch === '`'){ inString = true; quote = ch; continue; }
    if(ch === openChar) depth++;
    else if(ch === closeChar){
      depth--;
      if(depth === 0){ i++; break; }
    }
  }
  const literal = indexSrc.slice(from, i);
  return new Function('return (' + literal + ')')();
}

module.exports = {
  HEX_KW: extractLiteral('HEX_KW'),
  HEX_KW_EN: extractLiteral('HEX_KW_EN'),
  IMAGE_FR: extractLiteral('IMAGE_FR'),
  KINGWEN_BY_CHRONO: extractLiteral('KINGWEN_BY_CHRONO'),
  HANZI_BY_KW: extractLiteral('HANZI_BY_KW'),
  TRIGRAMS: extractLiteral('TRIGRAMS'),
  LINE_COMMENT: extractLiteral('LINE_COMMENT'),
  // Versions anglaises, déjà affichées par l'échiquier d'index.html en anglais :
  // les pages hexagrammes anglaises (generate-hexagram-pages-traduites.js) les reprennent.
  IMAGE_EN: extractLiteral('IMAGE_EN'),
  LINE_COMMENT_EN: extractLiteral('LINE_COMMENT_EN'),
  TRIGRAMS_EN: extractLiteral('TRIGRAMS_EN'),
};

if(require.main === module){
  const data = module.exports;
  console.log('HEX_KW entries:', Object.keys(data.HEX_KW).length);
  console.log('IMAGE_FR entries:', Object.keys(data.IMAGE_FR).length);
  console.log('KINGWEN_BY_CHRONO length:', data.KINGWEN_BY_CHRONO.length);
  console.log('TRIGRAMS length:', data.TRIGRAMS.length);
  console.log('LINE_COMMENT[1]:', data.LINE_COMMENT[1]);
  console.log('Sample HEX_KW[10]:', data.HEX_KW[10]);
}
