/**
 * Pre-computed trend statistics, cached.
 *
 * Every region/layer pair gets one Mann-Kendall + Theil-Sen evaluation, computed
 * on first access and memoised for the life of the process (so it runs once on
 * the server during SSR and once in the browser, never per frame or per render).
 */
import { mannKendall, type MannKendallResult } from "@/lib/mann-kendall";
import {
  END_YEAR,
  LAYERS,
  LAST_OBSERVED_YEAR,
  REGIONS,
  START_YEAR,
  getSeries,
  type LayerId,
  type SeriesPoint,
} from "./nasa-datasets";

export interface RegionTrend {
  regionId: string;
  layer: LayerId;
  series: SeriesPoint[];
  stats: MannKendallResult;
  /** Normalised -1..1 magnitude used to colour the globe overlay */
  intensity: number;
}

const trendCache = new Map<string, RegionTrend | null>();

/** Reference decadal rate used to normalise each layer's colour scale. */
const SCALE: Record<LayerId, number> = {
  temperature: 0.45,
  seaice: 0.4,
  co2: 25,
};

export function getTrend(
  regionId: string,
  layer: LayerId,
  fromYear = START_YEAR,
  toYear = LAST_OBSERVED_YEAR,
): RegionTrend | null {
  const key = `${regionId}:${layer}:${fromYear}:${toYear}`;
  const cached = trendCache.get(key);
  if (cached !== undefined) return cached;

  const full = getSeries(regionId, layer);
  if (!full) {
    trendCache.set(key, null);
    return null;
  }
  const series = full.filter((p) => p.year >= fromYear && p.year <= toYear);
  const stats = mannKendall(
    series.map((p) => p.year),
    series.map((p) => p.value),
  );
  const intensity = Math.max(
    -1,
    Math.min(1, stats.slopePerDecade / SCALE[layer]),
  );
  const trend: RegionTrend = { regionId, layer, series, stats, intensity };
  trendCache.set(key, trend);
  return trend;
}

export function getLayerTrends(layer: LayerId, fromYear?: number, toYear?: number) {
  return REGIONS.map((r) => ({ region: r, trend: getTrend(r.id, layer, fromYear, toYear) }));
}

/** Value of a region's series in a specific year (for the time slider). */
export function getValueAt(
  regionId: string,
  layer: LayerId,
  year: number,
): number | null {
  const series = getSeries(regionId, layer);
  if (!series) return null;
  return series.find((p) => p.year === year)?.value ?? null;
}

export function formatRate(layer: LayerId, slopePerDecade: number): string {
  const meta = LAYERS[layer];
  const sign = slopePerDecade > 0 ? "+" : "";
  return `${sign}${slopePerDecade.toFixed(meta.decimals)} ${meta.rateUnit}`;
}
