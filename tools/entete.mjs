// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// entete.mjs — la première phrase de l'en-tête d'un script, ce qu'il fait, citée
// et non réécrite. Partagée par tools/registre_outils.mjs et tools/index_codes.mjs
// (champ role) ; les lignes de droits et le nom du fichier en sont retirés.

import path from 'node:path';

export function premierePhrase(f, texteSource) {
  const s = texteSource.split('\n').slice(0, 60);
  const lignes = [];
  let doc = null;
  let bloc = false;
  for (const l of s) {
    let t = l.trim();
    if (t.startsWith('#!')) continue;
    if (f.endsWith('.py')) {
      if (doc === null && /^[rRuU]?("""|''')/.test(t)) { doc = t.slice(t.search(/("""|''')/), t.search(/("""|''')/) + 3); t = t.replace(/^[rRuU]?("""|''')/, ''); if (t.includes(doc)) { lignes.push(t.split(doc)[0]); break; } lignes.push(t); continue; }
      if (doc) { if (t.includes(doc)) { lignes.push(t.split(doc)[0]); break; } lignes.push(t); continue; }
      if (t.startsWith('#')) { lignes.push(t.replace(/^#+\s?/, '')); continue; }
      if (t === '' && !lignes.length) continue;
      break;
    } else {
      // dans un bloc /* … */, toute ligne compte, même sans « * » en tête
      if (/^(\/\/|\/\*|\*)/.test(t) || bloc) {
        if (/^\/\*/.test(t)) bloc = !/\*\/\s*$/.test(t);
        else if (bloc && /\*\/\s*$/.test(t)) bloc = false;
        t = t.replace(/^\/\*+\s?|^\/\/\s?|^\*+\s?|\*\/$/g, '').replace(/^=+$/, '');
        lignes.push(t);
        if (/\*\/\s*$/.test(l)) break;
        continue;
      }
      if (t === '' && !lignes.length) continue;
      if (/^(import|const|export|let|function|async|\/\/)/.test(t)) break;
    }
  }
  const texte = lignes.map((l) => l.trim())
    .filter((l) => l && !/©|AGPL|licen[cs]e|Commercial license|^=+$|^-+$/.test(l))
    .join(' ').replace(/\s+/g, ' ').trim();
  const sans = texte.replace(new RegExp(`^${path.basename(f).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[—–:-]\\s*`), '');
  const phrase = (sans.match(/^.+?[.!?](?=\s|$)/) || [sans])[0];
  return phrase.length > 240 ? `${phrase.slice(0, 237)}…` : phrase;
}
