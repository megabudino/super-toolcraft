import { expect, type Page } from "@playwright/test";

import { logoSpherePerformancePaths } from "../src/app/app-performance";
import type { ToolcraftCompiledFixtureApplications } from "./performance-compiled-fixture-runtime";
import type {
  ToolcraftPerformanceCanvasBacking,
  ToolcraftPerformancePathAdapter,
} from "./performance-path-adapter-contract";

export const appPerformanceCanvasBacking:
  | ToolcraftPerformanceCanvasBacking
  | undefined = {
  canvasSelector: 'canvas[data-toolcraft-product-output="logo-sphere"]',
};

const canvasSelector = appPerformanceCanvasBacking.canvasSelector;

const productOutcomeInteractions = new Set([
  "control-change",
  "control-drag",
  "mask-drag",
  "media-import",
  "timeline-playback",
  "timeline-scrub",
]);

async function prepareLogoSpherePath(page: Page): Promise<void> {
  await page.goto("/");
  const canvas = page.locator(canvasSelector);
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-ready-image-count", "30", {
    timeout: 20_000,
  });
  const pause = page.getByRole("button", { name: "Pause playback" });
  if (await pause.isVisible()) {
    await pause.click();
  }
  await page
    .locator('[data-toolcraft-control-target="motion.inertia"]')
    .getByRole("slider")
    .press("Home");
}

async function setLogoSphereSliderValue(
  page: Page,
  target: string,
  value: number,
): Promise<void> {
  const field = page.locator(`[data-toolcraft-control-target="${target}"]`);
  const slider = field.getByRole("slider");
  const label = await slider.getAttribute("aria-label");
  if (!label) {
    throw new Error(`Slider "${target}" must expose an accessible label.`);
  }

  await field.getByRole("button", { name: `Edit ${label} value` }).click();
  const editor = field.getByRole("textbox", { name: `${label} value` });
  await editor.fill(String(value));
  await editor.press("Enter");
  await expect(slider).toHaveAttribute("aria-valuenow", String(value));
}

function createLogoSphereFixtureApplications(
  page: Page,
  dimensionIds: readonly string[],
): ToolcraftCompiledFixtureApplications {
  const applications: ToolcraftCompiledFixtureApplications = {};

  if (dimensionIds.includes("distribution-complexity")) {
    applications["distribution-complexity"] = {
      applyValue: async (value) => {
        const labels = {
          fibonacci: "Fibonacci",
          grid: "Grid",
          rings: "Rings",
        } as const;
        const distribution = String(value) as keyof typeof labels;
        await page
          .locator('[data-toolcraft-control-target="sphere.distribution"]')
          .getByRole("button", { exact: true, name: labels[distribution] })
          .click();
      },
      observeValue: async () => {
        const label = await page
          .locator(
            '[data-toolcraft-control-target="sphere.distribution"] [aria-pressed="true"]',
          )
          .textContent();
        return label?.trim().toLowerCase() ?? "";
      },
    };
  }

  if (dimensionIds.includes("visible-logos")) {
    applications["visible-logos"] = {
      applyValue: (value) =>
        setLogoSphereSliderValue(page, "sphere.visibleCount", Number(value)),
      observeValue: async () =>
        Number(
          await page
            .locator('[data-toolcraft-control-target="sphere.visibleCount"]')
            .getByRole("slider")
            .getAttribute("aria-valuenow"),
        ),
    };
  }

  return applications;
}

async function dragLogoSphere(page: Page): Promise<void> {
  const canvas = page.locator(canvasSelector);
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 96, y - 36, { steps: 12 });
  await page.mouse.up();
}

function createLogoSpherePathAdapter(
  path: (typeof logoSpherePerformancePaths)[number],
): ToolcraftPerformancePathAdapter {
  const base = {
    ...(path.workloadDimensions.length > 0
      ? {
          fixtureApplications: (page: Page) =>
            createLogoSphereFixtureApplications(
              page,
              path.workloadDimensions,
            ),
        }
      : {}),
    pathId: path.id,
    prepare: prepareLogoSpherePath,
  };

  if (path.interaction === "export") {
    return {
      ...base,
      output: {
        kind: "download",
        label: "Export PNG",
        verify: async (download) => {
          expect((await download.path()) ?? download.suggestedFilename()).toBeTruthy();
        },
      },
    };
  }

  const isOrbitDrag =
    path.interaction === "control-drag" &&
    path.invalidates.length === 1 &&
    path.invalidates[0] === "sphere-composite" &&
    path.targets.includes("view.orbit");
  const isAnimationFrame = path.interaction === "animation-frame";

  return {
    ...base,
    action: async ({ page }) => {
      if (isAnimationFrame) {
        const play = page.getByRole("button", { name: "Play playback" });
        if (await play.isVisible()) {
          await play.click();
        }
      }
      if (isOrbitDrag) {
        await dragLogoSphere(page);
      }
    },
    ...(productOutcomeInteractions.has(path.interaction)
      ? {
          observeOutcome: async ({ page }: { page: Page }) =>
            page.locator(canvasSelector).getAttribute("data-orbit-position"),
        }
      : {}),
    ...(isOrbitDrag || isAnimationFrame
      ? {
          verifyOutcome: async ({ page }: { page: Page }) => {
            await expect(page.locator(canvasSelector)).toHaveAttribute(
              "data-render-quality",
              "full",
              { timeout: 4_000 },
            );
          },
        }
      : {}),
  };
}

export const appPerformancePathAdapters =
  logoSpherePerformancePaths.map(createLogoSpherePathAdapter) satisfies readonly ToolcraftPerformancePathAdapter[];
