import type { ToolcraftComponentAcceptance } from "./acceptance/types";

const owners = [
  {
    browserTestName: "Tall Grass instance colors distribute by Field seed",
    id: "tall",
    label: "Tall Grass",
    owner: "appearance",
    seedLabel: "Field seed",
  },
  {
    browserTestName: "Lawn instance colors distribute by Cover seed",
    id: "lawn",
    label: "Lawn Cover",
    owner: "lawn",
    seedLabel: "Cover seed",
  },
] as const;

export const grassInstanceColorAcceptanceRows: readonly ToolcraftComponentAcceptance[] =
  owners.flatMap((entry) =>
    [1, 2, 3].flatMap((index) => [
      {
        automated: true,
        automatedTestName:
          "grass instance color distribution maps weighted palettes and layer seeds",
        browser: true,
        browserTestName: entry.browserTestName,
        componentType: "color",
        evidence: "rendered-pixels",
        expectedObservable: `Color ${index} changes the stable palette category assigned to a deterministic share of ${entry.label} instances.`,
        fixture:
          "A high-contrast red, green, and blue instance palette with isolated categorical shares.",
        id: `grass.instance-color-${entry.id}-${index}`,
        kind: "control",
        target: `${entry.owner}.instanceColor${index}`,
        userAction: `Choose Color ${index} in ${entry.label} Instance Colors.`,
        visibilityCoverage: ["hidden", "visible"],
      },
      {
        automated: true,
        automatedTestName:
          "grass instance color distribution maps weighted palettes and layer seeds",
        browser: true,
        browserTestName: entry.browserTestName,
        componentType: "slider",
        evidence: "rendered-pixels",
        expectedObservable: `Color ${index} presence changes the relative number of ${entry.label} instances assigned to that color, while ${entry.seedLabel} deterministically chooses the instances.`,
        fixture:
          "One palette weight at 100 with the other two at zero, followed by a separated three-color distribution.",
        id: `grass.instance-color-weight-${entry.id}-${index}`,
        kind: "control",
        target: `${entry.owner}.instanceColorWeight${index}`,
        userAction: `Drag Color ${index} presence in ${entry.label} Instance Colors.`,
        visibilityCoverage: ["hidden", "visible"],
      },
    ] satisfies ToolcraftComponentAcceptance[]),
  );
