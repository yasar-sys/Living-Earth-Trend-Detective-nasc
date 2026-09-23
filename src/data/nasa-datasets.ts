/**
 * Pre-fetched, pre-cleaned NASA / NOAA time series (1980-2025), with a labelled
 * illustrative projection for 2026. Do not use projected values for tests.
 *
 * Why the data is bundled instead of fetched live:
 *  - GISTEMP, NSIDC and the Global Monitoring Laboratory publish annual values
 *    that change only once a year. Hitting them per request would be slow,
 *    rate-limited and would break offline/preview use.
 *  - The values below are the published ANNUAL aggregates (already downsampled
 *    from the monthly/daily source products), which keeps the payload tiny.
 *
 * Provenance, per layer:
 *  - Temperature anomaly: NASA GISS Surface Temperature Analysis (GISTEMP v4),
 *    global annual mean anomaly relative to the 1951-1980 baseline.
 *  - Sea ice extent: NASA-supported NSIDC Sea Ice Index (Arctic September
 *    minimum, Antarctic September maximum), millions of km^2.
 *  - CO2: NOAA Global Monitoring Laboratory / NASA Earth Science, Mauna Loa
 *    annual mean dry-air mole fraction, ppm.
 *
 * Regional series are derived from these published global/hemispheric records
 * using documented regional scaling (e.g. Arctic amplification ~3-4x global),
 * plus a deterministic interannual variability term so year-to-year noise is
 * realistic. They are illustrative regional reconstructions for investigating
 * trend statistics, not the gridded source product itself — the app states this
 * on screen wherever regional numbers appear.
 *
 * TODO (stretch): add a 4th layer — sea level rise (NASA/JPL satellite altimetry).
 * TODO (stretch): add a 5th layer — vegetation greenness / NDVI (NASA MODIS).
 */

export const START_YEAR = 1980;
export const LAST_OBSERVED_YEAR = 2025;
export const END_YEAR = 2026;

export const YEARS: number[] = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => START_YEAR + i,
);

/** GISTEMP v4 global annual mean surface temperature anomaly (deg C vs 1951-1980). */
export const GLOBAL_TEMP_ANOMALY: number[] = [
  0.27, 0.33, 0.14, 0.32, 0.13, 0.12, 0.19, 0.33, 0.4, 0.28, 0.45, 0.42, 0.23, 0.24, 0.32,
  0.46, 0.34, 0.48, 0.63, 0.42, 0.43, 0.55, 0.63, 0.63, 0.55, 0.69, 0.65, 0.67, 0.55,
  0.66, 0.73, 0.62, 0.65, 0.68, 0.75, 0.9, 1.02, 0.93, 0.85, 0.99, 1.02, 0.85, 0.9, 1.17,
  1.28, 1.25,
];

/** NOAA GML Mauna Loa annual mean CO2 (ppm). */
export const GLOBAL_CO2: number[] = [
  338.8, 340.1, 341.4, 343.0, 344.6, 346.0, 347.4, 349.2, 351.6, 353.1, 354.4, 355.6,
  356.4, 357.1, 358.8, 360.8, 362.6, 363.7, 366.7, 368.4, 369.6, 371.1, 373.2, 375.6,
  377.5, 379.8, 381.9, 383.8, 385.6, 387.4, 389.9, 391.6, 393.9, 396.5, 398.6, 400.8,
  404.2, 406.5, 408.5, 411.4, 414.2, 416.4, 418.5, 421.1, 424.6, 427.0,
];

/** NSIDC Sea Ice Index: Arctic September minimum extent (million km^2). */
export const ARCTIC_SEA_ICE: number[] = [
  7.67, 7.14, 7.3, 7.39, 6.81, 6.7, 7.41, 7.28, 7.37, 7.0, 6.14, 6.49, 7.44, 6.42, 7.14,
  6.1, 7.58, 6.72, 6.55, 6.23, 6.3, 6.73, 5.94, 6.13, 6.03, 5.56, 5.91, 4.27, 4.72, 5.36,
  4.9, 4.6, 3.57, 5.21, 5.22, 4.62, 4.72, 4.8, 4.79, 4.32, 3.92, 4.72, 4.87, 4.37, 4.28,
  4.6,
];

/** NSIDC Sea Ice Index: Antarctic September maximum extent (million km^2). */
export const ANTARCTIC_SEA_ICE: number[] = [
  18.6, 18.4, 18.7, 18.6, 18.5, 18.8, 18.7, 18.4, 18.6, 18.5, 18.3, 18.6, 18.4, 18.7,
  18.8, 18.6, 18.9, 18.7, 19.0, 18.8, 19.1, 18.9, 18.6, 18.9, 19.1, 19.1, 19.0, 19.3,
  18.9, 19.2, 19.2, 19.1, 19.4, 19.6, 20.1, 18.8, 18.5, 18.0, 18.3, 18.6, 18.9, 18.9,
  18.2, 17.0, 17.2, 17.8,
];

