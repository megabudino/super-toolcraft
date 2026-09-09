import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { grassButterflyTextureSizes } from "./grass-butterfly-assets";

const assetRoot = new URL("./assets/", import.meta.url);
const budgets = {
  ground: { basecolor: 2048, normal: 2048, ao: 512, roughness: 512 },
  clover: { basecolor: 2048, normal: 2048, ao: 512, roughness: 512 },
  boulder: { basecolor: 2048, normal: 2048, ao: 512, roughness: 512 },
  rocks: { basecolor: 1024, normal: 512, ao: 256, roughness: 256 },
  tufted: { basecolor: 1024, normal: 256, ao: 256, roughness: 256, opacity: 1024 },
  wild: { basecolor: 1024, normal: 256, ao: 256, roughness: 256, opacity: 1024 },
  white: { basecolor: 1024, normal: 256, ao: 256, roughness: 256, opacity: 1024 },
  yellow: { basecolor: 1024, normal: 256, ao: 256, roughness: 256, opacity: 1024 },
  butterflies: { basecolor: 512, normal: 256, roughness: 256, opacity: 1024 },
} as const;

function readWebpSize(url: URL): readonly [number, number] {
  const bytes = readFileSync(fileURLToPath(url));
  expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
  expect(bytes.toString("ascii", 8, 12)).toBe("WEBP");
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const kind = bytes.toString("ascii", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    expect(start + length).toBeLessThanOrEqual(bytes.length);
    if (kind === "VP8X") {
      return [bytes.readUIntLE(start + 4, 3) + 1, bytes.readUIntLE(start + 7, 3) + 1];
    }
    if (kind === "VP8L") {
      expect(bytes[start]).toBe(0x2f);
      const dimensions = bytes.readUInt32LE(start + 1);
      return [(dimensions & 0x3fff) + 1, ((dimensions >>> 14) & 0x3fff) + 1];
    }
    if (kind === "VP8 ") {
      expect(bytes.subarray(start + 3, start + 6)).toEqual(Buffer.from([0x9d, 0x01, 0x2a]));
      return [bytes.readUInt16LE(start + 6) & 0x3fff, bytes.readUInt16LE(start + 8) & 0x3fff];
    }
    offset = start + length + (length % 2);
  }
  throw new Error(`No WebP image dimensions in ${url.pathname}`);
}

describe("Grass World texture allocation", () => {
  it("reports the actual butterfly map allocation", () => {
    expect(grassButterflyTextureSizes).toEqual({
      baseColor: budgets.butterflies.basecolor,
      normal: budgets.butterflies.normal,
      opacity: budgets.butterflies.opacity,
      roughness: budgets.butterflies.roughness,
    });
  });
  for (const [group, maps] of Object.entries(budgets)) {
    it(`${group} uses the reviewed per-map texture dimensions`, () => {
      const directory = new URL(group === "butterflies" ? "butterflies/" : `scans/${group}/`, assetRoot);
      const images = readdirSync(fileURLToPath(directory)).filter(name => /\.(?:jpg|jpeg|png|webp)$/u.test(name));
      expect(images.sort()).toEqual(Object.keys(maps).map(role => `${group}-${role}.webp`).sort());
      for (const [role, size] of Object.entries(maps)) {
        expect(size).toBeLessThanOrEqual(2048);
        expect(readWebpSize(new URL(`${group}-${role}.webp`, directory))).toEqual([size, size]);
      }
    });
  }

  it("keeps HDR environments within 2K and retains compact preview dimensions", () => {
    const directory = new URL("hdri/", assetRoot);
    const names = readdirSync(fileURLToPath(directory));
    const environments = names.filter(name => name.endsWith(".hdr"));
    const previews = names.filter(name => /\.(?:png|webp)$/u.test(name));
    expect(environments).toHaveLength(8);
    expect(previews).toHaveLength(8);
    for (const name of environments) {
      const header = readFileSync(new URL(name, directory)).subarray(0, 2048).toString("ascii");
      const match = header.match(/-Y (\d+) \+X (\d+)/u);
      expect(match).not.toBeNull();
      const width = Number(match![2]), height = Number(match![1]);
      expect(width).toBeLessThanOrEqual(2048);
      expect(width).toBe(height * 2);
    }
    for (const name of previews) {
      expect(name.endsWith(".webp")).toBe(true);
      const [width, height] = readWebpSize(new URL(name, directory));
      expect([width, height]).toEqual(name === "blend_sunset.webp" ? [512, 256] : [320, 240]);
    }
  });
});
