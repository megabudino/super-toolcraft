import { expect, type Page } from "@playwright/test";
import {
  createToolcraftBrowserProofSession,
} from "./browser-proof-session";
import { dragCanvasHandle } from "./canvas-handle-helpers";
import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import {
  expectToolcraftTimelineDuration,
  expectToolcraftTimelineLoop,
  expectToolcraftTimelinePauseResume,
  expectToolcraftTimelineRenderedFrame,
  expectToolcraftTimelineScrub,
  type ToolcraftTimelineLoopCycleProof,
} from "./browser-timeline-evidence-helpers";
import {
  ensureTimelineVisible,
  expectControlOptions,
  pauseAtVisibleFrame,
  pressSliderRight,
  selectControlOption,
} from "./mesh-editor-test-helpers";
import {
  expectHandlesMirroredAroundPoint,
  expectLocatorMovedBy,
} from "./mesh-point-reference-helpers";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

const meshOutputSelector = '[data-mesh-gradient-root="true"]';

test("browser: mesh controls edit the rendered gradient", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await pauseAtVisibleFrame(page);
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page.getByRole("button", { name: "Center canvas", exact: true }).click();

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.colors", async (_control, currentPage) => {
      const hexInputs = currentPage.getByRole("textbox", { name: /Point \d+ hex/ });
      const before = await hexInputs.count();
      await currentPage.getByRole("button", { name: "Add color point", exact: true }).click();
      await expect(hexInputs).toHaveCount(before + 1);
      const lastHex = hexInputs.last();
      await lastHex.fill("#FF6B35");
      await lastHex.press("Enter");
      await currentPage.getByRole("button", { name: "Remove color point", exact: true }).click();
      await expect(hexInputs).toHaveCount(before);
      await hexInputs.first().fill("#00FF66");
      await hexInputs.first().press("Enter");
    }),
    { requirementId: "mesh-colors", selector: meshOutputSelector },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.columns", async (control, currentPage) => {
      const slider = control.getByRole("slider", { name: "Columns", exact: true });
      await pressSliderRight(control, currentPage);
      await expect(slider).not.toHaveAttribute("aria-valuenow", "4");
    }),
    { requirementId: "mesh-columns", selector: meshOutputSelector },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.pinEdges", async (control, currentPage) => {
      await control.getByRole("switch").click();
      await expect(currentPage.locator('[data-testid="mesh-point-1"]')).toHaveCount(0);
      await expect(currentPage.locator('[data-toolcraft-canvas-handle]')).toHaveCount(0);
    }),
    { requirementId: "mesh-fix-edges", selector: '[data-toolcraft-canvas-world]' },
  );
  await page
    .locator('[data-toolcraft-control-target="mesh.pinEdges"]')
    .getByRole("switch")
    .click();

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.editing", async (control, currentPage) => {
      await control.getByRole("switch").click();
      await expect(currentPage.locator('[data-mesh-gradient-handles="true"]')).toHaveCount(0);
    }),
    { requirementId: "mesh-editing", selector: '[data-toolcraft-canvas-world]' },
  );
  await page
    .locator('[data-toolcraft-control-target="mesh.editing"]')
    .getByRole("switch")
    .click();
  await expect(page.locator('[data-mesh-gradient-handles="true"]')).toBeVisible();

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.guides", async (control) => {
      await control.getByRole("switch").click();
      await expect(page.locator('[data-mesh-grid-guide]')).toHaveCount(0);
    }),
    { requirementId: "mesh-guides", selector: '[data-toolcraft-canvas-world]' },
  );

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.points", async (control) => {
      await control.getByRole("button", { name: "Reflow", exact: true }).click();
      await control.getByRole("button", { name: "Shuffle", exact: true }).click();
    }),
    { requirementId: "mesh-geometry-actions", selector: meshOutputSelector },
  );

  await page.getByRole("button", { name: "Add color point", exact: true }).click();
  await page.getByRole("button", { name: "Reflow", exact: true }).click();
  const frame = page.locator('[data-mesh-gradient-canvas="true"]');
  const pointHandle = page.locator(
    '[data-toolcraft-canvas-handle][data-testid="mesh-point-primary"]',
  );
  const pointBox = await pointHandle.boundingBox();
  expect(pointBox).not.toBeNull();
  expect(pointBox!.width).toBeCloseTo(44, 0);
  expect(pointBox!.height).toBeCloseTo(44, 0);
  await pointHandle.click();
  await expect(pointHandle).toHaveAttribute("data-selected", "true");
  await expect(pointHandle).toHaveAttribute("data-handle-mode", "smooth");
  await pointHandle.dblclick();
  await expect(pointHandle).toHaveAttribute("data-handle-mode", "corner");
  await pointHandle.dblclick();
  await expect(pointHandle).toHaveAttribute("data-handle-mode", "smooth");

  const positiveTangent = page.locator(
    '[data-testid="mesh-tangent-horizontal-positive"]',
  );
  const negativeTangent = page.locator(
    '[data-testid="mesh-tangent-horizontal-negative"]',
  );
  const positiveBox = await positiveTangent.boundingBox();
  const negativeBox = await negativeTangent.boundingBox();
  const tangentFrame = await frame.getAttribute("data-mesh-frame-signature");
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mesh.points", async (_control, currentPage) => {
      await dragCanvasHandle(
        currentPage,
        "mesh-tangent-horizontal-positive",
        { x: 24, y: -26 },
        {
          requirementId: "mesh-canvas-tangent",
          target: "mesh.points",
        },
      );
    }),
    { requirementId: "mesh-canvas-tangent", selector: meshOutputSelector },
  );
  await expectLocatorMovedBy(positiveTangent, positiveBox, { x: 24, y: -26 });
  await expectLocatorMovedBy(negativeTangent, negativeBox, { x: -24, y: 26 });
  await expect(frame).not.toHaveAttribute("data-mesh-frame-signature", tangentFrame ?? "");
  await expectHandlesMirroredAroundPoint(pointHandle, positiveTangent, negativeTangent);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
});

