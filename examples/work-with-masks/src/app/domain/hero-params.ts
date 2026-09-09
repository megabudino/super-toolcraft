import { shouldIncludeToolcraftPreviewBackground, type ToolcraftState } from "@/toolcraft/runtime";

import { backgroundDefaults } from "./background";
import { cameraDefaults, type HeroVector } from "./camera";
import { hazeDefaults, type HeroHazeBlend } from "./haze";
import { lightDefaults } from "./light";
import { readHeroMasks, type HeroMask } from "./masks";
import { materialDefaults } from "./material";
import { postDefaults } from "./post";
import { ribDefaults, type HeroTaperSide } from "./rib";
import { skyDefaults, type HeroGradient, type HeroGradientStop } from "./sky";
import { structureDefaults, type HeroRange, type HeroStructureShape } from "./structure";

export type HeroParams = Readonly<{
  background: Readonly<{ color: string; include: boolean }>;
  camera: Readonly<{
    fov: number;
    height: number;
    pitch: number;
    position: HeroVector;
    roll: number;
    yaw: number;
  }>;
  haze: Readonly<{
    blend: HeroHazeBlend;
    glowColor: string;
    glowPosition: HeroVector;
    glowRadius: number;
    glowStrength: number;
    gradient: HeroGradient;
    strength: number;
  }>;
  light: Readonly<{
    ambient: number;
    azimuth: number;
    color: string;
    elevation: number;
    groundColor: string;
    intensity: number;
    shadowSoftness: number;
    shadows: boolean;
    skyColor: string;
  }>;
  material: Readonly<{
    clearcoat: number;
    clearcoatRoughness: number;
    color: string;
    roughness: number;
  }>;
  masks: Readonly<{
    items: readonly HeroMask[];
    mode: "apply" | "off" | "preview";
  }>;
  post: Readonly<{
    aperture: number;
    bloom: number;
    bloomThreshold: number;
    depthOfField: boolean;
    exposure: number;
    focus: number;
    maxBlur: number;
    occlusion: number;
    occlusionRadius: number;
  }>;
  rib: Readonly<{
    corner: number;
    depth: number;
    taperSide: HeroTaperSide;
    taperStart: number;
    taperTip: number;
    width: number;
  }>;
  sky: Readonly<{
    envIntensity: number;
    fogColor: string;
    fogFar: number;
    fogNear: number;
    gradient: HeroGradient;
    lightGradient: HeroGradient;
  }>;
  structure: Readonly<{
    arc: HeroRange;
    count: number;
    domeLength: number;
    domeMinimum: number;
    radius: number;
    shape: HeroStructureShape;
    spacing: number;
    travel: number;
    twist: number;
    wave: number;
    waveLength: number;
    wavePhase: number;
    xShift: number;
  }>;
}>;

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9A-F]{6}$/u.test(value) ? value : fallback;
}

function asVector(value: unknown, fallback: HeroVector): HeroVector {
  if (typeof value !== "object" || value === null) return fallback;
  const candidate = value as Partial<HeroVector>;
  return {
    x: asNumber(candidate.x, fallback.x),
    y: asNumber(candidate.y, fallback.y),
  };
}

function asRange(value: unknown, fallback: HeroRange): HeroRange {
  if (!Array.isArray(value) || value.length < 2) return fallback;
  return [asNumber(value[0], fallback[0]), asNumber(value[1], fallback[1])];
}

function asGradientStop(value: unknown, fallback: HeroGradientStop): HeroGradientStop {
  if (typeof value !== "object" || value === null) return fallback;
  const candidate = value as Partial<HeroGradientStop>;
  return {
    color: asColor(candidate.color, fallback.color),
    opacity: asNumber(candidate.opacity, fallback.opacity),
    position: typeof candidate.position === "string" ? candidate.position : fallback.position,
  };
}

function asGradient(value: unknown, fallback: HeroGradient): HeroGradient {
  if (typeof value !== "object" || value === null) return fallback;
  const candidate = value as Partial<HeroGradient>;
  const gradientType =
    candidate.gradientType === "angular" ||
    candidate.gradientType === "diamond" ||
    candidate.gradientType === "linear" ||
    candidate.gradientType === "radial"
      ? candidate.gradientType
      : fallback.gradientType;
  const sourceStops = Array.isArray(candidate.stops) ? candidate.stops.slice(0, 8) : fallback.stops;
  const stops = sourceStops.map((stop, index) =>
    asGradientStop(stop, fallback.stops[index] ?? fallback.stops.at(-1)!),
  );
  return {
    angle: asNumber(candidate.angle, fallback.angle),
    gradientType,
    stops: stops.length >= 2 ? stops : fallback.stops,
  };
}

function asShape(value: unknown): HeroStructureShape {
  return value === "dome" || value === "vault" ? value : structureDefaults.shape;
}

function asTaperSide(value: unknown): HeroTaperSide {
  return value === "start" || value === "end" ? value : ribDefaults.taperSide;
}

function asBlend(value: unknown): HeroHazeBlend {
  return value === "screen" || value === "multiply" || value === "normal"
    ? value
    : hazeDefaults.blend;
}

