import type { ToolcraftImageAsset, ToolcraftState } from "@/toolcraft/runtime";

import { stackScrollWeightDefault } from "./spiral-gallery-stack";
import { spiralGalleryMaxRenderedSources } from "./spiral-gallery-types";

export type SpiralGalleryLayoutMode = "spiral" | "stack";

export type SpiralGallerySettings = Readonly<{
  background: string;
  card: {
    cornerRadius: number;
    curveRadius: number;
    height: number;
    width: number;
  };
  shadow: {
    blur: number;
    colorHex: string;
    colorRgb: readonly [number, number, number];
    offsetX: number;
    offsetY: number;
    opacity: number;
  };
  layout: {
    mode: SpiralGalleryLayoutMode;
  };
  stack: {
    backTiltRadians: number;
    depthStep: number;
    fallDistance: number;
    fallTiltRadians: number;
    gap: number;
    scrollWeight: number;
  };
  canvas: {
    height: number;
    renderScale: number;
    width: number;
  };
  depth: {
    focusFalloff: number;
    focusFloor: number;
    minScale: number;
    scaleFalloff: number;
    tiltRadians: number;
  };
  interaction: {
    invertDirection: boolean;
    parallax: number;
    pressDepth: number;
    pressShrink: number;
  };
  physics: {
    dragSpeed: number;
    flexResponse: number;
    flexStrength: number;
    inertia: number;
    keyStep: number;
    snapStrength: number;
    wheelSpeed: number;
  };
  spiral: {
    depth: number;
    depthOffset: number;
    radius: number;
    repetitions: number;
    taper: number;
    twistRadians: number;
    verticalGap: number;
  };
  view: {
    cameraDistance: number;
    perspective: number;
    portraitScale: number;
    sceneOffset: number;
  };
}>;

function numberValue(
  state: ToolcraftState,
  target: string,
  fallback: number,
): number {
  const value = Number(state.values[target]);
  return Number.isFinite(value) ? value : fallback;
}

function booleanValue(
  state: ToolcraftState,
  target: string,
  fallback: boolean,
): boolean {
  const value = state.values[target];
  return typeof value === "boolean" ? value : fallback;
}

function layoutModeValue(state: ToolcraftState): SpiralGalleryLayoutMode {
  return state.values["layout.mode"] === "stack" ? "stack" : "spiral";
}

function normalizeHexColor(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  const digits = raw.startsWith("#") ? raw.slice(1) : raw;
  const expanded =
    digits.length === 3
      ? digits
          .split("")
          .map((character) => character + character)
          .join("")
      : digits;
  return /^[0-9a-fA-F]{6}$/.test(expanded)
    ? `#${expanded.toLowerCase()}`
    : fallback;
}

function hexToRgb(hex: string): readonly [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function shadowColorValue(state: ToolcraftState): {
  hex: string;
  opacity: number;
} {
  const value = state.values["shadow.color"];
  if (typeof value === "object" && value !== null && "hex" in value) {
    const record = value as { hex?: unknown; opacity?: unknown };
    const opacity = Number(record.opacity);
    return {
      hex: normalizeHexColor(record.hex, "#000000"),
      opacity: Number.isFinite(opacity)
        ? Math.min(100, Math.max(0, Math.round(opacity))) / 100
        : 0.15,
    };
  }
  if (typeof value === "string") {
    return { hex: normalizeHexColor(value, "#000000"), opacity: 0.15 };
  }
  return { hex: "#000000", opacity: 0.15 };
}

function vectorAxisValue(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(-1, parsed));
}

function shadowOffsetValue(state: ToolcraftState): { x: number; y: number } {
  const value = state.values["shadow.offset"];
  if (typeof value === "object" && value !== null) {
    const record = value as { x?: unknown; y?: unknown };
    return {
      x: vectorAxisValue(record.x, 0.03),
      y: vectorAxisValue(record.y, 0.12),
    };
  }
  return { x: 0.03, y: 0.12 };
}

function colorValue(
  state: ToolcraftState,
  target: string,
  fallback: string,
): string {
  const value = state.values[target];
  if (typeof value === "string") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "hex" in value &&
    typeof value.hex === "string"
  ) {
    return value.hex;
  }
  return fallback;
}

