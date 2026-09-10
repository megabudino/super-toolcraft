import { describe, expect, it } from "vitest";
import type { ToolcraftImageAsset } from "@/toolcraft/runtime";
import { fineDetailsDefaultTrailAssets } from "@/section/components/pages/home/fine-details-default-assets";
import { getFineDetailsBuiltInTrailMedia, getFineDetailsTrailRenderedImageDimensions } from "@/section/components/pages/home/fine-details-trail-image-media";
import { FINE_DETAILS_DEFAULT_TRAIL_ASSETS } from "./fine-details-default-assets";
import { createFineDetailsTrailImagesFromMediaAssets, fineDetailsTrailTargets } from "./fine-details-trail-values";

function embeddedSize(dataUrl: string) {
  const bytes = Buffer.from(dataUrl.split(",")[1]!, "base64");
  expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
  expect(bytes.toString("ascii", 8, 16)).toBe("WEBPVP8 ");
  expect([...bytes.subarray(23, 26)]).toEqual([0x9d, 0x01, 0x2a]);
  return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff, unit: "px" as const };
}

function imageAsset(id: string, size: ToolcraftImageAsset["size"], rotationDeg: 0 | 90 | 180 | 270 = 0): ToolcraftImageAsset {
  return { assetKind: "image", id, fileName: `${id}.webp`, layerId: `${id}-layer`, lifecycle: "ready",
    mimeType: "image/webp", position: { x: 0, y: 0 }, resourceRef: `${id}-preview`, size,
    sourceTarget: fineDetailsTrailTargets.images,
    transform: { rotationDeg, flipHorizontal: true, flipVertical: false } };
}

describe("Fine Details built-in preview metadata", () => {
  it("declares truthful dimensions for every unchanged embedded WebP", () => {
    expect(FINE_DETAILS_DEFAULT_TRAIL_ASSETS).toHaveLength(50);
    for (const asset of FINE_DETAILS_DEFAULT_TRAIL_ASSETS) {
      expect(asset.assetKind).toBe("image");
      if (!("dataUrl" in asset)) throw new Error("Expected embedded image bytes");
      expect(asset.size, asset.id).toEqual(embeddedSize(asset.dataUrl));
    }
  });

  it("preserves built-in natural/DPR2 source requests and final card geometry at every tested size and rotation", () => {
    for (const [index, builtin] of fineDetailsDefaultTrailAssets.entries()) {
      const asset = FINE_DETAILS_DEFAULT_TRAIL_ASSETS[index]!;
      if (!("dataUrl" in asset)) throw new Error("Expected embedded image bytes");
      for (const rotation of [0, 90, 180, 270] as const) {
        const oldImage = createFineDetailsTrailImagesFromMediaAssets([imageAsset(builtin.id, undefined, rotation)])[0]!;
        const nextImage = createFineDetailsTrailImagesFromMediaAssets([imageAsset(builtin.id, embeddedSize(asset.dataUrl), rotation)])[0]!;
        for (const cardSize of [40, 180, 241, 400]) {
          const oldMedia = getFineDetailsBuiltInTrailMedia(oldImage, cardSize, builtin);
          const nextMedia = getFineDetailsBuiltInTrailMedia(nextImage, cardSize, builtin);
          expect(nextMedia, `${builtin.id} ${cardSize}px ${rotation}deg source`).toEqual(oldMedia);
          expect(getFineDetailsTrailRenderedImageDimensions(nextImage, cardSize, nextMedia),
            `${builtin.id} ${cardSize}px ${rotation}deg card`).toEqual(getFineDetailsTrailRenderedImageDimensions(oldImage, cardSize, oldMedia));
        }
      }
    }
  });

  it("keeps uploaded image dimensions, source identity and transforms unchanged", () => {
    for (const size of [{ width: 120, height: 240, unit: "px" as const }, { width: 240, height: 120, unit: "px" as const }]) {
      const asset = imageAsset("uploaded-image", size, 90);
      expect(createFineDetailsTrailImagesFromMediaAssets([asset])).toEqual([{
        id: asset.id, ref: asset.resourceRef, width: size.width, height: size.height, transform: asset.transform,
      }]);
    }
  });
});
