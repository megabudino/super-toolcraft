import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import {
  HERO_EFFECTS_CONTROL_DEFAULTS,
  heroEffectsTargets,
} from "./hero-effects-values";
import { heroGalleryTargets } from "./hero-gallery-values";

const sphereOnly = {
  all: [{ equals: "sphere", target: heroGalleryTargets.type }],
  mode: "conditional" as const,
};

function enabledInSphere(target: string) {
  return {
    all: [
      { equals: "sphere", target: heroGalleryTargets.type },
      { equals: true, target },
    ],
    mode: "conditional" as const,
  };
}

function effectSlider(
  target: string,
  label: string,
  defaultValue: number,
  minimum: number,
  maximum: number,
  step: number,
  unit: "%" | "px" | "s",
  enabledTarget: string,
  semanticGroup: "crt" | "grain",
  description: string,
) {
  return {
    applicability: enabledInSphere(enabledTarget),
    defaultValue,
    description,
    label,
    max: maximum,
    min: minimum,
    performanceReason:
      "Updates one uniform in the existing retained Sphere post pass without adding a pass or framebuffer.",
    performanceRole: "responsiveness" as const,
    semanticGroup,
    sliderValueKind: "continuous" as const,
    step,
    target,
    type: "slider" as const,
    unit,
    variant: "continuous" as const,
  };
}

const defaults = HERO_EFFECTS_CONTROL_DEFAULTS;
const target = heroEffectsTargets;

export const heroEffectsControlSections: readonly ToolcraftControlSectionSchema[] =
  [
    {
      controls: {
        enabled: {
          applicability: sphereOnly,
          defaultValue: defaults.grain.enabled,
          description:
            "Adds filmic grain over motion blur only while the Sphere gallery is dragged or panned, then fades it out at rest.",
          label: "Grain",
          performanceReason:
            "Enables a uniform-gated procedural branch in the existing retained Sphere post pass.",
          performanceRole: "responsiveness",
          semanticGroup: "grain",
          target: target.grainEnabled,
          type: "switch",
        },
        amount: effectSlider(
          target.grainAmount,
          "Amount",
          defaults.grain.amount,
          0,
          100,
          1,
          "%",
          target.grainEnabled,
          "grain",
          "Controls monochrome filmic grain strength during drag, pan, inertia, and auto-scroll motion.",
        ),
        size: effectSlider(
          target.grainSize,
          "Size",
          defaults.grain.size,
          1,
          8,
          0.5,
          "px",
          target.grainEnabled,
          "grain",
          "Sets the grain cell size in CSS pixels so it remains consistent across display densities.",
        ),
      },
      id: "motion-grain",
      title: "Motion Grain",
    },
    {
      controls: {
        enabled: {
          applicability: sphereOnly,
          defaultValue: defaults.crt.enabled,
          description:
            "Adds CRT chroma, scanlines, aperture mask, and flicker over motion blur only while the Sphere gallery moves.",
          label: "CRT",
          performanceReason:
            "Enables uniform-gated CRT branches in the existing retained Sphere post pass.",
          performanceRole: "responsiveness",
          semanticGroup: "crt",
          target: target.crtEnabled,
          type: "switch",
        },
        scanlines: effectSlider(
          target.crtScanlines,
          "Scanlines",
          defaults.crt.scanlines,
          0,
          100,
          1,
          "%",
          target.crtEnabled,
          "crt",
          "Controls the soft horizontal scanline and RGB aperture-mask strength while the gallery moves.",
        ),
        pitch: effectSlider(
          target.crtPitch,
          "Line pitch",
          defaults.crt.pitch,
          2,
          16,
          1,
          "px",
          target.crtEnabled,
          "crt",
          "Sets scanline spacing in CSS pixels for stable density on retina displays.",
        ),
        chroma: effectSlider(
          target.crtChroma,
          "Chroma shift",
          defaults.crt.chroma,
          0,
          8,
          0.25,
          "px",
          target.crtEnabled,
          "crt",
          "Separates red and blue inside the existing motion-blur sampling chain.",
        ),
        flicker: effectSlider(
          target.crtFlicker,
          "Flicker",
          defaults.crt.flicker,
          0,
          100,
          1,
          "%",
          target.crtEnabled,
          "crt",
          "Adds a subtle time-based brightness pulse that follows the independently decaying CRT pan-motion envelope.",
        ),
        fade: effectSlider(
          target.crtFade,
          "Fade out",
          defaults.crt.fade,
          0.05,
          3,
          0.05,
          "s",
          target.crtEnabled,
          "crt",
          "Controls how many seconds CRT remains visible while fading after scroll stops.",
        ),
      },
      id: "motion-crt",
      title: "CRT",
    },
  ];
