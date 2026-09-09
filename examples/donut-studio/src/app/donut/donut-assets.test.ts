import { readFileSync } from "node:fs";
import { Box3, Mesh } from "three";
import { describe, expect, it } from "vitest";

import { parseDonutReferenceGeometry, parseRadianceHdr } from "./donut-assets";

function radianceBytes(header: string, pixels: readonly number[]): ArrayBuffer {
  const head = Array.from(header, (char) => char.charCodeAt(0));
  return new Uint8Array([...head, ...pixels]).buffer;
}

describe("Donut Studio authored geometry asset", () => {
  it("parses the exact baked Base and Plate meshes", () => {
    const bytes = readFileSync("public/donut-studio/donut-reference.bin");
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const root = parseDonutReferenceGeometry(buffer);
    const base = root.getObjectByName("Base");
    const plate = root.getObjectByName("Plate");
    expect(base).toBeInstanceOf(Mesh);
    expect(plate).toBeInstanceOf(Mesh);
    if (!(base instanceof Mesh) || !(plate instanceof Mesh)) return;
    expect(base.geometry.getAttribute("position").count).toBe(21_504);
    expect(base.geometry.getIndex()?.count).toBe(129_024);
    expect(plate.geometry.getAttribute("position").count).toBe(3_842);
    expect(plate.geometry.getIndex()?.count).toBe(23_040);

    const bounds = new Box3().setFromObject(root);
    expect(bounds.min.x).toBeCloseTo(-2.21435809, 5);
    expect(bounds.max.x).toBeCloseTo(2.21435809, 5);
    expect(bounds.min.y).toBeCloseTo(-0.7628237, 5);
    expect(bounds.max.y).toBeCloseTo(0.64779657, 5);
  });

  it("rejects invalid binary input", () => {
    expect(() => parseDonutReferenceGeometry(new ArrayBuffer(12))).toThrow(
      /Invalid Donut Studio geometry/,
    );
  });
});

describe("Donut Studio Radiance HDR environment decoder", () => {
  it("decodes flat RGBE pixels into linear float radiance", () => {
    const parsed = parseRadianceHdr(
      radianceBytes("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 2 +X 2\n", [
        128, 0, 0, 129, 0, 128, 0, 130, 0, 0, 64, 129, 255, 255, 255, 128,
      ]),
    );

    expect(parsed.width).toBe(2);
    expect(parsed.height).toBe(2);
    expect(parsed.data).toHaveLength(16);
    expect(parsed.data[0]).toBeCloseTo(1, 5);
    expect(parsed.data[5]).toBeCloseTo(2, 5);
    expect(parsed.data[10]).toBeCloseTo(0.5, 5);
    expect(parsed.data[12]).toBeCloseTo(255 / 256, 5);
    expect(parsed.data[3]).toBe(1);
  });

  it("decodes adaptive run-length scanlines above one radiance unit", () => {
    const parsed = parseRadianceHdr(
      radianceBytes("#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y 1 +X 8\n", [
        2, 2, 0, 8, 136, 128, 136, 0, 136, 0, 136, 130,
      ]),
    );

    expect(parsed.width).toBe(8);
    expect(parsed.data[0]).toBeCloseTo(2, 5);
    expect(parsed.data[28]).toBeCloseTo(2, 5);
    expect(parsed.data[1]).toBe(0);
  });

  it("rejects payloads that are not Radiance HDR", () => {
    expect(() =>
      parseRadianceHdr(radianceBytes("PNG-not-hdr\n", [0, 0, 0, 0])),
    ).toThrow(/Radiance HDR/);
  });
});
