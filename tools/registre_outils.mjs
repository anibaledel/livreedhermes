#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// registre_outils.mjs — le registre des outils du dépôt (tools/registre.json),
// et le contrôle qui ÉCHOUE QUAND IL MENT (consigne « un registre des outils du
// dépôt », 2026-10-05).
//
// Le registre ne décrit pas les outils : il les DÉCLARE, et presque tout ce
// qu'il déclare se relit dans le dépôt à chaque contrôle :
//   role         la première phrase de l'en-tête du script (citée, pas réécrite) ;
//   lit / ecrit  les chemins du dépôt nommés dans le source (ecrit : sur une
//                ligne d'écriture — writeFileSync, open(…, 'w'), .save…) ;
//   appele_par   les workflows de .github/workflows/ qui le nomment ;
//   utilise_par  les scripts de tools/ qui l'importent ou le lancent ;
//   sait_echouer vrai seulement si un workflow le lance avec --essai (la
//                preuve, dans la CI, qu'il refuse une entrée faussée).
// Seuls deux champs se décident à la main : etat et panne.
//   actif     appelé par un workflow, ou utilisé par un script actif ;
//   ponctuel  lancé à la main (normal) — il doit quand même tenir debout ;
//   obsolete  ne sert plus ; reste dans le dépôt, n'est plus vérifié ;
//   en_panne  ne tient pas debout aujourd'hui ; « panne » dit pourquoi, et le
//             contrôle exige qu'il soit TOUJOURS en panne (réparé, l'entrée
//             mentirait : il faut alors la repasser en actif ou ponctuel).
//
// « Tenir debout », vérifié sans lancer le script (certains écrivent, d'autres
// durent dix minutes, d'autres demandent des arguments) :
//   - la syntaxe (node --check, compile de Python) ;
//   - chaque import local résolu, et chaque nom importé d'un module local
//     défini dans ce module (c'est ainsi que derive_echelles.py est tombé :
//     « measure » n'existe plus dans measure_k_pic.py) ;
//   - chaque dépendance extérieure présente (paquet npm, module Python).
//
// Le contrôle échoue si :
//   1. un fichier de tools/ est absent du registre ;
//   2. une entrée nomme un fichier qui n'existe plus ;
//   3. appele_par (ou un autre champ relu) diffère de ce que dit le dépôt ;
//   4. une entrée actif (ou ponctuel) ne tient pas debout, ou une entrée
//      actif n'est appelée par rien ;
//   et une entrée en_panne qui tient debout, ou sans « panne ».
// --essai fausse le registre en mémoire des quatre façons et exige les quatre
// échecs.
//
// Usage : node tools/registre_outils.mjs --ecrire    met à jour les champs relus
//         node tools/registre_outils.mjs --verifie   le contrôle
//         node tools/registre_outils.mjs --essai     le contrôle sait échouer
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { premierePhrase } from './entete.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRE = path.join(ROOT, 'tools/registre.json');
const args = process.argv.slice(2);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const ETATS = ['actif', 'ponctuel', 'obsolete', 'en_panne'];

// ---- le dépôt ------------------------------------------------------------------
function fichiersDeTools() {
  const out = [];
  const marche = (d) => {
    for (const n of readdirSync(d).sort()) {
      if (n === '__pycache__' || n === 'node_modules' || n.startsWith('.')) continue;
      const p = path.join(d, n);
      if (statSync(p).isDirectory()) marche(p); else out.push(rel(p));
    }
  };
  marche(path.join(ROOT, 'tools'));
  // le registre ne se déclare pas lui-même
  return out.filter((f) => f !== 'tools/registre.json');
}
const estScript = (f) => /\.(mjs|js|cjs|py)$/.test(f);
const source = (f) => readFileSync(path.join(ROOT, f), 'utf8');

const WORKFLOWS = readdirSync(path.join(ROOT, '.github/workflows')).filter((n) => /\.ya?ml$/.test(n)).sort()
  .map((n) => ({ nom: n, texte: readFileSync(path.join(ROOT, '.github/workflows', n), 'utf8') }));
