/* ============================================================
   Palier "Pro" — paiement unique à prix fixe (99 €), distinct du soutien à
   prix libre (assets/soutien-gate.js). Jeton stocké sous une clé
   localStorage différente ('pro_token' vs 'soutien_token') et vérifié
   auprès du Worker avec &type=pro, donc un jeton soutien ne débloque
   jamais le contenu pro, et inversement.

   Contrairement à soutien-gate.js (qui cible des IDs de boutons connus à
   l'avance), le contenu pro n'est pas encore défini : ce script expose des
   attributs génériques réutilisables par n'importe quelle future page pro :
     - [data-pro-locked] sur un lien/bouton : clic intercepté tant que le
       palier pro n'est pas débloqué (ouvre la modale d'achat).
     - [data-pro-only] sur un conteneur : masqué tant que verrouillé, affiché
       une fois débloqué (mettre le contenu réservé aux membres pro dedans).
     - [data-pro-locked-only] sur un conteneur : l'inverse — affiché
       uniquement tant que verrouillé (message d'invite à l'achat).
   ============================================================ */

(function(){
  // Même Worker que soutien-gate.js (même infrastructure Stripe + KV).
  const WORKER_BASE_URL = 'https://livreedhermes-soutien.anibalamiot.workers.dev';

  const TOKEN_KEY = 'pro_token';
  const PRICE_LABEL = '99 €';
  const LONG_TEXT = "L'accès Pro est un paiement unique de 99 € (pas d'abonnement) qui débloque le téléchargement complet des motifs (PDF et SVG) ainsi que les pages réservées aux membres Pro du site.";

  let isUnlocked = false;
  let verifyDone = false;
  const onlyEls = [];
  const lockedOnlyEls = [];

  async function checkAccess(){
    const token = localStorage.getItem(TOKEN_KEY);
    if(!token){ verifyDone = true; refreshUI(); return; }
    try{
      const res = await fetch(`${WORKER_BASE_URL}/verify-access?token=${encodeURIComponent(token)}&type=pro`);
      const data = await res.json();
      isUnlocked = !!data.valid;
    }catch(e){
      isUnlocked = false;
    }
    verifyDone = true;
    refreshUI();
  }

  function refreshUI(){
    onlyEls.forEach(el => { el.hidden = !isUnlocked; });
    lockedOnlyEls.forEach(el => { el.hidden = isUnlocked; });
  }

  // ---------- modale ----------
  let modalEl = null;
  function buildModal(){
    if(modalEl) return modalEl;
    const overlay = document.createElement('div');
    overlay.id = 'proOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = `
      <div style="background:var(--bg,#000);border:1px solid var(--line,#242424);max-width:460px;width:100%;padding:28px 26px;color:var(--dim,#f2f2f0);font-family:Helvetica,Arial,sans-serif;">
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold,#c9a15a);margin-bottom:14px;">Accès Pro</div>
        <p style="font-size:13.5px;line-height:1.7;margin:0 0 20px;">${LONG_TEXT}</p>
        <div style="font-size:22px;color:var(--gold,#c9a15a);margin-bottom:20px;">${PRICE_LABEL} <span style="font-size:11px;color:var(--dim,#f2f2f0);text-transform:uppercase;letter-spacing:.06em;">paiement unique</span></div>
        <div id="proError" style="color:var(--red,#e0261b);font-size:12px;min-height:16px;margin-bottom:12px;"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" id="proPayBtn" style="flex:1;border:1px solid var(--red,#e0261b);background:transparent;color:var(--red,#e0261b);font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;cursor:pointer;">Devenir membre Pro — ${PRICE_LABEL}</button>
          <button type="button" id="proCloseBtn" style="border:1px solid var(--line,#242424);background:transparent;color:var(--dim,#f2f2f0);font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;cursor:pointer;">Annuler</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    modalEl = overlay;

    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) hideModal(); });
    overlay.querySelector('#proCloseBtn').addEventListener('click', hideModal);
    overlay.querySelector('#proPayBtn').addEventListener('click', startCheckout);
    return overlay;
  }

  function showModal(){ buildModal().style.display = 'flex'; }
  function hideModal(){ if(modalEl) modalEl.style.display = 'none'; }

  async function startCheckout(){
    const errorEl = document.getElementById('proError');
    const payBtn = document.getElementById('proPayBtn');
    errorEl.textContent = '';
    payBtn.disabled = true;
    payBtn.textContent = 'Redirection...';
    try{
      const res = await fetch(`${WORKER_BASE_URL}/create-pro-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if(data.url){
        window.location.href = data.url;
      } else {
        errorEl.textContent = data.error || 'Erreur inattendue, réessaie plus tard.';
        payBtn.disabled = false;
        payBtn.textContent = `Devenir membre Pro — ${PRICE_LABEL}`;
      }
    }catch(e){
      errorEl.textContent = 'Impossible de contacter le service de paiement.';
      payBtn.disabled = false;
      payBtn.textContent = `Devenir membre Pro — ${PRICE_LABEL}`;
    }
  }

  // ---------- API publique ----------
  window.ProGate = {
    get isUnlocked(){ return isUnlocked; },
    guard(triggerFn){
      if(isUnlocked){ triggerFn(); } else { showModal(); }
    },
    showModal,
  };

  // ---------- câblage automatique ----------
  function wireLockedLinks(){
    document.addEventListener('click', function(e){
      const el = e.target.closest('[data-pro-locked]');
      if(!el) return;
      if(!isUnlocked){ e.preventDefault(); e.stopImmediatePropagation(); showModal(); }
    }, true);
  }

  function collectToggleEls(){
    document.querySelectorAll('[data-pro-only]').forEach(el => { if(!onlyEls.includes(el)) onlyEls.push(el); });
    document.querySelectorAll('[data-pro-locked-only]').forEach(el => { if(!lockedOnlyEls.includes(el)) lockedOnlyEls.push(el); });
    if(verifyDone) refreshUI();
  }
  function watchForDynamicContent(){
    collectToggleEls();
    const observer = new MutationObserver(collectToggleEls);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init(){
    wireLockedLinks();
    watchForDynamicContent();
    checkAccess();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
