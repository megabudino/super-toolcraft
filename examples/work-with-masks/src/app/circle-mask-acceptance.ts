import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftInteractionOwnershipEntry,
} from "./acceptance/types";

export const maskInteractionOwnership = [
  {
    alternative: {
      reason:
        "Numeric fields cannot place a circle against the rendered ribs; the panel keeps precise entry for the same record.",
      surface: "panel",
    },
    capability: "direct-spatial-edit",
    evidence: {
      detail:
        "The approved 2026-09-04 circle-mask plan supplied for execution places move, size, stretch, and rotate pins over the rendered output.",
      source: "user-request",
    },
    id: "hero.masks.transform",
    reason: "Dragging pins over the rendered scene keeps each circle aligned with what it reveals.",
    surface: "canvas",
    target: "masks.items",
  },
  {
    alternative: {
      reason:
        "The canvas may not host add/remove chrome; cardinality and exact values stay in the built-in collection control.",
      surface: "canvas",
    },
    capability: "collection-edit",
    evidence: {
      detail:
        "The approved 2026-09-04 circle-mask plan supplied for execution adds and removes circles through the collection plus and minus actions.",
      source: "user-request",
    },
    id: "hero.masks.collection",
    reason: "The panel collection owns how many circles exist and their precise values.",
    surface: "panel",
    target: "masks.items",
  },
] as const satisfies readonly ToolcraftInteractionOwnershipEntry[];

export const maskComponentAcceptance = [
  {
    automated: true,
    automatedTestName: "reads circle masks into renderer parameters and keeps preview editor-only",
    browser: {
      budget: "standard",
      file: "e2e/product-hero-masks.spec.ts",
      testName: "browser: hero.masks.enabled changes 3d scene pixels",
    },
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Apply cuts the live wave frame to the circle union, while off shows the complete wave beneath the foreground hero.",
    fixture: "one centered feathered circle",
    id: "hero.masks.enabled",
    kind: "control",
    optionCoverage: ["true", "false"],
    target: "masks.enabled",
    userAction: "Toggle Apply and compare live wave pixels inside and outside the circle.",
  },
  {
    automated: true,
    automatedTestName: "reads circle masks into renderer parameters and keeps preview editor-only",
    browser: {
      budget: "standard",
      file: "e2e/product-hero-masks.spec.ts",
      testName: "browser: hero.masks.preview changes 3d scene pixels",
    },
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable: "Show replaces cutting with red feather overlays and visible editing pins.",
    fixture: "one stretched circle in Show mode",
    id: "hero.masks.preview",
    kind: "control",
    optionCoverage: ["true", "false"],
    target: "masks.preview",
    userAction: "Toggle Show and inspect the WebGL overlay and canvas pins.",
  },
  {
    automated: true,
    automatedTestName: "reads circle masks into renderer parameters and keeps preview editor-only",
    browser: {
      budget: "standard",
      file: "e2e/product-hero-masks.spec.ts",
      testName: "browser: hero.masks.items adds, edits, and removes circles",
    },
    componentType: "collectionActions",
    controlPartCoverage: [
      "collectionActions.add",
      "collectionActions.remove",
      "collectionActions.items",
    ],
    evidence: "rendered-pixels",
    expectedObservable:
      "Adding, changing opacity, and removing circle records changes the preview while preserving sibling fields.",
    fixture: "one stretched circle in Show mode",
    id: "hero.masks.items",
    interactionId: "hero.masks.collection",
    kind: "control",
    target: "masks.items",
    userAction:
      "Add a circle, edit its opacity, then remove circles with the built-in collection actions.",
  },
  ...(["move", "size", "stretch", "rotate"] as const).map((kind): ToolcraftComponentAcceptance => ({
    automated: true,
    automatedTestName: "moves, resizes, stretches, and rotates a mask from handle drags",
    browser: {
      budget: "standard",
      file: "e2e/product-hero-masks.spec.ts",
      testName: `browser: hero.masks.handle.${kind} drags a circle on the canvas`,
    },
    componentType: "canvas-handle",
    evidence: "rendered-pixels",
    expectedObservable: `Dragging the ${kind} pin changes the circle overlay and retained mask state.`,
    fixture: "one stretched circle in Show mode",
    id: `hero.masks.handle.${kind}`,
    interactionId: "hero.masks.transform",
    kind: "runtime",
    target: "masks.items",
    userAction: `Drag the ${kind} pin over the rendered scene.`,
  })),
] as const satisfies readonly ToolcraftComponentAcceptance[];

export const maskSectionInventory = {
  entity: "Circle masks",
  entityId: "masks",
  finiteSelectors: [
    {
      reason:
        "Apply switches between cutting the scene to the circles and showing the whole scene.",
      role: "parameter",
      target: "masks.enabled",
    },
    {
      reason: "Show switches the canvas between red overlay editing and the composited result.",
      role: "parameter",
      target: "masks.preview",
    },
  ],
  groupingReason:
    "Cut-out application, editing overlay, and the circle list define one mask layer over the frame.",
  id: "masks",
  targets: ["masks.enabled", "masks.preview", "masks.items"],
  title: "Masks",
} as const satisfies ToolcraftControlSectionInventoryEntry;
