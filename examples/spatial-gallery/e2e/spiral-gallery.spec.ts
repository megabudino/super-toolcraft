import { expectToolcraftExportedArtifact } from "./browser-acceptance-outcome-helpers";
import {
  expectToolcraftBackgroundOutputSemantics,
  expectToolcraftConditionalControlVisibility,
} from "./browser-conditional-output-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import {
  expectToolcraftCompoundControlPartOutcome,
  expectToolcraftMediaLifecycle,
  expectToolcraftPersistenceState,
} from "./browser-state-evidence-helpers";
import { getToolcraftControlFieldByTarget } from "./browser-control-target-helpers";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  clearSpiralGalleryImages,
  dragSliderToFraction,
  exportSpiralCode,
  exportSpiralImage,
  getSpiralCanvasPoint,
  inspectSpiralCode,
  inspectSpiralImage,
  nudgeSpiralWithArrow,
  resetSpiralTestPage,
  selectToolcraftOption,
  setControlText,
  setSpiralCanvasSize,
  spiralFixturePaths,
  spiralSliderRequirements,
  uploadSpiralFixtures,
  waitForSpiralCards,
  waitForSpiralSettled,
} from "./spiral-gallery-test-helpers";
import { expect, test } from "./toolcraft-product-test";
import { spiralSliderEndpoint } from "./spiral-slider-endpoint";
const controlsBrowserTest = "browser: image gallery controls update rendered output";
const exportBrowserTest = "browser: image gallery background and export preserve output semantics";
const interactionBrowserTest = "browser: image gallery canvas navigation preserves physical behavior";
const mediaBrowserTest = "browser: image gallery media lifecycle controls the rendered sequence";
const persistenceBrowserTest = "browser: image gallery settings and media persist after reload";
const galleryPresetFileNames = [
  "Woman with White Eyeliner and Yellow Jacket.jpg",
  "White SUV Desert Photo.jpg",
  "Aerial Mountain Range.jpg",
  "Blue Ice Cave.jpg",
  "Pink White Background Image.jpg",
  "Desert Dune.jpg",
  "Modern High-Rise Buildings.jpg",
  "Blue Pink Light Illustration.jpg",
  "Snow-capped Mountain.jpg",
  "Turquoise Ocean.jpg",
  "Geometric Facade London.jpg",
  "Abstract Red Orange Background.jpg",
  "Modern Architecture.jpg",
  "Blue Pink Background Wallpaper.jpg",
] as const;

function sectionForTarget(target: string): string {
  const prefix = target.split(".")[0];
  return {
    card: "Cards",
    depth: "Depth",
    interaction: "Interaction",
    physics: "Physics",
    shadow: "Shadow",
    spiral: "Flow",
    view: "View",
  }[prefix ?? ""] ?? "";
}

async function resetTargetSection(page: Parameters<typeof getToolcraftControlFieldByTarget>[0], target: string) {
  const section = sectionForTarget(target);
  if (section) {
    await page.getByRole("button", { name: `Reset ${section} section` }).click();
    await page.waitForTimeout(180);
  }
}

test.setTimeout(600_000);

