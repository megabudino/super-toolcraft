import type { ToolcraftCommand } from "@/toolcraft/runtime";

import { cameraDefaults } from "./camera";
import { hazeDefaults } from "./haze";
import { lightDefaults } from "./light";
import { materialDefaults } from "./material";
import { flowDefaults } from "./flow";
import { postDefaults } from "./post";
import { ribDefaults } from "./rib";
import { skyDefaults } from "./sky";
import { structureDefaults } from "./structure";

export type HeroPresetId = "amber" | "bend" | "oculus" | "wave";

export type HeroPresetValues = Readonly<Record<string, unknown>>;

export const heroPresetActionValues: Readonly<Record<HeroPresetId, string>> = {
  amber: "preset.amber",
  bend: "preset.bend",
  oculus: "preset.oculus",
  wave: "preset.wave",
};

/**
 * Reference look 1 (`reference/photos/oculus-1-rings.png`): wide fanning ribs
 * seen from inside a large vault close to its wall, blue sky haze in the
 * upper-left corner and a warm sun glow rising from the lower-left. This is
 * also the canonical default state of every scene control.
 */
const oculus: HeroPresetValues = {
  "flow.travel": flowDefaults.travel,
  "flow.direction": flowDefaults.direction,
  "flow.glowOrbit": flowDefaults.glowOrbit,
  "flow.glowOrbitRadius": flowDefaults.glowOrbitRadius,
  "camera.fov": cameraDefaults.fov,
  "camera.height": cameraDefaults.height,
  "camera.pitch": cameraDefaults.pitch,
  "camera.position": cameraDefaults.position,
  "camera.roll": cameraDefaults.roll,
  "camera.yaw": cameraDefaults.yaw,
  "haze.blend": hazeDefaults.blend,
  "haze.glowColor": hazeDefaults.glowColor,
  "haze.glowPosition": hazeDefaults.glowPosition,
  "haze.glowRadius": hazeDefaults.glowRadius,
  "haze.glowStrength": hazeDefaults.glowStrength,
  "haze.gradient": hazeDefaults.gradient,
  "haze.strength": hazeDefaults.strength,
  "light.ambient": lightDefaults.ambient,
  "light.azimuth": lightDefaults.azimuth,
  "light.color": lightDefaults.color,
  "light.elevation": lightDefaults.elevation,
  "light.groundColor": lightDefaults.groundColor,
  "light.intensity": lightDefaults.intensity,
  "light.shadowSoftness": lightDefaults.shadowSoftness,
  "light.shadows": lightDefaults.shadows,
  "light.skyColor": lightDefaults.skyColor,
  "material.clearcoat": materialDefaults.clearcoat,
  "material.clearcoatRoughness": materialDefaults.clearcoatRoughness,
  "material.color": materialDefaults.color,
  "material.roughness": materialDefaults.roughness,
  "post.aperture": postDefaults.aperture,
  "post.bloom": postDefaults.bloom,
  "post.bloomThreshold": postDefaults.bloomThreshold,
  "post.depthOfField": postDefaults.depthOfField,
  "post.exposure": postDefaults.exposure,
  "post.focus": postDefaults.focus,
  "post.occlusion": postDefaults.occlusion,
  "post.occlusionRadius": postDefaults.occlusionRadius,
  "rib.corner": ribDefaults.corner,
  "rib.depth": ribDefaults.depth,
  "rib.taperSide": ribDefaults.taperSide,
  "rib.taperStart": ribDefaults.taperStart,
  "rib.taperTip": ribDefaults.taperTip,
  "rib.width": ribDefaults.width,
  "sky.envIntensity": skyDefaults.envIntensity,
  "sky.fogColor": skyDefaults.fogColor,
  "sky.fogFar": skyDefaults.fogFar,
  "sky.fogNear": skyDefaults.fogNear,
  "sky.gradient": skyDefaults.gradient,
  "sky.lightGradient": skyDefaults.lightGradient,
  "structure.arc": structureDefaults.arc,
  "structure.count": structureDefaults.count,
  "structure.domeLength": structureDefaults.domeLength,
  "structure.radius": structureDefaults.radius,
  "structure.shape": structureDefaults.shape,
  "structure.spacing": structureDefaults.spacing,
  "structure.twist": structureDefaults.twist,
  "structure.wave": structureDefaults.wave,
  "structure.waveLength": structureDefaults.waveLength,
};

