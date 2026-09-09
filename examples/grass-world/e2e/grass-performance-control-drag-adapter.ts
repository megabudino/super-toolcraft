import type { ToolcraftPerformancePath } from "@/toolcraft/runtime";

import { toggleGrassSlider } from "./grass-performance-control-actions";
import {
  prepareGrass,
  readGrassSignature,
} from "./grass-performance-session";
import type { ToolcraftPerformancePathAdapter } from "./performance-path-adapter-contract";

export const scanFixtureTargets = [
  ["tufted-scan-count", "scan.tufted.count", "tufted"],
  ["wild-scan-count", "scan.wild.count", "wild"],
  ["white-flower-count", "scan.white.count", "white"],
  ["yellow-flower-count", "scan.yellow.count", "yellow"],
  ["rock-scan-count", "scan.rocks.count", "rocks"],
] as const;

function resolveControlDragTarget(path: ToolcraftPerformancePath): string {
  const scanTarget = scanFixtureTargets.find(([, target]) =>
    path.targets.includes(target),
  )?.[1];
  if (scanTarget) return scanTarget;
  if (path.targets.includes("surface.cloverMaskScale")) {
    return "surface.cloverMaskScale";
  }
  if (path.targets.includes("field.distributionScale")) {
    return "field.distributionScale";
  }
  if (path.targets.includes("terrain.noiseScale")) {
    return "terrain.noiseScale";
  }
  if (path.targets.includes("butterflies.count")) return "butterflies.count";
  if (path.targets.includes("field.densityMax")) return "field.densityMax";
  if (path.targets.includes("surface.edgeFadeWidth")) {
    return "surface.edgeFadeWidth";
  }
  return "wind.strength";
}

export function createGrassControlDragPerformanceAdapter(
  path: ToolcraftPerformancePath,
): ToolcraftPerformancePathAdapter {
  const target = resolveControlDragTarget(path);
  return {
    action: ({ page }) => toggleGrassSlider(page, target),
    observeOutcome: ({ page }) => readGrassSignature(page),
    pathId: path.id,
    prepare: prepareGrass,
  };
}
