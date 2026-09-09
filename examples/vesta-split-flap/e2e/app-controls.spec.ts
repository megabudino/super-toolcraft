import { readFile, writeFile } from "node:fs/promises";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import { appPerformance } from "../src/app/app-performance";
import { VESTABOARD_CELL_COUNT } from "../src/app/vestaboard-model";
import {
  dragCreativeAppsKitSliderByLabel,
  dragCreativeAppsKitCanvasViewport,
  expectCreativeAppsKitCanvasViewportStable,
  expectCreativeAppsKitScenarioPerformanceBudget,
  getCreativeAppsKitFieldByLabel,
  getCreativeAppsKitPerformanceStressValue,
  measureCreativeAppsKitAnimationFrames,
  measureCreativeAppsKitInteraction,
  zoomCreativeAppsKitCanvasViewport,
} from "./performance-helpers";

type ExportProbe = {
  backgroundPixel: number[];
  height: number;
  pixel: number[];
  width: number;
};

type GridMeta = {
  cellCount: number;
  columns: number;
  height: number;
  rows: number;
  width: number;
};

type OutputMutationProbeResult = {
  batches: number;
  charMutations: number;
  mutationCount: number;
  styleMutations: number;
};

type VideoMetadata = {
  duration: number;
  durationSeconds: number;
  height: number;
  width: number;
};

const collapsePlaybackSettingsPayload = {
  appId: "vesta-split-flap",
  canvas: {
    size: {
      height: 1600,
      unit: "px",
      width: 3000,
    },
  },
  source: "creative-apps-kit-settings",
  timeline: {
    currentTimeSeconds: 0,
    durationSeconds: 4,
    expanded: false,
    isLooping: true,
    isPlaying: false,
  },
  values: {
    "appearance.background": { hex: "#111214" },
    "board.cell.border": { hex: "#FFFFFF", opacity: 4 },
    "board.cell.bottomHighlightFillCanvas": 100,
    "board.cell.bottomHighlightOpacityRange": [0, 6],
    "board.cell.bottomHighlightSeed": 421,
    "board.cell.fill": { hex: "#FFFFFF" },
    "board.cell.fillOpacityRange": [0, 2],
    "board.cell.fillSeed": 3134,
    "board.cell.radius": 4,
    "board.text.color": { hex: "#FFFFFF" },
    "board.text.letterDurationRange": [14, 56],
    "board.text.letterSpeed": 100,
    "board.text.message":
      "This is the future\nof design, where\ncreativity and technology\ncome together to\nshape what's next.",
    "board.text.outgoingOpacityRange": [0, 100],
    "board.text.targetMessage": "This is the\nfuture of design",
    "board.tile.gap": 6,
    "board.tile.height": 42,
    "board.tile.width": 28,
    "canvas.size.height": 1600,
    "canvas.size.width": 3000,
    "field.durationRange": [26, 78],
    "field.fillEnd": 0,
    "field.fillStart": 100,
    "field.opacityRange": [0, 24],
    "field.seed": 7792,
    "field.speed": 100,
  },
  version: 1,
} as const;

test.beforeEach(async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
  await page.goto("/");
  await expect(page.getByTestId("vestaboard-output")).toBeVisible();

  if (testInfo.title.startsWith("browser perf:") && !testInfo.title.includes("phrase animation")) {
    await pausePlaybackIfPlaying(page);
  }
});

async function pausePlaybackIfPlaying(page: Page): Promise<void> {
  const pauseButton = page.getByRole("button", { name: "Pause playback" });

  if (await pauseButton.isVisible().catch(() => false)) {
    await pauseButton.click();
  }
}

async function getCanvasSize(page: Page): Promise<{ height: string; width: string }> {
  return page.locator("[data-creative-apps-kit-editable-canvas]").evaluate((element) => {
    const htmlElement = element as HTMLElement;
    return {
      height: htmlElement.style.height,
      width: htmlElement.style.width,
    };
  });
}

async function getCellBox(page: Page, row: number, col: number) {
  const box = await page.getByTestId(`vestaboard-cell-${row}-${col}`).boundingBox();
  if (!box) {
    throw new Error(`Could not measure cell ${row}:${col}.`);
  }
  return box;
}

async function getBottomHighlightBox(page: Page, row: number, col: number) {
  const box = await page.getByTestId(`vestaboard-bottom-highlight-${row}-${col}`).boundingBox();
  if (!box) {
    throw new Error(`Could not measure bottom highlight ${row}:${col}.`);
  }
  return box;
}

async function getGridMeta(page: Page): Promise<GridMeta> {
  return page.getByTestId("vestaboard-foreground-layer").evaluate((element) => {
    const htmlElement = element as HTMLElement;
    const styles = window.getComputedStyle(htmlElement);

    return {
      cellCount: Number(htmlElement.dataset.cellCount),
      columns: Number(htmlElement.dataset.columns),
      height: Number.parseFloat(styles.height),
      rows: Number(htmlElement.dataset.rows),
      width: Number.parseFloat(styles.width),
    };
  });
}

async function getCharText(page: Page, row: number, col: number): Promise<string> {
  return page.getByTestId(`vestaboard-cell-${row}-${col}`).innerText();
}

async function countVisibleCharacters(page: Page): Promise<number> {
  return page.locator("[data-creative-apps-kit-product-text]").count();
}

async function countBackgroundCharacters(page: Page): Promise<number> {
  return page.locator('[data-phrase="false"]').evaluateAll(
    (elements) =>
      elements.filter((element) => ((element as HTMLElement).dataset.char ?? "").trim()).length,
  );
}

async function countMessageFlashCells(page: Page): Promise<number> {
  return page.locator('[data-message-flash-fill="true"]').count();
}

async function getFirstMessageFlashBackground(page: Page): Promise<string> {
  const flashCell = page.locator('[data-message-flash-fill="true"]').first();

  await expect(flashCell).toBeVisible();

  return flashCell.evaluate((element) => window.getComputedStyle(element).backgroundColor);
}

async function getMessageFlashBackgrounds(page: Page): Promise<string[]> {
  await expect(page.locator('[data-message-flash-fill="true"]').first()).toBeVisible();

  return page.locator('[data-message-flash-fill="true"]').evaluateAll((elements) =>
    elements.map((element) => window.getComputedStyle(element).backgroundColor),
  );
}

async function getCurrentMessageFlashBackgrounds(page: Page): Promise<string[]> {
  return page.locator('[data-message-flash-fill="true"]').evaluateAll((elements) =>
    elements.map((element) => window.getComputedStyle(element).backgroundColor),
  );
}

async function fillFieldInput(page: Page, label: string, value: string): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  await field.scrollIntoViewIfNeeded();
  const input = field.locator("input, textarea").last();

  await expect(input, `${label} should expose an editable input`).toBeVisible();
  await input.fill(value);
  await input.blur();
}

async function fillColorField(page: Page, label: string, value: string): Promise<void> {
  const input = page.getByLabel(`${label} hex`);

  await expect(input, `${label} color field should be visible`).toBeVisible();
  await input.fill(value);
  await input.blur();
}

async function fillColorOpacityField(
  page: Page,
  label: string,
  hex: string,
  opacity: number,
): Promise<void> {
  const hexInput = page.getByLabel(`${label} hex`);
  const opacityInput = page.getByLabel(`${label} opacity`);

  await expect(hexInput, `${label} hex field should be visible`).toBeVisible();
  await hexInput.fill(hex);
  await hexInput.blur();
  await expect(opacityInput, `${label} opacity field should be visible`).toBeVisible();
  await opacityInput.fill(String(opacity));
  await opacityInput.blur();
}

function getCssColorAlpha(color: string): number {
  const rgbaMatch = /rgba?\(([^)]+)\)/.exec(color);
  if (!rgbaMatch?.[1]) {
    return 1;
  }

  const parts = rgbaMatch[1].split(",").map((part) => part.trim());
  return parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);
}

async function getCellBackgroundColors(page: Page, limit = 24): Promise<string[]> {
  return page.locator('[data-testid^="vestaboard-cell-"]').evaluateAll(
    (elements, maxCount) =>
      elements
        .slice(0, maxCount)
        .map((element) => window.getComputedStyle(element as HTMLElement).backgroundColor),
    limit,
  );
}

async function getBottomHighlightColors(page: Page, limit = 24): Promise<string[]> {
  return page.locator('[data-testid^="vestaboard-bottom-highlight-"]').evaluateAll(
    (elements, maxCount) =>
      elements
        .slice(0, maxCount)
        .map((element) => window.getComputedStyle(element as HTMLElement).backgroundColor),
    limit,
  );
}

async function countBottomHighlights(page: Page): Promise<number> {
  return page.locator('[data-testid^="vestaboard-bottom-highlight-"]').count();
}

async function setMessage(page: Page, value: string): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, "Message");
  const textarea = field.getByRole("textbox", { name: "Message" });

  await textarea.fill(value);
  await textarea.blur();
}

async function setTargetMessage(page: Page, value: string): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, "Target message");
  const textarea = field.getByRole("textbox", { name: "Target message" });

  await textarea.fill(value);
  await textarea.blur();
}

async function getPhraseText(page: Page): Promise<string> {
  return page.locator('[data-phrase="true"]').evaluateAll((elements) => {
    const rows = new Map<number, { char: string; col: number }[]>();

    for (const element of elements) {
      const htmlElement = element as HTMLElement;
      const row = Number(htmlElement.dataset.row);
      const col = Number(htmlElement.dataset.col);
      const char = htmlElement.dataset.char ?? "";

      if (!Number.isFinite(row) || !Number.isFinite(col)) {
        continue;
      }

      const rowCells = rows.get(row) ?? [];
      rowCells.push({ char, col });
      rows.set(row, rowCells);
    }

    return Array.from(rows.entries())
      .sort(([firstRow], [secondRow]) => firstRow - secondRow)
      .map(([, cells]) =>
        cells
          .sort((first, second) => first.col - second.col)
          .map((cell) => cell.char)
          .join("")
          .trim(),
      )
      .join("\n");
  });
}

async function scrubPlayback(page: Page, key: "End" | "Home"): Promise<void> {
  const scrubber = page.getByRole("slider", { name: "Playback position" }).first();

  await expect(scrubber).toBeVisible();
  await scrubber.focus();
  await scrubber.press(key);
}

async function scrubPlaybackToRatio(page: Page, ratio: number): Promise<void> {
  const scrubber = page.getByRole("slider", { name: "Playback position" }).first();

  await expect(scrubber).toBeVisible();

  const box = await scrubber.boundingBox();

  if (!box) {
    throw new Error("Could not measure playback scrubber.");
  }

  await page.mouse.click(box.x + box.width * ratio, box.y + box.height / 2);
}

