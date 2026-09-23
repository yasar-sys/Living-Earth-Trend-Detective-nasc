import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { GlobeCanvas } from "@/components/globe/GlobeCanvas";
import { LayerPanel } from "@/components/LayerPanel";
import { RegionPanel } from "@/components/RegionPanel";
import { SiteNav } from "@/components/SiteNav";
import { TimeSlider } from "@/components/TimeSlider";
import { END_YEAR, LAST_OBSERVED_YEAR, START_YEAR, LAYERS, getGlobalSeries, type LayerId } from "@/data/nasa-datasets";

const TITLE = "Globe — Living Earth: Trend Detective";
const DESCRIPTION =
  "Explore temperature, sea ice and CO₂ changes on a 3D Earth from 1980 to a clearly marked 2026 projection.";

export const Route = createFileRoute("/investigate")({
  // The WebGL canvas is browser-only, so this route renders client-side.
  ssr: false,
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
  component: Investigate,
});

function Investigate() {
  const [layer, setLayer] = useState<LayerId>("temperature");
  const [year, setYear] = useState(START_YEAR);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const globalSeries = getGlobalSeries(layer);
  const current = globalSeries.find((point) => point.year === year)?.value;
  const baseline = globalSeries[0]?.value;
  const change = current !== undefined && baseline !== undefined ? current - baseline : 0;
  const readingLabel = layer === "seaice" ? "Arctic September extent" : layer === "co2" ? "Mauna Loa CO₂" : "Global temperature anomaly";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <div className="relative flex flex-1 flex-col sm:flex-row">
        {/* Globe stage */}
         <div className="relative h-[680px] min-w-0 flex-1 sm:h-[calc(100vh-4rem)] sm:max-h-[900px]">
          <GlobeCanvas
            layer={layer}
            year={year}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5">
             <div className="pointer-events-auto max-w-full sm:max-w-xs">
              <LayerPanel
                active={layer}
                onChange={(next) => {
                  setLayer(next);
                }}
              />
            </div>
            <div className="pointer-events-auto">
              <div className="mb-3 flex w-fit max-w-full items-center gap-3 border-l-2 border-primary bg-card/90 px-3 py-2 backdrop-blur">
                <span className={`size-2.5 shrink-0 rounded-full ${layer === "temperature" ? "bg-layer-temperature" : layer === "seaice" ? "bg-layer-seaice" : "bg-layer-co2"}`} />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{readingLabel} · {year > LAST_OBSERVED_YEAR ? "2026 projection" : year}</p>
                  <p className="text-sm font-medium tabular-nums">{current?.toFixed(LAYERS[layer].decimals)} {LAYERS[layer].unit} <span className="text-xs text-muted-foreground">({change >= 0 ? "+" : ""}{change.toFixed(LAYERS[layer].decimals)} since 1980)</span></p>
                </div>
              </div>
              <TimeSlider
                year={year}
                onChange={setYear}
                playing={playing}
                onTogglePlay={() => setPlaying((p) => !p)}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">{year === END_YEAR ? "2026 is projected from recent observations; no full-year measurement exists yet." : "Drag to spin the Earth; tap a marker for its trend report."}</p>
            </div>
          </div>
        </div>

        {/* Region report */}
        {selectedId && (
          <div className="h-[70vh] shrink-0 sm:h-auto">
            <RegionPanel
              regionId={selectedId}
              layer={layer}
              year={year}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
