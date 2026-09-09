import { expectToolcraftReferenceParity } from "./browser-acceptance-outcome-helpers";
import { expectToolcraftConditionalControlVisibility } from "./browser-conditional-output-evidence-helpers";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  chooseControlOption,
  DONUT_OUTPUT_SELECTOR,
  downloadFromButton,
  fieldFor,
  openDonut,
  setSliderValue,
  waitForDonut,
} from "./donut-test-helpers";
import { getDonutBrowserTestName } from "../src/app/app-acceptance-data";
import {
  DONUT_PRESET_CUSTOM,
  DONUT_PRESET_DEFAULT,
  DONUT_PRESETS,
} from "../src/app/donut/donut-presets";
import {
  DONUT_DEFAULT_PRESET_LIBRARY_JSON,
  DONUT_PRESET_LIBRARY_TARGET,
} from "../src/app/donut/donut-preset-library";
import { expect, test } from "./toolcraft-product-test";

test.setTimeout(360_000);

type PresetDocument = {
  format: string;
  presets: Array<{
    id: string;
    label: string;
    values: Record<string, unknown>;
  }>;
  version: number;
};

type SettingsDocument = {
  appId: string;
  canvas: {
    mode: string;
    size: { height: number; width: number };
  };
  source: string;
  values: Record<string, unknown>;
  version: number;
};

function parsePresetDocument(source: string | Buffer): PresetDocument {
  return JSON.parse(source.toString()) as PresetDocument;
}

function parseSettingsDocument(source: string | Buffer): SettingsDocument {
  return JSON.parse(source.toString()) as SettingsDocument;
}

function presetValue(
  document: PresetDocument,
  presetId: string,
  target: string,
): unknown {
  return document.presets.find((preset) => preset.id === presetId)?.values[
    target
  ];
}

