import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  appProductReadiness,
  appTransferMode,
  getToolcraftControlOrder,
  starterControlSectionInventory,
  validateToolcraftAcceptanceCoverage,
} from "./app-acceptance";
import { appSchema } from "./app-schema";

describe("Kinetic Circle acceptance coverage", () => {
  it("validates every visible control and runtime behavior", () => {
    expect(
      validateToolcraftAcceptanceCoverage(
        appSchema,
        appAcceptance,
        appTransferMode,
        starterControlSectionInventory,
      ),
    ).toEqual([]);
  });

  it("publishes product readiness and timeline intent", () => {
    expect(appProductReadiness).toMatchObject({
      mode: "product",
      productName: "Kinetic Circle",
    });
    expect(appTransferMode).toMatchObject({
      animationIntent: {
        loopDuration: { seconds: 8, source: "product-derived" },
        mode: "timeline-playback",
      },
      mode: "new-toolcraft-app",
    });
  });

  it("maps every product section to an inventory entry", () => {
    const productSectionTitles =
      appSchema.panels.controls?.sections
        .filter((section) => section.title !== "Setup" && section.title !== "Export")
        .map((section) => section.title) ?? [];

    expect(starterControlSectionInventory.map((entry) => entry.title)).toEqual(
      productSectionTitles,
    );
    expect(
      starterControlSectionInventory.flatMap((entry) => entry.targets),
    ).toEqual([
      "panel.variations",
      "shape.form",
      "shape.bend",
      "shape.rotation",
      "shape.depth",
      "shape.repeats",
      "view.orbit",
      "volume.radiusRange",
      "volume.zSpread",
      "volume.zBend",
      "volume.zTwist",
      "volume.perspective",
      "pattern.layout",
      "pattern.density",
      "pattern.dotSize",
      "pattern.arms",
      "pattern.arcFill",
      "pattern.seed",
      "style.dotShape",
      "style.taper",
      "style.glow",
      "palette.preset",
      "palette.base",
      "palette.bright",
      "palette.cyan",
      "palette.violet",
      "palette.warm",
      "palette.colorMode",
      "palette.highlight",
      "palette.accents",
      "motion.type",
      "motion.speed",
      "motion.strength",
      "motion.wavelength",
      "motion.damping",
      "motion.turbulence",
      "motion.zMotion",
      "motion.coreOpening",
      "motion.ballWeight",
      "motion.sparkle",
      "export.includeBackground",
      "appearance.background",
      "export.image.format",
      "export.image.resolution",
      "export.video.format",
      "export.video.resolution",
    ]);
  });

  it("keeps mode and primary controls before dependent detail controls", () => {
    const order = getToolcraftControlOrder(appSchema);
    const form = order.find((entry) => entry.target === "shape.form");
    const bend = order.find((entry) => entry.target === "shape.bend");
    const density = order.find((entry) => entry.target === "pattern.density");
    const dotSize = order.find((entry) => entry.target === "pattern.dotSize");
    const motionType = order.find((entry) => entry.target === "motion.type");
    const speed = order.find((entry) => entry.target === "motion.speed");
    const damping = order.find((entry) => entry.target === "motion.damping");

    expect(form?.rank).toBeLessThan(bend?.rank ?? Infinity);
    expect(density?.rank).toBeLessThan(dotSize?.rank ?? Infinity);
    expect(motionType?.rank).toBeLessThan(speed?.rank ?? Infinity);
    expect(speed?.rank).toBeLessThan(damping?.rank ?? Infinity);
  });

  it("covers still export, video export, timeline, and persistence", () => {
    expect(
      appAcceptance.find((entry) => entry.target === "panel.exports")?.actionCoverage,
    ).toEqual(["export-video", "export-png"]);
    expect(
      appAcceptance.find((entry) => entry.timelineCoverage === "playback")
        ?.timelinePlaybackCoverage,
    ).toBe("all-playback-behavior");
    expect(
      appAcceptance.find((entry) => entry.persistenceCoverage === "reload"),
    ).toBeDefined();
    expect(
      appAcceptance.find((entry) => entry.target === "view.orbit")?.canvasHandle,
    ).toMatchObject({
      testId: "toolcraft-orientation-gizmo",
      writesTarget: "view.orbit",
    });
    expect(
      appAcceptance.find((entry) => entry.target === "canvas.infinity"),
    ).toBeDefined();
  });

  it("uses ToolcraftApp extension points without rebuilding runtime surfaces", () => {
    const route = readFileSync(resolve("src/routes/index.tsx"), "utf8");

    expect(route).toContain("<ToolcraftApp");
    expect(route).toContain("canvasContent={<KineticMosaicRenderer />}");
    expect(route).toContain("onPanelAction={handlePanelAction}");
    expect(route).not.toMatch(/<CanvasShell|<ControlsPanel|<TimelinePanel|<ToolbarPanel/);
  });
});