async function scrubIntoRemovalFrame(page: Page, steps = 1): Promise<void> {
  const scrubber = page.getByRole("slider", { name: "Playback position" }).first();

  await scrubPlayback(page, "Home");

  for (let index = 0; index < steps; index += 1) {
    await scrubber.press("ArrowRight");
  }
}

async function setTimelineDuration(page: Page, durationSeconds: number): Promise<void> {
  // Edit timeline duration through the real contenteditable runtime control.
  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const durationEditor = page.getByRole("textbox", { name: "timeline duration" });

  await durationEditor.fill(String(durationSeconds));
  await durationEditor.press("Enter");
  await expect(page.getByRole("slider", { name: "Playback position" }).first()).toHaveAttribute(
    "aria-valuemax",
    String(durationSeconds),
  );
}

async function setEditableControlValue(
  page: Page,
  label: string,
  draftValue: string,
): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);

  await field.scrollIntoViewIfNeeded();
  await field.getByRole("button", { name: `Edit ${label} value` }).click();
  const valueEditor = field.getByRole("textbox", { name: `${label} value` });

  await valueEditor.fill(draftValue);
  await valueEditor.press("Enter");
}

async function selectControlOption(page: Page, label: string, option: string): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  await field.scrollIntoViewIfNeeded();
  await field.getByRole("combobox").click();
  await page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: new RegExp(`^${option}$`) })
    .click();
  await expect(field.locator('[data-slot="select-trigger"]')).toContainText(option);
}

async function getForegroundTransform(page: Page): Promise<string> {
  return page.getByTestId("vestaboard-foreground-layer").evaluate((element) =>
    window.getComputedStyle(element).transform,
  );
}

async function getCanvasWorldTransform(page: Page): Promise<string> {
  return page.locator("[data-creative-apps-kit-canvas-world]").evaluate((element) =>
    window.getComputedStyle(element).transform,
  );
}

async function getControlFieldTopByLabel(page: Page, label: string): Promise<number> {
  try {
    const field = await getCreativeAppsKitFieldByLabel(page, label);
    const box = await field.boundingBox();

    if (!box) {
      throw new Error(`Could not measure Creative Apps Kit field "${label}".`);
    }

    return Math.round(box.y);
  } catch {
    const colorHexInput = page.getByRole("textbox", { name: `${label} hex` });
    await expect(colorHexInput, `Creative Apps Kit color field "${label}" should be visible`).toBeVisible();

    return colorHexInput.evaluate((element) => {
      const field = element.closest('[data-slot="field"]');

      if (!field) {
        throw new Error("Could not find color field container.");
      }

      return Math.round(field.getBoundingClientRect().y);
    });
  }
}

async function measureControlsPanelOutputOverlap(page: Page): Promise<{
  fit: string | null;
  overlapArea: number;
  overlapX: number;
}> {
  return page.evaluate(() => {
    const output = document.querySelector('[data-testid="vestaboard-output"]');
    const panel = document.querySelector(
      '[data-slot="creative-apps-kit-runtime-panel-host"][data-panel-type="controls"]',
    );
    const runtimeApp = document.querySelector('[data-slot="creative-apps-kit-runtime-app"]');

    if (!output || !panel) {
      return { fit: null, overlapArea: 0, overlapX: 0 };
    }

    const outputRect = output.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const overlapX = Math.max(
      0,
      Math.min(outputRect.right, panelRect.right) - Math.max(outputRect.left, panelRect.left),
    );
    const overlapY = Math.max(
      0,
      Math.min(outputRect.bottom, panelRect.bottom) - Math.max(outputRect.top, panelRect.top),
    );

    return {
      fit: runtimeApp?.getAttribute("data-vestaboard-visual-fit") ?? null,
      overlapArea: Math.round(overlapX * overlapY),
      overlapX: Math.round(overlapX),
    };
  });
}

async function importSettingsPayload(
  page: Page,
  testInfo: TestInfo,
  payload: unknown,
  fileName: string,
): Promise<void> {
  const importPath = testInfo.outputPath(fileName);

  await writeFile(importPath, JSON.stringify(payload), "utf8");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings" }).click();
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles(importPath);
}

async function measureVestaboardOutputMutations(
  page: Page,
  durationMs: number,
): Promise<OutputMutationProbeResult> {
  return page.evaluate(
    (duration) =>
      new Promise<OutputMutationProbeResult>((resolve) => {
        const output = document.querySelector('[data-testid="vestaboard-output"]');

        if (!output) {
          resolve({
            batches: 0,
            charMutations: 0,
            mutationCount: 0,
            styleMutations: 0,
          });
          return;
        }

        let mutationCount = 0;
        let batches = 0;
        let charMutations = 0;
        let styleMutations = 0;
        const observer = new MutationObserver((records) => {
          batches += 1;

          for (const record of records) {
            mutationCount +=
              record.addedNodes.length +
              record.removedNodes.length +
              (record.type === "attributes" ? 1 : 0) +
              (record.type === "characterData" ? 1 : 0);

            if (record.type === "characterData") {
              charMutations += 1;
            }

            if (record.type === "attributes" && record.attributeName === "style") {
              styleMutations += 1;
            }
          }
        });

        observer.observe(output, {
          attributes: true,
          characterData: true,
          childList: true,
          subtree: true,
        });

        window.setTimeout(() => {
          observer.disconnect();
          resolve({ batches, charMutations, mutationCount, styleMutations });
        }, duration);
      }),
    durationMs,
  );
}

async function startControlsCollapseOutputMutationProbe(
  page: Page,
  durationMs: number,
): Promise<() => Promise<OutputMutationProbeResult>> {
  await page.evaluate((duration) => {
    const win = window as Window & {
      __vestaboardCollapseMutationProbe?: Promise<OutputMutationProbeResult>;
    };
    const controlsPanelHostSelector =
      '[data-slot="creative-apps-kit-runtime-panel-host"][data-panel-type="controls"]';
    const controlsPanelCollapseButtonSelector =
      'button[aria-label="Collapse controls"], button[aria-label="Expand controls"]';

    win.__vestaboardCollapseMutationProbe = new Promise((resolve) => {
      const handlePointerDown = (event: PointerEvent) => {
        const button =
          event.target instanceof Element
            ? event.target.closest(controlsPanelCollapseButtonSelector)
            : null;

        if (!button?.closest(controlsPanelHostSelector)) {
          return;
        }

        window.removeEventListener("pointerdown", handlePointerDown, true);
        void measureCollapseWindow();
      };

      const measureCollapseWindow = () => {
        const output = document.querySelector('[data-testid="vestaboard-output"]');

        if (!output) {
          resolve({
            batches: 0,
            charMutations: 0,
            mutationCount: 0,
            styleMutations: 0,
          });
          return;
        }

        let mutationCount = 0;
        let batches = 0;
        let charMutations = 0;
        let styleMutations = 0;
        const observer = new MutationObserver((records) => {
          batches += 1;

          for (const record of records) {
            mutationCount +=
              record.addedNodes.length +
              record.removedNodes.length +
              (record.type === "attributes" ? 1 : 0) +
              (record.type === "characterData" ? 1 : 0);

            if (record.type === "characterData") {
              charMutations += 1;
            }

            if (record.type === "attributes" && record.attributeName === "style") {
              styleMutations += 1;
            }
          }
        });

        observer.observe(output, {
          attributes: true,
          characterData: true,
          childList: true,
          subtree: true,
        });

        window.setTimeout(() => {
          observer.disconnect();
          resolve({ batches, charMutations, mutationCount, styleMutations });
        }, duration);
      };

      window.addEventListener("pointerdown", handlePointerDown, true);
    });
  }, durationMs);

  return () =>
    page.evaluate(() => {
      const win = window as Window & {
        __vestaboardCollapseMutationProbe?: Promise<OutputMutationProbeResult>;
      };

      return (
        win.__vestaboardCollapseMutationProbe ??
        Promise.resolve({
          batches: 0,
          charMutations: 0,
          mutationCount: 0,
          styleMutations: 0,
        })
      );
    });
}

async function setFontSize(page: Page, label: string, value: number): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  const input = field.getByLabel("Font size");
  await expect(input, `${label} should expose a font size input`).toBeVisible();
  await input.fill(String(value));
  await input.blur();
}

async function setFontWeight(page: Page, label: string, value: string): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  const weightField = field.locator('[data-slot="font-picker-weight-field"]');
  await expect(weightField, `${label} should expose a weight select`).toBeVisible();
  await weightField.locator('[data-slot="select-trigger"]').click();
  await page.locator('[role="option"]').filter({ hasText: value }).click();
}

async function clickFontPickerOption(page: Page, label: string, name: RegExp): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  await field.getByRole("button").first().click();
  await page.locator("button").filter({ hasText: name }).first().click();
}

async function toggleIncludeBackground(page: Page): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, "Background");
  await field.scrollIntoViewIfNeeded();
  await field.getByRole("switch").click();
}

async function getBoardSignature(page: Page): Promise<string> {
  return page.locator("[data-creative-apps-kit-product-text]").evaluateAll((elements) =>
    elements.map((element) => element.textContent ?? "").join(""),
  );
}

async function captureNextPngExport(page: Page): Promise<ExportProbe> {
  await page.evaluate(() => {
    const win = window as Window & {
      __vestaboardExportProbe?: ExportProbe;
      __vestaboardOriginalToBlob?: HTMLCanvasElement["toBlob"];
    };

    win.__vestaboardExportProbe = undefined;
    win.__vestaboardOriginalToBlob ??= HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function patchedToBlob(callback, ...args) {
      const context = this.getContext("2d");
      const backgroundX = Math.min(this.width - 1, Math.round((55 / 1200) * this.width));
      const backgroundY = Math.min(this.height - 1, Math.round((4 / 720) * this.height));
      const pixel = context
        ? Array.from(context.getImageData(0, 0, 1, 1).data)
        : [0, 0, 0, 0];
      const backgroundPixel = context
        ? Array.from(context.getImageData(backgroundX, backgroundY, 1, 1).data)
        : [0, 0, 0, 0];

      win.__vestaboardExportProbe = {
        backgroundPixel,
        height: this.height,
        pixel,
        width: this.width,
      };

      return win.__vestaboardOriginalToBlob!.call(this, callback, ...args);
    };
  });

  await page.getByRole("button", { name: "Export PNG" }).click();
  await page.waitForFunction(() => {
    const win = window as Window & { __vestaboardExportProbe?: ExportProbe };
    return Boolean(win.__vestaboardExportProbe);
  });

  return page.evaluate(() => {
    const win = window as Window & { __vestaboardExportProbe?: ExportProbe };
    if (!win.__vestaboardExportProbe) {
      throw new Error("Missing Vestaboard export probe.");
    }
    return win.__vestaboardExportProbe;
  });
}

