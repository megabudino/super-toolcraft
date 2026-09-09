import { describe, expect, it } from "vitest";

import type { HeroMotionRawPixelSample } from "./hero-motion-pixel-types";
import {
  analyzeHeroMotionPixelPair,
  evaluateHeroMotionAmountMateriality,
  getHeroMotionMeanAbsoluteLumaDelta,
  getHeroMotionPixelHash,
  getMatchedHeroMotionPixelDelta,
  matchHeroMotionPixelPairs,
  summarizeHeroGrainPixelWindow,
  summarizeHeroHeldGrainPixelWindow,
  summarizeHeroMotionTemporalExcess,
} from "../../e2e/hero-motion-pixel-evidence";
import {
  evaluateHeroMotionSizeCorrelationMateriality,
  summarizeHeroMotionSizeTriples,
} from "../../e2e/hero-motion-size-pixel-evidence";

function createSample(
  sequence: number,
  values: readonly number[],
  {
    frameDt = 1 / 60,
    panRate = 1,
  }: Readonly<{ frameDt?: number; panRate?: number }> = {},
): HeroMotionRawPixelSample {
  return {
    frame: {
      crt: 0,
      crtFlicker: 0,
      crtPitch: 8,
      crtScanlines: 0,
      effectTime: sequence / 60,
      frameDt,
      grain: 0.8,
      grainSize: 2,
      panRate,
      sequence,
    },
    height: 2,
    pixels: values.flatMap((value) => [value, value, value, 255]),
    width: 2,
  };
}

