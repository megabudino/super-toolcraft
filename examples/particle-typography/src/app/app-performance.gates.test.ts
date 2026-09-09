import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import {
  TOOLCRAFT_PERFORMANCE_VERIFICATION_LIFECYCLE,
  assessToolcraftRenderPlan,
  collectToolcraftWorkloadControls,
  collectToolcraftUnclassifiedPerformanceControls,
  type ToolcraftEnvelopePerformanceConfig,
  validateToolcraftPerformanceCoverage,
} from "@/toolcraft/runtime";
import {
  createToolcraftKernelBenchmarkRequirements,
  getToolcraftKernelBenchmarkReceiptPath,
  readToolcraftKernelBenchmarkReceipt,
} from "../../scripts/toolcraft-kernel-benchmark-receipt.mjs";
import {
  collectToolcraftVerificationInputs,
  validateToolcraftCurrentPerformanceImpactInventory,
} from "../../scripts/toolcraft-verification-receipt.mjs";
import {
  createToolcraftScriptLineBudgetPolicy,
  getToolcraftScriptProductionEntryPaths,
  toolcraftScriptSourceExtensions,
} from "../../scripts/toolcraft-delivery-architecture-policy.mjs";
import {
  TOOLCRAFT_DELIVERY_VERIFICATION_COMMAND,
  TOOLCRAFT_FULL_PERFORMANCE_VERIFICATION_COMMAND,
} from "../../scripts/toolcraft-performance-authority-policy.mjs";
import { evaluateCodeHealth } from "../../scripts/toolcraft-code-health-core.mjs";
import { requiredPackageScriptNames } from "../../scripts/toolcraft-integrity-policy.mjs";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import {
  e2eDir,
  playwrightConfigForbidsFocusedTests,
  projectDir,
} from "./app-performance-test-utils";

const expectedRequiredPackageScriptNames = [
  "ai:check", "build", "dev", "dev:restart", "docs:check", "preview",
  "preview:restart", "test", "test:browser", "typecheck", "verify:delivery",
  "verify:kernel", "verify:perf", "verify:receipt",
] as const;

async function evaluateGeneratedScriptBudgets(rootDir: string) {
  return evaluateCodeHealth({
    ...createToolcraftScriptLineBudgetPolicy("scripts"),
    productionEntryPaths: getToolcraftScriptProductionEntryPaths("scripts"),
    rootDir,
    sourceExtensions: toolcraftScriptSourceExtensions,
    sourceRoots: ["scripts"],
  });
}

