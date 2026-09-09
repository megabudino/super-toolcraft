import { expect, type Page } from "@playwright/test";

import { attachToolcraftBrowserRuntimeEvidence } from "./browser-runtime-evidence";

export type InfinityCanvasObservation = Readonly<{
  artboardPresent: boolean;
  canvasMode: string | null;
  finiteControlsPresent: boolean;
  overflow: string;
  sceneRect: { height: number; width: number; x: number; y: number } | null;
  viewportOffset: { x: number; y: number };
}>;

export type InfinityCanvasBackgroundObservation = Readonly<{
  backgroundEnabled: boolean | null;
  canvasMode: string | null;
  infinityDisabled: boolean | null;
  runtimeBackgroundColor: string | null;
  viewportBackgroundColor: string | null;
  viewportMatchesRuntimeColor: boolean;
}>;

export async function observeInfinityCanvasBackground(
  page: Page,
): Promise<InfinityCanvasBackgroundObservation> {
  return page.evaluate(() => {
    const readSwitch = (
      target: string,
    ): Readonly<{ checked: boolean | null; disabled: boolean | null }> => {
      const field = document.querySelector<HTMLElement>(
        `[data-toolcraft-control-target="${target}"]`,
      );
      const switchElement = field?.querySelector<HTMLElement>('[role="switch"]');
      const checked = switchElement?.getAttribute("aria-checked");

      return {
        checked:
          checked === "true" ? true : checked === "false" ? false : null,
        disabled: switchElement
          ? switchElement.matches(":disabled") ||
            switchElement.getAttribute("aria-disabled") === "true"
          : null,
      };
    };
    const background = readSwitch("export.includeBackground");
    const infinity = readSwitch("canvas.infinity");
    const surface = document.querySelector<HTMLElement>(
      "[data-toolcraft-canvas-mode]",
    );
    const viewport = document.querySelector<HTMLElement>(
      '[data-slot="toolcraft-runtime-canvas"]',
    );
    const runtimeBackgroundColor =
      viewport?.dataset.toolcraftInfiniteBackgroundColor ?? null;
    const viewportBackgroundColor = viewport
      ? getComputedStyle(viewport).backgroundColor
      : null;
    let normalizedRuntimeColor: string | null = null;

    if (runtimeBackgroundColor) {
      const probe = document.createElement("span");
      probe.style.backgroundColor = runtimeBackgroundColor;
      document.body.append(probe);
      normalizedRuntimeColor = getComputedStyle(probe).backgroundColor;
      probe.remove();
    }

    return {
      backgroundEnabled: background.checked,
      canvasMode: surface?.dataset.toolcraftCanvasMode ?? null,
      infinityDisabled: infinity.disabled,
      runtimeBackgroundColor,
      viewportBackgroundColor,
      viewportMatchesRuntimeColor:
        normalizedRuntimeColor !== null &&
        normalizedRuntimeColor === viewportBackgroundColor,
    };
  });
}

export async function observeInfinityCanvas(
  page: Page,
  sceneSelector?: string,
): Promise<InfinityCanvasObservation> {
  return page.evaluate((selector) => {
    const surface = document.querySelector<HTMLElement>(
      "[data-toolcraft-canvas-mode]",
    );
    const world = document.querySelector<HTMLElement>(
      "[data-toolcraft-canvas-world]",
    );
    const scene = selector
      ? document.querySelector<HTMLElement>(selector)
      : null;
    const finiteControlsPresent = [
      "canvas.aspectRatio",
      "canvas.size.width",
      "canvas.size.height",
    ].every((target) =>
      document.querySelector(
        `[data-toolcraft-control-target="${target}"]`,
      ),
    );
    const read = (value: string | undefined): number | null => {
      const parsed = Number.parseFloat(value ?? "");
      return Number.isFinite(parsed) ? parsed : null;
    };
    const style = scene?.style;
    const sceneValues = style
      ? {
          height: read(style.height),
          width: read(style.width),
          x: read(style.left),
          y: read(style.top),
        }
      : null;
    const sceneRect =
      sceneValues && Object.values(sceneValues).every((value) => value !== null)
        ? {
            height: sceneValues.height!,
            width: sceneValues.width!,
            x: sceneValues.x!,
            y: sceneValues.y!,
          }
        : null;

    return {
      artboardPresent: Boolean(
        document.querySelector("[data-toolcraft-editable-canvas]"),
      ),
      canvasMode: surface?.getAttribute("data-toolcraft-canvas-mode") ?? null,
      finiteControlsPresent,
      overflow: surface ? getComputedStyle(surface).overflow : "missing",
      sceneRect,
      viewportOffset: {
        x: Number(world?.dataset.toolcraftCanvasOffsetX ?? 0),
        y: Number(world?.dataset.toolcraftCanvasOffsetY ?? 0),
      },
    };
  }, sceneSelector);
}

export function expectInfiniteCanvasObservation(
  observation: InfinityCanvasObservation,
  expectedSceneRect?: InfinityCanvasObservation["sceneRect"],
): void {
  expect(observation.canvasMode).toBe("infinite");
  expect(observation.artboardPresent).toBe(false);
  expect(observation.finiteControlsPresent).toBe(false);
  expect(observation.overflow).toBe("visible");
  if (expectedSceneRect) expect(observation.sceneRect).toEqual(expectedSceneRect);
  expect(Number.isFinite(observation.viewportOffset.x)).toBe(true);
  expect(Number.isFinite(observation.viewportOffset.y)).toBe(true);
}

