import type { ToolcraftPerformancePath } from "@/toolcraft/runtime";

const interactivePriority = [
  "control-drag",
  "mask-drag",
  "timeline-scrub",
  "viewport-drag",
  "viewport-zoom",
  "control-change",
  "animation-frame",
  "media-import",
] as const satisfies readonly ToolcraftPerformancePath["interaction"][];

export function selectToolcraftPerformanceSmokePaths(
  paths: readonly ToolcraftPerformancePath[],
): readonly ToolcraftPerformancePath[] {
  const initial = paths.find((path) => path.interaction === "initial-render");
  const interactive = interactivePriority
    .map((interaction) =>
      paths.find((path) => path.interaction === interaction),
    )
    .find(
      (path): path is ToolcraftPerformancePath => path !== undefined,
    );

  return [initial, interactive].filter(
    (path): path is ToolcraftPerformancePath => path !== undefined,
  );
}

export function resolveToolcraftPerformanceSmokeEntries<
  Entry extends Readonly<{ path: ToolcraftPerformancePath }>,
>(
  entries: readonly Entry[],
  selectedPaths: readonly ToolcraftPerformancePath[],
): readonly Entry[] {
  const entriesByPathId = new Map(
    entries.map((entry) => [entry.path.id, entry] as const),
  );

  return selectedPaths.map((path) => {
    const entry = entriesByPathId.get(path.id);
    if (!entry) {
      throw new Error(
        `Toolcraft performance smoke selection is missing compiled entry "${path.id}".`,
      );
    }
    return entry;
  });
}

export function selectToolcraftPerformanceSmokeEntries<
  Entry extends Readonly<{ path: ToolcraftPerformancePath }>,
>(entries: readonly Entry[]): readonly Entry[] {
  return resolveToolcraftPerformanceSmokeEntries(
    entries,
    selectToolcraftPerformanceSmokePaths(entries.map(({ path }) => path)),
  );
}
