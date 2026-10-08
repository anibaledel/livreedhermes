/* ============================================================
   Source unique des métadonnées d'articles — La Livrée d'Hermès.
   Utilisée par articles.html (grille filtrable) et par chaque page
   articles/*.html (badges de catégorie + navigation précédent/suivant
   dans la même catégorie). Ajouter un nouvel article ici suffit à le
   faire apparaître dans la grille et dans les navigations liées —
   ne pas dupliquer la liste ailleurs en JS. Penser à ajouter aussi le
   nouvel article à la liste "blogPost" du JSON-LD Blog dans
   articles.html (métadonnée statique, non générée depuis ce fichier).
   Champs :
     slug       identifiant du fichier dans /articles/
     url        URL absolue de la page complète
     title      titre affiché (carte + <h1> de la page article)
     dateISO    date de publication, format AAAA-MM-JJ (tri chronologique)
     dateDisplay date formatée pour affichage humain (fr)
     categories tableau non vide, valeurs parmi ARTICLE_CATEGORIES
     excerpt    2-3 lignes, tronqué visuellement par CSS (line-clamp)
     cover      URL absolue de l'image de couverture, ou null si aucune
                (si AVIF, un JPEG de même nom doit exister à côté : repli)
     coverAlt   texte alternatif de l'image (ignoré si cover est null)
     coverAltEn facultatif : le même en anglais, pour la liste en/articles/,
                quand l'image n'apparaît pas dans l'article anglais (sinon
                scripts/build-articles.js reprend l'alt de l'article)
   ============================================================ */
window.ARTICLE_CATEGORIES = ["Livrée", "Verticalité", "Divination", "Géométrie", "Philosophie", "Sagesse"];

