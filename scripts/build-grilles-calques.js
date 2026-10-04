#!/usr/bin/env node
/* ============================================================
   Grilles précalculées des calques (assets/trait-cartes/grilles.json).

   CalqueEngine (assets/calque-engine.js) reconstruit, pour chaque nature de
   trait, la grille 12x12 du pavage à partir de 24 cartes SVG. Il n'en lit
   que les rectangles colorés : 1,3 Mo de SVG téléchargés à chaque ouverture
   de l'accueil, de la création de motifs et de la galerie, pour quatre
   grilles de 144 lettres. Ce script les extrait une fois pour toutes dans
   grilles.json, que le moteur charge en premier (repli sur les SVG).

   L'extraction exécute le code même du moteur, dans un bac à sable dont le
   fetch() lit les fichiers du dépôt et refuse grilles.json : le moteur passe
   donc par les SVG, et le JSON ne peut pas diverger de ce qu'il en lirait.

   Usage : node scripts/build-grilles-calques.js            écrit le JSON
           node scripts/build-grilles-calques.js --verifie  échoue s'il est périmé
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const ENGINE = path.join(ROOT, 'assets', 'calque-engine.js');
// Espaces chargés par le moteur. Les familles de assets/par2-cartes/ ont leur
// propre chargeur dans 360-calques.html et ne passent pas par loadSpace().
const ESPACES = [{ nom: 'hexagram', dossier: 'assets/trait-cartes/' }];

async function grillesDepuisSvg(dossier) {
  const sandbox = {
    console,
    fetch: async (url) => {
      if (url.endsWith('grilles.json')) return { ok: false, status: 404 };
      const texte = fs.readFileSync(path.join(ROOT, url), 'utf8');
      return { ok: true, status: 200, text: async () => texte };
    },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(ENGINE, 'utf8'), sandbox, { filename: ENGINE });
  const moteur = sandbox.CalqueEngine;
  await moteur.loadSpace('extraction', dossier);
  const out = {};
  for (const nature of ['YANG', 'YANGMUT', 'YIN', 'YINMUT']) {
    out[nature] = Array.from({ length: 12 }, (_, r) =>
      Array.from({ length: 12 }, (_, c) => moteur.spaceColorAt('extraction', nature, r, c)));
  }
  return out;
}

function serialise(grilles) {
  // Une ligne de grille par ligne de fichier : lisible et diffable.
  const blocs = Object.entries(grilles).map(([nature, g]) =>
    `  "${nature}": [\n${g.map((row) => `    ${JSON.stringify(row)}`).join(',\n')}\n  ]`);
  return `{\n${blocs.join(',\n')}\n}\n`;
}

(async () => {
  const verifie = process.argv.includes('--verifie');
  let perimes = 0;
  for (const { dossier } of ESPACES) {
    const fichier = path.join(ROOT, dossier, 'grilles.json');
    const attendu = serialise(await grillesDepuisSvg(dossier));
    const actuel = fs.existsSync(fichier) ? fs.readFileSync(fichier, 'utf8') : null;
    if (actuel === attendu) { console.log(`OK    ${dossier}grilles.json`); continue; }
    if (verifie) { perimes++; console.error(`PÉRIMÉ ${dossier}grilles.json`); continue; }
    fs.writeFileSync(fichier, attendu);
    console.log(`ÉCRIT ${dossier}grilles.json`);
  }
  if (perimes) {
    console.error('Relancer : node scripts/build-grilles-calques.js');
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
