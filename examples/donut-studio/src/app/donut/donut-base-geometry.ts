import type { BufferAttribute, BufferGeometry } from "three";

import { DONUT_GEOMETRY } from "./donut-reference";
import type { DonutSettings } from "./donut-types";

type DonutShapeSettings = DonutSettings["donut"];

export type DonutBaseGeometryController = Readonly<{
  update: (settings: DonutShapeSettings) => void;
}>;

export function deformDonutBasePositions(
  source: ArrayLike<number>,
  output: { [index: number]: number; length: number },
  settings: DonutShapeSettings,
): void {
  const [centerX, centerY, centerZ] = DONUT_GEOMETRY.center;
  const referenceMajor = DONUT_GEOMETRY.icingMajorRadius;
  for (let index = 0; index < source.length; index += 3) {
    const sourceX = Number(source[index]);
    const sourceY = Number(source[index + 1]);
    const sourceZ = Number(source[index + 2]);
    const localX = sourceX - centerX;
    const localZ = sourceZ - centerZ;
    const radius = Math.max(1e-5, Math.hypot(localX, localZ));
    const angle = Math.atan2(localZ, localX);
    const radialOffset = radius - referenceMajor;
    const organicDelta =
      (settings.organic - 1) *
      (Math.sin(angle * 5 + 0.37) * 0.018 +
        Math.sin(angle * 11 - 0.82) * 0.008);
    const nextRadius =
      referenceMajor * settings.majorRadius +
      radialOffset * settings.thickness +
      organicDelta;
    output[index] = centerX + (localX / radius) * nextRadius;
    output[index + 1] =
      centerY +
      (sourceY - centerY) * settings.thickness * settings.height +
      organicDelta * 0.45;
    output[index + 2] = centerZ + (localZ / radius) * nextRadius;
  }
}

export function createDonutBaseGeometryController(
  geometry: BufferGeometry,
): DonutBaseGeometryController {
  const position = geometry.getAttribute("position") as BufferAttribute;
  const source = Float32Array.from(position.array as ArrayLike<number>);
  return Object.freeze({
    update: (settings: DonutShapeSettings) => {
      deformDonutBasePositions(
        source,
        position.array as unknown as { [index: number]: number; length: number },
        settings,
      );
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    },
  });
}
