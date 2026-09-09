import { describe, expect, it } from "vitest";

import { appControlSectionInventory } from "./app-acceptance-data";
import { appSchema } from "./app-schema";
import { heroEffectsTargets } from "./hero-effects-values";
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
    expect(inventory?.targets).toContain(heroGalleryTargets.autoScrollEnabled);
    expect(inventory?.groupingReason).toContain(
      "intentionally repeats Auto scroll beside the switch",
    );
    expect(inventory).not.toHaveProperty("sectionTitleLabelEvidence");
  });

  it("keeps CRT label intent in supported section inventory metadata", () => {
    const section = appSchema.panels.controls?.sections.find(
      (candidate) => candidate.id === "motion-crt",
    );
    const inventory = appControlSectionInventory.find(
      (candidate) => candidate.id === "motion-crt",
    );

    expect(section?.title).toBe("CRT");
    expect(Object.values(section?.controls ?? {})).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "CRT",
          target: heroEffectsTargets.crtEnabled,
          type: "switch",
        }),
      ]),
    );
    expect(inventory?.targets).toContain(heroEffectsTargets.crtEnabled);
    expect(inventory?.groupingReason).toContain(
      "names both the section and its binary switch CRT",
    );
    expect(inventory).not.toHaveProperty("sectionTitleLabelEvidence");
  });
});
