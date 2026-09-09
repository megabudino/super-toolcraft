import assert from "node:assert/strict";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import test from "node:test";
import path from "node:path";
import { validateToolcraftDeliveryReceipt } from "./toolcraft-delivery-receipt.mjs";

import { runToolcraftDeliveryVerification } from "./run-delivery-verification.mjs";
import {
  assertNoPerformanceAuthority,
  createDeliveryFixture,
  readDeliveryEvents,
  removeDeliveryFixture,
} from "./run-delivery-verification-test-helpers.mjs";
import { getToolcraftCheckpointBundlePath } from "./toolcraft-checkpoint-paths.mjs";

test("delivery lifecycle fails closed before checks when canonical authority is malformed", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });
  const eventsBefore = readDeliveryEvents(rootDir);
  const bundlePath = getToolcraftCheckpointBundlePath(rootDir);
  const validBundle = readFileSync(bundlePath, "utf8");
  writeFileSync(bundlePath, "{");

  await assert.rejects(
    runToolcraftDeliveryVerification({ projectDir: rootDir }),
    /checkpoint bundle is malformed JSON/iu,
  );

  assert.deepEqual(readDeliveryEvents(rootDir), eventsBefore);
  writeFileSync(bundlePath, validBundle);
});

test("prototype selectors and operator-only full reasons fail before running checks", async (t) => {
  const prototypeRoot = createDeliveryFixture();
  const explicitRoot = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(prototypeRoot));
  t.after(() => removeDeliveryFixture(explicitRoot));

  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: ["--tier=2"],
      projectDir: prototypeRoot,
    }),
    /prototype delivery does not accept targeted test selectors/iu,
  );
  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: ["--reason=explicit-performance-work", "--tier=4"],
      projectDir: explicitRoot,
    }),
    /delivery --reason must be performance-iteration/iu,
  );
  assert.deepEqual(readDeliveryEvents(prototypeRoot), []);
  assert.deepEqual(readDeliveryEvents(explicitRoot), []);
  assertNoPerformanceAuthority(prototypeRoot);
  assertNoPerformanceAuthority(explicitRoot);
});

test("false passed worklog prose cannot mint a receipt when a protected command fails", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => removeDeliveryFixture(rootDir));
  mkdirSync(path.join(rootDir, "docs", "toolcraft"), { recursive: true });
  writeFileSync(
    path.join(rootDir, "docs", "toolcraft", "agent-worklog.md"),
    "# Worklog\n\nVerification: pnpm verify:delivery passed.\n",
  );
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts["test:delivery"] =
    "node -e \"process.exitCode = 1\"";
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson)}\n`);

  await assert.rejects(
    runToolcraftDeliveryVerification({ projectDir: rootDir }),
    /npm exited with code 1/iu,
  );
  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /delivery receipt is missing/iu,
  );
});
