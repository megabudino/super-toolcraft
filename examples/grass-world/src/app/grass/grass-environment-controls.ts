import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import { grassResponsive, grassSlider } from "./grass-control-builders";
import { grassDefaults } from "./grass-defaults";
import { grassHdriPickerItems } from "./grass-hdri";

export const grassSceneEnvironmentSection = {
  controls: {
    preset: {
      defaultValue: grassDefaults["environment.preset"],
      description:
        "Chooses a bundled CC0 Poly Haven environment for the entire scene; an attached custom HDRI temporarily overrides it.",
      items: grassHdriPickerItems,
      label: "Scene HDRI",
      orderRole: "mode",
      ...grassResponsive(
        "Decodes and PMREM-filters one retained scene environment when the source changes.",
      ),
      target: "environment.preset",
      type: "imagePicker",
    },
    hdriFile: {
      accept: ".hdr,image/vnd.radiance,image/x-hdr,application/octet-stream",
      assetKind: "file",
      defaultValue: null,
      description:
        "Loads one equirectangular Radiance HDR map for every scene material; remove it to return to the selected preset.",
      keyframeable: false,
      label: "Custom HDRI",
      multiple: false,
      orderRole: "input",
      performanceReason:
        "Decodes one source file only when attached or replaced, then retains its filtered GPU environment and lighting profile.",
      performanceRole: "responsiveness",
      target: "environment.hdriFile",
      type: "fileDrop",
    },
  },
  title: "Scene Environment",
} satisfies ToolcraftControlSectionSchema;

export const grassSceneLightingSection = {
  controls: {
    intensity: grassSlider({
      defaultValue: grassDefaults["environment.intensity"],
      description:
        "Controls how strongly the HDRI illuminates the terrain, scan assets, Lawn Cover, and Tall Grass.",
      label: "Intensity",
      max: 250,
      min: 0,
      performanceReason:
        "Updates shared physical lighting and stylized environment uniforms without re-filtering the HDRI.",
      step: 1,
      target: "environment.intensity",
      unit: "%",
    }),
    rotationX: grassSlider({
      defaultValue: grassDefaults["environment.rotationX"],
      description:
        "Tilts the HDRI over the field, moving its horizon and vertical light direction.",
      label: "Rotate X",
      max: 180,
      min: -180,
      performanceReason:
        "Updates the retained environment orientation and derived light direction.",
      step: 1,
      target: "environment.rotationX",
      unit: "°",
    }),
    rotationY: grassSlider({
      defaultValue: grassDefaults["environment.rotation"],
      description:
        "Rotates the HDRI and its derived dominant light direction around the whole field.",
      label: "Rotate Y",
      max: 360,
      min: 0,
      performanceReason:
        "Updates the retained scene environment and stylized light direction.",
      step: 1,
      target: "environment.rotation",
      unit: "°",
    }),
    rotationZ: grassSlider({
      defaultValue: grassDefaults["environment.rotationZ"],
      description:
        "Rolls the HDRI around the viewing axis to reposition diagonal light and shadow regions.",
      label: "Rotate Z",
      max: 180,
      min: -180,
      performanceReason:
        "Updates the retained environment orientation and derived light direction.",
      step: 1,
      target: "environment.rotationZ",
      unit: "°",
    }),
    visibleHdri: {
      defaultValue: grassDefaults["environment.visible"],
      description:
        "Displays the HDRI behind the field; hiding it keeps the same material lighting.",
      label: "Visible HDRI",
      orderRole: "detail",
      ...grassResponsive(
        "Switches only the retained scene backdrop without changing illumination.",
      ),
      target: "environment.visible",
      type: "switch",
    },
    backgroundBlur: grassSlider({
      defaultValue: grassDefaults["environment.backgroundBlur"],
      description:
        "Softens only the visible HDRI backdrop while material lighting stays detailed.",
      label: "Background blur",
      max: 100,
      min: 0,
      performanceReason: "Updates fixed-cost scene background sampling blur.",
      step: 1,
      target: "environment.backgroundBlur",
      unit: "%",
      visibleWhen: { equals: true, target: "environment.visible" },
    }),
  },
  title: "Scene Lighting",
} satisfies ToolcraftControlSectionSchema;

