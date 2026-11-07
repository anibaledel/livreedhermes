# Traductions à relire — la convention des deux numéros d'hexagramme (pages hexagrammes et fiches de motifs)

Traductions faites par IA (Claude), le 2026-11-07, à relire.

Convention écrite partout : **index binaire (0 à 63, ordre du système)** et **numéro traditionnel King Wen**, côte à côte (Fu : binaire 1, King Wen 24 ; Kun : binaire 0, King Wen 2).

À relire :
- pages hexagrammes (`scripts/generate-hexagram-pages-traduites.js`, objets `L.en`, `L.es`, `L.th` : `hexName`, `title`, `alt`, `sub`, `motifsComplement`) — **es, th** surtout (en : phrase simple) ;
- fiches de motifs : phrase de convention (`scripts/generate-motif-pages.js`, `articleSub`) — fr et en seulement.

Contrôle : `node tools/check_hexagrammes_deux_numeros.mjs` (aucune mention numérotée sans ses deux numéros).
