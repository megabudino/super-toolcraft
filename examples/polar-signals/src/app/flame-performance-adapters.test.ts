import { expect, it } from 'vitest';
import { flamePerformancePaths } from './app-performance';
import { appSchema } from './app-schema';
import { appPerformanceCanvasBacking, appPerformancePathAdapters } from '../../e2e/app-performance-path-adapters';
import { compileToolcraftPerformancePathAdapterMatrix } from '../../e2e/performance-path-adapter-matrix';

it('binds every derived flame path to real UI and compiled fixture adapters', () => {
  const matrix = compileToolcraftPerformancePathAdapterMatrix({ adapters: appPerformancePathAdapters, canvasBacking: appPerformanceCanvasBacking, paths: flamePerformancePaths, schema: appSchema });
  expect(matrix).toHaveLength(flamePerformancePaths.length);
  for (const entry of matrix) expect(!!entry.adapter.fixtureApplications).toBe(entry.path.workloadDimensions.length > 0);
});
