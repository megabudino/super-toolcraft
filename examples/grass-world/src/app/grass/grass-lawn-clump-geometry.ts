import * as THREE from "three";

import { getGrassCoverageCellSize } from "./grass-coverage-policy";
import type { GrassLayout } from "./grass-layout";

export const GRASS_LAWN_BLADES_PER_CLUMP = 6;

const detailedLocalBlades = [
  {
    angle: 0.18,
    height: 1,
    phase: 0,
    restTilt: 0.02,
    root: [0, 0],
    stiffness: 0.9,
  },
  {
    angle: 1.22,
    height: 0.82,
    phase: 0.93,
    restTilt: -0.05,
    root: [0.58, 0.08],
    stiffness: 1.15,
  },
  {
    angle: 2.34,
    height: 1.12,
    phase: 1.77,
    restTilt: 0.07,
    root: [-0.45, 0.36],
    stiffness: 0.78,
  },
  {
    angle: 3.51,
    height: 0.72,
    phase: 2.81,
    restTilt: -0.03,
    root: [0.18, -0.58],
    stiffness: 1.25,
  },
  {
    angle: 4.48,
    height: 0.94,
    phase: 3.69,
    restTilt: 0.04,
    root: [-0.56, -0.32],
    stiffness: 0.96,
  },
  {
    angle: 5.62,
    height: 0.78,
    phase: 4.57,
    restTilt: -0.07,
    root: [0.48, 0.46],
    stiffness: 1.08,
  },
] as const;

const lightweightLocalBlades = [
  {
    angle: 0.18,
    height: 1,
    phase: 0,
    restTilt: 0.02,
    root: [-0.48, -0.22],
    stiffness: 0.9,
  },
  {
    angle: 1.22,
    height: 0.82,
    phase: 0.93,
    restTilt: -0.05,
    root: [0.58, 0.08],
    stiffness: 1.15,
  },
  {
    angle: 2.34,
    height: 1.08,
    phase: 1.77,
    restTilt: 0.07,
    root: [0.03, 0.5],
    stiffness: 0.78,
  },
  {
    angle: 3.51,
    height: 0.72,
    phase: 2.81,
    restTilt: -0.03,
    root: [0.18, -0.58],
    stiffness: 1.25,
  },
  {
    angle: 4.48,
    height: 0.9,
    phase: 3.69,
    restTilt: 0.04,
    root: [0.5, -0.2],
    stiffness: 0.96,
  },
  {
    angle: 5.62,
    height: 0.78,
    phase: 4.57,
    restTilt: -0.07,
    root: [-0.42, 0.42],
    stiffness: 1.08,
  },
] as const;

function addInstanceAttribute(
  geometry: THREE.InstancedBufferGeometry,
  name: string,
  source: Float32Array,
  itemSize: number,
  start: number,
  count: number,
): void {
  geometry.setAttribute(
    name,
    new THREE.InstancedBufferAttribute(
      source.slice(start * itemSize, (start + count) * itemSize),
      itemSize,
    ),
  );
}

export function getGrassLawnClumpCount(equivalentBladeCount: number): number {
  return Math.ceil(
    Math.max(0, Math.floor(equivalentBladeCount)) / GRASS_LAWN_BLADES_PER_CLUMP,
  );
}

export function createGrassLawnClumpGeometry(
  layout: GrassLayout,
  options: Readonly<{
    clumpCount?: number;
    fieldArea?: number;
    quality?: "detailed" | "lightweight";
    startClump?: number;
  }> = {},
): THREE.InstancedBufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const localRoots: number[] = [];
  const localAngles: number[] = [];
  const localHeights: number[] = [];
  const localPhases: number[] = [];
  const localRestTilts: number[] = [];
  const localStiffness: number[] = [];

  const localBlades =
    options.quality === "lightweight"
      ? lightweightLocalBlades
      : detailedLocalBlades;
  for (const blade of localBlades) {
    const baseVertex = positions.length / 3;
    for (const [side, height] of [
      [-0.5, 0],
      [0.5, 0],
      [-0.5, 1],
      [0.5, 1],
    ] as const) {
      positions.push(side, height, 0);
      localRoots.push(blade.root[0], blade.root[1]);
      localAngles.push(blade.angle);
      localHeights.push(blade.height);
      localPhases.push(blade.phase);
      localRestTilts.push(blade.restTilt);
      localStiffness.push(blade.stiffness);
    }
    indices.push(
      baseVertex,
      baseVertex + 1,
      baseVertex + 2,
      baseVertex + 2,
      baseVertex + 1,
      baseVertex + 3,
    );
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "aLocalRoot",
    new THREE.Float32BufferAttribute(localRoots, 2),
  );
  geometry.setAttribute(
    "aLocalAngle",
    new THREE.Float32BufferAttribute(localAngles, 1),
  );
  geometry.setAttribute(
    "aLocalHeightScale",
    new THREE.Float32BufferAttribute(localHeights, 1),
  );
  geometry.setAttribute(
    "aLocalPhase",
    new THREE.Float32BufferAttribute(localPhases, 1),
  );
  geometry.setAttribute(
    "aLocalRestTilt",
    new THREE.Float32BufferAttribute(localRestTilts, 1),
  );
  geometry.setAttribute(
    "aLocalStiffness",
    new THREE.Float32BufferAttribute(localStiffness, 1),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const totalClumps = getGrassLawnClumpCount(layout.count);
  const startClump = Math.max(
    0,
    Math.min(totalClumps, Math.floor(options.startClump ?? 0)),
  );
  const clumpCount = Math.max(
    0,
    Math.min(
      totalClumps - startClump,
      Math.floor(options.clumpCount ?? totalClumps - startClump),
    ),
  );
  addInstanceAttribute(
    geometry,
    "aOffset",
    layout.offsets,
    3,
    startClump,
    clumpCount,
  );
  addInstanceAttribute(
    geometry,
    "aHeight",
    layout.heights,
    1,
    startClump,
    clumpCount,
  );
  addInstanceAttribute(
    geometry,
    "aAngle",
    layout.angles,
    1,
    startClump,
    clumpCount,
  );
  addInstanceAttribute(
    geometry,
    "aPhase",
    layout.phases,
    1,
    startClump,
    clumpCount,
  );
  addInstanceAttribute(
    geometry,
    "aSlope",
    layout.slopes,
    2,
    startClump,
    clumpCount,
  );
  addInstanceAttribute(
    geometry,
    "aVisibility",
    layout.visibility,
    1,
    startClump,
    clumpCount,
  );
  const fieldArea = Math.max(0.001, options.fieldArea ?? 1);
  const cellSize = getGrassCoverageCellSize(fieldArea, totalClumps);
  const clumpScales = new Float32Array(clumpCount);
  clumpScales.fill(cellSize * 0.82);
  geometry.setAttribute(
    "aClumpScale",
    new THREE.InstancedBufferAttribute(clumpScales, 1),
  );
  geometry.instanceCount = clumpCount;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 64);
  return geometry;
}
