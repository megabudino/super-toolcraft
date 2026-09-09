import { describe, expect, it } from "vitest";
import { Vector3 } from "three";

import { DONUT_GEOMETRY } from "./donut-reference";
import {
  createDonutSprinkleLayout,
  relaxDonutSprinkleBodies,
} from "./donut-sprinkle-layout";
import type { DonutSettings } from "./donut-types";
import { DONUT_DEFAULTS } from "./donut-values";

function settings(
  sprinkles: Partial<DonutSettings["sprinkles"]> = {},
  donut: Partial<DonutSettings["donut"]> = {},
  icing: Partial<DonutSettings["icing"]> = {},
) {
  return {
    ...DONUT_DEFAULTS,
    donut: { ...DONUT_DEFAULTS.donut, ...donut },
    icing: { ...DONUT_DEFAULTS.icing, ...icing },
    sprinkles: { ...DONUT_DEFAULTS.sprinkles, ...sprinkles },
  };
}

function expectPearlsConformToCurrentIcing(
  currentSettings: DonutSettings,
  tolerance: number,
): void {
  const position = new Vector3();
  const surfacePosition = new Vector3();
  const normal = new Vector3();

  for (const pearl of createDonutSprinkleLayout(currentSettings)) {
    position.fromArray(pearl.position);
    surfacePosition.fromArray(pearl.surfacePosition);
    normal.fromArray(pearl.normal);
    const expectedClearance =
      pearl.scale[0] * 0.5 * 0.82 +
      currentSettings.sprinkles.surfaceOffset;
    expect(
      Math.abs(position.distanceTo(surfacePosition) - expectedClearance),
    ).toBeLessThanOrEqual(tolerance);
    expect(
      Math.abs(
        position
          .clone()
          .sub(surfacePosition)
          .dot(normal) - expectedClearance,
      ),
    ).toBeLessThanOrEqual(tolerance);
  }
}

function projectedSurfaceDistance(
  item: ReturnType<typeof createDonutSprinkleLayout>[number],
): number {
  return new Vector3(...item.position)
    .sub(new Vector3(...item.surfacePosition))
    .dot(new Vector3(...item.normal));
}

