# Dépôt — Un protocole ponctuel pour les carrés magiques d'ordre pair

**Archive autonome.** Elle contient tout ce que `DEPOT.md` cite : les
vingt-huit scripts de `tools/`, le corpus des 256 étiquetages d'ordre 6
(`data/referent_256_v3.json`), le cache d'énumération de l'ordre 6
(`tools/pavables6.json`), les 34 témoins (`data/temoins.json`) et le papier.
Rien n'est à chercher ailleurs.

## Pour commencer, sans rien installer

```
python -I tools/verifie_temoins.py        # les 34 témoins, sans solveur
python tools/construction.py              # le théorème positif, construit et contrôlé
python tools/identite.py                  # l'identité exacte sur 18 432 + témoins
python tools/compte_figures.py            # la formule des figures candidates
python tools/croix_auto.py --ordre 6      # l'équivalence triple sur les 18 432
python tools/compte_etiquetages.py --ordre 6
python tools/pavage_miroirs.py
```

Ces scripts n'utilisent que la bibliothèque standard. L'autonomie a été testée
en rendant `ortools` indisponible : ils tournent quand même.

## Pour le reste

```
pip install -r requirements.txt           # ortools==9.15.6755
python tools/graine_sat.py --ordre 10
python tools/croix_existence.py --ordres 6,8,10,12
python tools/compte_croix.py --ordre 8 --sans-pretest
python tools/congruences.py --ordres 6,8
```

## Lire d'abord

`DEPOT.md` classe chaque énoncé du papier en six statuts, du démontré au
conjecturé, et dit précisément ce que chaque script établit et ce qu'il
n'établit pas.

**Deux résultats fermés.** Le protocole admet un étiquetage magique à **tout
ordre pair n ≥ 4** — croix ansée canonique à n ≡ 2 (mod 4) avec n ≥ 6, motif classique à
deux classes à n ≡ 0 (mod 4) —, l'ordre 2 étant la seule exception :
`python tools/construction.py --existence` en est l'assertion exécutable. Et
la conjecture de parité est tombée des deux côtés. À n = 2m ≥ 6, une figure
candidate est réalisable si et seulement si m est impair — `parite.py` porte
l'interdiction à m pair, `construction.py` la réalisation à m impair — et le
nombre de FIGURES de croix ansée vaut, pour n = 2m ≥ 6,
exactement 2^(m²−3m+1) si m est impair,
0 sinon — le nombre d'ÉTIQUETAGES qui en portent une est bien plus grand :
8 192 à l'ordre 6, 583 454 127 292 416 à l'ordre 10. Le
papier embarqué est la **rev194**, qui intègre le volet `recollement.py` : la
réduction aux orbites, la table des états, le centre de la grille quotient, le
théorème positif avec sa preuve, et la construction paramétrique.

## Licence

© Anibal Edelberto Amiot 2026 — AGPL v3, licence commerciale sur demande :
anibaledel@gmail.com
