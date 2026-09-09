import { describe, expect, it } from "vitest";

import { appAcceptance } from "./app-acceptance";
import { appPerformance } from "./app-performance";

const acceptanceAutomatedTestNames = [
  "source image upload clear and reset update media",
  "effect style changes product output",
  "effect size changes product output",
  "effect fill changes product output",
  "effect density changes product output",
  "effect exposure changes product output",
  "effect scatter changes product output",
  "effect seed changes deterministic product output",
  "ascii mode changes product output",
  "ascii glyphs change product output",
  "ascii custom glyphs change product output",
  "tone brightness changes product output",
  "tone contrast changes product output",
  "tone saturation changes product output",
  "tone hue changes product output",
  "finish noise changes product output",
  "finish grain changes product output",
  "finish glow changes product output",
  "finish vignette changes product output",
  "duotone preset changes product output",
  "custom duotone pixels color changes product output",
  "custom duotone base color changes product output",
  "layer opacity changes product output",
  "layer blend changes product output",
  "include background changes preview and png output",
  "background color changes preview and png output",
  "image format changes exported bytes",
  "image resolution changes exported dimensions",
  "resolution scale changes preview output",
  "settings transfer exports and imports complex settings",
  "persistence reload restores dither settings",
  "exports image output",
] as const;

const performanceAutomatedTestNames = [
  "settings transfer performance remains responsive",
  "source image workload changes preview",
  "media import performance uses realistic source",
  "effect style workload changes preview",
  "effect size drag workload stays responsive",
  "effect fill drag workload stays responsive",
  "effect density drag workload stays responsive",
  "effect exposure drag remains responsive",
  "effect scatter drag remains responsive",
  "effect seed drag remains responsive",
  "tone brightness drag remains responsive",
  "tone contrast drag remains responsive",
  "tone saturation drag remains responsive",
  "tone hue drag remains responsive",
  "finish noise drag remains responsive",
  "finish grain drag remains responsive",
  "finish glow drag workload stays responsive",
  "finish vignette drag remains responsive",
  "duotone preset change remains responsive",
  "duotone pixels color change remains responsive",
  "duotone base color change remains responsive",
  "ascii mode workload changes preview",
  "ascii glyphs workload changes preview",
  "ascii custom glyphs workload changes preview",
  "layer opacity drag remains responsive",
  "layer blend change remains responsive",
  "include background change remains responsive",
  "background color change remains responsive",
  "image format change remains responsive",
  "image resolution workload changes export target",
  "render scale drag workload stays responsive",
  "stress preview render stays within budget",
  "viewport remains stable during controls",
  "viewport zoom stress stays responsive",
  "image export completes within budget",
] as const;

describe("Dither product coverage anchors", () => {
  it("names every automated acceptance check", () => {
    expect(appAcceptance.filter((entry) => entry.automated).map((entry) => entry.automatedTestName)).toEqual(
      acceptanceAutomatedTestNames,
    );
  });

  it("names every automated performance scenario", () => {
    expect(appPerformance.scenarios.filter((scenario) => scenario.automated).map((scenario) => scenario.automatedTestName)).toEqual(
      performanceAutomatedTestNames,
    );
  });
});
