#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande (contact : page « À propos » du site)
//
// check_musique_statique.mjs — « Voir sa musique » se lit SANS JavaScript (prompt 202 : Bing, Copilot, Google
// lisent d'abord le HTML ; un texte écrit seulement par script est un contenu essentiel masqué). Sur les 11 pages
// (musique-chladni.html et les dix traductions), dans le HTML TEL QUE LE SERVEUR L'ENVOIE :
//   1. aucun élément `data-t` n'est vide, y compris le message <noscript> ; aucun `alt` de `data-ta` n'est vide ;
//   2. l'introduction, le texte de discrétion et l'avertissement de scintillement sont là ;
//   3. la section « Comment ça marche » (id="comment") est visible dans le HTML (pas dans un <details>) : un seul <h2>,
//      au moins 6 paragraphes, l'image d'exemple (fichier présent, alt non vide, légende non vide) et le lien vers
//      l'auteur ;
//   4. la liste « Voir aussi » est dans le HTML ;
//   5. la hiérarchie des titres est correcte : un seul h1, aucun saut de niveau (h1 → h2 → h3), les titres de
//      fenêtres « Validé / Essai » ne sont pas des titres ;
//   6. le texte principal visible sans script fait au moins SEUIL caractères (le français passait de 346 à plus de 2 400) ;
//   7. avec `--base-url` : les mêmes pages EN LIGNE, lues par `curl` avec le User-Agent de Bingbot et un extracteur de
//      texte (aucun navigateur, aucun script exécuté), exposent l'introduction, la discrétion et l'avertissement.
//   --essai : un `data-t` vidé dans une copie de la page doit être refusé.
//
// Usage : node tools/check_musique_statique.mjs [--base-url https://anibal-amiot.com] [--essai]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), essai = args.includes('--essai');
const bi = args.indexOf('--base-url'), BASE = bi >= 0 ? args[bi + 1].replace(/\/$/, '') : null;
const PAGES = ['musique-chladni.html', 'en/see-your-music/index.html', 'es/ver-tu-musica/index.html', 'th/see-your-music/index.html', 'zh/see-your-music/index.html', 'ru/see-your-music/index.html',
  'pt/see-your-music/index.html', 'hi/see-your-music/index.html', 'de/see-your-music/index.html', 'it/see-your-music/index.html', 'ja/see-your-music/index.html'];
const SEUIL = 700; // caractères : le chinois, le plus court, en fait plus de 850 (l'écriture dense compte moins de signes)
const CLES = ['intro', 'discretion', 'flash', 'commentTitre', 'comment1', 'comment2', 'comment3', 'comment4', 'comment5', 'comment6', 'commentAuteur', 'refLegende', 'sansJs', 'voirAussiTitre'];
const UA_BING = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';

const decode = (t) => t.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
/** Le texte principal d'une page SANS exécuter de script : <main>, sans <script>, <style> ni <noscript>. */
const texte = (h) => {
  let t = h.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, ' ');
  const m = /<main\b[\s\S]*?<\/main>/i.exec(t); if (m) t = m[0];
  return decode(t.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
};
// (un lien vers une page française porte, dans une autre langue, l'annonce de langue de scripts/langues.js : <span class="lien-langue">)
const element = (h, cle) => { const m = new RegExp(`<(\\w+)\\b[^>]*\\bdata-t="${cle}"[^>]*>((?:[^<]|<span class="lien-langue">[^<]*</span>)*)</\\1>`).exec(h); return m ? decode(m[2].replace(/<[^>]+>/g, '')).trim() : null; };

