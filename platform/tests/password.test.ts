import { describe, expect, it } from "vitest";

import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { safeEqual } from "@/lib/auth/tokens";
import { safeNextPath } from "@/lib/auth/users";

describe("password", () => {
  it("hashes with a random salt and verifies", async () => {
    const first = await hashPassword("correct horse battery");
    const second = await hashPassword("correct horse battery");
    expect(first).not.toBe(second);
    expect(await verifyPassword("correct horse battery", first)).toBe(true);
    expect(await verifyPassword("wrong password!!", first)).toBe(false);
    expect(await verifyPassword("anything", "garbage")).toBe(false);
  });

  it("enforces a minimum length", () => {
    expect(validatePasswordStrength("short")).toMatch(/at least/);
    expect(validatePasswordStrength("long enough pw")).toBeNull();
  });

  it("compares tokens in constant time", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
  });

  it("only allows same-site next paths", () => {
    expect(safeNextPath("/a/demo")).toBe("/a/demo");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
  });
});
