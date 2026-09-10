import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { readHeroShadowIsolation } from "./hero-shadow-isolation";
import {
  dragHeroStyle, heroField, heroShadowFilterId, heroStyleProof, heroStyleTitle, prepareHeroStyle, setHeroToggle,
} from "./hero-native-style-fixture";
import { expect, test } from "./toolcraft-product-test";

const subjects = [
  { prefix: "heading.badgeShadow", selector: "[data-hero-heading-badge-frame]", key: "badge" },
  { prefix: "heading.subtitle.shadow", selector: "[data-hero-heading-subtitle]", key: "subtitle" },
] as const;

// This complete observation is also serialized by the protected session. It
// reads live, applied SVG filters, including the sibling shadow for isolation.
function readShadows(root: HTMLElement) {
  const read = (selector: string) => {
    const element = root.querySelector(selector)!;
    const id = getComputedStyle(element).filter.match(/#([^"\)]+)/u)?.[1];
    const filter = id ? root.querySelector(`[id="${id}"]`) : null;
    if (!filter) throw new Error(`Expected applied shadow for ${selector}`);
    const offset = filter.querySelector("feOffset")!;
    const flood = filter.querySelector("feFlood")!;
    return {
      offset: [Number(offset.getAttribute("dx")), Number(offset.getAttribute("dy"))],
      color: [flood.getAttribute("flood-color")!.toUpperCase(), Number(flood.getAttribute("flood-opacity"))],
    };
  };
  return { badge: read("[data-hero-heading-badge-frame]"), subtitle: read("[data-hero-heading-subtitle]") };
}

for (const subject of subjects) {
  for (const part of ["blur", "spread"] as const) {
    const target = `${subject.prefix}.${part}`;
    test(heroStyleTitle(target), async ({ page }) => {
      const session = await prepareHeroStyle(page);
      await setHeroToggle(page, "heading.badgeVisible", true);
      await setHeroToggle(page, `${subject.prefix}.enabled`, true);
      const id = await heroShadowFilterId(page, subject.selector);
      const filter = page.locator(`[id="${id}"]`);
      const blur = filter.locator("feGaussianBlur");
      const spread = filter.locator("feMorphology");
      const before = {
        blur: await blur.getAttribute("stdDeviation"),
        spread: await spread.getAttribute("radius"),
      };
      const slider = heroField(page, target).getByRole("slider");
      try {
        await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
          await dragHeroStyle(page, target);
          const value = Number(await slider.getAttribute("aria-valuenow"));
          if (part === "blur") {
            expect(value / 2).not.toBe(Number(before.blur));
            await expect(blur).toHaveAttribute("stdDeviation", String(value / 2));
            await expect(spread).toHaveAttribute("radius", before.spread!);
          } else {
            expect(Math.abs(value)).not.toBe(Number(before.spread));
            await expect(spread).toHaveAttribute("radius", String(Math.abs(value)));
            await expect(spread).toHaveAttribute("operator", value < 0 ? "erode" : "dilate");
            await expect(blur).toHaveAttribute("stdDeviation", before.blur!);
          }
        }), heroStyleProof(target));
      } finally { await page.mouse.up(); }
    });
  }

  test(heroStyleTitle(`${subject.prefix}.enabled`), async ({ page }) => {
    const session = await prepareHeroStyle(page);
    const target = `${subject.prefix}.enabled`;
    await setHeroToggle(page, "heading.badgeVisible", true);
    await setHeroToggle(page, target, true);
    const root = page.locator('[data-slot="toolcraft-runtime-app"]');
    const beforeIsolation = await root.evaluate(readHeroShadowIsolation);
    const { [`${subject.key}Shadow`]: ownBefore, ...untouchedBefore } = beforeIsolation;
    const element = page.locator(subject.selector);
    const original = await element.evaluate(node => getComputedStyle(node).filter);
    expect(original).toContain("url(");
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await setHeroToggle(page, target, false);
      await expect(element).toHaveCSS("filter", "none");
      await expect(element).toBeVisible();
      const { [`${subject.key}Shadow`]: ownAfter, ...untouchedAfter } = await root.evaluate(readHeroShadowIsolation);
      expect(ownAfter.filter).toBe("none");
      expect(ownBefore.filter).not.toBe("none");
      expect(untouchedAfter).toEqual(untouchedBefore);
      for (const part of ["blur", "spread", "offset", "colorOpacity"]) await expect(heroField(page, `${subject.prefix}.${part}`)).toHaveCount(0);
    }), heroStyleProof(target));
    await setHeroToggle(page, target, true);
    await expect(element).toHaveCSS("filter", original);
  });

  test(heroStyleTitle(`${subject.prefix}.offset`), async ({ page }) => {
    const session = await prepareHeroStyle(page);
    const target = `${subject.prefix}.offset`;
    await setHeroToggle(page, "heading.badgeVisible", true);
    for (const item of subjects) await setHeroToggle(page, `${item.prefix}.enabled`, true);
    // The native vector editor rounds text to two decimals. Use an exactly
    // representable starting Y so an X-only edit cannot round default 0.125.
    const control = heroField(page, target);
    await control.getByRole("button", { name: "Edit Shadow offset value" }).click();
    await control.getByRole("textbox").fill("0, 0.25");
    await control.getByRole("textbox").press("Enter");
    await page.mouse.move(40, 40);
    const initial = await page.locator('[data-slot="toolcraft-runtime-app"]').evaluate(readShadows);
    const observe = session.observe(readShadows);
    const x = 0.4;
    const y = -0.35;
    for (const [part, value, expectedOffset] of [
      ["vector.x", `${x}, ${initial[subject.key].offset[1] / 48}`, [x * 48, initial[subject.key].offset[1]]],
      ["vector.y", `${x}, ${y}`, [x * 48, y * 48]],
    ] as const) {
      const expected = { ...initial, [subject.key]: { ...initial[subject.key], offset: [...expectedOffset] } };
      await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
        await expectToolcraftCompoundControlPartOutcome(observe, session.targetAction(target, async () => {
          const control = heroField(page, target);
          await control.getByRole("button", { name: "Edit Shadow offset value" }).click();
          await control.getByRole("textbox").fill(value);
          await control.getByRole("textbox").press("Enter");
        }), expected, { requirementId: target, part });
      }), heroStyleProof(target));
    }
  });

  test(heroStyleTitle(`${subject.prefix}.colorOpacity`), async ({ page }) => {
    const session = await prepareHeroStyle(page);
    const target = `${subject.prefix}.colorOpacity`;
    await setHeroToggle(page, "heading.badgeVisible", true);
    for (const item of subjects) await setHeroToggle(page, `${item.prefix}.enabled`, true);
    const initial = await page.locator('[data-slot="toolcraft-runtime-app"]').evaluate(readShadows);
    const observe = session.observe(readShadows);
    for (const [part, label, value, color] of [
      ["colorOpacity.hex", "Shadow color hex", "#FF3050", ["#FF3050", initial[subject.key].color[1]]],
      ["colorOpacity.opacity", "Shadow color opacity", "80", ["#FF3050", 0.8]],
    ] as const) {
      const expected = { ...initial, [subject.key]: { ...initial[subject.key], color: [...color] } };
      const root = page.locator('[data-slot="toolcraft-runtime-app"]');
      const { [`${subject.key}Shadow`]: ownBefore, ...untouchedBefore } = await root.evaluate(readHeroShadowIsolation);
      await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
        await expectToolcraftCompoundControlPartOutcome(observe, session.targetAction(target, async () => {
          const input = heroField(page, target).getByRole("textbox", { name: label, exact: true });
          await input.fill(value);
          await input.press("Enter");
        }), expected, { requirementId: target, part });
        const { [`${subject.key}Shadow`]: ownAfter, ...untouchedAfter } = await root.evaluate(readHeroShadowIsolation);
        expect(ownAfter.definition).not.toBe(ownBefore.definition);
        expect(untouchedAfter).toEqual(untouchedBefore);
      }), heroStyleProof(target));
    }
  });
}
