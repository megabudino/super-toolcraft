import { expect, it } from "vitest";

import { appSchema } from "./app-schema";
import { GLOBE_DEFAULTS, GLOBE_TARGETS } from "./globe-constants";

it("uses the requested default visual preset", () => {
  expect(GLOBE_DEFAULTS).toMatchObject({
    background: "#000000",
    band1Position: 69,
    band1Width: 17,
    band2Position: 6,
    band2Width: 50,
    band3Position: -30,
    band3Width: 16,
    band4Position: 46,
    band4Width: 24,
    bandColumnSpacing: 3.5,
    bandDistance: 1,
    bandDotSize: 1.25,
    crtIntensity: 100,
    includeBackground: true,
    latitudeCount: 8,
    lineColor: "#FFFFFF",
    lineWidth: 1.5,
    logoDxcFinalPosition: 60,
    logoHoldSeconds: 3,
    logoMetaFinalPosition: 71,
    logoPradaFinalPosition: 76,
    logoSpeed: 2.5,
    logoZillowFinalPosition: 68,
    meridianCount: 16,
    outline: true,
    sphereColor: "#000000",
  });
  const controls = appSchema.panels.controls?.sections.flatMap((section) => Object.values(section.controls)) ?? [];
  for (const [key, value] of Object.entries(GLOBE_DEFAULTS)) {
    const target = GLOBE_TARGETS[key as keyof typeof GLOBE_DEFAULTS];
    expect(controls.find((control) => control.target === target)?.defaultValue).toEqual(value);
  }
  expect(appSchema.canvas.renderScale.defaultValue).toBe(2);
  expect(appSchema.canvas.size).toEqual({ width: 1920, height: 1080, unit: "px" });
  expect(controls.filter((control) => control.target.startsWith("logos.") && control.target.endsWith(".scale"))
    .map((control) => control.defaultValue)).toEqual([100, 100, 100, 100]);
});
