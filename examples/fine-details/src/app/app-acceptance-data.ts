import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
  ToolcraftProductReadiness,
  ToolcraftTransferMode,
} from "./acceptance/types";
import { appSchema } from "./app-schema";
import { fineDetailsCarouselTargets } from "./fine-details-carousel-values";
import { fineDetailsLoadingTargets } from "./fine-details-loading-values";
import { fineDetailsPromptFlightTargets } from "./fine-details-prompt-flight-values";
import {
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_BROWSER_TEST_NAME,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
} from "./fine-details-prompt-flight-command-contract";
import {
  fineDetailsPromptTypingAcceptance,
  fineDetailsPromptTypingInventory,
} from "./fine-details-prompt-typing-acceptance";
import { fineDetailsPromptTargets } from "./fine-details-prompt-values";
import { fineDetailsTrailTargets } from "./fine-details-trail-values";
import { fineDetailsTypographyTargets } from "./fine-details-typography-values";
import { fineDetailsTargets } from "./fine-details-values";

const persistenceSlices =
  appSchema.persistence.storage === "localStorage"
    ? appSchema.persistence.include
    : [];

type FineDetailsPromptFlightTarget =
  (typeof fineDetailsPromptFlightTargets)[keyof typeof fineDetailsPromptFlightTargets];

export const fineDetailsPromptFlightBrowserTestNames = {
  "prompt.flight.enabled":
    "browser: prompt.flight.enabled changes the embedded Fine Details output",
  "prompt.flight.offset.x":
    "browser: prompt.flight.offset.x changes the embedded Fine Details output",
  "prompt.flight.offset.y":
    "browser: prompt.flight.offset.y changes the embedded Fine Details output",
  "prompt.flight.startDelay":
    "browser: prompt.flight.startDelay changes the embedded Fine Details output",
  "prompt.flight.flightTime":
    "browser: prompt.flight.flightTime changes the embedded Fine Details output",
  "prompt.flight.bounce":
    "browser: prompt.flight.bounce changes the embedded Fine Details output",
  "prompt.flight.ghosts":
    "browser: prompt.flight.ghosts changes the embedded Fine Details output",
  "prompt.flight.ghostSpacing":
    "browser: prompt.flight.ghostSpacing changes the embedded Fine Details output",
  "prompt.flight.ghostOpacity":
    "browser: prompt.flight.ghostOpacity changes the embedded Fine Details output",
  "prompt.flight.ghostFalloff":
    "browser: prompt.flight.ghostFalloff changes the embedded Fine Details output",
  "prompt.flight.vanishStagger":
    "browser: prompt.flight.vanishStagger changes the embedded Fine Details output",
  "prompt.flight.vanishTime":
    "browser: prompt.flight.vanishTime changes the embedded Fine Details output",
  "prompt.flight.transition":
    "browser: prompt flies between modes with stationary breadcrumbs and a corner landing",
} as const;

const fineDetailsPromptFlightLandingTargets = [
  fineDetailsPromptFlightTargets.enabled,
  fineDetailsPromptFlightTargets.offsetX,
  fineDetailsPromptFlightTargets.offsetY,
  fineDetailsPromptFlightTargets.startDelay,
  fineDetailsPromptFlightTargets.flightTime,
  fineDetailsPromptFlightTargets.bounce,
] as const;

const fineDetailsPromptGhostTargets = [
  fineDetailsPromptFlightTargets.ghosts,
  fineDetailsPromptFlightTargets.ghostSpacing,
  fineDetailsPromptFlightTargets.ghostOpacity,
  fineDetailsPromptFlightTargets.ghostFalloff,
  fineDetailsPromptFlightTargets.vanishStagger,
  fineDetailsPromptFlightTargets.vanishTime,
] as const;

function fineDetailsControlAcceptance({
  componentType,
  expectedObservable,
  target,
  userAction,
}: {
  componentType: string;
  expectedObservable: string;
  target: string;
  userAction: string;
}): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `${target} maps canonical state into the Fine Details preview payload`,
    browser: true,
    browserTestName: `browser: ${target} changes the embedded Fine Details output`,
    componentType,
    evidence: "product-output",
    expectedObservable,
    fixture:
      "Fine Details section with edge typography and the migrated AI prompt popup",
    id: target,
    kind: "control",
    target,
    userAction,
  };
}

function fineDetailsPromptFlightInteractionId(target: string) {
  return `panel-${target.replaceAll(".", "-")}`;
}

function fineDetailsPromptFlightControlAcceptance(options: {
  componentType: string;
  expectedObservable: string;
  target: FineDetailsPromptFlightTarget;
  userAction: string;
}): ToolcraftComponentAcceptance {
  return {
    ...fineDetailsControlAcceptance(options),
    browserTestName: fineDetailsPromptFlightBrowserTestNames[options.target],
    interactionId: fineDetailsPromptFlightInteractionId(options.target),
  };
}

function fineDetailsLoadingControlAcceptance(options: {
  componentType: string;
  expectedObservable: string;
  target: string;
  userAction: string;
}): ToolcraftComponentAcceptance {
  return {
    ...fineDetailsControlAcceptance(options),
    interactionId: fineDetailsPromptFlightInteractionId(options.target),
  };
}

const fineDetailsLoadingInteractionOwnership = Object.values(
  fineDetailsLoadingTargets,
).map((target) => ({
  alternative: {
    reason:
      "The iframe renders the loading placeholders but cannot own duplicate persistent surface-styling controls.",
    surface: "canvas" as const,
  },
  capability: "property-edit" as const,
  evidence: {
    detail:
      "The user requested the generation-state wave animation to be fully tunable from the Toolcraft panel.",
    source: "user-request" as const,
  },
  id: fineDetailsPromptFlightInteractionId(target),
  reason:
    "The Toolcraft panel owns these fifteen persistent global property edits while the iframe remains the product output surface.",
  selectionScope: { mode: "global" as const },
  surface: "panel" as const,
  target,
}));

