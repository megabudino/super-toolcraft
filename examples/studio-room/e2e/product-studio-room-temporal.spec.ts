import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { prepareRoomMotion, roomField, roomOutput } from "./studio-room-motion-fixture";
import { observeNextRoomTileChange } from "./studio-room-tile-observation";
import { expect, test } from "./toolcraft-product-test";

const proof = (requirementId: string) => ({
  requirementId, selector: roomOutput, stabilitySamples: 2, stabilityIntervalMs: 50,
});

test("browser: motion.scrollNudge updates the real Studio Room preview", async ({ page }) => {
  const session = await prepareRoomMotion(page);
  const target = "motion.scrollNudge";
  await roomField(page, "trail.enabled").getByRole("switch").click();
  const wall = page.locator(`${roomOutput} [class*="_backWall_"]`);
  const offset = () => wall.evaluate(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return { x: matrix.m41, y: matrix.m42 };
  });
  await expect.poll(offset).toEqual({ x: 0, y: 0 });
  const slider = roomField(page, target).getByRole("slider");
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await slider.press("End");
    // Equal target/container heights produce Motion's completed progress (1),
    // so the finite room receives +40 viewBox units, independently of X.
    await expect.poll(async () => (await offset()).y).toBeCloseTo(23.04, 1);
    expect((await offset()).x).toBe(0);
  }), proof(target));
  await slider.press("Home");
  await expect.poll(offset).toEqual({ x: 0, y: 0 });
});

test("browser: tiles.interval updates the real Studio Room preview", async ({ page }) => {
  const session = await prepareRoomMotion(page);
  const target = "tiles.interval";
  await roomField(page, "trail.enabled").getByRole("switch").click();
  const slider = roomField(page, target).getByRole("slider");
  await expect(slider).toHaveAttribute("aria-valuenow", "5");
  const slow = await observeNextRoomTileChange(page);
  expect(slow.changedSource).not.toBe("");
  expect(slow.firstChangeMs).toBeGreaterThan(2500);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await slider.press("Home");
    await expect(slider).toHaveAttribute("aria-valuenow", "0.4");
    const change = await observeNextRoomTileChange(page);
    expect(change.changedSource).not.toBe("");
    // Functional timing: a 0.4s shuffle occurs well before the old 5s
    // interval's earliest randomized delay (3s). Not a renderer benchmark.
    expect(change.firstChangeMs).toBeLessThan(1500);
    // A settings update also rebuilds the initial layout. A second fresh
    // change proves the running cadence, even if the first was that reset.
    const nextChange = await observeNextRoomTileChange(page);
    expect(nextChange.changedSource).not.toBe("");
    expect(nextChange.firstChangeMs).toBeLessThan(1500);
  }), proof(target));
});

test("browser: tiles.develop updates the real Studio Room preview", async ({ page }) => {
  const session = await prepareRoomMotion(page);
  const target = "tiles.develop";
  await roomField(page, "trail.enabled").getByRole("switch").click();
  const slider = roomField(page, target).getByRole("slider");
  await slider.press("Home");
  const sharp = await observeNextRoomTileChange(page);
  expect(sharp.changedSource).not.toBe("");
  expect(sharp.maximumBlur).toBe(0);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await slider.press("End");
    const developed = await observeNextRoomTileChange(page);
    expect(developed.changedSource).not.toBe("");
    expect(developed.maximumBlur).toBeGreaterThan(3);
  }), proof(target));
  await expect.poll(() => page.locator(`${roomOutput} [class*="_tileImage_"]`).evaluateAll(images =>
    images.every(image => getComputedStyle(image).filter === "blur(0px)"))).toBe(true);
});

test("browser: tiles.shuffleStyle updates the real Studio Room preview", async ({ page }) => {
  const session = await prepareRoomMotion(page);
  const target = "tiles.shuffleStyle";
  await roomField(page, "trail.enabled").getByRole("switch").click();
  // Low density exposes clear slide paths. The original room still puts an
  // extra tile on the floor, so a cross-surface rebalance may correctly Swap.
  await roomField(page, "tiles.perSurface").getByRole("slider").press("Home");
  const control = roomField(page, target);
  await control.getByRole("button", { name: "Swap", exact: true }).click();
  const swap = await observeNextRoomTileChange(page);
  expect(swap.positionFrames).toBe(2);
  // Use a real 1.3s interval for this bounded sequence. Its earliest 780ms
  // shuffle leaves each 600ms slide enough time to finish before the next one.
  const interval = roomField(page, "tiles.interval").getByRole("slider");
  await interval.press("Home");
  for (let step = 0; step < 9; step += 1) await interval.press("ArrowRight");
  await expect(interval).toHaveAttribute("aria-valuenow", "1.3");
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    const slide = control.getByRole("button", { name: "Slide", exact: true });
    await slide.click();
    await expect(slide).toHaveAttribute("aria-pressed", "true");
    let slideFrames = 0;
    // Observe native shuffles until a clear in-surface path is selected. Never
    // replace Math.random or pretend a valid fallback is an animated slide.
    for (let attempt = 0; attempt < 8 && slideFrames <= 5; attempt += 1) {
      const change = await observeNextRoomTileChange(page);
      slideFrames = Math.max(slideFrames, change.positionFrames);
    }
    expect(slideFrames).toBeGreaterThan(5);
  }), proof(target));
});
