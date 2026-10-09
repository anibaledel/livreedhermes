# Ce qui est démontré, ce qui est calculé, ce qui est conjecturé

Carte de confiance du dossier. Cette archive est **autonome** : elle contient
les vingt-six scripts, le corpus (`data/referent_256_v3.json`), le cache
d'énumération (`tools/pavables6.json`), les témoins (`data/temoins.json`) et le
papier. Aucun fichier cité ici n'est à chercher ailleurs.

Six statuts, employés au sens strict dans tout le papier et dans les en-têtes
des scripts, du plus fort au plus faible :

1. **démontré** — preuve analytique, vérifiable à la lecture ;
2. **vérifié exhaustivement sans solveur** — énumération complète, Python nu ;
3. **vérifié exhaustivement par solveur** — énumération complète d'une liste
   finie de cas, chacun tranché par CP-SAT ;
4. **établi par solveur, sans certificat indépendant** — une impossibilité
   globale, sans liste finie de cas à produire ;
5. **vérifié sur échantillon** — tirage ou prélèvement réparti, graine fixée ;
6. **conjecturé**.

## Environnement

```
Python 3.11.15
ortools 9.15.6755     (seulement pour les scripts à solveur, listés plus bas)
```

L'autonomie a été testée en masquant `ortools` : les scripts du groupe « sans
solveur » s'importent et tournent avec le module rendu indisponible.

## 1. Démontré

| énoncé | où |
| --- | --- |
| le protocole est ponctuel : chaque case se calcule sans les autres | papier, « Le protocole » |
| la condition de bijection est nécessaire et suffisante pour parcourir 1…*n*² | papier, « La troisième condition » |
| l'inégalité \|*d*·*u*\| ≤ (*n*−1)/2 sur les effectifs de ligne | papier ; `ligne_necessaire.py` en donne les contre-exemples |
| l'identité exacte Σ_{c∈A_r}(2c+1) = n(\|A_r\| − d_r u_r), et sa forme (\*) après élimination exacte des horizontales | `identite.py` |
| l'ensemble des écarts est symétrique : l'échange global B ↔ R, V ↔ J envoie chaque valeur x sur n²+1−x, conserve bijection, condition I et les deux critères, et envoie δ sur −δ ; le minimum est donc l'opposé du maximum | papier ; `ecarts.py` le vérifie |
| **la borne des écarts est démontrée** : les 2n valeurs des blocs r et n−1−r se groupent en n paires complémentaires de différences D(j) = n·\|u\| + (n−1−2j), les paires horizontales n'apportent rien à l'écart puisque h est le même dans les deux lignes appariées, la symétrie centrale appariant le trait porté par P(j) dans la ligne r à celui porté par P(n−1−j) dans la ligne opposée, si bien que chaque couple horizontal retire exactement D(j) + D(n−1−j) = 2n·|u| de la somme totale n²·|u| ; il reste n − 2h paires traversantes, de somme n(n−2h)·|u|, d'où \|δ_r\| ≤ (n/2)(n−2h_r)\|u_r\| ≤ n(n−2)/2 × \|u_r\|, sous bijection + I + II, le critère III n'y intervenant pas | papier |
| l'antisymétrie δ_{n−1−r} = −δ_r des écarts de somme de ligne, **par la condition de bijection seule** — S_r + S_{n−1−r} = somme(bloc r) + somme(bloc n−1−r) = n(n²+1) = 2M — et Σδ_r = 0 paire par paire | papier ; `ecarts.py` l'illustre, il ne la démontre pas |
| **l'obstruction doublement paire est démontrée** : sous bijection + I et la seule clause de II qui veut h_0 impair, δ_0 = n(n−1)·A + W avec |W| ≤ m² < n(n−1) = 4m² − 2m, donc δ_0 = 0 force A = 0 et W = 0, donc un nombre pair de couples traversants de même signe et un nombre pair de couples opposés, donc m − h pair ; le critère II voulant h impair, m = n/2 est impair. **Aucune croix ansée magique à aucun ordre doublement pair** — la preuve n'emploie ni le critère III, ni les colonnes, ni les autres lignes | papier, « Pourquoi n/2 doit être impair » ; `parite.py` contrôle l'identité et ses conséquences sur les 279 616 configurations des ordres 4 à 10 ; `reseau.py --paire0` donne le compte par ordre jusqu'à 26 (journaux dans `data/parite-controle.txt` et `data/paire0.txt`) |
| l'antisymétrie γ_{n−1−c} = −γ_c des écarts de colonne, sous bijection + I : dans chaque orbite de quatre cases les quatre valeurs somment à 2(n²+1), et il y a n/2 paires de lignes, donc C_c + C_{n−1−c} = 2M | papier |
| la magicité sous bijection + I s'écrit exactement δ = 0 **et** γ = 0 — δ = 0 ne suffit pas : un témoin d'ordre 6 a δ = 0, les deux diagonales à 111, et des colonnes à 101 et 121 | papier ; témoin dans `data/temoins.json` |
| la condition I rend les deux diagonales magiques, à tout ordre pair | papier, « La croix ansée est le critère » |
| toute figure satisfaisant la condition I est centralement symétrique | lemme d'orbite ; `croix_ansee_n.py` |
| le nombre de figures candidates vaut 2^((*n*²−6*n*+4)/4) pour *n* ≥ 6, par le rang du système d'incidence de K(m,m) privé d'un couplage parfait | `compte_figures.py` |

