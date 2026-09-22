# Earth Trend Watch

Build "Living Earth: Trend Detective" — an interactive 3D web app for the NASA Space Apps 2026 challenge "Be An Earth System Trend Detective!" Built with React + TypeScript + Three.js (React Three Fiber) + Tailwind, with the backend role (pre-fetched NASA time series + Mann-Kendall trend statistics) handled by Lovable Cloud / edge functions serving cached pre-computed JSON instead of a FastAPI Python backend.

## Core Concept
A realistic 3D Earth globe with toggleable environmental data layers, letting users investigate how NASA-measured variables change over time, region by region — and uncover cases where the same global process causes opposite trends in different regions.

## Reused Assets
The user is migrating the Earth globe 3D model, scroll-triggered cinematic camera logic, and data-dashboard visualization patterns from their own previous project (a local repo, folders story/ and dashboard/). Import and adapt these if provided — strip out all asteroid-impact-specific content, text, and models, keeping only the generic Earth globe, camera-transition system, and chart/widget patterns. If not provided, build equivalent purpose-built Three.js globe, cinematic camera-transition system, and chart/widget patterns.

## Design System
- Colors: deep space base #0B0E1A, muted slate #6B7280 (low/insignificant trend), warm amber #F2A93B (significant/rising trend), soft off-white #E8E6E1 (text), violet #7C6FF0 (primary actions/highlights), muted rust #C4544A (declining/negative trend)
- Typography: "Fraunces" (serif, headlines) + "Inter" (sans, body/UI)
- Motion: only for meaningful moments — camera zoom on region click, subtle pulse on statistically significant trend indicators, scroll-triggered transitions between sections. No generic hover-lift card effects.

## Pages / Flow
1. Landing: title, one-line hook ("Change is everywhere. Is it real, or just noise?"), "Start Investigating" button, animated starfield
2. Globe view (main hub): realistic 3D Earth (react-globe.gl or custom Three.js sphere with real texture), with a layer toggle panel for 3 data layers:
   - Global Temperature Anomaly (source: NASA GISTEMP)
   - Arctic/Antarctic Sea Ice Extent (source: NASA/NSIDC)
   - Atmospheric CO2 Concentration (source: NASA/NOAA)
   Each layer rendered as a color-coded overlay on the globe (intensity = magnitude of change)
3. Time slider: drag to scrub through years (e.g. 1980–2026), globe layers update live to reflect that year's data
4. Region click: clicking a region opens a side panel showing:
   - That region's trend for the active layer, as a chart
   - Rate-of-change number (e.g. "+0.8°C per decade")
   - Statistical significance result, clearly shown (e.g. "Mann-Kendall test: p = 0.02 — significant trend"), not just a badge
   - Clear NASA mission/data-source credit
5. "Detective Cases" section: 2 featured, pre-written investigations highlighting a paradox — the same underlying process producing opposite regional trends (e.g. Arctic sea ice declining vs. some Antarctic sea ice periods increasing, both driven by global warming via different regional mechanisms). Each case: short narrative + side-by-side comparison chart + explanation of the mechanism.
6. "Detective Mode" (optional interactive layer): user picks a hypothesis about a region from a few options, then the app reveals the real data and whether their hypothesis matches statistical reality.

## Backend
Serve pre-fetched, pre-cleaned NASA dataset time series (GISTEMP, NSIDC sea ice, NOAA CO2) as JSON, cached — don't hit live APIs on every frontend request. Trend-calculation using a Mann-Kendall test to compute rate-of-change and significance per region, pre-computed and cached rather than calculated client-side. On Lovable's stack this means: bundled/cached JSON datasets served via edge functions or static data, with Mann-Kendall results pre-computed (evaluate the Mann-Kendall test and Sen's slope in TypeScript or pre-compute the values and embed them as cached JSON).

## Technical constraints
- Keep the 3D globe performant: use a real Earth texture for visual realism rather than high-poly geometry; downsample/aggregate data before sending to frontend
- Mobile-responsive; gracefully degrade 3D complexity on smaller screens
- Every data layer must visibly cite its NASA source on screen, not just in a README

## Explicitly mark as TODO in code comments for later:
- Add a 4th/5th data layer (sea level rise, vegetation/NDVI) as stretch goals
- Add Bangla translation
- Add audio narration for Detective Cases

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://geo-trend-explorer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/96962bcb-8e94-42cd-9f2e-99c590c6630c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
