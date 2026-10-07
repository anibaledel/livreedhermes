#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// check_html_servi.mjs — les liens du HTML SERVI : aucun <a> dans un autre
// <a>, aucun <a> sans nom accessible.
//
// Pourquoi sur le fichier et pas dans le navigateur (7 octobre 2026) : #247 a
// servi sur en/book/, es/libro/ et th/book/ un fil d'Ariane où le premier <a>
// n'avait ni texte ni fermeture, et où un second <a> s'ouvrait dedans. Le
// navigateur répare : il ferme le premier lien devant le second, et le
// séparateur « / » qu'il avait avalé devient son texte. axe-core
// (check_accessibilite.mjs) lit ce DOM réparé, trouve un lien nommé « / » et
// passe ; check_liens.mjs ne regarde que les cibles. Le défaut était invisible
// à l'un comme à l'autre par construction. Ce contrôle lit le texte des
// fichiers, avant toute réparation.
//
// Règles, sur chaque page HTML du dépôt (hors <script>, <style>, <template>,
// commentaires) :
//   1. un <a> ne s'ouvre pas tant qu'un autre <a> est ouvert ;
//   2. tout <a> ouvert est fermé ;
//   3. un <a> a un nom accessible : du texte, ou aria-label / aria-labelledby,
//      ou une image avec un alt non vide.
//
// Usage : node tools/check_html_servi.mjs          contrôle tout le dépôt
//         node tools/check_html_servi.mjs --essai  fausse une page des deux manières et montre qu'il refuse

import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const IGNORES = new Set(['.git', 'node_modules', 'pagefind', 'sources']);

function pages(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) pages(abs, acc);
    else if (e.name.endsWith('.html')) acc.push(abs);
  }
  return acc;
}

const ligneDe = (s, i) => s.slice(0, i).split('\n').length;
// Le contenu sans ce qui n'est pas du HTML de page ; les longueurs sont
// gardées (espaces) pour que les numéros de ligne restent justes.
const neutraliser = (s) => s
  .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/<(script|style|template|textarea)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, (m) => m.replace(/[^\n]/g, ' '));

function nomAccessible(attrs, dedans) {
  if (/\saria-label(ledby)?\s*=\s*"[^"]*\S[^"]*"/i.test(attrs)) return true;
  if (/<img\b[^>]*\salt\s*=\s*"[^"]*\S[^"]*"/i.test(dedans)) return true;
  if (/<svg\b[\s\S]*?<title>[^<]*\S/i.test(dedans)) return true;
  const texte = dedans.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;/g, ' ').trim();
  return texte.length > 0;
}

export function controler(s, rel) {
  const fautes = [];
  const t = neutraliser(s);
  const re = /<(\/?)a\b([^>]*)>/gi;
  let ouvert = null, m;
  while ((m = re.exec(t))) {
    if (!m[1]) {
      if (ouvert) fautes.push(`${rel}:${ligneDe(t, m.index)} : <a> ouvert dans le <a> de la ligne ${ligneDe(t, ouvert.index)}`);
      ouvert = { index: m.index, fin: re.lastIndex, attrs: m[2] };
    } else if (ouvert) {
      const dedans = t.slice(ouvert.fin, m.index);
      if (!nomAccessible(ouvert.attrs, dedans)) fautes.push(`${rel}:${ligneDe(t, ouvert.index)} : <a${ouvert.attrs.slice(0, 80)}> sans nom accessible (ni texte, ni aria-label, ni image avec alt)`);
      ouvert = null;
    }
  }
  if (ouvert) fautes.push(`${rel}:${ligneDe(t, ouvert.index)} : <a> jamais fermé`);
  return fautes;
}

if (process.argv.includes('--essai')) {
  const rel = 'fr/livre/index.html';
  const s = fs.readFileSync(path.join(RACINE, rel), 'utf8');
  const i = s.indexOf('<nav class="breadcrumb"');
  if (i < 0) { console.error('ÉCHEC de l\'essai : pas de fil d\'Ariane dans fr/livre/'); process.exit(1); }
  // 1. le défaut de #247, tel quel : « Accueil</a> » retiré du premier lien
  const casse = s.slice(0, i) + s.slice(i).replace(/(<a href="[^"]*">)Accueil<\/a>/, '$1');
  // 2. un lien vide, bien fermé
  const vide = s.slice(0, i) + s.slice(i).replace(/(<a href="[^"]*">)Accueil(<\/a>)/, '$1$2');
  const f1 = controler(casse, `${rel} (faussé : lien imbriqué)`), f2 = controler(vide, `${rel} (faussé : lien vide)`);
  const ok = f1.some((f) => f.includes('ouvert dans')) && f2.some((f) => f.includes('sans nom accessible')) && !controler(s, rel).length;
  for (const f of [...f1, ...f2]) console.log(`  relevé : ${f}`);
  if (!ok) { console.error('ÉCHEC de l\'essai : un des deux défauts n\'a pas été relevé, ou la page intacte est refusée.'); process.exit(1); }
  console.log('Essai : la page faussée des deux manières est refusée, la page intacte passe.');
  process.exit(0);
}

const toutes = pages(RACINE);
const fautes = toutes.flatMap((f) => controler(fs.readFileSync(f, 'utf8'), path.relative(RACINE, f)));
if (fautes.length) {
  for (const f of fautes.slice(0, 100)) console.error(`ÉCART ${f}`);
  if (fautes.length > 100) console.error(`… et ${fautes.length - 100} autres.`);
  console.error(`\n${fautes.length} lien(s) fautif(s) dans le HTML servi, sur ${new Set(fautes.map((f) => f.split(':')[0])).size} page(s).`);
  process.exit(1);
}
console.log(`HTML servi : ${toutes.length} pages, aucun <a> imbriqué, non fermé ou sans nom accessible.`);
