// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// lib_archive.mjs — lire ce qui a été ARCHIVÉ (prompt 200, étape B).
//
// assets/motifs-pinterest et assets/motifs-svg ont quitté la branche main (poids du site publié :
// un déploiement de Pages approchait la limite de 1 Go) ; ils sont conservés, intacts, sur la branche
// `archive-medias`. Les contrôles qui lisaient ces dossiers les RESTAURENT depuis l'archive dans le
// dossier habituel (ignoré par git : .gitignore) et le DISENT — « ARCHIVÉ : … » — au lieu de passer en
// silence. Rien de ce qui est restauré n'est publié : Pages ne publie que ce que git suit.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (args, opts = {}) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, ...opts });
const refExiste = (r) => { try { git(['rev-parse', '--verify', '--quiet', `${r}^{commit}`]); return true; } catch { return false; } };

// la référence de l'archive : la branche locale, sinon celle du dépôt distant, sinon on la récupère (CI : clone superficiel)
export function refArchive() {
  for (const r of ['archive-medias', 'origin/archive-medias', 'refs/remotes/origin/archive-medias']) if (refExiste(r)) return r;
  try { git(['fetch', '--no-tags', '--depth=1', 'origin', 'archive-medias:refs/remotes/origin/archive-medias'], { stdio: 'pipe' }); } catch { /* hors ligne */ }
  return refExiste('origin/archive-medias') ? 'origin/archive-medias' : null;
}

const vide = (d) => { try { return !readdirSync(path.join(ROOT, d)).length; } catch { return true; } };

// Garantit que `prefixe` (dossier relatif à la racine) est présent : tel quel s'il l'est, sinon restauré depuis
// l'archive. Retourne { archive: bool, ref, fichiers } ; échoue (null) si ni l'un ni l'autre.
export function assurer(prefixe) {
  if (!vide(prefixe)) return { archive: false, ref: null, fichiers: null };
  const ref = refArchive();
  if (!ref) return null;
  const liste = git(['ls-tree', '-r', '--name-only', ref, '--', prefixe]).split('\n').filter(Boolean);
  if (!liste.length) return null;
  const tar = execFileSync('git', ['archive', ref, '--', prefixe], { cwd: ROOT, maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', ROOT], { input: tar });
  console.log(`ARCHIVÉ : ${prefixe} n'est plus sur main ; ${liste.length} fichier(s) restauré(s) depuis ${ref} (dossier ignoré par git, non publié).`);
  return { archive: true, ref, fichiers: liste.length };
}

// {chemin: sha de blob} de l'archive pour un préfixe (intégrité d'une restauration)
export function blobsArchive(prefixe) {
  const ref = refArchive();
  if (!ref) return new Map();
  return new Map(git(['ls-tree', '-r', ref, '--', prefixe]).split('\n').filter(Boolean).map((l) => { const [meta, p] = l.split('\t'); return [p, meta.split(' ')[2]]; }));
}
export const shaBlob = (rel) => git(['hash-object', '--', rel]).trim();
export const dansArbre = (rel) => existsSync(path.join(ROOT, rel));
