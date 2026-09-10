import type { Page } from "@playwright/test";
import { appAcceptance } from "../src/app/app-acceptance-data";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const carousel = "[data-fine-details-carousel]";
const card = '[data-fd-carousel-sequence="primary"] [data-fd-carousel-card-shell]';
const field = (page: Page, target: string) => page.locator(`[data-toolcraft-control-target="${target}"]`);
const proof = (target: string) => ({ requirementId: target, selector: carousel, stabilityIntervalMs: 50, stabilitySamples: 2 });
function title(target: string) {
  const row = appAcceptance.find(item => item.id === target);
  if (!row) throw new Error(`Missing carousel acceptance ${target}`);
  return row.browserTestName;
}

async function prepare(page: Page, motion = false) {
  await page.emulateMedia({ reducedMotion: motion ? "no-preference" : "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  const flight = field(page, "prompt.flight.enabled").getByRole("switch");
  if (await flight.isChecked()) await flight.click();
  await field(page, "images.mode").getByRole("button", { name: "Carousel", exact: true }).click();
  await expect(page.locator(card)).toHaveCount(4);
  await expect.poll(() => page.locator(`${card} img`).evaluateAll(images => {
    const bounds = document.querySelector("[data-fine-details-carousel]")!.getBoundingClientRect();
    const visible = images.filter(image => {
      const rect = image.getBoundingClientRect();
      return rect.right > Math.max(0, bounds.left) && rect.left < Math.min(innerWidth, bounds.right)
        && rect.bottom > Math.max(0, bounds.top) && rect.top < Math.min(innerHeight, bounds.bottom);
    });
    return visible.length > 0 && visible.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0);
  })).toBe(true);
  return session;
}

for (const [target, label, property] of [
  ["carousel.border.colorOpacity", "Border color", "borderLeftColor"],
  ["carousel.shadow.colorOpacity", "Shadow color", "boxShadow"],
] as const) {
  test(title(target), async ({ page }) => {
    const session = await prepare(page);
    await field(page, target.replace("colorOpacity", "enabled")).getByRole("switch").click();
    const color = session.observe(root => Array.from(root.querySelectorAll('[data-fd-carousel-sequence="primary"] [data-fd-carousel-card-shell]'), element => {
      const css = getComputedStyle(element);
      const raw = css.borderLeftWidth !== "0px" ? css.borderLeftColor : css.boxShadow.match(/rgba?\([^)]*\)/u)![0];
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      context.fillStyle = raw;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    }));
    const alpha = Math.round(Number(await field(page, target).getByRole("textbox", { name: `${label} opacity`, exact: true }).inputValue()) * 255 / 100);
    for (const [part, suffix, value, expected] of [
      ["colorOpacity.hex", "hex", "#FF0000", [255, 0, 0, alpha]],
      ["colorOpacity.opacity", "opacity", "60", [255, 0, 0, 153]],
    ] as const) {
      await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
        await expectToolcraftCompoundControlPartOutcome(color, session.targetAction(target, async () => {
          const input = field(page, target).getByRole("textbox", { name: `${label} ${suffix}`, exact: true });
          await input.fill(value);
          await input.press("Enter");
          for (const element of await page.locator(card).all()) {
            expect(await element.evaluate((node, name) => getComputedStyle(node)[name], property)).toContain("255, 0, 0");
          }
        }), Array.from({ length: 4 }, () => [...expected]), { requirementId: target, part });
      }), proof(target));
    }
  });
}

test(title("carousel.shadow.offset"), async ({ page }) => {
  const session = await prepare(page);
  const target = "carousel.shadow.offset";
  await field(page, "carousel.shadow.enabled").getByRole("switch").click();
  // The compact editor rounds to two decimals; use an exactly representable
  // UI fixture so the X-only edit cannot also round the authored Y default.
  await field(page, target).getByRole("button", { name: "Edit Shadow offset value", exact: true }).click();
  await field(page, target).getByRole("textbox").fill("0, 0.25");
  await field(page, target).getByRole("textbox").press("Enter");
  await page.mouse.move(0, 0);
  const offsets = session.observe(root => Array.from(root.querySelectorAll('[data-fd-carousel-sequence="primary"] [data-fd-carousel-card-shell]'), element =>
    getComputedStyle(element).boxShadow.match(/-?[\d.]+px/gu)!.slice(0, 2).map(Number.parseFloat)));
  for (const [part, value, expected] of [
    ["vector.x", "0.5, 0.25", [24, 12]],
    ["vector.y", "0.5, 0.5", [24, 24]],
  ] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await expectToolcraftCompoundControlPartOutcome(offsets, session.targetAction(target, async () => {
        await field(page, target).getByRole("button", { name: "Edit Shadow offset value", exact: true }).click();
        const input = field(page, target).getByRole("textbox");
        await input.fill(value);
        await input.press("Enter");
      }), Array.from({ length: 4 }, () => [...expected]), { requirementId: target, part });
    }), proof(target));
  }
});

