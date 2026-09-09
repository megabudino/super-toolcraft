import { describe, expect, it } from "vitest";

import { validateProductAcceptanceCoverage } from "./app-acceptance";
import { appSchema } from "./app-schema";
import { FINE_DETAILS_PROMPT_DEFAULTS } from "./fine-details-prompt-values";
import { FINE_DETAILS_TRAIL_DEFAULTS } from "./fine-details-trail-values";
import { FINE_DETAILS_TYPOGRAPHY_DEFAULTS } from "./fine-details-typography-values";

describe("Fine Details canonical defaults", () => {
  it("matches the approved settings export", () => {
    expect(FINE_DETAILS_TRAIL_DEFAULTS).toMatchObject({
      border: { color: "#FFFFFF", enabled: true, width: 2 },
      cardRadius: 14,
      cardSize: 180,
      enabled: true,
      fadeIn: 150,
      fadeOut: 200,
      length: 8,
      lifetime: 600,
      resumeDelay: 300,
      resumeRamp: 500,
      shadow: {
        blur: 40,
        colorOpacity: { hex: "#000000", opacity: 35 },
        enabled: true,
        offset: { x: 0, y: 0.125 },
        spread: 0,
      },
      sizeFalloff: 8,
      smoothness: 200,
      spacing: 64,
      tilt: 8,
    });
    expect(FINE_DETAILS_TYPOGRAPHY_DEFAULTS).toEqual({
      lowerRight: {
        bodyFontSize: 24,
        bottom: 96,
        gap: 8,
        headingFontSize: 88,
        right: 96,
      },
      upperLeft: { fontSize: 120, left: 96, top: 96 },
    });
    expect(FINE_DETAILS_PROMPT_DEFAULTS).toEqual({
      position: { x: 0, y: -0.06 },
      shadow: {
        blur: 33,
        colorOpacity: { hex: "#000000", opacity: 35 },
        enabled: true,
        offset: { x: 0, y: 0.48 },
        spread: 5,
      },
      typing: {
        deleteSpeed: 30,
        deleteStyle: "backspace",
        enabled: false,
        gap: 0.6,
        hold: 1.8,
        humanize: 0.6,
        phrases: [
          "Create a surreal fashion campaign set in a blooming desert.",
          "Design a playful 3D mascot for a futuristic coffee brand.",
          "Generate a cinematic portrait lit by neon signs at night.",
          "Illustrate a cozy glass house hidden deep in the forest.",
          "Create a bold poster for an experimental music festival.",
          "Design a minimal perfume bottle inspired by ocean waves.",
        ],
        typeSpeed: 12,
      },
    });
  });

  it("registers the ordered Dia image set as resettable media defaults", () => {
    expect(appSchema.media.defaultAssets).toHaveLength(50);
    expect(
      appSchema.media.defaultAssets.map((asset) => ({
        id: asset.id,
        sourceTarget: asset.sourceTarget,
      })),
    ).toEqual(
      Array.from({ length: 50 }, (_, index) => ({
        id: `fine-details-default-${String(index + 1).padStart(2, "0")}`,
        sourceTarget: "trail.images",
      })),
    );

    expect(
      validateProductAcceptanceCoverage().filter((error) =>
        error.includes("predefined media.defaultAssets"),
      ),
    ).toEqual([]);
  });
});
