import { Color, Quaternion, Vector3 } from "three";

import {
  DONUT_GEOMETRY,
  DONUT_SPRINKLE_PALETTES,
} from "./donut-reference";
import {
  getDonutIcingTubeRange,
  sampleDonutIcingSurface,
  type DonutIcingGeometryOptions,
  type DonutIcingSurfaceSample,
} from "./donut-icing-geometry";
import { createDonutRandom } from "./donut-random";
import type {
  DonutSettings,
  DonutSprinkleInstance,
  DonutSprinklePalette,
  DonutSprinkleShape,
} from "./donut-types";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const LOCAL_LONG_AXIS = new Vector3(0, 1, 0);
export const DONUT_SPRINKLE_SUPPORT_RATIO = 0.82;

function colorFor(
  palette: DonutSprinklePalette,
  solidColor: string,
  random: number,
): string {
  if (palette === 1) return solidColor;
  if (palette === 4) {
    const saturation = 0.78 + ((random * 7.31) % 1) * 0.18;
    const lightness = 0.47 + ((random * 13.7) % 1) * 0.1;
    return `#${new Color()
      .setHSL(random, saturation, lightness)
      .getHexString()
      .toUpperCase()}`;
  }
  const colors = DONUT_SPRINKLE_PALETTES[palette];
  return colors[Math.floor(random * colors.length) % colors.length] ?? colors[0]!;
}

export type DonutSprinkleBody = {
  anchor: Vector3;
  conform?: (body: DonutSprinkleBody) => void;
  footprint: number;
  normal: Vector3;
  position: Vector3;
};

export function relaxDonutSprinkleBodies(
  bodies: readonly DonutSprinkleBody[],
): void {
  const separation = new Vector3();
  const sharedNormal = new Vector3();
  const fallback = new Vector3();
  const anchorDisplacement = new Vector3();
  for (let iteration = 0; iteration < 4; iteration += 1) {
    for (let a = 0; a < bodies.length; a += 1) {
      const first = bodies[a]!;
      for (let b = a + 1; b < bodies.length; b += 1) {
        const second = bodies[b]!;
        separation.copy(first.position).sub(second.position);
        const distance = separation.length();
        const minimum = 0.36 * (first.footprint + second.footprint);
        if (distance >= minimum) continue;
        const overlap = minimum - distance;
        sharedNormal.copy(first.normal).add(second.normal).normalize();
        const lift = separation.dot(sharedNormal);
        separation.addScaledVector(sharedNormal, -lift);
        if (separation.lengthSq() <= 1e-9) {
          fallback.set(-sharedNormal.z, 0, sharedNormal.x);
          if (fallback.lengthSq() <= 1e-9) fallback.set(1, 0, 0);
          separation.copy(fallback);
        }
        separation.normalize().multiplyScalar(overlap * 0.35);
        first.position.add(separation);
        second.position.sub(separation);
      }
    }
    for (const body of bodies) {
      if (body.conform) {
        body.conform(body);
      } else {
        const normalDisplacement = anchorDisplacement
          .copy(body.position)
          .sub(body.anchor)
          .dot(body.normal);
        body.position.addScaledVector(body.normal, -normalDisplacement);
      }
    }
  }
}

function scaleFor(
  shape: DonutSprinkleShape,
  authoredScale: number,
  variation: number,
  variationAmount: number,
): readonly [number, number, number] {
  const multiplier =
    (authoredScale / 0.5) *
    (1 + (variation - 0.5) * 0.34 * variationAmount);
  switch (shape) {
    case 1:
      return [0.075 * multiplier, 0.13 * multiplier, 0.075 * multiplier];
    case 2:
      return [0.09 * multiplier, 0.09 * multiplier, 0.09 * multiplier];
    case 3:
      return [0.065 * multiplier, 0.24 * multiplier, 0.065 * multiplier];
  }
}

function tuple3(vector: Vector3): readonly [number, number, number] {
  return [vector.x, vector.y, vector.z];
}

function tuple4(
  quaternion: Quaternion,
): readonly [number, number, number, number] {
  return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
}

