import type { Page } from "@playwright/test";

import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
  type ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import { expectToolcraftViewportSideEffect } from "./browser-state-evidence-helpers";
import {
  expectToolcraftTimelineDuration,
  expectToolcraftTimelineLoop,
  expectToolcraftTimelinePauseResume,
  expectToolcraftTimelineRenderedFrame,
  expectToolcraftTimelineScrub,
  type ToolcraftTimelineLoopCycleProof,
} from "./browser-timeline-evidence-helpers";
import { pausePlayback } from "./dot-ring-browser-support";
import { dragToolcraftCanvasViewport } from "./performance-canvas-helpers";
import { waitForToolcraftAnimationFrames } from "./performance-interaction-measurement";
import { expect, test } from "./toolcraft-product-test";

const outputSelector = "[data-dot-ring-renderer]";

async function openProofSession(
  page: Page,
): Promise<ToolcraftBrowserProofSession> {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator(outputSelector)).toBeVisible();
  await pausePlayback(page);
  if (
    (await page.locator(outputSelector).getAttribute("data-canvas-mode")) ===
    "infinite"
  ) {
    await expect(page.locator(outputSelector)).toHaveAttribute(
      "data-scene-bounds-status",
      "settled",
    );
  }
  return session;
}

async function ensureTimeline(page: Page): Promise<void> {
  const slider = page.getByRole("slider", { name: "Playback position" });
  if ((await slider.count()) === 0) {
    await page
      .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
      .getByRole("switch")
      .click();
    await waitForToolcraftAnimationFrames(page, 20);
  }
  await expect(slider).toBeVisible();
}

async function setTimelineFraction(
  page: Page,
  fraction: number,
): Promise<void> {
  await ensureTimeline(page);
  const slider = page.getByRole("slider", { name: "Playback position" });
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await slider.click({
    position: {
      x: Math.max(1, Math.min(box!.width - 1, box!.width * fraction)),
      y: Math.max(1, box!.height / 2),
    },
  });
  await expect
    .poll(async () =>
      Number(
        await page
          .locator(outputSelector)
          .getAttribute("data-timeline-progress"),
      ),
    )
    .toBeCloseTo(fraction, 1);
}

async function editDuration(page: Page, seconds: number): Promise<void> {
  await ensureTimeline(page);
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const editor = page.getByRole("textbox", { name: "timeline duration" });
  await editor.fill(String(seconds));
  await editor.press("Enter");
}

async function collectLoopCycle(
  page: Page,
  durationSeconds: number,
): Promise<ToolcraftTimelineLoopCycleProof> {
  const slider = page.getByRole("slider", { name: "Playback position" });
  const output = page.locator(outputSelector);
  await slider.press("Home");
  await waitForToolcraftAnimationFrames(page, 2);
  const normalizedPhases = [
    Number(await output.getAttribute("data-timeline-progress")),
  ];
  const seamStartSignature =
    (await output.getAttribute("data-frame-signature")) ?? "";

  for (const phase of [0.2, 0.4, 0.6, 0.8, 0.98]) {
    await setTimelineFraction(page, phase);
    normalizedPhases.push(
      Number(await output.getAttribute("data-timeline-progress")),
    );
  }

  await slider.press("End");
  await waitForToolcraftAnimationFrames(page, 2);
  normalizedPhases.push(
    Number(await output.getAttribute("data-timeline-progress")),
  );

  return {
    durationSeconds,
    normalizedPhases,
    seamEndSignature:
      (await output.getAttribute("data-frame-signature")) ?? "",
    seamStartSignature,
  };
}

test.setTimeout(300_000);

