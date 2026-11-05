/* ============================================================
   travaux-donnees.js — le registre des dépôts tel que les pages le lisent.

   Une seule source pour les versions et les DOI : research/status.json.
   data/travaux.json garde ce que status.json n'a pas (textes de
   présentation, licence, page du dépôt, première version, renvois). Une
   entrée de travaux.json qui porte `research_id` reçoit de l'entrée
   correspondante de status.json :

     version, date, doi (toutes versions), versionDoi (= version_doi),
     statut {en, fr}, pending

   et ces champs ne s'écrivent plus dans travaux.json. Une version absente
   de status.json (version_doi null) reste absente : rien n'est inventé.

   Module sans effet de bord, lu par scripts/build-travaux.js,
   scripts/build-travaux-pages.js, tools/check_zenodo_registre.mjs et
   tools/check_doi_perimes.mjs.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const lire = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

function charger() {
  const registre = lire('data/travaux.json');
  const etat = lire('research/status.json');
  const parId = new Map(etat.works.map((w) => [w.id, w]));
  const vus = new Set();
  registre.depots = registre.depots.map((d) => {
    if (!d.research_id) return d;
    const w = parId.get(d.research_id);
    if (!w) throw new Error(`data/travaux.json : research_id « ${d.research_id} » absent de research/status.json (${d.titre})`);
    if (vus.has(d.research_id)) throw new Error(`data/travaux.json : research_id « ${d.research_id} » porté par deux entrées`);
    vus.add(d.research_id);
    const m = { ...d, version: w.version, date: w.date, statut: { en: w.status_en, fr: w.status_fr }, pending: !!w.pending };
    delete m.doi; delete m.versionDoi;
    if (w.doi) m.doi = w.doi;
    if (w.version_doi) m.versionDoi = w.version_doi;
    return m;
  });
  return registre;
}

module.exports = { charger };
