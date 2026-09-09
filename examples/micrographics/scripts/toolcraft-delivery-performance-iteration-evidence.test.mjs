import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { runToolcraftDeliveryVerification } from "./run-delivery-verification.mjs";
import {
  createDeliveryFixture,
  getCompletedFixtureEvents,
  removeDeliveryFixture,
} from "./run-delivery-verification-test-helpers.mjs";
import { writePerformanceIterationWorklog } from "./run-browser-performance-test-helpers.mjs";
import {
  getToolcraftDeliveryReceiptShapeError,
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import { commitToolcraftDeliveryCheckpoint } from "./toolcraft-checkpoint-transaction.mjs";
import { createToolcraftTargetedPerformanceReportHash } from "./toolcraft-targeted-performance-report.mjs";
import {
  iterationArguments,
  performanceTestName,
  updateRenderer,
} from "./toolcraft-delivery-performance-iteration-test-helpers.mjs";

test("performance iteration stores canonical evidence for an exact full-title selector", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  updateRenderer(rootDir, 2);
  const fullTitle = `app-controls.spec.ts › ${performanceTestName}`;
  writePerformanceIterationWorklog(rootDir, "2", fullTitle);

  const receipt = await runToolcraftDeliveryVerification({
    arguments_: [
      "--reason=performance-iteration",
      "--tier=3",
      `--performance-test=${fullTitle}`,
    ],
    projectDir: rootDir,
  });

  assert.deepEqual(receipt.verification.performanceTests, [
    performanceTestName,
  ]);
  assert.deepEqual(receipt.verification.performanceTestTitles, [fullTitle]);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});
test("performance iteration binds multiple selectors when leaf and full-title order differ", async (t) => {
  const firstTest = "browser perf: z renderer path";
  const secondTest = "browser perf: a renderer path";
  const firstFullTitle = `a-controls.spec.ts › ${firstTest}`;
  const secondFullTitle = `z-controls.spec.ts › ${secondTest}`;
  const rootDir = createDeliveryFixture({
    errors: [],
    suites: [
      {
        specs: [{ tags: [], tests: [{ projectName: "" }], title: firstTest }],
        title: "a-controls.spec.ts",
      },
      {
        specs: [{ tags: [], tests: [{ projectName: "" }], title: secondTest }],
        title: "z-controls.spec.ts",
      },
    ],
  });
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  updateRenderer(rootDir, 2);
  writePerformanceIterationWorklog(rootDir, "2", [
    secondFullTitle,
    firstFullTitle,
  ]);

  const receipt = await runToolcraftDeliveryVerification({
    arguments_: [
      "--reason=performance-iteration",
      "--tier=3",
      `--performance-test=${secondFullTitle}`,
      `--performance-test=${firstFullTitle}`,
    ],
    projectDir: rootDir,
  });

  assert.deepEqual(receipt.verification.performanceTests, [
    secondTest,
    firstTest,
  ]);
  assert.deepEqual(receipt.verification.performanceTestTitles, [
    firstFullTitle,
    secondFullTitle,
  ]);
  assert.deepEqual(receipt.verification.performanceTestEvidence, [
    { fullTitle: firstFullTitle, leafTitle: firstTest },
    { fullTitle: secondFullTitle, leafTitle: secondTest },
  ]);
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("performance iteration rejects a nonexistent exact selector without changing authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  updateRenderer(rootDir, 2);
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const authorityBefore = readFileSync(bundlePath, "utf8");
  writePerformanceIterationWorklog(
    rootDir,
    "2",
    "browser perf: nonexistent selector",
  );

  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: [
        "--reason=performance-iteration",
        "--tier=3",
        "--performance-test=browser perf: nonexistent selector",
      ],
      projectDir: rootDir,
    }),
    /did not match any Playwright test/iu,
  );

  assert.equal(readFileSync(bundlePath, "utf8"), authorityBefore);
  assert.equal(getCompletedFixtureEvents(rootDir, "maximum").length, 0);
});

test("performance-iteration receipt requires complete targeted performance inventories", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  updateRenderer(rootDir, 2);
  const receipt = await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });

  for (const field of [
    "performanceTests",
    "performancePassIds",
    "performancePathIds",
  ]) {
    assert.match(
      getToolcraftDeliveryReceiptShapeError({
        ...receipt,
        verification: { ...receipt.verification, [field]: [] },
      }),
      /performance-iteration.*non-empty.*test.*pass.*path/iu,
    );
  }
});

test("performance-iteration receipt binds selectors, passes, and paths to its protected report", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  updateRenderer(rootDir, 2);
  const receipt = await runToolcraftDeliveryVerification({
    arguments_: iterationArguments,
    projectDir: rootDir,
  });
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const authorityBefore = readFileSync(bundlePath, "utf8");

  const forgedVerifications = [
    {
      ...receipt.verification,
      performanceTests: ["browser perf: nonexistent selector"],
    },
    {
      ...receipt.verification,
      performanceTestTitles: [
        "unrelated.spec.ts › browser perf: focused renderer path",
      ],
    },
    { ...receipt.verification, performancePassIds: ["unrelated-pass"] },
    { ...receipt.verification, performancePathIds: ["unrelated-path"] },
    {
      ...receipt.verification,
      targetedPerformanceReportHash: "0".repeat(64),
    },
  ];

  const relaxedFixtureReport = {
    ...receipt.verification.targetedPerformanceReport,
    fixtureResolutionMode: "default",
    requestAuthorityHash: null,
  };
  const relaxedFixtureVerification = {
    ...receipt.verification,
    performanceComparison: null,
    targetedPerformanceReport: relaxedFixtureReport,
    targetedPerformanceReportHash:
      createToolcraftTargetedPerformanceReportHash({
        report: relaxedFixtureReport,
        testEvidence: receipt.verification.performanceTestEvidence,
      }),
  };
  assert.match(
    getToolcraftDeliveryReceiptShapeError({
      ...receipt,
      verification: relaxedFixtureVerification,
    }),
    /fixtureResolutionMode does not match/iu,
  );

  for (const verification of forgedVerifications) {
    const forgedReceipt = { ...receipt, verification };
    assert.match(
      getToolcraftDeliveryReceiptShapeError(forgedReceipt),
      /resolved.*evidence|targeted performance report/iu,
    );
    await assert.rejects(
      commitToolcraftDeliveryCheckpoint({
        deliveryReceipt: forgedReceipt,
        projectDir: rootDir,
      }),
      /resolved.*evidence|targeted performance report/iu,
    );
  }
  assert.equal(readFileSync(bundlePath, "utf8"), authorityBefore);
});
