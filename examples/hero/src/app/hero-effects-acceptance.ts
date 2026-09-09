import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
} from "./acceptance/types";
import { heroEffectsTargets } from "./hero-effects-values";

function effectsControlAcceptance(
  target: string,
  label: string,
  componentType: "slider" | "switch",
  expectedObservable: string,
): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `${target} maps canonical state into the hero preview payload`,
    browser: true,
    browserTestName: `browser: ${target} changes the embedded hero output`,
    componentType,
    evidence: "rendered-pixels",
    expectedObservable,
    fixture: "Sphere gallery with authored images and active panel pan motion",
    id: target,
    kind: "control",
    target,
    userAction:
      componentType === "switch"
        ? `Toggle ${label}.`
        : `Drag the ${label} slider.`,
  };
}

export const heroEffectsControlAcceptance: readonly ToolcraftComponentAcceptance[] =
  [
    effectsControlAcceptance(
      heroEffectsTargets.grainEnabled,
      "Grain",
      "switch",
      "Filmic grain appears over the moving Sphere gallery and fades completely after pan motion settles.",
    ),
    effectsControlAcceptance(
      heroEffectsTargets.grainAmount,
      "Amount",
      "slider",
      "The monochrome filmic grain becomes stronger or weaker during Sphere pan motion.",
    ),
    effectsControlAcceptance(
      heroEffectsTargets.grainSize,
      "Size",
      "slider",
      "The moving grain cells become coarser or finer while preserving their CSS-pixel scale.",
    ),
    effectsControlAcceptance(
      heroEffectsTargets.crtEnabled,
      "CRT",
      "switch",
      "CRT chroma, scanlines, aperture mask, and flicker appear during Sphere pan motion and fade at rest.",
    ),
    effectsControlAcceptance(
      heroEffectsTargets.crtScanlines,
      "Scanlines",
      "slider",
      "The moving Sphere gallery shows stronger or weaker soft scanlines and aperture mask.",
    ),
    effectsControlAcceptance(
      heroEffectsTargets.crtPitch,
      "Line pitch",
      "slider",
      "CRT scanline and aperture-mask spacing changes in CSS pixels.",
    ),
    effectsControlAcceptance(
      heroEffectsTargets.crtChroma,
      "Chroma shift",
      "slider",
      "Red and blue separate further or less inside the active motion-blur sampling chain.",
    ),
    effectsControlAcceptance(
      heroEffectsTargets.crtFlicker,
      "Flicker",
      "slider",
      "The moving CRT overlay breathes more or less while remaining clean at rest.",
    ),
    effectsControlAcceptance(
      heroEffectsTargets.crtFade,
      "Fade out",
      "slider",
      "After drag stops, CRT fades over the chosen duration: 0.05 seconds clears almost immediately, while 3 seconds leaves a long visible tail.",
    ),
  ];

export const heroEffectsSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Motion grain",
      entityId: "hero-motion-grain",
      groupingReason:
        "The switch, amount, and CSS-pixel size define one filmic grain overlay driven by its fixed-decay Sphere pan-motion envelope.",
      id: "motion-grain",
      targets: [
        heroEffectsTargets.grainEnabled,
        heroEffectsTargets.grainAmount,
        heroEffectsTargets.grainSize,
      ],
      title: "Motion Grain",
    },
    {
      entity: "CRT overlay",
      entityId: "hero-motion-crt",
      groupingReason:
        "The switch, scanlines, line pitch, chroma shift, flicker, and fade-out duration define one CRT treatment driven by its independently configurable Sphere pan-motion envelope. The plan intentionally names both the section and its binary switch CRT so the enable state remains explicit while all tuning controls are conditionally hidden.",
      id: "motion-crt",
      targets: [
        heroEffectsTargets.crtEnabled,
        heroEffectsTargets.crtScanlines,
        heroEffectsTargets.crtPitch,
        heroEffectsTargets.crtChroma,
        heroEffectsTargets.crtFlicker,
        heroEffectsTargets.crtFade,
      ],
      title: "CRT",
    },
  ];
