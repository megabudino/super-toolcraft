import type { ToolcraftModelImportLimits } from "../schema/types";

const MEBIBYTE = 1024 * 1024;

export const TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS = Object.freeze({
  maxBundleFiles: 32,
  maxDecodedBytes: 128 * MEBIBYTE,
  maxEstimatedWorkerBytes: 256 * MEBIBYTE,
  maxNodes: 10_000,
  maxPrimitives: 10_000,
  maxSourceBytes: 32 * MEBIBYTE,
  maxTriangles: 1_000_000,
  maxVertices: 1_000_000,
} satisfies ToolcraftModelImportLimits);

export const TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS:
  Readonly<ToolcraftModelImportLimits> = TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS;
