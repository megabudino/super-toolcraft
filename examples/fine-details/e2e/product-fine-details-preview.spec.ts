import type { Locator, Page } from "@playwright/test";

import { appAcceptance } from "../src/app/app-acceptance-data";
import { fineDetailsCarouselTargets } from "../src/app/fine-details-carousel-values";
import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  expectToolcraftInfinityCanvasModeEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  expectToolcraftSegmentedControlCellsPreservePadding,
} from "./performance-control-layout-helpers";
import { dragToolcraftSliderTargetToValue } from "./performance-slider-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const previewSelector =
  '[data-toolcraft-product-output="fine-details-external-preview"]';
const frameSelector = 'iframe[title="Recraft Fine Details website preview"]';

const heightAcceptance = appAcceptance.find(
  (entry) => entry.id === "section.height",
);
const infinityAcceptance = appAcceptance.find(
  (entry) => entry.id === "canvas.infinity",
);
const imagesModeAcceptance = appAcceptance.find(
  (entry) => entry.id === fineDetailsCarouselTargets.imagesMode,
);

if (
  !heightAcceptance?.target ||
  !imagesModeAcceptance?.target ||
  !infinityAcceptance
) {
  throw new Error(
    "Missing Fine Details height, image-mode, or Infinity canvas acceptance.",
  );
}

async function waitForPreview(page: Page) {
  await expect(page.locator(frameSelector)).toBeVisible();
  await expect(page.frameLocator(frameSelector).locator("section")).toBeVisible();
}

async function resetAndWaitForPreview(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForPreview(page);
}

async function setFineDetailsNumericControl(
  page: Page,
  target: string,
  value: number,
) {
  const control = await getToolcraftControlFieldByTarget(page, target);
  const input = control.locator('input[type="text"]').first();
  await input.fill(String(value));
  await input.press("Enter");
}

async function setFineDetailsImagesMode(
  page: Page,
  mode: "Carousel" | "Loading" | "Trail",
) {
  const control = await getToolcraftControlFieldByTarget(
    page,
    fineDetailsCarouselTargets.imagesMode,
  );
  await control.getByRole("button", { name: mode }).click();
}

async function setFineDetailsSliderToMaximum(
  page: Page,
  target: string,
  maximum: number,
) {
  const control = await getToolcraftControlFieldByTarget(page, target);
  const slider = control.getByRole("slider").first();

  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", String(maximum));
}

async function navigateWithHydratedNextRouter(
  section: Locator,
  pathname: string,
) {
  await section.evaluate((element, nextPathname) => {
    type ReactContextDependency = {
      memoizedValue?: unknown;
      next?: ReactContextDependency | null;
    };
    type ReactFiber = {
      dependencies?: { firstContext?: ReactContextDependency | null };
      return?: ReactFiber | null;
    };
    type NextRouter = {
      prefetch: (...args: unknown[]) => unknown;
      push: (href: string) => unknown;
      refresh: (...args: unknown[]) => unknown;
    };

    function isNextRouter(value: unknown): value is NextRouter {
      if (!value || typeof value !== "object") return false;
      const router = value as Partial<NextRouter>;
      return (
        typeof router.prefetch === "function" &&
        typeof router.push === "function" &&
        typeof router.refresh === "function"
      );
    }

    const fiberKey = Object.getOwnPropertyNames(element).find((key) =>
      key.startsWith("__reactFiber$"),
    );
    let fiber = fiberKey
      ? (element as unknown as Record<string, ReactFiber>)[fiberKey]
      : undefined;

    while (fiber) {
      let dependency = fiber.dependencies?.firstContext;
      while (dependency) {
        if (isNextRouter(dependency.memoizedValue)) {
          dependency.memoizedValue.push(nextPathname);
          return;
        }
        dependency = dependency.next;
      }
      fiber = fiber.return ?? undefined;
    }

    throw new Error("Could not find the hydrated Next App Router context.");
  }, pathname);
}

