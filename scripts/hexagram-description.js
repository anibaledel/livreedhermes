// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande
//
// hexagram-description.js — la description (<meta name="description">) d'une page d'hexagramme :
// LE SENS d'abord (la première phrase du jugement, tel que le site l'écrit déjà), puis le numéro
// et ce que la page contient (prompt 196, point 1). 150-160 caractères, jamais coupée au milieu
// d'un mot. Partagé par generate-hexagram-pages.js (fr) et generate-hexagram-pages-traduites.js.
'use strict';

const MAX = 160;

// la première phrase du jugement, ENTIÈRE (jamais une proposition coupée : « … s'attache à ce qui vit pour. »)
function phrase(texte) {
  const t = String(texte).replace(/\s+/g, ' ').trim();
  return (/^(.*?[.!?。])(?:\s|$)/.exec(t) || [, t.split(' ')[0]])[1]; // le thaï n'a pas de point : sa première proposition (jusqu'au premier espace)
}

// `restes` : la fin de la description, de la plus complète à la plus courte (numéro, puis ce que
// contient la page). On garde la première qui tient avec la phrase de sens dans MAX ; si aucune ne tient,
// la description se passe du sens plutôt que de le couper (sa forme complète, 150 caractères environ).
function description(texteJugement, restes) {
  const s = phrase(texteJugement);
  for (const r of restes) if (s.length + 1 + r.length <= MAX) return `${s} ${r}`;
  return restes[0];
}

module.exports = { description, phrase, MAX };
