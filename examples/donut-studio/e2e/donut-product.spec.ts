import {
  expectToolcraftAcceptanceOutcome,
  expectToolcraftReferenceParity,
} from "./browser-acceptance-outcome-helpers";
import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftInfinityCanvasModeEvidence } from "./browser-infinity-canvas-evidence";
import { expectToolcraftCanvasRenderScaleEvidence } from "./browser-render-scale-evidence";
import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import {
  expectToolcraftDiscreteSliderMarkers,
  expectToolcraftSegmentedControlCellsPreservePadding,
} from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  captureDonutCanvasPixels,
  donutPixelProofFor,
  expectDonutCanvasPixelChange,
  type DonutPixelProof,
} from "./donut-canvas-pixel-helpers";
import {
  donutDeepControlAcceptance,
  donutEdibleMaterialAcceptance,
  getDonutBrowserTestName,
} from "../src/app/app-acceptance-data";
import {
  getDonutDeepControlRole,
  getDonutVisibilityOwner,
  readDonutDeepControlDefault,
  setAlternateDonutSliderValue,
} from "./donut-deep-control-helpers";
import {
  chooseControlOption,
  DONUT_CANVAS_SELECTOR,
  DONUT_OUTPUT_SELECTOR,
  DONUT_SCENE_RECT,
  downloadFromButton,
  fieldFor,
  observeDonutInfinity,
  openDonut,
  pickControlColor,
  readControlOptionLabel,
  setControlText,
  setSliderValue,
  toggleInfinity,
  waitForDonut,
} from "./donut-test-helpers";
import { verifyDonutRenderPolicy } from "./donut-render-policy-test-utils";
import { expect, test } from "./toolcraft-product-test";

type ProofSession = Awaited<ReturnType<typeof createToolcraftBrowserProofSession>>;
type DonutPage = Parameters<typeof openDonut>[0];
async function openProof(page: Parameters<typeof openDonut>[0]): Promise<ProofSession> {
  await openDonut(page);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForDonut(page);
  if (await fieldFor(page, "canvas.infinity").getByRole("switch").isChecked()) await toggleInfinity(page);
  return session;
}

async function proveOutputChange(
  session: ProofSession,
  target: string,
  requirementId: string,
  action: Parameters<ProofSession["controlAction"]>[1],
  pixelProof?: DonutPixelProof,
): Promise<void> {
  let beforePixels: number[] | undefined;
  let currentPage: DonutPage | undefined;
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(target, async (control, page) => {
      currentPage = page;
      if (pixelProof) beforePixels = await captureDonutCanvasPixels(page);
      await action(control, page);
    }),
    {
      requirementId,
      selector: DONUT_OUTPUT_SELECTOR,
      stabilityIntervalMs: 80,
      timeoutMs: 20_000,
    },
  );
  if (pixelProof && beforePixels && currentPage) {
    await currentPage.waitForTimeout(120);
    expectDonutCanvasPixelChange(
      beforePixels,
      await captureDonutCanvasPixels(currentPage),
      pixelProof,
      requirementId,
    );
  }
}

test.setTimeout(360_000);

test(getDonutBrowserTestName("runtime.settingsTransfer"), async ({ page }) => {
  await openProof(page);
  await expectToolcraftAcceptanceOutcome(
    () => fieldFor(page, "sprinkles.flow").getByRole("slider").inputValue(),
    async () => {
      await setSliderValue(fieldFor(page, "sprinkles.flow"), 0.35);
      const settings = await downloadFromButton(page, "Export Settings");
      await setSliderValue(fieldFor(page, "sprinkles.flow"), 1.7);
      const chooserPromise = page.waitForEvent("filechooser");
      await page.getByRole("button", { exact: true, name: "Import Settings" }).click();
      const chooser = await chooserPromise;
      await chooser.setFiles({
        buffer: settings.bytes,
        mimeType: "application/json",
        name: settings.fileName,
      });
    },
    {
      evidenceType: "command-side-effect",
      requirementId: "runtime.settingsTransfer",
      stabilityIntervalMs: 80,
      timeoutMs: 20_000,
    },
  );
});

