import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftPersistenceState } from "./browser-state-evidence-helpers";
import { expectToolcraftDiscreteSliderMarkers } from "./performance-control-layout-helpers";
import { expect, test } from "./toolcraft-product-test";
import { expectGlobeControlOrder } from "./product-landing-globe-order-helpers";
import {
  BAND_1_POSITION_TARGET,
  BAND_1_WIDTH_TARGET,
  BAND_COLUMN_SPACING_TARGET,
  BAND_DISTANCE_TARGET,
  CRT_INTENSITY_TARGET,
  LATITUDES_TARGET,
  LOGO_DXC_FINAL_POSITION_TARGET,
  LOGO_HOLD_SECONDS_TARGET,
  LOGO_META_FINAL_POSITION_TARGET,
  LOGO_PRADA_FINAL_POSITION_TARGET,
  LOGO_SPEED_TARGET,
  LOGO_ZILLOW_FINAL_POSITION_TARGET,
  OUTLINE_TARGET,
  fillControlText,
  setRangeControl,
  setSwitchControl,
} from "./product-landing-globe-helpers";

test.setTimeout(120_000);

test("browser: app restores globe values, canvas, and panel workspace slices after reload", async ({
  page,
}) => {
  await page.goto("/");
  const session = await createToolcraftBrowserProofSession(page);
  const observation = session.observe(() => {
    const latitudeInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="globe.latitudeCount"] input[type="range"]',
    );
    const bandDistanceInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="bands.distance"] input[type="range"]',
    );
    const bandPositionInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="bands.band1.position"] input[type="range"]',
    );
    const bandWidthInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="bands.band1.width"] input[type="range"]',
    );
    const bandColumnSpacingInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="bands.columnSpacing"] input[type="range"]',
    );
    const widthInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="canvas.size.width"] input',
    );
    const crtIntensityInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="effects.crtIntensity"] input[type="range"]',
    );
    const outlineSwitch = document.querySelector<HTMLElement>(
      '[data-toolcraft-control-target="globe.outline"] [role="switch"]',
    );
    const logoDxcInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="logos.dxc.finalPosition"] input[type="range"]',
    );
    const logoHoldInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="logos.holdSeconds"] input[type="range"]',
    );
    const logoMetaInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="logos.meta.finalPosition"] input[type="range"]',
    );
    const logoSpeedInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="logos.speed"] input[type="range"]',
    );
    const logoPradaInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="logos.prada.finalPosition"] input[type="range"]',
    );
    const logoZillowInput = document.querySelector<HTMLInputElement>(
      '[data-toolcraft-control-target="logos.zillow.finalPosition"] input[type="range"]',
    );
    return {
      bandDistance: Number(bandDistanceInput?.value ?? 0),
      bandColumnSpacing: Number(bandColumnSpacingInput?.value ?? 0),
      bandPosition: Number(bandPositionInput?.value ?? 0),
      bandWidth: Number(bandWidthInput?.value ?? 0),
      reorderedBands: [4, 2, 3].map((id) => ["position", "width"].map((property) => Number(
        document.querySelector<HTMLInputElement>(`[data-toolcraft-control-target="bands.band${id}.${property}"] input[type="range"]`)?.value ?? 0,
      ))),
      crtIntensity: Number(crtIntensityInput?.value ?? 0),
      latitude: Math.round(Number(latitudeInput?.value ?? 0)),
      logoDxc: Number(logoDxcInput?.value ?? 0),
      logoHold: Number(logoHoldInput?.value ?? 0),
      logoMeta: Number(logoMetaInput?.value ?? 0),
      logoPrada: Number(logoPradaInput?.value ?? 0),
      logoSpeed: Number(logoSpeedInput?.value ?? 0),
      logoZillow: Number(logoZillowInput?.value ?? 0),
      logoScales: ["dxc", "meta", "prada", "zillow"].map((id) => Number(
        document.querySelector<HTMLInputElement>(`[data-toolcraft-control-target="logos.${id}.scale"] input[type="range"]`)?.value ?? 0,
      )),
      outline: outlineSwitch?.getAttribute("aria-checked") === "true",
      width: Number(widthInput?.value ?? 0),
    };
  });
  const expected = {
    bandDistance: 18,
    bandColumnSpacing: 9,
    bandPosition: 45,
    bandWidth: 48,
    reorderedBands: [[46, 24], [6, 50], [-30, 16]],
    crtIntensity: 85,
    latitude: 14,
    logoDxc: 28,
    logoHold: 1.5,
    logoMeta: 62,
    logoPrada: 36,
    logoSpeed: 1.8,
    logoZillow: 74,
    logoScales: [55, 75, 120, 130],
    outline: true,
    width: 1600,
  };

  await expectToolcraftPersistenceState(
    observation,
    session.controlAction(LATITUDES_TARGET, async (control, currentPage) => {
      await setRangeControl(control, expected.latitude);
      await fillControlText(
        currentPage.locator('[data-toolcraft-control-target="canvas.size.width"]'),
        String(expected.width),
      );
      await setSwitchControl(
        currentPage.locator(`[data-toolcraft-control-target="${OUTLINE_TARGET}"]`),
        expected.outline,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${BAND_DISTANCE_TARGET}"]`),
        expected.bandDistance,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${BAND_COLUMN_SPACING_TARGET}"]`),
        expected.bandColumnSpacing,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${BAND_1_POSITION_TARGET}"]`),
        expected.bandPosition,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${BAND_1_WIDTH_TARGET}"]`),
        expected.bandWidth,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${CRT_INTENSITY_TARGET}"]`),
        expected.crtIntensity,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${LOGO_DXC_FINAL_POSITION_TARGET}"]`),
        expected.logoDxc,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${LOGO_HOLD_SECONDS_TARGET}"]`),
        expected.logoHold,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${LOGO_SPEED_TARGET}"]`),
        expected.logoSpeed,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${LOGO_META_FINAL_POSITION_TARGET}"]`),
        expected.logoMeta,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${LOGO_PRADA_FINAL_POSITION_TARGET}"]`),
        expected.logoPrada,
      );
      await setRangeControl(
        currentPage.locator(`[data-toolcraft-control-target="${LOGO_ZILLOW_FINAL_POSITION_TARGET}"]`),
        expected.logoZillow,
      );
      for (const [index, id] of ["dxc", "meta", "prada", "zillow"].entries()) {
        await setRangeControl(
          currentPage.locator(`[data-toolcraft-control-target="logos.${id}.scale"]`),
          expected.logoScales[index],
        );
      }
      for (const [index, id] of [4, 2, 3].entries()) {
        for (const [propertyIndex, property] of ["position", "width"].entries()) {
          await setRangeControl(
            currentPage.locator(`[data-toolcraft-control-target="bands.band${id}.${property}"]`),
            expected.reorderedBands[index][propertyIndex],
          );
        }
      }
      const dragHandle = currentPage
        .locator('[data-panel-type="controls"] [data-panel-drag-handle=""]')
        .first();
      const dragBox = await dragHandle.boundingBox();
      expect(dragBox).not.toBeNull();
      if (!dragBox) throw new Error("Missing controls drag handle.");
      await currentPage.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + 8);
      await currentPage.mouse.down();
      await currentPage.mouse.move(dragBox.x + dragBox.width / 2 + 18, dragBox.y + 8, {
        steps: 4,
      });
      await currentPage.mouse.up();
    }),
    session.reload(),
    expected,
    {
      requirementId: "persistence.reload",
      stabilityIntervalMs: 0,
    },
  );
  await expectToolcraftDiscreteSliderMarkers(
    page,
    LATITUDES_TARGET,
    "persistence.reload",
  );
  await expectGlobeControlOrder(page);
});