export const grassLightBalanceSection = {
  controls: {
    keyColor: {
      defaultValue: grassDefaults["environment.keyColor"],
      description:
        "Tints the retained directional sun while preserving HDRI reflections and sky fill.",
      label: "Sun color",
      ...grassResponsive(
        "Updates the retained directional-light color without rebuilding the environment.",
      ),
      target: "environment.keyColor",
      type: "color",
    },
    keyStrength: grassSlider({
      defaultValue: grassDefaults["environment.keyStrength"],
      description:
        "Balances direct sun energy against the HDRI and shadow fill.",
      label: "Sun strength",
      max: 200,
      min: 0,
      performanceReason:
        "Updates one retained directional-light intensity scalar.",
      step: 1,
      target: "environment.keyStrength",
      unit: "%",
    }),
    fillColor: {
      defaultValue: grassDefaults["environment.fillColor"],
      description:
        "Tints the indirect sky fill that remains visible inside shaded grass and terrain folds.",
      label: "Fill color",
      ...grassResponsive(
        "Updates the retained hemisphere-light color without rebuilding the environment.",
      ),
      target: "environment.fillColor",
      type: "color",
    },
    fillStrength: grassSlider({
      defaultValue: grassDefaults["environment.fillStrength"],
      description:
        "Lifts or deepens cool skylight in shaded grass and terrain regions.",
      label: "Shadow fill",
      max: 200,
      min: 0,
      performanceReason: "Updates one retained hemisphere-light scalar.",
      step: 1,
      target: "environment.fillStrength",
      unit: "%",
    }),
    rimColor: {
      defaultValue: grassDefaults["environment.rimColor"],
      description:
        "Tints the opposite-side edge light used to separate fine grass silhouettes.",
      label: "Rim color",
      ...grassResponsive(
        "Updates the retained rim-light color without rebuilding materials.",
      ),
      target: "environment.rimColor",
      type: "color",
    },
    rimStrength: grassSlider({
      defaultValue: grassDefaults["environment.rimStrength"],
      description:
        "Controls fine silhouette separation on long blades and scan cards.",
      label: "Rim strength",
      max: 200,
      min: 0,
      performanceReason:
        "Updates one retained opposite-direction light intensity scalar.",
      step: 1,
      target: "environment.rimStrength",
      unit: "%",
    }),
    exposure: grassSlider({
      defaultValue: grassDefaults["environment.exposure"],
      description:
        "Trims final ACES exposure after HDRI, sun, fill, and material lighting are combined.",
      label: "Exposure",
      max: 250,
      min: 50,
      performanceReason:
        "Updates the retained renderer tone-mapping exposure scalar.",
      step: 1,
      target: "environment.exposure",
      unit: "%",
    }),
  },
  title: "Light Balance",
} satisfies ToolcraftControlSectionSchema;

export const grassColorGradeSection = {
  controls: {
    sceneContrast: grassSlider({
      defaultValue: grassDefaults["environment.sceneContrast"],
      description:
        "Shapes the final lit scene after PBR and Sun Patches, deepening shade while preserving bright grass edges.",
      label: "Contrast",
      max: 200,
      min: 50,
      performanceReason:
        "Updates one shared post-light material uniform across retained scene materials.",
      step: 1,
      target: "environment.sceneContrast",
      unit: "%",
    }),
    sceneSaturation: grassSlider({
      defaultValue: grassDefaults["environment.sceneSaturation"],
      description:
        "Controls final scene chroma after physical lighting without replacing per-material saturation.",
      label: "Saturation",
      max: 200,
      min: 0,
      performanceReason:
        "Updates one shared post-light material uniform across retained scene materials.",
      step: 1,
      target: "environment.sceneSaturation",
      unit: "%",
    }),
    highlightWarmth: grassSlider({
      defaultValue: grassDefaults["environment.highlightWarmth"],
      description:
        "Adds a golden split tone only where PBR lighting creates highlights.",
      label: "Highlight warmth",
      max: 100,
      min: 0,
      performanceReason:
        "Updates one bounded post-light highlight tint uniform.",
      step: 1,
      target: "environment.highlightWarmth",
      unit: "%",
    }),
    shadowCoolness: grassSlider({
      defaultValue: grassDefaults["environment.shadowCoolness"],
      description:
        "Adds a restrained teal split tone to shaded regions without lifting their brightness.",
      label: "Shadow coolness",
      max: 100,
      min: 0,
      performanceReason: "Updates one bounded post-light shadow tint uniform.",
      step: 1,
      target: "environment.shadowCoolness",
      unit: "%",
    }),
  },
  title: "Color Grade",
} satisfies ToolcraftControlSectionSchema;

