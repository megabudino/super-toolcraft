import * as THREE from "three";

import type { HeroParams } from "../domain/hero-params";

const PROFILE_SEGMENTS_PER_CORNER = 8;
export const RIB_PROFILE_POINT_COUNT = 4 * (PROFILE_SEGMENTS_PER_CORNER + 1);

export function getRibSweepSteps(count: number): number {
  return count > 250 ? 80 : 120;
}

function roundedProfile(width: number, depth: number, corner: number) {
  const radius = Math.min(width, depth) * corner;
  const cx = width / 2 - radius;
  const cy = depth / 2 - radius;
  const corners = [
    [cx, cy, 0],
    [-cx, cy, Math.PI / 2],
    [-cx, -cy, Math.PI],
    [cx, -cy, (3 * Math.PI) / 2],
  ] as const;
  const points: Array<readonly [number, number]> = [];
  for (const [originX, originY, startAngle] of corners) {
    for (let index = 0; index <= PROFILE_SEGMENTS_PER_CORNER; index += 1) {
      const angle = startAngle + (index / PROFILE_SEGMENTS_PER_CORNER) * (Math.PI / 2);
      points.push([
        (originX + radius * Math.cos(angle)) / width,
        (originY + radius * Math.sin(angle)) / depth,
      ]);
    }
  }
  return points;
}

function smoothstep(value: number, lower: number, upper: number): number {
  if (upper <= lower) return value < lower ? 0 : 1;
  const normalized = Math.min(1, Math.max(0, (value - lower) / (upper - lower)));
  return normalized * normalized * (3 - 2 * normalized);
}

function setCurvePoint(
  target: THREE.Vector3,
  params: HeroParams,
  ribX: number,
  radius: number,
  t: number,
): THREE.Vector3 {
  const arc = params.structure.arc;
  const angle = THREE.MathUtils.degToRad(arc[0] + (arc[1] - arc[0]) * t);
  const y = radius * Math.cos(angle);
  const z = radius * Math.sin(angle);
  return target.set(ribX, y, z);
}

export function buildRibs(params: HeroParams): THREE.BufferGeometry {
  const authoredCount = Math.max(1, Math.round(params.structure.count));
  const count = authoredCount + 1;
  const steps = getRibSweepSteps(authoredCount);
  const profile = roundedProfile(params.rib.width, params.rib.depth, params.rib.corner);
  const ringSize = profile.length;
  const verticesPerRib = (steps + 1) * ringSize;
  const positions = new Float32Array(count * verticesPerRib * 3);
  const ribXs = new Float32Array(count * verticesPerRib);
  const deforms = new Float32Array(count * verticesPerRib);
  const ribCenters = new Float32Array(count * verticesPerRib * 2);
  const indices = new Uint32Array(count * steps * ringSize * 6);
  const axis = new THREE.Vector3(1, 0, 0);
  const point = new THREE.Vector3();
  const before = new THREE.Vector3();
  const after = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const widthAxis = new THREE.Vector3();
  const normalAxis = new THREE.Vector3();
  const x0 = (-params.structure.spacing * (authoredCount - 1)) / 2 + params.structure.xShift;
  let positionOffset = 0;
  let attributeOffset = 0;
  let indexOffset = 0;

  for (let ribIndex = 0; ribIndex < count; ribIndex += 1) {
    // Append one guard, keeping every authored rib and its normals unchanged.
    const ribX = x0 + (ribIndex === authoredCount ? -1 : ribIndex) * params.structure.spacing;
    const normalizedDomeX = ribX / Math.max(0.001, params.structure.domeLength);
    const radius =
      params.structure.shape === "dome"
        ? params.structure.radius *
          Math.sqrt(Math.max(params.structure.domeMinimum ** 2, 1 - normalizedDomeX ** 2))
        : params.structure.radius;
    const vertexBase = ribIndex * verticesPerRib;

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const previousT = Math.max(0, t - 1 / steps / 4);
      const nextT = Math.min(1, t + 1 / steps / 4);
      setCurvePoint(point, params, ribX, radius, t);
      setCurvePoint(before, params, ribX, radius, previousT);
      setCurvePoint(after, params, ribX, radius, nextT);
      tangent.subVectors(after, before).normalize();
      widthAxis.copy(axis).addScaledVector(tangent, -axis.dot(tangent));
      if (widthAxis.lengthSq() < 1e-8) widthAxis.set(1, 0, 0);
      widthAxis.normalize();
      normalAxis.crossVectors(widthAxis, tangent).normalize();
      const taperT = params.rib.taperSide === "end" ? t : 1 - t;
      const taper = 1 - (1 - params.rib.taperTip) * smoothstep(taperT, params.rib.taperStart, 1);

      for (const [profileX, profileY] of profile) {
        positions[positionOffset] =
          point.x +
          widthAxis.x * profileX * params.rib.width * taper +
          normalAxis.x * profileY * params.rib.depth * taper;
        positions[positionOffset + 1] =
          point.y +
          widthAxis.y * profileX * params.rib.width * taper +
          normalAxis.y * profileY * params.rib.depth * taper;
        positions[positionOffset + 2] =
          point.z +
          widthAxis.z * profileX * params.rib.width * taper +
          normalAxis.z * profileY * params.rib.depth * taper;
        ribXs[attributeOffset] = ribX;
        deforms[attributeOffset] = 1;
        ribCenters[attributeOffset * 2] = point.y;
        ribCenters[attributeOffset * 2 + 1] = point.z;
        positionOffset += 3;
        attributeOffset += 1;
      }
    }

    for (let step = 0; step < steps; step += 1) {
      for (let profileIndex = 0; profileIndex < ringSize; profileIndex += 1) {
        const nextProfile = (profileIndex + 1) % ringSize;
        const a = vertexBase + step * ringSize + profileIndex;
        const b = vertexBase + step * ringSize + nextProfile;
        const c = vertexBase + (step + 1) * ringSize + profileIndex;
        const d = vertexBase + (step + 1) * ringSize + nextProfile;
        indices[indexOffset] = a;
        indices[indexOffset + 1] = c;
        indices[indexOffset + 2] = b;
        indices[indexOffset + 3] = b;
        indices[indexOffset + 4] = c;
        indices[indexOffset + 5] = d;
        indexOffset += 6;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRibX", new THREE.BufferAttribute(ribXs, 1));
  geometry.setAttribute("aRibCenter", new THREE.BufferAttribute(ribCenters, 2));
  geometry.setAttribute("aDeform", new THREE.BufferAttribute(deforms, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
