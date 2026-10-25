// ============================================================================
//  make-icons.mjs – erzeugt App-Icon + Startbild fuer Android aus dem JazzFlow-Logo.
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
for (const must of ['mipmap-xxxhdpi/ic_launcher.png', 'mipmap-xxxhdpi/ic_launcher_foreground.png', 'drawable/splash.png']) {
  if (!fs.existsSync(path.join(res, must))) throw new Error('Icon fehlt: ' + must);
}
console.log('App-Icon und Startbild erzeugt.');
