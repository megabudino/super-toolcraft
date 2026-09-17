import { expect, test } from 'vitest';
import { readIcebergSettings } from './iceberg-controls';
import { ICEBERG_PLATE_COUNT, getIcebergPlateOffset, getIcebergPlateThickness } from './iceberg-plates';
import { createIcebergTopology } from './iceberg-topology';

test('four lower plates have equal closed topology and equal vertical gaps', () => {
  const geometry = createIcebergTopology();
  const slices = geometry.getAttribute('slice');
  const regions = geometry.getAttribute('region');
  for (let slice = 0; slice < ICEBERG_PLATE_COUNT; slice++) {
    const counts = new Map<number, number>();
    for (let i = 0; i < slices.count; i++) if (slices.getX(i) === slice) {
      const region = regions.getX(i);
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
    expect(Object.fromEntries(counts)).toEqual({ 1: 16, 2: 4, 3: 4 });
  }
  const settings = readIcebergSettings({});
  const thickness = getIcebergPlateThickness(settings);
  const gap = 0.2;
  for (let slice = 0; slice < ICEBERG_PLATE_COUNT - 1; slice++) {
    const top = -settings.depth + (slice + 1) * thickness + getIcebergPlateOffset(slice, gap);
    const nextBottom = -settings.depth + (slice + 1) * thickness + getIcebergPlateOffset(slice + 1, gap);
    expect(nextBottom - top).toBeCloseTo(gap, 10);
  }
  const lastTop = -settings.depth + ICEBERG_PLATE_COUNT * thickness + getIcebergPlateOffset(ICEBERG_PLATE_COUNT - 1, gap);
  const upperBottom = -settings.depth + ICEBERG_PLATE_COUNT * thickness;
  expect(upperBottom - lastTop).toBeCloseTo(gap, 10);
  geometry.dispose();
});

test('plate thickness remains positive across the reachable base envelope', () => {
  for (const values of [
    {},
    { 'iceberg.depth': 0.65, 'iceberg.seamLevel': -0.35, 'iceberg.seamValley': 1.8, 'iceberg.seamVariation': 0.85 },
    { 'iceberg.depth': 2.5, 'iceberg.seamLevel': 0.6, 'iceberg.seamValley': 0, 'iceberg.seamVariation': 0 },
  ]) expect(getIcebergPlateThickness(readIcebergSettings(values))).toBeGreaterThan(0);
});
