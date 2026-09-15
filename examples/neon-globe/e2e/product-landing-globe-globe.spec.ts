import type { Page } from "@playwright/test";

import { expectExportExcludesCanvasHandles } from "./canvas-handle-helpers";
import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import {
  expectToolcraftOrientationAxisDrag,
  expectToolcraftOrientationAxisSnap,
  expectToolcraftOrientationCanvasMissPan,
  expectToolcraftOrientationModelDrag,
  expectToolcraftOrientationUndoReset,
} from "./browser-orientation-gizmo-evidence-helpers";
import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
} from "./browser-proof-session";
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expect, test } from "./toolcraft-product-test";
import { expectBandSliderLiveChange, expectReorderedGlobeLoop } from "./product-landing-globe-order-helpers";
import { expectLogoHoldTimingChange } from "./product-landing-globe-hold-helpers";
import { expectGlobeFrameContinuity } from "./product-landing-globe-orbit-helpers";
import {
  LOGO_LOOP_APPROACH_DURATION_MS,
  LOGO_LOOP_ORBIT_DURATION_MS,
  LOGO_LOOP_STAGGER_MS,
  getLogoLoopTiming,
} from "../src/app/globe-logo-animation";
import { GLOBE_DEFAULTS } from "../src/app/globe-constants";
import {
  BAND_1_POSITION_TARGET,
  BAND_1_WIDTH_TARGET,
  BAND_2_POSITION_TARGET,
  BAND_2_WIDTH_TARGET,
  BAND_3_POSITION_TARGET,
  BAND_3_WIDTH_TARGET,
  BAND_4_POSITION_TARGET,
  BAND_4_WIDTH_TARGET,
  BAND_COLUMN_SPACING_TARGET,
  BAND_DISTANCE_TARGET,
  BAND_DOT_SIZE_TARGET,
  BLACK,
  CRT_INTENSITY_TARGET,
  LATITUDES_TARGET,
  LINE_TARGET,
  LINE_WIDTH_TARGET,
  LOGO_DXC_FINAL_POSITION_TARGET,
  LOGO_HOLD_SECONDS_TARGET,
  LOGO_INTRO_RUN_TARGET,
  LOGO_META_FINAL_POSITION_TARGET,
  LOGO_PRADA_FINAL_POSITION_TARGET,
  LOGO_SPEED_TARGET,
  LOGO_ZILLOW_FINAL_POSITION_TARGET,
  MERIDIANS_TARGET,
  ORIENTATION_TARGET,
  OUTLINE_TARGET,
  PREVIEW_CANVAS_SELECTOR,
  SPHERE_TARGET,
  dragCanvasPan,
  exposeRenderScaleAriaForOrientationHelper,
  exportImage,
  fillControlText,
  inspectImage,
  observeOrientation,
  setRangeControl,
  setSwitchControl,
} from "./product-landing-globe-helpers";

test.setTimeout(120_000);

async function settleLogoLoopAtHold(page: Page): Promise<void> {
  await setRangeControl(
    page.locator(`[data-toolcraft-control-target="${LOGO_HOLD_SECONDS_TARGET}"]`),
    8,
  );
  const runControl = page.locator(
    `[data-toolcraft-control-target="${LOGO_INTRO_RUN_TARGET}"]`,
  );
  await runControl.scrollIntoViewIfNeeded();
  await runControl.getByRole("button", { name: "Run logos" }).click();
  const defaultTiming = getLogoLoopTiming(GLOBE_DEFAULTS.logoSpeed);
  await page.waitForTimeout(
    defaultTiming.approachDurationMs + defaultTiming.staggerMs * 3 + 150,
  );
}

test("browser: sphere color changes opaque globe body", async ({ page }) => {
  await page.goto("/");
  await settleLogoLoopAtHold(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(SPHERE_TARGET, (control) =>
      fillControlText(control, "#202020"),
    ),
    { requirementId: "globe.sphere-color", stabilityIntervalMs: 0 },
  );
});

test("browser: line color changes latitude and meridian grid", async ({ page }) => {
  await page.goto("/");
  await settleLogoLoopAtHold(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(LINE_TARGET, (control) =>
      fillControlText(control, "#7dd3fc"),
    ),
    { requirementId: "globe.line-color", stabilityIntervalMs: 0 },
  );
});