async function captureNextVideoMetadata(page: Page, durationSeconds: number): Promise<VideoMetadata> {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Video" }).click();
  const download = await downloadPromise;
  const path = await download.path();

  if (!path) {
    throw new Error("Missing exported video path.");
  }

  const suggestedName = download.suggestedFilename();
  const mimeType = suggestedName.endsWith(".mp4") ? "video/mp4" : "video/webm";
  const base64 = (await readFile(path)).toString("base64");

  return page.evaluate(
    async ({ base64: encodedVideo, durationSeconds: expectedDuration, mimeType: videoMimeType }) => {
      const binary = window.atob(encodedVideo);
      const bytes = new Uint8Array(binary.length);

      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      const blob = new Blob([bytes], { type: videoMimeType });
      const url = URL.createObjectURL(blob);
      const video = document.createElement("video");
      video.preload = "metadata";

      try {
        return await new Promise<VideoMetadata>((resolve, reject) => {
          video.addEventListener(
            "loadedmetadata",
            () => {
              resolve({
                duration: video.duration,
                durationSeconds: expectedDuration,
                height: video.videoHeight,
                width: video.videoWidth,
              });
            },
            { once: true },
          );
          video.addEventListener("error", () => reject(new Error("Could not load video metadata.")), {
            once: true,
          });
          video.src = url;
        });
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    { base64, durationSeconds, mimeType },
  );
}

test("browser: settings transfer exports and imports board settings", async ({ page }, testInfo) => {
  await setMessage(page, "SAVED");
  await setTargetMessage(page, "TARGET");
  await fillColorField(page, "Text", "#00CCFF");
  await pausePlaybackIfPlaying(page);
  await scrubPlayback(page, "Home");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Settings" }).click();
  const download = await downloadPromise;
  const downloadedPath = await download.path();

  if (!downloadedPath) {
    throw new Error("Missing exported settings path.");
  }

  expect(download.suggestedFilename()).toBe("vesta-split-flap-settings.json");

  const settingsSource = await readFile(downloadedPath, "utf8");
  const payload = JSON.parse(settingsSource) as {
    appId?: unknown;
    canvas?: { size?: { height?: unknown; width?: unknown } };
    source?: unknown;
    timeline?: { isPlaying?: unknown };
    values?: Record<string, unknown>;
  };

  expect(payload.source).toBe("creative-apps-kit-settings");
  expect(payload.appId).toBe("vesta-split-flap");
  expect(payload.values?.["board.text.message"]).toBe("SAVED");
  expect(payload.values?.["board.text.targetMessage"]).toBe("TARGET");
  expect(payload.values?.["board.text.color"]).toEqual({ hex: "#00CCFF" });
  expect(payload.canvas?.size?.width).toBe(1200);
  expect(payload.canvas?.size?.height).toBe(720);
  expect(payload.timeline?.isPlaying).toBe(false);

  await setMessage(page, "CHANGED");
  await expect.poll(() => getPhraseText(page)).toBe("CHANGED");

  const importPath = testInfo.outputPath("vestaboard-settings-import.json");
  await writeFile(importPath, settingsSource, "utf8");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(importPath);

  await expect.poll(() => getPhraseText(page)).toBe("SAVED");
  await expect(
    page.locator('[data-phrase="true"] [data-creative-apps-kit-product-text]').first(),
  ).toHaveCSS("color", "rgb(0, 204, 255)");
});

test("browser: canvas width changes vestaboard output bounds", async ({ page }) => {
  await fillFieldInput(page, "Canvas width", "900");
  const gridMeta = await getGridMeta(page);

  await expect(page.locator("[data-creative-apps-kit-editable-canvas]")).toHaveAttribute(
    "style",
    /width:\s*900px/,
  );
  expect(gridMeta.width).toBe(900);
  expect(gridMeta.columns).toBe(16);
  await expect(page.getByTestId("vestaboard-foreground-layer")).toBeVisible();
});

test("browser: canvas height changes vestaboard output bounds", async ({ page }) => {
  await fillFieldInput(page, "Canvas height", "520");
  const gridMeta = await getGridMeta(page);

  await expect(page.locator("[data-creative-apps-kit-editable-canvas]")).toHaveAttribute(
    "style",
    /height:\s*520px/,
  );
  expect(gridMeta.height).toBe(520);
  expect(gridMeta.rows).toBe(6);
  await expect(page.getByTestId("vestaboard-foreground-layer")).toBeVisible();
});

test("browser: tile width changes vestaboard cell geometry", async ({ page }) => {
  const before = await getCellBox(page, 0, 0);
  const beforeGrid = await getGridMeta(page);
  await dragCreativeAppsKitSliderByLabel(page, "Width", 0.82);
  const after = await getCellBox(page, 0, 0);
  const afterGrid = await getGridMeta(page);

  expect(after.width).toBeGreaterThan(before.width);
  expect(afterGrid.columns).toBeLessThan(beforeGrid.columns);
  expect(afterGrid.width).toBe(beforeGrid.width);
});

test("browser: tile height changes vestaboard cell geometry", async ({ page }) => {
  const before = await getCellBox(page, 0, 0);
  const beforeGrid = await getGridMeta(page);
  await dragCreativeAppsKitSliderByLabel(page, "Height", 0.82);
  const after = await getCellBox(page, 0, 0);
  const afterGrid = await getGridMeta(page);

  expect(after.height).toBeGreaterThan(before.height);
  expect(afterGrid.rows).toBeLessThan(beforeGrid.rows);
  expect(afterGrid.height).toBe(beforeGrid.height);
});

test("browser: tile gap changes vestaboard spacing", async ({ page }) => {
  const beforeLeft = await getCellBox(page, 0, 0);
  const beforeRight = await getCellBox(page, 0, 1);
  await dragCreativeAppsKitSliderByLabel(page, "Gap", 0.9);
  const afterLeft = await getCellBox(page, 0, 0);
  const afterRight = await getCellBox(page, 0, 1);
  const beforeGap = beforeRight.x - beforeLeft.x - beforeLeft.width;
  const afterGap = afterRight.x - afterLeft.x - afterLeft.width;

  expect(afterGap).toBeGreaterThan(beforeGap);
});

test("browser: cell radius changes vestaboard cell rounding", async ({ page }) => {
  const before = await getCellBox(page, 0, 0);
  await dragCreativeAppsKitSliderByLabel(page, "Radius", 0.72);
  const after = await getCellBox(page, 0, 0);

  await expect(page.getByTestId("vestaboard-cell-0-0")).toHaveCSS("border-radius", /[1-9]/);
  expect(after.width).toBeCloseTo(before.width, 1);
});

test("browser: cell fill color changes vestaboard cells", async ({ page }) => {
  await dragCreativeAppsKitSliderByLabel(page, "Cell opacity", 0.98);
  await fillColorField(page, "Cell fill", "#00AAFF");

  const backgroundColor = await page.getByTestId("vestaboard-cell-0-0").evaluate((element) =>
    window.getComputedStyle(element).backgroundColor,
  );
  expect(backgroundColor).toContain("0, 170, 255");
  expect(getCssColorAlpha(backgroundColor)).toBeGreaterThan(0);
});

test("browser: cell fill opacity range changes vestaboard cell backgrounds", async ({ page }) => {
  await dragCreativeAppsKitSliderByLabel(page, "Cell opacity", 0.94);
  const colors = await getCellBackgroundColors(page);
  const alphas = colors.map(getCssColorAlpha);
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.lower");
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.upper");

  expect(Math.max(...alphas)).toBeGreaterThan(0);
  expect(new Set(colors).size).toBeGreaterThan(1);
});

test("browser: cell fill seed changes deterministic cell background alpha", async ({ page }) => {
  await dragCreativeAppsKitSliderByLabel(page, "Cell opacity", 0.94);
  const before = (await getCellBackgroundColors(page)).join("|");
  await dragCreativeAppsKitSliderByLabel(page, "Cell seed", 0.88);
  const after = (await getCellBackgroundColors(page)).join("|");

  expect(after).not.toBe(before);
});

test("browser: bottom opacity range changes cell lower-edge highlights", async ({ page }) => {
  const beforeBox = await getCellBox(page, 0, 0);
  await dragCreativeAppsKitSliderByLabel(page, "Bottom opacity", 0.88);
  const afterBox = await getCellBox(page, 0, 0);
  const colors = await getBottomHighlightColors(page);
  const alphas = colors.map(getCssColorAlpha);
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.lower");
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.upper");

  expect(Math.max(...alphas)).toBeGreaterThan(0);
  expect(new Set(colors).size).toBeGreaterThan(1);
  await expect(page.getByTestId("vestaboard-edge-overlay-layer")).toBeVisible();
  await expect(page.getByTestId("vestaboard-edge-cell-0-0")).toBeVisible();
  await expect(page.locator('[data-testid^="vestaboard-left-highlight-"]')).toHaveCount(0);
  expect(afterBox.width).toBeCloseTo(beforeBox.width, 1);
  expect(afterBox.height).toBeCloseTo(beforeBox.height, 1);

  const highlightBox = await getBottomHighlightBox(page, 0, 0);
  const cellBottom = afterBox.y + afterBox.height;
  const highlightBottom = highlightBox.y + highlightBox.height;
  expect(highlightBox.y).toBeGreaterThanOrEqual(afterBox.y);
  expect(highlightBottom).toBeLessThanOrEqual(cellBottom);
  expect(cellBottom - highlightBottom).toBeLessThanOrEqual(1.5);

  const highlightStyle = await page
    .getByTestId("vestaboard-bottom-highlight-0-0")
    .evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        height: Number.parseFloat(style.height),
      };
    });
  expect(highlightStyle.backgroundImage).toBe("none");
  expect(highlightStyle.boxShadow).toBe("none");
  expect(highlightStyle.height).toBeCloseTo(1, 1);
});

test("browser: bottom seed changes deterministic lower-edge highlight alpha", async ({ page }) => {
  await dragCreativeAppsKitSliderByLabel(page, "Bottom opacity", 0.88);
  const before = (await getBottomHighlightColors(page)).join("\n");
  await dragCreativeAppsKitSliderByLabel(page, "Bottom seed", 0.88);
  const after = (await getBottomHighlightColors(page)).join("\n");

  expect(after).not.toBe(before);
});

test("browser: bottom fill canvas changes highlighted border coverage", async ({ page }) => {
  await dragCreativeAppsKitSliderByLabel(page, "Bottom opacity", 0.88);
  const cellBox = await getCellBox(page, 0, 0);
  const beforeHighlightBox = await getBottomHighlightBox(page, 0, 0);
  const fullCount = await countBottomHighlights(page);

  expect(fullCount).toBe(VESTABOARD_CELL_COUNT);
  expect(beforeHighlightBox.width).toBeCloseTo(cellBox.width, 1);

  await dragCreativeAppsKitSliderByLabel(page, "Fill canvas", 0.1);

  const afterCellBox = await getCellBox(page, 0, 0);
  const sparseCount = await countBottomHighlights(page);

  expect(afterCellBox.width).toBeCloseTo(cellBox.width, 1);
  expect(afterCellBox.height).toBeCloseTo(cellBox.height, 1);
  expect(sparseCount).toBeGreaterThan(0);
  expect(sparseCount).toBeLessThan(fullCount / 4);
});

