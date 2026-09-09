import { expectToolcraftAcceptanceOutcome } from "./browser-acceptance-outcome-helpers";
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
  disableGrassScanLayers,
  pauseGrassPlayback,
  prepareGrassSession,
  readGrassCanvasSignature,
  readGrassTimelineTime,
  setGrassTimelineDuration,
  setGrassTimelinePosition,
} from "./grass-test-helpers";
import {
  expect,
  test,
  type ToolcraftProductTestFixtures,
} from "./toolcraft-product-test";

type Page = ToolcraftProductTestFixtures["page"];

async function setGrassSliderExact(
  page: Page,
  target: string,
  value: number,
): Promise<void> {
  const control = page.locator(`[data-toolcraft-control-target="${target}"]`);
  await control.getByRole("button", { name: /^Edit .+ value$/u }).click();
  const input = control.getByRole("textbox");
  await input.fill(String(value));
  await input.press("Enter");
}

async function readGrassTimelineFrame(page: Page) {
  return {
    currentTimeSeconds: await readGrassTimelineTime(page),
    outputSignature: await readGrassCanvasSignature(page),
  };
}

async function collectGrassLoopCycle(
  page: Page,
  durationSeconds: number,
): Promise<ToolcraftTimelineLoopCycleProof> {
  await pauseGrassPlayback(page);
  const enableLoop = page.getByRole("button", { name: "Enable loop" });
  if ((await enableLoop.count()) > 0) await enableLoop.click();
  await setGrassTimelinePosition(page, 0.01);
  await page.waitForTimeout(50);
  const seamStartSignature = await readGrassCanvasSignature(page);
  const initialPhase = Math.min(
    0.9999,
    Math.max(0, (await readGrassTimelineTime(page)) / durationSeconds),
  );
  await page.getByRole("button", { name: "Play playback" }).click();
  const phases = await page.evaluate(
    async ({ duration, initial }) => {
      const samples = [initial];
      const startedAt = performance.now();
      while (performance.now() - startedAt < duration * 2_000 + 3_000) {
        await new Promise((resolve) => window.setTimeout(resolve, 30));
        const text =
          document.querySelector('[data-slot="timeline-panel"]')?.textContent ??
          "";
        const current = Number(
          text.match(/([0-9]+(?:\.[0-9]+)?)\s*\//)?.[1] ?? 0,
        );
        const phase = Math.min(0.9999, Math.max(0, current / duration));
        const previous = samples.at(-1) ?? 0;
        if (phase < previous - 0.3 && phase <= 0.25) {
          samples.push(phase);
          return samples;
        }
        if (phase > previous + 0.025) samples.push(phase);
      }
      return samples;
    },
    { duration: durationSeconds, initial: initialPhase },
  );
  await pauseGrassPlayback(page);
  await setGrassTimelinePosition(page, 0.01);
  await page.waitForTimeout(50);
  expect(phases.length).toBeGreaterThanOrEqual(5);
  const seamEndSignature = await readGrassCanvasSignature(page);
  return {
    durationSeconds,
    normalizedPhases: phases,
    seamEndSignature,
    seamStartSignature,
  };
}

test.skip("grass timeline drives the seamless forward wind loop", async ({
  page,
}) => {
  test.setTimeout(300_000);
  const session = await prepareGrassSession(page);
  await disableGrassScanLayers(page);
  await page
    .locator('[data-toolcraft-control-target="wind.mode"]')
    .getByRole("button", { name: "Wind", exact: true })
    .click();
  await setGrassSliderExact(page, "preview.bladeCount", 300);
  await setGrassSliderExact(page, "preview.lawnBladeCount", 1_000);
  await pauseGrassPlayback(page);

  const durationObservation = session.observe((root) => {
    const text = root
      .querySelector<HTMLElement>('[aria-label="Edit timeline duration"]')
      ?.textContent?.trim();
    const duration = Number(text?.replace("s", ""));
    return {
      renderedCycleDurationSeconds: duration,
      timelineDurationSeconds: duration,
    };
  });
  await expectToolcraftTimelineDuration(
    durationObservation,
    session.action((currentPage) => setGrassTimelineDuration(currentPage, 3)),
    3,
    { requirementId: "grass.timeline", stabilityIntervalMs: 25 },
  );

  await setGrassTimelinePosition(page, 0.8);
  await expectToolcraftAcceptanceOutcome(
    () => page.locator('[data-slot="timeline-panel"]').textContent(),
    () => setGrassTimelinePosition(page, 0.1),
    {
      evidenceType: "command-side-effect",
      requirementId: "grass.timeline",
      stabilityIntervalMs: 20,
    },
  );

  await setGrassTimelinePosition(page, 0.5);
  await page.waitForTimeout(40);
  const expectedMid = await readGrassTimelineFrame(page);
  await setGrassTimelinePosition(page, 0.1);
  const scrubObservation = session.observe((root) => {
    const text =
      root.querySelector('[data-slot="timeline-panel"]')?.textContent ?? "";
    const current = Number(text.match(/([0-9]+(?:\.[0-9]+)?)\s*\//u)?.[1] ?? 0);
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return {
      currentTimeSeconds: current,
      outputSignature: canvas?.dataset.grassFrameSignature ?? "missing",
    };
  });
  await expectToolcraftTimelineScrub(
    scrubObservation,
    session.action((currentPage) => setGrassTimelinePosition(currentPage, 0.5)),
    expectedMid,
    {
      requirementId: "grass.timeline",
      stabilityIntervalMs: 25,
      timeoutMs: 10_000,
    },
  );

  await setGrassTimelinePosition(page, 0.9);
  await page.waitForTimeout(40);
  const expectedLate = await readGrassTimelineFrame(page);
  await setGrassTimelinePosition(page, 0.5);
  await expectToolcraftTimelineRenderedFrame(
    scrubObservation,
    session.action((currentPage) => setGrassTimelinePosition(currentPage, 0.9)),
    expectedLate,
    {
      requirementId: "grass.timeline",
      stabilityIntervalMs: 25,
      timeoutMs: 10_000,
    },
  );

  await setGrassTimelinePosition(page, 0.2);
  await page.getByRole("button", { name: "Play playback" }).click();
  const playbackObservation = session.observe((root) => {
    const text =
      root.querySelector('[data-slot="timeline-panel"]')?.textContent ?? "";
    const current = Number(text.match(/([0-9]+(?:\.[0-9]+)?)\s*\//u)?.[1] ?? 0);
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return {
      currentTimeSeconds: current,
      outputSignature: canvas?.dataset.grassFrameSignature ?? "missing",
      playing: Boolean(root.querySelector('[aria-label="Pause playback"]')),
    };
  });
  await expectToolcraftTimelinePauseResume(
    playbackObservation,
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Pause playback" }).click();
    }),
    session.action(async (currentPage) => {
      await currentPage.getByRole("button", { name: "Play playback" }).click();
    }),
    {
      pauseWindowMs: 120,
      requirementId: "grass.timeline",
      stabilityIntervalMs: 25,
      timeoutMs: 60_000,
    },
  );
  await pauseGrassPlayback(page);

  const initial = await collectGrassLoopCycle(page, 3);
  await setGrassTimelineDuration(page, 4);
  const resized = await collectGrassLoopCycle(page, 4);
  await page
    .locator('[data-slot="toolcraft-runtime-app"]')
    .evaluate(
      (root, proof) =>
        root.setAttribute("data-grass-loop-proof", JSON.stringify(proof)),
      { initial, resized },
    );
  await expectToolcraftTimelineLoop(
    session.observe((root) =>
      JSON.parse(root.getAttribute("data-grass-loop-proof") ?? "null"),
    ),
    { requirementId: "grass.timeline" },
  );
});

test("grass field state restores after reload", async ({ page }) => {
  test.setTimeout(360_000);
  const session = await prepareGrassSession(page);
  await disableGrassScanLayers(page);
  const lawnDensity = page
    .locator('[data-toolcraft-control-target="lawn.densityMax"]')
    .getByRole("slider");
  await lawnDensity.focus();
  await lawnDensity.press("Home");
  const stateObservation = session.observe((root) => {
    const sliderValue = (target: string) =>
      Number(
        root.querySelector<HTMLInputElement>(
          `[data-toolcraft-control-target="${target}"] input[type="range"]`,
        )?.value,
      );
    const zoomButton = root.querySelector('[aria-label="Zoom in"]');
    return {
      bladeThickness: sliderValue("blade.thickness"),
      fieldWidth: Number(
        root.querySelector<HTMLInputElement>(
          '[data-toolcraft-control-target="field.width"] input',
        )?.value,
      ),
      customHdri: root
        .querySelector(
          '[data-toolcraft-control-target="environment.hdriFile"] button[aria-label^="Remove "]',
        )
        ?.getAttribute("aria-label"),
      environmentSource: root.querySelector<HTMLElement>(
        '[data-slot="grass-live-preview"]',
      )?.dataset.grassEnvironmentSource,
      renderScale: sliderValue("canvas.renderScale"),
      timelineHidden:
        root.querySelector('[data-slot="timeline-panel"]') === null,
      timelineSetupHidden:
        root.querySelector(
          '[data-toolcraft-control-target="panels.timeline.extended"]',
        ) === null,
      windMode: root
        .querySelector(
          '[data-toolcraft-control-target="wind.mode"] [aria-pressed="true"]',
        )
        ?.getAttribute("aria-label"),
      windDirectionAngle: sliderValue("wind.directionAngle"),
      windFlow: sliderValue("wind.flow"),
      windSeed: sliderValue("wind.seed"),
      windStrength: sliderValue("wind.strength"),
      zoom: Number(
        zoomButton?.previousElementSibling?.textContent?.replace("%", ""),
      ),
    };
  });
  await expectToolcraftPersistenceState(
    stateObservation,
    session.controlAction("field.width", async (control, currentPage) => {
      const width = control.getByRole("textbox");
      await width.fill("20");
      await width.press("Enter");
      await currentPage
        .locator('[data-toolcraft-control-target="wind.mode"]')
        .getByRole("button", { name: "Simulate", exact: true })
        .click();
      for (const target of [
        "wind.strength",
        "blade.thickness",
        "canvas.renderScale",
      ]) {
        const slider = currentPage
          .locator(`[data-toolcraft-control-target="${target}"]`)
          .getByRole("slider");
        await slider.focus();
        await slider.press("End");
      }
      await currentPage
        .locator(
          '[data-toolcraft-control-target="environment.hdriFile"] input[type="file"]',
        )
        .setInputFiles("src/app/grass/assets/hdri/bloem_field_sunrise_1k.hdr");
      await setGrassSliderExact(currentPage, "wind.directionAngle", 180);
      await setGrassSliderExact(currentPage, "wind.flow", 100);
      await setGrassSliderExact(currentPage, "wind.seed", 128);
      await currentPage.getByRole("button", { name: "Zoom in" }).click();
    }),
    session.reload(),
    {
      bladeThickness: 0.14,
      customHdri: "Remove bloem_field_sunrise_1k.hdr",
      environmentSource: "custom",
      fieldWidth: 20,
      renderScale: 2,
      timelineHidden: true,
      timelineSetupHidden: true,
      windDirectionAngle: 180,
      windFlow: 100,
      windMode: "Simulate",
      windSeed: 128,
      windStrength: 100,
      zoom: 110,
    },
    {
      requirementId: "grass.persistence",
      stabilityIntervalMs: 60,
      timeoutMs: 30_000,
    },
  );
  await expect(
    page.locator('[data-slot="grass-live-preview"]'),
  ).toHaveAttribute("data-grass-frame-signature", /.+/u);
});
