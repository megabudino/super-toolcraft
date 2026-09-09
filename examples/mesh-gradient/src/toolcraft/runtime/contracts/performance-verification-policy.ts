export const TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY = {
  agentBrowser:
    "Agent-controlled browser checks are limited to diagnosis and targeted visual investigation; they do not mint durable performance baselines or receipts.",
  deliveryBatch:
    "Classify and verify one coherent user-visible delivery batch instead of treating each internal implementation pass or steering correction as a separate aggregate verification boundary.",
  deliveryCommand:
    "Use the protected pnpm verify:delivery command once at the delivery boundary; do not chain verify:quick, performance checkpoint or iteration commands, and verify:final for unchanged source.",
  explicitPerformanceRefresh:
    "With a durable baseline, explicit later performance work makes pnpm verify:delivery run the protected Playwright full refresh represented by the verify:perf:refresh compatibility command.",
  firstStable:
    "Without a durable baseline, pnpm verify:delivery runs the first stable working product's protected Playwright full checkpoint represented by the verify:perf compatibility command and machine-produces the baseline plus current receipt.",
  ordinaryLaterEdit:
    "With a durable baseline and no explicit performance request, pnpm verify:delivery uses the protected targeted iteration runner with exact affected tests and a baseline-linked current receipt instead of rerunning or refreshing the full checkpoint.",
} as const;

export const TOOLCRAFT_PERFORMANCE_VERIFICATION_LIFECYCLE = {
  diagnosis: {
    durableEvidence: false,
    purposes: ["diagnosis", "targeted-visual-investigation"],
    runner: "agent-browser",
  },
  delivery: {
    boundary: "coherent-user-visible-delivery-batch",
    command: "verify:delivery",
    duplicateAggregateChecks: "forbidden",
  },
  durableEvidence: {
    explicitRefreshCommand: "verify:perf:refresh",
    firstStableCommand: "verify:perf",
    ordinaryIterationCommand: "verify:perf:record-iteration",
    runner: "protected-playwright",
  },
} as const;

export const TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY_TEXT = [
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.agentBrowser,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.deliveryBatch,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.deliveryCommand,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.firstStable,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.explicitPerformanceRefresh,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.ordinaryLaterEdit,
].join(" ");