export function readSpiralGallerySettings(
  state: ToolcraftState,
): SpiralGallerySettings {
  return {
    background: colorValue(state, "appearance.background", "#EDEDED"),
    canvas: {
      height: Math.max(1, state.canvas.size.height),
      renderScale: Math.max(
        1,
        Math.min(2, numberValue(state, "canvas.renderScale", 2)),
      ),
      width: Math.max(1, state.canvas.size.width),
    },
    card: {
      cornerRadius: numberValue(state, "card.cornerRadius", 0.055),
      curveRadius: numberValue(state, "card.curveRadius", 10),
      height: numberValue(state, "card.height", 1.5),
      width: numberValue(state, "card.width", 2.7),
    },
    shadow: (() => {
      const color = shadowColorValue(state);
      const offset = shadowOffsetValue(state);
      return {
        blur: numberValue(state, "shadow.blur", 0.31),
        colorHex: color.hex,
        colorRgb: hexToRgb(color.hex),
        offsetX: offset.x,
        offsetY: offset.y,
        opacity: color.opacity,
      };
    })(),
    depth: {
      focusFalloff: numberValue(state, "depth.focusFalloff", 0.36),
      focusFloor: numberValue(state, "depth.focusFloor", 0.58),
      minScale: numberValue(state, "depth.minScale", 0.89),
      scaleFalloff: numberValue(state, "depth.scaleFalloff", 0.43),
      tiltRadians:
        (numberValue(state, "depth.tiltDegrees", 4.01) * Math.PI) / 180,
    },
    interaction: {
      invertDirection: booleanValue(
        state,
        "interaction.invertDirection",
        false,
      ),
      parallax: numberValue(state, "interaction.parallax", 0.36),
      pressDepth: numberValue(state, "interaction.pressDepth", 0.38),
      pressShrink: numberValue(state, "interaction.pressShrink", 0.095),
    },
    layout: {
      mode: layoutModeValue(state),
    },
    physics: {
      dragSpeed: numberValue(state, "physics.dragSpeed", 2.5),
      flexResponse: numberValue(state, "physics.flexResponse", 1.35),
      flexStrength: numberValue(state, "physics.flexStrength", 0.29),
      inertia: numberValue(state, "physics.inertia", 0.02),
      keyStep: numberValue(state, "physics.keyStep", 120),
      snapStrength: numberValue(state, "physics.snapStrength", 0),
      wheelSpeed: numberValue(state, "physics.wheelSpeed", 1),
    },
    spiral: {
      depth: numberValue(state, "spiral.depth", 1.75),
      depthOffset: numberValue(state, "spiral.depthOffset", -0.2),
      radius: numberValue(state, "spiral.radius", 2.8),
      repetitions: Math.max(
        1,
        Math.min(8, Math.round(numberValue(state, "spiral.repetitions", 3))),
      ),
      taper: numberValue(state, "spiral.taper", 0.04),
      twistRadians:
        (numberValue(state, "spiral.twistDegrees", 20.4) * Math.PI) / 180,
      verticalGap: numberValue(state, "spiral.verticalGap", 0.35),
    },
    stack: {
      backTiltRadians:
        (numberValue(state, "stack.backTiltDegrees", 0) * Math.PI) / 180,
      depthStep: numberValue(state, "stack.depthStep", 1.4),
      fallDistance: numberValue(state, "stack.fallDistance", 0.6),
      fallTiltRadians:
        (numberValue(state, "stack.fallTiltDegrees", 74) * Math.PI) / 180,
      gap: numberValue(state, "stack.gap", 0.22),
      scrollWeight: numberValue(
        state,
        "stack.scrollWeight",
        stackScrollWeightDefault,
      ),
    },
    view: {
      cameraDistance: numberValue(state, "view.cameraDistance", 8.6),
      perspective: numberValue(state, "view.perspective", 33),
      portraitScale: numberValue(state, "view.portraitScale", 0.82),
      sceneOffset: numberValue(state, "view.sceneOffset", 0),
    },
  };
}

export function selectSpiralGalleryImages(
  state: ToolcraftState,
): readonly ToolcraftImageAsset[] {
  return state.mediaAssets
    .filter(
      (asset): asset is ToolcraftImageAsset =>
        asset.assetKind === "image" && asset.sourceTarget === "source.images",
    )
    .slice(0, spiralGalleryMaxRenderedSources);
}

export function getSpiralGalleryMediaSignature(
  assets: readonly ToolcraftImageAsset[],
): string {
  return assets
    .map(
      (asset) =>
        `${asset.id}:${asset.dataUrl.length}:${asset.transform?.rotationDeg ?? 0}:${asset.transform?.flipHorizontal ? 1 : 0}:${asset.transform?.flipVertical ? 1 : 0}`,
    )
    .join("|");
}