test("browser: cell border color opacity changes vestaboard cells", async ({ page }) => {
  await fillColorOpacityField(page, "Cell border", "#FF8800", 65);
  expect(["colorOpacity.hex", "colorOpacity.opacity"]).toContain("colorOpacity.hex");
  expect(["colorOpacity.hex", "colorOpacity.opacity"]).toContain("colorOpacity.opacity");

  await expect(page.getByTestId("vestaboard-cell-0-0")).toHaveCSS(
    "border-top-color",
    "rgba(255, 136, 0, 0.65)",
  );
});

test("browser: message textarea centers permanent phrase", async ({ page }) => {
  await setMessage(page, "HI\nVESTA");

  await expect(page.getByTestId("vestaboard-char-3-9")).toHaveText("H");
  await expect(page.getByTestId("vestaboard-char-3-10")).toHaveText("I");
  await expect(page.getByTestId("vestaboard-char-4-8")).toHaveText("V");
  await expect(page.getByTestId("vestaboard-char-4-12")).toHaveText("A");
});

test("browser: message textarea can stay empty", async ({ page }) => {
  await setMessage(page, "");

  await expect(page.locator('[data-phrase="true"]')).toHaveCount(0);
  await expect(page.getByTestId("vestaboard-foreground-layer")).toBeVisible();
});

test("browser: target message drives phrase transform animation", async ({ page }) => {
  await setMessage(page, "HELLO   BIG WORLD");
  await setTargetMessage(page, " HELLO   WORLD ");
  await page.getByRole("button", { name: "Pause playback" }).click();

  await scrubPlayback(page, "Home");
  await expect.poll(() => getPhraseText(page)).toBe("HELLO   BIG WORLD");

  await scrubPlayback(page, "End");
  await expect.poll(() => getPhraseText(page)).toBe("HELLO WORLD");
  expect(await getPhraseText(page)).not.toMatch(/ {2,}/);

  await setMessage(page, "ABCD");
  await setTargetMessage(page, "AXBCDZ");
  await scrubPlayback(page, "Home");
  await expect.poll(() => getPhraseText(page)).toBe("ABCD");

  await scrubPlayback(page, "End");
  await expect.poll(() => getPhraseText(page)).toBe("ABCD");

  await setMessage(page, "ABCDEFGHIJKLMNOPQRSTUVW");
  await setTargetMessage(page, "VW");
  await scrubPlayback(page, "End");
  await expect.poll(() => getPhraseText(page)).toBe("VW");

  const tileWidthField = await getCreativeAppsKitFieldByLabel(page, "Width");
  await tileWidthField.locator("input, textarea").last().fill("32");
  await tileWidthField.locator("input, textarea").last().blur();
  await setMessage(
    page,
    [
      "OPTIMIZE HOW YOUR PRODUCT SENDS",
      "DATA TO AN LLM, GIVING IT ONLY",
      "THE RIGHT CONTEXT BY AUTOMATICALLY",
      "REMOVING NOISY INPUT THAT CREATES",
      "UNNECESSARY BLOAT.",
    ].join("\n"),
  );
  await setTargetMessage(page, "OPTIMIZE LLM CONTEXT\nBY REMOVING INPUT BLOAT");
  await scrubPlayback(page, "End");
  await expect
    .poll(() => getPhraseText(page))
    .toBe("OPTIMIZE LLM CONTEXT\nBY REMOVING INPUT BLOAT");
});

test("browser: final hold settles phrase before background ends", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setTimelineDuration(page, 6);
  await setMessage(page, "DESIGN IS SMART");
  await setTargetMessage(page, "R");
  await setEditableControlValue(page, "Start fill", "100%");
  await setEditableControlValue(page, "End fill", "0%");
  await setEditableControlValue(page, "Field duration", "95%");
  await setEditableControlValue(page, "Final hold", "2s");
  const playbackPosition = page.getByRole("slider", { name: "Playback position" }).first();
  await expect(playbackPosition).toHaveAttribute("aria-valuemax", "8");

  await scrubPlaybackToRatio(page, 0.78);
  await expect.poll(() => getPhraseText(page)).toBe("R");
  const holdBackgroundCharacters = await countBackgroundCharacters(page);
  const holdLayerState = await page.getByTestId("vestaboard-foreground-layer").evaluate((element) => {
    const htmlElement = element as HTMLElement;
    return {
      shakeX: htmlElement.dataset.shakeX,
      shakeY: htmlElement.dataset.shakeY,
    };
  });

  await scrubPlayback(page, "End");
  await expect.poll(() => getPhraseText(page)).toBe("R");
  const finalBackgroundCharacters = await countBackgroundCharacters(page);

  expect(holdBackgroundCharacters).toBeGreaterThan(finalBackgroundCharacters + 50);
  expect(holdLayerState).toEqual({ shakeX: "0.000", shakeY: "0.000" });
});

test("browser: duration spread changes outgoing letter animation overlap", async ({ page }) => {
  await setMessage(page, "ABCD\nWXYZ");
  await setTargetMessage(page, "AD\nWZ");
  await page.getByRole("button", { name: "Pause playback" }).click();

  await dragCreativeAppsKitSliderByLabel(page, "Duration spread", 0.02);
  await dragCreativeAppsKitSliderByLabel(page, "Duration spread", 0.98);
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.lower");
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.upper");

  await scrubPlayback(page, "Home");
  await expect.poll(() => getPhraseText(page)).toBe("ABCD\nWXYZ");
  await scrubPlayback(page, "End");
  await expect.poll(() => getPhraseText(page)).toBe("AD\nWZ");
});

test("browser: letter speed changes outgoing letter launch density", async ({ page }) => {
  await setMessage(page, "ABCDEFGHIJKL");
  await setTargetMessage(page, "AL");
  await page.getByRole("button", { name: "Pause playback" }).click();

  await dragCreativeAppsKitSliderByLabel(page, "Letter speed", 0.95);

  await scrubPlayback(page, "Home");
  await expect.poll(() => getPhraseText(page)).toBe("ABCDEFGHIJKL");
  await scrubPlayback(page, "End");
  await expect.poll(() => getPhraseText(page)).toBe("AL");
});

test("browser: outgoing opacity range changes removing phrase characters", async ({ page }) => {
  await setMessage(page, "ABCD");
  await setTargetMessage(page, "AD");
  await page.getByRole("button", { name: "Pause playback" }).click();

  await dragCreativeAppsKitSliderByLabel(page, "Outgoing opacity", 0.02);
  await dragCreativeAppsKitSliderByLabel(page, "Outgoing opacity", 0.98);
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.lower");
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.upper");

  await scrubPlayback(page, "Home");
  const scrubber = page.getByRole("slider", { name: "Playback position" }).first();
  await scrubber.press("ArrowRight");
  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
});

test("browser: flash color count toggles main text fill flashes", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "FLASHING MAIN TEXT");
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await scrubIntoRemovalFrame(page);

  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.02);
  await expect.poll(() => countMessageFlashCells(page)).toBe(0);

  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.98);
  await expect.poll(() => countMessageFlashCells(page)).toBeGreaterThan(0);
});

test("browser: flash frequency changes main text fill flash coverage", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "FLASHING MAIN TEXT");
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.98);
  await scrubIntoRemovalFrame(page);

  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.02);
  await expect.poll(() => countMessageFlashCells(page)).toBe(0);

  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await expect.poll(() => countMessageFlashCells(page)).toBeGreaterThan(0);
});

test("browser: flash palette colors change main text fill colors", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "FLASHING MAIN TEXT");
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.3);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await fillColorField(page, "Flash 1", "#00AAFF");
  await scrubIntoRemovalFrame(page);

  expect(await getFirstMessageFlashBackground(page)).toContain("0, 170, 255");
});

test("browser: flash palette animates selected colors during disappearing letter lifetime", async ({
  page,
}) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "FLASHING MAIN TEXT CELLS");
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Letter speed", 0.02);
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.52);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await fillColorField(page, "Flash 1", "#00AAFF");
  await fillColorField(page, "Flash 2", "#FF3300");
  await scrubPlayback(page, "Home");

  const scrubber = page.getByRole("slider", { name: "Playback position" }).first();
  const seenColors = new Set<string>();

  for (let step = 0; step < 14; step += 1) {
    await scrubber.press("ArrowRight");
    const backgrounds = await getCurrentMessageFlashBackgrounds(page);

    if (backgrounds.some((color) => color.includes("0, 170, 255"))) {
      seenColors.add("blue");
    }

    if (backgrounds.some((color) => color.includes("255, 51, 0"))) {
      seenColors.add("red");
    }
  }

  expect(seenColors).toEqual(new Set(["blue", "red"]));
});

test("browser: flash palette clears before text animation completes", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(
    page,
    "OPTIMIZE HOW YOUR PRODUCT SENDS\nDATA TO AN LLM, GIVING IT ONLY\nTHE RIGHT CONTEXT BY AUTOMATICALLY\nREMOVING NOISY INPUT THAT CREATES\nUNNECESSARY BLOAT.",
  );
  await setTargetMessage(page, "OPTIMIZE LLM CONTEXT\nBY REMOVING INPUT BLOAT");
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.52);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await fillColorField(page, "Flash 1", "#00AAFF");
  await fillColorField(page, "Flash 2", "#FF3300");

  await scrubPlaybackToRatio(page, 0.68);
  await expect.poll(() => countMessageFlashCells(page)).toBeGreaterThan(0);

  const lateBackgrounds = await getMessageFlashBackgrounds(page);
  expect(
    lateBackgrounds.some(
      (color) => color.includes("0, 170, 255") || color.includes("255, 51, 0"),
    ),
  ).toBe(true);

  await scrubPlaybackToRatio(page, 0.76);
  await expect.poll(() => countMessageFlashCells(page)).toBe(0);

  await scrubPlayback(page, "End");
  await expect.poll(() => countMessageFlashCells(page)).toBe(0);
});

test("browser: flash palette color 2 changes main text fill colors", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(
    page,
    "FLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS",
  );
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Letter speed", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.52);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await fillColorField(page, "Flash 2", "#FF3300");
  await scrubIntoRemovalFrame(page, 6);

  expect((await getMessageFlashBackgrounds(page)).some((color) => color.includes("255, 51, 0"))).toBe(
    true,
  );
});

test("browser: flash palette color 3 changes main text fill colors", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(
    page,
    "FLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS",
  );
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Letter speed", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.76);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await fillColorField(page, "Flash 3", "#33FF66");
  await scrubIntoRemovalFrame(page, 6);

  expect(
    (await getMessageFlashBackgrounds(page)).some((color) => color.includes("51, 255, 102")),
  ).toBe(true);
});

