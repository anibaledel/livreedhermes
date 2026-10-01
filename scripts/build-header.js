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
   `node scripts/build-header.js --verifie` (workflow check-header-sync.yml)
   et includes/README.md.

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
const { BLOC_PAR_FICHIER, RANGEE_PAR_FICHIER } = require('./langues.js');
const { htmlNavTiles } = require('./nav-tiles.js');

const REPO_ROOT = path.resolve(__dirname, '..');
const INCLUDES = path.join(REPO_ROOT, 'includes');

// Hors périmètre : redirections (meta refresh, aucun contenu propre), pages
// et pages de test cryptographiques.
const HORS_PERIMETRE = new Set([
  'pages.html', 'pro.html', 'pro-contenu.html', 'tirage-livree-hermes.html',
  'galerie-768-patterns-unifies.html', 'galerie-884-patterns-unifies.html',
  'motifs (4).html',
]);
const DOSSIERS_IGNORES = new Set(['.git', 'node_modules', 'js', 'includes']);

// Les pages traduites à la main n'ont pas de pied partagé : il est rédigé
// en français, ligne de crédit comprise, et l'imposer à ces lecteurs serait
// une régression — elles gardent le leur. La liste et sa raison vivent dans
// scripts/pages-traduites.js, que tools/check_pages_console.mjs lit aussi.
// Elle a vécu en double des années — la sortir d'ici est ce qui rend la
// divergence impossible.
const { TRADUITES_A_LA_MAIN } = require('./pages-traduites.js');
const SANS_PIED = TRADUITES_A_LA_MAIN;

// Pages qui gardent le petit pied de page partagé (@footer) mais N'ONT PAS le
// bloc de tuiles (@navtiles) — liste explicite plutôt qu'exception implicite,
// avec la raison de chacune :
const SANS_TUILES = new Set([
  // carter-demo.html porte sa palette propre (--bg:#0a0e14, --gold:#c8aa6e) et
  // ne charge pas style.css (voir ce fichier) : lui donner une copie locale du
  // CSS des tuiles recréerait la divergence qu'on vient de supprimer. Elle
  // garde son petit pied universel, pas le bloc de tuiles.
  'carter-demo.html',
]);

// Les pages d'un même groupe de traduction portent le même bloc hreflang — il
// liste TOUS les équivalents, y compris la page elle-même — engendré depuis
// scripts/langues.js, que scripts/generate-sitemap.js lit aussi. Pas de
// fragment séparé : ce serait une seconde copie de la même liste, et un
// sitemap qui contredit un <head> sur les alternates est une erreur que Google
// signale.
//
// Le bloc se lit PAR FICHIER, et non plus globalement : deux groupes ont deux
// blocs différents. Aucune page hors groupe n'en reçoit — déclarer un
// équivalent qui n'existe pas est une affirmation fausse. La réponse pour le
// reste du site est un corpus traduit, pas une balise.
const htmlHreflang = (bloc) => bloc
  .map(([lang, href]) => `<link rel="alternate" hreflang="${lang}" href="${href}">`)
  .join('\n');

// La rangée de langues visible, sur le modèle des pages du livre. Elle sort de
// la MÊME liste que le hreflang : une page ne peut plus proposer une version
// que les moteurs ignorent, ni l'inverse. C'était le dernier endroit où les
// deux pouvaient diverger — le hreflang parlait aux moteurs depuis #105, et
// personne ne parlait aux lecteurs.
const htmlRangee = (r) => `<p class="other-langs">${r.libelle} `
  + r.liens.map((l) => `<a href="${l.href}">${l.nom}</a>`).join(' · ')
  + '</p>';

const FIN_ENTETE = '<!-- @header:end -->';

const lire = (n) => fs.readFileSync(path.join(INCLUDES, n), 'utf8');
// Jeton Cloudflare Web Analytics (vide : pas de mesure d'audience).
const JETON_AUDIENCE = (JSON.parse(fs.readFileSync(path.join(INCLUDES, 'analytics.json'), 'utf8')).cloudflareToken || '').trim();
if (JETON_AUDIENCE && !/^[0-9a-f]{32}$/i.test(JETON_AUDIENCE)) {
  throw new Error(`includes/analytics.json : jeton inattendu « ${JETON_AUDIENCE} » (32 caractères hexadécimaux attendus).`);
}
const FRAGMENTS = {
  'head-icons': lire('head-icons.html'),
  header: lire('header.html'),
  footer: lire('footer.html'),
  // Le même pied en anglais, pour les pages <html lang="en"> : rendre('footer',
  // …, 'en') le choisit. Liens vers les versions anglaises quand elles existent.
  'footer-en': lire('footer-en.html'),
};

