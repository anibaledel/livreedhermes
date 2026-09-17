# Contenu textuel du site — source FR

Relevé du texte d'interface visible (titres, sous-titres, intros, labels de
boutons, instructions, pied de page), page par page.

**Portée.** Le relevé couvre l'ensemble des pages françaises du site. Les
pages `en/book/`, `es/libro/` et `th/book/` sont les versions anglaise,
espagnole et thaïe de la page de vente du livre : elles sortent d'un document
de source française. Les 64 pages d'hexagrammes sont générées à partir d'un
même gabarit — c'est ce gabarit qui figure ici, non ses 64 instances.

**Ce qui n'est pas repris.** Conformément à ce que ce document relève —
titres, sous-titres, intros, labels, instructions —, le corps éditorial des
pages longues n'est pas recopié : les notices du lexique, la biographie de la
page « À propos », le détail des brevets, et les images et jugements des 64
hexagrammes vivent dans les pages elles-mêmes.

**Hors périmètre.** La base des 64 hexagrammes — noms, jugements, images,
commentaires de traits — n'est pas reprise ici : elle vit dans `index.html`
(objets `HEX_KW`, `IMAGE_FR`, `LINE_COMMENT`) et dans
`creation-motifs-yi-king.html` (objet `HEX_FR`).

---

## Page : Accueil / Tirage Yi King (`index.html`, `tirage-livree-hermes.html`)

### En-tête
- Logo (texte alternatif) : « La Livrée d'Hermès »
- Eyebrow (masqué) : « La Livrée d'Hermès »
- Titre : « Tirage — Ordre chronologique des 64 mutations »
- Sous le titre vient directement le texte de la barre du livre (voir
  ci-dessous). L'ancien sous-titre « Trigramme supérieur (poids 32·16·8) /
  trigramme inférieur (poids 4·2·1) — construction du bas vers le haut »
  a été retiré de la page ; la même information subsiste dans la note d'axes
  sous l'échiquier.

### Barre du livre
- « Lire le livre »
- « Langue du livre » (titre du sélecteur de drapeaux)
- Drapeaux disponibles : Français, English, Español, ไทย — titres « 中文 — bientôt », « Русский — bientôt »
- « Télécharger le PDF du livre »
- « Télécharger la traduction du Yi-King »
- « Archive 360 motifs »

### Échiquier / grille
- « Échiquier »
- « 00 → 63 »
- Note d'axes : « Lignes = trigramme **supérieur** (0 à 7, haut en bas) · Colonnes = trigramme **inférieur** (0 à 7, gauche à droite) · N° = ligne×8 + colonne »
- « Tirer aux pièces (6 traits) »

### Légende des traits
- « Traits — symbolique traditionnelle »
- « Yang fixe »
- « Yang mutant — va se briser »
- « Yin fixe »
- « Yin mutant — va se remplir »

### État vide (avant tirage)
- « Cliquez une case de l'échiquier pour consulter un hexagramme, ou tirez aux pièces pour une lecture — avec, le cas échéant, ses traits mutants et l'hexagramme qui en résulte. »

### Détail d'un hexagramme (labels d'interface)
- « ORDRE CHRONOLOGIQUE »
- « n° King Wen (traditionnel) : »
- « Image »
- « Jugement »
- « Supérieur » / « Inférieur »
- « Binôme (retourné) »
- « Opposé (inversé) »
- « Pavage — traits fixes uniquement »
- « Pavage — reproduit sous le départ »
- « Trait mutant — position »
- Positions des trigrammes : « Terre (base) », « Terre (achèvement) », « Homme (base) », « Homme (achèvement) », « Ciel (base) », « Ciel (achèvement) »
- « Copier le lien » / « Copié »

### Section mutation (avant → après)
- « Hexagramme antérieur » / « Hexagramme postérieur »
- « Traits mutants : » … « — ce sont les seuls traits qui basculent entre les deux situations. »
- « Pavage — situation antérieure » / « Pavage — situation postérieure »
- « Ce que devient la situation »

### Pied de page
- « Numérotation chronologique binaire (votre système, p.067) — le nom et le jugement restent ceux du Yi-king traditionnel, à titre de repère. »
- « Pavage : transcription réelle en carré de 144, calculée à partir de vos calques 1-6. Les quatre jeux — **Yang fixe**, **Yin fixe**, **Yang mutant** et **Yin mutant** — sont désormais tous intégrés. »
- « Un tirage effectué est encodé dans l'URL (`?tire=`) — copiez le lien pour le partager ou le retrouver tel quel. »

