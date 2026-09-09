import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import { DONUT_PRESET_LIBRARY_TARGET } from "./donut-preset-library";

export const donutPassIds = {
  baseGeometry: "donut.base-geometry",
  icingGeometry: "donut.icing-geometry",
  imageExport: "donut.image-export",
  previewRender: "donut.preview-render",
  sceneBootstrap: "donut.scene-bootstrap",
  sprinkleLayout: "donut.sprinkle-layout",
} as const;

type DonutPipelineContracts = {
  [donutPassIds.sceneBootstrap]: ToolcraftRendererPipelinePassContract<void>;
  [donutPassIds.baseGeometry]: ToolcraftRendererPipelinePassContract<void>;
  [donutPassIds.icingGeometry]: ToolcraftRendererPipelinePassContract<void>;
  [donutPassIds.sprinkleLayout]: ToolcraftRendererPipelinePassContract<void>;
  [donutPassIds.previewRender]: ToolcraftRendererPipelinePassContract<void>;
  [donutPassIds.imageExport]: ToolcraftRendererPipelinePassContract<void>;
};

const donutShapeTargets = [
  "donut.majorRadius",
  "donut.thickness",
  "donut.height",
  "donut.organic",
] as const;

const icingGeometryTargets = [
  "icing.coverage",
  "icing.thickness",
  "icing.flow",
  "icing.dripAmount",
  "icing.dripFrequency",
  "icing.detail",
] as const;

const icingGeometryDiscreteTargets = ["icing.clearMode"] as const;

const icingVisibilityTargets = ["icing.enabled"] as const;

const sprinkleDragTargets = [
  "sprinkles.flow",
  "sprinkles.scale",
  "sprinkles.seed",
  "sprinkles.coverage",
  "sprinkles.sizeVariation",
  "sprinkles.rotation",
  "sprinkles.surfaceOffset",
] as const;

const sprinkleDiscreteTargets = [
  "sprinkles.shape",
  "sprinkles.palette",
  "sprinkles.solidColor",
  "sprinkles.clear",
] as const;

const styleDragTargets = [
  "material.donut.bake",
  "material.donut.roughness",
  "material.donut.subsurface",
  "material.donut.softness",
  "material.donut.coat",
  "material.donut.sheen",
  "material.donut.moisture",
  "material.donut.pores",
  "material.donut.variation",
  "material.icing.roughness",
  "material.icing.subsurface",
  "material.icing.coat",
  "material.icing.sheen",
  "material.icing.glaze",
  "material.icing.texture",
  "sprinkles.metallic",
  "material.sprinkle.roughness",
  "material.sprinkle.coat",
  "material.plate.roughness",
  "material.plate.coat",
  "studio.environmentBlur",
  "studio.environmentStrength",
  "studio.environmentRotation",
  "studio.shadowStrength",
  "studio.shadowSoftness",
  "studio.key.power",
  "studio.key.size",
  "studio.warm.power",
  "studio.warm.size",
  "studio.cool.power",
  "studio.cool.size",
] as const;

const styleDiscreteTargets = [
  "donut.preset",
  "material.donut.color",
  "icing.color",
  "material.plate.color",
  "scene.plateVisible",
  "studio.hdriVisible",
  "studio.shadowsEnabled",
  "studio.key.color",
  "studio.warm.color",
  "studio.cool.color",
  "export.includeBackground",
  "appearance.background",
] as const;

const canvasTargets = [
  "canvas.aspectRatio",
  "canvas.size.width",
  "canvas.size.height",
] as const;

const retainedPasses = [
  donutPassIds.sceneBootstrap,
  donutPassIds.baseGeometry,
  donutPassIds.icingGeometry,
  donutPassIds.sprinkleLayout,
  donutPassIds.previewRender,
] as const;

