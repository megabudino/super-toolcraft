import { Box3 } from "three";
import { describe, expect, it } from "vitest";

import {
  createDonutIcingGeometry,
  getDonutIcingTubeRange,
  sampleDonutIcingSurface,
} from "./donut-icing-geometry";
import { DONUT_GEOMETRY } from "./donut-reference";
import { DONUT_DEFAULTS } from "./donut-values";

function bounds(detail: boolean) {
  const geometry = createDonutIcingGeometry({
    detail,
    donut: DONUT_DEFAULTS.donut,
    icing: DONUT_DEFAULTS.icing,
  });
  geometry.computeBoundingBox();
  return geometry.boundingBox?.clone() ?? new Box3();
}

function createIcing(flow: number, dripAmount = 1, thickness = 1) {
  return createDonutIcingGeometry({
    detail: true,
    donut: DONUT_DEFAULTS.donut,
    icing: {
      ...DONUT_DEFAULTS.icing,
      dripAmount,
      flow,
      thickness,
    },
  });
}

describe("procedural icing geometry", () => {
  it("builds stable finite indexed coating geometry", () => {
    const options = {
      detail: true,
      donut: DONUT_DEFAULTS.donut,
      icing: DONUT_DEFAULTS.icing,
    };
    const first = createDonutIcingGeometry(options);
    const second = createDonutIcingGeometry(options);
    const positions = first.getAttribute("position");

    expect(first.getIndex()).not.toBeNull();
    expect(positions.count).toBeGreaterThan(3_000);
    expect(first.getIndex()?.count).toBeGreaterThan(15_000);
    expect(Array.from(positions.array).every(Number.isFinite)).toBe(true);
    expect(Array.from(positions.array)).toEqual(
      Array.from(second.getAttribute("position").array),
    );
  });

  it("uses the same current-surface sampler for mesh vertices", () => {
    const options = {
      detail: true,
      donut: DONUT_DEFAULTS.donut,
      icing: {
        ...DONUT_DEFAULTS.icing,
        dripAmount: 1.8,
        flow: 1.7,
      },
    };
    const geometry = createDonutIcingGeometry(options);
    const positions = geometry.getAttribute("position");
    const rowSize = DONUT_GEOMETRY.icingTubeSegments + 1;
    const [tubeStart, tubeEnd] = getDonutIcingTubeRange(options.icing);

    for (const [ringIndex, tubeIndex] of [
      [0, 0],
      [17, 9],
      [63, 20],
      [101, 34],
      [128, 40],
    ] as const) {
      const theta =
        (ringIndex / DONUT_GEOMETRY.icingRingSegments) * Math.PI * 2;
      const tubeAngle =
        tubeStart +
        (tubeEnd - tubeStart) *
          (tubeIndex / DONUT_GEOMETRY.icingTubeSegments);
      const sample = sampleDonutIcingSurface(options, theta, tubeAngle);
      const vertexIndex = ringIndex * rowSize + tubeIndex;
      expect(positions.getX(vertexIndex)).toBeCloseTo(sample.position.x, 6);
      expect(positions.getY(vertexIndex)).toBeCloseTo(sample.position.y, 6);
      expect(positions.getZ(vertexIndex)).toBeCloseTo(sample.position.z, 6);
    }
  });

  it("preserves the donut hole and authored source bounds", () => {
    const geometryBounds = bounds(true);
    expect(geometryBounds.min.x).toBeGreaterThan(-1.7);
    expect(geometryBounds.max.x).toBeLessThan(1.7);
    expect(geometryBounds.max.y).toBeGreaterThan(0.48);
    expect(geometryBounds.min.y).toBeLessThan(-0.12);

    const positions = createDonutIcingGeometry({
      detail: true,
      donut: DONUT_DEFAULTS.donut,
      icing: DONUT_DEFAULTS.icing,
    }).getAttribute("position");
    let minimumRadial = Infinity;
    for (let index = 0; index < positions.count; index += 1) {
      minimumRadial = Math.min(
        minimumRadial,
        Math.hypot(positions.getX(index), positions.getZ(index)),
      );
    }
    expect(minimumRadial).toBeGreaterThan(0.28);
  });

  it("removes drips for Detail clear while preserving the smooth top shell", () => {
    const detailed = bounds(true);
    const smooth = bounds(false);
    expect(detailed.max.y).toBeCloseTo(smooth.max.y, 1);
    expect(detailed.min.y).toBeLessThan(smooth.min.y - 0.06);
    expect(smooth.max.y).toBeGreaterThan(0.48);
  });

  it("maps donut and icing formation settings into bounded geometry", () => {
    const compact = createDonutIcingGeometry({
      detail: true,
      donut: { ...DONUT_DEFAULTS.donut, majorRadius: 0.78, thickness: 0.65 },
      icing: {
        ...DONUT_DEFAULTS.icing,
        coverage: 0.55,
        dripAmount: 0,
        flow: 0,
        thickness: 0.55,
      },
    });
    const generous = createDonutIcingGeometry({
      detail: true,
      donut: { ...DONUT_DEFAULTS.donut, majorRadius: 1.28, thickness: 1.35 },
      icing: {
        ...DONUT_DEFAULTS.icing,
        coverage: 1.25,
        dripAmount: 2,
        flow: 2,
        thickness: 1.45,
      },
    });
    compact.computeBoundingBox();
    generous.computeBoundingBox();
    expect(generous.boundingBox!.max.x).toBeGreaterThan(
      compact.boundingBox!.max.x + 0.6,
    );
    expect(generous.boundingBox!.min.y).toBeLessThan(
      compact.boundingBox!.min.y,
    );
  });

  it("spreads viscous flow smoothly across multiple tube rows", () => {
    const dry = createIcing(0);
    const flowing = createIcing(1.35);
    const dryPositions = dry.getAttribute("position");
    const flowingPositions = flowing.getAttribute("position");
    const rowSize = DONUT_GEOMETRY.icingTubeSegments + 1;
    let affectedRows = 0;

    for (
      let tubeIndex = 0;
      tubeIndex <= DONUT_GEOMETRY.icingTubeSegments;
      tubeIndex += 1
    ) {
      let maximumDelta = 0;
      for (
        let ringIndex = 0;
        ringIndex < DONUT_GEOMETRY.icingRingSegments;
        ringIndex += 1
      ) {
        const vertexIndex = ringIndex * rowSize + tubeIndex;
        maximumDelta = Math.max(
          maximumDelta,
          Math.abs(
            dryPositions.getY(vertexIndex) -
              flowingPositions.getY(vertexIndex),
          ),
        );
      }
      if (maximumDelta > 0.006) affectedRows += 1;
    }

    expect(affectedRows).toBeGreaterThanOrEqual(10);
  });

  it("keeps the flowing edge rounded instead of forming triangular teeth", () => {
    const geometry = createIcing(1.4, 1.4);
    const positions = geometry.getAttribute("position");
    const rowSize = DONUT_GEOMETRY.icingTubeSegments + 1;
    let maximumAdjacentEdgeStep = 0;

    for (
      let ringIndex = 0;
      ringIndex < DONUT_GEOMETRY.icingRingSegments;
      ringIndex += 1
    ) {
      const nextRing = (ringIndex + 1) % DONUT_GEOMETRY.icingRingSegments;
      maximumAdjacentEdgeStep = Math.max(
        maximumAdjacentEdgeStep,
        Math.abs(
          positions.getY(ringIndex * rowSize) -
            positions.getY(nextRing * rowSize),
        ),
      );
    }

    expect(maximumAdjacentEdgeStep).toBeLessThan(0.075);
  });

  it("gives flow, drip length, and thickness independent geometric authority", () => {
    const dry = createIcing(0, 1, 1);
    const short = createIcing(1.2, 0.35, 1);
    const long = createIcing(1.2, 1.8, 1);
    const thick = createIcing(1.2, 0.35, 1.45);
    for (const geometry of [dry, short, long, thick]) {
      geometry.computeBoundingBox();
    }

    expect(short.boundingBox!.min.y).toBeLessThan(dry.boundingBox!.min.y - 0.02);
    expect(long.boundingBox!.min.y).toBeLessThan(
      short.boundingBox!.min.y - 0.08,
    );
    expect(thick.boundingBox!.max.y).toBeGreaterThan(
      short.boundingBox!.max.y + 0.08,
    );
  });

  it("tucks both coating rims toward the dough core", () => {
    const geometry = createDonutIcingGeometry({
      detail: false,
      donut: DONUT_DEFAULTS.donut,
      icing: DONUT_DEFAULTS.icing,
    });
    const positions = geometry.getAttribute("position");
    const rowSize = DONUT_GEOMETRY.icingTubeSegments + 1;
    const tubeCenterY = 0.02 + 0.18;
    const tubeDistance = (ringIndex: number, tubeIndex: number) => {
      const index = ringIndex * rowSize + tubeIndex;
      const radial = Math.hypot(
        positions.getX(index) - 0.0168,
        positions.getZ(index) - 0.013,
      );
      return Math.hypot(
        radial -
          DONUT_GEOMETRY.icingMajorRadius *
            DONUT_DEFAULTS.donut.majorRadius,
        positions.getY(index) - tubeCenterY,
      );
    };

    for (const ringIndex of [0, 31, 64, 97]) {
      const interior = tubeDistance(ringIndex, 6);
      expect(tubeDistance(ringIndex, 0)).toBeLessThan(interior - 0.02);
      expect(
        tubeDistance(ringIndex, DONUT_GEOMETRY.icingTubeSegments),
      ).toBeLessThan(interior - 0.02);
    }
  });
});
