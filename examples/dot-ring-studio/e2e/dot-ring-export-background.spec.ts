import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

import type { Download, Locator, Page } from "@playwright/test";

import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-conditional-output-evidence-helpers";
import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
  type ToolcraftBrowserProofSession,
} from "./browser-proof-session";
import {
  expectToolcraftInfinityCanvasBackgroundEvidence,
  observeInfinityCanvasBackground,
} from "./browser-infinity-canvas-evidence";
import {
  downloadFromButton,
  editTimelineDuration,
  pausePlayback,
} from "./dot-ring-browser-support";
import { expect, test } from "./toolcraft-product-test";

const outputSelector = "[data-dot-ring-renderer]";

async function openProofSession(
  page: Page,
): Promise<ToolcraftBrowserProofSession> {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator(outputSelector)).toBeVisible();
  await pausePlayback(page);
  const infinity = page
    .locator('[data-toolcraft-control-target="canvas.infinity"]')
    .getByRole("switch");
  if ((await infinity.getAttribute("aria-checked")) === "true") {
    await infinity.click();
  }
  await expect(page.locator(outputSelector)).toHaveAttribute(
    "data-canvas-mode",
    "finite",
  );
  const session = await createToolcraftBrowserProofSession(page);
  return session;
}

async function chooseOption(
  page: Page,
  control: Locator,
  label: string,
): Promise<void> {
  const combobox = control.getByRole("combobox");
  await combobox.scrollIntoViewIfNeeded();
  if ((await combobox.getAttribute("aria-expanded")) !== "true") {
    await combobox.click();
  }
  const option = page.locator('[role="option"]').filter({ hasText: label }).last();
  await expect(option).toBeVisible();
  await option.click();
}

async function inspectImage(page: Page, download: Download): Promise<{
  backgroundAlpha: number;
  byteLength: number;
  contentHash: string;
  height: number;
  mediaType: string;
  width: number;
}> {
  const path = await download.path();
  expect(path).not.toBeNull();
  const bytes = await readFile(path!);
  const isPng = bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  const encoded = bytes.toString("base64");
  const pixels = await page.evaluate(
    async ({ base64, mediaType }) => {
      const bytes = Uint8Array.from(atob(base64), (value) =>
        value.charCodeAt(0),
      );
      const bitmap = await createImageBitmap(
        new Blob([bytes], { type: mediaType }),
      );
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Image inspection context is unavailable.");
      context.drawImage(bitmap, 0, 0);
      return {
        backgroundAlpha: context.getImageData(0, 0, 1, 1).data[3] ?? 0,
        height: bitmap.height,
        width: bitmap.width,
      };
    },
    { base64: encoded, mediaType: isPng ? "image/png" : "image/jpeg" },
  );

  return {
    ...pixels,
    byteLength: bytes.byteLength,
    contentHash: createHash("sha256").update(bytes).digest("hex"),
    mediaType: isPng ? "image/png" : "image/jpeg",
  };
}

function parseHexColor(value: string): readonly [number, number, number] {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/iu.exec(value);
  if (!match) throw new Error(`Invalid video background color "${value}".`);
  return [
    Number.parseInt(match[1]!, 16),
    Number.parseInt(match[2]!, 16),
    Number.parseInt(match[3]!, 16),
  ];
}

async function inspectVideo(
  download: Download,
  expectedBackground = "#1E1B00",
): Promise<{
  backgroundIncluded: boolean;
  byteLength: number;
  durationMs: number;
  height: number;
  mediaType: string;
  width: number;
}> {
  const path = await download.path();
  expect(path).not.toBeNull();
  const metadata = JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration:format=duration",
        "-of",
        "json",
        path!,
      ],
      { encoding: "utf8" },
    ),
  ) as {
    format?: { duration?: string };
    streams?: Array<{ duration?: string; height?: number; width?: number }>;
  };
  const pixel = execFileSync("ffmpeg", [
    "-v",
    "error",
    "-ss",
    "0",
    "-i",
    path!,
    "-frames:v",
    "1",
    "-vf",
    "format=rgba,crop=1:1:0:0",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgba",
    "pipe:1",
  ]);
  const stream = metadata.streams?.[0];
  const durationSeconds = Number(
    metadata.format?.duration ?? stream?.duration ?? 0,
  );
  const expectedBackgroundRgb = parseHexColor(expectedBackground);

  return {
    backgroundIncluded:
      pixel.length >= 4 &&
      expectedBackgroundRgb.every(
        (channel, index) => Math.abs((pixel[index] ?? 0) - channel) <= 24,
      ) &&
      pixel[3] === 255,
    byteLength: (await stat(path!)).size,
    durationMs: durationSeconds * 1_000,
    height: Number(stream?.height ?? 0),
    mediaType: download.suggestedFilename().endsWith(".mp4")
      ? "video/mp4"
      : "video/webm",
    width: Number(stream?.width ?? 0),
  };
}

test.setTimeout(300_000);

test("browser: image format changes export encoding", async ({ page }) => {
  const session = await openProofSession(page);
  await chooseOption(
    page,
    page.locator(
      '[data-toolcraft-control-target="export.image.resolution"]',
    ),
    "2K",
  );
  const download = await expectToolcraftExportedArtifact(
    session.controlAction(
      "export.image.format",
      async (control, currentPage) => {
        await chooseOption(currentPage, control, "JPG");
        return downloadFromButton(currentPage, "Export PNG");
      },
    ),
    async (artifact) => {
      const inspection = await inspectImage(page, artifact);
      expect(inspection.mediaType).toBe("image/jpeg");
      return inspection;
    },
    { requirementId: "export.image.format" },
  );
  expect(download.suggestedFilename()).toMatch(/\.jpg$/);
});

