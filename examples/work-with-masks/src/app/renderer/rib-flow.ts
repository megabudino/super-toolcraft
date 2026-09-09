import * as THREE from "three";

import type { HeroParams } from "../domain/hero-params";

export function flowTravelOffset(travel: number, spacing: number): number {
  const pitches = travel / Math.max(0.001, spacing);
  const phase = pitches - Math.floor(pitches);
  return phase < 1e-10 || 1 - phase < 1e-10 ? 0 : phase * spacing;
}

export function domeRadius(params: HeroParams, x: number): number {
  if (params.structure.shape !== "dome") return params.structure.radius;
  const ratio = x / Math.max(0.001, params.structure.domeLength);
  return params.structure.radius * Math.sqrt(Math.max(params.structure.domeMinimum ** 2, 1 - ratio ** 2));
}

// CPU counterpart of the transport before the existing wave/twist shader.
// Only the centreline radius changes; the authored bead profile stays intact.
export function flowRibVertex(
  position: THREE.Vector3,
  center: THREE.Vector2,
  ribX: number,
  params: HeroParams,
  travel: number,
): THREE.Vector3 {
  const scale = domeRadius(params, ribX + travel) / Math.max(0.001, domeRadius(params, ribX));
  return new THREE.Vector3(
    position.x + travel,
    center.x * scale + (position.y - center.x),
    center.y * scale + (position.z - center.y),
  );
}
