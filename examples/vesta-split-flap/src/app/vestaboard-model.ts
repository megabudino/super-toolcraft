import type { CreativeAppsKitCanvasSize } from "@/creative-apps-kit/template-runtime";

export const DEFAULT_VESTABOARD_CANVAS_WIDTH = 1200;
export const DEFAULT_VESTABOARD_CANVAS_HEIGHT = 720;
export const DEFAULT_VESTABOARD_TILE_WIDTH = 48;
export const DEFAULT_VESTABOARD_TILE_HEIGHT = 68;
export const DEFAULT_VESTABOARD_TILE_GAP = 8;
export const VESTABOARD_COLUMNS = getAxisCellCount(
  DEFAULT_VESTABOARD_CANVAS_WIDTH,
  DEFAULT_VESTABOARD_TILE_WIDTH,
  DEFAULT_VESTABOARD_TILE_GAP,
);
export const VESTABOARD_ROWS = getAxisCellCount(
  DEFAULT_VESTABOARD_CANVAS_HEIGHT,
  DEFAULT_VESTABOARD_TILE_HEIGHT,
  DEFAULT_VESTABOARD_TILE_GAP,
);
export const VESTABOARD_CELL_COUNT = VESTABOARD_COLUMNS * VESTABOARD_ROWS;

const fillerAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?$&@#%+-*/=:.";
export const VESTABOARD_DRUM_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!?$&@#%+-*/=:.";
const DEFAULT_VESTABOARD_TIMELINE_SECONDS = 6;
const drumFinishSafetyFraction = 0.95;
const drumStartJitterMaxSeconds = 0.12;
const drumRateVarianceFraction = 0.03;
const drumWearPauseRangeSeconds: readonly [number, number] = [0.1, 0.35];
const phraseRemovalDisappearThreshold = 0.45;
const phraseFlashStageEnd = 0.74;
const phraseLayoutStageStart = 0.24;
const phraseRemovalStageEnd = 0.78;
const maxFinalHoldSeconds = 8;
const minPhraseTransformSeconds = 0.1;
const knownFontFamilies: Record<string, string> = {
  geist: "Geist",
  inter: "Inter",
  lato: "Lato",
  montserrat: "Montserrat",
  "open-sans": "Open Sans",
  "playfair-display": "Playfair Display",
  poppins: "Poppins",
  roboto: "Roboto",
  "space-grotesk": "Space Grotesk",
};

export type VestaboardColorOpacity = {
  hex: string;
  opacity: number;
};

export type VestaboardTypography = {
  fontFamily: string;
  fontId: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: "tight" | "tighter" | "normal" | "wide" | "wider" | "widest";
  lineHeight: "loose" | "none" | "normal" | "relaxed" | "snug" | "tight";
};

export type VestaboardFlipMode = "drum" | "random";

export type VestaboardSettings = {
  background: string;
  canvas: CreativeAppsKitCanvasSize;
  cellBottomHighlightFillCanvas: number;
  cellBottomHighlightOpacityRange: readonly [number, number];
  cellBottomHighlightSeed: number;
  cellBorder: VestaboardColorOpacity;
  cellFill: string;
  cellFillOpacityRange: readonly [number, number];
  cellFillSeed: number;
  cellRadius: number;
  fieldDurationRange: readonly [number, number];
  fieldSpeed: number;
  fillEnd: number;
  fillStart: number;
  fieldTypography: VestaboardTypography;
  flipMode: VestaboardFlipMode;
  flipShake: number;
  flipTrailOpacity: number;
  flipWear: number;
  finalHoldSeconds: number;
  letterDurationRange: readonly [number, number];
  letterSpeed: number;
  messageFlashColorCount: number;
  messageFlashColors: readonly string[];
  messageFlashFrequency: number;
  messageTypography: VestaboardTypography;
  message: string;
  opacityRange: readonly [number, number];
  outgoingOpacityRange: readonly [number, number];
  seed: number;
  soundEnabled: boolean;
  soundVolume: number;
  targetMessage: string;
  textColor: string;
  tileGap: number;
  tileHeight: number;
  tileWidth: number;
  uppercase: boolean;
};

export type VestaboardCell = {
  bottomHighlightOpacity: number;
  char: string;
  col: number;
  fillOpacity: number;
  isFlipping: boolean;
  isPhrase: boolean;
  messageFlashColor?: string;
  opacity: number;
  row: number;
  sourceIndex?: number;
  trailChar?: string;
  x: number;
  y: number;
};

export type VestaboardModel = {
  boardHeight: number;
  boardWidth: number;
  cellCount: number;
  cellHeight: number;
  cellRadius: number;
  cellWidth: number;
  cells: VestaboardCell[];
  columns: number;
  fitScale: number;
  flippingCellCount: number;
  rows: number;
  settings: VestaboardSettings;
  shakeX: number;
  shakeY: number;
};

export type VestaboardModelOptions = {
  durationSeconds?: number;
  fieldProgress?: number;
  phraseProgress?: number;
};

export type VestaboardAnimationProgress = {
  effectiveFinalHoldSeconds: number;
  fieldProgress: number;
  phraseEndTimeSeconds: number;
  phraseProgress: number;
};

type ColorValue = {
  hex?: unknown;
};

type ColorOpacityValue = {
  hex?: unknown;
  opacity?: unknown;
};

type VestaboardPhraseCellState = {
  char: string;
  isFlipping?: boolean;
  messageFlashColor?: string;
  opacity?: number;
  sourceIndex?: number;
  trailChar?: string;
};

type FontValue = Partial<{
  fontId: unknown;
  fontSize: unknown;
  fontWeight: unknown;
  letterSpacing: unknown;
  lineHeight: unknown;
}>;

const lineHeightMultipliers = {
  loose: 2,
  none: 1,
  normal: 1.5,
  relaxed: 1.625,
  snug: 1.375,
  tight: 1.25,
} satisfies Record<VestaboardTypography["lineHeight"], number>;

const letterSpacingEm = {
  tight: -0.025,
  tighter: -0.05,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
} satisfies Record<VestaboardTypography["letterSpacing"], number>;

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function getColorHex(value: unknown, fallback: string): string {
  const color = value as ColorValue;
  return typeof color?.hex === "string" && /^#[0-9a-f]{6}$/i.test(color.hex)
    ? color.hex.toUpperCase()
    : fallback;
}

function getColorOpacity(
  value: unknown,
  fallbackHex: string,
  fallbackOpacity: number,
): VestaboardColorOpacity {
  const color = value as ColorOpacityValue;

  return {
    hex: getColorHex(color, fallbackHex),
    opacity: clampNumber(color?.opacity, fallbackOpacity, 0, 100),
  };
}

function getString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export function getVestaboardAnimationProgress({
  durationSeconds,
  finalHoldSeconds,
  hasTargetMessage,
  timeSeconds,
}: {
  durationSeconds: number;
  finalHoldSeconds: number;
  hasTargetMessage: boolean;
  timeSeconds: number;
}): VestaboardAnimationProgress {
  const safeDuration =
    typeof durationSeconds === "number" && Number.isFinite(durationSeconds)
      ? Math.max(0, durationSeconds)
      : 0;

  if (safeDuration <= 0) {
    return {
      effectiveFinalHoldSeconds: 0,
      fieldProgress: 1,
      phraseEndTimeSeconds: 0,
      phraseProgress: 1,
    };
  }

  const safeTime =
    typeof timeSeconds === "number" && Number.isFinite(timeSeconds)
      ? Math.min(safeDuration, Math.max(0, timeSeconds))
      : 0;
  const requestedFinalHold = clampNumber(finalHoldSeconds, 0, 0, maxFinalHoldSeconds);
  const effectiveFinalHoldSeconds = Math.min(
    requestedFinalHold,
    Math.max(0, safeDuration - minPhraseTransformSeconds),
  );
  const phraseEndTimeSeconds = Math.max(
    minPhraseTransformSeconds,
    safeDuration - effectiveFinalHoldSeconds,
  );
  const fieldProgress = Math.min(1, Math.max(0, safeTime / safeDuration));
  const phraseProgress = hasTargetMessage
    ? Math.min(1, Math.max(0, safeTime / phraseEndTimeSeconds))
    : 1;

  return {
    effectiveFinalHoldSeconds,
    fieldProgress,
    phraseEndTimeSeconds,
    phraseProgress,
  };
}