## 2. Vérifié exhaustivement, sans solveur

Python nu, aucune dépendance. C'est la partie la plus solide du dossier.

| énoncé | script |
| --- | --- |
| 18 432 étiquetages magiques à l'ordre 6 | `compte_etiquetages.py`, `enum6.py` |
| 8 192 pavent par l'alternance de parité, avec seize motifs chacun | `enum6.py` |
| **les 18 432 × 256 = 4 718 592 couples graine/motif, sans exception** : exactement 8 192 graines ont seize motifs magiques et 10 240 en ont zéro — aucune graine ne pave par un motif exotique sans paver par l'alternance | `exhaustif6.py` (27 s, Python nu ; journal dans `data/exhaustif-18432x256.txt`) |
| condition de colonne ⟺ croix ansée (I+II+III) ⟺ pavable, sur les 18 432, ensemble par ensemble | `croix_auto.py` |
| les comptes de figures candidates aux ordres 6, 8 et 10, retrouvés par force brute | `croix_ansee_n.py` |
| l'identité exacte et la forme (\*) sur les 18 432 et sur les 31 témoins | `identite.py` |
| la méthode de pavage aux ordres 6 à 30, et les 262 144 motifs de miroirs de l'ordre 18 | `pavage_miroirs.py --exhaustif` |
| les trois conditions sur le corpus, le témoin d'indépendance, un contrôle négatif | `protocole_general.py` |
| **la nécessité de la règle des miroirs en assertion**, sur les 256 graines du corpus et les témoins non invariants : 284 graines, aucun pavage magique par un motif non conforme ; et sa portée exacte — une graine invariante par un miroir échappe à la règle, puisque le bit correspondant ne change pas le bloc | `verifie_portee.py`, Python nu, code de sortie 0 ; journal dans `data/portee-assertion.txt` |
| « nécessaire aux ordres ≥ 6 » **serait faux** : des étiquetages magiques invariants par les deux miroirs existent aux ordres 4, 8, 12 et 16, et aucun aux ordres 6, 10 et 14 — ceux des ordres 4 et 8 sont versés comme témoins et relus sans solveur | `verifie_temoins.py` (genre `miroirs_hors_portee`) ; l'existence aux ordres 12 et 16 et l'absence aux ordres 6, 10, 14 sont établies par CP-SAT |
| **δ = 0 est impossible aux ordres 8, 12, 16 et 20**, sans solveur : la décomposition en orbites rend les contraintes de bijection et la condition I locales, et l'élagage par la borne démontrée ferme chaque ordre dès sa première paire de lignes | `reseau.py --fenetre 0` |
| le compte des configurations de la première paire de lignes d'écart nul, ordres 4 à 26, multiplicités comprises : 0, 128, 0, 20 224, 0, 2 840 576, 0, 410 660 864, 0, 62 458 544 128, 0, 10 055 603 453 952 — un zéro à chaque ordre doublement pair, et l'accord exact avec le dénombrement direct de `parite.py` là où les deux se recoupent | `reseau.py --paire0` ; journal dans `data/paire0.txt` |
| l'identité δ_0 = n(n−1)·A + W et ses trois conséquences, sur les 279 616 configurations des ordres 4 à 10 | `parite.py` ; journal dans `data/parite-controle.txt` |
| **la réciproque locale** : à m impair, δ_0 = 0 est réalisable sur la première paire de lignes — une orbite horizontale, et (m−1)/2 orbites traversantes de chaque signe, d'où A = 0 et W = 0 ; construction explicite de la CONFIGURATION LOCALE de la paire (0, n−1) aux ordres 6, 10, 14, 18, 22, 26, 30 et 34 — deux lignes, pas un carré : elle ne contrôle ni les autres lignes, ni le critère III globalement, ni γ, et ne donne donc aucune croix ansée magique | `parite.py` (construction démontrée, les deux lignes émises et contrôlées) |

