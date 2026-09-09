import { describe, expect, it } from "vitest";

import { sampleGrassDistributionNoise } from "./grass-distribution-noise";

const settings = {
  detail: 3,
  levels: [0, 1],
  offset: [0, 0],
  roughness: 0.55,
  scale: 0.55,
  seed: 23,
} as const;

describe("grass distribution noise", () => {
  it("is deterministic and responds independently to seed and offset", () => {
    const initial = sampleGrassDistributionNoise(1.2, -0.7, settings);
    expect(sampleGrassDistributionNoise(1.2, -0.7, settings)).toBe(initial);
    expect(
      sampleGrassDistributionNoise(1.2, -0.7, { ...settings, seed: 24 }),
    ).not.toBe(initial);
    expect(
      sampleGrassDistributionNoise(1.2, -0.7, {
        ...settings,
        offset: [2, -1],
      }),
    ).not.toBe(initial);
  });

  it("maps values below the black point to absence and above white to full weight", () => {
    const samples = Array.from({ length: 64 }, (_, index) =>
      sampleGrassDistributionNoise(
        (index % 8) * 0.55,
        Math.floor(index / 8) * 0.55,
        { ...settings, levels: [0.45, 0.55] },
      ),
    );

    expect(samples.some((value) => value === 0)).toBe(true);
    expect(samples.some((value) => value === 1)).toBe(true);
  });
});

