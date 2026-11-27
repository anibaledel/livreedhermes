# Notes de version pour la fiche Zenodo : half-shift-cube v4

**DÉPOSÉ le 27 novembre 2026** (règle levée par Anibal pour ce dépôt, jeton fourni par lui) : version `v4.0`, DOI de la version `10.5281/zenodo.24594128`, DOI toutes versions `10.5281/zenodo.22862110`. Fichiers : `half-shift-cube-v4.zip` et `README.md`. Les anciens fichiers de la 2.20 (`README.md`, `unified-patterns-v2.20.zip`) ne sont pas dans cette version : ils restent dans la version 2.20 (`10.5281/zenodo.23991050`). Ce texte est celui des notes de version.

## Texte proposé (anglais, pour le champ « Description » ou « Version notes »)

**Version 4 — the complete set, with the scripts added since version 3.** This version is complete by itself: a Zenodo version does not inherit the files of the previous one, so every file is in this archive. Keep the layout when extracting (a `data/` directory beside `tools/`); run the scripts from `tools/`.

Unchanged from version 3 (byte for byte): seven scripts (`croisements.py`, `croix_ansee.py`, `cube_croisements.py`, `make_figures.py`, `paires_croisees.py`, `selection_ordre6.py`, `verif_carre_magique.py`) and the three data files.

Changed: `cube_edges.py`, option `--rotations-only`. Each face is now framed seen from the outside, so that the restriction to rotations means: every face receives a rotation of the grid as seen from outside, never its mirror image (a panel that can be turned but not turned over). Version 3 rotated the faces in arbitrary frames, some seen from outside and some from inside, and the result it gave (two families) depended on that choice. With oriented frames the answer is the same as with the full dihedral group: four families, 256 grids, 128 classes modulo the half-shift.

Added: `rotations_orientees.py` (the same question recomputed independently from the geometry of the cube), `classes_translations.py` (the 512 grids modulo the half-shift and modulo all 144 translations), `make_patron.py`, `make_exemple.py`, `make_pavage.py` and `make_broderie.py` (figures: the net of the cube with lettered seams, the six cards of two layers, the grid on a full repeat, a stitch chart), the output of every script in `logs/`, the figures in `fig/` and `realisation/`, and `SHA256SUMS.txt`.

Requirements: Python 3.13 (3.11 for version 3), no third-party package except `reportlab` for the four scripts that write PDF figures. All scripts exit without error; the logs of the unchanged scripts are identical to those of version 3 apart from running times. `sha256sum -c SHA256SUMS.txt` checks the archive.

## Avant de déposer (à ta main)

1. Vérifier que le `CHANGES.md` du paquet te convient (il est en anglais, comme celui de la v3).
2. Mettre le DOI de la v4 dans la version **signée** du manuscrit (jamais dans l'anonymisée) et dans la réponse à l'éditrice si tu veux le citer.
3. Les licences : les scripts gardent les en-têtes du dépôt (AGPL v3, licence commerciale sur demande) ; reprendre la ligne de licence de la fiche v3.
4. Si le manuscrit bouge encore, attendre : une v4 qui ne correspond plus au texte oblige à une v5.

## La structure actuelle du dépôt (d'après `data/zenodo/`) : à décider avant de déposer

Le DOI toutes versions est `10.5281/zenodo.22862110`. Sa dernière version (`10.5281/zenodo.23991050`, label « 2.20 », 5 novembre 2026) ne contient que deux fichiers : `README.md` et `unified-patterns-v2.20.zip` (181 Mo), qui est l'article compagnon « From Ansate Cross Colourings to Unified Patterns and Sound Forms » avec ses annexes, et garde les scripts du demi-décalage dans le dossier `half-shift-cube-v3/` de ce zip. La version précédente des scripts seuls est `10.5281/zenodo.23214317` (V.3.2).

Comme une version n'hérite jamais des fichiers de la précédente, il y a deux façons de publier la v4 :
1. **Nouvelle version = scripts v4 seuls** (`half-shift-cube-v4.zip` + son `README.md`) : l'article compagnon reste accessible dans la version 2.20, mais la dernière version de la fiche ne le contient plus. Le texte de la fiche doit alors le dire et renvoyer au DOI de la 2.20.
2. **Nouvelle version = tout** : remplacer `half-shift-cube-v3/` par `half-shift-cube-v4/` dans `unified-patterns-v2.20.zip` (je n'ai pas ce zip, il n'est pas dans le dépôt) et redéposer l'ensemble avec `README.md`.

Le paquet `half-shift-cube-v4.zip` convient aux deux : son dossier `half-shift-cube-v4/` est autonome et porte son propre `README.md`.

## DOI toutes versions utilisés dans la version signée du manuscrit

- Données et scripts de la note : `10.5281/zenodo.22862110`
- Les 360 plaques (chapitre VIII) : `10.5281/zenodo.23189275`
- Le traité « La Livrée d'Hermès » : `10.5281/zenodo.22722485`
