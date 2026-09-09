import { expect, test } from "@playwright/test";

import type { ToolcraftPerformancePath } from "@/toolcraft/runtime";

import {
  resolveToolcraftPerformanceSmokeEntries,
  selectToolcraftPerformanceSmokeEntries,
  selectToolcraftPerformanceSmokePaths,
} from "./performance-smoke-selection";

function createPath(
  interaction: ToolcraftPerformancePath["interaction"],
  suffix = interaction,
): ToolcraftPerformancePath {
  return {
    id: `performance-path:${suffix}`,
    interaction,
    invalidates: [],
    profile: interaction === "initial-render" ? "startup" : "interactive-continuous",
    runsOn: [],
    targets: [],
    workloadDimensions: [],
  };
}

test("performance smoke selection prefers control drag", () => {
  const paths = [
    createPath("initial-render"),
    createPath("viewport-zoom"),
    createPath("control-drag"),
    createPath("timeline-scrub"),
  ];

  expect(
    selectToolcraftPerformanceSmokePaths(paths).map(
      (path) => path.interaction,
    ),
  ).toEqual(["initial-render", "control-drag"]);
});

test("performance smoke selection uses the next available interaction", () => {
  const pathsWithoutDrag = [
    createPath("initial-render"),
    createPath("media-import"),
    createPath("viewport-drag"),
    createPath("timeline-scrub"),
  ];

  expect(
    selectToolcraftPerformanceSmokePaths(pathsWithoutDrag).map(
      (path) => path.interaction,
    ),
  ).toEqual(["initial-render", "timeline-scrub"]);
});

test("performance smoke selection follows the complete interaction priority", () => {
  const priority = [
    "control-drag",
    "mask-drag",
    "timeline-scrub",
    "viewport-drag",
    "viewport-zoom",
    "control-change",
    "animation-frame",
    "media-import",
  ] as const satisfies readonly ToolcraftPerformancePath["interaction"][];
  const reversedPaths = priority.toReversed().map((interaction) =>
    createPath(interaction),
  );

  for (const [index, interaction] of priority.entries()) {
    const remainingInteractions = new Set<ToolcraftPerformancePath["interaction"]>(
      priority.slice(index),
    );
    expect(
      selectToolcraftPerformanceSmokePaths([
        createPath("initial-render"),
        ...reversedPaths.filter((path) =>
          remainingInteractions.has(path.interaction),
        ),
      ]).map((path) => path.interaction),
    ).toEqual(["initial-render", interaction]);
  }
});

test("performance smoke selection excludes export-only paths", () => {
  const exportOnlyPaths = [
    createPath("export", "export-image"),
    createPath("export", "export-video"),
  ];

  expect(selectToolcraftPerformanceSmokePaths(exportOnlyPaths)).toEqual([]);
});

test("performance smoke selection returns at most two paths", () => {
  const manyInteractivePaths = [
    createPath("initial-render"),
    createPath("control-drag"),
    createPath("mask-drag"),
    createPath("timeline-scrub"),
    createPath("viewport-drag"),
    createPath("viewport-zoom"),
    createPath("control-change"),
    createPath("animation-frame"),
    createPath("media-import"),
    createPath("export"),
  ];

  expect(selectToolcraftPerformanceSmokePaths(manyInteractivePaths)).toHaveLength(2);
});

test("performance smoke selection preserves canonical order within a priority", () => {
  const firstControlDrag = createPath("control-drag", "control-drag:a");
  const secondControlDrag = createPath("control-drag", "control-drag:b");

  expect(
    selectToolcraftPerformanceSmokePaths([
      createPath("initial-render"),
      firstControlDrag,
      secondControlDrag,
    ]).map((path) => path.id),
  ).toEqual(["performance-path:initial-render", firstControlDrag.id]);
});

test("performance smoke entry selection preserves selector order over matrix order", () => {
  const controlDrag = createPath("control-drag", "a-control-drag");
  const initialRender = createPath("initial-render", "z-initial-render");
  const timelineScrub = createPath("timeline-scrub", "b-timeline-scrub");
  const entries = [
    { marker: "control", path: controlDrag },
    { marker: "timeline", path: timelineScrub },
    { marker: "initial", path: initialRender },
  ] as const;

  expect(
    selectToolcraftPerformanceSmokeEntries(entries).map(
      (entry) => entry.marker,
    ),
  ).toEqual(["initial", "control"]);
});

test("performance smoke entry resolution fails when a selected entry is missing", () => {
  const initialRender = createPath("initial-render");

  expect(() =>
    resolveToolcraftPerformanceSmokeEntries(
      [{ path: initialRender }],
      [initialRender, createPath("control-drag")],
    ),
  ).toThrow(/missing compiled entry.*performance-path:control-drag/iu);
});
