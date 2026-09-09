import fs from "node:fs/promises";
import path from "node:path";

export const TOOLCRAFT_PERFORMANCE_IMPACT_VERSION = 1;

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTrimmedNonEmptyString(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function isUniqueStringArray(value) {
  return (
    Array.isArray(value) &&
    value.every(isTrimmedNonEmptyString) &&
    new Set(value).size === value.length
  );
}

function exactKeysError(value, expectedKeys, label) {
  const expected = new Set(expectedKeys);
  const actual = Object.keys(value);
  const unknown = actual.filter((key) => !expected.has(key)).sort(compareCodeUnits);
  const missing = expectedKeys.filter(
    (key) => !Object.prototype.hasOwnProperty.call(value, key),
  );
  if (unknown.length > 0) {
    return `${label} contains unknown field${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}.`;
  }
  if (missing.length > 0) {
    return `${label} is missing required field${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`;
  }
  return undefined;
}

function normalizeModuleEntry(rawEntry, index, errors) {
  const label = `Performance impact module at index ${index}`;
  if (!isRecord(rawEntry)) {
    errors.push(`${label} must be an object.`);
    return undefined;
  }
  if (rawEntry.kind !== "functional" && rawEntry.kind !== "performance") {
    errors.push(`${label}.kind must be "functional" or "performance".`);
    return undefined;
  }
  const expectedKeys =
    rawEntry.kind === "performance"
      ? ["kind", "passIds", "path"]
      : ["kind", "path"];
  const keyError = exactKeysError(rawEntry, expectedKeys, label);
  if (keyError) errors.push(keyError);
  if (!isTrimmedNonEmptyString(rawEntry.path)) {
    errors.push(`${label}.path must be a non-empty trimmed repository path.`);
    return undefined;
  }
  if (rawEntry.path.startsWith("/") || rawEntry.path.includes("\\")) {
    errors.push(`${label}.path must be a relative POSIX repository path.`);
  }
  if (rawEntry.kind === "performance" && !isUniqueStringArray(rawEntry.passIds)) {
    errors.push(`${label}.passIds must be a non-empty unique string array.`);
    return undefined;
  }
  if (rawEntry.kind === "performance" && rawEntry.passIds.length === 0) {
    errors.push(`${label}.passIds must contain at least one renderer pass id.`);
  }
  return Object.freeze({
    kind: rawEntry.kind,
    path: rawEntry.path,
    ...(rawEntry.kind === "performance"
      ? { passIds: Object.freeze([...rawEntry.passIds].sort(compareCodeUnits)) }
      : {}),
  });
}

export function validateToolcraftPerformanceImpactInventory(
  value,
  { knownPassIds = [], productProductionPaths = [] } = {},
) {
  const errors = [];
  if (!isRecord(value)) {
    return { errors: ["Performance impact inventory must be an object."], inventory: undefined };
  }
  const rootKeyError = exactKeysError(value, ["modules", "version"], "Performance impact inventory");
  if (rootKeyError) errors.push(rootKeyError);
  if (value.version !== TOOLCRAFT_PERFORMANCE_IMPACT_VERSION) {
    errors.push(
      `Performance impact inventory.version must be ${TOOLCRAFT_PERFORMANCE_IMPACT_VERSION}.`,
    );
  }
  if (!Array.isArray(value.modules)) {
    errors.push("Performance impact inventory.modules must be an array.");
    return { errors, inventory: undefined };
  }

  const modules = value.modules.flatMap((entry, index) => {
    const normalized = normalizeModuleEntry(entry, index, errors);
    return normalized ? [normalized] : [];
  });
  const moduleCounts = new Map();
  for (const entry of modules) {
    moduleCounts.set(entry.path, (moduleCounts.get(entry.path) ?? 0) + 1);
  }
  for (const [modulePath, count] of moduleCounts) {
    if (count > 1) {
      errors.push(`Performance impact module path "${modulePath}" must be unique.`);
    }
  }

  const declaredPaths = new Set(modules.map((entry) => entry.path));
  const expectedPaths = [...new Set(productProductionPaths)].sort(compareCodeUnits);
  for (const expectedPath of expectedPaths) {
    if (!declaredPaths.has(expectedPath)) {
      errors.push(
        `Product production module "${expectedPath}" is missing from the performance impact inventory.`,
      );
    }
  }
  for (const declaredPath of declaredPaths) {
    if (expectedPaths.length > 0 && !expectedPaths.includes(declaredPath)) {
      errors.push(
        `Performance impact module "${declaredPath}" is not a current product production module.`,
      );
    }
  }

  const knownPassIdSet = new Set(knownPassIds);
  const ownedPassIds = new Set();
  for (const entry of modules) {
    if (entry.kind !== "performance") continue;
    for (const passId of entry.passIds) {
      ownedPassIds.add(passId);
      if (knownPassIdSet.size > 0 && !knownPassIdSet.has(passId)) {
        errors.push(
          `Performance impact module "${entry.path}" references unknown renderer pass "${passId}".`,
        );
      }
    }
  }
  for (const passId of knownPassIdSet) {
    if (!ownedPassIds.has(passId)) {
      errors.push(
        `Renderer pass "${passId}" has no product implementation owner in the performance impact inventory.`,
      );
    }
  }
  const performanceModules = modules.filter(
    (entry) => entry.kind === "performance",
  );
  if (
    modules.length >= 2 &&
    knownPassIdSet.size >= 2 &&
    performanceModules.length === modules.length &&
    performanceModules.every(
      (entry) =>
        entry.passIds.length === knownPassIdSet.size &&
        entry.passIds.every((passId) => knownPassIdSet.has(passId)),
    )
  ) {
    errors.push(
      "Performance impact ownership is overbroad: every product production module claims every renderer pass. Classify pure wiring and metadata as functional, and name only passes whose execution, invalidation, workload, lifecycle, or measured output the module can change.",
    );
  }

  return {
    errors,
    inventory: errors.length === 0
      ? Object.freeze({
          modules: Object.freeze(
            [...modules].sort((left, right) => compareCodeUnits(left.path, right.path)),
          ),
          version: TOOLCRAFT_PERFORMANCE_IMPACT_VERSION,
        })
      : undefined,
  };
}

export async function readToolcraftPerformanceImpactInventory(
  rootDir,
  options = {},
) {
  const appPath = path.join(rootDir, "src/app/app-performance-impact.json");
  const starterPath = path.join(rootDir, "src/app/app-performance-impact.json");
  let source;
  let inventoryPath = appPath;
  try {
    source = await fs.readFile(appPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    inventoryPath = starterPath;
    source = await fs.readFile(starterPath, "utf8");
  }
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error("Toolcraft performance impact inventory is malformed JSON.");
  }
  const validation = validateToolcraftPerformanceImpactInventory(value, options);
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join("\n"));
  }
  return { inventory: validation.inventory, path: inventoryPath };
}

export function resolveToolcraftChangedPerformanceImpact({
  changedFiles,
  inventory,
}) {
  const changedFileSet = new Set(changedFiles);
  const changedModules = inventory.modules.filter((entry) => changedFileSet.has(entry.path));
  const performancePassIds = [
    ...new Set(
      changedModules.flatMap((entry) =>
        entry.kind === "performance" ? entry.passIds : [],
      ),
    ),
  ].sort(compareCodeUnits);
  const hasFunctionalModule = changedModules.some((entry) => entry.kind === "functional");
  const hasTestChange = changedFiles.some(
    (filePath) =>
      filePath.startsWith("e2e/") || /(?:^|\/)[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(filePath),
  );

  return Object.freeze({
    minimumTier:
      performancePassIds.length > 0 ? 3 : hasFunctionalModule ? 2 : hasTestChange ? 1 : 0,
    performancePassIds: Object.freeze(performancePassIds),
    requiresFunctionalBrowser: hasFunctionalModule,
  });
}
