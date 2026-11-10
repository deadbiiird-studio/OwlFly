# OwlFly

OwlFly is a mobile-first, Canvas-based flying game. The repository contains the
JavaScript gameplay source, generated static website, Android Capacitor project,
and deterministic evaluation tools.

## Run and verify

Requires Node.js and npm.

```bash
npm ci
npm run dev
```

For a production build and local checks:

```bash
npm run quality
```

`npm run build` creates `web/game.js` and refreshes `web/index.html` from
`web/index.prod.html`. Commit the generated files when source changes are
intended for the static deployment. The GitHub Pages workflow deploys `web/`.

## Domain and Android links

The intended website host is `owlfly.app`. GitHub Pages uses `web/CNAME`, which
lives in the deployed artifact. The Android intent filter also targets
`https://owlfly.app`, and `web/.well-known/assetlinks.json` provides an Android
package/certificate association **candidate**. Check the fingerprint against
Google Play's **App signing certificate**, not the upload key, and verify that
`https://owlfly.app/.well-known/assetlinks.json` is actually reachable with a
valid HTTPS response after deployment. Repository tests do **not** prove DNS,
Google indexing, or Android App Links verification.

## Android release signing

**Do not put signing passwords, keystores, or access tokens into the repository.**
The Android release build reads four variables from the build environment:

- `OWLFLY_RELEASE_STORE_FILE` — absolute location of the private upload keystore
- `OWLFLY_RELEASE_STORE_PASSWORD` — keystore password
- `OWLFLY_RELEASE_KEY_ALIAS` — key alias
- `OWLFLY_RELEASE_KEY_PASSWORD` — key password

Debug builds do not require these variables. Release `assembleRelease` and
`bundleRelease` tasks fail if signing settings or the keystore are missing.
For example, on the Chromebook, set the variables in the **current terminal**
without storing values in tracked files, then run:

```bash
cd android
./gradlew :app:bundleRelease
```

The previous repository version contained a signing password in plaintext.
Treat that password as exposed. **Do not replace an existing upload key until
its role is confirmed in Play Console**; Google Play app-signing identity and
upload-key identity are different. If the password was genuine, arrange a
controlled credential rotation and verify the resulting AAB before uploading.
Do not commit a keystore or paste passwords into a public issue.

## Gameplay baseline

The current game still contains legacy Fracture/glide/reentry mechanics. They
remain unchanged in this release-configuration patch. Replacing them with a
bounded hold-to-dart mechanic requires separate manual flight, collision and
regression verification before promotion.

## Workshop test note

`test_owlfly_workshop.py` belongs to an external Python `lumiel.owlfly`
workshop package and is **not** part of this JavaScript application's test
suite. That package is absent from this source archive, so those four tests
cannot be treated as passed or wired into the production build.
