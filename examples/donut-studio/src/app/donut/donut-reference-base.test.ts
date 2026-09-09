import { describe, expect, it } from "vitest";

import { createDonutAssetUrl } from "./donut-reference";

describe("Donut public asset URLs", () => {
  it("keeps local development assets at the root Donut directory", () => {
    expect(createDonutAssetUrl("donut-reference.glb", "/")).toBe(
      "/donut-studio/donut-reference.glb",
    );
  });

  it("prefixes public assets with the canonical demo base", () => {
    expect(
      createDonutAssetUrl(
        "materials/megascans-donut-basecolor-2k.jpg",
        "/demos/donut-studio/",
      ),
    ).toBe(
      "/demos/donut-studio/donut-studio/materials/megascans-donut-basecolor-2k.jpg",
    );
  });

  it("normalizes a deployment base without a trailing slash", () => {
    expect(
      createDonutAssetUrl("reference-manifest.json", "/demos/donut-studio"),
    ).toBe("/demos/donut-studio/donut-studio/reference-manifest.json");
  });
});
