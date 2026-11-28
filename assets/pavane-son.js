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
  let ctx = null, analyseur = null, dest = null, buf = null, srcElement = null, element = null, oscillateur = null, micro = null, actif = null, essai = null;
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
    if (essai) { clearInterval(essai.timer); for (const o of essai.noeuds) { try { o.stop(); } catch { /* déjà arrêté */ } } essai = null; }
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
    /** La musique d'essai de l'ancienne « Voir sa musique » (prompt 277), même comportement : les accords de la page test de l'auteur, une note toutes les 260 ms, sur l'ancrage de 220 Hz. Jamais la source de départ. */
    async jouerEssai() {
      await reprendre(); arreter(); versHautParleurs(true);
      const noeuds = [], note = (f, t, dur, g) => { const o = ctx.createOscillator(), e = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.03); e.gain.exponentialRampToValueAtTime(0.0005, t + dur); o.connect(e); e.connect(analyseur); e.connect(dest); o.start(t); o.stop(t + dur + 0.05); noeuds.push(o); };
      const accords = [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [2, 5, 9, 14]]; let pas = 0;
      const jouer = () => { const c = accords[Math.floor(pas / 4) % 4], n = c[pas % 4], f = 220 * Math.pow(2, (n + (pas % 3) * 12) / 12); note(f, ctx.currentTime + 0.02, 0.9, 0.18); note(f * Math.sqrt(2.3), ctx.currentTime + 0.02, 0.6, 0.05); pas++; if (noeuds.length > 64) noeuds.splice(0, noeuds.length - 64); };
      essai = { noeuds, timer: setInterval(jouer, 260) }; jouer(); actif = 'essai';
    },
    changerNote(hz) { if (oscillateur) oscillateur.frequency.setTargetAtTime(hz, ctx.currentTime, 0.02); },
    arreter,
    /** Le spectre en dB de l'instant ({ db, sampleRate }) ; null si rien ne joue. */
    image() { if (!ctx || !actif) return null; analyseur.getFloatFrequencyData(buf); return { db: buf, sampleRate: ctx.sampleRate }; },
  };
}
