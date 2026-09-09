import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import { grassResponsive, grassSlider } from "./grass-control-builders";
import { grassDefaults } from "./grass-defaults";

export const grassAppearanceSection = {
  controls: {
    pbrRoughness: grassSlider({
      defaultValue: grassDefaults["appearance.pbrRoughness"],
      description:
        "Controls the width and softness of physical highlights on each blade.",
      label: "Roughness",
      max: 100,
      min: 5,
      performanceReason: "Updates one retained physical-material parameter.",
      semanticGroup: "material",
      step: 1,
      target: "appearance.pbrRoughness",
      unit: "%",
    }),
    colorVariation: grassSlider({
      defaultValue: grassDefaults["appearance.colorVariation"],
      description:
        "Blends deterministic cool, warm, light, and deep green variation between neighboring Tall Grass blades and clumps.",
      label: "Color variation",
      max: 100,
      min: 0,
      performanceReason:
        "Updates one retained color-variation uniform on Tall Grass.",
      semanticGroup: "color",
      step: 1,
      target: "appearance.colorVariation",
      unit: "%",
    }),
    colorContrast: grassSlider({
      defaultValue: grassDefaults["appearance.colorContrast"],
      description:
        "Expands or compresses Tall Grass base-color separation without changing lighting or geometry.",
      label: "Contrast",
      max: 200,
      min: 0,
      performanceReason:
        "Updates one retained Tall Grass material-color uniform.",
      semanticGroup: "color",
      step: 1,
      target: "appearance.colorContrast",
      unit: "%",
    }),
    colorSaturation: grassSlider({
      defaultValue: grassDefaults["appearance.colorSaturation"],
      description:
        "Controls Tall Grass chroma in both physical and stylized material modes.",
      label: "Saturation",
      max: 200,
      min: 0,
      performanceReason:
        "Updates one retained Tall Grass material-color uniform.",
      semanticGroup: "color",
      step: 1,
      target: "appearance.colorSaturation",
      unit: "%",
    }),
    bladeGradient: {
      defaultValue: grassDefaults["appearance.bladeGradient"],
      description: "Maps editable root, mid, and tip colors along every blade.",
      label: "Blade gradient",
      orderRole: "color",
      semanticGroup: "color",
      ...grassResponsive("Updates retained gradient color uniforms."),
      target: "appearance.bladeGradient",
      type: "gradient",
    },
  },
  title: "Tall Grass Appearance",
} satisfies ToolcraftControlSectionSchema;

