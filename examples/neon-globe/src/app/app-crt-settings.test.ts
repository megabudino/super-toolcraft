import { describe, expect, it } from "vitest";

import { appAcceptance } from "./app-acceptance";
import { appSchema } from "./app-schema";
import { GLOBE_DEFAULTS, GLOBE_TARGETS } from "./globe-constants";
import { readGlobeSettings } from "./globe-model";

function acceptanceName(id: string): string {
  const entry = appAcceptance.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing acceptance row ${id}`);
  return entry.automatedTestName;
}

function findControl(target: string) {
  for (const section of appSchema.panels.controls?.sections ?? []) {
    for (const control of Object.values(section.controls)) {
      if (control.target === target) return control;
    }
  }
  throw new Error(`Missing control ${target}`);
}

describe("landing globe CRT settings", () => {
  it(acceptanceName("effects.crt-intensity"), () => {
    expect(findControl(GLOBE_TARGETS.crtIntensity)).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.crtIntensity,
      label: "Intensity",
      max: 100,
      min: 0,
      target: GLOBE_TARGETS.crtIntensity,
      type: "slider",
      unit: "%",
    });
    expect(
      readGlobeSettings({ [GLOBE_TARGETS.crtIntensity]: 82 }).crtIntensity,
    ).toBe(82);
    expect(
      readGlobeSettings({ [GLOBE_TARGETS.crtIntensity]: -10 }).crtIntensity,
    ).toBe(0);
    expect(
      readGlobeSettings({ [GLOBE_TARGETS.crtIntensity]: 140 }).crtIntensity,
    ).toBe(100);
  });
});
