import type { ToolcraftState } from "@/toolcraft/runtime";
import { readToolcraftOrientationPose } from "@/toolcraft/runtime/react";

import { grassDefaults } from "./grass-defaults";
import { readGrassButterflySettings } from "./grass-butterfly-settings-values";
import { readGrassDistributionSettings } from "./grass-distribution-values";
import { readGrassEnvironmentSettings } from "./grass-environment-values";
import {
  readGrassAppearanceSettings,
  readGrassBladeSettings,
  readGrassLawnSettings,
} from "./grass-layer-settings-values";
import { readGrassScanSettings } from "./grass-scan-settings-values";
import type { GrassSettings } from "./grass-settings-types";
import {
  readGrassGroundShadowSettings,
  readGrassSurfaceSettings,
  readGrassTerrainSettings,
} from "./grass-surface-settings-values";
import {
  booleanValue,
  boundedNumberValue,
  colorValue,
  numberValue,
  stringValue,
} from "./grass-value-readers";
import { readGrassWindSettings } from "./grass-wind-settings-values";
import { normalizeGrassWorldId } from "./grass-world-generator";

export {
  getGrassGroundGeometryKey,
  getGrassLayoutKey,
  getGrassRenderKey,
  getLawnLayoutKey,
} from "./grass-settings-signatures";
export {
  getGrassPreviewBackground,
  getGrassTimelineProgress,
} from "./grass-timeline-values";
export type {
  GrassBoulderSettings,
  GrassGradient,
  GrassGradientStop,
  GrassScanLayerSettings,
  GrassSettings,
} from "./grass-settings-types";

export function readGrassSettings(state: ToolcraftState): GrassSettings {
  return {
    appearance: readGrassAppearanceSettings(state),
    blade: readGrassBladeSettings(state),
    butterflies: readGrassButterflySettings(state),
    environment: readGrassEnvironmentSettings(state),
    export: {
      imageFormat: stringValue(state, "export.image.format", ["png", "jpg"]),
      imageResolution: stringValue(state, "export.image.resolution", [
        "2k",
        "4k",
        "8k",
      ]),
      includeBackground: booleanValue(state, "export.includeBackground"),
      videoFormat: stringValue(state, "export.video.format", ["mp4", "webm"]),
      videoResolution: stringValue(state, "export.video.resolution", [
        "current",
        "4k",
      ]),
    },
    field: {
      alignToNormals: numberValue(state, "field.alignToNormals") / 100,
      densityMax: Math.round(numberValue(state, "field.densityMax")),
      depth: boundedNumberValue(state, "field.depth", 2, 20),
      distanceMin: numberValue(state, "field.distanceMin"),
      distribution: readGrassDistributionSettings(state),
      edgeIrregularity:
        boundedNumberValue(state, "field.edgeIrregularity", 0, 30) / 100,
      randomRotation: numberValue(state, "field.randomRotation") / 100,
      seed: normalizeGrassWorldId(numberValue(state, "field.seed")),
      shapeRoundness:
        boundedNumberValue(state, "field.shapeRoundness", 0, 100) / 100,
      showGround: booleanValue(state, "field.showGround"),
      topFacingCoverage: numberValue(state, "field.topFacingCoverage") / 100,
      topFacingFade: numberValue(state, "field.topFacingFade") / 100,
      topFacingOnly: booleanValue(state, "field.topFacingOnly"),
      width: boundedNumberValue(state, "field.width", 2, 20),
    },
    grass: {
      depthOffset: numberValue(state, "grass.depthOffset"),
      enabled: booleanValue(state, "grass.enabled"),
    },
    groundShadow: readGrassGroundShadowSettings(state),
    lawn: readGrassLawnSettings(state),
    preview: {
      bladeCount: Math.round(numberValue(state, "preview.bladeCount")),
      lawnBladeCount: Math.round(numberValue(state, "preview.lawnBladeCount")),
    },
    scans: readGrassScanSettings(state),
    scene: { background: colorValue(state, "scene.background") },
    surface: readGrassSurfaceSettings(state),
    terrain: readGrassTerrainSettings(state),
    view: {
      orientation: readToolcraftOrientationPose(
        state.values["view.orientation"],
        grassDefaults["view.orientation"],
      ),
    },
    wind: readGrassWindSettings(state),
  };
}
