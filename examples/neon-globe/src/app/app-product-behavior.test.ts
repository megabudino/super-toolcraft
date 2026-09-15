import { describe, expect, it } from "vitest";

import { appAcceptance } from "./app-acceptance";
import { appSchema } from "./app-schema";
import { GLOBE_DEFAULTS, GLOBE_SCENE_SIZE, GLOBE_TARGETS } from "./globe-constants";
import { getBandDotMetrics } from "./globe-dot-grid";
import {
  getLogoLoopCycleDurationMs,
  getLogoLoopPositionOffset,
  getLoopingLogos,
  LOGO_LOOP_APPROACH_DURATION_MS,
  LOGO_LOOP_ORBIT_DISTANCE,
  LOGO_LOOP_ORBIT_DURATION_MS,
  LOGO_LOOP_RESET_START_OFFSET,
  LOGO_LOOP_RESET_START_PHASE_MS,
  LOGO_LOOP_STAGGER_MS,
} from "./globe-logo-animation";
import { createGlobeGeometry, getGlobeSceneRect, readGlobeSettings } from "./globe-model";
import { GLOBE_SCREEN_RADIUS_RATIO } from "./globe-renderer-settings";

function acceptanceName(id: string): string {
  const entry = appAcceptance.find((candidate) => candidate.id === id);
  if (!entry) {
    throw new Error(`Missing acceptance row ${id}`);
  }
  return entry.automatedTestName;
}

function allValues(overrides: Record<string, unknown> = {}) {
  return {
    [GLOBE_TARGETS.background]: GLOBE_DEFAULTS.background,
    [GLOBE_TARGETS.band1Position]: GLOBE_DEFAULTS.band1Position,
    [GLOBE_TARGETS.band1Width]: GLOBE_DEFAULTS.band1Width,
    [GLOBE_TARGETS.band2Position]: GLOBE_DEFAULTS.band2Position,
    [GLOBE_TARGETS.band2Width]: GLOBE_DEFAULTS.band2Width,
    [GLOBE_TARGETS.band3Position]: GLOBE_DEFAULTS.band3Position,
    [GLOBE_TARGETS.band3Width]: GLOBE_DEFAULTS.band3Width,
    [GLOBE_TARGETS.band4Position]: GLOBE_DEFAULTS.band4Position,
    [GLOBE_TARGETS.band4Width]: GLOBE_DEFAULTS.band4Width,
    [GLOBE_TARGETS.bandColumnSpacing]: GLOBE_DEFAULTS.bandColumnSpacing,
    [GLOBE_TARGETS.bandDistance]: GLOBE_DEFAULTS.bandDistance,
    [GLOBE_TARGETS.bandDotSize]: GLOBE_DEFAULTS.bandDotSize,
    [GLOBE_TARGETS.includeBackground]: GLOBE_DEFAULTS.includeBackground,
    [GLOBE_TARGETS.latitudeCount]: GLOBE_DEFAULTS.latitudeCount,
    [GLOBE_TARGETS.lineColor]: GLOBE_DEFAULTS.lineColor,
    [GLOBE_TARGETS.lineWidth]: GLOBE_DEFAULTS.lineWidth,
    [GLOBE_TARGETS.logoDxcFinalPosition]: GLOBE_DEFAULTS.logoDxcFinalPosition,
    [GLOBE_TARGETS.logoHoldSeconds]: GLOBE_DEFAULTS.logoHoldSeconds,
    [GLOBE_TARGETS.logoMetaFinalPosition]: GLOBE_DEFAULTS.logoMetaFinalPosition,
    [GLOBE_TARGETS.logoPradaFinalPosition]: GLOBE_DEFAULTS.logoPradaFinalPosition,
    [GLOBE_TARGETS.logoZillowFinalPosition]: GLOBE_DEFAULTS.logoZillowFinalPosition,
    [GLOBE_TARGETS.meridianCount]: GLOBE_DEFAULTS.meridianCount,
    [GLOBE_TARGETS.orientation]: GLOBE_DEFAULTS.orientation,
    [GLOBE_TARGETS.outline]: GLOBE_DEFAULTS.outline,
    [GLOBE_TARGETS.sphereColor]: GLOBE_DEFAULTS.sphereColor,
    ...overrides,
  };
}

