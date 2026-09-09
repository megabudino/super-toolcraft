import type { Locator, Page } from "@playwright/test";

import {
  getToolcraftApplicabilityRequirementId,
  getToolcraftControlApplicabilityCases,
  type ToolcraftControlApplicabilityCase,
} from "../src/app/app-acceptance";
import {
  appAcceptance,
  appControlSectionInventory,
} from "../src/app/app-acceptance-data";
import { appSchema } from "../src/app/app-schema";
import { heroGalleryTargets } from "../src/app/hero-gallery-values";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { attachToolcraftBrowserRuntimeEvidence } from "./browser-runtime-evidence";
import {
  dragCanvasHandle,
  expectExportExcludesCanvasHandles,
  getCanvasHandle,
} from "./canvas-handle-helpers";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import {
  heroFrameSelector,
  heroPreviewSelector,
  waitForWebsitePreview,
} from "./hero-preview-browser-helpers";
import {
  type HeroGallerySnapshotArtifact,
  inspectHeroGallerySnapshot,
  requestHeroGallerySnapshot,
} from "./hero-gallery-snapshot-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const panAcceptance = appAcceptance.find(
  (entry) => entry.id === heroGalleryTargets.pan,
);
const panHandleAcceptance = appAcceptance.find(
  (entry) => entry.id === "sphere.pan.handle",
);
const autoScrollAcceptance = appAcceptance.find(
  (entry) => entry.id === heroGalleryTargets.autoScrollEnabled,
);
const autoScrollIntervalAcceptance = appAcceptance.find(
  (entry) => entry.id === heroGalleryTargets.autoScrollInterval,
);
const autoScrollDurationAcceptance = appAcceptance.find(
  (entry) => entry.id === heroGalleryTargets.autoScrollDuration,
);

if (
  !panAcceptance?.target ||
  !panHandleAcceptance?.canvasHandle ||
  !autoScrollAcceptance?.target ||
  !autoScrollIntervalAcceptance?.target ||
  !autoScrollDurationAcceptance?.target
) {
  throw new Error("Missing gallery pan acceptance rows.");
}

function parsePan(value: string | null) {
  const [x = "0", y = "0", turns = "0"] = (value ?? "").split(":");
  return { turns: Number(turns), x: Number(x), y: Number(y) };
}

async function readGalleryPan(page: Page) {
  return parsePan(
    await page.locator(heroPreviewSelector).getAttribute("data-hero-gallery-pan"),
  );
}

async function clickPanPad(
  control: Locator,
  normalizedPosition: Readonly<{ x: number; y: number }>,
) {
  const pad = control.getByRole("button", { name: "Pan X/Y pad" });
  const bounds = await pad.boundingBox();
  if (!bounds) throw new Error("The Pan X/Y pad must be visible.");
  await pad.click({
    position: {
      x: bounds.width * normalizedPosition.x,
      y: bounds.height * normalizedPosition.y,
    },
  });
}

async function enterSliderValue(
  control: Locator,
  value: string,
  label?: string,
): Promise<void> {
  await control
    .getByRole("button", { name: label ? `Edit ${label} value` : /Edit .* value/ })
    .click();
  const input = control.getByRole("textbox");
  await input.fill(value);
  await input.press("Enter");
}

async function setAutoScrollEnabled(page: Page, enabled: boolean): Promise<void> {
  const control = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollEnabled,
  );
  const toggle = control.getByRole("switch");
  if ((await toggle.getAttribute("aria-checked")) !== String(enabled)) {
    await toggle.click();
  }
}

async function freezeSphereRowSpeeds(page: Page): Promise<void> {
  const rows = page.locator(
    `[data-slot="toolcraft-runtime-app"] [data-toolcraft-control-target="${heroGalleryTargets.sphereRows}"]`,
  );
  await expect(rows).toBeVisible();
  const rowGroups = rows.locator('[data-slot="collection-item-group"]');
  const rowCount = await rowGroups.count();
  expect(rowCount).toBeGreaterThan(0);

  for (let index = 0; index < rowCount; index += 1) {
    await enterSliderValue(rowGroups.nth(index), "0", "Speed");
  }
}

async function selectAutoScrollApplicabilityBranch(
  control: Locator,
  applicabilityCase: ToolcraftControlApplicabilityCase,
): Promise<void> {
  if (applicabilityCase.selectorControlType === "switch") {
    const toggle = control.getByRole("switch");
    const desired = String(applicabilityCase.selectorValue);
    if ((await toggle.getAttribute("aria-checked")) !== desired) {
      await toggle.click();
    }
    return;
  }

  if (applicabilityCase.selectorControlType === "segmented") {
    if (!applicabilityCase.selectorOptionLabel) {
      throw new Error("Auto-scroll applicability requires a selector label.");
    }
    const option = control.getByRole("button", {
      name: applicabilityCase.selectorOptionLabel,
    });
    if ((await option.getAttribute("aria-pressed")) !== "true") {
      await option.click();
    }
    return;
  }

  throw new Error(
    `Unsupported auto-scroll applicability selector ${applicabilityCase.selectorControlType}.`,
  );
}

