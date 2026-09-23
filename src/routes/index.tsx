import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { Starfield } from "@/components/Starfield";

const TITLE = "Living Earth: Trend Detective";
const DESCRIPTION =
  "Investigate Earth-observation records on an interactive 3D globe from 1980 to a projected 2026, test regional trends, and uncover contrasting changes.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${TITLE} — NASA Space Apps 2026` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <Starfield density={1.2} />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-18rem] size-[46rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <section className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-20">
        <p className="animate-fade-rise text-[11px] uppercase tracking-[0.3em] text-primary">
          NASA Space Apps 2026 · Be An Earth System Trend Detective
        </p>

        <h1
          className="animate-fade-rise mt-5 text-display text-5xl leading-[1.05] sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Living Earth:
          <br />
          <span className="text-rising">Trend Detective</span>
        </h1>

        <p
          className="animate-fade-rise mt-6 max-w-xl text-lg text-muted-foreground"
          style={{ animationDelay: "160ms" }}
        >
          Change is everywhere. Is it real, or just noise?
        </p>

        <p
          className="animate-fade-rise mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground"
          style={{ animationDelay: "220ms" }}
        >
          Spin a real Earth, switch between NASA temperature, sea ice and CO₂ records,
          then let a Mann–Kendall test decide whether the change you think you see
          survives statistical scrutiny.
        </p>

        <div
          className="animate-fade-rise mt-9 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            to="/investigate"
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Start Investigating
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/cases"
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            <Sparkles className="size-4 text-rising" />
            See the two paradox cases
          </Link>
        </div>

        <dl
          className="animate-fade-rise mt-16 grid grid-cols-2 gap-6 border-t border-border/60 pt-8 text-sm sm:grid-cols-4"
          style={{ animationDelay: "380ms" }}
        >
          {[
            ["46 years", "1980–2025 annual records"],
            ["3 layers", "GISTEMP · NSIDC · NOAA CO₂"],
            ["12 regions", "Pole to tropics"],
            ["Mann–Kendall", "Significance, not vibes"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="text-display text-lg">{value}</dt>
              <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