function appelsDe(f) {
  const appele = [], essai = [];
  const re = new RegExp(`(^|[^\\w./-])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`);
  for (const w of WORKFLOWS) {
    const lignes = w.texte.split('\n').filter((l) => re.test(l) && !/^\s*#/.test(l));
    if (lignes.length) appele.push(w.nom);
    if (lignes.some((l) => /--essai\b/.test(l))) essai.push(w.nom);
  }
  return { appele, essai };
}

// role : la première phrase de l'en-tête (tools/entete.mjs, partagé avec index_codes.mjs)
const roleDe = (f) => premierePhrase(f, source(f));

// lit / ecrit : les chemins du dépôt nommés dans le source
const RACINES = '(?:data|assets|docs|motifs|fr|en|es|th|zh|ru|pt|hi|book-viewer|scripts|articles|hexagrammes|tools)';
const ECRITURE = /(writeFileSync|appendFileSync|copyFileSync|cpSync|ecrire[A-Z]?\w*\(|open\([^)]*,\s*['"][wa]b?['"]|\.write_text|\.write_bytes|\.save\(|json\.dump\(|to_csv|shutil\.copy)/;
function cheminsDe(f) {
  const lit = new Set(), ecrit = new Set();
  const re = new RegExp(`['"\`](${RACINES}/[^'"\`\\s$*{}]+?)['"\`]`, 'g');
  for (const ligne of source(f).split('\n')) {
    if (/^\s*(\/\/|#|\*)/.test(ligne)) continue;
    for (const m of ligne.matchAll(re)) {
      const p = m[1].replace(/\/$/, '');
      // un chemin qui n'existe pas dans le dépôt (adresse faussée d'un essai, exemple) n'est pas une donnée
      if (p === f || !existsSync(path.join(ROOT, p))) continue;
      (ECRITURE.test(ligne) ? ecrit : lit).add(p);
    }
  }
  return { lit: [...lit].sort(), ecrit: [...ecrit].sort() };
}

const CITENT_SANS_LANCER = new Set(['tools/registre_outils.mjs', 'tools/index_referents.mjs', 'tools/index_codes.mjs', 'tools/check_resultats_etablis.mjs']);
// utilise_par : les scripts de tools/ qui l'importent ou le lancent
function utilisateursDe(f, tous) {
  const base = path.basename(f), stem = base.replace(/\.(mjs|js|cjs|py)$/, '');
  const mod = f.startsWith('tools/axes/') ? `axes\\.${stem}|from axes import[^\\n]*\\b${stem}\\b` : stem;
  const reJs = new RegExp(`['"\`][^'"\`\\s]*\\b${base.replace(/\./g, '\\.')}['"\`]`);
  const rePy = new RegExp(`^\\s*(from\\s+(${mod})\\s+import|import\\s+(${mod})\\b)`, 'm');
  // côté Python, un nom de fichier cité (message, table de dérogations) n'est pas un lancement :
  // seule compte une ligne qui lance (subprocess, runpy, chemin construit)
  const lance = (g) => g.endsWith('.py')
    ? source(g).split('\n').some((l) => !/^\s*#/.test(l) && /subprocess|Popen|runpy|os\.path\.join|execfile|\bexec\(/.test(l) && reJs.test(l))
    : reJs.test(source(g));
  // le registre lui-même cite tous les fichiers sans en lancer aucun ; l'index
  // des référents (index_referents.mjs) nomme les générateurs et vérificateurs
  // de chaque référent, sans en lancer aucun non plus
  return tous.filter((g) => g !== f && !CITENT_SANS_LANCER.has(g) && estScript(g) && (lance(g) || (f.endsWith('.py') && g.endsWith('.py') && rePy.test(source(g))))).sort();
}

// ---- tenir debout -------------------------------------------------------------------
const exportsJs = new Map();
function exportsDe(cible) {
  if (exportsJs.has(cible)) return exportsJs.get(cible);
  const s = readFileSync(cible, 'utf8');
  const noms = new Set();
  let etoile = false;
  for (const m of s.matchAll(/export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([\w$]+)/g)) noms.add(m[1]);
  for (const m of s.matchAll(/export\s*\{([^}]*)\}/g)) for (const p of m[1].split(',')) { const n = p.trim().split(/\s+as\s+/).pop(); if (n) noms.add(n); }
  if (/export\s+default/.test(s)) noms.add('default');
  if (/export\s*\*\s*from/.test(s) || /module\.exports|exports\.\w+\s*=/.test(s)) etoile = true;
  const r = { noms, etoile };
  exportsJs.set(cible, r);
  return r;
}
function santeJs(f) {
  const ennuis = [];
  const abs = path.join(ROOT, f);
  const r = spawnSync(process.execPath, ['--check', abs], { encoding: 'utf8' });
  if (r.status !== 0) ennuis.push(`syntaxe : ${(r.stderr.split('\n').find((l) => /Error/.test(l)) || '').trim()}`);
  const req = createRequire(abs);
  const s = readFileSync(abs, 'utf8');
  const imports = [...s.matchAll(/^import\s+(?:([\w$]+)\s*,?\s*)?(?:\{([^}]*)\})?\s*(?:\*\s+as\s+[\w$]+\s*)?from\s+['"]([^'"]+)['"]/gm), ...s.matchAll(/^import\s+['"]([^'"]+)['"]/gm)]
    .map((m) => (m.length === 2 ? { spec: m[1] } : { defaut: m[1], noms: m[2], spec: m[3] }));
  for (const i of imports) {
    if (i.spec.startsWith('node:')) continue;
    if (i.spec.startsWith('.') || i.spec.startsWith('/')) {
      const cible = path.resolve(path.dirname(abs), i.spec);
      if (!existsSync(cible)) { ennuis.push(`import introuvable : ${i.spec}`); continue; }
      const ex = exportsDe(cible);
      if (ex.etoile) continue;
      for (const p of (i.noms || '').split(',')) {
        const n = p.trim().split(/\s+as\s+/)[0].trim();
        if (n && !ex.noms.has(n)) ennuis.push(`« ${n} » n'est pas exporté par ${rel(cible)}`);
      }
      if (i.defaut && !ex.noms.has('default')) ennuis.push(`pas d'export par défaut dans ${rel(cible)}`);
    } else {
      const paquet = i.spec.startsWith('@') ? i.spec.split('/').slice(0, 2).join('/') : i.spec.split('/')[0];
      try { req.resolve(`${paquet}/package.json`); } catch {
        try { req.resolve(paquet); } catch { ennuis.push(`paquet absent : ${paquet}`); }
      }
    }
  }
  return ennuis;
}
const SANTE_PY = String.raw`
import ast, json, sys, os, importlib.util
racine, fichiers = sys.argv[1], json.loads(sys.stdin.read())
tools = os.path.join(racine, 'tools')
# les dossiers que le script ajoute lui-même à sys.path (sys.path.insert / append), évalués
# statiquement : seuls os.path.join/dirname/abspath, __file__, des chaînes et des noms déjà
# évalués sont admis — rien du script ne s'exécute
SUR = {'join', 'dirname', 'abspath', 'realpath', 'normpath'}
def sur(e):
    for y in ast.walk(e):
        if isinstance(y, ast.Call):
            f = y.func
            if not (isinstance(f, ast.Attribute) and f.attr in SUR and isinstance(f.value, ast.Attribute) and f.value.attr == 'path'): return False
        elif not isinstance(y, (ast.Name, ast.Constant, ast.Attribute, ast.Load, ast.Expr)): return False
    return True
def chemins(t, p):
    env = {'__file__': p, 'os': os}; extra = []
    for x in t.body:
        if isinstance(x, ast.Assign) and len(x.targets) == 1 and isinstance(x.targets[0], ast.Name) and sur(x.value):
            try: env[x.targets[0].id] = eval(compile(ast.Expression(x.value), p, 'eval'), {'__builtins__': {}}, env)
            except Exception: pass
        elif isinstance(x, ast.Expr) and isinstance(x.value, ast.Call):
            f = x.value.func
            if isinstance(f, ast.Attribute) and f.attr in ('insert', 'append') and isinstance(f.value, ast.Attribute) and f.value.attr == 'path' and x.value.args:
                e = x.value.args[-1]
                if sur(e):
                    try: extra.append(eval(compile(ast.Expression(e), p, 'eval'), {'__builtins__': {}}, env))
                    except Exception: pass
    return [c for c in extra if isinstance(c, str)]
EXTRA = []
def local(dossier, mod):
    for base in (dossier, tools, *EXTRA):
        p = os.path.join(base, *mod.split('.'))
        if os.path.isfile(p + '.py'): return p + '.py'
        if os.path.isfile(os.path.join(p, '__init__.py')): return os.path.join(p, '__init__.py')
    return None
def noms(p):
    t = ast.parse(open(p, encoding='utf-8').read()); n = set()
    for x in t.body:
        if isinstance(x, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)): n.add(x.name)
        elif isinstance(x, ast.Assign):
            for c in x.targets:
                for e in ast.walk(c):
                    if isinstance(e, ast.Name): n.add(e.id)
        elif isinstance(x, (ast.AnnAssign, ast.AugAssign)) and isinstance(x.target, ast.Name): n.add(x.target.id)
        elif isinstance(x, (ast.Import, ast.ImportFrom)):
            for a in x.names: n.add((a.asname or a.name).split('.')[0])
        elif isinstance(x, (ast.If, ast.Try)):
            for y in ast.walk(x):
                if isinstance(y, (ast.FunctionDef, ast.ClassDef)): n.add(y.name)
                if isinstance(y, ast.Name) and isinstance(y.ctx, ast.Store): n.add(y.id)
    return n
# un module local importé est vérifié à son tour (ses propres imports, transitivement) :
# un script tombe aussi en panne quand une dépendance de sa dépendance manque
def verifier(p, vus):
    if p in vus: return []
    vus.add(p); d = os.path.dirname(p); ennuis = []
    try: t = ast.parse(open(p, encoding='utf-8').read(), filename=p)
    except SyntaxError as e: return ['syntaxe : %s' % e]
    EXTRA.extend(c for c in chemins(t, p) if c not in EXTRA)
    def suivre(cible):
        for e in verifier(cible, vus): ennuis.append(e if e.startswith('via ') else 'via %s : %s' % (os.path.relpath(cible, racine), e))
    for x in ast.walk(t):
        if isinstance(x, ast.Import): mods = [(a.name, None) for a in x.names]
        elif isinstance(x, ast.ImportFrom) and x.level == 0 and x.module: mods = [(x.module, [a.name for a in x.names])]
        elif isinstance(x, ast.ImportFrom) and x.level > 0:
            base = d
            for _ in range(x.level - 1): base = os.path.dirname(base)
            cible = local(base, x.module) if x.module else os.path.join(base, '__init__.py')
            if not cible or not os.path.isfile(cible): ennuis.append('import relatif introuvable : %s' % (x.module or '.'))
            else:
                n = noms(cible)
                for a in x.names:
                    if a.name != '*' and a.name not in n and not local(os.path.dirname(cible), a.name): ennuis.append('« %s » absent de %s' % (a.name, os.path.relpath(cible, racine)))
                suivre(cible)
            continue
        else: continue
        for mod, quoi in mods:
            cible = local(d, mod)
            if cible:
                if quoi:
                    n = noms(cible)
                    for q in quoi:
                        if q != '*' and q not in n and not local(os.path.dirname(cible), q): ennuis.append('« %s » absent de %s' % (q, os.path.relpath(cible, racine)))
                suivre(cible)
                continue
            top = mod.split('.')[0]
            if top in sys.stdlib_module_names or top == '__future__': continue
            if importlib.util.find_spec(top) is None: ennuis.append('module absent : %s' % top)
    return ennuis
out = {}
for f in fichiers:
    EXTRA[:] = []
    out[f] = sorted(set(verifier(os.path.join(racine, f), set())))
print(json.dumps(out))
`;
function santePy(fichiers) {
  if (!fichiers.length) return {};
  return JSON.parse(execFileSync('python3', ['-c', SANTE_PY, ROOT], { input: JSON.stringify(fichiers), encoding: 'utf8', maxBuffer: 1 << 24 }));
}

// ---- les champs relus ------------------------------------------------------------------
function relire(tous) {
  const r = {};
  for (const f of tous) {
    if (!estScript(f)) { r[f] = { role: f.endsWith('requirements.txt') ? 'les modules Python dont dépendent les scripts de tools/' : '', lit: [], ecrit: [], appele_par: appelsDe(f).appele, utilise_par: utilisateursDe(f, tous), sait_echouer: false }; continue; }
    const { appele, essai } = appelsDe(f);
    r[f] = { role: roleDe(f), ...cheminsDe(f), appele_par: appele, utilise_par: utilisateursDe(f, tous), sait_echouer: essai.length > 0 };
  }
  return r;
}
const CHAMPS_RELUS = ['role', 'lit', 'ecrit', 'appele_par', 'utilise_par', 'sait_echouer'];

// actif : appelé par un workflow, ou utilisé (transitivement) par un script appelé
function actifsCalcules(relu) {
  const actifs = new Set(Object.keys(relu).filter((f) => relu[f].appele_par.length));
  let change = true;
  while (change) {
    change = false;
    for (const f of Object.keys(relu)) if (!actifs.has(f) && relu[f].utilise_par.some((g) => actifs.has(g))) { actifs.add(f); change = true; }
  }
  return actifs;
}

// ---- le contrôle ------------------------------------------------------------------------
function controler(registre, relu, sante) {
  const e = [];
  const parFichier = new Map(registre.outils.map((o) => [o.fichier, o]));
  const actifs = actifsCalcules(relu);
  for (const f of Object.keys(relu)) if (!parFichier.has(f)) e.push(`[absent] ${f} est dans tools/ mais pas dans le registre`);
  for (const o of registre.outils) {
    if (!relu[o.fichier]) { e.push(`[fantome] ${o.fichier} : l'entrée nomme un fichier qui n'existe plus`); continue; }
    const r = relu[o.fichier];
    for (const c of CHAMPS_RELUS) if (JSON.stringify(o[c]) !== JSON.stringify(r[c])) {
      e.push(`[${c === 'appele_par' ? 'appel' : 'relu'}] ${o.fichier} : ${c} déclaré ${JSON.stringify(o[c])}, le dépôt dit ${JSON.stringify(r[c])}`);
    }
    if (!ETATS.includes(o.etat)) e.push(`[etat] ${o.fichier} : état « ${o.etat} » inconnu (${ETATS.join(', ')})`);
    const ennuis = sante[o.fichier] || [];
    if (o.etat === 'actif' && !actifs.has(o.fichier)) e.push(`[appel] ${o.fichier} : marqué actif, mais aucun workflow ne l'appelle, ni directement ni par un script appelé`);
    if (o.etat !== 'actif' && actifs.has(o.fichier) && o.etat !== 'en_panne') e.push(`[etat] ${o.fichier} : appelé par la CI (${[...r.appele_par, ...r.utilise_par].join(', ')}), mais marqué ${o.etat}`);
    if ((o.etat === 'actif' || o.etat === 'ponctuel') && ennuis.length) e.push(`[echoue] ${o.fichier} : marqué ${o.etat}, mais ne tient pas debout — ${ennuis.join(' ; ')}`);
    if (o.etat === 'en_panne') {
      if (!o.panne) e.push(`[etat] ${o.fichier} : en_panne sans « panne »`);
      if (!ennuis.length) e.push(`[etat] ${o.fichier} : marqué en_panne (« ${o.panne} »), mais tient debout — à repasser en actif ou ponctuel`);
    }
  }
  return e;
}

// ---- main ----------------------------------------------------------------------------------
const tous = fichiersDeTools();
const relu = relire(tous);
const sante = { ...Object.fromEntries(tous.filter((f) => /\.(mjs|js|cjs)$/.test(f)).map((f) => [f, santeJs(f)])), ...santePy(tous.filter((f) => f.endsWith('.py'))) };
const actifs = actifsCalcules(relu);

if (args.includes('--ecrire')) {
  const avant = existsSync(REGISTRE) ? JSON.parse(readFileSync(REGISTRE, 'utf8')) : { outils: [] };
  const anciens = new Map(avant.outils.map((o) => [o.fichier, o]));
  const outils = tous.map((f) => {
    const a = anciens.get(f) || {};
    let etat = a.etat || (actifs.has(f) ? 'actif' : (sante[f] || []).length ? 'en_panne' : 'ponctuel');
    if (!a.etat && etat === 'en_panne') a.panne = (sante[f] || []).join(' ; ');
    const o = { fichier: f, role: relu[f].role, lit: relu[f].lit, ecrit: relu[f].ecrit, appele_par: relu[f].appele_par, utilise_par: relu[f].utilise_par, etat, sait_echouer: relu[f].sait_echouer };
    if (a.panne || etat === 'en_panne') o.panne = a.panne;
    return o;
  });
  const disparus = avant.outils.filter((o) => !tous.includes(o.fichier)).map((o) => o.fichier);
  writeFileSync(REGISTRE, JSON.stringify({
    _doc: "Le registre des outils de tools/ (tools/registre_outils.mjs). Les champs role, lit, ecrit, appele_par, utilise_par et sait_echouer se RELISENT dans le dépôt à chaque contrôle (role : la première phrase de l'en-tête du script ; appele_par : .github/workflows/ ; sait_echouer : un workflow le lance avec --essai) ; etat (actif, ponctuel, obsolete, en_panne) et panne se décident à la main. --verifie échoue dès que le registre diverge du dépôt.",
    outils,
  }, null, 1) + '\n');
  console.log(`Registre écrit : ${outils.length} entrées${disparus.length ? ` ; entrées sans fichier gardées hors du registre : ${disparus.join(', ')}` : ''}.`);
}

if (args.includes('--verifie') || args.includes('--essai')) {
  const registre = JSON.parse(readFileSync(REGISTRE, 'utf8'));
  if (args.includes('--essai')) {
    const copie = () => JSON.parse(JSON.stringify(registre));
    const panne = registre.outils.find((o) => o.etat === 'en_panne');
    const ponctuelSansAppel = registre.outils.find((o) => o.etat === 'ponctuel' && !o.appele_par.length && estScript(o.fichier));
    const essais = [
      ['une entrée retirée', (r) => { r.outils = r.outils.filter((o) => o.fichier !== ponctuelSansAppel.fichier); }, '[absent]'],
      ['une entrée pour un fichier disparu', (r) => { r.outils.push({ ...ponctuelSansAppel, fichier: 'tools/disparu.mjs' }); }, '[fantome]'],
      ['un workflow que personne n\'appelle', (r) => { const o = r.outils.find((x) => x.fichier === ponctuelSansAppel.fichier); o.appele_par = ['check-fonds.yml']; }, '[appel]'],
      [`un script en panne marqué actif (${panne?.fichier})`, (r) => { r.outils.find((x) => x.fichier === panne.fichier).etat = 'actif'; }, '[echoue]'],
    ];
    let ok = true;
    for (const [quoi, fausser, signe] of essais) {
      const r = copie(); fausser(r);
      const e = controler(r, relu, sante).find((x) => x.startsWith(signe));
      ok &&= Boolean(e);
      console.log(`Essai : ${quoi} → ${e ? `détecté — ${e}` : 'NON DÉTECTÉ'}`);
    }
    process.exit(ok ? 0 : 1);
  }
  const erreurs = controler(registre, relu, sante);
  const compte = (etat) => registre.outils.filter((o) => o.etat === etat).length;
  console.log(`Registre : ${registre.outils.length} entrées pour ${tous.length} fichiers de tools/ — ${compte('actif')} actifs (${registre.outils.filter((o) => o.appele_par.length).length} appelés directement par un workflow), ${compte('ponctuel')} ponctuels, ${compte('en_panne')} en panne, ${compte('obsolete')} obsolètes ; ${registre.outils.filter((o) => o.sait_echouer).length} savent échouer (essai en CI).`);
  for (const o of registre.outils.filter((x) => x.etat === 'en_panne')) console.log(`  en panne : ${o.fichier} — ${o.panne}`);
  for (const e of erreurs) console.error(`ÉCHEC ${e}`);
  if (!erreurs.length) console.log('Le registre dit le dépôt : chaque fichier déclaré, chaque champ relu égal, chaque actif appelé et debout.');
  process.exit(erreurs.length ? 1 : 0);
}
