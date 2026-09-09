import { test } from "@playwright/test";

import {
  expectInfiniteCanvasObservation,
  expectToolcraftInfinityCanvasBackgroundEvidence,
  expectToolcraftInfinityCanvasVideoExportEvidence,
  observeInfinityCanvas,
} from "./browser-infinity-canvas-evidence";

test("toolcraft Infinity canvas observation reads runtime-owned geometry", async ({
  page,
}) => {
  await page.setContent(`
    <div data-toolcraft-canvas-world data-toolcraft-canvas-offset-x="12" data-toolcraft-canvas-offset-y="-8">
      <div data-toolcraft-canvas-mode="infinite" style="overflow: visible">
        <div data-scene style="position:absolute;left:-320px;top:-200px;width:640px;height:400px"></div>
      </div>
    </div>
  `);

  expectInfiniteCanvasObservation(
    await observeInfinityCanvas(page, "[data-scene]"),
    { height: 400, width: 640, x: -320, y: -200 },
  );
});

test("toolcraft Infinity canvas video evidence compares decoded envelopes", async () => {
  await expectToolcraftInfinityCanvasVideoExportEvidence(
    {
      finite: {
        byteLength: 1024,
        durationMs: 1000,
        height: 1350,
        width: 1080,
      },
      infinite: {
        byteLength: 768,
        durationMs: 1000,
        height: 640,
        width: 640,
      },
    },
    {
      expectedFiniteSize: { height: 1350, width: 1080 },
      expectedInfiniteSize: { height: 640, width: 640 },
      requirementId: "fixture.infinity.video",
      target: "canvas.infinity",
    },
  );
});

test("toolcraft Infinity canvas background evidence proves viewport color and dependency", async () => {
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    {
      backgroundExcluded: {
        backgroundEnabled: false,
        canvasMode: "finite",
        infinityDisabled: true,
        runtimeBackgroundColor: null,
        viewportBackgroundColor: "rgb(20, 20, 20)",
        viewportMatchesRuntimeColor: false,
      },
      backgroundRestored: {
        backgroundEnabled: true,
        canvasMode: "finite",
        infinityDisabled: false,
        runtimeBackgroundColor: null,
        viewportBackgroundColor: "rgb(20, 20, 20)",
        viewportMatchesRuntimeColor: false,
      },
      infinite: {
        backgroundEnabled: true,
        canvasMode: "infinite",
        infinityDisabled: false,
        runtimeBackgroundColor: "#D4CECA",
        viewportBackgroundColor: "rgb(212, 206, 202)",
        viewportMatchesRuntimeColor: true,
      },
    },
    {
      expectedBackgroundColor: "#D4CECA",
      requirementId: "fixture.background",
      target: "export.includeBackground",
    },
  );
});
