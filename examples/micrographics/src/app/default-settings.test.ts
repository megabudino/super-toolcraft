import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { defaultMicrographicsValues } from "./default-settings";
import { parseElements } from "./poster-model";

describe("default micrographics settings", () => {
  it("preserves the supplied settings snapshot exactly", () => {
    expect(defaultMicrographicsValues["composition.seed"]).toBe(447);
    expect(defaultMicrographicsValues["composition.count"]).toBe(3);
    expect(defaultMicrographicsValues["composition.kit"]).toBe("minimal");
    expect(defaultMicrographicsValues["elements.scale"]).toBe(71);
    expect(defaultMicrographicsValues["source.preset"]).toBe("fitness");

    const layout = defaultMicrographicsValues["composition.layout"];
    const elements = parseElements(layout);

    expect(layout).toHaveLength(5_429);
    expect(createHash("sha256").update(layout).digest("hex")).toBe(
      "9acb1b730a3aec116c94c9853b1adc1ca8fe0ac9a76da7f4d53ecdd638de4927",
    );
    expect(elements).toHaveLength(22);
    expect(elements.filter((element) => element.removed)).toHaveLength(14);
    expect(
      elements
        .filter((element) => !element.removed)
        .map((element) => element.template),
    ).toEqual([
      "big-number",
      "footer-line",
      "data-table",
      "spec-sheet",
      "contour",
      "barcode",
      "brand-lockup",
      "globe",
    ]);
  });

});
