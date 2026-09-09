import {
  isGrassFieldPointInside,
  type GrassFieldShapeSettings,
} from "./grass-field-shape";

export type GrassPlacementCandidate = Readonly<{
  sourceIndex: number;
  x: number;
  z: number;
}>;

type WeightedCandidate = GrassPlacementCandidate &
  Readonly<{ priority: number }>;

type GrassBasePlacementOptions = Readonly<{
  count: number;
  distanceMin: number;
  seed: number;
  shape: GrassFieldShapeSettings;
}>;

type GrassCoverageFilterOptions = Readonly<{
  candidates: readonly GrassPlacementCandidate[];
  coverageAt: (x: number, z: number) => number;
  seed: number;
}>;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hash01(seed: number, index: number, channel: number): number {
  let value = Math.imul(seed + channel * 0x9e3779b9, 0x85ebca6b);
  value ^= Math.imul(index + 1, 0xc2b2ae35);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4_294_967_296;
}

export function createGrassBasePlacementCandidates(
  options: GrassBasePlacementOptions,
): readonly GrassPlacementCandidate[] {
  const count = Math.max(0, Math.floor(options.count));
  if (count === 0) return [];

  return createGrassPlacementCandidatePool(options).slice(0, count);
}

export function createGrassPlacementCandidatePool(
  options: GrassBasePlacementOptions,
): readonly GrassPlacementCandidate[] {
  return createSortedGrassPlacementPool(options).map(
    ({ sourceIndex: index, x, z }) => ({
      sourceIndex: index,
      x,
      z,
    }),
  );
}

function createSortedGrassPlacementPool(
  options: GrassBasePlacementOptions,
): readonly WeightedCandidate[] {
  const count = Math.max(0, Math.floor(options.count));
  if (count === 0) return [];

  const fieldArea = options.shape.width * options.shape.depth * (Math.PI / 4);
  const desiredPoolSize = Math.max(count + 512, count * 4);
  const hexAreaFactor = Math.sqrt(3) / 2;
  const desiredSpacing = Math.sqrt(
    fieldArea / Math.max(1, desiredPoolSize * hexAreaFactor),
  );
  const spacing = Math.max(
    0.0001,
    options.distanceMin * 1.05,
    desiredSpacing,
  );
  const rowSpacing = spacing * hexAreaFactor;
  const extentX = options.shape.width * 0.56;
  const extentZ = options.shape.depth * 0.56;
  const columns = Math.ceil((extentX * 2) / spacing) + 2;
  const rows = Math.ceil((extentZ * 2) / rowSpacing) + 2;
  const jitter = spacing * 0.008;
  const candidates: WeightedCandidate[] = [];
  let sourceIndex = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const baseX =
        -extentX +
        (column + 0.5 + (row % 2) * 0.5) * spacing;
      const baseZ = -extentZ + (row + 0.5) * rowSpacing;
      const x =
        baseX + (hash01(options.seed, sourceIndex, 3) * 2 - 1) * jitter;
      const z =
        baseZ + (hash01(options.seed, sourceIndex, 5) * 2 - 1) * jitter;
      const currentIndex = sourceIndex;
      sourceIndex += 1;

      if (
        !isGrassFieldPointInside(x, z, options.shape)
      ) {
        continue;
      }

      const random = Math.max(
        Number.EPSILON,
        hash01(options.seed, currentIndex, 7),
      );
      candidates.push({
        priority: -Math.log(random),
        sourceIndex: currentIndex,
        x,
        z,
      });
    }
  }

  candidates.sort(
    (left, right) =>
      left.priority - right.priority || left.sourceIndex - right.sourceIndex,
  );
  return candidates;
}

export function filterGrassPlacementCandidatesByCoverage({
  candidates,
  coverageAt,
  seed,
}: GrassCoverageFilterOptions): readonly GrassPlacementCandidate[] {
  return candidates.filter((candidate) =>
    isGrassPlacementCandidateAccepted(candidate, coverageAt, seed),
  );
}

function isGrassPlacementCandidateAccepted(
  { sourceIndex, x, z }: GrassPlacementCandidate,
  coverageAt: (x: number, z: number) => number,
  seed: number,
): boolean {
  const coverage = clamp01(coverageAt(x, z));
  if (coverage <= 0) return false;
  if (coverage >= 1) return true;
  return hash01(seed, sourceIndex, 11) < coverage;
}