test(getDonutBrowserTestName("canvas.aspectRatio"), async ({ page }) => {
  const session = await openProof(page);
  await expectToolcraftReferenceParity(
    () => readControlOptionLabel(fieldFor(page, "canvas.aspectRatio")),
    "16:9",
    { requirementId: "canvas.aspectRatio", target: "canvas.aspectRatio" },
  );
  await proveOutputChange(
    session,
    "canvas.aspectRatio",
    "canvas.aspectRatio",
    (control, currentPage) => chooseControlOption(currentPage, control, "1:1"),
  );
});

for (const [target, value] of [
  ["canvas.size.width", "1200"],
  ["canvas.size.height", "900"],
] as const) {
  test(getDonutBrowserTestName(target), async ({ page }) => {
    const session = await openProof(page);
    await proveOutputChange(session, target, target, (control) =>
      setControlText(control, value),
    );
  });
}

test(getDonutBrowserTestName("canvas.renderScale"), async ({ page }) => {
  const session = await openProof(page);
  const renderScale = fieldFor(page, "canvas.renderScale").getByRole("slider");
  await expectToolcraftCanvasRenderScaleEvidence(page, {
    canvasSelector: DONUT_CANVAS_SELECTOR,
    requirementId: "canvas.renderScale",
    selectedScale: 2,
    stateTransitions: [
      { run: () => renderScale.press("End"), state: "interaction" },
      { run: () => page.waitForTimeout(150), state: "steady" },
    ],
    target: "canvas.renderScale",
  });
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "canvas.renderScale",
    "canvas.renderScale",
  );
  await proveOutputChange(session, "canvas.renderScale", "canvas.renderScale", (control) =>
    setSliderValue(control, 1.5),
  );
});

test(getDonutBrowserTestName("canvas.infinity.mode"), async ({ page }) => {
  await openProof(page);
  const before = await observeDonutInfinity(page);
  await toggleInfinity(page);
  const enabled = await observeDonutInfinity(page);
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width * 0.04;
  const y = box!.y + box!.height * 0.5;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 44, y + 32, { steps: 8 });
  await page.mouse.up();
  const afterPan = await observeDonutInfinity(page);
  await expect(page.locator('[data-slot="toolcraft-runtime-app"]')).toHaveAttribute(
    "data-toolcraft-persistence-status",
    "success",
  );
  await page.reload();
  await waitForDonut(page);
  const afterReload = await observeDonutInfinity(page);
  await toggleInfinity(page);
  const restored = await observeDonutInfinity(page);
  await page.getByRole("button", { name: "Undo" }).click();
  const undone = await observeDonutInfinity(page);
  await page.getByRole("button", { name: "Redo" }).click();
  const redone = await observeDonutInfinity(page);
  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    {
      expectedSceneRect: DONUT_SCENE_RECT,
      requirementId: "canvas.infinity.mode",
      target: "canvas.infinity",
    },
  );
});

test(getDonutBrowserTestName("reference.scene"), async ({ page }) => {
  const session = await openProof(page);
  const canvas = page.locator(DONUT_CANVAS_SELECTOR);
  await expectToolcraftReferenceParity(
    async () => ({
      icing: await canvas.getAttribute("data-donut-icing-visible"),
      plate: await canvas.getAttribute("data-donut-plate-visible"),
      ready: await canvas.getAttribute("data-donut-frame-ready"),
      sprinkles: await canvas.getAttribute("data-donut-sprinkle-count"),
    }),
    { icing: "true", plate: "true", ready: "true", sprinkles: "525" },
    { requirementId: "reference.scene" },
  );
  await proveOutputChange(
    session,
    "scene.plateVisible",
    "reference.scene",
    (control) => control.getByRole("switch").click(),
  );
});

test(getDonutBrowserTestName("scene.plateVisible"), async ({ page }) => {
  const session = await openProof(page);
  await proveOutputChange(
    session,
    "scene.plateVisible",
    "scene.plateVisible",
    (control) => control.getByRole("switch").click(),
  );
});

test(getDonutBrowserTestName("icing.enabled"), async ({ page }) => {
  const session = await openProof(page);
  await expectToolcraftReferenceParity(
    () => fieldFor(page, "icing.enabled").getByRole("switch").getAttribute("aria-checked"),
    "true",
    { requirementId: "icing.enabled", target: "icing.enabled" },
  );
  await proveOutputChange(session, "icing.enabled", "icing.enabled", (control) =>
    control.getByRole("switch").click(),
  );
});

