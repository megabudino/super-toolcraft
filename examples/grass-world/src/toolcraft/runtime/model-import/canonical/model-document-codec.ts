import type { ToolcraftModelImportLimits } from "../../schema/types";
import type { ToolcraftModelDocument } from "./model-document";
import { throwModelDocumentCodecError } from "./model-document-codec-error";
import {
  decodeModelDocumentEnvelope,
  encodeModelDocumentEnvelope,
} from "./model-document-codec-envelope";
import { MODEL_DOCUMENT_CODEC_PAYLOAD_OFFSET } from "./model-document-codec-format";
import {
  createModelDocumentMetadata,
  decodeModelDocumentMetadata,
  encodeModelDocumentMetadata,
} from "./model-document-codec-metadata";
import {
  decodeModelDocumentPayloads,
  encodeModelDocumentPayloads,
} from "./model-document-codec-payload";
import {
  isToolcraftCanonicalModelLimitError,
  resolveToolcraftCanonicalModelLimits,
  type ToolcraftCanonicalModelLimits,
} from "./model-document-limits";
import {
  assertValidToolcraftModelDocument,
  getValidatedToolcraftModelDocumentSnapshot,
  ToolcraftModelDocumentValidationError,
} from "./model-document-validation";
import {
  assertCanonicalWorkerMemoryFloor,
  assertToolcraftModelEncodeWorkerMemory,
} from "./model-document-worker-memory";

export type { ToolcraftModelDocumentCodecFailureCode } from "./model-document-codec-error";
export { ToolcraftModelDocumentCodecError } from "./model-document-codec-error";

function resolveCodecLimits(
  requestedLimits: Partial<ToolcraftModelImportLimits> | undefined,
): ToolcraftCanonicalModelLimits {
  try {
    return resolveToolcraftCanonicalModelLimits(requestedLimits);
  } catch (error) {
    if (isToolcraftCanonicalModelLimitError(error)) {
      throwModelDocumentCodecError(
        "invalid-limit-options",
        error.path,
        error.message,
      );
    }
    throwModelDocumentCodecError(
      "invalid-limit-options",
      "limits",
      "Canonical model limit options could not be resolved safely.",
    );
  }
}

function getValidatedCodecSnapshot(
  document: ToolcraftModelDocument,
  limits: ToolcraftCanonicalModelLimits,
): ToolcraftModelDocument {
  try {
    return getValidatedToolcraftModelDocumentSnapshot(document, limits);
  } catch (error) {
    if (
      error instanceof ToolcraftModelDocumentValidationError &&
      error.code === "estimated-worker-memory-limit-exceeded"
    ) {
      throwModelDocumentCodecError(
        "estimated-worker-memory-limit-exceeded",
        "workerMemory.encode",
        error.message,
      );
    }
    throw error;
  }
}

function assertEncodedSizeWithinLimit(
  document: ToolcraftModelDocument,
  metadataByteLength: number,
  maxDecodedBytes: number,
): void {
  let byteLength = MODEL_DOCUMENT_CODEC_PAYLOAD_OFFSET + metadataByteLength;

  for (const primitive of document.primitives) {
    byteLength +=
      (primitive.positions.length +
        (primitive.normals?.length ?? 0) +
        primitive.indices.length) *
      4;
  }

  if (!Number.isSafeInteger(byteLength) || byteLength > maxDecodedBytes) {
    throwModelDocumentCodecError(
      "encoded-size-limit-exceeded",
      "envelope",
      `Canonical envelope exceeds maxDecodedBytes ${maxDecodedBytes}.`,
    );
  }
}

export function encodeToolcraftModelDocument(
  document: ToolcraftModelDocument,
  requestedLimits?: Partial<ToolcraftModelImportLimits>,
): Uint8Array {
  const limits = resolveCodecLimits(requestedLimits);
  assertCanonicalWorkerMemoryFloor("encode", limits);
  const snapshot = getValidatedCodecSnapshot(document, limits);
  assertToolcraftModelEncodeWorkerMemory(snapshot, limits);
  const metadata = createModelDocumentMetadata(snapshot);
  const metadataBytes = encodeModelDocumentMetadata(metadata);
  assertEncodedSizeWithinLimit(
    snapshot,
    metadataBytes.byteLength,
    limits.maxDecodedBytes,
  );
  const sections = encodeModelDocumentPayloads(snapshot, metadataBytes);
  return encodeModelDocumentEnvelope(sections, limits);
}

export function decodeToolcraftModelDocument(
  bytes: Uint8Array,
  requestedLimits?: Partial<ToolcraftModelImportLimits>,
): ToolcraftModelDocument {
  const limits = resolveCodecLimits(requestedLimits);
  const sections = decodeModelDocumentEnvelope(bytes, limits);
  const metadata = decodeModelDocumentMetadata(
    sections[1],
    {
      indices: sections[4].byteLength,
      normals: sections[3].byteLength,
      positions: sections[2].byteLength,
    },
    limits,
  );
  const document = decodeModelDocumentPayloads(metadata, sections);
  assertValidToolcraftModelDocument(document, limits);
  return document;
}
