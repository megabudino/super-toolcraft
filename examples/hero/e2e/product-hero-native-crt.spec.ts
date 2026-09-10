import { test as browserTest } from "@playwright/test";
import { heroField, heroStyleTitle, setHeroToggle } from "./hero-native-style-fixture";
import { captureHeroCrt, captureHeroCrtSequence, dragHeroCrtMaximum, enableHeroCrtControl, expectHeroCrtChange, prepareHeroCrt, pulseHeroCrtPan } from "./hero-native-crt-fixture";
import { crtBrightnessSpan, crtChannelShifts, crtMeanDifference, crtScanlinePower } from "./hero-native-crt-pixels";
import { expect, test } from "./toolcraft-product-test";

test(heroStyleTitle("effects.crt.enabled"), async ({ page }) => {
  const target = "effects.crt.enabled";
  const session = await prepareHeroCrt(page, { "effects.crt.scanlines": 100 });
  const disabled = await captureHeroCrt(page);
  await pulseHeroCrtPan(page);
  expect(crtMeanDifference(disabled, await captureHeroCrt(page)), "Pan alone with CRT disabled must preserve the same-pose pixels").toBeLessThan(0.1);
  for (const name of ["scanlines", "pitch", "chroma", "flicker", "fade"]) await expect(heroField(page, `effects.crt.${name}`)).toHaveCount(0);
  await expectHeroCrtChange(page, session, target, async () => {
    await setHeroToggle(page, target, true);
    for (const name of ["scanlines", "pitch", "chroma", "flicker", "fade"]) await expect(heroField(page, `effects.crt.${name}`)).toHaveCount(1);
    await pulseHeroCrtPan(page);
    const active = await captureHeroCrt(page);
    expect(crtScanlinePower(disabled, active, 8), "Enabled CRT must add real horizontal scanlines, not only pan motion").toBeGreaterThan(0.005);
  });
  await setHeroToggle(page, target, false);
  expect(crtMeanDifference(disabled, await captureHeroCrt(page))).toBeLessThan(0.1);
});

test(heroStyleTitle("effects.crt.scanlines"), async ({ page }) => {
  const target = "effects.crt.scanlines";
  const session = await prepareHeroCrt(page, { [target]: 1 });
  const disabled = await captureHeroCrt(page);
  await enableHeroCrtControl(page, target);
  await expectHeroCrtChange(page, session, target, async () => {
    await pulseHeroCrtPan(page);
    const low = crtScanlinePower(disabled, await captureHeroCrt(page), 8);
    await dragHeroCrtMaximum(page, target, 100);
    const high = crtScanlinePower(disabled, await captureHeroCrt(page), 8);
    expect(high, `Live scanline strength: low=${low}, high=${high}`).toBeGreaterThan(low * 2 + 0.005);
  });
  await setHeroToggle(page, "effects.crt.enabled", false);
  expect(crtMeanDifference(disabled, await captureHeroCrt(page))).toBeLessThan(0.1);
});

test(heroStyleTitle("effects.crt.pitch"), async ({ page }) => {
  const target = "effects.crt.pitch";
  const session = await prepareHeroCrt(page, { [target]: 4, "effects.crt.scanlines": 100 });
  const disabled = await captureHeroCrt(page);
  await enableHeroCrtControl(page, target);
  await expectHeroCrtChange(page, session, target, async () => {
    await pulseHeroCrtPan(page);
    const low = await captureHeroCrt(page);
    const small = [crtScanlinePower(disabled, low, 4), crtScanlinePower(disabled, low, 16)];
    await dragHeroCrtMaximum(page, target, 16);
    const high = await captureHeroCrt(page);
    const large = [crtScanlinePower(disabled, high, 4), crtScanlinePower(disabled, high, 16)];
    expect(small[0], `4px versus 16px power before drag: ${small}`).toBeGreaterThan(small[1] * 1.4 + 0.002);
    expect(large[1], `4px versus 16px power during drag: ${large}`).toBeGreaterThan(large[0] * 1.4 + 0.002);
  });
  await setHeroToggle(page, "effects.crt.enabled", false);
  expect(crtMeanDifference(disabled, await captureHeroCrt(page))).toBeLessThan(0.1);
});

test(heroStyleTitle("effects.crt.chroma"), async ({ page }) => {
  const target = "effects.crt.chroma";
  const session = await prepareHeroCrt(page, { [target]: 0.25 });
  const disabled = await captureHeroCrt(page);
  await enableHeroCrtControl(page, target);
  await expectHeroCrtChange(page, session, target, async () => {
    await pulseHeroCrtPan(page);
    const low = crtChannelShifts(disabled, await captureHeroCrt(page));
    await dragHeroCrtMaximum(page, target, 8);
    const high = crtChannelShifts(disabled, await captureHeroCrt(page));
    expect(high.red, `Native red/green shift: ${JSON.stringify({ low, high })}`).toBeGreaterThan(0.4);
    expect(high.blue, `Native blue/green shift: ${JSON.stringify({ low, high })}`).toBeLessThan(-0.4);
    expect(high.red - high.blue).toBeGreaterThan(low.red - low.blue + 0.75);
  });
  await setHeroToggle(page, "effects.crt.enabled", false);
  expect(crtMeanDifference(disabled, await captureHeroCrt(page))).toBeLessThan(0.1);
});

test(heroStyleTitle("effects.crt.flicker"), async ({ page }) => {
  const target = "effects.crt.flicker";
  const session = await prepareHeroCrt(page, { [target]: 1 });
  const disabled = await captureHeroCrt(page);
  await enableHeroCrtControl(page, target);
  await expectHeroCrtChange(page, session, target, async () => {
    await pulseHeroCrtPan(page);
    const low = crtBrightnessSpan(disabled, await captureHeroCrtSequence(page));
    await dragHeroCrtMaximum(page, target, 100);
    const high = crtBrightnessSpan(disabled, await captureHeroCrtSequence(page));
    expect(high.span, `Natural brightness pulse while thumb held: ${JSON.stringify({ low, high })}`).toBeGreaterThan(low.span * 2 + 0.005);
  });
  await setHeroToggle(page, "effects.crt.enabled", false);
  expect(crtMeanDifference(disabled, await captureHeroCrt(page))).toBeLessThan(0.1);
});
// Use the installed full Chromium native GPU; keep render quality and budgets.
browserTest.use({ channel: "chromium" });
