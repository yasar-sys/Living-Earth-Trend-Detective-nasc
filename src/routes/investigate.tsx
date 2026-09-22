import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { GlobeCanvas } from "@/components/globe/GlobeCanvas";
import { LayerPanel } from "@/components/LayerPanel";
import { RegionPanel } from "@/components/RegionPanel";
import { SiteNav } from "@/components/SiteNav";
import { TimeSlider } from "@/components/TimeSlider";
import { END_YEAR, LAYERS, type LayerId } from "@/data/nasa-datasets";

const TITLE = "Globe — Living Earth: Trend Detective";
const DESCRIPTION =
  "Toggle NASA temperature, sea ice and CO₂ layers on a realistic 3D Earth, scrub the 1980–2025 timeline, and click any region for its Mann-Kendall trend result.";

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
  const [year, setYear] = useState(END_YEAR);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteNav />

      <div className="relative flex flex-1 flex-col sm:flex-row">
        {/* Globe stage */}
        <div className="relative min-h-[60vh] flex-1 sm:min-h-0">
          <GlobeCanvas
            layer={layer}
            year={year}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5">
            <div className="pointer-events-auto max-w-xs">
              <LayerPanel
                active={layer}
                onChange={(next) => {
                  setLayer(next);
                }}
              />
            </div>
            <div className="pointer-events-auto">
              <TimeSlider
                year={year}
                onChange={setYear}
                playing={playing}
                onTogglePlay={() => setPlaying((p) => !p)}
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Showing {LAYERS[layer].shortLabel} in {year}. Drag to spin the Earth, tap a
                marker to open its trend report.
              </p>
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
