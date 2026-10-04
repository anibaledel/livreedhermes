#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
#
# livre_html.py — les chapitres du livre en HTML : pour chaque page du livre,
# dans l'ordre, la planche (book-viewer/pages/<langue>/<code>.webp) avec sa
# légende, puis le texte de cette page tel que le PDF le porte
# (tools/livre_texte.py). Rien d'autre : pas de résumé, pas de liaison
# rédigée, pas de traduction.
#
# Sources :
#   - le texte : le PDF de la langue (book-viewer/la-livree-d-hermes-…-<l>.pdf) ;
#   - le découpage, les titres, les descriptions et les légendes :
#     data/livre/chapitres.json (découpage validé par Anibal ; titres,
#     descriptions et légendes proposés, à relire dans
#     docs/livre-html-relecture-<langue>.md, que ce script écrit aussi).
#
# Le texte d'une page est rendu paragraphe par paragraphe, sans un caractère
# ajouté ni retiré : les étiquettes des figures (« Ordre 3 », « 1 ») et les
# intertitres en capitales changent de style, pas de texte. Le contrôle
# tools/check_livre_texte.py vérifie que le texte de chaque page HTML est
# celui du PDF, page par page, dans l'ordre.
#
# En-tête, pied et tuiles du site : posés par scripts/build-header.js entre
# les marqueurs, comme pour toute page de contenu.
#
# Usage : python3 tools/livre_html.py <langue>            écrit les pages
#         python3 tools/livre_html.py <langue> --verifie  n'écrit rien, liste les écarts
import html, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import livre_texte as LT

ROOT = LT.ROOT
SITE = 'https://anibal-amiot.com'
DOI_LIVRE = '10.5281/zenodo.22722485'

T = {
    'fr': {
        'chapitre': 'Chapitre', 'livre': "La Livrée d'Hermès", 'accueil': 'Accueil',
        'edition': 'Édition française', 'ariane': "Fil d'Ariane", 'evitement': 'Aller au contenu',
        'place': 'Pages {du} à {au} du livre · chapitre {n} sur 7',
        'prec': '← Chapitre précédent', 'suiv': 'Chapitre suivant →',
        'lire': 'Lire ces pages dans le lecteur →', 'pdf': 'Télécharger le PDF (FR)',
        'complet': 'Le livre complet', 'ouvrir': 'Ouvrir la page {code} dans le lecteur',
        'texte': 'Texte de la page {code}', 'nav': 'Chapitres',
        'licence': "© Anibal Edelberto Amiot. CC BY-NC 4.0",
        'sommaire': 'Pages du chapitre',
        'chapitres': 'Lire par chapitre', 'pages': 'pages {du} à {au}', 'page_livre': 'fr/livre/index.html',
    },
}


def esc(s):
    return html.escape(s, quote=True)


def donnees():
    return json.load(open(os.path.join(ROOT, 'data/livre/chapitres.json'), encoding='utf-8'))


def plage(codes, du, au):
    return codes[codes.index(du):codes.index(au) + 1]


def classe(p):
    """style d'un paragraphe — jamais son texte"""
    lettres = re.sub(r'[^A-Za-zÀ-ÿŒœ]', '', p)
    if not lettres and len(p) <= 120:
        return 'tp-etiquette'  # les nombres d'une grille, d'une figure
    if len(p) <= 3 or (len(p) <= 24 and not p.rstrip().endswith('.') and (len(p.split()) <= 3 or not lettres)):
        if len(lettres) >= 4 and lettres.upper() == lettres and len(p.split()) <= 3:
            return 'tp-capitales'
        return 'tp-etiquette'
    if lettres and lettres.upper() == lettres and len(p) <= 90:
        return 'tp-capitales'
    return None


def rendre_texte(paras, langue):
    """les paragraphes de la page ; les étiquettes consécutives sur une ligne"""
    out, etiquettes = [], []

    def vider():
        if etiquettes:
            out.append('<p class="tp-etiquettes">' + ' '.join(f'<span>{esc(e)}</span>' for e in etiquettes) + '</p>')
            etiquettes.clear()
    for p in paras:
        c = classe(p)
        if c == 'tp-etiquette':
            etiquettes.append(p)
            continue
        vider()
        out.append(f'<p class="{c}">{esc(p)}</p>' if c else f'<p>{esc(p)}</p>')
    vider()
    return '\n'.join(out)


