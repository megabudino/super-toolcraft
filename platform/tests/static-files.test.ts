import { describe, expect, it } from "vitest";

import { isImmutableAsset, resolveInside } from "@/lib/static-files";

describe("resolveInside", () => {
  it("keeps paths inside the root", () => {
    expect(resolveInside("/srv/app", ["assets", "index-abc.js"])).toBe("/srv/app/assets/index-abc.js");
  });

  it("rejects traversal and encoded tricks", () => {
    expect(resolveInside("/srv/app", ["..", "secret"])).toBeNull();
    expect(resolveInside("/srv/app", ["%2e%2e", "secret"])).toBeNull();
    expect(resolveInside("/srv/app", ["..%2Fsecret"])).toBeNull();
    expect(resolveInside("/srv/app", ["a%5C..%5C..%5Csecret"])).toBeNull();
    expect(resolveInside("/srv/app", ["%00"])).toBeNull();
    expect(resolveInside("/srv/app", ["%E0%A4%A"])).toBeNull();
  });

  it("detects hashed Vite assets", () => {
    expect(isImmutableAsset("assets/index-qh2-W5ck.js")).toBe(true);
    expect(isImmutableAsset("favicon.svg")).toBe(false);
  });
});
