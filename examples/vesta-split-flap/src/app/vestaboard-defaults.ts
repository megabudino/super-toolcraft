import type {
  CreativeAppsKitInitialState,
  CreativeAppsKitPersistencePayload,
} from "@/creative-apps-kit/template-runtime";

export const vestaboardDefaultPersistenceVersion = 2;

export const vestaboardDefaultCanvasSize = {
  height: 1080,
  unit: "px",
  width: 1920,
} as const;

export const vestaboardDefaultTimelineState = {
  currentTimeSeconds: 0,
  durationSeconds: 3.5,
  expanded: false,
  isLooping: true,
  isPlaying: true,
} as const satisfies CreativeAppsKitInitialState["timeline"];

const exportTargetPrefix = "export";
const includeBackgroundTarget = `${exportTargetPrefix}.includeBackground`;

export const vestaboardDefaultSettingsValues: Record<string, unknown> = {
  "appearance.background": { hex: "#111214" },
  "board.cell.border": { hex: "#FFFFFF", opacity: 8 },
  "board.cell.bottomHighlightFillCanvas": 100,
  "board.cell.bottomHighlightOpacityRange": [0, 0],
  "board.cell.bottomHighlightSeed": 1,
  "board.cell.fill": { hex: "#FFFFFF" },
  "board.cell.fillOpacityRange": [0, 2],
  "board.cell.fillSeed": 3528,
  "board.cell.radius": 5,
  "board.flip.mode": "random",
  "board.flip.shake": 23,
  "board.flip.trailOpacity": 0,
  "board.flip.wear": 100,
  "board.sound.enabled": true,
  "board.sound.volume": 100,
  "board.text.color": { hex: "#FFFFFF" },
  "board.text.finalHoldSeconds": 0.5,
  "board.text.flashColor1": { hex: "#EDEDED" },
  "board.text.flashColor2": { hex: "#B8B8B8" },
  "board.text.flashColor3": { hex: "#C21437" },
  "board.text.flashColor4": { hex: "#B7FF4A" },
  "board.text.flashColorCount": 0,
  "board.text.flashFrequency": 68,
  "board.text.letterDurationRange": [14, 95],
  "board.text.letterSpeed": 87,
  "board.text.message":
    "When Design feels\neffortless, it is usually thoughtful,\npurposeful,and Smart by nature",
  "board.text.messageTypography": {
    fontId: "inter",
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: "normal",
    lineHeight: "none",
  },
  "board.text.outgoingOpacityRange": [39, 92],
  "board.text.targetMessage": "Design is Smart",
  "board.text.uppercase": true,
  "board.tile.gap": 6,
  "board.tile.height": 66,
  "board.tile.width": 39,
  [includeBackgroundTarget]: true,
  [`${exportTargetPrefix}.video.format`]: "auto",
  [`${exportTargetPrefix}.video.quality`]: "high",
  "field.durationRange": [39, 74],
  "field.fillEnd": 0,
  "field.fillStart": 100,
  "field.opacityRange": [3, 40],
  "field.seed": 137,
  "field.speed": 100,
  "field.typography": {
    fontId: "inter",
    fontSize: 28,
    fontWeight: "400",
    letterSpacing: "normal",
    lineHeight: "none",
  },
};

export function createVestaboardDefaultInitialState(): CreativeAppsKitInitialState {
  return {
    canvas: { size: vestaboardDefaultCanvasSize },
    timeline: { ...vestaboardDefaultTimelineState },
    values: { ...vestaboardDefaultSettingsValues },
  };
}

export function createVestaboardDefaultPersistencePayload(
  version = vestaboardDefaultPersistenceVersion,
): CreativeAppsKitPersistencePayload {
  return {
    state: createVestaboardDefaultInitialState(),
    version,
  };
}
