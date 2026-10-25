# JazzFlow – App-Huelle

Native Huelle (Capacitor 8) fuer die Web-App https://jazz-flow.base44.app.
Der App-Inhalt kommt live von Base44 – dieses Repo enthaelt nur die Huelle.

- `capacitor.config.json` – App-ID, Name, Start-Adresse
- `scripts/patch-android.mjs` – Mikrofon, AdMob-ID, Login-Ruecksprung (jazzflow://auth)
- `.github/workflows/android-test.yml` – baut die Test-APK (Actions -> Artifacts)

Der Ordner `android/` wird bei jedem Build neu erzeugt und ist nicht im Repo.

## Store-Version (Google Play)
- Workflow **„Android Store-Version"** von Hand starten (Actions → Run workflow), Versionsname eingeben.
- Ergebnis: `app-release.aab` (fuer Google Play) + `app-release.apk` (zum direkten Installieren).
- Signatur aus den Repository-Secrets `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.
  Den Upload-Schluessel (`jazzflow-upload.jks`) + Passwort **sicher aufbewahren**, nie ins Repo legen.
- Icons: `scripts/make-icons.mjs` (Quelle: Web-Manifest-Icons oder `assets/source/icon.png`).
