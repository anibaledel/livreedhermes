#!/usr/bin/env node
/* ============================================================
   build-header.js — recopie les fragments de includes/ dans toutes les
   pages de contenu, entre des marqueurs.

   Pourquoi ce script existe
   -------------------------
   L'en-tête était recopié à la main dans chaque page, et avait divergé en
   trois formes : logo hors du cadre puis traducteur (73 pages), logo DANS
   le cadre et traducteur après (14), logo seul sans traducteur (7). Trois
   pages portaient un emplacement de traduction que le script n'alimentait
   jamais — un widget invisible, sans erreur, pendant des semaines — et
   encodeur.html un <div> stylé en ligne au lieu de la classe commune.

   C'est le même mécanisme que le bug de btnReset et que la triple copie de
   FACES : une copie oubliée qui l'emporte au prochain passage. La parade
   est la même que pour referent_bandes : une source unique, un script qui
   recopie, et un contrôle qui échoue si une page diverge — voir
   tools/check_header_sync.mjs et includes/README.md.

   Usage
   -----
       node scripts/build-header.js            écrit
       node scripts/build-header.js --verifie  n'écrit rien, liste les écarts

   Le premier passage ADOPTE les pages : il retire l'ancien en-tête sous
   ses trois formes et pose les marqueurs. Les suivants n'entretiennent
   que le contenu entre marqueurs. Relancer est sans effet.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { BOOK_LANGS, BOOK_HREFLANG } = require('./book-langs.js');

const REPO_ROOT = path.resolve(__dirname, '..');
const INCLUDES = path.join(REPO_ROOT, 'includes');

// Hors périmètre : redirections (meta refresh, aucun contenu propre), pages
// de test cryptographiques, et l'aperçu interne des icônes de navigation.
const HORS_PERIMETRE = new Set([
  'pages.html', 'pro.html', 'pro-contenu.html', 'tirage-livree-hermes.html',
  'galerie-768-patterns-unifies.html', 'galerie-884-patterns-unifies.html',
  'motifs (4).html', '_preview.html',
]);
const DOSSIERS_IGNORES = new Set(['.git', 'node_modules', 'js', 'includes']);

// Déjà traduites à la main : une traduction automatique par-dessus n'a pas
// de sens. Elles gardent l'en-tête, sans l'emplacement du widget.
// Le pied partagé est rédigé en français, et sa ligne de crédit l'est aussi.
// Les pages traduites à la main gardent le leur : leur imposer un pied
// français serait une régression pour leurs lecteurs.
const SANS_PIED = new Set([
  'fr/livre/index.html', 'en/book/index.html', 'es/libro/index.html',
  'th/book/index.html', 'book-viewer/index.html',
]);

const SANS_TRADUCTEUR = new Set([
  'fr/livre/index.html', 'en/book/index.html', 'es/libro/index.html',
  'th/book/index.html', 'book-viewer/index.html',
]);

// Le livre est la seule partie du site qui existe en plusieurs langues. Les
// quatre pages portent le même bloc hreflang — il liste TOUS les équivalents,
// y compris la page elle-même — engendré depuis scripts/book-langs.js, que
// scripts/generate-sitemap.js lit aussi. Pas de fragment séparé : ce serait
// une seconde copie de la même liste, et un sitemap qui contredit un <head>
// sur les alternates est une erreur que Google signale.
//
// Aucune autre page n'en reçoit : déclarer un équivalent qui n'existe pas est
// une affirmation fausse. La réponse pour le reste du site est un corpus
// traduit, pas une balise.
const AVEC_HREFLANG = new Map(BOOK_LANGS.map(([lang, , fichier]) => [fichier, lang]));
const HREFLANG_HTML = BOOK_HREFLANG
  .map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`)
  .join('\n');

const FIN_ENTETE = '<!-- @header:end -->';

const lire = (n) => fs.readFileSync(path.join(INCLUDES, n), 'utf8');
const FRAGMENTS = {
  'head-icons': lire('head-icons.html'),
  header: lire('header.html'),
  footer: lire('footer.html'),
  translate: lire('translate-script.html'),
};
const SLOT = lire('translate-slot.html');

function zone(nom, corps, source = 'includes/') {
  return `<!-- @${nom}:start — engendré depuis ${source}, ne pas éditer ici (voir scripts/build-header.js) -->\n`
       + corps.replace(/\n+$/, '') + `\n<!-- @${nom}:end -->`;
}

function rendre(nom, prefixe, traducteur) {
  let corps = FRAGMENTS[nom].split('{{BASE}}').join(prefixe);
  if (nom === 'header') {
    corps = corps.split('{{TRADUCTEUR}}').join(traducteur ? SLOT : '');
  }
  return zone(nom, corps);
}

/* ---- Adoption : effacer l'en-tête écrit à la main, sous ses trois formes ---- */
function adopter(src) {
  let s = src;
  // 1. Le script du traducteur, où qu'il soit.
  s = s.replace(/[ \t]*<script type="text\/javascript">\s*\n?\s*function googleTranslateElementInit\(\)[\s\S]*?<\/script>\s*\n?[ \t]*<script type="text\/javascript" src="https:\/\/translate\.google\.com\/translate_a\/element\.js\?cb=googleTranslateElementInit"><\/script>\n?/g, '');
  // 2. L'emplacement du widget, classe commune ou variante stylée en ligne.
  s = s.replace(/[ \t]*<div id="google_translate_element"[^>]*><\/div>\n?/g, '');
  // 3. Le logo d'en-tête — reconnu à son style en ligne, qui le distingue du
  //    logo de pied de page (même fichier, sans attribut style).
  s = s.replace(/[ \t]*<img src="[^"]*title-logo-footer\.png" alt="La Livrée d'Hermès" style="width:2\d\dpx[^"]*"[^>]*>\n?/g, '');
  // 4. Les alternates écrits à la main. Les quatre pages du livre les
  //    portaient déjà, corrects — ils passent simplement sous la même source
  //    que le sitemap pour ne plus pouvoir en diverger. Retirer ceux qui sont
  //    dans la zone balisée est sans effet : poser() la réécrit entière juste
  //    après, ce qui garde le script relançable sans effet.
  s = s.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?/g, '');
  // 5. Un <header> nu devenu vide n'a plus de raison d'être.
  s = s.replace(/[ \t]*<header>\s*<\/header>\n?/g, '');
  return s;
}

