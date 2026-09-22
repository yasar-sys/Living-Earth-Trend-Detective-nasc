import { createFileRoute } from "@tanstack/react-router";
import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { SiteNav } from "@/components/SiteNav";
import { SourceCredit } from "@/components/SourceCredit";
import { TrendChart, trendLinePoints } from "@/components/TrendChart";
import { LAYERS, REGION_BY_ID, type LayerId } from "@/data/nasa-datasets";
import { formatRate, getTrend } from "@/data/trends";
import { formatP } from "@/lib/mann-kendall";
import { PALETTE, trendColor } from "@/lib/theme";

const TITLE = "Detective Mode — Living Earth: Trend Detective";
const DESCRIPTION =
  "Commit to a hypothesis about a region's trend, then see whether NASA's record and the Mann-Kendall test agree with you.";

export const Route = createFileRoute("/detective-mode")({
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
  component: DetectiveMode,
});

type Guess = "rising" | "declining" | "noise";

interface Puzzle {
  id: string;
  regionId: string;
  layer: LayerId;
  question: string;
  hint: string;
}

const PUZZLES: Puzzle[] = [
  {
    id: "arctic-ice",
    regionId: "arctic-ocean",
    layer: "seaice",
    question: "September sea ice in the Central Arctic Ocean, 1980–2025:",
    hint: "An ocean enclosed by land, losing its oldest ice.",
  },
  {
    id: "ross-ice",
    regionId: "ross-sea",
    layer: "seaice",
    question: "Antarctic sea ice in the Ross Sea sector, 1980–2025:",
    hint: "Wind-driven, and it changed behaviour abruptly after 2015.",
  },
  {
    id: "pacific-temp",
    regionId: "tropical-pacific",
    layer: "temperature",
    question: "Surface temperature in the Tropical Pacific, 1980–2025:",
    hint: "El Niño and La Niña swing this record hard from year to year.",
  },
  {
    id: "southern-temp",
    regionId: "southern-ocean",
    layer: "temperature",
    question: "Surface temperature of the Southern Ocean, 1980–2025:",
    hint: "The heat is going somewhere — but is it staying at the surface?",
  },
  {
    id: "amazon-co2",
    regionId: "amazon",
    layer: "co2",
    question: "Atmospheric CO₂ measured over the Amazon Basin, 1980–2025:",
    hint: "CO₂ mixes through the whole atmosphere within a couple of years.",
  },
];

const OPTIONS: { id: Guess; label: string; detail: string }[] = [
  {
    id: "rising",
    label: "A significant rise",
    detail: "Going up, and strong enough to pass the test",
  },
  {
    id: "declining",
    label: "A significant decline",
    detail: "Going down, and strong enough to pass the test",
  },
  {
    id: "noise",
    label: "No real trend",
    detail: "Changes, but not distinguishable from noise",
  },
];

function DetectiveMode() {
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState<Guess | null>(null);
  const [score, setScore] = useState({ correct: 0, answered: 0 });

  const puzzle = PUZZLES[index]!;
  const region = REGION_BY_ID[puzzle.regionId]!;
  const meta = LAYERS[puzzle.layer];
  const trend = getTrend(puzzle.regionId, puzzle.layer)!;

  const truth: Guess = !trend.stats.significant
    ? "noise"
    : trend.stats.slopePerDecade > 0
      ? "rising"
      : "declining";
  const revealed = guess !== null;
  const correct = guess === truth;

  const submit = (g: Guess) => {
    if (revealed) return;
    setGuess(g);
    setScore((s) => ({ correct: s.correct + (g === truth ? 1 : 0), answered: s.answered + 1 }));
  };

  const next = () => {
    setGuess(null);
    setIndex((i) => (i + 1) % PUZZLES.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary">
              Detective mode
            </p>
            <h1 className="mt-3 text-display text-4xl leading-tight">
              Call it before the data does
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Case {index + 1} of {PUZZLES.length} · {score.correct}/{score.answered} correct
          </p>
        </div>

        <section className="mt-8 rounded-lg border border-border bg-card/70 p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {meta.label} · {region.name}
          </p>
          <h2 className="mt-2 text-display text-2xl leading-snug">{puzzle.question}</h2>
          <p className="mt-2 text-xs text-muted-foreground">Clue: {puzzle.hint}</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {OPTIONS.map((o) => {
              const isGuess = guess === o.id;
              const isTruth = revealed && truth === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => submit(o.id)}
                  disabled={revealed}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${
                    isTruth
                      ? "border-rising/70 bg-rising/15"
                      : isGuess
                        ? "border-destructive/70 bg-destructive/15"
                        : "border-border bg-secondary/40 hover:border-primary/60 disabled:hover:border-border"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 font-medium">
                    {o.label}
                    {isTruth && <Check className="size-4 text-rising" />}
                    {isGuess && !isTruth && <X className="size-4 text-destructive" />}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {o.detail}
                  </span>
                </button>
              );
            })}
          </div>

          {revealed && (
            <div className="animate-fade-rise mt-6 space-y-4">
              <p className="text-sm">
                {correct
                  ? "Correct — the record backs you up."
                  : "Not what the record says. Here is the evidence:"}
              </p>

              <TrendChart
                unit={meta.unit}
                height={230}
                series={[
                  {
                    name: "Observed",
                    color: trendColor(
                      trend.stats.slopePerDecade,
                      trend.stats.significant,
                    ),
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

              <div className="rounded-md border border-border bg-secondary/30 p-4">
                <p className="text-display text-lg">
                  {formatRate(puzzle.layer, trend.stats.slopePerDecade)}
                </p>
                <p className="mt-1.5 text-sm">
                  Mann–Kendall test: {formatP(trend.stats.p)} —{" "}
                  {trend.stats.significant
                    ? `statistically significant ${trend.stats.direction} trend`
                    : "no significant trend; the change stays inside the noise"}
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Kendall&apos;s τ = {trend.stats.tau.toFixed(2)}, n = {trend.stats.n}{" "}
                  annual values, α = 0.05.
                </p>
              </div>

              <SourceCredit layer={puzzle.layer} withNote />

              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
              >
                <RotateCcw className="size-4" />
                Next case
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