type LoadingCardMetrics = Readonly<{
  animationCurrentTime: number | null;
  animationDuration: string;
  animationName: string;
  animationPlayState: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
  borderRadius: number;
  borderStyles: readonly string[];
  borderWidths: readonly number[];
  boxShadow: string;
  height: number;
  keyframeStartXPercent: number | null;
  keyframeEndXPercent: number | null;
  keyframeTravelYpx: number | null;
  left: number;
  pointerEvents: string;
  right: number;
  width: number;
}>;

async function readLoadingCardMetrics(cards: Locator) {
  return cards.evaluateAll((elements): LoadingCardMetrics[] => {
    function parsePosition(position: unknown) {
      const parts = String(position ?? "")
        .trim()
        .split(/\s+/u);
      const xPercent = Number.parseFloat(parts[0] ?? "");
      const yPercent = Number.parseFloat(parts[1] ?? "");
      return {
        xPercent: Number.isFinite(xPercent) ? xPercent : null,
        yPercent: Number.isFinite(yPercent) ? yPercent : null,
      };
    }

    function readKeyframePosition(frame: ComputedKeyframe | undefined) {
      if (!frame) return parsePosition("");
      return parsePosition(
        frame.backgroundPosition ??
          `${String(frame.backgroundPositionX ?? "")} ${String(frame.backgroundPositionY ?? "")}`,
      );
    }

    return elements.map((element) => {
      const card = element as HTMLElement;
      const rect = card.getBoundingClientRect();
      const style = getComputedStyle(card);
      const animation = card.getAnimations()[0];
      const keyframes = animation?.effect?.getKeyframes() ?? [];
      const firstPosition = readKeyframePosition(keyframes[0]);
      const lastPosition = readKeyframePosition(
        keyframes[keyframes.length - 1],
      );
      const backgroundImageHeight = rect.height * 2;
      const startOffsetY =
        firstPosition.yPercent === null
          ? null
          : (firstPosition.yPercent / 100) *
            (rect.height - backgroundImageHeight);
      const endOffsetY =
        lastPosition.yPercent === null
          ? null
          : (lastPosition.yPercent / 100) *
            (rect.height - backgroundImageHeight);

      return {
        animationCurrentTime:
          typeof animation?.currentTime === "number"
            ? animation.currentTime
            : null,
        animationDuration: style.animationDuration,
        animationName: style.animationName,
        animationPlayState: style.animationPlayState,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        backgroundSize: style.backgroundSize,
        borderRadius: Number.parseFloat(style.borderTopLeftRadius),
        borderStyles: [
          style.borderTopStyle,
          style.borderRightStyle,
          style.borderBottomStyle,
          style.borderLeftStyle,
        ],
        borderWidths: [
          Number.parseFloat(style.borderTopWidth),
          Number.parseFloat(style.borderRightWidth),
          Number.parseFloat(style.borderBottomWidth),
          Number.parseFloat(style.borderLeftWidth),
        ],
        boxShadow: style.boxShadow,
        height: rect.height,
        keyframeStartXPercent: firstPosition.xPercent,
        keyframeEndXPercent: lastPosition.xPercent,
        keyframeTravelYpx:
          startOffsetY === null || endOffsetY === null
            ? null
            : endOffsetY - startOffsetY,
        left: rect.left,
        pointerEvents: style.pointerEvents,
        right: rect.right,
        width: rect.width,
      };
    });
  });
}