STYLE = '''<style>
  *{box-sizing:border-box;}
  html{ overflow-x:hidden; }
  body{ margin:0; background:var(--bg); color:var(--white); min-height:100vh; overflow-x:hidden; }
  img, canvas, svg{ max-width:100%; }
  .wrap{ max-width:1120px; margin:0 auto; padding:32px 24px 64px; }
  .chapitre-tete{ text-align:center; margin:0 auto 28px; max-width:72ch; }
  .chapitre-titre{ font-size:26px; font-weight:400; margin:0 0 12px; }
  .chapitre-place{ color:var(--dim); font-size:12.5px; letter-spacing:.06em; text-transform:uppercase; margin:0 0 14px; }
  .chapitre-description{ color:var(--dim); font-size:15px; line-height:1.7; margin:0 0 18px; }
  .chapitre-nav{ display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin:0 0 6px; }
  .chapitre-nav a, .chapitre-acces a{
    border:1px solid var(--line-strong); color:var(--white); text-decoration:none;
    font-size:12px; letter-spacing:.06em; text-transform:uppercase; padding:11px 16px; display:inline-block;
    transition:border-color .12s ease, color .12s ease; }
  .chapitre-nav a:hover, .chapitre-acces a:hover{ border-color:var(--gold); color:var(--gold); }
  .chapitre-acces{ display:flex; flex-wrap:wrap; justify-content:center; gap:12px; margin:36px 0 10px; }
  .chapitre-acces a.primaire{ border-color:var(--red); color:var(--red); }
  .sommaire-pages{ font-size:12px; color:var(--dim); text-align:center; margin:0 auto 34px; max-width:90ch; line-height:2; }
  .sommaire-pages a{ color:var(--gold); text-decoration:none; margin:0 4px; white-space:nowrap; }
  .sommaire-pages a:hover{ text-decoration:underline; }
  .page-livre{ margin:0 0 56px; scroll-margin-top:16px; }
  .page-livre figure{ margin:0 0 18px; }
  .page-livre figure img{ display:block; width:100%; height:auto; border:1px solid var(--line); background:#efeae0; }
  .page-livre figcaption{ color:var(--dim); font-size:13px; line-height:1.6; margin-top:8px; display:flex; gap:12px; justify-content:space-between; align-items:baseline; flex-wrap:wrap; }
  .page-livre figcaption a{ color:var(--gold); white-space:nowrap; text-decoration:underline; text-decoration-color:rgba(201,161,90,.45); text-underline-offset:3px; }
  .texte-page{ max-width:68ch; margin:0 auto; font-size:15.5px; line-height:1.75; overflow-wrap:anywhere; }
  .texte-page p{ margin:0 0 .9em; }
  .texte-page .tp-capitales{ letter-spacing:.08em; font-size:13.5px; color:var(--gold); margin-top:1.2em; }
  .texte-page .tp-etiquettes{ font-size:12px; color:var(--dim); display:flex; flex-wrap:wrap; gap:4px 14px; }
  .pdf-licence{ font-size:12px; color:var(--dim); text-align:center; }
  .pdf-licence a{ color:var(--gold); }
  @media (max-width:768px){ .wrap{ padding:20px 16px 48px; } .chapitre-titre{ font-size:22px; } .texte-page{ font-size:15px; } }
  @media (max-width:480px){ .chapitre-titre{ font-size:20px; } }
</style>'''


