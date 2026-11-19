# OwlFly — iOS / App Store Launch Readiness

Status: PREPARATION ONLY. This checklist does **not** claim that a signed iOS app, TestFlight build, Apple account, or App Store listing exists.

## Platform baseline (audited on 2026-11-19)

- Main baseline: `6da055c8b817c95dd0ed6a9e18b5560162eda423`.
- Shared game: `src/` + `web/`; build with `npm run build`; run tests with `npm test`.
- Capacitor app identifier is currently `com.owlfly.game`. Reconfirm this is free in Apple's ecosystem before creating the App ID; do not change Android's ID.
- Existing `package.json` declares `@capacitor/core ^8.2.0`, `@capacitor/android ^8.2.0`, and CLI `^7.6.0` (major version mismatch). For now, the iOS preflight installs matching CLI and iOS packages ephemerally, **without modifying Android's lockfile**. Long-term dependencies must be deliberately aligned and validated in a separate PR.
- No committed `ios/` native project as of baseline.
- Android closed-testing release is **out of scope** for this branch; do not edit Android gradle files, signing, workflow, version codes, or production assets.

## A. Apple enrollment — account holder action (BLOCKED until owner completion)

- [ ] Decide seller identity: individual (public legal personal name) vs. verified legal organization (public legal company name).
- [ ] Create or select a permanent Apple Account with two-factor authentication and accurate legal identity.
- [ ] Enroll in the **Apple Developer Program**, not the Enterprise Program. US annual fee: $99 subject to current Apple terms.
- [ ] If organization: verify that the legal entity, organization website, work-domain email, signatory authority, and D-U-N-S record meet Apple's requirements.
- [ ] Complete Apple's identity verification, license agreements, and annual payment using Apple's own website/app.
- [ ] Once activated, sign in to App Store Connect, accept latest Business agreements, and record the **Team ID** securely.
- [ ] Do not put Apple ID passwords, session cookies, 2FA recovery codes, private keys, signing certificates, provisioning profiles, or App Store Connect API keys into repository files or public workflow logs.

Official references:
- https://developer.apple.com/programs/enroll/
- https://developer.apple.com/help/account/membership/program-enrollment/
- https://developer.apple.com/help/account/membership/D-U-N-S/
- https://appstoreconnect.apple.com/

## B. iOS technical foundation — separate from Android release

- [ ] Run `ios-preflight.yml` on GitHub macOS runner. It must verify tests, generate temporary iOS project, and attempt **unsigned simulator build**; this is NOT a distributable iOS archive.
- [ ] Review any preflight failure, lock down tool versions, and add `@capacitor/ios` using a consistent Capacitor major version in a follow-up PR.
- [ ] Generate and **commit** the native `ios/` project only after reproducibility is proven. Use a dedicated Mac runner/Xcode version consistent with Apple's SDK requirements.
- [ ] Explicitly configure bundle ID, display name, version/build numbers, device orientations, iOS deployment target and iPad support decision.
- [ ] Configure Apple developer team signing using protected GitHub secrets or Xcode-managed signing. Never expose secrets to fork pull requests.
- [ ] Build signed iOS archive (`.ipa`) only from approved branch/tag with credentials restricted to trusted workflows.
- [ ] Upload verified signed build to App Store Connect/TestFlight. Build/sign/upload success must be observed, not inferred from unsigned simulator success.

## C. iOS device behavior checks

- [ ] Safe countdown on every start/restart; no collision/death before player control; distinctive countdown sound.
- [ ] Tap to flap and hold to repeat flap; no duplicate touch events or locked pointer state after interruptions.
- [ ] Owl animation/sprite motion independent of reduced-motion preference, subject to expected design.
- [ ] Audio unlocks following user interaction and recovers after silent mode, phone calls, app switching, screen lock, and headphones.
- [ ] Safe area: no controls hidden under notch, Dynamic Island, bottom home indicator, status bar; usable in intended orientations.
- [ ] Game runs from **bundled offline assets**; no reliance on remotely hosted HTML for core gameplay; avoid stale service-worker caching.
- [ ] Resume/background transitions and localStorage progress persistence.
- [ ] Performance on physical iPhone (and iPad if supported); do not mark passed based on simulator only.
- [ ] Accessibility, privacy disclosures, and touch-target readability.

## D. App Store Connect content

- [ ] Confirm app name **OwlFly**, bundle identifier (proposed `com.owlfly.game`, availability not yet confirmed), SKU e.g. `OWLFLY-IOS-001`, category Games.
- [ ] Set price/free availability. Do not assume paid-app agreements are needed if the app remains free without IAP; review Business section.
- [ ] Refresh title, subtitle, keywords, description, support URL and privacy-policy URL. **Do not reuse stale `docs/STORE_LISTING.md` language about cactus gates** without revision.
- [ ] Prepare square, opaque 1024x1024 iOS app icon, compliant launch appearance, and screenshots from actual iOS gameplay.
- [ ] Answer current age rating, app privacy and encryption/export compliance questions truthfully; verify existing analytics and webview/network behavior before asserting no data collection.
- [ ] Verify App Review guideline 4.2 (minimum functionality), content ownership/licensing, and stable native game experience.
- [ ] Populate reviewer contact information and explanatory notes, provide no account login if OwlFly has no sign-in.

## E. TestFlight → public release

- [ ] Create App Store Connect app record and App ID when membership is active.
- [ ] Upload first signed build and check processing outcome.
- [ ] Invite internal TestFlight testers. For outside testers, submit build to TestFlight App Review; review may be required.
- [ ] Fix device feedback, increment iOS build number, upload updated build.
- [ ] Complete required listing, ratings, territories, content rights, screenshots, policy and release declarations.
- [ ] Submit for App Review; publication is not guaranteed and has no fixed timeline.
- [ ] Record evidence for each gate (workflow run, tested device, build identifier, review status, store link).

## Guardrails

- Do not merge this preparation branch automatically; preserve Android closed testing.
- Do not infer that creating an Apple Account or iOS repository directory activates Apple membership.
- Prefer GitHub standard macOS hosted runner for prototype builds of this public repository; verify billing/availability before repeated automated builds.
- Goal is near-concurrent **platform launches**, not forced release on a date that bypasses QA or review.
