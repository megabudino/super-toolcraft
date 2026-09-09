import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  appControlSectionInventory,
  appTransferMode,
} from "./app-acceptance-data";
import { appPerformance } from "./app-performance";
import { heroDispersionControlSections } from "./hero-dispersion-control-sections";
import { heroDispersionTargets } from "./hero-dispersion-values";
import { heroProductControlAcceptance } from "./hero-product-control-acceptance";
import {
  HERO_DISPERSION_CONTROL_CHANGE_TARGETS,
  HERO_DISPERSION_CONTROL_DRAG_TARGETS,
  heroPreviewPipelineRegistration,
} from "./hero-preview-pipeline";

function acceptanceFor(target: string) {
  const acceptance = heroProductControlAcceptance.find(
    (entry) => entry.target === target,
  );
  if (!acceptance) {
    throw new Error(`Missing product acceptance for ${target}.`);
  }
  return acceptance;
}

describe("hero dispersion Toolcraft declarations", () => {
  it("freezes autonomous generated samples without replacing Motion boost proof", () => {
    const source = readFileSync(
      join(process.cwd(), "e2e/hero-preview-browser-helpers.ts"),
      "utf8",
    );
    const generatedTest = source.slice(
      source.indexOf("test(acceptance.browserTestName"),
      source.indexOf(
        "const session =",
        source.indexOf("test(acceptance.browserTestName"),
      ),
    );
    expect(generatedTest).toContain(
      'if (controlCase.action !== "motion-slider")',
    );
    expect(generatedTest).toContain(
      'await page.emulateMedia({ reducedMotion: "reduce" });',
    );
    expect(generatedTest.indexOf("page.emulateMedia")).toBeLessThan(
      generatedTest.indexOf('page.goto("/")'),
    );

    const genericEffectsSource = readFileSync(
      join(process.cwd(), "e2e/product-effects-preview.spec.ts"),
      "utf8",
    );
    expect(genericEffectsSource).not.toContain("acceptanceId: target.velocity");
    const specializedEffectsSource = readFileSync(
      join(process.cwd(), "e2e/product-gallery-effect.spec.ts"),
      "utf8",
    );
    const velocityAcceptance = acceptanceFor(heroDispersionTargets.velocity);
    expect(velocityAcceptance.browserTestName).toBe(
      "browser: dispersion.velocity changes the embedded hero output",
    );
    expect(specializedEffectsSource).toContain(
      `test("${velocityAcceptance.browserTestName}"`,
    );
  });

  it("defines the five-control side-only Edge Zone in product order", () => {
    const edgeZone = heroDispersionControlSections.find(
      (section) => section.id === "edge-zone",
    );
    expect(edgeZone).toBeDefined();
    expect(Object.keys(edgeZone?.controls ?? {})).toEqual([
      "edgeWidth",
      "curve",
      "edgeFade",
      "turbulence",
      "turbulenceScale",
    ]);
    expect(edgeZone?.controls.edgeWidth.description).toBe(
      "Sets how far the effect reaches inward. Sphere bands follow the lens-surface curved columns, and the value is their width at the equator; Rows retain their existing per-card viewport band behavior.",
    );
    expect(Object.keys(edgeZone?.controls ?? {})).toHaveLength(5);
  });

  it("routes current dispersion controls through preview v23", () => {
    expect("zoneSpace" in heroDispersionTargets).toBe(false);
    expect(HERO_DISPERSION_CONTROL_CHANGE_TARGETS).not.toContain(
      "dispersion.zoneSpace",
    );
    expect(HERO_DISPERSION_CONTROL_CHANGE_TARGETS).toContain(
      heroDispersionTargets.warpStyle,
    );
    expect(HERO_DISPERSION_CONTROL_CHANGE_TARGETS).toContain(
      heroDispersionTargets.warpWaveEnabled,
    );
    expect(HERO_DISPERSION_CONTROL_CHANGE_TARGETS).toContain(
      heroDispersionTargets.warpWaveKind,
    );
    expect(heroPreviewPipelineRegistration.runtimeId).toBe(
      "hero-native-preview-v23",
    );
  });

  it("covers the lens-surface controls in product acceptance and Edge Zone inventory", () => {
    expect(acceptanceFor(heroDispersionTargets.edgeWidth)).toMatchObject({
      componentType: "slider",
      expectedObservable:
        "Sphere's treated side bands follow lens-surface curved columns and use the value as their width at the equator; Rows retain their existing per-card viewport band behavior.",
    });
    const edgeZone = appControlSectionInventory.find(
      (entry) => entry.id === "edge-zone",
    );
    expect(edgeZone?.targets).toEqual([
      heroDispersionTargets.edgeWidth,
      heroDispersionTargets.curve,
      heroDispersionTargets.edgeFade,
      heroDispersionTargets.turbulence,
      heroDispersionTargets.turbulenceScale,
    ]);
    expect(edgeZone?.targets).toHaveLength(5);
    expect(edgeZone?.groupingReason).toContain(
      "lens-surface treatment envelope",
    );
    expect(edgeZone?.groupingReason).not.toMatch(/zone space/i);

    const dispersionTargets = new Set<string>(
      Object.values(heroDispersionTargets),
    );
    const dispersionAcceptanceProse = heroProductControlAcceptance
      .filter(
        (entry) =>
          typeof entry.target === "string" &&
          dispersionTargets.has(entry.target),
      )
      .map((entry) => entry.expectedObservable)
      .join("\n");
    expect(dispersionAcceptanceProse).not.toMatch(
      /viewport[- ]edge|card[- ]edge/i,
    );
    const dispersionDescriptionProse = heroDispersionControlSections
      .flatMap((section) => Object.values(section.controls))
      .filter((control) => dispersionTargets.has(control.target))
      .map((control) => control.description)
      .join("\n");
    expect(dispersionDescriptionProse).not.toMatch(
      /viewport[- ]edge|card[- ]edge|outer viewport boundary/i,
    );
  });

  it("describes the single post-pass architecture and its cost", () => {
    if (appTransferMode.mode !== "reference-runtime-clone") {
      throw new Error("Hero Scene Lab must remain a reference runtime clone.");
    }
    const referenceFeatureInventory = appTransferMode.referenceFeatureInventory;
    if (!referenceFeatureInventory) {
      throw new Error("Hero Scene Lab must inventory reference features.");
    }
    const rendererTechnique = appPerformance.rendererTechnique;
    if (!rendererTechnique) {
      throw new Error("Hero Scene Lab must declare its renderer technique.");
    }

    const edgeZoneFeature = referenceFeatureInventory.find(
      (entry) => entry.id === "reference.hero-edge-zone",
    );
    const opticsFeature = referenceFeatureInventory.find(
      (entry) => entry.id === "reference.hero-dispersion-optics",
    );

    expect(edgeZoneFeature?.toolcraftMapping).toContain(
      "Sphere uses one full-screen post pass with bands defined on the lens surface",
    );
    expect(opticsFeature?.toolcraftMapping).toContain(
      "all cards render into one scene buffer",
    );
    expect(opticsFeature?.toolcraftMapping).toContain(
      "row speed and 2D pan rate through the lens field",
    );
    expect(
      referenceFeatureInventory
        .filter((entry) =>
          [
            "reference.hero-edge-warp",
            "reference.hero-boundary-aura",
            "requested.hero-outward-edge-mapping",
          ].includes(entry.id),
        )
        .map((entry) => entry.toolcraftMapping)
        .join("\n"),
    ).not.toMatch(/outer viewport band|treated viewport edge|every card edge/i);
    expect(rendererTechnique.performanceRisks).toContain(
      "The sphere effect runs as one post pass: cost scales with treated-band pixels × samples, not with cards or overlap; scene and field buffers add two RGBA8 viewport-sized framebuffers.",
    );
    expect(rendererTechnique.fidelityRisks).toContain(
      "Panel-space zones follow lens longitude/latitude; with extreme bends the band boundary may leave the screen on the equator while remaining visible on other rows.",
    );
  });
});
