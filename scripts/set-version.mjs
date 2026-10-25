// set-version.mjs – setzt versionCode (Zahl, muss bei jedem Upload steigen) und
// versionName (fuer Menschen, z. B. "0.2.0") in android/app/build.gradle.
// Aufruf: node scripts/set-version.mjs <versionCode> <versionName>
import fs from 'node:fs';
const [code, name] = process.argv.slice(2);
if (!/^\d+$/.test(code || '') || !/^[0-9A-Za-z.\-]+$/.test(name || '')) throw new Error('Aufruf: set-version.mjs <versionCode> <versionName>');
const f = 'android/app/build.gradle';
let g = fs.readFileSync(f, 'utf8');
const before = g;
g = g.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${name}"`);
if (g === before && !(g.includes(`versionCode ${code}`))) throw new Error('versionCode/versionName nicht gefunden');
fs.writeFileSync(f, g);
console.log(`Version gesetzt: ${name} (${code})`);
