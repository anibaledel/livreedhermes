# Notes de version pour la fiche Zenodo : half-shift-cube v4

**À déposer par Anibal, sur son compte : rien n'a été déposé ni modifié sur Zenodo depuis ce dépôt.** Le paquet est `docs/zenodo/half-shift-cube-v4.zip` ; ce texte est un brouillon des notes de version.

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