describe("Toolcraft starter performance gates", () => {
  it("publishes separate browser acceptance and performance fallback gates", () => {
    const packageJson = JSON.parse(readFileSync(join(projectDir, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    const generatedAppTestScript =
      packageJson.scripts?.["test:generated"] ?? packageJson.scripts?.test;

    expect(requiredPackageScriptNames).toEqual(expectedRequiredPackageScriptNames);
    for (const scriptName of requiredPackageScriptNames) {
      expect(packageJson.scripts?.[scriptName]).toBeDefined();
    }
    for (const removed of [
      "test:delivery", "verify:final", "verify:perf:record-iteration",
      "verify:quick", "verify:ui",
    ]) {
      expect(packageJson.scripts?.[removed]).toBeUndefined();
    }
    expect(packageJson.scripts?.["ai:check"]).toBe(
      "node scripts/check-toolcraft-code-health.mjs",
    );
    const sourceTestScript =
      "node scripts/check-toolcraft-docs.mjs && node --test scripts/*.test.mjs && vitest run src --passWithNoTests --reporter=default --reporter=./scripts/toolcraft-vitest-runtime-evidence-reporter.mjs";
    const generatedTestScript =
      "node scripts/check-toolcraft-docs.mjs && node scripts/check-toolcraft-integrity.mjs && node --test scripts/*.test.mjs && vitest run src --passWithNoTests --reporter=default --reporter=./scripts/toolcraft-vitest-runtime-evidence-reporter.mjs";
    if (packageJson.scripts?.["test:generated"]) {
      expect(packageJson.scripts.test).toBe(sourceTestScript);
      expect(packageJson.scripts["test:generated"]).toBe(generatedTestScript);
    } else {
      expect(packageJson.scripts?.test).toBe(generatedTestScript);
    }

    expect(
      generatedAppTestScript,
      "Generated app tests must invoke the Toolcraft integrity checker.",
    ).toContain("node scripts/check-toolcraft-integrity.mjs");

    expect(
      packageJson.scripts?.["test:browser"],
      "Generated apps must keep smoke, full performance, and kernel benchmark scenarios out of the default browser acceptance gate.",
    ).toBe(
      'playwright install chromium && playwright test --grep-invert "browser perf:|browser smoke:|toolcraft kernel:"',
    );
    expect(packageJson.scripts?.["test:browser:perf"]).toBeUndefined();
    const performanceRunner = readFileSync(
      join(projectDir, "scripts/run-browser-performance.mjs"),
      "utf8",
    );
    const receiptModule = readFileSync(
      join(projectDir, "scripts/toolcraft-verification-receipt.mjs"),
      "utf8",
    );
    const deliveryRunner = readFileSync(
      join(projectDir, "scripts/run-delivery-verification.mjs"),
      "utf8",
    );
    const deliveryLifecycle = readFileSync(
      join(projectDir, "scripts/toolcraft-delivery-lifecycle.mjs"),
      "utf8",
    );
    const proofProcess = readFileSync(
      join(projectDir, "scripts/toolcraft-proof-process.mjs"),
      "utf8",
    );
    const deliveryReceiptModule = readFileSync(
      join(projectDir, "scripts/toolcraft-delivery-receipt.mjs"),
      "utf8",
    );
    expect(performanceRunner).toContain(
      "runToolcraftFullPerformanceCertification",
    );
    expect(performanceRunner).not.toContain("runToolcraftDeliveryVerification");
    expect(performanceRunner).not.toContain("--reason=");
    expect(performanceRunner).toContain("withToolcraftVerificationLock");
    expect(performanceRunner).toContain("measureToolcraftPerformanceCheckpoint");
    expect(performanceRunner).not.toContain("writeCheckpointFile");
    expect(receiptModule).not.toContain(
      "export async function writeToolcraftPerformanceReceipt",
    );
    expect(deliveryReceiptModule).not.toContain(
      "export async function writeToolcraftDeliveryReceipt",
    );
    expect(packageJson.scripts?.["verify:delivery"]).toBe(
      "node scripts/run-delivery-verification.mjs",
    );
    expect(deliveryRunner).toContain("executeToolcraftDeliveryLifecycle");
    expect(deliveryRunner).toContain("withToolcraftVerificationLock");
    expect(deliveryLifecycle).toContain(
      "executeToolcraftDeliveryLifecycleCore",
    );
    expect(deliveryLifecycle).toContain("executeToolcraftDeliveryPlan");
    expect(deliveryLifecycle).not.toContain(
      "runToolcraftFullPerformanceCertification",
    );
    expect(deliveryLifecycle).not.toContain(
      "measureToolcraftPerformanceCheckpoint",
    );
    expect(proofProcess).toContain('from "cross-spawn"');
    expect(proofProcess).toContain("ensureToolcraftChromium");
    const deliverySources = `${deliveryRunner}\n${deliveryLifecycle}`;
    expect(deliverySources).not.toContain('runPackageScript(projectDir, "verify:quick")');
    expect(deliverySources).not.toContain('runPackageScript(projectDir, "verify:final")');
    expect(deliverySources).not.toContain('runPackageScript(projectDir, "verify:perf")');
    expect(packageJson.scripts?.["verify:perf"]).toBe(
      "node scripts/run-browser-performance.mjs",
    );
    expect(packageJson.scripts?.["verify:perf:playwright"]).toBeUndefined();
    expect(packageJson.scripts?.["verify:perf:refresh"]).toBeUndefined();
    expect(
      packageJson.scripts?.["verify:perf:record-agent-browser"],
      "A terminal-only command must not mint an agent-browser performance receipt without browser evidence.",
    ).toBeUndefined();
    expect(
      packageJson.scripts?.["verify:perf:record-iteration"],
    ).toBeUndefined();
    expect(packageJson.scripts?.["verify:kernel"]).toBe(
      "node scripts/run-kernel-benchmarks.mjs",
    );
    const deliveryExecutor = readFileSync(
      join(projectDir, "scripts/toolcraft-delivery-executor.mjs"),
      "utf8",
    );
    const targetedPerformanceExecution = readFileSync(
      join(projectDir, "scripts/toolcraft-targeted-performance-execution.mjs"),
      "utf8",
    );
    expect(
      deliveryExecutor.match(
        /TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "development"/g,
      ),
    ).toHaveLength(1);
    expect(
      targetedPerformanceExecution.match(
        /TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "development"/g,
      ),
    ).toHaveLength(1);
    expect(packageJson.scripts?.["verify:perf:record-exemption"]).toBeUndefined();
    expect(receiptModule).not.toContain('command === "record-iteration"');
    expect(packageJson.scripts?.["verify:receipt"]).toContain("validate");
  });

  it("documents one automatic delivery workflow without command-shaped authority", () => {
    const routedDocs = [
      "AGENTS.md",
      "docs/toolcraft/README.md",
      "docs/toolcraft/acceptance-testing.md",
      "docs/toolcraft/agent-worklog.md",
      "docs/toolcraft/assembly-workflow.md",
      "docs/toolcraft/core/performance.md",
      "docs/toolcraft/performance.md",
      "docs/toolcraft/workflow.md",
    ];
    const docSources = routedDocs.map((relativePath) => ({
      relativePath,
      source: readFileSync(join(projectDir, relativePath), "utf8"),
    }));

    for (const { relativePath, source } of docSources) {
      expect(source, relativePath).toMatch(/first (?:product )?delivery/i);
      expect(source, relativePath).toMatch(/(?:later|ordinary) delivery/i);
      expect(source, relativePath).toMatch(/performance complaint/i);
      expect(source, relativePath).toMatch(/full audit/i);
      expect(source, relativePath).toContain(
        TOOLCRAFT_DELIVERY_VERIFICATION_COMMAND,
      );
      expect(source, relativePath).toContain(
        TOOLCRAFT_FULL_PERFORMANCE_VERIFICATION_COMMAND,
      );
    }

    const allRoutedDocs = docSources.map(({ source }) => source).join("\n");
    const nonAgentsDocs = docSources
      .filter(({ relativePath }) => relativePath !== "AGENTS.md")
      .map(({ source }) => source)
      .join("\n");
    expect(nonAgentsDocs).not.toMatch(/\bTier (?:N|[0-4])\b/);
    expect(allRoutedDocs).not.toMatch(
      /verify:quick|verify:ui|verify:final|verify:perf:record-iteration|test:delivery/,
    );
    expect(allRoutedDocs).not.toMatch(
      /verify:delivery\s+--|--tier|--unit-test|--browser-test|--performance-test/,
    );
    expect(allRoutedDocs).not.toMatch(/matching (?:executed )?`?Run\b`?/i);
    expect(allRoutedDocs).not.toContain("app-performance-impact.json");
  });

  it(
    "keeps generated verification scripts within shared recursive budgets",
    async () => {
      const result = await evaluateGeneratedScriptBudgets(projectDir);
      expect(result.lineBudgetViolations).toEqual([]);
    },
    15_000,
  );

  it("classifies every script extension and production-looking test by reachability", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "toolcraft-script-gate-"));
    try {
      const files = {
        "scripts/nested/fixture.spec.cjs":
          "export const fixture = true;\n".repeat(500),
        "scripts/nested/toolcraft-performance-worker.js":
          "export const execute = true;\n".repeat(301),
        "scripts/nested/types.cts": "export const type = true;\n",
        "scripts/nested/types.mts": "export const type = true;\n",
        "scripts/nested/worker.test.mjs":
          "export const execute = true;\n".repeat(351),
        "scripts/run-delivery-verification.mjs": [
          'import "./nested/toolcraft-performance-worker.js";',
          'import "./nested/worker.test.mjs";',
        ].join("\n"),
      };
      for (const [repoPath, source] of Object.entries(files)) {
        const absolutePath = join(rootDir, repoPath);
        mkdirSync(join(absolutePath, ".."), { recursive: true });
        writeFileSync(absolutePath, source);
      }
      const result = await evaluateGeneratedScriptBudgets(rootDir);
      expect(result.sourceFileCount).toBe(6);
      expect(
        result.lineBudgetViolations.map(({ maxLines, repoPath }) => ({
          maxLines,
          repoPath,
        })),
      ).toEqual([
        {
          maxLines: 300,
          repoPath: "scripts/nested/toolcraft-performance-worker.js",
        },
        {
          maxLines: 350,
          repoPath: "scripts/nested/worker.test.mjs",
        },
      ]);
    } finally {
      rmSync(rootDir, { force: true, recursive: true });
    }
  });

  it("keeps the Playwright performance audit inside the browser perf tag", () => {
    const source = readFileSync(join(e2eDir, "app-performance.spec.ts"), "utf8");
    const testNames = [...source.matchAll(/test\(\s*(["'`])([^"'`]+)\1/g)].map(
      (match) => match[2],
    );

    expect(source).not.toContain("TOOLCRAFT_PERF_CHECK");
    expect(source).toContain("compileToolcraftPerformancePathAdapterMatrix");
    expect(source).toContain("deriveToolcraftPerformancePaths");
    expect(source).toContain("appPerformancePathAdapters");
    expect(source).toContain("runToolcraftPerformancePath");
    expect(source).toContain("for (const entry of performancePathMatrix)");
    expect(testNames.length).toBeGreaterThan(0);
    expect(
      testNames.every((name) => name.includes("browser perf:")),
      `app-performance.spec.ts tests must all be tagged for the dedicated perf checkpoint: ${testNames.join(", ")}`,
    ).toBe(true);
  });

  it("keeps the bounded prototype smoke behind one stable browser tag", () => {
    const source = readFileSync(
      join(e2eDir, "app-performance-smoke.spec.ts"),
      "utf8",
    );
    const testNames = [...source.matchAll(/test\(\s*(["'`])([^"'`]+)\1/g)].map(
      (match) => match[2],
    );

    expect(testNames).toEqual([
      "browser smoke: toolcraft prototype responsiveness",
    ]);
    expect(source).toContain("selectToolcraftPerformanceSmokeEntries");
    expect(source).toContain("compileToolcraftPerformancePathAdapterMatrix");
    expect(source).toContain("runToolcraftPerformancePath");
    expect(source).toContain('fixtureResolutionMode: "strict-development"');
    expect(source).not.toContain("maximum");
  });

  it("rejects focused Playwright tests that would bypass protected browser gates", () => {
    expect(playwrightConfigForbidsFocusedTests()).toBe(true);
  });

  it("keeps verification lifecycle authority in the runtime contract", () => {
    expect(appPerformance).not.toHaveProperty("browserCheckPolicy");
    expect(TOOLCRAFT_PERFORMANCE_VERIFICATION_LIFECYCLE).toEqual({
      delivery: {
        command: "verify:delivery",
        modes: ["prototype", "ordinary", "performance-iteration"],
        selectors: "automatic",
      },
      fullPerformance: {
        command: "verify:perf",
        authority: "explicit-user-request-or-accepted-offer",
      },
    });
  });

  it("requires valid performance coverage for declared workload scenarios", () => {
    expect(validateToolcraftPerformanceCoverage(appSchema, appPerformance)).toEqual([]);
  });

  it("maps every product production module to current renderer pass ownership", async () => {
    const knownPassIds = (appPerformance.rendererPipeline?.passes ?? []).map(
      ({ id }) => id,
    );
    await expect(
      validateToolcraftCurrentPerformanceImpactInventory({
        knownPassIds,
        rootDir: projectDir,
      }),
    ).resolves.toBeDefined();
  });

  it("requires protected current-source kernel evidence for benchmark decisions", async () => {
    const performanceConfig: ToolcraftEnvelopePerformanceConfig = appPerformance;
    const decisions = performanceConfig.kernelBenchmarkDecisions ?? [];
    const rawAssessment = assessToolcraftRenderPlan(appSchema, {
      ...performanceConfig,
      kernelBenchmarkDecisions: undefined,
    });
    expect(rawAssessment.errors).toEqual([]);

    if (decisions.length === 0) {
      expect(rawAssessment.requiredBenchmarks).toEqual([]);
      return;
    }

    const requirements = createToolcraftKernelBenchmarkRequirements({
      decisions,
      requirements: rawAssessment.requiredBenchmarks,
    });
    const inventory = await collectToolcraftVerificationInputs(projectDir);
    await expect(
      readToolcraftKernelBenchmarkReceipt(
        getToolcraftKernelBenchmarkReceiptPath(projectDir),
        { requirements, sourceHash: inventory.sourceHash },
      ),
    ).resolves.toBeDefined();
  });

  it("starts from an explicit empty workload envelope", () => {
    if (collectToolcraftWorkloadControls(appSchema).length > 0) {
      return;
    }

    expect(appPerformance.workloadEnvelope).toEqual({ dimensions: [] });
    expect(appPerformance).not.toHaveProperty("rendererWorkload");
    expect(appPerformance).not.toHaveProperty("workloadTargets");
    expect(appPerformance).not.toHaveProperty("fixtureAdapters");
    expect(collectToolcraftWorkloadControls(appSchema)).toEqual([]);
  });

  it("keeps workload guidance structural instead of prescribing domain constants", () => {
    const monorepoRoot = join(projectDir, "..");
    const documentation = [
      join(projectDir, "AGENTS.md"),
      join(projectDir, "docs/toolcraft/core/performance.md"),
      join(projectDir, "docs/toolcraft/performance.md"),
      join(projectDir, "docs/toolcraft/renderer-technique.md"),
      join(projectDir, "docs/toolcraft/assembly-workflow.md"),
      join(projectDir, "docs/toolcraft/workflow.md"),
      join(monorepoRoot, "apps/website/src/content/docs/toolcraft-core-performance.md"),
      join(monorepoRoot, "apps/website/src/content/docs/toolcraft-performance.md"),
      join(monorepoRoot, "apps/website/src/content/docs/toolcraft-renderer-technique.md"),
      join(monorepoRoot, "apps/website/src/content/docs/toolcraft-assembly-workflow.md"),
      join(monorepoRoot, "apps/website/src/content/docs/toolcraft-workflow.md"),
    ]
      .filter((filePath) => existsSync(filePath))
      .map((filePath) => readFileSync(filePath, "utf8"))
      .join("\n");

    expect(documentation).toMatch(/reachable controls and inputs/i);
    expect(documentation).toMatch(/workload dimensions and enforced boundaries/i);
    expect(documentation).toMatch(
      /render-plan assessment(?: and| with).*protected kernel benchmark/i,
    );
    expect(documentation).toMatch(/derived paths and combined fixtures/i);
    expect(documentation).not.toMatch(/50_000|1_000\s+lines|1920x1080-equivalent/i);
    expect(documentation).not.toMatch(/classif(?:y|ication)[^\n]*(?:key name|key-name|keyword)/i);
    expect(documentation).not.toMatch(
      /bitmap-media|halftone|per-pixel|max text length|max media size/i,
    );
    expect(documentation).toMatch(/exact normalized development pressure `0\.8`/i);
    expect(documentation).toMatch(/exhaustive-discrete/i);
    expect(documentation).toMatch(/match(?:es)? every option one-to-one/i);
    expect(documentation).toMatch(/toolcraftDiscreteCombinationBudget/);
    expect(documentation).toMatch(/toolcraftDiscreteDimensionBudget/);
    expect(documentation).toMatch(/bypasses search budgets because no (?:combination )?search runs/i);
    expect(documentation).toMatch(/planning error/i);
    expect(documentation).toMatch(/TOOLCRAFT_PERFORMANCE_VERIFICATION_LIFECYCLE/);
    expect(documentation).toMatch(/exactly one scenario (?:for|per) (?:every )?(?:canonical |derived )?path/i);
    expect(documentation).toMatch(/targeted failure[^\n]*(?:not|rather than)[^\n]*full[- ]suite/i);
    expect(documentation).toMatch(
      /first product delivery[^\n]*full functional acceptance[^\n]*bounded[^\n]*prototype smoke/i,
    );
    expect(documentation).toMatch(/prototype-smoke/i);
    expect(documentation).toMatch(/full-performance/i);
    expect(documentation).toMatch(/needs-agent-judgment/i);
    expect(documentation).toMatch(
      /ordinary later delivery[^\n]*(?:same )?bare command[^\n]*exact ownership/i,
    );
    expect(documentation).not.toMatch(
      /first stable[^\n]*(?:full performance|full checkpoint|baseline)/i,
    );
    expect(documentation).not.toMatch(/compatibility mode|legacy preferred|legacy-only/i);
    expect(documentation).not.toMatch(/loadProfile|smoothTargetRatio/i);
    expect(documentation).not.toMatch(/without exceeding development pressure/i);
    expect(documentation).not.toMatch(/\breachableValues\b/);
  });

  it("requires every visible control to classify its performance role", () => {
    const unclassifiedControls =
      collectToolcraftUnclassifiedPerformanceControls(appSchema);

    expect(
      unclassifiedControls,
      "Every visible non-action control must declare performanceRole as workload or responsiveness so AI cannot skip the performance decision.",
    ).toEqual([]);
  });
});