async function proveAutoScrollSliderApplicability(
  page: Page,
  acceptanceId: string,
  target: string,
): Promise<string> {
  const session = await createToolcraftBrowserProofSession(page);
  const applicabilityCases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target,
  });
  let visibleRequirementId = acceptanceId;

  for (const applicabilityCase of applicabilityCases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction(
        applicabilityCase.selectorTarget,
        async (control) =>
          selectAutoScrollApplicabilityBranch(control, applicabilityCase),
      ),
      applicabilityCase,
      { baseRequirementId: acceptanceId },
    );
    if (applicabilityCase.expectation === "visible") {
      visibleRequirementId = getToolcraftApplicabilityRequirementId(
        acceptanceId,
        applicabilityCase,
      );
    }
  }

  return visibleRequirementId;
}

function getAutoScrollGallery(page: Page): Locator {
  return page
    .frameLocator(heroFrameSelector)
    .locator('[data-hero-gallery="sphere"][data-hero-gallery-ready="true"]');
}

async function meanSnapshotDelta(
  page: Page,
  before: HeroGallerySnapshotArtifact,
  after: HeroGallerySnapshotArtifact,
): Promise<number> {
  return page.evaluate(async ({ first, second }) => {
    const decode = async (base64: string) => {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Unable to compare hero gallery snapshots.");
        context.drawImage(bitmap, 0, 0, 64, 64);
        return Array.from(context.getImageData(0, 0, 64, 64).data);
      } finally {
        bitmap.close();
      }
    };

    const [firstPixels, secondPixels] = await Promise.all([
      decode(first),
      decode(second),
    ]);
    return firstPixels.reduce(
      (sum, channel, index) => sum + Math.abs(channel - (secondPixels[index] ?? 0)),
      0,
    ) / firstPixels.length;
  }, { first: before.base64, second: after.base64 });
}

test.setTimeout(60_000);

test(panHandleAcceptance.browserTestName, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page);
  const session = await createToolcraftBrowserProofSession(page);
  const before = await readGalleryPan(page);

  await expectToolcraftProductObservableToChange(
    session,
    session.targetAction(heroGalleryTargets.pan, async (currentPage) => {
      await dragCanvasHandle(
        currentPage,
        panHandleAcceptance.canvasHandle?.testId ?? "hero-gallery-pan-handle",
        { x: 160, y: 0 },
        {
          requirementId: panHandleAcceptance.id,
          target: heroGalleryTargets.pan,
        },
      );
    }),
    {
      requirementId: panHandleAcceptance.id,
      selector: heroPreviewSelector,
      stabilityIntervalMs: 50,
      stabilitySamples: 2,
      timeoutMs: 10_000,
    },
  );
  const afterHorizontal = await readGalleryPan(page);
  expect(afterHorizontal.x).toBeGreaterThan(before.x);

  await dragCanvasHandle(page, "hero-gallery-pan-handle", { x: 0, y: 120 });
  await expect.poll(() => readGalleryPan(page)).not.toEqual(afterHorizontal);
  const afterVertical = await readGalleryPan(page);
  expect(afterVertical.y).toBeGreaterThan(afterHorizontal.y);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => readGalleryPan(page)).toEqual(afterHorizontal);

  const handle = getCanvasHandle(page, "hero-gallery-pan-handle");
  const bounds = await handle.boundingBox();
  if (!bounds) throw new Error("The gallery pan handle must be measurable.");
  const beforeModifiedDrag = await readGalleryPan(page);
  await page.keyboard.down("Shift");
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 80, bounds.y + bounds.height / 2, {
    steps: 4,
  });
  await page.mouse.up();
  await page.keyboard.up("Shift");
  expect(await readGalleryPan(page)).toEqual(beforeModifiedDrag);
});

test(panHandleAcceptance.canvasHandle.exportCleanTestName, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page);

  await expectExportExcludesCanvasHandles(
    page,
    () => requestHeroGallerySnapshot(page),
    (artifact) => inspectHeroGallerySnapshot(page, artifact),
    {
      requirementId: panHandleAcceptance.id,
      target: heroGalleryTargets.pan,
    },
  );
});

