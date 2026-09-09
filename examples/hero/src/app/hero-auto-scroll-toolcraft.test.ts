import { describe, expect, it } from "vitest";

import { appControlSectionInventory } from "./app-acceptance-data";
import { appSchema } from "./app-schema";
import { heroGalleryTargets } from "./hero-gallery-values";

describe("Hero Sphere auto-scroll Toolcraft contract", () => {
  it("keeps the approved switch label with scoped inventory evidence", () => {
    const section = appSchema.panels.controls?.sections.find(
      (candidate) => candidate.id === "auto-scroll",
    );
    const inventory = appControlSectionInventory.find(
      (candidate) => candidate.id === "auto-scroll",
    );

    expect(section?.title).toBe("Auto Scroll");
    expect(section?.controls.enabled.label).toBe("Auto scroll");
    expect(inventory?.sectionTitleLabelEvidence).toMatchObject({
      target: heroGalleryTargets.autoScrollEnabled,
    });
  });
});
