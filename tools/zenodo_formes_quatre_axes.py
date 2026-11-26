#!/usr/bin/env python3
# © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
# AGPL v3 / licence commerciale sur demande : voir LICENSE
"""
zenodo_formes_quatre_axes.py — prépare le zip « la famille des 288 formes à quatre axes » (docs/zenodo/formes-quatre-axes-288-v1.0.zip), à déposer sur Zenodo PAR ANIBAL (rien ne se dépose depuis ce dépôt).

Contenu : LISEZMOI.md, data/ (les 288 formes, les 3 552 couples de couches à quatre axes, un CSV), svg/ (une cellule par forme), planches/ (trois planches PNG), repro/ (les scripts qui recalculent tout, avec leurs
imports relatifs), SHA256SUMS.txt. L'archive est déterministe (ordre fixe, dates fixes) : la relancer donne le même fichier.
  python3 tools/zenodo_formes_quatre_axes.py
"""
import csv
import hashlib
import io
import json
import os
import subprocess
import zipfile

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SORTIE = os.path.join(RACINE, 'docs', 'zenodo', 'formes-quatre-axes-288-v1.0.zip')
COULEUR = {'V': '#662d91', 'M': '#ee2a7b', 'O': '#fbb040'}
REPRO = ['tools/check_note_v6.py', 'tools/corpus_miroir.py', 'tools/formes_quatre_axes.py', 'tools/formes_quatre_axes_lecture.mjs', 'tools/corpus_256.mjs', 'assets/lecture-binaire.js']
PLANCHES = ['quatre-axes-288-formes.png', 'quatre-axes-par-socle.png', 'corpus-64-formes-miroir.png']


def lire(rel):
    return open(os.path.join(RACINE, rel), 'rb').read()


def svg(forme):
    rects = ''.join(f'<rect x="{c}" y="{r}" width="1.02" height="1.02" fill="{COULEUR[x]}"/>' for r, ligne in enumerate(forme['tricolore']) for c, x in enumerate(ligne))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="240" height="240" shape-rendering="crispEdges"><title>{forme["id"]}</title>{rects}</svg>\n'


def lisezmoi(doc, commit):
    n = doc['nombres']
    return f"""# Les 288 formes à quatre axes de miroir — La Livrée d'Hermès, version 1.0

**Auteur** : Anibal Edelberto Amiot — créé en collaboration avec Claude. **Licence** : données et images CC BY-NC 4.0 ; scripts AGPL v3 (licence commerciale sur demande).
**Dépôts liés** : corpus tricolore de 256 grilles, DOI 10.5281/zenodo.24396534 ; jeu complet des 360 plaques, 10.5281/zenodo.23189276 ; jeu unifié (96 plaques), 10.5281/zenodo.24508469.
**Code et calculs** : https://github.com/anibaledel/livreedhermes (commit {commit}, `docs/article-parallele-unified-patterns.md`).

## Ce que contient ce dépôt
Une famille de **{n['formes']} formes** de pavages 12 × 12 à trois teintes (violet V, magenta M, orange O) qui ont **quatre axes de miroir** (vertical, horizontal et les deux diagonales), un seul motif au pavage
(le décalage de six cases dans chaque direction échange deux teintes), 48 / 48 / 48 cases par teinte, et qui sont **lisibles par la lecture binaire du corpus** (72 sombres / 72 clairs, lecture inversée par le décalage).
- **{n['formes_du_corpus']} formes** sont celles du corpus déjà déposé (celles de ses 64 formes qui ont quatre axes) ;
- **{n['formes_nouvelles']} formes** sont nouvelles : elles se construisent avec des **couches nouvelles**, symétriques autour du centre de la cellule, qui ne font pas partie des 360 plaques du jeu complet.
Chaque forme est donnée par une grille représentante (une forme = une classe à translation torique près).

## Fichiers
- `data/formes-quatre-axes-288.json` : les 288 formes (identifiant `q4-NNN`, indicateur `corpus`, `socle_par_niveau`, `grilles_distinctes_sur_64`, `tricolore` en 12 lignes de lettres V/M/O) et les {n['couples_parfaits']} couples de couches `{{A, B = π∘A}}` qui les engendrent (`couples`).
- `data/formes-quatre-axes-288.csv` : les mêmes formes en tableau.
- `data/couches-quatre-axes.json` : les 3 552 couples de couches à quatre axes dont ces 288 couples sont les parfaits à la lecture binaire.
- `svg/` : une image SVG par forme (une cellule 12 × 12). `planches/` : trois planches (pavage 2 × 2) — les 288 formes, rangées par type de socle, et les 64 formes du corpus.
- `repro/` : les scripts qui recalculent tout (à lancer depuis une copie du dépôt, aux mêmes chemins relatifs ; `data/referent_360_v3.json` et `data/corpus-256.json` sont ceux des dépôts cités).
- `SHA256SUMS.txt` : les empreintes des fichiers.

## Les cinq socles
Le socle d'une grille est l'ensemble de ses 48 cases de la teinte fixe. Seuls cinq socles passent la lecture binaire :
| Type | Cases fixes par niveau 1 à 6 | Formes | Grilles distinctes sur les 64 hexagrammes |
|---|---|---|---|
| corpus | 8, 8, 8, 8, 8, 8 | 32 | 64 (les six traits pèsent le même poids : distance = 16 × distance de Hamming) |
| A | 8, 16, 0, 8, 8, 8 | 64 | 64 (poids inégaux) |
| B | 0, 8, 0, 8, 24, 8 | 64 | 32 (le trait 5 ne change rien) |
| C | 8, 0, 0, 8, 24, 8 | 64 | 32 (le trait 5 ne change rien) |
| D | 24, 0, 0, 8, 8, 8 | 64 | 32 (le trait 1 ne change rien) |

## Limites
- Les 256 formes nouvelles **ne ferment pas le cube** (théorème 3 de la note « demi-décalage ») ; les plaques de leurs couches n'ont pas été étudiées.
- Seules les formes dont les axes passent **entre les cases** sont atteintes avec la carte des six niveaux du système ; 3 200 autres formes parfaites à quatre axes (axes sur le milieu des cases) existent et demandent une autre carte.
- Aucune signification n'est attribuée aux motifs. Le rapport avec les hexagrammes (un hexagramme = un mot de six bits = un choix de couche par niveau) vaut pour le type de socle « corpus » ; pour les autres, deux hexagrammes peuvent donner la même grille ou des poids inégaux.

# English summary
The family of **{n['formes']} three-colour 12 × 12 tilings with four mirror axes**, a single motif (the half-period shift swaps two colours), 48 / 48 / 48 cells per colour, and readable by the corpus binary reading. {n['formes_du_corpus']} are the four-axis forms of the deposited corpus,
{n['formes_nouvelles']} are new and need new layers outside the 360 plates. Files: JSON/CSV data, one SVG per form, three PNG sheets, and the scripts that recompute everything. Licence CC BY-NC 4.0 (data), AGPL v3 (scripts).
"""


