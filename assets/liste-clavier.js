/* ============================================================
   Listes de choix au clavier : galeries de vignettes, liste des gammes.

   Ces zones défilent et se choisissent à la souris. Marquées par
   data-liste-clavier, elles deviennent une liste d'options :
     - une seule tabulation pour entrer dans la zone ;
     - flèches pour passer à l'élément précédent ou suivant,
       Début et Fin pour le premier et le dernier ;
     - le choix déclenche le clic de l'élément : la page garde sa
       propre logique, rien n'est dupliqué ici.

   Attributs sur le conteneur :
     data-liste-clavier   sélecteur des éléments (ex. ".tile")
     data-choisi          classe posée par la page sur l'élément choisi
   Le nom accessible vient de aria-labelledby ou aria-label, posés
   dans la page.

   Les options sont créées par la page après coup : un
   MutationObserver tient aria-selected et aria-activedescendant à jour.
   ============================================================ */
(function () {
  var compteur = 0;

  function brancher(liste) {
    var selecteur = liste.getAttribute('data-liste-clavier');
    var choisi = liste.getAttribute('data-choisi') || 'selected';
    liste.tabIndex = 0;
    liste.setAttribute('role', 'listbox');

    function options() { return Array.prototype.slice.call(liste.querySelectorAll(selecteur)); }

    function majAria() {
      var actif = null;
      options().forEach(function (el) {
        if (!el.id) el.id = 'option-' + (++compteur);
        el.setAttribute('role', 'option');
        var oui = el.classList.contains(choisi);
        el.setAttribute('aria-selected', oui ? 'true' : 'false');
        if (oui) actif = el;
      });
      if (actif) {
        liste.setAttribute('aria-activedescendant', actif.id);
        // Ne fait défiler que si la zone a le focus : au chargement, la
        // première sélection ne doit pas déplacer la page.
        if (document.activeElement === liste) actif.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } else {
        liste.removeAttribute('aria-activedescendant');
      }
    }

    liste.addEventListener('keydown', function (e) {
      var els = options();
      if (!els.length) return;
      var i = -1;
      for (var k = 0; k < els.length; k++) if (els[k].classList.contains(choisi)) { i = k; break; }
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = Math.min(els.length - 1, i + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = Math.max(0, i - 1);
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = els.length - 1;
      if (j === null) return;
      e.preventDefault();
      if (j !== i) els[j].click();
    });

    new MutationObserver(majAria).observe(liste, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class'],
    });
    majAria();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-liste-clavier]'), brancher);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