function normalizeOpacityRange(
  value: unknown,
  fallback: readonly [number, number] = [18, 78],
): readonly [number, number] {
  const raw = Array.isArray(value) ? value : fallback;
  const first = clampNumber(raw[0], fallback[0], 0, 100);
  const second = clampNumber(raw[1], fallback[1], 0, 100);
  return first <= second ? [first, second] : [second, first];
}

function resolveTypography(value: unknown): VestaboardTypography {
  const fontValue = (typeof value === "object" && value ? value : {}) as FontValue;
  const fontId = getString(fontValue.fontId, "inter");
  const letterSpacing =
    fontValue.letterSpacing === "tighter" ||
    fontValue.letterSpacing === "tight" ||
    fontValue.letterSpacing === "normal" ||
    fontValue.letterSpacing === "wide" ||
    fontValue.letterSpacing === "wider" ||
    fontValue.letterSpacing === "widest"
      ? fontValue.letterSpacing
      : "normal";
  const lineHeight =
    fontValue.lineHeight === "none" ||
    fontValue.lineHeight === "tight" ||
    fontValue.lineHeight === "snug" ||
    fontValue.lineHeight === "normal" ||
    fontValue.lineHeight === "relaxed" ||
    fontValue.lineHeight === "loose"
      ? fontValue.lineHeight
      : "none";

  return {
    fontFamily: getFontFamilyFromId(fontId),
    fontId,
    fontSize: clampNumber(fontValue.fontSize, 34, 8, 180),
    fontWeight: getString(fontValue.fontWeight, "700"),
    letterSpacing,
    lineHeight,
  };
}

function getFontFamilyFromId(fontId: string): string {
  const normalizedFontId = fontId.trim().toLowerCase();
  const knownFamily = knownFontFamilies[normalizedFontId];

  if (knownFamily) {
    return knownFamily;
  }

  return (
    normalizedFontId
      .split("-")
      .filter(Boolean)
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(" ") || "Inter"
  );
}

function getAxisCellCount(canvasLength: number, targetCellLength: number, gap: number): number {
  return Math.max(1, Math.floor((canvasLength + gap) / Math.max(1, targetCellLength + gap)));
}

function getFilledCellLength(canvasLength: number, cellCount: number, gap: number): number {
  return Math.max(1, (canvasLength - Math.max(0, cellCount - 1) * gap) / cellCount);
}

export function resolveVestaboardSettings(
  values: Record<string, unknown>,
  canvas: CreativeAppsKitCanvasSize,
): VestaboardSettings {
  const legacyFill =
    typeof values["field.fill"] === "number" ? values["field.fill"] : undefined;
  const fallbackFillStart = legacyFill ?? 0;
  const fallbackFillEnd = legacyFill ?? 42;
  const uppercase = values["board.text.uppercase"] === true;
  const applyMessageCase = (message: string): string =>
    uppercase ? message.toUpperCase() : message;

  return {
    background: getColorHex(values["appearance.background"], "#111214"),
    canvas,
    cellBottomHighlightFillCanvas: clampNumber(
      values["board.cell.bottomHighlightFillCanvas"],
      100,
      0,
      100,
    ),
    cellBottomHighlightOpacityRange: normalizeOpacityRange(
      values["board.cell.bottomHighlightOpacityRange"],
      [0, 0],
    ),
    cellBottomHighlightSeed: Math.round(
      clampNumber(values["board.cell.bottomHighlightSeed"], 421, 1, 9999),
    ),
    cellBorder: getColorOpacity(values["board.cell.border"], "#FFFFFF", 28),
    cellFill: getColorHex(values["board.cell.fill"], "#FFFFFF"),
    cellFillOpacityRange: normalizeOpacityRange(values["board.cell.fillOpacityRange"], [0, 0]),
    cellFillSeed: Math.round(clampNumber(values["board.cell.fillSeed"], 313, 1, 9999)),
    cellRadius: clampNumber(values["board.cell.radius"], 0, 0, 80),
    fieldDurationRange: normalizeOpacityRange(values["field.durationRange"], [10, 45]),
    fieldSpeed: clampNumber(values["field.speed"], 55, 1, 100),
    fillEnd: clampNumber(values["field.fillEnd"], fallbackFillEnd, 0, 100),
    fillStart: clampNumber(values["field.fillStart"], fallbackFillStart, 0, 100),
    fieldTypography: resolveTypography(
      values["field.typography"] ?? values["board.text.typography"],
    ),
    flipMode: values["board.flip.mode"] === "drum" ? "drum" : "random",
    flipShake: clampNumber(values["board.flip.shake"], 25, 0, 100),
    flipTrailOpacity: clampNumber(values["board.flip.trailOpacity"], 30, 0, 100),
    flipWear: clampNumber(values["board.flip.wear"], 12, 0, 100),
    finalHoldSeconds: clampNumber(values["board.text.finalHoldSeconds"], 0, 0, maxFinalHoldSeconds),
    letterDurationRange: normalizeOpacityRange(
      values["board.text.letterDurationRange"] ?? values["board.text.cellDurationRange"],
      [14, 32],
    ),
    letterSpeed: clampNumber(values["board.text.letterSpeed"], 55, 1, 100),
    messageFlashColorCount: Math.round(
      clampNumber(values["board.text.flashColorCount"], 0, 0, 4),
    ),
    messageFlashColors: [
      getColorHex(values["board.text.flashColor1"], "#FFCC00"),
      getColorHex(values["board.text.flashColor2"], "#00CCFF"),
      getColorHex(values["board.text.flashColor3"], "#FF5A7A"),
      getColorHex(values["board.text.flashColor4"], "#B7FF4A"),
    ],
    messageFlashFrequency: clampNumber(values["board.text.flashFrequency"], 0, 0, 100),
    messageTypography: resolveTypography(
      values["board.text.messageTypography"] ?? values["board.text.typography"],
    ),
    message: applyMessageCase(getString(values["board.text.message"], "")),
    opacityRange: normalizeOpacityRange(values["field.opacityRange"]),
    outgoingOpacityRange: normalizeOpacityRange(
      values["board.text.outgoingOpacityRange"],
      [35, 100],
    ),
    seed: Math.round(clampNumber(values["field.seed"], 137, 1, 9999)),
    soundEnabled: values["board.sound.enabled"] === true,
    soundVolume: clampNumber(values["board.sound.volume"], 60, 0, 100),
    targetMessage: applyMessageCase(getString(values["board.text.targetMessage"], "")),
    textColor: getColorHex(values["board.text.color"], "#F6E7B7"),
    tileGap: clampNumber(values["board.tile.gap"], DEFAULT_VESTABOARD_TILE_GAP, -1, 30),
    tileHeight: clampNumber(values["board.tile.height"], DEFAULT_VESTABOARD_TILE_HEIGHT, 24, 150),
    tileWidth: clampNumber(values["board.tile.width"], DEFAULT_VESTABOARD_TILE_WIDTH, 18, 120),
    uppercase,
  };
}

