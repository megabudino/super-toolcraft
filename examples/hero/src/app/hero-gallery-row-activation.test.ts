import { describe, expect, it } from "vitest";

import { getHeroGalleryRowActivation } from "./hero-gallery-row-activation";

describe("getHeroGalleryRowActivation", () => {
  it("does not reactivate occupied rows on the first observation", () => {
    expect(getHeroGalleryRowActivation(null, new Set([4, 5]), 3)).toBeNull();
  });

  it("ignores a newly occupied drop that already has a row", () => {
    expect(getHeroGalleryRowActivation(new Set(), new Set([1]), 3)).toBeNull();
  });

  it("activates through a newly occupied higher row", () => {
    expect(getHeroGalleryRowActivation(new Set(), new Set([4]), 3)).toBe(5);
  });

  it("activates once through the highest of multiple newly occupied rows", () => {
    expect(
      getHeroGalleryRowActivation(new Set([0]), new Set([0, 3, 5]), 2),
    ).toBe(6);
  });

  it("does not react when an occupied drop becomes empty", () => {
    expect(getHeroGalleryRowActivation(new Set([4]), new Set(), 3)).toBeNull();
  });

  it("clamps the requested row count to six", () => {
    expect(getHeroGalleryRowActivation(new Set(), new Set([8]), 3)).toBe(6);
  });
});
