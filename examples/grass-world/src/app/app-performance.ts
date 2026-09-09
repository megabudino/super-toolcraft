import {
  assessToolcraftRenderPlan,
  defineToolcraftPerformance,
  deriveToolcraftPerformancePaths,
  type ToolcraftEnvelopePerformanceConfig,
} from "@/toolcraft/runtime";

import { grassRendererPipelineRegistration } from "./app-renderer-pipeline";
import { appSchema } from "./app-schema";
import {
  grassPerformanceFixtureAdapters,
  grassWorkloadEnvelope,
} from "./grass/grass-performance-envelope";
import { createGrassPerformanceScenarios } from "./grass/grass-performance-scenarios";

const basePerformance = defineToolcraftPerformance({
  fixtureAdapters: grassPerformanceFixtureAdapters,
  kernelBenchmarkDecisions: [
    {
      candidates: ["canvas-2d", "webgl"],
      decision:
        "Render all three fixed-size live procedural previews with one retained WebGL fragment program so Terrain value noise, Tall Voronoi distribution, and Clover blend noise stay responsive at up to six deterministic octaves without duplicating control infrastructure.",
      id: "grass-noise-preview",
      selected: "webgl",
    },
    {
      candidates: ["webgl"],
      decision:
        "Build deterministic terrain-aware root attributes and the detailed/lightweight Tall partition once on the CPU, then retain both WebGL resources until terrain, distribution, or Tall Detail changes.",
      id: "grass-layout-build",
      selected: "webgl",
    },
    {
      candidates: ["webgl"],
      decision:
        "Build the independent Lawn Cover layout and its detailed/lightweight clump partition into retained WebGL buffers so Lawn Detail never removes authored coverage or recreates Tall Grass resources.",
      id: "grass-lawn-layout-build",
      selected: "webgl",
    },
    {
      candidates: ["webgl"],
      decision:
        "Decode the resolution-budgeted butterfly PBR atlas once, build at most 64 deterministic terrain anchors on the CPU, and retain one instanced two-wing WebGL mesh for autonomous flight and hover landing.",
      id: "grass-butterfly-layout-build",
      selected: "webgl",
    },
    ...([
      ["grass-tufted-layout-build", "Tufted Grass"],
      ["grass-wild-layout-build", "Wild Grass"],
      ["grass-white-layout-build", "White Flowers"],
      ["grass-yellow-layout-build", "Yellow Flowers"],
      ["grass-rock-layout-build", "Small Rocks and Boulder"],
    ] as const).map(([id, label]) => ({
      candidates: ["webgl"] as const,
      decision: `Build exact Count-driven, footprint-safe ${label} transforms once on the CPU and retain one instanced WebGL layout until that scan layer or shared terrain changes.`,
      id,
      selected: "webgl" as const,
    })),
    {
      candidates: ["webgl"],
      decision:
        "Render one always-PBR live preview with bounded detailed Tall/Lawn samples plus lightweight animated coverage for every remaining authored root, retained scan resources, and coalesced shader interaction at the selected backing scale.",
      id: "grass-scene-render",
      selected: "webgl",
    },
  ],
  rendererPipeline: grassRendererPipelineRegistration,
  rendererStrategy: "webgl",
  rendererTechnique: {
    exportRenderer: "media-recorder",
    fidelityRisks: [
      "The Blender geometry-node field is translated to deterministic instanced ribbon geometry rather than arbitrary host-mesh scattering.",
      "The web wind field uses seamless harmonic noise instead of Blender's exact 3D noise implementation.",
      "The physical grass branch uses a web PBR material with PMREM-filtered equirectangular lighting rather than importing Blender shader graphs verbatim.",
      "The supplied scanned butterfly atlas is reconstructed as two articulated wing cards per instance because the source archive contains PBR atlas maps but no authored mesh.",
    ],
    intentionalRasterizationReason:
      "The product is a lit, animated three-dimensional grass field delivered as still-image pixels.",
    layers: [
      {
        content: ["bitmap-media", "composite", "shader"],
        exportMode: "included",
        id: "scene-background",
        kind: "background",
        primitiveCount: "low",
        renderer: "webgl",
        uiSelector: '[data-slot="grass-live-preview"]',
      },
      {
        content: ["geometry", "shader"],
        exportMode: "included",
        id: "ground-shadow",
        intentionalRasterizationReason:
          "One world-horizontal analytic field silhouette supplies a resolution-independent soft grounding shadow beneath the displaced Terrain in preview and export.",
        kind: "product-foreground",
        primitiveCount: "low",
        renderer: "webgl",
        uiSelector: '[data-grass-layer-ground="true"]',
      },
      {
        content: ["geometry", "noise", "shader"],
        exportMode: "included",
        id: "lawn-cover",
        intentionalRasterizationReason:
          "Thousands of short surface-cover blades require terrain depth testing, perspective projection, and GPU instancing.",
        kind: "product-foreground",
        primitiveCount: "high",
        renderer: "webgl",
        uiSelector: '[data-grass-layer-lawn="true"]',
      },
      {
        content: ["geometry", "noise", "shader"],
        exportMode: "included",
        id: "tall-grass",
        intentionalRasterizationReason:
          "Thousands of wind-animated upper blades require depth testing, perspective projection, and GPU instancing.",
        kind: "product-foreground",
        primitiveCount: "high",
        renderer: "webgl",
        uiSelector: '[data-grass-layer-tall="true"]',
      },
      {
        content: ["bitmap-media", "geometry", "shader"],
        exportMode: "included",
        id: "butterfly-flock",
        intentionalRasterizationReason:
          "The animated resolution-budgeted PBR atlas needs articulated wings, terrain-relative flight, depth testing, and retained instancing in preview and export.",
        kind: "product-foreground",
        primitiveCount: "low",
        renderer: "webgl",
        uiSelector: '[data-grass-layer-butterflies="true"]',
      },
      {
        content: ["bitmap-media", "geometry", "shader"],
        exportMode: "included",
        id: "blended-grass-ground",
        intentionalRasterizationReason:
          "The scanned Uncut Grass and Clover Patches materials blend across one procedural PBR ground shader that follows the editable displaced terrain and shares depth testing with every vegetation layer.",
        kind: "product-foreground",
        primitiveCount: "high",
        renderer: "webgl",
        uiSelector: '[data-grass-layer-ground="true"]',
      },
      ...[
        ["tufted-grass-scans", "tufted"],
        ["wild-grass-scans", "wild"],
        ["white-flower-scans", "white"],
        ["yellow-flower-scans", "yellow"],
        ["small-rock-scans", "rocks"],
        ["tundra-mossy-boulder", "boulder"],
      ].map(([id, kind]) => ({
        content: ["bitmap-media", "geometry", "shader"] as const,
        exportMode: "included" as const,
        id,
        intentionalRasterizationReason:
          "Retained scanned variants require terrain contact, depth testing, physical lighting, and instanced transforms.",
        kind: "product-foreground" as const,
        primitiveCount: "high" as const,
        renderer: "webgl" as const,
        uiSelector: `[data-grass-scan-layer-${kind}="true"]`,
      })),
      {
        content: ["composite", "geometry", "noise", "shader"],
        exportMode: "composited",
        id: "grass-export",
        kind: "export-composite",
        primitiveCount: "high",
        renderer: "webgl",
      },
    ],
    performanceRisks: [
      "The live preview preserves every authored Tall/Lawn root while 300–6,000 Tall and 1,000–12,000 Lawn roots use detailed topology; remaining roots use bounded lightweight animated PBR geometry at x1–x2 backing scale.",
      "Full Tall and Lawn layouts remain retained for deterministic export, while live pointer frames must never rebuild them.",
      "Transparent authored gradients use one double-sided color pass; fully opaque gradients use depth-writing PBR materials and early depth rejection.",
      "Changing field distribution or curve resolution rebuilds bounded instance or shared blade buffers.",
      "The editable Tall and Lawn Voronoi masks each evaluate up to six deterministic octaves over their own bounded candidate pool, then retain independent layouts until that layer's distribution input changes.",
      "Randomize writes both visible grass maps directly while scan placement remains exact Count-driven and independent from either map.",
      "The Clover blend evaluates one bounded 1–6 octave value-noise field only in the retained ground fragment pass, then mixes four already-retained PBR texture channels without adding geometry or draw calls.",
      "Scene Randomize preserves all active Current Ground, Clover, Tall, Lawn, scan, flower, and stone color values and only writes bounded spatial/composition targets; the action adds no per-frame work, resource, draw call, or workload dimension.",
      "Current Ground and Clover keep their authored colors through the existing luminance-preserving albedo tint at a fixed 92% blend, retaining texture contrast without changing fragment cost or PBR resource ownership.",
      "Ground Shadow adds one retained two-triangle transparent underlay and one fixed-cost analytic Field-distance evaluation to preview and export; offset, blur, color, and strength only update transforms or uniforms and zero Strength skips the draw.",
      "Surface Bend rebuilds one fixed-topology retained Terrain grid when Depth, Width, Roundness, Smoothness, Field shape, or Terrain noise changes; playback, orbit, zoom, material edits, and lighting reuse the current geometry.",
      "Changing Surface Bend Width or Include also rebuilds the bounded Tall, Lawn, scan, rock, and boulder placement layouts against one shared inner perimeter; Depth, Roundness, and Smoothness never invalidate those placement buffers.",
      "Initial retained scene construction is scheduled after the Toolcraft shell becomes interactive and yields between bounded geometry/layout stages; scan layout invalidation is keyed by the stable combined signature so paused runtime state ticks cannot repeat full scene renders.",
      "8K still delivery increases batch pixel cost and requires prompt GPU cleanup.",
      "Terrain layout evaluates up to six deterministic noise octaves per grass root and uses a high-resolution ground mesh so live composition and export retain surface detail.",
      "Switching a bundled or custom HDRI performs one main-thread Radiance RGBE decode plus GPU PMREM filtering, then reuses the retained result until the source changes.",
      "The first scan frame decodes compact mesh geometry plus shared WebP PBR atlases once, including one 59,550-vertex Tundra boulder with four 2K maps; retained geometries, textures, materials, and meshes survive unrelated controls and autonomous animation.",
      "Five independently bounded scan count sliders add at most 5,000 retained scanned instances across grass, flowers, and rocks.",
      "Butterflies add one retained instanced mesh capped at 64 instances; Count and Seed rebuild only its bounded anchor attributes, while flight, wing beat, and hover landing update matrices and one shader uniform without decoding textures again.",
      "The user-approved butterfly maps use 512px BaseColor, 1024px Opacity, and 256px Normal/Roughness; their one-time decode and GPU upload are isolated in the butterfly resource pass.",
      "The Tundra Boulder has fixed zero-or-one cardinality: Include, Size, Seed, and Surface offset update one retained transform through the existing rock-layout path and add no workload dimension.",
      "The physical scene retains one bounded 1K PCF directional shadow map; independent Tall Grass and Lawn Cover color-variation sliders update retained uniforms and add fixed shader arithmetic without changing geometry, layout counts, or workload dimensions.",
      "Independent per-layer Contrast and Saturation sliders add fixed base-color shader arithmetic to PBR generated grass, ground, scans, rocks, and the Tundra Boulder; they reuse existing fragment and pixel workload bounds and never rebuild layouts or material resources.",
      "Tall-only live shadows refresh at no more than 30 Hz during deformation; still export refreshes shadows for its requested frame.",
      "Per-section texture masks add one fixed three-octave world-space noise evaluation to existing fragment passes; level, scale, and seed controls update retained uniforms without adding draw calls, resources, geometry work, or a new workload dimension.",
      "Tall Grass and Lawn instance palettes add one deterministic per-local-blade selector plus fixed categorical color arithmetic; six presence sliders and six colors update retained uniforms while Field/Cover seed reuses existing layout invalidation and no workload dimension changes. Their spatial cool/warm micro-variation is normalized to the authored gradient luminance and remains constant-cost fragment arithmetic.",
    ],
    previewExportDifferenceReason:
      "Preview and still output share the WebGL scene; still export rerenders the selected frame at the requested image resolution.",
    previewRenderer: "webgl",
    productRepresentation: "mixed",
    rendererStrategy: "webgl",
    sourceRepresentation: "mixed",
    whyNotAlternativeStrategies: [
      "DOM and SVG cannot depth-test or animate thousands of perspective-projected blades efficiently.",
      "Canvas 2D would require a custom triangle rasterizer and per-frame CPU sorting.",
      "WebGPU would add browser availability risk without a measured need at the enforced instance cap.",
    ],
  },
  scenarios: [],
  usesCustomRenderer: true,
  workloadEnvelope: grassWorkloadEnvelope,
});

export const appRenderPlanAssessment = assessToolcraftRenderPlan(
  appSchema,
  basePerformance,
);

export const appPerformancePaths = deriveToolcraftPerformancePaths(
  appSchema,
  basePerformance,
);

export const appPerformance: ToolcraftEnvelopePerformanceConfig =
  defineToolcraftPerformance({
    ...basePerformance,
    scenarios: createGrassPerformanceScenarios(appPerformancePaths),
  });
