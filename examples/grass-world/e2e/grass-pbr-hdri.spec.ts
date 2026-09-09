import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import {
  createToolcraftBrowserProofSession,
  readToolcraftBrowserObservation,
} from "./browser-proof-session";
import {
  expectToolcraftCompoundControlPartOutcome,
  expectToolcraftMediaLifecycle,
} from "./browser-state-evidence-helpers";
import { prepareGrassSession } from "./grass-test-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  expect,
  test,
  type ToolcraftProductTestFixtures,
} from "./toolcraft-product-test";

const canvasSelector = '[data-slot="grass-webgl-canvas"]';
type Page = ToolcraftProductTestFixtures["page"];

function control(page: Page, target: string) {
  return page.locator(`[data-toolcraft-control-target="${target}"]`);
}

async function setSliderEdge(page: Page, target: string, edge: "Home" | "End") {
  const slider = control(page, target).getByRole("slider");
  await slider.focus();
  await slider.press(edge);
}

test("scene-wide HDRI and always-PBR materials render lighting", async ({
  page,
}) => {
  test.setTimeout(600_000);
  const session = await prepareGrassSession(page);
  const canvas = page.locator(canvasSelector);

  const visibleHdri = control(page, "environment.visible").getByRole("switch");
  if ((await visibleHdri.getAttribute("aria-checked")) === "false") {
    await visibleHdri.click();
  }

  await expect(control(page, "preview.mode")).toHaveCount(0);
  await expect(control(page, "appearance.pbrEnabled")).toHaveCount(0);
  await expect(control(page, "appearance.materialStyle")).toHaveCount(0);
  for (const target of [
    "appearance.pbrSheen",
    "lawn.pbrSheen",
    "appearance.textureMaskLevels",
    "surface.textureMaskLevels",
    "scan.tufted.pbrAoStrength",
    "scan.tufted.pbrSheen",
    "scan.tufted.pbrBacklight",
  ]) {
    await expect(control(page, target)).toHaveCount(0);
  }
  await expect(canvas).toHaveAttribute("data-grass-pbr-enabled", "true");
  await expect(canvas).toHaveAttribute(
    "data-grass-preview-representation",
    "pbr-clumps",
  );
  await expect(canvas).toHaveAttribute(
    "data-grass-environment-signature",
    /preset:meadow/u,
  );

  await expectToolcraftConditionalControlVisibility(
    session,
    session.controlAction("environment.visible", async (field) => {
      const toggle = field.getByRole("switch");
      if ((await toggle.getAttribute("aria-checked")) === "true") {
        await toggle.click();
      }
    }),
    session.controlAction("environment.visible", async (field) => {
      const toggle = field.getByRole("switch");
      if ((await toggle.getAttribute("aria-checked")) === "false") {
        await toggle.click();
      }
    }),
    {
      requirementId: "grass.hdri-blur",
      target: "environment.backgroundBlur",
      timeoutMs: 15_000,
    },
  );

  for (const [target, requirementId] of [
    ["appearance.pbrRoughness", "grass.pbr-roughness"],
    ["environment.intensity", "grass.hdri-intensity"],
    ["environment.rotationX", "grass.hdri-rotation-x"],
    ["environment.rotation", "grass.hdri-rotation"],
    ["environment.rotationZ", "grass.hdri-rotation-z"],
    ["environment.backgroundBlur", "grass.hdri-blur"],
    ["environment.keyStrength", "grass.key-strength"],
    ["environment.fillStrength", "grass.fill-strength"],
    ["environment.rimStrength", "grass.rim-strength"],
    ["environment.exposure", "grass.scene-exposure"],
    ["environment.sceneContrast", "grass.scene-contrast"],
    ["environment.sceneSaturation", "grass.scene-saturation"],
    ["environment.highlightWarmth", "grass.highlight-warmth"],
    ["environment.shadowCoolness", "grass.shadow-coolness"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (_field, currentPage) => {
        await setSliderEdge(currentPage, target, "End");
      }),
      { requirementId, timeoutMs: 20_000 },
    );
  }

  for (const [target, requirementId, color] of [
    ["environment.keyColor", "grass.key-color", "#ffc56b"],
    ["environment.fillColor", "grass.fill-color", "#6f9fb8"],
    ["environment.rimColor", "grass.rim-color", "#b5d8ff"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        const input = field.getByRole("textbox");
        await input.fill(color);
        await input.press("Enter");
      }),
      { requirementId, timeoutMs: 20_000 },
    );
  }

  const include = control(page, "export.includeBackground").getByRole("switch");
  if ((await include.getAttribute("aria-checked")) === "false") {
    await include.click();
  }
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("environment.visible", async (field) => {
      await field.getByRole("switch").click();
    }),
    { requirementId: "grass.hdri-background", timeoutMs: 20_000 },
  );
  await control(page, "environment.visible").getByRole("switch").click();

  const picker = control(page, "environment.preset");
  const hashes: Buffer[] = [];
  for (const [label, value] of [
    ["Meadow HDRI environment", "meadow"],
    ["Alps HDRI environment", "alps"],
    ["Sunrise HDRI environment", "sunrise"],
    ["Hard Sun HDRI environment", "hardSun"],
    ["Overcast Field HDRI environment", "overcast"],
    ["Forest Shade HDRI environment", "forest"],
    ["Golden Sunset HDRI environment", "golden"],
    ["Blend Sunset HDRI environment", "blendSunset"],
  ] as const) {
    await picker.getByRole("button", { name: label, exact: true }).click();
    await expect
      .poll(() => canvas.getAttribute("data-grass-environment-preset"), {
        timeout: 25_000,
      })
      .toBe(value);
    hashes.push(await canvas.screenshot());
  }
  for (let index = 1; index < hashes.length; index += 1) {
    expect(Buffer.compare(hashes[index - 1]!, hashes[index]!)).not.toBe(0);
  }
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("environment.preset", async (field) => {
      await field
        .getByRole("button", { name: "Meadow HDRI environment", exact: true })
        .click();
    }),
    { requirementId: "grass.hdri-preset", timeoutMs: 25_000 },
  );
  const bright = await canvas.screenshot();
  const brightSignature = await canvas.getAttribute(
    "data-grass-settings-signature",
  );
  await setSliderEdge(page, "environment.intensity", "Home");
  await expect
    .poll(() => canvas.getAttribute("data-grass-settings-signature"), {
      timeout: 20_000,
    })
    .not.toBe(brightSignature);
  const dark = await canvas.screenshot();
  expect(Buffer.compare(bright, dark)).not.toBe(0);
});

