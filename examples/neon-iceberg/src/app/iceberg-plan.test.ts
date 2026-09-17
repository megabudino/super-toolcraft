import { expect, test } from 'vitest';
import { icebergRenderAssessment, icebergPerformancePaths } from './app-performance';
test('iceberg render plan has no structural errors', () => {
  expect(icebergRenderAssessment.errors).toEqual([]);
  expect(icebergPerformancePaths.length).toBeGreaterThan(0);
});
