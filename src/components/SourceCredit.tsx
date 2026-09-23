import { LAYERS, type LayerId } from "@/data/nasa-datasets";

/**
 * Every layer must cite its NASA source on screen — this component is the only
 * approved way to render a layer's data provenance.
 */
export function SourceCredit({
  layer,
  className = "",
  withNote = false,
}: {
  layer: LayerId;
  className?: string;
  withNote?: boolean;
}) {
  const meta = LAYERS[layer];
  return (
    <div className={`space-y-1 text-[11px] leading-relaxed text-muted-foreground ${className}`}>
      <p>
        <span className="text-foreground/70">Data source: </span>
        <a
          href={meta.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-primary"
        >
          {meta.source}
        </a>
      </p>
      {withNote && (
        <p>
           Observed annual values run through 2025; 2026 is a projection, not a completed annual record. Regional series are
          reconstructions scaled from those records, so use them to explore trend
          statistics — not as the gridded source product.
        </p>
      )}
    </div>
  );
}
