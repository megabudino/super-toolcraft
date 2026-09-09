import assert from "node:assert/strict";
import test from "node:test";

import {
  getToolcraftTargetedImpactVerificationError,
} from "./toolcraft-verification-receipt.mjs";
import {
  createIterationVerification,
} from "./toolcraft-verification-receipt-test-helpers.mjs";

const performanceImpact = {
  minimumTier: 3,
  performancePassIds: ["composite"],
  requiresFunctionalBrowser: false,
};

test("accepts pass-owned Tier 3 and Tier 4 targeted evidence", () => {
  for (const tier of [3, 4]) {
    assert.equal(
      getToolcraftTargetedImpactVerificationError(
        createIterationVerification(tier),
        tier,
        performanceImpact,
      ),
      undefined,
    );
  }
});

test("rejects pass-owned implementation evidence recorded as Tier 0", () => {
  assert.match(
    getToolcraftTargetedImpactVerificationError(
      createIterationVerification(0),
      0,
      performanceImpact,
    ),
    /requires verification Tier 3/iu,
  );
});
