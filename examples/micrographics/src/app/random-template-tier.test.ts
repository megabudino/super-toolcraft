import { createToolcraftState } from "@/toolcraft/runtime";
import { describe, expect, it } from "vitest";

import { appSchema } from "./app-schema";
import { buildPosterScene } from "./poster-model";
import { templateTier } from "./template-catalog";

describe("random template tier", () => {
  it("filters random compositions by simple, mega, or both tiers", () => {
    const buildForTier = (tier: "both" | "mega" | "simple") =>
      buildPosterScene(
        createToolcraftState(appSchema, {
          values: {
            "composition.count": 8,
            "composition.layout": "[]",
            "composition.seed": 731,
            "composition.templateTier": tier,
          },
        }),
      );

    const simple = buildForTier("simple");
    const mega = buildForTier("mega");
    const both = buildForTier("both");

    expect(new Set(simple.elements.map((element) => templateTier(element.template)))).toEqual(
      new Set(["simple"]),
    );
    expect(new Set(mega.elements.map((element) => templateTier(element.template)))).toEqual(
      new Set(["mega"]),
    );
    expect(new Set(both.elements.map((element) => templateTier(element.template)))).toEqual(
      new Set(["simple", "mega"]),
    );
    expect(buildForTier("both")).toEqual(both);
  });
});
