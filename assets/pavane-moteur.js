// pavane-moteur.js — La Livrée d'Hermès
// © Anibal Edelberto Amiot 2026 — AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// Le MOTEUR de « Pavane — Voir sa musique » (prompt 211, §2, §3 et §7) : trois façons de choisir le motif suivant, la distance entre motifs, et le chef d'orchestre
// qui, image après image, décide quand changer. SANS DOM, sans réseau, sans horloge : le temps est celui que l'appelant donne (`t`, en secondes), donc les mêmes
// entrées donnent toujours les mêmes sorties — l'interface n'est que de l'affichage, et une application installée (PWA, Android, iPhone) rebranche le même code.
//
// Les trois modes :
//   Défilé      le motif suivant est le plus proche voisin, non vu dans le cycle, du motif courant (la logique de pickNextByProximity d'outil-fond-ecran.js,
//               extraite ici) ; déclencheur : un minuteur, ou la pulsation du son. Sur la liste du niveau de corpus choisi (128 par défaut).
//   Spectre     le motif dont le spectre ressemble le plus à celui du son (le moteur de musique-chladni-moteur.js), cherché parmi les 64 REPRÉSENTANTS : les quatre
//               motifs d'une classe de translation ont le même spectre d'amplitude (tools/check_spectre_classes.mjs). membreAffiche() donne le membre à montrer.
//   Entre-deux  le spectre guide, le rythme avance : à chaque pulsation, les 8 motifs les plus ressemblants au spectre (lissé sur 1 à 2 s), puis, parmi eux, le plus
//               proche du motif courant non vu dans le cycle ; sans pulsation régulière, repli sur un minuteur, et le chef le DIT (repli: true).
import { SHELLS12, spectreDuChamp, vecteurAudio, meilleurMotif, bandesDuSon, creerDetecteurAttaques, creerSuiviPulsation } from './musique-chladni-moteur.js';

export const MODES = Object.freeze(['defile', 'spectre', 'entre-deux']);
export const NIVEAU_DEFILE = 128;
export const NOMBRE_ENTRE_DEUX = 8;
export const LISSAGE_S = 1.5; // la constante de temps du spectre lissé (entre 1 et 2 s)
export const PERIODE_MINUTEUR_S = 8;
// La photosensibilité (prompts 223, 226) : jamais deux changements de motif à moins de TENUE_MIN_S secondes, quel que soit le mode et le déclencheur (2 par seconde au plus : une marge sous les 3 de WCAG 2.3.1) ;
// « Mouvement réduit » demande plus (tenueMinS, 3 s). Le Spectre ne quitte en outre son motif courant que si un autre est meilleur d'au moins MARGE_SPECTRE (cosinus centré : le choix ne bascule pas sur deux motifs presque à égalité).
export const TENUE_MIN_S = 0.8;
export const MARGE_SPECTRE = 0.05;

// ---------- une graine, des listes, des distances ----------
export function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const grilleDe = (e) => e.tricolore; // 12 chaînes de V / M / O
/** Le nombre de cases de 12 × 12 qui diffèrent (la distance de outil-fond-ecran.js, gridDistance). */
export function distanceGrilles(a, b) { let d = 0; for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) if (a[r][c] !== b[r][c]) d++; return d; }