export function expectFiniteCanvasObservation(
  observation: InfinityCanvasObservation,
): void {
  expect(observation.canvasMode).toBe("finite");
  expect(observation.artboardPresent).toBe(true);
  expect(observation.finiteControlsPresent).toBe(true);
  expect(observation.overflow).toBe("hidden");
}

export async function expectToolcraftInfinityCanvasModeEvidence(
  observations: Readonly<{
    afterPan: InfinityCanvasObservation;
    afterReload: InfinityCanvasObservation;
    before: InfinityCanvasObservation;
    enabled: InfinityCanvasObservation;
    redone: InfinityCanvasObservation;
    restored: InfinityCanvasObservation;
    undone: InfinityCanvasObservation;
  }>,
  options: Readonly<{
    expectedSceneRect: NonNullable<InfinityCanvasObservation["sceneRect"]>;
    requirementId: string;
    target: string;
  }>,
): Promise<void> {
  expectFiniteCanvasObservation(observations.before);
  expectInfiniteCanvasObservation(
    observations.enabled,
    options.expectedSceneRect,
  );
  expectInfiniteCanvasObservation(
    observations.afterPan,
    options.expectedSceneRect,
  );
  expect(observations.afterPan.viewportOffset).not.toEqual(
    observations.enabled.viewportOffset,
  );
  expectInfiniteCanvasObservation(
    observations.afterReload,
    options.expectedSceneRect,
  );
  expectFiniteCanvasObservation(observations.restored);
  expectInfiniteCanvasObservation(
    observations.undone,
    options.expectedSceneRect,
  );
  expectFiniteCanvasObservation(observations.redone);

  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "viewport-side-effect",
    requirementId: options.requirementId,
    target: options.target,
  });
  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "infinity-mode-restoration",
    requirementId: options.requirementId,
    target: options.target,
  });
}

export async function expectToolcraftInfinityCanvasBackgroundEvidence(
  observations: Readonly<{
    backgroundExcluded: InfinityCanvasBackgroundObservation;
    backgroundRestored: InfinityCanvasBackgroundObservation;
    infinite: InfinityCanvasBackgroundObservation;
  }>,
  options: Readonly<{
    expectedBackgroundColor: string;
    requirementId: string;
    target: string;
  }>,
): Promise<void> {
  expect(observations.infinite).toMatchObject({
    backgroundEnabled: true,
    canvasMode: "infinite",
    infinityDisabled: false,
    runtimeBackgroundColor: options.expectedBackgroundColor,
    viewportMatchesRuntimeColor: true,
  });
  expect(observations.backgroundExcluded).toMatchObject({
    backgroundEnabled: false,
    canvasMode: "finite",
    infinityDisabled: true,
    runtimeBackgroundColor: null,
  });
  expect(observations.backgroundRestored).toMatchObject({
    backgroundEnabled: true,
    canvasMode: "finite",
    infinityDisabled: false,
    runtimeBackgroundColor: null,
  });

  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "background-infinity-viewport",
    requirementId: options.requirementId,
    target: options.target,
  });
}

export async function expectToolcraftInfinityCanvasImageExportEvidence(
  artifacts: Readonly<{
    finite: Readonly<{ byteLength: number; height: number; width: number }>;
    infinite: Readonly<{ byteLength: number; height: number; width: number }>;
  }>,
  options: Readonly<{
    expectedFiniteSize: Readonly<{ height: number; width: number }>;
    expectedInfiniteSize: Readonly<{ height: number; width: number }>;
    requirementId: string;
    target: string;
  }>,
): Promise<void> {
  expect(artifacts.finite).toMatchObject(options.expectedFiniteSize);
  expect(artifacts.infinite).toMatchObject(options.expectedInfiniteSize);
  expect(artifacts.finite.byteLength).toBeGreaterThan(100);
  expect(artifacts.infinite.byteLength).toBeGreaterThan(100);
  expect({ height: artifacts.infinite.height, width: artifacts.infinite.width })
    .not.toEqual({
      height: artifacts.finite.height,
      width: artifacts.finite.width,
    });

  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "exported-artifact",
    requirementId: options.requirementId,
    target: options.target,
  });
  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "infinity-scene-bounds-image-export",
    requirementId: options.requirementId,
    target: options.target,
  });
}

export async function expectToolcraftInfinityCanvasVideoExportEvidence(
  artifacts: Readonly<{
    finite: Readonly<{
      byteLength: number;
      durationMs: number;
      height: number;
      width: number;
    }>;
    infinite: Readonly<{
      byteLength: number;
      durationMs: number;
      height: number;
      width: number;
    }>;
  }>,
  options: Readonly<{
    expectedFiniteSize: Readonly<{ height: number; width: number }>;
    expectedInfiniteSize: Readonly<{ height: number; width: number }>;
    requirementId: string;
    target: string;
  }>,
): Promise<void> {
  expect(artifacts.finite).toMatchObject(options.expectedFiniteSize);
  expect(artifacts.infinite).toMatchObject(options.expectedInfiniteSize);
  expect(artifacts.finite.byteLength).toBeGreaterThan(100);
  expect(artifacts.infinite.byteLength).toBeGreaterThan(100);
  expect(artifacts.finite.durationMs).toBeGreaterThan(0);
  expect(artifacts.infinite.durationMs).toBeGreaterThan(0);
  expect({ height: artifacts.infinite.height, width: artifacts.infinite.width })
    .not.toEqual({
      height: artifacts.finite.height,
      width: artifacts.finite.width,
    });

  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "exported-artifact",
    requirementId: options.requirementId,
    target: options.target,
  });
  await attachToolcraftBrowserRuntimeEvidence({
    evidenceType: "infinity-scene-bounds-video-export",
    requirementId: options.requirementId,
    target: options.target,
  });
}
