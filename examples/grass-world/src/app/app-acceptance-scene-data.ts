import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
} from "./acceptance/types";

function controlAcceptance(
  entry: Omit<ToolcraftComponentAcceptance, "automated" | "browser" | "kind">,
): ToolcraftComponentAcceptance {
  return { ...entry, automated: true, browser: true, kind: "control" };
}

export const grassSceneSetupAcceptanceRows = [
  controlAcceptance({
    automatedTestName:
      "exposes a randomized scene or surface-only scratch starting point",
    browserTestName:
      "scene setup randomizes the authored look and scratches back to surface",
    componentType: "actions",
    evidence: "product-output",
    expectedObservable:
      "Randomize advances to a new actual terrain and layout while preserving the exact active colors across both Ground materials, Tall Grass, Lawn, plants, flowers, and stones. Terrain height, grass height, and object size stay at or below 120% of the active source scene without cumulative growth. Authored HDRI, lighting, color grade, material response, texture masks, fade, wind, view, quality, and export settings remain unchanged. Scratch leaves Surface enabled, hides Tall Grass, Lawn, scanned vegetation, Small Rocks, and the Tundra Boulder, and preserves every hidden layer's authored settings.",
    fixture: "A stable paused scene with authored lighting, materials, fade, and all content layers.",
    id: "grass.scene-setup",
    target: "actions.sceneSetup",
    userAction: "Click Randomize, then click Scratch.",
  }),
] satisfies readonly ToolcraftComponentAcceptance[];

export const grassEnvironmentControlSectionInventory = [
  {
    entity: "Scene environment source",
    groupingReason:
      "The visual preset picker and custom Radiance HDR uploader are the two mutually overriding sources for one scene-wide environment.",
    targets: ["environment.preset", "environment.hdriFile"],
    title: "Scene Environment",
    workflowStage: "Source",
  },
  {
    entity: "Image-based scene lighting",
    groupingReason:
      "Intensity, three-axis rotation, visible HDRI, and blur tune one retained environment shared by every material, both preview modes, and both export paths.",
    targets: [
      "environment.intensity",
      "environment.rotationX",
      "environment.rotation",
      "environment.rotationZ",
      "environment.visible",
      "environment.backgroundBlur",
    ],
    title: "Scene Lighting",
    workflowStage: "Light",
  },
  {
    entity: "Reference key, fill, rim, and exposure balance",
    groupingReason:
      "Sun color and energy, authored cool shadow fill, rim color and energy, and ACES exposure art-direct one retained lighting balance without reloading the HDRI.",
    targets: [
      "environment.keyColor",
      "environment.keyStrength",
      "environment.fillColor",
      "environment.fillStrength",
      "environment.rimColor",
      "environment.rimStrength",
      "environment.exposure",
    ],
    title: "Light Balance",
    workflowStage: "Light",
  },
  {
    entity: "Final reference color grade",
    groupingReason:
      "Scene contrast, restrained saturation, warm highlights, and cool shadows grade the already lit field consistently in preview and export without changing its composition.",
    targets: [
      "environment.sceneContrast",
      "environment.sceneSaturation",
      "environment.highlightWarmth",
      "environment.shadowCoolness",
    ],
    title: "Color Grade",
    workflowStage: "Grade",
  },
  {
    entity: "World-space sun and shade pattern",
    groupingReason:
      "Enablement, region size, balance, edge softness, contrast, two-axis placement, and deterministic variation tune one shared illumination mask across preview and export materials.",
    targets: [
      "environment.sunPatchEnabled",
      "environment.sunPatchScale",
      "environment.sunPatchCoverage",
      "environment.sunPatchSoftness",
      "environment.sunPatchStrength",
      "environment.sunPatchOffset",
      "environment.sunPatchSeed",
    ],
    title: "Sun Patches",
    workflowStage: "Light",
  },
] satisfies readonly ToolcraftControlSectionInventoryEntry[];

export const grassSceneSetupControlSectionInventory = [
  {
    entity: "Scene starting point",
    groupingReason:
      "Randomize creates a complete deterministic terrain and distribution variation while preserving the active Current Ground, Clover, and content-layer colors and limiting generated height/scale to 120% of the active source scene; Scratch returns composition to the existing Surface without destructively resetting hidden layer settings.",
    targets: ["actions.sceneSetup"],
    title: "Scene Setup",
    workflowStage: "Generate",
  },
] satisfies readonly ToolcraftControlSectionInventoryEntry[];

export const grassDeliveryControlSectionInventory = [
  {
    entity: "Scene background",
    groupingReason:
      "Background inclusion and color define preview and export compositing.",
    targets: ["export.includeBackground", "scene.background"],
    title: "Background",
    workflowStage: "Composite",
  },
  {
    entity: "Still image delivery",
    groupingReason:
      "Image format and resolution are consumed by the still encoder.",
    targets: ["export.image.format", "export.image.resolution"],
    title: "Image Export",
    workflowStage: "Deliver",
  },
] satisfies readonly ToolcraftControlSectionInventoryEntry[];

export const grassHiddenVideoDeliveryControlSectionInventory = [
  {
    entity: "Animation delivery",
    groupingReason:
      "The retained video encoder controls are intentionally excluded from the visible product schema.",
    targets: ["export.video.format", "export.video.resolution"],
    title: "Video Export",
    workflowStage: "Hidden",
  },
] satisfies readonly ToolcraftControlSectionInventoryEntry[];
