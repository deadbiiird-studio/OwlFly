# Polish P3 — Audio Identity Review

## Status
**96/100 — IMPLEMENTED CANDIDATE. TARGET-MACHINE + HUMAN GATES PENDING.**

Base checkpoint: B1 merged `main` @ `50a88d5c28bc007a37cb11f47e25eddd7146f737`.

## Goal
Make existing flap/score/hit cues cleaner, more consistent, and less fatiguing without adding asset weight or changing game timing.

## Implementation
`src/core/audio.js` keeps the existing mobile-safe WebAudio + HTMLAudio fallback and adds:
- frozen per-cue cooldown/voice policies;
- deterministic micro pitch variation instead of runtime `Math.random()`;
- impact pitch stability;
- voice accounting so cues cannot stack without bound;
- a 4ms WebAudio attack ramp to reduce clicks;
- boolean play result for clean internal control flow;
- explicit normalization of the legacy app premix so `master × sfx` is applied exactly once rather than squared;
- backend-aligned gain semantics: WebAudio uses the shared gain graph once, while HTMLAudio applies the same global mix once in fallback volume.

No new audio asset is required; existing `flap.wav`, `score.wav`, and `hit.wav` remain authoritative.

## Hard preservation rules
- first-gesture mobile priming stays intact;
- HTMLAudio fallback stays intact;
- persisted mute/mix controls stay intact;
- music attachment/master path stays intact;
- no game-loop timing, scoring, physics, collision, or state-machine changes;
- variation stays subtle enough that a cue retains one recognizable identity;
- global mix sliders must never be multiplied twice at the app/audio boundary.

## Regression coverage
`polish.audio_identity_contract.test.mjs` checks cooldown/voice limits, deterministic bounded pitch variation, stable hit pitch, absence of runtime `Math.random()` cue identity, continued attack/fallback machinery, and exact recovery of event-level gain from the existing app premix.

## Human gate
Approve only if flap sounds less repetitive without sounding random, score never machine-guns, hit remains immediate/authoritative, and master/SFX sliders feel linear and predictable. Reject if any cue is delayed, missing under normal play, noticeably pitch-wobbly, or unexpectedly quiet/loud as sliders move.

## Verification
Run `npm run quality`, then play with sound on/off, rapid flaps, rapid score/reward events, several impacts, and multiple master/SFX slider positions in `npm run dev`.

## Rollback
Discard `polish-p3-audio-identity`; baseline remains `main` @ `50a88d5`.
