import {
  appControlSectionInventory,
  getToolcraftControlApplicabilityCases,
  getToolcraftApplicabilityRequirementId,
} from "../src/app/app-acceptance";
import { appSchema } from "../src/app/app-schema";
import { expectToolcraftControlApplicabilityState } from "./browser-control-applicability-evidence";
import { expectToolcraftSegmentedControlCellsPreservePadding } from "./performance-control-layout-helpers";
import {
  commitHex,
  commitRange,
  commitVector,
  createHeroSession,
  exerciseGradient,
  expectCompoundRender,
  expectGateSwitchChange,
  expectGatedSliderChange,
  expectProductChange,
  setSwitch,
} from "./product-hero-support";
import { expect, test } from "./toolcraft-product-test";

const sliderCases = [
  ["structure.radius", "hero.structure.radius", "Home"],
  ["structure.spacing", "hero.structure.spacing", "End"],
  ["structure.count", "hero.structure.count", "End"],
  ["structure.twist", "hero.structure.twist", "End"],
  ["structure.wave", "hero.structure.wave", "End"],
  ["structure.waveLength", "hero.structure.wave-length", "Home"],
  ["rib.width", "hero.rib.width", "End"],
  ["rib.depth", "hero.rib.depth", "End"],
  ["rib.corner", "hero.rib.corner", "Home"],
  ["rib.taperStart", "hero.rib.taper-start", "Home"],
  ["rib.taperTip", "hero.rib.taper-tip", "Home"],
  ["camera.height", "hero.camera.height", "End"],
  ["camera.yaw", "hero.camera.yaw", "End"],
  ["camera.pitch", "hero.camera.pitch", "Home"],
  ["camera.roll", "hero.camera.roll", "End"],
  ["camera.fov", "hero.camera.fov", "Home"],
  ["light.azimuth", "hero.light.azimuth", "End"],
  ["light.elevation", "hero.light.elevation", "End"],
  ["light.intensity", "hero.light.intensity", "Home"],
  ["light.ambient", "hero.light.ambient", "Home"],
  ["sky.envIntensity", "hero.sky.environment", "Home"],
  ["sky.fogNear", "hero.sky.fog-near", "End"],
  ["sky.fogFar", "hero.sky.fog-far", "Home"],
  ["material.roughness", "hero.material.roughness", "End"],
  ["material.clearcoat", "hero.material.clearcoat", "End"],
  ["material.clearcoatRoughness", "hero.material.clearcoat-roughness", "End"],
] as const;

const taperFixtureValues: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  "hero.rib.taper-start": { "rib.taperTip": 0.12 },
  "hero.rib.taper-tip": { "rib.taperStart": 0.5 },
};

test("browser: hero.background.include changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true });
  await expectProductChange(
    session,
    "export.includeBackground",
    "hero.background.include",
    (control) => setSwitch(control, false),
  );
});

test("browser: hero.background.color changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true });
  await expectProductChange(
    session,
    "appearance.background",
    "hero.background.color",
    (control) => commitHex(control, "#D7C1A2"),
  );
});

for (const [target, requirementId, key] of sliderCases) {
  test(`browser: ${requirementId} changes 3d scene pixels`, async ({ page }) => {
    const session = await createHeroSession(page, {
      values: taperFixtureValues[requirementId] ?? {},
      sunIntensity:
        requirementId === "hero.light.azimuth" ||
        requirementId === "hero.light.elevation" ||
        requirementId === "hero.light.intensity"
          ? 2
          : 0,
      wave: requirementId === "hero.structure.wave-length" ? 4 : 0,
    });
    await expectProductChange(session, target, requirementId, (control) =>
      control.getByRole("slider").press(key),
    );
  });
}

test("browser: hero.light.shadow-softness changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true, sunIntensity: 2 });
  await expectGatedSliderChange(
    session,
    "light.shadowSoftness",
    "hero.light.shadow-softness",
    "light.shadows",
    "Home",
  );
});

test("browser: hero.light.shadows switches cast shadows", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true, sunIntensity: 2 });
  await expectGateSwitchChange(session, "light.shadows", "hero.light.shadows", "light.shadowSoftness");
});

