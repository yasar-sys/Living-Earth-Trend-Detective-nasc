import { Html, OrbitControls, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";

import { REGIONS, ARCTIC_SEA_ICE, ANTARCTIC_SEA_ICE, START_YEAR, type LayerId, type Region } from "@/data/nasa-datasets";
import { getTrend, getValueAt } from "@/data/trends";
import { PALETTE, trendColor } from "@/lib/theme";
import { latLonToVec3 } from "./geo";

const EARTH_RADIUS = 1;

/** Polar coverage follows the two September extent records, rather than a fixed halo. */
function IceCoverage({ year }: { year: number }) {
  const i = year - START_YEAR;
  const north = Math.sqrt((ARCTIC_SEA_ICE[i] ?? 0) / Math.PI) / 111;
  const south = Math.sqrt((ANTARCTIC_SEA_ICE[i] ?? 0) / Math.PI) / 111;
  const northAngle = Math.min(0.6, north);
  const southAngle = Math.min(0.8, south);
  return <group>
    <mesh key={`north-${year}`}>
      <sphereGeometry args={[1.013, 64, 24, 0, Math.PI * 2, 0, northAngle]} />
      <meshBasicMaterial color={PALETTE.seaice} transparent opacity={0.58} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
    <mesh key={`south-${year}`}>
      <sphereGeometry args={[1.013, 64, 24, 0, Math.PI * 2, Math.PI - southAngle, southAngle]} />
      <meshBasicMaterial color={PALETTE.seaice} transparent opacity={0.58} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  </group>;
}

function Co2Atmosphere({ year }: { year: number }) {
  const progress = (year - START_YEAR) / 46;
  return <mesh scale={1.055}>
    <sphereGeometry args={[1, 64, 32]} />
    <meshBasicMaterial color={PALETTE.co2} transparent opacity={0.045 + progress * 0.17} depthWrite={false} side={THREE.FrontSide} />
  </mesh>;
}

/**
 * Earth surface. Realism comes from the NASA Blue Marble-derived colour,
 * normal and specular maps rather than from dense geometry — segment count
 * drops on small screens.
 */
function Earth({ lowDetail }: { lowDetail: boolean }) {
  const textures = useTexture({
    map: "/textures/earth_atmos_2048.jpg",
    normalMap: "/textures/earth_normal_2048.jpg",
    roughnessMap: "/textures/earth_specular_2048.jpg",
  }) as { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };

  textures.map.colorSpace = THREE.SRGBColorSpace;
  const segments = lowDetail ? 48 : 96;

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: textures.map,
      roughness: 0.85,
      metalness: 0.05,
    });
    if (!lowDetail) {
      m.normalMap = textures.normalMap;
      m.normalScale = new THREE.Vector2(0.6, 0.6);
      m.roughnessMap = textures.roughnessMap;
    }
    return m;
  }, [textures, lowDetail]);

  return (
    <group>
      <mesh material={material}>
        <sphereGeometry args={[EARTH_RADIUS, segments, segments / 2]} />
      </mesh>
      {/* Thin atmospheric rim */}
      <mesh scale={1.025}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 24]} />
        <meshBasicMaterial
          color={PALETTE.violet}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/** Color-coded data patch: size fixed per region, colour + opacity from the data. */
