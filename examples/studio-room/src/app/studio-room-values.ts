import type { ToolcraftMediaAsset } from "@/toolcraft/runtime";

export const STUDIO_ROOM_WALL_FILL_REVISION_TARGET = "studioRoom.wallFillDefaultRevision";

export const studioRoomTargets = {
  compositionButtonGap: "composition.buttonGap",
  compositionFirstRowScale: "composition.firstRowScale",
  compositionLineGap: "composition.lineGap",
  compositionSecondRowScale: "composition.secondRowScale",
  fineGridColor: "fineGrid.color",
  fineGridEnabled: "fineGrid.enabled",
  fineGridOpacity: "fineGrid.opacity",
  fineGridSubdivision: "fineGrid.subdivision",
  fineGridThickness: "fineGrid.thickness",
  gridColor: "grid.color",
  gridColumns: "grid.columns",
  gridDepthDivisions: "grid.depthDivisions",
  gridOpacity: "grid.opacity",
  gridRows: "grid.rows",
  gridThickness: "grid.thickness",
  motionEnabled: "motion.enabled",
  motionParallax: "motion.parallax",
  motionScrollNudge: "motion.scrollNudge",
  motionSmoothness: "motion.smoothness",
  roomInnerGridDepth: "room.innerGrid.depth",
  roomInnerGridEnabled: "room.innerGrid.enabled",
  roomInnerGridFalloff: "room.innerGrid.falloff",
  roomInnerGridOpacity: "room.innerGrid.opacity",
  roomWallBorderColorOpacity: "room.wallBorder.colorOpacity",
  roomWallBorderWidth: "room.wallBorder.width",
  roomWallFill: "room.wallFill",
  roomDepth: "room.depth",
  roomVanishing: "room.vanishing",
  tilesDevelop: "tiles.develop",
  tilesFog: "tiles.fog",
  tilesHoverLift: "tiles.hoverLift",
  tilesImages: "tiles.images",
  tilesInterval: "tiles.interval",
  tilesPerSurface: "tiles.perSurface",
  tilesShuffleStyle: "tiles.shuffleStyle",
  trailAmount: "trail.amount",
  trailEnabled: "trail.enabled",
  trailFade: "trail.fade",
  trailStrength: "trail.strength",
} as const;

export type StudioRoomTileShuffleStyle = "slide" | "swap";
export type StudioRoomColorOpacity = Readonly<{
  hex: string;
  opacity: number;
}>;
export type StudioRoomTileImageTransform = Readonly<{
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotationDeg: 0 | 90 | 180 | 270;
}>;
export type StudioRoomTileImage = Readonly<{
  height: number;
  id: string;
  order: number;
  ref: string;
  transform: StudioRoomTileImageTransform;
  width: number;
}>;
export type StudioRoomSettings = Readonly<{
  composition: Readonly<{
    buttonGap: number;
    firstRowScale: number;
    lineGap: number;
    secondRowScale: number;
  }>;
  fineGrid: Readonly<{
    color: string;
    enabled: boolean;
    opacity: number;
    subdivision: number;
    thickness: number;
  }>;
  grid: Readonly<{
    color: string;
    columns: number;
    depthDivisions: number;
    opacity: number;
    rows: number;
    thickness: number;
  }>;
  height: number;
  motion: Readonly<{
    enabled: boolean;
    parallax: number;
    scrollNudge: number;
    smoothness: number;
  }>;
  room: Readonly<{
    depth: number;
    innerGrid: Readonly<{
      depth: number;
      enabled: boolean;
      falloff: number;
      opacity: number;
    }>;
    vanishing: Readonly<{ x: number; y: number }>;
    wallBorder: Readonly<{ colorOpacity: StudioRoomColorOpacity; width: number }>;
    wallFill: string;
  }>;
  tiles: Readonly<{
    develop: number;
    fog: number;
    hoverLift: number;
    images: readonly StudioRoomTileImage[];
    interval: number;
    perSurface: number;
    shuffleStyle: StudioRoomTileShuffleStyle;
  }>;
  trail: Readonly<{
    amount: number;
    enabled: boolean;
    fade: number;
    strength: number;
  }>;
}>;

export const STUDIO_ROOM_DEFAULTS: StudioRoomSettings = {
  composition: {
    buttonGap: 6,
    firstRowScale: 100,
    lineGap: -12,
    secondRowScale: 100,
  },
  fineGrid: {
    color: "#6F7946",
    enabled: true,
    opacity: 12,
    subdivision: 3,
    thickness: 0.5,
  },
  grid: {
    color: "#6F7946",
    columns: 8,
    depthDivisions: 4,
    opacity: 34,
    rows: 4,
    thickness: 1.3,
  },
  height: 1080,
  motion: {
    enabled: true,
    parallax: 100,
    scrollNudge: 0.35,
    smoothness: 0.5,
  },
  room: {
    depth: 0.3,
    innerGrid: {
      depth: 22,
      enabled: false,
      falloff: 1.6,
      opacity: 40,
    },
    vanishing: { x: 0, y: 0 },
    wallBorder: { colorOpacity: { hex: "#6F7946", opacity: 34 }, width: 1.3 },
    wallFill: "#F0F4E2",
  },
  tiles: {
    develop: 0.25,
    fog: 0,
    hoverLift: 0.25,
    images: [],
    interval: 1.4,
    perSurface: 2,
    shuffleStyle: "swap",
  },
  trail: { amount: 2, enabled: true, fade: 0.7, strength: 40 },
};

