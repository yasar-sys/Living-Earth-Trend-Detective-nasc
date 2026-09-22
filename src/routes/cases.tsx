import { createFileRoute } from "@tanstack/react-router";

import { SiteNav } from "@/components/SiteNav";
import { SourceCredit } from "@/components/SourceCredit";
import { TrendChart } from "@/components/TrendChart";
import { getSeries, type LayerId } from "@/data/nasa-datasets";
import { formatRate, getTrend } from "@/data/trends";
import { formatP } from "@/lib/mann-kendall";
import { PALETTE } from "@/lib/theme";

const TITLE = "Detective Cases — Living Earth: Trend Detective";
const DESCRIPTION =
  "Two investigations where one global process produces opposite regional trends: Arctic versus Antarctic sea ice, and Southern Ocean surface cooling under global warming.";

export const Route = createFileRoute("/cases")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cases,
});

// TODO (stretch): add audio narration for each Detective Case.
// TODO (stretch): add a Bangla translation of the case narratives.

interface CaseSpec {
  id: string;
  kicker: string;
  title: string;
  narrative: string;
  mechanism: string;
  layer: LayerId;
  left: { regionId: string; label: string; window?: [number, number] };
  right: { regionId: string; label: string; window?: [number, number] };
}

const CASES: CaseSpec[] = [
  {
    id: "two-poles",
    kicker: "Case 01",
    title: "Two poles, two verdicts",
    narrative:
      "Satellites have watched both polar oceans with the same instruments since 1979. The Arctic answer is blunt: September ice is disappearing, and the Mann–Kendall test rejects noise outright. Then you turn the globe over. For three decades Antarctic sea ice drifted slightly upward — enough that people argued the ice wasn't really in trouble. Same planet, same warming, opposite signs. Only one of these is a strong statistical trend, and that difference is the whole case.",
    mechanism:
      "The Arctic is an ocean ringed by land, so warm water and warm air are trapped against the ice and thinning it year after year. Antarctic sea ice is a thin skirt floating on the open Southern Ocean, and it is governed less by temperature than by wind and by the fresh, cold meltwater spilling off the ice sheet. Strengthening westerly winds pushed ice outward and freshwater capped the surface, holding extent up — until 2016, when Antarctic extent fell off a cliff and the earlier 'growth' was revealed as a weak, wind-driven wobble on top of a warming ocean.",
    layer: "seaice",
    left: { regionId: "arctic-ocean", label: "Central Arctic Ocean" },
    right: { regionId: "ross-sea", label: "Ross Sea (Antarctic)" },
  },
  {
    id: "southern-lag",
    kicker: "Case 02",
    title: "The corner of the world that refuses to warm",
    narrative:
      "Pick the Siberian Arctic and the trend is unmissable — the surface is warming several times faster than the global average and the test returns a vanishingly small p-value. Pick the Southern Ocean and the same layer, the same years, the same method returns something much flatter. A sceptic reads that as proof warming isn't global. A detective reads the p-value and the physics instead.",
    mechanism:
      "Both regions are responding to the same extra energy — it just goes to different places. Over Siberia, heat stays in a shallow layer of air and is amplified by vanishing snow and ice, which darkens the surface and traps even more heat. In the Southern Ocean, the same heat is stirred downward: upwelling brings century-old water to the surface and currents carry the warmed water into the deep ocean, so the surface temperature barely budges while the heat is quietly banked below. Slow surface warming there is evidence of a heat sink, not of an absent trend.",
    layer: "temperature",
    left: { regionId: "siberia", label: "Siberia" },
    right: { regionId: "southern-ocean", label: "Southern Ocean" },
  },
];

function Cases() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary">
          Featured investigations
        </p>
        <h1 className="mt-4 text-display text-4xl leading-tight sm:text-5xl">
          When one cause produces two opposite trends
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          These are the cases that trip people up. In each one, a single global process
          shows up as a rising trend in one region and a falling — or statistically absent
          — trend in another. The charts are the same records the globe view uses.
        </p>

        <div className="mt-14 space-y-20">
          {CASES.map((c) => (
            <CaseBlock key={c.id} spec={c} />
          ))}
        </div>

        <section className="mt-20 rounded-lg border border-border bg-card/70 p-6">
          <h2 className="text-display text-2xl">Antarctic ice, two different windows</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The clearest lesson in the whole challenge: the window you choose changes the
            verdict. Here is the same Antarctic record tested over 1980–2014 and over the
            full 1980–2025 satellite era.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <WindowVerdict
              regionId="ross-sea"
              layer="seaice"
              from={1980}
              to={2014}
              label="1980–2014"
            />
            <WindowVerdict
              regionId="ross-sea"
              layer="seaice"
              from={1980}
              to={2025}
              label="1980–2025"
            />
          </div>
          <div className="mt-5 border-t border-border/70 pt-4">
            <SourceCredit layer="seaice" withNote />
          </div>
        </section>
      </main>
    </div>
  );
}

function CaseBlock({ spec }: { spec: CaseSpec }) {
  const leftTrend = getTrend(spec.left.regionId, spec.layer);
  const rightTrend = getTrend(spec.right.regionId, spec.layer);
  const leftSeries = getSeries(spec.left.regionId, spec.layer);
  const rightSeries = getSeries(spec.right.regionId, spec.layer);

  return (
    <article className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-rising">
          {spec.kicker}
        </p>
        <h2 className="mt-3 text-display text-3xl leading-tight">{spec.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {spec.narrative}
        </p>
        <div className="mt-5 rounded-md border border-primary/40 bg-primary/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary">
            The mechanism
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {spec.mechanism}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {leftSeries && rightSeries && (
          <div className="rounded-lg border border-border bg-card/70 p-4">
            <p className="mb-2 text-xs text-muted-foreground">
              Side by side, same years, same test
            </p>
            <TrendChart
              unit=""
              height={240}
              showLegend
              series={[
                {
                  name: spec.left.label,
                  color: PALETTE.rust,
                  points: leftSeries,
                },
                {
                  name: spec.right.label,
                  color: PALETTE.amber,
                  points: rightSeries,
                },
              ]}
            />
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: spec.left.label, trend: leftTrend },
            { label: spec.right.label, trend: rightTrend },
          ].map(({ label, trend }) => (
            <div key={label} className="rounded-md border border-border bg-secondary/30 p-3">
              <p className="text-sm">{label}</p>
              <p className="mt-1 text-display text-lg">
                {trend ? formatRate(spec.layer, trend.stats.slopePerDecade) : "—"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {trend
                  ? `Mann–Kendall ${formatP(trend.stats.p)} · ${
                      trend.stats.significant
                        ? `significant ${trend.stats.direction}`
                        : "not significant"
                    }`
                  : "no record"}
              </p>
            </div>
          ))}
        </div>
        <SourceCredit layer={spec.layer} />
      </div>
    </article>
  );
}

function WindowVerdict({
  regionId,
  layer,
  from,
  to,
  label,
}: {
  regionId: string;
  layer: LayerId;
  from: number;
  to: number;
  label: string;
}) {
  const trend = getTrend(regionId, layer, from, to);
  if (!trend) return null;
  return (
    <div className="rounded-md border border-border bg-secondary/30 p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-display text-xl">
        {formatRate(layer, trend.stats.slopePerDecade)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Mann–Kendall {formatP(trend.stats.p)} ·{" "}
        {trend.stats.significant
          ? `significant ${trend.stats.direction} trend`
          : "not distinguishable from noise"}
      </p>
    </div>
  );
}
