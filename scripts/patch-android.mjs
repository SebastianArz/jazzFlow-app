// ============================================================================
//  patch-android.mjs – passt das von Capacitor erzeugte Android-Projekt an.
//  Laeuft im GitHub-Build nach "npx cap add android" + "npx cap sync android".
//  Wirft bei Fehlern -> der Build bricht sichtbar ab statt still kaputt zu sein.
//
//  1. Mikrofon-Berechtigungen (Stimmgeraet, Tonerkennung, Rhythmus)
//  2. AdMob-App-ID (ohne eigene ID: Googles Test-App-ID)
//  3. Ruecksprung nach Google-Login: jazzflow://auth  -> oeffnet die App
//  4. Erinnerungen: KEIN "exakter Wecker" (SCHEDULE_EXACT_ALARM entfernen,
//     Play-Richtlinie). Lokale Hinweise kommen dann auf ein paar Minuten genau.
// ============================================================================
import fs from 'node:fs';

const MANIFEST = 'android/app/src/main/AndroidManifest.xml';
// Googles offizielle Test-App-ID (zeigt nur Testanzeigen). Echte ID spaeter per GitHub-Secret.
const ADMOB_APP_ID = process.env.ADMOB_APP_ID_ANDROID || 'ca-app-pub-3940256099942544~3347511713';

let xml = fs.readFileSync(MANIFEST, 'utf8');
const before = xml;

function insertOnce(key, marker, snippet, where) {
  if (xml.includes(key)) return; // schon drin
  const i = xml.indexOf(marker);
  if (i < 0) throw new Error('Marker nicht gefunden: ' + marker);
  xml = where === 'before' ? xml.slice(0, i) + snippet + xml.slice(i) : xml.slice(0, i + marker.length) + snippet + xml.slice(i + marker.length);
}

// 1. Berechtigungen
insertOnce('android.permission.RECORD_AUDIO', '<uses-permission android:name="android.permission.INTERNET" />', `
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />`, 'after');

// 2. AdMob-App-ID
insertOnce('com.google.android.gms.ads.APPLICATION_ID', '</application>', `
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="${ADMOB_APP_ID}" />
    `, 'before');

// 3. Deep-Link fuer den Login-Ruecksprung
insertOnce('android:scheme="jazzflow"', '        </activity>', `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="jazzflow" android:host="auth" />
            </intent-filter>
`, 'before');

// 4. Exakte Wecker-Berechtigung des Benachrichtigungs-Plugins entfernen
if (!xml.includes('xmlns:tools=')) {
  xml = xml.replace('<manifest xmlns:android="http://schemas.android.com/apk/res/android"',
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools"');
}
insertOnce('android.permission.SCHEDULE_EXACT_ALARM', '<uses-permission android:name="android.permission.INTERNET" />', `
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove" />`, 'after');

if (xml === before) console.log('AndroidManifest: bereits angepasst');
fs.writeFileSync(MANIFEST, xml);

for (const must of ['RECORD_AUDIO', 'com.google.android.gms.ads.APPLICATION_ID', 'android:scheme="jazzflow"', 'xmlns:tools=', 'SCHEDULE_EXACT_ALARM" tools:node="remove"']) {
  if (!xml.includes(must)) throw new Error('Patch fehlgeschlagen: ' + must);
}
console.log('AndroidManifest angepasst (Mikrofon, AdMob ' + (process.env.ADMOB_APP_ID_ANDROID ? 'eigene ID' : 'Test-ID') + ', jazzflow://auth, ohne exakte Wecker)');
