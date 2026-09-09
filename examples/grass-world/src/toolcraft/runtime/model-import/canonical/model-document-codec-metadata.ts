import type {
  ToolcraftModelBounds,
  ToolcraftModelCanonicalizationProvenance,
  ToolcraftModelDocument,
} from "./model-document";
import type { ToolcraftCanonicalModelLimits } from "./model-document-limits";
import { throwModelDocumentCodecError } from "./model-document-codec-error";
import { validateModelDocumentPayloadLayout } from "./model-document-codec-layout";
import { preflightModelDocumentMetadata } from "./model-document-codec-metadata-preflight";
import { isDenseArray, isRecord } from "./model-document-validation-helpers";

export type ModelDocumentArraySliceMetadata = {
  count: number;
  offset: number;
};

export type ModelDocumentMetadata = {
  bounds: ToolcraftModelBounds;
  nodes: readonly {
    children: readonly string[];
    id: string;
    localMatrix: readonly number[];
    name: string;
    primitiveIds: readonly string[];
  }[];
  primitives: readonly {
    bounds: ToolcraftModelBounds;
    id: string;
    indices: ModelDocumentArraySliceMetadata;
    normals: ModelDocumentArraySliceMetadata | null;
    positions: ModelDocumentArraySliceMetadata;
  }[];
  provenance: ToolcraftModelCanonicalizationProvenance;
  rootNodeIds: readonly string[];
  version: 1;
};

function canonicalBounds(value: ToolcraftModelBounds): ToolcraftModelBounds {
  return { max: [...value.max], min: [...value.min] };
}

function canonicalProvenance(
  value: ToolcraftModelCanonicalizationProvenance,
): ToolcraftModelCanonicalizationProvenance {
  return {
    adapterVersion: value.adapterVersion,
    canonicalSchemaVersion: value.canonicalSchemaVersion,
    operations: [...value.operations],
    ...(value.repair !== undefined
      ? {
          repair: {
            algorithmVersion: value.repair.algorithmVersion,
            operations: [...value.repair.operations],
            planDigest: value.repair.planDigest,
            recipeId: value.repair.recipeId,
          },
        }
      : {}),
    sourceFormat: value.sourceFormat,
  };
}

export function createModelDocumentMetadata(
  document: ToolcraftModelDocument,
): ModelDocumentMetadata {
  let indexOffset = 0;
  let normalOffset = 0;
  let positionOffset = 0;

  return {
    bounds: canonicalBounds(document.bounds),
    nodes: document.nodes.map((node) => ({
      children: [...node.children],
      id: node.id,
      localMatrix: [...node.localMatrix],
      name: node.name,
      primitiveIds: [...node.primitiveIds],
    })),
    primitives: document.primitives.map((primitive) => {
      const metadata = {
        bounds: canonicalBounds(primitive.bounds),
        id: primitive.id,
        indices: { count: primitive.indices.length, offset: indexOffset },
        normals:
          primitive.normals === undefined
            ? null
            : { count: primitive.normals.length, offset: normalOffset },
        positions: {
          count: primitive.positions.length,
          offset: positionOffset,
        },
      };

      indexOffset += primitive.indices.length;
      normalOffset += primitive.normals?.length ?? 0;
      positionOffset += primitive.positions.length;
      return metadata;
    }),
    provenance: canonicalProvenance(document.provenance),
    rootNodeIds: [...document.rootNodeIds],
    version: document.version,
  };
}

export function encodeModelDocumentMetadata(
  metadata: ModelDocumentMetadata,
): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(metadata));
}

function metadataShape(path: string, message: string): never {
  throwModelDocumentCodecError("invalid-metadata-shape", path, message);
}

function readString(value: unknown, path: string): string {
  if (typeof value !== "string") {
    metadataShape(path, `${path} must be a string.`);
  }
  return value;
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    metadataShape(path, `${path} must be a finite number.`);
  }
  return value;
}

function readStringArray(value: unknown, path: string): readonly string[] {
  if (!isDenseArray(value)) {
    metadataShape(path, `${path} must be a dense array.`);
  }
  return value.map((entry, index) => readString(entry, `${path}[${index}]`));
}

function readNumberArray(value: unknown, path: string): readonly number[] {
  if (!isDenseArray(value)) {
    metadataShape(path, `${path} must be a dense array.`);
  }
  return value.map((entry, index) => readNumber(entry, `${path}[${index}]`));
}

function readFixedNumberArray(
  value: unknown,
  path: string,
  length: number,
): readonly number[] {
  if (!Array.isArray(value) || value.length !== length) {
    metadataShape(path, `${path} must contain exactly ${length} values.`);
  }
  return readNumberArray(value, path);
}

function readBounds(value: unknown, path: string): ToolcraftModelBounds {
  if (!isRecord(value)) {
    metadataShape(path, `${path} must be an object.`);
  }
  const max = readFixedNumberArray(value.max, `${path}.max`, 3);
  const min = readFixedNumberArray(value.min, `${path}.min`, 3);
  return {
    max: max as [number, number, number],
    min: min as [number, number, number],
  };
}

