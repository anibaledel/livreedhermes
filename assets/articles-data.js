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
     coverAlt   texte alternatif de l'image (ignoré si cover est null)
   ============================================================ */
window.ARTICLE_CATEGORIES = ["Livrée", "Verticalité", "Divination", "Géométrie", "Philosophie", "Sagesse"];

window.ARTICLES = [
  {
    slug: "arlequin-trismegiste",
    url: "https://anibal-amiot.com/articles/arlequin-trismegiste.html",
    title: "Arlequin trismégiste : la livrée de Mercure",
    dateISO: "2026-09-03",
    dateDisplay: "Publié le 3 septembre 2026",
    categories: ["Livrée", "Philosophie", "Divination"],
    excerpt: "Pourquoi Apollinaire referme un poème sur \"l'arlequin trismégiste\" ? La naissance d'Hermès, le témoignage de Niklaus et Crowley, et le geste que Baphomet partage avec le Bateleur.",
    cover: "https://anibal-amiot.com/assets/articles/arlequin-trismegiste-cover.jpg",
    coverAlt: "Arlequin : les deux croix ansées en costume de losanges"
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
    cover: "https://anibal-amiot.com/assets/articles/visconti-sforza-fou.jpg",
    coverAlt: "Le Mat (le Fou), tarot Visconti-Sforza"
  },
  {
    slug: "habit-du-grand-pretre",
    url: "https://anibal-amiot.com/articles/habit-du-grand-pretre.html",
    title: "L'habit du grand prêtre : le carré caché dans le tashbetz",
    dateISO: "2026-09-02",
    dateDisplay: "Publié le 2 septembre 2026",
    categories: ["Livrée", "Géométrie"],
    excerpt: "Dans le livre de l'Exode, deux détails du vêtement du grand prêtre — la tunique « en damier » et le carré du pectoral — dessinent, bien avant tout carré magique, la même intuition qui traverse La Livrée d'Hermès.",
    cover: "https://anibal-amiot.com/assets/articles/grand-pretre-tashbetz-1874.jpg",
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
    cover: "https://anibal-amiot.com/assets/articles/hanuman-mouth-075.jpg",
    coverAlt: "Fresque du Ramakien représentant Phra Ram et Nang Sida cachés dans la bouche géante de Hanuman"
  }
];
