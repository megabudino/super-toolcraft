const fullAuditRecommendation = Object.freeze({
  command: "pnpm verify:perf",
  kind: "offer-full-performance-audit",
  reason: "two-consecutive-compatible-performance-iterations",
  requiresExplicitUserConsent: true,
});

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function getPerformanceReport(receipt) {
  return receipt?.verification?.targetedPerformanceReport ?? null;
}

export function getToolcraftPerformanceEscalationRecommendation({
  currentReceipt,
  previousReceipt,
}) {
  if (
    currentReceipt?.mode !== "performance-iteration" ||
    previousReceipt?.mode !== "performance-iteration"
  ) {
    return null;
  }

  const currentReport = getPerformanceReport(currentReceipt);
  const previousReport = getPerformanceReport(previousReceipt);
  const previousReportHash =
    previousReceipt.verification?.targetedPerformanceReportHash;
  const comparison = currentReceipt.verification?.performanceComparison;

  if (
    comparison?.status !== "compared" ||
    !isSha256(currentReport?.requestAuthorityHash) ||
    !isSha256(previousReport?.requestAuthorityHash) ||
    !isSha256(previousReportHash) ||
    comparison.previousReportHash !== previousReportHash
  ) {
    return null;
  }

  return fullAuditRecommendation;
}

export function formatToolcraftPerformanceEscalationRecommendation(
  recommendation,
) {
  if (recommendation?.kind !== "offer-full-performance-audit") return "";

  return [
    "Toolcraft performance recommendation:",
    "two consecutive compatible targeted iterations have passed.",
    "Offer the user a slower complete performance audit if performance is still unacceptable.",
    "Do not run pnpm verify:perf without explicit user consent; the user does not need to know the command name.",
  ].join(" ");
}