async function expectSpeed(page: Page, speed: number) {
  const track = page.locator("[data-fd-carousel-track]");
  await expect(track).toHaveCSS("animation-play-state", "running");
  await expect.poll(() => track.evaluate(element => getComputedStyle(element).transform)).not.toBe("none");
  const samples = await track.evaluate(async element => {
    const values: { time: number; x: number }[] = [];
    for (let index = 0; index < 12; index += 1) {
      const time = await new Promise<number>(resolve => requestAnimationFrame(resolve));
      values.push({ time, x: new DOMMatrixReadOnly(getComputedStyle(element).transform).m41 });
    }
    return values;
  });
  const velocities = samples.slice(1).map((sample, index) => (sample.x - samples[index]!.x) / (sample.time - samples[index]!.time) * 1000)
    .filter(velocity => velocity < 0).sort((a, b) => a - b);
  expect(velocities.length).toBeGreaterThanOrEqual(9);
  expect(Math.abs(velocities[Math.floor(velocities.length / 2)]! + speed)).toBeLessThan(speed * 0.08);
}

async function hoverVisibleCard(page: Page) {
  const point = await page.locator("[data-fd-carousel-card-shell]").evaluateAll(elements => {
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const left = Math.max(0, rect.left);
      const right = Math.min(innerWidth - 400, rect.right);
      const top = Math.max(0, rect.top);
      const bottom = Math.min(innerHeight, rect.bottom);
      if (right - left > 40 && bottom - top > 40) return { x: left + 20, y: top + 20 };
    }
    throw new Error("Expected a visible carousel card away from the controls panel");
  });
  // Pointer movement itself does not require an animated element to settle.
  await page.mouse.move(point.x, point.y);
  return point;
}

async function expectCenteredStaticRow(page: Page) {
  await expect(page.locator(card)).toHaveCount(1);
  await expect(page.locator('[data-fd-carousel-sequence="clone"]')).toHaveCount(0);
  const samples = await page.locator(carousel).evaluate(async root => {
    const row = root.querySelector('[data-fd-carousel-sequence="primary"]')!;
    const track = root.querySelector("[data-fd-carousel-track]")!;
    const values: { left: number; centerDelta: number; rowWidth: number; availableWidth: number; animation: string }[] = [];
    for (let index = 0; index < 24; index += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const bounds = root.getBoundingClientRect();
      const rect = row.getBoundingClientRect();
      values.push({
        left: rect.left,
        centerDelta: rect.left + rect.width / 2 - (bounds.left + bounds.width / 2),
        rowWidth: rect.width,
        availableWidth: bounds.width,
        animation: getComputedStyle(track).animationName,
      });
    }
    return values;
  });
  for (const sample of samples) {
    expect(sample.rowWidth).toBeLessThan(sample.availableWidth);
    expect(Math.abs(sample.centerDelta)).toBeLessThan(1);
    expect(Math.abs(sample.left - samples[0]!.left)).toBeLessThan(0.1);
    expect(sample.animation).toBe("none");
  }
}

test(title("carousel.speed"), async ({ page }) => {
  const session = await prepare(page, true);
  const target = "carousel.speed";
  const control = field(page, target);
  const slider = control.getByRole("slider");
  const track = control.locator('[data-slot="slider"]').first();
  await page.mouse.move(0, 0);
  const original = Number(await slider.getAttribute("aria-valuenow"));
  await expectSpeed(page, original);
  // Native hover is the visitor-owned pause mechanism; no clock is written.
  const pausePoint = await hoverVisibleCard(page);
  await expect(page.locator("[data-fd-carousel-track]")).toHaveCSS("animation-play-state", "paused");
  await track.scrollIntoViewIfNeeded();
  try {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      const box = await track.boundingBox();
      if (!box) throw new Error("Expected carousel speed slider");
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.7 + 1, box.y + box.height / 2);
      const selected = Number(await slider.getAttribute("aria-valuenow"));
      expect(selected).toBeGreaterThan(original * 2);
      await expectSpeed(page, selected);
      // Verify motion while held, then use the same real hover pause for pixels.
      await page.mouse.up();
      await page.mouse.move(pausePoint.x, pausePoint.y);
      await expect(page.locator("[data-fd-carousel-track]")).toHaveCSS("animation-play-state", "paused");
    }), proof(target));
  } finally {
    await page.mouse.up();
  }
  // Fitting rows are a separate accepted branch of this same Speed control:
  // normal motion stays enabled, but no clone or scrolling animation is needed.
  await field(page, "carousel.count").getByRole("slider").press("Home");
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "300");
  await page.mouse.move(0, 0);
  await expectCenteredStaticRow(page);
  await track.scrollIntoViewIfNeeded();
  try {
    const box = await track.boundingBox();
    if (!box) throw new Error("Expected fitting-row speed slider");
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2 + 1, box.y + box.height / 2);
    expect(Number(await slider.getAttribute("aria-valuenow"))).toBeLessThan(100);
    await expectCenteredStaticRow(page);
  } finally {
    await page.mouse.up();
  }
});
