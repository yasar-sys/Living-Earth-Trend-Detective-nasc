import * as THREE from "three";

/**
 * Converts latitude/longitude to a position on a sphere using the same
 * convention as three.js SphereGeometry's equirectangular UV mapping, so
 * markers land on the right place on the NASA Blue Marble texture.
 */
export function latLonToVec3(lat: number, lon: number, radius = 1): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}