function findControl(target: string) {
  for (const section of appSchema.panels.controls?.sections ?? []) {
    for (const control of Object.values(section.controls)) {
      if (control.target === target) return control;
    }
  }
  throw new Error(`Missing control ${target}`);
}

describe("landing globe product behavior", () => {
  it(acceptanceName("background.include"), () => {
    expect(findControl(GLOBE_TARGETS.includeBackground)).toMatchObject({
      defaultValue: true,
      type: "switch",
    });
    expect(readGlobeSettings(allValues({ [GLOBE_TARGETS.includeBackground]: false })).includeBackground).toBe(false);
  });

  it(acceptanceName("background.color"), () => {
    expect(readGlobeSettings(allValues({ [GLOBE_TARGETS.background]: "#111111" })).background).toBe("#111111");
  });

  it(acceptanceName("globe.sphere-color"), () => {
    expect(readGlobeSettings(allValues({ [GLOBE_TARGETS.sphereColor]: "#222222" })).sphereColor).toBe("#222222");
  });

  it(acceptanceName("globe.line-color"), () => {
    expect(readGlobeSettings(allValues({ [GLOBE_TARGETS.lineColor]: "#EEEEEE" })).lineColor).toBe("#EEEEEE");
  });

  it(acceptanceName("globe.latitude-count"), () => {
    const geometry = createGlobeGeometry(readGlobeSettings(allValues({ [GLOBE_TARGETS.latitudeCount]: 13 })));
    expect(geometry.latitudes).toHaveLength(13);
    expect(geometry.meridians).toHaveLength(GLOBE_DEFAULTS.meridianCount);
  });

  it(acceptanceName("globe.meridian-count"), () => {
    const geometry = createGlobeGeometry(readGlobeSettings(allValues({ [GLOBE_TARGETS.meridianCount]: 24 })));
    expect(geometry.latitudes).toHaveLength(GLOBE_DEFAULTS.latitudeCount);
    expect(geometry.meridians).toHaveLength(24);
  });

  it(acceptanceName("globe.line-width"), () => {
    const settings = readGlobeSettings(allValues({ [GLOBE_TARGETS.lineWidth]: 6.25 }));
    expect(settings.lineWidth).toBe(6.25);
  });

  it(acceptanceName("globe.outline"), () => {
    expect(findControl(GLOBE_TARGETS.outline)).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.outline,
      target: GLOBE_TARGETS.outline,
      type: "switch",
    });
    expect(readGlobeSettings(allValues({ [GLOBE_TARGETS.outline]: true })).outline).toBe(true);
  });

  it(acceptanceName("bands.distance"), () => {
    expect(findControl(GLOBE_TARGETS.bandDistance)).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.bandDistance,
      target: GLOBE_TARGETS.bandDistance,
      type: "slider",
      unit: "%",
    });
    expect(readGlobeSettings(allValues({ [GLOBE_TARGETS.bandDistance]: 18 })).bandDistance).toBe(18);
  });

  it(acceptanceName("bands.dot-size"), () => {
    expect(findControl(GLOBE_TARGETS.bandDotSize)).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.bandDotSize,
      target: GLOBE_TARGETS.bandDotSize,
      type: "slider",
      unit: "px",
    });
    expect(readGlobeSettings(allValues({ [GLOBE_TARGETS.bandDotSize]: 2.25 })).bandDotSize).toBe(2.25);

    const designRadius = GLOBE_SCENE_SIZE.height * GLOBE_SCREEN_RADIUS_RATIO;
    const narrowRows = getBandDotMetrics({
      bandHeight: 0.08,
      columnSpacing: GLOBE_DEFAULTS.bandColumnSpacing,
      dotSize: GLOBE_DEFAULTS.bandDotSize,
      outerRadius: 1.04,
      radius: designRadius,
    }).rowCount;
    const wideRows = getBandDotMetrics({
      bandHeight: 0.2,
      columnSpacing: GLOBE_DEFAULTS.bandColumnSpacing,
      dotSize: GLOBE_DEFAULTS.bandDotSize,
      outerRadius: 1.04,
      radius: designRadius,
    }).rowCount;
    const smallerDotRows = getBandDotMetrics({
      bandHeight: 0.14,
      columnSpacing: GLOBE_DEFAULTS.bandColumnSpacing,
      dotSize: 2,
      outerRadius: 1.04,
      radius: designRadius,
    }).rowCount;
    const largerDotRows = getBandDotMetrics({
      bandHeight: 0.14,
      columnSpacing: GLOBE_DEFAULTS.bandColumnSpacing,
      dotSize: 5,
      outerRadius: 1.04,
      radius: designRadius,
    }).rowCount;

    expect(wideRows).toBeGreaterThan(narrowRows);
    expect(smallerDotRows).toBeGreaterThan(largerDotRows);
  });

  it(acceptanceName("bands.column-spacing"), () => {
    expect(findControl(GLOBE_TARGETS.bandColumnSpacing)).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.bandColumnSpacing,
      target: GLOBE_TARGETS.bandColumnSpacing,
      type: "slider",
      unit: "px",
    });
    expect(
      readGlobeSettings(allValues({ [GLOBE_TARGETS.bandColumnSpacing]: 8.5 }))
        .bandColumnSpacing,
    ).toBe(8.5);

    const designRadius = GLOBE_SCENE_SIZE.height * GLOBE_SCREEN_RADIUS_RATIO;
    const denseColumns = getBandDotMetrics({
      bandHeight: 0.14,
      columnSpacing: 4,
      dotSize: GLOBE_DEFAULTS.bandDotSize,
      outerRadius: 1.04,
      radius: designRadius,
    }).columnCount;
    const looseColumns = getBandDotMetrics({
      bandHeight: 0.14,
      columnSpacing: 12,
      dotSize: GLOBE_DEFAULTS.bandDotSize,
      outerRadius: 1.04,
      radius: designRadius,
    }).columnCount;

    expect(denseColumns).toBeGreaterThan(looseColumns);
  });

  it(acceptanceName("bands.band1.position"), () => {
    const settings = readGlobeSettings(allValues({ [GLOBE_TARGETS.band1Position]: 40 }));
    expect(settings.bands[0]).toMatchObject({ id: 1, position: 40 });
  });

  it(acceptanceName("bands.band1.width"), () => {
    const settings = readGlobeSettings(allValues({ [GLOBE_TARGETS.band1Width]: 60 }));
    expect(settings.bands[0]).toMatchObject({ id: 1, width: 60 });
  });

  it(acceptanceName("bands.band2.position"), () => {
    const settings = readGlobeSettings(allValues({ [GLOBE_TARGETS.band2Position]: 12 }));
    expect(settings.bands[1]).toMatchObject({ id: 2, position: 12 });
  });

  it(acceptanceName("bands.band2.width"), () => {
    const settings = readGlobeSettings(allValues({ [GLOBE_TARGETS.band2Width]: 60 }));
    expect(settings.bands[1]).toMatchObject({ id: 2, width: 60 });
  });

  it(acceptanceName("bands.band3.position"), () => {
    const settings = readGlobeSettings(allValues({ [GLOBE_TARGETS.band3Position]: -8 }));
    expect(settings.bands[2]).toMatchObject({ id: 3, position: -8 });
  });

  it(acceptanceName("bands.band3.width"), () => {
    const settings = readGlobeSettings(allValues({ [GLOBE_TARGETS.band3Width]: 60 }));
    expect(settings.bands[2]).toMatchObject({ id: 3, width: 60 });
  });

  it(acceptanceName("bands.band4.position"), () => {
    const settings = readGlobeSettings(allValues({ [GLOBE_TARGETS.band4Position]: -34 }));
    expect(settings.bands[3]).toMatchObject({ id: 4, position: -34 });
  });

  it(acceptanceName("bands.band4.width"), () => {
    const settings = readGlobeSettings(allValues({ [GLOBE_TARGETS.band4Width]: 60 }));
    expect(settings.bands[3]).toMatchObject({ id: 4, width: 60 });
  });

  const logoControlCases = [
    {
      id: "logos.dxc.final-position",
      logoId: "dxc",
      target: GLOBE_TARGETS.logoDxcFinalPosition,
      value: 30,
    },
    {
      id: "logos.meta.final-position",
      logoId: "meta",
      target: GLOBE_TARGETS.logoMetaFinalPosition,
      value: 42,
    },
    {
      id: "logos.prada.final-position",
      logoId: "prada",
      target: GLOBE_TARGETS.logoPradaFinalPosition,
      value: 68,
    },
    {
      id: "logos.zillow.final-position",
      logoId: "zillow",
      target: GLOBE_TARGETS.logoZillowFinalPosition,
      value: 74,
    },
  ] as const;

  for (const { id, logoId, target, value } of logoControlCases) {
    it(acceptanceName(id), () => {
      expect(findControl(target)).toMatchObject({
        target,
        type: "slider",
        unit: "%",
      });
      const settings = readGlobeSettings(allValues({ [target]: value }));
      expect(settings.logos.find((logo) => logo.logoId === logoId)).toMatchObject({
        logoId,
        position: value,
      });
    });
  }

  it(acceptanceName("logos.intro.run"), () => {
    expect(findControl(GLOBE_TARGETS.logoIntroRun)).toMatchObject({
      actions: [
        {
          icon: "rotate-ccw",
          label: "Run logos",
          value: GLOBE_TARGETS.logoIntroRun,
        },
      ],
      description:
        "Restarts the staggered reference-paced logo orbit cycle.",
      label: "Loop",
      target: GLOBE_TARGETS.logoIntroRun,
      type: "actions",
    });
    expect([
      LOGO_LOOP_ORBIT_DURATION_MS,
      LOGO_LOOP_APPROACH_DURATION_MS,
      LOGO_LOOP_STAGGER_MS,
    ]).toEqual([2520, 760, 840]);

    const settings = readGlobeSettings(allValues());
    const initialLogos = getLoopingLogos(settings.logos, 0, settings.logoHoldSeconds);
    const earlyLogos = getLoopingLogos(
      settings.logos,
      LOGO_LOOP_STAGGER_MS / 2,
      settings.logoHoldSeconds,
    );
    const afterTopArrivalLogos = getLoopingLogos(
      settings.logos,
      LOGO_LOOP_APPROACH_DURATION_MS + 100,
      settings.logoHoldSeconds,
    );
    const settledLogos = getLoopingLogos(
      settings.logos,
      LOGO_LOOP_APPROACH_DURATION_MS +
        (settings.logos.length - 1) * LOGO_LOOP_STAGGER_MS +
        10,
      settings.logoHoldSeconds,
    );
    const resetStartOffset = LOGO_LOOP_ORBIT_DISTANCE - LOGO_LOOP_RESET_START_OFFSET;

    expect(initialLogos[0].position).toBeCloseTo(
      settings.logos[0].position + resetStartOffset,
    );
    expect(earlyLogos[0].position).toBeGreaterThan(
      settings.logos[0].position + resetStartOffset,
    );
    expect(earlyLogos[0].position).toBeLessThan(
      settings.logos[0].position + LOGO_LOOP_ORBIT_DISTANCE,
    );
    expect(initialLogos.some((logo, index) =>
      logo.position === settings.logos[index].position)).toBe(true);
    expect(afterTopArrivalLogos[0].position).toBe(settings.logos[0].position);
    expect(afterTopArrivalLogos[1].position).not.toBe(settings.logos[1].position);
    expect(settledLogos.map((logo) => logo.position)).toEqual(
      settings.logos.map((logo) => logo.position),
    );
    expect(
      LOGO_LOOP_STAGGER_MS * (settings.logos.length - 1),
    ).toBeGreaterThanOrEqual(LOGO_LOOP_ORBIT_DURATION_MS);

    const probeIntervalMs = 16;
    const beforeResetPoint = getLogoLoopPositionOffset(
      LOGO_LOOP_RESET_START_PHASE_MS - probeIntervalMs,
    );
    const atResetPoint = getLogoLoopPositionOffset(LOGO_LOOP_RESET_START_PHASE_MS);
    const afterResetPoint = getLogoLoopPositionOffset(
      LOGO_LOOP_RESET_START_PHASE_MS + probeIntervalMs,
    );
    const speedBeforeResetPoint = atResetPoint - beforeResetPoint;
    const speedAfterResetPoint = afterResetPoint - atResetPoint;

    expect(speedBeforeResetPoint).toBeGreaterThan(0);
    expect(speedAfterResetPoint).toBeGreaterThan(0);
    expect(Math.abs(speedAfterResetPoint - speedBeforeResetPoint)).toBeLessThan(0.25);
    const midPathSpeed =
      getLogoLoopPositionOffset(LOGO_LOOP_ORBIT_DURATION_MS / 2 + probeIntervalMs) -
      getLogoLoopPositionOffset(LOGO_LOOP_ORBIT_DURATION_MS / 2);
    const finalApproachSpeed =
      getLogoLoopPositionOffset(LOGO_LOOP_ORBIT_DURATION_MS - probeIntervalMs) -
      getLogoLoopPositionOffset(LOGO_LOOP_ORBIT_DURATION_MS - probeIntervalMs * 2);
    expect(finalApproachSpeed).toBeGreaterThan(0.009);
    expect(midPathSpeed).toBeGreaterThan(finalApproachSpeed * 12);

    const cycleDurationMs = getLogoLoopCycleDurationMs(settings.logoHoldSeconds);
    for (
      let elapsedMs = 0;
      elapsedMs <= cycleDurationMs + LOGO_LOOP_STAGGER_MS;
      elapsedMs += 100
    ) {
      const logos = getLoopingLogos(settings.logos, elapsedMs, settings.logoHoldSeconds);
      expect(
        logos.some((logo, index) =>
          logo.position === settings.logos[index].position,
        ),
      ).toBe(true);
    }
  });

  it(acceptanceName("logos.hold-seconds"), () => {
    expect(findControl(GLOBE_TARGETS.logoHoldSeconds)).toMatchObject({
      defaultValue: GLOBE_DEFAULTS.logoHoldSeconds,
      label: "Hold",
      target: GLOBE_TARGETS.logoHoldSeconds,
      type: "slider",
      unit: "s",
    });
    expect(
      readGlobeSettings(allValues({ [GLOBE_TARGETS.logoHoldSeconds]: 2.5 }))
        .logoHoldSeconds,
    ).toBe(2.5);

    const settings = readGlobeSettings(allValues());
    const heldLogos = getLoopingLogos(
      settings.logos,
      LOGO_LOOP_APPROACH_DURATION_MS + 100,
      4,
    );
    const departingLogos = getLoopingLogos(
      settings.logos,
      LOGO_LOOP_APPROACH_DURATION_MS + 350,
      0.25,
    );

    expect(getLogoLoopCycleDurationMs(4)).toBeGreaterThan(
      getLogoLoopCycleDurationMs(0.25),
    );
    expect(heldLogos[0].position).toBe(settings.logos[0].position);
    expect(departingLogos[0].position).toBeGreaterThan(settings.logos[0].position);
  });

  it(acceptanceName("globe.orientation"), () => {
    expect(findControl(GLOBE_TARGETS.orientation)).toMatchObject({
      keyframeable: false,
      label: false,
      type: "orientationGizmo",
    });
    expect(readGlobeSettings(allValues()).orientation.position).toEqual([2.2, 1.5, 5]);
  });

  it(acceptanceName("export.image.format"), () => {
    expect(findControl("export.image.format")).toMatchObject({
      defaultValue: "png",
      options: [
        { label: "PNG", value: "png" },
        { label: "JPG", value: "jpg" },
      ],
      type: "select",
    });
  });

  it(acceptanceName("export.image.resolution"), () => {
    expect(findControl("export.image.resolution")).toMatchObject({
      defaultValue: "4k",
      options: [
        { label: "2K", value: "2k" },
        { label: "4K", value: "4k" },
        { label: "8K", value: "8k" },
      ],
      type: "select",
    });
  });

  it(acceptanceName("export.image"), () => {
    const footer = findControl("actions.output");
    expect(footer.actions).toEqual([
      {
        icon: "upload-simple",
        label: "Export PNG",
        role: "export-image",
        value: "export.png",
      },
    ]);
  });

  it(acceptanceName("runtime.infinity-canvas"), () => {
    expect(appSchema.assembly.capabilities).toContain("canvas.infinity");
    const rect = getGlobeSceneRect();
    expect(rect).toMatchObject(GLOBE_SCENE_SIZE);
    expect(rect.x + rect.width / 2).toBe(0);
    expect(rect.y + rect.height / 2).toBe(0);
  });

  it(acceptanceName("runtime.infinity-scene-export"), () => {
    expect(appSchema.assembly.capabilities).toContain("canvas.infinity");
  });

  it(acceptanceName("runtime.render-scale"), () => {
    expect(appSchema.canvas.renderScale.enabled).toBe(true);
    expect(appSchema.canvas.renderScale.defaultValue).toBe(2);
  });

  it(acceptanceName("persistence.reload"), () => {
    expect(appSchema.persistence).toMatchObject({
      include: ["canvas", "panels", "values"],
      storage: "localStorage",
    });
  });
});
