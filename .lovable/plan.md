# Live documentary motion upgrade

## Goal
Make the existing globe, timeline, trend panels, and quiz results feel continuously alive without changing any data or calculations.

## Build
- Add a reusable `AnimatedNumber` that eases between numeric values with `requestAnimationFrame`, preserves decimals/signs/prefixes/suffixes, keeps digits stable with tabular spacing, and becomes immediate under reduced-motion preferences.
- Apply it to the globe reading, year display, region value/rate/p-value/sample size and related statistics, Detective Mode progress/results, and comparable visible case statistics.
- Extend the current smoothed-value hook to honor reduced motion, then use it for marker size/opacity, ice extent, CO₂ intensity, and sea-level ring extent.
- Keep all four layer scenes mounted briefly during changes and cross-fade their opacity over about 400ms instead of swapping abruptly.
- Add inexpensive ambient movement: a selected-region breathing pulse, slow CO₂ field drift, continuously expanding sea-level rings, and existing idle auto-rotation.
- Show a compact pulsing `LIVE` playback label over the globe while the timeline runs, with the active year range, then remove it on pause or completion.

## Compatibility and verification
- Preserve the existing four layers, 1980–2026 timeline, quiz, cases, and report.
- Respect `prefers-reduced-motion` for counters, pulses, drift, rings, and cross-fades.
- Check desktop and mobile globe playback, layer switching, region selection, and Detective Mode results; confirm the preview builds without errors.

## Existing-scope note
The current project does not contain a Badges/Certificate screen, Bangla toggle, or audio narration implementation—only TODO comments for Bangla and narration. This upgrade will not invent those unrelated features, but its reusable counter will be ready for a future badges screen.