const fineDetailsPromptFlightInteractionOwnership = Object.values(
  fineDetailsPromptFlightTargets,
).map((target) => ({
  alternative: {
    reason:
      "The iframe is the product output and interaction surface, but it cannot own duplicate persistent precision settings controls.",
    surface: "canvas" as const,
  },
  capability: "property-edit" as const,
  evidence: {
    detail:
      "The user requested every prompt-flight parameter to be precisely tunable from the Toolcraft panel.",
    source: "user-request" as const,
  },
  id: fineDetailsPromptFlightInteractionId(target),
  reason:
    "The Toolcraft panel owns these twelve persistent global property edits while the iframe remains the product output and interaction surface.",
  selectionScope: { mode: "global" as const },
  surface: "panel" as const,
  target,
}));

const fineDetailsPromptFlightCommandInteractionId =
  "panel-prompt-flight-commands";

const fineDetailsPromptFlightCommandInteractionOwnership = {
  alternative: {
    reason:
      "The iframe executes and displays prompt motion but does not duplicate the explicit Run and Reset command surface.",
    surface: "canvas" as const,
  },
  capability: "command" as const,
  evidence: {
    detail:
      "The approved Prompt Flight actions plan assigns both one-shot playback commands to the Toolcraft panel.",
    source: "user-request" as const,
  },
  id: fineDetailsPromptFlightCommandInteractionId,
  reason:
    "The adjacent Playback section is the single owner of transient Run and Reset commands without owning persistent flight settings.",
  surface: "panel" as const,
  target: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
};

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: {
    behaviorCoverage: [
      "no-duration-control",
      "no-export-at-time",
      "no-loop-control",
      "no-play-pause",
      "no-scrub",
      "no-user-facing-transport",
    ],
    mode: "autonomous",
    reason:
      "Trail prompt typing is an idle decorative website animation; Toolcraft authors configuration without playback, scrubbing, duration, loop, or export-at-time controls.",
  },
  mode: "new-toolcraft-app",
  referenceInputs: [],
};

