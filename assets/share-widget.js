/* ============================================================
   Widget de partage partagé — La Livrée d'Hermès.
   Génère le bloc "Partager cette page" (Facebook, X, LinkedIn, WhatsApp,
   Telegram, Reddit, Copier le lien) et l'insère juste avant .credit-line
   (ancre stable, indépendante de l'ordre caducée/bouton Soutien, présente
   sur la quasi-totalité des pages) — avec repli sur .footer-caduceus,
   .footer-title-logo puis .site-nav-row pour les pages qui n'ont pas
   .credit-line. URL = <link rel="canonical"> si présent, sinon
   location.href ; titre = <meta property="og:title"> si présent, sinon
   document.title. Personnalisable via l'attribut data-label du tag
   <script> (ex. data-label="Partager cet article").
   ============================================================ */
(function(){
  var REDDIT_URL = 'https://www.reddit.com/r/Trismegistus/s/hC0QPXIA14';

  // document.currentScript n'est fiable que pendant l'exécution synchrone du
  // script : on le capture ici (portée du module), pas dans init(), qui
  // s'exécute plus tard (après DOMContentLoaded) quand currentScript est déjà
  // redevenu null.
  var thisScript = document.currentScript || (function(){
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  function pageUrl(){
    var canonical = document.querySelector('link[rel="canonical"]');
    return (canonical && canonical.href) || location.href;
  }

  function pageTitle(){
    var og = document.querySelector('meta[property="og:title"]');
    return (og && og.content) || document.title;
  }

  function injectStyle(){
    if(document.getElementById('share-widget-style')) return;
    var style = document.createElement('style');
    style.id = 'share-widget-style';
    style.textContent =
      '.share-buttons{ max-width:640px; margin:32px auto 0; text-align:center; }' +
      '.share-label{ font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--dim); margin:0 0 12px; }' +
      '.share-row{ display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }' +
      '.share-btn{ border:1px solid var(--line); background:transparent; color:var(--dim); font-size:12px; letter-spacing:.06em; text-transform:uppercase; padding:9px 15px; cursor:pointer; text-decoration:none; transition:border-color .12s ease, color .12s ease; font-family:Helvetica,Arial,sans-serif; }' +
      '.share-btn:hover{ border-color:var(--gold); color:var(--gold); }' +
      '.share-btn.copied{ border-color:var(--gold); color:var(--gold); }';
    document.head.appendChild(style);
  }

  function buildBlock(label, url, title){
    var t = encodeURIComponent(title);
    var u = encodeURIComponent(url);
    var block = document.createElement('div');
    block.className = 'share-buttons';
    block.innerHTML =
      '<div class="share-label">' + label + '</div>' +
      '<div class="share-row">' +
        '<a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=' + u + '" target="_blank" rel="noopener">Facebook</a>' +
        '<a class="share-btn" href="https://twitter.com/intent/tweet?url=' + u + '&text=' + t + '" target="_blank" rel="noopener">X</a>' +
        '<a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=' + u + '" target="_blank" rel="noopener">LinkedIn</a>' +
        '<a class="share-btn" href="https://api.whatsapp.com/send?text=' + t + '%20' + u + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '<a class="share-btn" href="https://t.me/share/url?url=' + u + '&text=' + t + '" target="_blank" rel="noopener">Telegram</a>' +
        '<a class="share-btn" href="' + REDDIT_URL + '" target="_blank" rel="noopener">Reddit</a>' +
        '<button type="button" class="share-btn" id="btnCopyLink">' + TEXTES.copier + '</button>' +
      '</div>';
    return block;
  }

  // Libellés dans la langue de la page (<html lang>), français par défaut :
  // les pages anglaises (motifs, hexagrammes) l'affichaient en français.
  var TEXTES_PAR_LANGUE = {
    fr: { partager: 'Partager cette page', copier: 'Copier le lien', copie: 'Lien copié !',
          echec: "Impossible de copier le lien automatiquement — copiez-le depuis la barre d'adresse." },
    en: { partager: 'Share this page', copier: 'Copy link', copie: 'Link copied!',
          echec: 'Could not copy the link automatically — copy it from the address bar.' },
    es: { partager: 'Compartir esta página', copier: 'Copiar el enlace', copie: '¡Enlace copiado!',
          echec: 'No se pudo copiar el enlace automáticamente: cópielo desde la barra de direcciones.' },
    th: { partager: 'แชร์หน้านี้', copier: 'คัดลอกลิงก์', copie: 'คัดลอกลิงก์แล้ว!',
          echec: 'ไม่สามารถคัดลอกลิงก์โดยอัตโนมัติ — โปรดคัดลอกจากแถบที่อยู่' },
  };
  var TEXTES = TEXTES_PAR_LANGUE[(document.documentElement.lang || 'fr').slice(0, 2).toLowerCase()] || TEXTES_PAR_LANGUE.fr;

  function wireCopyButton(block, url){
    var btn = block.querySelector('#btnCopyLink');
    if(!btn) return;
    btn.addEventListener('click', function(){
      navigator.clipboard.writeText(url).then(function(){
        var original = btn.textContent;
        btn.textContent = TEXTES.copie;
        btn.classList.add('copied');
        setTimeout(function(){ btn.textContent = original; btn.classList.remove('copied'); }, 2000);
      }).catch(function(){
        alert(TEXTES.echec);
      });
    });
  }

  function init(){
    var label = (thisScript && thisScript.getAttribute('data-label')) || TEXTES.partager;
    var url = pageUrl();
    var title = pageTitle();

    injectStyle();
    var block = buildBlock(label, url, title);

    // .credit-line d'abord (insertion APRÈS elle : les boutons de partage
    // viennent sous le gif du bas de page et sous la ligne « © … Créé en
    // collaboration avec Claude », demande d'Anibal du 2026-10-06) : ancre
    // stable, qui ne bouge pas si l'ordre caducée / bouton Soutien change
    // dans le pied de page. Repli sur .footer-caduceus, .footer-title-logo puis
    // .site-nav-row pour les pages qui n'ont pas .credit-line, et sur la
    // fin de <body> en tout dernier recours.
    var creditLine = document.querySelector('.credit-line');
    if(creditLine){
      creditLine.insertAdjacentElement('afterend', block);
      // Un pied ordonné en flex (style.css et 42 pages : .note > .share-buttons
      // 7, .credit-line 8) remettrait le partage AU-DESSUS du crédit, quel que
      // soit l'ordre du HTML : il prend donc le rang de la ligne de crédit, et
      // à rang égal l'ordre du HTML le place juste après elle.
      block.style.order = getComputedStyle(creditLine).order;
    } else {
      var anchor = document.querySelector('.footer-caduceus') || document.querySelector('.footer-title-logo') || document.querySelector('.site-nav-row');
      if(anchor){
        anchor.insertAdjacentElement('afterend', block);
      } else {
        document.body.appendChild(block);
      }
    }
    wireCopyButton(block, url);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
