import assert from "node:assert/strict";
import test from "node:test";

import {
  validateToolcraftDeliveryCatalog,
} from "./playwright-test-title-selection.mjs";

function encodeSignature(signature) {
  return `performance-path:${encodeURIComponent(JSON.stringify(signature))}`;
}

function catalogForPath(pathId, passIds) {
  return {
    acceptance: [],
    performance: [
      {
        passIds,
        pathId,
        testName: `browser perf: toolcraft path ${pathId}`,
      },
    ],
    version: 1,
  };
}

test("catalog accepts exact canonical passless and pass-bearing paths", () => {
  for (const [invalidates, runsOn] of [
    [[], ["main"]],
    [["composite", "source"], ["main", "worker"]],
  ]) {
    const pathId = encodeSignature([
      "interactive-discrete",
      "control-change",
      invalidates,
      runsOn,
      ["pixel-count"],
    ]);
    assert.deepEqual(
      validateToolcraftDeliveryCatalog(
        catalogForPath(pathId, invalidates),
      ).errors,
      [],
    );
  }
});

test("catalog rejects noncanonical performance path domains and arrays", () => {
  const signatures = [
    ["unknown-profile", "control-change", [], ["main"], []],
    ["interactive-discrete", "unknown-interaction", [], ["main"], []],
    ["interactive-discrete", "control-change", [], ["satellite"], []],
    [
      "interactive-discrete",
      "control-change",
      ["composite", "composite"],
      ["main"],
      [],
    ],
    [
      "interactive-discrete",
      "control-change",
      [],
      ["main", "main"],
      [],
    ],
    [
      "interactive-discrete",
      "control-change",
      [],
      ["main"],
      ["pixel-count", "pixel-count"],
    ],
  ];

  for (const signature of signatures) {
    const pathId = encodeSignature(signature);
    assert.match(
      validateToolcraftDeliveryCatalog(
        catalogForPath(pathId, [...new Set(signature[2])]),
      ).errors.join("\n"),
      /malformed canonical path/iu,
    );
  }
});

test("catalog rejects malformed paths and mismatched invalidated passes", () => {
  assert.match(
    validateToolcraftDeliveryCatalog(
      catalogForPath("performance-path:not-json", []),
    ).errors.join("\n"),
    /malformed canonical path/iu,
  );
  const pathId = encodeSignature([
    "interactive-discrete",
    "control-change",
    ["composite"],
    ["main"],
    [],
  ]);
  assert.match(
    validateToolcraftDeliveryCatalog(
      catalogForPath(pathId, ["source"]),
    ).errors.join("\n"),
    /does not match.*path/iu,
  );
});