function createSeededRandom(seed: number): () => number {
  let state = Math.max(1, Math.trunc(seed)) >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function clampProgress(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 1;
}

function normalizeVestaboardLineBreaks(message: string): string {
  return message.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeVestaboardMessageSpaces(message: string): string {
  return normalizeVestaboardLineBreaks(message)
    .split("\n")
    .map((line) => line.trim().replace(/[ \t]+/g, " "))
    .join("\n");
}

function isVestaboardWhitespace(char: string): boolean {
  return /[ \t\n\r]/.test(char);
}

function doesSourceCharMatchTargetChar(sourceChar: string, targetChar: string): boolean {
  return targetChar === " "
    ? isVestaboardWhitespace(sourceChar)
    : sourceChar === targetChar;
}

function getFlickerBucketCount(speed: number): number {
  const normalizedSpeed = (clampNumber(speed, 55, 1, 100) - 1) / 99;

  return Math.round(4 + normalizedSpeed * 44);
}

function mixVestaboardUint32(value: number): number {
  let mixed = Math.trunc(value) >>> 0;

  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;

  return mixed >>> 0;
}

function getSeededHash({
  index,
  seed,
  salt,
}: {
  index: number;
  seed: number;
  salt: number;
}): number {
  const mixedInput =
    Math.imul(Math.trunc(seed) >>> 0, 0x9e3779b1) ^
    Math.imul((Math.trunc(index) + 1) >>> 0, 0x85ebca6b) ^
    Math.imul((Math.trunc(salt) + 1) >>> 0, 0xc2b2ae35);

  return mixVestaboardUint32(mixedInput);
}

function getDeterministicFlickerChar(
  seed: number,
  index: number,
  progress: number,
  speed = 55,
): string {
  const bucket = Math.floor(progress * getFlickerBucketCount(speed));
  const hash = (seed * 1103515245 + index * 2654435761 + bucket * 97) >>> 0;
  return fillerAlphabet[hash % fillerAlphabet.length] ?? "";
}

function getOrganicDeterministicFlickerChar(
  seed: number,
  index: number,
  progress: number,
  speed = 55,
): string {
  const bucket = Math.floor(progress * getFlickerBucketCount(speed));
  const hash = getSeededHash({ index, salt: 1301 + bucket * 97, seed });
  return fillerAlphabet[hash % fillerAlphabet.length] ?? "";
}

function getDeterministicFlickerTrailChar(
  seed: number,
  index: number,
  progress: number,
  speed = 55,
): string | undefined {
  const bucketCount = getFlickerBucketCount(speed);
  const bucket = Math.floor(progress * bucketCount);

  if (bucket <= 0) {
    return undefined;
  }

  const previousProgress = Math.max(0, (bucket - 0.5) / bucketCount);
  const previousChar = getDeterministicFlickerChar(seed, index, previousProgress, speed);

  return previousChar || undefined;
}

function getOrganicDeterministicFlickerTrailChar(
  seed: number,
  index: number,
  progress: number,
  speed = 55,
): string | undefined {
  const bucketCount = getFlickerBucketCount(speed);
  const bucket = Math.floor(progress * bucketCount);

  if (bucket <= 0) {
    return undefined;
  }

  const previousProgress = Math.max(0, (bucket - 0.5) / bucketCount);
  const previousChar = getOrganicDeterministicFlickerChar(seed, index, previousProgress, speed);

  return previousChar || undefined;
}

type VestaboardDrumSpinFrame = {
  char: string;
  chipColor?: string;
  done: boolean;
  flapsDone: number;
  isFlipping: boolean;
  progress: number;
  trailChar?: string;
};

function getDrumPositionCount(chipColors: readonly string[]): number {
  return VESTABOARD_DRUM_CHARS.length + chipColors.length;
}

function getDrumIndexForChar(char: string): number {
  if (!char) {
    return 0;
  }

  const index = VESTABOARD_DRUM_CHARS.indexOf(char.toUpperCase());

  return index >= 0 ? index : 0;
}

function getDrumPositionDisplay(
  positionIndex: number,
  chipColors: readonly string[],
): { char: string; chipColor?: string } {
  const positionCount = getDrumPositionCount(chipColors);
  const safeIndex = ((positionIndex % positionCount) + positionCount) % positionCount;

  if (safeIndex < VESTABOARD_DRUM_CHARS.length) {
    return { char: VESTABOARD_DRUM_CHARS[safeIndex] ?? " " };
  }

  return { char: "", chipColor: chipColors[safeIndex - VESTABOARD_DRUM_CHARS.length] };
}

export function getVestaboardDrumDistance(
  fromChar: string,
  toChar: string,
  chipColors: readonly string[] = [],
): number {
  const positionCount = getDrumPositionCount(chipColors);
  const fromIndex = getDrumIndexForChar(fromChar);
  const toIndex = getDrumIndexForChar(toChar);

  return (toIndex - fromIndex + positionCount) % positionCount;
}

function getDrumFlapRate(speed: number): number {
  const normalizedSpeed = (clampNumber(speed, 55, 1, 100) - 1) / 99;

  return 3 + normalizedSpeed * 17;
}

function buildDrumSpinFrame({
  distance,
  flapsDone,
  fromChar,
  toChar,
  chipColors,
}: {
  chipColors: readonly string[];
  distance: number;
  flapsDone: number;
  fromChar: string;
  toChar: string;
}): VestaboardDrumSpinFrame {
  if (distance <= 0 || flapsDone >= distance) {
    return {
      char: toChar,
      done: true,
      flapsDone: distance,
      isFlipping: false,
      progress: 1,
    };
  }

  const fromIndex = getDrumIndexForChar(fromChar);
  const current =
    flapsDone <= 0
      ? { char: fromChar }
      : getDrumPositionDisplay(fromIndex + flapsDone, chipColors);
  const previous =
    flapsDone <= 0
      ? undefined
      : flapsDone === 1
        ? { char: fromChar }
        : getDrumPositionDisplay(fromIndex + flapsDone - 1, chipColors);
  const trailChar =
    previous && previous.char && previous.char !== " " ? previous.char : undefined;

  return {
    char: current.char,
    chipColor: "chipColor" in current ? current.chipColor : undefined,
    done: false,
    flapsDone,
    isFlipping: flapsDone > 0,
    progress: distance <= 0 ? 1 : flapsDone / distance,
    trailChar,
  };
}

function getDrumSpinFrame({
  budgetSeconds,
  chipColors,
  elapsedSeconds,
  fromChar,
  index,
  seed,
  speed,
  toChar,
  wearPercent,
}: {
  budgetSeconds: number;
  chipColors: readonly string[];
  elapsedSeconds: number;
  fromChar: string;
  index: number;
  seed: number;
  speed: number;
  toChar: string;
  wearPercent: number;
}): VestaboardDrumSpinFrame {
  const distance = getVestaboardDrumDistance(fromChar, toChar, chipColors);

  if (distance <= 0) {
    return {
      char: toChar,
      done: true,
      flapsDone: 0,
      isFlipping: false,
      progress: 1,
    };
  }

  const jitterSeconds = getSeededRangeValue({
    index,
    range: [0, drumStartJitterMaxSeconds],
    salt: 5323,
    seed,
  });
  const hasWear =
    distance >= 2 &&
    getSeededRangeValue({ index, range: [0, 100], salt: 5501, seed }) < wearPercent;
  const pauseSeconds = hasWear
    ? getSeededRangeValue({ index, range: drumWearPauseRangeSeconds, salt: 5647, seed })
    : 0;
  const stickFlap = hasWear
    ? Math.min(
        distance - 1,
        Math.max(
          1,
          Math.round(
            getSeededRangeValue({ index, range: [0.25, 0.75], salt: 5807, seed }) *
              distance,
          ),
        ),
      )
    : distance;
  const variance = getSeededRangeValue({
    index,
    range: [-drumRateVarianceFraction, drumRateVarianceFraction],
    salt: 5077,
    seed,
  });
  const baseRate = getDrumFlapRate(speed) * (1 + variance);
  const requiredRate =
    distance /
    Math.max(0.05, budgetSeconds * drumFinishSafetyFraction - jitterSeconds - pauseSeconds);
  const rate = Math.max(baseRate, requiredRate);
  const runSeconds = Math.max(0, elapsedSeconds - jitterSeconds);
  const rawFlaps = Math.floor(runSeconds * rate);
  const secondsAfterStick = runSeconds - stickFlap / rate - pauseSeconds;
  const flapsDone = Math.min(
    distance,
    rawFlaps < stickFlap
      ? rawFlaps
      : secondsAfterStick < 0
        ? stickFlap
        : stickFlap + Math.floor(secondsAfterStick * rate),
  );

  return buildDrumSpinFrame({ chipColors, distance, flapsDone, fromChar, toChar });
}

function getDrumProgressSpinFrame({
  chipColors,
  fromChar,
  progress,
  toChar,
}: {
  chipColors: readonly string[];
  fromChar: string;
  progress: number;
  toChar: string;
}): VestaboardDrumSpinFrame {
  const distance = getVestaboardDrumDistance(fromChar, toChar, chipColors);
  const safeProgress = Math.min(1, Math.max(0, progress));
  const flapsDone = safeProgress >= 1 ? distance : Math.floor(safeProgress * distance);

  return buildDrumSpinFrame({ chipColors, distance, flapsDone, fromChar, toChar });
}

function getCellChipColors({
  colorCount,
  colors,
  frequency,
  seed,
  sourceIndex,
}: {
  colorCount: number;
  colors: readonly string[];
  frequency: number;
  seed: number;
  sourceIndex: number;
}): readonly string[] {
  const safeColorCount = Math.min(colors.length, Math.max(0, Math.round(colorCount)));

  if (safeColorCount <= 0 || frequency <= 0) {
    return [];
  }

  const presence = getSeededRangeValue({
    index: sourceIndex,
    range: [0, 100],
    salt: 4111,
    seed: seed + 571,
  });

  return presence <= frequency ? colors.slice(0, safeColorCount) : [];
}

function normalizeAnimatedFrameSpaces(message: string): string {
  return message
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n");
}

type TargetPhrasePlanChar = {
  char: string;
  sourceIndex: number;
};

type TargetPhrasePlan = {
  keepSourceIndices: Set<number>;
  lines: TargetPhrasePlanChar[][];
};

function buildTargetPhrasePlan(source: string, target: string): TargetPhrasePlan {
  const sourceChars = Array.from(normalizeVestaboardLineBreaks(source));
  const lines: TargetPhrasePlanChar[][] = [];
  const keepSourceIndices = new Set<number>();
  let searchStart = 0;

  for (const targetLine of normalizeVestaboardMessageSpaces(target).split("\n")) {
    const lineChars: TargetPhrasePlanChar[] = [];

    for (const targetChar of Array.from(targetLine)) {
      for (let sourceIndex = searchStart; sourceIndex < sourceChars.length; sourceIndex += 1) {
        if (!doesSourceCharMatchTargetChar(sourceChars[sourceIndex] ?? "", targetChar)) {
          continue;
        }

        lineChars.push({ char: targetChar, sourceIndex });
        keepSourceIndices.add(sourceIndex);
        searchStart = sourceIndex + 1;
        break;
      }
    }

    lines.push(lineChars);
  }

  return { keepSourceIndices, lines };
}

function buildLinePreservingMatchedTargetPhrase(source: string, target: string): string {
  const matchedLines = buildTargetPhrasePlan(source, target).lines.map((line) =>
    line.map((char) => char.char).join(""),
  );

  return normalizeAnimatedFrameSpaces(matchedLines.join("\n"));
}

function getRemovedSourceIndices(
  removableSourceIndices: readonly number[],
  removedCount: number,
): Set<number> {
  return new Set(removableSourceIndices.slice(0, removedCount));
}

function buildSourceStagePhrase({
  flickerSourceIndex,
  normalize,
  progress,
  removedSourceIndices,
  seed,
  sourceChars,
}: {
  flickerSourceIndex?: number;
  normalize?: boolean;
  progress: number;
  removedSourceIndices: ReadonlySet<number>;
  seed: number;
  sourceChars: readonly string[];
}): string {
  const stageChars = sourceChars.flatMap((sourceChar, sourceIndex) => {
    if (removedSourceIndices.has(sourceIndex)) {
      return [];
    }

    if (
      flickerSourceIndex === sourceIndex &&
      sourceChar !== "\n" &&
      !/[ \t]/.test(sourceChar)
    ) {
      return [getDeterministicFlickerChar(seed, sourceIndex, progress)];
    }

    return [sourceChar];
  });
  const phrase = stageChars.join("");

  return normalize ? normalizeAnimatedFrameSpaces(phrase) : phrase;
}

function getPhraseRemovalCounts({
  progress,
  removableSourceIndices,
}: {
  progress: number;
  removableSourceIndices: readonly number[];
}): {
  completedCount: number;
  currentRemovalSourceIndex: number | undefined;
  localProgress: number;
} {
  if (removableSourceIndices.length === 0 || progress >= 1) {
    return {
      completedCount: removableSourceIndices.length,
      currentRemovalSourceIndex: undefined,
      localProgress: 1,
    };
  }

  const removalFrame = progress * removableSourceIndices.length;
  const completedCount = Math.min(
    removableSourceIndices.length,
    Math.floor(removalFrame),
  );

  return {
    completedCount,
    currentRemovalSourceIndex: removableSourceIndices[completedCount],
    localProgress: removalFrame - completedCount,
  };
}

export function getVestaboardAnimatedPhrase({
  progress,
  seed,
  source,
  target,
}: {
  progress: number;
  seed: number;
  source: string;
  target: string;
}): string {
  const safeProgress = clampProgress(progress);
  const normalizedTarget = normalizeVestaboardMessageSpaces(target);

  if (!normalizedTarget.trim()) {
    return source;
  }

  if (safeProgress <= 0) {
    return source;
  }

  if (safeProgress >= 1) {
    return buildLinePreservingMatchedTargetPhrase(source, normalizedTarget);
  }

  const sourceChars = Array.from(normalizeVestaboardLineBreaks(source));
  const targetPlan = buildTargetPhrasePlan(source, normalizedTarget);

  if (sourceChars.length === 0) {
    return "";
  }

  const keepSourceIndices = targetPlan.keepSourceIndices;
  const removableSourceIndices = sourceChars
    .map((_char, index) => index)
    .filter((index) => !keepSourceIndices.has(index));
  const removalProgress = Math.min(1, safeProgress / phraseRemovalStageEnd);
  const { completedCount, currentRemovalSourceIndex, localProgress } =
    getPhraseRemovalCounts({
      progress: removalProgress,
      removableSourceIndices,
    });
  const visibleRemovedCount =
    localProgress >= phraseRemovalDisappearThreshold
      ? Math.min(removableSourceIndices.length, completedCount + 1)
      : completedCount;

  return buildSourceStagePhrase({
    flickerSourceIndex:
      localProgress < phraseRemovalDisappearThreshold
        ? currentRemovalSourceIndex
        : undefined,
    normalize: safeProgress >= 1,
    progress: safeProgress,
    removedSourceIndices: getRemovedSourceIndices(
      removableSourceIndices,
      visibleRemovedCount,
    ),
    seed,
    sourceChars,
  });
}

function getWrappedMessageRows(
  message: string,
  columns: number,
  rows: number,
): string[] {
  if (!message.trim()) {
    return [];
  }

  return message
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .flatMap((line) => {
      if (line.length === 0) {
        return [""];
      }

      const lineChars = Array.from(line);
      const chunks: string[] = [];
      for (let index = 0; index < lineChars.length; index += columns) {
        chunks.push(lineChars.slice(index, index + columns).join(""));
      }
      return chunks;
    })
    .slice(0, rows);
}

type WrappedMessageRowSegment = {
  sourceIndices: number[];
  text: string;
};

type TargetBoardPosition = {
  char: string;
  col: number;
  order: number;
  row: number;
  total: number;
};

type LetterRemovalFrame = {
  activeProgress: number;
  state: "pending" | "active" | "removed";
};

function getWrappedMessageRowSegments(
  message: string,
  columns: number,
  rows: number,
): WrappedMessageRowSegment[] {
  const normalizedMessage = normalizeVestaboardLineBreaks(message);

  if (!normalizedMessage.trim()) {
    return [];
  }

  const segments: WrappedMessageRowSegment[] = [];
  let lineChars: { char: string; sourceIndex: number }[] = [];

  const pushLine = (): void => {
    if (lineChars.length === 0) {
      segments.push({ sourceIndices: [], text: "" });
      return;
    }

    for (let index = 0; index < lineChars.length; index += columns) {
      const chunk = lineChars.slice(index, index + columns);
      segments.push({
        sourceIndices: chunk.map(({ sourceIndex }) => sourceIndex),
        text: chunk.map(({ char }) => char).join(""),
      });
    }
  };

  Array.from(normalizedMessage).forEach((char, sourceIndex) => {
    if (char === "\n") {
      pushLine();
      lineChars = [];
      return;
    }

    lineChars.push({ char, sourceIndex });
  });

  pushLine();

  return segments.slice(0, rows);
}

function getTargetBoardPositions(
  plan: TargetPhrasePlan,
  columns: number,
  rows: number,
): Map<number, TargetBoardPosition> {
  const wrappedRows = plan.lines
    .flatMap((line) => {
      if (line.length === 0) {
        return [[]] as TargetPhrasePlanChar[][];
      }

      const chunks: TargetPhrasePlanChar[][] = [];
      for (let index = 0; index < line.length; index += columns) {
        chunks.push(line.slice(index, index + columns));
      }
      return chunks;
    })
    .slice(0, rows);
  const rowOffset = Math.max(0, Math.floor((rows - wrappedRows.length) / 2));
  const positions = new Map<number, TargetBoardPosition>();
  const targetCount = wrappedRows.reduce((count, line) => count + line.length, 0);
  let targetOrder = 0;

  wrappedRows.forEach((line, rowIndex) => {
    const boardRow = rowOffset + rowIndex;
    const colOffset = Math.max(0, Math.floor((columns - line.length) / 2));

    line.forEach((char, colIndex) => {
      const boardCol = colOffset + colIndex;

      if (boardRow >= rows || boardCol >= columns) {
        return;
      }

      positions.set(char.sourceIndex, {
        char: char.char,
        col: boardCol,
        order: targetOrder,
        row: boardRow,
        total: targetCount,
      });
      targetOrder += 1;
    });
  });

  return positions;
}

function buildPhraseCells(message: string, columns: number, rows: number): Map<number, string> {
  const phraseRows = getWrappedMessageRows(message, columns, rows);
  const rowOffset = Math.max(0, Math.floor((rows - phraseRows.length) / 2));
  const phraseCells = new Map<number, string>();

  phraseRows.forEach((rowText, rowIndex) => {
    const boardRow = rowOffset + rowIndex;
    const rowChars = Array.from(rowText);
    const colOffset = Math.max(0, Math.floor((columns - rowChars.length) / 2));

    rowChars.forEach((char, colIndex) => {
      const boardCol = colOffset + colIndex;
      if (boardCol >= columns || boardRow >= rows) {
        return;
      }

      phraseCells.set(boardRow * columns + boardCol, char);
    });
  });

  return phraseCells;
}

function buildPhraseCellStates(
  message: string,
  columns: number,
  rows: number,
): Map<number, VestaboardPhraseCellState> {
  return new Map(
    Array.from(buildPhraseCells(message, columns, rows).entries()).map(([index, char]) => [
      index,
      { char },
    ]),
  );
}

function getLetterDurationFraction({
  durationRange,
  rowIndex,
  seed,
  sourceIndex,
}: {
  durationRange: readonly [number, number];
  rowIndex: number;
  seed: number;
  sourceIndex: number;
}): number {
  const [minDuration, maxDuration] = durationRange;
  const hash =
    (seed * 1103515245 + rowIndex * 2246822519 + sourceIndex * 3266489917) >>> 0;
  const random = hash / 0x100000000;
  const duration = minDuration + random * (maxDuration - minDuration);

  return Math.min(0.95, Math.max(0.05, duration / 100));
}

function getSeededDurationFraction({
  durationRange,
  index,
  seed,
  salt,
}: {
  durationRange: readonly [number, number];
  index: number;
  seed: number;
  salt: number;
}): number {
  const [minDuration, maxDuration] = durationRange;
  const duration = getSeededRangeValue({
    index,
    range: [minDuration, maxDuration],
    salt,
    seed,
  });

  return Math.min(0.95, Math.max(0.05, duration / 100));
}

function getOrganicSeededDurationFraction({
  durationRange,
  index,
  seed,
  salt,
}: {
  durationRange: readonly [number, number];
  index: number;
  seed: number;
  salt: number;
}): number {
  const [minDuration, maxDuration] = durationRange;
  const duration = getOrganicSeededRangeValue({
    index,
    range: [minDuration, maxDuration],
    salt,
    seed,
  });

  return Math.min(0.95, Math.max(0.05, duration / 100));
}

function getLetterLaunchWindow(letterSpeed: number): number {
  const normalizedSpeed = (clampNumber(letterSpeed, 55, 1, 100) - 1) / 99;

  return 0.92 - normalizedSpeed * 0.62;
}

function getSeededRangeValue({
  index,
  range,
  seed,
  salt,
}: {
  index: number;
  range: readonly [number, number];
  seed: number;
  salt: number;
}): number {
  const [minValue, maxValue] = range;
  const hash = (seed * 1103515245 + index * 2654435761 + salt * 374761393) >>> 0;
  const random = hash / 0x100000000;

  return minValue + random * (maxValue - minValue);
}

function getOrganicSeededRangeValue({
  index,
  range,
  seed,
  salt,
}: {
  index: number;
  range: readonly [number, number];
  seed: number;
  salt: number;
}): number {
  const [minValue, maxValue] = range;
  const random = getSeededHash({ index, salt, seed }) / 0x100000000;

  return minValue + random * (maxValue - minValue);
}

function easePhraseLayoutProgress(progress: number): number {
  const rawProgress = Math.min(
    1,
    Math.max(0, (progress - phraseLayoutStageStart) / (1 - phraseLayoutStageStart)),
  );
  return rawProgress * rawProgress * (3 - rawProgress * 2);
}

function getKeptLetterLayoutProgress({
  layoutProgress,
  seed,
  sourceIndex,
  targetPosition,
}: {
  layoutProgress: number;
  seed: number;
  sourceIndex: number;
  targetPosition: TargetBoardPosition;
}): number {
  if (layoutProgress <= 0) {
    return 0;
  }

  if (layoutProgress >= 1) {
    return 1;
  }

  const targetOrderProgress =
    targetPosition.total <= 1 ? 0 : targetPosition.order / (targetPosition.total - 1);
  const jitter = getSeededRangeValue({
    index: sourceIndex,
    range: [-0.03, 0.03],
    salt: 1543,
    seed,
  });
  const start = Math.min(0.34, Math.max(0, targetOrderProgress * 0.28 + jitter));
  const duration = getSeededRangeValue({
    index: sourceIndex,
    range: [0.48, 0.64],
    salt: 1777,
    seed,
  });
  const rawProgress = Math.min(1, Math.max(0, (layoutProgress - start) / duration));

  return rawProgress * rawProgress * (3 - rawProgress * 2);
}

function interpolateCellPosition(start: number, end: number, progress: number): number {
  return Math.round(start + (end - start) * progress);
}

function getLetterRemovalFrame({
  durationRange,
  letterSpeed,
  orderIndex,
  progress,
  removableCount,
  rowIndex,
  seed,
  sourceIndex,
}: {
  durationRange: readonly [number, number];
  letterSpeed: number;
  orderIndex: number;
  progress: number;
  removableCount: number;
  rowIndex: number;
  seed: number;
  sourceIndex: number;
}): LetterRemovalFrame {
  if (removableCount === 0 || progress >= 1) {
    return { activeProgress: 1, state: "removed" };
  }

  const launchWindow = getLetterLaunchWindow(letterSpeed);
  const start =
    removableCount <= 1 ? 0 : (orderIndex / (removableCount - 1)) * launchWindow;
  const duration = Math.min(
    1 - start,
    getLetterDurationFraction({
      durationRange,
      rowIndex,
      seed,
      sourceIndex,
    }),
  );
  const end = start + Math.max(0.02, duration);

  if (progress < start) {
    return { activeProgress: 0, state: "pending" };
  }

  if (progress < end) {
    return {
      activeProgress: Math.min(1, Math.max(0, (progress - start) / (end - start))),
      state: "active",
    };
  }

  return { activeProgress: 1, state: "removed" };
}

function getFieldCellState({
  durationRange,
  fillEnd,
  fillStart,
  index,
  progress,
  seed,
}: {
  durationRange: readonly [number, number];
  fillEnd: number;
  fillStart: number;
  index: number;
  progress: number;
  seed: number;
}): { active: boolean; filled: boolean } {
  const presence = getOrganicSeededRangeValue({
    index,
    range: [0, 100],
    salt: 2711,
    seed,
  });
  const startFilled = presence <= fillStart;
  const endFilled = presence <= fillEnd;

  if (startFilled === endFilled || progress <= 0) {
    return { active: false, filled: startFilled };
  }

  if (progress >= 1) {
    return { active: false, filled: endFilled };
  }

  const duration = getOrganicSeededDurationFraction({
    durationRange,
    index,
    salt: 3011,
    seed,
  });

  if (progress < duration) {
    return { active: true, filled: true };
  }

  return { active: false, filled: endFilled };
}

function getDrumFieldCellFrame({
  durationSeconds,
  fieldSpeed,
  fillEnd,
  fillStart,
  flipWear,
  index,
  progress,
  seed,
}: {
  durationSeconds: number;
  fieldSpeed: number;
  fillEnd: number;
  fillStart: number;
  flipWear: number;
  index: number;
  progress: number;
  seed: number;
}): { char: string; filled: boolean; isFlipping: boolean; trailChar?: string } {
  const presence = getOrganicSeededRangeValue({
    index,
    range: [0, 100],
    salt: 2711,
    seed,
  });
  const startFilled = presence <= fillStart;
  const endFilled = presence <= fillEnd;
  const settledChar = getOrganicDeterministicFlickerChar(seed + 727, index, 0.37);

  if (startFilled === endFilled || progress <= 0) {
    return {
      char: startFilled ? settledChar : "",
      filled: startFilled,
      isFlipping: false,
    };
  }

  if (progress >= 1) {
    return {
      char: endFilled ? settledChar : "",
      filled: endFilled,
      isFlipping: false,
    };
  }

  const spin = getDrumSpinFrame({
    budgetSeconds: durationSeconds,
    chipColors: [],
    elapsedSeconds: progress * durationSeconds,
    fromChar: startFilled ? settledChar : " ",
    index,
    seed,
    speed: fieldSpeed,
    toChar: endFilled ? settledChar : " ",
    wearPercent: flipWear,
  });

  if (spin.done) {
    return {
      char: endFilled ? settledChar : "",
      filled: endFilled,
      isFlipping: false,
    };
  }

  return {
    char: spin.char === " " ? "" : spin.char,
    filled: true,
    isFlipping: spin.isFlipping,
    trailChar: spin.trailChar,
  };
}

function getMessageFlashColor({
  activeProgress,
  colorCount,
  colors,
  frequency,
  sourceIndex,
  seed,
}: {
  activeProgress: number;
  colorCount: number;
  colors: readonly string[];
  frequency: number;
  sourceIndex: number;
  seed: number;
}): string | undefined {
  const safeColorCount = Math.min(colors.length, Math.max(0, Math.round(colorCount)));

  if (safeColorCount <= 0 || frequency <= 0) {
    return undefined;
  }

  const presence = getSeededRangeValue({
    index: sourceIndex,
    range: [0, 100],
    salt: 4111,
    seed,
  });

  if (presence > frequency) {
    return undefined;
  }

  if (safeColorCount === 1) {
    return colors[0];
  }

  const colorValue = getSeededRangeValue({
    index: sourceIndex,
    range: [0, safeColorCount],
    salt: 4339,
    seed,
  });
  const cycleFrames = safeColorCount * 3;
  const cycleOffset = Math.floor(colorValue);
  const cycleFrame = Math.floor(clampProgress(activeProgress) * cycleFrames);
  const colorIndex = (cycleOffset + cycleFrame) % safeColorCount;

  return colors[colorIndex];
}

function getAnimatedLineCells({
  boardRow,
  columns,
  durationRange,
  durationSeconds,
  flashProgress,
  flipMode,
  flipWear,
  keepSourceIndices,
  layoutProgress,
  letterSpeed,
  messageFlashColorCount,
  messageFlashColors,
  messageFlashFrequency,
  outgoingOpacityRange,
  progress,
  rowIndex,
  seed,
  sourceIndices,
  sourceLine,
  targetPositions,
}: {
  boardRow: number;
  columns: number;
  durationRange: readonly [number, number];
  durationSeconds: number;
  flashProgress: number | null;
  flipMode: VestaboardFlipMode;
  flipWear: number;
  keepSourceIndices: ReadonlySet<number>;
  layoutProgress: number;
  letterSpeed: number;
  messageFlashColorCount: number;
  messageFlashColors: readonly string[];
  messageFlashFrequency: number;
  outgoingOpacityRange: readonly [number, number];
  progress: number;
  rowIndex: number;
  seed: number;
  sourceIndices: readonly number[];
  sourceLine: string;
  targetPositions: ReadonlyMap<number, TargetBoardPosition>;
}): Map<number, VestaboardPhraseCellState> {
  const sourceChars = Array.from(sourceLine);

  if (sourceChars.length === 0) {
    return new Map();
  }

  const removableSourceIndices = sourceChars
    .map((_char, index) => index)
    .filter((index) => !keepSourceIndices.has(sourceIndices[index] ?? -1));
  const removalOrderBySourceIndex = new Map(
    removableSourceIndices.map((sourceIndex, orderIndex) => [sourceIndex, orderIndex]),
  );
  const visibleRecords = sourceChars.flatMap((sourceChar, localIndex): {
    char: string;
    isFlipping: boolean;
    messageFlashColor?: string;
    opacity: number;
    sourceIndex: number;
    trailChar?: string;
  }[] => {
    const sourceIndex = sourceIndices[localIndex] ?? -1;
    const targetPosition = targetPositions.get(sourceIndex);

    if (flipMode === "drum") {
      if (targetPosition) {
        return [
          {
            char: targetPosition.char,
            isFlipping: false,
            opacity: 100,
            sourceIndex,
          },
        ];
      }

      const removalBudgetSeconds = durationSeconds * phraseRemovalStageEnd;
      const spin = getDrumSpinFrame({
        budgetSeconds: removalBudgetSeconds,
        chipColors:
          sourceChar === " " || sourceChar === "\n"
            ? []
            : getCellChipColors({
                colorCount: messageFlashColorCount,
                colors: messageFlashColors,
                frequency: messageFlashFrequency,
                seed,
                sourceIndex,
              }),
        elapsedSeconds: Math.min(1, Math.max(0, progress)) * removalBudgetSeconds,
        fromChar: sourceChar,
        index: sourceIndex,
        seed,
        speed: letterSpeed,
        toChar: " ",
        wearPercent: flipWear,
      });

      if (spin.done) {
        return [];
      }

      return [
        {
          char: spin.char,
          isFlipping: spin.isFlipping,
          messageFlashColor: spin.chipColor,
          opacity: spin.isFlipping
            ? getSeededRangeValue({
                index: sourceIndex,
                range: outgoingOpacityRange,
                salt: 911,
                seed,
              })
            : 100,
          sourceIndex,
          trailChar: spin.trailChar,
        },
      ];
    }

    const removalOrderIndex = removalOrderBySourceIndex.get(localIndex);
    const removalFrame =
      removalOrderIndex === undefined
        ? ({ activeProgress: 0, state: "kept" } as const)
        : getLetterRemovalFrame({
            durationRange,
            letterSpeed,
            orderIndex: removalOrderIndex,
            progress,
            removableCount: removableSourceIndices.length,
            rowIndex,
            seed,
            sourceIndex,
          });
    const removalState = removalFrame.state;
    const isRemoving = removalState === "active";
    const canFlash = sourceChar !== " " && sourceChar !== "\n";
    const messageFlashColor = canFlash && flashProgress !== null
      ? getMessageFlashColor({
          activeProgress: targetPosition ? flashProgress : removalFrame.activeProgress,
          colorCount: messageFlashColorCount,
          colors: messageFlashColors,
          frequency: messageFlashFrequency,
          seed: seed + 571,
          sourceIndex,
        })
      : undefined;

    if (removalState === "removed") {
      return [];
    }

    if (targetPosition) {
      return [
        {
          char: targetPosition.char,
          isFlipping: false,
          messageFlashColor:
            targetPosition.char !== " " && flashProgress !== null
              ? messageFlashColor
              : undefined,
          opacity: 100,
          sourceIndex,
        },
      ];
    }

    const isFlickeringRemoval = isRemoving && sourceChar !== " " && sourceChar !== "\n";

    return [
      {
        char: isFlickeringRemoval
          ? getDeterministicFlickerChar(seed, sourceIndex, progress)
          : sourceChar,
        isFlipping: isFlickeringRemoval,
        messageFlashColor: isRemoving ? messageFlashColor : undefined,
        opacity: isRemoving
          ? getSeededRangeValue({
              index: sourceIndex,
              range: outgoingOpacityRange,
              salt: 911,
              seed,
            })
          : 100,
        sourceIndex,
        trailChar: isFlickeringRemoval
          ? getDeterministicFlickerTrailChar(seed, sourceIndex, progress)
          : undefined,
      },
    ];
  });
  const colOffset = Math.max(0, Math.floor((columns - visibleRecords.length) / 2));
  const lineCells = new Map<number, VestaboardPhraseCellState>();

  visibleRecords.forEach((record, visibleIndex) => {
    const sourceCol = colOffset + visibleIndex;
    const targetPosition = targetPositions.get(record.sourceIndex);
    const letterLayoutProgress = targetPosition
      ? getKeptLetterLayoutProgress({
          layoutProgress,
          seed,
          sourceIndex: record.sourceIndex,
          targetPosition,
        })
      : 0;
    const row = targetPosition
      ? interpolateCellPosition(boardRow, targetPosition.row, letterLayoutProgress)
      : boardRow;
    const col = targetPosition
      ? interpolateCellPosition(sourceCol, targetPosition.col, letterLayoutProgress)
      : sourceCol;

    if (row < 0 || col < 0 || col >= columns) {
      return;
    }

    const isMovingKeptLetter =
      targetPosition && letterLayoutProgress > 0 && letterLayoutProgress < 1;
    const isFlickeringMove =
      flipMode === "random" && isMovingKeptLetter && record.char !== " ";

    lineCells.set(row * columns + col, {
      char: isFlickeringMove
        ? getDeterministicFlickerChar(seed + 17, record.sourceIndex, layoutProgress)
        : record.char,
      isFlipping: record.isFlipping || Boolean(isFlickeringMove),
      messageFlashColor: record.messageFlashColor,
      opacity: record.opacity,
      sourceIndex: record.sourceIndex,
      trailChar: isFlickeringMove
        ? getDeterministicFlickerTrailChar(seed + 17, record.sourceIndex, layoutProgress)
        : record.trailChar,
    });
  });

  return lineCells;
}

function getAnimatedPhraseCells({
  columns,
  durationSeconds,
  flipMode,
  flipWear,
  letterDurationRange,
  letterSpeed,
  messageFlashColorCount,
  messageFlashColors,
  messageFlashFrequency,
  outgoingOpacityRange,
  progress,
  rows,
  seed,
  source,
  target,
}: {
  columns: number;
  durationSeconds: number;
  flipMode: VestaboardFlipMode;
  flipWear: number;
  letterDurationRange: readonly [number, number];
  letterSpeed: number;
  messageFlashColorCount: number;
  messageFlashColors: readonly string[];
  messageFlashFrequency: number;
  outgoingOpacityRange: readonly [number, number];
  progress: number;
  rows: number;
  seed: number;
  source: string;
  target: string;
}): Map<number, VestaboardPhraseCellState> {
  const safeProgress = clampProgress(progress);
  const normalizedTarget = normalizeVestaboardMessageSpaces(target);

  if (!normalizedTarget.trim()) {
    return buildPhraseCellStates(source, columns, rows);
  }

  if (safeProgress <= 0) {
    return buildPhraseCellStates(source, columns, rows);
  }

  if (safeProgress >= 1) {
    return buildPhraseCellStates(
      getVestaboardAnimatedPhrase({
        progress: 1,
        seed,
        source,
        target,
      }),
      columns,
      rows,
    );
  }

  const sourceRows = getWrappedMessageRowSegments(source, columns, rows);

  if (sourceRows.length === 0) {
    return new Map();
  }

  const targetPlan = buildTargetPhrasePlan(source, normalizedTarget);
  const keepSourceIndices = targetPlan.keepSourceIndices;
  const targetPositions = getTargetBoardPositions(targetPlan, columns, rows);
  const removalProgress = Math.min(1, safeProgress / phraseRemovalStageEnd);
  const flashProgress =
    safeProgress > 0 && safeProgress < phraseFlashStageEnd
      ? safeProgress / phraseFlashStageEnd
      : null;
  const layoutProgress = easePhraseLayoutProgress(safeProgress);
  const rowOffset = Math.max(0, Math.floor((rows - sourceRows.length) / 2));
  const phraseCells = new Map<number, VestaboardPhraseCellState>();

  sourceRows.forEach((sourceRow, rowIndex) => {
    const boardRow = rowOffset + rowIndex;

    if (boardRow >= rows) {
      return;
    }

    for (const [cellIndex, char] of getAnimatedLineCells({
      boardRow,
      columns,
      durationRange: letterDurationRange,
      durationSeconds,
      flashProgress,
      flipMode,
      flipWear,
      keepSourceIndices,
      layoutProgress,
      letterSpeed,
      messageFlashColorCount,
      messageFlashColors,
      messageFlashFrequency,
      outgoingOpacityRange,
      progress: removalProgress,
      rowIndex,
      seed,
      sourceIndices: sourceRow.sourceIndices,
      sourceLine: sourceRow.text,
      targetPositions,
    })) {
      phraseCells.set(cellIndex, char);
    }
  });

  return phraseCells;
}

export function buildVestaboardModel(
  settings: VestaboardSettings,
  options: VestaboardModelOptions = {},
): VestaboardModel {
  const columns = getAxisCellCount(settings.canvas.width, settings.tileWidth, settings.tileGap);
  const rows = getAxisCellCount(settings.canvas.height, settings.tileHeight, settings.tileGap);
  const cellWidth = getFilledCellLength(settings.canvas.width, columns, settings.tileGap);
  const cellHeight = getFilledCellLength(settings.canvas.height, rows, settings.tileGap);
  const boardWidth = settings.canvas.width;
  const boardHeight = settings.canvas.height;
  const cellRadius = Math.min(settings.cellRadius, cellWidth / 2, cellHeight / 2);
  const fieldProgress = clampProgress(options.fieldProgress);
  const durationSeconds = Math.max(
    0.1,
    typeof options.durationSeconds === "number" && Number.isFinite(options.durationSeconds)
      ? options.durationSeconds
      : DEFAULT_VESTABOARD_TIMELINE_SECONDS,
  );
  const isDrumMode = settings.flipMode === "drum";
  const phraseCells = getAnimatedPhraseCells({
    columns,
    durationSeconds,
    flipMode: settings.flipMode,
    flipWear: settings.flipWear,
    letterDurationRange: settings.letterDurationRange,
    letterSpeed: settings.letterSpeed,
    messageFlashColorCount: settings.messageFlashColorCount,
    messageFlashColors: settings.messageFlashColors,
    messageFlashFrequency: settings.messageFlashFrequency,
    outgoingOpacityRange: settings.outgoingOpacityRange,
    progress: clampProgress(options.phraseProgress),
    rows,
    seed: settings.seed,
    source: settings.message,
    target: settings.targetMessage,
  });
  const fillRandom = createSeededRandom(settings.cellFillSeed);
  const bottomHighlightRandom = createSeededRandom(settings.cellBottomHighlightSeed);
  const bottomHighlightPresenceRandom = createSeededRandom(
    settings.cellBottomHighlightSeed + 7919,
  );
  const [minOpacity, maxOpacity] = settings.opacityRange;
  const [minFillOpacity, maxFillOpacity] = settings.cellFillOpacityRange;
  const [minBottomHighlightOpacity, maxBottomHighlightOpacity] =
    settings.cellBottomHighlightOpacityRange;
  const cells: VestaboardCell[] = [];
  let flippingCellCount = 0;
  let phraseFlippingCellCount = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const index = row * columns + col;
      const phraseCell = phraseCells.get(index);
      const isPhrase = phraseCell !== undefined;
      const fieldFrame = isDrumMode
        ? getDrumFieldCellFrame({
            durationSeconds,
            fieldSpeed: settings.fieldSpeed,
            fillEnd: settings.fillEnd,
            fillStart: settings.fillStart,
            flipWear: settings.flipWear,
            index,
            progress: fieldProgress,
            seed: settings.seed,
          })
        : undefined;
      const fieldCell = fieldFrame
        ? { active: fieldFrame.isFlipping, filled: fieldFrame.filled }
        : getFieldCellState({
            durationRange: settings.fieldDurationRange,
            fillEnd: settings.fillEnd,
            fillStart: settings.fillStart,
            index,
            progress: fieldProgress,
            seed: settings.seed,
          });
      const shouldFill = isPhrase || fieldCell.filled;
      const fillerChar = fieldFrame
        ? fieldFrame.char
        : fieldCell.filled
          ? fieldCell.active
            ? getOrganicDeterministicFlickerChar(
                settings.seed + 701,
                index,
                fieldProgress,
                settings.fieldSpeed,
              )
            : getOrganicDeterministicFlickerChar(settings.seed + 727, index, 0.37)
          : "";
      const fieldTrailChar = fieldFrame
        ? fieldFrame.trailChar
        : fieldCell.filled && fieldCell.active
          ? getOrganicDeterministicFlickerTrailChar(
              settings.seed + 701,
              index,
              fieldProgress,
              settings.fieldSpeed,
            )
          : undefined;
      const fieldIsFlipping = fieldFrame
        ? fieldFrame.isFlipping
        : fieldCell.filled && fieldCell.active;
      const isFlipping = isPhrase
        ? phraseCell?.isFlipping === true
        : fieldIsFlipping;
      const trailChar = isPhrase ? phraseCell?.trailChar : fieldTrailChar;
      const opacity =
        isPhrase || !shouldFill
          ? phraseCell?.opacity ?? 100
          : getOrganicSeededRangeValue({
              index,
              range: [minOpacity, maxOpacity],
              salt: 3467,
              seed: settings.seed,
            });
      const fillOpacity =
        minFillOpacity + fillRandom() * (maxFillOpacity - minFillOpacity);
      const seededBottomHighlightOpacity =
        minBottomHighlightOpacity +
        bottomHighlightRandom() * (maxBottomHighlightOpacity - minBottomHighlightOpacity);
      const shouldShowBottomHighlight =
        bottomHighlightPresenceRandom() * 100 < settings.cellBottomHighlightFillCanvas;
      const bottomHighlightOpacity = shouldShowBottomHighlight
        ? seededBottomHighlightOpacity
        : 0;

      if (isFlipping) {
        flippingCellCount += 1;

        if (isPhrase) {
          phraseFlippingCellCount += 1;
        }
      }

      cells.push({
        bottomHighlightOpacity,
        char: isPhrase ? (phraseCell?.char ?? "") : fillerChar,
        col,
        fillOpacity,
        isFlipping,
        isPhrase,
        messageFlashColor: phraseCell?.messageFlashColor,
        opacity,
        row,
        sourceIndex: phraseCell?.sourceIndex,
        trailChar,
        x: col * (cellWidth + settings.tileGap),
        y: row * (cellHeight + settings.tileGap),
      });
    }
  }

  const shakeAmplitude =
    (clampNumber(settings.flipShake, 25, 0, 100) / 100) *
    1.1 *
    Math.min(1, phraseFlippingCellCount / 18);
  const shakeBucket = Math.floor(fieldProgress * durationSeconds * 47);
  const shakeX =
    shakeAmplitude <= 0
      ? 0
      : getSeededRangeValue({
          index: shakeBucket,
          range: [-shakeAmplitude, shakeAmplitude],
          salt: 9001,
          seed: settings.seed,
        });
  const shakeY =
    shakeAmplitude <= 0
      ? 0
      : getSeededRangeValue({
          index: shakeBucket,
          range: [-shakeAmplitude, shakeAmplitude],
          salt: 9203,
          seed: settings.seed,
        });

  return {
    boardHeight,
    boardWidth,
    cellCount: columns * rows,
    cellHeight,
    cellRadius,
    cellWidth,
    cells,
    columns,
    fitScale: 1,
    flippingCellCount,
    rows,
    settings,
    shakeX,
    shakeY,
  };
}

