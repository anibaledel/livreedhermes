// svg-en-pixels.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Rastérise un SVG du moteur à sa taille (navigateur) : les pixels. Le chemin
// commun de l'animation (animation-bicolore.js) et de l'export d'images
// (vue-fond-motif.js, qui le réexporte). Module portable
// (docs/modules-portables.md) : ni page, ni donnée, ni style.

export function svgEnPixels(svg, largeur, hauteur) {
  return new Promise((ok, ko) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = largeur; c.height = hauteur;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, largeur, hauteur);
      URL.revokeObjectURL(url);
      ok(ctx.getImageData(0, 0, largeur, hauteur));
    };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('SVG illisible')); };
    img.src = url;
  });
}
