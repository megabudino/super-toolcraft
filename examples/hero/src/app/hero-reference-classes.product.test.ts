import { describe, expect, it } from "vitest";
import { referenceClasses } from "@/section/reference/reference-classes";

describe("native Hero utility isolation", () => {
  it("namespaces responsive utilities away from editor-global media queries", () => {
    expect(referenceClasses("absolute min-[80rem]:hidden object-cover"))
      .toBe("ref-absolute ref-min-[80rem]:hidden ref-object-cover");
  });

  it("preserves CSS module identities and already-namespaced values", () => {
    const classes = "_headingGroup_a1b2c_20 ref-absolute";
    expect(referenceClasses(classes)).toBe(classes);
    expect(referenceClasses(undefined)).toBeUndefined();
  });
});
