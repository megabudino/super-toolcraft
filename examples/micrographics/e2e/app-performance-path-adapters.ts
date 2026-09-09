import { expect, type Page } from "@playwright/test";

import { deriveToolcraftPerformancePaths } from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import {
  dragToolcraftCanvasViewport,
  zoomToolcraftCanvasViewport,
} from "./performance-canvas-helpers";
import { dragMicrographicsSliderTargetToValue } from "./micrographics-browser-helpers";
import type { ToolcraftCompiledFixtureApplications } from "./performance-compiled-fixture-runtime";
import type {
  ToolcraftPerformancePathActionContext,
  ToolcraftPerformancePathAdapter,
} from "./performance-path-adapter-contract";

const productOutputSelector =
  '[data-toolcraft-product-output="micrographics"]';

async function prepare(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator(productOutputSelector)).toBeVisible();
  const resetControls = page.getByRole("button", {
    name: "Reset controls",
    exact: true,
  });
  if (await resetControls.isEnabled()) {
    await resetControls.click();
    await expect(page.locator(productOutputSelector)).toBeVisible();
  }
}

async function findDraggableElementPoint(
  page: Page,
): Promise<{ x: number; y: number }> {
  const point = await page.evaluate((selector) => {
    const hitAreas = Array.from(
      document.querySelectorAll<SVGRectElement>(selector),
    ).reverse();

    for (const hitArea of hitAreas) {
      const box = hitArea.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) continue;

      for (const yRatio of [0.5, 0.25, 0.75, 0.1, 0.9]) {
        for (const xRatio of [0.5, 0.25, 0.75, 0.1, 0.9]) {
          const x = box.left + box.width * xRatio;
          const y = box.top + box.height * yRatio;
          if (document.elementFromPoint(x, y) === hitArea) {
            return { x, y };
          }
        }
      }
    }

    return null;
  }, `${productOutputSelector} [data-element-index] [data-micrographics-element-hit-area]`);

  if (!point) {
    throw new Error("Could not find an unobscured micrographics element.");
  }
  return point;
}

async function prepareMaskDrag(page: Page): Promise<void> {
  await prepare(page);
  const point = await findDraggableElementPoint(page);
  await page.mouse.click(point.x, point.y);
  await expect(page.getByTestId("micrographics-selection-handle")).toBeVisible();
}

async function readSliderValue(page: Page, target: string): Promise<number> {
  const field = await getToolcraftControlFieldByTarget(page, target);
  const slider = field.getByRole("slider").first();
  return Number(await slider.getAttribute("aria-valuenow"));
}

async function setTemplateTier(page: Page, value: unknown): Promise<void> {
  const tier = String(value);
  const label =
    tier === "simple" ? "Simple" : tier === "mega" ? "Mega" : "Both";
  const field = await getToolcraftControlFieldByTarget(
    page,
    "composition.templateTier",
  );
  await field.getByRole("button", { name: label, exact: true }).click();
}

async function readTemplateTier(page: Page): Promise<string> {
  const field = await getToolcraftControlFieldByTarget(
    page,
    "composition.templateTier",
  );

  for (const [label, value] of [
    ["Simple", "simple"],
    ["Mega", "mega"],
    ["Both", "both"],
  ] as const) {
    if (
      (await field
        .getByRole("button", { name: label, exact: true })
        .getAttribute("aria-pressed")) === "true"
    ) {
      return value;
    }
  }

  throw new Error("Could not observe the selected random template tier.");
}

function fixtureApplications(page: Page): ToolcraftCompiledFixtureApplications {
  return {
    "element-count": {
      applyValue: (value) =>
        dragMicrographicsSliderTargetToValue(page, "composition.count", Number(value)),
      observeValue: () => readSliderValue(page, "composition.count"),
    },
    "template-tier-weight": {
      applyValue: (value) => setTemplateTier(page, value),
      observeValue: () => readTemplateTier(page),
    },
  };
}

