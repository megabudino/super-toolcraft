import {
  createToolcraftTargetedPerformanceReportHash,
  getToolcraftTargetedPerformanceReportError,
} from "./toolcraft-targeted-performance-report.mjs";

function isUniqueStringArray(value) {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.length > 0) &&
    new Set(value).size === value.length
  );
}

function isUniqueSortedStringArray(value) {
  return (
    isUniqueStringArray(value) &&
    value.every((item, index) => index === 0 || value[index - 1] < item)
  );
}

function isResolvedTitleForLeaf(fullTitle, leafTitle) {
  return fullTitle === leafTitle || fullTitle.endsWith(` › ${leafTitle}`);
}

function arraysEqual(left, right) {
  return (
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  );
}

function getCanonicalTestEvidenceError(evidence) {
  if (
    !Array.isArray(evidence) ||
    !evidence.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        !Array.isArray(entry) &&
        Object.keys(entry).length === 2 &&
        typeof entry.fullTitle === "string" &&
        typeof entry.leafTitle === "string" &&
        isResolvedTitleForLeaf(entry.fullTitle, entry.leafTitle),
    ) ||
    new Set(evidence.map(({ fullTitle }) => fullTitle)).size !==
      evidence.length ||
    !evidence.every(
      (entry, index) =>
        index === 0 || evidence[index - 1].fullTitle < entry.fullTitle,
    )
  ) {
    return "Toolcraft targeted iteration canonical test evidence is malformed.";
  }
  return undefined;
}

function getTargetedReportError(
  verification,
  sourceHash,
  testEvidence,
  reportExpectation = {},
) {
  if (verification.performanceTests.length === 0) {
    return verification.targetedPerformanceReport === null &&
      verification.targetedPerformanceReportHash === null
      ? undefined
      : "Toolcraft targeted iteration without performance tests cannot claim a targeted performance report.";
  }
  if (
    !/^[a-f0-9]{64}$/u.test(verification.targetedPerformanceReportHash ?? "")
  ) {
    return "Toolcraft targeted performance report hash is malformed.";
  }
  const reportError = getToolcraftTargetedPerformanceReportError(
    verification.targetedPerformanceReport,
    {
      ...reportExpectation,
      ...(sourceHash === undefined ? {} : { sourceHash }),
      performancePassIds: verification.performancePassIds,
      performancePathIds: verification.performancePathIds,
      testNames: verification.performanceTests,
    },
  );
  if (reportError) return reportError;
  const expectedHash = createToolcraftTargetedPerformanceReportHash({
    report: verification.targetedPerformanceReport,
    ...testEvidence,
  });
  return expectedHash === verification.targetedPerformanceReportHash
    ? undefined
    : "Toolcraft targeted performance report hash does not match its resolved test evidence.";
}

export function getLegacyResolvedTargetedEvidenceError(
  verification,
  sourceHash,
) {
  if (
    !isUniqueSortedStringArray(verification.browserTestTitles) ||
    !isUniqueSortedStringArray(verification.performanceTestTitles) ||
    verification.browserTestTitles.length !==
      verification.browserTests.length ||
    verification.performanceTestTitles.length !==
      verification.performanceTests.length ||
    !verification.browserTestTitles.every((title, index) =>
      isResolvedTitleForLeaf(title, verification.browserTests[index]),
    ) ||
    !verification.performanceTestTitles.every((title, index) =>
      isResolvedTitleForLeaf(title, verification.performanceTests[index]),
    )
  ) {
    return "Toolcraft targeted iteration resolved test evidence is malformed.";
  }
  return getTargetedReportError(verification, sourceHash, {
    testTitles: verification.performanceTestTitles,
  });
}

export function getResolvedTargetedEvidenceError(
  verification,
  sourceHash,
  { reportExpectation } = {},
) {
  const browserEvidenceError = getCanonicalTestEvidenceError(
    verification.browserTestEvidence,
  );
  if (browserEvidenceError) return browserEvidenceError;
  const performanceEvidenceError = getCanonicalTestEvidenceError(
    verification.performanceTestEvidence,
  );
  if (performanceEvidenceError) return performanceEvidenceError;

  const expectedBrowserTests = [
    ...new Set(
      verification.browserTestEvidence.map(({ leafTitle }) => leafTitle),
    ),
  ].sort();
  const expectedPerformanceTests = [
    ...new Set(
      verification.performanceTestEvidence.map(({ leafTitle }) => leafTitle),
    ),
  ].sort();
  const expectedBrowserTitles = verification.browserTestEvidence.map(
    ({ fullTitle }) => fullTitle,
  );
  const expectedPerformanceTitles = verification.performanceTestEvidence.map(
    ({ fullTitle }) => fullTitle,
  );
  if (
    !isUniqueSortedStringArray(verification.browserTestTitles) ||
    !isUniqueSortedStringArray(verification.performanceTestTitles) ||
    !arraysEqual(verification.browserTests, expectedBrowserTests) ||
    !arraysEqual(verification.performanceTests, expectedPerformanceTests) ||
    !arraysEqual(verification.browserTestTitles, expectedBrowserTitles) ||
    !arraysEqual(verification.performanceTestTitles, expectedPerformanceTitles)
  ) {
    return "Toolcraft targeted iteration resolved test evidence is malformed.";
  }
  return getTargetedReportError(verification, sourceHash, {
    testEvidence: verification.performanceTestEvidence,
  }, reportExpectation);
}