## 3. Vérifié exhaustivement, par solveur

Liste finie de cas, chacun tranché individuellement.

| énoncé | script |
| --- | --- |
| 2 048 figures candidates sur 2 048 réalisables à l'ordre 10 | `compte_croix.py` |
| les 32 figures candidates de l'ordre 8 sont toutes impossibles, **une à une** | `compte_croix.py --ordre 8 --sans-pretest` |
| 2 figures distinctes à l'ordre 6 et 32 à l'ordre 8, par no-goods, le modèle devenant INFEASIBLE après exclusion | `suite_croix.py` |

Le zéro de l'ordre 8 est donc établi deux fois, par deux chemins : la liste des
32 candidates épuisée une à une (statut 3), et le pré-test global (statut 4,
contrôle redondant).

## 4. Établi par solveur, sans certificat indépendant

Ces résultats sont des impossibilités globales, sans liste finie de cas à
produire. **Ils sont établis par CP-SAT dans l'environnement indiqué, mais ne
disposent pas ici d'un certificat indépendant vérifiable par lecture** : les
revérifier demande de relancer le solveur.

| énoncé | script | temps indicatif |
| --- | --- | --- |
| aucun étiquetage magique à quatre classes à l'ordre 2 | `graine_sat.py --ordre 2` | secondes |
| profils symétriques impossibles à l'ordre 6 hors (12,12,6,6) et (10,10,8,8) | `profils.py --ordre 6` | minutes |
| à l'ordre 8, parmi les équations de magicité, les sommes de lignes suffisent à créer l'obstruction et les sommes de colonnes ne sont pas nécessaires | `localise.py` | minutes |
| le balayage de **tous** les modules de 2 à *n*² à l'ordre 8 : satisfaisable pour *q* ≤ 18 et pour *q* pair jusqu'à 34, impossible pour *q* impair ≥ 19 et pour *q* ≥ 36 ; **plus petit module obstructif 19**, et non 64 = *n*² comme une version antérieure l'annonçait à tort | `congruences.py --ordres 8 --balayage` ; journal dans `data/balayage-modules-ordre8.txt` ; le tableau ci-dessous se refait par `congruences.py --ordres 8 --modules 2,4,8,16,18,19,32,34,36,64,0` | ~20 min pour le balayage, ~1 min pour le tableau |
| le vecteur d'écarts nul : atteignable à l'ordre 10, jamais à l'ordre 8 — désormais démontré à tout ordre doublement pair (section 1), et retrouvé **sans solveur** par décomposition en orbites | `ecarts.py --zero` ; `reseau.py --ordres 8,12,16,20 --fenetre 0` le refait en Python nu | minutes |
| les écarts **ne sont pas tous pairs** : témoin d'écart impair à l'ordre 8, écarts (117, 120, 24, 8, −8, −24, −120, −117) | `ecarts.py --cherche-impair` | minutes |
| l'**atteignabilité** de cette borne : max δ_r = n(n−2)/2 × \|2r−n+1\| aux ordres 6, 8, 10 et 12, sur les dix-huit lignes représentatives (3 + 4 + 5 + 6, une par paire) | `ecarts.py --bornes` | minutes |
| l'atteignabilité de la **borne fine** à h_r imposé : max δ_r = (n/2)(n−2h_r)\|u_r\|, atteinte sur **les neuf lignes des ordres 8 et 10 pour h_r = 1 et h_r = 3**, dix-huit cas, accord exact | `ecarts.py --bornes --h 1,3` ; journal dans `data/bornes-fines.txt` | minutes |
| dans la direction λ·(−2, −1, −1, 0, …) de l'ordre 8, les pas atteignables sont exactement **λ ∈ {28, 30, 32, 34}**, et **λ = 0 ne l'est pas** ; le script tient SAT, INFEASIBLE et NON TRANCHÉ séparés et ne dit « exacte » que si aucun λ n'est non tranché | `ecarts.py --direction` | ~3 min |

## 5. Vérifié sur échantillon

| énoncé | taille |
| --- | --- |
| réalisabilité à l'ordre 14 : **201 figures candidates prélevées régulièrement dans les 2²⁹, 201 réalisables sur 201** | 201 |
| la règle des miroirs aux ordres 24 et 30 | 787 tirages, graine de hasard fixée |
| nécessité de la règle des miroirs hors du corpus | échantillons de 200 |

