import type { TestInfo } from "@playwright/test";

import { parseToolcraftBrowserRuntimeEvidence } from "../src/app/test-evidence/browser-runtime-contract";
import type {
  ToolcraftModelIdentityObservation,
  ToolcraftModelImportBrowserObservation,
  ToolcraftModelOutputObservation,
} from "./browser-model-import-evidence-helpers";

export const advertisedFormats = ["glb", "gltf", "fbx", "obj", "stl", "ply"];
export const cleanIdentity = {
  assetId: "model-clean",
  documentId: "document-clean",
};
export const repairedIdentity = {
  assetId: "model-repaired",
  documentId: "document-repaired",
};
export const emptyRepair = {
  available: false,
  diagnosisSignature: null,
  geometrySignature: null,
  progress: null,
  verification: null,
} as const;

export function output(
  identity: ToolcraftModelIdentityObservation,
  suffix: string,
  opacity: number,
): ToolcraftModelOutputObservation {
  return {
    documentId: identity.documentId,
    modelSignature: identity.assetId,
    opacity,
    outputSignature: `output-${suffix}`,
    pixelSignature: `pixels-${suffix}`,
  };
}

export function state(
  overrides: Partial<ToolcraftModelImportBrowserObservation> = {},
): ToolcraftModelImportBrowserObservation {
  return {
    active: null,
    advertisedFormats,
    attemptFormat: null,
    draft: null,
    exportOutput: null,
    lifecycle: "empty",
    persistenceState: "none",
    previewOutput: null,
    rejection: null,
    repair: emptyRepair,
    unavailableReason: null,
    ...overrides,
  };
}

export function modelEvidence(testInfo: TestInfo, startIndex: number) {
  return testInfo.attachments
    .slice(startIndex)
    .map((attachment) => parseToolcraftBrowserRuntimeEvidence(attachment))
    .filter((entry) => entry?.evidenceType.startsWith("model-"));
}
