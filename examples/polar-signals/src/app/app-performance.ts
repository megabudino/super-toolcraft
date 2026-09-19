import { defineToolcraftPerformance, deriveToolcraftPerformancePaths, type ToolcraftPerformanceScenario } from '@/toolcraft/runtime';
import { flamePerformanceModel } from '../flame/flame-performance-model';
import { appSchema } from './app-schema';
export const flamePerformancePaths = deriveToolcraftPerformancePaths(appSchema, flamePerformanceModel);
export const appPerformance = defineToolcraftPerformance({
  ...flamePerformanceModel,
  scenarios: flamePerformancePaths.map((path, index): ToolcraftPerformanceScenario => ({
    id: `flame-path-${index}`, pathId: path.id, coversTargets: path.targets, interaction: path.interaction,
    automated: true, automatedTestName: 'flame render plan has valid derived paths and fixtures',
    browser: true, browserTestName: `browser perf: toolcraft path ${path.id}`,
    expectedObservable: 'The graph frame, viewport or decoded artifact reflects the exact applied operation.',
    fixture: 'Compiled reachable flame workload', uiSelector: '[data-testid="flame-output"]',
    ...(path.interaction === 'export' ? { actionValue: 'export.png', controlLabel: 'Export PNG', completionEvidence: 'download' as const } : {}),
  } as ToolcraftPerformanceScenario)),
});
