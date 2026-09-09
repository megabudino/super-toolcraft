import {
  getToolcraftTimelineLoopProgress,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import { readToolcraftOrientationPose } from "@/toolcraft/runtime/react";

import {
  getLogoSphereEffectivePerspective,
  getLogoSphereFisheyeNormalization,
  getLogoSphereGridTileSpan,
  gridTileReferenceLogoSize,
  type LogoSphereFrame,
  type LogoSphereProjectionInput,
  type SphereDistribution,
  type SpherePoint,
  type SpinAxis,
} from "./logo-sphere-model";
import type { LogoSphereCardStyle } from "./logo-sphere-renderer-types";

export type LogoSphereSettings = Readonly<{
  baseLogoSize: number;
  depth: number;
  distribution: SphereDistribution;
  feather: number;
  fisheye: number;
  inertia: number;
  maskSize: number;
  orientation: LogoSphereProjectionInput["orientation"];
  perspective: number;
  rearOpacity: number;
  radius: number;
  spinAmount: number;
  spinAxis: SpinAxis;
  visibleCount: number;
}>;

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function colorString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "hex" in value &&
    typeof value.hex === "string" &&
    value.hex.trim().length > 0
  ) {
    return value.hex;
  }
  return fallback;
}

function distribution(value: unknown): SphereDistribution {
  return value === "rings" || value === "grid" ? value : "fibonacci";
}

function spinAxis(value: unknown): SpinAxis {
  return value === "horizontal" || value === "vertical" ? value : "diagonal";
}

export function getLogoSphereSettings(
  state: Readonly<ToolcraftState>,
): LogoSphereSettings {
  return {
    baseLogoSize: finiteNumber(state.values["sphere.logoSize"], 112),
    depth: finiteNumber(state.values["sphere.depth"], 100) / 100,
    distribution: distribution(state.values["sphere.distribution"]),
    feather: finiteNumber(state.values["fade.feather"], 22) / 100,
    fisheye: finiteNumber(state.values["sphere.fisheye"], 0) / 100,
    inertia: finiteNumber(state.values["motion.inertia"], 72) / 100,
    maskSize: finiteNumber(state.values["fade.maskSize"], 102) / 100,
    orientation: readToolcraftOrientationPose(
      state.values["view.orbit"],
      readToolcraftOrientationPose(state.defaults["view.orbit"]),
    ),
    perspective: finiteNumber(state.values["sphere.perspective"], 2.3),
    rearOpacity: finiteNumber(state.values["fade.rearOpacity"], 8) / 100,
    radius: finiteNumber(state.values["sphere.radius"], 370),
    spinAmount: finiteNumber(state.values["motion.spinAmount"], 1),
    spinAxis: spinAxis(state.values["motion.spinAxis"]),
    visibleCount: finiteNumber(state.values["sphere.visibleCount"], 30),
  };
}

export function getLogoSphereCardStyle(
  state: Readonly<ToolcraftState>,
): LogoSphereCardStyle {
  return {
    cornerRadius: finiteNumber(state.values["card.cornerRadius"], 12),
    shadowBlur: finiteNumber(state.values["card.shadowBlur"], 16),
    shadowColor: colorString(state.values["card.shadowColor"], "#171717"),
    shadowOffset: finiteNumber(state.values["card.shadowOffset"], 8),
    shadowOpacity:
      finiteNumber(state.values["card.shadowOpacity"], 28) / 100,
    strokeColor: colorString(state.values["card.strokeColor"], "#D7D6D2"),
    strokeWidth: finiteNumber(state.values["card.strokeWidth"], 1.5),
  };
}

