import {
  grassScanCommonLayoutTargets,
  grassScanEnabledTargets,
  grassScanLayoutTargets,
} from "./grass/grass-render-targets";

export const grassScanPipelinePasses = [
  {
    cacheKey: ["runtime.initialRender"] as const,
    cost: {
      dimensions: [],
      frequency: "discrete" as const,
      relationship: "constant" as const,
    },
    id: "grass-scan-resource",
    inputs: ["runtime.initialRender"],
    invalidatedBy: ["runtime.initialRender"],
    kind: "decode" as const,
    lifecycle: { cache: "memoized" as const, resourceScope: "source" as const },
    output: "source" as const,
    quality: "full" as const,
    runsOn: "main" as const,
  },
  ...(
    [
      ["tufted", "grass-tufted-layout-build", "tufted-scan-count"],
      ["wild", "grass-wild-layout-build", "wild-scan-count"],
      ["white", "grass-white-layout-build", "white-flower-count"],
      ["yellow", "grass-yellow-layout-build", "yellow-flower-count"],
      ["rocks", "grass-rock-layout-build", "rock-scan-count"],
    ] as const
  ).map(([kind, id, dimension]) => ({
    cacheKey: [
      ...grassScanCommonLayoutTargets,
      ...grassScanLayoutTargets[kind],
      ...grassScanEnabledTargets[kind],
    ] as readonly [string, ...string[]],
    cost: {
      dimensions: [dimension, "terrain-octaves"],
      frequency: "interaction" as const,
      relationship: "product" as const,
    },
    id,
    inputs: [
      ...grassScanCommonLayoutTargets,
      ...grassScanLayoutTargets[kind],
      ...grassScanEnabledTargets[kind],
    ],
    invalidatedBy: [
      ...grassScanCommonLayoutTargets,
      ...grassScanLayoutTargets[kind],
      ...grassScanEnabledTargets[kind],
    ],
    kind: "vector-build" as const,
    lifecycle: {
      cache: "memoized" as const,
      resourceScope: "renderer" as const,
    },
    output: "intermediate" as const,
    quality: "full" as const,
    runsOn: "main" as const,
  })),
] as const;
