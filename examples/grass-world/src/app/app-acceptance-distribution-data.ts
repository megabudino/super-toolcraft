import type { ToolcraftComponentAcceptance } from "./acceptance/types";

function controlAcceptance(
  entry: Omit<ToolcraftComponentAcceptance, "automated" | "browser" | "kind">,
): ToolcraftComponentAcceptance {
  return { ...entry, automated: true, browser: true, kind: "control" };
}

export const grassDistributionAcceptanceRows: readonly ToolcraftComponentAcceptance[] = [
  controlAcceptance({
    automatedTestName:
      "Tall Grass distribution preview maps Voronoi state to exact layout",
    browserTestName:
      "Tall Grass density and Voronoi mask control the complete field",
    builtInFitCheck: {
      capabilities: ["custom-interaction", "custom-visualization"],
      checkedBuiltIns: ["vector", "imagePicker", "fileDrop"],
      closestBuiltIn: "vector",
      productObservable:
        "The grayscale Voronoi preview and deterministic Tall layout shift together while Lawn stays unchanged.",
      whyInsufficient:
        "Vector cannot visualize the generated black-to-white growth probability map.",
    },
    componentType: "grassNoisePreview",
    customControlCoverage: [
      "built-in-gap",
      "kit-primitives",
      "minimal-ui",
      "product-output",
      "runtime-state",
    ],
    evidence: "product-output",
    expectedObservable:
      "White regions attract Tall roots, black regions exclude them, and dragging changes only Tall distribution.",
    fixture: "A 10,000-root Tall field with Lawn enabled.",
    id: "grass.tall-distribution-preview",
    target: "field.distributionOffset",
    userAction: "Drag the Tall Distribution map preview.",
    visibilityCoverage: ["hidden", "visible"],
  }),
  controlAcceptance({
    automatedTestName:
      "Tall Grass distribution levels map black and white bounds to layout",
    browserTestName:
      "Tall Grass density and Voronoi mask control the complete field",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "product-output",
    expectedObservable:
      "Both mask levels change Tall placement without changing Lawn.",
    fixture: "Separated Tall black and white levels.",
    id: "grass.tall-distribution-levels",
    target: "field.distributionLevels",
    userAction: "Move both Tall Black / white handles.",
    visibilityCoverage: ["hidden", "visible"],
  }),
  controlAcceptance({
    automatedTestName:
      "Lawn distribution preview owns an independent Voronoi layout",
    browserTestName: "Lawn distribution map controls only Lawn Cover",
    builtInFitCheck: {
      capabilities: ["custom-interaction", "custom-visualization"],
      checkedBuiltIns: ["vector", "imagePicker", "fileDrop"],
      closestBuiltIn: "vector",
      productObservable:
        "The Lawn preview and Lawn layout shift together while Tall and scans remain unchanged.",
      whyInsufficient:
        "Vector cannot visualize the generated Lawn growth probability map.",
    },
    componentType: "grassNoisePreview",
    customControlCoverage: [
      "built-in-gap",
      "kit-primitives",
      "minimal-ui",
      "product-output",
      "runtime-state",
    ],
    evidence: "product-output",
    expectedObservable:
      "Dragging the map changes Lawn placement without changing Tall or scans.",
    fixture: "Enabled Lawn and Tall fields with independent maps.",
    id: "grass.lawn-distribution-preview",
    target: "lawn.distributionOffset",
    userAction: "Drag the Lawn Distribution map preview.",
  }),
  controlAcceptance({
    automatedTestName:
      "Lawn distribution preview owns an independent Voronoi layout",
    browserTestName: "Lawn distribution map controls only Lawn Cover",
    componentType: "rangeSlider",
    controlPartCoverage: ["rangeSlider.lower", "rangeSlider.upper"],
    evidence: "product-output",
    expectedObservable:
      "Both mask levels change Lawn coverage without rewriting Tall or scans.",
    fixture: "Separated Lawn black and white levels.",
    id: "grass.lawn-distribution-levels",
    target: "lawn.distributionLevels",
    userAction: "Move both Lawn Black / white handles.",
  }),
  ...([
    ["scale", "lawn.distributionScale", "Lawn region size"],
    ["detail", "lawn.distributionDetail", "Lawn mask octaves"],
    ["roughness", "lawn.distributionRoughness", "small Lawn regions"],
    ["seed", "lawn.distributionSeed", "the deterministic Lawn mask"],
  ] as const).map(([suffix, target, observable]) =>
    controlAcceptance({
      automatedTestName:
        "Lawn distribution preview owns an independent Voronoi layout",
      browserTestName: "Lawn distribution map controls only Lawn Cover",
      componentType: "slider",
      evidence: "product-output",
      expectedObservable: `This control updates ${observable} without changing Tall or scans.`,
      fixture: "Enabled Lawn and Tall fields with independent maps.",
      id: `grass.lawn-distribution-${suffix}`,
      target,
      userAction: `Change ${target} in Lawn Distribution.`,
    }),
  ),
];
