# Contenu textuel du site — source FR

Extraction de tout le texte d'interface visible (titres, sous-titres, intros, labels de boutons, instructions, footer) de chaque page du site, tel qu'il apparaît actuellement dans le code. La base de données des 64 hexagrammes (noms, jugements, images, commentaires de traits) n'est **pas** incluse ici — elle vit dans `index.html` (objets `HEX_KW`, `IMAGE_FR`, `LINE_COMMENT`) et `motifs (4).html` (objet `HEX_FR`).

---

## Page : Accueil / Tirage Yi King (`index.html`, `tirage-livree-hermes.html`)

### En-tête
- Logo (texte alternatif) : « La Livrée d'Hermès »
- Eyebrow (masqué) : « La Livrée d'Hermès »
- Titre : « Tirage — Ordre chronologique des 64 mutations »
- Sous-titre : « Trigramme supérieur (poids 32·16·8) / trigramme inférieur (poids 4·2·1) — construction du bas vers le haut »

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
- « Parcourir au hasard »

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
- « Échange trig. »
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
- « Archives »
- « Créer un motif »
- « Fond d'écran »
- « Impression »
- « Contact »

### Bloc copyright
- « © 2026 Anibal Edelberto Amiot — Tous droits réservés »
- « Créé en collaboration avec Claude »
- « Hébergé par https://gk2.net – l'internet des créatifs »

---

## Page : Création de motifs (`motifs (4).html`)

### En-tête
- Logo (texte alternatif) : « La Livrée d'Hermès »
- Titre : « Création de motifs »
- Sous-titre : « 60 natures, 6 niveaux de traits, un échiquier d'images à chaque croisement »

### Catégories
- « Bases » — « 16 images · 4 axes de base »
- « Par 2 » — « 24 images · combinaisons de 2 axes »
- « Par 3 » — « 16 images · combinaisons de 3 axes »
- « Par 4 » — « 4 images · combinaison des 4 axes »
- « Les 60 » — « 60 images · toutes les natures »

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
- « Archives »
- « Réinitialiser »
- « Imprimer la page »
- « Fond d'écran » (désactivé — « Bientôt disponible »)
- « Contact » (désactivé — « Bientôt disponible »)

### Bloc copyright
- « © 2026 Anibal Edelberto Amiot — Tous droits réservés »
- « Créé en collaboration avec Claude »
- « Hébergé par https://gk2.net – l'internet des créatifs »

---

## Coquille commune : Impression 360 / Projets & fonds d'écran / Contact (`pages.html` + `content.json`)

Ces trois sections partagent la même coquille (`pages.html`) et affichent leur contenu dynamiquement depuis `content.json`. Leur texte de corps est encore un texte à remplacer (« REMPLACER »).

### En-tête du site
- Marque : « Anibal Amiot »
- Tagline : « Motifs textiles & tirages sur mesure »

### Navigation
- « Accueil »
- « Tirage livrée »
- « Création de motifs »
- « Imprimer les 360 »
- « Projets & fonds d'écran »
- « Contact »

### Impression 360
- Eyebrow : « Bouton 3 »
- Titre : « Imprimer les 360 »
- Intro (placeholder) : « REMPLACER : contenu à définir dans la conversation dédiée à ce bouton. »

### Projets & fonds d'écran
- Eyebrow : « Bouton 4 »
- Titre : « Projets & fonds d'écran »
- Intro (placeholder) : « REMPLACER : contenu à définir dans la conversation dédiée à ce bouton. »

### Contact
- Eyebrow : « Bouton 5 »
- Titre : « Contact »
- Intro (placeholder) : « REMPLACER : coordonnées, formulaire ou lien direct à définir dans la conversation dédiée à ce bouton. »

### Pied de page du site
- « © 2026 Anibal Amiot — anibal-amiot.com »
