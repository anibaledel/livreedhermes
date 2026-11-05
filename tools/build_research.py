#!/usr/bin/env python3
"""build_research.py — engendre la page « État des travaux » depuis research/status.json.

Source unique : research/status.json. Ce script (Python 3, bibliothèque
standard seule) écrit :

  research/index.html   la page /research/, en HTML statique (aucun JavaScript
                        nécessaire à l'affichage), anglais puis français, avec
                        un bloc JSON-LD schema.org construit du même JSON ;
  llms.txt              la zone @research (entre marqueurs) : le reste du
                        fichier, écrit à la main ou engendré par d'autres
                        scripts, n'est pas touché ;
  sitemap.xml           rien — voir scripts/generate-sitemap.js, qui lit
                        `updated` dans research/status.json pour le lastmod.

Usage :  python3 tools/build_research.py

Les zones de research/index.html que remplit scripts/build-header.js
(@head-icons, @header, @navtiles, @footer, @analytics) sont recopiées telles quelles d'un
passage à l'autre : relancer ce script après `node scripts/build-header.js`
ne les efface pas, et une seconde exécution ne change aucun fichier.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATUS = ROOT / "research" / "status.json"
PAGE = ROOT / "research" / "index.html"
LLMS = ROOT / "llms.txt"
SITE = "https://anibal-amiot.com"
PAGE_URL = f"{SITE}/research/"
PERSON_ID = f"{SITE}/a-propos.html#anibal-amiot"  # le même @id que les autres pages du site

# Zones remplies par scripts/build-header.js, à conserver d'un passage à l'autre.
ZONES = ("head-icons", "header", "navtiles", "footer", "analytics")

TYPES = {
    # type JSON : (libellé EN, libellé FR, @type schema.org)
    "book": ("Book", "Livre", "Book"),
    "article": ("Article", "Article", "ScholarlyArticle"),
    "preprint": ("Preprint", "Prépublication", "ScholarlyArticle"),
    "software": ("Software", "Logiciel", "SoftwareSourceCode"),
    "dataset": ("Dataset", "Données", "Dataset"),
    "report": ("Report", "Compte rendu", "Report"),
}

TEXTES = {
    "en": {
        "lang": "en",
        "h2": "Research — current state",
        "intro": 'This page is the reference state of the author\'s work. Cite the "all versions" DOI; '
                 "the latest version DOI identifies the files described here. "
                 'Machine-readable copy: <a href="/research/status.json">/research/status.json</a>.',
        "updated": "Last updated",
        "author": "Author",
        "cols": ["Title", "Type", "Current version", "Status", "DOI (all versions)", "Version DOI", "Date"],
        "in_progress": "deposit in progress",
        "conventions": "Conventions",
        "method": "A word on method",
        "licence": "Licence",
        "detail": 'Detailed presentation of the deposits: <a href="../en/works/">Research deposits</a>.',
    },
    "fr": {
        "lang": "fr",
        "h2": "Travaux — état actuel",
        "intro": "Cette page donne l'état de référence des travaux de l'auteur. Citer le DOI « toutes versions » ; "
                 "le DOI de la dernière version identifie les fichiers décrits ici. "
                 'Copie lisible par machine : <a href="/research/status.json">/research/status.json</a>.',
        "updated": "Dernière mise à jour",
        "author": "Auteur",
        "cols": ["Titre", "Type", "Version courante", "Statut", "DOI (toutes versions)", "DOI de la version", "Date"],
        "in_progress": "en cours de dépôt",
        "conventions": "Conventions",
        "method": "Un mot sur la méthode",
        "licence": "Licence",
        "detail": 'Présentation détaillée des dépôts : <a href="../travaux.html">Travaux</a>.',
    },
}

CSS = """
  *{box-sizing:border-box;}
  html{ overflow-x:hidden; }
  body{ margin:0; background:var(--bg); color:var(--white); min-height:100vh; overflow-x:hidden; }
  .wrap{ max-width:1120px; margin:0 auto; padding:32px 24px 64px; }
  .rs-top{ text-align:center; margin:0 0 28px; padding-bottom:20px; border-bottom:1px solid var(--line); }
  .rs-top h1{ font-weight:400; font-size:calc(26px + var(--fs-bump)); letter-spacing:.04em; margin:8px 0 12px; }
  .rs-top p{ color:var(--dim); margin:4px 0; font-size:calc(13px + var(--fs-bump)); }
  .rs-top a, .rs-sec a{ color:var(--gold); }
  .rs-sec{ margin:0 0 56px; }
  .rs-sec h2{ font-weight:400; font-size:calc(20px + var(--fs-bump)); letter-spacing:.04em; margin:0 0 14px; }
  .rs-sec h3{ font-weight:400; font-size:calc(13px + var(--fs-bump)); letter-spacing:.14em; text-transform:uppercase; color:var(--gold); margin:30px 0 10px; }
  .rs-usage{ max-width:72ch; color:var(--dim); font-size:calc(14px + var(--fs-bump)); line-height:1.7; margin:0 0 8px; }
  .rs-meta{ color:var(--dim); font-size:calc(12px + var(--fs-bump)); margin:0 0 6px; }
  .rs-sec table{ width:100%; border-collapse:collapse; font-size:calc(12px + var(--fs-bump)); }
  .rs-sec th{ text-align:left; font-weight:400; color:var(--dim); border-bottom:1px solid var(--line-strong); padding:8px 10px 8px 0; vertical-align:bottom; }
  .rs-sec td{ border-bottom:1px solid var(--line); padding:10px 10px 10px 0; vertical-align:top; line-height:1.5; }
  .rs-title{ color:var(--white); }
  .rs-summary{ display:block; color:var(--dim); font-size:calc(11px + var(--fs-bump)); margin-top:4px; line-height:1.55; }
  .rs-sec td a, .rs-sec td time{ white-space:nowrap; }
  .rs-sec ul{ max-width:78ch; padding-left:20px; color:var(--dim); line-height:1.7; font-size:calc(13px + var(--fs-bump)); }
  .rs-sec li{ margin:0 0 8px; }
  .rs-sec p.rs-method{ max-width:78ch; color:var(--dim); line-height:1.7; font-size:calc(13px + var(--fs-bump)); }
  /* sous 600 px de large, le tableau devient une liste */
  @media (max-width:600px){
    .wrap{ padding:24px 16px 48px; }
    .rs-sec table, .rs-sec tbody, .rs-sec tr, .rs-sec td{ display:block; width:100%; }
    .rs-sec thead{ position:absolute; left:-9999px; }
    .rs-sec tr{ border:1px solid var(--line); border-radius:6px; padding:10px 12px; margin:0 0 12px; }
    .rs-sec td{ border:0; padding:4px 0; display:flex; gap:10px; }
    .rs-sec td a{ white-space:normal; word-break:break-all; }
    .rs-sec td::before{ content:attr(data-label); flex:0 0 38%; color:var(--dim); }
    .rs-sec td.rs-cell-title{ display:block; padding-bottom:8px; }
    .rs-sec td.rs-cell-title::before{ content:none; }
  }