test("browser: timeline playback controls drive rendered output", async ({
  page,
}) => {
  const session = await openProofSession(page);
  await ensureTimeline(page);
  const timelineFrame = session.observe((root) => {
    const output = root.querySelector<HTMLElement>(
      "[data-dot-ring-renderer]",
    );
    return {
      currentTimeSeconds: Number(output?.dataset.timelineTime ?? 0),
      outputSignature: output?.dataset.frameSignature ?? "",
    };
  });

  await setTimelineFraction(page, 0.5);
  const expectedFrame = await readToolcraftBrowserObservation(timelineFrame);
  await page.getByRole("slider", { name: "Playback position" }).press("Home");
  await expectToolcraftTimelineScrub(
    timelineFrame,
    session.action((currentPage) => setTimelineFraction(currentPage, 0.5)),
    expectedFrame,
    {
      requirementId: "runtime.timeline.playback",
      stabilityIntervalMs: 60,
    },
  );
  await page.getByRole("slider", { name: "Playback position" }).press("Home");
  await expectToolcraftTimelineRenderedFrame(
    timelineFrame,
    session.action((currentPage) => setTimelineFraction(currentPage, 0.5)),
    expectedFrame,
    {
      requirementId: "runtime.timeline.playback",
      stabilityIntervalMs: 60,
    },
  );

  const initialCycle = await collectLoopCycle(page, 12);
  const duration = session.observe((root) => {
    const seconds = Number(
      root.querySelector<HTMLElement>("[data-dot-ring-renderer]")?.dataset
        .timelineDuration ?? 0,
    );
    return {
      renderedCycleDurationSeconds: seconds,
      timelineDurationSeconds: seconds,
    };
  });
  await expectToolcraftTimelineDuration(
    duration,
    session.action((currentPage) => editDuration(currentPage, 6)),
    6,
    {
      requirementId: "runtime.timeline.playback",
      stabilityIntervalMs: 60,
    },
  );
  const resizedCycle = await collectLoopCycle(page, 6);
  await page.evaluate(
    (proof) => {
      (
        window as Window & {
          __dotRingLoopProof?: typeof proof;
        }
      ).__dotRingLoopProof = proof;
    },
    { initial: initialCycle, resized: resizedCycle },
  );
  const loop = session.observe(
    () =>
      (
        window as Window & {
          __dotRingLoopProof: {
            initial: ToolcraftTimelineLoopCycleProof;
            resized: ToolcraftTimelineLoopCycleProof;
          };
        }
      ).__dotRingLoopProof,
  );
  await expectToolcraftTimelineLoop(loop, {
    requirementId: "runtime.timeline.playback",
  });

  await page.getByRole("button", { name: "Play playback" }).click();
  const playback = session.observe((root) => {
    const output = root.querySelector<HTMLElement>(
      "[data-dot-ring-renderer]",
    );
    return {
      currentTimeSeconds: Number(output?.dataset.timelineTime ?? 0),
      outputSignature: output?.dataset.frameSignature ?? "",
      playing: output?.dataset.timelinePlaying === "true",
    };
  });
  await expectToolcraftTimelinePauseResume(
    playback,
    session.action((currentPage) =>
      currentPage.getByRole("button", { name: "Pause playback" }).click(),
    ),
    session.action((currentPage) =>
      currentPage.getByRole("button", { name: "Play playback" }).click(),
    ),
    {
      pauseWindowMs: 120,
      requirementId: "runtime.timeline.playback",
      stabilityIntervalMs: 40,
    },
  );
  await pausePlayback(page);
});

test("browser: viewport drag and zoom preserve product output", async ({
  page,
}) => {
  const session = await openProofSession(page);
  const viewport = session.observe((root) => {
    const world = root.querySelector<HTMLElement>(
      "[data-toolcraft-canvas-world]",
    );
    const output = root.querySelector<HTMLElement>(
      "[data-dot-ring-renderer]",
    );

    return {
      offsetX: Number(
        world?.getAttribute("data-toolcraft-canvas-offset-x") ?? 0,
      ),
      offsetY: Number(
        world?.getAttribute("data-toolcraft-canvas-offset-y") ?? 0,
      ),
      outputHeight: Number(output?.getAttribute("data-scene-height") ?? 0),
      outputWidth: Number(output?.getAttribute("data-scene-width") ?? 0),
      zoom: Number(world?.getAttribute("data-toolcraft-canvas-zoom") ?? 0),
    };
  });

  await page.getByRole("button", { name: "Zoom in" }).click();
  const zoomed = await readToolcraftBrowserObservation(viewport);
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expectToolcraftViewportSideEffect(
    viewport,
    session.action((currentPage) =>
      currentPage.getByRole("button", { name: "Zoom in" }).click(),
    ),
    zoomed,
    {
      requirementId: "runtime.canvas.viewport",
      stabilityIntervalMs: 80,
    },
  );

  const beforeDrag = await readToolcraftBrowserObservation(viewport);
  await dragToolcraftCanvasViewport(page, { x: 84, y: 52 });
  const afterDrag = await readToolcraftBrowserObservation(viewport);
  expect({
    outputHeight: afterDrag.outputHeight,
    outputWidth: afterDrag.outputWidth,
  }).toEqual({
    outputHeight: beforeDrag.outputHeight,
    outputWidth: beforeDrag.outputWidth,
  });
  expect({
    offsetX: afterDrag.offsetX,
    offsetY: afterDrag.offsetY,
  }).not.toEqual({
    offsetX: beforeDrag.offsetX,
    offsetY: beforeDrag.offsetY,
  });
});
