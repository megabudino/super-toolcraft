import assert from "node:assert/strict";
import {
  readFileSync,
  writeFileSync,
} from "node:fs";
import test from "node:test";

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
