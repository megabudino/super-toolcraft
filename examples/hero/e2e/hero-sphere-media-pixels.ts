import type { Page } from "@playwright/test";
import { heroSphereMediaCanvas } from "./hero-sphere-media-fixture";
import { expect } from "./toolcraft-product-test";

type Point = { x: number; y: number };
export type SphereCardPixels = { aspect: number; colors: readonly (readonly number[])[] };
type Probe = { point: Point; color?: readonly number[]; label: string };

// Independent expectations for the public fixture's curved lens, not renderer
// state or a WebGL replacement. The website header is outside this native scene.
function project(u: number, v: number, sceneHeight: number): Point {
  const theta = u / 510;
  const phi = -v / 520;
  const z = 1270 * (0.5 * (1 - Math.cos(theta)) + 0.99 * (1 - Math.cos(phi)));
  const scale = 1660 / (1660 - z);
  return { x: 640 + 510 * Math.sin(theta) * scale, y: sceneHeight * 0.44 - 520 * Math.sin(phi) * scale };
}

function cardProbes(cards: readonly SphereCardPixels[], sceneHeight: number): Probe[] {
  const widths = cards.map(card => card.aspect * 180);
  const period = widths.reduce((sum, width) => sum + width + 40, 0);
  let start = -period / 2;
  return cards.flatMap((card, index) => {
    const width = widths[index];
    const left = start;
    start += width + 40;
    const points: Probe[] = [];
    // Corner-adjacent probes additionally detect wrong width/height or crop;
    // mere quadrant-center colors could pass with a stretched/cropped card.
    for (const fraction of [0.25, 0.08]) {
      for (const [quadrant, [x, y]] of [[fraction, fraction], [1 - fraction, fraction], [fraction, 1 - fraction], [1 - fraction, 1 - fraction]].entries()) {
        points.push({ point: project(left + width * x, (y - 0.5) * 180, sceneHeight), color: card.colors[quadrant], label: `card ${index}, quadrant ${quadrant}, inset ${fraction}` });
      }
    }
    for (const [x, y] of [[-0.08, 0.25], [1.08, 0.25], [0.25, -0.08], [0.25, 1.08]]) {
      points.push({ point: project(left + width * x, (y - 0.5) * 180, sceneHeight), label: `card ${index}, outside ${x}:${y}` });
    }
    return points;
  });
}

export async function captureSphereMediaPixels(page: Page, cards: readonly SphereCardPixels[] = [], expectBlank = false) {
  const canvas = page.locator(heroSphereMediaCanvas);
  await expect(canvas).toHaveAttribute("data-dispersion-ready", "true");
  await expect(canvas).toHaveCSS("opacity", "1");
  const size = await canvas.evaluate(element => ({ width: element.clientWidth, height: element.clientHeight }));
  expect(size.width).toBe(1280);
  expect(size.height).toBeGreaterThan(500);
  expect(size.height).toBeLessThan(720);
  const probes = cardProbes(cards, size.height);
  await page.getByRole("button", { name: "Collapse controls", exact: true }).click();
  let raster: Buffer;
  try {
    raster = await canvas.screenshot({ animations: "allow", scale: "css", type: "png" });
  } finally {
    await page.getByRole("button", { name: "Expand controls", exact: true }).click();
  }
  // Decode only the screenshot of displayed native output. The detached canvas
  // is a PNG reader, never a source image, app canvas, or synthetic product view.
  const result = await page.evaluate(async ({ encoded, points, sceneSize, siblingY }) => {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    try {
      const decode = document.createElement("canvas");
      decode.width = bitmap.width; decode.height = bitmap.height;
      const context = decode.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(bitmap, 0, 0);
      const sx = bitmap.width / sceneSize.width, sy = bitmap.height / sceneSize.height;
      const samples = points.map(point => {
        const x = Math.floor(point.x * sx), y = Math.floor(point.y * sy);
        if (x < 1 || y < 1 || x + 1 >= bitmap.width || y + 1 >= bitmap.height) throw new Error("Sphere probe must stay inside the actual screenshot");
        const data = context.getImageData(x - 1, y - 1, 3, 3).data;
        return [0, 1, 2].map(channel => {
          let sum = 0;
          for (let pixel = channel; pixel < data.length; pixel += 4) sum += data[pixel];
          return sum / 9;
        });
      });
      const region = (x: number, y: number, width: number, height: number) => context.getImageData(Math.round(x * sx), Math.round(y * sy), Math.round(width * sx), Math.round(height * sy)).data;
      const hash = async (pixels: Uint8ClampedArray) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", pixels)), value => value.toString(16).padStart(2, "0")).join("");
      const center = region(450, sceneSize.height * 0.44 - 45, 380, 90);
      const centerColors = new Set<string>();
      let minimum = 255, maximum = 0, chroma = 0;
      for (let pixel = 0; pixel < center.length; pixel += 4) {
        const channels = [center[pixel], center[pixel + 1], center[pixel + 2]];
        minimum = Math.min(minimum, ...channels); maximum = Math.max(maximum, ...channels);
        chroma = Math.max(chroma, Math.max(...channels) - Math.min(...channels));
        centerColors.add(channels.join(":"));
      }
      const sibling = region(540, siblingY - 15, 200, 30);
      const colors = new Set<string>();
      for (let pixel = 0; pixel < sibling.length; pixel += 16) colors.add(`${sibling[pixel]}:${sibling[pixel + 1]}:${sibling[pixel + 2]}`);
      return { samples, center: await hash(center), centerColors: centerColors.size, minimum, maximum, chroma,
        sibling: await hash(sibling), siblingColors: colors.size };
    } finally { bitmap.close(); }
  }, { encoded: raster.toString("base64"), points: probes.map(probe => probe.point), sceneSize: size, siblingY: project(0, -190, size.height).y });
  const palette = cards.flatMap(card => card.colors);
  for (const [index, probe] of probes.entries()) {
    const sample = result.samples[index];
    const distance = (color: readonly number[]) => Math.max(...color.map((value, channel) => Math.abs(sample[channel] - value)));
    if (probe.color) expect(distance(probe.color), `${probe.label}: native pixel ${sample.join(",")}`).toBeLessThan(18);
    else expect(palette.every(color => distance(color) > 24), `${probe.label}: pixels outside the aspect-correct card must not contain uploaded quadrants: ${sample.join(",")}`).toBe(true);
  }
  if (expectBlank) {
    // Authored #030303 background plus the 5%-white checker yields neutral
    // levels 3..16. Check every pixel in the selected row's interior, not only
    // equality with another empty capture that might contain a placeholder.
    expect(result.minimum, "Empty row exposes the authored background").toBeGreaterThanOrEqual(3);
    expect(result.maximum, "Empty row contains no remaining image or placeholder").toBeLessThanOrEqual(16);
    expect(result.chroma, "Empty row contains only the neutral checker background").toBeLessThanOrEqual(1);
  } else if (cards.length === 0) {
    expect(result.centerColors, "The attached default row contains actual photographic detail").toBeGreaterThan(16);
  }
  // The sibling crop includes real photograph variation, not only background.
  expect(result.siblingColors).toBeGreaterThan(16);
  return { center: result.center, sibling: result.sibling };
}
