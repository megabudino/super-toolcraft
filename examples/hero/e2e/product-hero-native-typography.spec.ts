import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import {
  dragHeroStyle, heroField, heroHeading, heroStyleProof, heroStyleTitle, prepareHeroStyle, setHeroToggle,
} from "./hero-native-style-fixture";
import { expect, test } from "./toolcraft-product-test";

const recraft = "#hero-title > span:first-child";
const styles = "#hero-title > span:last-child";
const badge = "[data-hero-heading-badge-frame]";
const cases = [
  { target: "heading.recraftSize", selector: recraft, property: "font-size", independent: styles },
  { target: "heading.stylesSize", selector: styles, property: "font-size", independent: recraft },
  { target: "heading.lineGap", selector: styles, property: "margin-top" },
  { target: "heading.badgeGap", selector: "#hero-title", property: "margin-top" },
  { target: "heading.subtitle.fontSize", selector: "[data-hero-heading-subtitle]", property: "font-size" },
  { target: "heading.subtitle.gap", selector: "[data-hero-heading-subtitle]", property: "margin-top" },
] as const;

for (const scenario of cases) {
  test(heroStyleTitle(scenario.target), async ({ page }) => {
    const session = await prepareHeroStyle(page);
    if (scenario.target === "heading.badgeGap") await setHeroToggle(page, "heading.badgeVisible", true);
    const control = heroField(page, scenario.target);
    const slider = control.getByRole("slider");
    const before = Number(await slider.getAttribute("aria-valuenow"));
    const independent = "independent" in scenario ? page.locator(scenario.independent) : undefined;
    const independentSize = await independent?.evaluate(element => getComputedStyle(element).fontSize);
    try {
      await expectToolcraftProductObservableToChange(session, session.targetAction(scenario.target, async () => {
        await dragHeroStyle(page, scenario.target);
        await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).not.toBe(before);
        const value = Number(await slider.getAttribute("aria-valuenow"));
        await expect(page.locator(scenario.selector)).toHaveCSS(scenario.property, `${value}px`);
        if (scenario.target === "heading.subtitle.fontSize") {
          const typography = await page.locator(scenario.selector).evaluate(element => {
            const css = getComputedStyle(element);
            return { lineHeight: Number.parseFloat(css.lineHeight), tracking: Number.parseFloat(css.letterSpacing) };
          });
          expect(typography.lineHeight / value).toBeCloseTo(1.25, 3);
          expect(typography.tracking / value).toBeCloseTo(-0.02, 3);
        }
        if (independent && independentSize) await expect(independent).toHaveCSS("font-size", independentSize);
      }), heroStyleProof(scenario.target));
    } finally { await page.mouse.up(); }
  });
}

test(heroStyleTitle("heading.badgeScale"), async ({ page }) => {
  const session = await prepareHeroStyle(page);
  const target = "heading.badgeScale";
  await setHeroToggle(page, "heading.badgeVisible", true);
  const size = () => page.locator(badge).evaluate(element => ({
    width: Number.parseFloat(getComputedStyle(element).width),
    height: Number.parseFloat(getComputedStyle(element).height),
  }));
  const before = await size();
  const artwork = () => page.locator("[data-hero-heading-badge]").evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return { width: bounds.width, height: bounds.height, scaleX: matrix.m11, scaleY: matrix.m22 };
  });
  const originalArtwork = await artwork();
  const initial = Number(await heroField(page, target).getByRole("slider").getAttribute("aria-valuenow"));
  try {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await dragHeroStyle(page, target);
      const value = Number(await heroField(page, target).getByRole("slider").getAttribute("aria-valuenow"));
      expect(value).not.toBe(initial);
      const after = await size();
      expect(after.width / before.width).toBeCloseTo(value / initial, 2);
      expect(after.height / before.height).toBeCloseTo(value / initial, 2);
      const scaledArtwork = await artwork();
      expect(scaledArtwork.scaleX).toBeCloseTo(value / 100, 3);
      expect(scaledArtwork.scaleY).toBeCloseTo(value / 100, 3);
      expect(scaledArtwork.width / originalArtwork.width).toBeCloseTo(value / initial, 2);
      expect(scaledArtwork.height / originalArtwork.height).toBeCloseTo(value / initial, 2);
    }), heroStyleProof(target));
  } finally { await page.mouse.up(); }
});

test(heroStyleTitle("heading.color"), async ({ page }) => {
  const session = await prepareHeroStyle(page);
  const target = "heading.color";
  await setHeroToggle(page, "heading.badgeVisible", true);
  const artwork = page.locator("[data-hero-heading-badge]");
  const badgeColor = await artwork.evaluate(element => getComputedStyle(element).color);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    const input = heroField(page, target).getByRole("textbox");
    await input.fill("#FF7050");
    await input.press("Enter");
    for (const selector of [recraft, styles]) await expect(page.locator(selector)).toHaveCSS("color", "rgb(255, 112, 80)");
    await expect(artwork).toHaveCSS("color", badgeColor);
  }), heroStyleProof(target, heroHeading));
});

test(heroStyleTitle("heading.badgeVisible"), async ({ page }) => {
  const session = await prepareHeroStyle(page);
  const target = "heading.badgeVisible";
  await setHeroToggle(page, target, true);
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await setHeroToggle(page, target, false);
    await expect(page.locator(badge)).toHaveCount(0);
    await expect(page.locator(recraft)).toBeVisible();
    await expect(page.locator(styles)).toBeVisible();
    await expect(page.locator("#hero-title")).toHaveCSS("margin-top", "0px");
  }), heroStyleProof(target));
  await setHeroToggle(page, target, true);
  await expect(page.locator(badge)).toBeVisible();
});
