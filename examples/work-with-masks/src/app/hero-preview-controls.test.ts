import { describe, expect, it } from "vitest";

import {
  heroPreviewControlSections,
  heroPreviewDefaults,
  heroPreviewTargets,
} from "./hero-preview-controls";

describe("hero preview controls", () => {
  const controlsByTarget = new Map(
    heroPreviewControlSections.flatMap((section) =>
      Object.values(section.controls).map((control) => [control.target, control] as const),
    ),
  );
  const getControl = (target: string) => {
    const control = controlsByTarget.get(target);
    if (!control) throw new Error(`Missing hero preview control: ${target}`);
    return control;
  };

  it("declares heading typography preview coverage", () => {
    expect(controlsByTarget.get(heroPreviewTargets.headingTypography)?.type).toBe("fontPicker");
  });

  it("declares top inset preview coverage", () => {
    expect(controlsByTarget.get(heroPreviewTargets.topInset)?.defaultValue).toBe(220);
  });

  it("declares copy to logos preview coverage", () => {
    expect(controlsByTarget.get(heroPreviewTargets.copyToLogos)?.defaultValue).toBe(180);
  });

  it("declares logos to media preview coverage", () => {
    expect(controlsByTarget.get(heroPreviewTargets.logosToMedia)?.defaultValue).toBe(52);
  });

  it("declares right lead typography preview coverage", () => {
    expect(controlsByTarget.get(heroPreviewTargets.leadTypography)?.type).toBe("fontPicker");
  });

  it("declares right body typography preview coverage", () => {
    expect(controlsByTarget.get(heroPreviewTargets.bodyTypography)?.type).toBe("fontPicker");
  });

  it("declares right block offset preview coverage", () => {
    expect(controlsByTarget.get(heroPreviewTargets.offsetY)?.defaultValue).toBe(19.5);
  });

  it("declares right paragraph gap preview coverage", () => {
    expect(controlsByTarget.get(heroPreviewTargets.paragraphGap)?.defaultValue).toBe(36);
  });

  it("uses three standard FontPickers for independently owned text entities", () => {
    expect(getControl(heroPreviewTargets.headingTypography)).toMatchObject({
      applicability: { mode: "always" },
      defaultValue: heroPreviewDefaults.headingTypography,
      target: heroPreviewTargets.headingTypography,
      type: "fontPicker",
    });
    expect(getControl(heroPreviewTargets.leadTypography)).toMatchObject({
      applicability: { mode: "always" },
      defaultValue: heroPreviewDefaults.leadTypography,
      target: heroPreviewTargets.leadTypography,
      type: "fontPicker",
    });
    expect(getControl(heroPreviewTargets.bodyTypography)).toMatchObject({
      applicability: { mode: "always" },
      defaultValue: heroPreviewDefaults.bodyTypography,
      target: heroPreviewTargets.bodyTypography,
      type: "fontPicker",
    });
  });

  it("declares the three marked spacing controls and right-copy geometry as continuous sliders", () => {
    const controls = [
      getControl(heroPreviewTargets.topInset),
      getControl(heroPreviewTargets.copyToLogos),
      getControl(heroPreviewTargets.logosToMedia),
      getControl(heroPreviewTargets.offsetY),
      getControl(heroPreviewTargets.paragraphGap),
    ];

    expect(controls).toHaveLength(5);
    for (const control of controls) {
      expect(control).toMatchObject({
        applicability: { mode: "always" },
        performanceRole: "responsiveness",
        sliderValueKind: "continuous",
        type: "slider",
        unit: "px",
      });
    }

    expect(getControl(heroPreviewTargets.topInset)).toMatchObject({
      defaultValue: 220,
      max: 320,
      min: 0,
      step: 4,
    });
    expect(getControl(heroPreviewTargets.copyToLogos)).toMatchObject({
      defaultValue: 180,
      max: 480,
      min: 0,
      step: 4,
    });
    expect(getControl(heroPreviewTargets.logosToMedia)).toMatchObject({
      defaultValue: 52,
      max: 240,
      min: 0,
      step: 4,
    });
    expect(getControl(heroPreviewTargets.offsetY)).toMatchObject({
      defaultValue: 19.5,
      max: 240,
      min: -120,
      step: 0.5,
    });
    expect(getControl(heroPreviewTargets.paragraphGap)).toMatchObject({
      defaultValue: 36,
      max: 160,
      min: 0,
      step: 1,
    });
  });

  it("keeps every visible control on the lightweight responsiveness path", () => {
    for (const section of heroPreviewControlSections) {
      for (const control of Object.values(section.controls)) {
        expect(control.performanceRole).toBe("responsiveness");
        expect(control.performanceReason).toContain("native preview preview");
      }
    }
  });
});
