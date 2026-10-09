# Ce qui est démontré, ce qui est calculé, ce qui est conjecturé

Carte de confiance du dossier. Cette archive est **autonome** : elle contient
les vingt-huit scripts, le corpus (`data/referent_256_v3.json`), le cache
d'énumération (`tools/pavables6.json`), les témoins (`data/temoins.json`) et le
papier. Aucun fichier cité ici n'est à chercher ailleurs.

Six statuts, employés au sens strict dans tout le papier et dans les en-têtes
des scripts, du plus fort au plus faible :

1. **démontré** — preuve analytique, vérifiable à la lecture ;
2. **vérifié exhaustivement sans solveur** — énumération complète, Python nu ;
3. **vérifié exhaustivement par solveur** — énumération complète d'une liste
   finie de cas, chacun tranché par CP-SAT ;
4. **obtenu par solveur** — le plus souvent une impossibilité globale, sans
   liste finie de cas à produire ni certificat indépendant ; parfois un
   résultat depuis redevenu redondant avec un théorème, et la section le dit ;
5. **vérifié sur échantillon** — tirage ou prélèvement réparti, graine fixée ;
6. **conjecturé**.

**Chaque journal de `data/` porte en tête la ou les commandes exactes qui le
reproduisent.** Plusieurs scripts ont un jeu d'ordres par défaut plus court que
celui du journal : les ordres doivent être donnés explicitement.

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
| **le nombre de motifs conformes à la règle des miroirs vaut 2^(2m⌈m/2⌉), à tout m** : la contrainte sur h identifie i à m−1−i, ce qui laisse ⌈m/2⌉ orbites de lignes par colonne, soit m⌈m/2⌉ bits libres ; autant pour v. Ce qui reste du calcul est leur coïncidence avec les motifs magiques : exhaustive à l'ordre 12 sur les graines pavables et les motifs, à l'ordre 18 sur l'espace des motifs de deux graines, par échantillon à 24 et 30 | papier, « Quels motifs de miroirs sont valides » |
| **la table des états d'orbite, et la borne des apports qui en découle** : avec C = n²+1, t_r = n−1−2r et s_c = n−1−2c, les états d'une orbite hors diagonale sont (a−C, b−C) = (0, ±n·t_r ou ±s_c) si elle est horizontale, et (±n·t_r ou ±s_c, 0) si elle est verticale ; sur l'orbite diagonale, (±n·t_r, ±t_r) et (±t_r, ±n·t_r), dans chacun des deux types les deux signes sont indépendants, huit états au total. Une horizontale est donc neutre pour la ligne, une verticale neutre pour la colonne, et comme 1 ≤ s_c ≤ n−1 < n·t_r il vient **|a−C| ≤ n·|u_r| et |b−C| ≤ n·|u_r|** pour tout état admissible, avant même δ_r = 0 ou le critère II. **Preuve.** Hors diagonale, la bijection et I ne laissent que deux types. Si l'orbite est horizontale, les deux cases de la ligne r sont complémentaires, donc a = C ; la colonne reçoit alors deux valeurs prises soit dans les blocs r et n−1−r, d'où b − C = ±n(n−1−2r) = ±n·t_r, soit aux indices de colonne opposés, d'où b − C = ±(n−1−2c) = ±s_c. Si elle est verticale, le raisonnement échange les rôles. Sur l'orbite diagonale, la substitution directe des huit états donne (a−C, b−C) ∈ {(±n·t_r, ±t_r), (±t_r, ±n·t_r)}. Enfin 1 ≤ s_c ≤ n−1 < n·t_r puisque t_r ≥ 1. ∎ L'origine de n·|u_r| est donc B(n−1−r, c) − B(r, c) = n(n−1−2r), le saut entre blocs de lignes complémentaires — d'où le même nombre dans la borne des écarts de ligne | `recollement.py --ordres 4,6,8,10,12,14 --table` contrôle la table sur les 139 orbites des ordres 4 à 14 — sans `--ordres` le script ne fait que 6 et 10, soit 34 orbites, zéro écart ; journal dans `data/table-locale.txt` |
| **n ≡ 2 (mod 4) ⟺ la grille quotient des orbites possède un centre.** Soit n = 2m, m impair, q = (m−1)/2. Les centres des quatre quadrants m × m sont (q,q), (q,m+q), (m+q,q), (m+q,m+q) ; comme n−1−q = 2m−1−q = m+q, ces quatre cases forment exactement l'orbite de (q,q), et elles sont toutes diagonales puisque q = q et q + (m+q) = 2m−1 = n−1. Dans la grille quotient m × m c'est la case (q,q), son unique centre, qui existe si et seulement si m est impair | `recollement.py --ordres 4,6,8,10,12,14 --geometrie` le contrôle aux ordres 6, 10 et 14 ; journal dans `data/table-locale.txt` |
| **deux centres distincts** : celui du quotient est en r = q = (m−1)/2 ; les couches mesurées par |u_r| = n−1−2r se resserrent jusqu'à r = m−1, la paire bordant la médiane. Les rayons valent exactement n(n−1), n(n−3), …, n et décroissent de 2n par couche — l'emboîtement est analytique. À l'ordre 10, centre du quotient en r = 2 de rayon 50, couche la plus serrée en r = 4 de rayon 10 | conséquence de la table locale ; `recollement.py --ordres 4,6,8,10,12,14 --geometrie` |
| l'orbite centrale n'est pas la seule orbite entièrement diagonale : toute case (r, r) de la diagonale du quotient en est une. Elle est unique comme **point fixe central** de la symétrie du quotient, pas par son type local | lemme |
| **à ordre singulièrement pair, aucune paire de lignes n'oppose d'obstruction locale.** Pour n = 2m, m impair, et toute paire (r, n−1−r) : prendre sur l'orbite diagonale l'état a − C = +n·t_r, sur une orbite hors diagonale un état vertical a − C = −n·t_r, et toutes les autres horizontales, donc a − C = 0. La somme est nulle et h_r = (m−1) − 1 = m−2, impair puisque m l'est. Plus fort que la réciproque locale de `parite.py`, qui ne construisait que la première paire | `recollement.py --ordres 6,10,14,18 --construit` réalise la construction ; journal dans `data/table-locale.txt` |
| **pour une colonne c ≠ r, C ± n·|u_r| est atteignable**, à tout m impair : on met en outre l'orbite de la colonne c en horizontal avec b_c − C = ±n·t_r, ce qui ne change rien à la ligne | `recollement.py --construit` |
| **pour la colonne diagonale c = r, atteignable dès m ≥ 5** (énoncé rendu secondaire par le théorème positif ci-dessus, qui est plus fort) : b_r − C = ±n·t_r impose a_r − C = ±t_r, qu'on annule par trois verticales de poids −s_i, −s_j, +s_k. Comme s_i + s_j − s_k = n − 1 − 2(i+j−k) = s_{i+j−k}, la condition est exactement i + j − k = r, et l'existence de trois indices distincts ne la résout pas à elle seule : elle est résolue explicitement, pour tout m ≥ 5 impair, par (i,j,k) = (1,2,3) si r = 0, (0,3,2) si r = 1, (0,r+1,1) si 2 ≤ r ≤ m−2, et (m−2,m−3,m−4) si r = m−1. Il reste m−4 horizontales, impair | `recollement.py --construit` |
| **et à m = 3 c'est impossible — le confinement de l'ordre 6 est exact.** Il n'y a que deux orbites hors diagonale, II force une horizontale et une verticale, et la seule verticale n'apporte que ±n·t_r ou ±s_c avec c ≠ r, donc jamais ∓t_r. La diagonale doit prendre a − C = ±n·t_r, et la colonne diagonale ne reçoit que b_r − C = ±t_r — les ±5, ±3, ±1 du journal | `recollement.py --ordres 6 --construit` et `--par-colonne` |
| **le théorème positif : à n = 2m ≥ 6 avec m impair, TOUTE figure candidate est réalisable.** La table locale sépare les deux réglages : une orbite verticale ne touche que sa ligne, une horizontale que sa colonne. On pose sur l'orbite diagonale l'état (a−C, b−C) = (n·t_r, t_r). Dans la ligne quotient r, les m−1 orbites hors diagonale se répartissent entre H et V ; le critère II en veut un nombre impair en H, et m−1 étant pair, le nombre d_r de V est impair lui aussi. On choisit alors les signes σ des d_r verticales avec (d_r−1)/2 fois + et (d_r+1)/2 fois −, d'où Σσ = −1 et δ_r = n·t_r(1 + Σσ) = 0. Symétriquement, dans la colonne quotient c le critère III veut un nombre impair de V, donc un nombre impair e_c de H, et les signes τ donnent Στ = −1 et γ_c = s_c(1 + Στ) = 0. Les états sont admissibles orbite par orbite sous bijection + I, la figure fournit II et III, et I rend les diagonales magiques : le carré est magique et porte exactement la figure demandée. ∎ Le signe opposé s'obtient sans construction nouvelle par l'échange global B ↔ R, V ↔ J. **L'ordre 2 (m = 1) est hors théorème** : les quatre cases sont toutes diagonales, la ligne ne porte donc aucun trait, et le critère II s'applique et ÉCHOUE, 0 n'étant pas impair. **Une figure explicite à tout ordre** : V si c ≡ r+1 (mod m), H ailleurs — une seule V par ligne et par colonne, donc m−2 H par ligne, impair | `construction.py` réalise la recette au lieu de l'affirmer : la figure canonique construite et contrôlée aux ordres 6 à 50 ; **toutes** les figures candidates des ordres 6 (2 sur 2) et 10 (2 048 sur 2 048) ; 20 figures tirées au hasard par ordre. Journal dans `data/construction.txt` ; témoins 32 et 33 dans `data/temoins.json` |
| **la classification est complète pour n = 2m ≥ 6** : une figure candidate est réalisable **si et seulement si** m est impair, par le théorème positif ci-dessus et l'obstruction doublement paire. Le nombre de croix ansées vaut donc exactement **N(n) = 2^(m²−3m+1) si m est impair, 0 si m est pair** — soit 2, 2¹¹, 2²⁹, 2⁵⁵, 2⁸⁹, 2¹³¹, 2¹⁸¹ aux ordres 6, 10, 14, 18, 22, 26, 30, et 2³⁷⁹ à l'ordre 42. Il n'y a plus d'ordre à trancher un par un | sections 1 ; `compte_figures.py` pour le dénombrement des candidates, `construction.py` pour leur réalisation |
| **corollaire d'existence complète : le protocole admet un étiquetage magique normal diagonal à TOUT ordre pair n ≥ 4, et l'ordre 2 est le seul ordre pair impossible.** Deux branches explicites. À n ≡ 2 (mod 4), n ≥ 6, la construction canonique ci-dessus. À n ≡ 0 (mod 4), le protocole contient comme sous-cas à deux classes le motif classique de la méthode des motifs, écrit ponctuellement : L(r,c) = B si r mod 4 = c mod 4 ou (r mod 4) + (c mod 4) = 3, R sinon. **Preuve.** Dans chaque paquet de quatre cases consécutives d'une ligne, les deux B ont la même somme de résidus que les deux R, donc le paquet somme à 2(n²+1) ; il y en a n/4, d'où une somme de ligne (n/2)(n²+1) = M, et le même calcul par colonne. Sur la diagonale r = c toutes les cases sont B ; sur l'antidiagonale r + c ≡ 3 (mod 4), donc aussi : les deux diagonales valent M. ∎ Ce motif ne vérifie PAS la condition I et ne porte donc aucune croix ansée — le théorème négatif l'interdit à son ordre. **Les deux questions sont distinctes** : l'existence d'un étiquetage magique est fermée à tout ordre pair, l'existence d'une croix ansée exactement aux ordres n ≡ 2 (mod 4) avec n ≥ 6 — l'ordre 2 appartient lui aussi à cette classe et n'en porte aucune. **Et l'ordre 2 ne doit rien au protocole** : si un carré 2×2 normal (a b / c d) avait lignes et colonnes de même somme, a+b = c+d et a+c = b+d donneraient b−c = c−b, donc b = c, ce qui contredit la bijection — aucun carré magique normal d'ordre 2 n'existe. L'échec du critère II à l'ordre 2, que le dépôt invoquait auparavant, ne prouve QUE l'absence de croix ansée : II est une condition de la figure, non une condition nécessaire de la magicité. Rien de neuf du côté doublement pair, où le motif est classique ; le neuf est que les deux branches ensemble couvrent tous les ordres pairs | `construction.py --existence` est l'assertion exécutable du corollaire, ordre pair par ordre pair de 2 à 52, et sort en erreur si une branche échoue ; le cas négatif n = 2 y est **contrôlé et non déduit** — les 256 étiquetages de l'ordre 2 énumérés, aucun magique, et les 24 carrés 2×2 normaux énumérés, aucun à lignes et colonnes égales ; `compte_etiquetages.py --ordre 2` le redonne indépendamment ; journal dans `data/construction.txt` ; témoin 34 (ordre 20) dans `data/temoins.json` |
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
| **à l'ordre 12, la règle des miroirs est exacte, ensemble par ensemble** : pour chacune des 8 192 graines qui pavent, les 16 motifs magiques sont exactement les 16 motifs conformes à la règle — 0 désaccord sur les 8 192, et non seulement l'égalité des cardinaux | `exhaustif6.py` (26 s, Python nu) |
| condition de colonne ⟺ croix ansée (I+II+III) ⟺ pavable, sur les 18 432, ensemble par ensemble | `croix_auto.py` |
| **le recollement, et le compte des croix ansées d'ordre 6 par une seconde route** : le carré se décompose en m × m orbites, la bijection et la condition I étant locales à une orbite ; chaque orbite donne trois nombres — son apport à sa ligne, son apport à sa colonne, son orientation — et le problème devient un transport entier sur une grille m × m avec une parité par ligne (II) et par colonne (III). Le recollement de m paires de lignes d'écart nul redonne **8 192** à l'ordre 6, c'est-à-dire exactement le nombre d'étiquetages magiques portant une croix ansée que `croix_auto.py` trouve par énumération, et **0** aux ordres 4 et 8, comme le théorème le demande. Les parcours direct, inverse et `1,0,2,…` s'accordent : le compte ne dépend pas de l'ordre où l'on recolle les paires | `recollement.py` ; journal dans `data/recollement.txt` |
| à l'ordre 10, le même recollement donne **583 454 127 292 416** étiquetages magiques portant une croix ansée — **Python nu, aucun solveur** —, et deux ordres de recollement indépendants, le direct et `1,0,2,3,4`, donnent le même entier | `recollement.py --ordres 10` puis `--ordres 10 --ordre-paires 1,0,2,3,4` (~6 min et 5 Go chacun) ; journal dans `data/recollement.txt` |
| ce nombre somme les réalisations de **toutes** les figures : pris seul, il n'établit pas que chaque figure candidate est réalisable. La couverture est maintenant **démontrée en général** par `construction.py` (théorème positif, section 1) ; `compte_croix.py`, qui la donnait à l'ordre 10 par solveur, n'en est plus qu'un contrôle indépendant à cet ordre | distinction maintenue, hiérarchie corrigée |
| les comptes de figures candidates aux ordres 6, 8 et 10, retrouvés par force brute | `croix_ansee_n.py` |
| l'identité exacte et la forme (\*) sur les 18 432 et sur les 34 témoins | `identite.py` |
| la méthode de pavage aux ordres 6 à 30 ; les 256 motifs de l'ordre 12 sur les 256 graines du corpus ; les 262 144 motifs de l'ordre 18 sur deux graines — exhaustif sur l'espace des motifs, non sur celui des graines | `pavage_miroirs.py --exhaustif` |
| les trois conditions sur le corpus, le témoin d'indépendance, un contrôle négatif | `protocole_general.py` |
| **la nécessité de la règle des miroirs en assertion, dans le pavage 2 × 2 seulement** : sur les 256 graines du corpus et les témoins non invariants — 284 graines —, aucun pavage magique par un motif non conforme. Rien n'est établi pour m > 2. Une graine invariante par un miroir échappe à l'énoncé, puisque le bit correspondant ne change pas le bloc ; l'invariance est une obstruction, pas une caractérisation de l'échec | `verifie_portee.py`, Python nu, code de sortie 0 ; il contrôle en outre les 18 432 étiquetages magiques d'ordre 6 un par un et n'en trouve aucun d'invariant — l'obstruction d'invariance y est absente, ce qui n'explique pas la nécessité pour autant : celle-ci est établie séparément par `exhaustif6.py` ; journal dans `data/portee-assertion.txt` |
| deux étiquetages magiques invariants par les deux miroirs, aux ordres 4 et 8, relus sans solveur : ils suffisent à montrer que restreindre la règle aux « ordres ≥ 6 » serait faux | `verifie_temoins.py` (genre `miroirs_hors_portee`) |
| **δ = 0 est impossible aux ordres 8, 12, 16 et 20**, sans solveur : la décomposition en orbites rend les contraintes de bijection et la condition I locales, et l'élagage par la borne démontrée ferme chaque ordre dès sa première paire de lignes | `reseau.py --fenetre 0` |
| le compte des configurations de la première paire de lignes d'écart nul, ordres 4 à 26, multiplicités comprises : 0, 128, 0, 20 224, 0, 2 840 576, 0, 410 660 864, 0, 62 458 544 128, 0, 10 055 603 453 952 — un zéro à chaque ordre doublement pair, et l'accord exact avec le dénombrement direct de `parite.py` là où les deux se recoupent | `reseau.py --paire0` ; journal dans `data/paire0.txt` |
| l'identité δ_0 = n(n−1)·A + W et ses trois conséquences, sur les 279 616 configurations des ordres 4 à 10 | `parite.py` ; journal dans `data/parite-controle.txt` |
| **la réciproque locale** : à m impair, δ_0 = 0 est réalisable sur la première paire de lignes — une orbite horizontale, et (m−1)/2 orbites traversantes de chaque signe, d'où A = 0 et W = 0 ; construction explicite de la CONFIGURATION LOCALE de la paire (0, n−1) aux ordres 6, 10, 14, 18, 22, 26, 30 et 34 — deux lignes, pas un carré : elle ne contrôle ni les autres lignes, ni le critère III globalement, ni γ, et ne donne donc aucune croix ansée magique | `parite.py` (construction démontrée, les deux lignes émises et contrôlées) |

