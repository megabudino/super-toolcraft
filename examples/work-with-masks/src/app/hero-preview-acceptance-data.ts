import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftInteractionOwnershipEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";

import { appSchema } from "./app-schema";
import { heroPreviewTargets } from "./hero-preview-controls";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage" ? appSchema.persistence.include : [];

export const heroPreviewTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

const panelOwnership = (
  id: string,
  target: string,
  description: string,
): ToolcraftInteractionOwnershipEntry => ({
  alternative: {
    reason:
      "A canvas gesture would hide the exact value and duplicate the accessible Toolcraft control.",
    surface: "canvas",
  },
  capability: "precise-value-entry",
  evidence: {
    detail: `The user explicitly requested a standard Toolcraft control for ${description}.`,
    source: "user-request",
  },
  id,
  reason: `The controls panel owns precise, persistent editing of ${description}.`,
  selectionScope: { mode: "global" },
  surface: "panel",
  target,
});

export const heroPreviewInteractionOwnership = [
  panelOwnership(
    "heading-typography-entry",
    heroPreviewTargets.headingTypography,
    "the hero heading typography",
  ),
  panelOwnership(
    "hero-top-inset-entry",
    heroPreviewTargets.topInset,
    "the vertical space above the hero copy",
  ),
  panelOwnership(
    "copy-to-logos-entry",
    heroPreviewTargets.copyToLogos,
    "the distance between hero copy and logos",
  ),
  panelOwnership(
    "logos-to-media-entry",
    heroPreviewTargets.logosToMedia,
    "the distance between logos and media",
  ),
  panelOwnership(
    "lead-typography-entry",
    heroPreviewTargets.leadTypography,
    "the right lead typography",
  ),
  panelOwnership(
    "body-typography-entry",
    heroPreviewTargets.bodyTypography,
    "the right body typography",
  ),
  panelOwnership(
    "right-offset-entry",
    heroPreviewTargets.offsetY,
    "the right copy vertical position",
  ),
  panelOwnership(
    "right-gap-entry",
    heroPreviewTargets.paragraphGap,
    "the distance between right-copy paragraphs",
  ),
] as const satisfies readonly ToolcraftInteractionOwnershipEntry[];

