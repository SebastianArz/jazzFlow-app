# JazzFlow – App-Huelle

Native Huelle (Capacitor 8) fuer die Web-App https://jazz-flow.base44.app.
Der App-Inhalt kommt live von Base44 – dieses Repo enthaelt nur die Huelle.

- `capacitor.config.json` – App-ID, Name, Start-Adresse
- `scripts/patch-android.mjs` – Mikrofon, AdMob-ID, Login-Ruecksprung (jazzflow://auth)
- `.github/workflows/android-test.yml` – baut die Test-APK (Actions -> Artifacts)

Der Ordner `android/` wird bei jedem Build neu erzeugt und ist nicht im Repo.
