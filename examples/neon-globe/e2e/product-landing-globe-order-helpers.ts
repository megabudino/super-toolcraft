import type { Locator, Page } from "@playwright/test";

import { createToolcraftOrientationAxisSnapAction } from "./browser-orientation-gizmo-actions";
import { createToolcraftBrowserProofSession, runToolcraftBrowserAction } from "./browser-proof-session";
import { expectToolcraftProductObservableToChange, getToolcraftProductObservableSnapshot } from "./product-observable-helpers";
import { PREVIEW_CANVAS_SELECTOR, setRangeControl } from "./product-landing-globe-helpers";
import { expect } from "./toolcraft-product-test";

const rows = [
  { id: 1, logo: "dxc", label: "easyJet", position: 69, width: 17 },
  { id: 4, logo: "zillow", label: "Ubisoft", position: 46, width: 24 },
  { id: 2, logo: "meta", label: "Novo Nordisk", position: 6, width: 50 },
  { id: 3, logo: "prada", label: "Prada", position: -30, width: 16 },
] as const;

export async function expectGlobeControlOrder(page: Page): Promise<void> {
  const targets = (prefix: string, suffix = "") => page.locator(
    `[data-toolcraft-control-target^="${prefix}"]${suffix ? `[data-toolcraft-control-target$="${suffix}"]` : ""}`,
  ).evaluateAll((elements) => elements.map((element) => element.getAttribute("data-toolcraft-control-target")));
  expect(await targets("bands.band")).toEqual(rows.flatMap(({ id }) => [
    `bands.band${id}.position`, `bands.band${id}.width`,
  ]));
  for (const suffix of [".finalPosition", ".scale"]) {
    expect(await targets("logos.", suffix)).toEqual(rows.map(({ logo }) => `logos.${logo}${suffix}`));
  }
  for (const [index, row] of rows.entries()) {
    for (const property of ["position", "width"]) {
      await expect(page.locator(`[data-toolcraft-control-target="bands.band${row.id}.${property}"]`)
        .getByRole("slider", { name: `Band ${index + 1} ${property}`, exact: true })).toHaveCount(1);
    }
  }
}

export async function expectBandSliderLiveChange(
  control: Locator,
  value: number,
  [min, max]: readonly [number, number],
): Promise<void> {
  const page = control.page();
  await control.locator('[data-slot="slider-thumb"]').hover();
  const thumb = await control.locator('[data-slot="slider-thumb"]').boundingBox();
  const track = await control.locator('[data-slot="slider-track"]').boundingBox();
  if (!thumb || !track) throw new Error("Missing visible band slider.");
  const before = await getToolcraftProductObservableSnapshot(page);
  await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2);
  await page.mouse.down();
  try {
    await page.mouse.move(track.x + track.width * (value - min) / (max - min), track.y + track.height / 2, { steps: 6 });
    await page.clock.runFor(64);
    expect(await getToolcraftProductObservableSnapshot(page)).not.toEqual(before);
  } finally {
    await page.mouse.up();
    await page.clock.runFor(64);
  }
}

export async function readGlobeRowPixels(page: Page, row: { position: number; width: number }) {
  return page.locator(PREVIEW_CANVAS_SELECTOR).evaluate(async (element, band) => {
    const canvas = element as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Missing globe canvas.");
    const radius = Math.min(canvas.width, canvas.height) * 0.36;
    const top = Math.floor(canvas.height / 2 - radius * (band.position + band.width / 2) / 100);
    const height = Math.ceil(radius * band.width / 100);
    const pixels = context.getImageData(0, top, canvas.width, height).data;
    let whitePixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 200 && pixels[i + 1] > 200 && pixels[i + 2] > 200) whitePixels += 1;
    }
    const hash = await crypto.subtle.digest("SHA-256", pixels);
    return { whitePixels, hash: Array.from(new Uint8Array(hash)).join(",") };
  }, row);
}

export async function expectReorderedGlobeLoop(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.clock.install();
  await page.goto("/");
  await expectGlobeControlOrder(page);
  await setRangeControl(page.locator('[data-toolcraft-control-target="effects.crtIntensity"]'), 0);
  for (const row of rows) {
    await expect(page.locator(`[data-toolcraft-control-target="bands.band${row.id}.position"]`)
      .getByRole("slider")).toHaveAttribute("aria-valuenow", String(row.position));
    await expect(page.locator(`[data-toolcraft-control-target="bands.band${row.id}.width"]`)
      .getByRole("slider")).toHaveAttribute("aria-valuenow", String(row.width));
    await setRangeControl(page.locator(`[data-toolcraft-control-target="logos.${row.logo}.finalPosition"]`), 50);
  }
  const session = await createToolcraftBrowserProofSession(page);
  await runToolcraftBrowserAction(createToolcraftOrientationAxisSnapAction(session, "globe.orientation", "+z"));
  await expect.poll(async () => {
    const pose = JSON.parse(await page.getByRole("application", { name: "3D orientation gizmo" })
      .getAttribute("data-toolcraft-orientation-pose") ?? "null");
    return Math.abs(pose.position[0]) + Math.abs(pose.position[1]);
  }).toBeLessThan(0.00001);

  const runButton = page.getByRole("button", { name: "Run logos", exact: true });
  await runButton.hover();
  await getToolcraftProductObservableSnapshot(page);
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(new Date(now + 5000));
  await runButton.click();
  await page.clock.runFor(1472);
  const settled = [];
  for (const row of rows) {
    const pixels = await readGlobeRowPixels(page, row);
    expect(pixels.whitePixels).toBeGreaterThan(0);
    settled.push(pixels.hash);
  }
  await expectToolcraftProductObservableToChange(
    session,
    session.controlAction("logos.intro.run", async (control) => {
      await control.getByRole("button", { name: "Run logos" }).click();
      await page.clock.runFor(160);
    }),
    { requirementId: "logos.intro.run", stabilityIntervalMs: 0 },
  );

  let elapsed = 160;
  async function advanceTo(time: number) {
    await page.clock.runFor(time - elapsed);
    elapsed = time;
  }
  // At speed 2.5, each row arrives 336 ms after the previous one and holds for 3 s.
  for (const [rank, row] of rows.entries()) {
    const arrival = 304 + rank * 336;
    await advanceTo(arrival - 120);
    expect((await readGlobeRowPixels(page, row)).hash, `${row.label} is approaching`).not.toBe(settled[rank]);
    await advanceTo(arrival + 80);
    expect((await readGlobeRowPixels(page, row)).hash, `${row.label} reaches its own final state`).toBe(settled[rank]);
  }
  await page.screenshot({ path: ".toolcraft/browser-artifacts/band-order-desktop.png" });
  for (const [rank, row] of rows.entries()) {
    const departure = 304 + rank * 336 + 3000;
    await advanceTo(departure - 80);
    expect((await readGlobeRowPixels(page, row)).hash, `${row.label} keeps its full pause`).toBe(settled[rank]);
    await advanceTo(departure + 160);
    expect((await readGlobeRowPixels(page, row)).hash, `${row.label} starts the next orbit`).not.toBe(settled[rank]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(64);
  await expectGlobeControlOrder(page);
  expect((await readGlobeRowPixels(page, rows[0])).whitePixels).toBeGreaterThan(0);
  await page.screenshot({ path: ".toolcraft/browser-artifacts/band-order-mobile.png" });
}
