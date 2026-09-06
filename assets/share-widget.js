/* ============================================================
   Widget de partage partagé — La Livrée d'Hermès.
   Génère le bloc "Partager cette page" (Facebook, X, LinkedIn, WhatsApp,
   Telegram, Reddit, Copier le lien) et l'insère juste après le premier
   .footer-caduceus trouvé sur la page. URL = <link rel="canonical"> si
   présent, sinon location.href ; titre = <meta property="og:title"> si
   présent, sinon document.title. Personnalisable via l'attribut data-label
   du tag <script> (ex. data-label="Partager cet article").
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
      '.share-label{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--dim); margin:0 0 12px; }' +
      '.share-row{ display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }' +
      '.share-btn{ border:1px solid var(--line); background:transparent; color:var(--dim); font-size:10.5px; letter-spacing:.06em; text-transform:uppercase; padding:9px 15px; cursor:pointer; text-decoration:none; transition:border-color .12s ease, color .12s ease; font-family:Helvetica,Arial,sans-serif; }' +
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
        '<button type="button" class="share-btn" id="btnCopyLink">Copier le lien</button>' +
      '</div>';
    return block;
  }

  function wireCopyButton(block, url){
    var btn = block.querySelector('#btnCopyLink');
    if(!btn) return;
    btn.addEventListener('click', function(){
      navigator.clipboard.writeText(url).then(function(){
        var original = btn.textContent;
        btn.textContent = 'Lien copié !';
        btn.classList.add('copied');
        setTimeout(function(){ btn.textContent = original; btn.classList.remove('copied'); }, 2000);
      }).catch(function(){
        alert("Impossible de copier le lien automatiquement — copiez-le depuis la barre d'adresse.");
      });
    });
  }

  function init(){
    var label = (thisScript && thisScript.getAttribute('data-label')) || 'Partager cette page';
    var url = pageUrl();
    var title = pageTitle();

    injectStyle();
    var block = buildBlock(label, url, title);

    // Le bouton "Devenir Partenaire" suit désormais le caducée et précède ce
    // bloc de partage dans .note : on s'ancre dessus pour s'insérer juste après,
    // avec .footer-caduceus comme repli si jamais ce bouton était absent.
    var anchor = document.querySelector('.footer-partenaire-btn') || document.querySelector('.footer-caduceus');
    if(anchor){
      anchor.insertAdjacentElement('afterend', block);
    } else {
      // Repli : ni l'un ni l'autre trouvé, on ajoute en fin de <body>.
      document.body.appendChild(block);
    }
    wireCopyButton(block, url);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
