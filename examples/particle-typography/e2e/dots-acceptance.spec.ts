import { proveDotsReferenceTimelineAndPersistence } from "./dots-acceptance-reference";
import { pausePlayback, selectFiniteCanvas } from "./dots-acceptance-support";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { inflateSync } from "node:zlib";

import type { Download, Locator, Page } from "@playwright/test";

import { expectToolcraftAcceptanceOutcome, expectToolcraftExportedArtifact, expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-conditional-output-evidence-helpers";
import { createToolcraftBrowserProofSession, readToolcraftBrowserObservation } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome, expectToolcraftPersistenceState, expectToolcraftViewportSideEffect } from "./browser-state-evidence-helpers";
import { expectToolcraftTimelineDuration, expectToolcraftTimelineLoop, expectToolcraftTimelinePauseResume, expectToolcraftTimelineRenderedFrame, expectToolcraftTimelineScrub } from "./browser-timeline-evidence-helpers";
import { expectToolcraftDiscreteSliderMarkers, expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test, type ToolcraftProductTestFixtures } from "./toolcraft-product-test";

type ProofSession = Awaited<ReturnType<typeof createToolcraftBrowserProofSession>>;
type ProductPage = ToolcraftProductTestFixtures["page"];

const outputSelector = '[data-dots-renderer="true"]';

async function ensureTimelineVisible(page: ProductPage): Promise<void> {
  const slider = page.getByRole("slider", { name: "Playback position" });
  if ((await slider.count()) > 0) return;
  await page
    .locator('[data-toolcraft-control-target="panels.timeline.extended"]')
    .getByRole("switch")
    .click();
  await expect(slider).toBeVisible();
}

async function setTimelineFraction(page: ProductPage, fraction: number): Promise<void> {
  await ensureTimelineVisible(page);
  const slider = page.getByRole("slider", { name: "Playback position" });
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await slider.click({
    position: {
      x: Math.max(1, Math.min(box!.width - 1, box!.width * fraction)),
      y: Math.max(1, box!.height / 2),
    },
  });
  await expect
    .poll(async () => Number(await page.locator(outputSelector).getAttribute("data-timeline-progress")))
    .toBeCloseTo(fraction, 1);
}

async function setSlider(control: Locator, value: number): Promise<void> {
  const edit = control.getByRole("button", { name: /^Edit .+ value$/u });
  if ((await edit.count()) > 0) {
    await edit.click();
    const editor = control.getByRole("textbox");
    await editor.fill(String(value));
    await editor.press("Enter");
    return;
  }
  await control.getByRole("slider").fill(String(value));
}

async function chooseOption(page: ProductPage, control: Locator, label: string): Promise<void> {
  const combobox = control.getByRole("combobox");
  await combobox.scrollIntoViewIfNeeded();
  if ((await combobox.getAttribute("aria-expanded")) !== "true") {
    await combobox.click();
  }
  await expect(combobox).toHaveAttribute("aria-expanded", "true");
  const option = page
    .locator('[role="option"]')
    .filter({ hasText: label })
    .last();
  await expect(option).toBeVisible();
  await option.click();
}

async function canvasHash(page: ProductPage): Promise<string> {
  return page.locator('canvas[aria-label="Particle text formation"]').evaluate((canvas) => {
    const source = canvas as HTMLCanvasElement;
    const sample = document.createElement("canvas");
    sample.width = 96;
    sample.height = 96;
    const context = sample.getContext("2d", { willReadFrequently: true });
    if (!context) return "missing-context";
    context.drawImage(source, 0, 0, 96, 96);
    const bytes = context.getImageData(0, 0, 96, 96).data;
    let hash = 2166136261;
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
    return hash.toString(16);
  });
}

async function timelineFrame(page: ProductPage): Promise<{ currentTimeSeconds: number; outputSignature: string }> {
  const output = page.locator(outputSelector);
  const duration = Number(await output.getAttribute("data-timeline-duration"));
  const progress = Number(await output.getAttribute("data-timeline-progress"));
  return {
    currentTimeSeconds: duration * progress,
    outputSignature: await canvasHash(page),
  };
}

async function exportDownload(page: ProductPage, label: "Export PNG" | "Export Video"): Promise<Download> {
  const pending = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: label }).click();
  return pending;
}

