import { Pause, Play } from "lucide-react";
import { useEffect } from "react";

import { END_YEAR, START_YEAR } from "@/data/nasa-datasets";
import { Slider } from "@/components/ui/slider";

export function TimeSlider({
  year,
  onChange,
  playing,
  onTogglePlay,
}: {
  year: number;
  onChange: (year: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      onChange(year >= END_YEAR ? START_YEAR : year + 1);
    }, 320);
    return () => window.clearInterval(id);
  }, [playing, year, onChange]);

  return (
    <div className="rounded-lg border border-border bg-card/85 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={playing ? "Pause playback" : "Play through the years"}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/85"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-display text-2xl leading-none">{year}</span>
            <span className="text-[11px] text-muted-foreground">
              {START_YEAR}–{END_YEAR}
            </span>
          </div>
          <Slider
            className="mt-2"
            value={[year]}
            min={START_YEAR}
            max={END_YEAR}
            step={1}
            onValueChange={(v) => onChange(v[0] ?? year)}
            aria-label="Year"
          />
        </div>
      </div>
    </div>
  );
}