function numberValue(value: unknown, fallback: number, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function integerValue(value: unknown, fallback: number, minimum: number, maximum: number) {
  return Math.round(numberValue(value, fallback, minimum, maximum));
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function colorValue(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9A-F]{6}$/i.test(value)
    ? value.toUpperCase()
    : fallback;
}

function colorOpacityValue(
  value: unknown,
  fallback: StudioRoomColorOpacity,
): StudioRoomColorOpacity {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return fallback;
  const colorOpacity = value as Record<string, unknown>;
  return {
    hex: colorValue(colorOpacity.hex, fallback.hex),
    opacity: numberValue(colorOpacity.opacity, fallback.opacity, 0, 100),
  };
}

function vectorValue(value: unknown, fallback: Readonly<{ x: number; y: number }>) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return fallback;
  const vector = value as Record<string, unknown>;
  return {
    x: numberValue(vector.x, fallback.x, -1, 1),
    y: numberValue(vector.y, fallback.y, -1, 1),
  };
}

function shuffleStyleValue(value: unknown): StudioRoomTileShuffleStyle {
  return value === "slide" || value === "swap" ? value : STUDIO_ROOM_DEFAULTS.tiles.shuffleStyle;
}

function normalizeRotation(value: unknown): 0 | 90 | 180 | 270 {
  return value === 90 || value === 180 || value === 270 ? value : 0;
}

export function createStudioRoomTileImagesFromMediaAssets(
  mediaAssets: readonly ToolcraftMediaAsset[],
): readonly StudioRoomTileImage[] {
  return mediaAssets
    .flatMap((asset) => {
      if (
        asset.assetKind !== "image" ||
        asset.sourceTarget !== studioRoomTargets.tilesImages ||
        asset.lifecycle === "unavailable"
      ) {
        return [];
      }

      return [
        {
          asset,
          image: {
            height: Math.max(1, asset.size?.height ?? 1),
            id: asset.id,
            order: 0,
            ref: asset.resourceRef,
            transform: {
              flipHorizontal: asset.transform?.flipHorizontal === true,
              flipVertical: asset.transform?.flipVertical === true,
              rotationDeg: normalizeRotation(asset.transform?.rotationDeg),
            },
            width: Math.max(1, asset.size?.width ?? 1),
          } satisfies StudioRoomTileImage,
        },
      ];
    })
    .map(({ image }, order) => ({ ...image, order }));
}

