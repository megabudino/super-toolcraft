import { describe, expect, it } from "vitest";
import type {
  ToolcraftControlSchema,
  ToolcraftControlSectionSchema,
  ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { grassDefaults } from "./grass/grass-defaults";
import { readGrassSettings } from "./grass/grass-values";

const visibleLayers = [
  ["Terrain", "field.showGround"],
  ["Tall Grass", "grass.enabled"],
  ["Lawn Cover", "lawn.enabled"],
  ["Tufted Grass", "scan.tufted.enabled"],
  ["Wild Grass", "scan.wild.enabled"],
  ["White Flowers", "scan.white.enabled"],
  ["Yellow Flowers", "scan.yellow.enabled"],
  ["Small Rocks", "scan.rocks.enabled"],
  ["Tundra Boulder", "scan.boulder.enabled"],
] as const;

function settingsWith(values: Record<string, unknown> = {}) {
  return readGrassSettings({
    canvas: { size: { height: 1080, width: 1920 } },
    mediaAssets: [],
    timeline: {
      currentTimeSeconds: 0,
      durationSeconds: 6,
      isLooping: true,
      isPlaying: false,
    },
    values,
  } as unknown as ToolcraftState);
}

function findSection(title: string): ToolcraftControlSectionSchema {
  const section = appSchema.panels.controls?.sections.find(
    (candidate) => candidate.title === title,
  );
  if (!section) throw new Error(`Missing section ${title}`);
  return section;
}

function findControl(target: string): ToolcraftControlSchema {
  const section = appSchema.panels.controls?.sections.find((candidate) =>
    Object.values(candidate.controls).some(
      (control) => control.target === target,
    ),
  );
  const control = section
    ? Object.values(section.controls).find(
        (candidate) => candidate.target === target,
      )
    : undefined;
  if (!control) throw new Error(`Missing control ${target}`);
  return control;
}

describe("Grass layer visibility controls", () => {
  it("puts one independent Visible switch in every render-layer section", () => {
    for (const [title, target] of visibleLayers) {
      const section = findSection(title);
      expect(Object.values(section.controls)[0]?.target).toBe(target);
      expect(findControl(target)).toMatchObject({
        defaultValue: true,
        label: "Visible",
        target,
        type: "switch",
      });
    }
  });

  it("removes Solo targets from defaults, controls, and derived settings", () => {
    expect(
      Object.keys(grassDefaults).some((target) => target.startsWith("solo.")),
    ).toBe(false);
    const controlTargets = (appSchema.panels.controls?.sections ?? []).flatMap(
      (section) =>
        Object.values(section.controls).map((control) => control.target),
    );
    expect(controlTargets.some((target) => target.startsWith("solo."))).toBe(
      false,
    );
    expect("solo" in settingsWith({ "solo.terrain": true })).toBe(false);
  });

  it("reads each visibility target without changing the other layers", () => {
    const settings = settingsWith({
      "field.showGround": false,
      "grass.enabled": true,
      "lawn.enabled": false,
      "scan.tufted.enabled": true,
    });
    expect(settings.field.showGround).toBe(false);
    expect(settings.grass.enabled).toBe(true);
    expect(settings.lawn.enabled).toBe(false);
    expect(settings.scans.tufted.enabled).toBe(true);
    expect(settings.scans.wild.enabled).toBe(true);
  });
});
