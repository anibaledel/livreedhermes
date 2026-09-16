/* ============================================================
   Soutien à prix libre — verrouillage des téléchargements de fichiers
   finis (SVG/PNG haute résolution des motifs, SVG/PDF du tirage, les 8
   fichiers ZIP/PDF de telechargements.html/pro-downloads/). Chargé sur de
   nombreuses pages mais n'intercepte QUE les boutons/liens listés ci-dessous
   (GATED_BUTTON_IDS + href*="pro-downloads/") — la lecture des motifs à
   l'écran, le tirage, les articles, et les PDF du livre (voir plus bas)
   ne passent jamais par ce script.

   Verrou de type UX (le clic est intercepté), pas un DRM : les fichiers
   restent statiques et servis normalement, seule l'action de clic est
   redirigée vers soutenir.html tant qu'aucun jeton valide n'est présent.

   Les PDF du livre ne sont PLUS verrouillés ici (décision de l'auteur,
   correction de l'audit du 2026-09-16) : ils sont publiés en accès libre sur
   Zenodo sous licence CC BY-NC 4.0 — un verrou ici contredirait cette
   licence. L'accès aux PAGES (telechargements.html, encodeur.html, la
   galerie, l'impression) reste entièrement libre dans tous les cas ; seul
   le TÉLÉCHARGEMENT d'un fichier fini est conditionné à une participation
   à prix libre (1€ minimum, cf. worker/).
   ============================================================ */

