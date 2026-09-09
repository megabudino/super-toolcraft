import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { validateToolcraftDeliveryCatalog } from "./playwright-test-title-selection.mjs";
import {
  collectToolcraftSourceInventory,
} from "./toolcraft-source-inventory.mjs";
import {
  collectToolcraftFrameworkOwnedLocalPaths,
} from "./toolcraft-source-ownership.mjs";
import {
  classifyToolcraftProductVerificationSourcePath,
  resolveToolcraftChangedVerificationImpact,
  toolcraftProductVerificationSourceRoots,
} from "./toolcraft-verification-impact-resolution.mjs";
export {
  resolveToolcraftChangedVerificationImpact,
};
export const TOOLCRAFT_VERIFICATION_IMPACT_VERSION = 2;
const impactKinds = new Set(["functional", "performance", "presentation"]);
function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isTrimmedString(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}
function uniqueSorted(values) {
  return [...new Set(values)].sort(compareCodeUnits);
}
export async function collectToolcraftProductVerificationSources(rootDir) {
  const protectedFilePaths =
    await collectToolcraftFrameworkOwnedLocalPaths(rootDir);
  const sourceInventory = await collectToolcraftSourceInventory({
    includeResourceFiles: true,
    protectedFilePaths,
    rootDir,
    sourceRoots: toolcraftProductVerificationSourceRoots,
  });
  const productProductionEntries = sourceInventory.entries
    .map((entry) => ({
      entry,
      classification: classifyToolcraftProductVerificationSourcePath(
        entry.repoPath,
        { protectedFilePaths },
      ),
    }))
    .filter(({ classification }) => classification !== undefined);
  const requiredProductModulePaths = Object.freeze(
    productProductionEntries
      .filter(({ classification }) =>
        classification.kind === "module"
      )
      .map(({ entry }) => entry.repoPath),
  );
  const knownProductResourcePaths = Object.freeze(
    productProductionEntries
      .filter(({ classification }) =>
        classification.kind === "resource"
      )
      .map(({ entry }) => entry.repoPath),
  );
  return Object.freeze({
    knownProductResourcePaths,
    requiredProductModulePaths,
    sourceInventory,
  });
}
function isCanonicalPath(value) {
  return (
    isTrimmedString(value) &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    value === path.posix.normalize(value) &&
    !value.startsWith("../")
  );
}
function exactKeys(value, expected, label, errors) {
  const expectedSet = new Set(expected);
  const unknown = Object.keys(value).filter(
    (key) => !expectedSet.has(key),
  ).sort(compareCodeUnits);
  const missing = expected.filter((key) =>
    !Object.prototype.hasOwnProperty.call(value, key)
  );
  if (unknown.length > 0) errors.push(`${label} contains unknown fields: ${unknown.join(", ")}.`);
  if (missing.length > 0) errors.push(`${label} is missing required fields: ${missing.join(", ")}.`);
}
function normalizeStringArray(value, label, errors, { nonempty = true } = {}) {
  if (!Array.isArray(value) || !value.every(isTrimmedString)) {
    errors.push(`${label} must be a sorted unique string array.`);
    return undefined;
  }
  if (nonempty && value.length === 0) {
    errors.push(`${label} must contain at least one entry.`);
  }
  const sorted = uniqueSorted(value);
  if (sorted.length !== value.length) {
    errors.push(`${label} must not contain duplicates.`);
  }
  return Object.freeze(sorted);
}
function normalizeOwner(value, index, errors) {
  const label = `Verification impact owner at index ${index}`;
  if (!isRecord(value)) {
    errors.push(`${label} must be an object.`);
    return undefined;
  }
  const kind = value.kind;
  if (!impactKinds.has(kind)) {
    errors.push(`${label}.kind must be "presentation", "functional", or "performance".`);
  }
  exactKeys(
    value,
    kind === "performance"
      ? ["acceptanceIds", "kind", "passIds", "path"]
      : ["acceptanceIds", "kind", "path"],
    label,
    errors,
  );
  if (!isCanonicalPath(value.path)) {
    errors.push(`${label}.path must be a canonical relative POSIX path.`);
  }
  const acceptanceIds = normalizeStringArray(
    value.acceptanceIds,
    `${label}.acceptanceIds`,
    errors,
  );
  const passIds = kind === "performance"
    ? normalizeStringArray(value.passIds, `${label}.passIds`, errors)
    : undefined;
  if (
    !isCanonicalPath(value.path) ||
    !acceptanceIds ||
    !impactKinds.has(kind) ||
    (kind === "performance" && !passIds)
  ) {
    return undefined;
  }
  return Object.freeze({
    acceptanceIds,
    kind,
    ...(kind === "performance" ? { passIds } : {}),
    path: value.path,
  });
}
function validateOwnershipCoverage(
  owners,
  catalog,
  requiredProductModulePaths,
  knownProductResourcePaths,
  errors,
) {
  const counts = new Map();
  for (const owner of owners) counts.set(owner.path, (counts.get(owner.path) ?? 0) + 1);
  for (const [ownerPath, count] of [...counts].sort(([left], [right]) =>
    compareCodeUnits(left, right)
  )) {
    if (count > 1) errors.push(`Verification impact owner path "${ownerPath}" must be unique.`);
  }
  const expectedPaths = uniqueSorted(requiredProductModulePaths);
  const allowedPaths = uniqueSorted([
    ...requiredProductModulePaths,
    ...knownProductResourcePaths,
  ]);
  const allowedSet = new Set(allowedPaths);
  for (const expectedPath of expectedPaths) {
    if (!counts.has(expectedPath)) errors.push(
      `Product production module "${expectedPath}" is missing from the verification impact inventory.`,
    );
  }
  for (const ownerPath of uniqueSorted(owners.map((owner) => owner.path))) {
    if (!allowedSet.has(ownerPath)) errors.push(
      `Verification impact owner "${ownerPath}" is not a current product production module or resource path.`,
    );
  }
  const acceptanceIds = new Set(catalog.acceptance.map((row) => row.acceptanceId));
  const passIds = new Set(catalog.performance.flatMap((row) => row.passIds));
  const ownedAcceptanceIds = new Set();
  const ownedPassIds = new Set();
  for (const owner of owners) {
    for (const acceptanceId of owner.acceptanceIds) {
      if (allowedSet.has(owner.path)) ownedAcceptanceIds.add(acceptanceId);
      if (!acceptanceIds.has(acceptanceId)) {
        errors.push(
          `Verification impact owner "${owner.path}" references unknown acceptance id "${acceptanceId}".`,
        );
      }
    }
    for (const passId of owner.kind === "performance" ? owner.passIds : []) {
      if (allowedSet.has(owner.path)) ownedPassIds.add(passId);
      if (!passIds.has(passId)) {
        errors.push(
          `Verification impact owner "${owner.path}" references unknown renderer pass "${passId}".`,
        );
      }
    }
  }
  for (const acceptanceId of acceptanceIds) {
    if (!ownedAcceptanceIds.has(acceptanceId)) {
      errors.push(`Acceptance id "${acceptanceId}" has no product implementation owner in the verification impact inventory.`);
    }
  }
  for (const passId of passIds) {
    if (!ownedPassIds.has(passId)) {
      errors.push(`Renderer pass "${passId}" has no product implementation owner in the verification impact inventory.`);
    }
  }
  if (
    owners.length >= 2 &&
    acceptanceIds.size >= 2 &&
    owners.every((owner) => owner.acceptanceIds.length === acceptanceIds.size)
  ) {
    errors.push(
      "Verification impact ownership is overbroad: every product production path claims every acceptance id without nearest ownership.",
    );
  }
  if (
    owners.length >= 2 &&
    passIds.size > 0 &&
    owners.every(
      (owner) =>
        owner.kind === "performance" && owner.passIds.length === passIds.size,
    )
  ) {
    errors.push(
      "Verification impact ownership is overbroad: every product production path claims every renderer pass without nearest ownership.",
    );
  }
}
export function validateToolcraftVerificationImpactInventory(
  value,
  {
    catalog,
    knownProductResourcePaths = [],
    requiredProductModulePaths = [],
  } = {},
) {
  const errors = [];
  if (!isRecord(value)) {
    return { errors: ["Verification impact inventory must be an object."] };
  }
  exactKeys(value, ["owners", "version"], "Verification impact inventory", errors);
  if (value.version !== TOOLCRAFT_VERIFICATION_IMPACT_VERSION) {
    errors.push(
      `Verification impact inventory.version must be ${TOOLCRAFT_VERIFICATION_IMPACT_VERSION}.`,
    );
  }
  if (!Array.isArray(value.owners)) {
    errors.push("Verification impact inventory.owners must be an array.");
    return { errors };
  }
  const catalogValidation = validateToolcraftDeliveryCatalog(catalog);
  if (catalogValidation.errors.length > 0) {
    errors.push(
      ...catalogValidation.errors.map((error) => `Invalid delivery catalog: ${error}`),
    );
  }
  const owners = value.owners.flatMap((owner, index) => {
    const normalized = normalizeOwner(owner, index, errors);
    return normalized ? [normalized] : [];
  });
  if (catalogValidation.catalog) {
    validateOwnershipCoverage(
      owners,
      catalogValidation.catalog,
      requiredProductModulePaths,
      knownProductResourcePaths,
      errors,
    );
  }
  return {
    errors,
    ...(errors.length === 0
      ? {
          inventory: Object.freeze({
            owners: Object.freeze(
              [...owners].sort((left, right) =>
                compareCodeUnits(left.path, right.path)
              ),
            ),
            version: TOOLCRAFT_VERIFICATION_IMPACT_VERSION,
          }),
        }
      : {}),
  };
}
export async function readToolcraftVerificationImpactInventory(
  rootDir, options,
) {
  const appPath = path.join(rootDir, "src/app/app-verification-impact.json");
  const starterPath = path.join(rootDir, "src/app/starter-verification-impact.json");
  const inventoryPath = existsSync(appPath) ? appPath : starterPath;
  let value;
  try {
    value = JSON.parse(await fs.readFile(inventoryPath, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Toolcraft verification impact inventory is malformed JSON.");
    }
    throw error;
  }
  const validation = validateToolcraftVerificationImpactInventory(value, options);
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join("\n"));
  }
  return Object.freeze({ inventory: validation.inventory, path: inventoryPath });
}