test(controlsBrowserTest, async ({ page }) => {
  await resetSpiralTestPage(page);
  await setSpiralCanvasSize(page, 640, 360);
  await uploadSpiralFixtures(page);
  await waitForSpiralCards(page, 12);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForSpiralCards(page, 12);

  for (const [requirementId, target] of spiralSliderRequirements) {
    let pointerHeld = false;
    const action = session.controlAction(target, async (control, currentPage) => {
      const slider = control.getByRole("slider");
      const current = Number(await slider.getAttribute("aria-valuenow"));
      const minimum = Number(await slider.getAttribute("aria-valuemin") ?? await slider.getAttribute("min"));
      const maximum = Number(await slider.getAttribute("aria-valuemax") ?? await slider.getAttribute("max"));
      await dragSliderToFraction(control, currentPage, 0.78);
      const requiresMaximum = new Set([
        "depth.minScale",
        "interaction.parallax",
        "interaction.pressDepth",
        "interaction.pressShrink",
        "physics.dragSpeed",
        "physics.wheelSpeed",
      ]).has(target);
      await slider.press(
        requiresMaximum ? "End" : spiralSliderEndpoint(current, minimum, maximum),
      );
      if (target === "spiral.repetitions") {
        await slider.press("End");
        await waitForSpiralCards(currentPage, 32);
      }
      const point = await getSpiralCanvasPoint(currentPage);
      if (target === "physics.wheelSpeed" || target === "physics.snapStrength") {
        await currentPage.mouse.move(point.x, point.y);
        await currentPage.mouse.wheel(0, 260);
      } else if (target === "physics.dragSpeed") {
        await currentPage.mouse.move(point.x, point.y + 60);
        await currentPage.mouse.down();
        await currentPage.mouse.move(point.x, point.y - 60, { steps: 6 });
        await currentPage.mouse.up();
      } else if (target.startsWith("physics.")) {
        await nudgeSpiralWithArrow(currentPage);
      } else if (
        target === "interaction.pressDepth" ||
        target === "interaction.pressShrink"
      ) {
        await currentPage.mouse.move(point.x, point.y);
        await currentPage.mouse.down();
        pointerHeld = true;
      } else if (target === "interaction.parallax") {
        await currentPage.mouse.move(point.x - 220, point.y - 140);
      }
    });
    await expectToolcraftProductObservableToChange(session, action, {
      requirementId,
      stabilityIntervalMs: 100,
      timeoutMs: 8_000,
    });
    const resetBeforeSettle = target.startsWith("physics.");
    if (resetBeforeSettle) await resetTargetSection(page, target);
    await waitForSpiralSettled(page);
    if (pointerHeld) await page.mouse.up();
    if (pointerHeld) await waitForSpiralSettled(page);
    if (!resetBeforeSettle) await resetTargetSection(page, target);
  }
  await expectToolcraftDiscreteSliderMarkers(
    page,
    "spiral.repetitions",
    "spiral-repetitions",
  );

  const shadowSignature = session.observe(
    (root) =>
      root
        .querySelector('[data-image-gallery-canvas="true"]')
        ?.getAttribute("data-image-gallery-shadow") ?? "",
  );
  const setShadowHex = (hex: string) =>
    session.controlAction("shadow.color", async (control) => {
      const hexInput = control.getByRole("textbox", { name: "Color hex" });
      await hexInput.fill(hex);
      await hexInput.press("Enter");
    });
  const setShadowOpacity = (opacity: string) =>
    session.controlAction("shadow.color", async (control) => {
      const opacityInput = control.getByRole("textbox", {
        name: "Color opacity",
      });
      await opacityInput.fill(opacity);
      await opacityInput.press("Enter");
    });
  const setShadowOffset = (valueLabel: string) =>
    session.controlAction("shadow.offset", async (control, currentPage) => {
      await control.getByRole("button", { name: "Edit Offset value" }).click();
      const valueInput = currentPage.getByRole("textbox", {
        name: "Offset value",
      });
      await valueInput.fill(valueLabel);
      await valueInput.press("Enter");
    });

  await expectToolcraftCompoundControlPartOutcome(
    shadowSignature,
    setShadowHex("#FF3300"),
    "#ff3300|35|0.35|0.20|0.35",
    {
      part: "colorOpacity.hex",
      requirementId: "shadow-color",
      stabilityIntervalMs: 120,
      timeoutMs: 8_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    shadowSignature,
    setShadowOpacity("60"),
    "#ff3300|60|0.35|0.20|0.35",
    {
      part: "colorOpacity.opacity",
      requirementId: "shadow-color",
      stabilityIntervalMs: 120,
      timeoutMs: 8_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    setShadowHex("#22CC88"),
    { requirementId: "shadow-color", stabilityIntervalMs: 100, timeoutMs: 8_000 },
  );
  await expectToolcraftCompoundControlPartOutcome(
    shadowSignature,
    setShadowOffset("0.45, 0.35"),
    "#22cc88|60|0.35|0.45|0.35",
    {
      part: "vector.x",
      requirementId: "shadow-offset",
      stabilityIntervalMs: 120,
      timeoutMs: 8_000,
    },
  );
  await expectToolcraftCompoundControlPartOutcome(
    shadowSignature,
    setShadowOffset("0.45, -0.30"),
    "#22cc88|60|0.35|0.45|-0.30",
    {
      part: "vector.y",
      requirementId: "shadow-offset",
      stabilityIntervalMs: 120,
      timeoutMs: 8_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    setShadowOffset("-0.35, 0.10"),
    { requirementId: "shadow-offset", stabilityIntervalMs: 100, timeoutMs: 8_000 },
  );
  await waitForSpiralSettled(page);
  await page.getByRole("button", { name: "Reset Shadow section" }).click();
  await page.waitForTimeout(180);
  await waitForSpiralSettled(page);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("interaction.invertDirection", async (control, currentPage) => {
      await control.getByRole("switch").click();
      await nudgeSpiralWithArrow(currentPage);
    }),
    { requirementId: "interaction-invert-direction", stabilityIntervalMs: 100 },
  );
  await waitForSpiralSettled(page);
  await page.getByRole("button", { name: "Reset Interaction section" }).click();

  await expectToolcraftConditionalControlVisibility(
    session,
    session.controlAction("layout.mode", async (control) => {
      await control.getByRole("button", { name: "Deck", exact: true }).click();
    }),
    session.controlAction("layout.mode", async (control) => {
      await control.getByRole("button", { name: "Flow", exact: true }).click();
    }),
    { requirementId: "spiral-radius", target: "spiral.radius" },
  );
});

test(mediaBrowserTest, async ({ page }) => {
  await resetSpiralTestPage(page);
  await waitForSpiralCards(page, galleryPresetFileNames.length * 3);
  const session = await createToolcraftBrowserProofSession(page);
  const observeMedia = session.observe((root) => {
    const names = Array.from(root.querySelectorAll('button[aria-label^="Select "] img'))
      .map((image) => image.getAttribute("alt") ?? "")
      .filter(Boolean);
    const cardCount =
      root.querySelector<HTMLCanvasElement>('[data-image-gallery-canvas="true"]')
        ?.dataset.imageGalleryCardCount ?? "0";
    return { itemIds: names, outputSignature: `${names.join("|")}:${cardCount}` };
  });
  await expectToolcraftMediaLifecycle(
    observeMedia,
    session.controlAction("source.images", async (control, currentPage) => {
      await clearSpiralGalleryImages(currentPage);
      await currentPage.getByRole("button", { name: "Reset Gallery section" }).click();
      await waitForSpiralCards(currentPage, galleryPresetFileNames.length * 3);
      const presetImages = control.locator('button[aria-label^="Select "] img');
      await expect(presetImages).toHaveCount(galleryPresetFileNames.length);
      expect(
        await presetImages.evaluateAll((images) =>
          images.every((image) => image.getAttribute("src")?.endsWith(".jpg")),
        ),
      ).toBe(true);
      expect(
        await presetImages.evaluateAll(
          (images) => images.map((image) => image.getAttribute("alt") ?? ""),
        ),
      ).toEqual(galleryPresetFileNames);
      await clearSpiralGalleryImages(currentPage);
      await control.locator('input[type="file"]').setInputFiles(Object.values(spiralFixturePaths));
      await waitForSpiralCards(currentPage, 12);
      await currentPage.getByRole("button", { name: "Select spiral-coral.svg" }).click();
      await currentPage.getByRole("button", { name: "90° Right" }).click();
      await currentPage.getByRole("button", { name: "Flip horizontal" }).click();
      const reorderCoral = currentPage.getByRole("button", {
        name: "Reorder spiral-coral.svg",
      });
      const greenTile = currentPage
        .locator('[data-slot="file-upload-preview-item"]')
        .filter({
          has: currentPage.getByRole("button", {
            name: "Reorder spiral-green.svg",
          }),
        });
      await reorderCoral.scrollIntoViewIfNeeded();
      const coralHandleBox = await reorderCoral.boundingBox();
      const greenTileBox = await greenTile.boundingBox();
      expect(coralHandleBox).not.toBeNull();
      expect(greenTileBox).not.toBeNull();
      const coralHandleCenter = {
        x: coralHandleBox!.x + coralHandleBox!.width / 2,
        y: coralHandleBox!.y + coralHandleBox!.height / 2,
      };
      await currentPage.mouse.move(coralHandleCenter.x, coralHandleCenter.y);
      await currentPage.mouse.down();
      await currentPage.mouse.move(
        coralHandleCenter.x + 10,
        coralHandleCenter.y,
        { steps: 2 },
      );
      await expect(
        currentPage.locator('[data-preview-dragging="true"]'),
      ).toHaveCount(1);
      await currentPage.mouse.move(
        greenTileBox!.x + greenTileBox!.width / 2,
        greenTileBox!.y + greenTileBox!.height / 2,
        { steps: 8 },
      );
      await currentPage.mouse.up();
      await expect(
        currentPage.locator('[data-preview-dragging="true"]'),
      ).toHaveCount(0);
      await expect
        .poll(() =>
          control.locator('button[aria-label^="Select "] img').evaluateAll(
            (images) => images.map((image) => image.getAttribute("alt") ?? ""),
          ),
        )
        .toEqual([
          "spiral-blue.svg",
          "spiral-green.svg",
          "spiral-coral.svg",
          "spiral-violet.svg",
        ]);
      const removeBlue = currentPage.getByRole("button", {
        name: "Remove spiral-blue.svg",
      });
      await removeBlue.focus();
      await removeBlue.press("Enter");
      await waitForSpiralCards(currentPage, 9);
    }),
    {
      itemIds: ["spiral-green.svg", "spiral-coral.svg", "spiral-violet.svg"],
      outputSignature: "spiral-green.svg|spiral-coral.svg|spiral-violet.svg:9",
    },
    { requirementId: "source-images", stabilityIntervalMs: 100, timeoutMs: 20_000 },
  );
});

test(persistenceBrowserTest, async ({ page }) => {
  await resetSpiralTestPage(page);
  const session = await createToolcraftBrowserProofSession(page);
  const persisted = session.observe((root) => {
    const inertiaValue = Array.from(root.querySelectorAll("button")).find(
      (button) => button.getAttribute("aria-label") === "Edit Inertia value",
    );
    return {
      cards:
        root.querySelector<HTMLCanvasElement>('[data-image-gallery-canvas="true"]')
          ?.dataset.imageGalleryCardCount ?? "0",
      images: Array.from(root.querySelectorAll('button[aria-label^="Select "] img')).map(
        (image) => image.getAttribute("alt") ?? "",
      ),
      inertia: inertiaValue?.textContent?.trim() ?? "",
    };
  });
  await expectToolcraftPersistenceState(
    persisted,
    session.controlAction("physics.inertia", async (control, currentPage) => {
      await control.getByRole("slider").fill("0.15");
      await uploadSpiralFixtures(currentPage, [
        spiralFixturePaths.coral,
        spiralFixturePaths.green,
      ]);
      await waitForSpiralCards(currentPage, 6);
    }),
    session.reload(),
    {
      cards: "6",
      images: ["spiral-coral.svg", "spiral-green.svg"],
      inertia: "0.15",
    },
    { requirementId: "persistence-reload", stabilityIntervalMs: 150, timeoutMs: 12_000 },
  );
});

test(interactionBrowserTest, async ({ page }) => {
  await resetSpiralTestPage(page);
  await uploadSpiralFixtures(page);
  await waitForSpiralCards(page, 12);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForSpiralCards(page, 12);
  const runOutputProof = async (
    requirementId: string,
    target: string,
    action: (currentPage: typeof page) => Promise<void>,
  ) => {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, (_control, currentPage) => action(currentPage)),
      { requirementId, stabilityIntervalMs: 100, timeoutMs: 8_000 },
    );
    await waitForSpiralSettled(page);
  };

  await runOutputProof("gallery-canvas-navigation", "physics.keyStep", (currentPage) =>
    nudgeSpiralWithArrow(currentPage, 3),
  );
});
test(exportBrowserTest, async ({ page }) => {
  await resetSpiralTestPage(page);
  await uploadSpiralFixtures(page);
  await waitForSpiralCards(page, 12);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForSpiralCards(page, 12);

  const backgroundPreview = session.observe((root) => {
    const visible = root.querySelector('[data-image-gallery-background="true"]') !== null;
    return { backgroundVisible: visible, outputSignature: visible ? "included" : "transparent" };
  });
  await selectToolcraftOption(page, "export.image.resolution", "2K");
  const includeControl = await getToolcraftControlFieldByTarget(
    page,
    "export.includeBackground",
  );
  await includeControl.getByRole("switch").click();
  await expectToolcraftBackgroundOutputSemantics(
    backgroundPreview,
    session.controlAction("export.includeBackground", async (control) => {
      await control.getByRole("switch").click();
    }),
    { backgroundVisible: false, outputSignature: "transparent" },
    session.action((currentPage) => exportSpiralImage(currentPage)),
    (artifact) => inspectSpiralImage(page, artifact),
    { requirementId: "background-include", stabilityIntervalMs: 100 },
  );
  await includeControl.getByRole("switch").click();

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("appearance.background", (control) =>
      setControlText(control, "#304FFE"),
    ),
    { requirementId: "background-color", stabilityIntervalMs: 100 },
  );

  await selectToolcraftOption(page, "export.image.format", "JPG");
  const jpgArtifact = await expectToolcraftExportedArtifact(
    session.controlAction("export.image.format", (_control, currentPage) =>
      exportSpiralImage(currentPage),
    ),
    (artifact) => inspectSpiralImage(page, artifact),
    { requirementId: "image-format" },
  );
  const jpgInspection = await inspectSpiralImage(page, jpgArtifact);
  expect(jpgInspection.mediaType).toBe("image/jpeg");

  await selectToolcraftOption(page, "export.image.format", "PNG");
  await selectToolcraftOption(page, "export.image.resolution", "2K");
  const twoK = await exportSpiralImage(page);
  const twoKInspection = await inspectSpiralImage(page, twoK);
  await selectToolcraftOption(page, "export.image.resolution", "4K");
  const fourK = await expectToolcraftExportedArtifact(
    session.controlAction("export.image.resolution", (_control, currentPage) =>
      exportSpiralImage(currentPage),
    ),
    (artifact) => inspectSpiralImage(page, artifact),
    { requirementId: "image-resolution" },
  );
  const fourKInspection = await inspectSpiralImage(page, fourK);
  expect(twoKInspection.width).toBe(2048);
  expect(fourKInspection.width).toBe(4096);
  expect(fourKInspection.height).toBe(twoKInspection.height * 2);

  const codeArtifact = await expectToolcraftExportedArtifact(
    session.controlAction("export.actions", (_control, currentPage) => exportSpiralCode(currentPage)),
    inspectSpiralCode,
    { requirementId: "export-actions" },
  );
  const codeInspection = await inspectSpiralCode(codeArtifact);
  expect({ ...codeInspection, fileName: codeArtifact.fileName }).toMatchObject({
    background: "#304FFE", fileName: "image-gallery-agent-kit.zip", hasAgentGuide: true,
    hasPhysicalBend: true, imageCount: 4, layout: "spiral", mediaType: "application/zip",
  });
});
