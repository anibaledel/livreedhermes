// proximite-binaire.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// La distance entre deux motifs TELS QU'ON LES VOIT en bicolore.
//
// Le parcours de l'animation choisit, comme motif suivant, le plus proche du
// motif à l'écran. En tricolore, la distance compte les cases de la grille à
// trois couleurs qui changent. En bicolore, le visiteur ne voit pas cette
// grille : il voit sa lecture binaire (lecture-binaire.js), où une case jaune
// devient des triangles. Deux grilles peuvent différer sur une case jaune et
// donner la même image, ou l'inverse. La distance se mesure donc sur ce qu'on
// voit.
//
// C'est la DISTANCE DE HAMMING SUR 576 QUARTS (144 cases × 4), et elle est
// EXACTE, pas approchée. Les quarts N, E, S, O sont le raffinement commun des
// trois cas de la lecture binaire — le partage même de la découpe :
//   case pleine          ses quatre quarts d'une seule couleur ;
//   case coupée « \ »    {N, E} | {S, O} ;   case coupée « / »  {N, O} | {S, E} ;
//   selle (quatre)       un quart par triangle.
// Deux lectures binaires sont donc égales si et seulement si leurs 576 quarts
// le sont : la distance ne perd aucune information. Elle compte l'aire qui
// change de couleur, au quart de case — exactement.
//
// Module pur (ni DOM ni réseau) : l'animation et l'outil des recettes
// (tools/recettes_animations.mjs) l'importent tous les deux.

// Les quatre quarts d'une case de lectureBinaire(…).cases, dans l'ordre N E S O.
function quarts(k) {
  if (k.type === 'pleine') return [k.bit, k.bit, k.bit, k.bit];
  if (k.type === 'quatre') return k.triangles.map((t) => t.bit);
  if (k.type === 'coupee') {
    const [a, b] = k.triangles.map((t) => t.bit);
    // '\' : triangle NE (quarts N, E) puis SO (S, O) ; '/' : NO (N, O) puis SE (E, S)
    return k.diagonale === '\\' ? [a, a, b, b] : [a, b, b, a];
  }
  throw new Error(`proximite-binaire.js : case de type « ${k.type} »`);
}

// Les 4 × 144 bits d'une lecture, à plat.
export function signatureBinaire(cases) {
  const s = new Uint8Array(cases.length * 4);
  cases.forEach((k, i) => s.set(quarts(k), i * 4));
  return s;
}

// Distance de Hamming entre deux signatures de 576 quarts : le nombre de
// quarts de case qui changent de couleur. 0 si et seulement si les deux
// lectures binaires sont identiques.
export function distanceBinaire(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}
