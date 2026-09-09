import type {
  ResolvedToolcraftModelFileDropSchema,
  ToolcraftModelFormat,
  ToolcraftModelFileDropSchema,
  ToolcraftModelImportLimits,
  ToolcraftModelTopologyProfile,
} from "../schema/types";
import { TOOLCRAFT_ADVERTISED_MODEL_FORMATS } from "./formats/production-model-format-registry";
import {
  TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS,
  TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS,
} from "./model-import-limit-values";

export {
  TOOLCRAFT_ADVERTISED_MODEL_FORMATS,
  TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS,
  TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS,
};

const advertisedModelFormatSet: ReadonlySet<string> = new Set(
  TOOLCRAFT_ADVERTISED_MODEL_FORMATS,
);
const modelImportLimitNames = Object.keys(
  TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS,
) as (keyof ToolcraftModelImportLimits)[];
const modelImportLimitNameSet: ReadonlySet<string> = new Set(
  modelImportLimitNames,
);
const topologyProfiles: ReadonlySet<string> = new Set([
  "realtime-mesh",
  "solid-mesh",
] satisfies readonly ToolcraftModelTopologyProfile[]);

function isAdvertisedModelFormat(
  format: unknown,
): format is ToolcraftModelFormat {
  return (
    typeof format === "string" && advertisedModelFormatSet.has(format)
  );
}

function normalizeModelFormats(
  formats: readonly ToolcraftModelFormat[] | undefined,
): readonly ToolcraftModelFormat[] {
  if (formats === undefined) {
    return [...TOOLCRAFT_ADVERTISED_MODEL_FORMATS];
  }

  if (!Array.isArray(formats)) {
    throw new Error(
      "Toolcraft model fileDrop modelFormats must be an array of advertised model formats.",
    );
  }

  const normalizedFormats: ToolcraftModelFormat[] = [];

  for (let index = 0; index < formats.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(formats, index)) {
      throw new Error(
        `Toolcraft model fileDrop modelFormats cannot contain a sparse entry at index ${index}.`,
      );
    }

    const format = formats[index];

    if (!isAdvertisedModelFormat(format)) {
      throw new Error(
        `Toolcraft model fileDrop modelFormats has unsupported model format "${String(format)}"; supported formats are ${TOOLCRAFT_ADVERTISED_MODEL_FORMATS.join(", ")}.`,
      );
    }

    normalizedFormats.push(format);
  }

  return normalizedFormats;
}

export function normalizeToolcraftModelImportLimits(
  limits: Partial<ToolcraftModelImportLimits> | undefined,
): ToolcraftModelImportLimits {
  if (
    limits !== undefined &&
    (limits === null || typeof limits !== "object" || Array.isArray(limits))
  ) {
    throw new Error(
      "Toolcraft model fileDrop modelLimits must be an object of finite positive limits.",
    );
  }

  const providedLimits = limits ?? {};
  const providedLimitNames = Reflect.ownKeys(providedLimits);
  const normalizedLimits: ToolcraftModelImportLimits = {
    maxBundleFiles: TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS.maxBundleFiles,
    maxDecodedBytes: TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS.maxDecodedBytes,
    maxEstimatedWorkerBytes:
      TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS.maxEstimatedWorkerBytes,
    maxNodes: TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS.maxNodes,
    maxPrimitives: TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS.maxPrimitives,
    maxSourceBytes: TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS.maxSourceBytes,
    maxTriangles: TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS.maxTriangles,
    maxVertices: TOOLCRAFT_DEFAULT_MODEL_IMPORT_LIMITS.maxVertices,
  };

  for (const providedLimitName of providedLimitNames) {
    if (
      typeof providedLimitName !== "string" ||
      !modelImportLimitNameSet.has(providedLimitName)
    ) {
      throw new Error(
        `Toolcraft model fileDrop has unsupported model limit "${String(providedLimitName)}".`,
      );
    }

    const limitName = providedLimitName as keyof ToolcraftModelImportLimits;
    const limit = providedLimits[limitName];
    const ceiling = TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS[limitName];

    if (
      typeof limit !== "number" ||
      !Number.isSafeInteger(limit) ||
      limit <= 0
    ) {
      throw new Error(
        `Toolcraft model fileDrop limit ${limitName} must be finite and positive safe integer.`,
      );
    }

    if (limit > ceiling) {
      throw new Error(
        `Toolcraft model fileDrop limit ${limitName} exceeds protected ceiling ${ceiling}.`,
      );
    }

    normalizedLimits[limitName] = limit;
  }

  return normalizedLimits;
}

function normalizeTopologyProfile(
  topologyProfile: ToolcraftModelTopologyProfile | undefined,
): ToolcraftModelTopologyProfile {
  const normalizedProfile = topologyProfile ?? "realtime-mesh";

  if (!topologyProfiles.has(normalizedProfile)) {
    throw new Error(
      `Toolcraft model fileDrop has unsupported topologyProfile "${String(normalizedProfile)}".`,
    );
  }

  return normalizedProfile;
}

export function normalizeToolcraftModelFileDrop(
  control: ToolcraftModelFileDropSchema,
): ResolvedToolcraftModelFileDropSchema {
  const multiple: unknown = control.multiple;

  if (multiple !== undefined && multiple !== false) {
    throw new Error(
      `Toolcraft model fileDrop [model-filedrop-multiple]: multiple ${String(multiple)} is invalid; expected undefined or false.`,
    );
  }

  return {
    ...control,
    assetKind: "model",
    modelFormats: normalizeModelFormats(control.modelFormats),
    modelLimits: normalizeToolcraftModelImportLimits(control.modelLimits),
    multiple: false,
    topologyProfile: normalizeTopologyProfile(control.topologyProfile),
  };
}
