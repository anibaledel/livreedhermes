/* ============================================================
   Soutien à prix libre — un don, plus un verrou.

   Décision de l'auteur (option A de l'audit, 2026-10-01) : plus aucun
   fichier n'est verrouillé. Le traité, les motifs (SVG, PDF, Pinterest) et
   les exports des outils (SVG, broderie, calques d'impression) se
   téléchargent directement, sans condition, sous licence CC BY-NC 4.0.
   Le soutien à prix libre reste, mais il ne débloque plus rien : c'est un
   don. L'usage commercial (impression, tissage, revente) passe par une
   licence commerciale demandée par courriel. Cette règle remplace celle du
   26 septembre (exports conditionnés au soutien).

   Ce script n'intercepte donc plus aucun clic et ne vérifie plus aucun
   jeton. Il fait deux choses :
     - après le PREMIER téléchargement de la session, un bandeau non
       bloquant rappelle la licence et propose de soutenir le projet. Il se
       ferme d'un clic et ne revient pas dans la session (sessionStorage,
       dans un try/catch : sans stockage, la page marche, le bandeau peut
       seulement revenir au rechargement) ;
     - window.SoutienGate.showModal() ouvre la fenêtre de paiement à prix
       libre (Stripe, via le Worker — inchangé), utilisée par les boutons
       « Soutenir » des pages.

   Textes en FR, EN, ES, TH, choisis d'après <html lang>. Le thaï doit être
   relu par un lecteur natif (voir docs/i18n/i18n_todo_soutien.md).
   ============================================================ */