function RegionOverlay({
  region,
  layer,
  year,
}: {
  region: Region;
  layer: LayerId;
  year: number;
}) {
  const quaternion = useMemo(() => {
    const dir = latLonToVec3(region.lat, region.lon, 1).normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    return q;
  }, [region.lat, region.lon]);

  const position = useMemo(
    () => latLonToVec3(region.lat, region.lon, EARTH_RADIUS * 1.004),
    [region.lat, region.lon],
  );

  const trend = getTrend(region.id, layer);
  if (!trend) return null;

  const first = trend.series[0]?.value ?? 0;
  const current = getValueAt(region.id, layer, year) ?? first;
  const span = Math.abs(trend.stats.slopePerDecade) * 4.5 || 1;
  const magnitude = Math.min(1, Math.abs((current - first) / span));
  const color = layer === "temperature" ? PALETTE.temperature : layer === "seaice" ? PALETTE.seaice : PALETTE.co2;
  const radius = layer === "temperature" ? 0.07 + magnitude * 0.14 : layer === "co2" ? 0.08 + magnitude * 0.11 : 0.075 + magnitude * 0.06;

  return (
    <mesh position={position} quaternion={quaternion} renderOrder={1}>
       <circleGeometry args={[radius, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
         opacity={0.28 + magnitude * 0.42}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function RegionMarker({
  region,
  layer,
  selected,
  onSelect,
}: {
  region: Region;
  layer: LayerId;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const trend = getTrend(region.id, layer);
  const position = useMemo(
    () => latLonToVec3(region.lat, region.lon, EARTH_RADIUS * 1.02),
    [region.lat, region.lon],
  );

  // Meaningful motion only: markers whose trend is statistically significant
  // pulse, so "this signal is real" is visible before you click anything.
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const significant = trend?.stats.significant ?? false;
    const pulse = significant ? 1 + Math.sin(clock.elapsedTime * 2.1) * 0.18 : 1;
    const base = selected ? 1.6 : hovered ? 1.35 : 1;
    ref.current.scale.setScalar(pulse * base);
  });

  if (!trend) return null;
   const color = layer === "temperature" ? PALETTE.temperature : layer === "seaice" ? PALETTE.seaice : PALETTE.co2;

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(region.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {(hovered || selected) && (
        <Html center distanceFactor={6} zIndexRange={[20, 0]}>
          <div className="pointer-events-none -translate-y-6 whitespace-nowrap rounded-md border border-border bg-popover/95 px-2 py-1 text-[11px] text-popover-foreground shadow-lg">
            {region.name}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Cinematic camera transition: when a region is picked the orbit controls hand
 * over and the camera eases in to frame that region, then hands control back.
 */
function CameraRig({
  selectedId,
  controlsRef,
}: {
  selectedId: string | null;
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
}) {
  const { camera } = useThree();
  const target = useRef<THREE.Vector3 | null>(null);
  const settled = useRef(true);

  const region = selectedId ? REGIONS.find((r) => r.id === selectedId) : undefined;
  const key = region?.id ?? "none";
  const desired = useMemo(() => {
    if (!region) return null;
    return latLonToVec3(region.lat, region.lon, 1).normalize().multiplyScalar(2.05);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (desired && target.current !== desired) {
    target.current = desired;
    settled.current = false;
  }
  if (!desired) target.current = null;

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const goal = target.current;
    if (!goal || settled.current) {
      if (controls) controls.autoRotate = !selectedId;
      return;
    }
    if (controls) {
      controls.autoRotate = false;
      controls.enabled = false;
    }
    const t = 1 - Math.exp(-3.2 * Math.min(delta, 0.05) * 10);
    camera.position.lerp(goal, t);
    camera.lookAt(0, 0, 0);
    if (camera.position.distanceTo(goal) < 0.02) {
      settled.current = true;
      if (controls) {
        controls.enabled = true;
        controls.update();
      }
    }
  });

  return null;
}

export function EarthScene({
  layer,
  year,
  selectedId,
  onSelect,
  lowDetail,
}: {
  layer: LayerId;
  year: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  lowDetail: boolean;
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 2.5, 3]} intensity={2.1} color="#fff6e8" />
      <directionalLight position={[-4, -1, -3]} intensity={0.35} color={PALETTE.violet} />

      <Earth lowDetail={lowDetail} />
      {layer === "seaice" && <IceCoverage year={year} />}
      {layer === "co2" && <Co2Atmosphere year={year} />}

      {REGIONS.map((region) => (
        <RegionOverlay key={`o-${region.id}`} region={region} layer={layer} year={year} />
      ))}
      {REGIONS.map((region) => (
        <RegionMarker
          key={`m-${region.id}`}
          region={region}
          layer={layer}
          selected={selectedId === region.id}
          onSelect={onSelect}
        />
      ))}

      <CameraRig selectedId={selectedId} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        minDistance={1.55}
        maxDistance={4.5}
        autoRotate={!selectedId}
        autoRotateSpeed={0.3}
      />
    </>
  );
}