### Navigation du pied de page
- « Créer un motif »
- « Unified Patterns »
- « Galerie 884 »
- « Fond d'écran »
- « Impression »
- « Contact »
- « À propos »
- « Lexique »
- « Articles »
- « Devenir Partenaire »

### Bloc copyright
- « © 2026 Anibal Edelberto Amiot — Tous droits réservés »
- « Créé en collaboration avec Claude »

---

## Page : Création de motifs (`creation-motifs-yi-king.html`)

L'ancienne adresse `motifs (4).html` n'est plus qu'une redirection vers
cette page, côté HTML et dans `.htaccess`.

### En-tête
- Logo (texte alternatif) : « La Livrée d'Hermès »
- Titre : « Création de motifs »
- Sous-titre : « 60 natures, 6 niveaux de traits, un échiquier d'images à chaque croisement »

### Catégories
Onglets, sans sous-titre : « Bases », « Par 2 », « Par 3 », « Par 4 »,
« Les 60 ». Les sous-titres de comptage qui les accompagnaient
(« 16 images · 4 axes de base » et suivants) ont disparu de la page.

### Textes d'introduction par catégorie
- « Les 60 natures » : « Les 60 natures réunies, toutes catégories confondues. Choisis 2 images, où qu'elles se trouvent : l'image la plus « yang » joue le rôle du Créateur, l'autre celui du Réceptif, et l'échiquier des 64 hexagrammes se construit par correspondance de position — exactement comme dans l'app Tirage. »
- Autres catégories (gabarit) : « Catégorie « {label} » ({sous-titre}) — choisis 2 images. La plus « yang » des deux joue le rôle du Créateur, l'autre celui du Réceptif, et l'échiquier des 64 hexagrammes se construit par correspondance de position, avec les vrais calques de chaque image. »

### Grille de sélection
- « Choisis une première image »
- « Choisis une seconde image »
- « Deux images choisies — résultat ci-dessous »
- Titres de groupe (mode « Les 60 ») : « Bases », « Par 2 », « Par 3 », « Par 4 »
- « Recommencer la sélection »

### Panneau d'attente (combinaison pas encore activée)
- « Échiquier pas encore activé pour cette combinaison »
- « « {motif} » ({catégorie}) attend encore ses calques trait par trait. »

### En-tête de l'échiquier généré
- « {image} — rôle Créateur (yang) »
- « {image} — rôle Réceptif (yin) »
- « 64 croisements · {n} motif(s) visuellement distinct(s) »
- « (égalité de score yang — attribution arbitraire) »
- « {n} motif(s) de cet échiquier apparaissent/apparaît deux fois (couleurs échangées entre le Créateur et le Réceptif) — chaque case concernée le signale et indique l'hexagramme jumeau. »
- « Numérotation ci-dessous : ordre de lecture 1 (haut-gauche) → 64 (bas-droite) — clique une case pour la numérotation King Wen traditionnelle · {n} échiquiers différents possibles au total avec les 60 natures (C(60,2)) »

### Panneau détail d'une case
- « ← Retour à l'échiquier »
- « N° {kw} / 64 — TRADITION KING WEN »
- « Image »
- « Jugement »

### Section paire complémentaire
- « Même motif, couleurs inversées — Créateur et Réceptif échangés »
- « Case complémentaire de cet échiquier — n° {a} + n° {b} = 65 »
- Texte (motif jumeau visuel) : « Ce dessin est rigoureusement le même pour les deux hexagrammes : le Créateur et le Réceptif choisis pour cet échiquier se correspondent par inversion des couleurs, donc chaque motif y figure deux fois — une fois pour chacun des deux hexagrammes qu'il représente. »
- Texte (cases distinctes) : « Sur cet échiquier, chaque case n° N a pour vis-à-vis la case n° (65-N) — les deux extrémités d'un même mélange entre le Créateur et le Réceptif choisis. Ici les deux motifs restent distincts (l'échiquier compte 64 dessins différents), mais leur position les relie toujours l'un à l'autre. »