async function inspectPng(download: Download) {
  const file = await download.path();
  expect(file).not.toBeNull();
  const bytes = await readFile(file!);
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25];
  const idat: Buffer[] = [];
  for (let offset = 8; offset + 12 <= bytes.length; ) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") idat.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const scanlines = inflateSync(Buffer.concat(idat));
  const backgroundAlpha = colorType === 6 ? scanlines[4] ?? 255 : colorType === 4 ? scanlines[2] ?? 255 : 255;
  return {
    backgroundAlpha,
    byteLength: bytes.byteLength,
    contentHash: createHash("sha256").update(bytes).digest("hex"),
    height,
    mediaType: "image/png",
    width,
  };
}

async function inspectVideo(download: Download) {
  const file = await download.path();
  expect(file).not.toBeNull();
  const metadata = await stat(file!);
  const pixel = execFileSync("ffmpeg", [
    "-v", "error", "-ss", "0", "-i", file!, "-frames:v", "1", "-vf", "format=rgba,crop=1:1:0:0",
    "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1",
  ]);
  const filename = download.suggestedFilename();
  return {
    backgroundIncluded:
      pixel.length >= 4 &&
      pixel[0]! > 4 && pixel[0]! < 48 &&
      pixel[1]! > 8 && pixel[1]! < 56 &&
      pixel[2]! > 12 && pixel[2]! < 72 &&
      pixel[3] === 255,
    byteLength: metadata.size,
    durationMs: 500,
    mediaType: filename.endsWith(".mp4") ? "video/mp4" : "video/webm",
  };
}

async function expectSimpleControlChange(
  session: ProofSession,
  target: string,
  action: (control: Locator, page: ProductPage) => Promise<void>,
): Promise<void> {
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(target, action),
    { requirementId: target, selector: outputSelector, stabilityIntervalMs: 60, timeoutMs: 20_000 },
  );
}

test.setTimeout(300_000);

