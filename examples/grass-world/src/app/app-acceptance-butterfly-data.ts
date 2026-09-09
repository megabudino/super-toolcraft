import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
} from "./acceptance/types";

const automatedTestName =
  "butterfly controls map to deterministic PBR flock settings";
const browserTestName =
  "butterflies fly, land on terrain hover, and take off on leave";

const butterflyControls = [
  ["enabled", "switch", "the independent flock visibility"],
  ["count", "slider", "the exact retained instance count"],
  ["sizeRange", "rangeSlider", "minimum and maximum wingspan"],
  ["seed", "slider", "the deterministic placement and species mix"],
  ["heightRange", "rangeSlider", "minimum and maximum flight height"],
  ["flightCycles", "slider", "the seamless path frequency"],
  ["wingCycles", "slider", "the seamless wing-beat frequency"],
  [
    "landingTime",
    "slider",
    "the complete staggered curved landing and relaunch wave",
  ],
] as const;

export const grassButterflyAcceptanceRows: readonly ToolcraftComponentAcceptance[] =
  butterflyControls.map(([suffix, componentType, observable]) => ({
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName,
    componentType,
    ...(suffix === "sizeRange" || suffix === "heightRange"
      ? {
          controlPartCoverage: [
            "rangeSlider.lower",
            "rangeSlider.upper",
          ] as const,
        }
      : {}),
    evidence: "product-output" as const,
    expectedObservable: `Changing Butterfly ${suffix} updates ${observable} without rebuilding Terrain, grass, or scan layers.`,
    fixture:
      "The retained PBR butterfly atlas with a 1K silhouette mask over the complete procedural Terrain.",
    id: `grass.butterflies-${suffix}`,
    kind: "control" as const,
    target: `butterflies.${suffix}`,
    userAction: `Change ${suffix} in the Butterfly controls.`,
    ...(suffix === "enabled"
      ? {}
      : { visibilityCoverage: ["hidden", "visible"] as const }),
  }));

export const grassButterflyControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Independent animated PBR butterfly flock",
      groupingReason:
        "Visibility, distribution, wingspan, deterministic species, flight, wing cadence, and hover landing all describe one bounded retained butterfly layer.",
      targets: [
        "butterflies.enabled",
        "butterflies.count",
        "butterflies.sizeRange",
        "butterflies.seed",
        "butterflies.heightRange",
        "butterflies.flightCycles",
        "butterflies.wingCycles",
        "butterflies.landingTime",
      ],
      title: "Butterflies",
      workflowStage: "Distribute and animate",
    },
  ];
