import * as THREE from "three";

import {
  getGrassFieldPoint,
  getGrassFieldRelativeDistance,
  getGrassFieldShapeSettings,
} from "./grass-field-shape";
import type { GrassLayout } from "./grass-layout";
import { getGrassReferenceSurfaceHeight } from "./grass-reference-composition";
import { getGrassSurfaceBendOffset } from "./grass-surface-bend";
import type { GrassSettings } from "./grass-values";

export function createGrassBladeGeometry(
  layout: GrassLayout,
  resolution: number,
  use3d: boolean,
): THREE.InstancedBufferGeometry {
  const planes = use3d ? 2 : 1;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let plane = 0; plane < planes; plane += 1) {
    const baseVertex = positions.length / 3;
    for (let segment = 0; segment <= resolution; segment += 1) {
      const t = segment / resolution;
      for (const side of [-0.5, 0.5]) {
        if (plane === 0) positions.push(side, t, 0);
        else positions.push(0, t, side);
      }
    }
    for (let segment = 0; segment < resolution; segment += 1) {
      const offset = baseVertex + segment * 2;
      indices.push(
        offset,
        offset + 1,
        offset + 2,
        offset + 2,
        offset + 1,
        offset + 3,
      );
    }
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.setAttribute(
    "aOffset",
    new THREE.InstancedBufferAttribute(layout.offsets, 3),
  );
  geometry.setAttribute(
    "aHeight",
    new THREE.InstancedBufferAttribute(layout.heights, 1),
  );
  geometry.setAttribute(
    "aAngle",
    new THREE.InstancedBufferAttribute(layout.angles, 1),
  );
  geometry.setAttribute(
    "aPhase",
    new THREE.InstancedBufferAttribute(layout.phases, 1),
  );
  geometry.setAttribute(
    "aSlope",
    new THREE.InstancedBufferAttribute(layout.slopes, 2),
  );
  geometry.setAttribute(
    "aVisibility",
    new THREE.InstancedBufferAttribute(layout.visibility, 1),
  );
  geometry.instanceCount = layout.count;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 64);
  return geometry;
}

export function createGrassGroundGeometry(
  settings: GrassSettings,
): THREE.PlaneGeometry {
  const widthSegments = Math.max(
    72,
    Math.min(192, Math.round(settings.field.width * 10)),
  );
  const depthSegments = Math.max(
    56,
    Math.min(160, Math.round(settings.field.depth * 10)),
  );
  const geometry = new THREE.PlaneGeometry(
    settings.field.width,
    settings.field.depth,
    widthSegments,
    depthSegments,
  );
  geometry.rotateX(-Math.PI / 2);
  const fieldShape = getGrassFieldShapeSettings(settings);
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let index = 0; index < positions.count; index += 1) {
    const [x, z] = getGrassFieldPoint(
      positions.getX(index) / settings.field.width + 0.5,
      positions.getZ(index) / settings.field.depth + 0.5,
      fieldShape,
    );
    positions.setX(index, x);
    positions.setZ(index, z);
    const surfaceHeight =
      getGrassReferenceSurfaceHeight(x, z, settings) - 0.012;
    const bendOffset = getGrassSurfaceBendOffset(
      getGrassFieldRelativeDistance(x, z, fieldShape),
      settings.surface.bend,
    );
    positions.setY(index, surfaceHeight + bendOffset);
  }
  positions.needsUpdate = true;
  const uv = geometry.getAttribute("uv");
  if (uv) geometry.setAttribute("uv1", uv.clone());
  geometry.computeVertexNormals();
  return geometry;
}