describe("deterministic sprinkle layout", () => {
  it("repeats the exact supplied-default arrangement", () => {
    const first = createDonutSprinkleLayout(DONUT_DEFAULTS);
    const second = createDonutSprinkleLayout(DONUT_DEFAULTS);
    expect(first).toEqual(second);
    expect(first).toHaveLength(
      Math.round(
        DONUT_GEOMETRY.sprinkleReferenceCount *
          DONUT_DEFAULTS.sprinkles.flow,
      ),
    );
  });

  it("maps Flow to a bounded population and Clear to zero", () => {
    expect(
      createDonutSprinkleLayout(settings({
        flow: 0,
      })),
    ).toEqual([]);
    expect(
      createDonutSprinkleLayout(settings({
        flow: 2,
      })),
    ).toHaveLength(840);
    expect(
      createDonutSprinkleLayout(settings({
        clear: true,
        flow: 2,
      })),
    ).toEqual([]);
  });

  it("places every instance on the upper donut coating with unit normals", () => {
    for (const sprinkle of createDonutSprinkleLayout(DONUT_DEFAULTS)) {
      const [x, y, z] = sprinkle.position;
      const radial = Math.hypot(x, z);
      const normalLength = Math.hypot(...sprinkle.normal);
      expect(radial).toBeGreaterThan(0.28);
      expect(radial).toBeLessThan(1.65);
      expect(y).toBeGreaterThan(-0.08);
      expect(y).toBeLessThan(0.84);
      expect(normalLength).toBeCloseTo(1, 6);
      expect(sprinkle.quaternion.every(Number.isFinite)).toBe(true);
    }
  });

  it("rests Pearl geometry on the exact current icing surface", () => {
    expectPearlsConformToCurrentIcing(
      settings({ shape: 2, surfaceOffset: 0 }),
      1e-8,
    );
    expectPearlsConformToCurrentIcing(
      settings(
        {
          coverage: 2,
          flow: 2,
          shape: 2,
          surfaceOffset: 0,
        },
        {},
        {
          coverage: 0.65,
          detail: 2,
          dripAmount: 2,
          dripFrequency: 2,
          flow: 2,
          thickness: 0.55,
        },
      ),
      1e-8,
    );
  });

  it("slightly embeds every shape at zero offset", () => {
    for (const shape of [1, 2, 3] as const) {
      const item = createDonutSprinkleLayout(
        settings({ flow: 0.01, shape, surfaceOffset: 0 }),
      )[0]!;
      const transverseRadius = Math.max(item.scale[0], item.scale[2]) * 0.5;
      expect(projectedSurfaceDistance(item)).toBeCloseTo(
        transverseRadius * 0.82,
        8,
      );
    }
  });

  it("applies signed offset along the current icing normal", () => {
    const embedded = createDonutSprinkleLayout(
      settings({ flow: 0.01, surfaceOffset: -0.04 }),
    )[0]!;
    const natural = createDonutSprinkleLayout(
      settings({ flow: 0.01, surfaceOffset: 0 }),
    )[0]!;
    const lifted = createDonutSprinkleLayout(
      settings({ flow: 0.01, surfaceOffset: 0.04 }),
    )[0]!;

    expect(
      projectedSurfaceDistance(natural) -
        projectedSurfaceDistance(embedded),
    ).toBeCloseTo(0.04, 8);
    expect(
      projectedSurfaceDistance(lifted) -
        projectedSurfaceDistance(natural),
    ).toBeCloseTo(0.04, 8);
  });

  it("resamples sprinkle contact when the icing surface changes", () => {
    const dry = createDonutSprinkleLayout(
      settings({ flow: 0.2, shape: 2 }, {}, { flow: 0 }),
    );
    const flowing = createDonutSprinkleLayout(
      settings(
        { flow: 0.2, shape: 2 },
        {},
        { dripAmount: 2, flow: 2 },
      ),
    );
    expect(flowing.map((item) => item.position)).not.toEqual(
      dry.map((item) => item.position),
    );
  });

  it("exposes distinct shape scale signatures", () => {
    const signatures = ([1, 2, 3] as const).map((shape) =>
      createDonutSprinkleLayout(settings({
        flow: 0.1,
        shape,
      }))[0]?.scale.join(":"),
    );
    expect(new Set(signatures).size).toBe(3);
  });

  it("produces five distinct palette signatures with solid authority", () => {
    const signatures = ([1, 2, 3, 4, 5] as const).map((palette) =>
      createDonutSprinkleLayout(settings({
        flow: 0.2,
        palette,
        solidColor: "#123456",
      }))
        .slice(0, 12)
        .map((item) => item.color)
        .join(":"),
    );
    expect(new Set(signatures).size).toBe(5);
    expect(signatures[0]).toBe(Array.from({ length: 12 }, () => "#123456").join(":"));
  });

  it("maps seed, coverage, variation, rotation, offset, and donut shape", () => {
    const authored = createDonutSprinkleLayout(DONUT_DEFAULTS);
    const changed = createDonutSprinkleLayout(
      settings(
        {
          coverage: 0.25,
          rotation: 0,
          seed: 999,
          sizeVariation: 2,
          surfaceOffset: 0.15,
        },
        { height: 1.35, majorRadius: 1.28, thickness: 1.35 },
      ),
    );
    expect(changed).toHaveLength(authored.length);
    expect(changed[0]).not.toEqual(authored[0]);
    const meanRadial = (layout: ReturnType<typeof createDonutSprinkleLayout>) =>
      layout.reduce(
        (sum, item) => sum + Math.hypot(item.position[0], item.position[2]),
        0,
      ) / layout.length;
    expect(meanRadial(changed)).toBeGreaterThan(meanRadial(authored) + 0.15);
  });

  it("keeps deep instance interpenetration rare after relaxation", () => {
    const layout = createDonutSprinkleLayout(DONUT_DEFAULTS);
    let worstRatio = Infinity;
    let deeplyEmbeddedPairs = 0;
    for (let a = 0; a < layout.length; a += 1) {
      for (let b = a + 1; b < layout.length; b += 1) {
        const first = layout[a]!;
        const second = layout[b]!;
        const distance = Math.hypot(
          first.position[0] - second.position[0],
          first.position[1] - second.position[1],
          first.position[2] - second.position[2],
        );
        const footprint =
          Math.max(...first.scale) + Math.max(...second.scale);
        const ratio = distance / footprint;
        worstRatio = Math.min(worstRatio, ratio);
        if (ratio < 0.12) deeplyEmbeddedPairs += 1;
      }
    }
    expect(worstRatio).toBeGreaterThan(0.02);
    expect(deeplyEmbeddedPairs / layout.length).toBeLessThan(0.04);
  });

  it("relaxes overlaps along the icing instead of lifting sprinkles into the air", () => {
    const bodies = [
      {
        anchor: new Vector3(0, 0, 0),
        footprint: 0.2,
        normal: new Vector3(0, 1, 0),
        position: new Vector3(0, 0, 0),
      },
      {
        anchor: new Vector3(0.01, 0, 0),
        footprint: 0.2,
        normal: new Vector3(0, 1, 0),
        position: new Vector3(0.01, 0, 0),
      },
    ];

    relaxDonutSprinkleBodies(bodies);

    for (const body of bodies) {
      expect(
        body.position.clone().sub(body.anchor).dot(body.normal),
      ).toBeCloseTo(0, 8);
    }
  });

  it("mixes rainbow hues across every angular sector instead of banding", () => {
    const layout = createDonutSprinkleLayout(settings({ palette: 4 }));
    const sectorBins = new Map<number, Set<number>>();
    for (const sprinkle of layout) {
      const angle = Math.atan2(sprinkle.position[2], sprinkle.position[0]);
      const sector = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 6) % 6;
      const red = Number.parseInt(sprinkle.color.slice(1, 3), 16) / 255;
      const green = Number.parseInt(sprinkle.color.slice(3, 5), 16) / 255;
      const blue = Number.parseInt(sprinkle.color.slice(5, 7), 16) / 255;
      const maximum = Math.max(red, green, blue);
      const minimum = Math.min(red, green, blue);
      const delta = Math.max(1e-6, maximum - minimum);
      let hue = 0;
      if (maximum === red) hue = ((green - blue) / delta + 6) % 6;
      else if (maximum === green) hue = (blue - red) / delta + 2;
      else hue = (red - green) / delta + 4;
      const bin = Math.floor(hue) % 6;
      const bins = sectorBins.get(sector) ?? new Set<number>();
      bins.add(bin);
      sectorBins.set(sector, bins);
    }
    expect(sectorBins.size).toBe(6);
    for (const bins of sectorBins.values()) {
      expect(bins.size).toBeGreaterThanOrEqual(4);
    }
  });
});