test("browser: latitude count changes horizontal globe rings", async ({ page }) => {
  await page.goto("/");
  await settleLogoLoopAtHold(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(LATITUDES_TARGET, (control) =>
      setRangeControl(control, 14),
    ),
    { requirementId: "globe.latitude-count", stabilityIntervalMs: 0 },
  );
  await expectToolcraftDiscreteSliderMarkers(page, LATITUDES_TARGET, "globe.latitude-count");
});

test("browser: meridian count changes vertical globe arcs", async ({ page }) => {
  await page.goto("/");
  await settleLogoLoopAtHold(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(MERIDIANS_TARGET, (control) =>
      setRangeControl(control, 30),
    ),
    { requirementId: "globe.meridian-count", stabilityIntervalMs: 0 },
  );
});

test("browser: line width changes globe grid thickness", async ({ page }) => {
  await page.goto("/");
  await settleLogoLoopAtHold(page);
  await setSwitchControl(
    page.locator(`[data-toolcraft-control-target="${OUTLINE_TARGET}"]`),
    true,
  );
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(LINE_WIDTH_TARGET, (control) =>
      setRangeControl(control, 6),
    ),
    { requirementId: "globe.line-width", stabilityIntervalMs: 0 },
  );
});

test("browser: outline toggle draws synchronized globe circle", async ({ page }) => {
  await page.goto("/");
  await settleLogoLoopAtHold(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(OUTLINE_TARGET, (control) =>
      setSwitchControl(control, false),
    ),
    { requirementId: "globe.outline", stabilityIntervalMs: 0 },
  );
});

test("browser: crt intensity changes foreground flicker strength", async ({ page }) => {
  await page.goto("/");
  await setRangeControl(
    page.locator(`[data-toolcraft-control-target="${CRT_INTENSITY_TARGET}"]`),
    0,
  );
  await settleLogoLoopAtHold(page);
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(CRT_INTENSITY_TARGET, (control) =>
      setRangeControl(control, 85),
    ),
    { requirementId: "effects.crt-intensity", stabilityIntervalMs: 0 },
  );
  const backgroundPixel = await page
    .locator(PREVIEW_CANVAS_SELECTOR)
    .evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Unable to sample CRT background pixel.");
      return Array.from(context.getImageData(4, 4, 1, 1).data);
    });
  expect(backgroundPixel).toEqual(BLACK);
});

const bandControlCases = [
  {
    name: "browser: band distance offsets all globe ribbons",
    requirementId: "bands.distance",
    target: BAND_DISTANCE_TARGET,
    bounds: [0, 24],
    value: 18,
  },
  {
    name: "browser: band dot size changes every ribbon dot grid",
    requirementId: "bands.dot-size",
    target: BAND_DOT_SIZE_TARGET,
    bounds: [1, 6],
    value: 1.5,
  },
  {
    name: "browser: band column spacing changes every ribbon dot grid",
    requirementId: "bands.column-spacing",
    target: BAND_COLUMN_SPACING_TARGET,
    bounds: [3, 18],
    value: 10,
  },
  {
    name: "browser: band 1 position changes ribbon radius",
    requirementId: "bands.band1.position",
    target: BAND_1_POSITION_TARGET,
    bounds: [-76, 76],
    value: 44,
  },
  {
    name: "browser: band 1 width changes ribbon thickness",
    requirementId: "bands.band1.width",
    target: BAND_1_WIDTH_TARGET,
    bounds: [4, 60],
    value: 60,
  },
  {
    name: "browser: band 2 position changes ribbon radius",
    requirementId: "bands.band2.position",
    target: BAND_2_POSITION_TARGET,
    bounds: [-76, 76],
    value: 18,
  },
  {
    name: "browser: band 2 width changes ribbon thickness",
    requirementId: "bands.band2.width",
    target: BAND_2_WIDTH_TARGET,
    bounds: [4, 60],
    value: 60,
  },
  {
    name: "browser: band 3 position changes ribbon radius",
    requirementId: "bands.band3.position",
    target: BAND_3_POSITION_TARGET,
    bounds: [-76, 76],
    value: -10,
  },
  {
    name: "browser: band 3 width changes ribbon thickness",
    requirementId: "bands.band3.width",
    target: BAND_3_WIDTH_TARGET,
    bounds: [4, 60],
    value: 60,
  },
  {
    name: "browser: band 4 position changes ribbon radius",
    requirementId: "bands.band4.position",
    target: BAND_4_POSITION_TARGET,
    bounds: [-76, 76],
    value: -34,
  },
  {
    name: "browser: band 4 width changes ribbon thickness",
    requirementId: "bands.band4.width",
    target: BAND_4_WIDTH_TARGET,
    bounds: [4, 60],
    value: 60,
  },
] as const;

