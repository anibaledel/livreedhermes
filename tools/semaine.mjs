#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// semaine.mjs — valide data/musique-chladni/semaine.json, le fichier du bloc « La semaine » de la page « Voir sa musique ».
//
// Ce qu'il contrôle : 7 jours au plus, des numéros entiers distincts de 1 à 7, une tonalité et une affiche par jour (le fichier
// existe), un identifiant YouTube de 11 caractères (lettres, chiffres, - et _), une URL TikTok bien formée (https, tiktok.com ;
// l'intégration demande /video/<chiffres>, sinon seul le lien direct est affiché), une date vide ou AAAA-MM-JJ. Un jour sans
// vidéo est permis : sa carte dit « bientôt ». Il affiche un résumé.
//
// Usage : node tools/semaine.mjs [chemin du fichier]
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fichier = process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(ROOT, 'data/musique-chladni/semaine.json');
const erreurs = [], ko = (m) => erreurs.push(m);
let d = null;
try { d = JSON.parse(readFileSync(fichier, 'utf8')); } catch (e) { console.error(`ÉCHEC ${fichier} : illisible (${e.message})`); process.exit(1); }

if (!d || typeof d !== 'object' || !Array.isArray(d.jours)) ko('le fichier doit contenir un tableau « jours »');
const jours = d && Array.isArray(d.jours) ? d.jours : [];
if (!d.semaine || typeof d.semaine !== 'string') ko('« semaine » manque (un identifiant, par exemple 2026-S45 ou semaine-7)');
if (jours.length > 7) ko(`${jours.length} jours, 7 au plus`);
const vus = new Set();
let youtube = 0, tiktok = 0, sans = 0;
for (const j of jours) {
  const t = `jour ${j && j.n}`;
  if (!j || !Number.isInteger(j.n) || j.n < 1 || j.n > 7) { ko(`${t} : « n » doit être un entier de 1 à 7`); continue; }
  if (vus.has(j.n)) ko(`${t} : numéro en double`); vus.add(j.n);
  if (!j.tonalite || typeof j.tonalite !== 'string') ko(`${t} : tonalité manquante`);
  if (!j.affiche || typeof j.affiche !== 'string') ko(`${t} : affiche manquante`);
  else if (!existsSync(path.join(ROOT, j.affiche))) ko(`${t} : l'affiche ${j.affiche} n'existe pas`);
  if (j.date && !(/^\d{4}-\d{2}-\d{2}$/.test(j.date) && !Number.isNaN(Date.parse(j.date)))) ko(`${t} : date « ${j.date} » (AAAA-MM-JJ ou vide)`);
  if (j.youtube) { if (!/^[A-Za-z0-9_-]{11}$/.test(j.youtube)) ko(`${t} : identifiant YouTube « ${j.youtube} » (11 caractères : lettres, chiffres, - et _)`); else youtube++; }
  if (j.tiktok) {
    let u = null; try { u = new URL(j.tiktok); } catch { /* signalé */ }
    if (!u || u.protocol !== 'https:' || !/(^|\.)tiktok\.com$/.test(u.hostname)) ko(`${t} : URL TikTok « ${j.tiktok} » (https://…tiktok.com/…)`);
    else { tiktok++; if (!/\/video\/\d+/.test(u.pathname)) console.log(`  jour ${j.n} : URL TikTok sans /video/<chiffres> — pas d'intégration, lien direct seulement`); }
  }
  if (!j.youtube && !j.tiktok) sans++;
}
if (erreurs.length) { for (const e of erreurs) console.error('ÉCHEC ' + e); process.exit(1); }
console.log(`${d.titre || d.semaine} (${d.semaine}) : ${jours.length} jour(s) — ${youtube} avec YouTube, ${tiktok} avec TikTok, ${sans} « bientôt » ; affiches présentes.`);