### Navigation du pied de page
- « Accueil »
- « Tirage »
- « Impression »
- « Unified Patterns »
- « Galerie 884 »
- « Fond d'écran »
- « Contact »
- « À propos »
- « Lexique »
- « Articles »
- « Devenir Partenaire »

### Bloc copyright
- « © 2026 Anibal Edelberto Amiot — Tous droits réservés »
- « Créé en collaboration avec Claude »

---

## Chrome commun (tout le site)

Neuf pages portent la même navigation de pied de page, à l'identique :
`impression.html`, `fonds-ecran.html`, `contact.html`, `articles.html`,
`lexique.html`, `a-propos.html`, `profil.html`,
`galerie-884-patterns-unifies.html` et `unified-patterns.html`.
`creation-motifs-yi-king.html` porte la même, moins sa propre entrée
« Créer un motif ». `index.html` en omet deux, « Accueil » et « Tirage » :
il tient les deux rôles. Trois pages font exception : `pro.html` et `encodeur.html` ont
une navigation réduite, `tirage-livree-hermes.html` n'en a pas.

Ces pages étaient auparavant servies par une coquille unique, `pages.html`,
alimentée par `content.json` ; cette architecture a disparu — `pages.html`
n'est plus qu'une redirection vers `fonds-ecran.html`, et chaque page est
aujourd'hui un fichier HTML autonome.

### Navigation
- « Accueil »
- « Tirage »
- « Créer un motif »
- « Unified Patterns »
- « Galerie 884 »
- « Fond d'écran »
- « Impression »
- « Contact »
- « À propos »
- « Lexique »
- « Articles »
- « Devenir Partenaire »
- « Devenir Soutien »

### Pied de page du site
- « © 2026 Anibal Edelberto Amiot — Tous droits réservés »
- « Créé en collaboration avec Claude »

### Barre du livre
Présente sur `impression.html`, `fonds-ecran.html`,
`galerie-884-patterns-unifies.html` et `unified-patterns.html`.
- « La Livrée d'Hermès est un livre de philosophie et de mathématiques, disponible en accès libre au lien ci-dessous. Il est centré sur la construction des carrés magiques et leur transcription en tissage Jacquard. »
- « Lire le livre »
- Drapeaux : 🇫🇷 🇬🇧 🇪🇸 🇹🇭 🇨🇳 🇷🇺
- « Télécharger le PDF du livre »
- « Télécharger la traduction du Yi-King »

---

## Page : Impression (`impression.html`)

### En-tête
- Titre du document : « La Livrée d'Hermès — Impression »
- Marque : « La Livrée d'Hermès »
- Titre : « Impression — tirage & calques »
- Sous-titre : « Choisissez une catégorie, effectuez le tirage, téléchargez le calque prêt à découper ou imprimer. »

### Catégories
- « Catégorie I » — « Bases » — « 16 motifs · tirage direct »
- « Catégorie II » — « Comb. par 2 axes » — « 24 motifs · 6 familles × 4 teintes »
- « Catégorie III » — « Comb. par 3 axes »
- « Catégorie IV » — « Comb. par 4 axes » — « 64 motifs · tirage par position »
- « 🎲 Choisir la catégorie au hasard »

---

## Page : Fonds d'écran (`fonds-ecran.html`)

### En-tête
- Titre du document : « La Livrée d'Hermès — Fonds d'écran »
- Marque : « La Livrée d'Hermès »
- Titre : « Fonds d'écran »
- Sous-titre : « Choisissez une catégorie de motifs unifiés, en plein écran, réactifs au son ou en mode méditatif. »

### Instructions
- « Choisis une catégorie de motifs unifiés. Une fois lancé, le pavage occupe l'écran entier et change au rythme du son — le tien (micro) ou un fichier que tu proposes. »
- « Options de modulation, une fois la catégorie choisie : »
- « 🎤 Micro » — « le pavage change au rythme du son ambiant réellement entendu. »
- « 📁 Fichier audio » — « même principe, avec un morceau que tu proposes toi-même. »

---

## Page : Contact (`contact.html`)

### En-tête
- Titre du document : « Contact — Anibal Amiot | Designer textile en Thaïlande »
- Titre : « Contact »
- Sous-titre : « Un projet, une collaboration ou une commande de motifs et tirages textiles »

