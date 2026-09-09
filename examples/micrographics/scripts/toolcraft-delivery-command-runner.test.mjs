import assert from "node:assert/strict";
import test from "node:test";

import {
  getToolcraftAggregateFunctionalPlaywrightArgs,
} from "./toolcraft-delivery-command-runner.mjs";

test("aggregate functional Playwright arguments exclude protected smoke and performance tests", () => {
  assert.deepEqual(getToolcraftAggregateFunctionalPlaywrightArgs(), [
    "test",
    "--grep-invert",
    "browser perf:|browser smoke:|toolcraft kernel:",
    "--workers=1",
  ]);
});