function controle(rel, h) {
  const e = [], dire = (m) => e.push(`${rel} : ${m}`);
  for (const m of h.matchAll(/<(\w+)\b[^>]*\bdata-t="(\w+)"[^>]*>([^<]*)<\/\1>/g)) if (!m[3].trim()) dire(`data-t="${m[2]}" est vide dans le HTML statique (le texte n'est écrit que par JavaScript)`);
  for (const m of h.matchAll(/<img\b[^>]*\bdata-ta="(\w+)"[^>]*>/g)) if (!/\balt="[^"]{8,}"/.test(m[0])) dire(`l'image data-ta="${m[1]}" n'a pas d'alt dans le HTML statique`);
  for (const c of CLES) if (element(h, c) === null) dire(`élément data-t="${c}" absent`);
  // l'ordre de la page (prompt 220) : titre, portes, nouvelle interface, introduction, démarrage ; Attention puis « Rien ne quitte votre navigateur » ; message, fenêtres et options, panneaux ;
  // La semaine ; Comment ça marche ; Voir aussi
  const ORDRE = ['<h1', 'class="trois-portes"', 'id="nouvelle-interface"', 'class="vm-intro"', 'class="vm-demarrage"', 'class="vm-flash"', 'class="vm-discretion"', 'id="vmMessage"', 'class="vm-main"', 'id="vmTitreReglages"', 'id="vmAppareil"', 'id="vmSemaine"', 'id="comment"', 'class="vm-voir"'];
  const places = ORDRE.map((k) => h.indexOf(k, h.indexOf('<main')));
  ORDRE.forEach((k, i) => { if (places[i] < 0) dire(`l'ordre de la page : ${k} absent`); else if (i && places[i] < places[i - 1]) dire(`l'ordre de la page : ${k} doit venir après ${ORDRE[i - 1]}`); });
  { const d = element(h, 'discretion'), c4 = element(h, 'comment4'); if (d && c4 && c4.includes(d.slice(0, 25))) dire('« Comment ça marche » (comment4) répète la phrase de discrétion : elle ne se dit qu\'une fois, sous « Attention »'); }
  const s = /<section\b[^>]*\bid="comment"[^>]*>([\s\S]*?)<\/section>/.exec(h);
  if (!s) dire('section id="comment" absente');
  else {
    if (/<details\b/i.test(s[1])) dire('« Comment ça marche » ne doit pas être dans un <details> (visible, pas repliée)');
    if ((s[1].match(/<h2\b/g) || []).length !== 1) dire('« Comment ça marche » : un seul <h2> attendu');
    if ((s[1].match(/<p\b/g) || []).length < 6) dire('« Comment ça marche » : au moins 6 paragraphes attendus');
    const img = /<img\b[^>]*\bsrc="([^"]+)"[^>]*>/.exec(s[1]), cap = /<figcaption\b[^>]*>([^<]+)<\/figcaption>/.exec(s[1]);
    if (!img) dire('image d\'exemple absente');
    else if (!fs.existsSync(path.join(ROOT, path.dirname(rel), img[1]))) dire(`image d'exemple introuvable : ${img[1]}`);
    if (!cap || !cap[1].trim()) dire('légende de l\'image d\'exemple absente');
    if (!/<a\b[^>]*\bhref="[^"]*"[^>]*>[^<]+(?:<span class="lien-langue">[^<]*<\/span>)?<\/a>/.test(s[1])) dire('lien vers l\'auteur absent');
  }
  if (!/<div class="vm-cartes" id="vmVoirAussi">\s*<a\b/.test(h)) dire('la liste « Voir aussi » est vide dans le HTML');
  if (!/<noscript>\s*<p\b[^>]*data-t="sansJs"/.test(h)) dire('message <noscript> absent');
  // les titres : tels que le HTML les envoie (le JavaScript n'en ajoute aucun : les groupes de l'Avancé ne sont pas des titres)
  const main = (/<main\b[\s\S]*?<\/main>/i.exec(h) || [''])[0], niveaux = [...main.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  if (niveaux.filter((n) => n === 1).length !== 1) dire(`un seul h1 attendu (${niveaux.filter((n) => n === 1).length})`);
  niveaux.forEach((n, i) => { if (i > 0 && n > niveaux[i - 1] + 1) dire(`saut de niveau de titre : h${niveaux[i - 1]} puis h${n}`); });
  if (/<h[1-6]\b[^>]*\bid="vm(Valide|Essai)Titre"/.test(h)) dire('les titres de fenêtres « Validé / Essai » ne doivent pas être des titres');
  const t = texte(h); if (t.length < SEUIL) dire(`texte principal visible sans JavaScript : ${t.length} caractères (${SEUIL} au moins)`);
  return { e, longueur: t.length };
}

const echecs = [], tailles = [];
for (const rel of PAGES) {
  let h = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  if (essai) h = h.replace(/(<p class="vm-intro" data-t="intro">)[^<]*(<\/p>)/, '$1$2');
  const r = controle(rel, h); echecs.push(...r.e); tailles.push(`${rel.split('/')[0].replace('musique-chladni.html', 'fr')} ${r.longueur}`);
}
if (essai) {
  if (echecs.some((x) => /data-t="intro" est vide/.test(x))) { console.log(`Essai : un data-t vidé est refusé — ${echecs[0].slice(0, 110)}`); process.exit(0); }
  console.error('Essai : un data-t vidé n\'a pas été refusé.'); process.exit(1);
}
if (BASE) {
  for (const rel of PAGES) {
    const url = `${BASE}/${rel.replace(/index\.html$/, '')}`;
    let h = ''; try { h = execFileSync('curl', ['-sL', '-m', '40', '-A', UA_BING, url], { encoding: 'utf8', maxBuffer: 1 << 24 }); } catch (err) { echecs.push(`${url} : curl a échoué`); continue; }
    const local = fs.readFileSync(path.join(ROOT, rel), 'utf8'), t = texte(h);
    for (const c of ['intro', 'discretion', 'flash']) { const attendu = element(local, c); if (!attendu || !t.includes(attendu.slice(0, 60))) echecs.push(`${url} : en ligne, sans JavaScript, « ${c} » n'est pas dans le texte (${t.length} caractères lus)`); }
    tailles.push(`en ligne ${rel.split('/')[0].replace('musique-chladni.html', 'fr')} ${t.length}`);
  }
}
if (echecs.length) { for (const f of echecs) console.error('ÉCHEC ' + f); process.exit(1); }
console.log(`Voir sa musique, sans JavaScript : 11 pages complètes (introduction, discrétion, avertissement, « Comment ça marche », image d'exemple, « Voir aussi », titres en ordre) ; caractères lus : ${tailles.join(' · ')}.`);
