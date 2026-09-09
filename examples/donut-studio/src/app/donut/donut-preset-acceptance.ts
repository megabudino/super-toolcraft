import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
} from "../acceptance/types";
import {
  DONUT_PRESET_LIBRARY_TARGET,
  DONUT_PRESET_RESET_ACTION,
} from "./donut-preset-library";

export function createDonutPresetAcceptanceRows({
  automatedTestName,
  browserTestName,
  fixture,
}: Readonly<{
  automatedTestName: string;
  browserTestName: (acceptanceId: string) => string;
  fixture: string;
}>): readonly ToolcraftComponentAcceptance[] {
  return [
    {
      actionCoverage: [DONUT_PRESET_RESET_ACTION],
      automated: true,
      automatedTestName,
      browser: true,
      browserTestName: browserTestName(DONUT_PRESET_LIBRARY_TARGET),
      componentType: "actions",
      evidence: "rendered-pixels",
      expectedObservable:
        "Strawberry Party appears first and is selected by default; every named flavor keeps its complete supplied appearance while using the shared Strawberry camera, Infinity canvas, and 170% zoom; Reset flavor restores that normalized scene, and the library round-trips tuned donuts through built-in Settings Transfer and reload without duplicate JSON controls.",
      fixture,
      id: DONUT_PRESET_LIBRARY_TARGET,
      kind: "control",
      target: DONUT_PRESET_LIBRARY_TARGET,
      userAction:
        "Change canvas zoom and mode, switch through the Strawberry-first Flavor menu, confirm the shared camera, 170% zoom, and Infinity canvas, tune several visual values, export one Settings JSON, import it, reload, and reset the selected flavor.",
      visibilityCoverage: "all-conditional-visibility",
    },
  ];
}

export const donutPresetControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    {
      entity: "Curated donut flavor presets",
      groupingReason:
        "Flavor lists Strawberry Party first and chooses a complete supplied appearance while the preset boundary normalizes every scene to one shared camera and Infinity canvas and preset selection sets zoom to 170%; the adjacent Reset flavor command restores only that source-backed appearance and the registered library travels through workspace persistence and built-in Settings Transfer.",
      id: "presets",
      targets: ["donut.preset", DONUT_PRESET_LIBRARY_TARGET],
      title: "Presets",
    },
  ];
