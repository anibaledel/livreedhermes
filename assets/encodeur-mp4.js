// encodeur-mp4.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// L'encodage HORS TEMPS RÉEL d'une animation en MP4 H.264. On ne filme pas
// l'écran : une horloge virtuelle avance image par image (k / cadence),
// chaque image est dessinée, puis encodée. Trois effets, mesurables : une
// vidéo de 30 s ne prend pas 30 s à produire ; aucune image ne saute quand la
// machine rame ; et la même recette donne les mêmes images.
//
// Le fichier, lui, doit être identique octet pour octet sur une MÊME machine
// (même navigateur, même version) : l'encodeur logiciel est demandé
// (hardwareAcceleration « prefer-software »), la quantification est fixée
// image par image quand le navigateur le permet (bitrateMode « quantizer » :
// pas de régulation de débit, qui peut dépendre du temps de calcul), et le
// MP4 est écrit sans date de création (sansDate). La CI le mesure
// (tools/check_galerie_animations.mjs, niveau 2) : une première mesure, en
// débit variable, a donné deux fichiers différents. Entre deux machines, la rastérisation et l'encodeur
// changent avec la version du navigateur et le matériel : c'est l'IMAGE qui
// est l'invariant de la recette, pas l'octet du fichier.
//
// Le H.264 n'est pas partout (Chromium et Firefox ne l'encodent pas) : sans
// lui, rien n'est produit — h264Disponible() le dit AVANT, et encoder() échoue
// bruyamment. Jamais un autre format en silence.
//
// Multiplexage : mp4-muxer 5.2.2 (MIT, assets/vendor/mp4-muxer/LICENSE),
// hébergé sur le site.

import { Muxer, ArrayBufferTarget } from './vendor/mp4-muxer/mp4-muxer.mjs';

// High, Main puis Baseline, niveau 4.0 (1080p à 30 i/s) : lisibles sur tous
// les téléphones et les réseaux sociaux.
const CODECS = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028'];

// Les modes de régulation, du plus reproductible au moins : « quantizer »
// fixe la quantification image par image (aucune régulation de débit, donc
// rien qui dépende du temps de calcul) ; « variable » vise un débit moyen.
export const MODES = ['quantizer', 'variable'];
export const QUANTIFICATION = 20; // H.264 : 0 (sans perte) … 51 ; 20, quasi transparent pour des aplats

async function configH264(largeur, hauteur, cadence, modes = MODES) {
  if (typeof VideoEncoder === 'undefined') return null;
  for (const mode of modes) {
    for (const codec of CODECS) {
      const config = {
        codec, width: largeur, height: hauteur, framerate: cadence, bitrateMode: mode,
        hardwareAcceleration: 'prefer-software', latencyMode: 'quality', avc: { format: 'avc' },
      };
      if (mode !== 'quantizer') config.bitrate = 10_000_000;
      try {
        const r = await VideoEncoder.isConfigSupported(config);
        if (r.supported) return config;
      } catch { /* configuration refusée : la suivante */ }
    }
  }
  return null;
}

// Le codec H.264 retenu pour ce format, ou null s'il n'y en a pas.
export async function h264Disponible(largeur = 1080, hauteur = 1920, cadence = 30) {
  const c = await configH264(largeur, hauteur, cadence);
  return c ? c.codec : null;
}