test(getDonutBrowserTestName("donut.preset"), async ({ page }) => {
  await openDonut(page);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForDonut(page);
  const flavor = fieldFor(page, "donut.preset");
  const factoryPresets = parsePresetDocument(
    DONUT_DEFAULT_PRESET_LIBRARY_JSON,
  );

  await expectToolcraftReferenceParity(
    () => flavor.getByRole("combobox").getAttribute("title"),
    "Strawberry Party",
    { requirementId: "donut.preset", target: "donut.preset" },
  );
  await flavor.getByRole("combobox").click();
  await expect(page.locator('[role="option"]')).toHaveText([
    ...DONUT_PRESETS.map((preset) => preset.label),
    "Custom",
  ]);
  await page.keyboard.press("Escape");
  await expect(
    fieldFor(page, "canvas.infinity").getByRole("switch"),
  ).toBeChecked();
  await expect(
    fieldFor(page, "canvas.renderScale").getByRole("slider"),
  ).toHaveValue("2");
  await expect(
    fieldFor(page, "appearance.background").getByRole("textbox"),
  ).toHaveValue("#C8B1BD");
  await expect(
    fieldFor(page, "donut.majorRadius").getByRole("slider"),
  ).toHaveValue("1");
  await expect(
    fieldFor(page, "material.donut.roughness").getByRole("slider"),
  ).toHaveValue("0.58");
  await expect(
    fieldFor(page, "icing.color").getByRole("textbox"),
  ).toHaveValue("#F26D9C");
  await expect(
    fieldFor(page, "sprinkles.seed").getByRole("slider"),
  ).toHaveValue("87");
  await expect(
    fieldFor(page, "studio.environmentRotation").getByRole("slider"),
  ).toHaveValue("330");
  await expect(
    page.locator("[data-donut-canvas]"),
  ).toHaveAttribute(
    "data-donut-orientation",
    JSON.stringify({
      position: [
        -2.8292787171709213,
        5.543043574797161,
        5.590156515560591,
      ],
      up: [
        0.29922053998704756,
        0.7489601052954004,
        -0.5912070949555345,
      ],
    }),
  );

  const initialSettings = parseSettingsDocument(
    (await downloadFromButton(page, "Export Settings")).bytes,
  );
  expect(initialSettings).toMatchObject({
    appId: "donut-studio",
    canvas: {
      mode: "infinite",
      size: { height: 1080, width: 1920 },
    },
    source: "toolcraft-settings",
    values: {
      "appearance.background": "#C8B1BD",
      "canvas.renderScale": 2,
      "donut.height": 1,
      "donut.majorRadius": 1,
      "donut.organic": 1,
      "donut.preset": "strawberry-party",
      "donut.thickness": 1,
      "icing.color": "#F26D9C",
      "material.donut.coat": 0.12,
      "material.donut.roughness": 0.58,
      "material.donut.subsurface": 0.28,
      "material.icing.coat": 0.3,
      "material.icing.glaze": 0.55,
      "material.icing.roughness": 0.5,
      "material.icing.subsurface": 0.35,
      "material.icing.texture": 0.4,
      "sprinkles.flow": 1.25,
      "sprinkles.palette": "4",
      "sprinkles.seed": 87,
      "sprinkles.shape": "3",
      "sprinkles.sizeVariation": 1.09,
      "sprinkles.solidColor": "#F6E7C8",
      "studio.cool.power": 0,
      "studio.environmentRotation": 330,
      "studio.environmentStrength": 0.45,
      "studio.key.power": 1680,
      "studio.warm.power": 230,
      "studio.warm.size": 0.25,
    },
    version: 2,
  });
  const initialLibrary = parsePresetDocument(
    initialSettings.values[DONUT_PRESET_LIBRARY_TARGET] as string,
  );
  expect(initialLibrary.presets[0]?.id).toBe("strawberry-party");
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("donut.preset", async (_control, currentPage) => {
      for (const preset of DONUT_PRESETS) {
        const currentFlavor = fieldFor(currentPage, "donut.preset");
        await chooseControlOption(currentPage, currentFlavor, "Custom");
        const zoomOut = currentPage.getByRole("button", { name: "Zoom out" });
        const zoomValue = zoomOut.locator("xpath=following-sibling::span[1]");
        await zoomOut.click();
        await chooseControlOption(currentPage, currentFlavor, preset.label);
        await waitForDonut(currentPage);
        await expect(
          fieldFor(currentPage, "donut.preset").getByRole("combobox"),
          `Flavor must select ${preset.id}.`,
        ).toHaveAttribute("title", preset.label);
        await expect(
          fieldFor(currentPage, "export.includeBackground").getByRole("switch"),
        ).toBeChecked();
        await expect(
          fieldFor(currentPage, "canvas.infinity").getByRole("switch"),
        ).toBeChecked();
        await expect(zoomValue).toHaveText("170%");
        await expect(
          currentPage.locator("[data-donut-canvas]"),
        ).toHaveAttribute(
          "data-donut-orientation",
          JSON.stringify(
            presetValue(
              factoryPresets,
              DONUT_PRESET_DEFAULT,
              "scene.orientation",
            ),
          ),
        );
        await expect(
          fieldFor(currentPage, "sprinkles.surfaceOffset").getByRole("slider"),
        ).toHaveValue("0");
        await expect(
          fieldFor(currentPage, "appearance.background").getByRole("textbox"),
        ).toHaveValue(
          String(
            presetValue(
              factoryPresets,
              preset.id,
              "appearance.background",
            ),
          ),
        );
      }

      const strawberry = DONUT_PRESETS.find(
        (preset) => preset.id === "strawberry-party",
      )!;
      const otherFlavor = DONUT_PRESETS.find(
        (preset) => preset.id !== strawberry.id,
      )!;
      await chooseControlOption(currentPage, flavor, strawberry.label);
      await setSliderValue(fieldFor(currentPage, "icing.thickness"), 0.63);
      await currentPage.waitForTimeout(120);
      await chooseControlOption(currentPage, flavor, otherFlavor.label);
      await chooseControlOption(currentPage, flavor, strawberry.label);
      await expect(
        fieldFor(currentPage, "icing.thickness").getByRole("slider"),
      ).toHaveValue("0.63");

      await chooseControlOption(currentPage, flavor, "Custom");
      await expect(flavor.getByRole("combobox")).toHaveAttribute(
        "title",
        "Custom",
      );
      expect(DONUT_PRESET_CUSTOM).toBe("custom");
    }),
    {
      requirementId: "donut.preset",
      selector: DONUT_OUTPUT_SELECTOR,
      stabilityIntervalMs: 80,
      timeoutMs: 20_000,
    },
  );
});

