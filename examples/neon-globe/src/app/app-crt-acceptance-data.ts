import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
} from "./acceptance/types";
import { GLOBE_TARGETS } from "./globe-constants";

export const crtInteractionOwnership: Extract<
  ToolcraftProductReadiness,
  { mode: "product" }
>["interactionOwnership"] = [
  {
    alternative: {
      reason:
        "A canvas CRT handle would add editing chrome over the landing preview and duplicate a precise visual setting.",
      surface: "canvas",
    },
    capability: "property-edit",
    evidence: {
      detail:
        "The user requested a sidebar setting to strengthen the soft CRT flicker.",
      source: "user-request",
    },
    id: "crt-intensity-property",
    reason:
      "The panel slider exposes one exact intensity value for the global foreground CRT treatment.",
    selectionScope: { mode: "global" },
    surface: "panel",
    target: GLOBE_TARGETS.crtIntensity,
  },
];

export const crtAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "crt intensity changes foreground flicker strength",
    browser: true,
    browserTestName: "browser: crt intensity changes foreground flicker strength",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Intensity strengthens or removes the CRT scanline/flicker treatment over foreground pixels while the black background remains visually clean.",
    fixture: "landing globe crt intensity fixture",
    id: "effects.crt-intensity",
    interactionId: "crt-intensity-property",
    kind: "control",
    target: GLOBE_TARGETS.crtIntensity,
    userAction: "Drag the CRT Intensity slider.",
  },
];

export const crtControlSectionInventoryEntry: ToolcraftControlSectionInventoryEntry = {
  entity: "CRT effect",
  entityId: "crt-effect",
  groupingReason:
    "This control edits the global foreground CRT scanline and soft flicker treatment.",
  id: "crt",
  targets: [GLOBE_TARGETS.crtIntensity],
  title: "CRT",
};
