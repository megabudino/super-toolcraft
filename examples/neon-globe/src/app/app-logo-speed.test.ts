import { describe, expect, it } from "vitest";

import { appAcceptance } from "./app-acceptance";
import { appSchema } from "./app-schema";
import { GLOBE_DEFAULTS, GLOBE_TARGETS } from "./globe-constants";
import {
  getLogoLoopCycleDurationMs,
  getLogoLoopTiming,
  getLoopingLogos,
  LOGO_LOOP_ORBIT_DURATION_MS,
  LOGO_LOOP_STAGGER_MS,
} from "./globe-logo-animation";
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

describe("landing globe logo speed", () => {
  it(acceptanceName("logos.speed"), () => {
    expect(findControl(GLOBE_TARGETS.logoSpeed)).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.logoSpeed,
      label: "Speed",
      max: 2.5,
      min: 0.5,
      target: GLOBE_TARGETS.logoSpeed,
      type: "slider",
    });
    expect(readGlobeSettings({ [GLOBE_TARGETS.logoSpeed]: 1.6 }).logoSpeed).toBe(1.6);

    const referenceTiming = getLogoLoopTiming(1);
    const fasterTiming = getLogoLoopTiming(2);

    expect(referenceTiming.orbitDurationMs).toBe(LOGO_LOOP_ORBIT_DURATION_MS);
    expect(fasterTiming.orbitDurationMs).toBe(LOGO_LOOP_ORBIT_DURATION_MS / 2);
    expect(fasterTiming.staggerMs).toBe(LOGO_LOOP_STAGGER_MS / 2);
    expect(getLogoLoopCycleDurationMs(4, 2)).toBe(
      LOGO_LOOP_ORBIT_DURATION_MS / 2 + 4000,
    );

    const logo = [{ bandId: 1, logoId: "dxc", position: 60, scale: 100 }] as const;
    const referenceLogo = getLoopingLogos(logo, 100, 0, 1)[0];
    const fasterLogo = getLoopingLogos(logo, 100, 0, 2)[0];

    expect(GLOBE_DEFAULTS.logoSpeed).toBeGreaterThan(1);
    expect(fasterLogo.position).toBeGreaterThan(referenceLogo.position);
  });
});