test("grass custom HDRI upload clear reset and persistence", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const session = await prepareGrassSession(page);
  const hdriControl = control(page, "environment.hdriFile");
  const hdrPath = "src/app/grass/assets/hdri/bloem_field_sunrise_1k.hdr";

  const upload = async () => {
    await hdriControl.locator('input[type="file"]').setInputFiles(hdrPath);
    await expect(page.locator(canvasSelector)).toHaveAttribute(
      "data-grass-environment-source",
      "custom",
      { timeout: 25_000 },
    );
    await expect(page.locator(canvasSelector)).toHaveAttribute(
      "data-grass-environment-signature",
      /bloem_field_sunrise_1k\.hdr/u,
      { timeout: 25_000 },
    );
  };

  await upload();
  await hdriControl
    .getByRole("button", { name: "Remove bloem_field_sunrise_1k.hdr" })
    .click();
  await expect(page.locator(canvasSelector)).toHaveAttribute(
    "data-grass-environment-source",
    "preset",
    { timeout: 25_000 },
  );

  await upload();
  await page.getByRole("button", { name: "Reset controls" }).click();
  await expect(
    hdriControl.getByRole("button", { name: /^Remove /u }),
  ).toHaveCount(0);
  await expect(page.locator(canvasSelector)).toHaveAttribute(
    "data-grass-environment-source",
    "preset",
  );

  const mediaObservation = session.observe((root) => {
    const field = root.querySelector(
      '[data-toolcraft-control-target="environment.hdriFile"]',
    );
    const remove = field?.querySelector<HTMLButtonElement>(
      'button[aria-label^="Remove "]',
    );
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    return {
      itemIds: remove
        ? [remove.getAttribute("aria-label") ?? "custom-hdri"]
        : [],
      outputSignature: canvas?.dataset.grassEnvironmentSource ?? "missing",
    };
  });
  await expectToolcraftMediaLifecycle(
    mediaObservation,
    session.controlAction(
      "environment.hdriFile",
      async (_field, currentPage) => {
        await currentPage
          .locator(
            '[data-toolcraft-control-target="environment.hdriFile"] input[type="file"]',
          )
          .setInputFiles(hdrPath);
      },
    ),
    {
      itemIds: ["Remove bloem_field_sunrise_1k.hdr"],
      outputSignature: "custom",
    },
    {
      requirementId: "grass.hdri-file",
      stabilityIntervalMs: 60,
      timeoutMs: 30_000,
    },
  );
});

