import { describe, expect, it } from "vitest";

import {
  compareLogoSphereDrawOrder,
  createLogoSphereSurfaceCardMapper,
  createSpherePoints,
  getLogoSphereMaskGeometry,
  projectLogoSphere,
  rotateLogoSphereOrientation,
  type LogoSphereProjectionInput,
} from "./logo-sphere-model";

const baseInput: LogoSphereProjectionInput = {
  baseLogoSize: 112,
  depth: 0.86,
  distribution: "fibonacci",
  feather: 0.22,
  frame: { height: 1080, width: 1920, x: 0, y: 0 },
  loopProgress: 0,
  maskSize: 1.02,
  orientation: { position: [0, 0, 5], up: [0, 1, 0] },
  perspective: 2.8,
  rearOpacity: 0.12,
  radius: 370,
  spinAmount: 1,
  spinAxis: "vertical",
  visibleCount: 30,
};

describe("logo sphere model", () => {
  it("gives every Rings card a distinct position instead of stacking shadows at the poles", () => {
    for (let count = 1; count <= 500; count += 1) {
      const points = createSpherePoints({ count, distribution: "rings" });
      expect(points).toHaveLength(count);
      expect(points).toEqual(createSpherePoints({ count, distribution: "rings" }));
      const positions = new Set(points.map(({ x, y, z }) =>
        [x, y, z].map(value => value.toFixed(9)).join(",")));
      expect(positions.size, `${count} Rings cards must not share positions`).toBe(count);
      for (const { x, y, z } of points) {
        expect(Math.hypot(x, y, z)).toBeCloseTo(1, 10);
      }
    }
  });

  it("leaves comparable space between Rings neighbors, including both poles", () => {
    for (const count of [6, 30, 36, 48, 63, 100, 312, 500]) {
      const points = createSpherePoints({ count, distribution: "rings" });
      const nearest = points.map((point, index) => Math.min(...points
        .filter((_, other) => index !== other)
        .map(other => Math.hypot(point.x - other.x, point.y - other.y, point.z - other.z))));
      expect(Math.min(...nearest), `${count} Rings spacing`).toBeGreaterThan(1 / Math.sqrt(count));
      expect(Math.max(...nearest) / Math.min(...nearest)).toBeLessThan(2);
      expect(points.filter(({ y }) => y > 0.999999)).toHaveLength(1);
      expect(points.filter(({ y }) => y < -0.999999)).toHaveLength(1);
      const input = { ...baseInput, distribution: "rings" as const, visibleCount: count };
      expect(projectLogoSphere({ ...input, loopProgress: 0 })).toEqual(
        projectLogoSphere({ ...input, loopProgress: 1 }));
    }
  });

  it("generates a deterministic unit-length Fibonacci distribution", () => {
    const points = createSpherePoints({ count: 30, distribution: "fibonacci" });

    expect(points).toHaveLength(30);
    expect(points).toEqual(
      createSpherePoints({ count: 30, distribution: "fibonacci" }),
    );
    expect(
      points.every(
        ({ x, y, z }) =>
          Math.abs(Math.hypot(x, y, z) - 1) < Number.EPSILON * 8,
      ),
    ).toBe(true);
  });

  it("keeps the forward playback loop seamless", () => {
    expect(projectLogoSphere({ ...baseInput, loopProgress: 0 })).toEqual(
      projectLogoSphere({ ...baseInput, loopProgress: 1 }),
    );
  });

  it("returns cards in stable rear-to-front draw order", () => {
    const projected = projectLogoSphere(baseInput);
    const depths = projected.map(({ z }) => z);

    expect(depths).toEqual([...depths].sort((left, right) => left - right));
  });

  it.each([312, 500])("keeps a view-independent stacking order for %i Grid cards", (visibleCount) => {
    const orientations = [
      baseInput.orientation,
      rotateLogoSphereOrientation(baseInput.orientation, 180, -75),
      rotateLogoSphereOrientation(baseInput.orientation, -240, 120),
    ];
    for (const orientation of orientations) {
      for (let sample = 0; sample < 48; sample += 1) {
        const input = { ...baseInput, distribution: "grid" as const,
          depth: 1, perspective: 2.3, rearOpacity: 0.08, spinAxis: "diagonal" as const,
          visibleCount, orientation, loopProgress: sample / 48 };
        const projected = projectLogoSphere(input);
        const rear = projected.filter(({ z }) => z < 0);
        const front = projected.filter(({ z }) => z >= 0);
        expect(projected).toEqual([...rear, ...front]);
        // One fixed total order proves every pair, even when depths cross.
        for (const hemisphere of [rear, front]) {
          const indices = hemisphere.map(({ index }) => index);
          expect(indices).toEqual([...indices].sort((a, b) => b - a));
        }
        expect(projectLogoSphere(input)).toEqual(projected);
        const sorted = [...projected].reverse().sort(compareLogoSphereDrawOrder("grid"));
        expect(sorted).toEqual(projected);
        expect([...sorted].sort(compareLogoSphereDrawOrder("grid"))).toEqual(sorted);
      }
    }
  });

  it("maps sphere radius, depth, and perspective to distinct spatial outcomes", () => {
    const compact = projectLogoSphere({ ...baseInput, radius: 260 });
    const wide = projectLogoSphere({ ...baseInput, radius: 480 });
    const compactRadius = Math.max(
      ...compact.map(({ x, y }) =>
        Math.hypot(x - baseInput.frame.width / 2, y - baseInput.frame.height / 2),
      ),
    );
    const wideRadius = Math.max(
      ...wide.map(({ x, y }) =>
        Math.hypot(x - baseInput.frame.width / 2, y - baseInput.frame.height / 2),
      ),
    );

    expect(wideRadius).toBeGreaterThan(compactRadius * 1.5);

    const flat = projectLogoSphere({ ...baseInput, depth: 0.35 });
    const round = projectLogoSphere({ ...baseInput, depth: 1 });
    expect(Math.max(...round.map(({ z }) => Math.abs(z)))).toBeGreaterThan(
      Math.max(...flat.map(({ z }) => Math.abs(z))) * 2,
    );

    const dramatic = projectLogoSphere({ ...baseInput, perspective: 1.7 });
    const subtle = projectLogoSphere({ ...baseInput, perspective: 5 });
    const contrast = (items: typeof dramatic) =>
      Math.max(...items.map(({ size }) => size)) /
      Math.min(...items.map(({ size }) => size));
    expect(contrast(dramatic)).toBeGreaterThan(contrast(subtle));
  });

  it("widens the pixel-level radial mask band when feather increases", () => {
    const narrow = getLogoSphereMaskGeometry({
      ...baseInput,
      feather: 0.06,
      maskSize: 0.86,
    });
    const wide = getLogoSphereMaskGeometry({
      ...baseInput,
      feather: 0.32,
      maskSize: 0.86,
    });

    expect(wide.outerRadius).toBe(narrow.outerRadius);
    expect(wide.outerRadius - wide.innerRadius).toBeGreaterThan(
      narrow.outerRadius - narrow.innerRadius,
    );
  });

  it("uses pronounced depth scale and opacity without center-sampled mask popping", () => {
    const projected = projectLogoSphere({
      ...baseInput,
      depth: 1,
      perspective: 2.3,
      rearOpacity: 0.08,
    });
    const rear = projected[0];
    const front = projected.at(-1);

    expect(rear).toBeDefined();
    expect(front).toBeDefined();
    expect((front?.size ?? 0) / (rear?.size ?? 1)).toBeGreaterThan(2);
    expect((front?.opacity ?? 0) - (rear?.opacity ?? 1)).toBeGreaterThan(0.8);

    const tighterMask = projectLogoSphere({ ...baseInput, maskSize: 0.55 });
    const widerMask = projectLogoSphere({ ...baseInput, maskSize: 1.25 });
    expect(tighterMask.map(({ opacity }) => opacity)).toEqual(
      widerMask.map(({ opacity }) => opacity),
    );
  });

  it("clamps the reachable visible-card range", () => {
    expect(projectLogoSphere({ ...baseInput, visibleCount: 2 })).toHaveLength(6);
    expect(projectLogoSphere({ ...baseInput, visibleCount: 2000 })).toHaveLength(
      500,
    );
  });

  it("fills the grid distribution with equidistant points over the whole sphere", () => {
    const points = createSpherePoints({ count: 30, distribution: "grid" });

    expect(points).toHaveLength(30);
    expect(points).toEqual(createSpherePoints({ count: 30, distribution: "grid" }));
    expect(
      points.every(
        ({ x, y, z }) => Math.abs(Math.hypot(x, y, z) - 1) < 1e-9,
      ),
    ).toBe(true);
    expect(Math.max(...points.map(({ z }) => z))).toBeGreaterThan(0.5);
    expect(Math.min(...points.map(({ z }) => z))).toBeLessThan(-0.5);

    const nearestDistances = points.map((point, index) =>
      Math.min(
        ...points
          .filter((_, other) => other !== index)
          .map((other) =>
            Math.hypot(point.x - other.x, point.y - other.y, point.z - other.z),
          ),
      ),
    );
    expect(Math.max(...nearestDistances)).toBeLessThan(
      Math.min(...nearestDistances) * 2,
    );

    const gridInput = {
      ...baseInput,
      distribution: "grid" as const,
      visibleCount: 30,
    };
    expect(projectLogoSphere({ ...gridInput, loopProgress: 0 })).toEqual(
      projectLogoSphere({ ...gridInput, loopProgress: 1 }),
    );

    const projected = [...projectLogoSphere({ ...gridInput, rearOpacity: 0.08 })]
      .sort((left, right) => left.z - right.z);
    expect(
      (projected.at(-1)?.opacity ?? 0) - (projected[0]?.opacity ?? 1),
    ).toBeGreaterThan(0.5);
  });

  it("keeps grid card size independent of the point count", () => {
    const gridInput = {
      ...baseInput,
      distribution: "grid" as const,
      visibleCount: 30,
    };
    const fewCards = projectLogoSphere({ ...gridInput, visibleCount: 12 });
    const manyCards = projectLogoSphere({ ...gridInput, visibleCount: 72 });
    const maxSize = (items: readonly { size: number }[]) =>
      Math.max(...items.map(({ size }) => size));
    const countRatio = maxSize(manyCards) / maxSize(fewCards);
    expect(countRatio).toBeGreaterThan(0.9);
    expect(countRatio).toBeLessThan(1.1);

    const small = projectLogoSphere({ ...gridInput, radius: 140 });
    const huge = projectLogoSphere({ ...gridInput, radius: 1600 });
    expect(maxSize(huge)).toBeGreaterThan(maxSize(small) * 6);
    const radiusOf = (items: readonly { x: number; y: number }[]) =>
      Math.max(
        ...items.map(({ x, y }) =>
          Math.hypot(
            x - baseInput.frame.width / 2,
            y - baseInput.frame.height / 2,
          ),
        ),
      );
    expect(radiusOf(huge)).toBeGreaterThan(radiusOf(small) * 6);
  });

  it("distorts grid cards with the sphere surface under pure perspective sizing", () => {
    const gridInput = {
      ...baseInput,
      distribution: "grid" as const,
      visibleCount: 30,
    };
    const mapCard = createLogoSphereSurfaceCardMapper(gridInput);

    const front = mapCard({ x: 0, y: 0, z: 1 });
    expect(
      Math.abs(front(0.2, 0).z - front(-0.2, 0).z),
    ).toBeLessThan(0.05);
    expect(Math.abs(front(0.2, 0).y - front(-0.2, 0).y)).toBeLessThan(0.5);

    const spunCard = createLogoSphereSurfaceCardMapper({
      ...gridInput,
      loopProgress: 0,
    })({ x: 0.6, y: 0, z: 0.8 });
    expect(
      Math.abs(spunCard(0.2, 0).y - spunCard(-0.2, 0).y),
    ).toBeLessThan(Math.abs(spunCard(0.2, 0).x - spunCard(-0.2, 0).x) * 0.02);

    const limb = mapCard({ x: 1, y: 0, z: 0 });
    const left = limb(-0.2, 0);
    const right = limb(0.2, 0);
    const frontWidth = Math.abs(front(0.2, 0).x - front(-0.2, 0).x);
    const limbWidth = Math.abs(right.x - left.x);
    expect(limbWidth).toBeLessThan(frontWidth * 0.5);

    const projected = [...projectLogoSphere(gridInput)]
      .sort((left, right) => left.z - right.z);
    const sizes = projected.map(({ size }) => size);
    expect(sizes).toEqual([...sizes].sort((left, right) => left - right));
    const rearCard = projected[0];
    const frontCard = projected.at(-1);
    expect(frontCard?.size ?? 0).toBeGreaterThan((rearCard?.size ?? 1) * 1.4);
    expect((frontCard?.opacity ?? 0) - (rearCard?.opacity ?? 1)).toBeGreaterThan(
      0.6,
    );
    const limbCard = [...projected].sort(
      (left, right) => Math.abs(left.z) - Math.abs(right.z),
    )[0];
    expect(frontCard?.opacity ?? 0).toBeGreaterThan(
      (limbCard?.opacity ?? 1) + 0.3,
    );
  });

  it("dollies into a wide-angle lens under fisheye, magnifying near logos", () => {
    const standard = projectLogoSphere(baseInput);
    const bulged = projectLogoSphere({ ...baseInput, fisheye: 1 });

    expect(projectLogoSphere({ ...baseInput, fisheye: 0 })).toEqual(standard);
    expect(bulged.at(-1)?.size ?? 0).toBeGreaterThan(
      (standard.at(-1)?.size ?? 0) * 1.4,
    );
    expect(bulged[0]?.size ?? 0).toBeLessThan(standard[0]?.size ?? 0);

    const gridInput = {
      ...baseInput,
      distribution: "grid" as const,
      fisheye: 1,
      visibleCount: 30,
    };
    const bulgedSizes = [...projectLogoSphere(gridInput)]
      .sort((left, right) => left.z - right.z).map(({ size }) => size);
    expect(bulgedSizes).toEqual(
      [...bulgedSizes].sort((left, right) => left - right),
    );
    const mapCard = createLogoSphereSurfaceCardMapper(gridInput);
    const flatMapCard = createLogoSphereSurfaceCardMapper({
      ...gridInput,
      fisheye: 0,
    });
    const front = mapCard({ x: 0, y: 0, z: 1 })(0.2, 0);
    const flatFront = flatMapCard({ x: 0, y: 0, z: 1 })(0.2, 0);
    expect(front.scale).toBeGreaterThan(flatFront.scale * 1.4);
    // Dolly-zoom framing hold: mid-ring neighbors keep nearly their base
    // scale, while the limb compresses slightly like a wide-angle edge, so
    // the contrast against the magnified front rises without any zoom.
    const referencePoint = { x: Math.sqrt(1 - 0.35 ** 2), y: 0, z: 0.35 };
    const referenceRatio =
      mapCard(referencePoint)(0, 0).scale /
      flatMapCard(referencePoint)(0, 0).scale;
    expect(referenceRatio).toBeGreaterThan(0.8);
    expect(referenceRatio).toBeLessThan(1.05);
    const limb = mapCard({ x: 1, y: 0, z: 0 })(0, 0);
    const flatLimb = flatMapCard({ x: 1, y: 0, z: 0 })(0, 0);
    expect(limb.scale).toBeLessThan(flatLimb.scale);
    expect(limb.scale).toBeGreaterThan(flatLimb.scale * 0.7);
  });

  it("preserves camera distance while applying pointer orbit deltas", () => {
    const initial = { position: [0, 0, 5], up: [0, 1, 0] } as const;
    const rotated = rotateLogoSphereOrientation(initial, 80, -35);

    expect(rotated).not.toEqual(initial);
    expect(Math.hypot(...rotated.position)).toBeCloseTo(5, 10);
    expect(Math.hypot(...rotated.up)).toBeCloseTo(1, 10);
  });
});