## 3. Vérifié exhaustivement, par solveur

Liste finie de cas, chacun tranché individuellement.

| énoncé | script |
| --- | --- |
| 2 048 figures candidates sur 2 048 réalisables à l'ordre 10 — **redondant avec le théorème positif**, et retrouvé sans solveur par `construction.py --toutes` | `compte_croix.py` |
| les 32 figures candidates de l'ordre 8 sont toutes impossibles, **une à une** | `compte_croix.py --ordre 8 --sans-pretest` |
| 2 figures distinctes à l'ordre 6 et 32 à l'ordre 8, par no-goods, le modèle devenant INFEASIBLE après exclusion | `suite_croix.py` |

Le zéro de l'ordre 8 est donc établi deux fois, par deux chemins : la liste des
32 candidates épuisée une à une (statut 3), et le pré-test global (statut 4,
contrôle redondant).

## 4. Obtenu par solveur

Ces résultats sortent de CP-SAT dans l'environnement indiqué. La plupart sont
des impossibilités globales, sans liste finie de cas à produire, et **ne
disposent pas d'un certificat indépendant vérifiable par lecture** : les
revérifier demande de relancer le solveur. Certains, en revanche, ont acquis
depuis un certificat — analytique ou sans solveur — et sont alors marqués
**redondant avec un théorème** : le solveur les confirme, il ne les porte plus.

