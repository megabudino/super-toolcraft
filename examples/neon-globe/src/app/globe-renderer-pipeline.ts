import { registerToolcraftRendererPipeline } from "@/toolcraft/runtime";

export type GlobeGeometryPipelineResult = {
  latitudeCount: number;
  meridianCount: number;
  orientationPosition: readonly [number, number, number];
};

export const globeRendererPipelineRegistration = registerToolcraftRendererPipeline<{
  "globe-geometry": {
    resource: never;
    resourceKey: never;
    result: GlobeGeometryPipelineResult;
  };
  "globe-raster": {
    resource: never;
    resourceKey: never;
    result: "drawn";
  };
  "globe-logo-loop-state": {
    resource: never;
    resourceKey: never;
    result: "advanced";
  };
  "globe-export": {
    resource: never;
    resourceKey: never;
    result: "exported";
  };
}>()({
  interactionInvalidation: [
    {
      interaction: "initial-render",
      invalidates: ["globe-geometry", "globe-raster"],
      targets: ["app.initialRender"],
    },
    {
      interaction: "control-drag",
      invalidates: ["globe-geometry", "globe-raster"],
      targets: ["globe.latitudeCount", "globe.meridianCount"],
    },
    {
      interaction: "control-drag",
      invalidates: ["globe-raster"],
      targets: ["globe.lineWidth"],
    },
    {
      interaction: "control-drag",
      invalidates: ["globe-raster"],
      targets: [
        "bands.distance",
        "bands.dotSize",
        "bands.columnSpacing",
        "bands.band1.position",
        "bands.band1.width",
        "bands.band2.position",
        "bands.band2.width",
        "bands.band3.position",
        "bands.band3.width",
        "bands.band4.position",
        "bands.band4.width",
        "logos.dxc.finalPosition",
        "logos.meta.finalPosition",
        "logos.prada.finalPosition",
        "logos.zillow.finalPosition",
        "logos.dxc.scale",
        "logos.meta.scale",
        "logos.prada.scale",
        "logos.zillow.scale",
        "effects.crtIntensity",
      ],
    },
    {
      interaction: "control-drag",
      invalidates: ["globe-logo-loop-state"],
      targets: ["logos.holdSeconds", "logos.speed"],
    },
    {
      interaction: "animation-frame",
      invalidates: ["globe-logo-loop-state"],
      targets: ["logos.intro.run"],
    },
    {
      interaction: "control-change",
      invalidates: ["globe-raster"],
      targets: [
        "globe.sphereColor",
        "globe.lineColor",
        "globe.outline",
        "appearance.background",
      ],
    },
    {
      interaction: "control-drag",
      invalidates: ["globe-geometry", "globe-raster"],
      targets: ["globe.orientation"],
    },
    {
      interaction: "viewport-drag",
      invalidates: [],
      mustNotInvalidate: ["globe-geometry", "globe-raster"],
      targets: ["canvas.viewport.offset"],
    },
    {
      interaction: "viewport-zoom",
      invalidates: [],
      mustNotInvalidate: ["globe-geometry", "globe-raster"],
      targets: ["canvas.viewport.zoom"],
    },
    {
      interaction: "control-change",
      invalidates: ["globe-raster"],
      mustNotInvalidate: ["globe-geometry"],
      targets: ["canvas.renderScale"],
    },
    {
      interaction: "export",
      invalidates: ["globe-export"],
      targets: ["export.image"],
    },
  ],
  passes: [
    {
      cacheKey: ["latitudeCount", "meridianCount", "orientationPosition"],
      cost: {
        dimensions: ["latitude-rings", "meridian-rings"],
        frequency: "discrete",
        relationship: "linear",
      },
      id: "globe-geometry",
      inputs: [
        "globe.latitudeCount",
        "globe.meridianCount",
        "globe.orientation",
      ],
      invalidatedBy: ["initial-render", "control-drag"],
      kind: "vector-build",
      lifecycle: {
        cache: "memoized",
        resourceScope: "renderer",
      },
      output: "intermediate",
      quality: "full",
      runsOn: "main",
    },
    {
      cost: {
        dimensions: [],
        frequency: "frame",
        relationship: "constant",
      },
      id: "globe-logo-loop-state",
      inputs: [
        "logos.intro.run",
        "logos.holdSeconds",
        "logos.speed",
        "logos.loop.elapsed",
      ],
      invalidatedBy: ["animation-frame", "control-drag"],
      kind: "vector-build",
      lifecycle: {
        cache: "none",
        resourceScope: "call",
      },
      output: "intermediate",
      quality: "preview",
      runsOn: "main",
    },
    {
      cost: {
        dimensions: [
          "line-thickness",
          "band-1-width",
          "band-2-width",
          "band-3-width",
          "band-4-width",
          "band-dot-size",
          "band-column-spacing",
        ],
        frequency: "frame",
        relationship: "linear",
      },
      id: "globe-raster",
      inputs: [
        "appearance.background",
        "canvas.renderScale",
        "effects.crtIntensity",
        "bands.distance",
        "bands.dotSize",
        "bands.columnSpacing",
        "bands.band1.position",
        "bands.band1.width",
        "bands.band2.position",
        "bands.band2.width",
        "bands.band3.position",
        "bands.band3.width",
        "bands.band4.position",
        "bands.band4.width",
        "logos.dxc.finalPosition",
        "logos.meta.finalPosition",
        "logos.prada.finalPosition",
        "logos.zillow.finalPosition",
        "logos.dxc.scale",
        "logos.meta.scale",
        "logos.prada.scale",
        "logos.zillow.scale",
        "globe-logo-loop-state",
        "globe.geometry",
        "globe.lineColor",
        "globe.lineWidth",
        "globe.orientation",
        "globe.outline",
        "globe.sphereColor",
      ],
      invalidatedBy: [
        "initial-render",
        "control-change",
        "control-drag",
      ],
      kind: "rasterize",
      lifecycle: {
        cache: "none",
        resourceScope: "call",
      },
      output: "preview",
      quality: "retina",
      runsOn: "main",
    },
    {
      cost: {
        dimensions: [
          "export-long-edge",
          "latitude-rings",
          "meridian-rings",
          "line-thickness",
          "band-1-width",
          "band-2-width",
          "band-3-width",
          "band-4-width",
          "band-dot-size",
          "band-column-spacing",
        ],
        frequency: "batch",
        relationship: "quadratic",
      },
      id: "globe-export",
      inputs: [
        "appearance.background",
        "effects.crtIntensity",
        "export.image.format",
        "export.image.resolution",
        "bands.distance",
        "bands.dotSize",
        "bands.columnSpacing",
        "bands.band1.position",
        "bands.band1.width",
        "bands.band2.position",
        "bands.band2.width",
        "bands.band3.position",
        "bands.band3.width",
        "bands.band4.position",
        "bands.band4.width",
        "logos.dxc.finalPosition",
        "logos.meta.finalPosition",
        "logos.prada.finalPosition",
        "logos.zillow.finalPosition",
        "logos.dxc.scale",
        "logos.meta.scale",
        "logos.prada.scale",
        "logos.zillow.scale",
        "globe.geometry",
        "globe.lineColor",
        "globe.lineWidth",
        "globe.orientation",
        "globe.outline",
        "globe.sphereColor",
      ],
      invalidatedBy: ["export"],
      kind: "export",
      lifecycle: {
        cache: "none",
        resourceScope: "call",
      },
      output: "export",
      quality: "export",
      runsOn: "export-only",
    },
  ],
  runtimeId: "landing-globe-renderer",
});