"""


def esc(s):
    return html.escape(s, quote=True)


def doi_link(doi):
    if not doi:
        return "—"
    return f'<a href="https://doi.org/{esc(doi)}" rel="noopener">{esc(doi)}</a>'


def load():
    data = json.loads(STATUS.read_text(encoding="utf-8"))
    for w in data["works"]:
        if w["type"] not in TYPES:
            sys.exit(f"build_research.py : type inconnu « {w['type']} » ({w['id']})")
    return data


def groups(data):
    """Les groupes dans l'ordre de première apparition."""
    out = {}
    for w in data["works"]:
        out.setdefault(w["group"], []).append(w)
    return out


def version_doi_cell(w, t):
    if w.get("version_doi"):
        return doi_link(w["version_doi"])
    if w.get("pending"):
        return f'<span class="rs-pending">{t["in_progress"]}</span>'
    return "—"


def section(data, code):
    t = TEXTES[code]
    i = 0 if code == "en" else 1
    a = data["author"]
    status_key = f"status_{code}"
    p = [f'<section class="rs-sec" lang="{t["lang"]}" id="{code}" aria-labelledby="h-{code}">']
    p.append(f'  <h2 id="h-{code}">{esc(t["h2"])}</h2>')
    p.append(f'  <p class="rs-usage">{t["intro"]}</p>')
    p.append(f'  <p class="rs-meta">{t["detail"]}</p>')
    p.append(f'  <p class="rs-meta">{esc(t["updated"])} : <time datetime="{esc(data["updated"])}">{esc(data["updated"])}</time></p>')
    p.append(f'  <p class="rs-meta">{esc(t["author"])} : {esc(a["name"])} · '
             f'<a href="https://orcid.org/{esc(a["orcid"])}" rel="noopener">ORCID {esc(a["orcid"])}</a> · '
             f'<a href="https://www.wikidata.org/wiki/{esc(a["wikidata"])}" rel="noopener">Wikidata {esc(a["wikidata"])}</a></p>')
    for g, works in groups(data).items():
        p.append(f"  <h3>{esc(g)}</h3>")
        p.append("  <table>")
        p.append("    <thead><tr>" + "".join(f'<th scope="col">{esc(c)}</th>' for c in t["cols"]) + "</tr></thead>")
        p.append("    <tbody>")
        for w in works:
            cells = [
                ("rs-cell-title", t["cols"][0],
                 f'<span class="rs-title">{esc(w["title"])}</span>'
                 f'<span class="rs-summary" lang="{code}">{esc(w["summary_" + code])}</span>'),
                ("", t["cols"][1], esc(TYPES[w["type"]][i])),
                ("", t["cols"][2], esc(w["version"])),
                ("", t["cols"][3], esc(w[status_key])),
                ("", t["cols"][4], doi_link(w.get("doi"))),
                ("", t["cols"][5], version_doi_cell(w, t)),
                ("", t["cols"][6], f'<time datetime="{esc(w["date"])}">{esc(w["date"])}</time>'),
            ]
            tds = "".join(
                f'<td{f" class={chr(34)}{c}{chr(34)}" if c else ""} data-label="{esc(lab)}">{val}</td>'
                for c, lab, val in cells)
            p.append(f'      <tr id="{code}-{esc(w["id"])}">{tds}</tr>')
        p.append("    </tbody>")
        p.append("  </table>")
    p.append(f'  <h3>{esc(t["conventions"])}</h3>')
    p.append("  <ul>")
    for c in data["conventions"]:
        p.append(f"    <li>{esc(c[code])}</li>")
    p.append("  </ul>")
    p.append(f'  <h3>{esc(t["method"])}</h3>')
    p.append(f'  <p class="rs-method">{esc(data["ai_use"][code])}</p>')
    p.append("</section>")
    return "\n".join(p)