### Corps
- « Pour toute question, projet de motif sur mesure, tirage textile ou collaboration, écrivez directement par email ou retrouvez Anibal Amiot sur les réseaux sociaux : »
- Adresse : « anibaledel@gmail.com »
- Réseaux : « Instagram », « Telegram », « Facebook » (« Temporairement indisponible »), « LinkedIn », « X », « Discussion sur Reddit »

### Bloc « Anibal Amiot — auteur du projet »
- « Anibal Amiot est le concepteur du projet La Livrée d'Hermès, une recherche originale portant sur la construction géométrique de carrés magiques auto-construits (« carrés solaires ») et leur application au tirage du Yi King. Basé en Thaïlande, il développe également un volet textile lié à cette recherche, en lien avec les acteurs locaux du secteur. »
- « Deux brevets français déposés en 2002 et 2004 (FR2840678, FR2865054), et 63 dessins et modèles déposés le 4 juillet 2019 (n° d'enregistrement 20193057) couvrant les principaux carrés d'ordre 12 — le socle géométrique de La Livrée d'Hermès. »
- Liens : « profil documentaire complet », « fiche Wikidata d'Anibal Edelberto Amiot »
- « Inventeur — brevets déposés : FR2865054 (procédé de composition automatisée d'un motif symbolique — précurseur direct de la méthode de La Livrée d'Hermès), FR2840678 (arme transformable pour arts martiaux). »

### Bloc « Gérald Kerma — webmaster »
- « Gérald Kerma, alias Gandalf, est fondateur de CyberMind et contributeur au noyau Linux, avec plus de trente-cinq ans d'expérience en cybersécurité et systèmes embarqués. Il assure le développement et la maintenance technique du site La Livrée d'Hermès. »

---

## Page : Galerie des 884 patterns unifiés (`galerie-884-patterns-unifies.html`)

### En-tête
- Titre du document : « La Livrée d'Hermès — Galerie des 884 Patterns Unifiés »
- Marque : « La Livrée d'Hermès »
- Titre : « Galerie des 884 Patterns Unifiés »
- Sous-titre : « Engendrés par mélange de teintes sur les familles de calques — sélectionnez un motif pour voir son pavage. »
- Compteur : « 884 » — « Patterns unifiés »

### Questions fréquentes
Bloc dépliant, partagé avec `unified-patterns.html` :
- « Qu'est-ce que les Unified Patterns ? »
- « Quelles sont les contraintes de création des Unified Patterns ? »
- « Comment les Unified Patterns sont-ils identifiés parmi les grilles équilibrées ? »
- « Comment ces matrices sont-elles classifiées ? »
- « Sur quelle harmonie ce système a-t-il été vérifié ? »

---

## Page : Unified Patterns (`unified-patterns.html`)

### En-tête
- Titre du document : « Unified Patterns — La Livrée d'Hermès »
- Marque : « La Livrée d'Hermès »
- Titre : « Unified Patterns »
- Sous-titre : « Les 64 motifs textiles associés aux 64 hexagrammes du Yi King — cliquez une case pour personnaliser sa couleur et télécharger le motif. »

Même bloc « Questions fréquentes » que la galerie 884.

---

## Page : Articles (`articles.html`)

### En-tête
- Titre du document : « Articles — La Livrée d'Hermès »
- Titre : « Articles »
- Sous-titre : « Réflexions et recherches autour de La Livrée d'Hermès »

### Corps
- État de chargement : « Chargement des articles… »
- Pied de section : « D'autres articles suivront — sur l'arithmogéométrie, le symbolisme des carrés magiques, et les traditions du vêtement porteur de sens à travers le monde. »

La grille des articles est construite depuis `assets/articles-data.js` : titres,
catégories et dates s'y modifient, pas dans le HTML de la page.

### Les six articles (`articles/`)
Titres tels qu'ils figurent dans `assets/articles-data.js` :
- « La réminiscence : du caillou pythagoricien au carré construit »
- « Arlequin trismégiste : la livrée de Mercure »
- « Verticalité, damier, mosaïque et échiquier »
- « Foliage, ou l'art des bouffons de cour »
- « L'habit du grand prêtre : le carré caché dans le tashbetz »
- « Hanuman et Arlequin : une même fonction du messager »

Chaque page d'article porte le chrome du site, un badge de catégorie et une
navigation précédent/suivant, tous trois issus du même fichier de données.

---

## Page : Lexique (`lexique.html`)

### En-tête
- Titre du document : « Lexique — Comprendre La Livrée d'Hermès »
- Titre : « Lexique »
- Sous-titre : « Comprendre la démarche en dix notions, sans avoir lu le livre »
- Intro : « Cette page rassemble les notions qui reviennent le plus souvent sur ce site, expliquées simplement. Chaque terme s'appuie sur le précédent : la lecture dans l'ordre suit le chemin du livre, du fondement philosophique jusqu'à l'objet textile. »

### Questions fréquentes
- « Qu'est-ce que l'arithmogéométrie ? »
- « Qu'est-ce que la croix ansée ? »
- « Qu'est-ce que la verticalité, dans La Livrée d'Hermès ? »
- « Qu'est-ce que la symétrie axiale et centrale du vivant ? »

### Entrées du lexique
Titres seuls — les notices sont dans la page :
« Arithmogéométrie », « Carré magique », « Croix ansée »,
« Carré d'ordre 12 et pattern unifié », « Calque et tirage ».

---

## Page : À propos (`a-propos.html`)

### En-tête
- Titre du document : « À propos — Anibal Amiot | Auteur de La Livrée d'Hermès »
- Titre : « À propos »
- Sous-titre : « Anibal Amiot, auteur de La Livrée d'Hermès »

### Questions fréquentes
- « Qui est Anibal Edelberto Amiot ? »

### Liens sortants
- « Wikidata », « fiche Wikidata »
- Renvoi vers le lexique en fin de page.

---

## Page : Profil documentaire (`profil.html`)

### En-tête
- Titre du document : « Profil documentaire — Anibal Amiot | Inventeur »
- Titre : « Profil documentaire »
- Sous-titre : « Brevets et dessins et modèles vérifiables auprès de l'INPI »
- Légende du portrait : « Portrait — montage photographique »

### Sections
- « Brevets » — « FR2840678 » (« Arme transformable pouvant convenir à la pratique de plusieurs arts martiaux »), « FR2865054 » (« Procédé et dispositif pour la composition automatisée d'un motif symbolique exprimant une relation mathématique »), avec pour chacun les libellés « Dépôt (priorité) », « Dépôt », « Publication », « Délivrance ».
- Lien : « fiche Wikidata »

---

## Pages : accès Pro (`pro.html`, `pro-contenu.html`, `pro-succes.html`)

Navigation réduite par rapport au reste du site.

### `pro.html`
- Titre du document : « Accès Pro — La Livrée d'Hermès »
- Titre : « Accès Pro »
- Sous-titre : « Un palier complémentaire au soutien à prix libre du livre : un paiement unique, sans abonnement, pour un usage professionnel des motifs de La Livrée d'Hermès. »
- Prix : « 99 € » — « Paiement unique — pas d'abonnement »
- Bouton : « Devenir membre Pro — 99 € »
- « Le paiement est sécurisé par Stripe. L'accès est activé automatiquement sur cet appareil juste après le paiement. »
- État déjà membre : « Votre accès Pro est actif sur cet appareil. » — « Accéder à l'espace Pro → »
- Section « Ce que débloque l'accès Pro » : « Les 3536 motifs, en PDF et en SVG », « Encodeur stéganographique », « Voir l'outil → »

### `pro-contenu.html`
- Titre : « Espace Pro »
- « Cette page est réservée aux membres Pro (paiement unique de 99 €). »
- « Bienvenue dans l'espace Pro. Le contenu de cette page n'est pas encore défini — il sera ajouté prochainement. En attendant, voici le téléchargement complet des motifs. »
- Catégories de téléchargement : « Cellules — Tricolore YPM », « Cellules — Monochrome Black », « Pavages — Tricolore YPM », « Pavages — Monochrome Black », chacune avec « ZIP (884 SVG) » et « PDF »

### `pro-succes.html`
- Titre : « Merci — accès Pro activé »
- « Validation de votre accès en cours... »
- « Votre accès Pro est débloqué sur cet appareil. Les pages et téléchargements réservés aux membres Pro sont accessibles. »
- Bouton : « Accéder à l'espace Pro »

---

## Page : retour de soutien (`soutien-succes.html`)

- Titre du document : « Merci pour votre soutien — La Livrée d'Hermès »
- Titre : « Merci pour votre soutien »
- « Validation de votre accès en cours... »
- « Votre accès aux téléchargements est débloqué sur cet appareil. Revenez sur la page qui vous intéresse et téléchargez librement les fichiers SVG et PDF. »
- Bouton : « Retour au site »

---

## Page : SecuBox — encodeur (`encodeur.html`)

Page à onglets, navigation réduite. Le corps de la page comporte de longues
notes techniques (substitutions cryptographiques, écarts assumés avec la CLI
Python, avertissements) qui ne sont pas reprises ici : elles vivent dans
l'onglet « À propos » de la page.

### Onglets
« ⚡ Démo », « 🔑 Exchange », « 📨 Message », « 🔓 Déchiffrer », « 💾 Vault »,
« 🔒 Chiffrement », « 📐 Référents », « 📖 À propos »

### Titres de cartes
- « Démonstration : message ANIBALAMIOTX »
- « Échange de clés — X25519 authentifié (triple DH) », « Étape 0 — Votre identité », « Étape 1 — Votre offer », « Étape 2 — Offer de votre correspondant », « Session active »
- « Envoyer avec la session active », « Encoder un message (clés libres) », « Grille Carter 90×90 (grammaire dérivée de la clé) »
- « Déchiffrer avec la session active », « Décoder avec des clés manuelles », « Charger depuis un fichier », « Décoder une grille Carter 90×90 »
- « Vault chiffré — fichiers », « Ajouter un fichier », « Contenu du vault », « Exporter »
- « Chiffrement hybride — géométrique + AES-256-GCM », « Chiffrer un fichier », « Déchiffrer un fichier », « Statistiques de sécurité »
- « Référent 256 — Table des formes de la croix ansée », « Référent 360 — Calques Jacquard »
- « Stéganographie géométrique — chiffrer puis dissimuler », « Architecture SecuBox »

### Boutons
« Lancer la démonstration », « Créer mon identité », « Générer mon offer »,
« Copier », « Dériver la session », « Effacer la session »,
« Encoder et télécharger la grille », « Encoder »,
« ⬇ Télécharger la grille CSV », « ⬇ Télécharger les clés (JSON) »,
« Encoder et télécharger grille_carter.csv », « Déchiffrer », « Décoder »,
« Créer un nouveau vault », « Ouvrir un fichier .sbvault »,
« Devenir Partenaire — 99 € »

---

## Pages : le livre (`book-viewer/`, `fr/livre/`)

### Liseuse (`book-viewer/index.html`)
- Titre du document : « La Livrée d'Hermès — Le Livre »
- Titre : « Le Livre — visualiseur »
- Navigation : « ‹ », « › », « Page — / — », « Aller à », « Voir »
- Aide : « ← → pour naviguer · clic sur la page pour zoomer »

### Page de vente française (`fr/livre/index.html`)
- Titre du document : « La Livrée d'Hermès — Lire le livre en ligne »
- Intro : « La Livrée d'Hermès est un livre de philosophie et de mathématiques, disponible en accès libre. Il est centré sur la construction des carrés magiques et leur transcription en tissage Jacquard — un précis d'arithmogéométrie qui conduit le lecteur du carré magique jusqu'au métier à tisser. »
- Boutons : « Lire le livre en ligne → », « Télécharger le PDF (FR) »
- « Autres langues : » — « English », « Español », « ไทย »

---

## Gabarit : pages d'hexagrammes (`hexagrammes/`)

Les 64 pages sont générées par `scripts/generate-hexagram-pages.js`. Modifier
l'une d'elles à la main est sans effet durable : la prochaine génération
l'écrase. Les libellés d'interface, communs aux 64, sont ceux du gabarit.

### Fil d'Ariane et en-tête
- « Accueil » / « Hexagrammes »
- Titre : « Hexagramme {n} — {nom} »
- « ← Voir cet hexagramme sur l'échiquier »
- « N° chronologique » — « (ordre par poids binaires) · n° King Wen (traditionnel) {n} »
- Signature : « Par Anibal Edelberto Amiot — Mis à jour le {date} »

### Corps
- Légende de l'illustration : « Pavage du carré magique associé à cet hexagramme, La Livrée d'Hermès. »
- « Trigramme supérieur » / « Trigramme inférieur »
- « Image » / « Jugement »

Les noms, images et jugements des 64 hexagrammes ne sont pas repris ici : ils
sont extraits d'`index.html` par `scripts/extract-hexagram-data.js`.