(function(){
  // À REMPLACER par l'URL du Worker une fois déployé (voir worker/README.md).
  const WORKER_BASE_URL = 'https://livreedhermes-soutien.anibalamiot.workers.dev';

  const TOKEN_KEY = 'soutien_token';
  const SHORT_TEXT = 'Fichier réservé aux soutiens — prix libre';
  const LONG_TEXT = "Ce site et son contenu restent entièrement gratuits, et le resteront. Le téléchargement des fichiers finis — SVG modifiables et PDF haute résolution — est réservé à celles et ceux qui choisissent de soutenir le projet, à prix libre : c'est vous qui fixez le montant. Ce soutien finance le temps de recherche, de développement et de traduction que demande ce travail, et vous donne accès aux fichiers eux-mêmes plutôt qu'à leur seul aperçu.";
  const DEFAULT_AMOUNT_EUR = 5;
  const MIN_AMOUNT_EUR = 1;

  const GATED_BUTTON_IDS = ['dlSvg', 'dlPdf', 'btnCreateSVG', 'btnPairSvgA', 'btnPairSvgB', 'btnDlCellSvg', 'btnDlPavedSvg', 'dlMotifPng'];

  let isUnlocked = false;
  let verifyDone = false;
  const pendingCaptions = [];

  async function checkAccess(){
    const token = localStorage.getItem(TOKEN_KEY);
    if(!token){ verifyDone = true; refreshUI(); return; }
    try{
      const res = await fetch(`${WORKER_BASE_URL}/verify-access?token=${encodeURIComponent(token)}&type=soutien`);
      const data = await res.json();
      isUnlocked = !!data.valid;
    }catch(e){
      isUnlocked = false;
    }
    verifyDone = true;
    refreshUI();
  }

  function refreshUI(){
    pendingCaptions.forEach(el => { el.style.display = isUnlocked ? 'none' : ''; });
  }

  function addCaption(afterEl){
    const cap = document.createElement('div');
    cap.className = 'soutien-caption';
    cap.textContent = SHORT_TEXT;
    cap.style.cssText = 'font-size:10px;letter-spacing:.04em;color:var(--dim,#f2f2f0);opacity:.75;margin-top:4px;text-align:center;';
    afterEl.insertAdjacentElement('afterend', cap);
    pendingCaptions.push(cap);
    if(verifyDone) refreshUI();
    return cap;
  }

  // ---------- modale ----------
  let modalEl = null;
  function buildModal(){
    if(modalEl) return modalEl;
    const overlay = document.createElement('div');
    overlay.id = 'soutienOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = `
      <div style="background:var(--bg,#000);border:1px solid var(--line,#242424);max-width:460px;width:100%;padding:28px 26px;color:var(--dim,#f2f2f0);font-family:Helvetica,Arial,sans-serif;">
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold,#c9a15a);margin-bottom:14px;">Soutenir le projet</div>
        <p style="font-size:13.5px;line-height:1.7;margin:0 0 20px;">${LONG_TEXT}</p>
        <label style="display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;">Montant (EUR)</label>
        <input type="number" id="soutienAmount" min="${MIN_AMOUNT_EUR}" step="1" value="${DEFAULT_AMOUNT_EUR}" style="width:100%;background:#050505;border:1px solid var(--line,#242424);color:var(--white,#f2f2f0);font-size:16px;padding:10px 12px;margin-bottom:8px;box-sizing:border-box;">
        <div id="soutienError" style="color:var(--red,#e0261b);font-size:12px;min-height:16px;margin-bottom:12px;"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" id="soutienPayBtn" style="flex:1;border:1px solid var(--red,#e0261b);background:transparent;color:var(--red,#e0261b);font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;cursor:pointer;">Soutenir et débloquer</button>
          <button type="button" id="soutienCloseBtn" style="border:1px solid var(--line,#242424);background:transparent;color:var(--dim,#f2f2f0);font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;cursor:pointer;">Annuler</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    modalEl = overlay;

    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) hideModal(); });
    overlay.querySelector('#soutienCloseBtn').addEventListener('click', hideModal);
    overlay.querySelector('#soutienPayBtn').addEventListener('click', startCheckout);
    return overlay;
  }

  function showModal(){ buildModal().style.display = 'flex'; }
  function hideModal(){ if(modalEl) modalEl.style.display = 'none'; }

  // Le VERROU (clics interceptés sur les fichiers réservés) redirige vers
  // soutenir.html plutôt que d'ouvrir la modale — showModal() reste la
  // modale réelle, toujours utilisée par le bouton "Soutenir" de
  // soutenir.html lui-même (window.SoutienGate.showModal(), voir son
  // <script> inline) : la remplacer par une redirection casserait ce
  // bouton (redirection vers sa propre page). Seuls les points
  // d'interception ci-dessous changent de comportement.
  function redirectToSoutenir(){
    window.location.href = 'https://anibal-amiot.com/soutenir.html';
  }

  async function startCheckout(){
    const input = document.getElementById('soutienAmount');
    const errorEl = document.getElementById('soutienError');
    const amountEur = parseFloat(input.value);
    errorEl.textContent = '';
    if(!Number.isFinite(amountEur) || amountEur < MIN_AMOUNT_EUR){
      errorEl.textContent = `Montant minimum : ${MIN_AMOUNT_EUR} €`;
      return;
    }
    const payBtn = document.getElementById('soutienPayBtn');
    payBtn.disabled = true;
    payBtn.textContent = 'Redirection...';
    try{
      const res = await fetch(`${WORKER_BASE_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amountEur * 100), currency: 'eur' }),
      });
      const data = await res.json();
      if(data.url){
        window.location.href = data.url;
      } else {
        errorEl.textContent = data.error || 'Erreur inattendue, réessaie plus tard.';
        payBtn.disabled = false;
        payBtn.textContent = 'Soutenir et débloquer';
      }
    }catch(e){
      errorEl.textContent = 'Impossible de contacter le service de paiement.';
      payBtn.disabled = false;
      payBtn.textContent = 'Soutenir et débloquer';
    }
  }

  // ---------- API publique ----------
  window.SoutienGate = {
    get isUnlocked(){ return isUnlocked; },
    guard(triggerFn){
      if(isUnlocked){ triggerFn(); } else { showModal(); }
    },
    showModal,
  };

  // ---------- câblage automatique ----------
  // Les PDF du livre (a.flag-btn[href*="la-livree-d-hermes-anibal-amiot-"])
  // ne sont PLUS verrouillés ici (décision de l'auteur) : ils sont publiés
  // en accès libre sur Zenodo sous CC BY-NC 4.0 — les verrouiller sur ce
  // site contredirait cette licence. wireBookPdfLinks() a été retirée.

  // Fichiers "pro" (assets/pro-downloads/*.zip, *.pdf, sur telechargements.html) :
  // liens bruts sans id, repérés par motif d'URL comme les anciens PDF du
  // livre l'étaient — même mécanique, cible différente.
  function wireProDownloadLinks(){
    const links = document.querySelectorAll('a[href*="pro-downloads/"]');
    if(!links.length) return;
    links.forEach(a=>{
      a.addEventListener('click', function(e){
        if(!isUnlocked){ e.preventDefault(); e.stopImmediatePropagation(); redirectToSoutenir(); }
      }, true); // capture : passe avant tout autre listener existant
    });
    // Une légende par ligne (chaque .pro-download-row a 2 liens — ZIP+PDF —
    // qui partagent le même verrou), pas une par lien.
    const rows = new Set();
    links.forEach(a => { const row = a.closest('.pro-download-row'); if(row) rows.add(row); });
    rows.forEach(row => addCaption(row));
  }

  // Délégation sur `document`, en phase de capture : se déclenche AVANT le
  // gestionnaire de clic propre à chaque bouton, même si celui-ci a été
  // enregistré avant nous (le placement du <script> dans la page ne
  // garantit pas l'ordre pour les listeners portés par le même élément) —
  // et fonctionne aussi pour les boutons créés dynamiquement après une
  // interaction utilisateur (comparaison par paire, cellule de galerie
  // sélectionnée, export PNG haute résolution), qui n'existent pas encore
  // au chargement de la page.
  function wireGatedButtonsDelegated(){
    document.addEventListener('click', function(e){
      const el = e.target.closest(GATED_BUTTON_IDS.map(id=>'#'+id).join(','));
      if(!el) return;
      if(!isUnlocked){ e.preventDefault(); e.stopImmediatePropagation(); redirectToSoutenir(); }
    }, true);
  }

  // Ajoute la légende sous chaque bouton dès qu'il apparaît dans le DOM
  // (certains sont créés dynamiquement après une interaction utilisateur).
  const captionedIds = new Set();
  function tryCaptionAll(){
    GATED_BUTTON_IDS.forEach(id=>{
      if(captionedIds.has(id)) return;
      const el = document.getElementById(id);
      if(el){ addCaption(el); captionedIds.add(id); }
    });
  }
  function watchForDynamicButtons(){
    tryCaptionAll();
    const observer = new MutationObserver(tryCaptionAll);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init(){
    wireProDownloadLinks();
    wireGatedButtonsDelegated();
    watchForDynamicButtons();
    checkAccess();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