/** 2026 is not yet a complete annual record. Extend the latest decade's slope
 * for an explicitly labelled projection; never treat it as an observation. */
function projectNextYear(values: number[]): number {
  const recent = values.slice(-10);
  const first = recent.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const last = recent.slice(5).reduce((a, b) => a + b, 0) / 5;
  return (values.at(-1) ?? 0) + (last - first) / 5;
}

GLOBAL_TEMP_ANOMALY.push(Number(projectNextYear(GLOBAL_TEMP_ANOMALY).toFixed(2)));
GLOBAL_CO2.push(Number(projectNextYear(GLOBAL_CO2).toFixed(1)));
ARCTIC_SEA_ICE.push(Number(projectNextYear(ARCTIC_SEA_ICE).toFixed(2)));
ANTARCTIC_SEA_ICE.push(Number(projectNextYear(ANTARCTIC_SEA_ICE).toFixed(2)));

export type LayerId = "temperature" | "seaice" | "co2";

export interface LayerMeta {
  id: LayerId;
  label: string;
  shortLabel: string;
  unit: string;
  /** Unit string for rate of change per decade */
  rateUnit: string;
  source: string;
  sourceUrl: string;
  description: string;
  decimals: number;
}

export const LAYERS: Record<LayerId, LayerMeta> = {
  temperature: {
    id: "temperature",
    label: "Surface Temperature Anomaly",
    shortLabel: "Temperature",
    unit: "°C",
    rateUnit: "°C / decade",
    source: "NASA GISS Surface Temperature Analysis (GISTEMP v4)",
    sourceUrl: "https://data.giss.nasa.gov/gistemp/",
    description:
      "Departure from the 1951–1980 average. Positive means warmer than that baseline.",
    decimals: 2,
  },
  seaice: {
    id: "seaice",
    label: "Sea Ice Extent",
    shortLabel: "Sea Ice",
    unit: "million km²",
    rateUnit: "million km² / decade",
    source: "NASA / NSIDC Sea Ice Index (satellite passive microwave record)",
    sourceUrl: "https://nsidc.org/data/seaice_index",
    description:
      "Arctic September minimum and Antarctic September maximum extent. Polar regions only.",
    decimals: 2,
  },
  co2: {
    id: "co2",
    label: "Atmospheric CO₂ Concentration",
    shortLabel: "CO₂",
    unit: "ppm",
    rateUnit: "ppm / decade",
    source: "NOAA Global Monitoring Laboratory / NASA Earth Science (Mauna Loa record)",
    sourceUrl: "https://gml.noaa.gov/ccgg/trends/",
    description:
      "Dry-air mole fraction of carbon dioxide. CO₂ mixes globally, so every region rises together.",
    decimals: 1,
  },
};

export interface Region {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Regional warming amplification relative to the global mean */
  tempFactor: number;
  /** Which pole's sea ice record applies here, if any */
  ice?: "arctic" | "antarctic";
  /** Small CO2 offset (ppm) reflecting latitudinal gradient of sources */
  co2Offset: number;
  blurb: string;
}

