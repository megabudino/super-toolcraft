import { donutPresetControlSections } from "./donut-preset-schema";
import { DONUT_DEFAULT_PRESET_ORIENTATION } from "./donut-presets";
import { donutStudioControlSections } from "./donut-studio-schema";
import type { DonutLightSettings } from "./donut-types";
import { DONUT_DEFAULTS } from "./donut-values";

const responsive = (performanceReason: string) =>
  ({
    performanceReason,
    performanceRole: "responsiveness",
  }) as const;

function slider(
  label: string,
  target: string,
  defaultValue: number,
  min: number,
  max: number,
  performanceReason: string,
  step = 0.01,
  unit?: string,
) {
  return {
    defaultValue,
    label,
    max,
    min,
    sliderValueKind: "continuous" as const,
    step,
    target,
    type: "slider" as const,
    ...(unit ? { unit } : {}),
    ...responsive(performanceReason),
  };
}

function color(
  label: string | false,
  target: string,
  defaultValue: string,
  performanceReason: string,
) {
  return {
    defaultValue,
    label,
    target,
    type: "color" as const,
    ...responsive(performanceReason),
  };
}

function lightSection(
  id: string,
  title: string,
  prefix: "studio.cool" | "studio.key" | "studio.warm",
  defaults: DonutLightSettings,
  maxPower: number,
) {
  return {
    controls: {
      power: slider(
        "Power",
        `${prefix}.power`,
        defaults.power,
        0,
        maxPower,
        `${title} power updates one retained area light.`,
        10,
      ),
      color: color(
        "Color",
        `${prefix}.color`,
        defaults.color,
        `${title} color updates one retained area light.`,
      ),
      size: slider(
        "Size",
        `${prefix}.size`,
        defaults.size,
        0.25,
        12,
        `${title} size updates the retained area-light emitter.`,
        0.05,
      ),
    },
    id,
    title,
  };
}

