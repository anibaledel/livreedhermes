// familles-unifiees.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// La RÈGLE DE PARITÉ de la note « half-shift » (v6, prompt 242), écrite une seule fois : une famille (un sous-ensemble non vide des 4 bases YIN, YIN-MUT, YANG, YANG-MUT) est
// unifiée si et seulement si elle contient EXACTEMENT UNE base de type yang (YANG ou YANG-MUT, pas les deux, pas aucune). Les huit : {YANG}, {YANG-MUT}, {YANG,YIN}, {YANG,YIN-MUT},
// {YANG-MUT,YIN}, {YANG-MUT,YIN-MUT}, {YANG,YIN,YIN-MUT}, {YANG-MUT,YIN,YIN-MUT}. Aucune liste n'est écrite : la règle se lit sur la clé de la famille (« bases:yang », « par2:yin+yang_mut »,
// « par3:sans_yang », « par4 ») ; tools/check_familles_unifiees.mjs la compare aux données (data/fonds_ecran_v1.json) et à la note (tools/check_note_v6.py).
// Script classique (window.FamillesUnifiees) ET module CommonJS : les pages l'incluent par <script src>, les tests le chargent par require.
(function (racine) {
  const TOUTES = ['yang', 'yang_mut', 'yin', 'yin_mut'];
  /** Les bases d'une famille, d'après sa clé : « bases:yang » → [yang] ; « par2:a+b » → [a, b] ; « par3:sans_x » → les trois autres ; « par4 » → les quatre. */
  function basesDe(cle) {
    const [cat, reste] = String(cle).split(':');
    if (cat === 'par4') return TOUTES.slice();
    if (cat === 'bases') return [reste];
    if (cat === 'par2') return reste.split('+');
    if (cat === 'par3') return TOUTES.filter((b) => b !== reste.replace(/^sans_/, ''));
    return [];
  }
  /** La famille a-t-elle exactement une base de type yang (yang ou yang_mut) ? C'est la règle de parité : unifiée si et seulement si. */
  const uneSeuleBaseYang = (cle) => basesDe(cle).filter((b) => b === 'yang' || b === 'yang_mut').length === 1;
  const FU = { basesDe, uneSeuleBaseYang };
  if (typeof module !== 'undefined' && module.exports) module.exports = FU; else racine.FamillesUnifiees = FU;
})(typeof window !== 'undefined' ? window : globalThis);
