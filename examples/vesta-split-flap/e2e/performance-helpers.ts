import { expect, type Locator, type Page } from "@playwright/test";

import type {
  CreativeAppsKitPerformanceBudget,
  CreativeAppsKitPerformanceConfig,
} from "@/creative-apps-kit/template-runtime";

export type CreativeAppsKitFrameProbeResult = {
  longTaskCount: number;
  longTaskMaxMs: number;
  maxFrameGapMs: number;
  sampleCount: number;
};

export type CreativeAppsKitInteractionResult = CreativeAppsKitFrameProbeResult & {
  durationMs: number;
};

export type CreativeAppsKitInteractionOptions = {
  settleFrames?: number;
  settleMs?: number;
};

export async function startCreativeAppsKitFrameProbe(
  page: Page,
): Promise<() => Promise<CreativeAppsKitFrameProbeResult>> {
  await page.evaluate(() => {
    const win = window as Window & {
      __creativeAppsKitFrameProbe?: {
        active: boolean;
        longTaskCount: number;
        longTaskMaxMs: number;
        observer?: PerformanceObserver;
        maxFrameGapMs: number;
        rafId: number;
        sampleCount: number;
      };
      __creativeAppsKitStopFrameProbe?: () => CreativeAppsKitFrameProbeResult;
    };

    if (win.__creativeAppsKitFrameProbe?.active) {
      cancelAnimationFrame(win.__creativeAppsKitFrameProbe.rafId);
    }

    let lastFrame = performance.now();
    win.__creativeAppsKitFrameProbe = {
      active: true,
      longTaskCount: 0,
      longTaskMaxMs: 0,
      maxFrameGapMs: 0,
      rafId: 0,
      sampleCount: 0,
    };

    try {
      win.__creativeAppsKitFrameProbe.observer = new PerformanceObserver((list) => {
        const probe = win.__creativeAppsKitFrameProbe;
        if (!probe?.active) {
          return;
        }

        for (const entry of list.getEntries()) {
          probe.longTaskCount += 1;
          probe.longTaskMaxMs = Math.max(probe.longTaskMaxMs, entry.duration);
        }
      });
      win.__creativeAppsKitFrameProbe.observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // Some browser contexts do not expose longtask entries. Frame gaps still catch jank.
    }

    const tick = (now: number) => {
      const probe = win.__creativeAppsKitFrameProbe;
      if (!probe?.active) {
        return;
      }

      probe.maxFrameGapMs = Math.max(probe.maxFrameGapMs, now - lastFrame);
      probe.sampleCount += 1;
      lastFrame = now;
      probe.rafId = requestAnimationFrame(tick);
    };

    win.__creativeAppsKitFrameProbe.rafId = requestAnimationFrame(tick);
    win.__creativeAppsKitStopFrameProbe = () => {
      const probe = win.__creativeAppsKitFrameProbe ?? {
        active: false,
        longTaskCount: 0,
        longTaskMaxMs: 0,
        maxFrameGapMs: 0,
        rafId: 0,
        sampleCount: 0,
      };

      probe.active = false;
      cancelAnimationFrame(probe.rafId);
      probe.observer?.disconnect();

      return {
        longTaskCount: probe.longTaskCount,
        longTaskMaxMs: probe.longTaskMaxMs,
        maxFrameGapMs: probe.maxFrameGapMs,
        sampleCount: probe.sampleCount,
      };
    };
  });

  return async () =>
    page.evaluate(() => {
      const win = window as Window & {
        __creativeAppsKitStopFrameProbe?: () => CreativeAppsKitFrameProbeResult;
      };

      return (
        win.__creativeAppsKitStopFrameProbe?.() ?? {
          longTaskCount: 0,
          longTaskMaxMs: 0,
          maxFrameGapMs: 0,
          sampleCount: 0,
        }
      );
    });
}

export async function measureCreativeAppsKitInteraction(
  page: Page,
  action: () => Promise<void>,
  options: CreativeAppsKitInteractionOptions = {},
): Promise<CreativeAppsKitInteractionResult> {
  const stopProbe = await startCreativeAppsKitFrameProbe(page);
  const startedAt = await page.evaluate(() => performance.now());

  await action();

  const endedAt = await page.evaluate(() => performance.now());
  await waitForCreativeAppsKitAnimationFrames(page, options.settleFrames ?? 3);

  if (options.settleMs && options.settleMs > 0) {
    await page.waitForTimeout(options.settleMs);
  }

  const frameProbe = await stopProbe();

  return {
    durationMs: endedAt - startedAt,
    longTaskCount: frameProbe.longTaskCount,
    longTaskMaxMs: frameProbe.longTaskMaxMs,
    maxFrameGapMs: frameProbe.maxFrameGapMs,
    sampleCount: frameProbe.sampleCount,
  };
}