function readSafeInteger(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throwModelDocumentCodecError(
      "unsafe-metadata-integer",
      path,
      `${path} must be a nonnegative safe integer.`,
    );
  }
  return value as number;
}

function readSlice(
  value: unknown,
  path: string,
): ModelDocumentArraySliceMetadata {
  if (!isRecord(value)) {
    metadataShape(path, `${path} must be an array slice object.`);
  }
  return {
    count: readSafeInteger(value.count, `${path}.count`),
    offset: readSafeInteger(value.offset, `${path}.offset`),
  };
}

function readProvenance(value: unknown): ToolcraftModelCanonicalizationProvenance {
  if (!isRecord(value)) {
    metadataShape("provenance", "provenance must be an object.");
  }
  const operations = readStringArray(value.operations, "provenance.operations");
  let repair: ToolcraftModelCanonicalizationProvenance["repair"];

  if (value.repair !== undefined) {
    if (!isRecord(value.repair)) {
      metadataShape("provenance.repair", "provenance.repair must be an object.");
    }
    repair = {
      algorithmVersion: readString(
        value.repair.algorithmVersion,
        "provenance.repair.algorithmVersion",
      ),
      operations: readStringArray(
        value.repair.operations,
        "provenance.repair.operations",
      ) as NonNullable<ToolcraftModelCanonicalizationProvenance["repair"]>["operations"],
      planDigest: readString(
        value.repair.planDigest,
        "provenance.repair.planDigest",
      ),
      recipeId: readString(value.repair.recipeId, "provenance.repair.recipeId"),
    };
  }

  return {
    adapterVersion: readString(value.adapterVersion, "provenance.adapterVersion"),
    canonicalSchemaVersion: readNumber(
      value.canonicalSchemaVersion,
      "provenance.canonicalSchemaVersion",
    ) as 1,
    operations: operations as ToolcraftModelCanonicalizationProvenance["operations"],
    ...(repair !== undefined ? { repair } : {}),
    sourceFormat: readString(
      value.sourceFormat,
      "provenance.sourceFormat",
    ) as ToolcraftModelCanonicalizationProvenance["sourceFormat"],
  };
}

export function decodeModelDocumentMetadata(
  bytes: Uint8Array,
  sectionByteLengths: { indices: number; normals: number; positions: number },
  limits: ToolcraftCanonicalModelLimits,
): ModelDocumentMetadata {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throwModelDocumentCodecError(
      "non-canonical-metadata",
      "metadata",
      "Canonical metadata must not contain a UTF-8 byte-order mark.",
    );
  }

  let source: string;
  try {
    source = new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(bytes);
  } catch {
    throwModelDocumentCodecError(
      "invalid-metadata-encoding",
      "metadata",
      "Canonical metadata is not valid UTF-8.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(source) as unknown;
  } catch {
    throwModelDocumentCodecError(
      "malformed-metadata",
      "metadata",
      "Canonical metadata is not valid JSON.",
    );
  }

  preflightModelDocumentMetadata(parsed, limits);

  const metadata: ModelDocumentMetadata = {
    bounds: readBounds(parsed.bounds, "bounds"),
    nodes: parsed.nodes.map((entry, index) => {
      const path = `nodes[${index}]`;
      if (!isRecord(entry)) {
        metadataShape(path, `${path} must be an object.`);
      }
      return {
        children: readStringArray(entry.children, `${path}.children`),
        id: readString(entry.id, `${path}.id`),
        localMatrix: readFixedNumberArray(
          entry.localMatrix,
          `${path}.localMatrix`,
          16,
        ),
        name: readString(entry.name, `${path}.name`),
        primitiveIds: readStringArray(entry.primitiveIds, `${path}.primitiveIds`),
      };
    }),
    primitives: parsed.primitives.map((entry, index) => {
      const path = `primitives[${index}]`;
      if (!isRecord(entry)) {
        metadataShape(path, `${path} must be an object.`);
      }
      return {
        bounds: readBounds(entry.bounds, `${path}.bounds`),
        id: readString(entry.id, `${path}.id`),
        indices: readSlice(entry.indices, `${path}.indices`),
        normals:
          entry.normals === null
            ? null
            : readSlice(entry.normals, `${path}.normals`),
        positions: readSlice(entry.positions, `${path}.positions`),
      };
    }),
    provenance: readProvenance(parsed.provenance),
    rootNodeIds: readStringArray(parsed.rootNodeIds, "rootNodeIds"),
    version: readNumber(parsed.version, "version") as 1,
  };

  validateModelDocumentPayloadLayout(metadata, sectionByteLengths, limits);
  if (JSON.stringify(metadata) !== source) {
    throwModelDocumentCodecError(
      "non-canonical-metadata",
      "metadata",
      "Canonical metadata keys or values are not in stable encoded form.",
    );
  }

  return metadata;
}