def main():
    doc = json.loads(lire('data/formes-quatre-axes-288.json'))
    commit = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=RACINE, capture_output=True, text=True).stdout.strip()
    fichiers = {}
    fichiers['LISEZMOI.md'] = lisezmoi(doc, commit).encode('utf-8')
    fichiers['data/formes-quatre-axes-288.json'] = lire('data/formes-quatre-axes-288.json')
    fichiers['data/couches-quatre-axes.json'] = lire('data/couches-quatre-axes.json')
    tampon = io.StringIO()
    w = csv.writer(tampon, lineterminator='\n')
    w.writerow(['id', 'corpus', 'socle_par_niveau', 'grilles_distinctes_sur_64', 'tricolore'])
    for f in doc['formes']:
        w.writerow([f['id'], 'oui' if f['corpus'] else 'non', ' '.join(map(str, f['socle_par_niveau'])), f['grilles_distinctes_sur_64'], '/'.join(f['tricolore'])])
    fichiers['data/formes-quatre-axes-288.csv'] = tampon.getvalue().encode('utf-8')
    for f in doc['formes']:
        fichiers[f'svg/{f["id"]}.svg'] = svg(f).encode('utf-8')
    for p in PLANCHES:
        fichiers[f'planches/{p}'] = lire(f'docs/captures/{p}')
    for r in REPRO:
        fichiers[f'repro/{r}'] = lire(r)
    sommes = ''.join(f'{hashlib.sha256(c).hexdigest()}  {n}\n' for n, c in sorted(fichiers.items()))
    fichiers['SHA256SUMS.txt'] = sommes.encode('utf-8')
    os.makedirs(os.path.dirname(SORTIE), exist_ok=True)
    with zipfile.ZipFile(SORTIE, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for nom in sorted(fichiers):
            zi = zipfile.ZipInfo(nom, (2026, 11, 26, 0, 0, 0))  # date fixe : l'archive est la même à chaque lancement
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o644 << 16
            z.writestr(zi, fichiers[nom])
    print(f'{os.path.relpath(SORTIE, RACINE)} : {len(fichiers)} fichiers, {os.path.getsize(SORTIE) // 1024} Ko')


if __name__ == '__main__':
    main()
