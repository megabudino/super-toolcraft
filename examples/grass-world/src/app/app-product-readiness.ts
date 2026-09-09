import type {
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    behaviorCoverage: [
      "no-duration-control",
      "no-export-at-time",
      "no-loop-control",
      "no-play-pause",
      "no-scrub",
      "no-user-facing-transport",
    ],
    mode: "autonomous",
    reason:
      "Wind and butterfly motion are an always-running decorative preview with no visible transport or video export workflow.",
  },
  mode: "new-toolcraft-app",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  mode: "product",
  productName: "Grass World",
  productSummary:
    "A quality-first WebGL field editor with independent editable Voronoi maps for Tall Grass and Lawn Cover, exact Count-driven Megascans and rock placement, an animated instanced PBR butterfly flock, hybrid detailed/lightweight always-PBR grass, PBR ground blending, physical shadows, CC0 HDRI lighting, procedural terrain, wind simulation, seeded scene randomization, and still-image export.",
  requestedBehavior:
    "Create curated variations without deleting configured layers or changing lighting, grading, material response, masks, fade, Ground Shadow, wind, view, quality, or export state; shape one continuous rounded and irregular procedural terrain shared by every layer; treat Tall and Lawn density as authored root targets and filter each deterministic base layout once through its own visible seeded Voronoi map, where white attracts roots and black excludes them; keep every scanned vegetation, flower, Small Rocks, Tundra Boulder, and butterfly placement independent from both grass maps, with exact bounded counts; animate one PBR butterfly-atlas flock with reviewed per-map resolution budgets continuously, land it on Terrain hover, and relaunch it on leave; retain independent PBR color and material controls, Current/Clover ground blending, HDRI and Sun Patches, physical shadows, autonomous wind and pointer interaction, and full-quality PNG or JPG export through the single Export PNG action.",
};