export const heroPreviewProductReadiness = {
  exportIntent: {
    image: {
      evidence:
        "The user removed the Apply workflow and requested manual transfer only; this editor intentionally provides a live native preview preview without artifact export.",
      mode: "user-removed",
    },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: heroPreviewInteractionOwnership,
  mode: "product",
  productName: "Percents Hero Preview",
  productSummary:
    "A live Toolcraft typography and spacing editor for the Percents header and hero native preview.",
  requestedBehavior:
    "Adjust hero and right-copy typography plus the requested vertical spacing values and see every edit immediately in the embedded website preview.",
  viewInteraction: {
    mode: "non-spatial",
    reason:
      "The product is a two-dimensional responsive website preview with no three-dimensional scene or camera.",
  },
} satisfies ToolcraftProductReadiness;

const browserFile = "e2e/product-hero-preview.spec.ts" as const;

export const heroPreviewAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    automated: true,
    automatedTestName: "declares heading typography preview coverage",
    browser: {
      budget: "standard",
      file: browserFile,
      testName: "browser hero preview: heading typography updates the native preview",
    },
    componentType: "fontPicker",
    controlPartCoverage: "all-visible-parts",
    evidence: "product-output",
    expectedObservable:
      "Every heading font control changes the rendered two-line hero heading in the native preview.",
    fixture: "default Percents heading",
    id: "hero.heading.typography",
    interactionId: "heading-typography-entry",
    kind: "control",
    target: heroPreviewTargets.headingTypography,
    userAction:
      "Change heading family, weight, size, tracking, line height, case, color, and opacity in the Font picker.",
  },
  {
    automated: true,
    automatedTestName: "declares top inset preview coverage",
    browser: {
      budget: "standard",
      file: browserFile,
      testName: "browser hero preview: top inset updates the native preview",
    },
    componentType: "slider",
    evidence: "product-output",
    expectedObservable: "Dragging Top inset moves the hero copy vertically in the native preview.",
    fixture: "default hero layout",
    id: "hero.layout.top-inset",
    interactionId: "hero-top-inset-entry",
    kind: "control",
    target: heroPreviewTargets.topInset,
    userAction: "Drag the Top inset thumb to a new value.",
  },
  {
    automated: true,
    automatedTestName: "declares copy to logos preview coverage",
    browser: {
      budget: "standard",
      file: browserFile,
      testName: "browser hero preview: copy to logos spacing updates the native preview",
    },
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Dragging Copy to logos changes the vertical gap above the brand caption and logo grid.",
    fixture: "default hero layout",
    id: "hero.layout.copy-to-logos",
    interactionId: "copy-to-logos-entry",
    kind: "control",
    target: heroPreviewTargets.copyToLogos,
    userAction: "Drag the Copy to logos thumb to a new value.",
  },
  {
    automated: true,
    automatedTestName: "declares logos to media preview coverage",
    browser: {
      budget: "standard",
      file: browserFile,
      testName: "browser hero preview: logos to media spacing updates the native preview",
    },
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Dragging Logos to media changes the vertical gap between the logo grid and the following media.",
    fixture: "default hero layout",
    id: "hero.layout.logos-to-media",
    interactionId: "logos-to-media-entry",
    kind: "control",
    target: heroPreviewTargets.logosToMedia,
    userAction: "Drag the Logos to media thumb to a new value.",
  },
  {
    automated: true,
    automatedTestName: "declares right lead typography preview coverage",
    browser: {
      budget: "standard",
      file: browserFile,
      testName: "browser hero preview: right lead typography updates the native preview",
    },
    componentType: "fontPicker",
    controlPartCoverage: "all-visible-parts",
    evidence: "product-output",
    expectedObservable:
      "Every lead font control changes only the emphasized right-copy paragraph in the native preview.",
    fixture: "default right lead paragraph",
    id: "hero.right.lead-typography",
    interactionId: "lead-typography-entry",
    kind: "control",
    target: heroPreviewTargets.leadTypography,
    userAction:
      "Change right lead family, weight, size, tracking, line height, case, color, and opacity in the Font picker.",
  },
  {
    automated: true,
    automatedTestName: "declares right body typography preview coverage",
    browser: {
      budget: "standard",
      file: browserFile,
      testName: "browser hero preview: right body typography updates the native preview",
    },
    componentType: "fontPicker",
    controlPartCoverage: "all-visible-parts",
    evidence: "product-output",
    expectedObservable:
      "Every body font control changes only the secondary right-copy paragraph in the native preview.",
    fixture: "default right body paragraph",
    id: "hero.right.body-typography",
    interactionId: "body-typography-entry",
    kind: "control",
    target: heroPreviewTargets.bodyTypography,
    userAction:
      "Change right body family, weight, size, tracking, line height, case, color, and opacity in the Font picker.",
  },
  {
    automated: true,
    automatedTestName: "declares right block offset preview coverage",
    browser: {
      budget: "standard",
      file: browserFile,
      testName: "browser hero preview: right block offset updates the native preview",
    },
    componentType: "slider",
    evidence: "product-output",
    expectedObservable: "Dragging Block offset Y moves the complete right-copy block vertically.",
    fixture: "default right-copy layout",
    id: "hero.right.offset-y",
    interactionId: "right-offset-entry",
    kind: "control",
    target: heroPreviewTargets.offsetY,
    userAction: "Drag the Block offset Y thumb to a new value.",
  },
  {
    automated: true,
    automatedTestName: "declares right paragraph gap preview coverage",
    browser: {
      budget: "standard",
      file: browserFile,
      testName: "browser hero preview: right paragraph gap updates the native preview",
    },
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Dragging Paragraph gap changes the distance between the two right-copy paragraphs.",
    fixture: "default right-copy layout",
    id: "hero.right.paragraph-gap",
    interactionId: "right-gap-entry",
    kind: "control",
    target: heroPreviewTargets.paragraphGap,
    userAction: "Drag the Paragraph gap thumb to a new value.",
  },
  {
    automated: true,
    automatedTestName: "declares fixed canvas sizing for the hero native preview",
    browser: {
      budget: "standard",
      file: browserFile,
      testName: "browser hero preview: fixed canvas preserves its output size",
    },
    canvasSizingCoverage: "fixed-output-size",
    componentType: "canvas",
    evidence: "product-output",
    expectedObservable:
      "The embedded website remains exactly 2400 by 1200 CSS pixels while Toolcraft zoom changes presentation scale only.",
    fixture: "2400 by 1200 hero native preview canvas",
    id: "hero.canvas.fixed-size",
    kind: "runtime",
    target: "canvas.fixed-output",
    userAction: "Open the editor and zoom the fixed hero canvas.",
  },
  {
    automated: true,
    automatedTestName: "declares production reload coverage for the hero preview schema",
    browser: {
      budget: "extended-io",
      file: "e2e/product-hero-persistence.spec.ts",
      testName: "browser hero preview: top inset persists after reload",
    },
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "The Top inset control, persisted Toolcraft value, and native preview output restore after a real browser reload.",
    fixture: "hero preview persisted workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: heroPreviewTargets.topInset,
    userAction: "Edit Top inset, wait for persistence, and reload the page.",
  },
];

export const heroPreviewControlSectionInventory = [
  {
    entity: "Hero heading",
    entityId: "hero-heading",
    finiteSelectors: [],
    groupingReason: "This Font picker edits the complete two-line hero heading.",
    id: "hero-heading",
    targets: [heroPreviewTargets.headingTypography],
    title: "Hero heading",
  },
  {
    entity: "Hero layout",
    entityId: "hero-layout",
    finiteSelectors: [],
    groupingReason: "These controls edit the three requested vertical hero layout intervals.",
    id: "hero-spacing",
    targets: [
      heroPreviewTargets.topInset,
      heroPreviewTargets.copyToLogos,
      heroPreviewTargets.logosToMedia,
    ],
    title: "Hero spacing",
  },
  {
    entity: "Right lead",
    entityId: "right-lead",
    finiteSelectors: [],
    groupingReason: "This Font picker edits only the emphasized right-copy paragraph.",
    id: "right-lead",
    targets: [heroPreviewTargets.leadTypography],
    title: "Right lead",
  },
  {
    entity: "Right body",
    entityId: "right-body",
    finiteSelectors: [],
    groupingReason: "This Font picker edits only the secondary right-copy paragraph.",
    id: "right-body",
    targets: [heroPreviewTargets.bodyTypography],
    title: "Right body",
  },
  {
    entity: "Right copy layout",
    entityId: "right-copy-layout",
    finiteSelectors: [],
    groupingReason:
      "These controls position the right-copy block and set its internal paragraph distance.",
    id: "right-copy-layout",
    targets: [heroPreviewTargets.offsetY, heroPreviewTargets.paragraphGap],
    title: "Right copy layout",
  },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];
