import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
} from "./acceptance/types";
import { fineDetailsPromptTargets } from "./fine-details-prompt-values";

function promptTypingControlAcceptance({
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

export const fineDetailsPromptTypingAcceptance: readonly ToolcraftComponentAcceptance[] = [
  promptTypingControlAcceptance({
    componentType: "switch",
    expectedObservable:
      "In Trail mode, the prompt begins or stops its self-running typing cycle while Carousel and Loading keep their existing static prompt behavior.",
    target: fineDetailsPromptTargets.typingEnabled,
    userAction: "Toggle Prompt Typing animation.",
  }),
  {
    ...promptTypingControlAcceptance({
      componentType: "collectionActions",
      expectedObservable:
        "Adding, editing, or removing phrases updates the Trail prompt cycle in the exact authored order while retaining at least one and at most eight entries.",
      target: fineDetailsPromptTargets.typingPhrases,
      userAction: "Add, edit, and remove ordered Prompt Typing phrases.",
    }),
    controlPartCoverage: [
      "collectionActions.add",
      "collectionActions.items",
      "collectionActions.remove",
    ],
    interactionId: "panel-prompt-typing-phrases",
  },
  promptTypingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Trail prompt characters appear at the selected character-per-second rate.",
    target: fineDetailsPromptTargets.typingTypeSpeed,
    userAction: "Drag Prompt Typing Type speed.",
  }),
  promptTypingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Backspace deletion removes Trail prompt characters at the selected character-per-second rate.",
    target: fineDetailsPromptTargets.typingDeleteSpeed,
    userAction: "Drag Prompt Typing Delete speed.",
  }),
  promptTypingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "Each completed Trail prompt phrase remains visible for the selected hold duration.",
    target: fineDetailsPromptTargets.typingHold,
    userAction: "Drag Prompt Typing Hold.",
  }),
  promptTypingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The Trail prompt remains empty for the selected gap before typing the next phrase.",
    target: fineDetailsPromptTargets.typingGap,
    userAction: "Drag Prompt Typing Gap.",
  }),
  promptTypingControlAcceptance({
    componentType: "slider",
    expectedObservable:
      "The Trail prompt typing cadence gains the selected bounded jitter, word rhythm, and occasional pause strength.",
    target: fineDetailsPromptTargets.typingHumanize,
    userAction: "Drag Prompt Typing Humanize.",
  }),
  {
    ...promptTypingControlAcceptance({
      componentType: "segmented",
      expectedObservable:
        "Backspace removes a completed phrase one character at a time, while Instant clears it at once before the configured gap.",
      target: fineDetailsPromptTargets.typingDeleteStyle,
      userAction: "Choose Backspace or Instant Prompt Typing deletion.",
    }),
    optionCoverage: ["backspace", "instant"],
  },
];

export const fineDetailsPromptTypingInventory: ToolcraftControlSectionInventoryEntry = {
  entity: "Fine Details prompt typing",
  entityId: "fine-details-prompt-typing",
  groupingReason:
    "The switch, ordered phrase collection, timing, humanization, and deletion mode define one idle prompt animation.",
  id: "fine-details-prompt-typing",
  targets: [
    fineDetailsPromptTargets.typingEnabled,
    fineDetailsPromptTargets.typingPhrases,
    fineDetailsPromptTargets.typingTypeSpeed,
    fineDetailsPromptTargets.typingDeleteSpeed,
    fineDetailsPromptTargets.typingHold,
    fineDetailsPromptTargets.typingGap,
    fineDetailsPromptTargets.typingHumanize,
    fineDetailsPromptTargets.typingDeleteStyle,
  ],
  title: "Prompt Typing",
};