/** Les identifiants des motifs d'un niveau de corpus (data/corpus-256.json) : 256 tous, 128 un motif par paire {motif, négatif}, 64 les représentants. */
export function listeDuNiveau(corpus, niveau) {
  if (niveau === 256) return corpus.niveaux['256'].slice();
  if (niveau === 128) return corpus.niveaux['128'].map((q) => q.motif.id);
  if (niveau === 64) return corpus.niveaux['64'].map((c) => c.representant.id);
  throw new Error(`pavane-moteur.js : niveau « ${niveau} » inconnu (64, 128 ou 256)`);
}
/** Le membre de la classe du représentant `repId` à montrer : 64 le représentant ; 128 le représentant (rang 0) ou son négatif (rang 1) ; 256 les 4 membres (rang 0..3). */
export function membreAffiche(corpus, repId, niveau, rang = 0) {
  if (String(repId).startsWith('q4-')) return repId; // une forme à quatre axes étendue n'a ni négatif ni membres affichés : elle se montre elle-même
  const cl = corpus.niveaux['64'].find((c) => c.representant.id === repId);
  if (!cl) throw new Error(`pavane-moteur.js : « ${repId} » n'est pas un représentant`);
  if (niveau === 64) return repId;
  if (niveau === 128) return rang % 2 === 0 ? repId : corpus.entrees.find((e) => e.id === repId).partenaire_demi_decalage;
  return cl.membres[((rang % 4) + 4) % 4];
}
/** Les distances entre les motifs d'une liste d'identifiants : (i, j) → nombre de cases qui diffèrent. */
export function distancesDe(corpus, ids) {
  const par = new Map(corpus.entrees.map((e) => [e.id, e]));
  const g = ids.map((id) => grilleDe(par.get(id)).map((l) => [...l]));
  return (i, j) => distanceGrilles(g[i], g[j]);
}

// ---------- DÉFILÉ ----------
/**
 * Le défilé : { suivant(), courant, vus }. Le premier motif est tiré avec la graine ; ensuite, à chaque pas, le plus proche non vu du courant (à distance égale, le
 * plus petit indice) ; quand tous ont été vus, un nouveau cycle commence, avec le courant pour seul « vu ».
 */
export function creerDefile({ n, distance, graine = 1 }) {
  const hasard = alea(graine);
  let courant = -1, vus = new Set();
  return {
    get courant() { return courant; },
    get vus() { return new Set(vus); },
    suivant() {
      if (courant === -1) { courant = Math.floor(hasard() * n); vus = new Set([courant]); return { i: courant, nouveauCycle: true }; }
      let nouveauCycle = false;
      let candidats = []; for (let i = 0; i < n; i++) if (!vus.has(i)) candidats.push(i);
      if (!candidats.length) { vus = new Set([courant]); nouveauCycle = true; for (let i = 0; i < n; i++) if (!vus.has(i)) candidats.push(i); }
      let meilleur = candidats[0], dm = Infinity;
      for (const i of candidats) { const d = distance(courant, i); if (d < dm) { dm = d; meilleur = i; } }
      courant = meilleur; vus.add(meilleur);
      return { i: courant, nouveauCycle };
    },
  };
}

// ---------- le bloc des 64 représentants (pour la recherche par spectre) ----------
/** Le champ tricolore d'une entrée : V = +1, O = 0, M = −1 (celui de musique-chladni-moteur.js). */
export const champDeLEntree = (e) => e.tricolore.flatMap((l) => [...l].map((c) => (c === 'V' ? 1 : c === 'M' ? -1 : 0)));
/** Un bloc de spectres, de la forme que musique-chladni-moteur.js lit, pour les 64 représentants du corpus ; `ids` dans l'ordre du corpus. */
/**
 * Le spectre d'un champ V = +1, M = −1, O = 0 : celui du moteur actuel (`champ`) ne porte que des cercles K impairs (11 des 26 cercles pour les 64 représentants du corpus) ; le spectre « à trois teintes »
 * (la somme des puissances des indicateurs de V, de M et de O, puis la racine) en porte aussi de pairs (docs/article-parallele-unified-patterns.md, 4.1 : 19 cercles pour les 256 formes à quatre axes).
 */
