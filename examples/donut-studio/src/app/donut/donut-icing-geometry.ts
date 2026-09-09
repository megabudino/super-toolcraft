import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint32BufferAttribute,
  Vector3,
} from "three";

import { DONUT_GEOMETRY } from "./donut-reference";
import type { DonutSettings } from "./donut-types";

export type DonutIcingGeometryOptions = Readonly<{
  detail: boolean;
  donut: DonutSettings["donut"];
  icing: DonutSettings["icing"];
}>;

export type DonutIcingSurfaceSample = Readonly<{
  normal: Vector3;
  position: Vector3;
  ringTangent: Vector3;
  tubeTangent: Vector3;
}>;

const TAU = Math.PI * 2;
const TUBE_START = -Math.PI * 0.03;

export function createDonutIcingSurfaceSignature(
  { detail, donut, icing }: DonutIcingGeometryOptions,
): string {
  return JSON.stringify({
    detail,
    donut,
    icing: {
      coverage: icing.coverage,
      detail: icing.detail,
      dripAmount: icing.dripAmount,
      dripFrequency: icing.dripFrequency,
      flow: icing.flow,
      thickness: icing.thickness,
    },
  });
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const bounded = clamp01(value);
  return bounded * bounded * (3 - 2 * bounded);
}

function deterministicUnit(index: number, salt: number): number {
  const value = Math.sin(index * 91.733 + salt * 37.719) * 43_758.5453;
  return value - Math.floor(value);
}

function periodicDistance(a: number, b: number): number {
  const direct = Math.abs(a - b) % TAU;
  return Math.min(direct, TAU - direct);
}

function viscousFlowDepth(
  theta: number,
  frequency: number,
  flow: number,
  detail: number,
): number {
  if (flow <= 0) return 0;

  const flow01 = clamp01(flow / 2);
  const lobeCount = Math.max(5, Math.round(5 + frequency * 6));
  const spacing = TAU / lobeCount;
  let primary = 0;

  for (let index = 0; index < lobeCount; index += 1) {
    const centerJitter = (deterministicUnit(index, 1.7) - 0.5) * spacing * 0.34;
    const center = (index + 0.5) * spacing + centerJitter;
    const widthJitter = deterministicUnit(index, 4.1) * 0.1;
    const width = spacing * (0.63 + flow01 * 0.2 + widthJitter);
    const distance = periodicDistance(theta, center);
    const bell =
      distance < width
        ? 0.5 + 0.5 * Math.cos((distance / width) * Math.PI)
        : 0;
    const amplitude = 0.68 + deterministicUnit(index, 8.9) * 0.34;
    primary = Math.max(primary, bell * amplitude);
  }

  const secondary =
    0.5 +
    0.25 * Math.sin(theta * lobeCount * 0.5 + 0.71) +
    0.25 * Math.sin(theta * lobeCount + 2.13);
  const flowGain = 0.28 + flow * 0.58;
  return (
    flowGain *
    (0.075 + primary * 0.265 + clamp01(secondary) * detail * 0.022)
  );
}

export function getDonutIcingTubeRange(
  icing: DonutSettings["icing"],
): readonly [number, number] {
  return [TUBE_START, TUBE_START + Math.PI * 1.06 * icing.coverage];
}

function sampleDonutIcingPosition(
  { detail, donut, icing }: DonutIcingGeometryOptions,
  theta: number,
  tubeAngle: number,
  target: Vector3,
): Vector3 {
  const [centerX, centerY, centerZ] = DONUT_GEOMETRY.center;
  const [tubeStart, tubeEnd] = getDonutIcingTubeRange(icing);
  const v = clamp01((tubeAngle - tubeStart) / (tubeEnd - tubeStart));
  const phi = tubeStart + (tubeEnd - tubeStart) * v;
  const detailAmount = detail ? icing.detail * donut.organic : 0;
  const radialNoise = detail
    ? 0.018 * Math.sin(theta * 7 + 0.3) +
      0.009 * Math.sin(theta * 13 - 0.7)
    : 0;
  const drip = detail
    ? viscousFlowDepth(
        theta,
        icing.dripFrequency,
        icing.flow,
        icing.detail,
      ) * icing.dripAmount
    : 0;
  const crownMask = Math.sin(Math.PI * v) ** 2;
  const organic = detail
    ? 0.012 *
      Math.sin(theta * 9 + v * Math.PI * 5) *
      crownMask *
      detailAmount
    : 0;
  const rimLip =
    (1 - smoothstep(v / 0.055)) ** 1.5 +
    (1 - smoothstep((1 - v) / 0.055)) ** 1.5;
  const rimTuck = 1 - 0.105 * Math.min(1, rimLip);
  const minorRadius =
    (DONUT_GEOMETRY.icingMinorRadius *
      donut.thickness *
      icing.thickness +
      radialNoise * crownMask * detailAmount +
      organic) *
    rimTuck;
  const radial =
    DONUT_GEOMETRY.icingMajorRadius * donut.majorRadius +
    minorRadius * Math.cos(phi);
  const dripFalloff = (1 - smoothstep(v / 0.58)) ** 1.18;
  const flowBulge =
    drip *
    dripFalloff *
    (0.035 + clamp01(icing.flow / 2) * 0.045);
  const flowedRadial = radial + flowBulge;

  return target.set(
    centerX + Math.cos(theta) * flowedRadial,
    centerY +
      0.18 +
      minorRadius * Math.sin(phi) * donut.height -
      drip * dripFalloff,
    centerZ + Math.sin(theta) * flowedRadial,
  );
}

