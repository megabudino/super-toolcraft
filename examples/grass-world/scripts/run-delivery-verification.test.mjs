import assert from "node:assert/strict";
import {
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import test from "node:test";

import { runToolcraftPerformanceCheckpoint } from "./run-browser-performance.mjs";
import { runToolcraftDeliveryVerification } from "./run-delivery-verification.mjs";
import {
  validateToolcraftDeliveryReceipt,
} from "./toolcraft-delivery-receipt.mjs";
import {
  createProtectedRunnerFixture,
  readPlaywrightShimEvents,
} from "./run-browser-performance-test-helpers.mjs";

const functionalTestName = "browser: focused acceptance";
const performanceTestName = "browser perf: focused renderer path";

function createDeliveryFixture() {
  const rootDir = createProtectedRunnerFixture({
    errors: [],
    suites: [
      {
        specs: [
          {
            tags: [],
            tests: [{ projectName: "" }],
            title: functionalTestName,
          },
          {
            tags: [],
            tests: [{ projectName: "" }],
            title: performanceTestName,
          },
        ],
        title: "app-controls.spec.ts",
      },
    ],
  });
  mkdirSync(path.join(rootDir, "src", "app"), { recursive: true });
  writeFileSync(
    path.join(rootDir, "src", "app", "renderer.ts"),
    "export const renderer = 1;\n",
  );
  writeFileSync(
    path.join(rootDir, "src", "app", "schema.ts"),
    "export const schema = 1;\n",
  );
  writeFileSync(
    path.join(rootDir, "src", "app", "app-performance-impact.json"),
    `${JSON.stringify({
      modules: [
        { kind: "functional", path: "src/app.ts" },
        { kind: "performance", passIds: ["composite"], path: "src/app/renderer.ts" },
        { kind: "functional", path: "src/app/schema.ts" },
      ],
      version: 1,
    })}\n`,
  );
  writeFileSync(
    path.join(rootDir, "scripts", "record-delivery-event.mjs"),
    [
      'import { appendFile, mkdir } from "node:fs/promises";',
      'import path from "node:path";',
      'const dir = path.join(process.cwd(), ".toolcraft");',
      'await mkdir(dir, { recursive: true });',
      'await appendFile(path.join(dir, "delivery-events.jsonl"), `${JSON.stringify({ event: process.argv[2] })}\\n`);',
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(rootDir, "scripts", "check-toolcraft-integrity.mjs"),
    'process.argv[2] = "integrity"; await import("./record-delivery-event.mjs");\n',
  );
  writeFileSync(
    path.join(rootDir, "package.json"),
    `${JSON.stringify({
      name: "toolcraft-delivery-fixture",
      private: true,
      scripts: {
        "ai:check": "node scripts/record-delivery-event.mjs ai-check",
        build: "node scripts/record-delivery-event.mjs build",
        "docs:check": "node scripts/record-delivery-event.mjs docs-check",
        "test:delivery": "node scripts/record-delivery-event.mjs test-delivery",
      },
      type: "module",
    })}\n`,
  );
  return rootDir;
}

function readDeliveryEvents(rootDir) {
  const eventPath = path.join(rootDir, ".toolcraft", "delivery-events.jsonl");
  try {
    return readFileSync(eventPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line).event);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

test("first delivery runs one aggregate gate and one maximum performance checkpoint", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));

  const receipt = await runToolcraftDeliveryVerification({ projectDir: rootDir });

  assert.equal(receipt.mode, "first-stable");
  assert.deepEqual(readDeliveryEvents(rootDir), [
    "integrity",
    "ai-check",
    "test-delivery",
    "build",
  ]);
  assert.equal(
    readPlaywrightShimEvents(rootDir).filter(
      (event) => event.event === "completed" && event.fixtureSelector === "maximum",
    ).length,
    1,
  );
  assert.equal(
    readPlaywrightShimEvents(rootDir).filter(
      (event) => event.event === "install-skipped",
    ).length,
    1,
  );
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("ordinary deliveries compare against the immediately previous delivery anchor", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  const first = await runToolcraftDeliveryVerification({ projectDir: rootDir });

  writeFileSync(
    path.join(rootDir, "src", "app", "renderer.ts"),
    "export const renderer = 2;\n",
  );
  const performanceDelivery = await runToolcraftDeliveryVerification({
    arguments_: ["--tier=3", `--performance-test=${performanceTestName}`],
    projectDir: rootDir,
  });
  assert.equal(performanceDelivery.comparisonSourceHash, first.sourceHash);
  assert.deepEqual(performanceDelivery.verification.performancePassIds, [
    "composite",
  ]);

  writeFileSync(
    path.join(rootDir, "src", "app", "schema.ts"),
    "export const schema = 2;\n",
  );
  const functionalDelivery = await runToolcraftDeliveryVerification({
    arguments_: ["--tier=2", `--browser-test=${functionalTestName}`],
    projectDir: rootDir,
  });

  assert.equal(
    functionalDelivery.comparisonSourceHash,
    performanceDelivery.sourceHash,
  );
  assert.deepEqual(functionalDelivery.verification.performancePassIds, []);
  assert.deepEqual(functionalDelivery.verification.performanceTests, []);
  assert.equal(
    readPlaywrightShimEvents(rootDir).filter(
      (event) => event.event === "completed" && event.fixtureSelector === "maximum",
    ).length,
    1,
  );
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("explicit performance delivery refreshes full evidence exactly once", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });

  const receipt = await runToolcraftDeliveryVerification({
    arguments_: ["--reason=explicit-performance-work"],
    projectDir: rootDir,
  });

  assert.equal(receipt.mode, "explicit-performance");
  assert.equal(
    readPlaywrightShimEvents(rootDir).filter(
      (event) => event.event === "completed" && event.fixtureSelector === "maximum",
    ).length,
    2,
  );
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("explicit performance delivery repairs a baseline and delivery mismatch", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  await runToolcraftDeliveryVerification({ projectDir: rootDir });

  writeFileSync(
    path.join(rootDir, "src", "app", "renderer.ts"),
    "export const renderer = 2;\n",
  );
  await runToolcraftPerformanceCheckpoint({
    projectDir: rootDir,
    requestedReason: "explicit-performance-work",
  });

  await assert.rejects(
    runToolcraftDeliveryVerification({ projectDir: rootDir }),
    /--reason=explicit-performance-work/iu,
  );

  const repaired = await runToolcraftDeliveryVerification({
    arguments_: ["--reason=explicit-performance-work"],
    projectDir: rootDir,
  });

  assert.equal(repaired.mode, "explicit-performance");
  assert.equal(
    readPlaywrightShimEvents(rootDir).filter(
      (event) => event.event === "completed" && event.fixtureSelector === "maximum",
    ).length,
    3,
  );
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});

test("explicit performance delivery is rejected before a baseline exists", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));

  await assert.rejects(
    runToolcraftDeliveryVerification({
      arguments_: ["--reason=explicit-performance-work"],
      projectDir: rootDir,
    }),
    /requires an existing durable baseline and prior delivery receipt/iu,
  );
  assert.equal(readDeliveryEvents(rootDir).length, 0);
});