export function spectreDuMotif(champ, spectre = 'champ') {
  if (spectre === 'champ') return spectreDuChamp(champ);
  if (spectre !== 'trois-teintes') throw new Error(`pavane-moteur.js : spectre « ${spectre} » inconnu (champ ou trois-teintes)`);
  const w = new Float64Array(SHELLS12.length);
  for (const cible of [1, -1, 0]) { const wc = spectreDuChamp(champ.map((x) => (x === cible ? 1 : 0))); for (let k = 0; k < w.length; k++) w[k] += wc[k] * wc[k]; }
  return w.map(Math.sqrt);
}
/** Un bloc (vecteurs normés puis centrés sur la moyenne du jeu, comme blocDuCorpus64) pour une liste de motifs { id, champ }. */
export function blocDeMotifs(id, motifs, { fref = 220, spectre = 'champ' } = {}) {
  const NS = SHELLS12.length, n = motifs.length, P = new Float64Array(n * NS);
  motifs.forEach((m, j) => { const w = spectreDuMotif(m.champ, spectre); const nn = Math.hypot(...w) || 1; P.set(w.map((x) => x / nn), j * NS); });
  const mean = new Float64Array(NS); for (let j = 0; j < n; j++) for (let k = 0; k < NS; k++) mean[k] += P[j * NS + k] / n;
  const Pc = new Float32Array(n * NS);
  for (let j = 0; j < n; j++) {
    let s = 0; for (let k = 0; k < NS; k++) { const v = P[j * NS + k] - mean[k]; Pc[j * NS + k] = v; s += v * v; }
    s = Math.sqrt(s) || 1; for (let k = 0; k < NS; k++) Pc[j * NS + k] /= s;
  }
  return { id, n, NS, ids: motifs.map((m) => m.id), shells: SHELLS12, fref, grid: 12, mean, Pc, P, profil: `${fref}|${SHELLS12.join(',')}` };
}
export function blocDuCorpus64(corpus, fref = 220, { spectre = 'champ' } = {}) {
  const par = new Map(corpus.entrees.map((e) => [e.id, e]));
  return blocDeMotifs('corpus-64', corpus.niveaux['64'].map((c) => ({ id: c.representant.id, champ: champDeLEntree(par.get(c.representant.id)) })), { fref, spectre });
}
/** Les formes à quatre axes de data/formes-quatre-axes-288.json qui ne sont pas dans le corpus (256) : des entrées { id, tricolore, quatreAxes } comme celles du corpus, pour l'affichage. */
export function entreesEtendues(formes) {
  return formes.formes.filter((f) => !f.corpus).map((f, i) => ({ id: f.id, tricolore: f.tricolore, quatre_axes: true, rang: i + 1 }));
}
/** Le bloc étendu : les 64 représentants du corpus puis les formes à quatre axes nouvelles, avec le spectre à trois teintes (le meilleur des quatre jeux mesurés, voir tools/couverture_son.mjs). */
export function blocEtendu(corpus, formes, { fref = 220, spectre = 'trois-teintes' } = {}) {
  const par = new Map(corpus.entrees.map((e) => [e.id, e]));
  const motifs = [...corpus.niveaux['64'].map((c) => ({ id: c.representant.id, champ: champDeLEntree(par.get(c.representant.id)) })), ...entreesEtendues(formes).map((e) => ({ id: e.id, champ: champDeLEntree(e) }))];
  return blocDeMotifs('corpus-64-etendu', motifs, { fref, spectre });
}
const cosinus = (bloc, j, a) => { let s = 0; for (let k = 0; k < bloc.NS; k++) s += bloc.Pc[j * bloc.NS + k] * a[k]; return s; };
/** Les `k` motifs du bloc les plus ressemblants au vecteur de son `v` : [{ i, score }], du plus au moins ressemblant (à score égal, le plus petit indice). */
export function lesPlusRessemblants(v, bloc, k = NOMBRE_ENTRE_DEUX) {
  const a = vecteurAudio(v, bloc); if (!a) return [];
  const sc = []; for (let j = 0; j < bloc.n; j++) sc.push({ i: j, score: cosinus(bloc, j, a) });
  sc.sort((x, y) => (y.score - x.score) || (x.i - y.i));
  return sc.slice(0, k);
}