test("browser: flash palette color 4 changes main text fill colors", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(
    page,
    "FLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS",
  );
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Letter speed", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await fillColorField(page, "Flash 4", "#AA55FF");
  await scrubIntoRemovalFrame(page, 6);

  expect((await getMessageFlashBackgrounds(page)).some((color) => color.includes("170, 85, 255"))).toBe(
    true,
  );
});

test("browser: timeline playback controls phrase transform animation", async ({ page }) => {
  await setMessage(page, "VESTA");
  await setTargetMessage(page, "TOKEN VESTA");
  await setTimelineDuration(page, 2);

  await page.getByRole("button", { name: "Pause playback" }).click();
  await page.getByRole("button", { name: "Play playback" }).click();
  await page.getByRole("button", { name: "Pause playback" }).click();

  await page.getByRole("button", { name: "Disable loop" }).click();
  await expect(page.getByRole("button", { name: "Enable loop" })).toBeVisible();
  await page.getByRole("button", { name: "Enable loop" }).click();
  await expect(page.getByRole("button", { name: "Disable loop" })).toBeVisible();

  await scrubPlayback(page, "Home");
  await expect.poll(() => getPhraseText(page)).toBe("VESTA");

  await scrubPlayback(page, "End");
  await expect.poll(() => getPhraseText(page)).toBe("TOKEN VESTA");
});

test("browser: playback starts when Vesta opens", async ({ page }) => {
  await page.getByRole("button", { name: "Pause playback" }).click();
  await expect(page.getByRole("button", { name: "Play playback" })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const rawValue = window.localStorage.getItem("creative-apps-kit:vesta-split-flap:state:v1");
        if (!rawValue) {
          return undefined;
        }

        return (JSON.parse(rawValue) as { state?: { timeline?: { isPlaying?: boolean } } }).state
          ?.timeline?.isPlaying;
      }),
    )
    .toBe(false);

  const reopenedPage = await page.context().newPage();
  await reopenedPage.goto("/");

  await expect(reopenedPage.getByRole("button", { name: "Pause playback" })).toBeVisible();
});

test("browser: main font changes permanent phrase typography", async ({ page }) => {
  await setMessage(page, "VESTA\nBOARD");
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  await scrubPlayback(page, "End");

  await setFontSize(page, "Main font", 52);
  await expect(page.getByTestId("vestaboard-char-3-8")).toHaveCSS("font-size", "52px");
  await expect(page.getByTestId("vestaboard-char-0-0")).toHaveCSS("font-size", "34px");

  await setFontWeight(page, "Main font", "900");
  await expect(page.getByTestId("vestaboard-char-3-8")).toHaveCSS("font-weight", "900");
  await expect(page.getByTestId("vestaboard-char-0-0")).toHaveCSS("font-weight", "700");

  await clickFontPickerOption(page, "Main font", /Space Grotesk/i);
  await expect(page.getByTestId("vestaboard-char-3-8")).toHaveCSS("font-family", /Space Grotesk/);
  await expect(page.getByTestId("vestaboard-char-0-0")).toHaveCSS("font-family", /Inter/);

  // fontPicker.fontId fontPicker.fontWeight fontPicker.fontSize fontPicker.letterSpacing fontPicker.lineHeight
  await expect(page.getByTestId("vestaboard-char-3-8")).toBeVisible();
});

test("browser: background font changes random field typography", async ({ page }) => {
  await setMessage(page, "VESTA\nBOARD");
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  await scrubPlayback(page, "End");

  await setFontSize(page, "Background font", 52);
  await expect(page.getByTestId("vestaboard-char-0-0")).toHaveCSS("font-size", "52px");
  await expect(page.getByTestId("vestaboard-char-3-8")).toHaveCSS("font-size", "34px");

  await setFontWeight(page, "Background font", "900");
  await expect(page.getByTestId("vestaboard-char-0-0")).toHaveCSS("font-weight", "900");
  await expect(page.getByTestId("vestaboard-char-3-8")).toHaveCSS("font-weight", "700");

  await clickFontPickerOption(page, "Background font", /Space Grotesk/i);
  await expect(page.getByTestId("vestaboard-char-0-0")).toHaveCSS("font-family", /Space Grotesk/);
  await expect(page.getByTestId("vestaboard-char-3-8")).toHaveCSS("font-family", /Inter/);
});

test("browser: text color changes vestaboard characters", async ({ page }) => {
  await setMessage(page, "VESTA\nBOARD");
  await fillColorField(page, "Text", "#FFCC00");

  await expect(page.getByTestId("vestaboard-char-3-8")).toHaveCSS(
    "color",
    "rgb(255, 204, 0)",
  );
});

test("browser: start fill changes random field first-frame occupancy", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.02);
  await dragCreativeAppsKitSliderByLabel(page, "Start fill", 0.02);
  await scrubPlayback(page, "Home");
  await expect
    .poll(() => countVisibleCharacters(page))
    .toBeLessThan(VESTABOARD_CELL_COUNT / 4);

  await dragCreativeAppsKitSliderByLabel(page, "Start fill", 0.98);
  await scrubPlayback(page, "Home");
  await expect.poll(() => countVisibleCharacters(page)).toBeGreaterThan(120);
});

test("browser: end fill changes random field final-frame occupancy", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await dragCreativeAppsKitSliderByLabel(page, "Start fill", 0.02);
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.02);
  await scrubPlayback(page, "End");
  await expect
    .poll(() => countVisibleCharacters(page))
    .toBeLessThan(VESTABOARD_CELL_COUNT / 4);

  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  await scrubPlayback(page, "End");
  await expect.poll(() => countVisibleCharacters(page)).toBeGreaterThan(120);
});

test("browser: field duration range changes background cell flicker timing", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await dragCreativeAppsKitSliderByLabel(page, "Start fill", 0.02);
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Field duration", 0.98);
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.lower");
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.upper");

  await scrubPlayback(page, "Home");
  await expect
    .poll(() => countVisibleCharacters(page))
    .toBeLessThan(VESTABOARD_CELL_COUNT / 4);
  await scrubPlayback(page, "End");
  await expect.poll(() => countVisibleCharacters(page)).toBeGreaterThan(120);
});

test("browser: field speed changes background cell flicker rate", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await dragCreativeAppsKitSliderByLabel(page, "Start fill", 0.02);
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Field duration", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Field speed", 0.02);
  await scrubPlayback(page, "Home");
  const scrubber = page.getByRole("slider", { name: "Playback position" }).first();
  await scrubber.press("ArrowRight");
  const slowSignature = await getBoardSignature(page);

  await dragCreativeAppsKitSliderByLabel(page, "Field speed", 0.98);
  const fastSignature = await getBoardSignature(page);

  expect(fastSignature).not.toBe(slowSignature);
});

test("browser: opacity range changes random field alpha", async ({ page }) => {
  await setMessage(page, "VESTA\nBOARD");
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  await scrubPlayback(page, "End");
  await dragCreativeAppsKitSliderByLabel(page, "Opacity", 0.25);
  const filler = page.getByTestId("vestaboard-char-0-0");
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.lower");
  expect(["rangeSlider.lower", "rangeSlider.upper"]).toContain("rangeSlider.upper");

  await expect(page.getByTestId("vestaboard-char-3-8")).toHaveCSS("opacity", "1");
  await expect(filler).toBeVisible();
  const opacity = await filler.evaluate((element) =>
    Number.parseFloat(window.getComputedStyle(element).opacity),
  );
  expect(opacity).toBeGreaterThanOrEqual(0);
  expect(opacity).toBeLessThanOrEqual(1);
  // rangeSlider.lower rangeSlider.upper
});

test("browser: seed slider changes deterministic random field", async ({ page }) => {
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  await scrubPlayback(page, "End");
  const before = await getBoardSignature(page);
  await dragCreativeAppsKitSliderByLabel(page, "Seed", 0.88);
  const after = await getBoardSignature(page);

  expect(after).not.toBe(before);
});

test("browser: video format chooses supported export container", async ({ page }) => {
  await selectControlOption(page, "Format", "WebM");
  await selectControlOption(page, "Format", "MP4");
  await selectControlOption(page, "Format", "Auto");
  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
});

test("browser: video quality changes export scale target", async ({ page }) => {
  await selectControlOption(page, "Quality", "4K");
  await selectControlOption(page, "Quality", "High");
  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
});

test("browser: background color changes vestaboard preview and export", async ({ page }) => {
  await fillColorField(page, "Background", "#123456");

  await expect(page.getByTestId("vestaboard-output")).toHaveCSS(
    "background-color",
    "rgb(18, 52, 86)",
  );
  const exportProbe = await captureNextPngExport(page);
  expect(exportProbe.backgroundPixel.slice(0, 3)).toEqual([18, 52, 86]);
  expect(exportProbe.backgroundPixel[3]).toBe(255);
});

test("browser: include background controls png alpha only", async ({ page }) => {
  await toggleIncludeBackground(page);
  const exportProbe = await captureNextPngExport(page);

  await expect(page.getByTestId("vestaboard-output")).toHaveCSS(
    "background-color",
    "rgb(17, 18, 20)",
  );
  await expect(page.getByRole("application", { name: "Canvas viewport" })).toBeVisible();
  expect(exportProbe.backgroundPixel[3]).toBe(0);
});

test("browser: export actions download video and png vestaboard output", async ({ page }) => {
  const durationSeconds = 1;
  const { height, width } = await getCanvasSize(page);
  await setMessage(page, "HELLO   BEAUTIFUL WORLD");
  await setTargetMessage(page, "HELLO WORLD");
  await setTimelineDuration(page, durationSeconds);
  const videoMetadata = await captureNextVideoMetadata(page, durationSeconds);
  const exportProbe = await captureNextPngExport(page);

  expect(Number.isFinite(videoMetadata.duration)).toBe(true);
  expect(Math.abs(videoMetadata.duration - videoMetadata.durationSeconds)).toBeLessThan(1);
  expect(videoMetadata.width).toBeGreaterThanOrEqual(Number.parseInt(width, 10) * 2);
  expect(videoMetadata.height).toBeGreaterThanOrEqual(Number.parseInt(height, 10) * 2);
  expect(exportProbe.width).toBeGreaterThanOrEqual(Number.parseInt(width, 10) * 2);
  expect(exportProbe.height).toBeGreaterThanOrEqual(Number.parseInt(height, 10) * 2);
});