const sunPatchVisibility = {
  equals: true,
  target: "environment.sunPatchEnabled",
} as const;

export const grassSunPatchesSection = {
  controls: {
    include: {
      defaultValue: grassDefaults["environment.sunPatchEnabled"],
      description:
        "Projects broad world-space sunlight and shade regions across every field material.",
      label: "Include",
      orderRole: "mode",
      semanticGroup: "pattern",
      ...grassResponsive(
        "Switches one fixed-cost shared material-lighting branch.",
      ),
      target: "environment.sunPatchEnabled",
      type: "switch",
    },
    scale: grassSlider({
      defaultValue: grassDefaults["environment.sunPatchScale"],
      description: "Sets the world-space size of the light and shadow regions.",
      label: "Scale",
      max: 8,
      min: 0.5,
      performanceReason:
        "Updates one shared coordinate scale in a fixed-octave material mask.",
      semanticGroup: "pattern",
      step: 0.1,
      target: "environment.sunPatchScale",
      unit: "m",
      visibleWhen: sunPatchVisibility,
    }),
    coverage: grassSlider({
      defaultValue: grassDefaults["environment.sunPatchCoverage"],
      description: "Sets how much of the field falls inside shadow patches.",
      label: "Coverage",
      max: 100,
      min: 0,
      performanceReason:
        "Updates one shared threshold in the fixed-cost material mask.",
      semanticGroup: "pattern",
      step: 1,
      target: "environment.sunPatchCoverage",
      unit: "%",
      visibleWhen: sunPatchVisibility,
    }),
    softness: grassSlider({
      defaultValue: grassDefaults["environment.sunPatchSoftness"],
      description: "Controls the transition width between sunlight and shade.",
      label: "Softness",
      max: 100,
      min: 0,
      performanceReason:
        "Updates one shared smoothstep width without changing shader work.",
      semanticGroup: "pattern",
      step: 1,
      target: "environment.sunPatchSoftness",
      unit: "%",
      visibleWhen: sunPatchVisibility,
    }),
    strength: grassSlider({
      defaultValue: grassDefaults["environment.sunPatchStrength"],
      description:
        "Sets sun-to-shade contrast. Above 100%, it also deepens indirect shade and lifts direct sunlight for a more dramatic split.",
      label: "Strength",
      max: 200,
      min: 0,
      performanceReason:
        "Updates fixed-cost shared direct and indirect lighting multipliers without changing shader work.",
      semanticGroup: "pattern",
      step: 1,
      target: "environment.sunPatchStrength",
      unit: "%",
      visibleWhen: sunPatchVisibility,
    }),
    offset: {
      coordinateMode: "cartesian",
      defaultValue: grassDefaults["environment.sunPatchOffset"],
      description:
        "Moves the projected pattern across world X/Z without moving the HDRI itself.",
      keyframeable: false,
      label: "Offset",
      orderRole: "spatial",
      semanticGroup: "placement",
      ...grassResponsive(
        "Updates one shared bounded world-space offset in the material mask.",
      ),
      target: "environment.sunPatchOffset",
      type: "vector",
      visibleWhen: sunPatchVisibility,
    },
    seed: grassSlider({
      defaultValue: grassDefaults["environment.sunPatchSeed"],
      description:
        "Chooses a deterministic arrangement of broad sun and shadow regions.",
      label: "Seed",
      max: 100,
      min: 0,
      performanceReason:
        "Offsets the fixed-octave material mask without rebuilding resources.",
      semanticGroup: "placement",
      step: 1,
      target: "environment.sunPatchSeed",
      visibleWhen: sunPatchVisibility,
    }),
  },
  title: "Sun Patches",
} satisfies ToolcraftControlSectionSchema;
