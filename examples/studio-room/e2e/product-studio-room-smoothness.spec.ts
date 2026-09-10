import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { prepareRoomMotion, roomField, roomOutput } from "./studio-room-motion-fixture";
import { observeRoomSpring, roomSpringDecay } from "./studio-room-spring-observation";
import { expect, test } from "./toolcraft-product-test";

test("browser: motion.smoothness updates the real Studio Room preview", async ({ page }) => {
  const session = await prepareRoomMotion(page);
  const target = "motion.smoothness";
  await roomField(page, "trail.enabled").getByRole("switch").click();
  await roomField(page, "motion.parallax").getByRole("slider").press("End");
  const slider = roomField(page, target).getByRole("slider");
  await slider.press("Home");
  const wall = page.locator(`${roomOutput} [class*="_backWall_"]`);
  const offset = () => wall.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  const box = await page.locator(roomOutput).boundingBox();
  if (!box) throw new Error("The room must have visible pointer bounds");
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const left = { x: Math.max(50, box.x + box.width * 0.2), y: center.y };
  const endpoint = ((left.x - box.x) / box.width * 2 - 1) * 130 * 1.5 / 1000 * 1024;
  const recenter = async () => {
    await page.mouse.move(center.x, center.y);
    await expect.poll(offset).toBe(0);
  };
  await recenter();
  const low = await observeRoomSpring(page, left);
  expect(low.length).toBeGreaterThan(10);
  const lowDecay = roomSpringDecay(low, endpoint);
  // The authored spring's slow root is damping - sqrt(damping² - 2*stiffness)
  // for mass 0.5. Frame-phase-independent tail observations distinguish the
  // actual responses, without treating dropped frames as a product failure.
  expect(Math.abs(lowDecay - (15 - Math.sqrt(55)))).toBeLessThan(0.6);
  await recenter();
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await slider.press("End");
    const high = await observeRoomSpring(page, left);
    expect(high.length).toBeGreaterThan(10);
    const highDecay = roomSpringDecay(high, endpoint);
    expect(Math.abs(highDecay - (33 - Math.sqrt(719)))).toBeLessThan(0.6);
    expect(highDecay).toBeLessThan(lowDecay - 0.7);
    await expect.poll(offset).toBeCloseTo(endpoint, 0);
  }), { requirementId: target, selector: roomOutput, stabilitySamples: 2, stabilityIntervalMs: 50 });
});
