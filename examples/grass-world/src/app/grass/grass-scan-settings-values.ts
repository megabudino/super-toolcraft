import type { ToolcraftState } from "@/toolcraft/runtime";

import {
  grassScanLayerContracts,
  type GrassScanLayerKind,
} from "./grass-scan-contract";
import type {
  GrassBoulderSettings,
  GrassScanLayerSettings,
  GrassSettings,
} from "./grass-settings-types";
import { readGrassTextureMaskSettings } from "./grass-texture-mask-settings";
import {
  booleanValue,
  boundedNumberValue,
  colorValue,
  rangeValue,
  type GrassDefaultTarget,
} from "./grass-value-readers";

function scanTarget(
  kind: GrassScanLayerKind,
  suffix: string,
): GrassDefaultTarget {
  return `scan.${kind}.${suffix}` as GrassDefaultTarget;
}

function readScanLayerSettings(
  state: ToolcraftState,
  kind: GrassScanLayerKind,
): GrassScanLayerSettings {
  const contract = grassScanLayerContracts[kind];
  const [sizeMin, sizeMax] = rangeValue(
    state,
    scanTarget(kind, "sizeRange"),
    contract.sizeMin,
    contract.sizeMax,
  );
  return {
    clumping:
      boundedNumberValue(state, scanTarget(kind, "clumping"), 0, 100) / 100,
    colorContrast:
      boundedNumberValue(state, scanTarget(kind, "colorContrast"), 0, 200) /
      100,
    colorSaturation:
      boundedNumberValue(state, scanTarget(kind, "colorSaturation"), 0, 200) /
      100,
    count: Math.round(
      boundedNumberValue(state, scanTarget(kind, "count"), 0, contract.countMax),
    ),
    enabled: booleanValue(state, scanTarget(kind, "enabled")),
    pbrAoStrength:
      boundedNumberValue(state, scanTarget(kind, "pbrAoStrength"), 0, 100) /
      100,
    pbrBacklight:
      kind === "rocks"
        ? 0
        : boundedNumberValue(
            state,
            scanTarget(kind, "pbrBacklight"),
            0,
            100,
          ) / 100,
    pbrBrightness:
      boundedNumberValue(state, scanTarget(kind, "pbrBrightness"), 0, 200) /
      100,
    pbrNormalStrength:
      boundedNumberValue(state, scanTarget(kind, "pbrNormalStrength"), 0, 200) /
      100,
    pbrRoughness:
      boundedNumberValue(state, scanTarget(kind, "pbrRoughness"), 0, 125) / 100,
    pbrSheen:
      kind === "rocks"
        ? 0
        : boundedNumberValue(state, scanTarget(kind, "pbrSheen"), 0, 100) / 100,
    pbrTint: colorValue(state, scanTarget(kind, "pbrTint")),
    shadowColor:
      kind === "rocks"
        ? colorValue(state, "scan.rocks.shadowColor")
        : "#ffffff",
    seed: Math.round(
      boundedNumberValue(state, scanTarget(kind, "seed"), 0, 100),
    ),
    sizeMax,
    sizeMin,
    surfaceOffset: boundedNumberValue(
      state,
      scanTarget(kind, "surfaceOffset"),
      -0.15,
      0.15,
    ),
    textureMask: readGrassTextureMaskSettings(state, `scan.${kind}`),
  };
}

function readBoulderSettings(state: ToolcraftState): GrassBoulderSettings {
  return {
    colorContrast:
      boundedNumberValue(state, "scan.boulder.colorContrast", 0, 200) / 100,
    colorSaturation:
      boundedNumberValue(state, "scan.boulder.colorSaturation", 0, 200) / 100,
    enabled: booleanValue(state, "scan.boulder.enabled"),
    pbrAoStrength:
      boundedNumberValue(state, "scan.boulder.pbrAoStrength", 0, 100) / 100,
    pbrBrightness:
      boundedNumberValue(state, "scan.boulder.pbrBrightness", 0, 200) / 100,
    pbrNormalStrength:
      boundedNumberValue(state, "scan.boulder.pbrNormalStrength", 0, 200) / 100,
    pbrRoughness:
      boundedNumberValue(state, "scan.boulder.pbrRoughness", 0, 125) / 100,
    pbrTint: colorValue(state, "scan.boulder.pbrTint"),
    shadowColor: colorValue(state, "scan.boulder.shadowColor"),
    seed: Math.round(boundedNumberValue(state, "scan.boulder.seed", 0, 100)),
    size: boundedNumberValue(state, "scan.boulder.size", 0.6, 3.2),
    surfaceOffset: boundedNumberValue(
      state,
      "scan.boulder.surfaceOffset",
      -0.6,
      0.3,
    ),
    textureMask: readGrassTextureMaskSettings(state, "scan.boulder"),
  };
}

export function readGrassScanSettings(
  state: ToolcraftState,
): GrassSettings["scans"] {
  return {
    boulder: readBoulderSettings(state),
    rocks: readScanLayerSettings(state, "rocks"),
    tufted: readScanLayerSettings(state, "tufted"),
    white: readScanLayerSettings(state, "white"),
    wild: readScanLayerSettings(state, "wild"),
    yellow: readScanLayerSettings(state, "yellow"),
  };
}
