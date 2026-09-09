import type {
  ToolcraftPerformancePath,
  ToolcraftPerformanceScenario,
} from "@/toolcraft/runtime";

const controlDragLabels = new Map<string, string>([
  ["butterflies.count", "Count"],
  ["field.densityMax", "Density max"],
  ["surface.bendDepth", "Depth"],
  ["surface.bendWidth", "Width"],
  ["lawn.densityMax", "Cover density"],
  ["surface.cloverMaskScale", "Scale"],
  ["surface.edgeFadeWidth", "Width"],
]);

const controlChangeLabels = new Map<string, string>([
  ["lawn.use3d", "Cover 3D"],
  ["blade.use3d", "3D grass"],
  ["export.includeBackground", "Include"],
]);

function describePath(path: ToolcraftPerformancePath): string {
  switch (path.interaction) {
    case "timeline-playback":
    case "timeline-scrub":
      return "The visible grass field advances through the seamless forward wind cycle.";
    case "control-drag":
    case "control-change":
      return "The visible field geometry, material, distribution, or wind response changes persistently.";
    case "media-import":
      return "The uploaded HDRI replaces preset image-based lighting across every visible scene material.";
    case "export":
      return "The selected grass output action completes a non-empty still or video download.";
    case "viewport-drag":
    case "viewport-zoom":
      return "The canvas viewport moves while retained grass resources stay stable.";
    case "initial-render":
      return "The procedural grass field renders a stable initial frame.";
    default:
      return "The canonical grass renderer path produces its declared product output.";
  }
}

function findMappedLabel(
  targets: readonly string[],
  labels: ReadonlyMap<string, string>,
): string | undefined {
  for (const target of targets) {
    const label = labels.get(target);
    if (label) return label;
  }
  return undefined;
}

function getControlLabel(path: ToolcraftPerformancePath): string {
  if (path.interaction === "control-drag") {
    return (
      findMappedLabel(path.targets, controlDragLabels) ??
      (path.targets.some((target) => target.startsWith("scan."))
        ? "Count"
        : "Wind strength")
    );
  }

  return (
    (path.targets.some((target) => target.endsWith(".enabled"))
      ? "Include"
      : undefined) ??
    findMappedLabel(path.targets, controlChangeLabels) ??
    "Show ground"
  );
}

function createScenario(
  path: ToolcraftPerformancePath,
  index: number,
): ToolcraftPerformanceScenario {
  const common = {
    automated: true,
    automatedTestName: `performance: grass canonical path ${index + 1}`,
    browser: true,
    browserTestName: `browser perf: grass path ${path.id}`,
    coversTargets: path.targets,
    expectedObservable: describePath(path),
    fixture:
      path.workloadDimensions.length > 0
        ? "Compiled Tall Grass, Lawn Cover, scan-layer counts, Terrain, Tall-mask and Clover-mask octave counts, and preview-scale fixture applied through the real Toolcraft controls."
        : "Current procedural grass state with the real Toolcraft interaction.",
    id: `grass-performance-path-${index + 1}`,
    pathId: path.id,
    ...(path.targets.length === 1 ? { target: path.targets[0] } : {}),
  };

  if (path.interaction === "export") {
    return {
      ...common,
      actionValue: "export.png",
      completionEvidence: "download",
      controlLabel: "Export PNG",
      interaction: "export",
    };
  }

  if (
    path.interaction === "control-drag" ||
    path.interaction === "control-change"
  ) {
    return {
      ...common,
      controlLabel: getControlLabel(path),
      interaction: path.interaction,
    };
  }

  if (path.interaction === "media-import") {
    return {
      ...common,
      controlLabel: "Custom HDRI",
      interaction: path.interaction,
    };
  }

  if (
    path.interaction === "timeline-playback" ||
    path.interaction === "timeline-scrub"
  ) {
    return {
      ...common,
      interaction: path.interaction,
      uiSelector: '[data-slot="timeline-panel"]',
    };
  }

  return {
    ...common,
    interaction: path.interaction,
  } as Exclude<ToolcraftPerformanceScenario, { interaction: "export" }>;
}

export function createGrassPerformanceScenarios(
  paths: readonly ToolcraftPerformancePath[],
): readonly ToolcraftPerformanceScenario[] {
  return paths.map(createScenario);
}
