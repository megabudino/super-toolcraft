import { describe, expect, it } from "vitest";

import { createCompositionShuffle } from "./composition-shuffle";
import { editorialTemplateOptions } from "./editorial-templates";
import { equationOptions } from "./pattern-equations";
import { contrastRatio } from "./palette-harmonies";

const current = {
  background: "#F3F0E8",
  colorA: "#171717",
  colorB: "#FF4F8A",
  colorC: "#4A6CFF",
  coupling: 48,
  detailInk: "#111111",
  headlineInk: "#111111",
  phase: 18,
  preset: "harmonic-halo" as const,
  resonance: 5,
  ruleInk: "#111111",
  symmetry: 7,
  templateId: "modular-index",
  warp: 32,
};

function hslSaturation(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map(
    (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const max = Math.max(red ?? 0, green ?? 0, blue ?? 0);
  const min = Math.min(red ?? 0, green ?? 0, blue ?? 0);
  const delta = max - min;
  const lightness = (max + min) / 2;
  return delta === 0
    ? 0
    : (delta / (1 - Math.abs(2 * lightness - 1))) * 100;
}

describe("whole composition shuffle", () => {
  it("is deterministic while changing template, equation, and every equation variable", () => {
    const first = createCompositionShuffle(current);
    const second = createCompositionShuffle(current);

    expect(first).toEqual(second);
    expect(first["editorial.template"]).not.toBe(current.templateId);
    expect(first["editorial.customCopy"]).toBe(false);
    expect(first["pattern.preset"]).not.toBe(current.preset);
    expect(first["pattern.symmetry"]).not.toBe(current.symmetry);
    expect(first["pattern.resonance"]).not.toBe(current.resonance);
    expect(first["pattern.coupling"]).not.toBe(current.coupling);
    expect(first["pattern.phase"]).not.toBe(current.phase);
    expect(first["pattern.warp"]).not.toBe(current.warp);
    expect(first["export.includeBackground"]).toBe(true);
  });

  it("preserves every authored color target while still changing composition and equation values", () => {
    const values = createCompositionShuffle(current, { preserveColors: true });

    expect(Object.keys(values).sort()).toEqual([
      "editorial.customCopy",
      "editorial.template",
      "pattern.coupling",
      "pattern.phase",
      "pattern.preset",
      "pattern.resonance",
      "pattern.symmetry",
      "pattern.warp",
    ]);
    expect(values["editorial.template"]).not.toBe(current.templateId);
    expect(values["editorial.customCopy"]).toBe(false);
    expect(values["pattern.preset"]).not.toBe(current.preset);
    expect(values["pattern.symmetry"]).not.toBe(current.symmetry);
    expect(values["pattern.resonance"]).not.toBe(current.resonance);
    expect(values["pattern.coupling"]).not.toBe(current.coupling);
    expect(values["pattern.phase"]).not.toBe(current.phase);
    expect(values["pattern.warp"]).not.toBe(current.warp);

    for (const target of [
      "appearance.background",
      "appearance.detail",
      "appearance.headline",
      "appearance.rule",
      "export.includeBackground",
      "pattern.colorA",
      "pattern.colorB",
      "pattern.colorC",
    ]) {
      expect(values).not.toHaveProperty(target);
    }
  });

  it("stays within authored options/ranges and emits contrast-safe color roles", () => {
    let input = current;

    for (let iteration = 0; iteration < 100; iteration += 1) {
      const values = createCompositionShuffle(input);
      expect(editorialTemplateOptions.map(({ value }) => value)).toContain(
        values["editorial.template"],
      );
      expect(equationOptions.map(({ value }) => value)).toContain(
        values["pattern.preset"],
      );
      expect(values["pattern.symmetry"]).toBeGreaterThanOrEqual(2);
      expect(values["pattern.symmetry"]).toBeLessThanOrEqual(16);
      expect(values["pattern.resonance"]).toBeGreaterThanOrEqual(1);
      expect(values["pattern.resonance"]).toBeLessThanOrEqual(16);
      expect(values["pattern.coupling"]).toBeGreaterThanOrEqual(0);
      expect(values["pattern.coupling"]).toBeLessThanOrEqual(100);
      expect(values["pattern.phase"]).toBeGreaterThanOrEqual(-180);
      expect(values["pattern.phase"]).toBeLessThanOrEqual(180);
      expect(values["pattern.warp"]).toBeGreaterThanOrEqual(0);
      expect(values["pattern.warp"]).toBeLessThanOrEqual(100);

      const background = String(values["appearance.background"]);
      expect(hslSaturation(background)).toBeGreaterThanOrEqual(90);
      expect(
        Math.max(
          contrastRatio(background, "#000000"),
          contrastRatio(background, "#FFFFFF"),
        ),
      ).toBeGreaterThanOrEqual(7);
      expect(
        contrastRatio(String(values["appearance.headline"]), background),
      ).toBeGreaterThanOrEqual(7);
      expect(
        contrastRatio(String(values["appearance.detail"]), background),
      ).toBeGreaterThanOrEqual(7);
      for (const target of [
        "appearance.rule",
        "pattern.colorA",
        "pattern.colorB",
        "pattern.colorC",
      ]) {
        expect(contrastRatio(String(values[target]), background)).toBeGreaterThanOrEqual(3);
      }

      input = {
        background,
        colorA: String(values["pattern.colorA"]),
        colorB: String(values["pattern.colorB"]),
        colorC: String(values["pattern.colorC"]),
        coupling: Number(values["pattern.coupling"]),
        detailInk: String(values["appearance.detail"]),
        headlineInk: String(values["appearance.headline"]),
        phase: Number(values["pattern.phase"]),
        preset: values["pattern.preset"] as typeof current.preset,
        resonance: Number(values["pattern.resonance"]),
        ruleInk: String(values["appearance.rule"]),
        symmetry: Number(values["pattern.symmetry"]),
        templateId: String(values["editorial.template"]),
        warp: Number(values["pattern.warp"]),
      };
    }
  });
});
