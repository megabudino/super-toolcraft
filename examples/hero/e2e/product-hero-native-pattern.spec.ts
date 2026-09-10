import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { dragHeroStyle, heroField, heroStyleProof, heroStyleTitle, prepareHeroStyle, setHeroToggle } from "./hero-native-style-fixture";
import { expect, test } from "./toolcraft-product-test";

const pattern = "[data-hero-background-pattern]";
const output = "[data-hero-video-frame]";
async function prepare(page: Parameters<typeof prepareHeroStyle>[0]) {
  const session = await prepareHeroStyle(page);
  await setHeroToggle(page, "export.includeBackground", true);
  await setHeroToggle(page, "background.pattern.enabled", true);
  await expect(page.locator(pattern)).toBeVisible();
  return session;
}

test(heroStyleTitle("background.pattern.enabled"), async ({ page }) => {
  const session = await prepare(page);
  const target = "background.pattern.enabled";
  const background = await page.locator(output).evaluate(element => getComputedStyle(element).backgroundColor);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await setHeroToggle(page, target, false);
    await expect(page.locator(pattern)).toHaveCount(0);
    await expect(page.locator(output)).toHaveCSS("background-color", background);
    for (const child of ["colorOpacity", "squareSize"]) await expect(heroField(page, `background.pattern.${child}`)).toHaveCount(0);
  }), heroStyleProof(target, output));
  await setHeroToggle(page, target, true);
  await expect(page.locator(pattern)).toBeVisible();
});

test(heroStyleTitle("background.pattern.squareSize"), async ({ page }) => {
  const session = await prepare(page);
  const target = "background.pattern.squareSize";
  const slider = heroField(page, target).getByRole("slider");
  const original = await slider.getAttribute("aria-valuenow");
  try {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await dragHeroStyle(page, target);
      await expect(slider).not.toHaveAttribute("aria-valuenow", original!);
      const tile = Number(await slider.getAttribute("aria-valuenow")) * 2;
      await expect(page.locator(pattern)).toHaveCSS("background-size", `${tile}px ${tile}px`);
    }), heroStyleProof(target, output));
  } finally { await page.mouse.up(); }
});

test(heroStyleTitle("background.pattern.colorOpacity"), async ({ page }) => {
  const session = await prepare(page);
  const target = "background.pattern.colorOpacity";
  const read = (root: HTMLElement) => {
    const css = getComputedStyle(root.querySelector("[data-hero-background-pattern]")!);
    return {
      gradient: css.backgroundImage,
      opacity: Number(css.opacity),
      background: getComputedStyle(root.querySelector("[data-hero-video-frame]")!).backgroundColor,
    };
  };
  const initial = await page.locator('[data-slot="toolcraft-runtime-app"]').evaluate(read);
  const gradient = initial.gradient.replace(/rgb\([^)]*\)/gu, "rgb(255, 48, 80)");
  expect(gradient).not.toBe(initial.gradient);
  const observe = session.observe(read);
  for (const [part, suffix, value, opacity] of [
    ["colorOpacity.hex", "hex", "#FF3050", initial.opacity],
    ["colorOpacity.opacity", "opacity", "75", 0.75],
  ] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await expectToolcraftCompoundControlPartOutcome(observe, session.targetAction(target, async () => {
        const input = heroField(page, target).getByRole("textbox", { name: `Color & opacity ${suffix}`, exact: true });
        await input.fill(value);
        await input.press("Enter");
      }), { ...initial, gradient, opacity }, { requirementId: target, part });
    }), heroStyleProof(target, output));
  }
});
