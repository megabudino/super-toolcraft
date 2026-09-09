import { describe, expect, it } from "vitest";

import { appAcceptance, appControlSectionInventory } from "./app-acceptance";
import { appSchema } from "./app-schema";
import {
  FINE_DETAILS_CAROUSEL_DEFAULTS,
  fineDetailsCarouselTargets,
} from "./fine-details-carousel-values";
import {
  createFineDetailsPreviewSettingsFromValues,
  FINE_DETAILS_PREVIEW_VERSION,
} from "./fine-details-preview-protocol";

const carouselTargets = Object.values(fineDetailsCarouselTargets);

describe("Fine Details carousel Toolcraft contract", () => {
  it("publishes three workflow sections for one fourteen-control entity", () => {
    const sections = appSchema.panels.controls?.sections.filter((section) =>
      ["carousel", "carousel-border", "carousel-shadow"].includes(section.id),
    );

    expect(sections?.map((section) => section.title)).toEqual([
      "Carousel",
      "Carousel Border",
      "Carousel Shadow",
    ]);
    expect(sections?.map((section) => Object.keys(section.controls).length)).toEqual([
      6, 3, 5,
    ]);

    const inventory = appControlSectionInventory.filter(
      (entry) => entry.entityId === "fine-details-carousel",
    );
    expect(inventory.map((entry) => entry.workflowStage)).toEqual([
      "presentation",
      "border",
      "shadow",
    ]);
    expect(inventory.flatMap((entry) => entry.targets).sort()).toEqual(
      [...carouselTargets].sort(),
    );

    const imagesModeAcceptance = appAcceptance.find(
      (entry) => entry.id === fineDetailsCarouselTargets.imagesMode,
    );
    expect(imagesModeAcceptance).toMatchObject({
      browser: true,
      optionCoverage: ["trail", "loading", "carousel"],
      target: "images.mode",
    });
    expect(imagesModeAcceptance?.browserTestName).toBe(
      "browser: loading state shows two placeholder cards",
    );
    expect(imagesModeAcceptance?.expectedObservable).toContain("Loading");
    expect(inventory[0]?.groupingReason).toContain("loading");
  });

  it("keeps the three-state mode selector visible and gates every editable branch", () => {
    const sections = appSchema.panels.controls?.sections;
    const carousel = sections?.find((section) => section.id === "carousel");
    const carouselBorder = sections?.find(
      (section) => section.id === "carousel-border",
    );
    const carouselShadow = sections?.find(
      (section) => section.id === "carousel-shadow",
    );

    expect(carousel?.controls.imagesMode).toMatchObject({
      applicability: { mode: "always" },
      defaultValue: "trail",
      options: [
        { label: "Trail", value: "trail" },
        { label: "Loading", value: "loading" },
        { label: "Carousel", value: "carousel" },
      ],
      target: "images.mode",
      type: "segmented",
    });
    const loadingAndCarouselApplicability = {
      all: [{ oneOf: ["loading", "carousel"], target: "images.mode" }],
      mode: "conditional",
      origin: "explicit",
    };
    for (const control of [
      carousel?.controls.textGap,
      carousel?.controls.radius,
      carousel?.controls.gap,
    ]) {
      expect(control?.applicability).toEqual(loadingAndCarouselApplicability);
    }
    expect(carousel?.controls.textGap).toMatchObject({
      defaultValue: 24,
      label: "Text gap",
      max: 200,
      min: 0,
      target: "carousel.textGap",
    });
    expect(carousel?.controls.count).toMatchObject({
      applicability: {
        all: [{ equals: "carousel", target: "images.mode" }],
        mode: "conditional",
      },
      description: "How many of the four authored images appear, in order.",
      label: "Images shown",
    });
    for (const control of [
      carousel?.controls.count,
      carousel?.controls.speed,
      ...Object.values(carouselBorder?.controls ?? {}),
      ...Object.values(carouselShadow?.controls ?? {}),
    ]) {
      const applicability = control?.applicability;
      expect(applicability).toMatchObject({
        mode: "conditional",
        origin: "explicit",
      });
      if (applicability?.mode !== "conditional") continue;
      expect(applicability.all).toContainEqual({
        equals: "carousel",
        target: "images.mode",
      });
    }
    for (const sectionId of [
      "trail-images",
      "trail",
      "trail-motion",
      "trail-border",
      "trail-shadow",
    ]) {
      const section = sections?.find((candidate) => candidate.id === sectionId);
      for (const control of Object.values(section?.controls ?? {})) {
        const applicability = control.applicability;
        expect(applicability.mode).toBe("conditional");
        if (applicability.mode !== "conditional") continue;
        expect(applicability.all).toContainEqual({
          equals: "trail",
          target: "images.mode",
        });
      }
    }
    expect(carouselTargets).not.toContain("carousel.height");
  });

  it("sends loading mode and carousel geometry through protocol v17", () => {
    expect(FINE_DETAILS_PREVIEW_VERSION).toBe(17);
    expect(
      createFineDetailsPreviewSettingsFromValues(
        {
          [fineDetailsCarouselTargets.borderColorOpacity]: {
            hex: "#336699",
            opacity: 45,
          },
          [fineDetailsCarouselTargets.borderEnabled]: true,
          [fineDetailsCarouselTargets.count]: 2,
          [fineDetailsCarouselTargets.imagesMode]: "loading",
          [fineDetailsCarouselTargets.shadowEnabled]: true,
          [fineDetailsCarouselTargets.shadowOffset]: { x: 0.25, y: -0.5 },
          [fineDetailsCarouselTargets.textGap]: 80,
        },
        1080,
      ),
    ).toMatchObject({
      carousel: {
        ...FINE_DETAILS_CAROUSEL_DEFAULTS,
        border: {
          ...FINE_DETAILS_CAROUSEL_DEFAULTS.border,
          colorOpacity: { hex: "#336699", opacity: 45 },
          enabled: true,
        },
        count: 2,
        shadow: {
          ...FINE_DETAILS_CAROUSEL_DEFAULTS.shadow,
          enabled: true,
          offset: { x: 0.25, y: -0.5 },
        },
        textGap: 80,
      },
      imagesMode: "loading",
    });
  });
});