def jsonld(data):
    a = data["author"]
    orcid_url = f"https://orcid.org/{a['orcid']}"
    person = {
        "@type": "Person",
        "@id": PERSON_ID,
        "name": a["name"],
        "url": a["url"],
        "sameAs": [orcid_url, f"https://www.wikidata.org/wiki/{a['wikidata']}"],
        "identifier": orcid_url,
    }
    items = []
    for n, w in enumerate(data["works"], 1):
        el = {
            "@type": TYPES[w["type"]][2],
            "@id": f"{PAGE_URL}#{w['id']}",
            "name": w["title"],
            "author": {"@id": PERSON_ID},
            "version": w["version"],
            "dateModified": w["date"],
            "creativeWorkStatus": w["status_en"],
            "url": f"https://doi.org/{w['doi']}" if w.get("doi") else f"{PAGE_URL}#en-{w['id']}",
        }
        if w.get("doi"):
            el["identifier"] = f"https://doi.org/{w['doi']}"
        if w.get("license"):
            el["license"] = w["license"]
        items.append({"@type": "ListItem", "position": n, "item": el})
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            person,
            {
                "@type": "ItemList",
                "@id": f"{PAGE_URL}#works",
                "name": "Research — current state / Travaux — état actuel",
                "dateModified": data["updated"],
                "numberOfItems": len(items),
                "itemListElement": items,
            },
        ],
    }
    text = json.dumps(graph, ensure_ascii=False, indent=2).replace("</", "<\\/")
    json.loads(text)  # le bloc doit se relire
    return text


def existing_zones():
    """Les zones engendrées par build-header.js, lues dans la page déjà écrite."""
    zones = {}
    if PAGE.exists():
        old = PAGE.read_text(encoding="utf-8")
        for z in ZONES:
            m = re.search(rf"<!-- @{z}:start[\s\S]*?<!-- @{z}:end -->", old)
            if m:
                zones[z] = m.group(0)
    return zones


def page(data):
    z = existing_zones()

    def zone(name):
        return z.get(name, f"<!-- @{name}:start -->\n<!-- @{name}:end -->")

    title = "Research — current state / Travaux — état actuel | Anibal Amiot"
    desc = ("Reference state of the work of Anibal Edelberto Amiot: every paper, deposit and dataset with its current "
            "version, status and DOIs. État de référence des travaux : versions, statuts et DOI.")
    head = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{PAGE_URL}">
