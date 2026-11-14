# Essai des enregistrements de « Voir sa musique » (14 nov. 2026)

`node scripts/essai-musique-chladni-enregistrements.mjs` : Chromium (Playwright), morceau fourni j1, collection « tri », ordre 12, les 9 enregistrements de 15 s (3 cadrages × 3 formats), puis `ffprobe` et `ffmpeg`.

**Ce que ce Chromium sait faire** : `MediaRecorder` écrit H.264 dans un MP4 (`video/mp4;codecs=avc1`), mais **pas d'AAC** (`video/mp4;codecs="avc1.640028,mp4a.40.2"` : non ; `AudioEncoder` avec `mp4a.40.2` : non). La page retombe donc sur H.264 + Opus et le dit à l'écran. Chrome de bureau récent écrit l'AAC en direct : ce chemin n'a pas pu être essayé ici.

| fichier | vidéo | audio | durée (s) | octets | décodage ffmpeg |
|---|---|---|---|---|---|
| signes-916 (1080×1920) | h264 | opus | 14,96 | 4 710 609 | ok |
| signes-45 (1080×1350) | h264 | opus | 14,96 | 4 503 782 | ok |
| signes-11 (1080×1080) | h264 | opus | 14,96 | 4 570 879 | ok |
| lignes-916 | h264 | opus | 14,96 | 4 738 727 | ok |
| lignes-45 | h264 | opus | 14,96 | 5 276 166 | ok |
| lignes-11 | h264 | opus | 15,00 | 4 888 705 | ok |
| pavage-916 | h264 | opus | 14,96 | 3 198 223 | ok |
| pavage-45 | h264 | opus | 14,96 | 2 655 891 | ok |
| pavage-11 | h264 | opus | 14,99 | 2 997 331 | ok |

« ok » : code de sortie 0 et aucune ligne d'erreur hormis l'avertissement du muxeur `null` (« non monotonically increasing dts ») : MediaRecorder date les images au 1/1000 s, deux images voisines peuvent recevoir le même dts. Le script compte ces avertissements à part (6 à 62 par fichier).

**Défaut trouvé par cet essai et corrigé** : au premier passage, 8 fichiers sur 9 n'avaient **aucune piste audio**. `onstop` arrêtait toutes les pistes du flux, y compris celle, partagée, du nœud audio de la page : tout enregistrement après le premier, sans recharger la page, sortait muet. Le flux reçoit maintenant des clones des pistes audio.