/**
 * Reference look 2 (`reference/photos/oculus-2-bend.png`): dense thin ribs
 * with the camera almost touching the wall and looking across it, so the rings
 * ahead and behind the camera meet in one sharp fold.
 */
const bend: HeroPresetValues = {
  ...oculus,
  "camera.fov": 75,
  "camera.height": 0,
  "camera.pitch": 25,
  "camera.position": { x: -0.5, y: 0.8 },
  "camera.roll": -60,
  "camera.yaw": 165,
  "haze.glowPosition": { x: -0.35, y: -1 },
  "haze.glowRadius": 0.9,
  "haze.glowStrength": 60,
  "haze.gradient": {
    angle: 135,
    gradientType: "linear",
    stops: [
      { color: "#5D82CF", opacity: 82, position: "0%" },
      { color: "#8FA9DC", opacity: 35, position: "25%" },
      { color: "#FFFFFF", opacity: 0, position: "50%" },
    ],
  },
  "light.ambient": 1.2,
  "light.elevation": 60,
  "light.intensity": 2.5,
  "post.exposure": 1.2,
  "rib.depth": 0.8,
  "rib.width": 0.4,
  "sky.envIntensity": 1.4,
  "sky.fogFar": 250,
  "sky.fogNear": 40,
  "structure.count": 400,
  "structure.radius": 55,
  "structure.spacing": 0.6,
};

/**
 * Reference look 3 (`reference/photos/oculus-3-wave.png`): flat slats seen
 * from below the crown, bent into S-curves by the wave, with a cool haze in
 * the upper-left and warm light in the lower-right.
 */
const wave: HeroPresetValues = {
  ...oculus,
  "camera.fov": 55,
  "camera.height": 22,
  "camera.pitch": 85,
  "camera.position": { x: -0.5, y: 0.167 },
  "camera.roll": -35,
  "camera.yaw": 90,
  "haze.glowColor": "#FFE3C8",
  "haze.glowPosition": { x: 0.9, y: -0.9 },
  "haze.glowRadius": 1,
  "haze.glowStrength": 45,
  "haze.gradient": {
    angle: 135,
    gradientType: "linear",
    stops: [
      { color: "#5D82CF", opacity: 85, position: "0%" },
      { color: "#8FA9DC", opacity: 40, position: "30%" },
      { color: "#FFFFFF", opacity: 0, position: "60%" },
    ],
  },
  "light.azimuth": -90,
  "light.elevation": 10,
  "light.intensity": 3,
  "post.exposure": 1.2,
  "rib.corner": 0.3,
  "rib.depth": 0.6,
  "rib.width": 1,
  "sky.envIntensity": 1.4,
  "sky.fogFar": 300,
  "sky.fogNear": 60,
  "structure.count": 250,
  "structure.radius": 40,
  "structure.spacing": 1.1,
  "structure.wave": 6,
  "structure.waveLength": 45,
};

/**
 * User-authored settings export (`reference/settings/amber-dome.percenthero.json`):
 * a compact twisted dome lit by a low amber sun with blue atmosphere.
 */
