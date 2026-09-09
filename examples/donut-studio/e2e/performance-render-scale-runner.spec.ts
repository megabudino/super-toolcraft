import { expect, test, type Page, type TestInfo } from "@playwright/test";
import {
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import { appSchema } from "../src/app/app-schema";
import { attachedEvidenceTypes } from "./browser-semantic-evidence-test-helpers";
import {
  compileToolcraftPerformancePathAdapterMatrix,
  runToolcraftPerformancePath,
} from "./performance-path-helpers";
import {
  TOOLCRAFT_PERFORMANCE_FIXTURE_RESOLUTION_MODE_ENV,
  TOOLCRAFT_PERFORMANCE_REQUEST_AUTHORITY_HASH_ENV,
} from "./performance-fixture-selection";

const canvasSelector = "[data-render-scale-canvas]";

type RenderScalePipelinePasses = {
  composite: ToolcraftRendererPipelinePassContract<void>;
};

const renderScaleRegistration =
  registerToolcraftRendererPipeline<RenderScalePipelinePasses>()({
    interactionInvalidation: [
      {
        interaction: "control-change",
        invalidates: ["composite"],
        mustNotInvalidate: [],
        targets: ["canvas.renderScale"],
      },
    ],
    passes: [
      {
        cost: {
          dimensions: [],
          frequency: "interaction",
          relationship: "constant",
        },
        id: "composite",
        inputs: ["canvas.renderScale"],
        invalidatedBy: ["canvas.renderScale"],
        kind: "composite",
        output: "preview",
        quality: "full",
        runsOn: "main",
      },
    ],
    runtimeId: "render-scale-runner-test-v1",
  });

const renderScalePerformance = defineToolcraftPerformance({
  fixtureAdapters: { dimensions: {} },
  rendererPipeline: renderScaleRegistration,
  rendererStrategy: "webgl",
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: { dimensions: [] },
});

const [renderScalePath] = deriveToolcraftPerformancePaths(
  appSchema,
  renderScalePerformance,
);

async function setBackingScale(
  page: Page,
  backingScale: number,
): Promise<void> {
  await page.locator(canvasSelector).evaluate((element, scale) => {
    if (!(element instanceof HTMLCanvasElement)) {
      throw new Error("Fixture must target a canvas.");
    }
    const rect = element.getBoundingClientRect();
    element.width = Math.round(rect.width * window.devicePixelRatio * scale);
    element.height = Math.round(rect.height * window.devicePixelRatio * scale);
  }, backingScale);
}

async function installFixture(page: Page): Promise<void> {
  await page.setContent(`
    <canvas
      data-render-scale-canvas
      style="display:block;width:120px;height:80px"
    ></canvas>
    <output
      hidden
      data-toolcraft-pipeline-evidence="${renderScaleRegistration.runtimeId}"
    ></output>
  `);
  await setBackingScale(page, 2);
  await page.evaluate((runtimeId) => {
    const counters = {
      activeResources: 0,
      cacheHits: 0,
      cacheMisses: 0,
      durationMax: 0,
      durationTotal: 0,
      executions: 0,
      resourceCreations: 0,
      resourceDisposals: 0,
      transfers: 0,
    };
    const state = {
      outcome: 0,
      snapshot: {
        disposed: false,
        passes: { composite: counters },
        runtimeId,
      },
    };
    Reflect.set(globalThis, "__renderScaleRunnerTestState", state);
    Object.defineProperty(
      document.querySelector("[data-toolcraft-pipeline-evidence]"),
      Symbol.for("toolcraft.renderer-pipeline-evidence.snapshot"),
      { value: () => state.snapshot },
    );
  }, renderScaleRegistration.runtimeId);
}

function compileRunner(
  backingScaleAfterAction: number,
  prepare: () => Promise<void> = async () => undefined,
) {
  return compileToolcraftPerformancePathAdapterMatrix(
    [renderScalePath!],
    [
      {
        action: async ({ page }) => {
          await page.evaluate(({ scale, selector }) => {
            const state = Reflect.get(
              globalThis,
              "__renderScaleRunnerTestState",
            ) as {
              outcome: number;
              snapshot: {
                passes: {
                  composite: {
                    cacheMisses: number;
                    durationMax: number;
                    durationTotal: number;
                    executions: number;
                  };
                };
              };
            };
            state.outcome += 1;
            const pass = state.snapshot.passes.composite;
            pass.cacheMisses += 1;
            pass.durationMax = 1;
            pass.durationTotal += 1;
            pass.executions += 1;
            const canvas = document.querySelector(selector);
            if (!(canvas instanceof HTMLCanvasElement)) {
              throw new Error("Render-scale runner fixture lost its canvas.");
            }
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.round(
              rect.width * window.devicePixelRatio * scale,
            );
            canvas.height = Math.round(
              rect.height * window.devicePixelRatio * scale,
            );
          }, { scale: backingScaleAfterAction, selector: canvasSelector });
        },
        observeOutcome: ({ page }) =>
          page.evaluate(
            () =>
              (
                Reflect.get(
                  globalThis,
                  "__renderScaleRunnerTestState",
                ) as { outcome: number }
              ).outcome,
          ),
        pathId: renderScalePath!.id,
        prepare,
        renderScaleBacking: {
          canvasSelector,
          selectedScale: 2,
        },
      },
    ],
  )[0]!;
}

test("requestless performance runner rejects before adapter operations", async ({
  page,
}) => {
  const previousMode =
    process.env[TOOLCRAFT_PERFORMANCE_FIXTURE_RESOLUTION_MODE_ENV];
  const previousAuthority =
    process.env[TOOLCRAFT_PERFORMANCE_REQUEST_AUTHORITY_HASH_ENV];
  delete process.env[TOOLCRAFT_PERFORMANCE_FIXTURE_RESOLUTION_MODE_ENV];
  delete process.env[TOOLCRAFT_PERFORMANCE_REQUEST_AUTHORITY_HASH_ENV];
  let prepareCount = 0;

  try {
    await expect(
      runToolcraftPerformancePath(
        page,
        appSchema,
        renderScalePerformance,
        compileRunner(2, async () => {
          prepareCount += 1;
        }),
      ),
    ).rejects.toThrow(/must be strict-development or full-certification/iu);
    expect(prepareCount).toBe(0);
  } finally {
    if (previousMode === undefined) {
      delete process.env[TOOLCRAFT_PERFORMANCE_FIXTURE_RESOLUTION_MODE_ENV];
    } else {
      process.env[TOOLCRAFT_PERFORMANCE_FIXTURE_RESOLUTION_MODE_ENV] =
        previousMode;
    }
    if (previousAuthority === undefined) {
      delete process.env[TOOLCRAFT_PERFORMANCE_REQUEST_AUTHORITY_HASH_ENV];
    } else {
      process.env[TOOLCRAFT_PERFORMANCE_REQUEST_AUTHORITY_HASH_ENV] =
        previousAuthority;
    }
  }
});

test("browser perf: runner proves real render-scale backing", async ({
  page,
}, testInfo: TestInfo) => {
  await installFixture(page);
  const attachmentCount = testInfo.attachments.length;

  await runToolcraftPerformancePath(
    page,
    appSchema,
    renderScalePerformance,
    compileRunner(2),
  );

  expect(
    attachedEvidenceTypes(testInfo, attachmentCount).filter(
      (type) => type === "performance-render-scale",
    ),
  ).toHaveLength(3);
});

test("browser perf: runner rejects a render-scale quality clamp", async ({
  page,
}, testInfo: TestInfo) => {
  await installFixture(page);
  const attachmentCount = testInfo.attachments.length;

  await expect(
    runToolcraftPerformancePath(
      page,
      appSchema,
      renderScalePerformance,
      compileRunner(1),
    ),
  ).rejects.toThrow(/backing width.*Resolution scale 2/iu);
  expect(attachedEvidenceTypes(testInfo, attachmentCount)).not.toContain(
    "performance-render-scale",
  );
});