function zone(nom, corps, source = 'includes/') {
  return `<!-- @${nom}:start — engendré depuis ${source}, ne pas éditer ici (voir scripts/build-header.js) -->\n`
       + corps.replace(/\n+$/, '') + `\n<!-- @${nom}:end -->`;
}

// Lien d'évitement de l'en-tête, dans la langue de la page (<html lang>).
const TEXTE_EVITEMENT = {
  fr: 'Aller au contenu', en: 'Skip to content', es: 'Ir al contenido', th: 'ข้ามไปยังเนื้อหา',
};
function langHtml(s) {
  const m = /<html[^>]*\slang="([a-z]{2})/i.exec(s);
  return m && TEXTE_EVITEMENT[m[1].toLowerCase()] ? m[1].toLowerCase() : 'fr';
}

function rendre(nom, prefixe, lang = 'fr') {
  // La zone garde son nom (@footer) ; seul le fragment change avec la langue.
  const fragment = nom === 'footer' && lang === 'en' ? 'footer-en' : nom;
  const corps = FRAGMENTS[fragment].split('{{BASE}}').join(prefixe)
    .split('{{SKIP}}').join(TEXTE_EVITEMENT[lang]);
  return zone(nom, corps);
}

/* Même principe que rendre(), mais le corps vient de scripts/nav-tiles.js
   (calculé par page, pas un fichier statique à substitution) : voir ce
   fichier pour l'auto-exclusion et l'assertion bruyante sur les adresses. */
function rendreNavTiles(rel, prefixe, lang = 'fr') {
  return zone('navtiles', htmlNavTiles(rel, prefixe, lang), 'scripts/nav-tiles.js');
}

/* Langue du bloc de tuiles (labels, groupes, bouton Soutien, crédit) —
   PAS celle des adresses de destination, qui restent françaises quelle que
   soit la page d'où l'on part (voir scripts/nav-tiles.js, en-tête). Tout le
   site est en français, à l'exception des 256 pages motifs/*.html (anglais,
   x-default — décision d'origine, prompt-cc-pages-motifs.md) et de leur
   jumelle fr/motifs/*.html : la détection se fait donc par chemin, pas par
   une liste à tenir à jour à chaque page ajoutée. */
function langDePage(rel) {
  if (rel.startsWith('fr/motifs/')) return 'fr';
  if (rel.startsWith('motifs/')) return 'en';
  if (rel.startsWith('en/')) return 'en';
  return 'fr';
}

/* Les 512 pages motifs/*.html et fr/motifs/*.html seules — voir adopter()
   plus bas pour la même distinction sur le hreflang. */
function estPageMotif(rel) {
  return rel?.startsWith('motifs/') || rel?.startsWith('fr/motifs/');
}

// Pages hors motifs qui reçoivent quand même le bloc de tuiles (@navtiles,
// logo de pied compris) — simple oubli lors du chantier qui l'a introduit,
// pas une exception structurelle comme SANS_TUILES : elles ont déjà le
// petit pied partagé (@footer) et aucune structure particulière en bas de
// page, juste jamais migrées. Liste explicite, pas une règle implicite, sur
// le même principe que SANS_TUILES ci-dessus — voir prompt du 2026-10-01
// (audit logo haut/bas sur les 620 pages).
const AVEC_TUILES_EN_PLUS = new Set([
  'bicolore.html',
  'cymatique.html',
  'soutien-succes.html',
  'creation-bicolore-v2.html',
  // Pages de recherche (scripts/build-recherche.mjs), créées avec le bloc.
  'recherche.html',
  'en/search/index.html',
  // Accueil anglais (/en/), jumelle de index.html (scripts/langues.js).
  'en/index.html',
]);

