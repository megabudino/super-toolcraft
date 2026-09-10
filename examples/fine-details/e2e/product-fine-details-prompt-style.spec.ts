import type { Page } from "@playwright/test";
import { appAcceptance } from "../src/app/app-acceptance-data";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftCompoundControlPartOutcome } from "./browser-state-evidence-helpers";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const section = "[data-fine-details-section]";
const prompt = "[data-fine-details-prompt]";
const panel = `${prompt} form`;
const field = (page: Page, target: string) => page.locator(`[data-toolcraft-control-target="${target}"]`);
function title(target: string) {
  const row = appAcceptance.find(item => item.id === target);
  if (!row) throw new Error(`Missing prompt acceptance ${target}`);
  return row.browserTestName;
}
async function prepare(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  await expect(page.locator(panel)).toBeVisible();
  return session;
}
const proof = (target: string) => ({
  requirementId: target, selector: section, stabilityIntervalMs: 50, stabilitySamples: 2,
});

for (const [target, index] of [["prompt.shadow.blur", 2], ["prompt.shadow.spread", 3]] as const) {
  test(title(target), async ({ page }) => {
    const session = await prepare(page);
    const read = () => page.locator(panel).evaluate((element, part) =>
      Number.parseFloat(getComputedStyle(element).boxShadow.match(/-?[\d.]+px/gu)![part]!), index);
    const before = await read();
    const control = field(page, target);
    const slider = control.getByRole("slider");
    const track = control.locator('[data-slot="slider"]').first();
    await track.scrollIntoViewIfNeeded();
    try {
      await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
        const box = await track.boundingBox();
        if (!box) throw new Error("Prompt shadow slider must be visible");
        await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.85 + 1, box.y + box.height / 2);
        await expect.poll(read).toBeGreaterThan(before);
        await expect.poll(read).toBe(Number(await slider.getAttribute("aria-valuenow")));
      }), proof(target));
    } finally {
      await page.mouse.up();
    }
  });
}

test(title("prompt.shadow.enabled"), async ({ page }) => {
  const session = await prepare(page);
  const target = "prompt.shadow.enabled";
  const toggle = field(page, target).getByRole("switch");
  const original = await page.locator(panel).evaluate(element => getComputedStyle(element).boxShadow);
  await expect(toggle).toBeChecked();
  expect(original).not.toBe("none");
  await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
    await toggle.click();
    await expect(page.locator(panel)).toHaveCSS("box-shadow", "none");
    for (const child of ["offset", "blur", "spread", "colorOpacity"]) {
      await expect(field(page, `prompt.shadow.${child}`)).toHaveCount(0);
    }
  }), proof(target));
  await toggle.click();
  await expect(page.locator(panel)).toHaveCSS("box-shadow", original);
});

test(title("prompt.shadow.offset"), async ({ page }) => {
  const session = await prepare(page);
  const target = "prompt.shadow.offset";
  const offset = session.observe(root => {
    const element = root.querySelector('[data-fine-details-prompt] form')!;
    return getComputedStyle(element).boxShadow.match(/-?[\d.]+px/gu)!.slice(0, 2).map(Number.parseFloat);
  });
  for (const [part, value, expected] of [
    ["vector.x", "0.5, 0.48", [24, 23.04]],
    ["vector.y", "0.5, 0.5", [24, 24]],
  ] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await expectToolcraftCompoundControlPartOutcome(offset, session.targetAction(target, async () => {
        await field(page, target).getByRole("button", { name: "Edit Shadow offset value" }).click();
        const input = field(page, target).getByRole("textbox");
        await input.fill(value);
        await input.press("Enter");
      }), [...expected], { requirementId: target, part });
    }), proof(target));
  }
});

test(title("prompt.shadow.colorOpacity"), async ({ page }) => {
  const session = await prepare(page);
  const target = "prompt.shadow.colorOpacity";
  const color = session.observe(root => {
    const shadow = getComputedStyle(root.querySelector('[data-fine-details-prompt] form')!).boxShadow;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.fillStyle = shadow.match(/rgba?\([^)]*\)/u)![0];
    context.fillRect(0, 0, 1, 1);
    return Array.from(context.getImageData(0, 0, 1, 1).data);
  });
  const opacity = field(page, target).getByRole("textbox", { name: "Shadow color opacity", exact: true });
  const baselineAlpha = Math.round(Number(await opacity.inputValue()) * 255 / 100);
  for (const [part, label, value, expected] of [
    ["colorOpacity.hex", "Shadow color hex", "#FF0000", [255, 0, 0, baselineAlpha]],
    ["colorOpacity.opacity", "Shadow color opacity", "80", [255, 0, 0, 204]],
  ] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await expectToolcraftCompoundControlPartOutcome(color, session.targetAction(target, async () => {
        const input = field(page, target).getByRole("textbox", { name: label, exact: true });
        await input.fill(value);
        await input.press("Enter");
      }), [...expected], { requirementId: target, part });
    }), proof(target));
  }
});

test(title("prompt.position"), async ({ page }) => {
  const session = await prepare(page);
  const target = "prompt.position";
  const position = session.observe(root => {
    const element = root.querySelector<HTMLElement>('[data-fine-details-prompt]')!;
    const bounds = root.querySelector('[data-fine-details-section]')!.getBoundingClientRect();
    const css = getComputedStyle(element);
    return {
      left: Number((Number.parseFloat(css.left) / bounds.width * 100).toFixed(2)),
      top: Number((Number.parseFloat(css.top) / bounds.height * 100).toFixed(2)),
    };
  });
  for (const [part, value, expected] of [
    ["vector.x", "0.25, -0.06", { left: 59, top: 47 }],
    ["vector.y", "0.25, 0.25", { left: 59, top: 62.5 }],
  ] as const) {
    await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
      await expectToolcraftCompoundControlPartOutcome(position, session.targetAction(target, async () => {
        await field(page, target).getByRole("button", { name: "Edit Position value", exact: true }).click();
        const input = field(page, target).getByRole("textbox");
        await input.fill(value);
        await input.press("Enter");
      }), expected, { requirementId: target, part });
    }), proof(target));
  }
});
