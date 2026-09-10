import type { Page } from "@playwright/test";
import { appAcceptance } from "../src/app/app-acceptance-data";
import { createToolcraftBrowserProofSession } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange } from "./product-observable-helpers";
import { expect, test } from "./toolcraft-product-test";

const cards = "[data-fine-details-loading-card]";
const field = (page: Page, name: string) => page.locator(`[data-toolcraft-control-target="${name}"]`);
const value = async (page: Page, name: string) => Number(await field(page, `loading.${name}`).getByRole("slider").getAttribute("aria-valuenow"));

async function readWaves(page: Page) {
  return page.locator(cards).evaluateAll(elements => elements.map(element => {
    const css = getComputedStyle(element, "::after");
    const colorValues = css.backgroundImage.match(/color\([^)]*\)|rgba?\([^)]*\)/gu) ?? [];
    const colors = colorValues.map(color => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[0]!;
    });
    return {
      angle: Number(css.maskImage.match(/([\d.]+)deg/u)?.[1]),
      colors,
      delay: Number.parseFloat(css.animationDelay) * 1000,
      duration: Number.parseFloat(css.animationDuration) * 1000,
      opacity: Number(css.opacity),
      shift: css.backgroundPosition.split(" ").map(Number.parseFloat),
      size: Number.parseFloat(getComputedStyle(element).width),
      stops: Array.from(css.maskImage.matchAll(/([\d.]+)%/gu), match => Number(match[1])),
      tileSize: Number.parseFloat(css.maskSize),
    };
  }));
}

async function waitForAnimatedMaskPositions(page: Page) {
  // A positive delay is a real pre-animation phase. The protected raster
  // capture restarts infinite animations, so every motion reader waits for
  // both masks to leave their underlying 0% 0% positions before sampling.
  await expect.poll(() => page.locator(cards).evaluateAll(elements => elements.length === 2 && elements.every(element =>
    getComputedStyle(element, "::after").maskPosition.split(" ").every(position => position.endsWith("px")),
  ))).toBe(true);
}

// Read the actual interpolated mask positions over native animation frames.
// This never sets animation.currentTime, installs a clock, or writes DOM/state.
async function readMotion(page: Page) {
  return page.locator(cards).evaluateAll(async elements => {
    const samples: { time: number; positions: number[][] }[] = [];
    for (let index = 0; index < 10; index += 1) {
      const time = await new Promise<number>(resolve => requestAnimationFrame(resolve));
      samples.push({
        time,
        positions: elements.map(element => getComputedStyle(element, "::after").maskPosition.split(" ").map(Number.parseFloat)),
      });
    }
    return samples;
  });
}

async function expectTravel(page: Page) {
  const angle = await value(page, "angle") * Math.PI / 180;
  const axis = [Math.sin(angle), -Math.cos(angle)];
  const passTime = await value(page, "passTime");
  const waveWidth = await value(page, "waveWidth");
  const desync = await value(page, "desync");
  const wave = await readWaves(page);
  await waitForAnimatedMaskPositions(page);
  const samples = await readMotion(page);
  for (const [card, surface] of wave.entries()) {
    const distance = surface.size * (Math.abs(axis[0]!) + Math.abs(axis[1]!) + waveWidth / 100 * Math.SQRT2);
    const expectedSpeed = distance / passTime / (1 + card * desync / 100);
    const velocities = samples.slice(1).map((sample, index) => {
      const previous = samples[index]!;
      return sample.positions[card]!.map((position, coordinate) =>
        (position - previous.positions[card]![coordinate]!) / (sample.time - previous.time));
    }).filter(velocity => Math.hypot(...velocity) < expectedSpeed * 2);
    // A loop wrap is excluded, but at least six genuine advancing intervals
    // must remain. Direction and speed come from the rendered mask motion.
    expect(velocities.length).toBeGreaterThanOrEqual(6);
    for (let coordinate = 0; coordinate < 2; coordinate += 1) {
      const sorted = velocities.map(velocity => velocity[coordinate]!).sort((a, b) => a - b);
      const actual = sorted[Math.floor(sorted.length / 2)]!;
      expect(Math.abs(actual - axis[coordinate]! * expectedSpeed)).toBeLessThan(Math.max(0.005, expectedSpeed * 0.08));
    }
  }
}

