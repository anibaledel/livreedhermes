#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / Commercial license on request: anibaledel@gmail.com
"""indexnow.py — prévient Bing, Yandex, Naver, Seznam et Yep des pages nouvelles,
modifiées ou supprimées (protocole IndexNow, https://www.indexnow.org/).

Python 3, bibliothèque standard seule. Un seul envoi à api.indexnow.org est
partagé entre tous les moteurs participants. Aucun compte, jeton ni secret : la
clé est un fichier public à la racine du site, <clé>.txt, dont le contenu est la
clé elle-même (32 caractères hexadécimaux).

Usage
    python3 tools/indexnow.py --all                  toutes les adresses de sitemap.xml
    python3 tools/indexnow.py --since <commit>       les pages touchées depuis ce commit
    ajouter --dry-run pour afficher la liste sans rien envoyer

Fichier -> adresse
    index.html            -> le dossier (research/index.html -> /research/)
    autre .html           -> son nom
    llms.txt, sitemap.xml, research/status.json -> inclus s'ils changent
    includes/, scripts/, tools/, archive/, .github/, pagefind/ : jamais ; ni ce
    que robots.txt interdit à « * », ni une page « noindex ».
    Une page supprimée est envoyée aussi : le moteur voit la 404 et la retire.
"""
import argparse
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
HOST = "anibal-amiot.com"
SITE = f"https://{HOST}"
ENDPOINT = "https://api.indexnow.org/indexnow"
LOT = 10000
FIXES = {"llms.txt", "sitemap.xml", "research/status.json"}
JAMAIS = ("includes/", "scripts/", "tools/", "archive/", ".github/", "pagefind/", "node_modules/")


def cle():
    trouvees = [p for p in ROOT.glob("*.txt")
                if re.fullmatch(r"[0-9a-f]{32}", p.stem) and p.read_text(encoding="utf-8") == p.stem]
    if len(trouvees) != 1:
        sys.exit(f"indexnow.py : {len(trouvees)} fichier(s) de clé valide(s) à la racine (1 attendu)")
    return trouvees[0].stem


def interdits():
    """Les préfixes que robots.txt interdit au groupe « * »."""
    p = ROOT / "robots.txt"
    out, dans = [], False
    if p.exists():
        for ligne in p.read_text(encoding="utf-8").splitlines():
            ligne = ligne.split("#")[0].strip()
            if ligne.lower().startswith("user-agent:"):
                dans = ligne.split(":", 1)[1].strip() == "*"
            elif dans and ligne.lower().startswith("disallow:"):
                v = ligne.split(":", 1)[1].strip()
                if v:
                    out.append(v)
    return out


def url_de(rel):
    if rel == "index.html":
        chemin = ""
    elif rel.endswith("/index.html"):
        chemin = rel[: -len("index.html")]
    else:
        chemin = rel
    return f"{SITE}/{quote(chemin, safe='/')}"


def noindex(rel):
    p = ROOT / rel
    if not p.exists() or p.suffix != ".html":
        return False
    tete = p.read_text(encoding="utf-8", errors="replace")[:4000]
    return re.search(r'<meta[^>]+name=["\']robots["\'][^>]*noindex', tete, re.I) is not None


def adresses_sitemap():
    xml = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    return re.findall(r"<loc>([^<]+)</loc>", xml)


def adresses_depuis(commit):
    sortie = subprocess.run(["git", "-c", "core.quotepath=false", "diff", "--name-status", "--no-renames", commit, "HEAD"],
                            cwd=ROOT, capture_output=True, text=True)
    if sortie.returncode != 0:
        sys.exit(f"indexnow.py : git diff {commit} HEAD a échoué : {sortie.stderr.strip()}")
    urls = []
    for ligne in sortie.stdout.splitlines():
        statut, _, rel = ligne.partition("\t")
        rel = rel.strip().strip('"')
        if not rel or rel.startswith(JAMAIS):
            continue
        if not (rel.endswith(".html") or rel in FIXES):
            continue
        if statut != "D" and noindex(rel):
            continue
        urls.append(url_de(rel))
    return urls


def filtrer(urls):
    refus = interdits()
    vues, out = set(), []
    for u in urls:
        chemin = "/" + u[len(SITE) + 1:] if u.startswith(SITE + "/") else None
        if chemin is None:
            continue  # hors du site : IndexNow le refuserait
        if any(chemin.startswith(r) for r in refus):
            continue
        if u not in vues:
            vues.add(u)
            out.append(u)
    return sorted(out)


def envoyer(urls, k):
    for i in range(0, len(urls), LOT):
        lot = urls[i:i + LOT]
        corps = json.dumps({"host": HOST, "key": k, "keyLocation": f"{SITE}/{k}.txt", "urlList": lot}).encode("utf-8")
        req = urllib.request.Request(ENDPOINT, data=corps, method="POST",
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                code, texte = r.status, r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            code, texte = e.code, e.read().decode("utf-8", "replace")
        except urllib.error.URLError as e:
            sys.exit(f"indexnow.py : envoi impossible : {e.reason}")
        if code in (200, 202):
            print(f"IndexNow : {len(lot)} adresse(s) envoyée(s), réponse {code}")
        else:
            print(f"IndexNow : réponse {code} — {texte}", file=sys.stderr)
            sys.exit(1)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--all", action="store_true", help="toutes les adresses de sitemap.xml")
    g.add_argument("--since", metavar="COMMIT", help="pages touchées depuis ce commit")
    ap.add_argument("--dry-run", action="store_true", help="affiche la liste sans envoyer")
    a = ap.parse_args()

    k = cle()
    urls = filtrer(adresses_sitemap() if a.all else adresses_depuis(a.since))
    if a.dry_run:
        print("\n".join(urls))
        print(f"# {len(urls)} adresse(s) — rien envoyé", file=sys.stderr)
        return
    if not urls:
        print("IndexNow : aucune adresse à envoyer")
        return
    envoyer(urls, k)


if __name__ == "__main__":
    main()