## 6. Conjecturé

La moitié doublement paire n'est plus une conjecture : c'est le théorème de la
section 1. Il ne reste donc que celle-ci.

**Conjecture restante.** Pour tout ordre singulièrement pair *n* ≥ 6, toute
figure candidate est réalisable par un étiquetage magique à quatre classes.

| état | ordres |
| --- | --- |
| démontré exhaustivement, figure par figure | 6 (2 sur 2), 10 (2 048 sur 2 048) |
| vérifié sur échantillon | 14 : 201 figures sur 2²⁹, toutes réalisables |
| témoin d'existence d'au moins une croix ansée, pas la réalisation de toutes les candidates | 18, 22, 26, 30 |
| rien | au-delà |

L'ordre 34 n'y figure pas : le dépôt en a une graine magique, pas de témoin de
croix ansée.

Si la conjecture tient, le nombre de croix ansées est la formule restreinte aux
ordres *n* = 2*m* avec *m* impair — 2, 2 048, 2²⁹, 2⁵⁵, 2⁸⁹, 2¹³¹, 2¹⁸¹ — et sur
les multiples impairs de six 2, 2⁵⁵, 2¹⁸¹, 2³⁷⁹.

## Une affirmation retirée, et pourquoi

Une version antérieure de ce dossier annonçait que l'obstruction de l'ordre 8
était « une congruence modulo *n*² », au motif que le modèle restait
satisfaisable modulo 2, 4, 8, 16, 32 et devenait impossible modulo 64. C'était
faux deux fois.

D'abord la méthode : la satisfaisabilité modulo *q* **n'est pas monotone en
*q***, donc une poignée de valeurs — et en l'occurrence la seule chaîne des
puissances de deux — ne donne aucun seuil. Ensuite le fait : le balayage
complet montre que le plus petit module obstructif est **19**.

| module | 2 | 4 | 8 | 16 | 18 | **19** | 32 | 34 | **36** | 64 | entier |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ordre 8 | SAT | SAT | SAT | SAT | SAT | **INF** | SAT | SAT | **INF** | INF | INF |

Et ce balayage n'est lui-même qu'un filtre grossier : la question propre n'est
pas un module mais l'ensemble des vecteurs d'écarts atteignables.

Deux explications séduisantes de ce tableau ont été testées et écartées. La
première supposait les écarts pairs et bornés par 34 : les écarts **ne sont pas
tous pairs** (le solveur produit des lignes impaires aux ordres 8 et 10) et la
borne par ligne vaut n(n−2)/2 × |2r−n+1|, soit ±168 en première ligne à l'ordre
8, non ±34. La seconde reposait sur une seule direction du réseau : dans la
direction λ·(−2, −1, −1, 0, …) les pas atteignables sont exactement
λ ∈ {28, 30, 32, 34} — ce qui explique bien la coupure à 34, mais pas les
modules comme 12, qui ne divisent aucun de ces quatre pas et sont pourtant
satisfaisables : d'autres directions y servent.

L'ensemble des vecteurs d'écarts atteignables est donc **épars, multi-directionnel
et borné**, et il ne contient pas le vecteur nul à l'ordre 8. Le caractériser est
le problème ouvert ; le tableau des modules n'en est qu'une projection.

## Les témoins

`data/temoins.json` contient les objets finis qui portent les résultats
**existentiels** positifs et les **contre-exemples** : graines, croix ansées,
contre-exemples à la nécessité de l'égalité de ligne, contre-exemples à
l'implication « condition I ⟹ parité », profils symétriques, et le témoin
d'indépendance de la planche 040 — aux ordres 4, 6, 10, 14, 18, 22 et 26.

```
python -I tools/verifie_temoins.py
```

recalcule chacun depuis les formules du protocole et contrôle l'énoncé qu'il
porte, **sans solveur**. Code de retour 0 si tous passent.

Portée exacte de ce vérificateur, pour qu'il n'y ait pas de malentendu : il rend
les **témoins finis** des résultats positifs contrôlables indépendamment du
solveur. Il ne refait **pas** les dénombrements exhaustifs — ni les 18 432, ni
le partage 8 192 / 10 240, ni le 2 048 sur 2 048, ni les 262 144 motifs de
l'ordre 18. Ceux-là demandent l'exécution des scripts correspondants, qui sont
dans cette archive et qui, pour la plupart, n'ont besoin que d'un Python nu
(statut 2).