/* ---- Adoption : effacer l'en-tête écrit à la main, sous ses trois formes,
   et le traducteur Google Translate — retiré du site (décision de l'auteur,
   2026-09-27) : la traduction automatique par-dessus une traduction humaine
   rendait les fautes d'Anibal et celles de Google indistinguables, ce qui
   annulait la relecture par des lecteurs natifs, et les navigateurs
   proposent nativement une traduction. Ces deux remplacements restent ici
   pour nettoyer toute page qui porterait encore l'ancien widget. ---- */
function adopter(src, rel) {
  let s = src;
  // 0. La zone balisée du traducteur, posée par une exécution précédente du
  //    script avant son retrait — sans ce nettoyage, elle resterait figée,
  //    puisque traiter() ne la pose plus et poser() ne peut retirer que ce
  //    qu'il pose lui-même.
  s = s.replace(/[ \t]*<!-- @translate:start[\s\S]*?<!-- @translate:end -->\n?/g, '');
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
  //    Exception : motifs/*.html et fr/motifs/*.html ne sont dans aucun
  //    groupe de scripts/langues.js (512 pages engendrées, pas une liste à
  //    tenir à la main) — leur hreflang réciproque est calculé et écrit par
  //    scripts/generate-motif-pages.js lui-même, jamais par ce mécanisme ;
  //    le retirer ici l'effacerait sans que rien ne le repose.
  if (!estPageMotif(rel)) {
    s = s.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n?/g, '');
  }
  // 5. Un <header> nu devenu vide n'a plus de raison d'être.
  s = s.replace(/[ \t]*<header>\s*<\/header>\n?/g, '');
  return s;
}

/* Position [debut, fin) d'un <div ...>...</div> équilibré (respecte les
   <div> imbriqués) commençant à needle. null si needle est absent. */
function spanDivEquilibre(s, needle, apartirDe = 0) {
  const debut = s.indexOf(needle, apartirDe);
  if (debut === -1) return null;
  let i = debut + needle.length;
  let profondeur = 1;
  while (profondeur > 0 && i < s.length) {
    if (s.startsWith('<div', i) && /[\s>]/.test(s[i + 4] || '')) { profondeur++; i += 4; }
    else if (s.startsWith('</div>', i)) { profondeur--; i += 6; }
    else { i++; }
  }
  return { debut, fin: i };
}

function retirerSpan(s, span) {
  if (!span) return s;
  let fin = span.fin;
  if (s[fin] === '\n') fin++;
  return s.slice(0, span.debut) + s.slice(fin);
}

/* Adoption du bloc de navigation en tuiles (GIF + tuiles + logo), jusque-là
   recopié à la main sous trois formes :
   - un <div class="note">...</div> (22 pages secondaires, hexagrammes/index.html) ;
   - un bloc nu sans wrapper, entre @main:end et @footer:start (l'accueil) ;
   - un <div class="nav-tiles">...</div> nu à l'intérieur de <main> (404.html,
     seule page à chemins absolus, seule à ne montrer que 6 tuiles ciblées). */
