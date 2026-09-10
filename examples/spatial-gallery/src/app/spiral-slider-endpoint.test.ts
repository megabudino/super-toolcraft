import { describe, expect, it } from "vitest";
import { spiralSliderEndpoint } from "../../e2e/spiral-slider-endpoint";

describe("focused gallery slider actions", () => {
  it("leaves the vertical-gap baseline when its default equals its minimum", () => {
    expect(spiralSliderEndpoint(0.35, 0.35, 1.4)).toBe("End");
  });
  it("selects the endpoint farthest from a middle or maximum baseline", () => {
    expect(spiralSliderEndpoint(0.055, 0, 0.5)).toBe("End");
    expect(spiralSliderEndpoint(0.5, 0, 0.5)).toBe("Home");
    expect(spiralSliderEndpoint(0.25, 0, 0.5)).toBe("End");
  });
  it("rejects missing range attributes coerced into a zero-width range", () => {
    expect(() => spiralSliderEndpoint(0.35, 0, 0)).toThrow("increasing range");
  });
});
