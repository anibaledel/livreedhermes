// musique-chladni-semaine.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le bloc « La semaine » de la page « Voir sa musique » : sept cartes (une affiche, « Jour N — tonalité »,
// la date de publication, un lecteur intégré à la demande), alimentées par UN fichier de données,
// data/musique-chladni/semaine.json — le seul à changer chaque semaine (procédure : README.md du dossier).
//
// Les vidéos ne sont pas hébergées par le site : elles vivent sur YouTube (Shorts) et TikTok. Principe de la
// page : elle n'envoie rien sans action. Aucun script ni aucune ressource de YouTube ou de TikTok n'est
// chargé avant le clic du visiteur sur l'affiche ; le clic charge l'intégration (YouTube par
// youtube-nocookie.com, sans lecture automatique ; TikTok par son lecteur intégré officiel, chargé à ce
// moment-là seulement). Le lien direct reste affiché sous le lecteur, au cas où l'intégration échoue.
// Une carte sans youtube ni tiktok ne montre que son affiche et « bientôt ». Fichier absent, vide ou
// illisible : le bloc entier reste masqué, sans exception.
import { texte as T } from './musique-chladni-textes.js';

const FICHIER = 'data/musique-chladni/semaine.json';
const el = (tag, attrs = {}, ...enfants) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); }
  for (const c of enfants.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};
const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
/** L'identifiant d'une vidéo TikTok lue dans son URL (https://www.tiktok.com/@compte/video/123…), ou null (lien court : lien direct seulement). */
export const idTiktok = (url) => { try { const u = new URL(url); return /(^|\.)tiktok\.com$/.test(u.hostname) && u.protocol === 'https:' ? ((/\/video\/(\d+)/.exec(u.pathname) || [])[1] || null) : null; } catch { return null; } };
const urlSure = (url) => { try { const u = new URL(url); return u.protocol === 'https:' && /(^|\.)tiktok\.com$/.test(u.hostname) ? u.href : null; } catch { return null; } };
const dateFr = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return ''; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); };

function lecteurYoutube(zone, jour) {
  const f = el('iframe', { src: `https://www.youtube-nocookie.com/embed/${jour.youtube}?rel=0&playsinline=1`, title: T('lecteurTitre', { n: jour.n }), allow: 'encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin', loading: 'lazy' });
  zone.replaceChildren(f);
}
function lecteurTiktok(zone, jour) {
  const id = idTiktok(jour.tiktok); if (!id) return;
  zone.replaceChildren(el('blockquote', { class: 'tiktok-embed', cite: jour.tiktok, 'data-video-id': id }, el('section')));
  const s = document.createElement('script'); s.async = true; s.src = 'https://www.tiktok.com/embed.js'; document.body.append(s);
}

function carte(jour) {
  const yt = ID_YOUTUBE.test(jour.youtube || '') ? jour.youtube : null, tk = urlSure(jour.tiktok);
  const jr = { ...jour, youtube: yt, tiktok: tk };
  const zone = el('div', { class: 'vm-jour-zone' });
  const img = el('img', { src: jour.affiche, alt: T('afficheAlt', { n: jour.n, tonalite: jour.tonalite }), width: 360, height: 640, loading: 'lazy' });
  const date = dateFr(jour.date);
  const liens = el('p', { class: 'vm-jour-liens', hidden: true }, yt ? el('a', { href: `https://www.youtube.com/watch?v=${yt}`, rel: 'noopener noreferrer', target: '_blank' }, T('voirYoutube')) : null, tk ? el('a', { href: tk, rel: 'noopener noreferrer', target: '_blank' }, T('voirTiktok')) : null);
  const lancer = (service) => { (service === 'tiktok' ? lecteurTiktok : lecteurYoutube)(zone, jr); liens.hidden = false; zone.classList.add('vm-jour-lu'); };
  if (yt || tk) zone.append(el('button', { type: 'button', class: 'vm-jour-aff', 'aria-label': T('lire', { n: jour.n, tonalite: jour.tonalite }), onclick: () => lancer(yt ? 'youtube' : 'tiktok') }, img));
  else zone.append(el('div', { class: 'vm-jour-aff vm-jour-sans' }, img));
  const pied = [];
  if (yt && idTiktok(tk)) pied.push(el('button', { type: 'button', class: 'vm-jour-autre', onclick: () => lancer('tiktok') }, T('lireTiktok')));
  return el('article', { class: 'vm-jour', 'aria-label': T('jourTitre', { n: jour.n, tonalite: jour.tonalite }) },
    zone, el('h3', {}, T('jourTitre', { n: jour.n, tonalite: jour.tonalite })), date ? el('p', { class: 'vm-jour-date' }, T('datePub', { date })) : null,
    yt || tk ? null : el('p', { class: 'vm-jour-bientot' }, T('bientot')), ...pied, liens);
}

/** Monte le bloc ; ne rend rien, et ne lève rien, si le fichier manque ou ne contient aucun jour valide. */
export async function monterSemaine() {
  const bloc = document.getElementById('vmSemaine'); if (!bloc) return;
  let d = null;
  try { const r = await fetch(FICHIER); if (r.ok) d = await r.json(); } catch { d = null; }
  const jours = d && Array.isArray(d.jours) ? d.jours.filter((j) => j && Number.isInteger(j.n) && j.n >= 1 && j.n <= 7 && j.affiche && j.tonalite).sort((a, b) => a.n - b.n).slice(0, 7) : [];
  if (!jours.length) { bloc.hidden = true; return; }
  document.getElementById('vmSemaineTitre').textContent = d.titre ? `${T('semaineTitre')} — ${d.titre}` : T('semaineTitre');
  document.getElementById('vmSemaineMention').textContent = T('semaineMention');
  document.getElementById('vmSemaineTiers').textContent = T('semaineTiers');
  document.getElementById('vmSemaineGrille').replaceChildren(...jours.map(carte));
  bloc.hidden = false;
}
