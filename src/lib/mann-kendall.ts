/**
 * Mann-Kendall trend test + Theil-Sen slope estimator.
 *
 * This is the same non-parametric trend test used in climate-science practice:
 * it makes no assumption that the data are normally distributed, and it is
 * robust against outliers. Results are computed once per (region, layer) pair
 * and cached (see src/data/trends.ts) so nothing is recomputed per frame.
 */

export type TrendDirection = "increasing" | "decreasing" | "no trend";

export interface MannKendallResult {
  /** Mann-Kendall S statistic */
  s: number;
  /** Normal approximation z score */
  z: number;
  /** Two-sided p-value */
  p: number;
  /** Kendall's tau */
  tau: number;
  /** Theil-Sen slope, in data units per year */
  slopePerYear: number;
  /** Theil-Sen slope, in data units per decade */
  slopePerDecade: number;
  direction: TrendDirection;
  significant: boolean;
  n: number;
}

/** Abramowitz & Stegun 7.1.26 approximation of erf(x). */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/** Two-sided p-value for a standard normal z score. */
function twoSidedP(z: number): number {
  return 1 - erf(Math.abs(z) / Math.SQRT2);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export function mannKendall(
  times: number[],
  values: number[],
  alpha = 0.05,
): MannKendallResult {
  const n = values.length;
  if (n < 4) {
    return {
      s: 0,
      z: 0,
      p: 1,
      tau: 0,
      slopePerYear: 0,
      slopePerDecade: 0,
      direction: "no trend",
      significant: false,
      n,
    };
  }

  // --- S statistic ---
  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      s += Math.sign(values[j]! - values[i]!);
    }
  }

  // --- variance with tie correction ---
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let tieTerm = 0;
  for (const c of counts.values()) {
    if (c > 1) tieTerm += c * (c - 1) * (2 * c + 5);
  }
  const varS = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;

  // --- continuity-corrected z ---
  let z = 0;
  if (varS > 0) {
    if (s > 0) z = (s - 1) / Math.sqrt(varS);
    else if (s < 0) z = (s + 1) / Math.sqrt(varS);
  }

  const p = twoSidedP(z);
  const tau = s / ((n * (n - 1)) / 2);

  // --- Theil-Sen slope: median of all pairwise slopes ---
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dt = times[j]! - times[i]!;
      if (dt !== 0) slopes.push((values[j]! - values[i]!) / dt);
    }
  }
  const slopePerYear = median(slopes);

  const significant = p < alpha;
  const direction: TrendDirection = !significant
    ? "no trend"
    : s > 0
      ? "increasing"
      : "decreasing";

  return {
    s,
    z,
    p,
    tau,
    slopePerYear,
    slopePerDecade: slopePerYear * 10,
    direction,
    significant,
    n,
  };
}

/** Formats a p-value the way a paper would: p = 0.023, or p < 0.001. */
export function formatP(p: number): string {
  if (p < 0.001) return "p < 0.001";
  return `p = ${p.toFixed(3)}`;
}
