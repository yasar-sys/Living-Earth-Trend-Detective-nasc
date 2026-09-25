import { Pause, Play } from "lucide-react";
import { useEffect } from "react";

import { END_YEAR, LAST_OBSERVED_YEAR, START_YEAR } from "@/data/nasa-datasets";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/AnimatedNumber";

const SPEEDS = [1, 2, 4] as const;
export type Speed = (typeof SPEEDS)[number];

export function TimeSlider({
  year,
  onChange,
  playing,
  onTogglePlay,
  onPause,
  speed,
  onSpeedChange,
}: {
  year: number;
  onChange: (year: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onPause: () => void;
  speed: Speed;
  onSpeedChange: (s: Speed) => void;
}) {
  useEffect(() => {
    if (!playing) return;
    if (year >= END_YEAR) {
      onPause();
      return;
    }
    const id = window.setTimeout(() => onChange(year + 1), 700 / speed);
    return () => window.clearTimeout(id);
  }, [playing, year, speed, onChange, onPause]);

  return (
    <div className="rounded-lg border border-border bg-card/85 px-3 py-3 backdrop-blur sm:px-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <Button
            type="button"
            size="icon"
            onClick={() => {
              if (!playing && year >= END_YEAR) onChange(START_YEAR);
              onTogglePlay();
            }}
            aria-label={playing ? "Pause playback" : "Play through the years"}
            className={`size-12 rounded-full ${playing ? "animate-signal" : ""}`}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </Button>
          <div className="flex rounded-md border border-border text-[10px]" role="group" aria-label="Playback speed">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                aria-pressed={speed === s}
                className={`px-1.5 py-0.5 ${speed === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <AnimatedNumber value={year} duration={620} className="text-display w-[4ch] text-2xl leading-none" />
            <span className="text-[11px] text-muted-foreground">
              {START_YEAR}–{END_YEAR}
            </span>
          </div>
          <Slider
            className="mt-3"
            value={[year]}
            min={START_YEAR}
            max={END_YEAR}
            step={1}
            onValueChange={(v) => {
              if (playing) onPause();
              onChange(v[0] ?? year);
            }}
            aria-label="Year"
          />
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>{START_YEAR}</span><span>{LAST_OBSERVED_YEAR} observed</span><span>{END_YEAR} projected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