test("browser: Reset restores native Fine Details defaults without publication", async ({ page }) => {
  const acceptance = appAcceptance.find(entry => entry.id === "website.settings");
  if (!acceptance) throw new Error("Missing website.settings acceptance.");
  const requests: string[] = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto("/");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Apply", exact: true })).toHaveCount(0);
  const color = page.getByRole("textbox", { name: "Color hex", exact: true });
  await color.fill("#FF0000");
  await color.press("Enter");
  await expect(color).toHaveValue("#FF0000");
  const websiteAction = await getToolcraftControlFieldByTarget(page, "website.settings");
  await expectToolcraftAcceptanceOutcome(
    () => color.inputValue(),
    () => websiteAction.getByRole("button", { name: "Reset", exact: true }).click(),
    { evidenceType: "command-side-effect", requirementId: acceptance.id },
  );
  await expect(color).toHaveValue("#F2F2F2");
  const origin = new URL(page.url()).origin;
  expect(requests.filter(url => /^https?:/.test(url) && new URL(url).origin !== origin)).toEqual([]);
  expect(requests.filter(url => url.includes("/api/") || url.includes("save-settings"))).toEqual([]);
});

test(
  "browser: carousel mode replaces the trail and animates when overflowing",
  async ({ page }) => {
    await resetAndWaitForPreview(page);

    const frame = page.frameLocator(frameSelector);
    const trail = frame.locator("[data-fine-details-trail]");
    const carousel = frame.locator("[data-fine-details-carousel]");

    await expect(trail).toBeVisible();
    await setFineDetailsImagesMode(page, "Carousel");
    await expect(trail).toHaveCount(0);
    await expect(carousel).toBeVisible();

    await setFineDetailsNumericControl(page, fineDetailsCarouselTargets.count, 4);
    await setFineDetailsNumericControl(
      page,
      fineDetailsCarouselTargets.gap,
      100,
    );

    const track = carousel.locator("[data-fd-carousel-track]");
    const sequences = carousel.locator("[data-fd-carousel-sequence]");
    await expect(carousel).toHaveAttribute("data-fd-carousel-animated", "true");
    await expect(sequences).toHaveCount(2);
    await expect
      .poll(() =>
        track.evaluate((element) =>
          Number.parseFloat(
            getComputedStyle(element).getPropertyValue("--fd-carousel-shift"),
          ),
        ),
      )
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        track.evaluate((element) => getComputedStyle(element).animationPlayState),
      )
      .toBe("running");

    await setFineDetailsNumericControl(
      page,
      fineDetailsCarouselTargets.count,
      1,
    );
    const primarySequence = carousel.locator(
      '[data-fd-carousel-sequence="primary"]',
    );
    const primaryCards = primarySequence.locator("[data-fd-carousel-source]");
    await expect(primaryCards).toHaveCount(1);
    await expect(primaryCards).toHaveAttribute(
      "data-fd-carousel-source",
      "fine-details-carousel-01",
    );

    const borderControl = await getToolcraftControlFieldByTarget(
      page,
      fineDetailsCarouselTargets.borderEnabled,
    );
    const borderSwitch = borderControl.getByRole("switch");
    await borderSwitch.click();
    await expect(borderSwitch).toBeChecked();

    const shadowControl = await getToolcraftControlFieldByTarget(
      page,
      fineDetailsCarouselTargets.shadowEnabled,
    );
    const shadowSwitch = shadowControl.getByRole("switch");
    await shadowSwitch.click();
    await expect(shadowSwitch).toBeChecked();

    const primaryCardCount = await primaryCards.count();
    expect(primaryCardCount).toBeGreaterThan(0);
    for (let index = 0; index < primaryCardCount; index += 1) {
      const card = primaryCards.nth(index);
      await expect(card).toBeVisible();
      await expect
        .poll(() =>
          card.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).borderLeftWidth),
          ),
        )
        .toBeGreaterThan(0);
      await expect
        .poll(() =>
          card.evaluate((element) => getComputedStyle(element).boxShadow),
        )
        .not.toBe("none");
    }

    await expect(carousel).toHaveAttribute("data-fd-carousel-animated", "false");
    await expect(sequences).toHaveCount(1);

    await setFineDetailsImagesMode(page, "Trail");
    await expect(carousel).toHaveCount(0);
    await expect(trail).toBeVisible();
  },
);