type DonutSprinkleSurfaceState = {
  maximumTubeAngle: number;
  minimumTubeAngle: number;
  sample: DonutIcingSurfaceSample;
  supportOffset: number;
  theta: number;
  tubeAngle: number;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function conformBodyToIcing(
  body: DonutSprinkleBody,
  state: DonutSprinkleSurfaceState,
  options: DonutIcingGeometryOptions,
): void {
  const displacement = body.position.clone().sub(body.anchor);
  const ringTangent = state.sample.ringTangent;
  const tubeTangent = state.sample.tubeTangent;
  const ringLengthSquared = ringTangent.lengthSq();
  const tubeLengthSquared = tubeTangent.lengthSq();
  const crossTerm = ringTangent.dot(tubeTangent);
  const determinant =
    ringLengthSquared * tubeLengthSquared - crossTerm * crossTerm;

  if (determinant > 1e-9) {
    const ringProjection = displacement.dot(ringTangent);
    const tubeProjection = displacement.dot(tubeTangent);
    const thetaDelta =
      (ringProjection * tubeLengthSquared -
        tubeProjection * crossTerm) /
      determinant;
    const tubeDelta =
      (tubeProjection * ringLengthSquared -
        ringProjection * crossTerm) /
      determinant;
    state.theta += clamp(thetaDelta, -0.12, 0.12);
    state.tubeAngle = clamp(
      state.tubeAngle + clamp(tubeDelta, -0.12, 0.12),
      state.minimumTubeAngle,
      state.maximumTubeAngle,
    );
  }

  state.sample = sampleDonutIcingSurface(
    options,
    state.theta,
    state.tubeAngle,
  );
  body.normal.copy(state.sample.normal);
  body.anchor
    .copy(state.sample.position)
    .addScaledVector(state.sample.normal, state.supportOffset);
  body.position.copy(body.anchor);
}

export function createDonutSprinkleLayout(
  settings: DonutSettings,
): readonly DonutSprinkleInstance[] {
  const sprinkles = settings.sprinkles;
  if (sprinkles.clear || sprinkles.flow <= 0) return [];

  const count = Math.min(
    DONUT_GEOMETRY.sprinkleMaxCount,
    Math.max(
      0,
      Math.round(DONUT_GEOMETRY.sprinkleReferenceCount * sprinkles.flow),
    ),
  );
  const random = createDonutRandom(0x44f6a11 ^ sprinkles.seed);
  const coverageHalfAngle = Math.PI * 0.38 * sprinkles.coverage;
  const icingOptions = {
    detail: settings.icing.clearMode !== "detail",
    donut: settings.donut,
    icing: settings.icing,
  } as const;
  const [tubeStart, tubeEnd] = getDonutIcingTubeRange(settings.icing);
  const edgeInset =
    (tubeEnd - tubeStart) / DONUT_GEOMETRY.icingTubeSegments;
  const requestedMinimum = Math.PI * 0.5 - coverageHalfAngle;
  const requestedMaximum = Math.PI * 0.5 + coverageHalfAngle;
  let minimumTubeAngle = Math.max(tubeStart + edgeInset, requestedMinimum);
  let maximumTubeAngle = Math.min(tubeEnd - edgeInset, requestedMaximum);
  if (maximumTubeAngle < minimumTubeAngle) {
    const crown = clamp(Math.PI * 0.5, tubeStart, tubeEnd);
    minimumTubeAngle = crown;
    maximumTubeAngle = crown;
  }
  const bodies: DonutSprinkleBody[] = [];
  const colors: string[] = [];
  const scales: (readonly [number, number, number])[] = [];
  const surfaceStates: DonutSprinkleSurfaceState[] = [];
  const tangentAngles: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const jitter = random();
    const theta = index * GOLDEN_ANGLE + (jitter - 0.5) * 0.28;
    const tubeAngle =
      minimumTubeAngle +
      (maximumTubeAngle - minimumTubeAngle) * random();
    const tangentAngle =
      (random() - 0.5) * Math.PI * 2 * sprinkles.rotation;
    const scale = scaleFor(
      sprinkles.shape,
      sprinkles.scale,
      random(),
      sprinkles.sizeVariation,
    );
    const transverseRadius = Math.max(scale[0], scale[2]) * 0.5;
    const supportOffset =
      transverseRadius * DONUT_SPRINKLE_SUPPORT_RATIO +
      sprinkles.surfaceOffset;
    const surfaceState: DonutSprinkleSurfaceState = {
      maximumTubeAngle,
      minimumTubeAngle,
      sample: sampleDonutIcingSurface(icingOptions, theta, tubeAngle),
      supportOffset,
      theta,
      tubeAngle,
    };
    const position = surfaceState.sample.position
      .clone()
      .addScaledVector(surfaceState.sample.normal, supportOffset);
    colors.push(colorFor(sprinkles.palette, sprinkles.solidColor, random()));
    scales.push(scale);
    surfaceStates.push(surfaceState);
    tangentAngles.push(tangentAngle);
    bodies.push({
      anchor: position.clone(),
      conform: (body) =>
        conformBodyToIcing(body, surfaceState, icingOptions),
      footprint: Math.max(scale[0], scale[1], scale[2]),
      normal: surfaceState.sample.normal.clone(),
      position,
    });
  }

  relaxDonutSprinkleBodies(bodies);

  return bodies.map((body, index) => {
    const surface = surfaceStates[index]!.sample;
    const tangentAngle = tangentAngles[index]!;
    const ringDirection = surface.ringTangent.clone().normalize();
    const tubeDirection = surface.tubeTangent.clone().normalize();
    const tangent = ringDirection
      .clone()
      .multiplyScalar(Math.cos(tangentAngle))
      .addScaledVector(tubeDirection, Math.sin(tangentAngle));
    tangent.addScaledVector(body.normal, -tangent.dot(body.normal)).normalize();
    const quaternion = new Quaternion().setFromUnitVectors(
      LOCAL_LONG_AXIS,
      tangent,
    );
    return {
      color: colors[index]!,
      index,
      normal: tuple3(body.normal),
      position: tuple3(body.position),
      quaternion: tuple4(quaternion),
      scale: scales[index]!,
      surfacePosition: tuple3(surface.position),
    };
  });
}
