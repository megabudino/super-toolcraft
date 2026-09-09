import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
} from "./acceptance/types";

function controlAcceptance(
  entry: Omit<ToolcraftComponentAcceptance, "automated" | "browser" | "kind">,
): ToolcraftComponentAcceptance {
  return { ...entry, automated: true, browser: true, kind: "control" };
}

const browserTestName =
  "Surface Bend deforms the perimeter and keeps every layer inside";
const automatedTestName =
  "surface perimeter bend maps controls to Terrain and placement";

export const grassSurfaceBendAcceptanceRows = [
  controlAcceptance({
    automatedTestName,
    browserTestName,
    componentType: "switch",
    evidence: "product-output",
    expectedObservable:
      "Include switches between the original flat full placement domain and one downward bent, vegetation-free perimeter shared by preview and export.",
    fixture: "Default enabled bend compared with Include off.",
    id: "grass.surface-bend-enabled",
    target: "surface.bendEnabled",
    userAction: "Toggle Surface Bend Include.",
  }),
  ...(
    [
      {
        expectedObservable:
          "Depth moves only the outer Terrain edge downward while the central surface and bend-free placement contour stay fixed.",
        fixture: "A visible wide bend compared at 0.25 m and 1.75 m depth.",
        id: "grass.surface-bend-depth",
        target: "surface.bendDepth",
        userAction: "Increase Surface Bend Depth.",
      },
      {
        expectedObservable:
          "Width moves the inner bend boundary inward and keeps Tall, Lawn, scans, rocks, and boulder inside that exact radius.",
        fixture: "A 10% bend band compared with a 40% bend band.",
        id: "grass.surface-bend-width",
        target: "surface.bendWidth",
        userAction: "Increase Surface Bend Width.",
      },
      {
        expectedObservable:
          "Roundness changes the bend profile from a late tight turn to an earlier full roll without moving either boundary.",
        fixture: "A wide deep bend compared at 0% and 100% roundness.",
        id: "grass.surface-bend-roundness",
        target: "surface.bendRoundness",
        userAction: "Increase Surface Bend Roundness.",
      },
      {
        expectedObservable:
          "Smoothness changes the outer band from a straight chamfer toward a tangent-continuous eased roll while retaining Depth and Width.",
        fixture: "A wide deep bend compared at 0% and 100% smoothness.",
        id: "grass.surface-bend-smoothness",
        target: "surface.bendSmoothness",
        userAction: "Increase Surface Bend Smoothness.",
      },
    ] as const
  ).map((entry) =>
    controlAcceptance({
      ...entry,
      automatedTestName,
      browserTestName,
      componentType: "slider",
      evidence: "product-output",
      visibilityCoverage: ["hidden", "visible"],
    }),
  ),
] satisfies readonly ToolcraftComponentAcceptance[];

export const grassSurfaceBendControlSectionInventory = [
  {
    entity: "Downward Terrain perimeter and bend-free placement area",
    groupingReason:
      "Enable, depth, width, profile roundness, and smoothing author one continuous edge while Width defines the exact no-placement band for every layer.",
    targets: [
      "surface.bendEnabled",
      "surface.bendDepth",
      "surface.bendWidth",
      "surface.bendRoundness",
      "surface.bendSmoothness",
    ],
    title: "Surface Bend",
    workflowStage: "Composite",
  },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];