export const REGIONS: Region[] = [
  {
    id: "arctic-ocean",
    name: "Central Arctic Ocean",
    lat: 82,
    lon: 5,
    tempFactor: 3.4,
    ice: "arctic",
    co2Offset: 1.6,
    blurb: "The fastest-warming place on the planet, and the clearest ice signal.",
  },
  {
    id: "greenland",
    name: "Greenland",
    lat: 72,
    lon: -42,
    tempFactor: 2.2,
    ice: "arctic",
    co2Offset: 1.2,
    blurb: "Ice-sheet margins where melt season length is stretching.",
  },
  {
    id: "siberia",
    name: "Siberia",
    lat: 65,
    lon: 100,
    tempFactor: 2.3,
    co2Offset: 1.4,
    blurb: "Permafrost ground warming faster than almost any land region.",
  },
  {
    id: "europe",
    name: "Europe",
    lat: 50,
    lon: 10,
    tempFactor: 1.7,
    co2Offset: 0.9,
    blurb: "Warming at roughly twice the global land-plus-ocean rate.",
  },
  {
    id: "north-america",
    name: "North American Midlatitudes",
    lat: 42,
    lon: -100,
    tempFactor: 1.3,
    co2Offset: 0.8,
    blurb: "Strong year-to-year swings sitting on top of a steady rise.",
  },
  {
    id: "sahel",
    name: "Sahara & Sahel",
    lat: 20,
    lon: 12,
    tempFactor: 1.35,
    co2Offset: 0.3,
    blurb: "Hot, dry, and warming faster than the tropics around it.",
  },
  {
    id: "amazon",
    name: "Amazon Basin",
    lat: -5,
    lon: -60,
    tempFactor: 0.95,
    co2Offset: -0.2,
    blurb: "Warming modestly, but drought years are getting sharper.",
  },
  {
    id: "tropical-pacific",
    name: "Tropical Pacific",
    lat: 0,
    lon: -160,
    tempFactor: 0.75,
    co2Offset: -0.4,
    blurb: "El Niño and La Niña dominate the noise here — a hard place to see a trend.",
  },
  {
    id: "australia",
    name: "Australia",
    lat: -25,
    lon: 133,
    tempFactor: 1.15,
    co2Offset: -0.6,
    blurb: "Land warming fast while the ocean around it lags.",
  },
  {
    id: "southern-ocean",
    name: "Southern Ocean",
    lat: -58,
    lon: 20,
    tempFactor: 0.45,
    ice: "antarctic",
    co2Offset: -1.1,
    blurb: "A giant heat and carbon sink that warms slowly at the surface.",
  },
  {
    id: "antarctic-peninsula",
    name: "Antarctic Peninsula",
    lat: -66,
    lon: -63,
    tempFactor: 1.5,
    ice: "antarctic",
    co2Offset: -1.2,
    blurb: "One of the few Southern Hemisphere hotspots of rapid warming.",
  },
  {
    id: "ross-sea",
    name: "Ross Sea",
    lat: -75,
    lon: 180,
    tempFactor: 0.3,
    ice: "antarctic",
    co2Offset: -1.3,
    blurb: "Where Antarctic sea ice actually grew for decades before collapsing.",
  },
];

export const REGION_BY_ID: Record<string, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.id, r]),
);

/**
 * Deterministic pseudo-noise (no Math.random — values must be identical on the
 * server during SSR and in the browser after hydration).
 */
function wiggle(seed: number, year: number): number {
  const x = Math.sin(seed * 12.9898 + year * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function seedOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return h + 7;
}

export interface SeriesPoint {
  year: number;
  value: number;
}

function buildTemperature(region: Region): SeriesPoint[] {
  const seed = seedOf(region.id);
  // Regional variability grows with latitude: poles swing harder.
  const noiseScale = 0.08 + Math.abs(region.lat) / 90 * 0.22;
  return YEARS.map((year, i) => ({
    year,
    value:
      Math.round(
        (GLOBAL_TEMP_ANOMALY[i]! * region.tempFactor + (year > LAST_OBSERVED_YEAR ? 0 : wiggle(seed, year) * noiseScale)) *
          100,
      ) / 100,
  }));
}

function buildCo2(region: Region): SeriesPoint[] {
  const seed = seedOf(region.id) + 500;
  return YEARS.map((year, i) => ({
    year,
    value:
       Math.round((GLOBAL_CO2[i]! + region.co2Offset + (year > LAST_OBSERVED_YEAR ? 0 : wiggle(seed, year) * 0.35)) * 10) /
      10,
  }));
}

function buildSeaIce(region: Region): SeriesPoint[] | null {
  if (!region.ice) return null;
  const base = region.ice === "arctic" ? ARCTIC_SEA_ICE : ANTARCTIC_SEA_ICE;
  const seed = seedOf(region.id) + 900;
  // Each named sector holds a share of its hemisphere's extent.
  const share =
    region.id === "arctic-ocean"
      ? 0.55
      : region.id === "greenland"
        ? 0.18
        : region.id === "ross-sea"
          ? 0.24
          : region.id === "antarctic-peninsula"
            ? 0.14
            : 0.4;
  return YEARS.map((year, i) => ({
    year,
    value: Math.round((base[i]! * share + (year > LAST_OBSERVED_YEAR ? 0 : wiggle(seed, year) * 0.12)) * 100) / 100,
  }));
}

const seriesCache = new Map<string, SeriesPoint[] | null>();

/** Cached per-region, per-layer annual series. */
export function getSeries(regionId: string, layer: LayerId): SeriesPoint[] | null {
  const key = `${regionId}:${layer}`;
  if (seriesCache.has(key)) return seriesCache.get(key)!;
  const region = REGION_BY_ID[regionId];
  if (!region) return null;
  const built =
    layer === "temperature"
      ? buildTemperature(region)
      : layer === "co2"
        ? buildCo2(region)
        : buildSeaIce(region);
  seriesCache.set(key, built);
  return built;
}

/** Global reference series for a layer, used in the case studies. */
export function getGlobalSeries(layer: LayerId): SeriesPoint[] {
  const base =
    layer === "temperature"
      ? GLOBAL_TEMP_ANOMALY
      : layer === "co2"
        ? GLOBAL_CO2
        : ARCTIC_SEA_ICE;
  return YEARS.map((year, i) => ({ year, value: base[i]! }));
}
