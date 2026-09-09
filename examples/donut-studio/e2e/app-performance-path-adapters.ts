import { expect, type Page } from "@playwright/test";

import {
  deriveToolcraftPerformancePaths,
  type ToolcraftPerformancePath,
} from "@/toolcraft/runtime";

import { appPerformance } from "../src/app/app-performance";
import { appSchema } from "../src/app/app-schema";
import {
  chooseOption,
  DONUT_CANVAS_SELECTOR,
  fieldFor,
  openDonut,
  pickControlColor,
  setSliderValue,
  waitForDonut,
} from "./donut-test-helpers";
import { zoomToolcraftCanvasViewport } from "./performance-canvas-helpers";
import type { ToolcraftCompiledFixtureApplications } from "./performance-compiled-fixture-runtime";
import type {
  ToolcraftPerformancePathActionContext,
  ToolcraftPerformancePathAdapter,
} from "./performance-path-adapter-contract";

const outputSelector = "[data-donut-renderer]";

async function readDonutSignature(page: Page): Promise<string> {
  return page.locator(outputSelector).evaluate((output) =>
    JSON.stringify({
      attributes: Array.from(output.attributes, ({ name, value }) => [
        name,
        value,
      ]).sort(),
      canvasSignature:
        output.querySelector("canvas")?.dataset.donutOutputSignature ?? "",
    }),
  );
}

async function prepareDonutPath(
  page: Page,
  path: ToolcraftPerformancePath,
): Promise<void> {
  await openDonut(page);
  if (!path.targets.includes("canvas.renderScale")) return;
  await setSliderValue(fieldFor(page, "canvas.renderScale"), 2);
  await expect(page.locator(DONUT_CANVAS_SELECTOR)).toHaveAttribute(
    "data-donut-render-scale",
    "2",
  );
}

function fixtureApplications(
  page: Page,
  path: ToolcraftPerformancePath,
): ToolcraftCompiledFixtureApplications {
  const applications: ToolcraftCompiledFixtureApplications = {};
  if (path.workloadDimensions.includes("sprinkle-flow")) {
    applications["sprinkle-flow"] = {
      applyValue: async (value) => {
        await setSliderValue(fieldFor(page, "sprinkles.flow"), Number(value));
        await expect(page.locator(outputSelector)).toHaveAttribute(
          "data-sprinkle-flow",
          String(value),
        );
      },
      observeValue: async () =>
        Number(
          await fieldFor(page, "sprinkles.flow")
            .getByRole("slider")
            .inputValue(),
        ),
    };
  }
  if (path.workloadDimensions.includes("image-long-edge")) {
    applications["image-long-edge"] = {
      applyValue: async (value) => {
        const resolution = String(value).toLowerCase();
        await chooseOption(
          page,
          "export.image.resolution",
          resolution.toUpperCase(),
        );
        await expect(
          fieldFor(page, "export.image.resolution").getByRole("combobox"),
        ).toHaveAttribute("title", resolution.toUpperCase());
      },
      observeValue: () =>
        fieldFor(page, "export.image.resolution")
          .getByRole("textbox")
          .inputValue(),
    };
  }
  return applications;
}

async function dragDonutModel(
  { page, phase }: ToolcraftPerformancePathActionContext,
): Promise<void> {
  const canvas = page.locator(DONUT_CANVAS_SELECTOR);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Donut performance path requires a visible canvas.");
  const direction = phase === "warm" ? -1 : 1;
  const x = box.x + box.width * 0.5;
  const y = box.y + box.height * 0.5;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 28 * direction, y + 16, { steps: 8 });
  await page.mouse.up();
}

async function dragDonutViewport(
  { page, phase }: ToolcraftPerformancePathActionContext,
): Promise<void> {
  const viewport = page.getByRole("application", { name: "Canvas viewport" });
  const box = await viewport.boundingBox();
  if (!box) throw new Error("Donut performance path requires a visible viewport.");
  const direction = phase === "warm" ? -1 : 1;
  const x = box.x + box.width * 0.04;
  const y = box.y + box.height * 0.5;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 42 * direction, y + 28, { steps: 8 });
  await page.mouse.up();
}

