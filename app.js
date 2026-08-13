/* ============================================================
   ANIBAL AMIOT — moteur de la webapp
   Lit content.json, affiche la page correspondant au hash de l'URL,
   génère la navigation par boutons ("échantillons").
   Chaque page/bouton peut plus tard être remplacé par un module
   plus riche (ex: pages/tirage-livree.js) sans toucher au reste.
   ============================================================ */

const APP = {
  data: null,
  root: document.getElementById('app-root'),
  navEl: document.getElementById('swatch-nav'),
};

async function loadContent() {
  const res = await fetch('content.json');
  if (!res.ok) throw new Error('Impossible de charger content.json');
  return res.json();
}

function currentPageId() {
  const hash = window.location.hash.replace('#', '');
  return hash && APP.data.pages[hash] ? hash : 'accueil';
}

function renderNav(activeId) {
  APP.navEl.innerHTML = '';
  APP.data.nav.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'swatch-btn';
    btn.textContent = item.label;
    btn.type = 'button';
    if (item.id === activeId) btn.setAttribute('aria-current', 'page');
    btn.addEventListener('click', () => {
      window.location.hash = item.id;
    });
    APP.navEl.appendChild(btn);
  });
}

function renderPage(pageId) {
  const page = APP.data.pages[pageId];
  if (!page) return;

  document.title = page.metaTitle || APP.data.site.name;
  setMeta('description', page.metaDescription || '');

  const isPlaceholder = page.intro && page.intro.startsWith('REMPLACER');

  APP.root.innerHTML = `
    <p class="eyebrow">${escapeHtml(page.eyebrow || '')}</p>
    <h1 class="page-title">${escapeHtml(page.title || '')}</h1>
    ${isPlaceholder
      ? `<p class="placeholder-note">${escapeHtml(page.intro)}</p>`
      : `<p class="intro">${escapeHtml(page.intro || '')}</p>`}
    ${page.cta ? `<button class="cta-button" data-target="${page.cta.target}">${escapeHtml(page.cta.label)}</button>` : ''}
  `;

  const ctaBtn = APP.root.querySelector('.cta-button');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      window.location.hash = ctaBtn.dataset.target;
    });
  }
}

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function route() {
  const pageId = currentPageId();
  renderNav(pageId);
  renderPage(pageId);
}

async function init() {
  try {
    APP.data = await loadContent();
    route();
    window.addEventListener('hashchange', route);
  } catch (err) {
    APP.root.innerHTML = `<p class="placeholder-note">Erreur de chargement du contenu : ${escapeHtml(err.message)}</p>`;
  }
}

init();
