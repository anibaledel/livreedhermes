#!/usr/bin/env node
// © Anibal Edelberto Amiot 2026 — La Livrée d'Hermès
// AGPL v3 / licence commerciale sur demande : anibaledel@gmail.com
//
// essai-musique-chladni-enregistrements.mjs — fait dans Chromium (Playwright) les 9 enregistrements de 15 s de « Voir sa musique »
// (3 formats × 3 cadrages) avec un morceau fourni, puis les passe à ffprobe (codecs, durée, taille) et à ffmpeg (décodage sans erreur).
// Il rapporte ; il ne corrige rien. Usage : node scripts/essai-musique-chladni-enregistrements.mjs [--sortie <dossier>]
import { mkdirSync, statSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { servirDepot } from '../tools/lib_fonds_site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--sortie'), SORTIE = i > 0 ? process.argv[i + 1] : path.join(ROOT, 'tmp-enregistrements');
mkdirSync(SORTIE, { recursive: true });
const serveur = await servirDepot(ROOT);
const nav = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await (await nav.newContext({ viewport: { width: 1000, height: 1000 }, acceptDownloads: true })).newPage();
await p.goto(`${serveur.url}/musique-chladni.html`); await p.waitForFunction(() => window.__voirSaMusique, null, { timeout: 30000 });
const capacites = await p.evaluate(async () => ({
  aacEnDirect: MediaRecorder.isTypeSupported('video/mp4;codecs="avc1.640028,mp4a.40.2"'),
  h264EnDirect: MediaRecorder.isTypeSupported('video/mp4;codecs=avc1'),
  audioEncoderAac: typeof AudioEncoder === 'undefined' ? 'absent' : (await AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2 })).supported,
  texteAide: document.getElementById('vmAideAudio')?.textContent,
}));
console.log('capacités :', JSON.stringify(capacites));
await p.selectOption('#vmSource', 'j1'); const l = await p.textContent('#vmLecture'); if (!/Arrêter/.test(l)) await p.click('#vmLecture'); await p.waitForTimeout(2500);
await p.evaluate(() => { const e = document.getElementById('vmFormatVideo'); for (let n = e; n; n = n.parentElement) if (n.tagName === 'DETAILS') n.open = true; });
const lignes = [];
for (const [touche, vue] of [['1', 'signes'], ['2', 'lignes'], ['3', 'pavage']]) {
  await p.keyboard.press(touche); await p.click('#vmValider'); await p.waitForTimeout(700);
  for (const f of ['916', '45', '11']) {
    await p.selectOption('#vmFormatVideo', f);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 40000 }), p.click('#vmEnreg')]);
    const fic = path.join(SORTIE, `${vue}-${f}${path.extname(dl.suggestedFilename())}`); await dl.saveAs(fic);
    const pr = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height:format=duration,format_name', '-of', 'json', fic]).toString());
    const v = pr.streams.find((s) => s.codec_type === 'video') || {}, a = pr.streams.find((s) => s.codec_type === 'audio') || {};
    // MediaRecorder date les images au 1/1000 s : deux images voisines peuvent recevoir le même dts, et le muxeur « null » de ffmpeg le signale.
    // Ce n'est pas une erreur de décodage : on compte ces lignes à part, toute autre ligne ou un code de sortie non nul est une erreur.
    const dec = spawnSync('ffmpeg', ['-v', 'error', '-i', fic, '-f', 'null', '-'], { encoding: 'utf8' });
    const sorties = dec.stderr.split('\n').filter(Boolean), dts = sorties.filter((x) => /non monotonically increasing dts/.test(x)).length, autres = sorties.filter((x) => !/non monotonically increasing dts/.test(x));
    const decodage = dec.status === 0 && !autres.length ? `ok${dts ? ` (${dts} avertissements de dts du muxeur null)` : ''}` : `ERREUR ${autres.join(' ').slice(0, 120) || 'code ' + dec.status}`;
    lignes.push({ fichier: path.basename(fic), nom: dl.suggestedFilename(), vue, format: f, video: v.codec_name, taille: `${v.width}x${v.height}`, audio: a.codec_name || 'AUCUNE PISTE', duree: Number(pr.format.duration).toFixed(2), octets: statSync(fic).size, decodage });
    console.log(JSON.stringify(lignes.at(-1)));
  }
}
console.log('| fichier | vidéo | audio | durée (s) | octets | décodage |\n|---|---|---|---|---|---|\n' + lignes.map((x) => `| ${x.fichier} (${x.taille}) | ${x.video} | ${x.audio} | ${x.duree} | ${x.octets} | ${x.decodage} |`).join('\n'));
await nav.close(); serveur.fermer?.() ?? serveur.close?.(); process.exit(0);
