import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appControlSectionInventory,
  appProductReadiness,
  appTransferMode,
  DISPERSION_CAROUSEL_AUTOMATED_TEST,
} from "../app-acceptance-data";
import { appSchema } from "../app-schema";
import {
  dispersionCarouselPipelinePasses,
  dispersionCarouselRendererPipelineRegistration,
} from "./dispersion-carousel-pipeline";
import {
  DISPERSION_CAROUSEL_CARDS,
  DISPERSION_CAROUSEL_DEFAULTS,
  DISPERSION_CAROUSEL_DEFAULT_SCROLL,
  DISPERSION_CAROUSEL_GEOMETRY,
  DISPERSION_CAROUSEL_TESTIMONIAL_STYLE,
  DISPERSION_CAROUSEL_TITLE,
  dispersionCarouselTargets,
} from "./dispersion-carousel-values";

describe("Dispersion Carousel product contract", () => {
  it(DISPERSION_CAROUSEL_AUTOMATED_TEST, () => {
    expect(appProductReadiness).toMatchObject({
      mode: "product",
      productName: "Aura Carousel",
      viewInteraction: { mode: "non-spatial" },
    });
    expect(appTransferMode).toMatchObject({
      mode: "reference-runtime-clone",
      referenceStudy: { status: "ran-original" },
      referenceTimeline: { mode: "none" },
      sourceOfTruth: "reference-runtime",
    });
    expect(DISPERSION_CAROUSEL_TITLE).toBe(
      "How focused teams turn insights into action.",
    );
    expect(DISPERSION_CAROUSEL_GEOMETRY).toEqual({
      cardGap: 16,
      cardHeight: 560,
      cardRadius: 12,
      cardWidth: 448,
      canvasHeight: 1034,
      canvasWidth: 1472,
      contentHeight: 714,
      effectPadding: 64,
      headerHeight: 106,
      headerTop: 160,
      railTop: 314,
      trackWidth: 2304,
      verticalPadding: 160,
    });
    expect(DISPERSION_CAROUSEL_CARDS).toHaveLength(5);
    expect(DISPERSION_CAROUSEL_CARDS.every((card) => card.src.endsWith("@2x.png"))).toBe(true);
    expect(DISPERSION_CAROUSEL_CARDS.map((card) => card.testimonial)).toEqual([
      "“Bringing our research into one clear view helped the team agree on priorities and decide what to build next.”",
      "“Learning why customers came back helped us improve our products and focus on the details they value most.”",
      "“A shared brief gave everyone a clear view of the goal and their role in reaching it. We made decisions sooner and kept work moving without extra meetings.”",
      "“We replaced disconnected reports with shared measures, so teams could spot problems early and make better decisions together.”",
      "“Simpler reporting freed up time to hear from customers, test new ideas, and improve the services they use daily.”",
    ]);
    expect(DISPERSION_CAROUSEL_TESTIMONIAL_STYLE).toEqual({
      fontSize: 20,
      fontWeight: 400,
      lineHeight: 26,
      padding: 24,
    });
    expect(DISPERSION_CAROUSEL_DEFAULT_SCROLL).toBe(1856);
    expect(DISPERSION_CAROUSEL_DEFAULTS).toEqual({
      amount: 85,
      aura: 0.69,
      background: "#FFFFFF",
      blur: 0,
      count: 20,
      curve: 1.15,
      edgeFade: 0.51,
      edgeWidth: 13,
      gateGlow: 0.49,
      gateRefraction: 7,
      gateOffset: 9,
      gateWidth: 147,
      hue: 0,
      includeBackground: true,
      includeText: true,
      spectrum: 0.67,
      turbulence: 0.79,
      turbulenceScale: 168,
      velocity: 0.45,
      warp: 8,
      warpFace: 133,
      warpOffset: 1,
      warpSharpness: 2.35,
      warpStyle: "stretch",
      warpWave: 3,
      warpWaveBlur: 0,
      warpWaveEnabled: true,
      warpWaveKind: "ripple",
      warpWaveLength: 336,
    });

    const acceptedTargets = new Set(
      appAcceptance.flatMap((entry) => (entry.target ? [entry.target] : [])),
    );
    expect(acceptedTargets.size).toBeGreaterThan(0);
    for (const target of Object.values(dispersionCarouselTargets)) {
      expect(acceptedTargets.has(target), `Missing acceptance for ${target}`).toBe(true);
    }
    expect(new Set(appAcceptance.map((entry) => entry.id)).size).toBe(
      appAcceptance.length,
    );

    const inventoriedTargets = new Set(
      appControlSectionInventory.flatMap((entry) => entry.targets),
    );
    for (const target of Object.values(dispersionCarouselTargets)) {
      expect(inventoriedTargets.has(target), `Missing inventory for ${target}`).toBe(true);
    }

    expect(appSchema.canvas).toMatchObject({
      enabled: true,
      renderScale: {
        defaultValue: 2,
        enabled: true,
        max: 2,
        min: 1,
        step: 0.25,
      },
      size: { height: 1034, width: 1920 },
      sizing: { mode: "editable-output" },
      upload: false,
    });
    expect(appSchema.panels.timeline).toBeUndefined();
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.persistence).toMatchObject({
      key: "toolcraft:aura-carousel:state:v8",
      version: 8,
    });
    expect(dispersionCarouselRendererPipelineRegistration.runtimeId).toBe(
      "dispersion-carousel.renderer@10",
    );
    expect(
      Object.values(dispersionCarouselPipelinePasses)
        .map((pass) => pass.id)
        .sort(),
    ).toEqual([
      "dispersion-carousel.image-export",
      "dispersion-carousel.preview",
    ]);
  });
});