for (const [target, requirementId, value] of [
  ["light.color", "hero.light.color", "#FFB36A"],
  ["light.skyColor", "hero.light.sky-color", "#789BE8"],
  ["light.groundColor", "hero.light.ground-color", "#D2A56A"],
  ["sky.fogColor", "hero.sky.fog-color", "#AFC9E8"],
  ["material.color", "hero.material.color", "#D8B58A"],
] as const) {
  test(`browser: ${requirementId} changes 3d scene pixels`, async ({ page }) => {
    const session = await createHeroSession(page, {
      sunIntensity: requirementId === "hero.light.color" ? 2 : 0,
    });
    await expectProductChange(session, target, requirementId, (control) =>
      commitHex(control, value),
    );
  });
}

test("browser: hero.structure.shape switches structure fields", async ({ page }) => {
  const session = await createHeroSession(page);
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Shape", {
    requirementId: "hero.structure.shape",
    target: "structure.shape",
  });
  await expectProductChange(
    session,
    "structure.shape",
    "hero.structure.shape",
    (control) => control.getByRole("button", { name: "Dome" }).click(),
  );
});

test("browser: hero.structure.dome-length changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page);
  const cases = getToolcraftControlApplicabilityCases({
    schema: appSchema,
    sectionInventory: appControlSectionInventory,
    target: "structure.domeLength",
  });
  expect(cases).toHaveLength(2);
  for (const applicabilityCase of cases) {
    await expectToolcraftControlApplicabilityState(
      session,
      session.controlAction("structure.shape", (control) =>
        control
          .getByRole("button", {
            name: applicabilityCase.selectorOptionLabel ?? "",
          })
          .click(),
      ),
      applicabilityCase,
      { baseRequirementId: "hero.structure.dome-length" },
    );
    if (applicabilityCase.expectation === "hidden") continue;
    await expectProductChange(
      session,
      "structure.domeLength",
      getToolcraftApplicabilityRequirementId(
        "hero.structure.dome-length",
        applicabilityCase,
      ),
      (control) => control.getByRole("slider").press("End"),
    );
  }
});

test("browser: hero.structure.arc changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page);
  await expectCompoundRender(
    session,
    page,
    "structure.arc",
    "hero.structure.arc",
    "rangeSlider.lower",
    (control) => commitRange(control, "-95 – 35"),
  );
  await expectCompoundRender(
    session,
    page,
    "structure.arc",
    "hero.structure.arc",
    "rangeSlider.upper",
    (control) => commitRange(control, "-95 – 85"),
  );
  await expectProductChange(
    session,
    "structure.arc",
    "hero.structure.arc",
    (control) => commitRange(control, "-70 – 85"),
  );
});

test("browser: hero.rib.taper-side changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, {
    values: { "rib.taperStart": 0.5, "rib.taperTip": 0.12 },
  });
  await expectToolcraftSegmentedControlCellsPreservePadding(page, "Taper side", {
    requirementId: "hero.rib.taper-side",
    target: "rib.taperSide",
  });
  await expectProductChange(
    session,
    "rib.taperSide",
    "hero.rib.taper-side",
    (control) => control.getByRole("button", { name: "Start" }).click(),
  );
});

test("browser: hero.camera.position changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page);
  await expectCompoundRender(
    session,
    page,
    "camera.position",
    "hero.camera.position",
    "vector.x",
    (control) => commitVector(control, "Position", "0.35, 0.23"),
  );
  await expectCompoundRender(
    session,
    page,
    "camera.position",
    "hero.camera.position",
    "vector.y",
    (control) => commitVector(control, "Position", "0.35, -0.2"),
  );
  await expectProductChange(
    session,
    "camera.position",
    "hero.camera.position",
    (control) => commitVector(control, "Position", "-0.25, -0.2"),
  );
});

test("browser: hero.sky.gradient changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true });
  await exerciseGradient(session, page, "sky.gradient", "hero.sky.gradient");
});

test("browser: hero.sky.light-gradient changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page);
  await exerciseGradient(
    session,
    page,
    "sky.lightGradient",
    "hero.sky.light-gradient",
  );
});
