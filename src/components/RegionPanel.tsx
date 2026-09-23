import { X } from "lucide-react";

import { SourceCredit } from "@/components/SourceCredit";
import { TrendChart, trendLinePoints } from "@/components/TrendChart";
import { LAYERS, REGION_BY_ID, LAST_OBSERVED_YEAR, type LayerId } from "@/data/nasa-datasets";
import { formatRate, getTrend, getValueAt } from "@/data/trends";
import { formatP } from "@/lib/mann-kendall";
import { PALETTE, trendColor } from "@/lib/theme";

export function RegionPanel({
  regionId,
  layer,
  year,
  onClose,
}: {
  regionId: string;
  layer: LayerId;
  year: number;
  onClose: () => void;
}) {
  const region = REGION_BY_ID[regionId];
  const meta = LAYERS[layer];
  const trend = getTrend(regionId, layer);
  const value = getValueAt(regionId, layer, year);

  if (!region) return null;

  return (
    <aside className="flex h-full w-full flex-col gap-4 overflow-y-auto border-border bg-card/95 p-4 backdrop-blur sm:w-[24rem] sm:border-l">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-display text-xl leading-tight">{region.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{region.blurb}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close region panel"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {!trend ? (
        <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
          The {meta.shortLabel} record doesn't cover this region. Sea ice extent is
          measured only in the polar oceans — try the Arctic, Ross Sea, Southern Ocean or
          Antarctic Peninsula.
        </div>
      ) : (
        <>
          <div className="rounded-md border border-border bg-secondary/30 p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {meta.label}
            </p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <span className="text-display text-3xl leading-none">
                {value !== null ? value.toFixed(meta.decimals) : "—"}
                <span className="ml-1 text-sm text-muted-foreground">{meta.unit}</span>
              </span>
              <span className="pb-1 text-xs text-muted-foreground">{year > LAST_OBSERVED_YEAR ? `${year} projection` : `in ${year}`}</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Observed record, 1980–{LAST_OBSERVED_YEAR}</span>
              <span className="flex items-center gap-1.5">
                <span className="h-px w-4 border-t border-dashed border-muted-foreground" />
                Theil–Sen fit
              </span>
            </div>
            <TrendChart
              unit={meta.unit}
              series={[
                {
                  name: "Observed",
                  color: trendColor(trend.stats.slopePerDecade, trend.stats.significant),
                  points: trend.series,
                },
                {
                  name: "Trend",
                  color: PALETTE.offWhite,
                  points: trendLinePoints(trend.series, trend.stats.slopePerYear),
                  trendLine: true,
                },
              ]}
            />
          </div>

          <div className="grid gap-2">
            <Stat label="Rate of change">
              <span
                style={{
                  color: trendColor(
                    trend.stats.slopePerDecade,
                    trend.stats.significant,
                  ),
                }}
                className="text-display text-lg"
              >
                {formatRate(layer, trend.stats.slopePerDecade)}
              </span>
            </Stat>

            <div className="rounded-md border border-border bg-secondary/30 p-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Statistical test
              </p>
              <p className="mt-1.5 text-sm">
                Mann–Kendall test: {formatP(trend.stats.p)} —{" "}
                {trend.stats.significant ? (
                  <span className="inline-flex items-center gap-1.5 text-rising">
                    <span className="size-2 rounded-full bg-rising animate-signal" />
                    statistically significant {trend.stats.direction} trend
                  </span>
                ) : (
                  <span className="text-noise">
                    no significant trend — the change is not distinguishable from
                    year-to-year noise
                  </span>
                )}
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Kendall&apos;s τ = {trend.stats.tau.toFixed(2)}, S = {trend.stats.s}, z ={" "}
                {trend.stats.z.toFixed(2)}, n = {trend.stats.n} annual values, α = 0.05.
                The slope is the Theil–Sen estimator, the median of all pairwise slopes.
              </p>
            </div>
          </div>

          <div className="mt-auto border-t border-border/70 pt-3">
            <SourceCredit layer={layer} withNote />
          </div>
        </>
      )}
    </aside>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