export const donutControlSections = [
  ...donutPresetControlSections,
  {
    controls: {
      majorRadius: slider(
        "Ring",
        "donut.majorRadius",
        DONUT_DEFAULTS.donut.majorRadius,
        0.78,
        1.28,
        "Ring radius deforms the authored Base and reflows coating and sprinkles.",
      ),
      thickness: slider(
        "Thickness",
        "donut.thickness",
        DONUT_DEFAULTS.donut.thickness,
        0.65,
        1.35,
        "Thickness deforms the authored Base and dependent surface geometry.",
      ),
      height: slider(
        "Height",
        "donut.height",
        DONUT_DEFAULTS.donut.height,
        0.65,
        1.35,
        "Height changes the vertical Base profile and dependent surface geometry.",
      ),
      organic: slider(
        "Organic",
        "donut.organic",
        DONUT_DEFAULTS.donut.organic,
        0,
        2,
        "Organic amount applies bounded source-like surface variation.",
      ),
      orientation: {
        defaultValue: {
          position: [...DONUT_DEFAULT_PRESET_ORIENTATION.position],
          up: [...DONUT_DEFAULT_PRESET_ORIENTATION.up],
        },
        keyframeable: false,
        label: false,
        target: "scene.orientation",
        type: "orientationGizmo" as const,
        ...responsive(
          "Orbit updates the retained root without rebuilding product geometry.",
        ),
      },
    },
    id: "donut-shape",
    title: "Donut Shape",
  },
  {
    controls: {
      baseColor: color(
        "Color",
        "material.donut.color",
        DONUT_DEFAULTS.materials.donut.color,
        "Base color updates the authored donut material.",
      ),
      roughness: slider(
        "Roughness",
        "material.donut.roughness",
        DONUT_DEFAULTS.materials.donut.roughness,
        0.05,
        1,
        "Roughness updates one retained physical material.",
      ),
      subsurface: slider(
        "Subsurface",
        "material.donut.subsurface",
        DONUT_DEFAULTS.materials.donut.subsurface,
        0,
        1,
        "Subsurface controls the bounded edible-softness shading response.",
      ),
      softness: slider(
        "Softness",
        "material.donut.softness",
        DONUT_DEFAULTS.materials.donut.softness,
        0,
        0.5,
        "Softness scales the source subsurface response.",
      ),
      coat: slider(
        "Coat",
        "material.donut.coat",
        DONUT_DEFAULTS.materials.donut.coat,
        0,
        1,
        "Coat updates the retained donut material highlight.",
      ),
      sheen: slider(
        "Sheen",
        "material.donut.sheen",
        DONUT_DEFAULTS.materials.donut.sheen,
        0,
        1,
        "Sheen updates the retained donut material edge response.",
      ),
    },
    id: "donut-material",
    title: "Donut Material",
  },
  {
    controls: {
      bake: slider(
        "Bake",
        "material.donut.bake",
        DONUT_DEFAULTS.materials.donut.bake,
        0,
        1,
        "Bake controls caramelised low-frequency colour variation in the retained edible shader.",
      ),
      pores: slider(
        "Pores",
        "material.donut.pores",
        DONUT_DEFAULTS.materials.donut.pores,
        0,
        1,
        "Pores controls fine crumb dimples without changing mesh tessellation.",
      ),
      moisture: slider(
        "Moisture",
        "material.donut.moisture",
        DONUT_DEFAULTS.materials.donut.moisture,
        0,
        1,
        "Moisture softens roughness and increases bounded light transmission.",
      ),
      variation: slider(
        "Variation",
        "material.donut.variation",
        DONUT_DEFAULTS.materials.donut.variation,
        0,
        1,
        "Variation controls natural colour and roughness breakup across the baked surface.",
      ),
    },
    id: "donut-surface",
    title: "Donut Surface",
  },
  {
    controls: {
      enabled: {
        defaultValue: DONUT_DEFAULTS.icing.enabled,
        description:
          "Enable the coating generated by the Blender icing node group.",
        label: "Include",
        target: "icing.enabled",
        type: "switch" as const,
        ...responsive("Include attaches or detaches the retained icing mesh."),
      },
      coverage: slider(
        "Coverage",
        "icing.coverage",
        DONUT_DEFAULTS.icing.coverage,
        0.55,
        1.25,
        "Coverage rebuilds fixed-tessellation coating geometry.",
      ),
      thickness: slider(
        "Thickness",
        "icing.thickness",
        DONUT_DEFAULTS.icing.thickness,
        0.55,
        1.45,
        "Thickness changes the visible depth of the fixed-tessellation coating shell.",
      ),
      clear: {
        actions: [
          { label: "Base", value: "icing.clear.base" },
          { label: "Detail", value: "icing.clear.detail" },
        ],
        defaultValue: "none",
        description:
          "Base removes the coating result; Detail keeps a smooth top shell.",
        label: "Clear",
        target: "icing.clearMode",
        type: "actions" as const,
        ...responsive("Clear switches between retained icing result states."),
      },
    },
    id: "icing-shape",
    title: "Icing Shape",
  },
  {
    controls: {
      flow: slider(
        "Flow",
        "icing.flow",
        DONUT_DEFAULTS.icing.flow,
        0,
        2,
        "Flow controls how far a continuous patch of icing relaxes into each smooth drip.",
      ),
      dripAmount: slider(
        "Drip length",
        "icing.dripAmount",
        DONUT_DEFAULTS.icing.dripAmount,
        0,
        2,
        "Drip length controls the vertical reach of the viscous icing edge.",
      ),
      dripFrequency: slider(
        "Drip frequency",
        "icing.dripFrequency",
        DONUT_DEFAULTS.icing.dripFrequency,
        0.5,
        2,
        "Drip frequency changes the deterministic large and small drip cadence.",
      ),
      detail: slider(
        "Detail",
        "icing.detail",
        DONUT_DEFAULTS.icing.detail,
        0,
        2,
        "Detail adds bounded secondary breakup to the smooth flow field without increasing tessellation.",
      ),
    },
    id: "icing-flow",
    title: "Icing Flow",
  },
  {
    controls: {
      icingColor: color(
        "Color",
        "icing.color",
        DONUT_DEFAULTS.icing.color,
        "Icing color updates the source-driven coating material.",
      ),
      roughness: slider(
        "Roughness",
        "material.icing.roughness",
        DONUT_DEFAULTS.materials.icing.roughness,
        0.05,
        1,
        "Roughness updates one retained physical material.",
      ),
      subsurface: slider(
        "Subsurface",
        "material.icing.subsurface",
        DONUT_DEFAULTS.materials.icing.subsurface,
        0,
        1,
        "Subsurface controls the bounded soft icing response.",
      ),
      coat: slider(
        "Coat",
        "material.icing.coat",
        DONUT_DEFAULTS.materials.icing.coat,
        0,
        1,
        "Coat updates icing highlights.",
      ),
      sheen: slider(
        "Sheen",
        "material.icing.sheen",
        DONUT_DEFAULTS.materials.icing.sheen,
        0,
        1,
        "Sheen updates icing edge response.",
      ),
      glaze: slider(
        "Glaze",
        "material.icing.glaze",
        DONUT_DEFAULTS.materials.icing.glaze,
        0,
        1,
        "Glaze balances wet clear highlights, roughness, and bounded transmission.",
      ),
      texture: slider(
        "Texture",
        "material.icing.texture",
        DONUT_DEFAULTS.materials.icing.texture,
        0,
        1,
        "Texture adds subtle hand-spread marbling and micro-normal breakup.",
      ),
    },
    id: "icing-material",
    title: "Icing Material",
  },
  {
    controls: {
      flow: {
        ...slider(
          "Flow",
          "sprinkles.flow",
          DONUT_DEFAULTS.sprinkles.flow,
          0,
          2,
          "Flow controls visible instance count up to the enforced 900-sprinkle boundary.",
        ),
        performanceRole: "workload" as const,
      },
      scale: slider(
        "Scale",
        "sprinkles.scale",
        DONUT_DEFAULTS.sprinkles.scale,
        0.2,
        1.5,
        "Scale updates retained instance matrices.",
      ),
      shape: {
        defaultValue: String(DONUT_DEFAULTS.sprinkles.shape),
        label: "Shape",
        options: [
          { label: "Pellet", value: "1" },
          { label: "Pearl", value: "2" },
          { label: "Rod", value: "3" },
        ],
        target: "sprinkles.shape",
        type: "segmented" as const,
        ...responsive("Shape swaps one shared instanced geometry."),
      },
      palette: {
        defaultValue: String(DONUT_DEFAULTS.sprinkles.palette),
        label: "Palette",
        options: [
          { label: "Solid", value: "1" },
          { label: "Pastel", value: "2" },
          { label: "Candy", value: "3" },
          { label: "Rainbow", value: "4" },
          { label: "Cocoa", value: "5" },
        ],
        target: "sprinkles.palette",
        type: "select" as const,
        ...responsive("Palette rewrites retained instance colors."),
      },
      solidColor: {
        ...color(
          "Solid colour",
          "sprinkles.solidColor",
          DONUT_DEFAULTS.sprinkles.solidColor,
          "Solid colour rewrites retained instance colors in the Solid branch.",
        ),
        visibleWhen: { equals: "1", target: "sprinkles.palette" },
      },
      clear: {
        actions: [{ label: "Clear", value: "sprinkles.clear" }],
        defaultValue: false,
        label: "Simulation",
        target: "sprinkles.clear",
        type: "actions" as const,
        ...responsive("Clear hides retained sprinkle instances."),
      },
    },
    id: "sprinkles",
    title: "Sprinkles",
  },
  {
    controls: {
      seed: slider(
        "Seed",
        "sprinkles.seed",
        DONUT_DEFAULTS.sprinkles.seed,
        0,
        999,
        "Seed regenerates deterministic placement and colors.",
        1,
      ),
      coverage: slider(
        "Coverage",
        "sprinkles.coverage",
        DONUT_DEFAULTS.sprinkles.coverage,
        0.25,
        1,
        "Coverage changes the icing surface band used for emission.",
      ),
      sizeVariation: slider(
        "Size variation",
        "sprinkles.sizeVariation",
        DONUT_DEFAULTS.sprinkles.sizeVariation,
        0,
        2,
        "Size variation updates retained instance matrices.",
      ),
      rotation: slider(
        "Rotation",
        "sprinkles.rotation",
        DONUT_DEFAULTS.sprinkles.rotation,
        0,
        2,
        "Rotation changes deterministic tangent orientation.",
      ),
      surfaceOffset: slider(
        "Surface offset",
        "sprinkles.surfaceOffset",
        DONUT_DEFAULTS.sprinkles.surfaceOffset,
        -0.15,
        0.15,
        "Zero gives natural icing contact; negative values embed sprinkles deeper and positive values lift them along the coating normal.",
      ),
    },
    id: "sprinkle-distribution",
    title: "Distribution",
  },
  {
    controls: {
      metallic: slider(
        "Metallic",
        "sprinkles.metallic",
        DONUT_DEFAULTS.sprinkles.metallic,
        0,
        1,
        "Metallic updates the shared sprinkle material.",
      ),
      roughness: slider(
        "Roughness",
        "material.sprinkle.roughness",
        DONUT_DEFAULTS.materials.sprinkle.roughness,
        0.05,
        1,
        "Roughness updates the shared sprinkle material.",
      ),
      coat: slider(
        "Coat",
        "material.sprinkle.coat",
        DONUT_DEFAULTS.materials.sprinkle.coat,
        0,
        1,
        "Coat updates the shared sprinkle material highlight.",
      ),
    },
    id: "sprinkle-material",
    title: "Sprinkle Material",
  },
  {
    controls: {
      plateVisible: {
        defaultValue: DONUT_DEFAULTS.plateVisible,
        label: "Include",
        target: "scene.plateVisible",
        type: "switch" as const,
        ...responsive("Include changes one retained scene object."),
      },
      plateColor: color(
        "Color",
        "material.plate.color",
        DONUT_DEFAULTS.materials.plate.color,
        "Plate color updates the authored ceramic material.",
      ),
      roughness: slider(
        "Roughness",
        "material.plate.roughness",
        DONUT_DEFAULTS.materials.plate.roughness,
        0.05,
        1,
        "Roughness updates the retained ceramic material.",
      ),
      coat: slider(
        "Coat",
        "material.plate.coat",
        DONUT_DEFAULTS.materials.plate.coat,
        0,
        1,
        "Coat updates the retained ceramic material highlight.",
      ),
    },
    id: "plate",
    title: "Plate",
  },
  ...donutStudioControlSections,
  lightSection(
    "key-light",
    "Key Light",
    "studio.key",
    DONUT_DEFAULTS.studio.key,
    6000,
  ),
  lightSection(
    "warm-light",
    "Warm Light",
    "studio.warm",
    DONUT_DEFAULTS.studio.warm,
    2500,
  ),
  lightSection(
    "cool-light",
    "Cool Light",
    "studio.cool",
    DONUT_DEFAULTS.studio.cool,
    2000,
  ),
  {
    controls: {
      includeBackground: {
        defaultValue: DONUT_DEFAULTS.background.include,
        label: "Include",
        target: "export.includeBackground",
        type: "switch" as const,
        ...responsive("Background inclusion changes preview and still export."),
      },
      background: color(
        false,
        "appearance.background",
        DONUT_DEFAULTS.background.color,
        "Background color changes the camera-ray studio color.",
      ),
    },
    layoutGroups: [
      {
        columns: 2 as const,
        controls: ["includeBackground", "background"],
        layout: "inline" as const,
      },
    ],
    id: "background",
    title: "Background",
  },
  {
    controls: {
      imageFormat: {
        defaultValue: DONUT_DEFAULTS.image.format,
        label: "Format",
        options: [
          { label: "PNG", value: "png" },
          { label: "JPG", value: "jpg" },
        ],
        target: "export.image.format",
        type: "select" as const,
        ...responsive("Format selects alpha-capable PNG or opaque JPEG."),
      },
      imageResolution: {
        defaultValue: DONUT_DEFAULTS.image.resolution,
        label: "Resolution",
        options: [
          { label: "2K", value: "2k" },
          { label: "4K", value: "4k" },
          { label: "8K", value: "8k" },
        ],
        performanceReason:
          "Selected long edge controls batch WebGL fill and encoding through 8192 pixels.",
        performanceRole: "workload" as const,
        target: "export.image.resolution",
        type: "select" as const,
      },
    },
    layoutGroups: [
      {
        columns: 2 as const,
        controls: ["imageFormat", "imageResolution"],
        layout: "inline" as const,
      },
    ],
    id: "image-export",
    title: "Image Export",
  },
  {
    actionGroup: "secondary" as const,
    controls: {
      outputActions: {
        actions: [
          {
            icon: "upload-simple",
            label: "Export PNG",
            role: "export-image",
            value: "export.png",
          },
        ],
        target: "actions.output",
        type: "panelActions" as const,
      },
    },
  },
] as const;
