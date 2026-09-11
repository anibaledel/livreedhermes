/**
 * carter_random.js — Port JS de carter_random.py + carter.py
 * La Livrée d'Hermès — Anibal Edelberto Amiot (2026)
 *
 * Encode/décode des messages dans une grille stéganographique 90×90
 * avec référents aléatoires dérivés de la clé.
 *
 * Usage navigateur : les référents sont générés dynamiquement depuis la
 * graine (Mersenne Twister, comme côté Python) — aucun fichier JSON à
 * charger.
 *
 * Aucune dépendance externe (pas de bundler requis — chargeable tel
 * quel via <script type="module">). AES-256-GCM (voir crypto_core.js)
 * substitue ChaCha20-Poly1305, absent de l'API Web Crypto.
 */

import {
  encrypt, decrypt, payloadToSymbols, symbolsNeeded, maxMessageFor,
  ALPHA_LEN, hkdf, utf8ToBytes, concatBytes, randomSymbols,
} from './crypto_core.js';
import { sha256 } from './sha256.js';

// ── Constantes ────────────────────────────────────────────────────────────────
export const GRID_SIZE  = 90;
export const CELL_SIZE  = 6;
export const N_SIDE     = GRID_SIZE / CELL_SIZE;   // 15
export const N_BLOCKS   = N_SIDE * N_SIDE;          // 225
export const META       = 3;
export const N_META     = N_SIDE / META;            // 5
export const N_META_TOT = N_META * N_META;          // 25
export const N_DIR      = 4;
export const N_FORMS    = 256;

export const SEEDS = [42, 137, 999, 271, 1337, 31415, 27182, 61803, 65537, 99991];

// Ordre concentrique dans un méta-bloc 3×3
export const CONC_ORDER = [
  [1,1],
  [0,1],[1,0],[1,2],[2,1],
  [0,0],[0,2],[2,0],[2,2],
];

const PURE = 0, STRUCTURED = 1, MESSAGE = 2;

