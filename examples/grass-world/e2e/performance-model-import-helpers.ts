import { expect, type Locator, type Page } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import {
  getToolcraftPerformanceProfile,
  type ToolcraftModelPerformancePath,
} from "@/toolcraft/runtime";

import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expectToolcraftPerformanceBudget } from "./performance-budget-helpers";
import {
  measureToolcraftInteraction,
  type ToolcraftInteractionResult,
} from "./performance-probe-helpers";
import type { ToolcraftModelBrowserFixture } from "./performance-model-import-fixtures";

const MODEL_LAYER_SELECTOR = "[data-canvas-model-target]";
const TERMINAL_MODEL_PHASES = new Set(["clean", "fixed", "repairable"]);

type ModelLayerSnapshot = Readonly<{
  layerId: string;
  orientation: string | null;
  phase: string;
  renderStatus: string;
}>;

async function findModelLayerMatches(
  page: Page,
  target: string,
): Promise<Readonly<{ layers: Locator; matches: number[] }>> {
  const layers = page.locator(MODEL_LAYER_SELECTOR);
  const matches: number[] = [];
  const count = await layers.count();
  for (let index = 0; index < count; index += 1) {
    if (await layers.nth(index).getAttribute("data-canvas-model-target") === target) {
      matches.push(index);
    }
  }
  return { layers, matches };
}

async function readModelLayerSnapshot(
  page: Page,
  target: string,
): Promise<ModelLayerSnapshot | null> {
  const { layers, matches } = await findModelLayerMatches(page, target);
  if (matches.length === 0) return null;
  if (matches.length !== 1) {
    throw new Error(
      `Model performance proof requires exactly one canvas model layer for target "${target}"; found ${matches.length}.`,
    );
  }
  const layer = layers.nth(matches[0]!);
  const phase = await layer.getAttribute("data-canvas-model-phase");
  const layerId = await layer.getAttribute("data-canvas-model-layer");
  const renderStatus = await layer.getAttribute(
    "data-canvas-model-render-status",
  );
  if (!phase || !layerId || !renderStatus) {
    throw new Error(
      `Model performance proof for target "${target}" requires observable phase and layer identity.`,
    );
  }
  return Object.freeze({
    layerId,
    orientation: await layer.getAttribute("data-canvas-model-orientation"),
    phase,
    renderStatus,
  });
}

async function readTerminalModelLayerSnapshot(
  page: Page,
  target: string,
): Promise<ModelLayerSnapshot | null> {
  const snapshot = await readModelLayerSnapshot(page, target);
  return snapshot &&
      TERMINAL_MODEL_PHASES.has(snapshot.phase) &&
      snapshot.renderStatus === "ready"
    ? snapshot
    : null;
}

async function materializeFixtureFiles(
  fixture: ToolcraftModelBrowserFixture,
): Promise<Readonly<{
  cleanup(): Promise<void>;
  paths: readonly string[];
}>> {
  const directory = await mkdtemp(join(tmpdir(), "toolcraft-model-fixture-"));
  const paths = fixture.files.map(({ name }) =>
    join(directory, basename(name))
  );
  try {
    await Promise.all(
      fixture.files.map(({ buffer }, index) => writeFile(paths[index]!, buffer)),
    );
  } catch (error) {
    await rm(directory, { force: true, recursive: true });
    throw error;
  }
  return Object.freeze({
    cleanup: () => rm(directory, { force: true, recursive: true }),
    paths: Object.freeze(paths),
  });
}

function modelBudget(path: ToolcraftModelPerformancePath) {
  const { thresholds } = getToolcraftPerformanceProfile(path.profile);
  const completionBudget = path.profile === "batch-responsive"
    ? thresholds.maxBatchCompletionMs
    : thresholds.maxVisibleOutputLatencyMs;
  if (completionBudget === undefined) {
    throw new Error(
      `Model performance path "${path.id}" has no central completion budget.`,
    );
  }
  return Object.freeze({
    maxFrameGapMs: thresholds.maxFrameGapMs,
    maxInteractionMs: completionBudget,
    maxLongTaskMs: thresholds.maxLongTaskMs,
  });
}

function expectModelBudget(
  result: ToolcraftInteractionResult,
  path: ToolcraftModelPerformancePath,
): void {
  expectToolcraftPerformanceBudget(result, modelBudget(path));
}

async function getModelInput(page: Page, target: string): Promise<Locator> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  const input = field.locator('input[type="file"]');
  await expect(input).toHaveCount(1);
  return input;
}

