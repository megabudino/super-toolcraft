import { describe, expect, it } from "vitest";

import {
  createGrassBasePlacementCandidates,
  filterGrassPlacementCandidatesByCoverage,
} from "./grass-placement-candidates";

const placementOptions = {
  count: 500,
  distanceMin: 0.04,
  seed: 23,
  shape: {
    depth: 5,
    irregularity: 0.07,
    roundness: 1,
    seed: 20,
    width: 7,
  },
} as const;

describe("grass placement coverage", () => {
  it("preserves the complete base placement for all-white coverage", () => {
    const base = createGrassBasePlacementCandidates(placementOptions);
    const white = filterGrassPlacementCandidatesByCoverage({
      candidates: base,
      coverageAt: () => 1,
      seed: placementOptions.seed,
    });

    expect(base).toHaveLength(placementOptions.count);
    expect(white).toEqual(base);
  });

  it("rejects all candidates for all-black coverage", () => {
    const base = createGrassBasePlacementCandidates(placementOptions);
    expect(
      filterGrassPlacementCandidatesByCoverage({
        candidates: base,
        coverageAt: () => 0,
        seed: placementOptions.seed,
      }),
    ).toEqual([]);
  });

  it("returns deterministic monotonic subsets without refill", () => {
    const base = createGrassBasePlacementCandidates(placementOptions);
    const quarter = filterGrassPlacementCandidatesByCoverage({
      candidates: base,
      coverageAt: () => 0.25,
      seed: placementOptions.seed,
    });
    const half = filterGrassPlacementCandidatesByCoverage({
      candidates: base,
      coverageAt: () => 0.5,
      seed: placementOptions.seed,
    });
    const repeated = filterGrassPlacementCandidatesByCoverage({
      candidates: base,
      coverageAt: () => 0.5,
      seed: placementOptions.seed,
    });

    expect(quarter.length).toBeGreaterThan(0);
    expect(quarter.length).toBeLessThan(half.length);
    expect(half.length).toBeLessThan(base.length);
    expect(new Set(quarter.map(({ sourceIndex }) => sourceIndex))).toEqual(
      new Set(quarter.map(({ sourceIndex }) => sourceIndex).filter((index) =>
        half.some((candidate) => candidate.sourceIndex === index),
      )),
    );
    expect(repeated).toEqual(half);
  });
});
