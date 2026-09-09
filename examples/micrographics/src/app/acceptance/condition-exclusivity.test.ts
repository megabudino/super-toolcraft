import { describe, expect, it } from "vitest";

import { areToolcraftConditionsProvablyExclusive } from "./condition-exclusivity";

describe("Toolcraft condition exclusivity", () => {
  it("proves disjoint finite value gates", () => {
    expect(
      areToolcraftConditionsProvablyExclusive(
        { equals: "first", target: "model.active" },
        { equals: "second", target: "model.active" },
      ),
    ).toBe(true);
    expect(
      areToolcraftConditionsProvablyExclusive(
        { oneOf: ["first", "second"], target: "model.active" },
        { equals: "second", target: "model.active" },
      ),
    ).toBe(false);
    expect(
      areToolcraftConditionsProvablyExclusive(
        { notEquals: "hidden", target: "model.active" },
        { equals: "second", target: "model.active" },
      ),
    ).toBe(false);
  });

  it("proves non-overlapping numeric intervals without guessing across targets", () => {
    expect(
      areToolcraftConditionsProvablyExclusive(
        { lessThan: 0, target: "model.index" },
        { greaterThanOrEqual: 0, target: "model.index" },
      ),
    ).toBe(true);
    expect(
      areToolcraftConditionsProvablyExclusive(
        { equals: "first", target: "first.mode" },
        { equals: "second", target: "second.mode" },
      ),
    ).toBe(false);
  });

  it("stays conservative for primitive JSON collisions and invalid numeric bounds", () => {
    expect(
      areToolcraftConditionsProvablyExclusive(
        { equals: Number.NaN, target: "model.mode" },
        { notEquals: null, target: "model.mode" },
      ),
    ).toBe(false);
    expect(
      areToolcraftConditionsProvablyExclusive(
        {
          equals: 1,
          greaterThan: Number.NaN,
          target: "model.mode",
        },
        { equals: 1, target: "model.mode" },
      ),
    ).toBe(false);
  });
});
