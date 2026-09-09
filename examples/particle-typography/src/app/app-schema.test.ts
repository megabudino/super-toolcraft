import { describe, expect, it } from "vitest";

import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import {
  createDotColorThemePaletteValue,
  DOT_COLOR_THEME_SPECTRUM,
  DOT_COLOR_THEMES,
} from "./dots/dots-theme";

describe("appSchema", () => {
  it("publishes the Dot Formation Toolcraft product contract", () => {
    expect(appSchema.canvas.draggable).toBe(true);
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({
      defaultMode: "infinite",
      mode: "editable-output",
    });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.canvas.size).toMatchObject({ height: 1350, width: 1080 });
    expect(appSchema.canvas.renderScale).toMatchObject({
      defaultValue: 2,
      enabled: true,
      max: 2,
      min: 1,
      step: 0.25,
    });
    expect(appSchema.panels.controls?.sections[0]?.title).toBe("Setup");
    expect(appSchema.panels.controls?.sections[0]?.controls.settingsTransfer).toMatchObject({
      target: "runtime.settingsTransfer",
      type: "settingsTransfer",
    });
    expect(appSchema.panels.controls?.sections[0]?.controls.canvasAspectRatio).toMatchObject({
      target: "canvas.aspectRatio",
      type: "aspectRatio",
    });
    expect(
      Object.values(appSchema.panels.controls?.sections[0]?.controls ?? {}).find(
        (control) => control.target === "panels.timeline.extended",
      ),
    ).toMatchObject({
      target: "panels.timeline.extended",
      type: "switch",
    });
    expect(
      Object.values(appSchema.panels.controls?.sections[0]?.controls ?? {}).find(
        (control) => control.target === "canvas.infinity",
      ),
    ).toMatchObject({
      defaultValue: true,
      label: "Infinity canvas",
      target: "canvas.infinity",
      type: "switch",
    });
    expect(appSchema.panels.controls?.sections[0]?.layoutGroups).toContainEqual({
      columns: 2,
      controls: ["includeBackground", "infinityCanvas"],
      layout: "inline",
    });
    expect(appSchema.panels.controls?.sections[0]?.controls.background).toMatchObject({
      label: "Background color",
      target: "appearance.background",
      type: "color",
    });
    expect(
      Object.keys(appSchema.panels.controls?.sections[0]?.controls ?? {}).at(-1),
    ).toBe("timelineExtended");
    expect(appSchema.panels.layers).toBeUndefined();
    expect(appSchema.panels.timeline).toMatchObject({
      defaultDurationSeconds: 10,
      enabled: true,
      mode: "playback",
    });
    expect(appSchema.toolbar).toEqual({
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    });
  });

  it("groups the product controls by semantic entity", () => {
    const titles = appSchema.panels.controls?.sections.map((section) => section.title) ?? [];
    expect(titles).toEqual([
      "Setup",
      "Text Shape",
      "Typography",
      "Particles",
      "Timing",
      "Physics",
      "Color Theme",
      "Particle palette",
      "Dot Look",
      "Image Export",
      "Video Export",
      "Export",
    ]);
    expect(appSchema.panels.controls?.sections.find((section) => section.title === "Text Shape")?.controls.content).toMatchObject({
      defaultValue: "Hi!",
      target: "text.content",
      type: "text",
    });
    expect(appSchema.panels.controls?.sections.find((section) => section.title === "Particles")?.controls.count).toMatchObject({
      defaultValue: 1800,
      max: 2400,
      target: "particles.count",
      type: "slider",
    });
    expect(appSchema.panels.controls?.sections.find((section) => section.title === "Particles")?.controls.distribution).toMatchObject({
      defaultValue: "outline",
      target: "particles.distribution",
      type: "segmented",
    });
    expect(appSchema.panels.controls?.sections.find((section) => section.title === "Particles")?.controls.edgeSpill).toMatchObject({
      defaultValue: 23,
      max: 100,
      min: 0,
      sliderValueKind: "continuous",
      target: "particles.edgeSpill",
      type: "slider",
      unit: "%",
    });
    expect(appSchema.panels.controls?.sections.find((section) => section.title === "Timing")?.controls).toMatchObject({
      activeDuration: {
        defaultValue: 4,
        max: 12,
        min: 1,
        sliderValueKind: "continuous",
        target: "motion.activeDuration",
        type: "slider",
        unit: "s",
      },
      calmDuration: {
        defaultValue: 1,
        max: 6,
        min: 0.25,
        sliderValueKind: "continuous",
        target: "motion.calmDuration",
        type: "slider",
        unit: "s",
      },
    });
    expect(appSchema.panels.controls?.sections.find((section) => section.title === "Physics")?.controls.turbulence).toMatchObject({
      defaultValue: 0.34,
      target: "physics.turbulence",
      type: "slider",
    });
    expect(appSchema.panels.controls?.sections.find((section) => section.title === "Dot Look")?.controls.glow).toMatchObject({
      defaultValue: 0,
      target: "appearance.glow",
      type: "slider",
    });
  });

  it("starts with the warm reference background and particle palette", () => {
    const controls =
      appSchema.panels.controls?.sections.flatMap((section) =>
        Object.values(section.controls),
      ) ?? [];
    const palette = controls.find(
      (control) => control.target === "appearance.palette",
    );
    const background = controls.find(
      (control) => control.target === "appearance.background",
    );

    expect(background).toMatchObject({
      defaultValue: "#CFBCB0",
      type: "color",
    });
    expect(palette).toMatchObject({
      defaultValue: {
        angle: 12,
        gradientType: "angular",
        stops: [
          { color: "#FF4F22", position: "0%" },
          { color: "#FF8A1E", position: "10%" },
          { color: "#F1F20D", position: "20%" },
          { color: "#5C771A", position: "30%" },
          { color: "#0B5A86", position: "40%" },
          { color: "#8DB5C8", position: "50%" },
          { color: "#887CE8", position: "60%" },
          { color: "#F3A0C3", position: "70%" },
          { color: "#B28F73", position: "80%" },
          { color: "#D7D9D3", position: "90%" },
          { color: "#FF4F22", position: "100%" },
        ],
      },
      type: "gradient",
    });
  });

  it("exposes six coordinated color themes with the current look first", () => {
    const controls =
      appSchema.panels.controls?.sections.flatMap((section) =>
        Object.values(section.controls),
      ) ?? [];
    const themeControl = controls.find(
      (control) => control.target === "actions.colorTheme",
    );

    expect(DOT_COLOR_THEMES).toHaveLength(6);
    expect(new Set(DOT_COLOR_THEMES.map((theme) => theme.actionValue)).size).toBe(6);
    expect(DOT_COLOR_THEMES[0]).toBe(DOT_COLOR_THEME_SPECTRUM);
    expect(themeControl).toMatchObject({
      target: "actions.colorTheme",
      type: "actions",
    });
    expect(themeControl?.actions?.map((action) => (typeof action === "string" ? action : action.value))).toEqual(
      DOT_COLOR_THEMES.map((theme) => theme.actionValue),
    );

    const palette = controls.find(
      (control) => control.target === "appearance.palette",
    );
    const background = controls.find(
      (control) => control.target === "appearance.background",
    );
    expect(palette?.defaultValue).toEqual(
      createDotColorThemePaletteValue(DOT_COLOR_THEME_SPECTRUM),
    );
    expect(background?.defaultValue).toBe(DOT_COLOR_THEME_SPECTRUM.background);
  });

  it("enables playback behavior and sticky output actions", () => {
    expect(appSchema.assembly.capabilities).toContain("timeline.playback");
    expect(appSchema.assembly.capabilities).toContain("canvas.infinity");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
    expect(appSchema.assembly.commands).toContain("timeline.setCurrentTime");
    const exportSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Export",
    );
    expect(exportSection?.controls.footer).toMatchObject({
      target: "actions.output",
      type: "panelActions",
    });
  });

  it("publishes derived performance paths and enforced workload boundaries", () => {
    expect(appPerformance.scenarios.length).toBeGreaterThan(0);
    expect(appPerformance.workloadEnvelope.dimensions.map((dimension) => dimension.id)).toEqual([
      "particle-count",
      "image-long-edge",
      "video-long-edge",
    ]);
    expect(appPerformance.rendererStrategy).toBe("canvas-2d");
  });
});
