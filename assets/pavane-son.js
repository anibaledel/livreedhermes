// pavane-son.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le SON de « Pavane — Voir sa musique » (prompt 211, §2, bloc 2) : les quatre sources — un morceau fourni (assets/musiques-chladni/, sur le site), un fichier choisi par la personne, le micro, une note pure —
// et un analyseur dont le spectre en dB est celui que lit le moteur (assets/pavane-moteur.js). La Web Audio API est la seule dépendance du navigateur ; rien ne quitte l'appareil : le fichier est lu sur place,
// le micro n'est jamais renvoyé vers les haut-parleurs (pas de larsen), aucun chargement distant. Une source à la fois : en lancer une arrête la précédente.
export const MORCEAUX = Object.freeze({ j1: 'j1-do-diese', j2: 'j2-la', j3: 'j3-re', j4: 'j4-mi', j5: 'j5-sol', j6: 'j6-si', j7: 'j7-do' });
export const cheminMorceau = (id) => `assets/musiques-chladni/${MORCEAUX[id]}.mp3`;
/** Le curseur de fréquence : 0 à 1000 → 110 à 1760 Hz, en échelle logarithmique (quatre octaves) ; et le chemin inverse. */
export const frequenceDuCurseur = (v) => Math.round(110 * 16 ** (v / 1000));
export const curseurDeFrequence = (hz) => Math.round(1000 * Math.log(hz / 110) / Math.log(16));

export function creerSon() {
  let ctx = null, analyseur = null, dest = null, buf = null, srcElement = null, element = null, oscillateur = null, micro = null, actif = null;
  const assurer = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('Web Audio indisponible');
      ctx = new AC();
      analyseur = ctx.createAnalyser(); analyseur.fftSize = 8192; analyseur.smoothingTimeConstant = 0; analyseur.minDecibels = -110;
      dest = ctx.createMediaStreamDestination(); buf = new Float32Array(analyseur.frequencyBinCount);
    }
    return ctx;
  };
  async function reprendre() { assurer(); if (ctx.state === 'suspended') await ctx.resume(); }
  function arreter() {
    if (element) { element.pause(); element.removeAttribute('src'); element.load(); }
    if (oscillateur) { try { oscillateur.stop(); } catch { /* déjà arrêté */ } oscillateur.disconnect(); oscillateur = null; }
    if (micro) { micro.getTracks().forEach((p) => p.stop()); micro = null; }
    actif = null;
  }
  const versHautParleurs = (oui) => { if (oui && !analyseur.__branche) { analyseur.connect(ctx.destination); analyseur.__branche = true; } else if (!oui && analyseur.__branche) { analyseur.disconnect(ctx.destination); analyseur.__branche = false; } }; // le micro n'y va jamais
  async function jouerUrl(url, type) {
    await reprendre(); arreter();
    if (!element) { element = new Audio(); element.loop = true; element.preload = 'auto'; srcElement = ctx.createMediaElementSource(element); srcElement.connect(analyseur); srcElement.connect(dest); }
    versHautParleurs(true); element.src = url; await element.play(); actif = type;
  }
  return {
    get actif() { return actif; },
    get contexte() { return ctx; },
    get flux() { assurer(); return dest.stream; },
    async jouerMorceau(id) { assurer(); return jouerUrl(new URL(`../${cheminMorceau(id)}`, import.meta.url).href, 'morceau'); },
    async jouerFichier(fichier) { assurer(); const url = URL.createObjectURL(fichier); try { await jouerUrl(url, 'fichier'); } catch (e) { URL.revokeObjectURL(url); throw e; } },
    async activerMicro() {
      await reprendre(); arreter();
      micro = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      versHautParleurs(false); const s = ctx.createMediaStreamSource(micro); s.connect(analyseur); s.connect(dest); actif = 'micro'; // le micro n'est PAS branché aux haut-parleurs
    },
    async jouerNote(hz) {
      await reprendre(); arreter();
      oscillateur = ctx.createOscillator(); oscillateur.type = 'sine'; oscillateur.frequency.value = hz;
      const gain = ctx.createGain(); gain.gain.value = 0.2; oscillateur.connect(gain); gain.connect(analyseur); gain.connect(dest); versHautParleurs(true); oscillateur.start(); actif = 'note';
    },
    changerNote(hz) { if (oscillateur) oscillateur.frequency.setTargetAtTime(hz, ctx.currentTime, 0.02); },
    arreter,
    /** Le spectre en dB de l'instant ({ db, sampleRate }) ; null si rien ne joue. */
    image() { if (!ctx || !actif) return null; analyseur.getFloatFrequencyData(buf); return { db: buf, sampleRate: ctx.sampleRate }; },
  };
}