def page(langue, ch, chapitres, codes, legendes, textes, n_pdf):
    t = T[langue]
    m = ch[langue]
    pre = '../' * m['chemin'].count('/')
    url = f"{SITE}/{m['chemin']}"
    titre = f"{t['chapitre']} {ch['romain']} — {m['titre']}"
    titre_doc = f"{titre} — {t['livre']}"
    pages = plage(codes, ch['du'], ch['au'])
    i0 = codes.index(ch['du'])
    pdf = f"la-livree-d-hermes-anibal-amiot-{langue}.pdf"
    page_pdf = LT.rang_pdf(langue, i0, n_pdf) + 1
    lecteur = f"{SITE}/book-viewer/index.html?read={langue}&page={ch['du']}"
    publies = [c for c in chapitres if c.get(langue)]
    k = publies.index(ch)
    prec = publies[k - 1] if k > 0 else None
    suiv = publies[k + 1] if k + 1 < len(publies) else None
    livre_url = f"{SITE}/{'fr/livre/' if langue == 'fr' else 'en/book/'}"

    ld_chapitre = {
        '@context': 'https://schema.org', '@type': 'Chapter',
        'name': titre, 'description': m['description'], 'inLanguage': langue, 'url': url,
        'position': ch['n'], 'pagination': f"{ch['du']}–{ch['au']}",
        'author': {'@id': f'{SITE}/a-propos.html#anibal-amiot'},
        'isPartOf': {'@type': 'Book', '@id': f'{SITE}/a-propos.html#la-livree-dhermes', 'name': t['livre'], 'url': livre_url},
        'license': 'https://creativecommons.org/licenses/by-nc/4.0/',
        'isAccessibleForFree': True,
    }
    ld_ariane = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': t['accueil'], 'item': f'{SITE}/'},
            {'@type': 'ListItem', 'position': 2, 'name': t['livre'], 'item': f'{SITE}/la-livree-d-hermes.html'},
            {'@type': 'ListItem', 'position': 3, 'name': t['edition'], 'item': livre_url},
            {'@type': 'ListItem', 'position': 4, 'name': titre, 'item': url},
        ]}

    nav = []
    if prec:
        nav.append(f'<a href="{SITE}/{prec[langue]["chemin"]}" rel="prev">{esc(t["prec"])}</a>')
    nav.append(f'<a href="{livre_url}">{esc(t["complet"])}</a>')
    if suiv:
        nav.append(f'<a href="{SITE}/{suiv[langue]["chemin"]}" rel="next">{esc(t["suiv"])}</a>')

    sections = []
    for j, code in enumerate(pages):
        leg = legendes.get(code, '')
        lien = f"{SITE}/book-viewer/index.html?read={langue}&amp;page={code}"
        charge = 'eager' if j == 0 else 'lazy'
        sections.append(
            f'<section class="page-livre" id="p{code}" data-code="{code}" aria-label="{esc(t["texte"].format(code=code))}">\n'
            f'<figure>\n'
            f'<img src="{pre}book-viewer/pages/{langue}/{code}.webp" width="1920" height="1080" alt="{esc(leg)}" loading="{charge}" decoding="async">\n'
            f'<figcaption><span class="legende">{esc(leg)}</span><a href="{lien}">{esc(t["ouvrir"].format(code=code))}</a></figcaption>\n'
            f'</figure>\n'
            f'<div class="texte-page" lang="{langue}">\n{rendre_texte(textes[code], langue)}\n</div>\n'
            f'</section>')
    sommaire = ' '.join(f'<a href="#p{c}">{c}</a>' for c in pages)

    desc = esc(m['description'])
    return f'''<!DOCTYPE html>
<html lang="{langue}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- engendré par tools/livre_html.py depuis le PDF et data/livre/chapitres.json — ne pas éditer ici -->
<title>{esc(titre_doc)}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{esc(titre_doc)}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{SITE}/book-viewer/pages/{langue}/{ch['du']}.webp">
<meta property="og:url" content="{url}">
<meta property="og:type" content="book">
<link rel="canonical" href="{url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(titre_doc)}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{SITE}/book-viewer/pages/{langue}/{ch['du']}.webp">
<script type="application/ld+json">
{json.dumps(ld_chapitre, ensure_ascii=False, indent=2)}
</script>
<script type="application/ld+json">
{json.dumps(ld_ariane, ensure_ascii=False, indent=2)}
</script>
{STYLE}
<link rel="stylesheet" href="{pre}assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css">
<link rel="stylesheet" href="{pre}style.css">
<link rel="stylesheet" href="{pre}assets/fonts.css">
<link rel="stylesheet" href="{pre}assets/breadcrumb.css">
<link rel="stylesheet" href="{pre}assets/atalanta-bg.css">
<!-- @head-icons:start -->
<!-- @head-icons:end -->
<!-- @hreflang:start -->
<!-- @hreflang:end -->
</head>
<body>
<div class="wrap">
<!-- @header:start -->
<!-- @header:end -->
<!-- @main:start -->
<main id="contenu">
<header class="chapitre-tete">
<div class="atalanta-block" style="padding:28px 24px;">
<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
<span class="corner2 tl2"></span><span class="corner2 tr2"></span><span class="corner2 bl2"></span><span class="corner2 br2"></span>
<nav class="breadcrumb" aria-label="{esc(t['ariane'])}">
<a href="{SITE}/">{esc(t['accueil'])}</a><span class="sep">/</span><a href="{SITE}/la-livree-d-hermes.html">{esc(t['livre'])}</a><span class="sep">/</span><a href="{livre_url}">{esc(t['edition'])}</a><span class="sep">/</span><span aria-current="page">{esc(titre)}</span>
</nav>
<h1 class="chapitre-titre">{esc(titre)}</h1>
</div>
<p class="chapitre-place">{esc(t['place'].format(du=ch['du'], au=ch['au'], n=ch['n']))}</p>
<p class="chapitre-description">{desc}</p>
<nav class="chapitre-nav" aria-label="{esc(t['nav'])}">{''.join(nav)}</nav>
</header>
<nav class="sommaire-pages" aria-label="{esc(t['sommaire'])}">{sommaire}</nav>
{chr(10).join(sections)}
<div class="chapitre-acces">
<a class="primaire" href="{lecteur}">{esc(t['lire'])}</a>
<a href="{SITE}/book-viewer/{pdf}#page={page_pdf}" download>{esc(t['pdf'])}</a>
</div>
<nav class="chapitre-nav" aria-label="{esc(t['nav'])}">{''.join(nav)}</nav>
<p class="pdf-licence">{esc(t['licence'])} — <a href="https://creativecommons.org/licenses/by-nc/4.0/" rel="license noopener" target="_blank">creativecommons.org/licenses/by-nc/4.0</a> · <a href="https://doi.org/{DOI_LIVRE}" rel="noopener" target="_blank">DOI {DOI_LIVRE}</a></p>
</main>
<!-- @main:end -->
<!-- @footer:start -->
<!-- @footer:end -->
</div>
<!-- @analytics:start -->
<!-- @analytics:end -->
</body>
</html>
'''


