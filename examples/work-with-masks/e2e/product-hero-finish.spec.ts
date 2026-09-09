import { runToolcraftBrowserValueAction } from "./browser-proof-session";
import {
  commitHex,
  commitVector,
  createHeroSession,
  exerciseGradient,
  expectCompoundRender,
  expectGateSwitchChange,
  expectGatedSliderChange,
  expectProductChange,
  selectOption,
} from "./product-hero-support";
import { expect, test } from "./toolcraft-product-test";

const sliderCases = [
  ["post.exposure", "hero.post.exposure", "Home"],
  ["post.bloom", "hero.post.bloom", "End"],
  ["post.bloomThreshold", "hero.post.bloom-threshold", "Home"],
  ["post.occlusion", "hero.post.occlusion", "Home"],
  ["post.occlusionRadius", "hero.post.occlusion-radius", "End"],
  ["haze.strength", "hero.haze.strength", "Home"],
  ["haze.glowRadius", "hero.haze.glow-radius", "End"],
  ["haze.glowStrength", "hero.haze.glow-strength", "Home"],
] as const;

for (const [target, requirementId, key] of sliderCases) {
  test(`browser: ${requirementId} changes 3d scene pixels`, async ({ page }) => {
    const session = await createHeroSession(page, {
      includeBackground: true,
      values: requirementId === "hero.post.bloom" ? { "post.bloomThreshold": 0.4 } : {},
    });
    await expectProductChange(session, target, requirementId, (control) =>
      control.getByRole("slider").press(key),
    );
  });
}

for (const [target, requirementId, key] of [
  ["post.focus", "hero.post.focus", "Home"],
  ["post.aperture", "hero.post.aperture", "End"],
] as const) {
  test(`browser: ${requirementId} changes 3d scene pixels`, async ({ page }) => {
    const session = await createHeroSession(page, { includeBackground: true });
    await expectGatedSliderChange(session, target, requirementId, "post.depthOfField", key);
  });
}

test("browser: hero.post.depth-of-field switches focus fields", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true });
  await expectGateSwitchChange(
    session,
    "post.depthOfField",
    "hero.post.depth-of-field",
    "post.focus",
  );
});

test("browser: hero.haze.glow-color changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true });
  await expectProductChange(session, "haze.glowColor", "hero.haze.glow-color", (control) =>
    commitHex(control, "#FF8A3D"),
  );
});

test("browser: hero.haze.blend changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true });
  for (const label of ["Screen", "Multiply", "Normal"]) {
    await expectProductChange(session, "haze.blend", "hero.haze.blend", (control) =>
      selectOption(control, page, label),
    );
  }
});

test("browser: hero.haze.glow-position changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true });
  await expectCompoundRender(
    session,
    page,
    "haze.glowPosition",
    "hero.haze.glow-position",
    "vector.x",
    (control) => commitVector(control, "Glow position", "0.35, -0.9"),
  );
  await expectCompoundRender(
    session,
    page,
    "haze.glowPosition",
    "hero.haze.glow-position",
    "vector.y",
    (control) => commitVector(control, "Glow position", "0.35, 0.4"),
  );
  await expectProductChange(
    session,
    "haze.glowPosition",
    "hero.haze.glow-position",
    (control) => commitVector(control, "Glow position", "-0.6, 0.7"),
  );
});

test("browser: hero.haze.gradient changes 3d scene pixels", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true });
  await exerciseGradient(session, page, "haze.gradient", "hero.haze.gradient");
});

test("browser: hero.presets.apply loads reference looks", async ({ page }) => {
  const session = await createHeroSession(page, { includeBackground: true });
  for (const label of ["Bend", "Wave", "Amber", "Oculus"]) {
    await expectProductChange(session, "presets.apply", "hero.presets.apply", (control) =>
      control.getByRole("button", { name: label }).click(),
    );
  }
  const countSlider = session.controlAction("structure.count", (control) =>
    control.getByRole("slider").getAttribute("aria-valuenow"),
  );
  expect(await runToolcraftBrowserValueAction(countSlider)).toBe("310");
});