// ---------- SPECTRE ----------
/** Le motif du bloc dont le spectre ressemble le plus à celui du son ; `ref` : le motif précédent (pour départager les ex æquo). Rend { i, score } ou i = -1 (silence). */
export const choisirParSpectre = (v, bloc, ref = -1) => meilleurMotif(v, bloc, ref);

// ---------- le spectre lissé ----------
/** Une moyenne glissante exponentielle des vecteurs de bandes, de constante de temps `tau` secondes (le pas de temps vient de l'appelant). */
export function creerLisseur(tau = LISSAGE_S) {
  let v = null, tPrec = null;
  return {
    reinitialiser() { v = null; tPrec = null; },
    pousser(x, t) {
      if (!v) v = Float64Array.from(x);
      else { const dt = Math.max(0, t - tPrec), k = 1 - Math.exp(-dt / tau); for (let i = 0; i < v.length; i++) v[i] += (x[i] - v[i]) * k; }
      tPrec = t; return v;
    },
    get valeur() { return v; },
  };
}

// ---------- ENTRE-DEUX ----------
/**
 * L'entre-deux : à chaque appel de pas(v), les `k` motifs les plus ressemblants au spectre `v`, puis, parmi eux, le plus proche (distance(courant, i)) du courant, non vu
 * dans le cycle ; si tous ceux-là ont été vus, un nouveau cycle commence (le courant pour seul « vu »). Rend { i, top, nouveauCycle } ou null (silence).
 */
export function creerEntreDeux({ bloc, distance, k = NOMBRE_ENTRE_DEUX, depart = 0 }) {
  let courant = depart, vus = new Set([depart]);
  return {
    get courant() { return courant; },
    get vus() { return new Set(vus); },
    forcer(i) { courant = i; vus.add(i); },
    pas(v) {
      const top = lesPlusRessemblants(v, bloc, k); if (!top.length) return null;
      let nouveauCycle = false, cand = top.filter((x) => !vus.has(x.i));
      if (!cand.length) { vus = new Set([courant]); nouveauCycle = true; cand = top.filter((x) => x.i !== courant); if (!cand.length) cand = top.slice(0, 1); }
      let meilleur = cand[0], dm = Infinity;
      for (const x of cand) { const d = x.i === courant ? 0 : distance(courant, x.i); if (d < dm || (d === dm && x.i < meilleur.i)) { dm = d; meilleur = x; } }
      courant = meilleur.i; vus.add(courant);
      return { i: courant, top: top.map((x) => x.i), nouveauCycle };
    },
  };
}

// ---------- le chef d'orchestre ----------
/**
 * Le chef : image après image (`chef.image({ db, sampleRate, t })`, db = spectre en dB, t en secondes), il rend { changer, i, repli, bpm, regulier } — `i` est l'indice du
 * motif à montrer (dans la liste du défilé, ou dans le bloc des 64 représentants selon le mode), `repli` est vrai quand l'entre-deux, faute de pulsation régulière, avance
 * au minuteur (l'écran doit le dire).
 *   `tenueMinS` (« réduire les changements rapides ») : jamais deux changements à moins de tenueMinS secondes, quel que soit le déclencheur ; au moins TENUE_MIN_S (0,8 s) dans tous les cas, et le Spectre garde son motif courant
 *   tant qu'un autre n'est pas meilleur d'au moins MARGE_SPECTRE.
 *   defile     { liste: { n, distance }, declencheur: 'minuteur' | 'pulsation', periodeS, graine }
 *   spectre    { bloc }
 *   entre-deux { bloc, distance, periodeS }
 */