export function readHeroParams(
  state: Readonly<ToolcraftState>,
  options: Readonly<{ preview?: boolean }> = {},
): HeroParams {
  const { values } = state;
  return {
    background: {
      color: asColor(values["appearance.background"], backgroundDefaults.color),
      include: options.preview
        ? shouldIncludeToolcraftPreviewBackground({ state })
        : values["export.includeBackground"] !== false,
    },
    camera: {
      fov: asNumber(values["camera.fov"], cameraDefaults.fov),
      height: asNumber(values["camera.height"], cameraDefaults.height),
      pitch: asNumber(values["camera.pitch"], cameraDefaults.pitch),
      position: asVector(values["camera.position"], cameraDefaults.position),
      roll: asNumber(values["camera.roll"], cameraDefaults.roll),
      yaw: asNumber(values["camera.yaw"], cameraDefaults.yaw),
    },
    haze: {
      blend: asBlend(values["haze.blend"]),
      glowColor: asColor(values["haze.glowColor"], hazeDefaults.glowColor),
      glowPosition: asVector(values["haze.glowPosition"], hazeDefaults.glowPosition),
      glowRadius: asNumber(values["haze.glowRadius"], hazeDefaults.glowRadius),
      glowStrength: asNumber(values["haze.glowStrength"], hazeDefaults.glowStrength) / 100,
      gradient: asGradient(values["haze.gradient"], hazeDefaults.gradient),
      strength: asNumber(values["haze.strength"], hazeDefaults.strength) / 100,
    },
    light: {
      ambient: asNumber(values["light.ambient"], lightDefaults.ambient),
      azimuth: asNumber(values["light.azimuth"], lightDefaults.azimuth),
      color: asColor(values["light.color"], lightDefaults.color),
      elevation: asNumber(values["light.elevation"], lightDefaults.elevation),
      groundColor: asColor(values["light.groundColor"], lightDefaults.groundColor),
      intensity: asNumber(values["light.intensity"], lightDefaults.intensity),
      shadowSoftness: asNumber(values["light.shadowSoftness"], lightDefaults.shadowSoftness),
      shadows:
        typeof values["light.shadows"] === "boolean"
          ? values["light.shadows"]
          : lightDefaults.shadows,
      skyColor: asColor(values["light.skyColor"], lightDefaults.skyColor),
    },
    material: {
      clearcoat: asNumber(values["material.clearcoat"], materialDefaults.clearcoat),
      clearcoatRoughness: asNumber(
        values["material.clearcoatRoughness"],
        materialDefaults.clearcoatRoughness,
      ),
      color: asColor(values["material.color"], materialDefaults.color),
      roughness: asNumber(values["material.roughness"], materialDefaults.roughness),
    },
    masks: readHeroMasks(values, options),
    post: {
      aperture: asNumber(values["post.aperture"], postDefaults.aperture) * 0.0001,
      bloom: asNumber(values["post.bloom"], postDefaults.bloom),
      bloomThreshold: asNumber(values["post.bloomThreshold"], postDefaults.bloomThreshold),
      depthOfField:
        typeof values["post.depthOfField"] === "boolean"
          ? values["post.depthOfField"]
          : postDefaults.depthOfField,
      exposure: asNumber(values["post.exposure"], postDefaults.exposure),
      focus: asNumber(values["post.focus"], postDefaults.focus),
      maxBlur: 0.005,
      occlusion: asNumber(values["post.occlusion"], postDefaults.occlusion) / 100,
      occlusionRadius: asNumber(values["post.occlusionRadius"], postDefaults.occlusionRadius),
    },
    rib: {
      corner: asNumber(values["rib.corner"], ribDefaults.corner),
      depth: asNumber(values["rib.depth"], ribDefaults.depth),
      taperSide: asTaperSide(values["rib.taperSide"]),
      taperStart: asNumber(values["rib.taperStart"], ribDefaults.taperStart),
      taperTip: asNumber(values["rib.taperTip"], ribDefaults.taperTip),
      width: asNumber(values["rib.width"], ribDefaults.width),
    },
    sky: {
      envIntensity: asNumber(values["sky.envIntensity"], skyDefaults.envIntensity),
      fogColor: asColor(values["sky.fogColor"], skyDefaults.fogColor),
      fogFar: asNumber(values["sky.fogFar"], skyDefaults.fogFar),
      fogNear: asNumber(values["sky.fogNear"], skyDefaults.fogNear),
      gradient: asGradient(values["sky.gradient"], skyDefaults.gradient),
      lightGradient: asGradient(values["sky.lightGradient"], skyDefaults.lightGradient),
    },
    structure: {
      arc: asRange(values["structure.arc"], structureDefaults.arc),
      count: Math.round(asNumber(values["structure.count"], structureDefaults.count)),
      domeLength: asNumber(values["structure.domeLength"], structureDefaults.domeLength),
      domeMinimum: 0.15,
      radius: asNumber(values["structure.radius"], structureDefaults.radius),
      shape: asShape(values["structure.shape"]),
      spacing: asNumber(values["structure.spacing"], structureDefaults.spacing),
      travel: 0,
      twist: asNumber(values["structure.twist"], structureDefaults.twist),
      wave: asNumber(values["structure.wave"], structureDefaults.wave),
      waveLength: asNumber(values["structure.waveLength"], structureDefaults.waveLength),
      wavePhase: 0,
      xShift: -30,
    },
  };
}

export function heroStructureKey(params: HeroParams): string {
  const {
    travel: _travel,
    twist: _twist,
    wave: _wave,
    waveLength: _waveLength,
    wavePhase: _wavePhase,
    ...baseStructure
  } = params.structure;
  return JSON.stringify([baseStructure, params.rib]);
}

export function heroEnvironmentKey(params: HeroParams): string {
  return JSON.stringify(params.sky.lightGradient);
}