| résultat | ce qui le porte maintenant |
| --- | --- |
| aucune croix ansée aux ordres 8, 12 et 16 | redondant avec un théorème : l'obstruction doublement paire, section 1 ; et `reseau.py --fenetre 0` sans solveur |
| à l'ordre 8, les sommes de lignes suffisent à l'obstruction | redondant avec un théorème : la preuve n'emploie que la première paire de lignes |
| l'exclusion de l'origine de 𝒟_8 | redondant avec un théorème |
| existence d'étiquetages magiques invariants par les miroirs aux ordres 12 et 16, et leur absence aux ordres 6, 10 et 14 | CP-SAT seul ; les témoins des ordres 4 et 8 sont, eux, relus sans solveur |

| énoncé | script | temps indicatif |
| --- | --- | --- |
| aucun étiquetage magique à quatre classes à l'ordre 2 — **contrôle CP-SAT historique, désormais redondant** : la preuve analytique sur le carré 2×2 (b = c) est en section 1, et deux énumérations sans solveur la contrôlent, `construction.py --existence` (256 étiquetages et 24 permutations) et `compte_etiquetages.py --ordre 2` | `graine_sat.py --ordre 2` | secondes |
| profils symétriques impossibles à l'ordre 6 hors (12,12,6,6) et (10,10,8,8) | `profils.py --ordre 6` | minutes |
| à l'ordre 8, parmi les équations de magicité, les sommes de lignes suffisent à créer l'obstruction et les sommes de colonnes ne sont pas nécessaires | `localise.py` | minutes |
| le balayage de **tous** les modules de 2 à *n*² à l'ordre 8 : satisfaisable pour *q* ≤ 18 et pour *q* pair jusqu'à 34, impossible pour *q* impair ≥ 19 et pour *q* ≥ 36 ; **plus petit module obstructif 19**, et non 64 = *n*² comme une version antérieure l'annonçait à tort | `congruences.py --ordres 8 --balayage` ; journal dans `data/balayage-modules-ordre8.txt` ; le tableau ci-dessous se refait par `congruences.py --ordres 8 --modules 2,4,8,16,18,19,32,34,36,64,0` | ~20 min pour le balayage, ~1 min pour le tableau |
| le vecteur d'écarts nul : atteignable à l'ordre 10, jamais à l'ordre 8 — désormais démontré à tout ordre doublement pair (section 1), et retrouvé **sans solveur** par décomposition en orbites | `ecarts.py --zero` ; `reseau.py --ordres 8,12,16,20 --fenetre 0` le refait en Python nu | minutes |
| les écarts **ne sont pas tous pairs** : témoin d'écart impair à l'ordre 8, écarts (117, 120, 24, 8, −8, −24, −120, −117) | `ecarts.py --cherche-impair` | minutes |
| l'**atteignabilité** de cette borne : max δ_r = n(n−2)/2 × \|2r−n+1\| aux ordres 6, 8, 10 et 12, sur les dix-huit lignes représentatives (3 + 4 + 5 + 6, une par paire) | `ecarts.py --bornes` | minutes |
| l'atteignabilité de la **borne fine** à h_r imposé : max δ_r = (n/2)(n−2h_r)\|u_r\|, atteinte sur **les neuf lignes des ordres 8 et 10 pour h_r = 1 et h_r = 3**, dix-huit cas, accord exact | `ecarts.py --bornes --h 1,3` ; journal dans `data/bornes-fines.txt` | minutes |
| dans la direction λ·(−2, −1, −1, 0, …) de l'ordre 8, les pas atteignables sont exactement **λ ∈ {28, 30, 32, 34}**, et **λ = 0 ne l'est pas** ; le script tient SAT, INFEASIBLE et NON TRANCHÉ séparés et ne dit « exacte » que si aucun λ n'est non tranché | `ecarts.py --direction` | ~3 min |