// Encode `images` images de `toile`, dessinées par `dessiner(k)` (synchrone ou
// non) au temps k / cadence. Renvoie les octets du MP4, sans date.
// Le résultat porte aussi, pour le diagnostic de la reproductibilité, la
// liste des morceaux encodés (type, horodatage, taille, empreinte FNV-1a) :
// deux générations qui diffèrent se comparent morceau par morceau.
// `reglage` (diagnostic) : remplace des champs de la configuration retenue —
// { bitrateMode, bitrate, latencyMode } — et toutesCles : chaque image en
// image clé, indépendante des précédentes.
export async function encoder({ toile, images, cadence, dessiner, progression = () => {}, modes = MODES, reglage = null, source = 'pixels', diagnostic = false }) {
  const { width: largeur, height: hauteur } = toile;
  const ctx2d = toile.getContext('2d', { willReadFrequently: true });
  const entrees = diagnostic ? [] : null;
  let config = await configH264(largeur, hauteur, cadence, modes);
  if (config && reglage) {
    const { toutesCles, ...champs } = reglage;
    config = { ...config, ...champs };
    if (config.bitrateMode === 'quantizer') delete config.bitrate;
    if (!(await VideoEncoder.isConfigSupported(config)).supported) throw new Error(`réglage non pris en charge : ${JSON.stringify(reglage)}`);
  }
  const toutesCles = !!(reglage && reglage.toutesCles);
  if (!config) throw new Error('MP4 H.264 indisponible sur ce navigateur : aucune vidéo produite. Utilisez Google Chrome (126 ou plus) ou Safari.');
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: largeur, height: hauteur, frameRate: cadence }, fastStart: 'in-memory' });
  let erreur = null;
  const morceaux = [];
  const enc = new VideoEncoder({
    output: (morceau, meta) => {
      const o = new Uint8Array(morceau.byteLength);
      morceau.copyTo(o);
      let h = 0x811c9dc5;
      for (let i = 0; i < o.length; i++) { h ^= o[i]; h = Math.imul(h, 0x01000193) >>> 0; }
      morceaux.push({ type: morceau.type, t: morceau.timestamp, taille: o.length, h });
      muxer.addVideoChunk(morceau, meta);
    },
    error: (e) => { erreur = e; },
  });
  enc.configure(config);
  const pas = 1e6 / cadence;
  for (let k = 0; k < images; k++) {
    if (erreur) throw erreur;
    await dessiner(k);
    const quand = { timestamp: Math.round(k * pas), duration: Math.round((k + 1) * pas) - Math.round(k * pas) };
    // L'image remise à l'encodeur : par défaut, les PIXELS lus du canevas
    // (getImageData), copiés en mémoire — une image déterministe par
    // construction. new VideoFrame(canevas) prend un instantané du canevas
    // accéléré, que la CI a mesuré non reproductible d'une génération à
    // l'autre (images d'entrée différentes dès la deuxième).
    const image = source === 'toile'
      ? new VideoFrame(toile, quand)
      : new VideoFrame(ctx2d.getImageData(0, 0, largeur, hauteur).data, { ...quand, format: 'RGBA', codedWidth: largeur, codedHeight: hauteur });
    if (entrees) {
      const t = new Uint8Array(image.allocationSize());
      await image.copyTo(t);
      let h = 0x811c9dc5;
      for (let i = 0; i < t.length; i += 7) { h ^= t[i]; h = Math.imul(h, 0x01000193) >>> 0; }
      entrees.push(h);
    }
    enc.encode(image, config.bitrateMode === 'quantizer'
      ? { keyFrame: toutesCles || k % (cadence * 2) === 0, avc: { quantizer: QUANTIFICATION } }
      : { keyFrame: toutesCles || k % (cadence * 2) === 0 });
    image.close();
    // l'encodeur garde la main : pas plus de quelques images en attente
    while (enc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 0));
    progression((k + 1) / images);
  }
  await enc.flush();
  if (erreur) throw erreur;
  enc.close();
  muxer.finalize();
  return { octets: sansDate(new Uint8Array(muxer.target.buffer)), codec: config.codec, mode: config.bitrateMode, morceaux, entrees };
}

// Le MP4 sans date : mp4-muxer écrit l'heure de création (Date.now) dans
// mvhd, tkhd et mdhd — deux fichiers de la même recette différeraient de ces
// seuls octets. On les met à 0 (le 1er janvier 1904 du format), sans toucher
// la bibliothèque : une passe sur les boîtes, après coup.
export function sansDate(octets) {
  const v = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  const CONTENEURS = new Set(['moov', 'trak', 'mdia']);
  const DATEES = new Set(['mvhd', 'tkhd', 'mdhd']);
  (function parcourir(debut, fin) {
    let p = debut;
    while (p + 8 <= fin) {
      let taille = v.getUint32(p);
      const type = String.fromCharCode(octets[p + 4], octets[p + 5], octets[p + 6], octets[p + 7]);
      let entete = 8;
      if (taille === 1) { taille = Number(v.getBigUint64(p + 8)); entete = 16; }
      if (taille === 0) taille = fin - p;
      if (taille < entete || p + taille > fin) throw new Error(`sansDate : boîte « ${type} » mal formée`);
      if (CONTENEURS.has(type)) parcourir(p + entete, p + taille);
      else if (DATEES.has(type)) {
        const version = octets[p + entete];
        const d = p + entete + 4; // après version et drapeaux
        if (version === 1) { v.setBigUint64(d, 0n); v.setBigUint64(d + 8, 0n); } else { v.setUint32(d, 0); v.setUint32(d + 4, 0); }
      }
      p += taille;
    }
  })(0, octets.length);
  return octets;
}