function poser(s, nom, contenu, placer) {
  const re = new RegExp(`[ \\t]*<!-- @${nom}:start[\\s\\S]*?<!-- @${nom}:end -->`, 'g');
  if (re.test(s)) return s.replace(re, contenu);
  return placer(s, contenu);
}

function traiter(rel, src) {
  // 404.html est la seule page dont les chemins sont ABSOLUS depuis la racine.
  // GitHub Pages la sert pour n'importe quelle adresse inconnue, à n'importe
  // quelle profondeur : sur /articles/inexistant, le navigateur résout les
  // chemins relatifs contre /articles/, et un préfixe vide y ferait pointer
  // « assets/… » vers /articles/assets/… — logo, icônes et feuille de style ne
  // chargeraient pas. Une page d'erreur cassée est pire qu'une page d'erreur
  // générique. Le contrôle de chargement le vérifie À UNE ADRESSE IMBRIQUÉE et
  // non à /404.html, où le défaut ne peut pas apparaître : voir
  // tools/check_pages_console.mjs.
  const prefixe = rel === '404.html' ? '/' : '../'.repeat(rel.split('/').length - 1);
  const traducteur = !SANS_TRADUCTEUR.has(rel);
  let s = adopter(src);

  s = poser(s, 'head-icons', rendre('head-icons', prefixe, traducteur),
    (t, c) => t.replace('</head>', `${c}\n</head>`));

  if (AVEC_HREFLANG.has(rel)) {
    s = poser(s, 'hreflang', zone('hreflang', HREFLANG_HTML, 'scripts/book-langs.js'),
      (t, c) => t.replace('</head>', `${c}\n</head>`));
  }

  // L'en-tête ouvre le contenu : dans .wrap s'il existe, sinon juste après <body>.
  s = poser(s, 'header', rendre('header', prefixe, traducteur), (t, c) => {
    const wrap = t.match(/<div class="wrap"[^>]*>\n?/);
    if (wrap) return t.replace(wrap[0], wrap[0] + c + '\n');
    return t.replace(/<body[^>]*>\n?/, (m) => m + c + '\n');
  });

  if (traducteur) {
    s = poser(s, 'translate', rendre('translate', prefixe, traducteur),
      (t, c) => t.replace(/<\/body>/, `${c}\n</body>`));
  }

  if (!SANS_PIED.has(rel)) {
    // Le pied ferme le contenu : à la toute fin de .wrap, après la zone de
    // navigation .note quand elle existe.
    s = poser(s, 'footer', rendre('footer', prefixe, traducteur), (t, c) => {
      const i = t.lastIndexOf('</div>\n</body>');
      if (i !== -1) return t.slice(0, i) + c + '\n' + t.slice(i);
      return t.replace(/<\/body>/, `${c}\n</body>`);
    });

    // <main> encadre le contenu propre à la page : il ouvre après l'en-tête
    // partagé et ferme avant la navigation de bas de page, qui n'en fait pas
    // partie. Les marqueurs le rendent relançable sans effet.
    // Garde-fou : une page qui porte déjà un <main> n'en reçoit pas un second.
    // Le cas s'est produit sur cymatique.html, où <main> servait de conteneur
    // de grille — deux <main> sur une page sont invalides, et le contrôle de
    // chargement le signale désormais.
    if (!s.includes('<!-- @main:start') && !/<main[\s>]/.test(s)) {
      const apresEntete = s.indexOf(FIN_ENTETE);
      if (apresEntete !== -1) {
        const debut = apresEntete + FIN_ENTETE.length;
        let fin = s.indexOf('<div class="note"', debut);
        if (fin === -1) fin = s.indexOf('<!-- @footer:start', debut);
        if (fin !== -1) {
          s = s.slice(0, debut) + '\n<!-- @main:start -->\n<main>'
            + s.slice(debut, fin) + '</main>\n<!-- @main:end -->\n' + s.slice(fin);
        }
      }
    }
  }
  return s;
}