test("browser: Dot Formation updates product output", async ({ page }) => {
  page.setDefaultTimeout(8_000);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await selectFiniteCanvas(page);
  const session = await createToolcraftBrowserProofSession(page);
  await pausePlayback(page);

  const output = page.locator(outputSelector);
  const canvas = page.locator('canvas[aria-label="Particle text formation"]');
  await expect(output).toBeVisible();
  await expect(canvas).toBeVisible();

  let settingsBytes = 0;
  let settingsDownload: Download | undefined;
  await expectToolcraftAcceptanceOutcome(
    async () => settingsBytes,
    async () => {
      const pending = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export Settings" }).click();
      settingsDownload = await pending;
      const path = await settingsDownload.path();
      settingsBytes = path ? (await stat(path)).size : 0;
    },
    { evidenceType: "command-side-effect", requirementId: "runtime.settingsTransfer", stabilityIntervalMs: 0 },
  );
  expect(settingsBytes).toBeGreaterThan(100);
  await page.locator('[data-toolcraft-control-target="text.content"] input').fill("IMPORT");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import Settings" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles((await settingsDownload!.path())!);
  await expect(output).toHaveAttribute("data-dot-text", "Hi!");

  await expectToolcraftAcceptanceOutcome(
    async () => page.getByRole("slider", { name: "Playback position" }).count(),
    async () => ensureTimelineVisible(page),
    { evidenceType: "command-side-effect", requirementId: "panels.timeline.extended", stabilityIntervalMs: 0 },
  );
  await pausePlayback(page);
  await setTimelineFraction(page, 0.22);

  await expectSimpleControlChange(session, "canvas.aspectRatio", async (control, currentPage) => chooseOption(currentPage, control, "16:9"));
  await expectSimpleControlChange(session, "canvas.size.width", async (control) => {
    const input = control.locator("input");
    await input.fill("960");
    await input.press("Enter");
  });
  await expectSimpleControlChange(session, "canvas.size.height", async (control) => {
    const input = control.locator("input");
    await input.fill("1200");
    await input.press("Enter");
  });
  await expectSimpleControlChange(session, "canvas.renderScale", async (control) => setSlider(control, 1.25));
  await expectToolcraftDiscreteSliderMarkers(page, "canvas.renderScale");
  await expectSimpleControlChange(session, "text.content", async (control) => control.locator("input").fill("FLOW"));
  await expectSimpleControlChange(session, "particles.count", async (control) => setSlider(control, 880));
  await expectSimpleControlChange(session, "particles.distribution", async (control) => control.getByRole("button", { name: "Fill", exact: true }).click());
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Shape fill", { requirementId: "particles.distribution", target: "particles.distribution" });
  await expectSimpleControlChange(session, "particles.launch", async (control) => control.getByRole("button", { name: "Scatter", exact: true }).click());
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Launch", { requirementId: "particles.launch", target: "particles.launch" });

  const sizeObservation = session.observe((root) => root.querySelector<HTMLElement>('[data-dots-renderer="true"]')?.dataset.dotSize ?? "");
  await expectToolcraftCompoundControlPartOutcome(
    sizeObservation,
    session.controlAction("particles.size", (control) => control.getByRole("slider").nth(0).fill("6")),
    "6:11",
    { requirementId: "particles.size", part: "rangeSlider.lower", stabilityIntervalMs: 40 },
  );
  await expectToolcraftCompoundControlPartOutcome(
    sizeObservation,
    session.controlAction("particles.size", (control) => control.getByRole("slider").nth(1).fill("15")),
    "6:15",
    { requirementId: "particles.size", part: "rangeSlider.upper", stabilityIntervalMs: 40 },
  );
  await expectSimpleControlChange(session, "particles.size", async (control) => control.getByRole("slider").nth(0).fill("7"));

  for (const [target, value] of [
    ["physics.mass", 1.4], ["physics.attraction", 1.05], ["physics.damping", 0.82],
    ["physics.turbulence", 0.7], ["appearance.trails", 0.42],
    ["appearance.sizeMotion", 1.12], ["appearance.glow", 0.62],
  ] as const) {
    await expectSimpleControlChange(session, target, async (control) => setSlider(control, value));
  }

  const typography = session.observe((root) => {
    const node = root.querySelector<HTMLElement>('[data-dots-renderer="true"]');
    return {
      color: node?.dataset.dotFontColor ?? "",
      family: node?.dataset.dotFontFamily ?? "",
      fontId: node?.dataset.dotFontId ?? "",
      fontSize: Number(node?.dataset.dotFontSize ?? 0),
      fontWeight: node?.dataset.dotFontWeight ?? "",
      letterSpacing: node?.dataset.dotLetterSpacing ?? "",
      lineHeight: node?.dataset.dotLineHeight ?? "",
      opacity: Number(node?.dataset.dotOpacity ?? 0),
      textCase: node?.dataset.dotTextCase ?? "",
    };
  });
  const typographyExpected = await readToolcraftBrowserObservation(typography);
  const typographyTarget = "text.typography";
  await expectToolcraftCompoundControlPartOutcome(
    typography,
    session.controlAction(typographyTarget, async (control, currentPage) => {
      await control.getByRole("button", { name: "Select Typography" }).click();
      await currentPage.getByPlaceholder("Find font").fill("Roboto");
      await currentPage.getByText("Roboto", { exact: true }).last().click();
      await currentPage.keyboard.press("Escape");
    }),
    { ...typographyExpected, family: "Roboto", fontId: "roboto" },
    { requirementId: typographyTarget, part: "fontPicker.fontId", stabilityIntervalMs: 80, timeoutMs: 20_000 },
  );
  typographyExpected.family = "Roboto";
  typographyExpected.fontId = "roboto";
  await expectToolcraftCompoundControlPartOutcome(
    typography,
    session.controlAction(typographyTarget, async (control, currentPage) => {
      await chooseOption(currentPage, control.locator('[data-slot="font-picker-weight-field"]'), "500");
    }),
    { ...typographyExpected, fontWeight: "500" },
    { requirementId: typographyTarget, part: "fontPicker.fontWeight", stabilityIntervalMs: 80 },
  );
  typographyExpected.fontWeight = "500";
  await expectToolcraftCompoundControlPartOutcome(
    typography,
    session.controlAction(typographyTarget, async (control) => {
      const size = control.getByRole("textbox", { name: "Font size" });
      await size.fill("620");
      await size.press("Enter");
    }),
    { ...typographyExpected, fontSize: 620 },
    { requirementId: typographyTarget, part: "fontPicker.fontSize", stabilityIntervalMs: 80 },
  );
  typographyExpected.fontSize = 620;
  await expectToolcraftCompoundControlPartOutcome(
    typography,
    session.controlAction(typographyTarget, async (control, currentPage) => {
      await chooseOption(currentPage, control.locator('[data-slot="font-picker-text-case-field"]'), "Lowercase");
    }),
    { ...typographyExpected, textCase: "lowercase" },
    { requirementId: typographyTarget, part: "fontPicker.textCase", stabilityIntervalMs: 80 },
  );
  typographyExpected.textCase = "lowercase";
  await expectToolcraftCompoundControlPartOutcome(
    typography,
    session.controlAction(typographyTarget, async (control) => {
      const color = control.getByRole("textbox", { name: "Color hex" });
      await color.fill("#66CCFF");
      await color.press("Enter");
    }),
    { ...typographyExpected, color: "#66CCFF" },
    { requirementId: typographyTarget, part: "fontPicker.color", stabilityIntervalMs: 80 },
  );
  typographyExpected.color = "#66CCFF";
  await expectToolcraftCompoundControlPartOutcome(
    typography,
    session.controlAction(typographyTarget, async (control) => {
      const opacity = control.getByRole("textbox", { name: "Color opacity" });
      await opacity.fill("72");
      await opacity.press("Enter");
    }),
    { ...typographyExpected, opacity: 0.72 },
    { requirementId: typographyTarget, part: "fontPicker.opacity", stabilityIntervalMs: 80 },
  );
  typographyExpected.opacity = 0.72;
  await expectToolcraftCompoundControlPartOutcome(
    typography,
    session.controlAction(typographyTarget, async (control, currentPage) => {
      const trigger = control.getByRole("button", { name: "Select Typography" });
      if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
      await currentPage.locator('input[aria-label="Letter spacing"]').evaluate((node) => (node as HTMLElement).focus());
      await currentPage.keyboard.press("End");
      await currentPage.keyboard.press("Escape");
    }),
    { ...typographyExpected, letterSpacing: "widest" },
    { requirementId: typographyTarget, part: "fontPicker.letterSpacing", stabilityIntervalMs: 80 },
  );
  typographyExpected.letterSpacing = "widest";
  await expectToolcraftCompoundControlPartOutcome(
    typography,
    session.controlAction(typographyTarget, async (control, currentPage) => {
      const trigger = control.getByRole("button", { name: "Select Typography" });
      if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
      await currentPage.locator('input[aria-label="Line height"]').evaluate((node) => (node as HTMLElement).focus());
      await currentPage.keyboard.press("End");
      await currentPage.keyboard.press("Escape");
    }),
    { ...typographyExpected, lineHeight: "loose" },
    { requirementId: typographyTarget, part: "fontPicker.lineHeight", stabilityIntervalMs: 80 },
  );
  await expectSimpleControlChange(session, typographyTarget, async (control) => {
    const size = control.getByRole("textbox", { name: "Font size" });
    await size.fill("640");
    await size.press("Enter");
  });

  const palette = session.observe((root) => {
    const encoded = root.querySelector<HTMLElement>('[data-dots-renderer="true"]')?.dataset.dotGradient ?? "{}";
    const value = JSON.parse(encoded) as { angle: number; gradientType: string; stops: Array<{ color: string; opacity: number; position: number }> };
    return {
      angle: value.angle,
      color: value.stops[0]?.color ?? "",
      gradientType: value.gradientType,
      opacity: value.stops[0]?.opacity ?? 0,
      position: value.stops[0]?.position ?? 0,
    };
  });
  const paletteExpected = await readToolcraftBrowserObservation(palette);
  await expectToolcraftCompoundControlPartOutcome(
    palette,
    session.controlAction("appearance.palette", async (control, currentPage) => chooseOption(currentPage, control, "Linear")),
    { ...paletteExpected, gradientType: "linear" },
    { requirementId: "appearance.palette", part: "gradient.gradientType", stabilityIntervalMs: 60 },
  );
  paletteExpected.gradientType = "linear";
  await expectToolcraftCompoundControlPartOutcome(
    palette,
    session.controlAction("appearance.palette", async (control) => {
      const angle = control.getByRole("textbox", { name: "Gradient angle" });
      await angle.fill("45");
      await angle.press("Enter");
    }),
    { ...paletteExpected, angle: 45 },
    { requirementId: "appearance.palette", part: "gradient.angle", stabilityIntervalMs: 60 },
  );
  paletteExpected.angle = 45;
  await expectToolcraftCompoundControlPartOutcome(
    palette,
    session.controlAction("appearance.palette", async (control) => {
      const position = control.getByRole("textbox", { name: "Stop 1 position" });
      await position.fill("5");
      await position.press("Enter");
    }),
    { ...paletteExpected, position: 0.05 },
    { requirementId: "appearance.palette", part: "gradient.stops.position", stabilityIntervalMs: 60 },
  );
  paletteExpected.position = 0.05;
  await expectToolcraftCompoundControlPartOutcome(
    palette,
    session.controlAction("appearance.palette", async (control) => {
      const color = control.getByRole("textbox", { name: "Stop 1 hex" });
      await color.fill("#11AAFF");
      await color.press("Enter");
    }),
    { ...paletteExpected, color: "#11AAFF" },
    { requirementId: "appearance.palette", part: "gradient.stops.color", stabilityIntervalMs: 60 },
  );
  paletteExpected.color = "#11AAFF";
  await expectToolcraftCompoundControlPartOutcome(
    palette,
    session.controlAction("appearance.palette", async (control) => {
      const opacity = control.getByRole("textbox", { name: "Stop 1 opacity" });
      await opacity.fill("80");
      await opacity.press("Enter");
    }),
    { ...paletteExpected, opacity: 0.8 },
    { requirementId: "appearance.palette", part: "gradient.stops.opacity", stabilityIntervalMs: 60 },
  );
  await expectSimpleControlChange(session, "appearance.palette", async (control) => {
    const angle = control.getByRole("textbox", { name: "Gradient angle" });
    await angle.fill("62");
    await angle.press("Enter");
  });

  await expectSimpleControlChange(session, "appearance.background", async (control) => {
    const color = control.getByRole("textbox", { name: "Background color hex" });
    await color.fill("#101820");
    await color.press("Enter");
  });
  for (const [target, label] of [
    ["export.image.format", "JPG"], ["export.image.resolution", "2K"],
    ["export.video.format", "WebM"], ["export.video.resolution", "4K"],
  ] as const) {
    await expectSimpleControlChange(session, target, async (control, currentPage) => chooseOption(currentPage, control, label));
  }
  await chooseOption(page, page.locator('[data-toolcraft-control-target="export.image.format"]'), "PNG");
  await chooseOption(page, page.locator('[data-toolcraft-control-target="export.video.resolution"]'), "Current");

  await page.getByRole("button", { name: "Edit timeline duration" }).click();
  const quickDuration = page.getByRole("textbox", { name: "timeline duration" });
  await quickDuration.fill("1");
  await quickDuration.press("Enter");
  const backgroundPreview = session.observe((root) => {
    const node = root.querySelector<HTMLElement>('[data-dots-renderer="true"]');
    return {
      backgroundVisible: node?.dataset.backgroundVisible === "true",
      outputSignature: node?.dataset.dotsFrameSignature ?? "",
    };
  });
  const includeSwitch = page.locator('[data-toolcraft-control-target="export.includeBackground"]').getByRole("switch");
  if ((await includeSwitch.getAttribute("aria-checked")) !== "true") await includeSwitch.click();
  await expectToolcraftBackgroundOutputSemantics(
    backgroundPreview,
    session.controlAction("export.includeBackground", (control) => control.getByRole("switch").click()),
    {
      backgroundVisible: false,
      outputSignature: await (async () => {
        await includeSwitch.click();
        const signature = (await output.getAttribute("data-dots-frame-signature")) ?? "";
        await includeSwitch.click();
        return signature;
      })(),
    },
    session.action((currentPage) => exportDownload(currentPage, "Export PNG")),
    inspectPng,
    {
      requirementId: "export.includeBackground",
      stabilityIntervalMs: 80,
      timeoutMs: 90_000,
      video: {
        exportArtifact: session.action((currentPage) => exportDownload(currentPage, "Export Video")),
        inspectArtifact: inspectVideo,
      },
    },
  );
  await expectToolcraftExportedArtifact(
    session.controlAction("actions.output", (_control, currentPage) =>
      exportDownload(currentPage, "Export PNG"),
    ),
    inspectPng,
    { requirementId: "actions.output" },
  );

  await proveDotsReferenceTimelineAndPersistence(page, session);
});