export function getVestaboardFontFamily(typography: VestaboardTypography): string {
  return `"${typography.fontFamily}", "Inter Variable", ui-sans-serif, system-ui, sans-serif`;
}

export function getVestaboardLetterSpacing(typography: VestaboardTypography): string {
  return `${letterSpacingEm[typography.letterSpacing]}em`;
}

export function getVestaboardLineHeightPx(typography: VestaboardTypography): number {
  return typography.fontSize * lineHeightMultipliers[typography.lineHeight];
}

export function getVestaboardTrailAlpha(
  settings: VestaboardSettings,
  cell: VestaboardCell,
): number {
  if (!cell.trailChar || settings.flipTrailOpacity <= 0) {
    return 0;
  }

  return (settings.flipTrailOpacity / 100) * (cell.opacity / 100) * 0.55;
}

export function getVestaboardRgbaColor(color: VestaboardColorOpacity): string {
  return getVestaboardRgbaColorFromParts(color.hex, color.opacity);
}

export function getVestaboardRgbaColorFromParts(hex: string, opacity: number): string {
  const clampedOpacity = Math.min(100, Math.max(0, opacity));
  const [red, green, blue] = hexToRgb(hex);
  return `rgba(${red}, ${green}, ${blue}, ${clampedOpacity / 100})`;
}

