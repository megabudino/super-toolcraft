import type { ToolcraftControlSectionInventoryEntry } from "./acceptance/types";
import { grassButterflyControlSectionInventory } from "./app-acceptance-butterfly-data";
import {
  grassDeliveryControlSectionInventory,
  grassEnvironmentControlSectionInventory,
  grassSceneSetupControlSectionInventory,
} from "./app-acceptance-scene-data";
import { grassScanControlSectionInventory } from "./app-acceptance-scan-data";
import { grassWindControlSectionInventory } from "./app-acceptance-wind-data";
import { grassSurfaceBendControlSectionInventory } from "./app-acceptance-surface-bend-data";

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Shared field extent and perimeter",
      groupingReason:
        "Numeric width and length inputs plus roundness and irregularity define one deterministic complete-surface boundary consumed by Terrain and every attached layer.",
      targets: [
        "field.width",
        "field.depth",
        "field.shapeRoundness",
        "field.edgeIrregularity",
      ],
      title: "Field",
      workflowStage: "Generate",
    },
    {
      entity: "Procedural terrain height map",
      groupingReason:
        "Independent visibility, the exact live map, scale, detail, roughness, seed, black/white remap, and maximum height define one continuous deterministic terrain surface shared by preview and export.",
      targets: [
        "field.showGround",
        "terrain.noiseOffset",
        "terrain.noiseScale",
        "terrain.detail",
        "terrain.roughness",
        "terrain.heightLevels",
        "terrain.seed",
        "terrain.maxHeight",
      ],
      title: "Terrain",
      workflowStage: "Shape",
    },
    {
      entity: "Optimized PBR live preview quality",
      groupingReason:
        "Bounded Tall and Lawn detail tiers own live renderer workload while authored coverage and the shared PBR camera remain unchanged.",
      targets: [
        "preview.bladeCount",
        "preview.lawnBladeCount",
        "view.orientation",
      ],
      title: "Preview Quality",
      workflowStage: "Inspect",
    },
    {
      entity: "Lawn distribution",
      groupingReason:
        "Visibility, density, spacing, root offset, and seed define the lower lawn carpet independently from Tall Grass while the global wind field may deform both.",
      targets: [
        "lawn.enabled",
        "lawn.densityMax",
        "lawn.distanceMin",
        "lawn.depthOffset",
        "lawn.seed",
      ],
      title: "Lawn Cover",
      workflowStage: "Distribute",
    },
    {
      entity: "Lawn Voronoi growth mask",
      groupingReason:
        "The live grayscale map, scale, detail, roughness, seed, and black/white levels define where Lawn Cover may grow independently from Tall Grass and every scan layer.",
      targets: [
        "lawn.distributionOffset",
        "lawn.distributionScale",
        "lawn.distributionDetail",
        "lawn.distributionRoughness",
        "lawn.distributionSeed",
        "lawn.distributionLevels",
      ],
      title: "Lawn Distribution",
      workflowStage: "Distribute",
    },
    {
      entity: "Short lawn blade geometry",
      groupingReason:
        "Curve points, width, height range, taper, fixed tilt, and crossed ribbons define the shorter, stiffer blade primitive.",
      targets: [
        "lawn.curveResolution",
        "lawn.thickness",
        "lawn.heightRange",
        "lawn.taperEnd",
        "lawn.tilt2d",
        "lawn.use3d",
      ],
      title: "Lawn Blade",
      workflowStage: "Shape",
    },
    {
      entity: "Lawn Cover material response",
      groupingReason:
        "Roughness, the editable color ramp, variation, contrast, and saturation tune the always-PBR lower lawn stratum without changing Tall Grass.",
      targets: [
        "lawn.pbrRoughness",
        "lawn.colorVariation",
        "lawn.colorContrast",
        "lawn.colorSaturation",
      ],
      title: "Lawn Appearance",
      workflowStage: "Style",
    },
    {
      entity: "Lawn Cover color ramp",
      groupingReason:
        "The atomic gradient editor owns the root-to-tip transition, stops, opacity, type, and angle for Lawn Cover only.",
      targets: ["lawn.bladeGradient"],
      title: "Cover gradient",
      workflowStage: "Style",
    },
    {
      entity: "Lawn Cover instance palette",
      groupingReason:
        "Three free colors and three relative presence weights assign stable palette categories to local Lawn blades through Cover seed.",
      targets: [
        "lawn.instanceColor1",
        "lawn.instanceColor2",
        "lawn.instanceColor3",
        "lawn.instanceColorWeight1",
        "lawn.instanceColorWeight2",
        "lawn.instanceColorWeight3",
      ],
      title: "Lawn Instance Colors",
      workflowStage: "Style",
    },
    {
      entity: "Tall Grass distribution",
      groupingReason:
        "Visibility, target count, minimum spacing, root offset, and placement seed define the upper wind-responsive layer capacity.",
      targets: [
        "grass.enabled",
        "field.densityMax",
        "field.distanceMin",
        "grass.depthOffset",
        "field.seed",
      ],
      title: "Tall Grass",
      workflowStage: "Distribute",
    },
    {
      entity: "Tall Grass Voronoi growth mask",
      groupingReason:
        "The live grayscale map, scale, detail, roughness, seed, and black/white levels define where Tall Grass may grow independently from target count and Lawn.",
      targets: [
        "field.distributionOffset",
        "field.distributionScale",
        "field.distributionDetail",
        "field.distributionRoughness",
        "field.distributionSeed",
        "field.distributionLevels",
      ],
      title: "Tall Grass Distribution",
      workflowStage: "Distribute",
    },
    {
      entity: "Surface-aware Tall Grass placement",
      groupingReason:
        "Normal alignment, azimuth, slope filtering, and coverage fade describe how the upper grass layer sits on the terrain.",
      targets: [
        "field.alignToNormals",
        "field.randomRotation",
        "field.topFacingOnly",
        "field.topFacingCoverage",
        "field.topFacingFade",
      ],
      title: "Tall Grass Placement",
      workflowStage: "Distribute",
    },
    {
      entity: "Grass blade geometry",
      groupingReason:
        "Curve points, width, height range, taper, tilt, and crossed ribbons define one blade primitive.",
      targets: [
        "blade.curveResolution",
        "blade.thickness",
        "blade.heightRange",
        "blade.taperEnd",
        "blade.tilt2d",
        "blade.use3d",
      ],
      title: "Tall Grass Blade",
      workflowStage: "Shape",
    },
    ...grassWindControlSectionInventory,
    {
      entity: "Tall Grass material response",
      groupingReason:
        "Roughness, the editable blade color ramp, variation, contrast, and saturation tune the always-PBR Tall Grass independently from Lawn Cover.",
      targets: [
        "appearance.pbrRoughness",
        "appearance.colorVariation",
        "appearance.colorContrast",
        "appearance.colorSaturation",
      ],
      title: "Tall Grass Appearance",
      workflowStage: "Style",
    },
    {
      entity: "Blade color ramp",
      groupingReason:
        "The atomic gradient editor owns the Tall Grass root-to-tip color transition, stop positions, opacity, type, and angle.",
      targets: ["appearance.bladeGradient"],
      title: "Blade gradient",
      workflowStage: "Style",
    },
    {
      entity: "Tall Grass instance palette",
      groupingReason:
        "Three free colors and three relative presence weights assign stable palette categories to Tall Grass instances through Field seed.",
      targets: [
        "appearance.instanceColor1",
        "appearance.instanceColor2",
        "appearance.instanceColor3",
        "appearance.instanceColorWeight1",
        "appearance.instanceColorWeight2",
        "appearance.instanceColorWeight3",
      ],
      title: "Tall Grass Instance Colors",
      workflowStage: "Style",
    },
    ...grassEnvironmentControlSectionInventory,
    ...grassSceneSetupControlSectionInventory,
    {
      entity: "Current and Clover Terrain surface beneath both grass strata",
      groupingReason:
        "The current material, Clover physical response, and procedural blend mask form one sequential Surface workflow below every vegetation layer.",
      targets: [
        "appearance.groundColor",
        "surface.cloverColor",
        "surface.brightness",
        "surface.receiveShadows",
        "surface.textureScale",
        "surface.normalStrength",
        "surface.roughness",
        "surface.colorContrast",
        "surface.colorSaturation",
        "surface.cloverTextureScale",
        "surface.cloverNormalStrength",
        "surface.cloverRoughness",
        "surface.cloverMaskOffset",
        "surface.cloverMaskScale",
        "surface.cloverMaskDetail",
        "surface.cloverMaskRoughness",
        "surface.cloverMaskSeed",
        "surface.cloverMaskLevels",
      ],
      title: "Surface",
      workflowStage: "Composite",
    },
    ...grassSurfaceBendControlSectionInventory,
    {
      entity: "Shared transparent field perimeter",
      groupingReason:
        "Width and strength finish Terrain, vegetation, scans, rocks, textures, and their shadow silhouettes through one aligned field-space mask without changing geometry.",
      targets: ["surface.edgeFadeWidth", "surface.edgeFadeStrength"],
      title: "Surface Fade",
      workflowStage: "Composite",
    },
    {
      entity: "Complete-field grounding shadow",
      groupingReason:
        "Position, uniform footprint scale, world-space softness, color, and strength edit one retained underlay that follows the authored Field silhouette without changing Terrain or cast shadows.",
      targets: [
        "groundShadow.offsetY",
        "groundShadow.offsetZ",
        "groundShadow.scale",
        "groundShadow.blur",
        "groundShadow.color",
        "groundShadow.strength",
      ],
      title: "Ground Shadow",
      workflowStage: "Composite",
    },
    ...grassScanControlSectionInventory,
    ...grassButterflyControlSectionInventory,
    ...grassDeliveryControlSectionInventory,
  ];
