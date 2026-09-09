import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import test from "node:test";
import spawn from "cross-spawn";

import * as operatorModule from "./run-browser-performance.mjs";
import * as deliveryLifecycleModule from "./toolcraft-delivery-lifecycle.mjs";
import {
  createFullPerformanceFixture,
  invokeRunner,
  projectDir,
  readCheckpointBundle,
  readPlaywrightShimEvents,
  runProtectedRunner,
  runnerPath,
} from "./run-browser-performance-test-helpers.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";
import { validateToolcraftPerformanceReceipt } from "./toolcraft-verification-receipt.mjs";

const internalCheckpointReason = "explicit-performance-work";
const { runToolcraftFullPerformanceCertification } = operatorModule;

test("full certification exposes one locked operator entry point", () => {
  assert.deepEqual(Object.keys(operatorModule).sort(), [
    "runToolcraftFullPerformanceCertification",
  ]);
  assert.deepEqual(Object.keys(deliveryLifecycleModule).sort(), [
    "executeToolcraftDeliveryLifecycle",
  ]);
});

test("full certification remains an operator-only command", async (t) => {
  const rootDir = createFullPerformanceFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));

  const receipt = await runToolcraftFullPerformanceCertification({
    projectDir: rootDir,
  });

  assert.equal(receipt.kind, "delivery-verification");
  assert.equal(receipt.mode, "explicit-performance");
  assert.equal(
    readCheckpointBundle(rootDir).currentPerformance.checkpointReason,
    "explicit-performance-work",
  );
  const runnerSource = readFileSync(runnerPath, "utf8");
  assert.doesNotMatch(
    runnerSource,
    /getToolcraftCheckpointTransactionAuthorityError|readToolcraftDurablePerformanceBaseline/u,
  );
});

test("operator full performance command accepts no delivery reason", () => {
  const rootDir = createFullPerformanceFixture();
  try {
    const result = invokeRunner(rootDir, "run-browser-performance.mjs", [
      "--reason=explicit-performance-work",
    ]);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /does not accept arguments.*--reason=explicit-performance-work/iu,
    );
    assert.equal(existsSync(getToolcraftCheckpointBundlePath(rootDir)), false);
  } finally {
    rmSync(rootDir, { force: true, recursive: true });
  }
});

test("concurrent public operator calls yield one success and one lock rejection", async (t) => {
  const rootDir = createFullPerformanceFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));

  const results = await Promise.allSettled([
    runToolcraftFullPerformanceCertification({ projectDir: rootDir }),
    runToolcraftFullPerformanceCertification({ projectDir: rootDir }),
  ]);
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.match(String(rejected[0].reason), /verification run is already active/iu);
});

test("protected performance runner rejects malformed canonical authority before tools", async (t) => {
  const rootDir = createFullPerformanceFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  mkdirSync(path.dirname(bundlePath), { recursive: true });
  writeFileSync(bundlePath, "{not-json\n");

  await assert.rejects(
    runToolcraftFullPerformanceCertification({ projectDir: rootDir }),
    /checkpoint bundle is malformed JSON/iu,
  );

  assert.equal(
    readPlaywrightShimEvents(rootDir).filter(
      (event) => event.event === "completed" && event.fixtureSelector === "maximum",
    ).length,
    1,
  );
});

test("protected performance runner rejects Playwright filters before launching tools", () => {
  const bundlePath = getToolcraftCheckpointBundlePath(projectDir);
  const original = existsSync(bundlePath) ? readFileSync(bundlePath) : undefined;
  mkdirSync(path.dirname(bundlePath), { recursive: true });
  writeFileSync(bundlePath, Buffer.from("protected bundle sentinel\n"));

  try {
    const result = spawn.sync(
      process.execPath,
      [runnerPath, "e2e/app-performance.spec.ts"],
      { cwd: projectDir, encoding: "utf8", timeout: 5_000 },
    );
    assert.equal(result.signal, null);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /does not accept arguments.*app-performance\.spec\.ts/iu,
    );
    assert.equal(readFileSync(bundlePath, "utf8"), "protected bundle sentinel\n");
  } finally {
    if (original) writeFileSync(bundlePath, original);
    else rmSync(bundlePath, { force: true });
  }
});

test("operator full certification creates and refreshes the durable baseline", async (t) => {
  const rootDir = createFullPerformanceFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  runProtectedRunner(rootDir);
  const firstBundle = readCheckpointBundle(rootDir);
  const firstBaseline = firstBundle.performanceBaseline;
  assert.deepEqual(firstBundle.currentPerformance, firstBaseline);
  assert.equal(firstBaseline.checkpointReason, internalCheckpointReason);
  assert.match(firstBaseline.performanceEvidence.reportHash, /^[a-f0-9]{64}$/u);
  assert.equal(firstBaseline.performanceEvidence.profileCatalogVersion, 1);
  assert.equal(firstBaseline.performanceEvidence.measurements.length, 3);
  assert.equal(
    readPlaywrightShimEvents(rootDir).findLast(
      (event) => event.event === "completed",
    )?.fixtureSelector,
    "maximum",
  );

  writeFileSync(path.join(rootDir, "src", "app.ts"), "export const value = 2;\n");
  runProtectedRunner(rootDir);
  const secondBundle = readCheckpointBundle(rootDir);
  const secondBaseline = secondBundle.performanceBaseline;
  assert.notEqual(secondBaseline.sourceHash, firstBaseline.sourceHash);
  assert.equal(secondBaseline.checkpointReason, internalCheckpointReason);
  assert.deepEqual(secondBundle.currentPerformance, secondBaseline);
  assert.equal(secondBaseline.kind, "performance-checkpoint");
  assert.deepEqual(await validateToolcraftPerformanceReceipt({ rootDir }), []);
});