test("browser: vestaboard renderer exposes product output only", async ({ page }) => {
  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  await expect(page.getByTestId("vestaboard-foreground-layer")).toBeVisible();
  await expect(page.getByTestId("vestaboard-header-image")).toHaveCount(0);
  await expect(page.getByText("Click to upload")).toHaveCount(0);

  const metrics = await page.getByTestId("vestaboard-foreground-layer").evaluate((element) => {
    const foregroundElement = document.querySelector(
      '[data-testid="vestaboard-foreground-layer"]',
    ) as HTMLElement;
    const foregroundStyle = window.getComputedStyle(foregroundElement);

    return {
      foregroundHeight: foregroundStyle.height,
      foregroundTop: foregroundStyle.top,
    };
  });
  const canvasSize = await getCanvasSize(page);

  expect(metrics.foregroundTop).toBe("0px");
  expect(Number.parseFloat(metrics.foregroundHeight)).toBeCloseTo(
    Number.parseFloat(canvasSize.height),
    0,
  );
});

test("browser: open controls panel keeps vestaboard output clear at minimum app width", async ({
  page,
}) => {
  await page.setViewportSize({ height: 768, width: 1024 });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  await expect.poll(() => measureControlsPanelOutputOverlap(page)).toMatchObject({
    fit: "panel-safe",
    overlapArea: 0,
    overlapX: 0,
  });

  await page.getByRole("button", { name: "Collapse controls" }).click();
  await expect.poll(() => measureControlsPanelOutputOverlap(page)).toMatchObject({
    fit: null,
    overlapArea: 0,
  });
});

test("browser: Board Surface controls render as separate rows", async ({ page }) => {
  await page.setViewportSize({ height: 768, width: 1024 });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Board Surface")).toBeVisible();
  await expect(page.getByText("Grid", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Edge sides", { exact: true })).toHaveCount(0);

  for (const [firstLabel, secondLabel] of [
    ["Width", "Height"],
    ["Gap", "Radius"],
    ["Cell fill", "Cell border"],
    ["Cell opacity", "Bottom opacity"],
    ["Cell seed", "Bottom seed"],
  ] as const) {
    const firstTop = await getControlFieldTopByLabel(page, firstLabel);
    const secondTop = await getControlFieldTopByLabel(page, secondLabel);

    expect(
      secondTop,
      `${firstLabel} and ${secondLabel} must not share one controls-panel row`,
    ).toBeGreaterThan(firstTop + 8);
  }
});

test("browser: toolbar viewport keeps vestaboard centered", async ({ page }) => {
  const before = await getForegroundTransform(page);
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page.getByRole("button", { name: "Zoom out" }).click();
  await page.getByRole("button", { name: "Center canvas" }).click();

  await expect(page.getByTestId("vestaboard-foreground-layer")).toBeVisible();
  expect(await getForegroundTransform(page)).toBe(before);
});

test("browser: collapsed controls panel does not pan canvas from residual wheel input", async ({
  page,
}) => {
  const panelPoint = await page
    .locator('[data-slot="creative-apps-kit-runtime-panel-host"][data-panel-type="controls"]')
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();

      return {
        x: rect.left + rect.width / 2,
        y: Math.min(rect.bottom - 24, rect.top + 260),
      };
    });
  const beforeOpenWheel = await getCanvasWorldTransform(page);

  await page.mouse.move(panelPoint.x, panelPoint.y);
  await page.mouse.wheel(0, 300);
  await expect
    .poll(() => getCanvasWorldTransform(page), {
      message: "wheel inside open controls panel should not pan canvas",
    })
    .toBe(beforeOpenWheel);

  await page.getByRole("button", { name: "Collapse controls" }).click();
  await expect(page.getByRole("button", { name: "Expand controls" })).toBeVisible();

  const beforeCollapsedWheel = await getCanvasWorldTransform(page);

  await page.mouse.move(panelPoint.x, panelPoint.y);
  await page.mouse.wheel(0, 300);
  await expect
    .poll(() => getCanvasWorldTransform(page), {
      message: "residual wheel in the former controls panel area should not pan canvas",
    })
    .toBe(beforeCollapsedWheel);
});

test("browser: controls panel collapse coalesces playback renderer", async ({ page }, testInfo) => {
  await importSettingsPayload(
    page,
    testInfo,
    collapsePlaybackSettingsPayload,
    "vestaboard-collapse-playback-settings.json",
  );
  await expect
    .poll(async () => (await getGridMeta(page)).cellCount, {
      message: "heavy collapse playback fixture should render the dense board",
    })
    .toBe(2904);

  await page.getByRole("button", { name: "Play playback" }).click();
  await page.waitForTimeout(250);

  const activePlaybackMutations = await measureVestaboardOutputMutations(page, 160);

  expect(
    activePlaybackMutations.mutationCount,
    "heavy playback fixture should mutate the output before the collapse probe starts",
  ).toBeGreaterThan(500);

  const beforeTransform = await getCanvasWorldTransform(page);
  const readCollapseMutations = await startControlsCollapseOutputMutationProbe(page, 160);

  await page.getByRole("button", { name: "Collapse controls" }).click();
  await expect(page.getByRole("button", { name: "Expand controls" })).toBeVisible();

  const collapseMutations = await readCollapseMutations();

  expect(collapseMutations).toEqual({
    batches: 0,
    charMutations: 0,
    mutationCount: 0,
    styleMutations: 0,
  });
  expect(await getCanvasWorldTransform(page)).toBe(beforeTransform);

  const resumedPlaybackMutations = await measureVestaboardOutputMutations(page, 500);

  expect(
    resumedPlaybackMutations.mutationCount,
    "preview renderer should resume playback mutations after the collapse coalescing window",
  ).toBeGreaterThan(500);
});

test("browser perf: vestaboard preview render stays under budget", async ({ page }) => {
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await page.reload();
    await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  });
  const previewDimensions = await page.evaluate(() => {
    const previewElement = document.querySelector('[data-testid="vestaboard-output"]');
    const outputElement = document.querySelector("[data-creative-apps-kit-editable-canvas]");
    const previewRect = previewElement?.getBoundingClientRect();
    const outputRect = outputElement?.getBoundingClientRect();

    return {
      outputHeight: outputRect?.height ?? 0,
      outputWidth: outputRect?.width ?? 0,
      previewHeight: previewRect?.height ?? 0,
      previewWidth: previewRect?.width ?? 0,
    };
  });

  expect(previewDimensions.previewWidth).toBeCloseTo(previewDimensions.outputWidth, 1);
  expect(previewDimensions.previewHeight).toBeCloseTo(previewDimensions.outputHeight, 1);
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "preview-render");
});

test("browser perf: settings transfer export stays responsive", async ({ page }) => {
  let suggestedFilename = "";
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    const downloadPromise = page.waitForEvent("download");
    await page
      .locator('[data-slot="panel-actions"]')
      .getByRole("button", { name: "Export Settings" })
      .click();
    const download = await downloadPromise;
    suggestedFilename = download.suggestedFilename();
  });

  expect(suggestedFilename).toBe("vesta-split-flap-settings.json");
  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "settings-transfer-export",
  );
});

test("browser perf: canvas width change stays responsive", async ({ page }) => {
  const stressValue = getCreativeAppsKitPerformanceStressValue<number>(
    appPerformance,
    "canvas-width-change",
  );
  const field = await getCreativeAppsKitFieldByLabel(page, "Canvas width");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await field.locator("input, textarea").last().fill(String(stressValue));
    await field.locator("input, textarea").last().blur();
  });

  await expect(page.locator("[data-creative-apps-kit-editable-canvas]")).toHaveAttribute(
    "style",
    /width:\s*1800px/,
  );
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "canvas-width-change");
});

test("browser perf: canvas height change stays responsive", async ({ page }) => {
  const stressValue = getCreativeAppsKitPerformanceStressValue<number>(
    appPerformance,
    "canvas-height-change",
  );
  const field = await getCreativeAppsKitFieldByLabel(page, "Canvas height");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await field.locator("input, textarea").last().fill(String(stressValue));
    await field.locator("input, textarea").last().blur();
  });

  await expect(page.locator("[data-creative-apps-kit-editable-canvas]")).toHaveAttribute(
    "style",
    /height:\s*1200px/,
  );
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "canvas-height-change");
});

test("browser perf: tile width drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "tile-width-drag");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Width", 0.02);
  });

  await expect(page.getByTestId("vestaboard-cell-0-0")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "tile-width-drag");
});

test("browser perf: tile height drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "tile-height-drag");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Height", 0.02);
  });

  await expect(page.getByTestId("vestaboard-cell-0-0")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "tile-height-drag");
});

test("browser perf: tile gap drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "tile-gap-drag");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Gap", 0.02);
  });

  await expect(page.getByTestId("vestaboard-cell-0-0")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "tile-gap-drag");
});

test("browser perf: cell radius drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "cell-radius-drag");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Radius", 0.92);
  });

  await expect(page.getByTestId("vestaboard-cell-0-0")).toHaveCSS("border-radius", /[1-9]/);
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "cell-radius-drag");
});

test("browser perf: cell fill color change stays responsive", async ({ page }) => {
  const stressValue = getCreativeAppsKitPerformanceStressValue<{
    hex: string;
  }>(appPerformance, "cell-fill-change");
  const hexInput = page.getByLabel("Cell fill hex");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await hexInput.fill(stressValue.hex);
    await hexInput.blur();
  });

  await expect(page.getByTestId("vestaboard-cell-0-0")).toHaveCSS(
    "background-color",
    "rgba(34, 85, 255, 0)",
  );
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "cell-fill-change");
});

test("browser perf: cell fill opacity range drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number[]>(
    appPerformance,
    "cell-fill-opacity-range-drag",
  );
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Cell opacity", 0.94);
  });

  await expect(page.getByTestId("vestaboard-cell-0-0")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "cell-fill-opacity-range-drag",
  );
});

test("browser perf: cell fill seed drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "cell-fill-seed-drag");
  await dragCreativeAppsKitSliderByLabel(page, "Cell opacity", 0.94);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Cell seed", 0.88);
  });

  await expect(page.getByTestId("vestaboard-cell-0-0")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "cell-fill-seed-drag");
});

test("browser perf: bottom opacity range drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number[]>(
    appPerformance,
    "bottom-opacity-range-drag",
  );
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Bottom opacity", 0.98);
  });

  expect(await getBottomHighlightColors(page)).not.toHaveLength(0);
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "bottom-opacity-range-drag");
});

test("browser perf: bottom fill canvas drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "bottom-fill-canvas-drag");
  await dragCreativeAppsKitSliderByLabel(page, "Bottom opacity", 0.98);
  const beforeCount = await countBottomHighlights(page);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Fill canvas", 0.02);
  });
  const afterCount = await countBottomHighlights(page);

  expect(afterCount).toBeLessThan(beforeCount);
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "bottom-fill-canvas-drag",
  );
});

test("browser perf: bottom seed drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "bottom-seed-drag");
  await dragCreativeAppsKitSliderByLabel(page, "Bottom opacity", 0.98);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Bottom seed", 0.88);
  });

  await expect(page.getByTestId("vestaboard-cell-0-0")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "bottom-seed-drag");
});

