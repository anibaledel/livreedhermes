// trois-portes.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// La barre « Trois portes » : un bouton par page sonore, avec sa ligne de rôle.
//   Cymatique ........ le son CRÉE la forme  (chladni.html)
//   Voir sa musique .. le son GUIDE          (musique-chladni.html)
//   Fond d'écran ..... le son S'EFFACE       (fonds-ecran.html)
// Elle vit dans ces trois pages seulement (ce n'est PAS un élément de la navigation engendrée par nav-tiles.js) :
// chaque page porte <nav class="trois-portes" data-page="chladni|musique|fonds"></nav> sous son titre, et ce module la remplit.
// La langue est celle de <html lang> et suit ses changements (chladni.html la change sans recharger). Une langue sans texte, ou un texte
// manquant, retombe sur le français (liste des textes à traduire : docs/i18n/i18n_todo_trois-portes.md). Les adresses sont absolues
// depuis la racine du site ; une langue sans page traduite renvoie vers la page française.
const PORTES = ['chladni', 'musique', 'fonds'];
const ADRESSES = {
  fr: { chladni: '/chladni.html', musique: '/musique-chladni.html', fonds: '/fonds-ecran.html' },
  en: { chladni: '/en/chladni/', fonds: '/en/wallpapers/' },
  es: { chladni: '/es/chladni/', fonds: '/es/fondos-de-pantalla/' },
  th: { chladni: '/th/chladni/', fonds: '/th/wallpapers/' },
};
export const TEXTES = {
  fr: { titre: 'Les trois pages sonores', chladni: ['Cymatique', 'Le son crée la forme'], musique: ['Voir sa musique', 'Le son guide'], fonds: ['Fond d\'écran', 'Le son s\'efface'] },
  en: { titre: 'The three sound pages', chladni: ['Cymatics', 'Sound creates the form'], musique: ['See your music', 'Sound guides'], fonds: ['Wallpaper', 'Sound fades away'] },
};
export const texte = (cle, langue) => (TEXTES[langue] && TEXTES[langue][cle]) || TEXTES.fr[cle];
export const adresse = (porte, langue) => (ADRESSES[langue] && ADRESSES[langue][porte]) || ADRESSES.fr[porte];

function dessiner(nav) {
  const langue = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase(), courante = nav.dataset.page;
  nav.setAttribute('aria-label', texte('titre', langue)); nav.replaceChildren();
  for (const p of PORTES) {
    const [libelle, role] = texte(p, langue), a = document.createElement('a');
    a.className = 'trois-portes-btn'; a.href = adresse(p, langue);
    if (p === courante) a.setAttribute('aria-current', 'page');
    const l = document.createElement('span'), r = document.createElement('span');
    l.className = 'trois-portes-libelle'; l.textContent = libelle; r.className = 'trois-portes-role'; r.textContent = role;
    a.append(l, r); nav.append(a);
  }
}
function demarrer() {
  const barres = [...document.querySelectorAll('nav.trois-portes[data-page]')]; if (!barres.length) return;
  barres.forEach(dessiner);
  new MutationObserver(() => barres.forEach(dessiner)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