export const appProductReadiness: ToolcraftProductReadiness = {
  exportIntent: {
    image: {
      evidence:
        "The user explicitly said: “экспорт мы не делаем вообще”. The product publishes settings to the local website instead of creating artifacts.",
      mode: "user-removed",
    },
    svg: { mode: "not-requested" },
    video: { mode: "not-requested" },
  },
  interactionOwnership: [
    {
      alternative: {
        reason:
          "The canvas must contain only the website output and cannot own repository-writing editor controls.",
        surface: "canvas",
      },
      capability: "command",
      evidence: {
        detail:
          "The user requested adjacent Reset actions matching the local Toolcraft-to-website workflow.",
        source: "user-request",
      },
      id: "panel-website-settings-sync",
      reason:
        "Sticky panel actions keep live preview edits separate from deliberate website persistence.",
      surface: "panel",
      target: "website.settings",
    },
    {
      alternative: {
        reason:
          "A canvas drag would duplicate the requested panel pad and add editing chrome over the website output.",
        surface: "canvas",
      },
      capability: "property-edit",
      evidence: {
        detail:
          "The user explicitly requested moving this popup through a pad in the Toolcraft panel.",
        source: "user-request",
      },
      id: "panel-fine-details-prompt-position",
      reason:
        "The built-in Vector pad provides the requested normalized two-axis placement control.",
      selectionScope: { mode: "global" },
      surface: "panel",
      target: fineDetailsPromptTargets.position,
    },
    {
      alternative: {
        reason:
          "The Toolcraft panel already owns the persistent authored position; visitor drag must remain transient and must not duplicate that stored value.",
        surface: "panel",
      },
      capability: "direct-spatial-edit",
      evidence: {
        detail:
          "The user requested dragging the prompt directly on the website and returning it to its original position with a double-click.",
        source: "user-request",
      },
      id: "canvas-fine-details-prompt-runtime-offset",
      reason:
        "Direct canvas movement provides the requested visitor interaction while leaving authored Toolcraft placement, persistence, and history unchanged.",
      surface: "canvas",
      target: fineDetailsPromptTargets.position,
    },
    {
      alternative: {
        reason:
          "Canvas-owned collection chrome would cover the website composition and duplicate the built-in uploader.",
        surface: "canvas",
      },
      capability: "collection-edit",
      evidence: {
        detail:
          "The requested trail needs an ordered image set whose upload, reorder, transform, removal, and reset lifecycle is owned by Toolcraft.",
        source: "user-request",
      },
      id: "panel-trail-images",
      reason:
        "The built-in file-drop collection is the single editing surface for the ordered trail image set.",
      surface: "panel",
      target: fineDetailsTrailTargets.images,
    },
    ...fineDetailsPromptFlightInteractionOwnership,
    ...fineDetailsLoadingInteractionOwnership,
    fineDetailsPromptFlightCommandInteractionOwnership,
    {
      alternative: {
        reason:
          "Canvas-owned collection controls would cover the website prompt and mix authored configuration with transient animation state.",
        surface: "canvas",
      },
      capability: "collection-edit",
      evidence: {
        detail:
          "The requested Toolcraft Prompt Typing section owns the ordered, user-editable phrase collection.",
        source: "user-request",
      },
      id: "panel-prompt-typing-phrases",
      reason:
        "The built-in panel collection keeps add, remove, order, persistence, reset, and settings transfer in canonical Toolcraft state.",
      surface: "panel",
      target: fineDetailsPromptTargets.typingPhrases,
    },
  ],
  mode: "product",
  productName: "Recraft Fine Details",
  productSummary:
    "A Toolcraft controller for the real website Fine Details background, selectable cursor trail, loading state, authored image carousel, edge typography, section height, AI prompt popup with idle typing, corner landing, stationary prompt-flight breadcrumbs, and a tunable checker-wave loading treatment.",
  requestedBehavior:
    "Keep the light grid background, switch among the ordered cursor image trail, generation loading state, and four-image authored carousel, configure the active image treatment, style the generation placeholders with a tunable glossy checker wave that can distort the pattern beneath its band, configure the two edge-anchored typography compositions, author the migrated AI prompt popup position, idle Trail typing phrases and timing, and prompt-flight corner offsets, timing, bounce, breadcrumb visibility, spacing, opacity falloff, and vanish sequencing, let website visitors transiently drag and double-click-reset that popup, edit shadows, and synchronize defaults or current numeric settings to the local website through Reset.",
  viewInteraction: {
    evidence:
      "The inspected website reference is a flat fixed-framing section background with no spatial model or camera interaction.",
    mode: "fixed-camera",
    source: "inspected-reference",
  },
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [
  {
    actionCoverage: ["website.reset"],
    automated: true,
    automatedTestName:
      "main Reset restores controls and resets the local Prompt Flight",
    browser: true,
    browserTestName:
      "browser: Reset restores native Fine Details defaults without publication",
    componentType: "panelActions",
    evidence: "command-side-effect",
    expectedObservable:
      "Reset restores native controls/default media and resets Prompt Flight without publication or a settings API.",
    fixture: "Standalone native Fine Details example",
    id: "website.settings",
    interactionId: "panel-website-settings-sync",
    kind: "control",
    target: "website.settings",
    userAction: "Edit the background, then click the sticky Reset action.",
  },
  {
    automated: true,
    automatedTestName: "sends background color through the website bridge",
    browser: true,
    browserTestName: "browser: Background color updates the real Fine Details section",
    componentType: "color",
    evidence: "product-output",
    expectedObservable:
      "Changing Color updates the solid background beneath the retained grid texture.",
    fixture: "Default light Fine Details background",
    id: fineDetailsTargets.background,
    kind: "control",
    target: fineDetailsTargets.background,
    userAction: "Choose a different Background color.",
  },
  {
    automated: true,
    automatedTestName: "sends grid size through the website bridge",
    browser: true,
    browserTestName: "browser: Grid size changes the real Fine Details texture scale",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Dragging Grid size changes the repeated texture cell dimensions without adding section content.",
    fixture: "Default 50 pixel Fine Details grid",
    id: fineDetailsTargets.gridSize,
    kind: "control",
    target: fineDetailsTargets.gridSize,
    userAction: "Drag Grid size to a different value.",
  },
  {
    automated: true,
    automatedTestName: "sends grid opacity through the website bridge",
    browser: true,
    browserTestName: "browser: Grid opacity changes the real Fine Details texture strength",
    componentType: "slider",
    evidence: "product-output",
    expectedObservable:
      "Dragging Grid opacity changes only the retained texture visibility over the background color.",
    fixture: "Default 80 percent Fine Details grid",
    id: fineDetailsTargets.gridOpacity,
    kind: "control",
    target: fineDetailsTargets.gridOpacity,
    userAction: "Drag Grid opacity to a different value.",
  },
  {
    ...fineDetailsControlAcceptance({
      componentType: "segmented",
      expectedObservable:
        "Selecting Loading publishes the editable generation-waiting state with shared Text gap, Corner radius, and Gap geometry; selecting Carousel replaces it with the authored image strip, while selecting Trail restores the cursor trail.",
      target: fineDetailsCarouselTargets.imagesMode,
      userAction: "Switch Images among Trail, Loading, and Carousel.",
    }),
    browserTestName: "browser: loading state shows two placeholder cards",
    optionCoverage: ["trail", "loading", "carousel"],
  },
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The carousel renders the selected leading count from the four authored images in source order.",
    target: fineDetailsCarouselTargets.count,
    userAction: "Choose a Carousel Images count.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The carousel keeps the selected equal pixel gap from the upper and lower typography edges while card height fills the remaining band up to 800 pixels.",
    target: fineDetailsCarouselTargets.textGap,
    userAction: "Drag Carousel Text gap.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every carousel image uses the selected shared pixel corner radius without changing its intrinsic aspect ratio.",
    target: fineDetailsCarouselTargets.radius,
    userAction: "Drag Carousel Corner radius.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The horizontal distance between adjacent carousel images matches the selected pixel gap.",
    target: fineDetailsCarouselTargets.gap,
    userAction: "Drag Carousel Gap.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "An overflowing carousel advances at the selected pixel-per-second speed while a fitting row remains centered and static.",
    target: fineDetailsCarouselTargets.speed,
    userAction: "Drag Carousel Speed.",
  }),
  fineDetailsControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "The shared carousel border appears or disappears on every visible image while its authored values remain preserved.",
    target: fineDetailsCarouselTargets.borderEnabled,
    userAction: "Toggle Carousel Border.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every carousel image uses the selected shared border width without changing the row geometry.",
    target: fineDetailsCarouselTargets.borderWidth,
    userAction: "Drag Carousel Border width.",
  }),
  {
    ...fineDetailsControlAcceptance({
      componentType: "colorOpacity",
      expectedObservable:
        "Every carousel image border uses the selected shared color and opacity.",
      target: fineDetailsCarouselTargets.borderColorOpacity,
      userAction: "Choose a Carousel Border color and opacity.",
    }),
    controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
  },
  fineDetailsControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "The shared carousel shadow appears or disappears on every visible image while its authored values remain preserved.",
    target: fineDetailsCarouselTargets.shadowEnabled,
    userAction: "Toggle Carousel Shadow.",
  }),
  {
    ...fineDetailsControlAcceptance({
      componentType: "vector",
      expectedObservable:
        "Changing either axis moves the shared shadow on every carousel image.",
      target: fineDetailsCarouselTargets.shadowOffset,
      userAction: "Move Carousel Shadow offset horizontally and vertically.",
    }),
    controlPartCoverage: ["vector.x", "vector.y"],
  },
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every carousel image shadow edge becomes sharper or softer without changing its spread.",
    target: fineDetailsCarouselTargets.shadowBlur,
    userAction: "Drag Carousel Shadow blur.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every carousel image shadow contracts or expands before blur is applied.",
    target: fineDetailsCarouselTargets.shadowSpread,
    userAction: "Drag Carousel Shadow spread.",
  }),
  {
    ...fineDetailsControlAcceptance({
      componentType: "colorOpacity",
      expectedObservable:
        "Every carousel image shadow uses the selected shared color and opacity.",
      target: fineDetailsCarouselTargets.shadowColorOpacity,
      userAction: "Choose a Carousel Shadow color and opacity.",
    }),
    controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
  },
  fineDetailsLoadingControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "Turning Active off returns the three placeholders to the plain vertical shimmer; turning it on restores the checker wave sweep.",
    target: fineDetailsLoadingTargets.enabled,
    userAction: "Toggle Loading Wave Active with Images set to Loading.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The checker cells on every placeholder grow or shrink to the selected pixel size.",
    target: fineDetailsLoadingTargets.cell,
    userAction: "Drag Loading Wave Cell size.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The checker cells grow darker against the card surface as the value rises; zero hides the pattern entirely.",
    target: fineDetailsLoadingTargets.contrast,
    userAction: "Drag Loading Wave Contrast.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The card surface lightens from the base gray toward white across every placeholder.",
    target: fineDetailsLoadingTargets.baseTone,
    userAction: "Drag Loading Wave Base tone.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The flipped cells inside the sweeping band whiten into a glossy sheen as the value rises; zero keeps the plain tone flip.",
    target: fineDetailsLoadingTargets.glare,
    userAction: "Drag Loading Wave Glare.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The checker pattern under the band shifts by the selected pixel offset, refracting as the wave passes; zero keeps the pattern aligned.",
    target: fineDetailsLoadingTargets.distort,
    userAction: "Drag Loading Wave Distortion.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every placeholder card gains the selected outline width with the wave on or off; zero removes the outline.",
    target: fineDetailsLoadingTargets.borderWidth,
    userAction: "Drag Loading Wave Border width.",
  }),
  {
    ...fineDetailsLoadingControlAcceptance({
      componentType: "colorOpacity",
      expectedObservable:
        "Every placeholder card outline uses the selected shared color and opacity.",
      target: fineDetailsLoadingTargets.borderColorOpacity,
      userAction: "Choose a Loading Wave Border color and opacity.",
    }),
    controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
  },
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The sweeping band's flipped-cell span covers the selected share of the card diagonal.",
    target: fineDetailsLoadingTargets.waveWidth,
    userAction: "Drag Loading Wave Wave width.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The band's edges go from a hard cell flip at zero to a smooth feathered blend at full softness.",
    target: fineDetailsLoadingTargets.softness,
    userAction: "Drag Loading Wave Softness.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The band sweeps across the cards along the selected direction of travel.",
    target: fineDetailsLoadingTargets.angle,
    userAction: "Drag Loading Wave Angle.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "One sweep takes the selected duration to cross a card at constant speed.",
    target: fineDetailsLoadingTargets.passTime,
    userAction: "Drag Loading Wave Pass time.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Consecutive sweeps hold the selected dead time between passes while the checker stays static.",
    target: fineDetailsLoadingTargets.pause,
    userAction: "Drag Loading Wave Pause.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Each next placeholder's sweep starts the selected delay later, rippling the wave across the row.",
    target: fineDetailsLoadingTargets.stagger,
    userAction: "Drag Loading Wave Stagger.",
  }),
  fineDetailsLoadingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Each next card's wave cycle runs the selected share longer, so the sweeps drift out of phase over time; zero keeps every card's cycle identical.",
    target: fineDetailsLoadingTargets.desync,
    userAction: "Drag Wave Motion Desync.",
  }),
  ...fineDetailsPromptTypingAcceptance,
  {
    automated: true,
    automatedTestName:
      "trail.images maps runtime media order and transforms into the website",
    browser: true,
    browserTestName:
      "browser: trail images preserve upload order, aspect and transforms",
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "The 50 predefined images appear as attached files, can be removed to an empty trail, return on Reset, and uploaded images cycle in media order with their aspect and transforms intact.",
    fixture:
      "Fifty ordered predefined WebP trail images plus portrait and landscape PNG upload fixtures",
    id: fineDetailsTrailTargets.images,
    interactionId: "panel-trail-images",
    kind: "control",
    mediaLifecycleCoverage: [
      "upload",
      "remove",
      "reset",
      "default-remove",
      "default-reset",
      "rotate",
      "flip",
      "transform-output",
      "reorder",
      "order-output",
    ],
    target: fineDetailsTrailTargets.images,
    userAction:
      "Remove the predefined trail images, Reset them, then upload, reorder, rotate, flip and remove trail images.",
  },
  fineDetailsControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "The cursor trail starts or stops without changing the background, typography, or prompt.",
    target: fineDetailsTrailTargets.enabled,
    userAction: "Toggle Trail Active.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every new trail card uses the selected pixel height while preserving its image aspect ratio.",
    target: fineDetailsTrailTargets.cardSize,
    userAction: "Drag Trail Card size.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every trail image is clipped by the selected shared pixel corner radius.",
    target: fineDetailsTrailTargets.cardRadius,
    userAction: "Drag Trail Card radius.",
  }),
  fineDetailsControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "The shared solid border appears or disappears on every retained and newly spawned trail card.",
    target: fineDetailsTrailTargets.borderEnabled,
    userAction: "Toggle Trail Border.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every trail card uses the selected internal border width without changing its outer bounds.",
    target: fineDetailsTrailTargets.borderWidth,
    userAction: "Drag Trail Border width.",
  }),
  fineDetailsControlAcceptance({
    componentType: "color",
    expectedObservable:
      "Every trail card border uses the selected solid color without changing its image or shadow.",
    target: fineDetailsTrailTargets.borderColor,
    userAction: "Choose a Trail Border color.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The live cursor trail retains no more than the selected number of cards.",
    target: fineDetailsTrailTargets.length,
    userAction: "Drag Trail Length.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Older cards shrink by the selected percentage while retaining a visible minimum scale.",
    target: fineDetailsTrailTargets.sizeFalloff,
    userAction: "Drag Trail Size falloff.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Cards spawn after the smoothed pointer travels the selected pixel distance.",
    target: fineDetailsTrailTargets.spacing,
    userAction: "Drag Trail Spacing.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "New cards receive a bounded random rotation within the selected angle.",
    target: fineDetailsTrailTargets.tilt,
    userAction: "Drag Trail Tilt.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The trail follows the pointer with the selected spring smoothing duration.",
    target: fineDetailsTrailTargets.smoothness,
    userAction: "Drag Trail Smoothness.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Each spawned card remains alive for the selected duration before exiting.",
    target: fineDetailsTrailTargets.lifetime,
    userAction: "Drag Trail Lifetime.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "New cards reach full opacity over the selected fade-in duration.",
    target: fineDetailsTrailTargets.fadeIn,
    userAction: "Drag Trail Fade in.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Expired cards disappear over the selected fade-out duration.",
    target: fineDetailsTrailTargets.fadeOut,
    userAction: "Drag Trail Fade out.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Trail spawning waits for the selected duration after the pointer leaves the prompt.",
    target: fineDetailsTrailTargets.resumeDelay,
    userAction: "Drag Trail Resume delay.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Trail spacing eases back to its configured value over the selected resume ramp.",
    target: fineDetailsTrailTargets.resumeRamp,
    userAction: "Drag Trail Resume ramp.",
  }),
  fineDetailsControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "The shared shadow appears or disappears on all retained trail cards.",
    target: fineDetailsTrailTargets.shadowEnabled,
    userAction: "Toggle Trail Shadow.",
  }),
  {
    ...fineDetailsControlAcceptance({
      componentType: "vector",
      expectedObservable:
        "Changing either axis moves the shared shadow on every trail card.",
      target: fineDetailsTrailTargets.shadowOffset,
      userAction: "Move Trail Shadow offset horizontally and vertically.",
    }),
    controlPartCoverage: ["vector.x", "vector.y"],
  },
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every trail card shadow edge becomes sharper or softer without changing its spread.",
    target: fineDetailsTrailTargets.shadowBlur,
    userAction: "Drag Trail Shadow blur.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Every trail card shadow contracts or expands before blur is applied.",
    target: fineDetailsTrailTargets.shadowSpread,
    userAction: "Drag Trail Shadow spread.",
  }),
  {
    ...fineDetailsControlAcceptance({
      componentType: "colorOpacity",
      expectedObservable:
        "Every trail card shadow uses the selected color and transparency.",
      target: fineDetailsTrailTargets.shadowColorOpacity,
      userAction: "Choose a different Trail Shadow color and opacity.",
    }),
    controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
  },
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The TRY IT heading moves to the selected pixel distance from the section's left edge.",
    target: fineDetailsTypographyTargets.upperLeftLeft,
    userAction: "Change Upper Left Typography Left.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The TRY IT heading moves to the selected pixel distance from the section's top edge.",
    target: fineDetailsTypographyTargets.upperLeftTop,
    userAction: "Change Upper Left Typography Top.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The TRY IT heading uses the selected pixel font size without changing its edge anchors.",
    target: fineDetailsTypographyTargets.upperLeftFontSize,
    userAction: "Change Upper Left Typography Font size.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The YOUR WAY composition moves to the selected pixel distance from the section's right edge.",
    target: fineDetailsTypographyTargets.lowerRightRight,
    userAction: "Change Lower Right Typography Right.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The YOUR WAY composition moves to the selected pixel distance from the section's bottom edge.",
    target: fineDetailsTypographyTargets.lowerRightBottom,
    userAction: "Change Lower Right Typography Bottom.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The YOUR WAY heading uses the selected pixel font size without changing the body size.",
    target: fineDetailsTypographyTargets.lowerRightHeadingFontSize,
    userAction: "Change Lower Right Typography Heading size.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The lower-right body copy uses the selected pixel font size without changing the heading size.",
    target: fineDetailsTypographyTargets.lowerRightBodyFontSize,
    userAction: "Change Lower Right Typography Body size.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The vertical distance between YOUR WAY and its body copy matches the selected pixel gap.",
    target: fineDetailsTypographyTargets.lowerRightGap,
    userAction: "Change Lower Right Typography Gap.",
  }),
  {
    ...fineDetailsControlAcceptance({
      componentType: "vector",
      expectedObservable:
        "Changing either axis moves the complete AI prompt popup across the Fine Details section.",
      target: fineDetailsPromptTargets.position,
      userAction: "Move Prompt Position horizontally and vertically.",
    }),
    controlPartCoverage: ["vector.x", "vector.y"],
    interactionId: "panel-fine-details-prompt-position",
  },
  {
    automated: true,
    automatedTestName:
      "visitor prompt dragging is declared as a transient canvas-owned offset",
    browser: true,
    browserTestName: "browser: visitor drags and resets the Fine Details prompt",
    componentType: "canvas",
    evidence: "product-output",
    expectedObservable:
      "In Carousel, non-interactive prompt chrome shows grab/grabbing, moves the complete panel within the section, and double-click resets it; in Trail, the prompt returns to its authored position and cannot be dragged without changing form content.",
    fixture: "Fine Details website preview with the migrated AI prompt popup",
    id: "prompt.runtimeOffset",
    interactionId: "canvas-fine-details-prompt-runtime-offset",
    kind: "runtime",
    target: fineDetailsPromptTargets.position,
    userAction:
      "Select Carousel, drag and reset the prompt from non-interactive chrome, then select Trail and repeat the same gesture.",
  },
  fineDetailsPromptFlightControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "Turning Active off makes Carousel and Trail changes snap the prompt to the correct endpoint without animated ghosts; turning it on restores the flight.",
    target: fineDetailsPromptFlightTargets.enabled,
    userAction: "Toggle Prompt Flight Active, then replay Carousel and Trail.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The selected pixel Offset X moves the prompt touchdown left edge by the same amount from the upper-left typography's exact left-edge corner anchor.",
    target: fineDetailsPromptFlightTargets.offsetX,
    userAction: "Drag Prompt Flight Offset X, then replay Carousel.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The selected pixel Offset Y moves the prompt touchdown bottom edge by the same amount from the lower-right typography's exact bottom-edge corner anchor.",
    target: fineDetailsPromptFlightTargets.offsetY,
    userAction: "Drag Prompt Flight Offset Y, then replay Carousel.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The prompt waits for the selected delay after Carousel begins before leaving its current position.",
    target: fineDetailsPromptFlightTargets.startDelay,
    userAction: "Drag Prompt Flight Start delay, then replay Carousel.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The prompt reaches the same landing point over the selected flight duration.",
    target: fineDetailsPromptFlightTargets.flightTime,
    userAction: "Drag Prompt Flight Flight time, then replay Carousel.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The prompt uses the selected proportional overshoot before settling at its landing point.",
    target: fineDetailsPromptFlightTargets.bounce,
    userAction: "Drag Prompt Flight Bounce, then replay Carousel.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "Turning Prompt Ghosts Active off removes breadcrumb copies from outbound and return flights; turning it on restores them.",
    target: fineDetailsPromptFlightTargets.ghosts,
    userAction: "Toggle Prompt Ghosts Active, then replay Carousel and Trail.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Adjacent stationary dropped-copy centers remain approximately the selected pixel Spacing apart, and each breadcrumb keeps the same rectangle after it drops.",
    target: fineDetailsPromptFlightTargets.ghostSpacing,
    userAction: "Drag Prompt Ghosts Spacing, then replay Carousel.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The selected Opacity scales the visible opacity of the complete breadcrumb chain.",
    target: fineDetailsPromptFlightTargets.ghostOpacity,
    userAction: "Drag Prompt Ghosts Opacity, then replay Carousel.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Breadcrumbs dim progressively toward the takeoff point by the selected Falloff; zero keeps the complete visible chain uniform.",
    target: fineDetailsPromptFlightTargets.ghostFalloff,
    userAction: "Drag Prompt Ghosts Falloff, then replay Carousel.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "After landing with a high Vanish stagger, the first-dropped breadcrumb is gone while the last-dropped breadcrumb remains visible before its later fade begins.",
    target: fineDetailsPromptFlightTargets.vanishStagger,
    userAction: "Drag Prompt Ghosts Vanish stagger, then replay Carousel.",
  }),
  fineDetailsPromptFlightControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Vanish time controls the fade duration of each stationary breadcrumb after its staggered vanish begins.",
    target: fineDetailsPromptFlightTargets.vanishTime,
    userAction: "Drag Prompt Ghosts Vanish time, then replay Carousel.",
  }),
  {
    actionCoverage: [
      FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.actionId,
      FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.actionId,
    ],
    automated: true,
    automatedTestName:
      "Prompt Flight Run and Reset send one-shot commands without mutating settings",
    browser: true,
    browserTestName: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_BROWSER_TEST_NAME,
    componentType: "actions",
    evidence: "command-side-effect",
    expectedObservable:
      "Run restarts the outbound flight with current settings, while Reset cancels current motion and starts the breadcrumb-enabled return to base; neither command edits or persists a flight property.",
    fixture:
      "Fine Details website preview with protocol v17 ready and nondefault Prompt Flight settings",
    id: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID,
    interactionId: fineDetailsPromptFlightCommandInteractionId,
    kind: "control",
    target: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
    userAction:
      "Click Prompt Flight Playback Run during or after a flight, then click Reset.",
  },
  {
    automated: true,
    automatedTestName:
      "prompt flight transition is driven by the existing Images segmented control",
    browser: true,
    browserTestName: fineDetailsPromptFlightBrowserTestNames["prompt.flight.transition"],
    componentType: "iframe",
    evidence: "product-output",
    expectedObservable:
      "Entering Carousel flies the prompt to the exact typography-corner landing with stationary dropped breadcrumbs that vanish first-dropped-first after arrival; returning to Trail uses the same direction-agnostic breadcrumb behavior.",
    fixture:
      "Fine Details website preview with Active prompt flight and the existing Images segmented replay control",
    id: "prompt.flight.transition",
    kind: "runtime",
    target: fineDetailsCarouselTargets.imagesMode,
    userAction:
      "Select Carousel in Images, wait for the breadcrumbs to vanish, then select Trail and observe the return breadcrumbs.",
  },
  fineDetailsControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "The prompt panel shadow appears or disappears without changing the panel content.",
    target: fineDetailsPromptTargets.shadowEnabled,
    userAction: "Toggle Prompt Shadow.",
  }),
  {
    ...fineDetailsControlAcceptance({
      componentType: "vector",
      expectedObservable:
        "Changing either axis moves only the rounded prompt panel shadow.",
      target: fineDetailsPromptTargets.shadowOffset,
      userAction: "Move Prompt Shadow offset horizontally and vertically.",
    }),
    controlPartCoverage: ["vector.x", "vector.y"],
  },
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The prompt panel shadow edge becomes sharper or softer without changing its spread.",
    target: fineDetailsPromptTargets.shadowBlur,
    userAction: "Drag Prompt Shadow blur.",
  }),
  fineDetailsControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The prompt panel shadow contracts or expands around the panel before blur is applied.",
    target: fineDetailsPromptTargets.shadowSpread,
    userAction: "Drag Prompt Shadow spread.",
  }),
  {
    ...fineDetailsControlAcceptance({
      componentType: "colorOpacity",
      expectedObservable:
        "The prompt panel shadow uses the selected color and transparency without changing panel content.",
      target: fineDetailsPromptTargets.shadowColorOpacity,
      userAction: "Choose a different Prompt Shadow color and opacity.",
    }),
    controlPartCoverage: ["colorOpacity.hex", "colorOpacity.opacity"],
  },
  {
    automated: true,
    automatedTestName: "sends canvas height through the website bridge",
    browser: true,
    browserTestName: "browser: Canvas height resizes the real Fine Details section",
    componentType: "text",
    evidence: "product-output",
    expectedObservable:
      "Changing Canvas height resizes the Toolcraft artboard and the website-owned section to the same reference height.",
    fixture: "Recraft Fine Details preview at 1920 by 1080",
    id: "section.height",
    kind: "control",
    target: "canvas.size.height",
    userAction: "Enter a new Canvas height and commit it.",
  },
  {
    automated: true,
    automatedTestName:
      "infinity mode keeps the external preview on its exact scene bounds",
    browser: true,
    browserTestName:
      "browser: infinity mode restores the exact finite Fine Details size",
    componentType: "canvas",
    evidence: "viewport-side-effect",
    expectedObservable:
      "Infinity mode removes finite artboard clipping and disabling it restores the exact 1920 by 1080 preview.",
    fixture: "Finite 1920 by 1080 Fine Details preview",
    id: "canvas.infinity",
    infinityCanvasCoverage: "mode-and-restoration",
    kind: "runtime",
    target: "canvas.infinity",
    userAction: "Enable Infinity canvas, then disable it again.",
  },
  {
    automated: true,
    automatedTestName:
      "declares production reload coverage for the Fine Details bridge",
    browser: true,
    browserTestName:
      "browser: app restores exact canvas, values, and panel workspace slices after reload",
    componentType: "persistence",
    evidence: "persistence-state",
    expectedObservable:
      "Canvas size, background values, zoom, and the Controls workspace remain restored after a real browser reload.",
    fixture: "Changed Fine Details appearance and Controls workspace",
    id: "persistence.reload",
    kind: "runtime",
    persistenceCoverage: "reload",
    persistenceSlices,
    target: "canvas.size.width",
    userAction:
      "Edit the background and canvas, move and collapse Controls, wait for persistence, and reload the page.",
  },
];

