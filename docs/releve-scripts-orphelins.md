# Scripts de tools/ qu'aucun workflow n'appelle — relevé du 2026-10-05

Relevé, pas réparation (consigne « un contrôle cassé ») : chaque script de tools/ absent de .github/workflows/, lancé sans argument sur une copie jetable de main au commit 27d3c127, 2 min au plus (15 min pour les trois plus longs).

116 scripts dans tools/ ; 65 appelés par un workflow ; **51 orphelins**, dont 14 bibliothèques importées par un autre script.

| script | importé | résultat sur main | détail |
|---|---|---|---|
| `_vichy_rasterize.mjs` |  | échec : dépendance absente | sharp attendu dans scripts/node_modules (absent) |
| `bicolore_galerie_comptes.mjs` |  | passe | 11 s |
| `bicolore_galerie_data.mjs` |  | passe | 10 s |
| `calibrate_referent.py` |  | échec : dépendance absente | module Python argon2 absent |
| `cellule_c16.py` | oui | passe | 0 s |
| `cellule_c4.py` | oui | passe | 0 s |
| `check_six_langues.mjs` |  | demande un serveur | un serveur sur localhost:8123 — avec lui : passe (64 destinations en 200) |
| `croix_ansee.py` |  | passe | 0 s |
| `cube_croisements.py` |  | passe | en 610 s |
| `derive_echelles.py` |  | **ÉCHEC** | ImportError : « measure » n'existe plus dans measure_k_pic.py |
| `enum_criteres.py` |  | passe | en 225 s |
| `epingles_echantillon.mjs` |  | passe | 22 s |
| `epingles_mesures.py` |  | demande des arguments | JSON (appelé par epingles_echantillon.mjs) |
| `export_pinterest_fonds.mjs` |  | demande des arguments | <code> |
| `extract_exemples_plate.mjs` |  | demande des arguments | <svg> |
| `extract_origines6.py` | oui | passe | 2 s |
| `familles.py` | oui | demande des arguments | bases |
| `filtre_unified.py` |  | passe | 0 s |
| `generate_bicolore_c16.py` |  | passe | 0 s |
| `generate_bicolore_c4_origines6.py` |  | passe | 2 s |
| `generate_referent_256.py` |  | passe | 0 s |
| `generate_referent_360.py` | oui | passe | 1 s |
| `generate_referent_6x6.py` |  | passe | 3 s |
| `generate_referent_bicolore.py` | oui | passe | 0 s |
| `generate_referent_bicolore_origines.py` |  | demande des arguments | --src --trame --out |
| `generate_referent_vichy.py` |  | échec : dépendance absente | appelle _vichy_rasterize.mjs (sharp absent) |
| `lib_fonds_site.mjs` | oui | passe | 0 s |
| `lib_woff2.mjs` | oui | passe | 0 s |
| `livre_texte.py` | oui | demande des arguments | langue … (plante sans message : IndexError) |
| `make_figures.py` |  | passe | 1 s |
| `make_motifs_index.mjs` |  | passe | 0 s |
| `measure_k_pic.py` | oui | passe | 0 s |
| `pages_webp.py` |  | demande des arguments | langue |
| `paires_croisees.py` | oui | passe | 14 s |
| `planche_fonds.mjs` |  | demande des arguments | <fichier de sortie> (plante sans message) |
| `police_iast.py` |  | passe | 3 s |
| `police_zh.py` |  | demande des arguments | <dossier package> |
| `recalibrate_carter_v3.py` |  | échec : dépendance absente | module Python argon2 absent |
| `registre.mjs` | oui | passe | 0 s |
| `releve_rouges.mjs` |  | passe | 0 s |
| `releve_texte_rouge.mjs` |  | passe | en 290 s |
| `render_bicolore_c16.py` |  | demande des arguments | --src --famille --out |
| `restaurer_collection.mjs` |  | demande des arguments | <code> <dossier> |
| `selection_ordre6.py` | oui | passe | 0 s |
| `tous_croisements.py` |  | passe | 28 s |
| `validate_referent.py` |  | passe | 0 s |
| `verif_axes.py` |  | passe | 5 s |
| `verif_carre_magique.py` | oui | passe | 1 s |
| `verif_protocole.py` |  | passe | 0 s |
| `verify_cymatique_plate_modes.mjs` |  | **ÉCHEC** | « systemesList is not iterable » — réparé dans ce lot |
| `verify_generateur_v2_doublement.mjs` |  | passe | 0 s |

Bilan : **2 échecs de code** (dont 1 réparé ici), 4 échecs par dépendance absente de l'environnement, 11 qui demandent des arguments, 1 qui demande un serveur, 33 qui passent.

Rien n'est réparé dans ce relevé, sauf verify_cymatique_plate_modes.mjs (l'objet du lot).