test(heightAcceptance.browserTestName, async ({ page }) => {
  await resetAndWaitForPreview(page);

  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(
      heightAcceptance.target,
      async (control, currentPage) => {
        const input = control.locator('input[type="text"]').first();
        await input.fill("620");
        await input.press("Enter");

        await expect(currentPage.locator(previewSelector)).toHaveAttribute(
          "data-fine-details-height",
          "620",
        );
        await expect
          .poll(() =>
            currentPage
              .frameLocator(frameSelector)
              .locator("section")
              .evaluate((section) => section.getBoundingClientRect().height),
          )
          .toBe(620);
      },
    ),
    {
      requirementId: heightAcceptance.id,
      selector: previewSelector,
      stabilityIntervalMs: 50,
      stabilitySamples: 2,
      timeoutMs: 10_000,
    },
  );
});

test(infinityAcceptance.browserTestName, async ({ page }) => {
  await resetAndWaitForPreview(page);

  const before = await observeInfinityCanvas(page);
  const infinityControl = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await infinityControl.getByRole("switch").click();
  const enabled = await observeInfinityCanvas(page);

  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const viewportBox = await viewport.boundingBox();
  if (!viewportBox) {
    throw new Error("Infinity canvas proof requires visible viewport geometry.");
  }
  await page.mouse.move(
    viewportBox.x + viewportBox.width * 0.55,
    viewportBox.y + viewportBox.height * 0.55,
  );
  await page.mouse.down();
  await page.mouse.move(
    viewportBox.x + viewportBox.width * 0.55 + 64,
    viewportBox.y + viewportBox.height * 0.55 + 36,
    { steps: 4 },
  );
  await page.mouse.up();
  const afterPan = await observeInfinityCanvas(page);

  await page.reload();
  await waitForPreview(page);
  const afterReload = await observeInfinityCanvas(page);

  const restoredInfinityControl = await getToolcraftControlFieldByTarget(
    page,
    "canvas.infinity",
  );
  await restoredInfinityControl.getByRole("switch").click();
  const restored = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Undo" }).click();
  const undone = await observeInfinityCanvas(page);
  await page.getByRole("button", { name: "Redo" }).click();
  const redone = await observeInfinityCanvas(page);

  await expectToolcraftInfinityCanvasModeEvidence(
    { afterPan, afterReload, before, enabled, redone, restored, undone },
    {
      expectedFiniteSize: { height: 1080, width: 1920 },
      expectedSceneRect: { height: 1080, width: 1920, x: 0, y: 0 },
      requirementId: infinityAcceptance.id,
      target: "canvas.infinity",
    },
  );
});

