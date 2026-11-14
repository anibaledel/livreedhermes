#!/usr/bin/env node
/* © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com

   build-outils-support-langues.js — les pages « Outils » et « Soutenir » (soutien) en anglais, espagnol et thaï, et la carte « Voir sa musique »
   des pages « Outils » des huit langues (prompt 185, L2).

   - en/tools/, es/herramientas/, th/tools/ et en/support/, es/apoyar/, th/support/ : écrites depuis les pages chinoises déjà faites (zh/tools/, zh/support/),
     qui servent de squelette (mêmes classes, mêmes données structurées) ; les textes de la page française font foi (outils.html, soutenir.html). Les cartes
     reprennent les libellés des tuiles de navigation (scripts/nav-tiles.js, scripts/nav-tiles-libelles.js) et visent la page de la langue quand elle
     existe (groupes « outil-… » de scripts/langues.js), sinon la page française, annoncée comme telle. L'en-tête, le pied, les hreflang et la rangée
     « Autres langues » sont posés ensuite par scripts/build-header.js.
   - zh/tools/, ru/tools/, pt/tools/, hi/tools/ : la carte « Voir sa musique », vers la page de la langue, ajoutée si elle manque ; en/es/th l'ont déjà
     en sortie de ce script.
   Traductions faites par IA, à relire (TODO-RELECTURE.md). Usage : node scripts/build-outils-support-langues.js [--verifie] */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), SITE = 'https://anibal-amiot.com', verifie = process.argv.includes('--verifie');
const { LANGUES } = require('./langues.js'), { TUILES } = require('./nav-tiles.js'), LIB = require('./nav-tiles-libelles.js');
const lire = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lib = (id, l) => { const t = TUILES.find((x) => x.id === id); return (t && t[l]) || (LIB.TUILES_I18N[id] && LIB.TUILES_I18N[id][l]) || (t && t.fr); };

// ---- les cartes de la page française (outils.html) : adresse, icône, identifiant de tuile ----
const FR = lire('outils.html'), cartes = [...FR.matchAll(/<a class="article-card" href="([^"]+)"[^>]*>\s*<img class="article-cover" src="([^"]+)"[^>]*?(\sloading="lazy")?>/g)].map((m) => ({ href: m[1], icone: m[2].split('/').pop(), lazy: !!m[3] }));
for (const c of cartes) { const t = TUILES.find((x) => x.href === c.href); if (!t) throw new Error(`outils.html : la carte ${c.href} n'a pas de tuile`); c.id = t.id; }

const L = JSON.parse(lire('data/outils-langues/outils-support.json')).langues; // les textes : data/outils-langues/outils-support.json
const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const hreflang = (l) => LANGUES[l].hreflang || l;
const carteHtml = (c, l, cible, pageFr, note) => `      <a class="article-card" href="${cible}"${pageFr ? ' hreflang="fr"' : ''}>\n        <img class="article-cover" src="../../assets/nav-icons/${c.icone}" alt="" width="128" height="128"${c.lazy ? ' loading="lazy"' : ''}>\n        <div class="article-card-body">\n          <h2>${esc(lib(c.id, l).label)}</h2>\n          <p class="article-excerpt">${esc(lib(c.id, l).excerpt)}${note ? ` ${esc(note)}` : ''}</p>\n        </div>\n      </a>\n`;
const { traiter } = require('./build-header.js');
const ecrire = (f, s, sorties) => { s = traiter(f, s); const abs = path.join(ROOT, f); const avant = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null; if (avant !== s) sorties.push(f); if (!verifie && avant !== s) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, s); } };
const modifiees = [];

