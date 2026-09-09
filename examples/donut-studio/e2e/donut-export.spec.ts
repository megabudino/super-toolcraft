import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-conditional-output-evidence-helpers";
import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
} from "./browser-proof-session";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  expectToolcraftInfinityCanvasImageExportEvidence,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import {
  expectToolcraftOrientationAxisDrag,
  expectToolcraftOrientationAxisSnap,
  expectToolcraftOrientationCanvasMissPan,
  expectToolcraftOrientationModelDrag,
  expectToolcraftOrientationUndoReset,
} from "./browser-orientation-gizmo-evidence-helpers";
import { expectExportExcludesCanvasHandles } from "./canvas-handle-helpers";
import { getDonutBrowserTestName } from "../src/app/app-acceptance-data";
import { DONUT_DEFAULTS } from "../src/app/donut/donut-values";
import {
  chooseControlOption,
  chooseOption,
  DONUT_CANVAS_SELECTOR,
  downloadFromButton,
  fieldFor,
  inspectDonutImage,
  observeDonutOrientation,
  openDonut,
  toggleInfinity,
  waitForDonut,
  type DonutDownloadArtifact,
} from "./donut-test-helpers";
import { expect, test } from "./toolcraft-product-test";

async function openProof(page: Parameters<typeof openDonut>[0]) {
  await openDonut(page);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForDonut(page);
  const infinity = fieldFor(page, "canvas.infinity").getByRole("switch");
  if (await infinity.isChecked()) {
    await infinity.click();
    await waitForDonut(page);
  }
  return session;
}

test.setTimeout(360_000);

test(getDonutBrowserTestName("canvas.infinity.image-export"), async ({ page }) => {
  const session = await openProof(page);
  await chooseOption(page, "export.image.resolution", "2K");
  const finiteArtifact = await downloadFromButton(page);
  const finite = await inspectDonutImage(page, finiteArtifact);
  await toggleInfinity(page);
  const infiniteArtifact = await downloadFromButton(page);
  const infinite = await inspectDonutImage(page, infiniteArtifact);
  await expectToolcraftInfinityCanvasImageExportEvidence(
    { finite, infinite },
    {
      expectedFiniteSize: { height: 1152, width: 2048 },
      expectedInfiniteSize: { height: 1440, width: 2048 },
      requirementId: "canvas.infinity.image-export",
      target: "canvas.infinity",
    },
  );
  await expectToolcraftExportedArtifact(
    session.controlAction("canvas.infinity", async () => infiniteArtifact),
    (artifact) => inspectDonutImage(page, artifact),
    { requirementId: "canvas.infinity.image-export" },
  );
});

test(getDonutBrowserTestName("export.includeBackground"), async ({ page }) => {
  const session = await openProof(page);
  await chooseOption(page, "export.image.resolution", "2K");
  await toggleInfinity(page);
  const infinite = await observeInfinityCanvasBackground(page);
  const backgroundPreview = session.observe((root) => {
    const output = root.querySelector<HTMLElement>("[data-donut-renderer]");
    const canvas = root.querySelector<HTMLCanvasElement>("[data-donut-canvas]");
    const visible = output?.dataset.backgroundVisible === "true";
    return {
      backgroundVisible: visible,
      outputSignature: `${visible}:${output?.dataset.backgroundColor}:${canvas?.dataset.donutOutputSignature}`,
    };
  });
  const include = fieldFor(page, "export.includeBackground").getByRole("switch");
  await include.click();
  const excludedPreview = await readToolcraftBrowserObservation(backgroundPreview);
  await include.click();
  let transparentArtifact: DonutDownloadArtifact | undefined;
  await expectToolcraftBackgroundOutputSemantics(
    backgroundPreview,
    session.controlAction("export.includeBackground", (control) =>
      control.getByRole("switch").click(),
    ),
    excludedPreview,
    session.action(async (currentPage) => {
      transparentArtifact = await downloadFromButton(currentPage);
      return transparentArtifact;
    }),
    (artifact) => inspectDonutImage(page, artifact),
    { requirementId: "export.includeBackground", stabilityIntervalMs: 80 },
  );
  await expectToolcraftExportedArtifact(
    session.controlAction(
      "export.includeBackground",
      async () => transparentArtifact!,
    ),
    (artifact) => inspectDonutImage(page, artifact),
    { requirementId: "export.includeBackground" },
  );
  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await include.click();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    { backgroundExcluded, backgroundRestored, infinite },
    {
      expectedBackgroundColor: DONUT_DEFAULTS.background.color,
      requirementId: "export.includeBackground",
      target: "export.includeBackground",
    },
  );
});

