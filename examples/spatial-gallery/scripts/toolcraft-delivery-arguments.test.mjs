import assert from "node:assert/strict";
import test from "node:test";

import { parseToolcraftDeliveryArguments } from "./toolcraft-delivery-arguments.mjs";

test("delivery arguments separate supported reasons from targeted selectors", () => {
  assert.deepEqual(
    parseToolcraftDeliveryArguments([
      "--reason=performance-iteration",
      "--tier=3",
      "--performance-test=browser perf: control-drag:composite",
    ]),
    {
      requestedReason: "performance-iteration",
      targetedArguments: [
        "--tier=3",
        "--performance-test=browser perf: control-drag:composite",
      ],
    },
  );
  assert.deepEqual(
    parseToolcraftDeliveryArguments([
      "--tier=3",
      "--unit-test=unit",
      "--browser-test=browser",
      "--performance-test=performance",
    ]),
    {
      requestedReason: undefined,
      targetedArguments: [
        "--tier=3",
        "--unit-test=unit",
        "--browser-test=browser",
        "--performance-test=performance",
      ],
    },
  );
});

test("delivery arguments reject unsupported or ambiguous authority", () => {
  assert.throws(
    () =>
      parseToolcraftDeliveryArguments(["--reason=explicit-performance-work"]),
    /must be performance-iteration/iu,
  );
  assert.throws(
    () => parseToolcraftDeliveryArguments(["--reason=ordinary"]),
    /must be performance-iteration/iu,
  );
  assert.throws(
    () =>
      parseToolcraftDeliveryArguments([
        "--reason=performance-iteration",
        "--reason=performance-iteration",
      ]),
    /accepts one --reason/iu,
  );
  assert.throws(
    () => parseToolcraftDeliveryArguments(["--grep=browser perf:"]),
    /unsupported toolcraft delivery argument/iu,
  );
});