// ── Mersenne Twister (reproduction exacte du random.Random Python) ─────────────
class MersenneTwister {
  constructor(seed) {
    this.mt  = new Uint32Array(624);
    this.idx = 624;
    this.mt[0] = seed >>> 0;
    for (let i = 1; i < 624; i++) {
      this.mt[i] = (Math.imul(1812433253, (this.mt[i-1] ^ (this.mt[i-1] >>> 30))) + i) >>> 0;
    }
  }
  _generate() {
    for (let i = 0; i < 624; i++) {
      const y = (this.mt[i] & 0x80000000) | (this.mt[(i+1)%624] & 0x7fffffff);
      this.mt[i] = this.mt[(i+397)%624] ^ (y >>> 1);
      if (y & 1) this.mt[i] ^= 2567483615;
    }
    this.idx = 0;
  }
  nextInt32() {
    if (this.idx >= 624) this._generate();
    let y = this.mt[this.idx++];
    y ^= y >>> 11;
    y ^= (y << 7) & 2636928640;
    y ^= (y << 15) & 4022730752;
    y ^= y >>> 18;
    return y >>> 0;
  }
  random() {
    // Float [0,1) — reproduit random.random() de Python
    const a = this.nextInt32() >>> 5;
    const b = this.nextInt32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  }
  randInt(n) {
    // Reproduit random.randrange(n) de Python pour n < 2^32
    return Math.floor(this.random() * n);
  }
  shuffle(arr) {
    // Reproduit random.shuffle() de Python (Fisher-Yates)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.randInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}

// ── Génération des référents ───────────────────────────────────────────────────
function generateForm(rng) {
  /** Génère une forme 6×6 aléatoire bariolée (run ≤ 2 en lecture ligne). */
  const nAssign = N_DIR * CELL_SIZE; // 24 positions sur 36
  for (let attempt = 0; attempt < 5000; attempt++) {
    const cells = [];
    for (let r = 0; r < CELL_SIZE; r++)
      for (let c = 0; c < CELL_SIZE; c++)
        cells.push([r, c]);
    rng.shuffle(cells);

    const grid = new Map();
    cells.slice(0, nAssign).forEach(([r,c], i) => {
      grid.set(`${r},${c}`, i % N_DIR);
    });

    // Contrainte bariolé : run ≤ 2
    const seq = [];
    for (let r = 0; r < CELL_SIZE; r++)
      for (let c = 0; c < CELL_SIZE; c++) {
        const d = grid.get(`${r},${c}`);
        if (d !== undefined) seq.push(d);
      }

    let ok = true, run = 1;
    for (let i = 1; i < seq.length; i++) {
      run = seq[i] === seq[i-1] ? run+1 : 1;
      if (run > 2) { ok = false; break; }
    }
    if (!ok) continue;

    // Construire dirs = { 0: [[r,c],...], 1: ..., 2: ..., 3: ... }
    const dirs = {0:[], 1:[], 2:[], 3:[]};
    grid.forEach((d, key) => {
      const [r,c] = key.split(',').map(Number);
      dirs[d].push([r,c]);
    });
    return dirs;
  }
  return null;
}

function makeReferent(seed) {
  /** Génère 256 formes pour un seed — même algorithme que Python. */
  const rng   = new MersenneTwister(seed);
  const forms = [];
  while (forms.length < N_FORMS) {
    const f = generateForm(rng);
    if (f !== null) forms.push(f);
  }
  return forms;
}

const _cache = new Map();
export function getReferent(seed) {
  if (!_cache.has(seed)) _cache.set(seed, makeReferent(seed));
  return _cache.get(seed);
}

// ── carterSplit ────────────────────────────────────────────────────────────────
export async function carterSplit(masterKey) {
  const xchachaKey = await hkdf(masterKey, utf8ToBytes('Carter-v2'), 'encrypt', 32);
  const grammarKey = await hkdf(masterKey, utf8ToBytes('Carter-v2'), 'grammar', 32);
  return { xchachaKey, grammarKey };
}

// ── deriveMasks ──────────────────────────────────────────────────────────────
// SHA-256 pur JS (voir sha256.js) : chaînage synchrone dans une boucle
// potentiellement longue (jusqu'à n = grid_size² au décodage) — un
// crypto.subtle.digest async par itération aurait un coût de dispatch
// cumulé bien plus élevé qu'un calcul synchrone en boucle serrée.
function deriveMasks(grammarKey, n) {
  /**
   * Reproduit _derive_masks de carter.py.
   * SHA256 chaîné avec rejection sampling pour uniformité exacte.
   */
  const masks = [];
  const lim   = Math.floor(256 / ALPHA_LEN) * ALPHA_LEN; // 44*5=220
  // État initial : sha256(grammar_key + b'position-masks-v1')
  let state = sha256(concatBytes(grammarKey, utf8ToBytes('position-masks-v1')));
  while (masks.length < n) {
    for (const b of state) {
      if (b < lim) {
        masks.push(b % ALPHA_LEN);
        if (masks.length >= n) break;
      }
    }
    state = sha256(state);
  }
  return masks;
}

// ── derive_params (CR-1/CR-1b : bascule meta/individuel par comparaison directe) ─
export async function deriveParams(grammarKey, gridSize = GRID_SIZE) {
  const km = await hkdf(grammarKey, utf8ToBytes('Carter-params-v3'), 'seed-and-mode', 4);
  const seed    = SEEDS[km[0] % SEEDS.length];
  const metaRaw = km[1] < 128;

  if (metaRaw) {
    const ref       = getReferent(seed);
    const nMetaSide = Math.floor(gridSize / (CELL_SIZE * META));
    const mg        = await grammarMeta(grammarKey, ref, nMetaSide * nMetaSide, nMetaSide);
    const nMsgMeta  = mg.filter(g => g.role === MESSAGE).length;
    // Capacité en SYMBOLES (pas en octets approximés) : cohérent avec
    // symbolsNeeded()/maxMessageFor() de crypto_core.js.
    const capMetaSyms = nMsgMeta * META * META * CELL_SIZE;

    const nSideInd  = Math.floor(gridSize / CELL_SIZE);
    const gi        = await grammarIndividual(grammarKey, ref, nSideInd);
    const nMsgInd   = gi.filter(g => g.role === MESSAGE).length;
    const capIndSyms = nMsgInd * CELL_SIZE;

    return { seed, metaMode: capMetaSyms >= capIndSyms };
  }
  return { seed, metaMode: false };
}

// ── grammarIndividual ────────────────────────────────────────────────────────
export async function grammarIndividual(grammarKey, ref, nSide = N_SIDE) {
  const nBlocks = nSide * nSide;
  const km = await hkdf(grammarKey, utf8ToBytes('Carter-random-v3'), 'grammar-individual', nBlocks * 3);
  return Array.from({length: nBlocks}, (_, i) => ({
    role:   km[i*3] < 85 ? PURE : (km[i*3] < 170 ? STRUCTURED : MESSAGE),
    formId: Math.floor((km[i*3+1] * N_FORMS) / 256),
    dir:    km[i*3+2] % N_DIR,
  }));
}

// ── grammarMeta ──────────────────────────────────────────────────────────────
export async function grammarMeta(grammarKey, ref,
                                   nMetaTot = N_META_TOT, nMeta = N_META) {
  const km1 = await hkdf(grammarKey, utf8ToBytes('Carter-meta-v3'), 'meta-roles',  nMetaTot * 2);
  const km2 = await hkdf(grammarKey, utf8ToBytes('Carter-meta-v3'), 'block-forms', nMetaTot * META * META * 2);
  return Array.from({length: nMetaTot}, (_, mi) => ({
    role: km1[mi*2] < 85 ? PURE : (km1[mi*2] < 170 ? STRUCTURED : MESSAGE),
    sub:  Array.from({length: META*META}, (_, bi) => ({
      formId: Math.floor((km2[(mi*9+bi)*2] * N_FORMS) / 256),
      dir:    km2[(mi*9+bi)*2+1] % N_DIR,
    })),
    nMeta,
  }));
}

// ── encodeCarterRandom ─────────────────────────────────────────────────────────
export async function encodeCarterRandom(message, masterKey, gridSize = GRID_SIZE) {
  /**
   * Encode un message dans une grille gridSize×gridSize.
   * Correspond à encode_carter_random(message, master_key) en Python.
   */
  const { xchachaKey, grammarKey } = await carterSplit(masterKey);
  const { seed, metaMode } = await deriveParams(grammarKey, gridSize);
  const ref = getReferent(seed);

  const nSideG    = Math.floor(gridSize / CELL_SIZE);
  const nMetaG    = Math.floor(nSideG / META);
  const nMetaTotG = nMetaG * nMetaG;

  // Chiffrer et convertir en symboles base-44 (même flux que crypto_core.py
  // côté Python : payloadToSymbols, pas une conversion "2 symboles/octet"
  // fixe qui ne correspondrait pas au format d'encodage réel).
  const payload = await encrypt(message, xchachaKey);
  const symbols = payloadToSymbols(payload);
  const nSyms   = symbols.length;

  // Grille de bruit — remplissage bulk CSPRNG (voir crypto_core.randomSymbols),
  // pas Math.random() (non cryptographique, ne garantit pas l'indiscernabilité
  // statistique des cellules message).
  const flat = randomSymbols(gridSize * gridSize);
  const grid = [];
  for (let r = 0; r < gridSize; r++) grid.push(flat.slice(r*gridSize, (r+1)*gridSize));

  const masks = deriveMasks(grammarKey, nSyms + 128);
  let symI = 0;

  if (!metaMode) {
    // ── Mode individuel ──
    const grammar = await grammarIndividual(grammarKey, ref, nSideG);
    const nMsg    = grammar.filter(g => g.role === MESSAGE).length;
    const cap     = nMsg * CELL_SIZE;
    if (nSyms > cap)
      throw new Error(`Message trop long : ${message.length} caractères > `
        + `${maxMessageFor(cap)} disponibles (n_msg=${nMsg})`);

    grammar.forEach((g, i) => {
      if (g.role !== MESSAGE) return;
      const br = Math.floor(i / nSideG), bc = i % nSideG;
      const form = ref[g.formId];
      const r0 = br * CELL_SIZE, c0 = bc * CELL_SIZE;
      for (const [pr, pc] of form[g.dir]) {
        if (symI >= nSyms) break;
        const gr = r0+pr, gc = c0+pc;
        if (gr < gridSize && gc < gridSize)
          grid[gr][gc] = (symbols[symI] + masks[symI]) % ALPHA_LEN;
        symI++;
      }
    });
    return { grid, mode: 'individual', seed, metaMode, nMsgBlocks: nMsg,
             capacityChars: maxMessageFor(cap) };

  } else {
    // ── Mode méta-concentrique ──
    const grammar = await grammarMeta(grammarKey, ref, nMetaTotG, nMetaG);
    const nMsg    = grammar.filter(g => g.role === MESSAGE).length;
    const cap     = nMsg * META * META * CELL_SIZE;
    if (nSyms > cap)
      throw new Error(`Message trop long (méta) : ${message.length} caractères > `
        + `${maxMessageFor(cap)} disponibles (n_msg_meta=${nMsg})`);

    grammar.forEach((mg, mi) => {
      if (mg.role !== MESSAGE) return;
      const mr = Math.floor(mi / nMetaG), mc = mi % nMetaG;
      CONC_ORDER.forEach(([brOff, bcOff], ci) => {
        const sg   = mg.sub[ci];
        const form = ref[sg.formId];
        const br = mr*META+brOff, bc = mc*META+bcOff;
        const r0 = br*CELL_SIZE, c0 = bc*CELL_SIZE;
        for (const [pr, pc] of form[sg.dir]) {
          if (symI >= nSyms) break;
          const gr = r0+pr, gc = c0+pc;
          if (gr < gridSize && gc < gridSize)
            grid[gr][gc] = (symbols[symI] + masks[symI]) % ALPHA_LEN;
          symI++;
        }
      });
    });
    return { grid, mode: 'meta', seed, metaMode, nMsgBlocks: nMsg,
             capacityChars: maxMessageFor(cap) };
  }
}

// ── decodeCarterRandom ─────────────────────────────────────────────────────────
export async function decodeCarterRandom(grid, masterKey, gridSize = GRID_SIZE) {
  /**
   * Décode une grille.
   * Correspond à decode_carter_random(grid, master_key) en Python.
   */
  const { xchachaKey, grammarKey } = await carterSplit(masterKey);
  const { seed, metaMode } = await deriveParams(grammarKey, gridSize);
  const ref = getReferent(seed);

  const nSideG    = Math.floor(gridSize / CELL_SIZE);
  const nMetaG    = Math.floor(nSideG / META);
  const nMetaTotG = nMetaG * nMetaG;

  // Taille de masque precise (grid_size², comme cote Python) plutot qu'une
  // constante arbitraire : n'a d'effet que sur le nombre de masques generes
  // en trop, mais reste plus clair et evite toute hypothese implicite sur
  // la taille de grille maximale.
  const masks = deriveMasks(grammarKey, gridSize * gridSize);
  const vals  = [];
  let symI    = 0;

  if (!metaMode) {
    const grammar = await grammarIndividual(grammarKey, ref, nSideG);
    grammar.forEach((g, i) => {
      if (g.role !== MESSAGE) return;
      const br = Math.floor(i / nSideG), bc = i % nSideG;
      const form = ref[g.formId];
      const r0 = br*CELL_SIZE, c0 = bc*CELL_SIZE;
      for (const [pr, pc] of form[g.dir]) {
        const gr = r0+pr, gc = c0+pc;
        if (gr < gridSize && gc < gridSize)
          vals.push((grid[gr][gc] - masks[symI] + ALPHA_LEN) % ALPHA_LEN);
        symI++;
      }
    });
  } else {
    const grammar = await grammarMeta(grammarKey, ref, nMetaTotG, nMetaG);
    grammar.forEach((mg, mi) => {
      if (mg.role !== MESSAGE) return;
      const mr = Math.floor(mi / nMetaG), mc = mi % nMetaG;
      CONC_ORDER.forEach(([brOff, bcOff], ci) => {
        const sg   = mg.sub[ci];
        const form = ref[sg.formId];
        const br = mr*META+brOff, bc = mc*META+bcOff;
        const r0 = br*CELL_SIZE, c0 = bc*CELL_SIZE;
        for (const [pr, pc] of form[sg.dir]) {
          const gr = r0+pr, gc = c0+pc;
          if (gr < gridSize && gc < gridSize)
            vals.push((grid[gr][gc] - masks[symI] + ALPHA_LEN) % ALPHA_LEN);
          symI++;
        }
      });
    });
  }

  return decrypt(vals, xchachaKey);
}

// ── Utilitaires ───────────────────────────────────────────────────────────────
export async function carterRandomFits(message, masterKey, gridSize = GRID_SIZE) {
  const { grammarKey } = await carterSplit(masterKey);
  const { seed, metaMode } = await deriveParams(grammarKey, gridSize);
  const ref = getReferent(seed);
  const nSideG = Math.floor(gridSize / CELL_SIZE);
  if (!metaMode) {
    const g   = await grammarIndividual(grammarKey, ref, nSideG);
    const cap = g.filter(x => x.role === MESSAGE).length * CELL_SIZE;
    return message.length <= maxMessageFor(cap);
  } else {
    const nMetaG = Math.floor(nSideG / META);
    const g   = await grammarMeta(grammarKey, ref, nMetaG*nMetaG, nMetaG);
    const cap = g.filter(x => x.role === MESSAGE).length * META*META*CELL_SIZE;
    return message.length <= maxMessageFor(cap);
  }
}

export async function carterRandomCapacity(masterKey, gridSize = GRID_SIZE) {
  const { grammarKey } = await carterSplit(masterKey);
  const { seed, metaMode } = await deriveParams(grammarKey, gridSize);
  const ref = getReferent(seed);
  const nSideG = Math.floor(gridSize / CELL_SIZE);
  let cap, g;
  if (!metaMode) {
    g   = await grammarIndividual(grammarKey, ref, nSideG);
    cap = g.filter(x => x.role === MESSAGE).length * CELL_SIZE;
  } else {
    const nMetaG = Math.floor(nSideG / META);
    g   = await grammarMeta(grammarKey, ref, nMetaG*nMetaG, nMetaG);
    cap = g.filter(x => x.role === MESSAGE).length * META*META*CELL_SIZE;
  }
  return { seed, metaMode, charsMax: maxMessageFor(cap) };
}