test("browser: mixing controls edit the rendered mesh gradient", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await pauseAtVisibleFrame(page);

  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Interpolation", {
    requirementId: "mix-interpolation",
    target: "mix.interpolation",
  });

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("mix.interpolation", async (control) => {
      await control.getByRole("button", { name: "sRGB", exact: true }).click();
    }),
    { requirementId: "mix-interpolation" },
  );

  for (const [target, requirementId] of [
    ["mix.spread", "mix-spread"],
    ["mix.warp", "mix-warp"],
    ["mix.swirl", "mix-swirl"],
    ["mix.opacity", "mix-opacity"],
    ["mix.grain", "mix-grain"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, pressSliderRight),
      { requirementId },
    );
  }
});

test("browser: color correction controls edit the rendered mesh gradient", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await pauseAtVisibleFrame(page);

  for (const [target, requirementId] of [
    ["color.exposure", "color-exposure"],
    ["color.contrast", "color-contrast"],
    ["color.hue", "color-hue"],
    ["color.saturation", "color-saturation"],
    ["color.lightness", "color-lightness"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, pressSliderRight),
      { requirementId },
    );
  }
});

test("browser: motion controls edit the rendered animation", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await pauseAtVisibleFrame(page);

  for (const [target, requirementId] of [
    ["motion.positionDrift", "motion-position-drift"],
    ["motion.colorDrift", "motion-color-drift"],
    ["motion.scale", "motion-scale"],
    ["motion.cycles", "motion-cycles"],
    ["motion.randomness", "motion-randomness"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, pressSliderRight),
      { requirementId },
    );
  }
});

test("browser: mesh editor settings persist after reload", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await pauseAtVisibleFrame(page);

  const observeSpread = session.observe((root) => {
    const valueButton = Array.from(root.querySelectorAll<HTMLButtonElement>("button")).find(
      (candidate) =>
        candidate.getAttribute("aria-label") === "Edit Color spread value",
    );
    return Number.parseFloat(valueButton?.textContent ?? "");
  });
  await expectToolcraftPersistenceState(
    observeSpread,
    session.controlAction("mix.spread", async (control) => {
      const slider = control.getByRole("slider");
      await slider.focus();
      await slider.press("End");
    }),
    session.reload(),
    100,
    { requirementId: "mesh-persistence" },
  );
});

async function collectTimelineLoopCycle(
  page: Page,
  durationSeconds: number,
): Promise<ToolcraftTimelineLoopCycleProof> {
  const slider = page.getByRole("slider", { name: "Playback position", exact: true });
  const canvas = page.locator('[data-mesh-gradient-canvas="true"]');
  const samplePhases = [0, 0.25, 0.5, 0.75, 0.99, 0.01] as const;
  const normalizedPhases: number[] = [];

  for (const phase of samplePhases) {
    if (phase === 0) {
      await slider.focus();
      await slider.press("Home");
    } else {
      await setPlaybackFraction(page, phase);
    }
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    const observedTime = Number(await slider.getAttribute("aria-valuenow"));
    normalizedPhases.push(observedTime / durationSeconds);
  }

  await slider.focus();
  await slider.press("Home");
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  const seamStartSignature = (await canvas.getAttribute("data-mesh-frame-signature")) ?? "";
  await slider.press("End");
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  const seamEndSignature = (await canvas.getAttribute("data-mesh-frame-signature")) ?? "";

  return {
    durationSeconds,
    normalizedPhases,
    seamEndSignature,
    seamStartSignature,
  };
}

async function setPlaybackFraction(page: Page, fraction: number): Promise<void> {
  const slider = page.getByRole("slider", { name: "Playback position", exact: true });
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(
    box!.x + Math.max(1, Math.min(box!.width - 1, box!.width * fraction)),
    box!.y + box!.height / 2,
  );
}