export const appControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [
  {
    entity: "Fine Details background",
    entityId: "fine-details-background",
    groupingReason:
      "Color, grid scale, and grid opacity together define the section's only retained visual entity.",
    id: "background",
    targets: [
      fineDetailsTargets.background,
      fineDetailsTargets.gridSize,
      fineDetailsTargets.gridOpacity,
    ],
    title: "Background",
  },
  {
    entity: "Fine Details authored image carousel",
    entityId: "fine-details-carousel",
    groupingReason:
      "Image mode, loading-state geometry, authored source count, row geometry, and travel speed define the carousel's primary presentation workflow.",
    id: "carousel",
    splitReason:
      "The carousel owns fourteen controls, so its primary presentation, border, and shadow are split into three adjacent workflow stages.",
    targets: [
      fineDetailsCarouselTargets.imagesMode,
      fineDetailsCarouselTargets.count,
      fineDetailsCarouselTargets.textGap,
      fineDetailsCarouselTargets.radius,
      fineDetailsCarouselTargets.gap,
      fineDetailsCarouselTargets.speed,
    ],
    title: "Carousel",
    workflowStage: "presentation",
  },
  {
    entity: "Fine Details authored image carousel",
    entityId: "fine-details-carousel",
    groupingReason:
      "Border visibility, width, color, and opacity define one shared edge treatment for every carousel image.",
    id: "carousel-border",
    splitReason:
      "The carousel owns fourteen controls, so border treatment remains separate from primary presentation and shadow authoring.",
    targets: [
      fineDetailsCarouselTargets.borderEnabled,
      fineDetailsCarouselTargets.borderWidth,
      fineDetailsCarouselTargets.borderColorOpacity,
    ],
    title: "Carousel Border",
    workflowStage: "border",
  },
  {
    entity: "Fine Details authored image carousel",
    entityId: "fine-details-carousel",
    groupingReason:
      "Shadow visibility, offset, blur, spread, color, and opacity define one shared depth treatment for every carousel image.",
    id: "carousel-shadow",
    splitReason:
      "The carousel owns fourteen controls, so shadow treatment remains separate from primary presentation and border authoring.",
    targets: [
      fineDetailsCarouselTargets.shadowEnabled,
      fineDetailsCarouselTargets.shadowOffset,
      fineDetailsCarouselTargets.shadowBlur,
      fineDetailsCarouselTargets.shadowSpread,
      fineDetailsCarouselTargets.shadowColorOpacity,
    ],
    title: "Carousel Shadow",
    workflowStage: "shadow",
  },
  {
    entity: "Fine Details loading wave",
    entityId: "fine-details-loading-wave",
    groupingReason:
      "Wave visibility, checker cell, contrast, base tone, glare, distortion, and the card outline define the placeholder surface and its gloss.",
    id: "loading-wave",
    splitReason:
      "The loading wave owns fifteen controls, so its surface styling and band motion are split into two adjacent workflow stages.",
    targets: [
      fineDetailsLoadingTargets.enabled,
      fineDetailsLoadingTargets.cell,
      fineDetailsLoadingTargets.contrast,
      fineDetailsLoadingTargets.baseTone,
      fineDetailsLoadingTargets.glare,
      fineDetailsLoadingTargets.distort,
      fineDetailsLoadingTargets.borderWidth,
      fineDetailsLoadingTargets.borderColorOpacity,
    ],
    title: "Loading Wave",
    workflowStage: "surface",
  },
  {
    entity: "Fine Details loading wave",
    entityId: "fine-details-loading-wave",
    groupingReason:
      "Band span, softness, direction, sweep timing, pause, per-card stagger, and cycle desync define how the wave travels.",
    id: "loading-wave-motion",
    splitReason:
      "The loading wave owns fifteen controls, so its surface styling and band motion are split into two adjacent workflow stages.",
    targets: [
      fineDetailsLoadingTargets.waveWidth,
      fineDetailsLoadingTargets.softness,
      fineDetailsLoadingTargets.angle,
      fineDetailsLoadingTargets.passTime,
      fineDetailsLoadingTargets.pause,
      fineDetailsLoadingTargets.stagger,
      fineDetailsLoadingTargets.desync,
    ],
    title: "Wave Motion",
    workflowStage: "motion",
  },
  {
    entity: "Fine Details cursor trail image set",
    entityId: "fine-details-trail-images",
    groupingReason:
      "The built-in uploader is the complete source, order, transform, and removal surface for cursor trail images.",
    id: "trail-images",
    targets: [fineDetailsTrailTargets.images],
    title: "Trail Images",
  },
  {
    entity: "Fine Details cursor image trail",
    entityId: "fine-details-image-trail",
    groupingReason:
      "Activation, card geometry, retained length, age falloff, spacing, and tilt define the trail's visual structure.",
    id: "trail",
    splitReason:
      "The trail has thirteen primary controls, so geometry and timing are separated into adjacent workflow stages.",
    targets: [
      fineDetailsTrailTargets.enabled,
      fineDetailsTrailTargets.cardSize,
      fineDetailsTrailTargets.cardRadius,
      fineDetailsTrailTargets.length,
      fineDetailsTrailTargets.sizeFalloff,
      fineDetailsTrailTargets.spacing,
      fineDetailsTrailTargets.tilt,
    ],
    title: "Trail",
    workflowStage: "geometry",
  },
  {
    entity: "Fine Details cursor image trail",
    entityId: "fine-details-image-trail",
    groupingReason:
      "Spring smoothing, lifetime, fades, and prompt-exit recovery jointly define the trail's timing behavior.",
    id: "trail-motion",
    splitReason:
      "The trail has thirteen primary controls, so timing remains separate from geometry and activation.",
    targets: [
      fineDetailsTrailTargets.smoothness,
      fineDetailsTrailTargets.lifetime,
      fineDetailsTrailTargets.fadeIn,
      fineDetailsTrailTargets.fadeOut,
      fineDetailsTrailTargets.resumeDelay,
      fineDetailsTrailTargets.resumeRamp,
    ],
    title: "Trail Motion",
    workflowStage: "timing",
  },
  {
    entity: "Fine Details cursor trail border",
    entityId: "fine-details-trail-border",
    groupingReason:
      "Visibility, width, and color jointly define the shared solid border for every trail card.",
    id: "trail-border",
    targets: [
      fineDetailsTrailTargets.borderEnabled,
      fineDetailsTrailTargets.borderWidth,
      fineDetailsTrailTargets.borderColor,
    ],
    title: "Trail Border",
  },
  {
    entity: "Fine Details cursor trail shadow",
    entityId: "fine-details-trail-shadow",
    groupingReason:
      "Visibility, offset, blur, spread, and color jointly define the shared shadow for every trail card.",
    id: "trail-shadow",
    targets: [
      fineDetailsTrailTargets.shadowEnabled,
      fineDetailsTrailTargets.shadowOffset,
      fineDetailsTrailTargets.shadowBlur,
      fineDetailsTrailTargets.shadowSpread,
      fineDetailsTrailTargets.shadowColorOpacity,
    ],
    title: "Trail Shadow",
  },
  {
    entity: "Fine Details upper-left typography",
    entityId: "fine-details-upper-left-typography",
    groupingReason:
      "Left inset, top inset, and font size jointly define the TRY IT edge composition.",
    id: "upper-left-typography",
    targets: [
      fineDetailsTypographyTargets.upperLeftLeft,
      fineDetailsTypographyTargets.upperLeftTop,
      fineDetailsTypographyTargets.upperLeftFontSize,
    ],
    title: "Upper Left Typography",
  },
  {
    entity: "Fine Details lower-right typography",
    entityId: "fine-details-lower-right-typography",
    groupingReason:
      "Right and bottom insets, both type sizes, and the internal gap jointly define the YOUR WAY composition.",
    id: "lower-right-typography",
    targets: [
      fineDetailsTypographyTargets.lowerRightRight,
      fineDetailsTypographyTargets.lowerRightBottom,
      fineDetailsTypographyTargets.lowerRightHeadingFontSize,
      fineDetailsTypographyTargets.lowerRightBodyFontSize,
      fineDetailsTypographyTargets.lowerRightGap,
    ],
    title: "Lower Right Typography",
  },
  {
    entity: "Fine Details AI prompt popup",
    entityId: "fine-details-prompt-popup",
    groupingReason:
      "Two-axis placement is the complete position-editing surface requested for the migrated popup.",
    id: "prompt",
    targets: [fineDetailsPromptTargets.position],
    title: "Prompt",
  },
  {
    entity: "Fine Details prompt flight",
    entityId: "fine-details-prompt-flight",
    groupingReason:
      "Active, exact typography-corner offset axes, timing, and bounce are the complete persistent corner-landing flight surface.",
    id: "prompt-flight",
    targets: fineDetailsPromptFlightLandingTargets,
    title: "Prompt Flight",
  },
  {
    entity: "Fine Details prompt ghost trail",
    entityId: "fine-details-prompt-ghost-trail",
    groupingReason:
      "Active, stationary spacing, opacity, falloff, and vanish sequencing are the complete breadcrumb-trail surface.",
    id: "prompt-ghosts",
    targets: fineDetailsPromptGhostTargets,
    title: "Prompt Ghosts",
  },
  {
    entity: "Fine Details prompt flight playback",
    entityId: "fine-details-prompt-flight-playback",
    groupingReason:
      "Run and Reset are the complete transient command surface for local prompt-flight playback.",
    id: "prompt-flight-playback",
    targets: [FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET],
    title: "Playback",
  },
  {
    entity: "Fine Details prompt shadow",
    entityId: "fine-details-prompt-shadow",
    groupingReason:
      "Visibility, offset, blur, spread, and color jointly define the popup shadow.",
    id: "prompt-shadow",
    targets: [
      fineDetailsPromptTargets.shadowEnabled,
      fineDetailsPromptTargets.shadowOffset,
      fineDetailsPromptTargets.shadowBlur,
      fineDetailsPromptTargets.shadowSpread,
      fineDetailsPromptTargets.shadowColorOpacity,
    ],
    title: "Prompt Shadow",
  },
  fineDetailsPromptTypingInventory,
];
