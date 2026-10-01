/* Page de recherche (recherche.html, en/search/) : interface Pagefind sur
   l'index de pagefind/ (scripts/build-recherche.mjs). La langue de l'index
   et des libellés suit <html lang>. Une adresse ?q=… lance la recherche. */
(function () {
  var ui = new PagefindUI({
    element: '#recherche',
    showSubResults: true,
    showImages: false,
    autofocus: true,
    resetStyles: false,
  });
  var q = new URLSearchParams(location.search).get('q');
  if (q) ui.triggerSearch(q);
})();