for (const { name, requirementId, target, value, bounds } of bandControlCases) {
  test(name, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.clock.install();
    await page.goto("/");
    const session = await createToolcraftBrowserProofSession(page);
    await setRangeControl(
      page.locator(`[data-toolcraft-control-target="${CRT_INTENSITY_TARGET}"]`),
      0,
    );
    await getToolcraftProductObservableSnapshot(page);
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(new Date(now + 5000));
    await page.getByRole("button", { name: "Run logos", exact: true }).click();
    const timing = getLogoLoopTiming(GLOBE_DEFAULTS.logoSpeed);
    await page.clock.runFor(timing.approachDurationMs + timing.staggerMs * 3 + 160);
    await page.locator(`[data-toolcraft-control-target="${target}"]`)
      .locator('[data-slot="slider-thumb"]').hover();
    await page.clock.runFor(64);
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, (control) => expectBandSliderLiveChange(control, value, bounds)),
      { requirementId, stabilityIntervalMs: 0 },
    );
  });
}

const logoControlCases = [
  {
    label: "easyJet",
    name: "browser: easyjet logo final position moves black dot mask",
    requirementId: "logos.dxc.final-position",
    target: LOGO_DXC_FINAL_POSITION_TARGET,
    value: 30,
  },
  {
    label: "Novo Nordisk",
    name: "browser: novo nordisk logo final position moves black dot mask",
    requirementId: "logos.meta.final-position",
    target: LOGO_META_FINAL_POSITION_TARGET,
    value: 72,
  },
  {
    label: "Prada",
    name: "browser: prada logo final position moves black dot mask",
    requirementId: "logos.prada.final-position",
    target: LOGO_PRADA_FINAL_POSITION_TARGET,
    value: 34,
  },
  {
    label: "Ubisoft",
    name: "browser: ubisoft logo final position moves black dot mask",
    requirementId: "logos.zillow.final-position",
    target: LOGO_ZILLOW_FINAL_POSITION_TARGET,
    value: 76,
  },
] as const;

for (const { label, name, requirementId, target, value } of logoControlCases) {
  test(name, async ({ page }) => {
    await page.goto("/");
    // Isolate mask movement from the independent CRT flicker.
    await setRangeControl(
      page.locator(`[data-toolcraft-control-target="${CRT_INTENSITY_TARGET}"]`),
      0,
    );
    await settleLogoLoopAtHold(page);
    await expect(page.locator(`[data-toolcraft-control-target="${target}"]`).getByRole("slider", { name: label, exact: true })).toBeVisible();
    const session = await createToolcraftBrowserProofSession(page);
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, (control) => setRangeControl(control, value)),
      { requirementId, stabilityIntervalMs: 0 },
    );
  });
}

test("browser: logo loop action restarts staggered orbit", async ({ page }) => {
  test.setTimeout(180_000);
  await expectReorderedGlobeLoop(page);
  await expectToolcraftReferenceParity(
    async () => ({
      defaultFrontSlowdownDurationMs: getLogoLoopTiming(GLOBE_DEFAULTS.logoSpeed)
        .approachDurationMs,
      defaultOrbitDurationMs: getLogoLoopTiming(GLOBE_DEFAULTS.logoSpeed)
        .orbitDurationMs,
      defaultRowStaggerMs: getLogoLoopTiming(GLOBE_DEFAULTS.logoSpeed)
        .staggerMs,
      defaultSpeed: GLOBE_DEFAULTS.logoSpeed,
      direction: "forward-only" as const,
      finalApproach: "late-inertia" as const,
      referenceFrontSlowdownDurationMs: LOGO_LOOP_APPROACH_DURATION_MS,
      referenceOrbitDurationMs: LOGO_LOOP_ORBIT_DURATION_MS,
      referenceRowStaggerMs: LOGO_LOOP_STAGGER_MS,
      slowdownAnchor: "final-logo-position" as const,
    }),
    {
      defaultFrontSlowdownDurationMs: 304,
      defaultOrbitDurationMs: 1008,
      defaultRowStaggerMs: 336,
      defaultSpeed: 2.5,
      direction: "forward-only" as const,
      finalApproach: "late-inertia" as const,
      referenceFrontSlowdownDurationMs: 760,
      referenceOrbitDurationMs: 2520,
      referenceRowStaggerMs: 840,
      slowdownAnchor: "final-logo-position" as const,
    },
    {
      requirementId: "logos.intro.run",
      target: LOGO_INTRO_RUN_TARGET,
    },
  );
});