test(panAcceptance.browserTestName, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page);
  const session = await createToolcraftBrowserProofSession(page);
  const observePan = session.observe((root) => {
    return (
      root
        .querySelector<HTMLElement>(
          '[data-toolcraft-product-output="hero-external-preview"]',
        )
        ?.getAttribute("data-hero-gallery-pan") ?? ""
    );
  });

  await expectToolcraftCompoundControlPartOutcome(
    observePan,
    session.controlAction(panAcceptance.target, async (control) => {
      await clickPanPad(control, { x: 0.75, y: 0.5 });
    }),
    "0.5:0:0",
    {
      part: "vector.x",
      requirementId: panAcceptance.id,
      stabilityIntervalMs: 50,
      stabilitySamples: 2,
      timeoutMs: 10_000,
    },
  );

  await expectToolcraftCompoundControlPartOutcome(
    observePan,
    session.controlAction(panAcceptance.target, async (control) => {
      await clickPanPad(control, { x: 0.75, y: 0.75 });
    }),
    "0.5:0.5:0",
    {
      part: "vector.y",
      requirementId: panAcceptance.id,
      stabilityIntervalMs: 50,
      stabilitySamples: 2,
      timeoutMs: 10_000,
    },
  );
});

test(autoScrollAcceptance.browserTestName, async ({ page }) => {
  await page.goto("/");
  await waitForWebsitePreview(page);
  const gallery = getAutoScrollGallery(page);
  await expect(gallery).toHaveAttribute(
    "data-hero-gallery-auto-scroll",
    "0.0000:0.0000",
  );
  await freezeSphereRowSpeeds(page);
  const before = await requestHeroGallerySnapshot(page);

  await setAutoScrollEnabled(page, true);
  const interval = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollInterval,
  );
  const duration = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollDuration,
  );
  await enterSliderValue(interval, "1");
  await enterSliderValue(duration, "0.3");
  await page.waitForTimeout(1_600);

  await expect
    .poll(() => gallery.getAttribute("data-hero-gallery-auto-scroll"))
    .not.toBe("0.0000:0.0000");
  const after = await requestHeroGallerySnapshot(page);
  expect(await meanSnapshotDelta(page, before, after)).toBeGreaterThan(0.5);
  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "product-observable-change",
    requirementId: autoScrollAcceptance.id,
    target: heroGalleryTargets.autoScrollEnabled,
  });

  await setAutoScrollEnabled(page, false);
  await expect(gallery).toHaveAttribute(
    "data-hero-gallery-auto-scroll",
    "0.0000:0.0000",
  );
  await page.waitForTimeout(1_600);
  await expect(gallery).toHaveAttribute(
    "data-hero-gallery-auto-scroll",
    "0.0000:0.0000",
  );
});

test(autoScrollIntervalAcceptance.browserTestName, async ({ page }) => {
  await page.goto("/");
  await waitForWebsitePreview(page);
  const gallery = getAutoScrollGallery(page);
  const before = await requestHeroGallerySnapshot(page);
  const requirementId = await proveAutoScrollSliderApplicability(
    page,
    autoScrollIntervalAcceptance.id,
    heroGalleryTargets.autoScrollInterval,
  );
  const interval = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollInterval,
  );
  await enterSliderValue(interval, "0.5");
  await page.waitForTimeout(1_100);

  await expect(gallery).not.toHaveAttribute(
    "data-hero-gallery-auto-scroll",
    "0.0000:0.0000",
  );
  expect(
    await meanSnapshotDelta(page, before, await requestHeroGallerySnapshot(page)),
  ).toBeGreaterThan(0.5);
  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "product-observable-change",
    requirementId,
    target: heroGalleryTargets.autoScrollInterval,
  });
});

test(autoScrollDurationAcceptance.browserTestName, async ({ page }) => {
  await page.goto("/");
  await waitForWebsitePreview(page);
  const gallery = getAutoScrollGallery(page);
  const requirementId = await proveAutoScrollSliderApplicability(
    page,
    autoScrollDurationAcceptance.id,
    heroGalleryTargets.autoScrollDuration,
  );
  const interval = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollInterval,
  );
  const duration = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollDuration,
  );
  await enterSliderValue(interval, "0.5");
  await enterSliderValue(duration, "2");
  await page.waitForTimeout(750);
  const firstOffset = await gallery.getAttribute("data-hero-gallery-auto-scroll");
  await page.waitForTimeout(300);
  const secondOffset = await gallery.getAttribute("data-hero-gallery-auto-scroll");

  expect(firstOffset).not.toBe("0.0000:0.0000");
  expect(secondOffset).not.toBe(firstOffset);
  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "product-observable-change",
    requirementId,
    target: heroGalleryTargets.autoScrollDuration,
  });
});

test("browser: auto scroll stays idle with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await waitForWebsitePreview(page);
  const gallery = getAutoScrollGallery(page);
  await setAutoScrollEnabled(page, true);
  const interval = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollInterval,
  );
  const duration = await getToolcraftControlFieldByTarget(
    page,
    heroGalleryTargets.autoScrollDuration,
  );
  await enterSliderValue(interval, "0.5");
  await enterSliderValue(duration, "0.15");
  await page.waitForTimeout(1_200);

  await expect(gallery).toHaveAttribute(
    "data-hero-gallery-auto-scroll",
    "0.0000:0.0000",
  );
});
