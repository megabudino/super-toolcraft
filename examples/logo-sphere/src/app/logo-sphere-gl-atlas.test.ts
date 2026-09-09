import { describe, expect, it } from "vitest";
import { getLogoSphereAtlasLayout, sameLogoSphereImageSource } from "./logo-sphere-gl-atlas";

describe("retained full-quality sphere atlas", () => {
  it("sizes default and uploaded sources independently of playback", () => {
    expect(getLogoSphereAtlasLayout(30, true, 16384).tileSize).toBe(512);
    expect([1, 16, 17, 36, 37, 72].map(count => getLogoSphereAtlasLayout(count, false, 16384).tileSize))
      .toEqual([1024, 1024, 768, 768, 512, 512]);
  });
  it("steps down only for hardware packing and rejects unsupported texture bounds", () => {
    expect(getLogoSphereAtlasLayout(16, false, 4096).tileSize).toBe(768);
    expect(getLogoSphereAtlasLayout(72, false, 4096).tileSize).toBe(256);
    expect(() => getLogoSphereAtlasLayout(72, false, 1024)).toThrow();
  });
  it("retains sources until identity, crop, or runtime transform changes", () => {
    const source = { id: "logo", image: {} as CanvasImageSource, sourceRect: { x: 0, y: 0, width: 10, height: 10 } };
    expect(sameLogoSphereImageSource(source, { ...source })).toBe(true);
    expect(sameLogoSphereImageSource(source, { ...source, transform: { rotationDeg: 90 } })).toBe(false);
    expect(sameLogoSphereImageSource(source, { ...source, sourceRect: { ...source.sourceRect, x: 2 } })).toBe(false);
    expect(sameLogoSphereImageSource(source, { ...source, image: {} as CanvasImageSource })).toBe(false);
  });
});
