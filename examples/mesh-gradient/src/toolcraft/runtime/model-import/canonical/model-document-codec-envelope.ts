import type { ToolcraftCanonicalModelLimits } from "./model-document-limits";
import {
  MODEL_DOCUMENT_CODEC_DESCRIPTOR_BYTES,
  MODEL_DOCUMENT_CODEC_HEADER_BYTES,
  MODEL_DOCUMENT_CODEC_MAGIC,
  MODEL_DOCUMENT_CODEC_PAYLOAD_OFFSET,
  MODEL_DOCUMENT_CODEC_SECTION_COUNT,
  MODEL_DOCUMENT_CODEC_VERSION,
  MODEL_DOCUMENT_SECTION_KINDS,
  modelDocumentDescriptorOffset,
  type ModelDocumentSectionKind,
  type ModelDocumentSections,
} from "./model-document-codec-format";
import { throwModelDocumentCodecError } from "./model-document-codec-error";
import {
  copyCanonicalTypedArray,
  inspectCanonicalTypedArray,
} from "./model-document-safe-typed-array";
import {
  assertToolcraftModelDecodeInputWorkerMemory,
  assertToolcraftModelDecodeWorkerMemory,
} from "./model-document-worker-memory";

const maximumSafeSectionLength = BigInt(Number.MAX_SAFE_INTEGER);
const sectionKindSet: ReadonlySet<number> = new Set(
  MODEL_DOCUMENT_SECTION_KINDS,
);

function snapshotDecodeInput(
  value: unknown,
  limits: ToolcraftCanonicalModelLimits,
): Uint8Array {
  const inspection = inspectCanonicalTypedArray(value, "Uint8Array");
  if (inspection === null || inspection.shared) {
    throwModelDocumentCodecError(
      "invalid-input",
      "bytes",
      "Canonical model document bytes must be an owned Uint8Array input.",
    );
  }
  if (inspection.length > limits.maxDecodedBytes) {
    throwModelDocumentCodecError(
      "encoded-size-limit-exceeded",
      "envelope",
      `Canonical envelope exceeds maxDecodedBytes ${limits.maxDecodedBytes}.`,
    );
  }

  assertToolcraftModelDecodeInputWorkerMemory(inspection.length, limits);
  try {
    return copyCanonicalTypedArray(inspection);
  } catch {
    throwModelDocumentCodecError(
      "invalid-input",
      "bytes",
      "Canonical model document bytes could not be snapshotted safely.",
    );
  }
}

function validateMagic(bytes: Uint8Array): void {
  for (let index = 0; index < MODEL_DOCUMENT_CODEC_MAGIC.length; index += 1) {
    if (bytes[index] !== MODEL_DOCUMENT_CODEC_MAGIC[index]) {
      throwModelDocumentCodecError(
        "bad-magic",
        `bytes[${index}]`,
        "Canonical model document magic does not match.",
      );
    }
  }
}

export function encodeModelDocumentEnvelope(
  sections: ModelDocumentSections,
  limits: ToolcraftCanonicalModelLimits,
): Uint8Array {
  let totalBytes = MODEL_DOCUMENT_CODEC_PAYLOAD_OFFSET;

  for (const kind of MODEL_DOCUMENT_SECTION_KINDS) {
    const sectionLength = sections[kind].byteLength;
    if (!Number.isSafeInteger(sectionLength)) {
      throwModelDocumentCodecError(
        "unsafe-section-length",
        `sections.${kind}`,
        `Section ${kind} exceeds safe integer size.`,
      );
    }

    totalBytes += sectionLength;
    if (!Number.isSafeInteger(totalBytes)) {
      throwModelDocumentCodecError(
        "unsafe-section-length",
        `sections.${kind}`,
        "Canonical envelope size exceeds safe integer size.",
      );
    }
  }

  if (totalBytes > limits.maxDecodedBytes) {
    throwModelDocumentCodecError(
      "encoded-size-limit-exceeded",
      "envelope",
      `Canonical envelope exceeds maxDecodedBytes ${limits.maxDecodedBytes}.`,
    );
  }

  const encoded = new Uint8Array(totalBytes);
  encoded.set(MODEL_DOCUMENT_CODEC_MAGIC, 0);
  const view = new DataView(encoded.buffer);
  view.setUint16(8, MODEL_DOCUMENT_CODEC_VERSION, true);
  view.setUint16(10, MODEL_DOCUMENT_CODEC_SECTION_COUNT, true);
  view.setUint32(12, MODEL_DOCUMENT_CODEC_PAYLOAD_OFFSET, true);

  let payloadOffset = MODEL_DOCUMENT_CODEC_PAYLOAD_OFFSET;
  for (let index = 0; index < MODEL_DOCUMENT_SECTION_KINDS.length; index += 1) {
    const kind = MODEL_DOCUMENT_SECTION_KINDS[index]!;
    const section = sections[kind];
    const descriptorOffset = modelDocumentDescriptorOffset(index);
    view.setUint32(descriptorOffset, kind, true);
    view.setUint32(descriptorOffset + 4, 0, true);
    view.setBigUint64(
      descriptorOffset + 8,
      BigInt(section.byteLength),
      true,
    );
    encoded.set(section, payloadOffset);
    payloadOffset += section.byteLength;
  }

  return encoded;
}