test("sun patches move broad light and shadow across the field", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const session = await prepareGrassSession(page);
  const includeTarget = "environment.sunPatchEnabled";
  const include = control(page, includeTarget).getByRole("switch");
  if ((await include.getAttribute("aria-checked")) === "false") {
    await include.click();
  }

  const conditionalRows = [
    ["environment.sunPatchScale", "grass.sun-patch-scale"],
    ["environment.sunPatchCoverage", "grass.sun-patch-coverage"],
    ["environment.sunPatchSoftness", "grass.sun-patch-softness"],
    ["environment.sunPatchStrength", "grass.sun-patch-strength"],
    ["environment.sunPatchOffset", "grass.sun-patch-offset"],
    ["environment.sunPatchSeed", "grass.sun-patch-seed"],
  ] as const;
  for (const [target, requirementId] of conditionalRows) {
    await expectToolcraftConditionalControlVisibility(
      session,
      session.controlAction(includeTarget, async (field) => {
        await field.getByRole("switch").click();
      }),
      session.controlAction(includeTarget, async (field) => {
        await field.getByRole("switch").click();
      }),
      { requirementId, target, timeoutMs: 20_000 },
    );
  }

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(includeTarget, async (field) => {
      await field.getByRole("switch").click();
    }),
    { requirementId: "grass.sun-patches-enabled", timeoutMs: 20_000 },
  );
  await include.click();

  for (const [target, requirementId, key] of [
    ["environment.sunPatchScale", "grass.sun-patch-scale", "End"],
    ["environment.sunPatchCoverage", "grass.sun-patch-coverage", "ArrowRight"],
    ["environment.sunPatchSoftness", "grass.sun-patch-softness", "Home"],
    ["environment.sunPatchStrength", "grass.sun-patch-strength", "End"],
    ["environment.sunPatchSeed", "grass.sun-patch-seed", "End"],
  ] as const) {
    await expectToolcraftProductObservableToChange(
      session,
      session.controlAction(target, async (field) => {
        const slider = field.getByRole("slider");
        await slider.focus();
        await slider.press(key);
      }),
      { requirementId, timeoutMs: 20_000 },
    );
  }

  const patchPixels = session.observe((root) => {
    const canvas = root.querySelector<HTMLCanvasElement>(
      '[data-slot="grass-webgl-canvas"]',
    );
    const value = canvas?.toDataURL("image/png") ?? "missing";
    let hash = 2_166_136_261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16_777_619);
    }
    return hash >>> 0;
  });
  const offsetField = control(page, "environment.sunPatchOffset");
  const pad = offsetField.getByRole("button", { name: "Offset X/Y pad" });
  const clickPad = async (xRatio: number, yRatio: number) => {
    const bounds = await pad.boundingBox();
    expect(bounds).not.toBeNull();
    await pad.click({
      position: {
        x: Math.max(1, Math.min(bounds!.width - 1, bounds!.width * xRatio)),
        y: Math.max(1, Math.min(bounds!.height - 1, bounds!.height * yRatio)),
      },
    });
  };

  const baseline = await readToolcraftBrowserObservation(patchPixels);
  await clickPad(0.82, 0.5);
  await expect
    .poll(() => readToolcraftBrowserObservation(patchPixels), {
      timeout: 20_000,
    })
    .not.toBe(baseline);
  const expectedX = await readToolcraftBrowserObservation(patchPixels);
  await pad.dblclick();
  await expect
    .poll(() => readToolcraftBrowserObservation(patchPixels), {
      timeout: 20_000,
    })
    .toBe(baseline);
  await expectToolcraftCompoundControlPartOutcome(
    patchPixels,
    session.controlAction("environment.sunPatchOffset", async () => {
      await clickPad(0.82, 0.5);
    }),
    expectedX,
    {
      part: "vector.x",
      requirementId: "grass.sun-patch-offset",
      timeoutMs: 20_000,
    },
  );

  await pad.dblclick();
  await expect
    .poll(() => readToolcraftBrowserObservation(patchPixels), {
      timeout: 20_000,
    })
    .toBe(baseline);
  await clickPad(0.5, 0.18);
  await expect
    .poll(() => readToolcraftBrowserObservation(patchPixels), {
      timeout: 20_000,
    })
    .not.toBe(baseline);
  const expectedY = await readToolcraftBrowserObservation(patchPixels);
  await pad.dblclick();
  await expect
    .poll(() => readToolcraftBrowserObservation(patchPixels), {
      timeout: 20_000,
    })
    .toBe(baseline);
  await expectToolcraftCompoundControlPartOutcome(
    patchPixels,
    session.controlAction("environment.sunPatchOffset", async () => {
      await clickPad(0.5, 0.18);
    }),
    expectedY,
    {
      part: "vector.y",
      requirementId: "grass.sun-patch-offset",
      timeoutMs: 20_000,
    },
  );
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("environment.sunPatchOffset", async () => {
      await pad.dblclick();
    }),
    { requirementId: "grass.sun-patch-offset", timeoutMs: 20_000 },
  );
});
