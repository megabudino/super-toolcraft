import {
  isDenseArray,
  isNonemptyString,
  isRecord,
} from "./model-document-validation-helpers";
import {
  modelDocumentFailure,
  VALID_TOOLCRAFT_MODEL_DOCUMENT,
  type ToolcraftModelDocumentValidationResult,
} from "./model-document-validation-result";

const sourceFormats: ReadonlySet<string> = new Set([
  "fbx",
  "glb",
  "gltf",
  "obj",
  "ply",
  "stl",
]);
const canonicalizationOperations: ReadonlySet<string> = new Set([
  "deterministic-triangulation",
  "sequential-indexing",
]);
const repairOperations: ReadonlySet<string> = new Set([
  "compact-unused-vertices",
  "recalculate-bounds",
  "regenerate-normals",
  "remove-duplicate-triangles",
  "remove-invalid-triangles",
  "repair-local-winding",
]);

function validateOperationArray(
  value: unknown,
  path: string,
  allowed: ReadonlySet<string>,
  codes: {
    duplicate: "duplicate-canonicalization-operation" | "duplicate-repair-operation";
    invalid: "invalid-canonicalization-operation" | "invalid-repair-operation";
  },
): ToolcraftModelDocumentValidationResult {
  if (!isDenseArray(value)) {
    return modelDocumentFailure(
      path === "provenance.operations"
        ? "invalid-canonicalization-operations"
        : "invalid-repair-provenance",
      path,
      `${path} must be a dense array.`,
    );
  }

  const seen = new Set<string>();

  for (let index = 0; index < value.length; index += 1) {
    const operation = value[index];
    const operationPath = `${path}[${index}]`;

    if (typeof operation !== "string" || !allowed.has(operation)) {
      return modelDocumentFailure(
        codes.invalid,
        operationPath,
        `${operationPath} is not a supported operation.`,
      );
    }

    if (seen.has(operation)) {
      return modelDocumentFailure(
        codes.duplicate,
        operationPath,
        `${operationPath} duplicates operation "${operation}".`,
      );
    }

    seen.add(operation);
  }

  return VALID_TOOLCRAFT_MODEL_DOCUMENT;
}

export function validateToolcraftModelProvenance(
  value: unknown,
): ToolcraftModelDocumentValidationResult {
  if (!isRecord(value)) {
    return modelDocumentFailure(
      "invalid-canonicalization-operations",
      "provenance",
      "provenance must be an object.",
    );
  }

  if (!isNonemptyString(value.adapterVersion)) {
    return modelDocumentFailure(
      "invalid-adapter-version",
      "provenance.adapterVersion",
      "provenance.adapterVersion must be a nonempty string.",
    );
  }

  if (value.canonicalSchemaVersion !== 1) {
    return modelDocumentFailure(
      "invalid-canonical-schema-version",
      "provenance.canonicalSchemaVersion",
      "provenance.canonicalSchemaVersion must be 1.",
    );
  }

  const operationsResult = validateOperationArray(
    value.operations,
    "provenance.operations",
    canonicalizationOperations,
    {
      duplicate: "duplicate-canonicalization-operation",
      invalid: "invalid-canonicalization-operation",
    },
  );

  if (!operationsResult.ok) {
    return operationsResult;
  }

  if (typeof value.sourceFormat !== "string" || !sourceFormats.has(value.sourceFormat)) {
    return modelDocumentFailure(
      "invalid-source-format",
      "provenance.sourceFormat",
      "provenance.sourceFormat is not supported.",
    );
  }

  if (value.repair === undefined) {
    return VALID_TOOLCRAFT_MODEL_DOCUMENT;
  }

  if (!isRecord(value.repair)) {
    return modelDocumentFailure(
      "invalid-repair-provenance",
      "provenance.repair",
      "provenance.repair must be an object when provided.",
    );
  }

  for (const name of ["algorithmVersion", "planDigest", "recipeId"] as const) {
    if (!isNonemptyString(value.repair[name])) {
      return modelDocumentFailure(
        "invalid-repair-provenance",
        `provenance.repair.${name}`,
        `provenance.repair.${name} must be a nonempty string.`,
      );
    }
  }

  return validateOperationArray(
    value.repair.operations,
    "provenance.repair.operations",
    repairOperations,
    {
      duplicate: "duplicate-repair-operation",
      invalid: "invalid-repair-operation",
    },
  );
}