describe("bounded hero motion pixel evidence", () => {
  it("computes deterministic material and temporal metrics outside the draw hook", () => {
    const samples = [
      createSample(1, [10, 20, 30, 40]),
      createSample(2, [20, 10, 40, 30]),
      createSample(3, [5, 30, 25, 50]),
      createSample(4, [30, 5, 50, 25]),
    ];

    expect(getHeroMotionPixelHash(samples[0]!)).not.toBe(
      getHeroMotionPixelHash(samples[1]!),
    );
    expect(
      getHeroMotionMeanAbsoluteLumaDelta(samples[0]!, samples[1]!),
    ).toBeCloseTo(10);
    expect(
      analyzeHeroMotionPixelPair(samples[0]!, samples[1]!)
        .meanAbsoluteLumaDelta,
    ).toBeCloseTo(10);
    expect(
      getMatchedHeroMotionPixelDelta(samples, [...samples].reverse()),
    ).toBe(17.5);
    const summary = summarizeHeroGrainPixelWindow(samples);
    expect(summary?.sampleCount).toBe(3);
    expect(summary?.grain).toBeCloseTo(0.8);
    expect(Number.isFinite(summary!.temporalResidualNeighborCorrelation)).toBe(
      true,
    );
  });

  it("scores centered effect residuals after deterministic scalar matching", () => {
    const control = [
      createSample(1, [10, 10, 10, 10]),
      createSample(2, [11, 9, 11, 9]),
      createSample(3, [10, 10, 10, 10]),
      createSample(4, [11, 9, 11, 9]),
    ];
    const equal = control.map((sample) => ({
      ...sample,
      frame: { ...sample.frame },
      pixels: [...sample.pixels],
    }));
    const fineNoise = [
      createSample(1, [10, 10, 10, 10]),
      createSample(2, [12, 8, 12, 8]),
      createSample(3, [10, 10, 10, 10]),
      createSample(4, [12, 8, 12, 8]),
    ];

    const equalSummary = summarizeHeroMotionTemporalExcess(control, equal);
    const fineSummary = summarizeHeroMotionTemporalExcess(control, fineNoise);
    expect(equalSummary.score).toBe(0);
    expect(fineSummary.score).toBeCloseTo(1);
    expect(fineSummary.matches.map(({ ordinal }) => ordinal)).toEqual(
      equalSummary.matches.map(({ ordinal }) => ordinal),
    );
    expect(
      summarizeHeroMotionTemporalExcess(
        control,
        fineNoise.map((sample, index) =>
          createSample(sample.frame.sequence, [index, 255, index, 255], {
            frameDt: sample.frame.frameDt,
            panRate: sample.frame.panRate,
          }),
        ),
      ).matches.map(({ activeOrdinal, ordinal }) => [activeOrdinal, ordinal]),
    ).toEqual(
      fineSummary.matches.map(({ activeOrdinal, ordinal }) => [
        activeOrdinal,
        ordinal,
      ]),
    );
  });

  it("rejects Amount evidence below the absolute RMS floor", () => {
    const materiality = evaluateHeroMotionAmountMateriality(0.02, 0.09);

    expect(materiality.absolutePass).toBe(false);
    expect(materiality.relativePass).toBe(true);
    expect(materiality.passes).toBe(false);
  });

  it("rejects weak relative Amount separation", () => {
    const materiality = evaluateHeroMotionAmountMateriality(0.06, 0.114);

    expect(materiality.absolutePass).toBe(true);
    expect(materiality.relativePass).toBe(false);
    expect(materiality.passes).toBe(false);
  });

  it("matches only scalar cadence and motion in monotone order", () => {
    const values = [10, 20, 30, 40];
    const control = [0.05, 0.04, 0.03, 0.02, 0.01].map((panRate, index) =>
      createSample(index + 1, values, { frameDt: 0.05, panRate }),
    );
    const active = [0.04, 0.03, 0.02, 0.01].map((panRate, index) =>
      createSample(index + 1, [...values].reverse(), {
        frameDt: 0.05,
        panRate,
      }),
    );
    const matches = matchHeroMotionPixelPairs(control, active);
    expect(
      matches.map(({ activeOrdinal, ordinal }) => [activeOrdinal, ordinal]),
    ).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    expect(matches.every(({ frameDtDelta }) => frameDtDelta === 0)).toBe(true);
    expect(matches.every(({ panRateDelta }) => panRateDelta === 0)).toBe(true);

    const pixelChanged = active.map((sample, index) =>
      createSample(sample.frame.sequence, [index, 255, index, 255], {
        frameDt: sample.frame.frameDt,
        panRate: sample.frame.panRate,
      }),
    );
    expect(
      matchHeroMotionPixelPairs(control, pixelChanged).map(
        ({ activeOrdinal, ordinal }) => [activeOrdinal, ordinal],
      ),
    ).toEqual(
      matches.map(({ activeOrdinal, ordinal }) => [activeOrdinal, ordinal]),
    );
  });

  it("prioritizes exact frame cadence before a closer Pan rate", () => {
    const active = [
      createSample(1, [0, 0, 0, 0], { frameDt: 0.05, panRate: 0.03 }),
      createSample(2, [1, 1, 1, 1], { frameDt: 0.05, panRate: 0.025 }),
    ];
    const control = [
      createSample(1, [0, 0, 0, 0], {
        frameDt: 0.050_000_5,
        panRate: 0.03,
      }),
      createSample(2, [1, 1, 1, 1], {
        frameDt: 0.050_000_5,
        panRate: 0.025,
      }),
      createSample(3, [255, 0, 255, 0], {
        frameDt: 0.05,
        panRate: 0.029,
      }),
      createSample(4, [0, 255, 0, 255], {
        frameDt: 0.05,
        panRate: 0.024,
      }),
    ];

    const [match] = matchHeroMotionPixelPairs(control, active);
    expect(match?.ordinal).toBe(2);
    expect(match?.frameDtDelta).toBe(0);
    expect(match?.panRateDelta).toBeCloseTo(0.001);
  });

  it("isolates Size correlation after scalar-only joint triple selection", () => {
    const panRates = [0.04, 0.03, 0.02, 0.01];
    const control = panRates.map((panRate, index) =>
      createSample(index + 1, [0, 0, 0, 0], { frameDt: 0.05, panRate }),
    );
    const createActive = (frames: readonly (readonly number[])[]) =>
      panRates.map((panRate, index) =>
        createSample(index + 1, frames[index]!, {
          frameDt: 0.05,
          panRate,
        }),
      );
    const coarse = createActive([
      [0, 0, 0, 0],
      [255, 255, 0, 0],
      [0, 0, 0, 0],
      [255, 255, 0, 0],
    ]);
    const fine = createActive([
      [0, 0, 0, 0],
      [255, 0, 0, 255],
      [0, 0, 0, 0],
      [255, 0, 0, 255],
    ]);
    const first = summarizeHeroMotionSizeTriples(control, fine, coarse);
    const pixelChanged = summarizeHeroMotionSizeTriples(
      control,
      createActive([
        [0, 0, 0, 0],
        [10, 10, 10, 10],
        [20, 20, 20, 20],
        [30, 30, 30, 30],
      ]),
      createActive([
        [0, 0, 0, 0],
        [0, 255, 255, 0],
        [0, 0, 0, 0],
        [0, 255, 255, 0],
      ]),
    );

    expect(first.matches).toHaveLength(3);
    expect(first.coarseCorrelation).toBeGreaterThan(first.fineCorrelation);
    expect(
      first.matches.map(({ coarseOrdinal, controlOrdinal, fineOrdinal }) => [
        controlOrdinal,
        fineOrdinal,
        coarseOrdinal,
      ]),
    ).toEqual(
      pixelChanged.matches.map(
        ({ coarseOrdinal, controlOrdinal, fineOrdinal }) => [
          controlOrdinal,
          fineOrdinal,
          coarseOrdinal,
        ],
      ),
    );
    expect(first.fineCorrelation).not.toBe(pixelChanged.fineCorrelation);
  });

  it("rejects a Size correlation gap that is too small in absolute terms", () => {
    const materiality = evaluateHeroMotionSizeCorrelationMateriality({
      coarseCorrelation: 0.08,
      fineCorrelation: 0.04,
    });

    expect(materiality.absolutePass).toBe(false);
    expect(materiality.relativePass).toBe(true);
    expect(materiality.passes).toBe(false);
  });

  it("rejects weak relative Size correlation separation", () => {
    const materiality = evaluateHeroMotionSizeCorrelationMateriality({
      coarseCorrelation: 0.115,
      fineCorrelation: 0.06,
    });

    expect(materiality.absolutePass).toBe(true);
    expect(materiality.relativePass).toBe(false);
    expect(materiality.passes).toBe(false);
  });

  it("uses every consecutive live pair for a bounded held window", () => {
    const samples = [
      createSample(1, [10, 20, 30, 40]),
      createSample(2, [20, 10, 40, 30]),
      createSample(3, [5, 30, 25, 50]),
      createSample(4, [30, 5, 50, 25]),
    ];

    const summary = summarizeHeroHeldGrainPixelWindow(samples, 2);
    expect(summary.sampleCount).toBe(4);
    expect(summary.grainSize).toBe(2);
    expect(Number.isFinite(summary.temporalResidualNeighborCorrelation)).toBe(
      true,
    );
    expect(() =>
      summarizeHeroHeldGrainPixelWindow(
        [samples[0]!, samples[2]!, samples[3]!, createSample(5, [1, 2, 3, 4])],
        2,
      ),
    ).toThrow(/consecutive/);
  });
});