export function creerChef({ mode, declencheur = 'minuteur', periodeS = PERIODE_MINUTEUR_S, graine = 1, liste = null, bloc = null, distance = null, sansRepliApres = 4, tenueMinS = 0, reglages = {} }) {
  // `reglages` (prompt 273, « Plus d'options ») : seuil (écarts-types, 0,45), intervalle (s, 0,45), lissageS (constante de temps, LISSAGE_S), pente, loi, c — les réglages de l'analyse du son de l'ancienne version ; absents : ceux d'avant.
  const { seuil = 0.45, intervalle = 0.45, lissageS = LISSAGE_S, pente = true, loi, c } = reglages;
  const optionsBandes = { pente, ...(loi ? { loi } : {}), ...(c ? { c } : {}) };
  if (!MODES.includes(mode)) throw new Error(`pavane-moteur.js : mode « ${mode} » inconnu`);
  const defile = mode === 'defile' ? creerDefile({ n: liste.n, distance: liste.distance, graine }) : null;
  const entre = mode === 'entre-deux' ? creerEntreDeux({ bloc, distance }) : null;
  const tenueS = Math.max(tenueMinS, TENUE_MIN_S); // le plancher de 0,8 s vaut toujours ; « Mouvement réduit » monte à 3 s
  const detecteur = creerDetecteurAttaques({ sigma: seuil, intervalleMin: intervalle }), suivi = creerSuiviPulsation(), lisseur = creerLisseur(lissageS);
  let derniere = null, tChange = null, tDebut = null, sansPulsationDepuis = null, courant = -1, regulier = false, bpm = null;
  const sortie = (changer, i, repli = false) => ({ changer, i, repli, bpm, regulier });
  const minuteurEchu = (t) => tChange === null || t - tChange >= periodeS;
  return {
    get mode() { return mode; },
    get courant() { return courant; },
    reinitialiser() { detecteur.reinitialiser(); suivi.reinitialiser(); lisseur.reinitialiser(); derniere = null; tChange = null; tDebut = null; sansPulsationDepuis = null; },
    image({ db, sampleRate, t }) {
      if (tDebut === null) tDebut = t;
      let attaque = false;
      if (db) {
        const r = detecteur.traiter(db, sampleRate, t);
        if (r.attaque) { attaque = true; suivi.attaque(r.temps); }
        const e = suivi.etat(); regulier = !!e.regulier; bpm = e.regulier ? e.bpm : null;
      }
      if (mode === 'defile') {
        const tenue = tChange !== null && t - tChange < tenueS - 1e-6;
        const declenche = declencheur === 'pulsation' ? attaque : minuteurEchu(t);
        if ((!declenche || tenue) && courant !== -1) return sortie(false, courant);
        const p = defile.suivant(); courant = p.i; tChange = t; return sortie(true, courant);
      }
      const v = db ? lisseur.pousser(bandesDuSon(db, sampleRate, optionsBandes), t) : lisseur.valeur;
      if (mode === 'spectre') {
        if (!v) return sortie(false, courant);
        const m = choisirParSpectre(v, bloc, courant);
        if (courant >= 0 && m.i >= 0 && m.i !== courant) { const a = vecteurAudio(v, bloc); if (a && m.score - cosinus(bloc, courant, a) < MARGE_SPECTRE) return sortie(false, courant); } // la marge de préférence pour le motif courant
        if (m.i < 0 || m.i === courant || (tChange !== null && t - tChange < tenueS - 1e-6)) return sortie(false, courant);
        courant = m.i; tChange = t; return sortie(true, courant);
      }
      // entre-deux : la pulsation avance ; sans pulsation régulière assez longtemps, le minuteur la remplace
      if (!v) return sortie(false, courant);
      if (regulier) sansPulsationDepuis = null; else if (sansPulsationDepuis === null) sansPulsationDepuis = t;
      const repli = !regulier && t - sansPulsationDepuis >= sansRepliApres;
      const declenche = (repli ? minuteurEchu(t) : (regulier && attaque)) && !(tChange !== null && t - tChange < tenueS - 1e-6);
      if (!declenche) return sortie(false, courant, repli);
      const p = entre.pas(v); if (!p) return sortie(false, courant, repli);
      courant = p.i; tChange = t; return sortie(true, courant, repli);
    },
  };
}
