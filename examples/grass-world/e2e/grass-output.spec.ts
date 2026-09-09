import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftBackgroundOutputSemantics } from "./browser-conditional-output-evidence-helpers";
import {
  chooseGrassOption,
  disableGrassScanLayers,
  inspectGrassImage,
  prepareGrassSession,
  readGrassArtifact,
} from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

test("grass background toggle controls preview image alpha", async ({
  page,
}) => {
  test.setTimeout(300_000);
  const session = await prepareGrassSession(page);
  await disableGrassScanLayers(page);
  const environmentVisible = page
    .locator('[data-toolcraft-control-target="environment.visible"]')
    .getByRole("switch");
  if ((await environmentVisible.getAttribute("aria-checked")) === "true") {
    await environmentVisible.click();
  }
  const includeBackground = page
    .locator('[data-toolcraft-control-target="export.includeBackground"]')
    .getByRole("switch");
  if ((await includeBackground.getAttribute("aria-checked")) === "false") {
    await includeBackground.click();
  }
  await chooseGrassOption(
    page.locator('[data-toolcraft-control-target="export.image.resolution"]'),
    page,
    "2K",
  );
  const backgroundHex = page
    .locator('[data-toolcraft-control-target="scene.background"]')
    .getByRole("textbox", { name: "Background hex" });
  await backgroundHex.fill("#eeeeee");
  await backgroundHex.press("Enter");
  await expect(
    page.locator('[data-slot="grass-webgl-canvas"]'),
  ).toHaveAttribute("data-grass-background", "#EEEEEE");

  const preview = session.observe(async (root) => {
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    if (!canvas) throw new Error("Grass preview canvas is missing.");
    const image = new Image();
    image.src = canvas.toDataURL("image/png");
    await image.decode();
    const probe = document.createElement("canvas");
    probe.width = 32;
    probe.height = 18;
    const context = probe.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Preview inspection requires a 2D context.");
    context.drawImage(image, 0, 0, probe.width, probe.height);
    const cornerAlpha = [
      context.getImageData(0, 0, 1, 1).data[3] ?? 0,
      context.getImageData(probe.width - 1, 0, 1, 1).data[3] ?? 0,
      context.getImageData(0, probe.height - 1, 1, 1).data[3] ?? 0,
      context.getImageData(probe.width - 1, probe.height - 1, 1, 1).data[3] ??
        0,
    ];
    const backgroundVisible = cornerAlpha.every((alpha) => alpha > 250);
    return {
      backgroundVisible,
      outputSignature: backgroundVisible ? "background-on" : "background-off",
    };
  });
  const exclude = session.controlAction(
    "export.includeBackground",
    async (control) => {
      await control.getByRole("switch").click();
    },
  );
  const exportImage = session.controlAction(
    "actions.output",
    (_control, currentPage) => readGrassArtifact(currentPage, "Export PNG"),
  );
  const exportImageBackgroundEvidence = session.controlAction(
    "export.includeBackground",
    (_control, currentPage) => readGrassArtifact(currentPage, "Export PNG"),
  );

  await expectToolcraftBackgroundOutputSemantics(
    preview,
    exclude,
    { backgroundVisible: false, outputSignature: "background-off" },
    exportImage,
    (artifact) => inspectGrassImage(page, artifact),
    {
      requirementId: "grass.include-background",
      stabilityIntervalMs: 30,
      timeoutMs: 30_000,
    },
  );
  await expectToolcraftExportedArtifact(
    exportImageBackgroundEvidence,
    (artifact) => inspectGrassImage(page, artifact),
    { requirementId: "grass.include-background" },
  );

  await page
    .locator('[data-toolcraft-control-target="export.includeBackground"]')
    .getByRole("switch")
    .click();
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("scene.background", async (control) => {
      const input = control.getByRole("textbox", { name: "Background hex" });
      await input.fill("#ff00aa");
      await input.press("Enter");
    }),
    { requirementId: "grass.background", timeoutMs: 12_000 },
  );
});

test("grass export settings control downloaded images", async ({ page }) => {
  test.setTimeout(180_000);
  const session = await prepareGrassSession(page);

  const imageFormat = session.controlAction(
    "export.image.format",
    async (control, currentPage) => {
      await chooseGrassOption(control, currentPage, "JPG");
      return readGrassArtifact(currentPage, "Export PNG");
    },
  );
  await expectToolcraftExportedArtifact(
    imageFormat,
    async (artifact) => {
      const inspection = await inspectGrassImage(page, artifact);
      expect(inspection.mediaType).toBe("image/jpeg");
      return inspection;
    },
    { requirementId: "grass.image-format" },
  );

  await chooseGrassOption(
    page.locator('[data-toolcraft-control-target="export.image.format"]'),
    page,
    "PNG",
  );
  await chooseGrassOption(
    page.locator('[data-toolcraft-control-target="export.image.resolution"]'),
    page,
    "8K",
  );
  await chooseGrassOption(
    page.locator('[data-toolcraft-control-target="export.image.resolution"]'),
    page,
    "4K",
  );
  const imageResolution = session.controlAction(
    "export.image.resolution",
    async (control, currentPage) => {
      await chooseGrassOption(control, currentPage, "2K");
      return readGrassArtifact(currentPage, "Export PNG");
    },
  );
  await expectToolcraftExportedArtifact(
    imageResolution,
    async (artifact) => {
      const inspection = await inspectGrassImage(page, artifact);
      expect(Math.max(inspection.width, inspection.height)).toBe(2_048);
      return inspection;
    },
    { requirementId: "grass.image-resolution" },
  );

  const outputActions = session.controlAction(
    "actions.output",
    async (_control, currentPage) =>
      readGrassArtifact(currentPage, "Export PNG"),
  );
  await expectToolcraftExportedArtifact(
    outputActions,
    (imageArtifact) => inspectGrassImage(page, imageArtifact),
    { requirementId: "grass.output-actions" },
  );
});
