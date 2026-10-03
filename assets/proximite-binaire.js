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
// voit : chaque case en quatre quarts (N, E, S, O), chacun d'un bit, et la
// distance est le nombre de quarts qui changent de couleur — l'aire qui
// change, au quart de case près.
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

// Nombre de quarts de case qui changent de couleur entre deux signatures.
export function distanceBinaire(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}
