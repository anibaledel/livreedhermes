#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès — AGPL v3 / licence commerciale sur demande : voir LICENSE
// rendus_demi_periode.mjs — la règle de la demi-période pour les rendus rétablis de l'interface (prompt 273) : « Signes » et « Lignes nodales » (assets/pavane-rendu.js, figure de assets/musique-chladni-moteur.js).
// La règle : le motif décalé de 6 cases en ligne et en colonne est son négatif aux teintes échangées. Pour une figure, deux lectures :
//   - SIGNES : la figure du motif décalé a ses signes opposés (le masque des signes du décalé est le complément du masque du motif) ;
//   - LIGNES NODALES : la figure du motif décalé a les MÊMES lignes (le champ opposé s'annule aux mêmes points).
// Le contrôle ne corrige rien et n'échoue pas sur un motif qui ne tient pas la règle : il compte, par collection (les 256 du corpus, les 256 formes à quatre axes de plus), ceux qui la tiennent, pixel pour pixel
// (tuile de 240 points ; la comparaison écarte les points où le champ est nul à 1e-9 près, où le signe n'est pas défini), et le dit. Il échoue seulement si le calcul est incohérent (un nombre de motifs inattendu).
//   node tools/rendus_demi_periode.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { champDuMotif, masqueDuMotif } from '../assets/pavane-rendu.js';
import { figure } from '../assets/musique-chladni-moteur.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (r) => JSON.parse(fs.readFileSync(path.join(ROOT, r), 'utf8'));
const N = 12, T = 240;
const decale = (rows) => rows.map((_, r) => [...rows[0]].map((__, c) => rows[(r + 6) % N][(c + 6) % N]).join(''));
// le champ reconstruit (flottant), pour écarter les points nuls
function champReconstruit(rows) {
  const A = new Uint8Array(T * T); // la fonction figure() ne rend que le masque ; le masque des lignes (|v| < 0,07) sert de test des points proches de zéro
  return figure(champDuMotif(rows), 12, T, 'lignes', A);
}
function compte(entrees) {
  let signesOk = 0, lignesOk = 0, tousOk = 0;
  for (const e of entrees) {
    const g = e.tricolore, gs = decale(g);
    const S = masqueDuMotif(g, 'signes', T), Ss = masqueDuMotif(gs, 'signes', T);
    const L = masqueDuMotif(g, 'lignes', T), Ls = masqueDuMotif(gs, 'lignes', T);
    const Z = champReconstruit(g); // 255 : proche de zéro (hors du test des signes)
    let ds = 0, dl = 0, n = 0;
    for (let i = 0; i < T * T; i++) {
      if (Z[i] !== 255) { n++; if (S[i] === Ss[i]) ds++; } // hors des lignes : les signes doivent être opposés
      if (L[i] !== Ls[i]) dl++;
    }
    const s = ds === 0, l = dl === 0; signesOk += s; lignesOk += l; tousOk += s && l;
  }
  return { motifs: entrees.length, signes_opposes: signesOk, lignes_identiques: lignesOk, les_deux: tousOk };
}
const corpus = lire('data/corpus-256.json').entrees.map((e) => ({ tricolore: e.tricolore }));
const formes = lire('data/formes-quatre-axes-288.json').formes.filter((f) => !f.corpus).map((f) => ({ tricolore: f.tricolore }));
if (corpus.length !== 256 || formes.length !== 256) { console.error(`ÉCART : ${corpus.length} motifs du corpus, ${formes.length} formes à quatre axes nouvelles (256 et 256 attendus)`); process.exit(1); }
for (const [nom, liste] of [['corpus (256)', corpus], ['formes à quatre axes nouvelles (256)', formes]]) {
  const c = compte(liste);
  console.log(`${nom} : Signes opposés pour le motif décalé : ${c.signes_opposes} sur ${c.motifs} ; Lignes nodales identiques : ${c.lignes_identiques} sur ${c.motifs} ; les deux : ${c.les_deux}.`);
}
