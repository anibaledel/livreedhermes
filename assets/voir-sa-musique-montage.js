// voir-sa-musique-montage.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le montage de la nouvelle interface de « Voir sa musique » (prompt 211, bloc 3) dans la page musique-chladni.html et ses traductions. La section #nouvelle-interface est vide dans le HTML ; ce script y pose
// un LANCEUR (le titre et un bouton, une soixantaine de pixels : l'interface actuelle de la page reste visible sans défiler). Rien d'autre n'est chargé — ni l'interface, ni le corpus, ni les fonds — tant que la
// personne n'a pas ouvert la nouvelle interface, ou que l'adresse ne la demande (#nouvelle-interface, ou un paramètre de l'interface : ?mode=defile|spectre|entre-deux, ?fond=…). La langue est celle de
// la page (<html lang>). Les paramètres de la page (?morceau=, ?mode=avance) sont gardés quand l'interface écrit l'adresse.
const hote = document.getElementById('nouvelle-interface');
if (hote) {
  const langue = (document.documentElement.lang || 'fr').split('-')[0].toLowerCase();
  let lance = false;
  const lancer = async () => {
    if (lance) return; lance = true;
    try {
      const { monterPavane } = await import('./pavane-ui.js');
      window.__pavane = await monterPavane(hote, { langue, recherche: location.search, historique: 'fusion' });
      hote.scrollIntoView({ block: 'start' });
    } catch (e) { console.error('Nouvelle interface : montage impossible', e); lance = false; }
  };
  const q = new URLSearchParams(location.search);
  const demande = location.hash === '#nouvelle-interface' || ['mode', 'fond', 'corpus', 'trace', 'rythme', 'densite', 'palette', 'source', 'piste', 'note', 'declencheur'].some((k) => q.has(k) && !(k === 'mode' && q.get('mode') === 'avance'));
  if (demande) lancer();
  else {
    const { texte } = await import('./pavane-textes.js');
    const { SOUS_TITRE } = await import('./pavane-nom.js');
    const css = new URL('pavane.css', import.meta.url).href;
    if (!document.querySelector(`link[href="${css}"]`)) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = css; document.head.append(l); }
    hote.classList.add('pv');
    const titre = document.createElement('h2'); titre.className = 'pv-titre'; titre.append(texte(langue, 'titreApp') + ' ');
    const sous = document.createElement('span'); sous.className = 'pv-sous-titre'; sous.textContent = SOUS_TITRE; titre.append(sous);
    const bouton = document.createElement('button'); bouton.type = 'button'; bouton.className = 'pv-ouvrir'; bouton.textContent = texte(langue, 'ouvrir');
    const barre = document.createElement('div'); barre.className = 'pv-lanceur'; barre.append(titre, bouton);
    hote.replaceChildren(barre);
    bouton.addEventListener('click', lancer);
  }
}