async function readPosterSignature(page: Page): Promise<string> {
  return page.locator(productOutputSelector).evaluate((node) => {
    const elements = Array.from(
      node.querySelectorAll<SVGGElement>(
        '[data-micrographics-layer="foreground"] [data-element-index]',
      ),
    ).map(
      (element) =>
        `${element.dataset.templateId ?? ""}:${element.getAttribute("transform") ?? ""}`,
    );
    const background = Array.from(
      node.querySelectorAll<SVGImageElement>(
        '[data-micrographics-layer="background"] image',
      ),
    ).map((image) => image.getAttribute("href") ?? "");
    return `${elements.join("|")}::${background.join("|")}`;
  });
}

async function dragSeed({ page, phase }: ToolcraftPerformancePathActionContext) {
  const ratio = phase === "warm" ? 0.28 : 0.72;
  const value = Math.round(1 + 998 * ratio);
  await dragMicrographicsSliderTargetToValue(page, "composition.seed", value, {
    ensureExact: false,
    steps: 6,
  });
}

async function toggleTemplateTier({
  page,
}: ToolcraftPerformancePathActionContext) {
  const current = await readTemplateTier(page);
  await setTemplateTier(page, current === "mega" ? "simple" : "mega");
}

async function dragTopElement({ page, phase }: ToolcraftPerformancePathActionContext) {
  const point = await findDraggableElementPoint(page);
  const direction = phase === "warm" ? -1 : 1;
  const startX = point.x;
  const startY = point.y;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + direction * 28, startY + direction * 18, {
    steps: 8,
  });
  await page.mouse.up();
}

async function importPhaseImage({ page, phase }: ToolcraftPerformancePathActionContext) {
  const field = await getToolcraftControlFieldByTarget(page, "source.image");
  const colors = { cold: "#ff4d24", sustained: "#49dcb1", warm: "#5870ff" } as const;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="${colors[phase]}"/><circle cx="320" cy="180" r="90" fill="#191919"/></svg>`;
  await field.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(svg),
    mimeType: "image/svg+xml",
    name: `micrographics-${phase}.svg`,
  });
  await expect(page.locator(`${productOutputSelector} image`)).toBeVisible();
}

const paths = deriveToolcraftPerformancePaths(appSchema, appPerformance);

function adapterForPath(
  path: (typeof paths)[number],
): ToolcraftPerformancePathAdapter {
  const base = {
    pathId: path.id,
    prepare,
    ...(path.workloadDimensions.length > 0 ? { fixtureApplications } : {}),
  } as const;

  switch (path.interaction) {
    case "export":
      return {
        ...base,
        output: {
          kind: "download",
          label: "Export PNG",
          verify: async (download) => {
            expect(await download.failure()).toBeNull();
            expect(download.suggestedFilename()).toMatch(/\.(png|jpg)$/u);
            expect(await download.path()).toBeTruthy();
          },
        },
      };
    case "media-import":
      return {
        ...base,
        action: importPhaseImage,
        observeOutcome: ({ page }) => readPosterSignature(page),
      };
    case "initial-render":
      return {
        ...base,
        action: async ({ page }) => {
          await page.waitForTimeout(250);
          await page.reload();
          await expect(page.locator(productOutputSelector)).toBeVisible();
        },
      };
    case "control-drag":
      return {
        ...base,
        action: dragSeed,
        observeOutcome: ({ page }) => readPosterSignature(page),
      };
    case "mask-drag":
      return {
        ...base,
        prepare: prepareMaskDrag,
        action: dragTopElement,
        observeOutcome: ({ page }) => readPosterSignature(page),
      };
    case "viewport-drag":
      return {
        ...base,
        action: ({ page }) => dragToolcraftCanvasViewport(page),
      };
    case "viewport-zoom":
      return {
        ...base,
        action: ({ page }) => zoomToolcraftCanvasViewport(page, 1),
      };
    case "control-change":
      return {
        ...base,
        action: toggleTemplateTier,
        observeOutcome: ({ page }) => readPosterSignature(page),
      };
    default:
      throw new Error(`Unsupported micrographics performance path: ${path.interaction}`);
  }
}

export const appPerformancePathAdapters = paths.map(adapterForPath);
