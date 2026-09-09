import assert from "node:assert/strict";
import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  createProtectedRunnerFixture,
  invokeRunner,
  iterationRunnerFileName,
  readCheckpointBundle,
  readPlaywrightShimEvents,
  writePerformanceIterationWorklog,
  writePassedCheckpointFixture,
} from "./run-browser-performance-test-helpers.mjs";
test("post-first-working Tier 3 iteration requires and records exact targeted performance tests", async (t) => {
  const rootDir = createProtectedRunnerFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  const baseline = await writePassedCheckpointFixture(rootDir);
  writeFileSync(
    path.join(rootDir, "src", "app.ts"),
    "export const value = 2;\n",
  );

  const missingTarget = invokeRunner(rootDir, iterationRunnerFileName, [
    "--tier=3",
  ]);
  assert.notEqual(missingTarget.status, 0);
  assert.match(
    `${missingTarget.stdout}\n${missingTarget.stderr}`,
    /requires at least one exact --performance-test selector/iu,
  );

  const testName = "browser perf: focused renderer path";
  const targeted = invokeRunner(
    rootDir,
    iterationRunnerFileName,
    ["--tier=3", `--performance-test=${testName}`],
    { ...process.env, TOOLCRAFT_PERFORMANCE_FIXTURE_SELECTOR: "maximum" },
  );
  assert.equal(targeted.signal, null);
  assert.equal(targeted.status, 0, `${targeted.stdout}\n${targeted.stderr}`);

  const receipt = readCheckpointBundle(rootDir).delivery;
  assert.equal(receipt.mode, "performance-iteration");
  assert.equal(receipt.status, "passed");
  assert.equal(
    receipt.baselineEvidenceHash,
    baseline.performanceEvidence.reportHash,
  );
  const {
    performanceComparison,
    targetedPerformanceReport,
    targetedPerformanceReportHash,
    ...verification
  } = receipt.verification;
  assert.deepEqual(performanceComparison, {
    reason: "previous-delivery-has-no-compatible-targeted-measurements",
    status: "not-comparable",
  });
  assert.deepEqual(verification, {
    browserTestEvidence: [],
    browserTestTitles: [],
    browserTests: [],
    checks: ["typecheck", "build", "playwright-targeted-performance"],
    performancePassIds: ["composite"],
    performancePathIds: ["performance-path:composite"],
    performanceTestEvidence: [
      {
        fullTitle: `app-controls.spec.ts › ${testName}`,
        leafTitle: testName,
      },
    ],
    performanceTestTitles: [`app-controls.spec.ts › ${testName}`],
    performanceTests: [testName],
    runner: "protected-iteration",
    unitTests: [],
  });
  assert.deepEqual(targetedPerformanceReport, {
    fixtureResolutionMode: "strict-development",
    fixtureSelector: "development",
    measurements: targetedPerformanceReport.measurements,
    nonce: targetedPerformanceReport.nonce,
    performancePassIds: ["composite"],
    performancePathIds: ["performance-path:composite"],
    requestAuthorityHash: targetedPerformanceReport.requestAuthorityHash,
    sourceHash: receipt.sourceHash,
    testNames: [testName],
    version: 3,
  });
  assert.equal(targetedPerformanceReport.measurements.length, 3);
  assert.match(targetedPerformanceReport.requestAuthorityHash, /^[a-f0-9]{64}$/u);
  assert.match(targetedPerformanceReportHash, /^[a-f0-9]{64}$/u);
  assert.equal(
    readPlaywrightShimEvents(rootDir).findLast(
      (event) => event.event === "completed",
    )?.fixtureSelector,
    "development",
  );
  assert.equal(
    readPlaywrightShimEvents(rootDir).findLast(
      (event) => event.event === "completed",
    )?.fixtureResolutionMode,
    "strict-development",
  );
  assert.equal(
    readCheckpointBundle(rootDir).currentPerformance.sourceHash,
    baseline.sourceHash,
  );
});

test("targeted iteration rejects zero or ambiguous title matches before receipt", async (t) => {
  const duplicateTitle = "browser perf: duplicated leaf";
  const report = {
    errors: [],
    suites: [
      {
        title: "app-controls.spec.ts",
        suites: ["suite one", "suite two"].map((title) => ({
          specs: [
            { title: duplicateTitle, tags: [], tests: [{ projectName: "" }] },
          ],
          title,
        })),
      },
    ],
  };
  for (const requestedTitle of ["browser perf: missing", duplicateTitle]) {
    const rootDir = createProtectedRunnerFixture(report);
    t.after(() => rmSync(rootDir, { force: true, recursive: true }));
    const baseline = await writePassedCheckpointFixture(rootDir);
    writeFileSync(
      path.join(rootDir, "src", "app.ts"),
      "export const value = 2;\n",
    );
    writePerformanceIterationWorklog(rootDir, "2", requestedTitle);

    const result = invokeRunner(rootDir, iterationRunnerFileName, [
      "--tier=3",
      `--performance-test=${requestedTitle}`,
    ]);

    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /did not match|matched 2/u,
    );
    assert.deepEqual(
      readCheckpointBundle(rootDir).currentPerformance,
      baseline,
    );
  }
});
