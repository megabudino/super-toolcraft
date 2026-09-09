import {
  registerToolcraftRendererPipeline,
  type ToolcraftRendererPipelinePassContract,
} from "@/toolcraft/runtime";

import type { HeroParams } from "../domain/hero-params";

export type HeroRenderFrame = Readonly<{
  /** Logical scene aspect; preview zoom/backing rounding must not move the camera. */
  projectionAspect?: number;
  fullHeight: number;
  fullWidth: number;
  height: number;
  tileX: number;
  tileY: number;
  width: number;
}>;

export type HeroRendererResource = Readonly<{
  dispose(): void;
  prepareEnvironment(params: HeroParams): void;
  prepareGeometry(params: HeroParams): void;
  prepareFrame(params: HeroParams, frame: HeroRenderFrame): void;
  render(params: HeroParams, frame: HeroRenderFrame): void;
  renderPrepared(params: HeroParams): void;
  waitForFrame(): Promise<void>;
  setSize(width: number, height: number): void;
}>;

type HeroRendererPasses = {
  environment: ToolcraftRendererPipelinePassContract<void>;
  geometry: ToolcraftRendererPipelinePassContract<void>;
  resources: ToolcraftRendererPipelinePassContract<
    HeroRendererResource,
    HeroRendererResource,
    readonly [HTMLCanvasElement, string]
  >;
  shade: ToolcraftRendererPipelinePassContract<void>;
  shadow: ToolcraftRendererPipelinePassContract<void>;
};

export const structureSliderTargets = [
  "structure.radius",
  "structure.domeLength",
  "structure.arc",
  "structure.spacing",
  "structure.count",
  "rib.width",
  "rib.depth",
  "rib.corner",
  "rib.taperStart",
  "rib.taperTip",
] as const;

const structureValueTargets = ["structure.shape", "rib.taperSide"] as const;

export const shadowSliderTargets = [
  "flow.travel",
  "structure.twist",
  "structure.wave",
  "structure.waveLength",
  "camera.height",
  "camera.yaw",
  "camera.pitch",
  "camera.roll",
  "camera.fov",
  "light.azimuth",
  "light.elevation",
  "light.intensity",
  "light.shadowSoftness",
] as const;

const shadowValueTargets = [
  "flow.direction",
  "camera.position",
  "light.color",
  "light.shadows",
] as const;

export const shadeSliderTargets = [
  "flow.glowOrbit",
  "flow.glowOrbitRadius",
  "light.ambient",
  "sky.envIntensity",
  "sky.fogNear",
  "sky.fogFar",
  "material.roughness",
  "material.clearcoat",
  "material.clearcoatRoughness",
  "post.exposure",
  "post.bloom",
  "post.bloomThreshold",
  "post.occlusion",
  "post.occlusionRadius",
  "post.focus",
  "post.aperture",
  "haze.strength",
  "haze.glowRadius",
  "haze.glowStrength",
] as const;

const shadeValueTargets = [
  "export.includeBackground",
  "appearance.background",
  "sky.gradient",
  "sky.fogColor",
  "light.skyColor",
  "light.groundColor",
  "material.color",
  "post.depthOfField",
  "haze.gradient",
  "haze.blend",
  "haze.glowColor",
  "haze.glowPosition",
] as const;

const maskTargets = ["masks.items", "masks.enabled", "masks.preview"] as const;

