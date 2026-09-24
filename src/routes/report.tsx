import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";

import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { CASES } from "@/data/cases";
import { LAST_OBSERVED_YEAR, LAYERS, START_YEAR, type LayerId } from "@/data/nasa-datasets";
import { formatRate, getLayerTrends } from "@/data/trends";
import { formatP } from "@/lib/mann-kendall";

const TITLE = "Research Report — Living Earth: Trend Detective";
const DESCRIPTION =
  "A printable research report: Mann–Kendall and Sen's slope trend results for every region and layer, two paradox case studies, and full NASA data citations.";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Report,
});

const ORDER: LayerId[] = ["temperature", "seaice", "co2", "sealevel"];

function Report() {
  const generated = new Date().toISOString().slice(0, 10);
  const sources = Array.from(
    new Map(ORDER.map((id) => [LAYERS[id].sourceUrl, LAYERS[id]])).values(),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="no-print">
        <SiteNav />
      </div>
      <article className="print-doc mx-auto max-w-[800px] px-5 py-12 leading-relaxed">
        <div className="no-print mb-8 flex justify-end">
          <Button type="button" onClick={() => window.print()} className="gap-2">
            <Printer className="size-4" /> Print / Save as PDF
          </Button>
        </div>

        <header className="border-b border-border pb-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-primary">
            NASA Space Apps 2026 · Be An Earth System Trend Detective!
          </p>
          <h1 className="mt-4 text-display text-3xl leading-tight sm:text-4xl">
            Living Earth: Trend Detective — Research Report
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Generated {generated}</p>
        </header>

        <section className="mt-10">
          <h2 className="text-display text-2xl">Executive summary</h2>
          <p className="mt-3 text-muted-foreground">
            This report tests annual Earth-observation records from {START_YEAR} to {LAST_OBSERVED_YEAR} across
            twelve regions and four layers. Its core finding: a single global process — added heat
            from rising greenhouse gases — produces clearly different, sometimes opposite, regional
            trends, and only a significance test separates real signals from noise.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-display text-2xl">Methodology</h2>
          <p className="mt-3 text-muted-foreground">
            Each region's series is tested with the Mann–Kendall test (Mann, 1945; Kendall, 1975),
            which asks whether later values are consistently higher or lower than earlier ones. It
            uses only the ordering of values, so a single extreme year or a non-normal distribution
            cannot fake a trend — the weakness of simple linear regression. The rate of change is
            Sen's slope (Sen, 1968): the median of every pairwise slope, reported per decade.
            A trend is called <em>statistically significant</em> when p &lt; 0.05, meaning a pattern this
            strong would appear by chance less than 5% of the time. The 2026 projection is never used
            in any test.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-display text-2xl">Findings by layer</h2>
          {ORDER.map((id) => {
            const meta = LAYERS[id];
            const rows = getLayerTrends(id).filter((r) => r.trend);
            return (
              <div key={id} className="mt-8">
                <h3 className="text-lg font-semibold">{meta.label}</h3>
                <p className="text-xs text-muted-foreground">
                  Unit: {meta.unit} · {START_YEAR}–{LAST_OBSERVED_YEAR} · {meta.source}
                </p>
                <div className="mt-3 overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-secondary/50 text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Region</th>
                        <th className="px-3 py-2 font-medium">Rate (per decade)</th>
                        <th className="px-3 py-2 font-medium">p-value</th>
                        <th className="px-3 py-2 font-medium">Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(({ region, trend }) => {
                        const sig = trend!.stats.significant;
                        return (
                          <tr
                            key={region.id}
                            className={`border-t border-border ${sig ? "text-rising print-sig" : "text-muted-foreground"}`}
                          >
                            <td className="px-3 py-2">{region.name}</td>
                            <td className="px-3 py-2 tabular-nums">{formatRate(id, trend!.stats.slopePerDecade)}</td>
                            <td className="px-3 py-2 tabular-nums">{formatP(trend!.stats.p)}</td>
                            <td className="px-3 py-2">{sig ? "Significant" : "Not significant"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
          <p className="mt-4 text-xs text-muted-foreground">
            Regional series are reconstructed from the published global records using latitude-based
            scaling; global values are the published annual records.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-display text-2xl">Detective cases</h2>
          {CASES.map((c) => (
            <div key={c.id} className="mt-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary">{c.kicker}</p>
              <h3 className="mt-1 text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-muted-foreground">{c.narrative}</p>
              <p className="mt-3 text-sm font-medium">Key mechanism</p>
              <p className="mt-1 text-muted-foreground">{c.mechanism}</p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="text-display text-2xl">Data sources &amp; citations</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {sources.map((s) => (
              <li key={s.sourceUrl}>
                {s.source} — <a className="text-primary underline" href={s.sourceUrl}>{s.sourceUrl}</a>
              </li>
            ))}
            <li>Mann, H. B. (1945). Nonparametric tests against trend. Econometrica, 13, 245–259.</li>
            <li>Kendall, M. G. (1975). Rank Correlation Methods. Griffin, London.</li>
            <li>Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau. JASA, 63, 1379–1389.</li>
          </ul>
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          Data: NASA GISTEMP · NSIDC · NOAA GML · NASA Sea Level Change. Not officially affiliated
          with or endorsed by NASA.
        </footer>
      </article>
    </div>
  );
}