test(getDonutBrowserTestName("icing.color"), async ({ page }) => {
  const session = await openProof(page);
  await expectToolcraftReferenceParity(
    () => fieldFor(page, "icing.color").getByRole("textbox").inputValue(),
    "#F26D9C",
    { requirementId: "icing.color", target: "icing.color" },
  );
  await proveOutputChange(
    session,
    "icing.color",
    "icing.color",
    (control) => pickControlColor(page, control),
    donutPixelProofFor("icing.color"),
  );
});

test(getDonutBrowserTestName("icing.clear"), async ({ page }) => {
  const session = await openProof(page);
  await expectToolcraftReferenceParity(
    () => page.locator(DONUT_OUTPUT_SELECTOR).getAttribute("data-icing-clear-mode"),
    "none",
    { requirementId: "icing.clear", target: "icing.clearMode" },
  );
  await proveOutputChange(session, "icing.clearMode", "icing.clear", (control) =>
    control.getByRole("button", { exact: true, name: "Detail" }).click(),
  );
  await fieldFor(page, "icing.clearMode")
    .getByRole("button", { exact: true, name: "Base" })
    .click();
  await expect(page.locator(DONUT_CANVAS_SELECTOR)).toHaveAttribute(
    "data-donut-icing-visible",
    "false",
  );
});

for (const [target, expected, value] of [
  ["sprinkles.flow", "1.25", 1.6],
  ["sprinkles.scale", "0.5", 1.1],
  ["sprinkles.metallic", "0", 0.72],
] as const) {
  test(getDonutBrowserTestName(target), async ({ page }) => {
    const session = await openProof(page);
    await expectToolcraftReferenceParity(
      () => fieldFor(page, target).getByRole("slider").inputValue(),
      expected,
      { requirementId: target, target },
    );
    await proveOutputChange(session, target, target, (control) =>
      setSliderValue(control, value),
    );
  });
}

test(getDonutBrowserTestName("sprinkles.shape"), async ({ page }) => {
  const session = await openProof(page);
  await expectToolcraftReferenceParity(
    () =>
      fieldFor(page, "sprinkles.shape")
        .getByRole("button", { exact: true, name: "Rod" })
        .getAttribute("aria-pressed"),
    "true",
    { requirementId: "sprinkles.shape", target: "sprinkles.shape" },
  );
  await proveOutputChange(session, "sprinkles.shape", "sprinkles.shape", (control) =>
    control.getByRole("button", { exact: true, name: "Pellet" }).click(),
  );
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Shape", {
    requirementId: "sprinkles.shape",
    target: "sprinkles.shape",
  });
});

test(getDonutBrowserTestName("sprinkles.palette"), async ({ page }) => {
  const session = await openProof(page);
  await expectToolcraftReferenceParity(
    () => readControlOptionLabel(fieldFor(page, "sprinkles.palette")),
    "Rainbow",
    { requirementId: "sprinkles.palette", target: "sprinkles.palette" },
  );
  await proveOutputChange(
    session,
    "sprinkles.palette",
    "sprinkles.palette",
    (control, currentPage) => chooseControlOption(currentPage, control, "Candy"),
  );
});

test(getDonutBrowserTestName("sprinkles.solidColor"), async ({ page }) => {
  const session = await openProof(page);
  await chooseControlOption(
    page,
    fieldFor(page, "sprinkles.palette"),
    "Solid",
  );
  await expectToolcraftConditionalControlVisibility(
    session,
    session.controlAction("sprinkles.palette", (control, currentPage) =>
      chooseControlOption(currentPage, control, "Rainbow"),
    ),
    session.controlAction("sprinkles.palette", (control, currentPage) =>
      chooseControlOption(currentPage, control, "Solid"),
    ),
    { requirementId: "sprinkles.solidColor", target: "sprinkles.solidColor" },
  );
  await proveOutputChange(
    session,
    "sprinkles.solidColor",
    "sprinkles.solidColor",
    (control) => pickControlColor(page, control),
  );
});

