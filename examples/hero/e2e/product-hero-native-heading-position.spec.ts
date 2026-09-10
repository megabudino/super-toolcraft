import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { heroField, heroStyleProof, heroStyleTitle, prepareHeroStyle } from "./hero-native-style-fixture";
import { expect, test } from "./toolcraft-product-test";

test(heroStyleTitle("heading.position"), async ({ page }) => {
  const session = await prepareHeroStyle(page);
  const target = "heading.position";
  const read = (root: HTMLElement) => {
    const group = root.querySelector<HTMLElement>("[data-hero-heading-group]")!;
    const parent = group.offsetParent as HTMLElement;
    const surface = root.querySelector<HTMLElement>("[data-recraft-native-section]")!;
    const css = getComputedStyle(group);
    const matrix = new DOMMatrixReadOnly(css.transform);
    const groupBounds = group.getBoundingClientRect();
    const children = ["[data-hero-heading-badge-frame]", "#hero-title > span:first-child", "#hero-title > span:last-child"].map(selector => {
      const bounds = group.querySelector(selector)!.getBoundingClientRect();
      // Constant relative rendered geometry proves that all three pieces
      // follow the group instead of remaining fixed or moving independently.
      return [bounds.x - groupBounds.x, bounds.y - groupBounds.y, bounds.width, bounds.height]
        .map(value => Number(value.toFixed(1)));
    });
    return {
      // Remove the element's own -50% anchor from actual CSS translation.
      x: Math.round((matrix.m41 + group.offsetWidth / 2) / surface.clientWidth * 10000) / 100,
      y: Math.round(Number.parseFloat(css.top) / parent.clientHeight * 10000) / 100,
      children,
      layers: {
        heading: Number(getComputedStyle(parent.parentElement!).zIndex),
        gallery: Number(getComputedStyle(root.querySelector("[data-hero-scene]")!).zIndex),
      },
    };
  };
  const initial = await page.locator('[data-slot="toolcraft-runtime-app"]').evaluate(read);
  expect(initial.layers.heading).toBeGreaterThan(initial.layers.gallery);
  const observe = session.observe(read);
  // Authoring default is y=-0.16. Read its current output to retain that axis
  // during the X edit; then edit Y without disturbing X.
  const initialY = initial.y / 50 - 1;
  for (const [part, value, expected] of [
    ["vector.x", `-0.25, ${initialY}`, { x: -9, y: initial.y }],
    ["vector.y", "-0.25, -0.35", { x: -9, y: 32.5 }],
  ] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await expectToolcraftCompoundControlPartOutcome(observe, session.targetAction(target, async () => {
        const field = heroField(page, target);
        await field.getByRole("button", { name: "Edit Position value" }).click();
        await field.getByRole("textbox").fill(value);
        await field.getByRole("textbox").press("Enter");
      }), { ...initial, ...expected }, { requirementId: target, part });
    }), heroStyleProof(target));
  }
});
