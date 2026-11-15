# OwlFly Flight Report — private Supabase foundation

**Status:** Proposed migration only. This file does not mean the tables or bucket are live.

Migration: `supabase/migrations/20261115_owlfly_flight_reports.sql`

## What will exist after an approved migration

- `public.owlfly_feedback_reports`: 1-tap feedback category (praise / problem / suggestion), optional rating and short note, app version, platform, optional run score/duration, optional screenshot metadata, and current review state.
- `public.owlfly_feedback_review_events`: audit trail for triage, fix-commit association, independent verification, and closure.
- Private Storage bucket `owlfly-flight-report-screenshots`: PNG, JPEG, and WebP only, with a 2 MiB object limit.

The schema intentionally collects **no email address, raw device identifier, IP address, geolocation, or Google Play account identity**. Data supplied in optional notes or screenshots still requires careful handling.

## Critical security properties

1. Row-level security (RLS) enabled on both tables. No `anon` or `authenticated` table access grants or client policies. No public reads.
2. The Storage bucket is private. Do not add public storage policies. Never create public URLs for report screenshots.
3. All report writes and screenshot uploads must go through a **trusted backend** (Supabase Edge Function or secured serverless function), which performs input validation, request size limits, origin/app checks, and abuse/rate limiting.
4. Keep Supabase service-role credentials **only on the server**, never in `web/`, Capacitor assets, mobile source, GitHub commits, or client environment variables.
5. Do not trust an app-provided `build_commit`, score, version, or rating as independent proof. They are user-provided metadata until independently verified.
6. If an existing bucket with this name is already public, migration aborts. Independently inspect any existing Storage access policies before collecting screenshots.
7. Before production, decide retention/deletion policy and update OwlFly's privacy policy and Google Play Data safety form to reflect the actual reporting behavior.

## Intended experience

At game over: `Report flight` → select 👍 / ⚠ / 💡 → optional short comment and **opt-in** game-canvas screenshot preview → `Send report` → success/error confirmation.

- Screenshot capture is **not automatic submission**. Preview first; provide `Remove screenshot`.
- Keep a one-tap report possible without screenshot and without note.
- Capture only the OwlFly game canvas, not the full phone screen or other applications.
- Show a visible submission error and allow retry; do not pretend a failed upload succeeded.
- Do not interrupt normal gameplay or play input with feedback controls.
- The client must submit to an authenticated/rate-limited backend endpoint, not directly to Supabase tables or Storage.
- Version and release channel should be stamped server-side when feasible.

## Proposed backend request contract (not implemented)

`POST /api/flight-report` via HTTPS. Body: `kind` and optional `rating`, `area`, `notes`, `app_version`, `android_version_code`, `platform`, `run_score`, `run_duration_ms`, `screenshot` (image up to 2 MiB), `screenshot_consent`.

The backend must validate every field, check consent, sanitize and decode the image, enforce abuse limits and allowed types, store screenshot in the private bucket under a generated opaque `reports/<uuid>.<ext>` path, and insert a matching report row. Avoid orphan files: clean up uploaded objects if the corresponding row insert fails. Never return a public screenshot URL.

For a public unregistered tester endpoint, a Supabase publishable key alone is **not** abuse protection. Use server-side IP rate limiting and optional anti-bot challenge. Make it accessible to testers without requiring a new account.

## Release evidence

- This is data infrastructure, **not** a deployed feature. No in-game feedback UI or backend endpoint is implemented by this migration alone.
- Keep Alpha release draft unchanged while API-36 release candidate, certificate key-security review, and tester setup are unresolved.
- Collect only voluntary feedback; it does not substitute for Google Play's opt-in tester requirement.

## Verification after applying to a selected Supabase project

1. Query `pg_tables` for both tables; verify `relrowsecurity = true` on both via `pg_class`.
2. Verify `has_table_privilege('anon', 'public.owlfly_feedback_reports', 'SELECT') = false` and corresponding `authenticated` privilege checks for both tables.
3. Verify bucket `owlfly-flight-report-screenshots` exists with `public = false`, MIME whitelist, and 2 MiB maximum.
4. Verify unauthenticated reads and uploads are rejected.
5. Independently test a server-side insert and screenshot upload in a **development project** with synthetic data; verify cleanup; remove test records.
6. Only after these gates pass should a preview feature be connected and user-facing collection enabled.

No migration should be applied to an unidentified project. Preserve migration review, commit evidence, and owner approval before rollout.