export function decodeModelDocumentEnvelope(
  input: unknown,
  limits: ToolcraftCanonicalModelLimits,
): ModelDocumentSections {
  const bytes = snapshotDecodeInput(input, limits);

  if (bytes.byteLength < MODEL_DOCUMENT_CODEC_HEADER_BYTES) {
    throwModelDocumentCodecError(
      "truncated-header",
      "header",
      "Canonical model document header is truncated.",
    );
  }

  if (bytes.byteLength > limits.maxDecodedBytes) {
    throwModelDocumentCodecError(
      "encoded-size-limit-exceeded",
      "envelope",
      `Canonical envelope exceeds maxDecodedBytes ${limits.maxDecodedBytes}.`,
    );
  }

  validateMagic(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = view.getUint16(8, true);
  if (version !== MODEL_DOCUMENT_CODEC_VERSION) {
    throwModelDocumentCodecError(
      "unsupported-codec-version",
      "header.version",
      `Unsupported canonical model document codec version ${version}.`,
    );
  }

  const sectionCount = view.getUint16(10, true);
  if (sectionCount !== MODEL_DOCUMENT_CODEC_SECTION_COUNT) {
    throwModelDocumentCodecError(
      "invalid-section-count",
      "header.sectionCount",
      `Canonical envelope must declare ${MODEL_DOCUMENT_CODEC_SECTION_COUNT} sections.`,
    );
  }

  const payloadOffset = view.getUint32(12, true);
  if (payloadOffset !== MODEL_DOCUMENT_CODEC_PAYLOAD_OFFSET) {
    throwModelDocumentCodecError(
      "invalid-header-size",
      "header.payloadOffset",
      `Canonical envelope payload must start at byte ${MODEL_DOCUMENT_CODEC_PAYLOAD_OFFSET}.`,
    );
  }

  if (bytes.byteLength < payloadOffset) {
    throwModelDocumentCodecError(
      "truncated-header",
      "sectionDirectory",
      "Canonical model document section directory is truncated.",
    );
  }

  const descriptors: { kind: ModelDocumentSectionKind; length: number }[] = [];
  const seenKinds = new Set<number>();

  for (let index = 0; index < sectionCount; index += 1) {
    const descriptorOffset = modelDocumentDescriptorOffset(index);
    if (descriptorOffset + MODEL_DOCUMENT_CODEC_DESCRIPTOR_BYTES > bytes.byteLength) {
      throwModelDocumentCodecError(
        "truncated-header",
        `sections[${index}]`,
        "Canonical model document section directory is truncated.",
      );
    }

    const kind = view.getUint32(descriptorOffset, true);
    const flags = view.getUint32(descriptorOffset + 4, true);
    const length = view.getBigUint64(descriptorOffset + 8, true);

    if (flags !== 0) {
      throwModelDocumentCodecError(
        "invalid-section-flags",
        `sections[${index}].flags`,
        `Section ${index} declares unsupported flags.`,
      );
    }

    if (seenKinds.has(kind)) {
      throwModelDocumentCodecError(
        "duplicate-section",
        `sections[${index}].kind`,
        `Canonical envelope duplicates section kind ${kind}.`,
      );
    }

    if (!sectionKindSet.has(kind)) {
      throwModelDocumentCodecError(
        "unknown-section",
        `sections[${index}].kind`,
        `Canonical envelope contains unknown section kind ${kind}.`,
      );
    }

    if (length > maximumSafeSectionLength) {
      throwModelDocumentCodecError(
        "unsafe-section-length",
        `sections[${index}].length`,
        `Section ${kind} exceeds safe integer size.`,
      );
    }

    const numericLength = Number(length);
    if (numericLength > limits.maxDecodedBytes) {
      throwModelDocumentCodecError(
        "section-length-limit-exceeded",
        `sections[${index}].length`,
        `Section ${kind} exceeds maxDecodedBytes ${limits.maxDecodedBytes}.`,
      );
    }

    if (kind !== 1 && numericLength % 4 !== 0) {
      throwModelDocumentCodecError(
        "invalid-section-byte-length",
        `sections[${index}].length`,
        `Typed-array section ${kind} must be divisible by four bytes.`,
      );
    }

    if (kind === 1 && numericLength === 0) {
      throwModelDocumentCodecError(
        "empty-metadata",
        `sections[${index}].length`,
        "Canonical metadata section must not be empty.",
      );
    }

    seenKinds.add(kind);
    descriptors.push({
      kind: kind as ModelDocumentSectionKind,
      length: numericLength,
    });
  }

  for (let index = 0; index < descriptors.length; index += 1) {
    if (descriptors[index]!.kind !== MODEL_DOCUMENT_SECTION_KINDS[index]) {
      throwModelDocumentCodecError(
        "invalid-section-order",
        `sections[${index}].kind`,
        "Canonical envelope sections are not in stable order.",
      );
    }
  }

  let expectedBytes = BigInt(payloadOffset);
  for (const descriptor of descriptors) {
    expectedBytes += BigInt(descriptor.length);
  }

  if (expectedBytes > BigInt(bytes.byteLength)) {
    throwModelDocumentCodecError(
      "truncated-envelope",
      "envelope",
      "Canonical model document payload is truncated.",
    );
  }

  if (expectedBytes < BigInt(bytes.byteLength)) {
    throwModelDocumentCodecError(
      "trailing-data",
      "envelope",
      "Canonical model document has trailing bytes.",
    );
  }

  const metadataByteLength = descriptors[0]!.length;
  let payloadByteLength = 0;
  for (let index = 1; index < descriptors.length; index += 1) {
    payloadByteLength += descriptors[index]!.length;
  }
  assertToolcraftModelDecodeWorkerMemory(
    bytes.byteLength,
    metadataByteLength,
    payloadByteLength,
    limits,
  );

  const sections = {} as Record<ModelDocumentSectionKind, Uint8Array>;
  let sectionOffset = payloadOffset;
  for (const descriptor of descriptors) {
    sections[descriptor.kind] = bytes.subarray(
      sectionOffset,
      sectionOffset + descriptor.length,
    );
    sectionOffset += descriptor.length;
  }

  return sections;
}
