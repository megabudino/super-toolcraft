import type { Page } from "@playwright/test";
import { appAcceptance } from "../src/app/app-acceptance-data";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const loading = "[data-fine-details-loading]";
const cards = "[data-fine-details-loading-card]";
const field = (page: Page, target: string) => page.locator(`[data-toolcraft-control-target="${target}"]`);
function title(target: string) {
  const row = appAcceptance.find(item => item.id === target);
  if (!row) throw new Error(`Missing loading acceptance ${target}`);
  return row.browserTestName;
}
const proof = (target: string) => ({
  requirementId: target, selector: loading, stabilityIntervalMs: 50, stabilitySamples: 2,
});

async function prepare(page: Page) {
  // Static surface controls remain visible under the user's reduced-motion
  // preference. Wave-only controls are deliberately not tested in this fixture.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  await field(page, "images.mode").getByRole("button", { name: "Loading", exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(2);
  await expect(page.locator(cards).first()).toBeVisible();
  await expect(field(page, "loading.enabled").getByRole("switch")).toBeChecked();
  return session;
}

async function startDrag(page: Page, target: string, fraction: number) {
  const control = field(page, target);
  const track = control.locator('[data-slot="slider"]').first();
  await track.scrollIntoViewIfNeeded();
  const box = await track.boundingBox();
  if (!box) throw new Error(`Expected visible loading slider ${target}`);
  await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * fraction + 1, box.y + box.height / 2);
}

test(title("loading.enabled"), async ({ page }) => {
  const session = await prepare(page);
  const target = "loading.enabled";
  const original = await page.locator(cards).first().evaluate(element => getComputedStyle(element).backgroundImage);
  expect(original).toContain("repeating-conic-gradient");
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await field(page, target).getByRole("switch").click();
    for (const card of await page.locator(cards).all()) {
      await expect(card).toHaveCSS("background-image", "none");
      await expect(card).toHaveCSS("background-color", "rgb(209, 209, 209)");
    }
    for (const child of ["cell", "contrast", "baseTone", "glare", "distort", "waveWidth", "softness", "angle", "passTime", "pause", "stagger", "desync"]) {
      await expect(field(page, `loading.${child}`)).toHaveCount(0);
    }
    await expect(field(page, "loading.border.width")).toBeVisible();
    await expect(field(page, "loading.border.colorOpacity")).toBeVisible();
  }), proof(target));
  await field(page, target).getByRole("switch").click();
  for (const card of await page.locator(cards).all()) await expect(card).toHaveCSS("background-image", original);
});

for (const [target, fraction] of [["loading.cell", 0.8], ["loading.border.width", 0.75]] as const) {
  test(title(target), async ({ page }) => {
    const session = await prepare(page);
    for (const wave of target === "loading.border.width" ? [true, false] : [true]) {
      if (!wave) await field(page, "loading.enabled").getByRole("switch").click();
      const slider = field(page, target).getByRole("slider");
      const baseline = Number(await slider.getAttribute("aria-valuenow"));
      // Integral CSS border widths avoid the browser's subpixel border snapping.
      const position = wave ? fraction : 0.25;
      try {
        await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
          await startDrag(page, target, position);
          await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).not.toBe(baseline);
          const value = Number(await slider.getAttribute("aria-valuenow"));
          for (const card of await page.locator(cards).all()) {
            if (target === "loading.cell") await expect(card).toHaveCSS("background-size", `${2 * value}px ${2 * value}px`);
            else await expect(card).toHaveCSS("border-left-width", `${value}px`);
          }
        }), proof(target));
      } finally {
        await page.mouse.up();
      }
    }
  });
}

for (const [target, fraction, direction] of [["loading.contrast", 0.8, -1], ["loading.baseTone", 0.15, -1]] as const) {
  test(title(target), async ({ page }) => {
    const session = await prepare(page);
    const read = () => page.locator(cards).evaluateAll((elements, property) => elements.map(element => {
      const css = getComputedStyle(element);
      const color = property === "loading.baseTone" ? css.backgroundColor
        : css.backgroundImage.match(/color\([^)]*\)|rgba?\([^)]*\)/gu)!.at(-1)!;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[0]!;
    }), target);
    const before = await read();
    const slider = field(page, target).getByRole("slider");
    const baseline = Number(await slider.getAttribute("aria-valuenow"));
    try {
      await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
        await startDrag(page, target, fraction);
        await expect.poll(async () => Number(await slider.getAttribute("aria-valuenow"))).not.toBe(baseline);
        await expect.poll(async () => (await read()).every((red, index) => (red - before[index]!) * direction > 0)).toBe(true);
      }), proof(target));
    } finally {
      await page.mouse.up();
    }
  });
}

test(title("loading.border.colorOpacity"), async ({ page }) => {
  const session = await prepare(page);
  const target = "loading.border.colorOpacity";
  const color = session.observe(root => Array.from(root.querySelectorAll("[data-fine-details-loading-card]"), element => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.fillStyle = getComputedStyle(element).borderLeftColor;
    context.fillRect(0, 0, 1, 1);
    return Array.from(context.getImageData(0, 0, 1, 1).data);
  }));
  const opacity = field(page, target).getByRole("textbox", { name: "Border color opacity", exact: true });
  const alpha = Math.round(Number(await opacity.inputValue()) * 255 / 100);
  for (const [part, label, value, expected] of [
    ["colorOpacity.hex", "Border color hex", "#FF0000", [255, 0, 0, alpha]],
    ["colorOpacity.opacity", "Border color opacity", "80", [255, 0, 0, 204]],
  ] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await expectToolcraftCompoundControlPartOutcome(color, session.targetAction(target, async () => {
        const input = field(page, target).getByRole("textbox", { name: label, exact: true });
        await input.fill(value);
        await input.press("Enter");
      }), [[...expected], [...expected]], { requirementId: target, part });
    }), proof(target));
  }
});