export const heroRendererPipelineRegistration =
  registerToolcraftRendererPipeline<HeroRendererPasses>()({
    interactionInvalidation: [
      {
        interaction: "initial-render",
        invalidates: ["resources", "geometry", "environment", "shadow", "shade"],
        targets: ["canvas.initial-render"],
      },
      {
        interaction: "control-drag",
        invalidates: ["geometry", "shadow", "shade"],
        mustNotInvalidate: ["resources", "environment"],
        retainedAccesses: ["resources"],
        targets: structureSliderTargets,
      },
      {
        interaction: "control-change",
        invalidates: ["geometry", "shadow", "shade"],
        mustNotInvalidate: ["resources", "environment"],
        retainedAccesses: ["resources"],
        targets: structureValueTargets,
      },
      {
        interaction: "control-drag",
        invalidates: ["shadow", "shade"],
        mustNotInvalidate: ["resources", "geometry", "environment"],
        retainedAccesses: ["resources"],
        targets: shadowSliderTargets,
      },
      {
        interaction: "control-change",
        invalidates: ["shadow", "shade"],
        mustNotInvalidate: ["resources", "geometry", "environment"],
        retainedAccesses: ["resources"],
        targets: shadowValueTargets,
      },
      {
        interaction: "control-drag",
        invalidates: ["shade"],
        mustNotInvalidate: ["resources", "geometry", "environment", "shadow"],
        retainedAccesses: ["resources"],
        targets: shadeSliderTargets,
      },
      {
        interaction: "timeline-playback",
        invalidates: ["shadow", "shade"],
        mustNotInvalidate: ["resources", "geometry", "environment"],
        retainedAccesses: ["resources"],
        targets: ["timeline.time"],
      },
      {
        interaction: "timeline-scrub",
        invalidates: ["shadow", "shade"],
        mustNotInvalidate: ["resources", "geometry", "environment"],
        retainedAccesses: ["resources"],
        targets: ["timeline.time"],
      },
      {
        interaction: "control-change",
        invalidates: ["shade"],
        mustNotInvalidate: ["resources", "geometry", "environment", "shadow"],
        retainedAccesses: ["resources"],
        targets: shadeValueTargets,
      },
      {
        interaction: "mask-drag",
        invalidates: ["shade"],
        mustNotInvalidate: ["resources", "geometry", "environment", "shadow"],
        retainedAccesses: ["resources"],
        targets: ["masks.items"],
      },
      {
        interaction: "control-drag",
        invalidates: ["shade"],
        mustNotInvalidate: ["resources", "geometry", "environment", "shadow"],
        retainedAccesses: ["resources"],
        targets: ["masks.items"],
      },
      {
        interaction: "control-change",
        invalidates: ["shade"],
        mustNotInvalidate: ["resources", "geometry", "environment", "shadow"],
        retainedAccesses: ["resources"],
        targets: maskTargets,
      },
      {
        interaction: "control-change",
        invalidates: ["environment", "shade"],
        mustNotInvalidate: ["resources", "geometry", "shadow"],
        retainedAccesses: ["resources"],
        targets: ["sky.lightGradient"],
      },
      {
        interaction: "control-change",
        invalidates: ["shade"],
        mustNotInvalidate: ["resources", "geometry", "environment", "shadow"],
        retainedAccesses: ["resources"],
        targets: [
          "canvas.aspectRatio",
          "canvas.size.width",
          "canvas.size.height",
          "canvas.renderScale",
          "wave.frame.width",
          "wave.frame.height",
        ],
      },
      {
        interaction: "control-change",
        invalidates: ["shade"],
        mustNotInvalidate: ["resources", "geometry", "environment", "shadow"],
        retainedAccesses: ["resources"],
        targets: ["wave.frame.position"],
      },
      {
        interaction: "viewport-drag",
        invalidates: ["shade"],
        mustNotInvalidate: ["resources", "geometry", "environment", "shadow"],
        retainedAccesses: ["resources"],
        targets: ["canvas.viewport.offset"],
      },
      {
        interaction: "viewport-zoom",
        invalidates: ["shade"],
        mustNotInvalidate: ["resources", "geometry", "environment", "shadow"],
        retainedAccesses: ["resources"],
        targets: ["canvas.viewport.zoom"],
      },
      {
        interaction: "control-change",
        invalidates: ["geometry", "environment", "shadow", "shade"],
        mustNotInvalidate: ["resources"],
        retainedAccesses: ["resources"],
        targets: ["presets.apply"],
      },
    ],
    passes: [
      {
        cacheKey: ["preview-canvas", "renderer-version"],
        cost: { dimensions: [], frequency: "once", relationship: "constant" },
        gpu: {
          resources: "sampled-textures",
          stage: "render",
          state: "stateless",
          surfaces: ["preview"],
        },
        id: "resources",
        inputs: ["preview-canvas", "renderer-version"],
        invalidatedBy: ["preview-canvas", "renderer-version"],
        kind: "preprocess",
        lifecycle: { cache: "retained-resource", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "gpu",
      },
      {
        cacheKey: ["renderer", "structure-key"],
        cost: { dimensions: ["rib-count"], frequency: "interaction", relationship: "linear" },
        id: "geometry",
        inputs: ["renderer", "structure-key"],
        invalidatedBy: [...structureSliderTargets, ...structureValueTargets],
        kind: "vector-build",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "main",
      },
      {
        cacheKey: ["renderer", "environment-key"],
        cost: { dimensions: [], frequency: "discrete", relationship: "constant" },
        gpu: {
          resources: "sampled-textures",
          stage: "render",
          state: "stateless",
          surfaces: ["preview"],
        },
        id: "environment",
        inputs: ["renderer", "environment-key"],
        invalidatedBy: ["sky.lightGradient"],
        kind: "preprocess",
        lifecycle: { cache: "memoized", resourceScope: "renderer" },
        output: "intermediate",
        quality: "full",
        runsOn: "gpu",
      },
      {
        cost: { dimensions: [], frequency: "frame", relationship: "constant" },
        id: "shadow",
        inputs: [
          "geometry",
          "environment",
          ...shadowSliderTargets,
          ...shadowValueTargets,
          "timeline.time",
        ],
        invalidatedBy: [
          ...structureSliderTargets,
          ...structureValueTargets,
          ...shadowSliderTargets,
          ...shadowValueTargets,
          "timeline.time",
        ],
        kind: "composite",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "intermediate",
        quality: "full",
        runsOn: "main",
      },
      {
        cost: {
          dimensions: ["wave-width", "wave-height", "rib-count"],
          frequency: "frame",
          relationship: "product",
        },
        gpu: {
          resources: "sampled-textures",
          stage: "render",
          state: "stateless",
          surfaces: ["preview"],
        },
        id: "shade",
        inputs: [
          "shadow",
          ...shadeSliderTargets,
          ...shadeValueTargets,
          ...maskTargets,
          "canvas.backing",
          "timeline.time",
        ],
        invalidatedBy: [
          ...structureSliderTargets,
          ...structureValueTargets,
          ...shadowSliderTargets,
          ...shadowValueTargets,
          ...shadeSliderTargets,
          ...shadeValueTargets,
          ...maskTargets,
          "sky.lightGradient",
          "canvas.backing",
          "wave.frame.width",
          "wave.frame.height",
          "timeline.time",
        ],
        kind: "composite",
        lifecycle: { cache: "none", resourceScope: "call" },
        output: "preview",
        quality: "retina",
        runsOn: "gpu",
      },
    ],
    runtimeId: "percent-hero.vault-3d-motion-v2",
  });

export const heroResourcesPass = heroRendererPipelineRegistration.getPass("resources");
export const heroGeometryPass = heroRendererPipelineRegistration.getPass("geometry");
export const heroEnvironmentPass = heroRendererPipelineRegistration.getPass("environment");
export const heroShadowPass = heroRendererPipelineRegistration.getPass("shadow");
export const heroShadePass = heroRendererPipelineRegistration.getPass("shade");
