import { expect } from "@playwright/test";

import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-conditional-output-evidence-helpers";
import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
} from "./browser-proof-session";
import { expectExportExcludesCanvasHandles } from "./canvas-handle-helpers";
import {
  ensureTimelineVisible,
  expectControlOptions,
  pauseAtVisibleFrame,
  selectControlOption,
} from "./mesh-editor-test-helpers";
import {
  type DownloadArtifact,
  downloadPanelArtifact,
  inspectImageArtifact,
  inspectSvgArtifact,
  inspectVideoArtifact,
  setBrightBackgroundAndLowOpacity,
  setCanvasSize,
  setTimelineDuration,
} from "./mesh-export-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { test } from "./toolcraft-product-test";

test("browser: background and image export preserve mesh output semantics", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await setCanvasSize(page, 320, 180);
  await ensureTimelineVisible(page);
  await pauseAtVisibleFrame(page);
  await setTimelineDuration(page, 1);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.background", async (control) => {
      const hex = control.getByRole("textbox", { name: "hex" });
      await hex.fill("#00CC44");
      await hex.press("Enter");
    }),
    { requirementId: "background-color" },
  );
  const opacitySlider = page
    .locator('[data-toolcraft-control-target="mix.opacity"]')
    .getByRole("slider");
  await opacitySlider.focus();
  await opacitySlider.press("Home");

  const imageFormat = page.locator(
    '[data-toolcraft-control-target="export.image.format"]',
  );
  const imageResolution = page.locator(
    '[data-toolcraft-control-target="export.image.resolution"]',
  );
  const videoFormat = page.locator(
    '[data-toolcraft-control-target="export.video.format"]',
  );
  const videoResolution = page.locator(
    '[data-toolcraft-control-target="export.video.resolution"]',
  );
  await expectControlOptions(imageFormat, page, ["PNG", "JPG"]);
  await expectControlOptions(imageResolution, page, ["2K", "4K", "8K"]);
  await selectControlOption(imageFormat, page, "PNG");
  await selectControlOption(imageResolution, page, "2K");
  await selectControlOption(videoFormat, page, "WebM");
  await selectControlOption(videoResolution, page, "Current");

  const observePreview = session.observe((root) => {
    const background = root.querySelector<HTMLElement>(
      '[data-mesh-gradient-background="true"]',
    );
    const canvas = root.querySelector<HTMLElement>('[data-mesh-gradient-canvas="true"]');
    const backgroundColor = background?.style.backgroundColor ?? "";
    return {
      backgroundVisible:
        backgroundColor !== "transparent" && backgroundColor !== "rgba(0, 0, 0, 0)",
      outputSignature: canvas?.getAttribute("data-mesh-frame-signature") ?? "",
    };
  });
  const includeBackground = page.locator(
    '[data-toolcraft-control-target="export.includeBackground"]',
  );
  const includeSwitch = includeBackground.getByRole("switch");
  const includedPreview = await readToolcraftBrowserObservation(observePreview);
  expect(includedPreview.backgroundVisible).toBe(true);
  await includeSwitch.click();
  await expect.poll(() => readToolcraftBrowserObservation(observePreview)).not.toEqual(
    includedPreview,
  );
  const excludedPreview = await readToolcraftBrowserObservation(observePreview);
  expect(excludedPreview.backgroundVisible).toBe(false);
  await includeSwitch.click();
  await expect.poll(() => readToolcraftBrowserObservation(observePreview)).toEqual(
    includedPreview,
  );

  await expectToolcraftBackgroundOutputSemantics(
    observePreview,
    session.controlAction("export.includeBackground", async (control) => {
      await control.getByRole("switch").click();
    }),
    excludedPreview,
    session.action((currentPage) => downloadPanelArtifact(currentPage, "Export PNG")),
    (artifact) => inspectImageArtifact(page, artifact),
    {
      requirementId: "background-include",
      video: {
        exportArtifact: session.action((currentPage) =>
          downloadPanelArtifact(currentPage, "Export Video", { proveProgress: true }),
        ),
        inspectArtifact: (artifact) => inspectVideoArtifact(page, artifact),
      },
    },
  );

  await includeSwitch.click();
  await expect(includeSwitch).toBeChecked();

  await expectToolcraftExportedArtifact(
    session.controlAction("export.image.format", async (control, currentPage) => {
      const artifacts: DownloadArtifact[] = [];
      await selectControlOption(control, currentPage, "PNG");
      artifacts.push(await downloadPanelArtifact(currentPage, "Export PNG"));
      await selectControlOption(control, currentPage, "JPG");
      artifacts.push(await downloadPanelArtifact(currentPage, "Export PNG"));
      return artifacts;
    }),
    async (artifacts) => {
      const inspections = await Promise.all(
        artifacts.map((artifact) => inspectImageArtifact(page, artifact)),
      );
      expect(inspections.map((inspection) => inspection.mediaType)).toEqual([
        "image/png",
        "image/jpeg",
      ]);
      return inspections;
    },
    { requirementId: "image-format" },
  );

  await selectControlOption(imageFormat, page, "PNG");
  await expectToolcraftExportedArtifact(
    session.controlAction("export.image.resolution", async (control, currentPage) => {
      const artifacts: DownloadArtifact[] = [];
      await selectControlOption(control, currentPage, "2K");
      artifacts.push(await downloadPanelArtifact(currentPage, "Export PNG"));
      await selectControlOption(control, currentPage, "4K");
      artifacts.push(await downloadPanelArtifact(currentPage, "Export PNG"));
      return artifacts;
    }),
    async (artifacts) => {
      const inspections = await Promise.all(
        artifacts.map((artifact) => inspectImageArtifact(page, artifact)),
      );
      expect(inspections.map((inspection) => inspection.width)).toEqual([2048, 4096]);
      expect(inspections.map((inspection) => inspection.height)).toEqual([1152, 2304]);
      return inspections;
    },
    { requirementId: "image-resolution" },
  );
});

