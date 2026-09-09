import path from "node:path";

import {
  getToolcraftAffectedTestFiles,
  getToolcraftStrongestImporters,
} from "./toolcraft-local-dependency-graph.mjs";
import { toolcraftModuleExtensions } from "./toolcraft-product-dependency-resolution.mjs";
import {
  classifyToolcraftSourcePath,
} from "./toolcraft-source-inventory.mjs";

export const toolcraftProductVerificationSourceRoots = Object.freeze([
  "src",
  "e2e",
  "public",
]);
const verificationImpactInventoryPaths = new Set([
  "src/app/app-verification-impact.json",
  "src/app/starter-verification-impact.json",
]);
const performanceSpecPath = "e2e/app-performance.spec.ts";
const testFilePattern = /(?:^|\/)[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$/u;
const testSupportPattern =
  /(?:^|\/)(?:test-evidence|test-support)(?:\/|$)|(?:^|\/)[^/]*(?:fixtures|test-utils)\.[cm]?[jt]sx?$/u;

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isTrimmedString(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
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

export function classifyToolcraftProductVerificationSourcePath(
  repoPath,
  { protectedFilePaths = [] } = {},
) {
  if (
    !isCanonicalPath(repoPath) ||
    !toolcraftProductVerificationSourceRoots.some(
      (sourceRoot) => repoPath.startsWith(`${sourceRoot}/`),
    )
  ) {
    return undefined;
  }
  const classification = classifyToolcraftSourcePath(repoPath, {
    protectedFilePaths,
  });
  if (
    classification.owner !== "product" ||
    classification.role !== "production"
  ) {
    return undefined;
  }
  return Object.freeze({
    kind: toolcraftModuleExtensions.includes(path.posix.extname(repoPath))
      ? "module"
      : "resource",
    repoPath,
  });
}

function uniqueSorted(values) {
  return [...new Set(values)].sort(compareCodeUnits);
}

function toRepoTestFile(file) {
  return file.startsWith("e2e/") ? file : `e2e/${file}`;
}

function createPerformanceCandidates(rows) {
  return Object.freeze({
    passIds: Object.freeze(
      uniqueSorted(rows.flatMap((row) => row.passIds)),
    ),
    pathIds: Object.freeze(
      uniqueSorted(rows.map((row) => row.pathId)),
    ),
    testNames: Object.freeze(
      uniqueSorted(rows.map((row) => row.testName)),
    ),
  });
}

function createResolvedImpact({
  acceptanceIds,
  catalog,
  performanceRows,
  productTestFiles,
}) {
  const acceptanceIdSet = new Set(acceptanceIds);
  return Object.freeze({
    acceptanceIds: Object.freeze(acceptanceIds),
    browserTestNames: Object.freeze(
      uniqueSorted(
        catalog.acceptance
          .filter((row) => acceptanceIdSet.has(row.acceptanceId))
          .map((row) => row.testName),
      ),
    ),
    performanceCandidates: createPerformanceCandidates(performanceRows),
    productTestFiles: Object.freeze(productTestFiles),
  });
}

function createVerificationTestPathClassifier(catalog, graphEntries) {
  const acceptanceFiles = new Set(
    catalog.acceptance.map((row) => toRepoTestFile(row.file)),
  );
  const performanceFiles = new Set(
    catalog.performance.length > 0 ? [performanceSpecPath] : [],
  );
  return Object.freeze({
    isCatalogTest(repoPath) {
      return acceptanceFiles.has(repoPath) || performanceFiles.has(repoPath);
    },
    isCurrentTestSupport(repoPath) {
      const entry = graphEntries.get(repoPath);
      return entry?.owner === "product" && entry.role === "test-support";
    },
    isDeletedTestOrSupport(repoPath) {
      if (
        graphEntries.has(repoPath) ||
        !isCanonicalPath(repoPath) ||
        !toolcraftModuleExtensions.includes(path.posix.extname(repoPath))
      ) {
        return false;
      }
      if (repoPath.startsWith("e2e/")) return true;
      return (
        repoPath.startsWith("src/") &&
        !repoPath.startsWith("src/toolcraft/") &&
        (testFilePattern.test(repoPath) || testSupportPattern.test(repoPath))
      );
    },
    isVitestTest(repoPath) {
      const entry = graphEntries.get(repoPath);
      return (
        entry?.role === "test" &&
        repoPath.startsWith("src/") &&
        !repoPath.startsWith("src/toolcraft/") &&
        testFilePattern.test(repoPath)
      );
    },
  });
}

function isConservativeDeletedProductSourceOrResource(
  repoPath,
  graphEntries,
) {
  return (
    !graphEntries.has(repoPath) &&
    classifyToolcraftProductVerificationSourcePath(repoPath) !== undefined
  );
}

function createCompleteCurrentProof(catalog, graph, testPaths) {
  return createResolvedImpact({
    acceptanceIds: uniqueSorted(
      catalog.acceptance.map((row) => row.acceptanceId),
    ),
    catalog,
    performanceRows: catalog.performance,
    productTestFiles: uniqueSorted(
      graph.entries
        .filter((entry) => testPaths.isVitestTest(entry.repoPath))
        .map((entry) => entry.repoPath),
    ),
  });
}

function hasReverseExecutableTestProof(graph, supportPath, testPaths) {
  return getToolcraftAffectedTestFiles(graph, [supportPath]).some(
    (repoPath) =>
      testPaths.isVitestTest(repoPath) ||
      testPaths.isCatalogTest(repoPath),
  );
}

function requiresCompleteCurrentProofForPath(
  repoPath,
  graph,
  graphEntries,
  testPaths,
) {
  return (
    verificationImpactInventoryPaths.has(repoPath) ||
    testPaths.isDeletedTestOrSupport(repoPath) ||
    isConservativeDeletedProductSourceOrResource(repoPath, graphEntries) ||
    (
      testPaths.isCurrentTestSupport(repoPath) &&
      !hasReverseExecutableTestProof(graph, repoPath, testPaths)
    )
  );
}

function isCurrentOptionalProductResource(repoPath, graphEntries) {
  const entry = graphEntries.get(repoPath);
  return (
    entry?.owner === "product" &&
    entry.role === "production" &&
    classifyToolcraftProductVerificationSourcePath(repoPath)?.kind ===
      "resource"
  );
}

export function resolveToolcraftChangedVerificationImpact({
  catalog,
  changedFiles,
  graph,
  inventory,
}) {
  const ownersByPath = new Map(
    inventory.owners.map((owner) => [owner.path, owner]),
  );
  const graphEntries = new Map(
    graph.entries.map((entry) => [entry.repoPath, entry]),
  );
  const testPaths = createVerificationTestPathClassifier(
    catalog,
    graphEntries,
  );
  const selectedOwners = new Set();
  const changed = uniqueSorted(
    changedFiles.map((filePath) =>
      filePath.replaceAll("\\", "/").replace(/^\.\//u, ""),
    ),
  );
  const completeCurrentProofPaths = new Set(
    changed.filter((changedPath) =>
      requiresCompleteCurrentProofForPath(
        changedPath,
        graph,
        graphEntries,
        testPaths,
      )
    ),
  );
  const requiresCompleteCurrentProof = completeCurrentProofPaths.size > 0;
  for (const changedPath of changed) {
    if (completeCurrentProofPaths.has(changedPath)) continue;
    const ownerPaths = [
      ...(ownersByPath.has(changedPath) ? [changedPath] : []),
      ...getToolcraftStrongestImporters(graph, changedPath),
    ];
    const resolvedOwners = ownerPaths
      .map((ownerPath) => ownersByPath.get(ownerPath))
      .filter(Boolean);
    for (const owner of resolvedOwners) selectedOwners.add(owner);
    const isCurrentTestSupport =
      testPaths.isCurrentTestSupport(changedPath);
    const isRoutedTest =
      testPaths.isVitestTest(changedPath) ||
      isCurrentTestSupport ||
      testPaths.isCatalogTest(changedPath);
    if (
      resolvedOwners.length === 0 &&
      !isRoutedTest &&
      changedPath !== "docs/toolcraft/agent-worklog.md" &&
      !(
        requiresCompleteCurrentProof &&
        isCurrentOptionalProductResource(changedPath, graphEntries)
      )
    ) {
      throw new Error(
        `Unrecognized changed verification input "${changedPath}" cannot select protected proof.`,
      );
    }
  }
  if (requiresCompleteCurrentProof) {
    return createCompleteCurrentProof(catalog, graph, testPaths);
  }
  const affectedTestFiles = getToolcraftAffectedTestFiles(graph, changed);
  const selectedTestSet = new Set(affectedTestFiles);
  const productTestFiles = uniqueSorted(
    affectedTestFiles.filter((repoPath) => testPaths.isVitestTest(repoPath)),
  );
  const acceptanceRows = catalog.acceptance.filter((row) => {
    const file = toRepoTestFile(row.file);
    return selectedTestSet.has(file) || changed.includes(file);
  });
  const changedPerformanceTest =
    selectedTestSet.has(performanceSpecPath) ||
    changed.includes(performanceSpecPath);
  const ownerList = [...selectedOwners].filter(Boolean);
  const acceptanceIds = uniqueSorted([
    ...ownerList.flatMap((owner) => owner.acceptanceIds),
    ...acceptanceRows.map((row) => row.acceptanceId),
    ...(changedPerformanceTest
      ? catalog.acceptance.map((row) => row.acceptanceId)
      : []),
  ]);
  const candidatePassIds = new Set([
    ...ownerList.flatMap((owner) =>
      owner.kind === "performance" ? owner.passIds : [],
    ),
  ]);
  const performanceRows = catalog.performance.filter(
    (row) =>
      changedPerformanceTest ||
      row.passIds.some((passId) => candidatePassIds.has(passId)),
  );
  return createResolvedImpact({
    acceptanceIds,
    catalog,
    performanceRows,
    productTestFiles,
  });
}
