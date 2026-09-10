import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  observeTrailDecay, prepareRoomMotion, roomField, roomOutput, roomPointerPulse, trailOpacity,
} from "./studio-room-motion-fixture";
import { expect, test } from "./toolcraft-product-test";

const proof = (requirementId: string) => ({
  requirementId, selector: roomOutput, stabilitySamples: 2, stabilityIntervalMs: 50,
});

test("browser: trail.enabled updates the real Studio Room preview", async ({ page }) => {
  const session = await prepareRoomMotion(page);
  const target = "trail.enabled";
  await roomField(page, "trail.strength").getByRole("slider").press("End");
  await roomField(page, "trail.fade").getByRole("slider").press("End");
  const toggle = roomField(page, target).getByRole("switch");
  await toggle.click();
  await expect(page.locator("[data-studio-room-trail]")).toHaveCount(0);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await toggle.click();
    await expect(page.locator("[data-studio-room-trail]")).toHaveCount(4);
    await roomPointerPulse(page);
    await expect.poll(() => trailOpacity(page)).toBeGreaterThan(0.5);
  }), proof(target));
  await toggle.click();
  await expect(page.locator("[data-studio-room-trail]")).toHaveCount(0);
});

test("browser: trail.amount updates the real Studio Room preview", async ({ page }) => {
  const session = await prepareRoomMotion(page);
  const target = "trail.amount";
  await roomField(page, "trail.strength").getByRole("slider").press("End");
  await roomField(page, "trail.fade").getByRole("slider").press("End");
  const slider = roomField(page, target).getByRole("slider");
  await slider.press("Home");
  const lines = page.locator("[data-studio-room-trail] line");
  const before = await lines.count();
  expect(before).toBeGreaterThan(0);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await slider.press("End");
    await expect(lines).toHaveCount(before * 3);
    await roomPointerPulse(page);
    await expect.poll(() => trailOpacity(page)).toBeGreaterThan(0.5);
  }), proof(target));
  await slider.press("Home");
  await expect(lines).toHaveCount(before);
});

test("browser: trail.strength updates the real Studio Room preview", async ({ page }) => {
  const session = await prepareRoomMotion(page);
  const target = "trail.strength";
  await roomField(page, "trail.fade").getByRole("slider").press("End");
  const slider = roomField(page, target).getByRole("slider");
  await slider.press("Home");
  await roomPointerPulse(page);
  await expect.poll(() => trailOpacity(page)).toBe(0);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await slider.press("End");
    await roomPointerPulse(page);
    await expect.poll(() => trailOpacity(page)).toBeGreaterThan(0.5);
  }), proof(target));
  await slider.press("Home");
  await roomPointerPulse(page);
  await expect.poll(() => trailOpacity(page)).toBe(0);
});

test("browser: trail.fade updates the real Studio Room preview", async ({ page }) => {
  const session = await prepareRoomMotion(page);
  const target = "trail.fade";
  await roomField(page, "trail.strength").getByRole("slider").press("End");
  const slider = roomField(page, target).getByRole("slider");
  await slider.press("Home");
  await roomPointerPulse(page);
  const short = await observeTrailDecay(page);
  expect(short.peak).toBeGreaterThan(0.5);
  expect(short.last).toBeLessThan(0.15);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await slider.press("End");
    await roomPointerPulse(page);
    const long = await observeTrailDecay(page);
    expect(long.peak).toBeGreaterThan(0.5);
    expect(long.last).toBeGreaterThan(0.35);
    expect(long.last).toBeGreaterThan(short.last * 3);
  }), proof(target));
});
