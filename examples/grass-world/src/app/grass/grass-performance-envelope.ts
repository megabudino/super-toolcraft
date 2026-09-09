import {
  defineToolcraftDiscreteFixtureAdapter,
  defineToolcraftFixtureAdapter,
  requireToolcraftSchemaPerformanceValues,
  type ToolcraftPerformanceFixtureAdapterRegistry,
  type ToolcraftWorkloadDimension,
  type ToolcraftWorkloadEnvelope,
} from "@/toolcraft/runtime";

import { appSchema } from "../app-schema";

const continuousAdapter = (dimensionId: string) =>
  defineToolcraftFixtureAdapter<number>({
    apply: (value) => value,
    dimensionId,
    kind: "continuous",
    observe: (value) => Number(value),
  });

const octaveAdapter = (dimensionId: string, target: string) =>
  defineToolcraftDiscreteFixtureAdapter({
    dimensionId,
    domain: {
      kind: "schema-options",
      optionValues: ["1", "2", "3", "4", "5", "6"],
      target,
    },
    entries: [1, 2, 3, 4, 5, 6].map((value) => ({
      appliedValue: String(value),
      value,
    })),
  });

export const grassPerformanceFixtureAdapters = {
  dimensions: {
    "blade-count": continuousAdapter("blade-count"),
    "butterfly-count": continuousAdapter("butterfly-count"),
    "clover-mask-octaves": octaveAdapter(
      "clover-mask-octaves",
      "surface.cloverMaskDetail",
    ),
    "live-preview-tall-count": continuousAdapter("live-preview-tall-count"),
    "live-preview-lawn-count": continuousAdapter("live-preview-lawn-count"),
    "lawn-blade-count": continuousAdapter("lawn-blade-count"),
    "lawn-mask-octaves": octaveAdapter(
      "lawn-mask-octaves",
      "lawn.distributionDetail",
    ),
    "preview-render-scale": continuousAdapter("preview-render-scale"),
    "rock-scan-count": continuousAdapter("rock-scan-count"),
    "terrain-octaves": octaveAdapter("terrain-octaves", "terrain.detail"),
    "tall-mask-octaves": octaveAdapter(
      "tall-mask-octaves",
      "field.distributionDetail",
    ),
    "tufted-scan-count": continuousAdapter("tufted-scan-count"),
    "white-flower-count": continuousAdapter("white-flower-count"),
    "wild-scan-count": continuousAdapter("wild-scan-count"),
    "yellow-flower-count": continuousAdapter("yellow-flower-count"),
  },
} satisfies ToolcraftPerformanceFixtureAdapterRegistry;

type SchemaDimensionDefinition = Readonly<{
  id: string;
  mapping?: ToolcraftWorkloadDimension["mapping"];
  target: string;
  unit: string;
}>;

function schemaDimension({
  id,
  mapping = "direct",
  target,
  unit,
}: SchemaDimensionDefinition): ToolcraftWorkloadDimension {
  const values = requireToolcraftSchemaPerformanceValues(appSchema, target);
  return {
    batchMax: Number(values.max),
    defaultValue: Number(values.default),
    id,
    interactiveMax: Number(values.max),
    mapping,
    source: {
      kind: "schema-target",
      target,
      workloadBoundary: "maximum",
    },
    unit,
  };
}

export const grassWorkloadEnvelope = {
  dimensions: [
    schemaDimension({
      id: "blade-count",
      target: "field.densityMax",
      unit: "instanced-blades",
    }),
    schemaDimension({
      id: "live-preview-tall-count",
      target: "preview.bladeCount",
      unit: "live-tall-instances",
    }),
    schemaDimension({
      id: "lawn-blade-count",
      target: "lawn.densityMax",
      unit: "instanced-lawn-blades",
    }),
    schemaDimension({
      id: "live-preview-lawn-count",
      target: "preview.lawnBladeCount",
      unit: "equivalent-live-lawn-blades",
    }),
    (() => {
      const values = requireToolcraftSchemaPerformanceValues(
        appSchema,
        "canvas.renderScale",
      );
      return {
        batchMax: Number(values.max),
        defaultValue: Number(values.default),
        id: "preview-render-scale",
        interactiveMax: Number(values.max),
        mapping: "quadratic",
        source: { kind: "runtime-state", path: "canvas.renderScale" },
        unit: "backing-scale",
      } satisfies ToolcraftWorkloadDimension;
    })(),
    schemaDimension({
      id: "terrain-octaves",
      target: "terrain.detail",
      unit: "noise-octaves",
    }),
    schemaDimension({
      id: "tall-mask-octaves",
      target: "field.distributionDetail",
      unit: "noise-octaves",
    }),
    schemaDimension({
      id: "lawn-mask-octaves",
      target: "lawn.distributionDetail",
      unit: "noise-octaves",
    }),
    schemaDimension({
      id: "clover-mask-octaves",
      target: "surface.cloverMaskDetail",
      unit: "noise-octaves",
    }),
    schemaDimension({
      id: "tufted-scan-count",
      target: "scan.tufted.count",
      unit: "scan-instances",
    }),
    schemaDimension({
      id: "wild-scan-count",
      target: "scan.wild.count",
      unit: "scan-instances",
    }),
    schemaDimension({
      id: "white-flower-count",
      target: "scan.white.count",
      unit: "scan-instances",
    }),
    schemaDimension({
      id: "yellow-flower-count",
      target: "scan.yellow.count",
      unit: "scan-instances",
    }),
    schemaDimension({
      id: "rock-scan-count",
      target: "scan.rocks.count",
      unit: "scan-instances",
    }),
    schemaDimension({
      id: "butterfly-count",
      target: "butterflies.count",
      unit: "butterfly-instances",
    }),
  ],
} satisfies ToolcraftWorkloadEnvelope;