async function expectStagger(page: Page, delay: number) {
  const angle = await value(page, "angle") * Math.PI / 180;
  const axis = [Math.sin(angle), -Math.cos(angle)];
  const passTime = await value(page, "passTime");
  const pause = await value(page, "pause");
  const waveWidth = await value(page, "waveWidth");
  const surfaces = await readWaves(page);
  await waitForAnimatedMaskPositions(page);
  const samples = await readMotion(page);
  const size = surfaces[0]!.size;
  const passDistance = size * (Math.abs(axis[0]!) + Math.abs(axis[1]!) + waveWidth / 100 * Math.SQRT2);
  const travelDistance = passDistance * (1 + pause / passTime);
  const expectedPhaseLag = delay / (passTime + pause);
  for (const sample of samples) {
    const separation = sample.positions[0]!.reduce((sum, position, coordinate) =>
      sum + (position - sample.positions[1]![coordinate]!) * axis[coordinate]!, 0);
    const phaseLag = ((separation / travelDistance) % 1 + 1) % 1;
    expect(Math.abs(phaseLag - expectedPhaseLag)).toBeLessThan(0.015);
  }
}

async function prepare(page: Page, target: string) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "commit" });
  const session = await createToolcraftBrowserProofSession(page);
  const flight = field(page, "prompt.flight.enabled").getByRole("switch");
  if (await flight.isChecked()) await flight.click();
  await field(page, "images.mode").getByRole("button", { name: "Loading", exact: true }).click();
  await expect(page.locator(cards)).toHaveCount(2);
  await expect(page.locator(cards).first()).toBeVisible();
  // Isolate phase lag or speed ratio through real prerequisite controls.
  if (target === "loading.stagger") await field(page, "loading.desync").getByRole("slider").press("Home");
  if (target === "loading.desync") await field(page, "loading.stagger").getByRole("slider").press("Home");
  return session;
}

for (const name of ["glare", "distort", "waveWidth", "softness", "angle", "passTime", "pause", "stagger", "desync"] as const) {
  const target = `loading.${name}`;
  const row = appAcceptance.find(item => item.id === target);
  if (!row) throw new Error(`Missing loading acceptance ${target}`);
  test(row.browserTestName, async ({ page }) => {
    const session = await prepare(page, target);
    const before = await readWaves(page);
    const original = await value(page, name);
    const track = field(page, target).locator('[data-slot="slider"]').first();
    await track.scrollIntoViewIfNeeded();
    try {
      await expectToolcraftProductObservableToChange(session, session.targetAction(target, async () => {
        const box = await track.boundingBox();
        if (!box) throw new Error(`Expected visible loading slider ${target}`);
        await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.75 + 1, box.y + box.height / 2);
        await expect.poll(() => value(page, name)).not.toBe(original);
        const selected = await value(page, name);
        const after = await readWaves(page);
        for (const [index, surface] of after.entries()) {
          expect(surface.opacity).toBe(1);
          if (name === "glare") {
            // Computed CSS expands each two-position checker color into two
            // stops, yielding four rendered gradient color entries.
            expect(surface.colors).toHaveLength(4);
            for (const [colorIndex, red] of surface.colors.entries()) expect(red).toBeGreaterThan(before[index]!.colors[colorIndex]!);
          } else if (name === "distort") {
            expect(Math.hypot(...surface.shift)).toBeCloseTo(selected, 3);
          } else if (name === "waveWidth") {
            const axisExtent = Math.abs(Math.sin(surface.angle * Math.PI / 180)) + Math.abs(Math.cos(surface.angle * Math.PI / 180));
            const bandLength = (surface.stops[3]! - surface.stops[0]!) / 100 * surface.tileSize * axisExtent;
            expect(bandLength / (surface.size * Math.SQRT2) * 100).toBeCloseTo(selected, 2);
          } else if (name === "softness") {
            const coreShare = (surface.stops[2]! - surface.stops[1]!) / (surface.stops[3]! - surface.stops[0]!);
            expect((1 - coreShare) * 100).toBeCloseTo(selected, 2);
          } else if (name === "angle") {
            expect(surface.angle).toBe(selected);
          } else if (name === "stagger") {
            expect(surface.delay).toBe(index * selected);
          } else {
            const cycle = await value(page, "passTime") + await value(page, "pause");
            expect(surface.duration).toBeCloseTo(cycle * (1 + index * await value(page, "desync") / 100), 3);
          }
        }
        if (["angle", "passTime", "pause", "desync"].includes(name)) await expectTravel(page);
        if (name === "stagger") await expectStagger(page, selected);
      }), { requirementId: target, selector: "[data-fine-details-loading]", stabilityIntervalMs: 50, stabilitySamples: 2 });
    } finally {
      await page.mouse.up();
    }
  });
}
