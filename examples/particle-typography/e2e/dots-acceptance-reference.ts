import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { DOTS_DEFAULT_CYCLE_SECONDS } from "../src/app/dots/dots-timing";
import { readToolcraftBrowserObservation } from "./browser-proof-session";
import {
  expectToolcraftPersistenceState,
  expectToolcraftViewportSideEffect,
} from "./browser-state-evidence-helpers";
import {
  expectToolcraftTimelineDuration,
  expectToolcraftTimelineLoop,
  expectToolcraftTimelinePauseResume,
  expectToolcraftTimelineRenderedFrame,
  expectToolcraftTimelineScrub,
} from "./browser-timeline-evidence-helpers";
import {
  canvasHash,
  ensureTimelineVisible,
  outputSelector,
  pausePlayback,
  selectFiniteCanvas,
  setSlider,
  setTimelineFraction,
  timelineFrame,
  type ProductPage,
  type ProofSession,
} from "./dots-acceptance-support";
import { expect } from "./toolcraft-product-test";

export async function proveDotsReferenceTimelineAndPersistence(
  page: ProductPage,
  session: ProofSession,
): Promise<void> {
  const output = page.locator(outputSelector);
  const canvas = page.locator('canvas[aria-label="Particle text formation"]');
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(page.locator("[data-toolcraft-canvas-mode]")).toHaveAttribute(
    "data-toolcraft-canvas-mode",
    "infinite",
  );
  await selectFiniteCanvas(page);
  await pausePlayback(page);
  await ensureTimelineVisible(page);
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const restoredDuration = page.getByRole("textbox", { name: "timeline duration" });
  await restoredDuration.fill(String(DOTS_DEFAULT_CYCLE_SECONDS));
  await restoredDuration.press("Enter");
  await page.getByRole("slider", { name: "Playback position" }).press("Home");
  await expect(output).toHaveAttribute("data-timeline-progress", "0.00000");
  const ringStats = await canvas.evaluate((node) => {
    const source = node as HTMLCanvasElement;
    const context = source.getContext("2d", { willReadFrequently: true });
    if (!context) return { coloredPixels: 0, centerPixels: 0 };
    const pixels = context.getImageData(0, 0, source.width, source.height).data;
    let coloredPixels = 0;
    let centerPixels = 0;
    for (let y = 0; y < source.height; y += 8) {
      for (let x = 0; x < source.width; x += 8) {
        const index = (y * source.width + x) * 4;
        const backgroundDistance =
          Math.abs((pixels[index] ?? 0) - 207) +
          Math.abs((pixels[index + 1] ?? 0) - 188) +
          Math.abs((pixels[index + 2] ?? 0) - 176);
        if (backgroundDistance <= 24) continue;
        coloredPixels += 1;
        if (x > source.width * 0.35 && x < source.width * 0.65 && y > source.height * 0.35 && y < source.height * 0.65) centerPixels += 1;
      }
    }
    return { coloredPixels, centerPixels };
  });
  await expectToolcraftReferenceParity(
    async () => ({
      centerIsSparse: ringStats.centerPixels < ringStats.coloredPixels * 0.12,
      launch: await output.getAttribute("data-dot-launch"),
      ringIsVisible: ringStats.coloredPixels > 300,
    }),
    { centerIsSparse: true, launch: "ring", ringIsVisible: true },
    { requirementId: "reference.renderer-state" },
  );
  await expectToolcraftReferenceParity(
    async () => ({
      count: Number(await output.getAttribute("data-dot-count")),
      distribution: await output.getAttribute("data-dot-distribution"),
      paletteStops: JSON.parse((await output.getAttribute("data-dot-gradient")) ?? '{"stops":[]}').stops.length,
      text: await output.getAttribute("data-dot-text"),
    }),
    { count: 1800, distribution: "outline", paletteStops: 11, text: "Hi!" },
    { requirementId: "reference.control-mapping" },
  );
  await expectToolcraftReferenceParity(
    async () => ({
      backingHeight: await canvas.getAttribute("height"),
      backingWidth: await canvas.getAttribute("width"),
      height: Number(await output.getAttribute("data-canvas-height")),
      width: Number(await output.getAttribute("data-canvas-width")),
    }),
    { backingHeight: "2700", backingWidth: "2160", height: 1350, width: 1080 },
    { requirementId: "reference.canvas-sizing" },
  );
  await expectToolcraftReferenceParity(
    async () => ({ duration: Number(await output.getAttribute("data-timeline-duration")), reverse: false }),
    { duration: DOTS_DEFAULT_CYCLE_SECONDS, reverse: false },
    { requirementId: "runtime.timeline.playback" },
  );

  await setTimelineFraction(page, 0.62);
  const settledReferenceFrame = await timelineFrame(page);
  await page.getByRole("slider", { name: "Playback position" }).press("Home");
  const referenceFrameObservation = session.observe(async (root) => {
    const node = root.querySelector<HTMLElement>('[data-dots-renderer="true"]');
    const frame = root.querySelector<HTMLCanvasElement>('canvas[aria-label="Particle text formation"]');
    const sample = document.createElement("canvas");
    sample.width = 64;
    sample.height = 64;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (context && frame) context.drawImage(frame, 0, 0, 64, 64);
    const bytes = context?.getImageData(0, 0, 64, 64).data ?? new Uint8ClampedArray();
    let hash = 2166136261;
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
    return {
      currentTimeSeconds: Number(node?.dataset.timelineDuration ?? 0) * Number(node?.dataset.timelineProgress ?? 0),
      outputSignature: hash.toString(16),
    };
  });
  const expectedReferenceFrame = {
    currentTimeSeconds: settledReferenceFrame.currentTimeSeconds,
    outputSignature: await (async () => {
      await setTimelineFraction(page, 0.62);
      const value = await readToolcraftBrowserObservation(referenceFrameObservation);
      await page.getByRole("slider", { name: "Playback position" }).press("Home");
      return value.outputSignature;
    })(),
  };
  await expectToolcraftTimelineRenderedFrame(
    referenceFrameObservation,
    session.action((currentPage) => setTimelineFraction(currentPage, 0.62)),
    expectedReferenceFrame,
    { requirementId: "reference.renderer-state", stabilityIntervalMs: 60 },
  );

  const canvasReferenceObservation = session.observe((root) => {
    const node = root.querySelector<HTMLElement>('[data-dots-renderer="true"]');
    return { currentTimeSeconds: Number(node?.dataset.canvasWidth ?? 0), outputSignature: node?.dataset.dotsFrameSignature ?? "" };
  });
  const referenceCanvasExpected = await (async () => {
    const width = page.locator('[data-toolcraft-control-target="canvas.size.width"] input');
    await width.fill("1000");
    await width.press("Enter");
    const value = await readToolcraftBrowserObservation(canvasReferenceObservation);
    await width.fill("1080");
    await width.press("Enter");
    return value;
  })();
  await expectToolcraftTimelineRenderedFrame(
    canvasReferenceObservation,
    session.controlAction("canvas.size.width", async (control) => {
      const width = control.locator("input");
      await width.fill("1000");
      await width.press("Enter");
    }),
    referenceCanvasExpected,
    { requirementId: "reference.canvas-sizing", stabilityIntervalMs: 60 },
  );

  const mappingObservation = session.observe((root) => {
    const node = root.querySelector<HTMLElement>('[data-dots-renderer="true"]');
    return { currentTimeSeconds: Number(node?.dataset.timelineProgress ?? 0), outputSignature: node?.dataset.dotsFrameSignature ?? "" };
  });
  const mappingExpected = await (async () => {
    const launch = page.locator('[data-toolcraft-control-target="particles.launch"]');
    await launch.getByRole("button", { name: "Grid", exact: true }).click();
    const value = await readToolcraftBrowserObservation(mappingObservation);
    await launch.getByRole("button", { name: "Ring", exact: true }).click();
    return value;
  })();
  await expectToolcraftTimelineRenderedFrame(
    mappingObservation,
    session.controlAction("particles.launch", (control) => control.getByRole("button", { name: "Grid", exact: true }).click()),
    mappingExpected,
    { requirementId: "reference.control-mapping", stabilityIntervalMs: 60 },
  );

  await page.getByRole("slider", { name: "Playback position" }).press("Home");
  const scrubObservation = session.observe(async (root) => {
    const node = root.querySelector<HTMLElement>('[data-dots-renderer="true"]');
    const frame = root.querySelector<HTMLCanvasElement>('canvas[aria-label="Particle text formation"]');
    const sample = document.createElement("canvas");
    sample.width = 64;
    sample.height = 64;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (context && frame) context.drawImage(frame, 0, 0, 64, 64);
    const bytes = context?.getImageData(0, 0, 64, 64).data ?? new Uint8ClampedArray();
    let hash = 2166136261;
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
    return {
      currentTimeSeconds: Number(node?.dataset.timelineDuration ?? 0) * Number(node?.dataset.timelineProgress ?? 0),
      outputSignature: hash.toString(16),
    };
  });
  await setTimelineFraction(page, 0.5);
  const scrubExpected = await readToolcraftBrowserObservation(scrubObservation);
  await page.getByRole("slider", { name: "Playback position" }).press("Home");
  await expectToolcraftTimelineScrub(
    scrubObservation,
    session.action((currentPage) => setTimelineFraction(currentPage, 0.5)),
    scrubExpected,
    { requirementId: "runtime.timeline.playback", stabilityIntervalMs: 60 },
  );
  await page.getByRole("slider", { name: "Playback position" }).press("Home");
  await expectToolcraftTimelineRenderedFrame(
    scrubObservation,
    session.action((currentPage) => setTimelineFraction(currentPage, 0.5)),
    scrubExpected,
    { requirementId: "runtime.timeline.playback", stabilityIntervalMs: 60 },
  );

  const collectCycle = async (durationSeconds: number) => {
    const slider = page.getByRole("slider", { name: "Playback position" });
    await slider.press("Home");
    const seamStartSignature = await canvasHash(page);
    const normalizedPhases = [Number(await output.getAttribute("data-timeline-progress"))];
    for (const phase of [0.2, 0.4, 0.6, 0.8]) {
      await setTimelineFraction(page, phase);
      normalizedPhases.push(Number(await output.getAttribute("data-timeline-progress")));
    }
    await slider.press("End");
    normalizedPhases.push(Number(await output.getAttribute("data-timeline-progress")));
    return {
      durationSeconds,
      normalizedPhases,
      seamEndSignature: await canvasHash(page),
      seamStartSignature,
    };
  };
  const initialCycle = await collectCycle(DOTS_DEFAULT_CYCLE_SECONDS);
  const durationObservation = session.observe((root) => {
    const duration = Number(root.querySelector<HTMLElement>('[data-dots-renderer="true"]')?.dataset.timelineDuration ?? 0);
    return { renderedCycleDurationSeconds: duration, timelineDurationSeconds: duration };
  });
  await expectToolcraftTimelineDuration(
    durationObservation,
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Edit timeline duration" }).click();
      const editor = currentPage.getByRole("textbox", { name: "timeline duration" });
      await editor.fill("6");
      await editor.press("Enter");
    }),
    6,
    { requirementId: "runtime.timeline.playback", stabilityIntervalMs: 60 },
  );
  const resizedCycle = await collectCycle(6);
  await page.evaluate((proof) => {
    (window as Window & { __dotsLoopProof?: typeof proof }).__dotsLoopProof = proof;
  }, { initial: initialCycle, resized: resizedCycle });
  const loopObservation = session.observe(() =>
    (window as Window & { __dotsLoopProof: { initial: typeof initialCycle; resized: typeof resizedCycle } }).__dotsLoopProof,
  );
  await expectToolcraftTimelineLoop(loopObservation, { requirementId: "runtime.timeline.playback" });

  await page.getByRole("button", { name: "Play playback" }).click();
  const playbackObservation = session.observe((root) => {
    const node = root.querySelector<HTMLElement>('[data-dots-renderer="true"]');
    return {
      currentTimeSeconds: Number(node?.dataset.timelineDuration ?? 0) * Number(node?.dataset.timelineProgress ?? 0),
      outputSignature: node?.dataset.dotsFrameSignature ?? "",
      playing: node?.dataset.timelinePlaying === "true",
    };
  });
  await expectToolcraftTimelinePauseResume(
    playbackObservation,
    session.action((currentPage) => currentPage.getByRole("button", { name: "Pause playback" }).click()),
    session.action((currentPage) => currentPage.getByRole("button", { name: "Play playback" }).click()),
    { requirementId: "runtime.timeline.playback", pauseWindowMs: 120, stabilityIntervalMs: 40 },
  );
  await pausePlayback(page);

  const persistence = session.observe((root) => {
    const node = root.querySelector<HTMLElement>('[data-dots-renderer="true"]');
    return {
      count: Number(node?.dataset.dotCount ?? 0),
      duration: Number(node?.dataset.timelineDuration ?? 0),
      height: Number(node?.dataset.canvasHeight ?? 0),
      text: node?.dataset.dotText ?? "",
      width: Number(node?.dataset.canvasWidth ?? 0),
    };
  });
  const persisted = { count: 960, duration: 8, height: 1000, text: "SAVE", width: 800 };
  await expectToolcraftPersistenceState(
    persistence,
    session.action(async (currentPage) => {
      await currentPage.locator('[data-toolcraft-control-target="text.content"] input').fill(persisted.text);
      await setSlider(currentPage.locator('[data-toolcraft-control-target="particles.count"]'), persisted.count);
      for (const [target, value] of [["canvas.size.width", persisted.width], ["canvas.size.height", persisted.height]] as const) {
        const input = currentPage.locator(`[data-toolcraft-control-target="${target}"] input`);
        await input.fill(String(value));
        await input.press("Enter");
      }
      await currentPage.getByRole("button", { name: "Edit timeline duration" }).click();
      const editor = currentPage.getByRole("textbox", { name: "timeline duration" });
      await editor.fill(String(persisted.duration));
      await editor.press("Enter");
    }),
    session.reload(),
    persisted,
    { requirementId: "runtime.persistence.reload", stabilityIntervalMs: 100, timeoutMs: 30_000 },
  );

  const viewport = session.observe((root) => {
    const world = root.querySelector<HTMLElement>("[data-toolcraft-canvas-world]");
    const node = root.querySelector<HTMLElement>('[data-dots-renderer="true"]');
    return {
      offsetX: Number(world?.dataset.toolcraftCanvasOffsetX ?? 0),
      offsetY: Number(world?.dataset.toolcraftCanvasOffsetY ?? 0),
      outputHeight: Number(node?.dataset.canvasHeight ?? 0),
      outputWidth: Number(node?.dataset.canvasWidth ?? 0),
      zoom: Number(world?.dataset.toolcraftCanvasZoom ?? 1),
    };
  });
  await page.getByRole("button", { name: "Zoom in" }).click();
  const zoomed = await readToolcraftBrowserObservation(viewport);
  await page.getByRole("button", { name: "Zoom out" }).click();
  await expectToolcraftViewportSideEffect(
    viewport,
    session.action((currentPage) => currentPage.getByRole("button", { name: "Zoom in" }).click()),
    zoomed,
    { requirementId: "runtime.canvas.viewport", stabilityIntervalMs: 80 },
  );

  const playingBeforeDrag = await output.getAttribute("data-timeline-playing");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.5 + 54, box!.y + box!.height * 0.5 - 36, { steps: 8 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Center canvas" }).click();
  await expect(output).toHaveAttribute("data-timeline-playing", playingBeforeDrag ?? "false");
}