test("browser: loading state shows two placeholder cards", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await resetAndWaitForPreview(page);

  const frame = page.frameLocator(frameSelector);
  const trail = frame.locator("[data-fine-details-trail]");
  const loadingState = frame.locator(
    '[data-fine-details-image-state="loading"]',
  );
  const loadingRoot = loadingState.locator("[data-fine-details-loading]");
  const loadingCards = loadingRoot.locator("[data-fine-details-loading-card]");

  await expect(trail).toBeVisible();
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Images", {
    requirementId: imagesModeAcceptance.id,
    target: imagesModeAcceptance.target,
  });

  const session = await createToolcraftBrowserProofSession(page);
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(imagesModeAcceptance.target, async (control) => {
      await control.getByRole("button", { name: "Loading" }).click();
      await expect(page.locator(previewSelector)).toHaveAttribute(
        "data-fine-details-images-mode",
        "loading",
      );
      await expect(frame.locator("[data-fine-details-loading]")).toBeVisible();
      await expect(loadingState).toBeVisible();
      await expect(loadingCards).toHaveCount(2);
    }),
    {
      requirementId: imagesModeAcceptance.id,
      selector: previewSelector,
      stabilityIntervalMs: 50,
      stabilitySamples: 2,
      timeoutMs: 10_000,
    },
  );

  await expect(page.locator(frameSelector)).toHaveCSS("pointer-events", "none");
  await expect(loadingRoot).toHaveCSS("pointer-events", "none");
  await expect(loadingCards.first()).toHaveCSS("pointer-events", "none");
  await expect(frame.locator("[data-fine-details-prompt]")).toHaveAttribute(
    "data-fine-details-prompt-drag-enabled",
    "false",
  );

  const beforeTextGap = await readLoadingCardMetrics(loadingCards);
  expect(beforeTextGap).toHaveLength(3);
  expect(beforeTextGap[0]!.width).toBeGreaterThan(0);

  await dragToolcraftSliderTargetToValue(
    page,
    fineDetailsCarouselTargets.textGap,
    80,
  );
  await expect
    .poll(async () => (await readLoadingCardMetrics(loadingCards))[0]?.width)
    .toBeLessThan(beforeTextGap[0]!.width - 20);

  await setFineDetailsSliderToMaximum(
    page,
    fineDetailsCarouselTargets.radius,
    48,
  );
  await setFineDetailsSliderToMaximum(
    page,
    fineDetailsCarouselTargets.gap,
    120,
  );
  await expect
    .poll(async () => {
      const metrics = await readLoadingCardMetrics(loadingCards);
      return {
        gap: metrics[1]!.left - metrics[0]!.right,
        radius: metrics[0]!.borderRadius,
      };
    })
    .toEqual({ gap: 120, radius: 48 });

  const metrics = await readLoadingCardMetrics(loadingCards);
  expect(metrics).toHaveLength(3);
  const first = metrics[0]!;
  for (const card of metrics) {
    expect(card.width).toBeCloseTo(card.height, 1);
    expect(card.width).toBeCloseTo(first.width, 1);
    expect(card.height).toBeCloseTo(first.height, 1);
    expect(card.boxShadow).toBe("none");
    expect(card.borderWidths).toEqual([0, 0, 0, 0]);
    expect(card.borderStyles).toEqual(["none", "none", "none", "none"]);
    expect(card.borderRadius).toBe(48);
    expect(card.pointerEvents).toBe("none");
    expect(card.animationName).not.toBe("none");
    expect(card.animationDuration).toBe("1.6s");
    expect(card.animationPlayState).toBe("running");
    expect(card.backgroundImage).toContain("linear-gradient");
    expect(card.backgroundSize).toBe("100% 200%");
    expect(card.keyframeStartXPercent).toBe(50);
    expect(card.keyframeEndXPercent).toBe(50);
    expect(card.keyframeTravelYpx).toBeGreaterThan(0);
  }
  expect(metrics[1]!.left - metrics[0]!.right).toBeCloseTo(120, 1);
  expect(metrics[2]!.left - metrics[1]!.right).toBeCloseTo(120, 1);

  const animationStartTime = first.animationCurrentTime;
  expect(animationStartTime).not.toBeNull();
  await expect
    .poll(
      async () =>
        (await readLoadingCardMetrics(loadingCards))[0]!.animationCurrentTime,
    )
    .toBeGreaterThan((animationStartTime ?? 0) + 20);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(loadingCards.first()).toHaveCSS("animation-name", "none");
  await expect(loadingCards.first()).toHaveCSS("background-image", "none");
  const reducedMotionMetrics = await readLoadingCardMetrics(loadingCards);
  expect(reducedMotionMetrics[0]!.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await setFineDetailsImagesMode(page, "Carousel");
  await expect(loadingState).toHaveCount(0);
  await expect(
    frame.locator('[data-fine-details-image-state="carousel"]'),
  ).toBeVisible();
  await expect(frame.locator("[data-fine-details-carousel]")).toBeVisible();

  await setFineDetailsImagesMode(page, "Trail");
  await expect(
    frame.locator('[data-fine-details-image-state="trail"]'),
  ).toBeVisible();
  await expect(frame.locator("[data-fine-details-carousel]")).toHaveCount(0);
  await expect(trail).toBeVisible();
});

