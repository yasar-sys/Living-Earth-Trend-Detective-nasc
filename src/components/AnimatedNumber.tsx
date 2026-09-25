import { useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 760,
  showPlus = false,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  showPlus?: boolean;
  className?: string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const current = useRef(value);
  const frame = useRef(0);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    if (reducedMotion || duration <= 0) {
      current.current = value;
      setDisplay(value);
      return;
    }

    const from = current.current;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (value - from) * eased;
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [duration, reducedMotion, value]);

  const sign = showPlus && display > 0 ? "+" : "";
  return (
    <span className={cn("inline-block tabular-nums", className)}>
      {prefix}{sign}{display.toFixed(decimals)}{suffix}
    </span>
  );
}