async function changeDonutControl(
  { page, path, phase }: ToolcraftPerformancePathActionContext,
): Promise<void> {
  if (path.targets.some((target) => target.startsWith("icing."))) {
    await fieldFor(page, "icing.enabled").getByRole("switch").click();
    return;
  }
  if (path.targets.includes("sprinkles.shape")) {
    const label = phase === "warm" ? "Pellet" : phase === "cold" ? "Pearl" : "Rod";
    await fieldFor(page, "sprinkles.shape")
      .getByRole("button", { exact: true, name: label })
      .click();
    return;
  }
  if (path.targets.includes("scene.plateVisible")) {
    await fieldFor(page, "scene.plateVisible").getByRole("switch").click();
    return;
  }
  const colorTarget = path.targets.find((target) =>
    [
      "appearance.background",
      "icing.color",
      "material.donut.color",
      "material.plate.color",
      "sprinkles.solidColor",
      "studio.cool.color",
      "studio.key.color",
      "studio.warm.color",
    ].includes(target),
  );
  if (colorTarget) {
    await pickControlColor(page, fieldFor(page, colorTarget));
    return;
  }
  if (path.targets.includes("canvas.aspectRatio")) {
    await chooseOption(
      page,
      "canvas.aspectRatio",
      phase === "warm" ? "1:1" : phase === "cold" ? "4:5" : "16:9",
    );
    return;
  }
  const format = fieldFor(page, "export.image.format");
  const current = await format.getByRole("combobox").getAttribute("title");
  await chooseOption(
    page,
    "export.image.format",
    current === "PNG" ? "JPG" : "PNG",
  );
}

async function dragPathSlider(
  { page, path, phase }: ToolcraftPerformancePathActionContext,
): Promise<void> {
  const targetOrder = path.workloadDimensions.includes("sprinkle-flow")
    ? [
        ...path.targets.filter((target) => target !== "sprinkles.flow"),
        "sprinkles.flow",
      ]
    : path.targets;
  for (const target of targetOrder) {
    const slider = fieldFor(page, target).getByRole("slider");
    if ((await slider.count()) === 0) continue;
    const [minValue, maxValue] = await Promise.all([
      slider.getAttribute("min"),
      slider.getAttribute("max"),
    ]);
    const min = Number(minValue ?? 0);
    const max = Number(maxValue ?? 1);
    const value =
      phase === "warm" ? max : phase === "cold" ? min : min + (max - min) * 0.62;
    await setSliderValue(fieldFor(page, target), value);
    return;
  }
  throw new Error(`No slider control found for performance path ${path.id}.`);
}

function adapterForPath(
  path: ToolcraftPerformancePath,
): ToolcraftPerformancePathAdapter {
  const prepare = (page: Page) => prepareDonutPath(page, path);
  if (path.interaction === "initial-render") {
    return {
      action: async ({ page }) => {
        await page.reload();
        await waitForDonut(page);
      },
      pathId: path.id,
      prepare,
    };
  }
  if (path.interaction === "export") {
    return {
      output: {
        kind: "download",
        label: "Export PNG",
        verify: async (download) => {
          const stream = await download.createReadStream();
          expect(stream).not.toBeNull();
          let byteLength = 0;
          for await (const chunk of stream!) {
            byteLength += (chunk as Uint8Array).byteLength;
          }
          expect(byteLength).toBeGreaterThan(1_000);
          expect(download.suggestedFilename()).toMatch(
            /donut-studio\.(?:jpg|png)$/u,
          );
        },
      },
      pathId: path.id,
      prepare,
    };
  }
  if (path.interaction === "control-drag") {
    const adapter: ToolcraftPerformancePathAdapter =
      path.targets.includes("scene.orientation")
        ? {
            action: dragDonutModel,
            observeOutcome: ({ page }) => readDonutSignature(page),
            pathId: path.id,
            prepare,
          }
        : {
            action: dragPathSlider,
            observeOutcome: ({ page }) => readDonutSignature(page),
            pathId: path.id,
            prepare,
          };
    return path.targets.includes("canvas.renderScale")
      ? {
          ...adapter,
          renderScaleBacking: {
            canvasSelector: DONUT_CANVAS_SELECTOR,
            selectedScale: 2,
          },
        }
      : adapter;
  }
  if (path.interaction === "control-change") {
    return {
      action: changeDonutControl,
      observeOutcome: ({ page }) => readDonutSignature(page),
      pathId: path.id,
      prepare,
    };
  }
  if (path.interaction === "viewport-drag") {
    return { action: dragDonutViewport, pathId: path.id, prepare };
  }
  if (path.interaction === "viewport-zoom") {
    return {
      action: ({ page }) => zoomToolcraftCanvasViewport(page, 1),
      pathId: path.id,
      prepare,
    };
  }
  throw new Error(
    `Unsupported donut performance path interaction: ${path.interaction}`,
  );
}

const donutPerformancePaths = deriveToolcraftPerformancePaths(
  appSchema,
  appPerformance,
);

export const appPerformancePathAdapters = donutPerformancePaths.map((path) => {
  const adapter = adapterForPath(path);
  return path.workloadDimensions.length === 0
    ? adapter
    : {
        ...adapter,
        fixtureApplications: (page: Page) => fixtureApplications(page, path),
      };
}) satisfies readonly ToolcraftPerformancePathAdapter[];
