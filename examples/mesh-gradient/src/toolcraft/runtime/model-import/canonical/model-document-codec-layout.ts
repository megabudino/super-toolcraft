import type { ToolcraftCanonicalModelLimits } from "./model-document-limits";
import { throwModelDocumentCodecError } from "./model-document-codec-error";
import type { ModelDocumentMetadata } from "./model-document-codec-metadata";

export function validateModelDocumentPayloadLayout(
  metadata: ModelDocumentMetadata,
  sectionByteLengths: { indices: number; normals: number; positions: number },
  limits: ToolcraftCanonicalModelLimits,
): void {
  let indices = 0;
  let normals = 0;
  let positions = 0;

  for (let index = 0; index < metadata.primitives.length; index += 1) {
    const primitive = metadata.primitives[index]!;
    if (
      primitive.indices.offset !== indices ||
      primitive.positions.offset !== positions ||
      (primitive.normals !== null && primitive.normals.offset !== normals)
    ) {
      throwModelDocumentCodecError(
        "payload-layout-mismatch",
        `primitives[${index}]`,
        "Canonical typed-array slices must be contiguous and ordered.",
      );
    }

    indices += primitive.indices.count;
    positions += primitive.positions.count;
    normals += primitive.normals?.count ?? 0;
    if (![indices, positions, normals].every(Number.isSafeInteger)) {
      throwModelDocumentCodecError(
        "unsafe-metadata-integer",
        `primitives[${index}]`,
        "Canonical typed-array slice totals exceed safe integer size.",
      );
    }

    if (indices > limits.maxTriangles * 3) {
      throwModelDocumentCodecError(
        "max-triangles-exceeded",
        `primitives[${index}].indices.count`,
        `Canonical metadata exceeds maxTriangles ${limits.maxTriangles}.`,
      );
    }

    if (
      positions > limits.maxVertices * 3 ||
      normals > limits.maxVertices * 3
    ) {
      throwModelDocumentCodecError(
        "max-vertices-exceeded",
        `primitives[${index}].positions.count`,
        `Canonical metadata exceeds maxVertices ${limits.maxVertices}.`,
      );
    }
  }

  if (
    indices * 4 !== sectionByteLengths.indices ||
    normals * 4 !== sectionByteLengths.normals ||
    positions * 4 !== sectionByteLengths.positions
  ) {
    throwModelDocumentCodecError(
      "payload-layout-mismatch",
      "sections",
      "Canonical metadata slices do not exactly cover typed-array sections.",
    );
  }
}