test(getDonutBrowserTestName("sprinkles.clear"), async ({ page }) => {
  const session = await openProof(page);
  await proveOutputChange(
    session,
    "sprinkles.clear",
    "sprinkles.clear",
    (control) => control.getByRole("button", { exact: true, name: "Clear" }).click(),
  );
  await expect(page.locator(DONUT_CANVAS_SELECTOR)).toHaveAttribute(
    "data-donut-sprinkle-count",
    "0",
  );
  await setSliderValue(fieldFor(page, "sprinkles.flow"), 0.8);
  await expect(page.locator(DONUT_CANVAS_SELECTOR)).not.toHaveAttribute(
    "data-donut-sprinkle-count",
    "0",
  );
});

for (const [target, componentType] of donutDeepControlAcceptance.filter(
  ([target]) => target !== "donut.preset",
)) {
  test(getDonutBrowserTestName(target), async ({ page }) => {
    const session = await openProof(page);
    const visibilityOwner = getDonutVisibilityOwner(target);
    if (visibilityOwner) {
      const ownerSwitch = fieldFor(page, visibilityOwner).getByRole("switch");
      if (!(await ownerSwitch.isChecked())) {
        await ownerSwitch.click();
      }
      await expectToolcraftConditionalControlVisibility(
        session,
        session.controlAction(visibilityOwner, (control) =>
          control.getByRole("switch").click(),
        ),
        session.controlAction(visibilityOwner, (control) =>
          control.getByRole("switch").click(),
        ),
        { requirementId: target, target },
      );
    }
    const referenceDefault = readDonutDeepControlDefault(target);
    await expectToolcraftReferenceParity(
      async () => {
        const input = fieldFor(page, target).getByRole(
          getDonutDeepControlRole(componentType),
        );
        if (componentType === "switch") return input.isChecked();
        const value = await input.inputValue();
        if (componentType === "color") return value;
        const step = Number((await input.getAttribute("step")) ?? 0);
        return (
          Math.abs(Number(value) - Number(referenceDefault)) <=
          Math.max(step / 2, 1e-6) + 1e-6
        );
      },
      componentType === "color" || componentType === "switch"
        ? referenceDefault
        : true,
      { requirementId: target, target },
    );
    await proveOutputChange(
      session,
      target,
      target,
      (control) =>
        componentType === "color"
          ? pickControlColor(page, control)
          : componentType === "switch"
            ? control.getByRole("switch").click()
            : setAlternateDonutSliderValue(control, target),
      donutPixelProofFor(target),
    );
  });
}

for (const [target] of donutEdibleMaterialAcceptance) {
  test(getDonutBrowserTestName(target), async ({ page }) => {
    const session = await openProof(page);
    const expectedDefault = readDonutDeepControlDefault(target);
    await expectToolcraftReferenceParity(
      async () => {
        const input = fieldFor(page, target).getByRole("slider");
        const step = Number((await input.getAttribute("step")) ?? 0);
        return (
          Math.abs(Number(await input.inputValue()) - Number(expectedDefault)) <=
          Math.max(step / 2, 1e-6) + 1e-6
        );
      },
      true,
      { requirementId: target, target },
    );
    await proveOutputChange(
      session,
      target,
      target,
      (control) => setAlternateDonutSliderValue(control),
      donutPixelProofFor(target),
    );
  });
}

test(getDonutBrowserTestName("appearance.background"), async ({ page }) => {
  const session = await openProof(page);
  await proveOutputChange(
    session,
    "appearance.background",
    "appearance.background",
    (control) => pickControlColor(page, control),
  );
});

test(getDonutBrowserTestName("persistence.reload"), async ({ page }) => {
  const session = await openProof(page);
  const persisted = session.observe((root) =>
    root.querySelector<HTMLElement>("[data-donut-renderer]")?.dataset.canvasWidth ?? "",
  );
  await expectToolcraftPersistenceState(
    persisted,
    session.controlAction("canvas.size.width", async (control, currentPage) => {
      await setControlText(control, "1000");
      await expect(
        currentPage.locator('[data-slot="toolcraft-runtime-app"]'),
      ).toHaveAttribute("data-toolcraft-persistence-status", "success");
    }),
    session.reload(),
    "1000",
    {
      requirementId: "persistence.reload",
      stabilityIntervalMs: 100,
      timeoutMs: 20_000,
    },
  );
});
test("donut preview reuses shadows across material edits", ({ page }) => verifyDonutRenderPolicy(page));