export async function measureCreativeAppsKitAnimationFrames(
  page: Page,
  frameCount = 120,
  options: CreativeAppsKitInteractionOptions = {},
): Promise<CreativeAppsKitInteractionResult> {
  if (frameCount < 120) {
    throw new Error("Animation performance probes must sample at least 120 frames.");
  }

  const stopProbe = await startCreativeAppsKitFrameProbe(page);
  const startedAt = await page.evaluate(() => performance.now());

  await waitForCreativeAppsKitAnimationFrames(page, frameCount);

  if (options.settleFrames && options.settleFrames > 0) {
    await waitForCreativeAppsKitAnimationFrames(page, options.settleFrames);
  }

  if (options.settleMs && options.settleMs > 0) {
    await page.waitForTimeout(options.settleMs);
  }

  const endedAt = await page.evaluate(() => performance.now());
  const frameProbe = await stopProbe();

  return {
    durationMs: endedAt - startedAt,
    longTaskCount: frameProbe.longTaskCount,
    longTaskMaxMs: frameProbe.longTaskMaxMs,
    maxFrameGapMs: frameProbe.maxFrameGapMs,
    sampleCount: frameProbe.sampleCount,
  };
}

export async function waitForCreativeAppsKitAnimationFrames(page: Page, count: number): Promise<void> {
  if (count <= 0) {
    return;
  }

  await page.evaluate(
    (frameCount) =>
      new Promise<void>((resolve) => {
        let remainingFrames = frameCount;

        const tick = () => {
          remainingFrames -= 1;

          if (remainingFrames <= 0) {
            resolve();
            return;
          }

          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      }),
    count,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getCreativeAppsKitFieldByLabel(page: Page, label: string): Promise<Locator> {
  const exactLabel = new RegExp(`^${escapeRegExp(label)}$`);
  const exactField = page.locator('[data-slot="field"]').filter({
    has: page
      .locator('[data-slot="template-field-label-text"], [data-slot="field-label"]')
      .filter({ hasText: exactLabel }),
  });
  const field =
    (await exactField.count()) === 1
      ? exactField
      : page
          .locator('[data-slot="field"]')
          .filter({ hasText: new RegExp(`^${escapeRegExp(label)}`) });
  await expect(field, `Creative Apps Kit field "${label}" should be visible`).toBeVisible();
  return field;
}

export async function expectCreativeAppsKitSegmentedControlCellsPreservePadding(
  page: Page,
  label: string,
  options: {
    minHorizontalPaddingPx?: number;
  } = {},
): Promise<void> {
  const minHorizontalPaddingPx = options.minHorizontalPaddingPx ?? 6;
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  const segmentedGroup = field.locator('[data-slot="toggle-group"]').first();

  await expect(
    segmentedGroup,
    `Creative Apps Kit segmented control "${label}" should render a toggle group.`,
  ).toBeVisible();

  const issues = await segmentedGroup.evaluate(
    (group, minPadding) => {
      type LayoutIssue = {
        label: string;
        reason: string;
      };

      function getTextRect(element: Element): DOMRect | null {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            return node.textContent?.trim()
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          },
        });
        const textNodes: Text[] = [];
        let currentNode = walker.nextNode();

        while (currentNode) {
          textNodes.push(currentNode as Text);
          currentNode = walker.nextNode();
        }

        if (textNodes.length === 0) {
          return null;
        }

        const range = document.createRange();
        range.setStartBefore(textNodes[0]!);
        range.setEndAfter(textNodes[textNodes.length - 1]!);

        return range.getBoundingClientRect();
      }

      const items = Array.from(
        group.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]'),
      );
      const issues: LayoutIssue[] = [];
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index]!;
        const itemRect = item.getBoundingClientRect();
        const textRect = getTextRect(item);
        const label = item.textContent?.trim() || item.getAttribute("aria-label") || `#${index + 1}`;
        const nextItem = items[index + 1];
        const computedStyle = window.getComputedStyle(item);

        if (context && label.trim()) {
          context.font = computedStyle.font;
          const measuredTextWidth = context.measureText(label).width;
          const requiredWidth = measuredTextWidth + minPadding * 2;

          if (requiredWidth > itemRect.width + 0.5) {
            issues.push({
              label,
              reason: `label requires ${requiredWidth.toFixed(2)}px including padding but cell width is ${itemRect.width.toFixed(2)}px`,
            });
          }
        }

        if (nextItem) {
          const nextRect = nextItem.getBoundingClientRect();

          if (itemRect.right > nextRect.left + 0.5) {
            issues.push({
              label,
              reason: `cell overlaps next cell by ${(itemRect.right - nextRect.left).toFixed(2)}px`,
            });
          }
        }

        if (item.scrollWidth > item.clientWidth + 1) {
          issues.push({
            label,
            reason: `cell scrollWidth ${item.scrollWidth}px exceeds clientWidth ${item.clientWidth}px`,
          });
        }

        if (!textRect) {
          continue;
        }

        const leftPadding = textRect.left - itemRect.left;
        const rightPadding = itemRect.right - textRect.right;

        if (leftPadding < minPadding) {
          issues.push({
            label,
            reason: `left text padding ${leftPadding.toFixed(2)}px is below ${minPadding}px`,
          });
        }

        if (rightPadding < minPadding) {
          issues.push({
            label,
            reason: `right text padding ${rightPadding.toFixed(2)}px is below ${minPadding}px`,
          });
        }
      }

      return issues;
    },
    minHorizontalPaddingPx,
  );

  expect(
    issues,
    `Creative Apps Kit segmented control "${label}" must preserve cell padding and avoid label collisions.`,
  ).toEqual([]);
}

