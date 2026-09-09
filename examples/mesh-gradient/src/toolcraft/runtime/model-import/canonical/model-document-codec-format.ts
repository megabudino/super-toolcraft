export const MODEL_DOCUMENT_CODEC_MAGIC = Object.freeze([
  0x54, 0x43, 0x4d, 0x44, 0x4f, 0x43, 0x00, 0x00,
] as const);
export const MODEL_DOCUMENT_CODEC_VERSION = 1;
export const MODEL_DOCUMENT_CODEC_HEADER_BYTES = 16;
export const MODEL_DOCUMENT_CODEC_DESCRIPTOR_BYTES = 16;
export const MODEL_DOCUMENT_CODEC_SECTION_COUNT = 4;
export const MODEL_DOCUMENT_CODEC_PAYLOAD_OFFSET =
  MODEL_DOCUMENT_CODEC_HEADER_BYTES +
  MODEL_DOCUMENT_CODEC_DESCRIPTOR_BYTES * MODEL_DOCUMENT_CODEC_SECTION_COUNT;

export const MODEL_DOCUMENT_SECTION_KINDS = Object.freeze([
  1, 2, 3, 4,
] as const);

export type ModelDocumentSectionKind =
  (typeof MODEL_DOCUMENT_SECTION_KINDS)[number];

export type ModelDocumentSections = Readonly<
  Record<ModelDocumentSectionKind, Uint8Array>
>;

export function modelDocumentDescriptorOffset(index: number): number {
  return (
    MODEL_DOCUMENT_CODEC_HEADER_BYTES +
    index * MODEL_DOCUMENT_CODEC_DESCRIPTOR_BYTES
  );
}

