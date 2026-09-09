import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveToolcraftChangedPerformanceImpact,
  validateToolcraftPerformanceImpactInventory,
} from "./toolcraft-performance-impact.mjs";

const productPaths = ["src/app/app-schema.ts", "src/app/product-renderer.ts"];
const validInventory = {
  modules: [
    { kind: "functional", path: "src/app/app-schema.ts" },
    {
      kind: "performance",
      passIds: ["composite"],
      path: "src/app/product-renderer.ts",
    },
  ],
  version: 1,
};

test("validates complete product implementation ownership", () => {
  const result = validateToolcraftPerformanceImpactInventory(validInventory, {
    knownPassIds: ["composite"],
    productProductionPaths: productPaths,
  });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.inventory, validInventory);
});

test("rejects missing, duplicate, stale, and unknown ownership", () => {
  const result = validateToolcraftPerformanceImpactInventory(
    {
      modules: [
        { kind: "functional", path: "src/app/app-schema.ts" },
        { kind: "functional", path: "src/app/app-schema.ts" },
        {
          kind: "performance",
          passIds: ["unknown"],
          path: "src/app/stale-renderer.ts",
        },
      ],
      version: 1,
    },
    {
      knownPassIds: ["composite"],
      productProductionPaths: productPaths,
    },
  );

  assert.match(result.errors.join("\n"), /must be unique/u);
  assert.match(result.errors.join("\n"), /product-renderer\.ts.*missing/iu);
  assert.match(result.errors.join("\n"), /stale-renderer\.ts.*not a current/iu);
  assert.match(result.errors.join("\n"), /unknown renderer pass "unknown"/iu);
  assert.match(result.errors.join("\n"), /pass "composite" has no product implementation owner/iu);
});

test("requires performance owners to name pass ids", () => {
  const result = validateToolcraftPerformanceImpactInventory({
    modules: [
      { kind: "performance", passIds: [], path: "src/app/product-renderer.ts" },
    ],
    version: 1,
  });

  assert.match(result.errors.join("\n"), /at least one renderer pass id/iu);
});

test("derives minimum tier and affected passes from changed modules", () => {
  const validation = validateToolcraftPerformanceImpactInventory(validInventory, {
    knownPassIds: ["composite"],
    productProductionPaths: productPaths,
  });
  assert.ok(validation.inventory);

  assert.deepEqual(
    resolveToolcraftChangedPerformanceImpact({
      changedFiles: ["src/app/product-renderer.ts"],
      inventory: validation.inventory,
    }),
    {
      minimumTier: 3,
      performancePassIds: ["composite"],
      requiresFunctionalBrowser: false,
    },
  );
  assert.deepEqual(
    resolveToolcraftChangedPerformanceImpact({
      changedFiles: ["src/app/app-schema.ts"],
      inventory: validation.inventory,
    }),
    {
      minimumTier: 2,
      performancePassIds: [],
      requiresFunctionalBrowser: true,
    },
  );
  assert.equal(
    resolveToolcraftChangedPerformanceImpact({
      changedFiles: ["docs/toolcraft/performance.md"],
      inventory: validation.inventory,
    }).minimumTier,
    0,
  );
});