for (const l of ['en', 'es', 'th']) {
  const d = L[l], H = hreflang(l);
  // ---- Outils ----
  let s = lire('zh/tools/index.html'); const t = d.outils;
  const accueilZh = '<a href="https://anibal-amiot.com/zh/">首页</a>';
  const rem = [
    ['<html lang="zh-Hans">', `<html lang="${H}">`], ['aria-label="面包屑导航"', `aria-label="${d.ariaFil}"`], [accueilZh, `<a href="${SITE}/${l}/">${esc(d.home)}</a>`], [`>工具</span>`, `>${esc(t.titre)}</span>`], ['<h1>工具</h1>', `<h1>${esc(t.titre)}</h1>`],
    ["<p>La Livrée d'Hermès 的交互式工具：创作、可视化、打印、加密。各工具的界面目前只有法文。</p>", `<p>${esc(t.intro)}</p>`],
    ["工具——La Livrée d'Hermès", `${t.titre} — La Livrée d'Hermès`], ["La Livrée d'Hermès 的交互式工具：创作、可视化、打印、加密。工具界面为法文。", t.desc],
    ['"name": "首页"', `"name": "${d.home}"`], ['"name": "工具"', `"name": "${t.titre}"`], ['"inLanguage": "zh-Hans"', `"inLanguage": "${H}"`], ['content="zh_CN"', `content="${d.ogLocale}"`],
  ];
  s = s.split(`${SITE}/zh/tools/`).join(`${SITE}/${d.dossierOutils}`);
  for (const [a, b] of rem) { if (!s.includes(a)) throw new Error(`zh/tools : « ${a.slice(0, 50)} » introuvable`); s = s.split(a).join(b); }
  // la grille de cartes : celles de la page française, dans l'ordre
  const grille = cartes.map((c) => { const nom = `outil-${c.href.replace(/\.html$/, '')}`, p = c.id === 'galerie-animations' ? LANGUES[l].pages['galerie-animations'] : LANGUES[l].pages[nom]; return p ? carteHtml(c, l, `${SITE}/${p}`, false, null) : carteHtml(c, l, `${SITE}/${c.href}`, true, d.note); }).join('');
  const i0 = s.indexOf('<div class="article-grid">'), i1 = s.indexOf('</div>\n  </div>\n</main>');
  if (i0 < 0 || i1 < 0) throw new Error('zh/tools : grille introuvable');
  s = s.slice(0, i0) + '<div class="article-grid">\n' + grille + '    ' + s.slice(i1);
  // les données structurées : une entrée par carte
  s = s.replace(/(\s*\{ "@type": "WebApplication", "name": "[^\n]*\n)+/, (m) => '\n' + cartes.map((c, k) => { const nom = `outil-${c.href.replace(/\.html$/, '')}`, p = c.id === 'galerie-animations' ? LANGUES[l].pages['galerie-animations'] : LANGUES[l].pages[nom]; return `        { "@type": "WebApplication", "name": ${JSON.stringify(lib(c.id, l).label)}, "inLanguage": "${p ? H : 'fr'}", "url": "${SITE}/${p || c.href}" }${k < cartes.length - 1 ? ',' : ''}`; }).join('\n') + '\n');
  ecrire(`${d.dossierOutils}index.html`, s, modifiees);
  // ---- Soutenir ----
  s = lire('zh/support/index.html'); const u = d.soutien;
  const rem2 = [
    ['<html lang="zh-Hans">', `<html lang="${H}">`], ['aria-label="面包屑导航"', `aria-label="${d.ariaFil}"`], [accueilZh, `<a href="${SITE}/${l}/">${esc(d.home)}</a>`], ['<span aria-current="page">支持</span>', `<span aria-current="page">${esc(u.titre)}</span>`], ['<h1 class="pro-title">支持</h1>', `<h1 class="pro-title">${esc(u.titre)}</h1>`],
    ['<p class="pro-intro">一切都是开放的。论著、图案以及各工具生成的文件均可无条件下载，采用 CC BY-NC 4.0 许可。您的支持金额自定，用于资助项目的后续发展：新的图案、新的工具，以及纺织方面的工作。</p>', `<p class="pro-intro">${esc(u.intro)}</p>`],
    ['>前往法文页面付款<', `>${esc(u.cta)}<`], ['<p class="pro-note">付款由 Stripe 安全处理。金额自定，捐助自愿。付款页面为法文。</p>', `<p class="pro-note">${esc(u.nota)}</p>`], ['<h2>您的支持用于什么</h2>', `<h2>${esc(u.h2)}</h2>`], ['<b>研究、开发与翻译的时间</b>', `<b>${esc(u.b)}</b>`],
    ['<p>图案与网站工具的构建，以及它们的说明文档：目前有法文、英文、西班牙文和泰文版本，中文版与俄文版正在翻译中。</p>', `<p>${esc(u.p)}</p>`],
    ["支持——La Livrée d'Hermès", `${u.titre} — La Livrée d'Hermès`], ["以自定金额支持 La Livrée d'Hermès：金额由您决定。网站及其全部内容仍然完全免费。", u.desc],
    ['"name": "首页"', `"name": "${d.home}"`], ['"name": "支持"', `"name": "${u.titre}"`], ['"inLanguage": "zh-Hans"', `"inLanguage": "${H}"`], ['content="zh_CN"', `content="${d.ogLocale}"`],
  ];
  s = s.split(`${SITE}/zh/support/`).join(`${SITE}/${d.dossierSoutien}`);
  for (const [a, b] of rem2) { if (!s.includes(a)) throw new Error(`zh/support : « ${a.slice(0, 50)} » introuvable`); s = s.split(a).join(b); }
  ecrire(`${d.dossierSoutien}index.html`, s, modifiees);
}

// ---- la carte « Voir sa musique » des pages Outils de zh, ru, pt, hi (celles d'en, es et th l'ont déjà) ----
const musique = cartes.find((c) => c.id === 'voir-sa-musique');
for (const l of ['zh', 'ru', 'pt', 'hi']) {
  const f = LANGUES[l].pages.outils + 'index.html'; let s = lire(f);
  const cible = `${SITE}/${LANGUES[l].pages['outil-musique-chladni']}`;
  if (!s.includes(`href="${cible}"`)) {
    const apres = '<a class="article-card" href="https://anibal-amiot.com/360-calques.html"'; if (!s.includes(apres)) throw new Error(`${f} : carte de repère introuvable`);
    s = s.replace(`      ${apres}`, carteHtml(musique, l, cible, false, null) + `      ${apres}`);
    s = s.replace(/(\s*\{ "@type": "WebApplication", "name": "[^\n]*"url": "https:\/\/anibal-amiot\.com\/fonds-ecran\.html" \},?)/, (m) => `${m.replace(/\},?$/, '},')}\n        { "@type": "WebApplication", "name": ${JSON.stringify(lib(musique.id, l).label)}, "inLanguage": "${hreflang(l)}", "url": "${cible}" },`.replace(/,$/, ','));
  }
  ecrire(f, s, modifiees);
}
if (verifie) { if (modifiees.length) { console.error(`PÉRIMÉ : ${modifiees.join(', ')}\nRelancer : node scripts/build-outils-support-langues.js`); process.exit(1); } console.log('Pages Outils et Soutenir (en, es, th) et cartes « Voir sa musique » à jour.'); }
else console.log(`${modifiees.length} fichier(s) écrit(s) : ${modifiees.join(', ')}`);
