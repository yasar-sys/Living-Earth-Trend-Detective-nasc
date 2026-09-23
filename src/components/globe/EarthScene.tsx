import { Html, OrbitControls, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";

import {
  REGIONS,
  ARCTIC_SEA_ICE,
  ANTARCTIC_SEA_ICE,
  GLOBAL_CO2,
  GLOBAL_SEA_LEVEL,
  START_YEAR,
  type LayerId,
  type Region,
} from "@/data/nasa-datasets";
import { getTrend, getValueAt } from "@/data/trends";
import { PALETTE, trendColor } from "@/lib/theme";
import { latLonToVec3 } from "./geo";

const EARTH_RADIUS = 1;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Deterministic seeded pseudo-random in [0, 1) — no Math.random so SSR and
 *  client produce identical values (no hydration mismatch). */
function seededRand(seed: number): number {
  const x = Math.sin(seed) * 43758.5453123;
  return x - Math.floor(x);
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
  const radius = layer === "temperature" ? 0.045 + magnitude * 0.055 : layer === "co2" ? 0.04 + magnitude * 0.045 : 0.04 + magnitude * 0.035;

  return (
    <mesh position={position} quaternion={quaternion} renderOrder={1}>
       <circleGeometry args={[radius, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
         opacity={0.2 + magnitude * 0.2}
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
   const color = trendColor(trend.stats.slopePerDecade, trend.stats.significant);

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
 * Handles polar ice dome regions specially (can't fly straight up to lat 90).
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

  const desired = useMemo(() => {
    if (!selectedId) return null;
    // Ice dome regions are at true poles — approach from a side angle
    if (selectedId === "arctic-ocean") {
      return new THREE.Vector3(0.5, 2.0, 0.3).normalize().multiplyScalar(2.1);
    }
    if (selectedId === "southern-ocean") {
      return new THREE.Vector3(0.5, -2.0, 0.3).normalize().multiplyScalar(2.1);
    }
    const region = REGIONS.find((r) => r.id === selectedId);
    if (!region) return null;
    return latLonToVec3(region.lat, region.lon, 1).normalize().multiplyScalar(2.05);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

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

// ---------------------------------------------------------------------------
// Sea Ice layer — 3D half-dome meshes at the true poles
// ---------------------------------------------------------------------------

const ICE_BLUE = new THREE.Color("#DCEEFF");
const ICE_EMISSIVE = new THREE.Color("#4A9FD4");

function IceDomeMesh({
  position,
  radius,
  flipY,
  regionId,
  regionName,
  selected,
  onSelect,
}: {
  position: THREE.Vector3;
  radius: number;
  flipY: boolean;
  regionId: string;
  regionName: string;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const geometry = useMemo(
    () =>
      new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.1),
    [radius],
  );

  const material = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: ICE_BLUE,
        emissive: ICE_EMISSIVE,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: selected ? 0.92 : hovered ? 0.88 : 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, hovered],
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pulse = selected ? 1 + Math.sin(clock.elapsedTime * 1.8) * 0.04 : 1;
    meshRef.current.scale.setScalar(pulse);
  });

  const rotation = useMemo(
    () => (flipY ? new THREE.Euler(Math.PI, 0, 0) : new THREE.Euler(0, 0, 0)),
    [flipY],
  );

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        renderOrder={2}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(regionId);
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
      />
      {(hovered || selected) && (
        <Html center distanceFactor={6} zIndexRange={[20, 0]}>
          <div className="pointer-events-none -translate-y-6 whitespace-nowrap rounded-md border border-border bg-popover/95 px-2 py-1 text-[11px] text-popover-foreground shadow-lg">
            {regionName}
          </div>
        </Html>
      )}
    </group>
  );
}

function IceDomes({
  year,
  selectedId,
  onSelect,
}: {
  year: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const i = year - START_YEAR;
  const arcticMax = Math.max(...ARCTIC_SEA_ICE);
  const antarcticMax = Math.max(...ANTARCTIC_SEA_ICE);
  const arcticVal = ARCTIC_SEA_ICE[i] ?? 0;
  const antarcticVal = ANTARCTIC_SEA_ICE[i] ?? 0;

  const arcticRatio = Math.max(0.25, arcticVal / arcticMax);
  const antarcticRatio = Math.max(0.25, antarcticVal / antarcticMax);

  // Raw dome radius in km → scale to three.js globe units (globe radius = 1 = 6371 km)
  const arcticRadius = (4 + 22 * arcticRatio) / 6371;
  const antarcticRadius = (4 + 22 * antarcticRatio) / 6371;

  return (
    <group>
      <IceDomeMesh
        position={new THREE.Vector3(0, EARTH_RADIUS * 1.006, 0)}
        radius={arcticRadius}
        flipY={false}
        regionId="arctic-ocean"
        regionName="Central Arctic Ocean"
        selected={selectedId === "arctic-ocean"}
        onSelect={onSelect}
      />
      <IceDomeMesh
        position={new THREE.Vector3(0, -EARTH_RADIUS * 1.006, 0)}
        radius={antarcticRadius}
        flipY={true}
        regionId="southern-ocean"
        regionName="Southern Ocean"
        selected={selectedId === "southern-ocean"}
        onSelect={onSelect}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// CO2 layer — atmospheric particle cloud + single clickable global marker
// ---------------------------------------------------------------------------

const NUM_PARTICLES = 275;

function co2Color(ppm: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (ppm - 338) / (427 - 338)));
  return new THREE.Color().lerpColors(
    new THREE.Color("#70d3a6"),
    new THREE.Color("#F2A93B"),
    t,
  );
}

function Co2ParticleCloud({ year }: { year: number }) {
  const i = year - START_YEAR;
  const ppm = GLOBAL_CO2[i] ?? GLOBAL_CO2[0]!;

  const particles = useMemo(() => {
    return Array.from({ length: NUM_PARTICLES }, (_, k) => {
      const lat = (seededRand(k * 3 + 1) * 2 - 1) * 70;
      const lng = (seededRand(k * 3 + 2) * 2 - 1) * 180;
      const alt = 0.15 + seededRand(k * 3 + 3) * 0.2;
      return latLonToVec3(lat, lng, EARTH_RADIUS * (1 + alt));
    });
  }, []);

  const color = useMemo(() => co2Color(ppm), [ppm]);

  const particleRefs = useRef<THREE.Mesh[]>([]);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.color.set(color);
    }
    particleRefs.current.forEach((mesh, k) => {
      if (!mesh) return;
      const t = clock.elapsedTime * 0.3 + k * 0.8;
      mesh.scale.setScalar(0.9 + Math.sin(t) * 0.1);
    });
  });

  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  materialRef.current = mat;

  const geo = useMemo(() => new THREE.SphereGeometry(0.007, 6, 6), []);

  return (
    <group>
      {particles.map((pos, k) => (
        <mesh
          key={k}
          ref={(el) => {
            if (el) particleRefs.current[k] = el;
          }}
          position={pos}
          geometry={geo}
          material={mat}
          renderOrder={3}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Sea Level layer — expanding concentric rings + single clickable marker
// ---------------------------------------------------------------------------

const RING_COLOR = new THREE.Color("#3B9FE8");
const NUM_RINGS = 4;

function SeaLevelRings({ year }: { year: number }) {
  const i = year - START_YEAR;
  const rawVal = GLOBAL_SEA_LEVEL[i] ?? GLOBAL_SEA_LEVEL[0]!;
  const val = rawVal + 55; // shift so minimum is ~7
  const maxRadius = (3 + Math.min(12, val / 8)) * 0.01;

  const ringRefs = useRef<THREE.Mesh[]>([]);
  const ringMats = useRef<THREE.MeshBasicMaterial[]>([]);

  const center = useMemo(() => latLonToVec3(0, 0, EARTH_RADIUS * 1.003), []);
  const quaternion = useMemo(() => {
    const normal = center.clone().normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    return q;
  }, [center]);

  // Pre-create ring geometries + materials
  const { geos, mats } = useMemo(() => {
    const geos = Array.from({ length: NUM_RINGS }, () =>
      new THREE.RingGeometry(maxRadius * 0.82, maxRadius, 64),
    );
    const mats = Array.from({ length: NUM_RINGS }, () =>
      new THREE.MeshBasicMaterial({
        color: RING_COLOR,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    ringMats.current = mats;
    return { geos, mats };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxRadius]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ringRefs.current.forEach((mesh, k) => {
      if (!mesh) return;
      const mat = ringMats.current[k];
      if (!mat) return;
      const phase = (t * 0.7 + k / NUM_RINGS) % 1;
      mesh.scale.setScalar(Math.max(0.01, phase));
      mat.opacity = (1 - phase) * 0.55;
    });
  });

  return (
    <group position={center} quaternion={quaternion}>
      {Array.from({ length: NUM_RINGS }, (_, k) => (
        <mesh
          key={k}
          ref={(el) => {
            if (el) ringRefs.current[k] = el;
          }}
          geometry={geos[k]}
          material={mats[k]}
          renderOrder={2}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Shared: small clickable point for CO2 and sea-level global regions
// ---------------------------------------------------------------------------

function GlobalMarker({
  regionId,
  regionName,
  lat,
  lon,
  color,
  layer,
  selected,
  onSelect,
}: {
  regionId: string;
  regionName: string;
  lat: number;
  lon: number;
  color: string;
  layer: LayerId;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const trend = getTrend(regionId, layer);
  const position = useMemo(
    () => latLonToVec3(lat, lon, EARTH_RADIUS * 1.02),
    [lat, lon],
  );

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.15;
    const base = selected ? 1.6 : hovered ? 1.35 : 1;
    ref.current.scale.setScalar(pulse * base);
  });

  if (!trend) return null;

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(regionId);
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
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {(hovered || selected) && (
        <Html center distanceFactor={6} zIndexRange={[20, 0]}>
          <div className="pointer-events-none -translate-y-6 whitespace-nowrap rounded-md border border-border bg-popover/95 px-2 py-1 text-[11px] text-popover-foreground shadow-lg">
            {regionName}
          </div>
        </Html>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Main scene
// ---------------------------------------------------------------------------

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

  // Temperature regions exclude the sealevel-only global marker
  const tempRegions = useMemo(
    () => REGIONS.filter((r) => r.id !== "global-sealevel"),
    [],
  );

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 2.5, 3]} intensity={2.1} color="#fff6e8" />
      <directionalLight position={[-4, -1, -3]} intensity={0.35} color={PALETTE.violet} />

      <Earth lowDetail={lowDetail} />

      {/* ── Temperature: heat-coloured markers ──────────────────────────── */}
      {layer === "temperature" && (
        <>
          {tempRegions.map((region) => (
            <RegionOverlay key={`o-${region.id}`} region={region} layer={layer} year={year} />
          ))}
          {tempRegions.map((region) => (
            <RegionMarker
              key={`m-${region.id}`}
              region={region}
              layer={layer}
              selected={selectedId === region.id}
              onSelect={onSelect}
            />
          ))}
        </>
      )}

      {/* ── Sea Ice: 3D half-dome meshes at the true poles ─────────────── */}
      {layer === "seaice" && (
        <IceDomes year={year} selectedId={selectedId} onSelect={onSelect} />
      )}

      {/* ── CO₂: atmospheric particle cloud + clickable global marker ──── */}
      {layer === "co2" && (
        <>
          <Co2ParticleCloud year={year} />
          <GlobalMarker
            regionId="tropical-pacific"
            regionName="Tropical Pacific (CO₂)"
            lat={0}
            lon={-160}
            color={PALETTE.co2}
            layer="co2"
            selected={selectedId === "tropical-pacific"}
            onSelect={onSelect}
          />
        </>
      )}

      {/* ── Sea Level: expanding rings + clickable global marker ────────── */}
      {layer === "sealevel" && (
        <>
          <SeaLevelRings year={year} />
          <GlobalMarker
            regionId="global-sealevel"
            regionName="Global Ocean"
            lat={0}
            lon={0}
            color="#3B9FE8"
            layer="sealevel"
            selected={selectedId === "global-sealevel"}
            onSelect={onSelect}
          />
        </>
      )}

      <CameraRig selectedId={selectedId} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.5}
        minDistance={lowDetail ? 2.3 : 1.75}
        maxDistance={4.5}
        autoRotate={!selectedId}
        autoRotateSpeed={0.3}
      />
    </>
  );
}
