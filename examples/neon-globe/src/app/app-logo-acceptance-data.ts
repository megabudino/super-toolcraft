import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
} from "./acceptance/types";
import {
  LOGO_ORBIT_MOTION_REFERENCE_ID,
  LOGO_ORBIT_REFERENCE_BEHAVIOR_ID,
} from "./app-motion-reference-data";
import { GLOBE_TARGETS } from "./globe-constants";
import { GLOBE_BAND_ROWS } from "./globe-band-order";

const logoTargets = GLOBE_BAND_ROWS.map(({ logoId, label, positionKey, scaleKey }, index) => ({
  bandIndex: index + 1,
  id: logoId,
  label,
  scaleTarget: GLOBE_TARGETS[scaleKey],
  target: GLOBE_TARGETS[positionKey],
}));

export const logoInteractionOwnership: Extract<
  ToolcraftProductReadiness,
  { mode: "product" }
>["interactionOwnership"] = [
  ...logoTargets.map(({ id, label, scaleTarget }) => ({
    alternative: {
      reason: "Canvas scale handles would obscure the ticker pattern and duplicate precise sizing controls.",
      surface: "canvas" as const,
    },
    capability: "property-edit" as const,
    evidence: {
      detail: "The user requested adjustable logo scale inside the ticker rows; panel sliders keep exact values discoverable without covering the animation.",
      source: "usability-analysis" as const,
    },
    id: `logo-${id}-scale-property`,
    reason: `The panel exposes independent proportional sizing for ${label}.`,
    selectionScope: { mode: "global" as const },
    surface: "panel" as const,
    target: scaleTarget,
  })),
  ...logoTargets.map(({ id, label, target }) => ({
    alternative: {
      reason:
        "Canvas logo handles would add editing chrome over the ticker rows and duplicate exact final-position values.",
      surface: "canvas" as const,
    },
    capability: "property-edit" as const,
    evidence: {
      detail:
        "The user requested control over each logo position on its own line, with that position serving as the animation final state.",
      source: "user-request" as const,
    },
    id: `logo-${id}-final-position-property`,
    reason:
      `The panel slider exposes the exact final horizontal position for the ${label} logo.`,
    selectionScope: { mode: "global" as const },
    surface: "panel" as const,
    target,
  })),
  {
    alternative: {
      reason:
        "A canvas replay handle would add chrome over the landing preview and compete with globe orbit dragging.",
      surface: "canvas" as const,
    },
    capability: "command" as const,
    evidence: {
      detail:
        "The user requested a button that can play the logo movement again without enabling a loop.",
      source: "user-request" as const,
    },
    id: "logo-intro-run-command",
    reason:
      "The panel action gives an explicit command to run the short logo intro again without adding canvas UI.",
    surface: "panel" as const,
    target: GLOBE_TARGETS.logoIntroRun,
  },
  {
    alternative: {
      reason:
        "A canvas timing handle would duplicate a numeric timing setting and clutter the animated landing preview.",
      surface: "canvas" as const,
    },
    capability: "property-edit" as const,
    evidence: {
      detail:
        "The user requested a controller for the stop time at the default logo position.",
      source: "user-request" as const,
    },
    id: "logo-hold-seconds-property",
    reason:
      "The panel slider exposes the exact hold time without creating app-wide playback transport.",
    selectionScope: { mode: "global" as const },
    surface: "panel" as const,
    target: GLOBE_TARGETS.logoHoldSeconds,
  },
  {
    alternative: {
      reason:
        "A canvas speed handle would duplicate a numeric timing setting and add chrome over the animated ticker rows.",
      surface: "canvas" as const,
    },
    capability: "property-edit" as const,
    evidence: {
      detail:
        "The user requested a setting to make the logo animation speed a little faster.",
      source: "user-request" as const,
    },
    id: "logo-speed-property",
    reason:
      "The panel slider exposes one exact global tempo for the logo orbit.",
    selectionScope: { mode: "global" as const },
    surface: "panel" as const,
    target: GLOBE_TARGETS.logoSpeed,
  },
];