export function createStudioRoomSettingsFromValues(
  values: Readonly<Record<string, unknown>>,
  height: number,
  images: readonly StudioRoomTileImage[] = [],
): StudioRoomSettings {
  return {
    composition: {
      buttonGap: numberValue(
        values[studioRoomTargets.compositionButtonGap],
        STUDIO_ROOM_DEFAULTS.composition.buttonGap,
        0,
        160,
      ),
      firstRowScale: numberValue(
        values[studioRoomTargets.compositionFirstRowScale],
        STUDIO_ROOM_DEFAULTS.composition.firstRowScale,
        50,
        150,
      ),
      lineGap: numberValue(
        values[studioRoomTargets.compositionLineGap],
        STUDIO_ROOM_DEFAULTS.composition.lineGap,
        -40,
        80,
      ),
      secondRowScale: numberValue(
        values[studioRoomTargets.compositionSecondRowScale],
        STUDIO_ROOM_DEFAULTS.composition.secondRowScale,
        50,
        150,
      ),
    },
    fineGrid: {
      color: colorValue(
        values[studioRoomTargets.fineGridColor],
        STUDIO_ROOM_DEFAULTS.fineGrid.color,
      ),
      enabled: booleanValue(
        values[studioRoomTargets.fineGridEnabled],
        STUDIO_ROOM_DEFAULTS.fineGrid.enabled,
      ),
      opacity: numberValue(
        values[studioRoomTargets.fineGridOpacity],
        STUDIO_ROOM_DEFAULTS.fineGrid.opacity,
        0,
        100,
      ),
      subdivision: integerValue(
        values[studioRoomTargets.fineGridSubdivision],
        STUDIO_ROOM_DEFAULTS.fineGrid.subdivision,
        2,
        6,
      ),
      thickness: numberValue(
        values[studioRoomTargets.fineGridThickness],
        STUDIO_ROOM_DEFAULTS.fineGrid.thickness,
        0.5,
        2,
      ),
    },
    grid: {
      color: colorValue(values[studioRoomTargets.gridColor], STUDIO_ROOM_DEFAULTS.grid.color),
      columns: integerValue(
        values[studioRoomTargets.gridColumns],
        STUDIO_ROOM_DEFAULTS.grid.columns,
        4,
        16,
      ),
      depthDivisions: integerValue(
        values[studioRoomTargets.gridDepthDivisions],
        STUDIO_ROOM_DEFAULTS.grid.depthDivisions,
        2,
        8,
      ),
      opacity: numberValue(
        values[studioRoomTargets.gridOpacity],
        STUDIO_ROOM_DEFAULTS.grid.opacity,
        0,
        100,
      ),
      rows: integerValue(values[studioRoomTargets.gridRows], STUDIO_ROOM_DEFAULTS.grid.rows, 2, 8),
      thickness: numberValue(
        values[studioRoomTargets.gridThickness],
        STUDIO_ROOM_DEFAULTS.grid.thickness,
        0.5,
        4,
      ),
    },
    height: integerValue(height, STUDIO_ROOM_DEFAULTS.height, 576, 8192),
    motion: {
      enabled: booleanValue(
        values[studioRoomTargets.motionEnabled],
        STUDIO_ROOM_DEFAULTS.motion.enabled,
      ),
      parallax: numberValue(
        values[studioRoomTargets.motionParallax],
        STUDIO_ROOM_DEFAULTS.motion.parallax,
        0,
        150,
      ),
      scrollNudge: numberValue(
        values[studioRoomTargets.motionScrollNudge],
        STUDIO_ROOM_DEFAULTS.motion.scrollNudge,
        0,
        1,
      ),
      smoothness: numberValue(
        values[studioRoomTargets.motionSmoothness],
        STUDIO_ROOM_DEFAULTS.motion.smoothness,
        0,
        1,
      ),
    },
    room: {
      depth: numberValue(
        values[studioRoomTargets.roomDepth],
        STUDIO_ROOM_DEFAULTS.room.depth,
        0,
        1,
      ),
      innerGrid: {
        depth: numberValue(
          values[studioRoomTargets.roomInnerGridDepth],
          STUDIO_ROOM_DEFAULTS.room.innerGrid.depth,
          5,
          60,
        ),
        enabled: booleanValue(
          values[studioRoomTargets.roomInnerGridEnabled],
          STUDIO_ROOM_DEFAULTS.room.innerGrid.enabled,
        ),
        falloff: numberValue(
          values[studioRoomTargets.roomInnerGridFalloff],
          STUDIO_ROOM_DEFAULTS.room.innerGrid.falloff,
          0.5,
          4,
        ),
        opacity: numberValue(
          values[studioRoomTargets.roomInnerGridOpacity],
          STUDIO_ROOM_DEFAULTS.room.innerGrid.opacity,
          0,
          100,
        ),
      },
      vanishing: vectorValue(
        values[studioRoomTargets.roomVanishing],
        STUDIO_ROOM_DEFAULTS.room.vanishing,
      ),
      wallBorder: {
        colorOpacity: colorOpacityValue(
          values[studioRoomTargets.roomWallBorderColorOpacity],
          STUDIO_ROOM_DEFAULTS.room.wallBorder.colorOpacity,
        ),
        width: numberValue(
          values[studioRoomTargets.roomWallBorderWidth],
          STUDIO_ROOM_DEFAULTS.room.wallBorder.width,
          0,
          12,
        ),
      },
      wallFill: colorValue(
        values[studioRoomTargets.roomWallFill],
        STUDIO_ROOM_DEFAULTS.room.wallFill,
      ),
    },
    tiles: {
      develop: numberValue(
        values[studioRoomTargets.tilesDevelop],
        STUDIO_ROOM_DEFAULTS.tiles.develop,
        0,
        1,
      ),
      fog: numberValue(values[studioRoomTargets.tilesFog], STUDIO_ROOM_DEFAULTS.tiles.fog, 0, 1),
      hoverLift: numberValue(
        values[studioRoomTargets.tilesHoverLift],
        STUDIO_ROOM_DEFAULTS.tiles.hoverLift,
        0,
        1,
      ),
      images: images.map((image, order) => ({ ...image, order })),
      interval: numberValue(
        values[studioRoomTargets.tilesInterval],
        STUDIO_ROOM_DEFAULTS.tiles.interval,
        0.4,
        5,
      ),
      perSurface: integerValue(
        values[studioRoomTargets.tilesPerSurface],
        STUDIO_ROOM_DEFAULTS.tiles.perSurface,
        1,
        6,
      ),
      shuffleStyle: shuffleStyleValue(values[studioRoomTargets.tilesShuffleStyle]),
    },
    trail: {
      amount: integerValue(
        values[studioRoomTargets.trailAmount],
        STUDIO_ROOM_DEFAULTS.trail.amount,
        1,
        3,
      ),
      enabled: booleanValue(
        values[studioRoomTargets.trailEnabled],
        STUDIO_ROOM_DEFAULTS.trail.enabled,
      ),
      fade: numberValue(
        values[studioRoomTargets.trailFade],
        STUDIO_ROOM_DEFAULTS.trail.fade,
        0.2,
        2,
      ),
      strength: numberValue(
        values[studioRoomTargets.trailStrength],
        STUDIO_ROOM_DEFAULTS.trail.strength,
        0,
        100,
      ),
    },
  };
}