window.ARTICLES = [
  {
    slug: "formes-et-figures-transcription",
    url: "https://anibal-amiot.com/articles/formes-et-figures-transcription.html",
    title: "Les formes et les figures : une transcription",
    dateISO: "2026-10-08",
    dateDisplay: "Publié le 8 octobre 2026",
    categories: ["Géométrie", "Livrée", "Divination"],
    excerpt: "Le fait saillant, qu'on ne pouvait pas deviner : le trigramme est porté par la forme, le pied par l'orientation.",
    cover: "https://anibal-amiot.com/assets/articles/formes-figures/jonctions.png",
    coverAlt: "Les quatre groupes de jonctions, rouge et bleu réunis"
  },
  {
    slug: "tissage-sacre-symbolisme",
    url: "https://anibal-amiot.com/articles/tissage-sacre-symbolisme.html",
    title: "Le tissage et le sacré : la fonction ésotérique du fil à travers les traditions",
    dateISO: "2026-10-08",
    dateDisplay: "Publié le 8 octobre 2026",
    categories: ["Sagesse", "Livrée", "Philosophie"],
    excerpt: "Du destin à l’ordre cosmique, du corps à la transmission : une lecture comparée des arts textiles.",
    cover: "https://anibal-amiot.com/assets/articles/tissage-sacre/sainte-sophie-zoe-constantin.jpg",
    coverAlt: "Mosaïque de la galerie sud de Sainte-Sophie : le Christ en majesté sur son trône, entre l'empereur Constantin IX Monomaque à gauche et l'impératrice Zoé à droite, tous deux en vêtements de cérémonie couverts de compartiments géométriques et de pierreries, sur fond d'or."
  },
  {
    slug: "le-fil-et-le-carre",
    url: "https://anibal-amiot.com/articles/le-fil-et-le-carre.html",
    title: "Le fil et le carré — ce que la tradition indienne a construit avant nous",
    dateISO: "2026-10-04",
    dateDisplay: "Publié le 4 octobre 2026",
    categories: ["Géométrie", "Sagesse", "Livrée"],
    excerpt: "Deux systèmes élaborés dans des langues et des siècles différents arrivent aux mêmes objets. Quand ça se produit, ce n'est généralement pas une coïncidence — c'est que l'objet existait avant les deux.",
    cover: "https://anibal-amiot.com/assets/articles/le-fil-et-le-carre-cover.jpg",
    coverAlt: "Trois grilles de quatre sur quatre. À gauche le chādaka, dont les lignes se répètent de période deux en largeur. Au centre le chādya, sa transposée, de période deux en hauteur. À droite leur combinaison : les entiers de un à seize, dont les quatre lignes, les quatre colonnes et les huit diagonales brisées font toutes trente-quatre."
  },
  {
    slug: "axes-lignes-nodales",
    url: "https://anibal-amiot.com/articles/axes-lignes-nodales.html",
    title: "Les axes sont des lignes nodales",
    dateISO: "2026-09-24",
    dateDisplay: "Publié le 24 septembre 2026",
    categories: ["Géométrie", "Philosophie", "Livrée"],
    excerpt: "Trois motifs bicolores, vérifiés triangle par triangle, coïncident exactement avec des modes propres d'une plaque carrée — et la mutation se lit comme un changement de condition au bord.",
    cover: "https://anibal-amiot.com/assets/articles/axes-lignes-nodales-cover.jpg",
    coverAlt: "Trois damiers 12×12 en or et noir : les motifs nodaux des modes (2,2) et (4,4) d'une plaque carrée, bords fixes et bords libres",
    coverAltEn: "Three 12×12 chequerboards in gold and black: the nodal patterns of the (2,2) and (4,4) modes of a square plate, fixed and free edges"
  },
  {
    slug: "encodeur-cacher-n-est-pas-proteger",
    url: "https://anibal-amiot.com/articles/encodeur-cacher-n-est-pas-proteger.html",
    title: "L'encodeur : cacher n'est pas protéger",
    dateISO: "2026-09-16",
    dateDisplay: "Publié le 16 septembre 2026",
    categories: ["Géométrie", "Philosophie", "Livrée"],
    excerpt: "Un message chiffré dissimulé dans une grille de symboles, aux positions désignées par la croix ansée et le métier Jacquard — et pourquoi la géométrie n'y protège rien.",
    cover: "https://anibal-amiot.com/assets/articles/encodeur-referent-256-cover.jpg",
    coverAlt: "Détail d'une rangée de carrés du Référent 256, issus de la croix ansée, en quatre couleurs",
    coverAltEn: "Detail of a row of squares from the Referent 256, derived from the ansate cross, in four colours"
  },
  {
    slug: "cymatique-spectre-d-un-motif",
    url: "https://anibal-amiot.com/articles/cymatique-spectre-d-un-motif.html",
    title: "Cymatique : ce que le spectre d'un motif laisse voir",
    dateISO: "2026-09-16",
    dateDisplay: "Publié le 16 septembre 2026",
    categories: ["Géométrie", "Philosophie", "Livrée"],
    excerpt: "De la plaque de Chladni au pavage : les quinze gammes du traité ont des fréquences spatiales dont les carrés sont entiers — la forme même que prennent les modes d'une plaque carrée.",
    cover: "https://anibal-amiot.com/assets/articles/cymatique-quinze-gammes-cover.avif",
    coverAlt: "Bandeau des quinze motifs Yin et Yang du traité, en noir et blanc, côte à côte",
    coverAltEn: "Strip of the treatise's fifteen Yin and Yang patterns, in black and white, side by side"
  },
  {
    slug: "reminiscence-caillou-carre",
    url: "https://anibal-amiot.com/articles/reminiscence-caillou-carre.html",
    title: "La réminiscence : du caillou pythagoricien au carré construit",
    dateISO: "2026-09-06",
    dateDisplay: "Publié le 6 septembre 2026",
    categories: ["Philosophie", "Géométrie"],
    excerpt: "Il existe une manière très ancienne de faire apparaître une vérité mathématique : ne pas l'énoncer, mais la construire, et laisser celui qui construit la découvrir de ses propres yeux — des cailloux pythagoriciens au garçon esclave du Ménon, jusqu'à une construction de carrés magiques contemporaine.",
    cover: "https://anibal-amiot.com/assets/articles/reminiscence-socrate-alcibiade-cover.jpg",
    coverAlt: "Détail du tableau Alcibiade instruit par Socrate montrant Socrate et la figure penchée vers lui"
  },
  {
    slug: "arlequin-trismegiste",
    url: "https://anibal-amiot.com/articles/arlequin-trismegiste.html",
    title: "Arlequin trismégiste : la livrée de Mercure",
    dateISO: "2026-09-03",
    dateDisplay: "Publié le 3 septembre 2026",
    categories: ["Livrée", "Philosophie", "Divination"],
    excerpt: "Pourquoi Apollinaire referme un poème sur \"l'arlequin trismégiste\" ? La naissance d'Hermès, le témoignage de Niklaus et Crowley, et le geste que Baphomet partage avec le Bateleur.",
    cover: "https://anibal-amiot.com/assets/articles/penguilly-parade-cover.jpg",
    coverAlt: "Parade : Pierrot présente à l'assemblée ses compagnons Arlequin et Polichinelle, Octave Penguilly L'Haridon, 1846"
  },
  {
    slug: "verticalite-damier-mosaique-echiquier",
    url: "https://anibal-amiot.com/articles/verticalite-damier-mosaique-echiquier.html",
    title: "Verticalité, damier, mosaïque et échiquier",
    dateISO: "2026-09-03",
    dateDisplay: "Publié le 3 septembre 2026",
    categories: ["Verticalité", "Géométrie"],
    excerpt: "De l'échiquier des 64 au pavé mosaïque, en passant par le Yi King, Arlequin et Baphomet : comment un même axe vertical traverse ce projet, du chiffre de la bête à la mesure de l'ange.",
    cover: "https://anibal-amiot.com/assets/articles/checkmate-retzsch.jpg",
    coverAlt: "Checkmate (Faust et Méphistophélès jouant aux échecs), Moritz Retzsch, 1831"
  },
  {
    slug: "foliage-bouffons-de-cour",
    url: "https://anibal-amiot.com/articles/foliage-bouffons-de-cour.html",
    title: "Foliage, ou l'art des bouffons de cour",
    dateISO: "2026-09-02",
    dateDisplay: "Publié le 2 septembre 2026",
    categories: ["Sagesse", "Divination", "Livrée"],
    excerpt: "Avant d'être une carte à jouer, le Fou est un dieu mineur banni de l'Olympe pour ses railleries. De Mômos aux bouffons de cour de la Renaissance, une traversée de la fonction de miroir grotesque que le fou tend au prince.",
    cover: "https://anibal-amiot.com/assets/articles/visconti-sforza-fou.avif",
    coverAlt: "Le Mat (le Fou), tarot Visconti-Sforza",
    coverAltEn: "The Fool (le Mat), Visconti-Sforza tarot"
  },
  {
    slug: "habit-du-grand-pretre",
    url: "https://anibal-amiot.com/articles/habit-du-grand-pretre.html",
    title: "L'habit du grand prêtre : le carré caché dans le tashbetz",
    dateISO: "2026-09-02",
    dateDisplay: "Publié le 2 septembre 2026",
    categories: ["Livrée", "Géométrie"],
    excerpt: "Dans le livre de l'Exode, deux détails du vêtement du grand prêtre — la tunique « en damier » et le carré du pectoral — dessinent, bien avant tout carré magique, la même intuition qui traverse La Livrée d'Hermès.",
    cover: "https://anibal-amiot.com/assets/articles/grand-pretre-tashbetz-1874.avif",
    coverAlt: "Le grand prêtre en habits sacerdotaux, l'éphod et le pectoral sur la poitrine"
  },
  {
    slug: "hanuman-et-arlequin",
    url: "https://anibal-amiot.com/articles/hanuman-et-arlequin.html",
    title: "Hanuman et Arlequin : une même fonction du messager",
    dateISO: "2026-08-31",
    dateDisplay: "Publié le 31 août 2026",
    categories: ["Livrée", "Philosophie"],
    excerpt: "Deux traditions théâtrales indépendantes, deux figures bariolées porteuses d'un bâton — le rapprochement entre le fidèle compagnon du Ramayana et l'Arlequin de la commedia dell'arte n'est pas qu'une coïncidence visuelle.",
    cover: "https://anibal-amiot.com/assets/articles/hanuman-mouth-075.avif",
    coverAlt: "Fresque du Ramakien représentant Phra Ram et Nang Sida cachés dans la bouche géante de Hanuman"
  }
];
