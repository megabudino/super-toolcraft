export type ToolcraftVerificationImpactKind =
  | "presentation"
  | "functional"
  | "performance";

export type ToolcraftVerificationImpactOwner = Readonly<{
  acceptanceIds: readonly string[];
  kind: ToolcraftVerificationImpactKind;
  passIds?: readonly string[];
  path: string;
}>;

export type ToolcraftVerificationImpactInventory = Readonly<{
  owners: readonly ToolcraftVerificationImpactOwner[];
  version: 2;
}>;

export type ToolcraftDeliveryCatalog = Readonly<{
  acceptance: readonly Readonly<{
    acceptanceId: string;
    file: string;
    testName: string;
  }>[];
  performance: readonly Readonly<{
    passIds: readonly string[];
    pathId: string;
    testName: string;
  }>[];
  version: 1;
}>;

export type ToolcraftVerificationImpact = Readonly<{
  acceptanceIds: readonly string[];
  browserTestNames: readonly string[];
  kind: ToolcraftVerificationImpactKind;
  performancePassIds: readonly string[];
  performancePathIds: readonly string[];
  performanceTestNames: readonly string[];
  productTestFiles: readonly string[];
}>;

export const TOOLCRAFT_VERIFICATION_IMPACT_VERSION: 2;

export function collectToolcraftProductVerificationSources(
  rootDir: string,
): Promise<Readonly<{
  knownProductResourcePaths: readonly string[];
  requiredProductModulePaths: readonly string[];
  sourceInventory: Readonly<{
    entries: readonly Readonly<{
      absolutePath: string;
      owner: "framework" | "platform" | "product";
      repoPath: string;
      role: "generated" | "production" | "test" | "test-support";
    }>[];
    filesystemViolations: readonly Readonly<{
      reason: string;
      repoPath: string;
    }>[];
  }>;
}>>;

export function validateToolcraftVerificationImpactInventory(
  value: unknown,
  options: {
    catalog: ToolcraftDeliveryCatalog;
    knownProductResourcePaths?: readonly string[];
    requiredProductModulePaths: readonly string[];
  },
): {
  errors: string[];
  inventory?: ToolcraftVerificationImpactInventory;
};

export function readToolcraftVerificationImpactInventory(
  rootDir: string,
  options: {
    catalog: ToolcraftDeliveryCatalog;
    knownProductResourcePaths?: readonly string[];
    requiredProductModulePaths: readonly string[];
  },
): Promise<Readonly<{
  inventory: ToolcraftVerificationImpactInventory;
  path: string;
}>>;

export function resolveToolcraftChangedVerificationImpact(options: {
  catalog: ToolcraftDeliveryCatalog;
  changedFiles: readonly string[];
  graph: Readonly<Record<string, unknown>>;
  inventory: ToolcraftVerificationImpactInventory;
}): ToolcraftVerificationImpact;