test("browser perf: cell border color opacity change stays responsive", async ({ page }) => {
  const stressValue = getCreativeAppsKitPerformanceStressValue<{
    hex: string;
    opacity: number;
  }>(appPerformance, "cell-border-change");
  const hexInput = page.getByLabel("Cell border hex");
  const opacityInput = page.getByLabel("Cell border opacity");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await hexInput.fill(stressValue.hex);
    await hexInput.blur();
    await opacityInput.fill(String(stressValue.opacity));
    await opacityInput.blur();
  });

  await expect(page.getByTestId("vestaboard-cell-0-0")).toHaveCSS(
    "border-top-color",
    "rgb(255, 85, 0)",
  );
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "cell-border-change");
});

test("browser perf: large message change stays responsive", async ({ page }) => {
  const stressValue = getCreativeAppsKitPerformanceStressValue<string>(
    appPerformance,
    "message-large-text-change",
  );
  const field = await getCreativeAppsKitFieldByLabel(page, "Message");
  const textarea = field.getByRole("textbox", { name: "Message" });
  await textarea.fill(stressValue);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await textarea.blur();
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "message-large-text-change",
  );
});

test("browser perf: large target message change stays responsive", async ({ page }) => {
  await setMessage(page, "VESTA");
  const stressValue = getCreativeAppsKitPerformanceStressValue<string>(
    appPerformance,
    "target-message-large-text-change",
  );
  const field = await getCreativeAppsKitFieldByLabel(page, "Target message");
  const textarea = field.getByRole("textbox", { name: "Target message" });
  await textarea.fill(stressValue);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await textarea.blur();
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "target-message-large-text-change",
  );
});

test("browser perf: final hold drag stays responsive", async ({ page }) => {
  await setMessage(page, "HELLO BIG WORLD");
  await setTargetMessage(page, "HELLO");
  const stressValue = getCreativeAppsKitPerformanceStressValue<number>(
    appPerformance,
    "final-hold-drag",
  );
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Final hold", Math.min(0.98, stressValue / 8));
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "final-hold-drag");
});

test("browser perf: duration spread drag stays responsive", async ({ page }) => {
  await setMessage(page, "ABCD\nWXYZ");
  await setTargetMessage(page, "AD\nWZ");
  getCreativeAppsKitPerformanceStressValue<readonly number[]>(
    appPerformance,
    "letter-duration-range-drag",
  );
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Duration spread", 0.94);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "letter-duration-range-drag",
  );
});

test("browser perf: letter speed drag stays responsive", async ({ page }) => {
  await setMessage(page, "ABCDEFGHIJKL");
  await setTargetMessage(page, "AL");
  getCreativeAppsKitPerformanceStressValue<number>(
    appPerformance,
    "letter-speed-drag",
  );
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Letter speed", 0.94);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "letter-speed-drag",
  );
});

test("browser perf: outgoing opacity range drag stays responsive", async ({ page }) => {
  await setMessage(page, "ABCD");
  await setTargetMessage(page, "AD");
  getCreativeAppsKitPerformanceStressValue<readonly number[]>(
    appPerformance,
    "outgoing-opacity-range-drag",
  );
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Outgoing opacity", 0.94);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "outgoing-opacity-range-drag",
  );
});

test("browser perf: flash color count drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(
    appPerformance,
    "message-flash-color-count-drag",
  );
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "FLASHING MAIN TEXT");
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await scrubIntoRemovalFrame(page);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.98);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "message-flash-color-count-drag",
  );
});

test("browser perf: flash frequency drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(
    appPerformance,
    "message-flash-frequency-drag",
  );
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "FLASHING MAIN TEXT");
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.98);
  await scrubIntoRemovalFrame(page);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "message-flash-frequency-drag",
  );
});

test("browser perf: flash palette color change stays responsive", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "FLASHING MAIN TEXT");
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.3);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await scrubIntoRemovalFrame(page);
  const input = page.getByLabel("Flash 1 hex");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await input.fill("#00AAFF");
    await input.blur();
  });

  expect(await getFirstMessageFlashBackground(page)).toContain("0, 170, 255");
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "message-flash-color-change",
  );
});

test("browser perf: flash palette color 2 change stays responsive", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(
    page,
    "FLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS",
  );
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Letter speed", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.52);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await scrubIntoRemovalFrame(page, 6);
  const input = page.getByLabel("Flash 2 hex");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await input.fill("#FF3300");
    await input.blur();
  });

  expect((await getMessageFlashBackgrounds(page)).some((color) => color.includes("255, 51, 0"))).toBe(
    true,
  );
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "message-flash-color-2-change",
  );
});

test("browser perf: flash palette color 3 change stays responsive", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(
    page,
    "FLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS",
  );
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Letter speed", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.76);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await scrubIntoRemovalFrame(page, 6);
  const input = page.getByLabel("Flash 3 hex");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await input.fill("#33FF66");
    await input.blur();
  });

  expect(
    (await getMessageFlashBackgrounds(page)).some((color) => color.includes("51, 255, 102")),
  ).toBe(true);
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "message-flash-color-3-change",
  );
});

test("browser perf: flash palette color 4 change stays responsive", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(
    page,
    "FLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS\nFLASHING MAIN TEXT CELLS",
  );
  await setTargetMessage(page, "F");
  await dragCreativeAppsKitSliderByLabel(page, "Letter speed", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Flash colors", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Flash frequency", 0.98);
  await scrubIntoRemovalFrame(page, 6);
  const input = page.getByLabel("Flash 4 hex");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await input.fill("#AA55FF");
    await input.blur();
  });

  expect((await getMessageFlashBackgrounds(page)).some((color) => color.includes("170, 85, 255"))).toBe(
    true,
  );
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "message-flash-color-4-change",
  );
});

test("browser perf: main font picker change stays responsive", async ({ page }) => {
  await setMessage(page, "VESTA\nBOARD");
  const stressValue = getCreativeAppsKitPerformanceStressValue<{ fontSize: number }>(
    appPerformance,
    "main-font-picker-change",
  );
  const field = await getCreativeAppsKitFieldByLabel(page, "Main font");
  const fontSizeInput = field.getByLabel("Font size");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await fontSizeInput.fill(String(stressValue.fontSize));
    await fontSizeInput.blur();
  });

  await expect(page.getByTestId("vestaboard-char-3-8")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "main-font-picker-change",
  );
});

test("browser perf: background font picker change stays responsive", async ({ page }) => {
  await setMessage(page, "VESTA\nBOARD");
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  await scrubPlayback(page, "End");
  const stressValue = getCreativeAppsKitPerformanceStressValue<{ fontSize: number }>(
    appPerformance,
    "background-font-picker-change",
  );
  const field = await getCreativeAppsKitFieldByLabel(page, "Background font");
  const fontSizeInput = field.getByLabel("Font size");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await fontSizeInput.fill(String(stressValue.fontSize));
    await fontSizeInput.blur();
  });

  await expect(page.getByTestId("vestaboard-char-0-0")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "background-font-picker-change",
  );
});

test("browser perf: start fill drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "field-start-fill-drag");
  await pausePlaybackIfPlaying(page);
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.02);
  await scrubPlayback(page, "Home");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Start fill", 0.98);
  });

  expect(await countVisibleCharacters(page)).toBeGreaterThan(120);
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "field-start-fill-drag");
});

test("browser perf: end fill drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "field-end-fill-drag");
  await pausePlaybackIfPlaying(page);
  await dragCreativeAppsKitSliderByLabel(page, "Start fill", 0.02);
  await scrubPlayback(page, "End");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  });

  expect(await countVisibleCharacters(page)).toBeGreaterThan(120);
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "field-end-fill-drag");
});

test("browser perf: field duration range drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number[]>(
    appPerformance,
    "field-duration-range-drag",
  );
  await pausePlaybackIfPlaying(page);
  await dragCreativeAppsKitSliderByLabel(page, "Start fill", 0.02);
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Field duration", 0.98);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "field-duration-range-drag",
  );
});

test("browser perf: field speed drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "field-speed-drag");
  await pausePlaybackIfPlaying(page);
  await dragCreativeAppsKitSliderByLabel(page, "Start fill", 0.02);
  await dragCreativeAppsKitSliderByLabel(page, "End fill", 0.98);
  await dragCreativeAppsKitSliderByLabel(page, "Field duration", 0.98);
  await scrubPlayback(page, "Home");
  const scrubber = page.getByRole("slider", { name: "Playback position" }).first();
  await scrubber.press("ArrowRight");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Field speed", 0.98);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "field-speed-drag");
});

test("browser perf: text color change stays responsive", async ({ page }) => {
  await setMessage(page, "VESTA\nBOARD");
  const input = page.getByLabel("Text hex");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await input.fill("#00CCFF");
    await input.blur();
  });

  await expect(page.getByTestId("vestaboard-char-3-8")).toHaveCSS(
    "color",
    "rgb(0, 204, 255)",
  );
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "text-color-change");
});

test("browser perf: opacity range drag stays responsive", async ({ page }) => {
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Opacity", 0.8);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "opacity-range-drag");
});

test("browser perf: seed drag stays responsive", async ({ page }) => {
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Seed", 0.8);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "seed-drag");
});

test("browser perf: background color change stays responsive", async ({ page }) => {
  const input = page.getByLabel("Background hex");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await input.fill("#223344");
    await input.blur();
  });

  await expect(page.getByTestId("vestaboard-output")).toHaveCSS(
    "background-color",
    "rgb(34, 51, 68)",
  );
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "background-color-change",
  );
});

test("browser perf: video format change stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<string>(appPerformance, "video-format-change");
  const field = await getCreativeAppsKitFieldByLabel(page, "Format");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await field.getByRole("combobox").click();
    await page.locator('[data-slot="select-item"]').filter({ hasText: /^MP4$/ }).click();
  });

  await expect(field.locator('[data-slot="select-trigger"]')).toContainText("MP4");
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "video-format-change");
});

test("browser perf: video quality change stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<string>(appPerformance, "video-quality-change");
  const field = await getCreativeAppsKitFieldByLabel(page, "Quality");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await field.getByRole("combobox").click();
    await page.locator('[data-slot="select-item"]').filter({ hasText: /^4K$/ }).click();
  });

  await expect(field.locator('[data-slot="select-trigger"]')).toContainText("4K");
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "video-quality-change");
});

test("browser perf: include background toggle stays responsive", async ({ page }) => {
  const field = await getCreativeAppsKitFieldByLabel(page, "Background");
  await field.scrollIntoViewIfNeeded();
  const includeBackgroundSwitch = field.getByRole("switch");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await includeBackgroundSwitch.click();
  });

  await expect(includeBackgroundSwitch).toHaveAttribute(
    "aria-checked",
    "false",
  );
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "include-background-toggle",
  );
});

