import { describe, expect, it } from "vitest";

import { grassWindVertexModel } from "./grass-wind-material";

describe("grass wind material", () => {
  it("returns before spatial noise when all authored force is uniformly zero", () => {
    const earlyReturn = grassWindVertexModel.indexOf(
      "if (activeWindStrength <= 0.000001)",
    );
    const firstSpatialHash = grassWindVertexModel.indexOf(
      "float instanceValue = grassWindHash",
    );

    expect(earlyReturn).toBeGreaterThan(-1);
    expect(firstSpatialHash).toBeGreaterThan(earlyReturn);
    expect(grassWindVertexModel).toContain("return vec2(0.0);");
  });
});
