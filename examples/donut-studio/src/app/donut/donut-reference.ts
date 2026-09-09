import type {
  DonutSprinklePalette,
  DonutSprinkleShape,
} from "./donut-types";

export function createDonutAssetUrl(
  relativePath: string,
  baseUrl = import.meta.env?.BASE_URL ?? "/",
): string {
  const normalizedBaseUrl =
    baseUrl.length === 0 ? "/" : baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return `${normalizedBaseUrl}donut-studio/${relativePath.replace(/^\/+/, "")}`;
}

export const DONUT_ASSETS = Object.freeze({
  environment: createDonutAssetUrl("brown_photostudio_02_1k.hdr"),
  environmentPreview: createDonutAssetUrl("brown_photostudio_02_1k.png"),
  geometry: createDonutAssetUrl("donut-reference.bin"),
  manifest: createDonutAssetUrl("reference-manifest.json"),
  materialBaseColor: createDonutAssetUrl(
    "materials/megascans-donut-basecolor-2k.jpg",
  ),
  materialManifest: createDonutAssetUrl("materials/source-manifest.json"),
  materialNormal: createDonutAssetUrl(
    "materials/megascans-donut-normal-2k.jpg",
  ),
  materialRoughness: createDonutAssetUrl(
    "materials/megascans-donut-roughness-2k.jpg",
  ),
  model: createDonutAssetUrl("donut-reference.glb"),
});

export const DONUT_GEOMETRY = Object.freeze({
  center: [0.0168, 0.02, 0.013] as const,
  icingMajorRadius: 1.03,
  icingMinorRadius: 0.55,
  icingTubeSegments: 40,
  icingRingSegments: 128,
  sprinkleMaxCount: 900,
  sprinkleReferenceCount: 420,
});

export const DONUT_CAMERA = Object.freeze({
  defaultPosition: [
    -3.4498932616839237,
    5.142120380211952,
    5.624663054654681,
  ] as const,
  far: 100,
  fov: 34,
  near: 0.05,
  target: [0, 0, -0.06] as const,
  up: [
    0.3213835982235889,
    0.7887697577332818,
    -0.5239798202967733,
  ] as const,
});

export const DONUT_MATERIALS = Object.freeze({
  donut: {
    coat: 0.12,
    color: "#9C6235",
    roughness: 0.58,
    sheen: 0.15,
    softness: 0.08,
    subsurface: 0.28,
  },
  icing: {
    coat: 0.12,
    roughness: 0.62,
    sheen: 0.08,
    subsurface: 0.2,
  },
  plate: {
    coat: 0.34,
    color: "#F1EEE7",
    roughness: 0.19454545,
  },
  sprinkle: {
    coat: 0.16,
    roughness: 0.28545454,
  },
});

export const DONUT_LIGHTS = Object.freeze([
  {
    color: "#FFFFFF",
    energy: 3926.99072266,
    location: [-11.04914665, 5.82351398, 12.17998028] as const,
    name: "Area",
    rotation: [-0.06315893, -0.73266619, -0.22124048] as const,
    size: 4.131158,
  },
  {
    color: "#FFDCAE",
    energy: 1600,
    location: [-3.2, -5.2, 6.2] as const,
    name: "Area.001",
    rotation: [-0.51845843, -0.43123901, 0.50585479] as const,
    size: 2.6,
  },
  {
    color: "#B7D2F2",
    energy: 392.69909668,
    location: [4.14147997, 4.83855629, 3.91531706] as const,
    name: "Area.002",
    rotation: [-0.79736966, -0.55674714, -1.13362074] as const,
    size: 4.70047,
  },
] as const);

export const DONUT_WORLD = Object.freeze({
  background: "#75B8F5",
  environmentRotation: Math.PI / 2,
  environmentStrength: 0.45,
});

export const DONUT_SPRINKLE_PALETTES: Readonly<
  Record<DonutSprinklePalette, readonly string[]>
> = Object.freeze({
  1: ["#28F0AD"],
  2: ["#FF8BA7", "#FFD166", "#78D7FF", "#BBA4FF", "#7EE2B8"],
  3: ["#F94144", "#F8961E", "#F9C74F", "#43AA8B", "#577590"],
  4: ["#FF4365", "#FFB82E", "#EAFD38", "#4DE2D0", "#5C7CFA", "#C868FF"],
  5: ["#3C1912", "#6B2D20", "#A44A3F", "#D49A6A", "#F3D5B5"],
});

export const DONUT_SHAPE_LABELS: Readonly<
  Record<DonutSprinkleShape, string>
> = Object.freeze({
  1: "Pellet",
  2: "Pearl",
  3: "Rod",
});