test(getDonutBrowserTestName(DONUT_PRESET_LIBRARY_TARGET), async ({ page }) => {
  await openDonut(page);
  const session = await createToolcraftBrowserProofSession(page);
  await waitForDonut(page);
  const defaultPresets = parsePresetDocument(
    DONUT_DEFAULT_PRESET_LIBRARY_JSON,
  );
  await chooseControlOption(
    page,
    fieldFor(page, "donut.preset"),
    "Strawberry Party",
  );
  await expectToolcraftConditionalControlVisibility(
    session,
    session.controlAction("donut.preset", (control, currentPage) =>
      chooseControlOption(currentPage, control, "Custom"),
    ),
    session.controlAction("donut.preset", (control, currentPage) =>
      chooseControlOption(currentPage, control, "Strawberry Party"),
    ),
    {
      requirementId: DONUT_PRESET_LIBRARY_TARGET,
      target: DONUT_PRESET_LIBRARY_TARGET,
    },
  );

  const sceneRadii = [
    { id: "classic-glazed", label: "Classic Glazed", radius: 0.91 },
    { id: "strawberry-party", label: "Strawberry Party", radius: 0.92 },
    { id: "matcha-cream", label: "Matcha Cream", radius: 0.93 },
  ] as const;
  for (const scene of sceneRadii) {
    await chooseControlOption(
      page,
      fieldFor(page, "donut.preset"),
      scene.label,
    );
    await setSliderValue(fieldFor(page, "donut.majorRadius"), scene.radius);
  }
  await chooseControlOption(
    page,
    fieldFor(page, "donut.preset"),
    "Strawberry Party",
  );
  await expect(
    fieldFor(page, "donut.majorRadius").getByRole("slider"),
  ).toHaveValue("0.92");

  const exported = await downloadFromButton(page, "Export Settings");
  const settings = parseSettingsDocument(exported.bytes);
  expect(settings).toMatchObject({
    appId: "donut-studio",
    source: "toolcraft-settings",
    version: 2,
  });
  expect(typeof settings.values[DONUT_PRESET_LIBRARY_TARGET]).toBe("string");
  const library = parsePresetDocument(
    settings.values[DONUT_PRESET_LIBRARY_TARGET] as string,
  );
  for (const scene of sceneRadii) {
    expect(
      presetValue(library, scene.id, "donut.majorRadius"),
      `${scene.label} must travel inside the exported Settings JSON.`,
    ).toBe(scene.radius);
    expect(
      presetValue(library, scene.id, "scene.orientation"),
      `${scene.label} must include the shared Strawberry camera pose.`,
    ).toEqual(
      presetValue(defaultPresets, DONUT_PRESET_DEFAULT, "scene.orientation"),
    );
    expect(presetValue(library, scene.id, "canvas.infinity")).toBe(true);
  }

  const staleSettings = structuredClone(settings);
  const staleLibrary = parsePresetDocument(
    staleSettings.values[DONUT_PRESET_LIBRARY_TARGET] as string,
  );
  const staleStrawberry = staleLibrary.presets.find(
    (preset) => preset.id === "strawberry-party",
  );
  expect(staleStrawberry).toBeDefined();
  staleStrawberry!.values["donut.majorRadius"] = 0.85;
  staleSettings.values[DONUT_PRESET_LIBRARY_TARGET] =
    `${JSON.stringify(staleLibrary, null, 2)}\n`;
  staleSettings.values["donut.preset"] = "strawberry-party";
  staleSettings.values["donut.majorRadius"] = 0.92;

  await setSliderValue(fieldFor(page, "donut.majorRadius"), 1.01);

  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction(
      DONUT_PRESET_LIBRARY_TARGET,
      async (_control, currentPage) => {
        const chooserPromise = currentPage.waitForEvent("filechooser");
        await currentPage
          .getByRole("button", { exact: true, name: "Import Settings" })
          .click();
        const chooser = await chooserPromise;
        await chooser.setFiles({
          buffer: Buffer.from(JSON.stringify(staleSettings)),
          mimeType: "application/json",
          name: exported.fileName,
        });
        await expect(
          fieldFor(currentPage, "donut.majorRadius").getByRole("slider"),
        ).toHaveValue("0.92");
      },
    ),
    {
      requirementId: DONUT_PRESET_LIBRARY_TARGET,
      selector: DONUT_OUTPUT_SELECTOR,
      stabilityIntervalMs: 80,
      timeoutMs: 20_000,
    },
  );

  await page.reload();
  await waitForDonut(page);
  await expect(
    fieldFor(page, "donut.majorRadius").getByRole("slider"),
  ).toHaveValue("0.92");

  const repairedExport = parseSettingsDocument(
    (await downloadFromButton(page, "Export Settings")).bytes,
  );
  const repairedLibrary = parsePresetDocument(
    repairedExport.values[DONUT_PRESET_LIBRARY_TARGET] as string,
  );
  expect(
    presetValue(repairedLibrary, "strawberry-party", "donut.majorRadius"),
  ).toBe(0.92);

  for (const scene of sceneRadii.slice(0, 2)) {
    await chooseControlOption(
      page,
      fieldFor(page, "donut.preset"),
      scene.label,
    );
    await expect(
      fieldFor(page, "donut.majorRadius").getByRole("slider"),
    ).toHaveValue(String(scene.radius));
  }

  await expect(page.getByText("Preset JSON", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Preset Library", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Preset Tools", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { exact: true, name: "Download JSON" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { exact: true, name: "Apply JSON" }),
  ).toHaveCount(0);
  await expect(
    fieldFor(page, DONUT_PRESET_LIBRARY_TARGET).getByRole("textbox"),
  ).toHaveCount(0);
});
