# One Object, Three Descriptions — v8 (1.2.0) (deposit archive)

Paper: `one-object.pdf` / `one-object.md`.

Every number in the paper is printed by a script:

| script | prints |
|---|---|
| `verif_images_axes.py` | Theorem 1 (60/60), tint relations |
| `espace_F2_4.py` | Proposition 1 (rank 4 / 5), the linear form ε, 8 / 7 |
| `demi_decalage.py` | Corollary of §3 (half-shift, 15 families) |
| `codes_cles.py` | Theorem 2 (72 keys, rank 70/43, [1152,13] d=288, [144,12] d=36, 8 191 / 8 192; ranks 5 + 8 on C8, 5 + 7 on C1) |
| `harmonie_N.py` | Theorem 3 (N = 2..48) |
| `make_figures.py` | fig1–fig6 (SVG) |

Shared module: `common.py`. Inputs: `catalogue-axes.json` (the sixteen
families, same file as in doi:10.5281/zenodo.22965032) and
`referent_360_v3.json` (the sixty images, from doi:10.5281/zenodo.22862110).

    python3 verif_images_axes.py && python3 espace_F2_4.py && python3 demi_decalage.py && python3 codes_cles.py && python3 harmonie_N.py

Companion notes: [A] and [P], doi:10.5281/zenodo.22965031 (all versions). Progress
report: doi:10.5281/zenodo.22945021 (concept). Book: doi:10.5281/zenodo.22722486.

Text, figures and data: CC BY 4.0. Code: AGPL v3.
