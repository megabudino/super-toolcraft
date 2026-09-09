import type { ToolcraftModelImportLimits } from "../schema/types";
import { TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS } from "./model-import-limit-values";
import type {
  ToolcraftModelSourceBundle,
  ToolcraftModelSourceFile,
} from "./model-import-types";
import {
  createModelSourceBundleDescriptorBudget,
  descriptorInvalid,
  descriptorLimitExceeded,
  readDescriptorAdapter,
  readDescriptorData,
  readDescriptorDigest,
  readDescriptorInteger,
  readDescriptorPath,
  readDescriptorRecord,
  readDescriptorSourceFile,
  type ModelSourceBundleDescriptorBudget,
  type ModelSourceBundleDescriptorRecord,
} from "./model-source-bundle-descriptor-fields";
import { failModelSourceBundle } from "./model-source-bundle-error";
import { digestModelSourceBundle } from "./model-source-digest";
import { sourceExtension } from "./model-source-path";

export type ToolcraftModelSourceBundleDescriptorLimits = Readonly<
  Pick<ToolcraftModelImportLimits, "maxBundleFiles" | "maxSourceBytes">
>;

function sourceFiles(
  value: unknown,
  limits: ToolcraftModelSourceBundleDescriptorLimits,
  budget: ModelSourceBundleDescriptorBudget,
): readonly ToolcraftModelSourceFile[] {
  if (!Array.isArray(value) || value.length === 0) {
    return descriptorInvalid(
      "Model source bundle descriptor sourceFiles must be non-empty.",
    );
  }
  if (value.length > limits.maxBundleFiles) {
    return descriptorLimitExceeded(
      "Model source bundle descriptor exceeds its source file limit.",
    );
  }
  const files: ToolcraftModelSourceFile[] = [];
  const paths = new Set<string>();
  let aggregateByteLength = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) {
      return descriptorInvalid(
        "Model source bundle descriptor sourceFiles is sparse.",
      );
    }
    const file = readDescriptorSourceFile(value[index], budget);
    if (paths.has(file.path)) {
      return descriptorInvalid(
        "Model source bundle descriptor source paths must be unique.",
      );
    }
    if (aggregateByteLength > limits.maxSourceBytes - file.byteLength) {
      return descriptorLimitExceeded(
        "Model source bundle descriptor exceeds its aggregate source byte limit.",
      );
    }
    paths.add(file.path);
    aggregateByteLength += file.byteLength;
    files.push(file);
  }
  return Object.freeze(files);
}

export function snapshotModelSourceBundleDescriptorLimits(
  requested: Partial<ToolcraftModelSourceBundleDescriptorLimits> | undefined,
): ToolcraftModelSourceBundleDescriptorLimits {
  if (
    requested !== undefined &&
    (typeof requested !== "object" || requested === null || Array.isArray(requested))
  ) {
    return descriptorInvalid(
      "Model source bundle descriptor limits must be an object.",
    );
  }
  const allowed = ["maxBundleFiles", "maxSourceBytes"];
  const result = {
    maxBundleFiles: TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS.maxBundleFiles,
    maxSourceBytes: TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS.maxSourceBytes,
  };
  for (const key of Reflect.ownKeys(requested ?? {})) {
    if (typeof key !== "string" || !allowed.includes(key)) {
      return descriptorInvalid(
        "Model source bundle descriptor limit is unsupported.",
      );
    }
    const value = readDescriptorData(
      requested as ModelSourceBundleDescriptorRecord,
      key,
      `limit ${key}`,
    );
    const ceiling = TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS[
      key as keyof ToolcraftModelSourceBundleDescriptorLimits
    ];
    if (!Number.isSafeInteger(value) || (value as number) <= 0 ||
        (value as number) > ceiling) {
      return descriptorInvalid(
        `Model source bundle descriptor limit ${key} is invalid.`,
      );
    }
    result[key as keyof typeof result] = value as number;
  }
  return Object.freeze(result);
}

export function validateToolcraftModelSourceBundleDescriptor(
  value: unknown,
  limits: ToolcraftModelSourceBundleDescriptorLimits,
): ToolcraftModelSourceBundle {
  const candidate = readDescriptorRecord(value, [
    "adapter",
    "aggregateByteLength",
    "aggregateDigest",
    "rootPath",
    "sourceFiles",
  ], "payload");
  const budget = createModelSourceBundleDescriptorBudget();
  const adapter = readDescriptorAdapter(
    readDescriptorData(candidate, "adapter", "adapter"),
    budget,
  );
  const aggregateByteLength = readDescriptorInteger(
    readDescriptorData(candidate, "aggregateByteLength", "aggregate byte length"),
    "aggregate byte length",
  );
  const aggregateDigest = readDescriptorDigest(
    readDescriptorData(candidate, "aggregateDigest", "aggregate digest"),
    "aggregate digest",
    budget,
  );
  const rootPath = readDescriptorPath(
    readDescriptorData(candidate, "rootPath", "root path"),
    "root path",
    budget,
  );
  const files = sourceFiles(
    readDescriptorData(candidate, "sourceFiles", "source files"),
    limits,
    budget,
  );
  const actualByteLength = files.reduce(
    (total, file) => total + file.byteLength,
    0,
  );
  if (
    actualByteLength !== aggregateByteLength ||
    !files.some(({ path }) => path === rootPath) ||
    sourceExtension(rootPath) !== adapter.rootExtension
  ) {
    return descriptorInvalid(
      "Model source bundle descriptor aggregate or root is invalid.",
    );
  }
  if (digestModelSourceBundle(adapter, rootPath, files) !== aggregateDigest) {
    return failModelSourceBundle(
      "bundle",
      "source-bundle-digest-mismatch",
      "Model source bundle descriptor digest does not match its metadata.",
    );
  }
  return Object.freeze({
    adapter,
    aggregateByteLength,
    aggregateDigest,
    rootPath,
    sourceFiles: files,
  });
}