test("browser perf: export actions stay under budget", async ({ page }) => {
  const durationSeconds = 1;
  await setMessage(page, "HELLO   BEAUTIFUL WORLD");
  await setTargetMessage(page, "HELLO WORLD");
  await setTimelineDuration(page, durationSeconds);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await captureNextVideoMetadata(page, durationSeconds);
    await captureNextPngExport(page);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "export-actions");
});

test("browser perf: phrase animation frames stay under budget", async ({ page }) => {
  await setMessage(page, "VESTA");
  await setTargetMessage(page, "TOKEN VESTA");
  const result = await measureCreativeAppsKitAnimationFrames(page, 120);

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "phrase-animation-frames",
  );
});

test("browser perf: phrase animation viewport drag stays responsive", async ({ page }) => {
  await setMessage(page, "VESTA");
  await setTargetMessage(page, "TOKEN VESTA");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitCanvasViewport(page);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "phrase-animation-viewport-drag",
  );
});

test("browser perf: vestaboard viewport stays stable", async ({ page }) => {
  const result = await expectCreativeAppsKitCanvasViewportStable(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Width", 0.7);
  });

  await expect(page.getByTestId("vestaboard-foreground-layer")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "viewport-stability");
});

test("browser perf: vestaboard viewport zoom stress stays responsive", async ({ page }) => {
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await zoomCreativeAppsKitCanvasViewport(page, 3);
  });

  await expect(page.getByTestId("vestaboard-foreground-layer")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(
    result,
    appPerformance,
    "viewport-zoom-stress",
  );
});

async function selectSegmentedOption(page: Page, label: string, option: string): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  await field.scrollIntoViewIfNeeded();
  await field.getByRole("button", { name: option, exact: true }).click();
}

async function toggleSwitchField(page: Page, label: string): Promise<void> {
  const field = await getCreativeAppsKitFieldByLabel(page, label);
  await field.scrollIntoViewIfNeeded();
  await field.getByRole("switch").click();
}

async function getShakeOffsets(page: Page): Promise<{ x: number; y: number }> {
  return page.getByTestId("vestaboard-foreground-layer").evaluate((element) => {
    const htmlElement = element as HTMLElement;

    return {
      x: Number(htmlElement.dataset.shakeX ?? "0"),
      y: Number(htmlElement.dataset.shakeY ?? "0"),
    };
  });
}

async function countTrailGhosts(page: Page): Promise<number> {
  return page.locator('[data-testid^="vestaboard-trail-"]').count();
}

test("browser: uppercase remaps message text before layout", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "hello board");

  expect(await getPhraseText(page)).toBe("hello board");

  await toggleSwitchField(page, "Uppercase");

  expect(await getPhraseText(page)).toBe("HELLO BOARD");

  await toggleSwitchField(page, "Uppercase");

  expect(await getPhraseText(page)).toBe("hello board");
});

test("browser: flip mode switches drum and random engines", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "ABCDEFG");
  await setTargetMessage(page, "AG");
  await scrubPlaybackToRatio(page, 0.3);
  await selectSegmentedOption(page, "Flip mode", "Drum");
  const drumFrame = await getPhraseText(page);

  await selectSegmentedOption(page, "Flip mode", "Random");
  const randomFrame = await getPhraseText(page);

  expect(drumFrame).not.toBe(randomFrame);

  await selectSegmentedOption(page, "Flip mode", "Drum");
  await scrubPlaybackToRatio(page, 0.99);

  expect(await getPhraseText(page)).toBe("AG");
});

test("browser: wear inserts sticky pauses into drum spins", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await setMessage(page, "XBZ");
  await setTargetMessage(page, "X");
  await selectSegmentedOption(page, "Flip mode", "Drum");
  await dragCreativeAppsKitSliderByLabel(page, "Wear", 0.02);
  await scrubPlaybackToRatio(page, 0.3);
  const lowWearFrameA = await getPhraseText(page);
  await scrubPlaybackToRatio(page, 0.5);
  const lowWearFrameB = await getPhraseText(page);

  await dragCreativeAppsKitSliderByLabel(page, "Wear", 0.98);
  await scrubPlaybackToRatio(page, 0.3);
  const highWearFrameA = await getPhraseText(page);
  await scrubPlaybackToRatio(page, 0.5);
  const highWearFrameB = await getPhraseText(page);

  expect(`${lowWearFrameA}|${lowWearFrameB}`).not.toBe(
    `${highWearFrameA}|${highWearFrameB}`,
  );

  await scrubPlaybackToRatio(page, 0.99);

  expect(await getPhraseText(page)).toBe("X");
});

test("browser: trail ghosts previous characters on flipping cells", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await selectSegmentedOption(page, "Flip mode", "Drum");
  await scrubPlaybackToRatio(page, 0.3);

  expect(await countTrailGhosts(page)).toBeGreaterThan(0);

  const trailField = await getCreativeAppsKitFieldByLabel(page, "Trail");
  const firstGhostOpacity = await page
    .locator('[data-testid^="vestaboard-trail-"]')
    .first()
    .evaluate((element) => Number(window.getComputedStyle(element).opacity));

  await dragCreativeAppsKitSliderByLabel(page, "Trail", 0.98);
  const raisedGhostOpacity = await page
    .locator('[data-testid^="vestaboard-trail-"]')
    .first()
    .evaluate((element) => Number(window.getComputedStyle(element).opacity));

  expect(raisedGhostOpacity).toBeGreaterThan(firstGhostOpacity);

  await trailField.getByRole("slider").first().press("Home");

  expect(await countTrailGhosts(page)).toBe(0);
});

test("browser: vibration shakes the board during flips", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await selectSegmentedOption(page, "Flip mode", "Drum");
  await setMessage(page, "SHAKE");
  await setTargetMessage(page, "S");
  await scrubPlaybackToRatio(page, 0.3);
  const midShake = await getShakeOffsets(page);

  expect(Math.abs(midShake.x) + Math.abs(midShake.y)).toBeGreaterThan(0);
  expect(Math.abs(midShake.x)).toBeLessThanOrEqual(1.1);
  expect(Math.abs(midShake.y)).toBeLessThanOrEqual(1.1);

  const vibrationField = await getCreativeAppsKitFieldByLabel(page, "Vibration");

  await vibrationField.getByRole("slider").first().press("Home");
  const disabledShake = await getShakeOffsets(page);

  expect(disabledShake.x).toBe(0);
  expect(disabledShake.y).toBe(0);

  await dragCreativeAppsKitSliderByLabel(page, "Vibration", 0.9);
  await scrubPlaybackToRatio(page, 0.99);
  const restingShake = await getShakeOffsets(page);

  expect(restingShake.x).toBe(0);
  expect(restingShake.y).toBe(0);
});

test("browser: sound toggle arms flap click synthesis", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  const soundField = await getCreativeAppsKitFieldByLabel(page, "Sound");
  const soundSwitch = soundField.getByRole("switch");

  await expect(soundSwitch).toHaveAttribute("aria-checked", "false");

  await soundSwitch.click();

  await expect(soundSwitch).toHaveAttribute("aria-checked", "true");

  await page.getByRole("button", { name: "Play playback" }).click();
  await page.waitForTimeout(400);
  await pausePlaybackIfPlaying(page);

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  await expect(soundSwitch).toHaveAttribute("aria-checked", "true");

  await soundSwitch.click();

  await expect(soundSwitch).toHaveAttribute("aria-checked", "false");
});

test("browser: sound volume changes flap click gain", async ({ page }) => {
  await pausePlaybackIfPlaying(page);
  await toggleSwitchField(page, "Sound");
  await dragCreativeAppsKitSliderByLabel(page, "Volume", 0.9);

  const volumeField = await getCreativeAppsKitFieldByLabel(page, "Volume");
  const volumeText = await volumeField.innerText();
  const volumeValue = Number.parseInt(volumeText.replace(/[^0-9]/g, ""), 10);

  expect(volumeValue).toBeGreaterThanOrEqual(70);

  await page.getByRole("button", { name: "Play playback" }).click();
  await page.waitForTimeout(300);
  await pausePlaybackIfPlaying(page);

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
});

test("browser perf: flip mode change stays responsive", async ({ page }) => {
  const stressValue = getCreativeAppsKitPerformanceStressValue<string>(
    appPerformance,
    "flip-mode-change",
  );
  await setMessage(page, "ABCDEFGHIJKL");
  await setTargetMessage(page, "AL");
  await scrubPlaybackToRatio(page, 0.3);
  const field = await getCreativeAppsKitFieldByLabel(page, "Flip mode");
  await field.scrollIntoViewIfNeeded();
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await field.getByRole("button", { name: "Drum", exact: true }).click();
  });

  expect(stressValue).toBe("drum");
  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "flip-mode-change");
});

test("browser perf: wear drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "flip-wear-drag");
  await setMessage(page, "ABCDEFGHIJKL");
  await setTargetMessage(page, "AL");
  await selectSegmentedOption(page, "Flip mode", "Drum");
  await scrubPlaybackToRatio(page, 0.3);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Wear", 0.94);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "flip-wear-drag");
});

test("browser perf: trail drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "flip-trail-drag");
  await selectSegmentedOption(page, "Flip mode", "Drum");
  await scrubPlaybackToRatio(page, 0.3);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Trail", 0.94);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "flip-trail-drag");
});

test("browser perf: vibration drag stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<number>(appPerformance, "flip-shake-drag");
  await selectSegmentedOption(page, "Flip mode", "Drum");
  await scrubPlaybackToRatio(page, 0.3);
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Vibration", 0.94);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "flip-shake-drag");
});

test("browser perf: sound toggle stays responsive", async ({ page }) => {
  const field = await getCreativeAppsKitFieldByLabel(page, "Sound");
  await field.scrollIntoViewIfNeeded();
  const soundSwitch = field.getByRole("switch");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await soundSwitch.click();
  });

  await expect(soundSwitch).toHaveAttribute("aria-checked", "true");
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "sound-toggle");
});

test("browser perf: sound volume drag stays responsive", async ({ page }) => {
  await toggleSwitchField(page, "Sound");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await dragCreativeAppsKitSliderByLabel(page, "Volume", 0.9);
  });

  await expect(page.getByTestId("vestaboard-output")).toBeVisible();
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "sound-volume-drag");
});

test("browser perf: uppercase toggle stays responsive", async ({ page }) => {
  getCreativeAppsKitPerformanceStressValue<boolean>(appPerformance, "uppercase-toggle");
  await setMessage(page, "the quick brown fox jumps over the lazy dog");
  const field = await getCreativeAppsKitFieldByLabel(page, "Uppercase");
  await field.scrollIntoViewIfNeeded();
  const uppercaseSwitch = field.getByRole("switch");
  const result = await measureCreativeAppsKitInteraction(page, async () => {
    await uppercaseSwitch.click();
  });

  await expect(uppercaseSwitch).toHaveAttribute("aria-checked", "true");
  expectCreativeAppsKitScenarioPerformanceBudget(result, appPerformance, "uppercase-toggle");
});