def rendre_tout(langue):
    """{chemin du fichier: contenu} pour les chapitres publiés dans la langue"""
    d = donnees()
    codes = LT.codes()
    import pymupdf
    n_pdf = len(pymupdf.open(LT.pdf(langue)))
    textes = LT.texte_livre(langue)
    out = {}
    for ch in d['chapitres']:
        if not ch.get(langue):
            continue
        out[ch[langue]['chemin'] + 'index.html'] = page(langue, ch, d['chapitres'], codes, d['legendes'][langue], textes, n_pdf)
    return out


def zone_chapitres(langue):
    """la liste des chapitres publiés, sur la page du livre de la langue"""
    t, d = T[langue], donnees()
    items = ''.join(
        f'\n        <li><a href="{SITE}/{ch[langue]["chemin"]}"><span>{esc(t["chapitre"])} {ch["romain"]} — {esc(ch[langue]["titre"])}</span>'
        f'<span class="pages">{esc(t["pages"].format(du=ch["du"], au=ch["au"]))}</span></a></li>'
        for ch in d['chapitres'] if ch.get(langue))
    return (f'<!-- @chapitres:start — engendré par tools/livre_html.py, ne pas éditer ici -->\n'
            f'    <nav class="book-chapitres" aria-labelledby="titre-chapitres">\n'
            f'      <h2 id="titre-chapitres">{esc(t["chapitres"])}</h2>\n      <ol>{items}\n      </ol>\n    </nav>\n'
            f'    <!-- @chapitres:end -->')


