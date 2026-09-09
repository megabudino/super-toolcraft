import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const deliveryModules = [
  "run-delivery-verification.mjs",
  "toolcraft-delivery-arguments.mjs",
  "toolcraft-delivery-lifecycle.mjs",
  "toolcraft-delivery-receipt-builder.mjs",
];

function getDeliveryImports(fileName) {
  const source = readFileSync(path.join(scriptsDir, fileName), "utf8");
  return [...source.matchAll(/from\s+["']\.\/(.+?\.mjs)["']/gu)]
    .map((match) => match[1])
    .filter((dependency) => deliveryModules.includes(dependency));
}

test("delivery verification modules form an acyclic dependency graph", () => {
  const graph = new Map(
    deliveryModules.map((fileName) => [fileName, getDeliveryImports(fileName)]),
  );
  const visiting = new Set();
  const visited = new Set();

  function visit(fileName, path_) {
    if (visiting.has(fileName)) {
      assert.fail(`Delivery module cycle: ${[...path_, fileName].join(" -> ")}`);
    }
    if (visited.has(fileName)) return;
    visiting.add(fileName);
    for (const dependency of graph.get(fileName) ?? []) {
      visit(dependency, [...path_, fileName]);
    }
    visiting.delete(fileName);
    visited.add(fileName);
  }

  for (const fileName of deliveryModules) visit(fileName, []);
  assert.equal(visited.size, deliveryModules.length);
});

test("delivery layers keep parsing and receipt construction below lifecycle", () => {
  const graph = new Map(
    deliveryModules.map((fileName) => [fileName, getDeliveryImports(fileName)]),
  );
  assert.deepEqual(graph.get("toolcraft-delivery-arguments.mjs"), []);
  assert.deepEqual(graph.get("toolcraft-delivery-receipt-builder.mjs"), []);
  assert.equal(
    graph.get("toolcraft-delivery-lifecycle.mjs").includes(
      "toolcraft-delivery-receipt-builder.mjs",
    ),
    true,
  );
  assert.equal(
    graph.get("run-delivery-verification.mjs").includes(
      "toolcraft-delivery-lifecycle.mjs",
    ),
    true,
  );
});

test("checkpoint authority has no journal or recovery state machine", () => {
  for (const removedModule of [
    "toolcraft-checkpoint-guard.mjs",
    "toolcraft-checkpoint-recovery.mjs",
    "toolcraft-checkpoint-transaction-journal.mjs",
  ]) {
    assert.equal(existsSync(path.join(scriptsDir, removedModule)), false);
  }
  for (const fileName of [
    "run-delivery-verification.mjs",
    "toolcraft-checkpoint-transaction.mjs",
    "toolcraft-delivery-receipt.mjs",
    "toolcraft-verification-receipt-core.mjs",
  ]) {
    assert.doesNotMatch(
      readFileSync(path.join(scriptsDir, fileName), "utf8"),
      /checkpoint-(?:guard|recovery|transaction-journal)/u,
    );
  }
});
