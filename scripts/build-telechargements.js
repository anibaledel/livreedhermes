#!/usr/bin/env node
/* ============================================================
   La liste des téléchargements de telechargements.html (zone
   @telechargements), écrite depuis les fichiers réellement publiés dans
   assets/pro-downloads/ — jamais recopiée à la main : un poids écrit en dur
   ment dès la première réexportation (audit du 7 octobre 2026).

   Pour chaque fichier, lu dans le fichier lui-même :
     format     ZIP ou PDF ;
     contenu    le nombre de SVG de l'archive (répertoire central du ZIP),
                le nombre de pages du PDF (/Count de l'arbre des pages) ;
     poids      sa taille sur le disque ;
     date       la date de création du PDF (/CreationDate), la date la plus
                récente des fichiers de l'archive ;
     empreinte  les huit premiers caractères de son SHA-256 : les fichiers ne
                portent pas de numéro de version, l'empreinte en tient lieu
                (décision d'Anibal, 7 octobre 2026) — elle change dès qu'un
                fichier est réexporté.

   Usage : node scripts/build-telechargements.js            écrit la zone
           node scripts/build-telechargements.js --verifie  échoue si elle est périmée
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PAGE = path.join(ROOT, 'telechargements.html');
const DOSSIER = 'assets/pro-downloads';
const ENSEMBLES = [
  ['cellules-tricolore-ypm', 'Cellules — Tricolore YPM'],
  ['cellules-monochrome-black', 'Cellules — Monochrome Black'],
  ['pavages-tricolore-ypm', 'Pavages — Tricolore YPM'],
  ['pavages-monochrome-black', 'Pavages — Monochrome Black'],
];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const dateFr = (d) => `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
function poids(octets) {
  const [v, u] = octets >= 1e6 ? [octets / 1e6, 'Mo'] : [octets / 1e3, 'Ko'];
  return `${(v < 10 ? v.toFixed(1) : Math.round(v).toString()).replace('.', ',')}\u00a0${u}`;
}

// Le PDF : le nombre de pages de l'arbre racine, la date de création (en
// direct ou par référence à un objet).
function lirePdf(b) {
  const s = b.toString('latin1');
  const comptes = [...s.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  if (!comptes.length) throw new Error('arbre des pages introuvable');
  let d = /\/CreationDate\s*\((D:\d{8,14})/.exec(s);
  if (!d) {
    const ref = /\/CreationDate\s+(\d+)\s+0\s+R/.exec(s);
    if (ref) d = new RegExp(`\\n${ref[1]}\\s+0\\s+obj\\s*\\((D:\\d{8,14})`).exec(s);
  }
  if (!d) throw new Error('date de création introuvable');
  const t = d[1].slice(2).padEnd(14, '0');
  return { contenu: Math.max(...comptes), date: new Date(Date.UTC(+t.slice(0, 4), +t.slice(4, 6) - 1, +t.slice(6, 8))) };
}

// Le ZIP : le répertoire central, entrée par entrée (nom, date DOS).
function lireZip(b) {
  const fin = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (fin < 0) throw new Error('fin du répertoire central introuvable');
  const n = b.readUInt16LE(fin + 10);
  let p = b.readUInt32LE(fin + 16);
  let svg = 0, date = null;
  for (let i = 0; i < n; i++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error(`entrée ${i} illisible`);
    const heure = b.readUInt16LE(p + 12), jour = b.readUInt16LE(p + 14);
    const ln = b.readUInt16LE(p + 28), le = b.readUInt16LE(p + 30), lc = b.readUInt16LE(p + 32);
    const nom = b.toString('utf8', p + 46, p + 46 + ln);
    if (nom.toLowerCase().endsWith('.svg')) svg++;
    const d = new Date(Date.UTC(1980 + (jour >> 9), ((jour >> 5) & 15) - 1, jour & 31, heure >> 11, (heure >> 5) & 63));
    if (!date || d > date) date = d;
    p += 46 + ln + le + lc;
  }
  return { contenu: svg, date };
}

function fichier(nom, ext) {
  const rel = `${DOSSIER}/${nom}.${ext}`;
  const b = fs.readFileSync(path.join(ROOT, rel));
  const lu = ext === 'pdf' ? lirePdf(b) : lireZip(b);
  return {
    rel,
    format: ext.toUpperCase(),
    contenu: ext === 'pdf' ? `${lu.contenu} pages` : `${lu.contenu} SVG`,
    poids: poids(b.length),
    date: dateFr(lu.date),
    empreinte: crypto.createHash('sha256').update(b).digest('hex').slice(0, 8),
  };
}

const lignes = ENSEMBLES.map(([nom, libelle]) => {
  const f = [fichier(nom, 'zip'), fichier(nom, 'pdf')];
  const liens = f.map((x) => `          <a href="${x.rel}" download>${x.format} (${x.contenu}, ${x.poids})</a>`).join('\n');
  const meta = f.map((x) => `${x.format} du ${x.date}, empreinte <code>${x.empreinte}</code>`).join(' · ');
  return `        <div class="pro-download-row">
          <span class="pro-download-name">${libelle}</span>
${liens}
          <span class="pro-download-meta">${meta}</span>
        </div>`;
}).join('\n');

const zone = `<!-- @telechargements:start — engendré par scripts/build-telechargements.js depuis les fichiers de ${DOSSIER}/, ne pas éditer ici -->
      <div class="pro-downloads">
${lignes}
      </div>
      <!-- @telechargements:end -->`;

const avant = fs.readFileSync(PAGE, 'utf8');
if (!avant.includes('<!-- @telechargements:start')) throw new Error('telechargements.html : zone @telechargements absente');
const apres = avant.replace(/<!-- @telechargements:start[\s\S]*?<!-- @telechargements:end -->/, zone);
if (process.argv.includes('--verifie')) {
  if (apres !== avant) {
    console.error('telechargements.html : la liste ne correspond plus aux fichiers publiés.\nRelancer : node scripts/build-telechargements.js');
    process.exit(1);
  }
  console.log(`Téléchargements conformes aux fichiers publiés (${ENSEMBLES.length * 2} fichiers).`);
} else {
  if (apres !== avant) fs.writeFileSync(PAGE, apres, 'utf8');
  console.log(apres !== avant ? 'telechargements.html : liste écrite.' : 'telechargements.html : déjà à jour.');
}