test("source mutation during aggregate verification writes no delivery receipt", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  writeFileSync(
    path.join(rootDir, "scripts", "mutate-source.mjs"),
    [
      'import { writeFile } from "node:fs/promises";',
      'await writeFile("src/app/schema.ts", "export const schema = 99;\\n");',
      "",
    ].join("\n"),
  );
  const packageJsonPath = path.join(rootDir, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  packageJson.scripts.build = "node scripts/mutate-source.mjs";
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson)}\n`);

  await assert.rejects(
    runToolcraftDeliveryVerification({ projectDir: rootDir }),
    /verification inputs changed.*aggregate delivery gate/iu,
  );
  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /delivery receipt is missing/iu,
  );
});

test("a direct performance compatibility command cannot mint delivery authority", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  await runToolcraftPerformanceCheckpoint({ projectDir: rootDir });

  assert.match(
    (await validateToolcraftDeliveryReceipt({ rootDir }))[0],
    /delivery receipt is missing/iu,
  );
});

test("delivery adopts a current compatibility baseline without repeating full performance", async (t) => {
  const rootDir = createDeliveryFixture();
  t.after(() => rmSync(rootDir, { force: true, recursive: true }));
  await runToolcraftPerformanceCheckpoint({ projectDir: rootDir });

  const receipt = await runToolcraftDeliveryVerification({ projectDir: rootDir });

  assert.equal(receipt.mode, "first-stable");
  assert.equal(
    readPlaywrightShimEvents(rootDir).filter(
      (event) => event.event === "completed" && event.fixtureSelector === "maximum",
    ).length,
    1,
  );
  assert.deepEqual(await validateToolcraftDeliveryReceipt({ rootDir }), []);
});