test("browser: mesh timeline drives one seamless animation loop", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const extendedTimeline = page.locator(
    '[data-toolcraft-control-target="panels.timeline.extended"]',
  );
  await extendedTimeline.getByRole("switch").click();
  const initialPlay = page.getByRole("button", { name: "Play playback", exact: true });
  if ((await initialPlay.count()) === 1) {
    await initialPlay.click();
  }

  const observePlayback = session.observe((root) => {
    const slider = Array.from(
      root.querySelectorAll<HTMLElement>('[data-slot="timeline-panel"] [role="slider"]'),
    ).find((candidate) => candidate.getClientRects().length > 0);
    const canvas = root.querySelector<HTMLElement>('[data-mesh-gradient-canvas="true"]');
    return {
      currentTimeSeconds: Number(
        slider?.getAttribute("aria-valuenow") ??
          (slider as HTMLInputElement | undefined)?.value,
      ),
      outputSignature: canvas?.getAttribute("data-mesh-frame-signature") ?? "",
      playing: root.querySelector('[aria-label="Pause playback"]') !== null,
    };
  });
  await expectToolcraftTimelinePauseResume(
    observePlayback,
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Pause playback", exact: true }).click();
    }),
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Play playback", exact: true }).click();
      await currentPage.getByRole("application", { name: "Canvas viewport" }).hover({
        position: { x: 40, y: 40 },
      });
      await expect(currentPage.locator('[data-slot="timeline-panel"]')).toHaveAttribute(
        "data-hover-paused",
        "false",
      );
    }),
    { requirementId: "mesh-timeline" },
  );
  await page.getByRole("button", { name: "Pause playback", exact: true }).click();

  const initialCycle = await collectTimelineLoopCycle(page, 6);
  const observeDuration = session.observe((root) => {
    const slider = Array.from(
      root.querySelectorAll<HTMLElement>('[data-slot="timeline-panel"] [role="slider"]'),
    ).find((candidate) => candidate.getClientRects().length > 0);
    const duration = Number(
      slider?.getAttribute("aria-valuemax") ??
        (slider as HTMLInputElement | undefined)?.max,
    );
    return {
      renderedCycleDurationSeconds: duration,
      timelineDurationSeconds: duration,
    };
  });
  await expectToolcraftTimelineDuration(
    observeDuration,
    session.action(async (currentPage) => {
      await currentPage
        .getByRole("button", { name: "Edit timeline duration", exact: true })
        .click();
      const input = currentPage.getByRole("textbox", { name: "timeline duration" });
      await input.fill("4");
      await input.press("Enter");
    }),
    4,
    { requirementId: "mesh-timeline" },
  );
  const resizedCycle = await collectTimelineLoopCycle(page, 4);
  await page.locator('[data-slot="toolcraft-runtime-app"]').evaluate(
    (root, proof) => {
      root.setAttribute("data-toolcraft-test-loop-proof", JSON.stringify(proof));
    },
    { initial: initialCycle, resized: resizedCycle },
  );
  await expectToolcraftTimelineLoop(
    session.observe((root) =>
      JSON.parse(root.getAttribute("data-toolcraft-test-loop-proof") ?? "{}"),
    ),
    { requirementId: "mesh-timeline" },
  );

  const observeScrub = session.observe((root) => {
    const slider = Array.from(
      root.querySelectorAll<HTMLElement>('[data-slot="timeline-panel"] [role="slider"]'),
    ).find((candidate) => candidate.getClientRects().length > 0);
    const canvas = root.querySelector<HTMLElement>('[data-mesh-gradient-canvas="true"]');
    return {
      currentTimeSeconds: Number(
        slider?.getAttribute("aria-valuenow") ??
          (slider as HTMLInputElement | undefined)?.value,
      ),
      outputSignature: canvas?.getAttribute("data-mesh-frame-signature") ?? "",
    };
  });
  await setPlaybackFraction(page, 0.5);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  const scrubSlider = page.getByRole("slider", { name: "Playback position", exact: true });
  const scrubExpected = {
    currentTimeSeconds: Number(await scrubSlider.getAttribute("aria-valuenow")),
    outputSignature:
      (await page
        .locator('[data-mesh-gradient-canvas="true"]')
        .getAttribute("data-mesh-frame-signature")) ?? "",
  };
  await scrubSlider.focus();
  await scrubSlider.press("End");
  await expectToolcraftTimelineScrub(
    observeScrub,
    session.action(async (currentPage) => {
      await setPlaybackFraction(currentPage, 0.5);
    }),
    scrubExpected,
    { requirementId: "mesh-timeline" },
  );
  await setPlaybackFraction(page, 0.25);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  const quarterSignature =
    (await page
      .locator('[data-mesh-gradient-canvas="true"]')
      .getAttribute("data-mesh-frame-signature")) ?? "";
  await scrubSlider.focus();
  await scrubSlider.press("End");
  await expectToolcraftTimelineRenderedFrame(
    session.observe(
      (root) =>
        root
          .querySelector<HTMLElement>('[data-mesh-gradient-canvas="true"]')
          ?.getAttribute("data-mesh-frame-signature") ?? "",
    ),
    session.action(async (currentPage) => {
      await setPlaybackFraction(currentPage, 0.25);
    }),
    quarterSignature,
    { requirementId: "mesh-timeline" },
  );

  await setPlaybackFraction(page, 0.25);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("panels.timeline.extended", async (control, currentPage) => {
      await setPlaybackFraction(currentPage, 0.5);
      await control.getByRole("switch").click();
    }),
    { requirementId: "mesh-timeline" },
  );
});
