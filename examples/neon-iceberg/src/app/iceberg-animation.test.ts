import { describe, expect, test } from 'vitest';
import {
  getIcebergPlateSeparationProgress,
  readAnimatedIcebergSettings,
} from './iceberg-animation';

const timeline = {
  currentTimeSeconds: 0,
  durationSeconds: 1.2,
  isLooping: false,
};

describe('iceberg plate separation animation', () => {
  test('starts closed, moves quickly, and settles at the selected gap', () => {
    expect(getIcebergPlateSeparationProgress(timeline)).toBe(0);
    expect(
      getIcebergPlateSeparationProgress({ ...timeline, currentTimeSeconds: 0.3 }),
    ).toBeGreaterThan(0.65);
    expect(
      getIcebergPlateSeparationProgress({ ...timeline, currentTimeSeconds: 0.6 }),
    ).toBeGreaterThan(0.9);
    expect(
      getIcebergPlateSeparationProgress({ ...timeline, currentTimeSeconds: 1.2 }),
    ).toBe(1);

    const values = { 'iceberg.plateGap': 0.2 };
    expect(readAnimatedIcebergSettings(values, timeline).plateGap).toBe(0);
    expect(
      readAnimatedIcebergSettings(values, {
        ...timeline,
        currentTimeSeconds: 1.2,
      }).plateGap,
    ).toBe(0.2);
  });

  test('maps the exact loop seam back to the closed start frame', () => {
    expect(
      getIcebergPlateSeparationProgress({
        ...timeline,
        currentTimeSeconds: 1.2,
        isLooping: true,
      }),
    ).toBe(0);
    expect(
      getIcebergPlateSeparationProgress({
        ...timeline,
        currentTimeSeconds: 1.19,
        isLooping: true,
      }),
    ).toBeCloseTo(1, 6);
  });
});
