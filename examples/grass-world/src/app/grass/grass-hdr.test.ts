import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseGrassHdr } from "./grass-hdr";

describe("Radiance grass environment decoding", () => {
  it("decodes the bundled 1K RGBE environment into half-float RGBA", () => {
    const source = readFileSync(
      new URL("./assets/hdri/meadow_2_1k.hdr", import.meta.url),
    );
    const buffer = source.buffer.slice(
      source.byteOffset,
      source.byteOffset + source.byteLength,
    );
    const image = parseGrassHdr(buffer);

    expect(image.width).toBe(1024);
    expect(image.height).toBe(512);
    expect(image.data).toHaveLength(1024 * 512 * 4);
    expect(image.data.some((channel) => channel > 0)).toBe(true);
    expect(image.lighting.ambientColor).toHaveLength(3);
    expect(image.lighting.ambientColor.every(Number.isFinite)).toBe(true);
    expect(image.lighting.ambientStrength).toBeGreaterThan(0);
    expect(image.lighting.keyColor.every(Number.isFinite)).toBe(true);
    expect(image.lighting.keyDirection).toHaveLength(3);
    expect(
      Math.hypot(...image.lighting.keyDirection),
    ).toBeCloseTo(1, 4);
    expect(image.lighting.keyStrength).toBeGreaterThan(0);
  });

  it("derives distinct scene-lighting profiles from bundled environments", () => {
    const parse = (fileName: string) => {
      const source = readFileSync(
        new URL(`./assets/hdri/${fileName}`, import.meta.url),
      );
      return parseGrassHdr(
        source.buffer.slice(
          source.byteOffset,
          source.byteOffset + source.byteLength,
        ),
      ).lighting;
    };
    const overcast = parse("belfast_open_field_1k.hdr");
    const golden = parse("grasslands_sunset_1k.hdr");
    const hardSun = parse("qwantani_noon_puresky_1k.hdr");

    expect(overcast.ambientColor).not.toEqual(golden.ambientColor);
    expect(overcast.keyDirection).not.toEqual(golden.keyDirection);
    expect(hardSun.keyDirection).not.toEqual(overcast.keyDirection);
    expect(hardSun.keyStrength / hardSun.ambientStrength).toBeGreaterThan(
      overcast.keyStrength / overcast.ambientStrength,
    );
  });

  it("rejects files without a Radiance header", () => {
    const invalid = new TextEncoder().encode("not an hdr file").buffer;
    expect(() => parseGrassHdr(invalid)).toThrow(/HDR/u);
  });
});