def relecture(langue):
    """docs/livre-html-relecture.md : ce qu'Anibal relit avant publication"""
    d = donnees()
    codes = LT.codes()
    leg = d['legendes'][langue]
    dec = LT.cesures(langue)
    t = T[langue]
    L = ['# Le livre en HTML — à relire (' + langue + ')', '',
         '> Écrit par `tools/livre_html.py` depuis `data/livre/chapitres.json` : corriger dans ce fichier de '
         'données, puis relancer `python3 tools/livre_html.py ' + langue + '`. Les titres reprennent les '
         'intertitres du livre ; les descriptions et les légendes sont des **propositions**, tirées du texte '
         'de chaque page. Une légende vide signifie que la page ne porte pas de texte dont la tirer. '
         'La légende visible est aussi le texte de remplacement (alt) de la planche.', '',
         '## Chapitres', '']
    for ch in d['chapitres']:
        m = ch.get(langue)
        if not m:
            L += [f"### {t['chapitre']} {ch['romain']} — pages {ch['du']} à {ch['au']}", '', '*Pas encore publié.*', '']
            continue
        L += [f"### {t['chapitre']} {ch['romain']} — {m['titre']}", '',
              f"- adresse : {SITE}/{m['chemin']}",
              f"- pages : {ch['du']} à {ch['au']} ({len(plage(codes, ch['du'], ch['au']))} pages)",
              f"- titre de la page : {t['chapitre']} {ch['romain']} — {m['titre']} — {t['livre']}",
              f"- description (meta, Open Graph, JSON-LD `Chapter`, et visible en tête du chapitre) : {m['description']}",
              f"- JSON-LD : `Chapter`, position {ch['n']}, pagination {ch['du']}–{ch['au']}, partie du `Book` "
              f"« {t['livre']} », licence CC BY-NC 4.0 ; plus le fil d'Ariane (`BreadcrumbList`).", '',
              '| page | légende proposée |', '|---|---|']
        for c in plage(codes, ch['du'], ch['au']):
            L.append(f"| {c} | {leg.get(c) or '*(vide : aucun texte sur la page)*'} |")
        L.append('')
    L += ['## Ce que l\'extraction a relevé', '']
    L += [f'- {x}' for x in d.get('signalements', {}).get(langue, [])]
    L += ['', f'## Césures de fin de ligne ({len(dec)})', '',
          'Un mot coupé en fin de ligne du PDF est recollé ; aucune n\'est gardée. '
          'Pour garder un trait d\'union, mettre `"garde": true` dans `data/livre/cesures-' + langue + '.json`.', '']
    L.append(', '.join(f"{k.split('|')[0]} {k.split('|')[1]}{k.split('|')[2]}" + (' (gardée)' if v.get('garde') else '')
                       for k, v in dec.items()))
    L.append('')
    return '\n'.join(L)


def adopter(existant, neuf):
    """garder ce que scripts/build-header.js a posé entre les marqueurs"""
    for m in re.finditer(r'<!-- @([a-z-]+):start[^>]*-->.*?<!-- @\1:end -->', existant, re.S):
        nom = m.group(1)
        if nom == 'main':
            continue
        neuf = re.sub(rf'<!-- @{nom}:start[^>]*-->.*?<!-- @{nom}:end -->', lambda _: m.group(0), neuf, flags=re.S)
    return neuf


if __name__ == '__main__':
    langue = sys.argv[1]
    verifie = '--verifie' in sys.argv
    ecarts = []
    sorties = rendre_tout(langue)
    sorties[f'docs/livre-html-relecture-{langue}.md'] = relecture(langue)
    f_livre = os.path.join(ROOT, T[langue]['page_livre'])
    livre = open(f_livre, encoding='utf-8').read()
    sorties[T[langue]['page_livre']] = re.sub(r'<!-- @chapitres:start.*?<!-- @chapitres:end -->',
                                              lambda _: zone_chapitres(langue), livre, flags=re.S)
    for rel, contenu in sorties.items():
        f = os.path.join(ROOT, rel)
        avant = open(f, encoding='utf-8').read() if os.path.exists(f) else ''
        apres = adopter(avant, contenu) if avant and '/chapitre-' in rel else contenu
        if apres != avant:
            ecarts.append(rel)
            if not verifie:
                os.makedirs(os.path.dirname(f), exist_ok=True)
                open(f, 'w', encoding='utf-8').write(apres)
    if verifie and ecarts:
        print(f'{len(ecarts)} chapitre(s) ne correspondent pas à leur source (PDF, data/livre/chapitres.json) :', file=sys.stderr)
        for e in ecarts:
            print(f'   {e}', file=sys.stderr)
        print('\nRelancer : python3 tools/livre_html.py ' + langue + ' && node scripts/build-header.js', file=sys.stderr)
        sys.exit(1)
    print(f"{langue} : {len(sorties) if verifie else len(ecarts)} fichier(s) {'à jour' if verifie else 'écrit(s)'} (chapitres et docs/livre-html-relecture-{langue}.md)")
