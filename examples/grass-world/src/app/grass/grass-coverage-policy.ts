export type GrassCoverageLayer = "lawn" | "tall";

export type GrassCoveragePartition = Readonly<{
  detailed: number;
  lightweight: number;
  total: number;
}>;

const layerHardCaps = {
  lawn: 36_000,
  tall: 24_000,
} as const satisfies Record<GrassCoverageLayer, number>;

export function calculateGrassCoverageCount(
  options: Readonly<{
    densityMax: number;
    layer: GrassCoverageLayer;
  }>,
): number {
  return Math.max(
    1,
    Math.min(
      layerHardCaps[options.layer],
      Math.max(1, Math.floor(options.densityMax)),
    ),
  );
}

export function partitionGrassCoverage(
  total: number,
  detailLimit: number,
): GrassCoveragePartition {
  const boundedTotal = Math.max(0, Math.floor(total));
  const detailed = Math.min(boundedTotal, Math.max(0, Math.floor(detailLimit)));
  return {
    detailed,
    lightweight: boundedTotal - detailed,
    total: boundedTotal,
  };
}

export function getGrassCoverageCellSize(area: number, count: number): number {
  return Math.sqrt(Math.max(0, area) / Math.max(1, Math.floor(count)));
}
