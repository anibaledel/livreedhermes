# half-shift-cube-v3 — l'archive de la version 3 du demi-décalage

Archive `half-shift-cube-scripts-v3.zip` envoyée par Anibal le 8 octobre 2026 : la
version 3 de l'enregistrement Zenodo **23214317** (dépôt `10.5281/zenodo.22862110`,
toutes versions), « all twelve files, in the layout the scripts expect » (voir
`CHANGES.md`). Elle est versée **telle quelle**, sans un octet changé : ses 25
empreintes se relisent avec `sha256sum -c SHA256SUMS.txt` depuis ce dossier.

Ce dossier n'est pas une copie de `tools/` : deux scripts de l'archive portent le
nom d'un script du dépôt sans être le même fichier (`cube_croisements.py`, la
Section 7 de la note, n'est pas le `tools/cube_croisements.py` du dépôt ;
`cube_edges.py`, `croix_ansee.py` et `make_figures.py` en sont des versions
antérieures). Ils se lancent depuis `tools/` **de ce dossier**, à côté de son
`data/`.

`data/resultats-etablis.json` cite `logs/croisements.log` et
`logs/cube_croisements.log` pour quatre résultats (1770 / 113 280, 16 768 / 9 824,
1292 orbites, 2064 admissibles). Leurs lignes sont dans ces journaux, à la lettre.

**Relancé le 8 octobre 2026**, dans une copie de travail de ce dossier, depuis son
`tools/`, sur un conteneur de session Claude Code (Intel Xeon @ 2,80 GHz, 4
processeurs) : `croisements.py` redonne `logs/croisements.log` ligne pour ligne, à la
seule durée près (`durée : 14 s` ici, 15 s dans le journal) ; `cube_croisements.py`
redonne `logs/cube_croisements.log` à l'octet.

**Ce qui reste à faire.** Zenodo est refusé aux sessions de travail : les MD5 que la
fiche 23214317 déclare n'ont pas pu être relus, et cette fiche n'est pas dans
`data/zenodo/depots.json`. Les quatre résultats restent donc « relevés » ; ils
passent à « vérifiés sur journal déposé » quand l'instantané de la fiche est versé
et que ses MD5 sont ceux des fichiers de ce dossier.
