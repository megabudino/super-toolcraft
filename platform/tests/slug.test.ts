import { describe, expect, it } from "vitest";

import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { initials } from "@/lib/visual";

describe("slugify", () => {
  it("derives URL-safe workspace slugs from names", () => {
    expect(slugify("Acme Inc.")).toBe("acme-inc");
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
    expect(slugify("  2024 Launch ")).toBe("launch");
    expect(SLUG_PATTERN.test(slugify("Initech Labs"))).toBe(true);
  });

  it("builds avatar initials", () => {
    expect(initials("Giulia Rossi")).toBe("GR");
    expect(initials("marco@acme.com")).toBe("MA");
  });
});