export async function prepareToolcraftModelPerformancePage(
  page: Page,
  target: string,
): Promise<void> {
  await page.goto("/");
  await getModelInput(page, target);
  await expect.poll(async () => {
    const candidates = page.locator("[data-canvas-model-prewarm-target]");
    let matches = 0;
    for (let index = 0; index < await candidates.count(); index += 1) {
      const candidate = candidates.nth(index);
      if (
        await candidate.getAttribute("data-canvas-model-prewarm-target") === target &&
        await candidate.getAttribute("data-canvas-model-render-status") === "ready"
      ) {
        matches += 1;
      }
    }
    return matches;
  }, {
    message: `Model renderer for "${target}" must finish visible prewarming.`,
    timeout: 30_000,
  }).toBe(1);
}

export async function importToolcraftModelFixture(
  page: Page,
  path: ToolcraftModelPerformancePath,
  fixture: ToolcraftModelBrowserFixture,
): Promise<ModelLayerSnapshot> {
  const input = await getModelInput(page, path.target);
  const materialized = await materializeFixtureFiles(fixture);
  try {
    await input.setInputFiles([...materialized.paths]);
    await expect
      .poll(
        () => readTerminalModelLayerSnapshot(page, path.target),
        { timeout: 30_000 },
      )
      .not.toBeNull();
    return (await readTerminalModelLayerSnapshot(page, path.target))!;
  } finally {
    await materialized.cleanup();
  }
}

export async function measureToolcraftModelImport(
  page: Page,
  path: ToolcraftModelPerformancePath,
  fixture: ToolcraftModelBrowserFixture,
): Promise<ModelLayerSnapshot> {
  const input = await getModelInput(page, path.target);
  const materialized = await materializeFixtureFiles(fixture);
  try {
    const result = await measureToolcraftInteraction(
      page,
      () => input.setInputFiles([...materialized.paths]),
      {
        observeOutcome: () => readTerminalModelLayerSnapshot(page, path.target),
        outcomeTimeoutMs: 30_000,
        settleFrames: 3,
      },
    );
    expectModelBudget(result, path);
    const terminal = await readTerminalModelLayerSnapshot(page, path.target);
    expect(terminal, "Model import must finish with visible canvas output.").not.toBeNull();
    return terminal!;
  } finally {
    await materialized.cleanup();
  }
}

export async function measureToolcraftModelRepair(
  page: Page,
  path: ToolcraftModelPerformancePath,
): Promise<void> {
  const before = await readModelLayerSnapshot(page, path.target);
  expect(before?.phase, "Repair performance requires a repairable model.").toBe(
    "repairable",
  );
  const field = await getToolcraftControlFieldByTarget(page, path.target);
  const action = field.getByRole("button", { name: "Repair model geometry" });
  await expect(action).toBeVisible();

  const result = await measureToolcraftInteraction(
    page,
    () => action.click(),
    {
      expectedOutcome: "fixed",
      observeOutcome: async () =>
        (await readModelLayerSnapshot(page, path.target))?.phase === "fixed"
          ? "fixed"
          : null,
      outcomeTimeoutMs: 30_000,
      settleFrames: 3,
    },
  );
  expectModelBudget(result, path);
  await expect(field.getByRole("button", { name: "Repair model geometry" })).toHaveCount(0);
}

export async function measureToolcraftModelOrbit(
  page: Page,
  path: ToolcraftModelPerformancePath,
): Promise<void> {
  const { layers, matches } = await findModelLayerMatches(page, path.target);
  if (matches.length !== 1) {
    throw new Error(
      `Model orbit proof requires exactly one canvas layer for "${path.target}"; found ${matches.length}.`,
    );
  }
  const layer = layers.nth(matches[0]!);
  const bounds = await layer.boundingBox();
  if (!bounds) throw new Error("Model orbit proof requires visible model bounds.");
  // Protected pressure fixtures place their first triangle left/below center.
  // Avoid the shared diagonal, where a ray hit is precision-dependent.
  const start = {
    x: bounds.x + bounds.width * 0.43,
    y: bounds.y + bounds.height * 0.57,
  };

  const result = await measureToolcraftInteraction(
    page,
    async () => {
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(start.x + 72, start.y + 36, { steps: 8 });
      await page.mouse.up();
    },
    {
      observeOutcome: () => layer.getAttribute("data-canvas-model-orientation"),
      outcomeTimeoutMs: 5_000,
      settleFrames: 3,
    },
  );
  expectModelBudget(result, path);
  await expect(layer).toHaveAttribute("data-canvas-model-orientation", /position/u);
}