function hexToRgb(hex: string): readonly [number, number, number] {
  const normalized = /^#([0-9a-f]{6})$/i.exec(hex)?.[1] ?? "FFFFFF";
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

export function drawVestaboardToCanvas(
  context: CanvasRenderingContext2D,
  model: VestaboardModel,
  options: { offsetX?: number; offsetY?: number } = {},
): void {
  const { settings } = model;
  const offsetX = (options.offsetX ?? 0) + model.shakeX;
  const offsetY = (options.offsetY ?? 0) + model.shakeY;

  context.save();
  context.translate(offsetX, offsetY);
  context.textAlign = "center";
  context.textBaseline = "middle";

  const letterSpacingContext = context as CanvasRenderingContext2D & {
    letterSpacing?: string;
  };

  for (const cell of model.cells) {
    context.fillStyle = cell.messageFlashColor
      ? cell.messageFlashColor
      : getVestaboardRgbaColorFromParts(settings.cellFill, cell.fillOpacity);
    drawRoundedRect(
      context,
      cell.x,
      cell.y,
      model.cellWidth,
      model.cellHeight,
      model.cellRadius,
    );
    context.fill();

    if (settings.cellBorder.opacity > 0) {
      const borderInset = 0.5;
      context.strokeStyle = getVestaboardRgbaColor(settings.cellBorder);
      context.lineWidth = 1;
      drawRoundedRect(
        context,
        cell.x + borderInset,
        cell.y + borderInset,
        Math.max(0, model.cellWidth - borderInset * 2),
        Math.max(0, model.cellHeight - borderInset * 2),
        Math.max(0, model.cellRadius - borderInset),
      );
      context.stroke();
    }

    if (cell.bottomHighlightOpacity > 0) {
      const lineInset = Math.min(1, Math.max(0, model.cellRadius / 6));
      context.strokeStyle = getVestaboardRgbaColorFromParts(
        settings.cellBorder.hex,
        cell.bottomHighlightOpacity,
      );
      context.lineCap = model.cellRadius > 0 ? "round" : "butt";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(cell.x + lineInset, cell.y + model.cellHeight - 0.5);
      context.lineTo(cell.x + model.cellWidth - lineInset, cell.y + model.cellHeight - 0.5);
      context.stroke();
      context.lineCap = "butt";
    }

  }

  const drawCellText = (cell: VestaboardCell): void => {
    const trailAlpha = getVestaboardTrailAlpha(settings, cell);
    const hasMainChar = Boolean(cell.char) && cell.char !== " ";

    if (!hasMainChar && trailAlpha <= 0) {
      return;
    }

    context.save();
    const typography = cell.isPhrase ? settings.messageTypography : settings.fieldTypography;
    context.font = `${typography.fontWeight} ${typography.fontSize}px ${getVestaboardFontFamily(typography)}`;
    letterSpacingContext.letterSpacing = getVestaboardLetterSpacing(typography);

    drawRoundedRect(
      context,
      cell.x,
      cell.y,
      model.cellWidth,
      model.cellHeight,
      model.cellRadius,
    );
    context.clip();

    context.fillStyle = settings.textColor;

    if (trailAlpha > 0 && cell.trailChar) {
      context.globalAlpha = trailAlpha;
      context.fillText(
        cell.trailChar,
        cell.x + model.cellWidth / 2,
        cell.y + model.cellHeight / 2,
      );
    }

    if (hasMainChar) {
      context.globalAlpha = cell.opacity / 100;
      context.fillText(
        cell.char,
        cell.x + model.cellWidth / 2,
        cell.y + model.cellHeight / 2,
      );
    }

    context.restore();
  };

  for (const cell of model.cells) {
    if (!cell.isPhrase) {
      drawCellText(cell);
    }
  }

  for (const cell of model.cells) {
    if (cell.isPhrase) {
      drawCellText(cell);
    }
  }

  context.restore();
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}