const amber: HeroPresetValues = {
  ...oculus,
  "camera.fov": 71,
  "camera.height": -9.7,
  "camera.pitch": 38,
  "camera.position": { x: -0.44, y: 0.15 },
  "camera.roll": 31,
  "camera.yaw": -35,
  "haze.blend": "normal",
  "haze.glowColor": "#FFE7C4",
  "haze.glowPosition": { x: -0.85, y: -0.9 },
  "haze.glowRadius": 1,
  "haze.glowStrength": 80,
  "haze.gradient": {
    angle: 135,
    gradientType: "linear",
    stops: [
      { color: "#5D82CF", opacity: 88, position: "0%" },
      { color: "#8FA9DC", opacity: 40, position: "26%" },
      { color: "#FFFFFF", opacity: 0, position: "52%" },
    ],
  },
  "haze.strength": 100,
  "light.ambient": 1.4,
  "light.azimuth": -13,
  "light.color": "#F58700",
  "light.elevation": -49,
  "light.groundColor": "#FDE1B0",
  "light.intensity": 4.1,
  "light.shadowSoftness": 12.5,
  "light.shadows": false,
  "light.skyColor": "#DCE0EA",
  "material.clearcoat": 1,
  "material.clearcoatRoughness": 0.28,
  "material.color": "#FCEAE4",
  "material.roughness": 0.44,
  "post.aperture": 0.8,
  "post.bloom": 0.2,
  "post.bloomThreshold": 0.92,
  "post.depthOfField": false,
  "post.exposure": 1.25,
  "post.focus": 20,
  "post.occlusion": 55,
  "post.occlusionRadius": 1.6,
  "rib.corner": 0.5,
  "rib.depth": 1.5,
  "rib.taperSide": "end",
  "rib.taperStart": 0.32,
  "rib.taperTip": 0.64,
  "rib.width": 0.85,
  "sky.envIntensity": 2.2,
  "sky.fogColor": "#BAC4EE",
  "sky.fogFar": 391,
  "sky.fogNear": 100,
  "sky.gradient": {
    angle: 0,
    gradientType: "linear",
    stops: [
      { color: "#E3DED9", opacity: 100, position: "0%" },
      { color: "#F2F4FD", opacity: 100, position: "50%" },
      { color: "#85868E", opacity: 100, position: "100%" },
    ],
  },
  "sky.lightGradient": {
    angle: 90,
    gradientType: "linear",
    stops: [
      { color: "#6F8ED3", opacity: 100, position: "31%" },
      { color: "#F5D7B2", opacity: 100, position: "100%" },
      { color: "#EAA839", opacity: 100, position: "64%" },
    ],
  },
  "structure.arc": [-150, 150],
  "structure.count": 310,
  "structure.domeLength": 111,
  "structure.radius": 23.5,
  "structure.shape": "dome",
  "structure.spacing": 1.35,
  "structure.twist": 0.8,
  "structure.wave": 4.5,
  "structure.waveLength": 52,
};

export const heroPresets: Readonly<Record<HeroPresetId, HeroPresetValues>> = {
  amber,
  bend,
  oculus,
  wave,
};

export const heroPresetIds = [
  "oculus",
  "bend",
  "wave",
  "amber",
] as const satisfies readonly HeroPresetId[];

export function getHeroPresetIdForAction(value: string): HeroPresetId | undefined {
  return heroPresetIds.find((presetId) => heroPresetActionValues[presetId] === value);
}

/**
 * Applies one reference look as individually recorded value commands. Each
 * command is its own history entry because the runtime merges grouped
 * patches by replacing `after`, which would leave a multi-target undo partial.
 */
export function applyHeroPreset(
  dispatch: (command: ToolcraftCommand) => void,
  presetId: HeroPresetId,
): void {
  const label = `Apply ${presetId} preset`;
  for (const [target, value] of Object.entries(heroPresets[presetId])) {
    dispatch({ history: "record", label, target, type: "controls.setValue", value });
  }
}

export const presetsSection = {
  controls: {
    apply: {
      actions: [
        { label: "Oculus", value: heroPresetActionValues.oculus },
        { label: "Bend", value: heroPresetActionValues.bend },
        { label: "Wave", value: heroPresetActionValues.wave },
        { label: "Amber", value: heroPresetActionValues.amber },
      ],
      applicability: { mode: "always" },
      defaultValue: null,
      description:
        "Loads a matched structure, camera, light, atmosphere, finish, and Flow setup.",
      label: "Reference looks",
      orderRole: "action",
      performanceReason:
        "Applying a preset dispatches ordinary value commands that the retained pipeline already handles per target.",
      performanceRole: "responsiveness",
      target: "presets.apply",
      type: "actions",
    },
  },
  id: "presets",
  title: "Presets",
} as const;
