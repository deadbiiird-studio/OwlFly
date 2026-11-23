# OwlFly cinematic source recovered from Android

This directory preserves the **original text source and generated evidence metadata** of the 2026-11-21 promotional cinematic. It is a **review-only snapshot**, not gameplay code and not a release candidate.

- `build_owlfly_animation.py`: original animation-building script; expects `/mnt/data/OwlFly-main.zip`, writes to `/mnt/data/owlfly_cinematic/`, requires Python with Pillow/NumPy and ffmpeg or imageio-ffmpeg. Paths are intentionally unchanged to preserve source provenance.
- `README.md`: original production notes. It explicitly states the cinematic is **not actual gameplay capture**.
- `manifest.json` and `quality_report.json`: archived output metadata from the source run, not evidence that this script passed fresh tests on GitHub or on the Android phone.

Original script SHA-256: `2cda2a1c3948d169677cbd298832285c944551f8403c4e691719fa611083c6a5`.

**Excluded from Git:** the 14-second MP4, WAV, storyboard frames, source PNG, and compressed media archive, which remain on the phone to avoid bloating the game repository. Before promoting, run generation on a scratch machine, check asset provenance/licensing, inspect produced media, and verify none of the current gameplay or Play Console assets change. This PR does not change `web/`, `src/`, `android/`, `ios/`, Google Play bundles, website deployment, or the SkyWeave prototype branch.