export const grassSurfaceSection = {
  controls: {
    groundColor: {
      defaultValue: grassDefaults["appearance.groundColor"],
      description:
        "Tints only the scanned Current ground base color while preserving its luminance detail and PBR maps.",
      label: "Current color",
      orderRole: "color",
      semanticGroup: "material-color",
      ...grassResponsive("Updates one retained Current texture tint uniform."),
      target: "appearance.groundColor",
      type: "color",
    },
    cloverColor: {
      defaultValue: grassDefaults["surface.cloverColor"],
      description:
        "Tints only the scanned Clover ground base color while preserving its luminance detail and PBR maps.",
      label: "Clover color",
      orderRole: "color",
      semanticGroup: "material-color",
      ...grassResponsive("Updates one retained Clover texture tint uniform."),
      target: "surface.cloverColor",
      type: "color",
    },
    brightness: grassSlider({
      defaultValue: grassDefaults["surface.brightness"],
      description:
        "Brightens or darkens the blended Current and Clover ground albedo without changing the rest of the scene lighting.",
      label: "Brightness",
      max: 300,
      min: 0,
      performanceReason:
        "Updates one retained ground-material multiplier without rebuilding geometry or recompiling the shader.",
      semanticGroup: "material-light",
      step: 1,
      target: "surface.brightness",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    receiveShadows: {
      defaultValue: grassDefaults["surface.receiveShadows"],
      description:
        "Lets Terrain receive cast shadow maps from the field. Turning it off keeps PBR shading, AO, HDRI, and Sun Patches while removing external cast shadows from Surface.",
      label: "Receive shadows",
      orderRole: "detail",
      semanticGroup: "material-light",
      ...grassResponsive(
        "Toggles the retained Terrain mesh shadow-receive flag without rebuilding resources.",
      ),
      target: "surface.receiveShadows",
      type: "switch",
      visibleWhen: { equals: true, target: "field.showGround" },
    },
    textureScale: grassSlider({
      defaultValue: grassDefaults["surface.textureScale"],
      description:
        "Sets how often the scanned Uncut Grass surface repeats across each terrain metre.",
      label: "Current texture scale",
      max: 4,
      min: 0.25,
      performanceReason:
        "Updates retained terrain texture transforms without rebuilding geometry.",
      semanticGroup: "material-surface",
      step: 0.05,
      target: "surface.textureScale",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    normalStrength: grassSlider({
      defaultValue: grassDefaults["surface.normalStrength"],
      description:
        "Controls the scanned Uncut Grass detail contributed by the normal map.",
      label: "Current normal",
      max: 150,
      min: 0,
      performanceReason: "Updates one retained terrain material parameter.",
      semanticGroup: "material-surface",
      step: 1,
      target: "surface.normalStrength",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    roughness: grassSlider({
      defaultValue: grassDefaults["surface.roughness"],
      description:
        "Scales the Uncut Grass roughness map for softer or sharper physical highlights.",
      label: "Current roughness",
      max: 125,
      min: 25,
      performanceReason:
        "Updates one retained terrain physical-material parameter.",
      semanticGroup: "material-surface",
      step: 1,
      target: "surface.roughness",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    colorContrast: grassSlider({
      defaultValue: grassDefaults["surface.colorContrast"],
      description:
        "Expands or compresses color separation in the Uncut Grass ground texture.",
      label: "Current contrast",
      max: 200,
      min: 0,
      performanceReason: "Updates one retained ground material-color uniform.",
      semanticGroup: "material-color",
      step: 1,
      target: "surface.colorContrast",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    colorSaturation: grassSlider({
      defaultValue: grassDefaults["surface.colorSaturation"],
      description:
        "Controls chroma in the Uncut Grass ground texture without changing its PBR maps.",
      label: "Current saturation",
      max: 200,
      min: 0,
      performanceReason: "Updates one retained ground material-color uniform.",
      semanticGroup: "material-color",
      step: 1,
      target: "surface.colorSaturation",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    cloverTextureScale: grassSlider({
      defaultValue: grassDefaults["surface.cloverTextureScale"],
      description:
        "Sets the repeat scale for the calibrated 2 × 2 metre Clover Patches surface.",
      label: "Clover texture scale",
      max: 4,
      min: 0.25,
      performanceReason:
        "Updates one retained Clover texture transform without rebuilding geometry.",
      semanticGroup: "material-surface",
      step: 0.05,
      target: "surface.cloverTextureScale",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    cloverNormalStrength: grassSlider({
      defaultValue: grassDefaults["surface.cloverNormalStrength"],
      description:
        "Controls the tangent-space leaf and grass detail contributed by the Clover normal map.",
      label: "Clover normal",
      max: 150,
      min: 0,
      performanceReason: "Updates one retained Clover normal-strength uniform.",
      semanticGroup: "material-surface",
      step: 1,
      target: "surface.cloverNormalStrength",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    cloverRoughness: grassSlider({
      defaultValue: grassDefaults["surface.cloverRoughness"],
      description:
        "Scales the Clover roughness map for softer or sharper physical highlights.",
      label: "Clover roughness",
      max: 125,
      min: 25,
      performanceReason: "Updates one retained Clover roughness uniform.",
      semanticGroup: "material-surface",
      step: 1,
      target: "surface.cloverRoughness",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    cloverMaskPreview: {
      defaultValue: grassDefaults["surface.cloverMaskOffset"],
      description:
        "Shows where Clover replaces the current ground; click or drag to move the sampled region.",
      keyframeable: false,
      label: "Blend mask",
      orderRole: "spatial",
      semanticGroup: "material-blend",
      ...grassResponsive(
        "Redraws one fixed-size grayscale preview and updates retained ground-mask uniforms.",
      ),
      target: "surface.cloverMaskOffset",
      type: "grassNoisePreview",
      visibleWhen: { equals: true, target: "field.showGround" },
    },
    cloverMaskScale: grassSlider({
      defaultValue: grassDefaults["surface.cloverMaskScale"],
      description: "Sets the size of Clover and current-ground regions.",
      label: "Mask scale",
      max: 2.5,
      min: 0.08,
      performanceReason:
        "Updates bounded procedural mask frequency in the retained ground shader.",
      semanticGroup: "material-blend",
      step: 0.01,
      target: "surface.cloverMaskScale",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    cloverMaskDetail: grassSlider({
      defaultValue: grassDefaults["surface.cloverMaskDetail"],
      description: "Sets how many fractal layers shape the material boundary.",
      label: "Mask detail",
      max: 6,
      min: 1,
      performanceReason:
        "Directly controls bounded mask octaves evaluated for the ground fragment and preview.",
      performanceRole: "workload",
      semanticGroup: "material-blend",
      step: 1,
      target: "surface.cloverMaskDetail",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    cloverMaskRoughness: grassSlider({
      defaultValue: grassDefaults["surface.cloverMaskRoughness"],
      description:
        "Controls how strongly smaller mask layers break up patches.",
      label: "Mask roughness",
      max: 90,
      min: 10,
      performanceReason:
        "Updates octave weighting without changing the bounded loop limit.",
      semanticGroup: "material-blend",
      step: 1,
      target: "surface.cloverMaskRoughness",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    cloverMaskSeed: grassSlider({
      defaultValue: grassDefaults["surface.cloverMaskSeed"],
      description:
        "Chooses a deterministic material pattern independently of terrain and vegetation.",
      label: "Mask seed",
      max: 100,
      min: 0,
      performanceReason: "Updates one retained procedural-mask seed uniform.",
      semanticGroup: "material-blend",
      step: 1,
      target: "surface.cloverMaskSeed",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    cloverMaskLevels: {
      defaultValue: grassDefaults["surface.cloverMaskLevels"],
      description:
        "Maps dark noise to current ground and bright noise to Clover, with a soft blend between the handles.",
      label: "Mask black / white",
      max: 100,
      min: 0,
      orderRole: "strength",
      semanticGroup: "material-blend",
      ...grassResponsive(
        "Updates two retained mask-remap uniforms without rebuilding scene resources.",
      ),
      step: 1,
      target: "surface.cloverMaskLevels",
      type: "rangeSlider",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    },
  },
  title: "Surface",
} satisfies ToolcraftControlSectionSchema;

const surfaceBendVisibility = {
  equals: true,
  target: "surface.bendEnabled",
} as const;

export const grassSurfaceBendSection = {
  controls: {
    include: {
      defaultValue: grassDefaults["surface.bendEnabled"],
      description:
        "Turns the complete Terrain perimeter downward and keeps every vegetation and scan layer off the bent band.",
      label: "Include",
      orderRole: "mode",
      semanticGroup: "perimeter-bend",
      ...grassResponsive(
        "Changes the shared placement boundary and retained Terrain geometry.",
      ),
      target: "surface.bendEnabled",
      type: "switch",
    },
    depth: grassSlider({
      defaultValue: grassDefaults["surface.bendDepth"],
      description:
        "Sets how far the outer Terrain perimeter drops below the central surface.",
      label: "Depth",
      max: 2.5,
      min: 0,
      performanceReason:
        "Rebuilds one bounded retained Terrain grid without changing layer counts.",
      semanticGroup: "perimeter-bend",
      step: 0.05,
      target: "surface.bendDepth",
      unit: "m",
      visibleWhen: surfaceBendVisibility,
    }),
    width: grassSlider({
      defaultValue: grassDefaults["surface.bendWidth"],
      description:
        "Sets how far the bend reaches inward and defines the exact vegetation- and object-free band.",
      label: "Width",
      max: 40,
      min: 5,
      performanceReason:
        "Rebuilds bounded Terrain and placement buffers against one shared inner perimeter.",
      semanticGroup: "perimeter-bend",
      step: 1,
      target: "surface.bendWidth",
      unit: "%",
      visibleWhen: surfaceBendVisibility,
    }),
    roundness: grassSlider({
      defaultValue: grassDefaults["surface.bendRoundness"],
      description:
        "Moves the visible roll from a tighter late turn toward a fuller rounded profile.",
      label: "Roundness",
      max: 100,
      min: 0,
      performanceReason:
        "Rebuilds fixed Terrain vertex positions without changing topology.",
      semanticGroup: "perimeter-bend",
      step: 1,
      target: "surface.bendRoundness",
      unit: "%",
      visibleWhen: surfaceBendVisibility,
    }),
    smoothness: grassSlider({
      defaultValue: grassDefaults["surface.bendSmoothness"],
      description:
        "Blends the perimeter profile from a straight chamfer toward a tangent-continuous easing.",
      label: "Smoothness",
      max: 100,
      min: 0,
      performanceReason:
        "Rebuilds fixed Terrain vertex positions without changing topology.",
      semanticGroup: "perimeter-bend",
      step: 1,
      target: "surface.bendSmoothness",
      unit: "%",
      visibleWhen: surfaceBendVisibility,
    }),
  },
  title: "Surface Bend",
} satisfies ToolcraftControlSectionSchema;

export const grassSurfaceFadeSection = {
  controls: {
    width: grassSlider({
      defaultValue: grassDefaults["surface.edgeFadeWidth"],
      description:
        "Sets how far the shared transparent falloff reaches inward from the complete field perimeter across Terrain, grass, scans, and rocks. Set to zero to disable it.",
      label: "Width",
      max: 40,
      min: 0,
      performanceReason:
        "Updates one shared fixed-cost elliptical distance uniform across retained scene materials.",
      semanticGroup: "edge-fade",
      step: 1,
      target: "surface.edgeFadeWidth",
      unit: "%",
    }),
    strength: grassSlider({
      defaultValue: grassDefaults["surface.edgeFadeStrength"],
      description:
        "Controls how transparent the outer boundary becomes while keeping the center opaque.",
      label: "Strength",
      max: 100,
      min: 0,
      performanceReason:
        "Updates one shared fixed-cost alpha-mix uniform without rebuilding geometry or materials.",
      semanticGroup: "edge-fade",
      step: 1,
      target: "surface.edgeFadeStrength",
      unit: "%",
    }),
  },
  title: "Surface Fade",
} satisfies ToolcraftControlSectionSchema;

export const grassGroundShadowSection = {
  controls: {
    offsetY: grassSlider({
      defaultValue: grassDefaults["groundShadow.offsetY"],
      description:
        "Moves the complete grounding shadow below Terrain without moving the field itself.",
      label: "Vertical offset",
      max: 0,
      min: -1.5,
      performanceReason:
        "Updates one retained shadow-plane transform without rebuilding geometry or textures.",
      semanticGroup: "position",
      step: 0.01,
      target: "groundShadow.offsetY",
      unit: "m",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    offsetZ: grassSlider({
      defaultValue: grassDefaults["groundShadow.offsetZ"],
      description:
        "Moves only the shadow forward or backward along the field depth axis.",
      label: "Front / back",
      max: 3,
      min: -3,
      performanceReason:
        "Updates one retained shadow-plane transform without changing scene layout.",
      semanticGroup: "position",
      step: 0.05,
      target: "groundShadow.offsetZ",
      unit: "m",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    scale: grassSlider({
      defaultValue: grassDefaults["groundShadow.scale"],
      description:
        "Scales the complete shadow footprint uniformly around the field center without resizing Terrain.",
      label: "Scale",
      max: 200,
      min: 25,
      performanceReason:
        "Updates the retained shadow silhouette and plane scale without rebuilding geometry or textures.",
      semanticGroup: "shape",
      step: 1,
      target: "groundShadow.scale",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    blur: grassSlider({
      defaultValue: grassDefaults["groundShadow.blur"],
      description:
        "Sets the world-space softness outside the complete Field silhouette.",
      label: "Blur",
      max: 2,
      min: 0,
      performanceReason:
        "Updates one fixed-cost analytic edge-softness uniform without allocating a blur texture.",
      semanticGroup: "appearance",
      step: 0.01,
      target: "groundShadow.blur",
      unit: "m",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
    color: {
      defaultValue: grassDefaults["groundShadow.color"],
      description:
        "Sets the color blended beneath the complete ground silhouette.",
      label: "Color",
      orderRole: "color",
      semanticGroup: "appearance",
      ...grassResponsive("Updates one retained shadow-color uniform."),
      target: "groundShadow.color",
      type: "color",
      visibleWhen: { equals: true, target: "field.showGround" },
    },
    strength: grassSlider({
      defaultValue: grassDefaults["groundShadow.strength"],
      description:
        "Controls the complete shadow opacity; set to zero to remove the layer.",
      label: "Strength",
      max: 100,
      min: 0,
      performanceReason:
        "Updates one retained opacity uniform and skips the shadow draw at zero.",
      semanticGroup: "appearance",
      step: 1,
      target: "groundShadow.strength",
      unit: "%",
      visibleWhen: { equals: true, target: "field.showGround" },
    }),
  },
  title: "Ground Shadow",
} satisfies ToolcraftControlSectionSchema;
