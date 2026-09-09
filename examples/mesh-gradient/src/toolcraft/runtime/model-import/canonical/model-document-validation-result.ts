export type ToolcraftModelDocumentValidationFailureCode =
  | "accessor-property"
  | "document-bounds-mismatch"
  | "duplicate-canonicalization-operation"
  | "duplicate-child"
  | "duplicate-id"
  | "duplicate-primitive-reference"
  | "duplicate-repair-operation"
  | "duplicate-root"
  | "empty-document-primitives"
  | "empty-id"
  | "empty-node-hierarchy"
  | "empty-primitive"
  | "estimated-worker-memory-limit-exceeded"
  | "hierarchy-cycle"
  | "index-out-of-range"
  | "input-access-failed"
  | "invalid-limit-options"
  | "invalid-adapter-version"
  | "invalid-bound"
  | "invalid-canonical-schema-version"
  | "invalid-canonicalization-operation"
  | "invalid-canonicalization-operations"
  | "invalid-document"
  | "invalid-indices-type"
  | "invalid-node"
  | "invalid-node-children"
  | "invalid-node-matrix"
  | "invalid-node-name"
  | "invalid-node-primitive-ids"
  | "invalid-nodes"
  | "invalid-normals-type"
  | "invalid-position-cardinality"
  | "invalid-positions-type"
  | "invalid-primitive"
  | "invalid-primitives"
  | "invalid-repair-operation"
  | "invalid-repair-provenance"
  | "invalid-root-node-ids"
  | "invalid-source-format"
  | "invalid-triangle-cardinality"
  | "max-nodes-exceeded"
  | "max-primitives-exceeded"
  | "max-references-exceeded"
  | "max-triangles-exceeded"
  | "max-vertices-exceeded"
  | "missing-node-reference"
  | "missing-primitive-reference"
  | "missing-root"
  | "multiple-parents"
  | "no-renderable-triangle"
  | "non-finite-bound"
  | "non-finite-node-matrix"
  | "non-finite-normal"
  | "non-finite-position"
  | "normal-count-mismatch"
  | "primitive-bounds-mismatch"
  | "root-has-parent"
  | "shared-array-buffer-geometry"
  | "string-limit-exceeded"
  | "unordered-bound"
  | "unreachable-node"
  | "unreferenced-primitive"
  | "unsupported-document-version";

export type ToolcraftModelDocumentValidationFailure = {
  code: ToolcraftModelDocumentValidationFailureCode;
  message: string;
  ok: false;
  path: string;
};

export type ToolcraftModelDocumentValidationResult =
  | { ok: true }
  | ToolcraftModelDocumentValidationFailure;

export const VALID_TOOLCRAFT_MODEL_DOCUMENT = Object.freeze({
  ok: true,
} as const);

export function modelDocumentFailure(
  code: ToolcraftModelDocumentValidationFailureCode,
  path: string,
  message: string,
): ToolcraftModelDocumentValidationFailure {
  return { code, message, ok: false, path };
}

export class ToolcraftModelDocumentValidationError extends Error {
  readonly code: ToolcraftModelDocumentValidationFailureCode;
  readonly path: string;

  constructor(failure: ToolcraftModelDocumentValidationFailure) {
    super(`[model-document:${failure.code}] ${failure.message}`);
    this.name = "ToolcraftModelDocumentValidationError";
    this.code = failure.code;
    this.path = failure.path;
  }
}