test("browser: homepage mock restarts loading timeout and cleans up on navigation", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  const section = page.locator("[data-fine-details-section]").first();
  const submit = section.getByRole("button", { name: "Submit prompt" });
  await expect(section).toBeVisible();
  await expect(submit).toBeEnabled();
  await expect(section.locator("[data-fine-details-trail]")).toBeVisible();

  await page.clock.install();
  await submit.click();
  await expect(
    section.locator('[data-fine-details-image-state="loading"]'),
  ).toBeVisible();

  await page.clock.fastForward(2_000);
  await submit.click();
  await page.clock.fastForward(700);
  await expect(
    section.locator('[data-fine-details-image-state="loading"]'),
  ).toBeVisible();
  await expect(
    section.locator('[data-fine-details-image-state="carousel"]'),
  ).toHaveCount(0);

  await page.clock.fastForward(1_899);
  await expect(
    section.locator('[data-fine-details-image-state="loading"]'),
  ).toBeVisible();
  await page.clock.fastForward(1);
  await expect(
    section.locator('[data-fine-details-image-state="carousel"]'),
  ).toBeVisible();

  await page.evaluate(() => {
    const capturedTimerIds: number[] = [];
    const clearedTimerIds: number[] = [];
    const originalSetTimeout = window.setTimeout;
    const originalClearTimeout = window.clearTimeout;

    window.setTimeout = ((handler, timeout, ...args) => {
      const timerId = originalSetTimeout(handler, timeout, ...args);
      if (timeout === 2_600) capturedTimerIds.push(timerId);
      return timerId;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((timerId) => {
      if (typeof timerId === "number") clearedTimerIds.push(timerId);
      originalClearTimeout(timerId);
    }) as typeof window.clearTimeout;
    Object.assign(window, {
      __fineDetailsLoadingTimerProbe: {
        capturedTimerIds,
        clearedTimerIds,
        realmMarker: "fine-details-homepage-realm",
      },
    });
  });

  await submit.click();
  await expect(
    section.locator('[data-fine-details-image-state="loading"]'),
  ).toBeVisible();

  const pendingTimerId = await page.evaluate(() => {
    const probe = (
      window as typeof window & {
        __fineDetailsLoadingTimerProbe: { capturedTimerIds: number[] };
      }
    ).__fineDetailsLoadingTimerProbe;
    return probe.capturedTimerIds.at(-1);
  });
  expect(pendingTimerId).toEqual(expect.any(Number));

  await navigateWithHydratedNextRouter(section, "/toolcraft/fine-details");
  await expect(page).toHaveURL(/\/toolcraft\/fine-details$/u);
  const standalonePreview = page.locator("[data-fine-details-section]");
  await expect(
    standalonePreview.locator("[data-fine-details-trail]"),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((expectedTimerId) => {
        const probe = (
          window as typeof window & {
            __fineDetailsLoadingTimerProbe: {
              clearedTimerIds: number[];
              realmMarker: string;
            };
          }
        ).__fineDetailsLoadingTimerProbe;
        return {
          cleared: probe.clearedTimerIds.includes(expectedTimerId!),
          realmMarker: probe.realmMarker,
        };
      }, pendingTimerId),
    )
    .toEqual({
      cleared: true,
      realmMarker: "fine-details-homepage-realm",
    });
  await page.clock.fastForward(3_000);
  await expect(
    standalonePreview.locator("[data-fine-details-trail]"),
  ).toBeVisible();
  await expect(
    standalonePreview.locator("[data-fine-details-loading]"),
  ).toHaveCount(0);
  await expect(
    standalonePreview.locator("[data-fine-details-carousel]"),
  ).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