### Observé exactement, pas encore démontré

| énoncé | script |
| --- | --- |
| **aucun pont trouvé entre 3 \| n et la croix ansée par le test effectué** : l'ensemble des résidus modulo 3 des apports vaut {0, 1, 2} aux ordres 6, 8, 10 et 12, et les ordres 8 et 12 ont le même schéma de survie des paires. Cela ne démontre PAS l'absence de structure modulo 3 dans les états locaux : la table locale fait apparaître n·t_r et s_c, où 3 \| n se lit directement — aux ordres 6 et 12 TOUS les écarts horizontaux de l'orbite (0,1) sont divisibles par 3, résidus {0}, et aux ordres 8 et 14 aucun ne l'est | `recollement.py --ordres 4,6,8,10,12,14 --geometrie` ; journal dans `data/table-locale.txt` |

## 5. Vérifié sur échantillon

| énoncé | taille |
| --- | --- |
| réalisabilité à l'ordre 14 : 201 figures candidates prélevées régulièrement dans les 2²⁹, 201 réalisables sur 201 — **périmé : le théorème positif de la section 1 réalise les 2²⁹, et `construction.py` en construit de nouvelles à l'ordre 14 sans solveur.** Conservé comme trace, il ne porte plus rien | 201 |
| la règle des miroirs aux ordres 24 et 30 | 787 tirages, graine de hasard fixée |
| nécessité de la règle des miroirs hors du corpus | échantillons de 200 |

## 6. Conjecturé

**Plus rien, sur la croix ansée.** Les deux moitiés de la conjecture de parité
sont tombées : à m pair l'obstruction doublement paire interdit tout, à m impair
le théorème positif réalise tout. La classification et le compte exact N(n)
figurent en section 1, et les ordres 14, 18, 22, 26, 30, 34, 42 sont tranchés
par théorème, non plus par témoin ou par échantillon.

Ce qui reste ouvert est ailleurs, et n'est pas une conjecture de ce dossier mais
un problème :

| question ouverte | état |
| --- | --- |
| caractériser l'ensemble des vecteurs d'écarts atteignables — épars, multi-directionnel, borné ; voir la section suivante | ouvert |
| la suffisance de la règle des miroirs hors de l'ordre 6 (elle dépend de la graine) | ouvert ; la nécessité est assertée par `verifie_portee.py`, mais **seulement en pavage 2×2, et seulement pour les graines non invariantes par les miroirs** — 284 graines, zéro violation. L'invariance est une obstruction, pas une caractérisation, et son absence n'explique pas la nécessité : c'est `exhaustif6.py` qui la porte |
| un pont entre 3 \| n et la croix ansée : aucun trouvé par le test effectué, et la table locale ne l'exclut pas | ouvert |

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