function adopterNavTiles(s, rel) {
  if (s.includes('<div class="note">')) {
    return retirerSpan(s, spanDivEquilibre(s, '<div class="note">'));
  }
  if (rel === '404.html') {
    return retirerSpan(s, spanDivEquilibre(s, '<div class="nav-tiles">'));
  }
  // L'accueil : bloc nu, du premier <div class="nav-tiles"> au </div> du logo
  // de pied (footer-title-logo), sans wrapper commun à retirer d'un coup.
  const debutBloc = s.indexOf('<div class="nav-tiles">');
  if (debutBloc === -1) return s;
  const logo = spanDivEquilibre(s, '<div class="footer-title-logo">', debutBloc);
  if (!logo) return s;
  return retirerSpan(s, { debut: debutBloc, fin: logo.fin });
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
  let s = adopter(src, rel);
  // Le bloc de tuiles (@navtiles) n'est adopté que sur les pages motifs —
  // c'est leur propre chantier qui l'a introduit (voir scripts/nav-tiles.js).
  // Le reste du site (618 pages) porte encore ses propres formes de bas de
  // page, y compris des formes qu'adopterNavTiles() ne sait pas distinguer
  // d'un bloc générique — index.html par exemple mêle un sélecteur de
  // palette (#palettePicker) et une répartition de tuiles qui n'est pas
  // celle du corpus canonique dans le MÊME <div class="note">, qu'un passage
  // générique effacerait avec le reste. Étendre l'adoption aux 618 autres
  // pages est un chantier séparé, à faire une page à la fois, pas une
  // extrapolation automatique depuis les pages motifs.
  if ((estPageMotif(rel) || AVEC_TUILES_EN_PLUS.has(rel) || rel.startsWith('en/articles/')) && !SANS_PIED.has(rel) && !SANS_TUILES.has(rel)) {
    s = adopterNavTiles(s, rel);
  } else {
    // Retire une zone @navtiles déjà posée par un tour précédent, pour les
    // pages qui viennent d'entrer dans SANS_TUILES (carter-demo.html) ou qui
    // ne sont plus des pages motifs.
    s = s.replace(/[ \t]*<!-- @navtiles:start[\s\S]*?<!-- @navtiles:end -->\n?/, '');
  }

  s = poser(s, 'head-icons', rendre('head-icons', prefixe),
    (t, c) => t.replace('</head>', `${c}\n</head>`));

  if (BLOC_PAR_FICHIER.has(rel)) {
    const html = htmlHreflang(BLOC_PAR_FICHIER.get(rel));
    s = poser(s, 'hreflang', zone('hreflang', html, 'scripts/langues.js'),
      (t, c) => t.replace('</head>', `${c}\n</head>`));
  }

  // Mesure d'audience (Cloudflare Web Analytics, sans cookie) : posée avant
  // </body> quand includes/analytics.json porte un jeton, retirée sinon. Pas
  // sur les pages à CSP stricte (encodeur, paiement) : leur politique
  // n'autorise que les scripts du site, et ce sont des pages sensibles.
  s = s.replace(/[ \t]*<!-- @analytics:start[\s\S]*?<!-- @analytics:end -->\n?/, '');
  if (JETON_AUDIENCE && !/http-equiv="Content-Security-Policy"/.test(s)) {
    const balise = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${JETON_AUDIENCE}"}'></script>`;
    s = s.replace(/<\/body>/, `${zone('analytics', balise, 'includes/analytics.json')}\n</body>`);
  }

  // La rangée visible ne se pose QUE si la page porte déjà ses marqueurs : on
  // ne devine pas où l'insérer dans une page rédigée à la main. Les quatre
  // pages du lexique les portent ; celles du livre gardent leur rangée écrite
  // à la main, et ne reçoivent rien.
  if (RANGEE_PAR_FICHIER.has(rel) && s.includes('<!-- @langues:start')) {
    const html = htmlRangee(RANGEE_PAR_FICHIER.get(rel));
    s = poser(s, 'langues', zone('langues', html, 'scripts/langues.js'), (t) => t);
  }

  // L'en-tête ouvre le contenu : dans .wrap s'il existe, sinon juste après <body>.
  s = poser(s, 'header', rendre('header', prefixe, langHtml(s)), (t, c) => {
    const wrap = t.match(/<div class="wrap"[^>]*>\n?/);
    if (wrap) return t.replace(wrap[0], wrap[0] + c + '\n');
    return t.replace(/<body[^>]*>\n?/, (m) => m + c + '\n');
  });

  if (!SANS_PIED.has(rel)) {
    // Le bloc de tuiles se pose juste avant le petit pied partagé. Le marqueur
    // @footer existe déjà (posé par un tour précédent) à un endroit FIXE :
    // s'ancrer sur lui plutôt que sur la fin de .wrap, sans quoi le nouveau
    // bloc @navtiles (jamais posé avant) atterrit APRÈS lui au premier passage.
    // SANS_TUILES (carter-demo.html) garde le petit pied mais pas ce bloc.
    // Comme pour l'adoption ci-dessus : pages motifs + AVEC_TUILES_EN_PLUS.
    if ((estPageMotif(rel) || AVEC_TUILES_EN_PLUS.has(rel) || rel.startsWith('en/articles/')) && !SANS_TUILES.has(rel)) {
      s = poser(s, 'navtiles', rendreNavTiles(rel, prefixe, langDePage(rel)), (t, c) => {
        const i = t.indexOf('<!-- @footer:start');
        if (i !== -1) return t.slice(0, i) + c + '\n' + t.slice(i);
        const j = t.lastIndexOf('</div>\n</body>');
        if (j !== -1) return t.slice(0, j) + c + '\n' + t.slice(j);
        return t.replace(/<\/body>/, `${c}\n</body>`);
      });
    }

    // Le pied ferme le contenu : à la toute fin de .wrap, après la zone de
    // navigation .note quand elle existe.
    s = poser(s, 'footer', rendre('footer', prefixe, langHtml(s)), (t, c) => {
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
          s = s.slice(0, debut) + '\n<!-- @main:start -->\n<main id="contenu">'
            + s.slice(debut, fin) + '</main>\n<!-- @main:end -->\n' + s.slice(fin);
        }
      }
    }
  }
  // Cible du lien d'évitement de l'en-tête : le <main> de la page, ou, à
  // défaut (pages du livre, liseuse), le premier élément après l'en-tête.
  s = s.replace(/<main>/, '<main id="contenu">');
  if (!s.includes('id="contenu"')) {
    const i = s.indexOf(FIN_ENTETE);
    if (i !== -1) {
      const reste = s.slice(i + FIN_ENTETE.length);
      const m = /<([a-z][a-z0-9]*)(\s[^>]*)?>/i.exec(reste);
      if (m && !/\sid=/.test(m[2] || '')) {
        const j = i + FIN_ENTETE.length + m.index + 1 + m[1].length;
        s = s.slice(0, j) + ' id="contenu"' + s.slice(j);
      }
    }
  }
  return s;
}

