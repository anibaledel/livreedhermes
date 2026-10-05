// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// La galerie d'animations, sur ses sept pages (l'entrée et six groupes) et dans
// ses huit langues. Les pages sont ÉCRITES par scripts/build-galerie-animations.js
// depuis data/galerie-animations.json : chaque carte y est déjà, avec sa
// vignette (lisible sans JavaScript, et par un moteur). Ce module ne fait que
// les animer : il lit le registre (data/fonds/collections-pinterest.json) et
// importe le moteur (assets/animation-collection.js) ; la recette est fixée au
// registre, la vue (vitesse, couleurs) est au visiteur, dans l'URL.
//
// Trois usages, une ligne de partage nette :
//   l'animation de référence  un MP4 déposé, lu comme une vidéo (tout visiteur) — encodé
//                             HORS navigateur par ffmpeg / libx264 (tools/video_reference.mjs),
//                             fichier reproductible octet pour octet ;
//   une variante              rendue en direct sur le canevas, sans encodeur (tout visiteur) ;
//   le MP4 d'une variante     l'encodeur DU NAVIGATEUR, si le navigateur a le H.264 — sinon
//                             il le dit ; images identiques garanties, pas l'octet.
//
// Rien ne se charge avant un clic, et une seule animation joue à la fois, sur
// chacune des pages.
import { chargerAnimations, creerRendu, nomFichier, FORMATS, VITESSES } from './animation-collection.js';
import { encoder, h264Disponible } from './encodeur-mp4.js';

const RACINE = new URL('../', import.meta.url);
const donnees = JSON.parse(document.getElementById('galerie-donnees').textContent);
const T = donnees.textes;
const HEX = /^[0-9a-f]{6}$/i;
const remplir = (gabarit, valeurs) => gabarit.replace(/\{(\w+)\}/g, (m, k) => (k in valeurs ? valeurs[k] : m));
const decimale = (x) => String(x).replace('.', T.decimale);
const versSite = (chemin) => new URL(chemin, RACINE).href;

// Les anciennes adresses (galerie-animations.html?collection=B6D#B6D, partagées
// avant le découpage) mènent à la page du groupe, vue comprise.
const q0 = new URLSearchParams(location.search);
const demande = q0.get('collection') || decodeURIComponent(location.hash.slice(1));
if (donnees.page === 'entree' && demande && donnees.groupeDe[demande]) {
  location.replace(`${donnees.groupeDe[demande]}${location.search}#${encodeURIComponent(demande)}`);
  await new Promise(() => {}); // la page s'en va : rien d'autre ne se charge ici
}

// ---- une seule animation à la fois ----------------------------------------
let arreterCourante = null;
function prendreLaMain(carte, arreter) {
  if (arreterCourante) arreterCourante();
  document.querySelectorAll('.anim-carte.active').forEach((c) => c.classList.remove('active'));
  carte.classList.add('active');
  arreterCourante = () => { arreter(); carte.classList.remove('active'); arreterCourante = null; };
}

// ---- la vue dans l'URL : ?collection=…&vitesse=…&c0=…&c1=… -----------------
function vueDeLUrl(code, defaut) {
  const q = new URLSearchParams(location.search);
  if (q.get('collection') !== code) return { vitesse: 1, palette: defaut.slice() };
  const v = Number(q.get('vitesse'));
  const c = (k, d) => (HEX.test((q.get(k) || '').replace('#', '')) ? `#${q.get(k).replace('#', '').toLowerCase()}` : d);
  return { vitesse: VITESSES.includes(v) ? v : 1, palette: [c('c0', defaut[0]), c('c1', defaut[1])] };
}
function adresseDe(code, vue, defaut) {
  const q = new URLSearchParams({ collection: code });
  if (vue.vitesse !== 1) q.set('vitesse', String(vue.vitesse));
  if (vue.palette.join() !== defaut.join()) { q.set('c0', vue.palette[0].slice(1)); q.set('c1', vue.palette[1].slice(1)); }
  return `${location.origin}${location.pathname}?${q}#${code}`;
}

function telecharger(blob, nom) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nom;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}
async function sha256(octets) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', octets));
  return [...h].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const bouton = (classe, texte) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = classe; b.textContent = texte;
  return b;
};

const { registre } = await chargerAnimations();
const cartes = [...document.querySelectorAll('.anim-carte[data-code]')];
const complete = cartes.some((c) => !c.classList.contains('anim-temoin'));
const h264 = complete ? await h264Disponible(1080, 1920, 30) : null;

