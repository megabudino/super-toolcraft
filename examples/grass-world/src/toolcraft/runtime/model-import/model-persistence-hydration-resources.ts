import type { ToolcraftBinaryAssetRepository } from "../source-assets/repository/binary-asset-repository";
import type { ToolcraftModelAsset } from "../state/types";
import { TOOLCRAFT_MODEL_DOCUMENT_CONTENT_TYPE } from "./model-source-asset-handler-resources";
import {
  parseToolcraftModelRepairPlanResourceRef,
  TOOLCRAFT_MODEL_REPAIR_PLAN_CONTENT_TYPE,
} from "./model-source-asset-handler-resources";
import { TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS } from "./model-import-limit-values";
import {
  decodeToolcraftModelSourceBundleDescriptor,
  TOOLCRAFT_MODEL_SOURCE_BUNDLE_DESCRIPTOR_CONTENT_TYPE,
} from "./model-source-bundle-codec";
import type {
  ToolcraftModelSourceBundle,
  ToolcraftModelSourceBundleTransfer,
} from "./model-import-types";
import { sha256ToolcraftModelWorkerBytes } from "./worker/model-import-worker-result-verification";
import { decodeToolcraftModelRepairPlanEnvelope } from "./topology/model-repair-plan-codec";
import type { ToolcraftModelTopologyProfile } from "../schema/types";

export type ToolcraftPersistedModelLifecycle =
  | "clean"
  | "fixed"
  | "repairable";

function abortIfRequested(signal: AbortSignal): void {
  if (!signal.aborted) return;
  const error = new Error("Model hydration was cancelled.");
  error.name = "AbortError";
  throw error;
}

function ownedBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

export function inferToolcraftPersistedModelLifecycle(
  asset: ToolcraftModelAsset,
): ToolcraftPersistedModelLifecycle {
  if (asset.appliedRepairRecipeId || asset.repairedDocumentRef) return "fixed";
  return asset.analysis.outcome === "repairable" ? "repairable" : "clean";
}

export async function hasValidToolcraftModelDocumentResource(
  repository: ToolcraftBinaryAssetRepository,
  ref: string,
  signal: AbortSignal,
): Promise<boolean> {
  abortIfRequested(signal);
  const entry = await repository.get(ref);
  abortIfRequested(signal);
  if (!entry || entry.contentType !== TOOLCRAFT_MODEL_DOCUMENT_CONTENT_TYPE) {
    return false;
  }
  const expectedDigest = ref.startsWith("toolcraft:model-document:")
    ? ref.slice("toolcraft:model-document:".length)
    : null;
  if (!expectedDigest) return false;
  return await sha256ToolcraftModelWorkerBytes(ownedBytes(entry.bytes)) ===
    expectedDigest;
}

export async function hasValidToolcraftModelRepairPlanResource(
  repository: ToolcraftBinaryAssetRepository,
  ref: string,
  topologyProfile: ToolcraftModelTopologyProfile,
  signal: AbortSignal,
): Promise<boolean> {
  abortIfRequested(signal);
  const identity = parseToolcraftModelRepairPlanResourceRef(ref);
  if (!identity) return false;
  const entry = await repository.get(ref);
  abortIfRequested(signal);
  if (
    !entry ||
    entry.ref !== ref ||
    entry.contentType !== TOOLCRAFT_MODEL_REPAIR_PLAN_CONTENT_TYPE ||
    await sha256ToolcraftModelWorkerBytes(ownedBytes(entry.bytes)) !==
      identity.envelopeDigest
  ) {
    return false;
  }
  try {
    decodeToolcraftModelRepairPlanEnvelope(entry.bytes, {
      expectedPlanDigest: identity.planDigest,
      expectedProfile: topologyProfile,
      limits: TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS,
    });
    return true;
  } catch {
    return false;
  }
}

async function readSourceFile(
  repository: ToolcraftBinaryAssetRepository,
  file: ToolcraftModelSourceBundle["sourceFiles"][number],
  signal: AbortSignal,
): Promise<ToolcraftModelSourceBundleTransfer["sourceFiles"][number]> {
  abortIfRequested(signal);
  const entry = await repository.get(file.resourceRef);
  abortIfRequested(signal);
  if (
    !entry ||
    entry.ref !== file.resourceRef ||
    entry.contentType !== file.mimeType ||
    entry.bytes.byteLength !== file.byteLength ||
    await sha256ToolcraftModelWorkerBytes(ownedBytes(entry.bytes)) !==
      file.contentDigest
  ) {
    throw new Error(`Model source resource "${file.path}" is unavailable.`);
  }
  return Object.freeze({
    bytes: ownedBytes(entry.bytes).buffer,
    contentDigest: file.contentDigest,
    mimeType: file.mimeType,
    path: file.path,
  });
}

export async function readToolcraftModelSourceBundleForHydration(
  repository: ToolcraftBinaryAssetRepository,
  asset: ToolcraftModelAsset,
  signal: AbortSignal,
): Promise<Readonly<{
  bundle: ToolcraftModelSourceBundle;
  transfer: ToolcraftModelSourceBundleTransfer;
}>> {
  abortIfRequested(signal);
  const descriptor = await repository.get(asset.sourceBundleRef);
  abortIfRequested(signal);
  if (
    !descriptor ||
    descriptor.ref !== asset.sourceBundleRef ||
    descriptor.contentType !==
      TOOLCRAFT_MODEL_SOURCE_BUNDLE_DESCRIPTOR_CONTENT_TYPE
  ) {
    throw new Error("The model source bundle is unavailable.");
  }
  const bundle = decodeToolcraftModelSourceBundleDescriptor(descriptor.bytes);
  if (bundle.aggregateDigest !== asset.sourceBundleDigest) {
    throw new Error("The model source bundle identity does not match state.");
  }
  const sourceFiles = [];
  for (const file of bundle.sourceFiles) {
    sourceFiles.push(await readSourceFile(repository, file, signal));
  }
  return Object.freeze({
    bundle,
    transfer: Object.freeze({
      aggregateDigest: bundle.aggregateDigest,
      rootPath: bundle.rootPath,
      sourceFiles: Object.freeze(sourceFiles),
    }),
  });
}