function parcourir(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (DOSSIERS_IGNORES.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    // path.relative() rend des antislashes sous Windows ; tout le reste du
    // script (rel.split('/'), BLOC_PAR_FICHIER.has(rel), les clés de
    // scripts/langues.js) suppose des slashes. Sans cette normalisation,
    // rel.split('/').length vaut 1 pour toute page imbriquée — préfixe vide,
    // chemins relatifs cassés (favicon, assets) — et BLOC_PAR_FICHIER.has(rel)
    // échoue silencieusement, hreflang vide, sans qu'aucune erreur ne le
    // signale : c'est l'échec silencieux qu'il faut empêcher, pas seulement
    // le mauvais séparateur.
    const rel = path.relative(REPO_ROOT, abs).split(path.sep).join('/');
    if (rel.includes('\\')) {
      throw new Error(`Chemin relatif mal normalisé (antislash résiduel) : ${rel}`);
    }
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
module.exports = { rendre, zone, rendreNavTiles };

if (require.main !== module) return;

const verifie = process.argv.includes('--verifie');
// Chaque page déclarée dans un groupe de traduction doit exister. Un groupe
// qui nomme un fichier pas encore écrit produirait un hreflang qui ment — et
// c'est précisément ce que scripts/langues.js dit vouloir empêcher. Ce
// contrôle est ce qui permet d'ajouter les traductions une par une : déclarer
// la page avant de l'avoir écrite fait échouer la CI, pas la production.
const fantomes = [...BLOC_PAR_FICHIER.keys()]
  .filter((f) => !fs.existsSync(path.join(REPO_ROOT, f)));
if (fantomes.length) {
  console.error(
    `scripts/langues.js déclare ${fantomes.length} page(s) qui n'existent pas :`);
  for (const f of fantomes) console.error(`   ${f}`);
  console.error(
    "\nUn hreflang vers une page absente est une affirmation fausse."
    + " Écrire la page, ou retirer son entrée du groupe.");
  process.exit(1);
}

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
    console.error(`${ecarts.length} page(s) ne correspondent pas à leur source (includes/, scripts/langues.js) :`);
    for (const e of ecarts) console.error(`   ${e}`);
    console.error("\nRelancer : node scripts/build-header.js");
    process.exit(1);
  }
  console.log(`En-tête et alternates conformes à leur source sur les ${parcourir(REPO_ROOT).length} pages du périmètre.`);
} else {
  console.log(`${touchees} page(s) mises à jour sur ${parcourir(REPO_ROOT).length} du périmètre.`);
}