function parcourir(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (DOSSIERS_IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    const rel = path.relative(REPO_ROOT, abs);
    if (e.isDirectory()) { parcourir(abs, acc); continue; }
    if (!e.name.endsWith('.html')) continue;
    if (HORS_PERIMETRE.has(rel) || HORS_PERIMETRE.has(e.name)) continue;
    acc.push(rel);
  }
  return acc;
}

/* Exposé pour scripts/generate-hexagram-pages.js : les 64 pages engendrées
   portent le même en-tête que les autres, depuis les mêmes fragments, et non
   une quatrième copie écrite dans le gabarit. */
module.exports = { rendre, zone, SANS_TRADUCTEUR };

if (require.main !== module) return;

const verifie = process.argv.includes('--verifie');
const ecarts = [];
let touchees = 0;
for (const rel of parcourir(REPO_ROOT).sort()) {
  const abs = path.join(REPO_ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const out = traiter(rel, src);
  if (out === src) continue;
  ecarts.push(rel);
  if (!verifie) { fs.writeFileSync(abs, out, 'utf8'); touchees++; }
}

if (verifie) {
  if (ecarts.length) {
    console.error(`${ecarts.length} page(s) ne correspondent pas à leur source (includes/, scripts/book-langs.js) :`);
    for (const e of ecarts) console.error(`   ${e}`);
    console.error("\nRelancer : node scripts/build-header.js");
    process.exit(1);
  }
  console.log(`En-tête et alternates conformes à leur source sur les ${parcourir(REPO_ROOT).length} pages du périmètre.`);
} else {
  console.log(`${touchees} page(s) mises à jour sur ${parcourir(REPO_ROOT).length} du périmètre.`);
}
