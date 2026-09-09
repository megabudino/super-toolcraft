export type ToolcraftPerformanceImpactModule =
  | Readonly<{ kind: "functional"; path: string }>
  | Readonly<{ kind: "performance"; passIds: readonly string[]; path: string }>;

export type ToolcraftPerformanceImpactInventory = Readonly<{
  modules: readonly ToolcraftPerformanceImpactModule[];
  version: 1;
}>;

export const TOOLCRAFT_PERFORMANCE_IMPACT_VERSION: 1;

export function validateToolcraftPerformanceImpactInventory(
  value: unknown,
  options?: Readonly<{
    knownPassIds?: readonly string[];
    productProductionPaths?: readonly string[];
  }>,
): Readonly<{
  errors: string[];
  inventory: ToolcraftPerformanceImpactInventory | undefined;
}>;

export function readToolcraftPerformanceImpactInventory(
  rootDir: string,
  options?: Readonly<{
    knownPassIds?: readonly string[];
    productProductionPaths?: readonly string[];
  }>,
): Promise<Readonly<{
  inventory: ToolcraftPerformanceImpactInventory;
  path: string;
}>>;

export function resolveToolcraftChangedPerformanceImpact(input: Readonly<{
  changedFiles: readonly string[];
  inventory: ToolcraftPerformanceImpactInventory;
}>): Readonly<{
  minimumTier: number;
  performancePassIds: readonly string[];
  requiresFunctionalBrowser: boolean;
}>;