test(getDonutBrowserTestName("export.image.format"), async ({ page }) => {
  const session = await openProof(page);
  await chooseOption(page, "export.image.resolution", "2K");
  await expectToolcraftExportedArtifact(
    session.controlAction("export.image.format", async (control, currentPage) => {
      await chooseControlOption(currentPage, control, "JPG");
      return downloadFromButton(currentPage);
    }),
    async (artifact) => {
      const inspection = await inspectDonutImage(page, artifact);
      expect(inspection.mediaType).toBe("image/jpeg");
      expect(inspection.backgroundAlpha).toBe(255);
      return inspection;
    },
    { requirementId: "export.image.format" },
  );
});

test(getDonutBrowserTestName("export.image.resolution"), async ({ page }) => {
  const session = await openProof(page);
  await expectToolcraftExportedArtifact(
    session.controlAction("export.image.resolution", async (control, currentPage) => {
      await chooseControlOption(currentPage, control, "4K");
      return downloadFromButton(currentPage);
    }),
    async (artifact) => {
      const inspection = await inspectDonutImage(page, artifact);
      expect(inspection.width).toBe(4096);
      expect(inspection.height).toBe(2304);
      return inspection;
    },
    { requirementId: "export.image.resolution" },
  );
});

test(getDonutBrowserTestName("actions.output"), async ({ page }) => {
  const session = await openProof(page);
  await chooseOption(page, "export.image.resolution", "2K");
  await expectToolcraftExportedArtifact(
    session.controlAction("actions.output", (_control, currentPage) =>
      downloadFromButton(currentPage),
    ),
    (artifact) => inspectDonutImage(page, artifact),
    { requirementId: "actions.output" },
  );
});

test(getDonutBrowserTestName("scene.orientation"), async ({ page }) => {
  const session = await openProof(page);
  const observation = observeDonutOrientation(session);
  const options = {
    requirementId: "scene.orientation",
    stabilityIntervalMs: 100,
    target: "scene.orientation",
    timeoutMs: 20_000,
  } as const;
  const baseline = await readToolcraftBrowserObservation(observation);
  const changed = await expectToolcraftOrientationAxisDrag(observation, session, {
    ...options,
    dragDelta: { x: 24, y: 16 },
  });
  await expectToolcraftOrientationUndoReset(
    observation,
    session.action((currentPage) =>
      currentPage.getByRole("button", { name: "Undo" }).click(),
    ),
    session.action((currentPage) =>
      currentPage.getByRole("button", { name: "Redo" }).click(),
    ),
    session.action((currentPage) =>
      currentPage.getByRole("button", { name: "Reset controls" }).click(),
    ),
    baseline,
    changed,
    options,
  );
  await expectToolcraftOrientationAxisSnap(observation, session, "+x", options);
  await expectToolcraftOrientationModelDrag(observation, session, {
    ...options,
    dragDelta: { x: 32, y: 18 },
  });
  await expectToolcraftOrientationCanvasMissPan(
    observation,
    session.action(async (currentPage) => {
      const viewport = currentPage.getByRole("application", {
        name: "Canvas viewport",
      });
      const box = await viewport.boundingBox();
      expect(box).not.toBeNull();
      const startX = box!.x + box!.width * 0.04;
      const startY = box!.y + box!.height * 0.5;
      await currentPage.mouse.move(startX, startY);
      await currentPage.mouse.down();
      await currentPage.mouse.move(startX - 42, startY + 34, { steps: 8 });
      await currentPage.mouse.up();
    }),
    options,
  );
  await chooseOption(page, "export.image.resolution", "2K");
  await expectExportExcludesCanvasHandles(
    page,
    () => downloadFromButton(page),
    (artifact) => inspectDonutImage(page, artifact),
    {
      requirementId: "scene.orientation#export-clean",
      target: "scene.orientation",
    },
  );
  await expect(page.locator(DONUT_CANVAS_SELECTOR)).toBeVisible();
});