test("browser: video export follows timeline and selected settings", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  await setCanvasSize(page, 1000, 100);
  await ensureTimelineVisible(page);
  await pauseAtVisibleFrame(page);
  await setTimelineDuration(page, 1);
  await setBrightBackgroundAndLowOpacity(page);

  const videoFormat = page.locator(
    '[data-toolcraft-control-target="export.video.format"]',
  );
  const videoResolution = page.locator(
    '[data-toolcraft-control-target="export.video.resolution"]',
  );
  const imageResolution = page.locator(
    '[data-toolcraft-control-target="export.image.resolution"]',
  );
  await expectControlOptions(videoFormat, page, ["MP4", "WebM"]);
  await expectControlOptions(videoResolution, page, ["Current", "4K"]);
  await selectControlOption(videoResolution, page, "Current");

  await expectToolcraftExportedArtifact(
    session.controlAction("export.video.format", async (control, currentPage) => {
      const artifacts: DownloadArtifact[] = [];
      await selectControlOption(control, currentPage, "MP4");
      artifacts.push(await downloadPanelArtifact(currentPage, "Export Video"));
      await selectControlOption(control, currentPage, "WebM");
      artifacts.push(await downloadPanelArtifact(currentPage, "Export Video"));
      return artifacts;
    }),
    async (artifacts) => {
      const inspections = await Promise.all(
        artifacts.map((artifact) => inspectVideoArtifact(page, artifact)),
      );
      expect(inspections.every((inspection) => inspection.width === 1000)).toBe(true);
      expect(inspections.every((inspection) => inspection.height === 100)).toBe(true);
      expect(inspections.every((inspection) => inspection.durationMs >= 700)).toBe(true);
      expect(inspections.every((inspection) => inspection.durationMs <= 2500)).toBe(true);
      return inspections;
    },
    { requirementId: "video-format" },
  );

  await selectControlOption(videoFormat, page, "WebM");
  await expectToolcraftExportedArtifact(
    session.controlAction("export.video.resolution", async (control, currentPage) => {
      const artifacts: DownloadArtifact[] = [];
      await selectControlOption(control, currentPage, "Current");
      artifacts.push(await downloadPanelArtifact(currentPage, "Export Video"));
      await selectControlOption(control, currentPage, "4K");
      artifacts.push(await downloadPanelArtifact(currentPage, "Export Video"));
      return artifacts;
    }),
    async (artifacts) => {
      const inspections = await Promise.all(
        artifacts.map((artifact) => inspectVideoArtifact(page, artifact)),
      );
      expect(
        inspections.map((inspection) => [inspection.width, inspection.height]),
      ).toEqual([
        [1000, 100],
        [3840, 384],
      ]);
      expect(inspections.every((inspection) => inspection.width % 2 === 0)).toBe(true);
      expect(inspections.every((inspection) => inspection.height % 2 === 0)).toBe(true);
      return inspections;
    },
    { requirementId: "video-resolution" },
  );

  await selectControlOption(videoResolution, page, "Current");
  await selectControlOption(imageResolution, page, "2K");
  await expectToolcraftExportedArtifact(
    session.controlAction("export.actions", async (control, currentPage) => {
      const pngButton = control.getByRole("button", { name: "Export PNG", exact: true });
      const svgButton = control.getByRole("button", { name: "Export SVG", exact: true });
      const videoButton = control.getByRole("button", { name: "Export Video", exact: true });
      await expect(pngButton).toBeVisible();
      await expect(svgButton).toBeVisible();
      await expect(videoButton).toBeVisible();
      const [pngBox, svgBox, videoBox] = await Promise.all([
        pngButton.boundingBox(),
        svgButton.boundingBox(),
        videoButton.boundingBox(),
      ]);
      expect(pngBox).not.toBeNull();
      expect(svgBox).not.toBeNull();
      expect(videoBox).not.toBeNull();
      expect(Math.abs(pngBox!.y - svgBox!.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(pngBox!.width - svgBox!.width)).toBeLessThanOrEqual(1);
      expect(videoBox!.y).toBeGreaterThan(pngBox!.y + pngBox!.height);
      expect(Math.abs(videoBox!.x - pngBox!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(videoBox!.width - (svgBox!.x + svgBox!.width - pngBox!.x))).toBeLessThanOrEqual(
        1,
      );
      return [
        await downloadPanelArtifact(currentPage, "Export PNG", { proveProgress: true }),
        await downloadPanelArtifact(currentPage, "Export SVG", { proveProgress: true }),
        await downloadPanelArtifact(currentPage, "Export Video"),
      ];
    }),
    async ([imageArtifact, svgArtifact, videoArtifact]) => {
      const imageInspection = await inspectImageArtifact(page, imageArtifact);
      const svgInspection = await inspectSvgArtifact(page, svgArtifact);
      const videoInspection = await inspectVideoArtifact(page, videoArtifact);
      expect(svgInspection.width).toBe(1000);
      expect(svgInspection.height).toBe(100);
      expect(svgInspection.embeddedWidth).toBe(2048);
      expect(svgInspection.embeddedHeight).toBe(205);
      return [imageInspection, svgInspection, videoInspection];
    },
    { requirementId: "export-actions" },
  );
});

test("browser: canvas mesh handle stays out of image export", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await createToolcraftBrowserProofSession(page);
  await setCanvasSize(page, 320, 180);
  await ensureTimelineVisible(page);
  await pauseAtVisibleFrame(page);
  const imageFormat = page.locator(
    '[data-toolcraft-control-target="export.image.format"]',
  );
  const imageResolution = page.locator(
    '[data-toolcraft-control-target="export.image.resolution"]',
  );
  await selectControlOption(imageFormat, page, "PNG");
  await selectControlOption(imageResolution, page, "2K");
  await expectExportExcludesCanvasHandles(
    page,
    () => downloadPanelArtifact(page, "Export PNG"),
    (artifact) => inspectImageArtifact(page, artifact),
    { requirementId: "mesh-canvas-handle", target: "mesh.points" },
  );
  await expectExportExcludesCanvasHandles(
    page,
    () => downloadPanelArtifact(page, "Export PNG"),
    (artifact) => inspectImageArtifact(page, artifact),
    { requirementId: "mesh-canvas-tangent", target: "mesh.points" },
  );
});