export async function dragCreativeAppsKitSliderByLabel(
  page: Page,
  label: string,
  targetRatio: number,
): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  await field.scrollIntoViewIfNeeded();
  const slider = field.locator('[data-slot="slider"], [role="slider"]').first();

  await expect(slider, `Creative Apps Kit slider "${label}" should be visible`).toBeVisible();

  const box = await slider.boundingBox();
  if (!box) {
    throw new Error(`Could not measure slider "${label}".`);
  }

  const startX = box.x + box.width * 0.15;
  const endX = box.x + box.width * targetRatio;
  const y = box.y + box.height / 2;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(endX, y, { steps: 12 });
  await page.mouse.up();
}

export async function dragCreativeAppsKitCanvasViewport(
  page: Page,
  delta: { x: number; y: number } = { x: 96, y: -64 },
): Promise<void> {
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  await expect(viewport, "Creative Apps Kit canvas viewport should be visible").toBeVisible();

  const box = await viewport.boundingBox();
  if (!box) {
    throw new Error("Could not measure Creative Apps Kit canvas viewport.");
  }

  const startX = box.x + box.width * 0.5;
  const startY = box.y + box.height * 0.5;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + delta.x, startY + delta.y, { steps: 16 });
  await page.mouse.up();
}

export async function zoomCreativeAppsKitCanvasViewport(
  page: Page,
  repetitions = 2,
): Promise<void> {
  const zoomIn = page.getByRole("button", { name: "Zoom in" });
  const zoomOut = page.getByRole("button", { name: "Zoom out" });

  await expect(zoomIn, "Creative Apps Kit zoom-in control should be visible").toBeVisible();
  await expect(zoomOut, "Creative Apps Kit zoom-out control should be visible").toBeVisible();

  for (let index = 0; index < repetitions; index += 1) {
    await zoomIn.click();
    await waitForCreativeAppsKitAnimationFrames(page, 2);
  }

  for (let index = 0; index < repetitions; index += 1) {
    await zoomOut.click();
    await waitForCreativeAppsKitAnimationFrames(page, 2);
  }
}

export async function expectCreativeAppsKitDiscreteSliderDragSmoothness(
  page: Page,
  label: string,
  options: CreativeAppsKitInteractionOptions & {
    expectMarkers?: boolean;
    maxFrameGapMs?: number;
    maxInteractionMs?: number;
  } = {},
): Promise<CreativeAppsKitInteractionResult> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  const slider = field.locator('[data-slot="slider"][data-variant="discrete"]').first();

  await expect(
    slider,
    `Creative Apps Kit discrete slider "${label}" should render the discrete variant.`,
  ).toBeVisible();

  const markers = field.locator('[data-slot="slider-marker"]');
  if (options.expectMarkers === false) {
    await expect(
      markers,
      `Creative Apps Kit half-width discrete slider "${label}" should hide over-budget tick markers.`,
    ).toHaveCount(0);
  } else {
    await expect(
      markers.first(),
      `Creative Apps Kit discrete slider "${label}" should render tick markers.`,
    ).toBeVisible();
  }

  const result = await measureCreativeAppsKitInteraction(
    page,
    async () => {
      await dragCreativeAppsKitSliderByLabel(page, label, 0.85);
    },
    options,
  );

  expectCreativeAppsKitPerformanceBudget(result, {
    maxFrameGapMs: options.maxFrameGapMs ?? 80,
    maxInteractionMs: options.maxInteractionMs ?? 500,
  });

  return result;
}

export async function readCreativeAppsKitCanvasViewport(page: Page): Promise<{
  offsetX: number;
  offsetY: number;
  zoom: number;
}> {
  return page.evaluate(() => {
    const canvas = document.querySelector("[data-creative-apps-kit-editable-canvas]");
    const style = canvas ? window.getComputedStyle(canvas) : null;
    const zoomText =
      canvas?.getAttribute("data-canvas-zoom") ??
      style?.getPropertyValue("--canvas-zoom") ??
      "1";

    return {
      offsetX: Number(canvas?.getAttribute("data-canvas-offset-x") ?? 0),
      offsetY: Number(canvas?.getAttribute("data-canvas-offset-y") ?? 0),
      zoom: Number.parseFloat(zoomText) || 1,
    };
  });
}

