import { describe, expect, it } from "vitest";

import { appControlSectionInventory } from "./app-acceptance-data";
import { appSchema } from "./app-schema";
import { GLOBE_BAND_ROWS } from "./globe-band-order";
import { GLOBE_DEFAULTS, GLOBE_TARGETS } from "./globe-constants";
import { getLogoLoopCycleDurationMs, getLogoLoopTiming, getLoopingLogos } from "./globe-logo-animation";
import { readGlobeSettings } from "./globe-model";

const rows = [
  { bandId: 1, logoId: "dxc", label: "easyJet", position: 69, width: 17, scale: 114, stop: 60 },
  { bandId: 4, logoId: "zillow", label: "Ubisoft", position: 46, width: 24, scale: 108, stop: 68 },
  { bandId: 2, logoId: "meta", label: "Novo Nordisk", position: 6, width: 50, scale: 121, stop: 71 },
  { bandId: 3, logoId: "prada", label: "Prada", position: -30, width: 16, scale: 100, stop: 76 },
] as const;

function sectionControls(id: string) {
  const section = appSchema.panels.controls?.sections.find((candidate) => candidate.id === id);
  expect(section).toBeDefined();
  return Object.values(section!.controls);
}

describe("reordered globe bands", () => {
  it("uses the confirmed top-to-bottom order throughout the sidebar", () => {
    expect(GLOBE_BAND_ROWS.map(({ bandId, logoId, label }) => ({ bandId, logoId, label })))
      .toEqual(rows.map(({ bandId, logoId, label }) => ({ bandId, logoId, label })));
    const layout = sectionControls("band-layout");
    expect(layout.map(({ target }) => target)).toEqual(rows.flatMap(({ bandId }) => [
      `bands.band${bandId}.position`, `bands.band${bandId}.width`,
    ]));
    expect(layout.map(({ label }) => label)).toEqual(rows.flatMap((_, index) => [
      `Band ${index + 1} position`, `Band ${index + 1} width`,
    ]));
    for (const id of ["logos", "logo-scale"]) {
      const logoControls = sectionControls(id).filter(({ target }) =>
        target.endsWith(".finalPosition") || target.endsWith(".scale"));
      expect(logoControls.map(({ label }) => label)).toEqual(rows.map(({ label }) => label));
      expect(logoControls.map(({ target }) => target)).toEqual(rows.map(({ logoId }) =>
        `logos.${logoId}.${id === "logos" ? "finalPosition" : "scale"}`));
    }
    for (const id of ["band-layout", "logos", "logo-scale"]) {
      expect(appControlSectionInventory.find((section) => section.id === id)?.targets)
        .toEqual(sectionControls(id).map(({ target }) => target));
    }
  });

  it("matches the screenshot geometry without exchanging logo identities", () => {
    const settings = readGlobeSettings({});
    for (const row of rows) {
      expect(settings.bands.find(({ id }) => id === row.bandId))
        .toEqual({ id: row.bandId, position: row.position, width: row.width });
      expect(settings.logos.find(({ bandId }) => bandId === row.bandId)?.logoId).toBe(row.logoId);
    }
  });

  it("keeps saved positions widths scales and stops on the same legacy targets", () => {
    const saved = Object.fromEntries(rows.flatMap((row) => [
      [`bands.band${row.bandId}.position`, row.position],
      [`bands.band${row.bandId}.width`, row.width],
      [`logos.${row.logoId}.scale`, row.scale],
      [`logos.${row.logoId}.finalPosition`, row.stop],
    ]));
    const settings = readGlobeSettings(saved);
    for (const row of rows) {
      expect(settings.logos.find(({ logoId }) => logoId === row.logoId))
        .toEqual({ bandId: row.bandId, logoId: row.logoId, position: row.stop, scale: row.scale });
    }
    const changed = readGlobeSettings({ ...saved, [GLOBE_TARGETS.band4Width]: 30 });
    expect(changed.logos).toEqual(settings.logos);
    expect(changed.bands).toEqual(settings.bands.map((band) =>
      band.id === 4 ? { ...band, width: 30 } : band));
  });

  it.each([0.5, 1.25, 2.5])("arrives and departs in row order at speed %s", (speed) => {
    const settings = readGlobeSettings({});
    const timing = getLogoLoopTiming(speed);
    const hold = 3;
    for (const [rank, row] of rows.entries()) {
      const finalLogo = settings.logos.find(({ logoId }) => logoId === row.logoId)!;
      const arrival = timing.approachDurationMs + rank * timing.staggerMs;
      const positionAt = (elapsed: number) => getLoopingLogos(settings.logos, elapsed, hold, speed)
        .find(({ logoId }) => logoId === row.logoId)!.position;
      expect(positionAt(arrival - 100)).not.toBe(finalLogo.position);
      expect(positionAt(arrival + 1)).toBe(finalLogo.position);
      expect(positionAt(arrival + hold * 1000 - 1)).toBe(finalLogo.position);
      expect(positionAt(arrival + hold * 1000 + 100)).toBeGreaterThan(finalLogo.position);
      expect(positionAt(arrival + getLogoLoopCycleDurationMs(hold, speed) + 1)).toBe(finalLogo.position);
    }
    expect(timing.staggerMs).toBe(840 / speed);
    expect(timing.orbitDurationMs).toBe(2520 / speed);
    expect(timing.approachDurationMs).toBe(760 / speed);
    expect(GLOBE_DEFAULTS.logoHoldSeconds).toBe(hold);
  });

  it("uses stable band identity for delays even if the logo array is shuffled", () => {
    const settings = readGlobeSettings({});
    const original = getLoopingLogos(settings.logos, 700, 4, 1.25);
    const reversed = getLoopingLogos([...settings.logos].reverse(), 700, 4, 1.25);
    expect(reversed).toEqual([...original].reverse());
    expect(settings.logos.map(({ position }) => position)).toEqual([60, 71, 76, 68]);
  });
});