(function(){
  const WORKER_BASE_URL = 'https://livreedhermes-soutien.anibalamiot.workers.dev';
  const SESSION_KEY = 'soutien_bandeau_vu';
  const CONTACT = 'anibaledel@gmail.com';
  const DEFAULT_AMOUNT_EUR = 5;
  const MIN_AMOUNT_EUR = 1;

  const TEXTES = {
    fr: {
      bandeau: "Ce fichier est libre, sous licence CC BY-NC 4.0 : vous pouvez l'utiliser, le partager et le modifier, hors usage commercial. Si ce travail vous est utile, vous pouvez le soutenir à prix libre.",
      soutenir: 'Soutenir',
      commercial: "Pour un usage commercial (impression, tissage, revente), écrivez-moi :",
      fermer: 'Fermer',
      modaleTitre: 'Soutenir le projet',
      modaleTexte: "Tout est libre. Le traité, les motifs et les fichiers produits par les outils se téléchargent sans condition, sous licence CC BY-NC 4.0. Votre soutien, à prix libre, finance la suite du projet : de nouveaux motifs, de nouveaux outils, le volet textile.",
      montant: 'Montant (EUR)',
      annuler: 'Annuler',
      redirection: 'Redirection…',
      minimum: `Montant minimum : ${MIN_AMOUNT_EUR} €`,
      erreur: 'Erreur inattendue, veuillez réessayer plus tard.',
      injoignable: 'Impossible de contacter le service de paiement.',
    },
    en: {
      bandeau: 'This file is free, under the CC BY-NC 4.0 licence: you may use, share and adapt it for non-commercial purposes. If this work is useful to you, you can support it at a price of your choice.',
      soutenir: 'Support',
      commercial: 'For commercial use (printing, weaving, resale), write to me:',
      fermer: 'Close',
      modaleTitre: 'Support the project',
      modaleTexte: 'Everything is free. The treatise, the patterns and the files the tools produce download without conditions, under the CC BY-NC 4.0 licence. Your support, at a price you choose, funds what comes next: new patterns, new tools, the textile work.',
      montant: 'Amount (EUR)',
      annuler: 'Cancel',
      redirection: 'Redirecting…',
      minimum: `Minimum amount: €${MIN_AMOUNT_EUR}`,
      erreur: 'Unexpected error, please try again later.',
      injoignable: 'Unable to reach the payment service.',
    },
    es: {
      bandeau: 'Este archivo es libre, bajo licencia CC BY-NC 4.0: puede usarlo, compartirlo y modificarlo, sin fines comerciales. Si este trabajo le resulta útil, puede apoyarlo con la cantidad que quiera.',
      soutenir: 'Apoyar',
      commercial: 'Para un uso comercial (impresión, tejido, reventa), escríbame:',
      fermer: 'Cerrar',
      modaleTitre: 'Apoyar el proyecto',
      modaleTexte: 'Todo es libre. El tratado, los motivos y los archivos que producen las herramientas se descargan sin condiciones, bajo licencia CC BY-NC 4.0. Su apoyo, con la cantidad que usted elija, financia la continuación del proyecto: nuevos motivos, nuevas herramientas, la parte textil.',
      montant: 'Importe (EUR)',
      annuler: 'Cancelar',
      redirection: 'Redirigiendo…',
      minimum: `Importe mínimo: ${MIN_AMOUNT_EUR} €`,
      erreur: 'Error inesperado, inténtelo de nuevo más tarde.',
      injoignable: 'No se puede contactar con el servicio de pago.',
    },
    th: {
      bandeau: 'ไฟล์นี้ใช้ได้ฟรี ภายใต้สัญญาอนุญาต CC BY-NC 4.0 คุณสามารถใช้ แบ่งปัน และดัดแปลงได้ โดยไม่ใช้เพื่อการค้า หากงานนี้มีประโยชน์กับคุณ คุณสามารถสนับสนุนได้ตามจำนวนที่คุณต้องการ',
      soutenir: 'สนับสนุน',
      commercial: 'หากต้องการใช้เพื่อการค้า (พิมพ์ ทอ หรือจำหน่ายต่อ) โปรดติดต่อ',
      fermer: 'ปิด',
      modaleTitre: 'สนับสนุนโครงการ',
      modaleTexte: 'ทุกอย่างเปิดให้ใช้ฟรี ตำรา ลวดลาย และไฟล์ที่สร้างจากเครื่องมือต่างๆ ดาวน์โหลดได้โดยไม่มีเงื่อนไข ภายใต้สัญญาอนุญาต CC BY-NC 4.0 การสนับสนุนของคุณในจำนวนที่คุณกำหนดเอง ช่วยให้โครงการเดินหน้าต่อไป ทั้งลวดลายใหม่ เครื่องมือใหม่ และงานด้านสิ่งทอ',
      montant: 'จำนวนเงิน (EUR)',
      annuler: 'ยกเลิก',
      redirection: 'กำลังเปลี่ยนหน้า…',
      minimum: `จำนวนขั้นต่ำ: ${MIN_AMOUNT_EUR} €`,
      erreur: 'เกิดข้อผิดพลาดที่ไม่คาดคิด โปรดลองอีกครั้งภายหลัง',
      injoignable: 'ไม่สามารถติดต่อบริการชำระเงินได้',
    },
  };
  const langue = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  const T = TEXTES[langue] || TEXTES.fr;

  // ---------- bandeau après le premier téléchargement de la session ----------
  let bandeauVuIci = false; // repli si sessionStorage est indisponible
  function bandeauDejaVu(){
    if(bandeauVuIci) return true;
    try{ return sessionStorage.getItem(SESSION_KEY) === '1'; }catch(e){ return false; }
  }
  function marquerBandeauVu(){
    bandeauVuIci = true;
    try{ sessionStorage.setItem(SESSION_KEY, '1'); }catch(e){ /* page utilisable sans stockage */ }
  }

  function afficherBandeau(){
    if(bandeauDejaVu() || document.getElementById('soutienBandeau')) return;
    marquerBandeauVu();
    const el = document.createElement('div');
    el.id = 'soutienBandeau';
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;margin:0 auto;max-width:620px;z-index:9998;'
      + 'background:var(--bg,#000);border:1px solid var(--line-strong,#3a3a3a);color:var(--dim,#f2f2f0);'
      + 'padding:16px 44px 16px 18px;font-size:13px;line-height:1.6;box-shadow:0 8px 24px rgba(0,0,0,.5);';
    el.innerHTML = `
      <p style="margin:0 0 10px;"></p>
      <p style="margin:0;font-size:12px;opacity:.85;"><span></span> <a href="mailto:${CONTACT}" style="color:var(--gold,#c9a15a);">${CONTACT}</a></p>
      <button type="button" data-soutien-ouvrir style="margin-top:12px;border:1px solid var(--gold,#c9a15a);background:transparent;color:var(--gold,#c9a15a);font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:8px 14px;cursor:pointer;"></button>
      <button type="button" data-soutien-fermer style="position:absolute;top:8px;right:8px;border:0;background:transparent;color:var(--dim,#f2f2f0);font-size:20px;line-height:1;padding:4px 8px;cursor:pointer;">×</button>
    `;
    const [texte, ligneCommerciale] = el.querySelectorAll('p');
    texte.textContent = T.bandeau;
    ligneCommerciale.querySelector('span').textContent = T.commercial;
    const ouvrir = el.querySelector('[data-soutien-ouvrir]');
    ouvrir.textContent = T.soutenir;
    const fermer = el.querySelector('[data-soutien-fermer]');
    fermer.setAttribute('aria-label', T.fermer);
    fermer.title = T.fermer;
    ouvrir.addEventListener('click', () => { el.remove(); showModal(); });
    fermer.addEventListener('click', () => el.remove());
    document.body.appendChild(el);
  }

  // Un téléchargement, c'est un lien `download` ou vers un fichier (y compris
  // les liens blob: que les outils créent puis cliquent pour leurs exports) —
  // repéré en phase de bouillonnement, sans jamais l'empêcher ni le retarder.
  const EXTENSION_FICHIER = /\.(pdf|svg|zip|png|jpe?g|webp|docx?|pes|dst|exp|lldh|csv|json)(?:[?#]|$)/i;
  function estTelechargement(a){
    if(!a || !a.getAttribute) return false;
    if(a.hasAttribute('download')) return true;
    const href = a.getAttribute('href') || '';
    return EXTENSION_FICHIER.test(href);
  }
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a') : null;
    if(estTelechargement(a)) setTimeout(afficherBandeau, 0);
  });

  // ---------- fenêtre de soutien (paiement à prix libre) ----------
  let modalEl = null;
  function buildModal(){
    if(modalEl) return modalEl;
    const overlay = document.createElement('div');
    overlay.id = 'soutienOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = `
      <div role="dialog" aria-modal="true" aria-labelledby="soutienTitre" style="background:var(--bg,#000);border:1px solid var(--line,#242424);max-width:460px;width:100%;padding:28px 26px;color:var(--dim,#f2f2f0);font-family:Helvetica,Arial,sans-serif;">
        <div id="soutienTitre" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold,#c9a15a);margin-bottom:14px;"></div>
        <p id="soutienTexte" style="font-size:13.5px;line-height:1.7;margin:0 0 20px;"></p>
        <label for="soutienAmount" id="soutienMontantLabel" style="display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;"></label>
        <input type="number" id="soutienAmount" min="${MIN_AMOUNT_EUR}" step="1" value="${DEFAULT_AMOUNT_EUR}" style="width:100%;background:#050505;border:1px solid var(--line,#242424);color:var(--white,#f2f2f0);font-size:16px;padding:10px 12px;margin-bottom:8px;box-sizing:border-box;">
        <div id="soutienError" style="color:var(--red,#e0261b);font-size:12px;min-height:16px;margin-bottom:12px;"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button type="button" id="soutienPayBtn" style="flex:1;border:1px solid var(--red,#e0261b);background:transparent;color:var(--red,#e0261b);font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;cursor:pointer;"></button>
          <button type="button" id="soutienCloseBtn" style="border:1px solid var(--line,#242424);background:transparent;color:var(--dim,#f2f2f0);font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:12px 16px;cursor:pointer;"></button>
        </div>
      </div>
    `;
    overlay.querySelector('#soutienTitre').textContent = T.modaleTitre;
    overlay.querySelector('#soutienTexte').textContent = T.modaleTexte;
    overlay.querySelector('#soutienMontantLabel').textContent = T.montant;
    overlay.querySelector('#soutienPayBtn').textContent = T.soutenir;
    overlay.querySelector('#soutienCloseBtn').textContent = T.annuler;
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
      errorEl.textContent = T.minimum;
      return;
    }
    const payBtn = document.getElementById('soutienPayBtn');
    payBtn.disabled = true;
    payBtn.textContent = T.redirection;
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
        errorEl.textContent = data.error || T.erreur;
        payBtn.disabled = false;
        payBtn.textContent = T.soutenir;
      }
    }catch(e){
      errorEl.textContent = T.injoignable;
      payBtn.disabled = false;
      payBtn.textContent = T.soutenir;
    }
  }

  // ---------- API publique ----------
  // isUnlocked et guard() sont gardés pour ne casser aucun appelant : plus
  // rien n'est verrouillé, guard() exécute directement l'action.
  window.SoutienGate = {
    get isUnlocked(){ return true; },
    guard(triggerFn){ triggerFn(); },
    showModal,
  };
})();