export const rendererPipelineRegistration =
  registerToolcraftRendererPipeline<DonutPipelineContracts>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: retainedPasses,
        targets: ["runtime.initial-render"],
      },
      {
        interaction: "control-drag",
        invalidates: [
          donutPassIds.baseGeometry,
          donutPassIds.icingGeometry,
          donutPassIds.sprinkleLayout,
          donutPassIds.previewRender,
        ],
        mustNotInvalidate: [donutPassIds.sceneBootstrap],
        targets: donutShapeTargets,
      },
      {
        interaction: "control-drag",
        invalidates: [
          donutPassIds.icingGeometry,
          donutPassIds.sprinkleLayout,
          donutPassIds.previewRender,
        ],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
        ],
        targets: icingGeometryTargets,
      },
      {
        interaction: "control-drag",
        invalidates: [
          donutPassIds.sprinkleLayout,
          donutPassIds.previewRender,
        ],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
          donutPassIds.icingGeometry,
        ],
        targets: sprinkleDragTargets,
      },
      {
        interaction: "control-drag",
        invalidates: [donutPassIds.previewRender],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
          donutPassIds.icingGeometry,
          donutPassIds.sprinkleLayout,
        ],
        targets: styleDragTargets,
      },
      {
        interaction: "control-drag",
        invalidates: [donutPassIds.previewRender],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
          donutPassIds.icingGeometry,
          donutPassIds.sprinkleLayout,
        ],
        targets: ["scene.orientation"],
      },
      {
        interaction: "control-drag",
        invalidates: [donutPassIds.previewRender],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
          donutPassIds.icingGeometry,
          donutPassIds.sprinkleLayout,
        ],
        targets: ["canvas.renderScale"],
      },
      {
        interaction: "control-change",
        invalidates: [
          donutPassIds.icingGeometry,
          donutPassIds.sprinkleLayout,
          donutPassIds.previewRender,
        ],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
        ],
        targets: icingGeometryDiscreteTargets,
      },
      {
        interaction: "control-change",
        invalidates: [donutPassIds.previewRender],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
          donutPassIds.icingGeometry,
          donutPassIds.sprinkleLayout,
        ],
        targets: icingVisibilityTargets,
      },
      {
        interaction: "control-change",
        invalidates: [
          donutPassIds.sprinkleLayout,
          donutPassIds.previewRender,
        ],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
          donutPassIds.icingGeometry,
        ],
        targets: sprinkleDiscreteTargets,
      },
      {
        interaction: "control-change",
        invalidates: [donutPassIds.previewRender],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
          donutPassIds.icingGeometry,
          donutPassIds.sprinkleLayout,
        ],
        targets: styleDiscreteTargets,
      },
      {
        interaction: "control-change",
        invalidates: [donutPassIds.previewRender],
        mustNotInvalidate: [
          donutPassIds.sceneBootstrap,
          donutPassIds.baseGeometry,
          donutPassIds.icingGeometry,
          donutPassIds.sprinkleLayout,
        ],
        targets: canvasTargets,
      },
      {
        interaction: "control-change",
        invalidates: [],
        mustNotInvalidate: retainedPasses,
        targets: [DONUT_PRESET_LIBRARY_TARGET],
      },
      {
        interaction: "control-change",
        invalidates: [],
        mustNotInvalidate: retainedPasses,
        targets: ["export.image.format", "export.image.resolution"],
      },
      {
        interaction: "viewport-drag",
        invalidates: [],
        mustNotInvalidate: retainedPasses,
        targets: ["runtime.canvas.viewport"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: [],
        mustNotInvalidate: retainedPasses,
        targets: ["runtime.canvas.viewport"],
      },
      {
        interaction: "export",
        invalidates: [donutPassIds.imageExport],
        mustNotInvalidate: retainedPasses,
        targets: [
          "export.png",
          "export.image.format",
          "export.image.resolution",
          "export.includeBackground",
        ],
      },
    ],
    passes: [
      {
        cacheKey: [
          "donut-reference.bin",
          "brown_photostudio_02_1k.hdr",
          "megascans-donut-basecolor-2k.jpg",
          "megascans-donut-normal-2k.jpg",
          "megascans-donut-roughness-2k.jpg",
        ],
        cost: {
          dimensions: [],
          frequency: "once",
          relationship: "constant",
        },
        id: donutPassIds.sceneBootstrap,
        inputs: [
          "Blender-derived Base and Plate geometry",
          "studio environment derived from the source HDRI",
          "user-supplied scanned donut BaseColor, Normal, and Roughness atlases",
          "authored material and light constants",
        ],
        invalidatedBy: ["runtime.initial-render"],
        kind: "preprocess",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "source",
        quality: "full",
        runsOn: "main",
      },
      {
        cacheKey: ["donut shape settings"],
        cost: {
          dimensions: [],
          frequency: "interaction",
          relationship: "constant",
        },
        id: donutPassIds.baseGeometry,
        inputs: ["authored Base positions", "donut shape settings"],
        invalidatedBy: donutShapeTargets,
        kind: "vector-build",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "main",
      },
      {
        cacheKey: ["donut shape settings", "icing geometry settings"],
        cost: {
          dimensions: [],
          frequency: "interaction",
          relationship: "constant",
        },
        id: donutPassIds.icingGeometry,
        inputs: [
          "authored icing torus profile",
          "donut shape settings",
          "icing formation settings",
        ],
        invalidatedBy: [
          ...donutShapeTargets,
          ...icingGeometryTargets,
          ...icingGeometryDiscreteTargets,
        ],
        kind: "vector-build",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "main",
      },
      {
        cacheKey: [
          "donut shape settings",
          "icing surface settings",
          "sprinkle settings",
        ],
        cost: {
          dimensions: ["sprinkle-flow"],
          frequency: "interaction",
          relationship: "linear",
        },
        id: donutPassIds.sprinkleLayout,
        inputs: [
          "canonical current icing surface sampler",
          "donut shape settings",
          "icing surface settings",
          "sprinkle settings",
        ],
        invalidatedBy: [
          ...donutShapeTargets,
          ...icingGeometryTargets,
          ...icingGeometryDiscreteTargets,
          ...sprinkleDragTargets,
          ...sprinkleDiscreteTargets,
        ],
        kind: "vector-build",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["sprinkle-flow"],
          frequency: "interaction",
          relationship: "linear",
        },
        id: donutPassIds.previewRender,
        inputs: [
          "retained Three.js scene",
          "camera pose",
          "deformed Base",
          "icing geometry",
          "sprinkle instances",
          "procedural edible-PBR physical materials",
          "HDR environment and authored area lights",
          "demand-driven retained shadow map",
        ],
        invalidatedBy: [
          ...donutShapeTargets,
          ...icingGeometryTargets,
          ...icingGeometryDiscreteTargets,
          ...icingVisibilityTargets,
          ...sprinkleDragTargets,
          ...sprinkleDiscreteTargets,
          ...styleDragTargets,
          ...styleDiscreteTargets,
          ...canvasTargets,
          "scene.orientation",
          "canvas.renderScale",
        ],
        kind: "vector-build",
        lifecycle: { cache: "none", resourceScope: "renderer" },
        output: "preview",
        quality: "full",
        runsOn: "gpu",
      },
      {
        cost: {
          dimensions: ["sprinkle-flow", "image-long-edge"],
          frequency: "batch",
          relationship: "product",
        },
        id: donutPassIds.imageExport,
        inputs: [
          "canonical retained scene builder",
          "current Toolcraft state",
          "shared procedural edible-PBR shader",
          "selected image dimensions",
        ],
        invalidatedBy: [
          "export.png",
          "export.image.format",
          "export.image.resolution",
          "export.includeBackground",
        ],
        kind: "export",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "export",
        quality: "export",
        runsOn: "export-only",
      },
    ],
    runtimeId: "donut-studio.renderer@11",
  });

export const donutPipelinePasses = {
  baseGeometry: rendererPipelineRegistration.getPass(
    donutPassIds.baseGeometry,
  ),
  icingGeometry: rendererPipelineRegistration.getPass(
    donutPassIds.icingGeometry,
  ),
  imageExport: rendererPipelineRegistration.getPass(donutPassIds.imageExport),
  previewRender: rendererPipelineRegistration.getPass(
    donutPassIds.previewRender,
  ),
  sceneBootstrap: rendererPipelineRegistration.getPass(
    donutPassIds.sceneBootstrap,
  ),
  sprinkleLayout: rendererPipelineRegistration.getPass(
    donutPassIds.sprinkleLayout,
  ),
} as const;
