# OwlFly website hosting and release handoff

Status reviewed: 2026-11-21 UTC. This is an evidence record, not a claim that every phone or browser has been visually tested.

## One canonical deployment

- Source of truth: `deadbiiird-studio/OwlFly`, `main`.
- Website build: `.github/workflows/deploy-pages.yml` runs tests, builds `web/game.js` from `src/`, copies `web/home.html` to website `index.html` and the game entrypoint to `play.html`, and deploys `web/` to GitHub Pages.
- Public domain: `https://owlfly.app/` is the illustrated homepage; `https://owlfly.app/play.html` is the browser game; `https://owlfly.app/privacy.html` is the privacy policy.
- Registrar and DNS: Cloudflare, nameservers `todd.ns.cloudflare.com`, `tegan.ns.cloudflare.com`.
- Apex DNS A values observed: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (GitHub Pages). Do not repoint these to Vercel.
- The old Vercel project `owlfly` remains associated with the domain in the Vercel dashboard but was last deployed in March 2026. The public apex HTTP response currently identifies `server: GitHub.com`. Vercel is NOT the serving host for the verified apex response.
- Android releases and Google Play review are independent of the website. A web deploy does not publish an Android version and should never change Play Console tracks.

## Verified delivery evidence

- Android signed Alpha v4: GitHub Actions run [44863584533](https://github.com/deadbiiird-studio/OwlFly/actions/runs/44863584533), source commit `4321e5525d6d4186912ec58b2ce541c74ae1e9ef`, version code 4 / version name 1.0.3.
- Signed AAB SHA-256, independently inspected: `5f5cb68e8523a379e8b201e0c490847b43ef5a8ce50d39be6d11b46b3623f684`.
- GitHub Pages deployment: run [44872484089](https://github.com/deadbiiird-studio/OwlFly/actions/runs/44872484089), commit `960009ff54d90aa3c293f157afa8bbaa01a49626`.
- Live public HTTP audit: run [44873167028](https://github.com/deadbiiird-studio/OwlFly/actions/runs/44873167028), HTTP 200 for homepage, game player, game JS, privacy policy. The live domain's response header says `server: GitHub.com`.
- SHA-256 of live `https://owlfly.app/game.js`: `4544713f9b393641c133b67c2e1ac2cda8b734020d4182cd6ed752395b499599`. This exactly matches both the deployed GitHub Pages artifact's game.js and `base/assets/public/game.js` in the signed Android v4 artifact.
- The delivered game JS includes a three-second countdown and audio, hold-to-flap, three-frame owl rendering, and a seven-height rooftop sequence that begins around obstacle 16.
- Automated tests and HTTP/byte checks do not replace real phone playtesting or confirm the exact uploaded Play Console file.

## Outstanding corrections: do not guess

1. `https://www.owlfly.app/` currently fails HTTPS hostname validation, although its IPv4 DNS resolves to GitHub Pages addresses. Cloudflare needs a `www` CNAME to `deadbiiird-studio.github.io` (DNS only), replacing conflicting `www` A/AAAA/CNAME records if present. Preserve apex A records and all unrelated DNS entries. GitHub Pages must finish issuing an HTTPS certificate; recheck `https://www.owlfly.app/` and its redirect to the apex.
2. Verify in a private browsing session using the **exact** address `https://owlfly.app/`, then select Play, start and restart a round. Report actual gameplay behavior and phone model. A stale tab or an old `*.vercel.app` bookmark is not proof the public domain is serving old files.
3. Once both apex and www work from outside the build environment, disconnect/delete only the obsolete `owlfly` Vercel project through its project dashboard, not the account or the Got2Luvit project. Do not disrupt the active Google Play closed-testing track.

## Release boundaries

- Test source, then publish and smoke-test the exact public delivery.
- Only ship another Android version to address confirmed blocking issues.
- A build passing does not imply the user's device received it.
- Keep the landing page and browser game as distinct routes; do not replace homepage with raw game UI.
- Use `public-site-audit.yml` to verify live public responses; edit it when shipping contract changes intentionally.