export const logoAcceptance: readonly ToolcraftComponentAcceptance[] = [
  ...logoTargets.map<ToolcraftComponentAcceptance>(
    ({ bandIndex, id, label, scaleTarget }) => ({
      automated: true,
      automatedTestName: `${label.toLowerCase()} logo scale changes only its mask size`,
      browser: true,
      browserTestName: `browser: ${label.toLowerCase()} logo scale changes only its mask size`,
      componentType: "slider",
      evidence: "rendered-pixels",
      expectedObservable: `Scaling ${label} changes its black logo mask size on band ${bandIndex}, preserving proportions, dot spacing, final position, and the other logos.`,
      fixture: `landing globe ${label.toLowerCase()} logo scale fixture`,
      id: `logos.${id}.scale`,
      interactionId: `logo-${id}-scale-property`,
      kind: "control",
      target: scaleTarget,
      userAction: `Drag the ${label} slider in Logo Scale.`,
    }),
  ),
  ...logoTargets.map<ToolcraftComponentAcceptance>(
    ({ bandIndex, id, label, target }) => ({
      automated: true,
      automatedTestName: `${label.toLowerCase()} logo final position moves black dot mask`,
      browser: true,
      browserTestName: `browser: ${label.toLowerCase()} logo final position moves black dot mask`,
      componentType: "slider" as const,
      evidence: "rendered-pixels" as const,
      expectedObservable:
        `Dragging ${label} changes the final horizontal position of its black dot-mask logo on band ${bandIndex} while the band remains opaque over the globe grid.`,
      fixture: `landing globe ${label.toLowerCase()} logo final position fixture`,
      id: `logos.${id}.final-position`,
      interactionId: `logo-${id}-final-position-property`,
      kind: "control" as const,
      target,
      userAction: `Drag the ${label} logo position slider.`,
    }),
  ),
  {
    actionCoverage: [GLOBE_TARGETS.logoIntroRun],
    automated: true,
    automatedTestName: "logo loop action restarts staggered orbit",
    browser: true,
    browserTestName: "browser: logo loop action restarts staggered orbit",
    componentType: "actions",
    evidence: "rendered-pixels",
    expectedObservable:
      "Clicking Run logos restarts the reference-paced looping logo orbit in top-to-bottom order: easyJet, Ubisoft, Novo Nordisk, Prada. Row phase offsets, fast travel away from the front, late inertia, and the strongest slowdown at each final position are preserved.",
    fixture: "landing globe logo intro fixture",
    id: "logos.intro.run",
    interactionId: "logo-intro-run-command",
    kind: "control",
    motionReferenceCoverage: [
      {
        behaviorId: LOGO_ORBIT_REFERENCE_BEHAVIOR_ID,
        referenceId: LOGO_ORBIT_MOTION_REFERENCE_ID,
      },
    ],
    target: GLOBE_TARGETS.logoIntroRun,
    userAction: "Click Run logos.",
  },
  {
    automated: true,
    automatedTestName: "logo hold time changes loop dwell before the next orbit",
    browser: true,
    browserTestName: "browser: logo hold time changes loop dwell before the next orbit",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Hold changes how long logo masks stay at their final positions before continuing around the globe.",
    fixture: "landing globe logo hold fixture",
    id: "logos.hold-seconds",
    interactionId: "logo-hold-seconds-property",
    kind: "control",
    target: GLOBE_TARGETS.logoHoldSeconds,
    userAction: "Drag the Hold slider.",
  },
  {
    automated: true,
    automatedTestName: "logo speed changes orbit travel tempo",
    browser: true,
    browserTestName: "browser: logo speed changes orbit travel tempo",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Dragging Speed changes how quickly logo masks travel around the globe while Hold remains the stop duration.",
    fixture: "landing globe logo speed fixture",
    id: "logos.speed",
    interactionId: "logo-speed-property",
    kind: "control",
    target: GLOBE_TARGETS.logoSpeed,
    userAction: "Drag the Speed slider.",
  },
];

export const logoControlSectionInventoryEntry: ToolcraftControlSectionInventoryEntry = {
  entity: "Logo loop",
  entityId: "logo-loop",
  groupingReason:
    "These controls run the logo orbit, tune speed and final-position hold, and place the four supplied black dot-mask logos on their ticker bands.",
  id: "logos",
  workflowStage: "placement-and-motion",
  splitReason: "The logo-loop entity has eleven controls; keep its seven placement and motion controls together and four independent scale controls in the sizing stage.",
  targets: [
    GLOBE_TARGETS.logoIntroRun,
    GLOBE_TARGETS.logoHoldSeconds,
    GLOBE_TARGETS.logoSpeed,
    ...logoTargets.map(({ target }) => target),
  ],
  title: "Logos",
};

export const logoScaleSectionInventoryEntry: ToolcraftControlSectionInventoryEntry = {
  entity: "Logo loop",
  entityId: "logo-loop",
  groupingReason: "These four controls independently size the dot-mask logos inside their ticker bands.",
  id: "logo-scale",
  workflowStage: "sizing",
  splitReason: "The logo-loop entity has eleven controls; this four-control sizing stage complements the seven placement and motion controls.",
  targets: logoTargets.map(({ scaleTarget }) => scaleTarget),
  title: "Logo Scale",
};
