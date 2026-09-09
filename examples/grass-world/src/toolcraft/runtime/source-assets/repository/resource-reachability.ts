import type { ToolcraftResourceManifest } from "./resource-manifest";
import type { ToolcraftDefaultMediaAssetSchema } from "../../schema/types";

type ToolcraftModelResourceFields = {
  activeDocumentRef?: unknown;
  analysis?: unknown;
  originalAnalysis?: unknown;
  originalDocumentRef?: unknown;
  repairPlanRef?: unknown;
  repairedDocumentRef?: unknown;
  sourceBundleRef?: unknown;
};

type ToolcraftResourceHistoryPatch = {
  after: Record<string, unknown>;
  before: Record<string, unknown>;
};

export type ToolcraftResourceReachabilityState = {
  history: {
    redo: readonly ToolcraftResourceHistoryPatch[];
    undo: readonly ToolcraftResourceHistoryPatch[];
  };
  mediaAssets: readonly unknown[];
  schema: {
    media: {
      defaultAssets: readonly ToolcraftDefaultMediaAssetSchema[];
    };
  };
};

export type ToolcraftActiveResourceJob = ToolcraftModelResourceFields & {
  [field: string]: unknown;
  manifest?: ToolcraftResourceManifest;
  stagedResourceRefs: readonly string[];
};

export type ToolcraftResourceReachabilityInput = {
  activeJobs?: readonly ToolcraftActiveResourceJob[];
  activePersistenceManifest?: ToolcraftResourceManifest | null;
  defaultResourceManifest?: ToolcraftResourceManifest | null;
  defaultResourceRefs?: readonly string[];
  state: ToolcraftResourceReachabilityState;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addRef(refs: Set<string>, value: unknown): void {
  if (typeof value === "string" && value.length > 0) {
    refs.add(value);
  }
}

function addRepairPlanRef(refs: Set<string>, value: unknown): void {
  if (isRecord(value)) {
    addRef(refs, value.repairPlanRef);
  }
}

function addModelResourceRefs(
  refs: Set<string>,
  value: ToolcraftModelResourceFields,
): void {
  addRef(refs, value.sourceBundleRef);
  addRef(refs, value.originalDocumentRef);
  addRef(refs, value.activeDocumentRef);
  addRef(refs, value.repairedDocumentRef);
  addRef(refs, value.repairPlanRef);
  addRepairPlanRef(refs, value.analysis);
  addRepairPlanRef(refs, value.originalAnalysis);
}

function addModelAssets(refs: Set<string>, value: unknown): void {
  if (!Array.isArray(value)) {
    return;
  }

  for (const asset of value) {
    if (isRecord(asset) && asset.assetKind === "model") {
      addModelResourceRefs(refs, asset);
    }
  }
}

function addManifestRefs(
  refs: Set<string>,
  manifest: ToolcraftResourceManifest | null | undefined,
): void {
  if (!manifest) {
    return;
  }

  for (const ref of manifest.durableSourceRefs) {
    addRef(refs, ref);
  }
  for (const ref of manifest.canonicalDocumentRefs) {
    addRef(refs, ref);
  }
  for (const ref of manifest.derivedResourceRefs) {
    addRef(refs, ref);
  }
}

function addHistoryRefs(
  refs: Set<string>,
  patches: readonly ToolcraftResourceHistoryPatch[],
): void {
  for (const patch of patches) {
    addModelAssets(refs, patch.before.mediaAssets);
    addModelAssets(refs, patch.after.mediaAssets);
  }
}

export function collectToolcraftReachableResourceRefs(
  input: ToolcraftResourceReachabilityInput,
): ReadonlySet<string> {
  const refs = new Set<string>();

  addModelAssets(refs, input.state.mediaAssets);
  // Model defaults currently contain serialized sourceFiles data URLs, not
  // repository refs. Default hydration reports repository ownership explicitly.
  void input.state.schema.media.defaultAssets;
  addHistoryRefs(refs, input.state.history.undo);
  addHistoryRefs(refs, input.state.history.redo);

  for (const ref of input.defaultResourceRefs ?? []) {
    addRef(refs, ref);
  }
  addManifestRefs(refs, input.defaultResourceManifest);

  for (const job of input.activeJobs ?? []) {
    addModelResourceRefs(refs, job);
    for (const ref of job.stagedResourceRefs) {
      addRef(refs, ref);
    }
    addManifestRefs(refs, job.manifest);
  }

  addManifestRefs(refs, input.activePersistenceManifest);
  return new Set([...refs].sort());
}
