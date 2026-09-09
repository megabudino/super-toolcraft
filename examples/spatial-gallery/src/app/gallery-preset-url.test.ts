import { describe, expect, it } from "vitest";

import { resolveGalleryPresetUrl } from "./gallery-preset-url";

describe("resolveGalleryPresetUrl", () => {
  it("resolves local and canonical deployment bases", () => {
    expect(resolveGalleryPresetUrl("/", "blue-ice-cave.jpg")).toBe(
      "/gallery-presets/blue-ice-cave.jpg",
    );
    expect(
      resolveGalleryPresetUrl(
        "/demos/spatial-gallery/",
        "blue-ice-cave.jpg",
      ),
    ).toBe("/demos/spatial-gallery/gallery-presets/blue-ice-cave.jpg");
  });

  it("normalizes base and file separators", () => {
    expect(
      resolveGalleryPresetUrl(
        "/demos/spatial-gallery",
        "/blue-ice-cave.jpg",
      ),
    ).toBe("/demos/spatial-gallery/gallery-presets/blue-ice-cave.jpg");
  });
});