for (const carte of cartes) {
  const code = carte.dataset.code;
  const col = registre.collections[code];
  if (!col || !col.recette) continue;
  const rec = col.recette;
  const temoin = carte.classList.contains('anim-temoin');
  const defaut = col.palette.slice();
  let vue = temoin ? { vitesse: 1, palette: defaut.slice() } : vueDeLUrl(code, defaut);
  const ecran = carte.querySelector('.anim-ecran');
  const repos = ecran.innerHTML; // la vignette écrite dans la page
  const egale = () => vue.vitesse === 1 && vue.palette.join() === defaut.join();

  // la vignette, ou l'attente : rien d'autre ne se charge avant un clic
  function afficherRepos() {
    if (col.video) { ecran.innerHTML = repos; return; }
    ecran.innerHTML = `<div class="anim-attente"><span class="anim-pastilles" aria-hidden="true"><i style="background:${vue.palette[0]}"></i><i style="background:${vue.palette[1]}"></i></span><b>${remplir(T.collection, { code })}</b>${T.attente}</div>`;
  }
  afficherRepos();

  const outils = document.createElement('div');
  outils.className = 'anim-outils';
  outils.innerHTML = `<div class="anim-boutons"></div>${temoin ? '' : `
    <div class="anim-vue">
      <label>${T.vitesse} <select class="v-vitesse">${VITESSES.map((v) => `<option value="${v}">${decimale(v)} ×</option>`).join('')}</select></label>
      <label>${T.fond} <input type="color" class="v-c0"></label>
      <label>${T.figure} <input type="color" class="v-c1"></label>
      <button type="button" class="v-defaut">${T.couleursOrigine}</button>
    </div>
    <div class="anim-partage"></div>
    <div class="anim-generateur">
      <span class="anim-titre">${T.genererTitre}</span>
      <div class="anim-boutons">
        <label class="anim-meta">${T.format} <select class="g-format">${Object.entries(FORMATS).map(([k, f]) => `<option value="${k}">${f.libelle}</option>`).join('')}</select></label>
        <button type="button" class="g-generer">${T.generer}</button>
      </div>
      <progress class="g-progression" max="1" value="0" hidden></progress>
      <p class="anim-etat g-etat"></p>
    </div>`}`;
  const lienGroupe = carte.querySelector(':scope > .anim-lien-groupe');
  if (lienGroupe) carte.insertBefore(outils, lienGroupe); else carte.appendChild(outils);
  const $ = (s) => outils.querySelector(s);

  // la vidéo de référence (déposée) — seulement à la vue d'origine ; l'affiche
  // du lecteur est la grande vignette, pas le PNG de 2,8 Mo
  const boutons = $('.anim-boutons');
  if (col.video) {
    const lire = bouton('b-video', T.lireVideo);
    lire.addEventListener('click', () => {
      const v = document.createElement('video');
      v.src = versSite(col.video.fichier); v.controls = true; v.playsInline = true; v.autoplay = true;
      v.poster = versSite(carte.dataset.affiche || col.video.affiche);
      ecran.innerHTML = ''; ecran.appendChild(v);
      prendreLaMain(carte, () => { v.pause(); afficherRepos(); });
    });
    boutons.appendChild(lire);
  }
  // l'aperçu en direct : le canevas, sans encodeur, à la vue choisie
  const apercu = bouton('b-apercu', T.apercu);
  apercu.addEventListener('click', async () => {
    const canevas = document.createElement('canvas');
    const r = ecran.getBoundingClientRect();
    const dpr = Math.max(1, devicePixelRatio || 1);
    canevas.width = Math.round(r.width * dpr); canevas.height = Math.round(r.height * dpr);
    canevas.setAttribute('role', 'img');
    canevas.setAttribute('aria-label', remplir(T.ariaApercu, { code }));
    let fini = false, raf = 0;
    prendreLaMain(carte, () => { fini = true; cancelAnimationFrame(raf); afficherRepos(); });
    const rendu = await creerRendu({ code, vue: { ...vue, palette: vue.palette.slice() }, largeur: canevas.width, hauteur: canevas.height });
    if (fini) return;
    ecran.innerHTML = ''; ecran.appendChild(canevas);
    const ctx = canevas.getContext('2d');
    let t0 = null;
    const image = (now) => { if (fini) return; t0 ??= now; rendu.dessiner(ctx, ((now - t0) / 1000) % rendu.duree); raf = requestAnimationFrame(image); };
    raf = requestAnimationFrame(image);
  });
  boutons.appendChild(apercu);
  const arreter = bouton('b-arreter', T.arreter);
  arreter.addEventListener('click', () => { if (carte.classList.contains('active') && arreterCourante) arreterCourante(); });
  boutons.appendChild(arreter);
  if (temoin) continue;

  // la vue : vitesse et couleurs, dans l'URL
  $('.v-vitesse').value = String(vue.vitesse);
  [$('.v-c0').value, $('.v-c1').value] = vue.palette;
  function changerVue() {
    vue = { vitesse: Number($('.v-vitesse').value), palette: [$('.v-c0').value, $('.v-c1').value] };
    history.replaceState(null, '', adresseDe(code, vue, defaut).replace(location.origin, ''));
    majPartage();
    const enApercu = carte.classList.contains('active') && ecran.querySelector('canvas');
    if (carte.classList.contains('active') && arreterCourante) arreterCourante();
    if (enApercu) apercu.click(); else afficherRepos();
  }
  $('.v-vitesse').addEventListener('change', changerVue);
  $('.v-c0').addEventListener('change', changerVue);
  $('.v-c1').addEventListener('change', changerVue);
  $('.v-defaut').addEventListener('click', () => { [$('.v-c0').value, $('.v-c1').value] = defaut; changerVue(); });

  // partager, honnêtement : télécharger (le vrai geste), copier le lien, et le
  // partage natif seulement là où il existe
  const partage = $('.anim-partage');
  function majPartage() {
    partage.innerHTML = '';
    if (col.video && egale()) {
      const a = document.createElement('a');
      a.className = 'anim-lien'; a.href = versSite(col.video.fichier); a.download = col.video.fichier.split('/').pop(); a.textContent = T.telecharger;
      partage.appendChild(a);
    }
    const copier = bouton('', T.copier);
    copier.addEventListener('click', async () => {
      const url = adresseDe(code, vue, defaut);
      try { await navigator.clipboard.writeText(url); copier.textContent = T.copie; } catch { prompt(T.promptLien, url); }
      setTimeout(() => { copier.textContent = T.copier; }, 2000);
    });
    partage.appendChild(copier);
    if (col.video && egale() && navigator.canShare && navigator.canShare({ files: [new File([''], 'x.mp4', { type: 'video/mp4' })] })) {
      const natif = bouton('', T.partager);
      natif.addEventListener('click', async () => {
        const blob = await (await fetch(versSite(col.video.fichier))).blob();
        try { await navigator.share({ files: [new File([blob], col.video.fichier.split('/').pop(), { type: 'video/mp4' })], title: `${remplir(T.collection, { code })} — La Livrée d'Hermès`, url: adresseDe(code, vue, defaut) }); } catch { /* partage annulé */ }
      });
      partage.appendChild(natif);
    }
  }
  majPartage();

  // le générateur : hors temps réel, H.264 ou rien (un outil pour Anibal, sur une page que tout le monde peut voir)
  const etat = $('.g-etat');
  if (!h264) { $('.g-generer').disabled = true; etat.textContent = T.raisonH264; etat.classList.add('refus'); }
  else etat.textContent = remplir(T.formatAnnonce, { codec: h264, ips: rec.imagesParSeconde });
  $('.g-generer').addEventListener('click', async () => {
    const format = FORMATS[$('.g-format').value];
    const toile = document.createElement('canvas');
    toile.width = format.largeur; toile.height = format.hauteur;
    const v = { ...vue, palette: vue.palette.slice() };
    $('.g-generer').disabled = true;
    const barre = $('.g-progression'); barre.hidden = false; barre.value = 0;
    etat.classList.remove('refus');
    try {
      const t0 = performance.now();
      const rendu = await creerRendu({ code, vue: v, largeur: format.largeur, hauteur: format.hauteur });
      const ctx = toile.getContext('2d');
      const { octets, codec, mode, morceaux } = await encoder({ toile, images: rendu.images, cadence: rec.imagesParSeconde,
        dessiner: (k) => rendu.dessiner(ctx, k / rec.imagesParSeconde), progression: (x) => { barre.value = x; } });
      const nom = nomFichier(code, $('.g-format').value, v, defaut);
      telecharger(new Blob([octets], { type: 'video/mp4' }), nom);
      const empreinte = await sha256(octets);
      etat.textContent = remplir(T.resultat, { nom, images: rendu.images, mo: decimale((octets.length / 1e6).toFixed(2)), codec, mode: mode === 'quantizer' ? T.quantification : T.debit, s: decimale(((performance.now() - t0) / 1000).toFixed(1)), sha: empreinte });
      window.derniereGeneration = { nom, octets: octets.length, sha256: empreinte, mode, morceaux };
    } catch (e) {
      etat.textContent = e.message; etat.classList.add('refus');
    } finally {
      $('.g-generer').disabled = !h264; barre.hidden = true;
    }
  });
}
const cible = q0.get('collection') || decodeURIComponent(location.hash.slice(1));
if (cible && document.getElementById(cible)) document.getElementById(cible).scrollIntoView();
window.galeriePrete = true;