<link rel="alternate" type="application/json" href="/research/status.json">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{SITE}/assets/og_image_anibal_amiot.png">
<meta property="og:url" content="{PAGE_URL}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{SITE}/assets/og_image_anibal_amiot.png">
<style>{CSS}</style>
<link rel="stylesheet" href="../assets/fonts/barlow-semi-condensed/barlow-semi-condensed.css">
<link rel="stylesheet" href="../style.css">
<link rel="stylesheet" href="../assets/fonts.css">
<link rel="stylesheet" href="../assets/breadcrumb.css">
<script type="application/ld+json">
{jsonld(data)}
</script>
{zone("head-icons")}
</head>
<body>
<div class="wrap">
{zone("header")}
<!-- @main:start -->
<main id="contenu">
  <header class="rs-top">
    <nav class="breadcrumb" aria-label="Breadcrumb / Fil d'Ariane">
      <a href="../en/">Home / Accueil</a><span class="sep">/</span><span aria-current="page">Research / Travaux</span>
    </nav>
    <h1>Research — current state<br><span lang="fr">Travaux — état actuel</span></h1>
    <p>{esc(data["author"]["name"])} · <time datetime="{esc(data["updated"])}">{esc(data["updated"])}</time></p>
    <p><a href="#en">English</a> · <a href="#fr" hreflang="fr" lang="fr">Français</a> · <a href="/research/status.json" type="application/json">status.json</a></p>
  </header>
{section(data, "en")}
{section(data, "fr")}
</main>
<!-- @main:end -->
</div>
{zone("navtiles")}
{zone("footer")}
{zone("analytics")}
</body>
</html>
"""
    return head


def llms_block(data):
    L = []
    L.append("<!-- @research:start — engendré depuis research/status.json (tools/build_research.py) -->")
    L.append("## Research state")
    L.append("")
    L.append(f"- [Research — current state]({PAGE_URL}): every paper and deposit with current version, status and DOIs")
    L.append(f"- [status.json]({SITE}/research/status.json): same content as JSON (updated {data['updated']})")
    L.append("")
    L.append("## Works")
    L.append("")
    for w in data["works"]:
        name = f"[{w['title']}](https://doi.org/{w['doi']})" if w.get("doi") else w["title"]
        L.append(f"- {name}: {w['version']}, {w['status_en']}")
    L.append("")
    L.append("## Conventions")
    L.append("")
    for c in data["conventions"]:
        L.append(f"- {c['en']}")
    L.append("<!-- @research:end -->")
    return "\n".join(L)


def write_if_changed(path, text):
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return False
    path.write_text(text, encoding="utf-8")
    return True


def main():
    data = load()
    changed = []
    if write_if_changed(PAGE, page(data)):
        changed.append(str(PAGE.relative_to(ROOT)))
    s = LLMS.read_text(encoding="utf-8")
    block = llms_block(data)
    rx = re.compile(r"<!-- @research:start[\s\S]*?<!-- @research:end -->")
    if rx.search(s):
        s2 = rx.sub(lambda m: block, s)
    else:
        # première fois : juste après la zone des dépôts
        marque = "<!-- @travaux:end -->"
        if marque not in s:
            sys.exit("build_research.py : llms.txt n'a ni zone @research ni zone @travaux")
        s2 = s.replace(marque, marque + "\n\n" + block, 1)
    if write_if_changed(LLMS, s2):
        changed.append("llms.txt")

    # contrôles : le HTML porte en texte brut chaque titre, chaque DOI non nul, chaque statut
    out = PAGE.read_text(encoding="utf-8")
    for w in data["works"]:
        for needle in (w["title"], w["status_en"], w["status_fr"]) + ((w["doi"],) if w.get("doi") else ()) + \
                      ((w["version_doi"],) if w.get("version_doi") else ()):
            if html.escape(needle, quote=True) not in out:
                sys.exit(f"build_research.py : « {needle} » absent de {PAGE}")
    m = re.search(r'<script type="application/ld\+json">\n([\s\S]*?)\n</script>', out)
    ld = json.loads(m.group(1).replace("<\\/", "</"))
    for el in ld["@graph"][1]["itemListElement"]:
        ident = el["item"].get("identifier")
        if ident and not ident.startswith("https://doi.org/"):
            sys.exit("build_research.py : identifier JSON-LD qui n'est pas une URL doi.org")
    print("écrit : " + ", ".join(changed) if changed else "rien à changer")


if __name__ == "__main__":
    main()
