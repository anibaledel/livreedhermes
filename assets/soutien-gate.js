/* ============================================================
   Soutien à prix libre — verrouillage des téléchargements SVG/PDF.
   Chargé sur toutes les pages qui proposent un téléchargement SVG ou PDF
   (motifs, galerie 884, impression, PDF du livre). N'intercepte QUE ces
   boutons — la lecture des motifs à l'écran, le tirage, les articles et
   les viewers du livre (fr/livre, en/book, es/libro, th/book) ne passent
   jamais par ce script.

   Verrou de type UX (le clic est intercepté) : les fichiers PDF du livre
   restent des fichiers statiques publics sur l'hébergement, dont les URLs
   sont déjà publiées dans sitemap-pdf.xml et le JSON-LD Book pour le
   référencement — ce n'est pas un DRM sur les fichiers eux-mêmes.
   ============================================================ */

(function(){
  // À REMPLACER par l'URL du Worker une fois déployé (voir worker/README.md).
  const WORKER_BASE_URL = 'https://livreedhermes-soutien.anibalamiot.workers.dev';

  const TOKEN_KEY = 'soutien_token';
  const SHORT_TEXT = 'Fichier réservé aux soutiens — prix libre';
  const LONG_TEXT = "Ce site et son contenu restent entièrement gratuits, et le resteront. Le téléchargement des fichiers finis — SVG modifiables et PDF haute résolution — est réservé à celles et ceux qui choisissent de soutenir le projet, à prix libre : c'est vous qui fixez le montant. Ce soutien finance le temps de recherche, de développement et de traduction que demande ce travail, et vous donne accès aux fichiers eux-mêmes plutôt qu'à leur seul aperçu.";
  const DEFAULT_AMOUNT_EUR = 5;
  const MIN_AMOUNT_EUR = 1;

  const SVG_BUTTON_IDS = ['dlSvg', 'dlPdf', 'btnCreateSVG', 'btnPairSvgA', 'btnPairSvgB', 'btnDlCellSvg', 'btnDlPavedSvg'];

  let isUnlocked = false;
  let verifyDone = false;
  const pendingCaptions = [];

  async function checkAccess(){
    const token = localStorage.getItem(TOKEN_KEY);
    if(!token){ verifyDone = true; refreshUI(); return; }
    try{
      const res = await fetch(`${WORKER_BASE_URL}/verify-access?token=${encodeURIComponent(token)}`);
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
  };

  // ---------- câblage automatique ----------
  function wireBookPdfLinks(){
    const links = document.querySelectorAll('a.flag-btn[href*="la-livree-d-hermes-anibal-amiot-"][href$=".pdf"]');
    if(!links.length) return;
    links.forEach(a=>{
      a.addEventListener('click', function(e){
        if(!isUnlocked){ e.preventDefault(); e.stopImmediatePropagation(); showModal(); }
      }, true); // capture : passe avant tout autre listener existant
    });
    // Une seule légende sous tout le groupe de drapeaux plutôt que 4 répétitions
    // côte à côte (les 4 drapeaux partagent le même verrou / le même jeton).
    const group = links[0].closest('.flags') || links[0].parentElement;
    addCaption(group);
  }

  // Délégation sur `document`, en phase de capture : se déclenche AVANT le
  // gestionnaire de clic propre à chaque bouton, même si celui-ci a été
  // enregistré avant nous (le placement du <script> dans la page ne
  // garantit pas l'ordre pour les listeners portés par le même élément) —
  // et fonctionne aussi pour les boutons créés dynamiquement après une
  // interaction utilisateur (comparaison par paire, cellule de galerie
  // sélectionnée), qui n'existent pas encore au chargement de la page.
  function wireSvgButtonsDelegated(){
    document.addEventListener('click', function(e){
      const el = e.target.closest(SVG_BUTTON_IDS.map(id=>'#'+id).join(','));
      if(!el) return;
      if(!isUnlocked){ e.preventDefault(); e.stopImmediatePropagation(); showModal(); }
    }, true);
  }

  // Ajoute la légende sous chaque bouton dès qu'il apparaît dans le DOM
  // (certains sont créés dynamiquement après une interaction utilisateur).
  const captionedIds = new Set();
  function tryCaptionAll(){
    SVG_BUTTON_IDS.forEach(id=>{
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
    wireBookPdfLinks();
    wireSvgButtonsDelegated();
    watchForDynamicButtons();
    checkAccess();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