export function getLogoSphereSourceAssets(
  mediaAssets: Readonly<ToolcraftState["mediaAssets"]>,
): ToolcraftState["mediaAssets"] {
  const uploaded = mediaAssets.filter(
    (asset) =>
      asset.assetKind === "image" &&
      asset.sourceTarget === "logos.sources" &&
      !asset.id.startsWith("logo-sphere-default-") &&
      asset.lifecycle !== "unavailable",
  );
  if (uploaded.length > 0) {
    return uploaded;
  }
  return mediaAssets.filter(
    (asset) =>
      asset.assetKind === "file" &&
      asset.sourceTarget === "logos.defaults" &&
      asset.mimeType === "image/svg+xml" &&
      asset.lifecycle !== "unavailable",
  );
}

export function getLogoSphereInfiniteRadius(settings: LogoSphereSettings): number {
  return Math.min(2400, Math.max(60, settings.radius));
}

export function getLogoSphereRenderScale(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(2, Math.max(1, value))
    : 2;
}

export function getLogoSphereCanvasBacking(
  frame: LogoSphereFrame,
  devicePixelRatio: number,
  renderScaleValue: unknown,
): Readonly<{
  height: number;
  pixelRatio: number;
  width: number;
}> {
  const pixelRatio = devicePixelRatio * getLogoSphereRenderScale(renderScaleValue);
  return {
    height: Math.max(1, Math.round(frame.height * pixelRatio)),
    pixelRatio,
    width: Math.max(1, Math.round(frame.width * pixelRatio)),
  };
}

export function getLogoSphereSceneRect(
  state: Readonly<ToolcraftState>,
): LogoSphereFrame | null {
  const hasSource = getLogoSphereSourceAssets(state.mediaAssets).length > 0;
  if (!hasSource) {
    return null;
  }

  const settings = getLogoSphereSettings(state);
  const radius = getLogoSphereInfiniteRadius(settings);
  const effectivePerspective = getLogoSphereEffectivePerspective(
    settings.perspective,
    settings.depth,
    settings.fisheye,
  );
  const fisheyeNormalization = getLogoSphereFisheyeNormalization(
    settings.perspective,
    settings.depth,
    settings.fisheye,
  );
  const maximumScale =
    (effectivePerspective /
      Math.max(0.25, effectivePerspective - settings.depth)) *
    fisheyeNormalization;
  // Limb positions can project outside the geometric radius; the widest
  // screen radius of a perspective sphere is E / sqrt(E^2 - d^2).
  const silhouetteScale =
    (effectivePerspective /
      Math.sqrt(
        Math.max(0.05, effectivePerspective ** 2 - settings.depth ** 2),
      )) *
    fisheyeNormalization;
  const cardSize =
    settings.distribution === "grid"
      ? getLogoSphereGridTileSpan() *
        radius *
        (settings.baseLogoSize / gridTileReferenceLogoSize)
      : settings.baseLogoSize;
  const extent =
    radius * silhouetteScale + (cardSize * maximumScale) / 2 + 4;

  return {
    height: extent * 2,
    width: extent * 2,
    x: -extent,
    y: -extent,
  };
}

export function createLogoSphereProjectionInput(
  state: Readonly<ToolcraftState>,
  frame: LogoSphereFrame,
  options: Readonly<{
    loopProgress?: number;
    points?: readonly SpherePoint[];
  }> = {},
): LogoSphereProjectionInput {
  const settings = getLogoSphereSettings(state);

  return {
    baseLogoSize: settings.baseLogoSize,
    depth: settings.depth,
    distribution: settings.distribution,
    feather: settings.feather,
    fisheye: settings.fisheye,
    frame,
    loopProgress:
      options.loopProgress ?? getToolcraftTimelineLoopProgress(state.timeline),
    maskSize: settings.maskSize,
    orientation: settings.orientation,
    perspective: settings.perspective,
    ...(options.points ? { points: options.points } : {}),
    rearOpacity: settings.rearOpacity,
    radius: settings.radius,
    ...(state.canvas.mode === "infinite"
      ? { sphereRadius: getLogoSphereInfiniteRadius(settings) }
      : {}),
    spinAmount: settings.spinAmount,
    spinAxis: settings.spinAxis,
    visibleCount: settings.visibleCount,
  };
}