export function sampleDonutIcingSurface(
  options: DonutIcingGeometryOptions,
  theta: number,
  tubeAngle: number,
): DonutIcingSurfaceSample {
  const [tubeStart, tubeEnd] = getDonutIcingTubeRange(options.icing);
  const boundedTubeAngle = Math.max(
    tubeStart,
    Math.min(tubeEnd, tubeAngle),
  );
  const ringStep = Math.PI / DONUT_GEOMETRY.icingRingSegments;
  const tubeStep =
    (tubeEnd - tubeStart) / (DONUT_GEOMETRY.icingTubeSegments * 2);
  const tubeBefore = Math.max(tubeStart, boundedTubeAngle - tubeStep);
  const tubeAfter = Math.min(tubeEnd, boundedTubeAngle + tubeStep);
  const position = sampleDonutIcingPosition(
    options,
    theta,
    boundedTubeAngle,
    new Vector3(),
  );
  const ringBefore = sampleDonutIcingPosition(
    options,
    theta - ringStep,
    boundedTubeAngle,
    new Vector3(),
  );
  const ringAfter = sampleDonutIcingPosition(
    options,
    theta + ringStep,
    boundedTubeAngle,
    new Vector3(),
  );
  const tubeBeforePosition = sampleDonutIcingPosition(
    options,
    theta,
    tubeBefore,
    new Vector3(),
  );
  const tubeAfterPosition = sampleDonutIcingPosition(
    options,
    theta,
    tubeAfter,
    new Vector3(),
  );
  const ringTangent = ringAfter
    .sub(ringBefore)
    .multiplyScalar(1 / (ringStep * 2));
  const tubeTangent = tubeAfterPosition
    .sub(tubeBeforePosition)
    .multiplyScalar(1 / Math.max(1e-6, tubeAfter - tubeBefore));
  const normal = new Vector3()
    .crossVectors(tubeTangent, ringTangent)
    .normalize();
  const expectedOutward = new Vector3(
    Math.cos(theta) * Math.cos(boundedTubeAngle),
    Math.sin(boundedTubeAngle),
    Math.sin(theta) * Math.cos(boundedTubeAngle),
  );
  if (normal.dot(expectedOutward) < 0) normal.negate();

  return {
    normal,
    position,
    ringTangent,
    tubeTangent,
  };
}

export function createDonutIcingGeometry({
  detail,
  donut,
  icing,
}: DonutIcingGeometryOptions): BufferGeometry {
  const ringSegments = DONUT_GEOMETRY.icingRingSegments;
  const tubeSegments = DONUT_GEOMETRY.icingTubeSegments;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const [tubeStart, tubeEnd] = getDonutIcingTubeRange(icing);
  const sampleOptions = { detail, donut, icing } as const;
  const sampledPosition = new Vector3();

  for (let ringIndex = 0; ringIndex <= ringSegments; ringIndex += 1) {
    const u = ringIndex / ringSegments;
    const theta = u * Math.PI * 2;

    for (let tubeIndex = 0; tubeIndex <= tubeSegments; tubeIndex += 1) {
      const v = tubeIndex / tubeSegments;
      const phi = tubeStart + (tubeEnd - tubeStart) * v;
      sampleDonutIcingPosition(
        sampleOptions,
        theta,
        phi,
        sampledPosition,
      );
      positions.push(
        sampledPosition.x,
        sampledPosition.y,
        sampledPosition.z,
      );
      uvs.push(u, v);
    }
  }

  const rowSize = tubeSegments + 1;
  for (let ringIndex = 0; ringIndex < ringSegments; ringIndex += 1) {
    for (let tubeIndex = 0; tubeIndex < tubeSegments; tubeIndex += 1) {
      const a = ringIndex * rowSize + tubeIndex;
      const b = (ringIndex + 1) * rowSize + tubeIndex;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, d, b, b, d, c);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(new Uint32BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
