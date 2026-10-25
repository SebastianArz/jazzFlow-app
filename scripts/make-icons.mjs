// ============================================================================
//  make-icons.mjs – erzeugt App-Icon + Startbild (+ Benachrichtigungs-Symbol) fuer Android.
//  Quelle (in dieser Reihenfolge):
//    1) assets/source/icon.png und assets/source/icon-maskable.png im Repo (falls vorhanden,
//       z. B. spaeter ein hochaufloesendes Logo – mind. 1024x1024 empfohlen)
//    2) sonst die Icons aus dem Web-Manifest von jazz-flow.base44.app (512x512)
//  Ergebnis: assets/*.png -> "capacitor-assets generate --android" schreibt alle
//  Groessen in android/app/src/main/res. Wirft bei Fehlern (Build bricht sichtbar ab).
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const BG = '#031e4d'; // JazzFlow-Dunkelblau (wie im Web-Manifest)
const BASE = 'https://media.base44.com/images/public/6a4c0e7da4c566f677035834';
const REMOTE = {
  icon: process.env.ICON_URL || `${BASE}/ac018f393_icon-512.png`,
  maskable: process.env.MASKABLE_URL || `${BASE}/98e3e1a9e_icon-maskable-512.png`,
};

async function load(name) {
  const local = path.join('assets', 'source', `${name === 'icon' ? 'icon' : 'icon-maskable'}.png`);
  if (fs.existsSync(local)) { console.log('Quelle (Repo):', local); return fs.readFileSync(local); }
  const url = REMOTE[name];
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Icon nicht ladbar (${res.status}): ${url}`);
  console.log('Quelle (Web):', url);
  return Buffer.from(await res.arrayBuffer());
}

const icon = await load('icon');
const maskable = await load('maskable');
fs.mkdirSync('assets', { recursive: true });

const up = (buf, size) => sharp(buf).resize(size, size, { fit: 'contain', background: BG }).png();

// Klassisches Icon (ohne Rand) und adaptives Icon (Vordergrund = maskierbare Variante)
await up(icon, 1024).toFile('assets/icon-only.png');
await up(maskable, 1024).toFile('assets/icon-foreground.png');
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BG } }).png().toFile('assets/icon-background.png');

// Startbild: Logo mittig auf Dunkelblau (hell + dunkel identisch)
const logo = await sharp(icon).resize(640, 640, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
for (const f of ['splash.png', 'splash-dark.png']) {
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'center' }]).png().toFile(path.join('assets', f));
}

execFileSync('npx', ['capacitor-assets', 'generate', '--android',
  '--iconBackgroundColor', BG, '--iconBackgroundColorDark', BG,
  '--splashBackgroundColor', BG, '--splashBackgroundColorDark', BG], { stdio: 'inherit' });

const res = 'android/app/src/main/res';

// Kleines Benachrichtigungs-Symbol (Android verlangt weiss auf transparent).
// Eine Achtelnote – wird im Code als smallIcon "ic_stat_jazzflow" genutzt.
const NOTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="#fff" d="M10 3h2.2v12.4A3.6 3.6 0 1 1 10 12.1V3z"/>
  <path fill="#fff" d="M12.2 3c.4 2.2 1.9 3.4 3.6 4.5 1.9 1.2 3 3 2.2 5.9-.2-1.9-1.4-3.1-3.2-3.7-1-.3-1.9-.6-2.6-1.1V3z"/>
</svg>`;
for (const [dir, px] of [['mdpi', 24], ['hdpi', 36], ['xhdpi', 48], ['xxhdpi', 72], ['xxxhdpi', 96]]) {
  const out = path.join(res, `drawable-${dir}`);
  fs.mkdirSync(out, { recursive: true });
  await sharp(Buffer.from(NOTE_SVG), { density: 72 * px / 24 * 4 }).resize(px, px).png().toFile(path.join(out, 'ic_stat_jazzflow.png'));
}
for (const must of ['mipmap-xxxhdpi/ic_launcher.png', 'mipmap-xxxhdpi/ic_launcher_foreground.png', 'drawable/splash.png', 'drawable-xxxhdpi/ic_stat_jazzflow.png']) {
  if (!fs.existsSync(path.join(res, must))) throw new Error('Icon fehlt: ' + must);
}
console.log('App-Icon, Startbild und Benachrichtigungs-Symbol erzeugt.');
