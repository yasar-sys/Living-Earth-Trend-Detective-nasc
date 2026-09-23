import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import type { LayerId } from "@/data/nasa-datasets";
import { EarthScene } from "./EarthScene";

function Loading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
      Loading Earth imagery…
    </div>
  );
}

/**
 * 3D complexity degrades on small screens: lower pixel ratio, fewer sphere
 * segments and no normal/roughness maps.
 */
export function GlobeCanvas({
  layer,
  year,
  selectedId,
  onSelect,
}: {
  layer: LayerId;
  year: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={isMobile ? [1, 1.3] : [1, 2]}
        camera={{ position: [0, 0.7, isMobile ? 3.7 : 3.1], fov: 45 }}
        gl={{ antialias: !isMobile }}
        onPointerMissed={() => onSelect(null)}
      >
        <Suspense fallback={null}>
          <EarthScene
            layer={layer}
            year={year}
            selectedId={selectedId}
            onSelect={onSelect}
            lowDetail={isMobile}
          />
        </Suspense>
      </Canvas>
      <Suspense fallback={<Loading />}>{null}</Suspense>
    </div>
  );
}