test("browser: logo hold time changes loop dwell before the next orbit", async ({
  page,
}) => {
  await expectLogoHoldTimingChange(page);
});

test("browser: logo speed changes orbit travel tempo", async ({ page }) => {
  await page.addInitScript(() => {
    const frameTimestampMs = 101;
    const originalRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    Object.defineProperty(window.performance, "now", {
      configurable: true,
      value: () => 1,
    });
    window.requestAnimationFrame = (callback) =>
      originalRequestAnimationFrame(() => callback(frameTimestampMs));
  });
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(LOGO_SPEED_TARGET, (control) =>
      setRangeControl(control, 2),
    ),
    {
      requirementId: "logos.speed",
      stabilityIntervalMs: 0,
      timeoutMs: 4000,
    },
  );
});

test("browser: orientation gizmo tilts globe axis and stays out of export", async ({
  page,
}) => {
  // This contract runs axis/model drag, history, snapping, and pan at full quality.
  // Keep each helper's live-response deadline; allow time for all proof-session reads.
  test.setTimeout(300_000);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await exposeRenderScaleAriaForOrientationHelper(page);
  const observation = session.observe(observeOrientation);
  const beforeDrag = await readToolcraftBrowserObservation(observation);
  const changed = await expectGlobeFrameContinuity(page, () => expectToolcraftOrientationAxisDrag(observation, session, {
    dragDelta: { x: 18, y: -14 },
    requirementId: "globe.orientation",
    stabilityIntervalMs: 0,
    target: ORIENTATION_TARGET,
  }));
  await expectToolcraftOrientationUndoReset(
    observation,
    session.targetAction(ORIENTATION_TARGET, (currentPage) =>
      currentPage.getByRole("button", { name: "Undo" }).click(),
    ),
    session.targetAction(ORIENTATION_TARGET, (currentPage) =>
      currentPage.getByRole("button", { name: "Redo" }).click(),
    ),
    session.targetAction(ORIENTATION_TARGET, (currentPage) =>
      currentPage.getByRole("button", { name: "Reset Globe section" }).click(),
    ),
    beforeDrag,
    changed,
    {
      requirementId: "globe.orientation",
      stabilityIntervalMs: 0,
      target: ORIENTATION_TARGET,
    },
  );
  await expectToolcraftOrientationAxisSnap(observation, session, "+z", {
    requirementId: "globe.orientation",
    stabilityIntervalMs: 0,
    target: ORIENTATION_TARGET,
  });
  await expectGlobeFrameContinuity(page, () => expectToolcraftOrientationModelDrag(observation, session, {
    dragDelta: { x: -22, y: 12 },
    requirementId: "globe.orientation",
    stabilityIntervalMs: 0,
    target: ORIENTATION_TARGET,
  }));
  await expectToolcraftOrientationCanvasMissPan(
    observation,
    session.targetAction(ORIENTATION_TARGET, dragCanvasPan),
    {
      requirementId: "globe.orientation",
      stabilityIntervalMs: 0,
      target: ORIENTATION_TARGET,
    },
  );
});

test("orientation gizmo is excluded from exported globe image", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-toolcraft-canvas-handle]")).toHaveCount(1);
  await expectExportExcludesCanvasHandles(
    page,
    () => exportImage(page),
    async (download) => (await inspectImage(page, download)).inspection,
    {
      requirementId: "globe.orientation#export-clean",
      target: ORIENTATION_TARGET,
    },
  );
});