export async function expectCreativeAppsKitCanvasViewportStable(
  page: Page,
  action: () => Promise<void>,
  options: CreativeAppsKitInteractionOptions & {
    maxOffsetDelta?: number;
    maxZoomDelta?: number;
  } = {},
): Promise<CreativeAppsKitInteractionResult> {
  const before = await readCreativeAppsKitCanvasViewport(page);
  const result = await measureCreativeAppsKitInteraction(page, action, options);
  const after = await readCreativeAppsKitCanvasViewport(page);
  const maxOffsetDelta = options.maxOffsetDelta ?? 0.5;
  const maxZoomDelta = options.maxZoomDelta ?? 0.001;

  expect(
    Math.abs(after.offsetX - before.offsetX),
    `Expected canvas offsetX to stay stable within ${maxOffsetDelta}px.`,
  ).toBeLessThanOrEqual(maxOffsetDelta);
  expect(
    Math.abs(after.offsetY - before.offsetY),
    `Expected canvas offsetY to stay stable within ${maxOffsetDelta}px.`,
  ).toBeLessThanOrEqual(maxOffsetDelta);
  expect(
    Math.abs(after.zoom - before.zoom),
    `Expected canvas zoom to stay stable within ${maxZoomDelta}.`,
  ).toBeLessThanOrEqual(maxZoomDelta);

  return result;
}

type CreativeAppsKitPerformanceBudgetResult = Partial<CreativeAppsKitInteractionResult> & {
  durationMs?: number;
  exportMs?: number;
  frameGapMs?: number;
  previewMs?: number;
  renderMs?: number;
};

export function getCreativeAppsKitPerformanceScenarioBudget(
  config: CreativeAppsKitPerformanceConfig,
  scenarioId: string,
): CreativeAppsKitPerformanceBudget {
  const scenario = config.scenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    throw new Error(`Creative Apps Kit performance scenario "${scenarioId}" was not found.`);
  }

  return scenario.budget;
}

export function getCreativeAppsKitPerformanceStressValue<TValue = unknown>(
  config: CreativeAppsKitPerformanceConfig,
  scenarioId: string,
): TValue {
  const scenario = config.scenarios.find((item) => item.id === scenarioId);

  if (!scenario) {
    throw new Error(`Creative Apps Kit performance scenario "${scenarioId}" was not found.`);
  }

  if (
    !scenario.stressFixture ||
    !Object.prototype.hasOwnProperty.call(scenario.stressFixture, "value")
  ) {
    throw new Error(
      `Creative Apps Kit performance scenario "${scenarioId}" does not declare stressFixture.value.`,
    );
  }

  return scenario.stressFixture.value as TValue;
}

export function expectCreativeAppsKitScenarioPerformanceBudget(
  result: CreativeAppsKitPerformanceBudgetResult,
  config: CreativeAppsKitPerformanceConfig,
  scenarioId: string,
): void {
  expectCreativeAppsKitPerformanceBudget(
    result,
    getCreativeAppsKitPerformanceScenarioBudget(config, scenarioId),
  );
}

export function expectCreativeAppsKitPerformanceBudget(
  result: CreativeAppsKitPerformanceBudgetResult,
  budget: CreativeAppsKitPerformanceBudget,
): void {
  if (typeof budget.maxInteractionMs === "number") {
    expect(
      result.durationMs,
      `Expected interaction duration to stay within ${budget.maxInteractionMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxInteractionMs);
  }

  if (typeof budget.maxFrameGapMs === "number") {
    expect(
      result.maxFrameGapMs ?? result.frameGapMs,
      `Expected frame gaps to stay within ${budget.maxFrameGapMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxFrameGapMs);
  }

  if (typeof budget.maxLongTaskMs === "number") {
    expect(
      result.longTaskMaxMs,
      `Expected long tasks to stay within ${budget.maxLongTaskMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxLongTaskMs);
  }

  if (typeof budget.maxExportMs === "number") {
    expect(
      result.exportMs ?? result.durationMs,
      `Expected export/copy duration to stay within ${budget.maxExportMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxExportMs);
  }

  if (typeof budget.maxPreviewMs === "number") {
    expect(
      result.previewMs ?? result.durationMs,
      `Expected preview duration to stay within ${budget.maxPreviewMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxPreviewMs);
  }

  if (typeof budget.maxRenderMs === "number") {
    expect(
      result.renderMs ?? result.durationMs,
      `Expected render duration to stay within ${budget.maxRenderMs}ms.`,
    ).toBeLessThanOrEqual(budget.maxRenderMs);
  }
}
