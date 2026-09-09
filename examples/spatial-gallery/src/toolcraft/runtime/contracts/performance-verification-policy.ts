export * from "./performance-request-classifier";

export const TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY = {
  agentBrowser:
    "Agent-controlled browser checks are limited to diagnosis and targeted visual investigation; they do not mint durable performance baselines or receipts.",
  deliveryBatch:
    "Classify and verify one coherent user-visible delivery batch instead of treating each internal implementation pass or steering correction as a separate aggregate verification boundary.",
  deliveryCommand:
    "Use the protected pnpm verify:delivery command once at the delivery boundary; do not chain verify:quick, performance checkpoint or iteration commands, and verify:final for unchanged source.",
  fullAuditDiscovery:
    "The complete performance matrix remains outside conversational delivery. Complaints, repetition, tier, filename, and touched subsystem never launch it automatically. After two consecutive compatible protected performance iterations, the agent must offer a slower complete audit if the user remains unsatisfied; a demonstrably broad or unlocalizable cross-system problem may justify the same offer earlier. An explicit natural-language request for the complete audit, or explicit acceptance of the agent's offer, authorizes the agent acting as operator to run pnpm verify:perf; the user does not need to know the command name. After the audit, repair and rerun failed paths with focused checks, then run the complete matrix only once at the requested certification boundary.",
  performanceIterationDelivery:
    "The runtime request classifier is a tri-state guard, not a replacement for AI semantic judgment: high-confidence runtime complaints, responsiveness optimization, or excessive CPU, GPU, memory, or resource use classify as performance-iteration; high-confidence product motion, speed, freeze, terminology, or locally negated complaint commands classify as ordinary-product-work; ambiguous or unrecognized wording classifies as needs-agent-judgment and the AI decides from the actual user request. Ordinary work is rejected only for a high-confidence performance iteration. Every performance-iteration worklog intent quotes a nontrivial exact raw substring of Request; whitespace and Unicode code units must match before normalized tri-state classification. Invented, whitespace-collapsed, NFKC-equivalent, or mismatched evidence is rejected; high-confidence ordinary evidence is rejected; exact high-confidence performance-iteration or needs-agent-judgment evidence is accepted under agent ownership. Each performance iteration requires an exact reachable development fixture and fails with a configuration error instead of falling back to maximum. Direct and repeated performance complaints each start one bounded targeted iteration over affected paths. Complaint wording and repetition never select the complete performance matrix, create or refresh a durable baseline, or grant full-performance certification authority.",
  ordinaryDelivery:
    "After the prototype delivery, ordinary-product-work uses exact affected functional checks and only bounded targeted performance proof for changed performance paths; ordinary work cannot silently invoke the full performance matrix or create or refresh its baseline.",
  prototypeDelivery:
    "The first prototype delivery runs complete functional acceptance plus one bounded protected performance smoke on an exact reachable development fixture. If that fixture is unavailable, smoke fails with a configuration error instead of falling back to maximum or launching the full performance matrix; prototype delivery does not require a durable performance baseline.",
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
  fullAudit: {
    automaticLaunch: "forbidden",
    command: "verify:perf",
    executionAuthority: "explicit-user-request-or-accepted-agent-offer",
    recommendation:
      "two-compatible-iterations-or-agent-judged-broad-unlocalizable-problem",
    userCommandKnowledge: "not-required",
  },
  modes: {
    performanceIteration: {
      baseline: "not-required",
      fixture: "strict-development",
      intent: "performance-iteration",
      performance: "affected-paths-only",
    },
    ordinary: {
      baseline: "preserve",
      fixture: "development-with-maximum-fallback",
      intent: "ordinary-product-work",
      performance: "affected-paths-only",
    },
    prototype: {
      baseline: "not-required",
      fixture: "strict-development",
      intent: "ordinary-product-work",
      performance: "bounded-development-smoke",
    },
  },
} as const;

export const TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY_TEXT = [
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.agentBrowser,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.deliveryBatch,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.deliveryCommand,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.prototypeDelivery,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.ordinaryDelivery,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.performanceIterationDelivery,
  TOOLCRAFT_PERFORMANCE_VERIFICATION_POLICY.fullAuditDiscovery,
].join(" ");
