import { expect, test } from "./toolcraft-product-test";

import {
  expectToolcraftExportedArtifact,
} from "./browser-acceptance-outcome-helpers";
import {
  expectToolcraftBackgroundOutputSemantics,
} from "./browser-conditional-output-evidence-helpers";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftMediaLifecycle } from "./browser-state-evidence-helpers";
import {
  captureMicrographicsExport,
  chooseMicrographicsOption,
  inspectMicrographicsImage,
} from "./micrographics-browser-helpers";

const outputSelector = '[data-toolcraft-product-output="micrographics"]';

test.setTimeout(180_000);

test("browser: micrographics source image lifecycle", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#4a62ff"/><circle cx="320" cy="180" r="110" fill="#ff6a36"/></svg>';
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const lifecycle = session.observe((root) => {
    const hrefs = Array.from(
      root.querySelectorAll<SVGImageElement>(
        '[data-toolcraft-product-output="micrographics"] image',
      ),
      (image) => image.getAttribute("href") ?? "",
    ).filter(Boolean);
    return { itemIds: hrefs, outputSignature: hrefs[0] ?? "no-source-image" };
  });
  const upload = session.controlAction("source.image", async (field) => {
    await field.locator('input[type="file"]').setInputFiles({
      buffer: Buffer.from(svg),
      mimeType: "image/svg+xml",
      name: "source-fixture.svg",
    });
  });
  await expectToolcraftMediaLifecycle(
    lifecycle,
    upload,
    { itemIds: [dataUrl], outputSignature: dataUrl },
    { requirementId: "source-image" },
  );

  const image = page.locator(
    `${outputSelector} image:not([data-micrographics-cover-preset])`,
  );
  const initialTransform = await image.getAttribute("transform");
  await page.getByRole("button", { name: "90° Right", exact: true }).click();
  await expect(image).not.toHaveAttribute("transform", initialTransform ?? "");
  const rotatedTransform = await image.getAttribute("transform");
  await page.getByRole("button", { name: "Flip horizontal", exact: true }).click();
  await expect(image).not.toHaveAttribute("transform", rotatedTransform ?? "");
  const horizontalTransform = await image.getAttribute("transform");
  await page.getByRole("button", { name: "Flip vertical", exact: true }).click();
  await expect(image).not.toHaveAttribute("transform", horizontalTransform ?? "");

  await page.getByRole("button", { name: "Remove source-fixture.svg" }).click();
  await expect(image).toHaveCount(0);
  const sourceField = await getToolcraftControlFieldByTarget(page, "source.image");
  await sourceField.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(svg),
    mimeType: "image/svg+xml",
    name: "source-fixture.svg",
  });
  await expect(image).toBeVisible();
  await page.getByRole("button", { name: "Reset Source Photo section" }).click();
  await expect(image).toHaveCount(0);
});

test("browser: micrographics background output", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const preview = session.observe((root) => {
    const background = root.querySelector<SVGRectElement>(
      '[data-toolcraft-product-output="micrographics"] [data-micrographics-layer="background"] rect',
    );
    return {
      backgroundVisible: Boolean(background),
      outputSignature: background?.getAttribute("fill") ?? "no-background",
    };
  });
  const exclude = session.controlAction("export.includeBackground", async (field) => {
    await field.getByRole("switch").click();
  });
  const exportArtifact = session.controlAction("output.export", async () =>
    captureMicrographicsExport(page),
  );

  await expectToolcraftBackgroundOutputSemantics(
    preview,
    exclude,
    { backgroundVisible: false, outputSignature: "no-background" },
    exportArtifact,
    (artifact) => inspectMicrographicsImage(page, artifact),
    { requirementId: "background-include" },
  );
});

test("browser: micrographics export image", async ({ page }) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);

  const formatArtifact = session.controlAction(
    "export.image.format",
    async (field) => {
      const resolution = await getToolcraftControlFieldByTarget(
        page,
        "export.image.resolution",
      );
      await chooseMicrographicsOption(page, resolution, "2K");
      await chooseMicrographicsOption(page, field, "JPG");
      return captureMicrographicsExport(page);
    },
  );
  const jpg = await expectToolcraftExportedArtifact(
    formatArtifact,
    (artifact) => inspectMicrographicsImage(page, artifact),
    { requirementId: "image-format" },
  );
  const jpgInspection = await inspectMicrographicsImage(page, jpg);
  expect(jpg.fileName).toMatch(/\.jpg$/u);
  expect(jpgInspection.mediaType).toBe("image/jpeg");
  expect(Math.max(jpgInspection.width, jpgInspection.height)).toBe(2048);

  const resolutionArtifact = session.controlAction(
    "export.image.resolution",
    async (field) => {
      const format = await getToolcraftControlFieldByTarget(page, "export.image.format");
      await chooseMicrographicsOption(page, format, "PNG");
      await chooseMicrographicsOption(page, field, "4K");
      return captureMicrographicsExport(page);
    },
  );
  const png = await expectToolcraftExportedArtifact(
    resolutionArtifact,
    (artifact) => inspectMicrographicsImage(page, artifact),
    { requirementId: "image-resolution" },
  );
  const pngInspection = await inspectMicrographicsImage(page, png);
  expect(png.fileName).toMatch(/\.png$/u);
  expect(pngInspection.mediaType).toBe("image/png");
  expect(Math.max(pngInspection.width, pngInspection.height)).toBe(4096);

  await expectToolcraftExportedArtifact(
    session.controlAction("output.export", async () =>
      captureMicrographicsExport(page),
    ),
    (artifact) => inspectMicrographicsImage(page, artifact),
    { requirementId: "output-export" },
  );
});
