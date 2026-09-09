import { describe, expect, it } from "vitest";
import {
  getToolcraftTimelineLoopProgress,
  type ToolcraftControlSchema,
  type ToolcraftState,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";
import { chooseGrassVideoMime } from "./grass/grass-export";
import {
  calculateGrassBladeCount,
  createGrassLayout,
} from "./grass/grass-layout";
import {
  getGrassLayoutKey,
  getGrassRenderKey,
  readGrassSettings,
} from "./grass/grass-values";

function findControl(target: string): ToolcraftControlSchema {
  for (const section of appSchema.panels.controls?.sections ?? []) {
    const control = Object.values(section.controls).find(
      (candidate) => candidate.target === target,
    );
    if (control) return control;
  }
  throw new Error(`Missing control ${target}`);
}

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

describe("Grass Studio preview and delivery behavior", () => {
  it("grass orientation pose controls preview and export camera", () => {
    const control = findControl("view.orientation");
    const initial = settingsWith();
    const changed = settingsWith({
      "view.orientation": {
        position: [-0.8, 0.32, 0.5],
        up: [0, 1, 0],
      },
    });

    expect(control).toMatchObject({
      keyframeable: false,
      label: false,
      type: "orientationGizmo",
    });
    expect(changed.view.orientation).not.toEqual(initial.view.orientation);
    expect(getGrassRenderKey(changed)).not.toBe(getGrassRenderKey(initial));
  });

  it("uses a bounded live preview and 4K image defaults", () => {
    expect(appSchema.canvas).toMatchObject({
      draggable: true,
      renderScale: { defaultValue: 2, enabled: true, max: 2 },
    });
    expect(findControl("export.image.resolution").defaultValue).toBe("4k");
    expect(findControl("export.includeBackground").defaultValue).toBe(true);
  });

  it("grass uses one live PBR preview without a mode switch", () => {
    expect(() => findControl("preview.mode")).toThrow();
    expect(settingsWith().preview).toEqual({
      bladeCount: 6000,
      lawnBladeCount: 12_000,
    });
  });

  it("grass live detail preserves the authored root distribution", () => {
    expect(findControl("preview.bladeCount")).toMatchObject({
      defaultValue: 6000,
      max: 6000,
      min: 300,
      performanceRole: "workload",
      type: "slider",
    });
    expect(settingsWith({ "preview.bladeCount": 900 }).preview.bladeCount).toBe(
      900,
    );

    const detailed = settingsWith({
      "field.densityMax": 7000,
      "preview.bladeCount": 1800,
    });
    const lightweight = settingsWith({
      "field.densityMax": 7000,
      "preview.bladeCount": 300,
    });
    expect(createGrassLayout(lightweight).offsets).toEqual(
      createGrassLayout(detailed).offsets,
    );
    expect(createGrassLayout(detailed).count).toBeGreaterThan(1000);
  });

  it("grass background inclusion controls preview and export alpha", () => {
    expect(
      settingsWith({ "export.includeBackground": false }).export
        .includeBackground,
    ).toBe(false);
  });

  it("grass background color maps to preview and export", () => {
    expect(
      settingsWith({ "scene.background": "#6f2cff" }).scene.background,
    ).toBe("#6f2cff");
  });

  for (const [label, target, options] of [
    ["image format", "export.image.format", ["png", "jpg"]],
    ["image resolution", "export.image.resolution", ["2k", "4k", "8k"]],
  ] as const) {
    it(`grass ${label} is consumed by export`, () => {
      expect(
        findControl(target).options?.map((option) => option.value),
      ).toEqual(options);
    });
  }

  it("grass footer exposes PNG while video stays hidden", () => {
    const actions = findControl("actions.output");
    expect(
      actions.actions?.map((action) =>
        typeof action === "string" ? action : action.value,
      ),
    ).toEqual(["export.png"]);
    expect(() => findControl("export.video.format")).toThrow();
    expect(() => findControl("export.video.resolution")).toThrow();
    expect(chooseGrassVideoMime("mp4", () => true).extension).toBe("mp4");
  });

  it("grass retained hidden timeline math remains available", () => {
    expect(
      getToolcraftTimelineLoopProgress({
        currentTimeSeconds: 0,
        durationSeconds: 6,
      }),
    ).toBe(
      getToolcraftTimelineLoopProgress({
        currentTimeSeconds: 6,
        durationSeconds: 6,
      }),
    );
    expect(getGrassLayoutKey(settingsWith({ "wind.strength": 10 }))).toBe(
      getGrassLayoutKey(settingsWith({ "wind.strength": 90 })),
    );
  });

  it("grass persisted state excludes autonomous timeline transport", () => {
    expect(appSchema.persistence).toMatchObject({
      include: ["values", "canvas", "media", "panels"],
      key: "toolcraft:grass-world:state:v22",
      storage: "localStorage",
      version: 22,
    });
  });

  it("enforces the density cap independently of field area", () => {
    const settings = settingsWith({
      "field.densityMax": 24_000,
      "field.depth": 20,
      "field.distanceMin": 0.04,
      "field.width": 20,
    });
    expect(calculateGrassBladeCount(settings)).toBe(24_000);
  });
});