test("browser: image resolution changes export dimensions", async ({ page }) => {
  const session = await openProofSession(page);
  await expectToolcraftExportedArtifact(
    session.controlAction(
      "export.image.resolution",
      async (control, currentPage) => {
        await chooseOption(currentPage, control, "2K");
        return downloadFromButton(currentPage, "Export PNG");
      },
    ),
    async (artifact) => {
      const inspection = await inspectImage(page, artifact);
      expect(inspection.width).toBe(2048);
      expect(inspection.height).toBe(2048);
      return inspection;
    },
    { requirementId: "export.image.resolution" },
  );
});

test("browser: video format changes export container selection", async ({
  page,
}) => {
  const session = await openProofSession(page);
  await editTimelineDuration(page, "0.25s");
  const download = await expectToolcraftExportedArtifact(
    session.controlAction(
      "export.video.format",
      async (control, currentPage) => {
        await chooseOption(currentPage, control, "WebM");
        return downloadFromButton(currentPage, "Export Video");
      },
    ),
    async (artifact) => {
      const inspection = await inspectVideo(artifact);
      expect(inspection.mediaType).toBe("video/webm");
      return inspection;
    },
    { requirementId: "export.video.format" },
  );
  expect(download.suggestedFilename()).toMatch(/\.webm$/);
});

test("browser: video resolution changes export dimensions", async ({ page }) => {
  const session = await openProofSession(page);
  await editTimelineDuration(page, "0.2s");
  await chooseOption(
    page,
    page.locator('[data-toolcraft-control-target="export.video.format"]'),
    "WebM",
  );
  await expectToolcraftExportedArtifact(
    session.controlAction(
      "export.video.resolution",
      async (control, currentPage) => {
        await chooseOption(currentPage, control, "4K");
        return downloadFromButton(currentPage, "Export Video");
      },
    ),
    async (artifact) => {
      const inspection = await inspectVideo(artifact);
      expect(inspection.width).toBe(2160);
      expect(inspection.height).toBe(2160);
      return inspection;
    },
    { requirementId: "export.video.resolution" },
  );
});

test("browser: export actions create PNG and timeline-length video", async ({
  page,
}) => {
  const session = await openProofSession(page);
  await editTimelineDuration(page, "0.2s");
  await chooseOption(
    page,
    page.locator(
      '[data-toolcraft-control-target="export.image.resolution"]',
    ),
    "2K",
  );
  await chooseOption(
    page,
    page.locator('[data-toolcraft-control-target="export.video.format"]'),
    "WebM",
  );
  await expectToolcraftExportedArtifact(
    session.controlAction("actions.output", (_control, currentPage) =>
      downloadFromButton(currentPage, "Export PNG"),
    ),
    (artifact) => inspectImage(page, artifact),
    { requirementId: "actions.output" },
  );
  const video = await inspectVideo(
    await downloadFromButton(page, "Export Video"),
  );
  expect(video.durationMs).toBeGreaterThan(100);
});

test("browser: include background controls png transparency", async ({
  page,
}) => {
  const session = await openProofSession(page);
  await editTimelineDuration(page, "0.2s");
  for (const [target, label] of [
    ["export.image.resolution", "2K"],
    ["export.video.format", "WebM"],
    ["export.video.resolution", "Current"],
  ] as const) {
    await chooseOption(
      page,
      page.locator(`[data-toolcraft-control-target="${target}"]`),
      label,
    );
  }
  const include = page
    .locator('[data-toolcraft-control-target="export.includeBackground"]')
    .getByRole("switch");
  const backgroundColor = await page
    .locator(outputSelector)
    .getAttribute("data-background-color");
  expect(backgroundColor).toMatch(/^#[0-9a-f]{6}$/iu);
  const infinity = page
    .locator('[data-toolcraft-control-target="canvas.infinity"]')
    .getByRole("switch");
  if ((await include.getAttribute("aria-checked")) !== "true") {
    await include.click();
  }
  await infinity.click();
  const infinite = await observeInfinityCanvasBackground(page);
  await infinity.click();

  const preview = session.observe((root) => {
    const output = root.querySelector<HTMLElement>(
      "[data-dot-ring-renderer]",
    );
    return {
      backgroundVisible: output?.dataset.backgroundVisible === "true",
      outputSignature: output?.dataset.frameSignature ?? "",
    };
  });
  await include.click();
  const expectedPreview = await readToolcraftBrowserObservation(preview);
  await include.click();

  await expectToolcraftBackgroundOutputSemantics(
    preview,
    session.controlAction("export.includeBackground", (control) =>
      control.getByRole("switch").click(),
    ),
    expectedPreview,
    session.action((currentPage) =>
      downloadFromButton(currentPage, "Export PNG"),
    ),
    (artifact) => inspectImage(page, artifact),
    {
      requirementId: "export.includeBackground",
      stabilityIntervalMs: 80,
      timeoutMs: 90_000,
      video: {
        exportArtifact: session.action((currentPage) =>
          downloadFromButton(currentPage, "Export Video"),
        ),
        inspectArtifact: (artifact) =>
          inspectVideo(artifact, backgroundColor!),
      },
    },
  );
  const backgroundExcluded = await observeInfinityCanvasBackground(page);
  await include.click();
  const backgroundRestored = await observeInfinityCanvasBackground(page);
  await expectToolcraftInfinityCanvasBackgroundEvidence(
    { backgroundExcluded, backgroundRestored, infinite },
    {
      expectedBackgroundColor: "#0C1A32",
      requirementId: "export.includeBackground",
      target: "export.includeBackground",
    },
  );
});
