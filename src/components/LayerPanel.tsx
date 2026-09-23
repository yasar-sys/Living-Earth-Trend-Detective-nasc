import { LAYERS, type LayerId } from "@/data/nasa-datasets";
import { SourceCredit } from "./SourceCredit";
import { Button } from "@/components/ui/button";
import { Cloud, Snowflake, Thermometer } from "lucide-react";

const ORDER: LayerId[] = ["temperature", "seaice", "co2"];
const ICONS = { temperature: Thermometer, seaice: Snowflake, co2: Cloud };
const SWATCHES = { temperature: "bg-layer-temperature", seaice: "bg-layer-seaice", co2: "bg-layer-co2" };

export function LayerPanel({
  active,
  onChange,
}: {
  active: LayerId;
  onChange: (layer: LayerId) => void;
}) {
  const meta = LAYERS[active];

  return (
    <div className="w-full rounded-lg border border-border bg-card/85 p-2 backdrop-blur sm:w-72 sm:p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Data layer
      </p>
       <div className="mt-2 grid grid-cols-3 gap-1 sm:block sm:space-y-1.5">
        {ORDER.map((id) => {
          const layer = LAYERS[id];
          const isActive = id === active;
          return (
            <Button
              key={id}
              type="button"
              variant="outline"
              onClick={() => onChange(id)}
              aria-pressed={isActive}
              className={`h-auto w-full flex-col justify-center gap-1 rounded-md border px-1 py-2 text-center text-xs whitespace-normal transition-colors sm:flex-row sm:justify-start sm:gap-2 sm:px-3 sm:text-left sm:text-sm ${
                isActive
                  ? "border-primary/70 bg-primary/15 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {(() => { const Icon = ICONS[id]; return <Icon className="size-4 shrink-0" />; })()}
              <span className={`size-2 shrink-0 rounded-full ${SWATCHES[id]}`} />
              <span className="block min-w-0 font-medium">{layer.shortLabel}</span>
              <span className="sr-only">
                {layer.label}
              </span>
            </Button>
          );
        })}
      </div>

       <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground sm:mt-3 sm:text-xs">
        {meta.description}
      </p>

       <div className="mt-3 hidden space-y-1.5 border-t border-border/70 pt-3 text-[11px] sm:block">
         <p className="mb-1 text-muted-foreground">Trend markers</p>
        <Legend color="bg-rising" label="Significant rise" />
        <Legend color="bg-declining" label="Significant decline" />
        <Legend color="bg-noise" label="Not distinguishable from noise" />
      </div>

       <div className="mt-2 border-t border-border/70 pt-2 sm:mt-3 sm:pt-3">
         <SourceCredit layer={active} />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}
