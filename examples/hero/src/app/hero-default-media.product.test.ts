import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { heroDefaultMediaAssets } from "./hero-default-media";

// Read the actual JPEG frame header, independently of the authored metadata.
// This works in Node without decoding pixels or importing browser image APIs.
function jpegSize(bytes: Buffer) {
  expect(bytes.readUInt16BE(0)).toBe(0xffd8);
  let offset = 2;
  while (offset + 4 < bytes.length) {
    expect(bytes[offset]).toBe(0xff);
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    const length = bytes.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3), unit: "px" };
    }
    if (length < 2) throw new Error("Invalid JPEG segment length");
    offset += length;
  }
  throw new Error("JPEG has no supported frame header");
}

it("declares the original dimensions for every attached Hero default image", () => {
  expect(heroDefaultMediaAssets).toHaveLength(60);
  const uniqueFiles = new Set(heroDefaultMediaAssets.map(asset => asset.fileName));
  expect(uniqueFiles.size).toBe(36);
  for (const asset of heroDefaultMediaAssets) {
    const source = readFileSync(new URL(`../section/assets/images/recraft-hero/defaults/${asset.fileName}`, import.meta.url));
    expect(asset, asset.id).toMatchObject({ assetKind: "image", size: jpegSize(source) });
  }
});
